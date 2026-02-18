"use client";

import { RiderRegistrationData } from "@/app/lib/validations";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  Home,
  Bike,
  FileText,
  Users,
  CheckCircle2,
  Camera,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

// ============================================================================
// TYPES
// ============================================================================

interface PreviewStepProps {
  data: RiderRegistrationData;
  photoPreview?: string | null;
}

// ============================================================================
// INFO FIELD COMPONENT
// ============================================================================

interface InfoFieldProps {
  label: string;
  value: string | undefined;
  icon?: React.ReactNode;
}

function InfoField({ label, value, icon }: InfoFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {icon && <span className="text-green-600">{icon}</span>}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-sm font-semibold text-slate-900">{value || "—"}</p>
    </div>
  );
}

// ============================================================================
// PREVIEW STEP COMPONENT
// ============================================================================

export function PreviewStep({ data, photoPreview }: PreviewStepProps) {
  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dateString: string | undefined) => {
    if (!dateString) return "—";
    try {
      const today = new Date();
      const birthDate = new Date(dateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} years`;
    } catch {
      return "—";
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Verify Your Details
        </h2>
        <p className="text-slate-600">
          Review all information before submitting
        </p>
      </div>

      {/* PHOTO SECTION */}
      {photoPreview && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-6">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border-3 border-green-300 shadow-lg flex-shrink-0 bg-slate-100">
              <Image
                src={photoPreview}
                alt="Passport Photo"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Camera className="h-4 w-4 text-green-600" />
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider">
                  Passport Photo
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">Uploaded</p>
              {data.passportPhoto instanceof File && (
                <p className="text-xs text-slate-500 mt-1">
                  {data.passportPhoto.name} •{" "}
                  {(data.passportPhoto.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BIO DATA SECTION */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <User className="h-5 w-5 text-green-600" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-full bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Full Name"
              value={data.fullName}
              icon={<User className="h-4 w-4" />}
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Gender"
              value={data.gender}
              icon={<User className="h-4 w-4" />}
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Age"
              value={calculateAge(data.dateOfBirth)}
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>
          <div className="col-span-full bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Phone Number"
              value={data.phoneNumber}
              icon={<Phone className="h-4 w-4" />}
            />
          </div>
          <div className="col-span-full bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="ID Type & Number"
              value={`${data.idType} - ${data.idNumber}`}
              icon={<CreditCard className="h-4 w-4" />}
            />
          </div>
          <div className="col-span-full bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Date of Birth"
              value={formatDate(data.dateOfBirth)}
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      {/* LOCATION SECTION */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          Location Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-full bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Region"
              value={data.region}
              icon={<MapPin className="h-4 w-4" />}
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="District"
              value={data.districtMunicipality}
              icon={<Home className="h-4 w-4" />}
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Town/Residential Area"
              value={data.residentialTown}
              icon={<Home className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      {/* VEHICLE SECTION */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Bike className="h-5 w-5 text-green-600" />
          Vehicle Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-full bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Vehicle Category
            </p>
            <Badge className="bg-yellow-100 text-yellow-800 border-none font-semibold">
              {data.vehicleCategory || "—"}
            </Badge>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Plate Number"
              value={data.plateNumber}
              icon={<Bike className="h-4 w-4" />}
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Chassis Number"
              value={data.chassisNumber}
              icon={<Bike className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      {/* COMPLIANCE SECTION */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-600" />
          Compliance Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-full bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Driver's License Number"
              value={data.driversLicenseNumber}
              icon={<FileText className="h-4 w-4" />}
            />
          </div>
          <div className="col-span-full bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="License Expiry Date"
              value={formatDate(data.licenseExpiryDate)}
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>
          <div className="col-span-full bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Next of Kin Name"
              value={data.nextOfKinName}
              icon={<Users className="h-4 w-4" />}
            />
          </div>
          <div className="col-span-full bg-white rounded-lg p-4 border border-slate-200">
            <InfoField
              label="Next of Kin Contact"
              value={data.nextOfKinContact}
              icon={<Phone className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      {/* CONFIRMATION BOX */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0 pt-1">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-2">Ready to Submit?</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Your OPN will be generated instantly after submission. Your permit
              is valid for 6 months from today. You can download and print your
              certificate after registration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}