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

    // 10. Flywheel health score (0-100) — measures real learning quality, not data volume
    // 1. Prediction accuracy (30%) — are we getting better at forecasting?
    const predictionAccuracyScore = accuracy.overall != null ? accuracy.overall * 30 : 0;

    // 2. Insight coverage (20%) — what % of total spend is covered by pattern detection?
    const totalSpendResult = await db.$queryRaw<Array<{ total: number }>>`
      SELECT COALESCE(SUM(spend), 0) as total FROM "CampaignOutcome" WHERE spend > 0
    `;
    const coveredSpendResult = await db.$queryRaw<Array<{ total: number }>>`
      SELECT COALESCE(SUM(co.spend), 0) as total FROM "CampaignOutcome" co
      WHERE co."recommendationId" IS NOT NULL AND co.spend > 0
    `;
    const totalSpend = totalSpendResult[0]?.total || 1;
    const coveredSpend = coveredSpendResult[0]?.total || 0;
    const coveragePct = Math.min(coveredSpend / totalSpend, 1);
    const insightCoverageScore = coveragePct * 20;

    // 3. Learning velocity (20%) — is accuracy improving week-over-week?
    let velocityScore = 0;
    if (accuracy.trend && accuracy.trend.length >= 2) {
      const recent = accuracy.trend.slice(-3);
      const older = accuracy.trend.slice(0, Math.max(accuracy.trend.length - 3, 1));
      const recentAvg = recent.reduce((s: number, t: any) => s + t.accuracy, 0) / recent.length;
      const olderAvg = older.reduce((s: number, t: any) => s + t.accuracy, 0) / older.length;
      const improvement = recentAvg - olderAvg;
      velocityScore = improvement > 0 ? Math.min(improvement / 0.3, 1) * 20 : 0;
    }

    // 4. Data freshness (15%) — how recent is the last campaign outcome?
    const latestOutcome = await db.campaignOutcome.findFirst({
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true },
    });
    let freshnessScore = 0;
    if (latestOutcome) {
      const daysSinceLastOutcome = (Date.now() - new Date(latestOutcome.fetchedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastOutcome < 1) freshnessScore = 15;
      else if (daysSinceLastOutcome < 7) freshnessScore = 12;
      else if (daysSinceLastOutcome < 30) freshnessScore = 8;
      else if (daysSinceLastOutcome < 90) freshnessScore = 4;
      else freshnessScore = 1;
    }

    // 5. Loop completion (15%) — what % of approved recommendations led to measured campaigns?
    const approvedCount = await db.flywhRecommendation.count({ where: { status: "approved" } });
    const linkedCount = await db.flywhRecommendation.count({
      where: { status: "approved", campaignOutcomes: { some: {} } },
    });
    const loopCompletionPct = approvedCount > 0 ? linkedCount / approvedCount : 0;
    const loopCompletionScore = Math.min(loopCompletionPct, 1) * 15;

    const healthScore = Math.round(
      predictionAccuracyScore + insightCoverageScore + velocityScore + freshnessScore + loopCompletionScore
    );

    // Health phase — based on what the system has actually proven
    let phase: string;
    let phaseDetail: string;
    const healthBreakdown = {
      predictionAccuracy: { score: Math.round(predictionAccuracyScore), max: 30, detail: `${accuracy.overall != null ? Math.round(accuracy.overall * 100) : 0}% forecast accuracy` },
      insightCoverage: { score: Math.round(insightCoverageScore), max: 20, detail: `${Math.round(coveragePct * 100)}% of spend analyzed` },
      learningVelocity: { score: Math.round(velocityScore), max: 20, detail: velocityScore > 0 ? "accuracy improving" : "no improvement trend yet" },
      dataFreshness: { score: Math.round(freshnessScore), max: 15, detail: latestOutcome ? `last outcome ${Math.round((Date.now() - new Date(latestOutcome.fetchedAt).getTime()) / (1000 * 60 * 60 * 24))}d ago` : "no outcomes" },
      loopCompletion: { score: Math.round(loopCompletionScore), max: 15, detail: `${linkedCount}/${approvedCount} recommendations measured` },
    };

    if (healthScore >= 70) {
      phase = "Self-Improving";
      phaseDetail = `Predictions are ${Math.round((accuracy.overall || 0) * 100)}% accurate and improving. ${linkedCount} campaigns measured. The flywheel is proving its value.`;
    } else if (healthScore >= 45) {
      phase = "Learning";
      phaseDetail = `${Math.round((accuracy.overall || 0) * 100)}% prediction accuracy across ${evalCount} evaluations. Run more signal-driven campaigns to improve.`;
    } else if (healthScore >= 20) {
      phase = "Calibrating";
      phaseDetail = `The system has data but predictions are only ${Math.round((accuracy.overall || 0) * 100)}% accurate. More predict-then-verify cycles needed.`;
    } else {
      phase = "Collecting Data";
      phaseDetail = "Approve recommendations, run campaigns, and link results to start the learning loop.";
    }


    // 11. Dynamic Insights — "What We've Learned"
    const insights: Array<{
      text: string;
      category: "performance" | "timing" | "audience" | "creative" | "budget";
      impact: "high" | "medium" | "low";
      metric: string;
      learnedFrom: string;
      learnedAt: string;
    }> = [];

    const now = new Date().toISOString();

    // Helper: format number with commas (Indian style)
    const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");
    const fmtDec = (n: number) => n.toFixed(1);

    // --- Insight: Avg ROAS by signal type (from PredictionEval) ---
    const roasBySignal = await db.$queryRaw<Array<{ signalType: string; avgRoas: number; cnt: number }>>`
      SELECT "signalType", AVG("actualRoas") as "avgRoas", COUNT(*)::int as cnt
      FROM "PredictionEval"
      WHERE "actualRoas" IS NOT NULL AND "actualRoas" > 0 AND "actualRoas" < 500
      GROUP BY "signalType"
      HAVING COUNT(*) >= 3
      ORDER BY AVG("actualRoas") DESC
    `;
    if (roasBySignal.length >= 2) {
      const best = roasBySignal[0];
      const worst = roasBySignal[roasBySignal.length - 1];
      const ratio = best.avgRoas / Math.max(worst.avgRoas, 0.1);
      insights.push({
        text: `${best.signalType.replace(/_/g, " ")} campaigns deliver ${fmtDec(best.avgRoas)}x ROAS on average — ${fmtDec(ratio)}x better than ${worst.signalType.replace(/_/g, " ")} campaigns`,
        category: "performance",
        impact: ratio > 2 ? "high" : "medium",
        metric: `${fmtDec(best.avgRoas)}x ROAS`,
        learnedFrom: `${fmt(best.cnt + worst.cnt)} campaign evaluations`,
        learnedAt: now,
      });
    }

    // --- Insight: Platform comparison ---
    const roasByPlatform = await db.$queryRaw<Array<{ platform: string; avgRoas: number; avgSpend: number; cnt: number }>>`
      SELECT co.platform, AVG(co.roas) as "avgRoas", AVG(co.spend) as "avgSpend", COUNT(*)::int as cnt
      FROM "CampaignOutcome" co
      WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
      GROUP BY co.platform
    `;
    if (roasByPlatform.length === 2) {
      const sorted = roasByPlatform.sort((a: any, b: any) => b.avgRoas - a.avgRoas);
      const ratio = sorted[0].avgRoas / Math.max(sorted[1].avgRoas, 0.1);
      insights.push({
        text: `${sorted[0].platform.charAt(0).toUpperCase() + sorted[0].platform.slice(1)} delivers ${fmtDec(sorted[0].avgRoas)}x avg ROAS vs ${sorted[1].platform.charAt(0).toUpperCase() + sorted[1].platform.slice(1)}'s ${fmtDec(sorted[1].avgRoas)}x across all campaigns`,
        category: "budget",
        impact: ratio > 1.5 ? "high" : "medium",
        metric: `${fmtDec(sorted[0].avgRoas)}x vs ${fmtDec(sorted[1].avgRoas)}x`,
        learnedFrom: `${fmt(sorted[0].cnt + sorted[1].cnt)} campaign outcomes`,
        learnedAt: now,
      });
    }

    // --- Insight: Remarketing vs prospecting ---
    const remarketingRoas = await db.$queryRaw<Array<{ isRemarketing: boolean; avgRoas: number; cnt: number }>>`
      SELECT 
        (c.name ILIKE '%remarketing%' OR c.name ILIKE '%retarget%' OR c.name ILIKE '%ATC%' OR c.name ILIKE '%remarket%') as "isRemarketing",
        AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
      FROM "CampaignOutcome" co
      JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
      WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
      GROUP BY (c.name ILIKE '%remarketing%' OR c.name ILIKE '%retarget%' OR c.name ILIKE '%ATC%' OR c.name ILIKE '%remarket%')
    `;
    if (remarketingRoas.length === 2) {
      const rmkt = remarketingRoas.find((r: any) => r.isRemarketing);
      const prosp = remarketingRoas.find((r: any) => !r.isRemarketing);
      if (rmkt && prosp) {
        const ratio = rmkt.avgRoas / Math.max(prosp.avgRoas, 0.1);
        insights.push({
          text: `Remarketing campaigns deliver ${fmtDec(rmkt.avgRoas)}x ROAS — ${fmtDec(ratio)}x ${ratio > 1 ? "better" : "worse"} than prospecting campaigns (${fmtDec(prosp.avgRoas)}x)`,
          category: "performance",
          impact: "high",
          metric: `${fmtDec(rmkt.avgRoas)}x ROAS`,
          learnedFrom: `${fmt(rmkt.cnt)} remarketing + ${fmt(prosp.cnt)} prospecting outcomes`,
          learnedAt: now,
        });
      }
    }

    // --- Insight: Sale event performance ---
    const saleRoas = await db.$queryRaw<Array<{ isSale: boolean; avgRoas: number; cnt: number }>>`
      SELECT 
        (c.name ILIKE '%EOSS%' OR c.name ILIKE '%BFS%' OR c.name ILIKE '%BBS%' OR c.name ILIKE '%AASS%' OR c.name ILIKE '%sale%' OR c.name ILIKE '%flash%') as "isSale",
        AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
      FROM "CampaignOutcome" co
      JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
      WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
      GROUP BY (c.name ILIKE '%EOSS%' OR c.name ILIKE '%BFS%' OR c.name ILIKE '%BBS%' OR c.name ILIKE '%AASS%' OR c.name ILIKE '%sale%' OR c.name ILIKE '%flash%')
    `;
    if (saleRoas.length === 2) {
      const sale = saleRoas.find((r: any) => r.isSale);
      const bau = saleRoas.find((r: any) => !r.isSale);
      if (sale && bau) {
        const ratio = bau.avgRoas / Math.max(sale.avgRoas, 0.1);
        insights.push({
          text: `Campaigns during sales (EOSS/BFS/BBS) average ${fmtDec(sale.avgRoas)}x ROAS vs ${fmtDec(bau.avgRoas)}x for always-on — sale campaigns perform ${fmtDec(ratio)}x ${ratio > 1 ? "worse" : "better"}`,
          category: "performance",
          impact: "medium",
          metric: `${fmtDec(sale.avgRoas)}x sale ROAS`,
          learnedFrom: `${fmt(sale.cnt)} sale + ${fmt(bau.cnt)} BAU outcomes`,
          learnedAt: now,
        });
      }
    }

    // --- Insight: Top spending campaigns and efficiency ---
    const topSpenders = await db.$queryRaw<Array<{ name: string; totalSpend: number; avgRoas: number; cnt: number }>>`
      SELECT c.name, SUM(co.spend) as "totalSpend", AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
      FROM "CampaignOutcome" co
      JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
      WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.spend > 0
      GROUP BY c.name
      HAVING SUM(co.spend) > 100000
      ORDER BY SUM(co.spend) DESC
      LIMIT 1
    `;
    if (topSpenders.length > 0) {
      const top = topSpenders[0];
      insights.push({
        text: `"${top.name}" is the highest-spend campaign at ₹${fmt(top.totalSpend)} total spend with ${fmtDec(top.avgRoas)}x avg ROAS`,
        category: "budget",
        impact: top.avgRoas > 5 ? "high" : "medium",
        metric: `₹${fmt(top.totalSpend)} spent`,
        learnedFrom: `${fmt(top.cnt)} daily outcomes`,
        learnedAt: now,
      });
    }

    // --- Insight: Best ROAS campaign ---
    const bestRoasCampaign = await db.$queryRaw<Array<{ name: string; avgRoas: number; totalSpend: number; cnt: number }>>`
      SELECT c.name, AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend", COUNT(*)::int as cnt
      FROM "CampaignOutcome" co
      JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
      WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500 AND co.spend > 1000
      GROUP BY c.name
      HAVING COUNT(*) >= 3
      ORDER BY AVG(co.roas) DESC
      LIMIT 1
    `;
    if (bestRoasCampaign.length > 0) {
      const best = bestRoasCampaign[0];
      insights.push({
        text: `"${best.name}" achieves the best ROAS at ${fmtDec(best.avgRoas)}x on ₹${fmt(best.totalSpend)} total spend — a hidden gem`,
        category: "performance",
        impact: "high",
        metric: `${fmtDec(best.avgRoas)}x ROAS`,
        learnedFrom: `${fmt(best.cnt)} daily outcomes`,
        learnedAt: now,
      });
    }

    // --- Insight: iOS vs Android ---
    const osPerfRaw = await db.$queryRaw<Array<{ os: string; avgRoas: number; totalSpend: number; cnt: number }>>`
      SELECT 
        CASE 
          WHEN c.name ILIKE '%ios%' OR c.name ILIKE '%iphone%' THEN 'iOS'
          WHEN c.name ILIKE '%android%' THEN 'Android'
          ELSE 'Mixed'
        END as os,
        AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend", COUNT(*)::int as cnt
      FROM "CampaignOutcome" co
      JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
      WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
      GROUP BY CASE 
        WHEN c.name ILIKE '%ios%' OR c.name ILIKE '%iphone%' THEN 'iOS'
        WHEN c.name ILIKE '%android%' THEN 'Android'
        ELSE 'Mixed'
      END
    `;
    const ios = osPerfRaw.find((r: any) => r.os === 'iOS');
    const android = osPerfRaw.find((r: any) => r.os === 'Android');
    if (ios && android) {
      const better = ios.avgRoas > android.avgRoas ? ios : android;
      const worse = ios.avgRoas > android.avgRoas ? android : ios;
      const ratio = better.avgRoas / Math.max(worse.avgRoas, 0.1);
      insights.push({
        text: `${better.os} campaigns average ${fmtDec(better.avgRoas)}x ROAS — ${fmtDec(ratio)}x better than ${worse.os} (${fmtDec(worse.avgRoas)}x)`,
        category: "audience",
        impact: ratio > 1.5 ? "high" : "medium",
        metric: `${fmtDec(ratio)}x difference`,
        learnedFrom: `${fmt(better.cnt)} ${better.os} + ${fmt(worse.cnt)} ${worse.os} outcomes`,
        learnedAt: now,
      });
    }

    // --- Insight: Catalog vs non-catalog ---
    const catalogPerf = await db.$queryRaw<Array<{ isCatalog: boolean; avgRoas: number; cnt: number }>>`
      SELECT 
        (c.name ILIKE '%catalog%' OR c.name ILIKE '%catalogue%' OR c.name ILIKE '%catalouge%') as "isCatalog",
        AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
      FROM "CampaignOutcome" co
      JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
      WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
      GROUP BY (c.name ILIKE '%catalog%' OR c.name ILIKE '%catalogue%' OR c.name ILIKE '%catalouge%')
    `;
    if (catalogPerf.length === 2) {
      const cat = catalogPerf.find((r: any) => r.isCatalog);
      const nonCat = catalogPerf.find((r: any) => !r.isCatalog);
      if (cat && nonCat) {
        const ratio = cat.avgRoas / Math.max(nonCat.avgRoas, 0.1);
        insights.push({
          text: `Catalog/DPA campaigns deliver ${fmtDec(cat.avgRoas)}x ROAS — ${fmtDec(ratio)}x ${ratio > 1 ? "better" : "worse"} than non-catalog campaigns`,
          category: "creative",
          impact: ratio > 1.5 ? "high" : "medium",
          metric: `${fmtDec(cat.avgRoas)}x catalog ROAS`,
          learnedFrom: `${fmt(cat.cnt)} catalog + ${fmt(nonCat.cnt)} non-catalog outcomes`,
          learnedAt: now,
        });
      }
    }

    // --- Insight: Conversion vs Traffic objective ---
    const objPerf = await db.$queryRaw<Array<{ objective: string; avgRoas: number; totalSpend: number; cnt: number }>>`
      SELECT 
        CASE 
          WHEN c.name ILIKE '%conv%' OR c.name ILIKE '%purchase%' OR c.name ILIKE '%pur%' THEN 'Conversion'
          WHEN c.name ILIKE '%traffic%' OR c.name ILIKE '%click%' THEN 'Traffic'
          WHEN c.name ILIKE '%reach%' OR c.name ILIKE '%awareness%' OR c.name ILIKE '%thruplay%' THEN 'Awareness'
          ELSE 'Other'
        END as objective,
        AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend", COUNT(*)::int as cnt
      FROM "CampaignOutcome" co
      JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
      WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
      GROUP BY CASE 
        WHEN c.name ILIKE '%conv%' OR c.name ILIKE '%purchase%' OR c.name ILIKE '%pur%' THEN 'Conversion'
        WHEN c.name ILIKE '%traffic%' OR c.name ILIKE '%click%' THEN 'Traffic'
        WHEN c.name ILIKE '%reach%' OR c.name ILIKE '%awareness%' OR c.name ILIKE '%thruplay%' THEN 'Awareness'
        ELSE 'Other'
      END
      HAVING COUNT(*) >= 5
      ORDER BY AVG(co.roas) DESC
    `;
    if (objPerf.length >= 2) {
      const best = objPerf[0];
      const worst = objPerf[objPerf.length - 1];
      insights.push({
        text: `${best.objective}-optimized campaigns average ${fmtDec(best.avgRoas)}x ROAS — best among all objectives. ${worst.objective} averages just ${fmtDec(worst.avgRoas)}x`,
        category: "performance",
        impact: "high",
        metric: `${fmtDec(best.avgRoas)}x best objective`,
        learnedFrom: `${fmt(objPerf.reduce((s: number, o: any) => s + o.cnt, 0))} campaign outcomes`,
        learnedAt: now,
      });
    }

    // --- Insight: Spend efficiency — CPA analysis ---
    const cpaAnalysis = await db.$queryRaw<Array<{ platform: string; avgCpa: number; cnt: number }>>`
      SELECT co.platform, AVG(co.cpa) as "avgCpa", COUNT(*)::int as cnt
      FROM "CampaignOutcome" co
      WHERE co.cpa IS NOT NULL AND co.cpa > 0 AND co.cpa < 50000
      GROUP BY co.platform
    `;
    if (cpaAnalysis.length >= 1) {
      for (const p of cpaAnalysis) {
        insights.push({
          text: `Average CPA on ${p.platform.charAt(0).toUpperCase() + p.platform.slice(1)} is ₹${fmt(p.avgCpa)} across ${fmt(p.cnt)} campaign days`,
          category: "budget",
          impact: p.avgCpa < 1000 ? "high" : "medium",
          metric: `₹${fmt(p.avgCpa)} CPA`,
          learnedFrom: `${fmt(p.cnt)} ${p.platform} outcomes`,
          learnedAt: now,
        });
      }
    }

    // --- Insight: Brand-specific performance ---
    const brandPerf = await db.$queryRaw<Array<{ brand: string; avgRoas: number; totalSpend: number; cnt: number }>>`
      SELECT 
        CASE 
          WHEN c.name ILIKE '%coach%' THEN 'Coach'
          WHEN c.name ILIKE '%hugo%boss%' OR c.name ILIKE '%boss%' THEN 'Hugo Boss'
          WHEN c.name ILIKE '%michael%kors%' OR c.name ILIKE '%_MK_%' THEN 'Michael Kors'
          WHEN c.name ILIKE '%kate%spade%' THEN 'Kate Spade'
          WHEN c.name ILIKE '%onitsuka%' THEN 'Onitsuka Tiger'
          WHEN c.name ILIKE '%diesel%' THEN 'Diesel'
          ELSE NULL
        END as brand,
        AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend", COUNT(*)::int as cnt
      FROM "CampaignOutcome" co
      JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
      WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
      GROUP BY CASE 
        WHEN c.name ILIKE '%coach%' THEN 'Coach'
        WHEN c.name ILIKE '%hugo%boss%' OR c.name ILIKE '%boss%' THEN 'Hugo Boss'
        WHEN c.name ILIKE '%michael%kors%' OR c.name ILIKE '%_MK_%' THEN 'Michael Kors'
        WHEN c.name ILIKE '%kate%spade%' THEN 'Kate Spade'
        WHEN c.name ILIKE '%onitsuka%' THEN 'Onitsuka Tiger'
        WHEN c.name ILIKE '%diesel%' THEN 'Diesel'
        ELSE NULL
      END
      HAVING COUNT(*) >= 3
      ORDER BY AVG(co.roas) DESC
    `;
    const brandResults = brandPerf.filter((b: any) => b.brand != null);
    if (brandResults.length >= 2) {
      const best = brandResults[0];
      const worst = brandResults[brandResults.length - 1];
      insights.push({
        text: `${best.brand} campaigns are top performers at ${fmtDec(best.avgRoas)}x ROAS. ${worst.brand} lags at ${fmtDec(worst.avgRoas)}x — consider budget reallocation`,
        category: "budget",
        impact: "high",
        metric: `${fmtDec(best.avgRoas)}x vs ${fmtDec(worst.avgRoas)}x`,
        learnedFrom: `${fmt(brandResults.reduce((s: number, b: any) => s + b.cnt, 0))} brand campaign outcomes`,
        learnedAt: now,
      });
    }

    // --- Insight: Prediction accuracy ---
    const predAccuracy = await db.$queryRaw<Array<{ avgAccuracy: number; withinCiPct: number; cnt: number }>>`
      SELECT AVG(accuracy) as "avgAccuracy", 
             AVG(CASE WHEN "withinCI" THEN 1.0 ELSE 0.0 END) as "withinCiPct",
             COUNT(*)::int as cnt
      FROM "PredictionEval"
      WHERE accuracy IS NOT NULL
    `;
    if (predAccuracy.length > 0 && predAccuracy[0].cnt > 0) {
      const pa = predAccuracy[0];
      insights.push({
        text: `The prediction engine is ${Math.round(pa.avgAccuracy * 100)}% accurate on ROAS forecasts across ${fmt(pa.cnt)} evaluations — ${Math.round(pa.withinCiPct * 100)}% fall within confidence intervals`,
        category: "performance",
        impact: pa.avgAccuracy > 0.6 ? "high" : "medium",
        metric: `${Math.round(pa.avgAccuracy * 100)}% accuracy`,
        learnedFrom: `${fmt(pa.cnt)} prediction evaluations`,
        learnedAt: now,
      });
    }

    // --- Insight: Low spend high ROAS (underfunded gems) ---
    const underfunded = await db.$queryRaw<Array<{ name: string; avgRoas: number; totalSpend: number; pctOfTotal: number; cnt: number }>>`
      WITH total AS (SELECT SUM(spend) as total FROM "CampaignOutcome" WHERE spend > 0)
      SELECT c.name, AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend",
             (SUM(co.spend) / t.total * 100) as "pctOfTotal", COUNT(*)::int as cnt
      FROM "CampaignOutcome" co
      JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
      CROSS JOIN total t
      WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500 AND co.spend > 0
      GROUP BY c.name, t.total
      HAVING AVG(co.roas) > 15 AND (SUM(co.spend) / t.total * 100) < 5
      ORDER BY AVG(co.roas) DESC
      LIMIT 1
    `;
    if (underfunded.length > 0) {
      const uf = underfunded[0];
      insights.push({
        text: `"${uf.name}" delivers ${fmtDec(uf.avgRoas)}x ROAS on just ${fmtDec(uf.pctOfTotal)}% of total budget — severely underfunded`,
        category: "budget",
        impact: "high",
        metric: `${fmtDec(uf.avgRoas)}x on ${fmtDec(uf.pctOfTotal)}%`,
        learnedFrom: `${fmt(uf.cnt)} daily outcomes`,
        learnedAt: now,
      });
    }

    // --- Insight: Top 5 brands by ROAS (expanded brand list) ---
    try {
      const top5Brands = await db.$queryRaw<Array<{ brand: string; avgRoas: number; totalSpend: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%coach%' THEN 'Coach'
            WHEN c.name ILIKE '%hugo%boss%' OR c.name ILIKE '%HUGO_BOSS%' THEN 'Hugo Boss'
            WHEN c.name ILIKE '%michael%kors%' OR c.name ILIKE '%MichaelKors%' OR c.name ILIKE '%_MK_%' THEN 'Michael Kors'
            WHEN c.name ILIKE '%kate%spade%' OR c.name ILIKE '%KateSpade%' THEN 'Kate Spade'
            WHEN c.name ILIKE '%onitsuka%' THEN 'Onitsuka Tiger'
            WHEN c.name ILIKE '%diesel%' THEN 'Diesel'
            WHEN c.name ILIKE '%emporio%armani%' OR c.name ILIKE '%EA%' THEN 'Emporio Armani'
            WHEN c.name ILIKE '%jimmy%choo%' OR c.name ILIKE '%JimmyChoo%' THEN 'Jimmy Choo'
            WHEN c.name ILIKE '%tumi%' THEN 'Tumi'
            WHEN c.name ILIKE '%veja%' THEN 'Veja'
            WHEN c.name ILIKE '%kenzo%' THEN 'Kenzo'
            WHEN c.name ILIKE '%hackett%' THEN 'Hackett'
            WHEN c.name ILIKE '%paul%smith%' OR c.name ILIKE '%PaulSmith%' THEN 'Paul Smith'
            WHEN c.name ILIKE '%stella%mccartn%' OR c.name ILIKE '%StellaMcCartney%' THEN 'Stella McCartney'
            WHEN c.name ILIKE '%cult%gaia%' OR c.name ILIKE '%CultGaia%' THEN 'Cult Gaia'
            WHEN c.name ILIKE '%ferragamo%' OR c.name ILIKE '%salvatore%' THEN 'Salvatore Ferragamo'
            WHEN c.name ILIKE '%zimmermann%' THEN 'Zimmermann'
            WHEN c.name ILIKE '%tory%burch%' OR c.name ILIKE '%ToryBurch%' THEN 'Tory Burch'
            WHEN c.name ILIKE '%isabel%marant%' OR c.name ILIKE '%IsabelMarant%' THEN 'Isabel Marant'
            WHEN c.name ILIKE '%giuseppe%zanotti%' OR c.name ILIKE '%GiuseppeZanotti%' THEN 'Giuseppe Zanotti'
            ELSE NULL
          END as brand,
          AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
        HAVING COUNT(*) >= 3
        ORDER BY AVG(co.roas) DESC
      `;
      const topBrands = top5Brands.filter((b: any) => b.brand != null).slice(0, 5);
      if (topBrands.length >= 3) {
        const brandList = topBrands.map((b: any) => `${b.brand} (${fmtDec(b.avgRoas)}x)`).join(", ");
        insights.push({
          text: `Top 5 brands by ROAS: ${brandList}. These are your strongest performers — prioritize budget here`,
          category: "performance",
          impact: "high",
          metric: `${fmtDec(topBrands[0].avgRoas)}x best brand ROAS`,
          learnedFrom: `${fmt(topBrands.reduce((s: number, b: any) => s + b.cnt, 0))} brand campaign outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Most spend-efficient brand (lowest CPA) ---
    try {
      const brandCpa = await db.$queryRaw<Array<{ brand: string; avgCpa: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%coach%' THEN 'Coach'
            WHEN c.name ILIKE '%hugo%boss%' OR c.name ILIKE '%HUGO_BOSS%' THEN 'Hugo Boss'
            WHEN c.name ILIKE '%michael%kors%' OR c.name ILIKE '%MichaelKors%' OR c.name ILIKE '%_MK_%' THEN 'Michael Kors'
            WHEN c.name ILIKE '%kate%spade%' OR c.name ILIKE '%KateSpade%' THEN 'Kate Spade'
            WHEN c.name ILIKE '%onitsuka%' THEN 'Onitsuka Tiger'
            WHEN c.name ILIKE '%diesel%' THEN 'Diesel'
            WHEN c.name ILIKE '%jimmy%choo%' OR c.name ILIKE '%JimmyChoo%' THEN 'Jimmy Choo'
            WHEN c.name ILIKE '%tumi%' THEN 'Tumi'
            WHEN c.name ILIKE '%veja%' THEN 'Veja'
            WHEN c.name ILIKE '%kenzo%' THEN 'Kenzo'
            WHEN c.name ILIKE '%hackett%' THEN 'Hackett'
            WHEN c.name ILIKE '%stella%mccartn%' OR c.name ILIKE '%StellaMcCartney%' THEN 'Stella McCartney'
            ELSE NULL
          END as brand,
          AVG(co.cpa) as "avgCpa", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.cpa IS NOT NULL AND co.cpa > 0 AND co.cpa < 50000
        GROUP BY 1
        HAVING COUNT(*) >= 3
        ORDER BY AVG(co.cpa) ASC
      `;
      const validBrandCpa = brandCpa.filter((b: any) => b.brand != null);
      if (validBrandCpa.length >= 2) {
        const cheapest = validBrandCpa[0];
        const priciest = validBrandCpa[validBrandCpa.length - 1];
        insights.push({
          text: `${cheapest.brand} has the lowest cost per acquisition at ₹${fmt(cheapest.avgCpa)}, while ${priciest.brand} costs ₹${fmt(priciest.avgCpa)} per conversion — ${fmtDec(priciest.avgCpa / Math.max(cheapest.avgCpa, 1))}x more expensive`,
          category: "budget",
          impact: "high",
          metric: `₹${fmt(cheapest.avgCpa)} cheapest CPA`,
          learnedFrom: `${fmt(validBrandCpa.reduce((s: number, b: any) => s + b.cnt, 0))} brand outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Brand with best conversion rate ---
    try {
      const brandConvRate = await db.$queryRaw<Array<{ brand: string; convRate: number; totalClicks: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%coach%' THEN 'Coach'
            WHEN c.name ILIKE '%hugo%boss%' OR c.name ILIKE '%HUGO_BOSS%' THEN 'Hugo Boss'
            WHEN c.name ILIKE '%michael%kors%' OR c.name ILIKE '%MichaelKors%' OR c.name ILIKE '%_MK_%' THEN 'Michael Kors'
            WHEN c.name ILIKE '%kate%spade%' OR c.name ILIKE '%KateSpade%' THEN 'Kate Spade'
            WHEN c.name ILIKE '%onitsuka%' THEN 'Onitsuka Tiger'
            WHEN c.name ILIKE '%diesel%' THEN 'Diesel'
            WHEN c.name ILIKE '%jimmy%choo%' OR c.name ILIKE '%JimmyChoo%' THEN 'Jimmy Choo'
            WHEN c.name ILIKE '%tumi%' THEN 'Tumi'
            ELSE NULL
          END as brand,
          CASE WHEN SUM(co.clicks) > 0 THEN SUM(co.conversions)::float / SUM(co.clicks) * 100 ELSE 0 END as "convRate",
          SUM(co.clicks)::int as "totalClicks", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.clicks > 0 AND co.conversions IS NOT NULL
        GROUP BY 1
        HAVING COUNT(*) >= 3 AND SUM(co.clicks) > 100
        ORDER BY 2 DESC
      `;
      const validConvBrands = brandConvRate.filter((b: any) => b.brand != null);
      if (validConvBrands.length >= 2) {
        const best = validConvBrands[0];
        insights.push({
          text: `${best.brand} converts ${fmtDec(best.convRate)}% of clicks into purchases — highest conversion rate among all brands`,
          category: "performance",
          impact: "high",
          metric: `${fmtDec(best.convRate)}% CVR`,
          learnedFrom: `${fmt(best.totalClicks)} clicks analyzed`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Overinvested brand (high spend, low ROAS) ---
    try {
      const overinvested = await db.$queryRaw<Array<{ brand: string; avgRoas: number; totalSpend: number; spendPct: number; cnt: number }>>`
        WITH total AS (SELECT SUM(spend) as total FROM "CampaignOutcome" WHERE spend > 0)
        SELECT
          CASE
            WHEN c.name ILIKE '%coach%' THEN 'Coach'
            WHEN c.name ILIKE '%hugo%boss%' OR c.name ILIKE '%HUGO_BOSS%' THEN 'Hugo Boss'
            WHEN c.name ILIKE '%michael%kors%' OR c.name ILIKE '%MichaelKors%' OR c.name ILIKE '%_MK_%' THEN 'Michael Kors'
            WHEN c.name ILIKE '%kate%spade%' OR c.name ILIKE '%KateSpade%' THEN 'Kate Spade'
            WHEN c.name ILIKE '%onitsuka%' THEN 'Onitsuka Tiger'
            WHEN c.name ILIKE '%diesel%' THEN 'Diesel'
            WHEN c.name ILIKE '%jimmy%choo%' OR c.name ILIKE '%JimmyChoo%' THEN 'Jimmy Choo'
            WHEN c.name ILIKE '%tumi%' THEN 'Tumi'
            ELSE NULL
          END as brand,
          AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend",
          (SUM(co.spend) / t.total * 100) as "spendPct", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        CROSS JOIN total t
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500 AND co.spend > 0
        GROUP BY 1, t.total
        HAVING COUNT(*) >= 3 AND (SUM(co.spend) / t.total * 100) > 5 AND AVG(co.roas) < 5
        ORDER BY SUM(co.spend) DESC
        LIMIT 1
      `;
      const overBrands = overinvested.filter((b: any) => b.brand != null);
      if (overBrands.length > 0) {
        const ob = overBrands[0];
        insights.push({
          text: `${ob.brand} consumes ${fmtDec(ob.spendPct)}% of total ad budget but only returns ${fmtDec(ob.avgRoas)}x ROAS — potential overinvestment`,
          category: "budget",
          impact: "high",
          metric: `${fmtDec(ob.spendPct)}% spend, ${fmtDec(ob.avgRoas)}x return`,
          learnedFrom: `${fmt(ob.cnt)} campaign outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Campaign type ROAS comparison (Shopping vs Search vs PMax vs DPA vs Display) ---
    try {
      const campTypeRoas = await db.$queryRaw<Array<{ campType: string; avgRoas: number; totalSpend: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%StandardShopping%' OR c.name ILIKE '%shopping%' THEN 'Shopping'
            WHEN c.name ILIKE '%PMax%' OR c.name ILIKE '%Performance Max%' THEN 'PMax'
            WHEN c.name ILIKE '%Search%' OR c.name ILIKE '%GSB%' OR c.name ILIKE '%GSNB%' OR c.name ILIKE '%DSA%' THEN 'Search'
            WHEN c.name ILIKE '%DPA%' OR c.name ILIKE '%NDPA%' THEN 'DPA'
            WHEN c.name ILIKE '%display%' THEN 'Display'
            WHEN c.name ILIKE '%video%' OR c.name ILIKE '%trueview%' OR c.name ILIKE '%VAC%' OR c.name ILIKE '%thruplay%' THEN 'Video'
            WHEN c.name ILIKE '%UAC%' THEN 'App Install (UAC)'
            WHEN c.name ILIKE '%AAA%' OR c.name ILIKE '%ASC%' OR c.name ILIKE '%Advantage%' THEN 'Advantage+ / AAA'
            ELSE NULL
          END as "campType",
          AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
        HAVING COUNT(*) >= 5
        ORDER BY AVG(co.roas) DESC
      `;
      const validTypes = campTypeRoas.filter((t: any) => t.campType != null);
      if (validTypes.length >= 3) {
        const ranking = validTypes.map((t: any) => `${t.campType} (${fmtDec(t.avgRoas)}x)`).join(", ");
        insights.push({
          text: `Campaign type ROAS ranking: ${ranking}. Shift budget toward what works`,
          category: "performance",
          impact: "high",
          metric: `${fmtDec(validTypes[0].avgRoas)}x best type`,
          learnedFrom: `${fmt(validTypes.reduce((s: number, t: any) => s + t.cnt, 0))} campaign outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Campaign type with best CPA ---
    try {
      const campTypeCpa = await db.$queryRaw<Array<{ campType: string; avgCpa: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%StandardShopping%' OR c.name ILIKE '%shopping%' THEN 'Shopping'
            WHEN c.name ILIKE '%PMax%' OR c.name ILIKE '%Performance Max%' THEN 'PMax'
            WHEN c.name ILIKE '%Search%' OR c.name ILIKE '%GSB%' OR c.name ILIKE '%GSNB%' OR c.name ILIKE '%DSA%' THEN 'Search'
            WHEN c.name ILIKE '%DPA%' OR c.name ILIKE '%NDPA%' THEN 'DPA'
            WHEN c.name ILIKE '%AAA%' OR c.name ILIKE '%ASC%' THEN 'Advantage+'
            ELSE NULL
          END as "campType",
          AVG(co.cpa) as "avgCpa", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.cpa IS NOT NULL AND co.cpa > 0 AND co.cpa < 50000
        GROUP BY 1
        HAVING COUNT(*) >= 5
        ORDER BY AVG(co.cpa) ASC
      `;
      const validTypeCpa = campTypeCpa.filter((t: any) => t.campType != null);
      if (validTypeCpa.length >= 2) {
        const best = validTypeCpa[0];
        const worst = validTypeCpa[validTypeCpa.length - 1];
        insights.push({
          text: `${best.campType} campaigns deliver the cheapest conversions at ₹${fmt(best.avgCpa)} CPA, while ${worst.campType} costs ₹${fmt(worst.avgCpa)} — ${fmtDec(worst.avgCpa / Math.max(best.avgCpa, 1))}x more per acquisition`,
          category: "budget",
          impact: "high",
          metric: `₹${fmt(best.avgCpa)} best CPA`,
          learnedFrom: `${fmt(validTypeCpa.reduce((s: number, t: any) => s + t.cnt, 0))} campaign outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Campaign type with most wasted spend ---
    try {
      const wastedByType = await db.$queryRaw<Array<{ campType: string; wastedSpend: number; avgRoas: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%StandardShopping%' OR c.name ILIKE '%shopping%' THEN 'Shopping'
            WHEN c.name ILIKE '%PMax%' THEN 'PMax'
            WHEN c.name ILIKE '%Search%' OR c.name ILIKE '%GSB%' OR c.name ILIKE '%GSNB%' OR c.name ILIKE '%DSA%' THEN 'Search'
            WHEN c.name ILIKE '%DPA%' OR c.name ILIKE '%NDPA%' THEN 'DPA'
            WHEN c.name ILIKE '%display%' THEN 'Display'
            WHEN c.name ILIKE '%video%' OR c.name ILIKE '%trueview%' OR c.name ILIKE '%VAC%' THEN 'Video'
            WHEN c.name ILIKE '%UAC%' THEN 'UAC'
            ELSE NULL
          END as "campType",
          SUM(CASE WHEN co.roas < 1 THEN co.spend ELSE 0 END) as "wastedSpend",
          AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.spend > 0
        GROUP BY 1
        HAVING COUNT(*) >= 5
        ORDER BY 2 DESC
      `;
      const validWasted = wastedByType.filter((t: any) => t.campType != null && t.wastedSpend > 0);
      if (validWasted.length >= 1) {
        const worst = validWasted[0];
        insights.push({
          text: `${worst.campType} campaigns have the most wasted spend — ₹${fmt(worst.wastedSpend)} spent on sub-1x ROAS days. Consider tighter bid controls or pausing underperformers`,
          category: "budget",
          impact: "high",
          metric: `₹${fmt(worst.wastedSpend)} wasted`,
          learnedFrom: `${fmt(worst.cnt)} campaign outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Best performing month ---
    try {
      const monthlyRoas = await db.$queryRaw<Array<{ month: string; avgRoas: number; totalSpend: number; cnt: number }>>`
        SELECT TO_CHAR(cm.date, 'YYYY-MM') as month, AVG(cm.roas) as "avgRoas",
               SUM(cm.spend) as "totalSpend", COUNT(*)::int as cnt
        FROM "CampaignMetric" cm
        WHERE cm.roas IS NOT NULL AND cm.roas > 0 AND cm.roas < 500 AND cm.spend > 0
        GROUP BY TO_CHAR(cm.date, 'YYYY-MM')
        HAVING COUNT(*) >= 10
        ORDER BY AVG(cm.roas) DESC
      `;
      if (monthlyRoas.length >= 3) {
        const best = monthlyRoas[0];
        const worst = monthlyRoas[monthlyRoas.length - 1];
        insights.push({
          text: `${best.month} was the best-performing month at ${fmtDec(best.avgRoas)}x avg ROAS. Worst was ${worst.month} at ${fmtDec(worst.avgRoas)}x — a ${fmtDec(best.avgRoas / Math.max(worst.avgRoas, 0.1))}x gap`,
          category: "timing",
          impact: "high",
          metric: `${fmtDec(best.avgRoas)}x peak month`,
          learnedFrom: `${fmt(monthlyRoas.reduce((s: number, m: any) => s + m.cnt, 0))} daily metrics across ${monthlyRoas.length} months`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Best quarter ---
    try {
      const quarterlyRoas = await db.$queryRaw<Array<{ quarter: string; avgRoas: number; totalSpend: number; cnt: number }>>`
        SELECT 'Q' || EXTRACT(QUARTER FROM cm.date)::int as quarter,
               AVG(cm.roas) as "avgRoas", SUM(cm.spend) as "totalSpend", COUNT(*)::int as cnt
        FROM "CampaignMetric" cm
        WHERE cm.roas IS NOT NULL AND cm.roas > 0 AND cm.roas < 500 AND cm.spend > 0
        GROUP BY EXTRACT(QUARTER FROM cm.date)
        HAVING COUNT(*) >= 20
        ORDER BY AVG(cm.roas) DESC
      `;
      if (quarterlyRoas.length >= 2) {
        const best = quarterlyRoas[0];
        const worst = quarterlyRoas[quarterlyRoas.length - 1];
        insights.push({
          text: `${best.quarter} is consistently the strongest quarter at ${fmtDec(best.avgRoas)}x avg ROAS, while ${worst.quarter} dips to ${fmtDec(worst.avgRoas)}x. Plan your biggest pushes for ${best.quarter}`,
          category: "timing",
          impact: "high",
          metric: `${fmtDec(best.avgRoas)}x ${best.quarter} ROAS`,
          learnedFrom: `${fmt(quarterlyRoas.reduce((s: number, q: any) => s + q.cnt, 0))} daily metrics`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Year-over-year ROAS trend ---
    try {
      const yearlyRoas = await db.$queryRaw<Array<{ year: number; avgRoas: number; totalSpend: number; cnt: number }>>`
        SELECT EXTRACT(YEAR FROM cm.date)::int as year, AVG(cm.roas) as "avgRoas",
               SUM(cm.spend) as "totalSpend", COUNT(*)::int as cnt
        FROM "CampaignMetric" cm
        WHERE cm.roas IS NOT NULL AND cm.roas > 0 AND cm.roas < 500 AND cm.spend > 0
        GROUP BY EXTRACT(YEAR FROM cm.date)
        HAVING COUNT(*) >= 20
        ORDER BY EXTRACT(YEAR FROM cm.date) ASC
      `;
      if (yearlyRoas.length >= 2) {
        const first = yearlyRoas[0];
        const last = yearlyRoas[yearlyRoas.length - 1];
        const trend = last.avgRoas > first.avgRoas ? "improving" : "declining";
        const change = Math.abs(((last.avgRoas - first.avgRoas) / Math.max(first.avgRoas, 0.1)) * 100);
        const yearList = yearlyRoas.map((y: any) => `${y.year}: ${fmtDec(y.avgRoas)}x`).join(", ");
        insights.push({
          text: `Year-over-year ROAS is ${trend} — ${yearList}. ${trend === "declining" ? "Investigate rising CPCs or audience fatigue" : "Your optimization efforts are paying off"}`,
          category: "performance",
          impact: change > 20 ? "high" : "medium",
          metric: `${fmtDec(change)}% ${trend}`,
          learnedFrom: `${fmt(yearlyRoas.reduce((s: number, y: any) => s + y.cnt, 0))} daily metrics across ${yearlyRoas.length} years`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Weekend vs weekday ---
    try {
      const dayTypeRoas = await db.$queryRaw<Array<{ dayType: string; avgRoas: number; avgCtr: number; cnt: number }>>`
        SELECT
          CASE WHEN EXTRACT(DOW FROM cm.date) IN (0, 6) THEN 'Weekend' ELSE 'Weekday' END as "dayType",
          AVG(cm.roas) as "avgRoas", AVG(cm.ctr) as "avgCtr", COUNT(*)::int as cnt
        FROM "CampaignMetric" cm
        WHERE cm.roas IS NOT NULL AND cm.roas > 0 AND cm.roas < 500 AND cm.spend > 0
        GROUP BY CASE WHEN EXTRACT(DOW FROM cm.date) IN (0, 6) THEN 'Weekend' ELSE 'Weekday' END
      `;
      if (dayTypeRoas.length === 2) {
        const weekend = dayTypeRoas.find((d: any) => d.dayType === 'Weekend');
        const weekday = dayTypeRoas.find((d: any) => d.dayType === 'Weekday');
        if (weekend && weekday) {
          const better = weekend.avgRoas > weekday.avgRoas ? 'Weekends' : 'Weekdays';
          const betterRoas = Math.max(weekend.avgRoas, weekday.avgRoas);
          const worseRoas = Math.min(weekend.avgRoas, weekday.avgRoas);
          const diffPct = ((betterRoas - worseRoas) / Math.max(worseRoas, 0.1)) * 100;
          if (diffPct > 3) {
            insights.push({
              text: `${better} deliver ${fmtDec(betterRoas)}x ROAS vs ${fmtDec(worseRoas)}x — consider ${better === 'Weekends' ? 'increasing' : 'decreasing'} weekend budgets by ${fmtDec(diffPct)}%`,
              category: "timing",
              impact: Math.abs(betterRoas - worseRoas) > 1 ? "high" : "medium",
              metric: `${fmtDec(betterRoas)}x ${better.toLowerCase()}`,
              learnedFrom: `${fmt(weekend.cnt + weekday.cnt)} daily metrics`,
              learnedAt: now,
            });
          }
        }
      }
    } catch (e) { /* skip */ }

    // --- Insight: Budget concentration (Pareto) ---
    try {
      const paretoData = await db.$queryRaw<Array<{ topPct: number; totalBudget: number }>>`
        WITH ranked AS (
          SELECT c.name, SUM(co.spend) as camp_spend,
                 NTILE(10) OVER (ORDER BY SUM(co.spend) DESC) as decile
          FROM "CampaignOutcome" co
          JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
          WHERE co.spend > 0
          GROUP BY c.name
        )
        SELECT
          (SELECT SUM(camp_spend) FROM ranked WHERE decile = 1) as "topPct",
          (SELECT SUM(camp_spend) FROM ranked) as "totalBudget"
      `;
      if (paretoData.length > 0 && paretoData[0].totalBudget > 0) {
        const pct = (paretoData[0].topPct / paretoData[0].totalBudget) * 100;
        insights.push({
          text: `Top 10% of campaigns consume ${fmtDec(pct)}% of total ad budget. ${pct > 70 ? "Heavy concentration — diversify or you risk single points of failure" : "Budget is relatively well distributed"}`,
          category: "budget",
          impact: pct > 60 ? "high" : "medium",
          metric: `${fmtDec(pct)}% concentrated`,
          learnedFrom: `all campaign spend data`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Campaigns with negative ROI ---
    try {
      const negativeRoi = await db.$queryRaw<Array<{ campCount: number; wastedSpend: number; totalSpend: number }>>`
        WITH camp_roas AS (
          SELECT c.name, AVG(co.roas) as avg_roas, SUM(co.spend) as total_spend
          FROM "CampaignOutcome" co
          JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
          WHERE co.spend > 0 AND co.roas IS NOT NULL
          GROUP BY c.name
          HAVING COUNT(*) >= 3
        )
        SELECT COUNT(*)::int as "campCount", SUM(total_spend) as "wastedSpend",
               (SELECT SUM(total_spend) FROM camp_roas) as "totalSpend"
        FROM camp_roas WHERE avg_roas < 1.0
      `;
      if (negativeRoi.length > 0 && negativeRoi[0].campCount > 0) {
        const nr = negativeRoi[0];
        const pct = (nr.wastedSpend / Math.max(nr.totalSpend, 1)) * 100;
        insights.push({
          text: `${fmt(nr.campCount)} campaigns have a ROAS below 1.0x — losing money. They account for ₹${fmt(nr.wastedSpend)} (${fmtDec(pct)}% of total spend). Pause or restructure these immediately`,
          category: "budget",
          impact: "high",
          metric: `₹${fmt(nr.wastedSpend)} at risk`,
          learnedFrom: `campaigns with 3+ data points`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Optimal daily budget range ---
    try {
      const budgetBuckets = await db.$queryRaw<Array<{ bucket: string; avgRoas: number; cnt: number }>>`
        SELECT
          CASE
            WHEN cm.spend < 500 THEN 'Under ₹500'
            WHEN cm.spend < 2000 THEN '₹500–2K'
            WHEN cm.spend < 5000 THEN '₹2K–5K'
            WHEN cm.spend < 10000 THEN '₹5K–10K'
            WHEN cm.spend < 25000 THEN '₹10K–25K'
            ELSE 'Over ₹25K'
          END as bucket,
          AVG(cm.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignMetric" cm
        WHERE cm.roas IS NOT NULL AND cm.roas > 0 AND cm.roas < 500 AND cm.spend > 0
        GROUP BY 1
        HAVING COUNT(*) >= 20
        ORDER BY AVG(cm.roas) DESC
      `;
      if (budgetBuckets.length >= 3) {
        const best = budgetBuckets[0];
        insights.push({
          text: `The ${best.bucket}/day spend range delivers the best ROAS at ${fmtDec(best.avgRoas)}x. Campaigns outside this range underperform — calibrate your daily budgets accordingly`,
          category: "budget",
          impact: "high",
          metric: `${fmtDec(best.avgRoas)}x optimal ROAS`,
          learnedFrom: `${fmt(budgetBuckets.reduce((s: number, b: any) => s + b.cnt, 0))} daily metric entries`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Gender-based campaigns ---
    try {
      const genderPerf = await db.$queryRaw<Array<{ gender: string; avgRoas: number; totalSpend: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%_men_%' OR c.name ILIKE '%_male%' OR c.name ILIKE '% men %' OR c.name ILIKE '%_Men_%' THEN 'Men'
            WHEN c.name ILIKE '%_women_%' OR c.name ILIKE '%_female%' OR c.name ILIKE '% women %' OR c.name ILIKE '%_Woman_%' THEN 'Women'
            ELSE NULL
          END as gender,
          AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
        HAVING COUNT(*) >= 5
        ORDER BY AVG(co.roas) DESC
      `;
      const validGender = genderPerf.filter((g: any) => g.gender != null);
      if (validGender.length === 2) {
        const better = validGender[0];
        const worse = validGender[1];
        insights.push({
          text: `${better.gender}'s campaigns outperform at ${fmtDec(better.avgRoas)}x ROAS vs ${worse.gender}'s at ${fmtDec(worse.avgRoas)}x. ${better.gender}'s audience converts more efficiently`,
          category: "audience",
          impact: "medium",
          metric: `${fmtDec(better.avgRoas)}x ${better.gender}`,
          learnedFrom: `${fmt(better.cnt + worse.cnt)} gender-targeted outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Interest vs LAL vs Broad targeting ---
    try {
      const targetingPerf = await db.$queryRaw<Array<{ targeting: string; avgRoas: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%LAL%' OR c.name ILIKE '%lookalike%' OR c.name ILIKE '%lkl%' OR c.name ILIKE '%similar%' THEN 'Lookalike'
            WHEN c.name ILIKE '%interest%' OR c.name ILIKE '%int0%' OR c.name ILIKE '%beh0%' THEN 'Interest/Behavior'
            WHEN c.name ILIKE '%broad%' OR c.name ILIKE '%open%' OR c.name ILIKE '%prospecting%' THEN 'Broad/Prospecting'
            WHEN c.name ILIKE '%retarget%' OR c.name ILIKE '%remarketing%' OR c.name ILIKE '%visitor%' OR c.name ILIKE '%viewer%' THEN 'Retargeting'
            ELSE NULL
          END as targeting,
          AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
        HAVING COUNT(*) >= 5
        ORDER BY AVG(co.roas) DESC
      `;
      const validTargeting = targetingPerf.filter((t: any) => t.targeting != null);
      if (validTargeting.length >= 2) {
        const ranking = validTargeting.map((t: any) => `${t.targeting} (${fmtDec(t.avgRoas)}x)`).join(" > ");
        insights.push({
          text: `Targeting hierarchy: ${ranking}. ${validTargeting[0].targeting} targeting is your most efficient audience strategy`,
          category: "audience",
          impact: "high",
          metric: `${fmtDec(validTargeting[0].avgRoas)}x best targeting`,
          learnedFrom: `${fmt(validTargeting.reduce((s: number, t: any) => s + t.cnt, 0))} targeted campaign outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Video vs non-video ---
    try {
      const videoPerf = await db.$queryRaw<Array<{ isVideo: boolean; avgRoas: number; avgCtr: number; cnt: number }>>`
        SELECT
          (c.name ILIKE '%video%' OR c.name ILIKE '%trueview%' OR c.name ILIKE '%VAC%' OR c.name ILIKE '%reels%' OR c.name ILIKE '%thruplay%' OR c.name ILIKE '%instream%') as "isVideo",
          AVG(co.roas) as "avgRoas", AVG(co.ctr) as "avgCtr", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
      `;
      if (videoPerf.length === 2) {
        const vid = videoPerf.find((v: any) => v.isVideo);
        const nonVid = videoPerf.find((v: any) => !v.isVideo);
        if (vid && nonVid) {
          const better = vid.avgRoas > nonVid.avgRoas ? "Video" : "Static/image";
          const betterRoas = Math.max(vid.avgRoas, nonVid.avgRoas);
          const worseRoas = Math.min(vid.avgRoas, nonVid.avgRoas);
          insights.push({
            text: `${better} campaigns outperform at ${fmtDec(betterRoas)}x ROAS vs ${fmtDec(worseRoas)}x. ${vid.avgRoas > nonVid.avgRoas ? "Invest more in video creative production" : "Static creatives are more efficient for conversions"}`,
            category: "creative",
            impact: Math.abs(vid.avgRoas - nonVid.avgRoas) > 2 ? "high" : "medium",
            metric: `${fmtDec(betterRoas)}x ${better.toLowerCase()}`,
            learnedFrom: `${fmt(vid.cnt)} video + ${fmt(nonVid.cnt)} non-video outcomes`,
            learnedAt: now,
          });
        }
      }
    } catch (e) { /* skip */ }

    // --- Insight: Google Shopping feed health ---
    try {
      const shoppingHealth = await db.$queryRaw<Array<{ totalShopping: number; lowRoas: number; avgRoas: number }>>`
        SELECT COUNT(DISTINCT c.name)::int as "totalShopping",
               COUNT(DISTINCT CASE WHEN co.roas < 2 THEN c.name END)::int as "lowRoas",
               AVG(co.roas) as "avgRoas"
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE (c.name ILIKE '%shopping%' OR c.name ILIKE '%StandardShopping%')
          AND co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
      `;
      if (shoppingHealth.length > 0 && shoppingHealth[0].totalShopping > 0) {
        const sh = shoppingHealth[0];
        const pct = (sh.lowRoas / sh.totalShopping) * 100;
        insights.push({
          text: `${fmtDec(pct)}% of Shopping campaigns (${sh.lowRoas} out of ${sh.totalShopping}) have ROAS below 2x. ${pct > 50 ? "Feed optimization needed — titles, images, pricing" : "Shopping feed is generally healthy"}`,
          category: "performance",
          impact: pct > 50 ? "high" : "low",
          metric: `${fmtDec(pct)}% underperforming`,
          learnedFrom: `${sh.totalShopping} Shopping campaigns`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Meta Advantage+ (AAA/ASC) vs manual ---
    try {
      const advantagePerf = await db.$queryRaw<Array<{ isAdvantage: boolean; avgRoas: number; cnt: number }>>`
        SELECT
          (c.name ILIKE '%AAA%' OR c.name ILIKE '%ASC%' OR c.name ILIKE '%Advantage%') as "isAdvantage",
          AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500 AND c.platform = 'META'
        GROUP BY 1
      `;
      if (advantagePerf.length === 2) {
        const adv = advantagePerf.find((a: any) => a.isAdvantage);
        const manual = advantagePerf.find((a: any) => !a.isAdvantage);
        if (adv && manual) {
          const ratio = adv.avgRoas / Math.max(manual.avgRoas, 0.1);
          insights.push({
            text: `Meta Advantage+ (AAA/ASC) campaigns deliver ${fmtDec(adv.avgRoas)}x ROAS vs ${fmtDec(manual.avgRoas)}x for manual campaigns — ${ratio > 1 ? "automation is winning" : "manual setup still outperforms AI optimization"}`,
            category: "performance",
            impact: Math.abs(ratio - 1) > 0.3 ? "high" : "medium",
            metric: `${fmtDec(adv.avgRoas)}x Advantage+`,
            learnedFrom: `${fmt(adv.cnt)} Advantage+ + ${fmt(manual.cnt)} manual Meta outcomes`,
            learnedAt: now,
          });
        }
      }
    } catch (e) { /* skip */ }

    // --- Insight: PMax trajectory over time ---
    try {
      const pmaxTrend = await db.$queryRaw<Array<{ month: string; avgRoas: number; cnt: number }>>`
        SELECT TO_CHAR(cm.date, 'YYYY-MM') as month, AVG(cm.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignMetric" cm
        JOIN "Campaign" c ON cm."campaignId" = c.id
        WHERE (c.name ILIKE '%PMax%' OR c.name ILIKE '%Performance Max%')
          AND cm.roas IS NOT NULL AND cm.roas > 0 AND cm.roas < 500
        GROUP BY TO_CHAR(cm.date, 'YYYY-MM')
        HAVING COUNT(*) >= 5
        ORDER BY TO_CHAR(cm.date, 'YYYY-MM') ASC
      `;
      if (pmaxTrend.length >= 3) {
        const first3 = pmaxTrend.slice(0, 3);
        const last3 = pmaxTrend.slice(-3);
        const earlyAvg = first3.reduce((s: number, m: any) => s + m.avgRoas, 0) / first3.length;
        const lateAvg = last3.reduce((s: number, m: any) => s + m.avgRoas, 0) / last3.length;
        const trend = lateAvg > earlyAvg ? "improving" : "declining";
        insights.push({
          text: `PMax campaigns are ${trend}: early months averaged ${fmtDec(earlyAvg)}x ROAS, recent months ${fmtDec(lateAvg)}x. ${trend === "declining" ? "PMax may be exhausting your audience — refresh asset groups" : "Google's algorithm is learning well from your data"}`,
          category: "performance",
          impact: "medium",
          metric: `${fmtDec(earlyAvg)}x → ${fmtDec(lateAvg)}x`,
          learnedFrom: `${fmt(pmaxTrend.reduce((s: number, m: any) => s + m.cnt, 0))} PMax daily metrics`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: CTR by platform ---
    try {
      const ctrByPlatform = await db.$queryRaw<Array<{ platform: string; avgCtr: number; cnt: number }>>`
        SELECT co.platform, AVG(co.ctr) as "avgCtr", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        WHERE co.ctr IS NOT NULL AND co.ctr > 0 AND co.ctr < 50
        GROUP BY co.platform
      `;
      if (ctrByPlatform.length === 2) {
        const sorted = ctrByPlatform.sort((a: any, b: any) => b.avgCtr - a.avgCtr);
        insights.push({
          text: `${sorted[0].platform} gets ${fmtDec(sorted[0].avgCtr)}% CTR vs ${sorted[1].platform}'s ${fmtDec(sorted[1].avgCtr)}%. ${sorted[0].platform === 'META' ? "Meta's visual format drives more clicks" : "Google's intent-based targeting drives higher click-through"}`,
          category: "performance",
          impact: "medium",
          metric: `${fmtDec(sorted[0].avgCtr)}% vs ${fmtDec(sorted[1].avgCtr)}%`,
          learnedFrom: `${fmt(sorted[0].cnt + sorted[1].cnt)} campaign outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Conversion rate by campaign type ---
    try {
      const convRateByType = await db.$queryRaw<Array<{ campType: string; convRate: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%StandardShopping%' OR c.name ILIKE '%shopping%' THEN 'Shopping'
            WHEN c.name ILIKE '%PMax%' THEN 'PMax'
            WHEN c.name ILIKE '%Search%' OR c.name ILIKE '%GSB%' OR c.name ILIKE '%GSNB%' OR c.name ILIKE '%DSA%' THEN 'Search'
            WHEN c.name ILIKE '%DPA%' OR c.name ILIKE '%NDPA%' THEN 'DPA'
            WHEN c.name ILIKE '%UAC%' THEN 'UAC'
            WHEN c.name ILIKE '%AAA%' OR c.name ILIKE '%ASC%' THEN 'Advantage+'
            ELSE NULL
          END as "campType",
          CASE WHEN SUM(co.clicks) > 0 THEN SUM(co.conversions)::float / SUM(co.clicks) * 100 ELSE 0 END as "convRate",
          COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.clicks > 0 AND co.conversions IS NOT NULL
        GROUP BY 1
        HAVING COUNT(*) >= 10 AND SUM(co.clicks) > 100
        ORDER BY 2 DESC
      `;
      const validConvTypes = convRateByType.filter((t: any) => t.campType != null);
      if (validConvTypes.length >= 2) {
        const best = validConvTypes[0];
        const worst = validConvTypes[validConvTypes.length - 1];
        insights.push({
          text: `${best.campType} campaigns convert ${fmtDec(best.convRate)}% of clicks — ${fmtDec(best.convRate / Math.max(worst.convRate, 0.01))}x better than ${worst.campType} (${fmtDec(worst.convRate)}%)`,
          category: "performance",
          impact: "high",
          metric: `${fmtDec(best.convRate)}% CVR`,
          learnedFrom: `${fmt(validConvTypes.reduce((s: number, t: any) => s + t.cnt, 0))} campaign outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Revenue per click by platform ---
    try {
      const rpcByPlatform = await db.$queryRaw<Array<{ platform: string; rpc: number; cnt: number }>>`
        SELECT co.platform,
               CASE WHEN SUM(co.clicks) > 0 THEN SUM(co.revenue) / SUM(co.clicks) ELSE 0 END as rpc,
               COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        WHERE co.clicks > 0 AND co.revenue > 0
        GROUP BY co.platform
      `;
      if (rpcByPlatform.length === 2) {
        const sorted = rpcByPlatform.sort((a: any, b: any) => b.rpc - a.rpc);
        insights.push({
          text: `Each click on ${sorted[0].platform} generates ₹${fmt(sorted[0].rpc)} in revenue vs ₹${fmt(sorted[1].rpc)} on ${sorted[1].platform}. ${sorted[0].platform} attracts higher-intent shoppers`,
          category: "performance",
          impact: "medium",
          metric: `₹${fmt(sorted[0].rpc)} per click`,
          learnedFrom: `${fmt(sorted[0].cnt + sorted[1].cnt)} campaign outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Total spend analyzed (scale) ---
    try {
      const scaleStats = await db.$queryRaw<Array<{ totalSpend: number; totalRevenue: number; campCount: number; monthSpan: number; overallRoas: number }>>`
        SELECT SUM(co.spend) as "totalSpend", SUM(co.revenue) as "totalRevenue",
               COUNT(DISTINCT c.name)::int as "campCount",
               (EXTRACT(YEAR FROM MAX(co."dateEnd")) - EXTRACT(YEAR FROM MIN(co."dateStart"))) * 12
                 + EXTRACT(MONTH FROM MAX(co."dateEnd")) - EXTRACT(MONTH FROM MIN(co."dateStart")) as "monthSpan",
               CASE WHEN SUM(co.spend) > 0 THEN SUM(co.revenue) / SUM(co.spend) ELSE 0 END as "overallRoas"
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.spend > 0
      `;
      if (scaleStats.length > 0 && scaleStats[0].totalSpend > 0) {
        const ss = scaleStats[0];
        const spendCr = ss.totalSpend / 10000000;
        const revCr = ss.totalRevenue / 10000000;
        insights.push({
          text: `Total analyzed: ₹${fmtDec(spendCr)} Cr spent across ${fmt(ss.campCount)} campaigns over ~${fmt(ss.monthSpan)} months, generating ₹${fmtDec(revCr)} Cr revenue at ${fmtDec(ss.overallRoas)}x blended ROAS`,
          category: "performance",
          impact: "medium",
          metric: `₹${fmtDec(spendCr)} Cr analyzed`,
          learnedFrom: `${fmt(outcomeCount)} campaign outcome records`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Frequency vs ROAS correlation ---
    try {
      const freqBuckets = await db.$queryRaw<Array<{ freqBucket: string; avgRoas: number; cnt: number }>>`
        SELECT
          CASE
            WHEN cm.frequency < 2 THEN 'Low (< 2)'
            WHEN cm.frequency < 5 THEN 'Medium (2–5)'
            WHEN cm.frequency < 10 THEN 'High (5–10)'
            ELSE 'Very High (10+)'
          END as "freqBucket",
          AVG(cm.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignMetric" cm
        WHERE cm.frequency IS NOT NULL AND cm.frequency > 0
          AND cm.roas IS NOT NULL AND cm.roas > 0 AND cm.roas < 500
        GROUP BY 1
        HAVING COUNT(*) >= 10
        ORDER BY AVG(cm.roas) DESC
      `;
      if (freqBuckets.length >= 2) {
        const best = freqBuckets[0];
        const worst = freqBuckets[freqBuckets.length - 1];
        insights.push({
          text: `${best.freqBucket} frequency delivers ${fmtDec(best.avgRoas)}x ROAS, while ${worst.freqBucket} drops to ${fmtDec(worst.avgRoas)}x. ${worst.freqBucket === 'Very High (10+)' ? "Audience fatigue kicks in after 10 impressions" : "Watch your frequency caps"}`,
          category: "audience",
          impact: "high",
          metric: `${fmtDec(best.avgRoas)}x optimal freq`,
          learnedFrom: `${fmt(freqBuckets.reduce((s: number, f: any) => s + f.cnt, 0))} daily metrics with frequency data`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Day of week performance ---
    try {
      const dowPerf = await db.$queryRaw<Array<{ dow: number; dayName: string; avgRoas: number; cnt: number }>>`
        SELECT EXTRACT(DOW FROM cm.date)::int as dow,
               CASE EXTRACT(DOW FROM cm.date)::int
                 WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
                 WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday' WHEN 6 THEN 'Saturday'
               END as "dayName",
               AVG(cm.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignMetric" cm
        WHERE cm.roas IS NOT NULL AND cm.roas > 0 AND cm.roas < 500 AND cm.spend > 0
        GROUP BY 1, 2
        ORDER BY AVG(cm.roas) DESC
      `;
      if (dowPerf.length >= 5) {
        const best = dowPerf[0];
        const worst = dowPerf[dowPerf.length - 1];
        insights.push({
          text: `${best.dayName} is the highest-performing day at ${fmtDec(best.avgRoas)}x ROAS, while ${worst.dayName} is the weakest at ${fmtDec(worst.avgRoas)}x. Use day-parting to shift budget toward ${best.dayName}s`,
          category: "timing",
          impact: "medium",
          metric: `${fmtDec(best.avgRoas)}x on ${best.dayName}`,
          learnedFrom: `${fmt(dowPerf.reduce((s: number, d: any) => s + d.cnt, 0))} daily metrics`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: DPA retargeting window comparison ---
    try {
      const retargetWindow = await db.$queryRaw<Array<{ window: string; avgRoas: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%7d%' OR c.name ILIKE '%7day%' THEN '7-day'
            WHEN c.name ILIKE '%14d%' OR c.name ILIKE '%14day%' THEN '14-day'
            WHEN c.name ILIKE '%30d%' OR c.name ILIKE '%30day%' THEN '30-day'
            WHEN c.name ILIKE '%180%' THEN '180-day'
            WHEN c.name ILIKE '%Visitor%' OR c.name ILIKE '%visitor%' THEN 'Visitor retarget'
            WHEN c.name ILIKE '%A2C%' OR c.name ILIKE '%ATC%' OR c.name ILIKE '%cart%' THEN 'Cart retarget'
            WHEN c.name ILIKE '%purchas%' OR c.name ILIKE '%buyer%' THEN 'Purchaser retarget'
            ELSE NULL
          END as window,
          AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
          AND (c.name ILIKE '%retarget%' OR c.name ILIKE '%remarketing%' OR c.name ILIKE '%DPA%'
               OR c.name ILIKE '%visitor%' OR c.name ILIKE '%ATC%' OR c.name ILIKE '%A2C%' OR c.name ILIKE '%purchas%')
        GROUP BY 1
        HAVING COUNT(*) >= 3
        ORDER BY AVG(co.roas) DESC
      `;
      const validWindows = retargetWindow.filter((w: any) => w.window != null);
      if (validWindows.length >= 2) {
        const best = validWindows[0];
        const ranking = validWindows.map((w: any) => `${w.window} (${fmtDec(w.avgRoas)}x)`).join(", ");
        insights.push({
          text: `Retargeting performance: ${ranking}. ${best.window} audiences deliver the best returns — prioritize this segment`,
          category: "audience",
          impact: "high",
          metric: `${fmtDec(best.avgRoas)}x best retarget`,
          learnedFrom: `${fmt(validWindows.reduce((s: number, w: any) => s + w.cnt, 0))} retargeting outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Catalog rush / flash sale performance ---
    try {
      const flashPerf = await db.$queryRaw<Array<{ isFlash: boolean; avgRoas: number; cnt: number }>>`
        SELECT
          (c.name ILIKE '%flash%' OR c.name ILIKE '%rush%' OR c.name ILIKE '%closetweek%') as "isFlash",
          AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
      `;
      if (flashPerf.length === 2) {
        const flash = flashPerf.find((f: any) => f.isFlash);
        const normal = flashPerf.find((f: any) => !f.isFlash);
        if (flash && normal && flash.cnt >= 3) {
          insights.push({
            text: `Flash sale / rush campaigns average ${fmtDec(flash.avgRoas)}x ROAS vs ${fmtDec(normal.avgRoas)}x for regular campaigns. ${flash.avgRoas > normal.avgRoas ? "Urgency-driven campaigns punch above their weight" : "Flash sales cannibalize margin — use sparingly"}`,
            category: "timing",
            impact: "medium",
            metric: `${fmtDec(flash.avgRoas)}x flash ROAS`,
            learnedFrom: `${fmt(flash.cnt)} flash + ${fmt(normal.cnt)} regular outcomes`,
            learnedAt: now,
          });
        }
      }
    } catch (e) { /* skip */ }

    // --- Insight: Watches / Eyewear / Footwear category performance ---
    try {
      const categoryPerf = await db.$queryRaw<Array<{ category: string; avgRoas: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%watch%' THEN 'Watches'
            WHEN c.name ILIKE '%eyewear%' OR c.name ILIKE '%eyeswear%' THEN 'Eyewear'
            WHEN c.name ILIKE '%footwear%' OR c.name ILIKE '%shoe%' THEN 'Footwear'
            WHEN c.name ILIKE '%backpack%' OR c.name ILIKE '%bag%' THEN 'Bags & Backpacks'
            WHEN c.name ILIKE '%shirt%' OR c.name ILIKE '%tshirt%' OR c.name ILIKE '%tops%' THEN 'Apparel'
            ELSE NULL
          END as category,
          AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
        HAVING COUNT(*) >= 3
        ORDER BY AVG(co.roas) DESC
      `;
      const validCats = categoryPerf.filter((c: any) => c.category != null);
      if (validCats.length >= 2) {
        const ranking = validCats.map((c: any) => `${c.category} (${fmtDec(c.avgRoas)}x)`).join(", ");
        insights.push({
          text: `Product category ROAS: ${ranking}. Lead with ${validCats[0].category} in your campaigns for best returns`,
          category: "creative",
          impact: "high",
          metric: `${fmtDec(validCats[0].avgRoas)}x best category`,
          learnedFrom: `${fmt(validCats.reduce((s: number, c: any) => s + c.cnt, 0))} category-specific outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Install campaigns (UAC) performance ---
    try {
      const uacPerf = await db.$queryRaw<Array<{ uacType: string; avgRoas: number; totalSpend: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%UACi%' OR c.name ILIKE '%UAC 1%' OR c.name ILIKE '%UAC - iOS%' OR c.name ILIKE '%UAC - Android%' OR c.name ILIKE '%UAC_Install%' THEN 'UAC Install'
            WHEN c.name ILIKE '%UACe%' OR c.name ILIKE '%UAC 2%' OR c.name ILIKE '%UAC Engagement%' THEN 'UAC Engagement'
            ELSE NULL
          END as "uacType",
          AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
          AND c.name ILIKE '%UAC%'
        GROUP BY 1
        HAVING COUNT(*) >= 3
        ORDER BY AVG(co.roas) DESC
      `;
      const validUac = uacPerf.filter((u: any) => u.uacType != null);
      if (validUac.length >= 2) {
        const best = validUac[0];
        const worst = validUac[validUac.length - 1];
        insights.push({
          text: `${best.uacType} campaigns return ${fmtDec(best.avgRoas)}x ROAS vs ${worst.uacType} at ${fmtDec(worst.avgRoas)}x. ${best.uacType === 'UAC Engagement' ? "Re-engaging existing app users is more profitable than acquiring new ones" : "New user acquisition drives better long-term value"}`,
          category: "audience",
          impact: "medium",
          metric: `${fmtDec(best.avgRoas)}x ${best.uacType}`,
          learnedFrom: `${fmt(validUac.reduce((s: number, u: any) => s + u.cnt, 0))} UAC outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: DemGen (Demand Gen) performance ---
    try {
      const demgenPerf = await db.$queryRaw<Array<{ isDemGen: boolean; avgRoas: number; cnt: number }>>`
        SELECT
          (c.name ILIKE '%DemGen%' OR c.name ILIKE '%Demand Gen%') as "isDemGen",
          AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
      `;
      if (demgenPerf.length === 2) {
        const dg = demgenPerf.find((d: any) => d.isDemGen);
        const other = demgenPerf.find((d: any) => !d.isDemGen);
        if (dg && other && dg.cnt >= 3) {
          insights.push({
            text: `Demand Gen campaigns average ${fmtDec(dg.avgRoas)}x ROAS vs ${fmtDec(other.avgRoas)}x for other formats. ${dg.avgRoas > other.avgRoas ? "Google's Demand Gen is earning its keep" : "Demand Gen underperforms — consider reallocating to Search or Shopping"}`,
            category: "performance",
            impact: "medium",
            metric: `${fmtDec(dg.avgRoas)}x DemGen`,
            learnedFrom: `${fmt(dg.cnt)} Demand Gen + ${fmt(other.cnt)} other outcomes`,
            learnedAt: now,
          });
        }
      }
    } catch (e) { /* skip */ }

    // --- Insight: Prediction accuracy by signal type ---
    try {
      const predBySignal = await db.$queryRaw<Array<{ signalType: string; avgAcc: number; cnt: number }>>`
        SELECT "signalType", AVG(accuracy) as "avgAcc", COUNT(*)::int as cnt
        FROM "PredictionEval"
        WHERE accuracy IS NOT NULL
        GROUP BY "signalType"
        HAVING COUNT(*) >= 5
        ORDER BY AVG(accuracy) DESC
      `;
      if (predBySignal.length >= 2) {
        const best = predBySignal[0];
        const worst = predBySignal[predBySignal.length - 1];
        insights.push({
          text: `Prediction accuracy varies by signal: ${best.signalType.replace(/_/g, " ")} predictions are ${Math.round(best.avgAcc * 100)}% accurate, while ${worst.signalType.replace(/_/g, " ")} is only ${Math.round(worst.avgAcc * 100)}%. Trust ${best.signalType.replace(/_/g, " ")} recommendations more`,
          category: "performance",
          impact: "medium",
          metric: `${Math.round(best.avgAcc * 100)}% best accuracy`,
          learnedFrom: `${fmt(predBySignal.reduce((s: number, p: any) => s + p.cnt, 0))} predictions evaluated`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Reach campaigns efficiency ---
    try {
      const reachEff = await db.$queryRaw<Array<{ isReach: boolean; avgCtr: number; avgCpc: number; cnt: number }>>`
        SELECT
          (c.name ILIKE '%reach%') as "isReach",
          AVG(cm.ctr) as "avgCtr", AVG(cm.cpc) as "avgCpc", COUNT(*)::int as cnt
        FROM "CampaignMetric" cm
        JOIN "Campaign" c ON cm."campaignId" = c.id
        WHERE cm.ctr IS NOT NULL AND cm.ctr > 0 AND cm.cpc IS NOT NULL AND cm.cpc > 0
        GROUP BY 1
        HAVING COUNT(*) >= 10
      `;
      if (reachEff.length === 2) {
        const reach = reachEff.find((r: any) => r.isReach);
        const other = reachEff.find((r: any) => !r.isReach);
        if (reach && other) {
          insights.push({
            text: `Reach campaigns get ${fmtDec(reach.avgCtr)}% CTR at ₹${fmtDec(reach.avgCpc)} CPC vs ${fmtDec(other.avgCtr)}% CTR at ₹${fmtDec(other.avgCpc)} CPC for other campaigns. ${reach.avgCpc < other.avgCpc ? "Reach is cheap awareness" : "Reach campaigns are expensive for the engagement they drive"}`,
            category: "budget",
            impact: "low",
            metric: `${fmtDec(reach.avgCtr)}% reach CTR`,
            learnedFrom: `${fmt(reach.cnt)} reach + ${fmt(other.cnt)} other metric entries`,
            learnedAt: now,
          });
        }
      }
    } catch (e) { /* skip */ }

    // --- Insight: Vibrant (agency) campaigns performance ---
    try {
      const vibrantPerf = await db.$queryRaw<Array<{ isVibrant: boolean; avgRoas: number; totalSpend: number; cnt: number }>>`
        SELECT
          (c.name ILIKE '%vibrant%' OR c.name ILIKE '%vib_%') as "isVibrant",
          AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
      `;
      if (vibrantPerf.length === 2) {
        const vib = vibrantPerf.find((v: any) => v.isVibrant);
        const other = vibrantPerf.find((v: any) => !v.isVibrant);
        if (vib && other && vib.cnt >= 10) {
          insights.push({
            text: `Vibrant-managed campaigns deliver ${fmtDec(vib.avgRoas)}x ROAS vs ${fmtDec(other.avgRoas)}x for other campaigns. ${vib.avgRoas > other.avgRoas ? "The agency's expertise shows in performance" : "In-house campaigns outperform agency-managed ones"}`,
            category: "performance",
            impact: "medium",
            metric: `${fmtDec(vib.avgRoas)}x Vibrant ROAS`,
            learnedFrom: `${fmt(vib.cnt)} Vibrant + ${fmt(other.cnt)} other outcomes`,
            learnedAt: now,
          });
        }
      }
    } catch (e) { /* skip */ }

    // --- Insight: App vs Web campaigns ---
    try {
      const appWebPerf = await db.$queryRaw<Array<{ channel: string; avgRoas: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%app%' OR c.name ILIKE '%UAC%' OR c.name ILIKE '%install%' THEN 'App'
            WHEN c.name ILIKE '%web%' OR c.name ILIKE '%search%' OR c.name ILIKE '%shopping%' THEN 'Web'
            ELSE NULL
          END as channel,
          AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
        HAVING COUNT(*) >= 10
        ORDER BY AVG(co.roas) DESC
      `;
      const validChannels = appWebPerf.filter((c: any) => c.channel != null);
      if (validChannels.length === 2) {
        const better = validChannels[0];
        const worse = validChannels[1];
        insights.push({
          text: `${better.channel} campaigns outperform at ${fmtDec(better.avgRoas)}x ROAS vs ${worse.channel} at ${fmtDec(worse.avgRoas)}x. ${better.channel === 'App' ? "App users are more valuable — invest in install + engagement" : "Web traffic converts better — focus on web-first funnels"}`,
          category: "audience",
          impact: "medium",
          metric: `${fmtDec(better.avgRoas)}x ${better.channel}`,
          learnedFrom: `${fmt(better.cnt + worse.cnt)} channel-specific outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Seasonal sale event comparison (EOSS vs BFS vs BBS vs AASS) ---
    try {
      const saleEvents = await db.$queryRaw<Array<{ saleEvent: string; avgRoas: number; totalSpend: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%EOSS%' THEN 'EOSS'
            WHEN c.name ILIKE '%BFS%' OR c.name ILIKE '%black%friday%' THEN 'Black Friday (BFS)'
            WHEN c.name ILIKE '%BBS%' THEN 'BBS'
            WHEN c.name ILIKE '%AASS%' THEN 'AASS'
            ELSE NULL
          END as "saleEvent",
          AVG(co.roas) as "avgRoas", SUM(co.spend) as "totalSpend", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
        HAVING COUNT(*) >= 3
        ORDER BY AVG(co.roas) DESC
      `;
      const validEvents = saleEvents.filter((e: any) => e.saleEvent != null);
      if (validEvents.length >= 2) {
        const ranking = validEvents.map((e: any) => `${e.saleEvent} (${fmtDec(e.avgRoas)}x)`).join(", ");
        insights.push({
          text: `Sale event ROAS ranking: ${ranking}. Double down on ${validEvents[0].saleEvent} and reconsider heavy investment in ${validEvents[validEvents.length - 1].saleEvent}`,
          category: "timing",
          impact: "high",
          metric: `${fmtDec(validEvents[0].avgRoas)}x best sale event`,
          learnedFrom: `${fmt(validEvents.reduce((s: number, e: any) => s + e.cnt, 0))} sale campaign outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: CPC trend over time ---
    try {
      const cpcTrend = await db.$queryRaw<Array<{ year: number; avgCpc: number; cnt: number }>>`
        SELECT EXTRACT(YEAR FROM cm.date)::int as year, AVG(cm.cpc) as "avgCpc", COUNT(*)::int as cnt
        FROM "CampaignMetric" cm
        WHERE cm.cpc IS NOT NULL AND cm.cpc > 0 AND cm.cpc < 500
        GROUP BY EXTRACT(YEAR FROM cm.date)
        HAVING COUNT(*) >= 20
        ORDER BY EXTRACT(YEAR FROM cm.date) ASC
      `;
      if (cpcTrend.length >= 2) {
        const first = cpcTrend[0];
        const last = cpcTrend[cpcTrend.length - 1];
        const change = ((last.avgCpc - first.avgCpc) / Math.max(first.avgCpc, 0.1)) * 100;
        insights.push({
          text: `Average CPC has ${change > 0 ? "increased" : "decreased"} ${fmtDec(Math.abs(change))}% from ₹${fmtDec(first.avgCpc)} (${first.year}) to ₹${fmtDec(last.avgCpc)} (${last.year}). ${change > 30 ? "Rising costs demand better targeting and creative" : "CPCs are relatively stable"}`,
          category: "budget",
          impact: Math.abs(change) > 30 ? "high" : "medium",
          metric: `₹${fmtDec(last.avgCpc)} current CPC`,
          learnedFrom: `${fmt(cpcTrend.reduce((s: number, c: any) => s + c.cnt, 0))} daily metrics across ${cpcTrend.length} years`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Dormant user campaigns ---
    try {
      const dormantPerf = await db.$queryRaw<Array<{ isDormant: boolean; avgRoas: number; cnt: number }>>`
        SELECT
          (c.name ILIKE '%dormant%' OR c.name ILIKE '%inactive%' OR c.name ILIKE '%lapsed%' OR c.name ILIKE '%Activate Dormant%') as "isDormant",
          AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
      `;
      if (dormantPerf.length === 2) {
        const dormant = dormantPerf.find((d: any) => d.isDormant);
        const active = dormantPerf.find((d: any) => !d.isDormant);
        if (dormant && active && dormant.cnt >= 2 && dormant.avgRoas > 0.1) {
          insights.push({
            text: `Dormant user reactivation campaigns deliver ${fmtDec(dormant.avgRoas)}x ROAS. ${dormant.avgRoas > 3 ? "Re-engaging lapsed users is highly profitable" : "Dormant user campaigns need better incentives to convert"}`,
            category: "audience",
            impact: dormant.avgRoas > 5 ? "high" : "low",
            metric: `${fmtDec(dormant.avgRoas)}x dormant ROAS`,
            learnedFrom: `${fmt(dormant.cnt)} dormant user campaigns`,
            learnedAt: now,
          });
        }
      }
    } catch (e) { /* skip */ }

    // --- Insight: LC (Link Click) vs LPV (Landing Page View) optimization ---
    try {
      const optPerf = await db.$queryRaw<Array<{ optType: string; avgRoas: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%_LC_%' OR c.name ILIKE '%_LC' THEN 'Link Click (LC)'
            WHEN c.name ILIKE '%_LPV_%' OR c.name ILIKE '%_LPV' THEN 'Landing Page View (LPV)'
            ELSE NULL
          END as "optType",
          AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
        HAVING COUNT(*) >= 5
        ORDER BY AVG(co.roas) DESC
      `;
      const validOpt = optPerf.filter((o: any) => o.optType != null);
      if (validOpt.length === 2) {
        const better = validOpt[0];
        const worse = validOpt[1];
        insights.push({
          text: `${better.optType} optimized campaigns deliver ${fmtDec(better.avgRoas)}x ROAS vs ${worse.optType} at ${fmtDec(worse.avgRoas)}x. Optimize for ${better.optType.includes('LPV') ? "landing page views" : "link clicks"} for better outcomes`,
          category: "creative",
          impact: "medium",
          metric: `${fmtDec(better.avgRoas)}x ${better.optType}`,
          learnedFrom: `${fmt(better.cnt + worse.cnt)} optimization-specific outcomes`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: High-value ROAS campaigns count ---
    try {
      const highRoasCamps = await db.$queryRaw<Array<{ bucket: string; cnt: number }>>`
        WITH camp_roas AS (
          SELECT c.name, AVG(co.roas) as avg_roas
          FROM "CampaignOutcome" co
          JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
          WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
          GROUP BY c.name
          HAVING COUNT(*) >= 3
        )
        SELECT
          CASE
            WHEN avg_roas >= 10 THEN 'Stars (10x+)'
            WHEN avg_roas >= 5 THEN 'Strong (5-10x)'
            WHEN avg_roas >= 2 THEN 'Decent (2-5x)'
            WHEN avg_roas >= 1 THEN 'Breakeven (1-2x)'
            ELSE 'Losing (<1x)'
          END as bucket,
          COUNT(*)::int as cnt
        FROM camp_roas
        GROUP BY 1
        ORDER BY 1
      `;
      if (highRoasCamps.length >= 3) {
        const total = highRoasCamps.reduce((s: number, b: any) => s + b.cnt, 0);
        const breakdown = highRoasCamps.map((b: any) => `${b.bucket}: ${b.cnt}`).join(", ");
        insights.push({
          text: `Campaign portfolio health: ${breakdown}. Out of ${total} campaigns with enough data, focus on scaling Stars and fixing or pausing Losing ones`,
          category: "performance",
          impact: "high",
          metric: `${total} campaigns graded`,
          learnedFrom: `campaigns with 3+ outcome data points`,
          learnedAt: now,
        });
      }
    } catch (e) { /* skip */ }

    // --- Insight: Google Brand vs Non-Brand search ---
    try {
      const brandSearch = await db.$queryRaw<Array<{ searchType: string; avgRoas: number; cnt: number }>>`
        SELECT
          CASE
            WHEN c.name ILIKE '%GSB%' OR c.name ILIKE '%Brand%Search%' OR c.name ILIKE '%BrandPaid%' THEN 'Brand Search'
            WHEN c.name ILIKE '%GSNB%' OR c.name ILIKE '%NonBrand%' OR c.name ILIKE '%Generic%' THEN 'Non-Brand Search'
            ELSE NULL
          END as "searchType",
          AVG(co.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignOutcome" co
        JOIN "Campaign" c ON co."externalCampaignId" = c."externalId"
        WHERE co.roas IS NOT NULL AND co.roas > 0 AND co.roas < 500
        GROUP BY 1
        HAVING COUNT(*) >= 3
        ORDER BY AVG(co.roas) DESC
      `;
      const validSearch = brandSearch.filter((s: any) => s.searchType != null);
      if (validSearch.length === 2) {
        const brand = validSearch.find((s: any) => s.searchType === 'Brand Search');
        const nonBrand = validSearch.find((s: any) => s.searchType === 'Non-Brand Search');
        if (brand && nonBrand) {
          insights.push({
            text: `Brand Search delivers ${fmtDec(brand.avgRoas)}x ROAS vs Non-Brand at ${fmtDec(nonBrand.avgRoas)}x. ${brand.avgRoas > nonBrand.avgRoas * 2 ? "Brand defense is highly profitable but non-brand builds the pipeline" : "Non-brand search is competitive — focus on converting that traffic better"}`,
            category: "performance",
            impact: "high",
            metric: `${fmtDec(brand.avgRoas)}x brand search`,
            learnedFrom: `${fmt(brand.cnt)} brand + ${fmt(nonBrand.cnt)} non-brand outcomes`,
            learnedAt: now,
          });
        }
      }
    } catch (e) { /* skip */ }

    // --- Insight: Best month-of-year for each platform ---
    try {
      const platformMonthly = await db.$queryRaw<Array<{ platform: string; monthNum: number; monthName: string; avgRoas: number; cnt: number }>>`
        SELECT cm.platform, EXTRACT(MONTH FROM cm.date)::int as "monthNum",
               CASE EXTRACT(MONTH FROM cm.date)::int
                 WHEN 1 THEN 'January' WHEN 2 THEN 'February' WHEN 3 THEN 'March' WHEN 4 THEN 'April'
                 WHEN 5 THEN 'May' WHEN 6 THEN 'June' WHEN 7 THEN 'July' WHEN 8 THEN 'August'
                 WHEN 9 THEN 'September' WHEN 10 THEN 'October' WHEN 11 THEN 'November' WHEN 12 THEN 'December'
               END as "monthName",
               AVG(cm.roas) as "avgRoas", COUNT(*)::int as cnt
        FROM "CampaignMetric" cm
        WHERE cm.roas IS NOT NULL AND cm.roas > 0 AND cm.roas < 500 AND cm.spend > 0
        GROUP BY cm.platform, EXTRACT(MONTH FROM cm.date), 3
        HAVING COUNT(*) >= 10
        ORDER BY cm.platform, AVG(cm.roas) DESC
      `;
      const platforms = [...new Set(platformMonthly.map((p: any) => p.platform))];
      for (const plat of platforms) {
        const months = platformMonthly.filter((p: any) => p.platform === plat);
        if (months.length >= 6) {
          const best = months[0];
          const worst = months[months.length - 1];
          insights.push({
            text: `${plat}'s best month is ${best.monthName} (${fmtDec(best.avgRoas)}x ROAS), worst is ${worst.monthName} (${fmtDec(worst.avgRoas)}x). Plan ${plat} budgets seasonally`,
            category: "timing",
            impact: "medium",
            metric: `${fmtDec(best.avgRoas)}x peak ${plat}`,
            learnedFrom: `${fmt(months.reduce((s: number, m: any) => s + m.cnt, 0))} ${plat} daily metrics`,
            learnedAt: now,
          });
        }
      }
    } catch (e) { /* skip */ }

    return NextResponse.json({
      health: {
        score: healthScore,
        phase,
        phaseDetail,
        breakdown: healthBreakdown,
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
      insights,
    });
  } catch (error) {
    console.error("[Flywheel API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch flywheel data" }, { status: 500 });
  }
}
