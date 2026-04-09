import { NextResponse } from "next/server";
import { getCelebrityMoments, MONITORED_CELEBRITIES } from "@/lib/signals/celebrity-moments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get("brand") || "all";
  const urgency = searchParams.get("urgency") || "all";

  let moments = getCelebrityMoments();

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
