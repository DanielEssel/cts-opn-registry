"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BadgeIcon,
  LogOut,
  Menu,
  X,
  RefreshCw,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OperatorProfile {
  fullName: string;
  email: string;
  entity: string;
  phone?: string;
}

interface NavStats {
  pendingRenewals: number;
  todayRegistrations: number;
  approvalsPending: number;
}

const navItems = [
  {
    label: "Register Driver",
    href: "/operator/register",
    icon: FileText,
  },
  {
    label: "Daily Report",
    href: "/operator/daily-report",
    icon: BarChart3,
  },
  {
    label: "Renewals",
    href: "/operator/renewals",
    icon: RefreshCw,
  },
  {
    label: "OPN Issuance",
    href: "/operator/opn-issuance",
    icon: CheckCircle2,
  },
  {
    label: "Approvals",
    href: "/operator/approvals",
    icon: AlertCircle,
  },
];

export default function OperatorNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [stats, setStats] = useState<NavStats>({
    pendingRenewals: 0,
    todayRegistrations: 0,
    approvalsPending: 0,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch profile once on mount
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (auth.currentUser) {
        try {
          const docRef = doc(db, "admin_users", auth.currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (isMounted && docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              fullName: data.fullName || "Operator",
              email: auth.currentUser.email || "",
              entity: data.entity || "N/A",
              phone: data.phone,
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch stats with real-time listener
  useEffect(() => {
    if (!auth.currentUser || !profile) return;

    let isMounted = true;

    // Fetch today's registrations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ridersRef = collection(db, "riders");
    
    const q = query(
      ridersRef,
      where("createdBy", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMounted) return;

        let todayCount = 0;
        let renewalCount = 0;
        let pendingCount = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();

          // Count today's registrations
          if (data.createdAt) {
            const createdDate = data.createdAt.toDate?.() || new Date(data.createdAt);
            if (createdDate >= today) {
              todayCount++;
            }
          }

          // Count pending renewals
          if (data.expiryDate && data.status === "Active") {
            const expiryDate = new Date(data.expiryDate);
            const thirtyDaysFromNow = new Date(
              today.getTime() + 30 * 24 * 60 * 60 * 1000
            );
            if (expiryDate <= thirtyDaysFromNow && expiryDate > today) {
              renewalCount++;
            }
          }

          // Count pending approvals
          if (data.status === "Pending") {
            pendingCount++;
          }
        });

        setStats({
          todayRegistrations: todayCount,
          pendingRenewals: renewalCount,
          approvalsPending: pendingCount,
        });

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching stats:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [profile]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href);
  };

  // Profile avatar with memoization to prevent re-renders
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "OP";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* LEFT - LOGO & TITLE */}
            <Link
              href="/register"
              className="flex items-center gap-3 flex-shrink-0 group"
            >
              <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <BadgeIcon className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-slate-900">OPN Registry</h1>
                <p className="text-xs text-slate-500 font-medium">Operator Portal</p>
              </div>
            </Link>

            {/* CENTER - NAVIGATION ITEMS (Desktop) */}
            <div className="hidden lg:flex items-center gap-0 flex-1 ml-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.href);

                return (
                  <Link key={item.href} href={item.href} prefetch={true}>
                    <button
                      className={`px-4 py-2 flex items-center gap-2 text-sm font-semibold border-b-2 transition-all ${
                        isActive
                          ? "border-green-600 text-green-700 bg-green-50/50"
                          : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>

            {/* RIGHT - PROFILE & ACTIONS */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block">
                <Bell className="h-5 w-5 text-slate-600" />
                {stats.approvalsPending > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 hidden sm:flex px-3 py-2 hover:bg-slate-100 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getInitials(profile?.fullName)}
                    </div>
                    <span className="text-sm font-semibold text-slate-900 hidden md:inline max-w-xs truncate">
                      {profile?.fullName || "Loading..."}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold text-slate-900">
                      {profile?.fullName || "Operator"}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">{profile?.email}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      📍 {profile?.entity}
                    </p>
                    {profile?.phone && (
                      <p className="text-xs text-slate-500 mt-1">📱 {profile.phone}</p>
                    )}
                  </div>

                  {/* Quick Stats in Dropdown */}
                  <div className="px-4 py-3 border-b space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 font-medium">
                        Today's Registrations:
                      </span>
                      <Badge className="bg-blue-100 text-blue-700 font-semibold">
                        {loading ? "..." : stats.todayRegistrations}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 font-medium">Pending Renewals:</span>
                      <Badge className="bg-orange-100 text-orange-700 font-semibold">
                        {loading ? "..." : stats.pendingRenewals}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 font-medium">Approvals Pending:</span>
                      <Badge className="bg-red-100 text-red-700 font-semibold">
                        {loading ? "..." : stats.approvalsPending}
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link
                      href="/operator/profile"
                      className="font-medium text-slate-900 cursor-pointer"
                    >
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-slate-700" />
                ) : (
                  <Menu className="h-5 w-5 text-slate-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-3 pt-3 pb-2 border-t border-slate-200 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <button
                      className={`w-full px-4 py-2 flex items-center gap-2 text-sm font-semibold rounded transition-colors ${
                        isActive
                          ? "bg-green-50 text-green-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  </Link>
                );
              })}
              <DropdownMenuSeparator className="my-2" />
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}