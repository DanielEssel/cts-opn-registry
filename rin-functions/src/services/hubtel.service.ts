import axios from "axios";

const HUBTEL_BASE_URL = "https://smsc.hubtel.com/v1/messages/send";

export type SMSEventType =
  | "application_confirmation"
  | "training_approved"
  | "training_rejected"
  | "rin_issued"
  | "payment_confirmed";

export interface SendSMSParams {
  to: string; // Phone number with country code e.g. +233244000000
  message: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a single SMS via Hubtel.
 */
export async function sendSMS(params: SendSMSParams): Promise<SMSResult> {
  const clientId = process.env.HUBTEL_CLIENT_ID;
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
  const senderId = process.env.HUBTEL_SENDER_ID || "PCRAA-System";

  if (!clientId || !clientSecret) {
    throw new Error("Hubtel credentials (HUBTEL_CLIENT_ID / HUBTEL_CLIENT_SECRET) are not configured.");
  }

  // Normalize phone number
  const normalizedPhone = normalizePhone(params.to);

  try {
    const response = await axios.get(HUBTEL_BASE_URL, {
      params: {
        clientsecretid: clientId,
        clientsecret: clientSecret,
        from: senderId,
        to: normalizedPhone,
        content: params.message,
      },
    });

    // Hubtel returns rate=0 on success
    const isSuccess =
      response.data?.rate === 0 || response.data?.status === "0";

    return {
      success: isSuccess,
      messageId: response.data?.messageId || response.data?.MessageId,
    };
  } catch (error: any) {
    console.error("Hubtel SMS error:", error?.response?.data || error.message);
    return {
      success: false,
      error: error?.response?.data?.message || error.message,
    };
  }
}

/**
 * Send SMS to multiple recipients.
 */
export async function sendBulkSMS(
  phones: string[],
  message: string
): Promise<SMSResult[]> {
  return Promise.all(phones.map((to) => sendSMS({ to, message })));
}

// ── Message Templates ─────────────────────────────────────────────────────────

/**
 * Build the correct SMS message for a given event.
 */
export function buildSMSMessage(
  event: SMSEventType,
  data: SMSTemplateData
): string {
  switch (event) {
    case "application_confirmation":
      return (
        `Hello ${data.riderName}, your training application (Ref: ${data.reference}) ` +
        `has been received. We will review it and notify you of the next steps. ` +
        `Thank you for registering with the PCRAA System.`
      );

    case "training_approved":
      return (
        `Hello ${data.riderName}, your training application has been APPROVED. ` +
        `Your training is scheduled for ${data.trainingDate || "a date to be confirmed"}. ` +
        `Please report on time. - PCRAA System`
      );

    case "training_rejected":
      return (
        `Hello ${data.riderName}, unfortunately your training application has not been approved. ` +
        `Reason: ${data.rejectionReason || "Does not meet current requirements"}. ` +
        `You may re-apply after 30 days. - PCRAA System`
      );

    case "rin_issued":
      return (
        `Congratulations ${data.riderName}! Your Progressive Certified Riders of Africa Association (PCRAA) ` +
        `has been issued. Your PCRAA is: ${data.rin}. ` +
        `Please keep this safe. - PCRAA System`
      );

    case "payment_confirmed":
      return (
        `Hello ${data.riderName}, your payment of ${data.amount} has been confirmed. ` +
        `Reference: ${data.reference}. Your application is now being processed. ` +
        `- PCRAA System`
      );

    default:
      return `Hello ${data.riderName}, you have a new update from the PCRAA System.`;
  }
}

export interface SMSTemplateData {
  riderName: string;
  reference?: string;
  trainingDate?: string;
  rejectionReason?: string;
  rin?: string;
  amount?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalize phone to international format.
 * Handles: 0244000000 → +233244000000
 */
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("0")) return `+233${cleaned.slice(1)}`; // Ghana default
  return `+${cleaned}`;
}