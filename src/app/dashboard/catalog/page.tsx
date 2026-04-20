"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Package,
  ShoppingBag,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Star,
  Clock,
  Leaf,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── Types ──────────────────────────────────────────────────────────
interface Product {
  id: string;
  sku: string;
  brand: string;
  name: string;
  category: string;
  subcategory: string;
  gender: string;
  price: number;
  originalPrice: number;
  discount: number;
  color: string;
  material: string;
  occasion: string[];
  season: string[];
  image: string;
  inStock: boolean;
  stockQty: number;
  tags: string[];
  tier: string;
}

interface Aggregations {
  brands: string[];
  categories: string[];
  genders: string[];
  tiers: string[];
  occasions: string[];
  seasons: string[];
  tags: string[];
  priceRange: { min: number; max: number };
}

interface CatalogResponse {
  products: Product[];
  total: number;
  totalCatalog: number;
  aggregations: Aggregations;
  metadata: {
    version: string;
    generated: string;
    totalProducts: number;
    brands: number;
    source: string;
  };
}

// ── Brand accent colors (solid hex for top strip) ──────────────────
const BRAND_COLORS: Record<string, string> = {
  "Hugo Boss": "#1a1a2e", Coach: "#8B4513", Versace: "#FFD700",
  Diesel: "#FF0000", "Jimmy Choo": "#C71585", "Michael Kors": "#8B7355",
  "Bottega Veneta": "#006400", "Marc Jacobs": "#FF69B4", Prada: "#000000",
  "Emporio Armani": "#1a1a2e", Amiri: "#2d2d2d", Casablanca: "#D2691E",
  Jacquemus: "#F4A460", "Stella McCartney": "#7B2D8E", Zimmermann: "#FFB6C1",
  "Max Mara": "#8B6914", "Ami Paris": "#CC3333", Kenzo: "#2E8B57",
  "Farm Rio": "#228B22", "Cult Gaia": "#DAA520", "Self Portrait": "#4B0082",
  "Acne Studios": "#808080", "Maison Kitsune": "#4682B4", "Y-3": "#1a1a1a",
  "A-Cold-Wall": "#696969", Sandro: "#C71585", Maje: "#8A2BE2",
  "All Saints": "#1a1a1a", "Kate Spade": "#FF69B4", "Ted Baker": "#FF82AB",
  "Paul Smith": "#4169E1", Swarovski: "#87CEEB", TUMI: "#333333",
  "Armani Exchange": "#404040", "G-Star Raw": "#191970", Replay: "#CC0000",
  "Roberto Cavalli": "#DAA520", Lacoste: "#006633",
};

const TAG_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  trending: { icon: TrendingUp, color: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/20" },
  new_arrival: { icon: Sparkles, color: "text-sky-300", bg: "bg-sky-500/10 border-sky-500/20" },
  bestseller: { icon: Star, color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20" },
  limited_edition: { icon: Clock, color: "text-rose-300", bg: "bg-rose-500/10 border-rose-500/20" },
  sustainable: { icon: Leaf, color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

function formatINR(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

// ── Main Page ─────────────────────────────────────────────────────
export default function CatalogPage() {
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (searchQuery) p.set("search", searchQuery);
    if (selectedBrands.length) p.set("brand", selectedBrands.join(","));
    if (selectedCategories.length) p.set("category", selectedCategories.join(","));
    if (selectedGenders.length) p.set("gender", selectedGenders.join(","));
    if (selectedTiers.length) p.set("tier", selectedTiers.join(","));
    if (selectedTags.length) p.set("tags", selectedTags.join(","));
    if (sortBy !== "default") p.set("sort", sortBy);
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (inStockOnly) p.set("inStock", "true");
    if (onSaleOnly) p.set("discountOnly", "true");
    return p.toString();
  }, [searchQuery, selectedBrands, selectedCategories, selectedGenders, selectedTiers, selectedTags, sortBy, minPrice, maxPrice, inStockOnly, onSaleOnly]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = buildQuery();
        const res = await fetch(`/api/catalog${q ? `?${q}` : ""}`);
        if (!res.ok) throw new Error("Failed to fetch");
        setData(await res.json());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [buildQuery]);

  const toggle = (v: string, arr: string[], set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const clearAll = () => {
    setSearchQuery(""); setSelectedBrands([]); setSelectedCategories([]);
    setSelectedGenders([]); setSelectedTiers([]); setSelectedTags([]);
    setSortBy("default"); setMinPrice(""); setMaxPrice("");
    setInStockOnly(false); setOnSaleOnly(false);
  };

  const activeFilters = useMemo(() => {
    const pills: { label: string; clear: () => void }[] = [];
    selectedTiers.forEach((t) => pills.push({ label: `Tier: ${t}`, clear: () => setSelectedTiers((p) => p.filter((x) => x !== t)) }));
    selectedBrands.forEach((b) => pills.push({ label: b, clear: () => setSelectedBrands((p) => p.filter((x) => x !== b)) }));
    selectedCategories.forEach((c) => pills.push({ label: c, clear: () => setSelectedCategories((p) => p.filter((x) => x !== c)) }));
    selectedGenders.forEach((g) => pills.push({ label: g, clear: () => setSelectedGenders((p) => p.filter((x) => x !== g)) }));
    selectedTags.forEach((t) => pills.push({ label: t.replace(/_/g, " "), clear: () => setSelectedTags((p) => p.filter((x) => x !== t)) }));
    if (minPrice || maxPrice) pills.push({ label: `Price: ${minPrice || "0"} - ${maxPrice || "max"}`, clear: () => { setMinPrice(""); setMaxPrice(""); } });
    if (inStockOnly) pills.push({ label: "In Stock Only", clear: () => setInStockOnly(false) });
    if (onSaleOnly) pills.push({ label: "On Sale", clear: () => setOnSaleOnly(false) });
    return pills;
  }, [selectedTiers, selectedBrands, selectedCategories, selectedGenders, selectedTags, minPrice, maxPrice, inStockOnly, onSaleOnly]);

  const agg = data?.aggregations;
  const filteredBrands = agg?.brands.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase())) || [];

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#0B1120]/95 backdrop-blur-md border-b border-gray-700/50">
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Package className="text-blue-400" size={18} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-100">Product Catalog</h1>
                <p className="text-xs text-gray-500">{data ? `${data.totalCatalog} products` : "Loading..."}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                showFilters ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:text-gray-200"
              )}>
                <SlidersHorizontal size={14} />Filters
                {activeFilters.length > 0 && <span className="bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeFilters.length}</span>}
              </button>
              {activeFilters.length > 0 && (
                <button onClick={clearAll} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                  <X size={12} />Clear All
                </button>
              )}
            </div>
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brands, products, categories, materials..."
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all" />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"><X size={14} /></button>}
            </div>
            <div className="relative">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-800/50 border border-gray-700/50 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 cursor-pointer">
                <option value="default">Sort: Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="brand_asc">Brand A-Z</option>
                <option value="newest">Newest</option>
                <option value="discount">Discount %</option>
              </select>
              <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Panel (horizontal, togglable) ───────────── */}
      {showFilters && agg && (
        <div className="border-b border-gray-700/50 bg-gray-900/50 px-6 py-4 space-y-4">
          {/* Row 1: Tier + Gender + Quick Filters */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tier</span>
              <div className="flex gap-1.5">
                {["luxury", "premium", "accessible"].map((t) => (
                  <button key={t} onClick={() => toggle(t, selectedTiers, setSelectedTiers)} className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium border transition-all",
                    selectedTiers.includes(t)
                      ? t === "luxury" ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : t === "premium" ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-gray-800/50 text-gray-400 border-gray-700/40 hover:border-gray-600"
                  )}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                ))}
              </div>
            </div>

            <div className="w-px h-8 bg-gray-700/50" />

            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Gender</span>
              <div className="flex gap-1.5">
                {agg.genders.map((g) => (
                  <button key={g} onClick={() => toggle(g, selectedGenders, setSelectedGenders)} className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium border transition-all",
                    selectedGenders.includes(g) ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-gray-800/50 text-gray-400 border-gray-700/40 hover:border-gray-600"
                  )}>{g}</button>
                ))}
              </div>
            </div>

            <div className="w-px h-8 bg-gray-700/50" />

            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Quick Filters</span>
              <div className="flex gap-1.5">
                <button onClick={() => setInStockOnly(!inStockOnly)} className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium border transition-all",
                  inStockOnly ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-gray-800/50 text-gray-400 border-gray-700/40 hover:border-gray-600"
                )}>In Stock Only</button>
                <button onClick={() => setOnSaleOnly(!onSaleOnly)} className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium border transition-all",
                  onSaleOnly ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-gray-800/50 text-gray-400 border-gray-700/40 hover:border-gray-600"
                )}>On Sale</button>
              </div>
            </div>

            <div className="w-px h-8 bg-gray-700/50" />

            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Price Range</span>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                  className="w-20 bg-gray-800/50 border border-gray-700/40 rounded-md px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/40" />
                <span className="text-gray-600 text-xs">-</span>
                <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-20 bg-gray-800/50 border border-gray-700/40 rounded-md px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/40" />
              </div>
            </div>
          </div>

          {/* Row 2: Category pills */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Category</span>
            <div className="flex flex-wrap gap-1.5">
              {agg.categories.map((c) => (
                <button key={c} onClick={() => toggle(c, selectedCategories, setSelectedCategories)} className={cn(
                  "px-2.5 py-1 rounded-md text-xs border transition-all",
                  selectedCategories.includes(c) ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-gray-800/40 text-gray-500 border-gray-700/30 hover:text-gray-300 hover:border-gray-600"
                )}>{c}</button>
              ))}
            </div>
          </div>

          {/* Row 3: Brand search + checkboxes */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Brand ({agg.brands.length})</span>
            <div className="space-y-2">
              <input type="text" placeholder="Search brands..." value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)}
                className="w-64 bg-gray-800/40 border border-gray-700/30 rounded-md px-2.5 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/40" />
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {filteredBrands.map((b) => (
                  <button key={b} onClick={() => toggle(b, selectedBrands, setSelectedBrands)} className={cn(
                    "px-2.5 py-1 rounded-md text-xs border transition-all",
                    selectedBrands.includes(b) ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-gray-800/40 text-gray-500 border-gray-700/30 hover:text-gray-300 hover:border-gray-600"
                  )}>{b}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Tags */}
          {agg.tags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {agg.tags.map((t) => {
                  const cfg = TAG_CONFIG[t];
                  const Icon = cfg?.icon || Tag;
                  return (
                    <button key={t} onClick={() => toggle(t, selectedTags, setSelectedTags)} className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-all",
                      selectedTags.includes(t) ? (cfg?.bg || "bg-blue-500/10 border-blue-500/20") + " " + (cfg?.color || "text-blue-300") : "bg-gray-800/40 text-gray-500 border-gray-700/30 hover:text-gray-300"
                    )}>
                      <Icon size={11} />
                      {t.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Active Filter Pills ────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="px-6 py-2 border-b border-gray-700/30 bg-gray-900/30 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-gray-500 mr-1">Active:</span>
          {activeFilters.map((f, i) => (
            <button key={i} onClick={f.clear} className="group flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all">
              {f.label}<X size={10} className="opacity-50 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      {/* ── Stats Bar ──────────────────────────────────────── */}
      {data && (
        <div className="px-6 py-2 border-b border-gray-800/50">
          <p className="text-xs text-gray-500">
            Showing <span className="text-gray-300 font-medium">{data.total}</span> of{" "}
            <span className="text-gray-300 font-medium">{data.totalCatalog}</span> products
            {" "}&middot;{" "}<span className="text-gray-300 font-medium">{agg?.brands.length || 0}</span> brands
            {" "}&middot;{" "}<span className="text-gray-300 font-medium">{agg?.categories.length || 0}</span> categories
          </p>
        </div>
      )}

      {/* ── Product Grid ───────────────────────────────────── */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden animate-pulse">
                <div className="h-1 bg-gray-700/50" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 bg-gray-700/40 rounded w-1/3" />
                  <div className="h-3.5 bg-gray-700/40 rounded w-4/5" />
                  <div className="h-4 bg-gray-700/40 rounded w-1/2" />
                  <div className="flex gap-1.5 mt-2"><div className="h-5 bg-gray-700/30 rounded w-16" /><div className="h-5 bg-gray-700/30 rounded w-12" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <AlertCircle size={40} className="text-red-400/60 mb-3" />
            <h3 className="text-base font-medium text-gray-200 mb-1">Failed to load catalog</h3>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        ) : data && data.products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <ShoppingBag size={40} className="text-gray-600 mb-3" />
            <h3 className="text-base font-medium text-gray-200 mb-1">No products found</h3>
            <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or search</p>
            <button onClick={clearAll} className="px-4 py-2 rounded-lg bg-blue-500/15 text-blue-400 text-sm hover:bg-blue-500/25 transition-colors">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {data?.products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────
function ProductCard({ product: p }: { product: Product }) {
  const brandColor = BRAND_COLORS[p.brand] || "#3B82F6";
  const hasDiscount = p.discount > 0;
  const lowStock = p.inStock && p.stockQty > 0 && p.stockQty <= 5;

  return (
    <div className="group bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden hover:border-gray-600/60 hover:bg-gray-800/70 transition-all duration-200">
      {/* Brand color strip */}
      <div className="h-1" style={{ backgroundColor: brandColor }} />

      <div className="p-3.5 space-y-2">
        {/* Brand name */}
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{p.brand}</p>

        {/* Product name */}
        <p className="text-[13px] text-gray-200 font-medium leading-snug line-clamp-2 min-h-[2.25rem]">{p.name}</p>

        {/* Price row */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-gray-100">{formatINR(p.price)}</span>
          {hasDiscount && (
            <>
              <span className="text-[11px] text-gray-500 line-through">{formatINR(p.originalPrice)}</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">-{p.discount}%</span>
            </>
          )}
        </div>

        {/* Category + Gender pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-700/40 text-gray-400">{p.category}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-700/40 text-gray-400">{p.gender}</span>
        </div>

        {/* Stock status */}
        <div className="flex items-center gap-1.5">
          {p.inStock ? (
            <>
              <span className={cn("w-1.5 h-1.5 rounded-full", lowStock ? "bg-amber-400" : "bg-emerald-400")} />
              <span className={cn("text-[10px]", lowStock ? "text-amber-400/80" : "text-emerald-400/70")}>
                {lowStock ? `Low Stock (${p.stockQty} left)` : "In Stock"}
              </span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
              <span className="text-[10px] text-gray-500">Out of Stock</span>
            </>
          )}
        </div>

        {/* Tags */}
        {p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {p.tags.slice(0, 3).map((t) => {
              const cfg = TAG_CONFIG[t];
              const Icon = cfg?.icon || Tag;
              return (
                <span key={t} className={cn("inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border", cfg?.bg || "bg-gray-700/30 border-gray-700/40", cfg?.color || "text-gray-400")}>
                  <Icon size={9} />{t.replace(/_/g, " ")}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
