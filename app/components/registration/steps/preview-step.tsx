"use client";

import { RiderRegistrationData } from "@/app/lib/validations";
import { Badge } from "@/components/ui/badge";
import {
  User, Phone, CreditCard, Calendar, MapPin,
  Home, Bike, FileText, Users, CheckCircle2, Camera,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

interface PreviewStepProps {
  data: RiderRegistrationData;
  photoPreview?: string | null;
}

export function PreviewStep({ data, photoPreview }: PreviewStepProps) {
  const formatDate = (dateString: string) => {
    try { return format(new Date(dateString), "MMM dd, yyyy"); }
    catch { return dateString; }
  };

  const calculateAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const ID_LABELS: Record<string, string> = {
    GHANA_CARD: "Ghana Card",
    VOTERS_ID: "Voter's ID",
    PASSPORT: "Passport",
  };

  // ── Reusable field row ──────────────────────────────────────────────────
  const Field = ({
    label,
    value,
    icon: Icon,
    mono = false,
  }: {
    label: string;
    value: string;
    icon: React.ElementType;
    mono?: boolean;
  }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-gray-900 truncate ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
      </div>
    </div>
  );

  // ── Section wrapper ─────────────────────────────────────────────────────
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-4 divide-y divide-gray-100">{children}</div>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Review & Confirm</h3>
        <p className="text-sm text-gray-500 mt-1">Check all details before submitting</p>
      </div>

      {/* Photo + Name banner */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        {photoPreview ? (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-green-300 flex-shrink-0 shadow-sm">
            <Image src={photoPreview} alt="Passport Photo" fill className="object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-green-100 border-2 border-dashed border-green-300 flex items-center justify-center flex-shrink-0">
            <Camera className="h-6 w-6 text-green-400" />
          </div>
        )}
        <div>
          <p className="font-bold text-gray-900 text-base">{data.fullName}</p>
          <p className="text-sm text-gray-500">{data.gender} · {calculateAge(data.dateOfBirth)} years old</p>
          {data.passportPhoto instanceof File && (
            <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {data.passportPhoto.name}
            </p>
          )}
        </div>
      </div>

      {/* Personal Info */}
      <Section title="Personal Information">
        <Field label="Phone Number" value={data.phoneNumber} icon={Phone} mono />
        <Field label="Date of Birth" value={formatDate(data.dateOfBirth)} icon={Calendar} />
        <Field
          label={ID_LABELS[data.idType] || "ID Number"}
          value={data.idNumber}
          icon={CreditCard}
          mono
        />
      </Section>

      {/* Location */}
      <Section title="Location">
        <Field label="Region" value={data.region} icon={MapPin} />
        <Field label="District / Municipality" value={data.districtMunicipality || "—"} icon={Home} />
        <Field label="Residential Town" value={data.residentialTown} icon={Home} />
      </Section>

      {/* Vehicle */}
      <Section title="Vehicle Information">
        <div className="py-3 flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Bike className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Vehicle Category</p>
            <Badge className="bg-yellow-100 text-yellow-800 border-none font-semibold text-xs">
              {data.vehicleCategory}
            </Badge>
          </div>
        </div>
        <Field label="Plate Number" value={data.plateNumber} icon={Bike} mono />
        <Field label="Chassis Number" value={data.chassisNumber} icon={Bike} mono />
      </Section>

      {/* Compliance */}
      <Section title="Compliance & Documents">
        <Field label="Driver's License" value={data.driversLicenseNumber} icon={FileText} mono />
        <Field label="License Expiry" value={formatDate(data.licenseExpiryDate)} icon={Calendar} />
        <Field label="Next of Kin Name" value={data.nextOfKinName} icon={Users} />
        <Field label="Next of Kin Contact" value={data.nextOfKinContact} icon={Phone} mono />
      </Section>

      {/* Ready banner */}
      <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-900">Ready to Submit</p>
          <p className="text-xs text-green-700 mt-0.5">
            Your OPN will be generated instantly. Permit is valid for 6 months from today.
          </p>
        </div>
      </div>

    </div>
  );
}