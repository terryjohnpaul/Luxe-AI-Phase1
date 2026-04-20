"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Search, Loader2, ChevronDown, ChevronUp, Plus, X, AlertTriangle, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── Types ─────────────────────────────────────────────────────
interface AdRecommendation {
  id: string; signalId: string; signalTitle: string; signalType: string;
  priority: "urgent" | "high" | "medium" | "opportunity";
  title: string; description: string;
  creative: { direction: string; suggestedFormats: string[]; brands: string[]; sampleHeadlines: string[]; samplePrimaryTexts: string[]; cta: string };
  targeting: { archetypes: string[]; location: string; timing: string; platforms: { meta: string; google: string; reason: string } };
  budget: { suggested: string; duration: string; bidStrategy: string };
  prediction: { confidence: number; estimatedReach: string; estimatedImpressions: string; estimatedClicks: string; estimatedCTR: string; estimatedConversions: string; estimatedCPA: string; estimatedRevenue: string; estimatedROAS: string; campaignGoal: string; factors: string[]; methodology: string };
  executionGuide: { meta: string; google: string };
}
interface MatchedProduct {
  id: string; brand: string; name: string; category: string; price: number;
  originalPrice: number; discount: number; tier: string; inStock: boolean;
  stockQty: number; tags: string[]; matchScore: number; matchReasons: string[];
}
interface CatalogProduct {
  id: string; sku: string; brand: string; name: string; category: string;
  price: number; originalPrice: number; discount: number; inStock: boolean;
  stockQty: number; tags: string[]; tier: string;
}
type CardStatus = "pending" | "approved" | "skipped";
type FilterType = "all" | "pending" | "approved" | "skipped";

// ── Helpers ───────────────────────────────────────────────────
const fmtINR = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
const AUTH = "Basic " + (typeof btoa !== "undefined" ? btoa("admin:luxeai2026") : "");
const PRIO: Record<string, { bg: string; text: string; label: string }> = {
  urgent: { bg: "bg-red-500/20", text: "text-red-400", label: "URGENT" },
  high: { bg: "bg-orange-500/20", text: "text-orange-400", label: "HIGH" },
  medium: { bg: "bg-blue-500/20", text: "text-blue-400", label: "MEDIUM" },
  opportunity: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "OPPORTUNITY" },
};
const TYPE_LABELS: Record<string, string> = {
  weather: "Weather", search_trend: "Trend", festival: "Festival", salary_cycle: "Salary",
  stock_market: "Market", cricket: "Cricket", entertainment: "Entertainment", ott_release: "OTT",
  celebrity: "Celebrity", auspicious_day: "Auspicious", life_event: "Life Event", social_trend: "Social",
  travel: "Travel", regional: "Regional", inventory: "Inventory", competitor: "Competitor",
  economic: "Economic", gift_occasion: "Gifting", sale_event: "Sale", occasion_dressing: "Occasion",
  fashion_event: "Fashion", wedding: "Wedding", aesthetic: "Aesthetic", runway: "Runway",
  launch: "Launch", category_demand: "Demand",
};
const sColor = (s: number) => s >= 80 ? "text-emerald-400" : s >= 60 ? "text-blue-400" : s >= 40 ? "text-amber-400" : "text-red-400";
const sBg = (s: number) => s >= 80 ? "bg-emerald-500/10" : s >= 60 ? "bg-blue-500/10" : s >= 40 ? "bg-amber-500/10" : "bg-red-500/10";

function CardSkeleton() {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-16 bg-gray-700 rounded-full" /><div className="h-5 w-20 bg-gray-700 rounded-full" /><div className="h-5 w-64 bg-gray-700 rounded" />
      </div>
      <div className="h-4 w-80 bg-gray-700/60 rounded mb-2" /><div className="h-4 w-60 bg-gray-700/60 rounded mb-6" />
      <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-gray-700/40 rounded-lg" />)}</div>
      <div className="mt-6 flex gap-3"><div className="h-9 w-36 bg-gray-700 rounded-lg" /><div className="h-9 w-24 bg-gray-700 rounded-lg" /></div>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={cn("fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-2xl text-sm font-medium", type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}>
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={14} /></button>
    </div>
  );
}

// ── Product Search ────────────────────────────────────────────
function ProductSearchDropdown({ onAdd, existingIds }: { onAdd: (p: MatchedProduct) => void; existingIds: Set<string> }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/catalog?search=${encodeURIComponent(query)}`, { headers: { Authorization: AUTH } });
        if (res.ok) { const d = await res.json(); setResults((d.products || []).slice(0, 10)); }
      } catch { /* silent */ } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mt-3 px-3 py-2 rounded-lg hover:bg-blue-500/10 transition-colors">
      <Plus size={14} /> Add Product Manually
    </button>
  );

  return (
    <div className="mt-3 border border-gray-600/50 rounded-lg p-3 bg-gray-800/80">
      <div className="flex items-center gap-2 mb-2">
        <Search size={14} className="text-gray-400" />
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search catalog by name or brand..." className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none" />
        <button onClick={() => { setOpen(false); setQuery(""); setResults([]); }} className="text-gray-400 hover:text-white"><X size={14} /></button>
      </div>
      {searching && <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 size={12} className="animate-spin" /> Searching...</div>}
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {results.map(p => {
            const already = existingIds.has(p.id);
            return (
              <button key={p.id} disabled={already} onClick={() => {
                onAdd({ id: p.id, brand: p.brand, name: p.name, category: p.category, price: p.price, originalPrice: p.originalPrice, discount: p.discount, tier: p.tier, inStock: p.inStock, stockQty: p.stockQty, tags: p.tags, matchScore: 0, matchReasons: ["Manually added"] });
                setQuery(""); setResults([]);
              }} className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors", already ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-700/50 cursor-pointer")}>
                <span><span className="font-medium text-white">{p.brand}</span> <span className="text-gray-300">{p.name}</span></span>
                <span className="text-gray-400 text-xs ml-3 shrink-0">{fmtINR(p.price)}{already && " (added)"}</span>
              </button>
            );
          })}
        </div>
      )}
      {query.length >= 2 && !searching && results.length === 0 && <p className="text-xs text-gray-500 py-2">No products found</p>}
    </div>
  );
}

// ── Recommendation Card ───────────────────────────────────────
function RecCard({ rec, products, productsLoading, selectedIds, status, onToggleProduct, onRemoveProduct, onAddProduct, onApprove, onSkip }: {
  rec: AdRecommendation; products: MatchedProduct[]; productsLoading: boolean; selectedIds: Set<string>; status: CardStatus;
  onToggleProduct: (id: string) => void; onRemoveProduct: (id: string) => void; onAddProduct: (p: MatchedProduct) => void; onApprove: () => void; onSkip: () => void;
}) {
  const [collapsed, setCollapsed] = useState(status !== "pending");
  const prio = PRIO[rec.priority] || PRIO.medium;
  const typeLabel = TYPE_LABELS[rec.signalType] || rec.signalType || "Signal";
  const selProds = products.filter(p => selectedIds.has(p.id));
  const selCount = selProds.length;
  const totalVal = selProds.reduce((s, p) => s + p.price, 0);
  const avgScore = selCount > 0 ? Math.round(selProds.reduce((s, p) => s + p.matchScore, 0) / selCount) : 0;
  const existIds = new Set(products.map(p => p.id));

  useEffect(() => { if (status !== "pending") setCollapsed(true); }, [status]);

  return (
    <div className={cn("bg-gray-800/50 border rounded-xl transition-all", status === "approved" ? "border-emerald-500/40" : status === "skipped" ? "border-gray-600/30 opacity-60" : "border-gray-700/50")}>
      <button onClick={() => setCollapsed(!collapsed)} className="w-full text-left p-5 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide", prio.bg, prio.text)}>{prio.label}</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-700/60 text-gray-300">{typeLabel}</span>
            {status === "approved" && <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400">APPROVED</span>}
            {status === "skipped" && <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-600/40 text-gray-400">SKIPPED</span>}
          </div>
          <h3 className="text-white font-semibold text-[15px] leading-snug mb-1">{rec.title}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
            <span>Budget: {rec.budget.suggested}</span>
            <span>Duration: {rec.budget.duration}</span>
            {rec.creative.brands.length > 0 && <span>Brands: {rec.creative.brands.slice(0, 5).join(", ")}{rec.creative.brands.length > 5 && ` +${rec.creative.brands.length - 5}`}</span>}
          </div>
        </div>
        <div className="shrink-0 mt-1 text-gray-500">{collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</div>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Suggested Products{!productsLoading && ` (${products.length} matches)`}</div>
            <div className="flex-1 h-px bg-gray-700/50" />
          </div>

          {productsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-700/30 rounded-lg animate-pulse" />)}</div>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No matched products found for this recommendation.</p>
          ) : (
            <div className="space-y-0.5">
              {products.map((p, idx) => {
                const checked = selectedIds.has(p.id);
                const reason = p.matchReasons?.[0] || p.category || "";
                return (
                  <div key={p.id} className={cn("group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors", idx % 2 === 0 ? "bg-gray-700/10" : "bg-transparent", "hover:bg-gray-700/30")}>
                    <button onClick={() => onToggleProduct(p.id)} disabled={status !== "pending"} className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all", checked ? "bg-blue-500 border-blue-500" : "border-gray-500 hover:border-gray-400", status !== "pending" && "opacity-50 cursor-not-allowed")}>
                      {checked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </button>
                    <span className={cn("text-xs font-bold w-10 text-center shrink-0 py-0.5 rounded", sColor(p.matchScore), sBg(p.matchScore))}>{p.matchScore}%</span>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-xs font-bold text-white shrink-0">{p.brand}</span>
                      <span className="text-sm text-gray-300 truncate">{p.name}</span>
                    </div>
                    <span className="text-sm text-gray-300 shrink-0 tabular-nums">{fmtINR(p.price)}</span>
                    {reason && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700/60 text-gray-400 shrink-0 hidden lg:inline-block">{reason}</span>}
                    {status === "pending" && <button onClick={() => onRemoveProduct(p.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all shrink-0" title="Remove"><X size={14} /></button>}
                  </div>
                );
              })}
            </div>
          )}

          {status === "pending" && <ProductSearchDropdown onAdd={onAddProduct} existingIds={existIds} />}

          {products.length > 0 && (
            <>
              <div className="flex items-center gap-3 mt-5 mb-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Campaign Preview</div>
                <div className="flex-1 h-px bg-gray-700/50" />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-300 mb-4">
                <span>Selected: <span className="text-white font-medium">{selCount} products</span></span>
                <span>Total value: <span className="text-white font-medium">{fmtINR(totalVal)}</span></span>
                <span>Avg match: <span className={cn("font-medium", sColor(avgScore))}>{avgScore}%</span></span>
              </div>
            </>
          )}

          {status === "pending" && (
            <div className="flex items-center gap-3">
              <button onClick={onApprove} disabled={selCount === 0} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all", selCount > 0 ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-gray-700 text-gray-500 cursor-not-allowed")}>
                <CheckCircle2 size={16} /> Approve Campaign
              </button>
              <button onClick={onSkip} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gray-700/60 hover:bg-gray-700 text-gray-300 transition-all">
                <Minus size={16} /> Skip All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ApprovalPage() {
  const [recommendations, setRecommendations] = useState<AdRecommendation[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<Record<string, MatchedProduct[]>>({});
  const [selectedProducts, setSelectedProducts] = useState<Record<string, Set<string>>>({});
  const [cardStatus, setCardStatus] = useState<Record<string, CardStatus>>({});
  const [productsLoading, setProductsLoading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchProducts = useCallback(async (recId: string, recIndex: number) => {
    setProductsLoading(prev => ({ ...prev, [recId]: true }));
    try {
      const res = await fetch(`/api/catalog/match?recId=${recIndex}`, { headers: { Authorization: AUTH } });
      if (!res.ok) throw new Error("match fetch failed");
      const data = await res.json();
      const prods: MatchedProduct[] = data.products || data.matches || [];
      setMatchedProducts(prev => ({ ...prev, [recId]: prods }));
      setSelectedProducts(prev => ({ ...prev, [recId]: new Set(prods.filter(p => p.matchScore >= 60).map(p => p.id)) }));
    } catch {
      setMatchedProducts(prev => ({ ...prev, [recId]: [] }));
      setSelectedProducts(prev => ({ ...prev, [recId]: new Set() }));
    } finally {
      setProductsLoading(prev => ({ ...prev, [recId]: false }));
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/signals/live", { headers: { Authorization: AUTH } });
        if (!res.ok) throw new Error(`Failed to fetch signals (${res.status})`);
        const data = await res.json();
        const recs: AdRecommendation[] = data.recommendations || [];
        setRecommendations(recs);
        const init: Record<string, CardStatus> = {};
        recs.forEach(r => { init[r.id] = "pending"; });
        setCardStatus(init);
        recs.slice(0, 5).forEach((r, i) => fetchProducts(r.id, i));
      } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
      finally { setLoading(false); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ensureProducts = useCallback((recId: string, idx: number) => {
    if (matchedProducts[recId] === undefined && !productsLoading[recId]) fetchProducts(recId, idx);
  }, [matchedProducts, productsLoading, fetchProducts]);

  const toggleProduct = useCallback((recId: string, pid: string) => {
    setSelectedProducts(prev => { const s = new Set(prev[recId] || []); s.has(pid) ? s.delete(pid) : s.add(pid); return { ...prev, [recId]: s }; });
  }, []);

  const removeProduct = useCallback((recId: string, pid: string) => {
    setMatchedProducts(prev => ({ ...prev, [recId]: (prev[recId] || []).filter(p => p.id !== pid) }));
    setSelectedProducts(prev => { const s = new Set(prev[recId] || []); s.delete(pid); return { ...prev, [recId]: s }; });
  }, []);

  const addProduct = useCallback((recId: string, product: MatchedProduct) => {
    setMatchedProducts(prev => ({ ...prev, [recId]: [...(prev[recId] || []), product] }));
    setSelectedProducts(prev => { const s = new Set(prev[recId] || []); s.add(product.id); return { ...prev, [recId]: s }; });
  }, []);

  const sendFeedback = useCallback((recId: string, productId: string, action: string, matchScore: number) =>
    fetch("/api/catalog/feedback", { method: "POST", headers: { "Content-Type": "application/json", Authorization: AUTH }, body: JSON.stringify({ recId, productId, action, matchScore }) })
      .catch(err => { console.warn("Feedback API not ready:", err); return null; }), []);

  const approveCampaign = useCallback(async (recId: string) => {
    const sel = selectedProducts[recId]; const prods = matchedProducts[recId] || [];
    if (!sel || sel.size === 0) return;
    await Promise.allSettled(prods.map(p => sendFeedback(recId, p.id, sel.has(p.id) ? "approved" : "skipped", p.matchScore)));
    setCardStatus(prev => ({ ...prev, [recId]: "approved" }));
    setToast({ message: `Campaign approved with ${sel.size} products`, type: "success" });
  }, [selectedProducts, matchedProducts, sendFeedback]);

  const skipAll = useCallback(async (recId: string) => {
    const prods = matchedProducts[recId] || [];
    await Promise.allSettled(prods.map(p => sendFeedback(recId, p.id, "skipped", p.matchScore)));
    setCardStatus(prev => ({ ...prev, [recId]: "skipped" }));
    setToast({ message: "Campaign skipped", type: "success" });
  }, [matchedProducts, sendFeedback]);

  const pendingCount = Object.values(cardStatus).filter(s => s === "pending").length;
  const approvedCount = Object.values(cardStatus).filter(s => s === "approved").length;
  const skippedCount = Object.values(cardStatus).filter(s => s === "skipped").length;
  const filteredRecs = recommendations.filter(r => filter === "all" || cardStatus[r.id] === filter);

  return (
    <div className="min-h-screen bg-[#0B1120] p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Campaign Approval</h1>
        <p className="text-sm text-gray-400">Review AI recommendations and approve products for campaigns</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-amber-400 font-medium">{pendingCount} pending</span>
          <span className="text-gray-600">|</span>
          <span className="text-emerald-400 font-medium">{approvedCount} approved</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 font-medium">{skippedCount} skipped</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-1">
          {(["all", "pending", "approved", "skipped"] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors", filter === f ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200")}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle size={40} className="text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Failed to load recommendations</h2>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">Retry</button>
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 size={40} className="text-gray-600 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">{filter === "all" ? "No recommendations available" : `No ${filter} campaigns`}</h2>
          <p className="text-sm text-gray-400">{filter === "all" ? "New AI recommendations will appear here when signals are detected." : "Try changing the filter to see other campaigns."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecs.map((rec, idx) => {
            if (idx >= 5) ensureProducts(rec.id, idx);
            return (
              <RecCard key={rec.id} rec={rec} products={matchedProducts[rec.id] || []} productsLoading={productsLoading[rec.id] || false}
                selectedIds={selectedProducts[rec.id] || new Set()} status={cardStatus[rec.id] || "pending"}
                onToggleProduct={pid => toggleProduct(rec.id, pid)} onRemoveProduct={pid => removeProduct(rec.id, pid)}
                onAddProduct={p => addProduct(rec.id, p)} onApprove={() => approveCampaign(rec.id)} onSkip={() => skipAll(rec.id)} />
            );
          })}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
