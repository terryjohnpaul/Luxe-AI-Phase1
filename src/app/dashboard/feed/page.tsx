"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  Package,
  TrendingUp,
  ArrowUpRight,
  Edit3,
  Plus,
  Eye,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FeedProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  salePrice?: number;
  status: "optimized" | "needs_review" | "error";
  customLabels: string[];
  availability: "in_stock" | "low_stock" | "out_of_stock";
  stockQty: number;
  lastOptimized: string;
}

interface FeedRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  productsAffected: number;
  status: "active" | "paused";
}

const mockProducts: FeedProduct[] = [
  { id: "p1", name: "Ami Paris Tiger Jacket", brand: "Ami Paris", category: "Jackets", price: 48500, status: "optimized", customLabels: ["trending", "high_margin", "new_arrival"], availability: "in_stock", stockQty: 24, lastOptimized: "2h ago" },
  { id: "p2", name: "Hugo Boss Slim Polo", brand: "Hugo Boss", category: "Polos", price: 8900, status: "needs_review", customLabels: ["low_stock", "bestseller"], availability: "low_stock", stockQty: 4, lastOptimized: "6h ago" },
  { id: "p3", name: "Kenzo Tiger Tee", brand: "Kenzo", category: "T-Shirts", price: 12400, salePrice: 10540, status: "optimized", customLabels: ["trending", "on_sale"], availability: "in_stock", stockQty: 12, lastOptimized: "1h ago" },
  { id: "p4", name: "Michael Kors Jet Set Tote", brand: "Michael Kors", category: "Bags", price: 24800, status: "optimized", customLabels: ["high_margin", "bestseller"], availability: "in_stock", stockQty: 38, lastOptimized: "3h ago" },
  { id: "p5", name: "Coach Tabby Shoulder Bag", brand: "Coach", category: "Bags", price: 32600, status: "optimized", customLabels: ["new_arrival", "high_margin"], availability: "in_stock", stockQty: 16, lastOptimized: "4h ago" },
  { id: "p6", name: "Diesel D-Strukt Jeans", brand: "Diesel", category: "Jeans", price: 14200, status: "error", customLabels: ["missing_image"], availability: "in_stock", stockQty: 42, lastOptimized: "Never" },
  { id: "p7", name: "All Saints Dalby Leather Jacket", brand: "All Saints", category: "Jackets", price: 38900, status: "optimized", customLabels: ["high_margin", "premium"], availability: "in_stock", stockQty: 8, lastOptimized: "2h ago" },
  { id: "p8", name: "Farm Rio Tropical Maxi Dress", brand: "Farm Rio", category: "Dresses", price: 18600, status: "needs_review", customLabels: ["seasonal", "new_arrival"], availability: "in_stock", stockQty: 22, lastOptimized: "12h ago" },
  { id: "p9", name: "Cult Gaia Ark Bag", brand: "Cult Gaia", category: "Bags", price: 28400, status: "optimized", customLabels: ["premium", "bestseller"], availability: "in_stock", stockQty: 6, lastOptimized: "1h ago" },
  { id: "p10", name: "Hugo Boss Stretch Chinos", brand: "Hugo Boss", category: "Trousers", price: 11200, status: "optimized", customLabels: ["evergreen", "staple"], availability: "out_of_stock", stockQty: 0, lastOptimized: "8h ago" },
];

const mockRules: FeedRule[] = [
  { id: "r1", name: "Auto-label trending products", condition: "Google Trends score > 2x baseline", action: "Add 'trending' custom label", productsAffected: 14, status: "active" },
  { id: "r2", name: "Low stock alert", condition: "Inventory < 5 units", action: "Add 'low_stock' label + pause ads", productsAffected: 3, status: "active" },
  { id: "r3", name: "High margin tagger", condition: "Margin > 60%", action: "Add 'high_margin' label + boost priority", productsAffected: 28, status: "active" },
  { id: "r4", name: "New arrival window", condition: "Added within last 14 days", action: "Add 'new_arrival' label", productsAffected: 18, status: "active" },
  { id: "r5", name: "Seasonal auto-tag", condition: "Category matches current season", action: "Add seasonal label", productsAffected: 42, status: "active" },
  { id: "r6", name: "Missing image check", condition: "Primary image URL returns 404", action: "Flag error + pause from feed", productsAffected: 2, status: "active" },
  { id: "r7", name: "Sale price validator", condition: "Sale price > regular price", action: "Flag error + remove sale price", productsAffected: 0, status: "paused" },
];

const labelDistribution = [
  { label: "trending", count: 14, color: "bg-red-100 text-red-700" },
  { label: "high_margin", count: 28, color: "bg-green-100 text-green-700" },
  { label: "bestseller", count: 22, color: "bg-purple-100 text-purple-700" },
  { label: "new_arrival", count: 18, color: "bg-blue-100 text-blue-700" },
  { label: "low_stock", count: 3, color: "bg-orange-100 text-orange-700" },
  { label: "seasonal", count: 42, color: "bg-yellow-100 text-yellow-700" },
  { label: "premium", count: 16, color: "bg-indigo-100 text-indigo-700" },
  { label: "on_sale", count: 8, color: "bg-pink-100 text-pink-700" },
];

function formatInr(amount: number): string {
  if (amount >= 100000) return `INR ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `INR ${(amount / 1000).toFixed(1)}K`;
  return `INR ${amount.toLocaleString("en-IN")}`;
}

export default function FeedPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"products" | "rules">("products");

  const totalProducts = mockProducts.length;
  const optimizedCount = mockProducts.filter((p) => p.status === "optimized").length;
  const activeCount = mockProducts.filter((p) => p.availability !== "out_of_stock").length;

  const filteredProducts = mockProducts.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.brand.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feed Intelligence</h1>
          <p className="text-sm text-muted mt-1">
            Product feed optimization, custom label management, and real-time feed health monitoring.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><RefreshCw size={14} /> Sync Feed</button>
          <button className="btn-primary"><Plus size={14} /> Add Rule</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="stat-card stat-card-blue">
          <p className="text-xs text-muted font-medium">Total Products</p>
          <p className="text-2xl font-bold mt-1">2,847</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-xs text-muted font-medium">Optimized</p>
          <p className="text-2xl font-bold mt-1">92.4%</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} /> +3.2%</p>
        </div>
        <div className="stat-card stat-card-purple">
          <p className="text-xs text-muted font-medium">Active in Feed</p>
          <p className="text-2xl font-bold mt-1">88.1%</p>
        </div>
        <div className="stat-card stat-card-orange">
          <p className="text-xs text-muted font-medium">Needs Review</p>
          <p className="text-2xl font-bold mt-1">124</p>
        </div>
        <div className="stat-card stat-card-red">
          <p className="text-xs text-muted font-medium">Errors</p>
          <p className="text-2xl font-bold mt-1">18</p>
        </div>
      </div>

      {/* Custom Label Distribution */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Custom Label Distribution</h2>
        <div className="flex flex-wrap gap-3">
          {labelDistribution.map((item) => (
            <div key={item.label} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", item.color)}>
                {item.label}
              </span>
              <span className="text-sm font-bold">{item.count}</span>
              <span className="text-xs text-muted">products</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["products", "rules"] as const).map((tab) => (
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
            {tab === "products" ? "Product Feed" : "Optimization Rules"}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search products or brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 border rounded-lg text-sm w-72"
                />
              </div>
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="optimized">Optimized</option>
                <option value="needs_review">Needs Review</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Product</th>
                <th className="pb-3 font-medium text-muted">Brand</th>
                <th className="pb-3 font-medium text-muted">Price</th>
                <th className="pb-3 font-medium text-muted">Stock</th>
                <th className="pb-3 font-medium text-muted">Labels</th>
                <th className="pb-3 font-medium text-muted">Status</th>
                <th className="pb-3 font-medium text-muted">Last Optimized</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted">{product.category}</p>
                  </td>
                  <td className="py-3 text-muted">{product.brand}</td>
                  <td className="py-3">
                    {product.salePrice ? (
                      <div>
                        <span className="font-medium">{formatInr(product.salePrice)}</span>
                        <span className="text-xs text-muted line-through ml-1">{formatInr(product.price)}</span>
                      </div>
                    ) : (
                      <span className="font-medium">{formatInr(product.price)}</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      product.availability === "in_stock" && "bg-green-100 text-green-700",
                      product.availability === "low_stock" && "bg-orange-100 text-orange-700",
                      product.availability === "out_of_stock" && "bg-red-100 text-red-700",
                    )}>
                      {product.stockQty} units
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.customLabels.map((label) => (
                        <span key={label} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{label}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit",
                      product.status === "optimized" && "bg-green-100 text-green-700",
                      product.status === "needs_review" && "bg-yellow-100 text-yellow-700",
                      product.status === "error" && "bg-red-100 text-red-700",
                    )}>
                      {product.status === "optimized" && <CheckCircle2 size={10} />}
                      {product.status === "needs_review" && <AlertTriangle size={10} />}
                      {product.status === "error" && <XCircle size={10} />}
                      {product.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-muted">{product.lastOptimized}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Feed Optimization Rules</h3>
            <button className="btn-primary"><Plus size={14} /> New Rule</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Rule Name</th>
                <th className="pb-3 font-medium text-muted">Condition</th>
                <th className="pb-3 font-medium text-muted">Action</th>
                <th className="pb-3 font-medium text-muted">Products Affected</th>
                <th className="pb-3 font-medium text-muted">Status</th>
                <th className="pb-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{rule.name}</td>
                  <td className="py-3 text-muted text-xs">{rule.condition}</td>
                  <td className="py-3 text-xs">{rule.action}</td>
                  <td className="py-3">{rule.productsAffected}</td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      rule.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    )}>
                      {rule.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
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
    </div>
  );
}
