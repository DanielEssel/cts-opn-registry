import { Button } from "@/components/ui/button";
import { RefreshCw, Mail } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onClose: () => void;

  // Capability flags
  canRenewAll: boolean;
  canSendSMS: boolean;

  // Actions (only called if allowed)
  onRenewAll: () => void;
  onSendSMS: () => void;
}

export function BulkActionBar({
  selectedCount,
  onClose,
  canRenewAll,
  canSendSMS,
  onRenewAll,
  onSendSMS,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  // If the role has no bulk permissions, don’t show the bar at all.
  if (!canRenewAll && !canSendSMS) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-10">
      <div className="flex flex-col">
        <span className="text-sm font-bold">{selectedCount} Selected</span>
        <span className="text-[10px] text-slate-400 uppercase">
          Bulk Action Mode
        </span>
      </div>

      <div className="h-8 w-[1px] bg-slate-700" />

      <div className="flex gap-2">
        {canRenewAll && (
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-500"
            onClick={onRenewAll}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Renew All
          </Button>
        )}

        {canSendSMS && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-500"
            onClick={onSendSMS}
          >
            <Mail className="mr-2 h-4 w-4" /> Send SMS
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="text-slate-400"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}