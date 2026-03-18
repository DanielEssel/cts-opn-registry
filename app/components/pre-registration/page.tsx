"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  User,
  CreditCard,
  MapPin,
  Bike,
  Users,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  preRegistrationSchema,
  type PreRegistrationData,
  preBioSchema,
  preIdSchema,
  preLocationSchema,
  preVehicleSchema,
  preKinSchema,
} from "@/lib/pre-registration-schema";
import { savePreRegistration } from "@/lib/pre-registration-service";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Bio Data",   description: "Personal details",  icon: User       },
  { id: 2, title: "ID",         description: "Identification",    icon: CreditCard },
  { id: 3, title: "Location",   description: "Where you live",    icon: MapPin     },
  { id: 4, title: "Vehicle",    description: "Vehicle type",      icon: Bike       },
  { id: 5, title: "Next of Kin",description: "Emergency contact", icon: Users      },
];

const STEP_SCHEMAS = {
  1: preBioSchema,
  2: preIdSchema,
  3: preLocationSchema,
  4: preVehicleSchema,
  5: preKinSchema,
};

const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern",
  "Northern", "Volta", "Upper East", "Upper West", "Bono",
  "Ahafo", "Bono East", "Oti", "Savannah", "North East", "Western North",
];

const VEHICLE_OPTIONS = [
  { value: "Motorbike", emoji: "🏍️", description: "Delivery or commercial motorbike" },
  { value: "Tricycle",  emoji: "🛺", description: "3-wheel cargo or passenger vehicle" },
  { value: "Pragia",    emoji: "🚐", description: "Minibus / shared transport" },
];

// ─── Step components ──────────────────────────────────────────────────────────

function BioStep({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  return (
    <div className="space-y-5">
      <StepHeading
        title="Personal information"
        subtitle="Enter the rider's basic details exactly as they appear on their ID."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Full name <Required /></FormLabel>
              <FormControl>
                <Input placeholder="e.g. Kwame Asante Mensah" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number <Required /></FormLabel>
              <FormControl>
                <Input placeholder="0244000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of birth <Required /></FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Gender <Required /></FormLabel>
              <div className="grid grid-cols-3 gap-3">
                {["Male", "Female", "Other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => field.onChange(g)}
                    className={`h-11 rounded-xl border text-sm font-medium transition-all ${
                      field.value === g
                        ? "border-green-600 border-2 bg-green-50 text-green-800"
                        : "border-slate-200 text-slate-600 hover:border-green-300"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function IdStep({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  return (
    <div className="space-y-5">
      <StepHeading
        title="Identification"
        subtitle="Select the type of ID the rider will present at training."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="idType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID type <Required /></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {["Ghana Card", "Voter ID", "NHIS Card", "Passport"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="idNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID number <Required /></FormLabel>
              <FormControl>
                <Input placeholder="GHA-000000000-0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <strong>Note:</strong> The rider must bring this ID card to the training session.
        It will be verified before training begins.
      </div>
    </div>
  );
}

function LocationStep({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  return (
    <div className="space-y-5">
      <StepHeading
        title="Location"
        subtitle="Where the rider is currently based."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region <Required /></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GHANA_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="districtMunicipality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District / Municipality <Required /></FormLabel>
              <FormControl>
                <Input placeholder="e.g. Accra Metropolitan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="residentialTown"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Residential town <Required /></FormLabel>
              <FormControl>
                <Input placeholder="e.g. Tema, Kasoa, Madina" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function VehicleStep({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  return (
    <div className="space-y-5">
      <StepHeading
        title="Vehicle category"
        subtitle="Select the type of vehicle the rider will be operating. Plate and chassis details will be collected at RIN registration after training."
      />
      <FormField
        control={form.control}
        name="vehicleCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vehicle type <Required /></FormLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
              {VEHICLE_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => field.onChange(v.value)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 text-center transition-all ${
                    field.value === v.value
                      ? "border-green-600 bg-green-50"
                      : "border-slate-200 hover:border-green-300"
                  }`}
                >
                  <span className="text-3xl">{v.emoji}</span>
                  <span className={`text-sm font-semibold ${field.value === v.value ? "text-green-800" : "text-slate-700"}`}>
                    {v.value}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-snug">
                    {v.description}
                  </span>
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
        Plate number, chassis number, and driver's license details will be
        completed by the operator <strong>after</strong> training is passed.
      </div>
    </div>
  );
}

function KinStep({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  return (
    <div className="space-y-5">
      <StepHeading
        title="Next of kin"
        subtitle="Emergency contact information for the rider."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="nextOfKinName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name <Required /></FormLabel>
              <FormControl>
                <Input placeholder="Next of kin's full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nextOfKinContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number <Required /></FormLabel>
              <FormControl>
                <Input placeholder="0244000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ─── Small shared components ──────────────────────────────────────────────────

function Required() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PreRegistrationFormProps {
  onSuccess?: (preRegId: string) => void;
}

export function PreRegistrationForm({ onSuccess }: PreRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preRegId, setPreRegId] = useState("");
  const [submitError, setSubmitError] = useState("");

  const form = useForm<PreRegistrationData>({
    resolver: zodResolver(preRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      dateOfBirth: "",
      gender: undefined,
      idType: undefined,
      idNumber: "",
      region: "",
      districtMunicipality: "",
      residentialTown: "",
      vehicleCategory: undefined,
      nextOfKinName: "",
      nextOfKinContact: "",
    },
  });

  // Per-step validation using each step's sub-schema
  const validateStep = async (step: number): Promise<boolean> => {
    const schema = STEP_SCHEMAS[step as keyof typeof STEP_SCHEMAS];
    if (!schema) return true;
    const fields = Object.keys(schema.shape) as (keyof PreRegistrationData)[];
    return await form.trigger(fields);
  };

  const handleNext = async () => {
    const valid = await validateStep(currentStep);
    if (!valid) return;
    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep]
    );
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: PreRegistrationData) => {
    setIsSubmitting(true);
    setSubmitError("");
    const result = await savePreRegistration(data);
    setIsSubmitting(false);

    if (result.success) {
      setPreRegId(result.preRegId);
      setSuccess(true);
      onSuccess?.(result.preRegId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSubmitError(result.error);
    }
  };

  const handleReset = () => {
    form.reset();
    setCurrentStep(1);
    setCompletedSteps([]);
    setSuccess(false);
    setPreRegId("");
    setSubmitError("");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <BioStep form={form} />;
      case 2: return <IdStep form={form} />;
      case 3: return <LocationStep form={form} />;
      case 4: return <VehicleStep form={form} />;
      case 5: return <KinStep form={form} />;
    }
  };

  const progress = Math.round((completedSteps.length / STEPS.length) * 100);

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    const data = form.getValues();
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Registration submitted!</p>
            <p className="text-sm text-green-700 mt-0.5">
              The rider will be contacted with a training date. Their RIN will be
              issued after training is passed.
            </p>
          </div>
        </div>

        {/* Pre-reg card */}
        <Card className="overflow-hidden">
          <div className="bg-green-700 px-6 py-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-200 mb-1">
              Pre-registration reference
            </p>
            <p className="text-2xl font-black font-mono tracking-widest">
              {preRegId}
            </p>
            <p className="text-xs text-green-300 mt-1">
              Keep this reference. Present it at the training centre.
            </p>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-3">
            <Detail label="Full name"      value={data.fullName} span />
            <Detail label="Phone"          value={data.phoneNumber} />
            <Detail label="Date of birth"  value={data.dateOfBirth} />
            <Detail label="Gender"         value={data.gender} />
            <Detail label="ID type"        value={data.idType} />
            <Detail label="ID number"      value={data.idNumber} />
            <Detail label="Region"         value={data.region} />
            <Detail label="Town"           value={data.residentialTown} />
            <Detail label="Vehicle"        value={data.vehicleCategory} />
            <Detail label="Next of kin"    value={data.nextOfKinName} />
            <Detail label="Kin contact"    value={data.nextOfKinContact} />
          </div>
          <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Status: Pending training — RIN will be issued after training is completed
            </p>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            onClick={() => window.print()}
            variant="outline"
            className="gap-2 flex-1"
          >
            Print confirmation
          </Button>
          <Button
            size="lg"
            onClick={handleReset}
            className="bg-green-700 hover:bg-green-800 gap-2 flex-1"
          >
            <Plus className="h-4 w-4" />
            Register another rider
          </Button>
        </div>
      </div>
    );
  }

  // ── Multi-step form ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Pre-training registration open
        </div>
        <h1 className="text-xl font-bold text-slate-900">Rider Pre-Registration</h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete this form before your training session. You will receive your
          RIN after training is passed.
        </p>
      </div>

      {/* Step pills (mobile + desktop) */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
        {STEPS.map((step) => {
          const isDone = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-all ${
                isCurrent
                  ? "bg-green-700 text-white border-green-700"
                  : isDone
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}
            >
              {isDone ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <Icon className="w-3 h-3" />
              )}
              {step.title}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
          <span>Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].title}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(progress, (currentStep / STEPS.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Form card */}
      <Card className="p-6 sm:p-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA")
                e.preventDefault();
            }}
          >
            {renderStep()}

            {/* Submit error */}
            {submitError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
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
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="bg-green-700 hover:bg-green-800 gap-2 min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Submit registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}

// ─── CertField helper for success screen ─────────────────────────────────────
function Detail({
  label,
  value,
  span,
}: {
  label: string;
  value?: string | null;
  span?: boolean;
}) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800">
        {value || <span className="text-slate-300 italic font-normal">—</span>}
      </p>
    </div>
  );
}