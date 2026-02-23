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
  RefreshCw,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { useAdminProfile } from "@/app/hooks/useAdminProfile";

type AdminRole = "Super Admin" | "District Admin";

type NavItem = {
  name: string;
  href: string;
  icon: any;
  roles: AdminRole[];
};

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Super Admin", "District Admin"] },
  { name: "Register Rider", href: "/register", icon: UserPlus, roles: ["Super Admin", "District Admin"] }, // if district can register
  { name: "All Riders", href: "/rider-registry", icon: Users, roles: ["Super Admin", "District Admin"] },
  { name: "Renewals", href: "/renew-permit", icon: RefreshCw, roles: ["Super Admin", "District Admin"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["Super Admin"] },
  { name: "Audit Log", href: "/audit", icon: FileText, roles: ["Super Admin"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["Super Admin", "District Admin"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { profile, loading, error } = useAdminProfile();

  const navigation = useMemo(() => {
    if (!profile) return [];
    return NAV_ITEMS.filter((i) => i.roles.includes(profile.role));
  }, [profile]);

  const title =
    navigation.find((item) => item.href === pathname)?.name ?? "Dashboard";

  const initials = useMemo(() => {
    const name = profile?.name?.trim();
    if (!name) return "OP";
    const parts = name.split(/\s+/);
    return (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
  }, [profile]);

  const roleLabel = useMemo(() => {
    if (!profile) return "";
    if (profile.role === "Super Admin") return "Boss";
    if (profile.role === "District Admin") return `District • ${profile.entity ?? "—"}`;
    return "Operator";
  }, [profile]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

 return (
    <AuthGuard
      allowedRoles={["Super Admin", "District Admin"]}
      unauthorizedRedirectTo="/operator/register"
    >
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
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-sm">Ghana OPN</h1>
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

            {/* Role pill */}
            <div className="px-4 pt-4">
              {loading ? (
                <div className="text-xs text-gray-500 px-2">Loading profile…</div>
              ) : error ? (
                <div className="text-xs text-red-600 px-2">{error}</div>
              ) : (
                <Badge variant="outline" className="w-full justify-center">
                  {roleLabel}
                </Badge>
              )}
            </div>

            {/* Navigation */}
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
                  </Link>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-green-600 text-white font-semibold">
                    {initials.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {profile?.name ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {profile?.email ?? "—"}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:pl-72">
          <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between h-16 px-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex-1 lg:flex items-center gap-2 hidden">
                <Link href="/" className="text-gray-500 hover:text-gray-700 transition">
                  <Home className="w-4 h-4" />
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-900">{title}</span>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                {/* Optional: show entity badge for District Admin */}
                {profile?.role === "District Admin" && (
                  <Badge variant="outline" className="hidden md:flex">
                    {profile.entity ?? "—"}
                  </Badge>
                )}
              </div>
            </div>
          </header>

          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}