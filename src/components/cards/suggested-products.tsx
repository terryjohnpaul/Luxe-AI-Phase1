"use client";

import { useState, useEffect, useRef } from "react";
import { Package, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MatchedProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
  tier: string;
  inStock: boolean;
  stockQty: number;
  tags: string[];
  matchScore: number;
  matchReasons: string[];
}

interface SuggestedProductsProps {
  recIndex: number;
  className?: string;
}

function formatPrice(price: number): string {
  if (price >= 100000) {
    return "\u20B9" + (price / 100000).toFixed(price % 100000 === 0 ? 0 : 1) + "L";
  }
  return "\u20B9" + price.toLocaleString("en-IN");
}

function getScoreColor(score: number): string {
  const pct = score * 100;
  if (pct >= 80) return "text-emerald-600";
  if (pct >= 60) return "text-blue-600";
  if (pct >= 40) return "text-amber-600";
  return "text-orange-500";
}

function getScoreBg(score: number): string {
  const pct = score * 100;
  if (pct >= 80) return "bg-emerald-50 border-emerald-200";
  if (pct >= 60) return "bg-blue-50 border-blue-200";
  if (pct >= 40) return "bg-amber-50 border-amber-200";
  return "bg-orange-50 border-orange-200";
}

export function SuggestedProducts({ recIndex, className }: SuggestedProductsProps) {
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch(`/api/catalog/match?recId=${recIndex}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [recIndex]);

  if (loading) {
    return (
      <div
        className={cn(
          "mt-4 py-2 px-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-lg border border-indigo-100",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Package size={14} className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700">Suggested Products</span>
          <Loader2 size={12} className="animate-spin text-indigo-400 ml-1" />
          <span className="text-xs text-indigo-400">Matching catalog...</span>
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  const displayProducts = showAll ? products : products.slice(0, 8);

  return (
    <div
      className={cn(
        "mt-4 py-2 px-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-lg border border-indigo-100",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700">Suggested Products</span>
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
            {products.length} matches
          </span>
        </div>
        {products.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
          >
            {showAll ? "Show less" : `View all ${products.length} products`}
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {displayProducts.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[130px] bg-white rounded-lg border border-gray-200 p-2 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider leading-tight truncate">
              {product.brand}
            </p>
            <p className="text-xs font-medium text-gray-800 leading-tight mt-0.5 line-clamp-2 min-h-[28px]">
              {product.name}
            </p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-xs font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.discount > 0 && (
                <span className="text-xs text-red-500 font-medium">-{product.discount}%</span>
              )}
            </div>
            <div
              className={cn(
                "mt-2 flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold",
                getScoreBg(product.matchScore)
              )}
            >
              <span className={getScoreColor(product.matchScore)}>
                {Math.round(product.matchScore * 100)}% match
              </span>
            </div>
            {product.matchReasons.length > 0 && (
              <p
                className="text-xs text-gray-500 mt-1 leading-tight truncate"
                title={product.matchReasons.join(" | ")}
              >
                {product.matchReasons[0].replace(
                  /^(Brand match|Category match|Occasion|Tag|Subcategory match|Brand in direction|Category in direction|Product name match): /,
                  ""
                )}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
