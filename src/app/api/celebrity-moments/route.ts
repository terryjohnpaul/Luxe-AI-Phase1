import { NextResponse } from "next/server";
import { getCelebritySignals, MONITORED_CELEBRITIES } from "@/lib/signals/celebrity-moments";
import { cachedFetch, registerForPrewarm } from "@/lib/api-cache";

registerForPrewarm("celebrity-moments", getCelebritySignals);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get("brand") || "all";
  const urgency = searchParams.get("urgency") || "all";
  const forceRefresh = searchParams.get("refresh") === "true";

  const { data: signals } = await cachedFetch("celebrity-moments", getCelebritySignals, forceRefresh);

  // Map Signal[] to the CelebrityMoment shape the frontend expects
  let moments = signals.map((s, i) => {
    const celebrity = s.data?.celebrity || "Unknown";
    const event = s.data?.event || "News Mention";
    const platform = s.data?.platform || "paparazzi";
    const reach = s.data?.reach || "N/A";
    const brandName = s.suggestedBrands[0] || "Unknown";

    // Extract description parts
    const descParts = s.description.split("\n\nWHY THIS SIGNAL: ");
    const imageDescription = descParts[0] || s.description;
    const whySignal = descParts[1] || s.suggestedAction;

    // Map severity to urgency
    const urgencyVal: "immediate" | "24h" | "this_week" =
      s.severity === "critical" || s.severity === "high" ? "immediate"
        : s.severity === "medium" ? "24h"
        : "this_week";

    return {
      id: s.id,
      celebrity,
      event,
      brand: brandName,
      product: s.triggersWhat || `${brandName} Collection`,
      platform: platform as "instagram" | "paparazzi" | "event" | "movie" | "interview",
      imageDescription,
      detectedAt: s.detectedAt instanceof Date ? s.detectedAt.toISOString() : String(s.detectedAt),
      reach,
      fanBase: s.targetArchetypes[0] || "N/A",
      relevantAudience: s.targetArchetypes,
      adRecommendation: {
        headline: s.title,
        body: whySignal,
        cta: urgencyVal === "immediate" ? "Shop the Look" : "Ride the Moment",
        targeting: `Fans of ${celebrity}, ${s.targetArchetypes.join(", ")}`,
        platforms: ["Instagram Feed", "Instagram Stories", "Instagram Reels"],
        urgency: urgencyVal,
        estimatedImpact: s.suggestedAction,
      },
      brandTier: "premium" as const,
    };
  });

  if (brand !== "all") {
    moments = moments.filter(m => m.brand.toLowerCase().includes(brand.toLowerCase()));
  }
  if (urgency !== "all") {
    moments = moments.filter(m => m.adRecommendation.urgency === urgency);
  }

  const brands = [...new Set(moments.map(m => m.brand))];
  const immediateMoments = moments.filter(m => m.adRecommendation.urgency === "immediate");

  return NextResponse.json({
    moments,
    summary: {
      totalMoments: moments.length,
      immediatePriority: immediateMoments.length,
      brandsInvolved: brands.length,
      celebritiesActive: [...new Set(moments.map(m => m.celebrity))].length,
    },
    monitoredCelebrities: MONITORED_CELEBRITIES.map(c => ({
      name: c.name,
      followers: c.followers,
      affinityBrands: c.affinityBrands,
    })),
    fetchedAt: new Date().toISOString(),
  });
}
