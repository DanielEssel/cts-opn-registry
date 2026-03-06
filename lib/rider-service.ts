/**
 * lib/rider-service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side service layer.
 *
 * KEY CHANGE from the old version:
 *   ❌ OLD: Generated RIN on the client (race-condition prone, insecure)
 *   ✅ NEW: Uploads photo first, then calls the `registerRider` Cloud Function.
 *           The CF atomically increments the counter and creates the rider doc.
 *           RIN is never computed on the client.
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
import { httpsCallable }              from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { RiderRegistrationData }      from "@/app/lib/validations";
import { isValidRIN, parseRIN }       from "./rin-constants";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface RiderRecord extends Omit<RiderRegistrationData, "passportPhoto"> {
  id?:              string;
  RIN:              string;
  RINPrefix:        string;
  sequence:         number;
  regionCode:       string;
  districtCode:     string;
  townCode:         string;
  issueDate:        string;
  expiryDate:       string;
  passportPhotoUrl?: string | null;
  status:           "Pending" | "Active" | "Expired" | "Suspended";
  town:             string;
  createdBy:        string;
  createdAt:        any;
  updatedAt:        any;
}

export interface RiderLookupResult {
  found:   boolean;
  rider?:  RiderRecord & { id: string };
  error?:  string;
}

export interface RegisterResult {
  success:  boolean;
  RIN:      string;
  riderId:  string;
  error?:   string;
}

// ─── CLOUD FUNCTION CALLABLES ─────────────────────────────────────────────────

const registerRiderFn = httpsCallable<
  Omit<RiderRecord, "id" | "createdAt" | "updatedAt"> & { passportPhotoUrl?: string | null },
  { RIN: string; riderId: string }
>(functions, "registerRider");

const updateRiderStatusFn = httpsCallable<
  { riderId: string; status: "Pending" | "Active" | "Expired" | "Suspended" },
  { success: boolean; riderId: string; newStatus: string }
>(functions, "updateRiderStatus");

// ─── PHOTO UPLOAD ─────────────────────────────────────────────────────────────

/**
 * Upload passport photo to Firebase Storage BEFORE calling the Cloud Function.
 * Returns the download URL, or null if upload fails (registration continues).
 *
 * Path pattern: riders/photos/{idNumber}_{timestamp}.jpg
 */
async function uploadPassportPhoto(
  file:     File,
  idNumber: string
): Promise<string | null> {
  try {
    const fileName   = `${idNumber}_${Date.now()}.jpg`;
    const storageRef = ref(storage, `riders/photos/${fileName}`);
    const snapshot   = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.warn("⚠️ Photo upload failed — continuing without photo:", err);
    return null;
  }
}

// ─── REGISTER RIDER ───────────────────────────────────────────────────────────

/**
 * Main registration entry point called from the UI.
 *
 * Flow:
 *   1. Upload photo (if provided) → get URL
 *   2. Call `registerRider` Cloud Function with URL
 *   3. CF atomically generates RIN + writes Firestore doc
 *   4. Return { success, RIN, riderId }
 */
export async function saveRiderRegistration(
  data: RiderRegistrationData
): Promise<RegisterResult> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");

    // 1. Upload photo first
    let passportPhotoUrl: string | null = null;
    if (data.passportPhoto instanceof File) {
      passportPhotoUrl = await uploadPassportPhoto(data.passportPhoto, data.idNumber);
    }

    // 2. Call Cloud Function — it handles all Firestore writes atomically
    const response = await registerRiderFn({
      fullName:             data.fullName,
      phoneNumber:          data.phoneNumber,
      idType:               data.idType,
      idNumber:             data.idNumber,
      dateOfBirth:          data.dateOfBirth,
      gender:               data.gender,
      region:               data.region,
      districtMunicipality: data.districtMunicipality,
      residentialTown:      data.residentialTown,
      town:                 data.residentialTown,
      vehicleCategory:      data.vehicleCategory,
      plateNumber:          data.plateNumber,
      chassisNumber:        data.chassisNumber,
      driversLicenseNumber: data.driversLicenseNumber,
      licenseExpiryDate:    data.licenseExpiryDate,
      nextOfKinName:        data.nextOfKinName,
      nextOfKinContact:     data.nextOfKinContact,
      passportPhotoUrl,
      // RIN fields are populated server-side
      RIN:          "",
      RINPrefix:    "",
      sequence:     0,
      regionCode:   "",
      districtCode: "",
      townCode:     "",
      issueDate:    "",
      expiryDate:   "",
      status:       "Pending",
      createdBy:    user.uid,
      createdAt:    null,
      updatedAt:    null,
    });

    return {
      success: true,
      RIN:     response.data.RIN,
      riderId: response.data.riderId,
    };
  } catch (err: any) {
    console.error("❌ Registration error:", err);

    // Firebase Functions errors expose a `message` field
    const message: string =
      err?.message ??
      err?.details?.message ??
      "Registration failed. Please try again.";

    return { success: false, RIN: "", riderId: "", error: message };
  }
}

// ─── STATUS UPDATE ────────────────────────────────────────────────────────────

/**
 * Update rider status via the Cloud Function (enforces role rules server-side).
 */
export async function updateRiderStatus(
  riderId: string,
  status:  "Pending" | "Active" | "Expired" | "Suspended"
): Promise<boolean> {
  try {
    await updateRiderStatusFn({ riderId, status });
    return true;
  } catch (err) {
    console.error("❌ Error updating rider status:", err);
    return false;
  }
}

// ─── CLIENT-SIDE UPDATE (non-status fields) ───────────────────────────────────

/**
 * Update non-sensitive rider fields directly from the client.
 * Firestore Rules enforce that only authorised roles can write.
 * Status changes MUST go through the Cloud Function above.
 */
export async function updateRider(
  riderId: string,
  updates: Partial<Omit<RiderRecord, "RIN" | "sequence" | "status" | "createdBy" | "createdAt">>
): Promise<boolean> {
  try {
    const riderRef = doc(db, "riders", riderId);
    await updateDoc(riderRef, { ...updates, updatedAt: serverTimestamp() });
    return true;
  } catch (err) {
    console.error("❌ Error updating rider:", err);
    return false;
  }
}

// ─── LOOKUP FUNCTIONS ─────────────────────────────────────────────────────────

/** Generic rider lookup helper — keeps each lookup function DRY */
async function lookupRider(
  field: string,
  value: string,
  extraConditions: [string, any][] = []
): Promise<RiderLookupResult> {
  try {
    const ridersRef = collection(db, "riders");
    let q = query(ridersRef, where(field, "==", value));

    for (const [f, v] of extraConditions) {
      q = query(q, where(f, "==", v));
    }
    q = query(q, limit(1));

    const snapshot = await getDocs(q);
    if (snapshot.empty) return { found: false };

    const docSnap = snapshot.docs[0];
    return { found: true, rider: { id: docSnap.id, ...(docSnap.data() as RiderRecord) } };
  } catch (err) {
    console.error(`❌ Lookup by ${field} failed:`, err);
    return { found: false, error: "An error occurred while searching." };
  }
}

export const lookupByGhanaCard   = (id: string) => lookupRider("idNumber", id, [["idType", "GHANA_CARD"]]);
export const lookupByVoterID     = (id: string) => lookupRider("idNumber", id, [["idType", "VOTERS_ID"]]);
export const lookupByPassport    = (id: string) => lookupRider("idNumber", id, [["idType", "PASSPORT"]]);
export const lookupByPhoneNumber = (p: string)  => lookupRider("phoneNumber", p);
export const lookupByIdNumber    = (id: string) => lookupRider("idNumber", id);

export async function lookupByRIN(RIN: string): Promise<RiderLookupResult> {
  if (!isValidRIN(RIN)) {
    return { found: false, error: "Invalid RIN format. Expected: XXX-0000-XX0000" };
  }
  return lookupRider("RIN", RIN);
}

// ─── QUERY FUNCTIONS ──────────────────────────────────────────────────────────

export async function getAllRiders(): Promise<(RiderRecord & { id: string })[]> {
  const snap = await getDocs(
    query(collection(db, "riders"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RiderRecord) }));
}

export async function getRidersByOperator(
  operatorId: string
): Promise<(RiderRecord & { id: string })[]> {
  const snap = await getDocs(
    query(
      collection(db, "riders"),
      where("createdBy", "==", operatorId),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RiderRecord) }));
}

export async function getRidersByDistrict(
  districtMunicipality: string
): Promise<(RiderRecord & { id: string })[]> {
  const snap = await getDocs(
    query(
      collection(db, "riders"),
      where("districtMunicipality", "==", districtMunicipality),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RiderRecord) }));
}

export async function getRidersByStatus(
  status: "Pending" | "Active" | "Expired" | "Suspended"
): Promise<(RiderRecord & { id: string })[]> {
  const snap = await getDocs(
    query(
      collection(db, "riders"),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RiderRecord) }));
}

export async function getRiderById(
  riderId: string
): Promise<(RiderRecord & { id: string }) | null> {
  const snap = await getDoc(doc(db, "riders", riderId));
  return snap.exists() ? { id: snap.id, ...(snap.data() as RiderRecord) } : null;
}

// ─── DATE / EXPIRY HELPERS ────────────────────────────────────────────────────

export function isRegistrationExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

export function daysUntilExpiry(expiryDate: string): number {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86_400_000);
}

export function isLicenseExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

export function daysUntilLicenseExpiry(expiryDate: string): number {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86_400_000);
}

// ─── BACKWARD COMPATIBILITY ───────────────────────────────────────────────────
/** @deprecated Use saveRiderRegistration instead */
export const createRider = saveRiderRegistration;