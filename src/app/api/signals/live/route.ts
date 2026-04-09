import { NextResponse } from "next/server";
import { getAllSignals, getSignalSummary, getSignalSourceStatus } from "@/lib/signals/aggregator";
import type { Signal } from "@/lib/signals/types";
import { getBrandsByTier, type BrandTier, TIER_RULES } from "@/lib/signals/brand-config";

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
    priority: signal.severity === "critical" ? "urgent" :
              signal.severity === "high" ? "high" :
              signal.severity === "medium" ? "medium" : "opportunity",

    title: signal.suggestedAction.split(".")[0],
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

    prediction: {
      confidence: Math.round(signal.confidence * 100),
      estimatedReach: signal.severity === "critical" ? "8-15 lakh" :
                      signal.severity === "high" ? "5-10 lakh" :
                      "2-5 lakh",
    },

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
  const brands = signal.suggestedBrands.slice(0, 2).join(" & ");

  switch (signal.type) {
    case "festival":
      headlines.push(`${signal.title.split(" in ")[0]} Ready?`);
      headlines.push(`Celebrate in Style`);
      headlines.push(`Festive Collection — ${brands}`);
      break;
    case "weather":
      if (signal.title.includes("heatwave") || signal.title.includes("42")) {
        headlines.push("Beat the Heat in Style");
        headlines.push("Summer Luxury Essentials");
        headlines.push("Stay Cool. Look Sharp.");
      } else if (signal.title.includes("rain")) {
        headlines.push("Monsoon Ready Fashion");
        headlines.push("Rain-Proof Style");
        headlines.push("Cozy Day, Elevated");
      } else if (signal.title.includes("cold")) {
        headlines.push("Layer Up in Luxury");
        headlines.push("Winter Warmth, Premium Style");
        headlines.push("The Jacket Edit");
      } else {
        headlines.push("Weekend Ready");
        headlines.push("Dress for the Day");
        headlines.push("Luxury Meets Sunshine");
      }
      break;
    case "salary_cycle":
      headlines.push("You Earned It");
      headlines.push("Level Up Your Wardrobe");
      headlines.push("The Upgrade You Deserve");
      break;
    case "cricket":
      headlines.push("Game Night, Elevated");
      headlines.push("Match Day Style");
      headlines.push("After-Party Ready");
      break;
    case "auspicious_day":
      headlines.push("Auspicious Beginnings");
      headlines.push("Shop on This Special Day");
      headlines.push("Start Something New");
      break;
    case "celebrity":
      headlines.push("The Look Everyone Wants");
      headlines.push("As Seen on Your Feed");
      headlines.push(`${brands} — Trending Now`);
      break;
    case "life_event":
      headlines.push("Dress for Every Ceremony");
      headlines.push("Wedding Season Edit");
      headlines.push("The Guest Who Stole the Show");
      break;
    case "entertainment":
      headlines.push("Inspired by the Screen");
      headlines.push("Get the Look");
      headlines.push("Trending Styles");
      break;
    default:
      headlines.push(`${brands} on Ajio Luxe`);
      headlines.push("Discover Premium Fashion");
      headlines.push("Your Style, Elevated");
  }
  return headlines;
}

function generatePrimaryTexts(signal: Signal): string[] {
  const brands = signal.suggestedBrands.slice(0, 3).join(", ");
  const texts: string[] = [];

  texts.push(`${signal.triggersWhat}. Shop ${brands} and more on Ajio Luxe.`);

  if (signal.type === "salary_cycle") {
    texts.push(`Hard work pays off. Reward yourself with pieces that match your ambition. ${brands} — now on Ajio Luxe.`);
  } else if (signal.type === "festival") {
    texts.push(`This festive season deserves outfits that stand out. Explore the curated collection from ${brands}.`);
  } else if (signal.type === "weather") {
    texts.push(`Weather-appropriate luxury that doesn't compromise on style. From ${brands}, curated for today.`);
  } else if (signal.type === "cricket") {
    texts.push(`From the stadium to the after-party. Look like a winner no matter the score. Premium casuals from ${brands}.`);
  } else {
    texts.push(`Discover what's trending now. Curated luxury fashion from ${brands} — only on Ajio Luxe.`);
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";
  const mode = searchParams.get("mode") || "full"; // "full" | "signals" | "summary" | "status"
  const tiersParam = searchParams.get("tiers") || "luxury,premium,accessible";
  const activeTiers = tiersParam.split(",").filter(t => ["luxury", "premium", "accessible"].includes(t)) as BrandTier[];

  try {
    if (mode === "status") {
      return NextResponse.json({ sources: getSignalSourceStatus() });
    }

    if (mode === "summary") {
      const summary = await getSignalSummary();
      return NextResponse.json(summary);
    }

    let signals = await getAllSignals();

    if (category !== "all") {
      signals = signals.filter(s => s.type === category);
    }

    if (mode === "signals") {
      return NextResponse.json({ signals, count: signals.length, fetchedAt: new Date().toISOString() });
    }

    // Default "full" mode: signals + ad recommendations
    const recommendations = signals
      .filter(s => s.severity === "critical" || s.severity === "high" || s.severity === "medium")
      .slice(0, 15) // Top 15 by priority
      .map(s => generateAdRecommendation(s, activeTiers));

    return NextResponse.json({
      signals,
      recommendations,
      signalCount: signals.length,
      recommendationCount: recommendations.length,
      fetchedAt: new Date().toISOString(),
      sources: getSignalSourceStatus(),
    });
  } catch (error) {
    console.error("[API] Signal fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch signals", details: String(error) },
      { status: 500 }
    );
  }
}
