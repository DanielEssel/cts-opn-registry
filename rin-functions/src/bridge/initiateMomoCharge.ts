import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import {
  BRIDGE_CLIENT_KEY,
  BRIDGE_SECRET_KEY,
  BRIDGE_SERVICE_ID,
  makeMomoPayment,
} from "./client";
import { db } from "../firebase";


// Bridge response codes that mean "accepted / queued"
const ACCEPTED_CODES = new Set(["000", "202"]);

// User-facing messages for known Bridge error codes
const BRIDGE_ERROR_MESSAGES: Record<string, string> = {
  "402": "Insufficient balance in payment account. Please contact support.",
  "016": "Payment amount exceeds the allowed limit.",
  "019": "Phone number not supported for mobile money payments.",
  "219": "Duplicate payment request. Please refresh and try again.",
  "100": "Payment service authentication failed. Please contact support.",
  "429": "Too many requests. Please wait a moment and try again.",
  "500": "Payment service error. Please try again.",
};

export const initiateMomoCharge = onCall(
  {
    region: "europe-west2",
    secrets: [
      BRIDGE_CLIENT_KEY,
      BRIDGE_SECRET_KEY,
      BRIDGE_SERVICE_ID,
    ],
  },
  async (request) => {
    const { phone, network, transactionId, preRegId, riderName } =
      request.data as {
        phone:         string;
        network:       string;
        transactionId: string;
        preRegId:      string;
        riderName:     string;
      };

    // ── 1. Validate ───────────────────────────────────────────────────────────
    if (!phone || !network || !transactionId) {
      throw new HttpsError(
        "invalid-argument",
        "phone, network and transactionId are required."
      );
    }

    const validNetworks = ["MTN", "VOD", "AIR"];
    if (!validNetworks.includes(network)) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid network "${network}". Must be one of: ${validNetworks.join(", ")}.`
      );
    }

    // ── 2. Create Firestore doc BEFORE calling Bridge ─────────────────────────
    // bridgeCallback does paymentRef.get() — if the doc doesn't exist it returns
    // 200 silently and the payment confirmation is permanently lost.
    const paymentRef = db.collection("payments").doc(transactionId);

    try {
      await paymentRef.set({
        transactionId,
        preRegId:     preRegId  ?? null,
        riderName:    riderName ?? null,
        phone,
        network,
        amount:       1,
        status:       "pending",
        bridgeStatus: null,
        createdAt:    FieldValue.serverTimestamp(),
        updatedAt:    FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("[initiateMomoCharge] Firestore create failed:", err);
      throw new HttpsError(
        "internal",
        "Could not initialise payment record. Please try again."
      );
    }

    // ── 3. Call Bridge /make_payment ──────────────────────────────────────────
    let bridgeResponse: Awaited<ReturnType<typeof makeMomoPayment>>;
    try {
      bridgeResponse = await makeMomoPayment({
        phone,
        network,
        transactionId,
        riderName: riderName ?? "Rider",
        amount: 1,
      });
    } catch (err) {
      console.error("[initiateMomoCharge] Bridge call failed:", err);

      // Mark the doc so polling doesn't wait forever
      await paymentRef.update({
        status:    "failed",
        updatedAt: FieldValue.serverTimestamp(),
      }).catch(() => {});

      throw new HttpsError(
        "unavailable",
        "Could not reach payment service. Please try again."
      );
    }

    const responseCode: string =
      bridgeResponse?.data?.response_code ?? "500";
    const responseMessage: string =
      bridgeResponse?.data?.response_message ?? "Unknown error";

    // ── 4. Update Firestore with Bridge's response ────────────────────────────
    const accepted = ACCEPTED_CODES.has(responseCode);

    await paymentRef.update({
      bridgeCode:   responseCode,
      bridgeMessage: responseMessage,
      status:       accepted ? "pending" : "failed",
      updatedAt:    FieldValue.serverTimestamp(),
    }).catch((err) => {
      console.warn("[initiateMomoCharge] Firestore update after Bridge call failed:", err);
    });

    // ── 5. Return result to frontend ──────────────────────────────────────────
    if (!accepted) {
      const userMessage =
        BRIDGE_ERROR_MESSAGES[responseCode] ??
        `Payment could not be initiated (${responseCode}). Please try again.`;

      console.error(
        `[initiateMomoCharge] Bridge rejected payment: ${responseCode} — ${responseMessage}`
      );

      // Return success:false so bridge-service.ts surfaces the error to the widget
      // (don't throw HttpsError here — the widget handles the error shape itself)
      return {
        success:      false,
        transactionId,
        responseCode,
        message:      userMessage,
      };
    }

    console.log(
      `[initiateMomoCharge] Payment queued: ${transactionId} | ${responseCode}`
    );

    return {
      success:      true,
      transactionId,
      responseCode,
      message:      responseMessage,
    };
  }
);