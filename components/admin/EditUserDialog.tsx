import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { AdminUser } from "@/app/hooks/useUsers";
import type { AdminProfile } from "@/app/hooks/useAdminProfile";

interface EditUserDialogProps {
  open: boolean;
  user: AdminUser | null;
  adminProfile: AdminProfile;
  onClose: () => void;
}

export function EditUserDialog({
  open,
  user,
  adminProfile,
  onClose,
}: EditUserDialogProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setRole(user.role ?? "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "admin_users", user.id), { name, role });
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Updating access details for{" "}
            <span className="font-semibold">{user?.name ?? "this user"}</span>.
            Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adminProfile.role === "Super Admin" && (
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                )}
                <SelectItem value="District Admin">District Admin</SelectItem>
                <SelectItem value="Operator">Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
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