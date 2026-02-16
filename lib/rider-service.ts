import { db } from "./firebase";
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
  updateDoc 
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { RiderRegistrationData, DISTRICT_CODES, CATEGORY_CODES } from "@/app/lib/validations";

export interface RiderRecord extends Omit<RiderRegistrationData, "passportPhoto"> {
  opn: string;
  opnPrefix: string;
  sequence: number;
  issueDate: string;
  expiryDate: string;
  passportPhotoUrl?: string;
  status: "active" | "expired" | "suspended";
  createdAt: any;
  updatedAt: any;
}

export interface RiderLookupResult {
  found: boolean;
  rider?: RiderRecord & { id: string };
  error?: string;
}

/**
 * Generate Operating Permit Number (OPN)
 * Format: [DistrictCode]-[CategoryCode]-GR-[Sequence]
 */
export async function generateOPN(
  districtMunicipality: string,
  vehicleCategory: string
): Promise<string> {
  const districtCode = DISTRICT_CODES[districtMunicipality];
  const categoryCode = CATEGORY_CODES[vehicleCategory];

  if (!districtCode || !categoryCode) {
    throw new Error("Invalid district or vehicle category");
  }

  const prefix = `${districtCode}-${categoryCode}-GR`;
  
  try {
    const ridersRef = collection(db, "riders");
    const q = query(
      ridersRef,
      where("opnPrefix", "==", prefix),
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

    return `${prefix}-${nextSequence}`;
  } catch (error) {
    console.error("Error generating OPN:", error);
    const fallbackSequence = Date.now() % 10000 + 1000;
    return `${prefix}-${fallbackSequence}`;
  }
}

/**
 * Calculate permit dates
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

/**
 * Upload passport photo
 */
async function uploadPassportPhoto(
  file: File,
  riderId: string
): Promise<string> {
  const storage = getStorage();
  const storageRef = ref(storage, `rider-photos/${riderId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

/**
 * Save rider registration
 */
export async function saveRiderRegistration(
  data: RiderRegistrationData
): Promise<{ success: boolean; opn: string; riderId: string }> {
  try {
    const opn = await generateOPN(data.districtMunicipality, data.vehicleCategory);
    
    const opnParts = opn.split("-");
    const sequence = parseInt(opnParts[opnParts.length - 1]);
    const opnPrefix = opnParts.slice(0, -1).join("-");

    const { issueDate, expiryDate } = calculatePermitDates();

    const riderRecord: Omit<RiderRecord, "passportPhotoUrl"> = {
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      ghanaCardNumber: data.ghanaCardNumber,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      region: data.region,
      districtMunicipality: data.districtMunicipality,
      residentialTown: data.residentialTown,
      vehicleCategory: data.vehicleCategory,
      plateNumber: data.plateNumber.toUpperCase(),
      chassisNumber: data.chassisNumber.toUpperCase(),
      driversLicenseNumber: data.driversLicenseNumber,
      licenseExpiryDate: data.licenseExpiryDate,
      nextOfKinContact: data.nextOfKinContact,
      opn,
      opnPrefix,
      sequence,
      issueDate,
      expiryDate,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ridersRef = collection(db, "riders");
    const docRef = await addDoc(ridersRef, riderRecord);

    let passportPhotoUrl: string | undefined;
    if (data.passportPhoto && data.passportPhoto instanceof File) {
      passportPhotoUrl = await uploadPassportPhoto(data.passportPhoto, docRef.id);
      
      await updateDoc(doc(db, "riders", docRef.id), {
        passportPhotoUrl,
        updatedAt: serverTimestamp(),
      });
    }

    return {
      success: true,
      opn,
      riderId: docRef.id,
    };
  } catch (error) {
    console.error("Error saving rider registration:", error);
    throw error;
  }
}

// BACKWARD COMPATIBILITY: Alias for existing code
export const createRider = saveRiderRegistration;

/**
 * Look up rider by Ghana Card Number
 */
export async function lookupByGhanaCard(
  ghanaCardNumber: string
): Promise<RiderLookupResult> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(
      ridersRef,
      where("ghanaCardNumber", "==", ghanaCardNumber.toUpperCase()),
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
    console.error("Error looking up rider:", error);
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
    console.error("Error looking up rider:", error);
    return {
      found: false,
      error: "An error occurred while searching.",
    };
  }
}

/**
 * Check if permit is expired
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
    console.error("Error fetching riders:", error);
    throw error;
  }
}

/**
 * Get rider by ID
 */
export async function getRiderById(riderId: string): Promise<RiderRecord & { id: string } | null> {
  try {
    const ridersRef = collection(db, "riders");
    const q = query(ridersRef, where("__name__", "==", riderId), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...(docSnap.data() as RiderRecord),
    };
  } catch (error) {
    console.error("Error fetching rider:", error);
    return null;
  }
}