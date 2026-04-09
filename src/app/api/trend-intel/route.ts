import { NextResponse } from "next/server";
import { getPinterestTrends } from "@/lib/signals/pinterest-trends";
import { getInstagramTrends } from "@/lib/signals/instagram-hashtags";
import { getLystTrending } from "@/lib/signals/lyst-trending";

export async function GET() {
  const pinterest = getPinterestTrends();
  const instagram = getInstagramTrends();
  const lyst = getLystTrending();

  // Compute viral count
  const viralCount =
    pinterest.filter(t => t.trendDirection === "viral").length +
    instagram.filter(t => t.growthPercent >= 300).length +
    lyst.filter(p => p.searchGrowth >= 200).length;

  // Gather all categories
  const allCategories = [
    ...pinterest.map(t => t.category),
    ...instagram.map(t => t.category),
    ...lyst.map(p => p.category),
  ];
  const categoryCounts: Record<string, number> = {};
  for (const c of allCategories) {
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  }
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Gather all brands
  const allBrands = [
    ...pinterest.flatMap(t => t.relatedBrands),
    ...instagram.flatMap(t => t.topBrands),
    ...lyst.map(p => p.brand),
  ];
  const brandCounts: Record<string, number> = {};
  for (const b of allBrands) {
    brandCounts[b] = (brandCounts[b] || 0) + 1;
  }
  const topBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json({
    pinterest,
    instagram,
    lyst,
    summary: {
      totalTrends: pinterest.length + instagram.length + lyst.length,
      viralCount,
      topCategories,
      topBrands,
    },
    fetchedAt: new Date().toISOString(),
  });
}
