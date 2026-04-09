/**
 * Apify Meta Ad Library Scraper Integration
 * Uses Apify actor: curious_coder/facebook-ads-library-scraper
 * Scrapes the public Meta Ad Library — no Meta API permissions needed
 */

const APIFY_RUN_URL = "https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/runs";

export interface ApifyAdResult {
  ad_archive_id: string;
  page_id: string;
  snapshot: {
    page_name: string;
    page_profile_uri: string;
    page_profile_picture_url?: string;
    caption?: string;
    cta_text?: string;
    cards?: Array<{
      body?: string;
      title?: string;
      cta_text?: string;
      cta_type?: string;
      caption?: string;
      link_url?: string;
      original_image_url?: string;
      resized_image_url?: string;
      video_hd_url?: string | null;
      video_sd_url?: string | null;
      video_preview_image_url?: string | null;
    }>;
    body?: { markup?: { __html: string } };
    images?: Array<{ original_image_url: string; resized_image_url: string }>;
    videos?: Array<{ video_hd_url: string; video_preview_image_url: string }>;
  };
  start_date?: number;
  end_date?: number;
  publisher_platforms?: string[];
  is_active?: boolean;
  impressions?: { lower_bound?: number; upper_bound?: number };
  spend?: { lower_bound?: number; upper_bound?: number };
  currency?: string;
}

export interface CompetitorConfig {
  name: string;
  searchTerm: string;
  category: "direct_competitor" | "brand_direct" | "adjacent";
}

export const APIFY_COMPETITORS: CompetitorConfig[] = [
  { name: "Tata CLiQ Luxury", searchTerm: "Tata CLiQ Luxury", category: "direct_competitor" },
  { name: "Myntra", searchTerm: "Myntra Luxe", category: "direct_competitor" },
  { name: "Hugo Boss India", searchTerm: "Hugo Boss India", category: "brand_direct" },
  { name: "Coach India", searchTerm: "Coach India", category: "brand_direct" },
  { name: "Diesel India", searchTerm: "Diesel India", category: "brand_direct" },
];

export class ApifyAdLibraryClient {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  async scrapeCompetitorAds(
    searchTerm: string,
    options?: { country?: string; maxItems?: number }
  ): Promise<ApifyAdResult[]> {
    const country = options?.country || "IN";
    const maxItems = options?.maxItems || 10;

    const adLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&q=${encodeURIComponent(searchTerm)}`;

    try {
      // Start the scraper run and wait for it to finish
      const runResp = await fetch(
        `${APIFY_RUN_URL}?token=${this.apiToken}&waitForFinish=120`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            urls: [{ url: adLibraryUrl }],
            maxItems,
          }),
          signal: AbortSignal.timeout(130000),
        }
      );

      if (!runResp.ok) {
        const err = await runResp.text();
        console.error("[Apify] Run failed:", err);
        return [];
      }

      const runData = await runResp.json();
      const runId = runData.data?.id;
      const status = runData.data?.status;

      if (status !== "SUCCEEDED" || !runId) {
        console.error("[Apify] Run did not succeed:", status);
        return [];
      }

      // Fetch results from the dataset
      const dataResp = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${this.apiToken}`,
        { signal: AbortSignal.timeout(15000) }
      );

      if (!dataResp.ok) return [];
      return await dataResp.json();
    } catch (error) {
      console.error("[Apify] Error scraping ads for", searchTerm, ":", error);
      return [];
    }
  }
}

export function formatApifyAd(ad: ApifyAdResult, competitorName: string) {
  const snapshot = ad.snapshot;
  const card = snapshot.cards?.[0];

  const headline = card?.title || snapshot.caption || "Untitled Ad";
  const body = card?.body || "";
  const cta = card?.cta_text || snapshot.cta_text || "Shop Now";
  const hasVideo = !!(card?.video_hd_url || card?.video_sd_url);

  let adType = "Static Image";
  if (hasVideo) adType = "Video";
  else if (snapshot.cards && snapshot.cards.length > 1) adType = "Carousel";

  const platforms: string[] = [];
  if (ad.publisher_platforms) {
    for (const p of ad.publisher_platforms) {
      if (p === "facebook") platforms.push("Facebook Feed");
      else if (p === "instagram") platforms.push("Instagram Feed");
      else if (p === "messenger") platforms.push("Messenger");
      else if (p === "audience_network") platforms.push("Audience Network");
      else platforms.push(p);
    }
  }
  if (platforms.length === 0) platforms.push("Facebook Feed", "Instagram Feed");

  function formatINR(val: number) {
    if (val >= 100000) return `INR ${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `INR ${(val / 1000).toFixed(0)}K`;
    return `INR ${val}`;
  }

  function formatImpressions(val: number) {
    if (val >= 100000) return `${(val / 100000).toFixed(1)} lakh`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return String(val);
  }

  const spendLower = ad.spend?.lower_bound || 0;
  const spendUpper = ad.spend?.upper_bound || 0;
  const impLower = ad.impressions?.lower_bound || 0;
  const impUpper = ad.impressions?.upper_bound || 0;

  const startTimestamp = ad.start_date;
  const startDate = startTimestamp
    ? new Date(startTimestamp * 1000).toISOString().split("T")[0]
    : "";

  return {
    competitor: competitorName,
    platform: "Meta",
    adType,
    headline,
    body,
    cta,
    estimatedSpend: spendLower && spendUpper
      ? `${formatINR(spendLower)}-${formatINR(spendUpper)}`
      : "N/A",
    impressions: impLower && impUpper
      ? `${formatImpressions(impLower)}-${formatImpressions(impUpper)}`
      : "N/A",
    status: ad.is_active !== false ? "active" : "inactive",
    startDate,
    platforms,
    snapshotUrl: snapshot.page_profile_uri
      ? `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&view_all_page_id=${ad.page_id}`
      : "",
    insight: "",
    adId: ad.ad_archive_id,
    pageId: ad.page_id,
    pageName: snapshot.page_name,
    imageUrl: card?.resized_image_url || card?.original_image_url || "",
    linkUrl: card?.link_url || "",
    source: "apify_live" as const,
  };
}
