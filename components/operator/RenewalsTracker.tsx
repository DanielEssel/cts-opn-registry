"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Rider = {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  opn?: string;
  town?: string;
  expiryDate?: any; // Firestore Timestamp or string depending on your data
  status?: string;
};

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  if (value?.toDate) return value.toDate(); // Firestore Timestamp
  return null;
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function RenewalsTracker() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [bucket, setBucket] = useState<"expiring_30" | "expiring_7" | "expired">(
    "expiring_30"
  );

  useEffect(() => {
    // NOTE:
    // If you want this filtered by operator town/entity like RiderRegistry does,
    // you can pass it as a prop and add a where("town","==",entity) here.
    const ridersRef = collection(db, "riders");
    const q = query(ridersRef); // keep broad; we do client-side bucket filtering

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setRiders(list);
        setLoading(false);
      },
      (err) => {
        console.error("Renewals tracker snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const now = useMemo(() => new Date(), []);

  const categorized = useMemo(() => {
    const withExpiry = riders
      .map((r) => {
        const expiry = toDate(r.expiryDate);
        return { ...r, _expiry: expiry };
      })
      .filter((r) => r._expiry instanceof Date && !isNaN(r._expiry!.getTime()));

    const expired = withExpiry.filter((r) => r._expiry! < now);
    const expiring7 = withExpiry.filter((r) => {
      const d = daysBetween(now, r._expiry!);
      return d >= 0 && d <= 7;
    });
    const expiring30 = withExpiry.filter((r) => {
      const d = daysBetween(now, r._expiry!);
      return d >= 0 && d <= 30;
    });

    return { expired, expiring7, expiring30 };
  }, [riders, now]);

  const activeList = useMemo(() => {
    const base =
      bucket === "expired"
        ? categorized.expired
        : bucket === "expiring_7"
          ? categorized.expiring7
          : categorized.expiring30;

    const t = term.trim().toLowerCase();
    if (!t) return base;

    return base.filter((r) => {
      return (
        r.fullName?.toLowerCase().includes(t) ||
        r.opn?.toLowerCase().includes(t) ||
        r.phoneNumber?.includes(term)
      );
    });
  }, [bucket, categorized, term]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renewals Tracker</h1>
          <p className="text-sm text-gray-600">
            Track permits that are expiring soon or already expired.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={bucket === "expiring_30" ? "default" : "outline"}
            className={bucket === "expiring_30" ? "bg-green-600 hover:bg-green-700" : ""}
            onClick={() => setBucket("expiring_30")}
          >
            Expiring (30 days)
            <Badge className="ml-2 bg-white/20 text-white">
              {categorized.expiring30.length}
            </Badge>
          </Button>

          <Button
            variant={bucket === "expiring_7" ? "default" : "outline"}
            className={bucket === "expiring_7" ? "bg-amber-600 hover:bg-amber-700" : ""}
            onClick={() => setBucket("expiring_7")}
          >
            Expiring (7 days)
            <Badge className="ml-2 bg-white/20 text-white">
              {categorized.expiring7.length}
            </Badge>
          </Button>

          <Button
            variant={bucket === "expired" ? "default" : "outline"}
            className={bucket === "expired" ? "bg-red-600 hover:bg-red-700" : ""}
            onClick={() => setBucket("expired")}
          >
            Expired
            <Badge className="ml-2 bg-white/20 text-white">
              {categorized.expired.length}
            </Badge>
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by name, OPN, phone..."
            className="md:max-w-md"
          />
          <div className="text-sm text-gray-600">
            {loading ? "Loading..." : `${activeList.length} record(s)`}
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-12 gap-0 border-b bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600">
          <div className="col-span-4">Rider</div>
          <div className="col-span-3">OPN</div>
          <div className="col-span-2">Phone</div>
          <div className="col-span-3">Expiry</div>
        </div>

        {activeList.length === 0 && !loading ? (
          <div className="p-8 text-center text-sm text-gray-600">
            No riders found for this category.
          </div>
        ) : (
          <div className="divide-y">
            {activeList.map((r) => {
              const expiry = (r as any)._expiry as Date | null;
              const days = expiry ? daysBetween(new Date(), expiry) : null;

              return (
                <div
                  key={r.id}
                  className="grid grid-cols-12 px-4 py-4 text-sm items-center"
                >
                  <div className="col-span-4">
                    <div className="font-semibold text-gray-900">
                      {r.fullName || "—"}
                    </div>
                    <div className="text-xs text-gray-500">{r.town || ""}</div>
                  </div>

                  <div className="col-span-3 font-mono text-xs text-gray-700 break-all">
                    {r.opn || "—"}
                  </div>

                  <div className="col-span-2 text-gray-700">
                    {r.phoneNumber || "—"}
                  </div>

                  <div className="col-span-3">
                    <div className="font-medium text-gray-900">
                      {expiry
                        ? expiry.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </div>
                    {typeof days === "number" && (
                      <div className="text-xs text-gray-500">
                        {days < 0 ? `${Math.abs(days)} day(s) ago` : `in ${days} day(s)`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}