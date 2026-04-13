/**
 * Sale Event Signals — India Luxury
 * Platform sale events are the HIGHEST converting events in e-commerce.
 * Detects: India Luxury sales, EOSS, flash sales, brand-specific promotions.
 * Source: Calendar + business rules (no API needed)
 */

import { Signal, signalId, expiresIn } from "./types";

interface SaleEvent {
  name: string;
  startDate2026: string;
  endDate2026: string;
  type: "mega_sale" | "eoss" | "brand_sale" | "flash_sale" | "festival_sale";
  discountRange: string;
  topBrands: string[];
  adStrategy: string;
  expectedLift: string;
  budgetMultiplier: number;
}

const SALE_EVENTS_2026: SaleEvent[] = [
  {
    name: "India Luxury EOSS — Summer",
    startDate2026: "2026-01-10",
    endDate2026: "2026-01-25",
    type: "eoss",
    discountRange: "30-60% off on accessible + premium tiers",
    topBrands: ["Coach", "Michael Kors", "Armani Exchange", "Diesel", "Hugo Boss", "Kate Spade"],
    adStrategy: "Price-forward ads. Show discounted prices. Urgency messaging ('Ends in X days'). Google Shopping with sale prices. Instagram carousel with best deals.",
    expectedLift: "EOSS drives 3-5x normal volume. ROAS typically 5-8x during sales.",
    budgetMultiplier: 3.0,
  },
  {
    name: "India Luxury EOSS — Winter",
    startDate2026: "2026-07-05",
    endDate2026: "2026-07-20",
    type: "eoss",
    discountRange: "30-60% off on accessible + premium tiers",
    topBrands: ["Coach", "Michael Kors", "Armani Exchange", "Diesel", "Hugo Boss", "Kate Spade", "Ted Baker"],
    adStrategy: "Mid-year clearance. Push last season inventory hard. Price-forward. 'Up to 60% off luxury brands' headline.",
    expectedLift: "July EOSS: 2-4x normal volume.",
    budgetMultiplier: 2.5,
  },
  {
    name: "India Luxury Big Brand Sale",
    startDate2026: "2026-03-20",
    endDate2026: "2026-03-25",
    type: "mega_sale",
    discountRange: "20-40% on select brands",
    topBrands: ["Hugo Boss", "Coach", "Diesel", "Armani Exchange", "Michael Kors"],
    adStrategy: "Brand-focused sale. Run brand-specific landing pages. 'Hugo Boss from ₹4,999' type messaging.",
    expectedLift: "2-3x normal volume for participating brands.",
    budgetMultiplier: 2.0,
  },
  {
    name: "Diwali Luxury Sale",
    startDate2026: "2026-10-15",
    endDate2026: "2026-10-25",
    type: "festival_sale",
    discountRange: "15-40% + bank offers",
    topBrands: ["Coach", "Michael Kors", "Hugo Boss", "Kate Spade", "Swarovski", "TUMI"],
    adStrategy: "Festival + sale = highest intent. Run gift-focused + self-purchase ads. Bank partnership offers (extra 10% on HDFC/ICICI). Google Shopping + Instagram + Facebook.",
    expectedLift: "Diwali sale: 5-10x normal. Highest ROAS period of the year.",
    budgetMultiplier: 4.0,
  },
  {
    name: "New Season Drop — SS26",
    startDate2026: "2026-02-15",
    endDate2026: "2026-03-15",
    type: "brand_sale",
    discountRange: "No discounts — full price new arrivals",
    topBrands: ["Jacquemus", "Zimmermann", "Farm Rio", "Sandro", "Maje", "Kenzo", "Ami Paris"],
    adStrategy: "New arrival excitement. 'First to wear SS26' messaging. Editorial-style lookbook ads. NO price in ads — aspirational only. Target Fashion Loyalists.",
    expectedLift: "New season drives 1.5-2x for luxury tier. Higher AOV, no discounting.",
    budgetMultiplier: 1.5,
  },
  {
    name: "New Season Drop — FW26",
    startDate2026: "2026-08-15",
    endDate2026: "2026-09-15",
    type: "brand_sale",
    discountRange: "No discounts — full price new arrivals",
    topBrands: ["Max Mara", "Hugo Boss", "Acne Studios", "All Saints", "A-Cold-Wall", "Stella McCartney"],
    adStrategy: "Fall/Winter collection launch. Coats, knitwear, boots. 'The new season starts here' messaging. Push outerwear brands.",
    expectedLift: "FW season launch: 1.5-2x for premium+luxury tiers.",
    budgetMultiplier: 1.5,
  },
  {
    name: "Republic Day Sale",
    startDate2026: "2026-01-24",
    endDate2026: "2026-01-27",
    type: "festival_sale",
    discountRange: "20-50% on select brands",
    topBrands: ["Armani Exchange", "Diesel", "Hugo Boss", "Coach", "Michael Kors"],
    adStrategy: "Long weekend + sale. Push casual luxury. 'Republic Day weekend deals' on Google. Instagram Stories with countdown.",
    expectedLift: "2-3x normal. Long weekend = browsing time.",
    budgetMultiplier: 2.0,
  },
  {
    name: "Independence Day Sale",
    startDate2026: "2026-08-13",
    endDate2026: "2026-08-16",
    type: "festival_sale",
    discountRange: "20-40% on select brands",
    topBrands: ["Hugo Boss", "Lacoste", "Armani Exchange", "Diesel", "G-Star Raw"],
    adStrategy: "Independence Day long weekend sale. Push premium casual. 'Freedom to splurge' messaging.",
    expectedLift: "2x normal volume.",
    budgetMultiplier: 2.0,
  },
];

export function getSaleEventSignals(): Signal[] {
  const now = new Date();
  const signals: Signal[] = [];

  for (const sale of SALE_EVENTS_2026) {
    const startDate = new Date(sale.startDate2026);
    const endDate = new Date(sale.endDate2026);
    const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / 86400000);
    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);

    // Pre-sale: 14 days before start
    if (daysUntilStart > 0 && daysUntilStart <= 14) {
      signals.push({
        id: signalId("sale", `pre-${sale.name.toLowerCase().replace(/\s+/g, "-")}`),
        type: "festival",
        source: "sale-intelligence",
        title: `${sale.name} starts in ${daysUntilStart} days — prepare campaigns NOW`,
        description: `${sale.discountRange}. ${sale.adStrategy}\n\nEXPECTED IMPACT: ${sale.expectedLift}\nBUDGET: ${sale.budgetMultiplier}x normal spend recommended.`,
        location: "Pan India",
        severity: daysUntilStart <= 3 ? "critical" as const : "high" as const,
        triggersWhat: `Sale preparation — ${sale.type}`,
        targetArchetypes: ["Fashion Loyalist", "Occasional Splurger", "Urban Achiever"],
        suggestedBrands: sale.topBrands,
        confidence: 0.95,
        suggestedAction: `${daysUntilStart} days to ${sale.name}. Set up campaigns NOW: ${sale.adStrategy}. Budget: ${sale.budgetMultiplier}x.`,
        expiresAt: startDate,
        data: { sale: sale.name, type: sale.type, daysUntil: daysUntilStart, budgetMultiplier: sale.budgetMultiplier },
        detectedAt: now,
      });
    }

    // During sale: active now
    if (daysUntilStart <= 0 && daysUntilEnd > 0) {
      signals.push({
        id: signalId("sale", `live-${sale.name.toLowerCase().replace(/\s+/g, "-")}`),
        type: "festival",
        source: "sale-intelligence",
        title: `LIVE: ${sale.name} — ${daysUntilEnd} days remaining`,
        description: `SALE IS LIVE. ${sale.discountRange}.\n${sale.adStrategy}\n\nRun at ${sale.budgetMultiplier}x budget. ${sale.expectedLift}`,
        location: "Pan India",
        severity: "critical",
        triggersWhat: `Active sale — ${sale.type}`,
        targetArchetypes: ["Fashion Loyalist", "Occasional Splurger", "Urban Achiever", "Aspirant"],
        suggestedBrands: sale.topBrands,
        confidence: 0.99,
        suggestedAction: `SALE IS LIVE! Maximize spend at ${sale.budgetMultiplier}x. Push: ${sale.topBrands.join(", ")}. ${daysUntilEnd} days left.`,
        expiresAt: endDate,
        data: { sale: sale.name, type: sale.type, daysRemaining: daysUntilEnd, budgetMultiplier: sale.budgetMultiplier },
        detectedAt: now,
      });
    }
  }

  return signals;
}
