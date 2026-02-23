"use client";

import { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  writeBatch,
  where,
  getDoc,
} from "firebase/firestore";
import { RegistryHeader } from "./header";
import { SearchBar, type SearchFilters } from "./search-bar";
import { RidersTable } from "./riders-table";
import { BulkActionBar } from "./bulk-action-bar";
import { ViewRiderModal } from "./modals/view-rider-modal";
import { EditRiderModal } from "./modals/edit-rider-modal";
import { DeleteConfirmation } from "./modals/delete-confirmation";
import RenewPermitDialog from "@/components/admin/RenewPermitDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

type Role = "Super Admin" | "District Admin" | "Operator";

type UserProfile = {
  uid: string;
  role: Role;
  entity: string; // district jurisdiction, e.g. "Ga South"
};

export default function RiderRegistry() {
  // --- AUTH/PROFILE STATE ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  //bulk sms state
  const canBulkRenew =
    userProfile?.role === "Super Admin" ||
    userProfile?.role === "District Admin";
  const canBulkSMS =
    userProfile?.role === "Super Admin" ||
    userProfile?.role === "District Admin";

  // --- BACKEND STATE ---
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: "",
    status: "All",
    vehicleCategory: "All Categories",
    district: "All Districts",
    registrationPeriod: "All",
    expiryStatus: "All",
  });

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- UI STATE ---
  const [selected, setSelected] = useState<string[]>([]);
  const [viewRider, setViewRider] = useState<any | null>(null);
  const [renewRider, setRenewRider] = useState<any | null>(null);
  const [editingRider, setEditingRider] = useState<any | null>(null);
  const [deletingRider, setDeletingRider] = useState<any | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // ----------------------------
  // Capability flags by role
  // ----------------------------
  const canApprove =
    userProfile?.role === "Super Admin" ||
    userProfile?.role === "District Admin";
  const canDelete = userProfile?.role === "Super Admin";
  const showDistrictColumn = userProfile?.role === "Super Admin"; // show more global columns only for Boss
  const isOperator = userProfile?.role === "Operator";
  const isDistrictAdmin = userProfile?.role === "District Admin";

  // FETCH USER PROFILE
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        setProfileLoading(true);

        if (!user) {
          setUserProfile(null);
          return;
        }

        const snap = await getDoc(doc(db, "admin_users", user.uid));
        if (!snap.exists()) {
          // fail closed: no profile, no access
          setUserProfile(null);
          await auth.signOut();
          return;
        }

        const data = snap.data() as any;

        // Optional: block inactive
        if (data?.status && data.status !== "Active") {
          setUserProfile(null);
          await auth.signOut();
          return;
        }

        setUserProfile({
          uid: user.uid,
          role: data.role as Role,
          entity: data.entity as string,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // FETCH RIDERS DATA (role-aware)
  useEffect(() => {
    if (!userProfile) return;

    setLoading(true);

    const ridersRef = collection(db, "riders");

    const q =
      userProfile.role === "Super Admin"
        ? query(ridersRef, orderBy("createdAt", "desc"))
        : userProfile.role === "District Admin"
          ? query(
              ridersRef,
              where("districtMunicipality", "==", userProfile.entity),
              orderBy("createdAt", "desc"),
            )
          : query(
              ridersRef,
              where("createdBy", "==", userProfile.uid),
              orderBy("createdAt", "desc"),
            );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRiders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Query Error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userProfile]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Apply role-aware UI restrictions to filters (operator + district admin)
  const effectiveFilters = useMemo(() => {
    if (!userProfile) return filters;

    // District Admin: lock district filter to their district
    if (isDistrictAdmin) {
      return { ...filters, district: userProfile.entity };
    }

    // Operator: lock district filter to All (or their district) — but data is already scoped by createdBy
    // Keeping as-is is fine. If you want to hide the district filter in UI, do it in <SearchBar />
    return filters;
  }, [filters, userProfile, isDistrictAdmin]);

  // APPLY ALL FILTERS (client-side on the already-scoped dataset)
  const filteredRiders = riders.filter((rider) => {
    const term = effectiveFilters.searchTerm.toLowerCase();

    const matchesSearch =
      !term ||
      rider.fullName?.toLowerCase().includes(term) ||
      rider.opn?.toLowerCase().includes(term) ||
      rider.phoneNumber?.includes(term);

    const matchesStatus =
      effectiveFilters.status === "All" ||
      rider.status === effectiveFilters.status;

    const matchesVehicle =
      effectiveFilters.vehicleCategory === "All Categories" ||
      rider.vehicleCategory === effectiveFilters.vehicleCategory;

    const matchesDistrict =
      effectiveFilters.district === "All Districts" ||
      rider.districtMunicipality === effectiveFilters.district;

    const matchesPeriod = (() => {
      if (effectiveFilters.registrationPeriod === "All") return true;
      const createdDate = rider.createdAt?.toDate
        ? rider.createdAt.toDate()
        : new Date(rider.createdAt);
      const now = new Date();
      switch (effectiveFilters.registrationPeriod) {
        case "Today":
          return createdDate.toDateString() === now.toDateString();
        case "This Week":
          return (
            createdDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          );
        case "This Month":
          return (
            createdDate.getMonth() === now.getMonth() &&
            createdDate.getFullYear() === now.getFullYear()
          );
        case "Last Month": {
          const lm = new Date(now.getFullYear(), now.getMonth() - 1);
          return (
            createdDate.getMonth() === lm.getMonth() &&
            createdDate.getFullYear() === lm.getFullYear()
          );
        }
        case "Last 3 Months":
          return (
            createdDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          );
        case "This Year":
          return createdDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    })();

    const matchesExpiry = (() => {
      if (effectiveFilters.expiryStatus === "All") return true;
      if (!rider.expiryDate) return false;
      const days = Math.ceil(
        (new Date(rider.expiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );
      switch (effectiveFilters.expiryStatus) {
        case "Valid":
          return days > 0;
        case "Expiring Soon":
          return days > 0 && days <= 30;
        case "Expiring This Week":
          return days > 0 && days <= 7;
        case "Expired":
          return days <= 0;
        default:
          return true;
      }
    })();

    return (
      matchesSearch &&
      matchesStatus &&
      matchesVehicle &&
      matchesDistrict &&
      matchesPeriod &&
      matchesExpiry
    );
  });

  // ── PAGINATION CALCULATIONS ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredRiders.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const pagedRiders = filteredRiders.slice(pageStart, pageEnd);

  const goTo = (page: number) =>
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const pageNumbers = (() => {
    const range: number[] = [];
    const delta = 2;
    for (
      let i = Math.max(1, safePage - delta);
      i <= Math.min(totalPages, safePage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  })();

  // HANDLERS
  const handleApprove = async (id: string) => {
    if (!canApprove) return;

    setApprovingId(id);
    try {
      await updateDoc(doc(db, "riders", id), { status: "Active" });
    } catch (error) {
      console.error("Error approving:", error);
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingRider) return;
    if (!canDelete) return;

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "riders", deletingRider.id));
      if (deletingRider.opn) {
        batch.delete(
          doc(db, "opn_registry", String(deletingRider.opn).toUpperCase()),
        );
      }
      await batch.commit();
      setDeletingRider(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const toggleAll = () => {
    if (selected.length === pagedRiders.length) setSelected([]);
    else setSelected(pagedRiders.map((r) => r.id));
  };

  const toggleOne = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-6 relative min-h-[80vh] pb-24">
      <RegistryHeader
        profileLoading={profileLoading}
        userRole={userProfile?.role}
        userEntity={userProfile?.entity}
        ridersCount={riders.length}
        loading={loading}
        onNewRegistration={() => {}}
      />

      <SearchBar onFiltersChange={setFilters} />

      <RidersTable
        riders={pagedRiders}
        loading={loading}
        selected={selected}
        approvingId={approvingId}
        baseUrl={baseUrl}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
        onViewRider={setViewRider}
        onEditRider={setEditingRider}
        onApproveRider={handleApprove}
        onRenewRider={setRenewRider}
        onDeleteRider={(r) => (canDelete ? setDeletingRider(r) : null)}
        showTownColumn={userProfile?.role === "Super Admin"} // or adjust
        canApprove={
          userProfile?.role === "Super Admin" ||
          userProfile?.role === "District Admin"
        }
        canDelete={userProfile?.role === "Super Admin"}
        canEdit={true}
        canRenew={userProfile?.role !== "Operator"} // if operator can't renew
      />

      {/* Pagination */}
      {!loading && filteredRiders.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {pageStart + 1}–{Math.min(pageEnd, filteredRiders.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {filteredRiders.length}
            </span>{" "}
            riders
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goTo(safePage - 1)}
              disabled={safePage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {pageNumbers[0] > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-sm"
                  onClick={() => goTo(1)}
                >
                  1
                </Button>
                {pageNumbers[0] > 2 && (
                  <span className="px-1 text-slate-400 text-sm">…</span>
                )}
              </>
            )}

            {pageNumbers.map((n) => (
              <Button
                key={n}
                variant={n === safePage ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 text-sm ${
                  n === safePage
                    ? "bg-green-600 hover:bg-green-700 border-green-600"
                    : ""
                }`}
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
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-sm"
                  onClick={() => goTo(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goTo(safePage + 1)}
              disabled={safePage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
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
        canRenewAll={
          userProfile?.role === "Super Admin" ||
          userProfile?.role === "District Admin"
        }
        canSendSMS={
          userProfile?.role === "Super Admin" ||
          userProfile?.role === "District Admin"
        } // or include Operator if you want
        onRenewAll={() => console.log("Renew all:", selected)}
        onSendSMS={() => console.log("Send SMS to:", selected)}
      />
    </div>
  );
}
