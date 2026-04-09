/**
 * Instagram Trending Hashtags Intelligence
 * Tracks luxury fashion hashtags trending on Instagram
 * In production: Instagram Graph API + hashtag search endpoint
 */

import { Signal } from "./types";

export interface TrendingHashtag {
  hashtag: string;
  category: string;
  weeklyPosts: string;
  growthPercent: number;
  topBrands: string[];
  aesthetic: string;
  adAngle: string;
  targetAudience: string;
}

export function getInstagramTrends(): TrendingHashtag[] {
  return [
    {
      hashtag: "#QuietLuxury",
      category: "Style Aesthetic",
      weeklyPosts: "2.8M",
      growthPercent: 380,
      topBrands: ["Max Mara", "Hugo Boss", "Sandro", "Maje"],
      aesthetic: "Minimal, logo-free, quality fabrics, muted tones",
      adAngle: "Run editorial-style ads with no visible logos. 'Luxury that whispers, not shouts' messaging. Push Max Mara coats, Hugo Boss tailoring, Sandro knits.",
      targetAudience: "Women 25-45, professionals, metro cities",
    },
    {
      hashtag: "#OldMoneyAesthetic",
      category: "Style Aesthetic",
      weeklyPosts: "4.2M",
      growthPercent: 450,
      topBrands: ["Hugo Boss", "Lacoste", "Armani Exchange", "Max Mara"],
      aesthetic: "Preppy, polished, old European money, classic silhouettes",
      adAngle: "Run 'timeless elegance' campaigns. Hugo Boss polos + blazers, Lacoste heritage pieces. Target aspirational young professionals who want to look 'established money'.",
      targetAudience: "Men & Women 20-35, aspirational",
    },
    {
      hashtag: "#StreetLuxury",
      category: "Style Aesthetic",
      weeklyPosts: "1.5M",
      growthPercent: 200,
      topBrands: ["Diesel", "Kenzo", "A-Cold-Wall", "Y-3", "Maison Kitsune"],
      aesthetic: "High fashion meets streetwear, bold logos, statement pieces",
      adAngle: "Run Reels-first campaign with street style content. Diesel 1DR, Kenzo Tiger, ACW minimal. Target Gen Z fashion-forward audience.",
      targetAudience: "18-30, streetwear enthusiasts, metro cities",
    },
    {
      hashtag: "#LuxuryUnboxing",
      category: "Content Format",
      weeklyPosts: "890K",
      growthPercent: 160,
      topBrands: ["Coach", "Marc Jacobs", "Jimmy Choo", "Versace"],
      aesthetic: "Packaging experience, first impressions, premium presentation",
      adAngle: "Create unboxing-style video ads showing the Ajio Luxe packaging experience. 'The luxury begins before you open the box' messaging. UGC-style content performs best.",
      targetAudience: "18-35, first luxury buyers, social media active",
    },
    {
      hashtag: "#WeddingGuestOutfit",
      category: "Occasion",
      weeklyPosts: "3.1M",
      growthPercent: 280,
      topBrands: ["Hugo Boss", "Versace", "Max Mara", "Jimmy Choo"],
      aesthetic: "Wedding guest dressing, formal/semi-formal, statement pieces",
      adAngle: "Wedding season drives this hashtag. Run occasion-specific ads — 'The perfect wedding guest look' with complete outfit suggestions per brand. Cross-sell shoes + bags + outfit.",
      targetAudience: "25-45, wedding season, pan India",
    },
    {
      hashtag: "#LuxuryFinds",
      category: "Discovery",
      weeklyPosts: "1.8M",
      growthPercent: 190,
      topBrands: ["Coach", "Marc Jacobs", "Michael Kors", "Armani Exchange"],
      aesthetic: "Affordable luxury, smart buys, accessible entry points",
      adAngle: "Target first luxury buyers. 'Your first luxury piece' messaging. Show entry-level products under INR 15,000. Coach wallets, AX tees, Marc Jacobs accessories.",
      targetAudience: "18-30, first-time luxury buyers, tier 1-2 cities",
    },
    {
      hashtag: "#IndianLuxury",
      category: "Regional",
      weeklyPosts: "620K",
      growthPercent: 140,
      topBrands: ["Hugo Boss", "Coach", "Versace", "Diesel"],
      aesthetic: "International luxury adapted to Indian sensibilities",
      adAngle: "India-specific luxury content. Show products styled for Indian occasions — Diwali parties, wedding functions, office wear in Indian cities. Relatable luxury.",
      targetAudience: "25-45, Indian metro cities, new to international luxury",
    },
  ];
}

export function getInstagramHashtagSignals(): Signal[] {
  const trends = getInstagramTrends();
  const now = new Date();
  return trends.filter(t => t.growthPercent >= 200).map((t, i) => ({
    id: `instagram-hashtag-${i}`,
    type: "social_trend" as const,
    title: `Instagram: ${t.hashtag} trending (+${t.growthPercent}%) — ${t.weeklyPosts} posts/week`,
    description: `Aesthetic: ${t.aesthetic}. ${t.adAngle}`,
    location: "Pan India",
    severity: t.growthPercent >= 300 ? "high" as const : "medium" as const,
    triggersWhat: t.category,
    targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
    suggestedBrands: t.topBrands,
    confidence: 0.8,
    source: "Instagram Trends",
    detectedAt: now,
    expiresAt: new Date(now.getTime() + 14 * 86400000),
    suggestedAction: t.adAngle,
    data: { hashtag: t.hashtag, growth: t.growthPercent, weeklyPosts: t.weeklyPosts, aesthetic: t.aesthetic, audience: t.targetAudience },
  }));
}
