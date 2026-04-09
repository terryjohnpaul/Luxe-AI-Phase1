/**
 * Meta Marketing API v25.0 Integration
 *
 * Handles: Campaign management, audience sync, insights, CAPI
 * Auth: System User Token (never expires)
 * Rate limits: 9,000 points per 300s (read=1, write=3)
 */

const META_API_VERSION = "v25.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface MetaInsight {
  campaign_name: string;
  campaign_id: string;
  impressions: string;
  clicks: string;
  spend: string;
  ctr: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
  purchase_roas?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
  date_start: string;
  date_stop: string;
}

interface MetaCampaignParams {
  name: string;
  objective: "OUTCOME_SALES" | "OUTCOME_TRAFFIC" | "OUTCOME_AWARENESS" | "OUTCOME_LEADS";
  status: "ACTIVE" | "PAUSED";
  dailyBudget: number; // In paise/cents
  bidStrategy?: string;
  specialAdCategories?: string[];
}

export class MetaAdsClient {
  private accessToken: string;
  private adAccountId: string;
  private pixelId: string;

  constructor(config: {
    accessToken: string;
    adAccountId: string;
    pixelId?: string;
  }) {
    this.accessToken = config.accessToken;
    this.adAccountId = config.adAccountId;
    this.pixelId = config.pixelId || "";
  }

  private async request(
    endpoint: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: Record<string, unknown>
  ) {
    const url = `${META_BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (method === "GET") {
      const params = new URLSearchParams({
        access_token: this.accessToken,
        ...(body as Record<string, string>),
      });
      const resp = await fetch(`${url}?${params}`);
      if (!resp.ok) {
        const error = await resp.json();
        throw new Error(`Meta API error: ${JSON.stringify(error)}`);
      }
      return resp.json();
    }

    const formData = new URLSearchParams();
    formData.append("access_token", this.accessToken);
    if (body) {
      for (const [key, value] of Object.entries(body)) {
        formData.append(
          key,
          typeof value === "object" ? JSON.stringify(value) : String(value)
        );
      }
    }

    const resp = await fetch(url, {
      method,
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(`Meta API error: ${JSON.stringify(error)}`);
    }
    return resp.json();
  }

  // ============================================================
  // CAMPAIGNS
  // ============================================================

  async getCampaigns(fields?: string[]) {
    const defaultFields = [
      "id",
      "name",
      "status",
      "objective",
      "daily_budget",
      "lifetime_budget",
      "bid_strategy",
      "created_time",
      "updated_time",
    ];
    return this.request(`/act_${this.adAccountId}/campaigns`, "GET", {
      fields: (fields || defaultFields).join(","),
      limit: "500",
    });
  }

  async createCampaign(params: MetaCampaignParams) {
    return this.request(`/act_${this.adAccountId}/campaigns`, "POST", {
      name: params.name,
      objective: params.objective,
      status: params.status,
      daily_budget: params.dailyBudget,
      bid_strategy: params.bidStrategy || "LOWEST_COST_WITHOUT_CAP",
      special_ad_categories: params.specialAdCategories || [],
    });
  }

  async updateCampaign(
    campaignId: string,
    updates: Record<string, unknown>
  ) {
    return this.request(`/${campaignId}`, "POST", updates);
  }

  async updateBudget(campaignId: string, dailyBudget: number) {
    return this.updateCampaign(campaignId, { daily_budget: dailyBudget });
  }

  async pauseCampaign(campaignId: string) {
    return this.updateCampaign(campaignId, { status: "PAUSED" });
  }

  async resumeCampaign(campaignId: string) {
    return this.updateCampaign(campaignId, { status: "ACTIVE" });
  }

  // ============================================================
  // INSIGHTS (Performance Metrics)
  // ============================================================

  async getAccountInsights(params: {
    datePreset?: string;
    timeRange?: { since: string; until: string };
    level?: "account" | "campaign" | "adset" | "ad";
    timeIncrement?: string;
    breakdowns?: string[];
    fields?: string[];
  }): Promise<{ data: MetaInsight[] }> {
    const defaultFields = [
      "campaign_name",
      "campaign_id",
      "impressions",
      "clicks",
      "ctr",
      "spend",
      "actions",
      "action_values",
      "purchase_roas",
      "cost_per_action_type",
      "frequency",
      "reach",
    ];

    const queryParams: Record<string, string> = {
      fields: (params.fields || defaultFields).join(","),
      level: params.level || "campaign",
    };

    if (params.datePreset) {
      queryParams.date_preset = params.datePreset;
    } else if (params.timeRange) {
      queryParams.time_range = JSON.stringify(params.timeRange);
    } else {
      queryParams.date_preset = "last_7d";
    }

    if (params.timeIncrement) {
      queryParams.time_increment = params.timeIncrement;
    }

    if (params.breakdowns) {
      queryParams.breakdowns = params.breakdowns.join(",");
    }

    return this.request(
      `/act_${this.adAccountId}/insights`,
      "GET",
      queryParams
    );
  }

  async getCampaignInsights(campaignId: string, datePreset = "last_7d") {
    return this.request(`/${campaignId}/insights`, "GET", {
      fields: [
        "impressions",
        "clicks",
        "ctr",
        "spend",
        "actions",
        "action_values",
        "purchase_roas",
        "cost_per_action_type",
        "frequency",
        "reach",
      ].join(","),
      date_preset: datePreset,
    });
  }

  // ============================================================
  // CUSTOM AUDIENCES
  // ============================================================

  async createCustomAudience(name: string, description?: string) {
    return this.request(
      `/act_${this.adAccountId}/customaudiences`,
      "POST",
      {
        name,
        subtype: "CUSTOM",
        description: description || "",
        customer_file_source: "USER_PROVIDED_ONLY",
      }
    );
  }

  async uploadAudienceUsers(
    audienceId: string,
    hashedData: string[][],
    schema: string[]
  ) {
    const sessionId = Date.now();
    const batchSize = 10000;

    for (let i = 0; i < hashedData.length; i += batchSize) {
      const batch = hashedData.slice(i, i + batchSize);
      const isLast = i + batchSize >= hashedData.length;

      await this.request(`/${audienceId}/users`, "POST", {
        session: {
          session_id: sessionId,
          batch_seq: Math.floor(i / batchSize) + 1,
          last_batch_flag: isLast,
          estimated_num_total: hashedData.length,
        },
        payload: { schema, data: batch },
      });
    }
  }

  // ============================================================
  // CONVERSIONS API (CAPI) — Server-Side Tracking
  // ============================================================

  async sendEvent(event: {
    eventName: string;
    eventTime?: number;
    eventId?: string;
    eventSourceUrl?: string;
    userData: Record<string, unknown>;
    customData?: Record<string, unknown>;
  }) {
    if (!this.pixelId) throw new Error("Pixel ID not configured");

    return this.request(`/${this.pixelId}/events`, "POST", {
      data: [
        {
          event_name: event.eventName,
          event_time: event.eventTime || Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          event_source_url: event.eventSourceUrl,
          action_source: "website",
          user_data: event.userData,
          custom_data: event.customData,
        },
      ],
    });
  }

  async sendPurchaseEvent(params: {
    eventId: string;
    email?: string;
    phone?: string;
    ip?: string;
    fbp?: string;
    fbc?: string;
    value: number;
    currency: string;
    productIds: string[];
    sourceUrl?: string;
  }) {
    return this.sendEvent({
      eventName: "Purchase",
      eventId: params.eventId,
      eventSourceUrl: params.sourceUrl,
      userData: {
        em: params.email ? [params.email] : undefined,
        ph: params.phone ? [params.phone] : undefined,
        client_ip_address: params.ip,
        fbp: params.fbp,
        fbc: params.fbc,
      },
      customData: {
        value: params.value,
        currency: params.currency,
        content_ids: params.productIds,
        content_type: "product",
        num_items: params.productIds.length,
      },
    });
  }

  // ============================================================
  // IMAGE & VIDEO UPLOAD
  // ============================================================

  async uploadImage(imageUrl: string) {
    return this.request(`/act_${this.adAccountId}/adimages`, "POST", {
      url: imageUrl,
    });
  }

  async getAdVideos() {
    return this.request(`/act_${this.adAccountId}/advideos`, "GET", {
      fields: "id,title,status,source",
    });
  }
}

// Helper: Extract ROAS from Meta insights response
export function extractMetaRoas(insight: MetaInsight): number | null {
  if (insight.purchase_roas && insight.purchase_roas.length > 0) {
    return parseFloat(insight.purchase_roas[0].value);
  }
  return null;
}

// Helper: Extract CPA from Meta insights response
export function extractMetaCpa(insight: MetaInsight): number | null {
  if (insight.cost_per_action_type) {
    const purchase = insight.cost_per_action_type.find(
      (a) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
    );
    if (purchase) return parseFloat(purchase.value);
  }
  return null;
}

// Helper: Extract purchase count from Meta insights
export function extractMetaPurchases(insight: MetaInsight): number {
  if (insight.actions) {
    const purchase = insight.actions.find(
      (a) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
    );
    if (purchase) return parseInt(purchase.value);
  }
  return 0;
}
