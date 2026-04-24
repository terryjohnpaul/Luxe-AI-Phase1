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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg.includes("aborted") ? "Request timed out. The API may be unreachable." : msg);
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
