import { NextResponse } from "next/server";

const mockOptimizationCycles = [
  {
    id: "opt_01",
    organizationId: "org_01",
    startedAt: "2026-03-27T05:30:00.000Z",
    completedAt: "2026-03-27T05:32:14.000Z",
    status: "COMPLETED",
    summary: {
      totalDecisions: 4,
      budgetChanges: 2,
      creativePauses: 1,
      audienceShifts: 1,
      estimatedImpact: "+12% ROAS",
    },
    decisions: [
      {
        id: "dec_01",
        cycleId: "opt_01",
        campaignId: "camp_01",
        decisionType: "BUDGET_INCREASE",
        description: "Increase Hugo Boss Urban Achievers ASC daily budget from INR 25,000 to INR 32,000",
        reasoning: "Campaign ROAS at 7.75x is 55% above target of 5.0x, with consistent performance over the last 7 days. Weather signal shows cooling trend in Delhi NCR which historically boosts Boss outerwear conversions by 18%.",
        previousValue: { dailyBudget: 25000 },
        newValue: { dailyBudget: 32000 },
        autoApproved: true,
        status: "EXECUTED",
        executedAt: "2026-03-27T05:32:00.000Z",
        impact: { roasChange: "+0.3x", spendIncrease: 7000 },
      },
      {
        id: "dec_02",
        cycleId: "opt_01",
        campaignId: "camp_05",
        decisionType: "BUDGET_DECREASE",
        description: "Reduce Hugo Boss Occasional Splurgers Awareness budget from INR 12,000 to INR 8,000",
        reasoning: "Frequency has exceeded 3.2 in the past 5 days indicating audience saturation. Creative fatigue score at 0.72. Recommend reducing budget and refreshing creatives before scaling again.",
        previousValue: { dailyBudget: 12000 },
        newValue: { dailyBudget: 8000 },
        autoApproved: true,
        status: "EXECUTED",
        executedAt: "2026-03-27T05:32:05.000Z",
        impact: { frequencyReduction: -0.8, savingsDaily: 4000 },
      },
      {
        id: "dec_03",
        cycleId: "opt_01",
        campaignId: "camp_06",
        decisionType: "CREATIVE_REFRESH",
        description: "Flag Diesel Demand Gen Video creative for refresh — fatigue score 0.85",
        reasoning: "CTR has dropped 34% over the past 2 weeks while impressions remained stable, indicating creative fatigue. Video completion rate also declined from 42% to 28%.",
        previousValue: { fatigueScore: 0.85, ctr: 1.95 },
        newValue: { action: "GENERATE_NEW_VARIANTS" },
        autoApproved: false,
        status: "PENDING",
        impact: null,
      },
      {
        id: "dec_04",
        cycleId: "opt_01",
        campaignId: "camp_03",
        decisionType: "AUDIENCE_SHIFT",
        description: "Shift Kenzo PMAX audience signals to include Tier 1B cities (Pune, Ahmedabad, Chandigarh)",
        reasoning: "Search trend signal detected 45% increase in 'Kenzo Tiger' searches from Pune and Ahmedabad. Current campaign only targets Tier 1 metros. Expanding audience signals could capture emerging demand at lower CPAs.",
        previousValue: { cities: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata"] },
        newValue: { cities: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Chandigarh"] },
        autoApproved: false,
        status: "PENDING",
        impact: null,
      },
    ],
  },
  {
    id: "opt_02",
    organizationId: "org_01",
    startedAt: "2026-03-26T05:30:00.000Z",
    completedAt: "2026-03-26T05:31:48.000Z",
    status: "COMPLETED",
    summary: {
      totalDecisions: 3,
      budgetChanges: 1,
      creativePauses: 0,
      audienceShifts: 1,
      estimatedImpact: "+8% ROAS",
    },
    decisions: [
      {
        id: "dec_05",
        cycleId: "opt_02",
        campaignId: "camp_02",
        decisionType: "BUDGET_INCREASE",
        description: "Increase Diesel Fashion Loyalists Retarget budget from INR 12,000 to INR 15,000",
        reasoning: "Retargeting pool refreshed with 2,400 new high-intent visitors from weekend. ROAS at 13.6x — well above the 8x threshold for auto-scaling.",
        previousValue: { dailyBudget: 12000 },
        newValue: { dailyBudget: 15000 },
        autoApproved: true,
        status: "EXECUTED",
        executedAt: "2026-03-26T05:31:30.000Z",
        impact: { roasChange: "-0.4x", revenueIncrease: 14000 },
      },
      {
        id: "dec_06",
        cycleId: "opt_02",
        campaignId: "camp_04",
        decisionType: "DISCOUNT_REMOVE",
        description: "Remove 10% discount extension from Ami Paris Brand Search ads",
        reasoning: "Ami Paris conversion rate remains strong at 1.1% without discount. Brand searches indicate high purchase intent. Removing discount will improve margin without significant conversion drop based on A/B test data.",
        previousValue: { discount: "10% OFF" },
        newValue: { discount: null },
        autoApproved: false,
        status: "APPROVED",
        approvedBy: "user_01",
        approvedAt: "2026-03-26T09:15:00.000Z",
        executedAt: "2026-03-26T09:16:00.000Z",
        impact: { marginImprovement: "+10%", conversionChange: "-2%" },
      },
      {
        id: "dec_07",
        cycleId: "opt_02",
        campaignId: null,
        decisionType: "SIGNAL_RESPONSE",
        description: "Activate rain-day creative variants for Mumbai campaigns",
        reasoning: "Weather signal: heavy rain forecast for Mumbai over the next 3 days. Historical data shows 22% increase in online luxury purchases during monsoon days. Activating indoor lifestyle creatives and free-delivery messaging.",
        previousValue: null,
        newValue: { creativeSets: ["rain_mumbai_lifestyle_v1", "rain_mumbai_delivery_v1"] },
        autoApproved: true,
        status: "EXECUTED",
        executedAt: "2026-03-26T05:31:45.000Z",
        impact: { ctrChange: "+15%" },
      },
    ],
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const status = searchParams.get("status");

  let cycles = [...mockOptimizationCycles];

  if (status) {
    cycles = cycles.filter((c) => c.status === status.toUpperCase());
  }

  return NextResponse.json({
    cycles: cycles.slice(0, limit),
    total: cycles.length,
    nextCycleScheduled: "2026-03-28T05:30:00.000Z",
    pendingDecisions: mockOptimizationCycles.flatMap((c) =>
      c.decisions.filter((d) => d.status === "PENDING")
    ).length,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newCycle = {
      id: `opt_${Date.now()}`,
      organizationId: "org_01",
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: "RUNNING",
      trigger: body.trigger || "MANUAL",
      summary: null,
      decisions: [],
      message: "Optimization cycle triggered. Analysis in progress — typically completes in 1-3 minutes.",
    };

    return NextResponse.json(newCycle, { status: 202 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
