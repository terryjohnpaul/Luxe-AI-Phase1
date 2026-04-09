"use client";

import { useState } from "react";
import {
  GitBranch,
  ChevronRight,
  Edit3,
  Eye,
  MessageCircle,
  Image,
  Film,
  Mail,
  ShoppingBag,
  Clock,
  Users,
  TrendingUp,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RetargetingStage {
  id: string;
  name: string;
  dayRange: string;
  message: string;
  creativeType: string;
  platform: string;
  audienceSize: number;
  conversionRate: number;
  spend: number;
  color: string;
}

const stages: RetargetingStage[] = [
  {
    id: "s1",
    name: "Immediate Reminder",
    dayRange: "Day 1-3",
    message: "You left something beautiful behind. Complete your look with free express shipping.",
    creativeType: "Dynamic Product Ad",
    platform: "Meta Retarget + WhatsApp",
    audienceSize: 12400,
    conversionRate: 8.2,
    spend: 84000,
    color: "red",
  },
  {
    id: "s2",
    name: "Social Proof",
    dayRange: "Day 4-7",
    message: "This item is trending! 48 people viewed it today. Don't miss out.",
    creativeType: "Reel + UGC testimonial",
    platform: "Meta + Instagram Stories",
    audienceSize: 9800,
    conversionRate: 5.4,
    spend: 62000,
    color: "orange",
  },
  {
    id: "s3",
    name: "Styling Inspiration",
    dayRange: "Day 8-14",
    message: "Here's how our stylists would pair your saved items. Complete the outfit.",
    creativeType: "Carousel (styled outfits)",
    platform: "Meta + Email",
    audienceSize: 7200,
    conversionRate: 3.8,
    spend: 48000,
    color: "purple",
  },
  {
    id: "s4",
    name: "Gentle Incentive",
    dayRange: "Day 15-30",
    message: "We've held your selection. Here's 10% off to make it yours. Offer expires in 48h.",
    creativeType: "Static + WhatsApp message",
    platform: "Meta + WhatsApp + Email",
    audienceSize: 5400,
    conversionRate: 4.6,
    spend: 36000,
    color: "blue",
  },
  {
    id: "s5",
    name: "Alternative Discovery",
    dayRange: "Day 31-60",
    message: "Since you liked [product], you might love these new arrivals in similar style.",
    creativeType: "Dynamic recommendations",
    platform: "Meta ASC + Email",
    audienceSize: 3800,
    conversionRate: 2.1,
    spend: 24000,
    color: "green",
  },
  {
    id: "s6",
    name: "Last Chance",
    dayRange: "Day 61-90",
    message: "It's been a while! Here's an exclusive 15% off + free gift wrapping on your next order.",
    creativeType: "Video testimonial + offer",
    platform: "Email + WhatsApp VIP",
    audienceSize: 2200,
    conversionRate: 1.8,
    spend: 12000,
    color: "navy",
  },
];

function formatInr(amount: number): string {
  if (amount >= 100000) return `INR ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `INR ${(amount / 1000).toFixed(1)}K`;
  return `INR ${amount.toLocaleString("en-IN")}`;
}

export default function RetargetingPage() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<string | null>(null);

  const totalAudience = stages.reduce((sum, s) => sum + s.audienceSize, 0);
  const totalSpend = stages.reduce((sum, s) => sum + s.spend, 0);
  const avgConversion = stages.reduce((sum, s) => sum + s.conversionRate, 0) / stages.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Retargeting Architect</h1>
          <p className="text-sm text-muted mt-1">
            6-stage retargeting cascade from Day 1 to Day 90. Each stage adapts messaging, creative, and channel based on time since last interaction.
          </p>
        </div>
        <button className="btn-primary">
          <Edit3 size={16} /> Edit Cascade
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card stat-card-blue">
          <p className="text-xs text-muted font-medium">Total in Cascade</p>
          <p className="text-2xl font-bold mt-1">{totalAudience.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} /> 8.4% this week</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-xs text-muted font-medium">Avg Conversion Rate</p>
          <p className="text-2xl font-bold mt-1">{avgConversion.toFixed(1)}%</p>
        </div>
        <div className="stat-card stat-card-purple">
          <p className="text-xs text-muted font-medium">Monthly Spend</p>
          <p className="text-2xl font-bold mt-1">{formatInr(totalSpend)}</p>
        </div>
        <div className="stat-card stat-card-orange">
          <p className="text-xs text-muted font-medium">Recovery Rate</p>
          <p className="text-2xl font-bold mt-1">24.8%</p>
          <p className="text-xs text-muted mt-1">of abandoned carts recovered</p>
        </div>
      </div>

      {/* Visual Cascade */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-6">Retargeting Cascade</h2>
        <div className="flex items-start gap-3">
          {stages.map((stage, idx) => (
            <div key={stage.id} className="flex items-start flex-1">
              <div
                className={cn(
                  "flex-1 rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md",
                  selectedStage === stage.id ? "ring-2 ring-brand-blue shadow-md" : "",
                  `border-brand-${stage.color === "navy" ? "blue" : stage.color}/30`
                )}
                onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
              >
                {/* Stage Header */}
                <div className={`text-[10px] font-bold uppercase tracking-wider text-brand-${stage.color === "navy" ? "blue" : stage.color} mb-2`}>
                  {stage.dayRange}
                </div>
                <h3 className="text-sm font-semibold mb-2">{stage.name}</h3>

                {/* Stage Stats */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted">Audience</span>
                    <span className="text-xs font-medium">{stage.audienceSize.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted">Conv. Rate</span>
                    <span className="text-xs font-medium text-green-600">{stage.conversionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted">Spend</span>
                    <span className="text-xs font-medium">{formatInr(stage.spend)}</span>
                  </div>
                </div>

                {/* Creative Type Badge */}
                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full block text-center truncate">
                  {stage.creativeType}
                </span>
              </div>
              {idx < stages.length - 1 && (
                <div className="flex items-center pt-12 mx-1">
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage Detail Panel */}
      {selectedStage && (() => {
        const stage = stages.find((s) => s.id === selectedStage)!;
        return (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider text-brand-${stage.color === "navy" ? "blue" : stage.color}`}>
                  {stage.dayRange}
                </span>
                <h2 className="text-lg font-semibold">{stage.name}</h2>
              </div>
              <button
                className="btn-secondary"
                onClick={() => setEditingStage(editingStage === stage.id ? null : stage.id)}
              >
                <Edit3 size={14} /> {editingStage === stage.id ? "Cancel Edit" : "Edit Stage"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted font-medium block mb-1">Message</label>
                  {editingStage === stage.id ? (
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      rows={3}
                      defaultValue={stage.message}
                    />
                  ) : (
                    <p className="text-sm bg-gray-50 rounded-lg p-3 italic">&quot;{stage.message}&quot;</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted font-medium block mb-1">Creative Type</label>
                  {editingStage === stage.id ? (
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" defaultValue={stage.creativeType}>
                      <option>Dynamic Product Ad</option>
                      <option>Reel + UGC testimonial</option>
                      <option>Carousel (styled outfits)</option>
                      <option>Static + WhatsApp message</option>
                      <option>Dynamic recommendations</option>
                      <option>Video testimonial + offer</option>
                    </select>
                  ) : (
                    <p className="text-sm">{stage.creativeType}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted font-medium block mb-1">Platform</label>
                  {editingStage === stage.id ? (
                    <div className="flex flex-wrap gap-2">
                      {["Meta Retarget", "Meta ASC", "Instagram Stories", "WhatsApp", "WhatsApp VIP", "Email", "Google"].map((p) => (
                        <label key={p} className="flex items-center gap-1.5 text-sm">
                          <input type="checkbox" defaultChecked={stage.platform.includes(p.split(" ")[0])} className="rounded" />
                          {p}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {stage.platform.split(" + ").map((p) => (
                        <span key={p} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
                {editingStage === stage.id && (
                  <div className="flex gap-2">
                    <button className="btn-primary">Save Changes</button>
                    <button className="btn-secondary" onClick={() => setEditingStage(null)}>Cancel</button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Audience Size</p>
                    <p className="text-lg font-bold">{stage.audienceSize.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Conversion Rate</p>
                    <p className="text-lg font-bold text-green-600">{stage.conversionRate}%</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Monthly Spend</p>
                    <p className="text-lg font-bold">{formatInr(stage.spend)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Revenue</p>
                    <p className="text-lg font-bold text-green-600">{formatInr(stage.spend * (stage.conversionRate / 100) * 18400)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted font-medium mb-2">Archetype Performance</p>
                  <div className="space-y-2">
                    {[
                      { name: "Fashion Loyalist", rate: stage.conversionRate * 1.4 },
                      { name: "Urban Achiever", rate: stage.conversionRate * 1.1 },
                      { name: "Splurger", rate: stage.conversionRate * 0.8 },
                      { name: "Aspirant", rate: stage.conversionRate * 0.7 },
                    ].map((arch) => (
                      <div key={arch.name} className="flex items-center gap-3">
                        <span className="text-xs w-28">{arch.name}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-blue rounded-full"
                            style={{ width: `${Math.min(arch.rate * 8, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-12 text-right">{arch.rate.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cascade Flow Summary */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Cascade Flow Summary</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 font-medium text-muted">Stage</th>
              <th className="pb-3 font-medium text-muted">Window</th>
              <th className="pb-3 font-medium text-muted">Creative Type</th>
              <th className="pb-3 font-medium text-muted">Platform</th>
              <th className="pb-3 font-medium text-muted">Audience</th>
              <th className="pb-3 font-medium text-muted">Conv. Rate</th>
              <th className="pb-3 font-medium text-muted">Spend</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stages.map((stage) => (
              <tr key={stage.id} className="hover:bg-gray-50">
                <td className="py-3 font-medium">{stage.name}</td>
                <td className="py-3">
                  <span className={`text-xs font-medium text-brand-${stage.color === "navy" ? "blue" : stage.color}`}>
                    {stage.dayRange}
                  </span>
                </td>
                <td className="py-3 text-muted">{stage.creativeType}</td>
                <td className="py-3 text-muted text-xs">{stage.platform}</td>
                <td className="py-3">{stage.audienceSize.toLocaleString()}</td>
                <td className="py-3 text-green-600 font-medium">{stage.conversionRate}%</td>
                <td className="py-3">{formatInr(stage.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
