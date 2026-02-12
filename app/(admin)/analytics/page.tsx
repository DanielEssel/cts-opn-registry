"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Calendar,
  PieChart,
  TrendingUp,
  Loader2,
  MapPin,
} from "lucide-react";

interface Rider {
  id: string;
  fullName?: string;
  name?: string; 
  opn: string;
  phone: string;
  town: string;
  status: "Active" | "Pending" | "Expired";
  createdAt?: any;
}

export default function AnalyticsPage() {
  const [userProfile, setUserProfile] = useState<{ role: string; entity: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [data, setData] = useState({
    statusCounts: { Active: 0, Pending: 0, Expired: 0, total: 0 },
    townData: {} as Record<string, number>,
    mostActiveTown: "---",
    criticalTown: "---",
  });

  // 1. FETCH USER PROFILE
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "admin_users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as any);
        } else {
          setUserProfile({ role: "Super Admin", entity: "National HQ" });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. FETCH FILTERED ANALYTICS DATA
  useEffect(() => {
    if (!userProfile) return;

    const ridersRef = collection(db, "riders");
    
    // Apply Multi-Tenancy Query
    const q = userProfile.role === "Super Admin" 
      ? query(ridersRef) 
      : query(ridersRef, where("town", "==", userProfile.entity));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const statusMap = { Active: 0, Pending: 0, Expired: 0, total: 0 };
      const townMap: Record<string, number> = {};
      const riderList: Rider[] = [];

      snapshot.docs.forEach((doc) => {
        const rider = { id: doc.id, ...doc.data() } as Rider;
        riderList.push(rider);

        const status = rider.status || "Pending";
        if (statusMap.hasOwnProperty(status)) {
          statusMap[status as keyof typeof statusMap]++;
        }
        statusMap.total++;

        const town = rider.town || "Unknown";
        townMap[town] = (townMap[town] || 0) + 1;
      });

      const sortedTowns = Object.entries(townMap).sort((a, b) => b[1] - a[1]);

      setRiders(riderList);
      setData({
        statusCounts: statusMap,
        townData: townMap,
        mostActiveTown: sortedTowns[0]?.[0] || "None",
        criticalTown: userProfile.role === "Super Admin" ? "National" : userProfile.entity,
      });

      setLoading(false);
    }, (error) => {
      console.error("Analytics Listener Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const getPercentage = (count: number) =>
    data.statusCounts.total > 0
      ? Math.round((count / data.statusCounts.total) * 100)
      : 0;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">
          {userProfile?.role === "Super Admin" ? "Aggregating National Data..." : `Syncing ${userProfile?.entity} Data...`}
        </p>
      </div>
    );

  const exportToCSV = () => {
    if (riders.length === 0) return;

    const headers = ["Full Name", "OPN", "Phone", "Town", "Status", "Date Registered"];
    const rows = riders.map((r) => [
      `"${r.fullName || r.name}"`,
      `"${r.opn}"`,
      `"${r.phone}"`,
      `"${r.town}"`,
      `"${r.status}"`,
      `"${r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : "N/A"}"`,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${userProfile?.entity}_Rider_Registry_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {userProfile?.role === "Super Admin" ? "System Analytics" : `${userProfile?.entity} Reports`}
          </h1>
          <p className="text-slate-500">
            {userProfile?.role === "Super Admin" 
              ? `Consolidated reporting across ${Object.keys(data.townData).length} districts.` 
              : `Local performance metrics for ${userProfile?.entity} registry.`}
          </p>
        </div>
        <Button
          variant="outline"
          className="h-11 border-slate-200 hover:bg-slate-50 font-bold"
          onClick={exportToCSV}
          disabled={loading || data.statusCounts.total === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export {userProfile?.role === "Super Admin" ? "National" : "District"} Report (.CSV)
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Permit Validity Card */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase text-slate-500 tracking-wider">
              Permit Validity
            </CardTitle>
            <PieChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" /> Active
                </span>
                <span className="font-bold">{getPercentage(data.statusCounts.Active)}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" /> Pending
                </span>
                <span className="font-bold">{getPercentage(data.statusCounts.Pending)}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" /> Expired
                </span>
                <span className="font-bold">{getPercentage(data.statusCounts.Expired)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart / Info */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-bold uppercase text-slate-400">
              {userProfile?.role === "Super Admin" ? "Top District Performance" : "Daily Registration Volume"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-end justify-around h-[160px] w-full gap-3 px-2 border-b-2 border-slate-100">
              {Object.entries(data.townData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([town, count]) => {
                  const highestValue = Math.max(...Object.values(data.townData), 1);
                  const barHeight = (count / highestValue) * 100;
                  return (
                    <div key={town} className="flex flex-col items-center w-full max-w-[50px] h-full justify-end">
                      <span className="text-[11px] font-black text-blue-600 mb-2">{count}</span>
                      <div
                        className="w-full bg-blue-600 rounded-t-md shadow-sm transition-all duration-1000 ease-out hover:bg-blue-500"
                        style={{ height: `${barHeight}%`, minHeight: '4px' }}
                      />
                      <div className="h-8 flex items-center justify-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase truncate w-full text-center mt-2">
                          {town.substring(0, 6)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional / Local Info Section */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Compliance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">
                  {userProfile?.role === "Super Admin" ? "Lead District" : "Registry Status"}
                </p>
                <p className="text-xl font-bold text-slate-800 capitalize">
                  {userProfile?.role === "Super Admin" ? data.mostActiveTown : "Operational"}
                </p>
              </div>
              <TrendingUp className="text-green-500 h-8 w-8" />
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Scope</p>
                <p className="text-xl font-bold text-slate-800">
                   {userProfile?.role === "Super Admin" ? "National" : userProfile?.entity}
                </p>
              </div>
              <MapPin className="text-blue-500 h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}