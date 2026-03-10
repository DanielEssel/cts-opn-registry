"use client";

import { AuthGuard } from "@/app/components/auth-guard";
import { ReactNode } from "react";

export const dynamic = "force-dynamic"; // ✅ add this

export default function OperatorLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["Operator"]} unauthorizedRedirectTo="/dashboard">
      {children}
    </AuthGuard>
  );
}