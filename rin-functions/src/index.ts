/**
 * functions/src/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cloud Function: registerRider
 *
 * RIN FORMAT:  [RegionCode][VehicleCode]-[Sequence]-[DistrictCode][MMYY]
 * EXAMPLE:     GAP-0001-KR0326
 *
 * Counter logic: per district only (24 counters max)
 * District locking: District Admin only — Super Admin + Operator pick freely
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  REGION_CODES,
  DISTRICT_CODES,
  CATEGORY_CODES,
  composeRIN,
  getCounterPath,
  COUNTER_START,
} from "./rin-constants";

admin.initializeApp();
const db = admin.firestore();

type Role = "Super Admin" | "District Admin" | "Operator";

interface RegisterRiderInput {
  fullName:             string;
  phoneNumber:          string;
  idType:               "GHANA_CARD" | "VOTERS_ID" | "PASSPORT";
  idNumber:             string;
  dateOfBirth:          string;
  gender:               "Male" | "Female";
  region:               string;
  districtMunicipality: string;
  residentialTown:      string;
  vehicleCategory:      string;
  plateNumber:          string;
  chassisNumber:        string;
  driversLicenseNumber: string;
  licenseExpiryDate:    string;
  nextOfKinName:        string;
  nextOfKinContact:     string;
  passportPhotoUrl?:    string | null;
}

const PERMIT_VALIDITY_MONTHS = 6;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function checkDuplicates(input: RegisterRiderInput): Promise<void> {
  const ridersRef = db.collection("riders");
  const [byId, byPlate, byChassis] = await Promise.all([
    ridersRef.where("idNumber",     "==", input.idNumber.trim()).limit(1).get(),
    ridersRef.where("plateNumber",  "==", input.plateNumber.trim().toUpperCase()).limit(1).get(),
    ridersRef.where("chassisNumber","==", input.chassisNumber.trim().toUpperCase()).limit(1).get(),
  ]);

  if (!byId.empty) {
    throw new HttpsError("already-exists",
      `ID number ${input.idNumber} is already registered under RIN ${byId.docs[0].data().RIN}.`);
  }
  if (!byPlate.empty) {
    throw new HttpsError("already-exists",
      `Plate number ${input.plateNumber} is already registered under RIN ${byPlate.docs[0].data().RIN}.`);
  }
  if (!byChassis.empty) {
    throw new HttpsError("already-exists",
      `Chassis number ${input.chassisNumber} is already registered under RIN ${byChassis.docs[0].data().RIN}.`);
  }
}

// ─── registerRider ────────────────────────────────────────────────────────────
export const registerRider = onCall(
  {
    region:           "europe-west2",
    timeoutSeconds:   30,
    memory:           "256MiB",
    enforceAppCheck:  false,
  },
  async (req) => {
    // 1. Auth guard
    if (!req.auth) throw new HttpsError("unauthenticated", "You must be signed in.");

    const uid   = req.auth.uid;
    const input = req.data as RegisterRiderInput;

    // 2. Load caller profile
    const profileSnap = await db.doc(`admin_users/${uid}`).get();
    if (!profileSnap.exists) throw new HttpsError("permission-denied", "User profile not found.");

    const profile = profileSnap.data() as { role: Role; entity?: string; status?: string };

    if (profile.status && profile.status !== "Active") {
      throw new HttpsError("permission-denied", "Your account is not active.");
    }

    const role   = profile.role;
    const entity = profile.entity ?? "";

    if (!["Super Admin", "District Admin", "Operator"].includes(role)) {
      throw new HttpsError("permission-denied", "Insufficient permissions.");
    }

    // 3. Validate inputs
    const region   = (input.region               ?? "").trim();
    const district = (input.districtMunicipality ?? "").trim();
    const town     = (input.residentialTown      ?? "").trim();
    const category = (input.vehicleCategory      ?? "").trim();

    if (!region || !district || !town || !category) {
      throw new HttpsError("invalid-argument",
        "region, districtMunicipality, residentialTown, and vehicleCategory are required.");
    }
    if (!input.idNumber?.trim())      throw new HttpsError("invalid-argument", "idNumber is required.");
    if (!input.plateNumber?.trim())   throw new HttpsError("invalid-argument", "plateNumber is required.");
    if (!input.chassisNumber?.trim()) throw new HttpsError("invalid-argument", "chassisNumber is required.");

    // ── District locking:
    //   District Admin → locked to their entity
    //   Super Admin + Operator → use form value freely
    const effectiveDistrict = role === "District Admin" ? entity : district;

    if (!effectiveDistrict) {
      throw new HttpsError("invalid-argument", "districtMunicipality is required.");
    }

    // 4. Resolve codes
    const regionCode = REGION_CODES[region];
    if (!regionCode) {
      throw new HttpsError("invalid-argument",
        `Unknown region: "${region}". Valid: ${Object.keys(REGION_CODES).join(", ")}`);
    }

    const districtCode = DISTRICT_CODES[effectiveDistrict];
    if (!districtCode) {
      throw new HttpsError("invalid-argument",
        `Unknown district: "${effectiveDistrict}". Check rin-constants.ts for the full list.`);
    }

    const vehicleCode = CATEGORY_CODES[category];
    if (!vehicleCode) {
      throw new HttpsError("invalid-argument",
        `Unknown vehicle category: "${category}". Valid: ${Object.keys(CATEGORY_CODES).join(", ")}`);
    }

    // 5. Duplicate check
    await checkDuplicates({
      ...input,
      idNumber:      input.idNumber.trim(),
      plateNumber:   input.plateNumber.trim().toUpperCase(),
      chassisNumber: input.chassisNumber.trim().toUpperCase(),
    });

    // 6. Atomic transaction — per-district counter
    const now        = new Date();
    const issueDate  = now.toISOString();
    const expiryDate = addMonths(now, PERMIT_VALIDITY_MONTHS).toISOString();

    const result = await db.runTransaction(async (tx) => {
      // Counter scoped to district only e.g. rin_counters/KR
      const counterRef  = db.doc(getCounterPath(districtCode));
      const counterSnap = await tx.get(counterRef);
      const nextSeq     = counterSnap.exists
        ? Number(counterSnap.data()?.next ?? COUNTER_START)
        : COUNTER_START;

      // Build RIN: GAP-0001-KR0326
      const RIN      = composeRIN(regionCode, vehicleCode, nextSeq, districtCode, now);
      const riderRef = db.collection("riders").doc();

      tx.set(riderRef, {
        // Bio
        fullName:             (input.fullName    ?? "").trim(),
        phoneNumber:          (input.phoneNumber ?? "").trim(),
        idType:               input.idType       ?? null,
        idNumber:             input.idNumber.trim(),
        dateOfBirth:          input.dateOfBirth  ?? "",
        gender:               input.gender       ?? null,
        // Location
        region,
        districtMunicipality: effectiveDistrict,
        residentialTown:      town,
        // Vehicle
        vehicleCategory:      category,
        plateNumber:          input.plateNumber.trim().toUpperCase(),
        chassisNumber:        input.chassisNumber.trim().toUpperCase(),
        // Compliance
        driversLicenseNumber: (input.driversLicenseNumber ?? "").toUpperCase(),
        licenseExpiryDate:    input.licenseExpiryDate ?? "",
        nextOfKinName:        (input.nextOfKinName    ?? "").trim(),
        nextOfKinContact:     (input.nextOfKinContact ?? "").trim(),
        // Photo
        passportPhotoUrl:     input.passportPhotoUrl ?? null,
        // RIN metadata
        RIN,
        RINPrefix:    `${regionCode}${vehicleCode}`,
        sequence:     nextSeq,
        regionCode,
        districtCode,
        vehicleCode,
        // Dates & status
        issueDate,
        expiryDate,
        status: "Pending",
        // Audit
        createdBy: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Increment district counter
      tx.set(counterRef, {
        next:      nextSeq + 1,
        district:  effectiveDistrict,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Audit log
      const auditRef = db.collection("audit_logs").doc();
      tx.set(auditRef, {
        type:      "REGISTER",
        action:    `Registered new rider: ${input.fullName ?? "Unknown"}`,
        target:    input.fullName ?? "Unknown",
        targetId:  riderRef.id,
        adminUid:  uid,
        adminRole: role,
        district:  effectiveDistrict,
        RIN,
        status:    "success",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { RIN, riderId: riderRef.id };
    });

    return result;
  },
);

// ─── updateRiderStatus ────────────────────────────────────────────────────────
export const updateRiderStatus = onCall(
  { region: "europe-west2", timeoutSeconds: 15, memory: "256MiB" },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Not signed in.");

    const uid = req.auth.uid;
    const { riderId, status } = req.data as {
      riderId: string;
      status:  "Pending" | "Active" | "Expired" | "Suspended";
    };

    if (!riderId || !["Pending", "Active", "Expired", "Suspended"].includes(status)) {
      throw new HttpsError("invalid-argument", "riderId and valid status are required.");
    }

    const profileSnap = await db.doc(`admin_users/${uid}`).get();
    if (!profileSnap.exists) throw new HttpsError("permission-denied", "Profile not found.");

    const profile = profileSnap.data() as { role: Role; entity?: string; status?: string };

    if (profile.status && profile.status !== "Active") {
      throw new HttpsError("permission-denied", "Account is not active.");
    }
    if (!["Super Admin", "District Admin"].includes(profile.role)) {
      throw new HttpsError("permission-denied", "Operators cannot change rider status.");
    }

    const riderRef  = db.doc(`riders/${riderId}`);
    const riderSnap = await riderRef.get();
    if (!riderSnap.exists) throw new HttpsError("not-found", "Rider not found.");

    const rider          = riderSnap.data() as any;
    const previousStatus = rider.status;

    if (profile.role === "District Admin" && rider.districtMunicipality !== profile.entity) {
      throw new HttpsError("permission-denied", "You can only manage riders in your district.");
    }

    await db.runTransaction(async (tx) => {
      tx.update(riderRef, {
        status,
        ...(status === "Active" && previousStatus === "Pending"
          ? { issueDate: new Date().toISOString() } : {}),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const auditRef = db.collection("audit_logs").doc();
      tx.set(auditRef, {
        type:      "STATUS_CHANGE",
        action:    `Status changed from ${previousStatus} to ${status}`,
        target:    rider.fullName ?? "Unknown",
        targetId:  riderId,
        adminUid:  uid,
        adminRole: profile.role,
        district:  rider.districtMunicipality,
        status:    "success",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { success: true, riderId, newStatus: status };
  },
);