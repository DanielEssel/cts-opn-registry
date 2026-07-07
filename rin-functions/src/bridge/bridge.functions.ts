// rin-functions/src/bridge/bridge.functions.ts

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../firebase";

// Secrets no longer needed here — we only read Firestore.
// Bridge API is called by bridgeCallback, not by the poller.

export const checkMomoStatus = onCall(
  { region: "europe-west2" },
  async (request) => {
    const { reference } = request.data as { reference?: string };

    if (!reference) {
      throw new HttpsError("invalid-argument", "reference is required");
    }

    const paymentSnap = await db
      .collection("payments")
      .doc(reference)
      .get();

    if (!paymentSnap.exists) {
      // Not found yet — return pending so the poller keeps trying.
      // bridgeCallback might not have fired yet.
      console.warn(`[checkMomoStatus] payment ${reference} not found yet`);
      return {
        success: true,
        localStatus: "pending",
        status: null,
        payment: null,
      };
    }

    const payment = paymentSnap.data()!;
    const localStatus = payment.status as string; // "pending"|"success"|"failed"|"cancelled"

    console.log(`[checkMomoStatus] ${reference} → ${localStatus}`);

    return {
      success:     true,
      localStatus,
      status:      payment.bridgeStatus ?? null,
      description: payment.bridgeStatus === "000" ? "SUCCESSFUL" : null,
      payment: {
        transactionId:  payment.transactionId  ?? reference,
        amountPaid:     payment.amountPaid     ?? null,
        paidAt:         payment.paidAt         ?? null,
      },
    };
  }
);