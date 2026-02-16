"use client"

import { useEffect, useState } from "react"
import { db, auth } from "@/lib/firebase" // Added auth
import { collection, query, orderBy, limit, onSnapshot, getDocs, where, doc, getDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdvancedDashboard() {
  const [userProfile, setUserProfile] = useState<{role: string, entity: string} | null>(null);
  const [stats, setStats] = useState({ totalRevenue: 0, riderCount: 0 })
  const [recentActions, setRecentActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const PERMIT_FEE = 100;

  // 1. FETCH USER PROFILE
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "admin_users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as any);
        } else {
          // Fallback for Main Admin
          setUserProfile({ role: "Super Admin", entity: "National HQ" });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. FETCH STATS & RECENT ACTIONS BASED ON PROFILE
  useEffect(() => {
    if (!userProfile) return;

    const ridersRef = collection(db, "riders");
    const opnRef = collection(db, "opn_registry");

    // --- LOGIC: Filter by town if not Super Admin ---
    const statsQuery = userProfile.role === "Super Admin" 
      ? query(ridersRef) 
      : query(ridersRef, where("town", "==", userProfile.entity));

    const activityQuery = userProfile.role === "Super Admin"
      ? query(opnRef, orderBy("issuedAt", "desc"), limit(10))
      // Note: Assumes opn_registry has a 'town' field. 
      // If not, we filter by the first 2 letters of OPN (prefix) or keep it simple.
      : query(opnRef, where("town", "==", userProfile.entity), orderBy("issuedAt", "desc"), limit(10));

    // Fetch Stats
    const getStats = async () => {
      const snapshot = await getDocs(statsQuery);
      const count = snapshot.size;
      setStats({
        riderCount: count,
        totalRevenue: count * PERMIT_FEE
      });
    };

   // Activity Feed Listener
const unsubscribe = onSnapshot(activityQuery, (snapshot) => {
  if (snapshot.empty) {
    setRecentActions([]);
    setLoading(false); // Stop the spinner even if no data
    return;
  }

  const actions = snapshot.docs.map(doc => ({
    id: doc.id,
    target: doc.data().opn,
    action: "New Registration",
    admin: doc.data().adminName || "System", 
    time: doc.data().issuedAt?.toDate().toLocaleTimeString() || "Just now"
  }));
  setRecentActions(actions);
  setLoading(false); // Stop spinner
}, (error) => {
  console.error("Dashboard Listener Error:", error);
  // IF PERMISSION DENIED, STOP SPINNER
  setLoading(false);
});

    getStats();
    return () => unsubscribe();
  }, [userProfile]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="relative">
        <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-60 animate-pulse" />
        <Loader2 className="relative animate-spin h-10 w-10 text-green-600" />
      </div>
      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Dashboard...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Premium Header with Green Gradient */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-100 shadow-lg">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {userProfile?.role === "Super Admin" ? "National Overview" : `${userProfile?.entity} Analytics`}
            </h2>
            <p className="text-slate-600 font-medium">Real-time operational performance</p>
          </div>
          <Badge variant="outline" className="mb-1 border-green-600 text-green-700 bg-white shadow-sm px-4 py-1.5 text-sm font-semibold">
            {userProfile?.role}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-600 to-emerald-600 text-white border-none shadow-xl shadow-green-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-sm font-semibold">
                   {userProfile?.role === "Super Admin" ? "Total Revenue" : "District Revenue"}
                </p>
                <h3 className="text-4xl font-bold mt-2">GH₵ {stats.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="p-2.5 bg-green-500/40 rounded-xl shadow-lg">
                <ArrowUpRight className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-green-100 mt-5 tracking-wide font-semibold uppercase">
              DATA SYNCED FOR {userProfile?.entity?.toUpperCase()}
            </p>
          </CardContent>
        </Card>
        
        {/* District Performance Card (Modified) */}
        <Card className="md:col-span-2 border-2 border-green-100 bg-gradient-to-br from-white to-green-50/30 shadow-lg">
            <CardHeader className="py-4 flex flex-row items-center justify-between border-b border-green-100">
              <CardTitle className="text-base font-bold text-slate-900">Regional Compliance</CardTitle>
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 shadow-sm px-3 py-1 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 animate-pulse"/>
                Live
              </Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 py-4">
              {/* If Super Admin, show top 3. If District, show just their town stats */}
              {userProfile?.role === "Super Admin" ? (
                ['Kumasi', 'Accra', 'Tamale'].map((city, i) => (
                    <DistrictStat key={city} city={city} rate={[85, 72, 44][i]} />
                ))
              ) : (
                <div className="col-span-3 text-center py-4">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{userProfile?.entity}</p>
                    <p className="text-4xl font-bold text-green-600 mt-2">{stats.riderCount}</p>
                    <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Total District Riders</p>
                </div>
              )}
            </CardContent>
        </Card>
      </div>

      {/* RECENT ACTIVITY & ALERTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Activity Feed */}
        <Card className="lg:col-span-1 border-2 border-green-100 bg-white shadow-lg">
          <CardHeader className="border-b border-green-50 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
            <CardTitle className="text-base flex items-center gap-2 font-bold text-slate-900">
              <Activity className="h-5 w-5 text-green-600" /> 
              {userProfile?.role === "Super Admin" ? "National Log" : "Local Log"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-6">
                {recentActions.length > 0 ? recentActions.map((item) => (
                  <div key={item.id} className="flex gap-4 relative group">
                    <div className="mt-1">
                      <div className="p-1 bg-green-100 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {item.admin} <span className="text-slate-500 font-normal">{item.action}</span>
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                         <Badge variant="secondary" className="text-[10px] py-0.5 px-2 font-mono font-bold text-green-700 bg-green-50 border-green-200">
                           {item.target}
                         </Badge>
                         <span>•</span>
                         <span className="font-medium">{item.time}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-16">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-50 mb-3">
                      <Activity className="h-7 w-7 text-green-400" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">No recent activity found.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* System Warnings/Alerts */}
        <Card className="lg:col-span-2 border-2 border-amber-100 bg-gradient-to-br from-white to-amber-50/30 shadow-lg">
           <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800 font-bold">
              <AlertTriangle className="h-5 w-5" /> Operational Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
             <div className="space-y-3">
                {/* Global Alert (Super Admin Only) */}
                {userProfile?.role === "Super Admin" && (
                   <div className="p-5 bg-white border-2 border-red-100 rounded-xl flex justify-between items-center shadow-md hover:shadow-lg transition-shadow">
                      <div>
                         <p className="text-sm text-slate-900 font-bold mb-1">SMS Gateway Alert</p>
                         <p className="text-xs text-slate-600 font-medium">Balance below GH₵ 50.00</p>
                      </div>
                      <Button size="sm" variant="destructive" className="rounded-lg px-5 py-2 font-bold shadow-md">
                        Top Up
                      </Button>
                   </div>
                )}
                
                <div className="p-5 bg-white border-2 border-green-100 rounded-xl flex justify-between items-center shadow-md hover:shadow-lg transition-shadow">
                   <div>
                      <p className="text-sm text-slate-900 font-bold mb-1">Expiring Permits</p>
                      <p className="text-xs text-slate-600 font-medium">
                        Riders in {userProfile?.entity} requiring renewal this week
                      </p>
                   </div>
                   <Button size="sm" variant="outline" className="rounded-lg px-5 py-2 border-2 border-green-200 font-bold hover:bg-green-50">
                     Review List
                   </Button>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper component for the regional grid
function DistrictStat({ city, rate }: { city: string, rate: number }) {
  return (
    <div className="text-center border-r last:border-none border-green-100 px-2">
      <p className="text-xs text-slate-600 font-semibold mb-1">{city}</p>
      <p className="text-2xl font-bold text-green-600">{rate}%</p>
      <p className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Compliance</p>
    </div>
  )
}