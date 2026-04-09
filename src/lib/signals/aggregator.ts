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
import { getExamResultSignals } from "./exam-results";
import { getNewsCelebritySignals } from "./news-celebrity";
import { getWeatherSignals } from "./weather-realtime";
import { getTravelEventSignals } from "./travel-events";
import { getCelebritySignals } from "./celebrity-moments";
import { getPinterestSignals } from "./pinterest-trends";
import { getLystSignals } from "./lyst-trending";
import { getCompetitorPricingSignals } from "./competitor-pricing";
import { getInstagramHashtagSignals } from "./instagram-hashtags";
import { getSmartRecommendationSignals } from "./smart-recommendations";

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
    // FREE — date-based (always work, no API needed)
    Promise.resolve(getFestivalSignals()),
    Promise.resolve(getSalaryCycleSignals()),
    Promise.resolve(getAuspiciousDaySignals()),
    Promise.resolve(getExamResultSignals()),
    Promise.resolve(getTravelEventSignals()),
    Promise.resolve(getCelebritySignals()),

    // FREE — API-based (need API keys, graceful fallback)
    getWeatherSignals(),
    getStockMarketSignals(),
    getCricketSignals(),
    getEntertainmentSignals(),
    getNewsCelebritySignals(),

    // Trend & Competitive Intelligence (mock data, production: APIs/scraping)
    Promise.resolve(getPinterestSignals()),
    Promise.resolve(getLystSignals()),
    Promise.resolve(getCompetitorPricingSignals()),
    Promise.resolve(getInstagramHashtagSignals()),

    // Smart Recommendations (city targeting, budget optimizer, creative fatigue, event stacking)
    Promise.resolve(getSmartRecommendationSignals()),
  ]);

  const allSignals: Signal[] = [];
  const sourceStatus: Record<string, string> = {};

  const sourceNames = [
    "festivals", "salary-cycle", "auspicious-days", "exam-results", "travel-events", "celebrity-moments",
    "weather", "stock-market", "cricket", "entertainment", "news-celebrity",
    "pinterest-trends", "lyst-trending", "competitor-pricing", "instagram-hashtags",
    "smart-recommendations",
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
    "exam-results": { enabled: true, needsKey: false, keyName: "" },
    "travel-events": { enabled: true, needsKey: false, keyName: "" },
    "celebrity-moments": { enabled: true, needsKey: false, keyName: "" },
    weather: { enabled: !!process.env.WEATHER_API_KEY, needsKey: true, keyName: "WEATHER_API_KEY" },
    "stock-market": { enabled: true, needsKey: false, keyName: "" },
    cricket: { enabled: true, needsKey: false, keyName: "" },
    entertainment: { enabled: true, needsKey: false, keyName: "" },
    "news-celebrity": { enabled: !!process.env.NEWS_API_KEY, needsKey: true, keyName: "NEWS_API_KEY" },
    "pinterest-trends": { enabled: true, needsKey: false, keyName: "" }, // Mock data, production: Pinterest API
    "lyst-trending": { enabled: true, needsKey: false, keyName: "" }, // Mock data, production: Lyst scraping
    "competitor-pricing": { enabled: true, needsKey: false, keyName: "" }, // Mock data, production: price scraper
    "instagram-hashtags": { enabled: true, needsKey: false, keyName: "" }, // Mock data, production: Instagram API
    "smart-recommendations": { enabled: true, needsKey: false, keyName: "" }, // City targeting, budget optimizer, creative fatigue, event stacking
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
