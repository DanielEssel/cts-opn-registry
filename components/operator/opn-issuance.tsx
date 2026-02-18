"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function OPNIssuance() {
  const [pendingRiders, setPendingRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<any | null>(null);
  const [issuingModal, setIssuingModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "riders"),
      where("status", "==", "Pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pending = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPendingRiders(pending);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleIssueOPN = async () => {
    if (!selectedRider) return;

    setIsProcessing(true);
    try {
      const riderRef = doc(db, "riders", selectedRider.id);
      
      // Generate new OPN if not exists
      const newOPN = selectedRider.opn || `OPN-${Date.now()}`;

      await updateDoc(riderRef, {
        status: "Active",
        opn: newOPN,
        issuedAt: serverTimestamp(),
        issuedBy: auth.currentUser?.uid,
      });

      // Create issuance record
      await addDoc(collection(db, "opn_issuances"), {
        riderId: selectedRider.id,
        riderName: selectedRider.fullName,
        opn: newOPN,
        issuedBy: auth.currentUser?.email,
        issuedAt: serverTimestamp(),
        status: "issued",
      });

      setIssuingModal(false);
      setSelectedRider(null);
      alert("OPN issued successfully!");
    } catch (error) {
      console.error("Error issuing OPN:", error);
      alert("Error issuing OPN");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-2">
          ✅ OPN Issuance
        </h1>
        <p className="text-slate-500 font-medium">
          Approve and issue OPN to pending registrations
        </p>
      </div>

      {/* Pending Count */}
      <Card className="bg-gradient-to-br from-orange-600 to-red-600 text-white border-none shadow-lg">
        <CardContent className="pt-6">
          <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-2">
            Pending Issuance
          </p>
          <p className="text-4xl font-black">{pendingRiders.length}</p>
        </CardContent>
      </Card>

      {/* Pending Riders */}
      <div className="space-y-3">
        {pendingRiders.length > 0 ? (
          pendingRiders.map((rider) => (
            <Card key={rider.id} className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{rider.fullName}</p>
                    <p className="text-sm text-slate-600">{rider.phoneNumber}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedRider(rider);
                      setIssuingModal(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Issue OPN
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-12 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-green-900 font-semibold">All caught up!</p>
            <p className="text-sm text-green-700 mt-1">No pending OPN issuances</p>
          </div>
        )}
      </div>

      {/* Issuance Dialog */}
      <Dialog open={issuingModal} onOpenChange={setIssuingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm OPN Issuance</DialogTitle>
            <DialogDescription>
              Are you sure you want to issue OPN to {selectedRider?.fullName}?
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              This action will activate the permit. The rider will receive their OPN via SMS.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIssuingModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleIssueOPN}
              className="bg-green-600 hover:bg-green-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Issuing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Issue OPN
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}