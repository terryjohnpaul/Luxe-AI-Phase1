import { NextResponse } from "next/server";
import { MONITORED_COMPETITORS } from "@/lib/integrations/meta-ad-library";
import { GOOGLE_MONITORED_COMPETITORS } from "@/lib/integrations/google-ad-transparency";

const mockCompetitorAds = [
  {
    competitor: "Tata CLiQ Luxury",
    platform: "Meta",
    adType: "Carousel",
    headline: "Luxury at Your Doorstep — Up to 40% Off",
    body: "Shop the finest luxury brands with Tata CLiQ Luxury. Hugo Boss, Coach, Michael Kors & more. Free delivery on orders above INR 5,000.",
    cta: "Shop Now",
    estimatedSpend: "INR 2-5L/week",
    impressions: "10-15 lakh/week",
    status: "active",
    startDate: "2026-03-15",
    platforms: ["Instagram Feed", "Facebook Feed", "Instagram Stories"],
    targeting: "India, 25-55, Interest: Luxury Fashion",
    snapshotUrl: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=tata%20cliq%20luxury",
    insight: "Running discount-heavy messaging. 40% off headline — this is the anti-luxury approach. We should counter with aspiration, NOT match their discounts.",
  },
  {
    competitor: "Tata CLiQ Luxury",
    platform: "Meta",
    adType: "Reels",
    headline: "HSBC Luxe Avenue — Exclusive Access",
    body: "HSBC cardholders get exclusive early access to luxury brands. Shop now and earn 5x reward points. Premium delivery to your door.",
    cta: "Shop Now",
    estimatedSpend: "INR 1-3L/week",
    impressions: "5-8 lakh/week",
    status: "active",
    startDate: "2026-03-20",
    platforms: ["Instagram Reels", "Facebook Reels"],
    targeting: "India, HSBC cardholders, 30-50, High income",
    snapshotUrl: "",
    insight: "HSBC bank partnership ad. They're locking in HNI customers through credit card relationships. We need a similar Amex/HDFC partnership.",
  },
  {
    competitor: "Tata CLiQ Luxury",
    platform: "Google",
    adType: "Search",
    headline: "Luxury Fashion India — Tata CLiQ Luxury™",
    body: "Shop 4,100+ Luxury Brands. Free Delivery. Easy Returns. Gucci, Burberry, Coach & More. India's Premier Luxury Destination.",
    cta: "Visit Site",
    estimatedSpend: "INR 3-6L/week",
    impressions: "N/A (Search)",
    status: "active",
    startDate: "2026-01-01",
    platforms: ["Google Search"],
    targeting: "Keywords: luxury fashion India, designer brands online, buy luxury online",
    snapshotUrl: "https://adstransparency.google.com",
    insight: "Bidding on generic luxury keywords. Claiming '4,100+ brands' — we have 800+. They're winning on catalog breadth messaging.",
  },
  {
    competitor: "Myntra",
    platform: "Meta",
    adType: "Video",
    headline: "Myntra Luxe — Designer Fashion",
    body: "Shop premium designer brands with up to 60% off. Myntra Luxe brings you the world's best fashion. Easy returns. Fast delivery.",
    cta: "Shop Now",
    estimatedSpend: "INR 8-15L/week",
    impressions: "30-50 lakh/week",
    status: "active",
    startDate: "2026-03-01",
    platforms: ["Instagram Reels", "YouTube", "Facebook Feed"],
    targeting: "India, 18-45, Broad",
    snapshotUrl: "",
    insight: "Massive budget. '60% off' messaging — targeting price-sensitive mass premium, not true luxury. Different customer entirely. Don't compete on price.",
  },
  {
    competitor: "Hugo Boss India",
    platform: "Meta",
    adType: "Static Image",
    headline: "BOSS Spring Summer 2026",
    body: "Discover the new BOSS Spring Summer collection. Modern tailoring meets relaxed sophistication.",
    cta: "Explore",
    estimatedSpend: "INR 50K-1L/week",
    impressions: "3-5 lakh/week",
    status: "active",
    startDate: "2026-03-10",
    platforms: ["Instagram Feed", "Instagram Stories"],
    targeting: "India, 25-50, Male, Interest: Fashion, Business",
    snapshotUrl: "",
    insight: "Hugo Boss running their own India campaign. Aspirational tone, no discounts. Our Hugo Boss ads should complement, not compete with their brand ads.",
  },
  {
    competitor: "Hugo Boss India",
    platform: "Google",
    adType: "Shopping",
    headline: "Hugo Boss Polo Shirt — Official Store",
    body: "Shop authentic Hugo Boss polo shirts. Starting INR 5,999. Free shipping. Official Hugo Boss India.",
    cta: "Shop Now",
    estimatedSpend: "INR 30K-80K/week",
    impressions: "N/A (Shopping)",
    status: "active",
    startDate: "2026-02-01",
    platforms: ["Google Shopping"],
    targeting: "Keywords: Hugo Boss polo, Hugo Boss India, Boss polo shirt price",
    snapshotUrl: "",
    insight: "Hugo Boss starting at INR 5,999 on their own store. Our Hugo Boss starts at INR 3,500. We have a price advantage on some items.",
  },
  {
    competitor: "Coach India",
    platform: "Meta",
    adType: "Carousel",
    headline: "The Tabby — Coach's Most Iconic Bag",
    body: "The bag that defined a generation. Discover the Tabby collection in new seasonal colors. Handcrafted since 1941.",
    cta: "Shop Now",
    estimatedSpend: "INR 40K-1L/week",
    impressions: "2-4 lakh/week",
    status: "active",
    startDate: "2026-03-18",
    platforms: ["Instagram Feed", "Instagram Stories", "Facebook Feed"],
    targeting: "India, 22-40, Female, Interest: Handbags, Fashion",
    snapshotUrl: "",
    insight: "Coach pushing Tabby bag hard — it's their hero product. We carry Coach Tabby. Ride their brand awareness and retarget their audience with our pricing.",
  },
  {
    competitor: "Diesel India",
    platform: "Meta",
    adType: "Reels",
    headline: "For Successful Living",
    body: "Diesel 1DR bag. The cult bag everyone's talking about. Available now in India.",
    cta: "Explore",
    estimatedSpend: "INR 20K-60K/week",
    impressions: "1-3 lakh/week",
    status: "active",
    startDate: "2026-03-22",
    platforms: ["Instagram Reels"],
    targeting: "India, 20-35, Interest: Streetwear, Luxury",
    snapshotUrl: "",
    insight: "Diesel pushing 1DR bag on Reels. Young male audience. If we carry this bag, we should create similar Reels content showing it on Ajio Luxe.",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const competitor = searchParams.get("competitor") || "all";
  const platform = searchParams.get("platform") || "all";

  let ads = mockCompetitorAds;

  if (competitor !== "all") {
    ads = ads.filter(a => a.competitor.toLowerCase().includes(competitor.toLowerCase()));
  }
  if (platform !== "all") {
    ads = ads.filter(a => a.platform.toLowerCase() === platform.toLowerCase());
  }

  const competitors = [...new Set(ads.map(a => a.competitor))];
  const totalAds = ads.length;
  const metaAds = ads.filter(a => a.platform === "Meta").length;
  const googleAds = ads.filter(a => a.platform === "Google").length;

  const apiStatus = {
    metaAdLibrary: process.env.APIFY_API_TOKEN ? "connected" : "demo_mode",
    googleTransparency: "demo_mode",
  };

  return NextResponse.json({
    ads,
    summary: {
      totalAds,
      competitors: competitors.length,
      metaAds,
      googleAds,
      monitoredCompetitors: MONITORED_COMPETITORS.length,
      monitoredOnGoogle: GOOGLE_MONITORED_COMPETITORS.length,
    },
    apiStatus,
    monitorList: {
      meta: MONITORED_COMPETITORS.map(c => ({ name: c.name, category: c.category })),
      google: GOOGLE_MONITORED_COMPETITORS.map(c => ({ name: c.name, domain: c.domain, category: c.category })),
    },
    fetchedAt: new Date().toISOString(),
  });
}
