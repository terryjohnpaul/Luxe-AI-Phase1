"use client";

import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type SortKey = "spend" | "roas" | "conversions" | "cpa";
export type DateRange = "today" | "last_7d" | "last_30d";

interface FiltersBarProps {
  platformFilter: string;
  onPlatformChange: (platform: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  sortBy: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}

const PLATFORM_FILTERS = [
  { key: "all", label: "All" },
  { key: "META", label: "Meta" },
  { key: "GOOGLE", label: "Google" },
];

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "last_7d", label: "7d" },
  { key: "last_30d", label: "30d" },
];

const SORT_OPTIONS: { label: string; col: SortKey }[] = [
  { label: "Spend", col: "spend" },
  { label: "ROAS", col: "roas" },
  { label: "CPA", col: "cpa" },
  { label: "Conv", col: "conversions" },
];

export function FiltersBar({
  platformFilter,
  onPlatformChange,
  dateRange,
  onDateRangeChange,
  searchInput,
  onSearchChange,
  sortBy,
  sortDir,
  onSort,
}: FiltersBarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-4 pb-4 border-b border-card-border">
      {/* Platform filter */}
      <div className="flex items-center gap-1">
        {PLATFORM_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onPlatformChange(f.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              platformFilter === f.key
                ? "bg-navy text-white"
                : "text-muted hover:bg-surface"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5">
        {DATE_RANGES.map((d) => (
          <button
            key={d.key}
            onClick={() => onDateRangeChange(d.key)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              dateRange === d.key
                ? "bg-white text-brand-blue shadow-sm"
                : "text-muted hover:text-text"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 min-w-[200px] max-w-sm relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search campaigns..."
          className="w-full bg-white border border-card-border rounded-lg pl-9 pr-3 py-2 text-xs text-text placeholder-muted focus:outline-none focus:ring-1 focus:ring-brand-blue"
        />
      </div>

      {/* Sort buttons */}
      <div className="flex gap-1.5 ml-auto">
        {SORT_OPTIONS.map(({ label, col }) => (
          <button
            key={col}
            onClick={() => onSort(col)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border",
              sortBy === col
                ? "bg-brand-blue/10 text-brand-blue border-brand-blue/20 font-medium"
                : "text-muted hover:text-text hover:bg-surface border-card-border"
            )}
          >
            {label}
            {sortBy === col ? (
              sortDir === "desc" ? <ArrowDown size={10} /> : <ArrowUp size={10} />
            ) : (
              <ArrowUpDown size={10} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
