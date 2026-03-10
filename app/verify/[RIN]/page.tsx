"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import {
  User, AlertTriangle, Loader2, Shield,
  CheckCircle2, XCircle, Clock,
} from "lucide-react";

interface RiderData {
  id: string;
  RIN: string;
  fullName: string;
  phoneNumber?: string;
  status: "Active" | "Expired" | "Suspended" | "Pending";
  districtMunicipality?: string;
  residentialTown?: string;
  idNumber?: string;
  idType?: string;
  vehicleCategory?: string;
  plateNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  gender?: string;
  passportPhotoUrl?: string;
  qrCodeUrl?: string;
}

const STATUS_CONFIG = {
  Active: {
    label:   "ACTIVE",
    icon:    CheckCircle2,
    dot:     "#22c55e",
    ping:    "#bbf7d0",
    accent:  "#166534",
    chip:    "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  Expired: {
    label:   "EXPIRED",
    icon:    XCircle,
    dot:     "#ef4444",
    ping:    "#fecaca",
    accent:  "#991b1b",
    chip:    "bg-red-100 text-red-800 border border-red-200",
  },
  Suspended: {
    label:   "SUSPENDED",
    icon:    Shield,
    dot:     "#f97316",
    ping:    "#fed7aa",
    accent:  "#9a3412",
    chip:    "bg-orange-100 text-orange-800 border border-orange-200",
  },
  Pending: {
    label:   "PENDING",
    icon:    Clock,
    dot:     "#eab308",
    ping:    "#fef08a",
    accent:  "#854d0e",
    chip:    "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
};

function Col({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p style={{ fontSize: "8px", letterSpacing: "0.16em" }}
        className="font-black uppercase text-slate-400 mb-0.5">
        {label}
      </p>
      <p className="text-[11px] font-bold text-slate-800 uppercase leading-snug">
        {value || "—"}
      </p>
    </div>
  );
}

export default function VerifyPage() {
  const params = useParams();
  const RIN    = (params.RIN as string ?? "").toUpperCase().trim();

  const [rider,   setRider]   = useState<RiderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [time,    setTime]    = useState("");

  useEffect(() => {
    setTime(new Date().toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" }));
    async function fetchRider() {
      try {
        const snap = await getDocs(
          query(collection(db, "riders"), where("RIN", "==", RIN), limit(1))
        );
        if (!snap.empty) setRider({ id: snap.docs[0].id, ...snap.docs[0].data() } as RiderData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    if (RIN) fetchRider(); else setLoading(false);
  }, [RIN]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0f1a" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-900" />
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin absolute" />
        </div>
        <p style={{ fontSize: "9px", letterSpacing: "0.3em" }} className="font-black uppercase text-slate-600">
          Verifying...
        </p>
      </div>
    </div>
  );

  if (!rider) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#0a0f1a" }}>
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-lg font-black text-red-400 tracking-widest">INVALID PERMIT</h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          RIN <span className="font-mono font-black text-red-400">{RIN}</span> was not
          found in the national registry.
        </p>
        <div className="mt-4 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider text-red-400"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
          Do not allow rider to operate
        </div>
      </div>
    </div>
  );

  const cfg        = STATUS_CONFIG[rider.status] ?? STATUS_CONFIG.Pending;
  const StatusIcon = cfg.icon;
  const isActive   = rider.status === "Active";

  const fmt = (d?: string) => d
    ? new Date(d).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "#0a0f1a" }}>

      {/* ── THE CARD ──────────────────────────────────────────────────────── */}
      <div className="w-full" style={{ maxWidth: "680px" }}>

        {/* Card shell */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}>

          {/* Subtle watermark pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, #166534 0px, #166534 1px, transparent 1px, transparent 12px)`,
            }} />

          {/* ── Left green stripe ───────────────────────────────────────── */}
          <div className="absolute left-0 top-0 bottom-0 w-2"
            style={{ background: "linear-gradient(180deg, #166534 0%, #15803d 100%)" }} />

          {/* ── Card content ────────────────────────────────────────────── */}
          <div className="flex items-stretch pl-4">

            {/* PHOTO COLUMN */}
            <div className="flex flex-col items-center justify-center gap-3 px-5 py-5 shrink-0"
              style={{ borderRight: "1px solid #e2e8f0" }}>

              {/* Photo */}
              <div className="overflow-hidden rounded-xl"
                style={{
                  width: 72, height: 88,
                  boxShadow: `0 0 0 3px ${cfg.dot}, 0 4px 12px rgba(0,0,0,0.15)`,
                }}>
                {rider.passportPhotoUrl ? (
                  <img src={rider.passportPhotoUrl} alt="Photo"
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <User className="h-7 w-7 text-slate-300" />
                  </div>
                )}
              </div>

              {/* QR Code */}
              {rider.qrCodeUrl ? (
                <div className="rounded-lg overflow-hidden p-1.5 bg-white"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0" }}>
                  <img src={rider.qrCodeUrl} alt="QR" style={{ width: 56, height: 56, display: "block" }} />
                </div>
              ) : (
                <div style={{ width: 64, height: 64, background: "#f1f5f9", borderRadius: 8 }} />
              )}
            </div>

            {/* CENTER — name + details */}
            <div className="flex-1 px-5 py-5 flex flex-col justify-between min-w-0">

              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {/* Authority label */}
                  <p style={{ fontSize: "8px", letterSpacing: "0.2em", color: "#166534" }}
                    className="font-black uppercase mb-0.5">
                    Ghana Transport Authority
                  </p>
                  {/* Name */}
                  <h1 className="font-black text-slate-900 uppercase leading-tight truncate"
                    style={{ fontSize: "18px" }}>
                    {rider.fullName}
                  </h1>
                  {rider.phoneNumber && (
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{rider.phoneNumber}</p>
                  )}
                </div>

                {/* Status chip */}
                <div className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${cfg.chip}`}>
                  <span className="relative flex h-1.5 w-1.5">
                    {isActive && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: cfg.ping }} />
                    )}
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                      style={{ background: cfg.dot }} />
                  </span>
                  {cfg.label}
                </div>
              </div>

              {/* Details grid */}
              <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3">
                <Col label="District"   value={rider.districtMunicipality}     />
                <Col label="Town"       value={rider.residentialTown}          />
                <Col label="Gender"     value={rider.gender}                   />
                <Col label="ID Type"    value={rider.idType?.replace("_"," ")} />
                <Col label="ID Number"  value={rider.idNumber}                 />
                <Col label="Vehicle"    value={rider.vehicleCategory}          />
              </div>
            </div>

            {/* RIGHT — RIN + dates */}
            <div className="shrink-0 flex flex-col justify-between px-5 py-5"
              style={{ width: 148, borderLeft: "1px solid #e2e8f0" }}>

              {/* RIN */}
              <div>
                <p style={{ fontSize: "8px", letterSpacing: "0.16em", color: "#166534" }}
                  className="font-black uppercase mb-1">
                  Rider ID No.
                </p>
                <p className="font-mono font-black text-slate-900"
                  style={{ fontSize: "13px", letterSpacing: "0.1em" }}>
                  {rider.RIN}
                </p>
              </div>

              <div className="space-y-2.5 mt-3">
                <Col label="Plate No."  value={rider.plateNumber}   />
                <Col label="Issued"     value={fmt(rider.issueDate)} />
                <Col label="Expires"    value={fmt(rider.expiryDate)} />
              </div>

              {/* GH crest placeholder */}
              <div className="mt-3 flex items-center gap-1.5 opacity-30">
                <Shield className="h-4 w-4 text-slate-600" />
                <p style={{ fontSize: "7px", letterSpacing: "0.15em" }}
                  className="font-black uppercase text-slate-600">
                  Official
                </p>
              </div>
            </div>
          </div>

          {/* ── Bottom bar ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-2"
            style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <div className="flex items-center gap-2">
              <StatusIcon className="h-3 w-3" style={{ color: cfg.dot }} />
              <p style={{ fontSize: "9px", letterSpacing: "0.12em", color: cfg.accent }}
                className="font-bold uppercase">
                {isActive
                  ? "Verified · Authenticated record from the Ghana Commercial Rider Registry"
                  : `${cfg.label} · This permit is not currently valid`}
              </p>
            </div>
            <p style={{ fontSize: "8px" }} className="font-mono text-slate-400 shrink-0 ml-4">
              {time}
            </p>
          </div>
        </div>

        {/* Law enforcement note below card */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <Shield className="h-3 w-3 text-slate-600 shrink-0" />
          <p style={{ fontSize: "9px", letterSpacing: "0.15em" }}
            className="font-bold uppercase text-slate-600 text-center">
            Law Enforcement: Always verify physical ID against name &amp; ID number above
          </p>
        </div>
      </div>
    </div>
  );
}