import { NextResponse } from "next/server";

/**
 * GET /api/campaigns
 * Fetches real campaigns from Meta Ads (and Google Ads when available).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const platformFilter = searchParams.get("platform");

  const campaigns: any[] = [];

  // ========== META ADS ==========
  const metaToken = process.env.META_ADS_ACCESS_TOKEN;
  const metaAccountId = process.env.META_ADS_ACCOUNT_ID;

  if (metaToken && metaAccountId) {
    try {
      const fields = [
        "id",
        "name",
        "status",
        "objective",
        "created_time",
        "updated_time",
        "daily_budget",
        "lifetime_budget",
        "start_time",
        "stop_time",
        "bid_strategy",
      ].join(",");

      const campaignRes = await fetch(
        `https://graph.facebook.com/v25.0/act_${metaAccountId}/campaigns?fields=${fields}&limit=100&access_token=${metaToken}`
      );
      const campaignData = await campaignRes.json();

      if (campaignData.data) {
        // Fetch insights for all campaigns
        const campaignIds = campaignData.data.map((c: any) => c.id);
        const insightsMap: Record<string, any> = {};

        // Fetch insights in parallel (batch of up to 50)
        await Promise.all(
          campaignData.data.map(async (campaign: any) => {
            try {
              const insightRes = await fetch(
                `https://graph.facebook.com/v25.0/${campaign.id}/insights?fields=spend,impressions,clicks,ctr,cpc,actions,action_values,conversions&date_preset=maximum&access_token=${metaToken}`
              );
              const insightData = await insightRes.json();
              if (insightData.data?.[0]) {
                insightsMap[campaign.id] = insightData.data[0];
              }
            } catch {}
          })
        );

        // Fetch ad sets for each campaign
        const adSetsMap: Record<string, any[]> = {};
        await Promise.all(
          campaignData.data.map(async (campaign: any) => {
            try {
              const adSetRes = await fetch(
                `https://graph.facebook.com/v25.0/${campaign.id}/adsets?fields=id,name,status,daily_budget,targeting,optimization_goal,billing_event,start_time&access_token=${metaToken}`
              );
              const adSetData = await adSetRes.json();
              if (adSetData.data) {
                adSetsMap[campaign.id] = adSetData.data;
              }
            } catch {}
          })
        );

        for (const c of campaignData.data) {
          const insights = insightsMap[c.id];
          const adSets = adSetsMap[c.id] || [];
          const adSet = adSets[0]; // Primary ad set

          // Extract targeting info
          let targetingInfo = "Not set";
          if (adSet?.targeting) {
            const t = adSet.targeting;
            const parts: string[] = [];
            if (t.geo_locations?.countries) parts.push("Countries: " + t.geo_locations.countries.join(", "));
            if (t.geo_locations?.cities) parts.push("Cities: " + t.geo_locations.cities.map((c: any) => c.name).join(", "));
            if (t.age_min || t.age_max) parts.push(`Age: ${t.age_min || 18}-${t.age_max || 65}`);
            if (t.flexible_spec?.[0]?.interests) {
              parts.push("Interests: " + t.flexible_spec[0].interests.map((i: any) => i.name).join(", "));
            }
            if (parts.length > 0) targetingInfo = parts.join(" | ");
          }

          // Extract conversions from actions
          let conversions = 0;
          let conversionValue = 0;
          if (insights?.actions) {
            const purchase = insights.actions.find((a: any) =>
              a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
            );
            if (purchase) conversions = parseInt(purchase.value);
          }
          if (insights?.action_values) {
            const purchaseValue = insights.action_values.find((a: any) =>
              a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
            );
            if (purchaseValue) conversionValue = parseFloat(purchaseValue.value);
          }

          const spend = parseFloat(insights?.spend || "0");

          campaigns.push({
            id: c.id,
            platform: "META",
            name: c.name,
            status: c.status,
            objective: c.objective,
            dailyBudget: c.daily_budget ? parseInt(c.daily_budget) / 100 : (adSet?.daily_budget ? parseInt(adSet.daily_budget) / 100 : 0),
            bidStrategy: c.bid_strategy || "LOWEST_COST",
            targeting: targetingInfo,
            adSets: adSets.length,
            createdAt: c.created_time,
            updatedAt: c.updated_time,
            startTime: c.start_time || adSet?.start_time,
            metrics: {
              spend,
              impressions: parseInt(insights?.impressions || "0"),
              clicks: parseInt(insights?.clicks || "0"),
              ctr: parseFloat(insights?.ctr || "0"),
              cpc: parseFloat(insights?.cpc || "0"),
              conversions,
              conversionValue,
              roas: spend > 0 ? conversionValue / spend : 0,
            },
          });
        }
      }
    } catch (err: any) {
      console.error("[campaigns] Meta Ads error:", err.message);
    }
  }

  // Apply filters
  let filtered = campaigns;
  if (statusFilter) {
    filtered = filtered.filter(c => c.status === statusFilter.toUpperCase());
  }
  if (platformFilter) {
    filtered = filtered.filter(c => c.platform === platformFilter.toUpperCase());
  }

  // Sort by created date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: filtered.length,
    active: filtered.filter(c => c.status === "ACTIVE").length,
    paused: filtered.filter(c => c.status === "PAUSED").length,
    totalSpend: filtered.reduce((sum, c) => sum + (c.metrics?.spend || 0), 0),
  };

  return NextResponse.json({ campaigns: filtered, stats });
}
