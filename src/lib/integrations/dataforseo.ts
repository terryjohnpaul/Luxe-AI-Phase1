/**
 * DataForSEO Client — search intelligence, Google Shopping, competitor ads data.
 * Used for: competitor pricing via Google Shopping, search trends, keyword data.
 */

const DFSE_BASE = "https://api.dataforseo.com/v3";

function getAuth(): string {
  const login = process.env.DATAFORSEO_LOGIN || "";
  const password = process.env.DATAFORSEO_PASSWORD || "";
  return Buffer.from(`${login}:${password}`).toString("base64");
}

interface DFSEResult {
  success: boolean;
  data: any[];
  cost?: number;
  error?: string;
}

async function dfseRequest(endpoint: string, body: any[]): Promise<DFSEResult> {
  const auth = getAuth();
  if (!auth || auth === btoa(":")) return { success: false, data: [], error: "No DataForSEO credentials" };

  try {
    const resp = await fetch(`${DFSE_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return { success: false, data: [], error: `DFSE ${resp.status}: ${errText.slice(0, 200)}` };
    }

    const json = await resp.json();
    const tasks = json.tasks || [];
    const results: any[] = [];
    let totalCost = 0;

    for (const task of tasks) {
      totalCost += task.cost || 0;
      if (task.result) results.push(...task.result);
    }

    return { success: true, data: results, cost: totalCost };
  } catch (err: any) {
    return { success: false, data: [], error: err.message || "DFSE request failed" };
  }
}

/**
 * Google Shopping — search for products and get prices across merchants.
 * Great for competitor price monitoring.
 * Cost: ~$0.002 per request
 */
export async function googleShoppingSearch(keyword: string, locationCode = 2356): Promise<DFSEResult> {
  return dfseRequest("/merchant/google/products/task_post", [
    {
      keyword,
      location_code: locationCode, // 2356 = India
      language_code: "en",
      depth: 20,
    },
  ]);
}

/**
 * Get Google Shopping results (after task completes).
 */
export async function googleShoppingLive(keyword: string, locationCode = 2356): Promise<DFSEResult> {
  return dfseRequest("/merchant/google/products/live", [
    {
      keyword,
      location_code: locationCode,
      language_code: "en",
      depth: 20,
    },
  ]);
}

/**
 * Google Search SERP — track brand rankings and competitor visibility.
 * Cost: ~$0.002 per request
 */
export async function googleSearchLive(keyword: string, locationCode = 2356): Promise<DFSEResult> {
  return dfseRequest("/serp/google/organic/live/regular", [
    {
      keyword,
      location_code: locationCode,
      language_code: "en",
      depth: 10,
    },
  ]);
}

/**
 * Google Trends — search volume and trending data.
 * Cost: ~$0.001 per request
 */
export async function googleTrendsExplore(keywords: string[], locationCode = 2356): Promise<DFSEResult> {
  return dfseRequest("/keywords_data/google_trends/explore/live", [
    {
      keywords,
      location_code: locationCode,
      date_from: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      date_to: new Date().toISOString().split("T")[0],
    },
  ]);
}

/**
 * Google Ads Search Volume — get monthly search volumes for keywords.
 * Cost: ~$0.05 per request (more expensive)
 */
export async function keywordSearchVolume(keywords: string[], locationCode = 2356): Promise<DFSEResult> {
  return dfseRequest("/keywords_data/google_ads/search_volume/live", [
    {
      keywords,
      location_code: locationCode,
      language_code: "en",
    },
  ]);
}
