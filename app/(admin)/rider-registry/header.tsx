"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, UserPlus, Loader2, Table2 } from "lucide-react";

import { format } from "date-fns";

interface HeaderProps {
  profileLoading: boolean;
  userRole?: string;
  userEntity?: string;
  ridersCount: number;
  loading: boolean;
  riders?: any[]; // ← riders array for export
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function toDateStr(val: any): string {
  if (!val) return "";
  try {
    const d = typeof val?.toDate === "function" ? val.toDate() : new Date(val);
    return format(d, "dd MMM yyyy");
  } catch {
    return "";
  }
}

function exportCSV(riders: any[], entity?: string) {
  const headers = [
    "RIN",
    "Full Name",
    "Phone Number",
    "ID Type",
    "ID Number",
    "Date of Birth",
    "Gender",
    "Region",
    "District / Municipality",
    "Vehicle Category",
    "Plate Number",
    "Chassis Number",
    "Drivers License",
    "License Expiry",
    "Next of Kin",
    "Next of Kin Contact",
    "Issue Date",
    "Expiry Date",
    "Status",
    "Created At",
  ];

  const rows = riders.map((r) => [
    r.RIN ?? "",
    r.fullName ?? "",
    r.phoneNumber ?? "",
    r.idType ?? "",
    r.idNumber ?? "",
    r.dateOfBirth ?? "",
    r.gender ?? "",
    r.region ?? "",
    r.districtMunicipality ?? "",
    r.vehicleCategory ?? "",
    r.plateNumber ?? "",
    r.chassisNumber ?? "",
    r.driversLicenseNumber ?? "",
    r.licenseExpiryDate ?? "",
    r.nextOfKinName ?? "",
    r.nextOfKinContact ?? "",
    toDateStr(r.issueDate),
    toDateStr(r.expiryDate),
    r.status ?? "",
    toDateStr(r.createdAt),
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const filename = `riders-${entity ? entity.replace(/\s+/g, "-").toLowerCase() + "-" : ""}${format(new Date(), "yyyy-MM-dd")}.csv`;
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
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
}: HeaderProps) {
  const router = useRouter();

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
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* New Registration sheet */}
        <Button
          onClick={() => router.push("/register")}
          className="bg-green-700 hover:bg-green-800 h-9 px-6 shadow-md shadow-green-900/20"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Register Rider
        </Button>
      </div>
    </div>
  );
}
