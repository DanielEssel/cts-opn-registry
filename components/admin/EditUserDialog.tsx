"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db }       from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast }    from "sonner";
import { Loader2 }  from "lucide-react";
import type { AdminUser }    from "@/app/hooks/useUsers";
import type { AdminProfile } from "@/app/hooks/useAdminProfile";
import { DISTRICTS, ROLES }  from "@/app/(admin)/settings/constants";

interface EditUserDialogProps {
  open:         boolean;
  user:         AdminUser | null;
  adminProfile: AdminProfile;
  onClose:      () => void;
}

export function EditUserDialog({
  open,
  user,
  adminProfile,
  onClose,
}: EditUserDialogProps) {
  const [name,    setName]    = useState("");
  const [role,    setRole]    = useState("");
  const [entity,  setEntity]  = useState("");
  const [status,  setStatus]  = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isSuperAdmin = adminProfile.role === "Super Admin";

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name   ?? "");
      setRole(user.role   ?? "Operator");
      setEntity(user.entity ?? "");
      setStatus(user.status ?? "Active");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updates: Record<string, any> = {
        name,
        role,
        status,
        updatedAt: serverTimestamp(),
      };

      // Only Super Admin can change the entity
      if (isSuperAdmin) {
        updates.entity = entity;
      }

      await updateDoc(doc(db, "admin_users", user.id), updates);
      toast.success("Profile updated successfully.");
      onClose();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Permission denied. You cannot edit this user.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Updating access details for{" "}
            <span className="font-semibold">{user?.name ?? "this user"}</span>.
            Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
              placeholder="Official full name"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isSuperAdmin && (
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                )}
                <SelectItem value="District Admin">District Admin</SelectItem>
                <SelectItem value="Operator">Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entity — Super Admin can change it; others see it locked */}
          <div className="space-y-2">
            <Label>District / Entity</Label>
            {isSuperAdmin ? (
              <Select value={entity} onValueChange={setEntity}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a district" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={entity}
                disabled
                className="h-10 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Account Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}