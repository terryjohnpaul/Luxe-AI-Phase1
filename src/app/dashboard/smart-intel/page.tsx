"use client";

import { useState, useEffect } from "react";
import {
  MapPin, DollarSign, Palette, Layers, TrendingUp,
  AlertTriangle, Zap, Clock, Loader2, Target, BarChart3,
  ChevronRight, Globe, Calendar, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// --- Types ---

interface CityRecommendation {
  city: string;
  population: string;
  luxuryIndex: number;
  currentConditions: string[];
  recommendedAds: {
    brand: string;
    product: string;
    angle: string;
    reason: string;
  }[];
  budgetMultiplier: number;
  platforms: string[];
}

interface BudgetWindow {
  id: string;
  window: string;
  dateRange: string;
  multiplier: number;
  reason: string;
  recommendation: string;
  confidence: number;
}

interface CreativeFatigueAlert {
  id: string;
  campaignName: string;
  brand: string;
  creative: string;
  daysRunning: number;
  ctrTrend: string;
  currentCtr: number;
  peakCtr: number;
  fatigueLevel: "healthy" | "warning" | "fatigued" | "dead";
  recommendation: string;
  suggestedSwap: string;
}

interface EventStack {
  id: string;
  signals: string[];
  stackScore: number;
  city: string;
  recommendation: string;
  budgetAction: string;
  expectedLift: string;
}

interface LiveSignal {
  id: string;
  type: string;
  source: string;
  title: string;
  description: string;
  location: string;
  severity: "critical" | "high" | "medium" | "low";
  triggersWhat: string;
  targetArchetypes: string[];
  suggestedBrands: string[];
  suggestedAction: string;
  confidence: number;
  expiresAt: string;
  detectedAt: string;
  data: Record<string, any>;
}

interface ApiResponse {
  cities: CityRecommendation[];
  budgetWindows: BudgetWindow[];
  creativeFatigue: CreativeFatigueAlert[];
  eventStacks: EventStack[];
  signals: LiveSignal[];
  summary: {
    citiesMonitored: number;
    activeWindows: number;
    fatigueAlerts: number;
    activeStacks: number;
    totalSignals: number;
  };
}

// --- Helpers ---

function getMultiplierBadge(multiplier: number) {
  if (multiplier >= 2.0) return "bg-red-100 text-red-700 border border-red-200";
  if (multiplier > 1.0) return "bg-orange-100 text-orange-700 border border-orange-200";
  if (multiplier === 1.0) return "bg-green-100 text-green-700 border border-green-200";
  return "bg-yellow-100 text-yellow-700 border border-yellow-200";
}

function getFatigueBadge(level: string) {
  if (level === "healthy") return "bg-green-100 text-green-700 border border-green-200";
  if (level === "warning") return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  if (level === "fatigued") return "bg-orange-100 text-orange-700 border border-orange-200";
  return "bg-red-100 text-red-700 border border-red-200";
}

function isWindowActive(w: BudgetWindow): boolean {
  const now = new Date();
  const date = now.getDate();
  const day = now.getDay();
  const month = now.getMonth();
  const hour = now.getHours();
  if (w.id === "salary-week" && (date >= 25 || date <= 3)) return true;
  if (w.id === "weekend-surge" && (day === 0 || day === 6)) return true;
  if (w.id === "monday-fomo" && day === 1) return true;
  if (w.id === "mid-month-lull" && date >= 10 && date <= 20) return true;
  if (w.id === "payday-bonus" && month === 2) return true;
  if (w.id === "first-salary" && month === 6 && date <= 10) return true;
  if (w.id === "tax-refund" && (month === 8 || month === 9)) return true;
  if (w.id === "late-night" && (hour >= 22 || hour <= 1)) return true;
  return false;
}

// --- Tabs ---

type Tab = "signals" | "cities" | "budget" | "fatigue" | "stacking";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "signals", label: "Live Signals", icon: Zap },
  { key: "cities", label: "City Targeting", icon: MapPin },
  { key: "budget", label: "Budget Optimizer", icon: DollarSign },
  { key: "fatigue", label: "Creative Fatigue", icon: Palette },
  { key: "stacking", label: "Event Stacking", icon: Layers },
];

// --- Page ---

export default function SmartIntelPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("signals");

  useEffect(() => {
    fetch("/api/smart-intel")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load (${r.status})`);
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { setError(err.message || "Failed to load data"); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-sm text-muted">Analyzing city signals, budget windows, creative health & event stacks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm text-red-600 font-medium mb-2">Failed to load Smart Intel</p>
          <p className="text-xs text-muted mb-4">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetch("/api/smart-intel").then((r) => { if (!r.ok) throw new Error(`Failed (${r.status})`); return r.json(); }).then((d) => { setData(d); setLoading(false); }).catch((err) => { setError(err.message); setLoading(false); }); }}
            className="text-xs bg-brand-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={22} className="text-amber-500" />
            <h1 className="text-2xl font-bold">Smart Intel</h1>
          </div>
          <p className="text-sm text-muted">
            AI-powered recommendations combining city data, budget timing, creative health & event stacking
          </p>
        </div>
        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Target size={10} /> {data.summary.citiesMonitored} Cities Tracked
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Live Signals", value: (data.summary.totalSignals ?? 0).toString(), color: "amber", icon: Zap },
          { label: "Cities Monitored", value: data.summary.citiesMonitored.toString(), color: "blue", icon: MapPin },
          { label: "Active Budget Windows", value: data.summary.activeWindows.toString(), color: "green", icon: DollarSign },
          { label: "Fatigue Alerts", value: data.summary.fatigueAlerts.toString(), color: "red", icon: AlertTriangle },
          { label: "Event Stacks Active", value: data.summary.activeStacks.toString(), color: "purple", icon: Layers },
        ].map((s) => (
          <div key={s.label} className={`stat-card stat-card-${s.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted font-medium">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
              <s.icon size={18} className="text-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-card-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 text-sm px-4 py-2.5 font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-muted hover:text-text-primary hover:border-card-border"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "signals" && <LiveSignalsTab signals={data.signals ?? []} />}
      {activeTab === "cities" && <CityTargetingTab cities={data.cities} />}
      {activeTab === "budget" && <BudgetOptimizerTab windows={data.budgetWindows} />}
      {activeTab === "fatigue" && <CreativeFatigueTab alerts={data.creativeFatigue} />}
      {activeTab === "stacking" && <EventStackingTab stacks={data.eventStacks} />}
    </div>
  );
}

// ============================================================
// LIVE SIGNALS TAB
// ============================================================

function getSeverityBadge(severity: string) {
  if (severity === "critical") return "bg-red-100 text-red-700 border border-red-200";
  if (severity === "high") return "bg-orange-100 text-orange-700 border border-orange-200";
  if (severity === "medium") return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  return "bg-green-100 text-green-700 border border-green-200";
}

function getSourceLabel(source: string) {
  if (source.includes("City")) return { label: "City Intel", color: "bg-blue-50 text-blue-700" };
  if (source.includes("occasion")) return { label: "Occasion", color: "bg-purple-50 text-purple-700" };
  if (source.includes("gift")) return { label: "Gift", color: "bg-pink-50 text-pink-700" };
  if (source.includes("sale")) return { label: "Sale", color: "bg-amber-50 text-amber-700" };
  return { label: source, color: "bg-gray-50 text-gray-700" };
}

function LiveSignalsTab({ signals }: { signals: LiveSignal[] }) {
  if (signals.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Shield size={32} className="text-muted mx-auto mb-3" />
        <p className="text-sm text-muted">No live signals detected at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {signals.map((signal) => {
        const src = getSourceLabel(signal.source);
        return (
          <div key={signal.id} className={cn(
            "glass-card p-5",
            signal.severity === "critical" && "ring-2 ring-red-400/50",
            signal.severity === "high" && "ring-1 ring-orange-300/30"
          )}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Zap size={14} className={signal.severity === "critical" ? "text-red-500" : signal.severity === "high" ? "text-orange-500" : "text-amber-500"} />
                  <h3 className="font-semibold text-sm">{signal.title}</h3>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", src.color)}>
                    {src.label}
                  </span>
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <MapPin size={9} /> {signal.location}
                  </span>
                </div>
              </div>
              <span className={cn(
                "text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ml-2",
                getSeverityBadge(signal.severity)
              )}>
                {signal.severity}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-text-secondary mb-3 whitespace-pre-line leading-relaxed">{signal.description}</p>

            {/* Suggested Action */}
            <div className="p-3 bg-surface/50 border border-card-border rounded-lg mb-3">
              <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1">Suggested Action</p>
              <p className="text-xs text-text-secondary">{signal.suggestedAction}</p>
            </div>

            {/* Brands + Confidence row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {signal.suggestedBrands.slice(0, 5).map((brand) => (
                  <span key={brand} className="text-[10px] font-semibold bg-brand-blue/10 text-brand-blue px-1.5 py-0.5 rounded">
                    {brand}
                  </span>
                ))}
                {signal.suggestedBrands.length > 5 && (
                  <span className="text-[10px] text-muted">+{signal.suggestedBrands.length - 5} more</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted">Confidence</span>
                <div className="w-16 bg-surface rounded-full h-1.5">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      signal.confidence >= 0.9 ? "bg-green-500" : signal.confidence >= 0.8 ? "bg-blue-500" : "bg-yellow-500"
                    )}
                    style={{ width: `${signal.confidence * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold">{Math.round(signal.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// CITY TARGETING TAB
// ============================================================

function CityTargetingTab({ cities }: { cities: CityRecommendation[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {cities.map((city) => (
        <div key={city.city} className="glass-card p-5 space-y-4">
          {/* City header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-brand-blue" />
                <h3 className="font-semibold text-sm">{city.city}</h3>
                <span className="text-[10px] bg-surface text-muted px-2 py-0.5 rounded-full">
                  Pop: {city.population}
                </span>
              </div>
            </div>
            <span className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full",
              getMultiplierBadge(city.budgetMultiplier)
            )}>
              {city.budgetMultiplier}x budget
            </span>
          </div>

          {/* Luxury Index */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted uppercase tracking-wide">Luxury Index</span>
              <span className="text-xs font-semibold">{city.luxuryIndex}/10</span>
            </div>
            <div className="w-full bg-surface rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                style={{ width: `${city.luxuryIndex * 10}%` }}
              />
            </div>
          </div>

          {/* Current Conditions */}
          <div>
            <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5">Current Conditions</p>
            <div className="space-y-1">
              {city.currentConditions.map((cond, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                  <ChevronRight size={10} className="text-muted shrink-0 mt-0.5" />
                  {cond}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Ads */}
          <div>
            <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5">Recommended Ads</p>
            <div className="space-y-2">
              {city.recommendedAds.map((ad, i) => (
                <div key={i} className="p-2.5 border border-card-border rounded-lg bg-surface/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold bg-brand-blue/10 text-brand-blue px-1.5 py-0.5 rounded">
                      {ad.brand}
                    </span>
                    <span className="text-xs font-medium">{ad.product}</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-1">{ad.angle}</p>
                  <p className="text-[10px] text-muted italic">{ad.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Globe size={10} className="text-muted" />
            {city.platforms.map((p) => (
              <span key={p} className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                {p}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// BUDGET OPTIMIZER TAB
// ============================================================

function BudgetOptimizerTab({ windows }: { windows: BudgetWindow[] }) {
  return (
    <div className="space-y-4">
      {windows.map((w) => {
        const active = isWindowActive(w);
        return (
          <div key={w.id} className={cn("glass-card p-5", active && "ring-2 ring-green-400/50")}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <DollarSign size={16} className="text-green-600" />
                <h3 className="font-semibold text-sm">{w.window}</h3>
                {active && (
                  <span className="text-[10px] font-bold bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <Zap size={9} /> NOW ACTIVE
                  </span>
                )}
              </div>
              <span className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full",
                getMultiplierBadge(w.multiplier)
              )}>
                {w.multiplier}x spend
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted mb-3">
              <Calendar size={12} />
              {w.dateRange}
            </div>

            <p className="text-xs text-text-secondary mb-3">{w.reason}</p>

            <div className="p-3 bg-surface/50 border border-card-border rounded-lg mb-3">
              <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1">Recommendation</p>
              <p className="text-xs text-text-secondary">{w.recommendation}</p>
            </div>

            {/* Confidence */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-muted uppercase tracking-wide">Confidence</span>
                <span className="text-xs font-semibold">{Math.round(w.confidence * 100)}%</span>
              </div>
              <div className="w-full bg-surface rounded-full h-1.5">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    w.confidence >= 0.9 ? "bg-green-500" : w.confidence >= 0.8 ? "bg-blue-500" : "bg-yellow-500"
                  )}
                  style={{ width: `${w.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// CREATIVE FATIGUE TAB
// ============================================================

function CreativeFatigueTab({ alerts }: { alerts: CreativeFatigueAlert[] }) {
  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const ctrDecline = alert.peakCtr > 0
          ? Math.round(((alert.peakCtr - alert.currentCtr) / alert.peakCtr) * 100)
          : 0;
        const ctrRetained = 100 - ctrDecline;

        return (
          <div key={alert.id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Palette size={16} className="text-purple-500" />
                  <h3 className="font-semibold text-sm">{alert.campaignName}</h3>
                  <span className="text-[10px] font-semibold bg-brand-blue/10 text-brand-blue px-1.5 py-0.5 rounded">
                    {alert.brand}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{alert.creative}</p>
              </div>
              <span className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
                getFatigueBadge(alert.fatigueLevel)
              )}>
                {alert.fatigueLevel}
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="p-2.5 bg-surface/50 border border-card-border rounded-lg text-center">
                <p className="text-[10px] text-muted mb-0.5">Days Running</p>
                <p className="text-sm font-bold">{alert.daysRunning}</p>
              </div>
              <div className="p-2.5 bg-surface/50 border border-card-border rounded-lg text-center">
                <p className="text-[10px] text-muted mb-0.5">Current CTR</p>
                <p className="text-sm font-bold">{alert.currentCtr}%</p>
              </div>
              <div className="p-2.5 bg-surface/50 border border-card-border rounded-lg text-center">
                <p className="text-[10px] text-muted mb-0.5">Peak CTR</p>
                <p className="text-sm font-bold">{alert.peakCtr}%</p>
              </div>
            </div>

            {/* CTR decline progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-muted uppercase tracking-wide">CTR Retained</span>
                <span className="text-xs font-semibold">
                  {ctrRetained}%
                  {ctrDecline > 0 && (
                    <span className="text-red-500 ml-1">(-{ctrDecline}%)</span>
                  )}
                </span>
              </div>
              <div className="w-full bg-surface rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    ctrRetained >= 80 ? "bg-green-500" :
                    ctrRetained >= 60 ? "bg-yellow-500" :
                    ctrRetained >= 40 ? "bg-orange-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.max(ctrRetained, 5)}%` }}
                />
              </div>
            </div>

            {/* CTR Trend */}
            <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-3">
              <TrendingUp size={12} className={alert.fatigueLevel === "healthy" ? "text-green-500" : "text-red-500"} />
              {alert.ctrTrend}
            </div>

            {/* Recommendation */}
            <div className="p-3 bg-surface/50 border border-card-border rounded-lg mb-3">
              <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1">Recommendation</p>
              <p className="text-xs text-text-secondary">{alert.recommendation}</p>
            </div>

            {/* Suggested Swap */}
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
              <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wide mb-1">Suggested Swap</p>
              <p className="text-xs text-text-secondary">{alert.suggestedSwap}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// EVENT STACKING TAB
// ============================================================

function EventStackingTab({ stacks }: { stacks: EventStack[] }) {
  return (
    <div className="space-y-4">
      {stacks.map((stack) => {
        const isHighScore = stack.stackScore >= 8;
        const isMedScore = stack.stackScore >= 5;
        return (
          <div
            key={stack.id}
            className={cn(
              "glass-card p-5",
              isHighScore && "ring-2 ring-amber-400/50",
              isMedScore && !isHighScore && "ring-1 ring-blue-300/30"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className={isHighScore ? "text-amber-500" : "text-blue-500"} />
                <h3 className="font-semibold text-sm">{stack.city}</h3>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-lg font-bold",
                    isHighScore ? "text-amber-600" : isMedScore ? "text-blue-600" : "text-muted"
                  )}>
                    {stack.stackScore}
                  </span>
                  <span className="text-xs text-muted">/10</span>
                </div>
              </div>
            </div>

            {/* Stack score bar */}
            <div className="mb-3">
              <div className="w-full bg-surface rounded-full h-2.5">
                <div
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    isHighScore ? "bg-gradient-to-r from-amber-400 to-red-500" :
                    isMedScore ? "bg-gradient-to-r from-blue-400 to-blue-600" :
                    "bg-gray-400"
                  )}
                  style={{ width: `${stack.stackScore * 10}%` }}
                />
              </div>
            </div>

            {/* Signal tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {stack.signals.filter(Boolean).map((signal, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                    isHighScore
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  )}
                >
                  <Zap size={8} /> {signal}
                </span>
              ))}
            </div>

            {/* Recommendation */}
            <div className="p-3 bg-surface/50 border border-card-border rounded-lg mb-3">
              <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1">Recommendation</p>
              <p className="text-xs text-text-secondary">{stack.recommendation}</p>
            </div>

            {/* Budget Action & Expected Lift */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-card-border rounded-lg bg-surface/50">
                <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
                  <DollarSign size={9} /> Budget Action
                </p>
                <p className="text-xs text-text-secondary">{stack.budgetAction}</p>
              </div>
              <div className="p-3 border border-card-border rounded-lg bg-surface/50">
                <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
                  <BarChart3 size={9} /> Expected Lift
                </p>
                <p className="text-xs text-text-secondary">{stack.expectedLift}</p>
              </div>
            </div>
          </div>
        );
      })}

      {stacks.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Shield size={32} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No event stacks detected at this time.</p>
        </div>
      )}
    </div>
  );
}
