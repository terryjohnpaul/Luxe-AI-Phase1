"use client";

import { useState } from "react";
import {
  Mail,
  MessageSquare,
  Plus,
  Play,
  Pause,
  Edit3,
  Eye,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Users,
  ShoppingBag,
  Gift,
  RefreshCw,
  Heart,
  Star,
  AlertTriangle,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  trigger: string;
  channels: ("email" | "sms")[];
  steps: number;
  activeSubs: number;
  openRate: number;
  conversionRate: number;
  revenue: number;
  status: "active" | "draft" | "paused";
}

interface FlowStep {
  id: string;
  delay: string;
  channel: "email" | "sms";
  subject: string;
  archetypeVariation: boolean;
  openRate: number;
  clickRate: number;
}

const flowTemplates: FlowTemplate[] = [
  {
    id: "f1", name: "Welcome Series",
    description: "5-step onboarding flow for new customers. Introduces brand story, style quiz, and first purchase incentive.",
    icon: Sparkles, color: "blue", trigger: "Account creation / First purchase",
    channels: ["email", "sms"], steps: 5, activeSubs: 4200, openRate: 62, conversionRate: 18, revenue: 1840000, status: "active",
  },
  {
    id: "f2", name: "Browse Abandonment",
    description: "Triggers when a user views products but doesn't add to cart. Shows viewed items with styling suggestions.",
    icon: Eye, color: "orange", trigger: "Product view without cart add (30min)",
    channels: ["email"], steps: 3, activeSubs: 8600, openRate: 48, conversionRate: 8, revenue: 920000, status: "active",
  },
  {
    id: "f3", name: "Cart Abandonment",
    description: "3-step recovery: reminder, urgency, incentive. Personalized by archetype. Highest-revenue automation.",
    icon: ShoppingBag, color: "red", trigger: "Cart abandoned for 1 hour",
    channels: ["email", "sms"], steps: 3, activeSubs: 3400, openRate: 54, conversionRate: 22, revenue: 3200000, status: "active",
  },
  {
    id: "f4", name: "Post-Purchase",
    description: "Order confirmation, shipping updates, care instructions, review request, and cross-sell recommendations.",
    icon: TrendingUp, color: "green", trigger: "Order confirmed",
    channels: ["email", "sms"], steps: 5, activeSubs: 6800, openRate: 72, conversionRate: 12, revenue: 1420000, status: "active",
  },
  {
    id: "f5", name: "Back in Stock",
    description: "Notifies waitlisted customers when a sold-out product is restocked. Urgency-driven with limited quantity messaging.",
    icon: AlertTriangle, color: "purple", trigger: "Product restocked (from waitlist)",
    channels: ["email", "sms"], steps: 2, activeSubs: 1200, openRate: 78, conversionRate: 32, revenue: 680000, status: "active",
  },
  {
    id: "f6", name: "Seasonal Campaign",
    description: "Timed campaigns for monsoon, festive, summer, and winter seasons. Pre-built creative per season.",
    icon: Clock, color: "orange", trigger: "Seasonal schedule (manual trigger)",
    channels: ["email"], steps: 4, activeSubs: 12400, openRate: 38, conversionRate: 6, revenue: 1680000, status: "active",
  },
  {
    id: "f7", name: "Win-Back",
    description: "Re-engages customers who haven't purchased in 60+ days. Escalating incentives based on CLV tier.",
    icon: RefreshCw, color: "blue", trigger: "No purchase for 60 days",
    channels: ["email", "sms"], steps: 4, activeSubs: 5200, openRate: 34, conversionRate: 8, revenue: 920000, status: "active",
  },
  {
    id: "f8", name: "Birthday",
    description: "Sends birthday greeting with exclusive discount. Personalized gift recommendations by archetype.",
    icon: Gift, color: "red", trigger: "7 days before birthday",
    channels: ["email", "sms"], steps: 3, activeSubs: 840, openRate: 82, conversionRate: 28, revenue: 480000, status: "active",
  },
  {
    id: "f9", name: "CLV Milestone",
    description: "Celebrates spending milestones (INR 50K, 1L, 2L, 5L). Upgrades to VIP tier with exclusive perks.",
    icon: Star, color: "purple", trigger: "Cumulative spend crosses milestone",
    channels: ["email"], steps: 2, activeSubs: 320, openRate: 76, conversionRate: 42, revenue: 540000, status: "active",
  },
  {
    id: "f10", name: "Churn Prevention",
    description: "AI-detected churn risk triggers personalized re-engagement. Decreasing engagement score below threshold.",
    icon: Heart, color: "red", trigger: "Churn risk score > 0.7",
    channels: ["email", "sms"], steps: 4, activeSubs: 1800, openRate: 28, conversionRate: 5, revenue: 320000, status: "active",
  },
];

const sampleFlowSteps: FlowStep[] = [
  { id: "s1", delay: "1 hour", channel: "email", subject: "You left something beautiful in your cart", archetypeVariation: true, openRate: 58, clickRate: 22 },
  { id: "s2", delay: "24 hours", channel: "sms", subject: "Your cart items are selling fast!", archetypeVariation: false, openRate: 0, clickRate: 14 },
  { id: "s3", delay: "48 hours", channel: "email", subject: "Here's 10% off to complete your purchase", archetypeVariation: true, openRate: 46, clickRate: 18 },
];

function formatInr(amount: number): string {
  if (amount >= 100000) return `INR ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `INR ${(amount / 1000).toFixed(1)}K`;
  return `INR ${amount.toLocaleString("en-IN")}`;
}

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState<"flows" | "builder">("flows");
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);

  const totalRevenue = flowTemplates.reduce((s, f) => s + f.revenue, 0);
  const totalSubs = flowTemplates.reduce((s, f) => s + f.activeSubs, 0);
  const activeFlows = flowTemplates.filter((f) => f.status === "active").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email / SMS Automation</h1>
          <p className="text-sm text-muted mt-1">
            10 pre-built automation flows with archetype-level personalization. Each flow adapts content, timing, and offers by customer type.
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={16} /> Create Flow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="stat-card stat-card-blue">
          <p className="text-xs text-muted font-medium">Active Flows</p>
          <p className="text-2xl font-bold mt-1">{activeFlows}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-xs text-muted font-medium">Total Revenue (MTD)</p>
          <p className="text-2xl font-bold mt-1">{formatInr(totalRevenue)}</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} /> 18% vs last month</p>
        </div>
        <div className="stat-card stat-card-purple">
          <p className="text-xs text-muted font-medium">Active Subscribers</p>
          <p className="text-2xl font-bold mt-1">{totalSubs.toLocaleString()}</p>
        </div>
        <div className="stat-card stat-card-orange">
          <p className="text-xs text-muted font-medium">Avg Open Rate</p>
          <p className="text-2xl font-bold mt-1">56.2%</p>
        </div>
        <div className="stat-card stat-card-navy">
          <p className="text-xs text-muted font-medium">Avg Conversion</p>
          <p className="text-2xl font-bold mt-1">14.8%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["flows", "builder"] as const).map((tab) => (
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
            {tab === "flows" ? "Automation Flows" : "Flow Builder"}
          </button>
        ))}
      </div>

      {/* Flows Tab */}
      {activeTab === "flows" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {flowTemplates.map((flow) => {
              const Icon = flow.icon;
              const isSelected = selectedFlow === flow.id;
              return (
                <div
                  key={flow.id}
                  className={cn(
                    "glass-card p-5 cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-brand-blue"
                  )}
                  onClick={() => setSelectedFlow(isSelected ? null : flow.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-brand-${flow.color}/10`}>
                        <Icon size={20} className={`text-brand-${flow.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{flow.name}</h3>
                        <p className="text-xs text-muted">{flow.steps} steps | {flow.channels.join(" + ").toUpperCase()}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      flow.status === "active" && "bg-green-100 text-green-700",
                      flow.status === "draft" && "bg-yellow-100 text-yellow-700",
                      flow.status === "paused" && "bg-gray-100 text-gray-600",
                    )}>
                      {flow.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted mb-3">{flow.description}</p>

                  <div className="text-xs text-muted mb-3">
                    <span className="font-medium text-text">Trigger:</span> {flow.trigger}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-[10px] text-muted">Subscribers</p>
                      <p className="text-sm font-bold">{flow.activeSubs.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-[10px] text-muted">Open Rate</p>
                      <p className="text-sm font-bold">{flow.openRate}%</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-[10px] text-muted">Conversion</p>
                      <p className="text-sm font-bold text-green-600">{flow.conversionRate}%</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-[10px] text-muted">Revenue</p>
                      <p className="text-sm font-bold">{formatInr(flow.revenue)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flow Builder Tab */}
      {activeTab === "builder" && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Flow Builder: Cart Abandonment (Example)</h3>
            <div className="space-y-4">
              {/* Trigger */}
              <div className="flex items-center gap-3 p-4 border-2 border-blue-200 bg-blue-50 rounded-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Trigger: Cart Abandoned</p>
                  <p className="text-xs text-muted">Fires when cart value &gt; INR 2,000 and no checkout within 1 hour</p>
                </div>
              </div>

              {/* Steps */}
              {sampleFlowSteps.map((step, idx) => (
                <div key={step.id}>
                  <div className="flex items-center gap-2 pl-8 py-2">
                    <div className="w-px h-6 bg-gray-300" />
                    <Clock size={12} className="text-muted" />
                    <span className="text-xs text-muted">Wait {step.delay}</span>
                  </div>
                  <div className="flex items-start gap-3 p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={cn(
                      "p-2 rounded-lg",
                      step.channel === "email" ? "bg-blue-100" : "bg-green-100"
                    )}>
                      {step.channel === "email" ? <Mail size={18} className="text-blue-600" /> : <MessageSquare size={18} className="text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium uppercase bg-gray-100 px-2 py-0.5 rounded">{step.channel}</span>
                        <span className="text-xs text-muted">Step {idx + 1}</span>
                        {step.archetypeVariation && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Users size={8} /> Archetype Variations
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">{step.subject}</p>
                      <div className="flex items-center gap-4 mt-2">
                        {step.channel === "email" && <span className="text-xs text-muted">Open: {step.openRate}%</span>}
                        <span className="text-xs text-muted">Click: {step.clickRate}%</span>
                      </div>
                    </div>
                    <button className="p-1.5 rounded-md hover:bg-gray-100"><Edit3 size={14} className="text-muted" /></button>
                  </div>
                </div>
              ))}

              <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-muted hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Add Step
              </button>
            </div>
          </div>

          {/* Archetype Variations */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Archetype Content Variations</h3>
            <p className="text-sm text-muted mb-4">Each step can have different content per archetype. The AI auto-generates variations based on the base template.</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted">Archetype</th>
                  <th className="pb-3 font-medium text-muted">Subject Line</th>
                  <th className="pb-3 font-medium text-muted">Offer</th>
                  <th className="pb-3 font-medium text-muted">Tone</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-3 font-medium">Fashion Loyalist</td>
                  <td className="py-3 text-muted">Your curated selection is waiting</td>
                  <td className="py-3">No discount (full price appeal)</td>
                  <td className="py-3 text-xs">Exclusive, aspirational</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Urban Achiever</td>
                  <td className="py-3 text-muted">Complete your professional wardrobe</td>
                  <td className="py-3">Free express delivery</td>
                  <td className="py-3 text-xs">Professional, efficient</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Splurger</td>
                  <td className="py-3 text-muted">Don't miss out - selling fast!</td>
                  <td className="py-3">Urgency + limited stock</td>
                  <td className="py-3 text-xs">Exciting, FOMO-driven</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Aspirant</td>
                  <td className="py-3 text-muted">Here's 10% off to get you started</td>
                  <td className="py-3">10% discount + EMI option</td>
                  <td className="py-3 text-xs">Friendly, value-focused</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
