"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw, Loader2, Brain, Zap, Database, Target, BarChart3,
  Activity, CheckCircle, XCircle, AlertTriangle, TrendingUp,
  TrendingDown, Minus, ArrowRight, Radio, Users, ShoppingBag,
  Settings, Eye, Clock, Cpu, Layers, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FlywheelData {
  health: { score: number; phase: string; phaseDetail: string };
  dataCollection: {
    signalsLogged: number;
    recommendationsGenerated: number;
    userActionsTracked: number;
    campaignOutcomes: number;
    predictionsEvaluated: number;
    featuresComputed: number;
    modelsActive: number;
  };
  actionBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
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
    trend: string;
  }>;
  models: Array<{
    id: string;
    version: string;
    signalType: string | null;
    trainingDataCount: number;
    accuracy: number | null;
    trainedAt: string;
    blend: { userDataPct: number; benchmarkPct: number; label: string };
  }>;
  driftReports: Array<{
    signalType: string;
    recentAccuracy: number;
    historicalAccuracy: number;
    driftAmount: number;
    status: string;
  }>;
  recentEvals: Array<{
    id: string;
    title: string;
    signalType: string;
    predictedRoas: number | null;
    actualRoas: number | null;
    accuracy: number | null;
    withinCI: boolean | null;
    evaluatedAt: string;
  }>;
  timeline: Array<{
    type: string;
    title: string;
    detail: string;
    timestamp: string;
  }>;
}

function getHealthColor(score: number) {
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-400";
}

function getHealthBg(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-400";
}

const TIMELINE_ICONS: Record<string, { icon: typeof Brain; color: string }> = {
  signal_detected: { icon: Radio, color: "text-orange-500" },
  recommendation_created: { icon: Zap, color: "text-blue-500" },
  user_action: { icon: Users, color: "text-purple-500" },
  prediction_evaluated: { icon: Target, color: "text-emerald-500" },
  drift_detected: { icon: AlertTriangle, color: "text-red-500" },
};

export default function FlywheelPage() {
  const [data, setData] = useState<FlywheelData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/flywheel");
      if (resp.ok) setData(await resp.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-blue mx-auto mb-4" />
          <p className="text-sm text-muted">Loading flywheel status...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const d = data;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain size={24} className="text-brand-purple" /> Flywheel
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Self-improving prediction engine — every campaign makes the system smarter
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary"><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Flywheel Health + Phase */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-3">
          <div className="glass-card p-5 text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100" />
                <circle cx="48" cy="48" r="40" fill="none" strokeWidth="6"
                  strokeDasharray={`${(d.health.score / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                  className={getHealthColor(d.health.score)} />
              </svg>
              <span className={cn("absolute inset-0 flex items-center justify-center text-2xl font-bold", getHealthColor(d.health.score))}>
                {d.health.score}
              </span>
            </div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Flywheel Health</p>
          </div>
        </div>

        <div className="col-span-4">
          <div className="glass-card p-5 h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("w-2 h-2 rounded-full animate-pulse", getHealthBg(d.health.score))} />
              <h3 className="font-semibold text-sm">{d.health.phase}</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">{d.health.phaseDetail}</p>
          </div>
        </div>

        {/* The Flywheel Loop Diagram */}
        <div className="col-span-5">
          <div className="glass-card p-4">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">THE LEARNING LOOP</p>
            <div className="flex items-center gap-1 text-[10px]">
              <div className="flex flex-col items-center gap-1 px-2 py-1.5 bg-orange-50 rounded-lg border border-orange-200 flex-1">
                <Radio size={14} className="text-orange-500" />
                <span className="font-medium text-orange-700">Detect</span>
                <span className="text-orange-500 font-bold">{d.dataCollection.signalsLogged}</span>
              </div>
              <ArrowRight size={12} className="text-muted shrink-0" />
              <div className="flex flex-col items-center gap-1 px-2 py-1.5 bg-blue-50 rounded-lg border border-blue-200 flex-1">
                <Zap size={14} className="text-blue-500" />
                <span className="font-medium text-blue-700">Predict</span>
                <span className="text-blue-500 font-bold">{d.dataCollection.recommendationsGenerated}</span>
              </div>
              <ArrowRight size={12} className="text-muted shrink-0" />
              <div className="flex flex-col items-center gap-1 px-2 py-1.5 bg-purple-50 rounded-lg border border-purple-200 flex-1">
                <Users size={14} className="text-purple-500" />
                <span className="font-medium text-purple-700">Act</span>
                <span className="text-purple-500 font-bold">{d.dataCollection.userActionsTracked}</span>
              </div>
              <ArrowRight size={12} className="text-muted shrink-0" />
              <div className="flex flex-col items-center gap-1 px-2 py-1.5 bg-green-50 rounded-lg border border-green-200 flex-1">
                <ShoppingBag size={14} className="text-green-600" />
                <span className="font-medium text-green-700">Measure</span>
                <span className="text-green-600 font-bold">{d.dataCollection.campaignOutcomes}</span>
              </div>
              <ArrowRight size={12} className="text-muted shrink-0" />
              <div className="flex flex-col items-center gap-1 px-2 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 flex-1">
                <Brain size={14} className="text-emerald-600" />
                <span className="font-medium text-emerald-700">Learn</span>
                <span className="text-emerald-600 font-bold">{d.dataCollection.predictionsEvaluated}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Collection Stats */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {([
          { label: "Signals Logged", value: d.dataCollection.signalsLogged, icon: Radio, color: "text-orange-500" },
          { label: "Recommendations", value: d.dataCollection.recommendationsGenerated, icon: Zap, color: "text-blue-500" },
          { label: "User Actions", value: d.dataCollection.userActionsTracked, icon: Activity, color: "text-purple-500" },
          { label: "Campaign Outcomes", value: d.dataCollection.campaignOutcomes, icon: ShoppingBag, color: "text-green-600" },
          { label: "Predictions Evaluated", value: d.dataCollection.predictionsEvaluated, icon: Target, color: "text-emerald-600" },
          { label: "Features Computed", value: d.dataCollection.featuresComputed, icon: Layers, color: "text-indigo-500" },
          { label: "Active Models", value: d.dataCollection.modelsActive, icon: Cpu, color: "text-pink-500" },
        ] as const).map((s) => (
          <div key={s.label} className="glass-card p-3 text-center">
            <s.icon size={16} className={cn("mx-auto mb-1", s.color)} />
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[10px] text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Learning Models */}
        <div className="col-span-5">
          <div className="glass-card p-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Cpu size={16} className="text-brand-purple" /> Bayesian Learning Models
            </h2>
            {d.models.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {d.models.map((m) => (
                  <div key={m.id} className="p-2.5 bg-surface/60 rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold capitalize">{(m.signalType || "global").replace(/_/g, " ")}</span>
                      <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{m.version}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] text-muted">Data points: <span className="font-semibold text-text-primary">{m.trainingDataCount}</span></span>
                      <span className="text-[10px] text-muted">Trained: <span className="font-semibold text-text-primary">{new Date(m.trainedAt).toLocaleDateString()}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full bg-brand-blue rounded-full transition-all" style={{ width: `${m.blend.userDataPct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted whitespace-nowrap">{m.blend.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Cpu size={24} className="text-muted mx-auto mb-2" />
                <p className="text-xs text-muted">Models will appear after campaign outcomes are evaluated</p>
              </div>
            )}
          </div>
        </div>

        {/* Drift Detection */}
        <div className="col-span-3">
          <div className="glass-card p-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <GitBranch size={16} className="text-brand-orange" /> Drift Detection
            </h2>
            {d.driftReports.length > 0 ? (
              <div className="space-y-2">
                {d.driftReports.map((dr) => (
                  <div key={dr.signalType} className={cn(
                    "p-2.5 rounded-lg border text-xs",
                    dr.status === "stable" ? "bg-green-50 border-green-200" :
                    dr.status === "drifting" ? "bg-amber-50 border-amber-200" :
                    "bg-red-50 border-red-200"
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold capitalize">{dr.signalType.replace(/_/g, " ")}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                        dr.status === "stable" ? "bg-green-100 text-green-700" :
                        dr.status === "drifting" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {dr.status === "stable" ? "Stable" : dr.status === "drifting" ? "Drifting" : "Alert"}
                      </span>
                    </div>
                    <p className="text-muted">
                      Accuracy: {Math.round(dr.recentAccuracy * 100)}%
                      {dr.status !== "stable" && ` (was ${Math.round(dr.historicalAccuracy * 100)}%)`}
                    </p>
                    {dr.status !== "stable" && (
                      <p className="text-[10px] mt-1 font-medium text-amber-700">
                        Auto-retraining triggered
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-muted">All models stable</p>
                <p className="text-[10px] text-muted mt-1">Drift detection runs weekly</p>
              </div>
            )}
          </div>
        </div>

        {/* User Action Breakdown */}
        <div className="col-span-4">
          <div className="glass-card p-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Activity size={16} className="text-brand-blue" /> User Engagement
            </h2>
            <div className="space-y-2">
              {Object.entries(d.actionBreakdown).sort(([,a],[,b]) => b - a).map(([action, count]) => (
                <div key={action} className="flex items-center gap-2">
                  <span className="text-xs text-muted w-36 truncate capitalize">{action.replace(/_/g, " ")}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-brand-blue rounded-full"
                      style={{ width: `${Math.min((count / Math.max(...Object.values(d.actionBreakdown))) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-8 text-right">{count}</span>
                </div>
              ))}
              {Object.keys(d.actionBreakdown).length === 0 && (
                <p className="text-xs text-muted text-center py-4">No actions tracked yet</p>
              )}
            </div>

            {/* Recommendation status */}
            {Object.keys(d.statusBreakdown).length > 0 && (
              <div className="mt-4 pt-3 border-t border-card-border">
                <p className="text-[10px] font-semibold text-muted uppercase mb-2">Recommendation Status</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(d.statusBreakdown).map(([status, count]) => (
                    <span key={status} className={cn(
                      "text-[10px] px-2 py-1 rounded-full font-medium",
                      status === "approved" ? "bg-green-100 text-green-700" :
                      status === "skipped" ? "bg-gray-100 text-gray-600" :
                      status === "edited" ? "bg-blue-100 text-blue-700" :
                      "bg-surface text-muted"
                    )}>
                      {status}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signal Value + Prediction Accuracy */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Signal Value Rankings */}
        <div className="col-span-7">
          <div className="glass-card p-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-brand-orange" /> Signal Value Rankings
            </h2>
            {d.signalScores.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted border-b border-card-border">
                    <th className="text-left py-2 font-medium">Signal</th>
                    <th className="text-right py-2 font-medium">ROAS</th>
                    <th className="text-right py-2 font-medium">CPA</th>
                    <th className="text-right py-2 font-medium">Accuracy</th>
                    <th className="text-right py-2 font-medium">Campaigns</th>
                    <th className="text-right py-2 font-medium">Score</th>
                    <th className="text-center py-2 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {d.signalScores.map((s) => (
                    <tr key={s.signalType} className="border-b border-card-border/50">
                      <td className="py-2 font-medium capitalize">{s.signalType.replace(/_/g, " ")}</td>
                      <td className="text-right py-2 text-green-600 font-semibold">{s.avgRoas.toFixed(1)}x</td>
                      <td className="text-right py-2">{s.avgCpa ? `₹${Math.round(s.avgCpa).toLocaleString("en-IN")}` : "—"}</td>
                      <td className="text-right py-2">{Math.round(s.avgAccuracy * 100)}%</td>
                      <td className="text-right py-2">{s.campaignCount}</td>
                      <td className="text-right py-2">
                        <span className={cn("px-1.5 py-0.5 rounded font-semibold",
                          s.valueScore >= 70 ? "bg-emerald-100 text-emerald-700" :
                          s.valueScore >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        )}>{s.valueScore}</span>
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
              <p className="text-sm text-muted text-center py-8">Run campaigns to see signal value rankings</p>
            )}
          </div>
        </div>

        {/* Prediction Accuracy Overview */}
        <div className="col-span-5">
          <div className="glass-card p-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Target size={16} className="text-brand-green" /> Prediction Accuracy
            </h2>
            {d.accuracy.totalEvaluated > 0 ? (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-surface/60 rounded-lg text-center">
                    <p className="text-2xl font-bold">{d.accuracy.overall != null ? `${Math.round(d.accuracy.overall * 100)}%` : "—"}</p>
                    <p className="text-[10px] text-muted">Overall Accuracy</p>
                  </div>
                  <div className="p-3 bg-surface/60 rounded-lg text-center">
                    <p className="text-2xl font-bold">{d.accuracy.withinCIPct != null ? `${Math.round(d.accuracy.withinCIPct * 100)}%` : "—"}</p>
                    <p className="text-[10px] text-muted">Within CI Range</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(d.accuracy.bySignalType)
                    .sort(([,a],[,b]) => b.accuracy - a.accuracy)
                    .slice(0, 6)
                    .map(([type, stats]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-[10px] w-20 truncate capitalize">{type.replace(/_/g, " ")}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                        <div className={cn("h-full rounded-full",
                          stats.accuracy >= 0.7 ? "bg-emerald-500" : stats.accuracy >= 0.5 ? "bg-amber-500" : "bg-red-400"
                        )} style={{ width: `${Math.round(stats.accuracy * 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-bold w-8 text-right">{Math.round(stats.accuracy * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Target size={24} className="text-muted mx-auto mb-2" />
                <p className="text-xs text-muted">Accuracy tracking starts after campaign outcomes are linked</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prediction Ledger + Activity Timeline */}
      <div className="grid grid-cols-12 gap-6">
        {/* Prediction Ledger */}
        <div className="col-span-7">
          <div className="glass-card p-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Eye size={16} className="text-brand-blue" /> Prediction Ledger
            </h2>
            {d.recentEvals.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted border-b border-card-border">
                    <th className="text-left py-2 font-medium">Campaign</th>
                    <th className="text-left py-2 font-medium">Signal</th>
                    <th className="text-right py-2 font-medium">Predicted</th>
                    <th className="text-right py-2 font-medium">Actual</th>
                    <th className="text-center py-2 font-medium">CI</th>
                    <th className="text-right py-2 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recentEvals.map((e) => (
                    <tr key={e.id} className="border-b border-card-border/50">
                      <td className="py-2 max-w-32 truncate">{e.title}</td>
                      <td className="py-2 capitalize text-muted">{e.signalType.replace(/_/g, " ")}</td>
                      <td className="text-right py-2">{e.predictedRoas?.toFixed(1)}x</td>
                      <td className="text-right py-2 font-semibold">{e.actualRoas?.toFixed(1)}x</td>
                      <td className="text-center py-2">
                        {e.withinCI === true && <CheckCircle size={12} className="text-emerald-500 inline" />}
                        {e.withinCI === false && <XCircle size={12} className="text-red-400 inline" />}
                      </td>
                      <td className="text-right py-2">
                        <span className={cn("font-semibold",
                          (e.accuracy ?? 0) >= 0.7 ? "text-emerald-600" : (e.accuracy ?? 0) >= 0.4 ? "text-amber-600" : "text-red-500"
                        )}>{e.accuracy != null ? `${Math.round(e.accuracy * 100)}%` : "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted text-center py-8">No predictions evaluated yet — approve campaigns and link results</p>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="col-span-5">
          <div className="glass-card p-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock size={16} className="text-brand-purple" /> Flywheel Activity
            </h2>
            <div className="space-y-0 max-h-80 overflow-y-auto">
              {d.timeline.length > 0 ? d.timeline.map((event, i) => {
                const iconConfig = TIMELINE_ICONS[event.type] || { icon: Activity, color: "text-muted" };
                const Icon = iconConfig.icon;
                return (
                  <div key={i} className="flex items-start gap-3 py-2.5 border-b border-card-border/50 last:border-0">
                    <div className={cn("mt-0.5 shrink-0", iconConfig.color)}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight">{event.title}</p>
                      <p className="text-[10px] text-muted">{event.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted whitespace-nowrap shrink-0">
                      {formatTimeAgo(event.timestamp)}
                    </span>
                  </div>
                );
              }) : (
                <p className="text-xs text-muted text-center py-8">Activity will appear as the flywheel spins</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
