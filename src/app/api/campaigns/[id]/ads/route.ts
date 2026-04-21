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
    const fields = "id,name,status,creative{id,title,body,call_to_action_type,image_url,thumbnail_url}";
    const url = `${META_API}/${campaignId}/ads?fields=${encodeURIComponent(fields)}&limit=50&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.error_user_msg || data.error.message },
        { status: 400 }
      );
    }

    const ads = (data.data || []).map((ad: any) => ({
      id: ad.id,
      name: ad.name,
      status: ad.status,
      creative: ad.creative
        ? {
            id: ad.creative.id,
            title: ad.creative.title || "",
            body: ad.creative.body || "",
            callToAction: ad.creative.call_to_action_type || "",
            imageUrl: ad.creative.image_url || "",
            thumbnailUrl: ad.creative.thumbnail_url || "",
          }
        : null,
    }));

    return NextResponse.json({ ads });
  } catch (err: any) {
    console.error("[Ads GET] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
