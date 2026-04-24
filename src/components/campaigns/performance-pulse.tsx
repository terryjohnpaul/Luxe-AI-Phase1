"use client";

import { StatCard } from "@/components/ui/stat-card";
import { DollarSign, TrendingUp, ShoppingCart, Target, BarChart3, Activity } from "lucide-react";
import { fmtINR, fmtNum, fmtROAS } from "@/lib/campaigns/formatters";
import type { AggregateStats } from "@/lib/campaigns/health";

interface PerformancePulseProps {
  stats: AggregateStats;
}

export function PerformancePulse({ stats }: PerformancePulseProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <StatCard
        label="Total Spend"
        value={fmtINR(stats.totalSpend)}
        color="blue"
        icon={DollarSign}
      />
      <StatCard
        label="Blended ROAS"
        value={fmtROAS(stats.blendedROAS)}
        color="green"
        icon={TrendingUp}
      />
      <StatCard
        label="Conversions"
        value={fmtNum(stats.totalConversions)}
        color="purple"
        icon={ShoppingCart}
      />
      <StatCard
        label="Avg CPA"
        value={stats.avgCPA > 0 ? fmtINR(stats.avgCPA) : "--"}
        color="orange"
        icon={Target}
      />
      <StatCard
        label="Revenue"
        value={fmtINR(stats.totalRevenue)}
        color="navy"
        icon={BarChart3}
      />
      <StatCard
        label="Active / Total"
        value={`${stats.activeCampaigns} / ${stats.totalCampaigns}`}
        color="red"
        icon={Activity}
      />
    </div>
  );
}
