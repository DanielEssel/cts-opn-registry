"use client";

import { RiderRegistrationData } from "@/app/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PreviewStepProps {
  data: RiderRegistrationData;
  photoPreview?: string | null;
}

export function PreviewStep({ data, photoPreview }: PreviewStepProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM dd, yyyy");
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Review Your Information</h3>
        <p className="text-sm text-gray-500 mt-1">
          Please verify all details before submitting your registration
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ensure all information is accurate. You will receive your Operating Permit Number (OPN) immediately after submission.
        </AlertDescription>
      </Alert>

      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="font-medium text-gray-900">{data.fullName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Gender</p>
            <Badge variant="secondary">{data.gender}</Badge>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Phone Number
            </p>
            <p className="font-medium text-gray-900">{data.phoneNumber}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Date of Birth
            </p>
            <p className="font-medium text-gray-900">
              {formatDate(data.dateOfBirth)}
              <span className="text-sm text-gray-500 ml-2">
                ({calculateAge(data.dateOfBirth)} years old)
              </span>
            </p>
          </div>

          <div className="space-y-1 md:col-span-2">
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              Ghana Card Number
            </p>
            <p className="font-medium text-gray-900 font-mono">
              {data.ghanaCardNumber}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Location Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Location Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Region</p>
            <p className="font-medium text-gray-900">{data.region}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">District / Municipality</p>
            <Badge variant="outline" className="font-medium">
              {data.districtMunicipality}
            </Badge>
          </div>

          <div className="space-y-1 md:col-span-2">
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Home className="w-3 h-3" />
              Residential Town
            </p>
            <p className="font-medium text-gray-900">{data.residentialTown}</p>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bike className="w-5 h-5 text-yellow-600" />
            Vehicle Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 md:col-span-2">
            <p className="text-sm text-gray-500">Vehicle Category</p>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
              {data.vehicleCategory}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Plate Number</p>
            <p className="font-medium text-gray-900 font-mono uppercase">
              {data.plateNumber}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Chassis Number</p>
            <p className="font-medium text-gray-900 font-mono uppercase">
              {data.chassisNumber}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Compliance & Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Driver&apos;s License Number</p>
              <p className="font-medium text-gray-900 font-mono uppercase">
                {data.driversLicenseNumber}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500">License Expiry Date</p>
              <p className="font-medium text-gray-900">
                {formatDate(data.licenseExpiryDate)}
              </p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Next of Kin Contact
              </p>
              <p className="font-medium text-gray-900">{data.nextOfKinContact}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm text-gray-500">Passport Photo</p>
            {photoPreview ? (
              <div className="flex items-start gap-4">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={photoPreview}
                    alt="Passport Photo Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    ✓ Photo Uploaded
                  </Badge>
                  {data.passportPhoto instanceof File && (
                    <p className="text-xs text-gray-500 mt-2">
                      {data.passportPhoto.name} ({(data.passportPhoto.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                No photo uploaded (Optional)
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Info Box */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">What happens next?</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Your Operating Permit Number (OPN) will be generated instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Your permit will be valid for 6 months from today</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Keep your OPN safe and present it during verification checks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>You&apos;ll be able to renew your permit before expiry</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}