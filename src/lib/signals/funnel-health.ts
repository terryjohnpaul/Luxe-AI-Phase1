import { Signal } from "./types";

const META_BASE = "https://graph.facebook.com/v25.0";

export async function getfunnelhealthSignals(): Promise<Signal[]> {
  try {
    const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
    const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
    if (!token || !accountId) return [];

    const resp = await fetch(`${META_BASE}/act_${accountId}/insights?fields=spend,impressions,clicks,actions&date_preset=last_7d&access_token=${token}`);
    const json = await resp.json();
    const d = json.data?.[0];
    if (!d) return [];

    const now = new Date();
    const expires = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const signals: Signal[] = [];

    const getAction = (type: string) => parseInt(d.actions?.find((a: any) => a.action_type === type)?.value || "0");
    const clicks = parseInt(d.clicks || "0");
    const lpv = getAction("landing_page_view");
    const vc = getAction("view_content");
    const atc = getAction("add_to_cart");
    const ic = getAction("initiate_checkout");
    const purchase = getAction("purchase");

    if (clicks > 0 && lpv > 0) {
      const lpvRate = lpv / clicks;
      if (lpvRate < 0.4) {
        signals.push({
          id: "funnel-live-lpv-drop",
          type: "category_demand",
          source: "funnel-health",
          title: `Live Funnel: ${Math.round((1 - lpvRate) * 100)}% Click-to-LPV Drop`,
          description: `${clicks.toLocaleString()} clicks but only ${lpv.toLocaleString()} landing page views (${(lpvRate * 100).toFixed(1)}% rate). ${Math.round((1 - lpvRate) * 100)}% of paid clicks are wasted before page loads. Baseline: 32.7%.`,
          location: "Pan India", severity: lpvRate < 0.25 ? "critical" : "high",
          triggersWhat: "Fix landing page load speed",
          targetArchetypes: ["All"], suggestedBrands: ["All brands"],
          suggestedAction: `Page load issue: ${Math.round((1 - lpvRate) * 100)}% drop. Target <3s load time. Every 1% improvement = ${Math.round(clicks * 0.01)} additional landing page views.`,
          confidence: 0.95, expiresAt: expires,
          data: { clicks, lpv, lpvRate, baseline: 0.327, source: "live_meta_api" },
          detectedAt: now,
        });
      }
    }

    if (atc > 0 && purchase > 0) {
      const atcToPurchase = purchase / atc;
      const abandonment = 1 - atcToPurchase;
      signals.push({
        id: "funnel-live-cart-abandonment",
        type: "category_demand",
        source: "funnel-health",
        title: `Live Cart Abandonment: ${Math.round(abandonment * 100)}% (${atc.toLocaleString()} ATC → ${purchase.toLocaleString()} purchases)`,
        description: `${atc.toLocaleString()} add-to-carts, ${purchase.toLocaleString()} purchases. ${Math.round(abandonment * 100)}% abandonment rate (baseline: 93%). ATC remarketing delivers 25.71x ROAS — the highest ROAS campaign type.`,
        location: "Pan India", severity: abandonment > 0.95 ? "critical" : "high",
        triggersWhat: "Scale ATC remarketing campaigns",
        targetArchetypes: ["Aspirants", "Occasional Splurgers"], suggestedBrands: ["All brands"],
        suggestedAction: `${(atc - purchase).toLocaleString()} abandoned carts this week. Run ATC remarketing with 7-day window. Expected ROAS: 25.71x.`,
        confidence: 0.95, expiresAt: expires,
        data: { atc, purchase, abandonment, baseline: 0.93, atcRemarketingRoas: 25.71, source: "live_meta_api" },
        detectedAt: now,
      });
    }

    if (ic > 0 && purchase > 0) {
      const icToPurchase = purchase / ic;
      signals.push({
        id: "funnel-live-checkout-health",
        type: "category_demand",
        source: "funnel-health",
        title: `Checkout Health: ${(icToPurchase * 100).toFixed(1)}% completion (baseline 93.7%)`,
        description: `${ic.toLocaleString()} initiated checkout, ${purchase.toLocaleString()} completed (${(icToPurchase * 100).toFixed(1)}%). ${icToPurchase > 0.9 ? "Checkout flow is healthy." : "Below 93.7% baseline — investigate payment/UX friction."}`,
        location: "Pan India", severity: icToPurchase < 0.85 ? "high" : "low",
        triggersWhat: icToPurchase < 0.9 ? "Investigate checkout friction" : "Checkout is healthy",
        targetArchetypes: ["All"], suggestedBrands: ["All brands"],
        suggestedAction: icToPurchase < 0.9 ? "Checkout completion below baseline. Check: payment gateway errors, UX friction, pricing surprises." : "Checkout completion is healthy at baseline. Focus optimization upstream (ATC stage).",
        confidence: 0.93, expiresAt: expires,
        data: { ic, purchase, icToPurchase, baseline: 0.937, source: "live_meta_api" },
        detectedAt: now,
      });
    }

    return signals;
  } catch (e) {
    console.error("[funnel-health] Error:", e);
    return [];
  }
}
