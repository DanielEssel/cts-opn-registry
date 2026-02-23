"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
   const [userType, setUserType] = useState<UserType>("operator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const ADMIN_ROLES = ["Super Admin", "District Admin"] as const;
const OPERATOR_ROLES = ["Operator"] as const;

type UserType = "admin" | "operator";


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      const userDocRef = doc(db, "admin_users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setError(
          "User profile not found. Please contact the Boss (Super Admin)."
        );
        await auth.signOut();
        return;
      }

      const userData = userDocSnap.data();
      const userRole = userData?.role as string | undefined;
      const status = userData?.status as string | undefined;

      if (status && status !== "Active") {
        setError("Account is not active. Please contact the Boss (Super Admin).");
        await auth.signOut();
        return;
      }

      if (userType === "admin") {
        if (userRole && ADMIN_ROLES.includes(userRole as any)) {
          router.push("/dashboard");
        } else {
          setError("Access Denied: Administrator privileges required.");
          await auth.signOut();
        }
      } else {
        if (userRole && OPERATOR_ROLES.includes(userRole as any)) {
          router.push("/operator/register");
        } else {
          setError("Access Denied: Invalid role for operator login.");
          await auth.signOut();
        }
      }
    } catch (err) {
      setError("Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-2xl shadow-slate-200/60 overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-slate-100">
        
        {/* LEFT PANEL: BRANDING & IDENTITY */}
        <div className="hidden md:flex flex-col w-[45%] bg-[#0F172A] p-12 text-white relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-[-10%] left-[-10%] w-full h-full border-[1px] border-white rounded-full" />
             <div className="absolute bottom-[-20%] right-[-20%] w-full h-full border-[1px] border-white rounded-full" />
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="bg-white/10 w-fit p-3 rounded-2xl backdrop-blur-md mb-8">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-4">
                OPN Registry <span className="text-emerald-400">System</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-[280px]">
                Ghana's official secure portal for motor rider registration and permit issuance.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Official Portal</p>
              </div>
              <Image
                src="/logo/rawlogo.png" 
                alt="OPN Logo"
                width={180}
                height={180}
                className="opacity-90 brightness-110"
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: LOGIN FORM */}
        <div className="flex-1 px-8 py-12 lg:px-16 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Login</h2>
              <p className="text-slate-500 mt-2 text-sm">Welcome back! Please enter your details.</p>
            </div>

            {/* USER TYPE SELECTOR */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-xl mb-8 border border-slate-200/50">
              <button
                onClick={() => setUserType("operator")}
                className={`py-2.5 text-sm font-bold rounded-lg transition-all ${
                  userType === "operator" 
                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Operator
              </button>
              <button
                onClick={() => setUserType("admin")}
                className={`py-2.5 text-sm font-bold rounded-lg transition-all ${
                  userType === "admin" 
                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Administrator
              </button>
            </div>

            {error && (
              <Alert className="mb-6 bg-red-50 border-red-200 text-red-800 rounded-xl animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    type="email"
                    placeholder="name@agency.gov.gh"
                    className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    className="pl-11 pr-11 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20" />
                  <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Remember device</span>
                </label>
                <button type="button" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                &copy; 2026 Ghana OPN Registry • v2.4.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
