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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { QRCodeSVG } from "qrcode.react";
import NewRiderForm from "@/components/admin/NewRiderForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import RenewPermitDialog from "@/components/admin/RenewPermitDialog";
import {
  Search,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Mail,
  Download,
  ChevronRight,
  UserPlus,
  Edit3,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import RiderDetail from "@/components/admin/RiderDetail";

export default function RiderRegistry() {
  // --- AUTH/PROFILE STATE ---
  const [userProfile, setUserProfile] = useState<{
    role: string;
    entity: string;
  } | null>(null);

  // --- BACKEND STATE ---
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- UI STATE ---
  const [selected, setSelected] = useState<string[]>([]); // Changed to string for Firestore IDs
  const [open, setOpen] = useState(false);
  const [viewRider, setViewRider] = useState<any | null>(null);
  const [renewRider, setRenewRider] = useState<any | null>(null);
  const [editingRider, setEditingRider] = useState<any | null>(null);
  const [deletingRider, setDeletingRider] = useState<any | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // FETCH USER PROFILE FIRST
  // 1. Ensure your state includes loading for the profile specifically
  const [profileLoading, setProfileLoading] = useState(true);

  // 2. THE UPDATED EFFECT
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          // Fetch the "ID Card" (Profile) from Firestore
          const docRef = doc(db, "admin_users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            // Success: Found the registered profile
            setUserProfile(docSnap.data() as any);
          } else {
            // FALLBACK: User exists in Auth but has no Firestore document
            console.warn("No Firestore profile found for UID:", user.uid);
            setUserProfile({
              role: "Super Admin", // Emergency access
              entity: "National HQ",
            });
          }
        } else {
          // No user logged in
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

  //  SMART DATA FETCHING (Filtered by Role/Entity)
  useEffect(() => {
    if (!userProfile) return;

    let q;
    const ridersRef = collection(db, "riders");

    if (userProfile.role === "Super Admin") {
      // Super Admin sees everything
      q = query(ridersRef, orderBy("createdAt", "desc"));
    } else {
      // District Admin / Operator sees ONLY their town
      q = query(
        ridersRef,
        where("town", "==", userProfile.entity), // Magic Filter
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

  // 2. SEARCH FILTERING
  const filteredRiders = riders.filter(
    (r) =>
      r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.opn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone?.includes(searchTerm),
  );

  // 3. HANDLERS
  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const riderRef = doc(db, "riders", id);
      await updateDoc(riderRef, { status: "Active" });
      // Note: In production, you'd also update the opn_registry status here
    } catch (error) {
      console.error("Error approving:", error);
    }
    setApprovingId(null);
  };

  const handleDelete = async () => {
    if (!deletingRider) return;
    try {
      const batch = writeBatch(db);
      // Remove from main collection
      batch.delete(doc(db, "riders", deletingRider.id));
      // Remove from OPN registry so the number can be reused or marked as revoked
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
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {profileLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  Verifying Credentials...
                </span>
              ) : userProfile?.role === "Super Admin" ? (
                "Master Registry"
              ) : (
                `${userProfile?.entity} Registry`
              )}
            </h1>
            {userProfile?.role !== "Super Admin" && (
              <Badge variant="secondary">Local Access</Badge>
            )}
          </div>
          <p className="text-slate-500 font-medium">
            {loading
              ? "Syncing database..."
              : `Managing ${riders.length} registered riders in ${userProfile?.entity || "System"}.`}
          </p>
        </div>

        <div className="flex gap-2">
          {/* HIDE EXPORT FOR OPERATORS */}
          {userProfile?.role !== "Operator" && (
            <Button
              variant="outline"
              className="border-slate-200 shadow-sm bg-white"
            >
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 shadow-lg shadow-blue-100">
                <UserPlus className="mr-2 h-4 w-4" /> New Registration
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold">
                  Register New Rider
                </SheetTitle>
                <SheetDescription>
                  This will generate a unique OPN in the national registry.
                </SheetDescription>
              </SheetHeader>
              <NewRiderForm onSuccess={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, OPN, or phone number..."
            className="pl-11 h-10 border-none focus-visible:ring-0 text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-500 hover:bg-slate-50"
        >
          <Filter className="h-4 w-4 mr-2" /> Filters
        </Button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Loading Database...
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50 border-b">
              <TableRow>
                <TableHead className="w-12 px-6">
                  <Checkbox
                    checked={
                      selected.length === filteredRiders.length &&
                      filteredRiders.length > 0
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="font-bold text-slate-700">
                  Rider / Contact
                </TableHead>
                <TableHead className="font-bold text-slate-700">
                  OPN Number
                </TableHead>
                <TableHead className="font-bold text-center text-slate-700">
                  Quick Scan
                </TableHead>

                {/* ONLY SHOW TOWN COLUMN IF SUPER ADMIN */}
                {userProfile?.role === "Super Admin" && (
                  <TableHead className="font-bold text-slate-700">
                    Town
                  </TableHead>
                )}

                <TableHead className="font-bold text-slate-700">
                  Status
                </TableHead>
                <TableHead className="text-right px-8 font-bold text-slate-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRiders.map((rider) => (
                <TableRow
                  key={rider.id}
                  className="group hover:bg-blue-50/30 transition-all border-b last:border-0"
                >
                  <TableCell className="px-6">
                    <Checkbox
                      checked={selected.includes(rider.id)}
                      onCheckedChange={() => toggleOne(rider.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900">
                      {rider.fullName}
                    </div>
                    <div className="text-xs font-medium text-slate-400">
                      {rider.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-mono bg-blue-50 text-blue-700 border-blue-100 px-3 py-1"
                    >
                      {rider.opn}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center items-center">
                      <div className="p-1.5 bg-white border border-slate-100 rounded-xl shadow-sm group-hover:border-blue-200 transition-colors">
                        <QRCodeSVG
                          value={`${baseUrl}/verify/${rider.opn}`}
                          size={32}
                          level="M"
                        />
                      </div>
                    </div>
                  </TableCell>

                  {/* ONLY RENDER TOWN CELL IF SUPER ADMIN */}
                  {userProfile?.role === "Super Admin" && (
                    <TableCell className="text-sm font-semibold text-slate-600 uppercase tracking-tighter">
                      {rider.town}
                    </TableCell>
                  )}

                  <TableCell>
                    <Badge
                      className={
                        rider.status === "Active"
                          ? "bg-green-100 text-green-700 hover:bg-green-200 border-none shadow-none"
                          : rider.status === "Pending"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shadow-none"
                            : "bg-red-100 text-red-700 hover:bg-red-200 border-none shadow-none"
                      }
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full mr-2 ${
                          rider.status === "Active"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      />
                      {rider.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-slate-100 transition-colors"
                        >
                          <MoreHorizontal className="h-5 w-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 p-2 rounded-xl shadow-xl border-slate-100"
                      >
                        <DropdownMenuItem
                          onClick={() => setViewRider(rider)}
                          className="rounded-lg"
                        >
                          <ChevronRight className="mr-2 h-4 w-4 text-slate-400" />{" "}
                          View Full Profile
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => setEditingRider(rider)}
                          className="rounded-lg"
                        >
                          <Edit3 className="mr-2 h-4 w-4 text-slate-400" /> Edit
                          Details
                        </DropdownMenuItem>

                        {rider.status === "Pending" && (
                          <DropdownMenuItem
                            onClick={() => handleApprove(rider.id)}
                            className="text-green-600 font-bold rounded-lg focus:bg-green-50 focus:text-green-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {approvingId === rider.id
                              ? "Approving..."
                              : "Approve Rider"}
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => setRenewRider(rider)}
                          className="text-blue-600 rounded-lg focus:bg-blue-50"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" /> Renew Permit
                        </DropdownMenuItem>

                        {/* ONLY SUPER ADMINS CAN DELETE RECORDS */}
                        {userProfile?.role === "Super Admin" && (
                          <>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem
                              onClick={() => setDeletingRider(rider)}
                              className="text-red-600 focus:bg-red-50 focus:text-red-600 rounded-lg"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredRiders.length === 0 && (
          <div className="py-20 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">
              No riders found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* --- OVERLAYS & MODALS --- */}

      {/* 1. VIEW DETAIL SHEET */}
      <Sheet open={!!viewRider} onOpenChange={() => setViewRider(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>Rider Profile</SheetTitle>
          </SheetHeader>
          {viewRider && <RiderDetail rider={viewRider} />}
        </SheetContent>
      </Sheet>

      {/* 2. EDIT SHEET */}
      <Sheet open={!!editingRider} onOpenChange={() => setEditingRider(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="border-b pb-4 p-4">
            <SheetTitle>Edit Rider Details</SheetTitle>
          </SheetHeader>
          {editingRider && (
            <NewRiderForm
              initialData={editingRider}
              onSuccess={() => setEditingRider(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* 3. RENEWAL DIALOG */}
      <Dialog open={!!renewRider} onOpenChange={() => setRenewRider(null)}>
        {renewRider && (
          <RenewPermitDialog
            rider={renewRider}
            onConfirm={() => setRenewRider(null)}
          />
        )}
      </Dialog>

      {/* 4. DELETE CONFIRMATION */}
      <Dialog
        open={!!deletingRider}
        onOpenChange={() => setDeletingRider(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="flex flex-col items-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete{" "}
              <strong>{deletingRider?.name}</strong>? This will permanently
              revoke OPN <strong>{deletingRider?.opn}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeletingRider(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BULK ACTION BAR */}
      {selected.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-10">
          <div className="flex flex-col">
            <span className="text-sm font-bold">
              {selected.length} Selected
            </span>
            <span className="text-[10px] text-slate-400 uppercase">
              Bulk Action Mode
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-700" />
          <div className="flex gap-2">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500">
              <RefreshCw className="mr-2 h-4 w-4" /> Renew All
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-500">
              <Mail className="mr-2 h-4 w-4" /> Send SMS
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-400"
              onClick={() => setSelected([])}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
