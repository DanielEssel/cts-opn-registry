"use client";
import { Loader2 } from "lucide-react";
import { useAdminProfile } from "@/app/hooks/useAdminProfile";
import { useUsers } from "@/app/hooks/useUsers";
import { SummaryCards } from "@/components/admin/SummaryCards";
import { UsersTable } from "@/components/admin/UsersTable";
import { AddUserSheet } from "@/components/admin/AddUserSheet";

export default function UserManagement() {
  const { profile, loading, error } = useAdminProfile();
  const { users, usersLoading } = useUsers(profile);

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-sm text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  if (loading || usersLoading || !profile) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">
            Syncing security profile…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            User Management
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">
            {profile.role === "Super Admin"
              ? "Provision and monitor all administrative access."
              : `Managing access for ${profile.entity ?? "your district"}.`}
          </p>
        </div>

        {/* Only Super Admin can create new users */}
        {profile.role === "Super Admin" && (
          <AddUserSheet adminProfile={profile} />
        )}
      </div>

      <SummaryCards users={users} adminProfile={profile} />

      <UsersTable users={users} adminProfile={profile} />
    </div>
  );
}