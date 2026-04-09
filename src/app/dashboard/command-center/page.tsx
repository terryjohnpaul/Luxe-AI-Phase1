"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, DollarSign, ShoppingBag,
  CloudRain, Sun, Flame, AlertTriangle, Package, Sparkles,
  Check, X, RefreshCw, Clock, Zap,
  Radio, BarChart3, Target, MapPin, Calendar, Users, Star,
  ChevronDown, ChevronRight,
  ThermometerSun, Umbrella, Trophy,
  Heart, Megaphone, Copy, ExternalLink, Loader2,
  PartyPopper, Briefcase, TrendingDown, Gift, Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ============================================================
// TYPES (matching API response)
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
}

interface AdRecommendation {
  id: string;
  signalId: string;
  signalTitle: string;
  signalType: string;
  priority: "urgent" | "high" | "medium" | "opportunity";
  title: string;
  description: string;
  creative: {
    direction: string;
    suggestedFormats: string[];
    brands: string[];
    sampleHeadlines: string[];
    samplePrimaryTexts: string[];
    cta: string;
  };
  targeting: {
    archetypes: string[];
    location: string;
    timing: string;
    platforms: { meta: string; google: string; reason: string };
  };
  budget: {
    suggested: string;
    duration: string;
    bidStrategy: string;
  };
  prediction: {
    confidence: number;
    estimatedReach: string;
  };
  executionGuide: {
    meta: string;
    google: string;
  };
}

interface ApiResponse {
  signals: ApiSignal[];
  recommendations: AdRecommendation[];
  signalCount: number;
  recommendationCount: number;
  fetchedAt: string;
  sources: Record<string, { enabled: boolean; needsKey: boolean; keyName: string }>;
}

// ============================================================
// ICON MAPPING
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
  exam_results: { icon: Gift, color: "text-teal-500" },
  life_event: { icon: Heart, color: "text-red-400" },
  social_trend: { icon: Flame, color: "text-orange-400" },
  travel: { icon: MapPin, color: "text-indigo-400" },
  regional: { icon: MapPin, color: "text-cyan-500" },
  inventory: { icon: Package, color: "text-orange-600" },
  competitor: { icon: Target, color: "text-red-500" },
  economic: { icon: DollarSign, color: "text-green-500" },
};

function getSignalIcon(type: string) {
  return SIGNAL_ICONS[type] || { icon: Radio, color: "text-gray-500" };
}

function getSignalTypeLabel(type: string) {
  const labels: Record<string, string> = {
    weather: "Weather", search_trend: "Trend", festival: "Festival", salary_cycle: "Salary/Economic",
    stock_market: "Stock Market", cricket: "Cricket", entertainment: "Entertainment", ott_release: "OTT Release",
    celebrity: "Celebrity", auspicious_day: "Auspicious Day", exam_results: "Exam Results",
    life_event: "Life Event", social_trend: "Social Trend", travel: "Travel", regional: "Regional",
    inventory: "Inventory", competitor: "Competitor", economic: "Economic",
  };
  return labels[type] || type;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent": return "bg-red-100 text-red-700 border-red-200";
    case "high": return "bg-orange-100 text-orange-700 border-orange-200";
    case "medium": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "bg-green-100 text-green-700 border-green-200";
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

function getActiveTiers(): string[] {
  if (typeof window === "undefined") return ["luxury", "premium", "accessible"];
  try {
    const stored = localStorage.getItem("luxeai-active-tiers");
    return stored ? JSON.parse(stored) : ["luxury", "premium", "accessible"];
  } catch { return ["luxury", "premium", "accessible"]; }
}

function getTierLabel(tiers: string[]): string {
  if (tiers.length === 3) return "All tiers";
  return tiers.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" + ");
}

export default function CommandCenterPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTiers] = useState<string[]>(getActiveTiers);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [signalFilter, setSignalFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [approvedRecs, setApprovedRecs] = useState<Set<string>>(new Set());
  const [skippedRecs, setSkippedRecs] = useState<Set<string>>(new Set());
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const tiers = getActiveTiers().join(",");
      const resp = await fetch(`/api/signals/live?mode=full&tiers=${tiers}`);
      if (!resp.ok) throw new Error(`API error: ${resp.status}`);
      const json = await resp.json();
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSignals = useMemo(() => {
    if (!data) return [];
    return data.signals.filter(s => signalFilter === "all" || s.type === signalFilter);
  }, [data, signalFilter]);

  const filteredRecs = useMemo(() => {
    if (!data) return [];
    return data.recommendations.filter(r =>
      priorityFilter === "all" || r.priority === priorityFilter
    );
  }, [data, priorityFilter]);

  const signalTypes = useMemo(() => {
    if (!data) return ["all"];
    const types = [...new Set(data.signals.map(s => s.type))];
    return ["all", ...types];
  }, [data]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-blue mx-auto mb-4" />
          <p className="text-sm text-muted">Scanning signals across 11 categories...</p>
          <p className="text-xs text-muted mt-1">Weather, festivals, cricket, stock market, celebrity, trends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="glass-card p-8 text-center">
          <AlertTriangle size={32} className="text-brand-red mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">Failed to load signals</h2>
          <p className="text-sm text-muted mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary"><RefreshCw size={14} /> Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const urgentCount = data.recommendations.filter(r => r.priority === "urgent").length;
  const enabledSources = Object.values(data.sources).filter(s => s.enabled).length;
  const totalSources = Object.keys(data.sources).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Command Center</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted">
              Real signals from {enabledSources}/{totalSources} sources
            </p>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium",
              activeTiers.length === 1 && activeTiers[0] === "luxury" ? "bg-purple-100 text-purple-700" :
              activeTiers.length === 1 && activeTiers[0] === "accessible" ? "bg-green-100 text-green-700" :
              "bg-blue-100 text-blue-700"
            )}>
              {getTierLabel(activeTiers)} mode
            </span>
            <a href="/dashboard/settings/brands" className="text-[10px] text-brand-blue hover:underline">Change</a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted flex items-center gap-1">
            <Clock size={12} /> Fetched {new Date(data.fetchedAt).toLocaleTimeString()}
          </span>
          <button onClick={fetchData} className="btn-secondary"><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "Live Signals", value: data.signalCount.toString(), color: "orange", icon: Radio },
          { label: "Ad Recommendations", value: data.recommendationCount.toString(), color: "blue", icon: Megaphone },
          { label: "Urgent Actions", value: urgentCount.toString(), color: "red", icon: AlertTriangle },
          { label: "Signal Sources", value: `${enabledSources}/${totalSources}`, color: "green", icon: Zap },
          { label: "Approved", value: approvedRecs.size.toString(), color: "purple", icon: Check },
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

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Live Signals */}
        <div className="col-span-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Radio size={16} className="text-brand-orange" /> Live Signals
              </h2>
              <span className="text-xs text-muted">{filteredSignals.length} active</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {signalTypes.map((type) => (
                <button key={type} onClick={() => setSignalFilter(type)}
                  className={cn("text-[10px] px-2 py-1 rounded-full transition-colors",
                    signalFilter === type ? "bg-brand-blue text-white" : "bg-surface text-muted hover:bg-card-border"
                  )}>
                  {type === "all" ? `All (${data.signalCount})` : getSignalTypeLabel(type)}
                </button>
              ))}
            </div>

            <div className="space-y-0 max-h-[calc(100vh-340px)] overflow-y-auto">
              {filteredSignals.map((signal) => {
                const { icon: Icon, color } = getSignalIcon(signal.type);
                return (
                  <div key={signal.id} className="flex items-start gap-3 py-3 border-b border-card-border last:border-0">
                    <div className={cn("mt-0.5 shrink-0", color)}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{signal.title}</p>
                      <p className="text-xs text-muted leading-relaxed mt-0.5">{signal.description.slice(0, 120)}...</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted flex items-center gap-0.5"><MapPin size={8} /> {signal.location}</span>
                        <span className="text-[10px] bg-surface px-1.5 py-0.5 rounded">{getSignalTypeLabel(signal.type)}</span>
                      </div>
                    </div>
                    <span className={cn("signal-badge shrink-0 text-[10px]", `signal-${signal.severity}`)}>
                      {signal.severity}
                    </span>
                  </div>
                );
              })}
              {filteredSignals.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No signals for this filter</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Ad Recommendations */}
        <div className="col-span-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Megaphone size={16} className="text-brand-blue" /> What Ads to Run Right Now
            </h2>
            <div className="flex gap-1">
              {["all", "urgent", "high", "medium"].map((p) => (
                <button key={p} onClick={() => setPriorityFilter(p)}
                  className={cn("text-[10px] px-2 py-1 rounded-full transition-colors",
                    priorityFilter === p ? "bg-brand-blue text-white" : "bg-surface text-muted hover:bg-card-border"
                  )}>
                  {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredRecs.map((rec) => {
              const isExpanded = expandedRec === rec.id;
              const isGuideOpen = expandedGuide === rec.id;
              const isApproved = approvedRecs.has(rec.id);
              const isSkipped = skippedRecs.has(rec.id);

              return (
                <div key={rec.id} className={cn(
                  "glass-card overflow-hidden transition-all",
                  isApproved && "ring-2 ring-brand-green",
                  isSkipped && "opacity-40",
                )}>
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", getPriorityColor(rec.priority))}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <span className="text-[10px] bg-surface px-2 py-0.5 rounded">{getSignalTypeLabel(rec.signalType)}</span>
                          <span className="text-[10px] text-muted">Signal: {rec.signalTitle}</span>
                        </div>
                        <h3 className="font-semibold text-sm">{rec.title}</h3>
                        <p className="text-xs text-muted mt-1">{rec.description.slice(0, 150)}</p>

                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          <span className="text-xs"><span className="text-muted">Budget: </span><span className="font-semibold">{rec.budget.suggested}</span></span>
                          <span className="text-xs"><span className="text-muted">Duration: </span><span className="font-semibold">{rec.budget.duration}</span></span>
                          <span className="text-xs"><span className="text-muted">Reach: </span><span className="font-semibold">{rec.prediction.estimatedReach}</span></span>
                          <span className="text-xs"><span className="text-muted">Confidence: </span><span className="font-semibold">{rec.prediction.confidence}%</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isApproved && !isSkipped && (
                          <>
                            <button onClick={() => setApprovedRecs(prev => new Set(prev).add(rec.id))} className="btn-approve flex items-center gap-1">
                              <Check size={14} /> Run This
                            </button>
                            <button onClick={() => setSkippedRecs(prev => new Set(prev).add(rec.id))} className="btn-secondary text-xs">Skip</button>
                          </>
                        )}
                        {isApproved && <span className="text-xs text-brand-green font-semibold flex items-center gap-1"><Check size={14} /> Approved</span>}
                        {isSkipped && <span className="text-xs text-muted flex items-center gap-1"><X size={14} /> Skipped</span>}
                      </div>
                    </div>

                    {/* Expand toggles */}
                    <div className="flex gap-4 mt-3">
                      <button onClick={() => setExpandedRec(isExpanded ? null : rec.id)}
                        className="flex items-center gap-1 text-xs text-brand-blue hover:underline">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {isExpanded ? "Hide ad plan" : "See full ad plan (creative, targeting, budget)"}
                      </button>
                      <button onClick={() => setExpandedGuide(isGuideOpen ? null : rec.id)}
                        className="flex items-center gap-1 text-xs text-brand-purple hover:underline">
                        <ExternalLink size={12} />
                        {isGuideOpen ? "Hide setup guide" : "How to set this up in Meta & Google"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Ad Plan */}
                  {isExpanded && (
                    <div className="border-t border-card-border bg-surface/50 p-4 space-y-4">
                      {/* Creative */}
                      <div>
                        <h4 className="text-xs font-semibold text-brand-purple mb-2 flex items-center gap-1"><Sparkles size={12} /> CREATIVE DIRECTION</h4>
                        <p className="text-xs text-text-secondary mb-2">{rec.creative.direction}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {rec.creative.suggestedFormats.map(f => <span key={f} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{f}</span>)}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {rec.creative.brands.map(b => <span key={b} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{b}</span>)}
                        </div>

                        {/* Copyable ad text */}
                        <div className="mt-3 p-3 bg-white rounded-lg border border-card-border">
                          <p className="text-[10px] font-medium text-muted mb-2">COPY-READY AD TEXT (click to copy)</p>
                          {rec.creative.sampleHeadlines.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 mb-1 group cursor-pointer" onClick={() => copyToClipboard(h, `headline-${i}`)}>
                              <span className="text-[10px] text-muted w-16 shrink-0">Headline {i + 1}:</span>
                              <span className="text-xs font-medium flex-1">{h}</span>
                              <Copy size={10} className={cn("text-muted group-hover:text-brand-blue", copiedText === `headline-${i}` && "text-brand-green")} />
                              {copiedText === `headline-${i}` && <span className="text-[10px] text-brand-green">Copied!</span>}
                            </div>
                          ))}
                          {rec.creative.samplePrimaryTexts.map((t, i) => (
                            <div key={i} className="flex items-start gap-2 mb-1 group cursor-pointer mt-2" onClick={() => copyToClipboard(t, `body-${i}`)}>
                              <span className="text-[10px] text-muted w-16 shrink-0 mt-0.5">Body {i + 1}:</span>
                              <span className="text-xs text-text-secondary flex-1">{t}</span>
                              <Copy size={10} className={cn("text-muted group-hover:text-brand-blue shrink-0", copiedText === `body-${i}` && "text-brand-green")} />
                            </div>
                          ))}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-muted w-16">CTA:</span>
                            <span className="text-xs font-medium bg-brand-blue text-white px-2 py-0.5 rounded">{rec.creative.cta}</span>
                          </div>
                        </div>
                      </div>

                      {/* Targeting */}
                      <div>
                        <h4 className="text-xs font-semibold text-brand-orange mb-2 flex items-center gap-1"><Target size={12} /> TARGETING</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div><p className="text-[10px] font-medium text-muted mb-1">ARCHETYPES</p><p className="text-xs">{rec.targeting.archetypes.join(", ")}</p></div>
                          <div><p className="text-[10px] font-medium text-muted mb-1">LOCATION</p><p className="text-xs">{rec.targeting.location}</p></div>
                          <div><p className="text-[10px] font-medium text-muted mb-1">TIMING</p><p className="text-xs">{rec.targeting.timing}</p></div>
                        </div>
                      </div>

                      {/* Platform Split */}
                      <div>
                        <h4 className="text-xs font-semibold text-brand-blue mb-2 flex items-center gap-1"><BarChart3 size={12} /> PLATFORM & BUDGET</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-2 bg-white rounded-lg border border-card-border">
                            <p className="text-xs font-medium">Meta: {rec.targeting.platforms.meta}</p>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1"><div className="h-full bg-blue-500 rounded-full" style={{ width: rec.targeting.platforms.meta }} /></div>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-card-border">
                            <p className="text-xs font-medium">Google: {rec.targeting.platforms.google}</p>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1"><div className="h-full bg-green-500 rounded-full" style={{ width: rec.targeting.platforms.google }} /></div>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-card-border">
                            <p className="text-xs font-medium">{rec.budget.suggested}</p>
                            <p className="text-[10px] text-muted">{rec.budget.duration}</p>
                            <p className="text-[10px] text-muted">{rec.budget.bidStrategy}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded: Step-by-step execution guide */}
                  {isGuideOpen && (
                    <div className="border-t border-card-border bg-navy/5 p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-brand-purple flex items-center gap-1"><ExternalLink size={12} /> STEP-BY-STEP SETUP GUIDE</h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-blue-600">META ADS MANAGER</p>
                            <button onClick={() => copyToClipboard(rec.executionGuide.meta, `meta-guide-${rec.id}`)}
                              className="text-[10px] text-brand-blue hover:underline flex items-center gap-1">
                              <Copy size={10} /> {copiedText === `meta-guide-${rec.id}` ? "Copied!" : "Copy guide"}
                            </button>
                          </div>
                          <pre className="text-[11px] text-text-secondary bg-white p-3 rounded-lg border border-card-border whitespace-pre-wrap font-sans leading-relaxed">
                            {rec.executionGuide.meta}
                          </pre>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-green-600">GOOGLE ADS</p>
                            <button onClick={() => copyToClipboard(rec.executionGuide.google, `google-guide-${rec.id}`)}
                              className="text-[10px] text-brand-blue hover:underline flex items-center gap-1">
                              <Copy size={10} /> {copiedText === `google-guide-${rec.id}` ? "Copied!" : "Copy guide"}
                            </button>
                          </div>
                          <pre className="text-[11px] text-text-secondary bg-white p-3 rounded-lg border border-card-border whitespace-pre-wrap font-sans leading-relaxed">
                            {rec.executionGuide.google}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredRecs.length === 0 && (
              <div className="glass-card p-8 text-center">
                <Sparkles size={32} className="text-muted mx-auto mb-4" />
                <p className="text-sm text-muted">No recommendations for this filter</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Source Status */}
      <div className="mt-6 glass-card p-4">
        <h3 className="text-xs font-semibold text-muted mb-2">Signal Sources ({enabledSources}/{totalSources} active)</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.sources).map(([name, info]) => (
            <span key={name} className={cn("text-[10px] px-2 py-1 rounded-full", info.enabled ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>
              {info.enabled ? <Check size={8} className="inline mr-1" /> : <X size={8} className="inline mr-1" />}
              {name}{info.needsKey && !info.enabled ? ` (needs ${info.keyName})` : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
