/**
 * Base Advertisability Score
 *
 * Signal-INDEPENDENT product health score. Every product gets a base tier
 * regardless of what signal fires. Used for custom label generation and
 * product prioritization in campaign planning.
 */

import { type CatalogProduct } from "./product-matcher";

// ============================================================
// TYPES
// ============================================================

interface ProductScore {
  productId: string;
  brand: string;
  name: string;
  advertisabilityScore: number; // 0-1
  tier: "hero" | "potential" | "standard" | "zombie";
  factors: { factor: string; score: number; weight: number }[];
}


// ============================================================
// REAL AD PERFORMANCE DATA (from Google Ads search terms)
// Loaded at module init, cached permanently
// ============================================================

import { readFileSync } from "fs";
import nodePath from "path";

interface BrandAdPerformance {
  clicks: number;
  cost: number;
  conversions: number;
  cpc: number;
  cvr: number;
  roas: number;
}

let BRAND_AD_PERFORMANCE: Record<string, BrandAdPerformance> = {};

try {
  const raw = readFileSync(nodePath.join(process.cwd(), "data", "ajio-luxe-search-terms-summary.json"), "utf-8");
  const data = JSON.parse(raw);
  const brandKeys = [
    "coach", "michael kors", "hugo boss", "versace", "swarovski",
    "jimmy choo", "diesel", "kate spade", "emporio armani", "armani exchange",
    "marc jacobs", "bottega veneta", "max mara", "prada", "lacoste",
    "tumi", "sandro", "maje", "farm rio", "ted baker", "kenzo",
    "paul smith", "self portrait", "jacquemus", "zimmermann", "ami paris",
    "roberto cavalli", "g-star raw", "replay", "cult gaia", "acne studios",
    "maison kitsune", "stella mccartney", "amiri", "casablanca", "all saints",
  ];

  const brandNameMap: Record<string, string> = {
    "coach": "Coach", "michael kors": "Michael Kors", "hugo boss": "Hugo Boss",
    "versace": "Versace", "swarovski": "Swarovski", "jimmy choo": "Jimmy Choo",
    "diesel": "Diesel", "kate spade": "Kate Spade", "emporio armani": "Emporio Armani",
    "armani exchange": "Armani Exchange", "marc jacobs": "Marc Jacobs",
    "bottega veneta": "Bottega Veneta", "max mara": "Max Mara", "prada": "Prada",
    "lacoste": "Lacoste", "tumi": "TUMI", "sandro": "Sandro", "maje": "Maje",
    "farm rio": "Farm Rio", "ted baker": "Ted Baker", "kenzo": "Kenzo",
    "paul smith": "Paul Smith", "self portrait": "Self Portrait",
    "jacquemus": "Jacquemus", "zimmermann": "Zimmermann", "ami paris": "Ami Paris",
    "roberto cavalli": "Roberto Cavalli", "g-star raw": "G-Star Raw",
    "replay": "Replay", "cult gaia": "Cult Gaia", "acne studios": "Acne Studios",
    "maison kitsune": "Maison Kitsune", "stella mccartney": "Stella McCartney",
    "amiri": "Amiri", "casablanca": "Casablanca", "all saints": "All Saints",
  };

  const brandTotals: Record<string, { clicks: number; cost: number; conversions: number }> = {};

  for (const item of (data.topByConversions || [])) {
    const term = (item.term || "").toLowerCase();
    if (term.startsWith("total:")) continue;
    for (const brandKey of brandKeys) {
      if (term.includes(brandKey)) {
        const proper = brandNameMap[brandKey] || brandKey;
        if (!brandTotals[proper]) brandTotals[proper] = { clicks: 0, cost: 0, conversions: 0 };
        brandTotals[proper].clicks += item.clicks || 0;
        brandTotals[proper].cost += item.cost || 0;
        brandTotals[proper].conversions += item.conversions || 0;
        break;
      }
    }
  }

  for (const [brand, t] of Object.entries(brandTotals)) {
    const cpc = t.clicks > 0 ? t.cost / t.clicks : 0;
    const cvr = t.clicks > 0 ? (t.conversions / t.clicks) * 100 : 0;
    const roas = t.cost > 0 ? (t.conversions * 7000) / t.cost : 0;
    BRAND_AD_PERFORMANCE[brand] = { clicks: t.clicks, cost: t.cost, conversions: t.conversions, cpc, cvr, roas };
  }

  console.log("[AdScore] Loaded real ad performance for", Object.keys(BRAND_AD_PERFORMANCE).length, "brands");
} catch (err) {
  console.warn("[AdScore] Could not load ad performance data, using defaults:", err);
}

// ============================================================
// BRAND & CATEGORY LOOKUP TABLES (India market data)
// ============================================================

const BRAND_STRENGTH: Record<string, number> = {
  "Coach": 1.0, "Swarovski": 0.95, "Jimmy Choo": 0.90, "Hugo Boss": 0.85,
  "Versace": 0.80, "Michael Kors": 0.75, "Emporio Armani": 0.70,
  "Diesel": 0.50, "Max Mara": 0.45, "Marc Jacobs": 0.65,
  "Kate Spade": 0.60, "Armani Exchange": 0.55, "Lacoste": 0.60,
  "Prada": 0.70, "Bottega Veneta": 0.65, "All Saints": 0.40,
  "Ted Baker": 0.40, "Kenzo": 0.45, "Paul Smith": 0.35,
  "Farm Rio": 0.35, "Self Portrait": 0.40, "Jacquemus": 0.55,
  "Zimmermann": 0.45, "Ami Paris": 0.40, "Sandro": 0.35, "Maje": 0.35,
  "Roberto Cavalli": 0.35, "G-Star Raw": 0.30, "Replay": 0.25,
  "TUMI": 0.45, "Cult Gaia": 0.35, "Acne Studios": 0.40,
  "Maison Kitsune": 0.30, "Y-3": 0.35, "A-Cold-Wall": 0.30,
  "Casablanca": 0.40, "Stella McCartney": 0.45, "Amiri": 0.50,
};

const CATEGORY_DEMAND: Record<string, number> = {
  "Fragrances": 1.0, "Jewelry": 0.95, "Bags": 0.90, "Watches": 0.85,
  "Sunglasses": 0.50, "Shoes": 0.60, "Heels": 0.65, "Sneakers": 0.55,
  "Suits": 0.45, "Blazers": 0.50, "Shirts": 0.55, "Polos": 0.50,
  "T-Shirts": 0.45, "Dresses": 0.60, "Jeans": 0.40, "Jackets": 0.45,
  "Knitwear": 0.35, "Tops": 0.40, "Trousers": 0.35, "Coats": 0.30,
  "Boots": 0.30, "Sandals": 0.35, "Wallets": 0.50, "Belts": 0.35,
  "Scarves": 0.25, "Swimwear": 0.20,
};

// ============================================================
// SCORING FUNCTION
// ============================================================

function computeAdvertisabilityScore(product: CatalogProduct): ProductScore {
  // Factor 1: Stock Health (weight 0.20)
  let stockScore = 0;
  if (!product.inStock || product.stockQty === 0) stockScore = 0;
  else if (product.stockQty > 20) stockScore = 1.0;
  else if (product.stockQty > 10) stockScore = 0.8;
  else if (product.stockQty > 5) stockScore = 0.6;
  else stockScore = 0.3;

  // Factor 2: Price Attractiveness (weight 0.15) — discount + reasonable price point
  let priceScore = 0.5;
  if (product.discount > 0) priceScore += 0.3;
  if (product.price >= 3000 && product.price <= 50000) priceScore += 0.2; // sweet spot for India
  priceScore = Math.min(priceScore, 1.0);

  // Factor 3: Brand Strength (weight 0.20) — based on India search data
  const brandScore = BRAND_STRENGTH[product.brand] || 0.3;

  // Factor 4: Category Demand (weight 0.15) — from India search data
  const categoryScore = CATEGORY_DEMAND[product.category] || 0.3;

  // Factor 5: Tag Signals (weight 0.15)
  let tagScore = 0.3;
  if (product.tags.includes("bestseller")) tagScore += 0.3;
  if (product.tags.includes("trending")) tagScore += 0.25;
  if (product.tags.includes("new_arrival")) tagScore += 0.15;
  if (product.tags.includes("celebrity_pick")) tagScore += 0.2;
  if (product.tags.includes("limited_edition")) tagScore += 0.1;
  tagScore = Math.min(tagScore, 1.0);

  // Factor 6: Seasonal Relevance (weight 0.15) — is this product right for NOW
  const month = new Date().getMonth() + 1;
  let seasonScore = 0.5;
  if (product.season.includes("Year-Round")) seasonScore = 0.7;
  if ([3, 4, 5, 6].includes(month) && product.season.includes("Summer")) seasonScore = 1.0;
  if ([7, 8, 9].includes(month) && product.season.includes("Monsoon")) seasonScore = 1.0;
  if ([10, 11, 12, 1, 2].includes(month) && product.season.includes("Winter")) seasonScore = 1.0;

  // Factor 7: Real Ad Performance (weight 0.20) — from actual Google Ads data
  let realPerfScore = 0.5; // default neutral
  const brandPerf = BRAND_AD_PERFORMANCE[product.brand];
  if (brandPerf) {
    // Normalize ROAS: top performers (400x+) get 1.0, poor (<100x) get 0.2
    if (brandPerf.roas >= 400) realPerfScore = 1.0;
    else if (brandPerf.roas >= 250) realPerfScore = 0.85;
    else if (brandPerf.roas >= 150) realPerfScore = 0.65;
    else if (brandPerf.roas >= 100) realPerfScore = 0.45;
    else realPerfScore = 0.25;

    // CVR bonus: high conversion rate is a strong signal
    if (brandPerf.cvr >= 30) realPerfScore = Math.min(realPerfScore + 0.15, 1.0);
    else if (brandPerf.cvr >= 20) realPerfScore = Math.min(realPerfScore + 0.08, 1.0);
  }

  // Composite (rebalanced with real performance data)
  // Stock: 0.15, Price: 0.10, Brand: 0.20, Category: 0.15, Tags: 0.10, Season: 0.10, Real Perf: 0.20
  const composite = (stockScore * 0.15) + (priceScore * 0.10) + (brandScore * 0.20)
                   + (categoryScore * 0.15) + (tagScore * 0.10) + (seasonScore * 0.10)
                   + (realPerfScore * 0.20);

  // Tier assignment
  let tier: "hero" | "potential" | "standard" | "zombie";
  if (composite >= 0.70) tier = "hero";
  else if (composite >= 0.50) tier = "potential";
  else if (composite >= 0.30) tier = "standard";
  else tier = "zombie";

  // Out of stock = always zombie
  if (!product.inStock || product.stockQty === 0) tier = "zombie";

  return {
    productId: product.id,
    brand: product.brand,
    name: product.name,
    advertisabilityScore: Math.round(composite * 100) / 100,
    tier,
    factors: [
      { factor: "Stock Health", score: stockScore, weight: 0.15 },
      { factor: "Price Attractiveness", score: priceScore, weight: 0.10 },
      { factor: "Brand Strength (India)", score: brandScore, weight: 0.20 },
      { factor: "Category Demand (India)", score: categoryScore, weight: 0.15 },
      { factor: "Tag Signals", score: tagScore, weight: 0.10 },
      { factor: "Seasonal Relevance", score: seasonScore, weight: 0.10 },
      { factor: "Real Ad Performance", score: realPerfScore, weight: 0.20 },
    ],
  };
}

// Compute for all products
function computeAllScores(catalog: CatalogProduct[]): ProductScore[] {
  return catalog.map(computeAdvertisabilityScore)
    .sort((a, b) => b.advertisabilityScore - a.advertisabilityScore);
}

// Export functions
export { computeAdvertisabilityScore, computeAllScores, type ProductScore };
