import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import axios from "axios";
import { sendSMS, buildSMSMessage } from "../services/hubtel.service";

const db = admin.firestore();

// ── Define secrets (v2 way) ───────────────────────────────────────────────────
const PAYSTACK_SECRET_KEY = defineSecret("PAYSTACK_SECRET_KEY");

// Paystack network codes for Ghana MoMo
const NETWORK_MAP: Record<string, string> = {
  MTN: "mtn",
  VODAFONE: "vod",
  AIRTELTIGO: "tgo",
};

// ── 1. Initiate Ghana MoMo Charge ─────────────────────────────────────────────
export const initiateMomoCharge = onCall(
  { secrets: [PAYSTACK_SECRET_KEY],
    cors:true,
    region: ["europe-west2"] // Ensure this matches your function's deployment region
   },

  async (request) => {
    const secretKey = PAYSTACK_SECRET_KEY.value();

    if (!secretKey) {
      throw new HttpsError(
        "internal",
        "Payment service is not configured. Secret key missing."
      );
    }

    const {
      phone,
      network,
      preRegId,
      riderName,
      email,
      amountGHS,
    } = request.data as {
      phone: string;
      network: string;
      preRegId: string;
      riderName: string;
      email: string;
      amountGHS: number;
    };

    if (!phone || !network || !email) {
      throw new HttpsError(
        "invalid-argument",
        "phone, network, and email are required."
      );
    }

    const paystackNetwork = NETWORK_MAP[network];
    if (!paystackNetwork) {
      throw new HttpsError(
        "invalid-argument",
        `Unsupported network: ${network}. Must be MTN, VODAFONE, or AIRTELTIGO.`
      );
    }

    const amountPesewas = Math.round(amountGHS * 100);
    const reference = `PCRAA-${preRegId}-${Date.now()}`;

    try {
      const response = await axios.post(
        "https://api.paystack.co/charge",
        {
          email,
          amount: amountPesewas,
          currency: "GHS",
          reference,
          mobile_money: {
            phone: normalizePhone(phone),
            provider: paystackNetwork,
          },
          metadata: { preRegId, riderName, phone, network },
        },
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data;

      await db.collection("payments").doc(reference).set({
        reference,
        preRegId,
        riderName,
        phone,
        email,
        network,
        amountGHS,
        amountPesewas,
        status: "pending",
        paystackStatus: result.data?.status,
        initiatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        reference,
        status: result.data?.status,
        displayText: result.data?.display_text || null,
      };
    } catch (error: any) {
      console.error(
        "Paystack charge error:",
        error?.response?.data || error.message
      );
      throw new HttpsError(
        "internal",
        error?.response?.data?.message || "Failed to initiate payment."
      );
    }
  }
);

// ── 2. Check MoMo Charge Status ───────────────────────────────────────────────
export const checkMomoStatus = onCall(
  { secrets: [PAYSTACK_SECRET_KEY],
    cors:true,
    region: ["europe-west2"] // Ensure this matches your function's deployment region 
   },
  async (request) => {
    const secretKey = PAYSTACK_SECRET_KEY.value();

    if (!secretKey) {
      throw new HttpsError(
        "internal",
        "Payment service is not configured. Secret key missing."
      );
    }

    const { reference } = request.data as { reference: string };

    if (!reference) {
      throw new HttpsError("invalid-argument", "reference is required.");
    }

    try {
      const response = await axios.get(
        `https://api.paystack.co/charge/${encodeURIComponent(reference)}`,
        {
          headers: { Authorization: `Bearer ${secretKey}` },
        }
      );

      const chargeData = response.data.data;
      const paystackStatus: string = chargeData.status;
      const transactionId: string = chargeData.id?.toString() || "";

      const paymentRef = db.collection("payments").doc(reference);
      const paymentDoc = await paymentRef.get();

      if (!paymentDoc.exists) {
        return { status: "pending", transactionId: "", reference };
      }

      const paymentData = paymentDoc.data()!;

      if (paymentData.status !== "success" && paystackStatus === "success") {
        await paymentRef.update({
          status: "success",
          paystackStatus,
          transactionId,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        if (paymentData.phone) {
          const paymentMsg = buildSMSMessage("payment_confirmed", {
            riderName: paymentData.riderName,
            reference,
            amount: `GHS ${paymentData.amountGHS}`,
          });
          await sendSMS({ to: paymentData.phone, message: paymentMsg });

          const appMsg = buildSMSMessage("application_confirmation", {
            riderName: paymentData.riderName,
            reference: paymentData.preRegId,
          });
          await sendSMS({ to: paymentData.phone, message: appMsg });
        }
      } else if (paystackStatus === "failed") {
        await paymentRef.update({
          status: "failed",
          paystackStatus,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return {
        status:
          paystackStatus === "success"
            ? "success"
            : paystackStatus === "failed"
            ? "failed"
            : "pending",
        transactionId,
        reference,
      };
    } catch (error: any) {
      console.error(
        "Paystack status check error:",
        error?.response?.data || error.message
      );
      return { status: "pending", transactionId: "", reference };
    }
  }
);

// ── Helper ────────────────────────────────────────────────────────────────────
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return `+233${cleaned.slice(1)}`;
  return `+233${cleaned}`;
}