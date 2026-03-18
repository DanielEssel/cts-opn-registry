import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type PreRegistrationData } from "@/lib/pre-registration-schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PreRegistrationStatus =
  | "pending_training"   // just submitted
  | "training_scheduled" // training date assigned by admin
  | "trained"            // passed training
  | "rin_issued";        // RIN has been generated (bridge complete)

export interface PreRegistrationRecord extends PreRegistrationData {
  id: string;
  status: PreRegistrationStatus;
  preRegId: string;          // human-readable ID e.g. PR-2026-00042
  trainingDate?: string | null;
  rinId?: string | null;     // populated when bridged to RIN engine
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generatePreRegId(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(10000 + Math.random() * 90000);
  return `PR-${year}-${suffix}`;
}

// ─── Save a new pre-registration ──────────────────────────────────────────────

export async function savePreRegistration(
  data: PreRegistrationData
): Promise<{ success: true; preRegId: string } | { success: false; error: string }> {
  try {
    // Guard: check for duplicate phone number
    const existing = await getPreRegistrationByPhone(data.phoneNumber);
    if (existing) {
      return {
        success: false,
        error: `This phone number is already registered (${existing.preRegId}). Contact your coordinator if this is a mistake.`,
      };
    }

    const preRegId = generatePreRegId();

    await addDoc(collection(db, "pre_registrations"), {
      ...data,
      preRegId,
      status: "pending_training" as PreRegistrationStatus,
      trainingDate: null,
      rinId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, preRegId };
  } catch (err: unknown) {
    console.error("savePreRegistration error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Registration failed. Please try again.",
    };
  }
}

// ─── Lookup by phone (used by duplicate guard + RIN bridge) ───────────────────

export async function getPreRegistrationByPhone(
  phone: string
): Promise<PreRegistrationRecord | null> {
  try {
    const q = query(
      collection(db, "pre_registrations"),
      where("phoneNumber", "==", phone),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as PreRegistrationRecord;
  } catch {
    return null;
  }
}

// ─── Lookup by ID number ──────────────────────────────────────────────────────

export async function getPreRegistrationById(
  idNumber: string
): Promise<PreRegistrationRecord | null> {
  try {
    const q = query(
      collection(db, "pre_registrations"),
      where("idNumber", "==", idNumber),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as PreRegistrationRecord;
  } catch {
    return null;
  }
}

// ─── RIN Bridge (call this from the RIN engine after issuing a RIN) ───────────
// Drop this into your existing saveRiderRegistration() flow when ready.
//
// Usage in RIN engine:
//   const pre = await getPreRegistrationByPhone(data.phoneNumber);
//   if (pre) await markPreRegistrationAsIssued(pre.id, generatedRIN);

export async function markPreRegistrationAsIssued(
  docId: string,
  rinId: string
): Promise<void> {
  await updateDoc(doc(db, "pre_registrations", docId), {
    status: "rin_issued" as PreRegistrationStatus,
    rinId,
    updatedAt: serverTimestamp(),
  });
}

// ─── Admin: mark as trained (for admin dashboard later) ───────────────────────

export async function markPreRegistrationAsTrained(
  docId: string,
  trainingDate?: string
): Promise<void> {
  await updateDoc(doc(db, "pre_registrations", docId), {
    status: "trained" as PreRegistrationStatus,
    trainingDate: trainingDate ?? new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}