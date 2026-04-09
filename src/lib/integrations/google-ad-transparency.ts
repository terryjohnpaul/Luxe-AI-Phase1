/**
 * Google Ads Transparency Center Integration
 *
 * Fetches competitor ads from Google's public transparency center
 * Via: SerpApi ($50/month) or free Apify scraper
 * Returns: Ad creatives, formats, run dates across Search/YouTube/Display
 */

export interface GoogleTransparencyAd {
  advertiser_id: string;
  advertiser_name: string;
  ad_format: "TEXT" | "IMAGE" | "VIDEO";
  creative_text?: string;
  creative_image_url?: string;
  creative_video_url?: string;
  first_shown: string;
  last_shown: string;
  regions: string[];
  platforms: string[];    // Search, YouTube, Display, etc.
  ad_url?: string;
  transparency_url: string;
}

export interface GoogleCompetitorProfile {
  name: string;
  domain: string;
  advertiserId?: string;
  category: "direct_competitor" | "brand_direct" | "adjacent";
}

export const GOOGLE_MONITORED_COMPETITORS: GoogleCompetitorProfile[] = [
  { name: "Tata CLiQ Luxury", domain: "tatacliq.com", category: "direct_competitor" },
  { name: "Myntra", domain: "myntra.com", category: "direct_competitor" },
  { name: "Ajio (parent)", domain: "ajio.com", category: "adjacent" },
  { name: "Nykaa Fashion", domain: "nykaafashion.com", category: "adjacent" },
  { name: "Hugo Boss", domain: "hugoboss.com", category: "brand_direct" },
  { name: "Coach", domain: "coach.com", category: "brand_direct" },
  { name: "Michael Kors", domain: "michaelkors.com", category: "brand_direct" },
  { name: "Diesel", domain: "diesel.com", category: "brand_direct" },
  { name: "Versace", domain: "versace.com", category: "brand_direct" },
  { name: "Jimmy Choo", domain: "jimmychoo.com", category: "brand_direct" },
];

export class GoogleAdTransparencyClient {
  private apiKey: string;
  private provider: "serpapi" | "searchapi";

  constructor(config: { apiKey: string; provider?: "serpapi" | "searchapi" }) {
    this.apiKey = config.apiKey;
    this.provider = config.provider || "serpapi";
  }

  async searchByDomain(domain: string, options?: { region?: string }): Promise<GoogleTransparencyAd[]> {
    if (this.provider === "serpapi") {
      return this.searchViaSerpApi(domain, options);
    }
    return this.searchViaSearchApi(domain, options);
  }

  private async searchViaSerpApi(domain: string, options?: { region?: string }): Promise<GoogleTransparencyAd[]> {
    try {
      const params = new URLSearchParams({
        engine: "google_ads_transparency_center",
        api_key: this.apiKey,
        domain: domain,
        region: options?.region || "IN",
      });

      const resp = await fetch(`https://serpapi.com/search?${params}`, {
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) return [];
      const data = await resp.json();

      return (data.ads || []).map((ad: any) => ({
        advertiser_id: ad.advertiser_id || "",
        advertiser_name: ad.advertiser_name || domain,
        ad_format: ad.format || "TEXT",
        creative_text: ad.text || ad.title,
        creative_image_url: ad.image,
        creative_video_url: ad.video,
        first_shown: ad.first_shown || "",
        last_shown: ad.last_shown || "",
        regions: ad.regions || ["IN"],
        platforms: ad.platforms || [],
        ad_url: ad.url,
        transparency_url: `https://adstransparency.google.com/advertiser/${ad.advertiser_id}`,
      }));
    } catch (error) {
      console.error(`[GoogleTransparency] SerpApi error for ${domain}:`, error);
      return [];
    }
  }

  private async searchViaSearchApi(domain: string, options?: { region?: string }): Promise<GoogleTransparencyAd[]> {
    try {
      const params = new URLSearchParams({
        engine: "google_ads_transparency_center",
        api_key: this.apiKey,
        domain: domain,
        region: options?.region || "anywhere",
      });

      const resp = await fetch(`https://www.searchapi.io/api/v1/search?${params}`, {
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) return [];
      const data = await resp.json();

      return (data.ads || []).map((ad: any) => ({
        advertiser_id: ad.advertiser_id || "",
        advertiser_name: ad.advertiser_name || domain,
        ad_format: ad.format || "TEXT",
        creative_text: ad.creative?.text || ad.text,
        creative_image_url: ad.creative?.image_url,
        first_shown: ad.first_shown || "",
        last_shown: ad.last_shown || "",
        regions: ad.regions || [],
        platforms: ad.platforms || [],
        transparency_url: ad.url || "",
      }));
    } catch (error) {
      console.error(`[GoogleTransparency] SearchApi error for ${domain}:`, error);
      return [];
    }
  }

  async searchByText(query: string): Promise<GoogleTransparencyAd[]> {
    try {
      const params = new URLSearchParams({
        engine: "google_ads_transparency_center",
        api_key: this.apiKey,
        text: query,
        region: "IN",
      });

      const baseUrl = this.provider === "serpapi"
        ? "https://serpapi.com/search"
        : "https://www.searchapi.io/api/v1/search";

      const resp = await fetch(`${baseUrl}?${params}`, {
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.ads || []).map((ad: any) => ({
        advertiser_id: ad.advertiser_id || "",
        advertiser_name: ad.advertiser_name || query,
        ad_format: ad.format || "TEXT",
        creative_text: ad.text || ad.title,
        creative_image_url: ad.image,
        first_shown: ad.first_shown || "",
        last_shown: ad.last_shown || "",
        regions: ad.regions || ["IN"],
        platforms: ad.platforms || [],
        transparency_url: ad.url || "",
      }));
    } catch {
      return [];
    }
  }
}
