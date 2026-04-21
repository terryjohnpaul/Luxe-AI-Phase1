import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const META_API = "https://graph.facebook.com/v25.0";
const CACHE_KEY_PREFIX = "campaigns:live:meta";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: adsetId } = await params;
  const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "AJIO_LUXE_META_ACCESS_TOKEN not set" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const updateParams = new URLSearchParams();
    updateParams.append("access_token", token);

    if (body.name) updateParams.append("name", body.name);
    if (body.status) updateParams.append("status", body.status);

    // Budget: only one of daily or lifetime
    if (body.dailyBudget !== undefined && body.dailyBudget !== null && body.dailyBudget !== "") {
      updateParams.append("daily_budget", String(Math.round(Number(body.dailyBudget) * 100)));
    }
    if (body.lifetimeBudget !== undefined && body.lifetimeBudget !== null && body.lifetimeBudget !== "") {
      updateParams.append("lifetime_budget", String(Math.round(Number(body.lifetimeBudget) * 100)));
    }

    if (body.optimizationGoal) updateParams.append("optimization_goal", body.optimizationGoal);
    if (body.bidStrategy) updateParams.append("bid_strategy", body.bidStrategy);

    // bid_amount only for bid cap / cost cap
    if (body.bidAmount !== undefined && body.bidAmount !== null && body.bidAmount !== "" && Number(body.bidAmount) > 0) {
      updateParams.append("bid_amount", String(Math.round(Number(body.bidAmount) * 100)));
    }

    if (body.targeting) {
      updateParams.append("targeting", JSON.stringify(body.targeting));
    }

    if (body.startTime) updateParams.append("start_time", body.startTime);
    if (body.endTime) updateParams.append("end_time", body.endTime);

    const res = await fetch(`${META_API}/${adsetId}`, {
      method: "POST",
      body: updateParams,
    });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { success: false, error: data.error.error_user_msg || data.error.message },
        { status: 400 }
      );
    }

    // Clear Redis cache
    try {
      const keys = await redis.keys(`${CACHE_KEY_PREFIX}:*`);
      if (keys.length > 0) await redis.del(...keys);
    } catch (e) {
      console.warn("[AdSet Update] Failed to clear Redis cache:", e);
    }

    return NextResponse.json({ success: true, adsetId });
  } catch (err: any) {
    console.error("[AdSet Update] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
