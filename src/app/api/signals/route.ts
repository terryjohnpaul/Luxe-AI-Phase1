import { NextResponse } from "next/server";

const mockSignals = [
  {
    id: "sig_01",
    type: "WEATHER",
    source: "weatherapi",
    severity: "HIGH",
    title: "Cold wave alert — Delhi NCR dropping to 8°C",
    description: "Temperature in Delhi NCR expected to drop below 10°C for the next 5 days. Historical data shows 35% increase in outerwear searches and 28% lift in Hugo Boss jacket conversions during cold snaps.",
    data: {
      city: "Delhi",
      currentTemp: 12,
      forecastLow: 8,
      forecastDays: 5,
      affectedBrands: ["Hugo Boss", "Diesel"],
      affectedCategories: ["Jackets", "Coats", "Knitwear"],
      historicalLift: 0.28,
    },
    city: "Delhi",
    brand: "Hugo Boss",
    isActive: true,
    autoActionTaken: "Budget increased 28% on Hugo Boss outerwear campaigns in Delhi NCR",
    resolvedAt: null,
    organizationId: "org_01",
    createdAt: "2026-03-27T02:00:00.000Z",
  },
  {
    id: "sig_02",
    type: "SEARCH_TREND",
    source: "google_trends",
    severity: "MEDIUM",
    title: "Kenzo Tiger trending — +45% search volume",
    description: "Google Trends detected a 45% surge in 'Kenzo Tiger' and 'Kenzo sweater' searches over the past 48 hours, driven by a Bollywood celebrity spotted wearing Kenzo at Mumbai airport.",
    data: {
      keyword: "Kenzo Tiger",
      volumeChange: 45,
      relatedQueries: ["Kenzo Tiger sweater price India", "Kenzo Ajio", "Kenzo hoodie men"],
      triggerEvent: "Celebrity sighting — Kartik Aaryan at Mumbai airport",
      peakCities: ["Mumbai", "Delhi", "Pune", "Ahmedabad"],
    },
    city: null,
    brand: "Kenzo",
    isActive: true,
    autoActionTaken: null,
    resolvedAt: null,
    organizationId: "org_01",
    createdAt: "2026-03-26T18:30:00.000Z",
  },
  {
    id: "sig_03",
    type: "SOCIAL_BUZZ",
    source: "brandwatch",
    severity: "LOW",
    title: "Diesel positive sentiment spike on Instagram",
    description: "Diesel mentions on Instagram increased 62% in the last 24 hours with 94% positive sentiment. Driven by influencer collaborations featuring the new 1DR bag collection.",
    data: {
      platform: "Instagram",
      mentionCount: 1840,
      sentimentScore: 0.94,
      topPosts: [
        { handle: "@styleinspo_mumbai", likes: 24500, reach: 180000 },
        { handle: "@luxefashion.in", likes: 18200, reach: 142000 },
      ],
      trending_hashtags: ["#DieselIndia", "#1DRBag", "#DieselLove"],
    },
    city: null,
    brand: "Diesel",
    isActive: true,
    autoActionTaken: null,
    resolvedAt: null,
    organizationId: "org_01",
    createdAt: "2026-03-27T00:00:00.000Z",
  },
  {
    id: "sig_04",
    type: "INVENTORY_LOW",
    source: "inventory_feed",
    severity: "CRITICAL",
    title: "Hugo Boss polo shirts — only 12 units left across sizes",
    description: "Hugo Boss Classic Polo (SKU: HB-POLO-BLK-2026) has only 12 units remaining across all sizes. Current sell-through rate suggests stockout within 3 days. This is a top-converting product with INR 4,200 AOV.",
    data: {
      sku: "HB-POLO-BLK-2026",
      productName: "Hugo Boss Classic Polo - Black",
      currentStock: 12,
      dailySellRate: 4.2,
      daysToStockout: 2.9,
      price: 4200,
      sizeBreakdown: { S: 1, M: 3, L: 5, XL: 2, XXL: 1 },
    },
    city: null,
    brand: "Hugo Boss",
    isActive: true,
    autoActionTaken: "Reduced ad spend on this SKU by 60% to preserve stock for organic orders",
    resolvedAt: null,
    organizationId: "org_01",
    createdAt: "2026-03-27T04:00:00.000Z",
  },
  {
    id: "sig_05",
    type: "CREATIVE_FATIGUE",
    source: "meta_insights",
    severity: "HIGH",
    title: "Diesel Demand Gen video creative fatiguing — CTR dropped 34%",
    description: "Primary video creative in Diesel Demand Gen campaign has shown consistent CTR decline over 14 days (3.0% → 1.95%). Frequency at 4.8 for the core audience. Recommend creative refresh.",
    data: {
      campaignId: "camp_06",
      creativeId: "cv_diesel_demand_v2",
      ctrTrend: [3.0, 2.85, 2.7, 2.6, 2.48, 2.35, 2.2, 2.15, 2.1, 2.05, 2.02, 1.98, 1.96, 1.95],
      frequency: 4.8,
      fatigueScore: 0.85,
      daysLive: 21,
    },
    city: null,
    brand: "Diesel",
    isActive: true,
    autoActionTaken: "Budget reduced pending creative refresh",
    resolvedAt: null,
    organizationId: "org_01",
    createdAt: "2026-03-26T06:00:00.000Z",
  },
  {
    id: "sig_06",
    type: "ROAS_SPIKE",
    source: "internal_analytics",
    severity: "MEDIUM",
    title: "Ami Paris Brand Search ROAS at 13.94x — well above target",
    description: "Ami Paris Brand Search campaign has maintained 13.94x ROAS over the past 7 days, nearly 40% above the 10x target. Opportunity to scale budget or expand keyword set.",
    data: {
      campaignId: "camp_04",
      currentRoas: 13.94,
      targetRoas: 10.0,
      trend: "STABLE_HIGH",
      daysAboveTarget: 12,
      headroom: 3.94,
    },
    city: null,
    brand: "Ami Paris",
    isActive: true,
    autoActionTaken: null,
    resolvedAt: null,
    organizationId: "org_01",
    createdAt: "2026-03-27T05:00:00.000Z",
  },
  {
    id: "sig_07",
    type: "CALENDAR_EVENT",
    source: "calendar",
    severity: "MEDIUM",
    title: "Holi weekend approaching — prepare festive creatives",
    description: "Holi (March 30) is 3 days away. Historical data shows 18% lift in gifting-related luxury purchases in the 3 days leading up to Holi. Recommend activating festive creative variants and gifting-focused ad copy.",
    data: {
      event: "Holi",
      date: "2026-03-30",
      daysUntil: 3,
      historicalLift: 0.18,
      suggestedActions: ["Activate festive creatives", "Enable gift-wrap messaging", "Boost gifting category campaigns"],
    },
    city: null,
    brand: null,
    isActive: true,
    autoActionTaken: null,
    resolvedAt: null,
    organizationId: "org_01",
    createdAt: "2026-03-27T00:00:00.000Z",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const severity = searchParams.get("severity");
  const active = searchParams.get("active");
  const brand = searchParams.get("brand");

  let filtered = [...mockSignals];

  if (type) {
    filtered = filtered.filter((s) => s.type === type.toUpperCase());
  }
  if (severity) {
    filtered = filtered.filter((s) => s.severity === severity.toUpperCase());
  }
  if (active !== null && active !== undefined) {
    filtered = filtered.filter((s) => s.isActive === (active === "true"));
  }
  if (brand) {
    filtered = filtered.filter((s) =>
      s.brand?.toLowerCase().includes(brand.toLowerCase())
    );
  }

  return NextResponse.json({
    signals: filtered,
    total: filtered.length,
    bySeverity: {
      CRITICAL: mockSignals.filter((s) => s.severity === "CRITICAL").length,
      HIGH: mockSignals.filter((s) => s.severity === "HIGH").length,
      MEDIUM: mockSignals.filter((s) => s.severity === "MEDIUM").length,
      LOW: mockSignals.filter((s) => s.severity === "LOW").length,
    },
    byType: {
      WEATHER: mockSignals.filter((s) => s.type === "WEATHER").length,
      SEARCH_TREND: mockSignals.filter((s) => s.type === "SEARCH_TREND").length,
      SOCIAL_BUZZ: mockSignals.filter((s) => s.type === "SOCIAL_BUZZ").length,
      INVENTORY_LOW: mockSignals.filter((s) => s.type === "INVENTORY_LOW").length,
      CREATIVE_FATIGUE: mockSignals.filter((s) => s.type === "CREATIVE_FATIGUE").length,
      ROAS_SPIKE: mockSignals.filter((s) => s.type === "ROAS_SPIKE").length,
      CALENDAR_EVENT: mockSignals.filter((s) => s.type === "CALENDAR_EVENT").length,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newRule = {
      id: `rule_${Date.now()}`,
      name: body.name || "New Signal Rule",
      signalType: body.signalType || "WEATHER",
      conditions: body.conditions || {},
      actions: body.actions || {},
      isAutoApproved: body.isAutoApproved ?? true,
      isActive: true,
      lastTriggeredAt: null,
      triggerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      message: "Signal rule created successfully.",
    };

    return NextResponse.json(newRule, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
