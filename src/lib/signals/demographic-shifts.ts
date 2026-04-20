import { Signal } from "./types";

const META_BASE = "https://graph.facebook.com/v25.0";

export async function getdemographicshiftsSignals(): Promise<Signal[]> {
  try {
    const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
    const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
    if (!token || !accountId) return [];

    const resp = await fetch(`${META_BASE}/act_${accountId}/insights?fields=spend,impressions,clicks,actions,purchase_roas,cost_per_action_type&date_preset=last_7d&breakdowns=age,gender&access_token=${token}`);
    const json = await resp.json();
    if (!json.data) return [];

    const now = new Date();
    const expires = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const signals: Signal[] = [];

    const segments = json.data.map((d: any) => ({
      age: d.age, gender: d.gender,
      spend: parseFloat(d.spend || "0"),
      roas: d.purchase_roas?.[0]?.value ? parseFloat(d.purchase_roas[0].value) : 0,
      purchases: parseInt(d.actions?.find((a: any) => a.action_type === "purchase")?.value || "0"),
      cpa: 0,
    })).map((s: any) => ({ ...s, cpa: s.purchases > 0 ? s.spend / s.purchases : Infinity }));

    const totalSpend = segments.reduce((s: number, d: any) => s + d.spend, 0);
    if (totalSpend === 0) return [];

    // Find best and worst performing segments
    const withPurchases = segments.filter((s: any) => s.purchases > 5 && s.roas > 0);
    if (withPurchases.length < 2) return [];

    const best = withPurchases.reduce((a: any, b: any) => a.roas > b.roas ? a : b);
    const worst = withPurchases.reduce((a: any, b: any) => a.roas < b.roas ? a : b);

    if (best.roas / worst.roas > 2) {
      signals.push({
        id: `demo-shift-best-${best.gender}-${best.age}`,
        type: "regional",
        source: "demographic-shifts",
        title: `Best Segment: ${best.gender} ${best.age} — ${best.roas.toFixed(1)}x ROAS, CPA Rs ${Math.round(best.cpa)}`,
        description: `${best.gender} ${best.age} delivers ${best.roas.toFixed(1)}x ROAS with CPA Rs ${Math.round(best.cpa)} (${best.purchases} purchases). ${(best.roas / worst.roas).toFixed(1)}x better than worst segment (${worst.gender} ${worst.age} at ${worst.roas.toFixed(1)}x).`,
        location: "Pan India",
        severity: best.roas > 10 ? "critical" : "high",
        triggersWhat: `Scale ${best.gender} ${best.age} targeting`,
        targetArchetypes: ["All"],
        suggestedBrands: ["All brands"],
        suggestedAction: `Increase bid adjustments for ${best.gender} ${best.age} (+${Math.round((best.roas / worst.roas - 1) * 50)}%). Consider dedicated campaigns for this segment.`,
        confidence: 0.90,
        expiresAt: expires,
        data: { best, worst, ratio: best.roas / worst.roas, allSegments: segments, source: "live_meta_api_age_gender" },
        detectedAt: now,
      });
    }

    // Gender split signal
    const maleTotal = segments.filter((s: any) => s.gender === "male").reduce((acc: any, s: any) => ({ spend: acc.spend + s.spend, purchases: acc.purchases + s.purchases }), { spend: 0, purchases: 0 });
    const femaleTotal = segments.filter((s: any) => s.gender === "female").reduce((acc: any, s: any) => ({ spend: acc.spend + s.spend, purchases: acc.purchases + s.purchases }), { spend: 0, purchases: 0 });

    if (maleTotal.purchases > 0 && femaleTotal.purchases > 0) {
      const maleCpa = maleTotal.spend / maleTotal.purchases;
      const femaleCpa = femaleTotal.spend / femaleTotal.purchases;
      const maleSpendPct = (maleTotal.spend / totalSpend * 100).toFixed(0);
      const femaleSpendPct = (femaleTotal.spend / totalSpend * 100).toFixed(0);

      signals.push({
        id: `demo-shift-gender-split`,
        type: "regional",
        source: "demographic-shifts",
        title: `Gender Split: Male CPA Rs ${Math.round(maleCpa)} (${maleSpendPct}% spend) vs Female CPA Rs ${Math.round(femaleCpa)} (${femaleSpendPct}% spend)`,
        description: `Male: ${maleTotal.purchases} purchases at CPA Rs ${Math.round(maleCpa)} (${maleSpendPct}% of budget). Female: ${femaleTotal.purchases} purchases at CPA Rs ${Math.round(femaleCpa)} (${femaleSpendPct}% of budget). On Meta, males historically deliver 62% better ROAS.`,
        location: "Pan India",
        severity: "medium",
        triggersWhat: "Review gender budget allocation",
        targetArchetypes: ["All"],
        suggestedBrands: ["All brands"],
        suggestedAction: `Cross-platform insight: Males perform better on Meta (62% better ROAS), Females perform better on Google (2x conv rate). Route accordingly.`,
        confidence: 0.88,
        expiresAt: expires,
        data: { male: { ...maleTotal, cpa: maleCpa }, female: { ...femaleTotal, cpa: femaleCpa }, source: "live_meta_api" },
        detectedAt: now,
      });
    }

    return signals;
  } catch (e) {
    console.error("[demographic-shifts] Error:", e);
    return [];
  }
}
