import { Signal } from "./types";

const META_BASE = "https://graph.facebook.com/v25.0";

export async function getDaypartOptimizerSignals(): Promise<Signal[]> {
  try {
    const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
    const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
    if (!token || !accountId) return [];

    const resp = await fetch(`${META_BASE}/act_${accountId}/insights?fields=spend,actions&date_preset=last_7d&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&access_token=${token}`);
    const json = await resp.json();
    if (!json.data) return [];

    const now = new Date();
    const expires = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const signals: Signal[] = [];

    const hourly = json.data.map((h: any) => {
      const hour = parseInt(h.hourly_stats_aggregated_by_advertiser_time_zone?.split(":")[0] || "0");
      const spend = parseFloat(h.spend || "0");
      const purchases = parseInt(h.actions?.find((a: any) => a.action_type === "purchase")?.value || "0");
      const cpa = purchases > 0 ? spend / purchases : Infinity;
      return { hour, spend, purchases, cpa };
    }).filter((h: any) => h.spend > 0);

    if (hourly.length < 10) return [];

    const validHours = hourly.filter((h: any) => h.cpa < Infinity);
    if (validHours.length === 0) return [];

    const cheapest = validHours.reduce((a: any, b: any) => a.cpa < b.cpa ? a : b);
    const mostExpensive = validHours.reduce((a: any, b: any) => a.cpa > b.cpa ? a : b);
    const ratio = mostExpensive.cpa / cheapest.cpa;

    if (ratio > 2) {
      signals.push({
        id: `daypart-live-inversion-${now.toISOString().split("T")[0]}`,
        type: "regional",
        source: "daypart-optimizer",
        title: `Live Dayparting: Hour ${cheapest.hour} CPA Rs ${Math.round(cheapest.cpa)} vs Hour ${mostExpensive.hour} CPA Rs ${Math.round(mostExpensive.cpa)} (${ratio.toFixed(1)}x)`,
        description: `Live Meta data confirms hourly CPA inversion. Cheapest: ${cheapest.hour}:00 (Rs ${Math.round(cheapest.cpa)}). Most expensive: ${mostExpensive.hour}:00 (Rs ${Math.round(mostExpensive.cpa)}). ${ratio.toFixed(1)}x difference.`,
        location: "Pan India",
        severity: ratio > 3 ? "critical" : "high",
        triggersWhat: "Apply Meta ad scheduling / dayparting",
        targetArchetypes: ["All"],
        suggestedBrands: ["All brands"],
        suggestedAction: `Increase bids +${Math.round((ratio - 1) * 50)}% during hour ${cheapest.hour}. Decrease bids -${Math.round((1 - 1/ratio) * 100)}% during hour ${mostExpensive.hour}. ${ratio.toFixed(1)}x CPA difference = significant savings.`,
        confidence: 0.92,
        expiresAt: expires,
        data: { cheapest, mostExpensive, ratio, allHours: hourly, source: "live_meta_api_hourly" },
        detectedAt: now,
      });
    }

    return signals;
  } catch (e) {
    console.error("[daypart-optimizer] Error:", e);
    return [];
  }
}
