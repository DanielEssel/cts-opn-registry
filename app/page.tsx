"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Search,
  CheckCircle,
  FileText,
  ArrowRight,
  ClipboardCheck,
  Award,
  AlertCircle,
  UserPlus,
  Lock,
  Zap,
  QrCode,
  Plus,
  Smartphone,
  TrendingUp,
  Package,
  Bike,
  Star,
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
        .gradient-cts {
          background: linear-gradient(135deg, #16a34a 0%, #0ea5e9 100%);
        }
      `}</style>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 transition-transform group-hover:scale-105">
              <Image
  src="/logo/pcraa.png"
  alt="PCRAA"
  width={60}
  height={60}
  priority
  className="object-contain"
  style={{ width: "auto", height: "auto" }}
/>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">
                PCRAA
              </p>
              <p className="text-sm font-black text-slate-900 leading-tight">
                Progressive Certified <br /> Riders of Africa Association
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link href="/retrieve">
              <Button
                variant="ghost"
                className="hidden sm:flex gap-2 text-slate-600 hover:text-slate-900 font-semibold"
              >
                <Search className="h-4 w-4" /> Find Your RIN
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
      <section className="relative bg-linear-to-b from-green-50 to-white overflow-hidden py-14 md:py-18">
        <div className="absolute inset-0 checker opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-green-800 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                Greater Accra Region Pilot
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.05] tracking-tight mb-5">
                Progressive Certified
                <br />
                <span className="text-green-700"> Riders of Africa </span>
                <br />
                <span className="text-yellow-500">Association (PCRAA)</span>
              </h1>

              <p className="text-lg text-slate-500 mb-8 max-w-md leading-relaxed">
                Official PCRAA digital platform for commercial transport rider
                identification in Ghana.
              </p>

              {/* Updated Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <Link href="/pre-register">
                  <Button
                    size="lg"
                    className="bg-green-700 hover:bg-green-800 text-white font-bold gap-2 px-8 shadow-lg shadow-green-200 h-12 text-base"
                  >
                    Register Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/training-details">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-green-200 text-green-700 font-bold hover:bg-green-50 h-12 text-base"
                  >
                    View Training Information
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
                    className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm text-center hover:shadow-md transition-shadow"
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
                      priority // ← add (implies eager loading + preload)
                      sizes="(max-width: 768px) 100vw, 33vw"
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
                      priority // ← add (implies eager loading + preload)
                      sizes="(max-width: 768px) 100vw, 33vw"
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
                      priority // ← add (implies eager loading + preload)
                      sizes="(max-width: 768px) 100vw, 33vw"
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
                Drivers of Vehicle Types
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTS DRIVER SHOWCASE SECTION (NEW) ──────────────────────────── */}
      <section className="py-20 bg-linear-to-br from-slate-900 via-slate-800 to-green-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #16a34a 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-linear-to-r from-green-500/20 to-sky-500/20 border border-green-400/30 text-green-300 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
                <Smartphone className="h-3 w-3" />
                Powered by CTS Africa
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
                Turn Your Certification
                <br />
                <span className="bg-linear-to-r from-green-400 to-sky-400 bg-clip-text text-transparent">
                  Into Daily Earnings
                </span>
              </h2>

              <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
                The <strong className="text-white">CTS Driver App</strong> is
                the official working platform for certified PCRAA riders. Accept
                rides, deliver parcels, and handle gas cylinder orders — all
                from one professional app.
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  {
                    icon: Bike,
                    label: "Ride Hailing",
                    color: "text-green-400",
                  },
                  {
                    icon: Package,
                    label: "Parcel Delivery",
                    color: "text-sky-400",
                  },
                  {
                    icon: TrendingUp,
                    label: "Gas Delivery",
                    color: "text-amber-400",
                  },
                  {
                    icon: Zap,
                    label: "Instant Payouts",
                    color: "text-purple-400",
                  },
                ].map(({ icon: Icon, label, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10"
                  >
                    <Icon className={`h-5 w-5 ${color}`} />
                    <span className="text-sm font-semibold text-slate-200">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link href="/app-showcase">
                <Button className="gradient-cts text-white font-bold px-8 py-6 text-lg rounded-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300 group">
                  <Smartphone className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Explore CTS Driver App App
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Right - App Mockup/Visual */}
            <div className="relative">
              <div className="relative mx-auto w-72 h-125 bg-slate-800 rounded-[3rem] border-4 border-slate-700 shadow-2xl overflow-hidden">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10" />

                {/* App Screen Content */}
                <div className="pt-10 px-4 h-full bg-linear-to-b from-green-900 to-slate-900">
                  {/* App Header */}
                  <div className="flex items-center justify-between mb-6 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Bike className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-white font-bold text-sm">
                        CTS Driver App
                      </span>
                    </div>
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-yellow-900" />
                    </div>
                  </div>

                  {/* Balance Card */}
                  <div className="bg-linear-to-r from-green-600 to-green-700 rounded-2xl p-4 mb-4">
                    <p className="text-green-200 text-xs font-medium">
                      Available Balance
                    </p>
                    <p className="text-white text-2xl font-black">₵ 1,840.00</p>
                    <div className="flex gap-2 mt-3">
                      <button className="bg-white/20 text-white text-xs px-3 py-1 rounded-lg backdrop-blur-sm">
                        Withdraw
                      </button>
                      <button className="bg-white/20 text-white text-xs px-3 py-1 rounded-lg backdrop-blur-sm">
                        History
                      </button>
                    </div>
                  </div>

                  {/* Service Cards */}
                  <div className="space-y-3">
                    <div className="bg-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <Bike className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">
                          Ride Request
                        </p>
                        <p className="text-slate-400 text-xs">
                          ₵45 • 2.3 km away
                        </p>
                      </div>
                      <button className="bg-green-500 text-white text-xs px-3 py-1 rounded-lg font-semibold">
                        Accept
                      </button>
                    </div>

                    <div className="bg-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">
                          Parcel Delivery
                        </p>
                        <p className="text-slate-400 text-xs">
                          ₵35 • 1.8 km away
                        </p>
                      </div>
                      <button className="bg-sky-500 text-white text-xs px-3 py-1 rounded-lg font-semibold">
                        Accept
                      </button>
                    </div>

                    <div className="bg-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">
                          Gas Delivery
                        </p>
                        <p className="text-slate-400 text-xs">
                          ₵60 • 4.1 km away
                        </p>
                      </div>
                      <button className="bg-amber-500 text-white text-xs px-3 py-1 rounded-lg font-semibold">
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                3 New Requests
              </div>
              <div className="absolute -bottom-4 -right-4 bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                🎯 4.9 ★ Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRAINING SECTION ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-700 mb-3">
              Training Program
            </p>
            <h2 className="text-4xl font-black text-slate-900">
              Professional Rider Training
            </h2>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
              Comprehensive 3-week training program for commercial riders in
              Greater Accra
            </p>
          </div>

          {/* Vehicle Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: "Okada Riders",
                type: "Motorcycle",
                icon: "🏍️",
                color: "amber",
                description:
                  "Professional motorcycle training for commercial transport",
              },
              {
                title: "Aboboyaa Drivers",
                type: "Tricycle",
                icon: "🛺",
                color: "blue",
                description: "Tricycle operation and safety certification",
              },
              {
                title: "Quadricycle Drivers",
                type: "4-Wheel",
                icon: "🚗",
                color: "purple",
                description: "Quadricycle training for urban transport",
              },
            ].map(({ title, type, icon, color, description }) => (
              <div
                key={title}
                className={`rounded-2xl p-6 border-2 border-${color}-100 bg-linear-to-br from-${color}-50/30 to-white shadow-lg hover:shadow-xl transition-all group cursor-pointer`}
              >
                <div className="text-5xl mb-3">{icon}</div>
                <h3 className="text-xl font-black text-slate-900 mb-1">
                  {title}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  {type}
                </p>
                <p className="text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pre-register">
              <Button className="bg-green-700 hover:bg-green-800 text-white font-bold px-8 h-12 text-base">
                Register for Training
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/training-details">
              <Button
                variant="outline"
                className="border-2 border-green-200 text-green-700 font-bold hover:bg-green-50 h-12 text-base"
              >
                Read More
                <Plus className="h-4 w-4 ml-2" />
              </Button>
            </Link>
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
              Built for PCRAA's
              <br />
              <span className="text-green-500">commercial riders.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Shield,
                title: "Official System",
                body: "Government-approved platform. Every PCRAA issued is permanently recorded and verifiable by any officer.",
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
                body: "Each registration is valid for 6 months. Renewal at your assembly every 6 months.",
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

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-700 mb-3">
              Registration Process
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Become a Registered PCRAA Member
            </h2>
            <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              Complete your membership registration online in just a few simple
              steps and enroll for upcoming PCRAA training programs.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                step: "01",
                icon: UserPlus,
                title: "Create Your Account",
                body: "Sign up using your email address or mobile number to start your PCRAA membership application.",
              },
              {
                step: "02",
                icon: FileText,
                title: "Complete Your Profile",
                body: "Provide your personal details and upload the required documents, including your Ghana Card, Driver's License, Vehicle Registration, and passport photograph.",
              },
              {
                step: "03",
                icon: ClipboardCheck,
                title: "Submit Your Application",
                body: "Review your information carefully and submit your application for verification and approval.",
              },
              {
                step: "04",
                icon: Award,
                title: "Receive Your Membership",
                body: "Once approved, you'll receive your official PCRAA Membership Certificate with a unique QR code and can register for upcoming training programs.",
              },
            ].map(({ step, icon: Icon, title, body }, i) => (
              <div
                key={step}
                className="flex gap-6 items-start bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-green-700 flex items-center justify-center shadow-md">
                  <span className="mono text-sm font-black text-white">
                    {step}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-green-700 shrink-0" />
                    <h3 className="text-lg font-bold text-slate-900">
                      {title}
                    </h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{body}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex items-center self-center text-slate-300">
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
                  "Training registration requires a fee - GHS 400.00",
                  "Only register through authorized government operators",
                  "Beware of fraudulent agents charging illegal fees",
                  "Keep your PCRAA safe and present it during checks",
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
            Retrieve your PCRAA and check your permit status online in seconds.
          </p>
          <Link href="/retrieve">
            <Button
              size="lg"
              className="bg-white hover:bg-slate-50 text-green-900 font-black gap-2 px-8 h-13 shadow-2xl text-base"
            >
              <Search className="h-5 w-5" />
              Find My PCRAA
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
                <img
                  src="/pcraa.png"
                  alt="PCRAA Logo"
                  className="w-9 h-9 object-contain"
                />
                <span className="font-black text-white text-lg">PCRAA</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                Progressive Certified Riders of Africa Association. Ensuring
                safe, legal, and regulated commercial transport across Greater
                Accra.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                For Riders
              </p>
              <ul className="space-y-2.5">
                {[
                  ["Find My PCRAA", "/retrieve"],
                  ["CTS Driver App App", "/cts-driver"],
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
              © {new Date().getFullYear()} PCRAA · Progressive Certified Riders
              of Africa Association Registry
            </p>
            <div className="flex gap-6">
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
