"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DailyReport() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "riders"),
      where("createdBy", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todayRegs = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((reg) => {
          const createdDate = reg.createdAt?.toDate?.() || new Date(reg.createdAt);
          return createdDate >= today;
        });

      setRegistrations(todayRegs);

      const stats = {
        total: todayRegs.length,
        approved: todayRegs.filter((r) => r.status === "Active").length,
        pending: todayRegs.filter((r) => r.status === "Pending").length,
        rejected: todayRegs.filter((r) => r.status === "Rejected").length,
      };

      setStats(stats);
    });

    return () => unsubscribe();
  }, []);

  const exportReport = () => {
    const csv = [
      ["Name", "Phone", "OPN", "Vehicle", "Status", "Time"].join(","),
      ...registrations.map((r) =>
        [
          r.fullName,
          r.phoneNumber,
          r.opn,
          r.vehicleCategory,
          r.status,
          r.createdAt?.toDate?.().toLocaleString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-2">
          📋 Daily Registration Report
        </h1>
        <p className="text-slate-500 font-medium">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-xs text-blue-600 uppercase font-bold mb-2">Total</p>
            <p className="text-3xl font-black text-blue-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-xs text-green-600 uppercase font-bold mb-2">Approved</p>
            <p className="text-3xl font-black text-green-900">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-xs text-yellow-600 uppercase font-bold mb-2">Pending</p>
            <p className="text-3xl font-black text-yellow-900">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-xs text-red-600 uppercase font-bold mb-2">Rejected</p>
            <p className="text-3xl font-black text-red-900">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <Button
        onClick={exportReport}
        className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
      >
        <Download className="h-4 w-4 mr-2" />
        Export Report
      </Button>

      {/* Table */}
      <Card className="border-slate-200 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold text-slate-700">Name</TableHead>
              <TableHead className="font-bold text-slate-700">Phone</TableHead>
              <TableHead className="font-bold text-slate-700">OPN</TableHead>
              <TableHead className="font-bold text-slate-700">Vehicle</TableHead>
              <TableHead className="font-bold text-slate-700">Status</TableHead>
              <TableHead className="font-bold text-slate-700">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.length > 0 ? (
              registrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-semibold">{reg.fullName}</TableCell>
                  <TableCell className="font-mono text-sm">{reg.phoneNumber}</TableCell>
                  <TableCell>
                    <Badge className="font-mono bg-blue-100 text-blue-700">
                      {reg.opn}
                    </Badge>
                  </TableCell>
                  <TableCell>{reg.vehicleCategory}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        reg.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : reg.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {reg.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {reg.createdAt?.toDate?.().toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  No registrations today
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}