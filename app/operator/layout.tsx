"use client";

import { ReactNode } from "react";
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
      <OperatorSidebar />

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