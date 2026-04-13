import { NextResponse } from "next/server";
import { MONITORED_COMPETITORS } from "@/lib/integrations/meta-ad-library";
import { GOOGLE_MONITORED_COMPETITORS } from "@/lib/integrations/google-ad-transparency";
import { getCompetitorPricingSignals } from "@/lib/signals/competitor-pricing";
// Meta Ad Library scraping disabled — Apify actor input format issues
import { cachedFetch, registerForPrewarm } from "@/lib/api-cache";

// Search these names in Meta Ad Library for competitor ad creatives
const COMPETITOR_NAMES = [
  "Tata CLiQ Luxury",
  "Myntra",
  "Darveys",
  "Hugo Boss",
  "Coach",
  "Louis Vuitton",
  "Gucci",
  "Burberry",
  "Michael Kors",
  "Versace",
];

interface CompetitorAd {
  competitor: string;
  platform: string;
  adType: string;
  headline: string;
  body: string;
  cta: string;
  estimatedSpend: string;
  impressions: string;
  status: string;
  startDate: string;
  platforms: string[];
  targeting: string;
  snapshotUrl: string;
  insight: string;
}

/**
 * Transform Apify Meta Ad Library results into our CompetitorAd format.
 */
function transformMetaAds(apifyItems: any[]): CompetitorAd[] {
  return apifyItems.map((item) => {
    const pageName = item.pageName || item.page_name || "Unknown";
    const matchedCompetitor =
      COMPETITOR_NAMES.find((c) =>
        pageName.toLowerCase().includes(c.toLowerCase())
      ) || pageName;

    // Determine ad type from media
    let adType = "Static Image";
    if (item.snapshot?.videos?.length) adType = "Video";
    else if (item.snapshot?.cards?.length > 1) adType = "Carousel";

    const bodyText =
      item.snapshot?.body?.text ||
      item.ad_creative_bodies?.[0] ||
      item.body ||
      "";
    const headlineText =
      item.snapshot?.title ||
      item.ad_creative_link_titles?.[0] ||
      item.title ||
      bodyText.slice(0, 80);
    const ctaText =
      item.snapshot?.cta_text ||
      item.ad_creative_link_captions?.[0] ||
      "Shop Now";
    const linkUrl =
      item.snapshot?.link_url || item.ad_snapshot_url || item.collationId
        ? `https://www.facebook.com/ads/library/?id=${item.collationId || item.id || ""}`
        : "";

    // Placements
    const platforms: string[] = [];
    if (item.publisherPlatform || item.publisher_platforms) {
      const pubs = item.publisherPlatform || item.publisher_platforms || [];
      const pubList = Array.isArray(pubs) ? pubs : [pubs];
      pubList.forEach((p: string) => {
        const lower = (p || "").toLowerCase();
        if (lower.includes("instagram")) platforms.push("Instagram Feed");
        else if (lower.includes("facebook")) platforms.push("Facebook Feed");
        else if (lower.includes("messenger")) platforms.push("Messenger");
        else if (lower.includes("audience")) platforms.push("Audience Network");
        else platforms.push(p);
      });
    }
    if (platforms.length === 0) platforms.push("Instagram Feed", "Facebook Feed");

    // Start date
    const startDate =
      item.startDate ||
      item.ad_delivery_start_time ||
      new Date().toISOString().slice(0, 10);

    return {
      competitor: matchedCompetitor,
      platform: "Meta",
      adType,
      headline: headlineText.slice(0, 120),
      body: bodyText.slice(0, 300),
      cta: ctaText,
      estimatedSpend: "N/A (Meta Ad Library)",
      impressions: item.impressions
        ? `${item.impressions.lower_bound || ""}–${item.impressions.upper_bound || ""}`
        : "N/A",
      status: item.isActive !== false ? "active" : "inactive",
      startDate: typeof startDate === "string" ? startDate.slice(0, 10) : startDate,
      platforms,
      targeting:
        item.demographicDistribution
          ? `Demographics available — ${JSON.stringify(item.demographicDistribution).slice(0, 100)}`
          : "India, luxury fashion audience (targeting details restricted by Meta)",
      snapshotUrl: linkUrl,
      insight: generateInsight(matchedCompetitor, headlineText, bodyText, adType),
    };
  });
}

function generateInsight(
  competitor: string,
  headline: string,
  body: string,
  adType: string
): string {
  const text = `${headline} ${body}`.toLowerCase();
  if (text.includes("off") || text.includes("discount") || text.includes("sale")) {
    return `${competitor} is running discount-heavy messaging. Counter with aspirational positioning — don't match discounts on Ajio Luxe.`;
  }
  if (text.includes("new") || text.includes("collection") || text.includes("launch")) {
    return `${competitor} promoting new collection. Ensure Ajio Luxe has the same or newer inventory featured in ads.`;
  }
  if (text.includes("free") || text.includes("delivery") || text.includes("shipping")) {
    return `${competitor} emphasizing free delivery/shipping. Highlight Ajio Luxe's premium packaging and delivery experience.`;
  }
  if (adType === "Video" || adType === "Carousel") {
    return `${competitor} using ${adType.toLowerCase()} format for engagement. Test similar creative formats on Ajio Luxe campaigns.`;
  }
  return `${competitor} is active on Meta. Analyze their creative approach and differentiate Ajio Luxe with aspirational luxury messaging.`;
}

/**
 * Transform competitor pricing signals into CompetitorAd format
 * so we can display SERP/pricing intel alongside Meta ads.
 */
function transformPricingSignals(signals: any[]): CompetitorAd[] {
  return signals.map((s) => {
    const data = s.data || {};
    const competitor = data.competitor || "Unknown";
    const product = data.product || s.triggersWhat || "";
    const theirPrice = data.theirPrice || 0;
    const ourPrice = data.ourPrice || 0;
    const discount = data.discount || 0;

    return {
      competitor,
      platform: "Google",
      adType: discount > 0 ? "Shopping" : "Search",
      headline: s.title || `${competitor} — ${product}`,
      body: s.description || "",
      cta: "Visit Site",
      estimatedSpend: "N/A (SERP intel)",
      impressions: "N/A (Search)",
      status: "active",
      startDate: new Date().toISOString().slice(0, 10),
      platforms: ["Google Search", "Google Shopping"],
      targeting: `Keywords: ${(s.suggestedBrands || []).join(", ")} India, ${product}`,
      snapshotUrl: "",
      insight: s.suggestedAction || s.description || "",
    };
  });
}

async function fetchCompetitorData() {
  let ads: CompetitorAd[] = [];
  let metaStatus = "demo_mode";
  let googleStatus = "demo_mode";

  try {
    const pricingSignals = await getCompetitorPricingSignals();
    if (pricingSignals.length > 0) {
      ads.push(...transformPricingSignals(pricingSignals));
      googleStatus = process.env.DATAFORSEO_LOGIN ? "connected" : "fallback_data";
    }
  } catch (err) {
    console.error("[competitors] Pricing signals error:", err);
  }

  // Meta Ad Library scraping disabled — Apify actor has input format issues.
  // To enable: connect Meta Marketing API with ads_read permission for direct access.
  // metaStatus stays "demo_mode" until Meta API is connected.

  return { ads, metaStatus, googleStatus };
}

registerForPrewarm("competitors", fetchCompetitorData);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const competitor = searchParams.get("competitor") || "all";
  const platform = searchParams.get("platform") || "all";
  const forceRefresh = searchParams.get("refresh") === "true";

  const { data } = await cachedFetch("competitors", fetchCompetitorData, forceRefresh);
  let ads = [...data.ads];

  // Filter by query params
  if (competitor !== "all") {
    ads = ads.filter((a) =>
      a.competitor.toLowerCase().includes(competitor.toLowerCase())
    );
  }
  if (platform !== "all") {
    ads = ads.filter(
      (a) => a.platform.toLowerCase() === platform.toLowerCase()
    );
  }

  // Summary stats
  const competitors = [...new Set(ads.map((a) => a.competitor))];
  const totalAds = ads.length;
  const metaAds = ads.filter((a) => a.platform === "Meta").length;
  const googleAds = ads.filter((a) => a.platform === "Google").length;

  const apiStatus = {
    metaAdLibrary: data.metaStatus,
    googleTransparency: data.googleStatus,
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
      meta: MONITORED_COMPETITORS.map((c) => ({
        name: c.name,
        category: c.category,
      })),
      google: GOOGLE_MONITORED_COMPETITORS.map((c) => ({
        name: c.name,
        domain: c.domain,
        category: c.category,
      })),
    },
    fetchedAt: new Date().toISOString(),
  });
}
