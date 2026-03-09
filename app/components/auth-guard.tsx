"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

type Role = "Super Admin" | "District Admin" | "Operator";

export function AuthGuard({
  children,
  allowedRoles,
  redirectTo = "/login",
  unauthorizedRedirectTo = "/operator/register",
}: {
  children:               React.ReactNode;
  allowedRoles?:          Role[];
  redirectTo?:            string;
  unauthorizedRedirectTo?: string;
}) {
  const [loading,       setLoading]       = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        // ── Not logged in ─────────────────────────────────────────────────
        if (!user) {
          setAuthenticated(false);
          setLoading(false);
          router.replace(redirectTo);
          return;
        }

        // ── No role restriction — any logged-in user allowed ──────────────
        if (!allowedRoles || allowedRoles.length === 0) {
          setAuthenticated(true);
          setLoading(false);
          return;
        }

        // ── Fetch profile ─────────────────────────────────────────────────
        let snap;
        try {
          snap = await getDoc(doc(db, "admin_users", user.uid));
        } catch (firestoreErr: any) {
          // Permissions error mid-flight (e.g. during sign-out race condition)
          // Treat as unauthenticated — don't crash
          console.warn("AuthGuard: Firestore read failed (likely mid-signout):", firestoreErr?.code);
          setAuthenticated(false);
          setLoading(false);
          router.replace(redirectTo);
          return;
        }

        // ── No profile = kick out ─────────────────────────────────────────
        if (!snap.exists()) {
          await auth.signOut();
          setAuthenticated(false);
          setLoading(false);
          router.replace(redirectTo);
          return;
        }

        const data   = snap.data() as any;
        const role   = data?.role as Role | undefined;
        const status = data?.status as string | undefined;

        // ── Inactive account ──────────────────────────────────────────────
        if (status && status !== "Active") {
          await auth.signOut();
          setAuthenticated(false);
          setLoading(false);
          router.replace(redirectTo);
          return;
        }

        // ── Wrong role ────────────────────────────────────────────────────
        if (!role || !allowedRoles.includes(role)) {
          setAuthenticated(false);
          setLoading(false);
          router.replace(unauthorizedRedirectTo);
          return;
        }

        // ── All good ──────────────────────────────────────────────────────
        setAuthenticated(true);
        setLoading(false);

      } catch (err) {
        // Catch-all — never leave user on a broken loading screen
        console.error("AuthGuard unexpected error:", err);
        setAuthenticated(false);
        setLoading(false);
        router.replace(redirectTo);
      }
    });

    return () => unsubscribe();
  }, [router, allowedRoles, redirectTo, unauthorizedRedirectTo]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  return authenticated ? <>{children}</> : null;
}