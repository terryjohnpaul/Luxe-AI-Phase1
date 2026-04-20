/**
 * Content Performance Truths
 * Encoded creative/messaging rules derived from Rs 144 Cr historical ad spend data.
 * These signals are always active — they encode hard truths about what works.
 */

import { Signal, signalId, expiresIn } from "./types";

// ── Hard-coded performance rules from Rs 144 Cr data ────────────────────

const CONTENT_RULES = {
  messaging: {
    luxury_cvr: 0.0076,        // 0.76% CVR for luxury messaging
    discount_cvr: 0.003,       // 0.30% CVR for discount messaging
    multiplier: 2.5,           // Luxury messaging converts 2.5x better
  },
  video: {
    sweet_spot_min_sec: 10,
    sweet_spot_max_sec: 11,
    zero_conversion_bumper_sec: 5,   // 5-6s bumper ads = zero conversion
    zero_conversion_long_sec: 20,    // 20s+ = zero conversion
  },
  landing_page: {
    brand_page_ctr_multiplier: 13,   // Brand pages 13x CTR vs product pages
  },
  cta: {
    missing_cta_pct: 0.328,          // 32.8% of creatives have NO CTA
  },
  best_copy: {
    pattern: "Indulge in timeless luxury!",
    conversions: 2_800_000,          // 2.8M+ conversions from this pattern
  },
};

const FUNNEL_BASELINES = {
  click_to_lpv: 0.327,              // 32.7% — a 67% drop from click to LPV
  vc_to_atc: 0.050,                 // 5.0% view content to add-to-cart
  atc_to_purchase: 0.0696,          // 6.96% ATC to purchase
  ic_to_purchase: 0.937,            // 93.7% initiate-checkout to purchase (healthy)
  cart_abandonment: 0.93,           // 93% cart abandonment
  app_share: 0.89,                  // 89% purchases on app
  web_share: 0.11,                  // 11% purchases on web
  web_aov_premium: 0.32,            // Web AOV is 32% higher than app
};

export async function getContentPerformanceTruthsSignals(): Promise<Signal[]> {
  try {
    const now = new Date();
    const signals: Signal[] = [];

    // ── 1. Luxury messaging superiority ──────────────────────────────
    signals.push({
      id: signalId("content-truths", "luxury-messaging-2.5x"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "Luxury Messaging 2.5x Better",
      description: `Luxury/aspirational messaging converts at ${(CONTENT_RULES.messaging.luxury_cvr * 100).toFixed(2)}% vs discount messaging at ${(CONTENT_RULES.messaging.discount_cvr * 100).toFixed(2)}%. Never lead with discounts on Ajio Luxe — lead with aspiration, exclusivity, craftsmanship.`,
      location: "Pan India",
      severity: "critical",
      confidence: 0.95,
      triggersWhat: "All luxury creatives — switch from discount to aspirational messaging",
      targetArchetypes: ["Fashion Loyalist", "Aspiring Premium", "Luxury Connoisseur"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Replace all discount-led copy with luxury-aspirational copy. Use patterns like 'Indulge in timeless luxury'. Expect 2.5x CVR improvement.",
      data: { ...CONTENT_RULES.messaging },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 2. Video sweet spot ──────────────────────────────────────────
    signals.push({
      id: signalId("content-truths", "10s-video-sweet-spot"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "10-Second Video Sweet Spot",
      description: `Video ads convert best at 10-11 seconds. Bumper ads (5-6s) and long-form (20s+) show ZERO conversions in the data. All video creatives should target the 10-11s window.`,
      location: "Pan India",
      severity: "critical",
      confidence: 0.92,
      triggersWhat: "All video ad creatives — enforce 10-11s duration",
      targetArchetypes: ["Fashion Loyalist", "Aspiring Premium"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Reject any video creative shorter than 9s or longer than 12s. The 10-11s window is the proven conversion zone.",
      data: { ...CONTENT_RULES.video },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 3. Brand landing page rule ───────────────────────────────────
    signals.push({
      id: signalId("content-truths", "brand-landing-page-13x"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "Brand Landing Page Rule",
      description: `Brand pages deliver 13x higher CTR than product pages. Always route ad traffic to brand-level landing pages, not individual product pages.`,
      location: "Pan India",
      severity: "high",
      confidence: 0.90,
      triggersWhat: "Landing page strategy for all campaigns",
      targetArchetypes: ["Fashion Loyalist", "Aspiring Premium", "Luxury Connoisseur"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Change all ad destinations from product pages to brand pages. Expected 13x CTR improvement.",
      data: { brand_page_ctr_multiplier: CONTENT_RULES.landing_page.brand_page_ctr_multiplier },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 4. CTA missing alert ─────────────────────────────────────────
    signals.push({
      id: signalId("content-truths", "cta-missing-alert"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "CTA Missing Alert",
      description: `32.8% of Ajio Luxe creatives have NO call-to-action. This is a massive conversion leak. Every creative must have a clear CTA.`,
      location: "Pan India",
      severity: "critical",
      confidence: 0.98,
      triggersWhat: "Creative audit — add CTA to all creatives missing one",
      targetArchetypes: ["Fashion Loyalist", "Aspiring Premium"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Audit all active creatives. Add CTA to the 32.8% that are missing one. Use 'Shop Now', 'Explore Collection', or 'Discover Luxury'.",
      data: { missing_cta_pct: CONTENT_RULES.cta.missing_cta_pct },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 5. Best copy pattern ─────────────────────────────────────────
    signals.push({
      id: signalId("content-truths", "best-copy-pattern"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "Best Copy Pattern: Timeless Luxury",
      description: `The copy pattern '${CONTENT_RULES.best_copy.pattern}' has driven ${(CONTENT_RULES.best_copy.conversions / 1_000_000).toFixed(1)}M+ conversions. Use this as the template for all new ad copy.`,
      location: "Pan India",
      severity: "medium",
      confidence: 0.88,
      triggersWhat: "Ad copywriting — use proven luxury copy patterns",
      targetArchetypes: ["Fashion Loyalist", "Luxury Connoisseur"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Model new ad copy on the 'Indulge in timeless luxury' pattern. Variations: 'Discover timeless elegance', 'Experience unmatched luxury'.",
      data: { ...CONTENT_RULES.best_copy },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 6. Page load / LPV drop issue ────────────────────────────────
    signals.push({
      id: signalId("content-truths", "lpv-drop-67pct"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "Page Load Issue (67% LPV Drop)",
      description: `Only 32.7% of clicks result in a landing page view — a 67.3% drop. This indicates severe page load or redirect issues. Fix this before scaling any campaign.`,
      location: "Pan India",
      severity: "critical",
      confidence: 0.96,
      triggersWhat: "Technical fix — page load speed and redirect chain audit",
      targetArchetypes: ["All segments affected"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Audit landing page load times. Check for redirect chains, heavy assets, slow server response. A 67% drop from click to LPV is unacceptable — fixing this alone could 3x efficiency.",
      data: { click_to_lpv: FUNNEL_BASELINES.click_to_lpv, drop_rate: 1 - FUNNEL_BASELINES.click_to_lpv },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 7. Checkout healthy signal ───────────────────────────────────
    signals.push({
      id: signalId("content-truths", "checkout-healthy"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "Checkout Healthy (93.7% Complete)",
      description: `Once a user initiates checkout, 93.7% complete the purchase. The checkout flow is not the problem — the funnel breaks earlier at click-to-LPV and ATC-to-IC stages.`,
      location: "Pan India",
      severity: "low",
      confidence: 0.94,
      triggersWhat: "Funnel optimization focus — upstream, not checkout",
      targetArchetypes: ["All segments"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Do NOT invest in checkout optimization. Focus budget on fixing the 67% click-to-LPV drop and 93% cart abandonment instead.",
      data: { ic_to_purchase: FUNNEL_BASELINES.ic_to_purchase },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 8. Cart abandonment alert ────────────────────────────────────
    signals.push({
      id: signalId("content-truths", "cart-abandonment-93pct"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "Cart Abandonment at 93%",
      description: `93% of users who add to cart never purchase. Deploy retargeting campaigns focused on cart abandoners with luxury messaging (not discounts).`,
      location: "Pan India",
      severity: "high",
      confidence: 0.95,
      triggersWhat: "Retargeting campaigns for cart abandoners",
      targetArchetypes: ["Fashion Loyalist", "Price-Conscious Luxury"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Set up dynamic retargeting for cart abandoners. Use aspirational messaging, not discount offers. Show the exact products they left behind.",
      data: { cart_abandonment: FUNNEL_BASELINES.cart_abandonment },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 9. App dominance signal ──────────────────────────────────────
    signals.push({
      id: signalId("content-truths", "app-dominance-89pct"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "App Dominates (89% Purchases) But Web AOV 32% Higher",
      description: `89% of purchases happen on app, but web purchases have 32% higher AOV. Consider increasing web traffic for high-ticket items while maintaining app for volume.`,
      location: "Pan India",
      severity: "medium",
      confidence: 0.91,
      triggersWhat: "Platform split strategy — web for premium, app for volume",
      targetArchetypes: ["Luxury Connoisseur", "Fashion Loyalist"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "For high-ticket items (watches, bags >50K), drive traffic to web. For volume categories, continue app-first strategy.",
      data: { app_share: FUNNEL_BASELINES.app_share, web_share: FUNNEL_BASELINES.web_share, web_aov_premium: FUNNEL_BASELINES.web_aov_premium },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 10. VC to ATC baseline ───────────────────────────────────────
    signals.push({
      id: signalId("content-truths", "vc-to-atc-5pct"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "View-to-Cart Rate: 5.0% Baseline",
      description: `Only 5% of product viewers add to cart. Improve product page persuasion — better imagery, urgency cues, social proof, and 'almost sold out' signals.`,
      location: "Pan India",
      severity: "medium",
      confidence: 0.89,
      triggersWhat: "Product page optimization",
      targetArchetypes: ["Fashion Loyalist", "Aspiring Premium"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "A/B test product page elements: hero image quality, 'X people viewing this' social proof, stock scarcity indicators.",
      data: { vc_to_atc: FUNNEL_BASELINES.vc_to_atc },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 11. ATC to purchase baseline ─────────────────────────────────
    signals.push({
      id: signalId("content-truths", "atc-to-purchase-7pct"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "Add-to-Cart to Purchase: 6.96%",
      description: `Only 6.96% of add-to-cart events result in a purchase. Combined with 93% cart abandonment, this is the biggest conversion leak after click-to-LPV.`,
      location: "Pan India",
      severity: "high",
      confidence: 0.93,
      triggersWhat: "Cart recovery and checkout flow optimization",
      targetArchetypes: ["All segments"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Implement cart recovery emails/push within 1 hour. Show 'still available' messaging with luxury positioning, not desperation.",
      data: { atc_to_purchase: FUNNEL_BASELINES.atc_to_purchase },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 12. Web AOV premium opportunity ──────────────────────────────
    signals.push({
      id: signalId("content-truths", "web-aov-premium-32pct"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "Web AOV 32% Higher Than App",
      description: `Web purchases average 32% higher order value than app purchases. Desktop/mobile-web users are higher-intent luxury buyers. Allocate premium brand budget to web placements.`,
      location: "Pan India",
      severity: "medium",
      confidence: 0.90,
      triggersWhat: "Budget allocation — increase web traffic for premium categories",
      targetArchetypes: ["Luxury Connoisseur", "Fashion Loyalist"],
      suggestedBrands: ["Versace", "Jimmy Choo", "Hugo Boss", "Coach"],
      suggestedAction: "For AOV >Rs 30,000 categories, shift 20-30% of budget to web-targeted campaigns (Google Shopping, desktop display).",
      data: { web_aov_premium: FUNNEL_BASELINES.web_aov_premium, web_share: FUNNEL_BASELINES.web_share },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 13. Funnel health summary ────────────────────────────────────
    signals.push({
      id: signalId("content-truths", "funnel-health-summary"),
      type: "category_demand",
      source: "Content Performance Analysis (Rs 144 Cr data)",
      title: "Funnel Health Summary: Fix Click-to-LPV First",
      description: `Full funnel: Click→LPV 32.7% | VC→ATC 5.0% | ATC→Purchase 6.96% | IC→Purchase 93.7%. The #1 priority is fixing the 67% click-to-LPV drop — this is the single biggest efficiency lever.`,
      location: "Pan India",
      severity: "critical",
      confidence: 0.97,
      triggersWhat: "Prioritized funnel optimization roadmap",
      targetArchetypes: ["All segments"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Priority 1: Fix click-to-LPV (page speed). Priority 2: Reduce cart abandonment (retargeting). Priority 3: Improve VC-to-ATC (product pages). Do NOT touch checkout — it works.",
      data: { ...FUNNEL_BASELINES },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    return signals;
  } catch (error) {
    console.error("[content-performance-truths] Error generating signals:", error);
    return [];
  }
}
