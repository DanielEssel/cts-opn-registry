"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection, onSnapshot, query,
  where, doc, getDoc, orderBy,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Download, Loader2, MapPin, AlertTriangle,
  CheckCircle2, Clock, Users, Bike,
  TrendingUp, Activity, RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type Role = "Super Admin" | "District Admin" | "Operator";

interface Rider {
  id: string;
  fullName?: string;
  RIN: string;
  phoneNumber?: string;
  districtMunicipality?: string;
  residentialTown?: string;
  status: "Active" | "Pending" | "Expired" | "Suspended";
  vehicleCategory?: string;
  expiryDate?: string;
  issueDate?: string;
  createdAt?: any;
}

interface AnalyticsData {
  statusCounts:      { Active: number; Pending: number; Expired: number; Suspended: number; total: number };
  locationData:      Record<string, number>;
  vehicleData:       Record<string, number>;
  expiringToday:     number;
  expiringIn30:      number;
  avgPermitAgeDays:  number;
  trend:             { date: string; label: string; count: number }[];
}

const VEHICLE_COLORS: Record<string, string> = {
  Motorbike:   "#16a34a",
  Tricycle:    "#2563eb",
  Pragya:      "#d97706",
  Quadricycle: "#7c3aed",
  Unknown:     "#94a3b8",
};

export default function AnalyticsPage() {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<{ uid: string; role: Role; entity: string } | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [riders,      setRiders]      = useState<Rider[]>([]);
  const [analytics,   setAnalytics]   = useState<AnalyticsData>({
    statusCounts:     { Active: 0, Pending: 0, Expired: 0, Suspended: 0, total: 0 },
    locationData:     {},
    vehicleData:      {},
    expiringToday:    0,
    expiringIn30:     0,
    avgPermitAgeDays: 0,
    trend:            [],
  });

  // ── Auth ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) { router.replace("/login"); return; }
        const snap = await getDoc(doc(db, "admin_users", user.uid));
        if (!snap.exists()) { await auth.signOut(); router.replace("/login"); return; }
        const p = snap.data() as any;
        if (p?.status && p.status !== "Active") { await auth.signOut(); router.replace("/login"); return; }
        setUserProfile({ uid: user.uid, role: p.role, entity: p.entity ?? "" });
      } catch { router.replace("/login"); }
    });
    return () => unsub();
  }, [router]);

  // ── Data ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userProfile) return;
    setLoading(true);

    const ref = collection(db, "riders");
    const q   = userProfile.role === "Super Admin"
      ? query(ref, orderBy("createdAt", "desc"))
      : query(ref, where("districtMunicipality", "==", userProfile.entity), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const riderList: Rider[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      const statusCounts = { Active: 0, Pending: 0, Expired: 0, Suspended: 0, total: 0 };
      const locationData: Record<string, number> = {};
      const vehicleData:  Record<string, number> = {};
      const byDate:       Record<string, number> = {};
      let totalAge = 0, expiringToday = 0, expiringIn30 = 0;

      const now   = new Date();
      const today = new Date(now); today.setHours(0, 0, 0, 0);
      const in30  = new Date(today); in30.setDate(in30.getDate() + 30);

      riderList.forEach((r) => {
        const s = r.status || "Pending";
        if (s in statusCounts) statusCounts[s as keyof typeof statusCounts]++;
        statusCounts.total++;

        const loc = userProfile.role === "Super Admin"
          ? (r.districtMunicipality || "Unknown")
          : (r.residentialTown || "Unknown");
        locationData[loc] = (locationData[loc] || 0) + 1;

        const v = r.vehicleCategory || "Unknown";
        vehicleData[v] = (vehicleData[v] || 0) + 1;

        if (r.expiryDate) {
          const exp = new Date(r.expiryDate); exp.setHours(0, 0, 0, 0);
          if (exp.getTime() === today.getTime()) expiringToday++;
          if (exp > today && exp <= in30) expiringIn30++;
        }

        if (r.issueDate) {
          const age = Math.floor((today.getTime() - new Date(r.issueDate).getTime()) / 86400000);
          totalAge += Math.max(0, age);
        }

        if (r.createdAt) {
          const d = r.createdAt?.toDate?.() instanceof Date ? r.createdAt.toDate() : new Date(r.createdAt);
          const key = d.toISOString().split("T")[0];
          byDate[key] = (byDate[key] || 0) + 1;
        }
      });

      const trend = Object.entries(byDate)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .slice(-7)
        .map(([date, count]) => ({
          date,
          label: format(new Date(date), "dd MMM"),
          count,
        }));

      setRiders(riderList);
      setAnalytics({
        statusCounts,
        locationData,
        vehicleData,
        expiringToday,
        expiringIn30,
        avgPermitAgeDays: riderList.length > 0 ? Math.round(totalAge / riderList.length) : 0,
        trend,
      });
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });

    return () => unsub();
  }, [userProfile]);

  // ── Export — matches displayed analytics ─────────────────────────────────

  const handleExport = () => {
    const scope  = userProfile?.entity || "System";
    const today  = format(new Date(), "yyyy-MM-dd");
    const pct    = (n: number) => analytics.statusCounts.total > 0
      ? `${Math.round((n / analytics.statusCounts.total) * 100)}%` : "0%";

    const sections: string[] = [];

    // Summary
    sections.push("ANALYTICS REPORT");
    sections.push(`Scope: ${userProfile?.role === "Super Admin" ? "National (All Districts)" : scope}`);
    sections.push(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`);
    sections.push("");

    // Status breakdown
    sections.push("STATUS BREAKDOWN");
    sections.push(["Status","Count","Percentage"].join(","));
    sections.push(`Active,${analytics.statusCounts.Active},${pct(analytics.statusCounts.Active)}`);
    sections.push(`Pending,${analytics.statusCounts.Pending},${pct(analytics.statusCounts.Pending)}`);
    sections.push(`Expired,${analytics.statusCounts.Expired},${pct(analytics.statusCounts.Expired)}`);
    sections.push(`Suspended,${analytics.statusCounts.Suspended},${pct(analytics.statusCounts.Suspended)}`);
    sections.push(`TOTAL,${analytics.statusCounts.total},100%`);
    sections.push("");

    // Vehicle breakdown
    sections.push("VEHICLE TYPE BREAKDOWN");
    sections.push(["Vehicle Type","Count","Percentage"].join(","));
    Object.entries(analytics.vehicleData)
      .sort(([,a],[,b]) => b - a)
      .forEach(([v, c]) => sections.push(`${v},${c},${pct(c)}`));
    sections.push("");

    // Location breakdown
    sections.push(userProfile?.role === "Super Admin" ? "DISTRICT BREAKDOWN" : "LOCATION BREAKDOWN");
    sections.push(["Location","Count"].join(","));
    Object.entries(analytics.locationData)
      .sort(([,a],[,b]) => b - a)
      .forEach(([l, c]) => sections.push(`"${l}",${c}`));
    sections.push("");

    // Trend
    sections.push("REGISTRATION TREND (LAST 7 DAYS)");
    sections.push(["Date","Registrations"].join(","));
    analytics.trend.forEach(({ date, count }) => sections.push(`${date},${count}`));
    sections.push("");

    // Key metrics
    sections.push("KEY METRICS");
    sections.push(`Expiring Today,${analytics.expiringToday}`);
    sections.push(`Expiring Within 30 Days,${analytics.expiringIn30}`);
    sections.push(`Avg Permit Age (Days),${analytics.avgPermitAgeDays}`);
    sections.push(`Active Rate,${pct(analytics.statusCounts.Active)}`);

    const blob = new Blob([sections.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url,
      download: `analytics-report-${scope.replace(/\s+/g, "-").toLowerCase()}-${today}.csv`,
    });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const pct = (n: number) => analytics.statusCounts.total > 0
    ? Math.round((n / analytics.statusCounts.total) * 100) : 0;

  const maxTrend = Math.max(...analytics.trend.map((t) => t.count), 1);

  const topLocations = Object.entries(analytics.locationData)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 6);

  const maxLocation = topLocations[0]?.[1] || 1;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-green-100" />
        <Loader2 className="w-16 h-16 animate-spin text-green-700 absolute inset-0" />
      </div>
      <p className="text-slate-500 text-sm font-semibold tracking-widest uppercase">
        {userProfile?.role === "Super Admin" ? "Aggregating national data..." : `Loading ${userProfile?.entity}...`}
      </p>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-1">
            {userProfile?.role === "Super Admin" ? "National Overview" : userProfile?.entity}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Analytics & Reports</h1>
          <p className="text-slate-500 text-sm mt-1">
            {userProfile?.role === "Super Admin"
              ? `${Object.keys(analytics.locationData).length} districts · ${analytics.statusCounts.total} total permits`
              : `${analytics.statusCounts.total} permits · live data`}
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={analytics.statusCounts.total === 0}
          className="bg-green-700 hover:bg-green-800 gap-2 h-10 shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total",          value: analytics.statusCounts.total,    icon: Users,         bg: "bg-slate-900",   text: "text-white",        sub: "All permits",           subColor: "text-slate-400"   },
          { label: "Active",         value: analytics.statusCounts.Active,   icon: CheckCircle2,  bg: "bg-green-700",   text: "text-white",        sub: `${pct(analytics.statusCounts.Active)}% of total`, subColor: "text-green-200"   },
          { label: "Pending",        value: analytics.statusCounts.Pending,  icon: Clock,         bg: "bg-white",       text: "text-blue-700",     sub: `${pct(analytics.statusCounts.Pending)}% of total`, subColor: "text-slate-400"   },
          { label: "Expired",        value: analytics.statusCounts.Expired,  icon: AlertTriangle, bg: "bg-white",       text: "text-red-600",      sub: `${pct(analytics.statusCounts.Expired)}% of total`,  subColor: "text-slate-400"   },
          { label: "Expiring Today", value: analytics.expiringToday,         icon: AlertTriangle, bg: "bg-orange-50",   text: "text-orange-700",   sub: "Need action",           subColor: "text-orange-500"  },
          { label: "Due in 30 Days", value: analytics.expiringIn30,          icon: RefreshCw,     bg: "bg-yellow-50",   text: "text-yellow-700",   sub: "Upcoming renewals",     subColor: "text-yellow-600"  },
        ].map(({ label, value, icon: Icon, bg, text, sub, subColor }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-slate-200 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${text === "text-white" ? "text-white/70" : "text-slate-500"}`}>
                {label}
              </p>
              <Icon className={`h-4 w-4 ${text === "text-white" ? "text-white/50" : "text-slate-300"}`} />
            </div>
            <p className={`text-3xl font-black ${text}`}>{value}</p>
            <p className={`text-[10px] mt-1 font-semibold ${subColor}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Status breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-green-700 rounded-full" />
            <h3 className="font-bold text-slate-900">Status Breakdown</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Active",    count: analytics.statusCounts.Active,    color: "bg-green-500",  textColor: "text-green-700" },
              { label: "Pending",   count: analytics.statusCounts.Pending,   color: "bg-blue-500",   textColor: "text-blue-700"  },
              { label: "Expired",   count: analytics.statusCounts.Expired,   color: "bg-red-500",    textColor: "text-red-700"   },
              { label: "Suspended", count: analytics.statusCounts.Suspended, color: "bg-slate-400",  textColor: "text-slate-600" },
            ].map(({ label, count, color, textColor }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${textColor}`}>{pct(count)}%</span>
                    <span className="text-sm font-black text-slate-900 w-8 text-right">{count}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${pct(count)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Donut-style summary */}
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-2xl font-black text-slate-900">{analytics.statusCounts.total}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-green-700">{pct(analytics.statusCounts.Active)}%</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Rate</p>
            </div>
          </div>
        </div>

        {/* Registration trend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-blue-600 rounded-full" />
            <h3 className="font-bold text-slate-900">Registration Trend</h3>
            <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last 7 days</span>
          </div>

          {analytics.trend.length > 0 ? (
            <div className="flex items-end gap-2 h-32">
              {analytics.trend.map(({ date, label, count }) => {
                const h = Math.max((count / maxTrend) * 100, 6);
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {count}
                    </span>
                    <div className="w-full relative">
                      <div
                        className="w-full bg-blue-600 rounded-t-md hover:bg-blue-500 transition-colors cursor-default"
                        style={{ height: `${h * 1.1}px` }}
                        title={`${label}: ${count}`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium mt-1 truncate w-full text-center">{label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
            <div>
              <p className="text-lg font-black text-slate-900">
                {analytics.trend.reduce((s, t) => s + t.count, 0)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registrations</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-slate-900">{analytics.avgPermitAgeDays}d</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Permit Age</p>
            </div>
          </div>
        </div>

        {/* Vehicle types */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-yellow-500 rounded-full" />
            <h3 className="font-bold text-slate-900">Vehicle Types</h3>
            <Bike className="ml-auto h-4 w-4 text-slate-300" />
          </div>
          <div className="space-y-3">
            {Object.entries(analytics.vehicleData)
              .sort(([,a],[,b]) => b - a)
              .map(([vehicle, count]) => {
                const color = VEHICLE_COLORS[vehicle] ?? VEHICLE_COLORS.Unknown;
                const p = analytics.statusCounts.total > 0
                  ? Math.round((count / analytics.statusCounts.total) * 100) : 0;
                return (
                  <div key={vehicle}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                        <span className="text-sm font-semibold text-slate-700">{vehicle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">{p}%</span>
                        <span className="text-sm font-black text-slate-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${p}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ── Location breakdown ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 bg-green-700 rounded-full" />
          <h3 className="font-bold text-slate-900">
            {userProfile?.role === "Super Admin" ? "District Breakdown" : "Location Breakdown"}
          </h3>
          <MapPin className="ml-auto h-4 w-4 text-slate-300" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {Object.keys(analytics.locationData).length} {userProfile?.role === "Super Admin" ? "districts" : "locations"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topLocations.map(([loc, count], i) => (
            <div key={loc} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-green-700 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{loc}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxLocation) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-700 shrink-0">{count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Key metrics strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Rate",         value: `${pct(analytics.statusCounts.Active)}%`,     icon: TrendingUp,   color: "text-green-700"  },
          { label: "Avg Permit Age",       value: `${analytics.avgPermitAgeDays} days`,          icon: Activity,     color: "text-blue-700"   },
          { label: "Expiring Today",       value: analytics.expiringToday,                       icon: AlertTriangle,color: "text-orange-600" },
          { label: "Scope",                value: userProfile?.role === "Super Admin" ? "National" : userProfile?.entity?.split(" ").slice(0,2).join(" ") || "—",
            icon: MapPin, color: "text-slate-700" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <Icon className={`h-5 w-5 ${color} shrink-0`} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className={`text-lg font-black ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}