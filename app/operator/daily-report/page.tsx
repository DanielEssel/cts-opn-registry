"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Download,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { getRidersByOperator, RiderRecord } from "@/lib/rider-service";
import { format } from "date-fns";

// ── Types ────────────────────────────────────────────────────────────────────

interface DailyReportStats {
  totalRegistrations: number;
  completedToday:     number;
  pendingApproval:    number;
  renewalsExpiring:   number;
}

interface RecentRegistration {
  id:          string;
  riderName:   string;
  RIN:         string;
  date:        string;
  status:      "Pending" | "Active" | "Expired" | "Suspended";
  vehicleType: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Safely convert Firestore Timestamp or string/Date to JS Date */
function toDate(value: unknown): Date {
  if (!value) return new Date(0);
  if (typeof value === "object" && "toDate" in (value as object)) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

const STATUS_CLASSES: Record<string, string> = {
  Pending:   "bg-yellow-100 text-yellow-800",
  Active:    "bg-green-100 text-green-800",
  Expired:   "bg-red-100 text-red-800",
  Suspended: "bg-slate-100 text-slate-800",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DailyReportPage() {
  const [loading,              setLoading]              = useState(true);
  const [stats,                setStats]                = useState<DailyReportStats>({
    totalRegistrations: 0,
    completedToday:     0,
    pendingApproval:    0,
    renewalsExpiring:   0,
  });
  const [recentRegistrations,  setRecentRegistrations]  = useState<RecentRegistration[]>([]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) { setLoading(false); return; }

        // Single query — all riders created by this operator
        const riders: RiderRecord[] = await getRidersByOperator(user.uid);

        const today          = new Date();
        const thirtyDaysOut  = new Date();
        thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

        // ── All stats derived from the same array — no extra Firestore calls ──
        const completedToday    = riders.filter((r) => isSameDay(toDate(r.createdAt), today)).length;
        const pendingApproval   = riders.filter((r) => r.status === "Pending").length;
        const renewalsExpiring  = riders.filter((r) => {
          if (!r.expiryDate) return false;
          const exp = new Date(r.expiryDate);
          return exp > today && exp <= thirtyDaysOut;
        }).length;

        setStats({
          totalRegistrations: riders.length,
          completedToday,
          pendingApproval,
          renewalsExpiring,
        });

        // ── Recent 10, sorted newest first ────────────────────────────────────
        const recent: RecentRegistration[] = riders
          .slice()
          .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
          .slice(0, 10)
          .map((r) => ({
            id:          r.id         ?? "",
            riderName:   r.fullName,
            RIN:         r.RIN,
            date:        format(toDate(r.createdAt), "MMM dd, yyyy hh:mm a"),
            status:      r.status,
            vehicleType: r.vehicleCategory,
          }));

        setRecentRegistrations(recent);
      } catch (err) {
        console.error("Error fetching daily report:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const headers = ["Rider Name", "RIN", "Vehicle", "Date", "Status"];
    const rows    = recentRegistrations.map((r) =>
      [r.riderName, r.RIN, r.vehicleType, r.date, r.status].join(",")
    );
    const csv  = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `operator-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto" />
          <p className="text-slate-600 font-medium">Loading your report...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const STAT_CARDS = [
    {
      label:   "Total Registrations",
      value:   stats.totalRegistrations,
      sub:     "All-time total",
      icon:    <Users className="h-5 w-5 text-blue-600" />,
      bg:      "bg-blue-100",
      trend:   <TrendingUp className="h-3 w-3 text-green-600" />,
    },
    {
      label:   "Completed Today",
      value:   stats.completedToday,
      sub:     format(new Date(), "EEEE, MMM d"),
      icon:    <CheckCircle2 className="h-5 w-5 text-green-600" />,
      bg:      "bg-green-100",
      trend:   <Calendar className="h-3 w-3 text-slate-400" />,
    },
    {
      label:   "Pending Approval",
      value:   stats.pendingApproval,
      sub:     "Awaiting admin review",
      icon:    <AlertCircle className="h-5 w-5 text-yellow-600" />,
      bg:      "bg-yellow-100",
      trend:   null,
    },
    {
      label:   "Renewals Expiring",
      value:   stats.renewalsExpiring,
      sub:     "Within 30 days",
      icon:    <BarChart3 className="h-5 w-5 text-red-600" />,
      bg:      "bg-red-100",
      trend:   null,
    },
  ];

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Daily Report</h1>
          <p className="text-slate-500 mt-1">
            {format(new Date(), "EEEE, MMMM dd, yyyy")} · Your registrations
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button
            onClick={handleExport}
            disabled={recentRegistrations.length === 0}
            className="bg-green-700 hover:bg-green-800 gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CARDS.map((card) => (
          <Card key={card.label} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-600">
                  {card.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bg}`}>{card.icon}</div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                {card.trend}
                {card.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Recent registrations ── */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Recent Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRegistrations.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold">No registrations yet</p>
              <p className="text-sm mt-1">
                Start registering riders to see them here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-700">
                    {["Rider Name", "RIN", "Vehicle", "Date & Time", "Status", ""].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRegistrations.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4 font-semibold text-slate-900">{r.riderName}</td>
                      <td className="py-4 px-4 font-mono text-slate-700">{r.RIN}</td>
                      <td className="py-4 px-4 text-slate-600">{r.vehicleType}</td>
                      <td className="py-4 px-4 text-slate-500">{r.date}</td>
                      <td className="py-4 px-4">
                        <Badge className={`text-xs font-semibold ${STATUS_CLASSES[r.status] ?? STATUS_CLASSES.Suspended}`}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-700 hover:text-green-800 hover:bg-green-50"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Chart placeholder ── */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Registration Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold">Chart coming soon</p>
              <p className="text-xs text-slate-400 mt-1">
                Daily registration trends will appear here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}