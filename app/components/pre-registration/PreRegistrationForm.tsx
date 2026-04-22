"use client";

import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2, Loader2, ChevronRight, ChevronLeft,
  Phone, User, MapPin, FileText, Users, CreditCard,
  Smartphone, AlertCircle, Check, Printer, Plus, Shield,
  Calendar, IdCard, Truck, Heart, Wallet, Building2,
  Navigation, UserCircle, Camera, Upload, X, RotateCcw,
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
  preRegistrationSchema,
  type PreRegistrationData,
} from "@/lib/pre-registration-schema";
import { savePreRegistration } from "@/lib/pre-registration-service";
import { initiatePayment, PaymentStatus, verifyPayment } from "@/lib/paystack-service";
import { DISTRICT_CODES, CATEGORY_CODES } from "@/lib/rin-constants";


// ─── Font injection ───────────────────────────────────────────────────────────
// Add to your app/layout.tsx <head>:
// <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

// ─── Types ────────────────────────────────────────────────────────────────────

type MomoNetwork = "MTN" | "VODAFONE" | "AIRTELTIGO";

// ─── Constants ────────────────────────────────────────────────────────────────

const DISTRICTS  = Object.keys(DISTRICT_CODES);
const VEHICLES   = Object.keys(CATEGORY_CODES);

const ID_TYPES = [
  { value: "GHANA_CARD", label: "Ghana Card",  placeholder: "GHA-712014412-4", icon: IdCard },
  { value: "VOTERS_ID",  label: "Voter's ID",  placeholder: "4393000029",       icon: FileText },
  { value: "PASSPORT",   label: "Passport",    placeholder: "G2282683",          icon: UserCircle },
] as const;

const MOMO_NETWORKS: { value: MomoNetwork; label: string; color: string; abbr: string }[] = [
  { value: "MTN",        label: "MTN Mobile Money",  color: "#F59E0B", abbr: "MTN"       },
  { value: "VODAFONE",   label: "Telecel Cash",       color: "#EF4444", abbr: "Telecel"   },
  { value: "AIRTELTIGO", label: "AirtelTigo Money",  color: "#EC4899", abbr: "AirtelTigo" },
];

const STEPS = [
  { id: 1, label: "Application Form" },
  { id: 2, label: "Review & Submit"  },
];

const REGISTRATION_FEE_GHS = 150;

// ─── Styles ───────────────────────────────────────────────────────────────────

const FONT_DISPLAY = { fontFamily: "'Cormorant Garamond', Georgia, serif" };
const FONT_BODY    = { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" };

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

/** Labelled input wrapper with icon */
function FieldWrap({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" style={FONT_BODY}>
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

/** Section card */
function Section({
  title, icon: Icon, children,
}: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden" style={{ background: "#FAFAF9" }}>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50">
          <Icon className="h-4 w-4 text-emerald-700" />
        </span>
        <h3 className="text-base font-semibold text-slate-800" style={FONT_DISPLAY}>{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/** Divider label */
function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>;
}

// ─── Passport Photo Upload ────────────────────────────────────────────────────

function PassportPhotoUpload({
  value, onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden" style={{ background: "#FAFAF9" }}>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50">
          <Camera className="h-4 w-4 text-emerald-700" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-800" style={FONT_DISPLAY}>Passport Photograph</h3>
          <p className="text-xs text-slate-400" style={FONT_BODY}>Required for rider identification card</p>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Preview / placeholder */}
          <div
            className={`relative flex-shrink-0 w-36 h-44 rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${
              dragging
                ? "border-emerald-500 bg-emerald-50"
                : value
                ? "border-slate-200"
                : "border-dashed border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50"
            }`}
            onClick={() => !value && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {value ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="Passport photo" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(null); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-slate-400" />
                </div>
                <Upload className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400" style={FONT_BODY}>
                  {dragging ? "Drop here" : "Upload photo"}
                </span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2" style={FONT_BODY}>Photo Requirements</p>
              <ul className="space-y-1.5">
                {[
                  "Clear, front-facing photo on a plain white or light background",
                  "Face must be fully visible — no hats, sunglasses, or heavy shadows",
                  "Recent photo taken within the last 6 months",
                  "Minimum 300×400 px · JPG or PNG format",
                ].map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-500" style={FONT_BODY}>
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                className="gap-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Upload className="h-3.5 w-3.5" />
                {value ? "Replace Photo" : "Choose File"}
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(null)}
                  className="gap-2 text-xs text-slate-500"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) processFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Step 1 — Application Form ────────────────────────────────────────────────

function ApplicationStep({
  form,
  photo,
  onPhotoChange,
}: {
  form: ReturnType<typeof useForm<PreRegistrationData>>;
  photo: string | null;
  onPhotoChange: (v: string | null) => void;
}) {
  const idType = form.watch("idType");
  const selectedIdType = ID_TYPES.find((t) => t.value === idType);
  const IdIcon = selectedIdType?.icon ?? IdCard;

  return (
    <div className="space-y-6">
      {/* Passport Photo */}
      <PassportPhotoUpload value={photo} onChange={onPhotoChange} />

      {/* Personal */}
      <Section title="Personal Information" icon={User}>
        <FieldGrid>
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FieldWrap label="Full Legal Name" required>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="e.g. Kwame Asante Mensah"
                      className="pl-10 h-11 bg-white border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-emerald-100"
                      style={FONT_BODY}
                      {...field}
                    />
                  </div>
                </FormControl>
              </FieldWrap>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          <FormField control={form.control} name="phoneNumber" render={({ field }) => (
            <FormItem>
              <FieldWrap label="Phone Number" required hint="10-digit Ghana mobile number">
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="0244000000" className="pl-10 h-11 font-mono bg-white border-slate-200 focus:border-emerald-500" style={FONT_BODY} {...field} />
                  </div>
                </FormControl>
              </FieldWrap>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
            <FormItem>
              <FieldWrap label="Date of Birth" required>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="date" className="pl-10 h-11 bg-white border-slate-200 focus:border-emerald-500" style={FONT_BODY} {...field} />
                  </div>
                </FormControl>
              </FieldWrap>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FieldWrap label="Gender" required>
                <div className="grid grid-cols-3 gap-2">
                  {(["Male", "Female", "Other"] as const).map((g) => (
                    <button
                      key={g} type="button"
                      onClick={() => field.onChange(g)}
                      className={`h-11 rounded-lg border text-sm font-medium transition-all ${
                        field.value === g
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                      style={FONT_BODY}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </FieldWrap>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />
        </FieldGrid>
      </Section>

      {/* Identification */}
      <Section title="Official Identification" icon={IdCard}>
        <FieldGrid>
          <FormField control={form.control} name="idType" render={({ field }) => (
            <FormItem>
              <FieldWrap label="ID Type" required>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-emerald-500" style={FONT_BODY}>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ID_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4 text-slate-500" />
                          <span style={FONT_BODY}>{t.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          <FormField control={form.control} name="idNumber" render={({ field }) => (
            <FormItem>
              <FieldWrap label="ID Number" required hint={selectedIdType?.placeholder ? `Format: ${selectedIdType.placeholder}` : undefined}>
                <FormControl>
                  <div className="relative">
                    <IdIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder={selectedIdType?.placeholder ?? "Enter ID number"}
                      disabled={!idType}
                      className="pl-10 h-11 font-mono bg-white border-slate-200 focus:border-emerald-500 disabled:opacity-40"
                      style={FONT_BODY}
                      {...field}
                    />
                  </div>
                </FormControl>
              </FieldWrap>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />
        </FieldGrid>
      </Section>

      {/* Location */}
      <Section title="Residential Location" icon={MapPin}>
        <FieldGrid>
          <FormItem>
            <FieldWrap label="Region">
              <div className="h-11 px-4 flex items-center rounded-lg border border-slate-100 bg-slate-50 gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600 flex-1" style={FONT_BODY}>Greater Accra</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">Pilot Region</span>
              </div>
            </FieldWrap>
            <FormField control={form.control} name="region" render={({ field }) => (
              <input type="hidden" {...field} value="Greater Accra" />
            )} />
          </FormItem>

          <FormField control={form.control} name="districtMunicipality" render={({ field }) => (
            <FormItem>
              <FieldWrap label="District / Municipality" required>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-emerald-500" style={FONT_BODY}>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-56">
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d} style={FONT_BODY}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          <FormField control={form.control} name="residentialTown" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FieldWrap label="Residential Town / Area" required>
                <FormControl>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="e.g. Tema, Madina, Kasoa, Achimota"
                      className="pl-10 h-11 bg-white border-slate-200 focus:border-emerald-500"
                      style={FONT_BODY}
                      {...field}
                    />
                  </div>
                </FormControl>
              </FieldWrap>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />
        </FieldGrid>
      </Section>

      {/* Vehicle */}
      <Section title="Vehicle Information" icon={Truck}>
        <FormField control={form.control} name="vehicleCategory" render={({ field }) => (
          <FormItem>
            <FieldWrap label="Vehicle Category" required hint="Detailed licence, plate and chassis numbers will be captured after training.">
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-emerald-500 max-w-sm" style={FONT_BODY}>
                    <SelectValue placeholder="Select vehicle category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLES.map((v) => (
                    <SelectItem key={v} value={v} style={FONT_BODY}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrap>
            <FormMessage className="text-xs" />
          </FormItem>
        )} />
      </Section>

      {/* Next of Kin */}
      <Section title="Emergency Contact" icon={Heart}>
        <FieldGrid>
          <FormField control={form.control} name="nextOfKinName" render={({ field }) => (
            <FormItem>
              <FieldWrap label="Full Name" required>
                <FormControl>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Name of next of kin" className="pl-10 h-11 bg-white border-slate-200 focus:border-emerald-500" style={FONT_BODY} {...field} />
                  </div>
                </FormControl>
              </FieldWrap>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          <FormField control={form.control} name="nextOfKinContact" render={({ field }) => (
            <FormItem>
              <FieldWrap label="Phone Number" required>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="0244000000" className="pl-10 h-11 font-mono bg-white border-slate-200 focus:border-emerald-500" style={FONT_BODY} {...field} />
                  </div>
                </FormControl>
              </FieldWrap>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />
        </FieldGrid>
      </Section>
    </div>
  );
}

// ─── Step 2 — Review & Payment ────────────────────────────────────────────────

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex-shrink-0" style={FONT_BODY}>{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right" style={FONT_BODY}>{value || "—"}</span>
    </div>
  );
}

function ReviewSection({
  title, icon: Icon, children,
}: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500" style={FONT_BODY}>{title}</span>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

function PaymentWidget({
  riderPhone, riderName, preRegId, onPaymentSuccess,
}: {
  riderPhone: string; riderName: string; preRegId: string;
  onPaymentSuccess: (txnId: string, reference: string) => void;
}) {
  const [network,   setNetwork]   = useState<MomoNetwork | "">("");
  const [momoPhone, setMomoPhone] = useState(riderPhone);
  const [status,    setStatus]    = useState<PaymentStatus>("idle");
  const [reference, setReference] = useState("");
  const [error,     setError]     = useState("");
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startPolling(ref: string, count = 0) {
    if (count >= 12) {
      setStatus("failed");
      setError("Payment timed out. Please try again.");
      return;
    }
    pollRef.current = setTimeout(async () => {
      const verify = await verifyPayment(ref);
      if (verify.status === "success") {
        setStatus("success");
        onPaymentSuccess(verify.transactionId ?? "", ref);
      } else if (verify.status === "failed") {
        setStatus("failed");
        setError("Payment was declined or cancelled. Please try again.");
      } else {
        setPollCount(count + 1);
        startPolling(ref, count + 1);
      }
    }, 5000);
  }

  async function handleInitiate() {
    if (!network || !momoPhone.trim()) return;
    setStatus("pending");
    setError("");
    const result = await initiatePayment({
      phone: momoPhone,
      network: network as MomoNetwork,
      preRegId,
      riderName,
      email: `rider.${momoPhone.replace(/\D/g, "")}@rinsystem.gh`,
    });

    if (!result.success) {
      setStatus("failed");
      setError(result.error ?? "Payment initiation failed. Please try again.");
      return;
    }

    setReference(result.reference);
    startPolling(result.reference);
  }

  if (status === "pending") {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 flex flex-col items-center text-center gap-5">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-[3px] border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
          <Smartphone className="absolute inset-0 m-auto h-7 w-7 text-emerald-600" />
        </div>
        <div>
          <p className="text-base font-semibold text-emerald-900" style={FONT_DISPLAY}>Awaiting your confirmation</p>
          <p className="text-sm text-emerald-700 mt-1 max-w-sm" style={FONT_BODY}>
            A payment prompt of <strong>GHS {REGISTRATION_FEE_GHS}</strong> has been sent to{" "}
            <strong className="font-mono">{momoPhone}</strong>. Approve it to complete your registration.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-600" style={FONT_BODY}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Waiting… ({Math.max(0, 60 - pollCount * 5)}s)
        </div>
        <button
          type="button"
          onClick={() => { setStatus("idle"); setError(""); if (pollRef.current) clearTimeout(pollRef.current); }}
          className="text-xs text-slate-500 underline hover:text-slate-700"
          style={FONT_BODY}
        >
          Cancel and try again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Amount header */}
      <div className="flex items-center justify-between px-6 py-5" style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300" style={FONT_BODY}>Training Registration Fee</p>
          <p className="text-xs text-emerald-400 mt-0.5" style={FONT_BODY}>One-time payment · Non-refundable</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black text-white" style={FONT_DISPLAY}>GHS {REGISTRATION_FEE_GHS}</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Network selection */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3" style={FONT_BODY}>
            Select Network <span className="text-red-400">*</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {MOMO_NETWORKS.map((n) => (
              <button
                key={n.value}
                type="button"
                onClick={() => setNetwork(n.value)}
                className={`flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all ${
                  network === n.value
                    ? "border-emerald-500 bg-emerald-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="w-7 h-7 rounded-full shadow-sm" style={{ background: n.color }} />
                <span className={`text-xs font-semibold ${network === n.value ? "text-emerald-700" : "text-slate-600"}`} style={FONT_BODY}>
                  {n.abbr}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* MoMo number */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2" style={FONT_BODY}>
            Mobile Money Number <span className="text-red-400">*</span>
          </p>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              value={momoPhone}
              onChange={(e) => setMomoPhone(e.target.value)}
              placeholder="0244000000"
              className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all bg-white"
              style={FONT_BODY}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1" style={FONT_BODY}>Pre-filled from registration. Change if your MoMo number differs.</p>
        </div>

        {/* Error */}
        {(error || status === "failed") && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700" style={FONT_BODY}>{error || "Payment failed. Please try again."}</p>
          </div>
        )}

        {/* Security note */}
        <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg">
          <Shield className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500" style={FONT_BODY}>
            Payment is processed securely via Hanypay. CTS Africa does not store your Mobile Money PIN.
          </p>
        </div>

        {/* CTA */}
        <Button
          type="button"
          onClick={handleInitiate}
          disabled={!network || !momoPhone.trim()}
          className="w-full h-12 text-sm font-semibold gap-2 rounded-xl shadow-sm transition-all"
          style={{ background: "linear-gradient(135deg, #065f46 0%, #047857 100%)", ...FONT_BODY }}
        >
          <Wallet className="h-4 w-4" />
          Pay GHS {REGISTRATION_FEE_GHS} via Mobile Money
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({
  data, photo, riderPhone, riderName,
  onPaymentSuccess,
}: {
  data: PreRegistrationData;
  photo: string | null;
  riderPhone: string;
  riderName: string;
  onPaymentSuccess: (txnId: string, ref: string) => void;
}) {
  const idLabel = ID_TYPES.find((t) => t.value === data.idType)?.label ?? data.idType;

  return (
    <div className="space-y-6">
      {/* Alert */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900" style={FONT_BODY}>Review before payment</p>
          <p className="text-xs text-amber-700 mt-0.5" style={FONT_BODY}>
            Please verify all information below. Details cannot be changed after payment is processed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — review cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Photo preview */}
          {photo && (
            <div className="rounded-xl border border-slate-100 bg-white p-5 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="Passport photo" className="w-16 h-20 rounded-lg object-cover border border-slate-200 shadow-sm" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500" style={FONT_BODY}>Passport Photograph</p>
                <p className="text-sm text-slate-700 mt-1 font-semibold" style={FONT_BODY}>{data.fullName}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 mt-1 font-medium uppercase tracking-wider" style={FONT_BODY}>
                  <Check className="h-2.5 w-2.5" /> Photo uploaded
                </span>
              </div>
            </div>
          )}

          <ReviewSection title="Personal Information" icon={User}>
            <ReviewField label="Full Name" value={data.fullName} />
            <ReviewField label="Phone" value={data.phoneNumber} />
            <ReviewField label="Date of Birth" value={data.dateOfBirth} />
            <ReviewField label="Gender" value={data.gender} />
          </ReviewSection>

          <ReviewSection title="Identification" icon={IdCard}>
            <ReviewField label="ID Type" value={idLabel} />
            <ReviewField label="ID Number" value={data.idNumber} />
          </ReviewSection>

          <ReviewSection title="Location & Vehicle" icon={MapPin}>
            <ReviewField label="Region" value={data.region} />
            <ReviewField label="District" value={data.districtMunicipality} />
            <ReviewField label="Town" value={data.residentialTown} />
            <ReviewField label="Vehicle Category" value={data.vehicleCategory} />
          </ReviewSection>

          <ReviewSection title="Emergency Contact" icon={Heart}>
            <ReviewField label="Name" value={data.nextOfKinName} />
            <ReviewField label="Phone" value={data.nextOfKinContact} />
          </ReviewSection>
        </div>

        {/* Right — payment */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3" style={FONT_BODY}>
              Complete Payment
            </p>
            <PaymentWidget
              riderPhone={riderPhone}
              riderName={riderName}
              preRegId="PENDING"
              onPaymentSuccess={onPaymentSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  preRegId, data, txnId, photo, onReset,
}: {
  preRegId: string; data: PreRegistrationData; txnId: string;
  photo: string | null; onReset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-2" style={FONT_DISPLAY}>Registration Successful</h2>
      <p className="text-slate-500 mb-8 text-sm" style={FONT_BODY}>
        Your training registration has been submitted. Present the reference below at the training centre.
      </p>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg text-left">
        {/* Header */}
        <div className="px-8 py-6 flex items-center gap-5" style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" }}>
          {photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo} alt="Rider photo" className="w-16 h-20 rounded-lg object-cover border-2 border-emerald-400 flex-shrink-0" />
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300 mb-1" style={FONT_BODY}>
              Pre-Registration Reference
            </p>
            <p className="text-2xl font-mono font-bold text-white">{preRegId}</p>
            <p className="text-sm text-emerald-300 mt-1 font-medium" style={FONT_DISPLAY}>{data.fullName}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Phone Number", value: data.phoneNumber, icon: Phone },
              { label: "District", value: data.districtMunicipality, icon: MapPin },
              { label: "Vehicle Type", value: data.vehicleCategory, icon: Truck },
              { label: "Amount Paid", value: `GHS ${REGISTRATION_FEE_GHS}`, icon: Wallet },
              { label: "Transaction ID", value: txnId || "—", icon: CreditCard },
              { label: "Status", value: "Pending Training", icon: Calendar },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={FONT_BODY}>{label}</p>
                  <p className="text-sm font-semibold text-slate-800 truncate" style={FONT_BODY}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800" style={FONT_BODY}>
            Your Rider Identification Number (RIN) will be issued after you successfully complete the mandatory training programme.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={() => window.print()} className="flex-1 gap-2 h-11" style={FONT_BODY}>
          <Printer className="h-4 w-4" /> Print Receipt
        </Button>
        <Button onClick={onReset} className="flex-1 h-11 gap-2 bg-emerald-700 hover:bg-emerald-800" style={FONT_BODY}>
          <Plus className="h-4 w-4" /> Register Another Rider
        </Button>
      </div>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
                done    ? "bg-emerald-600 border-emerald-600 text-white"
                : active ? "bg-white border-emerald-600 text-emerald-700 shadow-md"
                :          "bg-white border-slate-200 text-slate-400"
              }`} style={FONT_BODY}>
                {done ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span className={`text-xs font-semibold mt-2 whitespace-nowrap ${
                active ? "text-emerald-700" : done ? "text-slate-600" : "text-slate-400"
              }`} style={FONT_BODY}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`w-24 sm:w-32 h-0.5 mx-3 mb-5 rounded-full transition-all ${
                current > step.id ? "bg-emerald-500" : "bg-slate-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PreRegistrationForm({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const [step,        setStep]        = useState(1);
  const [photo,       setPhoto]       = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [preRegId,    setPreRegId]    = useState("");
  const [txnId,       setTxnId]       = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving,    setIsSaving]    = useState(false);

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

  async function handleToReview() {
    setIsValidating(true);
    const valid = await form.trigger();
    setIsValidating(false);
    if (!valid) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePaymentSuccess(transactionId: string, reference: string) {
    setTxnId(transactionId);
    setIsSaving(true);
    setSubmitError("");

    const data = form.getValues();
    const result = await savePreRegistration({
      ...data,
      paymentReference: reference,
      paymentTxnId:     transactionId,
      paymentStatus:    "paid",
      paymentAmount:    REGISTRATION_FEE_GHS,
    });

    setIsSaving(false);
    if (result.success) {
      setPreRegId(result.preRegId);
      setSuccess(true);
      onSuccess?.(result.preRegId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSubmitError(result.error);
    }
  }

  function handleReset() {
    form.reset({ region: "Greater Accra" });
    setStep(1);
    setPhoto(null);
    setSuccess(false);
    setPreRegId("");
    setTxnId("");
    setSubmitError("");
  }

  const data = form.getValues();

  // ── Success ──────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen p-6 md:p-10" style={{ background: "#F7F6F3", ...FONT_BODY }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
        <div className="max-w-4xl mx-auto">
          <SuccessScreen preRegId={preRegId} data={data} txnId={txnId} photo={photo} onReset={handleReset} />
        </div>
      </div>
    );
  }

  // ── Saving overlay ────────────────────────────────────────────────────────
  if (isSaving) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#F7F6F3", ...FONT_BODY }}>
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <p className="text-slate-600 text-sm">Saving your registration…</p>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#F7F6F3", ...FONT_BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Page header */}
      <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" }} className="px-6 py-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-800/30 mb-5">
          <Shield className="h-3.5 w-3.5 text-emerald-300" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300" style={FONT_BODY}>
            CTS Africa · Greater Accra Pilot Programme
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" style={FONT_DISPLAY}>
          Commercial Rider<br />Training Registration
        </h1>
        <p className="text-emerald-200 text-sm max-w-lg mx-auto" style={FONT_BODY}>
          Complete the form below to enrol in the mandatory training and certification programme
          for commercial motorcycle and tricycle operators in Greater Accra.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <StepIndicator current={step} />

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-10">
            <Form {...form}>
              <form
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA")
                    e.preventDefault();
                }}
              >
                {step === 1 && (
                  <ApplicationStep form={form} photo={photo} onPhotoChange={setPhoto} />
                )}
                {step === 2 && (
                  <ReviewStep
                    data={data}
                    photo={photo}
                    riderPhone={data.phoneNumber}
                    riderName={data.fullName}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                )}

                {submitError && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700" style={FONT_BODY}>{submitError}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep((s) => Math.max(s - 1, 1))}
                    disabled={step === 1}
                    className="gap-2 h-11 px-6 border-slate-200 text-slate-600"
                    style={FONT_BODY}
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>

                  {step === 1 && (
                    <Button
                      type="button"
                      onClick={handleToReview}
                      disabled={isValidating}
                      className="gap-2 h-11 px-8 text-sm font-semibold rounded-xl"
                      style={{ background: "linear-gradient(135deg, #065f46 0%, #047857 100%)", ...FONT_BODY }}
                    >
                      {isValidating
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Validating…</>
                        : <>Review Application <ChevronRight className="h-4 w-4" /></>
                      }
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8 flex items-center justify-center gap-2" style={FONT_BODY}>
          <Shield className="h-3 w-3" />
          Secured by Hanypay · CTS Africa Limited · All rights reserved
        </p>
      </div>
    </div>
  );
}

