"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, Phone, MapPin, Calendar, 
  CreditCard, History, AlertCircle, FileText 
} from "lucide-react"

interface RiderDetailProps {
  rider: {
    name: string;
    RIN: string;
    town: string;
    status: string;
    phone: string;
    expiry: string;
  }
}

export default function RiderDetail({ rider }: RiderDetailProps) {
  // Mock history for UI
  const history = [
    { date: "2026-02-10", action: "Permit Renewed", admin: "Kofi M." },
    { date: "2025-08-10", action: "Initial Registration", admin: "System" },
  ]

  return (
    <div className="space-y-8 py-6 p-4">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
          <User className="h-12 w-12 text-slate-300" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{rider.name}</h3>
          <p className="text-sm text-slate-500 font-mono">{rider.RIN}</p>
        </div>
        <Badge className={
          rider.status === "Active" ? "bg-green-100 text-green-700 border-none" : "bg-red-100 text-red-700 border-none"
        }>
          {rider.status} Status
        </Badge>
      </div>

      <Separator />

      {/* Identity Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <CreditCard className="h-3 w-3" /> Identification
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-[10px] text-slate-500 uppercase">ID Type</p>
            <p className="text-sm font-semibold">Ghana Card</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-[10px] text-slate-500 uppercase">ID Number</p>
            <p className="text-sm font-semibold">GHA-72234023-1</p>
          </div>
        </div>
      </div>

      {/* Contact & Location */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <MapPin className="h-3 w-3" /> Contact Details
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{rider.phone}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Verified</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">{rider.town} Municipality</span>
          </div>
        </div>
      </div>

      {/* Compliance History */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <History className="h-3 w-3" /> Activity Log
        </h4>
        <div className="space-y-3">
          {history.map((item, i) => (
            <div key={i} className="flex gap-3 relative pl-4 border-l-2 border-slate-100">
              <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-blue-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">{item.action}</p>
                <p className="text-xs text-slate-400">{item.date} • by {item.admin}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning/Info Box */}
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          This permi will expire on <strong>{rider.expiry}</strong>. The rider will receive an automated SMS notification 7 days prior.
        </p>
      </div>
    </div>
  )
}