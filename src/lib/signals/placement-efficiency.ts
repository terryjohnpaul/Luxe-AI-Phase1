import { Signal } from "./types";

const META_BASE = "https://graph.facebook.com/v25.0";

export async function getPlacementEfficiencySignals(): Promise<Signal[]> {
  try {
    const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
    const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
    if (!token || !accountId) return [];

    const resp = await fetch(`${META_BASE}/act_${accountId}/insights?fields=spend,impressions,clicks,actions,purchase_roas&date_preset=last_7d&breakdowns=publisher_platform,platform_position&access_token=${token}`);
    const json = await resp.json();
    if (!json.data) return [];

    const now = new Date();
    const expires = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const signals: Signal[] = [];

    const placements = json.data.map((p: any) => ({
      platform: p.publisher_platform,
      position: p.platform_position,
      spend: parseFloat(p.spend || "0"),
      roas: p.purchase_roas?.[0]?.value ? parseFloat(p.purchase_roas[0].value) : 0,
      purchases: p.actions?.find((a: any) => a.action_type === "purchase")?.value || 0,
    }));

    const totalSpend = placements.reduce((s: number, p: any) => s + p.spend, 0);
    if (totalSpend === 0) return [];

    for (const p of placements) {
      const spendPct = (p.spend / totalSpend) * 100;
      if (spendPct > 15 && p.roas < 4 && p.roas > 0) {
        signals.push({
          id: `placement-waste-${p.platform}-${p.position}`,
          type: "economic",
          source: "placement-efficiency",
          title: `Placement Waste: ${p.platform} ${p.position} — ${spendPct.toFixed(0)}% spend, ${p.roas.toFixed(1)}x ROAS`,
          description: `${p.platform} ${p.position} consumes ${spendPct.toFixed(0)}% of budget (Rs ${Math.round(p.spend).toLocaleString()}) but delivers only ${p.roas.toFixed(2)}x ROAS. Consider reallocating.`,
          location: "Pan India", severity: spendPct > 40 ? "critical" : "high",
          triggersWhat: `Reduce ${p.platform} ${p.position} budget`,
          targetArchetypes: ["All"], suggestedBrands: ["All brands"],
          suggestedAction: `Shift budget from ${p.platform} ${p.position} (${p.roas.toFixed(1)}x ROAS) to higher-performing placements.`,
          confidence: 0.90, expiresAt: expires,
          data: { ...p, spendPct, totalSpend, source: "live_meta_api" },
          detectedAt: now,
        });
      }
      if (spendPct < 10 && p.roas > 7) {
        signals.push({
          id: `placement-opportunity-${p.platform}-${p.position}`,
          type: "economic",
          source: "placement-efficiency",
          title: `Placement Opportunity: ${p.platform} ${p.position} — ${p.roas.toFixed(1)}x ROAS on ${spendPct.toFixed(0)}% budget`,
          description: `${p.platform} ${p.position} delivers ${p.roas.toFixed(1)}x ROAS but only receives ${spendPct.toFixed(1)}% of budget. Scale opportunity.`,
          location: "Pan India", severity: "high",
          triggersWhat: `Scale ${p.platform} ${p.position}`,
          targetArchetypes: ["All"], suggestedBrands: ["All brands"],
          suggestedAction: `Increase ${p.platform} ${p.position} budget. Currently ${spendPct.toFixed(1)}% of spend at ${p.roas.toFixed(1)}x ROAS — underfunded high performer.`,
          confidence: 0.88, expiresAt: expires,
          data: { ...p, spendPct, source: "live_meta_api" },
          detectedAt: now,
        });
      }
    }
    return signals;
  } catch (e) {
    console.error("[placement-efficiency] Error:", e);
    return [];
  }
}
