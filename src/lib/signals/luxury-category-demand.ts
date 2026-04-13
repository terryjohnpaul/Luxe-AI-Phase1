/**
 * Luxury Category Demand Signals
 * Tracks which CATEGORY is growing in India — bags vs shoes vs watches vs clothing.
 * Helps advertisers decide WHERE to allocate budget across product categories.
 * Source: Google Trends comparison (via Apify) + seasonal patterns
 */

import { Signal, signalId, expiresIn } from "./types";
import { cachedApifyCall } from "@/lib/apify-cache";
import { scrapeGoogleTrends } from "@/lib/integrations/apify";

interface CategoryTrend {
  category: string;
  searchTerm: string;
  currentDemand: "surging" | "growing" | "stable" | "declining";
  relevantBrands: string[];
  seasonalNote: string;
}

const LUXURY_CATEGORIES: CategoryTrend[] = [
  { category: "Luxury Bags", searchTerm: "designer bags India", currentDemand: "growing", relevantBrands: ["Louis Vuitton", "Gucci", "Coach", "Prada", "Bottega Veneta"], seasonalNote: "Bags are India's #1 luxury category. Peaks during gifting seasons." },
  { category: "Luxury Shoes", searchTerm: "designer shoes India", currentDemand: "stable", relevantBrands: ["Jimmy Choo", "Balenciaga", "Alexander McQueen", "Golden Goose"], seasonalNote: "Shoes peak during wedding season and festivals." },
  { category: "Luxury Watches", searchTerm: "luxury watches India", currentDemand: "growing", relevantBrands: ["Tissot", "Michael Kors", "Emporio Armani", "Hugo Boss"], seasonalNote: "Watches are the #1 luxury gift category for men. Peaks Father's Day, Diwali." },
  { category: "Luxury Clothing", searchTerm: "designer clothing India", currentDemand: "stable", relevantBrands: ["Hugo Boss", "Versace", "Max Mara", "Kenzo", "Diesel"], seasonalNote: "Clothing peaks during wedding season and new season launches (SS/FW)." },
  { category: "Luxury Sunglasses", searchTerm: "designer sunglasses India", currentDemand: "surging", relevantBrands: ["Ray-Ban", "Versace", "Prada", "Gucci", "Dior"], seasonalNote: "Sunglasses surge March-July (summer). India's fastest-growing luxury accessory." },
  { category: "Luxury Jewelry", searchTerm: "designer jewelry India", currentDemand: "growing", relevantBrands: ["Swarovski", "Tiffany", "Bvlgari", "Cartier"], seasonalNote: "Jewelry = gifting. Peaks Valentine's, Karwa Chauth, Diwali, weddings." },
  { category: "Luxury Fragrances", searchTerm: "luxury perfume India", currentDemand: "surging", relevantBrands: ["Dior", "Chanel", "Tom Ford", "Prada", "Versace"], seasonalNote: "India's luxury fragrance market growing 25%+ YoY. Massive gifting category." },
];

async function fetchLiveCategoryTrends(): Promise<Record<string, number>> {
  if (!process.env.APIFY_API_TOKEN) return {};

  try {
    const { data: result } = await cachedApifyCall("category-demand", () =>
      scrapeGoogleTrends(LUXURY_CATEGORIES.slice(0, 4).map(c => c.searchTerm), "IN")
    );
    if (!result.success) return {};

    const trends: Record<string, number> = {};
    for (const item of result.data) {
      const keyword = item.searchTerm || item.keyword || "";
      const interest = item.interestOverTime || item.timelineData || [];
      const values = Array.isArray(interest) ? interest.map((p: any) => p.value || p.values?.[0] || 0) : [];
      const recent = values.slice(-7);
      const older = values.slice(-14, -7);
      const recentAvg = recent.length > 0 ? recent.reduce((a: number, b: number) => a + b, 0) / recent.length : 0;
      const olderAvg = older.length > 0 ? older.reduce((a: number, b: number) => a + b, 0) / older.length : 1;
      const growth = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
      trends[keyword] = growth;
    }
    return trends;
  } catch {
    return {};
  }
}

export async function getLuxuryCategorySignals(): Promise<Signal[]> {
  const liveTrends = await fetchLiveCategoryTrends();
  const today = new Date();
  const month = today.getMonth(); // 0-based
  const signals: Signal[] = [];

  for (const cat of LUXURY_CATEGORIES) {
    const liveGrowth = liveTrends[cat.searchTerm];
    const demand = liveGrowth !== undefined
      ? (liveGrowth > 50 ? "surging" : liveGrowth > 20 ? "growing" : liveGrowth > -10 ? "stable" : "declining")
      : cat.currentDemand;

    // Only signal if surging or growing
    if (demand === "surging" || demand === "growing") {
      const severity = demand === "surging" ? "high" as const : "medium" as const;
      const growthStr = liveGrowth !== undefined ? `+${liveGrowth}% this week` : demand;

      signals.push({
        id: signalId("category", cat.category.toLowerCase().replace(/\s+/g, "-")),
        type: "category_demand",
        source: liveGrowth !== undefined ? "Google Trends (live)" : "Category Intelligence",
        title: `${cat.category} demand ${demand} in India (${growthStr})`,
        description: `${cat.seasonalNote} Top brands: ${cat.relevantBrands.join(", ")}. Allocate more ad budget to ${cat.category.toLowerCase()} campaigns.`,
        location: "India",
        severity,
        triggersWhat: cat.category,
        targetArchetypes: ["Fashion Loyalist", "Occasional Splurger"],
        suggestedBrands: cat.relevantBrands.slice(0, 4),
        suggestedAction: `${cat.category} demand is ${demand} in India. Increase budget allocation for ${cat.category.toLowerCase()} campaigns. Push ${cat.relevantBrands.slice(0, 2).join(" and ")}.`,
        confidence: liveGrowth !== undefined ? 0.9 : 0.75,
        expiresAt: expiresIn(168), // 7 days
        data: { category: cat.category, demand, growth: liveGrowth },
        detectedAt: today,
      });
    }
  }

  return signals;
}
