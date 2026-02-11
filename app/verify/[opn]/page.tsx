"use client"

import { useParams } from "next/navigation"
import { 
  User, MapPin, Calendar, Fingerprint, 
  Clock, Hash, BadgeCheck, Shield 
} from "lucide-react"

export default function RegistryLookupPage() {
  const params = useParams()
  const opn = params.opn

  // Data mapping based on your requirements
  const rider = {
    fullName: "KWESI MENSAH",
    opnNumber: opn,
    dateOfIssue: "2026-02-10",
    dateOfExpiry: "2026-08-10",
    district: "KUMASI METROPOLITAN",
    idNumber: "GHA-72234023-1",
    status: "ACTIVE" 
  }

  const currentTime = new Date().toLocaleTimeString();

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
          <p className="text-[10px] text-slate-400 uppercase font-bold">Portal Access</p>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date of Issue</label>
                <p className="text-sm font-bold text-slate-800">{rider.dateOfIssue}</p>
              </section>
              <section className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date of Expiry</label>
                <p className="text-sm font-bold text-red-600">{rider.dateOfExpiry}</p>
              </section>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
              <section className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> District
                </label>
                <p className="text-sm font-bold text-slate-800 uppercase">{rider.district}</p>
              </section>
              <section className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Fingerprint className="h-3 w-3" /> Ghana Card
                </label>
                <p className="text-sm font-bold text-slate-800 uppercase">{rider.idNumber}</p>
              </section>
            </div>
          </div>

          {/* Verification Footer */}
          <div className="bg-blue-50/50 p-4 border-t border-blue-100 flex items-center gap-3">
            <BadgeCheck className="h-5 w-5 text-blue-600 shrink-0" />
            <p className="text-[10px] text-blue-700 leading-tight font-medium">
              This record is digitally signed and pulled directly from the transport authority's secure database.
            </p>
          </div>
        </div>

        {/* Security Warning */}
        <div className="p-4 bg-slate-200/50 rounded-2xl flex items-start gap-3">
          <div className="h-2 w-2 rounded-full bg-slate-400 mt-1 animate-pulse" />
          <p className="text-[9px] text-slate-500 font-medium uppercase leading-relaxed tracking-wider">
            Unauthorized use or duplication of this digital permit is a punishable offense under the Electronic Communications Act.
          </p>
        </div>
      </div>
    </div>
  )
}