import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const datePreset = searchParams.get("datePreset") || "last_7d";
  const campaignId = searchParams.get("campaignId");

  const _ = { datePreset, campaignId }; // acknowledge params for future use
  void _;

  const metaInsights = {
    platform: "META",
    datePreset,
    currency: "INR",
    accountId: "act_120211548976400",
    accountName: "Ajio Luxe - Performance",

    summary: {
      spend: 41570,
      impressions: 338500,
      reach: 185200,
      frequency: 1.83,
      clicks: 8720,
      ctr: 2.58,
      cpc: 4.77,
      conversions: 70,
      conversionValue: 342800,
      roas: 8.25,
      costPerResult: 593.86,
      addToCart: 420,
      purchases: 70,
      videoViews: 84200,
      videoThruPlays: 32400,
    },

    campaigns: [
      {
        id: "120211548976420",
        name: "Ajio Luxe - Hugo Boss - Urban Achievers ASC",
        status: "ACTIVE",
        objective: "OUTCOME_SALES",
        campaignType: "ASC",
        dailyBudget: 25000,
        spend: 18420,
        impressions: 86200,
        reach: 52400,
        frequency: 1.65,
        clicks: 2540,
        ctr: 2.95,
        cpc: 7.25,
        conversions: 34,
        conversionValue: 142800,
        roas: 7.75,
        addToCart: 180,
        purchases: 34,
        costPerPurchase: 541.76,
        adSets: [
          {
            id: "23856742000001",
            name: "Advantage+ Shopping — Auto",
            targeting: "Advantage+ Audience",
            spend: 18420,
            impressions: 86200,
            conversions: 34,
            roas: 7.75,
          },
        ],
      },
      {
        id: "120211548976421",
        name: "Ajio Luxe - Diesel - Fashion Loyalists Retarget",
        status: "ACTIVE",
        objective: "OUTCOME_SALES",
        campaignType: "RETARGET",
        dailyBudget: 15000,
        spend: 12350,
        impressions: 42300,
        reach: 18600,
        frequency: 2.27,
        clicks: 1980,
        ctr: 4.68,
        cpc: 6.24,
        conversions: 28,
        conversionValue: 168000,
        roas: 13.6,
        addToCart: 142,
        purchases: 28,
        costPerPurchase: 441.07,
        adSets: [
          {
            id: "23856742000002",
            name: "Website Visitors 7D — 1DR Bag",
            targeting: "Custom Audience: Website Visitors 7 Days + ViewContent",
            spend: 7200,
            impressions: 24500,
            conversions: 18,
            roas: 15.0,
          },
          {
            id: "23856742000003",
            name: "Add to Cart Abandoners 14D",
            targeting: "Custom Audience: AddToCart 14 Days — Purchasers",
            spend: 5150,
            impressions: 17800,
            conversions: 10,
            roas: 11.65,
          },
        ],
      },
      {
        id: "120211548976425",
        name: "Ajio Luxe - Hugo Boss - Occasional Splurgers Awareness",
        status: "ACTIVE",
        objective: "OUTCOME_AWARENESS",
        campaignType: "AWARENESS",
        dailyBudget: 12000,
        spend: 10800,
        impressions: 210000,
        reach: 114200,
        frequency: 1.84,
        clicks: 4200,
        ctr: 2.0,
        cpc: 2.57,
        conversions: 8,
        conversionValue: 32000,
        roas: 2.96,
        videoViews: 84200,
        videoThruPlays: 32400,
        costPerThruPlay: 0.33,
        adSets: [
          {
            id: "23856742000004",
            name: "Broad Interest — Luxury Fashion 25-45",
            targeting: "Interest: Luxury Fashion, Premium Brands | Age: 25-45 | Tier 1 + Tier 1B Cities",
            spend: 10800,
            impressions: 210000,
            conversions: 8,
            roas: 2.96,
          },
        ],
      },
    ],

    breakdowns: {
      age: [
        { range: "18-24", spend: 4200, conversions: 4, roas: 2.1 },
        { range: "25-34", spend: 18600, conversions: 32, roas: 9.8 },
        { range: "35-44", spend: 12400, conversions: 24, roas: 8.6 },
        { range: "45-54", spend: 4800, conversions: 8, roas: 6.2 },
        { range: "55+", spend: 1570, conversions: 2, roas: 4.8 },
      ],
      gender: [
        { gender: "Male", spend: 26400, conversions: 48, roas: 8.9 },
        { gender: "Female", spend: 15170, conversions: 22, roas: 7.1 },
      ],
      placement: [
        { placement: "Facebook Feed", spend: 14200, conversions: 28, roas: 9.4 },
        { placement: "Instagram Feed", spend: 12800, conversions: 22, roas: 8.2 },
        { placement: "Instagram Reels", spend: 8400, conversions: 12, roas: 6.8 },
        { placement: "Instagram Stories", spend: 4200, conversions: 6, roas: 5.4 },
        { placement: "Audience Network", spend: 1970, conversions: 2, roas: 3.8 },
      ],
      device: [
        { device: "Mobile", spend: 35200, conversions: 58, roas: 8.0 },
        { device: "Desktop", spend: 6370, conversions: 12, roas: 9.4 },
      ],
    },

    pixelEvents: {
      pageView: 284000,
      viewContent: 42800,
      addToCart: 420,
      initiateCheckout: 182,
      purchase: 70,
      funnelDropoff: {
        viewToCart: 1.0,
        cartToCheckout: 43.3,
        checkoutToPurchase: 38.5,
      },
    },
  };

  return NextResponse.json(metaInsights);
}
