import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { RiderRecord } from "./rider-service";

export interface RiderLookupResult {
  found: boolean;
  rider?: RiderRecord & { id: string };
  error?: string;
}

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

    const doc = snapshot.docs[0];
    const riderData = doc.data() as RiderRecord;

    return {
      found: true,
      rider: {
        ...riderData,
        id: doc.id,
      },
    };
  } catch (error) {
    console.error("Error looking up rider by Ghana Card:", error);
    return {
      found: false,
      error: "An error occurred while searching. Please try again.",
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

    const doc = snapshot.docs[0];
    const riderData = doc.data() as RiderRecord;

    return {
      found: true,
      rider: {
        ...riderData,
        id: doc.id,
      },
    };
  } catch (error) {
    console.error("Error looking up rider by phone number:", error);
    return {
      found: false,
      error: "An error occurred while searching. Please try again.",
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