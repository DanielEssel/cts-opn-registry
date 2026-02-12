"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { 
  User, MapPin, Fingerprint, 
  Hash, BadgeCheck, Shield, 
  AlertTriangle, Loader2 
} from "lucide-react"

export default function RegistryLookupPage() {
  const params = useParams()
  const opn = params.opn as string
  
  const [rider, setRider] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    // Update time only on client to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleTimeString())
    
    async function fetchRider() {
  try {
    const normalizedOpn = opn.toUpperCase().trim();

    // STEP 1: Direct hit on the registry (Fastest)
    const registryRef = doc(db, "opn_registry", normalizedOpn);
    const registrySnap = await getDoc(registryRef);

    if (registrySnap.exists()) {
      const { riderId } = registrySnap.data();

      // STEP 2: Direct hit on the rider document
      const riderRef = doc(db, "riders", riderId);
      const riderSnap = await getDoc(riderRef);

      if (riderSnap.exists()) {
        setRider(riderSnap.data());
      }
    } else {
      setRider(null); // OPN doesn't exist in registry
    }
  } catch (error) {
    console.error("Registry lookup error:", error);
  } finally {
    setLoading(false);
  }
}

    if (opn) fetchRider();
  }, [opn]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm font-bold text-slate-500 mt-4 uppercase tracking-widest">Verifying OPN...</p>
      </div>
    )
  }

  if (!rider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-red-600 mb-4" />
        <h1 className="text-2xl font-black text-red-900">INVALID PERMIT</h1>
        <p className="text-red-700 mt-2 max-w-xs">This OPN was not found in the National Registry. Proceed with caution.</p>
        <button onClick={() => window.location.reload()} className="mt-6 text-sm font-bold underline text-red-900">RETRY SCAN</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center pb-10">
      {/* Official Header */}
      <div className="w-full bg-slate-900 text-white p-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-400" />
          <div className="leading-tight">
            <h1 className="text-sm font-black tracking-tighter italic">PERMIT-TRACK</h1>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">National Registry</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase font-bold">Official Access</p>
          <p className="text-[10px] font-mono">{currentTime}</p>
        </div>
      </div>

      <div className="w-full max-w-md px-4 mt-6 space-y-4">
        
        {/* PRIMARY CREDENTIAL CARD */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b p-4 flex justify-between items-center">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <Hash className="h-3 w-3" /> Permit Identifier
             </span>
             <span className="font-mono font-bold text-blue-600">{opn}</span>
          </div>

          <div className="p-6 space-y-6">
            {/* Full Name Section */}
            <section className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <User className="h-3 w-3" /> Full Legal Name
              </label>
              <p className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
                {rider.fullName}
              </p>
            </section>

            <div className="grid grid-cols-2 gap-6">
              <section className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration Date</label>
                <p className="text-sm font-bold text-slate-800">
                   {rider.createdAt?.toDate().toLocaleDateString('en-GB') || "N/A"}
                </p>
              </section>
              <section className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permit Status</label>
                <p className="text-sm font-bold text-green-600 uppercase italic">● {rider.status || "Active"}</p>
              </section>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
              <section className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> District
                </label>
                <p className="text-sm font-bold text-slate-800 uppercase">{rider.town}</p>
              </section>
              <section className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Fingerprint className="h-3 w-3" /> ID Number
                </label>
                <p className="text-sm font-bold text-slate-800 uppercase">{rider.idNumber}</p>
              </section>
            </div>
          </div>

          {/* Verification Footer */}
          <div className="bg-blue-50/50 p-4 border-t border-blue-100 flex items-center gap-3">
            <BadgeCheck className="h-5 w-5 text-blue-600 shrink-0" />
            <p className="text-[10px] text-blue-700 leading-tight font-medium">
              Verified record. This OPN is authenticated by the Permit-Track Digital Signature.
            </p>
          </div>
        </div>

        {/* Security Warning */}
        <div className="p-4 bg-slate-200/50 rounded-2xl flex items-start gap-3">
          <div className="h-2 w-2 rounded-full bg-slate-400 mt-1 animate-pulse" />
          <p className="text-[9px] text-slate-500 font-medium uppercase leading-relaxed tracking-wider">
            Law Enforcement Note: Verify physical ID card against the name above.
          </p>
        </div>
      </div>
    </div>
  )
}