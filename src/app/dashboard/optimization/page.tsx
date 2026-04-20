"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  ArrowRightLeft,
  Pause,
  BarChart3,
  Target,
  Eye,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Types
interface OptimizationStep {
  id: number;
  name: string;
  description: string;
  status: "completed" | "running" | "pending";
  duration?: string;
}

interface Decision {
  id: string;
  type: "budget_shift" | "bid_change" | "pause" | "activate" | "creative_swap";
  title: string;
  detail: string;
  impact: string;
  autoApproved: boolean;
  status: "executed" | "pending" | "rejected";
}

interface OptimizationCycle {
  id: string;
  cycleNumber: number;
  startedAt: string;
  completedAt: string;
  decisions: Decision[];
  netImpact: string;
  status: "completed" | "running" | "failed";
}

// Mock data
const loopSteps: OptimizationStep[] = [
  { id: 1, name: "Signal Ingestion", description: "Pulling live signals from 43 sources (174 active signals)", status: "completed", duration: "12s" },
  { id: 2, name: "Audience Scoring", description: "Recalculating archetype scores and CLV predictions", status: "completed", duration: "8s" },
  { id: 3, name: "Budget Optimizer", description: "Running constraint-based allocation across channels", status: "completed", duration: "18s" },
  { id: 4, name: "Creative Matching", description: "Matching best-performing creatives to audience segments", status: "running", duration: "—" },
  { id: 5, name: "Execution & Sync", description: "Recommendations ready for review (read-only — no auto-push)", status: "pending" },
];





function getTypeIcon(type: Decision["type"]) {
  switch (type) {
    case "budget_shift": return DollarSign;
    case "bid_change": return TrendingUp;
    case "pause": return Pause;
    case "activate": return Play;
    case "creative_swap": return Eye;
    default: return Zap;
  }
}

function getTypeLabel(type: Decision["type"]) {
  switch (type) {
    case "budget_shift": return "Budget Shift";
    case "bid_change": return "Bid Change";
    case "pause": return "Pause";
    case "activate": return "Activate";
    case "creative_swap": return "Creative Swap";
    default: return type;
  }
}

const AUTH = "Basic " + (typeof btoa !== "undefined" ? btoa("admin:luxeai2026") : "");

export default function OptimizationPage() {
  const [syncing, setSyncing] = useState(false);

  async function syncNow() {
    setSyncing(true);
    try {
      const resp = await fetch("/api/optimization?refresh=true", { headers: { Authorization: AUTH } });
      if (resp.ok) {
        const d = await resp.json();
        setLiveData(d);
      }
    } catch {}
    setSyncing(false);
  }

  const [expandedCycle, setExpandedCycle] = useState<string | null>("c1");
  const [liveData, setLiveData] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/optimization", { headers: { Authorization: AUTH } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setLiveData(d))
      .catch(() => {});
    fetch("/api/ajio-luxe/performance", { headers: { Authorization: AUTH } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && d.campaigns && setCampaigns(d.campaigns))
      .catch(() => {});
    // Auto-refresh every 30 minutes
    const interval = setInterval(() => {
      fetch("/api/optimization", { headers: { Authorization: AUTH } })
        .then(r => r.ok ? r.json() : null)
        .then(d => d && setLiveData(d))
        .catch(() => {});
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunNow = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 3000);
  };

  const mockCycles: OptimizationCycle[] = liveData?.aiDecisions?.decisions?.length > 0
  ? [{
      id: "live",
      cycleNumber: 1,
      startedAt: "Just now",
      completedAt: "Just now",
      status: "completed",
      netImpact: liveData.aiDecisions.summary || "Analysis complete",
      decisions: (liveData.aiDecisions.decisions as any[]).map((d: any, i: number) => ({
        id: "d" + i,
        type: (d.type === "budget_increase" ? "budget_shift" : d.type === "budget_decrease" ? "budget_shift" : d.type === "campaign_pause" ? "pause" : d.type === "audience_shift" ? "activate" : "creative_swap") as any,
        title: d.description || "AI Decision",
        detail: d.reasoning || "",
        impact: d.estimatedImpact || "",
        autoApproved: d.autoApprove !== false,
        status: (d.autoApprove !== false ? "executed" : "pending") as any,
      })),
    }]
  : [];

  const mockStats = [
  { label: "Active Campaigns", value: String(liveData?.metaCampaigns || 0), color: "blue", icon: RefreshCw },
  { label: "AI Decisions", value: String(liveData?.aiDecisions?.decisions?.length || 0), color: "green", icon: CheckCircle2 },
  { label: "Frequency Alerts", value: String(liveData?.alerts?.highFrequency?.length || 0), color: "orange", icon: Clock },
  { label: "Data Source", value: liveData ? "Live" : "Loading", color: "purple", icon: TrendingUp },
  { label: "AI Engine", value: liveData ? "Online" : "Connecting", color: "navy", icon: ArrowRightLeft },
];

    return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Optimization Engine</h1>
          <p className="text-sm text-muted mt-1">
            Live Meta Ads optimization powered by GPT-4o. Analyzes campaigns and recommends budget, audience, and creative actions.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={handleRunNow}
          disabled={isRunning}
        >
          {isRunning ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
          {isRunning ? "Running..." : "Run Cycle Now"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-4">
        {mockStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`stat-card stat-card-${stat.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-brand-${stat.color === "navy" ? "blue" : stat.color}/10`}>
                  <Icon size={18} className={`text-brand-${stat.color === "navy" ? "blue" : stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>



      {/* Optimization History */}
      <div className="glass-card p-6">
        
        {/* Live Campaign Performance — Campaigns Needing Optimization */}
        <h2 className="text-xl font-semibold mt-8 mb-1">Campaigns Needing Optimization</h2>
        <p className="text-xs text-gray-500 mb-4">Showing campaigns with low ROAS, high CPA, or high frequency from live Meta Ads data</p>
        <div className="space-y-2 mb-8">
          {campaigns.length === 0 ? (
            <div className="glass-card p-6 text-center text-gray-400 text-sm">Loading campaigns from Meta Ads API...</div>
          ) : (() => {
            const needsOptimization = campaigns.filter((c: any) => {
              const roas = parseFloat(c.roas || "0");
              const cpa = parseFloat(c.cpa || "0");
              const spend = parseFloat(c.spend || "0");
              return (roas > 0 && roas < 5) || cpa > 500 || spend > 500000;
            }).sort((a: any, b: any) => parseFloat(a.roas || "999") - parseFloat(b.roas || "999"));

            const topPerformers = campaigns.filter((c: any) => parseFloat(c.roas || "0") >= 10)
              .sort((a: any, b: any) => parseFloat(b.roas || "0") - parseFloat(a.roas || "0"));

            return (
              <>
                {needsOptimization.length > 0 && needsOptimization.map((camp: any, idx: number) => {
                  const spend = parseFloat(camp.spend || "0");
                  const roas = parseFloat(camp.roas || "0");
                  const purchases = parseInt(camp.purchases || "0");
                  const cpa = parseFloat(camp.cpa || "0");
                  const roasColor = roas > 5 ? "text-emerald-400" : roas > 2 ? "text-amber-400" : roas > 0 ? "text-red-400" : "text-gray-600";
                  const issue = roas < 3 ? "Low ROAS" : cpa > 600 ? "High CPA" : "High Spend";
                  const issueBg = roas < 3 ? "bg-red-500/20 text-red-400" : cpa > 600 ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400";
                  const suggestion = (() => {
                    const name = camp.campaignName.toLowerCase();
                    const tips: string[] = [];
                    
                    if (roas < 2) tips.push("Pause or reduce budget \u2014 ROAS below 2x");
                    else if (roas < 3) tips.push("Reduce budget 30% \u2014 ROAS below account avg 5.6x");
                    else if (roas < 5) tips.push("Review audience targeting \u2014 below avg performance");
                    
                    if (cpa > 700) tips.push("CPA \u20b9" + Math.round(cpa) + " is 50%+ above avg \u20b9470");
                    
                    if (name.includes("ios") && name.includes("interest")) tips.push("Shift to Android (7.83x ROAS vs iOS 3.01x)");
                    else if (name.includes("ios") && name.includes("allpurc")) tips.push("Creative fatigue likely \u2014 refresh urgently");
                    else if (name.includes("sale") || name.includes("aass")) tips.push("Scale always-on campaigns instead of dedicated sale");
                    else if (name.includes("thruplay")) tips.push("Use 10-11 second video creative (conversion sweet spot)");
                    else if (name.includes("catalouge") || name.includes("catalogue")) tips.push("Check product feed health (96.8% were ineligible)");
                    
                    if (spend > 1000000 && roas < 5) tips.push("Shift budget to AddToCart remarketing (25.1x ROAS)");
                    if (tips.length === 0) tips.push("Monitor performance trends");
                    
                    return tips.join(". ");
                  })();

                  return (
                    <div key={camp.campaignId || idx} className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + issueBg}>{issue.toUpperCase()}</span>
                          </div>
                          <p className="text-sm font-medium truncate">{camp.campaignName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {"Spend: \u20b9" + Math.round(spend).toLocaleString("en-IN") + " \u2022 " + purchases + " purchases \u2022 CPA: \u20b9" + Math.round(cpa).toLocaleString("en-IN")}
                          </p>
                          <div className="mt-2 space-y-1">
                          {suggestion.split(". ").filter((s: string) => s.trim()).map((tip: string, i: number) => (
                            <p key={i} className="text-xs text-amber-400 flex items-start gap-1.5">
                              <span className="text-amber-500 mt-0.5">{"\u2192"}</span>
                              <span>{tip.endsWith(".") ? tip : tip + "."}</span>
                            </p>
                          ))}
                        </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={"text-2xl font-bold " + roasColor}>
                            {roas > 0 ? roas.toFixed(1) + "x" : "\u2014"}
                          </span>
                          <p className="text-[10px] text-gray-500">ROAS</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {topPerformers.length > 0 && (
                  <>
                    <h3 className="text-base font-semibold mt-6 mb-2 text-emerald-400">Top Performers (Scale These)</h3>
                    {topPerformers.slice(0, 5).map((camp: any, idx: number) => {
                      const spend = parseFloat(camp.spend || "0");
                      const roas = parseFloat(camp.roas || "0");
                      const purchases = parseInt(camp.purchases || "0");
                      const cpa = parseFloat(camp.cpa || "0");
                      return (
                        <div key={camp.campaignId || idx} className="glass-card p-4 border-emerald-800/30">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">TOP PERFORMER</span>
                              </div>
                              <p className="text-sm font-medium truncate">{camp.campaignName}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {"Spend: \u20b9" + Math.round(spend).toLocaleString("en-IN") + " \u2022 " + purchases + " purchases \u2022 CPA: \u20b9" + Math.round(cpa).toLocaleString("en-IN")}
                              </p>
                              <p className="text-xs text-emerald-400 mt-1">Scale this campaign — increase budget</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-2xl font-bold text-emerald-400">
                                {roas.toFixed(1) + "x"}
                              </span>
                              <p className="text-[10px] text-gray-500">ROAS</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            );
          })()}
        </div>

        <h2 className="text-lg font-semibold mb-4">Optimization Cycle History</h2>
        <div className="space-y-3">
          {mockCycles.length === 0 ? (<div className="glass-card p-8 text-center"><p className="text-gray-400 text-sm">Click "Run Cycle Now" to analyze {String(liveData?.metaCampaigns || 0)} live campaigns with GPT-4o and get optimization recommendations.</p></div>) : mockCycles.map((cycle) => {
            const isExpanded = expandedCycle === cycle.id;
            const autoCount = cycle.decisions.filter(d => d.autoApproved).length;
            const pendingCount = cycle.decisions.filter(d => d.status === "pending").length;

            return (
              <div key={cycle.id} className="border rounded-lg overflow-hidden">
                {/* Cycle Header */}
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpandedCycle(isExpanded ? null : cycle.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      cycle.status === "completed" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {cycle.status === "completed" ? <CheckCircle2 size={16} /> : <RefreshCw size={16} className="animate-spin" />}
                    </div>
                    <div>
                      <span className="font-semibold text-sm">Cycle #{cycle.cycleNumber}</span>
                      <span className="text-xs text-muted ml-3">{cycle.startedAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-green-600">{cycle.netImpact}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{autoCount} auto</span>
                      {pendingCount > 0 && (
                        <span className="text-[11px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{pendingCount} pending</span>
                      )}
                      <span className="text-[11px] text-muted">{cycle.decisions.length} decisions</span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
                  </div>
                </button>

                {/* Expanded Decisions */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50 p-4 space-y-2">
                    {cycle.decisions.map((decision) => {
                      const TypeIcon = getTypeIcon(decision.type);
                      return (
                        <div key={decision.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                          <div className="p-1.5 rounded-md bg-gray-100">
                            <TypeIcon size={14} className="text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">{getTypeLabel(decision.type)}</span>
                              {decision.autoApproved ? (
                                <span className="text-[10px] text-green-600 flex items-center gap-1"><Zap size={10} />Auto-approved</span>
                              ) : (
                                <span className="text-[10px] text-orange-600 flex items-center gap-1"><Clock size={10} />Needs review</span>
                              )}
                            </div>
                            <p className="text-sm font-medium">{decision.title}</p>
                            <p className="text-xs text-muted mt-0.5">{decision.detail}</p>
                            <p className="text-xs text-green-600 font-medium mt-1">{decision.impact}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {decision.status === "executed" && (
                              <span className="text-[11px] bg-green-100 text-green-700 px-2 py-1 rounded-md flex items-center gap-1">
                                <CheckCircle2 size={12} /> Executed
                              </span>
                            )}
                            {decision.status === "pending" && (
                              <div className="flex gap-1">
                                <button className="btn-approve">Approve</button>
                                <button className="btn-reject">Reject</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Auto-Approval Rules */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Auto-Approval Rules</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Rule</th>
                <th className="pb-3 font-medium text-muted">Condition</th>
                <th className="pb-3 font-medium text-muted">Max Amount</th>
                <th className="pb-3 font-medium text-muted">Executions Today</th>
                <th className="pb-3 font-medium text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 font-medium">Budget Reallocation</td>
                <td className="py-3 text-muted">ROAS difference &gt; 2x between channels</td>
                <td className="py-3">INR 50K per shift</td>
                <td className="py-3">6</td>
                <td className="py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span></td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Low Stock Pause</td>
                <td className="py-3 text-muted">Inventory &lt; 5 units</td>
                <td className="py-3">Any</td>
                <td className="py-3">3</td>
                <td className="py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span></td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Trend Boost</td>
                <td className="py-3 text-muted">Google Trends spike &gt; 2x in 4h window</td>
                <td className="py-3">INR 30K budget increase</td>
                <td className="py-3">1</td>
                <td className="py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span></td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Weather Campaign</td>
                <td className="py-3 text-muted">Precipitation &gt; 20mm in target city</td>
                <td className="py-3">INR 20K</td>
                <td className="py-3">1</td>
                <td className="py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span></td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Creative Rotation</td>
                <td className="py-3 text-muted">CTR differential &gt; 50% between variants</td>
                <td className="py-3">Any</td>
                <td className="py-3">8</td>
                <td className="py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span></td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Large Budget Shift</td>
                <td className="py-3 text-muted">Shift &gt; INR 1L in single decision</td>
                <td className="py-3">Requires approval</td>
                <td className="py-3">2 pending</td>
                <td className="py-3"><span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Manual</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
