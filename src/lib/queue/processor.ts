/**
 * Job Processor — handles all background job types
 * This file contains the actual business logic for each job.
 */

import type { OptimizationJobData, SignalJobData, SyncJobData, CreativeJobData, LearningJobData } from "./setup";
import { askClaudeStructured } from "@/lib/ai/claude";
import { optimizationAnalysisPrompt, signalInterpretationPrompt } from "@/lib/ai/prompts";

// ============================================================
// OPTIMIZATION PROCESSOR
// ============================================================

export async function processOptimization(data: OptimizationJobData) {
  const { organizationId } = data;
  console.log(`[Optimization] Starting cycle for org ${organizationId}`);

  const startTime = Date.now();

  try {
    // STEP 1: PULL metrics from Meta + Google
    console.log("[Optimization] Step 1: Pulling metrics...");
    const metaMetrics = await pullMetaMetrics(organizationId);
    const googleMetrics = await pullGoogleMetrics(organizationId);

    // STEP 2: PULL signals
    console.log("[Optimization] Step 2: Pulling signals...");
    const signals = await pullActiveSignals(organizationId);

    // STEP 3: ANALYZE with Claude AI
    console.log("[Optimization] Step 3: Analyzing with AI...");
    const analysis = await analyzePerformance(metaMetrics, googleMetrics, signals);

    // STEP 4: DECIDE — generate optimization decisions
    console.log("[Optimization] Step 4: Making decisions...");
    const decisions = analysis.data.decisions || [];

    // STEP 5: ACT — execute auto-approved decisions
    console.log("[Optimization] Step 5: Executing auto-approved decisions...");
    let executed = 0;
    for (const decision of decisions) {
      if (decision.autoApprove && decision.confidence > 0.8) {
        await executeDecision(organizationId, decision);
        executed++;
      }
    }

    // STEP 6: LEARN — log everything
    console.log("[Optimization] Step 6: Logging results...");
    const duration = Date.now() - startTime;

    console.log(
      `[Optimization] Cycle complete for org ${organizationId}. ` +
      `${decisions.length} decisions, ${executed} auto-executed. ` +
      `Duration: ${(duration / 1000).toFixed(1)}s`
    );

    return {
      success: true,
      decisions: decisions.length,
      executed,
      duration,
      summary: analysis.data.summary,
    };
  } catch (error) {
    console.error(`[Optimization] Error for org ${organizationId}:`, error);
    throw error;
  }
}

// ============================================================
// SIGNAL PROCESSOR
// ============================================================

export async function processSignal(data: SignalJobData) {
  const { type, organizationId } = data;

  switch (type) {
    case "check_weather":
      return await checkWeatherSignals(organizationId);
    case "check_trends":
      return await checkTrendSignals(organizationId);
    case "check_inventory":
      return await checkInventorySignals(organizationId);
    case "process_signal":
      return await interpretSignal(organizationId, data.signalData);
    default:
      console.log(`[Signal] Unknown signal type: ${type}`);
  }
}

// ============================================================
// SYNC PROCESSOR
// ============================================================

export async function processSync(data: SyncJobData) {
  const { type, organizationId, adAccountId } = data;

  switch (type) {
    case "sync_meta_campaigns":
      return await syncMetaCampaigns(organizationId, adAccountId);
    case "sync_meta_insights":
      return await syncMetaInsights(organizationId, adAccountId);
    case "sync_google_campaigns":
      return await syncGoogleCampaigns(organizationId, adAccountId);
    case "sync_google_insights":
      return await syncGoogleInsights(organizationId, adAccountId);
    case "sync_ga4":
      return await syncGA4Data(organizationId, adAccountId);
    default:
      console.log(`[Sync] Unknown sync type: ${type}`);
  }
}

// ============================================================
// CREATIVE PROCESSOR
// ============================================================

export async function processCreative(data: CreativeJobData) {
  const { type, organizationId, payload } = data;

  switch (type) {
    case "generate_video":
      return await generateVideoFromStatic(organizationId, payload);
    case "generate_variants":
      return await generateAdVariants(organizationId, payload);
    case "generate_ad_copy":
      return await generateAdCopy(organizationId, payload);
    default:
      console.log(`[Creative] Unknown creative type: ${type}`);
  }
}

// ============================================================
// HELPER FUNCTIONS (implementations)
// ============================================================

async function pullMetaMetrics(orgId: string) {
  // TODO: Connect to real Meta API via AdAccount credentials
  // For now, return structure for testing
  console.log(`[Pull] Meta metrics for org ${orgId}`);
  return [];
}

async function pullGoogleMetrics(orgId: string) {
  console.log(`[Pull] Google metrics for org ${orgId}`);
  return [];
}

async function pullActiveSignals(orgId: string) {
  console.log(`[Pull] Active signals for org ${orgId}`);
  return [];
}

async function analyzePerformance(meta: any[], google: any[], signals: any[]) {
  const prompt = optimizationAnalysisPrompt({
    metaMetrics: meta,
    googleMetrics: google,
    signals,
    historicalContext: "First optimization cycle — no historical data yet.",
  });

  return askClaudeStructured(prompt, (json) => JSON.parse(json));
}

async function executeDecision(orgId: string, decision: any) {
  console.log(`[Execute] Decision for org ${orgId}: ${decision.type} — ${decision.description}`);
  // TODO: Call Meta/Google APIs to execute the decision
  // For now, just log
}

async function checkWeatherSignals(orgId: string) {
  const { WeatherClient } = await import("@/lib/integrations/weather");
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    console.log("[Signal] No weather API key configured");
    return;
  }

  const client = new WeatherClient(apiKey);
  const triggers = await client.checkTriggers();

  console.log(`[Signal] Weather check: ${triggers.length} triggers found`);

  for (const trigger of triggers) {
    console.log(`[Signal] Weather trigger: ${trigger.type} in ${trigger.city} — ${trigger.campaignAction}`);
    // TODO: Create Signal record in DB and trigger campaign actions
  }

  return triggers;
}

async function checkTrendSignals(orgId: string) {
  const { GoogleTrendsClient } = await import("@/lib/integrations/google-trends");
  const client = new GoogleTrendsClient();

  try {
    const spiking = await client.getSpikingBrands();
    console.log(`[Signal] Trend check: ${spiking.length} brands spiking`);

    for (const spike of spiking) {
      console.log(`[Signal] Trend spike: ${spike.keyword} at ${spike.spikeRatio}x`);
      // TODO: Create Signal record and boost relevant campaigns
    }

    return spiking;
  } catch (error) {
    console.error("[Signal] Trend check error:", error);
    return [];
  }
}

async function checkInventorySignals(orgId: string) {
  console.log(`[Signal] Inventory check for org ${orgId}`);
  // TODO: Check BI data mart for low stock, fast sellers, slow movers
  return [];
}

async function interpretSignal(orgId: string, signalData: any) {
  const prompt = signalInterpretationPrompt([signalData]);
  const result = await askClaudeStructured(prompt, (json) => JSON.parse(json));
  return result.data;
}

async function syncMetaCampaigns(orgId: string, accountId: string) {
  console.log(`[Sync] Meta campaigns for org ${orgId}, account ${accountId}`);
  // TODO: Call MetaAdsClient.getCampaigns() and upsert into Campaign table
}

async function syncMetaInsights(orgId: string, accountId: string) {
  console.log(`[Sync] Meta insights for org ${orgId}, account ${accountId}`);
  // TODO: Call MetaAdsClient.getAccountInsights() and insert into CampaignMetric table
}

async function syncGoogleCampaigns(orgId: string, accountId: string) {
  console.log(`[Sync] Google campaigns for org ${orgId}, account ${accountId}`);
  // TODO: Call GoogleAdsClient.getCampaignPerformance() and upsert
}

async function syncGoogleInsights(orgId: string, accountId: string) {
  console.log(`[Sync] Google insights for org ${orgId}, account ${accountId}`);
}

async function syncGA4Data(orgId: string, accountId: string) {
  console.log(`[Sync] GA4 data for org ${orgId}`);
}

async function generateVideoFromStatic(orgId: string, payload: any) {
  console.log(`[Creative] Generating video for org ${orgId}`);
  // TODO: Call Kling/Runway API
}

async function generateAdVariants(orgId: string, payload: any) {
  console.log(`[Creative] Generating ad variants for org ${orgId}`);
  // TODO: Use 3x3 matrix to generate 9 variants
}

async function generateAdCopy(orgId: string, payload: any) {
  console.log(`[Creative] Generating ad copy for org ${orgId}`);
  // TODO: Call Claude with adCopyPrompt
}

// ============================================================
// LEARNING / FLYWHEEL PROCESSOR
// ============================================================



// === linkOutcomesToRecommendations: Closes the learning flywheel loop ===
async function linkOutcomesToRecommendations(orgId: string, platform: string) {
  try {
    const { db } = await import("@/lib/db");
    
    // Find recommendations with linkedCampaignId set but no outcomes yet
    const linked = await db.flywhRecommendation.findMany({
      where: {
        organizationId: orgId,
        linkedCampaignId: { not: null },
        campaignOutcomes: { none: {} },
        status: "approved",
      },
      take: 50,
    });

    if (linked.length === 0) {
      console.log("[linkOutcomes] No pending recommendations to link");
      return { linked: 0 };
    }

    let linkedCount = 0;
    for (const rec of linked) {
      try {
        // Find campaign metrics for the linked campaign
        const campaign = await db.campaign.findFirst({
          where: { externalId: rec.linkedCampaignId!, organizationId: orgId }
        });
        if (!campaign) continue;

        const metrics = await db.campaignMetric.findMany({
          where: {
            campaignId: campaign.id,
            date: { gte: rec.createdAt }
          }
        });
        if (metrics.length === 0) continue;

        const totals = metrics.reduce((acc: any, m: any) => ({
          impressions: acc.impressions + (m.impressions || 0),
          clicks: acc.clicks + (m.clicks || 0),
          spend: acc.spend + (m.spend || 0),
          conversions: acc.conversions + (m.conversions || 0),
          revenue: acc.revenue + (m.conversionValue || 0),
        }), { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 });

        await db.campaignOutcome.create({
          data: {
            recommendationId: rec.id,
            organizationId: orgId,
            platform,
            externalCampaignId: rec.linkedCampaignId!,
            dateStart: rec.createdAt,
            dateEnd: new Date(),
            impressions: totals.impressions,
            clicks: totals.clicks,
            spend: totals.spend,
            conversions: totals.conversions,
            revenue: totals.revenue,
            ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : null,
            roas: totals.spend > 0 ? totals.revenue / totals.spend : null,
            cpa: totals.conversions > 0 ? totals.spend / totals.conversions : null,
          }
        });
        linkedCount++;
      } catch (e) {
        console.error("[linkOutcomes] Error linking recommendation", rec.id, e);
      }
    }

    console.log(`[linkOutcomes] Linked ${linkedCount} recommendations to outcomes`);
    return { linked: linkedCount };
  } catch (e) {
    console.error("[linkOutcomes] Error:", e);
    return { linked: 0 };
  }
}

export async function processLearning(data: LearningJobData) {
  const { type, organizationId } = data;

  switch (type) {
    case "evaluate_predictions": {
      const { evaluatePendingPredictions } = await import("@/lib/engines/prediction-evaluator");
      const result = await evaluatePendingPredictions(organizationId);
      console.log(`[Learning] Evaluated ${result.evaluated} predictions. Avg accuracy: ${result.avgAccuracy?.toFixed(2) ?? "N/A"}`);
      return result;
    }

    case "detect_drift": {
      const { detectDrift, retrainDriftingModels } = await import("@/lib/engines/drift-detector");
      const reports = await detectDrift(organizationId);
      const drifting = reports.filter(r => r.status !== "stable");

      if (drifting.length > 0) {
        console.log(`[Learning] Drift detected in ${drifting.length} signal types:`, drifting.map(d => d.signalType));
        const retrained = await retrainDriftingModels(organizationId);
        console.log(`[Learning] Retrained models for: ${retrained.join(", ")}`);
        return { drifting, retrained };
      }

      console.log("[Learning] No drift detected. All models stable.");
      return { drifting: [], retrained: [] };
    }

    case "retrain_models": {
      const { retrainDriftingModels } = await import("@/lib/engines/drift-detector");
      const retrained = await retrainDriftingModels(organizationId);
      console.log(`[Learning] Force retrained: ${retrained.join(", ") || "none needed"}`);
      return { retrained };
    }

    case "compute_benchmarks": {
      const { computeVerticalBenchmarks } = await import("@/lib/engines/vertical-benchmarks");
      const benchmarks = await computeVerticalBenchmarks();
      console.log(`[Learning] Computed vertical benchmarks for ${benchmarks.length} signal types`);
      return { benchmarks: benchmarks.length };
    }

    default:
      console.log(`[Learning] Unknown job type: ${type}`);
  }
}
