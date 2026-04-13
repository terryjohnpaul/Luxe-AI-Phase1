"use client";

import { useState, useEffect } from "react";
import {
  Target, TrendingUp, TrendingDown, BarChart3, CheckCircle, XCircle,
  AlertTriangle, Loader2, RefreshCw, Brain, Zap, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AccuracyData {
  accuracy: {
    overall: number | null;
    bySignalType: Record<string, { accuracy: number; count: number; avgRoasError: number }>;
    totalEvaluated: number;
    withinCIPct: number | null;
    trend: { week: string; accuracy: number; count: number }[];
  };
  signalScores: Array<{
    signalType: string;
    avgRoas: number;
    avgCpa: number | null;
    avgAccuracy: number;
    campaignCount: number;
    valueScore: number;
    trend: "improving" | "stable" | "declining";
  }>;
  blendRatio: {
    userDataPct: number;
    benchmarkPct: number;
    label: string;
  };
  recentEvals: Array<{
    id: string;
    title: string;
    signalType: string;
    priority: string;
    predictedRoas: number | null;
    actualRoas: number | null;
    accuracy: number | null;
    withinCI: boolean | null;
    evaluatedAt: string;
  }>;
}

export default function PredictionAccuracyPage() {
  const [data, setData] = useState<AccuracyData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/predictions/accuracy");
      if (resp.ok) setData(await resp.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[80vh]">
        <Loader2 size={32} className="animate-spin text-brand-blue" />
      </div>
    );
  }

  const accuracy = data?.accuracy;
  const hasData = accuracy && accuracy.totalEvaluated > 0;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Prediction Accuracy</h1>
          <p className="text-sm text-muted mt-0.5">
            How well our predictions match actual campaign results
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {!hasData ? (
        <div className="glass-card p-12 text-center">
          <Brain size={48} className="text-muted mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">No predictions evaluated yet</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Once you approve recommendations and campaigns run, we'll compare our predictions
            against actual results. The system learns and improves with every campaign.
          </p>
          <div className="mt-6 flex items-center justify-center gap-8 text-xs text-muted">
            <div className="flex items-center gap-2"><Target size={14} /> Approve a recommendation</div>
            <div className="flex items-center gap-2"><Zap size={14} /> Link your campaign</div>
            <div className="flex items-center gap-2"><BarChart3 size={14} /> We measure & learn</div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="stat-card stat-card-blue">
              <p className="text-xs text-muted font-medium">Overall Accuracy</p>
              <p className="text-3xl font-bold mt-1">
                {accuracy.overall != null ? `${Math.round(accuracy.overall * 100)}%` : "—"}
              </p>
            </div>
            <div className="stat-card stat-card-green">
              <p className="text-xs text-muted font-medium">Within Confidence Interval</p>
              <p className="text-3xl font-bold mt-1">
                {accuracy.withinCIPct != null ? `${Math.round(accuracy.withinCIPct * 100)}%` : "—"}
              </p>
            </div>
            <div className="stat-card stat-card-purple">
              <p className="text-xs text-muted font-medium">Predictions Evaluated</p>
              <p className="text-3xl font-bold mt-1">{accuracy.totalEvaluated}</p>
            </div>
            <div className="stat-card stat-card-orange">
              <p className="text-xs text-muted font-medium">Data Source</p>
              <p className="text-lg font-bold mt-1">{data?.blendRatio.label}</p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
                <div
                  className="h-full bg-brand-blue rounded-full transition-all"
                  style={{ width: `${data?.blendRatio.userDataPct || 0}%` }}
                />
              </div>
              <p className="text-[10px] text-muted mt-1">
                {data?.blendRatio.userDataPct}% your data / {data?.blendRatio.benchmarkPct}% benchmarks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Signal Type Accuracy */}
            <div className="col-span-5">
              <div className="glass-card p-4">
                <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Target size={16} className="text-brand-blue" /> Accuracy by Signal Type
                </h2>
                <div className="space-y-3">
                  {Object.entries(accuracy.bySignalType)
                    .sort(([, a], [, b]) => b.accuracy - a.accuracy)
                    .map(([type, stats]) => (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-xs font-medium w-24 truncate capitalize">
                          {type.replace(/_/g, " ")}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              stats.accuracy >= 0.7 ? "bg-emerald-500" :
                              stats.accuracy >= 0.5 ? "bg-amber-500" : "bg-red-400"
                            )}
                            style={{ width: `${Math.round(stats.accuracy * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold w-10 text-right">
                          {Math.round(stats.accuracy * 100)}%
                        </span>
                        <span className="text-[10px] text-muted w-16">
                          {stats.count} evals
                        </span>
                      </div>
                    ))}
                  {Object.keys(accuracy.bySignalType).length === 0 && (
                    <p className="text-sm text-muted text-center py-4">No data yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Signal Value Scores */}
            <div className="col-span-7">
              <div className="glass-card p-4">
                <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-brand-orange" /> Signal Value Rankings
                </h2>
                {data?.signalScores && data.signalScores.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted border-b border-card-border">
                        <th className="text-left py-2 font-medium">Signal Type</th>
                        <th className="text-right py-2 font-medium">Avg ROAS</th>
                        <th className="text-right py-2 font-medium">Avg CPA</th>
                        <th className="text-right py-2 font-medium">Accuracy</th>
                        <th className="text-right py-2 font-medium">Campaigns</th>
                        <th className="text-right py-2 font-medium">Score</th>
                        <th className="text-center py-2 font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.signalScores.map((s) => (
                        <tr key={s.signalType} className="border-b border-card-border/50">
                          <td className="py-2 font-medium capitalize">{s.signalType.replace(/_/g, " ")}</td>
                          <td className="text-right py-2 font-semibold text-green-600">{s.avgRoas.toFixed(1)}x</td>
                          <td className="text-right py-2">{s.avgCpa ? `₹${Math.round(s.avgCpa).toLocaleString("en-IN")}` : "—"}</td>
                          <td className="text-right py-2">{Math.round(s.avgAccuracy * 100)}%</td>
                          <td className="text-right py-2">{s.campaignCount}</td>
                          <td className="text-right py-2">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded font-semibold",
                              s.valueScore >= 70 ? "bg-emerald-100 text-emerald-700" :
                              s.valueScore >= 40 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            )}>
                              {s.valueScore}
                            </span>
                          </td>
                          <td className="text-center py-2">
                            {s.trend === "improving" && <TrendingUp size={14} className="text-emerald-500 inline" />}
                            {s.trend === "declining" && <TrendingDown size={14} className="text-red-400 inline" />}
                            {s.trend === "stable" && <Minus size={14} className="text-muted inline" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-muted text-center py-8">Run more campaigns to see signal value rankings</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Evaluations */}
          <div className="mt-6 glass-card p-4">
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-brand-purple" /> Recent Prediction Evaluations
            </h2>
            {data?.recentEvals && data.recentEvals.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted border-b border-card-border">
                    <th className="text-left py-2 font-medium">Recommendation</th>
                    <th className="text-left py-2 font-medium">Signal</th>
                    <th className="text-right py-2 font-medium">Predicted ROAS</th>
                    <th className="text-right py-2 font-medium">Actual ROAS</th>
                    <th className="text-center py-2 font-medium">Within CI</th>
                    <th className="text-right py-2 font-medium">Accuracy</th>
                    <th className="text-right py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEvals.map((e) => (
                    <tr key={e.id} className="border-b border-card-border/50">
                      <td className="py-2 font-medium max-w-48 truncate">{e.title}</td>
                      <td className="py-2 capitalize">{e.signalType.replace(/_/g, " ")}</td>
                      <td className="text-right py-2">{e.predictedRoas?.toFixed(1)}x</td>
                      <td className="text-right py-2 font-semibold">{e.actualRoas?.toFixed(1)}x</td>
                      <td className="text-center py-2">
                        {e.withinCI === true && <CheckCircle size={14} className="text-emerald-500 inline" />}
                        {e.withinCI === false && <XCircle size={14} className="text-red-400 inline" />}
                        {e.withinCI == null && <span className="text-muted">—</span>}
                      </td>
                      <td className="text-right py-2">
                        <span className={cn(
                          "font-semibold",
                          (e.accuracy ?? 0) >= 0.7 ? "text-emerald-600" :
                          (e.accuracy ?? 0) >= 0.4 ? "text-amber-600" : "text-red-500"
                        )}>
                          {e.accuracy != null ? `${Math.round(e.accuracy * 100)}%` : "—"}
                        </span>
                      </td>
                      <td className="text-right py-2 text-muted">
                        {new Date(e.evaluatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted text-center py-8">No evaluations yet</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
