"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BadgeIcon,
  User,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  Users,
  Zap,
  BarChart3,
  FileText,
} from "lucide-react";

export default function LoginPage() {
  const [userType, setUserType] = useState<"admin" | "operator">("operator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user profile from Firestore
      const userDocRef = doc(db, "admin_users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setError("User profile not found. Please contact administrator.");
        setLoading(false);
        return;
      }

      const userData = userDocSnap.data();
      const userRole = userData?.role;

      // Role-based navigation and validation
      if (userType === "admin") {
        // Check if user is Super Admin or Admin
        if (userRole === "Super Admin" || userRole === "Admin") {
          // Navigate to admin dashboard
          router.push("/dashboard");
        } else {
          // User tried to login as admin but doesn't have admin role
          setError("You do not have administrator privileges. Please login as Operator.");
          setLoading(false);
          // Sign out the user
          await auth.signOut();
          return;
        }
      } else if (userType === "operator") {
        // Check if user is Operator or District Admin
        if (
          userRole === "Operator" ||
          userRole === "District Admin" ||
          userRole === "Super Admin"
        ) {
          // Navigate to operator dashboard
          router.push("/registration");
        } else {
          // User tried to login as operator but doesn't have operator role
          setError("Invalid user type for operator login. Please try administrator login.");
          setLoading(false);
          // Sign out the user
          await auth.signOut();
          return;
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Handle specific Firebase errors
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
      
      setLoading(false);
    }
  };

  const features =
    userType === "admin"
      ? [
          {
            icon: Users,
            title: "Rider Management",
            description: "Manage all registered riders across districts",
          },
          {
            icon: BarChart3,
            title: "System Analytics",
            description: "View consolidated reporting and insights",
          },
          {
            icon: FileText,
            title: "Audit Trail",
            description: "Track all administrative activities",
          },
          {
            icon: Zap,
            title: "Full Control",
            description: "Complete system administration access",
          },
        ]
      : [
          {
            icon: BadgeIcon,
            title: "Register Riders",
            description: "Quick permit registration for riders",
          },
          {
            icon: FileText,
            title: "Manage Renewals",
            description: "Process permit renewals efficiently",
          },
          {
            icon: BarChart3,
            title: "Local Analytics",
            description: "Track local registration statistics",
          },
          {
            icon: CheckCircle2,
            title: "Real-time Updates",
            description: "Get instant status notifications",
          },
        ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* LEFT SIDE - ILLUSTRATION & GUIDE */}
          <div className="hidden lg:flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            {/* Branding */}
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-2xl shadow-green-500/50">
                  <Shield className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight">
                OPN Registry
              </h1>
              <p className="text-xl text-slate-300 font-semibold">
                Operating Permit Management System
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group cursor-pointer"
                  >
                    <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl group-hover:from-green-500/40 group-hover:to-emerald-500/40 transition-all flex-shrink-0">
                      <Icon className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {feature.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security Badge */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <p className="font-bold text-white text-sm">Enterprise Security</p>
              </div>
              <p className="text-xs text-slate-300">
                Military-grade encryption • Two-factor authentication • Audit logging • ISO compliant
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - LOGIN FORM */}
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            {/* Tab Switch */}
            <div className="mb-8">
              <div className="flex gap-3 p-1.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl">
                {[
                  { id: "operator", label: "Operator" },
                  { id: "admin", label: "Administrator" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setUserType(tab.id as "admin" | "operator");
                      setError(""); // Clear error when switching tabs
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                      userType === tab.id
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LOGIN CARD */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
              {/* Card Header */}
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10 px-8 py-8">
                <CardTitle className="text-3xl font-black text-white mb-2">
                  Welcome Back
                </CardTitle>
                <p className="text-sm text-slate-300">
                  {userType === "admin"
                    ? "Sign in to system administration dashboard"
                    : "Sign in to your operator account"}
                </p>
              </CardHeader>

              {/* Card Content */}
              <CardContent className="p-8">
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* EMAIL FIELD */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white uppercase tracking-widest">
                      Email Address
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400 transition-colors group-focus-within:text-green-300" />
                      <Input
                        type="email"
                        placeholder={
                          userType === "admin"
                            ? "admin@opn.gov.gh"
                            : "operator@opn.gov.gh"
                        }
                        className="pl-12 h-12 bg-white/5 border-2 border-white/10 text-white rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all placeholder:text-slate-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  {/* PASSWORD FIELD */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white uppercase tracking-widest">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400 transition-colors group-focus-within:text-green-300" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        className="pl-12 pr-12 h-12 bg-white/5 border-2 border-white/10 text-white rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all placeholder:text-slate-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-green-400 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ERROR ALERT */}
                  {error && (
                    <Alert className="bg-red-500/10 border-2 border-red-500/20 rounded-xl animate-in shake duration-300">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <AlertDescription className="text-red-300 font-semibold ml-3">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* SIGN IN BUTTON */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-2xl shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-8 text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Sign In as {userType === "admin" ? "Administrator" : "Operator"}
                      </>
                    )}
                  </Button>

                  {/* FORGOT PASSWORD */}
                  <div className="text-center pt-2">
                    <a
                      href="#"
                      className="text-sm text-green-400 hover:text-green-300 font-semibold transition-colors"
                    >
                      Forgot your password?
                    </a>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* SECURITY INFO - Mobile Version */}
            <div className="mt-6 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl lg:hidden">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                    Security Notice
                  </p>
                  <p className="text-xs text-slate-300">
                    All access attempts are monitored and logged. Unauthorized access is prohibited.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-12 text-center border-t border-white/10 pt-6">
          <p className="text-xs text-slate-400 font-medium">
            &copy; 2024 OPN Registry System • All rights reserved • Version 2.0
          </p>
        </div>
      </div>

      {/* Animated corner decorations */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}