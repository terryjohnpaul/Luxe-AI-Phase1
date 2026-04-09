import { NextResponse } from "next/server";

function generateDailyMetrics(startDate: string, endDate: string) {
  const days: Array<{
    date: string;
    spend: number;
    revenue: number;
    conversions: number;
    impressions: number;
    clicks: number;
    roas: number;
    cpa: number;
  }> = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Luxury fashion gets more weekend traffic
    const baseSpend = isWeekend ? 85000 : 72000;
    const variance = 0.85 + Math.random() * 0.3;
    const spend = Math.round(baseSpend * variance);

    const conversionRate = isWeekend ? 0.032 : 0.028;
    const avgClicks = Math.round(spend / (5.5 + Math.random() * 2));
    const conversions = Math.round(avgClicks * conversionRate);
    const avgOrderValue = 4200 + Math.random() * 1800;
    const revenue = Math.round(conversions * avgOrderValue);

    days.push({
      date: d.toISOString().split("T")[0],
      spend,
      revenue,
      conversions,
      impressions: Math.round(avgClicks * (28 + Math.random() * 12)),
      clicks: avgClicks,
      roas: parseFloat((revenue / spend).toFixed(2)),
      cpa: parseFloat((spend / Math.max(conversions, 1)).toFixed(0)),
    });
  }

  return days;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || "2026-03-01";
  const endDate = searchParams.get("endDate") || "2026-03-27";
  const platform = searchParams.get("platform"); // META, GOOGLE, or null for all

  const dailyMetrics = generateDailyMetrics(startDate, endDate);

  const totals = dailyMetrics.reduce(
    (acc, day) => ({
      spend: acc.spend + day.spend,
      revenue: acc.revenue + day.revenue,
      conversions: acc.conversions + day.conversions,
      impressions: acc.impressions + day.impressions,
      clicks: acc.clicks + day.clicks,
    }),
    { spend: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
  );

  const roas = parseFloat((totals.revenue / totals.spend).toFixed(2));
  const cpa = Math.round(totals.spend / Math.max(totals.conversions, 1));
  const netRoas = parseFloat((roas * 0.82).toFixed(2)); // ~18% return rate for luxury
  const ctr = parseFloat(
    ((totals.clicks / totals.impressions) * 100).toFixed(2)
  );

  return NextResponse.json({
    period: { startDate, endDate },
    platform: platform || "ALL",
    totals: {
      spend: totals.spend,
      revenue: totals.revenue,
      conversions: totals.conversions,
      impressions: totals.impressions,
      clicks: totals.clicks,
      roas,
      netRoas,
      cpa,
      ctr,
      returnRate: 18.2,
      avgOrderValue: Math.round(totals.revenue / Math.max(totals.conversions, 1)),
    },
    byPlatform: {
      META: {
        spend: Math.round(totals.spend * 0.55),
        revenue: Math.round(totals.revenue * 0.58),
        conversions: Math.round(totals.conversions * 0.56),
        roas: parseFloat(((totals.revenue * 0.58) / (totals.spend * 0.55)).toFixed(2)),
      },
      GOOGLE: {
        spend: Math.round(totals.spend * 0.45),
        revenue: Math.round(totals.revenue * 0.42),
        conversions: Math.round(totals.conversions * 0.44),
        roas: parseFloat(((totals.revenue * 0.42) / (totals.spend * 0.45)).toFixed(2)),
      },
    },
    byBrand: [
      { brand: "Hugo Boss", spend: Math.round(totals.spend * 0.35), revenue: Math.round(totals.revenue * 0.38), roas: 7.2 },
      { brand: "Diesel", spend: Math.round(totals.spend * 0.25), revenue: Math.round(totals.revenue * 0.28), roas: 8.4 },
      { brand: "Kenzo", spend: Math.round(totals.spend * 0.2), revenue: Math.round(totals.revenue * 0.18), roas: 5.8 },
      { brand: "Ami Paris", spend: Math.round(totals.spend * 0.12), revenue: Math.round(totals.revenue * 0.11), roas: 6.1 },
      { brand: "Armani Exchange", spend: Math.round(totals.spend * 0.08), revenue: Math.round(totals.revenue * 0.05), roas: 3.9 },
    ],
    daily: dailyMetrics,
    currency: "INR",
  });
}
