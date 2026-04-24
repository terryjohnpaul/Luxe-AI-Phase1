export interface CampaignMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionValue: number;
  roas: number;
  cpa: number;
  cpc: number;
}

export interface Campaign {
  id: string;
  dbId?: string;
  platform: string;
  name: string;
  status: string;
  campaignType: string;
  dailyBudget: number;
  metrics: CampaignMetrics;
}

export type HealthLane = "needs_attention" | "top_performers" | "monitoring" | "paused";

export interface HealthGroup {
  lane: HealthLane;
  label: string;
  color: "red" | "green" | "orange" | "navy";
  campaigns: Campaign[];
  totalSpend: number;
}

export interface AggregateStats {
  totalSpend: number;
  blendedROAS: number;
  totalConversions: number;
  avgCPA: number;
  totalRevenue: number;
  activeCampaigns: number;
  totalCampaigns: number;
}

export function computeAggregateStats(campaigns: Campaign[]): AggregateStats {
  const active = campaigns.filter((c) => c.status === "ACTIVE");
  const totalSpend = campaigns.reduce((s, c) => s + (c.metrics?.spend || 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + (c.metrics?.conversionValue || 0), 0);
  const totalConversions = campaigns.reduce((s, c) => s + (c.metrics?.conversions || 0), 0);

  return {
    totalSpend,
    blendedROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    totalConversions,
    avgCPA: totalConversions > 0 ? totalSpend / totalConversions : 0,
    totalRevenue,
    activeCampaigns: active.length,
    totalCampaigns: campaigns.length,
  };
}

export function classifyCampaigns(campaigns: Campaign[]): HealthGroup[] {
  const active = campaigns.filter((c) => c.status === "ACTIVE");
  const paused = campaigns.filter((c) => c.status !== "ACTIVE");

  const withConversions = active.filter((c) => (c.metrics?.conversions || 0) > 0);
  const avgCPA =
    withConversions.length > 0
      ? withConversions.reduce((s, c) => s + (c.metrics?.cpa || 0), 0) / withConversions.length
      : 0;

  const needsAttention: Campaign[] = [];
  const topPerformers: Campaign[] = [];
  const monitoring: Campaign[] = [];

  for (const c of active) {
    const roas = c.metrics?.roas || 0;
    const cpa = c.metrics?.cpa || 0;
    const spend = c.metrics?.spend || 0;

    if (spend > 0 && (roas < 1 || (avgCPA > 0 && cpa > avgCPA * 2))) {
      needsAttention.push(c);
    } else if (roas >= 3 && (avgCPA === 0 || cpa <= avgCPA)) {
      topPerformers.push(c);
    } else {
      monitoring.push(c);
    }
  }

  const sumSpend = (arr: Campaign[]) => arr.reduce((s, c) => s + (c.metrics?.spend || 0), 0);

  return [
    { lane: "needs_attention", label: "Needs Attention", color: "red", campaigns: needsAttention, totalSpend: sumSpend(needsAttention) },
    { lane: "top_performers", label: "Top Performers", color: "green", campaigns: topPerformers, totalSpend: sumSpend(topPerformers) },
    { lane: "monitoring", label: "Monitoring", color: "orange", campaigns: monitoring, totalSpend: sumSpend(monitoring) },
    { lane: "paused", label: "Paused", color: "navy", campaigns: paused, totalSpend: sumSpend(paused) },
  ];
}

export function getHealthDot(campaign: Campaign, avgCPA: number): "red" | "amber" | "green" | "gray" {
  if (campaign.status !== "ACTIVE") return "gray";
  const roas = campaign.metrics?.roas || 0;
  const cpa = campaign.metrics?.cpa || 0;
  const spend = campaign.metrics?.spend || 0;
  if (spend > 0 && (roas < 1 || (avgCPA > 0 && cpa > avgCPA * 2))) return "red";
  if (roas >= 3 && (avgCPA === 0 || cpa <= avgCPA)) return "green";
  return "amber";
}
