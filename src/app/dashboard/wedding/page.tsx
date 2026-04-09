"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Gift,
  Calendar,
  Crown,
  Sparkles,
  Copy,
  ChevronDown,
  ChevronRight,
  MapPin,
  Clock,
  TrendingUp,
  Star,
  PartyPopper,
  Users,
  Check,
  Tag,
  Target,
  Gem,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SampleAd {
  headline: string;
  body: string;
  cta: string;
  targeting: string;
  platforms: string[];
  brandTier: "luxury" | "premium" | "accessible";
}

interface WeddingPhase {
  id: string;
  name: string;
  description: string;
  categories: string[];
  brands: string[];
  adAngle: string;
  sampleAds: SampleAd[];
}

interface WeddingSeason {
  id: string;
  name: string;
  period: string;
  status: "active" | "upcoming" | "peak" | "ending";
  regions: string[];
  description: string;
  daysUntil: number;
  intensity: number;
}

interface GiftingOccasion {
  id: string;
  name: string;
  date: string;
  daysUntil: number;
  giftCategories: string[];
  targetBrands: string[];
  campaignAngle: string;
  sampleAd: {
    headline: string;
    body: string;
    cta: string;
  };
  budgetSuggestion: string;
}

interface ApiResponse {
  seasons: WeddingSeason[];
  phases: WeddingPhase[];
  giftingOccasions: GiftingOccasion[];
  summary: {
    activeSeasons: number;
    totalPhases: number;
    upcomingGiftingOccasions: number;
    nextGiftingEvent: string;
    currentIntensity: number;
  };
  fetchedAt: string;
}

const phaseIcons: Record<string, React.ElementType> = {
  "phase-engagement": Heart,
  "phase-sangeet": PartyPopper,
  "phase-mehendi": Sparkles,
  "phase-wedding-day": Crown,
  "phase-reception": Star,
  "phase-honeymoon": MapPin,
  "phase-trousseau": Gem,
};

const phaseColors: Record<string, string> = {
  "phase-engagement": "pink",
  "phase-sangeet": "purple",
  "phase-mehendi": "green",
  "phase-wedding-day": "orange",
  "phase-reception": "blue",
  "phase-honeymoon": "cyan",
  "phase-trousseau": "red",
};

function tierBadge(tier: "luxury" | "premium" | "accessible") {
  const styles = {
    luxury: "bg-amber-100 text-amber-800 border-amber-200",
    premium: "bg-purple-100 text-purple-800 border-purple-200",
    accessible: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wide", styles[tier])}>
      {tier}
    </span>
  );
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

export default function WeddingCampaignsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTiers] = useState<string[]>(getActiveTiers);
  const [businessProfile] = useState(getBusinessProfile);
  const isBrandMode = businessProfile.type === "brand";

  useEffect(() => {
    fetch("/api/wedding-campaigns")
      .then((res) => res.json())
      .then((json: ApiResponse) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function togglePhase(id: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function formatAdText(ad: { headline: string; body: string; cta: string }) {
    return `Headline: ${ad.headline}\nBody: ${ad.body}\nCTA: ${ad.cta}`;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Heart size={32} className="mx-auto text-pink-400 animate-pulse" />
          <p className="text-sm text-muted">Loading wedding campaign data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">Failed to load campaign data.</p>
      </div>
    );
  }

  const { seasons, giftingOccasions, summary } = data;
  const brandName = businessProfile.brandName?.toLowerCase() || "";

  // Filter phases by mode
  const phases = isBrandMode && brandName
    ? data.phases.filter(phase =>
        phase.brands.some(b => b.toLowerCase().includes(brandName))
      )
    : data.phases.map(phase => ({
        ...phase,
        sampleAds: phase.sampleAds.filter(ad => activeTiers.includes(ad.brandTier)),
      })).filter(phase => phase.sampleAds.length > 0);

  // Filter gifting occasions by brand in brand mode
  const filteredGiftingOccasions = isBrandMode && brandName
    ? giftingOccasions.filter(g =>
        g.targetBrands.some(b => b.toLowerCase().includes(brandName))
      )
    : giftingOccasions;

  const upcomingGifts = filteredGiftingOccasions.filter((g) => g.daysUntil > 0);
  const tierLabel = isBrandMode
    ? (businessProfile.brandName || "Brand")
    : activeTiers.length === 1 ? activeTiers[0].charAt(0).toUpperCase() + activeTiers[0].slice(1) : "All Tiers";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-50">
            <Heart size={22} className="text-pink-500" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Wedding & Gifting Campaign Orchestrator</h1>
              <span className={cn("text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 border",
                isBrandMode ? "bg-purple-50 text-purple-700 border-purple-200" :
                activeTiers.length === 1 && activeTiers[0] === "luxury" ? "bg-purple-50 text-purple-700 border-purple-200" :
                activeTiers.length === 1 && activeTiers[0] === "accessible" ? "bg-green-50 text-green-700 border-green-200" :
                "bg-blue-50 text-blue-700 border-blue-200"
              )}>
                <Sparkles size={10} /> {isBrandMode ? `Brand: ${tierLabel}` : `${tierLabel} mode`}
              </span>
            </div>
            <p className="text-sm text-muted mt-1">
              {isBrandMode
                ? `How ${businessProfile.brandName || "your brand"} fits into India's $130B wedding industry — exact ads for every function and gifting occasion.`
                : "India's $130B wedding industry is your biggest luxury opportunity. Here's exactly what ads to run for every wedding function and gifting occasion."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <div className="stat-card stat-card-green">
          <p className="text-xs text-muted font-medium">Active Seasons</p>
          <p className="text-2xl font-bold mt-1">{summary.activeSeasons}</p>
          <p className="text-[10px] text-muted mt-0.5">of {seasons.length} tracked</p>
        </div>
        <div className="stat-card stat-card-purple">
          <p className="text-xs text-muted font-medium">Wedding Phases</p>
          <p className="text-2xl font-bold mt-1">{summary.totalPhases}</p>
          <p className="text-[10px] text-muted mt-0.5">campaign blueprints</p>
        </div>
        <div className="stat-card stat-card-blue">
          <p className="text-xs text-muted font-medium">Upcoming Gifting</p>
          <p className="text-2xl font-bold mt-1">{summary.upcomingGiftingOccasions}</p>
          <p className="text-[10px] text-muted mt-0.5">within 60 days</p>
        </div>
        <div className="stat-card stat-card-orange">
          <p className="text-xs text-muted font-medium">Next Event</p>
          <p className="text-lg font-bold mt-1 truncate">{summary.nextGiftingEvent}</p>
          <p className="text-[10px] text-muted mt-0.5">
            {upcomingGifts[0] ? `${upcomingGifts[0].daysUntil} days away` : "—"}
          </p>
        </div>
        <div className="stat-card relative overflow-hidden">
          <p className="text-xs text-muted font-medium">Season Intensity</p>
          <p className="text-2xl font-bold mt-1">{summary.currentIntensity}/10</p>
          <div className="mt-2 flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < summary.currentIntensity
                    ? summary.currentIntensity >= 8
                      ? "bg-red-400"
                      : summary.currentIntensity >= 5
                        ? "bg-orange-400"
                        : "bg-green-400"
                    : "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Section 1: Wedding Seasons Status */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-blue-500" />
          Wedding Seasons Status
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {seasons.map((season) => (
            <div key={season.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{season.name}</h3>
                  <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                    <Clock size={10} />
                    {season.period}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full font-medium",
                    season.status === "active" && "bg-green-100 text-green-700",
                    season.status === "upcoming" && "bg-blue-100 text-blue-700",
                    season.status === "peak" && "bg-red-100 text-red-700",
                    season.status === "ending" && "bg-yellow-100 text-yellow-700"
                  )}
                >
                  {season.status}
                </span>
              </div>
              <p className="text-sm text-muted mb-3">{season.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={12} className="text-muted shrink-0" />
                <div className="flex gap-1.5 flex-wrap">
                  {season.regions.map((r) => (
                    <span key={r} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted">Intensity</span>
                  <span className="text-[10px] font-medium">{season.intensity}/10</span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 flex-1 rounded-full",
                        i < season.intensity
                          ? season.intensity >= 8
                            ? "bg-red-400"
                            : season.intensity >= 5
                              ? "bg-orange-400"
                              : "bg-green-400"
                          : "bg-gray-200"
                      )}
                    />
                  ))}
                </div>
              </div>
              {season.daysUntil > 0 && (
                <p className="text-[10px] text-blue-600 font-medium mt-2">
                  Starts in {season.daysUntil} days
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Wedding Phase Campaign Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Crown size={18} className="text-orange-500" />
          Wedding Phase Campaigns
        </h2>
        <div className="space-y-3">
          {phases.map((phase) => {
            const isExpanded = expandedPhases.has(phase.id);
            const Icon = phaseIcons[phase.id] || Sparkles;
            const color = phaseColors[phase.id] || "blue";

            return (
              <div key={phase.id} className="glass-card overflow-hidden">
                {/* Phase Header — clickable */}
                <button
                  className="w-full p-5 text-left flex items-start gap-4 hover:bg-gray-50/50 transition-colors"
                  onClick={() => togglePhase(phase.id)}
                >
                  <div className={`p-3 rounded-xl bg-brand-${color}/10 shrink-0`}>
                    <Icon size={20} className={`text-brand-${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{phase.name}</h3>
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-muted">
                        {phase.sampleAds.length} ad{phase.sampleAds.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-1">{phase.description}</p>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <Tag size={10} className="text-muted" />
                        <span className="text-xs text-muted">
                          {phase.categories.slice(0, 3).join(", ")}
                          {phase.categories.length > 3 && ` +${phase.categories.length - 3}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={10} className="text-muted" />
                        <span className="text-xs text-muted">
                          {phase.brands.slice(0, 3).join(", ")}
                          {phase.brands.length > 3 && ` +${phase.brands.length - 3}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 pt-1">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-muted" />
                    ) : (
                      <ChevronRight size={18} className="text-muted" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t px-5 pb-5 pt-4 space-y-4 bg-gray-50/30">
                    {/* Ad Angle */}
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <TrendingUp size={14} className="text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wide">Campaign Angle</p>
                        <p className="text-sm text-amber-900 mt-0.5">{phase.adAngle}</p>
                      </div>
                    </div>

                    {/* Categories & Brands */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-2">Categories</p>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.categories.map((cat) => (
                            <span key={cat} className="text-xs bg-white border px-2.5 py-1 rounded-full">{cat}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-2">Recommended Brands</p>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.brands.map((brand) => (
                            <span key={brand} className="text-xs bg-white border px-2.5 py-1 rounded-full font-medium">{brand}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sample Ads */}
                    <div>
                      <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-3">Sample Ad Recommendations</p>
                      <div className="space-y-3">
                        {phase.sampleAds.map((ad, idx) => {
                          const adId = `${phase.id}-ad-${idx}`;
                          return (
                            <div key={idx} className="bg-white border rounded-xl p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                  <p className="font-semibold text-sm">{ad.headline}</p>
                                  <p className="text-sm text-muted">{ad.body}</p>
                                  <p className="text-xs font-medium text-blue-600 mt-1">{ad.cta}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                  {tierBadge(ad.brandTier)}
                                  <button
                                    onClick={() => copyToClipboard(formatAdText(ad), adId)}
                                    className={cn(
                                      "p-1.5 rounded-md border transition-colors",
                                      copiedId === adId
                                        ? "bg-green-50 border-green-200 text-green-600"
                                        : "hover:bg-gray-50 border-gray-200 text-muted"
                                    )}
                                    title="Copy ad text"
                                  >
                                    {copiedId === adId ? <Check size={14} /> : <Copy size={14} />}
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 pt-2 border-t">
                                <div className="flex items-center gap-1.5">
                                  <Target size={10} className="text-muted" />
                                  <span className="text-[10px] text-muted">{ad.targeting}</span>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                {ad.platforms.map((p) => (
                                  <span key={p} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{p}</span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Gifting Calendar */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gift size={18} className="text-red-500" />
          Gifting Calendar
        </h2>
        <div className="space-y-3">
          {upcomingGifts.length === 0 && (
            <div className="glass-card p-6 text-center">
              <Gift size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-muted">No upcoming gifting occasions within the tracking window.</p>
            </div>
          )}
          {filteredGiftingOccasions.map((occasion) => {
            const adId = `gift-${occasion.id}`;
            const isPast = occasion.daysUntil === 0;
            return (
              <div
                key={occasion.id}
                className={cn("glass-card p-5", isPast && "opacity-50")}
              >
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className="shrink-0 text-center">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex flex-col items-center justify-center",
                      isPast ? "bg-gray-100" : "bg-red-50"
                    )}>
                      <span className={cn(
                        "text-lg font-bold leading-none",
                        isPast ? "text-gray-400" : "text-red-600"
                      )}>
                        {new Date(occasion.date).getDate()}
                      </span>
                      <span className={cn(
                        "text-[10px] uppercase mt-0.5",
                        isPast ? "text-gray-400" : "text-red-500"
                      )}>
                        {new Date(occasion.date).toLocaleString("en", { month: "short" })}
                      </span>
                    </div>
                    {!isPast && (
                      <p className="text-[10px] font-medium text-blue-600 mt-1">
                        {occasion.daysUntil}d away
                      </p>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{occasion.name}</h3>
                      {isPast && (
                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">Past</span>
                      )}
                    </div>
                    <p className="text-sm text-muted mb-3">{occasion.campaignAngle}</p>

                    {/* Categories & Brands */}
                    <div className="flex flex-wrap gap-4 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Tag size={10} className="text-muted" />
                        <span className="text-xs text-muted">{occasion.giftCategories.join(", ")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={10} className="text-muted" />
                        <span className="text-xs text-muted">{occasion.targetBrands.join(", ")}</span>
                      </div>
                    </div>

                    {/* Sample Ad */}
                    <div className="bg-gray-50 border rounded-lg p-3 space-y-1.5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{occasion.sampleAd.headline}</p>
                          <p className="text-xs text-muted mt-1">{occasion.sampleAd.body}</p>
                          <p className="text-xs font-medium text-blue-600 mt-1">{occasion.sampleAd.cta}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(formatAdText(occasion.sampleAd), adId)}
                          className={cn(
                            "p-1.5 rounded-md border transition-colors shrink-0 ml-3",
                            copiedId === adId
                              ? "bg-green-50 border-green-200 text-green-600"
                              : "hover:bg-gray-50 border-gray-200 text-muted"
                          )}
                          title="Copy ad text"
                        >
                          {copiedId === adId ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <TrendingUp size={10} className="text-green-600" />
                      <span className="text-[10px] text-green-700 font-medium">{occasion.budgetSuggestion}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
