/**
 * Apify Client — runs pre-built scrapers (Actors) and retrieves results.
 * Used for: Instagram scraping, Google Trends, Facebook Ads Library
 */

const APIFY_BASE = "https://api.apify.com/v2";

function getToken(): string {
  return process.env.APIFY_API_TOKEN || "";
}

interface ApifyRunResult {
  success: boolean;
  data: any[];
  error?: string;
}

/**
 * Run an Apify Actor and wait for results.
 * Uses synchronous run endpoint (waits up to 120s for small tasks).
 */
export async function runActor(actorId: string, input: Record<string, any>, timeoutSecs = 120): Promise<ApifyRunResult> {
  const token = getToken();
  if (!token) return { success: false, data: [], error: "No APIFY_API_TOKEN" };

  try {
    // Start the actor run and wait for it
    const resp = await fetch(
      `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSecs}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(timeoutSecs * 1000 + 5000),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return { success: false, data: [], error: `Apify ${resp.status}: ${errText.slice(0, 200)}` };
    }

    const data = await resp.json();
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message || "Apify request failed" };
  }
}

/**
 * Scrape Instagram profiles for recent posts.
 * Actor: apify/instagram-profile-scraper
 */
export async function scrapeInstagramProfiles(handles: string[], maxPosts = 5): Promise<ApifyRunResult> {
  return runActor("apify~instagram-profile-scraper", {
    usernames: handles,
    resultsLimit: maxPosts,
  });
}

/**
 * Scrape Google Trends for keywords.
 * Actor: emastra~google-trends-scraper
 */
export async function scrapeGoogleTrends(keywords: string[], geo = "IN"): Promise<ApifyRunResult> {
  return runActor("emastra~google-trends-scraper", {
    searchTerms: keywords,
    geo,
    timeRange: "now 7-d",
    isMultiple: true,
  });
}

/**
 * Scrape Meta Ad Library for competitor ads.
 * Actor: apify/facebook-ads-scraper — requires startUrls or search queries.
 */
export async function scrapeMetaAdLibrary(searchTerms: string[], country = "IN", limit = 20): Promise<ApifyRunResult> {
  // Build startUrls from search terms — the actor requires this field
  const startUrls = searchTerms.map(term => ({
    url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&q=${encodeURIComponent(term)}&media_type=all`,
  }));

  return runActor("apify~facebook-ads-scraper", {
    startUrls,
    maxItems: limit,
  }, 180);
}

/**
 * Scrape Instagram hashtag posts.
 * Actor: apify~instagram-hashtag-scraper
 */
export async function scrapeInstagramHashtags(hashtags: string[], maxPosts = 20): Promise<ApifyRunResult> {
  return runActor("apify~instagram-hashtag-scraper", {
    hashtags,
    resultsLimit: maxPosts,
  });
}
