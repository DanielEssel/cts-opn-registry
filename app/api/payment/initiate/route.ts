import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

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

const BRIDGE_BASE_URL  = "https://api.bridgeagw.com";
const BRIDGE_CALLBACK  = "https://europe-west2-cts-rin-registry.cloudfunctions.net/bridgeCallback";
const BRIDGE_LANDING   = "https://rin.thectsafrica.com/payment-complete";
const REGISTRATION_FEE = 400;

const NETWORK_MAP: Record<string, string> = {
  MTN:        "MTN",
  VODAFONE:   "VOD",
  AIRTELTIGO: "AIR",
};

function getBridgeAuth(): string {
  const key    = process.env.BRIDGE_CLIENT_KEY;
  const secret = process.env.BRIDGE_SECRET_KEY;
  if (!key || !secret) throw new Error("Bridge credentials not configured.");
  return Buffer.from(`${key}:${secret}`).toString("base64");
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("233")) return cleaned;
  if (cleaned.startsWith("0"))   return `233${cleaned.slice(1)}`;
  return cleaned;
}

function requestTime(): string {
  const now = new Date();
  return (
    now.getFullYear() +
    "-" + String(now.getMonth() + 1).padStart(2, "0") +
    "-" + String(now.getDate()).padStart(2, "0") +
    " " + String(now.getHours()).padStart(2, "0") +
    ":" + String(now.getMinutes()).padStart(2, "0")
  );
}

export async function POST(req: NextRequest) {
  let body: {
    phone:         string;
    network:       string;   // "MTN" | "VODAFONE" | "AIRTELTIGO" from the form
    transactionId: string;
    preRegId:      string;
    riderName:     string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { phone, network, transactionId, preRegId, riderName } = body;

  if (!phone || !network || !transactionId) {
    return NextResponse.json(
      { success: false, error: "Missing required fields." },
      { status: 400 }
    );
  }

  const bridgeNetwork = NETWORK_MAP[network] ?? network;
  const serviceId     = process.env.BRIDGE_SERVICE_ID;

  if (!serviceId) {
    return NextResponse.json(
      { success: false, error: "Payment service not configured." },
      { status: 500 }
    );
  }

  // ── CRITICAL: Create the Firestore doc BEFORE calling Bridge ─────────────
  // bridgeCallback checks if this doc exists — if it doesn't, it returns 200
  // silently and the payment confirmation is lost forever.
  const db = getAdminDb();
  try {
    await db.collection("payments").doc(transactionId).set({
      transactionId,
      preRegId:    preRegId ?? null,
      riderName:   riderName ?? null,
      phone:       normalizePhone(phone),
      network:     bridgeNetwork,
      amount:      REGISTRATION_FEE,
      status:      "pending",            // bridgeCallback will update this
      bridgeStatus: null,
      createdAt:   FieldValue.serverTimestamp(),
      updatedAt:   FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("[initiate] Failed to create Firestore payment doc:", err);
    return NextResponse.json(
      { success: false, error: "Could not initialise payment. Please try again." },
      { status: 500 }
    );
  }

  // ── Call Bridge /make_payment ──────────────────────────────────────────────
  let bridgeRes: Response;
  try {
    bridgeRes = await fetch(`${BRIDGE_BASE_URL}/make_payment`, {
      method: "POST",
      headers: {
        Authorization:  `Basic ${getBridgeAuth()}`,
        "Content-Type": "application/json",
        "User-Agent":   "PCRAA/1.0",
      },
      body: JSON.stringify({
        service_id:      Number(serviceId),
        reference:       "PCRAA Rider Registration",
        customer_number: normalizePhone(phone),
        transaction_id:  transactionId,
        trans_type:      "CTM",
        amount:          REGISTRATION_FEE,
        nw:              bridgeNetwork,
        nickname:        riderName || "Rider",
        payment_option:  "MOM",
        currency_code:   "GHS",
        currency_val:    "1",
        callback_url:    BRIDGE_CALLBACK,
        request_time:    requestTime(),
        landing_page:    BRIDGE_LANDING,
      }),
    });
  } catch (err) {
    console.error("[initiate] Bridge network error:", err);
    // Mark the doc as failed so polling doesn't wait forever
    await db.collection("payments").doc(transactionId).update({
      status:    "failed",
      updatedAt: FieldValue.serverTimestamp(),
    }).catch(() => {});
    return NextResponse.json(
      { success: false, error: "Could not reach payment service. Please try again." },
      { status: 502 }
    );
  }

  let data: { response_code: string; response_message: string };
  try {
    data = await bridgeRes.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Unexpected response from payment service." },
      { status: 502 }
    );
  }

  // ── Interpret Bridge response ──────────────────────────────────────────────
  const accepted = data.response_code === "202" || data.response_code === "000";

  if (!accepted) {
    const errorMessages: Record<string, string> = {
      "402": "Insufficient balance in payment account. Please contact support.",
      "016": "Payment amount exceeds the allowed limit.",
      "019": "Phone number not supported for mobile money.",
      "219": "Duplicate payment request. Please refresh and try again.",
      "100": "Payment service authentication failed. Please contact support.",
      "429": "Too many requests. Please wait a moment and try again.",
    };

    // Mark the pending doc as failed
    await db.collection("payments").doc(transactionId).update({
      status:      "failed",
      bridgeCode:  data.response_code,
      updatedAt:   FieldValue.serverTimestamp(),
    }).catch(() => {});

    return NextResponse.json(
      {
        success: false,
        error: errorMessages[data.response_code] ??
          `Payment could not be initiated (${data.response_code}). Please try again.`,
      },
      { status: 400 }
    );
  }

  console.log(`[initiate] Payment queued: ${transactionId} | Bridge: ${data.response_code}`);
  return NextResponse.json({ success: true });
}