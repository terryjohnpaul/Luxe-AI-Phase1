import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { type CatalogProduct } from "@/lib/signals/product-matcher";
import { computeAdvertisabilityScore } from "@/lib/signals/advertisability-score";
import { getBrandConfig } from "@/lib/signals/brand-config";

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
// CUSTOM LABEL GENERATION
// ============================================================

interface ProductLabel {
  id: string;
  sku: string;
  brand: string;
  name: string;
  custom_label_0: string; // Product tier from advertisability
  custom_label_1: string; // Margin band
  custom_label_2: string; // Signal relevance
  custom_label_3: string; // Brand priority
  custom_label_4: string; // Best campaign type
}

function generateLabels(product: CatalogProduct): ProductLabel {
  const adScore = computeAdvertisabilityScore(product);
  const brandConfig = getBrandConfig(product.brand);

  // custom_label_0: Product tier from advertisability score
  const custom_label_0 = adScore.tier;

  // custom_label_1: Margin band estimate
  let custom_label_1: string;
  if (brandConfig.tier === "luxury") {
    custom_label_1 = "high_margin";
  } else if (brandConfig.tier === "premium") {
    custom_label_1 = "medium_margin";
  } else {
    custom_label_1 = "entry_margin";
  }

  // custom_label_2: Signal relevance
  let custom_label_2: string;
  if (product.discount > 20) {
    custom_label_2 = "clearance";
  } else if (product.tags.includes("trending") || product.tags.includes("celebrity_pick")) {
    custom_label_2 = "trending";
  } else if (product.tags.includes("new_arrival")) {
    // New arrivals are seasonal by nature
    custom_label_2 = "seasonal";
  } else {
    // Check seasonal relevance
    const month = new Date().getMonth() + 1;
    const isSeasonal = (
      ([3, 4, 5, 6].includes(month) && product.season.includes("Summer")) ||
      ([7, 8, 9].includes(month) && product.season.includes("Monsoon")) ||
      ([10, 11, 12, 1, 2].includes(month) && product.season.includes("Winter"))
    );
    if (isSeasonal) {
      custom_label_2 = "seasonal";
    } else if (product.season.includes("Year-Round") || product.tags.includes("bestseller")) {
      custom_label_2 = "evergreen";
    } else {
      custom_label_2 = "evergreen";
    }
  }

  // custom_label_3: Brand priority tier (from brand-config.ts)
  let custom_label_3: string;
  if (brandConfig.tier === "luxury") {
    custom_label_3 = "tier1";
  } else if (brandConfig.tier === "premium") {
    custom_label_3 = "tier2";
  } else {
    custom_label_3 = "tier3";
  }

  // custom_label_4: Best campaign type
  let custom_label_4: string;
  if (product.tags.includes("limited_edition") && brandConfig.tier === "luxury") {
    custom_label_4 = "brand_hero";
  } else if (product.tags.includes("bestseller") && brandConfig.tier === "accessible") {
    custom_label_4 = "performance";
  } else if (product.tags.includes("new_arrival")) {
    custom_label_4 = "discovery";
  } else if (product.price > 30000) {
    custom_label_4 = "retargeting";
  } else if (product.tags.includes("bestseller")) {
    custom_label_4 = "performance";
  } else {
    custom_label_4 = "discovery";
  }

  return {
    id: product.id,
    sku: product.sku,
    brand: product.brand,
    name: product.name,
    custom_label_0,
    custom_label_1,
    custom_label_2,
    custom_label_3,
    custom_label_4,
  };
}

// ============================================================
// CSV GENERATION
// ============================================================

function toCSV(labels: ProductLabel[]): string {
  const headers = ["id", "sku", "brand", "name", "custom_label_0", "custom_label_1", "custom_label_2", "custom_label_3", "custom_label_4"];
  const rows = labels.map(l => [
    l.id,
    l.sku,
    `"${l.brand}"`,
    `"${l.name.replace(/"/g, '""')}"`,
    l.custom_label_0,
    l.custom_label_1,
    l.custom_label_2,
    l.custom_label_3,
    l.custom_label_4,
  ].join(","));
  return [headers.join(","), ...rows].join("\n");
}

// ============================================================
// META CATALOG BATCH FORMAT
// ============================================================

function toMetaFormat(labels: ProductLabel[]): object[] {
  return labels.map(l => ({
    method: "UPDATE",
    retailer_id: l.id,
    data: {
      custom_label_0: l.custom_label_0,
      custom_label_1: l.custom_label_1,
      custom_label_2: l.custom_label_2,
      custom_label_3: l.custom_label_3,
      custom_label_4: l.custom_label_4,
    },
  }));
}

// ============================================================
// API HANDLER
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const catalog = loadCatalog();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    const labels = catalog.products.map(generateLabels);

    // CSV format for Google Merchant Center Supplemental Feed
    if (format === "csv") {
      const csv = toCSV(labels);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=luxe-custom-labels.csv",
        },
      });
    }

    // Meta Catalog Batch API format
    if (format === "meta") {
      const metaData = toMetaFormat(labels);
      return NextResponse.json({
        requests: metaData,
        totalProducts: metaData.length,
        generatedAt: new Date().toISOString(),
      });
    }

    // Default: JSON with summary
    const summary = {
      totalProducts: labels.length,
      byTier: {
        hero: labels.filter(l => l.custom_label_0 === "hero").length,
        potential: labels.filter(l => l.custom_label_0 === "potential").length,
        standard: labels.filter(l => l.custom_label_0 === "standard").length,
        zombie: labels.filter(l => l.custom_label_0 === "zombie").length,
      },
      byMargin: {
        high_margin: labels.filter(l => l.custom_label_1 === "high_margin").length,
        medium_margin: labels.filter(l => l.custom_label_1 === "medium_margin").length,
        entry_margin: labels.filter(l => l.custom_label_1 === "entry_margin").length,
      },
      bySignal: {
        trending: labels.filter(l => l.custom_label_2 === "trending").length,
        seasonal: labels.filter(l => l.custom_label_2 === "seasonal").length,
        evergreen: labels.filter(l => l.custom_label_2 === "evergreen").length,
        clearance: labels.filter(l => l.custom_label_2 === "clearance").length,
      },
      byBrandPriority: {
        tier1: labels.filter(l => l.custom_label_3 === "tier1").length,
        tier2: labels.filter(l => l.custom_label_3 === "tier2").length,
        tier3: labels.filter(l => l.custom_label_3 === "tier3").length,
      },
      byCampaignType: {
        brand_hero: labels.filter(l => l.custom_label_4 === "brand_hero").length,
        performance: labels.filter(l => l.custom_label_4 === "performance").length,
        discovery: labels.filter(l => l.custom_label_4 === "discovery").length,
        retargeting: labels.filter(l => l.custom_label_4 === "retargeting").length,
      },
    };

    return NextResponse.json({
      summary,
      generatedAt: new Date().toISOString(),
      products: labels,
    });
  } catch (error) {
    console.error("Custom labels API error:", error);
    return NextResponse.json(
      { error: "Failed to generate custom labels", details: String(error) },
      { status: 500 }
    );
  }
}
