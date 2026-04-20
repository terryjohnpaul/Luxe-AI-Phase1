/**
 * Salary & Economic Cycle Signals
 * Detects: salary day (25th-1st), quarterly bonuses, appraisal season, tax refunds
 * Source: Date-based rules (no API needed)
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

// === Enhanced Salary Events from 144Cr Ad Spend Analysis ===
const SALARY_EVENTS_ENHANCED = {
  quarterly_bonus: { months: [3, 6, 9, 12], last_5_days: true, spend_uplift: 1.5, categories: ["premium", "watches", "bags"] },
  annual_bonus_fy_end: { months: [3, 4], spend_uplift: 2.5, target_cities: ["Mumbai", "Bangalore", "Gurgaon", "Hyderabad", "Pune"] },
  it_sector_variable: { months: [4, 5, 6], spend_uplift: 2.0, target_cities: ["Bangalore", "Hyderabad", "Pune", "Chennai", "Noida"] },
  tax_refund: { months: [7, 8, 9], spend_uplift: 1.3 },
  campus_hiring_first_salary: { months: [7, 8], target_demo: "21-24", categories: ["entry_luxury", "sneakers", "eyewear"] },
  festival_bonus: { diwali_minus_days: 15, spend_uplift: 1.8 },
};



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


  // === ENHANCED SALARY EVENTS (Data-Validated from 144Cr Analysis) ===

  // Quarterly Bonus Window (last 5 days of quarter-end months)
  if ([3, 6, 9, 12].includes(month) && day >= 26) {
    signals.push({
      id: signalId("salary", "quarterly-bonus-" + month),
      type: "salary_cycle",
      source: "date-rules",
      title: "Quarterly bonus payout window — premium spend uplift 1.5x",
      description: "Quarter-end bonus payouts hitting accounts. Data shows 1.5x spend uplift on premium categories: watches, bags, statement pieces.",
      location: "Pan India",
      severity: "high",
      triggersWhat: "Premium watches, designer bags, statement accessories",
      targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
      suggestedBrands: ["Hugo Boss", "Coach", "Michael Kors", "Emporio Armani"],
      suggestedAction: "Boost premium category bids by 50%. Push watches and bags. 'Reward yourself' messaging.",
      confidence: 0.82,
      expiresAt: expiresIn(168),
      data: { month, reason: "quarterly_bonus", spend_uplift: 1.5, categories: SALARY_EVENTS_ENHANCED.quarterly_bonus.categories },
      detectedAt: today,
    });
  }

  // Annual Bonus FY End (March-April)
  if ((month === 3 || month === 4) && day <= 15) {
    signals.push({
      id: signalId("salary", "annual-bonus-fy-end"),
      type: "salary_cycle",
      source: "date-rules",
      title: "FY-end annual bonus season — 2.5x spend uplift expected",
      description: "Financial year-end bonuses. Data-validated 2.5x spend uplift in target cities. Highest luxury conversion period outside sales.",
      location: SALARY_EVENTS_ENHANCED.annual_bonus_fy_end.target_cities.join(", "),
      severity: "critical",
      triggersWhat: "Premium upgrades, luxury wardrobe overhaul, aspirational purchases",
      targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
      suggestedBrands: ["Hugo Boss", "Emporio Armani", "Coach", "TUMI", "Jimmy Choo"],
      suggestedAction: "Run 'You Earned It' campaign at 2.5x budget. Push premium tier hard.",
      confidence: 0.88,
      expiresAt: new Date(today.getFullYear(), 3, 30),
      data: { month, reason: "annual_bonus_fy_end", spend_uplift: 2.5, target_cities: SALARY_EVENTS_ENHANCED.annual_bonus_fy_end.target_cities },
      detectedAt: today,
    });
  }

  // IT Sector Variable Pay (April-June)
  if (month >= 4 && month <= 6) {
    signals.push({
      id: signalId("salary", "it-variable-pay"),
      type: "salary_cycle",
      source: "date-rules",
      title: "IT sector variable pay season — 2.0x uplift in tech hubs",
      description: "IT sector variable pay and stock vesting. 2.0x spend uplift in tech hub cities. Target tech professionals with premium casual and accessories.",
      location: SALARY_EVENTS_ENHANCED.it_sector_variable.target_cities.join(", "),
      severity: "high",
      triggersWhat: "Premium casual, smart-casual upgrades, tech professional wardrobe",
      targetArchetypes: ["Urban Achiever", "Aspirant"],
      suggestedBrands: ["Hugo Boss", "All Saints", "Diesel", "Acne Studios"],
      suggestedAction: "Geo-target tech hub cities with 'Level up your look' messaging. 2x bid adjustment.",
      confidence: 0.80,
      expiresAt: new Date(today.getFullYear(), 5, 30),
      data: { month, reason: "it_sector_variable", spend_uplift: 2.0, target_cities: SALARY_EVENTS_ENHANCED.it_sector_variable.target_cities },
      detectedAt: today,
    });
  }

  // Campus Hiring First Salary (July-August)
  if (month === 7 || month === 8) {
    signals.push({
      id: signalId("salary", "campus-first-salary"),
      type: "salary_cycle",
      source: "date-rules",
      title: "Campus freshers first/second salary — entry luxury window",
      description: "New graduates from campus hiring receiving first paychecks. Prime window for entry-level luxury: sneakers, eyewear, first designer piece.",
      location: "Bangalore, Hyderabad, Pune, Gurgaon, Mumbai, Chennai",
      severity: "high",
      triggersWhat: "Entry luxury: designer sneakers, branded eyewear, first luxury accessory",
      targetArchetypes: ["Aspirant"],
      suggestedBrands: ["Diesel", "Hugo Boss", "All Saints", "Coach"],
      suggestedAction: "Target 21-24 age group in tech hubs. EMI-forward messaging. Push entry_luxury, sneakers, eyewear.",
      confidence: 0.78,
      expiresAt: new Date(today.getFullYear(), 7, 31),
      data: { month, reason: "campus_first_salary", target_demo: "21-24", categories: SALARY_EVENTS_ENHANCED.campus_hiring_first_salary.categories },
      detectedAt: today,
    });
  }

  // Festival Bonus (15 days before Diwali)
  if (month === 10 && day >= 1 && day <= 25) {
    signals.push({
      id: signalId("salary", "festival-bonus"),
      type: "salary_cycle",
      source: "date-rules",
      title: "Festival bonus payouts — 1.8x spend uplift pre-Diwali",
      description: "Companies disbursing festival bonuses 15 days before Diwali. Data-validated 1.8x spend uplift. Combined with festival intent = highest conversion period.",
      location: "Pan India",
      severity: "critical",
      triggersWhat: "All luxury categories — gifting + self-purchase combined peak",
      targetArchetypes: ["All"],
      suggestedBrands: ["All brands — maximum budget allocation"],
      suggestedAction: "Max out budgets at 1.8x. Festival bonus + Diwali intent = highest ROAS period.",
      confidence: 0.85,
      expiresAt: new Date(today.getFullYear(), 9, 31),
      data: { month, reason: "festival_bonus", spend_uplift: 1.8 },
      detectedAt: today,
    });
  }

  return signals;
}
