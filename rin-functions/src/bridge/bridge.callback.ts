// rin-functions/src/bridge/bridge.callback.ts

import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { sendSMS, buildSMSMessage } from "../services/hubtel.service";
import { db } from "../firebase";

// Bridge trans_status → Firestore status
const STATUS_MAP: Record<string, string> = {
  "000": "success",
  "001": "failed",
  "002": "pending",
  "003": "cancelled",
};

export const bridgeCallback = onRequest(
  { region: "europe-west2", cors: true },
  async (req, res): Promise<void> => {
    const { trans_ref, trans_status, trans_id, amount } = req.body;

    console.log("[bridgeCallback] received:", JSON.stringify(req.body, null, 2));

    // ── 1. Validate payload ──────────────────────────────────────────────────
    if (!trans_ref || !trans_status) {
      console.error("[bridgeCallback] missing trans_ref or trans_status");
      res.status(400).json({ success: false, message: "Invalid payload." });
      return;
    }

    // ── 2. Fetch payment document ────────────────────────────────────────────
    const paymentRef = db.collection("payments").doc(trans_ref);
    let paymentSnap: FirebaseFirestore.DocumentSnapshot;

    try {
      paymentSnap = await paymentRef.get();
    } catch (err) {
      console.error("[bridgeCallback] Firestore read failed:", err);
      res.status(500).json({ success: false, message: "Database read failed." });
      return;
    }

    // Not found — acknowledge 200 so Bridge stops retrying this callback.
    if (!paymentSnap.exists) {
      console.warn(`[bridgeCallback] payment ${trans_ref} not found — acknowledging.`);
      res.status(200).json({ success: true, note: "not_found" });
      return;
    }

    const payment = paymentSnap.data()!;

    // ── 3. Duplicate guard ───────────────────────────────────────────────────
    // Bridge may retry callbacks. If we already processed this exact
    // transaction, acknowledge immediately without touching Firestore.
    if (payment.status === "success" && payment.transactionId === trans_id) {
      console.log(`[bridgeCallback] ${trans_ref} already processed — skipping.`);
      res.status(200).json({ success: true, note: "already_processed" });
      return;
    }

    // ── 4. Write status to Firestore ─────────────────────────────────────────
    // This is the only operation that MUST succeed.
    // A failure here returns 500 so Bridge retries the callback.
    const localStatus = STATUS_MAP[trans_status] ?? "unknown";

    const baseUpdate = {
      bridgeStatus:    trans_status,
      localStatus,
      callbackPayload: req.body,
      updatedAt:       admin.firestore.FieldValue.serverTimestamp(),
    };

    const successUpdate = {
      ...baseUpdate,
      status:        "success",
      transactionId: trans_id,
      amountPaid:    Number(amount),
      paidAt:        admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      if (trans_status === "000") {
        await paymentRef.update(successUpdate);
        console.log(`[bridgeCallback] ✅ ${trans_ref} → success`);
      } else {
        await paymentRef.update({ ...baseUpdate, status: localStatus });
        console.log(`[bridgeCallback] ${trans_ref} → ${localStatus}`);
      }
    } catch (firestoreError) {
      // Fatal — return 500 so Bridge retries until it lands.
      console.error("[bridgeCallback] ❌ Firestore write failed:", firestoreError);
      res.status(500).json({ success: false, message: "Database write failed." });
      return;
    }

    // ── 5. Respond 200 to Bridge immediately ─────────────────────────────────
    // Bridge's job is done the moment it gets this 200.
    // Nothing below this line can affect the payment record or Bridge's state.
    res.status(200).json({ success: true });

    // ── 6. SMS notifications — fully isolated side effect ────────────────────
    // Runs after the response is sent. A crash or missing Hubtel credentials
    // here is logged but cannot affect the payment status or Bridge's retry logic.
    if (trans_status === "000" && payment.phone) {
      try {
        await sendSMS({
          to: payment.phone,
          message: buildSMSMessage("payment_confirmed", {
            riderName: payment.riderName ?? "Rider",
            reference: trans_ref,
            amount:    `GHS ${amount}`,
          }),
        });

        await sendSMS({
          to: payment.phone,
          message: buildSMSMessage("application_confirmation", {
            riderName: payment.riderName ?? "Rider",
            reference: payment.preRegId  ?? trans_ref,
          }),
        });

        console.log(`[bridgeCallback] 📱 SMS sent to ${payment.phone}`);
      } catch (smsError) {
        // Non-fatal. Add HUBTEL_CLIENT_ID + HUBTEL_CLIENT_SECRET to
        // Firebase secrets when ready: firebase functions:secrets:set HUBTEL_CLIENT_ID
        console.error(
          `[bridgeCallback] ⚠️ SMS failed for ${trans_ref} — payment already recorded:`,
          smsError,
        );
      }
    }
  },
);