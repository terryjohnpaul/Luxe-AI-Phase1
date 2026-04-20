import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-cache";

const META_BASE = "https://graph.facebook.com/v25.0";

function extractAction(actions: any[], type: string): number {
  if (!actions) return 0;
  const action = actions.find((a: any) => a.action_type === type);
  return action ? parseInt(action.value) : 0;
}

async function fetchMetaInsights() {
  const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
  const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
  if (!token || !accountId) return null;

  try {
    const baseFields = "spend,impressions,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas,cost_per_action_type,frequency,reach";

    const [accountResp, placementResp, ageGenderResp, campaignResp] = await Promise.all([
      fetch(`${META_BASE}/act_${accountId}/insights?fields=${baseFields}&date_preset=last_7d&access_token=${token}`),
      fetch(`${META_BASE}/act_${accountId}/insights?fields=spend,impressions,clicks,actions,purchase_roas&date_preset=last_7d&breakdowns=publisher_platform,platform_position&access_token=${token}`),
      fetch(`${META_BASE}/act_${accountId}/insights?fields=spend,impressions,clicks,actions,purchase_roas&date_preset=last_7d&breakdowns=age,gender&access_token=${token}`),
      fetch(`${META_BASE}/act_${accountId}/insights?fields=campaign_name,campaign_id,spend,impressions,clicks,actions,purchase_roas,frequency&level=campaign&date_preset=last_7d&limit=50&access_token=${token}`),
    ]);

    const [account, placement, ageGender, campaigns] = await Promise.all([
      accountResp.json(), placementResp.json(), ageGenderResp.json(), campaignResp.json(),
    ]);

    return {
      account: account.data?.[0] || null,
      placements: placement.data || [],
      demographics: ageGender.data || [],
      campaigns: campaigns.data || [],
    };
  } catch (e) {
    console.error("[meta-insights] API error:", e);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "true";

  const { data, fetchedAt, fromCache } = await cachedFetch(
    "meta-insights-full",
    fetchMetaInsights,
    refresh
  );

  if (!data) {
    return NextResponse.json({ error: "Failed to fetch Meta insights. Check token." }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    source: fromCache ? "cache" : "live_meta_api",
    fetchedAt,
  });
}
