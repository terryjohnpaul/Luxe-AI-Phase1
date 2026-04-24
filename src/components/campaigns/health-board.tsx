"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, TrendingUp, Eye, Pause } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fmtINR } from "@/lib/campaigns/formatters";
import type { HealthGroup, HealthLane } from "@/lib/campaigns/health";

interface HealthBoardProps {
  groups: HealthGroup[];
  renderCard: (campaignId: string) => React.ReactNode;
}

const LANE_CONFIG: Record<HealthLane, {
  icon: typeof AlertTriangle;
  headerBg: string;
  headerText: string;
  countBg: string;
  hint: string;
}> = {
  needs_attention: {
    icon: AlertTriangle,
    headerBg: "bg-red-50",
    headerText: "text-red-800",
    countBg: "bg-red-100 text-red-700",
    hint: "Consider pausing or reducing budget on these campaigns",
  },
  top_performers: {
    icon: TrendingUp,
    headerBg: "bg-green-50",
    headerText: "text-green-800",
    countBg: "bg-green-100 text-green-700",
    hint: "Scale these — increase budget to capture more conversions",
  },
  monitoring: {
    icon: Eye,
    headerBg: "bg-amber-50",
    headerText: "text-amber-800",
    countBg: "bg-amber-100 text-amber-700",
    hint: "Watch closely — mixed signals, may need optimization",
  },
  paused: {
    icon: Pause,
    headerBg: "bg-gray-50",
    headerText: "text-gray-700",
    countBg: "bg-gray-200 text-gray-600",
    hint: "Review to reactivate or archive",
  },
};

export function HealthBoard({ groups, renderCard }: HealthBoardProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <HealthLaneSection key={group.lane} group={group} renderCard={renderCard} />
      ))}
    </div>
  );
}

function HealthLaneSection({
  group,
  renderCard,
}: {
  group: HealthGroup;
  renderCard: (campaignId: string) => React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(group.lane === "paused");
  const config = LANE_CONFIG[group.lane];
  const Icon = config.icon;

  if (group.campaigns.length === 0) return null;

  return (
    <div className="rounded-lg">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors",
          config.headerBg,
          "hover:opacity-90"
        )}
      >
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2">
            <Icon size={16} className={config.headerText} />
            <span className={cn("text-sm font-semibold", config.headerText)}>
              {group.label}
            </span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", config.countBg)}>
              {group.campaigns.length}
            </span>
            {group.totalSpend > 0 && (
              <span className="text-xs text-muted ml-2">
                {fmtINR(group.totalSpend)} spend
              </span>
            )}
          </div>
          <span className="text-xs text-muted pl-6">{config.hint}</span>
        </div>
        {collapsed ? (
          <ChevronRight size={16} className="text-muted shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-muted shrink-0" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-3 pt-3">
          {group.campaigns.map((c, i) => (
            <div key={c.id} className="card-enter" style={{ animationDelay: `${i * 60}ms` }}>
              {renderCard(c.id)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
