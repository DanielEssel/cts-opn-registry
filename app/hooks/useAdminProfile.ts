"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export type AdminRole = "Super Admin" | "District Admin";

export type AdminProfile = {
  uid: string;
  name?: string;
  email?: string;
  role: AdminRole;
  entity?: string;
  status?: "Active" | "Inactive" | string;
};

export function useAdminProfile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setError("");

        if (!user) {
          setProfile(null);
          return;
        }

        const snap = await getDoc(doc(db, "admin_users", user.uid));
        if (!snap.exists()) {
          setProfile(null);
          setError("Admin profile not found.");
          return;
        }

        const data = snap.data() as any;

        setProfile({
          uid: user.uid,
          name: data.name,
          email: data.email ?? user.email ?? "",
          role: data.role,
          entity: data.entity,
          status: data.status,
        });
      } catch (e: any) {
        setError(e?.message ?? "Failed to load profile.");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // { profile, loading, error }
  return { profile, loading, error };
}