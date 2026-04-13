"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, TrendingDown, TrendingUp, AlertTriangle, ShieldCheck,
  Copy, Filter, Loader2, Tag, CheckCircle, XCircle, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CompetitorPriceChange {
  id: string;
  competitor: string;
  brand: string;
  product: string;
  originalPrice: number;
  currentPrice: number;
  discountPercent: number;
  ourPrice: number;
  priceAdvantage: "we_are_cheaper" | "they_are_cheaper" | "same";
  detectedAt: string;
  adResponse: string;
}

interface ApiResponse {
  priceChanges: CompetitorPriceChange[];
  summary: {
    totalMonitored: number;
    weAreCheaper: number;
    theyAreCheaper: number;
    activeDiscounts: number;
    avgDiscount: number;
    biggestAdvantage: { brand: string; product: string; savings: number };
  };
}

type PriceFilter = "all" | "we_cheaper" | "they_cheaper" | "discounts";

function formatINR(amount: number) {
  return `INR ${amount.toLocaleString("en-IN")}`;
}

export default function PriceIntelPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [competitorFilter, setCompetitorFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/price-intel")
      .then(r => {
        if (!r.ok) throw new Error(`Failed to fetch price intel (${r.status})`);
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError(err.message || "Failed to load price intelligence"); setLoading(false); });
  }, []);

  const copyAdBrief = (item: CompetitorPriceChange) => {
    const brief = [
      `Product: ${item.brand} ${item.product}`,
      `Competitor: ${item.competitor}`,
      `Their Price: ${formatINR(item.currentPrice)}${item.discountPercent > 0 ? ` (${item.discountPercent}% off from ${formatINR(item.originalPrice)})` : ""}`,
      `Our Price: ${formatINR(item.ourPrice)}`,
      `Price Advantage: ${item.priceAdvantage === "we_are_cheaper" ? `We're cheaper by ${formatINR(item.currentPrice - item.ourPrice)}` : `They're ${formatINR(item.ourPrice - item.currentPrice)} cheaper`}`,
      "",
      `Ad Response:`,
      item.adResponse,
    ].join("\n");
    navigator.clipboard.writeText(brief);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-sm text-muted">Scanning competitor prices across Tata CLiQ Luxury, Myntra & brand stores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm text-muted">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); fetch("/api/price-intel").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); }); }}
            className="mt-3 text-xs text-brand-blue hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { priceChanges, summary } = data;

  // Get unique competitors
  const competitors = [...new Set(priceChanges.map(c => c.competitor))];

  // Apply filters
  const filtered = priceChanges.filter(item => {
    if (priceFilter === "we_cheaper" && item.priceAdvantage !== "we_are_cheaper") return false;
    if (priceFilter === "they_cheaper" && item.priceAdvantage !== "they_are_cheaper") return false;
    if (priceFilter === "discounts" && item.discountPercent === 0) return false;
    if (competitorFilter !== "all" && item.competitor !== competitorFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={22} className="text-amber-500" />
            <h1 className="text-2xl font-bold">Competitor Price Intelligence</h1>
          </div>
          <p className="text-sm text-muted">
            Real-time competitor pricing across Tata CLiQ Luxury, Myntra & brand direct stores
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck size={10} /> {summary.weAreCheaper} Price Advantages
          </span>
          <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Tag size={10} /> {summary.activeDiscounts} Active Discounts
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Products Monitored", value: summary.totalMonitored.toString(), color: "blue", icon: BarChart3 },
          { label: "We're Cheaper", value: summary.weAreCheaper.toString(), color: "green", icon: TrendingDown },
          { label: "They're Cheaper", value: summary.theyAreCheaper.toString(), color: "red", icon: TrendingUp },
          { label: "Active Competitor Discounts", value: summary.activeDiscounts.toString(), color: "orange", icon: Tag },
          {
            label: "Biggest Savings",
            value: summary.biggestAdvantage.savings > 0 ? formatINR(summary.biggestAdvantage.savings) : "--",
            color: "purple",
            icon: ShieldCheck,
          },
        ].map(s => (
          <div key={s.label} className={`stat-card stat-card-${s.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted font-medium">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
                {s.label === "Biggest Savings" && summary.biggestAdvantage.savings > 0 && (
                  <p className="text-[10px] text-muted mt-0.5">{summary.biggestAdvantage.brand} {summary.biggestAdvantage.product}</p>
                )}
              </div>
              <s.icon size={18} className="text-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <Filter size={14} className="text-muted" />
        <div className="flex gap-1">
          {([
            { key: "all", label: "All" },
            { key: "we_cheaper", label: "We're Cheaper" },
            { key: "they_cheaper", label: "They're Cheaper" },
            { key: "discounts", label: "Active Discounts" },
          ] as { key: PriceFilter; label: string }[]).map(f => (
            <button key={f.key} onClick={() => setPriceFilter(f.key)}
              className={cn("text-xs px-3 py-1.5 rounded-full transition-colors",
                priceFilter === f.key ? "bg-brand-blue text-white" : "bg-surface text-muted hover:bg-card-border"
              )}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-card-border" />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setCompetitorFilter("all")}
            className={cn("text-xs px-3 py-1.5 rounded-full transition-colors",
              competitorFilter === "all" ? "bg-brand-purple text-white" : "bg-surface text-muted hover:bg-card-border"
            )}>All Competitors</button>
          {competitors.map(c => (
            <button key={c} onClick={() => setCompetitorFilter(c)}
              className={cn("text-xs px-3 py-1.5 rounded-full transition-colors",
                competitorFilter === c ? "bg-brand-purple text-white" : "bg-surface text-muted hover:bg-card-border"
              )}>{c}</button>
          ))}
        </div>
      </div>

      {/* Price Comparison Cards */}
      <div className="space-y-4">
        {filtered.map(item => {
          const diff = item.currentPrice - item.ourPrice;
          const isWeWin = item.priceAdvantage === "we_are_cheaper";
          const hasDiscount = item.discountPercent > 0;
          const maxPrice = Math.max(item.currentPrice, item.ourPrice, item.originalPrice);

          return (
            <div key={item.id} className="glass-card overflow-hidden">
              <div className="p-4">
                {/* Top row: product info + badges */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full">
                        {item.brand}
                      </span>
                      <span className="text-xs bg-surface text-muted px-2 py-0.5 rounded">
                        {item.competitor}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1">
                          <Tag size={9} /> {item.discountPercent}% OFF
                        </span>
                      )}
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                        isWeWin
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-red-100 text-red-700 border border-red-200"
                      )}>
                        {isWeWin
                          ? <><CheckCircle size={9} /> Price Advantage</>
                          : <><AlertTriangle size={9} /> Price Disadvantage</>
                        }
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm mb-3">{item.product}</h3>

                    {/* Price comparison details */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="p-2.5 bg-surface rounded-lg border border-card-border">
                        <p className="text-[10px] text-muted font-medium uppercase mb-1">Their Price ({item.competitor})</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">{formatINR(item.currentPrice)}</p>
                          {hasDiscount && (
                            <span className="text-[10px] text-muted line-through">{formatINR(item.originalPrice)}</span>
                          )}
                        </div>
                      </div>
                      <div className="p-2.5 bg-surface rounded-lg border border-card-border">
                        <p className="text-[10px] text-muted font-medium uppercase mb-1">Our Price</p>
                        <p className="text-sm font-bold">{formatINR(item.ourPrice)}</p>
                      </div>
                      <div className={cn(
                        "p-2.5 rounded-lg border",
                        isWeWin ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                      )}>
                        <p className="text-[10px] text-muted font-medium uppercase mb-1">Difference</p>
                        <p className={cn("text-sm font-bold", isWeWin ? "text-green-700" : "text-red-700")}>
                          {isWeWin ? `-${formatINR(diff)}` : `+${formatINR(Math.abs(diff))}`}
                        </p>
                      </div>
                    </div>

                    {/* Visual price comparison bar */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 size={12} className="text-muted" />
                        <span className="text-[10px] text-muted font-medium uppercase">Price Comparison</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted w-12 shrink-0">Them</span>
                          <div className="flex-1 h-5 bg-surface rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full flex items-center justify-end pr-2",
                                isWeWin ? "bg-red-200" : "bg-red-400"
                              )}
                              style={{ width: `${(item.currentPrice / maxPrice) * 100}%` }}
                            >
                              <span className="text-[9px] font-medium text-red-900">{formatINR(item.currentPrice)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted w-12 shrink-0">Us</span>
                          <div className="flex-1 h-5 bg-surface rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full flex items-center justify-end pr-2",
                                isWeWin ? "bg-green-400" : "bg-green-200"
                              )}
                              style={{ width: `${(item.ourPrice / maxPrice) * 100}%` }}
                            >
                              <span className="text-[9px] font-medium text-green-900">{formatINR(item.ourPrice)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price advantage indicator */}
                    <div className={cn(
                      "flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg",
                      isWeWin ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                    )}>
                      {isWeWin
                        ? <><CheckCircle size={14} className="text-green-600" /> We&apos;re cheaper by {formatINR(diff)}</>
                        : <><AlertTriangle size={14} className="text-red-600" /> They&apos;re {formatINR(Math.abs(diff))} cheaper</>
                      }
                    </div>

                    {/* Ad response recommendation */}
                    <div className="mt-3 p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                      <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide mb-1">Ad Response Recommendation</p>
                      <p className="text-xs text-text-secondary">{item.adResponse}</p>
                    </div>
                  </div>

                  {/* Copy Ad Brief button */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => copyAdBrief(item)}
                      className="btn-secondary text-xs">
                      <Copy size={12} /> {copiedId === item.id ? "Copied!" : "Copy Ad Brief"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card p-8 text-center">
          <DollarSign size={32} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No products match the current filters.</p>
        </div>
      )}
    </div>
  );
}
