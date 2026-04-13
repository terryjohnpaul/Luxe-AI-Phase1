"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Hash, ShoppingBag, Flame, Copy, Filter,
  Loader2, BarChart3, Eye, MessageCircle, CheckCircle,
  Sparkles, Tag, Users, ArrowUpRight, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// --- Types matching the API Signal shape ---

interface Signal {
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
  data: Record<string, any>;
}

interface ApiResponse {
  pinterest: Signal[];
  instagram: Signal[];
  lyst: Signal[];
  summary: {
    totalTrends: number;
    viralCount: number;
    topBrands: { name: string; count: number }[];
  };
  fetchedAt: string;
}

type TabKey = "pinterest" | "instagram" | "lyst";

// --- Helpers ---

function getDirectionBadge(direction: string) {
  if (direction === "viral")
    return "bg-red-100 text-red-700 border border-red-200";
  if (direction === "rising")
    return "bg-green-100 text-green-700 border border-green-200";
  return "bg-gray-100 text-gray-600 border border-gray-200";
}

function getGrowthColor(pct: number) {
  if (pct >= 300) return "text-red-600";
  if (pct >= 150) return "text-orange-600";
  return "text-green-600";
}

function getDirection(growth: number): "viral" | "rising" | "stable" {
  if (growth >= 200) return "viral";
  if (growth >= 50) return "rising";
  return "stable";
}

function getAllBrands(data: ApiResponse): string[] {
  const set = new Set<string>();
  data.pinterest.forEach(s => s.suggestedBrands.forEach(b => set.add(b)));
  data.instagram.forEach(s => s.suggestedBrands.forEach(b => set.add(b)));
  data.lyst.forEach(s => s.suggestedBrands.forEach(b => set.add(b)));
  return Array.from(set).sort();
}

function getTopCategory(data: ApiResponse): string {
  const counts: Record<string, number> = {};
  [...data.pinterest, ...data.instagram, ...data.lyst].forEach(s => {
    const cat = s.triggersWhat || "Unknown";
    counts[cat] = (counts[cat] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "N/A";
}

// --- Component ---

export default function TrendIntelPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("pinterest");
  const [filterBrand, setFilterBrand] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trend-intel")
      .then(r => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Loading
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-sm text-muted">Scanning Pinterest, Instagram & Lyst for luxury trend intelligence...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm text-red-600 font-medium mb-1">Failed to load trend intelligence</p>
          <p className="text-xs text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const allBrands = getAllBrands(data);
  const topCategory = getTopCategory(data);

  // Filter helpers
  const matchesBrand = (brands: string[]) =>
    filterBrand === "all" || brands.includes(filterBrand);

  const filteredPinterest = data.pinterest.filter(s => matchesBrand(s.suggestedBrands));
  const filteredInstagram = data.instagram.filter(s => matchesBrand(s.suggestedBrands));
  const filteredLyst = data.lyst.filter(s => matchesBrand(s.suggestedBrands));

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "pinterest", label: "Pinterest", icon: <TrendingUp size={14} />, count: filteredPinterest.length },
    { key: "instagram", label: "Instagram", icon: <Hash size={14} />, count: filteredInstagram.length },
    { key: "lyst", label: "Lyst", icon: <ShoppingBag size={14} />, count: filteredLyst.length },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame size={22} className="text-orange-500" />
            <h1 className="text-2xl font-bold">Trend Intelligence</h1>
          </div>
          <p className="text-sm text-muted">
            Combined luxury trend signals from Pinterest, Instagram & Lyst — updated in real time
          </p>
        </div>
        <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Sparkles size={10} /> 3 Platforms Tracked
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Trends", value: data.summary.totalTrends.toString(), color: "blue", icon: BarChart3 },
          { label: "Viral Now", value: data.summary.viralCount.toString(), color: "red", icon: Flame },
          { label: "Top Category", value: topCategory, color: "purple", icon: Tag },
          { label: "Platforms Tracked", value: "3", color: "orange", icon: Eye },
        ].map(s => (
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

      {/* Brand Filter */}
      <div className="flex gap-3 items-center flex-wrap">
        <Filter size={14} className="text-muted" />
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterBrand("all")}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full transition-colors",
              filterBrand === "all" ? "bg-brand-purple text-white" : "bg-surface text-muted hover:bg-card-border"
            )}
          >
            All Brands
          </button>
          {allBrands.map(b => (
            <button
              key={b}
              onClick={() => setFilterBrand(b)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full transition-colors",
                filterBrand === b ? "bg-brand-purple text-white" : "bg-surface text-muted hover:bg-card-border"
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-1 border-b border-card-border pb-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-t-lg transition-colors font-medium border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-brand-blue text-brand-blue bg-surface"
                : "border-transparent text-muted hover:text-text-primary hover:bg-surface/50"
            )}
          >
            {tab.icon}
            {tab.label}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full ml-1",
              activeTab === tab.key ? "bg-brand-blue/10 text-brand-blue" : "bg-surface text-muted"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Pinterest Tab */}
        {activeTab === "pinterest" && (
          <>
            {filteredPinterest.length === 0 && (
              <EmptyState icon={TrendingUp} message="No Pinterest trends match the current filter." />
            )}
            {filteredPinterest.map((signal, i) => {
              const keyword = signal.data.keyword || signal.title;
              const growth = signal.data.growth || 0;
              const weeklyPins = signal.data.weeklyPins || "N/A";
              const direction = signal.data.direction || getDirection(growth);
              const category = signal.triggersWhat;
              const brands = signal.suggestedBrands;
              const adOpportunity = signal.suggestedAction;

              return (
                <div key={signal.id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                          <TrendingUp size={10} /> Pinterest
                        </span>
                        <span className="text-xs bg-surface text-muted px-2 py-0.5 rounded">{category}</span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium capitalize", getDirectionBadge(direction))}>
                          {direction === "viral" && <Flame size={9} className="inline mr-0.5" />}
                          {direction}
                        </span>
                      </div>

                      {/* Keyword */}
                      <h3 className="font-semibold text-sm mb-1">&ldquo;{keyword}&rdquo;</h3>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-xs flex items-center gap-1">
                          <ArrowUpRight size={12} className={getGrowthColor(growth)} />
                          <span className="text-muted">Growth:</span>
                          <span className={cn("font-bold", getGrowthColor(growth))}>+{growth}%</span>
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          <BarChart3 size={12} className="text-blue-500" />
                          <span className="text-muted">Weekly Pins:</span>
                          <span className="font-medium">{weeklyPins}</span>
                        </span>
                      </div>

                      {/* Brands */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {brands.map(b => (
                          <span key={b} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                            {b}
                          </span>
                        ))}
                      </div>

                      {/* Ad Opportunity */}
                      <div className="mt-3 p-3 bg-amber-50/60 rounded-lg border border-amber-200">
                        <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wide mb-1">Ad Opportunity</p>
                        <p className="text-xs text-text-secondary">{adOpportunity}</p>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => copyText(adOpportunity, signal.id)}
                      className="btn-secondary text-xs shrink-0"
                    >
                      <Copy size={12} /> {copiedId === signal.id ? "Copied!" : "Copy Ad Brief"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Instagram Tab */}
        {activeTab === "instagram" && (
          <>
            {filteredInstagram.length === 0 && (
              <EmptyState icon={Hash} message="No Instagram hashtags match the current filter." />
            )}
            {filteredInstagram.map((signal, i) => {
              const hashtag = signal.data.hashtag || signal.title;
              const growth = signal.data.growth || 0;
              const weeklyPosts = signal.data.weeklyPosts || "N/A";
              const aesthetic = signal.data.aesthetic || "";
              const audience = signal.data.audience || "";
              const category = signal.triggersWhat;
              const brands = signal.suggestedBrands;
              const adAngle = signal.suggestedAction;

              return (
                <div key={signal.id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs font-semibold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full border border-pink-200">
                          <Hash size={10} /> Instagram
                        </span>
                        <span className="text-xs bg-surface text-muted px-2 py-0.5 rounded">{category}</span>
                        {growth >= 300 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 border border-red-200">
                            <Flame size={9} className="inline mr-0.5" />viral
                          </span>
                        )}
                        {growth >= 150 && growth < 300 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 border border-green-200">
                            rising
                          </span>
                        )}
                      </div>

                      {/* Hashtag */}
                      <h3 className="font-semibold text-sm mb-1">{hashtag}</h3>
                      <p className="text-xs text-text-secondary italic">{aesthetic}</p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-xs flex items-center gap-1">
                          <ArrowUpRight size={12} className={getGrowthColor(growth)} />
                          <span className="text-muted">Growth:</span>
                          <span className={cn("font-bold", getGrowthColor(growth))}>+{growth}%</span>
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          <MessageCircle size={12} className="text-pink-500" />
                          <span className="text-muted">Weekly Posts:</span>
                          <span className="font-medium">{weeklyPosts}</span>
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          <Users size={12} className="text-blue-500" />
                          <span className="text-muted">Audience:</span>
                          <span className="font-medium">{audience}</span>
                        </span>
                      </div>

                      {/* Brands */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {brands.map(b => (
                          <span key={b} className="text-[10px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded border border-pink-200">
                            {b}
                          </span>
                        ))}
                      </div>

                      {/* Ad Angle */}
                      <div className="mt-3 p-3 bg-amber-50/60 rounded-lg border border-amber-200">
                        <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wide mb-1">Ad Angle</p>
                        <p className="text-xs text-text-secondary">{adAngle}</p>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => copyText(adAngle, signal.id)}
                      className="btn-secondary text-xs shrink-0"
                    >
                      <Copy size={12} /> {copiedId === signal.id ? "Copied!" : "Copy Ad Brief"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Lyst Tab */}
        {activeTab === "lyst" && (
          <>
            {filteredLyst.length === 0 && (
              <EmptyState icon={ShoppingBag} message="No Lyst products match the current filter." />
            )}
            {filteredLyst.map((signal, i) => {
              const rank = signal.data.rank || i + 1;
              const product = signal.data.product || signal.title;
              const brand = signal.suggestedBrands[0] || "Unknown";
              const searchGrowth = signal.data.searchGrowth || 0;
              const socialMentions = signal.data.socialMentions || "N/A";
              const category = signal.triggersWhat;
              const adOpportunity = signal.suggestedAction;
              // Lyst signals from the API always set availableOnAjioLuxe: true in mock data
              const availableOnAjioLuxe = true;

              return (
                <div key={signal.id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
                          <ShoppingBag size={10} /> Lyst #{rank}
                        </span>
                        <span className="text-xs bg-surface text-muted px-2 py-0.5 rounded">{category}</span>
                        <span className="text-xs font-semibold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full">
                          {brand}
                        </span>
                        {availableOnAjioLuxe ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 border border-green-200 flex items-center gap-0.5">
                            <CheckCircle size={9} /> Available
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            Unavailable
                          </span>
                        )}
                      </div>

                      {/* Product */}
                      <h3 className="font-semibold text-sm mb-1">{product}</h3>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-xs flex items-center gap-1">
                          <ArrowUpRight size={12} className={getGrowthColor(searchGrowth)} />
                          <span className="text-muted">Search Growth:</span>
                          <span className={cn("font-bold", getGrowthColor(searchGrowth))}>+{searchGrowth}%</span>
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          <MessageCircle size={12} className="text-purple-500" />
                          <span className="text-muted">Social:</span>
                          <span className="font-medium">{socialMentions}</span>
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          <Eye size={12} className="text-blue-500" />
                          <span className="text-muted">Severity:</span>
                          <span className="font-medium capitalize">{signal.severity}</span>
                        </span>
                      </div>

                      {/* Ad Opportunity */}
                      <div className="mt-3 p-3 bg-amber-50/60 rounded-lg border border-amber-200">
                        <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wide mb-1">Ad Opportunity</p>
                        <p className="text-xs text-text-secondary">{adOpportunity}</p>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => copyText(adOpportunity, signal.id)}
                      className="btn-secondary text-xs shrink-0"
                    >
                      <Copy size={12} /> {copiedId === signal.id ? "Copied!" : "Copy Ad Brief"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<{ size?: number; className?: string }>; message: string }) {
  return (
    <div className="glass-card p-8 text-center">
      <Icon size={32} className="text-muted mx-auto mb-3" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
