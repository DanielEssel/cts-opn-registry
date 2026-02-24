import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import type { AdminProfile } from "./useAdminProfile";

export interface AdminUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  entity: string;
  status: string;
  createdAt?: any;
}

export function useUsers(profile: AdminProfile | null) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setUsersLoading(false);
      return;
    }

    const usersRef = collection(db, "admin_users");
    const q =
      profile.role === "Super Admin"
        ? query(usersRef)
        : query(usersRef, where("entity", "==", profile.entity));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AdminUser, "id">),
        }));
        setUsers(list);
        setUsersLoading(false);
      },
      (err) => {
        console.error("Users snapshot error:", err);
        setUsersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  return { users, usersLoading };
}