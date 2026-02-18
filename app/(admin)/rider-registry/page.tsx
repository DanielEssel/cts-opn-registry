"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  writeBatch,
  where,
  getDoc,
} from "firebase/firestore";
import { RegistryHeader } from "./header";
import { SearchBar } from "./modals/search-bar";
import { RidersTable } from "./riders-table";
import { BulkActionBar } from "./bulk-action-bar";
import { ViewRiderModal } from "./modals/view-rider-modal";
import { EditRiderModal } from "./modals/edit-rider-modal";
import { DeleteConfirmation } from "./modals/delete-confirmation";
import RenewPermitDialog from "@/components/admin/RenewPermitDialog";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function RiderRegistry() {
  // --- AUTH/PROFILE STATE ---
  const [userProfile, setUserProfile] = useState<{
    role: string;
    entity: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // --- BACKEND STATE ---
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- UI STATE ---
  const [selected, setSelected] = useState<string[]>([]);
  const [viewRider, setViewRider] = useState<any | null>(null);
  const [renewRider, setRenewRider] = useState<any | null>(null);
  const [editingRider, setEditingRider] = useState<any | null>(null);
  const [deletingRider, setDeletingRider] = useState<any | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // FETCH USER PROFILE
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          const docRef = doc(db, "admin_users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as any);
          } else {
            setUserProfile({
              role: "Super Admin",
              entity: "National HQ",
            });
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setProfileLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // FETCH RIDERS DATA
  useEffect(() => {
    if (!userProfile) return;

    let q;
    const ridersRef = collection(db, "riders");

    if (userProfile.role === "Super Admin") {
      q = query(ridersRef, orderBy("createdAt", "desc"));
    } else {
      q = query(
        ridersRef,
        where("town", "==", userProfile.entity),
        orderBy("createdAt", "desc"),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const riderList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRiders(riderList);
        setLoading(false);
      },
      (err) => {
        console.error("Query Error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userProfile]);

  // SEARCH FILTERING
  const filteredRiders = riders.filter(
    (r) =>
      r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.opn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phoneNumber?.includes(searchTerm),
  );

  // HANDLERS
  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const riderRef = doc(db, "riders", id);
      await updateDoc(riderRef, { status: "Active" });
    } catch (error) {
      console.error("Error approving:", error);
    }
    setApprovingId(null);
  };

  const handleDelete = async () => {
    if (!deletingRider) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "riders", deletingRider.id));
      if (deletingRider.opn) {
        batch.delete(doc(db, "opn_registry", deletingRider.opn.toUpperCase()));
      }
      await batch.commit();
      setDeletingRider(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const toggleAll = () => {
    if (selected.length === filteredRiders.length) setSelected([]);
    else setSelected(filteredRiders.map((r) => r.id));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-6 relative min-h-[80vh] pb-24 animate-in fade-in duration-700">
      <RegistryHeader
        profileLoading={profileLoading}
        userRole={userProfile?.role}
        userEntity={userProfile?.entity}
        ridersCount={riders.length}
        loading={loading}
        onNewRegistration={() => {}}
      />

      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <RidersTable
        riders={filteredRiders}
        loading={loading}
        selected={selected}
        approvingId={approvingId}
        showTownColumn={userProfile?.role === "Super Admin"}
        showDeleteOption={userProfile?.role === "Super Admin"}
        baseUrl={baseUrl}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
        onViewRider={setViewRider}
        onEditRider={setEditingRider}
        onApproveRider={handleApprove}
        onRenewRider={setRenewRider}
        onDeleteRider={setDeletingRider}
      />

      {/* MODALS */}
      <ViewRiderModal
        open={!!viewRider}
        rider={viewRider}
        onOpenChange={() => setViewRider(null)}
      />

      <EditRiderModal
        open={!!editingRider}
        rider={editingRider}
        onOpenChange={() => setEditingRider(null)}
      />

      <DeleteConfirmation
        open={!!deletingRider}
        rider={deletingRider}
        onConfirm={handleDelete}
        onOpenChange={() => setDeletingRider(null)}
      />

      <Dialog open={!!renewRider} onOpenChange={() => setRenewRider(null)}>
        <DialogContent>
          {renewRider && (
            <RenewPermitDialog
              rider={renewRider}
              onConfirm={() => setRenewRider(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <BulkActionBar
        selectedCount={selected.length}
        onClose={() => setSelected([])}
        onRenewAll={() => {
          console.log("Renew all:", selected);
        }}
        onSendSMS={() => {
          console.log("Send SMS to:", selected);
        }}
      />
    </div>
  );
}