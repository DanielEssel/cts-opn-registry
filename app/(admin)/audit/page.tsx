"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
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
import {
  History,
  ShieldAlert,
  User,
  Globe,
  Loader2,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Trash2,
  LogOut,
  LogIn,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuditLog {
  id: string;
  type:
    | "AUTH_LOGIN"
    | "AUTH_LOGOUT"
    | "AUTH_FAILED"
    | "RENEW"
    | "APPROVE"
    | "EDIT"
    | "DELETE"
    | "EXPORT"
    | "IMPORT";
  admin: string;
  adminId?: string;
  action: string;
  target: string;
  targetId?: string;
  ip?: string;
  status: "success" | "failed" | "warning";
  timestamp: any;
  details?: string;
}

export default function AuditLog() {
  const [userProfile, setUserProfile] = useState<{ role: string; entity: string } | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActions: 0,
    authAttempts: 0,
    renewals: 0,
    exports: 0,
    failedAttempts: 0,
  });

  // 1. FETCH USER PROFILE
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "admin_users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as any);
        } else {
          setUserProfile({ role: "Super Admin", entity: "National HQ" });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. FETCH AUDIT LOGS
  useEffect(() => {
    if (!userProfile) return;

    const logsRef = collection(db, "audit_logs");

    // Build query based on role
    const logsQuery =
      userProfile.role === "Super Admin"
        ? query(logsRef, orderBy("timestamp", "desc"), limit(50))
        : query(
            logsRef,
            where("entity", "==", userProfile.entity),
            orderBy("timestamp", "desc"),
            limit(50)
          );

    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        const logList: AuditLog[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as AuditLog),
        }));

        setLogs(logList);

        // Calculate stats
        const stats = {
          totalActions: logList.length,
          authAttempts: logList.filter((l) =>
            l.type.startsWith("AUTH")
          ).length,
          renewals: logList.filter((l) => l.type === "RENEW").length,
          exports: logList.filter((l) => l.type === "EXPORT").length,
          failedAttempts: logList.filter((l) => l.status === "failed").length,
        };

        setStats(stats);
        setLoading(false);
      },
      (error) => {
        console.error("Audit log error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case "AUTH_LOGIN":
        return <LogIn className="h-4 w-4" />;
      case "AUTH_LOGOUT":
        return <LogOut className="h-4 w-4" />;
      case "AUTH_FAILED":
        return <AlertTriangle className="h-4 w-4" />;
      case "RENEW":
        return <RefreshCw className="h-4 w-4" />;
      case "APPROVE":
        return <CheckCircle2 className="h-4 w-4" />;
      case "EDIT":
        return <Edit3 className="h-4 w-4" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4" />;
      case "EXPORT":
        return <Download className="h-4 w-4" />;
      case "IMPORT":
        return <FileText className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "AUTH_LOGIN":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "AUTH_LOGOUT":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "AUTH_FAILED":
        return "bg-red-100 text-red-700 border-red-200";
      case "RENEW":
        return "bg-green-100 text-green-700 border-green-200";
      case "APPROVE":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "EDIT":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "DELETE":
        return "bg-red-100 text-red-700 border-red-200";
      case "EXPORT":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "IMPORT":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "failed":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-white border-slate-200";
    }
  };

  const exportAuditLog = () => {
    const headers = [
      "Timestamp",
      "Administrator",
      "Action Type",
      "Target",
      "Status",
      "IP Address",
      "Details",
    ];
    const rows = logs.map((log) => [
      log.timestamp?.toDate?.().toLocaleString() || new Date().toLocaleString(),
      log.admin,
      log.type,
      log.target,
      log.status,
      log.ip || "N/A",
      log.details || "",
    ]);

    const csvContent = [headers, ...rows].map((e) => e.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Audit_Log_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium">Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">🔍 Audit Trail</h1>
          <p className="text-slate-500 font-medium">
            Immutable forensic record of all administrative activities.
          </p>
        </div>
        <div className="flex gap-3">
          <Badge className="border-green-200 bg-green-50 text-green-600 h-9 font-bold">
            <div className="h-2 w-2 bg-green-600 rounded-full mr-2" />
            Live Monitoring Active
          </Badge>
          <Button
            variant="outline"
            className="font-bold border-slate-300 rounded-lg"
            onClick={exportAuditLog}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Log
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Actions */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
              Total Actions (24h)
            </p>
            <p className="text-3xl font-black">{stats.totalActions}</p>
          </CardContent>
        </Card>

        {/* Auth Attempts */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-2">
              Auth Attempts
            </p>
            <p className="text-3xl font-black">{stats.authAttempts}</p>
          </CardContent>
        </Card>

        {/* Renewals */}
        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-green-100 uppercase tracking-widest mb-2">
              Renewals
            </p>
            <p className="text-3xl font-black">{stats.renewals}</p>
          </CardContent>
        </Card>

        {/* Exports */}
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-purple-100 uppercase tracking-widest mb-2">
              Exports
            </p>
            <p className="text-3xl font-black">{stats.exports}</p>
          </CardContent>
        </Card>

        {/* Failed Attempts */}
        <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-red-100 uppercase tracking-widest mb-2">
              Failed Attempts
            </p>
            <p className="text-3xl font-black">{stats.failedAttempts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-600" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b-2 border-slate-200">
              <TableHead className="font-bold text-slate-700">Timestamp</TableHead>
              <TableHead className="font-bold text-slate-700">Administrator</TableHead>
              <TableHead className="font-bold text-slate-700">Action</TableHead>
              <TableHead className="font-bold text-slate-700">Target</TableHead>
              <TableHead className="font-bold text-slate-700">Type</TableHead>
              <TableHead className="font-bold text-slate-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className={`text-sm border-b hover:bg-slate-50/50 transition-colors ${getStatusColor(
                    log.status
                  )}`}
                >
                  {/* Timestamp */}
                  <TableCell>
                    <div className="font-mono text-xs font-bold text-slate-700">
                      {log.timestamp?.toDate?.().toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {log.timestamp?.toDate?.().toLocaleDateString()}
                    </div>
                    {log.ip && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 font-mono">
                        <Globe className="h-3 w-3" />
                        {log.ip}
                      </div>
                    )}
                  </TableCell>

                  {/* Administrator */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                        <User className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{log.admin}</p>
                        {log.adminId && (
                          <p className="text-xs text-slate-400 font-mono">
                            {log.adminId.slice(0, 8)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Action */}
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-800">{log.action}</p>
                      {log.details && (
                        <p className="text-xs text-slate-500 mt-1 italic">{log.details}</p>
                      )}
                    </div>
                  </TableCell>

                  {/* Target */}
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-700">{log.target}</p>
                      {log.targetId && (
                        <p className="text-xs text-slate-400 font-mono">
                          {log.targetId.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <Badge
                      className={`font-bold border ${getTypeColor(log.type)}`}
                      variant="outline"
                    >
                      <span className="mr-1">
                        {getActionIcon(log.type)}
                      </span>
                      {log.type}
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      className={`font-bold border ${
                        log.status === "success"
                          ? "bg-green-100 text-green-700 border-green-300"
                          : log.status === "failed"
                          ? "bg-red-100 text-red-700 border-red-300"
                          : "bg-yellow-100 text-yellow-700 border-yellow-300"
                      }`}
                      variant="outline"
                    >
                      {log.status === "success" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : log.status === "failed" ? (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      ) : null}
                      {log.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <p className="text-slate-400 font-medium">No audit logs found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Legend */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Action Type Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { type: "AUTH_LOGIN", label: "Login" },
              { type: "AUTH_LOGOUT", label: "Logout" },
              { type: "AUTH_FAILED", label: "Failed Auth" },
              { type: "RENEW", label: "Renewal" },
              { type: "APPROVE", label: "Approval" },
              { type: "EDIT", label: "Edit" },
              { type: "DELETE", label: "Delete" },
              { type: "EXPORT", label: "Export" },
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center gap-2">
                <Badge className={`border ${getTypeColor(type)}`} variant="outline">
                  {getActionIcon(type)}
                </Badge>
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}