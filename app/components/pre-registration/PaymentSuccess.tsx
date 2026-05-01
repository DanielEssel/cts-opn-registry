"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export function PaymentSuccess({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Payment Successful
      </h2>

      <p className="text-slate-500 text-sm">
        Confirming your registration...
      </p>
    </div>
  );
}