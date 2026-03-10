"use client";

import { AuthGuard } from "@/app/components/auth-guard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Home,
  Bell,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Register Rider",
    href: "/register",
    icon: UserPlus,
  },
  {
    name: "All Riders",
    href: "/rider-registry",
    icon: Users,
  },
  {
    name: "Renewals",
    href: "/renewals",
    icon: RefreshCw,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Audit Log",
    href: "/audit",
    icon: FileText,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-sm">Rider Identification Number</h1>
                  <p className="text-xs text-gray-500">Operator Portal</p>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative",
                      isActive
                        ? "bg-green-50 text-green-700 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 transition-transform group-hover:scale-110",
                        isActive ? "text-green-600" : "text-gray-400"
                      )}
                    />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600" />
                    )}
                    {/* Renewal badge */}
                    {item.name === "Renewals" && (
                      <Badge className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 animate-pulse">
                        12
                      </Badge>
                    )}
                  </Link>
                );
              })}

              <div className="pt-6 mt-6 border-t border-gray-200">
                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                    pathname === "/settings"
                      ? "bg-green-50 text-green-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Settings
                    className={cn(
                      "w-5 h-5 transition-transform group-hover:scale-110",
                      pathname === "/settings" ? "text-green-600" : "text-gray-400"
                    )}
                  />
                  <span>Settings</span>
                </Link>
              </div>
            </nav>

            {/* Help Section */}
            <div className="p-4 border-t border-gray-200">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">
                      Need Help?
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">
                      Contact support for assistance
                    </p>
                    <Button size="sm" variant="outline" className="w-full text-xs h-8">
                      Get Support
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-green-600 text-white font-semibold">
                    OP
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    Operator Name
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    operator@ghana.gov
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:pl-72">
          {/* Top Header */}
          <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between h-16 px-6">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Breadcrumb or Page Title */}
              <div className="flex-1 lg:flex items-center gap-2 hidden">
                <Link
                  href="/"
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  <Home className="w-4 h-4" />
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-900">
                  {navigation.find((item) => item.href === pathname)?.name ||
                    "Dashboard"}
                </span>
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                {/* Quick Stats Badge */}
                <Badge
                  variant="outline"
                  className="hidden md:flex gap-2 px-3 py-1.5 bg-green-50 border-green-200 text-green-700"
                >
                  <Users className="w-3 h-3" />
                  <span className="text-xs font-semibold">
                    1,234 Active Permits
                  </span>
                </Badge>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}