"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  BadgeIcon,
  Calendar,
  Phone,
  FileText,
  Copy,
  Download,
} from "lucide-react";
import Link from "next/link";

export default function RetrieveRIN() {
  const [phone, setPhone] = useState("");
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { 
    RIN: string; 
    expiry: string;
    status: "Active" | "Expired" | "Pending";
    name: string;
    registeredDate: string;
  }>(null);
  const [copied, setCopied] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API Call
    setTimeout(() => {
      setResult({
        RIN: "KS-1001-02-2026",
        expiry: "August 10, 2026",
        status: "Active",
        name: "John Doe",
        registeredDate: "August 10, 2024",
      });
      setLoading(false);
    }, 1500);
  };

  const handleCopyRIN = () => {
    if (result?.RIN) {
      navigator.clipboard.writeText(result.RIN);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">

      {/* MAIN CONTENT */}
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="max-w-md w-full relative z-10">
          {/* BACK LINK */}
          <Link 
            href="/" 
            className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 mb-6 transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
            Back to Home
          </Link>

          {/* HEADER */}
          {!result && (
            <div className="text-center mb-8 animate-in fade-in duration-700">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-lg shadow-green-200">
                  <Search className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                Find Your RIN
              </h2>
              <p className="text-gray-600">
                Look up your Rider Identification Number instantly
              </p>
            </div>
          )}

          {/* CARD */}
          <Card className="border-green-200/50 bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {!result ? (
              <>
                {/* FORM HEADER */}
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200/30 px-8 py-6">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Retrieve Your Permit
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    Provide your phone number and ID to find your RIN
                  </CardDescription>
                </CardHeader>

                {/* FORM CONTENT */}
                <CardContent className="p-8">
                  <form onSubmit={handleLookup} className="space-y-5">
                    {/* PHONE FIELD */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Phone Number
                      </label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-4 h-5 w-5 text-green-600 transition-colors group-focus-within:text-green-700" />
                        <Input
                          type="tel"
                          placeholder="024 XXX XXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={loading}
                          required
                          className="pl-12 h-12 bg-gradient-to-br from-slate-50 to-green-50/30 border-2 border-green-200/50 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        />
                      </div>
                    </div>

                    {/* ID FIELD */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        License / National ID
                      </label>
                      <div className="relative group">
                        <FileText className="absolute left-4 top-4 h-5 w-5 text-green-600 transition-colors group-focus-within:text-green-700" />
                        <Input
                          placeholder="Enter your ID number"
                          value={id}
                          onChange={(e) => setId(e.target.value)}
                          disabled={loading}
                          required
                          className="pl-12 h-12 bg-gradient-to-br from-slate-50 to-green-50/30 border-2 border-green-200/50 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        />
                      </div>
                    </div>

                    {/* SEARCH BUTTON */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-5 w-5 mr-2" />
                          Find My RIN
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </>
            ) : (
              <>
                {/* RESULT HEADER */}
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200/30 px-8 py-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      RIN Found
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Here are your permi details
                  </CardDescription>
                </CardHeader>

                {/* RESULT CONTENT */}
                <CardContent className="p-8 space-y-6">
                  {/* RIN DISPLAY */}
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl text-center group">
                      <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-3">
                        Rider Identification Number
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <p className="text-3xl font-mono font-black text-gray-900">
                          {result.RIN}
                        </p>
                        <button
                          onClick={handleCopyRIN}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                          title="Copy RIN"
                        >
                          <Copy className={`h-5 w-5 transition-colors ${
                            copied ? "text-green-600" : "text-gray-400"
                          }`} />
                        </button>
                      </div>
                      {copied && (
                        <p className="text-xs text-green-600 font-semibold mt-2">
                          Copied to clipboard!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* DETAILS GRID */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="p-4 bg-white border border-slate-200/50 rounded-xl">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                        Name
                      </p>
                      <p className="font-semibold text-gray-900">
                        {result.name}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="p-4 bg-white border border-slate-200/50 rounded-xl">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                        Status
                      </p>
                      <Badge className={`${
                        result.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : result.status === "Expired"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      } border-none`}>
                        {result.status}
                      </Badge>
                    </div>

                    {/* Registered Date */}
                    <div className="p-4 bg-white border border-slate-200/50 rounded-xl col-span-2">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                        Registered Date
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <p className="font-semibold text-gray-900">
                          {result.registeredDate}
                        </p>
                      </div>
                    </div>

                    {/* Expiry Date */}
                    <div className="p-4 bg-white border border-slate-200/50 rounded-xl col-span-2">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                        Expiry Date
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <p className="font-semibold text-gray-900">
                          {result.expiry}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* INFO ALERT */}
                  <Alert className="bg-blue-50 border-blue-200 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <AlertDescription className="text-blue-700 font-medium ml-3">
                      Your Rider Identification Number is valid and active. Always carry your RIN during operations.
                    </AlertDescription>
                  </Alert>

                  {/* ACTION BUTTONS */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="h-11 border-2 border-green-200 text-green-600 hover:bg-green-50 font-semibold rounded-xl"
                      onClick={() => setResult(null)}
                    >
                      Search Again
                    </Button>
                    <Button
                      className="h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-green-200/30 bg-white/40 backdrop-blur-lg mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-gray-600">
          <p>&copy; 2024 Rider Identification Number Registry. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}