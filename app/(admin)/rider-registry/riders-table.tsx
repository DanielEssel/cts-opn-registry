import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search } from "lucide-react";
import { RiderTableRow } from "./table-row";

interface RidersTableProps {
  riders: any[];
  loading: boolean;
  selected: string[];
  approvingId: string | null;
  showTownColumn: boolean;
  showDeleteOption: boolean;
  baseUrl: string;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  onViewRider: (rider: any) => void;
  onEditRider: (rider: any) => void;
  onApproveRider: (id: string) => void;
  onRenewRider: (rider: any) => void;
  onDeleteRider: (rider: any) => void;
}

export function RidersTable({
  riders,
  loading,
  selected,
  approvingId,
  showTownColumn,
  showDeleteOption,
  baseUrl,
  onToggleAll,
  onToggleOne,
  onViewRider,
  onEditRider,
  onApproveRider,
  onRenewRider,
  onDeleteRider,
}: RidersTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Loading Database...
          </p>
        </div>
      </div>
    );
  }

  if (riders.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="py-20 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
            <Search className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">
            No riders found matching your criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/50 border-b">
          <TableRow>
            <TableHead className="w-12 px-6">
              <Checkbox
                checked={selected.length === riders.length && riders.length > 0}
                onCheckedChange={onToggleAll}
              />
            </TableHead>
            <TableHead className="font-bold text-slate-700">
              Rider / Contact
            </TableHead>
            <TableHead className="font-bold text-slate-700">OPN Number</TableHead>
            <TableHead className="font-bold text-center text-slate-700">
              Quick Scan
            </TableHead>
            {showTownColumn && (
              <TableHead className="font-bold text-slate-700">Town</TableHead>
            )}
            <TableHead className="font-bold text-slate-700">Vehicle</TableHead>
            <TableHead className="font-bold text-slate-700">Issued</TableHead>
            <TableHead className="font-bold text-slate-700">Expires</TableHead>
            <TableHead className="font-bold text-slate-700">Status</TableHead>
            <TableHead className="text-right px-8 font-bold text-slate-700">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {riders.map((rider) => (
            <RiderTableRow
              key={rider.id}
              rider={rider}
              selected={selected.includes(rider.id)}
              onToggle={() => onToggleOne(rider.id)}
              onView={() => onViewRider(rider)}
              onEdit={() => onEditRider(rider)}
              onApprove={() => onApproveRider(rider.id)}
              onRenew={() => onRenewRider(rider)}
              onDelete={() => onDeleteRider(rider)}
              isApproving={approvingId === rider.id}
              showTownColumn={showTownColumn}
              showDeleteOption={showDeleteOption}
              baseUrl={baseUrl}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}