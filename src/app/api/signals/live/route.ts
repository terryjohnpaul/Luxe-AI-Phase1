import { NextResponse } from "next/server";
import { getAllSignals, getSignalSummary, getSignalSourceStatus } from "@/lib/signals/aggregator";
import type { Signal } from "@/lib/signals/types";
import { getBrandsByTier, type BrandTier, TIER_RULES } from "@/lib/signals/brand-config";
import { getHeroForContext, getTopHero, type HeroProduct } from "@/lib/signals/product-catalog";
import { db } from "@/lib/db";
import { getDataDrivenTargeting, type TargetingRecommendation } from "@/lib/engines/targeting-engine";

// ============================================================
// PREDICTION ENGINE
// Uses signal type benchmarks, severity, confidence, tier,
// and timing factors to estimate campaign outcomes.
// ============================================================

// Industry benchmark CTRs by signal type (luxury fashion India, Meta+Google blended)
// baseConvRate = click-to-purchase % (luxury fashion India avg: 0.8-1.5%)
// Sources: Meta Ads benchmarks for fashion/luxury vertical India 2024-25, Google Ads PMax fashion vertical
// Benchmarks calibrated from: WordStream 2024 (apparel vertical), RedSeer India Fashion 2024,
// Bain x Flipkart "How India Shops Online" 2024, GroupM India TYNY report,
// dentsu/iProspect India luxury case studies, Google Think India fashion benchmarks.
//
// Signal-based campaigns are predominantly PROSPECTING (cold audiences reacting to a moment).
// Prospecting CTR: 0.8-1.5%, click-to-purchase: 0.5-1.2%, CPA: ₹1,500-4,000
// (Retargeting is 3-5x better but isn't what signal campaigns primarily drive.)
//
// Target outputs: CPA ₹2,000-4,000, ROAS 2.0-4.5x for luxury fashion India prospecting.
const SIGNAL_TYPE_BENCHMARKS: Record<string, { baseCTR: number; baseConvRate: number; engagementMultiplier: number; intentLevel: string; liftNote: string }> = {
  competitor:    { baseCTR: 1.0, baseConvRate: 0.6, engagementMultiplier: 1.1, intentLevel: "high",   liftNote: "Conquest campaigns capture competitor's dissatisfied/searching audience (+40-80% conv lift vs always-on)" },
  festival:     { baseCTR: 1.1, baseConvRate: 0.7, engagementMultiplier: 1.15, intentLevel: "high",  liftNote: "Festival periods drive +50-100% conversion lift despite +80-150% CPM increase (Bain India 2024)" },
  salary_cycle: { baseCTR: 0.9, baseConvRate: 0.55, engagementMultiplier: 1.0, intentLevel: "high",  liftNote: "1st-5th salary credit window: +15-30% conversion rate, +20-40% AOV lift (GroupM India)" },
  celebrity:    { baseCTR: 1.2, baseConvRate: 0.25, engagementMultiplier: 1.2, intentLevel: "medium", liftNote: "High CTR from curiosity but low purchase intent — 24-72hr window (moment marketing)" },
  cricket:      { baseCTR: 1.0, baseConvRate: 0.15, engagementMultiplier: 1.15, intentLevel: "low",  liftNote: "Emotional engagement drives clicks, not purchases — best for brand awareness" },
  weather:      { baseCTR: 0.8, baseConvRate: 0.4, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Contextual relevance +15-30% conv rate lift for weather-appropriate products" },
  entertainment:{ baseCTR: 1.0, baseConvRate: 0.25, engagementMultiplier: 1.1, intentLevel: "low",   liftNote: "Get-the-look trend campaigns — browsing heavy, conversion light" },
  ott_release:  { baseCTR: 0.9, baseConvRate: 0.2, engagementMultiplier: 1.05, intentLevel: "low",   liftNote: "Style inspiration from OTT — high browsing, low immediate purchase" },
  social_trend: { baseCTR: 1.0, baseConvRate: 0.3, engagementMultiplier: 1.1, intentLevel: "medium", liftNote: "Viral trend relevance — short window but strong engagement" },
  life_event:   { baseCTR: 0.85, baseConvRate: 0.7, engagementMultiplier: 1.0, intentLevel: "high",  liftNote: "Wedding/occasion = must-buy intent, highest organic conversion in fashion" },
  auspicious_day:{ baseCTR: 0.9, baseConvRate: 0.55, engagementMultiplier: 1.0, intentLevel: "high", liftNote: "Auspicious buying sentiment — similar to festival but narrower window" },
  search_trend: { baseCTR: 0.85, baseConvRate: 0.45, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Rising search demand indicates growing intent" },
  inventory:    { baseCTR: 0.8, baseConvRate: 0.5, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Stock-based urgency — limited availability drives conversion" },
  economic:     { baseCTR: 0.7, baseConvRate: 0.3, engagementMultiplier: 0.9, intentLevel: "low",    liftNote: "Macro signals — indirect impact, best for brand positioning" },
  travel:       { baseCTR: 0.8, baseConvRate: 0.35, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Travel-occasion buying — destination/resort wear" },
  regional:     { baseCTR: 0.85, baseConvRate: 0.45, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Geo-targeted regional relevance" },
  gift_occasion:{ baseCTR: 0.9, baseConvRate: 0.6, engagementMultiplier: 1.05, intentLevel: "high",  liftNote: "Gift buyers have specific budget + deadline — high conversion intent" },
  sale_event:   { baseCTR: 1.2, baseConvRate: 0.5, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "CAUTION: Dedicated sale campaigns = 0.02x Google, 3.2x Meta. Always-on during sales = 42.51x Meta. Scale always-on, not dedicated." },
  occasion_dressing: { baseCTR: 0.85, baseConvRate: 0.6, engagementMultiplier: 1.0, intentLevel: "high", liftNote: "Occasion-specific search = must-buy intent (interview, wedding guest, date night)" },
  fashion_event: { baseCTR: 1.1, baseConvRate: 0.5, engagementMultiplier: 1.15, intentLevel: "high", liftNote: "Fashion week/award shows drive +100-300% luxury search spikes. Peak attention window." },
  wedding:       { baseCTR: 0.9, baseConvRate: 0.7, engagementMultiplier: 1.1, intentLevel: "high", liftNote: "Muhurat-dense wedding windows drive 3-5x luxury demand. Must-buy intent." },
  aesthetic:     { baseCTR: 0.95, baseConvRate: 0.35, engagementMultiplier: 1.1, intentLevel: "medium", liftNote: "Trending aesthetic = creative direction signal. Drives engagement and brand affinity." },
  runway:        { baseCTR: 0.8, baseConvRate: 0.3, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Runway-to-retail trend — 3-6 month demand wave starting. Early-mover advantage." },
  launch:        { baseCTR: 1.0, baseConvRate: 0.55, engagementMultiplier: 1.15, intentLevel: "high", liftNote: "Launch week = peak organic search. Paid ads during launch get 2-3x ROAS." },
  category_demand: { baseCTR: 0.85, baseConvRate: 0.45, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Category-level demand shift. Reallocate budget to surging categories." },
  // === NEW: Calibrated from Rs 144 Cr ad spend analysis (Apr 2026) ===
  daypart:            { baseCTR: 1.72, baseConvRate: 0.58, engagementMultiplier: 1.0, intentLevel: "high",   liftNote: "Time-of-day efficiency from 10yr data. Meta 11PM CPA 47% of avg. Google 6AM CPA 62% of avg." },
  consumer_calendar:  { baseCTR: 1.72, baseConvRate: 0.58, engagementMultiplier: 1.0, intentLevel: "high",   liftNote: "Monthly efficiency from 10yr data. Dec CPA 71% of avg. Apr CPA 125% of avg." },
  sale_dynamics:      { baseCTR: 1.5, baseConvRate: 0.7, engagementMultiplier: 1.2, intentLevel: "high",    liftNote: "Sale behavioral physics. Always-on during sales: 42.51x Meta ROAS. Dedicated: 3.2x." },
  demographic:        { baseCTR: 1.72, baseConvRate: 0.58, engagementMultiplier: 1.0, intentLevel: "high",   liftNote: "F25-34 universal buyer 23.2% conv rate. M35-44 goldmine 16.67x ROAS. Calibrated from live data." },
  geo_index:          { baseCTR: 1.72, baseConvRate: 0.58, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Karnataka CPA index 0.33 (best). Delhi 1.0 (worst metro). Tier-2 21-31% cheaper." },
  brand_demand:       { baseCTR: 1.0, baseConvRate: 0.5, engagementMultiplier: 1.1, intentLevel: "high",    liftNote: "Brand ROAS tiers from data: Onitsuka 41.88x, Marc Jacobs 28x, IndianWear 38.43x." },
  content_truth:      { baseCTR: 1.72, baseConvRate: 0.58, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Luxury messaging 2.5x over discount. 10-11s video sweet spot. Brand pages 13x CTR." },
  competitive_landscape: { baseCTR: 0.9, baseConvRate: 0.4, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Ajio 13.98% IS. TataCLiQ Position Above 48.47%. Farfetch conquest 70%+ conv." },
  placement_rule:     { baseCTR: 1.72, baseConvRate: 0.58, engagementMultiplier: 1.0, intentLevel: "high",   liftNote: "Reels 7.45x vs Stories 3.47x. Facebook 12.25x vs Instagram 5.15x. Android 9.52x vs iPhone 3.60x." },
  funnel_benchmark:   { baseCTR: 1.72, baseConvRate: 0.58, engagementMultiplier: 1.0, intentLevel: "high",   liftNote: "67% LPV drop. 93% cart abandonment. 93.7% checkout completion. 43.7% view-through." },
  festival_fashion:   { baseCTR: 1.1, baseConvRate: 0.7, engagementMultiplier: 1.15, intentLevel: "high",   liftNote: "Festival-to-fashion mapping: Navratri 9 colors, Durga Puja sarees, Onam kasavu." },
  compound_signal:    { baseCTR: 1.5, baseConvRate: 0.8, engagementMultiplier: 1.2, intentLevel: "high",    liftNote: "Multi-dimensional compound: 4-5 signals aligning = highest confidence predictions." },
};

// ============================================================
// SIGNAL CATEGORY & DATA SOURCE ATTRIBUTION
// External = things happening in the world
// Internal = things happening in your ad data
// ============================================================

const EXTERNAL_TYPES = new Set([
  "wedding", "festival", "cricket", "weather", "celebrity",
  "search_trend", "social_trend", "life_event", "auspicious_day",
  "entertainment", "ott_release", "travel", "launch", "runway",
  "fashion_event", "gift_occasion", "occasion_dressing",
  "sale_event", "aesthetic",
]);

const INTERNAL_TYPES = new Set([
  "category_demand", "economic", "regional", "competitor",
  "salary_cycle", "daypart", "demographic", "geo_index",
  "brand_demand", "content_truth", "competitive_landscape",
  "placement_rule", "funnel_benchmark", "festival_fashion",
  "compound_signal", "consumer_calendar", "sale_dynamics",
  "frequency_monitor", "creative_performance", "funnel_health",
  "meta_performance", "placement_efficiency", "cross_platform",
  "demographic_shifts", "geo_performance",
]);

const DATA_SOURCES: Record<string, string> = {
  // External
  wedding: "Hindu Panchang Calendar + Google Trends",
  festival: "Indian Festival Calendar 2026",
  cricket: "CricAPI Live Data",
  weather: "WeatherAPI.com — 20 Indian cities",
  celebrity: "NewsAPI — Bollywood & Celebrity News",
  search_trend: "DataForSEO — Google Search Volume",
  social_trend: "Apify — Instagram & Pinterest Scraper",
  life_event: "Google Trends + Cultural Calendar",
  auspicious_day: "Hindu Panchang 2026",
  entertainment: "TMDB + Bollywood Calendar",
  launch: "Brand Websites + Fashion News",
  runway: "Fashion Week Reports + Lyst Data",
  fashion_event: "NewsAPI + Fashion Event Calendar",
  gift_occasion: "Indian Gift Calendar",
  occasion_dressing: "Google Trends — Occasion Searches",
  sale_event: "Ajio Luxe Sale Calendar",
  aesthetic: "Google Trends + Instagram via Apify",
  travel: "Holiday Calendar + Google Trends",
  ott_release: "TMDB + OTT Platform Calendars",
  // Internal
  category_demand: "Ajio Luxe Meta Ads — ₹96 Cr Spend Data",
  economic: "Yahoo Finance (Nifty/Sensex) + Ajio Luxe Ad Data",
  regional: "Ajio Luxe Geo Breakdown — 55K Location Records",
  competitor: "DataForSEO SERP + Auction Insights — ₹46 Cr Google Data",
  salary_cycle: "Indian Payroll Calendar + Ajio Luxe Monthly Trends",
  daypart: "Ajio Luxe Hourly Performance — Meta + Google APIs",
  demographic: "Ajio Luxe Age-Gender Breakdown — 4.2K Records",
  brand_demand: "Ajio Luxe Brand Performance — 981 Campaigns",
  content_truth: "Ajio Luxe Ad Copy Analysis — 60K Creatives",
  competitive_landscape: "Google Ads Auction Insights",
  placement_rule: "Ajio Luxe Placement Breakdown — Meta API",
  funnel_benchmark: "Ajio Luxe Funnel Data — 25M Cart Events",
  compound_signal: "Multi-Signal Intersection Engine",
  consumer_calendar: "Ajio Luxe Monthly Performance — 10 Years",
  sale_dynamics: "Ajio Luxe Sale Event Analysis — EOSS/BFS/BBS",
  geo_index: "Ajio Luxe Regional CPA Index — 36 States",
  frequency_monitor: "Meta Ads API — Campaign Frequency Data",
  creative_performance: "Meta Ads API — Ad Creative Insights",
  funnel_health: "Meta Ads API — Funnel Actions Data",
  meta_performance: "Meta Ads API — Live Campaign Metrics",
  placement_efficiency: "Meta Ads API — Placement Breakdown",
  cross_platform: "Meta + Google Ads — Cross-Platform Analysis",
  demographic_shifts: "Meta Ads API — Age/Gender Breakdown",
  geo_performance: "Meta + Google Ads — Regional Performance",
  festival_fashion: "Festival-Fashion Mapping Engine",
};

// Severity adds a mild boost, not a massive multiplier — prevents unrealistic compounding
const SEVERITY_MULTIPLIERS: Record<string, number> = {
  critical: 1.15,
  high: 1.08,
  medium: 1.0,
  low: 0.85,
};

// Avg daily budget in INR extracted from range string
function parseBudgetMid(budgetStr: string): number {
  const nums = budgetStr.match(/[\d,]+/g)?.map(n => parseInt(n.replace(/,/g, ""))) || [20000];
  return nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0];
}

// For new/unknown signal types — derive benchmarks from signal properties
// so the engine stays flexible without code changes.
function deriveBenchmark(signal: Signal): typeof SIGNAL_TYPE_BENCHMARKS[string] {
  // Severity as a proxy for how actionable/commercial the signal is
  const severityScore = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4 }[signal.severity] || 0.5;

  // Confidence as a quality proxy
  const confScore = signal.confidence;

  // High-intent signals (ones with specific product/brand suggestions) convert better
  const hasBrands = signal.suggestedBrands.length > 0 && signal.suggestedBrands[0] !== "All brands";
  const hasSpecificAction = signal.suggestedAction.length > 50; // detailed action = more targeted

  // Derive intent level from signal properties
  const intentScore = (severityScore * 0.4) + (confScore * 0.3) + (hasBrands ? 0.15 : 0) + (hasSpecificAction ? 0.15 : 0);
  const intentLevel = intentScore >= 0.7 ? "high" : intentScore >= 0.45 ? "medium" : "low";

  // Map intent to realistic benchmarks
  const baseCTR = intentLevel === "high" ? 0.95 : intentLevel === "medium" ? 0.8 : 0.7;
  const baseConvRate = intentLevel === "high" ? 0.55 : intentLevel === "medium" ? 0.35 : 0.2;
  const engagementMultiplier = intentLevel === "high" ? 1.05 : 1.0;

  const typeLabel = signal.type.replace(/_/g, " ");
  const liftNote = intentLevel === "high"
    ? `${typeLabel} signal shows strong commercial intent — specific brands and actions identified`
    : intentLevel === "medium"
    ? `${typeLabel} signal shows moderate buying relevance — contextual opportunity`
    : `${typeLabel} signal is awareness-level — low direct purchase intent expected`;

  return { baseCTR, baseConvRate, engagementMultiplier, intentLevel, liftNote };
}

function buildPrediction(signal: Signal, tiers: BrandTier[]) {
  const isLuxuryOnly = tiers.length === 1 && tiers[0] === "luxury";
  const isAccessibleOnly = tiers.length === 1 && tiers[0] === "accessible";

  const bench = SIGNAL_TYPE_BENCHMARKS[signal.type] || deriveBenchmark(signal);
  const severityMult = SEVERITY_MULTIPLIERS[signal.severity] || 1.0;
  const confidenceMult = 0.7 + (signal.confidence * 0.6); // 0.7–1.3 range

  // Tier adjustments: luxury = fewer people but higher AOV, accessible = more volume
  const tierReachMult = isLuxuryOnly ? 0.7 : isAccessibleOnly ? 1.3 : 1.0;
  const tierConvMult = isLuxuryOnly ? 0.85 : isAccessibleOnly ? 1.15 : 1.0;
  // AOV: Luxury fashion India ₹5K-12K, Tata CLiQ Luxury ₹8K-18K, Myntra premium ₹3K-7K (RedSeer 2024)
  const tierAOV = isLuxuryOnly ? 3235 : isAccessibleOnly ? 2649 : 3000; // Calibrated from live Meta API (was 12000/3500/7000 generic)

  // CPM: luxury fashion India is ₹250-400 on Meta, ₹150-250 on Google Display
  // Blended CPM accounts for Meta-heavy split
  const cpm = isLuxuryOnly ? 21.20 : isAccessibleOnly ? 19.31 : 21.20; // Calibrated from live Meta API (was 380/180/280 generic)
  const dailyBudget = parseBudgetMid(getBudgetForSignal(signal));
  const durationDays = signal.type === "cricket" ? 1 :
                       signal.type === "celebrity" ? 4 :
                       signal.type === "festival" ? 10 :
                       signal.type === "weather" ? 5 : 10;

  const totalBudget = dailyBudget * durationDays;
  const baseImpressions = (totalBudget / cpm) * 1000;
  // Only apply engagement multiplier to impressions (not severity — that affects CTR/conv separately)
  const impressions = Math.round(baseImpressions * bench.engagementMultiplier * tierReachMult);

  // === MULTI-FACTOR MULTIPLIERS (from Rs 144 Cr data analysis) ===
  // Each factor adjusts the prediction based on actual proven performance data
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  const currentMonth = now.getMonth();
  
  // Time-of-day multiplier (Meta: 11PM cheapest, 6AM most expensive)
  const hourMultiplier = (currentHour >= 21 || currentHour <= 1) ? 1.3 : // Meta golden window
                         (currentHour >= 5 && currentHour <= 9) ? 0.7 :   // Meta expensive, Google cheap
                         1.0;
  
  // Day-of-week multiplier
  const dayMultiplier = currentDay === 0 ? 1.45 :  // Sunday best
                        currentDay === 4 ? 1.15 :    // Thursday efficient
                        currentDay === 2 ? 0.85 :    // Tuesday worst
                        currentDay === 3 ? 0.89 :    // Wednesday
                        1.0;
  
  // Monthly multiplier  
  const monthMultiplier = [1.35, 0.95, 1.20, 0.70, 0.85, 0.80, 1.05, 0.65, 0.85, 1.40, 0.85, 1.40][currentMonth];
  // Jan=1.35, Apr=0.70, Aug=0.65, Oct=1.40(pre-Diwali), Dec=1.40
  
  // Category multiplier (if signal mentions specific categories)
  const signalData = JSON.stringify(signal.data || {}).toLowerCase();
  const categoryMultiplier = signalData.includes("indian_wear") || signalData.includes("indian wear") ? 1.8 :
                             signalData.includes("sneaker") || signalData.includes("onitsuka") ? 1.6 :
                             signalData.includes("home") || signalData.includes("dinnerware") ? 1.5 :
                             signalData.includes("eyewear") ? 1.3 :
                             signalData.includes("watch") ? 1.2 :
                             signalData.includes("perfume") ? 1.1 :
                             1.0;
  
  // Compound multiplier (capped at 3x to prevent unrealistic predictions)
  const dataMultiplier = Math.min(3.0, Math.max(0.3, 
    hourMultiplier * dayMultiplier * Math.sqrt(monthMultiplier) * Math.sqrt(categoryMultiplier)
  ));

  // CTR — apply severity OR confidence boost, not both compounding
  // Use the stronger of the two as primary, the other as a mild modifier
  const signalBoost = Math.max(severityMult, confidenceMult);
  const signalMinor = Math.min(severityMult, confidenceMult);
  const ctr = bench.baseCTR * signalBoost * (1 + (signalMinor - 1) * 0.3) * dataMultiplier; // mild secondary effect
  const clicks = Math.round(impressions * (ctr / 100));

  // Conversion rate — same anti-compounding logic
  const convRate = bench.baseConvRate * signalBoost * tierConvMult * Math.sqrt(dataMultiplier);
  const conversions = Math.round(clicks * (convRate / 100));

  // ROAS = (conversions × AOV) / totalBudget
  const revenue = conversions * tierAOV;
  const roas = totalBudget > 0 ? revenue / totalBudget : 0;

  // Reach ≈ impressions / avg frequency (3-4 for fashion campaigns)
  const avgFrequency = signal.severity === "critical" ? 3.0 : 3.5;
  const reach = Math.round(impressions / avgFrequency);

  // Build reasoning factors — explain WHY we predict these numbers
  const factors: string[] = [];

  // Multi-factor context
  if (dataMultiplier > 1.2) factors.push(`Data multiplier: ${dataMultiplier.toFixed(2)}x boost from time/day/month/category alignment`);
  if (dataMultiplier < 0.8) factors.push(`Data multiplier: ${dataMultiplier.toFixed(2)}x — suboptimal timing reduces expected performance`);

  // Signal type context
  factors.push(bench.liftNote);

  // Severity context
  if (signal.severity === "critical") factors.push("Critical severity — peak opportunity window, justifies aggressive spend");
  else if (signal.severity === "high") factors.push("High severity — strong opportunity window");

  // Confidence context
  if (signal.confidence >= 0.85) factors.push(`Signal confidence ${Math.round(signal.confidence * 100)}% — data source is very reliable`);
  else if (signal.confidence >= 0.7) factors.push(`Signal confidence ${Math.round(signal.confidence * 100)}% — reliable signal`);
  else factors.push(`Signal confidence ${Math.round(signal.confidence * 100)}% — moderate certainty, consider smaller test budget`);

  // Tier context with AOV
  if (isLuxuryOnly) factors.push("Luxury tier — niche audience, higher AOV ₹12,000 (Tata CLiQ Luxury range)");
  else if (isAccessibleOnly) factors.push("Accessible tier — broader audience, AOV ₹3,500 (Myntra premium range)");
  else factors.push(`Blended tiers — avg order value ₹7,000 (luxury fashion India, RedSeer 2024)`);

  // CPA and unit economics
  const cpa = conversions > 0 ? Math.round(totalBudget / conversions) : 0;
  if (cpa > 0) {
    const margin = tierAOV * 0.55; // ~55% gross margin for luxury fashion
    const profitable = cpa < margin;
    factors.push(`Est. CPA ₹${cpa.toLocaleString("en-IN")}/order — ${profitable ? "profitable at 55% margin" : "tight margins, optimize creative to improve"}`);
  }

  const formatNum = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)} lakh`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  // Show ranges (±20%) to avoid false precision
  const range = (n: number) => `${formatNum(Math.round(n * 0.8))}-${formatNum(Math.round(n * 1.2))}`;

  // For low-ROAS signals (< 1.5x), reframe as awareness campaign
  const isAwareness = roas < 1.5;
  if (isAwareness) {
    factors.push("Best used as AWARENESS campaign — track brand recall and reach, not direct ROAS");
  }

  return {
    confidence: Math.round(signal.confidence * 100),
    estimatedReach: range(reach),
    estimatedImpressions: range(impressions),
    estimatedClicks: range(clicks),
    estimatedCTR: `${(ctr * 0.9).toFixed(1)}-${(ctr * 1.1).toFixed(1)}%`,
    estimatedConversions: range(conversions),
    estimatedCPA: cpa > 0 ? `₹${formatNum(Math.round(cpa * 0.85))}-${formatNum(Math.round(cpa * 1.15))}` : "N/A",
    estimatedRevenue: range(revenue),
    estimatedROAS: `${(roas * 0.85).toFixed(1)}-${(roas * 1.15).toFixed(1)}x`,
    campaignGoal: isAwareness ? "Brand Awareness" : "Conversions",
    factors,
    methodology: "Projections based on luxury fashion India benchmarks from WordStream 2024, RedSeer India Fashion, Bain x Flipkart 'How India Shops Online', and dentsu/iProspect case studies. Adjusted for signal type, severity, confidence, tier AOV, and budget. Assumes prospecting-heavy campaign. Connect your Meta/Google Ads for actuals-based projections.",
  };
}

// Generate a CEO-friendly campaign title
// RULE: Only show specific products if the SIGNAL detected them (e.g. Lyst trending data).
// Otherwise show brand name only — don't fabricate product specifics.
function generateRecTitle(signal: Signal, brands: string[]): string {
  const brand = brands[0] || "Luxury Brand";

  switch (signal.type) {
    case "festival": {
      const festName = signal.title.split(" in ")[0].replace(/\d+/g, "").trim();
      return `${festName} — Launch Festive Campaigns NOW`;
    }
    case "life_event": {
      const event = signal.title.split("—")[0].split(":")[0].trim();
      return event;
    }
    case "competitor": {
      if (signal.title.includes("outranking")) return `Defend "${brand}" Brand Searches on Google`;
      if (signal.title.includes("ranks for")) {
        const match = signal.title.match(/ranks for "([^"]+)"/);
        return match ? `Win "${match[1]}" Searches vs Competition` : `Conquest Campaign — ${brand}`;
      }
      return `Conquest Campaign — ${brand}`;
    }
    case "search_trend": {
      const prodMatch = signal.title.match(/Trending #\d+: (.+?)(?:\s*—|$)/);
      if (prodMatch) return `Trending: ${prodMatch[1]} — Demand +${signal.title.match(/\+(\d+%)/)?.[1] || "surging"}`;
      return `Search Demand Rising — ${brand}`;
    }
    case "social_trend": {
      const trendMatch = signal.title.match(/[""]([^""]+)[""]/);
      const trend = trendMatch?.[1] || signal.title.match(/#(\w+)/)?.[1] || "Viral";
      return `"${trend}" Trend — Ride the Wave`;
    }
    case "celebrity": {
      const celeb = signal.data?.celebrity || signal.title.split(" ")[0];
      return `${celeb} is Trending — Moment Marketing`;
    }
    case "salary_cycle":
      return "Payday Campaign — Target IT Hubs";
    case "gift_occasion": {
      const occasion = signal.title.split("—")[0].trim();
      return `${occasion} — Push Gifting Campaigns`;
    }
    case "weather":
      return `Weather Opportunity — ${signal.location}`;
    case "fashion_event": {
      const eventName = signal.data?.event || signal.title.split("—")[0].trim();
      return `${eventName} — Luxury Searches Spiking`;
    }
    case "wedding": {
      const windowName = signal.data?.window || signal.title.split("—")[0].trim();
      return `${windowName} — ${signal.data?.weddings || "Wedding Peak"}`;
    }
    case "aesthetic": {
      const aestheticName = signal.data?.aesthetic || signal.title.match(/"([^"]+)"/)?.[1] || "Trending";
      return `"${aestheticName}" Aesthetic — Use This Creative Direction`;
    }
    case "runway": {
      const trendName = signal.data?.trend || signal.title.match(/"([^"]+)"/)?.[1] || "Runway Trend";
      return `Runway → Retail: ${trendName}`;
    }
    case "launch": {
      const collection = signal.data?.collection || "New Collection";
      return `${brand}: ${collection} — Launch Week`;
    }
    case "category_demand": {
      const category = signal.data?.category || signal.triggersWhat;
      const demand = signal.data?.demand || "growing";
      return `${category} Demand ${demand === "surging" ? "Surging" : "Growing"} in India`;
    }
    default:
      return signal.title.split("—")[0].slice(0, 50).trim();
  }
}

/**
 * Determine urgency: "Will acting NOW give significantly better results than acting later?"
 * Urgent = opportunity window is closing. Not urgent = trend will continue for weeks.
 */
function getUrgency(signal: Signal): "urgent" | "high" | "medium" | "opportunity" {
  const type = signal.type;
  const severity = signal.severity;
  const data = signal.data || {};

  // URGENT: Act NOW or miss the window entirely
  // Festival in ≤2 days — can't advertise after it passes
  if (type === "festival" && (data.daysUntil <= 2 || severity === "critical")) return "urgent";
  // Wedding muhurat this week — guests buying outfits RIGHT NOW
  if (type === "wedding" && severity === "critical") return "urgent";
  // Fashion event LIVE — search spike happening now, fades in 48hrs
  if (type === "fashion_event" && (data.autoDetected || data.daysUntil <= 1)) return "urgent";
  // Celebrity trending RIGHT NOW — viral window is 24-48 hours
  if (type === "celebrity" && severity === "critical") return "urgent";
  // Sale event happening NOW
  if (type === "sale_event" && severity === "critical") return "urgent";
  // Product search demand spiking >200% — momentum is peaking
  if (type === "search_trend" && data.searchGrowth > 200) return "urgent";
  // Competitor undercutting you RIGHT NOW
  if (type === "competitor" && data.priceAdvantage === "they_are_cheaper" && data.discount >= 30) return "urgent";
  // Launch just happened — peak window
  if (type === "launch" && data.daysUntil !== undefined && data.daysUntil <= 0) return "urgent";

  // HIGH: Strong opportunity, should act within days
  if (severity === "critical") return "high";
  if (type === "festival" && data.daysUntil <= 5) return "high";
  if (type === "wedding" && severity === "high") return "high";
  if (type === "celebrity") return "high"; // Celebrity moments are always time-sensitive
  if (type === "search_trend" && data.searchGrowth > 100) return "high";
  if (type === "competitor") return "high"; // Competitors don't wait
  if (type === "launch") return "high";
  if (type === "fashion_event") return "high";
  if (type === "category_demand" && data.demand === "surging") return "high";
  if (severity === "high") return "high";

  // MEDIUM: Good opportunity, can plan over 1-2 weeks
  if (type === "social_trend" || type === "aesthetic") return "medium";
  if (type === "category_demand") return "medium";
  if (type === "salary_cycle") return "medium";
  if (severity === "medium") return "medium";

  // OPPORTUNITY: Long-term, act when ready
  return "opportunity";
}

// Generate actionable ad recommendations from signals, adjusted by tier
function generateAdRecommendation(signal: Signal, tiers: BrandTier[] = ["luxury", "premium", "accessible"], dataDriven?: TargetingRecommendation | null) {
  const isLuxuryOnly = tiers.length === 1 && tiers[0] === "luxury";
  const isAccessibleOnly = tiers.length === 1 && tiers[0] === "accessible";
  const hasPremium = tiers.includes("premium");

  // Get brands for active tiers
  const tierBrands = tiers.flatMap(t => getBrandsByTier(t));
  const brandNames = tierBrands.map(b => b.name);
  // Override signal's suggested brands with tier-appropriate ones
  const filteredBrands = signal.suggestedBrands[0] === "All brands" || signal.suggestedBrands[0]?.includes("All")
    ? tierBrands.slice(0, 4).map(b => b.name)
    : signal.suggestedBrands.filter(b => brandNames.includes(b));
  const finalBrands = filteredBrands.length > 0 ? filteredBrands : tierBrands.slice(0, 3).map(b => b.name);

  // Adjust targeting by tier
  const tierArchetypes = isLuxuryOnly ? ["Fashion Loyalist"]
    : isAccessibleOnly ? ["Urban Achiever", "Aspirant"]
    : signal.targetArchetypes;

  // Adjust CTA by tier
  const cta = isLuxuryOnly ? "Explore Collection"
    : isAccessibleOnly ? "Shop Now — EMI Available"
    : signal.severity === "critical" ? "Shop Now" : "Explore Collection";

  // Adjust messaging tone
  const toneNote = isLuxuryOnly
    ? " IMPORTANT: Luxury tone only — no discounts, no urgency, no EMI, no price in prospecting. Editorial imagery. Aspirational language."
    : isAccessibleOnly
    ? " Include EMI options, show price prominently, urgency messaging OK (limited stock, sale ends), value proposition clear."
    : "";
  return {
    id: `rec-${signal.id}`,
    signalId: signal.id,
    signalTitle: signal.title,
    signalType: signal.type,
    priority: getUrgency(signal),

    title: generateRecTitle(signal, finalBrands),
    description: signal.description + toneNote,
    tierMode: tiers.join("+"),

    creative: {
      direction: signal.triggersWhat + toneNote,
      suggestedFormats: getFormatsForSignal(signal),
      brands: finalBrands,
      sampleHeadlines: generateHeadlines(signal),
      samplePrimaryTexts: generatePrimaryTexts(signal),
      cta,
    },

    targeting: {
      archetypes: tierArchetypes,
      location: dataDriven?.location || signal.location,
      timing: getTimingForSignal(signal),
      platforms: getPlatformSplit(signal),
      // Data-driven targeting with hardcoded fallback
      ...(dataDriven ? {
        ageRange: dataDriven.ageRange,
        ageReason: dataDriven.ageReason,
        gender: dataDriven.gender,
        genderReason: dataDriven.genderReason,
        locationReason: dataDriven.locationReason,
        devices: dataDriven.devices,
        deviceReason: dataDriven.deviceReason,
        placements: dataDriven.placements,
        placementReason: dataDriven.placementReason,
        interests: dataDriven.interests,
        audiences: dataDriven.audiences,
        exclusions: dataDriven.exclusions,
        languages: dataDriven.languages,
        optimizationGoal: dataDriven.optimizationGoal,
      } : getTargetingForSignal(signal, SIGNAL_TYPE_BENCHMARKS[signal.type] || deriveBenchmark(signal))),
    },

    budget: {
      suggested: getBudgetForSignal(signal),
      duration: getDurationForSignal(signal),
      bidStrategy: signal.severity === "critical" ? "Highest Volume (capture maximum reach)" :
                   "Cost Cap or Target ROAS 3.5x",
    },

    prediction: buildPrediction(signal, tiers),

    // Copy-ready instructions for manual execution
    executionGuide: {
      meta: generateMetaGuide(signal),
      google: generateGoogleGuide(signal),
    },
  };
}

function getFormatsForSignal(signal: Signal): string[] {
  if (signal.type === "cricket" || signal.type === "entertainment") {
    return ["Instagram Reels (9:16)", "Instagram Stories", "YouTube Shorts"];
  }
  if (signal.type === "festival" || signal.type === "life_event") {
    return ["Instagram Collection Ads", "Instagram Reels", "Carousel", "Google Shopping"];
  }
  if (signal.type === "weather") {
    return ["Instagram Feed (1:1)", "Instagram Reels", "Google Demand Gen"];
  }
  return ["Instagram Feed (1:1)", "Instagram Reels (9:16)", "Google Shopping"];
}

function generateHeadlines(signal: Signal): string[] {
  const headlines: string[] = [];
  const brand = signal.suggestedBrands[0] || "Luxury Brand";

  switch (signal.type) {
    case "festival":
      headlines.push(`${signal.title.split(" in ")[0]} Ready?`);
      headlines.push(`Celebrate in ${brand}`);
      headlines.push(`Festive Edit — ${brand}`);
      break;
    case "weather": {
      const month = new Date().getMonth();
      const isSummer = month >= 2 && month <= 5;
      if (signal.title.includes("heatwave") || (isSummer && !signal.title.includes("rain"))) {
        headlines.push("Beat the Heat in Style");
        headlines.push(`${brand} Summer Essentials`);
        headlines.push("Stay Cool. Look Sharp.");
      } else if (signal.title.includes("rain")) {
        headlines.push("Monsoon Ready Fashion");
        headlines.push(`${brand} — Rain-Proof Style`);
        headlines.push("Cozy Day, Elevated");
      } else {
        headlines.push(`${brand} — Shop from Home`);
        headlines.push("New Arrivals — Free Delivery");
        headlines.push("Luxury Delivered to Your Door");
      }
      break;
    }
    case "salary_cycle":
      headlines.push("You Earned It");
      headlines.push(`${brand} — Treat Yourself`);
      headlines.push("The Upgrade You Deserve");
      break;
    case "celebrity": {
      const celeb = signal.data?.celebrity || brand;
      headlines.push(`Get ${celeb}'s Look`);
      headlines.push(`${brand} — As Seen on ${celeb}`);
      headlines.push(`${celeb}'s Style, Your Wardrobe`);
      break;
    }
    case "life_event":
      headlines.push("Dress for Every Ceremony");
      headlines.push(`${brand} Wedding Season Edit`);
      headlines.push("The Guest Who Stole the Show");
      break;
    case "search_trend": {
      // Product name comes FROM the signal data (Lyst/Pinterest) — safe to use
      const prodMatch = signal.title.match(/Trending #\d+: (.+?)(?:\s*—|$)/);
      const productName = prodMatch ? prodMatch[1] : brand;
      headlines.push(`${productName} — Shop Now`);
      headlines.push(`Everyone's Searching for ${productName}`);
      headlines.push(`Get the ${productName}`);
      break;
    }
    case "social_trend": {
      const trendMatch = signal.title.match(/[""]([^""]+)[""]/);
      const trend = trendMatch ? trendMatch[1] : "this trend";
      headlines.push(`The ${trend} Edit`);
      headlines.push(`Shop the ${trend} Look`);
      headlines.push(`${brand} — As Seen Everywhere`);
      break;
    }
    case "competitor":
      headlines.push(`${brand} — Shop Official`);
      headlines.push(`Authentic ${brand}. Free Delivery.`);
      headlines.push(`Shop ${brand} with Confidence`);
      break;
    case "fashion_event": {
      const eventName = signal.data?.event || "Fashion Week";
      headlines.push(`${eventName} — Shop the Looks`);
      headlines.push(`Red Carpet Style — ${brand}`);
      headlines.push("As Seen on the Runway");
      break;
    }
    case "wedding": {
      headlines.push("Wedding Season is HERE");
      headlines.push(`${brand} — Wedding Guest Edit`);
      headlines.push("The Outfit They'll Remember");
      break;
    }
    case "aesthetic": {
      const aesName = signal.data?.aesthetic || "Trending";
      headlines.push(`The ${aesName} Look`);
      headlines.push(`${brand} — ${aesName} Edit`);
      headlines.push("The Aesthetic Everyone Wants");
      break;
    }
    case "launch": {
      const launchBrand = signal.suggestedBrands[0] || brand;
      headlines.push(`${launchBrand} — Just Dropped`);
      headlines.push("New Collection Alert");
      headlines.push(`Shop ${launchBrand} New Arrivals`);
      break;
    }
    case "category_demand": {
      const cat = signal.data?.category || "Luxury";
      headlines.push(`${cat} — Trending in India`);
      headlines.push(`Shop ${cat} from ${brand}`);
      headlines.push("India's Most Wanted Right Now");
      break;
    }
    default:
      headlines.push(`${brand} — Shop Now`);
      headlines.push(`New Arrivals — ${brand}`);
      headlines.push("Luxury Fashion, Curated for You");
  }
  return headlines;
}

function generatePrimaryTexts(signal: Signal): string[] {
  const brand = signal.suggestedBrands[0] || "Luxury Brand";
  const brands = signal.suggestedBrands.slice(0, 3).join(", ");
  const hero = getHeroForContext(brand, signal.type + " " + signal.title + " " + signal.triggersWhat);
  const texts: string[] = [];

  // First text: signal context + brand (no fabricated product names)
  texts.push(`${signal.triggersWhat}. Shop ${brands} — free delivery, authentic guarantee.`);

  // Second text: type-specific copy
  if (signal.type === "salary_cycle") {
    texts.push(`Hard work pays off. Reward yourself with ${brand}. ${brands} — shop now.`);
  } else if (signal.type === "festival") {
    texts.push(`This festive season deserves outfits that stand out. Explore ${brands}.`);
  } else if (signal.type === "celebrity") {
    const celeb = signal.data?.celebrity || brand;
    texts.push(`${celeb}'s style, your wardrobe. Shop ${brands}. Authentic, delivered in 3-5 days.`);
  } else if (signal.type === "social_trend") {
    const trendMatch = signal.title.match(/[""]([^""]+)[""]/);
    const trend = trendMatch?.[1] || "this trend";
    texts.push(`The ${trend} look, perfected. Shop ${brands}.`);
  } else if (signal.type === "competitor") {
    texts.push(`Authentic ${brand} with warranty, delivered in 3-5 days. Shop with confidence.`);
  } else {
    texts.push(`Discover what's trending. Shop ${brands} now.`);
  }

  // Third text (optional): hero product suggestion — clearly a suggestion, not from signal
  if (hero) {
    texts.push(`Suggested hero product: ${hero.name} (₹${hero.priceINR.toLocaleString("en-IN")}). ${hero.heroAngle}`);
  }

  return texts;
}

function getTimingForSignal(signal: Signal): string {
  switch (signal.type) {
    case "cricket": return "6 PM - 11 PM (match hours)";
    case "salary_cycle": return "Evening 7-11 PM (post-work browsing)";
    case "weather": return "Morning 7-9 AM + Evening 7-11 PM";
    case "festival": return "All day — boost 6 PM-11 PM";
    default: return "All day — boost evenings";
  }
}

function getPlatformSplit(signal: Signal) {
  if (signal.type === "cricket" || signal.type === "entertainment" || signal.type === "celebrity") {
    return { meta: "75%", google: "25%", reason: "Visual/social signal → Meta-heavy" };
  }
  if (signal.type === "salary_cycle" || signal.type === "auspicious_day") {
    return { meta: "55%", google: "45%", reason: "Commercial intent → balanced split" };
  }
  return { meta: "65%", google: "35%", reason: "Default luxury fashion split" };
}

// ============================================================
// COMPREHENSIVE AD TARGETING
// Returns detailed targeting parameters based on signal type,
// calibrated from Rs 144 Cr ad spend analysis.
// ============================================================

function getTargetingForSignal(signal: Signal, bench: typeof SIGNAL_TYPE_BENCHMARKS[string]) {
  const type = signal.type;
  const data = signal.data || {};
  const signalText = (signal.title + " " + signal.description + " " + signal.triggersWhat).toLowerCase();

  // --- AGE RANGE ---
  let ageRange = "25-44";
  if (["wedding", "festival", "gift_occasion", "life_event", "auspicious_day", "weather", "festival_fashion"].includes(type)) {
    ageRange = "25-54";
  } else if (["celebrity", "aesthetic", "social_trend", "entertainment", "ott_release", "runway"].includes(type)) {
    ageRange = "18-34";
  } else if (["competitor", "search_trend", "salary_cycle", "economic", "launch"].includes(type)) {
    ageRange = "25-44";
  } else if (type === "cricket") {
    ageRange = "18-44";
  }

  // --- GENDER ---
  let gender = "All";
  if (type === "aesthetic") {
    const aesName = (data.aesthetic || signalText).toLowerCase();
    if (["coquette", "balletcore", "cottagecore", "soft girl", "clean girl", "vanilla girl", "tomato girl"].some(a => aesName.includes(a))) {
      gender = "Female";
    }
  } else if (type === "cricket") {
    gender = "Male";
  } else if (type === "celebrity") {
    // Male celeb → target Female audience, Female celeb → target Male audience
    const celeb = (data.celebrity || "").toLowerCase();
    const femaleCelebs = ["deepika", "alia", "katrina", "ananya", "janhvi", "kiara", "sobhita", "priyanka", "sonam"];
    const maleCelebs = ["ranveer", "ranbir", "shah rukh", "srk", "virat", "siddhant", "varun", "arjun", "hrithik"];
    if (femaleCelebs.some(c => celeb.includes(c))) gender = "Male";
    else if (maleCelebs.some(c => celeb.includes(c))) gender = "Female";
  }

  // --- INTERESTS (Meta interest targeting keywords) ---
  const baseInterests = ["Luxury goods", "Online shopping", "Fashion"];
  let interests = [...baseInterests];
  if (["wedding", "life_event"].includes(type)) {
    interests.push("Wedding planning", "Bridal fashion", "Indian weddings", "Wedding guest outfits");
  }
  if (["festival", "auspicious_day", "festival_fashion"].includes(type)) {
    interests.push("Indian festivals", "Ethnic wear", "Traditional fashion", "Festive shopping");
  }
  if (type === "cricket") {
    interests.push("Cricket", "IPL", "Sports fashion", "Athleisure");
  }
  if (type === "celebrity" || type === "entertainment") {
    interests.push("Bollywood", "Celebrity fashion", "Celebrity news", "Entertainment");
  }
  if (type === "search_trend" || type === "competitor") {
    if (signalText.includes("bag") || signalText.includes("handbag")) {
      interests.push("Designer handbags", "Luxury bags", "Coach", "Michael Kors");
    }
    if (signalText.includes("sneaker") || signalText.includes("shoe")) {
      interests.push("Sneakers", "Designer shoes", "Nike", "Adidas");
    }
    if (signalText.includes("watch")) {
      interests.push("Luxury watches", "Tissot", "Fossil");
    }
    if (signalText.includes("perfume") || signalText.includes("fragrance")) {
      interests.push("Fragrances", "Perfume", "Designer fragrance");
    }
  }
  if (type === "aesthetic" || type === "social_trend") {
    interests.push("Fashion trends", "Style inspiration", "Instagram fashion");
  }
  if (type === "runway" || type === "fashion_event") {
    interests.push("Fashion week", "Runway fashion", "Designer clothing", "High fashion");
  }
  if (type === "weather") {
    if (signalText.includes("heat") || signalText.includes("summer")) {
      interests.push("Summer fashion", "Sunglasses", "Lightweight clothing");
    } else if (signalText.includes("rain") || signalText.includes("monsoon")) {
      interests.push("Monsoon fashion", "Waterproof accessories");
    }
  }
  if (type === "salary_cycle") {
    interests.push("Premium lifestyle", "Self-reward shopping", "Career professionals");
  }
  if (type === "gift_occasion") {
    interests.push("Gift shopping", "Luxury gifting", "Anniversary gifts", "Birthday gifts");
  }
  if (type === "launch" || type === "category_demand") {
    interests.push("New arrivals", "Brand launches", "Early adopters");
  }

  // --- PLACEMENTS (Reels best ROAS from data: 7.45x vs Stories 3.47x) ---
  let placements: string[];
  if (["cricket", "entertainment", "celebrity", "social_trend", "aesthetic"].includes(type)) {
    placements = ["Instagram Reels (best ROAS — 7.45x)", "Instagram Stories", "YouTube Shorts", "Facebook Reels"];
  } else if (["competitor", "search_trend", "salary_cycle"].includes(type)) {
    placements = ["Google Shopping", "Google Search", "Instagram Feed", "Instagram Reels (best ROAS — 7.45x)"];
  } else {
    placements = ["Instagram Reels (best ROAS — 7.45x)", "Instagram Stories", "Instagram Feed", "Facebook Feed", "Google Shopping"];
  }

  // --- DEVICES (Android 2.5x better ROAS from 144 Cr data: 9.52x vs 3.60x) ---
  const devices = ["Mobile — Android priority (9.52x ROAS vs iOS 3.60x)", "Mobile — iOS", "Desktop"];

  // --- AUDIENCES ---
  let audiences: string[];
  if (["wedding", "life_event"].includes(type)) {
    audiences = ["Lookalike 1-3% of purchasers", "Interest: Wedding planning + Luxury", "Engaged shoppers 30d"];
  } else if (["festival", "auspicious_day", "festival_fashion"].includes(type)) {
    audiences = ["Lookalike 1-3% of festive season purchasers", "Interest: Festival shopping + Fashion"];
  } else if (["competitor", "search_trend"].includes(type)) {
    audiences = ["Cart abandoners 7d", "Product viewers 14d", "Wishlist users 30d", "Lookalike 1-3% of purchasers"];
  } else if (type === "salary_cycle") {
    audiences = ["IT professionals in Bangalore/Hyderabad/Pune", "Lookalike 1-3% of high-AOV purchasers"];
  } else if (type === "gift_occasion") {
    audiences = ["Lookalike 1-3% of gift purchasers", "Interest: Gift shopping + Luxury brands"];
  } else {
    audiences = ["Lookalike 1-5% of all purchasers", "Broad with Advantage+ optimization"];
  }

  // --- EXCLUSIONS ---
  let exclusions: string[];
  if (["competitor", "search_trend"].includes(type)) {
    exclusions = ["Purchasers last 30d", "Low-value browsers (visited < 2 pages)"];
  } else {
    exclusions = ["Existing purchasers last 7d"];
  }
  if (bench.intentLevel === "high") {
    exclusions.push("Low-value browsers (visited < 2 pages)");
  }
  // Deduplicate
  exclusions = [...new Set(exclusions)];

  // --- LANGUAGES ---
  let languages = ["English", "Hindi"];
  if (signalText.includes("karnataka") || signalText.includes("bangalore") || signalText.includes("bengaluru")) {
    languages.push("Kannada");
  } else if (signalText.includes("tamil") || signalText.includes("chennai")) {
    languages.push("Tamil");
  } else if (signalText.includes("telugu") || signalText.includes("hyderabad")) {
    languages.push("Telugu");
  } else if (signalText.includes("maharashtra") || signalText.includes("mumbai") || signalText.includes("pune")) {
    languages.push("Marathi");
  } else if (signalText.includes("kolkata") || signalText.includes("bengal")) {
    languages.push("Bengali");
  } else if (signalText.includes("kerala") || signalText.includes("kochi")) {
    languages.push("Malayalam");
  }

  // --- OPTIMIZATION GOAL (by signal intent level) ---
  let optimizationGoal: string;
  if (["wedding", "festival", "life_event", "competitor", "search_trend", "salary_cycle",
       "gift_occasion", "auspicious_day", "launch", "sale_event", "festival_fashion"].includes(type)) {
    optimizationGoal = "Purchase";
  } else if (["weather", "social_trend", "aesthetic", "category_demand", "occasion_dressing",
              "inventory", "travel", "runway"].includes(type)) {
    optimizationGoal = "Add to Cart";
  } else {
    optimizationGoal = "Landing Page Views";
  }

  return {
    ageRange,
    gender,
    interests,
    placements,
    devices,
    audiences,
    exclusions,
    languages,
    optimizationGoal,
  };
}

function getBudgetForSignal(signal: Signal): string {
  // Cricket and entertainment are awareness plays — lower budget, don't overspend
  if (signal.type === "cricket" || signal.type === "entertainment") {
    return "INR 8,000-15,000/day";
  }
  switch (signal.severity) {
    case "critical": return "INR 50,000-80,000/day";
    case "high": return "INR 30,000-50,000/day";
    case "medium": return "INR 15,000-30,000/day";
    default: return "INR 5,000-15,000/day";
  }
}

function getDurationForSignal(signal: Signal): string {
  if (signal.type === "celebrity") return "3-5 days (viral window)";
  if (signal.type === "festival") return "Until festival day + 3 days post";
  if (signal.type === "weather") return "Until weather changes (auto-pause)";
  if (signal.type === "cricket") return "Match day only (dayparted 6-11 PM)";
  if (signal.type === "salary_cycle" && signal.title.includes("Payday")) return "3 days (1st-3rd)";
  return "7-14 days";
}

function generateMetaGuide(signal: Signal): string {
  const archetypes = signal.targetArchetypes.join(", ");
  return `META ADS SETUP:
1. Campaign: Advantage+ Shopping Campaign (ASC)
2. Objective: Sales (Conversions)
3. Budget: ${getBudgetForSignal(signal)} on Meta portion
4. Audience: Broad targeting with ${signal.location} geo. Let Meta AI optimize.
   Upload Custom Audience of ${archetypes} if available.
5. Placements: ${getFormatsForSignal(signal).filter(f => f.includes("Instagram")).join(", ")}
6. Creative: Use brand sandbox images. ${signal.triggersWhat}
7. Bidding: ${signal.severity === "critical" ? "Highest Volume (capture reach fast)" : "Cost Cap at INR 4,000 CPA"}
8. Schedule: ${getTimingForSignal(signal)}`;
}

function generateGoogleGuide(signal: Signal): string {
  return `GOOGLE ADS SETUP:
1. Campaign: Performance Max
2. Budget: ${getBudgetForSignal(signal)} on Google portion
3. Asset Group: Create for "${signal.title.split("—")[0].trim()}"
4. Headlines: Use the sample headlines above (3 min, 15 max)
5. Descriptions: Use sample primary texts above
6. Images: Brand sandbox lifestyle images + product shots
7. Audience Signals: Upload customer list. Add "Luxury Shoppers" affinity.
8. Location: ${signal.location}
9. Bidding: Maximize Conversion Value ${signal.severity === "critical" ? "(no target initially)" : "with Target ROAS 3.5x"}`;
}

// ============================================================
// DISK-BACKED SIGNAL CACHE — survives PM2 restarts
// ============================================================

import fs from "fs";
import path from "path";

const SIGNAL_CACHE_FILE = path.join(process.cwd(), ".cache", "signals-live.json");

interface SignalCache {
  signals: Signal[];
  fetchedAt: string;
  sources: ReturnType<typeof getSignalSourceStatus>;
}

let signalCache: SignalCache | null = null;
let cacheRefreshing = false;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function saveSignalCacheToDisk(cache: SignalCache) {
  try {
    fs.mkdirSync(path.dirname(SIGNAL_CACHE_FILE), { recursive: true });
    fs.writeFileSync(SIGNAL_CACHE_FILE, JSON.stringify(cache), "utf-8");
  } catch (err) {
    console.error("[Signals] Disk write failed:", err);
  }
}

function loadSignalCacheFromDisk(): SignalCache | null {
  try {
    const raw = fs.readFileSync(SIGNAL_CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed?.signals?.length > 0) return parsed;
  } catch {}
  return null;
}

// Load from disk on startup — instant data, no waiting
const diskCache = loadSignalCacheFromDisk();
if (diskCache) {
  signalCache = diskCache;
  console.log(`[Signals] Loaded ${diskCache.signals.length} signals from disk (fetched: ${diskCache.fetchedAt})`);
}

// Always refresh in background on startup, then every hour
setTimeout(() => {
  console.log("[Signals] Background refresh starting...");
  refreshCache().catch(err => console.error("[Signals] Startup refresh failed:", err));
}, 2000);

// Reliable hourly refresh — setInterval never breaks even if a refresh fails
setInterval(() => {
  console.log("[Signals] Scheduled hourly refresh...");
  refreshCache().catch(err => console.error("[Signals] Hourly refresh error:", err));
}, CACHE_TTL_MS);

// Pre-warm all Intelligence page caches after signals cache is built
// This ensures all pages load instantly, even after PM2 restart
setTimeout(async () => {
  const port = process.env.PORT || 3200;
  const base = `http://localhost:${port}`;
  const endpoints = [
    "/api/celebrity-moments",
    "/api/trend-intel",
    "/api/price-intel",
    "/api/smart-intel",
    "/api/competitors",
  ];
  for (const ep of endpoints) {
    try {
      await fetch(`${base}${ep}`, { signal: AbortSignal.timeout(180000) });
      console.log(`[Prewarm] ${ep} done`);
    } catch (err: any) {
      console.error(`[Prewarm] ${ep} failed:`, err.message);
    }
  }
  console.log("[Prewarm] All Intelligence caches warmed");
}, 10000); // Wait 10s for server to be ready

async function refreshCache(force = false): Promise<SignalCache> {
  if (cacheRefreshing && signalCache && !force) return signalCache;
  cacheRefreshing = true;

  try {
    console.log("[Signals] Refreshing signal cache...");
    const start = Date.now();
    const signals = await getAllSignals();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[Signals] Cache refreshed: ${signals.length} signals in ${elapsed}s`);

    signalCache = {
      signals,
      fetchedAt: new Date().toISOString(),
      sources: getSignalSourceStatus(),
    };

    saveSignalCacheToDisk(signalCache);

    return signalCache;
  } catch (err) {
    console.error("[Signals] Cache refresh error:", err);
    if (signalCache) return signalCache;
    throw err;
  } finally {
    cacheRefreshing = false;
  }
}

function getCachedSignals(): SignalCache | null {
  if (!signalCache) return null;
  return signalCache;
}


// ============================================================
// INDIA RELEVANCE FLAGS
// Post-processes recommendations with India-specific relevance scoring
// ============================================================

function addIndiaRelevance(rec: any): any {
  const title = (rec.title || "").toLowerCase();
  const direction = (rec.creative?.direction || "").toLowerCase();
  const signalType = rec.signalType || "";

  let score: "high" | "medium" | "low" = "medium";
  let note = "";

  // HIGH relevance
  if (title.includes("quiet luxury") || title.includes("quietluxury")) {
    score = "high"; note = "Quiet Luxury: 61.1 search interest in India, fastest growing aesthetic trend";
  } else if (title.includes("wedding") || signalType === "wedding" || signalType === "life_event") {
    score = "high"; note = "Wedding season drives 30-60% uplift in luxury purchases across India";
  } else if (title.includes("coach tabby") || (title.includes("coach") && direction.includes("bag"))) {
    score = "high"; note = "Coach: 100x growth in India (2021-2026), #1 accessible luxury brand";
  } else if (title.includes("old money") || title.includes("oldmoney")) {
    score = "high"; note = "Old Money Aesthetic: 19.0 search interest, growing steadily in India";
  } else if (signalType === "salary_cycle") {
    score = "high"; note = "Appraisal season: 14-22% uplift in luxury shopping in India IT hubs";
  } else if (direction.includes("fragrance") || direction.includes("perfume")) {
    score = "high"; note = "Fragrances: #1 luxury product search in India, 20-25% CAGR growth";
  } else if (title.includes("swarovski")) {
    score = "high"; note = "Swarovski: highest searched accessories brand in India (49.6 avg interest)";
  }
  // Celebrity pairing confidence
  else if ((title.includes("deepika") && title.includes("hugo boss")) || (title.includes("deepika") && direction.includes("boss"))) {
    score = "high"; note = "Deepika is BOSS brand ambassador -- only celebrity pairing with organic search signal (2.3)";
  } else if (title.includes("alia") && direction.includes("coach")) {
    score = "high"; note = "Alia Bhatt + Coach: both have strongest independent search in India. Best ROI potential";
  }
  // MEDIUM relevance
  else if (signalType === "competitor") {
    score = "medium"; note = "Conquest campaign -- Ajio Luxe (11.7) vs Tata CLiQ Luxury (12.5) are neck-and-neck in India";
  } else if (title.includes("versace") && direction.includes("sunglasses")) {
    score = "medium"; note = "Versace sunglasses: 10.0 search interest. Moderate -- Ray-Ban dominates India sunglasses (47.5)";
  } else if ((title.includes("hugo boss") && direction.includes("tailoring")) || direction.includes("suit")) {
    score = "medium"; note = "Hugo Boss suits: Indians search Boss more for perfume and shirts than suits. Reframe to Boss wardrobe, not just suits";
  } else if (title.includes("prada") && direction.includes("bag")) {
    score = "medium"; note = "Prada bags: 2.6 avg search in India. Aspirational but low volume -- use for brand campaigns, not performance";
  } else if (title.includes("coquette") || title.includes("bow era")) {
    score = "medium"; note = "Coquette/Bow Era: 2.9 search interest in India. Very niche -- target fashion-forward women only";
  } else if (title.includes("tomato girl")) {
    score = "medium"; note = "Tomato Girl: 8.4 search interest. Seasonal summer only, moderate relevance";
  } else if (signalType === "celebrity") {
    score = "medium"; note = "Celebrity pairing has near-zero organic search in India -- ad will CREATE association, not amplify it. Test with small budget first";
  }
  // LOW relevance
  else if (title.includes("mob wife")) {
    score = "low"; note = "Mob Wife Aesthetic: ZERO search in India. Relabel as Bold Maximalist -- the leopard/gold aesthetic sells for Indian parties & weddings, but not under this Western label";
  } else if (title.includes("butter yellow")) {
    score = "low"; note = "Butter Yellow trend: ZERO search in India. Indians wear yellow for Haldi/Vasant Panchami -- route through festival signals, not trend signals";
  } else if (title.includes("diesel 1dr") || (title.includes("diesel") && direction.includes("bag"))) {
    score = "low"; note = "Diesel 1DR: ZERO search in India despite global buzz. Display/social ads can create demand, but do NOT run Google Search ads for this product";
  } else if (title.includes("siddhant") && direction.includes("diesel")) {
    score = "low"; note = "Siddhant + Diesel: weakest celebrity pairing -- both have very low search in India. Test with INR 10-15K/day max";
  } else if (title.includes("sobhita") && direction.includes("max mara")) {
    score = "low"; note = "Sobhita + Max Mara: Max Mara India search is 1.2 avg, Sobhita is too niche. Instagram-only play, not platform traffic driver";
  } else if (title.includes("designer sneakers")) {
    score = "low"; note = "Designer sneakers: 8.1 search in India. Luxury sneaker culture is 3-5 years behind the West -- early stage market";
  }

  // Jimmy Choo keyword guidance
  if (rec.creative?.brands?.includes("Jimmy Choo") && signalType !== "wedding") {
    if (!note) note = "";
    note += " | Jimmy Choo: 54% of India searches are for 'Jimmy Choo fabric' (textile pattern). Use 'Jimmy Choo shoes/heels/bridal' as keywords, NOT just 'Jimmy Choo'";
  }

  return { ...rec, indiaRelevance: { score, note } };
}


// ============================================================
// SOURCE URL GENERATOR — clickable links to external signal sources
// ============================================================

function getSourceUrl(signal: Signal): string | null {
  const type = signal.type;
  const title = signal.title || "";
  const data = signal.data || {};

  switch(type) {
    case "celebrity":
      if (data.url) return data.url;
      if (data.articleUrl) return data.articleUrl;
      const celebName = title.match(/^(.+?) trending/)?.[1] || "";
      if (celebName) return `https://news.google.com/search?q=${encodeURIComponent(celebName + " fashion")}`;
      return null;

    case "search_trend": {
      const product = title.match(/Trending.*?: (.+?) —/)?.[1] || "";
      if (product) return `https://trends.google.com/trends/explore?geo=IN&q=${encodeURIComponent(product)}`;
      return null;
    }

    case "social_trend": {
      const hashtag = title.match(/#(\w+)/)?.[1] || "";
      if (hashtag) return `https://www.instagram.com/explore/tags/${hashtag}/`;
      const trend = title.match(/Trending: "(.+?)"/)?.[1] || "";
      if (trend) return `https://trends.google.com/trends/explore?geo=IN&q=${encodeURIComponent(trend)}`;
      return null;
    }

    case "cricket":
      return "https://www.espncricinfo.com/live-cricket-score";

    case "weather": {
      const city = signal.location || "";
      if (city && city !== "Pan India") return `https://weather.com/en-IN/weather/today/l/${encodeURIComponent(city)}`;
      return "https://weather.com/en-IN/";
    }

    case "festival": {
      const festName = title.match(/^(.+?)(?:\s+—|\s+Fashion|\s+\()/)?.[1] || title.split(" — ")[0] || "";
      if (festName) return `https://www.google.com/search?q=${encodeURIComponent(festName + " 2026 India")}`;
      return null;
    }

    case "wedding":
      return "https://www.google.com/search?q=indian+wedding+season+2026+dates";

    case "auspicious_day": {
      const dayName = title.split(" — ")[0] || title.split("(")[0] || "";
      if (dayName) return `https://www.google.com/search?q=${encodeURIComponent(dayName.trim() + " 2026 date")}`;
      return null;
    }

    case "launch": {
      const brand = title.match(/^(\w[\w\s]+?) new launch/)?.[1] || "";
      if (brand) return `https://www.google.com/search?q=${encodeURIComponent(brand + " new collection 2026")}`;
      return null;
    }

    case "runway": {
      const runwayTrend = title.match(/Runway-to-Retail: "(.+?)"/)?.[1] || "";
      if (runwayTrend) return `https://www.google.com/search?q=${encodeURIComponent(runwayTrend + " fashion trend 2026")}`;
      return null;
    }

    case "fashion_event":
      return "https://www.google.com/search?q=fashion+week+2026+schedule";

    case "entertainment":
    case "ott_release":
      return "https://www.google.com/search?q=new+bollywood+movies+2026";

    case "aesthetic": {
      const aesName = title.match(/"(.+?)"/)?.[1] || "";
      if (aesName) return `https://trends.google.com/trends/explore?geo=IN&q=${encodeURIComponent(aesName)}`;
      return null;
    }

    case "gift_occasion":
      return null;

    case "occasion_dressing": {
      const occasion = title.split(" — ")[0] || "";
      if (occasion) return `https://trends.google.com/trends/explore?geo=IN&q=${encodeURIComponent(occasion)}`;
      return null;
    }

    case "sale_event":
      return "https://luxe.ajio.com/";

    case "travel":
      return "https://www.google.com/search?q=long+weekends+india+2026";

    case "competitor":
      if (title.includes("TataCLiQ")) return "https://www.tatacliq.com/luxury";
      if (title.includes("Myntra")) return "https://www.myntra.com/luxe";
      if (title.includes("Amazon")) return "https://www.amazon.in/luxury-beauty";
      if (title.includes("Farfetch")) return "https://www.farfetch.com/in/";
      return null;

    default:
      return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";
  const mode = searchParams.get("mode") || "full"; // "full" | "signals" | "summary" | "status"
  const tiersParam = searchParams.get("tiers") || "luxury,premium,accessible";
  const activeTiers = tiersParam.split(",").filter(t => ["luxury", "premium", "accessible"].includes(t)) as BrandTier[];
  const forceRefresh = searchParams.get("refresh") === "true";

  try {
    if (mode === "status") {
      return NextResponse.json({ sources: getSignalSourceStatus() });
    }

    if (mode === "summary") {
      const summary = await getSignalSummary();
      return NextResponse.json(summary);
    }

    // Use cache for fast loading — refresh in background if stale
    let cache = getCachedSignals();
    if (!cache || forceRefresh) {
      if (cache && !forceRefresh) {
        // Stale cache exists — serve it and refresh in background
        refreshCache().catch(() => {});
      } else {
        // No cache at all or forced refresh — must wait
        cache = await refreshCache(forceRefresh);
      }
    } else {
      // Cache is fresh — check if approaching staleness, pre-refresh in background
      const age = Date.now() - new Date(cache.fetchedAt).getTime();
      if (age > CACHE_TTL_MS * 0.8) {
        refreshCache().catch(() => {}); // Pre-refresh at 80% TTL
      }
    }

    let signals = cache!.signals;

    if (category !== "all") {
      signals = signals.filter(s => s.type === category);
    }

    if (mode === "signals") {
      const enrichedSigs = signals.map(s => ({
        ...s,
        signalCategory: EXTERNAL_TYPES.has(s.type) ? "external" as const : "internal" as const,
        dataSource: DATA_SOURCES[s.type] || "LUXE AI Intelligence Engine",
        sourceUrl: getSourceUrl(s),
      }));
      return NextResponse.json({ signals: enrichedSigs, count: enrichedSigs.length, fetchedAt: cache!.fetchedAt });
    }

    // Default "full" mode: signals + ad recommendations
    // ============================================================
    // SMART RECOMMENDATION ENGINE
    // No hardcoded caps. Show ALL signals that are genuinely actionable.
    // Quality filters only: is it actionable? does it have positive ROAS? is it relevant?
    // ============================================================

    const userBrandNames = new Set(
      activeTiers.flatMap(t => getBrandsByTier(t)).map(b => b.name.toLowerCase())
    );

    // Step 1: Filter to actionable signals only (no arbitrary type exclusions)
    const actionable = signals.filter(s => {
      // Must be at least medium severity
      if (s.severity === "low") return false;
      // Must have confidence > 0.5
      if (s.confidence < 0.5) return false;
      // Brand relevance: universal signals pass, brand-specific need overlap
      const universalTypes = ["festival", "life_event", "salary_cycle", "auspicious_day",
        "weather", "gift_occasion", "sale_event", "fashion_event", "wedding",
        "category_demand", "aesthetic", "runway", "launch", "economic"];
      if (!universalTypes.includes(s.type)) {
        const signalBrands = s.suggestedBrands.map(b => b.toLowerCase());
        if (!signalBrands.some(b => userBrandNames.has(b))) return false;
      }
      return true;
    });

    // Step 2: Aggressive deduplication
    const deduped: Signal[] = [];
    const seenKeys = new Set<string>();
    const seenBrandType = new Set<string>();
    for (const s of actionable) {
      const brand = s.suggestedBrands[0]?.toLowerCase() || "";

      // Key 1: Same type + same brand = duplicate (e.g. two Hugo Boss competitor signals)
      const brandTypeKey = `${s.type}:${brand}`;
      if (seenBrandType.has(brandTypeKey) && s.type !== "life_event" && s.type !== "wedding") {
        continue;
      }

      // Key 2: Extract the CORE concept and dedup across sources
      // "quiet luxury outfit" trend, "#QuietLuxury" hashtag, "Quiet Luxury" aesthetic = same thing
      const rawTitle = s.title.toLowerCase()
        .replace(/["'""#]/g, "")
        .replace(/trending|trend|aesthetic|campaign|ride the wave|creative direction|use this|edit|demand|surging|growing|moment marketing/gi, "")
        .replace(/\b(the|a|an|in|of|for|is|and|to|on|at|by|india)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      // Split camelCase hashtags: "QuietLuxury" → "quiet luxury"
      const expanded = rawTitle.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
      const titleCore = expanded.split(/\s+/).filter(w => w.length > 2).sort().slice(0, 2).join(" ");
      if (titleCore.length > 4 && seenKeys.has(titleCore)) {
        continue;
      }

      seenKeys.add(titleCore);
      seenBrandType.add(brandTypeKey);
      deduped.push(s);
    }

    // Step 3: Build predictions and filter by ROAS (only show positive-ROI recommendations)
    // Fetch data-driven targeting per signal type (cached 6hrs in Redis per type)
    const targetingCache = new Map<string, TargetingRecommendation | null>();
    async function getTargetingForType(signalType: string, location?: string): Promise<TargetingRecommendation | null> {
      const key = signalType + ":" + (location || "pan");
      if (targetingCache.has(key)) return targetingCache.get(key)!;
      try {
        const result = await getDataDrivenTargeting(signalType, undefined, location);
        targetingCache.set(key, result);
        return result;
      } catch (err) {
        console.error(`[TargetingEngine] Failed for type=${signalType}:`, err);
        targetingCache.set(key, null);
        return null;
      }
    }

    const allRecs = await Promise.all(deduped.map(async (s) => {
      const targeting = await getTargetingForType(s.type, s.location);
      return generateAdRecommendation(s, activeTiers, targeting);
    }));
    const positiveROI = allRecs.filter(r => {
      const roasStr = r.prediction.estimatedROAS || "0";
      const minROAS = parseFloat(roasStr.split("-")[0]) || 0;
      return minROAS >= 1.0; // Must be at least breakeven — no money-losing recommendations
    });

    // Step 4: Sort by ROAS (best first), then severity
    const SEVERITY_RANK_MAP: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    positiveROI.sort((a, b) => {
      // Sort by priority first
      const priRank: Record<string, number> = { urgent: 0, high: 1, medium: 2, opportunity: 3 };
      const priDiff = (priRank[a.priority] ?? 3) - (priRank[b.priority] ?? 3);
      if (priDiff !== 0) return priDiff;
      // Then by ROAS (higher first)
      const roasA = parseFloat(a.prediction.estimatedROAS?.split("-")[1] || "0");
      const roasB = parseFloat(b.prediction.estimatedROAS?.split("-")[1] || "0");
      return roasB - roasA;
    });

    const recommendations = positiveROI.map(addIndiaRelevance);

    // Persist signals + recommendations to DB for the learning flywheel (fire-and-forget)
    persistToFlywheel(signals, recommendations).catch(err =>
      console.error("[Flywheel] Persist error (non-blocking):", err)
    );

    // Enrich signals with category and data source
    const enrichedSignals = signals.map(s => ({
      ...s,
      signalCategory: EXTERNAL_TYPES.has(s.type) ? "external" as const : "internal" as const,
      dataSource: DATA_SOURCES[s.type] || "LUXE AI Intelligence Engine",
      sourceUrl: getSourceUrl(s),
    }));

    const externalCount = enrichedSignals.filter(s => s.signalCategory === "external").length;
    const internalCount = enrichedSignals.filter(s => s.signalCategory === "internal").length;

    return NextResponse.json({
      signals: enrichedSignals,
      recommendations,
      signalCount: enrichedSignals.length,
      recommendationCount: recommendations.length,
      externalCount,
      internalCount,
      fetchedAt: cache!.fetchedAt,
      sources: cache!.sources,
    });
  } catch (error) {
    console.error("[API] Signal fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch signals", details: String(error) },
      { status: 500 }
    );
  }
}

// ============================================================
// FLYWHEEL PERSISTENCE — save signals + recs to DB for learning
// ============================================================

async function persistToFlywheel(signals: Signal[], recommendations: any[]) {
  const today = new Date().toISOString().split("T")[0];

  for (const signal of signals) {
    const signalLogId = `${signal.type}-${signal.id}-${today}`;

    // Upsert signal log
    try {
      await db.signalLog.upsert({
        where: { id: signalLogId },
        create: {
          id: signalLogId,
          signalId: signal.id,
          type: signal.type,
          source: signal.source,
          severity: signal.severity,
          confidence: signal.confidence,
          title: signal.title,
          description: signal.description,
          location: signal.location,
          data: signal.data || {},
          expiresAt: signal.expiresAt,
          detectedAt: signal.detectedAt,
        },
        update: {
          confidence: signal.confidence,
          severity: signal.severity,
          data: signal.data || {},
        },
      });
    } catch {
      // Skip duplicate/error — non-blocking
    }
  }

  for (const rec of recommendations) {
    const recId = rec.id; // Use the same ID the frontend sees
    const prediction = rec.prediction || {};

    try {
      // Parse ROAS range for CI bounds
      let roasLow: number | null = null;
      let roasHigh: number | null = null;
      if (prediction.estimatedROAS) {
        const match = prediction.estimatedROAS.match(/([\d.]+)-([\d.]+)/);
        if (match) {
          roasLow = parseFloat(match[1]);
          roasHigh = parseFloat(match[2]);
        }
      }

      // Parse CTR range
      let ctrVal: number | null = null;
      if (prediction.estimatedCTR) {
        const match = prediction.estimatedCTR.match(/([\d.]+)-([\d.]+)/);
        if (match) ctrVal = (parseFloat(match[1]) + parseFloat(match[2])) / 200; // avg as decimal
      }

      const signalLogId = `${rec.signalType}-${rec.signalId}-${today}`;

      await db.flywhRecommendation.upsert({
        where: { id: recId },
        create: {
          id: recId,
          signalLogId,
          signalType: rec.signalType,
          priority: rec.priority,
          title: rec.title,
          description: rec.description,
          tierMode: rec.tierMode || "all",
          creativePayload: rec.creative || {},
          targetingPayload: rec.targeting || {},
          budgetPayload: rec.budget || {},
          predictionPayload: prediction,
          predictedCtr: ctrVal,
          predictedConvRate: null,
          predictedRoas: roasLow && roasHigh ? (roasLow + roasHigh) / 2 : null,
          predictedRoasLow: roasLow,
          predictedRoasHigh: roasHigh,
          confidenceScore: (prediction.confidence || 75) / 100,
          modelVersion: "v1.0.0",
          status: "pending",
        },
        update: {
          predictionPayload: prediction,
          predictedRoas: roasLow && roasHigh ? (roasLow + roasHigh) / 2 : null,
          predictedRoasLow: roasLow,
          predictedRoasHigh: roasHigh,
          confidenceScore: (prediction.confidence || 75) / 100,
        },
      });
    } catch {
      // Skip — non-blocking
    }
  }
}
