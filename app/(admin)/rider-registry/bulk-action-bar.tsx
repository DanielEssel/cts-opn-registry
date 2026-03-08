"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Mail, Trash2, X } from "lucide-react";
import { BulkRenewModal, type BulkRenewRider } from "@/components/admin/BulkRenewModal";

interface BulkActionBarProps {
  selectedCount:   number;
  selectedRiders?: BulkRenewRider[];  // optional — safe against undefined
  adminRole?:      string;
  onClose:         () => void;
  canRenewAll:     boolean;
  canSendSMS:      boolean;
  canDelete:       boolean;
  onSendSMS:       () => void;
  onDeleteAll:     () => void;
  onRenewSuccess?: (renewed: number) => void;
}

export function BulkActionBar({
  selectedCount,
  selectedRiders = [],               // default to empty array
  adminRole,
  onClose,
  canRenewAll,
  canSendSMS,
  canDelete,
  onSendSMS,
  onDeleteAll,
  onRenewSuccess,
}: BulkActionBarProps) {
  const [renewOpen,      setRenewOpen]      = useState(false);
  const [ridersSnapshot, setRidersSnapshot] = useState<BulkRenewRider[]>([]);

  if (selectedCount === 0) return null;
  if (!canRenewAll && !canSendSMS && !canDelete) return null;

  const handleRenewClick = () => {
    // Snapshot at click time — freeze current riders before any re-render
    const snapshot = Array.isArray(selectedRiders) ? [...selectedRiders] : [];
    setRidersSnapshot(snapshot);
    setRenewOpen(true);
  };

  return (
    <>
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4">

        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold">{selectedCount} selected</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Bulk Action</span>
        </div>

        <div className="h-7 w-px bg-slate-700" />

        <div className="flex gap-2">
          {canRenewAll && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 h-8 text-xs gap-1.5" onClick={handleRenewClick}>
              <RefreshCw className="h-3.5 w-3.5" /> Renew All
            </Button>
          )}
          {canSendSMS && (
            <Button size="sm" className="bg-green-700 hover:bg-green-600 h-8 text-xs gap-1.5" onClick={onSendSMS}>
              <Mail className="h-3.5 w-3.5" /> Send SMS
            </Button>
          )}
          {canDelete && (
            <Button size="sm" className="bg-red-600 hover:bg-red-500 h-8 text-xs gap-1.5" onClick={onDeleteAll}>
              <Trash2 className="h-3.5 w-3.5" /> Delete All
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 text-xs gap-1.5" onClick={onClose}>
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
        </div>
      </div>

      <BulkRenewModal
        open={renewOpen}
        riders={ridersSnapshot}
        adminRole={adminRole}
        onOpenChange={(o) => { if (!o) setRenewOpen(false); }}
        onSuccess={(renewed) => {
          setRenewOpen(false);
          onClose();
          onRenewSuccess?.(renewed);
        }}
      />
    </>
  );
}