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
  children: React.ReactNode;
  allowedRoles?: Role[];
  redirectTo?: string; // not logged in
  unauthorizedRedirectTo?: string; // logged in but wrong role
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setAuthenticated(false);
          router.replace(redirectTo);
          return;
        }

        setAuthenticated(true);

        // If no role restriction was provided, allow any logged-in user
        if (!allowedRoles || allowedRoles.length === 0) return;

        // Fetch role from admin_users/{uid}
        const snap = await getDoc(doc(db, "admin_users", user.uid));
        if (!snap.exists()) {
          // No profile = sign out and redirect
          await auth.signOut();
          setAuthenticated(false);
          router.replace(redirectTo);
          return;
        }

        const role = (snap.data() as any)?.role as Role | undefined;

        if (!role || !allowedRoles.includes(role)) {
          router.replace(unauthorizedRedirectTo);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, allowedRoles, redirectTo, unauthorizedRedirectTo]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return authenticated ? <>{children}</> : null;
}