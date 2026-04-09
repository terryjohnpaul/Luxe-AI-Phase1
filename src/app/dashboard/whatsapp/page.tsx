"use client";

import { useState } from "react";
import {
  MessageCircle,
  Send,
  Users,
  Crown,
  Clock,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  Star,
  Plus,
  Search,
  Edit3,
  Eye,
  Sparkles,
  Phone,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Conversation {
  id: string;
  customerName: string;
  city: string;
  archetype: string;
  clv: number;
  lastMessage: string;
  timestamp: string;
  status: "waiting" | "active" | "resolved";
  priority: "vip" | "high" | "normal";
  unread: number;
  intent: string;
}

interface BroadcastTemplate {
  id: string;
  name: string;
  type: string;
  message: string;
  sentCount: number;
  openRate: number;
  ctr: number;
  status: "active" | "draft" | "completed";
}

const mockConversations: Conversation[] = [
  { id: "c1", customerName: "Priya Mehta", city: "Mumbai", archetype: "Fashion Loyalist", clv: 345000, lastMessage: "I'm looking for something like the Ami Paris jacket but in navy", timestamp: "2 min ago", status: "waiting", priority: "vip", unread: 3, intent: "Product Discovery" },
  { id: "c2", customerName: "Arjun Singh", city: "Delhi NCR", archetype: "Splurger", clv: 280000, lastMessage: "When will the Kenzo tiger tee be back in stock in XL?", timestamp: "5 min ago", status: "waiting", priority: "vip", unread: 1, intent: "Stock Inquiry" },
  { id: "c3", customerName: "Neha Kapoor", city: "Bangalore", archetype: "Urban Achiever", clv: 168000, lastMessage: "Can you help me put together a workwear capsule?", timestamp: "12 min ago", status: "active", priority: "high", unread: 0, intent: "Styling Request" },
  { id: "c4", customerName: "Rohit Sharma", city: "Hyderabad", archetype: "Urban Achiever", clv: 142000, lastMessage: "What are the new Hugo Boss arrivals?", timestamp: "18 min ago", status: "active", priority: "high", unread: 0, intent: "New Arrivals" },
  { id: "c5", customerName: "Anita Desai", city: "Jaipur", archetype: "Aspirant", clv: 52000, lastMessage: "Is there any sale coming up for Coach bags?", timestamp: "25 min ago", status: "waiting", priority: "normal", unread: 2, intent: "Price Inquiry" },
  { id: "c6", customerName: "Kabir Patel", city: "Pune", archetype: "Fashion Loyalist", clv: 420000, lastMessage: "Thanks! The jacket fits perfectly. Ordering the matching trousers now.", timestamp: "1 hr ago", status: "resolved", priority: "vip", unread: 0, intent: "Repeat Purchase" },
  { id: "c7", customerName: "Meera Nair", city: "Chennai", archetype: "Aspirant", clv: 38000, lastMessage: "Do you have EMI options for the All Saints jacket?", timestamp: "2 hr ago", status: "waiting", priority: "normal", unread: 1, intent: "Payment Query" },
];

const mockTemplates: BroadcastTemplate[] = [
  { id: "t1", name: "New Arrival Alert: Ami Paris SS25", type: "Product Launch", message: "New arrivals just dropped! The Ami Paris SS25 collection is now live. Explore tiger jackets, polos, and sneakers crafted for the modern fashion connoisseur.", sentCount: 4200, openRate: 78, ctr: 24, status: "completed" },
  { id: "t2", name: "VIP Early Access: End of Season", type: "Sale Alert", message: "As a valued VIP customer, you get 48-hour early access to our end-of-season sale. Up to 40% off on Hugo Boss, Kenzo, and Coach.", sentCount: 890, openRate: 82, ctr: 38, status: "active" },
  { id: "t3", name: "Back in Stock: Kenzo Tiger Tee", type: "Restock Alert", message: "Great news! The Kenzo Tiger Tee you were eyeing is back in stock. Limited quantities available. Tap to shop before it sells out again.", sentCount: 340, openRate: 86, ctr: 42, status: "completed" },
  { id: "t4", name: "Monsoon Essentials", type: "Seasonal", message: "Rain-ready fashion is here! Explore our curated monsoon collection featuring waterproof jackets, sleek umbrellas, and quick-dry essentials.", sentCount: 0, openRate: 0, ctr: 0, status: "draft" },
  { id: "t5", name: "Birthday Special: Personal Offer", type: "Birthday", message: "Happy Birthday! Here's an exclusive 20% off on your next purchase, plus complimentary gift wrapping. Valid for 7 days.", sentCount: 128, openRate: 92, ctr: 56, status: "active" },
];

const stylingAssistantMessages = [
  { role: "customer" as const, text: "I have a wedding in Udaipur next month. Need outfits for mehendi and cocktail night." },
  { role: "ai" as const, text: "Congratulations! For a Udaipur wedding, I'd love to help. Here's what I'm thinking:\n\nMehendi: Farm Rio Tropical Maxi Dress (INR 18,600) - perfect colors for a daytime celebration.\n\nCocktail: Ami Paris Embroidered Blazer (INR 42,500) paired with slim-fit Hugo Boss trousers (INR 11,200).\n\nShall I show you these with accessories?" },
  { role: "customer" as const, text: "Love the cocktail idea! Show me the blazer and maybe matching shoes?" },
  { role: "ai" as const, text: "Great taste! Here's the full cocktail look:\n\n1. Ami Paris Embroidered Blazer - INR 42,500\n2. Hugo Boss Slim Chinos (Navy) - INR 11,200\n3. Coach Leather Loafers - INR 18,800\n4. Kenzo Pocket Square - INR 4,200\n\nTotal: INR 76,700\n\nThis ensemble has a 94% style match for your Fashion Loyalist profile. Shall I add these to your cart?" },
];

function formatInr(amount: number): string {
  if (amount >= 100000) return `INR ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `INR ${(amount / 1000).toFixed(1)}K`;
  return `INR ${amount.toLocaleString("en-IN")}`;
}

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<"queue" | "assistant" | "broadcasts" | "stats">("queue");
  const [searchQuery, setSearchQuery] = useState("");

  const waitingCount = mockConversations.filter((c) => c.status === "waiting").length;
  const vipCount = mockConversations.filter((c) => c.priority === "vip").length;

  const filteredConversations = mockConversations
    .filter((c) => !searchQuery || c.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const priorityOrder = { vip: 0, high: 1, normal: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || b.clv - a.clv;
    });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Commerce Hub</h1>
          <p className="text-sm text-muted mt-1">
            CLV-sorted conversation queue, AI styling assistant, broadcast manager, and commerce analytics.
          </p>
        </div>
        <button className="btn-primary">
          <Send size={16} /> New Broadcast
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="stat-card stat-card-green">
          <p className="text-xs text-muted font-medium">Active Conversations</p>
          <p className="text-2xl font-bold mt-1">{mockConversations.filter(c => c.status !== "resolved").length}</p>
        </div>
        <div className="stat-card stat-card-red">
          <p className="text-xs text-muted font-medium">Waiting</p>
          <p className="text-2xl font-bold mt-1">{waitingCount}</p>
        </div>
        <div className="stat-card stat-card-purple">
          <p className="text-xs text-muted font-medium">VIP in Queue</p>
          <p className="text-2xl font-bold mt-1">{vipCount}</p>
        </div>
        <div className="stat-card stat-card-blue">
          <p className="text-xs text-muted font-medium">Revenue (Today)</p>
          <p className="text-2xl font-bold mt-1">INR 4.8L</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} /> 22% vs avg</p>
        </div>
        <div className="stat-card stat-card-orange">
          <p className="text-xs text-muted font-medium">AI Assist Rate</p>
          <p className="text-2xl font-bold mt-1">68%</p>
          <p className="text-xs text-muted mt-1">conversations handled by AI</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: "queue", label: "Conversation Queue" },
          { key: "assistant", label: "AI Styling Assistant" },
          { key: "broadcasts", label: "Broadcast Manager" },
          { key: "stats", label: "Commerce Stats" },
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

      {/* Conversation Queue */}
      {activeTab === "queue" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Conversations (CLV-sorted)</h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 border rounded-lg text-sm w-64"
              />
            </div>
          </div>
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <div key={conv.id} className={cn(
                "flex items-center gap-4 p-4 rounded-lg border cursor-pointer hover:shadow-sm transition-all",
                conv.status === "waiting" && "bg-orange-50/50 border-orange-200",
                conv.status === "active" && "bg-white border-gray-200",
                conv.status === "resolved" && "bg-gray-50 border-gray-200 opacity-60",
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{conv.customerName}</span>
                    {conv.priority === "vip" && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Crown size={8} /> VIP
                      </span>
                    )}
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">{conv.archetype}</span>
                    <span className="text-[10px] text-muted">{conv.city}</span>
                  </div>
                  <p className="text-sm text-muted truncate">{conv.lastMessage}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted flex items-center gap-1"><Clock size={10} /> {conv.timestamp}</span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{conv.intent}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted">CLV</p>
                  <p className="text-sm font-bold">{formatInr(conv.clv)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {conv.unread}
                    </span>
                  )}
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    conv.status === "waiting" && "bg-orange-100 text-orange-700",
                    conv.status === "active" && "bg-green-100 text-green-700",
                    conv.status === "resolved" && "bg-gray-100 text-gray-600",
                  )}>
                    {conv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Styling Assistant Demo */}
      {activeTab === "assistant" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot size={18} className="text-brand-blue" />
              <h3 className="font-semibold">AI Styling Assistant Demo</h3>
            </div>
            <div className="space-y-4 mb-4">
              {stylingAssistantMessages.map((msg, i) => (
                <div key={i} className={cn(
                  "p-3 rounded-lg text-sm",
                  msg.role === "customer" ? "bg-gray-100 ml-8" : "bg-blue-50 border border-blue-200 mr-8"
                )}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {msg.role === "ai" ? (
                      <span className="text-[10px] font-medium text-blue-600">AI Stylist</span>
                    ) : (
                      <span className="text-[10px] font-medium text-gray-600">Customer</span>
                    )}
                  </div>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Type a message..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button className="btn-primary"><Send size={14} /></button>
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">AI Capabilities</h3>
            <div className="space-y-3">
              {[
                { title: "Product Recommendations", desc: "AI suggests products based on archetype, past purchases, and current trends." },
                { title: "Outfit Building", desc: "Creates complete outfit suggestions with complementary items and accessories." },
                { title: "Size & Fit Guidance", desc: "Uses purchase history to recommend correct sizes across brands." },
                { title: "Price Negotiation", desc: "Offers personalized discounts within approved margin thresholds based on CLV." },
                { title: "Order Tracking", desc: "Real-time order status updates and delivery estimates." },
                { title: "Styling for Occasions", desc: "Event-specific recommendations: weddings, parties, office, travel." },
              ].map((cap, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">{cap.title}</p>
                  <p className="text-xs text-muted">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Manager */}
      {activeTab === "broadcasts" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Broadcast Templates</h3>
            <button className="btn-primary"><Plus size={14} /> New Template</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Template</th>
                <th className="pb-3 font-medium text-muted">Type</th>
                <th className="pb-3 font-medium text-muted">Sent</th>
                <th className="pb-3 font-medium text-muted">Open Rate</th>
                <th className="pb-3 font-medium text-muted">CTR</th>
                <th className="pb-3 font-medium text-muted">Status</th>
                <th className="pb-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockTemplates.map((tpl) => (
                <tr key={tpl.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <p className="font-medium">{tpl.name}</p>
                    <p className="text-xs text-muted truncate max-w-xs">{tpl.message}</p>
                  </td>
                  <td className="py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{tpl.type}</span></td>
                  <td className="py-3">{tpl.sentCount.toLocaleString()}</td>
                  <td className="py-3">{tpl.openRate > 0 ? `${tpl.openRate}%` : "—"}</td>
                  <td className="py-3">{tpl.ctr > 0 ? `${tpl.ctr}%` : "—"}</td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      tpl.status === "active" && "bg-green-100 text-green-700",
                      tpl.status === "draft" && "bg-yellow-100 text-yellow-700",
                      tpl.status === "completed" && "bg-gray-100 text-gray-600",
                    )}>
                      {tpl.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {tpl.status === "draft" && <button className="btn-approve text-xs">Send</button>}
                      <button className="p-1.5 rounded-md hover:bg-gray-100"><Edit3 size={14} className="text-muted" /></button>
                      <button className="p-1.5 rounded-md hover:bg-gray-100"><Eye size={14} className="text-muted" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Commerce Stats */}
      {activeTab === "stats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-3">Conversations Today</h3>
              <div className="space-y-2">
                {[
                  { label: "Total", value: "48" },
                  { label: "AI Handled", value: "33 (68%)" },
                  { label: "Human Escalated", value: "15 (32%)" },
                  { label: "Avg Response Time", value: "12s (AI) / 4m (Human)" },
                  { label: "CSAT Score", value: "4.6 / 5.0" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-3">Commerce via WhatsApp</h3>
              <div className="space-y-2">
                {[
                  { label: "Orders Today", value: "24" },
                  { label: "Revenue Today", value: "INR 4.8L" },
                  { label: "Avg Order Value", value: "INR 20.2K" },
                  { label: "Cart Recovery Rate", value: "34%" },
                  { label: "Upsell Success", value: "28%" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-3">Top Intents</h3>
              <div className="space-y-2">
                {[
                  { intent: "Product Discovery", pct: 32 },
                  { intent: "Styling Request", pct: 24 },
                  { intent: "Stock Inquiry", pct: 18 },
                  { intent: "Price / Sale Query", pct: 14 },
                  { intent: "Order Tracking", pct: 8 },
                  { intent: "Returns / Exchange", pct: 4 },
                ].map((item) => (
                  <div key={item.intent} className="flex items-center gap-2">
                    <span className="text-xs w-32">{item.intent}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-blue rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
