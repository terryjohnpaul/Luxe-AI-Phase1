"use client";

import { useState } from "react";
import { Play, Pause, Pencil, Brain, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fmtINR, fmtNum, fmtROAS, fmtPct, safe, humanizeCampaignName } from "@/lib/campaigns/formatters";
import type { Campaign } from "@/lib/campaigns/health";

interface CampaignCardProps {
  campaign: Campaign;
  healthDot: "red" | "amber" | "green" | "gray";
  avgCPA: number;
  currentAccountId: string;
  isEditing: boolean;
  isAnalyzing: boolean;
  onToggleEdit: (campaign: Campaign) => void;
  onToggleAnalyze: (campaign: Campaign) => void;
  editPanel?: React.ReactNode;
  analyzePanel?: React.ReactNode;
}

const DOT_TOOLTIPS: Record<string, string> = {
  red: "Needs attention — ROAS below 1.0x or CPA too high",
  amber: "Monitoring — performance is acceptable but not strong",
  green: "Top performer — ROAS above 3.0x",
  gray: "Paused",
};

export function CampaignCard({
  campaign: c,
  healthDot,
  avgCPA,
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

  // ROAS color
  const roas = safe(c.metrics?.roas);
  const roasColor =
    roas >= 3 ? "text-green-700" :
    roas >= 1 ? "text-amber-700" :
    roas > 0 ? "text-red-700" :
    "text-muted";

  // CPA color (relative to average)
  const cpa = safe(c.metrics?.cpa);
  const cpaColor =
    cpa <= 0 ? "text-muted" :
    avgCPA <= 0 ? "text-text" :
    cpa <= avgCPA ? "text-green-700" :
    cpa <= avgCPA * 2 ? "text-amber-700" :
    "text-red-700";

  // Health dot tooltip with actual values
  const dotTooltip = healthDot === "red"
    ? `Needs attention — ROAS ${fmtROAS(roas)} (below 1.0x)`
    : healthDot === "green"
    ? `Top performer — ROAS ${fmtROAS(roas)} (above 3.0x)`
    : healthDot === "gray"
    ? "Paused"
    : `Monitoring — ROAS ${fmtROAS(roas)}`;

  const platformLink =
    c.platform === "META"
      ? `https://www.facebook.com/adsmanager/manage/campaigns?act=${currentAccountId}&campaign_ids=${c.id}`
      : `https://ads.google.com/aw/campaigns?campaignId=${c.id}`;

  const displayName = humanizeCampaignName(c.name);

  return (
    <article className="glass-card p-4 transition-all duration-200 hover:shadow-md">
      {/* Row 1: Badges + name */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Health dot with tooltip */}
        <span
          className={cn("w-2.5 h-2.5 rounded-full shrink-0 cursor-help", dotColors[healthDot])}
          title={dotTooltip}
        />

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

        {/* Humanized name with raw slug on hover */}
        <span
          className="text-sm font-semibold text-text ml-1 leading-snug"
          title={c.name}
        >
          {displayName}
        </span>
      </div>

      {/* Row 2: 3 Hero Metrics */}
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <p className="text-xs text-muted mb-0.5">Spend</p>
          <p className="text-base font-semibold tabular-nums tracking-tight">
            {safe(c.metrics?.spend) > 0 ? fmtINR(safe(c.metrics.spend)) : "--"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted mb-0.5">ROAS</p>
          <p className={cn("text-base font-semibold tabular-nums tracking-tight", roasColor)}>
            {roas > 0 ? fmtROAS(roas) : "--"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted mb-0.5">CPA</p>
          <p className={cn("text-base font-semibold tabular-nums tracking-tight", cpaColor)}>
            {cpa > 0 ? fmtINR(cpa) : "--"}
          </p>
        </div>

        {expanded && (
          <>
            <div>
              <p className="text-xs text-muted mb-0.5">Conversions</p>
              <p className="text-sm tabular-nums">{safe(c.metrics?.conversions) > 0 ? fmtNum(safe(c.metrics.conversions)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">CTR</p>
              <p className="text-sm tabular-nums">{safe(c.metrics?.ctr) > 0 ? fmtPct(safe(c.metrics.ctr)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Impressions</p>
              <p className="text-sm tabular-nums">{safe(c.metrics?.impressions) > 0 ? fmtNum(safe(c.metrics.impressions)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Clicks</p>
              <p className="text-sm tabular-nums">{safe(c.metrics?.clicks) > 0 ? fmtNum(safe(c.metrics.clicks)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Daily Budget</p>
              <p className="text-sm tabular-nums">{c.dailyBudget > 0 ? fmtINR(c.dailyBudget) : "--"}</p>
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
          {expanded ? "All Metrics" : "All Metrics"}
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

        {/* Divider */}
        <div className="h-5 border-l border-card-border ml-auto" />

        <a
          href={platformLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg text-muted hover:text-text hover:bg-surface flex items-center gap-1.5 transition-colors border border-card-border"
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
