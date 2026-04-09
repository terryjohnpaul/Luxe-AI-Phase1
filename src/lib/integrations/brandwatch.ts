/**
 * Brandwatch API Integration (Social Listening)
 *
 * Handles: Celebrity mention tracking, brand buzz, sentiment analysis
 * Auth: OAuth 2.0 Bearer Token
 * Rate limits: 30 requests/minute
 * Cost: $800-5,000/month (enterprise)
 */

interface BrandwatchMention {
  url: string;
  title: string;
  author: string;
  date: string;
  sentiment: "positive" | "negative" | "neutral";
  reach: number;
  domain: string;
  snippet: string;
}

interface BrandwatchVolume {
  date: string;
  volume: number;
}

export class BrandwatchClient {
  private baseUrl = "https://api.brandwatch.com";
  private token: string | null = null;
  private username: string;
  private password: string;

  constructor(config: { username: string; password: string }) {
    this.username = config.username;
    this.password = config.password;
  }

  private async authenticate(): Promise<string> {
    if (this.token) return this.token;

    const resp = await fetch(`${this.baseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "api-password",
        client_id: "brandwatch-api-client",
        username: this.username,
        password: this.password,
      }),
    });

    if (!resp.ok) throw new Error("Brandwatch authentication failed");
    const data = await resp.json();
    this.token = data.access_token;
    return this.token!;
  }

  private async request(endpoint: string, params?: Record<string, string>) {
    const token = await this.authenticate();
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set("access_token", token);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const resp = await fetch(url.toString());
    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(`Brandwatch API error: ${JSON.stringify(error)}`);
    }
    return resp.json();
  }

  // Get mentions for a query (brand or celebrity)
  async getMentions(
    projectId: string,
    queryId: string,
    startDate: string,
    endDate: string,
    options?: { sentiment?: string; pageSize?: number; page?: number }
  ): Promise<{ results: BrandwatchMention[]; resultsTotal: number }> {
    return this.request(`/projects/${projectId}/data/mentions`, {
      queryId,
      startDate,
      endDate,
      pageSize: String(options?.pageSize || 100),
      page: String(options?.page || 0),
      ...(options?.sentiment ? { sentiment: options.sentiment } : {}),
      orderBy: "date",
      orderDirection: "desc",
    });
  }

  // Get mention volume over time (for spike detection)
  async getVolume(
    projectId: string,
    queryId: string,
    startDate: string,
    endDate: string
  ): Promise<BrandwatchVolume[]> {
    const data = await this.request(`/projects/${projectId}/data/volume/days/queries`, {
      queryId,
      startDate,
      endDate,
    });
    return data.results || [];
  }

  // Get trending topics
  async getTrendingTopics(
    projectId: string,
    queryId: string,
    startDate: string,
    endDate: string
  ) {
    return this.request(`/projects/${projectId}/data/topics`, {
      queryId,
      startDate,
      endDate,
    });
  }

  // Detect mention spike (2x above baseline)
  async detectSpike(
    projectId: string,
    queryId: string
  ): Promise<{ isSpiking: boolean; ratio: number; latestVolume: number; baselineVolume: number }> {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const volumes = await this.getVolume(projectId, queryId, startDate, endDate);

    if (volumes.length < 2) {
      return { isSpiking: false, ratio: 0, latestVolume: 0, baselineVolume: 0 };
    }

    const latest = volumes[volumes.length - 1]?.volume || 0;
    const baseline = volumes.slice(0, -1).reduce((sum, v) => sum + v.volume, 0) / (volumes.length - 1);

    const ratio = baseline > 0 ? latest / baseline : 0;

    return {
      isSpiking: ratio > 2.0,
      ratio: Math.round(ratio * 100) / 100,
      latestVolume: latest,
      baselineVolume: Math.round(baseline),
    };
  }
}

export type { BrandwatchMention, BrandwatchVolume };
