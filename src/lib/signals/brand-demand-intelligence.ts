/**
 * Brand Demand Intelligence Signals
 * Brand ROAS tiers, category seasonality, and price band optimization.
 * Source: Historical ROAS + conversion data analysis
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

interface BrandTierEntry {
  name: string;
  roas: number;
  conv_value?: number;       // total conversion value in Lakhs
  cpc?: number;              // cost per click in Rs
  note: string;
}

interface BrandTier {
  tier: string;
  label: string;
  strategy: string;
  brands: BrandTierEntry[];
}

interface CategorySeason {
  category: string;
  seasonality: "year_round" | "seasonal";
  peak_months: number[];
  roas: number;
  conv_value_lakhs: number;
  trigger: string;
  note: string;
}

interface PriceBand {
  band: string;
  range: string;
  competition: string;
  strategy: string;
}

const BRAND_TIERS: BrandTier[] = [
  {
    tier: "volume_drivers",
    label: "Volume Drivers",
    strategy: "High volume, reliable ROAS. Always-on campaigns. Bread and butter.",
    brands: [
      { name: "Coach", roas: 12.7, conv_value: 12700, note: "Highest volume brand. Bags dominate. 12.7x ROAS." },
      { name: "Michael Kors", roas: 8.5, conv_value: 8500, note: "Second volume driver. Strong in bags + watches." },
      { name: "Hugo Boss", roas: 10.2, note: "Men's anchor brand. Formal + smart casual." },
      { name: "Kate Spade", roas: 15.9, note: "Strong gifting brand. High ROAS for its volume." },
    ],
  },
  {
    tier: "hidden_gems",
    label: "Hidden Gems",
    strategy: "Exceptional ROAS but lower volume. Scale these up — they're underinvested.",
    brands: [
      { name: "Marc Jacobs", roas: 28.0, note: "28x ROAS — massively underinvested. Scale 3x." },
      { name: "Tod's", roas: 21.6, note: "21.6x ROAS. Italian leather luxury. Niche but profitable." },
      { name: "Tory Burch", roas: 16.7, note: "16.7x ROAS. Women's accessories goldmine." },
      { name: "Kate Spade", roas: 15.9, note: "15.9x ROAS. Strong gifting + entry luxury." },
    ],
  },
  {
    tier: "category_kings",
    label: "Category Kings",
    strategy: "Dominate their specific category. Unbeatable in their niche.",
    brands: [
      { name: "Onitsuka Tiger", roas: 41.88, note: "41.88x ROAS — highest of ANY brand. Sneakers category king." },
      { name: "Villeroy & Boch", roas: 35.92, note: "Home/dining category king. 35.92x ROAS." },
    ],
  },
  {
    tier: "zero_competition",
    label: "Zero Competition",
    strategy: "Indian designers with Rs 1.44-2.27 CPC. Zero competition on Google. Pure gold.",
    brands: [
      { name: "Indian Designers (aggregate)", roas: 38.43, cpc: 1.44, note: "Rs 1.44 CPC. 38.43x ROAS. Zero competition. Indian wear category." },
      { name: "Niche Indian Labels", roas: 25.0, cpc: 2.27, note: "Rs 2.27 CPC. Bridal + festive wear. Untapped." },
    ],
  },
];

const CATEGORY_SEASONALITY: CategorySeason[] = [
  {
    category: "bags",
    seasonality: "year_round",
    peak_months: [],
    roas: 12.7,
    conv_value_lakhs: 12700,
    trigger: "always",
    note: "Year-round demand. #1 category by volume and value. Coach, MK, Kate Spade lead. Always-on required.",
  },
  {
    category: "indian_wear",
    seasonality: "seasonal",
    peak_months: [9, 10, 11, 1, 2],
    roas: 38.43,
    conv_value_lakhs: 3800,
    trigger: "festivals",
    note: "Highest ROAS category at 38.43x. Peak during Navratri-Diwali (Sep-Nov) and wedding season (Jan-Feb). Rs 1.44 CPC.",
  },
  {
    category: "watches",
    seasonality: "seasonal",
    peak_months: [6, 8, 10, 11],
    roas: 22.91,
    conv_value_lakhs: 2200,
    trigger: "gifting",
    note: "Gift-driven category. Father's Day (Jun), Rakhi (Aug), Diwali (Oct), Christmas (Nov-Dec). 22.91x ROAS.",
  },
  {
    category: "eyewear",
    seasonality: "year_round",
    peak_months: [],
    roas: 27.95,
    conv_value_lakhs: 1800,
    trigger: "always",
    note: "Year-round with summer slight uptick. 27.95x ROAS. Surprisingly profitable category.",
  },
  {
    category: "home",
    seasonality: "seasonal",
    peak_months: [10, 11, 12],
    roas: 35.92,
    conv_value_lakhs: 1500,
    trigger: "festive_gifting",
    note: "Diwali home refresh + Christmas gifting. Villeroy & Boch dominates. 35.92x ROAS in peak months.",
  },
  {
    category: "perfume",
    seasonality: "seasonal",
    peak_months: [2, 10, 12],
    roas: 9.77,
    conv_value_lakhs: 800,
    trigger: "gifting",
    note: "UNTAPPED category. 9.77x ROAS but massively underinvested. Valentine's (Feb), Diwali (Oct), Christmas (Dec) peaks. Gift-first positioning.",
  },
  {
    category: "sneakers",
    seasonality: "seasonal",
    peak_months: [3, 4, 9, 10],
    roas: 41.88,
    conv_value_lakhs: 2500,
    trigger: "season_change",
    note: "Highest ROAS brand (Onitsuka Tiger) lives here. 41.88x. Peak in spring (Mar-Apr) and pre-festive (Sep-Oct). M18-24 primary buyer.",
  },
];

const PRICE_BANDS: PriceBand[] = [
  {
    band: "entry",
    range: "18-25K",
    competition: "high",
    strategy: "High competition but high volume. Aspirant buyer entry point. EMI messaging works. Coach, MK, Kate Spade.",
  },
  {
    band: "sweet_spot",
    range: "20-50K",
    competition: "medium",
    strategy: "Optimal ROAS zone. Best balance of margin and volume. Tory Burch, Marc Jacobs, Hugo Boss. Push here.",
  },
  {
    band: "ultra",
    range: "1L+",
    competition: "zero",
    strategy: "Zero online competition. Physical stores don't advertise digitally. Max Mara, Zimmermann, Stella McCartney. Pure profit.",
  },
];

export async function getBrandDemandIntelligenceSignals(): Promise<Signal[]> {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const signals: Signal[] = [];

    // === SIGNAL 1: Hidden Gems — Scale Up ===
    signals.push({
      id: signalId("brand-demand", "hidden-gems-scale"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: "Hidden Gem Brands: Marc Jacobs 28x, Tod's 21.6x, Tory Burch 16.7x",
      description: "These brands have exceptional ROAS but are massively underinvested. Marc Jacobs: 28x ROAS (vs Coach 12.7x). Tod's: 21.6x. Tory Burch: 16.7x. Kate Spade: 15.9x. Scale budgets 2-3x for these brands.",
      location: "Pan India",
      severity: "critical",
      triggersWhat: "Increase budget allocation for hidden gem brands",
      targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
      suggestedBrands: ["Marc Jacobs", "Tod's", "Tory Burch", "Kate Spade"],
      suggestedAction: "SCALE hidden gem brands 2-3x. Marc Jacobs at 28x ROAS is the biggest missed opportunity. Create dedicated campaigns for each.",
      confidence: 0.95,
      expiresAt: expiresIn(336),
      data: { tier: "hidden_gems", brands: BRAND_TIERS[1].brands },
      detectedAt: now,
    });

    // === SIGNAL 2: Onitsuka Tiger — Category King ===
    signals.push({
      id: signalId("brand-demand", "onitsuka-tiger-king"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: "Onitsuka Tiger: 41.88x ROAS — Highest Brand",
      description: "Onitsuka Tiger has the highest ROAS of ANY brand on the platform at 41.88x. Sneaker category king. Primary buyer: Male 18-24. This brand alone justifies a dedicated always-on campaign.",
      location: "Pan India",
      severity: "critical",
      triggersWhat: "Dedicated Onitsuka Tiger always-on campaign",
      targetArchetypes: ["Aspirant", "Meta Impulse Buyer"],
      suggestedBrands: ["Onitsuka Tiger"],
      suggestedAction: "Create dedicated Onitsuka Tiger campaign on Meta + Google. 41.88x ROAS. Target M18-24. Always-on, never pause this.",
      confidence: 0.96,
      expiresAt: expiresIn(336),
      data: { brand: "Onitsuka Tiger", roas: 41.88, category: "sneakers" },
      detectedAt: now,
    });

    // === SIGNAL 3: Zero Competition Indian Designers ===
    signals.push({
      id: signalId("brand-demand", "zero-competition-indian"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: "Zero Competition: Indian Designers CPC Rs 1.44-2.27",
      description: "Indian designer brands have Rs 1.44-2.27 CPC on Google with ZERO competition. 38.43x ROAS. No other luxury advertiser bids on these terms. Pure gold during festival + wedding season.",
      location: "Pan India",
      severity: "critical",
      triggersWhat: "Google Search campaigns for Indian designer brand terms",
      targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
      suggestedBrands: ["Indian Designers"],
      suggestedAction: "Launch Google Search campaigns for Indian designer keywords. CPC Rs 1.44. ZERO competition. 38.43x ROAS. Festival + wedding season amplifies.",
      confidence: 0.94,
      expiresAt: expiresIn(336),
      data: { tier: "zero_competition", cpc: 1.44, roas: 38.43 },
      detectedAt: now,
    });

    // === SIGNAL 4: Volume Drivers Baseline ===
    signals.push({
      id: signalId("brand-demand", "volume-drivers-baseline"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: "Volume Drivers: Coach, MK, Hugo Boss, Kate Spade",
      description: "Volume driver brands form the backbone: Coach (12.7x), Hugo Boss (10.2x), Michael Kors (8.5x), Kate Spade (15.9x). These need always-on campaigns at steady budgets. Reliable ROAS.",
      location: "Pan India",
      severity: "high",
      triggersWhat: "Maintain always-on campaigns for volume driver brands",
      targetArchetypes: ["All"],
      suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss", "Kate Spade"],
      suggestedAction: "Verify always-on campaigns are running for all volume drivers. These brands should never be paused. Bread and butter ROAS.",
      confidence: 0.95,
      expiresAt: expiresIn(336),
      data: { tier: "volume_drivers", brands: BRAND_TIERS[0].brands },
      detectedAt: now,
    });

    // === SIGNAL 5: Ultra Price Band Opportunity ===
    signals.push({
      id: signalId("brand-demand", "ultra-price-band"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: "Ultra Luxury 1L+: Zero Online Competition",
      description: "Price band above Rs 1 Lakh has ZERO online advertising competition. Physical luxury stores don't do digital. Max Mara, Zimmermann, Stella McCartney. Any ad spend here captures the entire demand.",
      location: "Pan India",
      severity: "high",
      triggersWhat: "Test campaigns for ultra-luxury brands (1L+ price point)",
      targetArchetypes: ["Fashion Loyalist"],
      suggestedBrands: ["Max Mara", "Zimmermann", "Stella McCartney", "Acne Studios"],
      suggestedAction: "Test ultra-luxury brand campaigns. Zero competition above 1L. Even small budgets capture entire digital demand for these brands.",
      confidence: 0.92,
      expiresAt: expiresIn(336),
      data: { price_band: "ultra", range: "1L+", competition: "zero" },
      detectedAt: now,
    });

    // === SIGNAL 6: Sweet Spot Price Band ===
    signals.push({
      id: signalId("brand-demand", "sweet-spot-price-band"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: "Sweet Spot: 20-50K Price Band — Best ROAS Zone",
      description: "The 20-50K price band delivers the best ROAS. Medium competition, high margins, and high purchase intent. Tory Burch, Marc Jacobs, Hugo Boss live here. Concentrate budget in this range.",
      location: "Pan India",
      severity: "high",
      triggersWhat: "Prioritize 20-50K price band products in ad creatives",
      targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
      suggestedBrands: ["Tory Burch", "Marc Jacobs", "Hugo Boss", "Tod's"],
      suggestedAction: "Feature 20-50K products in ad creatives. Sweet spot for conversion + margin. This price band converts better than entry (18-25K) despite fewer clicks.",
      confidence: 0.93,
      expiresAt: expiresIn(336),
      data: { price_band: "sweet_spot", range: "20-50K", competition: "medium" },
      detectedAt: now,
    });

    // === CATEGORY SEASONALITY SIGNALS (7-13): Based on current month ===

    // SIGNAL 7: Bags — always active
    signals.push({
      id: signalId("brand-demand", "bags-always-on"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: "Bags: #1 Category — Year-Round Always-On",
      description: "Bags are the #1 category by volume and value. 12.7x ROAS, year-round demand. Coach, MK, Kate Spade dominate. This category should NEVER be paused or reduced.",
      location: "Pan India",
      severity: "high",
      triggersWhat: "Ensure bags category campaigns are always running",
      targetArchetypes: ["All"],
      suggestedBrands: ["Coach", "Michael Kors", "Kate Spade", "Tory Burch", "Marc Jacobs"],
      suggestedAction: "Verify bags campaigns are active and funded. Year-round demand. #1 category. Never pause.",
      confidence: 0.96,
      expiresAt: expiresIn(168),
      data: { category: "bags", roas: 12.7, seasonality: "year_round" },
      detectedAt: now,
    });

    // SIGNAL 8: Indian Wear peak check
    if ([9, 10, 11, 1, 2].includes(month)) {
      signals.push({
        id: signalId("brand-demand", "indian-wear-peak"),
        type: "category_demand",
        source: "brand-demand-intelligence",
        title: "Indian Wear: PEAK SEASON NOW — 38.43x ROAS",
        description: `Indian wear is in peak season (current month: ${month}). 38.43x ROAS with Rs 1.44 CPC. Festival + wedding demand at maximum. This is the highest ROAS category during peak months. Scale aggressively.`,
        location: "Pan India",
        severity: "critical",
        triggersWhat: "Scale Indian wear campaigns 3x during peak months",
        targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
        suggestedBrands: ["Indian Designers"],
        suggestedAction: "SCALE Indian wear campaigns 3x NOW. 38.43x ROAS at Rs 1.44 CPC. Festival + wedding season = maximum demand. Zero competition.",
        confidence: 0.95,
        expiresAt: expiresIn(336),
        data: { category: "indian_wear", month, roas: 38.43, cpc: 1.44, peak: true },
        detectedAt: now,
      });
    }

    // SIGNAL 9: Watches peak check
    if ([6, 8, 10, 11].includes(month)) {
      signals.push({
        id: signalId("brand-demand", "watches-gifting-peak"),
        type: "category_demand",
        source: "brand-demand-intelligence",
        title: "Watches: Gifting Season Peak — 22.91x ROAS",
        description: `Watches are in gifting peak season (month: ${month}). Father's Day, Rakhi, Diwali, Christmas drive watch purchases. 22.91x ROAS. Push gifting-first messaging.`,
        location: "Pan India",
        severity: "high",
        triggersWhat: "Boost watch campaigns with gifting messaging",
        targetArchetypes: ["Urban Achiever", "Occasional Splurger"],
        suggestedBrands: ["Hugo Boss", "Emporio Armani", "Coach"],
        suggestedAction: "BOOST watch campaigns. Gifting season peak. Use 'Gift a timepiece' messaging. 22.91x ROAS during gift months.",
        confidence: 0.93,
        expiresAt: expiresIn(336),
        data: { category: "watches", month, roas: 22.91, trigger: "gifting", peak: true },
        detectedAt: now,
      });
    }

    // SIGNAL 10: Home/dining peak
    if ([10, 11, 12].includes(month)) {
      signals.push({
        id: signalId("brand-demand", "home-festive-peak"),
        type: "category_demand",
        source: "brand-demand-intelligence",
        title: "Home & Dining: Festive Peak — 35.92x ROAS",
        description: `Home/dining category in festive peak (month: ${month}). Diwali home refresh + Christmas gifting drives Villeroy & Boch. 35.92x ROAS. F55+ is primary buyer.`,
        location: "Pan India",
        severity: "high",
        triggersWhat: "Scale home/dining campaigns for festive gifting",
        targetArchetypes: ["Google Intent Buyer", "Urban Achiever"],
        suggestedBrands: ["Villeroy & Boch", "Versace Home"],
        suggestedAction: "SCALE home/dining campaigns. 35.92x ROAS in festive months. Target F55+ on Google. Push gift sets and premium dinnerware.",
        confidence: 0.93,
        expiresAt: expiresIn(336),
        data: { category: "home", month, roas: 35.92, trigger: "festive_gifting", peak: true },
        detectedAt: now,
      });
    }

    // SIGNAL 11: Perfume UNTAPPED
    if ([2, 10, 12].includes(month)) {
      signals.push({
        id: signalId("brand-demand", "perfume-untapped-peak"),
        type: "category_demand",
        source: "brand-demand-intelligence",
        title: "Perfume: UNTAPPED Peak Month — 9.77x ROAS",
        description: `Perfume is the most UNTAPPED luxury category. 9.77x ROAS but massively underinvested. Month ${month} is a peak (Valentine's/Diwali/Christmas). Gift-first positioning works. Minimal competition.`,
        location: "Pan India",
        severity: "high",
        triggersWhat: "Launch/boost perfume campaigns — untapped opportunity",
        targetArchetypes: ["Urban Achiever", "Occasional Splurger"],
        suggestedBrands: ["Hugo Boss", "Versace", "Emporio Armani"],
        suggestedAction: "LAUNCH perfume campaigns if not running. 9.77x ROAS, UNTAPPED category. Gift-first messaging. Minimal competition = cheap CPCs.",
        confidence: 0.92,
        expiresAt: expiresIn(336),
        data: { category: "perfume", month, roas: 9.77, status: "UNTAPPED", peak: true },
        detectedAt: now,
      });
    }

    // SIGNAL 12: Sneakers peak
    if ([3, 4, 9, 10].includes(month)) {
      signals.push({
        id: signalId("brand-demand", "sneakers-peak-season"),
        type: "category_demand",
        source: "brand-demand-intelligence",
        title: "Sneakers: Peak Season — 41.88x ROAS (Onitsuka Tiger)",
        description: `Sneaker demand peaks in month ${month}. Onitsuka Tiger dominates at 41.88x ROAS — highest of ANY brand/category. M18-24 is primary buyer. Meta discovery is the channel.`,
        location: "Pan India",
        severity: "critical",
        triggersWhat: "Scale sneaker campaigns, especially Onitsuka Tiger",
        targetArchetypes: ["Meta Impulse Buyer", "Aspirant"],
        suggestedBrands: ["Onitsuka Tiger", "Diesel", "G-Star Raw"],
        suggestedAction: "SCALE sneaker campaigns 2x. Onitsuka Tiger at 41.88x ROAS. Target M18-24 on Meta, 9PM-1AM IST. Peak sneaker season.",
        confidence: 0.95,
        expiresAt: expiresIn(336),
        data: { category: "sneakers", month, roas: 41.88, brand_leader: "Onitsuka Tiger", peak: true },
        detectedAt: now,
      });
    }

    // SIGNAL 13: Eyewear always-on
    signals.push({
      id: signalId("brand-demand", "eyewear-always-on"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: "Eyewear: Year-Round 27.95x ROAS — Underinvested",
      description: "Eyewear delivers 27.95x ROAS year-round. Surprisingly profitable and typically underinvested. Works on both Google (brand searches) and Meta (style discovery).",
      location: "Pan India",
      severity: "medium",
      triggersWhat: "Ensure eyewear campaigns are always active",
      targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
      suggestedBrands: ["Hugo Boss", "Coach", "Emporio Armani"],
      suggestedAction: "Verify eyewear campaigns are running. 27.95x ROAS year-round. Often overlooked in favor of bags/shoes.",
      confidence: 0.93,
      expiresAt: expiresIn(168),
      data: { category: "eyewear", roas: 27.95, seasonality: "year_round" },
      detectedAt: now,
    });

    // === SIGNAL 14: Category portfolio health check ===
    const activeCategories = CATEGORY_SEASONALITY.filter(c =>
      c.seasonality === "year_round" || c.peak_months.includes(month)
    );
    signals.push({
      id: signalId("brand-demand", "category-portfolio-check"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: `Category Portfolio: ${activeCategories.length} Categories in Peak/Active`,
      description: `Current month (${month}): ${activeCategories.map(c => `${c.category} (${c.roas}x)`).join(", ")} are active or in peak. Ensure all have funded campaigns.`,
      location: "Pan India",
      severity: "medium",
      triggersWhat: "Verify all active categories have running campaigns",
      targetArchetypes: ["All"],
      suggestedBrands: [],
      suggestedAction: `Verify campaigns for: ${activeCategories.map(c => c.category).join(", ")}. All are active or peaking this month.`,
      confidence: 0.94,
      expiresAt: expiresIn(168),
      data: { month, active_categories: activeCategories.map(c => ({ category: c.category, roas: c.roas })) },
      detectedAt: now,
    });

    // === SIGNAL 15: ROAS ladder insight ===
    signals.push({
      id: signalId("brand-demand", "roas-ladder"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: "ROAS Ladder: Where to Invest Next Rupee",
      description: "ROAS ladder (highest to lowest): Sneakers 41.88x > Indian Wear 38.43x > Home 35.92x > Eyewear 27.95x > Watches 22.91x > Bags 12.7x > Perfume 9.77x. Next marginal rupee should go to highest available ROAS category.",
      location: "Pan India",
      severity: "medium",
      triggersWhat: "Marginal budget allocation by ROAS ranking",
      targetArchetypes: ["All"],
      suggestedBrands: [],
      suggestedAction: "When deciding where to put the next rupee: Sneakers > Indian Wear > Home > Eyewear > Watches > Bags > Perfume. Scale from top of ladder.",
      confidence: 0.94,
      expiresAt: expiresIn(336),
      data: {
        roas_ladder: [
          { category: "sneakers", roas: 41.88 },
          { category: "indian_wear", roas: 38.43 },
          { category: "home", roas: 35.92 },
          { category: "eyewear", roas: 27.95 },
          { category: "watches", roas: 22.91 },
          { category: "bags", roas: 12.7 },
          { category: "perfume", roas: 9.77 },
        ],
      },
      detectedAt: now,
    });

    // === SIGNAL 16: Brand discovery opportunity ===
    signals.push({
      id: signalId("brand-demand", "brand-discovery-opportunity"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: "Brand ROAS Gap: Top Brands Are Underinvested",
      description: "The gap between volume drivers (8-15x ROAS) and hidden gems (16-28x ROAS) reveals massive underinvestment in top-performing brands. Marc Jacobs at 28x gets less budget than Coach at 12.7x. Fix this allocation.",
      location: "Pan India",
      severity: "high",
      triggersWhat: "Rebalance budget from volume drivers to hidden gems",
      targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
      suggestedBrands: ["Marc Jacobs", "Tod's", "Tory Burch"],
      suggestedAction: "Shift 15-20% of Coach/MK budget to Marc Jacobs, Tod's, Tory Burch. Higher ROAS, lower competition, better margins.",
      confidence: 0.93,
      expiresAt: expiresIn(336),
      data: { gap: "volume_vs_hidden_gems", volume_avg_roas: 11.8, hidden_avg_roas: 20.5 },
      detectedAt: now,
    });

    // === SIGNAL 17: Entry price EMI opportunity ===
    signals.push({
      id: signalId("brand-demand", "entry-price-emi"),
      type: "category_demand",
      source: "brand-demand-intelligence",
      title: "Entry Luxury (18-25K): EMI Messaging Multiplier",
      description: "Entry price band (18-25K) has highest volume but also highest competition. EMI messaging ('from Rs 1,500/month') increases conversion rate 40% for Aspirant buyers. Always show EMI option for this band.",
      location: "Pan India",
      severity: "medium",
      triggersWhat: "Add EMI messaging to all entry-luxury product ads",
      targetArchetypes: ["Aspirant", "Occasional Splurger"],
      suggestedBrands: ["Coach", "Michael Kors", "Hugo Boss", "Kate Spade"],
      suggestedAction: "Add EMI callout to all 18-25K product ads. 'From Rs X/month' increases conversion 40% for entry luxury buyers.",
      confidence: 0.92,
      expiresAt: expiresIn(336),
      data: { price_band: "entry", range: "18-25K", emi_uplift: "40%", target: "Aspirant" },
      detectedAt: now,
    });

    return signals;
  } catch (error) {
    console.error("[brand-demand] Error generating signals:", error);
    return [];
  }
}
