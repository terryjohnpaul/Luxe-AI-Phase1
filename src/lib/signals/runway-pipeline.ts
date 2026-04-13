/**
 * Runway-to-Retail Pipeline — AUTO-DETECTED + Curated Fallback
 * Uses NewsAPI to detect trending runway/fashion week trends.
 * Falls back to curated runway trends from recent fashion weeks.
 */

import { Signal, signalId, expiresIn } from "./types";

interface RunwayTrend {
  trend: string;
  description: string;
  brandsMostLikely: string[];
  productCategories: string[];
  confidence: "high" | "medium";
}

// Curated fallback — recent runway trends hitting retail now
const CURATED_RUNWAY_TRENDS: RunwayTrend[] = [
  { trend: "Oversized Tailoring", description: "Wide-shouldered blazers and relaxed-fit suits dominated Milan FW25. The anti-skinny silhouette.", brandsMostLikely: ["Hugo Boss", "Emporio Armani", "Max Mara", "Versace"], productCategories: ["Blazers", "Suits", "Trousers"], confidence: "high" },
  { trend: "Burgundy Everything", description: "Burgundy was THE color of Milan FW25. Bottega, Ferragamo, Max Mara all showed head-to-toe burgundy.", brandsMostLikely: ["Max Mara", "Hugo Boss", "Versace", "Bottega Veneta"], productCategories: ["Coats", "Bags", "Shoes", "Suits"], confidence: "high" },
  { trend: "Utility Luxe", description: "Cargo pockets, parachute fabrics, military-inspired silhouettes elevated to luxury.", brandsMostLikely: ["Coach", "Michael Kors", "Diesel", "A-Cold-Wall"], productCategories: ["Jackets", "Bags", "Cargo Pants"], confidence: "medium" },
  { trend: "Sport Luxe 2.0", description: "Athletic silhouettes with luxury fabrication. Performance meets couture.", brandsMostLikely: ["Y-3", "Balenciaga", "Kenzo", "Diesel"], productCategories: ["Sneakers", "Track Pants", "Jackets"], confidence: "high" },
  { trend: "Sheer & Transparency", description: "Sheer layers, organza, mesh panels across Paris FW25.", brandsMostLikely: ["Dior", "Versace", "Self Portrait", "Jacquemus"], productCategories: ["Dresses", "Tops", "Evening Wear"], confidence: "medium" },
];

// Auto-detect runway trends from news
async function detectRunwayTrendsFromNews(): Promise<Signal[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const today = new Date();
  const signals: Signal[] = [];

  try {
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const queries = [
      "runway trend 2026 fashion",
      "fashion week trend spring summer",
      "luxury fashion trend India",
    ];

    const seenTrends = new Set<string>();

    for (const query of queries.slice(0, 2)) {
      const resp = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=5&from=${monthAgo}&apiKey=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }
      );

      if (!resp.ok) continue;
      const data = await resp.json();

      for (const article of (data.articles || [])) {
        const title = article.title || "";
        const desc = article.description || "";
        const text = (title + " " + desc).toLowerCase();

        // Skip negative/irrelevant
        if (text.includes("scandal") || text.includes("dies") || text.includes("arrest")) continue;

        // Must mention fashion/trend/runway
        if (!text.includes("trend") && !text.includes("runway") && !text.includes("fashion week")) continue;

        // Deduplicate by source
        const sourceKey = (article.source?.name || "").toLowerCase();
        if (seenTrends.has(sourceKey)) continue;
        seenTrends.add(sourceKey);

        signals.push({
          id: signalId("runway", `news-${signals.length}`),
          type: "runway",
          source: "NewsAPI (auto-detected)",
          title: `Runway Trend: ${title.slice(0, 65)}`,
          description: `${desc || title}. Source: ${article.source?.name || "Fashion News"}. Runway trends take 3-6 months to reach retail demand.`,
          location: "Global → India",
          severity: "medium",
          triggersWhat: "Runway-to-retail trend — prepare campaigns",
          targetArchetypes: ["Fashion Loyalist"],
          suggestedBrands: ["Hugo Boss", "Versace", "Max Mara", "Coach"],
          suggestedAction: `Fashion trend spotted in news: "${title.slice(0, 50)}". Monitor this trend — if it gains momentum, prepare ad campaigns.`,
          confidence: 0.7,
          expiresAt: expiresIn(336), // 14 days
          data: { article: title, source: article.source?.name, autoDetected: true },
          detectedAt: today,
        });
      }
    }
  } catch {
    // Fallback handled below
  }

  return signals.slice(0, 3); // Max 3 news-detected runway trends
}

export async function getRunwayPipelineSignals(): Promise<Signal[]> {
  const today = new Date();
  const signals: Signal[] = [];

  // Auto-detect from news
  const newsSignals = await detectRunwayTrendsFromNews();
  signals.push(...newsSignals);

  // Add curated trends (always show — these are proven runway-to-retail trends)
  for (const trend of CURATED_RUNWAY_TRENDS) {
    signals.push({
      id: signalId("runway", trend.trend.toLowerCase().replace(/\s+/g, "-")),
      type: "runway",
      source: "Runway Intelligence",
      title: `Runway-to-Retail: "${trend.trend}" — now hitting stores`,
      description: `${trend.description} Products: ${trend.productCategories.join(", ")}. Brands: ${trend.brandsMostLikely.join(", ")}.`,
      location: "Global → India",
      severity: trend.confidence === "high" ? "medium" as const : "low" as const,
      triggersWhat: `${trend.trend}: ${trend.productCategories.join(", ")}`,
      targetArchetypes: ["Fashion Loyalist"],
      suggestedBrands: trend.brandsMostLikely.slice(0, 4),
      suggestedAction: `"${trend.trend}" is in retail now. Run campaigns featuring ${trend.productCategories.join(", ")} from ${trend.brandsMostLikely.slice(0, 2).join(" and ")}.`,
      confidence: trend.confidence === "high" ? 0.8 : 0.65,
      expiresAt: expiresIn(720), // 30 days
      data: { trend: trend.trend, autoDetected: false },
      detectedAt: today,
    });
  }

  return signals;
}
