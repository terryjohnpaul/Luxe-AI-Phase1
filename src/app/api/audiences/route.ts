import { NextResponse } from "next/server";

const mockAudiences = [
  {
    id: "aud_01",
    name: "Fashion Loyalists",
    description: "High-frequency luxury buyers with strong brand affinity. Shop 6+ times/year, low discount dependency, prefer current-season collections.",
    archetype: "FASHION_LOYALIST",
    memberCount: 12480,
    filters: {
      totalOrders: { min: 6 },
      avgOrderValue: { min: 5000 },
      discountUsage: { max: 15 },
      returnRate: { max: 12 },
    },
    metaAudienceId: "23856742901234",
    googleListId: "customers/1234567890/userLists/111222333",
    lastSyncedAt: "2026-03-27T04:00:00.000Z",
    metrics: {
      avgClv: 78500,
      avgOrderValue: 6800,
      avgReturnRate: 8.5,
      avgDiscountUsage: 9.2,
      topBrands: ["Hugo Boss", "Diesel", "Ami Paris"],
      topCities: ["Mumbai", "Delhi", "Bangalore"],
      conversionRate: 4.8,
      roas: 11.2,
    },
    organizationId: "org_01",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-03-27T04:00:00.000Z",
  },
  {
    id: "aud_02",
    name: "Urban Achievers",
    description: "Young professionals (25-35) in Tier 1 cities. First luxury purchase within 6 months, respond well to aspirational lifestyle content and social proof.",
    archetype: "URBAN_ACHIEVER",
    memberCount: 34200,
    filters: {
      totalOrders: { min: 2, max: 5 },
      avgOrderValue: { min: 3500, max: 8000 },
      tier: ["TIER_1"],
    },
    metaAudienceId: "23856742901235",
    googleListId: "customers/1234567890/userLists/111222334",
    lastSyncedAt: "2026-03-27T04:00:00.000Z",
    metrics: {
      avgClv: 42000,
      avgOrderValue: 4500,
      avgReturnRate: 15.2,
      avgDiscountUsage: 22.5,
      topBrands: ["Hugo Boss", "Armani Exchange", "Kenzo"],
      topCities: ["Mumbai", "Delhi", "Pune", "Hyderabad"],
      conversionRate: 3.2,
      roas: 7.8,
    },
    organizationId: "org_01",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-03-27T04:00:00.000Z",
  },
  {
    id: "aud_03",
    name: "Occasional Splurgers",
    description: "Buy luxury 1-2 times per year, typically during sales or special occasions. High AOV when they do purchase, but need strong triggers (festive, gifting).",
    archetype: "OCCASIONAL_SPLURGER",
    memberCount: 56800,
    filters: {
      totalOrders: { min: 1, max: 3 },
      avgOrderValue: { min: 4000 },
      lastPurchaseWithinDays: { max: 365 },
    },
    metaAudienceId: "23856742901236",
    googleListId: "customers/1234567890/userLists/111222335",
    lastSyncedAt: "2026-03-27T04:00:00.000Z",
    metrics: {
      avgClv: 18500,
      avgOrderValue: 5200,
      avgReturnRate: 20.1,
      avgDiscountUsage: 35.8,
      topBrands: ["Hugo Boss", "Diesel", "Kenzo"],
      topCities: ["Delhi", "Mumbai", "Bangalore", "Chennai"],
      conversionRate: 1.8,
      roas: 4.2,
    },
    organizationId: "org_01",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-03-27T04:00:00.000Z",
  },
  {
    id: "aud_04",
    name: "Aspirants",
    description: "First-time visitors and browsers who have shown interest but not yet converted. Engage with content, add to wishlist, browse 3+ sessions. Entry-level luxury opportunity.",
    archetype: "ASPIRANT",
    memberCount: 142500,
    filters: {
      totalOrders: { max: 0 },
      avgTimeOnSite: { min: 5 },
      addToWishlist: { min: 1 },
    },
    metaAudienceId: "23856742901237",
    googleListId: null,
    lastSyncedAt: "2026-03-27T04:00:00.000Z",
    metrics: {
      avgClv: 0,
      avgOrderValue: 0,
      avgReturnRate: 0,
      avgDiscountUsage: 0,
      topBrands: ["Armani Exchange", "Hugo Boss", "Kenzo"],
      topCities: ["Delhi", "Mumbai", "Bangalore", "Pune", "Ahmedabad"],
      conversionRate: 0.6,
      roas: 2.1,
    },
    organizationId: "org_01",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-03-27T04:00:00.000Z",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const archetype = searchParams.get("archetype");

  let audiences = [...mockAudiences];

  if (archetype) {
    audiences = audiences.filter((a) => a.archetype === archetype);
  }

  const totalMembers = audiences.reduce((sum, a) => sum + a.memberCount, 0);

  return NextResponse.json({
    audiences,
    total: audiences.length,
    totalMembers,
    archetypeDistribution: {
      FASHION_LOYALIST: 12480,
      URBAN_ACHIEVER: 34200,
      OCCASIONAL_SPLURGER: 56800,
      ASPIRANT: 142500,
      UNCLASSIFIED: 8900,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newAudience = {
      id: `aud_${Date.now()}`,
      name: body.name || "New Audience Segment",
      description: body.description || null,
      archetype: body.archetype || "UNCLASSIFIED",
      memberCount: 0,
      filters: body.filters || {},
      metaAudienceId: null,
      googleListId: null,
      lastSyncedAt: null,
      organizationId: "org_01",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      message: "Audience segment created. Member count will be calculated asynchronously.",
    };

    return NextResponse.json(newAudience, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
