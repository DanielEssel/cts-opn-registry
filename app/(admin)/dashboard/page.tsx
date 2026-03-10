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
  residentialTown?: string;
  districtMunicipality?: string;
  createdAt?: any;
  createdBy?: string;
  RIN?: string;
}

interface ActivityLog {
  id: string;
  target: string;
  action: string;
  admin: string;
  time: string;
  status?: string;
  RIN?: string;
}

interface SystemAlert {
  id: string;
  type: "warning" | "info" | "critical";
  title: string;
  description: string;
  action?: string;
}

const PERMIT_FEE = 100;

export default function AdvancedDashboard() {
  const [userProfile, setUserProfile] = useState<{
    uid: string;
    role: "Super Admin" | "District Admin" | "Operator";
    entity: string;
  } | null>(null);

  const [stats, setStats] = useState({
    totalRevenue:   0,
    riderCount:     0,
    activeCount:    0,
    pendingCount:   0,
    expiringCount:  0,
    weeklyGrowth:   0,
    complianceRate: 0,
  });
  const [recentActions,  setRecentActions]  = useState<ActivityLog[]>([]);
  const [alerts,         setAlerts]         = useState<SystemAlert[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [topPerformers,  setTopPerformers]  = useState<{ name: string; count: number }[]>([]);

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { setUserProfile(null); setLoading(false); return; }
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, "admin_users", user.uid));
        if (!snap.exists()) { await auth.signOut(); setLoading(false); return; }
        const data = snap.data() as any;
        if (data?.status && data.status !== "Active") { await auth.signOut(); setLoading(false); return; }
        setUserProfile({ uid: user.uid, role: data.role, entity: data.entity ?? "" });
      } catch (e) {
        console.error("Failed to fetch user profile:", e);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userProfile) return;

    const { role, entity, uid } = userProfile;
    const ridersRef = collection(db, "riders");

    const baseQuery =
      role === "Super Admin"
        ? query(ridersRef, orderBy("createdAt", "desc"))
        : role === "District Admin"
        ? query(ridersRef, where("districtMunicipality", "==", entity), orderBy("createdAt", "desc"))
        : query(ridersRef, where("createdBy", "==", uid), orderBy("createdAt", "desc"));

    const getStats = async () => {
      try {
        const snapshot = await getDocs(baseQuery);
        const riders: Rider[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const sevenAgo = new Date(today); sevenAgo.setDate(sevenAgo.getDate() - 7);
        const inSeven  = new Date(today); inSeven.setDate(inSeven.getDate() + 7);

        let activeCount = 0, pendingCount = 0, expiringCount = 0, weeklyRegistrations = 0;

        for (const rider of riders) {
          if (rider.status === "Active")  activeCount++;
          if (rider.status === "Pending") pendingCount++;

          if (rider.expiryDate) {
            const exp = new Date(rider.expiryDate);
            if (exp > today && exp <= inSeven) expiringCount++;
          }

          if (rider.createdAt) {
            const d = rider.createdAt?.toDate?.() instanceof Date
              ? rider.createdAt.toDate() : new Date(rider.createdAt);
            if (d > sevenAgo) weeklyRegistrations++;
          }
        }

        const complianceRate = riders.length > 0
          ? Math.round(((activeCount + pendingCount) / riders.length) * 100) : 0;

        setStats({
          riderCount:     riders.length,
          totalRevenue:   activeCount * PERMIT_FEE,
          activeCount,
          pendingCount,
          expiringCount,
          weeklyGrowth:   weeklyRegistrations,
          complianceRate,
        });

        // Alerts
        const newAlerts: SystemAlert[] = [];
        if (expiringCount > 10) newAlerts.push({
          id: "expiring", type: "critical",
          title: "High Expiry Volume",
          description: `${expiringCount} permits expiring this week`,
          action: "Review List",
        });
        if ((role === "Super Admin" || role === "District Admin") && pendingCount > 5) newAlerts.push({
          id: "pending", type: "warning",
          title: "Pending Approvals",
          description: `${pendingCount} registrations awaiting approval`,
          action: "Approve Now",
        });
        if (complianceRate < 80) newAlerts.push({
          id: "compliance", type: "warning",
          title: "Low Compliance Rate",
          description: `Current rate: ${complianceRate}% (Target: 90%)`,
          action: "Improve",
        });
        if (role === "Super Admin") newAlerts.push({
          id: "sms", type: "info",
          title: "SMS Gateway Status",
          description: "Balance: GH₵ 234.50 (Sufficient)",
          action: "Manage",
        });
        setAlerts(newAlerts);

        // ── Top locations — role-aware field ─────────────────────────────
        // Super Admin   → group by districtMunicipality  (shows "Top Districts")
        // District Admin → group by residentialTown       (shows "Top Towns")
        // Operator       → group by residentialTown       (shows "Top Locations")
        const counts: Record<string, number> = {};
        for (const rider of riders) {
          const key =
            role === "Super Admin"
              ? (rider.districtMunicipality ?? "Unknown")
              : (rider.residentialTown ?? rider.town ?? "Unknown");
          counts[key] = (counts[key] || 0) + 1;
        }
        setTopPerformers(
          Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))
        );
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    // Real-time recent activity
    const activityQuery =
      role === "Super Admin"
        ? query(ridersRef, orderBy("createdAt", "desc"), limit(8))
        : role === "District Admin"
        ? query(ridersRef, where("districtMunicipality", "==", entity), orderBy("createdAt", "desc"), limit(8))
        : query(ridersRef, where("createdBy", "==", uid), orderBy("createdAt", "desc"), limit(8));

    const unsubscribe = onSnapshot(
      activityQuery,
      (snapshot) => {
        setRecentActions(snapshot.docs.map((d) => {
          const data = d.data() as Rider;
          return {
            id:     d.id,
            target: d.id,
            action: "New Registration",
            admin:  data.fullName || "Unknown Rider",
            time:   data.createdAt?.toDate?.().toLocaleTimeString("en-US", {
              hour: "2-digit", minute: "2-digit",
            }) || "Just now",
            status: data.status || "Pending",
            RIN:    data.RIN,
          };
        }));
        setLoading(false);
      },
      (error) => { console.error("Activity Listener Error:", error); setLoading(false); }
    );

    getStats();
    return () => unsubscribe();
  }, [userProfile]);

  // ── Derived labels ────────────────────────────────────────────────────────

  // Card title changes per role
  const topLocationsLabel =
    userProfile?.role === "Super Admin"   ? "Top Districts" :
    userProfile?.role === "District Admin" ? "Top Towns"    : "Top Locations";

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getAlertColor = (type: string) =>
    type === "critical" ? "border-red-200 bg-red-50/50"
    : type === "warning"  ? "border-yellow-200 bg-yellow-50/50"
    :                       "border-blue-200 bg-blue-50/50";

  const getAlertIcon = (type: string) =>
    type === "critical" ? <AlertTriangle className="h-5 w-5 text-red-600" />
    : type === "warning"  ? <AlertCircle  className="h-5 w-5 text-yellow-600" />
    :                       <Zap          className="h-5 w-5 text-blue-600" />;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-slate-500 font-medium">Loading dashboard...</p>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Total Revenue</p>
                <h3 className="text-3xl font-black mt-2">GH₵ {stats.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-blue-500/40 rounded-lg"><ArrowUpRight className="h-5 w-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-xs font-bold uppercase tracking-widest">Total Riders</p>
                <h3 className="text-3xl font-black mt-2">{stats.riderCount}</h3>
              </div>
              <div className="p-2 bg-purple-500/40 rounded-lg"><Users className="h-5 w-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-xs font-bold uppercase tracking-widest">Active</p>
                <h3 className="text-3xl font-black mt-2">{stats.activeCount}</h3>
              </div>
              <div className="p-2 bg-green-500/40 rounded-lg"><CheckCircle2 className="h-5 w-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-100 text-xs font-bold uppercase tracking-widest">Expiring Soon</p>
                <h3 className="text-3xl font-black mt-2">{stats.expiringCount}</h3>
              </div>
              <div className="p-2 bg-red-500/40 rounded-lg"><Clock className="h-5 w-5" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Compliance */}
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
                <span className="font-semibold text-slate-900">{stats.complianceRate}%</span>
                <Badge className={stats.complianceRate >= 80
                  ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                  {stats.complianceRate >= 80 ? "On Target" : "Below Target"}
                </Badge>
              </div>
              <Progress value={stats.complianceRate} className="h-3" />
              <p className="text-xs text-slate-500 mt-2">Target: 90%</p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly growth */}
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
                <p className="text-3xl font-black text-blue-600">{stats.weeklyGrowth}</p>
                <p className="text-xs text-slate-500 mt-1">New registrations this week</p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">+12% from last week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top locations — title & data both role-aware */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              {topLocationsLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.slice(0, 4).length > 0 ? (
                topPerformers.slice(0, 4).map((p, idx) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="font-bold text-lg text-slate-400">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                      <Progress
                        value={stats.riderCount > 0 ? (p.count / topPerformers[0].count) * 100 : 0}
                        className="h-2 mt-1"
                      />
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 font-bold">{p.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Recent activity */}
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
                {recentActions.length > 0 ? recentActions.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className="mt-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.admin}</p>
                      <p className="text-xs text-slate-500">{item.action}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {item.RIN && (
                          <Badge variant="secondary" className="text-[10px] font-mono font-bold">
                            {item.RIN}
                          </Badge>
                        )}
                        <Badge className={
                          item.status === "Active"  ? "bg-green-100 text-green-700" :
                          item.status === "Pending" ? "bg-blue-100 text-blue-700"  :
                                                      "bg-slate-100 text-slate-600"
                        }>
                          {item.status}
                        </Badge>
                        <span className="text-xs text-slate-400">{item.time}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 text-center py-8">No recent activity</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Operational Alerts
              {alerts.length > 0 && (
                <span className="ml-auto text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {alerts.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.length > 0 ? alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-xl border flex justify-between items-start ${getAlertColor(alert.type)}`}>
                  <div className="flex gap-3 flex-1">
                    <div className="mt-0.5 shrink-0">{getAlertIcon(alert.type)}</div>
                    <div>
                      <p className="font-semibold text-slate-900">{alert.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{alert.description}</p>
                    </div>
                  </div>
                  {alert.action && (
                    <Button size="sm" variant="outline" className="ml-4 font-bold rounded-lg shrink-0">
                      {alert.action}
                    </Button>
                  )}
                </div>
              )) : (
                <div className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium">All Systems Normal</p>
                  <p className="text-xs text-slate-400 mt-1">No alerts at this time</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}