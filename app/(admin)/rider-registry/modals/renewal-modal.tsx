"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection, doc, updateDoc,
  addDoc, serverTimestamp,
} from "firebase/firestore";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, CheckCircle2,
  Loader2, Calendar, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

// Minimal shape needed — works with both RiderRecord and RenewalCandidate
export interface RenewableRider {
  id:                   string;
  fullName:             string;
  phoneNumber:          string;
  RIN:                  string;
  vehicleCategory:      string;
  districtMunicipality: string;
  expiryDate?:          string;
  status:               string;
}

interface RenewRiderModalProps {
  open:         boolean;
  rider:        RenewableRider | null;
  adminRole?:   string;
  onOpenChange: (open: boolean) => void;
  onSuccess?:   (riderId: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERMIT_VALIDITY_MONTHS = 12;

const PAYMENT_METHODS = [
  { value: "momo",  label: "Mobile Money"  },
  { value: "bank",  label: "Bank Transfer" },
  { value: "cash",  label: "Cash"          },
];

function fmtDate(v: string | undefined | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RenewRiderModal({
  open, rider, adminRole, onOpenChange, onSuccess,
}: RenewRiderModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [processing,    setProcessing]    = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");

  const newExpiryDate = new Date();
  newExpiryDate.setMonth(newExpiryDate.getMonth() + PERMIT_VALIDITY_MONTHS);

  const daysUntilExpiry = rider?.expiryDate
    ? Math.ceil((new Date(rider.expiryDate).getTime() - Date.now()) / 86_400_000)
    : null;

  const handleClose = () => {
    if (processing) return;
    setError("");
    setSuccess("");
    setPaymentMethod("momo");
    onOpenChange(false);
  };

  const handleRenewal = async () => {
    if (!rider || !auth.currentUser) return;
    setProcessing(true);
    setError("");

    try {
      const newIssueDate = new Date();

      // ── 1. Update rider: only dates + status. RIN and QR never change. ──
      await updateDoc(doc(db, "riders", rider.id), {
        issueDate:  newIssueDate.toISOString(),
        expiryDate: newExpiryDate.toISOString(),
        status:     "Active",
        updatedAt:  serverTimestamp(),
      });

      // ── 2. Renewal record ────────────────────────────────────────────────
      await addDoc(collection(db, "renewals"), {
        riderId:        rider.id,
        riderName:      rider.fullName,
        RIN:            rider.RIN,
        paymentMethod,
        status:         "completed",
        renewedBy:      auth.currentUser.uid,
        renewedAt:      serverTimestamp(),
        previousExpiry: rider.expiryDate ?? null,
        newIssueDate:   newIssueDate.toISOString(),
        newExpiryDate:  newExpiryDate.toISOString(),
        district:       rider.districtMunicipality,
      });

      // ── 3. Audit log ─────────────────────────────────────────────────────
      await addDoc(collection(db, "audit_logs"), {
        type:      "RENEW",
        adminUid:  auth.currentUser.uid,
        adminRole: adminRole ?? "",
        action:    `Renewed — new expiry ${format(newExpiryDate, "dd MMM yyyy")}`,
        target:    rider.fullName,
        targetId:  rider.id,
        RIN:       rider.RIN,
        district:  rider.districtMunicipality,
        status:    "success",
        timestamp: serverTimestamp(),
      });

      setSuccess(`Renewed. New expiry: ${format(newExpiryDate, "dd MMM yyyy")}`);
      onSuccess?.(rider.id);
      setTimeout(handleClose, 1600);

    } catch (err) {
      console.error("Renewal error:", err);
      setError(err instanceof Error ? err.message : "Renewal failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (!rider) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl p-0 border-0 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-green-700 px-6 py-5">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Renew Permit
          </DialogTitle>
          <p className="text-xs text-green-200 mt-0.5 font-mono">{rider.RIN}</p>
        </div>

        <div className="p-5 space-y-4">

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
            </Alert>
          )}

          {/* Rider summary */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Rider</p>
              <p className="font-semibold text-slate-900 leading-tight">{rider.fullName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Phone</p>
              <p className="font-semibold text-slate-900">{rider.phoneNumber}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Vehicle</p>
              <p className="font-semibold text-slate-900">{rider.vehicleCategory}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">District</p>
              <p className="font-semibold text-slate-900 leading-tight">{rider.districtMunicipality || "—"}</p>
            </div>
          </div>

          {/* Current expiry warning */}
          {daysUntilExpiry !== null && (
            <div className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
              daysUntilExpiry <= 0
                ? "bg-red-50 border-red-200"
                : daysUntilExpiry <= 14
                ? "bg-orange-50 border-orange-200"
                : "bg-yellow-50 border-yellow-200"
            }`}>
              <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                daysUntilExpiry <= 0 ? "text-red-600" :
                daysUntilExpiry <= 14 ? "text-orange-600" : "text-yellow-600"
              }`} />
              <div>
                <p className="font-bold text-slate-900">
                  {daysUntilExpiry <= 0
                    ? "Permit already expired"
                    : `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Current expiry: {fmtDate(rider.expiryDate)}
                </p>
              </div>
            </div>
          )}

          {/* New validity preview */}
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            <Calendar className="h-4 w-4 text-green-700 shrink-0" />
            <div>
              <p className="font-bold text-green-900">New validity after renewal</p>
              <p className="text-green-700 text-xs mt-0.5">
                Today → {format(newExpiryDate, "dd MMM yyyy")} ({PERMIT_VALIDITY_MONTHS} months)
              </p>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5 block">
              Payment Method
            </label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            RIN and QR code remain unchanged — only issue and expiry dates are updated.
          </p>

          <DialogFooter className="gap-2 pt-1">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={processing}
              className="flex-1 h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenewal}
              disabled={processing || !!success}
              className="flex-1 h-10 bg-green-700 hover:bg-green-800"
            >
              {processing
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                : <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirm Renewal</>
              }
            </Button>
          </DialogFooter>
        </div>

      </DialogContent>
    </Dialog>
  );
}