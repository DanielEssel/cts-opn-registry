"use client";

import { useEffect, useState, useMemo } from "react";
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
  getDocs,
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
  Loader2,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Edit3,
  Trash2,
  LogIn,
  LogOut,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType =
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

type LogStatus = "success" | "failed" | "warning";

interface AuditLog {
  id: string;
  type: ActionType;
  adminUid: string;
  adminRole?: string;
  action: string;
  target: string;
  targetId?: string;
  RIN?: string;
  district?: string;
  status: LogStatus;
  timestamp: any;
}

interface UserProfile {
  uid: string;
  role: string;
  entity?: string;
  name?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(ts: any): Date {
  if (!ts) return new Date();
  if (typeof ts.toDate === "function") return ts.toDate();
  return new Date(ts);
}

const ACTION_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  REGISTER: {
    label: "Registered",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: <UserPlus className="h-3 w-3" />,
  },
  STATUS_CHANGE: {
    label: "Status Changed",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: <RefreshCw className="h-3 w-3" />,
  },
  RENEW: {
    label: "Renewed",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <RefreshCw className="h-3 w-3" />,
  },
  APPROVE: {
    label: "Approved",
    color: "bg-teal-100 text-teal-700 border-teal-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  EDIT: {
    label: "Edited",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: <Edit3 className="h-3 w-3" />,
  },
  DELETE: {
    label: "Deleted",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <Trash2 className="h-3 w-3" />,
  },
  EXPORT: {
    label: "Exported",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: <Download className="h-3 w-3" />,
  },
  IMPORT: {
    label: "Imported",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    icon: <FileText className="h-3 w-3" />,
  },
  AUTH_LOGIN: {
    label: "Logged In",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <LogIn className="h-3 w-3" />,
  },
  AUTH_LOGOUT: {
    label: "Logged Out",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    icon: <LogOut className="h-3 w-3" />,
  },
  AUTH_FAILED: {
    label: "Auth Failed",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

const FILTER_TABS = [
  { key: "ALL", label: "All" },
  { key: "REGISTER", label: "Registrations" },
  { key: "RENEW", label: "Renewals" },
  { key: "APPROVE", label: "Approvals" },
  { key: "EDIT", label: "Edits" },
  { key: "DELETE", label: "Deletions" },
  { key: "AUTH_FAILED", label: "Failed" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [adminMap, setAdminMap] = useState<Record<string, string>>({});
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // ── 1. Load current user profile ─────────────────────────────────────────
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, "admin_users", user.uid));
      if (snap.exists()) {
        const d = snap.data() as any;
        setUserProfile({
          uid: user.uid,
          role: d.role,
          entity: d.entity,
          name: d.name,
        });
      }
    });
    return () => unsub();
  }, []);

  // ── 2. Batch fetch all admin names + roles once ───────────────────────────
  useEffect(() => {
    getDocs(collection(db, "admin_users")).then((snap) => {
      const names: Record<string, string> = {};
      const roles: Record<string, string> = {};
      snap.docs.forEach((d) => {
        const data = d.data() as any;
        names[d.id] = data.name || data.email || "Unknown";
        roles[d.id] = data.role ?? "";
      });
      setAdminMap(names);
      setRoleMap(roles);
    });
  }, []);

  // ── 3. Real-time logs listener (role-scoped) ──────────────────────────────
  useEffect(() => {
    if (!userProfile) return;

    const ref = collection(db, "audit_logs");

    const q =
      userProfile.role === "Super Admin"
        ? // Super Admin: all logs
          query(ref, orderBy("timestamp", "desc"), limit(500))
        : // District Admin: all logs where district == their entity
          userProfile.role === "District Admin" && userProfile.entity
          ? query(
              ref,
              where("district", "==", userProfile.entity),
              orderBy("timestamp", "desc"),
              limit(200),
            )
          : // Operator: only their own actions
            query(
              ref,
              where("adminUid", "==", userProfile.uid),
              orderBy("timestamp", "desc"),
              limit(100),
            );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AuditLog, "id">),
          })),
        );
        setLoading(false);
      },
      (err) => {
        console.error("Audit log error:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [userProfile]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: logs.length,
      today: logs.filter(
        (l) => toDate(l.timestamp).toDateString() === new Date().toDateString(),
      ).length,
      registrations: logs.filter((l) => l.type === "REGISTER").length,
      renewals: logs.filter((l) => l.type === "RENEW").length,
      failed: logs.filter((l) => l.status === "failed").length,
    }),
    [logs],
  );

  // ── Client-side filter ────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      logs.filter((l) => {
        const matchType = typeFilter === "ALL" || l.type === typeFilter;
        const adminName = adminMap[l.adminUid] ?? "";
        const matchSearch =
          !search ||
          [l.target, l.RIN ?? "", adminName, l.action, l.district ?? ""].some(
            (v) => v.toLowerCase().includes(search.toLowerCase()),
          );
        return matchType && matchSearch;
      }),
    [logs, typeFilter, search, adminMap],
  );

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = [
      "Timestamp",
      "Registrar",
      "Role",
      "Action",
      "Rider / Applicant",
      "RIN",
      "District",
      "Status",
    ];
    const rows = filtered.map((l) => [
      format(toDate(l.timestamp), "dd MMM yyyy HH:mm:ss"),
      adminMap[l.adminUid] ?? l.adminUid,
      roleMap[l.adminUid] ?? l.adminRole ?? "",
      ACTION_META[l.type]?.label ?? l.type,
      l.target,
      l.RIN ?? "",
      l.district ?? "",
      l.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `audit-${format(new Date(), "yyyy-MM-dd")}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-green-700" />
        <p className="text-slate-500 text-sm font-medium">
          Loading audit trail...
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {userProfile?.role === "District Admin"
              ? `All activity for ${userProfile.entity}`
              : userProfile?.role === "Operator"
                ? "Your activity log"
                : "Real-time log of all system actions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-50 text-green-700 border border-green-200 gap-1.5 h-8 px-3">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Live
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: "Total Entries",
            value: stats.total,
            color: "text-slate-900",
          },
          { label: "Today", value: stats.today, color: "text-blue-600" },
          {
            label: "Registrations",
            value: stats.registrations,
            color: "text-green-700",
          },
          {
            label: "Renewals",
            value: stats.renewals,
            color: "text-emerald-700",
          },
          {
            label: "Failed Actions",
            value: stats.failed,
            color: "text-red-600",
          },
        ].map((s) => (
          <Card key={s.label} className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                {s.label}
              </p>
              <p className={`text-2xl font-black mt-0.5 ${s.color}`}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by rider, RIN, registrar, district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                typeFilter === t.key
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white text-slate-600 border-slate-200 hover:border-green-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b py-3 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <History className="h-4 w-4 text-slate-400" />
            Activity Log
            <span className="ml-auto text-xs font-normal text-slate-400">
              {filtered.length} of {logs.length} entries
            </span>
          </CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b">
                <TableHead className="font-bold text-slate-600 text-xs w-36">
                  Timestamp
                </TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">
                  Registrar
                </TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">
                  Action
                </TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">
                  Rider / Applicant
                </TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((log) => {
                  const meta = ACTION_META[log.type] ?? ACTION_META["EDIT"];
                  const adminName =
                    (log as any).adminName ??
                    adminMap[log.adminUid] ??
                    "Unknown";
                  const adminRole =
                    roleMap[log.adminUid] ?? log.adminRole ?? "";
                  const d = toDate(log.timestamp);
                  const isAuth = log.type.startsWith("AUTH");

                  return (
                    <TableRow
                      key={log.id}
                      className={`border-b transition-colors hover:bg-slate-50 ${
                        log.status === "failed"
                          ? "bg-red-50/40"
                          : log.status === "warning"
                            ? "bg-yellow-50/40"
                            : ""
                      }`}
                    >
                      {/* Timestamp */}
                      <TableCell className="w-36 py-3">
                        <p className="text-xs font-bold text-slate-800 font-mono">
                          {format(d, "hh:mm a")}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {format(d, "dd MMM yyyy")}
                        </p>
                      </TableCell>

                      {/* Registrar */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-black shrink-0">
                            {adminName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 leading-none">
                              {adminName}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {adminRole}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold gap-1 border ${meta.color}`}
                        >
                          {meta.icon}
                          {meta.label}
                        </Badge>
                      </TableCell>

                      {/* Rider */}
                      <TableCell className="py-3">
                        {isAuth ? (
                          <span className="text-xs text-slate-400 italic">
                            —
                          </span>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-slate-800 leading-none">
                              {log.target || "—"}
                            </p>
                            {log.RIN && (
                              <p className="text-[10px] font-mono text-green-700 mt-1">
                                {log.RIN}
                              </p>
                            )}
                            {log.district && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {log.district}
                              </p>
                            )}
                          </>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold gap-1 ${
                            log.status === "success"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : log.status === "failed"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {log.status === "success" && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {log.status === "failed" && (
                            <XCircle className="h-3 w-3" />
                          )}
                          {log.status === "warning" && (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {log.status.charAt(0).toUpperCase() +
                            log.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <History className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-semibold text-sm">
                      {search || typeFilter !== "ALL"
                        ? "No entries match your filter"
                        : "No audit logs yet"}
                    </p>
                    {(search || typeFilter !== "ALL") && (
                      <button
                        onClick={() => {
                          setSearch("");
                          setTypeFilter("ALL");
                        }}
                        className="mt-3 text-xs text-green-700 underline font-semibold"
                      >
                        Clear filters
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
