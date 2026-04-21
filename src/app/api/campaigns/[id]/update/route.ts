import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const META_API = "https://graph.facebook.com/v25.0";
const CACHE_KEY_PREFIX = "campaigns:live:meta";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "AJIO_LUXE_META_ACCESS_TOKEN not set" }, { status: 500 });
  }

  try {
    const { name, status, dailyBudget, spendCap, bidStrategy, startTime, stopTime } = await request.json();

    const updateParams = new URLSearchParams();
    updateParams.append("access_token", token);
    if (name) updateParams.append("name", name);
    if (status) updateParams.append("status", status);
    if (dailyBudget !== undefined && dailyBudget !== null) {
      updateParams.append("daily_budget", String(Math.round(dailyBudget * 100)));
    }
    if (spendCap !== undefined && spendCap !== null && spendCap !== "") {
      const capValue = Math.round(Number(spendCap) * 100);
      if (capValue > 0) {
        updateParams.append("spend_cap", String(capValue));
      }
    }
    if (bidStrategy) updateParams.append("bid_strategy", bidStrategy);
    if (startTime) updateParams.append("start_time", startTime);
    if (stopTime) updateParams.append("stop_time", stopTime);

    const res = await fetch(`${META_API}/${campaignId}`, {
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

    // Clear all campaign cache keys so next load reflects updates
    try {
      const keys = await redis.keys(`${CACHE_KEY_PREFIX}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (e) {
      console.warn("[Campaign Update] Failed to clear Redis cache:", e);
    }

    return NextResponse.json({ success: true, campaignId });
  } catch (err: any) {
    console.error("[Campaign Update] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
