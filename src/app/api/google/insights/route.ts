import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateRange = searchParams.get("dateRange") || "LAST_7_DAYS";
  const campaignId = searchParams.get("campaignId");

  const _ = { dateRange, campaignId }; // acknowledge params for future use
  void _;

  const googleInsights = {
    platform: "GOOGLE",
    dateRange,
    currency: "INR",
    customerId: "1234567890",
    accountName: "Ajio Luxe - Google Ads",

    summary: {
      spend: 31400,
      impressions: 238200,
      clicks: 7590,
      ctr: 3.19,
      avgCpc: 4.14,
      conversions: 46,
      conversionValue: 199600,
      roas: 6.35,
      costPerConversion: 682.61,
      searchImpressionShare: 68.4,
      searchTopImpressionRate: 52.1,
      allConversions: 58, // Includes view-through & cross-device
    },

    campaigns: [
      {
        id: "customers/1234567890/campaigns/987654321",
        name: "Ajio Luxe - Kenzo PMAX - Tier 1 Cities",
        status: "ENABLED",
        type: "PERFORMANCE_MAX",
        dailyBudget: 20000,
        targetRoas: 4.5,
        spend: 16800,
        impressions: 124500,
        clicks: 3100,
        ctr: 2.49,
        avgCpc: 5.42,
        conversions: 22,
        conversionValue: 88000,
        roas: 5.24,
        allConversions: 28,
        assetGroups: [
          {
            id: "ag_kenzo_tiger",
            name: "Kenzo Tiger Collection",
            status: "ENABLED",
            spend: 9800,
            conversions: 14,
            roas: 5.71,
            bestPerformingAssets: {
              headlines: ["Shop Kenzo Tiger Collection", "Authentic Kenzo India"],
              descriptions: ["Free express delivery on Ajio Luxe"],
              images: ["kenzo-tiger-hero.jpg"],
            },
          },
          {
            id: "ag_kenzo_general",
            name: "Kenzo General — All Products",
            status: "ENABLED",
            spend: 7000,
            conversions: 8,
            roas: 4.57,
            bestPerformingAssets: {
              headlines: ["Kenzo on Ajio Luxe", "New Kenzo SS26 Collection"],
              descriptions: ["100% authentic. Free returns within 30 days."],
              images: ["kenzo-ss26-lookbook.jpg"],
            },
          },
        ],
        listingGroups: [
          { category: "Apparel > Sweaters", spend: 6200, conversions: 8, roas: 6.45 },
          { category: "Apparel > T-Shirts", spend: 4800, conversions: 6, roas: 5.0 },
          { category: "Accessories > Bags", spend: 3400, conversions: 4, roas: 4.71 },
          { category: "Apparel > Outerwear", spend: 2400, conversions: 4, roas: 4.17 },
        ],
      },
      {
        id: "customers/1234567890/campaigns/987654322",
        name: "Ajio Luxe - Ami Paris - Brand Search",
        status: "ENABLED",
        type: "SEARCH",
        dailyBudget: 8000,
        targetRoas: 10.0,
        spend: 6200,
        impressions: 18700,
        clicks: 1640,
        ctr: 8.77,
        avgCpc: 3.78,
        conversions: 18,
        conversionValue: 86400,
        roas: 13.94,
        allConversions: 22,
        searchImpressionShare: 82.5,
        searchTopImpressionRate: 74.2,
        searchAbsoluteTopRate: 58.6,
        adGroups: [
          {
            id: "adg_ami_brand",
            name: "Ami Paris — Brand Terms",
            spend: 3400,
            impressions: 10200,
            clicks: 980,
            conversions: 12,
            roas: 16.94,
            topKeywords: [
              { keyword: "ami paris india", matchType: "PHRASE", impressions: 4200, clicks: 420, conversions: 6, qualityScore: 9 },
              { keyword: "ami paris ajio", matchType: "EXACT", impressions: 2800, clicks: 340, conversions: 4, qualityScore: 10 },
              { keyword: "buy ami paris online india", matchType: "PHRASE", impressions: 3200, clicks: 220, conversions: 2, qualityScore: 8 },
            ],
          },
          {
            id: "adg_ami_product",
            name: "Ami Paris — Product Terms",
            spend: 2800,
            impressions: 8500,
            clicks: 660,
            conversions: 6,
            roas: 10.29,
            topKeywords: [
              { keyword: "ami de coeur t-shirt", matchType: "PHRASE", impressions: 3800, clicks: 320, conversions: 3, qualityScore: 8 },
              { keyword: "ami paris heart logo sweater", matchType: "PHRASE", impressions: 2400, clicks: 180, conversions: 2, qualityScore: 7 },
              { keyword: "ami paris hoodie price", matchType: "BROAD", impressions: 2300, clicks: 160, conversions: 1, qualityScore: 7 },
            ],
          },
        ],
      },
      {
        id: "customers/1234567890/campaigns/987654326",
        name: "Ajio Luxe - Diesel - Demand Gen - Video",
        status: "PAUSED",
        type: "DEMAND_GEN",
        dailyBudget: 10000,
        spend: 8400,
        impressions: 95000,
        clicks: 2850,
        ctr: 3.0,
        avgCpc: 2.95,
        conversions: 6,
        conversionValue: 25200,
        roas: 3.0,
        allConversions: 8,
        audiences: [
          {
            name: "In-market: Luxury Fashion",
            spend: 3200,
            conversions: 3,
            roas: 3.75,
          },
          {
            name: "Custom Segment: Diesel Enthusiasts",
            spend: 2800,
            conversions: 2,
            roas: 2.86,
          },
          {
            name: "Lookalike: Top 10% Purchasers",
            spend: 2400,
            conversions: 1,
            roas: 2.5,
          },
        ],
        videoMetrics: {
          views: 42000,
          viewRate: 44.2,
          avgViewDuration: 8.4,
          quartile25: 78.5,
          quartile50: 52.3,
          quartile75: 34.1,
          quartile100: 22.8,
        },
      },
    ],

    breakdowns: {
      network: [
        { network: "Search", spend: 6200, conversions: 18, roas: 13.94 },
        { network: "Shopping", spend: 12600, conversions: 16, roas: 5.08 },
        { network: "YouTube", spend: 6400, conversions: 4, roas: 2.5 },
        { network: "Display", spend: 3200, conversions: 4, roas: 5.0 },
        { network: "Discover", spend: 3000, conversions: 4, roas: 5.33 },
      ],
      device: [
        { device: "Mobile", spend: 22400, conversions: 32, roas: 5.89 },
        { device: "Desktop", spend: 7200, conversions: 12, roas: 8.33 },
        { device: "Tablet", spend: 1800, conversions: 2, roas: 5.56 },
      ],
      location: [
        { city: "Mumbai", spend: 8400, conversions: 14, roas: 7.14 },
        { city: "Delhi NCR", spend: 7600, conversions: 12, roas: 6.84 },
        { city: "Bangalore", spend: 5200, conversions: 8, roas: 6.15 },
        { city: "Hyderabad", spend: 3800, conversions: 4, roas: 5.26 },
        { city: "Pune", spend: 2800, conversions: 4, roas: 7.14 },
        { city: "Chennai", spend: 2200, conversions: 2, roas: 4.55 },
        { city: "Ahmedabad", spend: 1400, conversions: 2, roas: 7.14 },
      ],
    },

    shoppingPerformance: {
      topProducts: [
        { title: "Kenzo Tiger Sweater - Black", productId: "KNZ-TIGER-SW-2026", clicks: 480, conversions: 6, roas: 6.5 },
        { title: "Kenzo Boke Flower Tee", productId: "KNZ-BOKE-TEE-2026", clicks: 320, conversions: 4, roas: 5.0 },
        { title: "Kenzo Tiger Academy Hoodie", productId: "KNZ-TIGER-HOOD-2026", clicks: 280, conversions: 3, roas: 4.67 },
      ],
      feedHealth: {
        totalProducts: 842,
        activeProducts: 780,
        disapproved: 12,
        pending: 50,
        missingImages: 8,
        missingDescriptions: 22,
      },
    },
  };

  return NextResponse.json(googleInsights);
}
