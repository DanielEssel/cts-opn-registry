import axios from "axios";
import { defineSecret } from "firebase-functions/params";

export const BRIDGE_CLIENT_KEY = defineSecret("BRIDGE_CLIENT_KEY");
export const BRIDGE_SECRET_KEY = defineSecret("BRIDGE_SECRET_KEY");
export const BRIDGE_SERVICE_ID = defineSecret("BRIDGE_SERVICE_ID");

const BASE_URL = "https://api.bridgeagw.com";

export function getBridgeHeaders() {
  const auth = Buffer.from(
    `${BRIDGE_CLIENT_KEY.value()}:${BRIDGE_SECRET_KEY.value()}`
  ).toString("base64");

  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    "User-Agent": "PCRAA/1.0",
  };
}

export function normalizePhone(phone: string) {
  const cleaned = phone.replace(/\s+/g, "").replace(/[^\d]/g, "");
  if (cleaned.startsWith("233")) return cleaned;
  if (cleaned.startsWith("0")) return `233${cleaned.substring(1)}`;
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

export async function makeMomoPayment(data: {
  phone: string;
  amount: number;
  network: string;
  transactionId: string;
  riderName?: string;         // ADD: used as nickname
}) {
  return axios.post(
    `${BASE_URL}/make_payment`,
    {
      service_id:      Number(BRIDGE_SERVICE_ID.value()),
      reference:       "PCRAA Rider Registration",
      customer_number: normalizePhone(data.phone),
      transaction_id:  data.transactionId,
      trans_type:      "CTM",
      amount:          data.amount,
      nw:              data.network,
      nickname:        data.riderName ?? "Rider",   // FIX: was missing
      payment_option:  "MOM",
      currency_code:   "GHS",
      currency_val:    "1",
      // FIX: was missing — Bridge needs this to fire the callback
      callback_url:    "https://europe-west2-cts-rin-registry.cloudfunctions.net/bridgeCallback",
      request_time:    requestTime(),
      landing_page:    "https://rin.thectsafrica.com/payment-complete",
    },
    { headers: getBridgeHeaders() }
  );
}

export async function getTransactionStatus(transactionId: string) {
  return axios.post(
    `${BASE_URL}/get_transaction_status`,
    {
      service_id:     Number(BRIDGE_SERVICE_ID.value()),
      transaction_id: transactionId,
      request_time:   requestTime(),   // FIX: was missing
    },
    { headers: getBridgeHeaders() }
  );
}