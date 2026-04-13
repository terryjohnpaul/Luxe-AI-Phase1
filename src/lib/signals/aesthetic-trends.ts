/**
 * Color & Aesthetic Trend Signals — AUTO-DETECTED
 * Uses Google Trends (via Apify) to auto-classify aesthetic trend status.
 * Fallback: curated data with manual status.
 */

import { Signal, signalId, expiresIn } from "./types";
import { scrapeGoogleTrends } from "@/lib/integrations/apify";
import { cachedApifyCall } from "@/lib/apify-cache";

interface AestheticTrend {
  name: string;
  searchTerms: string[];
  status: "emerging" | "growing" | "peaking" | "stable" | "declining";
  description: string;
  brandFit: string[];
  creativeDirection: string;
  targetAudience: string;
  colorPalette?: string[];
}

// Aesthetic keywords to track — status will be AUTO-DETECTED from Google Trends
const AESTHETICS: AestheticTrend[] = [
  { name: "Quiet Luxury", searchTerms: ["quiet luxury outfit", "quiet luxury fashion"], status: "peaking", description: "No logos, premium fabrics, understated elegance. The Row, Loro Piana energy.", brandFit: ["Max Mara", "Bottega Veneta", "The Row", "Loro Piana", "Hugo Boss"], creativeDirection: "Minimal set, natural light, no text overlay, close-up on fabric texture.", targetAudience: "Women 28-50, HNI, professionals", colorPalette: ["camel", "cream", "navy", "charcoal"] },
  { name: "Mob Wife Aesthetic", searchTerms: ["mob wife aesthetic", "mob wife fashion"], status: "growing", description: "Leopard print, fur, bold gold jewelry, dramatic red lips. Dolce & Gabbana energy.", brandFit: ["Versace", "Roberto Cavalli", "Dolce & Gabbana", "Tom Ford"], creativeDirection: "Bold, dramatic styling. Leopard patterns, gold accessories, high-glam.", targetAudience: "Women 22-40, fashion-forward", colorPalette: ["leopard", "black", "gold", "red"] },
  { name: "Coquette / Bow Era", searchTerms: ["coquette aesthetic", "bow fashion trend"], status: "growing", description: "Ribbons, bows, soft pink, ballerina-inspired. Miu Miu energy. Gen Z feminine luxury.", brandFit: ["Miu Miu", "Self Portrait", "Sandro", "Jacquemus", "Jimmy Choo"], creativeDirection: "Soft, feminine, pastel tones. Ribbon details, ballet flats, romantic lighting.", targetAudience: "Women 18-30, Gen Z", colorPalette: ["baby pink", "lavender", "cream"] },
  { name: "Coastal Grandmother", searchTerms: ["coastal grandmother style", "coastal grandmother outfit"], status: "stable", description: "Linen, white, beige, Nantucket vibes. Nancy Meyers movie energy.", brandFit: ["Max Mara", "Zimmermann", "Loro Piana", "Ralph Lauren", "Farm Rio"], creativeDirection: "Beach/resort setting, natural fabrics, wide-brim hats, linen.", targetAudience: "Women 30-55, travel lifestyle", colorPalette: ["white", "linen", "sand", "seafoam"] },
  { name: "Old Money", searchTerms: ["old money aesthetic", "old money fashion"], status: "peaking", description: "Inherited wealth look. Blazers, loafers, polo shirts. Ralph Lauren/Brunello Cucinelli energy.", brandFit: ["Ralph Lauren", "Hugo Boss", "Burberry", "Lacoste", "Max Mara"], creativeDirection: "Country club, yacht setting. Classic tailoring, heritage.", targetAudience: "Men & Women 25-45, aspirational", colorPalette: ["navy", "forest green", "burgundy", "cream"] },
  { name: "Streetwear Luxury", searchTerms: ["street luxury fashion", "luxury streetwear"], status: "stable", description: "High fashion meets street culture. Chunky sneakers, graphic tees, oversized.", brandFit: ["Balenciaga", "Off-White", "Diesel", "Kenzo", "A-Cold-Wall", "Y-3"], creativeDirection: "Urban environment, edgy styling, sneaker focus.", targetAudience: "Men & Women 18-32, Gen Z", colorPalette: ["black", "white", "neon"] },
  { name: "Indian Maximalism", searchTerms: ["indian luxury fashion", "fusion fashion India"], status: "emerging", description: "Fusion of Indian craftsmanship with international luxury. Mirror work meets minimalism.", brandFit: ["Sabyasachi", "Tarun Tahiliani", "Versace", "Roberto Cavalli", "Ami Paris"], creativeDirection: "Rich Indian textiles + clean luxury silhouettes. Gold + earth tones.", targetAudience: "Women 25-45, India's luxury buyer", colorPalette: ["gold", "deep red", "emerald", "ivory"] },
  { name: "Tomato Girl", searchTerms: ["tomato girl aesthetic", "tomato girl fashion"], status: "growing", description: "Mediterranean summer — red, terracotta, linen, Italian Riviera energy.", brandFit: ["Farm Rio", "Zimmermann", "Jacquemus", "Versace"], creativeDirection: "Italian village, sun-drenched, fresh tomatoes, linen dresses.", targetAudience: "Women 20-35", colorPalette: ["tomato red", "terracotta", "white", "olive green"] },
  { name: "Dark Academia", searchTerms: ["dark academia fashion", "dark academia outfit"], status: "stable", description: "Scholarly elegance — tweed, oxford shoes, dark tones, literary vibes.", brandFit: ["Hugo Boss", "Burberry", "Ralph Lauren", "Paul Smith"], creativeDirection: "Library, university, candlelit setting. Structured silhouettes.", targetAudience: "Men & Women 18-30", colorPalette: ["brown", "burgundy", "forest green", "black"] },
];

// Seasonal color trends (these are runway-derived, updated per season)
const SEASONAL_COLORS = [
  { color: "Butter Yellow", season: "SS26", hexCode: "#F5E6A0", brandFit: ["Max Mara", "Jacquemus", "Zimmermann"], adAngle: "The color of summer 2026. Butter yellow is everywhere on the runways." },
  { color: "Cherry Red", season: "SS26", hexCode: "#9B111E", brandFit: ["Versace", "Valentino", "Self Portrait"], adAngle: "Bold cherry red from Milan to Mumbai. Statement color for confident dressing." },
  { color: "Espresso Brown", season: "FW26", hexCode: "#3C1414", brandFit: ["Max Mara", "Bottega Veneta", "Hugo Boss"], adAngle: "The new neutral. Espresso brown replaces black for Fall/Winter 2026." },
  { color: "Burgundy", season: "FW26", hexCode: "#800020", brandFit: ["Hugo Boss", "Emporio Armani", "Versace"], adAngle: "Pantone's luxury pick. Burgundy is the power color for AW26." },
];

/**
 * Auto-detect aesthetic status from Google Trends.
 * Growth >100% = emerging, >50% = growing, >20% = peaking, >-20% = stable, else declining.
 */
async function autoDetectAestheticStatus(): Promise<Record<string, string>> {
  if (!process.env.APIFY_API_TOKEN) return {};

  try {
    const keywords = AESTHETICS.slice(0, 5).map(a => a.searchTerms[0]);
    const { data: result } = await cachedApifyCall("aesthetic-trends", () =>
      scrapeGoogleTrends(keywords, "IN")
    );
    if (!result.success) return {};

    const statuses: Record<string, string> = {};
    for (const item of result.data) {
      const keyword = (item.searchTerm || item.keyword || "").toLowerCase();
      const interest = item.interestOverTime || item.timelineData || [];
      const values = Array.isArray(interest) ? interest.map((p: any) => p.value || p.values?.[0] || 0) : [];

      // Compare recent 7 days vs prior 7 days
      const recent = values.slice(-7);
      const older = values.slice(-14, -7);
      const recentAvg = recent.length > 0 ? recent.reduce((a: number, b: number) => a + b, 0) / recent.length : 0;
      const olderAvg = older.length > 0 ? older.reduce((a: number, b: number) => a + b, 0) / older.length : 1;
      const growth = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

      // Also check absolute level — high absolute = peaking, low = emerging
      const absLevel = recentAvg;

      let status: string;
      if (growth > 100) status = "emerging";
      else if (growth > 40) status = "growing";
      else if (growth > -10 && absLevel > 50) status = "peaking";
      else if (growth > -20) status = "stable";
      else status = "declining";

      // Match keyword to aesthetic
      const aesthetic = AESTHETICS.find(a => a.searchTerms.some(t => keyword.includes(t.split(" ")[0])));
      if (aesthetic) statuses[aesthetic.name] = status;
    }

    return statuses;
  } catch {
    return {};
  }
}

export async function getAestheticTrendSignals(): Promise<Signal[]> {
  const liveStatuses = await autoDetectAestheticStatus();
  const today = new Date();
  const month = today.getMonth();
  const signals: Signal[] = [];

  for (const trend of AESTHETICS) {
    // Use live status if available, otherwise fallback to curated
    const status = (liveStatuses[trend.name] || trend.status) as AestheticTrend["status"];
    if (status === "declining") continue;

    const isLive = !!liveStatuses[trend.name];
    const severity = status === "emerging" ? "high" as const
      : status === "growing" ? "high" as const
      : "medium" as const;

    signals.push({
      id: signalId("aesthetic", trend.name.toLowerCase().replace(/\s+/g, "-")),
      type: "aesthetic",
      source: isLive ? "Google Trends (auto-detected)" : "Aesthetic Intelligence",
      title: `"${trend.name}" aesthetic is ${status} — ${trend.description.split(".")[0]}`,
      description: `${trend.description} Creative: ${trend.creativeDirection}. Colors: ${trend.colorPalette?.join(", ") || "varies"}. Target: ${trend.targetAudience}.`,
      location: "India + Global",
      severity,
      triggersWhat: `Aesthetic: ${trend.name}. Creative: ${trend.creativeDirection}`,
      targetArchetypes: [trend.targetAudience.split(",")[0]],
      suggestedBrands: trend.brandFit.slice(0, 4),
      suggestedAction: `Run "${trend.name}" themed campaigns. Use ${trend.colorPalette?.slice(0, 3).join(", ")} color palette. ${trend.creativeDirection}`,
      confidence: isLive ? 0.85 : 0.75,
      expiresAt: expiresIn(336),
      data: { aesthetic: trend.name, status, autoDetected: isLive, colors: trend.colorPalette },
      detectedAt: today,
    });
  }

  // Seasonal colors
  const currentSeason = month >= 2 && month <= 7 ? "SS26" : "FW26";
  for (const color of SEASONAL_COLORS.filter(c => c.season === currentSeason)) {
    signals.push({
      id: signalId("color", color.color.toLowerCase().replace(/\s+/g, "-")),
      type: "aesthetic",
      source: "Runway Color Intelligence",
      title: `${color.color} is THE color of ${color.season} — use in ad creatives`,
      description: `${color.adAngle} Brands: ${color.brandFit.join(", ")}.`,
      location: "Global → India",
      severity: "medium",
      triggersWhat: `Color: ${color.color} (${color.hexCode}). Season: ${color.season}.`,
      targetArchetypes: ["Fashion Loyalist"],
      suggestedBrands: color.brandFit,
      suggestedAction: `Use ${color.color} (${color.hexCode}) in ad creatives. ${color.adAngle}`,
      confidence: 0.85,
      expiresAt: expiresIn(720),
      data: { color: color.color, hex: color.hexCode, season: color.season },
      detectedAt: today,
    });
  }

  return signals;
}
