import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-cache";

const META_BASE = "https://graph.facebook.com/v25.0";

function extractAction(actions: any[], type: string): number {
  if (!actions) return 0;
  const a = actions.find((x: any) => x.action_type === type);
  return a ? parseInt(a.value) : 0;
}

function extractActionValue(values: any[], type: string): number {
  if (!values) return 0;
  const a = values.find((x: any) => x.action_type === type || x.action_type === "omni_purchase");
  return a ? parseFloat(a.value) : 0;
}

async function fetchPerformanceData() {
  const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
  const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
  if (!token || !accountId) return null;

  try {
    const fields = "spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas,cost_per_action_type";

    const [last7dResp, last30dResp, campaignResp] = await Promise.all([
      fetch(`${META_BASE}/act_${accountId}/insights?fields=${fields}&date_preset=last_7d&access_token=${token}`),
      fetch(`${META_BASE}/act_${accountId}/insights?fields=${fields}&date_preset=last_30d&access_token=${token}`),
      fetch(`${META_BASE}/act_${accountId}/insights?fields=campaign_name,campaign_id,spend,actions,purchase_roas,frequency&level=campaign&date_preset=last_7d&limit=20&sort=spend_descending&access_token=${token}`),
    ]);

    const [last7d, last30d, campaigns] = await Promise.all([
      last7dResp.json(), last30dResp.json(), campaignResp.json(),
    ]);

    const d7 = last7d.data?.[0];
    const d30 = last30d.data?.[0];
    if (!d7 || !d30) return null;

    const parse = (d: any) => ({
      spend: parseFloat(d.spend || "0"),
      impressions: parseInt(d.impressions || "0"),
      reach: parseInt(d.reach || "0"),
      frequency: parseFloat(d.frequency || "0"),
      clicks: parseInt(d.clicks || "0"),
      ctr: parseFloat(d.ctr || "0"),
      cpc: parseFloat(d.cpc || "0"),
      cpm: parseFloat(d.cpm || "0"),
      purchases: extractAction(d.actions, "purchase"),
      revenue: extractActionValue(d.action_values, "omni_purchase"),
      roas: d.purchase_roas?.[0]?.value ? parseFloat(d.purchase_roas[0].value) : 0,
      addToCart: extractAction(d.actions, "add_to_cart"),
      landingPageViews: extractAction(d.actions, "landing_page_view"),
      viewContent: extractAction(d.actions, "view_content"),
      initiateCheckout: extractAction(d.actions, "initiate_checkout"),
      appInstalls: extractAction(d.actions, "mobile_app_install"),
    });

    const topCampaigns = (campaigns.data || []).map((c: any) => ({
      name: c.campaign_name,
      id: c.campaign_id,
      spend: parseFloat(c.spend || "0"),
      purchases: extractAction(c.actions, "purchase"),
      roas: c.purchase_roas?.[0]?.value ? parseFloat(c.purchase_roas[0].value) : 0,
      frequency: parseFloat(c.frequency || "0"),
    }));

    return {
      last7d: parse(d7),
      last30d: parse(d30),
      topCampaigns,
      funnel: {
        impressions: parseInt(d7.impressions || "0"),
        clicks: parseInt(d7.clicks || "0"),
        landingPageViews: extractAction(d7.actions, "landing_page_view"),
        viewContent: extractAction(d7.actions, "view_content"),
        addToCart: extractAction(d7.actions, "add_to_cart"),
        initiateCheckout: extractAction(d7.actions, "initiate_checkout"),
        purchases: extractAction(d7.actions, "purchase"),
      },
    };
  } catch (e) {
    console.error("[performance] API error:", e);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "true";

  const { data, fetchedAt, fromCache } = await cachedFetch(
    "meta-performance",
    fetchPerformanceData,
    refresh
  );

  if (!data) {
    return NextResponse.json({ error: "Failed to fetch performance data" }, { status: 500 });
  }

  const d7 = data.last7d;
  const cpa = d7.purchases > 0 ? Math.round(d7.spend / d7.purchases) : 0;

  return NextResponse.json({
    summary: {
      spend: d7.spend,
      revenue: d7.revenue,
      roas: d7.roas,
      purchases: d7.purchases,
      cpa,
      impressions: d7.impressions,
      reach: d7.reach,
      frequency: d7.frequency,
      ctr: d7.ctr,
    },
    comparison: {
      last7d: data.last7d,
      last30d: data.last30d,
    },
    funnel: data.funnel,
    topCampaigns: data.topCampaigns,
    source: fromCache ? "cache" : "live_meta_api",
    fetchedAt,
  });
}
