import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v2/https";

admin.initializeApp();

type Role = "Super Admin" | "District Admin" | "Operator";

const REGION_CODES: Record<string, string> = {
  "Greater Accra": "GR",
  "Ashant Region":"AR",
  "Central Region": "CR"
};

const PERMIT_MONTHS_VALID = 6;

function mmYY(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return { mm, yy };
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export const registerRider = functions.onCall(
  {
    region: "europe-west1", // choose closest to users (or omit to use default)
    timeoutSeconds: 20,
    memory: "256MiB",
  },
  async (req) => {
    if (!req.auth) {
      throw new functions.HttpsError("unauthenticated", "You must be logged in.");
    }

    const uid = req.auth.uid;
    const input = req.data as any;

    // 1) Load profile
    const profileSnap = await admin.firestore().doc(`admin_users/${uid}`).get();
    if (!profileSnap.exists) {
      throw new functions.HttpsError("permission-denied", "Profile not found.");
    }

    const profile = profileSnap.data() as any;
    const role = profile.role as Role;
    const entity = profile.entity as string | undefined;

    if (profile?.status && profile.status !== "Active") {
      throw new functions.HttpsError("permission-denied", "Account is not active.");
    }

    // 2) Basic input checks (you can add more)
    const region = String(input.region || "");
    const vehicleCategory = String(input.vehicleCategory || "");
    const residentialTown = String(input.residentialTown || "");
    const districtFromClient = String(input.districtMunicipality || "");

    if (!region || !vehicleCategory) {
      throw new functions.HttpsError("invalid-argument", "Missing region or vehicleCategory.");
    }

    // Operators must be restricted to their entity
    const effectiveDistrict =
      role === "Operator" ? (entity ?? "") : districtFromClient;

    if (!effectiveDistrict) {
      throw new functions.HttpsError("invalid-argument", "Missing districtMunicipality.");
    }

    // 3) Resolve codes
    const regionCode = REGION_CODES[region];
    const districtCode = String(input.districtCode || ""); // optional; we will compute if you pass mapping to function later
    const vehicleCode = String(input.vehicleCode || "");   // optional

    // To avoid duplicating code tables on server, you have two options:
    // A) Send codes from client (recommended initially) AND validate format
    // B) Recreate DISTRICT_CODES/CATEGORY_CODES in functions (more robust)

    // Minimal validation: codes must be expected length
    const safeRegionCode = regionCode;
    const safeDistrictCode = input.districtCode ?? "";
    const safeVehicleCode = input.vehicleCode ?? "";

    if (!safeRegionCode) {
      throw new functions.HttpsError("invalid-argument", "Unknown region.");
    }
    if (typeof safeDistrictCode !== "string" || safeDistrictCode.length < 2 || safeDistrictCode.length > 4) {
      throw new functions.HttpsError("invalid-argument", "Invalid districtCode.");
    }
    if (typeof safeVehicleCode !== "string" || safeVehicleCode.length !== 1) {
      throw new functions.HttpsError("invalid-argument", "Invalid vehicleCode.");
    }

    // Scope: region + district + vehicle
    const RINPrefix = `${safeRegionCode}${safeVehicleCode}`; // GRQ
    const scopeKey = `${safeRegionCode}-${safeDistrictCode}-${safeVehicleCode}`; // GR-AM-Q

    const now = new Date();
    const { mm, yy } = mmYY(now);

    // 4) Transaction: increment counter + create rider doc
    const db = admin.firestore();

    const res = await db.runTransaction(async (tx) => {
      const counterRef = db.doc(`RIN_counters/${scopeKey}`);
      const counterSnap = await tx.get(counterRef);
      const next = counterSnap.exists ? Number(counterSnap.data()?.next || 1) : 1;

      const sequence4 = String(next).padStart(4, "0");
      const RIN = `${RINPrefix}-${sequence4}-${safeDistrictCode}${mm}${yy}`;

      const riderRef = db.collection("riders").doc();

      const issueDate = now.toISOString();
      const expiryDate = addMonths(now, PERMIT_MONTHS_VALID).toISOString();

      tx.set(riderRef, {
        // copy only fields you allow
        fullName: input.fullName ?? "",
        phoneNumber: input.phoneNumber ?? "",
        idType: input.idType ?? null,
        idNumber: input.idNumber ?? "",
        dateOfBirth: input.dateOfBirth ?? "",
        gender: input.gender ?? null,

        region,
        districtMunicipality: effectiveDistrict,
        residentialTown,
        town: residentialTown,

        vehicleCategory,

        plateNumber: (input.plateNumber ?? "").toString().toUpperCase(),
        chassisNumber: (input.chassisNumber ?? "").toString().toUpperCase(),

        driversLicenseNumber: (input.driversLicenseNumber ?? "").toString().toUpperCase(),
        licenseExpiryDate: input.licenseExpiryDate ?? "",
        nextOfKinName: input.nextOfKinName ?? "",
        nextOfKinContact: input.nextOfKinContact ?? "",

        passportPhotoUrl: input.passportPhotoUrl ?? null,

        // RIN fields
        RIN,
        RINPrefix,
        sequence: next,
        regionCode: safeRegionCode,
        districtCode: safeDistrictCode,
        vehicleCode: safeVehicleCode,
        sequenceScopeKey: scopeKey,

        status: "Pending",
        createdBy: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),

        issueDate,
        expiryDate,
      });

      tx.set(counterRef, {
        next: next + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Optional audit (safe, but costs an extra write)
      const auditRef = db.collection("audit_logs").doc();
      tx.set(auditRef, {
        type: "REGISTER",
        admin: uid,
        action: `Registered new rider: ${input.fullName ?? "Unknown"}`,
        target: input.fullName ?? "Unknown",
        targetId: riderRef.id,
        status: "success",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { RIN, riderId: riderRef.id };
    });

    return res;
  }
);