"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Search, Filter, X, Calendar, MapPin, Bike,
  CheckCircle2, Clock, AlertCircle, XCircle,
} from "lucide-react";

// Single source of truth — never drift from registration form
import { DISTRICT_CODES, CATEGORY_CODES } from "@/lib/rin-constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchFilters {
  searchTerm:         string;
  status:             string;
  vehicleCategory:    string;
  district:           string;
  registrationPeriod: string;
  expiryStatus:       string;
}

interface SearchBarProps {
  onFiltersChange: (filters: SearchFilters) => void;
}

// ─── Constants (derived from rin-constants) ───────────────────────────────────

const DISTRICTS         = ["All Districts",  ...Object.keys(DISTRICT_CODES)];
const VEHICLE_CATEGORIES = ["All Categories", ...Object.keys(CATEGORY_CODES)];

const DEFAULT_FILTERS: SearchFilters = {
  searchTerm:         "",
  status:             "All",
  vehicleCategory:    "All Categories",
  district:           "All Districts",
  registrationPeriod: "All",
  expiryStatus:       "All",
};

const DEBOUNCE_MS = 300;

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchBar({ onFiltersChange }: SearchBarProps) {
  const [filters,      setFilters]      = useState<SearchFilters>(DEFAULT_FILTERS);
  const [inputValue,   setInputValue]   = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounce search input — only updates filters state after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, searchTerm: inputValue }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Notify parent AFTER render — fixes "setState during render" warning.
  // This is the only place onFiltersChange is called.
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update any non-search filter key
  const updateFilter = useCallback(
    (key: keyof Omit<SearchFilters, "searchTerm">, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearAll = useCallback(() => {
    setInputValue("");
    setFilters(DEFAULT_FILTERS);
  }, []);

  const activeFilterCount = [
    filters.status             !== "All",
    filters.vehicleCategory    !== "All Categories",
    filters.district           !== "All Districts",
    filters.registrationPeriod !== "All",
    filters.expiryStatus       !== "All",
  ].filter(Boolean).length;

  return (
    <Card className="p-4 border-slate-200">
      <div className="space-y-4">

        {/* ── Search input + filter button ── */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
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

              {/* Header */}
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
              <div className="p-4 space-y-4 max-h-[340px] overflow-y-auto">

                {/* Status */}
                <FilterField label="Status" icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}>
                  <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="Active">
                        <span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />Active</span>
                      </SelectItem>
                      <SelectItem value="Pending">
                        <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-yellow-600" />Pending</span>
                      </SelectItem>
                      <SelectItem value="Expired">
                        <span className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-red-600" />Expired</span>
                      </SelectItem>
                      <SelectItem value="Suspended">
                        <span className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 text-slate-600" />Suspended</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FilterField>

                {/* Vehicle Category — from CATEGORY_CODES */}
                <FilterField label="Vehicle Category" icon={<Bike className="h-3.5 w-3.5 text-green-600" />}>
                  <Select value={filters.vehicleCategory} onValueChange={(v) => updateFilter("vehicleCategory", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VEHICLE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>

                {/* District — from DISTRICT_CODES */}
                <FilterField label="District / Municipality" icon={<MapPin className="h-3.5 w-3.5 text-green-600" />}>
                  <Select value={filters.district} onValueChange={(v) => updateFilter("district", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-52">
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>

                {/* Registration Period */}
                <FilterField label="Registration Period" icon={<Calendar className="h-3.5 w-3.5 text-green-600" />}>
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
                </FilterField>

                {/* Expiry Status */}
                <FilterField label="Expiry Status" icon={<AlertCircle className="h-3.5 w-3.5 text-green-600" />}>
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
                </FilterField>

              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-200 bg-slate-50">
                <Button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm"
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* ── Active filter chips ── */}
        {(activeFilterCount > 0 || inputValue) && (
          <div className="flex flex-wrap gap-2">
            {inputValue && (
              <FilterChip
                label={`Search: "${inputValue}"`}
                color="bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                onRemove={() => setInputValue("")}
              />
            )}
            {filters.status !== "All" && (
              <FilterChip
                label={`Status: ${filters.status}`}
                color="bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                onRemove={() => updateFilter("status", "All")}
              />
            )}
            {filters.vehicleCategory !== "All Categories" && (
              <FilterChip
                label={filters.vehicleCategory}
                color="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                onRemove={() => updateFilter("vehicleCategory", "All Categories")}
              />
            )}
            {filters.district !== "All Districts" && (
              <FilterChip
                label={filters.district}
                color="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                onRemove={() => updateFilter("district", "All Districts")}
              />
            )}
            {filters.registrationPeriod !== "All" && (
              <FilterChip
                label={filters.registrationPeriod}
                color="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200"
                onRemove={() => updateFilter("registrationPeriod", "All")}
              />
            )}
            {filters.expiryStatus !== "All" && (
              <FilterChip
                label={`Expiry: ${filters.expiryStatus}`}
                color="bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                onRemove={() => updateFilter("expiryStatus", "All")}
              />
            )}
            <button
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-700 font-semibold underline self-center"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterField({
  label, icon, children,
}: {
  label:    string;
  icon:     React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function FilterChip({
  label, color, onRemove,
}: {
  label:    string;
  color:    string;
  onRemove: () => void;
}) {
  return (
    <Badge
      variant="secondary"
      className={`gap-1 pr-1 border text-xs font-medium ${color}`}
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}