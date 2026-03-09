"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, UserPlus, Loader2, ClipboardList, FileText, Table2 } from "lucide-react";
import { RegistrationForm } from "@/components/shared/RegistrationForm";
import { format } from "date-fns";

interface HeaderProps {
  profileLoading: boolean;
  userRole?:      string;
  userEntity?:    string;
  ridersCount:    number;
  loading:        boolean;
  riders?:        any[];          // ← riders array for export
  onNewRegistration?: () => void;
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function toDateStr(val: any): string {
  if (!val) return "";
  try {
    const d = typeof val?.toDate === "function" ? val.toDate() : new Date(val);
    return format(d, "dd MMM yyyy");
  } catch { return ""; }
}

function exportCSV(riders: any[], entity?: string) {
  const headers = [
    "RIN", "Full Name", "Phone Number", "ID Type", "ID Number",
    "Date of Birth", "Gender", "Region", "District / Municipality",
    "Vehicle Category", "Plate Number", "Chassis Number",
    "Drivers License", "License Expiry",
    "Next of Kin", "Next of Kin Contact",
    "Issue Date", "Expiry Date", "Status", "Created At",
  ];

  const rows = riders.map((r) => [
    r.RIN                  ?? "",
    r.fullName             ?? "",
    r.phoneNumber          ?? "",
    r.idType               ?? "",
    r.idNumber             ?? "",
    r.dateOfBirth          ?? "",
    r.gender               ?? "",
    r.region               ?? "",
    r.districtMunicipality ?? "",
    r.vehicleCategory      ?? "",
    r.plateNumber          ?? "",
    r.chassisNumber        ?? "",
    r.driversLicenseNumber ?? "",
    r.licenseExpiryDate    ?? "",
    r.nextOfKinName        ?? "",
    r.nextOfKinContact     ?? "",
    toDateStr(r.issueDate),
    toDateStr(r.expiryDate),
    r.status               ?? "",
    toDateStr(r.createdAt),
  ]);

  const csv  = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob     = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url      = URL.createObjectURL(blob);
  const filename = `riders-${entity ? entity.replace(/\s+/g, "-").toLowerCase() + "-" : ""}${format(new Date(), "yyyy-MM-dd")}.csv`;
  const a        = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportJSON(riders: any[], entity?: string) {
  // Strip Firestore Timestamps to plain strings for JSON portability
  const clean = riders.map((r) => ({
    ...r,
    issueDate:  toDateStr(r.issueDate)  || r.issueDate,
    expiryDate: toDateStr(r.expiryDate) || r.expiryDate,
    createdAt:  toDateStr(r.createdAt)  || r.createdAt,
    updatedAt:  toDateStr(r.updatedAt)  || r.updatedAt,
  }));

  const blob     = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
  const url      = URL.createObjectURL(blob);
  const filename = `riders-${entity ? entity.replace(/\s+/g, "-").toLowerCase() + "-" : ""}${format(new Date(), "yyyy-MM-dd")}.json`;
  const a        = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegistryHeader({
  profileLoading,
  userRole,
  userEntity,
  ridersCount,
  loading,
  riders = [],
  onNewRegistration,
}: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

      {/* ── Title ── */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {profileLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                Verifying Credentials...
              </span>
            ) : userRole === "Super Admin" ? (
              "Master Registry"
            ) : (
              `${userEntity} Registry`
            )}
          </h1>
          {userRole !== "Super Admin" && (
            <Badge variant="secondary">Local Access</Badge>
          )}
        </div>
        <p className="text-slate-500 font-medium">
          {loading
            ? "Syncing database..."
            : `Managing ${ridersCount} registered riders in ${userEntity || "System"}.`}
        </p>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2">

        {/* Export — only Super Admin and District Admin */}
        {userRole !== "Operator" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-slate-200 shadow-sm bg-white"
                disabled={riders.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
                {riders.length > 0 && (
                  <span className="ml-1.5 text-[10px] text-slate-400">
                    ({riders.length})
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
              <DropdownMenuItem
                className="rounded-lg text-sm gap-2 cursor-pointer"
                onClick={() => exportCSV(riders, userEntity)}
              >
                <Table2 className="h-4 w-4 text-slate-400" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg text-sm gap-2 cursor-pointer"
                onClick={() => exportJSON(riders, userEntity)}
              >
                <FileText className="h-4 w-4 text-slate-400" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* New Registration sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="bg-green-700 hover:bg-green-800 h-11 px-6 shadow-md shadow-green-900/20">
              <UserPlus className="mr-2 h-4 w-4" />
              New Registration
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-5 flex items-start gap-4 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
                <ClipboardList className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-none">Register New Rider</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Generates a unique RIN scoped to district and vehicle type.
                </p>
                {userEntity && (
                  <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-green-700 bg-green-100 border border-green-200 rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    {userEntity}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-5 bg-white">
              <RegistrationForm />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}