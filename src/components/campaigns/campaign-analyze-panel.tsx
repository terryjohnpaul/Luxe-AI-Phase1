"use client";

import { Brain, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AnalyzePanelProps {
  isLoading: boolean;
  results: any | null;
  onClose: () => void;
}

export function CampaignAnalyzePanel({ isLoading, results, onClose }: AnalyzePanelProps) {
  return (
    <div className="mt-3 p-4 glass-card border-l-4 border-l-purple-500">
      <div className="flex items-center gap-2 mb-3">
        <Brain size={14} className="text-purple-600" />
        <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
          Deep AI Analysis
        </span>
        <button
          onClick={onClose}
          className="ml-auto text-muted hover:text-text transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-6">
          <Loader2 size={16} className="animate-spin text-purple-500" />
          <div>
            <span className="text-xs font-medium">Deep analyzing</span>
            <span className="text-xs text-purple-500 animate-pulse">...</span>
            <p className="text-xs text-muted mt-0.5">
              Fetching ad sets, ads, breakdowns, and 7-day trends from Meta API
            </p>
          </div>
        </div>
      ) : results ? (
        <div>
          <div className="space-y-2.5">
            {(results.suggestions || []).map((s: any, i: number) => (
              <div
                key={i}
                className={cn(
                  "pl-3 py-2 pr-3 rounded-r-lg text-sm",
                  s.type === "warning" && "border-l-2 border-red-500 bg-red-50",
                  s.type === "success" && "border-l-2 border-green-500 bg-green-50",
                  s.type === "opportunity" && "border-l-2 border-purple-500 bg-purple-50",
                  !["warning", "success", "opportunity"].includes(s.type) && "border-l-2 border-blue-500 bg-blue-50"
                )}
              >
                <p className="font-semibold text-text text-sm">{s.icon} {s.title}</p>
                <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">{s.detail}</p>
              </div>
            ))}
          </div>
          {results.meta && (
            <div className="mt-3 pt-3 border-t border-card-border">
              <p className="text-xs text-muted">
                Analyzed: {results.meta.adSetsCount} ad sets, {results.meta.adsCount} ads,{" "}
                {results.meta.ageSegments} age segments, {results.meta.placementsCount} placements,{" "}
                {results.meta.devicesCount} devices, {results.meta.dailyDays}-day trend
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
