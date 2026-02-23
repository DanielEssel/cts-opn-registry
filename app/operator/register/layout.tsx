"use client";

import { AuthGuard } from "@/app/components/auth-guard";
import { ReactNode } from "react";

export default function OperatorLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["Operator"]} unauthorizedRedirectTo="/dashboard">
      {children}
    </AuthGuard>
  );
}