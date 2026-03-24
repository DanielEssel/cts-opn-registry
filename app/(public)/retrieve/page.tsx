"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Search, ArrowLeft, Copy, CheckCircle2, XCircle, Clock, Loader2, Shield } from "lucide-react";
import Link from "next/link";

interface RiderResult {
  RIN:                  string;
  fullName:             string;
  status:               "Active" | "Expired" | "Suspended" | "Pending";
  expiryDate:           string;
  issueDate:            string;
  vehicleCategory:      string;
  districtMunicipality: string;
}

const STATUS_CONFIG = {
  Active:    { icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", text: "Valid & Active"         },
  Expired:   { icon: XCircle,      color: "#dc2626", bg: "#fef2f2", border: "#fecaca", text: "Permit Expired"         },
  Suspended: { icon: Shield,       color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", text: "Permit Suspended"       },
  Pending:   { icon: Clock,        color: "#ca8a04", bg: "#fefce8", border: "#fde047", text: "Pending Approval"       },
};

export default function RetrieveRIN() {
  const [phone,   setPhone]   = useState("");
  const [idNum,   setIdNum]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<RiderResult | null>(null);
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Search by phone number + ID number
      const snap = await getDocs(
        query(
          collection(db, "riders"),
          where("phoneNumber", "==", phone.trim()),
          where("idNumber",    "==", idNum.trim()),
          limit(1)
        )
      );

      if (snap.empty) {
        setError("No rider found with those details. Please check your phone number and ID number.");
      } else {
        const data = snap.docs[0].data();
        setResult({
          RIN:                  data.RIN,
          fullName:             data.fullName,
          status:               data.status,
          expiryDate:           data.expiryDate,
          issueDate:            data.issueDate,
          vehicleCategory:      data.vehicleCategory,
          districtMunicipality: data.districtMunicipality,
        });
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyRIN = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.RIN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const cfg = result ? STATUS_CONFIG[result.status] ?? STATUS_CONFIG.Pending : null;
  const StatusIcon = cfg?.icon;

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#0c1117" }}>

      {/* ── Top nav ──────────────────────────────────────────────────────── */}
      <div className="px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full" style={{ maxWidth: 440 }}>

          {/* Header */}
          {!result && (
            <div className="mb-10 text-center">
              <h1
                className="font-black text-white mb-2"
                style={{ fontSize: 28, letterSpacing: "-0.02em" }}
              >
                Find Your RIN
              </h1>
              <p className="text-sm text-slate-400">
                Enter your registered phone number and ID to retrieve your permit.
              </p>
            </div>
          )}

          {/* ── Form ─────────────────────────────────────────────────────── */}
          {!result ? (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#161b22",
                border: "1px solid #21262d",
                boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
              }}
            >
              <form onSubmit={handleLookup} className="p-7 space-y-5">

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="024 XXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white placeholder-slate-600 outline-none transition-all"
                    style={{
                      background: "#0d1117",
                      border: "1px solid #30363d",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#16a34a"}
                    onBlur={(e)  => e.target.style.borderColor = "#30363d"}
                  />
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    ID Number (Ghana Card / Voter ID / Passport)
                  </label>
                  <input
                    type="text"
                    placeholder="GHA-XXXXXXXXX-X"
                    value={idNum}
                    onChange={(e) => setIdNum(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white placeholder-slate-600 outline-none transition-all"
                    style={{
                      background: "#0d1117",
                      border: "1px solid #30363d",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#16a34a"}
                    onBlur={(e)  => e.target.style.borderColor = "#30363d"}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="px-4 py-3 rounded-xl text-xs font-semibold text-red-400"
                    style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !phone || !idNum}
                  className="w-full py-3.5 rounded-xl text-sm font-black text-white uppercase tracking-widest transition-all disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg,#166534,#15803d)",
                    boxShadow: loading ? "none" : "0 4px 20px rgba(22,101,52,0.4)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Search className="h-4 w-4" />
                      Find My RIN
                    </span>
                  )}
                </button>
              </form>

              {/* Bottom note */}
              <div
                className="px-7 py-4 flex items-center gap-2"
                style={{ borderTop: "1px solid #21262d" }}
              >
                <Shield className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                <p className="text-[10px] text-slate-600 font-medium">
                  Your details are only used to retrieve your permit and are never stored by this page.
                </p>
              </div>
            </div>
          ) : (
            /* ── Result ──────────────────────────────────────────────────── */
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#161b22",
                border: "1px solid #21262d",
                boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
              }}
            >
              {/* Status banner */}
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{ background: cfg!.bg, borderBottom: `1px solid ${cfg!.border}` }}
              >
                {StatusIcon && <StatusIcon className="h-5 w-5 shrink-0" style={{ color: cfg!.color }} />}
                <div>
                  <p className="text-sm font-black uppercase tracking-wider" style={{ color: cfg!.color }}>
                    {cfg!.text}
                  </p>
                  <p className="text-[10px] font-semibold" style={{ color: cfg!.color, opacity: 0.7 }}>
                    {result.fullName}
                  </p>
                </div>
              </div>

              <div className="p-7 space-y-5">

                {/* RIN display */}
                <div
                  className="rounded-xl p-5 text-center"
                  style={{ background: "#0d1117", border: "1px solid #30363d" }}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">
                    Rider Identification Number
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <p
                      className="font-mono font-black text-white"
                      style={{ fontSize: 26, letterSpacing: "0.08em" }}
                    >
                      {result.RIN}
                    </p>
                    <button
                      onClick={copyRIN}
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: copied ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.05)" }}
                    >
                      <Copy className="h-4 w-4" style={{ color: copied ? "#16a34a" : "#64748b" }} />
                    </button>
                  </div>
                  {copied && (
                    <p className="text-[10px] text-green-500 font-bold mt-1">Copied!</p>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Vehicle",  value: result.vehicleCategory      },
                    { label: "District", value: result.districtMunicipality },
                    { label: "Issued",   value: fmt(result.issueDate)        },
                    { label: "Expires",  value: fmt(result.expiryDate)       },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl px-4 py-3"
                      style={{ background: "#0d1117", border: "1px solid #21262d" }}
                    >
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        {label}
                      </p>
                      <p className="text-xs font-bold text-white uppercase">{value || "—"}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setResult(null); setPhone(""); setIdNum(""); setError(""); }}
                    className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-white"
                    style={{ background: "#0d1117", border: "1px solid #30363d" }}
                  >
                    Search Again
                  </button>
                  <Link
                    href={`/verify/${result.RIN}`}
                    className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white text-center transition-all"
                    style={{
                      background: "linear-gradient(135deg,#166534,#15803d)",
                      boxShadow: "0 4px 16px rgba(22,101,52,0.35)",
                    }}
                  >
                    View Full Permit
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">
          CTS Commercial Rider Registry
        </p>
      </div>
    </div>
  );
}