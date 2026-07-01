import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { getTransactionStatus } from "./client"; 
import { db } from "../firebase";



export const BRIDGE_CLIENT_KEY = defineSecret("BRIDGE_CLIENT_KEY");
export const BRIDGE_SECRET_KEY = defineSecret("BRIDGE_SECRET_KEY");
export const BRIDGE_SERVICE_ID = defineSecret("BRIDGE_SERVICE_ID");


export const checkBridgePaymentStatus = onCall(
  {
    region: "europe-west2",
    secrets: [
      BRIDGE_CLIENT_KEY,
      BRIDGE_SECRET_KEY,
      BRIDGE_SERVICE_ID,
    ],
  },
  async (request) => {
    const { reference } = request.data;

    if (!reference) {
      throw new HttpsError("invalid-argument", "reference is required");
    }

    const paymentRef = db.collection("payments").doc(reference);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      throw new HttpsError("not-found", "Payment not found");
    }

    const payment = paymentSnap.data()!;

    // 1. Call Bridge API safely
    const response = await getTransactionStatus(reference);

    const bridge = response?.data?.response_data;

    if (!bridge) {
      throw new HttpsError("internal", "Invalid Bridge response");
    }

    // 2. Map status ONCE (cleaner)
    const statusMap: Record<string, string> = {
      "000": "success",
      "001": "failed",
      "002": "pending",
      "003": "cancelled",
    };

    const newStatus = statusMap[bridge.status] ?? "unknown";

    // 3. Update Firestore ONLY if changed
    if (payment.bridgeStatus !== bridge.status) {
      await paymentRef.update({
        status: newStatus,
        bridgeStatus: bridge.status,
        transactionId: bridge.network_transaction_id || payment.transactionId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      status: bridge.status,
      description: bridge.status_desc,
      localStatus: newStatus,
      payment: paymentSnap.data(),
    };
  }
);