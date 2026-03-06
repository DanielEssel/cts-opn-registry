import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Download, UserPlus, Loader2 } from "lucide-react";
import NewRiderForm from "@/components/admin/NewRiderForm";

interface HeaderProps {
  profileLoading: boolean;
  userRole?: string;
  userEntity?: string;
  ridersCount: number;
  loading: boolean;
  onNewRegistration: () => void;
}

export function RegistryHeader({
  profileLoading,
  userRole,
  userEntity,
  ridersCount,
  loading,
  onNewRegistration,
}: HeaderProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

      <div className="flex gap-2">
        {userRole !== "Operator" && (
          <Button
            variant="outline"
            className="border-slate-200 shadow-sm bg-white"
          >
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
        )}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 shadow-lg shadow-blue-100">
              <UserPlus className="mr-2 h-4 w-4" /> New Registration
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold">
                Register New Rider
              </SheetTitle>
              <SheetDescription>
                This will generate a unique RIN in the national registry.
              </SheetDescription>
            </SheetHeader>
            <NewRiderForm onSuccess={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

import React from "react";