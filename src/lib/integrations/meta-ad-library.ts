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

// All luxury F&L competitors operating in India
export const MONITORED_COMPETITORS: CompetitorProfile[] = [
  // Indian luxury e-commerce platforms
  { name: "Tata CLiQ Luxury", pageId: "TataCliqLuxury", domain: "tatacliq.com", category: "direct_competitor", description: "India's leading luxury e-commerce platform" },
  { name: "Myntra", pageId: "myntra", domain: "myntra.com", category: "direct_competitor", description: "Largest fashion e-commerce — Myntra Luxe vertical" },
  { name: "Ajio Luxe", pageId: "ajio", domain: "ajio.com", category: "direct_competitor", description: "Reliance's luxury fashion platform" },
  { name: "Nykaa Fashion", pageId: "nykaafashion", domain: "nykaafashion.com", category: "direct_competitor", description: "Beauty + luxury fashion expansion" },
  { name: "Pernia's Pop-Up Shop", pageId: "perniaspopupshop", domain: "perniaspopupshop.com", category: "direct_competitor", description: "Indian designer + international luxury" },
  { name: "Aza Fashions", pageId: "azafashions", domain: "azafashions.com", category: "direct_competitor", description: "Indian luxury multi-designer platform" },
  { name: "Darveys", pageId: "darveys", domain: "darveys.com", category: "direct_competitor", description: "International luxury brands in India" },

  // International luxury platforms (India delivery)
  { name: "Farfetch", pageId: "farfetch", domain: "farfetch.com", category: "adjacent", description: "Global luxury marketplace — ships to India" },
  { name: "Net-a-Porter", pageId: "netaporter", domain: "net-a-porter.com", category: "adjacent", description: "Luxury fashion retailer — ships to India" },
  { name: "SSENSE", pageId: "ssense", domain: "ssense.com", category: "adjacent", description: "Contemporary luxury — ships to India" },
  { name: "Mytheresa", pageId: "mytheresa", domain: "mytheresa.com", category: "adjacent", description: "German luxury e-commerce — ships to India" },

  // Luxury brand D2C in India
  { name: "Louis Vuitton India", pageId: "LouisVuitton", domain: "louisvuitton.com", category: "brand_direct", description: "Louis Vuitton India stores + digital" },
  { name: "Gucci India", pageId: "GUCCI", domain: "gucci.com", category: "brand_direct", description: "Gucci India stores + digital" },
  { name: "Dior India", pageId: "Dior", domain: "dior.com", category: "brand_direct", description: "Dior India boutiques + digital" },
  { name: "Burberry India", pageId: "Burberry", domain: "burberry.com", category: "brand_direct", description: "Burberry India stores + digital" },
  { name: "Prada India", pageId: "Prada", domain: "prada.com", category: "brand_direct", description: "Prada India boutiques + digital" },
  { name: "Hugo Boss India", pageId: "HUGOBOSSIndia", domain: "hugoboss.com", category: "brand_direct", description: "Hugo Boss India D2C + retail" },
  { name: "Coach India", pageId: "CoachIndia", domain: "coach.com", category: "brand_direct", description: "Coach India D2C" },
  { name: "Michael Kors India", pageId: "MichaelKors", domain: "michaelkors.com", category: "brand_direct", description: "Michael Kors India D2C" },
  { name: "Ralph Lauren India", pageId: "RalphLauren", domain: "ralphlauren.com", category: "brand_direct", description: "Ralph Lauren India stores + digital" },
  { name: "Versace", pageId: "Versace", domain: "versace.com", category: "brand_direct", description: "Versace India presence" },
  { name: "Jimmy Choo", pageId: "JimmyChoo", domain: "jimmychoo.com", category: "brand_direct", description: "Jimmy Choo India boutiques" },
  { name: "Diesel India", pageId: "DieselIndia", domain: "diesel.com", category: "brand_direct", description: "Diesel India D2C" },
  { name: "Emporio Armani", pageId: "EmporioArmani", domain: "armani.com", category: "brand_direct", description: "Armani India presence" },
  { name: "Balenciaga", pageId: "Balenciaga", domain: "balenciaga.com", category: "brand_direct", description: "Balenciaga India" },
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
