/**
 * Signal Scorer — ranks signal types by how much value they actually produce.
 * Uses historical outcomes to answer: "Which signals make money?"
 */

import { db } from "@/lib/db";

export interface SignalScore {
  signalType: string;
  avgRoas: number;
  avgCpa: number | null;
  avgAccuracy: number;
  campaignCount: number;
  totalSpend: number;
  totalRevenue: number;
  valueScore: number; // 0-100 composite score
  trend: "improving" | "stable" | "declining";
}

/**
 * Compute value scores for all signal types based on historical outcomes.
 */
export async function computeSignalScores(organizationId?: string): Promise<SignalScore[]> {
  const where: any = {};
  if (organizationId) where.organizationId = organizationId;

  // Get all feature records grouped by signal type
  const records = await db.featureRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  if (records.length === 0) return [];

  // Group by signal type
  const groups: Record<string, typeof records> = {};
  for (const r of records) {
    if (!groups[r.signalType]) groups[r.signalType] = [];
    groups[r.signalType].push(r);
  }

  // Get accuracy data
  const evals = await db.predictionEval.findMany({
    where,
    select: { signalType: true, accuracy: true, evaluatedAt: true },
  });

  const evalsByType: Record<string, { accuracy: number; date: Date }[]> = {};
  for (const e of evals) {
    if (!evalsByType[e.signalType]) evalsByType[e.signalType] = [];
    if (e.accuracy != null) evalsByType[e.signalType].push({ accuracy: e.accuracy, date: e.evaluatedAt });
  }

  const scores: SignalScore[] = [];

  for (const [signalType, recs] of Object.entries(groups)) {
    const roasValues = recs.filter((r: any) => r.actualRoas != null).map((r: any) => r.actualRoas as number);
    const cpaValues = recs.filter((r: any) => r.actualCpa != null).map((r: any) => r.actualCpa as number);
    const typeEvals = evalsByType[signalType] || [];

    if (roasValues.length === 0) continue;

    const avgRoas = roasValues.reduce((a: number, b: number) => a + b, 0) / roasValues.length;
    const avgCpa = cpaValues.length > 0 ? cpaValues.reduce((a: number, b: number) => a + b, 0) / cpaValues.length : null;
    const avgAccuracy = typeEvals.length > 0
      ? typeEvals.reduce((s, e) => s + e.accuracy, 0) / typeEvals.length
      : 0.5;

    // Estimate total spend/revenue from ROAS and CPA
    const totalSpend = cpaValues.length > 0 ? avgCpa! * recs.length : 0;
    const totalRevenue = totalSpend * avgRoas;

    // Composite value score (0-100):
    // 40% ROAS performance, 30% accuracy, 20% volume, 10% CPA efficiency
    const roasScore = Math.min(avgRoas / 5, 1) * 40; // 5x ROAS = max score
    const accuracyScore = avgAccuracy * 30;
    const volumeScore = Math.min(recs.length / 20, 1) * 20; // 20+ campaigns = max
    const cpaScore = avgCpa != null ? Math.max(0, 1 - avgCpa / 5000) * 10 : 5;

    const valueScore = Math.round(roasScore + accuracyScore + volumeScore + cpaScore);

    // Trend: compare last 30 days vs previous 30 days
    const now = Date.now();
    const recentEvals = typeEvals.filter(e => e.date.getTime() > now - 30 * 86400000);
    const olderEvals = typeEvals.filter(
      e => e.date.getTime() > now - 60 * 86400000 && e.date.getTime() <= now - 30 * 86400000
    );

    let trend: "improving" | "stable" | "declining" = "stable";
    if (recentEvals.length >= 3 && olderEvals.length >= 3) {
      const recentAvg = recentEvals.reduce((s, e) => s + e.accuracy, 0) / recentEvals.length;
      const olderAvg = olderEvals.reduce((s, e) => s + e.accuracy, 0) / olderEvals.length;
      if (recentAvg > olderAvg + 0.1) trend = "improving";
      else if (recentAvg < olderAvg - 0.1) trend = "declining";
    }

    scores.push({
      signalType,
      avgRoas,
      avgCpa,
      avgAccuracy,
      campaignCount: recs.length,
      totalSpend,
      totalRevenue,
      valueScore,
      trend,
    });
  }

  // Sort by value score descending
  scores.sort((a, b) => b.valueScore - a.valueScore);
  return scores;
}
