import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const META_API = "https://graph.facebook.com/v25.0";
const CACHE_KEY_PREFIX = "campaigns:live:meta";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: adId } = await params;
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

    const res = await fetch(`${META_API}/${adId}`, {
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
      console.warn("[Ad Update] Failed to clear Redis cache:", e);
    }

    return NextResponse.json({ success: true, adId });
  } catch (err: any) {
    console.error("[Ad Update] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
