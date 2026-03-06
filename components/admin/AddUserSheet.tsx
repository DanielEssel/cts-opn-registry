"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Lock, Loader2, Mail, UserPlus } from "lucide-react";
import { db, auth, firebaseConfig } from "@/lib/firebase";
import { initializeApp, getApp }   from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
}                                   from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast }                    from "sonner";
import type { AdminProfile }        from "@/app/hooks/useAdminProfile";
import { DISTRICTS, ROLES }         from "@/app/(admin)/settings/constants";

interface AddUserSheetProps {
  adminProfile: AdminProfile;
}

const defaultForm = {
  name:     "",
  email:    "",
  password: "",
  entity:   "",
  role:     "Operator" as string,
};

export function AddUserSheet({ adminProfile }: AddUserSheetProps) {
  const [open,        setOpen]        = useState(false);
  const [formData,    setFormData]    = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,       setError]       = useState("");

  const isSuperAdmin = adminProfile.role === "Super Admin";

  const set = (key: keyof typeof defaultForm) => (val: string) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!formData.name.trim())     return "Full name is required.";
    if (!formData.email.trim())    return "Email is required.";
    if (formData.password.length < 6) return "Password must be at least 6 characters.";
    if (!formData.role)            return "Role is required.";

    // Entity required for District Admin and Operator
    if (
      formData.role !== "Super Admin" &&
      !formData.entity &&
      isSuperAdmin
    ) {
      return "Please select a district for this user.";
    }

    return null;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Use a secondary Firebase app so creating a new user doesn't
      // sign out the currently logged-in Super Admin.
      let secondaryApp;
      try {
        secondaryApp = getApp("AdminProvisioner");
      } catch {
        secondaryApp = initializeApp(firebaseConfig, "AdminProvisioner");
      }
      const secondaryAuth = getAuth(secondaryApp);

      // 1. Create Firebase Auth account
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email.trim(),
        formData.password
      );
      const newUid = credential.user.uid;

      // 2. Write Firestore profile
      const effectiveEntity = isSuperAdmin
        ? formData.entity
        : (adminProfile.entity ?? "");

      await setDoc(doc(db, "admin_users", newUid), {
        uid:       newUid,
        name:      formData.name.trim(),
        email:     formData.email.trim().toLowerCase(),
        role:      formData.role,
        entity:    effectiveEntity,
        status:    "Active",
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid ?? "system",
      });

      // 3. Sign out the secondary auth instance
      await signOut(secondaryAuth);

      toast.success(`${formData.name} has been provisioned successfully.`);
      setFormData(defaultForm);
      setOpen(false);
    } catch (err: any) {
      console.error("Provisioning error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "permission-denied") {
        setError("You do not have permission to create users.");
      } else {
        setError(err.message ?? "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-slate-900 hover:bg-black h-11 px-6 rounded-xl shadow-lg">
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[480px] px-5 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-black">
            New Access Profile
          </SheetTitle>
          <SheetDescription>
            Provision a new user account. They can log in immediately after creation.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">
              Full Name
            </label>
            <Input
              placeholder="Enter official name"
              value={formData.name}
              onChange={(e) => set("name")(e.target.value)}
              required
              className="h-10"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">
              Official Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                placeholder="user@mmdce.gov.gh"
                className="pl-9 h-10"
                value={formData.email}
                onChange={(e) => set("email")(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">
              Temporary Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="password"
                placeholder="Min. 6 characters"
                className="pl-9 h-10"
                value={formData.password}
                onChange={(e) => set("password")(e.target.value)}
                required
              />
            </div>
            <p className="text-[11px] text-slate-400">
              User should change this after first login.
            </p>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">
              Role
            </label>
            <Select value={formData.role} onValueChange={set("role")}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isSuperAdmin && (
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                )}
                <SelectItem value="District Admin">District Admin</SelectItem>
                <SelectItem value="Operator">Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entity — dropdown for Super Admin, locked for District Admin */}
          {isSuperAdmin ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">
                District / Entity
              </label>
              <Select value={formData.entity} onValueChange={set("entity")}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a district" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.role === "Super Admin" && (
                <p className="text-[11px] text-amber-600">
                  Super Admins have system-wide access regardless of district.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">
                Entity (Your District)
              </label>
              <Input
                value={adminProfile.entity ?? ""}
                disabled
                className="h-10 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400">
                New users will be scoped to your district.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-600">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold text-base rounded-xl"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Authorize & Create User"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}