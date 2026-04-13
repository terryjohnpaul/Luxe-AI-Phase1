"use client";

import { useState, useEffect } from "react";
import {
  Star, Crown, Camera, Sparkles, Copy, Clock, Instagram,
  TrendingUp, Users, Heart, Zap, Loader2, ChevronDown,
  ChevronRight, ExternalLink, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CelebrityMoment {
  id: string;
  celebrity: string;
  event: string;
  brand: string;
  product: string;
  platform: "instagram" | "paparazzi" | "event" | "movie" | "interview";
  imageDescription: string;
  detectedAt: string;
  reach: string;
  fanBase: string;
  relevantAudience: string[];
  adRecommendation: {
    headline: string;
    body: string;
    cta: string;
    targeting: string;
    platforms: string[];
    urgency: "immediate" | "24h" | "this_week";
    estimatedImpact: string;
  };
  brandTier: "luxury" | "premium" | "accessible";
}

interface MonitoredCelebrity {
  name: string;
  followers: string;
  affinityBrands: string[];
}

interface ApiResponse {
  moments: CelebrityMoment[];
  summary: {
    totalMoments: number;
    immediatePriority: number;
    brandsInvolved: number;
    celebritiesActive: number;
  };
  monitoredCelebrities: MonitoredCelebrity[];
  fetchedAt: string;
}

function getUrgencyBadge(urgency: string) {
  if (urgency === "immediate") return "bg-red-100 text-red-700 border border-red-200";
  if (urgency === "24h") return "bg-orange-100 text-orange-700 border border-orange-200";
  return "bg-blue-100 text-blue-700 border border-blue-200";
}

function getUrgencyLabel(urgency: string) {
  if (urgency === "immediate") return "Immediate";
  if (urgency === "24h") return "Within 24h";
  return "This Week";
}

function getTierBadge(tier: string) {
  if (tier === "luxury") return "bg-amber-100 text-amber-800 border border-amber-200";
  if (tier === "premium") return "bg-purple-100 text-purple-700 border border-purple-200";
  return "bg-green-100 text-green-700 border border-green-200";
}

function getPlatformIcon(platform: string) {
  if (platform === "instagram") return <Instagram size={14} className="text-pink-500" />;
  if (platform === "paparazzi") return <Camera size={14} className="text-gray-600" />;
  return <Star size={14} className="text-amber-500" />;
}

function getActiveTiers(): string[] {
  if (typeof window === "undefined") return ["luxury", "premium", "accessible"];
  try {
    const stored = localStorage.getItem("luxeai-active-tiers");
    if (stored) return JSON.parse(stored);
  } catch {}
  return ["luxury", "premium", "accessible"];
}

function getBusinessProfile(): { type: "brand" | "marketplace"; brandName?: string } {
  if (typeof window === "undefined") return { type: "marketplace" };
  try {
    const stored = localStorage.getItem("luxeai-business-profile");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { type: "marketplace" };
}

export default function CelebrityPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [expandedMoment, setExpandedMoment] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTiers] = useState<string[]>(getActiveTiers);
  const [businessProfile] = useState(getBusinessProfile);
  const isBrandMode = businessProfile.type === "brand";

  useEffect(() => {
    fetch("/api/celebrity-moments")
      .then(r => {
        if (!r.ok) throw new Error(`Failed to fetch celebrity moments (${r.status})`);
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch((err) => { setError(err.message || "Failed to load celebrity intelligence"); setLoading(false); });
  }, []);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-sm text-muted">Scanning celebrity fashion moments across Instagram, events & paparazzi feeds...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Camera size={32} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">{error || "No celebrity intelligence data available."}</p>
          <button onClick={() => { setError(null); setLoading(true); fetch("/api/celebrity-moments").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => { setError("Failed to load"); setLoading(false); }); }}
            className="mt-3 text-xs text-brand-blue hover:underline">Try again</button>
        </div>
      </div>
    );
  }

  // Filter by business mode + active brand tiers
  const tierFilteredMoments = data.moments.filter(m => {
    if (isBrandMode && businessProfile.brandName) {
      // Brand mode: only show moments where celebrity wore YOUR brand
      return m.brand.toLowerCase().includes(businessProfile.brandName.toLowerCase());
    }
    // Marketplace mode: filter by selected tiers
    return activeTiers.includes(m.brandTier);
  });
  const brands = [...new Set(tierFilteredMoments.map(m => m.brand))];
  const filteredMoments = tierFilteredMoments.filter(m =>
    (filterUrgency === "all" || m.adRecommendation.urgency === filterUrgency) &&
    (filterBrand === "all" || m.brand === filterBrand)
  );
  const tierLabel = isBrandMode
    ? (businessProfile.brandName || "Brand")
    : activeTiers.length === 1 ? activeTiers[0].charAt(0).toUpperCase() + activeTiers[0].slice(1) : "All Tiers";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown size={22} className="text-amber-500" />
            <h1 className="text-2xl font-bold">Celebrity & Bollywood Intelligence</h1>
          </div>
          <p className="text-sm text-muted">
            {isBrandMode
              ? `When celebrities wear ${businessProfile.brandName || "your brand"}, strike immediately with targeted ads`
              : "When celebrities wear your brands, strike immediately with targeted ads"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <span className={cn("text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 border",
            isBrandMode ? "bg-purple-50 text-purple-700 border-purple-200" :
            activeTiers.length === 1 && activeTiers[0] === "luxury" ? "bg-purple-50 text-purple-700 border-purple-200" :
            activeTiers.length === 1 && activeTiers[0] === "accessible" ? "bg-green-50 text-green-700 border-green-200" :
            "bg-blue-50 text-blue-700 border-blue-200"
          )}>
            <Sparkles size={10} /> {isBrandMode ? `Brand: ${tierLabel}` : `${tierLabel} mode`}
          </span>
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Star size={10} /> {data.monitoredCelebrities.length} Celebrities Monitored
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Moments Detected", value: data.summary.totalMoments.toString(), color: "blue", icon: Camera },
          { label: "Immediate Priority", value: data.summary.immediatePriority.toString(), color: "red", icon: Zap },
          { label: "Celebrities Active", value: data.summary.celebritiesActive.toString(), color: "purple", icon: Star },
          { label: "Brands Trending", value: data.summary.brandsInvolved.toString(), color: "orange", icon: TrendingUp },
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

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <Filter size={14} className="text-muted" />
        <div className="flex gap-1">
          {["all", "immediate", "24h", "this_week"].map(u => (
            <button key={u} onClick={() => setFilterUrgency(u)}
              className={cn("text-xs px-3 py-1.5 rounded-full transition-colors",
                filterUrgency === u ? "bg-brand-blue text-white" : "bg-surface text-muted hover:bg-card-border"
              )}>
              {u === "all" ? "All" : u === "immediate" ? "Immediate" : u === "24h" ? "24h" : "This Week"}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-card-border" />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilterBrand("all")}
            className={cn("text-xs px-3 py-1.5 rounded-full transition-colors",
              filterBrand === "all" ? "bg-brand-purple text-white" : "bg-surface text-muted hover:bg-card-border"
            )}>All Brands</button>
          {brands.map(b => (
            <button key={b} onClick={() => setFilterBrand(b)}
              className={cn("text-xs px-3 py-1.5 rounded-full transition-colors",
                filterBrand === b ? "bg-brand-purple text-white" : "bg-surface text-muted hover:bg-card-border"
              )}>{b}</button>
          ))}
        </div>
      </div>

      {/* Celebrity Moment Cards */}
      <div className="space-y-4">
        {filteredMoments.map(moment => {
          const isExpanded = expandedMoment === moment.id;
          const adText = `${moment.adRecommendation.headline}\n\n${moment.adRecommendation.body}\n\nCTA: ${moment.adRecommendation.cta}`;
          return (
            <div key={moment.id} className="glass-card overflow-hidden">
              <div className="p-4">
                {/* Top row: celebrity + event + brand + badges */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                        <Crown size={10} /> {moment.celebrity}
                      </span>
                      <span className="flex items-center gap-1 text-xs bg-surface px-2 py-0.5 rounded">
                        {getPlatformIcon(moment.platform)} {moment.event}
                      </span>
                      <span className="text-xs font-semibold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full">
                        {moment.brand}
                      </span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", getUrgencyBadge(moment.adRecommendation.urgency))}>
                        <span className="flex items-center gap-1"><Clock size={9} /> {getUrgencyLabel(moment.adRecommendation.urgency)}</span>
                      </span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full capitalize", getTierBadge(moment.brandTier))}>
                        {moment.brandTier}
                      </span>
                    </div>

                    {/* What they wore */}
                    <h3 className="font-semibold text-sm mb-1">{moment.product}</h3>
                    <p className="text-xs text-text-secondary">{moment.imageDescription}</p>

                    {/* Reach stats */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <span className="text-xs flex items-center gap-1">
                        <TrendingUp size={12} className="text-green-500" />
                        <span className="text-muted">Reach:</span>
                        <span className="font-medium">{moment.reach}</span>
                      </span>
                      <span className="text-xs flex items-center gap-1">
                        <Users size={12} className="text-blue-500" />
                        <span className="text-muted">Fan Base:</span>
                        <span className="font-medium">{moment.fanBase}</span>
                      </span>
                      <span className="text-xs flex items-center gap-1">
                        <Heart size={12} className="text-pink-500" />
                        <span className="text-muted">Audience:</span>
                        <span className="font-medium">{moment.relevantAudience.join(", ")}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => copyText(adText, `ad-${moment.id}`)}
                      className="btn-secondary text-xs">
                      <Copy size={12} /> {copiedText === `ad-${moment.id}` ? "Copied!" : "Copy Ad"}
                    </button>
                    <button onClick={() => setExpandedMoment(isExpanded ? null : moment.id)}
                      className="btn-secondary text-xs">
                      <Sparkles size={12} /> View Campaign
                    </button>
                  </div>
                </div>

                {/* Expand toggle */}
                <button onClick={() => setExpandedMoment(isExpanded ? null : moment.id)}
                  className="flex items-center gap-1 text-xs text-brand-purple mt-3 hover:underline">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Sparkles size={12} /> {isExpanded ? "Hide ad recommendation" : "See ad recommendation & targeting"}
                </button>
              </div>

              {/* Expanded: Ad Recommendation */}
              {isExpanded && (
                <div className="border-t border-card-border bg-amber-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">As Seen On — Ad Recommendation</p>

                      <div className="p-3 bg-white rounded-lg border border-amber-200">
                        <p className="text-sm font-bold mb-1">{moment.adRecommendation.headline}</p>
                        <p className="text-xs text-text-secondary mb-2">{moment.adRecommendation.body}</p>
                        <span className="text-xs font-medium bg-brand-blue text-white px-2.5 py-1 rounded">
                          {moment.adRecommendation.cta}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-lg border border-amber-200">
                          <p className="text-[10px] font-medium text-muted mb-1 uppercase">Targeting</p>
                          <p className="text-xs text-text-secondary">{moment.adRecommendation.targeting}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-amber-200">
                          <p className="text-[10px] font-medium text-muted mb-1 uppercase">Platforms</p>
                          <div className="flex flex-wrap gap-1">
                            {moment.adRecommendation.platforms.map(p => (
                              <span key={p} className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{p}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-amber-200">
                        <p className="text-[10px] font-medium text-muted mb-1 uppercase">Estimated Impact</p>
                        <p className="text-xs text-text-secondary flex items-center gap-1">
                          <TrendingUp size={12} className="text-green-500" /> {moment.adRecommendation.estimatedImpact}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredMoments.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Camera size={32} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No celebrity moments match the current filters.</p>
        </div>
      )}

      {/* Monitored Celebrities Grid */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star size={16} className="text-amber-500" />
          <h3 className="font-semibold text-sm">Monitored Celebrities</h3>
          <span className="text-[10px] bg-surface text-muted px-2 py-0.5 rounded-full">{data.monitoredCelebrities.length} tracked</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {data.monitoredCelebrities.map(celeb => (
            <div key={celeb.name} className="p-3 border border-card-border rounded-lg hover:border-amber-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{celeb.name}</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Users size={8} /> {celeb.followers}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {celeb.affinityBrands.map(b => (
                  <span key={b} className="text-[10px] bg-surface text-muted px-1.5 py-0.5 rounded">{b}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
