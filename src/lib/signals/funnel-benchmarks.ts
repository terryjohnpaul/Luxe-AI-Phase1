/**
 * Funnel Benchmarks
 * Funnel stage baselines for anomaly detection and optimization guidance.
 * Generates signals by comparing known baselines to provide actionable context.
 */

import { Signal, signalId, expiresIn } from "./types";

interface FunnelStage {
  key: string;
  label: string;
  baseline_rate: number;
  warning_threshold: number;
  critical_threshold: number;
  description: string;
  fix_action: string;
}

const FUNNEL_STAGES: FunnelStage[] = [
  {
    key: "impression_to_click",
    label: "Impression to Click (CTR)",
    baseline_rate: 0.0172,
    warning_threshold: 0.012,
    critical_threshold: 0.008,
    description: "1.72% CTR baseline across Ajio Luxe campaigns",
    fix_action: "Improve ad creative quality, test new headlines, refresh imagery. Luxury ads should have aspirational not promotional tone.",
  },
  {
    key: "click_to_lpv",
    label: "Click to Landing Page View",
    baseline_rate: 0.327,
    warning_threshold: 0.25,
    critical_threshold: 0.15,
    description: "32.7% of clicks result in LPV — WARNING: 67% drop rate",
    fix_action: "URGENT: Fix page load speed, remove redirect chains, optimize server response time. This 67% drop is the biggest efficiency leak.",
  },
  {
    key: "lpv_to_vc",
    label: "LPV to View Content",
    baseline_rate: 0.65,
    warning_threshold: 0.50,
    critical_threshold: 0.35,
    description: "About 65% of landing page viewers engage with content",
    fix_action: "Improve above-the-fold content. Ensure hero image loads instantly. Show brand story and product range clearly.",
  },
  {
    key: "vc_to_atc",
    label: "View Content to Add to Cart",
    baseline_rate: 0.050,
    warning_threshold: 0.035,
    critical_threshold: 0.020,
    description: "5.0% of content viewers add to cart",
    fix_action: "Improve product page persuasion: better imagery, urgency cues, social proof, stock scarcity indicators.",
  },
  {
    key: "atc_to_ic",
    label: "Add to Cart to Initiate Checkout",
    baseline_rate: 0.076,
    warning_threshold: 0.050,
    critical_threshold: 0.030,
    description: "7.6% ATC to IC rate. NOTE: IC tracking is broken on app so data may be unreliable",
    fix_action: "Check if IC pixel is firing correctly on app. If tracking is confirmed broken, use ATC to Purchase as the metric instead.",
  },
  {
    key: "ic_to_purchase",
    label: "Initiate Checkout to Purchase",
    baseline_rate: 0.937,
    warning_threshold: 0.85,
    critical_threshold: 0.70,
    description: "93.7% completion rate — checkout flow is healthy",
    fix_action: "Checkout is working well. If this drops, check payment gateway issues, COD availability, or delivery pincode problems.",
  },
  {
    key: "atc_to_purchase",
    label: "Add to Cart to Purchase",
    baseline_rate: 0.0696,
    warning_threshold: 0.050,
    critical_threshold: 0.030,
    description: "6.96% ATC to purchase — includes all drop-offs between cart and completion",
    fix_action: "Implement cart recovery: push notifications within 1hr, email within 4hrs. Use luxury messaging not discount urgency.",
  },
  {
    key: "cart_abandonment",
    label: "Cart Abandonment Rate",
    baseline_rate: 0.93,
    warning_threshold: 0.95,
    critical_threshold: 0.97,
    description: "93% cart abandonment rate",
    fix_action: "Deploy retargeting for cart abandoners within 1-24hrs. Show the exact products left behind with aspirational messaging.",
  },
  {
    key: "view_through_share",
    label: "View-Through Purchase Share",
    baseline_rate: 0.437,
    warning_threshold: 0.30,
    critical_threshold: 0.20,
    description: "43.7% of purchases are view-through (not last-click)",
    fix_action: "View-through purchases indicate strong brand awareness effect. Maintain upper-funnel spend. Do not cut awareness campaigns based on last-click alone.",
  },
  {
    key: "app_purchase_share",
    label: "App Purchase Share",
    baseline_rate: 0.89,
    warning_threshold: 0.80,
    critical_threshold: 0.70,
    description: "89% of purchases happen on app, 11% on web",
    fix_action: "App dominance is expected. But web AOV is 32% higher — for premium categories, consider driving web traffic.",
  },
  {
    key: "web_aov_premium",
    label: "Web AOV Premium Over App",
    baseline_rate: 0.32,
    warning_threshold: 0.20,
    critical_threshold: 0.10,
    description: "Web AOV is 32% higher than app AOV",
    fix_action: "For high-ticket items (Rs 30,000+), route traffic to web. Web users have higher purchase intent and bigger baskets.",
  },
];

export async function getFunnelBenchmarkSignals(): Promise<Signal[]> {
  try {
    const now = new Date();
    const signals: Signal[] = [];

    for (const stage of FUNNEL_STAGES) {
      let severity: "critical" | "high" | "medium" | "low";
      let signalTitle: string;
      let confidence: number;

      if (stage.key === "click_to_lpv") {
        severity = "critical";
        signalTitle = "Funnel Alert: " + stage.label + " at " + (stage.baseline_rate * 100).toFixed(1) + "% (67% drop)";
        confidence = 0.96;
      } else if (stage.key === "cart_abandonment") {
        severity = "high";
        signalTitle = "Funnel Baseline: " + stage.label + " at " + (stage.baseline_rate * 100).toFixed(0) + "%";
        confidence = 0.94;
      } else if (stage.key === "ic_to_purchase") {
        severity = "low";
        signalTitle = "Funnel Healthy: " + stage.label + " at " + (stage.baseline_rate * 100).toFixed(1) + "%";
        confidence = 0.93;
      } else if (stage.key === "atc_to_ic") {
        severity = "medium";
        signalTitle = "Funnel Warning: " + stage.label + " at " + (stage.baseline_rate * 100).toFixed(1) + "% (IC tracking broken on app)";
        confidence = 0.70;
      } else if (stage.key === "view_through_share") {
        severity = "medium";
        signalTitle = "Attribution: " + (stage.baseline_rate * 100).toFixed(1) + "% View-Through Purchases";
        confidence = 0.88;
      } else {
        severity = "medium";
        signalTitle = "Funnel Baseline: " + stage.label + " at " + (stage.baseline_rate * 100).toFixed(1) + "%";
        confidence = 0.90;
      }

      signals.push({
        id: signalId("funnel-benchmarks", stage.key),
        type: "category_demand",
        source: "Funnel Benchmark Analysis (Rs 144 Cr data)",
        title: signalTitle,
        description: stage.description + ". Action: " + stage.fix_action,
        location: "Pan India",
        severity,
        confidence,
        triggersWhat: stage.fix_action.split(".")[0],
        targetArchetypes: ["All segments"],
        suggestedBrands: ["All brands on Ajio Luxe"],
        suggestedAction: stage.fix_action,
        data: {
          stage: stage.key,
          baseline_rate: stage.baseline_rate,
          warning_threshold: stage.warning_threshold,
          critical_threshold: stage.critical_threshold,
        },
        detectedAt: now,
        expiresAt: expiresIn(24),
      });
    }

    return signals;
  } catch (error) {
    console.error("[funnel-benchmarks] Error generating signals:", error);
    return [];
  }
}
