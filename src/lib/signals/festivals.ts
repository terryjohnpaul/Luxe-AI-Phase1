/**
 * Indian Festival Calendar — 30+ festivals with dynamic dates
 * Covers: Hindu, Muslim, Christian, Sikh, regional festivals
 * Source: Static calendar + lunar date calculations
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

interface Festival {
  name: string;
  date2026: string;        // YYYY-MM-DD for 2026
  type: "national" | "hindu" | "muslim" | "christian" | "sikh" | "regional";
  regions: string[];       // Which states/cities it matters in
  daysBeforeToSignal: number; // When to start signaling (ads lead time)
  fashionImpact: "very_high" | "high" | "medium" | "low";
  whatToSell: string;
  targetArchetypes: string[];
  suggestedBrands: string[];
}

const FESTIVAL_CALENDAR_2026: Festival[] = [
  // === NATIONAL / PAN-INDIA ===
  { name: "Republic Day", date2026: "2026-01-26", type: "national", regions: ["Pan India"], daysBeforeToSignal: 7, fashionImpact: "medium", whatToSell: "Tricolor accessories, ethnic wear, patriotic fashion", targetArchetypes: ["All"], suggestedBrands: ["Hugo Boss", "All Saints"] },
  { name: "Valentine's Day", date2026: "2026-02-14", type: "national", regions: ["Pan India"], daysBeforeToSignal: 14, fashionImpact: "high", whatToSell: "Couple outfits, gifting accessories, date-night looks, lingerie", targetArchetypes: ["Urban Achiever", "Fashion Loyalist", "Aspirant"], suggestedBrands: ["Michael Kors", "Coach", "Hugo Boss", "Jimmy Choo"] },
  { name: "Holi", date2026: "2026-03-17", type: "hindu", regions: ["Pan India", "Delhi NCR", "UP", "Rajasthan", "Gujarat"], daysBeforeToSignal: 10, fashionImpact: "very_high", whatToSell: "White party wear (pre-Holi), wardrobe refresh (post-Holi), sunglasses", targetArchetypes: ["All"], suggestedBrands: ["Diesel", "Hugo Boss", "Kenzo", "Farm Rio"] },
  { name: "Gudi Padwa", date2026: "2026-03-29", type: "hindu", regions: ["Mumbai", "Maharashtra", "Pune"], daysBeforeToSignal: 10, fashionImpact: "high", whatToSell: "Ethnic luxury, new beginnings wardrobe, traditional fusion", targetArchetypes: ["Urban Achiever", "Fashion Loyalist"], suggestedBrands: ["All brands — new season push"] },
  { name: "Ugadi", date2026: "2026-03-29", type: "hindu", regions: ["Bangalore", "Hyderabad", "Karnataka", "Andhra", "Telangana"], daysBeforeToSignal: 10, fashionImpact: "high", whatToSell: "New year wardrobe, ethnic fusion, celebration wear", targetArchetypes: ["Urban Achiever", "Fashion Loyalist"], suggestedBrands: ["All brands — new season push"] },
  { name: "Baisakhi", date2026: "2026-04-13", type: "sikh", regions: ["Punjab", "Chandigarh", "Delhi NCR"], daysBeforeToSignal: 7, fashionImpact: "medium", whatToSell: "Ethnic celebration wear, bright colors, festive accessories", targetArchetypes: ["Urban Achiever"], suggestedBrands: ["Hugo Boss", "Diesel"] },
  { name: "Eid ul-Fitr", date2026: "2026-03-31", type: "muslim", regions: ["Pan India", "Hyderabad", "Lucknow", "Mumbai", "Delhi"], daysBeforeToSignal: 14, fashionImpact: "very_high", whatToSell: "Ethnic luxury, celebration outfits, gifting, perfumes, accessories", targetArchetypes: ["All"], suggestedBrands: ["Hugo Boss", "Versace", "Emporio Armani"] },
  { name: "Mother's Day", date2026: "2026-05-10", type: "national", regions: ["Pan India"], daysBeforeToSignal: 14, fashionImpact: "high", whatToSell: "Gifting: bags, scarves, jewelry, perfumes", targetArchetypes: ["Urban Achiever", "Occasional Splurger"], suggestedBrands: ["Coach", "Michael Kors", "Kate Spade", "Jimmy Choo"] },
  { name: "Father's Day", date2026: "2026-06-21", type: "national", regions: ["Pan India"], daysBeforeToSignal: 14, fashionImpact: "medium", whatToSell: "Gifting: wallets, belts, watches, polos", targetArchetypes: ["Urban Achiever", "Occasional Splurger"], suggestedBrands: ["Hugo Boss", "Diesel", "Coach", "TUMI"] },
  { name: "Raksha Bandhan", date2026: "2026-08-12", type: "hindu", regions: ["Pan India", "North India"], daysBeforeToSignal: 10, fashionImpact: "high", whatToSell: "Sibling gifting, traditional wear, accessories, gift sets", targetArchetypes: ["Occasional Splurger", "Urban Achiever"], suggestedBrands: ["Michael Kors", "Coach", "Hugo Boss"] },
  { name: "Independence Day", date2026: "2026-08-15", type: "national", regions: ["Pan India"], daysBeforeToSignal: 7, fashionImpact: "medium", whatToSell: "Tricolor accessories, ethnic pride fashion", targetArchetypes: ["All"], suggestedBrands: ["All brands"] },
  { name: "Ganesh Chaturthi", date2026: "2026-08-27", type: "hindu", regions: ["Mumbai", "Pune", "Maharashtra", "Hyderabad"], daysBeforeToSignal: 7, fashionImpact: "medium", whatToSell: "Festive traditional wear, celebration outfits", targetArchetypes: ["Urban Achiever"], suggestedBrands: ["All brands"] },
  { name: "Onam", date2026: "2026-09-05", type: "hindu", regions: ["Kerala", "Kochi"], daysBeforeToSignal: 10, fashionImpact: "high", whatToSell: "White and gold traditional wear, Kerala luxury, celebration outfits", targetArchetypes: ["Fashion Loyalist", "Urban Achiever"], suggestedBrands: ["All brands"] },
  { name: "Navratri Start", date2026: "2026-10-03", type: "hindu", regions: ["Pan India", "Gujarat", "Mumbai", "Delhi"], daysBeforeToSignal: 14, fashionImpact: "very_high", whatToSell: "9 different color outfits (one per day), ethnic luxury, garba outfits", targetArchetypes: ["All"], suggestedBrands: ["All brands — color-themed collections"] },
  { name: "Dussehra", date2026: "2026-10-12", type: "hindu", regions: ["Pan India"], daysBeforeToSignal: 7, fashionImpact: "high", whatToSell: "New beginnings wardrobe, festive wear, celebration outfits", targetArchetypes: ["All"], suggestedBrands: ["All brands"] },
  { name: "Karwa Chauth", date2026: "2026-10-16", type: "hindu", regions: ["North India", "Delhi NCR", "Punjab", "Rajasthan"], daysBeforeToSignal: 10, fashionImpact: "high", whatToSell: "Couple fashion, ethnic luxury for women, gifting from husbands", targetArchetypes: ["Urban Achiever", "Occasional Splurger"], suggestedBrands: ["Jimmy Choo", "Michael Kors", "Coach"] },
  { name: "Dhanteras", date2026: "2026-10-29", type: "hindu", regions: ["Pan India"], daysBeforeToSignal: 7, fashionImpact: "very_high", whatToSell: "Auspicious shopping day: jewelry, luxury accessories, gold-toned fashion", targetArchetypes: ["All"], suggestedBrands: ["Swarovski", "Michael Kors", "Coach"] },
  { name: "Diwali", date2026: "2026-10-31", type: "hindu", regions: ["Pan India"], daysBeforeToSignal: 21, fashionImpact: "very_high", whatToSell: "EVERYTHING — biggest fashion event. Ethnic luxury, party wear, gifting, accessories, home fashion", targetArchetypes: ["All"], suggestedBrands: ["All brands — maximum budget"] },
  { name: "Bhai Dooj", date2026: "2026-11-02", type: "hindu", regions: ["Pan India"], daysBeforeToSignal: 5, fashionImpact: "medium", whatToSell: "Sibling gifting, men's accessories from sisters", targetArchetypes: ["Occasional Splurger"], suggestedBrands: ["Hugo Boss", "Diesel", "Coach"] },
  { name: "Guru Nanak Jayanti", date2026: "2026-11-15", type: "sikh", regions: ["Punjab", "Chandigarh", "Delhi"], daysBeforeToSignal: 5, fashionImpact: "medium", whatToSell: "Traditional wear, white outfits, celebration fashion", targetArchetypes: ["Urban Achiever"], suggestedBrands: ["Hugo Boss", "All Saints"] },
  { name: "Christmas", date2026: "2026-12-25", type: "christian", regions: ["Pan India", "Goa", "Kerala", "Mumbai", "Bangalore"], daysBeforeToSignal: 21, fashionImpact: "very_high", whatToSell: "Party wear, gifting, NYE outfits, winter fashion, red/green/gold", targetArchetypes: ["All"], suggestedBrands: ["All brands — holiday campaign"] },
  { name: "New Year's Eve", date2026: "2026-12-31", type: "national", regions: ["Pan India"], daysBeforeToSignal: 14, fashionImpact: "very_high", whatToSell: "Party wear, statement pieces, cocktail dresses, blazers, NYE outfits", targetArchetypes: ["Fashion Loyalist", "Urban Achiever", "Aspirant"], suggestedBrands: ["Kenzo", "Diesel", "All Saints", "Hugo Boss"] },
];

// Additional date-specific events
const SHOPPING_EVENTS_2026 = [
  { name: "Ajio Luxe Wkend", date2026: "2026-01-10", daysBeforeToSignal: 14, fashionImpact: "very_high" as const, whatToSell: "Platform event — all brands, all categories, exclusive drops" },
  { name: "End of Season Sale (Winter)", date2026: "2026-01-15", daysBeforeToSignal: 7, fashionImpact: "high" as const, whatToSell: "Winter clearance, season transition pieces" },
  { name: "End of Season Sale (Summer)", date2026: "2026-07-01", daysBeforeToSignal: 7, fashionImpact: "high" as const, whatToSell: "Summer clearance, monsoon transition" },
  { name: "Black Friday", date2026: "2026-11-27", daysBeforeToSignal: 14, fashionImpact: "high" as const, whatToSell: "Global sale event, all premium brands" },
];

export function getFestivalSignals(): Signal[] {
  const today = new Date();
  const signals: Signal[] = [];

  for (const festival of FESTIVAL_CALENDAR_2026) {
    const festDate = new Date(festival.date2026);
    const daysUntil = Math.ceil((festDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Signal if within the lead time window
    if (daysUntil > 0 && daysUntil <= festival.daysBeforeToSignal) {
      const severity = daysUntil <= 3 ? "critical" :
                       daysUntil <= 7 ? "high" :
                       daysUntil <= 14 ? "medium" : "low";

      signals.push({
        id: signalId("festival", festival.name.toLowerCase().replace(/\s+/g, "-")),
        type: "festival",
        source: "indian-festival-calendar",
        title: `${festival.name} in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
        description: `${festival.whatToSell}. Regions: ${festival.regions.join(", ")}. Fashion impact: ${festival.fashionImpact}.`,
        location: festival.regions.join(", "),
        severity,
        triggersWhat: festival.whatToSell,
        targetArchetypes: festival.targetArchetypes,
        suggestedBrands: festival.suggestedBrands,
        suggestedAction: daysUntil <= 3
          ? `URGENT: Launch ${festival.name} campaign NOW. ${daysUntil} days left.`
          : `Prepare ${festival.name} campaign. ${daysUntil} days until festival.`,
        confidence: 0.95, // Calendar events are highly reliable
        expiresAt: festDate,
        data: { festival, daysUntil },
        detectedAt: today,
      });
    }

    // Post-festival signal (wardrobe refresh)
    const daysSince = Math.ceil((today.getTime() - festDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 0 && daysSince <= 5 && festival.fashionImpact === "very_high") {
      signals.push({
        id: signalId("festival-post", festival.name.toLowerCase().replace(/\s+/g, "-")),
        type: "festival",
        source: "indian-festival-calendar",
        title: `Post-${festival.name} wardrobe refresh window`,
        description: `${festival.name} was ${daysSince} day(s) ago. Post-festival wardrobe refresh and new season push.`,
        location: festival.regions.join(", "),
        severity: "medium",
        triggersWhat: "New season arrivals, wardrobe refresh, replace festival-worn items",
        targetArchetypes: ["All"],
        suggestedBrands: ["All brands — new arrivals focus"],
        suggestedAction: "Push 'fresh start' messaging with new arrivals",
        confidence: 0.80,
        expiresAt: expiresIn(120),
        data: { festival, daysSince },
        detectedAt: today,
      });
    }
  }

  return signals;
}

export { FESTIVAL_CALENDAR_2026, SHOPPING_EVENTS_2026 };
