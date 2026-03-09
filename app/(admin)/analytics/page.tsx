"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  orderBy,         // ✅ FIX 1: was missing
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  PieChart,
  Loader2,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Bike,
  DollarSign,
  Activity,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Role = "Super Admin" | "District Admin" | "Operator";

interface Rider {
  id: string;
  fullName?: string;
  name?: string;
  RIN: string;
  phoneNumber?: string;
  phone?: string;
  town: string;
  districtMunicipality?: string;   // ✅ FIX 3: was missing from type
  status: "Active" | "Pending" | "Expired" | "Suspended";
  vehicleCategory?: string;
  expiryDate?: string;
  createdAt?: any;
  issueDate?: string;
}

export default function AnalyticsPage() {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<{
    uid: string;
    role: Role;
    entity: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [data, setData] = useState({
    statusCounts: { Active: 0, Pending: 0, Expired: 0, Suspended: 0, total: 0 },
    townData: {} as Record<string, number>,
    vehicleData: {} as Record<string, number>,
    expiringTodayCount: 0,
    renewalsNeeded: 0,
    avgPermitAge: 0,
    mostActiveTown: "---",
    registrationTrend: [] as { date: string; count: number }[],
    revenueEstimate: 0,
  });

  const PERMIT_FEE = 100;

  // 1) Fetch user profile
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          setUserProfile(null);
          router.replace("/login");
          return;
        }

        const snap = await getDoc(doc(db, "admin_users", user.uid));
        if (!snap.exists()) {
          await auth.signOut();
          setUserProfile(null);
          router.replace("/login");
          return;
        }

        const p = snap.data() as any;

        if (p?.status && p.status !== "Active") {
          await auth.signOut();
          setUserProfile(null);
          router.replace("/login");
          return;
        }

        setUserProfile({
          uid: user.uid,
          role: p.role as Role,
          entity: (p.entity as string) ?? "",
        });
      } catch (e) {
        console.error("Error fetching user profile:", e);
        setUserProfile(null);
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 2) Fetch + compute analytics
  useEffect(() => {
    if (!userProfile) return;

    setLoading(true);

    const ridersRef = collection(db, "riders");

    const q =
      userProfile.role === "Super Admin"
        ? query(ridersRef, orderBy("createdAt", "desc"))
        : query(
            ridersRef,
            where("districtMunicipality", "==", userProfile.entity),
            orderBy("createdAt", "desc")
          );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const statusMap = { Active: 0, Pending: 0, Expired: 0, Suspended: 0, total: 0 };
        const locationMap: Record<string, number> = {};
        const vehicleMap: Record<string, number> = {};
        const registrationByDate: Record<string, number> = {};
        const riderList: Rider[] = [];

        let expiringCount = 0;
        let renewalCount = 0;
        let totalPermitAge = 0;

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const in30Days = new Date(startOfToday);
        in30Days.setDate(in30Days.getDate() + 30);

        snapshot.docs.forEach((d) => {
          const rider = { id: d.id, ...(d.data() as any) } as Rider;
          riderList.push(rider);

          const status = rider.status || "Pending";
          if (status in statusMap) statusMap[status as keyof typeof statusMap]++;
          statusMap.total++;

          const key =
            userProfile.role === "Super Admin"
              ? rider.districtMunicipality || "Unknown"
              : rider.town || "Unknown";
          locationMap[key] = (locationMap[key] || 0) + 1;

          const vehicle = rider.vehicleCategory || "Unknown";
          vehicleMap[vehicle] = (vehicleMap[vehicle] || 0) + 1;

          if (rider.expiryDate) {
            const expiry = new Date(rider.expiryDate);
            const expiryDay = new Date(expiry);
            expiryDay.setHours(0, 0, 0, 0);
            if (expiryDay.getTime() === startOfToday.getTime()) expiringCount++;
            if (expiryDay > startOfToday && expiryDay <= in30Days) renewalCount++;
          }

          if (rider.issueDate) {
            const issueDate = new Date(rider.issueDate);
            const ageInDays = Math.floor(
              (startOfToday.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            totalPermitAge += Math.max(0, ageInDays);
          }

          if (rider.createdAt) {
            const created =
              rider.createdAt?.toDate?.() instanceof Date
                ? rider.createdAt.toDate()
                : new Date(rider.createdAt);
            const dateKey = created.toISOString().split("T")[0];
            registrationByDate[dateKey] = (registrationByDate[dateKey] || 0) + 1;
          }
        });

        const sortedLocations = Object.entries(locationMap).sort((a, b) => b[1] - a[1]);
        const avgPermitAge =
          riderList.length > 0 ? Math.round(totalPermitAge / riderList.length) : 0;
        const estimatedRevenue = statusMap.Active * PERMIT_FEE;
        const sortedTrend = Object.entries(registrationByDate)
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .slice(-7)
          .map(([date, count]) => ({ date, count }));

        setRiders(riderList);
        setData({
          statusCounts: statusMap,
          townData: locationMap,
          vehicleData: vehicleMap,
          expiringTodayCount: expiringCount,
          renewalsNeeded: renewalCount,
          avgPermitAge,
          mostActiveTown: sortedLocations[0]?.[0] || "None",
          registrationTrend: sortedTrend,
          revenueEstimate: estimatedRevenue,
        });

        setLoading(false);
      },
      (error) => {
        console.error("Analytics Listener Error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  // ✅ FIX 2: these were outside the function — moved inside
  const getPercentage = (count: number) =>
    data.statusCounts.total > 0
      ? Math.round((count / data.statusCounts.total) * 100)
      : 0;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">
          {userProfile?.role === "Super Admin"
            ? "Aggregating National Data..."
            : `Syncing ${userProfile?.entity} Data...`}
        </p>
      </div>
    );

  const exportToCSV = () => {
    if (riders.length === 0) return;

    const headers = [
      "Full Name",
      "RIN",
      "Phone",
      "Town",
      "Vehicle",
      "Status",
      "Issue Date",
      "Expiry Date",
      "Date Registered",
    ];
    const rows = riders.map((r) => [
      `"${r.fullName || r.name}"`,
      `"${r.RIN}"`,
      `"${r.phoneNumber || r.phone}"`,
      `"${r.town}"`,
      `"${r.vehicleCategory || "N/A"}"`,
      `"${r.status}"`,
      `"${r.issueDate ? new Date(r.issueDate).toLocaleDateString() : "N/A"}"`,
      `"${r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : "N/A"}"`,
      `"${r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : "N/A"}"`,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${userProfile?.entity}_Rider_Registry_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            {userProfile?.role === "Super Admin"
              ? "System Analytics"
              : `📊 ${userProfile?.entity} Reports`}
          </h1>
          <p className="text-slate-500 font-medium">
            {userProfile?.role === "Super Admin"
              ? `Consolidated reporting across ${Object.keys(data.townData).length} districts • ${data.statusCounts.total} total permits`
              : `Local performance metrics • ${data.statusCounts.total} active permits`}
          </p>
        </div>
        <Button
          className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg"
          onClick={exportToCSV}
          disabled={loading || data.statusCounts.total === 0}
        >
          <Download className="mr-2 h-5 w-5" />
          Export Full Report (.CSV)
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Total Permits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-slate-900">{data.statusCounts.total}</p>
            <p className="text-xs text-slate-400 mt-1">Active & Pending</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-green-900">{data.statusCounts.Active}</p>
            <p className="text-xs text-green-600 mt-1">{getPercentage(data.statusCounts.Active)}% of total</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Expiring Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-orange-900">{data.expiringTodayCount}</p>
            <p className="text-xs text-orange-600 mt-1">Require action</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-yellow-600 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Renewal Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-yellow-900">{data.renewalsNeeded}</p>
            <p className="text-xs text-yellow-600 mt-1">Within 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Est. Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-purple-900">₵{data.revenueEstimate.toLocaleString()}</p>
            <p className="text-xs text-purple-600 mt-1">From active permits</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Active", value: data.statusCounts.Active, color: "bg-green-500" },
              { label: "Pending", value: data.statusCounts.Pending, color: "bg-blue-500" },
              { label: "Expired", value: data.statusCounts.Expired, color: "bg-red-500" },
              { label: "Suspended", value: data.statusCounts.Suspended, color: "bg-slate-500" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="flex items-center gap-2 font-medium">
                    <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    {label}
                  </span>
                  <span className="font-bold text-lg">{value}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${color} transition-all`}
                    style={{ width: `${getPercentage(value)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Bike className="h-5 w-5 text-yellow-600" />
              Vehicle Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.vehicleData)
              .sort(([, a], [, b]) => b - a)
              .map(([vehicle, count]) => (
                <div key={vehicle} className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">{vehicle}</span>
                  <Badge className="bg-blue-100 text-blue-700 font-bold">{count}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Top {userProfile?.role === "Super Admin" ? "Districts" : "Locations"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.townData)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([town, count]) => (
                <div key={town} className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">{town}</span>
                  <Badge className="bg-green-100 text-green-700 font-bold">{count}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Registration Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-around h-[140px] gap-2 px-2 border-b-2 border-slate-100">
              {data.registrationTrend.length > 0 ? (
                data.registrationTrend.map(({ date, count }) => {
                  const maxCount = Math.max(...data.registrationTrend.map((d) => d.count), 1);
                  const height = (count / maxCount) * 100;
                  return (
                    <div key={date} className="flex flex-col items-center flex-1">
                      <span className="text-xs font-bold text-blue-600 mb-1">{count}</span>
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm hover:from-blue-500 hover:to-blue-300 transition-all"
                        style={{ height: `${Math.max(height, 10)}%` }}
                      />
                      <span className="text-xs text-slate-500 mt-2">
                        {new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400 text-center w-full self-center">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Avg. Permi Age</p>
              <p className="text-2xl font-black text-slate-900">{data.avgPermitAge} days</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Active Rate</p>
              <p className="text-2xl font-black text-green-600">
                {getPercentage(data.statusCounts.Active)}%
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Scope</p>
              <p className="text-lg font-black text-slate-900">
                {userProfile?.role === "Super Admin" ? "National" : userProfile?.entity}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}  