import { NextResponse } from "next/server";

const mockCreativeVariants = [
  {
    id: "cv_01",
    name: "Hugo Boss Urban Lifestyle - Delhi Winter",
    brand: "Hugo Boss",
    format: "STATIC_IMAGE",
    contentType: "LIFESTYLE_IMAGE",
    sourceAssetId: "asset_hb_fw26_01",
    imageUrl: "https://placeholder.luxe-ai.dev/creatives/hb-urban-delhi-winter.jpg",
    videoUrl: null,
    headline: "Command Every Room",
    primaryText: "The new Hugo Boss FW26 collection. Tailored for those who lead, not follow. Free express delivery on orders above INR 5,000.",
    description: "Hugo Boss FW26 — Urban Lifestyle",
    cta: "SHOP_NOW",
    aspectRatio: "1:1",
    status: "LIVE",
    campaignId: "camp_01",
    archetype: "URBAN_ACHIEVER",
    funnelStage: "CONVERSION",
    impressions: 48200,
    clicks: 1420,
    conversions: 18,
    spend: 9800,
    roas: 8.26,
    fatigueScore: 0.32,
    organizationId: "org_01",
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-27T06:00:00.000Z",
  },
  {
    id: "cv_02",
    name: "Hugo Boss Urban Lifestyle - Reels Format",
    brand: "Hugo Boss",
    format: "VIDEO_SHORT",
    contentType: "EDITORIAL",
    sourceAssetId: "asset_hb_fw26_02",
    imageUrl: null,
    videoUrl: "https://placeholder.luxe-ai.dev/creatives/hb-urban-reels-v1.mp4",
    headline: "Boss Moves Only",
    primaryText: "6 seconds. One look. Unmistakably Boss. Shop the FW26 collection on Ajio Luxe.",
    description: "Hugo Boss FW26 — Reels",
    cta: "SHOP_NOW",
    aspectRatio: "9:16",
    status: "LIVE",
    campaignId: "camp_01",
    archetype: "URBAN_ACHIEVER",
    funnelStage: "CONVERSION",
    impressions: 62400,
    clicks: 1840,
    conversions: 16,
    spend: 8620,
    roas: 7.42,
    fatigueScore: 0.28,
    organizationId: "org_01",
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-27T06:00:00.000Z",
  },
  {
    id: "cv_03",
    name: "Diesel Retarget — 1DR Bag Carousel",
    brand: "Diesel",
    format: "CAROUSEL",
    contentType: "PRODUCT_FOCUSED",
    sourceAssetId: "asset_diesel_1dr_01",
    imageUrl: "https://placeholder.luxe-ai.dev/creatives/diesel-1dr-carousel-cover.jpg",
    videoUrl: null,
    headline: "You Looked. You Loved. It's Still Here.",
    primaryText: "The Diesel 1DR bag you saved is still available. Complete your look — only on Ajio Luxe. Free returns within 30 days.",
    description: "Diesel 1DR Retarget Carousel",
    cta: "SHOP_NOW",
    aspectRatio: "1:1",
    status: "LIVE",
    campaignId: "camp_02",
    archetype: "FASHION_LOYALIST",
    funnelStage: "CONVERSION",
    impressions: 28500,
    clicks: 1340,
    conversions: 22,
    spend: 7200,
    roas: 14.58,
    fatigueScore: 0.18,
    organizationId: "org_01",
    createdAt: "2026-03-12T00:00:00.000Z",
    updatedAt: "2026-03-27T06:00:00.000Z",
  },
  {
    id: "cv_04",
    name: "Kenzo Tiger — PMAX Asset Group",
    brand: "Kenzo",
    format: "STATIC_IMAGE",
    contentType: "EDITORIAL",
    sourceAssetId: "asset_kenzo_tiger_01",
    imageUrl: "https://placeholder.luxe-ai.dev/creatives/kenzo-tiger-pmax.jpg",
    videoUrl: null,
    headline: "Unleash Your Style",
    primaryText: "The iconic Kenzo Tiger collection. Bold prints, premium craftsmanship. Now on Ajio Luxe with express delivery across India.",
    description: "Kenzo Tiger — PMAX",
    cta: "SHOP_NOW",
    aspectRatio: "1:1",
    status: "LIVE",
    campaignId: "camp_03",
    archetype: "ASPIRANT",
    funnelStage: "CONVERSION",
    impressions: 82400,
    clicks: 2050,
    conversions: 12,
    spend: 11200,
    roas: 4.28,
    fatigueScore: 0.45,
    organizationId: "org_01",
    createdAt: "2026-03-05T00:00:00.000Z",
    updatedAt: "2026-03-27T06:00:00.000Z",
  },
  {
    id: "cv_05",
    name: "Diesel Demand Gen — Lifestyle Video",
    brand: "Diesel",
    format: "VIDEO_MEDIUM",
    contentType: "EDITORIAL",
    sourceAssetId: "asset_diesel_lifestyle_01",
    imageUrl: null,
    videoUrl: "https://placeholder.luxe-ai.dev/creatives/diesel-lifestyle-v2.mp4",
    headline: "For the Brave",
    primaryText: "Diesel SS26 — where rebellion meets refinement. Watch. Feel. Shop.",
    description: "Diesel SS26 Demand Gen Video",
    cta: "LEARN_MORE",
    aspectRatio: "16:9",
    status: "PAUSED",
    campaignId: "camp_06",
    archetype: "URBAN_ACHIEVER",
    funnelStage: "CONSIDERATION",
    impressions: 95000,
    clicks: 2850,
    conversions: 6,
    spend: 8400,
    roas: 3.0,
    fatigueScore: 0.85,
    organizationId: "org_01",
    createdAt: "2026-03-06T00:00:00.000Z",
    updatedAt: "2026-03-25T06:00:00.000Z",
  },
  {
    id: "cv_06",
    name: "Ami Paris — Heart Logo Social Proof",
    brand: "Ami Paris",
    format: "STATIC_IMAGE",
    contentType: "SOCIAL_PROOF",
    sourceAssetId: "asset_ami_heart_01",
    imageUrl: "https://placeholder.luxe-ai.dev/creatives/ami-social-proof.jpg",
    videoUrl: null,
    headline: "Join 2,400+ Ami Paris Lovers on Ajio Luxe",
    primaryText: "\"Best quality Ami Paris pieces I've found online\" — verified buyer. Shop the Ami de Coeur collection with 100% authenticity guarantee.",
    description: "Ami Paris — Social Proof Ad",
    cta: "SHOP_NOW",
    aspectRatio: "1:1",
    status: "LIVE",
    campaignId: "camp_04",
    archetype: "FASHION_LOYALIST",
    funnelStage: "CONVERSION",
    impressions: 14200,
    clicks: 1240,
    conversions: 14,
    spend: 4800,
    roas: 12.6,
    fatigueScore: 0.22,
    organizationId: "org_01",
    createdAt: "2026-03-14T00:00:00.000Z",
    updatedAt: "2026-03-27T06:00:00.000Z",
  },
  {
    id: "cv_07",
    name: "Hugo Boss Awareness — Aspirational Lifestyle",
    brand: "Hugo Boss",
    format: "VIDEO_MEDIUM",
    contentType: "EDITORIAL",
    sourceAssetId: "asset_hb_aspire_01",
    imageUrl: null,
    videoUrl: "https://placeholder.luxe-ai.dev/creatives/hb-aspirational-v1.mp4",
    headline: "Dress for the Life You're Building",
    primaryText: "Hugo Boss — where ambition meets elegance. Discover the collection that moves with you. Exclusively on Ajio Luxe.",
    description: "Hugo Boss — Awareness Video",
    cta: "LEARN_MORE",
    aspectRatio: "9:16",
    status: "LIVE",
    campaignId: "camp_05",
    archetype: "OCCASIONAL_SPLURGER",
    funnelStage: "AWARENESS",
    impressions: 210000,
    clicks: 4200,
    conversions: 8,
    spend: 10800,
    roas: 2.96,
    fatigueScore: 0.72,
    organizationId: "org_01",
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-27T06:00:00.000Z",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get("brand");
  const status = searchParams.get("status");
  const format = searchParams.get("format");
  const archetype = searchParams.get("archetype");

  let filtered = [...mockCreativeVariants];

  if (brand) {
    filtered = filtered.filter((c) =>
      c.brand?.toLowerCase().includes(brand.toLowerCase())
    );
  }
  if (status) {
    filtered = filtered.filter((c) => c.status === status.toUpperCase());
  }
  if (format) {
    filtered = filtered.filter((c) => c.format === format.toUpperCase());
  }
  if (archetype) {
    filtered = filtered.filter((c) => c.archetype === archetype);
  }

  const totalImpressions = filtered.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = filtered.reduce((s, c) => s + c.clicks, 0);
  const totalSpend = filtered.reduce((s, c) => s + c.spend, 0);
  const totalConversions = filtered.reduce((s, c) => s + c.conversions, 0);

  return NextResponse.json({
    creatives: filtered,
    total: filtered.length,
    summary: {
      totalImpressions,
      totalClicks,
      totalSpend,
      totalConversions,
      avgCtr: parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)),
      avgRoas: parseFloat(
        (filtered.reduce((s, c) => s + (c.roas || 0), 0) / filtered.length).toFixed(2)
      ),
      fatigued: filtered.filter((c) => (c.fatigueScore || 0) > 0.7).length,
    },
    currency: "INR",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newVariant = {
      id: `cv_${Date.now()}`,
      name: body.name || `${body.brand || "Brand"} — AI Generated Variant`,
      brand: body.brand || null,
      format: body.format || "STATIC_IMAGE",
      contentType: body.contentType || "EDITORIAL",
      sourceAssetId: body.sourceAssetId || null,
      imageUrl: null,
      videoUrl: null,
      headline: null,
      primaryText: null,
      description: null,
      cta: body.cta || "SHOP_NOW",
      aspectRatio: body.aspectRatio || "1:1",
      status: "DRAFT",
      campaignId: body.campaignId || null,
      archetype: body.archetype || null,
      funnelStage: body.funnelStage || null,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      roas: null,
      fatigueScore: null,
      organizationId: "org_01",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      message: "Creative generation queued. AI will generate headline, primary text, and image/video based on brand guidelines and archetype targeting. Estimated completion: 2-5 minutes.",
    };

    return NextResponse.json(newVariant, { status: 202 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
