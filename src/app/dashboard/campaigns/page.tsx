"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  Play,
  Pause,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Brain,
  ExternalLink,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface CampaignMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionValue: number;
  roas: number;
  cpa: number;
  cpc: number;
}

interface Campaign {
  id: string;
  dbId?: string;
  platform: string;
  name: string;
  status: string;
  campaignType: string;
  dailyBudget: number;
  metrics: CampaignMetrics;
}

interface Stats {
  total: number;
  meta: number;
  google: number;
  active: number;
  paused: number;
  totalSpend: number;
  totalPages: number;
}

interface ApiResponse {
  campaigns: Campaign[];
  stats: Stats;
}

interface EditFields {
  name: string;
  status: string;
  dailyBudget: string;
  spendCap: string;
  bidStrategy: string;
  startTime: string;
  stopTime: string;
}

interface AdSetData {
  id: string;
  name: string;
  status: string;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  optimizationGoal: string;
  billingEvent: string;
  bidStrategy: string;
  bidAmount: number | null;
  targeting: any;
  startTime: string;
  endTime: string;
  promotedObject: any;
  pacingType: string[];
}

interface AdData {
  id: string;
  name: string;
  status: string;
  creative: {
    id: string;
    title: string;
    body: string;
    callToAction: string;
    imageUrl: string;
    thumbnailUrl: string;
  } | null;
}

interface AdSetEditFields {
  name: string;
  status: string;
  dailyBudget: string;
  lifetimeBudget: string;
  optimizationGoal: string;
  bidStrategy: string;
  bidAmount: string;
  ageMin: string;
  ageMax: string;
  gender: string;
  geoLocations: any;
  platforms: string[];
  igPlacements: string[];
  fbPlacements: string[];
  devices: string[];
  startTime: string;
  endTime: string;
  customAudiences: any[];
  excludedCustomAudiences: any[];
}

interface AdEditFields {
  name: string;
  status: string;
}

// ── Helpers ───────────────────────────────────────────────────
const fmtINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
const fmtNum = (v: number) => new Intl.NumberFormat("en-IN").format(Math.round(v));
const AUTH = "Basic " + (typeof btoa !== "undefined" ? btoa("admin:luxeai2026") : "");

const safe = (v: unknown): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

type SortKey = "spend" | "roas" | "conversions" | "cpa" | "ctr" | "impressions";

const ACCOUNT_ID = "202330961584003";

const BID_STRATEGIES = [
  { value: "LOWEST_COST_WITHOUT_CAP", label: "Lowest Cost" },
  { value: "LOWEST_COST_WITH_BID_CAP", label: "Bid Cap" },
  { value: "COST_CAP", label: "Cost Cap" },
];

const OPTIMIZATION_GOALS = [
  { value: "LINK_CLICKS", label: "Link Clicks" },
  { value: "LANDING_PAGE_VIEWS", label: "Landing Page Views" },
  { value: "IMPRESSIONS", label: "Impressions" },
  { value: "OFFSITE_CONVERSIONS", label: "Conversions" },
  { value: "REACH", label: "Reach" },
];

const IG_PLACEMENTS = [
  { value: "stream", label: "Feed" },
  { value: "story", label: "Stories" },
  { value: "reels", label: "Reels" },
  { value: "explore_home", label: "Explore" },
  { value: "ig_search", label: "Search" },
  { value: "profile_feed", label: "Profile" },
];

const FB_PLACEMENTS = [
  { value: "feed", label: "Feed" },
  { value: "video_feeds", label: "Video Feeds" },
  { value: "story", label: "Stories" },
  { value: "reels", label: "Reels" },
  { value: "marketplace", label: "Marketplace" },
];

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "audience_network", label: "Audience Network" },
];

const DEVICE_OPTIONS = [
  { value: "mobile", label: "Mobile" },
  { value: "desktop", label: "Desktop" },
];

function toDateInput(isoStr: string): string {
  if (!isoStr) return "";
  try {
    return new Date(isoStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function genderFromArray(arr: number[] | undefined): string {
  if (!arr || arr.length === 0) return "all";
  if (arr.includes(1) && arr.length === 1) return "male";
  if (arr.includes(2) && arr.length === 1) return "female";
  return "all";
}

// ── Skeleton ──────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-5 w-14 bg-gray-700 rounded" />
        <div className="h-5 w-16 bg-gray-700 rounded-full" />
        <div className="h-5 w-12 bg-gray-700 rounded" />
        <div className="h-5 w-64 bg-gray-700 rounded" />
      </div>
      <div className="flex gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-14 bg-gray-700/60 rounded" />
            <div className="h-4 w-20 bg-gray-700/40 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function CampaignsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<"campaign" | "adsets" | "ads">("campaign");
  const [editData, setEditData] = useState<Record<string, EditFields>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  // Ad Sets state
  const [adSets, setAdSets] = useState<Record<string, AdSetData[]>>({});
  const [adSetsLoading, setAdSetsLoading] = useState<string | null>(null);
  const [adSetEdits, setAdSetEdits] = useState<Record<string, AdSetEditFields>>({});
  const [adSetSaving, setAdSetSaving] = useState<string | null>(null);
  const [adSetSaveMsg, setAdSetSaveMsg] = useState<Record<string, { ok: boolean; text: string }>>({});

  // Ads state
  const [ads, setAds] = useState<Record<string, AdData[]>>({});
  const [adsLoading, setAdsLoading] = useState<string | null>(null);
  const [adEdits, setAdEdits] = useState<Record<string, AdEditFields>>({});
  const [adSaving, setAdSaving] = useState<string | null>(null);
  const [adSaveMsg, setAdSaveMsg] = useState<Record<string, { ok: boolean; text: string }>>({});

  // Analyze state
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState<string | null>(null);
  const [analyzeResults, setAnalyzeResults] = useState<Record<string, any>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        status: statusFilter,
        search,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/campaigns?${params.toString()}`, {
        headers: { Authorization: AUTH },
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      setData(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  // ── Edit handlers ──
  const toggleEdit = (c: Campaign) => {
    if (editingId === c.id) {
      setEditingId(null);
      setEditTab("campaign");
      return;
    }
    setEditData((prev) => ({
      ...prev,
      [c.id]: {
        name: c.name || "",
        status: c.status || "PAUSED",
        dailyBudget: c.dailyBudget > 0 ? String(c.dailyBudget) : "",
        spendCap: "",
        bidStrategy: "LOWEST_COST_WITHOUT_CAP",
        startTime: "",
        stopTime: "",
      },
    }));
    setEditingId(c.id);
    setEditTab("campaign");
    setSaveMsg(null);
  };

  const updateEditField = (campaignId: string, field: keyof EditFields, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [campaignId]: { ...prev[campaignId], [field]: value },
    }));
  };

  const handleSave = async (campaignId: string) => {
    const fields = editData[campaignId];
    if (!fields) return;

    setSaving(true);
    setSaveMsg(null);
    try {
      const body: Record<string, unknown> = {};
      if (fields.name) body.name = fields.name;
      if (fields.status) body.status = fields.status;
      if (fields.dailyBudget) body.dailyBudget = parseFloat(fields.dailyBudget);
      if (fields.spendCap) body.spendCap = parseFloat(fields.spendCap);
      if (fields.bidStrategy) body.bidStrategy = fields.bidStrategy;
      if (fields.startTime) body.startTime = new Date(fields.startTime).toISOString();
      if (fields.stopTime) body.stopTime = new Date(fields.stopTime).toISOString();

      const res = await fetch(`/api/campaigns/${campaignId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: AUTH },
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (result.success) {
        setSaveMsg({ id: campaignId, ok: true, text: "Saved! Refreshing..." });
        setTimeout(() => {
          setSaveMsg(null);
          fetchData();
        }, 1200);
      } else {
        setSaveMsg({ id: campaignId, ok: false, text: result.error || "Failed to save" });
      }
    } catch (err: unknown) {
      setSaveMsg({ id: campaignId, ok: false, text: err instanceof Error ? err.message : "Network error" });
    } finally {
      setSaving(false);
    }
  };

  // ── Ad Sets handlers ──
  const loadAdSets = async (campaignId: string) => {
    if (adSets[campaignId]) return; // already loaded
    setAdSetsLoading(campaignId);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/adsets`, {
        headers: { Authorization: AUTH },
      });
      const data = await res.json();
      const items: AdSetData[] = data.adsets || [];
      setAdSets((prev) => ({ ...prev, [campaignId]: items }));
      // Pre-fill edit state for each ad set
      const newEdits: Record<string, AdSetEditFields> = {};
      for (const as of items) {
        newEdits[as.id] = adSetToEditFields(as);
      }
      setAdSetEdits((prev) => ({ ...prev, ...newEdits }));
    } catch (err) {
      console.error("Failed to load ad sets:", err);
    } finally {
      setAdSetsLoading(null);
    }
  };

  function adSetToEditFields(as: AdSetData): AdSetEditFields {
    const t = as.targeting || {};
    return {
      name: as.name || "",
      status: as.status || "PAUSED",
      dailyBudget: as.dailyBudget ? String(as.dailyBudget) : "",
      lifetimeBudget: as.lifetimeBudget ? String(as.lifetimeBudget) : "",
      optimizationGoal: as.optimizationGoal || "LINK_CLICKS",
      bidStrategy: as.bidStrategy || "LOWEST_COST_WITHOUT_CAP",
      bidAmount: as.bidAmount ? String(as.bidAmount) : "",
      ageMin: String(t.age_min || 18),
      ageMax: String(t.age_max || 65),
      gender: genderFromArray(t.genders),
      geoLocations: t.geo_locations || { countries: ["IN"] },
      platforms: t.publisher_platforms || ["instagram", "facebook"],
      igPlacements: t.instagram_positions || [],
      fbPlacements: t.facebook_positions || [],
      devices: t.device_platforms || ["mobile", "desktop"],
      startTime: toDateInput(as.startTime),
      endTime: toDateInput(as.endTime),
      customAudiences: t.custom_audiences || [],
      excludedCustomAudiences: t.excluded_custom_audiences || [],
    };
  }

  const updateAdSetField = (adsetId: string, field: keyof AdSetEditFields, value: any) => {
    setAdSetEdits((prev) => ({
      ...prev,
      [adsetId]: { ...prev[adsetId], [field]: value },
    }));
  };

  const toggleArrayItem = (adsetId: string, field: "platforms" | "igPlacements" | "fbPlacements" | "devices", value: string) => {
    setAdSetEdits((prev) => {
      const current = prev[adsetId]?.[field] || [];
      const next = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      return { ...prev, [adsetId]: { ...prev[adsetId], [field]: next } };
    });
  };

  const saveAdSet = async (adsetId: string) => {
    const edits = adSetEdits[adsetId];
    if (!edits) return;

    setAdSetSaving(adsetId);
    setAdSetSaveMsg((prev) => {
      const next = { ...prev };
      delete next[adsetId];
      return next;
    });

    try {
      const targeting: any = {
        age_min: Number(edits.ageMin) || 18,
        age_max: Number(edits.ageMax) || 65,
        genders: edits.gender === "male" ? [1] : edits.gender === "female" ? [2] : [],
        publisher_platforms: edits.platforms,
        instagram_positions: edits.igPlacements.length > 0 ? edits.igPlacements : undefined,
        facebook_positions: edits.fbPlacements.length > 0 ? edits.fbPlacements : undefined,
        device_platforms: edits.devices,
        geo_locations: edits.geoLocations,
      };
      // Preserve custom audiences
      if (edits.customAudiences.length > 0) {
        targeting.custom_audiences = edits.customAudiences;
      }
      if (edits.excludedCustomAudiences.length > 0) {
        targeting.excluded_custom_audiences = edits.excludedCustomAudiences;
      }
      // Remove undefined keys
      Object.keys(targeting).forEach((k) => targeting[k] === undefined && delete targeting[k]);

      const body: any = {
        name: edits.name,
        status: edits.status,
        optimizationGoal: edits.optimizationGoal,
        bidStrategy: edits.bidStrategy,
        targeting,
      };
      if (edits.dailyBudget) body.dailyBudget = edits.dailyBudget;
      if (edits.lifetimeBudget) body.lifetimeBudget = edits.lifetimeBudget;
      if (edits.bidAmount && (edits.bidStrategy === "COST_CAP" || edits.bidStrategy === "LOWEST_COST_WITH_BID_CAP")) {
        body.bidAmount = edits.bidAmount;
      }
      if (edits.startTime) body.startTime = new Date(edits.startTime).toISOString();
      if (edits.endTime) body.endTime = new Date(edits.endTime).toISOString();

      const res = await fetch(`/api/adsets/${adsetId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: AUTH },
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (result.success) {
        setAdSetSaveMsg((prev) => ({ ...prev, [adsetId]: { ok: true, text: "Saved!" } }));
      } else {
        setAdSetSaveMsg((prev) => ({ ...prev, [adsetId]: { ok: false, text: result.error || "Failed" } }));
      }
    } catch (err: any) {
      setAdSetSaveMsg((prev) => ({ ...prev, [adsetId]: { ok: false, text: err.message || "Network error" } }));
    } finally {
      setAdSetSaving(null);
    }
  };

  // ── Ads handlers ──
  const loadAds = async (campaignId: string) => {
    if (ads[campaignId]) return;
    setAdsLoading(campaignId);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/ads`, {
        headers: { Authorization: AUTH },
      });
      const data = await res.json();
      const items: AdData[] = data.ads || [];
      setAds((prev) => ({ ...prev, [campaignId]: items }));
      // Pre-fill edit state
      const newEdits: Record<string, AdEditFields> = {};
      for (const ad of items) {
        newEdits[ad.id] = { name: ad.name || "", status: ad.status || "PAUSED" };
      }
      setAdEdits((prev) => ({ ...prev, ...newEdits }));
    } catch (err) {
      console.error("Failed to load ads:", err);
    } finally {
      setAdsLoading(null);
    }
  };

  const saveAd = async (adId: string) => {
    const edits = adEdits[adId];
    if (!edits) return;

    setAdSaving(adId);
    setAdSaveMsg((prev) => {
      const next = { ...prev };
      delete next[adId];
      return next;
    });

    try {
      const res = await fetch(`/api/ads/${adId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: AUTH },
        body: JSON.stringify({ name: edits.name, status: edits.status }),
      });
      const result = await res.json();

      if (result.success) {
        setAdSaveMsg((prev) => ({ ...prev, [adId]: { ok: true, text: "Saved!" } }));
      } else {
        setAdSaveMsg((prev) => ({ ...prev, [adId]: { ok: false, text: result.error || "Failed" } }));
      }
    } catch (err: any) {
      setAdSaveMsg((prev) => ({ ...prev, [adId]: { ok: false, text: err.message || "Network error" } }));
    } finally {
      setAdSaving(null);
    }
  };

  // ── Tab click ──
  const handleTabClick = (tab: "campaign" | "adsets" | "ads", campaignId: string) => {
    setEditTab(tab);
    if (tab === "adsets") loadAdSets(campaignId);
    if (tab === "ads") loadAds(campaignId);
  };

  // ── Analyze handler ──
  const handleAnalyze = async (c: Campaign) => {
    if (analyzingId === c.id) {
      setAnalyzingId(null);
      return;
    }
    setAnalyzingId(c.id);
    if (analyzeResults[c.id]) return;

    setAnalyzeLoading(c.id);
    try {
      const res = await fetch(`/api/campaigns/${c.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: AUTH },
        body: JSON.stringify({
          name: c.name,
          status: c.status,
          spend: safe(c.metrics?.spend),
          roas: safe(c.metrics?.roas),
          cpa: safe(c.metrics?.cpa),
          ctr: safe(c.metrics?.ctr),
          conversions: safe(c.metrics?.conversions),
          conversionValue: safe(c.metrics?.conversionValue),
          impressions: safe(c.metrics?.impressions),
          clicks: safe(c.metrics?.clicks),
          dailyBudget: c.dailyBudget || 0,
        }),
      });
      const result = await res.json();
      setAnalyzeResults((prev) => ({ ...prev, [c.id]: result }));
    } catch {
      setAnalyzeResults((prev) => ({ ...prev, [c.id]: ["Failed to analyze. Try again."] }));
    } finally {
      setAnalyzeLoading(null);
    }
  };

  const stats = data?.stats;
  const campaigns = data?.campaigns || [];

  return (
    <div className="min-h-screen bg-[#0B1120] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 mb-1">Campaigns</h1>
          <p className="text-sm text-gray-400">
            {stats ? `${stats.total} campaigns from Meta Ads (live)` : "Loading..."}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-sm text-gray-300 hover:text-gray-100 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total Campaigns", value: fmtNum(stats.total) },
            { label: "Meta", value: fmtNum(stats.meta), accent: "text-blue-400" },
            { label: "Google", value: fmtNum(stats.google), accent: "text-emerald-400" },
            { label: "Active", value: fmtNum(stats.active), accent: "text-green-400" },
            { label: "Total Spend", value: fmtINR(safe(stats.totalSpend)), accent: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.accent || "text-gray-100"}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-1">
          {[
            { key: "all", label: "All" },
            { key: "ACTIVE", label: "Active" },
            { key: "PAUSED", label: "Paused" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => { setStatusFilter(s.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s.key
                  ? "bg-gray-700 text-gray-100"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        {/* Sort buttons */}
        <div className="flex gap-1.5 ml-auto">
          {([
            { label: "Spend", col: "spend" as SortKey },
            { label: "ROAS", col: "roas" as SortKey },
            { label: "Conv", col: "conversions" as SortKey },
            { label: "CPA", col: "cpa" as SortKey },
          ]).map(({ label, col }) => (
            <button
              key={col}
              onClick={() => handleSort(col)}
              className={`text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border ${
                sortBy === col
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border-gray-700/50"
              }`}
            >
              {label}
              {sortBy === col ? (
                sortDir === "desc" ? <ArrowDown size={10} /> : <ArrowUp size={10} />
              ) : (
                <ArrowUpDown size={10} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Count line */}
      {stats && (
        <p className="text-[11px] text-gray-500 mb-4">
          Showing {campaigns.length > 0 ? ((page - 1) * 50) + 1 : 0}--{Math.min(page * 50, stats.total)} of {stats.total}
        </p>
      )}

      {/* Campaign list */}
      {loading && !data ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error && !data ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle size={40} className="text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-100 mb-2">Failed to load campaigns</h2>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Retry
          </button>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search size={40} className="text-gray-600 mb-4" />
          <h2 className="text-lg font-semibold text-gray-100 mb-2">No campaigns found</h2>
          <p className="text-sm text-gray-400">Try adjusting your filters or search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const ed = editData[c.id];
            const campaignAdSets = adSets[c.id] || [];
            const campaignAds = ads[c.id] || [];
            return (
            <div
              key={c.id}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/60 transition-colors"
            >
              {/* Row 1: Badges + campaign name */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                    c.platform === "META"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {c.platform}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                    c.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {c.status === "ACTIVE" ? <Play size={8} /> : <Pause size={8} />}
                  {c.status}
                </span>
                {c.campaignType && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-700/60 text-gray-300 font-medium">
                    {c.campaignType.replace(/_/g, " ")}
                  </span>
                )}
                <span className="text-sm font-semibold text-gray-100 ml-1 break-all leading-snug">
                  {c.name || "--"}
                </span>
              </div>

              {/* Row 2: Metrics */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { label: "Spend", value: safe(c.metrics?.spend) > 0 ? fmtINR(safe(c.metrics.spend)) : "--" },
                  {
                    label: "ROAS",
                    value: safe(c.metrics?.roas) > 0 ? safe(c.metrics.roas).toFixed(1) + "x" : "--",
                    accent:
                      safe(c.metrics?.roas) >= 3
                        ? "text-green-400"
                        : safe(c.metrics?.roas) >= 1
                        ? "text-amber-400"
                        : safe(c.metrics?.roas) > 0
                        ? "text-red-400"
                        : "text-gray-500",
                  },
                  { label: "Conversions", value: safe(c.metrics?.conversions) > 0 ? fmtNum(safe(c.metrics.conversions)) : "--" },
                  { label: "CPA", value: safe(c.metrics?.cpa) > 0 ? fmtINR(safe(c.metrics.cpa)) : "--" },
                  { label: "CTR", value: safe(c.metrics?.ctr) > 0 ? safe(c.metrics.ctr).toFixed(2) + "%" : "--" },
                  { label: "Impressions", value: safe(c.metrics?.impressions) > 0 ? fmtNum(safe(c.metrics.impressions)) : "--" },
                ].map((m) => (
                  <div key={m.label}>
                    <p className="text-xs text-gray-400">{m.label}</p>
                    <p className={`font-mono text-sm text-gray-200 ${m.accent || ""}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Row 3: Action buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700/30">
                <button
                  onClick={() => toggleEdit(c)}
                  className={`text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
                    editingId === c.id
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                  }`}
                >
                  <Pencil size={11} />
                  Edit
                </button>
                <button
                  onClick={() => handleAnalyze(c)}
                  className={`text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
                    analyzingId === c.id
                      ? "bg-purple-500/30 text-purple-300 border border-purple-500/30"
                      : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  }`}
                >
                  <Brain size={11} />
                  AI Analyze
                </button>
                <a
                  href={`https://www.facebook.com/adsmanager/manage/campaigns?act=${ACCOUNT_ID}&campaign_ids=${c.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 flex items-center gap-1.5 ml-auto transition-colors"
                >
                  Open in Meta
                  <ExternalLink size={10} />
                </a>
              </div>

              {/* ═══ EDIT PANEL — 3-Tab Editor ═══ */}
              {editingId === c.id && ed && (
                <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-4 mt-3">
                  {/* Tab Bar */}
                  <div className="flex gap-1 mb-4">
                    {([
                      { key: "campaign" as const, label: "Campaign" },
                      { key: "adsets" as const, label: `Ad Sets${campaignAdSets.length > 0 ? ` (${campaignAdSets.length})` : ""}` },
                      { key: "ads" as const, label: `Ads${campaignAds.length > 0 ? ` (${campaignAds.length})` : ""}` },
                    ]).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => handleTabClick(tab.key, c.id)}
                        className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                          editTab === tab.key
                            ? "bg-gray-700 text-gray-100"
                            : "text-gray-400 hover:text-gray-300"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* ═══ Campaign Tab ═══ */}
                  {editTab === "campaign" && (
                    <>
                      {/* Campaign Name — full width */}
                      <div className="mb-4">
                        <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Campaign Name</label>
                        <input
                          type="text"
                          value={ed.name}
                          onChange={(e) => updateEditField(c.id, "name", e.target.value)}
                          className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>

                      {/* 2-column grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Status */}
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Status</label>
                          <div className="flex items-center gap-1 bg-gray-900/50 rounded-lg p-0.5">
                            <button
                              onClick={() => updateEditField(c.id, "status", "ACTIVE")}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                                ed.status === "ACTIVE"
                                  ? "bg-green-500/20 text-green-400"
                                  : "text-gray-500 hover:text-gray-300"
                              }`}
                            >
                              <Play size={9} /> Active
                            </button>
                            <button
                              onClick={() => updateEditField(c.id, "status", "PAUSED")}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                                ed.status === "PAUSED"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "text-gray-500 hover:text-gray-300"
                              }`}
                            >
                              <Pause size={9} /> Paused
                            </button>
                          </div>
                        </div>

                        {/* Bid Strategy */}
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Bid Strategy</label>
                          <select
                            value={ed.bidStrategy}
                            onChange={(e) => updateEditField(c.id, "bidStrategy", e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                          >
                            {BID_STRATEGIES.map((bs) => (
                              <option key={bs.value} value={bs.value}>{bs.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Daily Budget */}
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Daily Budget (INR)</label>
                          <input
                            type="number"
                            value={ed.dailyBudget}
                            onChange={(e) => updateEditField(c.id, "dailyBudget", e.target.value)}
                            placeholder="e.g. 50000"
                            className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>

                        {/* Spend Cap */}
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Spend Cap (INR)</label>
                          <input
                            type="number"
                            value={ed.spendCap}
                            onChange={(e) => updateEditField(c.id, "spendCap", e.target.value)}
                            placeholder="0 = no cap"
                            className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>

                        {/* Start Date */}
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Start Date</label>
                          <input
                            type="date"
                            value={ed.startTime}
                            onChange={(e) => updateEditField(c.id, "startTime", e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>

                        {/* End Date */}
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">End Date</label>
                          <input
                            type="date"
                            value={ed.stopTime}
                            onChange={(e) => updateEditField(c.id, "stopTime", e.target.value)}
                            placeholder="Leave empty for no end date"
                            className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-700/20">
                        <button
                          onClick={() => handleSave(c.id)}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                          Save Campaign
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditTab("campaign"); setSaveMsg(null); }}
                          className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5"
                        >
                          <X size={11} />
                          Cancel
                        </button>

                        {saveMsg && saveMsg.id === c.id && (
                          <span className={`text-xs ml-2 ${saveMsg.ok ? "text-green-400" : "text-red-400"}`}>
                            {saveMsg.text}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {/* ═══ Ad Sets Tab ═══ */}
                  {editTab === "adsets" && (
                    <div>
                      {adSetsLoading === c.id ? (
                        <div className="flex items-center gap-2 py-8 justify-center">
                          <Loader2 size={16} className="animate-spin text-blue-400" />
                          <span className="text-xs text-gray-400">Loading ad sets...</span>
                        </div>
                      ) : campaignAdSets.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-8">No ad sets found for this campaign.</p>
                      ) : (
                        <div className="space-y-3">
                          {campaignAdSets.map((as) => {
                            const ase = adSetEdits[as.id];
                            if (!ase) return null;
                            const showBidAmount = ase.bidStrategy === "COST_CAP" || ase.bidStrategy === "LOWEST_COST_WITH_BID_CAP";
                            return (
                              <div key={as.id} className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-4">
                                {/* Ad Set Header */}
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs font-semibold text-gray-200 break-all">{as.name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                    as.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                                  }`}>
                                    {as.status}
                                  </span>
                                </div>

                                {/* Status */}
                                <div className="mb-3">
                                  <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Status</label>
                                  <div className="flex items-center gap-1 bg-gray-900/50 rounded-lg p-0.5 w-fit">
                                    <button
                                      onClick={() => updateAdSetField(as.id, "status", "ACTIVE")}
                                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                                        ase.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "text-gray-500 hover:text-gray-300"
                                      }`}
                                    >
                                      <Play size={9} /> Active
                                    </button>
                                    <button
                                      onClick={() => updateAdSetField(as.id, "status", "PAUSED")}
                                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                                        ase.status === "PAUSED" ? "bg-amber-500/20 text-amber-400" : "text-gray-500 hover:text-gray-300"
                                      }`}
                                    >
                                      <Pause size={9} /> Paused
                                    </button>
                                  </div>
                                </div>

                                {/* Budget row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Daily Budget (INR)</label>
                                    <input
                                      type="number"
                                      value={ase.dailyBudget}
                                      onChange={(e) => updateAdSetField(as.id, "dailyBudget", e.target.value)}
                                      placeholder="--"
                                      className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Lifetime Budget (INR)</label>
                                    <input
                                      type="number"
                                      value={ase.lifetimeBudget}
                                      onChange={(e) => updateAdSetField(as.id, "lifetimeBudget", e.target.value)}
                                      placeholder="--"
                                      className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                  </div>
                                </div>

                                {/* Optimization + Bid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Optimization Goal</label>
                                    <select
                                      value={ase.optimizationGoal}
                                      onChange={(e) => updateAdSetField(as.id, "optimizationGoal", e.target.value)}
                                      className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                      {OPTIMIZATION_GOALS.map((og) => (
                                        <option key={og.value} value={og.value}>{og.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Bid Strategy</label>
                                    <select
                                      value={ase.bidStrategy}
                                      onChange={(e) => updateAdSetField(as.id, "bidStrategy", e.target.value)}
                                      className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                      {BID_STRATEGIES.map((bs) => (
                                        <option key={bs.value} value={bs.value}>{bs.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Bid Amount — conditional */}
                                {showBidAmount && (
                                  <div className="mb-3">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Bid Amount (INR)</label>
                                    <input
                                      type="number"
                                      value={ase.bidAmount}
                                      onChange={(e) => updateAdSetField(as.id, "bidAmount", e.target.value)}
                                      placeholder="e.g. 50"
                                      className="w-48 bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                  </div>
                                )}

                                {/* ── TARGETING ── */}
                                <div className="border-t border-gray-700/30 pt-3 mt-3">
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2">Targeting</p>

                                  {/* Age + Gender */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                    <div>
                                      <label className="text-[10px] text-gray-500 mb-1 block">Age Min</label>
                                      <input
                                        type="number"
                                        value={ase.ageMin}
                                        onChange={(e) => updateAdSetField(as.id, "ageMin", e.target.value)}
                                        min="13" max="65"
                                        className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-gray-500 mb-1 block">Age Max</label>
                                      <input
                                        type="number"
                                        value={ase.ageMax}
                                        onChange={(e) => updateAdSetField(as.id, "ageMax", e.target.value)}
                                        min="13" max="65"
                                        className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-gray-500 mb-1 block">Gender</label>
                                      <select
                                        value={ase.gender}
                                        onChange={(e) => updateAdSetField(as.id, "gender", e.target.value)}
                                        className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                      >
                                        <option value="all">All</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Location (read-only) */}
                                  <div className="mb-3">
                                    <label className="text-[10px] text-gray-500 mb-1 block">Location</label>
                                    <div className="bg-gray-900/30 border border-gray-700/30 rounded px-3 py-1.5 text-sm text-gray-400">
                                      {ase.geoLocations?.countries?.join(", ") || ase.geoLocations?.cities?.map((c: any) => c.name).join(", ") || "Not set"}
                                      <span className="text-[10px] text-gray-600 ml-2">(read-only)</span>
                                    </div>
                                  </div>

                                  {/* Platforms */}
                                  <div className="mb-3">
                                    <label className="text-[10px] text-gray-500 mb-1 block">Platforms</label>
                                    <div className="flex flex-wrap gap-3">
                                      {PLATFORM_OPTIONS.map((p) => (
                                        <label key={p.value} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={ase.platforms.includes(p.value)}
                                            onChange={() => toggleArrayItem(as.id, "platforms", p.value)}
                                            className="accent-blue-500"
                                          />
                                          {p.label}
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  {/* IG Placements */}
                                  {ase.platforms.includes("instagram") && (
                                    <div className="mb-3">
                                      <label className="text-[10px] text-gray-500 mb-1 block">Instagram Placements</label>
                                      <div className="flex flex-wrap gap-3">
                                        {IG_PLACEMENTS.map((p) => (
                                          <label key={p.value} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={ase.igPlacements.includes(p.value)}
                                              onChange={() => toggleArrayItem(as.id, "igPlacements", p.value)}
                                              className="accent-blue-500"
                                            />
                                            {p.label}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* FB Placements */}
                                  {ase.platforms.includes("facebook") && (
                                    <div className="mb-3">
                                      <label className="text-[10px] text-gray-500 mb-1 block">Facebook Placements</label>
                                      <div className="flex flex-wrap gap-3">
                                        {FB_PLACEMENTS.map((p) => (
                                          <label key={p.value} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={ase.fbPlacements.includes(p.value)}
                                              onChange={() => toggleArrayItem(as.id, "fbPlacements", p.value)}
                                              className="accent-blue-500"
                                            />
                                            {p.label}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Devices */}
                                  <div className="mb-3">
                                    <label className="text-[10px] text-gray-500 mb-1 block">Devices</label>
                                    <div className="flex flex-wrap gap-3">
                                      {DEVICE_OPTIONS.map((d) => (
                                        <label key={d.value} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={ase.devices.includes(d.value)}
                                            onChange={() => toggleArrayItem(as.id, "devices", d.value)}
                                            className="accent-blue-500"
                                          />
                                          {d.label}
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Custom Audiences (read-only) */}
                                  {(ase.customAudiences.length > 0 || ase.excludedCustomAudiences.length > 0) && (
                                    <div className="mb-3">
                                      {ase.customAudiences.length > 0 && (
                                        <div className="mb-1">
                                          <label className="text-[10px] text-gray-500 mb-1 block">Custom Audiences</label>
                                          <div className="flex flex-wrap gap-1.5">
                                            {ase.customAudiences.map((ca: any) => (
                                              <span key={ca.id} className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded">
                                                {ca.name || ca.id}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {ase.excludedCustomAudiences.length > 0 && (
                                        <div>
                                          <label className="text-[10px] text-gray-500 mb-1 block">Excluded Audiences</label>
                                          <div className="flex flex-wrap gap-1.5">
                                            {ase.excludedCustomAudiences.map((ca: any) => (
                                              <span key={ca.id} className="text-[10px] bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded">
                                                {ca.name || ca.id}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Schedule */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                  <div>
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Start Date</label>
                                    <input
                                      type="date"
                                      value={ase.startTime}
                                      onChange={(e) => updateAdSetField(as.id, "startTime", e.target.value)}
                                      className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">End Date</label>
                                    <input
                                      type="date"
                                      value={ase.endTime}
                                      onChange={(e) => updateAdSetField(as.id, "endTime", e.target.value)}
                                      className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                  </div>
                                </div>

                                {/* Save Ad Set */}
                                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-700/20">
                                  <button
                                    onClick={() => saveAdSet(as.id)}
                                    disabled={adSetSaving === as.id}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                  >
                                    {adSetSaving === as.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                    Save Ad Set
                                  </button>
                                  {adSetSaveMsg[as.id] && (
                                    <span className={`text-xs ${adSetSaveMsg[as.id].ok ? "text-green-400" : "text-red-400"}`}>
                                      {adSetSaveMsg[as.id].text}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ═══ Ads Tab ═══ */}
                  {editTab === "ads" && (
                    <div>
                      {adsLoading === c.id ? (
                        <div className="flex items-center gap-2 py-8 justify-center">
                          <Loader2 size={16} className="animate-spin text-blue-400" />
                          <span className="text-xs text-gray-400">Loading ads...</span>
                        </div>
                      ) : campaignAds.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-8">No ads found for this campaign.</p>
                      ) : (
                        <div className="space-y-3">
                          {campaignAds.map((ad) => {
                            const ae = adEdits[ad.id];
                            if (!ae) return null;
                            return (
                              <div key={ad.id} className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-4">
                                {/* Ad Header */}
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs font-semibold text-gray-200 break-all">{ad.name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                    ad.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                                  }`}>
                                    {ad.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                  {/* Status */}
                                  <div>
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Status</label>
                                    <div className="flex items-center gap-1 bg-gray-900/50 rounded-lg p-0.5 w-fit">
                                      <button
                                        onClick={() => setAdEdits((prev) => ({ ...prev, [ad.id]: { ...prev[ad.id], status: "ACTIVE" } }))}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                                          ae.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "text-gray-500 hover:text-gray-300"
                                        }`}
                                      >
                                        <Play size={9} /> Active
                                      </button>
                                      <button
                                        onClick={() => setAdEdits((prev) => ({ ...prev, [ad.id]: { ...prev[ad.id], status: "PAUSED" } }))}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                                          ae.status === "PAUSED" ? "bg-amber-500/20 text-amber-400" : "text-gray-500 hover:text-gray-300"
                                        }`}
                                      >
                                        <Pause size={9} /> Paused
                                      </button>
                                    </div>
                                  </div>

                                  {/* Name */}
                                  <div>
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1 block">Ad Name</label>
                                    <input
                                      type="text"
                                      value={ae.name}
                                      onChange={(e) => setAdEdits((prev) => ({ ...prev, [ad.id]: { ...prev[ad.id], name: e.target.value } }))}
                                      className="w-full bg-gray-900/50 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                  </div>
                                </div>

                                {/* Creative info */}
                                {ad.creative && (
                                  <div className="bg-gray-900/30 border border-gray-700/20 rounded p-3 mb-3">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2">Creative</p>
                                    <div className="flex gap-3">
                                      {(ad.creative.imageUrl || ad.creative.thumbnailUrl) && (
                                        <div className="w-16 h-16 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                                          <img
                                            src={ad.creative.imageUrl || ad.creative.thumbnailUrl}
                                            alt="Creative"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                          />
                                        </div>
                                      )}
                                      <div className="space-y-1 min-w-0">
                                        {ad.creative.title && (
                                          <p className="text-xs text-gray-300 truncate"><span className="text-gray-500">Title:</span> {ad.creative.title}</p>
                                        )}
                                        {ad.creative.body && (
                                          <p className="text-xs text-gray-300 truncate"><span className="text-gray-500">Body:</span> {ad.creative.body}</p>
                                        )}
                                        {ad.creative.callToAction && (
                                          <p className="text-xs text-gray-300">
                                            <span className="text-gray-500">CTA:</span>{" "}
                                            <span className="bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded text-[10px]">
                                              {ad.creative.callToAction.replace(/_/g, " ")}
                                            </span>
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Save Ad */}
                                <div className="flex items-center gap-3 pt-3 border-t border-gray-700/20">
                                  <button
                                    onClick={() => saveAd(ad.id)}
                                    disabled={adSaving === ad.id}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                  >
                                    {adSaving === ad.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                    Save Ad
                                  </button>
                                  {adSaveMsg[ad.id] && (
                                    <span className={`text-xs ${adSaveMsg[ad.id].ok ? "text-green-400" : "text-red-400"}`}>
                                      {adSaveMsg[ad.id].text}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* AI Analysis Panel */}
              {analyzingId === c.id && (
                <div className="mt-3 p-4 bg-gray-800/30 border border-gray-700/40 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={14} className="text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Deep AI Analysis</span>
                    <button
                      onClick={() => setAnalyzingId(null)}
                      className="ml-auto text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {analyzeLoading === c.id ? (
                    <div className="flex items-center gap-2 py-6">
                      <Loader2 size={16} className="animate-spin text-purple-400" />
                      <div>
                        <span className="text-xs text-gray-300 font-medium">Deep analyzing</span>
                        <span className="text-xs text-purple-400 animate-pulse">...</span>
                        <p className="text-[10px] text-gray-500 mt-0.5">Fetching ad sets, ads, breakdowns, and 7-day trends from Meta API</p>
                      </div>
                    </div>
                  ) : analyzeResults[c.id] ? (
                    <div>
                      <div className="space-y-2.5">
                        {(analyzeResults[c.id].suggestions || []).map((s: any, i: number) => (
                          <div
                            key={i}
                            className={`pl-3 py-2 pr-3 rounded-r-lg text-sm ${
                              s.type === "warning"
                                ? "border-l-2 border-red-500/70 bg-red-500/5"
                                : s.type === "success"
                                ? "border-l-2 border-green-500/70 bg-green-500/5"
                                : s.type === "opportunity"
                                ? "border-l-2 border-purple-500/70 bg-purple-500/5"
                                : "border-l-2 border-blue-500/70 bg-blue-500/5"
                            }`}
                          >
                            <p className="font-semibold text-gray-100 text-sm">{s.icon} {s.title}</p>
                            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{s.detail}</p>
                          </div>
                        ))}
                      </div>
                      {analyzeResults[c.id].meta && (
                        <div className="mt-3 pt-3 border-t border-gray-700/30">
                          <p className="text-[10px] text-gray-500">
                            Analyzed: {analyzeResults[c.id].meta.adSetsCount} ad sets, {analyzeResults[c.id].meta.adsCount} ads, {analyzeResults[c.id].meta.ageSegments} age segments, {analyzeResults[c.id].meta.placementsCount} placements, {analyzeResults[c.id].meta.devicesCount} devices, {analyzeResults[c.id].meta.dailyDays}-day trend
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}

      {/* Pagination */}
      {stats && stats.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
          <p className="text-xs text-gray-500">
            Page {page} of {stats.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                page <= 1
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-400 hover:bg-gray-800/60"
              }`}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            {Array.from({ length: Math.min(7, stats.totalPages) }, (_, i) => {
              let pn: number;
              if (stats.totalPages <= 7) pn = i + 1;
              else if (page <= 4) pn = i + 1;
              else if (page >= stats.totalPages - 3) pn = stats.totalPages - 6 + i;
              else pn = page - 3 + i;
              return (
                <button
                  key={pn}
                  onClick={() => setPage(pn)}
                  className={`w-8 h-8 rounded-lg text-xs transition-colors ${
                    page === pn
                      ? "bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30"
                      : "text-gray-400 hover:bg-gray-800/60"
                  }`}
                >
                  {pn}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(stats.totalPages, p + 1))}
              disabled={page >= stats.totalPages || loading}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                page >= stats.totalPages
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-400 hover:bg-gray-800/60"
              }`}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && data && (
        <div className="fixed bottom-6 right-6 bg-gray-800/90 border border-gray-700/50 rounded-lg px-4 py-2 flex items-center gap-2 shadow-xl z-50">
          <Loader2 size={14} className="animate-spin text-blue-400" />
          <span className="text-xs text-gray-400">Updating...</span>
        </div>
      )}
    </div>
  );
}
