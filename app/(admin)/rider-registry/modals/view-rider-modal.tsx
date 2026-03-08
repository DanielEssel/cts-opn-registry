"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User, Phone, CreditCard, Calendar, MapPin,
  Bike, FileText, Clock, AlertCircle,
  CheckCircle2, X, Printer,
} from "lucide-react";
import { type RiderRecord } from "@/lib/rider-service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ViewRiderModalProps {
  open:         boolean;
  rider:        (RiderRecord & { id: string }) | null;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(value: string | undefined | null, fallback = "—"): string {
  const d = safeDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  Active:    "bg-green-600 text-white",
  Pending:   "bg-yellow-500 text-white",
  Expired:   "bg-red-500 text-white",
  Suspended: "bg-slate-500 text-white",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ViewRiderModal({ open, rider, onOpenChange }: ViewRiderModalProps) {
  if (!rider) return null;

  const expiryDate  = safeDate(rider.expiryDate);
  const issueDate   = safeDate(rider.issueDate);
  const now         = new Date();
  const isExpired   = expiryDate ? expiryDate < now : false;
  const daysLeft    = expiryDate
    ? Math.ceil((expiryDate.getTime() - now.getTime()) / 86_400_000)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">

        {/* ── Header ── */}
        <div className="sticky top-0 z-50 bg-green-700 px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-200 mb-0.5">
              Rider Profile
            </p>
            <h2 className="text-xl font-bold text-white leading-tight">{rider.fullName}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="font-mono text-xs bg-white/10 text-green-100 px-2 py-0.5 rounded">
                {rider.RIN}
              </span>
              <Badge className={`text-xs ${STATUS_STYLES[rider.status] ?? "bg-slate-500 text-white"}`}>
                {rider.status}
              </Badge>
              <Badge variant="outline" className="text-xs border-green-400 text-green-100">
                {rider.vehicleCategory}
              </Badge>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-green-200 hover:text-white transition-colors mt-0.5 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-5">

            {/* ── Top row: photo + QR + quick stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Passport photo */}
              <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-4 gap-3">
                {rider.passportPhotoUrl ? (
                  <img
                    src={rider.passportPhotoUrl}
                    alt="Passport photo"
                    className="h-36 w-28 object-cover rounded-lg shadow border border-slate-200"
                  />
                ) : (
                  <div className="h-36 w-28 bg-slate-200 rounded-lg flex items-center justify-center">
                    <User className="h-10 w-10 text-slate-400" />
                  </div>
                )}
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Passport Photo
                </p>
              </div>

              {/* QR code — uses stored URL, no client-side generation */}
              <div className="flex flex-col items-center justify-center bg-white border-2 border-green-200 rounded-xl p-4 gap-2">
                {rider.qrCodeUrl ? (
                  <>
                    <img
                      src={rider.qrCodeUrl}
                      alt={`QR code for ${rider.RIN}`}
                      className="w-28 h-28 object-contain"
                    />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-700">
                      Scan to Verify
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic">No QR code</p>
                )}
              </div>

              {/* Date cards */}
              <div className="space-y-3">
                {/* Issued */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Issued</p>
                  </div>
                  <p className="text-sm font-bold text-blue-900">{fmtDate(rider.issueDate)}</p>
                </div>

                {/* Expiry */}
                <div className={`p-3 rounded-lg border ${
                  isExpired            ? "bg-red-50 border-red-200"    :
                  daysLeft !== null && daysLeft <= 30 ? "bg-yellow-50 border-yellow-200" :
                                         "bg-green-50 border-green-200"
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {isExpired
                      ? <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                      : <Clock className="h-3.5 w-3.5 text-green-600" />
                    }
                    <p className={`text-[10px] font-bold uppercase tracking-wide ${
                      isExpired ? "text-red-700" : "text-green-700"
                    }`}>
                      {isExpired ? "Expired" : "Expires"}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ${isExpired ? "text-red-900" : "text-green-900"}`}>
                    {isExpired ? "Expired" : daysLeft !== null ? `${daysLeft}d left` : "—"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{fmtDate(rider.expiryDate)}</p>
                </div>

                {/* License expiry */}
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="h-3.5 w-3.5 text-purple-600" />
                    <p className="text-[10px] font-bold uppercase tracking-wide text-purple-700">
                      License Expiry
                    </p>
                  </div>
                  <p className="text-sm font-bold text-purple-900">
                    {fmtDate(rider.licenseExpiryDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Details grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Personal */}
              <InfoCard icon={<User className="h-4 w-4 text-green-600" />} title="Personal Information">
                <Field label="Full Name"       value={rider.fullName} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Gender"        value={rider.gender} />
                  <Field label="Date of Birth" value={fmtDate(rider.dateOfBirth)} />
                </div>
                <Field label="Phone Number"    value={rider.phoneNumber} />
                <Field label="ID Type"         value={rider.idType} />
                <Field label="ID Number"       value={rider.idNumber} mono />
              </InfoCard>

              {/* Location */}
              <InfoCard icon={<MapPin className="h-4 w-4 text-green-600" />} title="Location">
                <Field label="Region"                value={rider.region} />
                <Field label="District / Municipality" value={rider.districtMunicipality} />
                <Field label="Residential Town"      value={rider.residentialTown} />
              </InfoCard>

              {/* Vehicle */}
              <InfoCard icon={<Bike className="h-4 w-4 text-green-600" />} title="Vehicle">
                <Field label="Category"       value={rider.vehicleCategory} />
                <Field label="Plate Number"   value={rider.plateNumber?.toUpperCase()} mono />
                <Field label="Chassis Number" value={rider.chassisNumber?.toUpperCase()} mono />
              </InfoCard>

              {/* Compliance */}
              <InfoCard icon={<FileText className="h-4 w-4 text-green-600" />} title="Compliance">
                <Field label="Driver's License" value={rider.driversLicenseNumber?.toUpperCase()} mono />
                <Field label="License Expiry"   value={fmtDate(rider.licenseExpiryDate)} />
                <Field label="Next of Kin"      value={rider.nextOfKinName} />
                <Field label="Kin Contact"      value={rider.nextOfKinContact} />
              </InfoCard>
            </div>

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-2 border-t border-slate-200">
              <Button
                onClick={() => window.print()}
                className="flex-1 h-10 bg-green-700 hover:bg-green-800 gap-2 text-sm"
              >
                <Printer className="h-4 w-4" /> Print Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-10 text-sm"
              >
                Close
              </Button>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoCard({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}

function Field({
  label, value, mono = false,
}: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-semibold text-slate-800 break-words ${mono ? "font-mono" : ""}`}>
        {value || <span className="text-slate-300 font-normal italic">—</span>}
      </p>
    </div>
  );
}