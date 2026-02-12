"use client";

import { useEffect, useState } from "react";
import { db, auth, firebaseConfig } from "@/lib/firebase";
import { initializeApp, getApp } from "firebase/app";
import { Label } from "@/components/ui/label";
import {
  DialogContent,
  DialogFooter,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  setDoc,
  doc,
  serverTimestamp,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signOut,
  getAuth,
} from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {  Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  UserPlus,
  Shield,
  Building2,
  Mail,
  MoreVertical,
  Loader2,
  Lock,
  AlertCircle,
} from "lucide-react";
import { onSnapshot, collection, where, query } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Dialog } from "@/components/ui/dialog";
export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [adminProfile, setAdminProfile] = useState<any>(null); // Track logged-in admin

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Suspended" : "Active";
    try {
      await updateDoc(doc(db, "admin_users", userId), {
        status: newStatus,
      });
    } catch (error) {
      alert("Error updating status");
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    entity: "",
    role: "Operator", // Defaulting to Operator for safer provisioning
  });

  useEffect(() => {
    let unsubscribeUsers: any;

    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const adminDoc = await getDoc(
            doc(db, "admin_users", currentUser.uid),
          );

          if (adminDoc.exists()) {
            const profile = adminDoc.data();
            setAdminProfile(profile);

            // Build Multi-Tenant Query
            const usersRef = collection(db, "admin_users");
            const q =
              profile.role === "Super Admin"
                ? query(usersRef)
                : query(usersRef, where("entity", "==", profile.entity));

            unsubscribeUsers = onSnapshot(
              q,
              (snapshot) => {
                const userList = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                setUsers(userList);
                setLoading(false); // STOP SPINNER AFTER DATA LOADS
              },
              (err) => {
                console.error("Snapshot error:", err);
                setLoading(false); // STOP SPINNER ON SNAPSHOT ERROR
              },
            );
          } else {
            console.error(
              "No Firestore profile found for UID:",
              currentUser.uid,
            );
            setError("Authorized but no profile found.");
            setLoading(false); // STOP SPINNER IF NO PROFILE
          }
        } catch (err) {
          console.error("Auth logic error:", err);
          setLoading(false); // STOP SPINNER ON CATCH
        }
      } else {
        // If no user, redirect or stop loading
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Function to open the modal and populate data
  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  const handleDelete = async (targetUserId: string) => {
    if (
      !window.confirm(
        "Are you sure? This will revoke all access for this user.",
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "admin_users", targetUserId));
      alert("User removed from system.");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete user. Check permissions.");
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, "admin_users", selectedUser.id);
      await updateDoc(userRef, {
        name: selectedUser.name,
        role: selectedUser.role,
        // We don't update email here because that requires Auth SDK changes
      });

      setIsEditOpen(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert("Permission denied. You cannot edit this user.");
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // 2. SAFE SECONDARY INITIALIZATION
      const secondaryAppName = "AdminProvisioner";
      let secondaryApp;

      // Direct check: Try to get the existing app, if fails, create it.
      try {
        secondaryApp = getApp(secondaryAppName);
      } catch (e) {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      }

      const secondaryAuth = getAuth(secondaryApp);

      // 3. CREATE AUTH ACCOUNT
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password,
      );

      const newUserId = userCredential.user.uid;

      // 4. SAVE PROFILE TO FIRESTORE (Using Primary DB)
      await setDoc(doc(db, "admin_users", newUserId), {
        uid: newUserId,
        name: formData.name,
        email: formData.email,
        entity:
          adminProfile.role === "Super Admin"
            ? formData.entity
            : adminProfile.entity,
        role: formData.role,
        status: "Active",
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid,
      });

      // 5. LOGOUT SECONDARY USER ONLY
      await signOut(secondaryAuth);

      alert("New administrator provisioned successfully!");
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "District Admin",
        entity: "",
      });
    } catch (err: any) {
      console.error("Provisioning Error:", err);

      // Specific user-friendly error messages
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered to another administrator.");
      } else if (err.code === "auth/weak-password") {
        setError("The password must be at least 6 characters.");
      } else if (err.code === "permission-denied") {
        setError("Database error: You do not have permission to create users.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false); // This ensures the spinner stops no matter what
    }
  };

  const counts = {
    super: users.filter((u) => u.role === "Super Admin").length,
    mmdce: users.filter((u) => u.role === "District Admin").length,
    ops: users.filter((u) => u.role === "Operator").length,
  };

  if (loading || !adminProfile) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">
            Syncing security profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            User Management
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Provision and monitor administrative access.
          </p>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button className="bg-slate-900 hover:bg-black h-11 px-6 rounded-xl shadow-lg">
              <UserPlus className="mr-2 h-4 w-4" /> Add New User
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] p-4">
            <SheetHeader className="mb-8">
              <SheetTitle className="text-2xl font-black">
                New Access Profile
              </SheetTitle>
              <SheetDescription>
                Account creation will trigger a system security refresh.
              </SheetDescription>
            </SheetHeader>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update details for {selectedUser?.name}. Changes take effect
                    immediately.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={selectedUser?.name || ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={selectedUser?.role}
                      onValueChange={(value) =>
                        setSelectedUser({ ...selectedUser, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {adminProfile?.role === "Super Admin" && (
                          <SelectItem value="Super Admin">
                            Super Admin
                          </SelectItem>
                        )}
                        <SelectItem value="District Admin">
                          District Admin
                        </SelectItem>
                        <SelectItem value="Operator">Operator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateUser}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <form onSubmit={handleAddAdmin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">
                  Full Name
                </label>
                <Input
                  placeholder="Enter official name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">
                  Official Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="admin@mmdce.gov.gh"
                    className="pl-10 h-12"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Min 8 characters"
                    className="pl-10 h-12"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">
                    District / Entity
                  </label>
                  <Input
                    placeholder="e.g. Kumasi"
                    value={formData.entity}
                    onChange={(e) =>
                      setFormData({ ...formData, entity: e.target.value })
                    }
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">
                    Role
                  </label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData({ ...formData, role: v })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                      <SelectItem value="District Admin">
                        District Admin
                      </SelectItem>
                      <SelectItem value="Operator">Operator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold flex gap-2 items-center border border-red-100 italic">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <Button
                type="submit"
                // Disable if submitting OR if the admin profile hasn't loaded yet
                disabled={isSubmitting || !adminProfile}
                className="bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold rounded-4xl w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : !adminProfile ? (
                  "Initializing..."
                ) : (
                  "Authorize & Create User"
                )}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary Cards and Table remain same as previous code... */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 text-white border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              CTS Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{counts.super} Users</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              MMDCE Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">
              {counts.mmdce} Users
            </div>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
              District-level access
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              System Operators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">
              {counts.ops} Users
            </div>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
              Registration only
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/30">
          <CardTitle className="text-lg font-bold">
            Administrative Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-900">
                  User Information
                </TableHead>
                <TableHead className="font-bold text-slate-900">
                  Access Level
                </TableHead>
                <TableHead className="font-bold text-slate-900">
                  Entity
                </TableHead>
                <TableHead className="font-bold text-slate-900">
                  Status
                </TableHead>
                
              </TableRow>
            </TableHeader>
            <TableBody>
  {users.map((user) => (
    <TableRow
      key={user.id}
      className="hover:bg-slate-50/50 transition-colors"
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs border border-blue-100 uppercase">
            {user.name?.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900">{user.name}</p>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Mail className="h-3 w-3" /> {user.email}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Shield className={`h-3.5 w-3.5 ${user.role === "Super Admin" ? "text-blue-600" : "text-slate-400"}`} />
          <span className="text-xs font-semibold text-slate-700">{user.role}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-tighter">
          <Building2 className="h-3.5 w-3.5" /> {user.entity}
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`rounded-full border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
            user.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {user.status}
        </Badge>
      </TableCell>
      
      {/* --- CORRECT ACTION COLUMN --- */}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleEditClick(user)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleStatus(user.id, user.status)}>
              <Shield className="mr-2 h-4 w-4" /> 
              {user.status === "Active" ? "Suspend Account" : "Activate Account"}
            </DropdownMenuItem>
            
            {/* Guard: Don't show delete if it's the current user or a Super Admin (unless you are a Super Admin) */}
            {adminProfile?.uid !== user.uid && user.role !== "Super Admin" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:bg-red-50 focus:text-red-600" 
                  onClick={() => handleDelete(user.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete User
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
          {users.length === 0 && !loading && (
            <div className="py-20 text-center text-slate-400 font-medium italic">
              No administrative accounts found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
