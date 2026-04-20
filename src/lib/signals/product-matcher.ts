/**
 * Product-to-Campaign Matching Engine
 *
 * The "middle piece" — connects signals/recommendations to actual catalog products.
 * Takes an AdRecommendation and returns ranked products from the 316-product catalog.
 */

// ============================================================
// TYPES
// ============================================================

export interface CatalogProduct {
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

export interface AdRecommendation {
  id: string;
  signalId: string;
  signalTitle: string;
  signalType: string;
  priority: "urgent" | "high" | "medium" | "opportunity";
  title: string;
  description: string;
  creative: {
    direction: string;
    suggestedFormats: string[];
    brands: string[];
    sampleHeadlines: string[];
    samplePrimaryTexts: string[];
    cta: string;
  };
  targeting: {
    archetypes: string[];
    location: string;
    timing: string;
    platforms: { meta: string; google: string; reason: string };
  };
  budget: {
    suggested: string;
    duration: string;
    bidStrategy: string;
  };
  prediction: {
    confidence: number;
    estimatedReach: string;
    estimatedImpressions: string;
    estimatedClicks: string;
    estimatedCTR: string;
    estimatedConversions: string;
    estimatedCPA: string;
    estimatedRevenue: string;
    estimatedROAS: string;
    campaignGoal: string;
    factors: string[];
    methodology: string;
  };
  executionGuide: {
    meta: string;
    google: string;
  };
  tierMode?: string;
}

export interface MatchedProduct {
  product: CatalogProduct;
  score: number;
  matchReasons: string[];
}


// ============================================================
// FEEDBACK LOOP — learn from Tanisha's approvals/skips
// ============================================================

import { readFileSync } from "fs";
import path from "path";

let feedbackCache: Record<string, { approvals: number; skips: number }> | null = null;
let feedbackCacheTime = 0;

function loadFeedback(): Record<string, { approvals: number; skips: number }> {
  const now = Date.now();
  if (feedbackCache && (now - feedbackCacheTime) < 60000) return feedbackCache; // 1 min cache

  try {
    const raw = readFileSync(path.join(process.cwd(), "data", "product-feedback.json"), "utf-8");
    const data = JSON.parse(raw);
    const feedback: Record<string, { approvals: number; skips: number }> = {};

    for (const entry of (data.feedback || [])) {
      const pid = entry.productId;
      if (!feedback[pid]) feedback[pid] = { approvals: 0, skips: 0 };
      if (entry.action === "approve") feedback[pid].approvals++;
      if (entry.action === "skip" || entry.action === "remove") feedback[pid].skips++;
    }

    feedbackCache = feedback;
    feedbackCacheTime = now;
    return feedback;
  } catch {
    return {};
  }
}

// ============================================================
// KEYWORD EXTRACTION HELPERS
// ============================================================

/** Extract category keywords from a direction string */
function extractCategoryKeywords(direction: string): string[] {
  const categoryMap: Record<string, string[]> = {
    "Bags": ["bags", "bag", "handbag", "tote", "clutch", "crossbody", "hobo", "satchel", "backpack"],
    "Shoes": ["shoes", "shoe", "footwear", "sneakers", "heels", "boots", "sandals", "mules", "loafers"],
    "Heels": ["heels", "heel", "stiletto", "pump", "mules"],
    "Boots": ["boots", "boot", "ankle boot", "chelsea"],
    "Sneakers": ["sneakers", "sneaker", "trainers", "kicks"],
    "Sandals": ["sandals", "sandal", "slides", "flip"],
    "Sunglasses": ["sunglasses", "sunglass", "eyewear", "shades"],
    "Watches": ["watches", "watch", "timepiece"],
    "Jewelry": ["jewelry", "jewellery", "necklace", "bracelet", "ring", "earring"],
    "Blazers": ["blazers", "blazer", "tailoring", "tailored", "suit"],
    "Suits": ["suits", "suit", "tuxedo", "formal wear"],
    "Shirts": ["shirts", "shirt", "blouse"],
    "T-Shirts": ["t-shirts", "t-shirt", "tee", "tees"],
    "Trousers": ["trousers", "trouser", "pants", "chinos"],
    "Jeans": ["jeans", "jean", "denim"],
    "Dresses": ["dresses", "dress", "gown", "maxi", "midi"],
    "Jackets": ["jackets", "jacket", "bomber", "puffer", "outerwear"],
    "Coats": ["coats", "coat", "overcoat", "trench"],
    "Knitwear": ["knitwear", "knit", "sweater", "cardigan", "pullover"],
    "Polos": ["polos", "polo"],
    "Tops": ["tops", "top", "blouse", "camisole"],
    "Fragrances": ["fragrances", "fragrance", "perfume", "cologne", "scent", "edp", "edt"],
    "Wallets": ["wallets", "wallet", "card holder", "card case"],
    "Belts": ["belts", "belt"],
    "Scarves": ["scarves", "scarf", "stole", "wrap"],
    "Swimwear": ["swimwear", "swim", "bikini", "beachwear"],
  };

  const dirLower = direction.toLowerCase();
  const matched: string[] = [];

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => dirLower.includes(kw))) {
      matched.push(category);
    }
  }

  return matched;
}

/** Extract product name keywords from direction for celebrity/specific product matching */
function extractProductKeywords(direction: string): string[] {
  // Split direction into meaningful tokens, filtering common words
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "for", "with", "in", "on", "at", "to",
    "of", "by", "from", "as", "is", "was", "are", "were", "be", "been", "being",
    "that", "this", "these", "those", "it", "its", "their", "them", "they", "we",
    "our", "your", "you", "can", "will", "should", "would", "could", "may",
    "style", "aesthetic", "luxury", "luxe", "premium", "collection", "campaign",
    "push", "promote", "show", "create", "creative", "direction", "suggest",
    "highlight", "feature", "showcase", "focus", "emphasize", "target",
    "ad", "ads", "marketing", "social", "media", "content", "post",
    "new", "latest", "trending", "hot", "season", "seasonal",
  ]);

  // Extract after em-dash patterns like "Hugo Boss — BOSS Tailored Blazer"
  const dashMatches = direction.match(/\u2014\s*([^,.;]+)/g);
  const keywords: string[] = [];

  if (dashMatches) {
    for (const dm of dashMatches) {
      const cleaned = dm.replace(/\u2014\s*/, "").trim();
      keywords.push(...cleaned.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w.toLowerCase())));
    }
  }

  // Also extract quoted items
  const quotedMatches = direction.match(/["\u201C\u201D]([^"\u201C\u201D]+)["\u201C\u201D]/g);
  if (quotedMatches) {
    for (const qm of quotedMatches) {
      const cleaned = qm.replace(/["\u201C\u201D]/g, "").trim();
      keywords.push(...cleaned.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w.toLowerCase())));
    }
  }

  return keywords;
}

/** Extract occasion keywords for signal-type matching */
function getOccasionMapping(signalType: string): string[] {
  const map: Record<string, string[]> = {
    wedding: ["Wedding", "Festive", "Party", "Cocktail", "Reception", "Gala", "Gifting", "Date Night", "Formal"],
    life_event: ["Wedding", "Festive", "Party", "Cocktail", "Reception", "Gala", "Gifting", "Date Night", "Formal"],
    festival: ["Festive", "Party", "Gifting", "Wedding", "Cocktail", "Gala"],
    gift_occasion: ["Gifting", "Party", "Festive", "Wedding", "Date Night"],
    auspicious_day: ["Festive", "Wedding", "Party", "Gifting", "Formal"],
    salary_cycle: ["Office", "Formal", "Casual", "Brunch"],
    occasion_dressing: ["Party", "Cocktail", "Date Night", "Gala", "Formal"],
    celebrity: ["Party", "Date Night", "Cocktail", "Casual"],
    fashion_event: ["Party", "Cocktail", "Date Night", "Casual", "Brunch"],
    social_trend: ["Casual", "Brunch", "Weekend", "Party"],
    aesthetic: ["Casual", "Brunch", "Office", "Weekend", "Date Night"],
    travel: ["Vacation", "Casual", "Brunch", "Weekend"],
    sale_event: ["Casual", "Office", "Brunch", "Weekend", "Party"],
    launch: ["Casual", "Party", "Brunch", "Date Night"],
    weather: ["Casual", "Vacation", "Brunch"],
    search_trend: ["Casual", "Party", "Office"],
    category_demand: ["Casual", "Office", "Party"],
    competitor: ["Casual", "Office", "Party", "Formal"],
    runway: ["Party", "Cocktail", "Date Night", "Gala"],
  };
  return map[signalType] || ["Casual", "Party"];
}

/** Get price range expectations by tier */
function getTierPriceRange(tier: string): { min: number; max: number } {
  switch (tier) {
    case "luxury": return { min: 30000, max: 500000 };
    case "premium": return { min: 8000, max: 80000 };
    case "accessible": return { min: 2000, max: 25000 };
    default: return { min: 0, max: 999999 };
  }
}

// ============================================================
// SIGNAL-TYPE SPECIFIC SCORING WEIGHTS
// ============================================================

interface SignalWeights {
  brand: number;
  category: number;
  occasion: number;
  tag: number;
  priceFilter?: { maxPrice?: number; tagBonus?: string };
  occasionOverride?: string[];
  categoryBonus?: string[];
}

function getSignalWeights(signalType: string): SignalWeights {
  const weights: Record<string, SignalWeights> = {
    wedding: { brand: 0.2, category: 0.15, occasion: 0.4, tag: 0.15 },
    life_event: { brand: 0.2, category: 0.15, occasion: 0.4, tag: 0.15 },
    search_trend: { brand: 0.3, category: 0.3, occasion: 0.1, tag: 0.2 },
    celebrity: { brand: 0.5, category: 0.15, occasion: 0.05, tag: 0.2 },
    aesthetic: { brand: 0.3, category: 0.1, occasion: 0.2, tag: 0.3 },
    social_trend: { brand: 0.4, category: 0.1, occasion: 0.1, tag: 0.3 },
    category_demand: { brand: 0.3, category: 0.5, occasion: 0.05, tag: 0.1 },
    competitor: { brand: 0.6, category: 0.1, occasion: 0.05, tag: 0.2 },
    salary_cycle: {
      brand: 0.15, category: 0.15, occasion: 0.3, tag: 0.1,
      priceFilter: { maxPrice: 15000 },
      occasionOverride: ["Office", "Casual", "Brunch"],
    },
    launch: { brand: 0.4, category: 0.1, occasion: 0.1, tag: 0.3, priceFilter: { tagBonus: "new_arrival" } },
    festival: { brand: 0.2, category: 0.15, occasion: 0.35, tag: 0.2 },
    gift_occasion: { brand: 0.2, category: 0.2, occasion: 0.3, tag: 0.2 },
    fashion_event: { brand: 0.25, category: 0.25, occasion: 0.15, tag: 0.25 },
    runway: { brand: 0.3, category: 0.2, occasion: 0.15, tag: 0.25 },
    weather: { brand: 0.2, category: 0.3, occasion: 0.2, tag: 0.2 },
    travel: { brand: 0.2, category: 0.25, occasion: 0.25, tag: 0.2 },
    sale_event: { brand: 0.2, category: 0.2, occasion: 0.15, tag: 0.2 },
    occasion_dressing: { brand: 0.2, category: 0.2, occasion: 0.35, tag: 0.15 },
  };
  return weights[signalType] || { brand: 0.25, category: 0.25, occasion: 0.25, tag: 0.15 };
}

// ============================================================
// MAIN MATCHING FUNCTION
// ============================================================

export function matchProductsToRecommendation(
  recommendation: AdRecommendation,
  catalog: CatalogProduct[],
  maxResults: number = 12
): MatchedProduct[] {
  const recBrands = recommendation.creative.brands.map(b => b.toLowerCase());
  const direction = recommendation.creative.direction;
  const signalType = recommendation.signalType;
  const signalWeights = getSignalWeights(signalType);

  // Pre-compute direction-based data
  const categoryKeywords = extractCategoryKeywords(direction);
  const productKeywords = extractProductKeywords(direction);
  const occasionTargets = signalWeights.occasionOverride || getOccasionMapping(signalType);

  // Lowercase sets for fast matching
  const categorySet = new Set(categoryKeywords.map(c => c.toLowerCase()));
  const occasionSet = new Set(occasionTargets.map(o => o.toLowerCase()));
  const productKwLower = productKeywords.map(k => k.toLowerCase());

  // Direction text lowercase for broader matching
  const dirLower = direction.toLowerCase();

  const scored: MatchedProduct[] = [];

  for (const product of catalog) {
    // ── HARD FILTERS ──
    if (!product.inStock) continue;
    if (product.stockQty <= 0) continue;

    // Salary cycle: exclude high-price items (gateway products under 15k)
    if (signalWeights.priceFilter?.maxPrice && product.price > signalWeights.priceFilter.maxPrice) {
      // Don't hard-exclude, but will get a lower price relevance score
    }

    const matchReasons: string[] = [];
    let brandScore = 0;
    let categoryScore = 0;
    let occasionScore = 0;
    let tagScore = 0;
    let stockScore = 0;
    let priceScore = 0;

    // ── BRAND MATCH (0.30 base weight) ──
    const productBrandLower = product.brand.toLowerCase();
    if (recBrands.some(rb => {
      // Fuzzy brand matching: "Hugo Boss" matches "Hugo Boss", "BOSS" matches "Hugo Boss"
      return productBrandLower.includes(rb) || rb.includes(productBrandLower)
        || productBrandLower.replace(/\s+/g, "") === rb.replace(/\s+/g, "")
        || (rb.includes("boss") && productBrandLower.includes("hugo boss"))
        || (rb.includes("hugo") && productBrandLower.includes("hugo boss"))
        || (rb.includes("armani") && (productBrandLower.includes("armani exchange") || productBrandLower.includes("emporio armani")));
    })) {
      brandScore = 1.0;
      matchReasons.push("Brand match: " + product.brand);
    } else if (dirLower.includes(productBrandLower)) {
      // Brand mentioned in direction but not in brands list
      brandScore = 0.5;
      matchReasons.push("Brand in direction: " + product.brand);
    }

    // ── CATEGORY MATCH (0.20 base weight) ──
    const productCatLower = product.category.toLowerCase();
    const productSubcatLower = product.subcategory.toLowerCase();
    if (categorySet.has(productCatLower)) {
      categoryScore = 1.0;
      matchReasons.push("Category match: " + product.category);
    } else if (categorySet.has(productSubcatLower)) {
      categoryScore = 0.8;
      matchReasons.push("Subcategory match: " + product.subcategory);
    } else if (dirLower.includes(productCatLower) || dirLower.includes(productSubcatLower)) {
      categoryScore = 0.6;
      matchReasons.push("Category in direction: " + product.category);
    }

    // For celebrity signals, also check if the product name matches direction keywords
    if (signalType === "celebrity" || signalType === "search_trend" || signalType === "launch") {
      const productNameLower = product.name.toLowerCase();
      const nameMatchCount = productKwLower.filter(kw => productNameLower.includes(kw)).length;
      if (nameMatchCount > 0) {
        const nameBoost = Math.min(nameMatchCount * 0.3, 1.0);
        categoryScore = Math.max(categoryScore, nameBoost);
        matchReasons.push("Product name match: " + product.name.slice(0, 40));
      }
    }

    // ── OCCASION MATCH (0.20 base weight) ──
    const productOccasions = product.occasion.map(o => o.toLowerCase());
    const matchingOccasions = productOccasions.filter(o => occasionSet.has(o));
    if (matchingOccasions.length > 0) {
      occasionScore = Math.min(matchingOccasions.length * 0.4, 1.0);
      matchReasons.push("Occasion: " + matchingOccasions.map(o => o.charAt(0).toUpperCase() + o.slice(1)).join(", "));
    }

    // ── TAG BOOST (0.15 base weight) ──
    const productTags = product.tags.map(t => t.toLowerCase());

    // Signal-specific tag scoring
    if (signalType === "social_trend" || signalType === "aesthetic" || signalType === "search_trend") {
      if (productTags.includes("trending")) {
        tagScore += 0.5;
        matchReasons.push("Tag: trending");
      }
    }
    if (signalType === "competitor") {
      if (productTags.includes("bestseller")) {
        tagScore += 0.6;
        matchReasons.push("Tag: bestseller");
      }
    }
    if (signalType === "launch") {
      if (productTags.includes("new_arrival")) {
        tagScore += 0.7;
        matchReasons.push("Tag: new arrival");
      }
    }
    if (signalType === "celebrity") {
      if (productTags.includes("celebrity_pick")) {
        tagScore += 0.7;
        matchReasons.push("Tag: celebrity pick");
      }
    }
    if (signalType === "wedding" || signalType === "life_event" || signalType === "festival" || signalType === "gift_occasion") {
      if (productTags.includes("bestseller")) { tagScore += 0.3; matchReasons.push("Tag: bestseller"); }
      if (productTags.includes("limited_edition")) { tagScore += 0.2; matchReasons.push("Tag: limited edition"); }
    }

    // General tag boosts (smaller)
    if (productTags.includes("trending") && tagScore === 0) { tagScore += 0.2; }
    if (productTags.includes("bestseller") && !matchReasons.some(r => r.includes("bestseller"))) { tagScore += 0.15; }
    if (productTags.includes("new_arrival") && !matchReasons.some(r => r.includes("new arrival"))) { tagScore += 0.1; }
    if (productTags.includes("celebrity_pick") && !matchReasons.some(r => r.includes("celebrity"))) { tagScore += 0.1; }

    tagScore = Math.min(tagScore, 1.0);

    // ── STOCK HEALTH (0.10 weight) ──
    if (product.inStock && product.stockQty > 5) {
      stockScore = 1.0;
    } else if (product.inStock && product.stockQty > 2) {
      stockScore = 0.7;
    } else {
      stockScore = 0.4;
    }

    // ── PRICE RELEVANCE (0.05 weight) ──
    if (signalWeights.priceFilter?.maxPrice) {
      // Salary cycle: gateway products priced under threshold
      priceScore = product.price <= signalWeights.priceFilter.maxPrice ? 1.0 : 0.2;
    } else {
      // General: within expected tier price range
      const range = getTierPriceRange(product.tier);
      if (product.price >= range.min && product.price <= range.max) {
        priceScore = 1.0;
      } else {
        priceScore = 0.5;
      }
    }
    // Discount bonus
    if (product.discount > 0) {
      priceScore = Math.min(priceScore + 0.2, 1.0);
    }

    // ── COMPOSITE SCORE ──
    // Use signal-type-specific weights, blended with the base formula
    const w = signalWeights;
    const signalScore = (brandScore * w.brand)
                      + (categoryScore * w.category)
                      + (occasionScore * w.occasion)
                      + (tagScore * w.tag);

    // Base formula weights
    const baseScore = (brandScore * 0.30)
                    + (categoryScore * 0.20)
                    + (occasionScore * 0.20)
                    + (tagScore * 0.15)
                    + (stockScore * 0.10)
                    + (priceScore * 0.05);

    // Blend: 60% signal-specific, 40% base
    let score = (signalScore * 0.6) + (baseScore * 0.4);

    // ── FEEDBACK LOOP — learn from approvals/skips ──
    const feedback = loadFeedback();
    const productFeedback = feedback[product.id];
    if (productFeedback) {
      if (productFeedback.skips >= 3) {
        score *= 0.5; // 50% penalty — skipped 3+ times
        matchReasons.push("Feedback: frequently skipped");
      } else if (productFeedback.skips >= 1 && productFeedback.approvals === 0) {
        score *= 0.8; // 20% penalty — skipped, never approved
        matchReasons.push("Feedback: previously skipped");
      } else if (productFeedback.approvals >= 2) {
        score *= 1.15; // 15% boost — approved multiple times
        matchReasons.push("Feedback: frequently approved");
      }
    }

    // ── INDIAN LUXURY MODIFIERS ──
    // Post-scoring multipliers for India-specific factors

    // Fragrance boost — #1 searched product for Hugo Boss/Versace/Jimmy Choo in India
    if (product.category === "Fragrances") {
      score *= 1.25;
      matchReasons.push("India: Fragrance demand surge");
    }

    // Wedding season boost (current month Oct-Feb or Apr-May)
    const month = new Date().getMonth() + 1; // 1-12
    const isWeddingSeason = [1, 2, 4, 5, 10, 11, 12].includes(month);
    if (isWeddingSeason && (signalType === "wedding" || signalType === "life_event" || signalType === "festival")) {
      if (product.occasion.some(o => ["Wedding", "Festive", "Gifting"].includes(o))) {
        score *= 1.20;
        matchReasons.push("India: Wedding season active");
      }
    }

    // Gateway product boost for salary/economic signals (INR 3K-15K sweet spot)
    if (signalType === "salary_cycle") {
      if (product.price >= 3000 && product.price <= 15000) {
        score *= 1.30;
        matchReasons.push("India: Gateway luxury price point");
      }
    }

    // Swarovski boost — highest searched accessories brand in India
    if (product.brand === "Swarovski" && ["Jewelry", "Watches"].includes(product.category)) {
      score *= 1.15;
      matchReasons.push("India: Top searched accessories brand");
    }

    // Coach boost — 100x growth in India, strongest momentum
    if (product.brand === "Coach" && product.category === "Bags") {
      score *= 1.15;
      matchReasons.push("India: Fastest growing luxury brand");
    }


    // Quiet Luxury boost — exploded from 0 to 61.1 in India (2026), biggest aesthetic trend
    if (signalType === "aesthetic" || signalType === "social_trend") {
      const quietLuxuryBrands = ["Hugo Boss", "Max Mara", "Coach", "Bottega Veneta", "Sandro", "Maje"];
      const quietLuxuryCategories = ["Blazers", "Coats", "Knitwear", "Bags", "Trousers", "Shirts", "Polos"];
      const dirLowerCheck = direction.toLowerCase();
      if (dirLowerCheck.includes("quiet luxury") || dirLowerCheck.includes("minimalist") || dirLowerCheck.includes("old money")) {
        if (quietLuxuryBrands.includes(product.brand)) {
          score *= 1.30; // 30% boost — this is the #1 aesthetic trend in India
          matchReasons.push("India: Quiet Luxury trend (61.1 search interest)");
        }
        if (quietLuxuryCategories.includes(product.category)) {
          score *= 1.10; // 10% additional for matching categories
        }
      }
    }

    // Cap final score at 1.0
    score = Math.min(score, 1.0);

    // Only include products with at least SOME relevance
    if (score > 0.05 && matchReasons.length > 0) {
      scored.push({
        product,
        score: Math.round(score * 100) / 100, // round to 2 decimals
        matchReasons,
      });
    }
  }

  // Sort by score descending, then by stockQty descending as tiebreaker
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.product.stockQty - a.product.stockQty;
  });

  // ── DIVERSITY ENFORCEMENT ──
  // Prevent brand/category over-concentration in recommendations
  const diverseResults: MatchedProduct[] = [];
  const brandCount: Record<string, number> = {};
  const brandCategoryCount: Record<string, number> = {};

  for (const item of scored) {
    const brand = item.product.brand;
    const category = item.product.category;
    const brandCatKey = brand + ":" + category;

    // Max 3 products per brand per recommendation
    if ((brandCount[brand] || 0) >= 3) continue;
    // Max 2 products per exact category per brand (e.g., max 2 Swarovski bracelets)
    if ((brandCategoryCount[brandCatKey] || 0) >= 2) continue;

    diverseResults.push(item);
    brandCount[brand] = (brandCount[brand] || 0) + 1;
    brandCategoryCount[brandCatKey] = (brandCategoryCount[brandCatKey] || 0) + 1;

    if (diverseResults.length >= maxResults) break;
  }

  // Ensure at least 3 different brands in top 8 results (if available in scored)
  const uniqueBrands = new Set(diverseResults.slice(0, 8).map(r => r.product.brand));
  if (uniqueBrands.size < 3 && scored.length > diverseResults.length) {
    // Find products from underrepresented brands
    const usedIds = new Set(diverseResults.map(r => r.product.id));
    for (const item of scored) {
      if (usedIds.has(item.product.id)) continue;
      if (uniqueBrands.has(item.product.brand)) continue;
      // Insert at position 7 (end of top 8) to maintain score ordering as much as possible
      const insertIdx = Math.min(7, diverseResults.length);
      diverseResults.splice(insertIdx, 0, item);
      uniqueBrands.add(item.product.brand);
      usedIds.add(item.product.id);
      if (uniqueBrands.size >= 3) break;
    }
    // Trim back to maxResults if we exceeded
    while (diverseResults.length > maxResults) diverseResults.pop();
  }

  // Return with diversity enforced
  return diverseResults;
}
