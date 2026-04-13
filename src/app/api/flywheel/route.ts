import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAccuracyStats } from "@/lib/engines/prediction-evaluator";
import { computeSignalScores } from "@/lib/engines/signal-scorer";
import { getDataBlendRatio } from "@/lib/engines/bayesian-updater";
import { detectDrift } from "@/lib/engines/drift-detector";

export async function GET() {
  try {
    // 1. Data Collection Stats
    const [
      signalLogCount,
      recommendationCount,
      userActionCount,
      outcomeCount,
      evalCount,
      featureCount,
      modelCount,
    ] = await Promise.all([
      db.signalLog.count(),
      db.flywhRecommendation.count(),
      db.flywhUserAction.count(),
      db.campaignOutcome.count(),
      db.predictionEval.count(),
      db.featureRecord.count(),
      db.learningModel.count(),
    ]);

    // 2. Recent user actions breakdown
    const recentActions = await db.flywhUserAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { action: true, createdAt: true, recommendationId: true },
    });

    const actionBreakdown: Record<string, number> = {};
    for (const a of recentActions) {
      actionBreakdown[a.action] = (actionBreakdown[a.action] || 0) + 1;
    }

    // 3. Recommendation status breakdown
    const recStatuses = await db.flywhRecommendation.groupBy({
      by: ["status"],
      _count: true,
    });
    const statusBreakdown: Record<string, number> = {};
    for (const s of recStatuses) {
      statusBreakdown[s.status] = s._count;
    }

    // 4. Prediction accuracy
    const accuracy = await getAccuracyStats();

    // 5. Signal scores
    const signalScores = await computeSignalScores();

    // 6. Learning models state
    const models = await db.learningModel.findMany({
      where: { isActive: true },
      orderBy: { trainedAt: "desc" },
      select: {
        id: true,
        version: true,
        signalType: true,
        trainingDataCount: true,
        accuracy: true,
        organizationId: true,
        trainedAt: true,
      },
    });

    // Compute blend ratios per model
    const modelsWithBlend = models.map((m: any) => ({
      ...m,
      blend: getDataBlendRatio(m.trainingDataCount),
    }));

    // 7. Drift detection
    const driftReports = await detectDrift();

    // 8. Recent evaluations (prediction ledger)
    const recentEvals = await db.predictionEval.findMany({
      orderBy: { evaluatedAt: "desc" },
      take: 20,
      include: {
        recommendation: {
          select: { title: true, signalType: true, priority: true, createdAt: true },
        },
      },
    });

    // 9. Activity timeline (last 50 events across all tables)
    const recentSignals = await db.signalLog.findMany({
      orderBy: { detectedAt: "desc" },
      take: 10,
      select: { id: true, type: true, title: true, severity: true, detectedAt: true },
    });

    const recentRecs = await db.flywhRecommendation.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, signalType: true, status: true, createdAt: true },
    });

    const timeline = [
      ...recentSignals.map((s: any) => ({
        type: "signal_detected" as const,
        title: s.title,
        detail: `${s.type} signal (${s.severity})`,
        timestamp: s.detectedAt,
      })),
      ...recentRecs.map((r: any) => ({
        type: "recommendation_created" as const,
        title: r.title,
        detail: `${r.signalType} → ${r.status}`,
        timestamp: r.createdAt,
      })),
      ...recentActions.slice(0, 10).map((a: any) => ({
        type: "user_action" as const,
        title: a.action.replace(/_/g, " "),
        detail: `on rec ${a.recommendationId.slice(0, 12)}...`,
        timestamp: a.createdAt,
      })),
      ...recentEvals.slice(0, 5).map((e: any) => ({
        type: "prediction_evaluated" as const,
        title: `${e.recommendation.signalType} prediction evaluated`,
        detail: e.accuracy != null ? `${Math.round(e.accuracy * 100)}% accurate` : "pending",
        timestamp: e.evaluatedAt,
      })),
      ...driftReports
        .filter((d: any) => d.status !== "stable")
        .map((d: any) => ({
          type: "drift_detected" as const,
          title: `Drift in ${d.signalType} predictions`,
          detail: `Accuracy dropped ${Math.round(d.driftAmount * 100)}% — auto-retraining triggered`,
          timestamp: new Date(),
        })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30);

    // 10. Flywheel health score (0-100)
    const dataScore = Math.min((signalLogCount + recommendationCount + userActionCount) / 100, 1) * 25;
    const feedbackScore = evalCount > 0 ? Math.min(evalCount / 20, 1) * 25 : 0;
    const accuracyScore = accuracy.overall != null ? accuracy.overall * 25 : 0;
    const learningScore = modelCount > 0 ? Math.min(modelCount / 5, 1) * 25 : 0;
    const healthScore = Math.round(dataScore + feedbackScore + accuracyScore + learningScore);

    // Health phase
    let phase: string;
    let phaseDetail: string;
    if (evalCount === 0 && outcomeCount === 0) {
      phase = "Collecting Data";
      phaseDetail = "The flywheel is ingesting signals and tracking your actions. Approve recommendations and link campaign results to start learning.";
    } else if (evalCount < 10) {
      phase = "Early Learning";
      phaseDetail = `${evalCount} predictions evaluated. Need ~20 for meaningful patterns. Keep running signal-based campaigns.`;
    } else if (evalCount < 50) {
      phase = "Pattern Recognition";
      phaseDetail = `${evalCount} evaluations complete. The system is identifying which signals work best for your campaigns.`;
    } else {
      phase = "Self-Improving";
      phaseDetail = `Fully operational with ${evalCount} evaluations. Predictions are personalized to your data. The flywheel is spinning.`;
    }

    return NextResponse.json({
      health: {
        score: healthScore,
        phase,
        phaseDetail,
      },
      dataCollection: {
        signalsLogged: signalLogCount,
        recommendationsGenerated: recommendationCount,
        userActionsTracked: userActionCount,
        campaignOutcomes: outcomeCount,
        predictionsEvaluated: evalCount,
        featuresComputed: featureCount,
        modelsActive: modelCount,
      },
      actionBreakdown,
      statusBreakdown,
      accuracy,
      signalScores,
      models: modelsWithBlend,
      driftReports,
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
      timeline,
    });
  } catch (error) {
    console.error("[Flywheel API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch flywheel data" }, { status: 500 });
  }
}
