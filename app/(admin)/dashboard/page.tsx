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

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {userProfile?.role === "Super Admin" ? "National Overview" : `${userProfile?.entity} Analytics`}
          </h2>
          <p className="text-slate-500">Real-time operational performance</p>
        </div>
        <Badge variant="secondary" className="mb-1">{userProfile?.role}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-600 text-white border-none shadow-blue-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                   {userProfile?.role === "Super Admin" ? "Total Revenue" : "District Revenue"}
                </p>
                <h3 className="text-3xl font-bold mt-1">GH₵ {stats.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-blue-500/50 rounded-lg">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-blue-200 mt-4 tracking-wide font-medium">
              DATA SYNCED FOR {userProfile?.entity?.toUpperCase()}
            </p>
          </CardContent>
        </Card>
        
        {/* District Performance Card (Modified) */}
        <Card className="md:col-span-2 border-slate-200">
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Regional Compliance</CardTitle>
              <Badge variant="outline" className="text-green-600 border-green-200">Live</Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 py-2">
              {/* If Super Admin, show top 3. If District, show just their town stats */}
              {userProfile?.role === "Super Admin" ? (
                ['Kumasi', 'Accra', 'Tamale'].map((city, i) => (
                    <DistrictStat key={city} city={city} rate={[85, 72, 44][i]} />
                ))
              ) : (
                <div className="col-span-3 text-center py-2">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{userProfile?.entity}</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.riderCount}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total District Riders</p>
                </div>
              )}
            </CardContent>
        </Card>
      </div>

      {/* RECENT ACTIVITY & ALERTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Activity Feed */}
        <Card className="lg:col-span-1 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" /> 
              {userProfile?.role === "Super Admin" ? "National Log" : "Local Log"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-6">
                {recentActions.length > 0 ? recentActions.map((item) => (
                  <div key={item.id} className="flex gap-4 relative">
                    <div className="mt-1"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-800">
                        {item.admin} <span className="text-slate-500 font-normal">{item.action}</span>
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                         <Badge variant="secondary" className="text-[10px] py-0 font-mono font-bold text-blue-700">{item.target}</Badge>
                         <span>•</span>
                         <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 text-center py-10">No recent activity found.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* System Warnings/Alerts */}
        <Card className="lg:col-span-2 border-red-100 bg-red-50/30">
          {/* ... Operations Alerts logic remains similar, 
              but you could filter the 'Expiring Permits' text based on userProfile.entity ... */}
           <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" /> Operational Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-3">
                {/* Global Alert (Super Admin Only) */}
                {userProfile?.role === "Super Admin" && (
                   <div className="p-4 bg-white border border-red-100 rounded-xl flex justify-between items-center shadow-sm">
                      <div>
                         <p className="text-sm text-slate-900 font-bold">SMS Gateway Alert</p>
                         <p className="text-xs text-slate-500">Balance below GH₵ 50.00</p>
                      </div>
                      <Button size="sm" variant="destructive" className="rounded-lg px-4 font-bold">Top Up</Button>
                   </div>
                )}
                
                <div className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                   <div>
                      <p className="text-sm text-slate-900 font-bold">Expiring Permits</p>
                      <p className="text-xs text-slate-500">
                        Riders in {userProfile?.entity} requiring renewal this week
                      </p>
                   </div>
                   <Button size="sm" variant="outline" className="rounded-lg px-4 border-slate-300 font-bold">Review List</Button>
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
    <div className="text-center border-r last:border-none">
      <p className="text-xs text-slate-500">{city}</p>
      <p className="text-xl font-bold">{rate}%</p>
      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Compliance</p>
    </div>
  )
}