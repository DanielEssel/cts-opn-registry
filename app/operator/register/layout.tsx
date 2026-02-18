"use client";

import { ReactNode } from "react";

// ============================================================================
// REGISTRATION LAYOUT
// ============================================================================

interface RegistrationLayoutProps {
  children: ReactNode;
}

export default function RegistrationLayout({
  children,
}: RegistrationLayoutProps) {
  return <>{children}</>;
}