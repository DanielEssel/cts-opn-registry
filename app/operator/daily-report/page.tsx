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
import { getRidersByOperator, getRidersByStatus, RiderRecord } from "@/lib/rider-service";
import { format } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================

interface DailyReportStats {
  totalRegistrations: number;
  completedToday: number;
  pendingApproval: number;
  renewalsExpiring: number;
}

interface RecentRegistration {
  id: string;
  riderName: string;
  opn: string;
  date: string;
  status: "Pending" | "Active" | "Expired" | "Suspended";
  vehicleType: string;
}

// ============================================================================
// DAILY REPORT PAGE
// ============================================================================

export default function DailyReportPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DailyReportStats>({
    totalRegistrations: 0,
    completedToday: 0,
    pendingApproval: 0,
    renewalsExpiring: 0,
  });
  const [recentRegistrations, setRecentRegistrations] = useState<
    RecentRegistration[]
  >([]);

  // ========================================================================
  // FETCH DATA
  // ========================================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("No authenticated user");
          setLoading(false);
          return;
        }

        // Fetch all riders registered by this operator
        const allRiders = await getRidersByOperator(user.uid);

        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedToday = allRiders.filter((rider: RiderRecord) => {
          if (!rider.createdAt) return false;
          const createdDate =
            typeof rider.createdAt === "object" && "toDate" in rider.createdAt
              ? (rider.createdAt as any).toDate()
              : new Date(rider.createdAt);
          createdDate.setHours(0, 0, 0, 0);
          return createdDate.getTime() === today.getTime();
        }).length;

        // Get pending riders
        const pendingRiders = await getRidersByStatus("Pending");
        const operatorPendingRiders = pendingRiders.filter(
          (rider: RiderRecord) => rider.createdBy === user.uid
        );

        // Calculate expiring renewals (within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const renewalsExpiring = allRiders.filter((rider: RiderRecord) => {
          if (!rider.expiryDate) return false;
          const expiryDate = new Date(rider.expiryDate);
          return expiryDate > new Date() && expiryDate <= thirtyDaysFromNow;
        }).length;

        setStats({
          totalRegistrations: allRiders.length,
          completedToday,
          pendingApproval: operatorPendingRiders.length,
          renewalsExpiring,
        });

        // Get recent registrations (last 10)
        const recent = allRiders
          .sort((a: RiderRecord, b: RiderRecord) => {
            const dateA =
              typeof a.createdAt === "object" && "toDate" in a.createdAt
                ? (a.createdAt as any).toDate()
                : new Date(a.createdAt);
            const dateB =
              typeof b.createdAt === "object" && "toDate" in b.createdAt
                ? (b.createdAt as any).toDate()
                : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 10)
          .map((rider: RiderRecord) => {
            const createdDate =
              typeof rider.createdAt === "object" && "toDate" in rider.createdAt
                ? (rider.createdAt as any).toDate()
                : new Date(rider.createdAt);

            return {
              id: rider.id || "",
              riderName: rider.fullName,
              opn: rider.opn,
              date: format(createdDate, "MMM dd, yyyy hh:mm a"),
              status: rider.status,
              vehicleType: rider.vehicleCategory,
            };
          });

        setRecentRegistrations(recent);
      } catch (error) {
        console.error("Error fetching daily report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ========================================================================
  // STATUS BADGE COLOR
  // ========================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Active":
        return "bg-green-100 text-green-800";
      case "Expired":
        return "bg-red-100 text-red-800";
      case "Suspended":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // ========================================================================
  // EXPORT REPORT
  // ========================================================================

  const handleExportReport = () => {
    // Create CSV data
    const headers = ["Rider Name", "OPN", "Vehicle", "Date", "Status"];
    const rows = recentRegistrations.map((reg) => [
      reg.riderName,
      reg.opn,
      reg.vehicleType,
      reg.date,
      reg.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
          <p className="text-slate-600 font-semibold">Loading report data...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Daily Report</h1>
          <p className="text-slate-500 mt-1">
            {format(new Date(), "EEEE, MMMM dd, yyyy")} • Your registration
            summary
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button
            onClick={handleExportReport}
            disabled={recentRegistrations.length === 0}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* STAT CARD 1 - Total Registrations */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-600">
                Total Registrations
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900">
                {stats.totalRegistrations}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span>All time registrations</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* STAT CARD 2 - Completed Today */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-600">
                Completed Today
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900">
                {stats.completedToday}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>Registrations completed</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* STAT CARD 3 - Pending Approval */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-600">
                Pending Approval
              </CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900">
                {stats.pendingApproval}
              </p>
              <p className="text-xs text-slate-500">Awaiting admin review</p>
            </div>
          </CardContent>
        </Card>

        {/* STAT CARD 4 - Renewals Expiring */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-600">
                Renewals Expiring
              </CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900">
                {stats.renewalsExpiring}
              </p>
              <p className="text-xs text-slate-500">Within 30 days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECENT REGISTRATIONS TABLE */}
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
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">
                      Rider Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">
                      OPN
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">
                      Vehicle
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">
                      Date & Time
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegistrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm font-semibold text-slate-900">
                        {registration.riderName}
                      </td>
                      <td className="py-4 px-4 text-sm font-mono text-slate-700">
                        {registration.opn}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {registration.vehicleType}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {registration.date}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={`text-xs font-semibold ${getStatusColor(
                            registration.status
                          )}`}
                        >
                          {registration.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
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

      {/* ACTIVITY CHART PLACEHOLDER */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Registration Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold">
                Chart visualization coming soon
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Daily registration trends by{" "}
                {stats.totalRegistrations > 0 ? "you" : "operator"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}