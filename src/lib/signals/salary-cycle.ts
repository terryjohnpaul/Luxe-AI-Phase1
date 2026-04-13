/**
 * Salary & Economic Cycle Signals
 * Detects: salary day (25th-1st), quarterly bonuses, appraisal season, tax refunds
 * Source: Date-based rules (no API needed)
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

export function getSalaryCycleSignals(): Signal[] {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1; // 1-12
  const signals: Signal[] = [];

  // === SALARY DAY (25th-1st) ===
  if (day >= 25 || day <= 3) {
    const phase = day >= 25 ? "payday_approaching" : "payday_landed";
    signals.push({
      id: signalId("salary", phase),
      type: "salary_cycle",
      source: "date-rules",
      title: day >= 25 ? "Salary day approaching (25th-1st window)" : "Payday! Salary just credited (1st-3rd peak spending)",
      description: day >= 25
        ? "70% of Indian salaries credit between 25th-1st. Spending intent rising. Push aspirational products."
        : "Peak spending window — salaries just credited. Impulse luxury purchases spike today and tomorrow.",
      location: "Pan India",
      severity: day <= 3 ? "critical" : "high",
      triggersWhat: "All luxury categories — especially entry-level luxury for Aspirants",
      targetArchetypes: ["Aspirant", "Urban Achiever"],
      suggestedBrands: ["Hugo Boss", "Diesel", "All Saints", "Coach", "Michael Kors"],
      suggestedAction: day <= 3
        ? "BOOST all campaigns by 20%. Push 'treat yourself' messaging. Highlight EMI options for Aspirants."
        : "Prepare campaigns for salary day. Pre-schedule budget increases for 1st.",
      confidence: 0.90,
      expiresAt: expiresIn(day >= 25 ? 168 : 72), // 7 days or 3 days
      data: { day, phase },
      detectedAt: today,
    });
  }

  // === YEAR-END BONUS (March) ===
  if (month === 3 && day >= 15) {
    signals.push({
      id: signalId("salary", "year-end-bonus"),
      type: "salary_cycle",
      source: "date-rules",
      title: "Year-end bonus season (March)",
      description: "Financial year ending March 31. Bonuses hitting accounts. Professionals feeling flush. 'You earned it' messaging works.",
      location: "Pan India",
      severity: "high",
      triggersWhat: "Premium upgrades: blazers, watches, bags, statement pieces. 'Level up' wardrobe.",
      targetArchetypes: ["Urban Achiever"],
      suggestedBrands: ["Hugo Boss", "Emporio Armani", "Brooks Brothers", "Coach", "TUMI"],
      suggestedAction: "Launch 'You Earned It' campaign targeting professionals in Bangalore, Hyderabad, Pune, Gurgaon, Mumbai.",
      confidence: 0.85,
      expiresAt: new Date(today.getFullYear(), 3, 10), // April 10
      data: { month, reason: "year_end_bonus" },
      detectedAt: today,
    });
  }

  // === IT APPRAISAL SEASON (March-April) ===
  if ((month === 3 && day >= 15) || (month === 4 && day <= 30)) {
    signals.push({
      id: signalId("salary", "it-appraisals"),
      type: "salary_cycle",
      source: "date-rules",
      title: "IT sector appraisal season",
      description: "March-April: IT professionals getting raises and promotions. Wardrobe upgrade trigger for tech hubs.",
      location: "Bangalore, Hyderabad, Pune, Gurgaon, Chennai",
      severity: "medium",
      triggersWhat: "Professional wardrobe upgrade: smart casual, office wear, premium accessories",
      targetArchetypes: ["Urban Achiever", "Aspirant"],
      suggestedBrands: ["Hugo Boss", "All Saints", "Diesel"],
      suggestedAction: "Target IT hubs with 'New role, new you' messaging. Focus on smart casual category.",
      confidence: 0.80,
      expiresAt: new Date(today.getFullYear(), 4, 1),
      data: { month, reason: "it_appraisals" },
      detectedAt: today,
    });
  }

  // === MID-YEAR REVIEW (September) ===
  if (month === 9) {
    signals.push({
      id: signalId("salary", "mid-year-review"),
      type: "salary_cycle",
      source: "date-rules",
      title: "Mid-year performance bonuses",
      description: "September: Mid-year reviews and bonuses for many corporates. Secondary spending peak.",
      location: "Pan India (corporate cities)",
      severity: "medium",
      triggersWhat: "Professional upgrade, transition to festive season wardrobe",
      targetArchetypes: ["Urban Achiever"],
      suggestedBrands: ["Hugo Boss", "Emporio Armani"],
      suggestedAction: "Light push on professional wear + transition to festive season messaging.",
      confidence: 0.70,
      expiresAt: expiresIn(720),
      data: { month, reason: "mid_year_bonus" },
      detectedAt: today,
    });
  }

  // === TAX REFUND SEASON (July-September) ===
  if (month >= 7 && month <= 9) {
    signals.push({
      id: signalId("salary", "tax-refunds"),
      type: "salary_cycle",
      source: "date-rules",
      title: "Tax refund season (post ITR filing)",
      description: "July-September: Income tax refunds hitting accounts after ITR filing. Unexpected money = impulse luxury.",
      location: "Pan India",
      severity: "low",
      triggersWhat: "Impulse luxury purchases, accessories, 'treat yourself' items",
      targetArchetypes: ["Urban Achiever", "Aspirant"],
      suggestedBrands: ["Coach", "Michael Kors", "Diesel"],
      suggestedAction: "Background signal — add 'unexpected bonus' messaging to retargeting.",
      confidence: 0.60,
      expiresAt: expiresIn(720),
      data: { month, reason: "tax_refunds" },
      detectedAt: today,
    });
  }

  // === FIRST SALARY (July for freshers) ===
  if (month === 7 && day >= 1 && day <= 10) {
    signals.push({
      id: signalId("salary", "first-salary"),
      type: "salary_cycle",
      source: "date-rules",
      title: "First salary month for freshers",
      description: "July: College graduates getting their first paycheck. 'Your first luxury purchase' moment. Entry-level luxury peak.",
      location: "Bangalore, Hyderabad, Pune, Gurgaon, Mumbai, Chennai",
      severity: "high",
      triggersWhat: "Entry luxury: first Hugo Boss polo, first designer sneaker, first branded bag",
      targetArchetypes: ["Aspirant"],
      suggestedBrands: ["Hugo Boss", "Diesel", "All Saints", "Coach"],
      suggestedAction: "Launch 'Your First [Brand]' campaign targeting 22-25 year olds in tech hubs. EMI options front and center.",
      confidence: 0.75,
      expiresAt: expiresIn(240),
      data: { month, reason: "first_salary" },
      detectedAt: today,
    });
  }

  // Removed: Monday FOMO and Weekend Shopping signals — too generic, not actionable for luxury

  return signals;
}
