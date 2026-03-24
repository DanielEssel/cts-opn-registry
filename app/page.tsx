"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Search,
  CheckCircle,
  FileText,
  ArrowRight,
  MapPin,
  AlertCircle,
  Users,
  Lock,
  Zap,
  QrCode,
  Plus
} from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Google Font ─────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500;600&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .mono { font-family: 'DM Mono', monospace; }
        .checker {
          background-image: radial-gradient(circle, #16a34a18 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .stripe {
          background: repeating-linear-gradient(
            -55deg,
            transparent,
            transparent 10px,
            rgba(22,163,74,0.03) 10px,
            rgba(22,163,74,0.03) 20px
          );
        }
      `}</style>

     {/* ── HEADER ──────────────────────────────────────────────────────── */}
<header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
  <div className="max-w-7xl mx-auto px-6 flex h-16 items-center justify-between">
    <Link href="/" className="flex items-center gap-3">
      <div className="w-21.5 h-21.5 flex items-center justify-center">
        <Image
          src="/logo/ctslogo.png"
          alt="RIN"
          width={86}
          height={86}
          className="object-contain brightness-200"
        />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">
          CTS Africa
        </p>
        <p className="text-sm font-black text-slate-900 leading-tight">
          RIN Registry
        </p>
      </div>
    </Link>

    <nav className="flex items-center gap-2">
      <Link href="/retrieve">
        <Button
          variant="ghost"
          className="hidden sm:flex gap-2 text-slate-600 hover:text-slate-900 font-semibold"
        >
          <Search className="h-4 w-4" /> Find RIN
        </Button>
      </Link>

      <Link href="/login">
        <Button className="bg-green-700 hover:bg-green-800 text-white font-bold gap-2 shadow-sm">
          <Lock className="h-4 w-4" /> Officer Login
        </Button>
      </Link>
    </nav>
  </div>
</header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-green-50 to-white overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 checker opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-green-800 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                Greater Accra Region Pilot
              </div>

              <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-5">
                Rider
                <br />
                <span className="text-green-700">Identification</span>
                <br />
                <span className="text-yellow-500">Number System</span>
              </h1>

              <p className="text-lg text-slate-500 mb-8 max-w-md leading-relaxed">
                Official CTS digital platform for commercial transport rider
                identification in Ghana.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <Link href="/pre-register">
                  <Button
                    size="lg"
                    className="bg-green-700 hover:bg-green-800 text-white font-bold gap-2 px-7 shadow-lg shadow-green-200 h-12"
                  >
                     Register
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: "10K+", label: "Riders" },
                  { value: "100%", label: "Secure" },
                  { value: "5 min", label: "Process" },
                  { value: "99.9%", label: "Uptime" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm text-center"
                  >
                    <p className="text-xl font-black text-slate-900">{value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — vehicle grid */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="group rounded-2xl overflow-hidden shadow-xl border-4 border-green-100 hover:border-green-300 transition-all">
                  <div className="relative h-52 bg-slate-100">
                    <Image
                      src="/images/pragya.avif"
                      alt="Pragya"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="bg-white px-4 py-3 border-t border-slate-100">
                    <p className="font-black text-slate-900 text-sm">Pragya</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Three-wheeler
                    </p>
                  </div>
                </div>

                <div className="group rounded-2xl overflow-hidden shadow-xl border-4 border-yellow-100 hover:border-yellow-300 transition-all mt-8">
                  <div className="relative h-52 bg-slate-100">
                    <Image
                      src="/images/okada.jpg"
                      alt="Okada"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="bg-white px-4 py-3 border-t border-slate-100">
                    <p className="font-black text-slate-900 text-sm">Okada</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Motorbike
                    </p>
                  </div>
                </div>

                <div className="group rounded-2xl overflow-hidden shadow-xl border-4 border-blue-100 hover:border-blue-300 transition-all col-span-2">
                  <div className="relative h-48 bg-slate-100">
                    <Image
                      src="/images/aboboyaa.webp"
                      alt="Aboboyaa"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="bg-white px-4 py-3 border-t border-slate-100">
                    <p className="font-black text-slate-900 text-sm">
                      Aboboyaa
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Tricycle
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-3 -right-3 bg-green-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg rotate-6">
                All Vehicle Types
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY SECTION ──────────────────────────────────────────────────── */}
      <section style={{ background: "#0c1117" }} className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500 mb-3">
              Why This System
            </p>
            <h2 className="text-4xl font-black text-white leading-tight">
              Built for CTS's
              <br />
              <span className="text-green-500">commercial riders.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Shield,
                title: "Official System",
                body: "Government-approved platform. Every RIN issued is permanently recorded and verifiable by any officer.",
                accent: "#166534",
                light: "#f0fdf4",
              },
              {
                icon: QrCode,
                title: "Instant QR Verification",
                body: "Officers scan a QR code and instantly see the rider's permit status, photo, and vehicle details.",
                accent: "#1d4ed8",
                light: "#eff6ff",
              },
              {
                icon: Zap,
                title: "6-Month Permits",
                body: "Each registration is valid for 6 months. Renew before expiry to stay compliant and operational.",
                accent: "#b45309",
                light: "#fffbeb",
              },
            ].map(({ icon: Icon, title, body, accent, light }) => (
              <div
                key={title}
                className="rounded-2xl p-7 flex flex-col gap-4"
                style={{ background: "#161b22", border: "1px solid #21262d" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: light }}
                >
                  <Icon className="h-6 w-6" style={{ color: accent }} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white mb-1.5">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-700 mb-3">
              Registration Process
            </p>
            <h2 className="text-4xl font-black text-slate-900">
              How to get your RIN
            </h2>
            <p className="text-slate-500 mt-3">
              Registration is done through authorized operators only.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                step: "01",
                icon: MapPin,
                title: "Visit an Authorized Operator",
                body: "Find a registered government operator in your district. List available at district offices.",
              },
              {
                step: "02",
                icon: FileText,
                title: "Bring Required Documents",
                body: "Ghana Card, Driver's License, Vehicle Registration, and a passport photo.",
              },
              {
                step: "03",
                icon: Users,
                title: "Operator Registers You",
                body: "The operator inputs your information into the system on your behalf. Takes about 5 minutes.",
              },
              {
                step: "04",
                icon: CheckCircle,
                title: "Receive Your RIN Certificate",
                body: "Get your Rider Identification Number instantly with a QR code. Keep it safe for checks.",
              },
            ].map(({ step, icon: Icon, title, body }, i) => (
              <div
                key={step}
                className="flex gap-6 items-start bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-green-700 flex items-center justify-center shadow-md">
                  <span className="mono text-sm font-black text-white">
                    {step}
                  </span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="h-4 w-4 text-green-700 shrink-0" />
                    <h3 className="font-black text-slate-900">{title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {body}
                  </p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex shrink-0 items-center self-center text-slate-200">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOTICE ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div
            className="rounded-3xl p-8 flex gap-6"
            style={{ background: "#fffbeb", border: "2px solid #fde68a" }}
          >
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-md">
              <AlertCircle className="h-6 w-6 text-yellow-900" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg mb-4">
                Important Notice
              </h3>
              <ul className="space-y-2.5">
                {[
                  "Registration is FREE of charge",
                  "Only register through authorized government operators",
                  "Beware of fraudulent agents charging illegal fees",
                  "Keep your RIN safe and present it during checks",
                  "Renew your registration before the 6-month expiry date",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-slate-700"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 stripe" style={{ background: "#166534" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-300 mb-4">
            Already Registered?
          </p>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Find your Rider
            <br />
            Identification Number
          </h2>
          <p className="text-green-200 mb-10 text-lg">
            Retrieve your RIN and check your permit status online in seconds.
          </p>
          <Link href="/retrieve">
            <Button
              size="lg"
              className="bg-white hover:bg-slate-50 text-green-900 font-black gap-2 px-8 h-13 shadow-2xl text-base"
            >
              <Search className="h-5 w-5" />
              Find My RIN
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
<footer style={{ background: "#0c1117" }} className="py-16">
  <div className="max-w-6xl mx-auto px-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
      <div className="md:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          {/* Updated logo */}
          <img src="/ctslogo.png" alt="CTS Logo" className="w-9 h-9 object-contain" />
          <span className="font-black text-white text-lg">CTS Africa</span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
          Official CTS Rider Registration System. Ensuring safe, legal, and regulated commercial transport across Greater Accra.
        </p>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
          For Riders
        </p>
        <ul className="space-y-2.5">
          {[
            ["Find My RIN", "/retrieve"],
            ["Check Status", "/retrieve"],
          ].map(([label, href]) => (
            <li key={label}>
              <Link
                href={href}
                className="text-sm text-slate-400 hover:text-white transition flex items-center gap-2"
              >
                <ArrowRight className="h-3.5 w-3.5" /> {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
          For Operators
        </p>
        <ul className="space-y-2.5">
          {[
            ["Operator Login", "/login"],
            ["Register Riders", "/login"],
          ].map(([label, href]) => (
            <li key={label}>
              <Link
                href={href}
                className="text-sm text-slate-400 hover:text-white transition flex items-center gap-2"
              >
                <ArrowRight className="h-3.5 w-3.5" /> {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-xs text-slate-600">
        © {new Date().getFullYear()} CTS Africa · Rider Identification Number Registry
      </p>
      <div className="flex gap-6">
        {/* Updated Privacy link */}
        <Link
          href="/privacy-policy"
          className="text-xs text-slate-600 hover:text-white transition"
        >
          Privacy Policy
        </Link>
        <Link
          href="#"
          className="text-xs text-slate-600 hover:text-white transition"
        >
          Terms
        </Link>
        <Link
          href="#"
          className="text-xs text-slate-600 hover:text-white transition"
        >
          Contact
        </Link>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
}
