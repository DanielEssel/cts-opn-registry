"use client";

import { toasts } from "@/lib/toast-utils";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Mail, Lock, Loader2, AlertCircle,
  Eye, EyeOff, ArrowRight, ShieldCheck,
  Users, Settings,
} from "lucide-react";

type UserType = "operator" | "admin";

const ADMIN_ROLES    = ["Super Admin", "District Admin"] as const;
const OPERATOR_ROLES = ["Operator"] as const;

export default function LoginPage() {
  const [userType,     setUserType]     = useState<UserType>("operator");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  toasts.loginLoading(); // ✅ uses TOAST_IDS.LOGIN

  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "admin_users", user.uid));

    if (!snap.exists()) {
      const msg = "User profile not found. Contact your Super Admin.";
      setError(msg);
      toasts.loginError(msg); // ✅ replaces loading toast via LOGIN id
      await auth.signOut();
      return;
    }

    const data = snap.data();
    const role = data?.role as string | undefined;
    const status = data?.status as string | undefined;

    if (status && status !== "Active") {
      const msg = "Account is inactive. Contact your Super Admin.";
      setError(msg);
      toasts.loginError(msg); // ✅
      await auth.signOut();
      return;
    }

    if (userType === "admin") {
      if (role && ADMIN_ROLES.includes(role as any)) {
        toasts.loginSuccess();
        router.push("/dashboard");
      } else {
        const msg = "Administrator privileges required.";
        setError("Access denied: " + msg);
        toasts.loginError(msg); // ✅
        await auth.signOut();
      }
    } else {
      if (role && OPERATOR_ROLES.includes(role as any)) {
        toasts.loginSuccess();
        router.push("/operator/register");
      } else {
        const msg = "Invalid role for operator login.";
        setError("Access denied: " + msg);
        toasts.loginError(msg); // ✅
        await auth.signOut();
      }
    }
  } catch (err: any) {
    const msg = "Invalid email or password. Please try again.";
    setError(msg);
    toasts.loginError(msg); // ✅
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8">

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-slate-200/80 overflow-hidden flex flex-col lg:flex-row border border-slate-100">

        {/* ── Left branding panel ── */}
        <div className="hidden lg:flex flex-col w-[38%] bg-slate-900 relative overflow-hidden shrink-0">

          {/* Decorative rings */}
          <div className="absolute -top-32 -left-32 w-96 h-96 border border-white/5 rounded-full pointer-events-none" />
          <div className="absolute -top-16 -left-16 w-64 h-64 border border-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] border border-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 border border-white/5 rounded-full pointer-events-none" />

          {/* Green accent strip */}
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-400 via-green-600 to-green-900" />

          <div className="relative z-10 flex flex-col h-full p-8 xl:p-10 justify-between">
            <div>
              <div className="inline-flex items-center gap-2.5 bg-white/8 border border-white/10 px-4 py-2.5 rounded-2xl mb-10 backdrop-blur">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span className="text-[10px] font-bold tracking-widest text-green-300 uppercase">Secured Portal</span>
              </div>

              <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight mb-4">
                RIN Register<br /><span className="text-green-400">System</span>
              </h1>

              <p className="text-slate-400 text-sm xl:text-base leading-relaxed max-w-xs">
                Ghana's official secure portal for commercial motor rider
                registration and permit issuance.
              </p>

              <div className="flex flex-col gap-3 mt-8">
                {[
                  "Real-time permit tracking",
                  "QR code verification",
                  "District-level access control",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    <span className="text-slate-400 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
             <div className="w-21.5 h-21.5 flex items-center justify-center">
                           <Image
                             src="/logo/ctslogo.png"
                             alt="RIN"
                             width={86}
                             height={86}
                             className="object-contain brightness-200"
                           />
                         </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <p className="text-[10px] font-bold tracking-[0.25em] text-slate-600 uppercase">CTS Official Portal</p>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8 sm:px-8 lg:px-10 xl:px-12 min-h-[520px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="p-2 bg-green-700 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">RIN Registry</span>
          </div>

          <div className="w-full max-w-sm mx-auto">

            <div className="mb-8">
              <h2 className="text-xl xl:text-2xl font-black text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1.5">Sign in to access the registry portal.</p>
            </div>

            {/* Role tabs */}
            <div className="grid grid-cols-2 gap-2 mb-8">
              {([
                { key: "operator", label: "Operator",      Icon: Users    },
                { key: "admin",    label: "Administrator", Icon: Settings },
              ] as { key: UserType; label: string; Icon: any }[]).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setUserType(key); setError(""); }}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
                    userType === key
                      ? "bg-green-700 text-white border-green-700 shadow-md shadow-green-900/20"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-red-700 leading-snug">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="you@agency.gov.gh"
                    className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-green-500/20 focus-visible:border-green-500 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    className="pl-10 pr-11 h-11 bg-slate-50 border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-green-500/20 focus-visible:border-green-500 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 accent-green-600" />
                  <span className="text-xs text-slate-500">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-xs font-bold text-green-700 hover:text-green-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow-lg shadow-green-900/15 transition-all active:scale-[0.98] gap-2 mt-1"
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>
                }
              </Button>
            </form>

            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                © 2026 CTS Africa · RIN Registry · v2.4.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}