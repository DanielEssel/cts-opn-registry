/**
 * lib/hanypay-service.ts
 *
 * Hanypay payment gateway stub.
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO GO LIVE when you receive Hanypay credentials:
 *   1. Set HANYPAY_BASE_URL, HANYPAY_MERCHANT_ID, HANYPAY_API_KEY in .env.local
 *   2. Replace the simulated logic inside initiatePayment() and verifyPayment()
 *      with the real Hanypay API calls using the patterns already scaffolded.
 *   3. Set up the webhook route at /api/hanypay/webhook to receive callbacks.
 *
 * ENVIRONMENT VARIABLES NEEDED:
 *   HANYPAY_BASE_URL=https://api.hanypay.com         (update when confirmed)
 *   HANYPAY_MERCHANT_ID=your_merchant_id
 *   HANYPAY_API_KEY=your_api_key
 *   NEXT_PUBLIC_APP_URL=https://rin.thectsafrica.com
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const REGISTRATION_FEE_GHS = 150;

export type MomoNetwork = "MTN" | "VODAFONE" | "AIRTELTIGO";

export type PaymentStatus = "idle" | "pending" | "success" | "failed";

export interface PaymentRecord {
  reference: string;
  amount: number;
  currency: "GHS";
  phone: string;
  network: MomoNetwork;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  error?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  reference: string;
  message: string;
  error?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  status: PaymentStatus;
  transactionId?: string;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateReference(preRegId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `CTS-${preRegId.replace("PR-", "")}-${ts}`;
}

function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return "233" + digits.slice(1);
  if (digits.startsWith("233")) return digits;
  return digits;
}

// ─── Initiate Mobile Money payment ───────────────────────────────────────────

export async function initiatePayment(opts: {
  phone: string;
  network: MomoNetwork;
  preRegId: string;
  riderName: string;
}): Promise<InitiatePaymentResult> {
  const reference = generateReference(opts.preRegId);
  const momoPhone = normalisePhone(opts.phone);

  const isConfigured =
    process.env.HANYPAY_BASE_URL &&
    process.env.HANYPAY_MERCHANT_ID &&
    process.env.HANYPAY_API_KEY;

  // ── LIVE path (uncomment when Hanypay credentials are received) ────────────
  if (isConfigured) {
    try {
      const res = await fetch(`${process.env.HANYPAY_BASE_URL}/payments/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "merchant-id": process.env.HANYPAY_MERCHANT_ID!,
          "api-key":     process.env.HANYPAY_API_KEY!,
        },
        body: JSON.stringify({
          amount:      REGISTRATION_FEE_GHS,
          currency:    "GHS",
          reference,
          phone:       momoPhone,
          network:     opts.network,
          description: `PCRAA rider pre-registration — ${opts.preRegId}`,
          customer:    opts.riderName,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/hanypay/webhook`,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.status === "error") {
        return { success: false, reference, error: data.message ?? "Payment initiation failed", message: "" };
      }

      return { success: true, reference, message: data.message ?? "Prompt sent to your phone. Approve to complete payment." };
    } catch (err: any) {
      return { success: false, reference, error: err.message ?? "Network error", message: "" };
    }
  }

  // ── STUB path (active until Hanypay credentials are configured) ───────────
  console.warn("[Hanypay STUB] Simulating payment initiation — no real charge.");
  await new Promise((r) => setTimeout(r, 1500)); // simulate network delay

  return {
    success: true,
    reference,
    message: `[TEST MODE] A payment prompt would be sent to ${momoPhone} for GHS ${REGISTRATION_FEE_GHS}.`,
  };
}

// ─── Verify payment status ────────────────────────────────────────────────────

export async function verifyPayment(reference: string): Promise<VerifyPaymentResult> {
  const isConfigured =
    process.env.HANYPAY_BASE_URL &&
    process.env.HANYPAY_MERCHANT_ID &&
    process.env.HANYPAY_API_KEY;

  // ── LIVE path ──────────────────────────────────────────────────────────────
  if (isConfigured) {
    try {
      const res = await fetch(
        `${process.env.HANYPAY_BASE_URL}/payments/verify/${reference}`,
        {
          headers: {
            "merchant-id": process.env.HANYPAY_MERCHANT_ID!,
            "api-key":     process.env.HANYPAY_API_KEY!,
          },
        }
      );
      const data = await res.json();
      const statusMap: Record<string, PaymentStatus> = {
        success:   "success",
        completed: "success",
        pending:   "pending",
        failed:    "failed",
        cancelled: "failed",
      };
      return {
        success:       data.status === "success" || data.status === "completed",
        status:        statusMap[data.status] ?? "pending",
        transactionId: data.transaction_id ?? data.transactionId,
      };
    } catch (err: any) {
      return { success: false, status: "failed", error: err.message };
    }
  }

  // ── STUB path — auto-succeed after 3s ─────────────────────────────────────
  console.warn("[Hanypay STUB] Simulating payment verification — auto-succeeding.");
  await new Promise((r) => setTimeout(r, 3000));

  return {
    success:       true,
    status:        "success",
    transactionId: `STUB-TXN-${Date.now()}`,
  };
}

// ─── Webhook handler helper (for /api/hanypay/webhook/route.ts) ───────────────

export interface HanypayWebhookPayload {
  reference:      string;
  status:         "success" | "failed" | "pending";
  transaction_id: string;
  amount:         number;
  phone:          string;
  timestamp:      string;
}

export function parseWebhookPayload(body: unknown): HanypayWebhookPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (!b.reference || !b.status) return null;
  return body as HanypayWebhookPayload;
}