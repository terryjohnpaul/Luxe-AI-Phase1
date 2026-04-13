/**
 * Bayesian Updater — blends industry benchmark priors with actual user data.
 *
 * Uses Beta distributions for rates (CTR, conversion rate) and
 * Normal-Inverse-Gamma for ROAS.
 *
 * Prior strength N=20 means the system needs ~20 data points before
 * user data starts dominating over industry benchmarks.
 */

import { db } from "@/lib/db";

// Default industry priors (from SIGNAL_TYPE_BENCHMARKS in signals/live route)
const INDUSTRY_PRIORS: Record<string, { ctr: number; convRate: number; roas: number }> = {
  competitor:    { ctr: 0.010, convRate: 0.006, roas: 2.8 },
  festival:     { ctr: 0.011, convRate: 0.007, roas: 3.5 },
  salary_cycle: { ctr: 0.009, convRate: 0.0055, roas: 2.5 },
  celebrity:    { ctr: 0.012, convRate: 0.0025, roas: 1.5 },
  cricket:      { ctr: 0.010, convRate: 0.0015, roas: 1.0 },
  weather:      { ctr: 0.008, convRate: 0.004, roas: 2.0 },
  entertainment:{ ctr: 0.010, convRate: 0.0025, roas: 1.5 },
  life_event:   { ctr: 0.0085, convRate: 0.007, roas: 3.2 },
  auspicious_day:{ ctr: 0.009, convRate: 0.0055, roas: 2.8 },
  social_trend: { ctr: 0.010, convRate: 0.003, roas: 1.8 },
};

const PRIOR_STRENGTH = 20; // Equivalent to 20 pseudo-observations

interface BetaParams {
  alpha: number;
  beta: number;
}

interface RoasParams {
  mean: number;
  variance: number;
  n: number;
}

interface ModelParams {
  ctr: BetaParams;
  convRate: BetaParams;
  roas: RoasParams;
}

function initPrior(signalType: string): ModelParams {
  const prior = INDUSTRY_PRIORS[signalType] || { ctr: 0.009, convRate: 0.004, roas: 2.5 };

  return {
    ctr: {
      alpha: prior.ctr * PRIOR_STRENGTH,
      beta: (1 - prior.ctr) * PRIOR_STRENGTH,
    },
    convRate: {
      alpha: prior.convRate * PRIOR_STRENGTH,
      beta: (1 - prior.convRate) * PRIOR_STRENGTH,
    },
    roas: {
      mean: prior.roas,
      variance: 1.0, // wide initial variance
      n: PRIOR_STRENGTH,
    },
  };
}

/**
 * Get or create the Bayesian model for a signal type + org.
 */
export async function getOrCreateModel(
  signalType: string,
  organizationId?: string | null
): Promise<{ params: ModelParams; dataCount: number; version: string }> {
  // Try org-specific model first, then global
  const model = await db.learningModel.findFirst({
    where: {
      signalType,
      organizationId: organizationId || null,
      isActive: true,
    },
    orderBy: { trainedAt: "desc" },
  });

  if (model) {
    return {
      params: model.parameters as unknown as ModelParams,
      dataCount: model.trainingDataCount,
      version: model.version,
    };
  }

  // Fall back to global model
  if (organizationId) {
    const globalModel = await db.learningModel.findFirst({
      where: { signalType, organizationId: null, isActive: true },
      orderBy: { trainedAt: "desc" },
    });
    if (globalModel) {
      return {
        params: globalModel.parameters as unknown as ModelParams,
        dataCount: globalModel.trainingDataCount,
        version: globalModel.version,
      };
    }
  }

  // Initialize from industry priors
  return {
    params: initPrior(signalType),
    dataCount: 0,
    version: "v1.0.0-prior",
  };
}

/**
 * Update the Bayesian model with new campaign outcome data.
 */
export async function updatePosterior(
  signalType: string,
  organizationId: string | null,
  actuals: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
  }
) {
  const { params, dataCount } = await getOrCreateModel(signalType, organizationId);

  // Update CTR: Beta-Binomial update
  params.ctr.alpha += actuals.clicks;
  params.ctr.beta += actuals.impressions - actuals.clicks;

  // Update conversion rate: Beta-Binomial update
  params.convRate.alpha += actuals.conversions;
  params.convRate.beta += actuals.clicks - actuals.conversions;

  // Update ROAS: running mean + variance (Normal update)
  if (actuals.spend > 0) {
    const observedRoas = actuals.revenue / actuals.spend;
    const newN = params.roas.n + 1;
    const newMean = params.roas.mean + (observedRoas - params.roas.mean) / newN;
    const newVariance =
      params.roas.variance + ((observedRoas - params.roas.mean) * (observedRoas - newMean) - params.roas.variance) / newN;

    params.roas = { mean: newMean, variance: Math.max(newVariance, 0.01), n: newN };
  }

  const version = `v1.${dataCount + 1}.0`;

  // Upsert the model
  await db.learningModel.upsert({
    where: {
      id: `${organizationId || "global"}-${signalType}`,
    },
    create: {
      id: `${organizationId || "global"}-${signalType}`,
      version,
      signalType,
      organizationId,
      parameters: params as any,
      trainingDataCount: dataCount + 1,
      isActive: true,
      trainedAt: new Date(),
    },
    update: {
      version,
      parameters: params as any,
      trainingDataCount: dataCount + 1,
      trainedAt: new Date(),
    },
  });

  return { params, dataCount: dataCount + 1, version };
}

/**
 * Get learned benchmarks for the prediction engine.
 * Returns the posterior means which blend industry priors with actual data.
 */
export async function getLearnedBenchmarks(
  signalType: string,
  organizationId?: string | null
): Promise<{
  ctr: number;
  convRate: number;
  roas: number;
  dataCount: number;
  source: "learned" | "industry_prior";
} | null> {
  const { params, dataCount } = await getOrCreateModel(signalType, organizationId);

  if (dataCount === 0) return null;

  return {
    ctr: params.ctr.alpha / (params.ctr.alpha + params.ctr.beta),
    convRate: params.convRate.alpha / (params.convRate.alpha + params.convRate.beta),
    roas: params.roas.mean,
    dataCount,
    source: dataCount > 5 ? "learned" : "industry_prior",
  };
}

/**
 * Get the data blend ratio — tells the UI how much of prediction is from user data.
 */
export function getDataBlendRatio(dataCount: number): {
  userDataPct: number;
  benchmarkPct: number;
  label: string;
} {
  // With prior strength of 20, the blend is: dataCount / (dataCount + 20)
  const userPct = Math.round((dataCount / (dataCount + PRIOR_STRENGTH)) * 100);
  const benchPct = 100 - userPct;

  let label: string;
  if (userPct < 20) label = "Mostly industry benchmarks";
  else if (userPct < 50) label = "Blending your data with benchmarks";
  else if (userPct < 80) label = "Mostly based on your campaigns";
  else label = "Fully personalized to your data";

  return { userDataPct: userPct, benchmarkPct: benchPct, label };
}
