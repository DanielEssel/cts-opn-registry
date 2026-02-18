import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationProps {
  open: boolean;
  rider: any | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function DeleteConfirmation({
  open,
  rider,
  onConfirm,
  onOpenChange,
}: DeleteConfirmationProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="flex flex-col items-center">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to delete{" "}
            <strong>{rider?.fullName}</strong>? This will permanently revoke OPN{" "}
            <strong>{rider?.opn}</strong>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
          >
            Yes, Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}