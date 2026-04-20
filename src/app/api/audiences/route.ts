import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-cache";

const META_BASE = "https://graph.facebook.com/v25.0";

async function fetchRealAudiences() {
  const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
  const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
  if (!token || !accountId) return [];

  try {
    const fields = "id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,data_source,delivery_status,time_updated";
    let url: string | null = `${META_BASE}/act_${accountId}/customaudiences?fields=${fields}&limit=200&access_token=${token}`;
    const allAudiences: any[] = [];

    while (url && allAudiences.length < 500) {
      const resp: Response = await fetch(url);
      const json = await resp.json();
      if (json.data) allAudiences.push(...json.data);
      url = json.paging?.next || null;
    }

    return allAudiences.map((a: any) => ({
      id: a.id,
      name: a.name,
      subtype: a.subtype,
      sizeLower: a.approximate_count_lower_bound || 0,
      sizeUpper: a.approximate_count_upper_bound || 0,
      dataSource: a.data_source?.type || "unknown",
      deliveryStatus: a.delivery_status?.status || "unknown",
      lastUpdated: a.time_updated,
    }));
  } catch (e) {
    console.error("[audiences] API error:", e);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "true";

  const { data: audiences, fetchedAt, fromCache } = await cachedFetch(
    "meta-audiences",
    fetchRealAudiences,
    refresh
  );

  const categorized = {
    crm: audiences.filter((a: any) => a.subtype === "CUSTOM" || a.dataSource === "FILE_IMPORTED"),
    lookalike: audiences.filter((a: any) => a.subtype === "LOOKALIKE"),
    app: audiences.filter((a: any) => a.subtype === "APP" || a.dataSource === "APP"),
    website: audiences.filter((a: any) => a.subtype === "WEBSITE"),
    engagement: audiences.filter((a: any) => a.subtype === "ENGAGEMENT" || a.subtype === "IG_BUSINESS"),
    other: audiences.filter((a: any) => !["CUSTOM", "LOOKALIKE", "APP", "WEBSITE", "ENGAGEMENT", "IG_BUSINESS"].includes(a.subtype) && a.dataSource !== "FILE_IMPORTED" && a.dataSource !== "APP"),
  };

  return NextResponse.json({
    total: audiences.length,
    categorized,
    audiences,
    source: fromCache ? "cache" : "live_meta_api",
    fetchedAt,
  });
}
