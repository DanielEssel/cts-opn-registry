"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BadgeIcon,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

// ============================================================================
// LOGIN PAGE
// ============================================================================

export default function LoginPage() {
  const [userType, setUserType] = useState<"admin" | "operator">("operator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // ========================================================================
  // HANDLE LOGIN
  // ========================================================================

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
          router.push("/dashboard");
        } else {
          setError("You do not have administrator privileges.");
          setLoading(false);
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
          router.push("/operator/register");
        } else {
          setError("Invalid user type for operator login.");
          setLoading(false);
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

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
     

      {/* MAIN CONTENT */}
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8">
            {/* WELCOME MESSAGE */}
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome</h2>
              <p className="text-sm text-slate-500">
                Sign in to your account to continue
              </p>
            </div>

            {/* USER TYPE TOGGLE */}
            <div className="mb-8 p-1 bg-slate-100 rounded-lg flex gap-1">
              {[
                { id: "operator", label: "Operator" },
                { id: "admin", label: "Admin" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setUserType(tab.id as "admin" | "operator");
                    setError("");
                  }}
                  className={`flex-1 py-2 px-3 rounded-md font-semibold text-sm transition-all ${
                    userType === tab.id
                      ? "bg-white text-green-600 shadow-sm border border-green-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ERROR ALERT */}
            {error && (
              <Alert className="mb-6 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-sm ml-3">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* EMAIL FIELD */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder={
                      userType === "admin"
                        ? "admin@example.com"
                        : "operator@example.com"
                    }
                    className="pl-10 h-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    className="pl-10 pr-10 h-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* REMEMBER ME */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300" />
                  <span className="text-slate-600">Remember me</span>
                </label>
                <a
                  href="#"
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  Forgot password?
                </a>
              </div>

              {/* SIGN IN BUTTON */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all mt-6 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* DIVIDER */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-500">Version 2.0</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* INFO BOX */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-xs text-blue-700 font-semibold">
                💡 Demo Credentials
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Operator: operator@test.com
                <br />
                Admin: admin@test.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500">
            &copy; 2026 OPN Registry System • All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}