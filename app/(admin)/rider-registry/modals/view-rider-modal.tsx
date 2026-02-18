"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  Bike,
  FileText,
  Users,
  Download,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ViewRiderModalProps {
  open: boolean;
  rider: any | null;
  onOpenChange: (open: boolean) => void;
}

export function ViewRiderModal({
  open,
  rider,
  onOpenChange,
}: ViewRiderModalProps) {
  if (!rider) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const verificationUrl = `${baseUrl}/verify/${rider.opn}`;

  const issueDate = new Date(rider.issueDate);
  const expiryDate = new Date(rider.expiryDate);
  const isExpired = expiryDate < new Date();
  const daysLeft = Math.ceil(
    (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-screen p-0 border-0 shadow-none rounded-none overflow-hidden bg-white">
        <div className="flex h-full w-full overflow-hidden">
          {/* Left Section - Profile Header & QR - 25% width for better balance */}
          <div className="flex-shrink-0 w-[25%] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-24 -mb-24" />

            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-50 p-2 hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Profile Info */}
            <div className="relative z-10 space-y-6">
              <h1 className="text-4xl font-black text-white mb-3 leading-tight">
                {rider.fullName}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-400 text-blue-900 border-none text-sm font-bold px-3 py-1.5">
                  OPN: {rider.opn}
                </Badge>
                <Badge
                  className={`border-none text-sm font-bold px-3 py-1.5 ${
                    rider.status === "Active"
                      ? "bg-green-400 text-green-900"
                      : rider.status === "Pending"
                        ? "bg-yellow-400 text-yellow-900"
                        : "bg-red-400 text-red-900"
                  }`}
                >
                  {rider.status}
                </Badge>
              </div>

              <div className="space-y-3 text-blue-50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium text-sm">{rider.districtMunicipality}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bike className="h-4 w-4" />
                  <span className="font-medium text-sm">{rider.vehicleCategory}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium text-sm">{rider.phoneNumber}</span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 flex justify-center">
              <div className="bg-white rounded-xl p-3">
                <QRCodeSVG value={verificationUrl} size={140} level="H" />
              </div>
            </div>

            {/* Download Button */}
            <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm rounded-xl h-11 shadow-lg transition-all duration-200">
              <Download className="mr-2 h-4 w-4" />
              Download Profile
            </Button>
          </div>

          {/* Right Section - Details - 75% width */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="h-full w-full px-16 py-10">
              {/* Status Cards - More spacious */}
              <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 shadow-sm">
                  <p className="text-xs font-bold text-green-600 uppercase mb-3 tracking-wider">
                    Issued
                  </p>
                  <p className="text-2xl font-black text-green-900">
                    {issueDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div
                  className={`bg-gradient-to-br rounded-2xl p-6 border shadow-sm ${
                    isExpired
                      ? "from-red-50 to-red-100 border-red-200"
                      : "from-blue-50 to-blue-100 border-blue-200"
                  }`}
                >
                  <p
                    className={`text-xs font-bold uppercase mb-3 tracking-wider ${
                      isExpired ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {isExpired ? "Expired" : "Expires"}
                  </p>
                  <p
                    className={`text-2xl font-black ${
                      isExpired ? "text-red-900" : "text-blue-900"
                    }`}
                  >
                    {isExpired
                      ? "Expired"
                      : `${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-sm">
                  <p className="text-xs font-bold text-purple-600 uppercase mb-3 tracking-wider">
                    License Expires
                  </p>
                  <p className="text-2xl font-black text-purple-900">
                    {new Date(rider.licenseExpiryDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Details Grid - Wider spacing */}
              <div className="space-y-10">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <h3 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <div className="h-1 w-8 bg-blue-600 rounded-full" />
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-3 gap-x-12 gap-y-6">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Full Name
                      </p>
                      <p className="text-base font-bold text-gray-900">
                        {rider.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Gender
                      </p>
                      <p className="text-base font-bold text-gray-900">
                        {rider.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Phone
                      </p>
                      <p className="text-base font-bold text-gray-900">
                        {rider.phoneNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Ghana Card Number
                      </p>
                      <p className="text-base font-mono font-bold text-gray-900">
                        {rider.ghanaCardNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Date of Birth
                      </p>
                      <p className="text-base font-bold text-gray-900">
                        {new Date(rider.dateOfBirth).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <h3 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <div className="h-1 w-8 bg-green-600 rounded-full" />
                    <MapPin className="h-5 w-5 text-green-600" />
                    Location Details
                  </h3>
                  <div className="grid grid-cols-3 gap-x-12 gap-y-6">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Region
                      </p>
                      <p className="text-base font-bold text-gray-900">
                        {rider.region}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        District
                      </p>
                      <p className="text-base font-bold text-gray-900">
                        {rider.districtMunicipality}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Town
                      </p>
                      <p className="text-base font-bold text-gray-900">
                        {rider.residentialTown}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <h3 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <div className="h-1 w-8 bg-amber-600 rounded-full" />
                    <Bike className="h-5 w-5 text-amber-600" />
                    Vehicle Information
                  </h3>
                  <div className="grid grid-cols-3 gap-x-12 gap-y-6">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Category
                      </p>
                      <p className="text-base font-bold text-gray-900">
                        {rider.vehicleCategory}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Plate Number
                      </p>
                      <p className="text-base font-mono font-bold text-gray-900">
                        {rider.plateNumber.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Chassis Number
                      </p>
                      <p className="text-base font-mono font-bold text-gray-900">
                        {rider.chassisNumber.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compliance Information */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <h3 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <div className="h-1 w-8 bg-purple-600 rounded-full" />
                    <FileText className="h-5 w-5 text-purple-600" />
                    Compliance & Documents
                  </h3>
                  <div className="grid grid-cols-3 gap-x-12 gap-y-6">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Driver's License
                      </p>
                      <p className="text-base font-mono font-bold text-gray-900">
                        {rider.driversLicenseNumber.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        License Expiry
                      </p>
                      <p className="text-base font-bold text-gray-900">
                        {new Date(rider.licenseExpiryDate).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2 tracking-wider">
                        Next of Kin
                      </p>
                      <p className="text-base font-bold text-gray-900">
                        {rider.nextOfKinContact}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Photo if available */}
                {rider.passportPhotoUrl && (
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                    <h3 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                      <div className="h-1 w-8 bg-gray-600 rounded-full" />
                      <User className="h-5 w-5 text-gray-600" />
                      Passport Photo
                    </h3>
                    <img
                      src={rider.passportPhotoUrl}
                      alt="Passport"
                      className="h-64 w-auto rounded-xl object-cover shadow-md border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}