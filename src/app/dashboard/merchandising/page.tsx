"use client";

import { useState } from "react";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Eye,
  Calendar,
  MessageSquare,
  BarChart3,
  Target,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BrandHeatScore {
  brand: string;
  score: number;
  trend: "up" | "down" | "stable";
  trendDelta: number;
  components: {
    searchTrend: number;
    socialBuzz: number;
    salesVelocity: number;
    inventoryHealth: number;
    competitorGap: number;
  };
  recommendation: string;
}

interface MarketingSignal {
  id: string;
  brand: string;
  signal: string;
  type: "trend" | "performance" | "inventory" | "competitor";
  impact: "buy_more" | "markdown" | "promote" | "hold";
  confidence: number;
  timestamp: string;
}

interface SeasonNote {
  id: string;
  title: string;
  brand: string;
  season: string;
  content: string;
  author: string;
  createdAt: string;
  status: "active" | "archived";
}

const mockBrandScores: BrandHeatScore[] = [
  {
    brand: "Ami Paris", score: 92, trend: "up", trendDelta: 14,
    components: { searchTrend: 96, socialBuzz: 88, salesVelocity: 94, inventoryHealth: 72, competitorGap: 90 },
    recommendation: "Increase buy depth. Trending 2.3x on search. Consider exclusive colorway order.",
  },
  {
    brand: "Hugo Boss", score: 78, trend: "stable", trendDelta: 2,
    components: { searchTrend: 72, socialBuzz: 68, salesVelocity: 82, inventoryHealth: 88, competitorGap: 80 },
    recommendation: "Stable performer. Maintain current depth. Polo category overindexing.",
  },
  {
    brand: "Kenzo", score: 85, trend: "up", trendDelta: 8,
    components: { searchTrend: 88, socialBuzz: 92, salesVelocity: 80, inventoryHealth: 65, competitorGap: 85 },
    recommendation: "Tiger motif driving demand. Reorder tiger tees (4 units left). Social surging.",
  },
  {
    brand: "Michael Kors", score: 68, trend: "down", trendDelta: -6,
    components: { searchTrend: 58, socialBuzz: 52, salesVelocity: 72, inventoryHealth: 92, competitorGap: 65 },
    recommendation: "Declining interest. Consider markdown on older styles. Focus on bags category.",
  },
  {
    brand: "Coach", score: 74, trend: "up", trendDelta: 5,
    components: { searchTrend: 70, socialBuzz: 78, salesVelocity: 76, inventoryHealth: 80, competitorGap: 68 },
    recommendation: "Tabby bag driving growth. Increase bag allocation for next season.",
  },
  {
    brand: "Diesel", score: 56, trend: "down", trendDelta: -12,
    components: { searchTrend: 48, socialBuzz: 42, salesVelocity: 58, inventoryHealth: 86, competitorGap: 52 },
    recommendation: "Significant decline. Reduce next season buy by 30%. Focus denim core only.",
  },
  {
    brand: "All Saints", score: 71, trend: "stable", trendDelta: 1,
    components: { searchTrend: 62, socialBuzz: 64, salesVelocity: 78, inventoryHealth: 76, competitorGap: 74 },
    recommendation: "Steady performer. Leather jackets remain strong. Maintain current levels.",
  },
  {
    brand: "Farm Rio", score: 64, trend: "up", trendDelta: 18,
    components: { searchTrend: 72, socialBuzz: 82, salesVelocity: 52, inventoryHealth: 58, competitorGap: 56 },
    recommendation: "Rising social buzz but slow conversion. Test more aggressive Meta campaigns.",
  },
];

const mockSignals: MarketingSignal[] = [
  { id: "ms1", brand: "Ami Paris", signal: "Search volume up 2.3x, Reels CTR 180% above average, 3 celeb sightings this week", type: "trend", impact: "buy_more", confidence: 94, timestamp: "Today" },
  { id: "ms2", brand: "Diesel", signal: "ROAS dropped below 1.5x for 3 cycles, social engagement at 6-month low", type: "performance", impact: "markdown", confidence: 88, timestamp: "Today" },
  { id: "ms3", brand: "Kenzo", signal: "Tiger tee at 4 units, conversion rate 3x category average", type: "inventory", impact: "buy_more", confidence: 92, timestamp: "Today" },
  { id: "ms4", brand: "Michael Kors", signal: "Coach gaining share in bags category. MK bag ROAS declining.", type: "competitor", impact: "promote", confidence: 76, timestamp: "Yesterday" },
  { id: "ms5", brand: "Farm Rio", signal: "Vogue India feature driving awareness. Social saves up 4x. Summer season starting.", type: "trend", impact: "promote", confidence: 82, timestamp: "Yesterday" },
  { id: "ms6", brand: "Hugo Boss", signal: "Polo category sell-through 2x faster than suits. Reallocate buy budget.", type: "performance", impact: "buy_more", confidence: 86, timestamp: "2 days ago" },
];

const mockNotes: SeasonNote[] = [
  { id: "n1", title: "Ami Paris SS25 — Increase Tiger Print Buy", brand: "Ami Paris", season: "SS25", content: "Based on marketing signals: search trending 2.3x, celebrity endorsements driving awareness. Recommend increasing tiger print allocation by 40% and adding exclusive colorway. Current sell-through: 78% in first 2 weeks.", author: "Marketing Team", createdAt: "Mar 25, 2026", status: "active" },
  { id: "n2", title: "Diesel Denim — Reduce AW25 Buy", brand: "Diesel", season: "AW25", content: "ROAS has been declining for 3 months. Social engagement at 6-month low. Recommend reducing AW25 buy by 30% and focusing exclusively on denim core. Mark down slow-moving non-denim styles by 20%.", author: "Marketing Team", createdAt: "Mar 22, 2026", status: "active" },
  { id: "n3", title: "Kenzo Tiger Tee Reorder Urgency", brand: "Kenzo", season: "SS25", content: "Only 4 units remaining. Selling 3.2x faster than average. Customer waitlist: 28 people. URGENT: Place reorder for 200 units across sizes. Do not discount — full price sell-through is strong.", author: "Marketing Team", createdAt: "Mar 27, 2026", status: "active" },
  { id: "n4", title: "Coach Tabby Bag — Summer Push", brand: "Coach", season: "SS25", content: "Tabby bag driving all Coach growth. Meta ROAS: 5.8x. Recommend featuring in seasonal campaign. Consider Coach brand day event in May.", author: "Marketing Team", createdAt: "Mar 20, 2026", status: "active" },
];

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getImpactBadge(impact: MarketingSignal["impact"]): { label: string; color: string } {
  switch (impact) {
    case "buy_more": return { label: "Buy More", color: "bg-green-100 text-green-700" };
    case "markdown": return { label: "Markdown", color: "bg-red-100 text-red-700" };
    case "promote": return { label: "Promote", color: "bg-blue-100 text-blue-700" };
    case "hold": return { label: "Hold", color: "bg-gray-100 text-gray-700" };
  }
}

export default function MerchandisingPage() {
  const [activeTab, setActiveTab] = useState<"heat" | "signals" | "notes">("heat");
  const [showNoteForm, setShowNoteForm] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Merchandising Bridge</h1>
          <p className="text-sm text-muted mt-1">
            Brand Heat Scores, marketing-to-buying intelligence, and season notes connecting marketing performance to merchandising decisions.
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setActiveTab("notes"); setShowNoteForm(true); }}>
          <Plus size={16} /> New Season Note
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card stat-card-blue">
          <p className="text-xs text-muted font-medium">Brands Tracked</p>
          <p className="text-2xl font-bold mt-1">{mockBrandScores.length}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-xs text-muted font-medium">Hot Brands (&gt;80)</p>
          <p className="text-2xl font-bold mt-1">{mockBrandScores.filter(b => b.score >= 80).length}</p>
        </div>
        <div className="stat-card stat-card-red">
          <p className="text-xs text-muted font-medium">Declining Brands</p>
          <p className="text-2xl font-bold mt-1">{mockBrandScores.filter(b => b.trend === "down").length}</p>
        </div>
        <div className="stat-card stat-card-purple">
          <p className="text-xs text-muted font-medium">Active Season Notes</p>
          <p className="text-2xl font-bold mt-1">{mockNotes.filter(n => n.status === "active").length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: "heat", label: "Brand Heat Scores" },
          { key: "signals", label: "Marketing Signals" },
          { key: "notes", label: "Season Notes" },
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

      {/* Brand Heat Scores */}
      {activeTab === "heat" && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Brand Heat Score Dashboard</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Brand</th>
                <th className="pb-3 font-medium text-muted">Score</th>
                <th className="pb-3 font-medium text-muted">Trend</th>
                <th className="pb-3 font-medium text-muted">Search</th>
                <th className="pb-3 font-medium text-muted">Social</th>
                <th className="pb-3 font-medium text-muted">Sales</th>
                <th className="pb-3 font-medium text-muted">Inventory</th>
                <th className="pb-3 font-medium text-muted">Gap</th>
                <th className="pb-3 font-medium text-muted">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockBrandScores
                .sort((a, b) => b.score - a.score)
                .map((brand) => (
                  <tr key={brand.brand} className="hover:bg-gray-50">
                    <td className="py-3 font-semibold">{brand.brand}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center relative">
                          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-200"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className={getScoreColor(brand.score)}
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeDasharray={`${brand.score}, 100`}
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className={cn("absolute text-xs font-bold", getScoreColor(brand.score))}>{brand.score}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit",
                        brand.trend === "up" && "bg-green-100 text-green-700",
                        brand.trend === "down" && "bg-red-100 text-red-700",
                        brand.trend === "stable" && "bg-gray-100 text-gray-700",
                      )}>
                        {brand.trend === "up" && <ArrowUpRight size={10} />}
                        {brand.trend === "down" && <ArrowDownRight size={10} />}
                        {brand.trend === "up" ? "+" : ""}{brand.trendDelta}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getScoreBg(brand.components.searchTrend)}`} style={{ width: `${brand.components.searchTrend}%` }} />
                        </div>
                        <span className="text-xs">{brand.components.searchTrend}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getScoreBg(brand.components.socialBuzz)}`} style={{ width: `${brand.components.socialBuzz}%` }} />
                        </div>
                        <span className="text-xs">{brand.components.socialBuzz}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getScoreBg(brand.components.salesVelocity)}`} style={{ width: `${brand.components.salesVelocity}%` }} />
                        </div>
                        <span className="text-xs">{brand.components.salesVelocity}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getScoreBg(brand.components.inventoryHealth)}`} style={{ width: `${brand.components.inventoryHealth}%` }} />
                        </div>
                        <span className="text-xs">{brand.components.inventoryHealth}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getScoreBg(brand.components.competitorGap)}`} style={{ width: `${brand.components.competitorGap}%` }} />
                        </div>
                        <span className="text-xs">{brand.components.competitorGap}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-muted max-w-xs">{brand.recommendation}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Marketing Signals */}
      {activeTab === "signals" && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Marketing-to-Buying Signals</h3>
          <p className="text-sm text-muted mb-4">AI-detected signals from marketing performance that inform buying decisions.</p>
          <div className="space-y-3">
            {mockSignals.map((signal) => {
              const badge = getImpactBadge(signal.impact);
              return (
                <div key={signal.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    signal.type === "trend" && "bg-purple-100",
                    signal.type === "performance" && "bg-blue-100",
                    signal.type === "inventory" && "bg-orange-100",
                    signal.type === "competitor" && "bg-red-100",
                  )}>
                    {signal.type === "trend" && <TrendingUp size={16} className="text-purple-600" />}
                    {signal.type === "performance" && <BarChart3 size={16} className="text-blue-600" />}
                    {signal.type === "inventory" && <ShoppingBag size={16} className="text-orange-600" />}
                    {signal.type === "competitor" && <Target size={16} className="text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{signal.brand}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", badge.color)}>{badge.label}</span>
                      <span className="text-[10px] text-muted">{signal.confidence}% confidence</span>
                    </div>
                    <p className="text-sm text-muted">{signal.signal}</p>
                    <p className="text-[10px] text-muted mt-1">{signal.timestamp}</p>
                  </div>
                  <button className="btn-secondary text-xs shrink-0">
                    <MessageSquare size={12} /> Add Note
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Season Notes */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          {showNoteForm && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">New Season Note</h3>
                <button onClick={() => setShowNoteForm(false)} className="p-1 rounded-md hover:bg-gray-100">
                  <X size={16} className="text-muted" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted block mb-1">Title</label>
                    <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Note title" />
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">Brand</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option>Select brand</option>
                      {mockBrandScores.map((b) => <option key={b.brand}>{b.brand}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">Season</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option>SS25</option>
                      <option>AW25</option>
                      <option>SS26</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Note Content</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Marketing insights and buying recommendations..." />
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary"><Save size={14} /> Save Note</button>
                  <button className="btn-secondary" onClick={() => setShowNoteForm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Season Notes</h3>
              {!showNoteForm && (
                <button className="btn-primary" onClick={() => setShowNoteForm(true)}><Plus size={14} /> New Note</button>
              )}
            </div>
            <div className="space-y-3">
              {mockNotes.map((note) => (
                <div key={note.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{note.title}</h4>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{note.season}</span>
                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">{note.brand}</span>
                      </div>
                      <p className="text-[10px] text-muted">{note.author} | {note.createdAt}</p>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-md hover:bg-gray-100"><Edit3 size={14} className="text-muted" /></button>
                      <button className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={14} className="text-muted" /></button>
                    </div>
                  </div>
                  <p className="text-sm text-muted">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
