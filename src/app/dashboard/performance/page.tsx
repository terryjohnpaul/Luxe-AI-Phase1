"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw, Loader2, AlertTriangle, TrendingUp, TrendingDown,
  DollarSign, Eye, MousePointerClick, ShoppingBag, Target,
  ArrowUpRight, ArrowDownRight, BarChart3, Filter, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Campaign {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  purchases: number;
  addToCarts: number;
  viewContent: number;
  roas: number;
  cpa: number;
}

interface ApiResponse {
  account: string;
  summary: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    purchases: number;
    addToCarts: number;
    viewContent: number;
    initiateCheckout: number;
    roas: number;
    cpa: number;
    period: string;
  };
  campaigns: Campaign[];
  insights: {
    topPerformers: Campaign[];
    worstPerformers: Campaign[];
    highSpendLowReturn: Campaign[];
    lowSpendHighReturn: Campaign[];
    signals: string[];
  };
}

function formatCurrency(value: number): string {
  if (value >= 10000000) return "₹" + (value / 10000000).toFixed(2) + " Cr";
  if (value >= 100000) return "₹" + (value / 100000).toFixed(2) + " L";
  if (value >= 1000) return "₹" + (value / 1000).toFixed(1) + "K";
  return "₹" + value.toFixed(0);
}

function formatNumber(value: number): string {
  if (value >= 10000000) return (value / 10000000).toFixed(1) + " Cr";
  if (value >= 100000) return (value / 100000).toFixed(1) + " L";
  if (value >= 1000) return (value / 1000).toFixed(1) + "K";
  return value.toString();
}

function RoasBadge({ roas }: { roas: number }) {
  return (
    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
      roas >= 15 ? "bg-emerald-100 text-emerald-700" :
      roas >= 5 ? "bg-green-100 text-green-700" :
      roas >= 3 ? "bg-yellow-100 text-yellow-700" :
      roas >= 1 ? "bg-orange-100 text-orange-700" :
      "bg-red-100 text-red-700"
    )}>
      {roas.toFixed(1)}x
    </span>
  );
}

export default function PerformancePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("last_30d");
  const [view, setView] = useState<"overview" | "top" | "worst" | "opportunities">("overview");
  const [platform, setPlatform] = useState<"meta" | "google">("meta");
  const [googleData, setGoogleData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (platform === "meta") {
        const res = await fetch(`/api/ajio-luxe/performance?period=${period}&limit=50`);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const d = await res.json();
        if (d.error) throw new Error(d.error);
        setData(d);
      } else {
        const res = await fetch(`/api/ajio-luxe/google-performance?limit=100`);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const d = await res.json();
        if (d.error) throw new Error(d.error);
        // Normalize Google data to same shape as Meta
        setData({
          account: "AJIO LUXE",
          summary: {
            spend: d.summary.totalSpend,
            impressions: d.summary.totalImpressions,
            clicks: d.summary.totalClicks,
            ctr: d.summary.avgCTR,
            cpc: d.summary.avgCPC,
            purchases: d.summary.totalConversions,
            addToCarts: 0,
            viewContent: 0,
            initiateCheckout: 0,
            roas: d.summary.overallROAS,
            cpa: d.summary.overallCPA,
            period: "All Time",
          },
          campaigns: d.campaigns,
          insights: {
            topPerformers: d.insights.topPerformers,
            worstPerformers: d.insights.worstPerformers,
            highSpendLowReturn: d.insights.highSpendLowReturn,
            lowSpendHighReturn: d.insights.lowSpendHighReturn,
            signals: [
              `${d.summary.totalCampaigns} campaigns analyzed across all time`,
              d.insights.highSpendLowReturn.length > 0 ? `${d.insights.highSpendLowReturn.length} campaigns with high spend but ROAS < 1x` : "",
              d.insights.lowSpendHighReturn.length > 0 ? `${d.insights.lowSpendHighReturn.length} campaigns with ROAS > 10x — scale opportunities` : "",
            ].filter(Boolean),
          },
        });
        setGoogleData(d);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, platform]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-blue mx-auto mb-4" />
          <p className="text-sm text-muted">Fetching Ajio Luxe performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm text-red-600 font-medium mb-2">Failed to load performance data</p>
          <p className="text-xs text-muted mb-4">{error}</p>
          <button onClick={fetchData} className="btn-secondary"><RefreshCw size={14} /> Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, campaigns, insights } = data;

  const displayCampaigns = view === "top" ? insights.topPerformers :
    view === "worst" ? insights.worstPerformers :
    view === "opportunities" ? insights.lowSpendHighReturn :
    campaigns;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ajio Luxe — Ad Performance</h1>
          <p className="text-sm text-muted mt-1">Historical performance from Ajio Luxe Meta Ads account</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-card-border rounded-lg overflow-hidden">
            <button onClick={() => setPlatform("meta")}
              className={cn("text-xs px-3 py-1.5 transition-colors font-medium",
                platform === "meta" ? "bg-blue-600 text-white" : "bg-surface text-muted hover:bg-card-border"
              )}>
              Meta Ads
            </button>
            <button onClick={() => setPlatform("google")}
              className={cn("text-xs px-3 py-1.5 transition-colors font-medium border-l border-card-border",
                platform === "google" ? "bg-green-600 text-white" : "bg-surface text-muted hover:bg-card-border"
              )}>
              Google Ads
            </button>
          </div>
          {platform === "meta" && (
            <div className="flex items-center border border-card-border rounded-lg overflow-hidden">
              {[
                { key: "last_7d", label: "7D" },
                { key: "last_30d", label: "30D" },
                { key: "last_90d", label: "90D" },
                { key: "maximum", label: "All" },
              ].map(p => (
                <button key={p.key} onClick={() => setPeriod(p.key)}
                  className={cn("text-xs px-3 py-1.5 transition-colors",
                    period === p.key ? "bg-brand-blue text-white" : "bg-surface text-muted hover:bg-card-border"
                  )}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
          {platform === "google" && (
            <span className="text-[10px] text-muted bg-surface px-2 py-1 rounded">All Time (10 years)</span>
          )}
          <button onClick={fetchData} className="btn-secondary"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-6 gap-3">
        <div className="stat-card stat-card-purple">
          <p className="text-[10px] text-muted font-medium">Total Spend</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(summary.spend)}</p>
        </div>
        <div className="stat-card stat-card-blue">
          <p className="text-[10px] text-muted font-medium">Impressions</p>
          <p className="text-xl font-bold mt-1">{formatNumber(summary.impressions)}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-[10px] text-muted font-medium">Purchases</p>
          <p className="text-xl font-bold mt-1">{formatNumber(summary.purchases)}</p>
        </div>
        <div className={cn("stat-card", summary.roas >= 5 ? "stat-card-green" : summary.roas >= 3 ? "stat-card-yellow" : "stat-card-red")}>
          <p className="text-[10px] text-muted font-medium">ROAS</p>
          <p className="text-xl font-bold mt-1">{summary.roas.toFixed(1)}x</p>
        </div>
        <div className="stat-card stat-card-orange">
          <p className="text-[10px] text-muted font-medium">CPA (Purchase)</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(summary.cpa)}</p>
        </div>
        <div className="stat-card stat-card-blue">
          <p className="text-[10px] text-muted font-medium">CTR</p>
          <p className="text-xl font-bold mt-1">{summary.ctr.toFixed(2)}%</p>
        </div>
      </div>

      {/* Funnel */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-sm mb-3">Conversion Funnel</h3>
        <div className="flex items-center gap-2">
          {[
            { label: "Impressions", value: summary.impressions, color: "bg-blue-500" },
            { label: "Clicks", value: summary.clicks, color: "bg-indigo-500" },
            { label: "View Content", value: summary.viewContent, color: "bg-purple-500" },
            { label: "Add to Cart", value: summary.addToCarts, color: "bg-pink-500" },
            { label: "Checkout", value: summary.initiateCheckout, color: "bg-orange-500" },
            { label: "Purchase", value: summary.purchases, color: "bg-green-500" },
          ].map((step, i, arr) => {
            const prevValue = i > 0 ? arr[i - 1].value : step.value;
            const convRate = prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : "0";
            return (
              <div key={step.label} className="flex-1 text-center">
                <div className={cn("h-2 rounded-full mb-2", step.color)} style={{ opacity: 1 - (i * 0.12) }} />
                <p className="text-lg font-bold">{formatNumber(step.value)}</p>
                <p className="text-[10px] text-muted">{step.label}</p>
                {i > 0 && <p className="text-[9px] text-muted mt-0.5">{convRate}% conv</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Signals from Ad Data */}
      {insights.signals.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-brand-blue">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><BarChart3 size={14} className="text-brand-blue" /> Signals from Ad Data</h3>
          <ul className="space-y-1">
            {insights.signals.map((signal, i) => (
              <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                <ArrowUpRight size={12} className="text-brand-blue shrink-0 mt-0.5" />
                {signal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-2 items-center">
        {[
          { key: "overview", label: "All Campaigns", icon: BarChart3 },
          { key: "top", label: "Top Performers", icon: TrendingUp },
          { key: "worst", label: "Underperformers", icon: TrendingDown },
          { key: "opportunities", label: "Scale Opportunities", icon: ArrowUpRight },
        ].map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key as any)}
            className={cn("text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1",
              view === tab.key ? "bg-brand-blue text-white" : "bg-surface text-muted hover:bg-card-border"
            )}>
            <tab.icon size={12} /> {tab.label}
            {tab.key !== "overview" && (
              <span className="bg-white/20 px-1.5 rounded-full text-[10px]">
                {tab.key === "top" ? insights.topPerformers.length :
                 tab.key === "worst" ? insights.worstPerformers.length :
                 insights.lowSpendHighReturn.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Campaign Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left bg-surface/50">
              <th className="p-3 font-medium text-muted text-xs">Campaign</th>
              <th className="p-3 font-medium text-muted text-xs text-right">Spend</th>
              <th className="p-3 font-medium text-muted text-xs text-right">Impressions</th>
              <th className="p-3 font-medium text-muted text-xs text-right">Clicks</th>
              <th className="p-3 font-medium text-muted text-xs text-right">CTR</th>
              <th className="p-3 font-medium text-muted text-xs text-right">Purchases</th>
              <th className="p-3 font-medium text-muted text-xs text-right">CPA</th>
              <th className="p-3 font-medium text-muted text-xs text-right">ROAS</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayCampaigns.map((c) => (
              <tr key={c.campaignId} className="hover:bg-surface/30 transition-colors">
                <td className="p-3">
                  <p className="font-medium text-xs truncate max-w-[300px]">{c.campaignName}</p>
                </td>
                <td className="p-3 text-right text-xs">{formatCurrency(c.spend)}</td>
                <td className="p-3 text-right text-xs">{formatNumber(c.impressions)}</td>
                <td className="p-3 text-right text-xs">{formatNumber(c.clicks)}</td>
                <td className="p-3 text-right text-xs">{c.ctr.toFixed(2)}%</td>
                <td className="p-3 text-right text-xs font-medium">{formatNumber(c.purchases)}</td>
                <td className="p-3 text-right text-xs">{c.cpa > 0 ? formatCurrency(c.cpa) : "—"}</td>
                <td className="p-3 text-right"><RoasBadge roas={c.roas} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayCampaigns.length === 0 && (
          <div className="p-8 text-center text-sm text-muted">No campaigns match this filter</div>
        )}
      </div>
    </div>
  );
}
