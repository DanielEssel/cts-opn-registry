"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  FileText, MapPin, Truck, Shield,
  BarChart3, Menu, X, Home, CheckCircle2,
  LogOut, ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";

const STEPS = [
  { id: 1, title: "Bio Data",   description: "Personal info",       icon: FileText },
  { id: 2, title: "Location",   description: "Residential details", icon: MapPin   },
  { id: 3, title: "Vehicle",    description: "Vehicle information", icon: Truck    },
  { id: 4, title: "Compliance", description: "Documents & licence", icon: Shield   },
];

const NAV = [
  { title: "Register Rider", icon: Home,     href: "/operator/register"     },
  { title: "Daily Report",   icon: BarChart3, href: "/operator/daily-report" },
];

// ── Inner component — uses useSearchParams (must be inside Suspense) ──────────

function SidebarInner({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const currentStep  = parseInt(searchParams.get("step") || "1", 10);
  const onRegisterPage = pathname.includes("/register");

  useEffect(() => { setOpen(false); }, [pathname, searchParams]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.replace("/login");
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out",
        "lg:translate-x-0 lg:static lg:flex",
        open ? "translate-x-0" : "-translate-x-full"
      )}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center shrink-0 shadow-sm">
              <Image src="/logo/rinlogo2.png" alt="RIN" width={26} height={26} className="object-contain brightness-200" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 leading-none">RIN Registry</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Operator Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">

          {/* Main nav */}
          <div>
            <p className="px-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.22em] mb-2">
              Navigation
            </p>
            <div className="space-y-0.5">
              {NAV.map(({ title, icon: Icon, href }) => {
                const active = pathname === href || (href !== "/operator/register" && pathname.startsWith(href));
                return (
                  <Link key={href} href={href}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      active
                        ? "bg-green-700 text-white shadow-sm shadow-green-900/20"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}>
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400")} />
                      {title}
                      {active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-green-300" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-slate-500">System Online</span>
            <span className="ml-auto text-[10px] font-bold text-slate-400">v2.4.0</span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <LogOut className="h-4 w-4 text-slate-400 group-hover:text-red-500 transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Public export — wraps inner in Suspense ───────────────────────────────────

export function OperatorSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile FAB — outside Suspense so it always renders */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-700 text-white shadow-xl shadow-green-900/30 flex items-center justify-center transition-transform active:scale-95"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Suspense required because SidebarInner uses useSearchParams */}
      <Suspense fallback={
        <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col" />
      }>
        <SidebarInner open={open} setOpen={setOpen} />
      </Suspense>
    </>
  );
}