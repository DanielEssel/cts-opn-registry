"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

interface RenewalCandidate {
  id: string;
  fullName: string;
  phoneNumber: string;
  RIN: string;
  vehicleCategory: string;
  expiryDate: string;
  town: string;
  status: string;
  daysUntilExpiry: number;
}

interface RenewalRequest {
  riderId: string;
  oldRIN: string;
  newRIN: string;
  renewalFee: number;
  paymentMethod: string;
}

export default function RenewPermitsEngine() {
  const [userProfile, setUserProfile] = useState<{ role: string; entity: string } | null>(null);
  const [renewalCandidates, setRenewalCandidates] = useState<RenewalCandidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<RenewalCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDays, setFilterDays] = useState("30");
  const [selectedRider, setSelectedRider] = useState<RenewalCandidate | null>(null);
  const [isRenewingModalOpen, setIsRenewingModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalExpiring: 0,
    urgent: 0,
    thisMonth: 0,
    successfulRenewals: 0,
  });

  const RENEWAL_FEE = 100;
  const PERMIT_VALIDITY_MONTHS = 6;

  // Fetch user profile
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "admin_users", user.uid);
        const docSnap = await getDocs(query(collection(db, "admin_users")));
        const profile = docSnap.docs
          .map((d) => d.data())
          .find((d) => d.uid === user.uid);
        if (profile) {
          setUserProfile(profile as any);
        } else {
          setUserProfile({ role: "Super Admin", entity: "National HQ" });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch renewal candidates
  useEffect(() => {
    if (!userProfile) return;

    const ridersRef = collection(db, "riders");
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Query based on role
    const q =
      userProfile.role === "Super Admin"
        ? query(ridersRef, where("status", "==", "Active"))
        : query(
            ridersRef,
            where("town", "==", userProfile.entity),
            where("status", "==", "Active")
          );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const candidates: RenewalCandidate[] = [];
        let urgent = 0;
        let thisMonth = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const expiryDate = new Date(data.expiryDate);
          const daysUntilExpiry = Math.ceil(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Include permits expiring within 90 days
          if (expiryDate <= ninetyDaysFromNow && expiryDate > today) {
            candidates.push({
              id: doc.id,
              fullName: data.fullName,
              phoneNumber: data.phoneNumber,
              RIN: data.RIN,
              vehicleCategory: data.vehicleCategory,
              expiryDate: data.expiryDate,
              town: data.town,
              status: data.status,
              daysUntilExpiry,
            });

            if (daysUntilExpiry <= 7) urgent++;
            if (daysUntilExpiry <= 30) thisMonth++;
          }
        });

        setRenewalCandidates(candidates);
        setStats({
          totalExpiring: candidates.length,
          urgent,
          thisMonth,
          successfulRenewals: 0,
        });

        setLoading(false);
      },
      (error) => {
        console.error("Renewal query error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  // Filter candidates based on search and days filter
  useEffect(() => {
    let filtered = renewalCandidates.filter((candidate) => {
      const matchesSearch =
        candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.RIN.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.phoneNumber.includes(searchTerm);

      const matchesDays = candidate.daysUntilExpiry <= parseInt(filterDays);

      return matchesSearch && matchesDays;
    });

    setFilteredCandidates(filtered);
  }, [searchTerm, filterDays, renewalCandidates]);

  const handleRenewal = async () => {
    if (!selectedRider) return;

    setIsProcessing(true);
    try {
      // Generate new RIN
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = String(today.getFullYear()).slice(-2);
      const newRIN = `${selectedRider.RIN.split("-")[0]}-${parseInt(selectedRider.RIN.split("-")[1]) + 1}-${month}-${year}`;

      // Calculate new expiry date
      const newExpiryDate = new Date();
      newExpiryDate.setMonth(newExpiryDate.getMonth() + PERMIT_VALIDITY_MONTHS);

      // Update rider record
      const riderRef = doc(db, "riders", selectedRider.id);
      await updateDoc(riderRef, {
        RIN: newRIN,
        issueDate: serverTimestamp(),
        expiryDate: newExpiryDate.toISOString(),
        status: "Active",
        updatedAt: serverTimestamp(),
      });

      // Create renewal record
      await addDoc(collection(db, "renewals"), {
        riderId: selectedRider.id,
        riderName: selectedRider.fullName,
        oldRIN: selectedRider.RIN,
        newRIN,
        renewalFee: RENEWAL_FEE,
        paymentMethod,
        status: "completed",
        renewedBy: auth.currentUser?.uid,
        renewedAt: serverTimestamp(),
        nextExpiryDate: newExpiryDate.toISOString(),
      });

      // Create audit log
      await addDoc(collection(db, "audit_logs"), {
        type: "RENEW",
        admin: auth.currentUser?.email,
        action: `Renewed Rider Identification ${selectedRider.RIN} to ${newRIN}`,
        target: selectedRider.fullName,
        targetId: selectedRider.id,
        status: "success",
        timestamp: serverTimestamp(),
        entity: userProfile?.entity,
      });

      // Close modal and reset
      setIsRenewingModalOpen(false);
      setSelectedRider(null);
      setPaymentMethod("momo");

      // Show success notification (you can use a toast here)
      alert(`Permit renewed successfully!\nNew RIN: ${newRIN}`);
    } catch (error) {
      console.error("Renewal error:", error);
      alert("Error processing renewal. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 7) return "bg-red-100 text-red-700 border-red-300";
    if (daysLeft <= 14) return "bg-orange-100 text-orange-700 border-orange-300";
    if (daysLeft <= 30) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-blue-100 text-blue-700 border-blue-300";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium">Loading renewal candidates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-2">
          🔄 Identification Number Renewal Engine
        </h1>
        <p className="text-slate-500 font-medium">
          Manage and process RIN renewals for expiring permits
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2">
              Total Expiring
            </p>
            <p className="text-3xl font-black">{stats.totalExpiring}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <p className="text-red-100 text-xs font-bold uppercase tracking-widest mb-2">
              Urgent (7 Days)
            </p>
            <p className="text-3xl font-black">{stats.urgent}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-2">
              This Month
            </p>
            <p className="text-3xl font-black">{stats.thisMonth}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <p className="text-green-100 text-xs font-bold uppercase tracking-widest mb-2">
              Renewed
            </p>
            <p className="text-3xl font-black">{stats.successfulRenewals}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Search by name, RIN, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <Select value={filterDays} onValueChange={setFilterDays}>
              <SelectTrigger className="w-full md:w-48 rounded-lg">
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
        </CardContent>
      </Card>

      {/* Renewal Candidates Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Renewal Candidates ({filteredCandidates.length})
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b-2 border-slate-200">
              <TableHead className="font-bold text-slate-700">Rider</TableHead>
              <TableHead className="font-bold text-slate-700">RIN</TableHead>
              <TableHead className="font-bold text-slate-700">Vehicle</TableHead>
              <TableHead className="font-bold text-slate-700">Expiry Date</TableHead>
              <TableHead className="font-bold text-slate-700">Days Left</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <TableRow key={candidate.id} className="text-sm hover:bg-slate-50/50">
                  <TableCell>
                    <div>
                      <p className="font-bold text-slate-900">{candidate.fullName}</p>
                      <p className="text-xs text-slate-500">{candidate.phoneNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono font-bold">
                      {candidate.RIN}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{candidate.vehicleCategory}</TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(candidate.expiryDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`font-bold border ${getUrgencyColor(
                        candidate.daysUntilExpiry
                      )}`}
                      variant="outline"
                    >
                      {candidate.daysUntilExpiry} days
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                      onClick={() => {
                        setSelectedRider(candidate);
                        setIsRenewingModalOpen(true);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renew
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <p className="text-slate-400 font-medium">No renewal candidates found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Renewal Modal */}
      <Dialog open={isRenewingModalOpen} onOpenChange={setIsRenewingModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Process Rider Identification Number Renewal</DialogTitle>
            <DialogDescription>
              Review and confirm renewal details for {selectedRider?.fullName}
            </DialogDescription>
          </DialogHeader>

          {selectedRider && (
            <div className="space-y-6">
              {/* Rider Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                    Full Name
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {selectedRider.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                    Phone
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {selectedRider.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                    Current RIN
                  </p>
                  <p className="text-base font-mono font-bold text-blue-600">
                    {selectedRider.RIN}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                    Vehicle
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {selectedRider.vehicleCategory}
                  </p>
                </div>
              </div>

              {/* Renewal Details */}
              <div className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-orange-900">
                      Current RIN expires in {selectedRider.daysUntilExpiry} days
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      Expiry Date: {new Date(selectedRider.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-sm font-bold text-slate-900 mb-2 block">
                  Payment Method
                </label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="momo">Mobile Money</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fee Summary */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">Renewal Fee:</span>
                  <span className="font-bold text-lg text-green-600">GH₵ {RENEWAL_FEE}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">New Validity:</span>
                  <span className="font-bold text-slate-900">
                    {PERMIT_VALIDITY_MONTHS} months
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-lg font-bold"
              onClick={() => setIsRenewingModalOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
              onClick={handleRenewal}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Renewal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}