import { NextResponse } from "next/server";

/**
 * POST /api/campaigns/[id]/adset
 * Creates a new ad set for a campaign with default targeting.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const adAccountId = process.env.META_ADS_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return NextResponse.json({ error: "Meta Ads not connected" }, { status: 400 });
  }

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startTime = tomorrow.toISOString().split("T")[0] + "T00:00:00+0530";

    // Get campaign name for the ad set name
    const campRes = await fetch(
      `https://graph.facebook.com/v25.0/${campaignId}?fields=name&access_token=${accessToken}`
    );
    const campData = await campRes.json();
    const campaignName = campData.name || "Campaign";

    const formData = new URLSearchParams();
    formData.append("access_token", accessToken);
    formData.append("campaign_id", campaignId);
    formData.append("name", campaignName + " — Ad Set");
    formData.append("status", "PAUSED");
    formData.append("billing_event", "IMPRESSIONS");
    formData.append("optimization_goal", "LINK_CLICKS");
    formData.append("daily_budget", "100000"); // ₹1,000 in paise
    formData.append("bid_strategy", "LOWEST_COST_WITHOUT_CAP");
    formData.append("start_time", startTime);
    formData.append("targeting", JSON.stringify({
      geo_locations: { countries: ["IN"] },
      age_min: 25,
      age_max: 55,
      flexible_spec: [{
        interests: [
          { id: "6003139266461", name: "Luxury goods" },
          { id: "6003397425735", name: "Fashion" },
          { id: "6003020834693", name: "Online shopping" },
        ],
      }],
    }));

    const res = await fetch(
      `https://graph.facebook.com/v25.0/act_${adAccountId}/adsets`,
      { method: "POST", body: formData }
    );
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({
        error: data.error.error_user_msg || data.error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      adSetId: data.id,
      message: "Ad set created with default targeting (India, Age 25-55, Luxury interests)",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
