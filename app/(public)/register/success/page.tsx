"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Download, Printer, ArrowRight } from "lucide-react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react" // Ensure you've run: npm install qrcode.react

export default function SuccessPage() {
  const opn = "KS-1001-02-2026";
  
  // This is the URL that police/officials will scan to verify the rider
  const verificationUrl = `https://permittrack.gov.gh/verify/${opn}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Registration Complete!</h1>
          <p className="text-slate-500 mt-2">Your Operating Permit Number (OPN) has been generated successfully.</p>
        </div>

        {/* The Digital Permit Card */}
        <Card className="border-2 border-green-200 bg-white overflow-hidden shadow-2xl relative">
          <div className="bg-green-600 py-3 px-4 text-white flex justify-between items-center">
            <span className="text-xs font-bold tracking-widest uppercase">Official Operating Permit</span>
            <span className="text-[10px] opacity-80 font-semibold uppercase">Ghana MMDCE</span>
          </div>
          
          <CardContent className="p-8">
            <div className="flex justify-between items-start gap-4 mb-6 text-left">
              <div className="space-y-1">
                <p className="text-sm text-slate-400 font-medium uppercase tracking-tighter">Your Unique OPN</p>
                <p className="text-3xl font-mono font-black text-slate-900 tracking-tight">{opn}</p>
              </div>
              
              {/* THE QR CODE INTEGRATION */}
              <div className="bg-white p-1.5 border-2 border-slate-100 rounded-xl shadow-sm">
                <QRCodeSVG 
                  value={verificationUrl} 
                  size={80}
                  level="H" // High error correction for better scanning on mobile
                  includeMargin={false}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-left border-t pt-6">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Rider Name</p>
                <p className="text-sm font-semibold text-slate-800">Kwesi Mensah</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Expiry Date</p>
                <p className="text-sm font-semibold text-red-600">Aug 10, 2026</p>
              </div>
            </div>

            {/* Verification Note */}
            <div className="mt-6 pt-4 border-t border-dashed">
              <p className="text-[9px] text-slate-400 uppercase leading-tight">
                Scan QR code to verify authenticity via the National Permit Registry portal.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12 border-slate-200 hover:bg-slate-50 shadow-sm transition-all">
            <Download className="mr-2 h-4 w-4" /> Save PDF
          </Button>
          <Button variant="outline" className="h-12 border-slate-200 hover:bg-slate-50 shadow-sm transition-all">
            <Printer className="mr-2 h-4 w-4" /> Print Slip
          </Button>
        </div>

        <Link href="/register" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
          Register another rider <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}