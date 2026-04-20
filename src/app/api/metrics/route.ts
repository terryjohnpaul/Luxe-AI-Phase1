import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-cache";

const META_BASE = "https://graph.facebook.com/v25.0";

interface DailyMetric {
  date: string;
  spend: number;
  revenue: number;
  conversions: number;
  impressions: number;
  clicks: number;
  roas: number;
  cpa: number;
}

function extractPurchases(actions: any[]): number {
  if (!actions) return 0;
  const purchase = actions.find((a: any) => a.action_type === "purchase" || a.action_type === "omni_purchase");
  return purchase ? parseInt(purchase.value) : 0;
}

function extractRevenue(actionValues: any[]): number {
  if (!actionValues) return 0;
  const purchase = actionValues.find((a: any) => a.action_type === "omni_purchase" || a.action_type === "purchase");
  return purchase ? parseFloat(purchase.value) : 0;
}

async function fetchMetaDailyTrend(): Promise<DailyMetric[]> {
  const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
  const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
  if (!token || !accountId) return [];

  try {
    const url = `${META_BASE}/act_${accountId}/insights?fields=spend,impressions,clicks,actions,action_values,purchase_roas&time_increment=1&date_preset=last_30d&access_token=${token}`;
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json.data) return [];

    return json.data.map((day: any) => {
      const spend = parseFloat(day.spend || "0");
      const conversions = extractPurchases(day.actions);
      const revenue = extractRevenue(day.action_values);
      return {
        date: day.date_start,
        spend: Math.round(spend),
        revenue: Math.round(revenue),
        conversions,
        impressions: parseInt(day.impressions || "0"),
        clicks: parseInt(day.clicks || "0"),
        roas: spend > 0 ? parseFloat((revenue / spend).toFixed(2)) : 0,
        cpa: conversions > 0 ? parseFloat((spend / conversions).toFixed(0)) : 0,
      };
    });
  } catch (e) {
    console.error("[metrics] Meta API error:", e);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "true";

  const { data: dailyMetrics, fetchedAt, fromCache } = await cachedFetch<DailyMetric[]>(
    "meta-daily-metrics",
    fetchMetaDailyTrend,
    refresh
  );

  if (!dailyMetrics || dailyMetrics.length === 0) {
    return NextResponse.json({
      dailyMetrics: [],
      summary: { totalSpend: 0, totalRevenue: 0, totalConversions: 0, avgRoas: 0, avgCpa: 0 },
      source: "no_data",
      fetchedAt,
    });
  }

  const totalSpend = dailyMetrics.reduce((s, d) => s + d.spend, 0);
  const totalRevenue = dailyMetrics.reduce((s, d) => s + d.revenue, 0);
  const totalConversions = dailyMetrics.reduce((s, d) => s + d.conversions, 0);

  return NextResponse.json({
    dailyMetrics,
    summary: {
      totalSpend,
      totalRevenue,
      totalConversions,
      avgRoas: totalSpend > 0 ? parseFloat((totalRevenue / totalSpend).toFixed(2)) : 0,
      avgCpa: totalConversions > 0 ? parseFloat((totalSpend / totalConversions).toFixed(0)) : 0,
      days: dailyMetrics.length,
    },
    source: fromCache ? "cache" : "live_meta_api",
    fetchedAt,
  });
}
