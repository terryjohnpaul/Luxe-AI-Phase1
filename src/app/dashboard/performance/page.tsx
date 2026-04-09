"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  DollarSign,
  Users,
  Target,
  Layers,
  GitBranch,
  Crown,
  Briefcase,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChannelPerformance {
  channel: string;
  platform: string;
  spend: number;
  grossRevenue: number;
  grossRoas: number;
  returns: number;
  netRevenue: number;
  netRoas: number;
  haloRevenue: number;
  trueCpa: number;
}

interface BrandHalo {
  brand: string;
  directRevenue: number;
  haloRevenue: number;
  haloPercent: number;
  topHaloCategories: string[];
}

interface ArchetypePerf {
  name: string;
  icon: React.ElementType;
  color: string;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  conversionRate: number;
  avgOrderValue: number;
  returnRate: number;
}

const channelData: ChannelPerformance[] = [
  { channel: "Meta ASC", platform: "Meta", spend: 820000, grossRevenue: 4100000, grossRoas: 5.0, returns: 492000, netRevenue: 3608000, netRoas: 4.4, haloRevenue: 340000, trueCpa: 3200 },
  { channel: "Meta Retarget", platform: "Meta", spend: 210000, grossRevenue: 2520000, grossRoas: 12.0, returns: 226800, netRevenue: 2293200, netRoas: 10.9, haloRevenue: 180000, trueCpa: 1800 },
  { channel: "Google PMax", platform: "Google", spend: 450000, grossRevenue: 1800000, grossRoas: 4.0, returns: 252000, netRevenue: 1548000, netRoas: 3.4, haloRevenue: 420000, trueCpa: 4100 },
  { channel: "Google Brand", platform: "Google", spend: 180000, grossRevenue: 3420000, grossRoas: 19.0, returns: 136800, netRevenue: 3283200, netRoas: 18.2, haloRevenue: 0, trueCpa: 480 },
  { channel: "Google Demand Gen", platform: "Google", spend: 120000, grossRevenue: 168000, grossRoas: 1.4, returns: 33600, netRevenue: 134400, netRoas: 1.1, haloRevenue: 86000, trueCpa: 8200 },
  { channel: "WhatsApp Commerce", platform: "WhatsApp", spend: 45000, grossRevenue: 580000, grossRoas: 12.9, returns: 29000, netRevenue: 551000, netRoas: 12.2, haloRevenue: 64000, trueCpa: 1200 },
  { channel: "Email / SMS", platform: "Email", spend: 18000, grossRevenue: 420000, grossRoas: 23.3, returns: 37800, netRevenue: 382200, netRoas: 21.2, haloRevenue: 48000, trueCpa: 320 },
];

const brandHaloData: BrandHalo[] = [
  { brand: "Ami Paris", directRevenue: 2400000, haloRevenue: 680000, haloPercent: 28.3, topHaloCategories: ["Bags", "Shoes", "Accessories"] },
  { brand: "Hugo Boss", directRevenue: 3200000, haloRevenue: 420000, haloPercent: 13.1, topHaloCategories: ["Polos", "Chinos", "Belts"] },
  { brand: "Kenzo", directRevenue: 1800000, haloRevenue: 540000, haloPercent: 30.0, topHaloCategories: ["T-Shirts", "Accessories", "Bags"] },
  { brand: "Michael Kors", directRevenue: 2100000, haloRevenue: 280000, haloPercent: 13.3, topHaloCategories: ["Bags", "Wallets", "Watches"] },
  { brand: "Coach", directRevenue: 1600000, haloRevenue: 320000, haloPercent: 20.0, topHaloCategories: ["Bags", "Small Leather", "Shoes"] },
];

const archetypePerf: ArchetypePerf[] = [
  { name: "Fashion Loyalist", icon: Crown, color: "purple", spend: 680000, revenue: 4200000, roas: 6.2, cpa: 2800, conversionRate: 4.8, avgOrderValue: 18400, returnRate: 8 },
  { name: "Urban Achiever", icon: Briefcase, color: "blue", spend: 520000, revenue: 2800000, roas: 5.4, cpa: 3600, conversionRate: 3.2, avgOrderValue: 12600, returnRate: 14 },
  { name: "Splurger", icon: ShoppingBag, color: "orange", spend: 280000, revenue: 1680000, roas: 6.0, cpa: 4200, conversionRate: 2.1, avgOrderValue: 42800, returnRate: 22 },
  { name: "Aspirant", icon: Sparkles, color: "green", spend: 360000, revenue: 1200000, roas: 3.3, cpa: 5400, conversionRate: 1.8, avgOrderValue: 6200, returnRate: 18 },
];

const attributionData = [
  { touchpoint: "Social Discovery (Meta)", weight: 32, avgDaysBeforePurchase: 8 },
  { touchpoint: "Brand Search (Google)", weight: 24, avgDaysBeforePurchase: 2 },
  { touchpoint: "Retarget Ad (Meta)", weight: 18, avgDaysBeforePurchase: 3 },
  { touchpoint: "Email / SMS", weight: 12, avgDaysBeforePurchase: 1 },
  { touchpoint: "WhatsApp Message", weight: 8, avgDaysBeforePurchase: 0 },
  { touchpoint: "Direct / Organic", weight: 6, avgDaysBeforePurchase: 0 },
];

function formatInr(amount: number): string {
  if (amount >= 10000000) return `INR ${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `INR ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `INR ${(amount / 1000).toFixed(1)}K`;
  return `INR ${amount.toLocaleString("en-IN")}`;
}

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<"roas" | "halo" | "archetypes" | "attribution">("roas");

  const totalSpend = channelData.reduce((s, c) => s + c.spend, 0);
  const totalGrossRevenue = channelData.reduce((s, c) => s + c.grossRevenue, 0);
  const totalNetRevenue = channelData.reduce((s, c) => s + c.netRevenue, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Lab</h1>
          <p className="text-sm text-muted mt-1">
            True performance metrics: Net ROAS, brand halo effects, archetype-level analysis, and multi-touch attribution.
          </p>
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>This month</option>
          <option>Last quarter</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="stat-card stat-card-navy">
          <p className="text-xs text-muted font-medium">Total Spend</p>
          <p className="text-2xl font-bold mt-1">{formatInr(totalSpend)}</p>
        </div>
        <div className="stat-card stat-card-blue">
          <p className="text-xs text-muted font-medium">Gross Revenue</p>
          <p className="text-2xl font-bold mt-1">{formatInr(totalGrossRevenue)}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-xs text-muted font-medium">Net Revenue</p>
          <p className="text-2xl font-bold mt-1">{formatInr(totalNetRevenue)}</p>
        </div>
        <div className="stat-card stat-card-purple">
          <p className="text-xs text-muted font-medium">Blended Net ROAS</p>
          <p className="text-2xl font-bold mt-1">{(totalNetRevenue / totalSpend).toFixed(1)}x</p>
        </div>
        <div className="stat-card stat-card-orange">
          <p className="text-xs text-muted font-medium">Halo Revenue</p>
          <p className="text-2xl font-bold mt-1">{formatInr(channelData.reduce((s, c) => s + c.haloRevenue, 0))}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: "roas", label: "Net vs Gross ROAS" },
          { key: "halo", label: "Brand Halo" },
          { key: "archetypes", label: "Archetype Performance" },
          { key: "attribution", label: "Multi-Touch Attribution" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.key
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-muted hover:text-text"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Net vs Gross ROAS */}
      {activeTab === "roas" && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Channel ROAS Comparison: Gross vs Net</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Channel</th>
                <th className="pb-3 font-medium text-muted">Platform</th>
                <th className="pb-3 font-medium text-muted">Spend</th>
                <th className="pb-3 font-medium text-muted">Gross Revenue</th>
                <th className="pb-3 font-medium text-muted">Gross ROAS</th>
                <th className="pb-3 font-medium text-muted">Returns</th>
                <th className="pb-3 font-medium text-muted">Net Revenue</th>
                <th className="pb-3 font-medium text-muted">Net ROAS</th>
                <th className="pb-3 font-medium text-muted">Halo</th>
                <th className="pb-3 font-medium text-muted">True CPA</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {channelData.map((ch) => (
                <tr key={ch.channel} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{ch.channel}</td>
                  <td className="py-3 text-muted">{ch.platform}</td>
                  <td className="py-3">{formatInr(ch.spend)}</td>
                  <td className="py-3">{formatInr(ch.grossRevenue)}</td>
                  <td className="py-3">
                    <span className={cn("font-medium", ch.grossRoas >= 5 ? "text-green-600" : ch.grossRoas >= 3 ? "text-blue-600" : "text-orange-600")}>
                      {ch.grossRoas.toFixed(1)}x
                    </span>
                  </td>
                  <td className="py-3 text-red-500">{formatInr(ch.returns)}</td>
                  <td className="py-3 font-medium">{formatInr(ch.netRevenue)}</td>
                  <td className="py-3">
                    <span className={cn("font-bold", ch.netRoas >= 5 ? "text-green-600" : ch.netRoas >= 3 ? "text-blue-600" : "text-orange-600")}>
                      {ch.netRoas.toFixed(1)}x
                    </span>
                  </td>
                  <td className="py-3 text-purple-600">{formatInr(ch.haloRevenue)}</td>
                  <td className="py-3">{formatInr(ch.trueCpa)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className="py-3">Total</td>
                <td className="py-3"></td>
                <td className="py-3">{formatInr(totalSpend)}</td>
                <td className="py-3">{formatInr(totalGrossRevenue)}</td>
                <td className="py-3">{(totalGrossRevenue / totalSpend).toFixed(1)}x</td>
                <td className="py-3 text-red-500">{formatInr(channelData.reduce((s, c) => s + c.returns, 0))}</td>
                <td className="py-3">{formatInr(totalNetRevenue)}</td>
                <td className="py-3">{(totalNetRevenue / totalSpend).toFixed(1)}x</td>
                <td className="py-3 text-purple-600">{formatInr(channelData.reduce((s, c) => s + c.haloRevenue, 0))}</td>
                <td className="py-3">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Brand Halo */}
      {activeTab === "halo" && (
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Brand Halo Analysis</h3>
            <p className="text-sm text-muted mb-4">
              Halo revenue = additional purchases made in the same session or within 7 days of viewing a brand ad, but for different categories.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted">Brand</th>
                  <th className="pb-3 font-medium text-muted">Direct Revenue</th>
                  <th className="pb-3 font-medium text-muted">Halo Revenue</th>
                  <th className="pb-3 font-medium text-muted">Halo %</th>
                  <th className="pb-3 font-medium text-muted">Top Halo Categories</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {brandHaloData.map((brand) => (
                  <tr key={brand.brand} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{brand.brand}</td>
                    <td className="py-3">{formatInr(brand.directRevenue)}</td>
                    <td className="py-3 text-purple-600 font-medium">{formatInr(brand.haloRevenue)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${brand.haloPercent}%` }} />
                        </div>
                        <span className="text-xs font-medium">{brand.haloPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {brand.topHaloCategories.map((cat) => (
                          <span key={cat} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{cat}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Archetype Performance */}
      {activeTab === "archetypes" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {archetypePerf.map((arch) => {
              const Icon = arch.icon;
              return (
                <div key={arch.name} className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl bg-brand-${arch.color}/10`}>
                      <Icon size={22} className={`text-brand-${arch.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{arch.name}</h3>
                      <p className="text-xs text-muted">Performance breakdown</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-[10px] text-muted uppercase">Spend</p>
                      <p className="text-sm font-bold">{formatInr(arch.spend)}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-[10px] text-muted uppercase">Revenue</p>
                      <p className="text-sm font-bold">{formatInr(arch.revenue)}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-[10px] text-muted uppercase">ROAS</p>
                      <p className={cn("text-sm font-bold", arch.roas >= 5 ? "text-green-600" : "text-blue-600")}>{arch.roas}x</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-[10px] text-muted uppercase">CPA</p>
                      <p className="text-sm font-bold">{formatInr(arch.cpa)}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-[10px] text-muted uppercase">Conv. Rate</p>
                      <p className="text-sm font-bold">{arch.conversionRate}%</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-[10px] text-muted uppercase">Avg AOV</p>
                      <p className="text-sm font-bold">{formatInr(arch.avgOrderValue)}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-[10px] text-muted uppercase">Return Rate</p>
                      <p className="text-sm font-bold text-red-500">{arch.returnRate}%</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-[10px] text-muted uppercase">Net ROAS</p>
                      <p className="text-sm font-bold text-green-600">{(arch.roas * (1 - arch.returnRate / 100)).toFixed(1)}x</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Touch Attribution */}
      {activeTab === "attribution" && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-2">Multi-Touch Attribution Model</h3>
          <p className="text-sm text-muted mb-6">Data-driven attribution showing the weighted contribution of each touchpoint in the customer journey.</p>
          <div className="space-y-4">
            {attributionData.map((touch) => (
              <div key={touch.touchpoint} className="flex items-center gap-4">
                <span className="text-sm font-medium w-48 shrink-0">{touch.touchpoint}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-brand-blue rounded-lg flex items-center justify-end pr-3 transition-all"
                    style={{ width: `${touch.weight}%` }}
                  >
                    {touch.weight >= 15 && <span className="text-xs font-bold text-white">{touch.weight}%</span>}
                  </div>
                  {touch.weight < 15 && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium">{touch.weight}%</span>}
                </div>
                <span className="text-xs text-muted w-24 text-right shrink-0">
                  ~{touch.avgDaysBeforePurchase}d before purchase
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Key Insight</p>
            <p className="text-xs text-blue-600 mt-1">
              Social Discovery (Meta) initiates 32% of all conversion paths, averaging 8 days before purchase. Brand Search captures high-intent users 2 days before conversion, making it critical for closing. WhatsApp Commerce has the shortest path (same day) and highest conversion rate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
