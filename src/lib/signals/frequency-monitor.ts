import { Signal } from "./types";

const META_BASE = "https://graph.facebook.com/v25.0";

export async function getfrequencymonitorSignals(): Promise<Signal[]> {
  try {
    const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
    const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
    if (!token || !accountId) return [];

    const resp = await fetch(`${META_BASE}/act_${accountId}/insights?fields=campaign_name,campaign_id,spend,actions,purchase_roas,frequency&level=campaign&date_preset=last_7d&limit=30&sort=spend_descending&access_token=${token}`);
    const json = await resp.json();
    if (!json.data) return [];

    const now = new Date();
    const expires = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const signals: Signal[] = [];

    for (const campaign of json.data) {
      const freq = parseFloat(campaign.frequency || "0");
      const spend = parseFloat(campaign.spend || "0");
      const name = campaign.campaign_name || "Unknown";
      const roas = campaign.purchase_roas?.[0]?.value ? parseFloat(campaign.purchase_roas[0].value) : 0;

      if (freq > 8 && spend > 5000) {
        const isProspecting = name.toLowerCase().includes("interest") || name.toLowerCase().includes("prospecting") || name.toLowerCase().includes("lal");
        const threshold = isProspecting ? 10 : 25;

        if (freq > threshold) {
          signals.push({
            id: `freq-monitor-${campaign.campaign_id}`,
            type: "economic",
            source: "frequency-monitor",
            title: `Frequency Alert: "${name}" at ${freq.toFixed(1)}x${freq > 30 ? " — EXTREME FATIGUE" : ""}`,
            description: `Campaign "${name}" has frequency ${freq.toFixed(1)}x (${isProspecting ? "prospecting" : "remarketing"} threshold: ${threshold}x). ROAS: ${roas.toFixed(2)}x. Spend: Rs ${Math.round(spend).toLocaleString()}. ${freq > 25 ? "Users seeing this ad 25+ times — creative refresh urgently needed." : "Consider audience expansion or creative rotation."}`,
            location: "Pan India",
            severity: freq > 30 ? "critical" : freq > 15 ? "high" : "medium",
            triggersWhat: "Refresh creatives or expand audience",
            targetArchetypes: ["All"],
            suggestedBrands: ["All brands"],
            suggestedAction: `Campaign frequency ${freq.toFixed(1)}x exceeds ${threshold}x threshold. Options: (1) Add new creative variants, (2) Expand audience targeting, (3) Reduce daily budget. Historical: ios_allpurc reached 38.85x with declining ROAS.`,
            confidence: 0.93,
            expiresAt: expires,
            data: { campaignName: name, campaignId: campaign.campaign_id, frequency: freq, roas, spend, isProspecting, threshold, source: "live_meta_api" },
            detectedAt: now,
          });
        }
      }
    }

    return signals;
  } catch (e) {
    console.error("[frequency-monitor] Error:", e);
    return [];
  }
}
