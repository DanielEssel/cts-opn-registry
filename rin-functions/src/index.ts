/**
 * functions/src/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cloud Function: registerRider
 *
 * Why server-side?
 *   • Atomic Firestore transactions prevent duplicate sequence numbers
 *     even under concurrent registrations (race-condition proof).
 *   • Duplicate checks (ID, plate, chassis) run before any write.
 *   • Role enforcement can't be spoofed from the client.
 *   • RIN is NEVER generated on the client — only returned as a result.
 *
 * RIN FORMAT:  [RegionCode]-[Sequence]-[TownCode][MMYY]
 * EXAMPLE:     ASH-0001-TM0226
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

// ─── INIT ─────────────────────────────────────────────────────────────────────
admin.initializeApp();
const db = admin.firestore();

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Role = "Super Admin" | "District Admin" | "Operator";

interface RegisterRiderInput {
  // Bio
  fullName:          string;
  phoneNumber:       string;
  idType:            "GHANA_CARD" | "VOTERS_ID" | "PASSPORT";
  idNumber:          string;
  dateOfBirth:       string;
  gender:            "Male" | "Female";
  // Location
  region:            string;
  districtMunicipality: string;
  residentialTown:   string;
  // Vehicle
  vehicleCategory:   string;
  plateNumber:       string;
  chassisNumber:     string;
  // Compliance
  driversLicenseNumber: string;
  licenseExpiryDate: string;
  nextOfKinName:     string;
  nextOfKinContact:  string;
  // Photo (already uploaded from client; pass download URL)
  passportPhotoUrl?: string | null;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PERMIT_VALIDITY_MONTHS = 6;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Pre-transaction duplicate check.
 * Throws HttpsError("already-exists", …) if any unique field is taken.
 *
 * Fields enforced as unique across the ENTIRE system:
 *   - idNumber       (one registration per person)
 *   - plateNumber    (one registration per vehicle)
 *   - chassisNumber  (physical vehicle identity)
 *   - phoneNumber    (warn, but allow — some people share phones)
 */
async function checkDuplicates(input: RegisterRiderInput): Promise<void> {
  const ridersRef = db.collection("riders");

  const [byId, byPlate, byChassis] = await Promise.all([
    ridersRef.where("idNumber",     "==", input.idNumber.trim()).limit(1).get(),
    ridersRef.where("plateNumber",  "==", input.plateNumber.trim().toUpperCase()).limit(1).get(),
    ridersRef.where("chassisNumber","==", input.chassisNumber.trim().toUpperCase()).limit(1).get(),
  ]);

  if (!byId.empty) {
    const existing = byId.docs[0].data();
    throw new HttpsError(
      "already-exists",
      `ID number ${input.idNumber} is already registered under RIN ${existing.RIN}.`
    );
  }

  if (!byPlate.empty) {
    const existing = byPlate.docs[0].data();
    throw new HttpsError(
      "already-exists",
      `Plate number ${input.plateNumber} is already registered under RIN ${existing.RIN}.`
    );
  }

  if (!byChassis.empty) {
    const existing = byChassis.docs[0].data();
    throw new HttpsError(
      "already-exists",
      `Chassis number ${input.chassisNumber} is already registered under RIN ${existing.RIN}.`
    );
  }
}

// ─── MAIN CLOUD FUNCTION ──────────────────────────────────────────────────────
export const registerRider = onCall(
  {
    region:         "europe-west2",   // change to closest region to your users
    timeoutSeconds: 30,
    memory:         "256MiB",
    enforceAppCheck: false,           // set true when you enable App Check
  },
  async (req) => {
    // ── 1. Authentication guard ──────────────────────────────────────────────
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const uid   = req.auth.uid;
    const input = req.data as RegisterRiderInput;

    // ── 2. Load caller profile ───────────────────────────────────────────────
    const profileSnap = await db.doc(`admin_users/${uid}`).get();

    if (!profileSnap.exists) {
      throw new HttpsError("permission-denied", "User profile not found.");
    }

    const profile = profileSnap.data() as {
      role:    Role;
      entity?: string;       // district/municipality assigned to this user
      status?: string;
    };

    if (profile.status && profile.status !== "Active") {
      throw new HttpsError(
        "permission-denied",
        "Your account is not active. Contact your administrator."
      );
    }

    const role   = profile.role;
    const entity = profile.entity ?? "";

    // Only Super Admin, District Admin, and Operator may register riders
    const allowedRoles: Role[] = ["Super Admin", "District Admin", "Operator"];
    if (!allowedRoles.includes(role)) {
      throw new HttpsError("permission-denied", "Insufficient permissions.");
    }

    // ── 3. Validate & sanitise input ─────────────────────────────────────────
    const region    = (input.region ?? "").trim();
    const district  = (input.districtMunicipality ?? "").trim();
    const town      = (input.residentialTown ?? "").trim();
    const category  = (input.vehicleCategory ?? "").trim();

    if (!region || !district || !town || !category) {
      throw new HttpsError(
        "invalid-argument",
        "region, districtMunicipality, residentialTown, and vehicleCategory are required."
      );
    }

    if (!input.idNumber?.trim()) {
      throw new HttpsError("invalid-argument", "idNumber is required.");
    }
    if (!input.plateNumber?.trim()) {
      throw new HttpsError("invalid-argument", "plateNumber is required.");
    }
    if (!input.chassisNumber?.trim()) {
      throw new HttpsError("invalid-argument", "chassisNumber is required.");
    }

    // Operators are locked to their entity district
    const effectiveDistrict = role === "Operator" ? entity : district;

    if (!effectiveDistrict) {
      throw new HttpsError(
        "invalid-argument",
        "districtMunicipality is required."
      );
    }

    // ── 4. Resolve codes ─────────────────────────────────────────────────────────
    const regionCode = REGION_CODES[region];
    if (!regionCode) {
      throw new HttpsError(
        "invalid-argument",
        `Unknown region: "${region}". Check rin-constants.ts for the full list.`
      );
    }

    // District code — derive from constants; fall back to first 2 letters
    const districtCode =
      DISTRICT_CODES[effectiveDistrict] ??
      effectiveDistrict.replace(/\s+/g, "").substring(0, 2).toUpperCase();

    // Vehicle code — must exist in CATEGORY_CODES
    const vehicleCode = CATEGORY_CODES[category];
    if (!vehicleCode) {
      throw new HttpsError(
        "invalid-argument",
        `Unknown vehicle category: "${category}". Check rin-constants.ts for the full list.`
      );
    }

    // ── 5. Pre-transaction duplicate check ───────────────────────────────────
    await checkDuplicates({
      ...input,
      idNumber:      input.idNumber.trim(),
      plateNumber:   input.plateNumber.trim().toUpperCase(),
      chassisNumber: input.chassisNumber.trim().toUpperCase(),
    });

    // ── 6. Atomic transaction: increment counter → build RIN → write rider ───
    const now = new Date();
    const issueDate  = now.toISOString();
    const expiryDate = addMonths(now, PERMIT_VALIDITY_MONTHS).toISOString();

    const result = await db.runTransaction(async (tx) => {
      // --- Read counter (scoped per district + vehicle type) ---
      const counterRef  = db.doc(getCounterPath(districtCode, vehicleCode));
      const counterSnap = await tx.get(counterRef);
      const nextSeq     = counterSnap.exists
        ? Number(counterSnap.data()?.next ?? COUNTER_START)
        : COUNTER_START;

      // --- Build RIN: GAT-0001-AM0226 ---
      const RIN = composeRIN(regionCode, vehicleCode, nextSeq, districtCode, now);
      // --- Rider document ---
      const riderRef = db.collection("riders").doc();

      tx.set(riderRef, {
        // Bio
        fullName:     (input.fullName ?? "").trim(),
        phoneNumber:  (input.phoneNumber ?? "").trim(),
        idType:       input.idType ?? null,
        idNumber:     input.idNumber.trim(),
        dateOfBirth:  input.dateOfBirth ?? "",
        gender:       input.gender ?? null,

        // Location
        region,
        districtMunicipality: effectiveDistrict,
        residentialTown:      town,
        town,

        // Vehicle
        vehicleCategory: category,
        plateNumber:     input.plateNumber.trim().toUpperCase(),
        chassisNumber:   input.chassisNumber.trim().toUpperCase(),

        // Compliance
        driversLicenseNumber: (input.driversLicenseNumber ?? "").toUpperCase(),
        licenseExpiryDate:    input.licenseExpiryDate ?? "",
        nextOfKinName:        (input.nextOfKinName ?? "").trim(),
        nextOfKinContact:     (input.nextOfKinContact ?? "").trim(),

        // Photo
        passportPhotoUrl: input.passportPhotoUrl ?? null,

        // RIN metadata — stored for easy filtering / auditing
        RIN,
        RINPrefix:    regionCode,
        sequence:     nextSeq,
        regionCode,
        districtCode,
        

        // Dates & status
        issueDate,
        expiryDate,
        status: "Pending",

        // Audit
        createdBy:  uid,
        createdAt:  admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:  admin.firestore.FieldValue.serverTimestamp(),
      });

      // --- Increment counter (merge keeps any extra fields) ---
      tx.set(
        counterRef,
        {
          next:      nextSeq + 1,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // --- Audit log (inside transaction so it's atomic) ---
      const auditRef = db.collection("audit_logs").doc();
      tx.set(auditRef, {
        type:      "REGISTER",
        action:    `Registered new rider: ${input.fullName ?? "Unknown"}`,
        target:    input.fullName ?? "Unknown",
        targetId:  riderRef.id,
        adminUid:  uid,
        adminRole: role,
        district:  effectiveDistrict,
        status:    "success",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { RIN, riderId: riderRef.id };
    });

    return result;
  }
);

// ─── UPDATE RIDER STATUS ──────────────────────────────────────────────────────
/**
 * Callable: updateRiderStatus
 * Allowed roles: Super Admin (any district), District Admin (own district only).
 */
export const updateRiderStatus = onCall(
  { region: "europe-west2", timeoutSeconds: 15, memory: "256MiB" },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Not signed in.");

    const uid     = req.auth.uid;
    const { riderId, status } = req.data as {
      riderId: string;
      status:  "Pending" | "Active" | "Expired" | "Suspended";
    };

    const validStatuses = ["Pending", "Active", "Expired", "Suspended"];
    if (!riderId || !validStatuses.includes(status)) {
      throw new HttpsError("invalid-argument", "riderId and valid status are required.");
    }

    // Load caller profile
    const profileSnap = await db.doc(`admin_users/${uid}`).get();
    if (!profileSnap.exists) throw new HttpsError("permission-denied", "Profile not found.");

    const profile = profileSnap.data() as { role: Role; entity?: string; status?: string };

    if (profile.status && profile.status !== "Active") {
      throw new HttpsError("permission-denied", "Account is not active.");
    }

    if (!["Super Admin", "District Admin"].includes(profile.role)) {
      throw new HttpsError("permission-denied", "Operators cannot change rider status.");
    }

    // Load rider
    const riderRef  = db.doc(`riders/${riderId}`);
    const riderSnap = await riderRef.get();
    if (!riderSnap.exists) throw new HttpsError("not-found", "Rider not found.");

    const rider = riderSnap.data() as any;

    // District Admin can only update their own district's riders
    if (
      profile.role === "District Admin" &&
      rider.districtMunicipality !== profile.entity
    ) {
      throw new HttpsError(
        "permission-denied",
        "You can only manage riders in your district."
      );
    }

    const previousStatus = rider.status;

    await db.runTransaction(async (tx) => {
      tx.update(riderRef, {
        status,
        // If activating for the first time, stamp the issue date
        ...(status === "Active" && previousStatus === "Pending"
          ? { issueDate: new Date().toISOString() }
          : {}),
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
  }
);