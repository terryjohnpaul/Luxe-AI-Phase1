/**
 * Luxury Geo Index Signals
 * Geographic luxury demand index with state efficiency tiers, city-festival maps, and NRI markets.
 * Source: Historical conversion data by geography
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

interface StateEfficiency {
  state: string;
  tier: 1 | 2 | 3;
  cpa_index: number;       // relative to Delhi (1.00)
  conv_share: number;      // % of total conversions
  driver: string;          // what drives luxury demand here
  top_categories: string[];
  note: string;
}

interface CityFestival {
  city: string;
  state: string;
  festival: string;
  date2026: string;
  categories: string[];
  description: string;
}

interface NRIMarket {
  country: string;
  conversions: number;
  peak_months: string;
  categories: string[];
  note: string;
}

const STATE_EFFICIENCY_TIER: StateEfficiency[] = [
  {
    state: "Karnataka",
    tier: 1,
    cpa_index: 0.33,
    conv_share: 36.4,
    driver: "tech_money",
    top_categories: ["sneakers", "bags", "watches", "streetluxe"],
    note: "Bangalore tech money = cheapest CPA in India. 3x more efficient than Delhi. 36.4% of all conversions.",
  },
  {
    state: "Kerala",
    tier: 1,
    cpa_index: 0.45,
    conv_share: 8.2,
    driver: "nri_money",
    top_categories: ["bags", "watches", "home", "sarees"],
    note: "NRI remittance money. High disposable income. Gold + luxury culture. Onam is massive.",
  },
  {
    state: "Delhi",
    tier: 1,
    cpa_index: 1.00,
    conv_share: 15.3,
    driver: "competitive",
    top_categories: ["bags", "shoes", "indian_wear", "perfume"],
    note: "Baseline CPA. Highest competition from offline luxury stores. Premium pricing works but CPAs are high.",
  },
  {
    state: "Maharashtra",
    tier: 1,
    cpa_index: 0.78,
    conv_share: 14.1,
    driver: "metro_money",
    top_categories: ["bags", "shoes", "watches", "indian_wear"],
    note: "Mumbai + Pune. Finance capital money. Ganesh Chaturthi is a buying trigger. Bollywood influence.",
  },
  {
    state: "Telangana",
    tier: 1,
    cpa_index: 0.55,
    conv_share: 7.8,
    driver: "tech_money",
    top_categories: ["bags", "sneakers", "watches"],
    note: "Hyderabad tech hub. Second-cheapest tech money CPA. Growing fast.",
  },
  {
    state: "UP",
    tier: 2,
    cpa_index: 0.69,
    conv_share: 4.2,
    driver: "population",
    top_categories: ["bags", "shoes", "indian_wear"],
    note: "Massive population = volume despite lower per-capita. Lucknow + Noida drive most conversions. Surprisingly efficient CPA.",
  },
  {
    state: "Bihar",
    tier: 2,
    cpa_index: 0.72,
    conv_share: 2.1,
    driver: "population",
    top_categories: ["bags", "shoes"],
    note: "Emerging luxury market. CPA surprisingly efficient. Aspirational buyers with fewer offline luxury options.",
  },
  {
    state: "Tamil Nadu",
    tier: 2,
    cpa_index: 0.65,
    conv_share: 5.5,
    driver: "metro_money",
    top_categories: ["sarees", "bags", "home", "watches"],
    note: "Chennai metro + Pongal demand. Strong traditional luxury culture. Sarees dominate.",
  },
  {
    state: "Gujarat",
    tier: 2,
    cpa_index: 0.80,
    conv_share: 3.8,
    driver: "business_money",
    top_categories: ["indian_wear", "bags", "watches"],
    note: "Ahmedabad business families. Navratri is the biggest buying trigger. Heavy on ethnic luxury.",
  },
  {
    state: "West Bengal",
    tier: 2,
    cpa_index: 0.85,
    conv_share: 2.5,
    driver: "cultural_money",
    top_categories: ["sarees", "bags", "home"],
    note: "Kolkata cultural elite. Durga Puja spending is massive. Sarees + home luxury.",
  },
];

const CITY_FESTIVAL_MAP: CityFestival[] = [
  {
    city: "Mumbai",
    state: "Maharashtra",
    festival: "Ganesh Chaturthi",
    date2026: "2026-08-27",
    categories: ["indian_wear", "bags", "accessories"],
    description: "Mumbai goes all-in for Ganpati. Ethnic wear demand spikes 3x. Gold + festive accessories.",
  },
  {
    city: "Kolkata",
    state: "West Bengal",
    festival: "Durga Puja",
    date2026: "2026-10-03",
    categories: ["sarees", "bags", "shoes", "accessories"],
    description: "Kolkata's biggest shopping event. New clothes mandatory for pandal-hopping. Saree + accessory demand peaks.",
  },
  {
    city: "Ahmedabad",
    state: "Gujarat",
    festival: "Navratri",
    date2026: "2026-10-03",
    categories: ["indian_wear", "shoes", "accessories"],
    description: "9 nights of garba = 9 new outfits. Ethnic wear demand is insatiable. Color-coded daily outfits.",
  },
  {
    city: "Chennai",
    state: "Tamil Nadu",
    festival: "Pongal",
    date2026: "2026-01-15",
    categories: ["sarees", "indian_wear", "home"],
    description: "Tamil harvest festival. New clothes tradition. Silk sarees and home luxury peak.",
  },
  {
    city: "Kochi",
    state: "Kerala",
    festival: "Onam",
    date2026: "2026-09-05",
    categories: ["sarees", "bags", "watches", "home"],
    description: "Kerala's biggest festival. White + gold outfits. Massive NRI buying from Gulf. Luxury gifting peaks.",
  },
];

const NRI_MARKETS: NRIMarket[] = [
  {
    country: "UAE",
    conversions: 5453,
    peak_months: "Dec-Jan",
    categories: ["bags", "watches", "perfume", "indian_wear"],
    note: "Largest NRI market. Dubai + Abu Dhabi Indians shop for India visits. Dec-Jan peak when NRIs travel home.",
  },
  {
    country: "Saudi Arabia",
    conversions: 2100,
    peak_months: "Dec-Jan, Eid",
    categories: ["bags", "watches", "perfume"],
    note: "Second NRI market. Similar pattern to UAE. Eid buying adds extra peak.",
  },
  {
    country: "Thailand",
    conversions: 890,
    peak_months: "Nov-Jan",
    categories: ["bags", "shoes", "watches"],
    note: "Indian tourists + residents. Smaller but growing. Holiday season buying.",
  },
  {
    country: "Malaysia",
    conversions: 720,
    peak_months: "Nov-Jan, Deepavali",
    categories: ["bags", "indian_wear", "watches"],
    note: "Malaysian Indian community. Deepavali is key trigger. Year-end holiday buying.",
  },
];

export async function getLuxuryGeoIndexSignals(): Promise<Signal[]> {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const signals: Signal[] = [];

    // === SIGNAL 1: Karnataka Tech Money (always active) ===
    signals.push({
      id: signalId("geo", "karnataka-tech-money"),
      type: "regional",
      source: "geo-index",
      title: "Karnataka Tech Money: Best CPA in India",
      description: "Karnataka (Bangalore) has CPA index 0.33 — 67% cheaper than Delhi. 36.4% of all conversions come from here. Tech salaries fund luxury purchases. This is the #1 geo to target.",
      location: "Karnataka (Bangalore)",
      severity: "critical",
      triggersWhat: "Maximize budget allocation to Karnataka/Bangalore targeting",
      targetArchetypes: ["Urban Achiever", "Fashion Loyalist", "Aspirant"],
      suggestedBrands: ["Hugo Boss", "Coach", "Michael Kors", "Onitsuka Tiger", "Diesel"],
      suggestedAction: "Ensure Karnataka/Bangalore gets highest geo budget. CPA 0.33x Delhi. 36.4% of conversions. Never cap this market.",
      confidence: 0.97,
      expiresAt: expiresIn(336),
      data: { state: "Karnataka", cpa_index: 0.33, conv_share: 36.4, driver: "tech_money" },
      detectedAt: now,
    });

    // === SIGNAL 2: Delhi Premium Warning ===
    signals.push({
      id: signalId("geo", "delhi-premium-warning"),
      type: "regional",
      source: "geo-index",
      title: "Delhi Premium Warning: Highest CPA Market",
      description: "Delhi has the highest CPAs (1.0x baseline) due to intense competition from offline luxury stores (DLF Emporio, Select City Walk). 15.3% of conversions but at premium cost. Use only for high-value brand searches.",
      location: "Delhi NCR",
      severity: "high",
      triggersWhat: "Restrict Delhi to high-intent, high-value campaigns only",
      targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
      suggestedBrands: ["Emporio Armani", "Hugo Boss", "Coach"],
      suggestedAction: "Cap Delhi NCR budgets. CPA is 1.0x baseline (3x Karnataka). Use exact-match brand keywords only. No broad prospecting in Delhi.",
      confidence: 0.94,
      expiresAt: expiresIn(336),
      data: { state: "Delhi", cpa_index: 1.00, conv_share: 15.3, driver: "competitive" },
      detectedAt: now,
    });

    // === SIGNAL 3: Tier-2 Opportunity ===
    const tier2States = STATE_EFFICIENCY_TIER.filter(s => s.tier === 2);
    signals.push({
      id: signalId("geo", "tier-2-opportunity"),
      type: "regional",
      source: "geo-index",
      title: "Tier-2 State Opportunity: UP, Bihar, Gujarat, Tamil Nadu",
      description: `Tier-2 states have surprisingly efficient CPAs (0.65-0.85x Delhi) with growing luxury demand. UP at 0.69x, Bihar at 0.72x. These markets have fewer offline luxury options — online is the only channel. Untapped potential.`,
      location: "UP, Bihar, Tamil Nadu, Gujarat, West Bengal",
      severity: "medium",
      triggersWhat: "Test campaigns in Tier-2 states, especially UP and Bihar",
      targetArchetypes: ["Aspirant", "Occasional Splurger"],
      suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss"],
      suggestedAction: "Allocate 10-15% budget to Tier-2 state testing. CPA is 20-35% cheaper than Delhi. Aspirational buyers with no offline options.",
      confidence: 0.92,
      expiresAt: expiresIn(336),
      data: { tier: 2, states: tier2States.map(s => ({ state: s.state, cpa_index: s.cpa_index })) },
      detectedAt: now,
    });

    // === SIGNAL 4: Kerala NRI Money ===
    signals.push({
      id: signalId("geo", "kerala-nri-money"),
      type: "regional",
      source: "geo-index",
      title: "Kerala NRI Money: 0.45x CPA",
      description: "Kerala has CPA index 0.45 driven by NRI remittance money. High disposable income, strong gold + luxury culture. 8.2% of conversions. Onam (September) is the peak buying period.",
      location: "Kerala (Kochi, Trivandrum)",
      severity: "high",
      triggersWhat: "Kerala-specific campaigns, especially during Onam",
      targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
      suggestedBrands: ["Coach", "Michael Kors", "Villeroy & Boch"],
      suggestedAction: "Maintain Kerala targeting year-round. CPA 0.45x Delhi. NRI money ensures consistent luxury spend. Boost 2x during Onam.",
      confidence: 0.93,
      expiresAt: expiresIn(336),
      data: { state: "Kerala", cpa_index: 0.45, conv_share: 8.2, driver: "nri_money" },
      detectedAt: now,
    });

    // === SIGNAL 5: Hyderabad Tech Money Rising ===
    signals.push({
      id: signalId("geo", "telangana-tech-rising"),
      type: "regional",
      source: "geo-index",
      title: "Hyderabad Tech Money: Fastest Growing Luxury Market",
      description: "Telangana (Hyderabad) has CPA index 0.55 with 7.8% conversion share. Second-cheapest tech money CPA after Bangalore. Growing faster than any other market. Invest now.",
      location: "Telangana (Hyderabad)",
      severity: "high",
      triggersWhat: "Increase Hyderabad geo targeting allocation",
      targetArchetypes: ["Urban Achiever", "Aspirant"],
      suggestedBrands: ["Hugo Boss", "Coach", "Diesel", "Onitsuka Tiger"],
      suggestedAction: "Increase Hyderabad budget allocation. CPA 0.55x Delhi and growing fast. Tech hub with rising incomes.",
      confidence: 0.92,
      expiresAt: expiresIn(336),
      data: { state: "Telangana", cpa_index: 0.55, conv_share: 7.8, driver: "tech_money" },
      detectedAt: now,
    });

    // === CITY-FESTIVAL SIGNALS (6-10) ===
    for (const cf of CITY_FESTIVAL_MAP) {
      const festDate = new Date(cf.date2026);
      const daysToFest = Math.ceil((festDate.getTime() - now.getTime()) / 86400000);

      if (daysToFest > 0 && daysToFest <= 21) {
        signals.push({
          id: signalId("geo", `city-festival-${cf.city.toLowerCase()}-${cf.festival.toLowerCase().replace(/\s+/g, "-")}`),
          type: "regional",
          source: "geo-index",
          title: `${cf.city} ${cf.festival}: ${daysToFest} Days Away`,
          description: `${cf.description} ${cf.festival} in ${cf.city} is ${daysToFest} days away. Geo-target ${cf.city} with ${cf.categories.join(", ")} campaigns.`,
          location: `${cf.city}, ${cf.state}`,
          severity: daysToFest <= 3 ? "critical" : daysToFest <= 7 ? "high" : "medium",
          triggersWhat: `${cf.categories.join(", ")} campaigns geo-targeted to ${cf.city}`,
          targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
          suggestedBrands: [],
          suggestedAction: `Geo-target ${cf.city} for ${cf.festival}. Push ${cf.categories.join(" + ")}. ${daysToFest <= 7 ? "URGENT: Festival approaching." : "Start building awareness."}`,
          confidence: 0.93,
          expiresAt: new Date(festDate.getTime() + 2 * 86400000),
          data: { city: cf.city, festival: cf.festival, daysToFest, categories: cf.categories },
          detectedAt: now,
        });
      }
    }

    // === SIGNAL 11: NRI Holiday Window ===
    if (month === 12 || month === 1) {
      signals.push({
        id: signalId("geo", "nri-holiday-window"),
        type: "regional",
        source: "geo-index",
        title: "NRI Holiday Window: Dec-Jan Peak",
        description: `NRI markets are at peak buying. UAE: 5,453 conversions, Saudi: 2,100, Thailand: 890, Malaysia: 720. NRIs travel home Dec-Jan and buy luxury gifts online for delivery in India. Target international IP ranges.`,
        location: "UAE, Saudi Arabia, Thailand, Malaysia",
        severity: "critical",
        triggersWhat: "International targeting campaigns for NRI markets",
        targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
        suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss", "Kate Spade"],
        suggestedAction: "Activate international geo-targeting: UAE, Saudi, Thailand, Malaysia. NRIs buying gifts for India delivery. Peak Dec-Jan window.",
        confidence: 0.94,
        expiresAt: expiresIn(720),
        data: { markets: NRI_MARKETS.map(m => ({ country: m.country, conversions: m.conversions })) },
        detectedAt: now,
      });
    }

    // === SIGNAL 12: UAE Eid NRI boost ===
    if (month === 3 || month === 4) {
      signals.push({
        id: signalId("geo", "nri-uae-eid"),
        type: "regional",
        source: "geo-index",
        title: "NRI UAE + Saudi: Eid Buying Surge",
        description: "Eid period in Gulf NRI markets. Indian diaspora in UAE and Saudi buy luxury gifts. 7,553 combined conversions from these two markets. Target with gifting campaigns.",
        location: "UAE, Saudi Arabia",
        severity: "high",
        triggersWhat: "NRI Eid gifting campaigns targeting Gulf countries",
        targetArchetypes: ["Urban Achiever"],
        suggestedBrands: ["Hugo Boss", "Coach", "Emporio Armani"],
        suggestedAction: "Activate UAE + Saudi geo-targeting for Eid. Indian NRIs buy luxury for themselves and as gifts. Push perfume, bags, watches.",
        confidence: 0.92,
        expiresAt: expiresIn(336),
        data: { markets: ["UAE", "Saudi Arabia"], occasion: "eid", combined_conv: 7553 },
        detectedAt: now,
      });
    }

    // === SIGNAL 13: Geo budget allocation formula ===
    signals.push({
      id: signalId("geo", "budget-allocation-formula"),
      type: "regional",
      source: "geo-index",
      title: "Geo Budget Formula: CPA-Weighted Allocation",
      description: "Optimal geo budget allocation based on CPA efficiency: Karnataka 35%, Maharashtra 15%, Delhi 12%, Kerala 10%, Telangana 10%, Tamil Nadu 6%, UP 4%, Gujarat 4%, Others 4%. This maximizes ROAS nationally.",
      location: "Pan India",
      severity: "high",
      triggersWhat: "Geo-targeted budget allocation across all campaigns",
      targetArchetypes: ["All"],
      suggestedBrands: [],
      suggestedAction: "Set geo budget splits: Karnataka 35%, Maharashtra 15%, Delhi 12%, Kerala 10%, Telangana 10%, TN 6%, UP 4%, Gujarat 4%, Others 4%.",
      confidence: 0.94,
      expiresAt: expiresIn(336),
      data: {
        allocation: {
          Karnataka: 35, Maharashtra: 15, Delhi: 12, Kerala: 10,
          Telangana: 10, Tamil_Nadu: 6, UP: 4, Gujarat: 4, Others: 4,
        },
      },
      detectedAt: now,
    });

    // === SIGNAL 14: Monsoon geo shift ===
    if (month >= 7 && month <= 9) {
      signals.push({
        id: signalId("geo", "monsoon-geo-shift"),
        type: "regional",
        source: "geo-index",
        title: "Monsoon Geo Shift: Kerala + Karnataka Resilient",
        description: "During monsoon (Jul-Sep), most geos see demand dip but Kerala and Karnataka remain strong. Kerala has Onam; Karnataka has consistent tech salaries. Shift budget toward these two states.",
        location: "Kerala, Karnataka",
        severity: "medium",
        triggersWhat: "Increase Karnataka + Kerala budget share during monsoon",
        targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
        suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss"],
        suggestedAction: "Monsoon adjustment: increase Karnataka to 40%, Kerala to 12%. These geos resist monsoon demand dip. Reduce Delhi + Maharashtra share.",
        confidence: 0.92,
        expiresAt: expiresIn(720),
        data: { season: "monsoon", resilient_states: ["Karnataka", "Kerala"] },
        detectedAt: now,
      });
    }

    return signals;
  } catch (error) {
    console.error("[geo-index] Error generating signals:", error);
    return [];
  }
}
