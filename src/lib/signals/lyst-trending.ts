/**
 * Lyst Trending Intelligence
 * Tracks hottest luxury products and brands from Lyst Index
 * In production: Scrape lyst.com/year-in-fashion/ quarterly reports
 */

import { Signal } from "./types";

export interface LystProduct {
  rank: number;
  product: string;
  brand: string;
  category: string;
  searchGrowth: number;
  socialMentions: string;
  pageViews: string;
  availableOnAjioLuxe: boolean;
  adOpportunity: string;
}

export function getLystTrending(): LystProduct[] {
  return [
    {
      rank: 1,
      product: "Diesel 1DR Shoulder Bag",
      brand: "Diesel",
      category: "Bags",
      searchGrowth: 245,
      socialMentions: "89K this month",
      pageViews: "1.2M",
      availableOnAjioLuxe: true,
      adOpportunity: "Lyst #1 trending product. Run hero product ads — Reels showing styling, carousel with colorways. 'The bag everyone wants' angle.",
    },
    {
      rank: 3,
      product: "Coach Tabby Shoulder Bag 26",
      brand: "Coach",
      category: "Bags",
      searchGrowth: 180,
      socialMentions: "62K this month",
      pageViews: "890K",
      availableOnAjioLuxe: true,
      adOpportunity: "Top 3 globally. Push Coach Tabby as hero product. 'Most wanted bag on the planet' messaging. Target first luxury buyers.",
    },
    {
      rank: 7,
      product: "Hugo Boss Slim-Fit Suit",
      brand: "Hugo Boss",
      category: "Tailoring",
      searchGrowth: 120,
      socialMentions: "34K this month",
      pageViews: "450K",
      availableOnAjioLuxe: true,
      adOpportunity: "Suit demand rising. Target wedding season + corporate professionals. 'The suit of the moment' positioning.",
    },
    {
      rank: 12,
      product: "Versace Medusa Head Sunglasses",
      brand: "Versace",
      category: "Eyewear",
      searchGrowth: 95,
      socialMentions: "28K this month",
      pageViews: "320K",
      availableOnAjioLuxe: true,
      adOpportunity: "Summer approaching. Sunglasses searches spike. Run Versace eyewear campaign with celebrity styling.",
    },
    {
      rank: 15,
      product: "Jimmy Choo Bing Mules",
      brand: "Jimmy Choo",
      category: "Shoes",
      searchGrowth: 110,
      socialMentions: "22K this month",
      pageViews: "280K",
      availableOnAjioLuxe: true,
      adOpportunity: "Consistent best-seller. Run 'iconic shoes' campaign. Target party/event shoppers and wedding guests.",
    },
    {
      rank: 18,
      product: "Kenzo Tiger Embroidered Sweatshirt",
      brand: "Kenzo",
      category: "Ready-to-Wear",
      searchGrowth: 85,
      socialMentions: "18K this month",
      pageViews: "210K",
      availableOnAjioLuxe: true,
      adOpportunity: "Kenzo Tiger is an entry-level luxury icon. Target Gen Z with streetwear styling. Instagram Reels focus.",
    },
    {
      rank: 22,
      product: "Marc Jacobs Tote Bag",
      brand: "Marc Jacobs",
      category: "Bags",
      searchGrowth: 150,
      socialMentions: "45K this month",
      pageViews: "380K",
      availableOnAjioLuxe: true,
      adOpportunity: "Marc Jacobs Tote is a viral TikTok product. Run social proof ads — 'The tote that broke the internet' messaging.",
    },
  ];
}

export function getLystSignals(): Signal[] {
  const products = getLystTrending();
  const now = new Date();
  return products.filter(p => p.rank <= 15 && p.availableOnAjioLuxe).map(p => ({
    id: `lyst-${p.rank}`,
    type: "search_trend" as const,
    title: `Lyst #${p.rank}: ${p.product} is globally trending (+${p.searchGrowth}%)`,
    description: `${p.socialMentions} social mentions. ${p.pageViews} page views. ${p.adOpportunity}`,
    location: "Global",
    severity: p.rank <= 5 ? "high" as const : "medium" as const,
    triggersWhat: p.category,
    targetArchetypes: ["Fashion Loyalist", "Occasional Splurger"],
    suggestedBrands: [p.brand],
    confidence: 0.9,
    source: "Lyst Index",
    detectedAt: now,
    expiresAt: new Date(now.getTime() + 14 * 86400000),
    suggestedAction: p.adOpportunity,
    data: { rank: p.rank, product: p.product, searchGrowth: p.searchGrowth, socialMentions: p.socialMentions },
  }));
}
