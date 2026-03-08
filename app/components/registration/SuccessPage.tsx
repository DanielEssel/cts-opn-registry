"use client";

import { useRef, useState } from "react";
import { tRINg } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Download,
  Printer,
  ArrowRight,
  ShieldCheck,
  Copy,
  Clock,
  User,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

interface SuccessPageProps {
  RIN: string;
  name: string;
  town: string;
}

export function SuccessPage({ RIN, name, town }: SuccessPageProps) {
  const permitRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://permittrack.gov.gh";
  const verificationUrl = `${baseUrl}/verify/${RIN}`;

  const issueDate = new Date();
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 6);

  const saveAsImage = async () => {
    if (!permitRef.current) return;

    try {
      const dataUrl = await tRINg(permitRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `RIN-${RIN}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to save image", err);
      alert("Error generating image. Try printing to PDF instead.");
    }
  };

  const copyRIN = () => {
    navigator.clipboard.writeText(RIN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-700 relative z-10">
        {/* Success Header */}
        <div className="text-center space-y-4 no-print">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-green-100 rounded-full blur-2xl opacity-60 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
          </div>

          <div>
            <h1 className="text-5xl font-black text-gray-900 mb-2">
              Successfully Registered!
            </h1>
            <p className="text-lg text-gray-600">
              Your Rider Identification Number is now active
            </p>
          </div>
        </div>

        {/* THE PREMIUM RIDER IDENTIFICATION NUMBER CARD */}
        <Card
          ref={permitRef}
          className="border-none bg-white overflow-hidden shadow-2xl rounded-3xl print-card"
        >
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-6 px-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
            </div>

            <div className="relative flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-green-400">
                    Rider Registration
                  </p>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-slate-400 font-semibold">
                    Active Status
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[9px] opacity-70 font-bold uppercase tracking-tighter">
                  Republic of Ghana
                </p>
                <p className="text-[9px] opacity-50 font-semibold">
                  Ministry of Transport
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-8 space-y-8">
            {/* RIN Section */}
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                Your RIN Number
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-4xl font-mono font-black text-green-600 tracking-wider">
                    {RIN}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Valid for 6 months from issuance
                  </p>
                </div>
                <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                  
                    <QRCodeSVG value={verificationUrl} size={100} level="H" />
                  
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-slate-200" />

            {/* Rider Information Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Rider Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Rider Name
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">{name}</p>
              </div>

              {/* Town/District */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    District
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">{town}</p>
              </div>

              {/* Issued Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Issued Date
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {issueDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Expiry Date
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {expiryDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100 font-bold">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-slate-500 ml-auto">
                Verified & Authenticated
              </p>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-dashed border-slate-200 space-y-2">
              <p className="text-[9px] text-slate-400 leading-relaxed">
                This is a valid digital permit. Present this on your mobile
                device or printed copy during verification checks. Scan the QR
                code to verify authenticity.
              </p>
              <p className="text-[8px] text-slate-300 font-medium">
                RIN Registry System © 2024 | Republic of Ghana
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 no-print">
          <Button
            variant="outline"
            className="h-12 rounded-xl border-2 border-slate-200 font-semibold hover:bg-slate-50"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>

          <Button
            className="h-12 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg font-semibold"
            onClick={saveAsImage}
          >
            <Download className="mr-2 h-4 w-4" /> Save
          </Button>

          <Button
            variant="outline"
            className={`h-12 rounded-xl border-2 font-semibold transition-all ${
              copied
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-slate-200 hover:bg-slate-50"
            }`}
            onClick={copyRIN}
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Copied" : "Copy RIN"}
          </Button>
        </div>

        {/* Next Steps Info */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200/50 p-6 no-print space-y-3">
          <h3 className="font-bold text-gray-900">What's Next?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Save or print your RIN for your records</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">2.</span>
              <span>Present your RIN during verification checks</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Renew your RIN before expiry date</span>
            </li>
          </ul>
        </div>

        {/* Navigation Links */}
        <div className="flex justify-between items-center no-print pt-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-semibold text-green-600 hover:text-green-700"
          >
            ← Back to Home
          </Link>
          <Link
            href="/register"
            className="group inline-flex items-center text-sm font-semibold text-green-600 hover:text-green-700"
          >
            Register Another{" "}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          * {
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }
          @page {
            margin: 0;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
