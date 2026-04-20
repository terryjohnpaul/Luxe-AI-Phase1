/**
 * Luxury Consumer Calendar Signals
 * Monthly/weekly performance patterns from historical ad data.
 * Detects: month efficiency, quarter-start surges, week-2 peaks, anti-Diwali paradox.
 * Source: Date-based rules + festival calendar cross-reference
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

interface MonthPerformance {
  month: number;
  name: string;
  rating: "goldmine" | "good" | "average" | "low" | "trough";
  cpa_multiplier: number; // vs annual average (1.0 = average)
  efficiency_note: string;
}

const MONTH_PERFORMANCE_INDEX: MonthPerformance[] = [
  { month: 1,  name: "January",   rating: "goldmine", cpa_multiplier: 0.76, efficiency_note: "Post-holiday clearance + New Year resolutions. Cheapest CPAs of the year." },
  { month: 2,  name: "February",  rating: "good",     cpa_multiplier: 0.88, efficiency_note: "Valentine's Day drives gifting. Good for accessories and perfume." },
  { month: 3,  name: "March",     rating: "good",     cpa_multiplier: 0.90, efficiency_note: "Holi + financial year-end bonuses. Corporate spending." },
  { month: 4,  name: "April",     rating: "trough",   cpa_multiplier: 1.25, efficiency_note: "Post-financial-year slump. Tax payments drain wallets. Worst ROI." },
  { month: 5,  name: "May",       rating: "average",  cpa_multiplier: 1.05, efficiency_note: "Summer lull. Some wedding season overlap. Heat reduces browsing." },
  { month: 6,  name: "June",      rating: "average",  cpa_multiplier: 1.00, efficiency_note: "EOSS anticipation builds. Consumers wait for July sales." },
  { month: 7,  name: "July",      rating: "good",     cpa_multiplier: 0.85, efficiency_note: "EOSS Summer Sale peak. High volume, good CPA during sales." },
  { month: 8,  name: "August",    rating: "low",      cpa_multiplier: 1.35, efficiency_note: "Monsoon trough. Worst weather + post-sale fatigue. Minimize spend." },
  { month: 9,  name: "September", rating: "average",  cpa_multiplier: 1.00, efficiency_note: "Pre-festive warm-up. Onam in Kerala. Spend starts recovering." },
  { month: 10, name: "October",   rating: "low",      cpa_multiplier: 1.40, efficiency_note: "Diwali PARADOX: highest spend but highest CPAs. Everyone bids. CPA inflated 40%." },
  { month: 11, name: "November",  rating: "good",     cpa_multiplier: 0.92, efficiency_note: "Post-Diwali + Black Friday. Competition drops, deals shoppers remain." },
  { month: 12, name: "December",  rating: "goldmine", cpa_multiplier: 0.71, efficiency_note: "Christmas + NYE. Lowest CPAs. Gifting peak. Party wear demand. Best ROAS." },
];

// Diwali 2026 date (from festival calendar)
const DIWALI_2026 = "2026-10-31";

export async function getLuxuryConsumerCalendarSignals(): Promise<Signal[]> {
  try {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();
    const signals: Signal[] = [];

    const currentMonth = MONTH_PERFORMANCE_INDEX.find(m => m.month === month)!;

    // === SIGNAL 1: Current month performance ===
    signals.push({
      id: signalId("consumer-calendar", `month-${currentMonth.name.toLowerCase()}`),
      type: "economic",
      source: "consumer-calendar",
      title: `${currentMonth.name} CPA ${currentMonth.rating === "goldmine" ? "Goldmine" : currentMonth.rating === "trough" ? "Trough" : currentMonth.rating === "low" ? "Warning" : "Performance"}`,
      description: `${currentMonth.name}: ${currentMonth.efficiency_note} CPA multiplier: ${currentMonth.cpa_multiplier}x average (${currentMonth.cpa_multiplier < 1 ? "CHEAPER" : "MORE EXPENSIVE"} than average).`,
      location: "Pan India",
      severity: currentMonth.rating === "goldmine" ? "critical" : currentMonth.rating === "trough" ? "high" : currentMonth.rating === "low" ? "high" : "medium",
      triggersWhat: currentMonth.cpa_multiplier < 1 ? "Increase spend — CPAs are below average" : "Reduce or hold spend — CPAs are inflated",
      targetArchetypes: ["All"],
      suggestedBrands: [],
      suggestedAction: currentMonth.cpa_multiplier < 1
        ? `BOOST budgets by ${Math.round((1 - currentMonth.cpa_multiplier) * 100)}%. ${currentMonth.name} is a ${currentMonth.rating}. CPAs are ${Math.round((1 - currentMonth.cpa_multiplier) * 100)}% below average.`
        : `REDUCE budgets by ${Math.round((currentMonth.cpa_multiplier - 1) * 100)}% or shift to efficiency campaigns. ${currentMonth.name} CPAs are ${Math.round((currentMonth.cpa_multiplier - 1) * 100)}% above average.`,
      confidence: 0.94,
      expiresAt: expiresIn(168),
      data: { month, name: currentMonth.name, rating: currentMonth.rating, cpa_multiplier: currentMonth.cpa_multiplier },
      detectedAt: now,
    });

    // === SIGNAL 2: January Goldmine ===
    if (month === 1) {
      signals.push({
        id: signalId("consumer-calendar", "january-goldmine"),
        type: "economic",
        source: "consumer-calendar",
        title: "January CPA Goldmine",
        description: "January is one of two CPA goldmine months. CPAs at 0.76x average — 24% cheaper than annual baseline. New Year resolution buyers, post-holiday clearance shoppers. Maximize every rupee.",
        location: "Pan India",
        severity: "critical",
        triggersWhat: "All categories — maximum budget allocation. EOSS + New Year = best ROI.",
        targetArchetypes: ["All"],
        suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss", "Diesel", "Kate Spade"],
        suggestedAction: "SURGE SPEND: January is a goldmine. Increase budgets 25-30%. Push clearance + new arrivals. Every category profitable.",
        confidence: 0.96,
        expiresAt: new Date(now.getFullYear(), 1, 1),
        data: { month: 1, cpa_multiplier: 0.76, rating: "goldmine" },
        detectedAt: now,
      });
    }

    // === SIGNAL 3: April Quiet Month ===
    if (month === 4) {
      signals.push({
        id: signalId("consumer-calendar", "april-trough"),
        type: "economic",
        source: "consumer-calendar",
        title: "April Quiet Month — Trough Warning",
        description: "April is the annual trough. CPA at 1.25x — 25% more expensive. Post-financial-year tax payments, bonus spending already done. Reduce prospecting, focus on retargeting.",
        location: "Pan India",
        severity: "high",
        triggersWhat: "Reduce new customer acquisition. Retargeting only. Build audiences for July EOSS.",
        targetArchetypes: ["Fashion Loyalist"],
        suggestedBrands: [],
        suggestedAction: "CUT prospecting budgets 20-25%. April is a trough. Focus on retargeting warm audiences. Build lookalikes for July EOSS.",
        confidence: 0.93,
        expiresAt: new Date(now.getFullYear(), 4, 1),
        data: { month: 4, cpa_multiplier: 1.25, rating: "trough" },
        detectedAt: now,
      });
    }

    // === SIGNAL 4: August Monsoon Trough ===
    if (month === 8) {
      signals.push({
        id: signalId("consumer-calendar", "august-monsoon-trough"),
        type: "economic",
        source: "consumer-calendar",
        title: "August Monsoon Trough",
        description: "August: CPA at 1.35x average. Monsoon depresses outdoor activity and shopping mood. Post-EOSS fatigue. Rain = less delivery reliability. Minimize aggressive spend.",
        location: "Pan India",
        severity: "high",
        triggersWhat: "Reduce spend. Focus on indoor categories: loungewear, home, fragrance.",
        targetArchetypes: ["Fashion Loyalist"],
        suggestedBrands: ["Versace Home", "Villeroy & Boch"],
        suggestedAction: "REDUCE budgets 25-30%. August monsoon trough. Shift to home + fragrance categories. Build festive season audiences.",
        confidence: 0.92,
        expiresAt: new Date(now.getFullYear(), 8, 1),
        data: { month: 8, cpa_multiplier: 1.35, rating: "low" },
        detectedAt: now,
      });
    }

    // === SIGNAL 5: December Goldmine ===
    if (month === 12) {
      signals.push({
        id: signalId("consumer-calendar", "december-goldmine"),
        type: "economic",
        source: "consumer-calendar",
        title: "December CPA Goldmine",
        description: "December has the lowest CPAs of the year at 0.71x. Christmas gifting + NYE party wear + year-end bonuses. Perfect storm for luxury. Best ROAS month.",
        location: "Pan India",
        severity: "critical",
        triggersWhat: "ALL categories at maximum. Gifting, party wear, accessories, perfume.",
        targetArchetypes: ["All"],
        suggestedBrands: ["All brands — maximum push"],
        suggestedAction: "MAXIMUM SPEND: December is the #1 goldmine. Increase budgets 30-40%. Push gifting + party wear. Every channel profitable.",
        confidence: 0.97,
        expiresAt: new Date(now.getFullYear(), 11, 31),
        data: { month: 12, cpa_multiplier: 0.71, rating: "goldmine" },
        detectedAt: now,
      });
    }

    // === SIGNAL 6: Quarter-Start Surge ===
    const isQuarterStart = [1, 4, 7, 10].includes(month) && day >= 1 && day <= 5;
    if (isQuarterStart) {
      const quarterNames: Record<number, string> = { 1: "Q1 (Jan-Mar)", 4: "Q2 (Apr-Jun)", 7: "Q3 (Jul-Sep)", 10: "Q4 (Oct-Dec)" };
      signals.push({
        id: signalId("consumer-calendar", "quarter-start-surge"),
        type: "economic",
        source: "consumer-calendar",
        title: "Quarter Start Surge",
        description: `Day ${day} of ${quarterNames[month]}. First 5 days of each quarter see a 2-3x spend jump as corporate budgets reset, quarterly bonuses land, and fresh financial planning begins.`,
        location: "Pan India",
        severity: "critical",
        triggersWhat: "All categories — capitalize on fresh budget psychology",
        targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
        suggestedBrands: ["Hugo Boss", "Coach", "Emporio Armani", "Michael Kors"],
        suggestedAction: "BOOST budgets 2x for days 1-5 of quarter. Fresh corporate budgets = spending spree. Push premium categories.",
        confidence: 0.93,
        expiresAt: expiresIn(120),
        data: { month, day, quarter: quarterNames[month], spend_jump: "2-3x" },
        detectedAt: now,
      });
    }

    // === SIGNAL 7: Week-2 Peak ===
    if (day >= 7 && day <= 14) {
      signals.push({
        id: signalId("consumer-calendar", "week-2-peak"),
        type: "economic",
        source: "consumer-calendar",
        title: "Week-2 Peak: 27% More Spending",
        description: `Days 7-14 of the month see 27% more spending than other weeks. Post-salary settling period — bills are paid, disposable income is clear, and luxury purchases feel justified.`,
        location: "Pan India",
        severity: "high",
        triggersWhat: "All luxury categories — mid-month spending peak",
        targetArchetypes: ["Urban Achiever", "Occasional Splurger"],
        suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss", "Kate Spade"],
        suggestedAction: "BOOST budgets by 20%. Week-2 (days 7-14) is the confirmed spending peak. 27% above average.",
        confidence: 0.93,
        expiresAt: expiresIn(168),
        data: { day, week: 2, spend_uplift: "27%" },
        detectedAt: now,
      });
    }

    // === SIGNAL 8: Anti-Diwali Paradox ===
    const diwaliDate = new Date(DIWALI_2026);
    const daysToDiwali = Math.ceil((diwaliDate.getTime() - now.getTime()) / 86400000);
    if (daysToDiwali > 0 && daysToDiwali <= 30 && month === 10) {
      signals.push({
        id: signalId("consumer-calendar", "anti-diwali-paradox"),
        type: "economic",
        source: "consumer-calendar",
        title: "Anti-Diwali Day: CPA Paradox Warning",
        description: `Diwali in ${daysToDiwali} days. CRITICAL INSIGHT: October has the HIGHEST CPAs (1.40x average) despite being the biggest shopping festival. Every competitor floods ads. Result: 40% CPA inflation. Don't blindly increase spend — increase EFFICIENCY.`,
        location: "Pan India",
        severity: "critical",
        triggersWhat: "Efficiency over volume. Better creatives, tighter targeting, avoid broad campaigns.",
        targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
        suggestedBrands: ["All brands — but targeted, not broad"],
        suggestedAction: "DO NOT blindly 3x budget for Diwali. CPAs are 40% inflated. Instead: (1) Tighten targeting to warm audiences, (2) Use sale-specific creatives, (3) Focus on retargeting, (4) Bid on exact-match keywords only.",
        confidence: 0.95,
        expiresAt: new Date(diwaliDate.getTime() + 7 * 86400000),
        data: { daysToDiwali, october_cpa: 1.40, paradox: "highest_spend_highest_cpa" },
        detectedAt: now,
      });
    }

    // === SIGNAL 9: Next month preview ===
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextMonthData = MONTH_PERFORMANCE_INDEX.find(m => m.month === nextMonth)!;
    if (day >= 25) {
      signals.push({
        id: signalId("consumer-calendar", "next-month-preview"),
        type: "economic",
        source: "consumer-calendar",
        title: `Next Month Preview: ${nextMonthData.name} (${nextMonthData.rating})`,
        description: `${nextMonthData.name} is coming. Rating: ${nextMonthData.rating}. CPA multiplier: ${nextMonthData.cpa_multiplier}x. ${nextMonthData.efficiency_note}. Plan budgets now.`,
        location: "Pan India",
        severity: "medium",
        triggersWhat: "Budget planning for next month",
        targetArchetypes: ["All"],
        suggestedBrands: [],
        suggestedAction: `Prepare ${nextMonthData.name} budgets. CPA expected at ${nextMonthData.cpa_multiplier}x. ${nextMonthData.cpa_multiplier < 1 ? "Increase budgets — good month ahead." : "Tighten budgets — expensive month ahead."}`,
        confidence: 0.92,
        expiresAt: expiresIn(168),
        data: { nextMonth, name: nextMonthData.name, rating: nextMonthData.rating, cpa_multiplier: nextMonthData.cpa_multiplier },
        detectedAt: now,
      });
    }

    // === SIGNAL 10: Month-end slowdown ===
    if (day >= 20 && day <= 24) {
      signals.push({
        id: signalId("consumer-calendar", "month-end-slowdown"),
        type: "economic",
        source: "consumer-calendar",
        title: "Month-End Budget Anxiety",
        description: "Days 20-24: Pre-payday budget anxiety. Disposable income is low. Luxury purchases are deferred. Reduce prospecting, focus on retargeting warm leads.",
        location: "Pan India",
        severity: "low",
        triggersWhat: "Reduce prospecting. Retargeting and cart recovery only.",
        targetArchetypes: ["Occasional Splurger", "Aspirant"],
        suggestedBrands: [],
        suggestedAction: "Reduce prospecting by 15%. Focus on retargeting users who browsed in week 2. They'll convert post-salary.",
        confidence: 0.92,
        expiresAt: expiresIn(96),
        data: { day, phase: "pre_payday_anxiety" },
        detectedAt: now,
      });
    }

    // === SIGNAL 11: Seasonal transition insight ===
    const transitions: Record<number, { from: string; to: string; action: string }> = {
      3: { from: "winter", to: "summer", action: "Push summer collections, sunglasses, light fabrics" },
      6: { from: "summer", to: "monsoon", action: "Push monsoon-ready: waterproof bags, closed shoes, light layers" },
      9: { from: "monsoon", to: "festive", action: "Transition to festive wardrobe. Ethnic luxury, celebration wear" },
      11: { from: "festive", to: "winter", action: "Push winter collections: coats, scarves, boots, knitwear" },
    };
    if (transitions[month]) {
      const t = transitions[month];
      signals.push({
        id: signalId("consumer-calendar", "seasonal-transition"),
        type: "category_demand",
        source: "consumer-calendar",
        title: `Seasonal Transition: ${t.from} to ${t.to}`,
        description: `${currentMonth.name} marks the ${t.from}-to-${t.to} transition. Wardrobe refresh demand rises. ${t.action}.`,
        location: "Pan India",
        severity: "medium",
        triggersWhat: t.action,
        targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
        suggestedBrands: [],
        suggestedAction: t.action,
        confidence: 0.92,
        expiresAt: expiresIn(336),
        data: { month, from: t.from, to: t.to },
        detectedAt: now,
      });
    }

    return signals;
  } catch (error) {
    console.error("[consumer-calendar] Error generating signals:", error);
    return [];
  }
}
