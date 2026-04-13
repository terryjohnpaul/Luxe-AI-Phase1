/**
 * Cross-User Vertical Benchmarks — anonymized aggregate learning.
 *
 * Aggregates performance data across all organizations to create
 * global benchmarks. New users benefit from patterns learned
 * across the entire customer base.
 */

import { db } from "@/lib/db";

export interface VerticalBenchmark {
  signalType: string;
  avgCtr: number;
  avgConvRate: number;
  avgRoas: number;
  avgCpa: number | null;
  sampleSize: number;
  lastUpdated: Date;
}

/**
 * Compute global benchmarks across all organizations.
 * This is the network effect — more users = better benchmarks for everyone.
 */
export async function computeVerticalBenchmarks(): Promise<VerticalBenchmark[]> {
  // Aggregate feature records across ALL orgs (no org filter)
  const records = await db.featureRecord.findMany({
    where: {
      actualRoas: { not: null },
    },
    select: {
      signalType: true,
      actualCtr: true,
      actualConvRate: true,
      actualRoas: true,
      actualCpa: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  if (records.length === 0) return [];

  // Group by signal type
  const groups: Record<string, typeof records> = {};
  for (const r of records) {
    if (!groups[r.signalType]) groups[r.signalType] = [];
    groups[r.signalType].push(r);
  }

  const benchmarks: VerticalBenchmark[] = [];

  for (const [signalType, recs] of Object.entries(groups)) {
    if (recs.length < 3) continue; // Need minimum data for meaningful benchmark

    const ctrs = recs.filter((r: any) => r.actualCtr != null).map((r: any) => r.actualCtr as number);
    const convRates = recs.filter((r: any) => r.actualConvRate != null).map((r: any) => r.actualConvRate as number);
    const roasVals = recs.filter((r: any) => r.actualRoas != null).map((r: any) => r.actualRoas as number);
    const cpas = recs.filter((r: any) => r.actualCpa != null).map((r: any) => r.actualCpa as number);

    benchmarks.push({
      signalType,
      avgCtr: ctrs.length > 0 ? ctrs.reduce((a: number, b: number) => a + b, 0) / ctrs.length : 0,
      avgConvRate: convRates.length > 0 ? convRates.reduce((a: number, b: number) => a + b, 0) / convRates.length : 0,
      avgRoas: roasVals.length > 0 ? roasVals.reduce((a: number, b: number) => a + b, 0) / roasVals.length : 0,
      avgCpa: cpas.length > 0 ? cpas.reduce((a: number, b: number) => a + b, 0) / cpas.length : null,
      sampleSize: recs.length,
      lastUpdated: recs[0].createdAt,
    });
  }

  // Store as global learning models
  for (const b of benchmarks) {
    await db.learningModel.upsert({
      where: { id: `global-vertical-${b.signalType}` },
      create: {
        id: `global-vertical-${b.signalType}`,
        version: `vertical-${new Date().toISOString().split("T")[0]}`,
        signalType: b.signalType,
        organizationId: null, // global
        parameters: {
          ctr: { mean: b.avgCtr, n: b.sampleSize },
          convRate: { mean: b.avgConvRate, n: b.sampleSize },
          roas: { mean: b.avgRoas, n: b.sampleSize },
          cpa: b.avgCpa ? { mean: b.avgCpa, n: b.sampleSize } : null,
        },
        trainingDataCount: b.sampleSize,
        isActive: true,
        trainedAt: new Date(),
      },
      update: {
        parameters: {
          ctr: { mean: b.avgCtr, n: b.sampleSize },
          convRate: { mean: b.avgConvRate, n: b.sampleSize },
          roas: { mean: b.avgRoas, n: b.sampleSize },
          cpa: b.avgCpa ? { mean: b.avgCpa, n: b.sampleSize } : null,
        },
        trainingDataCount: b.sampleSize,
        trainedAt: new Date(),
      },
    });
  }

  return benchmarks;
}
