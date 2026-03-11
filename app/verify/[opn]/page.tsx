"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import {
  User, AlertTriangle, Loader2, Shield,
  CheckCircle2, XCircle, Clock, BadgeCheck,
} from "lucide-react";

interface RiderData {
  id: string;
  RIN: string;
  fullName: string;
  status: "Active" | "Expired" | "Suspended" | "Pending";
  districtMunicipality?: string;
  idNumber?: string;
  idType?: string;
  vehicleCategory?: string;
  plateNumber?: string;
  expiryDate?: string;
  passportPhotoUrl?: string;
}

const STATUS = {
  Active: {
    label:  "VALID PERMIT",
    sub:    "Rider is authorised to operate",
    icon:   CheckCircle2,
    dot:    "#16a34a",
    ping:   "#bbf7d0",
    bg:     "#f0fdf4",
    border: "#86efac",
    text:   "#166534",
    stripe: "linear-gradient(90deg,#166534,#15803d)",
    ring:   "#16a34a",
  },
  Expired: {
    label:  "EXPIRED PERMIT",
    sub:    "Rider must not operate",
    icon:   XCircle,
    dot:    "#dc2626",
    ping:   "#fecaca",
    bg:     "#fef2f2",
    border: "#fca5a5",
    text:   "#991b1b",
    stripe: "linear-gradient(90deg,#991b1b,#dc2626)",
    ring:   "#dc2626",
  },
  Suspended: {
    label:  "SUSPENDED",
    sub:    "Rider must not operate",
    icon:   Shield,
    dot:    "#ea580c",
    ping:   "#fed7aa",
    bg:     "#fff7ed",
    border: "#fdba74",
    text:   "#9a3412",
    stripe: "linear-gradient(90deg,#9a3412,#ea580c)",
    ring:   "#ea580c",
  },
  Pending: {
    label:  "PENDING APPROVAL",
    sub:    "Permit not yet active",
    icon:   Clock,
    dot:    "#ca8a04",
    ping:   "#fef08a",
    bg:     "#fefce8",
    border: "#fde047",
    text:   "#854d0e",
    stripe: "linear-gradient(90deg,#854d0e,#ca8a04)",
    ring:   "#ca8a04",
  },
};

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

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-200" />
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin absolute" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
          Verifying...
        </p>
      </div>
    </div>
  );

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!rider) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center mb-5">
        <AlertTriangle className="h-9 w-9 text-red-600" />
      </div>
      <h1 className="text-2xl font-black text-red-900 tracking-tight">INVALID PERMIT</h1>
      <p className="text-sm text-red-600 mt-2 max-w-xs leading-relaxed">
        RIN <span className="font-mono font-black">{RIN}</span> was not found
        in the national registry.
      </p>
      <div className="mt-5 px-6 py-3 bg-red-600 rounded-2xl text-sm font-black text-white uppercase tracking-wider shadow-lg shadow-red-200">
        ⚠ Do not allow this rider to operate
      </div>
    </div>
  );

  // ── Found ─────────────────────────────────────────────────────────────────

  const cfg        = STATUS[rider.status] ?? STATUS.Pending;
  const StatusIcon = cfg.icon;
  const isActive   = rider.status === "Active";

  const expiry = rider.expiryDate
    ? new Date(rider.expiryDate).toLocaleDateString("en-GH", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : "—";

  // Check if expiring within 30 days
  const expiringSOon = rider.expiryDate && isActive
    ? (new Date(rider.expiryDate).getTime() - Date.now()) < 1000 * 60 * 60 * 24 * 30
    : false;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-3 py-6">
      <div className="w-full" style={{ maxWidth: 560 }}>

        {/* ── STATUS HERO — the first thing an officer sees ──────────────── */}
        <div
          className="rounded-2xl p-4 mb-3 flex items-center gap-4 border-2"
          style={{ background: cfg.bg, borderColor: cfg.border }}
        >
          {/* Big pulse dot */}
          <span className="relative flex h-5 w-5 shrink-0">
            {isActive && (
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: cfg.ping }}
              />
            )}
            <span
              className="relative inline-flex rounded-full h-5 w-5"
              style={{ background: cfg.dot }}
            />
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-lg font-black uppercase tracking-wider leading-none" style={{ color: cfg.text }}>
              {cfg.label}
            </p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: cfg.text, opacity: 0.7 }}>
              {cfg.sub}
            </p>
          </div>

          <StatusIcon className="h-8 w-8 shrink-0" style={{ color: cfg.dot }} />
        </div>

        {/* ── CARD ───────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden bg-white"
          style={{
            boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.8)",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Colour stripe */}
          <div style={{ height: 5, background: cfg.stripe }} />

          {/* ── BODY ─────────────────────────────────────────────────────── */}
          <div className="flex gap-0">

            {/* Photo column */}
            <div
              className="flex items-start justify-center pt-5 pb-5 px-4 shrink-0"
              style={{ borderRight: "1px solid #f1f5f9" }}
            >
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  width: 88,
                  height: 108,
                  boxShadow: `0 0 0 3px ${cfg.ring}, 0 4px 16px rgba(0,0,0,0.10)`,
                }}
              >
                {rider.passportPhotoUrl ? (
                  <img
                    src={rider.passportPhotoUrl}
                    alt="Rider photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <User className="h-9 w-9 text-slate-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 px-5 py-5 min-w-0">

              {/* Name — largest text, top priority */}
              <div className="mb-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                  Full Name
                </p>
                <h1 className="text-xl font-black text-slate-900 uppercase leading-tight">
                  {rider.fullName}
                </h1>
              </div>

              {/* 2-col grid of essential fields */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">

                {/* RIN */}
                <div className="col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-green-700 mb-0.5">
                    Rider ID (RIN)
                  </p>
                  <p className="font-mono text-base font-black text-slate-900 tracking-widest">
                    {rider.RIN}
                  </p>
                </div>

                {/* ID */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    {rider.idType?.replace("_", " ") || "ID Type"}
                  </p>
                  <p className="text-sm font-bold text-slate-800 uppercase">{rider.idNumber || "—"}</p>
                </div>

                {/* District */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    District
                  </p>
                  <p className="text-sm font-bold text-slate-800 uppercase">{rider.districtMunicipality || "—"}</p>
                </div>

                {/* Vehicle */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Vehicle
                  </p>
                  <p className="text-sm font-bold text-slate-800 uppercase">{rider.vehicleCategory || "—"}</p>
                </div>

                {/* Plate */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Plate No.
                  </p>
                  <p className="font-mono text-sm font-black text-slate-900 uppercase">{rider.plateNumber || "—"}</p>
                </div>

                {/* Expiry — full width, highlighted */}
                <div className="col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Permit Expires
                  </p>
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm font-black uppercase"
                      style={{ color: expiringSOon ? "#ca8a04" : isActive ? "#166534" : "#dc2626" }}
                    >
                      {expiry}
                    </p>
                    {expiringSOon && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-yellow-100 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                        Expiring Soon
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-5 py-2.5"
            style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}
          >
            <div className="flex items-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.dot }} />
              <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: cfg.text }}>
                Ghana Commercial Rider Registry
              </p>
            </div>
            <p className="text-[8px] font-mono text-slate-400">{time}</p>
          </div>
        </div>

        {/* Officer note */}
        <div className="mt-3 flex items-start gap-2 px-1">
          <Shield className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-relaxed">
            Verify physical ID card against the name and ID number shown above before proceeding.
          </p>
        </div>

      </div>
    </div>
  );
}