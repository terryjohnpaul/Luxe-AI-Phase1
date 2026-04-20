"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  Play,
  Pause,
  Target,
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Filter,
  Pencil,
  Check,
  X,
  Trash2,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Campaign {
  id: string;
  platform: string;
  name: string;
  status: string;
  objective: string;
  dailyBudget: number;
  bidStrategy: string;
  targeting: string;
  adSets: number;
  createdAt: string;
  updatedAt: string;
  startTime: string;
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    conversionValue: number;
    roas: number;
  };
}

interface ApiResponse {
  campaigns: Campaign[];
  stats: {
    total: number;
    active: number;
    paused: number;
    totalSpend: number;
  };
}

function formatCurrency(value: number): string {
  if (value === 0) return "₹0";
  return "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatNumber(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return (value / 1000).toFixed(1) + "K";
  return value.toString();
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  return days + "d ago";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 w-fit",
      status === "ACTIVE" && "bg-green-100 text-green-700",
      status === "PAUSED" && "bg-yellow-100 text-yellow-700",
      status === "ARCHIVED" && "bg-gray-100 text-gray-500",
      status === "DELETED" && "bg-red-100 text-red-700",
    )}>
      {status === "ACTIVE" && <Play size={8} />}
      {status === "PAUSED" && <Pause size={8} />}
      {status}
    </span>
  );
}

function ObjectiveBadge({ objective }: { objective: string }) {
  const labels: Record<string, string> = {
    "OUTCOME_SALES": "Sales",
    "OUTCOME_TRAFFIC": "Traffic",
    "OUTCOME_AWARENESS": "Awareness",
    "OUTCOME_LEADS": "Leads",
    "OUTCOME_ENGAGEMENT": "Engagement",
  };
  return (
    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
      {labels[objective] || objective}
    </span>
  );
}

export default function CampaignsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [campaignEdit, setCampaignEdit] = useState<any>({});
  const [adSetEdits, setAdSetEdits] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  const startEdit = async (campaign: Campaign) => {
    setEditingId(campaign.id);
    setEditLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`);
      const data = await res.json();
      const c = data.campaign || {};
      setCampaignEdit({
        name: c.name || "",
        status: c.status || "PAUSED",
        daily_budget: c.daily_budget ? parseInt(c.daily_budget) / 100 : 0,
        lifetime_budget: c.lifetime_budget ? parseInt(c.lifetime_budget) / 100 : 0,
        spend_cap: c.spend_cap ? parseInt(c.spend_cap) / 100 : 0,
        bid_strategy: c.bid_strategy || "LOWEST_COST_WITHOUT_CAP",
        start_time: c.start_time ? c.start_time.split("T")[0] : "",
        stop_time: c.stop_time ? c.stop_time.split("T")[0] : "",
        special_ad_categories: c.special_ad_categories || [],
      });
      setAdSetEdits((data.adSets || []).map((as: any) => ({
        id: as.id,
        name: as.name || "",
        status: as.status || "PAUSED",
        daily_budget: as.daily_budget ? parseInt(as.daily_budget) / 100 : 0,
        lifetime_budget: as.lifetime_budget ? parseInt(as.lifetime_budget) / 100 : 0,
        bid_amount: as.bid_amount || 0,
        bid_strategy: as.bid_strategy || "",
        billing_event: as.billing_event || "IMPRESSIONS",
        optimization_goal: as.optimization_goal || "OFFSITE_CONVERSIONS",
        start_time: as.start_time ? as.start_time.split("T")[0] : "",
        end_time: as.end_time ? as.end_time.split("T")[0] : "",
        targeting: as.targeting || {},
        // Flattened targeting for UI
        _countries: as.targeting?.geo_locations?.countries?.join(", ") || "IN",
        _cities: as.targeting?.geo_locations?.cities?.map((c: any) => c.name).join(", ") || "",
        _age_min: as.targeting?.age_min || 18,
        _age_max: as.targeting?.age_max || 65,
        _genders: as.targeting?.genders?.[0] === 1 ? "male" : as.targeting?.genders?.[0] === 2 ? "female" : "all",
        _interests: as.targeting?.flexible_spec?.[0]?.interests?.map((i: any) => i.name).join(", ") || "",
        _platforms: as.targeting?.publisher_platforms?.join(", ") || "facebook, instagram",
      })));
    } catch (err: any) {
      alert("Error loading campaign details: " + err.message);
      setEditingId(null);
    } finally {
      setEditLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCampaignEdit({});
    setAdSetEdits([]);
  };

  const saveEdit = async (campaignId: string) => {
    setUpdating(campaignId);
    try {
      // Build targeting objects from flattened fields
      const adSets = adSetEdits.map(as => {
        const countries = as._countries.split(",").map((c: string) => c.trim().toUpperCase()).filter(Boolean);
        const targeting: any = {
          geo_locations: { countries },
          age_min: as._age_min,
          age_max: as._age_max,
          publisher_platforms: as._platforms.split(",").map((p: string) => p.trim()).filter(Boolean),
        };
        if (as._genders === "male") targeting.genders = [1];
        else if (as._genders === "female") targeting.genders = [2];

        return {
          id: as.id,
          name: as.name,
          status: as.status,
          daily_budget: as.daily_budget,
          lifetime_budget: as.lifetime_budget || undefined,
          bid_amount: as.bid_amount || undefined,
          bid_strategy: as.bid_strategy || undefined,
          billing_event: as.billing_event,
          optimization_goal: as.optimization_goal,
          start_time: as.start_time || undefined,
          end_time: as.end_time || undefined,
          targeting,
        };
      });

      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign: campaignEdit,
          adSets,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert("Error: " + (data.message || data.error));
      } else {
        alert("All changes saved to Facebook!");
        setEditingId(null);
        fetchData();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const toggleStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setUpdating(campaign.id);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        fetchData();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const archiveCampaign = async (campaignId: string) => {
    if (!confirm("Archive this campaign? This will stop it permanently.")) return;
    setUpdating(campaignId);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        fetchData();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParts: string[] = [];
      if (statusFilter !== "all") queryParts.push(`status=${statusFilter}`);
      if (platformFilter !== "all") queryParts.push(`platform=${platformFilter}`);
      const params = queryParts.length > 0 ? "?" + queryParts.join("&") : "";
      const res = await fetch(`/api/campaigns${params}`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const d = await res.json();
      setData(d);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, platformFilter]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-blue mx-auto mb-4" />
          <p className="text-sm text-muted">Fetching campaigns from Meta Ads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm text-red-600 font-medium mb-2">Failed to load campaigns</p>
          <p className="text-xs text-muted mb-4">{error}</p>
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Campaigns</h1>
          <p className="text-sm text-muted mt-1">
            All campaigns from your connected Facebook & Google Ads accounts
          </p>
        </div>
        <button onClick={fetchData} disabled={loading} className="btn-secondary">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card stat-card-blue">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Total Campaigns</p>
              <p className="text-2xl font-bold mt-1">{data.stats.total}</p>
            </div>
            <Target size={18} className="text-muted" />
          </div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Active</p>
              <p className="text-2xl font-bold mt-1">{data.stats.active}</p>
            </div>
            <Play size={18} className="text-muted" />
          </div>
        </div>
        <div className="stat-card stat-card-yellow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Paused / Draft</p>
              <p className="text-2xl font-bold mt-1">{data.stats.paused}</p>
            </div>
            <Pause size={18} className="text-muted" />
          </div>
        </div>
        <div className="stat-card stat-card-purple">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Total Spend</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(data.stats.totalSpend)}</p>
            </div>
            <DollarSign size={18} className="text-muted" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted font-medium">Status:</span>
          {["all", "ACTIVE", "PAUSED"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full transition-colors",
                statusFilter === s
                  ? "bg-brand-blue text-white"
                  : "bg-surface text-muted hover:bg-card-border"
              )}
            >
              {s === "all" ? "All" : s === "ACTIVE" ? "Active" : "Paused / Draft"}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-card-border" />
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted font-medium">Platform:</span>
          {[
            { key: "all", label: "All Platforms" },
            { key: "META", label: "Facebook / Meta" },
            { key: "GOOGLE", label: "Google Ads" },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPlatformFilter(p.key)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full transition-colors",
                platformFilter === p.key
                  ? "bg-brand-blue text-white"
                  : "bg-surface text-muted hover:bg-card-border"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign List */}
      {data.campaigns.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Target size={32} className="text-muted mx-auto mb-4" />
          <p className="text-sm font-medium mb-1">No campaigns found</p>
          <p className="text-xs text-muted">Push signals to draft from the Command Center to create campaigns.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.campaigns.map((campaign) => (
            <div key={campaign.id} className={cn(
              "glass-card p-5",
              campaign.status === "ACTIVE" && "ring-1 ring-green-200",
            )}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{campaign.name}</h3>
                    <StatusBadge status={campaign.status} />
                    <ObjectiveBadge objective={campaign.objective} />
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{campaign.platform}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted mt-1">
                    <span className="flex items-center gap-1"><Calendar size={10} /> Created {timeAgo(campaign.createdAt)}</span>
                    <span className="flex items-center gap-1"><DollarSign size={10} /> {formatCurrency(campaign.dailyBudget)}/day</span>
                    <span className="flex items-center gap-1"><Users size={10} /> {campaign.adSets} ad set{campaign.adSets !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleStatus(campaign)} disabled={updating === campaign.id}
                    className={cn("text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                      campaign.status === "PAUSED" ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    )}>
                    {updating === campaign.id ? <Loader2 size={12} className="animate-spin" /> :
                      campaign.status === "PAUSED" ? <><Play size={12} /> Activate</> : <><Pause size={12} /> Pause</>}
                  </button>
                  <button onClick={() => editingId === campaign.id ? cancelEdit() : startEdit(campaign)}
                    className={cn("text-xs flex items-center gap-1", editingId === campaign.id ? "btn-approve" : "btn-secondary")}>
                    {editingId === campaign.id ? <><X size={12} /> Close</> : <><Pencil size={12} /> Edit</>}
                  </button>
                  <button onClick={() => archiveCampaign(campaign.id)} className="p-1.5 rounded-md hover:bg-red-50 text-muted hover:text-red-500 transition-colors" title="Archive">
                    <Archive size={14} />
                  </button>
                  <a href={`https://business.facebook.com/adsmanager/manage/campaigns?act=1681306899957928&selected_campaign_ids=${campaign.id}`}
                    target="_blank" className="btn-secondary text-xs flex items-center gap-1">
                    <ExternalLink size={12} /> Ads Manager
                  </a>
                </div>
              </div>

              {/* Full Edit Panel */}
              {editingId === campaign.id && (
                <div className="border-t border-card-border mt-3 pt-4">
                  {editLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={24} className="animate-spin text-brand-blue" />
                      <span className="text-sm text-muted ml-2">Loading campaign details from Facebook...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Campaign Settings */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted uppercase mb-3">Campaign Settings</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-medium text-muted block mb-1">Campaign Name</label>
                            <input type="text" value={campaignEdit.name || ""} onChange={(e) => setCampaignEdit((p: any) => ({ ...p, name: e.target.value }))}
                              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted block mb-1">Status</label>
                            <select value={campaignEdit.status || ""} onChange={(e) => setCampaignEdit((p: any) => ({ ...p, status: e.target.value }))}
                              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
                              <option value="ACTIVE">Active</option>
                              <option value="PAUSED">Paused</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted block mb-1">Bid Strategy</label>
                            <select value={campaignEdit.bid_strategy || ""} onChange={(e) => setCampaignEdit((p: any) => ({ ...p, bid_strategy: e.target.value }))}
                              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
                              <option value="LOWEST_COST_WITHOUT_CAP">Lowest Cost</option>
                              <option value="LOWEST_COST_WITH_BID_CAP">Bid Cap</option>
                              <option value="COST_CAP">Cost Cap</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted block mb-1">Daily Budget (INR)</label>
                            <input type="number" value={campaignEdit.daily_budget || ""} onChange={(e) => setCampaignEdit((p: any) => ({ ...p, daily_budget: parseInt(e.target.value) || 0 }))}
                              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted block mb-1">Spend Cap (INR)</label>
                            <input type="number" value={campaignEdit.spend_cap || ""} onChange={(e) => setCampaignEdit((p: any) => ({ ...p, spend_cap: parseInt(e.target.value) || 0 }))}
                              placeholder="No cap" className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted block mb-1">Special Ad Category</label>
                            <select value={campaignEdit.special_ad_categories?.[0] || "NONE"} onChange={(e) => setCampaignEdit((p: any) => ({ ...p, special_ad_categories: e.target.value === "NONE" ? [] : [e.target.value] }))}
                              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
                              <option value="NONE">None</option>
                              <option value="HOUSING">Housing</option>
                              <option value="EMPLOYMENT">Employment</option>
                              <option value="CREDIT">Credit</option>
                              <option value="ISSUES_ELECTIONS_POLITICS">Issues / Elections / Politics</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Ad Set Settings */}
                      {adSetEdits.length === 0 && (
                        <div className="border border-dashed border-card-border rounded-xl p-6 text-center">
                          <p className="text-sm text-muted mb-2">No ad sets found for this campaign</p>
                          <p className="text-xs text-muted mb-4">Ad sets contain targeting, budget, and schedule settings. Create one to complete the campaign setup.</p>
                          <button
                            onClick={async () => {
                              setUpdating(campaign.id);
                              try {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                const adAccountId = "1681306899957928";
                                const token = await fetch("/api/ads/push-draft").then(r => r.json()).then(d => d.meta?.adAccountId || adAccountId);

                                const formData = new URLSearchParams();
                                formData.append("access_token", await fetch(`/api/campaigns/${campaign.id}`).then(r => r.json()).then(() => ""));
                                // Use the API route to create ad set
                                const res = await fetch(`/api/campaigns/${campaign.id}/adset`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ campaignId: campaign.id }),
                                });
                                const data = await res.json();
                                if (data.error) {
                                  alert("Error: " + data.error);
                                } else {
                                  // Reload edit panel
                                  startEdit(campaign);
                                }
                              } catch (err: any) {
                                alert("Error: " + err.message);
                              } finally {
                                setUpdating(null);
                              }
                            }}
                            disabled={updating === campaign.id}
                            className="btn-primary text-xs"
                          >
                            {updating === campaign.id ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />} Create Ad Set with Default Targeting
                          </button>
                        </div>
                      )}
                      {adSetEdits.map((adSet, idx) => (
                        <div key={adSet.id}>
                          <h4 className="text-xs font-semibold text-muted uppercase mb-3">Ad Set: {adSet.name}</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">Ad Set Name</label>
                              <input type="text" value={adSet.name} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], name: e.target.value }; setAdSetEdits(u); }}
                                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">Status</label>
                              <select value={adSet.status} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], status: e.target.value }; setAdSetEdits(u); }}
                                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                <option value="ACTIVE">Active</option>
                                <option value="PAUSED">Paused</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">Daily Budget (INR)</label>
                              <input type="number" value={adSet.daily_budget} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], daily_budget: parseInt(e.target.value) || 0 }; setAdSetEdits(u); }}
                                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">Optimization Goal</label>
                              <select value={adSet.optimization_goal} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], optimization_goal: e.target.value }; setAdSetEdits(u); }}
                                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                <option value="OFFSITE_CONVERSIONS">Conversions</option>
                                <option value="LINK_CLICKS">Link Clicks</option>
                                <option value="IMPRESSIONS">Impressions</option>
                                <option value="REACH">Reach</option>
                                <option value="LANDING_PAGE_VIEWS">Landing Page Views</option>
                                <option value="VALUE">Value</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">Billing Event</label>
                              <select value={adSet.billing_event} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], billing_event: e.target.value }; setAdSetEdits(u); }}
                                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                <option value="IMPRESSIONS">Impressions</option>
                                <option value="LINK_CLICKS">Link Clicks</option>
                                <option value="THRUPLAY">ThruPlay</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">Bid Amount (INR)</label>
                              <input type="number" value={adSet.bid_amount || ""} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], bid_amount: parseInt(e.target.value) || 0 }; setAdSetEdits(u); }}
                                placeholder="Auto" className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">Start Date</label>
                              <input type="date" value={adSet.start_time || ""} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], start_time: e.target.value }; setAdSetEdits(u); }}
                                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">End Date</label>
                              <input type="date" value={adSet.end_time || ""} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], end_time: e.target.value }; setAdSetEdits(u); }}
                                placeholder="No end date" className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            </div>
                          </div>

                          {/* Targeting */}
                          <h4 className="text-xs font-semibold text-muted uppercase mt-4 mb-3">Targeting</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">Countries (comma separated)</label>
                              <input type="text" value={adSet._countries || ""} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], _countries: e.target.value }; setAdSetEdits(u); }}
                                placeholder="IN, US, GB" className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">Age Min</label>
                              <input type="number" min="13" max="65" value={adSet._age_min || 18} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], _age_min: parseInt(e.target.value) }; setAdSetEdits(u); }}
                                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">Age Max</label>
                              <input type="number" min="13" max="65" value={adSet._age_max || 65} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], _age_max: parseInt(e.target.value) }; setAdSetEdits(u); }}
                                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted block mb-1">Gender</label>
                              <select value={adSet._genders || "all"} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], _genders: e.target.value }; setAdSetEdits(u); }}
                                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                <option value="all">All</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-medium text-muted block mb-1">Platforms (comma separated)</label>
                              <input type="text" value={adSet._platforms || ""} onChange={(e) => { const u = [...adSetEdits]; u[idx] = { ...u[idx], _platforms: e.target.value }; setAdSetEdits(u); }}
                                placeholder="facebook, instagram, audience_network" className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Save / Cancel */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-card-border">
                        <button onClick={cancelEdit} className="btn-secondary text-xs flex items-center gap-1">
                          <X size={12} /> Cancel
                        </button>
                        <button onClick={() => saveEdit(campaign.id)} disabled={updating === campaign.id}
                          className="btn-approve flex items-center gap-1">
                          {updating === campaign.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Save All Changes to Facebook
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Targeting */}
              <div className="flex items-center gap-1 mb-3">
                <MapPin size={10} className="text-muted" />
                <span className="text-[10px] text-muted">{campaign.targeting}</span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-7 gap-3">
                <div className="text-center p-2 bg-surface rounded-lg">
                  <p className="text-[10px] text-muted flex items-center justify-center gap-1"><DollarSign size={9} /> Spend</p>
                  <p className="text-sm font-bold mt-0.5">{formatCurrency(campaign.metrics.spend)}</p>
                </div>
                <div className="text-center p-2 bg-surface rounded-lg">
                  <p className="text-[10px] text-muted flex items-center justify-center gap-1"><Eye size={9} /> Impressions</p>
                  <p className="text-sm font-bold mt-0.5">{formatNumber(campaign.metrics.impressions)}</p>
                </div>
                <div className="text-center p-2 bg-surface rounded-lg">
                  <p className="text-[10px] text-muted flex items-center justify-center gap-1"><MousePointerClick size={9} /> Clicks</p>
                  <p className="text-sm font-bold mt-0.5">{formatNumber(campaign.metrics.clicks)}</p>
                </div>
                <div className="text-center p-2 bg-surface rounded-lg">
                  <p className="text-[10px] text-muted">CTR</p>
                  <p className="text-sm font-bold mt-0.5">{campaign.metrics.ctr.toFixed(2)}%</p>
                </div>
                <div className="text-center p-2 bg-surface rounded-lg">
                  <p className="text-[10px] text-muted">CPC</p>
                  <p className="text-sm font-bold mt-0.5">{formatCurrency(campaign.metrics.cpc)}</p>
                </div>
                <div className="text-center p-2 bg-surface rounded-lg">
                  <p className="text-[10px] text-muted">Conversions</p>
                  <p className="text-sm font-bold mt-0.5">{campaign.metrics.conversions}</p>
                </div>
                <div className="text-center p-2 bg-surface rounded-lg">
                  <p className="text-[10px] text-muted flex items-center justify-center gap-1"><TrendingUp size={9} /> ROAS</p>
                  <p className={cn("text-sm font-bold mt-0.5",
                    campaign.metrics.roas >= 3 ? "text-green-600" :
                    campaign.metrics.roas >= 1 ? "text-yellow-600" : "text-muted"
                  )}>{campaign.metrics.roas.toFixed(1)}x</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
