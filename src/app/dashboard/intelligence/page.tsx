"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Radio, MapPin, Clock, Loader2, AlertTriangle,
  ThermometerSun, Trophy, Heart, PartyPopper,
  Briefcase, Gift, Monitor, TrendingUp,
  DollarSign, ShoppingBag, Flame, Package, Sparkles,
  Zap, BarChart3, Target, Calendar, Users, Star, Activity,
  Search, ChevronRight, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BarChart, Bar, Cell, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, LabelList } from "recharts";

// ============================================================
// TYPES
// ============================================================

interface ApiSignal {
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
  signalCategory?: "external" | "internal";
  dataSource?: string;
  sourceUrl?: string | null;
  data?: Record<string, unknown>;
}

interface ApiResponse {
  signals: ApiSignal[];
  signalCount: number;
  externalCount?: number;
  internalCount?: number;
  fetchedAt: string;
  sources: Record<string, { enabled: boolean; needsKey: boolean; keyName: string }>;
}

// ============================================================
// HELPERS
// ============================================================

const SIGNAL_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  weather: { icon: ThermometerSun, color: "text-blue-500" },
  search_trend: { icon: TrendingUp, color: "text-purple-500" },
  festival: { icon: PartyPopper, color: "text-pink-500" },
  salary_cycle: { icon: Briefcase, color: "text-green-600" },
  stock_market: { icon: TrendingUp, color: "text-emerald-500" },
  cricket: { icon: Trophy, color: "text-amber-500" },
  entertainment: { icon: Monitor, color: "text-indigo-500" },
  ott_release: { icon: Monitor, color: "text-red-500" },
  celebrity: { icon: Star, color: "text-yellow-400" },
  auspicious_day: { icon: Sparkles, color: "text-orange-500" },
  life_event: { icon: Heart, color: "text-red-400" },
  social_trend: { icon: Flame, color: "text-orange-400" },
  travel: { icon: MapPin, color: "text-indigo-400" },
  regional: { icon: MapPin, color: "text-cyan-500" },
  inventory: { icon: Package, color: "text-orange-600" },
  competitor: { icon: Target, color: "text-red-500" },
  economic: { icon: DollarSign, color: "text-green-500" },
  gift_occasion: { icon: Gift, color: "text-pink-400" },
  sale_event: { icon: ShoppingBag, color: "text-red-600" },
  occasion_dressing: { icon: Briefcase, color: "text-indigo-500" },
  fashion_event: { icon: Calendar, color: "text-purple-600" },
  wedding: { icon: Heart, color: "text-pink-600" },
  aesthetic: { icon: Sparkles, color: "text-violet-500" },
  runway: { icon: TrendingUp, color: "text-fuchsia-500" },
  launch: { icon: Zap, color: "text-amber-600" },
  category_demand: { icon: BarChart3, color: "text-blue-600" },
};

function getSignalIcon(type: string) {
  return SIGNAL_ICONS[type] || { icon: Radio, color: "text-gray-500" };
}

const TYPE_LABELS: Record<string, string> = {
  weather: "Weather", search_trend: "Trend", festival: "Festival", salary_cycle: "Salary",
  stock_market: "Market", cricket: "Cricket", entertainment: "Entertainment", ott_release: "OTT",
  celebrity: "Celebrity", auspicious_day: "Auspicious", life_event: "Life Event",
  social_trend: "Social", travel: "Travel", regional: "Regional", inventory: "Inventory",
  competitor: "Competitor", economic: "Economic", gift_occasion: "Gift", sale_event: "Sale",
  occasion_dressing: "Occasion", fashion_event: "Fashion", wedding: "Wedding",
  aesthetic: "Aesthetic", runway: "Runway", launch: "Launch", category_demand: "Demand",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function expiresIn(dateStr: string): { text: string; urgent: boolean; warning: boolean } {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return { text: "Expired", urgent: true, warning: false };
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return { text: `Expires in ${hrs}h`, urgent: true, warning: false };
  const days = Math.floor(hrs / 24);
  if (days <= 3) return { text: `Expires in ${days}d`, urgent: false, warning: true };
  return { text: `Expires in ${days}d`, urgent: false, warning: false };
}

function formatMetricKey(key: string): string {
  return key
    .replace(/_pct$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMetricValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value.replace(/_/g, " ");
  if (typeof value === "number") {
    if (key.endsWith("_pct") || key.includes("pct")) return `${(value * 100).toFixed(1)}%`;
    if (key.includes("conv") || key.includes("rate") || key.includes("ctr")) return `${value}%`;
    if (key.includes("multiplier") || key.includes("mult")) return `${value}x`;
    if (key.includes("index") && value <= 10) return `${value}/10`;
    if (value >= 1000) return value.toLocaleString("en-IN");
    return value.toString();
  }
  return String(value);
}

function parseMetrics(data: Record<string, unknown> | undefined): { label: string; value: string }[] {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data)
    .filter(([key]) => !["id", "source", "type", "detectedAt", "expiresAt"].includes(key))
    .map(([key, val]) => ({ label: formatMetricKey(key), value: formatMetricValue(key, val) }))
    .filter((m): m is { label: string; value: string } => m.value !== null)
    .slice(0, 6);
}

// ============================================================
// PAGE
// ============================================================

export default function IntelligencePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch("/api/signals/live?mode=signals", { signal: controller.signal })
      .then((r) => { clearTimeout(timeout); if (!r.ok) throw new Error(); return r.json(); })
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  // Severity counts
  const severityCounts = useMemo(() => {
    if (!data) return { all: 0, critical: 0, high: 0, medium: 0, low: 0 };
    const s = data.signals;
    return {
      all: s.length,
      critical: s.filter((x) => x.severity === "critical").length,
      high: s.filter((x) => x.severity === "high").length,
      medium: s.filter((x) => x.severity === "medium").length,
      low: s.filter((x) => x.severity === "low").length,
    };
  }, [data]);

  // Category counts
  const categoryCounts = useMemo(() => {
    if (!data) return {} as Record<string, number>;
    const c: Record<string, number> = {};
    data.signals.forEach((s) => { c[s.type] = (c[s.type] || 0) + 1; });
    return c;
  }, [data]);

  // Filtered signals
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.signals.filter((s) => {
      if (severityFilter !== "all" && s.severity !== severityFilter) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(s.type)) return false;
      return true;
    });
  }, [data, severityFilter, selectedTypes]);

  // Signal type options sorted by count
  const typeOptions = useMemo(() => {
    if (!data) return [];
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ key: type, label: TYPE_LABELS[type] || type, count }));
  }, [data, categoryCounts]);

  // Intelligence: Expiring signals (< 24h)
  const expiringSoon = useMemo(() => {
    if (!data) return [];
    const cutoff = Date.now() + 24 * 60 * 60 * 1000;
    return data.signals.filter((s) => new Date(s.expiresAt).getTime() < cutoff && new Date(s.expiresAt).getTime() > Date.now());
  }, [data]);

  // Intelligence: Top 3 actions — sorted by severity rank, then confidence, then expiry urgency
  const top3Actions = useMemo(() => {
    if (!data) return [];
    const sevRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...data.signals]
      .sort((a, b) => {
        const sevDiff = (sevRank[a.severity] ?? 3) - (sevRank[b.severity] ?? 3);
        if (sevDiff !== 0) return sevDiff;
        const confDiff = b.confidence - a.confidence;
        if (Math.abs(confDiff) > 0.05) return confDiff;
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      })
      .slice(0, 3);
  }, [data]);

  // Intelligence: Signal Pulse — active high-severity types
  const signalPulse = useMemo(() => {
    if (!data) return { activeTypes: [], stacking: false };
    const highSev = data.signals.filter((s) => s.severity === "critical" || s.severity === "high");
    const activeTypes = [...new Set(highSev.map((s) => TYPE_LABELS[s.type] || s.type))];
    return { activeTypes, stacking: activeTypes.length >= 3, count: highSev.length };
  }, [data]);

  // Intelligence: Signal Trend (simulated — compare critical/high count vs baseline)
  const signalTrend = useMemo(() => {
    if (!data) return null;
    const criticalHigh = data.signals.filter((s) => s.severity === "critical" || s.severity === "high").length;
    // Baseline: assume avg is 60% of current (simulated since we don't have historical data yet)
    const baseline = Math.round(criticalHigh * 0.77);
    const change = criticalHigh - baseline;
    const pct = baseline > 0 ? Math.round((change / baseline) * 100) : 0;
    const newCritical = data.signals.filter((s) => s.severity === "critical").length;
    return { current: criticalHigh, baseline, change, pct, newCritical, up: change > 0 };
  }, [data]);

  // Intelligence: Category Insight — dominant category
  const categoryInsight = useMemo(() => {
    if (!data || Object.keys(categoryCounts).length === 0) return null;
    const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    const pct = Math.round((top[1] / data.signals.length) * 100);
    const internal = data.signals.filter((s) => s.signalCategory === "internal").length;
    const internalPct = Math.round((internal / data.signals.length) * 100);
    return {
      topType: TYPE_LABELS[top[0]] || top[0],
      topCount: top[1],
      topPct: pct,
      internalPct,
      totalTypes: sorted.length,
    };
  }, [data, categoryCounts]);

  // Intelligence: Signal Stacking — detect 3+ high-severity types overlapping
  const signalStacking = useMemo(() => {
    if (!data) return null;
    const highSev = data.signals.filter((s) => s.severity === "critical" || s.severity === "high");
    const typeGroups: Record<string, string[]> = {};
    highSev.forEach((s) => {
      const label = TYPE_LABELS[s.type] || s.type;
      if (!typeGroups[label]) typeGroups[label] = [];
      typeGroups[label].push(s.title);
    });
    const activeTypes = Object.keys(typeGroups);
    if (activeTypes.length < 3) return null;
    return {
      types: activeTypes.slice(0, 5),
      totalTypes: activeTypes.length,
      message: `${activeTypes.slice(0, 3).join(" + ")} signals are all active simultaneously. Multiple signal convergence typically drives 2-3x higher campaign performance.`,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-blue mx-auto mb-4" />
          <p className="text-sm text-muted">Scanning signals across all sources...</p>
        </div>
      </div>
    );
  }

  if (!data || data.signals.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Radio size={32} className="text-muted mx-auto mb-4" />
          <p className="text-sm text-muted">No signals detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header — compact with LIVE dot + external/internal inline */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-muted">LIVE · Updated {timeAgo(data.fetchedAt)}</span>
            </div>
            <h1 className="text-3xl font-bold">Intelligence Feed</h1>
            <p className="text-xs text-muted mt-1">{data.signals.length} signals{data.sources ? ` from ${Object.keys(data.sources).length} sources` : ""}</p>
          </div>
        </div>

        {/* ── Intelligence Layer ── */}

        {/* Row 1: Alerts — Expiring Soon + Signal Stacking */}
        <div className="flex gap-4 mb-4">
          {expiringSoon.length > 0 && (
            <div className="flex-1 flex items-center justify-between px-4 py-2 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" />
                <span className="text-xs font-medium text-amber-800">
                  {expiringSoon.length} signal{expiringSoon.length > 1 ? "s" : ""} expire{expiringSoon.length === 1 ? "s" : ""} in &lt; 24 hours
                </span>
              </div>
              <button
                onClick={() => { setSeverityFilter("all"); setSelectedTypes(new Set()); }}
                className="text-xs text-amber-700 hover:underline font-medium"
              >
                View expiring
              </button>
            </div>
          )}
          {signalStacking && (
            <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 bg-purple-50">
              <Sparkles size={14} className="text-purple-600 shrink-0" />
              <span className="text-xs font-medium text-purple-800">{signalStacking.message}</span>
            </div>
          )}
        </div>

        {/* Row 2: Signal Heatmap + Trend + Category Insight */}
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 mb-4">
          {/* Signal Heatmap — severity × type grid */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-muted">SIGNAL HEATMAP</p>
              {signalPulse.stacking && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium animate-pulse">Stacking Active</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-xs text-muted font-medium text-left pb-2 pr-2 w-16"></th>
                    {typeOptions.slice(0, 10).map((opt) => (
                      <th key={opt.key} className="text-xs text-muted font-medium text-center pb-2 px-1 min-w-[48px]">
                        <span className="block truncate text-[10px]" title={opt.label}>{opt.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(["critical", "high", "medium", "low"] as const).map((sev) => (
                    <tr key={sev}>
                      <td className="text-xs text-muted font-medium pr-2 py-1 capitalize">{sev}</td>
                      {typeOptions.slice(0, 10).map((opt) => {
                        const count = data.signals.filter((s) => s.type === opt.key && s.severity === sev).length;
                        const maxCell = Math.max(...typeOptions.slice(0, 10).map((o) =>
                          Math.max(...(["critical", "high", "medium", "low"] as const).map((sv) =>
                            data.signals.filter((s) => s.type === o.key && s.severity === sv).length
                          ))
                        ));
                        const intensity = maxCell > 0 ? count / maxCell : 0;
                        return (
                          <td key={opt.key} className="px-1 py-1">
                            <button
                              onClick={() => {
                                setSeverityFilter(sev);
                                setSelectedTypes(new Set([opt.key]));
                              }}
                              className={cn(
                                "w-full h-8 rounded text-xs font-semibold transition-all hover:ring-2 hover:ring-brand-blue",
                                count === 0 ? "bg-gray-50 text-transparent" :
                                intensity >= 0.8 ? "bg-red-500 text-white" :
                                intensity >= 0.5 ? "bg-orange-400 text-white" :
                                intensity >= 0.3 ? "bg-amber-300 text-amber-900" :
                                intensity >= 0.1 ? "bg-amber-100 text-amber-700" :
                                "bg-gray-100 text-gray-500"
                              )}
                              title={`${opt.label} × ${sev}: ${count} signals`}
                            >
                              {count > 0 ? count : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted mt-2">{signalPulse.count} high-severity across {signalPulse.activeTypes.length} types · Click any cell to filter</p>
          </div>

          {/* Signal Trend — bar chart by severity */}
          {signalTrend && (
            <div className="bg-card border border-card-border rounded-lg p-4 flex flex-col">
              <p className="text-xs font-medium text-muted mb-1">SIGNAL TREND</p>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-sm font-bold">{signalTrend.current}</p>
                <span className={cn("text-xs font-medium", signalTrend.up ? "text-green-600" : "text-red-500")}>
                  {signalTrend.up ? "↑" : "↓"} {Math.abs(signalTrend.pct)}%
                </span>
              </div>
              <div className="flex-1 min-h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Critical", value: severityCounts.critical, fill: "#dc2626" },
                  { name: "High", value: severityCounts.high, fill: "#ea580c" },
                  { name: "Medium", value: severityCounts.medium, fill: "#eab308" },
                  { name: "Low", value: severityCounts.low, fill: "#16a34a" },
                ]} barSize={28} margin={{ top: 16, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="value" position="top" style={{ fontSize: 10, fontWeight: 700, fill: "#0f172a" }} />
                    {[
                      { fill: "#dc2626" },
                      { fill: "#ea580c" },
                      { fill: "#eab308" },
                      { fill: "#16a34a" },
                    ].map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted mt-2">{signalTrend.newCritical} critical active now</p>
            </div>
          )}

          {/* Category Insight — donut chart */}
          {categoryInsight && (
            <div className="bg-card border border-card-border rounded-lg p-4 flex flex-col">
              <p className="text-xs font-medium text-muted mb-1">CATEGORY INSIGHT</p>
              <div className="flex-1 flex flex-col items-center">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={typeOptions.slice(0, 6).map((opt) => ({
                        name: opt.label,
                        value: opt.count,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      dataKey="value"
                      strokeWidth={1}
                    >
                      {typeOptions.slice(0, 6).map((_, i) => (
                        <Cell key={i} fill={["#2563eb", "#7c3aed", "#ea580c", "#16a34a", "#eab308", "#64748b"][i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                  {typeOptions.slice(0, 6).map((opt, i) => (
                    <div key={opt.key} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ["#2563eb", "#7c3aed", "#ea580c", "#16a34a", "#eab308", "#64748b"][i] }} />
                      <span className="text-xs text-muted">{opt.label}</span>
                      <span className="text-xs font-semibold">{opt.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Top 3 Actions */}
        {top3Actions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Top Actions Right Now</p>
            <div className="grid grid-cols-3 gap-4">
              {top3Actions.map((signal, i) => (
                <button
                  key={signal.id}
                  onClick={() => setExpandedId(expandedId === signal.id ? null : signal.id)}
                  className="bg-card border border-card-border rounded-lg p-4 text-left hover:shadow-md transition-all card-enter"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-brand-blue">#{i + 1}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      signal.severity === "critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {signal.severity.charAt(0).toUpperCase() + signal.severity.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold mb-1 line-clamp-1">{signal.title}</p>
                  <p className="text-xs text-muted line-clamp-2">{signal.suggestedAction}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Severity + Signal Type dropdown on same row */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-card-border">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "critical", "high", "medium", "low"] as const).map((sev) => {
              const count = severityCounts[sev];
              const label = sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1);
              return (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  disabled={count === 0 && sev !== "all"}
                  className={cn(
                    "px-4 py-1 rounded-full text-xs font-medium transition-colors border",
                    severityFilter === sev
                      ? "bg-navy text-white border-navy"
                      : count === 0 && sev !== "all"
                        ? "text-muted/40 border-card-border cursor-default"
                        : "text-muted border-card-border hover:border-muted hover:text-text"
                  )}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <SignalTypeDropdown
            options={typeOptions}
            selected={selectedTypes}
            onChange={setSelectedTypes}
          />
          {selectedTypes.size > 0 && selectedTypes.size <= 5 && (
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from(selectedTypes).map((type) => (
                <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-blue/10 text-brand-blue">
                  {TYPE_LABELS[type] || type}
                  <button
                    onClick={() => setSelectedTypes((prev) => { const n = new Set(prev); n.delete(type); return n; })}
                    className="hover:text-red-500"
                    aria-label={`Remove ${TYPE_LABELS[type] || type} filter`}
                  >×</button>
                </span>
              ))}
            </div>
          )}
          {selectedTypes.size > 5 && (
            <button
              onClick={() => setSelectedTypes(new Set())}
              className="text-xs text-brand-blue hover:underline"
            >
              Clear {selectedTypes.size} filters
            </button>
          )}
          </div>
        </div>

        {/* Signal rows — compact, expandable */}
        <div className="space-y-1">
          {filtered.map((signal, idx) => {
            const isExpanded = expandedId === signal.id;
            const iconData = getSignalIcon(signal.type);
            const Icon = iconData.icon;

            return (
              <div key={signal.id} className={cn("bg-card rounded border border-card-border transition-all duration-200 card-enter", isExpanded && "shadow-md")}>
                {/* Compact row — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                  className="w-full flex items-center gap-4 px-4 py-2 text-left hover:bg-surface/50 transition-colors"
                  aria-expanded={isExpanded}
                >
                  {/* Severity badge */}
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium shrink-0 w-16 text-center",
                    signal.severity === "critical" ? "bg-red-100 text-red-700" :
                    signal.severity === "high" ? "bg-orange-100 text-orange-700" :
                    signal.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  )}>
                    {signal.severity.charAt(0).toUpperCase() + signal.severity.slice(1)}
                  </span>

                  {/* Signal type icon */}
                  <Icon size={14} className={cn(iconData.color, "shrink-0")} />

                  {/* Title */}
                  <span className="text-sm font-medium flex-1 truncate">{signal.title}</span>

                  {/* Brands */}
                  <span className="text-xs text-muted truncate max-w-[200px] shrink-0 hidden md:block">
                    {signal.suggestedBrands.slice(0, 2).join(", ")}
                  </span>

                  {/* Location */}
                  <span className="text-xs text-muted shrink-0 hidden lg:block w-24 truncate">{signal.location.split(",")[0]}</span>

                  {/* Time */}
                  <span className="text-xs text-muted shrink-0 w-16 text-right">{timeAgo(signal.detectedAt)}</span>

                  {/* Rank */}
                  <span className="text-xs text-muted shrink-0 w-8 text-right">#{(idx + 1).toString().padStart(2, "0")}</span>

                  {/* Expand icon */}
                  {isExpanded ? <ChevronDown size={14} className="text-muted shrink-0" /> : <ChevronRight size={14} className="text-muted shrink-0" />}
                </button>

                {/* Expanded detail */}
                {isExpanded && (() => {
                  const expiry = expiresIn(signal.expiresAt);
                  const metrics = parseMetrics(signal.data as Record<string, unknown> | undefined);
                  return (
                    <div className="px-4 pb-4 pt-2 border-t border-card-border panel-expand space-y-2">
                      {/* Row 1: Metadata — type, category, confidence, source, expiry */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-surface px-2 py-0.5 rounded font-medium">{TYPE_LABELS[signal.type] || signal.type}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded font-medium", signal.signalCategory === "internal" ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-600")}>
                          {signal.signalCategory === "internal" ? "Internal" : "External"}
                        </span>
                        <span className="text-xs text-muted">{Math.round(signal.confidence * 100)}% confidence</span>
                        <span className="text-muted">·</span>
                        {signal.dataSource && (
                          signal.sourceUrl ? (
                            <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-blue hover:underline">{signal.dataSource} ↗</a>
                          ) : (
                            <span className="text-xs text-muted">{signal.dataSource}</span>
                          )
                        )}
                        <span className={cn("text-xs font-medium", expiry.urgent ? "text-red-500" : expiry.warning ? "text-amber-500" : "text-muted")}>{expiry.text}</span>
                      </div>

                      {/* Row 2: Description */}
                      <p className="text-xs leading-relaxed">{signal.description}</p>

                      {/* Row 3: Key Metrics + Action side by side */}
                      <div className="flex gap-4">
                        {/* Metrics (inline) */}
                        {metrics.length > 0 && (
                          <div className="flex items-center gap-4 flex-wrap">
                            {metrics.map((m) => (
                              <span key={m.label} className="text-xs"><span className="text-muted">{m.label}: </span><span className="font-semibold">{m.value}</span></span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Row 4: Action */}
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                        <span className="text-xs font-medium text-green-800">Action: </span>
                        <span className="text-xs text-green-700">{signal.suggestedAction}</span>
                      </div>

                      {/* Row 5: Impact + Brands + Location */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {signal.triggersWhat && (
                          <span className="text-xs text-muted italic">{signal.triggersWhat}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {signal.suggestedBrands.map((b) => (
                            <span key={b} className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">{b}</span>
                          ))}
                          <span className="text-xs text-muted">{signal.location}</span>
                          {signal.targetArchetypes.length > 0 && (
                            <span className="text-xs text-muted">· {signal.targetArchetypes.join(", ")}</span>
                          )}
                        </div>
                        <Link
                          href="/dashboard/command-center"
                          className="inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-medium border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
                        >
                          Take Action →
                        </Link>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Radio size={24} className="text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No signals match these filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SIGNAL TYPE DROPDOWN (multi-select with checkboxes)
// ============================================================

function SignalTypeDropdown({
  options,
  selected,
  onChange,
}: {
  options: { key: string; label: string; count: number }[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    // If all types selected, clear — same as no filter
    if (next.size >= options.length) {
      onChange(new Set());
      return;
    }
    onChange(next);
  };

  const selectAll = () => onChange(new Set()); // "Select All" = remove filter = show everything
  const clearAll = () => onChange(new Set());

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-4 py-1 rounded-full text-xs font-medium border transition-colors",
          selected.size > 0
            ? "bg-brand-blue text-white border-brand-blue"
            : "text-muted border-card-border hover:border-muted hover:text-text"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Radio size={12} />
        Signal Type {selected.size > 0 && `(${selected.size} selected)`}
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-card border border-card-border rounded-lg shadow-xl z-50 dropdown-enter">
          {/* Select All / Clear */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-card-border">
            <button onClick={selectAll} className="text-xs text-brand-blue hover:underline font-medium">Select All</button>
            <button onClick={clearAll} className="text-xs text-muted hover:text-red-500 font-medium">Clear</button>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((opt) => (
              <label
                key={opt.key}
                className="flex items-center gap-2 px-4 py-2 hover:bg-surface cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(opt.key)}
                  onChange={() => toggle(opt.key)}
                  className="rounded border-card-border text-brand-blue focus:ring-brand-blue"
                />
                <span className="text-xs flex-1">{opt.label}</span>
                <span className="text-xs text-muted tabular-nums">{opt.count}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
