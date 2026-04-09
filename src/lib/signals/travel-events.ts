/**
 * Travel, Long Weekends & Regional Events
 * Source: Indian holiday calendar + date rules
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

const LONG_WEEKENDS_2026 = [
  { name: "Republic Day Weekend", dates: "Jan 24-26", daysOff: "Jan 26 Mon", shoppingWindow: "Jan 17-25", travelDestinations: "Goa, Rajasthan, Kerala", fashionNeed: "Travel outfits, resort wear, vacation accessories" },
  { name: "Holi Extended Weekend", dates: "Mar 16-18", daysOff: "Mar 17 Tue (take Mon off)", shoppingWindow: "Mar 7-16", travelDestinations: "Udaipur, Jaipur, Mathura, Goa", fashionNeed: "Festival wear, travel outfits, sunglasses" },
  { name: "Good Friday + Ambedkar Jayanti", dates: "Apr 3-6", daysOff: "Apr 3 Fri + Apr 6 Mon", shoppingWindow: "Mar 25-Apr 2", travelDestinations: "Goa, Himachal, Uttarakhand", fashionNeed: "Summer travel, resort wear, trekking-meets-fashion" },
  { name: "May Day + Eid Weekend", dates: "May 1-3", daysOff: "May 1 Fri", shoppingWindow: "Apr 22-30", travelDestinations: "International (summer vacations begin)", fashionNeed: "Travel wardrobe, international trip outfits, TUMI luggage" },
  { name: "Independence Day Weekend", dates: "Aug 14-16", daysOff: "Aug 15 Sat", shoppingWindow: "Aug 5-14", travelDestinations: "Monsoon getaways, Coorg, Munnar", fashionNeed: "Monsoon travel, patriotic ethnic, rain-ready fashion" },
  { name: "Gandhi Jayanti + Navratri Start", dates: "Oct 2-4", daysOff: "Oct 2 Fri", shoppingWindow: "Sep 22-Oct 1", travelDestinations: "Gujarat (garba), festive travel", fashionNeed: "Navratri colors, festive wear, garba outfits" },
  { name: "Diwali Week", dates: "Oct 29-Nov 2", daysOff: "Oct 29 Thu - Nov 2 Mon", shoppingWindow: "Oct 10-28", travelDestinations: "Home travel, family visits", fashionNeed: "MAXIMUM — Diwali outfits, gifting, party wear, ethnic luxury" },
  { name: "Christmas + New Year", dates: "Dec 24-Jan 1", daysOff: "Dec 25 Thu + Jan 1 Thu", shoppingWindow: "Dec 10-24", travelDestinations: "Goa, Thailand, Dubai, Maldives, international", fashionNeed: "Party wear, travel outfits, NYE dresses/blazers, resort wear" },
];

const REGIONAL_EVENTS_2026 = [
  { name: "Jaipur Literature Festival", dates: "Jan 22-26", city: "Jaipur", fashionNeed: "Intellectual chic, indie luxury, artsy fashion", audience: "Fashion Loyalist" },
  { name: "Mumbai Marathon", dates: "Jan 18", city: "Mumbai", fashionNeed: "Athleisure, running fashion, post-run brunch outfits", audience: "Urban Achiever" },
  { name: "Goa Carnival", dates: "Feb 14-17", city: "Goa", fashionNeed: "Beach party wear, carnival costumes, resort fashion", audience: "Fashion Loyalist" },
  { name: "Bangalore Tech Summit", dates: "Nov 18-20", city: "Bangalore", fashionNeed: "Smart casual, tech professional wear", audience: "Urban Achiever" },
  { name: "Lakme Fashion Week", dates: "Mar 12-15", city: "Mumbai", fashionNeed: "Fashion-forward pieces, runway-inspired", audience: "Fashion Loyalist" },
  { name: "Delhi Auto Expo", dates: "Feb 6-9", city: "Delhi", fashionNeed: "Premium casual, luxury accessories", audience: "Urban Achiever" },
  { name: "Chennai Music Season", dates: "Dec 15-Jan 1", city: "Chennai", fashionNeed: "Traditional silk, ethnic luxury, concert outfits", audience: "Fashion Loyalist" },
  { name: "Kolkata Book Fair", dates: "Jan 28-Feb 9", city: "Kolkata", fashionNeed: "Intellectual casual, heritage fashion", audience: "Fashion Loyalist" },
  { name: "Pushkar Fair", dates: "Nov 5-13", city: "Rajasthan", fashionNeed: "Ethnic bohemian, desert fashion", audience: "Fashion Loyalist" },
  { name: "Hornbill Festival", dates: "Dec 1-10", city: "Nagaland", fashionNeed: "Tribal-inspired luxury, cultural fashion", audience: "Fashion Loyalist" },
];

export function getTravelEventSignals(): Signal[] {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const signals: Signal[] = [];

  // === LONG WEEKEND SIGNALS ===
  // Check if we're in a shopping window for an upcoming long weekend
  for (const lw of LONG_WEEKENDS_2026) {
    // Parse shopping window dates (simplified — use start month/day)
    const windowMatch = lw.shoppingWindow.match(/(\w+)\s+(\d+)-/);
    if (!windowMatch) continue;

    const monthNames: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const windowMonth = monthNames[windowMatch[1]];
    const windowStartDay = parseInt(windowMatch[2]);

    // Parse end of window
    const endMatch = lw.shoppingWindow.match(/-(\w+)?\s*(\d+)/);
    const windowEndMonth = endMatch?.[1] ? monthNames[endMatch[1]] : windowMonth;
    const windowEndDay = parseInt(endMatch?.[2] || "31");

    if (
      (month === windowMonth && day >= windowStartDay) ||
      (month === windowEndMonth && day <= windowEndDay) ||
      (month > windowMonth && month < windowEndMonth)
    ) {
      signals.push({
        id: signalId("travel", lw.name.toLowerCase().replace(/\s+/g, "-")),
        type: "travel",
        source: "long-weekend-calendar",
        title: `${lw.name} coming up (${lw.dates})`,
        description: `Long weekend approaching. People shopping for travel outfits 5-7 days before. Destinations: ${lw.travelDestinations}.`,
        location: "Pan India",
        severity: "medium",
        triggersWhat: lw.fashionNeed,
        targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
        suggestedBrands: lw.fashionNeed.includes("resort") ? ["Farm Rio", "Cult Gaia", "Kenzo"] :
                         lw.fashionNeed.includes("TUMI") ? ["TUMI", "Coach", "Hugo Boss"] :
                         ["All brands"],
        suggestedAction: `${lw.name} in shopping window. Push travel/vacation wear. Target: ${lw.travelDestinations} travelers.`,
        confidence: 0.75,
        expiresAt: expiresIn(168),
        data: lw,
        detectedAt: today,
      });
    }
  }

  // === REGIONAL EVENTS ===
  for (const event of REGIONAL_EVENTS_2026) {
    const dateMatch = event.dates.match(/(\w+)\s+(\d+)/);
    if (!dateMatch) continue;

    const monthNames: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const eventMonth = monthNames[dateMatch[1]];
    const eventDay = parseInt(dateMatch[2]);

    // Signal 7 days before
    const daysUntil = (eventMonth - month) * 30 + (eventDay - day); // Rough calculation
    if (daysUntil > 0 && daysUntil <= 10) {
      signals.push({
        id: signalId("regional", event.name.toLowerCase().replace(/\s+/g, "-")),
        type: "regional",
        source: "regional-events-calendar",
        title: `${event.name} in ~${daysUntil} days (${event.city})`,
        description: `${event.name} happening in ${event.city}. Push ${event.fashionNeed} in ${event.city} region.`,
        location: event.city,
        severity: "low",
        triggersWhat: event.fashionNeed,
        targetArchetypes: [event.audience],
        suggestedBrands: ["Context-dependent"],
        suggestedAction: `Regional event in ${event.city}. Target ${event.city} with ${event.fashionNeed} ads.`,
        confidence: 0.60,
        expiresAt: expiresIn(240),
        data: event,
        detectedAt: today,
      });
    }
  }

  // === WEDDING SEASON ===
  if ((month >= 10 && month <= 12) || (month >= 2 && month <= 4)) {
    signals.push({
      id: signalId("travel", "wedding-season"),
      type: "life_event",
      source: "date-rules",
      title: "Peak wedding season active",
      description: "Oct-Dec and Feb-Apr are peak Indian wedding seasons. Guests need 5-8 outfits per wedding (mehendi, sangeet, cocktail, wedding, reception). Highest AOV occasion.",
      location: "Pan India (heavier: Delhi NCR, Rajasthan, Gujarat, Punjab)",
      severity: "high",
      triggersWhat: "Wedding guest outfits: ethnic fusion, cocktail dresses, formal wear, accessories, footwear, gifting",
      targetArchetypes: ["Occasional Splurger", "Fashion Loyalist", "Urban Achiever"],
      suggestedBrands: ["Kenzo", "Farm Rio", "Hugo Boss", "Self Portrait", "Jimmy Choo", "Coach"],
      suggestedAction: "Wedding season active. Run persistent 'Wedding Guest Edit' campaign. Target Thu-Sat (wedding prep shopping days). Collection ads with looks by ceremony type.",
      confidence: 0.90,
      expiresAt: expiresIn(720),
      data: { season: month >= 10 ? "winter_weddings" : "spring_weddings" },
      detectedAt: today,
    });
  }

  return signals;
}
