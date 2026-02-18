"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  Bell,
  LogOut,
  Menu,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================================================
// OPERATOR HEADER COMPONENT
// ============================================================================

export function OperatorHeader() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ========================================================================
  // HANDLE LOGOUT
  // ========================================================================

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900 hidden md:block">
            Rider Registration
          </h1>
          <p className="text-sm text-slate-500 hidden md:block">
            Complete registration process for new riders
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          {/* NOTIFICATIONS */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-600 hover:text-slate-900"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          </Button>

          {/* DIVIDER */}
          <div className="h-6 w-px bg-slate-200" />

          {/* PROFILE DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                  OP
                </div>
                <span className="hidden sm:inline font-semibold">Operator</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* PROFILE HEADER */}
              <div className="px-4 py-3 border-b">
                <p className="font-semibold text-slate-900">Operator Account</p>
                <p className="text-xs text-slate-500 mt-1">
                  operator@example.com
                </p>
              </div>

              {/* MENU ITEMS */}
              <DropdownMenuItem asChild>
                <Link
                  href="/operator/profile"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>Profile Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/operator/settings"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* LOGOUT */}
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 cursor-pointer flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}