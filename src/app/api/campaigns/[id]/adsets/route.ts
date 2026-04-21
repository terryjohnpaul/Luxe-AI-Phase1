import { NextResponse } from "next/server";

const META_API = "https://graph.facebook.com/v25.0";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "AJIO_LUXE_META_ACCESS_TOKEN not set" }, { status: 500 });
  }

  try {
    const fields = [
      "id", "name", "status", "daily_budget", "lifetime_budget",
      "optimization_goal", "billing_event", "bid_strategy", "bid_amount",
      "targeting", "start_time", "end_time", "promoted_object", "pacing_type",
    ].join(",");

    const url = `${META_API}/${campaignId}/adsets?fields=${fields}&limit=50&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.error_user_msg || data.error.message },
        { status: 400 }
      );
    }

    const adsets = (data.data || []).map((as: any) => ({
      id: as.id,
      name: as.name,
      status: as.status,
      dailyBudget: as.daily_budget ? Number(as.daily_budget) / 100 : null,
      lifetimeBudget: as.lifetime_budget ? Number(as.lifetime_budget) / 100 : null,
      optimizationGoal: as.optimization_goal || "",
      billingEvent: as.billing_event || "",
      bidStrategy: as.bid_strategy || "",
      bidAmount: as.bid_amount ? Number(as.bid_amount) / 100 : null,
      targeting: as.targeting || {},
      startTime: as.start_time || "",
      endTime: as.end_time || "",
      promotedObject: as.promoted_object || null,
      pacingType: as.pacing_type || [],
    }));

    return NextResponse.json({ adsets });
  } catch (err: any) {
    console.error("[AdSets GET] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
