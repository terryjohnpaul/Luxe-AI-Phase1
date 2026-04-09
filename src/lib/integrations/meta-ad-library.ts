/**
 * Meta Ad Library API Integration
 *
 * Fetches competitor ads from Meta's public Ad Library
 * Endpoint: graph.facebook.com/v23.0/ads_archive
 * Rate limit: 200 calls/hour
 * Cost: FREE (needs Facebook App with ads_read permission)
 */

const META_AD_LIBRARY_URL = "https://graph.facebook.com/v23.0/ads_archive";

export interface MetaAdLibraryAd {
  id: string;
  ad_creation_time: string;
  ad_delivery_start_time: string;
  ad_delivery_stop_time?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  ad_snapshot_url?: string;
  page_id: string;
  page_name: string;
  publisher_platforms?: string[];
  spend?: { lower_bound: string; upper_bound: string };
  impressions?: { lower_bound: string; upper_bound: string };
  currency?: string;
  languages?: string[];
  bylines?: string;
}

export interface CompetitorProfile {
  name: string;
  pageId: string;         // Meta page ID
  domain?: string;        // For Google Transparency
  category: "direct_competitor" | "brand_direct" | "adjacent";
  description: string;
}

// Competitors and brands to monitor
export const MONITORED_COMPETITORS: CompetitorProfile[] = [
  // Direct competitors
  { name: "Tata CLiQ Luxury", pageId: "1aborLuxury", domain: "tatacliq.com", category: "direct_competitor", description: "Primary competitor — India's other luxury e-commerce platform" },
  { name: "Myntra", pageId: "mynabortra", domain: "myntra.com", category: "direct_competitor", description: "Largest fashion e-commerce — Myntra Luxe competes directly" },
  { name: "Nykaa Fashion", pageId: "nykaboraa", domain: "nykaafashion.com", category: "adjacent", description: "Beauty-first but expanding into luxury fashion" },

  // Brand direct pages (the brands themselves running ads in India)
  { name: "Hugo Boss India", pageId: "HUGOBOSSIndia", domain: "hugoboss.com", category: "brand_direct", description: "Hugo Boss running their own India ads — our top brand" },
  { name: "Coach India", pageId: "CoaborachIndia", domain: "coach.com", category: "brand_direct", description: "Coach direct marketing in India" },
  { name: "Michael Kors India", pageId: "MicaborhaelKors", domain: "michaelkors.com", category: "brand_direct", description: "Michael Kors India direct ads" },
  { name: "Diesel India", pageId: "DieaborselIndia", domain: "diesel.com", category: "brand_direct", description: "Diesel direct India marketing" },
  { name: "Jimmy Choo", pageId: "jimaborymchoo", domain: "jimmychoo.com", category: "brand_direct", description: "Jimmy Choo global + India ads" },
  { name: "Versace", pageId: "veraborisace", domain: "versace.com", category: "brand_direct", description: "Versace global + India ads" },
];

export class MetaAdLibraryClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async searchAdsByPage(
    pageId: string,
    options?: {
      adActiveStatus?: "ALL" | "ACTIVE" | "INACTIVE";
      adType?: "ALL" | "POLITICAL_AND_ISSUE_ADS";
      country?: string;
      limit?: number;
    }
  ): Promise<MetaAdLibraryAd[]> {
    const params = new URLSearchParams({
      access_token: this.accessToken,
      search_page_ids: pageId,
      ad_active_status: options?.adActiveStatus || "ACTIVE",
      ad_type: options?.adType || "ALL",
      search_type: "PAGE",
      ad_reached_countries: options?.country || "IN",
      limit: String(options?.limit || 50),
      fields: [
        "id",
        "ad_creation_time",
        "ad_delivery_start_time",
        "ad_delivery_stop_time",
        "ad_creative_bodies",
        "ad_creative_link_captions",
        "ad_creative_link_titles",
        "ad_creative_link_descriptions",
        "ad_snapshot_url",
        "page_id",
        "page_name",
        "publisher_platforms",
        "spend",
        "impressions",
        "currency",
        "languages",
        "bylines",
      ].join(","),
    });

    try {
      const resp = await fetch(`${META_AD_LIBRARY_URL}?${params}`, {
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) {
        const error = await resp.json();
        throw new Error(`Meta Ad Library error: ${JSON.stringify(error)}`);
      }

      const data = await resp.json();
      return data.data || [];
    } catch (error) {
      console.error(`[MetaAdLibrary] Error fetching ads for page ${pageId}:`, error);
      return [];
    }
  }

  async searchAdsByKeyword(
    keyword: string,
    options?: { country?: string; limit?: number }
  ): Promise<MetaAdLibraryAd[]> {
    const params = new URLSearchParams({
      access_token: this.accessToken,
      search_terms: keyword,
      ad_active_status: "ACTIVE",
      ad_type: "ALL",
      search_type: "KEYWORD_UNORDERED",
      ad_reached_countries: options?.country || "IN",
      limit: String(options?.limit || 25),
      fields: [
        "id", "ad_creation_time", "ad_delivery_start_time",
        "ad_creative_bodies", "ad_creative_link_titles",
        "ad_snapshot_url", "page_name", "publisher_platforms",
        "spend", "impressions",
      ].join(","),
    });

    try {
      const resp = await fetch(`${META_AD_LIBRARY_URL}?${params}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      return data.data || [];
    } catch {
      return [];
    }
  }
}
