"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  doc, updateDoc, addDoc, collection, serverTimestamp,
} from "firebase/firestore";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, Loader2, Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BulkRenewRider {
  id:                   string;
  fullName:             string;
  RIN:                  string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

type Phase = "confirm" | "processing" | "done";

// ─── Component ────────────────────────────────────────────────────────────────

export function BulkRenewModal({
  open, riders = [], adminRole, onOpenChange, onSuccess,
}: BulkRenewModalProps) {

  const [phase,     setPhase]     = useState<Phase>("confirm");
  const [results,   setResults]   = useState<RenewalResult[]>([]);
  const [current,   setCurrent]   = useState(0); // index being processed
  const [processing,setProcessing]= useState(false);

  const total     = riders.length;
  const succeeded = results.filter((r) => r.success).length;
  const failed    = results.filter((r) => !r.success).length;
  const progress  = total > 0 ? Math.round((results.length / total) * 100) : 0;

  // ── Ineligible riders (already expired or suspended) ─────────────────────
  // Only Suspended riders are ineligible — Expired, Active, Pending can all be renewed
  const ineligible = riders.filter((r) => r.status === "Suspended");
  const eligible   = riders.filter((r) => r.status !== "Suspended");


  // ── Process renewals sequentially ────────────────────────────────────────
  const handleRenewAll = async () => {
    if (processing) return;
    setPhase("processing");
    setProcessing(true);
    setResults([]);
    setCurrent(0);

    const user = auth.currentUser;
    const now  = new Date();

    for (let i = 0; i < eligible.length; i++) {
      const rider = eligible[i];
      setCurrent(i + 1);

      try {
        // Renewal date: from today (or from existing expiry if still future)
        const baseDate =
          rider.expiryDate && new Date(rider.expiryDate) > now
            ? new Date(rider.expiryDate)
            : now;

        const newIssueDate  = toISO(now);
        const newExpiryDate = toISO(addMonths(baseDate, 12));

        await updateDoc(doc(db, "riders", rider.id), {
          issueDate:  newIssueDate,
          expiryDate: newExpiryDate,
          status:     "Active",
          updatedAt:  serverTimestamp(),
        });

        await addDoc(collection(db, "renewals"), {
          riderId:        rider.id,
          riderName:      rider.fullName,
          RIN:            rider.RIN,
          district:       rider.districtMunicipality,
          previousExpiry: rider.expiryDate ?? null,
          newIssueDate,
          newExpiryDate,
          renewedBy:      user?.uid ?? "",
          renewedByRole:  adminRole ?? "",
          status:         "Active",
          renewedAt:      serverTimestamp(),
        });

        await addDoc(collection(db, "audit_logs"), {
          type:      "RENEW",
          adminUid:  user?.uid ?? "",
          adminRole: adminRole ?? "",
          action:    `Bulk renewed permit`,
          target:    rider.fullName,
          targetId:  rider.id,
          RIN:       rider.RIN,
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

      // Small delay so UI updates are visible per rider
      await new Promise((res) => setTimeout(res, 150));
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
                    {total} rider{total !== 1 ? "s" : ""} selected
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">

              {/* Summary */}
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
                    Skipped (ineligible)
                  </p>
                </div>
              </div>

              {/* Renewal terms */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Renewal terms</p>
                <p>• Each permit extended by <span className="font-semibold">12 months</span></p>
                <p>• Active permits extended from their current expiry date</p>
                <p>• Pending permits start from today</p>
                <p>• RINs are never changed</p>
              </div>

              {/* Ineligible warning */}
              {ineligible.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-700">
                      <p className="font-semibold mb-1">
                        {ineligible.length} rider{ineligible.length !== 1 ? "s" : ""} will be skipped
                      </p>
                      <p className="text-amber-600">
                        Suspended riders cannot be bulk renewed.
                        Use individual renewal to handle them case by case.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {eligible.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-red-700">No eligible riders to renew</p>
                  <p className="text-xs text-red-500 mt-1">All selected riders are Suspended and cannot be bulk renewed.</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={eligible.length === 0}
                onClick={handleRenewAll}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Renew {eligible.length} Permit{eligible.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </>
        )}

        {/* ── PROCESSING PHASE ── */}
        {phase === "processing" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">Renewing permits…</DialogTitle>
              <DialogDescription className="text-xs">
                Processing {current} of {eligible.length}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <Progress value={progress} className="h-2" />

              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  {current <= eligible.length
                    ? `Renewing ${eligible[current - 1]?.fullName ?? "…"}`
                    : "Finishing up…"}
                </p>
              </div>

              {/* Live result list */}
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {results.map((r) => (
                  <div
                    key={r.rider.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                      r.success
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {r.success
                      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      : <XCircle     className="h-3.5 w-3.5 shrink-0" />}
                    <span className="font-medium truncate">{r.rider.fullName}</span>
                    <span className="ml-auto font-mono shrink-0">{r.rider.RIN}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── DONE PHASE ── */}
        {phase === "done" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  failed === 0 ? "bg-green-100" : "bg-amber-100"
                }`}>
                  {failed === 0
                    ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                    : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                </div>
                <div>
                  <DialogTitle className="text-base">
                    {failed === 0 ? "All permits renewed" : "Renewal complete"}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {succeeded} succeeded · {failed} failed · {ineligible.length} skipped
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-2 space-y-3">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <Stat value={succeeded} label="Renewed"   color="text-green-600 bg-green-50" />
                <Stat value={failed}    label="Failed"    color={failed > 0 ? "text-red-600 bg-red-50" : "text-slate-400 bg-slate-50"} />
                <Stat value={ineligible.length} label="Skipped" color={ineligible.length > 0 ? "text-amber-600 bg-amber-50" : "text-slate-400 bg-slate-50"} />
              </div>

              {/* Failed riders */}
              {failed > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  <p className="text-xs font-semibold text-red-700 px-1">Failed renewals</p>
                  {results.filter((r) => !r.success).map((r) => (
                    <div key={r.rider.id} className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg text-xs text-red-700">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium truncate">{r.rider.fullName}</span>
                      <span className="ml-auto text-red-400 truncate max-w-[120px]">{r.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button className="w-full bg-green-700 hover:bg-green-800 mt-2" onClick={handleClose}>
              Done
            </Button>
          </>
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