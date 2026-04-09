import { NextResponse } from "next/server";

const mockCampaigns = [
  {
    id: "camp_01",
    externalId: "120211548976420",
    platform: "META",
    name: "Ajio Luxe - Hugo Boss - Urban Achievers ASC",
    status: "ACTIVE",
    campaignType: "ASC",
    dailyBudget: 25000,
    objective: "OUTCOME_SALES",
    targetRoas: 5.0,
    archetype: "URBAN_ACHIEVER",
    brandFocus: "Hugo Boss",
    funnelStage: "CONVERSION",
    isAutomated: true,
    adAccountId: "act_01",
    organizationId: "org_01",
    metrics: {
      spend: 18420,
      conversions: 34,
      conversionValue: 142800,
      roas: 7.75,
      impressions: 86200,
      clicks: 2540,
      ctr: 2.95,
      cpc: 7.25,
    },
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-27T06:00:00.000Z",
  },
  {
    id: "camp_02",
    externalId: "120211548976421",
    platform: "META",
    name: "Ajio Luxe - Diesel - Fashion Loyalists Retarget",
    status: "ACTIVE",
    campaignType: "RETARGET",
    dailyBudget: 15000,
    objective: "OUTCOME_SALES",
    targetRoas: 8.0,
    archetype: "FASHION_LOYALIST",
    brandFocus: "Diesel",
    funnelStage: "CONVERSION",
    isAutomated: true,
    adAccountId: "act_01",
    organizationId: "org_01",
    metrics: {
      spend: 12350,
      conversions: 28,
      conversionValue: 168000,
      roas: 13.6,
      impressions: 42300,
      clicks: 1980,
      ctr: 4.68,
      cpc: 6.24,
    },
    createdAt: "2026-02-15T00:00:00.000Z",
    updatedAt: "2026-03-27T06:00:00.000Z",
  },
  {
    id: "camp_03",
    externalId: "customers/1234567890/campaigns/987654321",
    platform: "GOOGLE",
    name: "Ajio Luxe - Kenzo PMAX - Tier 1 Cities",
    status: "ACTIVE",
    campaignType: "PMAX",
    dailyBudget: 20000,
    objective: "PERFORMANCE_MAX",
    targetRoas: 4.5,
    archetype: "ASPIRANT",
    brandFocus: "Kenzo",
    funnelStage: "CONVERSION",
    isAutomated: true,
    adAccountId: "act_02",
    organizationId: "org_01",
    metrics: {
      spend: 16800,
      conversions: 22,
      conversionValue: 88000,
      roas: 5.24,
      impressions: 124500,
      clicks: 3100,
      ctr: 2.49,
      cpc: 5.42,
    },
    createdAt: "2026-03-05T00:00:00.000Z",
    updatedAt: "2026-03-27T06:00:00.000Z",
  },
  {
    id: "camp_04",
    externalId: "customers/1234567890/campaigns/987654322",
    platform: "GOOGLE",
    name: "Ajio Luxe - Ami Paris - Brand Search",
    status: "ACTIVE",
    campaignType: "BRAND_SEARCH",
    dailyBudget: 8000,
    objective: "SEARCH",
    targetRoas: 10.0,
    archetype: "FASHION_LOYALIST",
    brandFocus: "Ami Paris",
    funnelStage: "CONVERSION",
    isAutomated: false,
    adAccountId: "act_02",
    organizationId: "org_01",
    metrics: {
      spend: 6200,
      conversions: 18,
      conversionValue: 86400,
      roas: 13.94,
      impressions: 18700,
      clicks: 1640,
      ctr: 8.77,
      cpc: 3.78,
    },
    createdAt: "2026-02-20T00:00:00.000Z",
    updatedAt: "2026-03-27T06:00:00.000Z",
  },
  {
    id: "camp_05",
    externalId: "120211548976425",
    platform: "META",
    name: "Ajio Luxe - Hugo Boss - Occasional Splurgers Awareness",
    status: "ACTIVE",
    campaignType: "AWARENESS",
    dailyBudget: 12000,
    objective: "OUTCOME_AWARENESS",
    targetRoas: 2.5,
    archetype: "OCCASIONAL_SPLURGER",
    brandFocus: "Hugo Boss",
    funnelStage: "AWARENESS",
    isAutomated: true,
    adAccountId: "act_01",
    organizationId: "org_01",
    metrics: {
      spend: 10800,
      conversions: 8,
      conversionValue: 32000,
      roas: 2.96,
      impressions: 210000,
      clicks: 4200,
      ctr: 2.0,
      cpc: 2.57,
    },
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-27T06:00:00.000Z",
  },
  {
    id: "camp_06",
    externalId: "customers/1234567890/campaigns/987654326",
    platform: "GOOGLE",
    name: "Ajio Luxe - Diesel - Demand Gen - Video",
    status: "PAUSED",
    campaignType: "DEMAND_GEN",
    dailyBudget: 10000,
    objective: "DEMAND_GEN",
    targetRoas: 3.0,
    archetype: "URBAN_ACHIEVER",
    brandFocus: "Diesel",
    funnelStage: "CONSIDERATION",
    isAutomated: false,
    adAccountId: "act_02",
    organizationId: "org_01",
    metrics: {
      spend: 8400,
      conversions: 6,
      conversionValue: 25200,
      roas: 3.0,
      impressions: 95000,
      clicks: 2850,
      ctr: 3.0,
      cpc: 2.95,
    },
    createdAt: "2026-03-08T00:00:00.000Z",
    updatedAt: "2026-03-25T06:00:00.000Z",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const status = searchParams.get("status");
  const archetype = searchParams.get("archetype");
  const brand = searchParams.get("brand");

  let filtered = [...mockCampaigns];

  if (platform) {
    filtered = filtered.filter((c) => c.platform === platform.toUpperCase());
  }
  if (status) {
    filtered = filtered.filter((c) => c.status === status.toUpperCase());
  }
  if (archetype) {
    filtered = filtered.filter((c) => c.archetype === archetype);
  }
  if (brand) {
    filtered = filtered.filter((c) =>
      c.brandFocus?.toLowerCase().includes(brand.toLowerCase())
    );
  }

  return NextResponse.json({
    campaigns: filtered,
    total: filtered.length,
    platforms: { META: 3, GOOGLE: 3 },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newCampaign = {
      id: `camp_${Date.now()}`,
      externalId: `pending_${Date.now()}`,
      platform: body.platform || "META",
      name: body.name || "New Campaign",
      status: "PAUSED" as const,
      campaignType: body.campaignType || "ASC",
      dailyBudget: body.dailyBudget || 10000,
      objective: body.objective || "OUTCOME_SALES",
      targetRoas: body.targetRoas || 5.0,
      archetype: body.archetype || "UNCLASSIFIED",
      brandFocus: body.brandFocus || null,
      funnelStage: body.funnelStage || "CONVERSION",
      isAutomated: body.isAutomated ?? false,
      adAccountId: body.adAccountId || "act_01",
      organizationId: "org_01",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { campaign: newCampaign, message: "Campaign created (mock)" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
