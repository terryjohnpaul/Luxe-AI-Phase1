/**
 * Competitor Price Monitoring
 * Tracks pricing changes on Tata CLiQ Luxury, Myntra, brand direct stores
 * In production: Scrape competitor product pages + price alert system
 */

import { Signal } from "./types";

export interface CompetitorPriceChange {
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

export function getCompetitorPriceChanges(): CompetitorPriceChange[] {
  const now = new Date();
  const today = now.toISOString();
  return [
    {
      id: "cp-001",
      competitor: "Tata CLiQ Luxury",
      brand: "Hugo Boss",
      product: "BOSS Polo Shirt",
      originalPrice: 8999,
      currentPrice: 5999,
      discountPercent: 33,
      ourPrice: 7499,
      priceAdvantage: "they_are_cheaper",
      detectedAt: today,
      adResponse: "Tata CLiQ discounting Hugo Boss 33%. DON'T match — run aspirational Hugo Boss ads instead. 'Authentic luxury, full experience' positioning. Highlight faster delivery and better packaging.",
    },
    {
      id: "cp-002",
      competitor: "Myntra",
      brand: "Armani Exchange",
      product: "AX Logo T-Shirt",
      originalPrice: 5999,
      currentPrice: 3599,
      discountPercent: 40,
      ourPrice: 4499,
      priceAdvantage: "they_are_cheaper",
      detectedAt: today,
      adResponse: "Myntra heavily discounting AX. For accessible brands, consider matching. Run 'same brand, better experience' ads. Emphasize authenticity guarantee and luxury packaging.",
    },
    {
      id: "cp-003",
      competitor: "Tata CLiQ Luxury",
      brand: "Coach",
      product: "Coach Tabby Shoulder Bag",
      originalPrice: 42000,
      currentPrice: 42000,
      discountPercent: 0,
      ourPrice: 39500,
      priceAdvantage: "we_are_cheaper",
      detectedAt: today,
      adResponse: "We're INR 2,500 cheaper on Coach Tabby vs Tata CLiQ. Run price-comparison angle in Google Shopping. 'Same authentic Coach, better price on Ajio Luxe.'",
    },
    {
      id: "cp-004",
      competitor: "Hugo Boss Direct (hugoboss.com)",
      brand: "Hugo Boss",
      product: "BOSS Suit Jacket",
      originalPrice: 45000,
      currentPrice: 45000,
      discountPercent: 0,
      ourPrice: 38000,
      priceAdvantage: "we_are_cheaper",
      detectedAt: today,
      adResponse: "We're INR 7,000 cheaper than Hugo Boss direct store. Run Google Shopping ads targeting 'Hugo Boss suit buy online India'. Price advantage is a strong conversion driver.",
    },
    {
      id: "cp-005",
      competitor: "Myntra",
      brand: "Diesel",
      product: "Diesel 1DR Bag",
      originalPrice: 32000,
      currentPrice: 25600,
      discountPercent: 20,
      ourPrice: 30000,
      priceAdvantage: "they_are_cheaper",
      detectedAt: today,
      adResponse: "Myntra discounting Diesel 1DR 20%. This is a trending product (Lyst #1). Run 'authentic luxury experience' ads — don't compete on price. Push styling content and brand story.",
    },
    {
      id: "cp-006",
      competitor: "Tata CLiQ Luxury",
      brand: "Versace",
      product: "Versace Medusa Sunglasses",
      originalPrice: 22000,
      currentPrice: 22000,
      discountPercent: 0,
      ourPrice: 19500,
      priceAdvantage: "we_are_cheaper",
      detectedAt: today,
      adResponse: "Price advantage on Versace sunglasses. Summer is coming. Run Google Shopping + Instagram ads highlighting our price. Target 'Versace sunglasses India price' searches.",
    },
  ];
}

export function getCompetitorPricingSignals(): Signal[] {
  const changes = getCompetitorPriceChanges();
  const now = new Date();
  return changes.map(c => ({
    id: `pricing-${c.id}`,
    type: "competitor" as const,
    title: c.discountPercent > 0
      ? `${c.competitor} discounting ${c.brand} ${c.product} ${c.discountPercent}% off`
      : `Price advantage: We're INR ${(c.currentPrice - c.ourPrice).toLocaleString()} cheaper on ${c.brand} ${c.product}`,
    description: `${c.competitor}: INR ${c.currentPrice.toLocaleString()} vs Our price: INR ${c.ourPrice.toLocaleString()}. ${c.adResponse}`,
    location: "Pan India",
    severity: c.discountPercent >= 30 ? "high" as const : c.priceAdvantage === "we_are_cheaper" ? "medium" as const : "low" as const,
    triggersWhat: c.product,
    targetArchetypes: ["Fashion Loyalist", "Price-Conscious Luxury"],
    suggestedBrands: [c.brand],
    confidence: 0.95,
    source: "Price Monitor",
    detectedAt: now,
    expiresAt: new Date(now.getTime() + 3 * 86400000),
    suggestedAction: c.adResponse,
    data: { competitor: c.competitor, product: c.product, discount: c.discountPercent, priceAdvantage: c.priceAdvantage, ourPrice: c.ourPrice, theirPrice: c.currentPrice },
  }));
}
