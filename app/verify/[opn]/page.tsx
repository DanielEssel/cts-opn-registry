"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, where, limit, getDocs } from "firebase/firestore"
import {
  User, MapPin, Fingerprint,
  Hash, BadgeCheck, Shield,
  AlertTriangle, Loader2, Bike
} from "lucide-react"

export default function RegistryLookupPage() {
  const params = useParams()
  const RIN = (params.RIN as string ?? "").toUpperCase().trim()

  const [rider,       setRider]       = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString())

    async function fetchRider() {
      try {
        // Query riders collection directly by RIN field
        const snap = await getDocs(
          query(
            collection(db, "riders"),
            where("RIN", "==", RIN),
            limit(1)
          )
        )
        if (!snap.empty) {
          setRider({ id: snap.docs[0].id, ...snap.docs[0].data() })
        } else {
          setRider(null)
        }
      } catch (err) {
        console.error("Registry lookup error:", err)
        setRider(null)
      } finally {
        setLoading(false)
      }
    }

    if (RIN) fetchRider()
    else setLoading(false)
  }, [RIN])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 text-green-700 animate-spin" />
        <p className="text-sm font-bold text-slate-500 mt-4 uppercase tracking-widest">
          Verifying RIN...
        </p>
      </div>
    )
  }

  if (!rider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-red-600 mb-4" />
        <h1 className="text-2xl font-black text-red-900">INVALID PERMIT</h1>
        <p className="text-red-700 mt-2 max-w-xs">
          RIN <span className="font-mono font-bold">{RIN}</span> was not found
          in the National Registry. Proceed with caution.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 text-sm font-bold underline text-red-900"
        >
          RETRY SCAN
        </button>
      </div>
    )
  }

  const isActive    = rider.status === "Active"
  const isExpired   = rider.status === "Expired"
  const isSuspended = rider.status === "Suspended"

  const statusColor = isActive
    ? "text-green-600"
    : isExpired || isSuspended
    ? "text-red-600"
    : "text-yellow-600"

  const statusBg = isActive
    ? "bg-green-50 border-green-200"
    : isExpired || isSuspended
    ? "bg-red-50 border-red-200"
    : "bg-yellow-50 border-yellow-200"

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center pb-10">

      {/* Header */}
      <div className="w-full bg-slate-900 text-white px-6 py-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-green-400" />
          <div className="leading-tight">
            <h1 className="text-sm font-black tracking-tight">CTS AFRICA</h1>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
              Ghana RIN Registry
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase font-bold">Official Access</p>
          <p className="text-[10px] font-mono text-slate-300">{currentTime}</p>
        </div>
      </div>

      <div className="w-full max-w-md px-4 mt-6 space-y-4">

        {/* Status banner */}
        <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${statusBg}`}>
          <BadgeCheck className={`h-5 w-5 shrink-0 ${statusColor}`} />
          <div>
            <p className={`text-sm font-black uppercase ${statusColor}`}>
              {rider.status} — {isActive ? "Valid Permit" : "Check Permit"}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Expires {rider.expiryDate
                ? new Date(rider.expiryDate).toLocaleDateString("en-GH", {
                    year: "numeric", month: "long", day: "numeric"
                  })
                : "—"}
            </p>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">

          {/* RIN row */}
          <div className="bg-slate-50 border-b px-5 py-3 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Hash className="h-3 w-3" /> Rider Identification Number
            </span>
            <span className="font-mono font-black text-green-700 text-sm tracking-widest">
              {RIN}
            </span>
          </div>

          <div className="p-6 space-y-6">

            {/* Photo + Name */}
            <div className="flex items-center gap-4">
              {rider.passportPhotoUrl ? (
                <img
                  src={rider.passportPhotoUrl}
                  alt="Passport photo"
                  className="w-20 h-24 rounded-xl object-cover border-2 border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-20 h-24 rounded-xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center shrink-0">
                  <User className="h-8 w-8 text-slate-300" />
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Full Legal Name
                </p>
                <p className="text-xl font-black text-slate-900 leading-tight uppercase">
                  {rider.fullName}
                </p>
                <p className="text-xs text-slate-500 mt-1">{rider.phoneNumber}</p>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <Field label="District" icon={<MapPin className="h-3 w-3" />}
                value={rider.districtMunicipality} />
              <Field label="Town" icon={<MapPin className="h-3 w-3" />}
                value={rider.residentialTown} />
              <Field label="ID Number" icon={<Fingerprint className="h-3 w-3" />}
                value={rider.idNumber} />
              <Field label="ID Type"
                value={rider.idType?.replace("_", " ")} />
              <Field label="Vehicle" icon={<Bike className="h-3 w-3" />}
                value={rider.vehicleCategory} />
              <Field label="Plate Number"
                value={rider.plateNumber} />
              <Field label="Issued"
                value={rider.issueDate
                  ? new Date(rider.issueDate).toLocaleDateString("en-GH")
                  : "—"} />
              <Field label="Gender" value={rider.gender} />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-green-50 px-5 py-3 border-t border-green-100 flex items-center gap-3">
            <BadgeCheck className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-[10px] text-green-700 font-medium leading-tight">
              Authenticated record from the Ghana Commercial Rider Registry.
            </p>
          </div>
        </div>

        {/* Law enforcement note */}
        <div className="p-4 bg-slate-200/50 rounded-2xl flex items-start gap-3">
          <div className="h-2 w-2 rounded-full bg-slate-400 mt-1 animate-pulse shrink-0" />
          <p className="text-[9px] text-slate-500 font-medium uppercase leading-relaxed tracking-wider">
            Law Enforcement: Verify physical ID card against the name and ID
            number shown above before proceeding.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, value, icon,
}: {
  label: string; value?: string; icon?: React.ReactNode
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
        {icon}{label}
      </p>
      <p className="text-sm font-bold text-slate-800 uppercase">{value || "—"}</p>
    </div>
  )
}