"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  Printer,
} from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  riderRegistrationSchema,
  type RiderRegistrationData,
  bioDataSchema,
  locationSchema,
  vehicleInfoSchema,
  complianceSchema,
} from "@/app/lib/validations";
import { saveRiderRegistration } from "@/lib/rider-service";
import { StepIndicator } from "@/components/operator/StepIndicator";
import { BioDataStep } from "@/app/components/registration/steps/bio-data-step";
import { LocationStep } from "@/app/operator/register/steps/location-step";
import { VehicleInfoStep } from "@/app/components/registration/steps/vehicle-info-step";
import { ComplianceStep } from "@/app/components/registration/steps/compliance-step";
import { PreviewStep } from "@/app/operator/register/steps/preview-step";

const STEPS = [
  { id: 1, title: "Bio Data", description: "Personal Information" },
  { id: 2, title: "Location", description: "Residential Details" },
  { id: 3, title: "Vehicle", description: "Vehicle Information" },
  { id: 4, title: "Compliance", description: "Documents & License" },
  { id: 5, title: "Review", description: "Verify Information" },
];

const STEP_SCHEMAS: Record<number, object> = {
  1: bioDataSchema.shape,
  2: locationSchema.shape,
  3: vehicleInfoSchema.shape,
  4: complianceSchema.shape,
};

interface RegistrationFormProps {
  compact?: boolean;
  onSuccess?: (RIN: string) => void;
}

// ─── Dedicated print window ───────────────────────────────────────────────────

function printCertificate(
  data: RiderRegistrationData,
  generatedRIN: string,
  qrCodeUrl: string,
  photoPreview: string | null,
) {
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) {
    alert("Please allow popups to print.");
    return;
  }

  const issuedDate = new Date().toLocaleDateString("en-GH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const issuedTime = new Date().toLocaleTimeString("en-GH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const f = (label: string, val?: string | null) =>
    `<div class="field"><div class="fl">${label}</div><div class="fv">${val || '<span class="empty">—</span>'}</div></div>`;

  const photo = photoPreview
    ? `<img class="photo" src="${photoPreview}" alt="Passport photo" />`
    : `<div class="photo-ph">No Photo</div>`;

  const qr = qrCodeUrl
    ? `<img class="qr" src="${qrCodeUrl}" alt="QR Code" />`
    : `<div class="qr-ph">Generating...</div>`;

  w.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>RIN Certificate — ${generatedRIN}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1e293b;font-size:11px;line-height:1.5}
  .page{width:190mm;margin:0 auto;padding:10mm;position:relative;z-index:1}
  .watermark{pointer-events:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:120px;font-weight:900;color:#166534;opacity:.025;user-select:none;z-index:0}

  .hdr{background:#166534;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0;display:flex;justify-content:space-between;align-items:flex-start}
  .hdr-eyebrow{font-size:8px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#bbf7d0;margin-bottom:4px}
  .hdr-title{font-size:20px;font-weight:800;letter-spacing:-0.02em;line-height:1.2}
  .hdr-sub{font-size:10px;color:#bbf7d0;margin-top:4px}
  .hdr-right{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:3px}
  .hdr-right .org{font-size:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#bbf7d0}
  .hdr-right .dt{font-size:9px;color:rgba(255,255,255,.6)}
  .hdr-icon{width:48px;height:48px;border-radius:50%;border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;margin-left:14px;flex-shrink:0}
  .hdr-icon svg{width:26px;height:26px;stroke:#bbf7d0;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

  .rin-panel{background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:16px 22px;display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:center;border-radius:0 0 10px 10px;margin-bottom:14px}
  .rin-box{background:#f0fdf4;border:2px solid #16a34a;border-radius:10px;padding:14px 18px}
  .rin-label{font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:.2em;color:#15803d;margin-bottom:6px}
  .rin-value{font-family:monospace;font-size:26px;font-weight:900;color:#14532d;letter-spacing:.06em}
  .rin-issued{font-size:8.5px;color:#16a34a;margin-top:5px;font-style:italic}

  .photo-col{display:flex;flex-direction:column;align-items:center;gap:5px}
  .photo{width:78px;height:98px;object-fit:cover;border-radius:7px;border:2px solid #e2e8f0}
  .photo-ph{width:78px;height:98px;background:#e2e8f0;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:8px;font-weight:700;text-transform:uppercase;text-align:center;padding:4px}
  .qr-col{display:flex;flex-direction:column;align-items:center;gap:5px}
  .qr{width:88px;height:88px;object-fit:contain;border:2px solid #16a34a;border-radius:8px;padding:3px;background:#fff}
  .qr-ph{width:88px;height:88px;background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:8px;text-align:center;padding:6px}
  .col-label{font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;text-align:center}
  .qr-label{font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#16a34a;text-align:center}

  .section{margin-bottom:12px}
  .section-title{font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:.15em;color:#15803d;padding-bottom:6px;border-bottom:1px solid #dcfce7;margin-bottom:10px}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px}
  .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 16px}
  .field .fl{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:1px}
  .field .fv{font-size:11px;font-weight:600;color:#1e293b;word-break:break-word}
  .field .fv .empty{color:#cbd5e1;font-style:italic;font-weight:400}

  .sig-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:14px;padding-top:12px;border-top:1px solid #e2e8f0}
  .sig-line{height:36px;border-bottom:1px solid #94a3b8;margin-bottom:4px}
  .sig-label{font-size:8px;color:#94a3b8}

  .footer{margin-top:14px;padding-top:10px;border-top:1px dashed #e2e8f0;display:flex;justify-content:space-between;align-items:center}
  .footer-note{font-size:7.5px;color:#94a3b8;line-height:1.7}
  .footer-rin{font-family:monospace;font-size:15px;font-weight:800;color:#166534;letter-spacing:.05em}

  @page{size:A4;margin:0}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head><body>
<div class="watermark">RIN</div>
<div class="page">

  <div class="hdr">
    <div>
      <div class="hdr-eyebrow">Republic of Ghana · CTS Africa</div>
      <div class="hdr-title">Rider Identification Number</div>
      <div class="hdr-sub">This certifies the successful registration of a commercial rider</div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div class="hdr-right">
        <div class="org">Official Certificate</div>
        <div class="dt">Issued: ${issuedDate}</div>
        <div class="dt">${issuedTime}</div>
      </div>
      <div class="hdr-icon">
        <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
    </div>
  </div>

  <div class="rin-panel">
    <div class="rin-box">
      <div class="rin-label">Rider Identification Number (RIN)</div>
      <div class="rin-value">${generatedRIN}</div>
      <div class="rin-issued">Issued ${issuedDate} at ${issuedTime}</div>
    </div>
    <div class="photo-col">${photo}<span class="col-label">Passport Photo</span></div>
    <div class="qr-col">${qr}<span class="qr-label">Scan to Verify</span></div>
  </div>

  <div class="section">
    <div class="section-title">Rider Registration Details</div>
    <div class="grid-3">
      ${f("Full Name", data.fullName)}
      ${f("Phone Number", data.phoneNumber)}
      ${f("Gender", data.gender)}
      ${f("Date of Birth", data.dateOfBirth)}
      ${f("ID Type", data.idType)}
      ${f("ID Number", data.idNumber)}
      ${f("Region", data.region)}
      ${f("District / Municipality", data.districtMunicipality)}
      ${f("Residential Town", data.residentialTown)}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Vehicle Details</div>
    <div class="grid-3">
      ${f("Vehicle Category", data.vehicleCategory)}
      ${f("Plate Number", data.plateNumber)}
      ${f("Chassis Number", data.chassisNumber)}
      ${f("Driver's License No.", data.driversLicenseNumber)}
      ${f("License Expiry Date", data.licenseExpiryDate)}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Next of Kin</div>
    <div class="grid-2">
      ${f("Name", data.nextOfKinName)}
      ${f("Contact", data.nextOfKinContact)}
    </div>
  </div>

  <div class="sig-row">
    <div><div class="sig-line"></div><div class="sig-label">Authorized Signature</div></div>
    <div><div class="sig-line"></div><div class="sig-label">Official Stamp</div></div>
  </div>

  <div class="footer">
    <div class="footer-note">
      Computer-generated document — valid without a handwritten signature.<br/>
      Scan the QR code to verify authenticity online.<br/>
      Unauthorised reproduction is strictly prohibited.
    </div>
    <div class="footer-rin">${generatedRIN}</div>
  </div>

</div>
<script>
  const imgs = document.querySelectorAll('img');
  if(imgs.length===0){window.print();window.onafterprint=()=>window.close();}
  else{
    let loaded=0;
    const tryPrint=()=>{if(++loaded>=imgs.length){window.print();window.onafterprint=()=>window.close();}};
    imgs.forEach(img=>{if(img.complete)tryPrint();else{img.onload=tryPrint;img.onerror=tryPrint;}});
  }
</script>
</body></html>`);
  w.document.close();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegistrationForm({
  compact = false,
  onSuccess,
}: RegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [generatedRIN, setGeneratedRIN] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showFloatingNav, setShowFloatingNav] = useState(false);

  const form = useForm<RiderRegistrationData>({
    resolver: zodResolver(riderRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      idType: undefined,
      idNumber: "",
      dateOfBirth: "",
      gender: undefined,
      region: "Greater Accra",
      districtMunicipality: undefined,
      residentialTown: "",
      vehicleCategory: undefined,
      plateNumber: "",
      chassisNumber: "",
      driversLicenseNumber: "",
      licenseExpiryDate: "",
      nextOfKinName: "",
      nextOfKinContact: "",
      passportPhoto: undefined,
    },
  });

  useEffect(() => {
    const subscription = form.watch(() => {
      setShowFloatingNav(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const watchPhoto = form.watch("passportPhoto");
  useEffect(() => {
    if (watchPhoto instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(watchPhoto);
    } else {
      setPhotoPreview(null);
    }
  }, [watchPhoto]);

  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 5) return form.formState.isValid;
    const schema = STEP_SCHEMAS[step];
    if (!schema) return true;
    const fields = Object.keys(schema) as (keyof RiderRegistrationData)[];
    const valid = await form.trigger(fields);
    if (!valid) {
      const errors = form.formState.errors;
      const failedFields = fields
        .filter((f) => errors[f])
        .map((f) => (errors[f] as { message?: string })?.message || String(f));
      setError(
        failedFields.length > 0
          ? `Please fix: ${failedFields.join(", ")}`
          : "Please complete all required fields before continuing.",
      );
    }
    return valid;
  };

  const handleNext = async () => {
    setError("");
    const valid = await validateStep(currentStep);
    if (valid) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: RiderRegistrationData) => {
    setIsSubmitting(true);
    setError("");
    try {
      const result = await saveRiderRegistration(data);
      if (result.success) {
        setGeneratedRIN(result.RIN);
        setQrCodeUrl(result.qrCodeUrl ?? "");
        setSuccess(true);
        setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
        onSuccess?.(result.RIN);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(result.error || "Failed to register rider.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BioDataStep form={form} />;
      case 2:
        return <LocationStep form={form} />;
      case 3:
        return <VehicleInfoStep form={form} />;
      case 4:
        return <ComplianceStep form={form} />;
      case 5:
        return (
          <PreviewStep data={form.getValues()} photoPreview={photoPreview} />
        );
      default:
        return null;
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setCurrentStep(1);
    setCompletedSteps([]);
    setPhotoPreview(null);
    setGeneratedRIN("");
    setQrCodeUrl("");
    form.reset();
  };

  // ── Success screen ─────────────────────────────────────────────────────────

  if (success) {
    const data = form.getValues();
    const issuedDate = new Date().toLocaleDateString("en-GH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const issuedTime = new Date().toLocaleTimeString("en-GH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">
              Registration Successful
            </p>
            <p className="text-sm text-green-700">
              RIN generated. Print or save this certificate for the rider's
              records.
            </p>
          </div>
        </div>

        {/* Certificate preview */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-green-700 px-7 py-6 text-white flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200 mb-1">
                Republic of Ghana · CTS Africa
              </p>
              <h1 className="text-xl font-bold leading-tight">
                Rider Identification Number
              </h1>
              <p className="text-sm text-green-200 mt-1">
                This certifies successful registration of a commercial rider
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-green-400/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-green-200" />
            </div>
          </div>

          {/* RIN + photo + QR */}
          <div className="bg-slate-50 border-b border-slate-200 px-7 py-5 grid grid-cols-[1fr_auto_auto] gap-4 items-center">
            <div className="bg-green-50 border-2 border-green-600 rounded-xl px-6 py-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-green-700 mb-2">
                Rider Identification Number
              </p>
              <p className="text-3xl font-black font-mono tracking-widest text-green-900 select-all">
                {generatedRIN}
              </p>
              <p className="text-xs text-green-600 mt-2 italic">
                Issued {issuedDate} at {issuedTime}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Passport"
                  className="w-20 h-24 object-cover rounded-lg border-2 border-slate-200 shadow"
                />
              ) : (
                <div className="w-20 h-24 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs font-semibold">
                  No Photo
                </div>
              )}
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Photo
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR"
                  className="w-24 h-24 object-contain border-2 border-green-300 rounded-lg p-1 bg-white"
                />
              ) : (
                <div className="w-24 h-24 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 rounded-lg">
                  <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                  <p className="text-[9px] text-slate-400 text-center">
                    Generating...
                  </p>
                </div>
              )}
              <p className="text-[9px] font-bold uppercase tracking-wider text-green-700">
                Scan to Verify
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="px-7 py-6 space-y-6">
            <CertSection title="Rider Details">
              <div className="grid grid-cols-3 gap-4">
                <CertField label="Full Name" value={data.fullName} />
                <CertField label="Phone Number" value={data.phoneNumber} />
                <CertField label="Gender" value={data.gender} />
                <CertField label="Date of Birth" value={data.dateOfBirth} />
                <CertField label="ID Type" value={data.idType} />
                <CertField label="ID Number" value={data.idNumber} />
                <CertField label="Region" value={data.region} />
                <CertField
                  label="District / Municipality"
                  value={data.districtMunicipality}
                />
                <CertField
                  label="Residential Town"
                  value={data.residentialTown}
                />
              </div>
            </CertSection>

            <CertSection title="Vehicle Details">
              <div className="grid grid-cols-3 gap-4">
                <CertField label="Category" value={data.vehicleCategory} />
                <CertField label="Plate Number" value={data.plateNumber} />
                <CertField label="Chassis Number" value={data.chassisNumber} />
                <CertField
                  label="Driver's License"
                  value={data.driversLicenseNumber}
                />
                <CertField
                  label="License Expiry"
                  value={data.licenseExpiryDate}
                />
              </div>
            </CertSection>

            <CertSection title="Next of Kin">
              <div className="grid grid-cols-2 gap-4">
                <CertField label="Name" value={data.nextOfKinName} />
                <CertField label="Contact" value={data.nextOfKinContact} />
              </div>
            </CertSection>

            <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
              Computer-generated document — valid without a handwritten
              signature. Scan QR code to verify authenticity online.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={() =>
              printCertificate(data, generatedRIN, qrCodeUrl, photoPreview)
            }
            className="bg-green-700 hover:bg-green-800 text-white gap-2 shadow"
          >
            <Printer className="h-4 w-4" /> Print Certificate
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Register Another Rider
          </Button>
        </div>
      </div>
    );
  }

  // ── Multi-step form ────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* ── Sticky step indicator — left sidebar ── */}
      {!compact && (
        <div className="hidden lg:block lg:col-span-1 sticky top-18">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
              Registration Steps
            </p>
            <div className="space-y-1">
              {STEPS.map((step) => {
                const isDone = completedSteps.includes(step.id);
                const isCurrent = currentStep === step.id;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isCurrent
                        ? "bg-green-50 border border-green-200"
                        : isDone
                          ? "opacity-60"
                          : "opacity-40"
                    }`}
                  >
                    {/* Circle */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black border-2 transition-all ${
                        isDone
                          ? "bg-green-700 border-green-700 text-white"
                          : isCurrent
                            ? "bg-white border-green-600 text-green-700"
                            : "bg-white border-slate-200 text-slate-400"
                      }`}
                    >
                      {isDone ? (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          viewBox="0 0 24 24"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </div>
                    {/* Labels */}
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold leading-none ${isCurrent ? "text-green-800" : "text-slate-600"}`}
                      >
                        {step.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                <span>Progress</span>
                <span>
                  {Math.round((completedSteps.length / STEPS.length) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${(completedSteps.length / STEPS.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main form card ── */}
      <div className={compact ? "col-span-1" : "lg:col-span-3"}>
        <Card className={compact ? "p-4" : "p-8"}>
          {/* Mobile step indicator (compact pills — shown only on small screens) */}
          {!compact && (
            <div className="flex lg:hidden items-center gap-1.5 mb-6 overflow-x-auto pb-1">
              {STEPS.map((step) => {
                const isDone = completedSteps.includes(step.id);
                const isCurrent = currentStep === step.id;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border transition-all ${
                      isCurrent
                        ? "bg-green-700 text-white border-green-700"
                        : isDone
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                    }`}
                  >
                    {isDone ? (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        viewBox="0 0 24 24"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span>{step.id}</span>
                    )}
                    {step.title}
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  (e.target as HTMLElement).tagName !== "TEXTAREA"
                )
                  e.preventDefault();
              }}
            >
              <div>{renderStep()}</div>

              <div className="h-16" />
            </form>
          </Form>
        </Card>
      </div>
      {showFloatingNav && (
        <div
          className="
      fixed bottom-6 right-1/4 -translate-x-1/2
      z-50
      animate-in slide-in-from-bottom-4 fade-in
      duration-300
    "
        >
          <div
            className="
      flex items-center gap-3
      bg-white/90 backdrop-blur-xl
      border border-slate-200
      shadow-2xl
      rounded-full
      px-5 py-3
    "
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="rounded-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-green-700 hover:bg-green-800 rounded-full gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="bg-green-700 hover:bg-green-800 rounded-full gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function CertSection({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-3 pb-2 border-b border-green-100">
          {title}
        </p>
        {children}
      </div>
    );
  }

  function CertField({
    label,
    value,
  }: {
    label: string;
    value?: string | null;
  }) {
    return (
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-800 break-words">
          {value || (
            <span className="text-slate-300 font-normal italic">—</span>
          )}
        </p>
      </div>
    );
  }
}
