"use client";
import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  doc, updateDoc, addDoc, setDoc, collection, serverTimestamp,
} from "firebase/firestore";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, Loader2, Users, Banknote,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BulkRenewRider {
  id:                   string;
  fullName:             string;
  PCRAA:                string;
  vehicleCategory:      string;
  districtMunicipality: string;
  expiryDate?:          string;
  status:               string;
}
interface RenewalResult {
  rider:   BulkRenewRider;
  success: boolean;
  error?:  string;
}
interface BulkRenewModalProps {
  open:        boolean;
  riders?:     BulkRenewRider[];
  adminRole?:  string;
  onOpenChange:(open: boolean) => void;
  onSuccess?:  (renewed: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PERMIT_VALIDITY_MONTHS = 6;    // matches single-rider renewal
const RENEWAL_FEE_GHS        = 100;  // per rider — update when fee changes

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Bulk is CASH ONLY by design: one collected total, one payment record.
// MoMo renewals are done per-rider in RenewRiderModal (prompt + polling
// doesn't scale to a queue of riders).
type Phase = "confirm" | "payment" | "processing" | "done";

// ─── Component ────────────────────────────────────────────────────────────────
export function BulkRenewModal({
  open, riders = [], adminRole, onOpenChange, onSuccess,
}: BulkRenewModalProps) {
  const [phase,      setPhase]      = useState<Phase>("confirm");
  const [results,    setResults]    = useState<RenewalResult[]>([]);
  const [current,    setCurrent]    = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [error,      setError]      = useState("");

  const total     = riders.length;
  const succeeded = results.filter((r) => r.success).length;
  const failed    = results.filter((r) => !r.success).length;

  // Only Suspended riders are ineligible — Expired, Active, Pending can renew
  const ineligible = riders.filter((r) => r.status === "Suspended");
  const eligible   = riders.filter((r) => r.status !== "Suspended");

  const progress = eligible.length > 0
    ? Math.round((results.length / eligible.length) * 100)
    : 0;

  const totalFee = eligible.length * RENEWAL_FEE_GHS;

  // ── Step 1: cash confirmed → create ONE bulk payment record ─────────────
  const handleCashConfirmed = async () => {
    const user = auth.currentUser;
    if (!user || eligible.length === 0) return;
    setProcessing(true);
    setError("");

    const ref = `CASH-BULK-${user.uid}-${Date.now()}`;

    try {
      await setDoc(doc(db, "payments", ref), {
        transactionId: ref,
        type:          "renewal_bulk",
        method:        "cash",
        status:        "success",
        amount:        totalFee,
        currency:      "GHS",
        feePerRider:   RENEWAL_FEE_GHS,
        riderCount:    eligible.length,
        riderIds:      eligible.map((r) => r.id),
        PCRAAs:        eligible.map((r) => r.PCRAA),
        collectedBy:   user.uid,
        source:        "operator",
        createdAt:     serverTimestamp(),
        paidAt:        serverTimestamp(),
      });

      setPaymentRef(ref);
      await runRenewals(ref);
    } catch (err: any) {
      setError(err?.message ?? "Could not record payment. Nothing was renewed.");
      setProcessing(false);
    }
  };

  // ── Step 2: process renewals sequentially, each referencing the payment ──
  const runRenewals = async (ref: string) => {
    setPhase("processing");
    setResults([]);
    setCurrent(0);

    const user = auth.currentUser;
    const now  = new Date();

    for (let i = 0; i < eligible.length; i++) {
      const rider = eligible[i];
      setCurrent(i + 1);
      try {
        // Extend from existing expiry if still in the future, else from today
        const baseDate =
          rider.expiryDate && new Date(rider.expiryDate) > now
            ? new Date(rider.expiryDate)
            : now;
        const newIssueDate  = toISO(now);
        const newExpiryDate = toISO(addMonths(baseDate, PERMIT_VALIDITY_MONTHS));

        await updateDoc(doc(db, "riders", rider.id), {
          issueDate:  newIssueDate,
          expiryDate: newExpiryDate,
          status:     "Active",
          updatedAt:  serverTimestamp(),
        });

        await addDoc(collection(db, "renewals"), {
          riderId:          rider.id,
          riderName:        rider.fullName,
          PCRAA:            rider.PCRAA,
          district:         rider.districtMunicipality,
          previousExpiry:   rider.expiryDate ?? null,
          newIssueDate,
          newExpiryDate,
          paymentMethod:    "cash",
          paymentReference: ref,               // shared bulk payment
          amount:           RENEWAL_FEE_GHS,
          currency:         "GHS",
          bulk:             true,
          renewedBy:        user?.uid ?? "",
          renewedByRole:    adminRole ?? "",
          status:           "completed",
          renewedAt:        serverTimestamp(),
        });

        await addDoc(collection(db, "audit_logs"), {
          type:      "RENEW",
          adminUid:  user?.uid ?? "",
          adminRole: adminRole ?? "",
          action:    `Bulk renewed (CASH, GHS ${RENEWAL_FEE_GHS}, ref ${ref})`,
          target:    rider.fullName,
          targetId:  rider.id,
          PCRAA:     rider.PCRAA,
          district:  rider.districtMunicipality,
          status:    "success",
          timestamp: serverTimestamp(),
        });

        setResults((prev) => [...prev, { rider, success: true }]);
      } catch (err: any) {
        setResults((prev) => [
          ...prev,
          { rider, success: false, error: err?.message ?? "Unknown error" },
        ]);
      }
      await new Promise((res) => setTimeout(res, 400));
    }
    setPhase("done");
    setProcessing(false);
  };

  const handleClose = () => {
    if (processing) return;
    if (phase === "done") onSuccess?.(succeeded);
    setPhase("confirm");
    setResults([]);
    setCurrent(0);
    setPaymentRef("");
    setError("");
    onOpenChange(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md rounded-2xl">

        {/* ── CONFIRM PHASE ── */}
        {phase === "confirm" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-base">Bulk Renew Permits</DialogTitle>
                  <DialogDescription className="text-xs">
                    {total} rider{total !== 1 ? "s" : ""} selected · {PERMIT_VALIDITY_MONTHS} months each
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{eligible.length}</p>
                  <p className="text-xs text-blue-500 font-medium mt-0.5">Will be renewed</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${ineligible.length > 0 ? "bg-amber-50" : "bg-slate-50"}`}>
                  <p className={`text-2xl font-bold ${ineligible.length > 0 ? "text-amber-600" : "text-slate-400"}`}>
                    {ineligible.length}
                  </p>
                  <p className={`text-xs font-medium mt-0.5 ${ineligible.length > 0 ? "text-amber-500" : "text-slate-400"}`}>
                    Suspended (skipped)
                  </p>
                </div>
              </div>

              {/* Fee summary */}
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div>
                  <p className="text-xs text-green-700 font-medium">
                    {eligible.length} × GHS {RENEWAL_FEE_GHS.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-green-600 mt-0.5">Cash payment · collected in person</p>
                </div>
                <p className="text-xl font-black text-green-800">
                  GHS {totalFee.toFixed(2)}
                </p>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Bulk renewals are cash only. For Mobile Money, renew riders individually.
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1 h-10">
                  Cancel
                </Button>
                <Button
                  onClick={() => setPhase("payment")}
                  disabled={eligible.length === 0}
                  className="flex-1 h-10 bg-green-700 hover:bg-green-800"
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Collect GHS {totalFee.toFixed(2)}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── PAYMENT PHASE (cash confirmation) ── */}
        {phase === "payment" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <DialogTitle className="text-base">Confirm Cash Received</DialogTitle>
                  <DialogDescription className="text-xs">
                    One payment covering {eligible.length} renewal{eligible.length !== 1 ? "s" : ""}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <p className="text-slate-600">
                  Confirm you have collected{" "}
                  <span className="font-bold text-slate-900">GHS {totalFee.toFixed(2)}</span>{" "}
                  in cash ({eligible.length} riders × GHS {RENEWAL_FEE_GHS.toFixed(2)}).
                  This will be recorded against your admin account, and all renewals
                  will reference this single payment.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setError(""); setPhase("confirm"); }}
                  disabled={processing}
                  className="flex-1 h-10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCashConfirmed}
                  disabled={processing}
                  className="flex-1 h-10 bg-green-700 hover:bg-green-800"
                >
                  {processing
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Recording…</>
                    : <><CheckCircle2 className="h-4 w-4 mr-2" /> Cash Received — Renew All</>
                  }
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── PROCESSING PHASE ── */}
        {phase === "processing" && (
          <div className="py-6 space-y-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Renewing permits…</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {current} of {eligible.length} · do not close this window
                </p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {results.map((r) => (
                <div key={r.rider.id} className="flex items-center gap-2 text-xs">
                  {r.success
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                  <span className="font-medium text-slate-700 truncate">{r.rider.fullName}</span>
                  <span className="text-slate-400 font-mono ml-auto">{r.rider.PCRAA}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DONE PHASE ── */}
        {phase === "done" && (
          <div className="py-4 space-y-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                failed === 0 ? "bg-green-100" : "bg-amber-100"
              }`}>
                {failed === 0
                  ? <CheckCircle2 className="h-6 w-6 text-green-600" />
                  : <AlertTriangle className="h-6 w-6 text-amber-600" />}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {succeeded} renewed{failed > 0 ? `, ${failed} failed` : ""}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Payment: GHS {totalFee.toFixed(2)} · ref{" "}
                  <span className="font-mono">{paymentRef}</span>
                </p>
              </div>
            </div>

            {failed > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 font-medium mb-1.5">
                  Payment was collected for all {eligible.length} riders, but {failed} renewal{failed !== 1 ? "s" : ""} failed.
                  Retry these individually or contact support with the payment reference above.
                </p>
                {results.filter((r) => !r.success).map((r) => (
                  <p key={r.rider.id} className="text-[11px] text-amber-700 font-mono">
                    {r.rider.PCRAA} — {r.error}
                  </p>
                ))}
              </div>
            )}

            <Button onClick={handleClose} className="w-full h-10 bg-green-700 hover:bg-green-800">
              Done
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className={`rounded-xl p-2.5 text-center ${color}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] font-medium mt-0.5">{label}</p>
    </div>
  );
}