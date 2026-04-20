import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

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

interface CatalogData {
  metadata: {
    version: string;
    generated: string;
    totalProducts: number;
    brands: number;
    source: string;
  };
  products: Product[];
}

let cachedData: CatalogData | null = null;

function loadCatalog(): CatalogData {
  if (cachedData) return cachedData;
  const filePath = path.join(process.cwd(), "data", "catalog-products.json");
  const raw = readFileSync(filePath, "utf-8");
  cachedData = JSON.parse(raw) as CatalogData;
  return cachedData;
}

export async function GET(request: NextRequest) {
  try {
    const catalog = loadCatalog();
    let products = [...catalog.products];

    const { searchParams } = new URL(request.url);

    // Filter: brand (comma-separated)
    const brand = searchParams.get("brand");
    if (brand) {
      const brands = brand.split(",").map((b) => b.trim().toLowerCase());
      products = products.filter((p) =>
        brands.includes(p.brand.toLowerCase())
      );
    }

    // Filter: category (comma-separated)
    const category = searchParams.get("category");
    if (category) {
      const categories = category.split(",").map((c) => c.trim().toLowerCase());
      products = products.filter((p) =>
        categories.includes(p.category.toLowerCase())
      );
    }

    // Filter: gender
    const gender = searchParams.get("gender");
    if (gender) {
      const genders = gender.split(",").map((g) => g.trim().toLowerCase());
      products = products.filter(
        (p) =>
          genders.includes(p.gender.toLowerCase()) ||
          p.gender.toLowerCase() === "unisex"
      );
    }

    // Filter: tier
    const tier = searchParams.get("tier");
    if (tier) {
      const tiers = tier.split(",").map((t) => t.trim().toLowerCase());
      products = products.filter((p) => tiers.includes(p.tier.toLowerCase()));
    }

    // Filter: price range
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice) {
      products = products.filter((p) => p.price >= parseInt(minPrice));
    }
    if (maxPrice) {
      products = products.filter((p) => p.price <= parseInt(maxPrice));
    }

    // Filter: season (comma-separated)
    const season = searchParams.get("season");
    if (season) {
      const seasons = season.split(",").map((s) => s.trim().toLowerCase());
      products = products.filter((p) =>
        p.season.some(
          (s) =>
            seasons.includes(s.toLowerCase()) ||
            s.toLowerCase() === "year-round"
        )
      );
    }

    // Filter: occasion (comma-separated)
    const occasion = searchParams.get("occasion");
    if (occasion) {
      const occasions = occasion.split(",").map((o) => o.trim().toLowerCase());
      products = products.filter((p) =>
        p.occasion.some((o) => occasions.includes(o.toLowerCase()))
      );
    }

    // Filter: tags (comma-separated)
    const tags = searchParams.get("tags");
    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      products = products.filter((p) =>
        p.tags.some((t) => tagList.includes(t.toLowerCase()))
      );
    }

    // Filter: inStock
    const inStock = searchParams.get("inStock");
    if (inStock === "true") {
      products = products.filter((p) => p.inStock);
    }

    // Filter: discount only
    const discountOnly = searchParams.get("discountOnly");
    if (discountOnly === "true") {
      products = products.filter((p) => p.discount > 0);
    }

    // Search: name, brand, category, material, color
    const search = searchParams.get("search");
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q) ||
          p.color.toLowerCase().includes(q)
      );
    }

    // Sort
    const sort = searchParams.get("sort");
    switch (sort) {
      case "price_asc":
        products.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        products.sort((a, b) => b.price - a.price);
        break;
      case "brand_asc":
        products.sort((a, b) => a.brand.localeCompare(b.brand));
        break;
      case "discount":
        products.sort((a, b) => b.discount - a.discount);
        break;
      case "newest":
        // Reverse order (last items are "newest" in our mock data)
        products.reverse();
        break;
      default:
        // Default: no specific sort
        break;
    }

    // Compute aggregations for filters
    const allProducts = catalog.products;
    const aggregations = {
      brands: [...new Set(allProducts.map((p) => p.brand))].sort(),
      categories: [...new Set(allProducts.map((p) => p.category))].sort(),
      genders: [...new Set(allProducts.map((p) => p.gender))].sort(),
      tiers: [...new Set(allProducts.map((p) => p.tier))].sort(),
      occasions: [
        ...new Set(allProducts.flatMap((p) => p.occasion)),
      ].sort(),
      seasons: [...new Set(allProducts.flatMap((p) => p.season))].sort(),
      tags: [...new Set(allProducts.flatMap((p) => p.tags))].filter(Boolean).sort(),
      priceRange: {
        min: Math.min(...allProducts.map((p) => p.price)),
        max: Math.max(...allProducts.map((p) => p.price)),
      },
    };

    return NextResponse.json({
      products,
      total: products.length,
      totalCatalog: allProducts.length,
      aggregations,
      metadata: catalog.metadata,
    });
  } catch (error) {
    console.error("Catalog API error:", error);
    return NextResponse.json(
      { error: "Failed to load catalog data" },
      { status: 500 }
    );
  }
}
