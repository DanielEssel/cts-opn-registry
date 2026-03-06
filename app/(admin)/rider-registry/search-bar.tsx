"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Search, Filter, X, Calendar, MapPin, Bike,
  CheckCircle2, Clock, AlertCircle, XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// ============================================================================
// TYPES
// ============================================================================

export interface SearchFilters {
  searchTerm: string;
  status: string;
  vehicleCategory: string;
  district: string;
  registrationPeriod: string;
  expiryStatus: string;
}

interface SearchBarProps {
  onFiltersChange: (filters: SearchFilters) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DISTRICTS = [
  "All Districts", "Accra Metro", "Krowor", "Madina", "Ashaiman",
  "Tema Metro", "Ga South", "Ga West", "Ga East", "Ga Central",
  "Ledzokuku", "Ablekuma North", "Ablekuma Central", "Ablekuma West",
];

const VEHICLE_CATEGORIES = [
  "All Categories", "Pragya", "Motorbike/Okada", "Tricycle/Aboboyaa",
];

const DEFAULT_FILTERS: SearchFilters = {
  searchTerm: "",
  status: "All",
  vehicleCategory: "All Categories",
  district: "All Districts",
  registrationPeriod: "All",
  expiryStatus: "All",
};

const DEBOUNCE_MS = 300;

// ============================================================================
// SEARCH BAR COMPONENT
// ============================================================================

export function SearchBar({ onFiltersChange }: SearchBarProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [inputValue, setInputValue] = useState(""); // raw input, not yet debounced
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ── Debounce search term ──────────────────────────────────────────────────
  // Only propagates to parent (and thus Firestore) after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const updated = { ...filters, searchTerm: inputValue };
      setFilters(updated);
      onFiltersChange(updated);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update a single filter and notify parent immediately ─────────────────
  const updateFilter = useCallback(
    (key: keyof Omit<SearchFilters, "searchTerm">, value: string) => {
      setFilters((prev) => {
        const updated = { ...prev, [key]: value };
        onFiltersChange(updated);
        return updated;
      });
    },
    [onFiltersChange]
  );

  // ── Clear everything ──────────────────────────────────────────────────────
  const clearAll = () => {
    setInputValue("");
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  // ── Active filter count (excludes searchTerm — shown separately) ──────────
  const activeFilterCount = [
    filters.status !== "All",
    filters.vehicleCategory !== "All Categories",
    filters.district !== "All Districts",
    filters.registrationPeriod !== "All",
    filters.expiryStatus !== "All",
  ].filter(Boolean).length;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className="p-4 border-slate-200">
      <div className="space-y-4">

        {/* ── SEARCH + FILTER ROW ── */}
        <div className="flex gap-3">

          {/* Search input — debounced */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by name, RIN, phone number..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pl-10 h-11 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {inputValue && (
              <button
                onClick={() => setInputValue("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Advanced filters popover */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 gap-2 border-slate-300">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 bg-green-600 text-white rounded-full px-2 py-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[260px] p-0" align="end">
              {/* Popover header */}
              <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Advanced Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Clear all
                  </button>
                )}
              </div>

              {/* Filter fields */}
              <div className="p-4 space-y-4 max-h-[200px] overflow-y-auto">

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Status
                  </label>
                  <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="Active">
                        <span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Active</span>
                      </SelectItem>
                      <SelectItem value="Pending">
                        <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-yellow-600" /> Pending</span>
                      </SelectItem>
                      <SelectItem value="Expired">
                        <span className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-red-600" /> Expired</span>
                      </SelectItem>
                      <SelectItem value="Suspended">
                        <span className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 text-slate-600" /> Suspended</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Bike className="h-3.5 w-3.5 text-green-600" /> Vehicle Category
                  </label>
                  <Select value={filters.vehicleCategory} onValueChange={(v) => updateFilter("vehicleCategory", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VEHICLE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-green-600" /> District / Municipality
                  </label>
                  <Select value={filters.district} onValueChange={(v) => updateFilter("district", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Registration Period */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-green-600" /> Registration Period
                  </label>
                  <Select value={filters.registrationPeriod} onValueChange={(v) => updateFilter("registrationPeriod", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Time</SelectItem>
                      <SelectItem value="Today">Today</SelectItem>
                      <SelectItem value="This Week">This Week</SelectItem>
                      <SelectItem value="This Month">This Month</SelectItem>
                      <SelectItem value="Last Month">Last Month</SelectItem>
                      <SelectItem value="Last 3 Months">Last 3 Months</SelectItem>
                      <SelectItem value="This Year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Expiry Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-green-600" /> Expiry Status
                  </label>
                  <Select value={filters.expiryStatus} onValueChange={(v) => updateFilter("expiryStatus", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Permits</SelectItem>
                      <SelectItem value="Valid">Valid</SelectItem>
                      <SelectItem value="Expiring Soon">Expiring Soon (30 days)</SelectItem>
                      <SelectItem value="Expiring This Week">Expiring This Week</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 border-t border-slate-200 bg-slate-50">
                <Button onClick={() => setIsFilterOpen(false)} className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm">
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* ── ACTIVE FILTER CHIPS ── */}
        {(activeFilterCount > 0 || inputValue) && (
          <div className="flex flex-wrap gap-2">
            {inputValue && (
              <Badge variant="secondary" className="gap-1 pr-1 bg-slate-100 text-slate-700 border border-slate-300">
                Search: "{inputValue}"
                <button onClick={() => setInputValue("")} className="ml-1 hover:bg-slate-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.status !== "All" && (
              <Badge variant="secondary" className="gap-1 pr-1 bg-green-100 text-green-700 border border-green-200">
                Status: {filters.status}
                <button onClick={() => updateFilter("status", "All")} className="ml-1 hover:bg-green-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.vehicleCategory !== "All Categories" && (
              <Badge variant="secondary" className="gap-1 pr-1 bg-blue-100 text-blue-700 border border-blue-200">
                {filters.vehicleCategory}
                <button onClick={() => updateFilter("vehicleCategory", "All Categories")} className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.district !== "All Districts" && (
              <Badge variant="secondary" className="gap-1 pr-1 bg-purple-100 text-purple-700 border border-purple-200">
                {filters.district}
                <button onClick={() => updateFilter("district", "All Districts")} className="ml-1 hover:bg-purple-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.registrationPeriod !== "All" && (
              <Badge variant="secondary" className="gap-1 pr-1 bg-orange-100 text-orange-700 border border-orange-200">
                {filters.registrationPeriod}
                <button onClick={() => updateFilter("registrationPeriod", "All")} className="ml-1 hover:bg-orange-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.expiryStatus !== "All" && (
              <Badge variant="secondary" className="gap-1 pr-1 bg-red-100 text-red-700 border border-red-200">
                Expiry: {filters.expiryStatus}
                <button onClick={() => updateFilter("expiryStatus", "All")} className="ml-1 hover:bg-red-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button onClick={clearAll} className="text-xs text-red-600 hover:text-red-700 font-semibold underline self-center">
              Clear all
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}