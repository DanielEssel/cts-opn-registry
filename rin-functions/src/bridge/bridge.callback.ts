import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { sendSMS, buildSMSMessage } from "../services/hubtel.service";
import { db } from "../firebase";



export const bridgeCallback = onRequest(
  {
    region: "europe-west2",
    cors: true,
  },
  async (req, res): Promise<void> => {
    try {
      const {
        trans_ref,
        trans_status,
        trans_id,
        amount,
      } = req.body;

      console.log("Bridge Callback:", JSON.stringify(req.body, null, 2));

      if (!trans_ref || !trans_status) {
        console.error("Invalid Bridge callback payload.");
        res.status(400).json({
          success: false,
          message: "Invalid callback payload.",
        });
        return;
      }

      const paymentRef = db.collection("payments").doc(trans_ref);
      const paymentSnap = await paymentRef.get();

      if (!paymentSnap.exists) {
        console.warn(`Payment ${trans_ref} not found.`);
        res.status(200).json({ success: true });
        return;
      }

      const payment = paymentSnap.data()!;

      // Prevent duplicate processing if Bridge retries the callback
      if (
        payment.status === "success" &&
        payment.transactionId === trans_id
      ) {
        console.log(`Payment ${trans_ref} already processed.`);
        res.status(200).json({ success: true });
        return;
      }

      switch (trans_status) {
        case "000":
          await paymentRef.update({
            status: "success",
            bridgeStatus: trans_status,
            transactionId: trans_id,
            amountPaid: Number(amount),
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            callbackPayload: req.body,
          });

          if (payment.phone) {
            await sendSMS({
              to: payment.phone,
              message: buildSMSMessage("payment_confirmed", {
                riderName: payment.riderName,
                reference: trans_ref,
                amount: `GHS ${amount}`,
              }),
            });

            await sendSMS({
              to: payment.phone,
              message: buildSMSMessage(
                "application_confirmation",
                {
                  riderName: payment.riderName,
                  reference: payment.preRegId,
                }
              ),
            });
          }

          break;

        case "001":
          await paymentRef.update({
            status: "failed",
            bridgeStatus: trans_status,
            callbackPayload: req.body,
          });
          break;

        case "002":
          await paymentRef.update({
            status: "pending",
            bridgeStatus: trans_status,
            callbackPayload: req.body,
          });
          break;

        case "003":
          await paymentRef.update({
            status: "cancelled",
            bridgeStatus: trans_status,
            callbackPayload: req.body,
          });
          break;

        default:
          console.warn(`Unknown Bridge status: ${trans_status}`);

          await paymentRef.update({
            bridgeStatus: trans_status,
            callbackPayload: req.body,
          });
      }

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error("Bridge callback error:", error);

      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
);