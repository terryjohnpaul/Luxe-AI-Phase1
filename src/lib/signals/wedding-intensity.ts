/**
 * Wedding Intensity Index — India
 * Not just "wedding season is active" but specific muhurat-dense weeks.
 * India has 10M+ weddings/year clustered around auspicious dates.
 * A muhurat-dense week = 5x the luxury fashion demand.
 */

import { Signal, signalId, expiresIn } from "./types";

interface MuhuratWindow {
  name: string;
  startDate2026: string;
  endDate2026: string;
  intensity: "peak" | "high" | "moderate";
  weddingsEstimate: string;
  regions: string[];
  description: string;
}

// Major wedding windows based on Hindu/Sikh muhurat dates for 2026
// These are the HIGH-DENSITY wedding periods when luxury fashion demand peaks
const MUHURAT_WINDOWS_2026: MuhuratWindow[] = [
  { name: "Winter Wedding Season Peak", startDate2026: "2026-01-15", endDate2026: "2026-02-10", intensity: "peak", weddingsEstimate: "2M+ weddings", regions: ["Pan India", "North India", "West India"], description: "Peak winter wedding season. Makar Sankranti to Basant Panchami — densest muhurat cluster of the year." },
  { name: "Pre-Holi Wedding Rush", startDate2026: "2026-02-25", endDate2026: "2026-03-15", intensity: "high", weddingsEstimate: "1.5M weddings", regions: ["North India", "Gujarat", "Rajasthan"], description: "Last wedding window before Holi. Families rush to complete weddings before the festival break." },
  { name: "Post-Navratri Wedding Blast", startDate2026: "2026-04-15", endDate2026: "2026-05-15", intensity: "peak", weddingsEstimate: "2.5M weddings", regions: ["Pan India"], description: "Akshaya Tritiya (April 30) is THE most auspicious day for weddings. This window is the busiest in all of India." },
  { name: "Summer Wedding Window", startDate2026: "2026-05-20", endDate2026: "2026-06-15", intensity: "moderate", weddingsEstimate: "800K weddings", regions: ["South India", "Bengal", "Maharashtra"], description: "South Indian and Bengali wedding season. Different calendar, different muhurat dates." },
  { name: "Post-Monsoon Wedding Season", startDate2026: "2026-10-15", endDate2026: "2026-11-15", intensity: "peak", weddingsEstimate: "3M+ weddings", regions: ["Pan India"], description: "THE biggest wedding window. Post-Dussehra to pre-Diwali = highest muhurat density. Every banquet hall booked." },
  { name: "Diwali-to-Christmas Wedding Rush", startDate2026: "2026-11-05", endDate2026: "2026-12-15", intensity: "peak", weddingsEstimate: "3.5M+ weddings", regions: ["Pan India", "North India especially"], description: "November-December is peak peak. Dev Uthani Ekadashi unlocks the biggest wedding window. Tulsi Vivah onwards = non-stop weddings." },
];

// Key individual auspicious dates in 2026
const AUSPICIOUS_WEDDING_DATES_2026 = [
  { date: "2026-01-15", name: "Makar Sankranti", note: "Auspicious start — many weddings scheduled" },
  { date: "2026-02-02", name: "Basant Panchami", note: "Goddess Saraswati day — highly auspicious for weddings" },
  { date: "2026-04-30", name: "Akshaya Tritiya", note: "THE most auspicious day — highest single-day weddings in India" },
  { date: "2026-11-08", name: "Dev Uthani Ekadashi", note: "Opens the biggest wedding season — Tulsi Vivah day" },
  { date: "2026-11-15", name: "Tulsi Vivah", note: "Traditional wedding season officially begins" },
];

export function getWeddingIntensitySignals(): Signal[] {
  const today = new Date();
  const signals: Signal[] = [];

  const IST_MS = 5.5 * 3600000;
  const todayIST = new Date(today.getTime() + IST_MS);
  const todayDateIST = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate());

  // Check muhurat windows
  for (const window of MUHURAT_WINDOWS_2026) {
    const start = new Date(window.startDate2026);
    const end = new Date(window.endDate2026);
    const startClean = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endClean = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const daysUntilStart = Math.round((startClean.getTime() - todayDateIST.getTime()) / 86400000);
    const isDuring = todayDateIST >= startClean && todayDateIST <= endClean;

    // Signal 14 days before or during
    if ((daysUntilStart > 0 && daysUntilStart <= 14) || isDuring) {
      const severity = isDuring && window.intensity === "peak" ? "critical" as const
        : isDuring ? "high" as const
        : daysUntilStart <= 7 ? "high" as const : "medium" as const;

      signals.push({
        id: signalId("wedding", window.name.toLowerCase().replace(/\s+/g, "-")),
        type: "wedding",
        source: "wedding-intensity-index",
        title: isDuring
          ? `${window.name} — ${window.weddingsEstimate} happening NOW`
          : `${window.name} starts in ${daysUntilStart} days — ${window.weddingsEstimate}`,
        description: `${window.description} Regions: ${window.regions.join(", ")}. Wedding guests, bride/groom families, gifting — every luxury category peaks during muhurat windows.`,
        location: window.regions.join(", "),
        severity,
        triggersWhat: "Wedding outfits, gifting, shoes, bags, accessories, jewelry, grooming — EVERY luxury category",
        targetArchetypes: ["Wedding Guest", "Bride/Groom Family", "Gift Buyer"],
        suggestedBrands: ["Hugo Boss", "Versace", "Jimmy Choo", "Coach", "Swarovski", "Self Portrait"],
        suggestedAction: isDuring
          ? `WEDDING SEASON PEAK: ${window.weddingsEstimate}. Max out budget on wedding guest outfits, gifting, and occasion wear. Target ${window.regions.join(", ")}.`
          : `Prepare wedding campaigns. ${window.weddingsEstimate} expected. Stock up wedding gift packaging. Launch "wedding guest edit" campaigns.`,
        confidence: 0.95,
        expiresAt: new Date(endClean.getTime() + 3 * 86400000),
        data: { window: window.name, intensity: window.intensity, weddings: window.weddingsEstimate },
        detectedAt: today,
      });
    }
  }

  // Check individual auspicious dates
  for (const date of AUSPICIOUS_WEDDING_DATES_2026) {
    const auspDate = new Date(date.date);
    const auspClean = new Date(auspDate.getFullYear(), auspDate.getMonth(), auspDate.getDate());
    const daysUntil = Math.round((auspClean.getTime() - todayDateIST.getTime()) / 86400000);

    if (daysUntil > 0 && daysUntil <= 7) {
      signals.push({
        id: signalId("wedding", `auspicious-${date.name.toLowerCase().replace(/\s+/g, "-")}`),
        type: "wedding",
        source: "wedding-intensity-index",
        title: `${date.name} in ${daysUntil} days — peak wedding date`,
        description: `${date.note}. ${date.name} is one of the most auspicious days for Indian weddings. Luxury gifting and wedding outfit searches spike 3-5x.`,
        location: "Pan India",
        severity: daysUntil <= 3 ? "high" as const : "medium" as const,
        triggersWhat: "Wedding gifts, occasion outfits, luxury accessories, jewelry",
        targetArchetypes: ["Wedding Guest", "Gift Buyer", "Bride/Groom Family"],
        suggestedBrands: ["Swarovski", "Coach", "Jimmy Choo", "Hugo Boss"],
        suggestedAction: `${date.name} is ${daysUntil} days away. Run "auspicious gifting" campaigns. Push wallets, jewelry, accessories under ₹15,000 for gifting.`,
        confidence: 0.95,
        expiresAt: new Date(auspClean.getTime() + 2 * 86400000),
        data: { date: date.date, name: date.name },
        detectedAt: today,
      });
    }
  }

  return signals;
}
