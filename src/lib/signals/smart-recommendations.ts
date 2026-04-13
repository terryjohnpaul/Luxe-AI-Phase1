/**
 * Smart Recommendation Engine
 *
 * Combines multiple signals to generate higher-level ad intelligence:
 * 1. Hyper-local city targeting — different ads per city based on conditions
 * 2. Budget timing optimizer — when to spend more/less
 * 3. Creative fatigue detection — when to rotate creatives
 * 4. Event stacking — amplify when multiple signals align
 */

import { Signal } from "./types";

// ============================================================
// 1. HYPER-LOCAL CITY TARGETING
// ============================================================

export interface CityRecommendation {
  city: string;
  population: string;
  luxuryIndex: number; // 1-10 how luxury-friendly the city is
  currentConditions: string[];
  recommendedAds: {
    brand: string;
    product: string;
    angle: string;
    reason: string;
  }[];
  budgetMultiplier: number; // 1.0 = normal, 2.0 = double
  platforms: string[];
}

export function getCityRecommendations(): CityRecommendation[] {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDay(); // 0=Sun
  const date = now.getDate();
  const isSalaryWeek = date >= 25 || date <= 3;
  const isWeekend = day === 0 || day === 6;

  return [
    {
      city: "Mumbai",
      population: "2.1Cr",
      luxuryIndex: 10,
      currentConditions: [
        month >= 2 && month <= 5 ? "Hot & humid (30-38°C)" : month >= 5 && month <= 8 ? "Monsoon season" : "Pleasant weather",
        isSalaryWeek ? "Salary week — spending peaks" : "Mid-month",
        isWeekend ? "Weekend — leisure browsing" : "Weekday",
        "India's luxury capital — highest AOV",
      ],
      recommendedAds: [
        { brand: "Hugo Boss", product: "Linen Collection", angle: "Summer power dressing for Mumbai professionals", reason: "Hot weather + high professional population" },
        { brand: "Versace", product: "Sunglasses", angle: "Mumbai sun protection with Italian style", reason: "Strong sunlight + fashion-conscious city" },
        { brand: "Coach", product: "Tabby Bag", angle: "The bag for Mumbai's power women", reason: "Highest female luxury buyer concentration" },
      ],
      budgetMultiplier: isSalaryWeek ? 2.0 : isWeekend ? 1.5 : 1.0,
      platforms: ["Instagram Feed", "Instagram Stories", "Google Shopping"],
    },
    {
      city: "Delhi NCR",
      population: "3.2Cr",
      luxuryIndex: 9,
      currentConditions: [
        month >= 3 && month <= 5 ? "Extreme heat (40-47°C)" : month >= 10 && month <= 1 ? "Cold & polluted (AQI 300+)" : "Pleasant weather",
        isSalaryWeek ? "Salary week — spending peaks" : "Mid-month",
        isWeekend ? "Weekend — mall traffic high" : "Weekday",
        "Wedding capital of India",
      ],
      recommendedAds: [
        { brand: "Hugo Boss", product: "Blazers & Suits", angle: "Delhi wedding season — dress to impress", reason: "Wedding capital + formal fashion culture" },
        { brand: "Max Mara", product: "Coats", angle: month >= 10 || month <= 1 ? "Stay warm, stay elegant — Max Mara for Delhi winter" : "Timeless Italian tailoring", reason: "Cold winters drive outerwear demand" },
        { brand: "Jimmy Choo", product: "Heels", angle: "Delhi party circuit demands Jimmy Choo", reason: "Active social scene + event culture" },
      ],
      budgetMultiplier: isSalaryWeek ? 1.8 : isWeekend ? 1.4 : 1.0,
      platforms: ["Instagram Feed", "Google Shopping", "Facebook Feed"],
    },
    {
      city: "Bangalore",
      population: "1.4Cr",
      luxuryIndex: 8,
      currentConditions: [
        "Pleasant weather year-round (22-34°C)",
        isSalaryWeek ? "Tech salary week — highest disposable income" : "Mid-month",
        isWeekend ? "Weekend" : "Weekday",
        "Tech hub — youngest luxury buyers, highest digital adoption",
      ],
      recommendedAds: [
        { brand: "Diesel", product: "1DR Bag + Denim", angle: "Tech meets street — Diesel for Bangalore's tech elite", reason: "Young tech professionals love streetwear luxury" },
        { brand: "Hugo Boss", product: "Smart Casual", angle: "Boardroom to brewery — BOSS for Bangalore", reason: "Smart casual culture dominates tech" },
        { brand: "Armani Exchange", product: "Weekend Collection", angle: "Weekend vibes, premium style", reason: "Youngest luxury market — accessible luxury entry point" },
      ],
      budgetMultiplier: isSalaryWeek ? 2.5 : isWeekend ? 1.3 : 1.0, // Tech salaries are highest
      platforms: ["Instagram Reels", "YouTube Shorts", "Instagram Stories"],
    },
    {
      city: "Hyderabad",
      population: "1.1Cr",
      luxuryIndex: 7,
      currentConditions: [
        month >= 3 && month <= 5 ? "Hot (35-42°C)" : "Moderate weather",
        isSalaryWeek ? "Salary week" : "Mid-month",
        "Growing luxury market — tech + old money",
        "Strong wedding culture",
      ],
      recommendedAds: [
        { brand: "Versace", product: "Shirts & Accessories", angle: "Hyderabadi glamour meets Versace boldness", reason: "Bold fashion culture + celebration-oriented" },
        { brand: "Hugo Boss", product: "Formal Collection", angle: "BOSS for Hyderabad's rising professionals", reason: "Growing corporate sector" },
      ],
      budgetMultiplier: isSalaryWeek ? 1.5 : 1.0,
      platforms: ["Instagram Feed", "Facebook Feed", "Google Shopping"],
    },
    {
      city: "Pune",
      population: "75L",
      luxuryIndex: 7,
      currentConditions: [
        "Pleasant climate most of the year",
        isSalaryWeek ? "IT salary week" : "Mid-month",
        "Fast-growing luxury market — IT + auto industry wealth",
      ],
      recommendedAds: [
        { brand: "Hugo Boss", product: "Polo & Casual", angle: "Pune's understated luxury — BOSS smart casual", reason: "Conservative but aspirational market" },
        { brand: "Coach", product: "Wallets & Small Leather", angle: "First luxury piece — Coach for Pune professionals", reason: "Entry-level luxury market growing fast" },
      ],
      budgetMultiplier: isSalaryWeek ? 1.5 : 1.0,
      platforms: ["Instagram Feed", "Google Shopping"],
    },
    {
      city: "Chennai",
      population: "1.1Cr",
      luxuryIndex: 6,
      currentConditions: [
        month >= 3 && month <= 5 ? "Very hot & humid (38-44°C)" : "Warm",
        isSalaryWeek ? "Salary week" : "Mid-month",
        "Conservative luxury market — quality over flash",
      ],
      recommendedAds: [
        { brand: "Hugo Boss", product: "Cotton Shirts", angle: "Breathable luxury for Chennai heat — BOSS cotton collection", reason: "Heat demands breathable fabrics" },
        { brand: "Lacoste", product: "Polo Shirts", angle: "Classic French elegance for Chennai gentlemen", reason: "Conservative market prefers understated brands" },
      ],
      budgetMultiplier: isSalaryWeek ? 1.3 : 1.0,
      platforms: ["Google Shopping", "Facebook Feed"],
    },
    {
      city: "Kolkata",
      population: "1.5Cr",
      luxuryIndex: 6,
      currentConditions: [
        month >= 3 && month <= 5 ? "Hot & humid" : month >= 10 && month <= 1 ? "Pleasant winter" : "Moderate",
        "Cultural capital — art and fashion conscious",
        "Durga Puja is bigger than Diwali here",
      ],
      recommendedAds: [
        { brand: "Sandro", product: "Contemporary Collection", angle: "French artistry for Kolkata's cultural elite", reason: "Art-conscious city appreciates design-driven brands" },
        { brand: "Hugo Boss", product: "Formal", angle: "The Bengali gentleman's choice — Hugo Boss", reason: "Strong formal dressing culture" },
      ],
      budgetMultiplier: month === 9 ? 2.0 : 1.0, // Durga Puja month
      platforms: ["Instagram Feed", "Facebook Feed"],
    },
    {
      city: "Ahmedabad",
      population: "85L",
      luxuryIndex: 7,
      currentConditions: [
        month >= 3 && month <= 5 ? "Extreme heat (42-48°C)" : "Moderate",
        "Gujarat — diamond & textile industry wealth",
        "Navratri is the biggest event (October)",
      ],
      recommendedAds: [
        { brand: "Versace", product: "Bold Collection", angle: "Gujarati celebrations deserve Versace boldness", reason: "Celebration-oriented culture loves bold fashion" },
        { brand: "Jimmy Choo", product: "Festive Heels", angle: "Navratri nights demand Jimmy Choo", reason: "9 nights of dandiya = 9 outfit changes" },
      ],
      budgetMultiplier: month === 9 ? 3.0 : isSalaryWeek ? 1.5 : 1.0, // Navratri
      platforms: ["Instagram Stories", "Instagram Feed"],
    },
  ];
}

// ============================================================
// 2. BUDGET TIMING OPTIMIZER
// ============================================================

export interface BudgetWindow {
  id: string;
  window: string;
  dateRange: string;
  multiplier: number;
  reason: string;
  recommendation: string;
  confidence: number;
}

export function getBudgetWindows(): BudgetWindow[] {
  const windows: BudgetWindow[] = [
    {
      id: "salary-week",
      window: "Salary Week (25th-3rd)",
      dateRange: "Every month, 25th to 3rd",
      multiplier: 2.0,
      reason: "Indian salary credits peak 25th-1st. Luxury purchases spike 40-60% during salary week. People feel rich and ready to splurge.",
      recommendation: "Shift 40% of monthly ad budget to this 8-day window. Run full-price product ads. Avoid discounting — people don't need discounts when they just got paid.",
      confidence: 0.95,
    },
    {
      id: "weekend-surge",
      window: "Weekend (Sat-Sun)",
      dateRange: "Every weekend",
      multiplier: 1.5,
      reason: "Weekend browsing increases 30%. Leisure time = luxury shopping time. Higher add-to-cart rates.",
      recommendation: "Increase weekend spend 50%. Run lifestyle/aspirational content on Saturday. Product-focused conversion ads on Sunday evening.",
      confidence: 0.9,
    },
    {
      id: "monday-fomo",
      window: "Monday Morning FOMO",
      dateRange: "Every Monday 8am-12pm",
      multiplier: 1.3,
      reason: "Monday morning Instagram scrolling creates FOMO from weekend posts. People see friends' luxury purchases and want to keep up.",
      recommendation: "Run 'Start your week right' campaigns on Monday morning. Social proof ads — 'Trending this weekend on luxury fashion' messaging.",
      confidence: 0.75,
    },
    {
      id: "payday-bonus",
      window: "March Bonus Season",
      dateRange: "March 15 - April 15",
      multiplier: 2.5,
      reason: "Indian financial year-end bonuses hit in March-April. IT/banking sector bonuses are 15-40% of annual salary. Biggest luxury purchase window outside festivals.",
      recommendation: "Maximum ad spend window. Run premium product campaigns. 'Reward yourself' messaging. Push high-AOV items — watches, bags, suits.",
      confidence: 0.9,
    },
    {
      id: "first-salary",
      window: "July First Salary",
      dateRange: "July 1 - July 10",
      multiplier: 1.8,
      reason: "College freshers get their first salary in July. Emotional purchase moment — 'my first luxury piece'. Entry-level luxury spike.",
      recommendation: "Run 'Your first luxury' campaigns targeting 22-25 age group. Push accessible luxury under INR 10,000. Coach wallets, AX tees, Marc Jacobs accessories.",
      confidence: 0.85,
    },
    {
      id: "tax-refund",
      window: "Tax Refund Season",
      dateRange: "September - October",
      multiplier: 1.4,
      reason: "IT refunds hit bank accounts Sept-Oct. Unexpected money = guilt-free splurge. Coincides with pre-festival shopping.",
      recommendation: "Run 'Treat yourself' campaigns. Tax refund + upcoming Diwali = double motivation for luxury purchases.",
      confidence: 0.8,
    },
    {
      id: "mid-month-lull",
      window: "Mid-Month (10th-20th)",
      dateRange: "Every month, 10th to 20th",
      multiplier: 0.6,
      reason: "Lowest purchase intent period. Money is spent, next salary is far. Running expensive ads here wastes budget.",
      recommendation: "REDUCE ad spend 40%. Use this window for retargeting only (cheap CPMs). Save budget for salary week.",
      confidence: 0.9,
    },
    {
      id: "late-night",
      window: "Late Night Browsing (10pm-1am)",
      dateRange: "Daily, 10pm-1am IST",
      multiplier: 1.4,
      reason: "Luxury browsing peaks late night. People scroll Instagram in bed, discover products. Higher engagement, lower competition.",
      recommendation: "Run aspirational content ads 10pm-1am. Lower CPMs + higher engagement = great ROI. Lifestyle imagery works best.",
      confidence: 0.8,
    },
  ];

  return windows;
}

// ============================================================
// 3. CREATIVE FATIGUE DETECTION
// ============================================================

export interface CreativeFatigueAlert {
  id: string;
  campaignName: string;
  brand: string;
  creative: string;
  daysRunning: number;
  ctrTrend: string;
  currentCtr: number;
  peakCtr: number;
  fatigueLevel: "healthy" | "warning" | "fatigued" | "dead";
  recommendation: string;
  suggestedSwap: string;
}

export function getCreativeFatigueAlerts(): CreativeFatigueAlert[] {
  return [
    {
      id: "cf-001",
      campaignName: "Hugo Boss Summer Collection",
      brand: "Hugo Boss",
      creative: "Blazer lifestyle shot — man walking in Mumbai",
      daysRunning: 21,
      ctrTrend: "Declining — dropped 45% from peak",
      currentCtr: 0.8,
      peakCtr: 1.45,
      fatigueLevel: "fatigued",
      recommendation: "Creative has run 21 days. CTR dropped 45% from peak. ROTATE NOW — audience has seen this too many times.",
      suggestedSwap: "Switch to: (1) Polo lifestyle shot in different setting, (2) Product-only flat lay, or (3) Reels video showing styling options. Different visual = fresh attention.",
    },
    {
      id: "cf-002",
      campaignName: "Coach Tabby Campaign",
      brand: "Coach",
      creative: "Tabby bag — close-up product shot with gold hardware",
      daysRunning: 14,
      ctrTrend: "Slightly declining — dropped 20% from peak",
      currentCtr: 1.2,
      peakCtr: 1.5,
      fatigueLevel: "warning",
      recommendation: "Creative showing early fatigue signs at 14 days. Prepare a new creative now — you have 3-5 days before it becomes ineffective.",
      suggestedSwap: "Prepare: (1) Styled outfit flat lay with Tabby, (2) 'As seen on [celebrity]' version, or (3) UGC-style content showing real customer with bag.",
    },
    {
      id: "cf-003",
      campaignName: "Diesel 1DR Retargeting",
      brand: "Diesel",
      creative: "1DR bag carousel — 4 colorways",
      daysRunning: 7,
      ctrTrend: "Stable — performing at peak",
      currentCtr: 1.8,
      peakCtr: 1.85,
      fatigueLevel: "healthy",
      recommendation: "Creative is healthy and performing well at 7 days. No rotation needed yet. Check again at day 12.",
      suggestedSwap: "No swap needed. Have next creative ready for day 12-14.",
    },
    {
      id: "cf-004",
      campaignName: "Versace Sunglasses Summer",
      brand: "Versace",
      creative: "Medusa sunglasses — model portrait shot",
      daysRunning: 28,
      ctrTrend: "Crashed — dropped 65% from peak",
      currentCtr: 0.4,
      peakCtr: 1.15,
      fatigueLevel: "dead",
      recommendation: "URGENT: Creative is dead — 28 days running, CTR dropped 65%. Pause immediately and swap. Every impression is wasted money.",
      suggestedSwap: "Replace with: (1) Completely different visual angle — overhead flat lay, (2) Video try-on content, or (3) Celebrity/influencer wearing them. Change is urgent.",
    },
    {
      id: "cf-005",
      campaignName: "Wedding Season Multi-Brand",
      brand: "Multiple",
      creative: "Wedding guest outfit grid — 4 brand suggestions",
      daysRunning: 10,
      ctrTrend: "Strong — slightly above peak",
      currentCtr: 2.1,
      peakCtr: 2.0,
      fatigueLevel: "healthy",
      recommendation: "Performing above peak at day 10. Seasonal relevance keeping it fresh. Keep running through wedding season but prepare rotation for day 18.",
      suggestedSwap: "No swap needed yet. Prepare: phase-specific creative (sangeet version, reception version) for week 3.",
    },
  ];
}

// ============================================================
// 4. EVENT STACKING
// ============================================================

export interface EventStack {
  id: string;
  signals: string[];
  stackScore: number; // 1-10
  city: string;
  recommendation: string;
  budgetAction: string;
  expectedLift: string;
}

export function getEventStacks(): EventStack[] {
  const now = new Date();
  const date = now.getDate();
  const day = now.getDay();
  const month = now.getMonth();
  const isSalaryWeek = date >= 25 || date <= 3;
  const isWeekend = day === 0 || day === 6;

  const stacks: EventStack[] = [];

  // Check for Mumbai stack
  if (isSalaryWeek && isWeekend) {
    stacks.push({
      id: "stack-mumbai-1",
      signals: ["Salary week", "Weekend", "Mumbai — India's luxury capital"],
      stackScore: 8,
      city: "Mumbai",
      recommendation: "TRIPLE STACK in Mumbai: Salary week + Weekend + Luxury capital. This is the highest-conversion window of the month. Run all hero product campaigns at full budget.",
      budgetAction: "3x Mumbai budget for this weekend. Run full-price hero products. No discounts needed.",
      expectedLift: "Expected 3-4x normal conversion rate",
    });
  }

  if (isSalaryWeek) {
    stacks.push({
      id: "stack-salary-national",
      signals: ["Salary week active", "Fresh purchasing power across India"],
      stackScore: 6,
      city: "Pan India",
      recommendation: "SALARY WEEK: Increase national budget. Run full-price campaigns. People just got paid — don't discount.",
      budgetAction: "2x national budget. Focus on hero products and new arrivals.",
      expectedLift: "Expected 1.5-2x normal conversion rate",
    });
  }

  if (month === 2) { // March
    stacks.push({
      id: "stack-march-bonus",
      signals: ["March bonus season", "Financial year-end", isSalaryWeek ? "Salary week overlap" : "Mid-month", "Tax-saving deadline"],
      stackScore: 9,
      city: "Pan India",
      recommendation: "MEGA STACK: March bonuses + year-end mindset + potential salary overlap. IT/banking professionals flush with cash. This is the biggest non-festival spending window.",
      budgetAction: "2.5x budget for March. Push premium products — watches, suits, bags. 'Reward yourself for the year' messaging.",
      expectedLift: "Expected 2.5-3x normal conversion rate. Highest AOV month.",
    });
  }

  if (month >= 9 && month <= 10) { // Oct-Nov
    stacks.push({
      id: "stack-festive-mega",
      signals: ["Navratri/Dussehra", "Pre-Diwali shopping", "Wedding season starting", "Tax refunds hitting accounts", isWeekend ? "Weekend" : "Weekday"],
      stackScore: 10,
      city: "Pan India",
      recommendation: "MAXIMUM STACK: Festival season + wedding season + tax refunds. This is THE moment. Every signal aligns. Run maximum budget across all brands and all cities.",
      budgetAction: "4x normal budget. Every INR spent here returns maximum. Run gift campaigns + wedding campaigns + festive campaigns simultaneously.",
      expectedLift: "Expected 4-5x normal conversion rate. Highest revenue month of the year.",
    });
  }

  // Add IPL stack if March-May
  if (month >= 2 && month <= 4) {
    stacks.push({
      id: "stack-ipl",
      signals: ["IPL season active", "Cricket viewership peak", isWeekend ? "Weekend match" : "Evening match", isSalaryWeek ? "Salary week" : ""],
      stackScore: isSalaryWeek ? 7 : 5,
      city: "Match cities",
      recommendation: `IPL STACK: Cricket matches + ${isSalaryWeek ? "salary week" : "regular week"}. Target match-city audiences with casual luxury ads during and after matches.`,
      budgetAction: `${isSalaryWeek ? "2x" : "1.5x"} budget in IPL match cities. Run sports-casual brand ads — Armani Exchange, Hugo Boss casual, Diesel.`,
      expectedLift: "Expected 1.5-2x engagement on match days",
    });
  }

  // If no significant stacks, add a low-period advisory
  if (stacks.length === 0) {
    stacks.push({
      id: "stack-low",
      signals: ["No major signal stacking detected", "Normal demand period"],
      stackScore: 2,
      city: "Pan India",
      recommendation: "LOW STACK period. No major signals aligning. Use this time for: (1) Retargeting campaigns at lower CPMs, (2) Testing new creatives, (3) Building audiences for next peak.",
      budgetAction: "Reduce to 0.6x normal budget. Focus on retargeting warm audiences only.",
      expectedLift: "Normal or below-normal conversion rates expected",
    });
  }

  return stacks.sort((a, b) => b.stackScore - a.stackScore);
}

// ============================================================
// CONVERT TO SIGNALS for Command Center
// ============================================================

export function getSmartRecommendationSignals(): Signal[] {
  const now = new Date();
  const signals: Signal[] = [];

  // City targeting signals (top 3 cities with highest multiplier)
  const cities = getCityRecommendations().sort((a, b) => b.budgetMultiplier - a.budgetMultiplier).slice(0, 3);
  cities.forEach((city, i) => {
    if (city.budgetMultiplier >= 1.5) {
      signals.push({
        id: `city-${i}`,
        type: "regional" as const,
        title: `${city.city}: ${city.budgetMultiplier}x budget recommended right now`,
        description: `Conditions: ${city.currentConditions.join(" | ")}. Top pick: ${city.recommendedAds[0]?.brand} ${city.recommendedAds[0]?.product} — ${city.recommendedAds[0]?.angle}`,
        location: city.city,
        severity: city.budgetMultiplier >= 2.0 ? "high" as const : "medium" as const,
        triggersWhat: "City-targeted ads",
        targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
        suggestedBrands: city.recommendedAds.map(a => a.brand),
        confidence: 0.85,
        source: "City Intelligence",
        detectedAt: now,
        expiresAt: new Date(now.getTime() + 86400000),
        suggestedAction: `Increase ${city.city} budget to ${city.budgetMultiplier}x. Run: ${city.recommendedAds.map(a => `${a.brand} ${a.product}`).join(", ")}`,
        data: { city: city.city, multiplier: city.budgetMultiplier, luxuryIndex: city.luxuryIndex },
      });
    }
  });

  // NOTE: Budget Optimizer, Creative Fatigue, and Event Stacking signals
  // are disabled until real campaign data is connected via Meta/Google Ads API.
  // They will activate automatically when the flywheel has real campaign data to analyze.

  return signals;
}
