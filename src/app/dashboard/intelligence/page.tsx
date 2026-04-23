"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Radio, MapPin, Clock, Loader2,
  ThermometerSun, Trophy, Heart, PartyPopper,
  Briefcase, Gift, Monitor, TrendingUp,
  DollarSign, ShoppingBag, Flame, Package, Sparkles,
  Zap, BarChart3, Target, Calendar, Users, Star, Activity,
  Search, ChevronRight, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
  aesthetic: "Aesthetic", runway: "Runway", launch: "Launch", category_demand: "Category",
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

// ============================================================
// PAGE
// ============================================================

export default function IntelligencePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
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
      if (categoryFilter === "all") return true;
      if (categoryFilter === "external") return s.signalCategory === "external";
      if (categoryFilter === "internal") return s.signalCategory === "internal";
      return s.type === categoryFilter;
    });
  }, [data, severityFilter, categoryFilter]);

  // Category tabs — All + External + Internal + each signal type
  const categoryTabs = useMemo(() => {
    if (!data) return [{ key: "all", label: "All", count: 0 }];
    const tabs = [
      { key: "all", label: "All", count: data.signals.length },
      { key: "external", label: "External", count: data.externalCount || 0 },
      { key: "internal", label: "Internal", count: data.internalCount || 0 },
    ];
    const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([type, count]) => {
      tabs.push({ key: type, label: TYPE_LABELS[type] || type, count });
    });
    return tabs;
  }, [data, categoryCounts]);

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
            <p className="text-xs text-muted mt-1">AI-powered signal intelligence across all sources</p>
          </div>
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-1 mb-2">
          {(["all", "critical", "high", "medium", "low"] as const).map((sev) => {
            const count = severityCounts[sev];
            const label = sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1);
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                disabled={count === 0 && sev !== "all"}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  severityFilter === sev
                    ? "bg-navy text-white"
                    : count === 0 && sev !== "all"
                      ? "text-muted/40 cursor-default"
                      : "text-muted hover:bg-surface"
                )}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Category filter — wrapping */}
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-card-border">
          {categoryTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategoryFilter(tab.key)}
              disabled={tab.count === 0 && tab.key !== "all"}
              className={cn(
                "px-4 py-1 rounded-full text-xs font-medium transition-colors border",
                categoryFilter === tab.key
                  ? "bg-brand-blue text-white border-brand-blue"
                  : tab.count === 0 && tab.key !== "all"
                    ? "text-muted/40 border-card-border cursor-default"
                    : "text-muted border-card-border hover:border-muted hover:text-text"
              )}
            >
              {tab.label}{tab.key === "all" || tab.key === "external" || tab.key === "internal" ? ` (${tab.count})` : ""}
            </button>
          ))}
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
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-card-border panel-expand">
                    <div className="grid grid-cols-[1fr_1fr] gap-8">
                      {/* Left: Signal details */}
                      <div className="space-y-4">
                        {/* Type + Confidence */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-surface px-2 py-0.5 rounded font-medium">{TYPE_LABELS[signal.type] || signal.type}</span>
                          <span className="text-xs text-muted">{Math.round(signal.confidence * 100)}% confidence</span>
                          {signal.dataSource && (
                            signal.sourceUrl ? (
                              <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-blue hover:underline">
                                {signal.dataSource} ↗
                              </a>
                            ) : (
                              <span className="text-xs text-muted">{signal.dataSource}</span>
                            )
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs leading-relaxed">{signal.description}</p>

                        {/* Brands */}
                        {signal.suggestedBrands.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {signal.suggestedBrands.map((b) => (
                              <span key={b} className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">{b}</span>
                            ))}
                          </div>
                        )}

                        {/* Location + Archetypes */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted mb-1">LOCATION</p>
                            <p className="text-xs">{signal.location}</p>
                          </div>
                          {signal.targetArchetypes.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted mb-1">TARGET AUDIENCE</p>
                              <p className="text-xs">{signal.targetArchetypes.join(", ")}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: What to do */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-muted mb-1">WHY IT MATTERS</p>
                          <p className="text-xs leading-relaxed">{signal.triggersWhat}</p>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                          <p className="text-xs font-medium text-green-800 mb-1">RECOMMENDED ACTION</p>
                          <p className="text-xs text-green-700">{signal.suggestedAction}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
