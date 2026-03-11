/**
 * lib/rider-service.ts
 * Flow: upload photo → call registerRider CF → generate QR → save QR URL back to rider doc
 */

import { db, auth, functions, storage } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { RiderRegistrationData } from "@/app/lib/validations";
import { isValidRIN } from "./rin-constants";
import QRCode from "qrcode";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface RiderRecord extends Omit<
  RiderRegistrationData,
  "passportPhoto"
> {
  id?: string;
  RIN: string;
  RINPrefix: string;
  sequence: number;
  regionCode: string;
  districtCode: string;
  vehicleCode: string;
  issueDate: string;
  expiryDate: string;
  passportPhotoUrl?: string | null;
  qrCodeUrl?: string | null;
  status: "Pending" | "Active" | "Expired" | "Suspended";
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface RiderLookupResult {
  found: boolean;
  rider?: RiderRecord & { id: string };
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  RIN: string;
  riderId: string;
  qrCodeUrl: string;
  error?: string;
}

interface RegisterRiderPayload {
  fullName: string;
  phoneNumber: string;
  idType: string;
  idNumber: string;
  dateOfBirth: string;
  gender: string;
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
  passportPhotoUrl: string | null;
}

// ─── CF CALLABLES ─────────────────────────────────────────────────────────────

const registerRiderFn = httpsCallable<
  RegisterRiderPayload,
  { RIN: string; riderId: string }
>(functions, "registerRider");

const updateRiderStatusFn = httpsCallable<
  { riderId: string; status: string },
  { success: boolean; riderId: string; newStatus: string }
>(functions, "updateRiderStatus");

// ─── PHOTO UPLOAD ─────────────────────────────────────────────────────────────

async function uploadPassportPhoto(
  file: File,
  idNumber: string,
): Promise<string | null> {
  try {
    const safeId = idNumber.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${safeId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, `riders/photos/${fileName}`);

    console.log(
      `📷 Uploading photo: ${fileName} (${Math.round(file.size / 1024)} KB)`,
    );

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: "image/jpeg",
    });
    const url = await getDownloadURL(snapshot.ref);
    console.log(`✅ Photo uploaded: ${url}`);
    return url;
  } catch (err: any) {
    console.error("❌ Photo upload failed:", {
      code: err?.code,
      message: err?.message,
      details: err?.serverResponse,
    });
    return null;
  }
}

// ─── QR CODE GENERATION ───────────────────────────────────────────────────────

async function generateAndUploadQRCode(
  RIN: string,
  riderId: string,
): Promise<string | null> {
  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const verifyUrl = `https://rin.thectsafrica.com/verify/${RIN}`;
    console.log(`🔲 Generating QR for: ${verifyUrl}`);

    // Generate as data URL then convert to blob
    const dataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });

    // Convert base64 data URL to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const qrFile = new File([blob], `qr_${RIN}.png`, { type: "image/png" });

    const storageRef = ref(storage, `riders/qrcodes/${riderId}_${RIN}.png`);
    const snapshot = await uploadBytes(storageRef, qrFile, {
      contentType: "image/png",
    });
    const url = await getDownloadURL(snapshot.ref);

    console.log(`✅ QR uploaded: ${url}`);
    return url;
  } catch (err) {
    console.error("❌ QR generation/upload failed:", err);
    return null;
  }
}

// ─── REGISTER RIDER ───────────────────────────────────────────────────────────

export async function saveRiderRegistration(
  data: RiderRegistrationData,
): Promise<RegisterResult> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");

    // 1. Upload photo
    let passportPhotoUrl: string | null = null;
    if (data.passportPhoto instanceof File) {
      passportPhotoUrl = await uploadPassportPhoto(
        data.passportPhoto,
        data.idNumber,
      );
    } else {
      console.warn("⚠️ No photo file found in form data.");
    }

    // 2. Call Cloud Function
    const response = await registerRiderFn({
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      idType: data.idType,
      idNumber: data.idNumber,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      region: data.region,
      districtMunicipality: data.districtMunicipality,
      residentialTown: data.residentialTown,
      vehicleCategory: data.vehicleCategory,
      plateNumber: data.plateNumber,
      chassisNumber: data.chassisNumber,
      driversLicenseNumber: data.driversLicenseNumber,
      licenseExpiryDate: data.licenseExpiryDate,
      nextOfKinName: data.nextOfKinName,
      nextOfKinContact: data.nextOfKinContact,
      passportPhotoUrl,
    });

    const { RIN, riderId } = response.data;

    // 3. Generate QR code and upload
    const qrCodeUrl = await generateAndUploadQRCode(RIN, riderId);

    // 4. Patch QR URL back onto the rider document
    if (qrCodeUrl) {
      try {
        await updateDoc(doc(db, "riders", riderId), {
          qrCodeUrl,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("⚠️ Could not save QR URL to Firestore:", err);
      }
    }

    return { success: true, RIN, riderId, qrCodeUrl: qrCodeUrl ?? "" };
  } catch (err: any) {
    console.error("❌ Registration error:", err);
    const message =
      err?.details?.message ??
      err?.message ??
      "Registration failed. Please try again.";
    return {
      success: false,
      RIN: "",
      riderId: "",
      qrCodeUrl: "",
      error: message,
    };
  }
}

// ─── STATUS UPDATE ────────────────────────────────────────────────────────────

export async function updateRiderStatus(
  riderId: string,
  status: "Pending" | "Active" | "Expired" | "Suspended",
): Promise<boolean> {
  try {
    await updateRiderStatusFn({ riderId, status });
    return true;
  } catch (err) {
    console.error("❌ Error updating rider status:", err);
    return false;
  }
}

export async function updateRider(
  riderId: string,
  updates: Partial<
    Omit<RiderRecord, "RIN" | "sequence" | "status" | "createdBy" | "createdAt">
  >,
): Promise<boolean> {
  try {
    await updateDoc(doc(db, "riders", riderId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("❌ Error updating rider:", err);
    return false;
  }
}

// ─── LOOKUP ───────────────────────────────────────────────────────────────────

async function lookupRider(
  field: string,
  value: string,
  extraConditions: [string, any][] = [],
): Promise<RiderLookupResult> {
  try {
    let q = query(collection(db, "riders"), where(field, "==", value));
    for (const [f, v] of extraConditions) q = query(q, where(f, "==", v));
    q = query(q, limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return { found: false };
    const d = snap.docs[0];
    return { found: true, rider: { id: d.id, ...(d.data() as RiderRecord) } };
  } catch (err) {
    console.error(`❌ Lookup by ${field} failed:`, err);
    return { found: false, error: "An error occurred while searching." };
  }
}

export const lookupByGhanaCard = (id: string) =>
  lookupRider("idNumber", id, [["idType", "GHANA_CARD"]]);
export const lookupByVoterID = (id: string) =>
  lookupRider("idNumber", id, [["idType", "VOTERS_ID"]]);
export const lookupByPassport = (id: string) =>
  lookupRider("idNumber", id, [["idType", "PASSPORT"]]);
export const lookupByPhoneNumber = (p: string) => lookupRider("phoneNumber", p);
export const lookupByIdNumber = (id: string) => lookupRider("idNumber", id);

export async function lookupByRIN(RIN: string): Promise<RiderLookupResult> {
  if (!isValidRIN(RIN)) {
    return {
      found: false,
      error: "Invalid RIN format. Expected: GAP-0001-KR0326",
    };
  }
  return lookupRider("RIN", RIN);
}

// ─── QUERIES ──────────────────────────────────────────────────────────────────

export async function getAllRiders(): Promise<
  (RiderRecord & { id: string })[]
> {
  const snap = await getDocs(
    query(collection(db, "riders"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RiderRecord) }));
}

export async function getRidersByOperator(
  uid: string,
): Promise<(RiderRecord & { id: string })[]> {
  const snap = await getDocs(
    query(
      collection(db, "riders"),
      where("createdBy", "==", uid),
      orderBy("createdAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RiderRecord) }));
}

export async function getRidersByDistrict(
  district: string,
): Promise<(RiderRecord & { id: string })[]> {
  const snap = await getDocs(
    query(
      collection(db, "riders"),
      where("districtMunicipality", "==", district),
      orderBy("createdAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RiderRecord) }));
}

export async function getRidersByStatus(
  status: "Pending" | "Active" | "Expired" | "Suspended",
): Promise<(RiderRecord & { id: string })[]> {
  const snap = await getDocs(
    query(
      collection(db, "riders"),
      where("status", "==", status),
      orderBy("createdAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RiderRecord) }));
}

export async function getRiderById(
  riderId: string,
): Promise<(RiderRecord & { id: string }) | null> {
  const snap = await getDoc(doc(db, "riders", riderId));
  return snap.exists()
    ? { id: snap.id, ...(snap.data() as RiderRecord) }
    : null;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export const isRegistrationExpired = (d: string) => new Date(d) < new Date();
export const daysUntilExpiry = (d: string) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
export const isLicenseExpired = (d: string) => new Date(d) < new Date();
export const daysUntilLicenseExpiry = (d: string) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);

/** @deprecated */
export const createRider = saveRiderRegistration;
