"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getAuth, signInAnonymously } from "firebase/auth";
import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Info,
  Phone,
  User,
  MapPin,
  FileText,
  Users,
  CreditCard,
  Smartphone,
  AlertCircle,
  Check,
  Printer,
  Plus,
  Shield,
  Calendar,
  IdCard,
  Truck,
  Heart,
  Wallet,
  Building2,
  Navigation,
  UserCircle,
  Camera,
  Upload,
  X,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
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
} from "@/lib/pre-registration-schema";
import { saveRiderRegistration } from "@/lib/rider-service";
import type { RiderRegistrationData } from "@/app/lib/validations";
import {
  initiatePayment,
  PaymentStatus,
  verifyPayment,
} from "@/lib/paystack-service";
import { DISTRICT_CODES, CATEGORY_CODES } from "@/lib/rin-constants";


// ─── Types ─────────────────────────────────────────────────────────────────────
type MomoNetwork = "MTN" | "VODAFONE" | "AIRTELTIGO";


// ─── Constants ─────────────────────────────────────────────────────────────────
const DISTRICTS = Object.keys(DISTRICT_CODES);
const VEHICLES = Object.keys(CATEGORY_CODES);

const ID_TYPES = [
  {
    value: "GHANA_CARD",
    label: "Ghana Card",
    placeholder: "GHA-712014412-4",
    icon: IdCard,
  },
  {
    value: "VOTERS_ID",
    label: "Voter's ID",
    placeholder: "4393000029",
    icon: FileText,
  },
  {
    value: "PASSPORT",
    label: "Passport",
    placeholder: "G2282683",
    icon: UserCircle,
  },
] as const;

const MOMO_NETWORKS: {
  value: MomoNetwork;
  label: string;
  logo: string;
  abbr: string;
}[] = [
  {
    value: "MTN",
    label: "MTN Mobile Money",
    logo: "/logo/mtn.png",
    abbr: "MTN",
  },
  {
    value: "VODAFONE",
    label: "Telecel Cash",
    logo: "/logo/telecel.png",
    abbr: "Telecel",
  },
  {
    value: "AIRTELTIGO",
    label: "AirtelTigo Money",
    logo: "/logo/at.png",
    abbr: "AT",
  },
];

const REGISTRATION_FEE_GHS = 400;

// ─── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, title: "Personal Info", description: "Name, phone & DOB" },
  { id: 2, title: "ID & Location", description: "Identification & address" },
  {
    id: 3,
    title: "Vehicle & Kin",
    description: "Vehicle type & emergency contact",
  },
  { id: 4, title: "Review & Pay", description: "Confirm details & payment" },
];

// ─── Fonts ─────────────────────────────────────────────────────────────────────
const FONT_DISPLAY = { fontFamily: "'Cormorant Garamond', Georgia, serif" };
const FONT_BODY = { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" };

// ─── Shared Primitives ─────────────────────────────────────────────────────────
function FieldWrap({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs font-semibold uppercase tracking-widest text-slate-500"
        style={FONT_BODY}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border border-slate-100 overflow-hidden"
      style={{ background: "#FAFAF9" }}
    >
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 bg-white">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 shrink-0">
          <Icon className="h-4 w-4 text-emerald-700" />
        </span>
        <h3
          className="text-base font-semibold text-slate-800"
          style={FONT_DISPLAY}
        >
          {title}
        </h3>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
      {children}
    </div>
  );
}

// ─── Passport Photo Upload ──────────────────────────────────────────────────────
function PassportPhotoUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => onChange(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <Section title="Passport Photograph" icon={Camera}>
      <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
        <div
          className={`relative flex-shrink-0 w-32 h-40 sm:w-36 sm:h-44 rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${
            dragging
              ? "border-emerald-500 bg-emerald-50"
              : value
                ? "border-slate-200"
                : "border-dashed border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50"
          }`}
          onClick={() => !value && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Passport photo"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
              </div>
              <Upload className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400" style={FONT_BODY}>
                {dragging ? "Drop here" : "Upload photo"}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 w-full space-y-4">
          <div>
            <p
              className="text-sm font-semibold text-slate-700 mb-2"
              style={FONT_BODY}
            >
              Photo Requirements
            </p>
            <ul className="space-y-1.5">
              {[
                "Clear, front-facing photo on a plain white or light background",
                "Face must be fully visible — no hats, sunglasses, or heavy shadows",
                "Recent photo taken within the last 6 months",
                "Minimum 300×400 px · JPG or PNG format",
              ].map((req, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-500"
                  style={FONT_BODY}
                >
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
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
    </Section>
  );
}

// ─── Step 1 — Personal Info ─────────────────────────────────────────────────────
function Step1Personal({
  form,
  photo,
  onPhotoChange,
}: {
  form: ReturnType<typeof useForm<PreRegistrationData>>;
  photo: string | null;
  onPhotoChange: (v: string | null) => void;
}) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <PassportPhotoUpload value={photo} onChange={onPhotoChange} />

      <Section title="Personal Information" icon={User}>
        <FieldGrid>
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FieldWrap label="Full Legal Name" required>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="e.g. Kwame Asante Mensah"
                        className="pl-10 h-11 bg-white border-slate-200 text-slate-900 focus:border-emerald-500"
                        style={FONT_BODY}
                        {...field}
                      />
                    </div>
                  </FormControl>
                </FieldWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FieldWrap
                  label="Phone Number"
                  required
                  hint="10-digit Ghana mobile number"
                >
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="0244000000"
                        className="pl-10 h-11 font-mono bg-white border-slate-200 focus:border-emerald-500"
                        style={FONT_BODY}
                        {...field}
                      />
                    </div>
                  </FormControl>
                </FieldWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FieldWrap label="Date of Birth" required>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="date"
                        className="pl-10 h-11 bg-white border-slate-200 focus:border-emerald-500"
                        style={FONT_BODY}
                        {...field}
                      />
                    </div>
                  </FormControl>
                </FieldWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FieldWrap label="Gender" required>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Male", "Female", "Other"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => field.onChange(g)}
                        className={`h-11 rounded-lg border text-sm font-medium transition-all ${field.value === g ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
                        style={FONT_BODY}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </FieldWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </FieldGrid>
      </Section>
    </div>
  );
}

// ─── Step 2 — ID & Location ─────────────────────────────────────────────────────
function Step2IdLocation({
  form,
}: {
  form: ReturnType<typeof useForm<PreRegistrationData>>;
}) {
  const idType = form.watch("idType");
  const selectedIdType = ID_TYPES.find((t) => t.value === idType);
  const IdIcon = selectedIdType?.icon ?? IdCard;

  return (
    <div className="space-y-5 sm:space-y-6">
      <Section title="Official Identification" icon={IdCard}>
        <FieldGrid>
          <FormField
            control={form.control}
            name="idType"
            render={({ field }) => (
              <FormItem>
                <FieldWrap label="ID Type" required>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger
                        className="h-11 bg-white border-slate-200 focus:border-emerald-500"
                        style={FONT_BODY}
                      >
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
            )}
          />

          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => (
              <FormItem>
                <FieldWrap
                  label="ID Number"
                  required
                  hint={
                    selectedIdType?.placeholder
                      ? `Format: ${selectedIdType.placeholder}`
                      : undefined
                  }
                >
                  <FormControl>
                    <div className="relative">
                      <IdIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder={
                          selectedIdType?.placeholder ?? "Enter ID number"
                        }
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
            )}
          />
        </FieldGrid>
      </Section>

      <Section title="Residential Location" icon={MapPin}>
        <FieldGrid>
          <FormItem>
            <FieldWrap label="Region">
              <div className="h-11 px-3 sm:px-4 flex items-center rounded-lg border border-slate-100 bg-slate-50 gap-2">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                <span
                  className="text-sm text-slate-600 flex-1 truncate"
                  style={FONT_BODY}
                >
                  Greater Accra
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                  Pilot
                </span>
              </div>
            </FieldWrap>
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <input type="hidden" {...field} value="Greater Accra" />
              )}
            />
          </FormItem>

          <FormField
            control={form.control}
            name="districtMunicipality"
            render={({ field }) => (
              <FormItem>
                <FieldWrap label="District / Municipality" required>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger
                        className="h-11 bg-white border-slate-200 focus:border-emerald-500"
                        style={FONT_BODY}
                      >
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-56">
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d} style={FONT_BODY}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="residentialTown"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
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
            )}
          />
        </FieldGrid>
      </Section>
    </div>
  );
}

// ─── Step 3 — Vehicle & Emergency Contact ───────────────────────────────────────
function Step3VehicleKin({
  form,
}: {
  form: ReturnType<typeof useForm<PreRegistrationData>>;
}) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <Section title="Vehicle Information" icon={Truck}>
        <FormField
          control={form.control}
          name="vehicleCategory"
          render={({ field }) => (
            <FormItem>
              <FieldWrap
                label="Vehicle Category"
                required
                hint="Detailed licence, plate and chassis numbers will be captured after training."
              >
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger
                      className="h-11 bg-white border-slate-200 focus:border-emerald-500 w-full sm:max-w-sm"
                      style={FONT_BODY}
                    >
                      <SelectValue placeholder="Select vehicle category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VEHICLES.map((v) => (
                      <SelectItem key={v} value={v} style={FONT_BODY}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </Section>

      <Section title="Emergency Contact" icon={Heart}>
        <FieldGrid>
          <FormField
            control={form.control}
            name="nextOfKinName"
            render={({ field }) => (
              <FormItem>
                <FieldWrap label="Full Name" required>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Name of next of kin"
                        className="pl-10 h-11 bg-white border-slate-200 focus:border-emerald-500"
                        style={FONT_BODY}
                        {...field}
                      />
                    </div>
                  </FormControl>
                </FieldWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextOfKinContact"
            render={({ field }) => (
              <FormItem>
                <FieldWrap label="Phone Number" required>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="0244000000"
                        className="pl-10 h-11 font-mono bg-white border-slate-200 focus:border-emerald-500"
                        style={FONT_BODY}
                        {...field}
                      />
                    </div>
                  </FormControl>
                </FieldWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </FieldGrid>
      </Section>
    </div>
  );
}

// ─── Step 4 — Review & Payment ──────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0 gap-3">
      <span
        className="text-xs font-medium text-slate-400 uppercase tracking-wider flex-shrink-0"
        style={FONT_BODY}
      >
        {label}
      </span>
      <span
        className="text-sm font-semibold text-slate-800 text-right"
        style={FONT_BODY}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function ReviewCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-100">
        <Icon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span
          className="text-xs font-bold uppercase tracking-widest text-slate-500"
          style={FONT_BODY}
        >
          {title}
        </span>
      </div>
      <div className="px-4 sm:px-5">{children}</div>
    </div>
  );
}

function PaymentWidget({
  riderPhone,
  riderName,
  preRegId,
  onPaymentSuccess,
}: {
  riderPhone: string;
  riderName: string;
  preRegId: string;
  onPaymentSuccess: (txnId: string, reference: string) => void;
}) {
  const [network, setNetwork] = useState<MomoNetwork | "">("");
  const [momoPhone, setMomoPhone] = useState(riderPhone);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
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
        toast.error("Payment declined", {
          description: "Please check your MoMo balance and try again.",
        });
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
      toast.error("Could not send payment prompt", {
        description: result.error ?? "Please try again.",
      });
      return;
    }
    setReference(result.reference);
    startPolling(result.reference);
  }

  if (status === "pending") {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 sm:p-8 flex flex-col items-center text-center gap-5">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16">
          <div className="absolute inset-0 rounded-full border-[3px] border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
          <Smartphone className="absolute inset-0 m-auto h-6 w-6 sm:h-7 sm:w-7 text-emerald-600" />
        </div>
        <div>
          <p
            className="text-base font-semibold text-emerald-900"
            style={FONT_DISPLAY}
          >
            Awaiting your confirmation
          </p>
          <p
            className="text-sm text-emerald-700 mt-1 max-w-sm"
            style={FONT_BODY}
          >
            A payment prompt of <strong>GHS {REGISTRATION_FEE_GHS}</strong> has
            been sent to <strong className="font-mono">{momoPhone}</strong>.
            Approve it to complete your registration.
          </p>
        </div>
        <div
          className="flex items-center gap-2 text-xs text-emerald-600"
          style={FONT_BODY}
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Waiting… ({Math.max(0, 60 - pollCount * 5)}s)
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setError("");
            if (pollRef.current) clearTimeout(pollRef.current);
          }}
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
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5"
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
        }}
      >
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest text-emerald-300"
            style={FONT_BODY}
          >
            Training Registration Fee
          </p>
          <p className="text-xs text-emerald-400 mt-0.5" style={FONT_BODY}>
            One-time · Non-refundable
          </p>
        </div>
        <p
          className="text-3xl sm:text-4xl font-black text-white"
          style={FONT_DISPLAY}
        >
          GHS {REGISTRATION_FEE_GHS}
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3"
            style={FONT_BODY}
          >
            Select Network <span className="text-red-400">*</span>
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {MOMO_NETWORKS.map((n) => (
              <button
                key={n.value}
                type="button"
                onClick={() => setNetwork(n.value)}
                className={`flex flex-col items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-xl border-2 transition-all ${network === n.value ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white rounded-lg border shadow-sm p-1">
                  <img
                    src={n.logo}
                    alt={n.label}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-semibold ${network === n.value ? "text-emerald-700" : "text-slate-600"}`}
                  style={FONT_BODY}
                >
                  {n.abbr}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2"
            style={FONT_BODY}
          >
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
          <p className="text-xs text-slate-400 mt-1" style={FONT_BODY}>
            Pre-filled from registration. Change if your MoMo number differs.
          </p>
        </div>

        {(error || status === "failed") && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700" style={FONT_BODY}>
              {error || "Payment failed. Please try again."}
            </p>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg">
          <Shield className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500" style={FONT_BODY}>
            Payment is processed securely via Hanypay. PCRAA does not store
            your Mobile Money PIN.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleInitiate}
          disabled={!network || !momoPhone.trim()}
          className="w-full h-12 text-sm font-semibold gap-2 rounded-xl shadow-sm transition-all"
          style={{
            background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
            ...FONT_BODY,
          }}
        >
          <Wallet className="h-4 w-4" />
          Pay GHC{REGISTRATION_FEE_GHS}
        </Button>
      </div>
    </div>
  );
}

function Step4ReviewPay({
  data,
  photo,
  riderPhone,
  riderName,
  onPaymentSuccess,
}: {
  data: PreRegistrationData;
  photo: string | null;
  riderPhone: string;
  riderName: string;
  onPaymentSuccess: (txnId: string, ref: string) => void;
}) {
  const idLabel =
    ID_TYPES.find((t) => t.value === data.idType)?.label ?? data.idType;

  function handleBeforePayment(): Promise<{
    valid: boolean;
    error?: string | undefined;
  }> {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-start gap-3 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900" style={FONT_BODY}>
            Review before payment
          </p>
          <p className="text-xs text-amber-700 mt-0.5" style={FONT_BODY}>
            Please verify all information below. Details cannot be changed after
            payment is processed.
          </p>
        </div>
      </div>

      {/* On mobile: payment widget comes first for visibility */}
      <div className="block lg:hidden">
        <p
          className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3"
          style={FONT_BODY}
        >
          Complete Payment
        </p>
        <PaymentWidget
          riderPhone={riderPhone}
          riderName={riderName}
          preRegId="PENDING"
          onPaymentSuccess={onPaymentSuccess}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {photo && (
            <div className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt="Passport photo"
                className="w-14 h-18 sm:w-16 sm:h-20 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0"
              />
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest text-slate-500"
                  style={FONT_BODY}
                >
                  Passport Photograph
                </p>
                <p
                  className="text-sm text-slate-700 mt-1 font-semibold"
                  style={FONT_BODY}
                >
                  {data.fullName}
                </p>
                <span
                  className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 mt-1 font-medium uppercase tracking-wider"
                  style={FONT_BODY}
                >
                  <Check className="h-2.5 w-2.5" /> Photo uploaded
                </span>
              </div>
            </div>
          )}
          <ReviewCard title="Personal Information" icon={User}>
            <ReviewRow label="Full Name" value={data.fullName} />
            <ReviewRow label="Phone" value={data.phoneNumber} />
            <ReviewRow label="Date of Birth" value={data.dateOfBirth} />
            <ReviewRow label="Gender" value={data.gender} />
          </ReviewCard>
          <ReviewCard title="Identification" icon={IdCard}>
            <ReviewRow label="ID Type" value={idLabel} />
            <ReviewRow label="ID Number" value={data.idNumber} />
          </ReviewCard>
          <ReviewCard title="Location & Vehicle" icon={MapPin}>
            <ReviewRow label="Region" value={data.region} />
            <ReviewRow label="District" value={data.districtMunicipality} />
            <ReviewRow label="Town" value={data.residentialTown} />
            <ReviewRow label="Vehicle Category" value={data.vehicleCategory} />
          </ReviewCard>
          <ReviewCard title="Emergency Contact" icon={Heart}>
            <ReviewRow label="Name" value={data.nextOfKinName} />
            <ReviewRow label="Phone" value={data.nextOfKinContact} />
          </ReviewCard>
        </div>

        {/* Desktop-only sticky payment widget */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6">
            <p
              className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3"
              style={FONT_BODY}
            >
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

// ─── Success — Confirmation Receipt ────────────────────────────────────────────
function ConfirmationReceipt({
  bookingRef,
  data,
  txnId,
  photo,
  onReset,
}: {
  bookingRef: string;
  data: PreRegistrationData;
  txnId: string;
  photo: string | null;
  onReset: () => void;
}) {
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
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-6 sm:mb-8 print:hidden">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4 sm:mb-5">
          <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
        </div>
        <h2
          className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2"
          style={FONT_DISPLAY}
        >
          Registration Confirmed
        </h2>
        <p
          className="text-emerald-600 font-semibold text-sm mb-1"
          style={FONT_BODY}
        >
          Payment successful · Training slot secured
        </p>
        <p
          className="text-slate-500 text-sm max-w-md mx-auto px-4"
          style={FONT_BODY}
        >
          Please print this receipt and present it at the training centre on
          your scheduled date. A PCRAA official will issue your Rider ID
          card upon completion of training.
        </p>
      </div>

     {/* ── Receipt Card ── */}
<div
  id="receipt"
  className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-slate-300"
>
  {/* Receipt header band */}
  <div
    style={{
      background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
    }}
    className="px-6 sm:px-8 py-6 sm:py-7 text-white"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300/90 mb-2">
          PCRAA · Greater Accra Pilot
        </p>
        <h3 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight mb-1">
          Training Registration Receipt
        </h3>
        <p className="text-sm sm:text-base text-emerald-200/90 font-medium">
          Commercial Rider Training & Certification
        </p>
      </div>
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
        <ClipboardCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-200" />
      </div>
    </div>
  </div>

  {/* Booking reference highlight */}
  <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-start gap-5">
    <div className="flex-1 w-full bg-white border-2 border-emerald-600 rounded-xl px-5 sm:px-6 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 mb-1.5">
        Booking Reference
      </p>
      <p className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-emerald-900 select-all break-all">
        {bookingRef}
      </p>
      <p className="text-xs text-emerald-700/70 mt-2 font-medium">
        Issued {issuedDate} at {issuedTime}
      </p>
    </div>

    {photo && (
      <div className="flex flex-col items-center gap-2 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt="Passport photo"
          className="w-16 h-20 sm:w-18 sm:h-22 rounded-lg object-cover border-2 border-slate-200 shadow-md"
        />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Photo ID
        </p>
      </div>
    )}
  </div>

  {/* Applicant details */}
  <div className="px-6 sm:px-8 py-6 sm:py-7 space-y-6">
    {/* Personal */}
    <div>
      <div className="flex items-center gap-2 pb-2 border-b border-emerald-200 mb-4">
        <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
          <User className="h-3 w-3 text-emerald-700" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800">
          Applicant Details
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <ReceiptField label="Full Name" value={data.fullName} highlight />
        <ReceiptField label="Phone Number" value={data.phoneNumber} />
        <ReceiptField label="Date of Birth" value={data.dateOfBirth} />
        <ReceiptField label="Gender" value={data.gender} />
      </div>
    </div>

    {/* Location & Vehicle */}
    <div>
      <div className="flex items-center gap-2 pb-2 border-b border-emerald-200 mb-4">
        <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
          <MapPin className="h-3 w-3 text-emerald-700" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800">
          Location & Vehicle
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <ReceiptField label="District" value={data.districtMunicipality} />
        <ReceiptField label="Town / Area" value={data.residentialTown} />
        <ReceiptField 
          label="Vehicle Category" 
          value={data.vehicleCategory}
          highlight
        />
      </div>
    </div>

    {/* Payment */}
    <div>
      <div className="flex items-center gap-2 pb-2 border-b border-emerald-200 mb-4">
        <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
          <CreditCard className="h-3 w-3 text-emerald-700" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800">
          Payment Details
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <ReceiptField 
          label="Amount Paid" 
          value={`GHS ${REGISTRATION_FEE_GHS}.00`}
          highlight
          valueClassName="text-emerald-700 font-bold"
        />
        <ReceiptField label="Transaction ID" value={txnId || "—"} />
        <ReceiptField label="Payment Date" value={issuedDate} />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Status
          </p>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full px-3 py-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 
            Paid · Confirmed
          </span>
        </div>
      </div>
    </div>

    {/* Next steps callout */}
    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/70 border border-blue-200 p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <ClipboardCheck className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-900 mb-2">
            What happens next?
          </p>
          <ul className="space-y-2">
            {[
              "You will be contacted with your assigned training date and location.",
              "Attend training and present this receipt to the PCRAA official.",
              "Upon successful completion, your Rider ID card will be issued.",
            ].map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-blue-800"
              >
                <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>

  {/* Footer */}
  <div className="px-6 sm:px-8 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/80">
    <p className="text-[11px] text-slate-600 max-w-md font-medium">
      This receipt confirms your payment and registration. Please present it at your assigned training centre.
    </p>
    <div className="flex items-center gap-3">
      <div className="h-5 w-px bg-slate-300 hidden sm:block" />
      <p className="text-sm font-mono font-bold text-slate-500 bg-white px-3 py-1 rounded border border-slate-200">
        {bookingRef}
      </p>
    </div>
  </div>
</div>

      {/* Action buttons */}
      <div className="flex flex-col xs:flex-row gap-3 mt-5 sm:mt-6 print:hidden">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="flex-1 gap-2 h-11 border-slate-200"
        >
          <Printer className="h-4 w-4" /> Print Receipt
        </Button>
        <Button
          onClick={onReset}
          className="flex-1 h-11 gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
        >
          <Plus className="h-4 w-4" /> New Registration
        </Button>
      </div>

      <p
        className="text-center text-[10px] text-slate-400 mt-4 print:hidden"
        style={FONT_BODY}
      >
        Secured by PayStack · PCRAA Limited · All rights reserved
      </p>
    </div>
  );
}

function ReceiptField({
  label,
  value,
  highlight = false,
  valueClassName = "",
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className={`${highlight ? 'bg-emerald-50/50 -mx-2 px-2 py-1.5 rounded' : ''}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 mb-1">
        {label}
      </p>
      <p className={`text-base font-semibold text-slate-800 ${valueClassName}`}>
        {value || <span className="text-slate-400 font-normal italic">—</span>}
      </p>
    </div>
  );
}

// ─── Sidebar Step Indicator ─────────────────────────────────────────────────────
function SidebarSteps({
  current,
  completed,
}: {
  current: number;
  completed: number[];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p
        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4"
        style={FONT_BODY}
      >
        Registration Steps
      </p>
      <div className="space-y-1">
        {STEPS.map((step) => {
          const isDone = completed.includes(step.id);
          const isCurrent = current === step.id;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isCurrent ? "bg-emerald-50 border border-emerald-200" : isDone ? "opacity-60" : "opacity-40"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black border-2 transition-all ${isDone ? "bg-emerald-600 border-emerald-600 text-white" : isCurrent ? "bg-white border-emerald-600 text-emerald-700" : "bg-white border-slate-200 text-slate-400"}`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : step.id}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-bold leading-none ${isCurrent ? "text-emerald-800" : "text-slate-600"}`}
                  style={FONT_BODY}
                >
                  {step.title}
                </p>
                <p
                  className="text-[10px] text-slate-400 mt-0.5"
                  style={FONT_BODY}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div
          className="flex justify-between text-[10px] font-bold text-slate-400 mb-2"
          style={FONT_BODY}
        >
          <span>Progress</span>
          <span>{Math.round((completed.length / STEPS.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${(completed.length / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export function PreRegistrationForm({
  onSuccess,
}: {
  onSuccess?: (id: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [completedSteps, setCompleted] = useState<number[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [txnId, setTxnId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showNav, setShowNav] = useState(false);

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
    region: "Greater Accra",
    districtMunicipality: "",
    residentialTown: "",
    vehicleCategory: "",
    nextOfKinName: "",
    nextOfKinContact: "",
  },
});

  // Inside PreRegistrationForm, add this useEffect:
useEffect(() => {
  const auth = getAuth();
  if (!auth.currentUser) {
    signInAnonymously(auth).catch(console.error);
  }
}, []);

  useEffect(() => {
    const sub = form.watch(() => setShowNav(true));
    return () => sub.unsubscribe();
  }, [form]);

  const STEP_FIELDS: Record<number, (keyof PreRegistrationData)[]> = {
    1: ["fullName", "phoneNumber", "dateOfBirth", "gender"],
    2: [
      "idType",
      "idNumber",
      "region",
      "districtMunicipality",
      "residentialTown",
    ],
    3: ["vehicleCategory", "nextOfKinName", "nextOfKinContact"],
  };

  async function handleNext() {
    const fields = STEP_FIELDS[step];
    if (fields) {
      setIsValidating(true);
      const valid = await form.trigger(fields);
      setIsValidating(false);
      if (!valid) {
        toast.warning("Please fix the errors before continuing.");
        return;
      }
      setCompleted((p) => (p.includes(step) ? p : [...p, step]));
      setStep((s) => Math.min(s + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

async function handlePaymentSuccess(
  transactionId: string,
  reference: string,
) {
  setTxnId(transactionId);
  setIsSaving(true);
  setSubmitError("");

  try {
    const preRegData = form.getValues();

    let passportPhoto: File | undefined = undefined;
    if (photo) {
      const res = await fetch(photo);
      const blob = await res.blob();
      passportPhoto = new File([blob], "passport.jpg", { type: blob.type });
    }

    const riderData: RiderRegistrationData = {
      fullName: preRegData.fullName,
      phoneNumber: preRegData.phoneNumber,
      dateOfBirth: preRegData.dateOfBirth,
      gender: preRegData.gender!,
      idType: preRegData.idType!,
      idNumber: preRegData.idNumber,
      region: preRegData.region,
      districtMunicipality:
        preRegData.districtMunicipality as RiderRegistrationData["districtMunicipality"],
      residentialTown: preRegData.residentialTown,
      vehicleCategory:
        preRegData.vehicleCategory as RiderRegistrationData["vehicleCategory"],
      nextOfKinName: preRegData.nextOfKinName,
      nextOfKinContact: preRegData.nextOfKinContact,
      plateNumber: "",
      chassisNumber: "",
      driversLicenseNumber: "",
      licenseExpiryDate: "",
      passportPhoto,
    };

    

    const result = await saveRiderRegistration(
      riderData,
      {
        paymentReference: reference,
        paymentTxnId: transactionId,
        paymentStatus: "paid",
        paymentAmount: REGISTRATION_FEE_GHS,
      },
      { requireAuth: false },
    );

    if (!result.success) {
      setSubmitError(result.error ?? "Registration failed. Please try again.");
      toast.error("Registration failed", {
        description:
          result.error ??
          "Your payment went through but saving failed. Please contact support.",
      });
      return;
    }

    const displayRef = `CTS-${result.PCRAA.slice(-8).toUpperCase()}`;
    setBookingRef(displayRef);
    setSuccess(true);
    setCompleted((p) => [...new Set([...p, step])]);
    onSuccess?.(result.PCRAA);
    toast.success("Registration complete!", {
      description: `Booking ref: ${displayRef}`,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    setIsSaving(false);
  }
}
  function handleReset() {
    form.reset({ region: "Greater Accra" });
    setStep(1);
    setCompleted([]);
    setPhoto(null);
    setSuccess(false);
    setBookingRef("");
    setTxnId("");
    setSubmitError("");
  }

  const data = form.getValues();

  // ── Loading overlay ───────────────────────────────────────────────────────
  if (isSaving) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"
        style={{ background: "#F7F6F3", ...FONT_BODY }}
      >
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <p className="text-slate-600 text-sm text-center">
          Saving your registration…
        </p>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        className="min-h-screen p-4 sm:p-6 md:p-10"
        style={{ background: "#F7F6F3", ...FONT_BODY }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
        <div className="max-w-4xl mx-auto">
          <ConfirmationReceipt
            bookingRef={bookingRef}
            data={data}
            txnId={txnId}
            photo={photo}
            onReset={handleReset}
          />
        </div>
      </div>
    );
  }

  // ── Multi-step form ───────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{ background: "#F7F6F3", ...FONT_BODY }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Page header */}
      <div
        className="relative px-4 sm:px-6 py-14 sm:py-20 text-center overflow-hidden"
        style={{ background: "#1a0a00" }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/ctsbackdrop.png')`,
            opacity: 0.55,
          }}
        />

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(15,30,10,0.55) 0%, rgba(5,30,15,0.70) 45%, rgba(2,20,10,0.92) 100%)",
          }}
        />

        {/* Back to home & Navigation - Right aligned */}
{/* Navigation Buttons - Card Style */}
<div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 z-20 flex justify-between items-center">
  <Link
    href="/"
    className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold uppercase tracking-widest transition-all bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl"
    style={FONT_BODY}
  >
    <ArrowLeft className="h-3.5 w-3.5" />
    Home
  </Link>
  
  <Link
    href="/training-details"
    className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold uppercase tracking-widest transition-all bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl"
    style={FONT_BODY}
  >
    Training Info
    <Info className="h-3.5 w-3.5" />
  </Link>
</div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Main heading */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.08] mb-3 sm:mb-4 tracking-tight"
            style={{
              ...FONT_DISPLAY,
              textShadow:
                "0 2px 32px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            Commercial Rider{" "}
            <span
              style={{
                color: "#6ee7b7",
                textShadow: "0 2px 20px rgba(110,231,183,0.4)",
              }}
            >
              Training
            </span>{" "}
            Registration
          </h1>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
            <div className="h-px w-10 sm:w-12 bg-white/25" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <div className="h-px w-10 sm:w-12 bg-white/25" />
          </div>

          {/* Sub-copy */}
          <p
            className="text-white/90 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-medium"
            style={{
              ...FONT_BODY,
              textShadow: "0 1px 10px rgba(0,0,0,0.6)",
            }}
          >
            Enrol in the mandatory training and certification programme for
            commercial motorcycle and tricycle operators in Greater Accra.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 sm:mt-5">
            {[
              { icon: Shield, label: "Certified Programme" },
              { icon: CreditCard, label: "GHS 400 One-time Fee" },
              { icon: CheckCircle2, label: "Rider ID on Completion" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  backdropFilter: "blur(8px)",
                  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  ...FONT_BODY,
                }}
              >
                <Icon className="h-3 w-3 text-emerald-300 shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
          {/* ── Sidebar step indicator ── */}
          <div className="hidden lg:block lg:col-span-1 sticky top-6">
            <SidebarSteps current={step} completed={completedSteps} />
          </div>

          {/* ── Main form card ── */}
          <div className="lg:col-span-3">
            {/* Mobile step pills */}
            <div className="flex lg:hidden items-center gap-1.5 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-1 px-1">
              {STEPS.map((s) => {
                const isDone = completedSteps.includes(s.id);
                const isCurrent = step === s.id;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border transition-all ${isCurrent ? "bg-emerald-700 text-white border-emerald-700" : isDone ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}
                    style={FONT_BODY}
                  >
                    {isDone ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <span>{s.id}</span>
                    )}
                    {s.title}
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-6 md:p-10">
                <Form {...form}>
                  <form
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        (e.target as HTMLElement).tagName !== "TEXTAREA"
                      )
                        e.preventDefault();
                    }}
                  >
                    {step === 1 && (
                      <Step1Personal
                        form={form}
                        photo={photo}
                        onPhotoChange={setPhoto}
                      />
                    )}
                    {step === 2 && <Step2IdLocation form={form} />}
                    {step === 3 && <Step3VehicleKin form={form} />}
                    {step === 4 && (
                      <Step4ReviewPay
                        data={data}
                        photo={photo}
                        riderPhone={data.phoneNumber}
                        riderName={data.fullName}
                        onPaymentSuccess={handlePaymentSuccess}
                      />
                    )}

                    {submitError && (
                      <div className="mt-5 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700" style={FONT_BODY}>
                          {submitError}
                        </p>
                      </div>
                    )}

                    {/* Spacer for floating nav */}
                    <div className="h-20 sm:h-16" />
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>

       
       {/* Footer */}
<div className="text-center mt-6 sm:mt-8 space-y-3">
  <p
    className="text-xs text-slate-400 flex items-center justify-center gap-2"
    style={FONT_BODY}
  >
    <Shield className="h-3 w-3 shrink-0" />
    Secured by PayStack · PCRAA Limited · All rights reserved
  </p>
  
  {/* Privacy Policy Link */}
  <div className="flex items-center justify-center gap-4 text-xs">
    <Link
      href="/privacy-policy"
      className="text-slate-400 hover:text-emerald-600 transition-colors"
      style={FONT_BODY}
    >
      Privacy Policy
    </Link>
    <span className="text-slate-300">•</span>
    <Link
      href="/terms"
      className="text-slate-400 hover:text-emerald-600 transition-colors"
      style={FONT_BODY}
    >
      Terms & Conditions
    </Link>
    <span className="text-slate-300">•</span>
    <Link
      href="/data-protection"
      className="text-slate-400 hover:text-emerald-600 transition-colors"
      style={FONT_BODY}
    >
      Data Protection
    </Link>
  </div>
</div>
      </div>

      {/* ── Floating navigation ── */}
      {showNav && step < 4 && (
        <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 px-4 sm:px-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-full px-4 sm:px-5 py-3 w-full sm:w-auto justify-between sm:justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || isValidating}
              className="rounded-full gap-2 flex-1 sm:flex-initial"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={isValidating}
              className="bg-emerald-700 hover:bg-emerald-800 rounded-full gap-2 flex-1 sm:flex-initial"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating…
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
async function checkRiderEligibility({
  phoneNumber,
  idNumber,
  idType,
}: {
  phoneNumber: string;
  idNumber: string;
  idType: "GHANA_CARD" | "VOTERS_ID" | "PASSPORT";
}) {
  const response = await fetch("/api/riders/check-eligibility", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phoneNumber, idNumber, idType }),
  });

  if (response.ok) {
    return;
  }

  const payload = await response.json().catch(() => null);
  const message =
    payload?.message || "Could not verify rider eligibility. Please try again.";

  const error = new Error(message) as Error & { code?: number };
  if (response.status === 409) {
    error.code = 409;
  }

  throw error;
}
