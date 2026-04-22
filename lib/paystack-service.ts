

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

// ── Types (identical to hanypay-service) ─────────────────────────────────────

export type MomoNetwork = "MTN" | "VODAFONE" | "AIRTELTIGO";
export type PaymentStatus = "idle" | "pending" | "success" | "failed";
export const REGISTRATION_FEE_GHS = 150;

// ── Initiate Payment ──────────────────────────────────────────────────────────

interface InitiatePaymentParams {
  phone: string;
  network: MomoNetwork;
  preRegId: string;
  riderName: string;
  email?: string;
}

interface InitiatePaymentResult {
  success: boolean;
  reference: string;
  error?: string;
}

export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  try {
    const initCharge = httpsCallable(functions, "initiateMomoCharge");

    const email =
      params.email ||
      `rider.${params.phone.replace(/\D/g, "")}@rinsystem.gh`;

    const result = await initCharge({
      phone: params.phone,
      network: params.network,
      preRegId: params.preRegId,
      riderName: params.riderName,
      email,
      amountGHS: REGISTRATION_FEE_GHS,
    });

   const data = result.data as { success: boolean; reference: string; status: string };
return {
  success: data.success,
  reference: data.reference,
};

  } catch (error: any) {
    console.error("initiatePayment error:", error);
    return {
      success: false,
      reference: "",
      error:
        error?.message ||
        "Payment initiation failed. Please check your number and try again.",
    };
  }
}

// ── Verify / Poll Payment ─────────────────────────────────────────────────────

interface VerifyPaymentResult {
  status: PaymentStatus;
  transactionId?: string;
}

export async function verifyPayment(
  reference: string
): Promise<VerifyPaymentResult> {
  try {
    const checkStatus = httpsCallable(functions, "checkMomoStatus");

const result = await checkStatus({ reference });
const data = result.data as { status: string; transactionId: string };

return {
  status: data.status as PaymentStatus,
  transactionId: data.transactionId,
};
  } catch (error: any) {
    console.error("verifyPayment error:", error);
    return { status: "pending" };
  }
}