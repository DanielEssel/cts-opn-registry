"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Filter, X } from "lucide-react";
import { DISTRICT_CODES, CATEGORY_CODES } from "@/lib/rin-constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchFilters {
  searchTerm:          string;
  status:              string;
  vehicleCategory:     string;
  district:            string;
  registrationPeriod:  string;
  expiryStatus:        string;
}

const DEFAULT_FILTERS: SearchFilters = {
  searchTerm:         "",
  status:             "All",
  vehicleCategory:    "All Categories",
  district:           "All Districts",
  registrationPeriod: "All",
  expiryStatus:       "All",
};

interface SearchBarProps {
  onFiltersChange: (filters: SearchFilters) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchBar({ onFiltersChange }: SearchBarProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [open,    setOpen]    = useState(false);

  const update = (patch: Partial<SearchFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    onFiltersChange(next);
  };

  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  // Count active (non-default) filters for badge
  const activeCount = [
    filters.status             !== "All",
    filters.vehicleCategory    !== "All Categories",
    filters.district           !== "All Districts",
    filters.registrationPeriod !== "All",
    filters.expiryStatus       !== "All",
  ].filter(Boolean).length;

  const DISTRICTS  = Object.keys(DISTRICT_CODES);
  const CATEGORIES = Object.keys(CATEGORY_CODES);

  return (
    <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm gap-2">

      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          value={filters.searchTerm}
          onChange={(e) => update({ searchTerm: e.target.value })}
          placeholder="Search by name, RIN, or phone number..."
          className="pl-11 h-10 border-none focus-visible:ring-0 text-slate-700 placeholder:text-slate-400"
        />
        {filters.searchTerm && (
          <button
            onClick={() => update({ searchTerm: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="h-6 w-px bg-slate-200" />

      {/* Filter popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:bg-slate-50 gap-2 relative"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-green-700 text-white rounded-full">
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-72 p-4 space-y-4 rounded-xl shadow-xl">

          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">Filters</p>
            {activeCount > 0 && (
              <button
                onClick={reset}
                className="text-xs text-green-700 font-semibold hover:underline"
              >
                Reset all
              </button>
            )}
          </div>

          {/* Status */}
          <FilterRow label="Status">
            <Select value={filters.status} onValueChange={(v) => update({ status: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["All", "Active", "Pending", "Expired", "Suspended"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterRow>

          {/* Vehicle category — from CATEGORY_CODES */}
          <FilterRow label="Vehicle">
            <Select value={filters.vehicleCategory} onValueChange={(v) => update({ vehicleCategory: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All Categories">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterRow>

          {/* District — from DISTRICT_CODES */}
          <FilterRow label="District">
            <Select value={filters.district} onValueChange={(v) => update({ district: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All Districts">All Districts</SelectItem>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterRow>

          {/* Registration period */}
          <FilterRow label="Registered">
            <Select value={filters.registrationPeriod} onValueChange={(v) => update({ registrationPeriod: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["All", "Today", "This Week", "This Month", "Last Month", "Last 3 Months", "This Year"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterRow>

          {/* Expiry status */}
          <FilterRow label="Expiry">
            <Select value={filters.expiryStatus} onValueChange={(v) => update({ expiryStatus: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["All", "Valid", "Expiring Soon", "Expiring This Week", "Expired"].map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterRow>

          <Button
            size="sm"
            className="w-full bg-green-700 hover:bg-green-800 text-xs h-9"
            onClick={() => setOpen(false)}
          >
            Apply Filters
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      {children}
    </div>
  );
}