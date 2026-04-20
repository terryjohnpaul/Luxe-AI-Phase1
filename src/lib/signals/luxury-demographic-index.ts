/**
 * Luxury Demographic Index Signals
 * Permanent buyer profiles with platform preferences, time windows, and category affinities.
 * Source: Historical conversion data analysis (10 years)
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

interface DemographicProfile {
  key: string;
  label: string;
  archetype: string;
  gender: "female" | "male";
  age_range: string;
  best_platform: "google" | "meta" | "both";
  google_conv_rate: number | null;   // % conversion rate
  meta_roas: number | null;
  best_time: string | null;          // HH:MM-HH:MM IST
  cpa_range: string | null;          // e.g., "Rs 9-11"
  categories: string[];
  confidence: number;
  description: string;
}

const DEMOGRAPHIC_PROFILES: DemographicProfile[] = [
  {
    key: "F_25_34",
    label: "Female 25-34",
    archetype: "Universal Buyer",
    gender: "female",
    age_range: "25-34",
    best_platform: "both",
    google_conv_rate: 23.3,
    meta_roas: null,
    best_time: null,
    cpa_range: null,
    categories: ["bags", "shoes", "indian_wear"],
    confidence: 0.97,
    description: "The backbone of luxury e-commerce. 23.3% Google conversion rate — highest of any demographic. Buys across all categories. Universal targeting priority.",
  },
  {
    key: "M_18_24",
    label: "Male 18-24",
    archetype: "Meta Impulse Buyer",
    gender: "male",
    age_range: "18-24",
    best_platform: "meta",
    google_conv_rate: null,
    meta_roas: null,
    best_time: "21:00-01:00",
    cpa_range: null,
    categories: ["sneakers", "streetluxe", "watches"],
    confidence: 0.90,
    description: "Impulse-driven, discovery-first buyer. Lives on Instagram. Peak activity 9PM-1AM. Streetwear luxury, sneakers, and entry watches. Meta-only strategy.",
  },
  {
    key: "F_55_PLUS",
    label: "Female 55+",
    archetype: "Google Intent Buyer",
    gender: "female",
    age_range: "55+",
    best_platform: "google",
    google_conv_rate: null,
    meta_roas: null,
    best_time: null,
    cpa_range: "Rs 9-11",
    categories: ["sarees", "home", "dinnerware"],
    confidence: 0.88,
    description: "The cheapest CPA demographic. Rs 9-11 per conversion on Google. Searches with high intent: brand names + product type. Traditional luxury: sarees, home decor, fine dining.",
  },
  {
    key: "M_35_44",
    label: "Male 35-44",
    archetype: "Hidden Goldmine",
    gender: "male",
    age_range: "35-44",
    best_platform: "meta",
    google_conv_rate: null,
    meta_roas: 16.67,
    best_time: null,
    cpa_range: null,
    categories: ["watches", "bags", "shoes", "perfume"],
    confidence: 0.85,
    description: "Overlooked by most advertisers. 16.67x Meta ROAS — highest male segment. Buys premium accessories: watches, leather goods, fragrances. Responds to lifestyle content, not discounts.",
  },
];

interface GenderPlatformTruth {
  insight: string;
  female_google_conv_vs_male: string;
  male_meta_roas_vs_female: string;
}

const GENDER_PLATFORM_TRUTH: GenderPlatformTruth = {
  insight: "Women convert 2x better on Google (intent-driven). Men generate 1.62x better ROAS on Meta (discovery-driven).",
  female_google_conv_vs_male: "2x",
  male_meta_roas_vs_female: "1.62x",
};

export async function getLuxuryDemographicIndexSignals(): Promise<Signal[]> {
  try {
    const now = new Date();
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + IST_OFFSET + now.getTimezoneOffset() * 60 * 1000);
    const hour = istNow.getHours();
    const month = now.getMonth() + 1;
    const signals: Signal[] = [];

    // === BASELINE SIGNALS: Always active for each profile ===

    // SIGNAL 1: Female 25-34 Targeting Priority
    signals.push({
      id: signalId("demographic", "f-25-34-priority"),
      type: "category_demand",
      source: "demographic-index",
      title: "Female 25-34 Targeting Priority",
      description: `${DEMOGRAPHIC_PROFILES[0].description} Google conversion rate: ${DEMOGRAPHIC_PROFILES[0].google_conv_rate}%. This segment should receive the highest budget allocation on both platforms.`,
      location: "Pan India",
      severity: "critical",
      triggersWhat: "All campaigns: ensure F25-34 is top priority targeting segment",
      targetArchetypes: ["Universal Buyer"],
      suggestedBrands: ["Coach", "Michael Kors", "Kate Spade", "Tory Burch", "Hugo Boss"],
      suggestedAction: "Verify F25-34 targeting is active on ALL campaigns. This segment has 23.3% Google conv rate. Never exclude them.",
      confidence: 0.97,
      expiresAt: expiresIn(168),
      data: { profile: "F_25_34", google_conv: 23.3, categories: ["bags", "shoes", "indian_wear"] },
      detectedAt: now,
    });

    // SIGNAL 2: Male 18-24 Discovery Window
    signals.push({
      id: signalId("demographic", "m-18-24-discovery"),
      type: "category_demand",
      source: "demographic-index",
      title: "Male 18-24 Discovery Window",
      description: `${DEMOGRAPHIC_PROFILES[1].description} Best hours: 9PM-1AM IST. Meta-only. Push sneakers, street luxury, and entry-level watches during night hours.`,
      location: "Pan India",
      severity: "high",
      triggersWhat: "Meta campaigns targeting M18-24 with sneakers, streetwear, watches",
      targetArchetypes: ["Meta Impulse Buyer", "Aspirant"],
      suggestedBrands: ["Onitsuka Tiger", "Diesel", "G-Star Raw", "Kenzo", "A-Cold-Wall"],
      suggestedAction: "Schedule Meta ads for M18-24 between 9PM-1AM IST. Push sneakers + streetluxe. Impulse-driven — use video/reels format.",
      confidence: 0.90,
      expiresAt: expiresIn(168),
      data: { profile: "M_18_24", best_time: "21:00-01:00", platform: "meta", categories: ["sneakers", "streetluxe", "watches"] },
      detectedAt: now,
    });

    // SIGNAL 3: Male 18-24 Active Window (time-based boost)
    if (hour >= 21 || hour <= 1) {
      signals.push({
        id: signalId("demographic", "m-18-24-active-now"),
        type: "category_demand",
        source: "demographic-index",
        title: "Male 18-24 ACTIVE NOW: Peak Impulse Window",
        description: `It's ${hour}:00 IST — peak browsing time for Male 18-24 impulse buyers. This demographic is scrolling Instagram RIGHT NOW. Sneakers, street luxury, and watches will see highest engagement.`,
        location: "Pan India",
        severity: "critical",
        triggersWhat: "BOOST Meta campaigns for M18-24 immediately",
        targetArchetypes: ["Meta Impulse Buyer"],
        suggestedBrands: ["Onitsuka Tiger", "Diesel", "G-Star Raw", "Kenzo"],
        suggestedAction: "SURGE Meta spend for M18-24 NOW. Peak impulse window. Push sneaker drops, street luxury, entry watches. Use Reels + Stories.",
        confidence: 0.93,
        expiresAt: expiresIn(3),
        data: { profile: "M_18_24", hour, active_window: true },
        detectedAt: now,
      });
    }

    // SIGNAL 4: Female 55+ Google Intent
    signals.push({
      id: signalId("demographic", "f-55-plus-google"),
      type: "category_demand",
      source: "demographic-index",
      title: "Female 55+ Google Intent Buyer",
      description: `${DEMOGRAPHIC_PROFILES[2].description} CPA as low as Rs 9-11 on Google. The cheapest conversion demographic. Searches with extreme precision — brand + product type.`,
      location: "Pan India",
      severity: "high",
      triggersWhat: "Google Search campaigns for sarees, home decor, dinnerware targeting F55+",
      targetArchetypes: ["Google Intent Buyer"],
      suggestedBrands: ["Villeroy & Boch", "Versace Home", "Indian designers"],
      suggestedAction: "Ensure F55+ targeting on Google Search for sarees, home, dinnerware. CPA Rs 9-11. Use exact-match brand keywords. No Meta needed.",
      confidence: 0.88,
      expiresAt: expiresIn(168),
      data: { profile: "F_55_PLUS", cpa: "Rs 9-11", platform: "google", categories: ["sarees", "home", "dinnerware"] },
      detectedAt: now,
    });

    // SIGNAL 5: Male 35-44 Hidden Goldmine
    signals.push({
      id: signalId("demographic", "m-35-44-goldmine"),
      type: "category_demand",
      source: "demographic-index",
      title: "Male 35-44 Hidden Goldmine",
      description: `${DEMOGRAPHIC_PROFILES[3].description} 16.67x Meta ROAS. Most advertisers ignore this segment for luxury. They buy premium accessories: watches, leather bags, shoes, perfume.`,
      location: "Pan India",
      severity: "high",
      triggersWhat: "Meta campaigns targeting M35-44 with premium accessories",
      targetArchetypes: ["Hidden Goldmine"],
      suggestedBrands: ["Hugo Boss", "Coach", "Tod's", "Emporio Armani", "Mont Blanc"],
      suggestedAction: "Create dedicated Meta campaigns for M35-44. 16.67x ROAS. Push watches, leather goods, perfume. Lifestyle imagery, not discount messaging.",
      confidence: 0.85,
      expiresAt: expiresIn(168),
      data: { profile: "M_35_44", meta_roas: 16.67, categories: ["watches", "bags", "shoes", "perfume"] },
      detectedAt: now,
    });

    // SIGNAL 6: Gender-Platform Truth
    signals.push({
      id: signalId("demographic", "gender-platform-truth"),
      type: "category_demand",
      source: "demographic-index",
      title: "Gender-Platform Split: Women=Google, Men=Meta",
      description: `${GENDER_PLATFORM_TRUTH.insight} Allocate female targeting budgets toward Google (intent), male targeting budgets toward Meta (discovery). This single insight can improve ROAS 30-40%.`,
      location: "Pan India",
      severity: "high",
      triggersWhat: "Platform allocation by gender across all campaigns",
      targetArchetypes: ["All"],
      suggestedBrands: [],
      suggestedAction: "Split by gender: Female campaigns = 65% Google / 35% Meta. Male campaigns = 35% Google / 65% Meta. Data-backed platform truth.",
      confidence: 0.94,
      expiresAt: expiresIn(336),
      data: { female_google_advantage: "2x conv", male_meta_advantage: "1.62x ROAS" },
      detectedAt: now,
    });

    // === OCCASION-BASED DEMOGRAPHIC BOOSTS ===

    // SIGNAL 7: Valentine's gifting — cross-demographic
    if (month === 2 && now.getDate() <= 14) {
      signals.push({
        id: signalId("demographic", "valentines-cross-gift"),
        type: "gift_occasion",
        source: "demographic-index",
        title: "Cross-Demographic Gifting Signal: Valentine's Day",
        description: "Valentine's Day creates cross-demographic buying. Men buy for women (bags, jewelry) and women buy for men (watches, wallets, perfume). Target both genders with opposite-gender gift messaging.",
        location: "Pan India",
        severity: "critical",
        triggersWhat: "Cross-gender gifting campaigns on both platforms",
        targetArchetypes: ["Urban Achiever", "Fashion Loyalist", "Aspirant"],
        suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss", "Kate Spade", "Jimmy Choo"],
        suggestedAction: "Run cross-gender ads: 'Gift for her' targeting M25-44, 'Gift for him' targeting F25-34. Both platforms. Perfume + accessories.",
        confidence: 0.95,
        expiresAt: new Date(now.getFullYear(), 1, 15),
        data: { occasion: "valentines", cross_gender: true },
        detectedAt: now,
      });
    }

    // SIGNAL 8: Raksha Bandhan — sibling gifting demographics
    if (month === 8 && now.getDate() <= 15) {
      signals.push({
        id: signalId("demographic", "rakhi-sibling-gift"),
        type: "gift_occasion",
        source: "demographic-index",
        title: "Cross-Demographic Gifting Signal: Raksha Bandhan",
        description: "Brothers buy luxury for sisters (bags, accessories). Sisters buy for brothers (watches, wallets). M18-34 buying for F segment, F25-34 buying for M segment.",
        location: "Pan India",
        severity: "high",
        triggersWhat: "Sibling gifting campaigns, cross-gender targeting",
        targetArchetypes: ["Urban Achiever", "Occasional Splurger"],
        suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss", "Kate Spade"],
        suggestedAction: "Run 'Gift for sister' targeting M18-34 on Meta + Google. 'Gift for brother' targeting F25-34 on Google. Push accessories.",
        confidence: 0.92,
        expiresAt: expiresIn(168),
        data: { occasion: "raksha_bandhan", cross_gender: true },
        detectedAt: now,
      });
    }

    // SIGNAL 9: Diwali — all demographics peak
    if (month === 10) {
      signals.push({
        id: signalId("demographic", "diwali-all-demographics"),
        type: "festival",
        source: "demographic-index",
        title: "Diwali: All Demographics Active",
        description: "October/Diwali activates ALL demographics simultaneously. F25-34 buys ethnic wear + gifting. M18-24 buys sneakers + watches. F55+ buys sarees + home. M35-44 buys premium accessories. Every segment is active.",
        location: "Pan India",
        severity: "critical",
        triggersWhat: "Full-segment activation across all campaigns",
        targetArchetypes: ["All"],
        suggestedBrands: ["All brands"],
        suggestedAction: "Activate all demographic segments. Don't narrow targeting during Diwali. Every age/gender is buying. But remember: CPAs are 40% inflated (Anti-Diwali Paradox).",
        confidence: 0.95,
        expiresAt: expiresIn(720),
        data: { occasion: "diwali", all_segments_active: true },
        detectedAt: now,
      });
    }

    // SIGNAL 10: Wedding season F25-34 surge
    if ([10, 11, 12, 1, 2].includes(month)) {
      signals.push({
        id: signalId("demographic", "wedding-f25-34-surge"),
        type: "wedding",
        source: "demographic-index",
        title: "Wedding Season: F25-34 Demand Surge",
        description: "Wedding season (Oct-Feb) creates massive demand from F25-34 for ethnic wear, statement accessories, occasion dressing. This demographic's already-high 23.3% conv rate surges further.",
        location: "Pan India",
        severity: "high",
        triggersWhat: "Indian wear, occasion dressing, statement bags, jewelry for F25-34",
        targetArchetypes: ["Universal Buyer", "Fashion Loyalist"],
        suggestedBrands: ["Indian Designers", "Coach", "Jimmy Choo", "Kate Spade"],
        suggestedAction: "BOOST F25-34 targeting for indian_wear and occasion categories. Wedding season amplifies their natural buying tendency.",
        confidence: 0.93,
        expiresAt: expiresIn(336),
        data: { occasion: "wedding_season", demographic: "F_25_34", months: [10, 11, 12, 1, 2] },
        detectedAt: now,
      });
    }

    // SIGNAL 11: M18-24 sneaker drop timing
    if ([3, 4, 9, 10].includes(month)) {
      signals.push({
        id: signalId("demographic", "m18-24-sneaker-season"),
        type: "category_demand",
        source: "demographic-index",
        title: "M18-24 Sneaker Season Peak",
        description: "Sneaker demand peaks in Mar-Apr and Sep-Oct. M18-24 is the primary sneaker buyer. Time drops and campaigns for these months.",
        location: "Pan India",
        severity: "high",
        triggersWhat: "Sneaker campaigns on Meta targeting M18-24",
        targetArchetypes: ["Meta Impulse Buyer", "Aspirant"],
        suggestedBrands: ["Onitsuka Tiger", "Diesel", "G-Star Raw"],
        suggestedAction: "Push sneaker campaigns on Meta for M18-24. Peak sneaker months. Schedule for 9PM-1AM IST.",
        confidence: 0.90,
        expiresAt: expiresIn(336),
        data: { demographic: "M_18_24", category: "sneakers", peak_months: [3, 4, 9, 10] },
        detectedAt: now,
      });
    }

    // SIGNAL 12: F55+ festive saree demand
    if ([9, 10, 11].includes(month)) {
      signals.push({
        id: signalId("demographic", "f55-festive-saree"),
        type: "category_demand",
        source: "demographic-index",
        title: "F55+ Festive Saree Demand Peak",
        description: "Sep-Nov: F55+ demographic searches for festive sarees spike. Google intent is at yearly high. CPA remains low at Rs 9-11. Pure gold for Google Search.",
        location: "Pan India",
        severity: "high",
        triggersWhat: "Google Search campaigns for designer sarees targeting F55+",
        targetArchetypes: ["Google Intent Buyer"],
        suggestedBrands: ["Indian Designers"],
        suggestedAction: "Increase Google Search budget for saree keywords targeting F55+. Festive season = peak intent. CPA Rs 9-11.",
        confidence: 0.88,
        expiresAt: expiresIn(336),
        data: { demographic: "F_55_PLUS", category: "sarees", peak_months: [9, 10, 11] },
        detectedAt: now,
      });
    }

    // SIGNAL 13: M35-44 gifting multiplier
    if ([2, 5, 6, 10, 12].includes(month)) {
      signals.push({
        id: signalId("demographic", "m35-44-gifting"),
        type: "gift_occasion",
        source: "demographic-index",
        title: "M35-44 Gifting Multiplier Active",
        description: "M35-44 buying peaks during gifting months (Feb=Valentine's, May=Mother's Day, Jun=Father's self-buy, Oct=Diwali, Dec=Christmas). Their 16.67x ROAS makes gifting campaigns extremely profitable.",
        location: "Pan India",
        severity: "high",
        triggersWhat: "Premium gifting campaigns on Meta for M35-44",
        targetArchetypes: ["Hidden Goldmine"],
        suggestedBrands: ["Hugo Boss", "Coach", "Emporio Armani", "Mont Blanc"],
        suggestedAction: "Run Meta gifting campaigns targeting M35-44. 16.67x ROAS baseline + gifting occasion uplift. Push watches, perfume, leather goods.",
        confidence: 0.85,
        expiresAt: expiresIn(336),
        data: { demographic: "M_35_44", occasion: "gifting", meta_roas: 16.67 },
        detectedAt: now,
      });
    }

    // SIGNAL 14: Weekend demographic shift
    const dayOfWeek = istNow.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      signals.push({
        id: signalId("demographic", "weekend-demographic-shift"),
        type: "category_demand",
        source: "demographic-index",
        title: "Weekend: All Demographics Browse Together",
        description: "Weekends see all demographics active simultaneously. F25-34 leads as always, but M35-44 and F55+ show significant uplift. Broader targeting is OK on weekends.",
        location: "Pan India",
        severity: "medium",
        triggersWhat: "Broaden demographic targeting on weekends",
        targetArchetypes: ["All"],
        suggestedBrands: ["All brands"],
        suggestedAction: "Broaden targeting on weekends. All demographics are browsing. Don't restrict to narrow segments on Sat/Sun.",
        confidence: 0.92,
        expiresAt: expiresIn(24),
        data: { day: dayOfWeek === 0 ? "Sunday" : "Saturday", all_active: true },
        detectedAt: now,
      });
    }

    // SIGNAL 15: Weekday M18-24 concentrate
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 21) {
      signals.push({
        id: signalId("demographic", "weekday-night-m18-24"),
        type: "category_demand",
        source: "demographic-index",
        title: "Weekday Night: M18-24 Dominates",
        description: "Weekday nights after 9PM, M18-24 is the dominant browsing demographic. Other segments are asleep or winding down. Concentrate Meta spend on this segment.",
        location: "Pan India",
        severity: "medium",
        triggersWhat: "Concentrate Meta spend on M18-24 after 9PM on weekdays",
        targetArchetypes: ["Meta Impulse Buyer"],
        suggestedBrands: ["Onitsuka Tiger", "Diesel", "Kenzo", "G-Star Raw"],
        suggestedAction: "After 9PM weekdays: narrow Meta targeting to M18-24. They dominate nighttime browsing. Push sneakers, streetwear.",
        confidence: 0.90,
        expiresAt: expiresIn(6),
        data: { hour, dayOfWeek, dominant_segment: "M_18_24" },
        detectedAt: now,
      });
    }

    // SIGNAL 16: Morning F55+ Google window
    if (hour >= 8 && hour <= 11) {
      signals.push({
        id: signalId("demographic", "morning-f55-google"),
        type: "category_demand",
        source: "demographic-index",
        title: "Morning Window: F55+ Google Search Peak",
        description: "Morning hours (8-11AM IST) see highest F55+ search activity. They search for specific brands + products with high intent. Google CPA at Rs 9-11.",
        location: "Pan India",
        severity: "medium",
        triggersWhat: "Google Search campaigns for F55+ target categories",
        targetArchetypes: ["Google Intent Buyer"],
        suggestedBrands: ["Villeroy & Boch", "Indian Designers"],
        suggestedAction: "Morning hours: ensure Google Search for sarees, home, dinnerware is active for F55+. Peak search time for this demographic.",
        confidence: 0.88,
        expiresAt: expiresIn(3),
        data: { hour, demographic: "F_55_PLUS", platform: "google" },
        detectedAt: now,
      });
    }

    // SIGNAL 17: M35-44 lunch browsing
    if (hour >= 12 && hour <= 14 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      signals.push({
        id: signalId("demographic", "lunch-m35-44-browsing"),
        type: "category_demand",
        source: "demographic-index",
        title: "Lunch Hour: M35-44 Office Browsing",
        description: "M35-44 professionals browse during lunch (12-2PM). They scroll Meta on breaks and discover luxury items. Second-highest activity window for this goldmine segment.",
        location: "Pan India",
        severity: "medium",
        triggersWhat: "Meta campaigns for M35-44 during lunch hours",
        targetArchetypes: ["Hidden Goldmine"],
        suggestedBrands: ["Hugo Boss", "Coach", "Emporio Armani"],
        suggestedAction: "Ensure Meta campaigns for M35-44 are active during lunch. Professionals browse during breaks. Push premium accessories.",
        confidence: 0.85,
        expiresAt: expiresIn(2),
        data: { hour, demographic: "M_35_44", context: "office_lunch" },
        detectedAt: now,
      });
    }

    // SIGNAL 18: New financial year M35-44 boost
    if (month === 4 && now.getDate() <= 15) {
      signals.push({
        id: signalId("demographic", "new-fy-m35-44-boost"),
        type: "salary_cycle",
        source: "demographic-index",
        title: "New FY: M35-44 Post-Bonus Spending",
        description: "Early April: M35-44 professionals have received year-end bonuses. Despite April being a trough month overall, this specific segment has fresh money. Target them on Meta with premium items.",
        location: "Bangalore, Mumbai, Delhi NCR, Hyderabad, Pune",
        severity: "high",
        triggersWhat: "Meta campaigns for M35-44 with premium accessories in tech hubs",
        targetArchetypes: ["Hidden Goldmine", "Urban Achiever"],
        suggestedBrands: ["Hugo Boss", "Emporio Armani", "Coach", "TUMI"],
        suggestedAction: "Despite April trough, M35-44 has bonus money. Push premium accessories on Meta in tech hubs. 16.67x ROAS segment.",
        confidence: 0.85,
        expiresAt: expiresIn(336),
        data: { demographic: "M_35_44", month: 4, context: "year_end_bonus" },
        detectedAt: now,
      });
    }

    return signals;
  } catch (error) {
    console.error("[demographic-index] Error generating signals:", error);
    return [];
  }
}
