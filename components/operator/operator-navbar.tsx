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
  FileText,
  BarChart3,
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
  todayRegistrations: number;
}

// OPERATOR ONLY: Register Driver + Daily Report
const navItems = [
  {
    label: "Register Driver",
    href: "/operator/register",
    icon: FileText,
    description: "Register new riders for OPN permits",
  },
  {
    label: "Daily Report",
    href: "/operator/daily-report",
    icon: BarChart3,
    description: "View today's registration activity",
  },
];

export default function OperatorNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [stats, setStats] = useState<NavStats>({
    todayRegistrations: 0,
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
            
            // Verify operator role
            if (data.role !== "Operator" && data.role !== "District Admin") {
              router.push("/login");
              return;
            }

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
  }, [router]);

  // Fetch stats with real-time listener (today's registrations only)
  useEffect(() => {
    if (!auth.currentUser || !profile) return;

    let isMounted = true;

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

        snapshot.docs.forEach((doc) => {
          const data = doc.data();

          // Count today's registrations
          if (data.createdAt) {
            const createdDate = data.createdAt.toDate?.() || new Date(data.createdAt);
            if (createdDate >= today) {
              todayCount++;
            }
          }
        });

        setStats({
          todayRegistrations: todayCount,
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
              href="/operator/register"
              className="flex items-center gap-3 flex-shrink-0 group"
            >
              <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <BadgeIcon className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-slate-900">OPN Registry</h1>
                <p className="text-xs text-slate-500 font-medium">Operator</p>
              </div>
            </Link>

            {/* CENTER - NAVIGATION ITEMS (Desktop) - Simplified */}
            <div className="hidden lg:flex items-center gap-0 flex-1 ml-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.href);

                return (
                  <Link key={item.href} href={item.href} prefetch={true}>
                    <button
                      title={item.description}
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
              {/* Info Badge - Show today's count */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-900">
                  {loading ? "..." : stats.todayRegistrations} today
                </span>
              </div>

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
                  {/* Profile Info */}
                  <div className="px-4 py-3 border-b bg-gradient-to-br from-green-50 to-emerald-50">
                    <p className="font-bold text-slate-900">
                      {profile?.fullName || "Operator"}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">{profile?.email}</p>
                    <p className="text-xs text-green-700 font-semibold mt-2 uppercase tracking-wider">
                      📍 {profile?.entity}
                    </p>
                    {profile?.phone && (
                      <p className="text-xs text-slate-600 mt-1">📱 {profile.phone}</p>
                    )}
                  </div>

                  {/* Today's Stats */}
                  <div className="px-4 py-3 border-b space-y-2">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                      Today's Summary
                    </p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Registrations:</span>
                      <Badge className="bg-blue-100 text-blue-700 font-bold">
                        {loading ? "..." : stats.todayRegistrations}
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Quick Actions */}
                  <DropdownMenuItem asChild>
                    <Link
                      href="/operator/register"
                      className="font-medium text-slate-900 cursor-pointer py-2"
                    >
                      📝 Quick Register
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/operator/daily-report"
                      className="font-medium text-slate-900 cursor-pointer py-2"
                    >
                      📊 View Report
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Logout */}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer font-bold py-2"
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
                      className={`w-full px-4 py-3 flex items-center gap-2 text-sm font-semibold rounded transition-colors ${
                        isActive
                          ? "bg-green-50 text-green-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="text-left">
                        <p>{item.label}</p>
                        <p className="text-xs text-gray-500 font-normal">{item.description}</p>
                      </div>
                    </button>
                  </Link>
                );
              })}

              {/* Mobile Stats */}
              <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded mx-2 mt-2">
                <p className="text-xs font-bold text-blue-900 uppercase mb-2">Today</p>
                <p className="text-sm text-blue-700 font-bold">
                  {loading ? "..." : stats.todayRegistrations} Registrations
                </p>
              </div>

              <DropdownMenuSeparator className="my-2" />

              {/* Mobile Logout */}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded flex items-center gap-2 text-sm font-semibold transition-colors"
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