import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "30d";
  const brand = searchParams.get("brand");

  const _ = { period, brand }; // acknowledge params for future use
  void _;

  const performanceData = {
    period,
    currency: "INR",

    // Net ROAS — the key differentiator (accounts for returns)
    netRoas: {
      current: 5.82,
      previous: 5.14,
      change: 13.2,
      trend: "IMPROVING",
      grossRoas: 7.1,
      returnRate: 18.2,
      returnCost: 142000, // INR lost to returns this period
      byBrand: [
        { brand: "Hugo Boss", grossRoas: 7.75, netRoas: 6.82, returnRate: 12.0 },
        { brand: "Diesel", grossRoas: 13.6, netRoas: 10.88, returnRate: 20.0 },
        { brand: "Kenzo", grossRoas: 5.24, netRoas: 3.93, returnRate: 25.0 },
        { brand: "Ami Paris", grossRoas: 13.94, netRoas: 12.55, returnRate: 10.0 },
        { brand: "Armani Exchange", grossRoas: 3.9, netRoas: 2.73, returnRate: 30.0 },
      ],
    },

    // Halo Analysis — measuring cross-brand and cross-channel impact
    haloAnalysis: {
      summary: "Meta awareness campaigns driving 23% of Google branded search conversions. Hugo Boss awareness spend generating halo lift for Diesel and Kenzo.",
      crossChannelHalo: [
        {
          source: "Meta Awareness — Hugo Boss",
          destination: "Google Brand Search — Hugo Boss",
          attributedConversions: 14,
          attributedRevenue: 58800,
          haloLift: 23,
        },
        {
          source: "Meta Awareness — Hugo Boss",
          destination: "Direct / Organic — Diesel",
          attributedConversions: 6,
          attributedRevenue: 36000,
          haloLift: 8,
        },
        {
          source: "Google PMAX — Kenzo",
          destination: "Meta Retarget — Kenzo",
          attributedConversions: 4,
          attributedRevenue: 16000,
          haloLift: 12,
        },
      ],
      brandHalo: [
        {
          primaryBrand: "Hugo Boss",
          haloBrands: ["Diesel", "Ami Paris"],
          crossSellRate: 18.5,
          avgCrossSellValue: 8200,
        },
        {
          primaryBrand: "Diesel",
          haloBrands: ["Hugo Boss", "Kenzo"],
          crossSellRate: 12.3,
          avgCrossSellValue: 6400,
        },
      ],
    },

    // Archetype Performance — how each customer segment performs
    archetypePerformance: [
      {
        archetype: "FASHION_LOYALIST",
        totalSpend: 186000,
        totalRevenue: 1488000,
        roas: 8.0,
        netRoas: 7.12,
        conversions: 248,
        avgOrderValue: 6000,
        returnRate: 11.0,
        clvTrend: "GROWING",
        topCampaigns: ["Diesel Fashion Loyalists Retarget", "Ami Paris Brand Search"],
        insight: "Highest value segment. Respond best to editorial content and new arrivals. Minimal discount dependency — avoid promotional messaging.",
      },
      {
        archetype: "URBAN_ACHIEVER",
        totalSpend: 284000,
        totalRevenue: 1562000,
        roas: 5.5,
        netRoas: 4.62,
        conversions: 347,
        avgOrderValue: 4500,
        returnRate: 16.0,
        clvTrend: "GROWING",
        topCampaigns: ["Hugo Boss Urban Achievers ASC", "Diesel Demand Gen Video"],
        insight: "Largest converting segment. Social proof and aspirational lifestyle content drives engagement. Tier 1B city expansion shows promise.",
      },
      {
        archetype: "OCCASIONAL_SPLURGER",
        totalSpend: 156000,
        totalRevenue: 624000,
        roas: 4.0,
        netRoas: 3.0,
        conversions: 120,
        avgOrderValue: 5200,
        returnRate: 25.0,
        clvTrend: "STABLE",
        topCampaigns: ["Hugo Boss Occasional Splurgers Awareness"],
        insight: "High return rate inflating gross ROAS. Festive triggers (Holi, Diwali) spike conversions. Gift-wrapping messaging improves net value.",
      },
      {
        archetype: "ASPIRANT",
        totalSpend: 98000,
        totalRevenue: 205800,
        roas: 2.1,
        netRoas: 1.47,
        conversions: 49,
        avgOrderValue: 4200,
        returnRate: 30.0,
        clvTrend: "EMERGING",
        topCampaigns: ["Kenzo PMAX Tier 1 Cities"],
        insight: "Highest return rate — sizing and expectation mismatch. Entry-level brands (Armani Exchange) work better as gateway. Size guide and video try-on reduce returns.",
      },
    ],

    // Funnel Performance
    funnelPerformance: [
      {
        stage: "AWARENESS",
        spend: 108000,
        impressions: 2100000,
        reach: 840000,
        frequency: 2.5,
        videoViews: 420000,
        brandLift: 12.5,
      },
      {
        stage: "CONSIDERATION",
        spend: 84000,
        impressions: 950000,
        clicks: 28500,
        ctr: 3.0,
        addToCart: 4200,
        addToCartRate: 14.7,
      },
      {
        stage: "CONVERSION",
        spend: 468000,
        impressions: 324000,
        clicks: 12400,
        conversions: 648,
        conversionRate: 5.2,
        revenue: 3024000,
        roas: 6.46,
      },
      {
        stage: "RETENTION",
        spend: 64000,
        impressions: 86000,
        clicks: 4800,
        conversions: 116,
        repeatPurchaseRate: 28.4,
        revenue: 856000,
        roas: 13.38,
      },
    ],

    // Top performing products
    topProducts: [
      { name: "Hugo Boss Classic Polo - Black", sku: "HB-POLO-BLK-2026", revenue: 168000, units: 40, roas: 9.2 },
      { name: "Diesel 1DR Shoulder Bag", sku: "DSL-1DR-BLK-2026", revenue: 245000, units: 35, roas: 14.0 },
      { name: "Kenzo Tiger Sweater", sku: "KNZ-TIGER-SW-2026", revenue: 112000, units: 20, roas: 6.8 },
      { name: "Ami Paris Heart Logo Tee", sku: "AMI-HEART-WHT-2026", revenue: 96000, units: 32, roas: 11.4 },
      { name: "Hugo Boss Slim Fit Suit", sku: "HB-SUIT-NVY-2026", revenue: 340000, units: 17, roas: 8.6 },
    ],
  };

  return NextResponse.json(performanceData);
}
