import { Signal } from "./types";

const META_BASE = "https://graph.facebook.com/v25.0";

async function fetchMetaAccountInsights(): Promise<any> {
  const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
  const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
  if (!token || !accountId) return null;

  try {
    const [last7dResp, todayResp] = await Promise.all([
      fetch(`${META_BASE}/act_${accountId}/insights?fields=spend,impressions,clicks,ctr,actions,purchase_roas,frequency,reach&date_preset=last_7d&access_token=${token}`),
      fetch(`${META_BASE}/act_${accountId}/insights?fields=spend,impressions,clicks,actions,purchase_roas,frequency&date_preset=today&access_token=${token}`),
    ]);
    const [last7d, today] = await Promise.all([last7dResp.json(), todayResp.json()]);
    return { last7d: last7d.data?.[0], today: today.data?.[0] };
  } catch { return null; }
}

export async function getMetaPerformanceSignals(): Promise<Signal[]> {
  try {
    const data = await fetchMetaAccountInsights();
    if (!data?.last7d) return [];

    const signals: Signal[] = [];
    const now = new Date();
    const expires = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const d7 = data.last7d;
    const roas7d = d7.purchase_roas?.[0]?.value ? parseFloat(d7.purchase_roas[0].value) : 0;
    const freq7d = parseFloat(d7.frequency || "0");
    const spend7d = parseFloat(d7.spend || "0");

    if (roas7d > 0 && roas7d < 4) {
      signals.push({
        id: `meta-perf-roas-low-${now.toISOString().split("T")[0]}`,
        type: "economic",
        source: "meta-performance-signals",
        title: `Meta ROAS Alert: ${roas7d.toFixed(2)}x (Last 7 Days)`,
        description: `Current Meta ROAS is ${roas7d.toFixed(2)}x. Historical average is 10.03x. ${roas7d < 5 ? "ROAS is significantly below historical average — check creative fatigue, audience saturation, or platform changes." : "Monitor closely."}`,
        location: "Pan India",
        severity: roas7d < 3 ? "critical" : roas7d < 5 ? "high" : "medium",
        triggersWhat: "Review Meta campaign efficiency",
        targetArchetypes: ["All"],
        suggestedBrands: ["All brands"],
        suggestedAction: `Current ROAS ${roas7d.toFixed(2)}x vs 10.03x historical. ${roas7d < 5 ? "Check: frequency fatigue, creative refresh needed, audience overlap. Consider pausing underperformers." : "Continue monitoring."}`,
        confidence: 0.90,
        expiresAt: expires,
        data: { roas7d, historicalRoas: 10.03, spend7d, source: "live_meta_api" },
        detectedAt: now,
      });
    }

    if (freq7d > 8) {
      signals.push({
        id: `meta-perf-frequency-high-${now.toISOString().split("T")[0]}`,
        type: "economic",
        source: "meta-performance-signals",
        title: `Frequency Alert: ${freq7d.toFixed(1)}x Account-Level (Last 7 Days)`,
        description: `Account-level frequency is ${freq7d.toFixed(1)}x. Above 8x typically causes ad fatigue and rising CPA. Some campaigns may be much higher.`,
        location: "Pan India",
        severity: freq7d > 15 ? "critical" : freq7d > 10 ? "high" : "medium",
        triggersWhat: "Check individual campaign frequency, refresh creatives",
        targetArchetypes: ["All"],
        suggestedBrands: ["All brands"],
        suggestedAction: `Account frequency ${freq7d.toFixed(1)}x. Historical finding: ios_allpurc reached 38.85x with declining ROAS. Check top spending campaigns for frequency > 10.`,
        confidence: 0.92,
        expiresAt: expires,
        data: { frequency: freq7d, threshold: 8, source: "live_meta_api" },
        detectedAt: now,
      });
    }

    if (spend7d > 0) {
      const dailyAvg = spend7d / 7;
      signals.push({
        id: `meta-perf-spend-pace-${now.toISOString().split("T")[0]}`,
        type: "economic",
        source: "meta-performance-signals",
        title: `Meta Spend Pace: Rs ${Math.round(dailyAvg).toLocaleString()}/day (Rs ${Math.round(spend7d).toLocaleString()} last 7d)`,
        description: `Current daily spend pace: Rs ${Math.round(dailyAvg).toLocaleString()}/day. Total 7-day spend: Rs ${Math.round(spend7d).toLocaleString()}. ROAS: ${roas7d.toFixed(2)}x.`,
        location: "Pan India",
        severity: "medium",
        triggersWhat: "Monitor spend efficiency",
        targetArchetypes: ["All"],
        suggestedBrands: ["All brands"],
        suggestedAction: `Spend pace Rs ${Math.round(dailyAvg).toLocaleString()}/day at ${roas7d.toFixed(2)}x ROAS. Adjust if ROAS drops below 5x.`,
        confidence: 0.95,
        expiresAt: expires,
        data: { spend7d, dailyAvg, roas7d, source: "live_meta_api" },
        detectedAt: now,
      });
    }

    return signals;
  } catch (e) {
    console.error("[meta-performance] Error:", e);
    return [];
  }
}
