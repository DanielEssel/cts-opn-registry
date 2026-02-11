"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { QRCodeSVG } from "qrcode.react";
import NewRiderForm from "@/components/admin/NewRiderForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import RenewPermitDialog from "@/components/admin/RenewPermitDialog";
import {
  Search,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Mail,
  Download,
  ChevronRight,
  UserPlus,
  Edit3,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import RiderDetail from "@/components/admin/RiderDetail";

// Mock data (add one 'Pending' user to test approval UI)
const riders = [
  { id: 1, name: "Kwesi Mensah", opn: "KS-1001-02-26", town: "Kumasi", status: "Active", phone: "0244123456" },
  { id: 2, name: "Yaw Boateng", opn: "AC-2045-01-26", town: "Accra", status: "Expiring", phone: "0502233445" },
  { id: 3, name: "Kofi Arhin", opn: "TM-0982-11-25", town: "Tamale", status: "Expired", phone: "0277889900" },
  { id: 4, name: "Ama Serwaa", opn: "PENDING", town: "Accra", status: "Pending", phone: "0201122334" },
];

export default function RiderRegistry() {
  const [selected, setSelected] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [viewRider, setViewRider] = useState<any | null>(null);
  const [renewRider, setRenewRider] = useState<any | null>(null);

  // --- NEW STATES FOR EDIT, APPROVE, DELETE ---
  const [editingRider, setEditingRider] = useState<any | null>(null);
  const [deletingRider, setDeletingRider] = useState<any | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const toggleAll = () => {
    if (selected.length === riders.length) setSelected([]);
    else setSelected(riders.map((r) => r.id));
  };

  const toggleOne = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // --- HANDLERS ---
  const handleApprove = async (id: number) => {
    setApprovingId(id);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    console.log("Approved rider:", id);
    setApprovingId(null);
  };

  const handleDelete = async () => {
    console.log("Deleting rider:", deletingRider.id);
    // Add API logic here
    setDeletingRider(null);
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return (
    <div className="space-y-6 relative min-h-[80vh] pb-24 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Registry</h1>
          <p className="text-slate-500 font-medium">
            Manage compliance for all {riders.length} registered riders.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-200 shadow-sm">
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="bg-blue-600 h-11">
                <UserPlus className="mr-2 h-4 w-4" /> New Registration
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold">Register New Rider</SheetTitle>
                <SheetDescription>Fill in details to generate a new OPN.</SheetDescription>
              </SheetHeader>
              <NewRiderForm onSuccess={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex items-center bg-white p-2 rounded-2xl border shadow-sm gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search name, OPN, or phone..."
            className="pl-10 h-10 border-none focus-visible:ring-0"
          />
        </div>
        <Button variant="ghost" size="sm" className="text-slate-500">
          <Filter className="h-4 w-4 mr-2" /> Filters
        </Button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-12 px-4">
                <Checkbox checked={selected.length === riders.length} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="font-bold">Rider / Contact</TableHead>
              <TableHead className="font-bold">OPN Number</TableHead>
              <TableHead className="font-bold text-center">Quick Scan</TableHead>
              <TableHead className="font-bold">Town</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riders.map((rider) => (
              <TableRow key={rider.id} className="group hover:bg-slate-50/80 transition-all">
                <TableCell className="px-4">
                  <Checkbox checked={selected.includes(rider.id)} onCheckedChange={() => toggleOne(rider.id)} />
                </TableCell>
                <TableCell>
                  <div className="font-bold text-slate-900">{rider.name}</div>
                  <div className="text-xs text-slate-500">{rider.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono bg-blue-50/50 text-blue-700 border-blue-100">
                    {rider.opn}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center items-center">
                    <div className="p-1.5 bg-white border rounded-lg shadow-sm group-hover:border-blue-200 transition-colors">
                      <QRCodeSVG value={`${baseUrl}/verify/${rider.opn}`} size={32} level="M" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">{rider.town}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      rider.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-100 shadow-none" :
                      rider.status === "Pending" ? "bg-blue-100 text-blue-700 hover:bg-blue-100 shadow-none" :
                      rider.status === "Expiring" ? "bg-amber-100 text-amber-700 hover:bg-amber-100 shadow-none" :
                      "bg-red-100 text-red-700 hover:bg-red-100 shadow-none"
                    }
                  >
                    {rider.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right px-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => setViewRider(rider)}>
                        <ChevronRight className="mr-2 h-4 w-4" /> View Full Profile
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => setEditingRider(rider)}>
                        <Edit3 className="mr-2 h-4 w-4" /> Edit Details
                      </DropdownMenuItem>

                      {rider.status === "Pending" && (
                        <DropdownMenuItem onClick={() => handleApprove(rider.id)} className="text-green-600 font-bold">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {approvingId === rider.id ? "Approving..." : "Approve Rider"}
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem onClick={() => setRenewRider(rider)} className="text-blue-600">
                        <RefreshCw className="mr-2 h-4 w-4" /> Renew Permit
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem onClick={() => setDeletingRider(rider)} className="text-red-600 focus:bg-red-50 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* --- OVERLAYS & MODALS --- */}

      {/* 1. VIEW DETAIL SHEET */}
      <Sheet open={!!viewRider} onOpenChange={() => setViewRider(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>Rider Profile</SheetTitle>
          </SheetHeader>
          {viewRider && <RiderDetail rider={viewRider} />}
        </SheetContent>
      </Sheet>

      {/* 2. EDIT SHEET */}
      <Sheet open={!!editingRider} onOpenChange={() => setEditingRider(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>Edit Rider Details</SheetTitle>
          </SheetHeader>
          {editingRider && <NewRiderForm initialData={editingRider} onSuccess={() => setEditingRider(null)} />}
        </SheetContent>
      </Sheet>

      {/* 3. RENEWAL DIALOG */}
      <Dialog open={!!renewRider} onOpenChange={() => setRenewRider(null)}>
        {renewRider && <RenewPermitDialog rider={renewRider} onConfirm={() => setRenewRider(null)} />}
      </Dialog>

      {/* 4. DELETE CONFIRMATION */}
      <Dialog open={!!deletingRider} onOpenChange={() => setDeletingRider(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="flex flex-col items-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete <strong>{deletingRider?.name}</strong>? 
              This will permanently revoke OPN <strong>{deletingRider?.opn}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeletingRider(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BULK ACTION BAR */}
      {selected.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-10">
          <div className="flex flex-col">
            <span className="text-sm font-bold">{selected.length} Selected</span>
            <span className="text-[10px] text-slate-400 uppercase">Bulk Action Mode</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-700" />
          <div className="flex gap-2">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500"><RefreshCw className="mr-2 h-4 w-4" /> Renew All</Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-500"><Mail className="mr-2 h-4 w-4" /> Send SMS</Button>
            <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => setSelected([])}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}