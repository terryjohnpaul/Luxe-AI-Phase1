/**
 * Auspicious Shopping Days (Panchang / Hindu Calendar)
 * 70% of Indians check auspicious dates before major purchases
 * Source: Static muhurat calendar
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

interface AuspiciousDay {
  name: string;
  date2026: string;
  significance: string;
  shoppingImpact: string;
  regions: string[];
}

const AUSPICIOUS_DAYS_2026: AuspiciousDay[] = [
  { name: "Makar Sankranti", date2026: "2026-01-14", significance: "Sun enters Capricorn. Considered auspicious for new beginnings.", shoppingImpact: "New clothes, especially black and dark colors (sesame-related tradition)", regions: ["Pan India", "Maharashtra", "Gujarat", "Karnataka"] },
  { name: "Vasant Panchami", date2026: "2026-02-02", significance: "Spring festival. Yellow is the auspicious color.", shoppingImpact: "Yellow clothing, spring collection, new season wardrobe", regions: ["Pan India", "North India"] },
  { name: "Akshaya Tritiya", date2026: "2026-05-01", significance: "One of the MOST auspicious days for buying gold/luxury. Any purchase made today is believed to bring prosperity.", shoppingImpact: "MASSIVE — luxury purchases peak. Gold jewelry alternatives: luxury accessories, premium fashion. People actively WANT to spend.", regions: ["Pan India"] },
  { name: "Dhanteras", date2026: "2026-10-29", significance: "Festival of wealth. THE single biggest shopping day in Indian calendar. Buying metal/luxury is considered auspicious.", shoppingImpact: "HIGHEST — luxury accessories, watches, jewelry, metallic fashion, premium products", regions: ["Pan India"] },
  { name: "Pushya Nakshatra Days", date2026: "2026-01-18", significance: "Monthly auspicious day for gold/jewelry purchases (occurs monthly)", shoppingImpact: "Premium accessories, jewelry, luxury items", regions: ["Pan India"] },
  { name: "Gudi Padwa / Ugadi", date2026: "2026-03-29", significance: "Hindu new year in Maharashtra and South India. New beginnings = new purchases.", shoppingImpact: "New wardrobe, auspicious beginning shopping", regions: ["Maharashtra", "Karnataka", "AP", "Telangana"] },
  { name: "Dussehra / Vijaya Dashami", date2026: "2026-10-12", significance: "Victory of good over evil. Auspicious for new beginnings and purchases.", shoppingImpact: "New clothes, vehicle purchases (we sell fashion, not cars, but the buying mood is there)", regions: ["Pan India"] },
];

// Inauspicious periods (when NOT to push hard)
const INAUSPICIOUS_PERIODS_2026 = [
  { name: "Pitru Paksha (Shradh)", startDate: "2026-09-18", endDate: "2026-10-02", description: "16-day ancestor remembrance period. Traditionally NO new purchases. Reduce aggressive advertising." },
  { name: "Adhik Maas / Malmas (if applicable)", startDate: "", endDate: "", description: "Extra month in Hindu calendar — inauspicious for purchases. Check Panchang yearly." },
];

export function getAuspiciousDaySignals(): Signal[] {
  const today = new Date();
  const signals: Signal[] = [];

  // Check upcoming auspicious days
  for (const day of AUSPICIOUS_DAYS_2026) {
    const dayDate = new Date(day.date2026);
    const daysUntil = Math.ceil((dayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && daysUntil <= 7) {
      const isAkshayaTritiya = day.name === "Akshaya Tritiya";
      const isDhanteras = day.name === "Dhanteras";
      const isMajor = isAkshayaTritiya || isDhanteras;

      signals.push({
        id: signalId("auspicious", day.name.toLowerCase().replace(/\s+/g, "-")),
        type: "auspicious_day",
        source: "panchang-calendar",
        title: daysUntil === 0 ? `TODAY: ${day.name} — auspicious shopping day!` : `${day.name} in ${daysUntil} days`,
        description: `${day.significance} Shopping impact: ${day.shoppingImpact}`,
        location: day.regions.join(", "),
        severity: daysUntil === 0 && isMajor ? "critical" : daysUntil <= 2 ? "high" : "medium",
        triggersWhat: day.shoppingImpact,
        targetArchetypes: ["All — auspicious days are universal purchase triggers in India"],
        suggestedBrands: isMajor
          ? ["Swarovski", "Michael Kors", "Coach", "Jimmy Choo", "Hugo Boss"]
          : ["All brands"],
        suggestedAction: isMajor
          ? `${day.name} ${daysUntil === 0 ? "is TODAY" : `in ${daysUntil} days`}. MAXIMUM budget. Push luxury accessories and premium products. Add 'auspicious purchase' angle in messaging.`
          : `${day.name} approaching. Increase ad spend. Add subtle auspicious angle to messaging.`,
        confidence: 0.90,
        expiresAt: new Date(dayDate.getTime() + 24 * 60 * 60 * 1000),
        data: day,
        detectedAt: today,
      });
    }
  }

  // Check inauspicious periods
  for (const period of INAUSPICIOUS_PERIODS_2026) {
    if (!period.startDate) continue;
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);

    if (today >= start && today <= end) {
      signals.push({
        id: signalId("inauspicious", period.name.toLowerCase().replace(/\s+/g, "-")),
        type: "auspicious_day",
        source: "panchang-calendar",
        title: `${period.name} — inauspicious period active`,
        description: `${period.description}. Many traditional buyers avoid new purchases. Reduce aggressive prospecting, maintain retargeting only.`,
        location: "Pan India (North India especially)",
        severity: "medium",
        triggersWhat: "REDUCE aggressive advertising. Maintain retargeting only. Don't push new arrivals.",
        targetArchetypes: ["All — but especially affects traditional buyers"],
        suggestedBrands: ["Reduce all brands"],
        suggestedAction: "Reduce prospecting budgets by 20-30%. Maintain retargeting at normal levels. Resume aggressive push after period ends.",
        confidence: 0.75,
        expiresAt: end,
        data: period,
        detectedAt: today,
      });
    }
  }

  return signals;
}
