"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Radio,
  AlertTriangle,
  Flame,
  CloudRain,
  Package,
  TrendingUp,
  Sparkles,
  Clock,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Zap,
  Filter,
  Bell,
  Loader2,
  RefreshCw,
  MapPin,
  Calendar,
  PartyPopper,
  Trophy,
  Users,
  Briefcase,
  Monitor,
  Shield,
  Activity,
  Star,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ---------- Types ----------

interface APISignal {
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
  data?: Record<string, any>;
}

interface SourceStatus {
  enabled: boolean;
  needsKey?: boolean;
  keyName?: string;
}

interface APIResponse {
  signals: APISignal[];
  recommendations: any[];
  signalCount: number;
  recommendationCount: number;
  fetchedAt: string;
  sources: Record<string, SourceStatus>;
}

interface SignalRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "paused";
  triggeredCount: number;
}

// ---------- Static automation rules ----------

const mockRules: SignalRule[] = [
  { id: "r1", name: "Trend Spike Detection", trigger: "Google Trends API", condition: "Brand/product search volume > 2x 7-day baseline", action: "Auto-boost campaign budget by 30%", severity: "critical", status: "active", triggeredCount: 4 },
  { id: "r2", name: "Low Inventory Alert", trigger: "Inventory Sync", condition: "Stock quantity < 5 units", action: "Pause ads + add low_stock feed label", severity: "high", status: "active", triggeredCount: 8 },
  { id: "r3", name: "Weather Trigger", trigger: "Weather API (OpenWeather)", condition: "Precipitation > 20mm in target city", action: "Activate seasonal campaign for city", severity: "medium", status: "active", triggeredCount: 3 },
  { id: "r4", name: "ROAS Floor Breach", trigger: "Ad Platform APIs", condition: "Campaign ROAS < 1.5x for 3 consecutive cycles", action: "Flag for review + recommend budget shift", severity: "high", status: "active", triggeredCount: 2 },
  { id: "r5", name: "Competitor Bid Alert", trigger: "Google Ads Auction Insights", condition: "Competitor impression share increase > 20%", action: "Increase brand bid by 15%", severity: "high", status: "active", triggeredCount: 5 },
  { id: "r6", name: "High-Value Customer", trigger: "Order System", condition: "Single order > INR 50K from new customer", action: "Classify archetype + add to VIP segment", severity: "medium", status: "active", triggeredCount: 12 },
  { id: "r7", name: "CTR Spike", trigger: "Meta/Google Ads", condition: "Creative CTR > 2x campaign average", action: "Auto-rotate to winning creative", severity: "low", status: "active", triggeredCount: 18 },
  { id: "r8", name: "Social Mention", trigger: "Social Listening API", condition: "Brand mentioned in publication with DA > 70", action: "Alert team + recommend topical campaign", severity: "low", status: "paused", triggeredCount: 6 },
];

// ---------- Helpers ----------

const ALL_TYPES = [
  "all", "weather", "festival", "salary_cycle", "cricket", "celebrity",
  "social_trend", "competitor", "regional", "entertainment", "auspicious_day",
  "search_trend", "stock_market", "exam_results", "inventory", "life_event",
  "economic", "ott_release", "travel",
] as const;

function getTypeIcon(type: string) {
  switch (type) {
    case "weather": return CloudRain;
    case "festival": return PartyPopper;
    case "salary_cycle": return Briefcase;
    case "cricket": return Trophy;
    case "celebrity": return Star;
    case "social_trend": return TrendingUp;
    case "competitor": return AlertTriangle;
    case "regional": return MapPin;
    case "entertainment": case "ott_release": return Monitor;
    case "auspicious_day": return Sparkles;
    case "search_trend": return Flame;
    case "stock_market": return Activity;
    case "exam_results": return Users;
    case "inventory": return Package;
    case "life_event": return Calendar;
    case "economic": return TrendingUp;
    case "travel": return Plane;
    default: return Radio;
  }
}

function severityColor(severity: string) {
  switch (severity) {
    case "critical": return { bg: "bg-red-100", text: "text-red-600" };
    case "high": return { bg: "bg-orange-100", text: "text-orange-600" };
    case "medium": return { bg: "bg-yellow-100", text: "text-yellow-600" };
    case "low": return { bg: "bg-green-100", text: "text-green-600" };
    default: return { bg: "bg-gray-100", text: "text-gray-600" };
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatLabel(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------- Component ----------

export default function SignalsPage() {
  const [signals, setSignals] = useState<APISignal[]>([]);
  const [sources, setSources] = useState<Record<string, SourceStatus>>({});
  const [fetchedAt, setFetchedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"signals" | "rules" | "sources">("signals");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/signals/live?mode=full");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: APIResponse = await res.json();
      setSignals(data.signals || []);
      setSources(data.sources || {});
      setFetchedAt(data.fetchedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err.message || "Failed to fetch signals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // ---------- Derived ----------

  const criticalCount = signals.filter((s) => s.severity === "critical").length;
  const highCount = signals.filter((s) => s.severity === "high").length;
  const mediumCount = signals.filter((s) => s.severity === "medium").length;
  const lowCount = signals.filter((s) => s.severity === "low").length;
  const enabledSources = Object.values(sources).filter((s) => s.enabled).length;

  const typesPresent = Array.from(new Set(signals.map((s) => s.type)));

  const filteredSignals = signals.filter((s) => {
    if (severityFilter !== "all" && s.severity !== severityFilter) return false;
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    return true;
  });

  // ---------- Loading state ----------

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-blue mx-auto mb-4" />
          <p className="text-sm text-muted">Scanning signals across 16 sources...</p>
          <p className="text-xs text-muted mt-1">Weather, festivals, cricket, salary cycles, celebrities, trends...</p>
        </div>
      </div>
    );
  }

  // ---------- Error state ----------

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-red-600">Failed to load signals</p>
          <p className="text-xs text-muted mt-1">{error}</p>
          <button onClick={fetchSignals} className="btn-primary mt-4">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Signal Processing</h1>
          <p className="text-sm text-muted mt-1">
            Real-time signal ingestion from {Object.keys(sources).length} sources. Auto-triggers campaign actions.
          </p>
          {fetchedAt && (
            <p className="text-[10px] text-muted mt-0.5">Last fetched: {new Date(fetchedAt).toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSignals} className="btn-secondary flex items-center gap-1.5">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn-primary flex items-center gap-1.5">
            <Plus size={16} /> Create Rule
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted font-medium">Total Signals</p>
          <p className="text-2xl font-bold mt-1">{signals.length}</p>
        </div>
        <div className="stat-card stat-card-red">
          <p className="text-xs text-muted font-medium">Critical</p>
          <p className="text-2xl font-bold mt-1">{criticalCount}</p>
        </div>
        <div className="stat-card stat-card-orange">
          <p className="text-xs text-muted font-medium">High</p>
          <p className="text-2xl font-bold mt-1">{highCount}</p>
        </div>
        <div className="stat-card stat-card-yellow">
          <p className="text-xs text-muted font-medium">Medium</p>
          <p className="text-2xl font-bold mt-1">{mediumCount}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-xs text-muted font-medium">Low</p>
          <p className="text-2xl font-bold mt-1">{lowCount}</p>
        </div>
        <div className="stat-card stat-card-purple">
          <p className="text-xs text-muted font-medium">Sources Active</p>
          <p className="text-2xl font-bold mt-1">{enabledSources}/{Object.keys(sources).length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["signals", "rules", "sources"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              activeTab === tab
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-muted hover:text-text"
            )}
          >
            {tab === "signals" ? `Live Signals (${signals.length})` : tab === "rules" ? "Signal Rules" : "Source Health"}
          </button>
        ))}
      </div>

      {/* ==================== SIGNALS TAB ==================== */}
      {activeTab === "signals" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter size={14} className="text-muted" />

            {/* Severity filter */}
            <div className="flex gap-1">
              {["all", "critical", "high", "medium", "low"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-full border transition-colors capitalize",
                    severityFilter === sev
                      ? "bg-brand-blue text-white border-brand-blue"
                      : "bg-white text-muted border-gray-200 hover:border-gray-400"
                  )}
                >
                  {sev === "all" ? "All Severity" : sev}
                </button>
              ))}
            </div>

            <span className="text-gray-300">|</span>

            {/* Type filter - only show types that have signals */}
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setTypeFilter("all")}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full border transition-colors",
                  typeFilter === "all"
                    ? "bg-brand-blue text-white border-brand-blue"
                    : "bg-white text-muted border-gray-200 hover:border-gray-400"
                )}
              >
                All Types
              </button>
              {typesPresent.sort().map((type) => {
                const count = signals.filter((s) => s.type === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-full border transition-colors",
                      typeFilter === type
                        ? "bg-brand-blue text-white border-brand-blue"
                        : "bg-white text-muted border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {formatLabel(type)} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtered count */}
          {(severityFilter !== "all" || typeFilter !== "all") && (
            <p className="text-xs text-muted">
              Showing {filteredSignals.length} of {signals.length} signals
            </p>
          )}

          {/* Signal Cards */}
          {filteredSignals.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Radio size={24} className="text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No signals match the current filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSignals.map((signal) => {
                const Icon = getTypeIcon(signal.type);
                const sev = severityColor(signal.severity);
                return (
                  <div key={signal.id} className="glass-card p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2 rounded-lg shrink-0", sev.bg)}>
                        <Icon size={18} className={sev.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`signal-badge signal-${signal.severity}`}>
                            {signal.severity}
                          </span>
                          <span className="text-[10px] text-muted bg-gray-100 px-2 py-0.5 rounded">
                            {formatLabel(signal.type)}
                          </span>
                          <span className="text-[10px] text-muted bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <MapPin size={9} /> {signal.location}
                          </span>
                          <span className="text-xs text-muted flex items-center gap-1">
                            <Clock size={10} /> {timeAgo(signal.detectedAt)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold">{signal.title}</p>
                        <p className="text-xs text-muted mt-0.5">{signal.description}</p>

                        {/* Suggested Action */}
                        {signal.suggestedAction && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600">
                            <Zap size={12} />
                            <span>{signal.suggestedAction}</span>
                          </div>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-[10px] text-muted">Source: {signal.source}</span>
                          <span className="text-[10px] text-muted flex items-center gap-1">
                            <Shield size={9} />
                            Confidence: {Math.round(signal.confidence * 100)}%
                          </span>
                          {signal.suggestedBrands && signal.suggestedBrands.length > 0 && (
                            <span className="text-[10px] text-muted">
                              Brands: {signal.suggestedBrands.slice(0, 3).join(", ")}
                              {signal.suggestedBrands.length > 3 && ` +${signal.suggestedBrands.length - 3}`}
                            </span>
                          )}
                          {signal.targetArchetypes && signal.targetArchetypes.length > 0 && (
                            <span className="text-[10px] text-muted flex items-center gap-1">
                              <Users size={9} />
                              {signal.targetArchetypes.slice(0, 2).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== RULES TAB ==================== */}
      {activeTab === "rules" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Signal Rules Manager</h3>
            <button className="btn-primary flex items-center gap-1.5"><Plus size={14} /> New Rule</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Rule Name</th>
                <th className="pb-3 font-medium text-muted">Trigger Source</th>
                <th className="pb-3 font-medium text-muted">Condition</th>
                <th className="pb-3 font-medium text-muted">Action</th>
                <th className="pb-3 font-medium text-muted">Severity</th>
                <th className="pb-3 font-medium text-muted">Triggered</th>
                <th className="pb-3 font-medium text-muted">Status</th>
                <th className="pb-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{rule.name}</td>
                  <td className="py-3 text-muted text-xs">{rule.trigger}</td>
                  <td className="py-3 text-xs">{rule.condition}</td>
                  <td className="py-3 text-xs">{rule.action}</td>
                  <td className="py-3">
                    <span className={`signal-badge signal-${rule.severity}`}>{rule.severity}</span>
                  </td>
                  <td className="py-3">{rule.triggeredCount}x</td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      rule.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    )}>
                      {rule.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-md hover:bg-gray-100"><Edit3 size={14} className="text-muted" /></button>
                      <button className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={14} className="text-muted" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== SOURCES TAB ==================== */}
      {activeTab === "sources" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Signal Source Health</h3>
            <p className="text-xs text-muted">{enabledSources} of {Object.keys(sources).length} sources active</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(sources).map(([name, status]) => {
              const signalCount = signals.filter((s) => s.type === name || s.source.toLowerCase().includes(name)).length;
              return (
                <div
                  key={name}
                  className={cn(
                    "border rounded-lg p-4 flex items-center justify-between",
                    status.enabled ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-gray-50/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      status.enabled ? "bg-green-500" : "bg-gray-400"
                    )} />
                    <div>
                      <p className="text-sm font-medium capitalize">{formatLabel(name)}</p>
                      {status.needsKey && (
                        <p className="text-[10px] text-orange-600">Needs API key: {status.keyName}</p>
                      )}
                      {!status.needsKey && status.enabled && (
                        <p className="text-[10px] text-green-600">Active</p>
                      )}
                      {!status.enabled && !status.needsKey && (
                        <p className="text-[10px] text-gray-500">Disabled</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{signalCount}</p>
                    <p className="text-[10px] text-muted">signals</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
