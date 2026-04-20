/**
 * Cultural Festival to Fashion Category Mapping
 * Maps Indian festivals to specific fashion categories, colors, and regional relevance.
 * Fires signals when festivals are within 30 days to trigger pre-festival campaigns.
 */

import { Signal, signalId, expiresIn } from "./types";

interface FestivalFashionEntry {
  name: string;
  categories: string[];
  colors?: string[];
  region: string[];
  gender?: "female" | "male" | "all";
  is_luxury_buying_day?: boolean;
  date_ranges: { month: number; day_start: number; day_end: number }[];
  ad_messaging: string;
  suggested_brands: string[];
}

const FESTIVAL_FASHION_MAP: FestivalFashionEntry[] = [
  {
    name: "Navratri",
    categories: ["chaniya_choli", "garba_wear", "color_coded_outfits", "ethnic_fusion", "oxidized_jewelry"],
    colors: ["white", "red", "royal_blue", "yellow", "green", "grey", "orange", "pink", "purple"],
    region: ["Gujarat", "Maharashtra", "Rajasthan"],
    gender: "female",
    date_ranges: [{ month: 10, day_start: 1, day_end: 15 }],
    ad_messaging: "9 nights, 9 colors, 9 looks. Shop Navratri collections — color-coded outfits for every garba night.",
    suggested_brands: ["Indian designer brands", "Ethnic wear brands"],
  },
  {
    name: "Durga Puja",
    categories: ["designer_sarees", "bengali_luxury", "silk_sarees", "traditional_jewelry"],
    region: ["West Bengal", "Odisha", "Assam"],
    gender: "female",
    date_ranges: [{ month: 10, day_start: 8, day_end: 15 }],
    ad_messaging: "Durga Puja special: Designer sarees and Bengali luxury collections. Celebrate in style.",
    suggested_brands: ["Saree brands", "Silk specialists"],
  },
  {
    name: "Onam",
    categories: ["kasavu_sarees", "white_gold_outfits", "kerala_mundu", "traditional_gold_jewelry"],
    region: ["Kerala"],
    gender: "all",
    date_ranges: [{ month: 8, day_start: 20, day_end: 31 }, { month: 9, day_start: 1, day_end: 10 }],
    ad_messaging: "Onam collections: Kasavu sarees, white and gold traditional wear. Celebrate the harvest in luxury.",
    suggested_brands: ["Kerala specialty brands", "Traditional wear"],
  },
  {
    name: "Eid",
    categories: ["designer_ethnic", "indo_western", "lucknowi_chikan", "sherwanis", "modest_luxury"],
    region: ["UP", "Telangana", "Maharashtra", "Kerala", "West Bengal"],
    gender: "all",
    date_ranges: [
      { month: 4, day_start: 1, day_end: 15 },
      { month: 6, day_start: 15, day_end: 30 },
    ],
    ad_messaging: "Eid Mubarak collections: Designer ethnic wear, Lucknowi chikan, and Indo-western luxury for celebrations.",
    suggested_brands: ["Ethnic luxury brands", "Indo-western designers"],
  },
  {
    name: "Karva Chauth",
    categories: ["red_outfits", "sarees", "bridal_repeat_wear", "vermillion_accessories", "gold_jewelry"],
    region: ["Delhi NCR", "Punjab", "Haryana", "Rajasthan", "UP"],
    gender: "female",
    date_ranges: [{ month: 10, day_start: 20, day_end: 31 }],
    ad_messaging: "Karva Chauth special: Red sarees, bridal-repeat outfits, and luxury accessories for the occasion.",
    suggested_brands: ["Bridal wear brands", "Saree brands", "Jewelry brands"],
  },
  {
    name: "Akshaya Tritiya",
    categories: ["gold_adjacent_fashion", "premium_ethnic", "luxury_watches", "gold_jewelry"],
    region: ["Pan India"],
    gender: "all",
    is_luxury_buying_day: true,
    date_ranges: [{ month: 5, day_start: 1, day_end: 15 }],
    ad_messaging: "Akshaya Tritiya: The most auspicious day to invest in luxury. Gold, watches, and premium ethnic collections.",
    suggested_brands: ["Watch brands", "Jewelry brands", "Premium ethnic"],
  },
];

function isFestivalWithinDays(entry: FestivalFashionEntry, days: number): { isUpcoming: boolean; daysUntil: number } {
  const now = new Date();
  const currentYear = now.getFullYear();
  let closestDays = Infinity;

  for (const range of entry.date_ranges) {
    for (const year of [currentYear, currentYear + 1]) {
      const festivalStart = new Date(year, range.month - 1, range.day_start);
      const diffMs = festivalStart.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= -5 && diffDays < closestDays) {
        closestDays = diffDays;
      }
    }
  }

  return {
    isUpcoming: closestDays <= days && closestDays >= -5,
    daysUntil: closestDays,
  };
}

export async function getCulturalFestivalFashionSignals(): Promise<Signal[]> {
  try {
    const now = new Date();
    const signals: Signal[] = [];

    for (const festival of FESTIVAL_FASHION_MAP) {
      const { isUpcoming, daysUntil } = isFestivalWithinDays(festival, 30);
      if (!isUpcoming) continue;

      let severity: "critical" | "high" | "medium" | "low";
      let phase: string;

      if (daysUntil <= 0) {
        severity = "critical";
        phase = "NOW LIVE";
      } else if (daysUntil <= 7) {
        severity = "critical";
        phase = daysUntil + " days away — FINAL PUSH";
      } else if (daysUntil <= 14) {
        severity = "high";
        phase = daysUntil + " days away — Peak shopping window";
      } else {
        severity = "medium";
        phase = daysUntil + " days away — Pre-buzz phase";
      }

      // Main festival signal
      signals.push({
        id: signalId("festival-fashion", festival.name.toLowerCase().replace(/\s+/g, "-")),
        type: "festival",
        source: "Cultural Festival Fashion Map",
        title: festival.name + " Fashion Window (" + phase + ")",
        description: festival.ad_messaging + " Target regions: " + festival.region.join(", ") + ". Categories: " + festival.categories.join(", ") + "." + (festival.is_luxury_buying_day ? " This is a LUXURY BUYING DAY — highest purchase intent of the year." : ""),
        location: festival.region.includes("Pan India") ? "Pan India" : festival.region[0],
        severity,
        confidence: daysUntil <= 0 ? 0.98 : daysUntil <= 7 ? 0.95 : 0.88,
        triggersWhat: festival.name + " fashion campaigns: " + festival.categories.slice(0, 3).join(", "),
        targetArchetypes: festival.gender === "female"
          ? ["Fashion Loyalist", "Wedding Shopper", "Traditional Luxury"]
          : ["Fashion Loyalist", "Aspiring Premium", "Traditional Luxury"],
        suggestedBrands: festival.suggested_brands,
        suggestedAction: festival.ad_messaging,
        data: {
          festival: festival.name,
          days_until: daysUntil,
          phase,
          categories: festival.categories,
          colors: festival.colors || [],
          regions: festival.region,
          gender: festival.gender || "all",
          is_luxury_buying_day: festival.is_luxury_buying_day || false,
        },
        detectedAt: now,
        expiresAt: daysUntil <= 0 ? expiresIn(6) : expiresIn(24),
      });

      // Color-coded days for Navratri
      if (festival.colors && festival.colors.length > 0 && daysUntil <= 9 && daysUntil >= 0) {
        const dayIndex = Math.min(Math.abs(daysUntil), festival.colors.length - 1);
        const todayColor = festival.colors[dayIndex];

        signals.push({
          id: signalId("festival-fashion", festival.name.toLowerCase() + "-color-" + todayColor),
          type: "festival",
          source: "Cultural Festival Fashion Map",
          title: festival.name + " Day " + (dayIndex + 1) + ": " + todayColor.charAt(0).toUpperCase() + todayColor.slice(1) + " Color",
          description: "Today is " + festival.name + " " + todayColor + " day. Push " + todayColor + "-colored outfits in all campaigns targeting " + festival.region.join(", ") + ".",
          location: festival.region[0],
          severity: "critical",
          confidence: 0.95,
          triggersWhat: todayColor + " colored " + festival.categories[0] + " and accessories",
          targetArchetypes: ["Fashion Loyalist", "Traditional Luxury"],
          suggestedBrands: festival.suggested_brands,
          suggestedAction: "Feature " + todayColor + " outfits prominently. Filter catalog by color=" + todayColor + ". Run creative with today color: " + todayColor + ".",
          data: {
            festival: festival.name,
            day_number: dayIndex + 1,
            color: todayColor,
            all_colors: festival.colors,
          },
          detectedAt: now,
          expiresAt: expiresIn(12),
        });
      }

      // Luxury buying day special signal
      if (festival.is_luxury_buying_day && daysUntil <= 7) {
        signals.push({
          id: signalId("festival-fashion", festival.name.toLowerCase() + "-luxury-buying-day"),
          type: "auspicious_day",
          source: "Cultural Festival Fashion Map",
          title: festival.name + ": Luxury Buying Day (" + phase + ")",
          description: festival.name + " is traditionally the most auspicious day for luxury purchases in India. Maximize budgets on gold-adjacent fashion, watches, and premium ethnic wear.",
          location: "Pan India",
          severity: "critical",
          confidence: 0.96,
          triggersWhat: "Maximum budget deployment on luxury categories",
          targetArchetypes: ["Luxury Connoisseur", "Traditional Luxury", "Fashion Loyalist"],
          suggestedBrands: ["Watch brands", "Jewelry brands", "Premium ethnic"],
          suggestedAction: "2x daily budgets on luxury categories. Run auspicious beginnings messaging. Feature gold-toned products prominently.",
          data: {
            festival: festival.name,
            days_until: daysUntil,
            is_luxury_buying_day: true,
          },
          detectedAt: now,
          expiresAt: daysUntil <= 0 ? expiresIn(6) : expiresIn(24),
        });
      }
    }

    return signals;
  } catch (error) {
    console.error("[cultural-festival-fashion] Error generating signals:", error);
    return [];
  }
}
