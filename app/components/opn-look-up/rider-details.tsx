"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  Phone,
  CreditCard,
  MapPin,
  Bike,
  FileText,
  Calendar,
  ArrowLeft,
  Download,
  Share2,
} from "lucide-react";
import { RiderRecord } from "@/lib/rider-service";
import { isPermitExpired, daysUntilExpiry } from "@/lib/rider-lookup";
import { format } from "date-fns";
import Image from "next/image";

interface RiderDetailsProps {
  rider: RiderRecord & { id: string };
  onReset: () => void;
}

export function RiderDetails({ rider, onReset }: RiderDetailsProps) {
  const expired = isPermitExpired(rider.expiryDate);
  const daysLeft = daysUntilExpiry(rider.expiryDate);
  const expiringSoon = daysLeft <= 30 && daysLeft > 0;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const handleDownload = () => {
    // Create a simple text file with OPN details
    const content = `
GHANA OPERATING PERMIT NUMBER (OPN)
====================================

OPN: ${rider.opn}
Full Name: ${rider.fullName}
Ghana Card: ${rider.ghanaCardNumber}
Phone: ${rider.phoneNumber}
Vehicle: ${rider.vehicleCategory} (${rider.plateNumber})
District: ${rider.districtMunicipality}
Issue Date: ${formatDate(rider.issueDate)}
Expiry Date: ${formatDate(rider.expiryDate)}
Status: ${rider.status.toUpperCase()}

Keep this information safe and present during verification.
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OPN-${rider.opn}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareData = {
      title: "My Operating Permit Number",
      text: `My OPN: ${rider.opn}\nValid until: ${formatDate(rider.expiryDate)}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`OPN: ${rider.opn}`);
      alert("OPN copied to clipboard!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Alert */}
      {expired && (
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertDescription className="text-base">
            <strong>Permit Expired!</strong> Your operating permit expired on{" "}
            {formatDate(rider.expiryDate)}. Please renew your permit to continue operations.
          </AlertDescription>
        </Alert>
      )}

      {expiringSoon && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-base">
            <strong>Permit Expiring Soon!</strong> Your permit will expire in {daysLeft} days
            on {formatDate(rider.expiryDate)}. Please renew before expiry.
          </AlertDescription>
        </Alert>
      )}

      {!expired && !expiringSoon && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 text-base">
            <strong>Permit Active!</strong> Your permit is valid until{" "}
            {formatDate(rider.expiryDate)} ({daysLeft} days remaining).
          </AlertDescription>
        </Alert>
      )}

      {/* OPN Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Operating Permit Number</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-green-600 to-yellow-600 rounded-lg p-8 text-center text-white shadow-lg">
            <p className="text-sm opacity-90 mb-2">Your OPN</p>
            <p className="text-4xl md:text-5xl font-bold font-mono tracking-wider mb-4">
              {rider.opn}
            </p>
            <div className="flex justify-center gap-2">
              <Badge
                variant="secondary"
                className={`${
                  expired
                    ? "bg-red-100 text-red-800"
                    : expiringSoon
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {expired ? "Expired" : expiringSoon ? "Expiring Soon" : "Active"}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">{rider.fullName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium text-gray-900">{rider.gender}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Phone Number
              </p>
              <p className="font-medium text-gray-900">{rider.phoneNumber}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                Ghana Card Number
              </p>
              <p className="font-medium text-gray-900 font-mono">{rider.ghanaCardNumber}</p>
            </div>
          </div>

          {rider.passportPhotoUrl && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 mb-2">Passport Photo</p>
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={rider.passportPhotoUrl}
                    alt="Passport Photo"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Location & Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Region</p>
              <p className="font-medium text-gray-900">{rider.region}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">District</p>
              <Badge variant="outline">{rider.districtMunicipality}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Town</p>
              <p className="font-medium text-gray-900">{rider.residentialTown}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bike className="w-5 h-5 text-yellow-600" />
              Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <Badge className="bg-yellow-100 text-yellow-800">{rider.vehicleCategory}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plate Number</p>
              <p className="font-medium text-gray-900 font-mono">{rider.plateNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Chassis Number</p>
              <p className="font-medium text-gray-900 font-mono text-xs">
                {rider.chassisNumber}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance & Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Compliance & Permit Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Driver&apos;s License</p>
              <p className="font-medium text-gray-900 font-mono">
                {rider.driversLicenseNumber}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">License Expiry</p>
              <p className="font-medium text-gray-900">{formatDate(rider.licenseExpiryDate)}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Permit Issue Date
              </p>
              <p className="font-medium text-gray-900">{formatDate(rider.issueDate)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Permit Expiry Date
              </p>
              <p className="font-medium text-gray-900">{formatDate(rider.expiryDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={onReset} variant="outline" className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Search Again
        </Button>

        {(expired || expiringSoon) && (
          <Button className="flex-1 bg-green-600 hover:bg-green-700">
            Renew Permit
          </Button>
        )}
      </div>
    </div>
  );
}