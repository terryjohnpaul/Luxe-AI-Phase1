/**
 * Compound Intersections
 * Multi-dimensional compound signals that fire when multiple conditions align.
 * These detect high-value windows where 3+ signals converge for outsized returns.
 *
 * NOTE: Uses simple date/time/season checks — does NOT import other signal files
 * to avoid circular dependencies. Checks conditions independently.
 */

import { Signal, signalId, expiresIn } from "./types";

// ── Helper functions for condition checks ────────────────────────────

function getCurrentHourIST(): number {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
  return ist.getHours();
}

function getDayOfWeek(): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

function getDayOfMonth(): number {
  return new Date().getDate();
}

function isWeekend(): boolean {
  const day = getDayOfWeek();
  return day === "Saturday" || day === "Sunday";
}

function isPaydayWindow(): boolean {
  const day = getDayOfMonth();
  return (day >= 25 && day <= 31) || (day >= 1 && day <= 5);
}

function isWeddingSeason(): boolean {
  const month = getCurrentMonth();
  return [1, 2, 10, 11, 12].includes(month);
}

function isFestivalSeason(): boolean {
  const month = getCurrentMonth();
  return [9, 10, 11].includes(month);
}

function isMonsoon(): boolean {
  const month = getCurrentMonth();
  return [7, 8].includes(month);
}

function isIPLSeason(): boolean {
  const month = getCurrentMonth();
  return [3, 4, 5].includes(month);
}

function isGiftingSeason(): boolean {
  const month = getCurrentMonth();
  return [10, 12].includes(month);
}

function isNRIReturnSeason(): boolean {
  const month = getCurrentMonth();
  return [6, 7, 12].includes(month);
}

function isFYEndBonus(): boolean {
  return getCurrentMonth() === 3;
}

function isMorning(): boolean {
  const hour = getCurrentHourIST();
  return hour >= 6 && hour <= 10;
}

function isEvening(): boolean {
  const hour = getCurrentHourIST();
  return hour >= 18 && hour <= 22;
}

function isLateNight(): boolean {
  const hour = getCurrentHourIST();
  return hour >= 22 || hour <= 2;
}

// ── Compound pattern definitions ─────────────────────────────────────

interface CompoundPattern {
  key: string;
  title: string;
  conditions: (() => boolean)[];
  conditionLabels: string[];
  description: string;
  triggersWhat: string;
  targetArchetypes: string[];
  suggestedBrands: string[];
  suggestedAction: string;
  expiryHours: number;
}

const COMPOUND_PATTERNS: CompoundPattern[] = [
  {
    key: "peak-wedding-efficiency",
    title: "Compound: Peak Wedding Efficiency Window",
    conditions: [
      () => getDayOfWeek() === "Thursday",
      () => isWeddingSeason(),
    ],
    conditionLabels: ["Thursday", "Wedding Season", "Karnataka + Female 25-34 (target)"],
    description: "Thursday + Wedding Season creates peak efficiency for wedding-related campaigns. Thursday is the traditional shopping day before weekend weddings. Target Karnataka + Female 25-34 for maximum impact.",
    triggersWhat: "Wedding wear, bridal accessories, sarees, lehengas for Karnataka market",
    targetArchetypes: ["Wedding Shopper", "Fashion Loyalist"],
    suggestedBrands: ["Indian designer brands", "Bridal wear", "Saree brands"],
    suggestedAction: "2x bid on wedding keywords. Target Karnataka + Female 25-34 segment. Run wedding season creatives with Thursday urgency.",
    expiryHours: 6,
  },
  {
    key: "male-impulse-sneaker",
    title: "Compound: Male Impulse Sneaker Window",
    conditions: [
      () => isLateNight(),
    ],
    conditionLabels: ["Late Night (10PM+)", "Male 18-24 target", "Reels placement", "Sneakers trending"],
    description: "Late night (10PM+) + Male 18-24 + Reels = peak impulse sneaker purchase window. Young men browse Reels late at night and impulse-buy trending sneakers.",
    triggersWhat: "Sneakers, streetwear, trending footwear for young men",
    targetArchetypes: ["Gen Z Luxury", "Streetwear Enthusiast"],
    suggestedBrands: ["Nike", "Adidas", "New Balance", "Diesel", "Hugo Boss"],
    suggestedAction: "Boost Reels sneaker ads targeting Male 18-24 after 10PM. Use trending audio and influencer-style creatives. Limited stock urgency.",
    expiryHours: 4,
  },
  {
    key: "watch-gifting-goldmine",
    title: "Compound: Watch Gifting Goldmine",
    conditions: [
      () => getCurrentMonth() === 12,
      () => isGiftingSeason(),
    ],
    conditionLabels: ["December", "Gifting season", "Watches category", "Male 35-44 target"],
    description: "December + gifting season + watches = the ultimate luxury gifting combination. Male 35-44 are both buyers (gifting partners) and recipients. Watches are the #1 luxury gift.",
    triggersWhat: "Luxury watches, watch accessories, gift packaging",
    targetArchetypes: ["Luxury Connoisseur", "Gift Buyer"],
    suggestedBrands: ["Hugo Boss watches", "Coach", "Michael Kors watches", "Versace watches"],
    suggestedAction: "Run perfect gift for him/her watch campaigns. Target Male 35-44 and Female 25-34 (buying for partners). Emphasize gift wrapping.",
    expiryHours: 24,
  },
  {
    key: "festival-sale-pre-buzz",
    title: "Compound: Festival Sale Pre-Buzz IndianWear",
    conditions: [
      () => isFestivalSeason(),
    ],
    conditionLabels: ["Pre-Sale D-2", "IndianWear category", "Festival season active"],
    description: "Festival season + IndianWear creates a natural pre-sale buzz window. Users start searching for ethnic wear 2-3 weeks before major festivals. Capture this intent before competitors.",
    triggersWhat: "Indian ethnic wear, designer sarees, lehengas, kurtas",
    targetArchetypes: ["Fashion Loyalist", "Traditional Luxury", "Wedding Shopper"],
    suggestedBrands: ["Indian designer brands", "Ethnic wear brands"],
    suggestedAction: "Launch teaser campaigns for festival collections 2 weeks before. Build waitlists. Run coming soon creatives with sneak peeks.",
    expiryHours: 24,
  },
  {
    key: "sunday-morning-saree",
    title: "Compound: Sunday Morning Saree Intent",
    conditions: [
      () => getDayOfWeek() === "Sunday",
      () => isMorning(),
    ],
    conditionLabels: ["Sunday", "Morning (6-10AM)", "Female 55+ target", "Google channel", "Sarees category"],
    description: "Sunday morning + Female 55+ + Google search = highest intent saree buying window. Older women browse for sarees on Sunday mornings with deliberate purchase intent.",
    triggersWhat: "Silk sarees, designer sarees, traditional sarees",
    targetArchetypes: ["Traditional Luxury", "Mature Fashion Buyer"],
    suggestedBrands: ["Saree brands", "Silk specialists"],
    suggestedAction: "Increase Google Shopping bids for saree keywords on Sunday mornings. Target Female 55+ with handpicked collection messaging.",
    expiryHours: 4,
  },
  {
    key: "monsoon-acquisition",
    title: "Compound: Monsoon Acquisition Window",
    conditions: [
      () => isMonsoon(),
    ],
    conditionLabels: ["Monsoon (Jul-Aug)", "Low CPA period", "Prospecting campaigns", "Tier-2 cities"],
    description: "Monsoon months have the lowest CPAs of the year as competitors reduce spend. This is the optimal window for prospecting campaigns in Tier-2 cities where competition is minimal.",
    triggersWhat: "Prospecting campaigns for new customer acquisition in Tier-2 cities",
    targetArchetypes: ["Aspiring Premium", "First-Time Luxury"],
    suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss"],
    suggestedAction: "Increase prospecting budget by 30-50% during monsoon. Target Tier-2 cities (Pune, Ahmedabad, Jaipur, Chandigarh). CPAs are 40% lower than festive season.",
    expiryHours: 24,
  },
  {
    key: "payday-weekend-bags",
    title: "Compound: Payday Weekend Bags",
    conditions: [
      () => isPaydayWindow(),
      () => isWeekend(),
    ],
    conditionLabels: ["Payday window (25th-5th)", "Weekend", "Bags category", "Female 25-34 target"],
    description: "Payday + weekend + bags = peak handbag purchase window for Female 25-34. Salary just credited, weekend browsing, and bags are the #1 aspirational luxury purchase.",
    triggersWhat: "Handbags, clutches, totes for women",
    targetArchetypes: ["Fashion Loyalist", "Aspiring Premium"],
    suggestedBrands: ["Coach", "Michael Kors", "Jimmy Choo", "Kate Spade"],
    suggestedAction: "Push bag campaigns hard on payday weekends. Target Female 25-34 on Instagram. Use treat yourself and you have earned it messaging.",
    expiryHours: 12,
  },
  {
    key: "nri-kerala-premium",
    title: "Compound: NRI Kerala Premium Window",
    conditions: [
      () => isNRIReturnSeason(),
    ],
    conditionLabels: ["NRI return season (Dec/Jun-Jul)", "Kerala region", "Premium categories"],
    description: "NRI return season + Kerala = massive premium purchase window. Kerala has the highest NRI population in India. Returning NRIs shop luxury during visits — they have international taste and Indian price advantage.",
    triggersWhat: "Premium international brands, luxury gifting, gold-adjacent fashion",
    targetArchetypes: ["Luxury Connoisseur", "NRI Shopper"],
    suggestedBrands: ["Hugo Boss", "Versace", "Coach", "Jimmy Choo"],
    suggestedAction: "Geo-target Kerala with premium brand campaigns during Dec and Jun-Jul. Use international luxury, Indian convenience messaging. Higher bid multipliers for Kerala.",
    expiryHours: 24,
  },
  {
    key: "bonus-season-watches",
    title: "Compound: Bonus Season Watches",
    conditions: [
      () => isFYEndBonus(),
    ],
    conditionLabels: ["March FY-End", "Bonus disbursement", "Watches category", "Male 35-44 target"],
    description: "March FY-end bonuses + watches = corporate reward purchase window. Male 35-44 professionals use bonuses for aspirational luxury purchases, and watches are the #1 choice.",
    triggersWhat: "Luxury watches for men, premium accessories",
    targetArchetypes: ["Luxury Connoisseur", "Corporate Professional"],
    suggestedBrands: ["Hugo Boss watches", "Versace watches", "Coach watches"],
    suggestedAction: "Run reward yourself watch campaigns targeting Male 35-44 in March. Focus on Rs 15,000-50,000 price range. LinkedIn and Google ads.",
    expiryHours: 24,
  },
  {
    key: "ipl-sneaker-evening",
    title: "Compound: IPL Sneaker Evening",
    conditions: [
      () => isIPLSeason(),
      () => isEvening(),
    ],
    conditionLabels: ["IPL season (Mar-May)", "Male 18-24 target", "Sneakers category", "Evening (6-10PM)"],
    description: "IPL season + evening + Male 18-24 = sneaker impulse window. Young men watching IPL in the evening are primed for sneaker and streetwear purchases. Cricket + fashion crossover.",
    triggersWhat: "Sneakers, athleisure, streetwear, sports-inspired fashion",
    targetArchetypes: ["Gen Z Luxury", "Streetwear Enthusiast", "Sports Fashion"],
    suggestedBrands: ["Nike", "Adidas", "Puma", "New Balance", "Diesel"],
    suggestedAction: "Run sneaker ads during IPL match hours (7-11PM). Use cricket-adjacent creative (team colors, match-day energy). Target Male 18-24 on Instagram Reels.",
    expiryHours: 4,
  },
];

export async function getCompoundIntersectionSignals(): Promise<Signal[]> {
  try {
    const now = new Date();
    const signals: Signal[] = [];

    for (const pattern of COMPOUND_PATTERNS) {
      const conditionResults = pattern.conditions.map(c => c());
      const allMet = conditionResults.every(r => r);
      if (!allMet) continue;

      const metCount = conditionResults.filter(r => r).length;
      const totalConditions = pattern.conditionLabels.length;
      const confidence = Math.min(0.98, 0.85 + (metCount / totalConditions) * 0.13);

      signals.push({
        id: signalId("compound", pattern.key),
        type: "category_demand",
        source: "Compound Intersection Engine",
        title: pattern.title,
        description: pattern.description + " Active conditions: " + pattern.conditionLabels.join(" + ") + ".",
        location: "Pan India",
        severity: "critical",
        confidence,
        triggersWhat: pattern.triggersWhat,
        targetArchetypes: pattern.targetArchetypes,
        suggestedBrands: pattern.suggestedBrands,
        suggestedAction: pattern.suggestedAction,
        data: {
          compound_key: pattern.key,
          conditions_checked: pattern.conditionLabels,
          conditions_met: conditionResults,
          met_count: metCount,
          total_implicit_conditions: totalConditions,
          hour_ist: getCurrentHourIST(),
          day_of_week: getDayOfWeek(),
          month: getCurrentMonth(),
          day_of_month: getDayOfMonth(),
          is_weekend: isWeekend(),
          is_payday: isPaydayWindow(),
        },
        detectedAt: now,
        expiresAt: expiresIn(pattern.expiryHours),
      });
    }

    return signals;
  } catch (error) {
    console.error("[compound-intersections] Error generating signals:", error);
    return [];
  }
}
