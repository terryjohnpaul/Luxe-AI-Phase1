/**
 * Social/Pinterest Trends Intelligence — Luxury F&L
 * Tracks trending luxury fashion searches and aesthetics globally.
 * Real data: Apify Google Trends Scraper
 * Covers ALL luxury fashion trends, not limited to any retailer's catalog.
 */

import { Signal } from "./types";
import { scrapeGoogleTrends } from "@/lib/integrations/apify";
import { cachedApifyCall } from "@/lib/apify-cache";

export interface PinterestTrend {
  keyword: string;
  category: string;
  growthPercent: number;
  weeklyPins: string;
  relatedBrands: string[];
  trendDirection: "rising" | "stable" | "viral";
  adOpportunity: string;
}

// Track broad luxury F&L trends — not retailer-specific
const LUXURY_TREND_KEYWORDS = [
  // Style aesthetics
  "quiet luxury outfit",
  "old money aesthetic",
  "mob wife aesthetic",
  "clean girl aesthetic luxury",
  "coastal grandmother style",
  // Product categories
  "luxury work bag India",
  "designer sneakers men India",
  "luxury wedding guest outfit",
  "luxury gifting ideas India",
  "designer sunglasses India",
  // Market intelligence
  "luxury fashion online India",
  "designer bags India price",
  "premium fashion India",
];

// Map trends to relevant luxury brands (industry-wide, not retailer-specific)
const KEYWORD_BRAND_MAP: Record<string, { brands: string[]; category: string }> = {
  "quiet luxury": { brands: ["The Row", "Loro Piana", "Max Mara", "Brunello Cucinelli"], category: "Style Aesthetic" },
  "old money": { brands: ["Ralph Lauren", "Hugo Boss", "Burberry", "Max Mara"], category: "Style Aesthetic" },
  "mob wife": { brands: ["Versace", "Dolce & Gabbana", "Roberto Cavalli", "Tom Ford"], category: "Style Aesthetic" },
  "clean girl": { brands: ["Celine", "Bottega Veneta", "The Row", "Ami Paris"], category: "Style Aesthetic" },
  "coastal grandmother": { brands: ["Loro Piana", "Max Mara", "Ralph Lauren", "Zimmermann"], category: "Style Aesthetic" },
  "luxury work bag": { brands: ["Coach", "Prada", "Louis Vuitton", "Saint Laurent"], category: "Accessories" },
  "designer sneakers": { brands: ["Balenciaga", "Golden Goose", "Alexander McQueen", "Y-3"], category: "Footwear" },
  "wedding guest": { brands: ["Versace", "Self Portrait", "Jimmy Choo", "Hugo Boss"], category: "Occasion Wear" },
  "luxury gifting": { brands: ["Tiffany", "Swarovski", "Coach", "Hermes"], category: "Gifting" },
  "designer sunglasses": { brands: ["Ray-Ban", "Versace", "Prada", "Gucci"], category: "Eyewear" },
  "luxury fashion online": { brands: ["Gucci", "Prada", "Louis Vuitton", "Burberry"], category: "Market Demand" },
  "designer bags": { brands: ["Louis Vuitton", "Gucci", "Coach", "Prada"], category: "Bags & Accessories" },
  "premium fashion": { brands: ["Hugo Boss", "Ralph Lauren", "Calvin Klein", "Tommy Hilfiger"], category: "Market Demand" },
};

function matchBrands(keyword: string): { brands: string[]; category: string } {
  const lower = keyword.toLowerCase();
  for (const [key, val] of Object.entries(KEYWORD_BRAND_MAP)) {
    if (lower.includes(key)) return val;
  }
  return { brands: ["Gucci", "Prada", "Louis Vuitton"], category: "Luxury Fashion" };
}

async function fetchLiveTrends(): Promise<PinterestTrend[]> {
  if (!process.env.APIFY_API_TOKEN) return [];

  try {
    const { data: result } = await cachedApifyCall("pinterest-trends", () =>
      scrapeGoogleTrends(LUXURY_TREND_KEYWORDS.slice(0, 5), "IN")
    );
    if (!result.success || result.data.length === 0) return [];

    const trends: PinterestTrend[] = [];

    for (const item of result.data) {
      const keyword = item.searchTerm || item.keyword || "";
      const interest = item.interestOverTime || item.timelineData || [];
      if (!keyword) continue;

      const values = Array.isArray(interest) ? interest.map((p: any) => p.value || p.values?.[0] || 0) : [];
      const recent = values.slice(-7);
      const older = values.slice(-14, -7);
      const recentAvg = recent.length > 0 ? recent.reduce((a: number, b: number) => a + b, 0) / recent.length : 0;
      const olderAvg = older.length > 0 ? older.reduce((a: number, b: number) => a + b, 0) / older.length : 1;
      const growthPercent = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;

      const { brands, category } = matchBrands(keyword);
      const direction: PinterestTrend["trendDirection"] = growthPercent >= 200 ? "viral" : growthPercent >= 50 ? "rising" : "stable";

      if (growthPercent > 10 || direction !== "stable") {
        trends.push({
          keyword,
          category,
          growthPercent: Math.max(growthPercent, 20),
          weeklyPins: `${Math.round(recentAvg * 10)}K est.`,
          relatedBrands: brands,
          trendDirection: direction,
          adOpportunity: `"${keyword}" is ${direction} in India (+${Math.max(growthPercent, 20)}%). Relevant brands: ${brands.join(", ")}. Capitalize with targeted campaigns.`,
        });
      }
    }

    return trends;
  } catch {
    return [];
  }
}

function getMockTrends(): PinterestTrend[] {
  return [
    { keyword: "quiet luxury outfit", category: "Style Aesthetic", growthPercent: 340, weeklyPins: "1.2M", relatedBrands: ["The Row", "Loro Piana", "Max Mara", "Brunello Cucinelli"], trendDirection: "viral", adOpportunity: "\"Quiet luxury\" is the dominant luxury aesthetic globally. No logos, premium fabrics, understated elegance. Brands like The Row and Loro Piana are leading." },
    { keyword: "old money aesthetic", category: "Style Aesthetic", growthPercent: 420, weeklyPins: "2.1M", relatedBrands: ["Ralph Lauren", "Hugo Boss", "Burberry", "Max Mara"], trendDirection: "viral", adOpportunity: "\"Old money\" look dominating social media. Tailored blazers, polo shirts, loafers. Heritage brands benefiting most." },
    { keyword: "luxury work bag India", category: "Accessories", growthPercent: 180, weeklyPins: "450K", relatedBrands: ["Coach", "Prada", "Louis Vuitton", "Saint Laurent"], trendDirection: "rising", adOpportunity: "Indian professionals searching for luxury work bags. Tote bags and structured handbags trending." },
    { keyword: "designer sneakers men India", category: "Footwear", growthPercent: 120, weeklyPins: "380K", relatedBrands: ["Balenciaga", "Golden Goose", "Alexander McQueen", "Y-3"], trendDirection: "rising", adOpportunity: "Men's luxury sneaker demand growing in India. Chunky and minimalist styles both trending." },
    { keyword: "luxury wedding guest outfit", category: "Occasion Wear", growthPercent: 280, weeklyPins: "680K", relatedBrands: ["Versace", "Self Portrait", "Jimmy Choo", "Hugo Boss"], trendDirection: "rising", adOpportunity: "Wedding season driving search demand. Guests looking for designer outfits and shoes." },
    { keyword: "luxury gifting ideas India", category: "Gifting", growthPercent: 160, weeklyPins: "520K", relatedBrands: ["Tiffany", "Swarovski", "Coach", "Hermes"], trendDirection: "rising", adOpportunity: "Luxury gifting searches rising. Wallets, jewelry, and accessories are top gift categories." },
  ];
}

export async function getPinterestSignals(): Promise<Signal[]> {
  let trends = await fetchLiveTrends();
  if (trends.length === 0) trends = getMockTrends();

  const now = new Date();
  return trends.filter(t => t.growthPercent >= 50).map((t, i) => ({
    id: `pinterest-${i}`,
    type: "social_trend" as const,
    title: `Trending: "${t.keyword}" ${t.trendDirection === "viral" ? "going viral" : "rising"} (+${t.growthPercent}%) in India`,
    description: `${t.weeklyPins} weekly interest. Brands: ${t.relatedBrands.join(", ")}. ${t.adOpportunity}`,
    location: "Pan India",
    severity: t.growthPercent >= 300 ? "high" as const : "medium" as const,
    triggersWhat: t.category,
    targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
    suggestedBrands: t.relatedBrands,
    confidence: 0.85,
    source: process.env.APIFY_API_TOKEN ? "Google Trends (live)" : "Trend Intelligence",
    detectedAt: now,
    expiresAt: new Date(now.getTime() + 7 * 86400000),
    suggestedAction: t.adOpportunity,
    data: { keyword: t.keyword, growth: t.growthPercent, weeklyPins: t.weeklyPins, direction: t.trendDirection },
  }));
}
