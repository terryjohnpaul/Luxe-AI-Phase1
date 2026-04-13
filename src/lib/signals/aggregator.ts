/**
 * Signal Aggregator — Combines ALL signal sources into a unified, ranked feed
 *
 * This is the brain that pulls from every source, deduplicates,
 * ranks by priority, and outputs the final signal feed for the Command Center.
 *
 * Sources: 11 categories, 87+ signals
 * Cost: FREE (all sources are free or date-based)
 */

import type { Signal } from "./types";
import { getFestivalSignals } from "./festivals";
import { getSalaryCycleSignals } from "./salary-cycle";
import { getStockMarketSignals } from "./stock-market";
import { getCricketSignals } from "./cricket";
import { getEntertainmentSignals } from "./entertainment";
import { getAuspiciousDaySignals } from "./auspicious-days";
import { getNewsCelebritySignals } from "./news-celebrity";
import { getGiftOccasionSignals } from "./gift-occasions";
import { getSaleEventSignals } from "./sale-events";
import { getOccasionDressingSignals } from "./occasion-dressing";
import { getWeatherSignals } from "./weather-realtime";
import { getTravelEventSignals } from "./travel-events";
import { getCelebritySignals } from "./celebrity-moments";
import { getPinterestSignals } from "./pinterest-trends";
import { getLystSignals } from "./lyst-trending";
import { getCompetitorPricingSignals } from "./competitor-pricing";
import { getInstagramHashtagSignals } from "./instagram-hashtags";
import { getSmartRecommendationSignals } from "./smart-recommendations";
import { getFashionEventSignals } from "./fashion-events";
import { getWeddingIntensitySignals } from "./wedding-intensity";
import { getLuxuryCategorySignals } from "./luxury-category-demand";
import { getAestheticTrendSignals } from "./aesthetic-trends";
import { getRunwayPipelineSignals } from "./runway-pipeline";
import { getLuxuryLaunchSignals } from "./luxury-launches";
import { getEconomicSentimentSignals } from "./economic-sentiment";

// Severity ranking for sorting
const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Fetch all signals from all sources
 * Handles errors gracefully — if one source fails, others still work
 */
export async function getAllSignals(): Promise<Signal[]> {
  const results = await Promise.allSettled([
    // Calendar-based (always work, no API needed)
    Promise.resolve(getFestivalSignals()),
    Promise.resolve(getSalaryCycleSignals()),
    Promise.resolve(getAuspiciousDaySignals()),
    Promise.resolve(getTravelEventSignals()),
    Promise.resolve(getGiftOccasionSignals()),     // NEW: gift occasions (Valentine's, Rakhi, Diwali gifting)
    Promise.resolve(getSaleEventSignals()),          // NEW: Ajio Luxe sale events (EOSS, brand sales)
    getCelebritySignals(),                           // async — tries NewsAPI, falls back to curated

    // API-based signals
    getWeatherSignals(),
    getCricketSignals(),                             // filtered: IPL + India matches only
    // getNewsCelebritySignals() — REMOVED: duplicates getCelebritySignals() above (both use NewsAPI)

    // Trend & Competitive Intelligence (Apify + DataForSEO)
    getPinterestSignals(),
    getLystSignals(),
    getCompetitorPricingSignals(),
    getInstagramHashtagSignals(),
    getOccasionDressingSignals(),                    // NEW: occasion dressing (interview, date, party, vacation)

    // Smart Recommendations (city targeting)
    Promise.resolve(getSmartRecommendationSignals()),

    // NEW: Luxury F&L industry-wide signals
    Promise.resolve(getFashionEventSignals()),
    Promise.resolve(getWeddingIntensitySignals()),
    getLuxuryCategorySignals(),                          // async — uses Apify (24h cache)
    Promise.resolve(getAestheticTrendSignals()),
    Promise.resolve(getRunwayPipelineSignals()),
    Promise.resolve(getLuxuryLaunchSignals()),
    Promise.resolve(getEconomicSentimentSignals()),
  ]);

  const allSignals: Signal[] = [];
  const sourceStatus: Record<string, string> = {};

  const sourceNames = [
    "festivals", "salary-cycle", "auspicious-days", "travel-events", "gift-occasions", "sale-events", "celebrity-moments",
    "weather", "cricket",
    "pinterest-trends", "lyst-trending", "competitor-pricing", "instagram-hashtags", "occasion-dressing",
    "smart-recommendations",
    "fashion-events", "wedding-intensity", "category-demand", "aesthetic-trends", "runway-pipeline", "luxury-launches", "economic-sentiment",
  ];

  results.forEach((result, index) => {
    const source = sourceNames[index];
    if (result.status === "fulfilled") {
      const signals = result.value;
      allSignals.push(...signals);
      sourceStatus[source] = `OK (${signals.length} signals)`;
    } else {
      sourceStatus[source] = `FAILED: ${result.reason?.message || "Unknown error"}`;
      console.error(`[Aggregator] ${source} failed:`, result.reason);
    }
  });

  // Log summary
  console.log(`[Aggregator] Signal collection complete:`);
  for (const [source, status] of Object.entries(sourceStatus)) {
    console.log(`  ${source}: ${status}`);
  }
  console.log(`  TOTAL: ${allSignals.length} signals from ${Object.keys(sourceStatus).length} sources`);

  // Deduplicate (by ID)
  const seen = new Set<string>();
  const deduped = allSignals.filter(signal => {
    if (seen.has(signal.id)) return false;
    seen.add(signal.id);
    return true;
  });

  // Remove expired signals
  const now = new Date();
  const active = deduped.filter(signal => signal.expiresAt > now);

  // Sort by severity (critical first), then by confidence (highest first)
  active.sort((a, b) => {
    const severityDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.confidence - a.confidence;
  });

  return active;
}

/**
 * Get signals filtered by category
 */
export async function getSignalsByCategory(category: string): Promise<Signal[]> {
  const all = await getAllSignals();
  if (category === "all") return all;
  return all.filter(s => s.type === category);
}

/**
 * Get only critical and high-severity signals
 */
export async function getUrgentSignals(): Promise<Signal[]> {
  const all = await getAllSignals();
  return all.filter(s => s.severity === "critical" || s.severity === "high");
}

/**
 * Get signal source health status
 */
export function getSignalSourceStatus(): Record<string, { enabled: boolean; needsKey: boolean; keyName: string }> {
  return {
    festivals: { enabled: true, needsKey: false, keyName: "" },
    "salary-cycle": { enabled: true, needsKey: false, keyName: "" },
    "auspicious-days": { enabled: true, needsKey: false, keyName: "" },
    "travel-events": { enabled: true, needsKey: false, keyName: "" },
    "gift-occasions": { enabled: true, needsKey: false, keyName: "" },
    "sale-events": { enabled: true, needsKey: false, keyName: "" },
    "celebrity-moments": { enabled: true, needsKey: false, keyName: "" },
    weather: { enabled: !!process.env.WEATHER_API_KEY, needsKey: true, keyName: "WEATHER_API_KEY" },
    cricket: { enabled: !!process.env.CRICKET_API_KEY, needsKey: true, keyName: "CRICKET_API_KEY" },
    "pinterest-trends": { enabled: !!process.env.APIFY_API_TOKEN, needsKey: true, keyName: "APIFY_API_TOKEN" },
    "lyst-trending": { enabled: !!process.env.DATAFORSEO_LOGIN, needsKey: true, keyName: "DATAFORSEO_LOGIN" },
    "competitor-pricing": { enabled: !!process.env.DATAFORSEO_LOGIN, needsKey: true, keyName: "DATAFORSEO_LOGIN" },
    "instagram-hashtags": { enabled: !!process.env.APIFY_API_TOKEN, needsKey: true, keyName: "APIFY_API_TOKEN" },
    "occasion-dressing": { enabled: true, needsKey: false, keyName: "" },
    "smart-recommendations": { enabled: true, needsKey: false, keyName: "" },
    "fashion-events": { enabled: true, needsKey: false, keyName: "" },
    "wedding-intensity": { enabled: true, needsKey: false, keyName: "" },
    "category-demand": { enabled: true, needsKey: false, keyName: "" },
    "aesthetic-trends": { enabled: true, needsKey: false, keyName: "" },
    "runway-pipeline": { enabled: true, needsKey: false, keyName: "" },
    "luxury-launches": { enabled: true, needsKey: false, keyName: "" },
    "economic-sentiment": { enabled: true, needsKey: false, keyName: "" },
  };
}

/**
 * Get summary stats for the Command Center
 */
export async function getSignalSummary() {
  const signals = await getAllSignals();

  return {
    total: signals.length,
    bySeverity: {
      critical: signals.filter(s => s.severity === "critical").length,
      high: signals.filter(s => s.severity === "high").length,
      medium: signals.filter(s => s.severity === "medium").length,
      low: signals.filter(s => s.severity === "low").length,
    },
    byCategory: signals.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    sources: getSignalSourceStatus(),
  };
}
