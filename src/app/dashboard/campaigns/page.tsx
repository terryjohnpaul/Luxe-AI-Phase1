"use client";

import { useState } from "react";
import {
  Rocket,
  Zap,
  Cloud,
  Flame,
  GitBranch,
  Gift,
  ShieldAlert,
  ShoppingBag,
  Calendar,
  ArrowRightLeft,
  RefreshCw,
  Clock,
  Play,
  Pause,
  Eye,
  TrendingUp,
  Target,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  setupTime: string;
  icon: React.ElementType;
  color: string;
  recommended?: boolean;
}

interface ActiveCampaign {
  id: string;
  name: string;
  template: string;
  brand: string;
  platform: string;
  status: "active" | "paused" | "scheduled" | "completed";
  spend: number;
  revenue: number;
  roas: number;
  startDate: string;
  archetype: string;
}

const templates: CampaignTemplate[] = [
  {
    id: "t1",
    name: "New Brand Launch",
    description: "Full-funnel launch sequence: awareness Reels, consideration carousels, conversion retarget. 14-day window.",
    platforms: ["Meta", "Google", "WhatsApp"],
    setupTime: "5 min",
    icon: Rocket,
    color: "blue",
    recommended: true,
  },
  {
    id: "t2",
    name: "Product Drop",
    description: "Hype-driven campaign for new arrivals. Countdown stories, waitlist WhatsApp blast, and launch-day ASC.",
    platforms: ["Meta", "WhatsApp"],
    setupTime: "3 min",
    icon: Zap,
    color: "purple",
  },
  {
    id: "t3",
    name: "Seasonal Push",
    description: "Season-aligned campaigns: monsoon, festive, summer, winter. Pre-built creative templates per season.",
    platforms: ["Meta", "Google", "Email"],
    setupTime: "4 min",
    icon: Calendar,
    color: "orange",
  },
  {
    id: "t4",
    name: "Weather Trigger",
    description: "Auto-activates based on weather signals. Rain gear for monsoon, UV protection for heatwaves.",
    platforms: ["Meta", "Google"],
    setupTime: "2 min",
    icon: Cloud,
    color: "blue",
  },
  {
    id: "t5",
    name: "Viral Moment",
    description: "Rapid-response campaign for trending moments. AI generates creatives from brand sandbox in under 60s.",
    platforms: ["Meta", "Google"],
    setupTime: "1 min",
    icon: Flame,
    color: "red",
    recommended: true,
  },
  {
    id: "t6",
    name: "Retargeting Cascade",
    description: "6-stage retargeting funnel from Day 1 to Day 90. Automated message and creative progression.",
    platforms: ["Meta", "Google", "WhatsApp", "Email"],
    setupTime: "6 min",
    icon: GitBranch,
    color: "green",
  },
  {
    id: "t7",
    name: "Win-Back",
    description: "Re-engage lapsed customers. Personalized offers based on past purchases and CLV tier.",
    platforms: ["Email", "WhatsApp", "Meta"],
    setupTime: "3 min",
    icon: RefreshCw,
    color: "orange",
  },
  {
    id: "t8",
    name: "Cross-Sell",
    description: "AI-powered product recommendations. Targets post-purchase window with complementary items by archetype.",
    platforms: ["Email", "WhatsApp", "Meta"],
    setupTime: "3 min",
    icon: ArrowRightLeft,
    color: "purple",
  },
  {
    id: "t9",
    name: "Brand Defense",
    description: "Protect brand search terms from competitors. Auto-scales bids when competitor activity detected.",
    platforms: ["Google"],
    setupTime: "2 min",
    icon: ShieldAlert,
    color: "navy",
  },
  {
    id: "t10",
    name: "Gifting",
    description: "Occasion-based gifting campaigns: birthdays, anniversaries, festivals. Gift guide + express delivery messaging.",
    platforms: ["Meta", "Google", "WhatsApp", "Email"],
    setupTime: "4 min",
    icon: Gift,
    color: "red",
  },
];

const activeCampaigns: ActiveCampaign[] = [
  { id: "ac1", name: "Ami Paris Trend Boost", template: "Viral Moment", brand: "Ami Paris", platform: "Meta ASC", status: "active", spend: 124000, revenue: 842000, roas: 6.8, startDate: "Mar 25", archetype: "Fashion Loyalist" },
  { id: "ac2", name: "Hugo Boss Summer Launch", template: "New Brand Launch", brand: "Hugo Boss", platform: "Meta + Google", status: "active", spend: 340000, revenue: 1680000, roas: 4.9, startDate: "Mar 20", archetype: "Urban Achiever" },
  { id: "ac3", name: "Monsoon Collection - Mumbai", template: "Weather Trigger", brand: "Multi-brand", platform: "Meta", status: "active", spend: 48000, revenue: 196000, roas: 4.1, startDate: "Mar 27", archetype: "All" },
  { id: "ac4", name: "Kenzo Tiger Drop", template: "Product Drop", brand: "Kenzo", platform: "Meta + WhatsApp", status: "active", spend: 86000, revenue: 520000, roas: 6.0, startDate: "Mar 22", archetype: "Fashion Loyalist" },
  { id: "ac5", name: "Coach Win-Back Q1", template: "Win-Back", brand: "Coach", platform: "Email + Meta", status: "active", spend: 62000, revenue: 248000, roas: 4.0, startDate: "Mar 15", archetype: "Aspirant" },
  { id: "ac6", name: "MK Cross-Sell Post Purchase", template: "Cross-Sell", brand: "Michael Kors", platform: "Email + WhatsApp", status: "paused", spend: 28000, revenue: 94000, roas: 3.4, startDate: "Mar 10", archetype: "Aspirant" },
  { id: "ac7", name: "Google Brand Defense", template: "Brand Defense", brand: "All Brands", platform: "Google", status: "active", spend: 180000, revenue: 3312000, roas: 18.4, startDate: "Jan 1", archetype: "All" },
  { id: "ac8", name: "Holi Gifting Campaign", template: "Gifting", brand: "Multi-brand", platform: "All Channels", status: "completed", spend: 220000, revenue: 1040000, roas: 4.7, startDate: "Mar 10", archetype: "Splurger" },
];

function formatInr(amount: number): string {
  if (amount >= 100000) return `INR ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `INR ${(amount / 1000).toFixed(1)}K`;
  return `INR ${amount.toLocaleString("en-IN")}`;
}

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCampaigns = activeCampaigns.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaign Builder</h1>
          <p className="text-sm text-muted mt-1">
            10 pre-built templates for luxury fashion. Select a template, configure, and launch in minutes.
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card stat-card-blue">
          <p className="text-xs text-muted font-medium">Active Campaigns</p>
          <p className="text-2xl font-bold mt-1">{activeCampaigns.filter(c => c.status === "active").length}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-xs text-muted font-medium">Total Spend (MTD)</p>
          <p className="text-2xl font-bold mt-1">INR 10.9L</p>
        </div>
        <div className="stat-card stat-card-purple">
          <p className="text-xs text-muted font-medium">Total Revenue (MTD)</p>
          <p className="text-2xl font-bold mt-1">INR 79.3L</p>
        </div>
        <div className="stat-card stat-card-orange">
          <p className="text-xs text-muted font-medium">Avg ROAS</p>
          <p className="text-2xl font-bold mt-1">5.8x</p>
        </div>
      </div>

      {/* Campaign Templates */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Campaign Templates</h2>
        <div className="grid grid-cols-2 gap-4">
          {templates.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <div key={tpl.id} className="glass-card p-5 hover:shadow-md transition-shadow cursor-pointer relative">
                {tpl.recommended && (
                  <span className="absolute top-3 right-3 text-[10px] bg-brand-blue text-white px-2 py-0.5 rounded-full font-medium">Recommended</span>
                )}
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-brand-${tpl.color === "navy" ? "blue" : tpl.color}/10 shrink-0`}>
                    <Icon size={22} className={`text-brand-${tpl.color === "navy" ? "blue" : tpl.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{tpl.name}</h3>
                    <p className="text-sm text-muted mt-1">{tpl.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex gap-1.5">
                        {tpl.platforms.map((p) => (
                          <span key={p} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                      <span className="text-xs text-muted flex items-center gap-1"><Clock size={10} /> {tpl.setupTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Campaigns Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active Campaigns</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 border rounded-lg text-sm w-64"
              />
            </div>
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 font-medium text-muted">Campaign</th>
              <th className="pb-3 font-medium text-muted">Template</th>
              <th className="pb-3 font-medium text-muted">Brand</th>
              <th className="pb-3 font-medium text-muted">Platform</th>
              <th className="pb-3 font-medium text-muted">Spend</th>
              <th className="pb-3 font-medium text-muted">Revenue</th>
              <th className="pb-3 font-medium text-muted">ROAS</th>
              <th className="pb-3 font-medium text-muted">Status</th>
              <th className="pb-3 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCampaigns.map((camp) => (
              <tr key={camp.id} className="hover:bg-gray-50">
                <td className="py-3">
                  <p className="font-medium">{camp.name}</p>
                  <p className="text-xs text-muted">{camp.archetype} | Started {camp.startDate}</p>
                </td>
                <td className="py-3 text-muted text-xs">{camp.template}</td>
                <td className="py-3 text-muted">{camp.brand}</td>
                <td className="py-3 text-muted">{camp.platform}</td>
                <td className="py-3">{formatInr(camp.spend)}</td>
                <td className="py-3 font-medium">{formatInr(camp.revenue)}</td>
                <td className="py-3">
                  <span className={cn(
                    "font-medium",
                    camp.roas >= 5 ? "text-green-600" : camp.roas >= 3 ? "text-blue-600" : "text-orange-600"
                  )}>
                    {camp.roas}x
                  </span>
                </td>
                <td className="py-3">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    camp.status === "active" && "bg-green-100 text-green-700",
                    camp.status === "paused" && "bg-yellow-100 text-yellow-700",
                    camp.status === "scheduled" && "bg-blue-100 text-blue-700",
                    camp.status === "completed" && "bg-gray-100 text-gray-600",
                  )}>
                    {camp.status}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex gap-1">
                    {camp.status === "active" && (
                      <button className="p-1.5 rounded-md hover:bg-gray-100" title="Pause">
                        <Pause size={14} className="text-muted" />
                      </button>
                    )}
                    {camp.status === "paused" && (
                      <button className="p-1.5 rounded-md hover:bg-gray-100" title="Resume">
                        <Play size={14} className="text-muted" />
                      </button>
                    )}
                    <button className="p-1.5 rounded-md hover:bg-gray-100" title="View">
                      <Eye size={14} className="text-muted" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
