import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Edit,
  KeyRound,
  Mail,
  MoreVertical,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import type { AdminUser } from "@/app/hooks/useUsers";
import type { AdminProfile } from "@/app/hooks/useAdminProfile";
import { EditUserDialog } from "./EditUserDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface UsersTableProps {
  users: AdminUser[];
  adminProfile: AdminProfile;
}

export function UsersTable({ users, adminProfile }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // Password reset confirmation state
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const isSuperAdmin = adminProfile.role === "Super Admin";

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.entity?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = user.status === "Active" ? "Suspended" : "Active";
    try {
      await updateDoc(doc(db, "admin_users", user.id), { status: newStatus });
      toast.success(
        `${user.name} has been ${newStatus === "Active" ? "activated" : "suspended"}.`
      );
    } catch {
      toast.error("Failed to update status. Check your permissions.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "admin_users", deleteTarget.id));
      toast.success(`${deleteTarget.name} has been removed from the system.`);
    } catch {
      toast.error("Failed to delete user. Check your permissions.");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Sends a Firebase password reset email to the target user's address.
  // Firebase delivers the email from your project's configured sender —
  // the user clicks the link to set a new password.
  //
  // Guard rules:
  //   - Super Admin  → can reset any user's password
  //   - District Admin → can only reset Operators/District Admins within their
  //     entity; cannot reset Super Admin accounts
  const canResetPassword = (user: AdminUser) => {
    if (isSuperAdmin) return true;
    return user.role !== "Super Admin" && user.entity === adminProfile.entity;
  };

  const handleConfirmReset = async () => {
    if (!resetTarget) return;
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, resetTarget.email);
      toast.success(
        `Reset link sent to ${resetTarget.email}. They have 1 hour to use it.`
      );
    } catch (err: any) {
      // auth/user-not-found means the email isn't in Firebase Auth
      if (err.code === "auth/user-not-found") {
        toast.error("No Firebase Auth account found for this email.");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsSendingReset(false);
      setResetTarget(null);
    }
  };

  // Delete guard: can't delete yourself or a Super Admin (unless you are Super Admin)
  const canDelete = (user: AdminUser) =>
    adminProfile.uid !== user.id &&
    (isSuperAdmin || user.role !== "Super Admin");

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const d = ts?.toDate?.() ?? new Date(ts);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg font-bold">
              {isSuperAdmin ? "All Administrative Accounts" : `${adminProfile.entity ?? "District"} Accounts`}
            </CardTitle>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search name, email, entity…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 w-56 text-sm"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 w-40 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Roles</SelectItem>
                  {isSuperAdmin && (
                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                  )}
                  <SelectItem value="District Admin">District Admin</SelectItem>
                  <SelectItem value="Operator">Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">User</TableHead>
                <TableHead className="font-bold text-slate-700">Role</TableHead>
                {isSuperAdmin && (
                  <TableHead className="font-bold text-slate-700">Entity</TableHead>
                )}
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Created</TableHead>
                <TableHead className="text-right font-bold text-slate-700 pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs border border-blue-100 uppercase">
                        {user.name?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Shield
                        className={`h-3.5 w-3.5 ${
                          user.role === "Super Admin"
                            ? "text-blue-600"
                            : "text-slate-400"
                        }`}
                      />
                      {user.role}
                    </div>
                  </TableCell>

                  {/* Entity column only shown to Super Admin */}
                  {isSuperAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 className="h-3.5 w-3.5" />
                        {user.entity || "—"}
                      </div>
                    </TableCell>
                  )}

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`rounded-full border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-slate-500">
                    {formatDate(user.createdAt)}
                  </TableCell>

                  <TableCell className="text-right pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-slate-100 rounded-full"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                        <DropdownMenuItem onClick={() => setEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                          <Shield className="mr-2 h-4 w-4" />
                          {user.status === "Active"
                            ? "Suspend Account"
                            : "Activate Account"}
                        </DropdownMenuItem>

                        {/* Password reset — only shown when the current admin
                            has permission to reset this particular user */}
                        {canResetPassword(user) && (
                          <DropdownMenuItem onClick={() => setResetTarget(user)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Send Password Reset
                          </DropdownMenuItem>
                        )}

                        {canDelete(user) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:bg-red-50 focus:text-red-600"
                              onClick={() => setDeleteTarget(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove User
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

          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm">
              {search || roleFilter !== "All"
                ? "No users match your search or filter."
                : "No administrative accounts found."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Edit dialog ──────────────────────────────────────────────────── */}
      <EditUserDialog
        open={!!editUser}
        user={editUser}
        adminProfile={adminProfile}
        onClose={() => setEditUser(null)}
      />

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        userName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Password reset confirmation ───────────────────────────────────── */}
      <AlertDialog
        open={!!resetTarget}
        onOpenChange={(v) => !v && setResetTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Password Reset?</AlertDialogTitle>
            <AlertDialogDescription>
              A reset link will be emailed to{" "}
              <span className="font-semibold text-slate-900">
                {resetTarget?.email}
              </span>
              . The link expires after 1 hour. The user&apos;s current password
              remains active until they complete the reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingReset}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              disabled={isSendingReset}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSendingReset ? "Sending…" : "Send Reset Link"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}