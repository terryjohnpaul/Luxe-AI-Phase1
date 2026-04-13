/**
 * Thompson Sampler — balances exploitation (show proven signals)
 * with exploration (try undersampled signal types).
 *
 * Uses Beta distributions from the Bayesian updater to sample
 * expected ROAS for each recommendation, then ranks by sampled value.
 */

import { db } from "@/lib/db";

// Beta distribution sampling using the Joehnk method
function betaSample(alpha: number, beta: number): number {
  // Simple approximation using the ratio of gamma samples
  const gammaA = gammaSample(alpha);
  const gammaB = gammaSample(beta);
  return gammaA / (gammaA + gammaB);
}

// Gamma distribution sampling (Marsaglia & Tsang, 2000)
function gammaSample(shape: number): number {
  if (shape < 1) {
    return gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x: number, v: number;
    do {
      x = normalSample();
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function normalSample(): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

interface RankedRecommendation {
  id: string;
  signalType: string;
  priority: string;
  sampledScore: number;
  explorationBonus: boolean;
}

/**
 * Rank recommendations using Thompson Sampling.
 * Each recommendation gets a sampled score from its signal type's
 * learned distribution. Undersampled types get exploration bonus.
 */
export async function thompsonRank(
  recommendations: Array<{ id: string; signalType: string; priority: string }>,
  organizationId?: string | null
): Promise<RankedRecommendation[]> {
  // Load all learning models for this org
  const models = await db.learningModel.findMany({
    where: {
      organizationId: organizationId || null,
      isActive: true,
    },
  });

  // Build a map of signal type -> model params
  const modelMap: Record<string, any> = {};
  for (const m of models) {
    if (m.signalType) modelMap[m.signalType] = m.parameters;
  }

  // Priority multipliers (keep existing behavior as a base)
  const priorityMult: Record<string, number> = {
    urgent: 1.3,
    high: 1.15,
    medium: 1.0,
    opportunity: 0.85,
  };

  const ranked: RankedRecommendation[] = recommendations.map((rec) => {
    const params = modelMap[rec.signalType];
    let sampledScore: number;
    let explorationBonus = false;

    if (params && params.roas && params.roas.n > 5) {
      // Learned model exists — sample from posterior
      // Use ROAS posterior as the primary ranking signal
      const roasMean = params.roas.mean;
      const roasStd = Math.sqrt(params.roas.variance / params.roas.n);

      // Sample from Normal(mean, std)
      sampledScore = roasMean + normalSample() * roasStd;
    } else {
      // No learned model — use exploration strategy
      // Sample from a wide distribution to encourage trying this signal type
      sampledScore = 2.0 + normalSample() * 1.5; // mean 2.0, std 1.5
      explorationBonus = true;
    }

    // Apply priority multiplier
    sampledScore *= priorityMult[rec.priority] || 1.0;

    // Floor at 0
    sampledScore = Math.max(0, sampledScore);

    return {
      id: rec.id,
      signalType: rec.signalType,
      priority: rec.priority,
      sampledScore,
      explorationBonus,
    };
  });

  // Sort by sampled score descending
  ranked.sort((a, b) => b.sampledScore - a.sampledScore);
  return ranked;
}
