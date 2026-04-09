"use client";

import { useState } from "react";
import {
  Users,
  Crown,
  Briefcase,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Filter,
  Plus,
  ChevronRight,
  Heart,
  Target,
  BarChart3,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Archetype {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  members: number;
  avgAov: number;
  returnRate: number;
  clv: number;
  topBrands: string[];
  description: string;
  channels: string[];
  growth: number;
}

interface AudienceSegment {
  id: string;
  name: string;
  archetype: string;
  size: number;
  avgAov: number;
  lastActive: string;
  status: "active" | "building" | "paused";
}

const archetypes: Archetype[] = [
  {
    id: "fashion-loyalist",
    name: "Fashion Loyalist",
    icon: Crown,
    color: "purple",
    members: 14200,
    avgAov: 18400,
    returnRate: 8,
    clv: 245000,
    topBrands: ["Ami Paris", "Kenzo", "All Saints", "Cult Gaia"],
    description: "High-frequency buyers who follow trends closely. Buy new arrivals within 48h of drop. Low return rate, high brand loyalty.",
    channels: ["Meta Reels", "Instagram Stories", "WhatsApp"],
    growth: 12.5,
  },
  {
    id: "urban-achiever",
    name: "Urban Achiever",
    icon: Briefcase,
    color: "blue",
    members: 22800,
    avgAov: 12600,
    returnRate: 14,
    clv: 168000,
    topBrands: ["Hugo Boss", "Michael Kors", "Coach", "Diesel"],
    description: "Professional wardrobe builders. Buy workwear and smart-casual. Respond well to brand campaigns and quality messaging.",
    channels: ["Google Brand", "Meta ASC", "Email"],
    growth: 8.2,
  },
  {
    id: "splurger",
    name: "Splurger",
    icon: ShoppingBag,
    color: "orange",
    members: 6400,
    avgAov: 42800,
    returnRate: 22,
    clv: 320000,
    topBrands: ["Ami Paris", "Hugo Boss", "Cult Gaia", "Farm Rio"],
    description: "High-value impulse buyers. Large basket sizes but high return rates. Triggered by sales events and exclusive drops.",
    channels: ["Meta Retarget", "WhatsApp VIP", "Push"],
    growth: -3.1,
  },
  {
    id: "aspirant",
    name: "Aspirant",
    icon: Sparkles,
    color: "green",
    members: 38400,
    avgAov: 6200,
    returnRate: 18,
    clv: 52000,
    topBrands: ["Michael Kors", "Coach", "Diesel", "All Saints"],
    description: "Entry-level luxury buyers. Price-sensitive, respond to discounts. Potential to graduate to Fashion Loyalist with nurturing.",
    channels: ["Google PMax", "Meta ASC", "Email Drip"],
    growth: 22.4,
  },
];

const mockSegments: AudienceSegment[] = [
  { id: "s1", name: "Mumbai Fashion Loyalists - Ami Paris Fans", archetype: "Fashion Loyalist", size: 2840, avgAov: 22100, lastActive: "2h ago", status: "active" },
  { id: "s2", name: "Delhi NCR Urban Achievers - Hugo Boss", archetype: "Urban Achiever", size: 4200, avgAov: 14800, lastActive: "1h ago", status: "active" },
  { id: "s3", name: "High CLV Splurgers - 30d inactive", archetype: "Splurger", size: 890, avgAov: 38600, lastActive: "32d ago", status: "active" },
  { id: "s4", name: "Aspirant to Loyalist Pipeline", archetype: "Aspirant", size: 6200, avgAov: 8400, lastActive: "6h ago", status: "building" },
  { id: "s5", name: "Bangalore Tech Professionals", archetype: "Urban Achiever", size: 3100, avgAov: 15200, lastActive: "3h ago", status: "active" },
  { id: "s6", name: "Wedding Season Shoppers", archetype: "Splurger", size: 1200, avgAov: 52000, lastActive: "12h ago", status: "paused" },
];

function formatInr(amount: number): string {
  if (amount >= 100000) return `INR ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `INR ${(amount / 1000).toFixed(1)}K`;
  return `INR ${amount.toLocaleString("en-IN")}`;
}

export default function AudiencesPage() {
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"archetypes" | "segments" | "builder">("archetypes");

  const totalMembers = archetypes.reduce((sum, a) => sum + a.members, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audience Intelligence</h1>
          <p className="text-sm text-muted mt-1">
            AI-powered customer archetypes with real-time CLV scoring and behavioral segmentation.
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={16} /> Create Segment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card stat-card-blue">
          <p className="text-xs text-muted font-medium">Total Profiled</p>
          <p className="text-2xl font-bold mt-1">{totalMembers.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} /> 14.2% this month</p>
        </div>
        <div className="stat-card stat-card-purple">
          <p className="text-xs text-muted font-medium">Avg CLV</p>
          <p className="text-2xl font-bold mt-1">INR 1.42L</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} /> 8.6% vs last quarter</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-xs text-muted font-medium">Active Segments</p>
          <p className="text-2xl font-bold mt-1">24</p>
          <p className="text-xs text-muted mt-1">6 auto-generated</p>
        </div>
        <div className="stat-card stat-card-orange">
          <p className="text-xs text-muted font-medium">Archetype Accuracy</p>
          <p className="text-2xl font-bold mt-1">87.4%</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} /> +2.1% this week</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["archetypes", "segments", "builder"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              activeTab === tab
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-muted hover:text-text"
            )}
          >
            {tab === "builder" ? "Audience Builder" : tab}
          </button>
        ))}
      </div>

      {/* Archetypes Tab */}
      {activeTab === "archetypes" && (
        <div className="space-y-6">
          {/* Archetype Cards */}
          <div className="grid grid-cols-2 gap-4">
            {archetypes.map((arch) => {
              const Icon = arch.icon;
              return (
                <div
                  key={arch.id}
                  className={cn(
                    "glass-card p-6 cursor-pointer transition-all hover:shadow-md",
                    selectedArchetype === arch.id && "ring-2 ring-brand-blue"
                  )}
                  onClick={() => setSelectedArchetype(selectedArchetype === arch.id ? null : arch.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-brand-${arch.color}/10`}>
                        <Icon size={22} className={`text-brand-${arch.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{arch.name}</h3>
                        <p className="text-sm text-muted">{arch.members.toLocaleString()} members</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      arch.growth >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                      {arch.growth >= 0 ? "+" : ""}{arch.growth}%
                    </span>
                  </div>

                  <p className="text-sm text-muted mb-4">{arch.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">Avg AOV</p>
                      <p className="text-sm font-bold">{formatInr(arch.avgAov)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">Return Rate</p>
                      <p className="text-sm font-bold">{arch.returnRate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">CLV</p>
                      <p className="text-sm font-bold">{formatInr(arch.clv)}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5">Top Brands</p>
                    <div className="flex flex-wrap gap-1.5">
                      {arch.topBrands.map((brand) => (
                        <span key={brand} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{brand}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5">Best Channels</p>
                    <div className="flex flex-wrap gap-1.5">
                      {arch.channels.map((ch) => (
                        <span key={ch} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{ch}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CLV Distribution Placeholder */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-2">CLV Distribution</h2>
            <p className="text-sm text-muted mb-4">Customer Lifetime Value distribution across archetypes</p>
            <div className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted">CLV Distribution Chart</p>
                <p className="text-xs text-muted">Histogram showing CLV bands by archetype</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted">Under INR 25K</p>
                <p className="text-lg font-bold">28,400</p>
                <p className="text-xs text-muted">34.7%</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted">INR 25K - 1L</p>
                <p className="text-lg font-bold">32,100</p>
                <p className="text-xs text-muted">39.2%</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted">INR 1L - 3L</p>
                <p className="text-lg font-bold">16,800</p>
                <p className="text-xs text-muted">20.5%</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted">Over INR 3L</p>
                <p className="text-lg font-bold">4,500</p>
                <p className="text-xs text-muted">5.5%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segments Tab */}
      {activeTab === "segments" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Custom Segments</h2>
            <button className="btn-secondary"><Filter size={14} /> Filter</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Segment Name</th>
                <th className="pb-3 font-medium text-muted">Archetype</th>
                <th className="pb-3 font-medium text-muted">Size</th>
                <th className="pb-3 font-medium text-muted">Avg AOV</th>
                <th className="pb-3 font-medium text-muted">Last Active</th>
                <th className="pb-3 font-medium text-muted">Status</th>
                <th className="pb-3 font-medium text-muted"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockSegments.map((seg) => (
                <tr key={seg.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{seg.name}</td>
                  <td className="py-3 text-muted">{seg.archetype}</td>
                  <td className="py-3">{seg.size.toLocaleString()}</td>
                  <td className="py-3">{formatInr(seg.avgAov)}</td>
                  <td className="py-3 text-muted">{seg.lastActive}</td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      seg.status === "active" && "bg-green-100 text-green-700",
                      seg.status === "building" && "bg-blue-100 text-blue-700",
                      seg.status === "paused" && "bg-gray-100 text-gray-600",
                    )}>
                      {seg.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button className="text-muted hover:text-text"><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Builder Tab */}
      {activeTab === "builder" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Audience Builder</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">Base Archetype</p>
              <div className="flex gap-2">
                {archetypes.map((a) => (
                  <button key={a.id} className="btn-secondary text-xs">{a.name}</button>
                ))}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">Filters</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">City</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option>All Cities</option>
                    <option>Mumbai</option>
                    <option>Delhi NCR</option>
                    <option>Bangalore</option>
                    <option>Hyderabad</option>
                    <option>Chennai</option>
                    <option>Kolkata</option>
                    <option>Jaipur</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Min AOV</label>
                  <input type="text" placeholder="INR 5,000" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Last Purchase</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option>Any time</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>90+ days ago</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Brand Affinity</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option>Any Brand</option>
                    <option>Ami Paris</option>
                    <option>Hugo Boss</option>
                    <option>Kenzo</option>
                    <option>Michael Kors</option>
                    <option>Coach</option>
                    <option>Diesel</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">CLV Range</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option>Any</option>
                    <option>Under INR 50K</option>
                    <option>INR 50K - 1.5L</option>
                    <option>INR 1.5L - 3L</option>
                    <option>Over INR 3L</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Orders Count</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option>Any</option>
                    <option>1 order</option>
                    <option>2-5 orders</option>
                    <option>6-10 orders</option>
                    <option>10+ orders</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="text-sm font-medium">Estimated Audience Size</p>
                <p className="text-xs text-muted">Based on current filters</p>
              </div>
              <p className="text-2xl font-bold text-brand-blue">~4,280</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary"><Target size={14} /> Save Segment</button>
              <button className="btn-secondary">Export to CSV</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
