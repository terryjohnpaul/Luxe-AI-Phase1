/**
 * Occasion Dressing Signals — luxury retailers
 * Always-on intent signals for specific dressing occasions.
 * People search for "what to wear to X" year-round.
 * Maps occasions to specific luxury retailers brands + products.
 * Source: Google Trends (via Apify) + always-on calendar logic
 */

import { Signal, signalId, expiresIn } from "./types";
import { scrapeGoogleTrends } from "@/lib/integrations/apify";
import { cachedApifyCall } from "@/lib/apify-cache";

interface OccasionType {
  occasion: string;
  searchTerms: string[];
  brands: string[];
  products: string[];
  targetAudience: string;
  adAngle: string;
  season: "always" | "wedding" | "summer" | "winter" | "festive";
}

const OCCASIONS: OccasionType[] = [
  {
    occasion: "Job Interview / New Job",
    searchTerms: ["what to wear to interview", "formal outfit men India", "office wear women luxury"],
    brands: ["Hugo Boss", "Emporio Armani", "Max Mara", "Paul Smith"],
    products: ["Hugo Boss slim-fit suit", "Emporio Armani blazer", "Max Mara structured dress", "Paul Smith shirt"],
    targetAudience: "Professionals 25-40, metro cities, IT/finance/consulting",
    adAngle: "First impressions are everything. Dress for the job you want. Hugo Boss suits from ₹25,000 on luxury retailers.",
    season: "always",
  },
  {
    occasion: "First Date",
    searchTerms: ["first date outfit", "what to wear on date night", "date night dress"],
    brands: ["Coach", "Self Portrait", "Sandro", "Maje", "Diesel"],
    products: ["Coach bag", "Self Portrait lace dress", "Sandro knit top", "Diesel leather jacket"],
    targetAudience: "Singles 22-35, metro cities",
    adAngle: "Make them remember you. Date night looks from Coach, Self Portrait, Sandro on luxury retailers.",
    season: "always",
  },
  {
    occasion: "Cocktail Party / Night Out",
    searchTerms: ["cocktail party outfit India", "party wear luxury", "night out dress"],
    brands: ["Versace", "Self Portrait", "Roberto Cavalli", "Jimmy Choo", "Cult Gaia"],
    products: ["Versace printed shirt", "Self Portrait cocktail dress", "Jimmy Choo heels", "Cult Gaia clutch"],
    targetAudience: "Social 25-40, party circuit, metro cities",
    adAngle: "Own the room. Cocktail party looks that turn heads. Versace, Jimmy Choo on luxury retailers.",
    season: "always",
  },
  {
    occasion: "Vacation / Resort Wear",
    searchTerms: ["resort wear India", "beach vacation outfit luxury", "Goa outfit ideas"],
    brands: ["Zimmermann", "Farm Rio", "Jacquemus", "Diesel", "Versace"],
    products: ["Zimmermann dress", "Farm Rio printed top", "Jacquemus mini bag", "Diesel swimwear"],
    targetAudience: "Travelers 25-45, planning Goa/Maldives/Bali trips",
    adAngle: "Vacation starts when you pack. Resort wear from Zimmermann, Farm Rio on luxury retailers.",
    season: "summer",
  },
  {
    occasion: "Wedding Guest",
    searchTerms: ["wedding guest outfit India", "what to wear Indian wedding", "sangeet outfit luxury"],
    brands: ["Hugo Boss", "Versace", "Max Mara", "Jimmy Choo", "Self Portrait"],
    products: ["Hugo Boss suit", "Versace silk shirt", "Max Mara gown", "Jimmy Choo heels", "Self Portrait midi dress"],
    targetAudience: "Wedding guests 25-45, wedding season Oct-Feb + Apr",
    adAngle: "The guest who stole the show. Wedding looks from Hugo Boss, Versace, Jimmy Choo on luxury retailers.",
    season: "wedding",
  },
  {
    occasion: "Board Meeting / Investor Pitch",
    searchTerms: ["power dressing India", "executive outfit luxury", "boardroom fashion"],
    brands: ["Hugo Boss", "Emporio Armani", "Max Mara", "TUMI"],
    products: ["Hugo Boss double-breasted blazer", "Emporio Armani suit", "Max Mara coat", "TUMI briefcase"],
    targetAudience: "CXOs, founders, senior professionals 30-50",
    adAngle: "Command the room. Power dressing from Hugo Boss, Emporio Armani on luxury retailers.",
    season: "always",
  },
  {
    occasion: "Weekend Brunch",
    searchTerms: ["brunch outfit ideas", "casual luxury outfit", "weekend wear premium"],
    brands: ["Lacoste", "Ami Paris", "Maison Kitsune", "Sandro", "Kenzo"],
    products: ["Lacoste polo", "Ami Paris heart tee", "Maison Kitsune fox sweatshirt", "Sandro casual blazer"],
    targetAudience: "Urban 25-40, weekend socializers",
    adAngle: "Effortlessly chic. Brunch-ready looks from Ami Paris, Sandro on luxury retailers.",
    season: "always",
  },
  {
    occasion: "Gym to Street / Athleisure",
    searchTerms: ["luxury athleisure India", "premium gym wear", "Y-3 outfit"],
    brands: ["Y-3", "Diesel", "Hugo Boss", "Kenzo", "A-Cold-Wall"],
    products: ["Y-3 sneakers", "Diesel joggers", "Hugo Boss track jacket", "Kenzo sport sweatshirt"],
    targetAudience: "Fitness-conscious 22-38, metro cities",
    adAngle: "From gym to coffee. Premium athleisure from Y-3, Diesel on luxury retailers.",
    season: "always",
  },
];

async function fetchOccasionTrends(): Promise<Record<string, number>> {
  if (!process.env.APIFY_API_TOKEN) return {};

  try {
    const searchTerms = OCCASIONS.slice(0, 4).map(o => o.searchTerms[0]);
    const { data: result } = await cachedApifyCall("occasion-dressing", () =>
      scrapeGoogleTrends(searchTerms, "IN")
    );
    if (!result.success) return {};

    const trends: Record<string, number> = {};
    for (const item of result.data) {
      const term = (item.searchTerm || item.keyword || "").toLowerCase();
      const interest = item.interestOverTime || item.timelineData || [];
      const values = Array.isArray(interest) ? interest.map((p: any) => p.value || p.values?.[0] || 0) : [];
      const avg = values.length > 0 ? values.slice(-7).reduce((a: number, b: number) => a + b, 0) / Math.min(values.length, 7) : 0;
      trends[term] = avg;
    }
    return trends;
  } catch {
    return {};
  }
}

export async function getOccasionDressingSignals(): Promise<Signal[]> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const signals: Signal[] = [];

  const trends = await fetchOccasionTrends();

  for (const occ of OCCASIONS) {
    // Filter by season
    if (occ.season === "wedding" && !(month >= 10 || month <= 2 || month === 4)) continue;
    if (occ.season === "summer" && !(month >= 3 && month <= 6)) continue;
    if (occ.season === "winter" && !(month >= 10 || month <= 1)) continue;

    // Check if Google Trends shows interest
    const trendScore = occ.searchTerms.reduce((max, term) => {
      const score = trends[term.toLowerCase()] || 0;
      return Math.max(max, score);
    }, 0);

    const hasTrendData = trendScore > 0;
    const severity = trendScore > 70 ? "high" as const : trendScore > 40 ? "medium" as const : "low" as const;

    signals.push({
      id: signalId("occasion", occ.occasion.toLowerCase().replace(/\s+/g, "-")),
      type: "life_event",
      source: hasTrendData ? "occasion-trends (live)" : "occasion-intelligence",
      title: `${occ.occasion} — ${occ.brands.slice(0, 3).join(", ")} opportunity`,
      description: `${occ.adAngle}\n\nPRODUCTS: ${occ.products.join(", ")}.\nAUDIENCE: ${occ.targetAudience}.${hasTrendData ? `\nGOOGLE TREND SCORE: ${Math.round(trendScore)}/100 — ${trendScore > 60 ? "high search interest" : "moderate interest"}.` : ""}`,
      location: "Pan India",
      severity: occ.season === "always" ? "low" : severity,
      triggersWhat: occ.products.join(", "),
      targetArchetypes: ["Urban Achiever", "Occasional Splurger"],
      suggestedBrands: occ.brands,
      confidence: hasTrendData ? 0.85 : 0.7,
      suggestedAction: `Run "${occ.occasion}" campaign on luxury retailers. Push ${occ.brands.slice(0, 2).join(" + ")}. Target: ${occ.targetAudience}. ${occ.adAngle}`,
      expiresAt: expiresIn(168), // 7 days
      data: { occasion: occ.occasion, trendScore, season: occ.season },
      detectedAt: now,
    });
  }

  return signals;
}
