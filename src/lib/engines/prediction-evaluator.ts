/**
 * Prediction Evaluator — compares predicted vs actual campaign outcomes.
 * Runs daily after campaign results are ingested.
 * This is the core feedback signal that makes the flywheel spin.
 */

import { db } from "@/lib/db";
import { updatePosterior } from "./bayesian-updater";

/**
 * Evaluate all pending predictions that have campaign outcome data.
 */
export async function evaluatePendingPredictions(organizationId?: string) {
  // Find approved recommendations with linked campaign outcomes but no evaluation yet
  const where: any = {
    status: "approved",
    campaignOutcomes: { some: {} },
    predictionEvals: { none: {} },
  };
  if (organizationId) where.organizationId = organizationId;

  const recommendations = await db.flywhRecommendation.findMany({
    where,
    include: {
      campaignOutcomes: true,
      signalLog: true,
    },
    take: 100, // Process in batches
  });

  const results = [];

  for (const rec of recommendations) {
    const outcome = rec.campaignOutcomes[0];
    if (!outcome || outcome.spend === 0) continue;

    // Parse predicted values from the prediction payload
    const prediction = rec.predictionPayload as any;
    const predictedRoas = rec.predictedRoas;
    const predictedCtr = rec.predictedCtr;
    const predictedConvRate = rec.predictedConvRate;

    // Actual values
    const actualCtr = outcome.ctr;
    const actualConvRate = outcome.clicks > 0 ? outcome.conversions / outcome.clicks : null;
    const actualRoas = outcome.roas;

    // Compute errors
    const roasError = actualRoas != null && predictedRoas != null
      ? actualRoas - predictedRoas : null;
    const roasErrorPct = roasError != null && predictedRoas != null && predictedRoas > 0
      ? roasError / predictedRoas : null;

    // Check if actual falls within confidence interval
    const withinCI = actualRoas != null && rec.predictedRoasLow != null && rec.predictedRoasHigh != null
      ? actualRoas >= rec.predictedRoasLow && actualRoas <= rec.predictedRoasHigh
      : null;

    // Composite accuracy score (0-1)
    // 1.0 if actual within CI, decays linearly outside
    let accuracy: number | null = null;
    if (actualRoas != null && predictedRoas != null && predictedRoas > 0) {
      const pctError = Math.abs(roasErrorPct ?? 0);
      if (withinCI) {
        accuracy = 1.0;
      } else if (pctError <= 0.25) {
        accuracy = 0.8; // within 25%
      } else if (pctError <= 0.5) {
        accuracy = 0.5; // within 50%
      } else {
        accuracy = Math.max(0, 1 - pctError); // linear decay
      }
    }

    // Create evaluation record
    const evalRecord = await db.predictionEval.create({
      data: {
        recommendationId: rec.id,
        campaignOutcomeId: outcome.id,
        predictedCtr,
        predictedConvRate,
        predictedRoas,
        actualCtr,
        actualConvRate: actualConvRate,
        actualRoas,
        actualSpend: outcome.spend,
        actualRevenue: outcome.revenue,
        roasError,
        roasErrorPct,
        withinCI,
        signalType: rec.signalType,
        severity: rec.priority,
        confidence: rec.confidenceScore,
        tierMode: rec.tierMode,
        accuracy,
        modelVersion: rec.modelVersion,
        organizationId: rec.organizationId,
      },
    });

    // Create feature record (denormalized for ML training)
    const detectedDate = rec.signalLog?.detectedAt ?? rec.createdAt;
    await db.featureRecord.create({
      data: {
        signalType: rec.signalType,
        severity: rec.priority,
        confidence: rec.confidenceScore,
        tierMode: rec.tierMode,
        location: rec.signalLog?.location,
        dayOfWeek: detectedDate.getDay(),
        monthOfYear: detectedDate.getMonth(),
        isSalaryWeek: detectedDate.getDate() <= 5,
        isWeekend: [0, 6].includes(detectedDate.getDay()),
        actualCtr: actualCtr,
        actualConvRate: actualConvRate,
        actualRoas: actualRoas,
        actualCpa: outcome.conversions > 0 ? outcome.spend / outcome.conversions : null,
        modelVersion: rec.modelVersion,
        organizationId: rec.organizationId,
      },
    });

    // Update Bayesian model with new data
    if (outcome.impressions > 0) {
      await updatePosterior(rec.signalType, rec.organizationId, {
        impressions: outcome.impressions,
        clicks: outcome.clicks,
        conversions: outcome.conversions,
        spend: outcome.spend,
        revenue: outcome.revenue,
      });
    }

    results.push({ recId: rec.id, accuracy, actualRoas, predictedRoas });
  }

  return {
    evaluated: results.length,
    avgAccuracy: results.length > 0
      ? results.reduce((sum, r) => sum + (r.accuracy ?? 0), 0) / results.length
      : null,
    results,
  };
}

/**
 * Get prediction accuracy stats for an organization.
 */
export async function getAccuracyStats(organizationId?: string) {
  const where: any = {};
  if (organizationId) where.organizationId = organizationId;

  const evals = await db.predictionEval.findMany({
    where,
    orderBy: { evaluatedAt: "desc" },
    take: 500,
  });

  if (evals.length === 0) {
    return {
      overall: null,
      bySignalType: {},
      totalEvaluated: 0,
      withinCIPct: null,
      trend: [],
    };
  }

  // Overall accuracy
  const accuracies = evals.filter((e: any) => e.accuracy != null).map((e: any) => e.accuracy as number);
  const overall = accuracies.length > 0
    ? accuracies.reduce((a: number, b: number) => a + b, 0) / accuracies.length
    : null;

  // Within CI percentage
  const ciChecks = evals.filter((e: any) => e.withinCI != null);
  const withinCIPct = ciChecks.length > 0
    ? ciChecks.filter((e: any) => e.withinCI).length / ciChecks.length
    : null;

  // By signal type
  const byType: Record<string, { accuracy: number; count: number; avgRoasError: number }> = {};
  for (const e of evals) {
    if (!byType[e.signalType]) byType[e.signalType] = { accuracy: 0, count: 0, avgRoasError: 0 };
    byType[e.signalType].count++;
    byType[e.signalType].accuracy += e.accuracy ?? 0;
    byType[e.signalType].avgRoasError += Math.abs(e.roasErrorPct ?? 0);
  }
  for (const type of Object.keys(byType)) {
    byType[type].accuracy /= byType[type].count;
    byType[type].avgRoasError /= byType[type].count;
  }

  // Weekly trend (last 12 weeks)
  const trend: { week: string; accuracy: number; count: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 86400000);
    const weekEnd = new Date(now.getTime() - i * 7 * 86400000);
    const weekEvals = evals.filter(
      (e: any) => e.evaluatedAt >= weekStart && e.evaluatedAt < weekEnd && e.accuracy != null
    );
    if (weekEvals.length > 0) {
      trend.push({
        week: weekStart.toISOString().split("T")[0],
        accuracy: weekEvals.reduce((s: number, e: any) => s + e.accuracy!, 0) / weekEvals.length,
        count: weekEvals.length,
      });
    }
  }

  return {
    overall,
    bySignalType: byType,
    totalEvaluated: evals.length,
    withinCIPct,
    trend,
  };
}
