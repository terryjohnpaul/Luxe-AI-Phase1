import { NextResponse } from "next/server";

interface WeddingPhase {
  id: string;
  name: string;
  description: string;
  categories: string[];
  brands: string[];
  adAngle: string;
  sampleAds: {
    headline: string;
    body: string;
    cta: string;
    targeting: string;
    platforms: string[];
    brandTier: "luxury" | "premium" | "accessible";
  }[];
}

interface WeddingSeason {
  id: string;
  name: string;
  period: string;
  status: "active" | "upcoming" | "peak" | "ending";
  regions: string[];
  description: string;
  daysUntil: number;
  intensity: number; // 1-10
}

interface GiftingOccasion {
  id: string;
  name: string;
  date: string;
  daysUntil: number;
  giftCategories: string[];
  targetBrands: string[];
  campaignAngle: string;
  sampleAd: {
    headline: string;
    body: string;
    cta: string;
  };
  budgetSuggestion: string;
}

function getWeddingSeasons(): WeddingSeason[] {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed

  return [
    {
      id: "ws-peak-winter",
      name: "Peak Wedding Season — Winter",
      period: "October – December",
      status: month >= 9 && month <= 11 ? "active" : month === 8 ? "upcoming" : "ending",
      regions: ["North India", "West India", "Pan India"],
      description: "India's biggest wedding season. Navratri through December. 60% of all Indian weddings happen in this window.",
      daysUntil: month < 9 ? Math.floor((new Date(now.getFullYear(), 9, 1).getTime() - now.getTime()) / 86400000) : 0,
      intensity: 10,
    },
    {
      id: "ws-spring",
      name: "Spring Wedding Season",
      period: "February – April",
      status: month >= 1 && month <= 3 ? "active" : month === 0 ? "upcoming" : "ending",
      regions: ["South India", "East India", "Pan India"],
      description: "Second major wedding window. South Indian weddings peak here. Post-Makar Sankranti auspicious dates.",
      daysUntil: month > 3 ? Math.floor((new Date(now.getFullYear() + 1, 1, 1).getTime() - now.getTime()) / 86400000) : 0,
      intensity: 8,
    },
    {
      id: "ws-monsoon-break",
      name: "Monsoon Lull",
      period: "June – August",
      status: month >= 5 && month <= 7 ? "active" : "upcoming",
      regions: ["Pan India"],
      description: "Fewest weddings. Focus shifts to pre-wedding shopping for October season. Engagement & roka ceremonies continue.",
      daysUntil: 0,
      intensity: 3,
    },
    {
      id: "ws-pre-season",
      name: "Pre-Season Shopping Window",
      period: "August – September",
      status: month >= 7 && month <= 8 ? "active" : "upcoming",
      regions: ["Pan India"],
      description: "Brides and families start shopping for October-December weddings. Trousseau building peaks. Critical ad window.",
      daysUntil: month < 7 ? Math.floor((new Date(now.getFullYear(), 7, 1).getTime() - now.getTime()) / 86400000) : 0,
      intensity: 7,
    },
  ];
}

function getWeddingPhases(): WeddingPhase[] {
  return [
    {
      id: "phase-engagement",
      name: "Engagement / Roka",
      description: "First formal event. Families exchange gifts. Couple dresses sharp but not OTT. Accessible luxury sweet spot.",
      categories: ["Watches", "Fragrances", "Sunglasses", "Wallets", "Small Leather Goods"],
      brands: ["Hugo Boss", "Coach", "Michael Kors", "Armani Exchange", "Lacoste"],
      adAngle: "Gift the milestone — meaningful luxury for the first 'yes'",
      sampleAds: [
        {
          headline: "The Engagement Gift Guide — Ajio Luxe",
          body: "Mark the moment with something unforgettable. Hugo Boss watches, Coach wallets, and more — luxury gifts that say 'forever' starts now.",
          cta: "Shop Engagement Gifts",
          targeting: "25-50, Interest: Engagement + Luxury Gifts + Wedding Planning, Metro + Tier 1",
          platforms: ["Instagram Feed", "Google Shopping", "Facebook Feed"],
          brandTier: "premium",
        },
        {
          headline: "His & Hers — Luxury Engagement Gifts",
          body: "For the couple who deserves the best. Matching luxury from Hugo Boss, Coach & Michael Kors. Starting INR 5,000.",
          cta: "Explore Gifts",
          targeting: "25-45, Interest: Couple gifts + Engagement + Premium brands",
          platforms: ["Instagram Stories", "Facebook Feed"],
          brandTier: "accessible",
        },
      ],
    },
    {
      id: "phase-sangeet",
      name: "Sangeet & Cocktail",
      description: "Party night. Bold fashion. Statement pieces. This is where Versace, Diesel, Roberto Cavalli shine.",
      categories: ["Bold Shirts", "Statement Bags", "Party Shoes", "Sunglasses", "Jewelry"],
      brands: ["Versace", "Diesel", "Roberto Cavalli", "Jimmy Choo", "Kenzo"],
      adAngle: "Turn heads at the sangeet — bold luxury for the biggest party of the year",
      sampleAds: [
        {
          headline: "Sangeet-Ready: Versace Prints That Own the Night",
          body: "The sangeet is YOUR red carpet. Versace baroque prints, Diesel edge, Jimmy Choo heels. Make them remember your entrance.",
          cta: "Shop Sangeet Edit",
          targeting: "22-40, Interest: Wedding + Party Fashion + Bollywood Style, Metro cities",
          platforms: ["Instagram Reels", "Instagram Stories", "YouTube Shorts"],
          brandTier: "premium",
        },
      ],
    },
    {
      id: "phase-mehendi",
      name: "Mehendi & Haldi",
      description: "Casual luxury. Relaxed fits. Pastel colors. Think daytime sophistication.",
      categories: ["Casual Shirts", "Sneakers", "Crossbody Bags", "Scarves", "Light Fragrances"],
      brands: ["Sandro", "Maje", "Maison Kitsune", "Lacoste", "Coach"],
      adAngle: "Effortless luxury for the mehendi — look perfect without trying too hard",
      sampleAds: [
        {
          headline: "Mehendi Mornings — Luxury, But Make It Easy",
          body: "Sun-kissed mehendi vibes call for effortless style. Sandro pastels, Maison Kitsune knits, Coach crossbodies. Luxe without the fuss.",
          cta: "Shop Mehendi Edit",
          targeting: "22-38 F, Interest: Wedding functions + Casual luxury + Pastel fashion",
          platforms: ["Instagram Feed", "Instagram Stories"],
          brandTier: "premium",
        },
      ],
    },
    {
      id: "phase-wedding-day",
      name: "Wedding Day",
      description: "The main event. Guests need to look flawless. Luxury watches, bags, shoes, fragrances as finishing touches.",
      categories: ["Formal Shoes", "Luxury Watches", "Clutches", "Premium Fragrances", "Cufflinks"],
      brands: ["Hugo Boss", "Jimmy Choo", "Versace", "Max Mara", "Coach"],
      adAngle: "Complete the wedding look — the luxury details that make the outfit",
      sampleAds: [
        {
          headline: "The Wedding Guest Edit — Luxury Details",
          body: "The outfit is set. Now add the details that make it unforgettable. Hugo Boss shoes, Jimmy Choo clutches, Versace accessories.",
          cta: "Complete Your Look",
          targeting: "25-50, Interest: Wedding guest fashion + Luxury accessories + Formal wear, Pan India",
          platforms: ["Instagram Feed", "Google Shopping", "Facebook Feed"],
          brandTier: "luxury",
        },
      ],
    },
    {
      id: "phase-reception",
      name: "Reception Night",
      description: "Glamour turned up to max. Black tie, cocktail, red carpet energy. Premium and luxury brands dominate.",
      categories: ["Blazers", "Evening Bags", "Heels", "Ties & Pocket Squares", "Statement Watches"],
      brands: ["Hugo Boss", "Versace", "Jimmy Choo", "Max Mara", "Roberto Cavalli"],
      adAngle: "Reception-ready luxury — dress like the main character",
      sampleAds: [
        {
          headline: "Reception Night — Dress Like You Mean It",
          body: "Hugo Boss blazers, Jimmy Choo heels, Versace statement pieces. The reception is your moment. Own it with Ajio Luxe.",
          cta: "Shop Reception Edit",
          targeting: "25-45, Interest: Luxury fashion + Black tie + Party wear + Wedding",
          platforms: ["Instagram Reels", "Instagram Feed"],
          brandTier: "luxury",
        },
      ],
    },
    {
      id: "phase-honeymoon",
      name: "Honeymoon Wardrobe",
      description: "Post-wedding luxury shopping. Travel wardrobes. Beachwear. International trip essentials.",
      categories: ["Travel Bags", "Sunglasses", "Resort Wear", "Sneakers", "Fragrances"],
      brands: ["Coach", "Hugo Boss", "Michael Kors", "Diesel", "Marc Jacobs"],
      adAngle: "Pack luxury for the honeymoon — travel wardrobes that start the journey right",
      sampleAds: [
        {
          headline: "Honeymoon Ready — Pack Luxury",
          body: "Maldives, Bali, or Europe — your honeymoon wardrobe starts here. Coach travel bags, Hugo Boss resort wear, Marc Jacobs sunglasses.",
          cta: "Shop Honeymoon Edit",
          targeting: "25-40, Interest: Honeymoon + Travel + Newlywed + Luxury travel, Metro + Tier 1",
          platforms: ["Instagram Feed", "Google Shopping", "Facebook Feed"],
          brandTier: "premium",
        },
      ],
    },
    {
      id: "phase-trousseau",
      name: "Trousseau Building",
      description: "The bride's luxury wardrobe for married life. Multiple occasion dressing. High AOV. Extended shopping window (2-3 months before wedding).",
      categories: ["Complete Wardrobe", "Bags Collection", "Shoes Collection", "Accessories", "Fragrances"],
      brands: ["Hugo Boss", "Max Mara", "Coach", "Michael Kors", "Sandro", "Maje", "Jimmy Choo"],
      adAngle: "Build your trousseau with the world's best brands — one luxury piece at a time",
      sampleAds: [
        {
          headline: "The Modern Trousseau — Ajio Luxe Bridal Edit",
          body: "Your trousseau deserves more than one brand. Hugo Boss for power dressing. Coach for everyday luxury. Jimmy Choo for every special night. Start building on Ajio Luxe.",
          cta: "Build Your Trousseau",
          targeting: "Women 22-35, Engaged/Bride-to-be, Interest: Wedding planning + Luxury shopping + Trousseau",
          platforms: ["Instagram Feed", "Instagram Stories", "Google Display", "Facebook Feed"],
          brandTier: "luxury",
        },
      ],
    },
  ];
}

function getGiftingOccasions(): GiftingOccasion[] {
  const now = new Date();
  const year = now.getFullYear();

  const occasions = [
    {
      id: "gift-karva-chauth",
      name: "Karva Chauth",
      date: `${year}-10-21`,
      giftCategories: ["Bags", "Jewelry", "Watches", "Fragrances"],
      targetBrands: ["Coach", "Michael Kors", "Hugo Boss", "Jimmy Choo"],
      campaignAngle: "Luxury gifts for the woman who deserves the moon",
      sampleAd: {
        headline: "Karva Chauth Gifts — Make Her Moon Shine",
        body: "This Karva Chauth, gift her something as precious as her love. Coach Tabby, Michael Kors watches, Jimmy Choo heels. Free gift wrapping on Ajio Luxe.",
        cta: "Shop KC Gifts",
      },
      budgetSuggestion: "INR 2-5L for 7-day pre-KC campaign",
    },
    {
      id: "gift-rakhi",
      name: "Raksha Bandhan",
      date: `${year}-08-09`,
      giftCategories: ["Wallets", "Watches", "Belts", "Fragrances", "Sunglasses"],
      targetBrands: ["Hugo Boss", "Armani Exchange", "Diesel", "Lacoste"],
      campaignAngle: "Luxury gifts for your brother — because he deserves better than a shirt",
      sampleAd: {
        headline: "Rakhi Gifts He'll Actually Use — Hugo Boss, Diesel & More",
        body: "Skip the generic. Gift him luxury he'll carry every day. Hugo Boss wallets, Diesel watches, Armani Exchange belts. Starting INR 3,500.",
        cta: "Shop Rakhi Gifts",
      },
      budgetSuggestion: "INR 1-3L for 10-day campaign",
    },
    {
      id: "gift-diwali-personal",
      name: "Diwali Personal Gifting",
      date: `${year}-10-20`,
      giftCategories: ["Gift Sets", "Fragrances", "Bags", "Wallets", "Watches"],
      targetBrands: ["Hugo Boss", "Coach", "Versace", "Michael Kors", "Marc Jacobs"],
      campaignAngle: "Diwali gifts that glow brighter than diyas",
      sampleAd: {
        headline: "Diwali Luxury Gift Guide 2026",
        body: "Light up their Diwali with luxury. Hugo Boss gift sets, Coach bags, Versace fragrances. Gift-wrapped and delivered. Shop on Ajio Luxe.",
        cta: "Shop Diwali Gifts",
      },
      budgetSuggestion: "INR 5-10L for 14-day campaign (biggest gifting event)",
    },
    {
      id: "gift-diwali-corporate",
      name: "Diwali Corporate Gifting",
      date: `${year}-10-15`,
      giftCategories: ["Gift Sets", "Fragrances", "Leather Goods", "Desk Accessories"],
      targetBrands: ["Hugo Boss", "Coach", "Armani Exchange", "Lacoste"],
      campaignAngle: "Impress clients and teams with luxury Diwali gifts — bulk orders available",
      sampleAd: {
        headline: "Corporate Diwali Gifts — Luxury in Bulk",
        body: "Hugo Boss gift sets, Coach leather goods, Armani Exchange accessories. Bulk pricing for 10+ gifts. Corporate invoicing available. Order on Ajio Luxe.",
        cta: "Get Corporate Pricing",
      },
      budgetSuggestion: "INR 3-8L targeting LinkedIn + Google Search for 'corporate gifts luxury'",
    },
    {
      id: "gift-valentines",
      name: "Valentine's Day",
      date: `${year}-02-14`,
      giftCategories: ["Bags", "Fragrances", "Jewelry", "Watches", "Shoes"],
      targetBrands: ["Coach", "Marc Jacobs", "Jimmy Choo", "Versace", "Hugo Boss"],
      campaignAngle: "Luxury love — gifts that speak louder than words",
      sampleAd: {
        headline: "Valentine's Day — Gift Luxury, Gift Love",
        body: "Coach heart collection, Marc Jacobs fragrance, Jimmy Choo heels. Say it with luxury. Free gift wrapping + express delivery on Ajio Luxe.",
        cta: "Shop V-Day Gifts",
      },
      budgetSuggestion: "INR 2-4L for 7-day campaign",
    },
    {
      id: "gift-anniversary",
      name: "Wedding Anniversary Season",
      date: `${year}-11-15`,
      giftCategories: ["Luxury Watches", "Premium Bags", "Couple Sets", "Fragrances"],
      targetBrands: ["Hugo Boss", "Coach", "Michael Kors", "Versace"],
      campaignAngle: "Always-on anniversary campaign — luxury milestones deserve luxury gifts",
      sampleAd: {
        headline: "Anniversary Worthy — Luxury Gifts on Ajio Luxe",
        body: "Another year, another reason to celebrate with luxury. Hugo Boss his & hers watches, Coach bags, Versace fragrances. Make every anniversary unforgettable.",
        cta: "Shop Anniversary Gifts",
      },
      budgetSuggestion: "INR 50K-1L/month always-on campaign",
    },
    {
      id: "gift-mothers-day",
      name: "Mother's Day",
      date: `${year}-05-11`,
      giftCategories: ["Bags", "Scarves", "Fragrances", "Sunglasses"],
      targetBrands: ["Coach", "Max Mara", "Michael Kors", "Marc Jacobs", "Sandro"],
      campaignAngle: "She gave you everything — give her luxury",
      sampleAd: {
        headline: "Mother's Day — She Deserves Luxury",
        body: "The woman who gave you everything deserves Coach, Max Mara, Marc Jacobs. Luxury gifts that say 'thank you' the way she deserves. Shop Ajio Luxe.",
        cta: "Shop for Mom",
      },
      budgetSuggestion: "INR 1-2L for 5-day campaign",
    },
    {
      id: "gift-fathers-day",
      name: "Father's Day",
      date: `${year}-06-15`,
      giftCategories: ["Wallets", "Belts", "Watches", "Fragrances", "Polo Shirts"],
      targetBrands: ["Hugo Boss", "Armani Exchange", "Diesel", "Lacoste"],
      campaignAngle: "Upgrade his style — luxury for the man who never buys for himself",
      sampleAd: {
        headline: "Father's Day — Luxury He Won't Buy Himself",
        body: "Hugo Boss wallet, Diesel watch, Lacoste polo. The luxury upgrade Dad deserves but never buys. Gift it on Ajio Luxe.",
        cta: "Shop for Dad",
      },
      budgetSuggestion: "INR 1-2L for 5-day campaign",
    },
  ];

  return occasions.map(o => ({
    ...o,
    daysUntil: Math.max(0, Math.floor((new Date(o.date).getTime() - now.getTime()) / 86400000)),
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phase = searchParams.get("phase") || "all";

  const seasons = getWeddingSeasons();
  const phases = getWeddingPhases();
  const giftingOccasions = getGiftingOccasions().sort((a, b) => a.daysUntil - b.daysUntil);

  const activeSeasons = seasons.filter(s => s.status === "active");
  const upcomingGifts = giftingOccasions.filter(g => g.daysUntil > 0 && g.daysUntil <= 60);

  let filteredPhases = phases;
  if (phase !== "all") {
    filteredPhases = phases.filter(p => p.id === phase);
  }

  return NextResponse.json({
    seasons,
    phases: filteredPhases,
    giftingOccasions,
    summary: {
      activeSeasons: activeSeasons.length,
      totalPhases: phases.length,
      upcomingGiftingOccasions: upcomingGifts.length,
      nextGiftingEvent: giftingOccasions.find(g => g.daysUntil > 0)?.name || "None upcoming",
      currentIntensity: activeSeasons.length > 0 ? Math.max(...activeSeasons.map(s => s.intensity)) : 0,
    },
    fetchedAt: new Date().toISOString(),
  });
}
