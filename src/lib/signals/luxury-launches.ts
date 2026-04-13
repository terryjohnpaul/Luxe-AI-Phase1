/**
 * Luxury New Launch Calendar — AUTO-DETECTED + Calendar Fallback
 * Uses NewsAPI to auto-detect new collection/product launches.
 * Falls back to known seasonal launch calendar.
 */

import { Signal, signalId, expiresIn } from "./types";

// Brands to monitor for launch announcements
const BRANDS_TO_MONITOR = [
  "Hugo Boss", "Coach", "Versace", "Gucci", "Louis Vuitton",
  "Dior", "Prada", "Burberry", "Diesel", "Jimmy Choo",
  "Max Mara", "Michael Kors", "Balenciaga", "Kenzo", "Swarovski",
];

// Known seasonal launches (fallback)
interface ScheduledLaunch {
  brand: string;
  collection: string;
  launchDate2026: string;
  description: string;
  adAngle: string;
}

const SCHEDULED_LAUNCHES_2026: ScheduledLaunch[] = [
  { brand: "Hugo Boss", collection: "BOSS SS26", launchDate2026: "2026-03-01", description: "Spring/Summer 2026. New linens, summer suits, lightweight polos.", adAngle: "New season, new wardrobe. BOSS SS26 is here." },
  { brand: "Coach", collection: "Coach Spring 2026", launchDate2026: "2026-02-15", description: "Coach Spring with new Tabby colorways.", adAngle: "New colors, same icon." },
  { brand: "Versace", collection: "Versace SS26", launchDate2026: "2026-03-15", description: "Medusa redesign and bold Mediterranean prints.", adAngle: "Versace reinvents the Medusa." },
  { brand: "Diesel", collection: "Diesel SS26 Denim", launchDate2026: "2026-04-01", description: "Sustainable denim with new washes and fits.", adAngle: "Diesel reinvents denim. Again." },
  { brand: "Jimmy Choo", collection: "Jimmy Choo Bridal 2026", launchDate2026: "2026-03-20", description: "Bridal collection — wedding shoes, evening bags.", adAngle: "Walk the aisle in Jimmy Choo." },
  { brand: "Gucci", collection: "Gucci SS26", launchDate2026: "2026-05-01", description: "Gucci's Ancora identity under Sabato De Sarno.", adAngle: "The new era of Gucci." },
  { brand: "Louis Vuitton", collection: "LV Men's SS26", launchDate2026: "2026-04-15", description: "Pharrell Williams' vision for LV men.", adAngle: "Pharrell x LV." },
  { brand: "Burberry", collection: "Burberry SS26", launchDate2026: "2026-03-10", description: "Burberry brand reset continues.", adAngle: "Burberry reimagined." },
  { brand: "Swarovski", collection: "Swarovski Diwali Edit", launchDate2026: "2026-10-15", description: "India-exclusive Diwali gifting collection.", adAngle: "Diwali sparkle by Swarovski." },
];

// Auto-detect launches from NewsAPI
async function detectLaunchesFromNews(): Promise<Signal[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const today = new Date();
  const signals: Signal[] = [];

  try {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    // Search for launch-related keywords across luxury brands
    for (const brand of BRANDS_TO_MONITOR.slice(0, 5)) {
      const query = `"${brand}" AND (launch OR "new collection" OR "drops" OR "unveils" OR "introduces")`;
      const resp = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=3&from=${weekAgo}&apiKey=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }
      );

      if (!resp.ok) continue;
      const data = await resp.json();
      const articles = data.articles || [];
      if (articles.length === 0) continue;

      // Check if any article is actually about a fashion product/collection launch
      const launchArticle = articles.find((a: any) => {
        const text = ((a.title || "") + " " + (a.description || "")).toLowerCase();
        const hasLaunchKeyword = text.includes("launch") || text.includes("collection") || text.includes("unveil") || text.includes("introduce");
        const hasFashionContext = text.includes("fashion") || text.includes("collection") || text.includes("wear") || text.includes("bag") || text.includes("shoe") || text.includes("style") || text.includes("design") || text.includes("luxury") || text.includes("brand");
        // Exclude non-fashion: music, sports, politics, tech
        const isIrrelevant = text.includes("diss track") || text.includes("album") || text.includes("squad") || text.includes("match") || text.includes("election") || text.includes("software") || text.includes("app launch") || text.includes("startup");
        return hasLaunchKeyword && hasFashionContext && !isIrrelevant;
      });

      if (launchArticle) {
        const title = launchArticle.title || "";
        signals.push({
          id: signalId("launch", `news-${brand.toLowerCase().replace(/\s+/g, "-")}`),
          type: "launch",
          source: "NewsAPI (auto-detected)",
          title: `${brand} new launch detected — "${title.slice(0, 60)}"`,
          description: `${launchArticle.description || title}. Source: ${launchArticle.source?.name || "News"}. Launch week = peak search window. Paid ads during launch get 2-3x ROAS.`,
          location: "Global → India",
          severity: "high",
          triggersWhat: `New launch from ${brand}. Launch week campaigns.`,
          targetArchetypes: ["Fashion Loyalist", "Early Adopter"],
          suggestedBrands: [brand],
          suggestedAction: `${brand} just launched something new. This is the highest-ROAS window — organic search is peaking. Run paid campaigns NOW.`,
          confidence: 0.8,
          expiresAt: expiresIn(168), // 7 days
          data: { brand, article: title, source: launchArticle.source?.name, autoDetected: true },
          detectedAt: today,
        });
      }
    }
  } catch {
    // Fallback handled below
  }

  return signals;
}

export async function getLuxuryLaunchSignals(): Promise<Signal[]> {
  const today = new Date();
  const signals: Signal[] = [];

  // Auto-detect from news
  const newsLaunches = await detectLaunchesFromNews();
  signals.push(...newsLaunches);

  // Add scheduled launches (calendar fallback)
  const IST_MS = 5.5 * 3600000;
  const todayIST = new Date(today.getTime() + IST_MS);
  const todayDateIST = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate());

  const newsDetectedBrands = new Set(newsLaunches.map(s => s.suggestedBrands[0]?.toLowerCase()));

  for (const launch of SCHEDULED_LAUNCHES_2026) {
    // Skip if already detected from news for this brand
    if (newsDetectedBrands.has(launch.brand.toLowerCase())) continue;

    const launchDate = new Date(launch.launchDate2026);
    const launchClean = new Date(launchDate.getFullYear(), launchDate.getMonth(), launchDate.getDate());
    const daysUntil = Math.round((launchClean.getTime() - todayDateIST.getTime()) / 86400000);

    if (daysUntil > -7 && daysUntil <= 14) {
      const isLaunched = daysUntil <= 0;
      signals.push({
        id: signalId("launch", `${launch.brand}-${launch.collection}`.toLowerCase().replace(/\s+/g, "-")),
        type: "launch",
        source: "Launch Calendar",
        title: isLaunched
          ? `${launch.brand}: ${launch.collection} just launched — peak search window`
          : `${launch.brand}: ${launch.collection} drops in ${daysUntil} days`,
        description: `${launch.description} ${launch.adAngle}`,
        location: "Global → India",
        severity: isLaunched ? "high" as const : "medium" as const,
        triggersWhat: `New launch: ${launch.collection}`,
        targetArchetypes: ["Fashion Loyalist", "Early Adopter"],
        suggestedBrands: [launch.brand],
        suggestedAction: isLaunched
          ? `${launch.collection} is LIVE. Run paid campaigns NOW to ride launch momentum.`
          : `${launch.collection} drops in ${daysUntil} days. Prepare teaser campaigns.`,
        confidence: 0.85,
        expiresAt: new Date(launchClean.getTime() + 14 * 86400000),
        data: { brand: launch.brand, collection: launch.collection, daysUntil, autoDetected: false },
        detectedAt: today,
      });
    }
  }

  return signals;
}
