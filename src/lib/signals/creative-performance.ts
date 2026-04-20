import { Signal } from "./types";

const META_BASE = "https://graph.facebook.com/v25.0";

export async function getcreativeperformanceSignals(): Promise<Signal[]> {
  try {
    const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
    const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
    if (!token || !accountId) return [];

    const resp = await fetch(`${META_BASE}/act_${accountId}/insights?fields=ad_name,ad_id,spend,impressions,clicks,ctr,frequency,actions&level=ad&date_preset=last_7d&limit=20&sort=spend_descending&access_token=${token}`);
    const json = await resp.json();
    if (!json.data) return [];

    const now = new Date();
    const expires = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const signals: Signal[] = [];

    const ads = json.data.map((a: any) => ({
      name: a.ad_name || "Unknown",
      id: a.ad_id,
      spend: parseFloat(a.spend || "0"),
      ctr: parseFloat(a.ctr || "0"),
      frequency: parseFloat(a.frequency || "0"),
      impressions: parseInt(a.impressions || "0"),
    }));

    // Check creative diversity
    const uniqueNames = new Set(ads.map((a: any) => a.name)).size;
    if (uniqueNames < ads.length * 0.5 && ads.length >= 3) {
      signals.push({
        id: "creative-perf-low-diversity",
        type: "aesthetic",
        source: "creative-performance",
        title: `Creative Diversity Alert: Only ${uniqueNames} unique ads out of ${ads.length} running`,
        description: `${ads.length} ads are running but only ${uniqueNames} have unique copy. Historical finding: all top 5 Ajio Luxe ads used identical copy template. Low diversity = faster fatigue.`,
        location: "Pan India",
        severity: uniqueNames <= 2 ? "critical" : "high",
        triggersWhat: "Create new creative variants",
        targetArchetypes: ["All"], suggestedBrands: ["All brands"],
        suggestedAction: `Only ${uniqueNames} unique ad copies. Create at least ${Math.max(5, ads.length) - uniqueNames} new variants. Test: luxury messaging (2.5x better than discount), 10-11s video (conversion sweet spot), brand landing pages (13x CTR).`,
        confidence: 0.88, expiresAt: expires,
        data: { totalAds: ads.length, uniqueNames, ads: ads.slice(0, 5), source: "live_meta_api_ad_level" },
        detectedAt: now,
      });
    }

    // Check for high-frequency ads
    const fatigued = ads.filter((a: any) => a.frequency > 10 && a.spend > 10000);
    for (const ad of fatigued.slice(0, 3)) {
      signals.push({
        id: `creative-perf-fatigue-${ad.id}`,
        type: "aesthetic",
        source: "creative-performance",
        title: `Ad Fatigue: "${ad.name.substring(0, 50)}" — Frequency ${ad.frequency.toFixed(1)}x`,
        description: `Ad "${ad.name}" shown ${ad.frequency.toFixed(1)}x per user. CTR: ${ad.ctr.toFixed(2)}%. Spend: Rs ${Math.round(ad.spend).toLocaleString()}. High frequency degrades CTR over time.`,
        location: "Pan India",
        severity: ad.frequency > 25 ? "critical" : "high",
        triggersWhat: "Replace or rotate this ad creative",
        targetArchetypes: ["All"], suggestedBrands: ["All brands"],
        suggestedAction: `Ad frequency ${ad.frequency.toFixed(1)}x. Rotate creative or expand audience. Rule: luxury messaging outperforms discount 2.5x. Best format: 10-11s video.`,
        confidence: 0.90, expiresAt: expires,
        data: { ...ad, source: "live_meta_api" },
        detectedAt: now,
      });
    }

    return signals;
  } catch (e) {
    console.error("[creative-performance] Error:", e);
    return [];
  }
}
