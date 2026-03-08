"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, ArrowRight, CheckCircle2,
  Loader2, Plus, Printer,
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
import { BioDataStep }    from "@/app/components/registration/steps/bio-data-step";
import { LocationStep } from "@/app/operator/register/steps/location-step";
import { VehicleInfoStep } from "@/app/components/registration/steps/vehicle-info-step";
import { ComplianceStep } from "@/app/components/registration/steps/compliance-step";
import { PreviewStep }    from "@/app/operator/register/steps/preview-step";

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Bio Data",   description: "Personal Information" },
  { id: 2, title: "Location",   description: "Residential Details"  },
  { id: 3, title: "Vehicle",    description: "Vehicle Information"  },
  { id: 4, title: "Compliance", description: "Documents & License"  },
  { id: 5, title: "Review",     description: "Verify Information"   },
];

const STEP_SCHEMAS: Record<number, object> = {
  1: bioDataSchema.shape,
  2: locationSchema.shape,
  3: vehicleInfoSchema.shape,
  4: complianceSchema.shape,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface RegistrationFormProps {
  compact?:    boolean;  // true = no step indicator, tighter padding (for sheet)
  onSuccess?: (RIN: string) => void; // optional callback after successful registration
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegistrationForm({ compact = false, onSuccess }: RegistrationFormProps) {
  const [currentStep,     setCurrentStep]     = useState<number>(1);
  const [completedSteps,  setCompletedSteps]  = useState<number[]>([]);
  const [isSubmitting,    setIsSubmitting]    = useState<boolean>(false);
  const [error,           setError]           = useState<string>("");
  const [success,         setSuccess]         = useState<boolean>(false);
  const [generatedRIN,    setGeneratedRIN]    = useState<string>("");
  const [qrCodeUrl,       setQrCodeUrl]       = useState<string>("");   // ← typed correctly
  const [photoPreview,    setPhotoPreview]    = useState<string | null>(null);

  const form = useForm<RiderRegistrationData>({
    resolver: zodResolver(riderRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "", phoneNumber: "", idType: undefined, idNumber: "",
      dateOfBirth: "", gender: undefined, region: "Greater Accra",
      districtMunicipality: undefined, residentialTown: "",
      vehicleCategory: undefined, plateNumber: "", chassisNumber: "",
      driversLicenseNumber: "", licenseExpiryDate: "",
      nextOfKinName: "", nextOfKinContact: "", passportPhoto: undefined,
    },
  });

  // Photo preview
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

  // ── Step validation ────────────────────────────────────────────────────────

  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 5) return form.formState.isValid;
    const schema = STEP_SCHEMAS[step];
    if (!schema) return true;
    const fields = Object.keys(schema) as (keyof RiderRegistrationData)[];
    const valid  = await form.trigger(fields);
    if (!valid) {
      const errors      = form.formState.errors;
      const failedFields = fields
        .filter((f) => errors[f])
        .map((f) => (errors[f] as { message?: string })?.message || String(f));
      setError(
        failedFields.length > 0
          ? `Please fix: ${failedFields.join(", ")}`
          : "Please complete all required fields before continuing."
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

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data: RiderRegistrationData) => {
    setIsSubmitting(true);
    setError("");
    try {
      const result = await saveRiderRegistration(data);
      if (result.success) {
        setGeneratedRIN(result.RIN);
        setQrCodeUrl(result.qrCodeUrl ?? "");  // ← string, never null
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

  // ── Step renderer ──────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <BioDataStep    form={form} />;
      case 2: return <LocationStep   form={form} />;
      case 3: return <VehicleInfoStep form={form} />;
      case 4: return <ComplianceStep form={form} />;
      case 5: return <PreviewStep    data={form.getValues()} photoPreview={photoPreview} />;
      default: return null;
    }
  };

  // ── Reset helper ──────────────────────────────────────────────────────────

  const handleReset = () => {
    setSuccess(false);
    setCurrentStep(1);
    setCompletedSteps([]);
    setPhotoPreview(null);
    setGeneratedRIN("");
    setQrCodeUrl("");
    form.reset();
  };

  // ─── SUCCESS / CERTIFICATE SCREEN ─────────────────────────────────────────

  if (success) {
    const data       = form.getValues();
    const issuedDate = new Date().toLocaleDateString("en-GH", {
      year: "numeric", month: "long", day: "numeric",
    });
    const issuedTime = new Date().toLocaleTimeString("en-GH", {
      hour: "2-digit", minute: "2-digit",
    });

    return (
      <>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #RIN-certificate, #RIN-certificate * { visibility: visible; }
            #RIN-certificate {
              position: fixed; inset: 0; margin: 0; padding: 32px;
              background: #fff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .cert-header      { background-color: #15803d !important; color: #fff !important; }
            .cert-RIN-box     { border: 3px solid #15803d !important; background-color: #f0fdf4 !important; }
            .cert-divider     { border-color: #166534 !important; }
            .cert-field-label { color: #166534 !important; }
            .cert-watermark   { opacity: 0.06 !important; }
          }
        `}</style>

        <div className="space-y-6">

          {/* Success banner */}
          <div className="print:hidden flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Registration Successful</p>
              <p className="text-sm text-green-700">
                RIN generated. Print or save this certificate for the rider's records.
              </p>
            </div>
          </div>

          {/* ── Certificate ── */}
          <div
            id="RIN-certificate"
            className="bg-white border-2 border-gray-300 rounded-2xl overflow-hidden shadow-xl"
          >
            {/* Header */}
            <div className="cert-header bg-green-700 px-8 py-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200 mb-1">
                    Republic of Ghana
                  </p>
                  <h1 className="text-2xl font-bold leading-tight">
                    Rider Identification Number
                  </h1>
                  <p className="text-sm text-green-200 mt-1">
                    This certifies successful registration of a commercial rider
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full border-2 border-green-300 flex items-center justify-center opacity-80">
                  <CheckCircle2 className="w-9 h-9 text-green-200" />
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="relative px-8 py-8">

              {/* Watermark */}
              <div
                className="cert-watermark pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] select-none"
                aria-hidden
              >
                <span className="text-[10rem] font-black text-green-800 rotate-[-35deg] leading-none">
                  RIN
                </span>
              </div>

              <div className="relative space-y-8">

                {/* RIN hero + QR code */}
                <div className="flex items-stretch gap-4">

                  {/* RIN box */}
                  <div className="cert-RIN-box flex-1 border-2 border-green-600 rounded-xl bg-green-50 px-6 py-6 flex flex-col justify-center">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-green-700 mb-3">
                      Rider Identification Number
                    </p>
                    <p className="text-4xl font-black font-mono tracking-widest text-green-900 select-all">
                      {generatedRIN}
                    </p>
                    <p className="text-xs text-green-600 mt-3 italic">
                      Issued {issuedDate} at {issuedTime}
                    </p>
                  </div>

                  {/* QR code */}
                  <div className="flex flex-col items-center justify-center bg-white border-2 border-green-200 rounded-xl p-3 shrink-0 w-36">
                    {qrCodeUrl ? (
                      <>
                        <img
                          src={qrCodeUrl}
                          alt={`QR code for ${generatedRIN}`}
                          className="w-24 h-24 object-contain"
                        />
                        <p className="text-[9px] text-green-700 font-bold uppercase tracking-wider mt-2 text-center">
                          Scan to Verify
                        </p>
                      </>
                    ) : (
                      <div className="w-24 h-24 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
                        <p className="text-[9px] text-gray-400 text-center">Generating QR...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rider details */}
                <div>
                  <p className="cert-field-label text-xs font-bold uppercase tracking-widest text-green-700 mb-4 pb-2 border-b cert-divider border-green-200">
                    Rider Registration Details
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <CertField label="Full Name"               value={data.fullName} />
                    <CertField label="Phone Number"            value={data.phoneNumber} />
                    <CertField label="Date of Birth"           value={data.dateOfBirth} />
                    <CertField label="Gender"                  value={data.gender} />
                    <CertField label="ID Type"                 value={data.idType} />
                    <CertField label="ID Number"               value={data.idNumber} />
                    <CertField label="Region"                  value={data.region} />
                    <CertField label="District / Municipality" value={data.districtMunicipality} />
                    <CertField label="Residential Town"        value={data.residentialTown} />
                  </div>
                </div>

                {/* Vehicle details */}
                <div>
                  <p className="cert-field-label text-xs font-bold uppercase tracking-widest text-green-700 mb-4 pb-2 border-b cert-divider border-green-200">
                    Vehicle Details
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <CertField label="Vehicle Category"     value={data.vehicleCategory} />
                    <CertField label="Plate Number"         value={data.plateNumber} />
                    <CertField label="Chassis Number"       value={data.chassisNumber} />
                    <CertField label="Driver's License No." value={data.driversLicenseNumber} />
                    <CertField label="License Expiry Date"  value={data.licenseExpiryDate} />
                  </div>
                </div>

                {/* Next of kin */}
                <div>
                  <p className="cert-field-label text-xs font-bold uppercase tracking-widest text-green-700 mb-4 pb-2 border-b cert-divider border-green-200">
                    Next of Kin
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <CertField label="Name"    value={data.nextOfKinName} />
                    <CertField label="Contact" value={data.nextOfKinContact} />
                  </div>
                </div>

                {/* Signature row */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200 text-sm">
                  <div>
                    <div className="h-10 border-b border-gray-400 mb-1" />
                    <p className="text-gray-500 text-xs">Authorized Signature</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-gray-400 mb-1" />
                    <p className="text-gray-500 text-xs">Official Stamp</p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Computer-generated document — valid without a handwritten signature.
                  Scan QR code to verify authenticity online.
                </p>

              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="print:hidden flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => window.print()}
              className="bg-green-700 hover:bg-green-800 text-white gap-2 shadow"
            >
              <Printer className="h-4 w-4" />
              Print Certificate
            </Button>
            <Button size="lg" variant="outline" onClick={handleReset} className="gap-2">
              <Plus className="h-4 w-4" />
              Register Another Rider
            </Button>
          </div>

        </div>
      </>
    );
  }

  // ─── MULTI-STEP FORM ──────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <Card className={compact ? "p-4" : "p-8"}>

          {/* Step indicator — hidden in compact (sheet) mode */}
          {!compact && <StepIndicator steps={STEPS} currentStep={currentStep} />}

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
                if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA")
                  e.preventDefault();
              }}
            >
              <div>{renderStep()}</div>

              <div className="flex justify-between items-center pt-8 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1 || isSubmitting}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-green-700 hover:bg-green-800 gap-2"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="bg-green-700 hover:bg-green-800 gap-2"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4" /> Submit Registration</>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}

// ─── CertField helper ─────────────────────────────────────────────────────────

function CertField({
  label,
  value,
}: {
  label: string;
  value: string | undefined | null;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="font-semibold text-gray-800 break-words">
        {value || <span className="font-normal text-gray-400 italic">—</span>}
      </p>
    </div>
  );
}