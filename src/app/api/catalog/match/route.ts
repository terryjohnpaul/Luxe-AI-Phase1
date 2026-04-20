import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { matchProductsToRecommendation, type CatalogProduct, type AdRecommendation, type MatchedProduct } from "@/lib/signals/product-matcher";

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
// RECOMMENDATIONS CACHE
// ============================================================

let cachedRecs: AdRecommendation[] | null = null;
let recsCacheTime = 0;
const RECS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadRecommendations(request: NextRequest): Promise<AdRecommendation[]> {
  const now = Date.now();
  if (cachedRecs && (now - recsCacheTime) < RECS_CACHE_TTL) {
    return cachedRecs;
  }

  try {
    // Forward auth headers from the incoming request
    const authHeader = request.headers.get("authorization") || "";
    const cookieHeader = request.headers.get("cookie") || "";
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3200";

    const headers: Record<string, string> = {};
    if (authHeader) headers["Authorization"] = authHeader;
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    const resp = await fetch(`${proto}://${host}/api/signals/live?mode=full&tiers=luxury,premium,accessible`, {
      cache: "no-store",
      headers,
    });
    if (!resp.ok) throw new Error("Failed to fetch recommendations: " + resp.status);
    const data = await resp.json();
    cachedRecs = data.recommendations || [];
    recsCacheTime = now;
    return cachedRecs!;
  } catch (err) {
    console.error("Error loading recommendations:", err);
    return cachedRecs || [];
  }
}

// ============================================================
// API HANDLERS
// ============================================================

function formatResponse(products: MatchedProduct[], meta?: Record<string, unknown>) {
  return NextResponse.json({
    ...meta,
    products: products.map(r => ({
      ...r.product,
      matchScore: r.score,
      matchReasons: r.matchReasons,
    })),
    totalMatches: products.length,
  });
}

export async function GET(request: NextRequest) {
  try {
    const catalog = loadCatalog();
    const { searchParams } = new URL(request.url);

    const recId = searchParams.get("recId");
    const signalType = searchParams.get("signalType");
    const brandsParam = searchParams.get("brands");
    const directionParam = searchParams.get("direction");
    const maxResults = parseInt(searchParams.get("max") || "12");

    if (recId !== null) {
      const recs = await loadRecommendations(request);
      const idx = parseInt(recId);

      if (isNaN(idx) || idx < 0 || idx >= recs.length) {
        return NextResponse.json(
          { error: "Invalid recId. Must be 0-" + (recs.length - 1), total: recs.length },
          { status: 400 }
        );
      }

      const results = matchProductsToRecommendation(recs[idx], catalog.products, maxResults);
      return formatResponse(results, {
        recommendation: {
          id: recs[idx].id,
          title: recs[idx].title,
          signalType: recs[idx].signalType,
          brands: recs[idx].creative.brands,
        },
        catalogSize: catalog.products.length,
      });
    }

    if (signalType || brandsParam) {
      const brands = brandsParam ? brandsParam.split(",").map(b => b.trim()) : [];
      const direction = directionParam || brands.join(", ");

      const syntheticRec: AdRecommendation = {
        id: "manual-query",
        signalId: "manual",
        signalTitle: "Manual Query",
        signalType: signalType || "search_trend",
        priority: "medium",
        title: "Manual Product Search",
        description: "Manual query for products",
        creative: {
          direction, suggestedFormats: [], brands,
          sampleHeadlines: [], samplePrimaryTexts: [], cta: "Shop Now",
        },
        targeting: {
          archetypes: [], location: "Pan India", timing: "Now",
          platforms: { meta: "50%", google: "50%", reason: "" },
        },
        budget: { suggested: "N/A", duration: "N/A", bidStrategy: "N/A" },
        prediction: {
          confidence: 0, estimatedReach: "0", estimatedImpressions: "0",
          estimatedClicks: "0", estimatedCTR: "0%", estimatedConversions: "0",
          estimatedCPA: "0", estimatedRevenue: "0", estimatedROAS: "0x",
          campaignGoal: "Manual", factors: [], methodology: "Manual query",
        },
        executionGuide: { meta: "", google: "" },
      };

      const results = matchProductsToRecommendation(syntheticRec, catalog.products, maxResults);
      return formatResponse(results, { query: { signalType, brands, direction }, catalogSize: catalog.products.length });
    }

    return NextResponse.json(
      { error: "Provide recId (0-35) or signalType+brands query params", examples: [
        "/api/catalog/match?recId=0",
        "/api/catalog/match?signalType=wedding&brands=Hugo+Boss,Versace",
      ]},
      { status: 400 }
    );
  } catch (error) {
    console.error("Catalog match API error:", error);
    return NextResponse.json({ error: "Failed to match products", details: String(error) }, { status: 500 });
  }
}

// POST: Accept recommendation data directly (no need for internal fetch)
export async function POST(request: NextRequest) {
  try {
    const catalog = loadCatalog();
    const body = await request.json();

    if (!body.recommendation) {
      return NextResponse.json({ error: "POST body must include recommendation object" }, { status: 400 });
    }

    const maxResults = body.max || 12;
    const results = matchProductsToRecommendation(body.recommendation, catalog.products, maxResults);
    return formatResponse(results, { catalogSize: catalog.products.length });
  } catch (error) {
    console.error("Catalog match POST error:", error);
    return NextResponse.json({ error: "Failed to match products", details: String(error) }, { status: 500 });
  }
}
