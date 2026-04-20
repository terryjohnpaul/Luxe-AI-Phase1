/**
 * Sale Event Dynamics — Behavioral Physics Around Sales
 * Detects: pre-buzz, rush, cliff, echo phases around sale events.
 * Imports from sale-events.ts for upcoming/active sale data.
 * Source: Historical sale pattern analysis + sale-events calendar
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";
import { getSaleEventSignals } from "./sale-events";

interface SalePhase {
  name: string;
  key: string;
  offsetStart: number; // days relative to sale start (negative = before)
  offsetEnd: number;
  budget_multiplier: number;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  action: string;
}

const SALE_PHASE_CONFIG: SalePhase[] = [
  {
    name: "Pre-Buzz",
    key: "pre_buzz",
    offsetStart: -2,
    offsetEnd: -1,
    budget_multiplier: 3.0,
    severity: "critical",
    description: "2 days before sale start. Anticipation peaks. Wishlists are being built. Teaser campaigns drive 3x engagement. Consumers are primed but waiting.",
    action: "Launch teaser campaigns. 'Sale starts in X days' countdown. Push wishlist creation. Build remarketing audiences for sale day.",
  },
  {
    name: "Rush",
    key: "rush",
    offsetStart: 0,
    offsetEnd: 2,
    budget_multiplier: 4.0,
    severity: "critical",
    description: "First 3 days of sale. Maximum frenzy. 60% of sale revenue happens in first 48 hours. Impulse purchases at peak. FOMO drives conversion.",
    action: "MAXIMUM BUDGET. 4x normal spend. Push urgency: 'Selling fast', 'Limited stock'. Run Google Shopping + Meta carousels with sale prices.",
  },
  {
    name: "Cliff",
    key: "cliff",
    offsetStart: 1, // relative to sale END
    offsetEnd: 1,
    budget_multiplier: 0.6,
    severity: "high",
    description: "Day after sale ends. Spending drops 40% overnight. Post-purchase guilt. Category fatigue. Don't waste budget chasing yesterday's demand.",
    action: "CUT budgets by 40%. Post-sale cliff. Switch to soft messaging: 'New arrivals' or 'Full price favorites'. No discount language.",
  },
  {
    name: "Echo",
    key: "echo",
    offsetStart: 5, // relative to sale END
    offsetEnd: 7,
    budget_multiplier: 1.5,
    severity: "medium",
    description: "Days 5-7 after sale ends. Second peak from late deciders, returns-and-rebuy cycle, and social media FOMO from friends' purchases.",
    action: "Re-engage with 1.5x budget. Target: users who browsed during sale but didn't buy. Push 'Still available' + new arrivals messaging.",
  },
];

const SALE_CAMPAIGN_ROAS: Record<string, { roas: number; verdict: string }> = {
  dedicated_google: { roas: 0.02, verdict: "NEVER create dedicated Google campaigns for sales. 0.02x ROAS = 98% loss." },
  dedicated_meta: { roas: 3.2, verdict: "Dedicated Meta sale campaigns are OK but not great. 3.2x ROAS." },
  always_on_google: { roas: 216.0, verdict: "Always-on Google campaigns during sales = 216x ROAS. The algo already knows sale intent." },
  always_on_meta: { roas: 42.51, verdict: "Always-on Meta during sales = 42.51x ROAS. Let existing campaigns ride the sale wave." },
};

// Known sale events for phase calculation
interface SaleWindow {
  name: string;
  start: string;
  end: string;
}

const SALE_WINDOWS_2026: SaleWindow[] = [
  { name: "India Luxury EOSS Summer", start: "2026-01-10", end: "2026-01-25" },
  { name: "India Luxury EOSS Winter", start: "2026-07-05", end: "2026-07-20" },
  { name: "Big Brand Sale", start: "2026-03-20", end: "2026-03-25" },
  { name: "Diwali Luxury Sale", start: "2026-10-15", end: "2026-10-25" },
  { name: "Republic Day Sale", start: "2026-01-24", end: "2026-01-27" },
  { name: "Independence Day Sale", start: "2026-08-13", end: "2026-08-16" },
  { name: "New Season Drop SS26", start: "2026-02-15", end: "2026-03-15" },
  { name: "New Season Drop FW26", start: "2026-08-15", end: "2026-09-15" },
];

export async function getSaleEventDynamicsSignals(): Promise<Signal[]> {
  try {
    const now = new Date();
    const signals: Signal[] = [];

    for (const sale of SALE_WINDOWS_2026) {
      const startDate = new Date(sale.start);
      const endDate = new Date(sale.end);
      const daysToStart = Math.ceil((startDate.getTime() - now.getTime()) / 86400000);
      const daysFromEnd = Math.ceil((now.getTime() - endDate.getTime()) / 86400000);
      const daysFromStart = Math.ceil((now.getTime() - startDate.getTime()) / 86400000);

      // === PRE-BUZZ: 2 days before sale ===
      if (daysToStart >= 1 && daysToStart <= 2) {
        const phase = SALE_PHASE_CONFIG[0]; // pre_buzz
        signals.push({
          id: signalId("sale-dynamics", `pre-buzz-${sale.name.toLowerCase().replace(/\s+/g, "-")}`),
          type: "sale_event",
          source: "sale-dynamics",
          title: `Pre-Buzz Phase D-${daysToStart}: ${sale.name}`,
          description: `${sale.name} starts in ${daysToStart} day(s). ${phase.description}`,
          location: "Pan India",
          severity: phase.severity,
          triggersWhat: "Teaser campaigns, wishlist building, countdown messaging",
          targetArchetypes: ["Fashion Loyalist", "Occasional Splurger", "Aspirant"],
          suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss", "Diesel", "Kate Spade"],
          suggestedAction: `${phase.action} Budget: ${phase.budget_multiplier}x normal.`,
          confidence: 0.96,
          expiresAt: startDate,
          data: { sale: sale.name, phase: "pre_buzz", daysToStart, budget_multiplier: phase.budget_multiplier },
          detectedAt: now,
        });
      }

      // === RUSH: First 3 days of sale ===
      if (daysFromStart >= 0 && daysFromStart <= 2 && daysToStart <= 0) {
        const phase = SALE_PHASE_CONFIG[1]; // rush
        signals.push({
          id: signalId("sale-dynamics", `rush-${sale.name.toLowerCase().replace(/\s+/g, "-")}`),
          type: "sale_event",
          source: "sale-dynamics",
          title: `RUSH Phase Day ${daysFromStart + 1}: ${sale.name}`,
          description: `${sale.name} is LIVE — day ${daysFromStart + 1} of sale. ${phase.description}`,
          location: "Pan India",
          severity: phase.severity,
          triggersWhat: "Maximum budget allocation, urgency messaging, price-forward ads",
          targetArchetypes: ["All"],
          suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss", "Diesel", "Kate Spade", "Armani Exchange"],
          suggestedAction: `${phase.action} Budget: ${phase.budget_multiplier}x normal.`,
          confidence: 0.97,
          expiresAt: new Date(startDate.getTime() + 3 * 86400000),
          data: { sale: sale.name, phase: "rush", dayOfSale: daysFromStart + 1, budget_multiplier: phase.budget_multiplier },
          detectedAt: now,
        });
      }

      // === CLIFF: Day after sale ends ===
      if (daysFromEnd >= 0 && daysFromEnd <= 1) {
        const phase = SALE_PHASE_CONFIG[2]; // cliff
        signals.push({
          id: signalId("sale-dynamics", `cliff-${sale.name.toLowerCase().replace(/\s+/g, "-")}`),
          type: "sale_event",
          source: "sale-dynamics",
          title: `Post-Sale Cliff Warning: ${sale.name}`,
          description: `${sale.name} ended ${daysFromEnd} day(s) ago. ${phase.description}`,
          location: "Pan India",
          severity: phase.severity,
          triggersWhat: "Cut aggressive spend, shift to soft messaging, new arrivals focus",
          targetArchetypes: ["Fashion Loyalist"],
          suggestedBrands: [],
          suggestedAction: `${phase.action} Budget: ${phase.budget_multiplier}x normal (= 40% reduction).`,
          confidence: 0.95,
          expiresAt: expiresIn(48),
          data: { sale: sale.name, phase: "cliff", daysFromEnd, budget_multiplier: phase.budget_multiplier, spend_drop: "40%" },
          detectedAt: now,
        });
      }

      // === ECHO: Days 5-7 after sale ends ===
      if (daysFromEnd >= 5 && daysFromEnd <= 7) {
        const phase = SALE_PHASE_CONFIG[3]; // echo
        signals.push({
          id: signalId("sale-dynamics", `echo-${sale.name.toLowerCase().replace(/\s+/g, "-")}`),
          type: "sale_event",
          source: "sale-dynamics",
          title: `Double Sale Echo: ${sale.name}`,
          description: `${sale.name} ended ${daysFromEnd} days ago. ${phase.description}`,
          location: "Pan India",
          severity: phase.severity,
          triggersWhat: "Re-engagement campaigns, retargeting sale browsers, social proof",
          targetArchetypes: ["Occasional Splurger", "Aspirant"],
          suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss"],
          suggestedAction: `${phase.action} Budget: ${phase.budget_multiplier}x normal.`,
          confidence: 0.93,
          expiresAt: expiresIn(72),
          data: { sale: sale.name, phase: "echo", daysFromEnd, budget_multiplier: phase.budget_multiplier },
          detectedAt: now,
        });
      }
    }

    // === ANTI-PATTERN: Dedicated Sale Campaigns ===
    // Check if any sale is active or approaching
    const anySaleActive = SALE_WINDOWS_2026.some(s => {
      const start = new Date(s.start);
      const end = new Date(s.end);
      const daysToStart = Math.ceil((start.getTime() - now.getTime()) / 86400000);
      return (daysToStart <= 3 && daysToStart >= -1) || (now >= start && now <= end);
    });

    if (anySaleActive) {
      signals.push({
        id: signalId("sale-dynamics", "anti-pattern-dedicated-campaign"),
        type: "sale_event",
        source: "sale-dynamics",
        title: "Anti-Pattern: Don't Create Dedicated Sale Campaign",
        description: "CRITICAL DATA: Dedicated Google sale campaigns = 0.02x ROAS (98% loss). Dedicated Meta sale campaigns = 3.2x ROAS (mediocre). BUT: Always-on Google campaigns during sales = 216x ROAS. Always-on Meta = 42.51x ROAS. The algorithm already picks up sale intent — let existing campaigns ride the wave.",
        location: "Pan India",
        severity: "critical",
        triggersWhat: "DO NOT create new sale-specific campaigns. Boost existing always-on campaigns instead.",
        targetArchetypes: ["All"],
        suggestedBrands: [],
        suggestedAction: "BOOST existing always-on campaigns by 3-4x. DO NOT create dedicated sale campaigns. Data: Always-on Google = 216x ROAS vs dedicated Google = 0.02x ROAS. The difference is 10,800x.",
        confidence: 0.97,
        expiresAt: expiresIn(72),
        data: {
          dedicated_google_roas: 0.02,
          dedicated_meta_roas: 3.2,
          always_on_google_roas: 216.0,
          always_on_meta_roas: 42.51,
          verdict: "Never create dedicated sale campaigns",
        },
        detectedAt: now,
      });
    }

    // === Double sale proximity warning ===
    for (let i = 0; i < SALE_WINDOWS_2026.length; i++) {
      for (let j = i + 1; j < SALE_WINDOWS_2026.length; j++) {
        const endA = new Date(SALE_WINDOWS_2026[i].end);
        const startB = new Date(SALE_WINDOWS_2026[j].start);
        const gap = Math.ceil((startB.getTime() - endA.getTime()) / 86400000);
        if (gap > 0 && gap <= 5) {
          const daysToSecond = Math.ceil((startB.getTime() - now.getTime()) / 86400000);
          if (daysToSecond > 0 && daysToSecond <= 10) {
            signals.push({
              id: signalId("sale-dynamics", `double-sale-${SALE_WINDOWS_2026[j].name.toLowerCase().replace(/\s+/g, "-")}`),
              type: "sale_event",
              source: "sale-dynamics",
              title: `Double Sale Alert: ${SALE_WINDOWS_2026[i].name} -> ${SALE_WINDOWS_2026[j].name}`,
              description: `Only ${gap} days between ${SALE_WINDOWS_2026[i].name} ending and ${SALE_WINDOWS_2026[j].name} starting. Skip the cliff phase — maintain elevated budget through the gap.`,
              location: "Pan India",
              severity: "high",
              triggersWhat: "Maintain elevated budgets through the gap between sales",
              targetArchetypes: ["All"],
              suggestedBrands: [],
              suggestedAction: `Don't cut budgets between sales. ${gap}-day gap is too short for cliff+echo. Maintain 2x budget throughout.`,
              confidence: 0.93,
              expiresAt: new Date(startB.getTime() + 3 * 86400000),
              data: { sale1: SALE_WINDOWS_2026[i].name, sale2: SALE_WINDOWS_2026[j].name, gap_days: gap },
              detectedAt: now,
            });
          }
        }
      }
    }

    return signals;
  } catch (error) {
    console.error("[sale-dynamics] Error generating signals:", error);
    return [];
  }
}
