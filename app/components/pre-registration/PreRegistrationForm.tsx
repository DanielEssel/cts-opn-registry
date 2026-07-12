"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { getAuth, signInAnonymously } from "firebase/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  CheckCircle2, Loader2, Info, Phone, User, MapPin, FileText,
  Users, CreditCard, Smartphone, AlertCircle, Check, Printer,
  Plus, Shield, Calendar, IdCard, Truck, Heart, Wallet, Building2,
  Navigation, UserCircle, Camera, Upload, X, RotateCcw,
  ArrowLeft, ArrowRight, ClipboardCheck, Zap,
} from "lucide-react";
import {
  Form, FormControl, FormField, FormItem, FormMessage,
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
import { saveRiderRegistration } from "@/lib/rider-service";
import type { RiderRegistrationData } from "@/app/lib/validations";
import { initiatePayment, verifyPayment, PaymentStatus } from "@/lib/bridge-service";
import { DISTRICT_CODES, CATEGORY_CODES } from "@/lib/rin-constants";
import {
  isValidGhanaPhone,
  detectNetwork,
  formatForDisplay,
  type GhanaMomoNetwork,
} from "@/lib/ghana-phone";
import {
  persistFormState,
  persistPhoto,
  loadPersistedFormState,
  loadPersistedPhoto,
  clearPersistedFormState,
} from "@/lib/form-persistence";


// ─── Types ──────────────────────────────────────────────────────────────────────
// Maps UI network names → Bridge API network codes
type MomoNetwork = "MTN" | "VODAFONE" | "AIRTELTIGO";

const NETWORK_UI_TO_BRIDGE: Record<MomoNetwork, string> = {
  MTN:        "MTN",
  VODAFONE:   "VOD",
  AIRTELTIGO: "AIR",
};

// Maps GhanaMomoNetwork (from detectNetwork) → MomoNetwork (UI value)
const DETECTED_TO_UI: Record<GhanaMomoNetwork, MomoNetwork> = {
  MTN:        "MTN",
  TELECEL:    "VODAFONE",
  AIRTELTIGO: "AIRTELTIGO",
};


// ─── Constants ──────────────────────────────────────────────────────────────────
const DISTRICTS  = Object.keys(DISTRICT_CODES);
const VEHICLES   = Object.keys(CATEGORY_CODES);
const amount     = 400;

const ID_TYPES = [
  { value: "GHANA_CARD", label: "Ghana Card",   placeholder: "GHA-712014412-4", icon: IdCard     },
  { value: "VOTERS_ID",  label: "Voter's ID",   placeholder: "4393000029",       icon: FileText   },
  { value: "PASSPORT",   label: "Passport",     placeholder: "G2282683",         icon: UserCircle },
] as const;

const MOMO_NETWORKS: { value: MomoNetwork; label: string; logo: string; abbr: string }[] = [
  { value: "MTN",        label: "MTN Mobile Money",  logo: "/logo/mtn.png",     abbr: "MTN"    },
  { value: "VODAFONE",   label: "Telecel Cash",       logo: "/logo/telecel.png", abbr: "Telecel" },
  { value: "AIRTELTIGO", label: "AirtelTigo Money",  logo: "/logo/at.png",      abbr: "AT"     },
];



const STEPS = [
  { id: 1, title: "Personal Info",  description: "Name, phone & DOB"              },
  { id: 2, title: "ID & Location",  description: "Identification & address"        },
  { id: 3, title: "Vehicle & Kin",  description: "Vehicle type & emergency contact" },
  { id: 4, title: "Review & Pay",   description: "Confirm details & payment"       },
];

const FONT_DISPLAY = { fontFamily: "'Cormorant Garamond', Georgia, serif" };
const FONT_BODY    = { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" };


// ─── Shared Primitives ──────────────────────────────────────────────────────────
function FieldWrap({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" style={FONT_BODY}>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden" style={{ background: "#FAFAF9" }}>
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 bg-white">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 shrink-0">
          <Icon className="h-4 w-4 text-emerald-700" />
        </span>
        <h3 className="text-base font-semibold text-slate-800" style={FONT_DISPLAY}>{title}</h3>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">{children}</div>
  );
}


// ─── Passport Photo Upload ──────────────────────────────────────────────────────
function PassportPhotoUpload({ value, onChange, error }: {
  value: string | null;
  onChange: (v: string | null) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", { description: "Please upload a JPG or PNG image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Photo must be less than 5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      // Check minimum dimensions — reject tiny or portrait-cropped images
      const img = new window.Image();
      img.onload = () => {
        if (img.naturalWidth < 300 || img.naturalHeight < 400) {
          toast.error("Photo too small", {
            description: `Minimum size is 300×400 px. Your photo is ${img.naturalWidth}×${img.naturalHeight} px.`,
          });
          return;
        }
        onChange(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <Section title="Passport Photograph" icon={Camera}>
      <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
        <div
          className={`relative shrink-0 w-32 h-40 sm:w-36 sm:h-44 rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${
            dragging      ? "border-emerald-500 bg-emerald-50"
            : value       ? "border-emerald-400 bg-white"
            : error       ? "border-red-400 border-dashed bg-red-50 hover:border-red-500"
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
            <p className="text-sm font-semibold text-slate-700 mb-2" style={FONT_BODY}>Photo Requirements</p>
            <ul className="space-y-1.5">
              {[
                "Clear, front-facing photo on a plain white or light background",
                "Face must be fully visible — no hats, sunglasses, or heavy shadows",
                "Recent photo taken within the last 6 months",
                "Minimum 300×400 px · JPG or PNG · Max 5MB",
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm"
              onClick={() => inputRef.current?.click()}
              className="gap-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {value ? "Replace Photo" : "Choose File"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm"
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

      {/* Required error — shown when user tries to advance without a photo */}
      {error && (
        <div className="flex items-center gap-2 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}
    </Section>
  );
}


// ─── Step 1 — Personal Info ─────────────────────────────────────────────────────
function Step1Personal({ form, photo, onPhotoChange, photoError }: {
  form: ReturnType<typeof useForm<PreRegistrationData>>;
  photo: string | null;
  onPhotoChange: (v: string | null) => void;
  photoError?: string;
}) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <PassportPhotoUpload value={photo} onChange={onPhotoChange} error={photoError} />

      <Section title="Personal Information" icon={User}>
        <FieldGrid>
          {/* Full Name */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FieldWrap
                  label="Full Legal Name"
                  required
                  hint="As it appears on your ID — letters, spaces, hyphens and apostrophes only"
                >
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="e.g. Kwame Asante-Mensah"
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

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FieldWrap
                  label="Phone Number"
                  required
                  hint="10-digit Ghana mobile number starting with 020, 024, 026, 027, 050, 054–057, 059…"
                >
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="tel"
                        placeholder="0244000000"
                        maxLength={10}
                        className="pl-10 h-11 font-mono bg-white border-slate-200 focus:border-emerald-500"
                        style={FONT_BODY}
                        {...field}
                        onChange={(e) => {
                          // Strip non-digits as the user types
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                          field.onChange(digits);
                        }}
                      />
                    </div>
                  </FormControl>
                </FieldWrap>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Date of Birth */}
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FieldWrap label="Date of Birth" required hint="Must be 18 years or older">
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="date"
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                          .toISOString().split("T")[0]}
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

          {/* Gender */}
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
            )}
          />
        </FieldGrid>
      </Section>
    </div>
  );
}


// ─── Step 2 — ID & Location ─────────────────────────────────────────────────────
function Step2IdLocation({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  const idType         = form.watch("idType");
  const selectedIdType = ID_TYPES.find((t) => t.value === idType);
  const IdIcon         = selectedIdType?.icon ?? IdCard;

  // Auto-uppercase handler based on ID type
  function normaliseIdNumber(value: string, type?: string): string {
    if (!type) return value;
    if (type === "GHANA_CARD" || type === "PASSPORT") return value.toUpperCase();
    if (type === "VOTERS_ID") return value.replace(/\D/g, "").slice(0, 10);
    return value;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <Section title="Official Identification" icon={IdCard}>
        <FieldGrid>
          {/* ID Type */}
          <FormField
            control={form.control}
            name="idType"
            render={({ field }) => (
              <FormItem>
                <FieldWrap label="ID Type" required>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      // Clear ID number when type changes to avoid stale format
                      form.setValue("idNumber", "", { shouldValidate: false });
                    }}
                    value={field.value}
                  >
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
            )}
          />

          {/* ID Number */}
          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => (
              <FormItem>
                <FieldWrap
                  label="ID Number"
                  required
                  hint={selectedIdType?.placeholder ? `Format: ${selectedIdType.placeholder}` : undefined}
                >
                  <FormControl>
                    <div className="relative">
                      <IdIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder={selectedIdType?.placeholder ?? "Select an ID type first"}
                        disabled={!idType}
                        className="pl-10 h-11 font-mono bg-white border-slate-200 focus:border-emerald-500 disabled:opacity-40"
                        style={FONT_BODY}
                        {...field}
                        onChange={(e) => {
                          field.onChange(normaliseIdNumber(e.target.value, idType));
                        }}
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
          {/* Region (locked) */}
          <FormItem>
            <FieldWrap label="Region">
              <div className="h-11 px-3 sm:px-4 flex items-center rounded-lg border border-slate-100 bg-slate-50 gap-2">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-600 flex-1 truncate" style={FONT_BODY}>Greater Accra</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                  Pilot
                </span>
              </div>
            </FieldWrap>
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => <input type="hidden" {...field} value="Greater Accra" />}
            />
          </FormItem>

          {/* District */}
          <FormField
            control={form.control}
            name="districtMunicipality"
            render={({ field }) => (
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
            )}
          />

          {/* Town */}
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
function Step3VehicleKin({ form }: { form: ReturnType<typeof useForm<PreRegistrationData>> }) {
  const riderPhone = form.watch("phoneNumber");

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
                    <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-emerald-500 w-full sm:max-w-sm" style={FONT_BODY}>
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
            render={({ field }) => {
              // Live cross-field hint — warn before schema fires
              const sameAsRider =
                riderPhone && field.value &&
                riderPhone.replace(/\s/g, "") === field.value.replace(/\s/g, "");

              return (
                <FormItem>
                  <FieldWrap
                    label="Phone Number"
                    required
                    hint="Must be a different number from the rider's phone"
                  >
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="tel"
                          placeholder="0244000000"
                          maxLength={10}
                          className={`pl-10 h-11 font-mono bg-white border-slate-200 focus:border-emerald-500 ${
                            sameAsRider ? "border-red-400 focus:border-red-400" : ""
                          }`}
                          style={FONT_BODY}
                          {...field}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                            field.onChange(digits);
                          }}
                        />
                      </div>
                    </FormControl>
                    {sameAsRider && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        This is the same as the rider's phone number
                      </p>
                    )}
                  </FieldWrap>
                  <FormMessage className="text-xs" />
                </FormItem>
              );
            }}
          />
        </FieldGrid>
      </Section>
    </div>
  );
}


// ─── Payment Widget ─────────────────────────────────────────────────────────────
function PaymentWidget({ riderPhone, riderName, preRegId, onPaymentSuccess }: {
  riderPhone: string;
  riderName:  string;
  preRegId:   string;
  onPaymentSuccess: (txnId: string, reference: string) => void;
}) {
  const [network,   setNetwork]   = useState<MomoNetwork | "">("");
  const [momoPhone, setMomoPhone] = useState(riderPhone);
  const [status,    setStatus]    = useState<PaymentStatus>("idle");
  const [error,     setError]     = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [phoneError, setPhoneError] = useState("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-detect network when phone changes
  useEffect(() => {
    const cleaned = momoPhone.replace(/\s/g, "");
    if (cleaned.length === 10) {
      const detected = detectNetwork(cleaned);
      if (detected && !network) {
        setNetwork(DETECTED_TO_UI[detected]);
      }
      setPhoneError(
        !isValidGhanaPhone(cleaned)
          ? "Please enter a valid Ghana mobile number (e.g. 0244000000)"
          : ""
      );
    } else {
      setPhoneError("");
    }
  }, [momoPhone, network]);

  // Detected network badge to show next to the phone field
  const detectedNetwork = momoPhone.length === 10
    ? detectNetwork(momoPhone.replace(/\s/g, ""))
    : null;

  function startPolling(ref: string, count = 0) {
    if (count >= 12) {
      console.error("[poll] timed out after 12 attempts");
      setStatus("failed");
      setError("Payment timed out. Please try again.");
      return;
    }

    console.log(`[poll] attempt ${count + 1}/12 for ref: ${ref}`);
    pollRef.current = setTimeout(async () => {
      const verify = await verifyPayment(ref);
      console.log(`[poll] attempt ${count + 1} result:`, verify.status);

      if (verify.status === "success") {
        setStatus("success");
        onPaymentSuccess(verify.transactionId ?? "", ref);
      } else if (verify.status === "failed") {
        setStatus("failed");
        setError("Payment was declined or cancelled. Please try again.");
        toast.error("Payment declined", { description: "Please check your MoMo balance and try again." });
      } else {
        setPollCount(count + 1);
        startPolling(ref, count + 1);
      }
    }, 5000);
  }

  async function handleInitiate() {
    const cleaned = momoPhone.replace(/\s/g, "");

    // Validate phone locally before hitting the API
    if (!isValidGhanaPhone(cleaned)) {
      setPhoneError("Please enter a valid Ghana mobile number (e.g. 0244000000)");
      return;
    }
    if (!network) {
      setError("Please select your MoMo network.");
      return;
    }

    setStatus("pending");
    setError("");
    setPhoneError("");

    const result = await initiatePayment({
      phone:     cleaned,          // bridge-service converts to 233XXXXXXXXX internally
      network:   network as MomoNetwork,
      preRegId,
      riderName,
      email:     `rider.${cleaned}@rinsystem.gh`,
    });

    if (!result.success) {
      setStatus("failed");
      setError(result.error ?? "Payment initiation failed. Please try again.");
      toast.error("Could not send payment prompt", { description: result.error ?? "Please try again." });
      return;
    }

    startPolling(result.reference);
  }

  // ── Pending state ─────────────────────────────────────────────────────────────
  if (status === "pending") {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 sm:p-8 flex flex-col items-center text-center gap-5">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16">
          <div className="absolute inset-0 rounded-full border-[3px] border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
          <Smartphone className="absolute inset-0 m-auto h-6 w-6 sm:h-7 sm:w-7 text-emerald-600" />
        </div>
        <div>
          <p className="text-base font-semibold text-emerald-900" style={FONT_DISPLAY}>
            Awaiting your confirmation
          </p>
          <p className="text-sm text-emerald-700 mt-1 max-w-sm" style={FONT_BODY}>
            A payment prompt of <strong>GHS {amount}</strong> has been sent to{" "}
            <strong className="font-mono">{formatForDisplay(momoPhone)}</strong>.
            Approve it on your phone to complete your registration.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-600" style={FONT_BODY}>
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

  // ── Idle / failed state ───────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Fee header */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5"
        style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300" style={FONT_BODY}>
            Training Registration Fee
          </p>
          <p className="text-xs text-emerald-400 mt-0.5" style={FONT_BODY}>One-time · Non-refundable</p>
        </div>
        <p className="text-3xl sm:text-4xl font-black text-white" style={FONT_DISPLAY}>
          GHS {amount}
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">

        {/* MoMo number — comes first so network can be auto-detected */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2" style={FONT_BODY}>
            Mobile Money Number <span className="text-red-400">*</span>
          </p>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              value={momoPhone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                setMomoPhone(digits);
                // Reset network selection if phone changes
                if (digits.length < 10) setNetwork("");
              }}
              placeholder="0244000000"
              maxLength={10}
              className={`w-full h-11 pl-10 pr-24 border rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-100 transition-all bg-white ${
                phoneError
                  ? "border-red-400 focus:border-red-400"
                  : "border-slate-200 focus:border-emerald-500"
              }`}
              style={FONT_BODY}
            />
            {/* Auto-detected network badge */}
            {detectedNetwork && !phoneError && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <Zap className="h-2.5 w-2.5" />
                {detectedNetwork}
              </span>
            )}
          </div>
          {phoneError ? (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />{phoneError}
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1" style={FONT_BODY}>
              Pre-filled from registration · change if your MoMo number differs
              {detectedNetwork && ` · Network auto-detected as ${detectedNetwork}`}
            </p>
          )}
        </div>

        {/* Network selector */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3" style={FONT_BODY}>
            Select Network <span className="text-red-400">*</span>
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {MOMO_NETWORKS.map((n) => (
              <button
                key={n.value}
                type="button"
                onClick={() => setNetwork(n.value)}
                className={`flex flex-col items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-xl border-2 transition-all ${
                  network === n.value
                    ? "border-emerald-500 bg-emerald-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white rounded-lg border shadow-sm p-1">
                  <img src={n.logo} alt={n.label} className="max-w-full max-h-full object-contain" />
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
          {/* Network mismatch warning */}
          {network && detectedNetwork && DETECTED_TO_UI[detectedNetwork] !== network && (
            <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700" style={FONT_BODY}>
                Your number suggests <strong>{detectedNetwork}</strong> but you selected{" "}
                <strong>{network}</strong>. Please confirm your network is correct.
              </p>
            </div>
          )}
        </div>

        {/* Error display */}
        {(error || status === "failed") && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700" style={FONT_BODY}>
              {error || "Payment failed. Please try again."}
            </p>
          </div>
        )}

        {/* Security note */}
        <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg">
          <Shield className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500" style={FONT_BODY}>
            Payment is processed securely via Bridge. PCRAA does not store your Mobile Money PIN.
          </p>
        </div>

        {/* Pay button */}
        <Button
          type="button"
          onClick={handleInitiate}
          disabled={!network || !momoPhone.trim() || !!phoneError || momoPhone.length < 10}
          className="w-full h-12 text-sm font-semibold gap-2 rounded-xl shadow-sm transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #065f46 0%, #047857 100%)", ...FONT_BODY }}
        >
          <Wallet className="h-4 w-4" />
          Pay GHS {amount}
        </Button>
      </div>
    </div>
  );
}


// ─── Step 4 — Review & Pay ──────────────────────────────────────────────────────
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0 gap-3">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex-shrink-0" style={FONT_BODY}>
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-800 text-right" style={FONT_BODY}>
        {value || "—"}
      </span>
    </div>
  );
}

function ReviewCard({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-100">
        <Icon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500" style={FONT_BODY}>
          {title}
        </span>
      </div>
      <div className="px-4 sm:px-5">{children}</div>
    </div>
  );
}

function Step4ReviewPay({ data, photo, riderPhone, riderName, onPaymentSuccess }: {
  data: PreRegistrationData;
  photo: string | null;
  riderPhone: string;
  riderName:  string;
  onPaymentSuccess: (txnId: string, ref: string) => void;
}) {
  const idLabel = ID_TYPES.find((t) => t.value === data.idType)?.label ?? data.idType;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Review warning banner */}
      <div className="flex items-start gap-3 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900" style={FONT_BODY}>Review before payment</p>
          <p className="text-xs text-amber-700 mt-0.5" style={FONT_BODY}>
            Please verify all information below. Details cannot be changed after payment is processed.
          </p>
        </div>
      </div>

      {/* Mobile: payment widget first */}
      <div className="block lg:hidden">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3" style={FONT_BODY}>
          Complete Payment
        </p>
        <PaymentWidget
          riderPhone={riderPhone}
          riderName={riderName}
          preRegId={preRegId}
          onPaymentSuccess={onPaymentSuccess}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Review cards */}
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
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500" style={FONT_BODY}>
                  Passport Photograph
                </p>
                <p className="text-sm text-slate-700 mt-1 font-semibold" style={FONT_BODY}>{data.fullName}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 mt-1 font-medium uppercase tracking-wider" style={FONT_BODY}>
                  <Check className="h-2.5 w-2.5" /> Photo uploaded
                </span>
              </div>
            </div>
          )}

          <ReviewCard title="Personal Information" icon={User}>
            <ReviewRow label="Full Name"     value={data.fullName} />
            <ReviewRow label="Phone"         value={formatForDisplay(data.phoneNumber)} />
            <ReviewRow label="Date of Birth" value={data.dateOfBirth} />
            <ReviewRow label="Gender"        value={data.gender} />
          </ReviewCard>

          <ReviewCard title="Identification" icon={IdCard}>
            <ReviewRow label="ID Type"   value={idLabel} />
            <ReviewRow label="ID Number" value={data.idNumber} />
          </ReviewCard>

          <ReviewCard title="Location & Vehicle" icon={MapPin}>
            <ReviewRow label="Region"           value={data.region} />
            <ReviewRow label="District"         value={data.districtMunicipality} />
            <ReviewRow label="Town"             value={data.residentialTown} />
            <ReviewRow label="Vehicle Category" value={data.vehicleCategory} />
          </ReviewCard>

          <ReviewCard title="Emergency Contact" icon={Heart}>
            <ReviewRow label="Name"  value={data.nextOfKinName} />
            <ReviewRow label="Phone" value={formatForDisplay(data.nextOfKinContact)} />
          </ReviewCard>
        </div>

        {/* Desktop: sticky payment widget */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3" style={FONT_BODY}>
              Complete Payment
            </p>
            <PaymentWidget
              riderPhone={riderPhone}
              riderName={riderName}
              preRegId={preRegId}
              onPaymentSuccess={onPaymentSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── preRegId placeholder — replace with real value when pre-registration
// document creation is implemented upstream
const preRegId = "PRE-REG-PENDING";


// ─── Confirmation Receipt ───────────────────────────────────────────────────────
function ReceiptField({ label, value, highlight = false, valueClassName = "" }: {
  label: string; value?: string | null; highlight?: boolean; valueClassName?: string;
}) {
  return (
    <div className={highlight ? "bg-emerald-50/50 -mx-2 px-2 py-1.5 rounded" : ""}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 mb-1">{label}</p>
      <p className={`text-base font-semibold text-slate-800 ${valueClassName}`}>
        {value || <span className="text-slate-400 font-normal italic">—</span>}
      </p>
    </div>
  );
}

function ConfirmationReceipt({ bookingRef, data, txnId, photo, onReset }: {
  bookingRef: string; data: PreRegistrationData; txnId: string;
  photo: string | null; onReset: () => void;
}) {
  const issuedDate = new Date().toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" });
  const issuedTime = new Date().toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6 sm:mb-8 print:hidden">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4 sm:mb-5">
          <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2" style={FONT_DISPLAY}>
          Registration Confirmed
        </h2>
        <p className="text-emerald-600 font-semibold text-sm mb-1" style={FONT_BODY}>
          Payment successful · Training slot secured
        </p>
        <p className="text-slate-500 text-sm max-w-md mx-auto px-4" style={FONT_BODY}>
          Please print this receipt and present it at the training centre on your scheduled date.
          A PCRAA official will issue your Rider ID card upon completion of training.
        </p>
      </div>

      <div id="receipt" className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-slate-300">
        <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" }} className="px-6 sm:px-8 py-6 sm:py-7 text-white">
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

        <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-start gap-5">
          <div className="flex-1 w-full bg-white border-2 border-emerald-600 rounded-xl px-5 sm:px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 mb-1.5">
              PCRAA Registration Number
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
              <img src={photo} alt="Passport photo" className="w-16 h-20 sm:w-18 sm:h-22 rounded-lg object-cover border-2 border-slate-200 shadow-md" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Photo ID</p>
            </div>
          )}
        </div>

        <div className="px-6 sm:px-8 py-6 sm:py-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-200 mb-4">
              <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                <User className="h-3 w-3 text-emerald-700" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800">Applicant Details</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <ReceiptField label="Full Name"    value={data.fullName}    highlight />
              <ReceiptField label="Phone Number" value={formatForDisplay(data.phoneNumber)} />
              <ReceiptField label="Date of Birth" value={data.dateOfBirth} />
              <ReceiptField label="Gender"       value={data.gender} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-200 mb-4">
              <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                <MapPin className="h-3 w-3 text-emerald-700" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800">Location & Vehicle</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <ReceiptField label="District"         value={data.districtMunicipality} />
              <ReceiptField label="Town / Area"      value={data.residentialTown} />
              <ReceiptField label="Vehicle Category" value={data.vehicleCategory} highlight />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-200 mb-4">
              <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                <CreditCard className="h-3 w-3 text-emerald-700" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800">Payment Details</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <ReceiptField label="Amount Paid"    value={`GHS ${amount}.00`} highlight valueClassName="text-emerald-700 font-bold" />
              <ReceiptField label="Transaction ID" value={txnId || "—"} />
              <ReceiptField label="Payment Date"   value={issuedDate} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Status</p>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Paid · Confirmed
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/70 border border-blue-200 p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <ClipboardCheck className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 mb-2">What happens next?</p>
                <ul className="space-y-2">
                  {[
                    "You will be contacted with your assigned training date and location.",
                    "Attend training and present this receipt to the PCRAA official.",
                    "Upon successful completion, your Rider ID card will be issued.",
                  ].map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-blue-800">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center flex-shrink-0 text-xs font-bold">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

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

      <div className="flex flex-col xs:flex-row gap-3 mt-5 sm:mt-6 print:hidden">
        <Button variant="outline" onClick={() => window.print()} className="flex-1 gap-2 h-11 border-slate-200">
          <Printer className="h-4 w-4" /> Print Receipt
        </Button>
        <Button onClick={onReset} className="flex-1 h-11 gap-2 bg-emerald-700 hover:bg-emerald-800 text-white">
          <Plus className="h-4 w-4" /> New Registration
        </Button>
      </div>

      <p className="text-center text-[10px] text-slate-400 mt-4 print:hidden" style={FONT_BODY}>
        Secured by Bridge · PCRAA Limited · All rights reserved
      </p>
    </div>
  );
}


// ─── Sidebar Step Indicator ─────────────────────────────────────────────────────
function SidebarSteps({ current, completed }: { current: number; completed: number[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4" style={FONT_BODY}>
        Registration Steps
      </p>
      <div className="space-y-1">
        {STEPS.map((step) => {
          const isDone    = completed.includes(step.id);
          const isCurrent = current === step.id;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isCurrent ? "bg-emerald-50 border border-emerald-200" : isDone ? "opacity-60" : "opacity-40"
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black border-2 transition-all ${
                isDone ? "bg-emerald-600 border-emerald-600 text-white"
                : isCurrent ? "bg-white border-emerald-600 text-emerald-700"
                : "bg-white border-slate-200 text-slate-400"
              }`}>
                {isDone ? <Check className="w-3.5 h-3.5" /> : step.id}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold leading-none ${isCurrent ? "text-emerald-800" : "text-slate-600"}`} style={FONT_BODY}>
                  {step.title}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5" style={FONT_BODY}>{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2" style={FONT_BODY}>
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
export function PreRegistrationForm({ onSuccess }: { onSuccess?: (id: string) => void }) {

  // ── Form — declared FIRST; effects below reference form.watch() ───────────────
  const form = useForm<PreRegistrationData>({
    resolver:      zodResolver(preRegistrationSchema),
    mode:          "onChange",
    defaultValues: {
      fullName:             "",
      phoneNumber:          "",
      dateOfBirth:          "",
      gender:               undefined,
      idType:               undefined,
      idNumber:             "",
      region:               "Greater Accra",
      districtMunicipality: "",
      residentialTown:      "",
      vehicleCategory:      "",
      nextOfKinName:        "",
      nextOfKinContact:     "",
    },
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── State ─────────────────────────────────────────────────────────────────────
  const [step,          setStep]        = useState(1);
  const [completedSteps, setCompleted]  = useState<number[]>([]);
  const [photo,         setPhoto]       = useState<string | null>(null);
  const [isValidating,  setIsValidating]= useState(false);
  const [success,       setSuccess]     = useState(false);
  const [bookingRef,    setBookingRef]  = useState("");
  const [txnId,         setTxnId]       = useState("");
  const [submitError,   setSubmitError] = useState("");
  const [isSaving,      setIsSaving]    = useState(false);
  const [showNav,       setShowNav]     = useState(false);
  const [authReady,     setAuthReady]   = useState(false);
  const [photoError,    setPhotoError]  = useState<string>("");

  // ── Effects ───────────────────────────────────────────────────────────────────

  // 1. Anonymous auth — resolves before any Firebase call is made
  useEffect(() => {
  // ── Auth ────────────────────────────────────────────────────────────────
  const firebaseAuth = getAuth();
  if (firebaseAuth.currentUser) {
    setAuthReady(true);
  } else {
    signInAnonymously(firebaseAuth)
      .then(() => { console.log("[auth] anonymous session ready"); setAuthReady(true); })
      .catch((err) => { console.error("[auth] anonymous sign-in failed:", err); setAuthReady(true); });
  }

  // ── Restore draft ────────────────────────────────────────────────────────
  const saved      = loadPersistedFormState();
  const savedPhoto = loadPersistedPhoto();

  if (saved) {
    // Restore form values
    form.reset({ ...saved.values, region: "Greater Accra" });
    // Restore step and progress
    setStep(saved.step);
    setCompleted(saved.completedSteps);
    // Restore photo
    if (savedPhoto) setPhoto(savedPhoto);

    toast.info("Draft restored", {
      description: "Your previous progress has been recovered.",
      duration: 3000,
    });
  }
}, []);

  // 2. Auto-save + show nav on every field change
  useEffect(() => {
    const sub = form.watch((values) => {
      setShowNav(true);

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        persistFormState({
          values:         values as Partial<PreRegistrationData>,
          step,
          completedSteps,
        });
      }, 800);
    });

    return () => {
      sub.unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [form, step, completedSteps]);

  // 3. Save step position whenever step or completedSteps change
  useEffect(() => {
    persistFormState({
      values:         form.getValues(),
      step,
      completedSteps,
    });
  }, [step, completedSteps]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step field maps ───────────────────────────────────────────────────────────
  const STEP_FIELDS: Record<number, (keyof PreRegistrationData)[]> = {
    1: ["fullName", "phoneNumber", "dateOfBirth", "gender"],
    2: ["idType", "idNumber", "region", "districtMunicipality", "residentialTown"],
    3: ["vehicleCategory", "nextOfKinName", "nextOfKinContact"],
  };



  // ── Photo change — persists to sessionStorage + clears required error ─────────
  function handlePhotoChange(p: string | null) {
    setPhoto(p);
    persistPhoto(p);
    if (p) setPhotoError(""); // clear error as soon as a valid photo is set
  }
  
  // ── Navigation ────────────────────────────────────────────────────────────────
  async function handleNext() {
    const fields = STEP_FIELDS[step];
    if (!fields) return;

    // Photo is required on step 1 — it lives outside the form schema
    // so we validate it manually here before triggering Zod
    if (step === 1 && !photo) {
      setPhotoError("A passport photograph is required. Please upload a clear, front-facing photo.");
      window.scrollTo({ top: 0, behavior: "smooth" }); // scroll up so user sees the error
      toast.error("Photo required", {
        description: "Please upload your passport photograph before continuing.",
      });
      return;
    }

    setIsValidating(true);
    const valid = await form.trigger(fields);
    setIsValidating(false);

    if (!valid) { toast.warning("Please fix the errors before continuing."); return; }

    setCompleted((prev) => (prev.includes(step) ? prev : [...prev, step]));
    setStep((s) => Math.min(s + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Payment success ───────────────────────────────────────────────────────────
  async function handlePaymentSuccess(transactionId: string, reference: string) {
    if (!authReady) {
      toast.error("Session not ready", { description: "Please wait a moment and try again." });
      return;
    }

    setTxnId(transactionId);
    setIsSaving(true);
    setSubmitError("");

    try {
      const preRegData = form.getValues();

      let passportPhoto: File | undefined = undefined;
      if (photo) {
        const res  = await fetch(photo);
        const blob = await res.blob();
        passportPhoto = new File([blob], "passport.jpg", { type: blob.type });
      }

      const riderData: RiderRegistrationData = {
        fullName:             preRegData.fullName,
        phoneNumber:          preRegData.phoneNumber,
        dateOfBirth:          preRegData.dateOfBirth,
        gender:               preRegData.gender!,
        idType:               preRegData.idType!,
        idNumber:             preRegData.idNumber,
        region:               preRegData.region,
        districtMunicipality: preRegData.districtMunicipality as RiderRegistrationData["districtMunicipality"],
        residentialTown:      preRegData.residentialTown,
        vehicleCategory:      preRegData.vehicleCategory as RiderRegistrationData["vehicleCategory"],
        nextOfKinName:        preRegData.nextOfKinName,
        nextOfKinContact:     preRegData.nextOfKinContact,
        // Captured after training
        plateNumber:          "",
        chassisNumber:        "",
        driversLicenseNumber: "",
        licenseExpiryDate:    "",
        passportPhoto,
      };

      const result = await saveRiderRegistration(
        riderData,
        {
          paymentReference: reference,
          paymentTxnId:     transactionId,
          paymentStatus:    "paid",
          paymentAmount:    amount,
        },
        { requireAuth: false },
      );

      if (!result.success) {
        const message = result.error ?? "Registration failed. Please try again.";
        setSubmitError(message);
        toast.error("Registration failed", {
          description: `Your payment went through but saving failed. Please contact support with reference: ${reference}`,
        });
        return;
      }

      // Show full PCRAA as the booking reference (e.g. GAP-0001-AM0726)
      setBookingRef(result.PCRAA);
      setSuccess(true);
      clearPersistedFormState(); // wipe draft now that registration is done
      setCompleted((prev) => [...new Set([...prev, step])]);
      onSuccess?.(result.PCRAA);

      toast.success("Registration complete!", { description: `PCRAA: ${result.PCRAA}` });
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err: any) {
      const message = err?.message ?? "An unexpected error occurred.";
      setSubmitError(message);
      toast.error("Something went wrong", { description: message });
    } finally {
      setIsSaving(false);
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────
  function handleReset() {
    form.reset({ region: "Greater Accra" });
    setStep(1);
    setCompleted([]);
    handlePhotoChange(null); // clears photo from storage too
    setSuccess(false);
    setBookingRef("");
    setTxnId("");
    setSubmitError("");
    clearPersistedFormState(); // wipe the draft
    // authReady intentionally stays true
  }

  const data = form.getValues();

  // ── Loading overlay ───────────────────────────────────────────────────────────
  if (isSaving) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ background: "#F7F6F3", ...FONT_BODY }}>
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <p className="text-slate-600 text-sm text-center">Saving your registration…</p>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-10" style={{ background: "#F7F6F3", ...FONT_BODY }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
        <div className="max-w-4xl mx-auto">
          <ConfirmationReceipt bookingRef={bookingRef} data={data} txnId={txnId} photo={photo} onReset={handleReset} />
        </div>
      </div>
    );
  }

  // ── Multi-step form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#F7F6F3", ...FONT_BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Page header */}
      <div className="relative px-4 sm:px-6 py-14 sm:py-20 text-center overflow-hidden" style={{ background: "#1a0a00" }}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/images/ctsbackdrop.png')`, opacity: 0.55 }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(15,30,10,0.55) 0%, rgba(5,30,15,0.70) 45%, rgba(2,20,10,0.92) 100%)" }} />

        <div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 z-20 flex justify-between items-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold uppercase tracking-widest transition-all bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl" style={FONT_BODY}>
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <Link href="/training-details" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold uppercase tracking-widest transition-all bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl" style={FONT_BODY}>
            Training Info <Info className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.08] mb-3 sm:mb-4 tracking-tight" style={{ ...FONT_DISPLAY, textShadow: "0 2px 32px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)" }}>
            Commercial Rider{" "}
            <span style={{ color: "#6ee7b7", textShadow: "0 2px 20px rgba(110,231,183,0.4)" }}>Training</span>{" "}
            Registration
          </h1>
          <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
            <div className="h-px w-10 sm:w-12 bg-white/25" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <div className="h-px w-10 sm:w-12 bg-white/25" />
          </div>
          <p className="text-white/90 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-medium" style={{ ...FONT_BODY, textShadow: "0 1px 10px rgba(0,0,0,0.6)" }}>
            Enrol in the mandatory training and certification programme for commercial motorcycle and tricycle operators in Greater Accra.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 sm:mt-5">
            {[
              { icon: Shield,      label: "Certified Programme" },
              { icon: CreditCard,  label: "GHS 400 One-time Membership Fee" },
              { icon: CheckCircle2,label: "Rider ID on Completion" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(8px)", textShadow: "0 1px 4px rgba(0,0,0,0.4)", ...FONT_BODY }}>
                <Icon className="h-3 w-3 text-emerald-300 shrink-0" />{label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
          <div className="hidden lg:block lg:col-span-1 sticky top-6">
            <SidebarSteps current={step} completed={completedSteps} />
          </div>

          <div className="lg:col-span-3">
            {/* Mobile step pills */}
            <div className="flex lg:hidden items-center gap-1.5 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-1 px-1">
              {STEPS.map((s) => {
                const isDone    = completedSteps.includes(s.id);
                const isCurrent = step === s.id;
                return (
                  <div key={s.id} className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border transition-all ${isCurrent ? "bg-emerald-700 text-white border-emerald-700" : isDone ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`} style={FONT_BODY}>
                    {isDone ? <Check className="w-3 h-3" /> : <span>{s.id}</span>}
                    {s.title}
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-6 md:p-10">
                <Form {...form}>
                  <form onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") e.preventDefault(); }}>
                    {step === 1 && <Step1Personal form={form} photo={photo} onPhotoChange={handlePhotoChange} photoError={photoError} />}
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
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700" style={FONT_BODY}>{submitError}</p>
                      </div>
                    )}
                    <div className="h-20 sm:h-16" />
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 space-y-3">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-2" style={FONT_BODY}>
            <Shield className="h-3 w-3 shrink-0" />
            Secured by Bridge · PCRAA Limited · All rights reserved
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            {[["Privacy Policy", "/privacy-policy"], ["Terms & Conditions", "/terms"], ["Data Protection", "/data-protection"]].map(([label, href]) => (
              <React.Fragment key={href}>
                <Link href={href} className="text-slate-400 hover:text-emerald-600 transition-colors" style={FONT_BODY}>{label}</Link>
                {label !== "Data Protection" && <span className="text-slate-300">•</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Floating navigation */}
      {showNav && step < 4 && (
        <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 px-4 sm:px-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-full px-4 sm:px-5 py-3 w-full sm:w-auto justify-between sm:justify-start">
            <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1 || isValidating} className="rounded-full gap-2 flex-1 sm:flex-initial">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button type="button" onClick={handleNext} disabled={isValidating} className="bg-emerald-700 hover:bg-emerald-800 rounded-full gap-2 flex-1 sm:flex-initial">
              {isValidating ? <><Loader2 className="h-4 w-4 animate-spin" /> Validating…</> : <>Next <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}