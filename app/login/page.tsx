"use client"

import { useState } from "react"
import { auth } from "@/lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldAlert, User, Lock, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Firebase uses email/password. We treat username as the email.
      await signInWithEmailAndPassword(auth, username, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError("Access Denied: Invalid Username or Password")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans">
      <div className="w-full max-w-[400px]">
        
        {/* Government Header Style */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-4 shadow-xl">
            <ShieldAlert className="text-white h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-green-500 uppercase tracking-tighter">
            OPN Driver Registry
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            Official Use Only
          </p>
        </div>

        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white rounded-3xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold">Administrator Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Username / Email" 
                    className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input 
                    type="password"
                    placeholder="Password" 
                    className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-[11px] font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100 animate-pulse">
                  {error}
                </p>
              )}

              <Button 
                className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Sign In to Dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="mt-8 text-center text-[10px] text-slate-400 leading-relaxed font-medium">
          Authorized personnel only. All access attempts and activities within this portal are strictly monitored and logged.
        </p>
      </div>
    </div>
  )
}