"use client";

import { useEffect, useState, useMemo } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, addDoc, getDoc, serverTimestamp,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw, AlertTriangle, CheckCircle2,
  Clock, Loader2, Search, Calendar,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RenewalCandidate {
  id:              string;
  fullName:        string;
  phoneNumber:     string;
  RIN:             string;
  vehicleCategory: string;
  districtMunicipality: string;
  expiryDate:      string;
  issueDate:       string;
  status:          string;
  daysUntilExpiry: number;
  qrCodeUrl?:      string;
}

interface UserProfile {
  role:    string;
  entity?: string;
  name?:   string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERMIT_VALIDITY_MONTHS = 12;   // 1 year per renewal cycle
const WINDOW_DAYS            = 90;   // show riders expiring within 90 days

const PAYMENT_METHODS = [
  { value: "momo",  label: "Mobile Money"  },
  { value: "bank",  label: "Bank Transfer" },
  { value: "cash",  label: "Cash"          },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(v: string | undefined | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
}

function urgencyMeta(days: number): { color: string; label: string } {
  if (days <= 7)  return { color: "bg-red-100 text-red-700 border-red-300",       label: "Critical" };
  if (days <= 14) return { color: "bg-orange-100 text-orange-700 border-orange-300", label: "Urgent"   };
  if (days <= 30) return { color: "bg-yellow-100 text-yellow-700 border-yellow-300", label: "Soon"     };
  return            { color: "bg-blue-100 text-blue-700 border-blue-300",          label: "Upcoming"  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RenewPermitsPage() {
  const [userProfile,  setUserProfile]  = useState<UserProfile | null>(null);
  const [candidates,   setCandidates]   = useState<RenewalCandidate[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [windowDays,   setWindowDays]   = useState("30");

  // Modal state
  const [selected,      setSelected]      = useState<RenewalCandidate | null>(null);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [processing,    setProcessing]    = useState(false);
  const [modalError,    setModalError]    = useState("");
  const [modalSuccess,  setModalSuccess]  = useState("");

  // ── 1. Load current user profile ─────────────────────────────────────────
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, "admin_users", user.uid));
      setUserProfile(snap.exists() ? (snap.data() as UserProfile) : { role: "Super Admin" });
    });
    return () => unsub();
  }, []);

  // ── 2. Real-time candidates ───────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile) return;

    const ref   = collection(db, "riders");
    const today = new Date();
    const cutoff = new Date(today.getTime() + WINDOW_DAYS * 86_400_000);

    // Fetch Active riders only — District Admin scoped to their district
    const q = userProfile.role === "Super Admin"
      ? query(ref, where("status", "==", "Active"))
      : query(ref,
          where("districtMunicipality", "==", userProfile.entity),
          where("status", "==", "Active"),
        );

    const unsub = onSnapshot(q, (snap) => {
      const list: RenewalCandidate[] = [];

      snap.docs.forEach((d) => {
        const data      = d.data();
        const expiry    = data.expiryDate ? new Date(data.expiryDate) : null;
        if (!expiry || isNaN(expiry.getTime())) return; // skip malformed
        if (expiry <= today || expiry > cutoff) return; // outside window

        const daysUntilExpiry = Math.ceil(
          (expiry.getTime() - today.getTime()) / 86_400_000
        );

        list.push({
          id:                   d.id,
          fullName:             data.fullName             ?? "",
          phoneNumber:          data.phoneNumber          ?? "",
          RIN:                  data.RIN                  ?? "",
          vehicleCategory:      data.vehicleCategory      ?? "",
          districtMunicipality: data.districtMunicipality ?? "",
          expiryDate:           data.expiryDate           ?? "",
          issueDate:            data.issueDate            ?? "",
          status:               data.status               ?? "",
          daysUntilExpiry,
          qrCodeUrl:            data.qrCodeUrl,
        });
      });

      // Sort: most urgent first
      list.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
      setCandidates(list);
      setLoading(false);
    }, (err) => {
      console.error("Renewal listener error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [userProfile]);

  // ── 3. Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    candidates.length,
    critical: candidates.filter((c) => c.daysUntilExpiry <= 7).length,
    urgent:   candidates.filter((c) => c.daysUntilExpiry <= 14).length,
    thisMonth:candidates.filter((c) => c.daysUntilExpiry <= 30).length,
  }), [candidates]);

  // ── 4. Filtered list ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const maxDays = parseInt(windowDays);
    return candidates.filter((c) => {
      const matchWindow = c.daysUntilExpiry <= maxDays;
      const matchSearch = !search || [c.fullName, c.RIN, c.phoneNumber, c.districtMunicipality]
        .some((v) => v.toLowerCase().includes(search.toLowerCase()));
      return matchWindow && matchSearch;
    });
  }, [candidates, windowDays, search]);

  // ── 5. Open renewal modal ─────────────────────────────────────────────────
  const openModal = (candidate: RenewalCandidate) => {
    setSelected(candidate);
    setModalError("");
    setModalSuccess("");
    setPaymentMethod("momo");
    setModalOpen(true);
  };

  // ── 6. Process renewal ────────────────────────────────────────────────────
  const handleRenewal = async () => {
    if (!selected || !auth.currentUser) return;
    setProcessing(true);
    setModalError("");

    try {
      const newIssueDate  = new Date();
      const newExpiryDate = new Date(newIssueDate);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + PERMIT_VALIDITY_MONTHS);

      // ── Update rider document ──────────────────────────────────────────
      // RIN does NOT change — it is a permanent identity number
      // QR URL does NOT change — it encodes /verify/RIN which is permanent
      await updateDoc(doc(db, "riders", selected.id), {
        issueDate:  newIssueDate.toISOString(),
        expiryDate: newExpiryDate.toISOString(),
        status:     "Active",
        updatedAt:  serverTimestamp(),
      });

      // ── Create renewal record ──────────────────────────────────────────
      await addDoc(collection(db, "renewals"), {
        riderId:          selected.id,
        riderName:        selected.fullName,
        RIN:              selected.RIN,   // same RIN, permanent
        renewalFee:       0,              // fee collected externally — update if needed
        paymentMethod,
        status:           "completed",
        renewedBy:        auth.currentUser.uid,
        renewedAt:        serverTimestamp(),
        previousExpiry:   selected.expiryDate,
        newIssueDate:     newIssueDate.toISOString(),
        newExpiryDate:    newExpiryDate.toISOString(),
        district:         selected.districtMunicipality,
      });

      // ── Audit log ──────────────────────────────────────────────────────
      await addDoc(collection(db, "audit_logs"), {
        type:      "RENEW",
        adminUid:  auth.currentUser.uid,
        adminRole: userProfile?.role ?? "",
        action:    `Renewed registration — new expiry ${format(newExpiryDate, "dd MMM yyyy")}`,
        target:    selected.fullName,
        targetId:  selected.id,
        RIN:       selected.RIN,
        district:  selected.districtMunicipality,
        status:    "success",
        timestamp: serverTimestamp(),
      });

      setModalSuccess(
        `Renewed successfully. New expiry: ${format(newExpiryDate, "dd MMM yyyy")}`
      );
      setTimeout(() => setModalOpen(false), 1800);

    } catch (err) {
      console.error("Renewal error:", err);
      setModalError(err instanceof Error ? err.message : "Renewal failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-green-700" />
        <p className="text-slate-500 text-sm font-medium">Loading renewal candidates...</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Renewal Database</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Riders with permits expiring within the selected window
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "In Window",   value: stats.total,     color: "text-slate-900"  },
          { label: "Critical ≤7d",value: stats.critical,  color: "text-red-600"    },
          { label: "Urgent ≤14d", value: stats.urgent,    color: "text-orange-600" },
          { label: "This Month",  value: stats.thisMonth, color: "text-yellow-600" },
        ].map((s) => (
          <Card key={s.label} className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                {s.label}
              </p>
              <p className={`text-2xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Window filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by name, RIN, phone, district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={windowDays} onValueChange={setWindowDays}>
          <SelectTrigger className="w-full sm:w-52 h-10">
            <Clock className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Expiring in 7 days</SelectItem>
            <SelectItem value="14">Expiring in 14 days</SelectItem>
            <SelectItem value="30">Expiring in 30 days</SelectItem>
            <SelectItem value="60">Expiring in 60 days</SelectItem>
            <SelectItem value="90">Expiring in 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b py-3 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <RefreshCw className="h-4 w-4 text-slate-400" />
            Candidates
            <span className="ml-auto text-xs font-normal text-slate-400">
              {filtered.length} of {candidates.length}
            </span>
          </CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b">
                <TableHead className="font-bold text-slate-600 text-xs">Rider</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">RIN</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">Vehicle</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">District</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">Expiry</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">Days Left</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length > 0 ? filtered.map((c) => {
                const { color, label } = urgencyMeta(c.daysUntilExpiry);
                return (
                  <TableRow key={c.id} className="border-b hover:bg-slate-50 transition-colors">

                    <TableCell className="py-3">
                      <p className="text-sm font-semibold text-slate-900 leading-none">{c.fullName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{c.phoneNumber}</p>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs font-bold text-slate-700">{c.RIN}</span>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-slate-600">{c.vehicleCategory}</span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-500">{c.districtMunicipality || "—"}</span>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-slate-700">{fmtDate(c.expiryDate)}</span>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold border ${color}`}>
                        {c.daysUntilExpiry}d — {label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => openModal(c)}
                        className="bg-green-700 hover:bg-green-800 text-white h-8 text-xs gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Renew
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-14">
                    <CheckCircle2 className="h-10 w-10 text-green-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-semibold text-sm">
                      {search ? "No candidates match your search" : "No renewals due in this window"}
                    </p>
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="mt-2 text-xs text-green-700 underline font-semibold"
                      >
                        Clear search
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Renewal Confirmation Modal ── */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!processing) setModalOpen(o); }}>
        <DialogContent className="max-w-lg rounded-2xl p-0 border-0 shadow-2xl overflow-hidden">

          {/* Modal header */}
          <div className="bg-green-700 px-6 py-5">
            <DialogTitle className="text-lg font-bold text-white">
              Confirm Renewal
            </DialogTitle>
            <p className="text-xs text-green-200 mt-0.5">
              {selected?.fullName} — {selected?.RIN}
            </p>
          </div>

          {selected && (
            <div className="p-6 space-y-5">

              {modalError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{modalError}</AlertDescription>
                </Alert>
              )}

              {modalSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 font-medium">
                    {modalSuccess}
                  </AlertDescription>
                </Alert>
              )}

              {/* Rider summary */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Rider</p>
                  <p className="font-semibold text-slate-900">{selected.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Phone</p>
                  <p className="font-semibold text-slate-900">{selected.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">RIN</p>
                  <p className="font-mono font-bold text-green-700">{selected.RIN}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Vehicle</p>
                  <p className="font-semibold text-slate-900">{selected.vehicleCategory}</p>
                </div>
              </div>

              {/* Expiry warning */}
              <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-orange-900">
                    Expires in {selected.daysUntilExpiry} days
                  </p>
                  <p className="text-orange-700 text-xs mt-0.5">
                    Current expiry: {fmtDate(selected.expiryDate)}
                  </p>
                </div>
              </div>

              {/* New dates preview */}
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                <Calendar className="h-4 w-4 text-green-700 shrink-0" />
                <div>
                  <p className="font-bold text-green-900">New validity period</p>
                  <p className="text-green-700 text-xs mt-0.5">
                    Today → {format(
                      new Date(new Date().setMonth(new Date().getMonth() + PERMIT_VALIDITY_MONTHS)),
                      "dd MMM yyyy"
                    )}
                    {" "}({PERMIT_VALIDITY_MONTHS} months)
                  </p>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5 block">
                  Payment Method
                </label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note: RIN unchanged */}
              <p className="text-[11px] text-slate-400 italic">
                The RIN and QR code remain unchanged — only issue and expiry dates are updated.
              </p>

              <DialogFooter className="gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={processing}
                  className="flex-1 h-10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRenewal}
                  disabled={processing || !!modalSuccess}
                  className="flex-1 h-10 bg-green-700 hover:bg-green-800"
                >
                  {processing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirm Renewal</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}