"use client";

import { useState, useEffect } from "react";
import {
  Eye, Target, TrendingUp, ExternalLink, Search, Filter,
  AlertTriangle, Lightbulb, Copy, RefreshCw, Loader2,
  Instagram, Youtube, Globe, ShoppingBag, DollarSign,
  BarChart3, Megaphone, Clock, ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CompetitorAd {
  competitor: string;
  platform: string;
  adType: string;
  headline: string;
  body: string;
  cta: string;
  estimatedSpend: string;
  impressions: string;
  status: string;
  startDate: string;
  platforms: string[];
  targeting: string;
  snapshotUrl: string;
  insight: string;
}

interface ApiResponse {
  ads: CompetitorAd[];
  summary: {
    totalAds: number;
    competitors: number;
    metaAds: number;
    googleAds: number;
  };
  apiStatus: { metaAdLibrary: string; googleTransparency: string };
  fetchedAt: string;
}

function getAdTypeBadge(type: string) {
  const colors: Record<string, string> = {
    "Carousel": "bg-blue-100 text-blue-700",
    "Reels": "bg-purple-100 text-purple-700",
    "Video": "bg-red-100 text-red-700",
    "Static Image": "bg-green-100 text-green-700",
    "Search": "bg-yellow-100 text-yellow-700",
    "Shopping": "bg-orange-100 text-orange-700",
  };
  return colors[type] || "bg-gray-100 text-gray-700";
}

function getPlatformIcon(platform: string) {
  if (platform === "Meta") return <Instagram size={14} className="text-pink-500" />;
  if (platform === "Google") return <Globe size={14} className="text-blue-500" />;
  return <Megaphone size={14} className="text-gray-500" />;
}

export default function CompetitorsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCompetitor, setFilterCompetitor] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [expandedAd, setExpandedAd] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/competitors", { signal: AbortSignal.timeout(45000) })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
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
          <Loader2 size={32} className="animate-spin text-brand-blue mx-auto mb-4" />
          <p className="text-sm text-muted">Scanning competitor ads across Meta & Google...</p>
        </div>
      </div>
    );
  }

  if (!data) return (<div className="p-6 text-center"><p className="text-muted">Failed to load competitor data. Try refreshing the page.</p></div>);

  const competitors = [...new Set(data.ads.map(a => a.competitor))];
  const filteredAds = data.ads.filter(a =>
    (filterCompetitor === "all" || a.competitor === filterCompetitor) &&
    (filterPlatform === "all" || a.platform === filterPlatform)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Competitor Ads Intelligence</h1>
          <p className="text-sm text-muted mt-1">
            See exactly what Tata CLiQ Luxury, Myntra, and luxury brands are running on Meta & Google right now
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><RefreshCw size={14} /> Refresh</button>
          <a href="https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=luxury%20fashion" target="_blank" className="btn-secondary">
            <ExternalLink size={14} /> Meta Ad Library
          </a>
          <a href="https://adstransparency.google.com" target="_blank" className="btn-secondary">
            <ExternalLink size={14} /> Google Transparency
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Competitor Ads Tracked", value: data.summary.totalAds.toString(), color: "blue", icon: Eye },
          { label: "Competitors Monitored", value: data.summary.competitors.toString(), color: "red", icon: Target },
          { label: "Meta Ads", value: data.summary.metaAds.toString(), color: "purple", icon: Instagram },
          { label: "Google Ads", value: data.summary.googleAds.toString(), color: "green", icon: Globe },
          { label: "API Status", value: data.apiStatus.metaAdLibrary === "connected" ? "Live" : "Demo", color: "orange", icon: BarChart3 },
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

      {/* API Status Banner */}
      {data.apiStatus.metaAdLibrary === "demo_mode" && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Demo Mode — showing realistic sample data</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Add <code className="bg-yellow-100 px-1 rounded">META_AD_LIBRARY_TOKEN</code> and <code className="bg-yellow-100 px-1 rounded">SERPAPI_KEY</code> to .env for real competitor ads.
              Meta Ad Library is FREE. SerpApi is $50/month.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="flex gap-1">
          <button onClick={() => setFilterCompetitor("all")}
            className={cn("text-xs px-3 py-1.5 rounded-full transition-colors",
              filterCompetitor === "all" ? "bg-brand-blue text-white" : "bg-surface text-muted hover:bg-card-border"
            )}>All Competitors</button>
          {competitors.map(c => (
            <button key={c} onClick={() => setFilterCompetitor(c)}
              className={cn("text-xs px-3 py-1.5 rounded-full transition-colors",
                filterCompetitor === c ? "bg-brand-blue text-white" : "bg-surface text-muted hover:bg-card-border"
              )}>{c}</button>
          ))}
        </div>
        <div className="w-px h-6 bg-card-border" />
        <div className="flex gap-1">
          {["all", "Meta", "Google"].map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)}
              className={cn("text-xs px-3 py-1.5 rounded-full transition-colors",
                filterPlatform === p ? "bg-brand-blue text-white" : "bg-surface text-muted hover:bg-card-border"
              )}>{p === "all" ? "All Platforms" : p}</button>
          ))}
        </div>
      </div>

      {/* Ad Cards */}
      <div className="space-y-4">
        {filteredAds.map((ad, idx) => {
          const isExpanded = expandedAd === idx;
          return (
            <div key={idx} className="glass-card overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Top line: competitor + platform + type */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{ad.competitor}</span>
                      <span className="flex items-center gap-1 text-xs bg-surface px-2 py-0.5 rounded">
                        {getPlatformIcon(ad.platform)} {ad.platform}
                      </span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full", getAdTypeBadge(ad.adType))}>
                        {ad.adType}
                      </span>
                      <span className="text-[10px] text-muted flex items-center gap-1"><Clock size={10} /> Since {ad.startDate}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                        ad.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      )}>{ad.status}</span>
                    </div>

                    {/* Ad content */}
                    <h3 className="font-semibold text-sm mb-1">{ad.headline}</h3>
                    <p className="text-xs text-text-secondary">{ad.body}</p>

                    {/* Quick stats */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <span className="text-xs"><span className="text-muted">CTA: </span><span className="font-medium bg-brand-blue/10 text-brand-blue px-1.5 py-0.5 rounded">{ad.cta}</span></span>
                      <span className="text-xs"><span className="text-muted">Est. Spend: </span><span className="font-semibold">{ad.estimatedSpend}</span></span>
                      <span className="text-xs"><span className="text-muted">Impressions: </span><span className="font-semibold">{ad.impressions}</span></span>
                      <span className="text-xs"><span className="text-muted">Placements: </span>{ad.platforms.join(", ")}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {ad.snapshotUrl && (
                      <a href={ad.snapshotUrl} target="_blank" className="btn-secondary text-xs"><ExternalLink size={12} /> View in Ad Library</a>
                    )}
                    <button onClick={() => copyText(`${ad.headline}\n${ad.body}`, `ad-${idx}`)}
                      className="btn-secondary text-xs">
                      <Copy size={12} /> {copiedText === `ad-${idx}` ? "Copied!" : "Copy Ad Text"}
                    </button>
                  </div>
                </div>

                {/* Expand for insight */}
                <button onClick={() => setExpandedAd(isExpanded ? null : idx)}
                  className="flex items-center gap-1 text-xs text-brand-purple mt-3 hover:underline">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Lightbulb size={12} /> {isExpanded ? "Hide strategic insight" : "See strategic insight & how to counter"}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-card-border bg-purple-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb size={16} className="text-brand-purple shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-brand-purple mb-1">STRATEGIC INSIGHT</p>
                      <p className="text-sm text-text-secondary">{ad.insight}</p>
                      <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                        <p className="text-xs font-medium text-muted mb-1">TARGETING INTEL</p>
                        <p className="text-xs text-text-secondary">{ad.targeting}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Direct Links */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-sm mb-3">Quick Links — View Competitor Ads Directly</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "Tata CLiQ Luxury", metaUrl: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=tata%20cliq%20luxury", googleUrl: "https://adstransparency.google.com/?region=IN&topic=political_ads" },
            { name: "Myntra", metaUrl: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=myntra", googleUrl: "https://adstransparency.google.com/?region=IN" },
            { name: "Hugo Boss India", metaUrl: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=hugo%20boss", googleUrl: "https://adstransparency.google.com/?region=IN" },
            { name: "Coach India", metaUrl: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=coach", googleUrl: "" },
            { name: "Diesel India", metaUrl: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=diesel", googleUrl: "" },
            { name: "Versace", metaUrl: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=versace", googleUrl: "" },
          ].map(link => (
            <div key={link.name} className="flex items-center justify-between p-3 border border-card-border rounded-lg">
              <span className="text-sm font-medium">{link.name}</span>
              <div className="flex gap-1">
                <a href={link.metaUrl} target="_blank" className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100">
                  Meta Ads
                </a>
                {link.googleUrl && (
                  <a href={link.googleUrl} target="_blank" className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">
                    Google Ads
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
