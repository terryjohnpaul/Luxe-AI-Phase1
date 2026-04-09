/**
 * Pinterest Trends Intelligence
 * Tracks trending luxury fashion items on Pinterest
 * In production: Pinterest API (developers.pinterest.com)
 */

import { Signal } from "./types";

export interface PinterestTrend {
  keyword: string;
  category: string;
  growthPercent: number;
  weeklyPins: string;
  relatedBrands: string[];
  trendDirection: "rising" | "stable" | "viral";
  adOpportunity: string;
}

export function getPinterestTrends(): PinterestTrend[] {
  return [
    {
      keyword: "quiet luxury outfit",
      category: "Style Aesthetic",
      growthPercent: 340,
      weeklyPins: "1.2M",
      relatedBrands: ["Max Mara", "Hugo Boss", "Sandro", "Maje"],
      trendDirection: "viral",
      adOpportunity: "Run 'Quiet Luxury' styled ads — minimal, editorial, no logos. Push Max Mara coats, Hugo Boss tailoring, Sandro knits.",
    },
    {
      keyword: "luxury work bag",
      category: "Accessories",
      growthPercent: 180,
      weeklyPins: "450K",
      relatedBrands: ["Coach", "Hugo Boss", "Michael Kors"],
      trendDirection: "rising",
      adOpportunity: "Target working professionals 25-40. Push Coach Tabby, Hugo Boss leather bags with 'desk to dinner' messaging.",
    },
    {
      keyword: "designer sneakers men",
      category: "Footwear",
      growthPercent: 120,
      weeklyPins: "380K",
      relatedBrands: ["Hugo Boss", "Armani Exchange", "Diesel", "Y-3"],
      trendDirection: "rising",
      adOpportunity: "Men's luxury sneakers are trending. Run product-focused ads on Instagram Reels showing lifestyle shots.",
    },
    {
      keyword: "luxury beach vacation outfit",
      category: "Resort Wear",
      growthPercent: 250,
      weeklyPins: "680K",
      relatedBrands: ["Versace", "Hugo Boss", "Diesel", "Armani Exchange"],
      trendDirection: "rising",
      adOpportunity: "Summer travel planning season. Run resort wear collection ads targeting people searching for vacation outfits.",
    },
    {
      keyword: "old money aesthetic",
      category: "Style Aesthetic",
      growthPercent: 420,
      weeklyPins: "2.1M",
      relatedBrands: ["Hugo Boss", "Max Mara", "Lacoste", "Armani Exchange"],
      trendDirection: "viral",
      adOpportunity: "Massive search trend. Run 'Old Money' styled campaign — polo shirts, blazers, minimal accessories. Target 20-35 aspirational audience.",
    },
    {
      keyword: "luxury gifting ideas",
      category: "Gifting",
      growthPercent: 160,
      weeklyPins: "520K",
      relatedBrands: ["Coach", "Hugo Boss", "Marc Jacobs", "Jimmy Choo"],
      trendDirection: "rising",
      adOpportunity: "People actively planning luxury gifts. Run gift guide campaigns with price ranges and 'free gift wrapping' messaging.",
    },
  ];
}

export function getPinterestSignals(): Signal[] {
  const trends = getPinterestTrends();
  const now = new Date();
  return trends.filter(t => t.growthPercent >= 150).map((t, i) => ({
    id: `pinterest-${i}`,
    type: "social_trend" as const,
    title: `Pinterest: "${t.keyword}" ${t.trendDirection === "viral" ? "going viral" : "trending"} (+${t.growthPercent}%)`,
    description: `${t.weeklyPins} weekly pins. Related brands: ${t.relatedBrands.join(", ")}. ${t.adOpportunity}`,
    location: "Pan India",
    severity: t.growthPercent >= 300 ? "high" as const : "medium" as const,
    triggersWhat: t.category,
    targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
    suggestedBrands: t.relatedBrands,
    confidence: 0.85,
    source: "Pinterest Trends",
    detectedAt: now,
    expiresAt: new Date(now.getTime() + 7 * 86400000),
    suggestedAction: t.adOpportunity,
    data: { keyword: t.keyword, growth: t.growthPercent, weeklyPins: t.weeklyPins, direction: t.trendDirection },
  }));
}
