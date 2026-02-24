import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ShieldCheck, Users } from "lucide-react";
import type { AdminUser } from "@/app/hooks/useUsers";
import type { AdminProfile } from "@/app/hooks/useAdminProfile";

interface SummaryCardsProps {
  users: AdminUser[];
  adminProfile: AdminProfile;
}

// ── Super Admin view — system-wide counts ────────────────────────────────────
function SuperAdminCards({ users }: { users: AdminUser[] }) {
  const superCount    = users.filter((u) => u.role === "Super Admin").length;
  const districtCount = users.filter((u) => u.role === "District Admin").length;
  const operatorCount = users.filter((u) => u.role === "Operator").length;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="bg-slate-900 text-white border-none shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            CTS Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black">{superCount}</div>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
            Full system access
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            District Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-slate-900">{districtCount}</div>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
            Across all districts
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            Operators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-slate-900">{operatorCount}</div>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
            Registration only
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── District Admin view — scoped to their entity ─────────────────────────────
// useUsers already filters by entity for District Admins, so `users` here
// contains only members of their district.
function DistrictAdminCards({
  users,
  entity,
}: {
  users: AdminUser[];
  entity: string;
}) {
  const districtAdminCount = users.filter((u) => u.role === "District Admin").length;
  const operatorCount      = users.filter((u) => u.role === "Operator").length;
  const activeCount        = users.filter((u) => u.status === "Active").length;
  const total              = users.length;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="bg-slate-900 text-white border-none shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            {entity}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black">{total}</div>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
            Total accounts
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            District Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-slate-900">{districtAdminCount}</div>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
            {operatorCount} operator{operatorCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <Card className="border-green-100 bg-green-50/40 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            Active Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-green-700">{activeCount}</div>
          <p className="text-[10px] text-green-600 font-bold mt-1 uppercase tracking-tighter">
            {total - activeCount} suspended
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export function SummaryCards({ users, adminProfile }: SummaryCardsProps) {
  if (adminProfile.role === "Super Admin") {
    return <SuperAdminCards users={users} />;
  }

  return (
    <DistrictAdminCards
      users={users}
      entity={adminProfile.entity ?? "Your District"}
    />
  );
}