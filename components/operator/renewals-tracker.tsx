"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Clock } from "lucide-react";

export default function RenewalsTracker() {
  const [renewals, setRenewals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    urgent: 0,
    thisMonth: 0,
    nextMonth: 0,
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    const q = query(
      collection(db, "riders"),
      where("status", "==", "Active")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let urgent = 0, thisMonth = 0, nextMonth = 0;
      const renewalsList: any[] = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.expiryDate) {
          const expiryDate = new Date(data.expiryDate);

          if (expiryDate <= thirtyDaysFromNow && expiryDate > today) {
            urgent++;
            renewalsList.push({
              id: doc.id,
              ...data,
              daysLeft: Math.ceil(
                (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              ),
              urgency: "urgent",
            });
          } else if (expiryDate <= sixtyDaysFromNow) {
            thisMonth++;
            renewalsList.push({
              id: doc.id,
              ...data,
              daysLeft: Math.ceil(
                (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              ),
              urgency: "normal",
            });
          }
        }
      });

      setRenewals(renewalsList.sort((a, b) => a.daysLeft - b.daysLeft));
      setStats({ urgent, thisMonth, nextMonth });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-2">
          🔄 Renewals Tracker
        </h1>
        <p className="text-slate-500 font-medium">
          Track and manage permit renewals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-xs text-red-600 uppercase font-bold mb-2">Urgent</p>
            <p className="text-3xl font-black text-red-900">{stats.urgent}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-xs text-yellow-600 uppercase font-bold mb-2">This Month</p>
            <p className="text-3xl font-black text-yellow-900">{stats.thisMonth}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-xs text-blue-600 uppercase font-bold mb-2">Total</p>
            <p className="text-3xl font-black text-blue-900">{renewals.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Renewals List */}
      <div className="space-y-3">
        {renewals.length > 0 ? (
          renewals.map((renewal) => (
            <Card key={renewal.id} className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{renewal.fullName}</p>
                    <p className="text-sm text-slate-600">{renewal.opn}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge
                        className={
                          renewal.urgency === "urgent"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }
                      >
                        {renewal.daysLeft} days
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-lg"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renew
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-12 bg-green-50 rounded-lg">
            <p className="text-green-900 font-semibold">No renewals needed</p>
          </div>
        )}
      </div>
    </div>
  );
}