"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export default function ApprovalsDashboard() {
  const [approvals, setApprovals] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "riders"),
      where("status", "==", "Pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pendingApprovals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setApprovals(pendingApprovals);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-2">
          ⏳ Pending Approvals
        </h1>
        <p className="text-slate-500 font-medium">
          Registrations awaiting system approval
        </p>
      </div>

      {/* Approval Count */}
      <Card className="bg-gradient-to-br from-red-600 to-orange-600 text-white border-none shadow-lg">
        <CardContent className="pt-6">
          <p className="text-red-100 text-xs font-bold uppercase mb-2">Total Pending</p>
          <p className="text-4xl font-black">{approvals.length}</p>
        </CardContent>
      </Card>

      {/* Approvals List */}
      <div className="space-y-3">
        {approvals.length > 0 ? (
          approvals.map((approval) => (
            <Card key={approval.id} className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{approval.fullName}</p>
                    <p className="text-sm text-slate-600">
                      Submitted: {approval.createdAt?.toDate?.().toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">
                    Awaiting System Approval
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-12 bg-green-50 rounded-lg">
            <p className="text-green-900 font-semibold">All caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}