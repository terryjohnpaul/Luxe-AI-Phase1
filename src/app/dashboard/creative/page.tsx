"use client";

import { useState } from "react";
import {
  Palette,
  Upload,
  Play,
  Film,
  Image,
  Grid3X3,
  Users,
  TrendingUp,
  Eye,
  Clock,
  Check,
  Plus,
  Search,
  BarChart3,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BrandAsset {
  id: string;
  brand: string;
  type: "logo" | "font" | "colorPalette" | "guideline";
  name: string;
  uploadedAt: string;
  status: "active" | "processing";
}

interface CreativeItem {
  id: string;
  name: string;
  type: "Reel" | "Static" | "Carousel" | "Story";
  brand: string;
  archetype: string;
  ctr: number;
  impressions: number;
  roas: number;
  status: "active" | "testing" | "paused";
}

interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: "Instagram" | "YouTube";
  followers: string;
  brand: string;
  status: "whitelisted" | "pending" | "rejected";
  avgEngagement: number;
}

const mockBrandAssets: BrandAsset[] = [
  { id: "a1", brand: "Ami Paris", type: "logo", name: "Ami Paris Logo - Dark", uploadedAt: "2 days ago", status: "active" },
  { id: "a2", brand: "Ami Paris", type: "colorPalette", name: "Ami Paris Colors 2024", uploadedAt: "2 days ago", status: "active" },
  { id: "a3", brand: "Hugo Boss", type: "logo", name: "Hugo Boss Logo - Primary", uploadedAt: "5 days ago", status: "active" },
  { id: "a4", brand: "Hugo Boss", type: "guideline", name: "Hugo Boss Brand Guidelines", uploadedAt: "5 days ago", status: "active" },
  { id: "a5", brand: "Kenzo", type: "logo", name: "Kenzo Tiger Logo", uploadedAt: "1 week ago", status: "active" },
  { id: "a6", brand: "Kenzo", type: "font", name: "Kenzo Display Font Pack", uploadedAt: "1 week ago", status: "active" },
  { id: "a7", brand: "Michael Kors", type: "logo", name: "MK Monogram Logo", uploadedAt: "1 week ago", status: "active" },
  { id: "a8", brand: "Coach", type: "logo", name: "Coach Signature Logo", uploadedAt: "3 days ago", status: "active" },
  { id: "a9", brand: "Diesel", type: "colorPalette", name: "Diesel Red Collection", uploadedAt: "4 days ago", status: "processing" },
];

const creativeMatrix: CreativeItem[] = [
  { id: "c1", name: "Ami Paris Tiger Jacket Reel", type: "Reel", brand: "Ami Paris", archetype: "Fashion Loyalist", ctr: 4.2, impressions: 284000, roas: 6.8, status: "active" },
  { id: "c2", name: "Hugo Boss Polo Carousel", type: "Carousel", brand: "Hugo Boss", archetype: "Urban Achiever", ctr: 2.8, impressions: 196000, roas: 5.2, status: "active" },
  { id: "c3", name: "Kenzo Tiger Motif Story", type: "Story", brand: "Kenzo", archetype: "Fashion Loyalist", ctr: 5.1, impressions: 142000, roas: 7.4, status: "active" },
  { id: "c4", name: "Coach Tabby Bag Static", type: "Static", brand: "Coach", archetype: "Aspirant", ctr: 1.9, impressions: 320000, roas: 3.1, status: "testing" },
  { id: "c5", name: "MK Jet Set Reel", type: "Reel", brand: "Michael Kors", archetype: "Aspirant", ctr: 3.4, impressions: 218000, roas: 4.6, status: "active" },
  { id: "c6", name: "Diesel Denim Story", type: "Story", brand: "Diesel", archetype: "Urban Achiever", ctr: 2.1, impressions: 98000, roas: 2.8, status: "paused" },
  { id: "c7", name: "Ami Paris Sneaker Static", type: "Static", brand: "Ami Paris", archetype: "Splurger", ctr: 1.6, impressions: 176000, roas: 3.9, status: "active" },
  { id: "c8", name: "All Saints Leather Reel", type: "Reel", brand: "All Saints", archetype: "Fashion Loyalist", ctr: 3.8, impressions: 154000, roas: 5.8, status: "testing" },
  { id: "c9", name: "Farm Rio Summer Carousel", type: "Carousel", brand: "Farm Rio", archetype: "Splurger", ctr: 2.4, impressions: 112000, roas: 3.2, status: "active" },
];

const mockInfluencers: Influencer[] = [
  { id: "i1", name: "Priya Sharma", handle: "@priyastylediaries", platform: "Instagram", followers: "284K", brand: "Ami Paris", status: "whitelisted", avgEngagement: 4.2 },
  { id: "i2", name: "Rohan Mehta", handle: "@rohanmehta", platform: "Instagram", followers: "520K", brand: "Hugo Boss", status: "whitelisted", avgEngagement: 3.8 },
  { id: "i3", name: "Ananya Gupta", handle: "@ananyastyled", platform: "YouTube", followers: "1.2M", brand: "Kenzo", status: "pending", avgEngagement: 5.1 },
  { id: "i4", name: "Kabir Singh", handle: "@kabirthelabel", platform: "Instagram", followers: "180K", brand: "Diesel", status: "whitelisted", avgEngagement: 6.4 },
  { id: "i5", name: "Meera Nair", handle: "@meeranairluxe", platform: "Instagram", followers: "340K", brand: "Coach", status: "rejected", avgEngagement: 2.9 },
];

const brands = ["All Brands", "Ami Paris", "Hugo Boss", "Kenzo", "Michael Kors", "Coach", "Diesel", "All Saints", "Farm Rio"];

export default function CreativePage() {
  const [activeTab, setActiveTab] = useState<"sandbox" | "generator" | "matrix" | "influencers">("sandbox");
  const [selectedBrand, setSelectedBrand] = useState("All Brands");
  const [videoDuration, setVideoDuration] = useState("15");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Creative Studio</h1>
          <p className="text-sm text-muted mt-1">
            Brand sandbox, AI video generator, creative matrix, and influencer whitelisting.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><Upload size={14} /> Upload Asset</button>
          <button className="btn-primary"><Sparkles size={14} /> Generate Creative</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="stat-card stat-card-purple">
          <p className="text-xs text-muted font-medium">Total Creatives</p>
          <p className="text-2xl font-bold mt-1">148</p>
        </div>
        <div className="stat-card stat-card-blue">
          <p className="text-xs text-muted font-medium">Active Ads</p>
          <p className="text-2xl font-bold mt-1">64</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-xs text-muted font-medium">Avg CTR</p>
          <p className="text-2xl font-bold mt-1">3.2%</p>
        </div>
        <div className="stat-card stat-card-orange">
          <p className="text-xs text-muted font-medium">AI Generated</p>
          <p className="text-2xl font-bold mt-1">42</p>
        </div>
        <div className="stat-card stat-card-navy">
          <p className="text-xs text-muted font-medium">Brands Onboarded</p>
          <p className="text-2xl font-bold mt-1">8</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: "sandbox", label: "Brand Sandbox", icon: Grid3X3 },
          { key: "generator", label: "AI Video Generator", icon: Film },
          { key: "matrix", label: "Creative Matrix", icon: BarChart3 },
          { key: "influencers", label: "Influencer Whitelisting", icon: Users },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-muted hover:text-text"
              )}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Brand Sandbox Tab */}
      {activeTab === "sandbox" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              {brands.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {mockBrandAssets
              .filter((a) => selectedBrand === "All Brands" || a.brand === selectedBrand)
              .map((asset) => (
                <div key={asset.id} className="glass-card p-4">
                  <div className="h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center mb-3">
                    {asset.type === "logo" && <Image size={28} className="text-gray-300" />}
                    {asset.type === "font" && <span className="text-2xl text-gray-300 font-bold">Aa</span>}
                    {asset.type === "colorPalette" && (
                      <div className="flex gap-1">
                        <div className="w-8 h-8 rounded-full bg-gray-800" />
                        <div className="w-8 h-8 rounded-full bg-red-500" />
                        <div className="w-8 h-8 rounded-full bg-blue-500" />
                      </div>
                    )}
                    {asset.type === "guideline" && <span className="text-xs text-gray-400">PDF</span>}
                  </div>
                  <p className="text-sm font-medium">{asset.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted">{asset.brand}</span>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full",
                      asset.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {asset.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted mt-1">{asset.uploadedAt}</p>
                </div>
              ))}
            {/* Upload placeholder */}
            <div className="glass-card p-4 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors min-h-[200px]">
              <div className="text-center">
                <Plus size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted">Upload Brand Asset</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Video Generator Tab */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold">Generate AI Video</h3>
            <div>
              <label className="text-xs text-muted block mb-1">Select Product Image</label>
              <div className="h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="text-center">
                  <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted">Click to upload or drag & drop</p>
                  <p className="text-xs text-muted">JPG, PNG up to 10MB</p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Brand</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm">
                {brands.filter(b => b !== "All Brands").map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Duration</label>
              <div className="flex gap-2">
                {["6", "15", "30"].map((d) => (
                  <button
                    key={d}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                      videoDuration === d ? "bg-brand-blue text-white border-brand-blue" : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                    onClick={() => setVideoDuration(d)}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Style</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm">
                <option>Product Showcase</option>
                <option>Lifestyle Scene</option>
                <option>Model Walkthrough</option>
                <option>Unboxing</option>
                <option>Street Style</option>
              </select>
            </div>
            <button className="btn-primary w-full justify-center">
              <Sparkles size={16} /> Generate Video
            </button>
          </div>
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Recent Generations</h3>
            <div className="space-y-3">
              {[
                { name: "Ami Paris Jacket - Lifestyle 15s", status: "completed", time: "2h ago" },
                { name: "Kenzo Tiger Tee - Showcase 6s", status: "completed", time: "4h ago" },
                { name: "Hugo Boss Suit - Model Walk 30s", status: "processing", time: "Just now" },
                { name: "Coach Tabby - Unboxing 15s", status: "completed", time: "1d ago" },
              ].map((gen, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <Film size={14} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{gen.name}</p>
                      <p className="text-xs text-muted">{gen.time}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    gen.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  )}>
                    {gen.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Creative Matrix Tab */}
      {activeTab === "matrix" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Creative Performance Matrix</h3>
            <div className="flex gap-2">
              <select className="border rounded-lg px-3 py-2 text-sm">
                {brands.map((b) => <option key={b}>{b}</option>)}
              </select>
              <select className="border rounded-lg px-3 py-2 text-sm">
                <option>All Types</option>
                <option>Reel</option>
                <option>Static</option>
                <option>Carousel</option>
                <option>Story</option>
              </select>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Creative</th>
                <th className="pb-3 font-medium text-muted">Type</th>
                <th className="pb-3 font-medium text-muted">Brand</th>
                <th className="pb-3 font-medium text-muted">Archetype</th>
                <th className="pb-3 font-medium text-muted">CTR</th>
                <th className="pb-3 font-medium text-muted">Impressions</th>
                <th className="pb-3 font-medium text-muted">ROAS</th>
                <th className="pb-3 font-medium text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {creativeMatrix.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{item.name}</td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      item.type === "Reel" && "bg-purple-100 text-purple-700",
                      item.type === "Static" && "bg-blue-100 text-blue-700",
                      item.type === "Carousel" && "bg-orange-100 text-orange-700",
                      item.type === "Story" && "bg-green-100 text-green-700",
                    )}>
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 text-muted">{item.brand}</td>
                  <td className="py-3 text-muted">{item.archetype}</td>
                  <td className="py-3 font-medium">{item.ctr}%</td>
                  <td className="py-3">{(item.impressions / 1000).toFixed(0)}K</td>
                  <td className="py-3">
                    <span className={cn(
                      "font-medium",
                      item.roas >= 5 ? "text-green-600" : item.roas >= 3 ? "text-blue-600" : "text-orange-600"
                    )}>
                      {item.roas}x
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      item.status === "active" && "bg-green-100 text-green-700",
                      item.status === "testing" && "bg-yellow-100 text-yellow-700",
                      item.status === "paused" && "bg-gray-100 text-gray-600",
                    )}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Influencer Whitelisting Tab */}
      {activeTab === "influencers" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Influencer Whitelisting</h3>
            <button className="btn-primary"><Plus size={14} /> Add Influencer</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Influencer</th>
                <th className="pb-3 font-medium text-muted">Platform</th>
                <th className="pb-3 font-medium text-muted">Followers</th>
                <th className="pb-3 font-medium text-muted">Brand</th>
                <th className="pb-3 font-medium text-muted">Avg Engagement</th>
                <th className="pb-3 font-medium text-muted">Status</th>
                <th className="pb-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockInfluencers.map((inf) => (
                <tr key={inf.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <p className="font-medium">{inf.name}</p>
                    <p className="text-xs text-muted">{inf.handle}</p>
                  </td>
                  <td className="py-3 text-muted">{inf.platform}</td>
                  <td className="py-3">{inf.followers}</td>
                  <td className="py-3 text-muted">{inf.brand}</td>
                  <td className="py-3">{inf.avgEngagement}%</td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      inf.status === "whitelisted" && "bg-green-100 text-green-700",
                      inf.status === "pending" && "bg-yellow-100 text-yellow-700",
                      inf.status === "rejected" && "bg-red-100 text-red-700",
                    )}>
                      {inf.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {inf.status === "pending" && (
                      <div className="flex gap-1">
                        <button className="btn-approve">Approve</button>
                        <button className="btn-reject">Reject</button>
                      </div>
                    )}
                    {inf.status === "whitelisted" && (
                      <button className="text-xs text-muted hover:text-text flex items-center gap-1">
                        <ExternalLink size={12} /> View Profile
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
