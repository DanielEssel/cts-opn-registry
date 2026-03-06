"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeIcon,
  FileText,
  MapPin,
  Truck,
  Shield,
  BarChart3,
  ChevronDown,
  Menu,
  X,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// SIDEBAR NAVIGATION ITEMS
// ============================================================================

const REGISTRATION_STEPS = [
  {
    id: 1,
    title: "Bio Data",
    description: "Personal Information",
    icon: FileText,
    href: "/operator/register?step=1",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: 2,
    title: "Location",
    description: "Residential Details",
    icon: MapPin,
    href: "/operator/register?step=2",
    color: "bg-purple-100 text-purple-700",
  },
  {
    id: 3,
    title: "Vehicle",
    description: "Vehicle Information",
    icon: Truck,
    href: "/operator/register?step=3",
    color: "bg-orange-100 text-orange-700",
  },
  {
    id: 4,
    title: "Compliance",
    description: "Documents & License",
    icon: Shield,
    href: "/operator/register?step=4",
    color: "bg-green-100 text-green-700",
  },
];

const MAIN_MENU = [
  {
    title: "Registration Form",
    icon: Home,
    href: "/operator/register",
  },
  {
    title: "Daily Report",
    icon: BarChart3,
    href: "/operator/daily-report",
  },
];

// ============================================================================
// OPERATOR SIDEBAR COMPONENT
// ============================================================================

export function OperatorSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);

  const isRegistrationPath = pathname?.includes("/register");

  const isLinkActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href);
  };

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* SIDEBAR */}
      <aside
        className={`${
          isOpen ? "w-64" : "w-0 lg:w-64"
        } border-r border-slate-200 bg-white transition-all duration-300 overflow-hidden flex flex-col h-screen lg:relative fixed lg:sticky top-0 z-40`}
      >
        {/* LOGO SECTION */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
              <BadgeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">RIN Registry</h2>
              <p className="text-xs text-slate-500">Operator Portal</p>
            </div>
          </div>
        </div>

        {/* MAIN MENU */}
        <div className="px-4 py-6 border-b border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Menu
          </p>
          <nav className="space-y-2">
            {MAIN_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = isLinkActive(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 ${
                      isActive
                        ? "bg-green-50 text-green-700 hover:bg-green-50"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold">{item.title}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* REGISTRATION STEPS */}
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="mb-4">
            <button
              onClick={() => setIsRegistrationOpen(!isRegistrationOpen)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 hover:text-slate-700 transition-colors"
            >
              <span>Registration Steps</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isRegistrationOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>

            {isRegistrationOpen && (
              <nav className="space-y-2">
                {REGISTRATION_STEPS.map((step) => {
                  const Icon = step.icon;
                  const isActive =
                    isRegistrationPath && pathname?.includes(`step=${step.id}`);

                  return (
                    <Link key={step.id} href={step.href}>
                      <button
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          isActive
                            ? `${step.color} border-2 border-current shadow-md`
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{step.title}</p>
                            <p className="text-xs opacity-75">
                              {step.description}
                            </p>
                          </div>
                          <span className="flex-shrink-0 text-xs font-bold opacity-50">
                            {step.id}
                          </span>
                        </div>
                      </button>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            v2.0 • RIN Registry System
          </p>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
        />
      )}
    </>
  );
}