"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User, MapPin, Bike, FileText,
  Clock, AlertCircle, CheckCircle2, X, Printer,
} from "lucide-react";
import { type RiderRecord } from "@/lib/rider-service";

interface ViewRiderModalProps {
  open:         boolean;
  rider:        (RiderRecord & { id: string }) | null;
  onOpenChange: (open: boolean) => void;
}

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

export function ViewRiderModal({ open, rider, onOpenChange }: ViewRiderModalProps) {
  if (!rider) return null;

  const expiryDate = safeDate(rider.expiryDate);
  const now        = new Date();
  const isExpired  = expiryDate ? expiryDate < now : false;
  const daysLeft   = expiryDate
    ? Math.ceil((expiryDate.getTime() - now.getTime()) / 86_400_000)
    : null;

  // ── Dedicated print window ─────────────────────────────────────────────────
  const handlePrint = () => {
    const w = window.open("", "_blank", "width=850,height=1100");
    if (!w) { alert("Please allow popups to print."); return; }

    const expiryColor = isExpired
      ? "#dc2626"
      : daysLeft !== null && daysLeft <= 30 ? "#d97706" : "#16a34a";

    const field = (label: string, val?: string | null, mono = false) =>
      `<div class="field">
        <div class="fl">${label}</div>
        <div class="fv${mono ? " mono" : ""}">${val || '<span class="empty">—</span>'}</div>
      </div>`;

    w.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Rider — ${rider.RIN}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1e293b;font-size:11px;line-height:1.5}
  .page{width:190mm;margin:0 auto;padding:10mm}

  /* Header */
  .hdr{background:#166534;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;display:flex;justify-content:space-between;align-items:flex-start}
  .hdr-name{font-size:20px;font-weight:800;letter-spacing:-0.02em}
  .hdr-label{font-size:8px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#bbf7d0;margin-bottom:3px}
  .hdr-badges{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
  .badge{font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,.15);color:#dcfce7;letter-spacing:.05em;text-transform:uppercase}
  .hdr-right{text-align:right;font-size:9px;color:rgba(255,255,255,.7);line-height:1.8}
  .hdr-right b{display:block;color:#bbf7d0;font-weight:700;text-transform:uppercase;letter-spacing:.1em}

  /* Top panel */
  .top{display:grid;grid-template-columns:100px 1fr 155px;gap:14px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:14px;border-radius:0 0 10px 10px;margin-bottom:12px;align-items:start}

  .photo-col{display:flex;flex-direction:column;align-items:center;gap:6px}
  .photo{width:85px;height:110px;object-fit:cover;border-radius:7px;border:2px solid #e2e8f0}
  .photo-ph{width:85px;height:110px;background:#e2e8f0;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
  .col-label{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;text-align:center}

  .qr-col{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
  .qr{width:110px;height:110px;object-fit:contain;border:2px solid #16a34a;border-radius:9px;padding:3px;background:#fff}
  .qr-ph{width:110px;height:110px;background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:9px}
  .qr-label{font-size:7.5px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.1em;text-align:center}

  .date-col{display:flex;flex-direction:column;gap:7px}
  .dc{padding:8px 10px;border-radius:7px;border:1px solid}
  .dc-label{font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;margin-bottom:2px}
  .dc-value{font-size:12px;font-weight:800}
  .dc-sub{font-size:8px;opacity:.7;margin-top:1px}
  .dc-blue{background:#eff6ff;border-color:#bfdbfe}.dc-blue .dc-label,.dc-blue .dc-value{color:#1d4ed8}
  .dc-purple{background:#faf5ff;border-color:#e9d5ff}.dc-purple .dc-label,.dc-purple .dc-value{color:#7e22ce}

  /* Grid */
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:11px 13px}
  .card-title{font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#64748b;border-bottom:1px solid #f1f5f9;padding-bottom:6px;margin-bottom:9px}
  .fields{display:flex;flex-direction:column;gap:6px}
  .fields-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .field .fl{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:1px}
  .field .fv{font-size:11px;font-weight:600;color:#1e293b;word-break:break-word}
  .field .fv.mono{font-family:monospace;font-size:10.5px}
  .field .fv .empty{color:#cbd5e1;font-style:italic;font-weight:400}

  /* Footer */
  .footer{margin-top:12px;padding-top:10px;border-top:1px dashed #e2e8f0;display:flex;justify-content:space-between;align-items:center}
  .footer-note{font-size:7.5px;color:#94a3b8;line-height:1.7}
  .footer-rin{font-family:monospace;font-size:16px;font-weight:800;color:#166534;letter-spacing:.05em}

  @page{size:A4;margin:0}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head><body><div class="page">

  <div class="hdr">
    <div>
      <div class="hdr-label">Rider Profile · CTS Africa</div>
      <div class="hdr-name">${rider.fullName}</div>
      <div class="hdr-badges">
        <span class="badge" style="font-family:monospace;font-size:11px">${rider.RIN}</span>
        <span class="badge">${rider.status}</span>
        <span class="badge">${rider.vehicleCategory}</span>
      </div>
    </div>
    <div class="hdr-right">
      <b>Republic of Ghana</b>
      Printed: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
    </div>
  </div>

  <div class="top">
    <div class="photo-col">
      ${rider.passportPhotoUrl
        ? `<img class="photo" src="${rider.passportPhotoUrl}" alt="Photo" />`
        : `<div class="photo-ph">No Photo</div>`}
      <span class="col-label">Passport Photo</span>
    </div>

    <div class="qr-col">
      ${rider.qrCodeUrl
        ? `<img class="qr" src="${rider.qrCodeUrl}" alt="QR" />`
        : `<div class="qr-ph">No QR</div>`}
      <span class="qr-label">Scan to Verify</span>
    </div>

    <div class="date-col">
      <div class="dc dc-blue">
        <div class="dc-label">Issue Date</div>
        <div class="dc-value">${fmtDate(rider.issueDate)}</div>
      </div>
      <div class="dc" style="background:${isExpired ? "#fef2f2" : daysLeft !== null && daysLeft <= 30 ? "#fffbeb" : "#f0fdf4"};border-color:${expiryColor}55">
        <div class="dc-label" style="color:${expiryColor}">${isExpired ? "EXPIRED" : "Expires"}</div>
        <div class="dc-value" style="color:${expiryColor}">${fmtDate(rider.expiryDate)}</div>
        ${!isExpired && daysLeft !== null ? `<div class="dc-sub" style="color:${expiryColor}">${daysLeft} days remaining</div>` : ""}
      </div>
      <div class="dc dc-purple">
        <div class="dc-label">License Expiry</div>
        <div class="dc-value">${fmtDate(rider.licenseExpiryDate)}</div>
      </div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">Personal Information</div>
      <div class="fields">
        ${field("Full Name", rider.fullName)}
        <div class="fields-row">
          ${field("Gender", rider.gender)}
          ${field("Date of Birth", fmtDate(rider.dateOfBirth))}
        </div>
        ${field("Phone Number", rider.phoneNumber)}
        ${field("ID Type", rider.idType)}
        ${field("ID Number", rider.idNumber, true)}
      </div>
    </div>

    <div class="card">
      <div class="card-title">Location</div>
      <div class="fields">
        ${field("Region", rider.region)}
        ${field("District / Municipality", rider.districtMunicipality)}
        ${field("Residential Town", rider.residentialTown)}
      </div>
    </div>

    <div class="card">
      <div class="card-title">Vehicle Details</div>
      <div class="fields">
        ${field("Category", rider.vehicleCategory)}
        ${field("Plate Number", rider.plateNumber?.toUpperCase(), true)}
        ${field("Chassis Number", rider.chassisNumber?.toUpperCase(), true)}
      </div>
    </div>

    <div class="card">
      <div class="card-title">Compliance &amp; Next of Kin</div>
      <div class="fields">
        ${field("Driver's License", rider.driversLicenseNumber?.toUpperCase(), true)}
        ${field("License Expiry", fmtDate(rider.licenseExpiryDate))}
        ${field("Next of Kin", rider.nextOfKinName)}
        ${field("Kin Contact", rider.nextOfKinContact)}
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-note">
      Official CTS Africa rider registration record.<br/>
      Verify authenticity by scanning the QR code above.<br/>
      Unauthorised reproduction is strictly prohibited.
    </div>
    <div class="footer-rin">${rider.RIN}</div>
  </div>

</div>
<script>
  // Wait for images then print
  const imgs = document.querySelectorAll('img');
  if(imgs.length === 0){ window.print(); window.onafterprint = ()=>window.close(); }
  else {
    let loaded = 0;
    const tryPrint = () => { if(++loaded >= imgs.length){ window.print(); window.onafterprint = ()=>window.close(); }};
    imgs.forEach(img=>{ if(img.complete) tryPrint(); else { img.onload=tryPrint; img.onerror=tryPrint; }});
  }
</script>
</body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-50 bg-green-700 px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-200 mb-0.5">Rider Profile</p>
            <h2 className="text-xl font-bold text-white leading-tight">{rider.fullName}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="font-mono text-xs bg-white/10 text-green-100 px-2 py-0.5 rounded">{rider.RIN}</span>
              <Badge className={`text-xs ${STATUS_STYLES[rider.status] ?? "bg-slate-500 text-white"}`}>{rider.status}</Badge>
              <Badge variant="outline" className="text-xs border-green-400 text-green-100">{rider.vehicleCategory}</Badge>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-green-200 hover:text-white transition-colors mt-0.5 shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-5">

            {/* Top row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-4 gap-3">
                {rider.passportPhotoUrl
                  ? <img src={rider.passportPhotoUrl} alt="Passport photo" className="h-36 w-28 object-cover rounded-lg shadow border border-slate-200" />
                  : <div className="h-36 w-28 bg-slate-200 rounded-lg flex items-center justify-center"><User className="h-10 w-10 text-slate-400" /></div>}
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passport Photo</p>
              </div>

              <div className="flex flex-col items-center justify-center bg-white border-2 border-green-200 rounded-xl p-4 gap-2">
                {rider.qrCodeUrl
                  ? <><img src={rider.qrCodeUrl} alt={`QR ${rider.RIN}`} className="w-28 h-28 object-contain" /><p className="text-[10px] font-bold uppercase tracking-wider text-green-700">Scan to Verify</p></>
                  : <p className="text-xs text-slate-400 italic">No QR code</p>}
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /><p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Issued</p></div>
                  <p className="text-sm font-bold text-blue-900">{fmtDate(rider.issueDate)}</p>
                </div>

                <div className={`p-3 rounded-lg border ${isExpired ? "bg-red-50 border-red-200" : daysLeft !== null && daysLeft <= 30 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {isExpired ? <AlertCircle className="h-3.5 w-3.5 text-red-600" /> : <Clock className="h-3.5 w-3.5 text-green-600" />}
                    <p className={`text-[10px] font-bold uppercase tracking-wide ${isExpired ? "text-red-700" : "text-green-700"}`}>{isExpired ? "Expired" : "Expires"}</p>
                  </div>
                  <p className={`text-sm font-bold ${isExpired ? "text-red-900" : "text-green-900"}`}>{fmtDate(rider.expiryDate)}</p>
                  {!isExpired && daysLeft !== null && <p className="text-[10px] text-slate-500 mt-0.5">{daysLeft} days remaining</p>}
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1"><FileText className="h-3.5 w-3.5 text-purple-600" /><p className="text-[10px] font-bold uppercase tracking-wide text-purple-700">License Expiry</p></div>
                  <p className="text-sm font-bold text-purple-900">{fmtDate(rider.licenseExpiryDate)}</p>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard icon={<User className="h-4 w-4 text-green-600" />} title="Personal Information">
                <Field label="Full Name"    value={rider.fullName} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Gender"        value={rider.gender} />
                  <Field label="Date of Birth" value={fmtDate(rider.dateOfBirth)} />
                </div>
                <Field label="Phone Number" value={rider.phoneNumber} />
                <Field label="ID Type"      value={rider.idType} />
                <Field label="ID Number"    value={rider.idNumber} mono />
              </InfoCard>

              <InfoCard icon={<MapPin className="h-4 w-4 text-green-600" />} title="Location">
                <Field label="Region"                  value={rider.region} />
                <Field label="District / Municipality" value={rider.districtMunicipality} />
                <Field label="Residential Town"        value={rider.residentialTown} />
              </InfoCard>

              <InfoCard icon={<Bike className="h-4 w-4 text-green-600" />} title="Vehicle">
                <Field label="Category"       value={rider.vehicleCategory} />
                <Field label="Plate Number"   value={rider.plateNumber?.toUpperCase()} mono />
                <Field label="Chassis Number" value={rider.chassisNumber?.toUpperCase()} mono />
              </InfoCard>

              <InfoCard icon={<FileText className="h-4 w-4 text-green-600" />} title="Compliance">
                <Field label="Driver's License" value={rider.driversLicenseNumber?.toUpperCase()} mono />
                <Field label="License Expiry"   value={fmtDate(rider.licenseExpiryDate)} />
                <Field label="Next of Kin"      value={rider.nextOfKinName} />
                <Field label="Kin Contact"      value={rider.nextOfKinContact} />
              </InfoCard>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-200">
              <Button onClick={handlePrint} className="flex-1 h-10 bg-green-700 hover:bg-green-800 gap-2 text-sm">
                <Printer className="h-4 w-4" /> Print Profile
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10 text-sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">{icon} {title}</h4>
      {children}
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold text-slate-800 break-words ${mono ? "font-mono" : ""}`}>
        {value || <span className="text-slate-300 font-normal italic">—</span>}
      </p>
    </div>
  );
}