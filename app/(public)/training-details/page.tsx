"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ArrowRight,
  Clock,
  BookOpen,
  Shield,
  Users,
  CreditCard,
  Phone,
  Camera,
  FileText,
  Calendar,
  Award,
  Gift,
  MapPin,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
const FONT_BODY = { fontFamily: "'DM Sans', sans-serif" };
export default function TrainingDetailsPage() {
  return (
    // Main Container with a subtle Mesh Gradient and Grid pattern
    <div
      className="min-h-screen relative bg-[#F8FAFC] selection:bg-green-100"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* 1. THE BACKGROUND ARCHITECTURE */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Modern Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://play.tailwindcss.com/img/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        {/* Soft Organic Glows (Mesh Gradient) */}
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-green-100/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-blue-50/50 blur-[100px]" />
      </div>

      {/* 2. REFINED FLOATING HEADER */}
      <header className="sticky top-0 z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-slate-200/50" />
        <div className="relative max-w-7xl mx-auto px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 transition-transform group-hover:scale-105">
              <Image
                src="/logo/pcraa.png"
                alt="PCRAA"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div className="border-l border-slate-200 pl-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">
                PCRAA
              </p>
              <p className="text-sm font-black text-slate-900 leading-tight">
                Official Rider Registration
              </p>
            </div>
          </Link>
          <Link href="/pre-register">
            <Button className="bg-slate-900 hover:bg-green-700 text-white px-6 rounded-full font-bold text-xs transition-all duration-300 shadow-lg shadow-slate-200">
              Register Now
            </Button>
          </Link>
        </div>
      </header>

      {/* 3. MAIN CONTENT (Wrapped in a relative container to stay above background) */}
      <main className="relative max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        {/* Hero Section Refinement */}
        <div className="relative text-center mb-16 pt-8">
          {/* Abstract Background Element for Depth */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-200/30 blur-3xl rounded-full -z-10" />

          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
            Professional{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-500">
              Rider Training
            </span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Elevate your career with the most recognized commercial riding
            certification in Ghana. Complete PPE, legal ID, and expert-led
            training included.
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Clock, label: "Duration", value: "3 Weeks", color: "blue" },
            {
              icon: Calendar,
              label: "Schedule",
              value: "Weekends",
              color: "green",
            },
            {
              icon: Users,
              label: "Capacity",
              value: "50/class",
              color: "amber",
            },
            {
              icon: Award,
              label: "Certification",
              value: "Official",
              color: "purple",
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="group bg-white hover:bg-green-50/50 rounded-[2rem] p-6 transition-all duration-300 border border-slate-100 hover:border-green-200 shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              <div
                className={`h-12 w-12 rounded-2xl bg-${color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <Icon className={`h-6 w-6 text-${color}-600`} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {label}
              </p>
              <p className="text-lg font-black text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Registration Process */}
        <section className="relative bg-white rounded-[2.5rem] p-8 md:p-12 mb-16 border border-slate-100 shadow-sm overflow-hidden">
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-green-50 rounded-full blur-3xl -z-10" />

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-700" />
                </div>
                Registration Path
              </h2>
              <p className="text-slate-500 mt-2 font-medium">
                Follow these five steps to secure your certification.
              </p>
            </div>
            <div className="hidden md:block text-right">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Estimated time
              </span>
              <p className="text-sm font-bold text-slate-900">5 - 10 Minutes</p>
            </div>
          </div>

          <div className="relative">
            {/* The Vertical Connector Line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-linear-to-b from-green-600 via-green-100 to-transparent hidden sm:block" />

            <div className="space-y-12">
              {[
                {
                  step: "01",
                  title: "Access the Portal",
                  desc: "Visit the official PCRAA website to begin your application.",
                  icon: "🌐",
                  color: "bg-green-700",
                },
                {
                  step: "02",
                  title: "Initiate Registration",
                  desc: "Select the 'Commercial Rider Training' option from our service menu.",
                  icon: "🖱️",
                  color: "bg-green-600",
                },
                {
                  step: "03",
                  title: "Personnel Documentation",
                  desc: "Provide your accurate details for the official Rider ID database.",
                  subItems: [
                    "Full Legal Name",
                    "Date of Birth",
                    "Digital Passport Photo",
                    "Residential Address",
                  ],
                  icon: "📝",
                  color: "bg-green-600",
                },
                {
                  step: "04",
                  title: "Secure Fee Settlement",
                  desc: "Process your GHS 150.00 registration fee via our secure payment gateway.",
                  subItems: [
                    "MTN Momo / Telecel Cash",
                    "Automated Payment Prompt",
                    "Instant Digital Receipt",
                  ],
                  icon: "💳",
                  color: "bg-green-500",
                },
                {
                  step: "05",
                  title: "Verify & Complete",
                  desc: "Your credentials will be generated and training schedule sent via SMS.",
                  subItems: [
                    "SMS Schedule Notification",
                    "Digital Training Booklet",
                    "Official PCRAA Activation",
                  ],
                  icon: "📧",
                  color: "bg-emerald-500",
                },
              ].map(({ step, title, desc, subItems, icon, color }) => (
                <div
                  key={step}
                  className="group relative flex flex-col sm:flex-row gap-6 sm:gap-10"
                >
                  {/* Step Indicator */}
                  <div
                    className={`relative z-10 shrink-0 w-10 h-10 rounded-full ${color} text-white flex items-center justify-center font-black text-xs shadow-lg shadow-green-200 group-hover:scale-110 transition-transform`}
                  >
                    {step}
                  </div>

                  <div className="flex-1 bg-slate-50/50 rounded-2xl p-6 border border-transparent hover:border-green-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{icon}</span>
                      <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                        {title}
                      </h3>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {desc}
                    </p>

                    {subItems && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/50 rounded-xl p-4 border border-slate-100">
                        {subItems.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 text-xs font-bold text-slate-500"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Payment Details */}
        <div className="bg-amber-50 rounded-3xl p-8 mb-12 border border-amber-200">
          <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-amber-700" />
            Payment Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-3xl font-black text-amber-800 mb-2">
                GHS 150.00
              </p>
              <p className="text-sm text-slate-600">
                One-time registration fee
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  "Mobile Money payment only",
                  "Network: MTN, Vodafone, AirtelTigo",
                  "Number is prefilled on payment page",
                  "Secure payment processing",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-amber-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl p-4 border border-amber-100">
              <p className="font-bold text-slate-900 mb-2">What's included:</p>
              <ul className="space-y-2">
                {[
                  "✓ Training materials & booklets",
                  "✓ Personal Protective Equipment (PPE)",
                  "✓ Official Rider ID Card",
                  "✓ Digital Certificate",
                  "✓ 6-month registration validity",
                ].map((item) => (
                  <li key={item} className="text-sm text-slate-600">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Training Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-700" />
              Curriculum Overview
            </h3>
            <ul className="space-y-3">
              {[
                "Traffic regulations & road safety",
                "Defensive riding techniques",
                "Vehicle maintenance basics",
                "Customer service excellence",
                "Insurance & legal requirements",
                "Emergency response training",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-purple-50 rounded-3xl p-8 border border-purple-100">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-700" />
              After Training
            </h3>
            <ul className="space-y-3">
              {[
                "Receive your official PCRAA number",
                "Get your Rider ID Card",
                "Valid for 6 months",
                "Renewable online",
                "Verifiable by any officer",
                "Access to rider support",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <CheckCircle className="h-3.5 w-3.5 text-purple-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 rounded-3xl p-8 mb-12 border-2 border-yellow-200">
          <div className="flex gap-4">
            <AlertCircle className="h-8 w-8 text-yellow-700 shrink-0" />
            <div>
              <h3 className="font-black text-slate-900 text-lg mb-3">
                Important Notes
              </h3>
              <ul className="space-y-2">
                {[
                  "PCRAA number is issued AFTER successful completion of training",
                  "Training lasts for 3 weeks maximum",
                  "PPE and learning materials provided to all registered applicants",
                  "Bring your registration receipt to the training center",
                  "Limited slots available - register early",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <span className="text-yellow-600">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-linear-to-r from-green-700 to-emerald-700 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-black mb-3">Ready to Register?</h2>
          <p className="text-green-100 mb-6 max-w-md mx-auto">
            Start your journey to becoming a certified commercial rider today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pre-register">
              <Button className="bg-white hover:bg-slate-100 text-green-800 font-bold px-8 h-12 text-base">
                Register Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="border-2 border-white/30 text-green-600 hover:bg-white/50 font-bold h-12"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="text-center mt-6 sm:mt-8 space-y-2 mb-6">
        <p
          className="text-xs text-slate-400 flex items-center justify-center gap-2"
          style={FONT_BODY}
        >
          <Shield className="h-3 w-3 shrink-0" />
          Secured by PayStack · PCRAA Limited · All rights reserved
        </p>

        {/* Privacy Policy Link */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <Link
            href="/privacy-policy"
            className="text-slate-400 hover:text-emerald-600 transition-colors"
            style={FONT_BODY}
          >
            Privacy Policy
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            href="/terms"
            className="text-slate-400 hover:text-emerald-600 transition-colors"
            style={FONT_BODY}
          >
            Terms & Conditions
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            href="/data-protection"
            className="text-slate-400 hover:text-emerald-600 transition-colors"
            style={FONT_BODY}
          >
            Data Protection
          </Link>
        </div>
      </div>
    </div>
  );
}
