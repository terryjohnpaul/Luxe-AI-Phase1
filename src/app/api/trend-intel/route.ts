import { NextResponse } from "next/server";
import { getPinterestSignals } from "@/lib/signals/pinterest-trends";
import { getInstagramHashtagSignals } from "@/lib/signals/instagram-hashtags";
import { getLystSignals } from "@/lib/signals/lyst-trending";
import { cachedFetch, registerForPrewarm } from "@/lib/api-cache";

async function fetchTrendData() {
  const [pinterestSignals, instagramSignals, lystSignals] = await Promise.all([
    getPinterestSignals(),
    getInstagramHashtagSignals(),
    getLystSignals(),
  ]);

  const viralCount =
    pinterestSignals.filter((s: any) => s.severity === "high").length +
    instagramSignals.filter((s: any) => s.severity === "high").length +
    lystSignals.filter((s: any) => s.severity === "high").length;

  const allBrands = [
    ...pinterestSignals.flatMap((s: any) => s.suggestedBrands || []),
    ...instagramSignals.flatMap((s: any) => s.suggestedBrands || []),
    ...lystSignals.flatMap((s: any) => s.suggestedBrands || []),
  ];
  const brandCounts: Record<string, number> = {};
  for (const b of allBrands) brandCounts[b] = (brandCounts[b] || 0) + 1;
  const topBrands = Object.entries(brandCounts)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return {
    pinterest: pinterestSignals,
    instagram: instagramSignals,
    lyst: lystSignals,
    summary: { totalTrends: pinterestSignals.length + instagramSignals.length + lystSignals.length, viralCount, topBrands },
  };
}

registerForPrewarm("trend-intel", fetchTrendData);

export async function GET(request: Request) {
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "true";
  const { data, fetchedAt } = await cachedFetch("trend-intel", fetchTrendData, forceRefresh);
  return NextResponse.json({ ...data, fetchedAt });
}
