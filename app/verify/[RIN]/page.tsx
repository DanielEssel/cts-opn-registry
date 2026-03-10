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
    label:      "ACTIVE — VALID PERMIT",
    icon:       CheckCircle2,
    dot:        "#16a34a",
    ping:       "#bbf7d0",
    bannerBg:   "#f0fdf4",
    bannerBorder: "#bbf7d0",
    bannerText: "#166534",
    chip:       "bg-emerald-100 text-emerald-800 border border-emerald-200",
    ringColor:  "#16a34a",
  },
  Expired: {
    label:      "EXPIRED — NOT VALID",
    icon:       XCircle,
    dot:        "#dc2626",
    ping:       "#fecaca",
    bannerBg:   "#fef2f2",
    bannerBorder: "#fecaca",
    bannerText: "#991b1b",
    chip:       "bg-red-100 text-red-800 border border-red-200",
    ringColor:  "#dc2626",
  },
  Suspended: {
    label:      "SUSPENDED — NOT VALID",
    icon:       Shield,
    dot:        "#ea580c",
    ping:       "#fed7aa",
    bannerBg:   "#fff7ed",
    bannerBorder: "#fed7aa",
    bannerText: "#9a3412",
    chip:       "bg-orange-100 text-orange-800 border border-orange-200",
    ringColor:  "#ea580c",
  },
  Pending: {
    label:      "PENDING APPROVAL",
    icon:       Clock,
    dot:        "#ca8a04",
    ping:       "#fef08a",
    bannerBg:   "#fefce8",
    bannerBorder: "#fde68a",
    bannerText: "#854d0e",
    chip:       "bg-yellow-100 text-yellow-800 border border-yellow-200",
    ringColor:  "#ca8a04",
  },
};

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <p className="text-xs font-bold text-slate-800 uppercase leading-snug">{value || "—"}</p>
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

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-200" />
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin absolute" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
          Verifying Permit...
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
        RIN <span className="font-mono font-black">{RIN}</span> not found
        in the national registry.
      </p>
      <div className="mt-5 px-5 py-3 bg-red-600 rounded-2xl text-xs font-black text-white uppercase tracking-wider shadow-lg shadow-red-200">
        ⚠ Do not allow this rider to operate
      </div>
      <button onClick={() => window.location.reload()}
        className="mt-4 text-xs font-bold text-red-400 underline underline-offset-2">
        Retry
      </button>
    </div>
  );

  const cfg        = STATUS_CONFIG[rider.status] ?? STATUS_CONFIG.Pending;
  const StatusIcon = cfg.icon;
  const isActive   = rider.status === "Active";

  const fmt = (d?: string) => d
    ? new Date(d).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-4 px-3 md:justify-center md:py-8 md:px-4">
      <div className="w-full" style={{ maxWidth: 700 }}>

        {/* ── STATUS BANNER — big and clear for officers ─────────────────── */}
        <div
          className="rounded-2xl px-4 py-3 mb-3 flex items-center gap-3 border"
          style={{
            background:   cfg.bannerBg,
            borderColor:  cfg.bannerBorder,
          }}
        >
          <span className="relative flex h-3 w-3 shrink-0">
            {isActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: cfg.ping }} />
            )}
            <span className="relative inline-flex rounded-full h-3 w-3"
              style={{ background: cfg.dot }} />
          </span>
          <p className="text-sm font-black uppercase tracking-widest" style={{ color: cfg.bannerText }}>
            {cfg.label}
          </p>
          <StatusIcon className="h-5 w-5 ml-auto shrink-0" style={{ color: cfg.dot }} />
        </div>

        {/* ── CARD ───────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background:  "#ffffff",
            boxShadow:   "0 8px 40px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.8)",
            border:      "1px solid #e2e8f0",
          }}
        >
          {/* Green top stripe */}
          <div style={{ height: 5, background: "linear-gradient(90deg,#166534,#15803d)" }} />

          {/* ── MOBILE layout (stacked) / DESKTOP layout (horizontal) ──── */}
          <div className="flex flex-col md:flex-row">

            {/* ── LEFT: Photo + QR ─────────────────────────────────────── */}
            <div
              className="flex flex-row md:flex-col items-center justify-center gap-4 md:gap-4 px-5 py-5 md:py-6"
              style={{ borderBottom: "1px solid #e2e8f0", borderRight: "none" }}
            >
              {/* Photo */}
              <div
                className="rounded-xl overflow-hidden shrink-0"
                style={{
                  width: 80, height: 96,
                  boxShadow: `0 0 0 3px ${cfg.ringColor}, 0 4px 16px rgba(0,0,0,0.12)`,
                }}
              >
                {rider.passportPhotoUrl ? (
                  <img src={rider.passportPhotoUrl} alt="Photo"
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <User className="h-8 w-8 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Name visible on mobile next to photo */}
              <div className="md:hidden flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-green-700 mb-0.5">
                  Full Legal Name
                </p>
                <p className="text-lg font-black text-slate-900 uppercase leading-tight">
                  {rider.fullName}
                </p>
                {rider.phoneNumber && (
                  <p className="text-xs text-slate-400 font-semibold mt-1">{rider.phoneNumber}</p>
                )}
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                  style={{ background: cfg.bannerBg, borderColor: cfg.bannerBorder, color: cfg.bannerText }}>
                  <span className="relative flex h-1.5 w-1.5">
                    {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: cfg.ping }} />}
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: cfg.dot }} />
                  </span>
                  {rider.status}
                </div>
              </div>

              {/* QR — hidden on mobile, shown on desktop */}
              {rider.qrCodeUrl && (
                <div className="hidden md:block p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm mt-1">
                  <img src={rider.qrCodeUrl} alt="QR" style={{ width: 64, height: 64, display: "block" }} />
                </div>
              )}
            </div>

            {/* ── CENTER: Name (desktop) + details ─────────────────────── */}
            <div className="flex-1 px-5 py-5 min-w-0"
              style={{ borderBottom: "1px solid #e2e8f0" }}>

              {/* Name — desktop only */}
              <div className="hidden md:block mb-4">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-green-700 mb-0.5">
                  Full Legal Name
                </p>
                <h1 className="text-xl font-black text-slate-900 uppercase leading-tight">
                  {rider.fullName}
                </h1>
                {rider.phoneNumber && (
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{rider.phoneNumber}</p>
                )}
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                  style={{ background: cfg.bannerBg, borderColor: cfg.bannerBorder, color: cfg.bannerText }}>
                  <span className="relative flex h-1.5 w-1.5">
                    {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: cfg.ping }} />}
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: cfg.dot }} />
                  </span>
                  {rider.status}
                </div>
              </div>

              {/* Details — 2 cols on mobile, 3 cols on desktop */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
                <Field label="District"   value={rider.districtMunicipality}      />
                <Field label="Town"       value={rider.residentialTown}           />
                <Field label="Gender"     value={rider.gender}                    />
                <Field label="ID Type"    value={rider.idType?.replace("_", " ")} />
                <Field label="ID Number"  value={rider.idNumber}                  />
                <Field label="Vehicle"    value={rider.vehicleCategory}           />
              </div>
            </div>

            {/* ── RIGHT: RIN + dates ───────────────────────────────────── */}
            <div
              className="grid grid-cols-2 md:flex md:flex-col md:justify-between gap-4 px-5 py-5 md:w-44 md:shrink-0"
              style={{ borderTop: "none", borderLeft: "none", background: "#fafafa" }}
            >
              {/* RIN */}
              <div className="col-span-2 md:col-span-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-green-700 mb-0.5">
                  Rider ID No.
                </p>
                <p className="font-mono font-black text-slate-900 text-sm tracking-widest">
                  {rider.RIN}
                </p>
              </div>

              <Field label="Plate No."  value={rider.plateNumber}    />
              <Field label="Issued"     value={fmt(rider.issueDate)}  />
              <Field label="Expires"    value={fmt(rider.expiryDate)} />

              {/* QR on mobile — shown in right column */}
              {rider.qrCodeUrl && (
                <div className="md:hidden col-span-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">QR Code</p>
                  <div className="p-1 bg-white rounded-lg border border-slate-200 shadow-sm inline-block">
                    <img src={rider.qrCodeUrl} alt="QR" style={{ width: 52, height: 52, display: "block" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom bar ──────────────────────────────────────────────── */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-5 py-2.5"
            style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}
          >
            <div className="flex items-center gap-1.5">
              <StatusIcon className="h-3 w-3 shrink-0" style={{ color: cfg.dot }} />
              <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: cfg.bannerText }}>
                {isActive
                  ? "Authenticated record · Ghana Commercial Rider Registry"
                  : `${rider.status} · This permit is not currently valid`}
              </p>
            </div>
            <p className="text-[8px] font-mono text-slate-400 shrink-0">
              Verified · {time}
            </p>
          </div>
        </div>

        {/* Law enforcement note */}
        <div className="mt-3 flex items-start gap-2 px-1">
          <Shield className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-relaxed">
            Law Enforcement: Always verify physical ID card against the name and ID number shown above.
          </p>
        </div>

      </div>
    </div>
  );
}