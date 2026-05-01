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
import { defineSecret } from "firebase-functions/params";
import axios from "axios";
import { sendSMS, buildSMSMessage } from "./services/hubtel.service";
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
  fullName: string;
  phoneNumber: string;
  idType: "GHANA_CARD" | "VOTERS_ID" | "PASSPORT";
  idNumber: string;
  dateOfBirth: string;
  gender: "Male" | "Female";
  region: string;
  districtMunicipality: string;
  residentialTown: string;
  vehicleCategory: string;
  plateNumber: string;
  chassisNumber: string;
  driversLicenseNumber: string;
  licenseExpiryDate: string;
  nextOfKinName: string;
  nextOfKinContact: string;
  passportPhotoUrl?: string | null;
  qrCodeUrl?: string | null; 
  paymentReference?: string | null;
  paymentTxnId?: string | null;
  paymentStatus?: string | null;
  paymentAmount?: number | null;
}

const PERMIT_VALIDITY_MONTHS = 6;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function checkDuplicates(input: RegisterRiderInput): Promise<void> {
  const ridersRef = db.collection("riders");

  const checks: Promise<admin.firestore.QuerySnapshot>[] = [
    ridersRef.where("idNumber", "==", input.idNumber.trim()).limit(1).get(),
  ];

  // Only check plate/chassis if they were actually provided
  if (input.plateNumber?.trim()) {
    checks.push(
      ridersRef
        .where("plateNumber", "==", input.plateNumber.trim().toUpperCase())
        .limit(1)
        .get(),
    );
  }

  if (input.chassisNumber?.trim()) {
    checks.push(
      ridersRef
        .where("chassisNumber", "==", input.chassisNumber.trim().toUpperCase())
        .limit(1)
        .get(),
    );
  }

  const [byId, byPlate, byChassis] = await Promise.all(checks);

  if (!byId.empty) {
    throw new HttpsError(
      "already-exists",
      `ID number ${input.idNumber} is already registered under RIN ${byId.docs[0].data().RIN}.`,
    );
  }
  if (byPlate && !byPlate.empty) {
    throw new HttpsError(
      "already-exists",
      `Plate number ${input.plateNumber} is already registered under RIN ${byPlate.docs[0].data().RIN}.`,
    );
  }
  if (byChassis && !byChassis.empty) {
    throw new HttpsError(
      "already-exists",
      `Chassis number ${input.chassisNumber} is already registered under RIN ${byChassis.docs[0].data().RIN}.`,
    );
  }
}

// ─── registerRider ────────────────────────────────────────────────────────────
export const registerRider = onCall(
  {
    region: "europe-west2",
    timeoutSeconds: 30,
    memory: "256MiB",
    enforceAppCheck: false,
  },
  async (req) => {

    // 1. Auth guard
if (!req.auth)
  throw new HttpsError("unauthenticated", "You must be signed in.");

const uid = req.auth.uid;
const input = req.data as RegisterRiderInput;
const isAnonymous = req.auth.token?.firebase?.sign_in_provider === "anonymous";

// 2. Load caller profile — skip for anonymous (pre-registration)
let role: Role = "Operator";
let entity = "";

if (!isAnonymous) {
  const profileSnap = await db.doc(`admin_users/${uid}`).get();
  if (!profileSnap.exists)
    throw new HttpsError("permission-denied", "User profile not found.");

  const profile = profileSnap.data() as {
    role: Role;
    entity?: string;
    status?: string;
  };

  if (profile.status && profile.status !== "Active") {
    throw new HttpsError("permission-denied", "Your account is not active.");
  }

  role = profile.role;
  entity = profile.entity ?? "";

  if (!["Super Admin", "District Admin", "Operator"].includes(role)) {
    throw new HttpsError("permission-denied", "Insufficient permissions.");
  }
}

    // 3. Validate inputs
    const region = (input.region ?? "").trim();
    const district = (input.districtMunicipality ?? "").trim();
    const town = (input.residentialTown ?? "").trim();
    const category = (input.vehicleCategory ?? "").trim();

    if (!region || !district || !town || !category) {
      throw new HttpsError(
        "invalid-argument",
        "region, districtMunicipality, residentialTown, and vehicleCategory are required.",
      );
    }
    if (!input.idNumber?.trim())
      throw new HttpsError("invalid-argument", "idNumber is required.");
    // if (!input.plateNumber?.trim())
    //   throw new HttpsError("invalid-argument", "plateNumber is required.");
    // if (!input.chassisNumber?.trim())
    //   throw new HttpsError("invalid-argument", "chassisNumber is required.");

    // ── District locking:
    //   District Admin → locked to their entity
    //   Super Admin + Operator → use form value freely
    const effectiveDistrict = role === "District Admin" ? entity : district;

    if (!effectiveDistrict) {
      throw new HttpsError(
        "invalid-argument",
        "districtMunicipality is required.",
      );
    }

    // 4. Resolve codes
    const regionCode = REGION_CODES[region];
    if (!regionCode) {
      throw new HttpsError(
        "invalid-argument",
        `Unknown region: "${region}". Valid: ${Object.keys(REGION_CODES).join(", ")}`,
      );
    }

    const districtCode = DISTRICT_CODES[effectiveDistrict];
    if (!districtCode) {
      throw new HttpsError(
        "invalid-argument",
        `Unknown district: "${effectiveDistrict}". Check rin-constants.ts for the full list.`,
      );
    }

    const vehicleCode = CATEGORY_CODES[category];
    if (!vehicleCode) {
      throw new HttpsError(
        "invalid-argument",
        `Unknown vehicle category: "${category}". Valid: ${Object.keys(CATEGORY_CODES).join(", ")}`,
      );
    }

    
    // Step 5. Duplicate check
    await checkDuplicates({
      ...input,
      idNumber: input.idNumber.trim(),
      plateNumber: input.plateNumber?.trim().toUpperCase() ?? "",
      chassisNumber: input.chassisNumber?.trim().toUpperCase() ?? "",
    });

    // 6. Atomic transaction — per-district counter
    const now = new Date();
    const issueDate = now.toISOString();
    const expiryDate = addMonths(now, PERMIT_VALIDITY_MONTHS).toISOString();

    const result = await db.runTransaction(async (tx) => {
      // Counter scoped to district only e.g. rin_counters/KR
      const counterRef = db.doc(getCounterPath(districtCode));
      const counterSnap = await tx.get(counterRef);
      const nextSeq = counterSnap.exists
        ? Number(counterSnap.data()?.next ?? COUNTER_START)
        : COUNTER_START;

      // Build RIN: GAP-0001-KR0326
      const RIN = composeRIN(
        regionCode,
        vehicleCode,
        nextSeq,
        districtCode,
        now,
      );
      const riderRef = db.collection("riders").doc();

      tx.set(riderRef, {
        // Bio
        fullName: (input.fullName ?? "").trim(),
        phoneNumber: (input.phoneNumber ?? "").trim(),
        idType: input.idType ?? null,
        idNumber: input.idNumber.trim(),
        dateOfBirth: input.dateOfBirth ?? "",
        gender: input.gender ?? null,
        // Location
        region,
        districtMunicipality: effectiveDistrict,
        residentialTown: town,
        // Vehicle
        vehicleCategory: category,
        plateNumber: input.plateNumber.trim().toUpperCase(),
        chassisNumber: input.chassisNumber.trim().toUpperCase(),
        // Compliance
        driversLicenseNumber: (input.driversLicenseNumber ?? "").toUpperCase(),
        licenseExpiryDate: input.licenseExpiryDate ?? "",
        nextOfKinName: (input.nextOfKinName ?? "").trim(),
        nextOfKinContact: (input.nextOfKinContact ?? "").trim(),
        // Photo
        passportPhotoUrl: input.passportPhotoUrl ?? null,

        // QR Code
        qrCodeUrl: input.qrCodeUrl ?? null,
        // RIN metadata
        RIN,
        RINPrefix: `${regionCode}${vehicleCode}`,
        sequence: nextSeq,
        regionCode,
        districtCode,
        vehicleCode,
        // Dates & status
        issueDate,
        expiryDate,
        status: "Pending",
        // Audit
        createdBy: uid ?? "pre-registration",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentReference: input.paymentReference ?? null,
        paymentTxnId: input.paymentTxnId ?? null,
        paymentStatus: input.paymentStatus ?? null,
        paymentAmount: input.paymentAmount ?? null,
      });

      // Increment district counter
      tx.set(
        counterRef,
        {
          next: nextSeq + 1,
          district: effectiveDistrict,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // Audit log
      const auditRef = db.collection("audit_logs").doc();
      tx.set(auditRef, {
        type: "REGISTER",
        action: `Registered new rider: ${input.fullName ?? "Unknown"}`,
        target: input.fullName ?? "Unknown",
        targetId: riderRef.id,
        adminUid: uid,
        adminRole: role,
        district: effectiveDistrict,
        RIN,
        status: "success",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { RIN, riderId: riderRef.id };
    });

    return result;
  },
);

// ─── uploadRiderFiles ─────────────────────────────────────────────────────────
export const uploadRiderFiles = onCall(
  {
    region: "europe-west2",
    timeoutSeconds: 60,
    memory: "512MiB",
    enforceAppCheck: false,
  },
  async (req) => {
    const { base64Photo, base64QR, idNumber, RIN, riderId } = req.data as {
      base64Photo?: string;
      base64QR?: string;
      idNumber: string;
      RIN: string;
      riderId: string;
    };

    const bucket = admin.storage().bucket();
    const result: { photoUrl?: string; qrCodeUrl?: string } = {};

    if (base64Photo) {
      const safeId = idNumber.replace(/[^a-zA-Z0-9]/g, "_");
      const photoFile = bucket.file(`riders/photos/${safeId}_${Date.now()}.jpg`);
      await photoFile.save(
        Buffer.from(base64Photo.replace(/^data:image\/\w+;base64,/, ""), "base64"),
        { contentType: "image/jpeg" }
      );
      await photoFile.makePublic();
      result.photoUrl = `https://storage.googleapis.com/${bucket.name}/${photoFile.name}`;
    }

    if (base64QR) {
      const qrFile = bucket.file(`riders/qrcodes/${riderId}_${RIN}.png`);
      await qrFile.save(
        Buffer.from(base64QR.replace(/^data:image\/\w+;base64,/, ""), "base64"),
        { contentType: "image/png" }
      );
      await qrFile.makePublic();
      result.qrCodeUrl = `https://storage.googleapis.com/${bucket.name}/${qrFile.name}`;
    }

    return result;
  }
);

// ─── updateRiderStatus ────────────────────────────────────────────────────────
export const updateRiderStatus = onCall(
  { region: "europe-west2", timeoutSeconds: 15, memory: "256MiB" },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Not signed in.");

    const uid = req.auth.uid;
    const { riderId, status } = req.data as {
      riderId: string;
      status: "Pending" | "Active" | "Expired" | "Suspended";
    };

    if (
      !riderId ||
      !["Pending", "Active", "Expired", "Suspended"].includes(status)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "riderId and valid status are required.",
      );
    }

    const profileSnap = await db.doc(`admin_users/${uid}`).get();
    if (!profileSnap.exists)
      throw new HttpsError("permission-denied", "Profile not found.");

    const profile = profileSnap.data() as {
      role: Role;
      entity?: string;
      status?: string;
    };

    if (profile.status && profile.status !== "Active") {
      throw new HttpsError("permission-denied", "Account is not active.");
    }
    if (!["Super Admin", "District Admin"].includes(profile.role)) {
      throw new HttpsError(
        "permission-denied",
        "Operators cannot change rider status.",
      );
    }

    const riderRef = db.doc(`riders/${riderId}`);
    const riderSnap = await riderRef.get();
    if (!riderSnap.exists)
      throw new HttpsError("not-found", "Rider not found.");

    const rider = riderSnap.data() as any;
    const previousStatus = rider.status;

    if (
      profile.role === "District Admin" &&
      rider.districtMunicipality !== profile.entity
    ) {
      throw new HttpsError(
        "permission-denied",
        "You can only manage riders in your district.",
      );
    }

    await db.runTransaction(async (tx) => {
      tx.update(riderRef, {
        status,
        ...(status === "Active" && previousStatus === "Pending"
          ? { issueDate: new Date().toISOString() }
          : {}),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const auditRef = db.collection("audit_logs").doc();
      tx.set(auditRef, {
        type: "STATUS_CHANGE",
        action: `Status changed from ${previousStatus} to ${status}`,
        target: rider.fullName ?? "Unknown",
        targetId: riderId,
        adminUid: uid,
        adminRole: profile.role,
        district: rider.districtMunicipality,
        status: "success",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { success: true, riderId, newStatus: status };
  },
);

// ─── Paystack MoMo ────────────────────────────────────────────────────────────

const PAYSTACK_SECRET_KEY = defineSecret("PAYSTACK_SECRET_KEY");

const NETWORK_MAP: Record<string, string> = {
  MTN: "mtn",
  VODAFONE: "vod",
  AIRTELTIGO: "tgo",
};

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return `+233${cleaned.slice(1)}`;
  return `+233${cleaned}`;
}

export const initiateMomoCharge = onCall(
  {
    region: "europe-west2",
    secrets: [PAYSTACK_SECRET_KEY],
    cors: true,
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (request) => {
    const secretKey = PAYSTACK_SECRET_KEY.value();
    if (!secretKey) {
      throw new HttpsError("internal", "Payment service is not configured.");
    }

    const { phone, network, preRegId, riderName, email, amountGHS } =
      request.data as {
        phone: string;
        network: string;
        preRegId: string;
        riderName: string;
        email: string;
        amountGHS: number;
      };

    if (!phone || !network || !email) {
      throw new HttpsError(
        "invalid-argument",
        "phone, network, and email are required.",
      );
    }

    const paystackNetwork = NETWORK_MAP[network];
    if (!paystackNetwork) {
      throw new HttpsError(
        "invalid-argument",
        `Unsupported network: ${network}`,
      );
    }

    const amountPesewas = Math.round(amountGHS * 100);
    const reference = `RIN-${preRegId}-${Date.now()}`;

    try {
      const response = await axios.post(
        "https://api.paystack.co/charge",
        {
          email,
          amount: amountPesewas,
          currency: "GHS",
          reference,
          mobile_money: {
            phone: normalizePhone(phone),
            provider: paystackNetwork,
          },
          metadata: { preRegId, riderName, phone, network },
        },
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = response.data;

      // "pay_offline" or "charge_attempted" means MoMo prompt was sent — this is SUCCESS
      const successStatuses = [
        "pay_offline",
        "charge_attempted",
        "pending",
        "success",
      ];

      if (!successStatuses.includes(result.data?.status)) {
        throw new HttpsError(
          "internal",
          result.data?.message || "Failed to initiate payment.",
        );
      }

      await db.collection("payments").doc(reference).set({
        reference,
        preRegId,
        riderName,
        phone,
        email,
        network,
        amountGHS,
        amountPesewas,
        status: "pending",
        paystackStatus: result.data?.status,
        initiatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        reference,
        status: result.data?.status,
        displayText: result.data?.display_text || null,
      };
    } catch (error: any) {
      console.error(
        "Paystack charge error:",
        error?.response?.data || error.message,
      );
      throw new HttpsError(
        "internal",
        error?.response?.data?.message || "Failed to initiate payment.",
      );
    }
  },
);

export const checkMomoStatus = onCall(
  {
    region: "europe-west2",
    secrets: [PAYSTACK_SECRET_KEY],
    cors: true,
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (request) => {
    const secretKey = PAYSTACK_SECRET_KEY.value();
    if (!secretKey) {
      throw new HttpsError("internal", "Payment service is not configured.");
    }

    const { reference } = request.data as { reference: string };
    if (!reference) {
      throw new HttpsError("invalid-argument", "reference is required.");
    }

    try {
      const response = await axios.get(
        `https://api.paystack.co/charge/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );

      const chargeData = response.data.data;
      const paystackStatus: string = chargeData.status;
      const transactionId: string = chargeData.id?.toString() || "";

      const paymentRef = db.collection("payments").doc(reference);
      const paymentDoc = await paymentRef.get();

      if (!paymentDoc.exists) {
        return { status: "pending", transactionId: "", reference };
      }

      const paymentData = paymentDoc.data()!;

      if (paymentData.status !== "success" && paystackStatus === "success") {
        await paymentRef.update({
          status: "success",
          paystackStatus,
          transactionId,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        if (paymentData.phone) {
          await sendSMS({
            to: paymentData.phone,
            message: buildSMSMessage("payment_confirmed", {
              riderName: paymentData.riderName,
              reference,
              amount: `GHS ${paymentData.amountGHS}`,
            }),
          });
          await sendSMS({
            to: paymentData.phone,
            message: buildSMSMessage("application_confirmation", {
              riderName: paymentData.riderName,
              reference: paymentData.preRegId,
            }),
          });
        }
      } else if (paystackStatus === "failed") {
        await paymentRef.update({
          status: "failed",
          paystackStatus,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return {
        status:
          paystackStatus === "success"
            ? "success"
            : paystackStatus === "failed"
              ? "failed"
              : "pending",
        transactionId,
        reference,
      };
    } catch (error: any) {
      console.error(
        "Paystack status check error:",
        error?.response?.data || error.message,
      );
      return { status: "pending", transactionId: "", reference };
    }
  },
);

// ─── updateRiderQR ────────────────────────────────────────────────────────────
export const updateRiderQR = onCall(
  {
    region: "europe-west2",
    timeoutSeconds: 15,
    memory: "256MiB",
    enforceAppCheck: false,
  },
  async (req) => {
    const { riderId, qrCodeUrl } = req.data as {
      riderId: string;
      qrCodeUrl: string;
    };

    if (!riderId || !qrCodeUrl) {
      throw new HttpsError("invalid-argument", "riderId and qrCodeUrl are required.");
    }

    await db.doc(`riders/${riderId}`).update({
      qrCodeUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);
