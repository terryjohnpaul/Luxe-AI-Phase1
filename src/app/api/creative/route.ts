import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-cache";

const META_BASE = "https://graph.facebook.com/v25.0";

async function fetchCreativePerformance() {
  const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
  const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
  if (!token || !accountId) return null;

  try {
    const url = `${META_BASE}/act_${accountId}/insights?fields=ad_name,ad_id,adset_name,campaign_name,spend,impressions,clicks,ctr,actions,action_values,purchase_roas,frequency,reach&level=ad&date_preset=last_7d&limit=30&sort=spend_descending&access_token=${token}`;
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json.data) return null;

    return json.data.map((ad: any) => {
      const purchases = ad.actions?.find((a: any) => a.action_type === "purchase")?.value || "0";
      const revenue = ad.action_values?.find((a: any) => a.action_type === "omni_purchase")?.value || "0";
      return {
        adId: ad.ad_id,
        adName: ad.ad_name,
        adsetName: ad.adset_name,
        campaignName: ad.campaign_name,
        spend: parseFloat(ad.spend || "0"),
        impressions: parseInt(ad.impressions || "0"),
        clicks: parseInt(ad.clicks || "0"),
        ctr: parseFloat(ad.ctr || "0"),
        frequency: parseFloat(ad.frequency || "0"),
        reach: parseInt(ad.reach || "0"),
        purchases: parseInt(purchases),
        revenue: parseFloat(revenue),
        roas: ad.purchase_roas?.[0]?.value ? parseFloat(ad.purchase_roas[0].value) : 0,
        cpa: parseInt(purchases) > 0 ? Math.round(parseFloat(ad.spend || "0") / parseInt(purchases)) : 0,
      };
    });
  } catch (e) {
    console.error("[creative] API error:", e);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "true";

  const { data: ads, fetchedAt, fromCache } = await cachedFetch(
    "meta-creative-performance",
    fetchCreativePerformance,
    refresh
  );

  if (!ads) {
    return NextResponse.json({ error: "Failed to fetch creative data" }, { status: 500 });
  }

  const uniqueCopies = new Set(ads.map((a: any) => a.adName)).size;
  const totalAds = ads.length;
  const avgFrequency = ads.reduce((s: number, a: any) => s + a.frequency, 0) / Math.max(totalAds, 1);

  const fatigueAlerts = ads
    .filter((a: any) => a.frequency > 10 && a.spend > 10000)
    .map((a: any) => ({
      adName: a.adName,
      frequency: a.frequency,
      ctr: a.ctr,
      alert: a.frequency > 25 ? "CRITICAL — extreme fatigue" : "HIGH — fatigue risk",
    }));

  return NextResponse.json({
    ads,
    summary: {
      totalAds,
      uniqueCopies,
      copyDiversity: totalAds > 0 ? (uniqueCopies / totalAds * 100).toFixed(1) + "%" : "0%",
      avgFrequency: parseFloat(avgFrequency.toFixed(1)),
      topSpender: ads[0]?.adName || "N/A",
      topRoas: ads.reduce((best: any, a: any) => a.roas > (best?.roas || 0) ? a : best, null),
    },
    fatigueAlerts,
    insights: {
      identicalCopyWarning: uniqueCopies < totalAds * 0.5,
      highFrequencyCount: ads.filter((a: any) => a.frequency > 10).length,
      noCtaCount: 0,
    },
    source: fromCache ? "cache" : "live_meta_api",
    fetchedAt,
  });
}
