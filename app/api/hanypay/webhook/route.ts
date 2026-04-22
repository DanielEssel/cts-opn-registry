/**
 * app/api/hanypay/webhook/route.ts
 * Receives payment confirmation callbacks from Hanypay.
 */

import { NextRequest, NextResponse } from "next/server";
import { doc, query, collection, where, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { parseWebhookPayload } from "@/lib/hanypay-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = parseWebhookPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (payload.status === "success") {
      // Find the pre-registration by payment reference and mark as paid
      const q = query(
        collection(db, "pre_registrations"),
        where("paymentReference", "==", payload.reference)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        await updateDoc(doc(db, "pre_registrations", snap.docs[0].id), {
          paymentStatus:    "paid",
          paymentTxnId:     payload.transaction_id,
          paymentConfirmedAt: serverTimestamp(),
          updatedAt:        serverTimestamp(),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}