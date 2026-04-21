"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  TrendingUp, DollarSign, ShoppingBag,
  CloudRain, Sun, Flame, AlertTriangle, Package, Sparkles,
  Check, X, RefreshCw, Clock, Zap,
  Radio, BarChart3, Target, MapPin, Calendar, Users, Star,
  ChevronDown, ChevronRight,
  ThermometerSun, Umbrella, Trophy,
  Heart, Megaphone, Copy, ExternalLink, Loader2,
  PartyPopper, Briefcase, TrendingDown, Gift, Monitor, Pencil, Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTracking } from "@/lib/tracking/use-tracking";

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
    ageRange?: string;
    ageReason?: string;
    gender?: string;
    genderReason?: string;
    locationReason?: string;
    interests?: string[];
    placements?: string[];
    placementReason?: string;
    devices?: string[];
    deviceReason?: string;
    audiences?: string[];
    exclusions?: string[];
    languages?: string[];
    optimizationGoal?: string;
  };
  budget: {
    suggested: string;
    duration: string;
    bidStrategy: string;
  };
  prediction: {
    confidence: number;
    estimatedReach: string;
    estimatedImpressions: string;
    estimatedClicks: string;
    estimatedCTR: string;
    estimatedConversions: string;
    estimatedCPA: string;
    estimatedRevenue: string;
    estimatedROAS: string;
    campaignGoal: string;
    factors: string[];
    methodology: string;
  };
  executionGuide: {
    meta: string;
    google: string;
  };
  indiaRelevance?: {
    score: "high" | "medium" | "low";
    note: string;
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

interface MatchedProductData {
  id: string;
  brand: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
  tier: string;
  inStock: boolean;
  stockQty: number;
  tags: string[];
  matchScore: number;
  matchReasons: string[];
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

function getSignalTypeLabel(type: string) {
  const labels: Record<string, string> = {
    weather: "Weather", search_trend: "Trend", festival: "Festival", salary_cycle: "Salary/Economic",
    stock_market: "Stock Market", cricket: "Cricket", entertainment: "Entertainment", ott_release: "OTT Release",
    celebrity: "Celebrity", auspicious_day: "Auspicious Day",
    life_event: "Life Event", social_trend: "Social Trend", travel: "Travel", regional: "Regional",
    inventory: "Inventory", competitor: "Competitor", economic: "Economic",
    gift_occasion: "Gift Occasion", sale_event: "Sale Event", occasion_dressing: "Occasion",
    fashion_event: "Fashion Event", wedding: "Wedding", aesthetic: "Aesthetic",
    runway: "Runway", launch: "Launch", category_demand: "Category",
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

function formatPrice(price: number): string {
  if (price >= 100000) {
    return "\u20B9" + (price / 100000).toFixed(price % 100000 === 0 ? 0 : 1) + "L";
  }
  return "\u20B9" + price.toLocaleString("en-IN");
}

function getScoreColor(score: number): string {
  const pct = score * 100;
  if (pct >= 80) return "text-emerald-600";
  if (pct >= 60) return "text-blue-600";
  if (pct >= 40) return "text-amber-600";
  return "text-orange-500";
}

function getScoreBg(score: number): string {
  const pct = score * 100;
  if (pct >= 80) return "bg-emerald-50 border-emerald-200";
  if (pct >= 60) return "bg-blue-50 border-blue-200";
  if (pct >= 40) return "bg-amber-50 border-amber-200";
  return "bg-orange-50 border-orange-200";
}

// ============================================================
// SUGGESTED PRODUCTS COMPONENT (inline within each rec card)
// ============================================================

function SuggestedProducts({ recIndex }: { recIndex: number }) {
  const [products, setProducts] = useState<MatchedProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch(`/api/catalog/match?recId=${recIndex}`)
      .then(r => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [recIndex]);

  if (loading) {
    return (
      <div className="mt-3 py-2.5 px-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-lg border border-indigo-100">
        <div className="flex items-center gap-2">
          <Package size={13} className="text-indigo-500" />
          <span className="text-[11px] font-semibold text-indigo-700">Suggested Products</span>
          <Loader2 size={12} className="animate-spin text-indigo-400 ml-1" />
          <span className="text-[10px] text-indigo-400">Matching catalog...</span>
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  const displayProducts = showAll ? products : products.slice(0, 8);

  return (
    <div className="mt-3 py-2.5 px-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-lg border border-indigo-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package size={13} className="text-indigo-500" />
          <span className="text-[11px] font-semibold text-indigo-700">Suggested Products</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">{products.length} matches</span>
        </div>
        {products.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
          >
            {showAll ? "Show less" : `View all ${products.length} products`}
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin" style={{maxWidth: "calc(100vw - 560px)"}}>
        {displayProducts.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[130px] bg-white rounded-lg border border-gray-200 p-2.5 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            {/* Brand */}
            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider leading-tight truncate">
              {product.brand}
            </p>
            {/* Name */}
            <p className="text-[10px] font-medium text-gray-800 leading-tight mt-0.5 line-clamp-2 min-h-[28px]">
              {product.name}
            </p>
            {/* Price */}
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-[11px] font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.discount > 0 && (
                <span className="text-[9px] text-red-500 font-medium">-{product.discount}%</span>
              )}
            </div>
            {/* Match Score */}
            <div className={cn("mt-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold", getScoreBg(product.matchScore))}>
              <span className={getScoreColor(product.matchScore)}>{Math.round(product.matchScore * 100)}% match</span>
            </div>
            {/* Top match reason pill */}
            {product.matchReasons.length > 0 && (
              <p className="text-[8px] text-gray-500 mt-1 leading-tight truncate" title={product.matchReasons.join(" | ")}>
                {product.matchReasons[0].replace(/^(Brand match|Category match|Occasion|Tag|Subcategory match|Brand in direction|Category in direction|Product name match): /, "")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
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
  const { trackView, trackExpand, trackCollapse, trackEditStart, trackEditSave, trackApprove, trackSkip, trackCopy, trackGuideOpen } = useTracking();
  const [signalFilter, setSignalFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [approvedRecs, setApprovedRecs] = useState<Set<string>>(new Set());
  const [skippedRecs, setSkippedRecs] = useState<Set<string>>(new Set());
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [editingRec, setEditingRec] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, {
    budget: string;
    duration: string;
    bidStrategy: string;
    location: string;
    timing: string;
    headlines: string[];
    bodyTexts: string[];
    cta: string;
  }>>({});
  const [pushingDraft, setPushingDraft] = useState<string | null>(null);
  const [pushResult, setPushResult] = useState<Record<string, { success: boolean; message: string; platform?: string } | null>>({});
  const [adConnection, setAdConnection] = useState<{ google: { connected: boolean }; meta: { connected: boolean } } | null>(null);

  const startEditing = (rec: AdRecommendation) => {
    trackEditStart(rec.id);
    setEditingRec(rec.id);
    if (!editValues[rec.id]) {
      setEditValues(prev => ({
        ...prev,
        [rec.id]: {
          budget: rec.budget.suggested,
          duration: rec.budget.duration,
          bidStrategy: rec.budget.bidStrategy,
          location: rec.targeting.location,
          timing: rec.targeting.timing,
          headlines: [...rec.creative.sampleHeadlines],
          bodyTexts: [...rec.creative.samplePrimaryTexts],
          cta: rec.creative.cta,
        },
      }));
    }
  };

  const updateEditField = (recId: string, field: string, value: string | string[]) => {
    setEditValues(prev => ({
      ...prev,
      [recId]: { ...prev[recId], [field]: value },
    }));
  };

  const saveEdits = (recId: string) => {
    trackEditSave(recId, editValues[recId] || {});
    setEditingRec(null);
  };

  // Check ad platform connection status
  useEffect(() => {
    fetch("/api/ads/push-draft").then(r => r.json()).then(setAdConnection).catch(() => {});
  }, []);

  const pushToDraft = async (rec: AdRecommendation, platform: "google" | "meta" | "both") => {
    setPushingDraft(rec.id);
    setPushResult(prev => ({ ...prev, [rec.id]: null }));
    try {
      const edits = editValues[rec.id];
      const res = await fetch("/api/ads/push-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          campaignName: rec.title,
          headlines: edits?.headlines || rec.creative.sampleHeadlines,
          bodyTexts: edits?.bodyTexts || rec.creative.samplePrimaryTexts,
          cta: edits?.cta || rec.creative.cta,
          budget: edits?.budget || rec.budget.suggested,
          duration: edits?.duration || rec.budget.duration,
          bidStrategy: edits?.bidStrategy || rec.budget.bidStrategy,
          location: edits?.location || rec.targeting.location,
          timing: edits?.timing || rec.targeting.timing,
          brands: rec.creative.brands,
          signalTitle: rec.signalTitle,
        }),
      });
      const data = await res.json();
      setPushResult(prev => ({ ...prev, [rec.id]: { success: data.success, message: data.message, platform } }));
      if (data.success) {
        trackApprove(rec.id, !!edits);
        setApprovedRecs(prev => new Set(prev).add(rec.id));
        alert("Draft campaign created successfully in " + (platform === "meta" ? "Meta" : "Google") + " Ads!");
      } else {
        alert("Failed: " + data.message);
      }
    } catch (err: any) {
      setPushResult(prev => ({ ...prev, [rec.id]: { success: false, message: err.message } }));
      alert("Error: " + err.message);
    } finally {
      setPushingDraft(null);
    }
  };

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const tiers = getActiveTiers().join(",");
      const refresh = forceRefresh ? "&refresh=true" : "";
      const resp = await fetch(`/api/signals/live?mode=full&tiers=${tiers}${refresh}`);
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

  // Build a map of rec ID to its original index in the full recommendations array
  const recIndexMap = useMemo(() => {
    if (!data) return new Map<string, number>();
    const map = new Map<string, number>();
    data.recommendations.forEach((r, i) => map.set(r.id, i));
    return map;
  }, [data]);

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
          <button onClick={() => fetchData(true)} className="btn-primary"><RefreshCw size={14} /> Retry</button>
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
          <button onClick={() => fetchData(true)} className="btn-secondary"><RefreshCw size={14} /> Refresh</button>
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
              const recIdx = recIndexMap.get(rec.id) ?? 0;

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
                          {rec.indiaRelevance && (
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-medium",
                              rec.indiaRelevance.score === "high" && "bg-emerald-500/20 text-emerald-400",
                              rec.indiaRelevance.score === "medium" && "bg-amber-500/20 text-amber-400",
                              rec.indiaRelevance.score === "low" && "bg-red-500/20 text-red-400",
                            )}>
                              {rec.indiaRelevance.score === "high" ? "▲ Strong Signal" : rec.indiaRelevance.score === "low" ? "▼ Weak Signal" : "● Moderate"}
                            </span>
                          )}
                          <span className="text-[10px] text-muted">Signal: {rec.signalTitle}</span>
                        </div>
                        <h3 className="font-semibold text-sm">{rec.title}</h3>
                        {rec.indiaRelevance?.note && (
                          <p className="text-xs text-gray-500 mt-1 italic">{rec.indiaRelevance.note}</p>
                        )}
                        <p className="text-xs text-muted mt-1">{rec.description.slice(0, 150)}</p>

                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          <span className="text-xs"><span className="text-muted">Budget: </span><span className="font-semibold">{editValues[rec.id]?.budget || rec.budget.suggested}</span></span>
                          <span className="text-xs"><span className="text-muted">Duration: </span><span className="font-semibold">{editValues[rec.id]?.duration || rec.budget.duration}</span></span>
                          {editValues[rec.id] && <span className="text-[10px] text-brand-blue font-medium">(Customized)</span>}
                        </div>

                        {/* Predicted Outcomes */}
                        <div className="mt-2 py-2.5 px-3 bg-surface/60 rounded-lg">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[10px] font-semibold text-muted uppercase tracking-wide mr-1">Predicted Outcome:</span>
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                              rec.prediction.campaignGoal === "Brand Awareness" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                            )}>{rec.prediction.campaignGoal}</span>
                            <span className="text-xs flex items-center gap-1"><Users size={11} className="text-blue-500" /><span className="text-muted">Reach</span> <span className="font-semibold">{rec.prediction.estimatedReach}</span></span>
                            <span className="text-gray-300">|</span>
                            <span className="text-xs flex items-center gap-1"><Target size={11} className="text-orange-500" /><span className="text-muted">Clicks</span> <span className="font-semibold">{rec.prediction.estimatedClicks}</span></span>
                            <span className="text-gray-300">|</span>
                            <span className="text-xs flex items-center gap-1"><ShoppingBag size={11} className="text-emerald-500" /><span className="text-muted">Conv.</span> <span className="font-semibold">{rec.prediction.estimatedConversions}</span></span>
                            <span className="text-gray-300">|</span>
                            <span className="text-xs flex items-center gap-1"><DollarSign size={11} className="text-amber-500" /><span className="text-muted">CPA</span> <span className="font-semibold">{rec.prediction.estimatedCPA}</span></span>
                            <span className="text-gray-300">|</span>
                            <span className="text-xs flex items-center gap-1"><TrendingUp size={11} className="text-green-600" /><span className="text-muted">Revenue</span> <span className="font-semibold">{rec.prediction.estimatedRevenue}</span></span>
                            <span className="text-gray-300">|</span>
                            <span className="text-xs flex items-center gap-1"><BarChart3 size={11} className="text-green-600" /><span className="text-muted">ROAS</span> <span className={cn("font-semibold", parseFloat(rec.prediction.estimatedROAS) >= 2 ? "text-green-600" : parseFloat(rec.prediction.estimatedROAS) >= 1 ? "text-amber-600" : "text-red-500")}>{rec.prediction.estimatedROAS}</span></span>
                          </div>
                          {/* Targeting */}
                          {rec.targeting?.ageRange && (
                            <div className="mt-2 pt-2 border-t border-card-border/50">
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px]">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1">
                                  <p className="text-blue-400/70 text-[8px]">Age</p>
                                  <p className="text-blue-400 font-medium">{rec.targeting.ageRange}</p>
                                  {rec.targeting.ageReason && <p className="text-blue-400/50 text-[7px] truncate" title={rec.targeting.ageReason}>{rec.targeting.ageReason}</p>}
                                </div>
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1">
                                  <p className="text-purple-400/70 text-[8px]">Gender</p>
                                  <p className="text-purple-400 font-medium">{rec.targeting.gender}</p>
                                  {rec.targeting.genderReason && <p className="text-purple-400/50 text-[7px] truncate" title={rec.targeting.genderReason}>{rec.targeting.genderReason}</p>}
                                </div>
                                <div className="bg-green-500/10 border border-green-500/20 rounded px-2 py-1">
                                  <p className="text-green-400/70 text-[8px]">Location</p>
                                  <p className="text-green-400 font-medium truncate">{rec.targeting.location}</p>
                                  {rec.targeting.locationReason && <p className="text-green-400/50 text-[7px] truncate" title={rec.targeting.locationReason}>{rec.targeting.locationReason}</p>}
                                </div>
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded px-2 py-1">
                                  <p className="text-orange-400/70 text-[8px]">Device</p>
                                  <p className="text-orange-400 font-medium truncate">{rec.targeting.devices?.[0] || "Android first"}</p>
                                  {rec.targeting.deviceReason && <p className="text-orange-400/50 text-[7px] truncate" title={rec.targeting.deviceReason}>{rec.targeting.deviceReason}</p>}
                                </div>
                                <div className="bg-pink-500/10 border border-pink-500/20 rounded px-2 py-1">
                                  <p className="text-pink-400/70 text-[8px]">Placement</p>
                                  <p className="text-pink-400 font-medium truncate">{rec.targeting.placements?.[0] || "IG Reels"}</p>
                                  {rec.targeting.placementReason && <p className="text-pink-400/50 text-[7px] truncate" title={rec.targeting.placementReason}>{rec.targeting.placementReason}</p>}
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
                                  <p className="text-amber-400/70 text-[8px]">Optimize for</p>
                                  <p className="text-amber-400 font-medium">{rec.targeting.optimizationGoal}</p>
                                </div>
                              </div>
                              <div className="mt-1.5 space-y-0.5 text-[10px] text-muted">
                                <p className="truncate"><span className="font-medium text-gray-400">Interests:</span> {rec.targeting.interests?.slice(0, 5).join(", ")}</p>
                                {rec.targeting.audiences && rec.targeting.audiences.length > 0 && (
                                  <p className="truncate"><span className="font-medium text-gray-400">Audiences:</span> {rec.targeting.audiences.slice(0, 3).join(", ")}</p>
                                )}
                                {rec.targeting.exclusions && rec.targeting.exclusions.length > 0 && (
                                  <p className="truncate"><span className="font-medium text-gray-400">Exclude:</span> {rec.targeting.exclusions.join(", ")}</p>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Why we predict this */}
                          <div className="mt-2 pt-2 border-t border-card-border/50">
                            <div className="flex items-start gap-1.5">
                              <Info size={11} className="text-blue-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[10px] font-medium text-blue-500">Why this prediction: </span>
                                <span className="text-[10px] text-muted">{rec.prediction.factors.join(" \u00B7 ")}</span>
                              </div>
                            </div>
                            <p className="text-[9px] text-muted/60 mt-1 ml-4">{rec.prediction.methodology}</p>
                          </div>
                        </div>

                        {/* Suggested Products Strip */}
                        <SuggestedProducts recIndex={recIdx} />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {!isApproved && !isSkipped && (
                            <>
                              <button onClick={() => startEditing(rec)} className="text-xs text-muted hover:text-text-primary flex items-center gap-1 px-2 py-1 rounded hover:bg-surface transition-colors">
                                <Pencil size={11} /> Edit
                              </button>
                              {pushingDraft === rec.id ? (
                                <span className="text-xs text-brand-blue flex items-center gap-1.5 px-3 py-1.5"><Loader2 size={13} className="animate-spin" /> Creating draft...</span>
                              ) : (
                                <div className="flex items-center border border-card-border rounded-lg overflow-hidden">
                                  <button onClick={() => pushToDraft(rec, "meta")}
                                    className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                    title="Create campaign + ad set in Meta Ads">
                                    Meta
                                  </button>
                                  <button onClick={() => pushToDraft(rec, "google")}
                                    className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-surface text-muted hover:bg-card-border hover:text-text-primary transition-colors border-l border-card-border"
                                    title="Create campaign in Google Ads">
                                    Google
                                  </button>
                                </div>
                              )}
                              <button onClick={() => { trackSkip(rec.id); setSkippedRecs(prev => new Set(prev).add(rec.id)); }}
                                className="text-xs text-muted hover:text-text-primary px-2 py-1 rounded hover:bg-surface transition-colors">
                                Skip
                              </button>
                            </>
                          )}
                          {isApproved && pushResult[rec.id] && (
                            <span className={"text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg " + (pushResult[rec.id]?.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>
                              {pushResult[rec.id]?.success ? <><Check size={13} /> Drafted to {pushResult[rec.id]?.platform === "meta" ? "Meta" : "Google"}</> : <><AlertTriangle size={13} /> Failed</>}
                            </span>
                          )}
                          {isApproved && !pushResult[rec.id] && <span className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Check size={13} /> Approved</span>}
                          {isSkipped && <span className="text-xs text-muted bg-surface px-3 py-1.5 rounded-lg flex items-center gap-1.5"><X size={13} /> Skipped</span>}
                        </div>
                      </div>

                      <div className="flex flex-col items-center shrink-0">
                        {/* Success Probability Ring */}
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="relative w-9 h-9">
                            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 48 48">
                              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100" />
                              <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3"
                                strokeDasharray={`${(rec.prediction.confidence / 100) * 125.6} 125.6`}
                                strokeLinecap="round"
                                className={cn(
                                  rec.prediction.confidence >= 80 ? "text-emerald-500" :
                                  rec.prediction.confidence >= 60 ? "text-blue-500" :
                                  rec.prediction.confidence >= 40 ? "text-amber-500" : "text-red-400"
                                )} />
                            </svg>
                            <span className={cn("absolute inset-0 flex items-center justify-center text-[10px] font-bold",
                              rec.prediction.confidence >= 80 ? "text-emerald-600" :
                              rec.prediction.confidence >= 60 ? "text-blue-600" :
                              rec.prediction.confidence >= 40 ? "text-amber-600" : "text-red-500"
                            )}>
                              {rec.prediction.confidence}%
                            </span>
                          </div>
                          <span className="text-[8px] text-muted font-medium">Success</span>
                        </div>
                      </div>
                    </div>

                    {/* Expand toggles */}
                    <div className="flex gap-4 mt-3">
                      <button onClick={() => { isExpanded ? trackCollapse(rec.id) : trackExpand(rec.id); setExpandedRec(isExpanded ? null : rec.id); }}
                        className="flex items-center gap-1 text-xs text-brand-blue hover:underline">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {isExpanded ? "Hide ad plan" : "See full ad plan (creative, targeting, budget)"}
                      </button>
                      <button onClick={() => { if (!isGuideOpen) trackGuideOpen(rec.id); setExpandedGuide(isGuideOpen ? null : rec.id); }}
                        className="flex items-center gap-1 text-xs text-brand-purple hover:underline">
                        <ExternalLink size={12} />
                        {isGuideOpen ? "Hide setup guide" : "How to set this up in Meta & Google"}
                      </button>
                    </div>
                  </div>

                  {/* Editing Panel */}
                  {editingRec === rec.id && editValues[rec.id] && (
                    <div className="border-t border-card-border bg-surface/50 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-semibold flex items-center gap-1.5">
                          <Pencil size={12} className="text-brand-blue" /> CUSTOMIZE CAMPAIGN
                        </h4>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingRec(null)} className="text-xs text-muted hover:text-text-primary">Cancel</button>
                          <button onClick={() => saveEdits(rec.id)} className="btn-approve flex items-center gap-1 text-xs">
                            <Check size={12} /> Save Changes
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-[10px] font-medium text-muted block mb-1">BUDGET</label>
                          <input type="text" value={editValues[rec.id].budget}
                            onChange={e => updateEditField(rec.id, "budget", e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-card-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted block mb-1">DURATION</label>
                          <input type="text" value={editValues[rec.id].duration}
                            onChange={e => updateEditField(rec.id, "duration", e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-card-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted block mb-1">BID STRATEGY</label>
                          <input type="text" value={editValues[rec.id].bidStrategy}
                            onChange={e => updateEditField(rec.id, "bidStrategy", e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-card-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-[10px] font-medium text-muted block mb-1">TARGET LOCATION</label>
                          <input type="text" value={editValues[rec.id].location}
                            onChange={e => updateEditField(rec.id, "location", e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-card-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted block mb-1">TIMING</label>
                          <input type="text" value={editValues[rec.id].timing}
                            onChange={e => updateEditField(rec.id, "timing", e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-card-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="text-[10px] font-medium text-muted block mb-1">HEADLINES</label>
                        <div className="space-y-1.5">
                          {editValues[rec.id].headlines.map((h, i) => (
                            <input key={i} type="text" value={h}
                              onChange={e => {
                                const updated = [...editValues[rec.id].headlines];
                                updated[i] = e.target.value;
                                updateEditField(rec.id, "headlines", updated);
                              }}
                              placeholder={`Headline ${i + 1}`}
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-card-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="text-[10px] font-medium text-muted block mb-1">BODY TEXT</label>
                        <div className="space-y-1.5">
                          {editValues[rec.id].bodyTexts.map((t, i) => (
                            <textarea key={i} value={t}
                              onChange={e => {
                                const updated = [...editValues[rec.id].bodyTexts];
                                updated[i] = e.target.value;
                                updateEditField(rec.id, "bodyTexts", updated);
                              }}
                              rows={2}
                              placeholder={`Body text ${i + 1}`}
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-card-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none" />
                          ))}
                        </div>
                      </div>

                      <div className="w-48">
                        <label className="text-[10px] font-medium text-muted block mb-1">CTA BUTTON</label>
                        <input type="text" value={editValues[rec.id].cta}
                          onChange={e => updateEditField(rec.id, "cta", e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-card-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                      </div>
                    </div>
                  )}

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
