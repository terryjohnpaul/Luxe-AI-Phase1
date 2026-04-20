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
      insights,
    });
  } catch (error) {
    console.error("[Flywheel API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch flywheel data" }, { status: 500 });
  }
}
