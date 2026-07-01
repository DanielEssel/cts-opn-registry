import axios from "axios";
import {  BRIDGE_SERVICE_ID, getBridgeHeaders } from "./client";

const BASE_URL = "https://api.bridgeagw.com";

export async function checkTransactionStatus(transactionId: string) {
  const res = await axios.post(
    `${BASE_URL}/get_transaction_status`,
    {
      service_id: Number(BRIDGE_SERVICE_ID.value()),
      transaction_id: transactionId,
    },
    {
      headers: getBridgeHeaders(),
    }
  );

  return res.data;
}