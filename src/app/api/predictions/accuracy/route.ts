import { NextResponse } from "next/server";
import { getAccuracyStats } from "@/lib/engines/prediction-evaluator";
import { computeSignalScores } from "@/lib/engines/signal-scorer";
import { getDataBlendRatio } from "@/lib/engines/bayesian-updater";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId") || undefined;

  try {
    // Get accuracy stats
    const accuracy = await getAccuracyStats(orgId);

    // Get signal scores
    const signalScores = await computeSignalScores(orgId);

    // Get total data count for blend ratio
    const totalModels = await db.learningModel.findMany({
      where: { organizationId: orgId || null, isActive: true },
      select: { signalType: true, trainingDataCount: true },
    });

    const totalDataCount = totalModels.reduce((s: number, m: any) => s + m.trainingDataCount, 0);
    const blendRatio = getDataBlendRatio(totalDataCount);

    // Recent evaluations for the table
    const recentEvals = await db.predictionEval.findMany({
      where: orgId ? { organizationId: orgId } : {},
      include: {
        recommendation: { select: { title: true, signalType: true, priority: true } },
      },
      orderBy: { evaluatedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      accuracy,
      signalScores,
      blendRatio,
      recentEvals: recentEvals.map((e: any) => ({
        id: e.id,
        title: e.recommendation.title,
        signalType: e.signalType,
        priority: e.recommendation.priority,
        predictedRoas: e.predictedRoas,
        actualRoas: e.actualRoas,
        accuracy: e.accuracy,
        withinCI: e.withinCI,
        evaluatedAt: e.evaluatedAt,
      })),
    });
  } catch (error) {
    console.error("[API] Prediction accuracy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accuracy data" },
      { status: 500 }
    );
  }
}
