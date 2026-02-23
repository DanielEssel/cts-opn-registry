"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Clock,
  Users,
  Zap,
  MapPin,
  Bike,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Rider {
  id: string;
  fullName?: string;
  status?: string;
  expiryDate?: string;
  vehicleCategory?: string;
  town?: string;
  createdAt?: any;
}

interface ActivityLog {
  id: string;
  target: string;
  action: string;
  admin: string;
  time: string;
  status?: string;
}

interface SystemAlert {
  id: string;
  type: "warning" | "info" | "critical";
  title: string;
  description: string;
  action?: string;
}

export default function AdvancedDashboard() {
 const [userProfile, setUserProfile] = useState<{
  uid: string;
  role: "Super Admin" | "District Admin" | "Operator";
  entity: string;
} | null>(null);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    riderCount: 0,
    activeCount: 0,
    pendingCount: 0,
    expiringCount: 0,
    weeklyGrowth: 0,
    complianceRate: 0,
  });
  const [recentActions, setRecentActions] = useState<ActivityLog[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topPerformers, setTopPerformers] = useState<
    { name: string; count: number }[]
  >([]);

 

  const PERMIT_FEE = 100;

  // 1) FETCH USER PROFILE (role + entity + uid)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const docRef = doc(db, "admin_users", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          // Fail closed (recommended). If you want fail-open, keep your fallback.
          setUserProfile(null);
          setError?.(
            "User profile not found. Please contact the Boss (Super Admin).",
          );
          await auth.signOut();
          setLoading(false);
          return;
        }

        const data = docSnap.data() as any;

        // Optional: block inactive accounts
        if (data?.status && data.status !== "Active") {
          setUserProfile(null);
          setError?.(
            "Account is not active. Please contact the Boss (Super Admin).",
          );
          await auth.signOut();
          setLoading(false);
          return;
        }

        setUserProfile({
          uid: user.uid,
          role: data.role,
          entity: data.entity,
        });
      } catch (e) {
        console.error("Failed to fetch user profile:", e);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2) FETCH STATS + RECENT ACTIONS (role-aware)
  useEffect(() => {
    if (!userProfile) return;

    const { role, entity, uid } = userProfile;
    const ridersRef = collection(db, "riders");

    // Role-aware base query:
    // - Super Admin: all riders
    // - District Admin: riders in their district (districtMunicipality == entity)
    // - Operator: only riders they created (createdBy == uid)
    const baseQuery =
      role === "Super Admin"
        ? query(ridersRef, orderBy("createdAt", "desc"))
        : role === "District Admin"
          ? query(
              ridersRef,
              where("districtMunicipality", "==", entity),
              orderBy("createdAt", "desc"),
            )
          : query(
              ridersRef,
              where("createdBy", "==", uid),
              orderBy("createdAt", "desc"),
            );

    const getStats = async () => {
      try {
        const snapshot = await getDocs(baseQuery);

        const riders: Rider[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const inSevenDays = new Date(today);
        inSevenDays.setDate(inSevenDays.getDate() + 7);

        let activeCount = 0;
        let pendingCount = 0;
        let expiringCount = 0;
        let weeklyRegistrations = 0;

        for (const rider of riders) {
          if (rider.status === "Active") activeCount++;
          if (rider.status === "Pending") pendingCount++;

          if (rider.expiryDate) {
            const expiry = new Date(rider.expiryDate);
            if (expiry > today && expiry <= inSevenDays) expiringCount++;
          }

          if (rider.createdAt) {
            const createdDate =
              rider.createdAt?.toDate?.() instanceof Date
                ? rider.createdAt.toDate()
                : new Date(rider.createdAt);

            if (createdDate > sevenDaysAgo) weeklyRegistrations++;
          }
        }

        const complianceRate =
          riders.length > 0
            ? Math.round(((activeCount + pendingCount) / riders.length) * 100)
            : 0;

        setStats({
          riderCount: riders.length,
          totalRevenue: activeCount * PERMIT_FEE,
          activeCount,
          pendingCount,
          expiringCount,
          weeklyGrowth: weeklyRegistrations,
          complianceRate,
        });

        // Alerts (role-aware)
        const newAlerts: SystemAlert[] = [];

        if (expiringCount > 10) {
          newAlerts.push({
            id: "expiring",
            type: "critical",
            title: "High Expiry Volume",
            description: `${expiringCount} permits expiring this week`,
            action: "Review List",
          });
        }

        // Operators typically shouldn’t see “pending approvals” alerts (they can’t approve)
        const canApprove = role === "Super Admin" || role === "District Admin";
        if (canApprove && pendingCount > 5) {
          newAlerts.push({
            id: "pending",
            type: "warning",
            title: "Pending Approvals",
            description: `${pendingCount} registrations awaiting approval`,
            action: "Approve Now",
          });
        }

        if (complianceRate < 80) {
          newAlerts.push({
            id: "compliance",
            type: "warning",
            title: "Low Compliance Rate",
            description: `Current rate: ${complianceRate}% (Target: 90%)`,
            action: "Improve",
          });
        }

        // Super Admin-only informational alerts
        if (role === "Super Admin") {
          newAlerts.push({
            id: "sms",
            type: "info",
            title: "SMS Gateway Status",
            description: "Balance: GH₵ 234.50 (Sufficient)",
            action: "Manage",
          });
        }

        setAlerts(newAlerts);

        // Top performers:
        // - Super Admin: top districts (districtMunicipality)
        // - District Admin / Operator: top towns (residentialTown/town)
        const counts: Record<string, number> = {};
        for (const rider of riders) {
          const key =
            role === "Super Admin"
              ? ((rider as any).districtMunicipality ?? "Unknown")
              : (rider.town ?? "Unknown");

          counts[key] = (counts[key] || 0) + 1;
        }

        const top = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        setTopPerformers(top);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    // Recent activity listener (same scope as baseQuery, but limited)
    const activityQuery =
      role === "Super Admin"
        ? query(ridersRef, orderBy("createdAt", "desc"), limit(8))
        : role === "District Admin"
          ? query(
              ridersRef,
              where("districtMunicipality", "==", entity),
              orderBy("createdAt", "desc"),
              limit(8),
            )
          : query(
              ridersRef,
              where("createdBy", "==", uid),
              orderBy("createdAt", "desc"),
              limit(8),
            );

    const unsubscribe = onSnapshot(
      activityQuery,
      (snapshot) => {
        const actions: ActivityLog[] = snapshot.docs.map((d) => {
          const data = d.data() as Rider;

          return {
            id: d.id,
            target: d.id, // use doc id, not data.id
            action: "New Registration",
            admin: data.fullName || "System",
            time:
              data.createdAt?.toDate?.().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }) || "Just now",
            status: data.status || "Pending",
          };
        });

        setRecentActions(actions);
        setLoading(false);
      },
      (error) => {
        console.error("Activity Listener Error:", error);
        setLoading(false);
      },
    );

    getStats();
    return () => unsubscribe();
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "critical":
        return "border-red-200 bg-red-50/50";
      case "warning":
        return "border-yellow-200 bg-yellow-50/50";
      default:
        return "border-blue-200 bg-blue-50/50";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Zap className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">
                  Total Revenue
                </p>
                <h3 className="text-3xl font-black mt-2">
                  GH₵ {stats.totalRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-blue-500/40 rounded-lg">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Riders */}
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-xs font-bold uppercase tracking-widest">
                  Total Riders
                </p>
                <h3 className="text-3xl font-black mt-2">{stats.riderCount}</h3>
              </div>
              <div className="p-2 bg-purple-500/40 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Permits */}
        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-xs font-bold uppercase tracking-widest">
                  Active
                </p>
                <h3 className="text-3xl font-black mt-2">
                  {stats.activeCount}
                </h3>
              </div>
              <div className="p-2 bg-green-500/40 rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-100 text-xs font-bold uppercase tracking-widest">
                  Expiring Soon
                </p>
                <h3 className="text-3xl font-black mt-2">
                  {stats.expiringCount}
                </h3>
              </div>
              <div className="p-2 bg-red-500/40 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compliance Rate */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Compliance Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-900">
                  {stats.complianceRate}%
                </span>
                <Badge
                  className={
                    stats.complianceRate >= 80
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }
                >
                  {stats.complianceRate >= 80 ? "On Target" : "Below Target"}
                </Badge>
              </div>
              <Progress value={stats.complianceRate} className="h-3" />
              <p className="text-xs text-slate-500 mt-2">Target: 90%</p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Growth */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Weekly Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-3xl font-black text-blue-600">
                  {stats.weeklyGrowth}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  New registrations this week
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">
                  +12% from last week
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performer Districts */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Top Districts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.slice(0, 3).map((performer, idx) => (
                <div key={performer.name} className="flex items-center gap-3">
                  <span className="font-bold text-lg text-slate-400">
                    #{idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {performer.name}
                    </p>
                    <Progress
                      value={(performer.count / stats.riderCount) * 100}
                      className="h-2 mt-1"
                    />
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 font-bold">
                    {performer.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-4">
                {recentActions.length > 0 ? (
                  recentActions.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="mt-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {item.admin}
                        </p>
                        <p className="text-xs text-slate-500">{item.action}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono font-bold"
                          >
                            {item.target.slice(0, 8)}...
                          </Badge>
                          <Badge
                            className={
                              item.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {item.status}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">
                    No recent activity
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Operational Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex justify-between items-start ${getAlertColor(
                      alert.type,
                    )}`}
                  >
                    <div className="flex gap-3 flex-1">
                      <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {alert.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                    {alert.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-4 font-bold rounded-lg"
                      >
                        {alert.action}
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium">
                    All Systems Normal
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    No alerts at this time
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
