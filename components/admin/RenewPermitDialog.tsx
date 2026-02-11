"use client"

import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, CreditCard, RefreshCw, AlertCircle } from "lucide-react"

interface RenewProps {
  rider: {
    name: string;
    opn: string;
    expiry: string;
  }
  onConfirm: () => void
}

export default function RenewPermitDialog({ rider, onConfirm }: RenewProps) {
  // Logic to show what the NEW expiry would be (6 months from now)
  const newExpiry = "2026-08-10" 

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <RefreshCw className="h-6 w-6 text-blue-600" />
        </div>
        <DialogTitle className="text-xl">Renew Operating Permit</DialogTitle>
        <DialogDescription>
          You are about to extend the permit for <span className="font-bold text-slate-900">{rider.name}</span>.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Current Expiry:</span>
            <span className="font-mono font-medium text-red-600">{rider.expiry}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">New Expiry:</span>
            <span className="font-mono font-medium text-green-600">{newExpiry}</span>
          </div>
          <div className="pt-2 border-t flex justify-between items-center">
            <span className="text-sm font-bold">Renewal Fee:</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">GH₵ 50.00</Badge>
          </div>
        </div>

        <div className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-800 leading-tight">
            Ensure you have received the physical payment or confirmed the mobile money transaction before clicking confirm. This action is logged.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onConfirm()}>Cancel</Button>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => onConfirm()}>
          Confirm & Print Receipt
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}