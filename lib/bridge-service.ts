

import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { functions } from "@/lib/firebase"; //
import { toInternational } from "@/lib/ghana-phone";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Identical to what PaymentWidget already uses */
export type PaymentStatus = "idle" | "pending" | "success" | "failed";

/** What PaymentWidget passes into initiatePayment() */
export interface InitiatePaymentParams {
  phone: string;
  network: "MTN" | "VODAFONE" | "AIRTELTIGO";
  preRegId: string;
  riderName: string;
  email: string;
}

/** What initiatePayment() returns — identical shape to paystack-service */
export interface InitiatePaymentResult {
  success: boolean;
  /** The transaction_id used as the polling key in verifyPayment() */
  reference: string;
  error?: string;
}

/** What verifyPayment() returns — identical shape to paystack-service */
export interface VerifyPaymentResult {
  status: "success" | "failed" | "pending";
  transactionId?: string;
}

// ── Internal Cloud Function response shapes ───────────────────────────────────

interface InitiateMomoChargeRequest {
  phone: string;
  network: string;         // "MTN" | "VOD" | "AIR"
  transactionId: string;
  preRegId: string;
  riderName: string;
}

interface InitiateMomoChargeResponse {
  success: boolean;
  transactionId: string;
  responseCode: string;
  message: string;
}

interface CheckBridgePaymentStatusRequest {
  reference: string;
}

interface CheckBridgePaymentStatusResponse {
  success: boolean;
  status: string;           // Bridge raw code e.g. "000"
  description?: string;
  localStatus: string;      // "success" | "failed" | "pending" | "cancelled"
  payment?: Record<string, unknown>;
}

// ── Network mapping ───────────────────────────────────────────────────────────

const NETWORK_MAP: Record<"MTN" | "VODAFONE" | "AIRTELTIGO", string> = {
  MTN:        "MTN",
  VODAFONE:   "VOD",
  AIRTELTIGO: "AIR",
};

// ── Singleton Firebase Functions instance ─────────────────────────────────────

function getFunctionsInstance() {
  return functions;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateTransactionId(): string {
  const ts     = Date.now();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PCRAA-${ts}-${random}`;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    // Firebase HttpsError shape
    const firebaseErr = err as { code?: string; message?: string };
    if (firebaseErr.code === "functions/not-found") {
      return "Payment service unavailable. Please try again.";
    }
    if (firebaseErr.code === "functions/resource-exhausted") {
      return "Too many requests. Please wait a moment and try again.";
    }
    if (firebaseErr.code === "functions/unauthenticated") {
      return "Session expired. Please refresh the page and try again.";
    }
    if (firebaseErr.message) {
      return firebaseErr.message;
    }
  }
  return fallback;
}

// ── initiatePayment ───────────────────────────────────────────────────────────
/**
 * Called by PaymentWidget when the user taps "Pay".
 * Calls the `initiateMomoCharge` Cloud Function via httpsCallable.
 * Returns the generated transactionId as `reference` for polling.
 */
export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  const transactionId = generateTransactionId();
  const mappedNetwork = NETWORK_MAP[params.network];

  // ── Convert phone to Bridge international format ─────────────────────────
  // Form collects 0XXXXXXXXX — Bridge requires 233XXXXXXXXX
  const internationalPhone = toInternational(params.phone);

  if (!internationalPhone) {
    console.error("❌ PAYMENT BLOCKED: Could not convert phone to international format", {
      raw: params.phone,
    });
    return {
      success: false,
      reference: transactionId,
      error: "Invalid phone number format. Please enter a valid Ghana number.",
    };
  }

  if (!internationalPhone || !mappedNetwork || !params.preRegId) {
    console.error("❌ PAYMENT BLOCKED: Missing critical parameters", {
      phone:    internationalPhone,
      network:  mappedNetwork,
      preRegId: params.preRegId,
    });
    return {
      success: false,
      reference: transactionId,
      error: "Missing required billing details.",
    };
  }

  try {
    const fn = httpsCallable<InitiateMomoChargeRequest, InitiateMomoChargeResponse>(
      getFunctionsInstance(),
      "initiateMomoCharge"
    );

    console.log("🚀 Sending to initiateMomoCharge:", {
      phone:     internationalPhone,   // ← now 233XXXXXXXXX
      network:   mappedNetwork,
      transactionId,
      preRegId:  params.preRegId,
    });

    const result = await fn({
      phone:         internationalPhone,  // ← converted
      network:       mappedNetwork,
      transactionId,
      preRegId:      params.preRegId,
      riderName:     params.riderName,
    });

    const data = result.data;
    if (!data.success) {
      return {
        success:   false,
        reference: transactionId,
        error:     data.message ?? "Payment initiation failed.",
      };
    }

    return { success: true, reference: transactionId };

  } catch (err) {
    return {
      success:   false,
      reference: transactionId,
      error:     extractErrorMessage(err, "Could not send payment prompt."),
    };
  }
}

// ── verifyPayment ─────────────────────────────────────────────────────────────
/**
 * Called by PaymentWidget every 5 seconds during polling.
 * Calls the `checkBridgePaymentStatus` Cloud Function via httpsCallable.
 * Returns "pending" on any transient error so polling continues safely.
 */
export async function verifyPayment(
  transactionId: string
): Promise<VerifyPaymentResult> {
  try {
    const functions = getFunctionsInstance();
    const check = httpsCallable<
  CheckBridgePaymentStatusRequest,
  CheckBridgePaymentStatusResponse
>(
  functions,
  "checkMomoStatus"
);

    const result: HttpsCallableResult<CheckBridgePaymentStatusResponse> =
      await check({ reference: transactionId });

    const data = result.data;

    if (!data.success) {
      return { status: "pending" };
    }

    // Map localStatus → the shape PaymentWidget expects
    const statusMap: Record<string, VerifyPaymentResult["status"]> = {
      success:   "success",
      failed:    "failed",
      cancelled: "failed",   // treat cancelled as failed for the UI
      pending:   "pending",
      unknown:   "pending",
    };

    const status = statusMap[data.localStatus] ?? "pending";

    return {
      status,
      transactionId: status === "success"
        ? (data.payment?.transactionId as string | undefined) ?? transactionId
        : undefined,
    };

  } catch (err) {
    // On any Firebase/network error during polling, return "pending"
    // so the PaymentWidget keeps polling rather than showing a false failure.
    console.warn("[bridge-service] verifyPayment error (will retry):", err);
    return { status: "pending" };
  }
}