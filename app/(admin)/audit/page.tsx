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
  UserPlus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================

interface AuditLog {
  id: string;
  type:
    | "AUTH_LOGIN"
    | "AUTH_LOGOUT"
    | "AUTH_FAILED"
    | "REGISTER"
    | "RENEW"
    | "APPROVE"
    | "EDIT"
    | "DELETE"
    | "STATUS_CHANGE"
    | "EXPORT"
    | "IMPORT";
  admin: string; // User ID who performed action
  adminName?: string; // Operator/Admin name (fetched)
  action: string;
  target: string;
  targetId?: string;
  ip?: string;
  status: "success" | "failed" | "warning";
  timestamp: any;
  details?: string;
}

interface UserProfile {
  role: string;
  entity?: string;
  fullName?: string;
  email?: string;
}

// ============================================================================
// AUDIT LOG PAGE
// ============================================================================

export default function AuditLogPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActions: 0,
    authAttempts: 0,
    registrations: 0,
    renewals: 0,
    exports: 0,
    failedAttempts: 0,
  });

  // ========================================================================
  // FETCH USER PROFILE
  // ========================================================================

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "admin_users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          setUserProfile({
            role: "Super Admin",
            entity: "National HQ",
            fullName: "System Admin",
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ========================================================================
  // FETCH OPERATOR NAME
  // ========================================================================

  const fetchOperatorName = async (userId: string): Promise<string> => {
    try {
      const userDoc = await getDoc(doc(db, "admin_users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data.fullName || data.email || "Unknown User";
      }
      return "Unknown User";
    } catch (error) {
      console.error("Error fetching operator name:", error);
      return "Unknown User";
    }
  };

  // ========================================================================
  // FETCH AUDIT LOGS
  // ========================================================================

  useEffect(() => {
    if (!userProfile) return;

    const logsRef = collection(db, "audit_logs");

    // Build query based on role
    const logsQuery =
      userProfile.role === "Super Admin"
        ? query(logsRef, orderBy("timestamp", "desc"), limit(100))
        : query(
            logsRef,
            where("entity", "==", userProfile.entity),
            orderBy("timestamp", "desc"),
            limit(100),
          );

    const unsubscribe = onSnapshot(
      logsQuery,
      async (snapshot) => {
        const logList: AuditLog[] = [];

        // Fetch operator names for each log
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const operatorName = await fetchOperatorName(data.admin);

          logList.push({
            ...data,
            id: docSnap.id, // Override any id in data with document id
            adminName: operatorName,
          } as AuditLog);
        }

        setLogs(logList);

        // Calculate stats
        const calculatedStats = {
          totalActions: logList.length,
          authAttempts: logList.filter((l) => l.type.startsWith("AUTH")).length,
          registrations: logList.filter((l) => l.type === "REGISTER").length,
          renewals: logList.filter((l) => l.type === "RENEW").length,
          exports: logList.filter((l) => l.type === "EXPORT").length,
          failedAttempts: logList.filter((l) => l.status === "failed").length,
        };

        setStats(calculatedStats);
        setLoading(false);
      },
      (error) => {
        console.error("Audit log error:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userProfile]);

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  const getActionIcon = (type: string) => {
    switch (type) {
      case "AUTH_LOGIN":
        return <LogIn className="h-4 w-4" />;
      case "AUTH_LOGOUT":
        return <LogOut className="h-4 w-4" />;
      case "AUTH_FAILED":
        return <AlertTriangle className="h-4 w-4" />;
      case "REGISTER":
        return <UserPlus className="h-4 w-4" />;
      case "RENEW":
        return <RefreshCw className="h-4 w-4" />;
      case "APPROVE":
        return <CheckCircle2 className="h-4 w-4" />;
      case "EDIT":
        return <Edit3 className="h-4 w-4" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4" />;
      case "STATUS_CHANGE":
        return <RefreshCw className="h-4 w-4" />;
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
      case "REGISTER":
        return "bg-green-100 text-green-700 border-green-200";
      case "RENEW":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "APPROVE":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "EDIT":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "DELETE":
        return "bg-red-100 text-red-700 border-red-200";
      case "STATUS_CHANGE":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "EXPORT":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "IMPORT":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-100";
      case "failed":
        return "bg-red-50 border-red-100";
      case "warning":
        return "bg-yellow-50 border-yellow-100";
      default:
        return "bg-white border-slate-100";
    }
  };

  // ========================================================================
  // EXPORT AUDIT LOG
  // ========================================================================

  const exportAuditLog = () => {
    const headers = [
      "Timestamp",
      "Operator/Admin",
      "Action Type",
      "Action",
      "Target",
      "Status",
      "IP Address",
      "Details",
    ];
    const rows = logs.map((log) => [
      log.timestamp?.toDate?.().toLocaleString() || new Date().toLocaleString(),
      log.adminName || "Unknown",
      log.type,
      log.action,
      log.target,
      log.status,
      log.ip || "N/A",
      log.details || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Audit_Log_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        <p className="text-slate-500 font-semibold">Loading audit logs...</p>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Audit Trail</h1>
          <p className="text-slate-500 mt-2">
            Complete record of all system activities and administrative actions
          </p>
        </div>
        <div className="flex gap-3">
          <Badge className="border-green-200 bg-green-50 text-green-700 h-9 font-semibold px-4">
            <div className="h-2 w-2 bg-green-600 rounded-full mr-2 animate-pulse" />
            Live Monitoring
          </Badge>
          <Button
            variant="outline"
            className="font-semibold"
            onClick={exportAuditLog}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
              Total Actions
            </p>
            <p className="text-3xl font-bold text-slate-900">
              {stats.totalActions}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
              Auth Attempts
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {stats.authAttempts}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
              Registrations
            </p>
            <p className="text-3xl font-bold text-green-600">
              {stats.registrations}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
              Renewals
            </p>
            <p className="text-3xl font-bold text-emerald-600">
              {stats.renewals}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
              Exports
            </p>
            <p className="text-3xl font-bold text-purple-600">
              {stats.exports}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
              Failed
            </p>
            <p className="text-3xl font-bold text-red-600">
              {stats.failedAttempts}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AUDIT TABLE */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-200">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-600" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold text-slate-700">
                Timestamp
              </TableHead>
              <TableHead className="font-bold text-slate-700">
                Operator/Admin
              </TableHead>
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
                  className={`border-b hover:bg-slate-50 transition-colors ${getStatusColor(
                    log.status,
                  )}`}
                >
                  {/* TIMESTAMP */}
                  <TableCell className="font-mono text-xs">
                    <div className="font-bold text-slate-900">
                      {log.timestamp?.toDate?.().toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                    <div className="text-slate-500 mt-1">
                      {log.timestamp?.toDate?.().toLocaleDateString()}
                    </div>
                    {log.ip && (
                      <div className="flex items-center gap-1 text-slate-400 mt-1">
                        <Globe className="h-3 w-3" />
                        {log.ip}
                      </div>
                    )}
                  </TableCell>

                  {/* OPERATOR/ADMIN */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                        {log.adminName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {log.adminName || "Unknown User"}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {log.admin.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* ACTION */}
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {log.action}
                      </p>
                      {log.details && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* TARGET */}
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-700">
                        {log.target}
                      </p>
                      {log.targetId && (
                        <p className="text-xs text-slate-400 font-mono mt-1">
                          {log.targetId.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* TYPE */}
                  <TableCell>
                    <Badge
                      className={`font-semibold border ${getTypeColor(log.type)}`}
                      variant="outline"
                    >
                      <span className="mr-1">{getActionIcon(log.type)}</span>
                      {log.type.replace("_", " ")}
                    </Badge>
                  </TableCell>

                  {/* STATUS */}
                  <TableCell>
                    <Badge
                      className={`font-semibold ${
                        log.status === "success"
                          ? "bg-green-100 text-green-700 border-green-300"
                          : log.status === "failed"
                            ? "bg-red-100 text-red-700 border-red-300"
                            : "bg-yellow-100 text-yellow-700 border-yellow-300"
                      }`}
                      variant="outline"
                    >
                      {log.status === "success" && (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {log.status === "failed" && (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {log.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <History className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold">
                    No audit logs found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Activity will appear here as actions are performed
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* LEGEND */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Action Type Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { type: "AUTH_LOGIN", label: "Login" },
              { type: "AUTH_LOGOUT", label: "Logout" },
              { type: "REGISTER", label: "Registration" },
              { type: "RENEW", label: "Renewal" },
              { type: "APPROVE", label: "Approval" },
              { type: "EDIT", label: "Edit" },
              { type: "STATUS_CHANGE", label: "Status Change" },
              { type: "DELETE", label: "Delete" },
              { type: "EXPORT", label: "Export" },
              { type: "IMPORT", label: "Import" },
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center gap-2">
                <Badge
                  className={`border ${getTypeColor(type)}`}
                  variant="outline"
                >
                  {getActionIcon(type)}
                </Badge>
                <span className="text-sm font-medium text-slate-700">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
