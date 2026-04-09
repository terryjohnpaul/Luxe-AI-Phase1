/**
 * Google Ads API v23.1 Integration
 *
 * Handles: PMax campaigns, GAQL reports, budget management, Customer Match
 * Auth: OAuth2 + Developer Token
 * Note: Uses Opteo's community library (no official Node.js SDK)
 */

import { GoogleAdsApi, enums, type MutateOperation } from "google-ads-api";

interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  customerId: string;
  refreshToken: string;
  loginCustomerId?: string;
}

interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  costMicros: number;
  cost: number; // INR (costMicros / 1,000,000)
  conversions: number;
  conversionsValue: number;
  roas: number; // conversions_value_per_cost
  cpa: number;
}

export class GoogleAdsClient {
  private client: GoogleAdsApi;
  private customer: ReturnType<GoogleAdsApi["Customer"]>;
  private customerId: string;

  constructor(config: GoogleAdsConfig) {
    this.customerId = config.customerId;

    this.client = new GoogleAdsApi({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      developer_token: config.developerToken,
    });

    this.customer = this.client.Customer({
      customer_id: config.customerId,
      refresh_token: config.refreshToken,
      login_customer_id: config.loginCustomerId,
    });
  }

  // ============================================================
  // CAMPAIGN PERFORMANCE (GAQL Queries)
  // ============================================================

  async getCampaignPerformance(
    dateRange = "LAST_7_DAYS"
  ): Promise<CampaignPerformance[]> {
    const results = await this.customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.conversions_value_per_cost,
        metrics.cost_per_conversion
      FROM campaign
      WHERE campaign.status != 'REMOVED'
        AND segments.date DURING ${dateRange}
    `);

    return results.map((row) => ({
      campaignId: row.campaign?.id?.toString() || "",
      campaignName: row.campaign?.name || "",
      status: row.campaign?.status?.toString() || "",
      impressions: Number(row.metrics?.impressions || 0),
      clicks: Number(row.metrics?.clicks || 0),
      ctr: Number(row.metrics?.ctr || 0),
      costMicros: Number(row.metrics?.cost_micros || 0),
      cost: Number(row.metrics?.cost_micros || 0) / 1_000_000,
      conversions: Number(row.metrics?.conversions || 0),
      conversionsValue: Number(row.metrics?.conversions_value || 0),
      roas: Number(row.metrics?.conversions_value_per_cost || 0),
      cpa: Number(row.metrics?.cost_per_conversion || 0) / 1_000_000,
    }));
  }

  async getPMaxPerformance(dateRange = "LAST_7_DAYS") {
    return this.customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.conversions_value_per_cost,
        metrics.cost_per_conversion
      FROM campaign
      WHERE campaign.advertising_channel_type = 'PERFORMANCE_MAX'
        AND campaign.status != 'REMOVED'
        AND segments.date DURING ${dateRange}
    `);
  }

  async getAssetGroupPerformance(dateRange = "LAST_7_DAYS") {
    return this.customer.query(`
      SELECT
        asset_group.id,
        asset_group.name,
        asset_group.status,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_micros
      FROM asset_group
      WHERE campaign.advertising_channel_type = 'PERFORMANCE_MAX'
        AND segments.date DURING ${dateRange}
    `);
  }

  async getDailyPerformance(campaignId: string, days = 30) {
    return this.customer.query(`
      SELECT
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.conversions_value_per_cost
      FROM campaign
      WHERE campaign.id = ${campaignId}
        AND segments.date DURING LAST_${days}_DAYS
      ORDER BY segments.date ASC
    `);
  }

  // ============================================================
  // BUDGET MANAGEMENT
  // ============================================================

  async getCampaignBudget(campaignId: string) {
    const result = await this.customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign_budget.amount_micros,
        campaign_budget.resource_name
      FROM campaign
      WHERE campaign.id = ${campaignId}
    `);
    return result[0];
  }

  async updateBudget(budgetResourceName: string, newAmountMicros: number) {
    return this.customer.mutateResources([
      {
        entity: "campaign_budget",
        operation: "update",
        resource: {
          resource_name: budgetResourceName,
          amount_micros: BigInt(newAmountMicros),
        },
      } as unknown as MutateOperation<"campaign_budget">,
    ]);
  }

  async pauseCampaign(campaignResourceName: string) {
    return this.customer.mutateResources([
      {
        entity: "campaign",
        operation: "update",
        resource: {
          resource_name: campaignResourceName,
          status: enums.CampaignStatus.PAUSED,
        },
      } as unknown as MutateOperation<"campaign">,
    ]);
  }

  async enableCampaign(campaignResourceName: string) {
    return this.customer.mutateResources([
      {
        entity: "campaign",
        operation: "update",
        resource: {
          resource_name: campaignResourceName,
          status: enums.CampaignStatus.ENABLED,
        },
      } as unknown as MutateOperation<"campaign">,
    ]);
  }

  // ============================================================
  // SEARCH TERMS & BRAND DEFENSE
  // ============================================================

  async getBrandSearchImpressionShare() {
    return this.customer.query(`
      SELECT
        campaign.name,
        metrics.search_impression_share,
        metrics.search_top_impression_share,
        metrics.search_budget_lost_impression_share,
        metrics.search_rank_lost_impression_share
      FROM campaign
      WHERE campaign.status = 'ENABLED'
        AND segments.date DURING LAST_7_DAYS
    `);
  }

  // ============================================================
  // CONVERSION TRACKING
  // ============================================================

  async getConversionActions() {
    return this.customer.query(`
      SELECT
        conversion_action.id,
        conversion_action.name,
        conversion_action.type,
        conversion_action.category,
        conversion_action.status
      FROM conversion_action
    `);
  }

  // ============================================================
  // CUSTOMER MATCH (Audience Upload)
  // Note: Migrating to Data Manager API by April 1, 2026
  // ============================================================

  async getUserLists() {
    return this.customer.query(`
      SELECT
        user_list.id,
        user_list.name,
        user_list.size_for_search,
        user_list.size_for_display,
        user_list.type
      FROM user_list
      WHERE user_list.type = 'CRM_BASED'
    `);
  }
}

// Helper: Convert micros to currency (INR)
export function microsToInr(micros: number | bigint): number {
  return Number(micros) / 1_000_000;
}

// Helper: Convert INR to micros
export function inrToMicros(inr: number): bigint {
  return BigInt(Math.round(inr * 1_000_000));
}
