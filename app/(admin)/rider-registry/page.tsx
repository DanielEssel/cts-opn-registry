"use client";

import { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection, onSnapshot, query, orderBy,
  doc, updateDoc, writeBatch, where, getDoc,
  addDoc, serverTimestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Registry sub-components ──────────────────────────────────────────────────
import { RegistryHeader }     from "./header";
import { SearchBar, type SearchFilters } from "./search-bar";
import { RidersTable }        from "./riders-table";
import { BulkActionBar }      from "./bulk-action-bar";

// ─── Modals ───────────────────────────────────────────────────────────────────
import { ViewRiderModal }     from "./modals/view-rider-modal";
import { EditRiderModal }     from "./modals/edit-rider-modal";
import { DeleteConfirmation } from "./modals/delete-confirmation";
import { RenewRiderModal, type RenewableRider } from "./modals/renewal-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "Super Admin" | "District Admin" | "Operator";

interface UserProfile {
  uid:    string;
  role:   Role;
  entity: string;
  name?:  string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export default function RiderRegistry() {

  // ── Auth / profile ────────────────────────────────────────────────────────
  const [userProfile,    setUserProfile]    = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [riders,  setRiders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filters / pagination ──────────────────────────────────────────────────
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: "", status: "All", vehicleCategory: "All Categories",
    district: "All Districts", registrationPeriod: "All", expiryStatus: "All",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<string[]>([]);

  // ── Modal targets ─────────────────────────────────────────────────────────
  const [viewRider,    setViewRider]    = useState<any | null>(null);
  const [editingRider, setEditingRider] = useState<any | null>(null);
  const [deletingRider,setDeletingRider]= useState<any | null>(null);
  const [renewRider,   setRenewRider]   = useState<RenewableRider | null>(null);
  const [approvingId,  setApprovingId]  = useState<string | null>(null);

  // ── Derived capability flags ──────────────────────────────────────────────
  const canApprove       = userProfile?.role === "Super Admin" || userProfile?.role === "District Admin";
  const canDelete        = userProfile?.role === "Super Admin";
  const canRenew         = userProfile?.role !== "Operator";
  const isDistrictAdmin  = userProfile?.role === "District Admin";
  const showDistrictColumn = userProfile?.role === "Super Admin";

  // ── 1. Load user profile ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setProfileLoading(true);
      try {
        if (!user) { setUserProfile(null); return; }

        const snap = await getDoc(doc(db, "admin_users", user.uid));
        if (!snap.exists()) {
          setUserProfile(null);
          await auth.signOut();
          return;
        }

        const data = snap.data() as any;
        if (data?.status && data.status !== "Active") {
          setUserProfile(null);
          await auth.signOut();
          return;
        }

        setUserProfile({
          uid:    user.uid,
          role:   data.role   as Role,
          entity: data.entity as string,
          name:   data.name,
        });
      } catch (err) {
        console.error("Profile fetch error:", err);
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // ── 2. Real-time riders listener (role-scoped) ────────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    setLoading(true);

    const ref = collection(db, "riders");
    const q =
      userProfile.role === "Super Admin"
        ? query(ref, orderBy("createdAt", "desc"))
        : userProfile.role === "District Admin"
        ? query(ref,
            where("districtMunicipality", "==", userProfile.entity),
            orderBy("createdAt", "desc"),
          )
        : query(ref,
            where("createdBy", "==", userProfile.uid),
            orderBy("createdAt", "desc"),
          );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setRiders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { console.error("Riders listener error:", err); setLoading(false); },
    );
    return () => unsub();
  }, [userProfile]);

  // ── 3. Reset page on filter change ───────────────────────────────────────
  useEffect(() => { setCurrentPage(1); }, [filters]);

  // ── 4. Effective filters (District Admin locked to own district) ──────────
  const effectiveFilters = useMemo<SearchFilters>(() => {
    if (isDistrictAdmin && userProfile)
      return { ...filters, district: userProfile.entity };
    return filters;
  }, [filters, userProfile, isDistrictAdmin]);

  // ── 5. Client-side filtering ──────────────────────────────────────────────
  const filteredRiders = useMemo(() => riders.filter((r) => {
    const term = effectiveFilters.searchTerm.toLowerCase();

    const matchSearch = !term
      || r.fullName?.toLowerCase().includes(term)
      || r.RIN?.toLowerCase().includes(term)
      || r.phoneNumber?.includes(term);

    const matchStatus   = effectiveFilters.status === "All"              || r.status === effectiveFilters.status;
    const matchVehicle  = effectiveFilters.vehicleCategory === "All Categories" || r.vehicleCategory === effectiveFilters.vehicleCategory;
    const matchDistrict = effectiveFilters.district === "All Districts"  || r.districtMunicipality === effectiveFilters.district;

    const matchPeriod = (() => {
      if (effectiveFilters.registrationPeriod === "All") return true;
      const d = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      const now = new Date();
      switch (effectiveFilters.registrationPeriod) {
        case "Today":         return d.toDateString() === now.toDateString();
        case "This Week":     return d >= new Date(now.getTime() - 7  * 86_400_000);
        case "This Month":    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        case "Last Month": {
          const lm = new Date(now.getFullYear(), now.getMonth() - 1);
          return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
        }
        case "Last 3 Months": return d >= new Date(now.getTime() - 90 * 86_400_000);
        case "This Year":     return d.getFullYear() === now.getFullYear();
        default: return true;
      }
    })();

    const matchExpiry = (() => {
      if (effectiveFilters.expiryStatus === "All") return true;
      if (!r.expiryDate) return false;
      const days = Math.ceil((new Date(r.expiryDate).getTime() - Date.now()) / 86_400_000);
      switch (effectiveFilters.expiryStatus) {
        case "Valid":               return days > 0;
        case "Expiring Soon":       return days > 0 && days <= 30;
        case "Expiring This Week":  return days > 0 && days <= 7;
        case "Expired":             return days <= 0;
        default: return true;
      }
    })();

    return matchSearch && matchStatus && matchVehicle && matchDistrict && matchPeriod && matchExpiry;
  }), [riders, effectiveFilters]);

  // ── 6. Pagination ─────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filteredRiders.length / PAGE_SIZE));
  const safePage    = Math.min(currentPage, totalPages);
  const pageStart   = (safePage - 1) * PAGE_SIZE;
  const pagedRiders = filteredRiders.slice(pageStart, pageStart + PAGE_SIZE);

  const goTo = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const nums: number[] = [];
    for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++)
      nums.push(i);
    return nums;
  }, [safePage, totalPages]);

  // ── 7. Handlers ──────────────────────────────────────────────────────────

  const handleApprove = async (id: string) => {
    if (!canApprove) return;
    setApprovingId(id);
    try {
      await updateDoc(doc(db, "riders", id), {
        status: "Active",
        updatedAt: serverTimestamp(),
      });
      // Audit log
      if (auth.currentUser) {
        await addDoc(collection(db, "audit_logs"), {
          type:      "APPROVE",
          adminUid:  auth.currentUser.uid,
          adminRole: userProfile?.role ?? "",
          action:    "Approved rider registration",
          target:    riders.find((r) => r.id === id)?.fullName ?? "",
          targetId:  id,
          district:  userProfile?.entity ?? "",
          status:    "success",
          timestamp: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingRider || !canDelete) return;
    try {
      const batch = writeBatch(db);

      // Bulk delete
      if (deletingRider.id === "__bulk__" && deletingRider._bulkIds) {
        (deletingRider._bulkIds as string[]).forEach((id: string) => {
          batch.delete(doc(db, "riders", id));
        });
        if (auth.currentUser) {
          await addDoc(collection(db, "audit_logs"), {
            type:      "DELETE",
            adminUid:  auth.currentUser.uid,
            adminRole: userProfile?.role ?? "",
            action:    `Bulk deleted ${deletingRider._bulkIds.length} rider records`,
            target:    `${deletingRider._bulkIds.length} riders`,
            district:  userProfile?.entity ?? "",
            status:    "success",
            timestamp: serverTimestamp(),
          });
        }
      } else {
        // Single delete
        batch.delete(doc(db, "riders", deletingRider.id));
        if (auth.currentUser) {
          await addDoc(collection(db, "audit_logs"), {
            type:      "DELETE",
            adminUid:  auth.currentUser.uid,
            adminRole: userProfile?.role ?? "",
            action:    "Deleted rider record",
            target:    deletingRider.fullName ?? "",
            targetId:  deletingRider.id,
            RIN:       deletingRider.RIN ?? "",
            district:  deletingRider.districtMunicipality ?? "",
            status:    "success",
            timestamp: serverTimestamp(),
          });
        }
      }

      await batch.commit();
      setSelected([]);
      setDeletingRider(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Open renewal modal — map rider to RenewableRider shape
  const handleRenewOpen = (rider: any) => {
    setRenewRider({
      id:                   rider.id,
      fullName:             rider.fullName,
      phoneNumber:          rider.phoneNumber,
      RIN:                  rider.RIN,
      vehicleCategory:      rider.vehicleCategory,
      districtMunicipality: rider.districtMunicipality,
      expiryDate:           rider.expiryDate,
      status:               rider.status,
    });
  };

  const allSelected: boolean =
    pagedRiders.length > 0 && selected.length === pagedRiders.length;

  const toggleAll = () =>
    setSelected(allSelected ? [] : pagedRiders.map((r: any) => r.id as string));

  const toggleOne = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 relative min-h-[80vh] pb-24">

      <RegistryHeader
        profileLoading={profileLoading}
        userRole={userProfile?.role}
        userEntity={userProfile?.entity}
        ridersCount={riders.length}
        loading={loading}
        riders={filteredRiders}
      />

      <SearchBar onFiltersChange={setFilters} />

      <RidersTable
        riders={pagedRiders}
        loading={loading}
        selected={selected}
        allSelected={allSelected}
        approvingId={approvingId}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
        onViewRider={(r: any) => setViewRider(r)}
        onEditRider={(r: any) => setEditingRider(r)}
        onApproveRider={canApprove ? handleApprove : undefined}
        onRenewRider={canRenew ? handleRenewOpen : undefined}
        onDeleteRider={canDelete ? (r: any) => setDeletingRider(r) : undefined}
        showTownColumn={showDistrictColumn}
        canApprove={canApprove}
        canDelete={canDelete}
        canEdit={true}
        canRenew={canRenew}
      />

      {/* ── Pagination ── */}
      {!loading && filteredRiders.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredRiders.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">{filteredRiders.length}</span>{" "}
            riders
          </p>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => goTo(safePage - 1)} disabled={safePage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {pageNumbers[0] > 1 && (
              <>
                <Button variant="outline" size="icon" className="h-8 w-8 text-sm" onClick={() => goTo(1)}>1</Button>
                {pageNumbers[0] > 2 && <span className="px-1 text-slate-400 text-sm">…</span>}
              </>
            )}

            {pageNumbers.map((n) => (
              <Button key={n} size="icon"
                variant={n === safePage ? "default" : "outline"}
                className={`h-8 w-8 text-sm ${n === safePage ? "bg-green-700 hover:bg-green-800 border-green-700" : ""}`}
                onClick={() => goTo(n)}
              >
                {n}
              </Button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="px-1 text-slate-400 text-sm">…</span>
                )}
                <Button variant="outline" size="icon" className="h-8 w-8 text-sm"
                  onClick={() => goTo(totalPages)}>{totalPages}
                </Button>
              </>
            )}

            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
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

      {/* Shared renewal modal — same component used by Renewal Database page */}
      <RenewRiderModal
        open={!!renewRider}
        rider={renewRider}
        adminRole={userProfile?.role}
        onOpenChange={(o) => { if (!o) setRenewRider(null); }}
        onSuccess={() => setRenewRider(null)}
      />

      <BulkActionBar
  selectedCount={selected.length}
  selectedRiders={riders.filter((r: any) => selected.includes(r.id))}
  adminRole={userProfile?.role}
  onClose={() => setSelected([])}
  canRenewAll={canApprove}
  canSendSMS={canApprove}
  canDelete={canDelete}
  onSendSMS={() => console.log("Bulk SMS:", selected)}
  onDeleteAll={() => {
    setDeletingRider({
      id: "__bulk__",
      fullName: `${selected.length} riders`,
      _bulkIds: selected,
    });
  }}
  onRenewSuccess={(renewed) => console.log(`${renewed} permits renewed`)}
/>

    </div>
  );
}