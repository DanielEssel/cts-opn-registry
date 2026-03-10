"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, Users, CheckCircle2,
  AlertCircle, Calendar, Download, Loader2,
  Search, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/firebase";
import { getRidersByOperator, RiderRecord } from "@/lib/rider-service";
import { format, isToday, subDays } from "date-fns";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDate(value: unknown): Date {
  if (!value) return new Date(0);
  if (typeof value === "object" && "toDate" in (value as object))
    return (value as { toDate: () => Date }).toDate();
  return new Date(value as string);
}

const STATUS_STYLES: Record<string, string> = {
  Active:    "bg-green-100 text-green-800 border-green-200",
  Pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  Expired:   "bg-red-100 text-red-700 border-red-200",
  Suspended: "bg-slate-100 text-slate-600 border-slate-200",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DailyReportPage() {
  const [loading, setLoading] = useState(true);
  const [riders,  setRiders]  = useState<RiderRecord[]>([]);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        setRiders(await getRidersByOperator(user.uid));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const today = new Date();
    const in30  = new Date(); in30.setDate(in30.getDate() + 30);
    return {
      total:    riders.length,
      today:    riders.filter((r) => isToday(toDate(r.createdAt))).length,
      pending:  riders.filter((r) => r.status === "Pending").length,
      expiring: riders.filter((r) => {
        if (!r.expiryDate) return false;
        const exp = new Date(r.expiryDate);
        return exp > today && exp <= in30;
      }).length,
    };
  }, [riders]);

  // ── 7-day trend (real data) ───────────────────────────────────────────────

  const trend = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day   = subDays(new Date(), 6 - i);
    const count = riders.filter((r) => {
      const d = toDate(r.createdAt);
      return d.getFullYear() === day.getFullYear()
          && d.getMonth()    === day.getMonth()
          && d.getDate()     === day.getDate();
    }).length;
    return { label: format(day, "EEE"), date: format(day, "MMM d"), count };
  }), [riders]);

  const maxTrend = Math.max(...trend.map((t) => t.count), 1);

  // ── Filtered table ────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return riders
      .slice()
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
      .filter((r) =>
        !q ||
        r.fullName.toLowerCase().includes(q)       ||
        r.RIN.toLowerCase().includes(q)            ||
        r.vehicleCategory.toLowerCase().includes(q)||
        r.status.toLowerCase().includes(q)
      );
  }, [riders, search]);

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const headers = ["Rider Name","RIN","Vehicle","Status","Date Registered","Expiry Date"];
    const rows = filtered.map((r) => [
      `"${r.fullName}"`,
      `"${r.RIN}"`,
      `"${r.vehicleCategory}"`,
      `"${r.status}"`,
      `"${format(toDate(r.createdAt), "dd MMM yyyy")}"`,
      `"${r.expiryDate ? format(new Date(r.expiryDate), "dd MMM yyyy") : "N/A"}"`,
    ].join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url, download: `my-report-${format(new Date(), "yyyy-MM-dd")}.csv`,
    });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-green-100" />
        <Loader2 className="w-14 h-14 animate-spin text-green-700 absolute inset-0" />
      </div>
      <p className="text-slate-500 text-sm font-semibold tracking-widest uppercase">
        Loading report...
      </p>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-1">
            Operator Report
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daily Report</h1>
          <p className="text-slate-500 text-sm mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")} · Your registrations only
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="bg-green-700 hover:bg-green-800 gap-2 h-10 shadow-sm shrink-0"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: "All-Time Total",     value: stats.total,    icon: Users,        dark: true,  accent: false },
          { label: "Registered Today",   value: stats.today,    icon: CheckCircle2, dark: false, accent: true  },
          { label: "Pending Approval",   value: stats.pending,  icon: AlertCircle,  dark: false, accent: false },
          { label: "Expiring (30 Days)", value: stats.expiring, icon: Calendar,     dark: false, accent: false },
        ] as const).map(({ label, value, icon: Icon, dark, accent }) => (
          <div key={label} className={`rounded-2xl p-4 border shadow-sm ${
            dark   ? "bg-slate-900 border-slate-800" :
            accent ? "bg-green-700 border-green-700" :
                     "bg-white border-slate-200"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                dark || accent ? "text-white/60" : "text-slate-500"
              }`}>{label}</p>
              <Icon className={`h-4 w-4 shrink-0 ${
                dark || accent ? "text-white/30" : "text-slate-300"
              }`} />
            </div>
            <p className={`text-3xl font-black ${
              dark || accent ? "text-white" : "text-slate-900"
            }`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Activity chart — real data ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 bg-green-700 rounded-full" />
          <h3 className="font-bold text-slate-900">Registration Activity</h3>
          <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Last 7 days
          </span>
        </div>

        {riders.length > 0 ? (
          <div className="flex items-end gap-2 h-28">
            {trend.map(({ label, date, count }) => {
              const h          = Math.max((count / maxTrend) * 100, 4);
              const isCurrent  = label === format(new Date(), "EEE");
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className={`text-[10px] font-black ${
                    count > 0 ? "opacity-100" : "opacity-0"
                  } ${isCurrent ? "text-green-700" : "text-slate-400"}`}>
                    {count}
                  </span>
                  <div
                    className={`w-full rounded-t-lg transition-colors cursor-default ${
                      isCurrent
                        ? "bg-green-700"
                        : "bg-slate-200 group-hover:bg-green-300"
                    }`}
                    style={{ height: `${h}%` }}
                    title={`${date}: ${count}`}
                  />
                  <span className={`text-[10px] font-bold mt-1 ${
                    isCurrent ? "text-green-700" : "text-slate-400"
                  }`}>{label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm font-semibold">No activity yet</p>
            </div>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between">
          <div>
            <p className="text-lg font-black text-slate-900">
              {trend.reduce((s, t) => s + t.count, 0)}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">This Week</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            <span className="font-semibold">{stats.today} today</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-green-700">{stats.total}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">All-Time</p>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Table toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-600 rounded-full" />
              <h3 className="font-bold text-slate-900">All Registrations</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-3">
              {filtered.length} of {riders.length} records
            </p>
          </div>

          {/* Search */}
          <div className="sm:ml-auto relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, RIN, vehicle…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table body */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            {search ? (
              <>
                <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold text-sm">No results for "{search}"</p>
                <button
                  onClick={() => setSearch("")}
                  className="mt-2 text-xs text-green-700 font-bold underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold text-sm">No registrations yet</p>
                <p className="text-xs text-slate-400 mt-1">Riders you register will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Rider", "RIN", "Vehicle", "Date Registered", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={(r as any).id ?? i} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-700 text-white text-xs font-black flex items-center justify-center shrink-0">
                          {r.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{r.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                        {r.RIN}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">{r.vehicleCategory}</td>
                    <td className="py-3.5 px-5 text-slate-500 text-xs">
                      {format(toDate(r.createdAt), "dd MMM yyyy · hh:mm a")}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge className={`text-[10px] font-bold border ${STATUS_STYLES[r.status] ?? STATUS_STYLES.Suspended}`}>
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}