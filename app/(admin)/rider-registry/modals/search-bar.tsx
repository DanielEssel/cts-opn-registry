import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  return (
    <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, RIN, or phone number..."
          className="pl-11 h-10 border-none focus-visible:ring-0 text-slate-700 placeholder:text-slate-400"
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-slate-500 hover:bg-slate-50"
      >
        <Filter className="h-4 w-4 mr-2" /> Filters
      </Button>
    </div>
  );
}