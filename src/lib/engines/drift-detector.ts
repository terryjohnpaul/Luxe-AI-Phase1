/**
 * Drift Detector — detects when prediction accuracy degrades
 * and triggers model retraining.
 *
 * Runs weekly. Compares recent accuracy vs historical accuracy.
 * If accuracy drops >15%, flags for retraining.
 */

import { db } from "@/lib/db";

const DRIFT_THRESHOLD = 0.15; // 15% accuracy drop = drift
const ALERT_THRESHOLD = 0.25; // 25% drop = alert

export interface DriftReport {
  signalType: string;
  recentAccuracy: number;
  historicalAccuracy: number;
  driftAmount: number;
  status: "stable" | "drifting" | "alert";
  recentSampleSize: number;
  historicalSampleSize: number;
}

/**
 * Check for prediction drift across all signal types.
 */
export async function detectDrift(organizationId?: string): Promise<DriftReport[]> {
  const where: any = {};
  if (organizationId) where.organizationId = organizationId;

  const evals = await db.predictionEval.findMany({
    where,
    select: {
      signalType: true,
      accuracy: true,
      evaluatedAt: true,
    },
    orderBy: { evaluatedAt: "desc" },
    take: 500,
  });

  if (evals.length < 10) return [];

  const now = Date.now();
  const FOUR_WEEKS = 28 * 86400000;

  // Group by signal type
  const types = [...new Set<string>(evals.map((e: any) => e.signalType as string))];
  const reports: DriftReport[] = [];

  for (const signalType of types) {
    const typeEvals = evals.filter((e: any) => e.signalType === signalType && e.accuracy != null);

    const recent = typeEvals.filter((e: any) => e.evaluatedAt.getTime() > now - FOUR_WEEKS);
    const historical = typeEvals.filter(
      (e: any) => e.evaluatedAt.getTime() > now - 2 * FOUR_WEEKS &&
           e.evaluatedAt.getTime() <= now - FOUR_WEEKS
    );

    if (recent.length < 3 || historical.length < 3) continue;

    const recentAccuracy = recent.reduce((s: number, e: any) => s + e.accuracy!, 0) / recent.length;
    const historicalAccuracy = historical.reduce((s: number, e: any) => s + e.accuracy!, 0) / historical.length;
    const driftAmount = historicalAccuracy - recentAccuracy;

    let status: "stable" | "drifting" | "alert" = "stable";
    if (driftAmount >= ALERT_THRESHOLD) status = "alert";
    else if (driftAmount >= DRIFT_THRESHOLD) status = "drifting";

    reports.push({
      signalType,
      recentAccuracy,
      historicalAccuracy,
      driftAmount,
      status,
      recentSampleSize: recent.length,
      historicalSampleSize: historical.length,
    });
  }

  return reports;
}

/**
 * Retrain models for drifting signal types.
 * Recomputes Bayesian posteriors from all feature records.
 */
export async function retrainDriftingModels(organizationId?: string): Promise<string[]> {
  const reports = await detectDrift(organizationId);
  const drifting = reports.filter(r => r.status === "drifting" || r.status === "alert");

  if (drifting.length === 0) return [];

  const retrained: string[] = [];

  for (const report of drifting) {
    // Get all feature records for this signal type
    const where: any = { signalType: report.signalType };
    if (organizationId) where.organizationId = organizationId;

    const features = await db.featureRecord.findMany({ where });
    if (features.length === 0) continue;

    // Recompute Bayesian posterior from scratch
    const PRIOR_STRENGTH = 20;
    const priorCtr = 0.01;
    const priorConvRate = 0.005;
    const priorRoas = 2.5;

    let ctrAlpha = priorCtr * PRIOR_STRENGTH;
    let ctrBeta = (1 - priorCtr) * PRIOR_STRENGTH;
    let convAlpha = priorConvRate * PRIOR_STRENGTH;
    let convBeta = (1 - priorConvRate) * PRIOR_STRENGTH;
    let roasMean = priorRoas;
    let roasN = PRIOR_STRENGTH;
    let roasVariance = 1.0;

    for (const f of features) {
      if (f.actualCtr != null) {
        // Approximate: treat each feature record as ~1000 impressions
        const approxImpressions = 1000;
        const approxClicks = Math.round(f.actualCtr * approxImpressions);
        ctrAlpha += approxClicks;
        ctrBeta += approxImpressions - approxClicks;
      }
      if (f.actualConvRate != null) {
        const approxClicks = 100;
        const approxConv = Math.round(f.actualConvRate * approxClicks);
        convAlpha += approxConv;
        convBeta += approxClicks - approxConv;
      }
      if (f.actualRoas != null) {
        roasN++;
        const delta = f.actualRoas - roasMean;
        roasMean += delta / roasN;
        roasVariance += (delta * (f.actualRoas - roasMean) - roasVariance) / roasN;
      }
    }

    const version = `v2.${features.length}.0-retrain`;

    await db.learningModel.upsert({
      where: {
        id: `${organizationId || "global"}-${report.signalType}`,
      },
      create: {
        id: `${organizationId || "global"}-${report.signalType}`,
        version,
        signalType: report.signalType,
        organizationId: organizationId || null,
        parameters: {
          ctr: { alpha: ctrAlpha, beta: ctrBeta },
          convRate: { alpha: convAlpha, beta: convBeta },
          roas: { mean: roasMean, variance: Math.max(roasVariance, 0.01), n: roasN },
        },
        trainingDataCount: features.length,
        accuracy: null,
        isActive: true,
        trainedAt: new Date(),
      },
      update: {
        version,
        parameters: {
          ctr: { alpha: ctrAlpha, beta: ctrBeta },
          convRate: { alpha: convAlpha, beta: convBeta },
          roas: { mean: roasMean, variance: Math.max(roasVariance, 0.01), n: roasN },
        },
        trainingDataCount: features.length,
        trainedAt: new Date(),
      },
    });

    retrained.push(report.signalType);
  }

  return retrained;
}
