"use client";

import { useState } from "react";
import { Play, Pause, Pencil, Brain, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fmtINR, fmtNum, fmtROAS, fmtPct, safe } from "@/lib/campaigns/formatters";
import type { Campaign } from "@/lib/campaigns/health";

interface CampaignCardProps {
  campaign: Campaign;
  healthDot: "red" | "amber" | "green" | "gray";
  currentAccountId: string;
  isEditing: boolean;
  isAnalyzing: boolean;
  onToggleEdit: (campaign: Campaign) => void;
  onToggleAnalyze: (campaign: Campaign) => void;
  editPanel?: React.ReactNode;
  analyzePanel?: React.ReactNode;
}

export function CampaignCard({
  campaign: c,
  healthDot,
  currentAccountId,
  isEditing,
  isAnalyzing,
  onToggleEdit,
  onToggleAnalyze,
  editPanel,
  analyzePanel,
}: CampaignCardProps) {
  const [expanded, setExpanded] = useState(false);

  const dotColors = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    green: "bg-green-500",
    gray: "bg-gray-400",
  };

  const roasColor =
    safe(c.metrics?.roas) >= 3
      ? "text-green-700"
      : safe(c.metrics?.roas) >= 1
      ? "text-amber-700"
      : safe(c.metrics?.roas) > 0
      ? "text-red-700"
      : "text-muted";

  const platformLink =
    c.platform === "META"
      ? `https://www.facebook.com/adsmanager/manage/campaigns?act=${currentAccountId}&campaign_ids=${c.id}`
      : `https://ads.google.com/aw/campaigns?campaignId=${c.id}`;

  return (
    <article className="glass-card p-4 transition-all duration-200 card-enter hover:shadow-md">
      {/* Row 1: Badges + name */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", dotColors[healthDot])} />
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded font-medium border",
            c.platform === "META"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-emerald-100 text-emerald-700 border-emerald-200"
          )}
        >
          {c.platform}
        </span>
        {c.campaignType && (
          <span className="text-xs px-2 py-0.5 rounded bg-surface text-text-secondary font-medium border border-card-border">
            {c.campaignType.replace(/_/g, " ")}
          </span>
        )}
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border",
            c.status === "ACTIVE"
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-amber-100 text-amber-700 border-amber-200"
          )}
        >
          {c.status === "ACTIVE" ? <Play size={8} /> : <Pause size={8} />}
          {c.status}
        </span>
        <span className="text-sm font-semibold text-text ml-1 break-all leading-snug">
          {c.name || "--"}
        </span>
      </div>

      {/* Row 2: 3 Hero Metrics */}
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <p className="text-xs text-muted">Spend</p>
          <p className="font-mono text-sm font-semibold">
            {safe(c.metrics?.spend) > 0 ? fmtINR(safe(c.metrics.spend)) : "--"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">ROAS</p>
          <p className={cn("font-mono text-sm font-semibold", roasColor)}>
            {safe(c.metrics?.roas) > 0 ? fmtROAS(safe(c.metrics.roas)) : "--"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">CPA</p>
          <p className="font-mono text-sm font-semibold">
            {safe(c.metrics?.cpa) > 0 ? fmtINR(safe(c.metrics.cpa)) : "--"}
          </p>
        </div>

        {expanded && (
          <>
            <div>
              <p className="text-xs text-muted">Conversions</p>
              <p className="font-mono text-sm">{safe(c.metrics?.conversions) > 0 ? fmtNum(safe(c.metrics.conversions)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">CTR</p>
              <p className="font-mono text-sm">{safe(c.metrics?.ctr) > 0 ? fmtPct(safe(c.metrics.ctr)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Impressions</p>
              <p className="font-mono text-sm">{safe(c.metrics?.impressions) > 0 ? fmtNum(safe(c.metrics.impressions)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Clicks</p>
              <p className="font-mono text-sm">{safe(c.metrics?.clicks) > 0 ? fmtNum(safe(c.metrics.clicks)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Daily Budget</p>
              <p className="font-mono text-sm">{c.dailyBudget > 0 ? fmtINR(c.dailyBudget) : "--"}</p>
            </div>
          </>
        )}
      </div>

      {/* Row 3: Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-card-border">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted hover:text-text transition-colors"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {expanded ? "Less" : "More"}
        </button>
        <button
          onClick={() => onToggleEdit(c)}
          className={cn(
            "text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border",
            isEditing
              ? "bg-brand-blue/10 text-brand-blue border-brand-blue/20"
              : "text-muted hover:text-text hover:bg-surface border-card-border"
          )}
        >
          <Pencil size={11} />
          Edit
        </button>
        <button
          onClick={() => onToggleAnalyze(c)}
          className={cn(
            "text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border",
            isAnalyzing
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : "text-muted hover:text-text hover:bg-surface border-card-border"
          )}
        >
          <Brain size={11} />
          AI Analyze
        </button>
        <a
          href={platformLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg text-muted hover:text-text hover:bg-surface flex items-center gap-1.5 ml-auto transition-colors border border-card-border"
        >
          Open in {c.platform === "META" ? "Meta" : "Google"}
          <ExternalLink size={10} />
        </a>
      </div>

      {isEditing && editPanel && <div className="panel-expand">{editPanel}</div>}
      {isAnalyzing && analyzePanel && <div className="panel-expand">{analyzePanel}</div>}
    </article>
  );
}
