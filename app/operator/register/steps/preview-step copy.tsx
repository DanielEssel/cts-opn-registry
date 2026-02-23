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

interface PreviewStepProps {
  data: RiderRegistrationData;
  photoPreview?: string | null;
}

export function PreviewStep({ data, photoPreview }: PreviewStepProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const InfoField = ({ label, value, icon: Icon }: { label: string; value: string; icon: React.ReactNode }) => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {Icon && <span className="text-green-600">{Icon}</span>}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Verify Your Details</h2>
        <p className="text-gray-600">Review all information before submitting</p>
      </div>

      {/* PHOTO SECTION */}
      {photoPreview && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200/50 p-6">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border-3 border-green-300 shadow-lg flex-shrink-0">
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
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Passport Photo</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Uploaded</p>
              {data.passportPhoto instanceof File && (
                <p className="text-xs text-gray-500">
                  {data.passportPhoto.name} • {(data.passportPhoto.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PERSONAL INFO GRID */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="Full Name" value={data.fullName} icon={<User className="h-4 w-4" />} />
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="Gender" value={data.gender || "-"} icon={<User className="h-4 w-4" />} />
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="Age" value={`${calculateAge(data.dateOfBirth)} years`} icon={<Calendar className="h-4 w-4" />} />
        </div>
        <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="Phone" value={data.phoneNumber} icon={<Phone className="h-4 w-4" />} />
        </div>
        <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="Ghana Card" value={data.idNumber} icon={<CreditCard className="h-4 w-4" />} />
        </div>
      </div>

      {/* LOCATION INFO GRID */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="Region" value={data.region} icon={<MapPin className="h-4 w-4" />} />
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="District" value={data.districtMunicipality || "-"} icon={<Home className="h-4 w-4" />} />
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="Town" value={data.residentialTown} icon={<Home className="h-4 w-4" />} />
        </div>
      </div>

      {/* VEHICLE INFO GRID */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-200/50">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Bike className="h-4 w-4 text-yellow-600" />
              Vehicle Category
            </p>
            <Badge className="w-fit bg-yellow-100 text-yellow-800 border-none font-semibold">
              {data.vehicleCategory}
            </Badge>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="Plate Number" value={data.plateNumber} icon={<Bike className="h-4 w-4" />} />
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="Chassis Number" value={data.chassisNumber} icon={<Bike className="h-4 w-4" />} />
        </div>
      </div>

      {/* COMPLIANCE INFO GRID */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="Driver's License" value={data.driversLicenseNumber} icon={<FileText className="h-4 w-4" />} />
        </div>
        <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="License Expiry" value={formatDate(data.licenseExpiryDate)} icon={<Calendar className="h-4 w-4" />} />
        </div>
        <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-200/50">
          <InfoField label="Next of Kin" value={data.nextOfKinContact} icon={<Users className="h-4 w-4" />} />
        </div>
      </div>

      {/* CONFIRMATION BOX */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200/50 p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0 pt-1">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Ready to Submit?</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Your OPN will be generated instantly after submission. Your permit is valid for 6 months from today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}