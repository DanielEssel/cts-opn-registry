"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Download, UserPlus, Loader2, ClipboardList } from "lucide-react";
import { RegistrationForm } from "@/components/shared/RegistrationForm";

interface HeaderProps {
  profileLoading: boolean;
  userRole?: string;
  userEntity?: string;
  ridersCount: number;
  loading: boolean;
  onNewRegistration?: () => void;
}

export function RegistryHeader({
  profileLoading,
  userRole,
  userEntity,
  ridersCount,
  loading,
  onNewRegistration,
}: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* ── Title block ── */}
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
        {userRole !== "Operator" && (
          <Button
            variant="outline"
            className="border-slate-200 shadow-sm bg-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        )}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="bg-green-700 hover:bg-green-800 h-11 px-6 shadow-md shadow-green-900/20">
              <UserPlus className="mr-2 h-4 w-4" />
              New Registration
            </Button>
          </SheetTrigger>

          {/* ── Sheet: xl width, subtle gray + green accent ── */}
          <SheetContent
            side="right"
            className="w-full sm:max-w-xl p-0 flex flex-col overflow-hidden"
          >
            {/* Sheet header — gray with green left border accent */}
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-5 flex items-start gap-4 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
                <ClipboardList className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-none">
                  Register New Rider
                </h2>
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

            {/* Sheet body — scrollable form */}
            <div className="flex-1 overflow-y-auto px-2 py-5 bg-white">
              <RegistrationForm />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}