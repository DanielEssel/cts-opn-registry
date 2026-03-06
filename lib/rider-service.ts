import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { RiderRegistrationData, DISTRICT_CODES, CATEGORY_CODES } from "@/app/lib/validations";

// ============================================================================
// TYPES
// ============================================================================

export interface RiderRecord extends Omit<RiderRegistrationData, "passportPhoto"> {
  id?: string;
  RIN: string;
  RINPrefix: string;
  sequence: number;
  issueDate: string;
  expiryDate: string;
  passportPhotoUrl?: string | null;
  status: "Pending" | "Active" | "Expired" | "Suspended";
  town: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface RiderLookupResult {
  found: boolean;
  rider?: RiderRecord & { id: string };
  error?: string;
}

// ============================================================================
// GENERATE RIN
// ============================================================================

/**
 * Generate Rider Registration Number (RIN)
 * Format: [DistrictCode]-[Sequence]-[Month]-[Year]
 * Example: AM-1001-02-26
 */
export async function generateRIN(
  districtMunicipality: string,
  vehicleCategory: string
): Promise<string> {
  const districtCode = DISTRICT_CODES[districtMunicipality];
  const categoryCode = CATEGORY_CODES[vehicleCategory];

  if (!districtCode || !categoryCode) {
    throw new Error("Invalid district or vehicle category");
  }

  const prefix = districtCode;

  try {
    const ridersRef = collection(db, "riders");
    const q = query(
      ridersRef,
      where("RINPrefix", "==", prefix),
      orderBy("sequence", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    let nextSequence = 1001;

    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0];
      const lastSequence = lastDoc.data().sequence || 1000;
      nextSequence = lastSequence + 1;
    }

    // Generate with current date
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = String(today.getFullYear()).slice(-2);
    const sequence = String(nextSequence).padStart(4, "0");

    return `${prefix}-${sequence}-${month}-${year}`;
  } catch (error) {
    console.error("❌ Error generating RIN:", error);
    // Fallback: Generate without database query
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = String(today.getFullYear()).slice(-2);
    const fallbackSequence = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${fallbackSequence}-${month}-${year}`;
  }
}

// ============================================================================
// CALCULATE IDENTIFICATION DATES
// ============================================================================

/**
 * Calculate identification dates (issue date + 6 months expiry)
 */
export function calculatePermitDates() {
  const issueDate = new Date();
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 6);

  return {
    issueDate: issueDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
  };
}

// ============================================================================
// UPLOAD PASSPORT PHOTO
// ============================================================================

/**
 * Upload passport photo to Firebase Storage
 */
async function uploadPassportPhoto(
  file: File,
  idNumber: string
): Promise<string | null> {
  try {
    const storage = getStorage();
    const fileName = `${idNumber}_${Date.now()}.jpg`;
    const storageRef = ref(storage, `riders/${idNumber}/${fileName}`);

    console.log("📸 Starting photo upload to:", storageRef.fullPath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log("✅ Photo uploaded successfully");
    return downloadUrl;
  } catch (photoError) {
    console.warn("⚠️ Photo upload failed (continuing without photo):", photoError);
    return null;
  }
}

// ============================================================================
// SAVE RIDER REGISTRATION
// ============================================================================

/**
 * Save rider registration to Firestore
 */
export async function saveRiderRegistration(
  data: RiderRegistrationData
): Promise<{ success: boolean; RIN: string; riderId: string; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log("👤 Current user:", user.uid);

    // 1. Generate RIN
    const RIN = await generateRIN(data.districtMunicipality, data.vehicleCategory);
    console.log("✅ RIN Generated:", RIN);

    const RINParts = RIN.split("-");
    const sequence = parseInt(RINParts[1]);
    const RINPrefix = RINParts[0];

    const { issueDate, expiryDate } = calculatePermitDates();

    // 2. Upload photo if provided
    let passportPhotoUrl: string | null = null;
    if (data.passportPhoto instanceof File) {
      passportPhotoUrl = await uploadPassportPhoto(data.passportPhoto, data.idNumber);
    }

    // 3. Prepare rider record with complete schema
    const riderRecord: RiderRecord = {
      // ====================================================================
      // BIO DATA
      // ====================================================================
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      idType: data.idType,
      idNumber: data.idNumber,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,

      // ====================================================================
      // LOCATION
      // ====================================================================
      region: data.region,
      districtMunicipality: data.districtMunicipality,
      residentialTown: data.residentialTown,
      town: data.residentialTown,

      // ====================================================================
      // VEHICLE INFO
      // ====================================================================
      vehicleCategory: data.vehicleCategory,
      plateNumber: data.plateNumber.toUpperCase(),
      chassisNumber: data.chassisNumber.toUpperCase(),

      // ====================================================================
      // COMPLIANCE
      // ====================================================================
      driversLicenseNumber: data.driversLicenseNumber.toUpperCase(),
      licenseExpiryDate: data.licenseExpiryDate,
      nextOfKinName: data.nextOfKinName,
      nextOfKinContact: data.nextOfKinContact,
      passportPhotoUrl,

      // ====================================================================
      // RIN & STATUS
      // ====================================================================
      RIN,
      RINPrefix,
      sequence,
      issueDate,
      expiryDate,
      status: "Pending",
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log("📝 Rider record prepared");

    // 4. Save to Firestore
    const ridersRef = collection(db, "riders");
    console.log("📂 Riders collection reference created");

    const docRef = await addDoc(ridersRef, riderRecord);
    console.log("✅ Rider saved to Firestore:", docRef.id);

    // 5. Create audit log
    await createAuditLog({
      type: "REGISTER",
      admin: user.uid,
      action: `Registered new rider: ${data.fullName}`,
      target: data.fullName,
      targetId: docRef.id,
      status: "success",
    });

    console.log("🎉 Registration complete!");
    return {
      success: true,
      RIN,
      riderId: docRef.id,
    };
  } catch (error) {
    console.error("❌ FULL ERROR OBJECT:", error);
    console.error("❌ Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ Error message:", error instanceof Error ? error.message : String(error));

    return {
      success: false,
      RIN: "",
      riderId: "",
      error: error instanceof Error ? error.message : "Failed to register rider. Check console for details.",
    };
  }
}

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Look up rider by Ghana Card Number
 */
export async function lookupByGhanaCard(
  idNumber: string
): Promise<RiderLookupResult> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(
      ridersRef,
      where("idNumber", "==", idNumber),
      where("idType", "==", "GHANA_CARD"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { found: false };
    }

    const docSnap = snapshot.docs[0];
    const riderData = docSnap.data() as RiderRecord;

    return {
      found: true,
      rider: {
        ...riderData,
        id: docSnap.id,
      },
    };
  } catch (error) {
    console.error("❌ Error looking up rider by Ghana Card:", error);
    return {
      found: false,
      error: "An error occurred while searching.",
    };
  }
}

/**
 * Look up rider by Voter ID Number
 */
export async function lookupByVoterID(
  idNumber: string
): Promise<RiderLookupResult> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(
      ridersRef,
      where("idNumber", "==", idNumber),
      where("idType", "==", "VOTERS_ID"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { found: false };
    }

    const docSnap = snapshot.docs[0];
    const riderData = docSnap.data() as RiderRecord;

    return {
      found: true,
      rider: {
        ...riderData,
        id: docSnap.id,
      },
    };
  } catch (error) {
    console.error("❌ Error looking up rider by Voter ID:", error);
    return {
      found: false,
      error: "An error occurred while searching.",
    };
  }
}

/**
 * Look up rider by Passport Number
 */
export async function lookupByPassport(
  idNumber: string
): Promise<RiderLookupResult> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(
      ridersRef,
      where("idNumber", "==", idNumber),
      where("idType", "==", "PASSPORT"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { found: false };
    }

    const docSnap = snapshot.docs[0];
    const riderData = docSnap.data() as RiderRecord;

    return {
      found: true,
      rider: {
        ...riderData,
        id: docSnap.id,
      },
    };
  } catch (error) {
    console.error("❌ Error looking up rider by Passport:", error);
    return {
      found: false,
      error: "An error occurred while searching.",
    };
  }
}

/**
 * Look up rider by Phone Number
 */
export async function lookupByPhoneNumber(
  phoneNumber: string
): Promise<RiderLookupResult> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(
      ridersRef,
      where("phoneNumber", "==", phoneNumber),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { found: false };
    }

    const docSnap = snapshot.docs[0];
    const riderData = docSnap.data() as RiderRecord;

    return {
      found: true,
      rider: {
        ...riderData,
        id: docSnap.id,
      },
    };
  } catch (error) {
    console.error("❌ Error looking up rider by phone:", error);
    return {
      found: false,
      error: "An error occurred while searching.",
    };
  }
}

/**
 * Look up rider by RIN
 */
export async function lookupByRIN(RIN: string): Promise<RiderLookupResult> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(ridersRef, where("RIN", "==", RIN), limit(1));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { found: false };
    }

    const docSnap = snapshot.docs[0];
    const riderData = docSnap.data() as RiderRecord;

    return {
      found: true,
      rider: {
        ...riderData,
        id: docSnap.id,
      },
    };
  } catch (error) {
    console.error("❌ Error looking up rider by RIN:", error);
    return {
      found: false,
      error: "An error occurred while searching.",
    };
  }
}

/**
 * Look up rider by ID number (any type)
 */
export async function lookupByIdNumber(idNumber: string): Promise<RiderLookupResult> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(ridersRef, where("idNumber", "==", idNumber), limit(1));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { found: false };
    }

    const docSnap = snapshot.docs[0];
    const riderData = docSnap.data() as RiderRecord;

    return {
      found: true,
      rider: {
        ...riderData,
        id: docSnap.id,
      },
    };
  } catch (error) {
    console.error("❌ Error looking up rider by ID number:", error);
    return {
      found: false,
      error: "An error occurred while searching.",
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if p is expired
 */
export function isPermitExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const today = new Date();
  return expiry < today;
}

/**
 * Calculate days until expiry
 */
export function daysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if license is expired
 */
export function isLicenseExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const today = new Date();
  return expiry < today;
}

/**
 * Calculate days until license expiry
 */
export function daysUntilLicenseExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get all riders (for admin)
 */
export async function getAllRiders(): Promise<(RiderRecord & { id: string })[]> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(ridersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as RiderRecord),
    }));
  } catch (error) {
    console.error("❌ Error fetching riders:", error);
    throw error;
  }
}

/**
 * Get riders by operator
 */
export async function getRidersByOperator(operatorId: string): Promise<(RiderRecord & { id: string })[]> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(
      ridersRef,
      where("createdBy", "==", operatorId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as RiderRecord),
    }));
  } catch (error) {
    console.error("❌ Error fetching riders by operator:", error);
    throw error;
  }
}

/**
 * Get riders by district
 */
export async function getRidersByDistrict(
  districtMunicipality: string
): Promise<(RiderRecord & { id: string })[]> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(
      ridersRef,
      where("districtMunicipality", "==", districtMunicipality),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as RiderRecord),
    }));
  } catch (error) {
    console.error("❌ Error fetching riders by district:", error);
    throw error;
  }
}

/**
 * Get riders by status
 */
export async function getRidersByStatus(
  status: "Pending" | "Active" | "Expired" | "Suspended"
): Promise<(RiderRecord & { id: string })[]> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(
      ridersRef,
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as RiderRecord),
    }));
  } catch (error) {
    console.error("❌ Error fetching riders by status:", error);
    throw error;
  }
}

/**
 * Get rider by ID
 */
export async function getRiderById(
  riderId: string
): Promise<(RiderRecord & { id: string }) | null> {
  try {
    const riderRef = doc(db, "riders", riderId);
    const docSnap = await getDoc(riderRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...(docSnap.data() as RiderRecord),
    };
  } catch (error) {
    console.error("❌ Error fetching rider:", error);
    return null;
  }
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

/**
 * Update rider status
 */
export async function updateRiderStatus(
  riderId: string,
  status: "Pending" | "Active" | "Expired" | "Suspended"
): Promise<boolean> {
  try {
    const riderRef = doc(db, "riders", riderId);
    const rider = await getDoc(riderRef);

    if (!rider.exists()) {
      throw new Error("Rider not found");
    }

    const riderData = rider.data() as RiderRecord;

    await updateDoc(riderRef, {
      status,
      updatedAt: serverTimestamp(),
      issueDate: status === "Active" ? new Date().toISOString() : riderData.issueDate,
    });

    console.log("✅ Rider status updated:", status);

    // Log audit
    await createAuditLog({
      type: "STATUS_CHANGE",
      admin: auth.currentUser?.uid || "system",
      action: `Changed status from ${riderData.status} to ${status}`,
      target: riderData.fullName,
      targetId: riderId,
      status: "success",
    });

    return true;
  } catch (error) {
    console.error("❌ Error updating rider status:", error);
    return false;
  }
}

/**
 * Update rider information
 */
export async function updateRider(
  riderId: string,
  updates: Partial<RiderRecord>
): Promise<boolean> {
  try {
    const riderRef = doc(db, "riders", riderId);

    await updateDoc(riderRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Rider updated");

    // Log audit
    await createAuditLog({
      type: "EDIT",
      admin: auth.currentUser?.uid || "system",
      action: "Updated rider information",
      target: updates.fullName || "Unknown",
      targetId: riderId,
      status: "success",
    });

    return true;
  } catch (error) {
    console.error("❌ Error updating rider:", error);
    return false;
  }
}

// ============================================================================
// AUDIT LOG
// ============================================================================

interface AuditLogData {
  type: string;
  admin: string;
  action: string;
  target: string;
  targetId: string;
  status: "success" | "failed" | "warning";
  details?: string;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    const auditRef = collection(db, "audit_logs");
    await addDoc(auditRef, {
      ...data,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.warn("⚠️ Failed to create audit log:", error);
    // Don't throw - audit logs should not block operations
  }
}

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

// Alias for existing code
export const createRider = saveRiderRegistration;