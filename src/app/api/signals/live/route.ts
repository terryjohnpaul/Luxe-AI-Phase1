import { NextResponse } from "next/server";
import { getAllSignals, getSignalSummary, getSignalSourceStatus } from "@/lib/signals/aggregator";
import type { Signal } from "@/lib/signals/types";
import { getBrandsByTier, type BrandTier, TIER_RULES } from "@/lib/signals/brand-config";
import { getHeroForContext, getTopHero, type HeroProduct } from "@/lib/signals/product-catalog";
import { db } from "@/lib/db";

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
  sale_event:   { baseCTR: 1.2, baseConvRate: 0.8, engagementMultiplier: 1.2, intentLevel: "high",   liftNote: "Platform sale events drive 3-5x conversion lift (Ajio internal benchmarks)" },
  occasion_dressing: { baseCTR: 0.85, baseConvRate: 0.6, engagementMultiplier: 1.0, intentLevel: "high", liftNote: "Occasion-specific search = must-buy intent (interview, wedding guest, date night)" },
  fashion_event: { baseCTR: 1.1, baseConvRate: 0.5, engagementMultiplier: 1.15, intentLevel: "high", liftNote: "Fashion week/award shows drive +100-300% luxury search spikes. Peak attention window." },
  wedding:       { baseCTR: 0.9, baseConvRate: 0.7, engagementMultiplier: 1.1, intentLevel: "high", liftNote: "Muhurat-dense wedding windows drive 3-5x luxury demand. Must-buy intent." },
  aesthetic:     { baseCTR: 0.95, baseConvRate: 0.35, engagementMultiplier: 1.1, intentLevel: "medium", liftNote: "Trending aesthetic = creative direction signal. Drives engagement and brand affinity." },
  runway:        { baseCTR: 0.8, baseConvRate: 0.3, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Runway-to-retail trend — 3-6 month demand wave starting. Early-mover advantage." },
  launch:        { baseCTR: 1.0, baseConvRate: 0.55, engagementMultiplier: 1.15, intentLevel: "high", liftNote: "Launch week = peak organic search. Paid ads during launch get 2-3x ROAS." },
  category_demand: { baseCTR: 0.85, baseConvRate: 0.45, engagementMultiplier: 1.0, intentLevel: "medium", liftNote: "Category-level demand shift. Reallocate budget to surging categories." },
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
  const tierAOV = isLuxuryOnly ? 12000 : isAccessibleOnly ? 3500 : 7000;

  // CPM: luxury fashion India is ₹250-400 on Meta, ₹150-250 on Google Display
  // Blended CPM accounts for Meta-heavy split
  const cpm = isLuxuryOnly ? 380 : isAccessibleOnly ? 180 : 280;
  const dailyBudget = parseBudgetMid(getBudgetForSignal(signal));
  const durationDays = signal.type === "cricket" ? 1 :
                       signal.type === "celebrity" ? 4 :
                       signal.type === "festival" ? 10 :
                       signal.type === "weather" ? 5 : 10;

  const totalBudget = dailyBudget * durationDays;
  const baseImpressions = (totalBudget / cpm) * 1000;
  // Only apply engagement multiplier to impressions (not severity — that affects CTR/conv separately)
  const impressions = Math.round(baseImpressions * bench.engagementMultiplier * tierReachMult);

  // CTR — apply severity OR confidence boost, not both compounding
  // Use the stronger of the two as primary, the other as a mild modifier
  const signalBoost = Math.max(severityMult, confidenceMult);
  const signalMinor = Math.min(severityMult, confidenceMult);
  const ctr = bench.baseCTR * signalBoost * (1 + (signalMinor - 1) * 0.3); // mild secondary effect
  const clicks = Math.round(impressions * (ctr / 100));

  // Conversion rate — same anti-compounding logic
  const convRate = bench.baseConvRate * signalBoost * tierConvMult;
  const conversions = Math.round(clicks * (convRate / 100));

  // ROAS = (conversions × AOV) / totalBudget
  const revenue = conversions * tierAOV;
  const roas = totalBudget > 0 ? revenue / totalBudget : 0;

  // Reach ≈ impressions / avg frequency (3-4 for fashion campaigns)
  const avgFrequency = signal.severity === "critical" ? 3.0 : 3.5;
  const reach = Math.round(impressions / avgFrequency);

  // Build reasoning factors — explain WHY we predict these numbers
  const factors: string[] = [];

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
function generateAdRecommendation(signal: Signal, tiers: BrandTier[] = ["luxury", "premium", "accessible"]) {
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
      location: signal.location,
      timing: getTimingForSignal(signal),
      platforms: getPlatformSplit(signal),
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
      return NextResponse.json({ signals, count: signals.length, fetchedAt: cache!.fetchedAt });
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
    const allRecs = deduped.map(s => generateAdRecommendation(s, activeTiers));
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

    const recommendations = positiveROI;

    // Persist signals + recommendations to DB for the learning flywheel (fire-and-forget)
    persistToFlywheel(signals, recommendations).catch(err =>
      console.error("[Flywheel] Persist error (non-blocking):", err)
    );

    return NextResponse.json({
      signals,
      recommendations,
      signalCount: signals.length,
      recommendationCount: recommendations.length,
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
