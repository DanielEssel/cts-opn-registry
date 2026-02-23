import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { QRCodeSVG } from "qrcode.react";
import {
  MoreHorizontal,
  ChevronRight,
  Edit3,
  CheckCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface RiderRowProps {
  rider: any;
  selected: boolean;
  onToggle: () => void;

  onView: () => void;

  // Optional actions (role-based)
  onEdit?: () => void;
  onApprove?: () => void;
  onRenew?: () => void;
  onDelete?: () => void;

  isApproving: boolean;
  showTownColumn: boolean;
  baseUrl: string;
}

export function RiderTableRow({
  rider,
  selected,
  onToggle,
  onView,
  onEdit,
  onApprove,
  onRenew,
  onDelete,
  isApproving,
  showTownColumn,
  baseUrl,
}: RiderRowProps) {
  const canEdit = typeof onEdit === "function";
  const canApprove = typeof onApprove === "function";
  const canRenew = typeof onRenew === "function";
  const canDelete = typeof onDelete === "function";

  const showApprove = canApprove && rider.status === "Pending";

  return (
    <TableRow className="group hover:bg-blue-50/30 transition-all border-b last:border-0">
      <TableCell className="px-6">
        <Checkbox checked={selected} onCheckedChange={onToggle} />
      </TableCell>

      {/* Name & Phone */}
      <TableCell>
        <div className="font-bold text-slate-900">{rider.fullName}</div>
        <div className="text-xs font-medium text-slate-400">
          {rider.phoneNumber}
        </div>
      </TableCell>

      {/* OPN */}
      <TableCell>
        <Badge
          variant="outline"
          className="font-mono bg-blue-50 text-blue-700 border-blue-100 px-3 py-1"
        >
          {rider.opn}
        </Badge>
      </TableCell>

      {/* QR Code */}
      <TableCell>
        <div className="flex justify-center items-center">
          <div className="p-1.5 bg-white border border-slate-100 rounded-xl shadow-sm group-hover:border-blue-200 transition-colors">
            <QRCodeSVG value={`${baseUrl}/verify/${rider.opn}`} size={32} level="M" />
          </div>
        </div>
      </TableCell>

      {/* Town (conditionally shown) */}
      {showTownColumn && (
        <TableCell className="text-sm font-semibold text-slate-600 uppercase tracking-tighter">
          {rider.town}
        </TableCell>
      )}

      {/* Vehicle Category */}
      <TableCell>
        <Badge variant="secondary" className="font-medium">
          {rider.vehicleCategory}
        </Badge>
      </TableCell>

      {/* Issued Date */}
      <TableCell className="text-sm text-slate-600">
        {rider.issueDate ? new Date(rider.issueDate).toLocaleDateString() : "—"}
      </TableCell>

      {/* Expiry Date */}
      <TableCell className="text-sm">
        {rider.expiryDate ? (
          <span
            className={
              new Date(rider.expiryDate) < new Date()
                ? "text-red-600 font-semibold"
                : "text-slate-600"
            }
          >
            {new Date(rider.expiryDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge
          className={
            rider.status === "Active"
              ? "bg-green-100 text-green-700 hover:bg-green-200 border-none shadow-none"
              : rider.status === "Pending"
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shadow-none"
                : "bg-red-100 text-red-700 hover:bg-red-200 border-none shadow-none"
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full mr-2 ${
              rider.status === "Active"
                ? "bg-green-500"
                : rider.status === "Pending"
                  ? "bg-blue-500"
                  : "bg-red-500"
            }`}
          />
          {rider.status}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right px-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-slate-100 transition-colors"
            >
              <MoreHorizontal className="h-5 w-5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl">
            <DropdownMenuItem onClick={onView} className="rounded-lg">
              <ChevronRight className="mr-2 h-4 w-4 text-slate-400" /> View Full Profile
            </DropdownMenuItem>

            {canEdit && (
              <DropdownMenuItem onClick={onEdit} className="rounded-lg">
                <Edit3 className="mr-2 h-4 w-4 text-slate-400" /> Edit Details
              </DropdownMenuItem>
            )}

            {showApprove && (
              <DropdownMenuItem
                onClick={onApprove}
                className="text-green-600 font-bold rounded-lg focus:bg-green-50"
                disabled={isApproving}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isApproving ? "Approving..." : "Approve Rider"}
              </DropdownMenuItem>
            )}

            {canRenew && (
              <DropdownMenuItem onClick={onRenew} className="text-blue-600 rounded-lg">
                <RefreshCw className="mr-2 h-4 w-4" /> Renew Permit
              </DropdownMenuItem>
            )}

            {canDelete && (
              <>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 focus:bg-red-50 rounded-lg"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}