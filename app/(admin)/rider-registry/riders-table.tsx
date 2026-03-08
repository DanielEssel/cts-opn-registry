import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Loader2, Users, MoreHorizontal, ChevronRight,
  Edit3, CheckCircle, RefreshCw, Trash2, QrCode,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// STATUS STYLES
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  Active:    { badge: "bg-green-100 text-green-700",  dot: "bg-green-500"  },
  Pending:   { badge: "bg-blue-100 text-blue-700",    dot: "bg-blue-500"   },
  Expired:   { badge: "bg-red-100 text-red-700",      dot: "bg-red-500"    },
  Suspended: { badge: "bg-slate-100 text-slate-600",  dot: "bg-slate-400"  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RIDER TABLE ROW
// ─────────────────────────────────────────────────────────────────────────────

interface RiderRowProps {
  rider:          any;
  selected:       boolean;
  onToggle:       () => void;
  onView:         () => void;
  onEdit?:        () => void;
  onApprove?:     () => void;
  onRenew?:       () => void;
  onDelete?:      () => void;
  isApproving:    boolean;
  showTownColumn: boolean;
}

export function RiderTableRow({
  rider, selected, onToggle, onView,
  onEdit, onApprove, onRenew, onDelete,
  isApproving, showTownColumn,
}: RiderRowProps) {
  const canEdit     = typeof onEdit    === "function";
  const canApprove  = typeof onApprove === "function";
  const canRenew    = typeof onRenew   === "function";
  const canDelete   = typeof onDelete  === "function";
  const showApprove = canApprove && rider.status === "Pending";

  const statusStyle = STATUS_STYLES[rider.status] ?? STATUS_STYLES["Suspended"];
  const isExpired   = rider.expiryDate && new Date(rider.expiryDate) < new Date();

  return (
    <TableRow className="group hover:bg-slate-50/60 transition-colors border-b last:border-0">

      {/* Checkbox */}
      <TableCell className="px-4 w-10">
        <Checkbox checked={selected} onCheckedChange={onToggle} />
      </TableCell>

      {/* Name + Phone */}
      <TableCell>
        <p className="font-semibold text-slate-900 leading-none">{rider.fullName}</p>
        <p className="text-xs text-slate-400 mt-0.5">{rider.phoneNumber}</p>
      </TableCell>

      {/* RIN */}
      <TableCell>
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {rider.RIN}
        </span>
      </TableCell>

      {/* QR — stored URL, no client-side generation */}
      <TableCell>
        <div className="flex items-center justify-center">
          {rider.qrCodeUrl ? (
            <img
              src={rider.qrCodeUrl}
              alt={`QR ${rider.RIN}`}
              className="w-9 h-9 rounded border border-slate-100 shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded border border-slate-200 bg-slate-50 flex items-center justify-center">
              <QrCode className="h-4 w-4 text-slate-300" />
            </div>
          )}
        </div>
      </TableCell>

      {/* District (Super Admin only) */}
      {showTownColumn && (
        <TableCell className="text-xs text-slate-500 max-w-[140px] truncate">
          {rider.districtMunicipality || "—"}
        </TableCell>
      )}

      {/* Vehicle */}
      <TableCell>
        <Badge variant="secondary" className="text-xs font-medium">
          {rider.vehicleCategory}
        </Badge>
      </TableCell>

      {/* Issued */}
      <TableCell className="text-xs text-slate-500">
        {rider.issueDate
          ? new Date(rider.issueDate).toLocaleDateString("en-GB")
          : "—"}
      </TableCell>

      {/* Expiry */}
      <TableCell className="text-xs">
        {rider.expiryDate ? (
          <span className={isExpired ? "text-red-600 font-semibold" : "text-slate-500"}>
            {new Date(rider.expiryDate).toLocaleDateString("en-GB")}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge className={`${statusStyle.badge} border-none shadow-none text-xs`}>
          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 inline-block ${statusStyle.dot}`} />
          {rider.status}
        </Badge>
      </TableCell>

      {/* Actions dropdown */}
      <TableCell className="text-right pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl shadow-xl">

            <DropdownMenuItem onClick={onView} className="rounded-lg text-sm">
              <ChevronRight className="mr-2 h-4 w-4 text-slate-400" />
              View Profile
            </DropdownMenuItem>

            {canEdit && (
              <DropdownMenuItem onClick={onEdit} className="rounded-lg text-sm">
                <Edit3 className="mr-2 h-4 w-4 text-slate-400" />
                Edit Details
              </DropdownMenuItem>
            )}

            {showApprove && (
              <DropdownMenuItem
                onClick={onApprove}
                disabled={isApproving}
                className="rounded-lg text-sm text-green-700 focus:bg-green-50 font-semibold"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isApproving ? "Approving…" : "Approve Rider"}
              </DropdownMenuItem>
            )}

            {canRenew && (
              <DropdownMenuItem
                onClick={onRenew}
                className="rounded-lg text-sm text-blue-700 focus:bg-blue-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Renew Permit
              </DropdownMenuItem>
            )}

            {canDelete && (
              <>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="rounded-lg text-sm text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Record
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RIDERS TABLE (the wrapper registry.tsx imports)
// ─────────────────────────────────────────────────────────────────────────────

interface RidersTableProps {
  riders:          any[];
  loading:         boolean;
  selected:        string[];
  allSelected:     boolean;
  approvingId:     string | null;
  onToggleAll:     () => void;
  onToggleOne:     (id: string) => void;
  onViewRider:     (rider: any) => void;
  onEditRider:     (rider: any) => void;
  onApproveRider?: (id: string) => void;
  onRenewRider?:   (rider: any) => void;
  onDeleteRider?:  (rider: any) => void;
  showTownColumn:  boolean;
  canApprove:      boolean;
  canDelete:       boolean;
  canEdit:         boolean;
  canRenew:        boolean;
}

export function RidersTable({
  riders, loading, selected, allSelected, approvingId,
  onToggleAll, onToggleOne,
  onViewRider, onEditRider, onApproveRider, onRenewRider, onDeleteRider,
  showTownColumn, canApprove, canDelete, canEdit, canRenew,
}: RidersTableProps) {

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
        <p className="text-slate-400 text-sm font-medium">Loading riders...</p>
      </div>
    );
  }

  if (riders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 border border-slate-200 rounded-xl bg-slate-50">
        <Users className="h-10 w-10 text-slate-200" />
        <p className="text-slate-400 font-semibold text-sm">No riders found</p>
        <p className="text-slate-300 text-xs">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b hover:bg-slate-50">
              <TableHead className="px-4 w-10">
                <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
              </TableHead>
              <TableHead className="font-bold text-slate-600 text-xs">Rider</TableHead>
              <TableHead className="font-bold text-slate-600 text-xs">RIN</TableHead>
              <TableHead className="font-bold text-slate-600 text-xs text-center">QR</TableHead>
              {showTownColumn && (
                <TableHead className="font-bold text-slate-600 text-xs">District</TableHead>
              )}
              <TableHead className="font-bold text-slate-600 text-xs">Vehicle</TableHead>
              <TableHead className="font-bold text-slate-600 text-xs">Issued</TableHead>
              <TableHead className="font-bold text-slate-600 text-xs">Expiry</TableHead>
              <TableHead className="font-bold text-slate-600 text-xs">Status</TableHead>
              <TableHead className="font-bold text-slate-600 text-xs text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {riders.map((rider) => (
              <RiderTableRow
                key={rider.id}
                rider={rider}
                selected={selected.includes(rider.id)}
                isApproving={approvingId === rider.id}
                showTownColumn={showTownColumn}
                onToggle={() => onToggleOne(rider.id)}
                onView={() => onViewRider(rider)}
                onEdit={canEdit ? () => onEditRider(rider) : undefined}
                onApprove={canApprove ? () => onApproveRider?.(rider.id) : undefined}
                onRenew={canRenew ? () => onRenewRider?.(rider) : undefined}
                onDelete={canDelete ? () => onDeleteRider?.(rider) : undefined}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}