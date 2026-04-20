import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { type CatalogProduct } from "@/lib/signals/product-matcher";
import { computeAllScores, type ProductScore } from "@/lib/signals/advertisability-score";

// ============================================================
// CATALOG CACHE
// ============================================================

interface CatalogData {
  metadata: { version: string; generated: string; totalProducts: number; brands: number; source: string };
  products: CatalogProduct[];
}

let cachedCatalog: CatalogData | null = null;

function loadCatalog(): CatalogData {
  if (cachedCatalog) return cachedCatalog;
  const filePath = path.join(process.cwd(), "data", "catalog-products.json");
  const raw = readFileSync(filePath, "utf-8");
  cachedCatalog = JSON.parse(raw) as CatalogData;
  return cachedCatalog;
}

// ============================================================
// API HANDLER
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const catalog = loadCatalog();
    const { searchParams } = new URL(request.url);

    const tierFilter = searchParams.get("tier");
    const brandFilter = searchParams.get("brand");

    // Compute all scores
    let scores: ProductScore[] = computeAllScores(catalog.products);

    // Apply filters
    if (tierFilter) {
      scores = scores.filter(s => s.tier === tierFilter);
    }
    if (brandFilter) {
      scores = scores.filter(s => s.brand.toLowerCase() === brandFilter.toLowerCase());
    }

    // Compute summary stats (from full unfiltered set for context)
    const allScores = computeAllScores(catalog.products);
    const summary = {
      heroes: allScores.filter(s => s.tier === "hero").length,
      potential: allScores.filter(s => s.tier === "potential").length,
      standard: allScores.filter(s => s.tier === "standard").length,
      zombies: allScores.filter(s => s.tier === "zombie").length,
      totalProducts: allScores.length,
      averageScore: Math.round((allScores.reduce((sum, s) => sum + s.advertisabilityScore, 0) / allScores.length) * 100) / 100,
    };

    return NextResponse.json({
      summary,
      filters: {
        tier: tierFilter || "all",
        brand: brandFilter || "all",
      },
      count: scores.length,
      products: scores,
    });
  } catch (error) {
    console.error("Advertisability scores API error:", error);
    return NextResponse.json(
      { error: "Failed to compute advertisability scores", details: String(error) },
      { status: 500 }
    );
  }
}
