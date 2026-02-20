"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { RiderRecord } from "@/lib/rider-service";

// ============================================================================
// TYPES
// ============================================================================

interface ViewRiderModalProps {
  open: boolean;
  rider: (RiderRecord & { id: string }) | null;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// VIEW RIDER MODAL COMPONENT
// ============================================================================

export function ViewRiderModal({
  open,
  rider,
  onOpenChange,
}: ViewRiderModalProps) {
  if (!rider) return null;

  // ========================================================================
  // CALCULATE DATES & STATUS
  // ========================================================================

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const verificationUrl = `${baseUrl}/verify/${rider.opn}`;

  const issueDate = new Date(rider.issueDate);
  const expiryDate = new Date(rider.expiryDate);
  const licenseExpiryDate = new Date(rider.licenseExpiryDate);
  
  const isExpired = expiryDate < new Date();
  const daysLeft = Math.ceil(
    (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // ========================================================================
  // GET STATUS COLOR
  // ========================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500 text-white";
      case "Pending":
        return "bg-yellow-500 text-white";
      case "Expired":
        return "bg-red-500 text-white";
      case "Suspended":
        return "bg-slate-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        {/* HEADER */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-emerald-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Rider Profile
              </h2>
              <p className="text-green-100 text-sm">Complete rider information</p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto max-h-[calc(90vh-88px)]">
          <div className="p-8 space-y-6">
            {/* PROFILE HEADER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* LEFT - MAIN INFO */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-2">
                      {rider.fullName}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="font-mono text-sm bg-slate-900 text-white">
                        {rider.opn}
                      </Badge>
                      <Badge className={`${getStatusColor(rider.status)}`}>
                        {rider.status}
                      </Badge>
                      <Badge variant="outline" className="border-slate-300">
                        {rider.vehicleCategory}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* QUICK INFO */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">{rider.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">
                      {rider.districtMunicipality}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-slate-500" />
                    <span className="font-mono font-semibold text-xs">
                      {rider.idType}: {rider.idNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">
                      Born: {new Date(rider.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT - QR CODE */}
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-slate-200">
                <div className="bg-white p-4 rounded-lg shadow-sm mb-3">
                  <QRCodeSVG value={verificationUrl} size={120} level="H" />
                </div>
                <p className="text-xs text-slate-600 text-center font-semibold">
                  Scan to verify
                </p>
              </div>
            </div>

            {/* STATUS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ISSUE DATE */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-bold text-blue-700 uppercase">
                    Issued
                  </p>
                </div>
                <p className="text-xl font-bold text-blue-900">
                  {issueDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* EXPIRY DATE */}
              <div
                className={`p-4 rounded-lg border ${
                  isExpired
                    ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                    : daysLeft <= 30
                    ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
                    : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isExpired ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-green-600" />
                  )}
                  <p
                    className={`text-xs font-bold uppercase ${
                      isExpired ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    {isExpired ? "Expired" : "Expires In"}
                  </p>
                </div>
                <p
                  className={`text-xl font-bold ${
                    isExpired ? "text-red-900" : "text-green-900"
                  }`}
                >
                  {isExpired ? "Expired" : `${daysLeft} days`}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {expiryDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* LICENSE EXPIRY */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-bold text-purple-700 uppercase">
                    License Expires
                  </p>
                </div>
                <p className="text-xl font-bold text-purple-900">
                  {licenseExpiryDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* DETAILS SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PERSONAL INFORMATION */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h4 className="text-sm font-bold text-slate-900 uppercase mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  Personal Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Full Name
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {rider.fullName}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-1">
                        Gender
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {rider.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-1">
                        Phone
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {rider.phoneNumber}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      ID Type & Number
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {rider.idType}: {rider.idNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Date of Birth
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(rider.dateOfBirth).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>
              </div>

              {/* LOCATION */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h4 className="text-sm font-bold text-slate-900 uppercase mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Location
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Region
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {rider.region}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      District/Municipality
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {rider.districtMunicipality}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Residential Town
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {rider.residentialTown}
                    </p>
                  </div>
                </div>
              </div>

              {/* VEHICLE */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h4 className="text-sm font-bold text-slate-900 uppercase mb-4 flex items-center gap-2">
                  <Bike className="h-4 w-4 text-green-600" />
                  Vehicle
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Category
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {rider.vehicleCategory}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Plate Number
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {rider.plateNumber.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Chassis Number
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {rider.chassisNumber.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* COMPLIANCE */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h4 className="text-sm font-bold text-slate-900 uppercase mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  Compliance
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Driver's License
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {rider.driversLicenseNumber.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      License Expiry
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {licenseExpiryDate.toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Next of Kin Name
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {rider.nextOfKinName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Next of Kin Contact
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {rider.nextOfKinContact}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSPORT PHOTO */}
            {rider.passportPhotoUrl && (
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h4 className="text-sm font-bold text-slate-900 uppercase mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  Passport Photo
                </h4>
                <div className="flex justify-center">
                  <img
                    src={rider.passportPhotoUrl}
                    alt="Passport"
                    className="h-48 w-auto rounded-lg object-cover shadow-lg border border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                onClick={() => window.print()}
                className="flex-1 bg-green-600 hover:bg-green-700 h-11 gap-2"
              >
                <Download className="h-4 w-4" />
                Download Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}