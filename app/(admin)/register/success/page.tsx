"use client"

import { useSearchParams } from "next/navigation"
import { useRef } from "react"
import { tRINg } from "html-to-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Download, Printer, ArrowRight, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const permitRef = useRef<HTMLDivElement>(null)
  
  const RIN = searchParams.get("RIN") || "PENDING";
  const riderName = searchParams.get("name") || "Valued Rider";
  const town = searchParams.get("town") || "N/A";

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://permittrack.gov.gh';
  const verificationUrl = `${baseUrl}/verify/${RIN}`;

  // 1. SAVE AS IMAGE FUNCTION
  const saveAsImage = async () => {
    if (!permitRef.current) return;

    try {
      // We add a slight delay to ensure the QR code is fully rendered
      const dataUrl = await tRINg(permitRef.current, { 
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2, // Higher quality image
      });
      
      const link = document.createElement('a');
      link.download = `Permit-${RIN}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to save image', err);
      alert("Error generating image. Try printing to PDF instead.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Success Header (Hidden on Print) */}
        <div className="flex flex-col items-center no-print">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Success!</h1>
          <p className="text-slate-500 mt-2">Permit is now active.</p>
        </div>

        {/* THE DIGITAL PE CARD */}
        {/* Added ref={permitRef} and 'print-card' class */}
        <Card 
          ref={permitRef} 
          className="border-none bg-white overflow-hidden shadow-2xl relative rounded-3xl print-card"
        >
          {/* Header Banner */}
          <div className="bg-slate-900 py-4 px-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Digital Rider Registration</span>
            </div>
            <span className="text-[9px] opacity-60 font-bold uppercase tracking-tighter">Republic of Ghana</span>
          </div>
          
          <CardContent className="p-8">
            <div className="flex justify-between items-start gap-4 mb-8 text-left">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Unique RIN</p>
                <p className="text-3xl font-mono font-black text-blue-600 tracking-tighter uppercase">
                  {RIN}
                </p>
              </div>
              
              <div className="bg-white p-2 border shadow-sm rounded-2xl">
                <QRCodeSVG value={verificationUrl} size={90} level="H" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 text-left border-t border-slate-100 pt-6">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Rider Name</p>
                <p className="text-base font-bold text-slate-900 truncate">{riderName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Town/District</p>
                <p className="text-base font-bold text-slate-900">{town}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Issued Date</p>
                <p className="text-sm font-semibold text-slate-700">
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Status</p>
                <div className="flex items-center gap-1 text-green-600">
                  <span className="h-2 w-2 bg-green-600 rounded-full" />
                  <p className="text-sm font-bold italic">Active</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-dashed border-slate-200">
              <p className="text-[8px] text-slate-400 uppercase leading-relaxed font-medium">
                Official valid digital permit. Scan QR code to verify authenticity.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons (Hidden on Print) */}
        <div className="grid grid-cols-2 gap-4 no-print">
          <Button 
            variant="outline" 
            className="h-14 rounded-2xl border-slate-200 font-bold shadow-sm"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4 text-slate-500" /> Print Slip
          </Button>
          <Button 
            className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold"
            onClick={saveAsImage}
          >
            <Download className="mr-2 h-4 w-4" /> Save Image
          </Button>
        </div>

        <div className="pt-4 no-print">
          <Link href="/register" className="group inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600">
            New Registration <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 2. CRITICAL PRINT STYLES */}
      <style jsx global>{`
        @media print {
          /* Hide everything else */
          body {
            background: white !important;
          }
          nav, .no-print, button, a {
            display: none !important;
          }
          /* Center the card on the printed page */
          .print-card {
            position: absolute;
            top: 0;
            left: 0;
            width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            margin: 0 !important;
          }
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
    </div>
  )
}