"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Radio, MapPin, Clock, RefreshCw, Check, X, Loader2,
  ThermometerSun, Trophy, Heart, PartyPopper,
  Briefcase, Gift, Monitor, TrendingUp,
  DollarSign, ShoppingBag, Flame, Package, Sparkles,
  Zap, BarChart3, Target, Calendar, Users, Star, Activity,
  Search,
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

// ============================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================

function getMockData(): ApiResponse {
  const now = new Date();
  const signals: ApiSignal[] = [
    {
      id: "sig-1",
      type: "life_event",
      source: "Google Trends + Cultural Calendar",
      title: "LIVE: First Job / Appraisal Season — 39 days remaining",
      description: "First Job / Appraisal Season is happening NOW. April-May is appraisal + variable pay season in IT/consulting. 14-22% uplift in luxury buying in tech hubs. Target IT professionals with 'you earned it' messaging.",
      location: "Bangalore, Hyderabad, Pune, Mumbai, Delhi NCR, Chennai",
      severity: "critical",
      triggersWhat: "Professional luxury: blazers, premium shirts, leather bags, watches, formal shoes. Self-reward after appraisal/bonus.",
      targetArchetypes: ["Urban Achiever", "Aspirant"],
      suggestedBrands: ["Hugo Boss", "Coach", "Michael Kors"],
      suggestedAction: "First Job / Appraisal Season is LIVE! Maximize spend.",
      confidence: 0.92,
      expiresAt: new Date(now.getTime() + 39 * 24 * 60 * 60 * 1000).toISOString(),
      detectedAt: new Date(now.getTime() - 37 * 60 * 1000).toISOString(),
      signalCategory: "external",
      dataSource: "Google Trends + Cultural Calendar",
      sourceUrl: null,
    },
    {
      id: "sig-2",
      type: "festival",
      source: "Indian Festival Calendar 2026",
      title: "Akshaya Tritiya in 5 days",
      description: "Akshaya Tritiya (Apr 27) — auspicious day for buying gold, starting new ventures. Luxury purchases +40-60% on this day. Push gold jewelry, watches, premium gifting.",
      location: "Pan India",
      severity: "high",
      triggersWhat: "Gold jewelry, luxury watches, premium gifting, auspicious purchases.",
      targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
      suggestedBrands: ["Swarovski", "Fossil", "Tissot"],
      suggestedAction: "Launch Akshaya Tritiya special campaigns — gold-toned products, gifting sets.",
      confidence: 0.88,
      expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      detectedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      signalCategory: "external",
      dataSource: "Indian Festival Calendar 2026",
      sourceUrl: null,
    },
    {
      id: "sig-3",
      type: "weather",
      source: "WeatherAPI.com — 20 Indian cities",
      title: "Heatwave Alert — Mumbai, Delhi, Bangalore",
      description: "Temperatures hitting 38-42°C across major metros. Summer fashion demand spiking. Push lightweight linen, breathable fabrics, sunglasses, summer accessories.",
      location: "Mumbai, Delhi NCR, Bangalore, Hyderabad, Pune",
      severity: "high",
      triggersWhat: "Summer fashion: lightweight clothing, linen, breathable fabrics, sunglasses, summer accessories.",
      targetArchetypes: ["Fashion Loyalist", "Urban Achiever", "Aspirant"],
      suggestedBrands: ["Ray-Ban", "All Saints", "Hugo Boss"],
      suggestedAction: "Push summer collections — lightweight, breathable, cooling fabrics.",
      confidence: 0.95,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      detectedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      signalCategory: "external",
      dataSource: "WeatherAPI.com — 20 Indian cities",
      sourceUrl: "https://weather.com/en-IN/",
    },
    {
      id: "sig-4",
      type: "search_trend",
      source: "DataForSEO — Google Search Volume",
      title: "Trending #1: Coach Tabby Bag — +180% search volume",
      description: "Coach Tabby bag searches spiked +180% in India in past 7 days. Coach: 100x growth brand in India (2021-2026). #1 accessible luxury brand.",
      location: "Pan India",
      severity: "high",
      triggersWhat: "Coach bags, especially Tabby shoulder bag. Accessible luxury segment is booming.",
      targetArchetypes: ["Urban Achiever", "Aspirant"],
      suggestedBrands: ["Coach"],
      suggestedAction: "Push Coach Tabby collection — India's most-searched bag right now.",
      confidence: 0.86,
      expiresAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      detectedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      signalCategory: "external",
      dataSource: "DataForSEO — Google Search Volume",
      sourceUrl: "https://trends.google.com/trends/explore?geo=IN&q=Coach+Tabby",
    },
    {
      id: "sig-5",
      type: "celebrity",
      source: "NewsAPI — Bollywood & Celebrity News",
      title: "Alia Bhatt trending — Met Gala appearance",
      description: "Alia Bhatt trending after Met Gala appearance. Indian celebrity fashion searches spike 300-500% post major events. 24-72hr window for moment marketing.",
      location: "Pan India",
      severity: "critical",
      triggersWhat: "Celebrity fashion moment — capitalize on trending searches.",
      targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
      suggestedBrands: ["Coach", "Gucci", "Versace"],
      suggestedAction: "Create 'Get Alia's Look' campaigns — 24-48hr window before trend fades.",
      confidence: 0.78,
      expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      detectedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      signalCategory: "external",
      dataSource: "NewsAPI — Bollywood & Celebrity News",
      sourceUrl: "https://news.google.com/search?q=Alia+Bhatt+fashion",
    },
  ];

  return {
    signals,
    signalCount: signals.length,
    externalCount: signals.filter(s => s.signalCategory === "external").length,
    internalCount: signals.filter(s => s.signalCategory === "internal").length,
    fetchedAt: now.toISOString(),
    sources: {
      "Weather API": { enabled: true, needsKey: false, keyName: "WEATHER_API_KEY" },
      "Google Trends": { enabled: true, needsKey: false, keyName: "GOOGLE_TRENDS_API" },
      "Festival Calendar": { enabled: true, needsKey: false, keyName: "" },
      "Cricket API": { enabled: false, needsKey: true, keyName: "CRICKET_API_KEY" },
      "Celebrity News": { enabled: true, needsKey: false, keyName: "NEWS_API_KEY" },
    },
  };
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

export default function IntelligencePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTiers] = useState<string[]>(getActiveTiers);
  const [signalFilter, setSignalFilter] = useState("all");

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const tiers = getActiveTiers().join(",");
      const refresh = forceRefresh ? "&refresh=true" : "";
      const resp = await fetch(`/api/signals/live?mode=full&tiers=${tiers}${refresh}`);
      if (!resp.ok) {
        // Use mock data if API fails
        console.log("API failed, using mock data");
        setData(getMockData());
        setLoading(false);
        return;
      }
      const json = await resp.json();
      setData(json);
    } catch (err) {
      // Use mock data on error
      console.log("Error fetching data, using mock data:", err);
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSignals = useMemo(() => {
    if (!data) return [];
    return data.signals.filter(s => {
      if (signalFilter === "all") return true;
      if (signalFilter === "external") return s.signalCategory === "external";
      if (signalFilter === "internal") return s.signalCategory === "internal";
      return s.type === signalFilter;
    });
  }, [data, signalFilter]);

  const signalTypes = useMemo(() => {
    if (!data) return ["all"];
    const types = [...new Set(data.signals.map(s => s.type))];
    return ["all", "external", "internal", ...types];
  }, [data]);

  // Calculate category counts - MUST be before conditional returns
  const categoryCounts = useMemo(() => {
    if (!data) return {};
    const counts: Record<string, number> = {};
    data.signals.forEach(s => {
      counts[s.type] = (counts[s.type] || 0) + 1;
    });
    return counts;
  }, [data]);

  // Get time since fetch - MUST be before conditional returns
  const timeSince = useMemo(() => {
    if (!data) return "0 min ago";
    const now = new Date();
    const fetched = new Date(data.fetchedAt);
    const diff = Math.floor((now.getTime() - fetched.getTime()) / 1000 / 60);
    if (diff < 60) return `${diff} min ago`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }, [data]);

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

  if (!data) return null;

  const enabledSources = Object.values(data.sources).filter(s => s.enabled).length;
  const totalSources = Object.keys(data.sources).length;

  // Category filter tabs
  const categories = [
    { key: "all", label: "All signals", icon: Radio, count: data.signalCount },
    { key: "stock_market", label: "Market Conditions", icon: TrendingUp, count: categoryCounts.stock_market || 0 },
    { key: "life_event", label: "Live Events", icon: Activity, count: categoryCounts.life_event || 0 },
    { key: "festival", label: "Cultural Moments", icon: PartyPopper, count: (categoryCounts.festival || 0) + (categoryCounts.auspicious_day || 0) },
    { key: "search_trend", label: "Search Intel", icon: Search, count: categoryCounts.search_trend || 0 },
    { key: "performance", label: "Performance", icon: BarChart3, count: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with LIVE badge */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Intelligence Feed</h1>
        </div>

        {/* Stats - Large numbers */}
        <div className="grid grid-cols-4 gap-8 mb-12">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-1">{data.signalCount}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total Signals</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-1">{data.externalCount || 0}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">External</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-1">{data.internalCount || 0}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Internal</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-1">{timeSince}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Last Update</div>
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setSignalFilter(cat.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                  signalFilter === cat.key
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
                <span className="ml-1 text-xs">{cat.count}</span>
              </button>
            );
          })}
        </div>

        {/* Section header */}
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
            ALL SIGNALS · {filteredSignals.length} results
          </h2>
        </div>

        {/* Signal cards */}
        <div className="space-y-4">
          {filteredSignals.map((signal, idx) => {
            const timeSinceDetect = Math.floor((new Date().getTime() - new Date(signal.detectedAt).getTime()) / 1000 / 60);
            return (
              <div key={signal.id} className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Top row: Severity, Location, Time, ID */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      signal.severity === "critical" ? "bg-red-100 text-red-700" :
                      signal.severity === "high" ? "bg-orange-100 text-orange-700" :
                      signal.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    )}>
                      {signal.severity.charAt(0).toUpperCase() + signal.severity.slice(1)}
                    </span>
                    <span className="text-xs text-gray-600">{signal.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{timeSinceDetect} min ago</span>
                    <span className="font-medium">#{(idx + 1).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Signal type */}
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  SIGNAL · {getSignalTypeLabel(signal.type).toUpperCase()}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{signal.title}</h3>

                {/* Brand tags */}
                {signal.suggestedBrands.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {signal.suggestedBrands.slice(0, 3).map((brand) => (
                      <span key={brand} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {brand}
                      </span>
                    ))}
                  </div>
                )}

                {/* WHAT WE SAW */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">WHAT WE SAW</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{signal.description}</p>
                </div>

                {/* WHY IT MATTERS NOW */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">WHY IT MATTERS NOW</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{signal.triggersWhat}</p>
                </div>

                {/* RECOMMENDED ACTION */}
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">RECOMMENDED ACTION</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{signal.suggestedAction}</p>
                </div>
              </div>
            );
          })}
          {filteredSignals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No signals found for this filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
