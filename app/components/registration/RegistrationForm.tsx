"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Printer,
  Shield,
  User,
  MapPin,
  Bike,
  FileCheck,
  Eye,
} from "lucide-react";
import { Form } from "@/components/ui/form";
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
import { BioDataStep } from "@/app/components/registration/steps/bio-data-step";
import { LocationStep } from "@/app/components/registration/steps/location-step";
import { VehicleInfoStep } from "@/app/components/registration/steps/vehicle-info-step";
import { ComplianceStep } from "@/app/components/registration/steps/compliance-step";
import { PreviewStep } from "@/app/operator/register/steps/preview-step";

// ─── STEPS CONFIG ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Bio Data",    subtitle: "Personal information",  icon: User,      schema: bioDataSchema },
  { id: 2, title: "Location",    subtitle: "Residential details",   icon: MapPin,    schema: locationSchema },
  { id: 3, title: "Vehicle",     subtitle: "Vehicle information",   icon: Bike,      schema: vehicleInfoSchema },
  { id: 4, title: "Compliance",  subtitle: "Documents & license",   icon: FileCheck, schema: complianceSchema },
  { id: 5, title: "Review",      subtitle: "Verify & submit",       icon: Eye,       schema: null },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function RegistrationForm() {
  const [currentStep, setCurrentStep]         = useState(1);
  const [completedSteps, setCompletedSteps]   = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [submitSuccess, setSubmitSuccess]     = useState(false);
  const [generatedRIN, setGeneratedRIN]       = useState("");
  const [generatedRiderId, setGeneratedRiderId] = useState("");
  const [error, setError]                     = useState("");
  const [photoPreview, setPhotoPreview]       = useState<string | null>(null);

  const form = useForm<RiderRegistrationData>({
    resolver: zodResolver(riderRegistrationSchema),
    defaultValues: {
      fullName: "", phoneNumber: "", idType: undefined, idNumber: "",
      dateOfBirth: "", gender: undefined, region: "Greater Accra",
      districtMunicipality: undefined, residentialTown: "",
      vehicleCategory: undefined, plateNumber: "", chassisNumber: "",
      driversLicenseNumber: "", licenseExpiryDate: "",
      nextOfKinName: "", nextOfKinContact: "", passportPhoto: undefined,
    },
    mode: "onChange",
  });

  const watchPhoto = form.watch("passportPhoto");
  useEffect(() => {
    if (watchPhoto instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(watchPhoto);
    }
  }, [watchPhoto]);

  // ─── VALIDATE ───────────────────────────────────────────────────────────────

  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 5) return form.formState.isValid;
    const stepConfig = STEPS.find((s) => s.id === step);
    if (!stepConfig?.schema) return true;
    const fields = Object.keys(stepConfig.schema.shape) as (keyof RiderRegistrationData)[];
    return await form.trigger(fields);
  };

  // ─── NAVIGATION ─────────────────────────────────────────────────────────────

  const handleNext = async () => {
    setError("");
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError("Please complete all required fields before continuing.");
    }
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── SUBMIT ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data: RiderRegistrationData) => {
    setIsSubmitting(true);
    setError("");
    try {
      const result = await saveRiderRegistration(data);
      if (result.success) {
        setGeneratedRIN(result.RIN);
        setGeneratedRiderId(result.riderId);
        setSubmitSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(result.error || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message ?? "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    form.reset();
    setSubmitSuccess(false);
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setGeneratedRIN("");
    setGeneratedRiderId("");
    setPhotoPreview(null);
    setError("");
  };

  // ─── STEP CONTENT ────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <BioDataStep form={form} />;
      case 2: return <LocationStep form={form} />;
      case 3: return <VehicleInfoStep form={form} />;
      case 4: return <ComplianceStep form={form} />;
      case 5: return <PreviewStep data={form.getValues()} photoPreview={photoPreview} />;
      default: return null;
    }
  };

  // ─── SUCCESS SCREEN ──────────────────────────────────────────────────────────

  if (submitSuccess) {
    const issuedAt = new Date().toLocaleString("en-GH", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-green-200 bg-white overflow-hidden shadow-lg">

          {/* Top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-green-600 via-yellow-400 to-green-600" />

          {/* Header */}
          <div className="bg-gradient-to-br from-green-800 to-green-700 px-8 py-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize: "12px 12px" }} />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-300 mb-1">
                CTS Africa — Greater Accra Region
              </p>
              <h2 className="text-xl font-bold">Registration Successful</h2>
              <p className="text-xs text-green-200 mt-1">{issuedAt}</p>
            </div>
          </div>

          {/* RIN */}
          <div className="px-8 py-6 text-center border-b border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-3">
              Rider Identification Number
            </p>
            <div className="inline-block bg-green-50 border-2 border-green-200 rounded-xl px-8 py-4">
              <p className="text-4xl font-black font-mono tracking-widest text-green-800 select-all">
                {generatedRIN}
              </p>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Click to select and copy</p>
          </div>

          {/* Rider ID */}
          {generatedRiderId && (
            <div className="px-8 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Record ID</span>
              <span className="text-xs font-mono text-gray-600 bg-white border border-gray-200 rounded px-2 py-0.5 select-all">
                {generatedRiderId}
              </span>
            </div>
          )}

          {/* Pills */}
          <div className="px-8 py-5 grid grid-cols-3 gap-3">
            {[
              { icon: "✓",  label: "Registered",      sub: "Status: Pending" },
              { icon: "⏱", label: "6 Month Validity", sub: "From issue date" },
              { icon: "🛡️", label: "Tamper-proof",    sub: "Unique identifier" },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-lg mb-1">{item.icon}</div>
                <p className="text-[11px] font-bold text-gray-700">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-8 pb-7 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReset}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm px-5 py-3 transition-colors shadow-md shadow-green-900/20"
            >
              <RotateCcw className="w-4 h-4" />
              Register Another Rider
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm px-5 py-3 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Certificate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── FORM ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Step indicator ── */}
      <div className="mb-6 flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive    = step.id === currentStep;
          const isDone      = completedSteps.has(step.id);
          const isUpcoming  = !isActive && !isDone;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              {/* Step node */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-all border-2
                    ${isActive  ? "bg-green-700 border-green-700 text-white shadow-md shadow-green-900/20"
                    : isDone    ? "bg-green-100 border-green-400 text-green-700"
                                : "bg-white border-gray-200 text-gray-300"}
                  `}
                >
                  {isDone && !isActive
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <Icon className="w-4 h-4" />
                  }
                </div>
                <span
                  className={`mt-1.5 text-[10px] font-semibold whitespace-nowrap
                    ${isActive ? "text-green-700" : isDone ? "text-green-600" : "text-gray-400"}
                  `}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all duration-300
                  ${isDone ? 'bg-green-300' : 'bg-gray-200'}"
                  style={{ background: isDone ? "#86efac" : "#e5e7eb" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Form card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="px-7 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {STEPS[currentStep - 1].title}
            </h3>
            <p className="text-xs text-gray-500">{STEPS[currentStep - 1].subtitle}</p>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            {currentStep} of {STEPS.length}
          </span>
        </div>

        {/* Form content */}
        <div className="px-7 py-6">
          {error && (
            <Alert variant="destructive" className="mb-5 border-red-200 bg-red-50">
              <AlertDescription className="text-sm text-red-700 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA")
                  e.preventDefault();
              }}
            >
              {renderStep()}

              {/* Navigation */}
              <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1 || isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-full transition-all duration-300 ${
                        s.id === currentStep      ? "w-5 h-2 bg-green-600"
                        : completedSteps.has(s.id) ? "w-2 h-2 bg-green-400"
                                                   : "w-2 h-2 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>

                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-bold transition-colors shadow-md shadow-green-900/20 disabled:opacity-50"
                  >
                    {currentStep === 4 ? "Review" : "Continue"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-bold transition-colors shadow-md shadow-green-900/20 disabled:opacity-50 min-w-[170px] justify-center"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" />Submit Registration</>
                    )}
                  </button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}