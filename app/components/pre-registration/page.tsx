"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2,
  Plus, User, CreditCard, MapPin, Bike, Users, Lock,
} from "lucide-react";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  preRegistrationSchema, type PreRegistrationData,
  preBioSchema, preIdSchema, preLocationSchema, preVehicleSchema, preKinSchema,
} from "@/lib/pre-registration-schema";
import { savePreRegistration } from "@/lib/pre-registration-service";
import { DISTRICT_CODES, CATEGORY_CODES } from "@/lib/rin-constants";

// ─── Constants (sourced from rin-constants for consistency) ───────────────────

const DISTRICTS = Object.keys(DISTRICT_CODES);

const VEHICLE_OPTIONS: { value: string; emoji: string; label: string }[] = [
  { value: "Motorbike",   emoji: "🏍️", label: "Motorbike"   },
  { value: "Tricycle",    emoji: "🛺", label: "Tricycle"    },
  { value: "Pragya",      emoji: "🚐", label: "Pragya"      },
  { value: "Quadricycle", emoji: "🚗", label: "Quadricycle" },
];

const ID_TYPE_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "GHANA_CARD", label: "Ghana Card",  hint: "GHA-000000000-0"  },
  { value: "VOTERS_ID",  label: "Voter ID",    hint: "10-digit number"  },
  { value: "PASSPORT",   label: "Passport",    hint: "e.g. G2282683"    },
];

const ID_PLACEHOLDERS: Record<string, string> = {
  GHANA_CARD: "GHA-712014412-4",
  VOTERS_ID:  "4393000029",
  PASSPORT:   "G2282683",
};

const STEPS = [
  { id: 1, title: "Bio Data",     description: "Personal details",  icon: User       },
  { id: 2, title: "ID",           description: "Identification",    icon: CreditCard },
  { id: 3, title: "Location",     description: "Where you live",    icon: MapPin     },
  { id: 4, title: "Vehicle",      description: "Vehicle type",      icon: Bike       },
  { id: 5, title: "Next of Kin",  description: "Emergency contact", icon: Users      },
];

const STEP_SCHEMAS = {
  1: preBioSchema, 2: preIdSchema, 3: preLocationSchema,
  4: preVehicleSchema, 5: preKinSchema,
};

// ─── Shared micro-components ──────────────────────────────────────────────────

function Req() {
  return <span className="text-red-400 ml-0.5 font-normal">*</span>;
}

function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pb-4 mb-5 border-b border-slate-100">
      <h2 className="text-sm font-semibold tracking-tight text-slate-800">{title}</h2>
      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>
    </div>
  );
}

function FieldNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{children}</p>
  );
}

// ─── Step 1 — Bio Data ────────────────────────────────────────────────────────

function BioStep({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  return (
    <div className="space-y-4">
      <SectionHead
        title="Personal information"
        subtitle="Enter details exactly as they appear on the rider's ID document."
      />

      <FormField control={form.control} name="fullName" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-slate-600">Full name <Req /></FormLabel>
          <FormControl>
            <Input placeholder="e.g. Kwame Asante Mensah" className="h-10 text-sm" {...field} />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )} />

      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="phoneNumber" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium text-slate-600">Phone <Req /></FormLabel>
            <FormControl>
              <Input placeholder="0244000000" className="h-10 text-sm" {...field} />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )} />

        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium text-slate-600">Date of birth <Req /></FormLabel>
            <FormControl>
              <Input type="date" className="h-10 text-sm" {...field} />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )} />
      </div>

      <FormField control={form.control} name="gender" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-slate-600">Gender <Req /></FormLabel>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {["Male", "Female", "Other"].map((g) => (
              <button key={g} type="button" onClick={() => field.onChange(g)}
                className={`h-10 rounded-lg border text-xs font-medium transition-all ${
                  field.value === g
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >{g}</button>
            ))}
          </div>
          <FormMessage className="text-xs" />
        </FormItem>
      )} />
    </div>
  );
}

// ─── Step 2 — ID ──────────────────────────────────────────────────────────────

function IdStep({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  const idType = form.watch("idType");

  return (
    <div className="space-y-4">
      <SectionHead
        title="Identification"
        subtitle="Select the ID the rider will present on the day of training."
      />

      <FormField control={form.control} name="idType" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-slate-600">ID type <Req /></FormLabel>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {ID_TYPE_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => field.onChange(opt.value)}
                className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                  field.value === opt.value
                    ? "border-emerald-500 bg-emerald-50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className={`text-xs font-semibold ${field.value === opt.value ? "text-emerald-700" : "text-slate-600"}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-slate-400">{opt.hint}</span>
              </button>
            ))}
          </div>
          <FormMessage className="text-xs" />
        </FormItem>
      )} />

      <FormField control={form.control} name="idNumber" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-slate-600">ID number <Req /></FormLabel>
          <FormControl>
            <Input
              placeholder={idType ? ID_PLACEHOLDERS[idType] : "Select an ID type first"}
              disabled={!idType}
              className="h-10 text-sm font-mono"
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )} />

      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
        <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
        <p className="text-xs text-amber-700 leading-relaxed">
          The rider must bring the original ID card to training. It will be verified before the session begins.
        </p>
      </div>
    </div>
  );
}

// ─── Step 3 — Location ────────────────────────────────────────────────────────

function LocationStep({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  return (
    <div className="space-y-4">
      <SectionHead
        title="Location"
        subtitle="Residential details of the rider. Pilot currently covers Greater Accra only."
      />

      {/* Region — locked for pilot phase */}
      <FormField control={form.control} name="region" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-slate-600">Region</FormLabel>
          <div className="h-10 px-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500">
            <span>Greater Accra</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Lock className="w-3 h-3" />
              Pilot phase
            </div>
          </div>
          <FieldNote>Registration is currently limited to Greater Accra. More regions will be added soon.</FieldNote>
          {/* Hidden input keeps form value in sync */}
          <input type="hidden" {...field} value="Greater Accra" />
        </FormItem>
      )} />

      <FormField control={form.control} name="districtMunicipality" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-slate-600">District / Municipality <Req /></FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-60">
              {DISTRICTS.map((d) => (
                <SelectItem key={d} value={d} className="text-sm">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage className="text-xs" />
        </FormItem>
      )} />

      <FormField control={form.control} name="residentialTown" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-slate-600">Residential town <Req /></FormLabel>
          <FormControl>
            <Input placeholder="e.g. Tema, Madina, Kasoa" className="h-10 text-sm" {...field} />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )} />
    </div>
  );
}

// ─── Step 4 — Vehicle ─────────────────────────────────────────────────────────

function VehicleStep({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  return (
    <div className="space-y-4">
      <SectionHead
        title="Vehicle category"
        subtitle="Select the vehicle type the rider will operate. Plate and chassis details are collected after training."
      />

      <FormField control={form.control} name="vehicleCategory" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-slate-600">Vehicle type <Req /></FormLabel>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {VEHICLE_OPTIONS.map((v) => (
              <button key={v.value} type="button" onClick={() => field.onChange(v.value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                  field.value === v.value
                    ? "border-emerald-500 bg-emerald-50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="text-xl leading-none">{v.emoji}</span>
                <span className={`text-sm font-medium ${field.value === v.value ? "text-emerald-700" : "text-slate-600"}`}>
                  {v.label}
                </span>
              </button>
            ))}
          </div>
          <FormMessage className="text-xs" />
        </FormItem>
      )} />

      <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <span className="text-slate-400 mt-0.5 shrink-0 text-xs">ℹ</span>
        <p className="text-xs text-slate-500 leading-relaxed">
          Plate number, chassis, and driver's license will be completed by the operator after training is passed.
        </p>
      </div>
    </div>
  );
}

// ─── Step 5 — Next of Kin ─────────────────────────────────────────────────────

function KinStep({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  return (
    <div className="space-y-4">
      <SectionHead
        title="Next of kin"
        subtitle="An emergency contact for the rider. Must be a different number from the rider's."
      />
      <FormField control={form.control} name="nextOfKinName" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-slate-600">Full name <Req /></FormLabel>
          <FormControl>
            <Input placeholder="e.g. Akua Asante" className="h-10 text-sm" {...field} />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )} />
      <FormField control={form.control} name="nextOfKinContact" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-slate-600">Phone number <Req /></FormLabel>
          <FormControl>
            <Input placeholder="0244000000" className="h-10 text-sm" {...field} />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )} />
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  preRegId,
  data,
  onReset,
}: {
  preRegId: string;
  data: PreRegistrationData;
  onReset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Banner */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Registration submitted</p>
          <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
            The rider will be contacted with a training date. RIN issued after training is passed.
          </p>
        </div>
      </div>

      {/* Reference card */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <div className="bg-emerald-700 px-5 py-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-300 mb-1">
            Pre-registration reference
          </p>
          <p className="text-2xl font-black font-mono tracking-widest text-white">{preRegId}</p>
          <p className="text-[11px] text-emerald-300 mt-1">Present this at the training centre</p>
        </div>

        <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3.5">
          {[
            { label: "Full name",    value: data.fullName,            span: true  },
            { label: "Phone",        value: data.phoneNumber                       },
            { label: "Date of birth",value: data.dateOfBirth                       },
            { label: "Gender",       value: data.gender                            },
            { label: "ID type",      value: data.idType                            },
            { label: "ID number",    value: data.idNumber                          },
            { label: "District",     value: data.districtMunicipality              },
            { label: "Town",         value: data.residentialTown                   },
            { label: "Vehicle",      value: data.vehicleCategory                   },
            { label: "Next of kin",  value: data.nextOfKinName                     },
            { label: "Kin contact",  value: data.nextOfKinContact                  },
          ].map(({ label, value, span }) => (
            <div key={label} className={span ? "col-span-2" : ""}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
              <p className="text-xs font-semibold text-slate-700 break-words">
                {value || <span className="text-slate-300 font-normal italic">—</span>}
              </p>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <p className="text-[11px] text-amber-700 font-medium">
            Status: Pending training — RIN issued after training is completed
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => window.print()} className="flex-1 text-xs gap-1.5">
          Print confirmation
        </Button>
        <Button size="sm" onClick={onReset} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Register another
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PreRegistrationForm({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const [currentStep, setCurrentStep]     = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [success, setSuccess]             = useState(false);
  const [preRegId, setPreRegId]           = useState("");
  const [submitError, setSubmitError]     = useState("");

  const form = useForm<PreRegistrationData>({
    resolver: zodResolver(preRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "", phoneNumber: "", dateOfBirth: "",
      gender: undefined, idType: undefined, idNumber: "",
      region: "Greater Accra", districtMunicipality: undefined,
      residentialTown: "", vehicleCategory: undefined,
      nextOfKinName: "", nextOfKinContact: "",
    },
  });

  const validateStep = async (step: number) => {
    const schema = STEP_SCHEMAS[step as keyof typeof STEP_SCHEMAS];
    if (!schema) return true;
    const fields = Object.keys(schema.shape) as (keyof PreRegistrationData)[];
    return form.trigger(fields);
  };

  const handleNext = async () => {
    if (!await validateStep(currentStep)) return;
    setCompletedSteps((p) => p.includes(currentStep) ? p : [...p, currentStep]);
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
    form.reset({ region: "Greater Accra" });
    setCurrentStep(1); setCompletedSteps([]);
    setSuccess(false); setPreRegId(""); setSubmitError("");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <BioStep      form={form} />;
      case 2: return <IdStep       form={form} />;
      case 3: return <LocationStep form={form} />;
      case 4: return <VehicleStep  form={form} />;
      case 5: return <KinStep      form={form} />;
    }
  };

  if (success) {
    return <SuccessScreen preRegId={preRegId} data={form.getValues()} onReset={handleReset} />;
  }

  const progress = Math.max(
    Math.round((completedSteps.length / STEPS.length) * 100),
    Math.round(((currentStep - 1) / STEPS.length) * 100)
  );

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Pre-training registration
        </div>
        <h1 className="text-lg font-bold tracking-tight text-slate-900">Rider Pre-Registration</h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Complete this form before your training session. Your RIN will be issued after training is passed.
        </p>
      </div>

      {/* Step pills */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {STEPS.map(({ id, title, icon: Icon }) => {
          const isDone    = completedSteps.includes(id);
          const isCurrent = currentStep === id;
          return (
            <div key={id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 border transition-all ${
              isCurrent ? "bg-emerald-700 text-white border-emerald-700"
                : isDone  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-white text-slate-400 border-slate-200"
            }`}>
              {isDone
                ? <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                : <Icon className="w-2.5 h-2.5" />
              }
              {title}
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
          <span className="font-medium">{STEPS[currentStep - 1].title}</span>
          <span>{currentStep} / {STEPS.length}</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA")
                e.preventDefault();
            }}
          >
            {renderStep()}

            {submitError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {submitError}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                className="gap-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button type="button" size="sm" onClick={handleNext} disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-800 gap-1.5 text-xs px-5"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-800 gap-1.5 text-xs px-5 min-w-[130px]"
                >
                  {isSubmitting
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…</>
                    : <><CheckCircle2 className="h-3.5 w-3.5" /> Submit</>
                  }
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}