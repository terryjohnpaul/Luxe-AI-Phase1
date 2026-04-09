"use client";

import { useState } from "react";
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
  { id: 1, name: "Signal Ingestion", description: "Pulling real-time signals: inventory, trends, weather, ROAS", status: "completed", duration: "12s" },
  { id: 2, name: "Audience Scoring", description: "Recalculating archetype scores and CLV predictions", status: "completed", duration: "8s" },
  { id: 3, name: "Budget Optimizer", description: "Running constraint-based allocation across channels", status: "completed", duration: "18s" },
  { id: 4, name: "Creative Matching", description: "Matching best-performing creatives to audience segments", status: "running", duration: "—" },
  { id: 5, name: "Execution & Sync", description: "Pushing changes to Meta, Google, WhatsApp APIs", status: "pending" },
];

const mockCycles: OptimizationCycle[] = [
  {
    id: "c1",
    cycleNumber: 847,
    startedAt: "Today, 2:00 PM",
    completedAt: "Today, 2:01 PM",
    status: "completed",
    netImpact: "+INR 2.8L estimated revenue",
    decisions: [
      { id: "d1", type: "budget_shift", title: "Shift INR 40K: Google PMax Women's to Meta ASC Bags", detail: "Bags ROAS 6.2x on Meta vs 2.1x on Google. Reallocating for higher returns.", impact: "+INR 1.2L revenue", autoApproved: true, status: "executed" },
      { id: "d2", type: "bid_change", title: "Increase bid 15% on Hugo Boss Brand Search", detail: "Competitor Coach increased bids. Defending brand position.", impact: "Maintain #1 position", autoApproved: true, status: "executed" },
      { id: "d3", type: "pause", title: "Pause Diesel Discovery campaign", detail: "ROAS dropped below 1.5x threshold for 3 consecutive cycles.", impact: "Save INR 18K/day", autoApproved: false, status: "pending" },
      { id: "d4", type: "creative_swap", title: "Swap Kenzo hero image to tiger motif Reel", detail: "Reel CTR 180% higher than static. Auto-swapped in Meta ASC.", impact: "+40% expected CTR", autoApproved: true, status: "executed" },
    ],
  },
  {
    id: "c2",
    cycleNumber: 846,
    startedAt: "Today, 12:00 PM",
    completedAt: "Today, 12:01 PM",
    status: "completed",
    netImpact: "+INR 1.6L estimated revenue",
    decisions: [
      { id: "d5", type: "activate", title: "Activate Monsoon campaign for Mumbai PIN codes", detail: "Weather signal: 28mm rain detected. Auto-activated monsoon creative bundle.", impact: "Capture weather-driven demand", autoApproved: true, status: "executed" },
      { id: "d6", type: "budget_shift", title: "Shift INR 25K: Google DemandGen to Meta Retarget", detail: "DemandGen ROAS 1.2x underperforming. Retarget pool at 45K warm users.", impact: "+INR 80K revenue", autoApproved: true, status: "executed" },
      { id: "d7", type: "pause", title: "Pause Ami Paris Static ads", detail: "Static ads underperforming Reels by 3x. Consolidating budget to Reels.", impact: "Save INR 12K, redirect to Reels", autoApproved: true, status: "executed" },
    ],
  },
  {
    id: "c3",
    cycleNumber: 845,
    startedAt: "Today, 10:00 AM",
    completedAt: "Today, 10:02 AM",
    status: "completed",
    netImpact: "+INR 3.1L estimated revenue",
    decisions: [
      { id: "d8", type: "budget_shift", title: "Increase overall Meta spend by INR 1.2L", detail: "Morning ROAS trending 20% above 7-day average. Scaling winners.", impact: "+INR 2.4L revenue", autoApproved: false, status: "pending" },
      { id: "d9", type: "creative_swap", title: "Rotate Coach carousel: new arrivals first", detail: "New arrival slides getting 2x engagement when shown first.", impact: "+25% CTR", autoApproved: true, status: "executed" },
      { id: "d10", type: "bid_change", title: "Lower CPA target on Michael Kors by 10%", detail: "Conversion rate improved. Can achieve lower CPA without losing volume.", impact: "INR 15K daily savings", autoApproved: true, status: "executed" },
    ],
  },
  {
    id: "c4",
    cycleNumber: 844,
    startedAt: "Today, 8:00 AM",
    completedAt: "Today, 8:01 AM",
    status: "completed",
    netImpact: "+INR 0.9L estimated revenue",
    decisions: [
      { id: "d11", type: "activate", title: "Activate morning commute campaign: Metro cities", detail: "Scheduled campaign for 8-10 AM window targeting Urban Achievers.", impact: "Capture commute browsing", autoApproved: true, status: "executed" },
      { id: "d12", type: "budget_shift", title: "Reduce Google Brand spend 20% (off-peak)", detail: "Brand search volume low in morning hours. Reallocating to evening.", impact: "INR 8K savings", autoApproved: true, status: "executed" },
    ],
  },
];

const mockStats = [
  { label: "Cycles Today", value: "12", color: "blue", icon: RefreshCw },
  { label: "Auto-Approved", value: "38", color: "green", icon: CheckCircle2 },
  { label: "Pending Review", value: "4", color: "orange", icon: Clock },
  { label: "Est. Revenue Impact", value: "INR 14.2L", color: "purple", icon: TrendingUp },
  { label: "Budget Shifted", value: "INR 3.8L", color: "navy", icon: ArrowRightLeft },
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

export default function OptimizationPage() {
  const [expandedCycle, setExpandedCycle] = useState<string | null>("c1");
  const [isRunning, setIsRunning] = useState(false);

  const handleRunNow = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Optimization Engine</h1>
          <p className="text-sm text-muted mt-1">
            Autonomous 5-step optimization loop running every 2 hours. Reviews signals, scores audiences, and reallocates budgets.
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

      {/* 5-Step Loop Status */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">5-Step Optimization Loop</h2>
          <span className="text-xs text-muted">Last completed: Cycle #847 at 2:01 PM | Next: 4:00 PM</span>
        </div>
        <div className="flex items-center gap-2">
          {loopSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className={cn(
                "flex-1 p-4 rounded-lg border transition-all",
                step.status === "completed" && "bg-green-50 border-green-200",
                step.status === "running" && "bg-blue-50 border-blue-300 ring-2 ring-blue-200",
                step.status === "pending" && "bg-gray-50 border-gray-200",
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    step.status === "completed" && "bg-green-500 text-white",
                    step.status === "running" && "bg-blue-500 text-white animate-pulse",
                    step.status === "pending" && "bg-gray-300 text-white",
                  )}>
                    {step.status === "completed" ? <CheckCircle2 size={14} /> : step.id}
                  </div>
                  <span className="text-xs font-semibold">{step.name}</span>
                </div>
                <p className="text-[11px] text-muted">{step.description}</p>
                {step.duration && (
                  <p className="text-[10px] text-muted mt-1">{step.duration}</p>
                )}
              </div>
              {idx < loopSteps.length - 1 && (
                <ChevronRight size={16} className="text-gray-300 mx-1 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Optimization History */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Optimization Cycle History</h2>
        <div className="space-y-3">
          {mockCycles.map((cycle) => {
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
