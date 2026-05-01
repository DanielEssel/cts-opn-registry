"use client";

import { ReactNode, Suspense } from "react";
import { OperatorSidebar } from "@/components/operator/Sidebar";
import { OperatorHeader } from "@/components/operator/Header";

// ============================================================================
// OPERATOR LAYOUT
// ============================================================================

interface OperatorLayoutProps {
  children: ReactNode;
}

export default function OperatorLayout({ children }: OperatorLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* SIDEBAR */}
      <Suspense fallback={<div className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col" />}>
        <OperatorSidebar />
      </Suspense>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <OperatorHeader />

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}