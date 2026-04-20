import { Signal } from "./types";

const META_BASE = "https://graph.facebook.com/v25.0";

export async function getgeoperformanceSignals(): Promise<Signal[]> {
  try {
    const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
    const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
    if (!token || !accountId) return [];

    const resp = await fetch(`${META_BASE}/act_${accountId}/insights?fields=spend,impressions,clicks,actions&date_preset=last_7d&breakdowns=region&limit=30&access_token=${token}`);
    const json = await resp.json();
    if (!json.data) return [];

    const now = new Date();
    const expires = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const signals: Signal[] = [];

    const regions = json.data.map((r: any) => ({
      region: r.region,
      spend: parseFloat(r.spend || "0"),
      impressions: parseInt(r.impressions || "0"),
      clicks: parseInt(r.clicks || "0"),
      cpm: parseInt(r.impressions || "0") > 0 ? parseFloat(r.spend || "0") / parseInt(r.impressions || "0") * 1000 : 0,
    })).filter((r: any) => r.spend > 1000).sort((a: any, b: any) => b.spend - a.spend);

    if (regions.length < 3) return [];

    const totalSpend = regions.reduce((s: number, r: any) => s + r.spend, 0);
    const avgCpm = regions.reduce((s: number, r: any) => s + r.cpm, 0) / regions.length;

    // Top spender
    const top = regions[0];
    signals.push({
      id: `geo-perf-top-${top.region?.replace(/\s/g, "-")}`,
      type: "regional",
      source: "geo-performance",
      title: `Top Region: ${top.region} — Rs ${Math.round(top.spend).toLocaleString()} spend (${(top.spend / totalSpend * 100).toFixed(0)}%)`,
      description: `${top.region} is the highest spend region at Rs ${Math.round(top.spend).toLocaleString()} (${(top.spend / totalSpend * 100).toFixed(0)}% of total). CPM: Rs ${top.cpm.toFixed(2)}. ${top.cpm > avgCpm * 1.5 ? "CPM is 50%+ above average — high competition." : "CPM is within normal range."}`,
      location: top.region,
      severity: "medium",
      triggersWhat: "Monitor top region efficiency",
      targetArchetypes: ["All"], suggestedBrands: ["All brands"],
      suggestedAction: `${top.region} gets ${(top.spend / totalSpend * 100).toFixed(0)}% of budget. Historical: Karnataka is most efficient (CPA index 0.33), Delhi most expensive (CPA index 1.0). Compare this region against benchmarks.`,
      confidence: 0.85, expiresAt: expires,
      data: { ...top, totalSpend, avgCpm, source: "live_meta_api_region" },
      detectedAt: now,
    });

    // Find cheap CPM regions (opportunity)
    const cheapRegions = regions.filter((r: any) => r.cpm < avgCpm * 0.7 && r.spend > 5000);
    if (cheapRegions.length > 0) {
      const cheapList = cheapRegions.slice(0, 3).map((r: any) => `${r.region} (CPM Rs ${r.cpm.toFixed(1)})`).join(", ");
      signals.push({
        id: "geo-perf-cheap-regions",
        type: "regional",
        source: "geo-performance",
        title: `Low-CPM Regions: ${cheapList}`,
        description: `These regions have CPM 30%+ below average (Rs ${avgCpm.toFixed(1)}). Lower competition = cheaper reach. Consider scaling campaigns here.`,
        location: cheapRegions.map((r: any) => r.region).join(", "),
        severity: "high",
        triggersWhat: "Scale targeting in low-CPM regions",
        targetArchetypes: ["Aspirants"], suggestedBrands: ["Coach", "Michael Kors", "Kate Spade"],
        suggestedAction: `Test Tier-2 targeting in ${cheapList}. Historical finding: Tier-2 cities are 21-31% cheaper CPA with growing luxury demand.`,
        confidence: 0.85, expiresAt: expires,
        data: { cheapRegions, avgCpm, source: "live_meta_api_region" },
        detectedAt: now,
      });
    }

    return signals;
  } catch (e) {
    console.error("[geo-performance] Error:", e);
    return [];
  }
}
