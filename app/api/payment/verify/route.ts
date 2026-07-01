
import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

type VerifyStatus = "success" | "failed" | "pending";

function mapStatus(status: string | undefined): VerifyStatus {
  if (status === "success")   return "success";
  if (status === "failed")    return "failed";
  if (status === "cancelled") return "failed";   // treat cancelled as failed for UI
  return "pending";
}

export async function POST(req: NextRequest) {
  let body: { transactionId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "pending" }, { status: 400 });
  }

  const { transactionId } = body;
  if (!transactionId) {
    return NextResponse.json({ status: "pending" }, { status: 400 });
  }

  // ── Step 1: Read from Firestore "payments" collection ─────────────────────
  // Your bridgeCallback writes here when Bridge fires the webhook.
  // This is the fastest path — no extra network call needed.
  try {
    const db  = getAdminDb();
    // KEY FIX: "payments" not "bridge_payments"
    const doc = await db.collection("payments").doc(transactionId).get();

    if (doc.exists) {
      const data   = doc.data()!;
      const status = mapStatus(data.status);

      if (status !== "pending") {
        // Definitive result from callback — stop polling immediately
        return NextResponse.json({
          status,
          transactionId: data.transactionId ?? transactionId,
        });
      }

      // Doc exists but still pending — fall through to Cloud Function check
    }
  } catch (err) {
    console.warn("[verify] Firestore read failed, falling back:", err);
  }

  // ── Step 2: Call checkBridgePaymentStatus Cloud Function ──────────────────
  // This is the fallback when the callback hasn't fired yet.
  // It calls Bridge /get_transaction_status directly (with correct request_time).
  try {
    const { initializeApp: initClientApp, getApps: getClientApps } = await import("firebase/app");
    const { getFunctions, httpsCallable } = await import("firebase/functions");

    const firebaseConfig = {
      projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey:     process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    };

    const clientApp = getClientApps().length
      ? getClientApps()[0]
      : initClientApp(firebaseConfig);

    const functions       = getFunctions(clientApp, "europe-west2");
    const checkStatus     = httpsCallable(functions, "checkBridgePaymentStatus");
    const result          = await checkStatus({ reference: transactionId });
    const data            = result.data as {
      success: boolean;
      localStatus: string;
      status: string;
    };

    if (data?.success) {
      return NextResponse.json({
        status:        mapStatus(data.localStatus),
        transactionId,
      });
    }
  } catch (err) {
    console.warn("[verify] Cloud Function fallback failed:", err);
  }

  // ── Step 3: Still nothing — tell client to keep polling ───────────────────
  return NextResponse.json({ status: "pending" });
}