/**
 * Platform & Placement Rules
 * Placement efficiency rules encoded from actual ROAS and CPA data.
 * Identifies budget misallocation across Meta placements and devices.
 */

import { Signal, signalId, expiresIn } from "./types";

// ── Meta placement ROAS data ─────────────────────────────────────────

const META_PLACEMENT_ROAS: Record<string, { roas: number; budget_share: number; label: string }> = {
  ig_reels:   { roas: 7.45,  budget_share: 0.27,  label: "Instagram Reels" },
  ig_explore: { roas: 34.7,  budget_share: 0.01,  label: "Instagram Explore" },
  fb_feed:    { roas: 12.25, budget_share: 0.068, label: "Facebook Feed" },
  ig_stories: { roas: 3.47,  budget_share: 0.51,  label: "Instagram Stories" },
  ig_feed:    { roas: 17.6,  budget_share: 0.08,  label: "Instagram Feed" },
  fb_reels:   { roas: 11.38, budget_share: 0.05,  label: "Facebook Reels" },
};

// ── Device efficiency data ───────────────────────────────────────────

const DEVICE_EFFICIENCY: Record<string, { roas: number; cpa?: number; spend_share?: number; label: string }> = {
  android:    { roas: 9.52,  label: "Android" },
  iphone:     { roas: 3.60,  spend_share: 0.35, label: "iPhone" },
  mobile_web: { roas: 23.65, cpa: 199, label: "Mobile Web" },
  desktop:    { roas: 24.29, label: "Desktop" },
};

export async function getPlatformPlacementRulesSignals(): Promise<Signal[]> {
  try {
    const now = new Date();
    const signals: Signal[] = [];

    // ── 1. Reels underfunded ─────────────────────────────────────────
    signals.push({
      id: signalId("placement-rules", "reels-underfunded"),
      type: "category_demand",
      source: "Meta Placement Analysis",
      title: "Reels Underfunded (7.45x on 27% budget)",
      description: `Instagram Reels delivers 7.45x ROAS but only gets 27% of budget. Meanwhile Stories gets 51% budget with only 3.47x ROAS. Shift budget from Stories to Reels immediately.`,
      location: "Pan India",
      severity: "critical",
      confidence: 0.94,
      triggersWhat: "Budget reallocation from Stories to Reels",
      targetArchetypes: ["Fashion Loyalist", "Aspiring Premium", "Gen Z Luxury"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Shift at least 15% of Stories budget to Reels. Target 40%+ Reels budget allocation. Create Reels-native 10-11s video content.",
      data: {
        reels_roas: META_PLACEMENT_ROAS.ig_reels.roas,
        reels_budget_share: META_PLACEMENT_ROAS.ig_reels.budget_share,
        stories_roas: META_PLACEMENT_ROAS.ig_stories.roas,
        stories_budget_share: META_PLACEMENT_ROAS.ig_stories.budget_share,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 2. Stories overfunded ─────────────────────────────────────────
    signals.push({
      id: signalId("placement-rules", "stories-overfunded"),
      type: "category_demand",
      source: "Meta Placement Analysis",
      title: "Stories Overfunded (3.47x on 51%)",
      description: `Instagram Stories receives 51% of total Meta budget but delivers the worst ROAS at 3.47x. This is the single biggest budget misallocation in the account.`,
      location: "Pan India",
      severity: "critical",
      confidence: 0.95,
      triggersWhat: "Reduce Stories budget allocation urgently",
      targetArchetypes: ["All segments"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Cap Stories at 25% of Meta budget maximum. Redirect to Reels (7.45x), IG Feed (17.6x), and Facebook Feed (12.25x).",
      data: {
        stories_roas: META_PLACEMENT_ROAS.ig_stories.roas,
        stories_budget_share: META_PLACEMENT_ROAS.ig_stories.budget_share,
        worst_placement: true,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 3. Facebook underfunded ──────────────────────────────────────
    signals.push({
      id: signalId("placement-rules", "facebook-underfunded"),
      type: "category_demand",
      source: "Meta Placement Analysis",
      title: "Facebook Underfunded (12.25x on 6.8%)",
      description: `Facebook Feed delivers 12.25x ROAS — 2.4x better than Instagram average — but receives only 6.8% of budget. Facebook users are older, higher-income luxury buyers.`,
      location: "Pan India",
      severity: "high",
      confidence: 0.91,
      triggersWhat: "Increase Facebook Feed budget allocation",
      targetArchetypes: ["Luxury Connoisseur", "Fashion Loyalist"],
      suggestedBrands: ["Hugo Boss", "Coach", "Jimmy Choo", "Versace"],
      suggestedAction: "Increase Facebook Feed to 15-20% of Meta budget. Facebook audience skews older and wealthier — perfect for luxury. Create FB-native content.",
      data: {
        fb_feed_roas: META_PLACEMENT_ROAS.fb_feed.roas,
        fb_feed_budget_share: META_PLACEMENT_ROAS.fb_feed.budget_share,
        vs_ig_average: 2.4,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 4. IG Explore hidden gem ─────────────────────────────────────
    signals.push({
      id: signalId("placement-rules", "ig-explore-hidden-gem"),
      type: "category_demand",
      source: "Meta Placement Analysis",
      title: "IG Explore: 34.7x ROAS (Hidden Gem)",
      description: `Instagram Explore delivers a staggering 34.7x ROAS but gets less than 1% of budget. This is a discovery-driven placement perfect for luxury browsing behavior.`,
      location: "Pan India",
      severity: "high",
      confidence: 0.85,
      triggersWhat: "Test increased Explore budget allocation",
      targetArchetypes: ["Aspiring Premium", "Gen Z Luxury"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Increase Explore budget to 5-8% to test scalability. Create visually stunning content optimized for Explore's discovery context.",
      data: {
        explore_roas: META_PLACEMENT_ROAS.ig_explore.roas,
        explore_budget_share: META_PLACEMENT_ROAS.ig_explore.budget_share,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 5. IG Feed efficiency ────────────────────────────────────────
    signals.push({
      id: signalId("placement-rules", "ig-feed-efficient"),
      type: "category_demand",
      source: "Meta Placement Analysis",
      title: "IG Feed: 17.6x ROAS (Underutilized)",
      description: `Instagram Feed delivers 17.6x ROAS with only 8% budget share. This is the second most efficient placement after Explore.`,
      location: "Pan India",
      severity: "medium",
      confidence: 0.89,
      triggersWhat: "Maintain and grow IG Feed allocation",
      targetArchetypes: ["Fashion Loyalist", "Aspiring Premium"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Increase IG Feed to 12-15% of budget. Use carousel and single-image formats optimized for feed browsing.",
      data: {
        ig_feed_roas: META_PLACEMENT_ROAS.ig_feed.roas,
        ig_feed_budget_share: META_PLACEMENT_ROAS.ig_feed.budget_share,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 6. FB Reels opportunity ──────────────────────────────────────
    signals.push({
      id: signalId("placement-rules", "fb-reels-opportunity"),
      type: "category_demand",
      source: "Meta Placement Analysis",
      title: "FB Reels: 11.38x ROAS (Growing Placement)",
      description: `Facebook Reels delivers 11.38x ROAS with only 5% budget. Combined with FB Feed's 12.25x, Facebook as a platform is massively underinvested.`,
      location: "Pan India",
      severity: "medium",
      confidence: 0.86,
      triggersWhat: "Test Facebook Reels at higher budget",
      targetArchetypes: ["Fashion Loyalist", "Luxury Connoisseur"],
      suggestedBrands: ["Hugo Boss", "Coach", "Michael Kors"],
      suggestedAction: "Allocate 5-8% budget to FB Reels. Repurpose best-performing IG Reels content for FB. Older audience = higher AOV potential.",
      data: {
        fb_reels_roas: META_PLACEMENT_ROAS.fb_reels.roas,
        fb_reels_budget_share: META_PLACEMENT_ROAS.fb_reels.budget_share,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 7. Android vs iPhone efficiency ──────────────────────────────
    signals.push({
      id: signalId("placement-rules", "android-vs-iphone"),
      type: "category_demand",
      source: "Device Efficiency Analysis",
      title: "Android 2.6x More Efficient Than iPhone",
      description: `Android delivers 9.52x ROAS vs iPhone's 3.60x — 2.6x more efficient. But iPhone gets 3.5x more spend. Android luxury buyers exist and convert better.`,
      location: "Pan India",
      severity: "high",
      confidence: 0.91,
      triggersWhat: "Rebalance device targeting — increase Android allocation",
      targetArchetypes: ["Fashion Loyalist", "Aspiring Premium"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Don't assume luxury = iPhone. Shift 20-30% of iPhone budget to Android. Premium Android users (Samsung Galaxy S/Z, OnePlus) are high-value.",
      data: {
        android_roas: DEVICE_EFFICIENCY.android.roas,
        iphone_roas: DEVICE_EFFICIENCY.iphone.roas,
        efficiency_ratio: (DEVICE_EFFICIENCY.android.roas / DEVICE_EFFICIENCY.iphone.roas).toFixed(1),
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 8. Mobile web high intent ────────────────────────────────────
    signals.push({
      id: signalId("placement-rules", "mobile-web-high-intent"),
      type: "category_demand",
      source: "Device Efficiency Analysis",
      title: "Mobile Web High Intent (CPA Rs 199)",
      description: `Mobile web delivers 23.65x ROAS with CPA of just Rs 199 — 4x better than app. Mobile web users are typically searching with purchase intent, not browsing.`,
      location: "Pan India",
      severity: "high",
      confidence: 0.90,
      triggersWhat: "Increase mobile web campaign allocation",
      targetArchetypes: ["Luxury Connoisseur", "Fashion Loyalist"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Create mobile-web-specific campaigns. These users come from Google searches — high intent. Don't force app install flow; let them buy on web.",
      data: {
        mobile_web_roas: DEVICE_EFFICIENCY.mobile_web.roas,
        mobile_web_cpa: DEVICE_EFFICIENCY.mobile_web.cpa,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 9. Desktop efficiency ────────────────────────────────────────
    signals.push({
      id: signalId("placement-rules", "desktop-high-roas"),
      type: "category_demand",
      source: "Device Efficiency Analysis",
      title: "Desktop: 24.29x ROAS (Highest Device)",
      description: `Desktop delivers the highest ROAS at 24.29x. Desktop users are deliberate buyers — likely researching at work or home. Perfect for high-ticket luxury items.`,
      location: "Pan India",
      severity: "medium",
      confidence: 0.87,
      triggersWhat: "Maintain and grow desktop campaign allocation",
      targetArchetypes: ["Luxury Connoisseur"],
      suggestedBrands: ["Hugo Boss", "Versace", "Jimmy Choo"],
      suggestedAction: "Allocate 10-15% of Google budget to desktop-specific campaigns. Focus on high-ticket categories (watches, bags, suits).",
      data: {
        desktop_roas: DEVICE_EFFICIENCY.desktop.roas,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 10. Overall placement budget mismatch ────────────────────────
    signals.push({
      id: signalId("placement-rules", "placement-budget-mismatch"),
      type: "category_demand",
      source: "Meta Placement Analysis",
      title: "Placement Budget Mismatch: ROAS vs Spend Inversely Correlated",
      description: `Across all Meta placements, budget allocation is inversely correlated with ROAS. The worst performer (Stories 3.47x) gets the most budget (51%). The best (Explore 34.7x) gets the least (<1%).`,
      location: "Pan India",
      severity: "critical",
      confidence: 0.93,
      triggersWhat: "Full Meta placement budget reallocation",
      targetArchetypes: ["All segments"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Proposed allocation: Stories 20% (from 51%), Reels 35% (from 27%), IG Feed 15%, FB Feed 15%, Explore 8%, FB Reels 7%.",
      data: {
        current_allocation: Object.fromEntries(
          Object.entries(META_PLACEMENT_ROAS).map(([k, v]) => [k, { roas: v.roas, budget: v.budget_share }])
        ),
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 11. iPhone overspend alert ───────────────────────────────────
    signals.push({
      id: signalId("placement-rules", "iphone-overspend"),
      type: "category_demand",
      source: "Device Efficiency Analysis",
      title: "iPhone Overspend: 3.5x More Spend, 2.6x Worse ROAS",
      description: `iPhone receives 3.5x more ad spend than Android but delivers 2.6x worse ROAS. The luxury=iPhone assumption is costing significant budget efficiency.`,
      location: "Pan India",
      severity: "high",
      confidence: 0.90,
      triggersWhat: "Reduce iPhone bid multipliers",
      targetArchetypes: ["Fashion Loyalist", "Aspiring Premium"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Reduce iPhone bid adjustment by 30-40%. Increase Android bid adjustment by 20%. Monitor for 2 weeks and adjust.",
      data: {
        iphone_roas: DEVICE_EFFICIENCY.iphone.roas,
        iphone_spend_share: DEVICE_EFFICIENCY.iphone.spend_share,
        android_roas: DEVICE_EFFICIENCY.android.roas,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 12. Web vs App CPA comparison ────────────────────────────────
    signals.push({
      id: signalId("placement-rules", "web-vs-app-cpa"),
      type: "category_demand",
      source: "Device Efficiency Analysis",
      title: "Web CPA 4x Better Than App",
      description: `Mobile web CPA is Rs 199 — roughly 4x better than app install + purchase CPA. Stop forcing app installs for high-intent web traffic.`,
      location: "Pan India",
      severity: "high",
      confidence: 0.89,
      triggersWhat: "Stop app-install interstitials for high-intent web users",
      targetArchetypes: ["All segments"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Remove app-install interstitials from paid traffic landing pages. Let web users buy on web. Reserve app-install pushes for organic/retargeting.",
      data: {
        mobile_web_cpa: DEVICE_EFFICIENCY.mobile_web.cpa,
        mobile_web_roas: DEVICE_EFFICIENCY.mobile_web.roas,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 13. Optimal placement mix recommendation ─────────────────────
    signals.push({
      id: signalId("placement-rules", "optimal-placement-mix"),
      type: "category_demand",
      source: "Meta Placement Analysis",
      title: "Optimal Placement Mix Recommendation",
      description: `Based on ROAS data, optimal Meta budget split: IG Reels 35%, Stories 20%, IG Feed 15%, FB Feed 15%, Explore 8%, FB Reels 7%. This could improve blended ROAS by an estimated 40-60%.`,
      location: "Pan India",
      severity: "medium",
      confidence: 0.85,
      triggersWhat: "Campaign structure changes in Meta Ads Manager",
      targetArchetypes: ["All segments"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Implement placement-level budget controls in Meta Ads Manager. Move to manual placement selection instead of Advantage+ for luxury campaigns.",
      data: {
        recommended: {
          ig_reels: 0.35, ig_stories: 0.20, ig_feed: 0.15,
          fb_feed: 0.15, ig_explore: 0.08, fb_reels: 0.07,
        },
        estimated_roas_improvement: "40-60%",
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 14. Device mix recommendation ────────────────────────────────
    signals.push({
      id: signalId("placement-rules", "device-mix-recommendation"),
      type: "category_demand",
      source: "Device Efficiency Analysis",
      title: "Device Mix Recommendation: Rebalance Away From iPhone",
      description: `Recommended device budget: Android 40% (from ~10%), iPhone 30% (from ~35%), Mobile Web 20%, Desktop 10%. Expected blended ROAS improvement of 50%+.`,
      location: "Pan India",
      severity: "medium",
      confidence: 0.84,
      triggersWhat: "Device bid adjustment changes",
      targetArchetypes: ["All segments"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Set device bid adjustments: Android +30%, iPhone -25%, ensure mobile web and desktop campaigns are active and funded.",
      data: {
        recommended_device_split: {
          android: 0.40, iphone: 0.30, mobile_web: 0.20, desktop: 0.10,
        },
        current_efficiency: Object.fromEntries(
          Object.entries(DEVICE_EFFICIENCY).map(([k, v]) => [k, v.roas])
        ),
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    return signals;
  } catch (error) {
    console.error("[platform-placement-rules] Error generating signals:", error);
    return [];
  }
}
