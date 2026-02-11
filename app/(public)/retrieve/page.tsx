"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react"
import Link from "next/link"

export default function RetrieveOPN() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<null | { opn: string, expiry: string }>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate API Call
    setTimeout(() => {
      setResult({ opn: "KS-1001-02-2026", expiry: "Aug 10, 2026" })
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Link>

        <Card className="shadow-xl border-t-4 border-blue-600">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Retrieve OPN</CardTitle>
            <CardDescription>Enter your details to find your existing Permit Number.</CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <form onSubmit={handleLookup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                  <Input placeholder="024 000 0000" required className="h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">License / National ID</label>
                  <Input placeholder="Enter ID Number" required className="h-12" />
                </div>
                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2 h-4 w-4" />}
                  {loading ? "Searching..." : "Find My OPN"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6 animate-in zoom-in duration-300">
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl text-center">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">OPN Found</p>
                  <p className="text-3xl font-mono font-black text-slate-900">{result.opn}</p>
                </div>
                <div className="flex justify-between text-sm border-t pt-4">
                  <span className="text-slate-500">Status: <span className="text-green-600 font-bold">Active</span></span>
                  <span className="text-slate-500">Expires: <span className="font-bold">{result.expiry}</span></span>
                </div>
                <Button variant="outline" className="w-full h-12" onClick={() => setResult(null)}>
                  Search Another
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}