"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  status: "Pending" | "Approved" | "Rejected";
  vehicleType: string;
}

// ============================================================================
// DAILY REPORT PAGE
// ============================================================================

export default function DailyReportPage() {
  // ========================================================================
  // MOCK DATA
  // ========================================================================

  const stats: DailyReportStats = {
    totalRegistrations: 1247,
    completedToday: 24,
    pendingApproval: 8,
    renewalsExpiring: 12,
  };

  const recentRegistrations: RecentRegistration[] = [
    {
      id: "1",
      riderName: "John Mensah",
      opn: "AM-1001-02-26",
      date: "2024-02-18 10:30 AM",
      status: "Pending",
      vehicleType: "Pragya",
    },
    {
      id: "2",
      riderName: "Ama Owusu",
      opn: "AM-1002-02-26",
      date: "2024-02-18 09:15 AM",
      status: "Approved",
      vehicleType: "Motorbike",
    },
    {
      id: "3",
      riderName: "Kwame Asante",
      opn: "AM-1003-02-26",
      date: "2024-02-18 08:45 AM",
      status: "Pending",
      vehicleType: "Tricycle",
    },
    {
      id: "4",
      riderName: "Abena Boateng",
      opn: "AM-1004-02-26",
      date: "2024-02-17 04:20 PM",
      status: "Approved",
      vehicleType: "Pragya",
    },
  ];

  // ========================================================================
  // STATUS BADGE COLOR
  // ========================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

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
            Today's registration and activity summary
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 gap-2">
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
                Daily registration trends and statistics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}