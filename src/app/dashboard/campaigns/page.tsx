"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, Loader2, AlertTriangle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PageHeader } from "@/components/ui/page-header";
import { ToastProvider, showToast } from "@/components/ui/toast";
import { PerformancePulse } from "@/components/campaigns/performance-pulse";
import { FiltersBar, type SortKey, type DateRange } from "@/components/campaigns/filters-bar";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { HealthBoard } from "@/components/campaigns/health-board";
import { CampaignEditPanel, type EditFields, type AdSetData, type AdData, type AdSetEditFields, type AdEditFields } from "@/components/campaigns/campaign-edit-panel";
import { CampaignAnalyzePanel } from "@/components/campaigns/campaign-analyze-panel";
import { type Campaign, computeAggregateStats, classifyCampaigns, getHealthDot } from "@/lib/campaigns/health";
import { safe } from "@/lib/campaigns/formatters";

// ── Types ─────────────────────────────────────────────────────

interface Stats {
  total: number;
  meta: number;
  google: number;
  active: number;
  paused: number;
  totalSpend: number;
  totalPages: number;
  accountName?: string;
  accountId?: string;
}

interface ApiResponse {
  campaigns: Campaign[];
  stats: Stats;
}

interface AccountInfo {
  id: string;
  name: string;
  accountId: string;
  platform: string;
}

// ── Helpers ───────────────────────────────────────────────────

const AUTH = "Basic " + (typeof btoa !== "undefined" ? btoa("admin:luxeai2026") : "");

function toDateInput(isoStr: string): string {
  if (!isoStr) return "";
  try { return new Date(isoStr).toISOString().split("T")[0]; } catch { return ""; }
}

function genderFromArray(arr: number[] | undefined): string {
  if (!arr || arr.length === 0) return "all";
  if (arr.includes(1) && arr.length === 1) return "male";
  if (arr.includes(2) && arr.length === 1) return "female";
  return "all";
}

function adSetToEditFields(as: AdSetData): AdSetEditFields {
  const t = as.targeting || {};
  return {
    name: as.name || "", status: as.status || "PAUSED",
    dailyBudget: as.dailyBudget ? String(as.dailyBudget) : "",
    lifetimeBudget: as.lifetimeBudget ? String(as.lifetimeBudget) : "",
    optimizationGoal: as.optimizationGoal || "LINK_CLICKS",
    bidStrategy: as.bidStrategy || "LOWEST_COST_WITHOUT_CAP",
    bidAmount: as.bidAmount ? String(as.bidAmount) : "",
    ageMin: String(t.age_min || 18), ageMax: String(t.age_max || 65),
    gender: genderFromArray(t.genders),
    geoLocations: t.geo_locations || { countries: ["IN"] },
    platforms: t.publisher_platforms || ["instagram", "facebook"],
    igPlacements: t.instagram_positions || [], fbPlacements: t.facebook_positions || [],
    devices: t.device_platforms || ["mobile", "desktop"],
    startTime: toDateInput(as.startTime), endTime: toDateInput(as.endTime),
    customAudiences: t.custom_audiences || [], excludedCustomAudiences: t.excluded_custom_audiences || [],
  };
}

// ── Mock Data (fallback when API is unreachable) ─────────────

function getMockCampaigns(): ApiResponse {
  const campaigns: Campaign[] = [
    // Needs Attention — ROAS < 1x
    { id: "mock-1", platform: "META", name: "luxe_bau_meta_awareness_broad_apr26", status: "ACTIVE", campaignType: "Awareness", dailyBudget: 25000,
      metrics: { spend: 187500, impressions: 4200000, clicks: 21000, ctr: 0.5, cpc: 8.93, conversions: 12, conversionValue: 48000, roas: 0.26, cpa: 15625 } },
    { id: "mock-2", platform: "META", name: "luxe_retarget_meta_dpa_cart_abandoners", status: "ACTIVE", campaignType: "Retargeting", dailyBudget: 15000,
      metrics: { spend: 105000, impressions: 890000, clicks: 15600, ctr: 1.75, cpc: 6.73, conversions: 18, conversionValue: 86400, roas: 0.82, cpa: 5833 } },
    { id: "mock-3", platform: "META", name: "luxe_prosp_meta_interest_luxury_watches", status: "ACTIVE", campaignType: "Prospecting", dailyBudget: 20000,
      metrics: { spend: 140000, impressions: 2100000, clicks: 25200, ctr: 1.2, cpc: 5.56, conversions: 22, conversionValue: 110000, roas: 0.79, cpa: 6364 } },

    // Top Performers — ROAS >= 3x
    { id: "mock-4", platform: "META", name: "luxe_bau_meta_traffic_android_interest_june25", status: "ACTIVE", campaignType: "Traffic", dailyBudget: 60000,
      metrics: { spend: 1177450, impressions: 134411502, clicks: 2247084, ctr: 1.67, cpc: 0.52, conversions: 7863, conversionValue: 14552699, roas: 6.22, cpa: 149.75 } },
    { id: "mock-5", platform: "META", name: "luxe_asc_meta_advantage_plus_shopping_apr26", status: "ACTIVE", campaignType: "ASC", dailyBudget: 80000,
      metrics: { spend: 560000, impressions: 8900000, clicks: 142400, ctr: 1.6, cpc: 3.93, conversions: 420, conversionValue: 3360000, roas: 6.0, cpa: 1333 } },
    { id: "mock-6", platform: "META", name: "luxe_retarget_meta_dpa_viewers_highvalue", status: "ACTIVE", campaignType: "Retargeting", dailyBudget: 40000,
      metrics: { spend: 280000, impressions: 3200000, clicks: 64000, ctr: 2.0, cpc: 4.38, conversions: 280, conversionValue: 2240000, roas: 8.0, cpa: 1000 } },
    { id: "mock-7", platform: "META", name: "luxe_prosp_meta_lookalike_purchasers_1pct", status: "ACTIVE", campaignType: "Prospecting", dailyBudget: 50000,
      metrics: { spend: 350000, impressions: 5600000, clicks: 89600, ctr: 1.6, cpc: 3.91, conversions: 350, conversionValue: 1750000, roas: 5.0, cpa: 1000 } },
    { id: "mock-8", platform: "META", name: "luxe_bau_meta_conversions_hugo_boss_collection", status: "ACTIVE", campaignType: "Catalog", dailyBudget: 35000,
      metrics: { spend: 245000, impressions: 4200000, clicks: 67200, ctr: 1.6, cpc: 3.65, conversions: 196, conversionValue: 1470000, roas: 6.0, cpa: 1250 } },

    // Monitoring — ROAS 1-3x
    { id: "mock-9", platform: "META", name: "luxe_bau_meta_traffic_ios_interest_june25", status: "ACTIVE", campaignType: "Traffic", dailyBudget: 45000,
      metrics: { spend: 1804765, impressions: 126988264, clicks: 1418618, ctr: 1.12, cpc: 1.27, conversions: 4660, conversionValue: 9888691, roas: 2.74, cpa: 387.29 } },
    { id: "mock-10", platform: "META", name: "luxe_prosp_meta_broad_women_25_45_fashion", status: "ACTIVE", campaignType: "Prospecting", dailyBudget: 30000,
      metrics: { spend: 210000, impressions: 3500000, clicks: 49000, ctr: 1.4, cpc: 4.29, conversions: 84, conversionValue: 420000, roas: 2.0, cpa: 2500 } },
    { id: "mock-11", platform: "META", name: "luxe_bau_meta_reels_coach_summer_collection", status: "ACTIVE", campaignType: "Video", dailyBudget: 20000,
      metrics: { spend: 140000, impressions: 6200000, clicks: 93000, ctr: 1.5, cpc: 1.51, conversions: 56, conversionValue: 252000, roas: 1.8, cpa: 2500 } },
    { id: "mock-12", platform: "META", name: "luxe_prosp_meta_interest_premium_sneakers", status: "ACTIVE", campaignType: "Prospecting", dailyBudget: 25000,
      metrics: { spend: 175000, impressions: 2800000, clicks: 39200, ctr: 1.4, cpc: 4.46, conversions: 70, conversionValue: 280000, roas: 1.6, cpa: 2500 } },
    { id: "mock-13", platform: "META", name: "luxe_bau_meta_feed_michael_kors_bags", status: "ACTIVE", campaignType: "Catalog", dailyBudget: 18000,
      metrics: { spend: 126000, impressions: 1890000, clicks: 26460, ctr: 1.4, cpc: 4.76, conversions: 63, conversionValue: 315000, roas: 2.5, cpa: 2000 } },

    // Paused
    { id: "mock-14", platform: "META", name: "luxe_test_meta_video_views_brand_film_v2", status: "PAUSED", campaignType: "Video", dailyBudget: 10000,
      metrics: { spend: 45000, impressions: 890000, clicks: 4450, ctr: 0.5, cpc: 10.11, conversions: 2, conversionValue: 8000, roas: 0.18, cpa: 22500 } },
    { id: "mock-15", platform: "META", name: "luxe_old_meta_dpa_all_products_march26", status: "PAUSED", campaignType: "DPA", dailyBudget: 35000,
      metrics: { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, conversionValue: 0, roas: 0, cpa: 0 } },
    { id: "mock-16", platform: "META", name: "luxe_seasonal_meta_valentines_gifting", status: "PAUSED", campaignType: "Catalog", dailyBudget: 50000,
      metrics: { spend: 890000, impressions: 12400000, clicks: 186000, ctr: 1.5, cpc: 4.78, conversions: 712, conversionValue: 4272000, roas: 4.8, cpa: 1250 } },
    { id: "mock-17", platform: "META", name: "luxe_test_meta_engagement_ugc_creators", status: "PAUSED", campaignType: "Engagement", dailyBudget: 8000,
      metrics: { spend: 32000, impressions: 640000, clicks: 9600, ctr: 1.5, cpc: 3.33, conversions: 0, conversionValue: 0, roas: 0, cpa: 0 } },
  ];

  const active = campaigns.filter((c) => c.status === "ACTIVE");
  const totalSpend = campaigns.reduce((s, c) => s + c.metrics.spend, 0);

  return {
    campaigns,
    stats: {
      total: campaigns.length,
      meta: campaigns.length,
      google: 0,
      active: active.length,
      paused: campaigns.length - active.length,
      totalSpend,
      totalPages: 1,
      accountName: "AJIO Luxe (Demo)",
      accountId: "202330961584003",
    },
  };
}

// ── Skeleton ──────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-2.5 w-2.5 bg-gray-200 rounded-full" />
        <div className="h-5 w-14 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-64 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-14 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function CampaignsPage() {
  return (
    <ToastProvider>
      <CampaignsContent />
    </ToastProvider>
  );
}

function CampaignsContent() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [platformFilter, setPlatformFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("last_7d");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Account switcher
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("ajio");

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

  // ── Fetch accounts ──
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch("/api/campaigns/accounts", { headers: { Authorization: AUTH }, signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []))
      .catch(() => {})
      .finally(() => clearTimeout(timeout));
  }, []);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const params = new URLSearchParams({
        account: selectedAccount,
        page: String(page),
        limit: "50",
        status: "all",
        search,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/campaigns?${params.toString()}`, {
        headers: { Authorization: AUTH },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      setData(await res.json());
    } catch {
      // Fallback to mock data when API is unreachable
      setData(getMockCampaigns());
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, search, page, sortBy, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Account switcher ──
  const switchAccount = (accountId: string) => {
    if (accountId === selectedAccount) return;
    setSelectedAccount(accountId);
    setData(null);
    setPage(1);
    setEditingId(null);
    setAnalyzingId(null);
    setAdSets({});
    setAds({});
    setAnalyzeResults({});
  };

  // ── Sort ──
  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortBy(key); setSortDir("desc"); }
    setPage(1);
  };

  // ── Computed: health groups + aggregate stats ──
  const campaigns = data?.campaigns || [];
  const stats = data?.stats;

  const filteredCampaigns = useMemo(() => {
    if (platformFilter === "all") return campaigns;
    return campaigns.filter((c) => c.platform === platformFilter);
  }, [campaigns, platformFilter]);

  const aggregateStats = useMemo(() => computeAggregateStats(filteredCampaigns), [filteredCampaigns]);
  const healthGroups = useMemo(() => classifyCampaigns(filteredCampaigns), [filteredCampaigns]);

  const campaignMap = useMemo(() => {
    const m = new Map<string, Campaign>();
    campaigns.forEach((c) => m.set(c.id, c));
    return m;
  }, [campaigns]);

  const currentAccountId = accounts.find((a) => a.id === selectedAccount)?.accountId || stats?.accountId || "";

  // ── Edit handlers ──
  const toggleEdit = (c: Campaign) => {
    if (editingId === c.id) { setEditingId(null); setEditTab("campaign"); return; }
    setEditData((prev) => ({
      ...prev,
      [c.id]: {
        name: c.name || "", status: c.status || "PAUSED",
        dailyBudget: c.dailyBudget > 0 ? String(c.dailyBudget) : "",
        spendCap: "", bidStrategy: "LOWEST_COST_WITHOUT_CAP", startTime: "", stopTime: "",
      },
    }));
    setEditingId(c.id);
    setEditTab("campaign");
    setSaveMsg(null);
  };

  const updateEditField = (field: keyof EditFields, value: string) => {
    if (!editingId) return;
    setEditData((prev) => ({ ...prev, [editingId]: { ...prev[editingId], [field]: value } }));
  };

  const handleSave = async () => {
    if (!editingId) return;
    const fields = editData[editingId];
    if (!fields) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const body: Record<string, unknown> = { account: selectedAccount };
      if (fields.name) body.name = fields.name;
      if (fields.status) body.status = fields.status;
      if (fields.dailyBudget) body.dailyBudget = parseFloat(fields.dailyBudget);
      if (fields.spendCap) body.spendCap = parseFloat(fields.spendCap);
      if (fields.bidStrategy) body.bidStrategy = fields.bidStrategy;
      if (fields.startTime) body.startTime = new Date(fields.startTime).toISOString();
      if (fields.stopTime) body.stopTime = new Date(fields.stopTime).toISOString();
      const res = await fetch(`/api/campaigns/${editingId}/update`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: AUTH },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        showToast({ type: "success", message: "Campaign saved! Refreshing..." });
        setTimeout(() => fetchData(), 1200);
      } else {
        showToast({ type: "error", message: result.error || "Failed to save" });
      }
    } catch (err: unknown) {
      showToast({ type: "error", message: err instanceof Error ? err.message : "Network error" });
    } finally {
      setSaving(false);
    }
  };

  // ── Ad Sets handlers ──
  const loadAdSets = async (campaignId: string) => {
    if (adSets[campaignId]) return;
    setAdSetsLoading(campaignId);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/adsets?account=${selectedAccount}`, { headers: { Authorization: AUTH } });
      const data = await res.json();
      const items: AdSetData[] = data.adsets || [];
      setAdSets((prev) => ({ ...prev, [campaignId]: items }));
      const newEdits: Record<string, AdSetEditFields> = {};
      for (const as of items) newEdits[as.id] = adSetToEditFields(as);
      setAdSetEdits((prev) => ({ ...prev, ...newEdits }));
    } catch (err) { console.error("Failed to load ad sets:", err); }
    finally { setAdSetsLoading(null); }
  };

  const updateAdSetField = (adsetId: string, field: keyof AdSetEditFields, value: any) => {
    setAdSetEdits((prev) => ({ ...prev, [adsetId]: { ...prev[adsetId], [field]: value } }));
  };

  const toggleArrayItem = (adsetId: string, field: "platforms" | "igPlacements" | "fbPlacements" | "devices", value: string) => {
    setAdSetEdits((prev) => {
      const current = prev[adsetId]?.[field] || [];
      const next = current.includes(value) ? current.filter((v: string) => v !== value) : [...current, value];
      return { ...prev, [adsetId]: { ...prev[adsetId], [field]: next } };
    });
  };

  const saveAdSet = async (adsetId: string) => {
    const edits = adSetEdits[adsetId];
    if (!edits) return;
    setAdSetSaving(adsetId);
    setAdSetSaveMsg((prev) => { const n = { ...prev }; delete n[adsetId]; return n; });
    try {
      const targeting: any = {
        age_min: Number(edits.ageMin) || 18, age_max: Number(edits.ageMax) || 65,
        genders: edits.gender === "male" ? [1] : edits.gender === "female" ? [2] : [],
        publisher_platforms: edits.platforms, device_platforms: edits.devices,
        geo_locations: edits.geoLocations,
      };
      if (edits.igPlacements.length > 0) targeting.instagram_positions = edits.igPlacements;
      if (edits.fbPlacements.length > 0) targeting.facebook_positions = edits.fbPlacements;
      if (edits.customAudiences.length > 0) targeting.custom_audiences = edits.customAudiences;
      if (edits.excludedCustomAudiences.length > 0) targeting.excluded_custom_audiences = edits.excludedCustomAudiences;

      const body: any = {
        account: selectedAccount, name: edits.name, status: edits.status,
        optimizationGoal: edits.optimizationGoal, bidStrategy: edits.bidStrategy, targeting,
      };
      if (edits.dailyBudget) body.dailyBudget = edits.dailyBudget;
      if (edits.lifetimeBudget) body.lifetimeBudget = edits.lifetimeBudget;
      if (edits.bidAmount && (edits.bidStrategy === "COST_CAP" || edits.bidStrategy === "LOWEST_COST_WITH_BID_CAP")) body.bidAmount = edits.bidAmount;
      if (edits.startTime) body.startTime = new Date(edits.startTime).toISOString();
      if (edits.endTime) body.endTime = new Date(edits.endTime).toISOString();

      const res = await fetch(`/api/adsets/${adsetId}/update`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: AUTH }, body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        showToast({ type: "success", message: "Ad set saved!" });
        setAdSetSaveMsg((prev) => ({ ...prev, [adsetId]: { ok: true, text: "Saved!" } }));
      } else {
        showToast({ type: "error", message: result.error || "Failed" });
        setAdSetSaveMsg((prev) => ({ ...prev, [adsetId]: { ok: false, text: result.error || "Failed" } }));
      }
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Network error" });
      setAdSetSaveMsg((prev) => ({ ...prev, [adsetId]: { ok: false, text: err.message || "Network error" } }));
    } finally { setAdSetSaving(null); }
  };

  // ── Ads handlers ──
  const loadAds = async (campaignId: string) => {
    if (ads[campaignId]) return;
    setAdsLoading(campaignId);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/ads?account=${selectedAccount}`, { headers: { Authorization: AUTH } });
      const data = await res.json();
      const items: AdData[] = data.ads || [];
      setAds((prev) => ({ ...prev, [campaignId]: items }));
      const newEdits: Record<string, AdEditFields> = {};
      for (const ad of items) newEdits[ad.id] = { name: ad.name || "", status: ad.status || "PAUSED" };
      setAdEdits((prev) => ({ ...prev, ...newEdits }));
    } catch (err) { console.error("Failed to load ads:", err); }
    finally { setAdsLoading(null); }
  };

  const saveAd = async (adId: string) => {
    const edits = adEdits[adId];
    if (!edits) return;
    setAdSaving(adId);
    setAdSaveMsg((prev) => { const n = { ...prev }; delete n[adId]; return n; });
    try {
      const res = await fetch(`/api/ads/${adId}/update`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: AUTH },
        body: JSON.stringify({ account: selectedAccount, name: edits.name, status: edits.status }),
      });
      const result = await res.json();
      if (result.success) {
        showToast({ type: "success", message: "Ad saved!" });
        setAdSaveMsg((prev) => ({ ...prev, [adId]: { ok: true, text: "Saved!" } }));
      } else {
        showToast({ type: "error", message: result.error || "Failed" });
        setAdSaveMsg((prev) => ({ ...prev, [adId]: { ok: false, text: result.error || "Failed" } }));
      }
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Network error" });
      setAdSaveMsg((prev) => ({ ...prev, [adId]: { ok: false, text: err.message || "Network error" } }));
    } finally { setAdSaving(null); }
  };

  // ── Tab click ──
  const handleTabClick = (tab: "campaign" | "adsets" | "ads") => {
    if (!editingId) return;
    setEditTab(tab);
    if (tab === "adsets") loadAdSets(editingId);
    if (tab === "ads") loadAds(editingId);
  };

  // ── Analyze ──
  const toggleAnalyze = async (c: Campaign) => {
    if (analyzingId === c.id) { setAnalyzingId(null); return; }
    setAnalyzingId(c.id);
    if (analyzeResults[c.id]) return;
    setAnalyzeLoading(c.id);
    try {
      const res = await fetch(`/api/campaigns/${c.id}/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: AUTH },
        body: JSON.stringify({
          account: selectedAccount, name: c.name, status: c.status,
          spend: safe(c.metrics?.spend), roas: safe(c.metrics?.roas), cpa: safe(c.metrics?.cpa),
          ctr: safe(c.metrics?.ctr), conversions: safe(c.metrics?.conversions),
          conversionValue: safe(c.metrics?.conversionValue), impressions: safe(c.metrics?.impressions),
          clicks: safe(c.metrics?.clicks), dailyBudget: c.dailyBudget || 0,
        }),
      });
      const result = await res.json();
      setAnalyzeResults((prev) => ({ ...prev, [c.id]: result }));
    } catch {
      setAnalyzeResults((prev) => ({ ...prev, [c.id]: { suggestions: [{ type: "warning", title: "Analysis Failed", detail: "Could not connect to analysis service. Try again.", icon: "⚠️" }] } }));
    } finally { setAnalyzeLoading(null); }
  };

  // ── Render card callback for HealthBoard ──
  const renderCard = (campaignId: string) => {
    const c = campaignMap.get(campaignId);
    if (!c) return null;

    const dot = getHealthDot(c, aggregateStats.avgCPA);
    const ed = editData[c.id];
    const campaignAdSets = adSets[c.id] || [];
    const campaignAds = ads[c.id] || [];

    return (
      <CampaignCard
        campaign={c}
        healthDot={dot}
        currentAccountId={currentAccountId}
        isEditing={editingId === c.id}
        isAnalyzing={analyzingId === c.id}
        onToggleEdit={toggleEdit}
        onToggleAnalyze={toggleAnalyze}
        editPanel={
          editingId === c.id && ed ? (
            <CampaignEditPanel
              campaignId={c.id}
              editTab={editTab}
              onTabChange={handleTabClick}
              editFields={ed}
              onUpdateField={updateEditField}
              onSave={handleSave}
              saving={saving}
              saveMsg={saveMsg && saveMsg.id === c.id ? { ok: saveMsg.ok, text: saveMsg.text } : null}
              onCancel={() => { setEditingId(null); setEditTab("campaign"); }}
              adSets={campaignAdSets}
              adSetsLoading={adSetsLoading === c.id}
              adSetEdits={adSetEdits}
              onUpdateAdSetField={updateAdSetField}
              onToggleArrayItem={toggleArrayItem}
              onSaveAdSet={saveAdSet}
              adSetSaving={adSetSaving}
              adSetSaveMsg={adSetSaveMsg}
              ads={campaignAds}
              adsLoading={adsLoading === c.id}
              adEdits={adEdits}
              onUpdateAdField={(adId, field, value) => setAdEdits((prev) => ({ ...prev, [adId]: { ...prev[adId], [field]: value } }))}
              onSaveAd={saveAd}
              adSaving={adSaving}
              adSaveMsg={adSaveMsg}
            />
          ) : undefined
        }
        analyzePanel={
          analyzingId === c.id ? (
            <CampaignAnalyzePanel
              isLoading={analyzeLoading === c.id}
              results={analyzeResults[c.id] || null}
              onClose={() => setAnalyzingId(null)}
            />
          ) : undefined
        }
      />
    );
  };

  // ── UI ──
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <PageHeader
          title="Campaigns"
          description={
            stats
              ? `${stats.accountName || "Meta Ads"} · ${stats.active} active campaigns · Live data`
              : "Loading..."
          }
          actions={
            <div className="flex items-center gap-3">
              {/* Account switcher */}
              {accounts.length > 1 && (
                <div className="flex items-center gap-1">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => switchAccount(acc.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        selectedAccount === acc.id
                          ? "bg-navy text-white"
                          : "text-muted hover:bg-surface border border-card-border"
                      )}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={fetchData}
                disabled={loading}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Refresh
              </button>
            </div>
          }
        />

        {/* Performance Pulse */}
        {data && <PerformancePulse stats={aggregateStats} />}

        {/* Filters */}
        <FiltersBar
          platformFilter={platformFilter}
          onPlatformChange={(p) => { setPlatformFilter(p); setPage(1); }}
          dateRange={dateRange}
          onDateRangeChange={(r) => { setDateRange(r); setPage(1); }}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />

        {/* Content */}
        {loading && !data ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : error && !data ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle size={40} className="text-brand-red mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to load campaigns</h2>
            <p className="text-sm text-muted mb-4">{error}</p>
            <button onClick={fetchData} className="btn-primary">Retry</button>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={40} className="text-muted mb-4" />
            <h2 className="text-lg font-semibold mb-2">No campaigns found</h2>
            <p className="text-sm text-muted">Try adjusting your filters or search.</p>
          </div>
        ) : (
          <HealthBoard groups={healthGroups} renderCard={renderCard} />
        )}

        {/* Pagination */}
        {stats && stats.totalPages > 1 && (
          <div className="flex items-center justify-between pt-6">
            <p className="text-xs text-muted">Page {page} of {stats.totalPages}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors",
                  page <= 1 ? "text-muted/40 cursor-not-allowed" : "text-muted hover:bg-surface"
                )}
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
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs transition-colors",
                      page === pn ? "bg-navy text-white font-bold" : "text-muted hover:bg-surface"
                    )}
                  >
                    {pn}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(stats.totalPages, p + 1))}
                disabled={page >= stats.totalPages || loading}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors",
                  page >= stats.totalPages ? "text-muted/40 cursor-not-allowed" : "text-muted hover:bg-surface"
                )}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && data && (
          <div className="fixed bottom-6 right-6 glass-card px-4 py-2 flex items-center gap-2 shadow-xl z-50">
            <Loader2 size={14} className="animate-spin text-brand-blue" />
            <span className="text-xs text-muted">Updating...</span>
          </div>
        )}
      </div>
    </div>
  );
}
