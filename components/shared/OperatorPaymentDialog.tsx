"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth";
import {
  Loader2, Smartphone, Banknote, CheckCircle2,
  AlertCircle, X, Zap, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { initiatePayment, verifyPayment } from "@/lib/bridge-service";
import {
  isValidGhanaPhone, detectNetwork, formatForDisplay,
} from "@/lib/ghana-phone";

const REGISTRATION_FEE_GHS = 2; // match your live fee

type Method = "momo" | "cash";
type Stage  = "choose" | "momo_input" | "momo_pending" | "cash_confirm";

export interface OperatorPaymentResult {
  method: "momo" | "cash";
  paymentReference: string;
  paymentTxnId?: string;
  paymentAmount: number;
}

interface Props {
  applicantPhone: string;   // pre-fill from bio-data step
  applicantName: string;
  onComplete: (result: OperatorPaymentResult) => void;
  onCancel: () => void;
}

const NETWORKS: { id: string; label: string; color: string }[] = [
  { id: "MTN",        label: "MTN",      color: "#FFC107" },
  { id: "VODAFONE",   label: "Telecel",  color: "#E53935" },
  { id: "AIRTELTIGO", label: "AirtelTigo", color: "#1565C0" },
];
const DETECTED_TO_UI: Record<string, string> = {
  MTN: "MTN", TELECEL: "VODAFONE", AIRTELTIGO: "AIRTELTIGO",
};

export function OperatorPaymentDialog({
  applicantPhone, applicantName, onComplete, onCancel,
}: Props) {
  const [stage, setStage]       = useState<Stage>("choose");
  const [network, setNetwork]   = useState<string>("");
  const [momoPhone, setMomoPhone] = useState(applicantPhone);
  const [error, setError]       = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  useEffect(() => {
    const cleaned = momoPhone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      const detected = detectNetwork(cleaned);
      if (detected && !network) setNetwork(DETECTED_TO_UI[detected] ?? "");
      setPhoneError(isValidGhanaPhone(cleaned) ? "" : "Invalid Ghana number");
    } else {
      setPhoneError("");
    }
  }, [momoPhone, network]);

  const detected = momoPhone.replace(/\D/g, "").length === 10
    ? detectNetwork(momoPhone.replace(/\D/g, "")) : null;

  // ── MoMo ─────────────────────────────────────────────────────────────────
  function startPolling(ref: string, count = 0) {
    if (count >= 12) {
      setStage("momo_input");
      setError("Payment timed out. Ask the applicant to try again.");
      return;
    }
    pollRef.current = setTimeout(async () => {
      const v = await verifyPayment(ref);
      if (v.status === "success") {
        onComplete({
          method: "momo",
          paymentReference: ref,
          paymentTxnId: v.transactionId,
          paymentAmount: REGISTRATION_FEE_GHS,
        });
      } else if (v.status === "failed") {
        setStage("momo_input");
        setError("Payment declined or cancelled.");
      } else {
        setPollCount(count + 1);
        startPolling(ref, count + 1);
      }
    }, 5000);
  }

  async function handleMomo() {
    const phone = momoPhone.replace(/\D/g, "");
    if (!isValidGhanaPhone(phone)) { setPhoneError("Invalid Ghana number"); return; }
    if (!network) { setError("Select the applicant's network"); return; }

    setStage("momo_pending");
    setError(""); setPollCount(0);

    const res = await initiatePayment({
      phone, network: network as any,
      preRegId: `OP-${Date.now()}`,
      riderName: applicantName,
      email: `rider.${phone}@rinsystem.gh`,
    });

    if (!res.success) {
      setStage("momo_input");
      setError(res.error ?? "Could not send prompt. Try again.");
      return;
    }
    startPolling(res.reference);
  }

  // ── Cash ─────────────────────────────────────────────────────────────────
  function handleCash() {
    const auth = getAuth();
    const uid  = auth.currentUser?.uid ?? "unknown";
    onComplete({
      method: "cash",
      paymentReference: `CASH-${uid}-${Date.now()}`,
      paymentAmount: REGISTRATION_FEE_GHS,
    });
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Collect Payment</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              GHS {REGISTRATION_FEE_GHS.toFixed(2)} · {applicantName}
            </p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Choose method */}
        {stage === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => setStage("momo_input")}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Charge Mobile Money</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Send a prompt to the applicant's phone
                </div>
              </div>
            </button>

            <button
              onClick={() => setStage("cash_confirm")}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Record Cash Payment</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Cash collected in person
                </div>
              </div>
            </button>
          </div>
        )}

        {/* MoMo input */}
        {stage === "momo_input" && (
          <div className="space-y-4">
            <button onClick={() => setStage("choose")}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 block">
                Applicant's MoMo Number
              </label>
              <div className="relative">
                <input
                  type="tel" value={momoPhone} maxLength={10}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setMomoPhone(d);
                    if (d.length < 10) setNetwork("");
                  }}
                  placeholder="0244000000"
                  className={`w-full h-12 px-4 rounded-xl border font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-100 ${
                    phoneError ? "border-red-400" : "border-slate-200 focus:border-emerald-500"
                  }`}
                />
                {detected && !phoneError && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                    <Zap className="w-2.5 h-2.5" />{detected}
                  </span>
                )}
              </div>
              {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 block">
                Network
              </label>
              <div className="grid grid-cols-3 gap-2">
                {NETWORKS.map((n) => (
                  <button key={n.id} onClick={() => setNetwork(n.id)}
                    className={`py-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                      network === n.id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600"
                    }`}>
                    <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1.5"
                      style={{ background: n.color }} />
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <Button
              onClick={handleMomo}
              disabled={momoPhone.length < 10 || !!phoneError || !network}
              className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 rounded-xl"
            >
              Send Prompt · GHS {REGISTRATION_FEE_GHS.toFixed(2)}
            </Button>
          </div>
        )}

        {/* MoMo pending */}
        {stage === "momo_pending" && (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="relative w-16 h-16 mb-5">
              <div className="absolute inset-0 rounded-full border-[3px] border-emerald-100" />
              <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
              <Smartphone className="absolute inset-0 m-auto w-6 h-6 text-emerald-600" />
            </div>
            <p className="font-semibold text-slate-900">Waiting for approval</p>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Ask the applicant to approve the GHS {REGISTRATION_FEE_GHS.toFixed(2)} prompt on{" "}
              <span className="font-mono font-semibold">{formatForDisplay(momoPhone)}</span>.
            </p>
            <p className="text-xs text-slate-400 mt-4">
              {Math.max(0, 60 - pollCount * 5)}s remaining
            </p>
            <button
              onClick={() => {
                if (pollRef.current) clearTimeout(pollRef.current);
                setStage("momo_input");
              }}
              className="text-xs text-slate-500 underline mt-4"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Cash confirm */}
        {stage === "cash_confirm" && (
          <div className="space-y-4">
            <button onClick={() => setStage("choose")}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <Banknote className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-slate-900">Confirm Cash Received</span>
              </div>
              <p className="text-sm text-slate-600">
                Confirm you have collected{" "}
                <span className="font-bold">GHS {REGISTRATION_FEE_GHS.toFixed(2)}</span>{" "}
                in cash from {applicantName}. This will be recorded against your operator account.
              </p>
            </div>
            <Button onClick={handleCash}
              className="w-full h-12 bg-slate-800 hover:bg-slate-900 rounded-xl">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm Cash · GHS {REGISTRATION_FEE_GHS.toFixed(2)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}