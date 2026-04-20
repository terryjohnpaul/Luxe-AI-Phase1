import { NextResponse } from "next/server";

interface PushDraftRequest {
  platform: "google" | "meta" | "both";
  campaignName: string;
  headlines: string[];
  bodyTexts: string[];
  cta: string;
  budget: string;
  duration: string;
  bidStrategy: string;
  location: string;
  timing: string;
  brands: string[];
  signalTitle: string;
}

/**
 * POST /api/ads/push-draft
 * Creates a draft/paused campaign in Google Ads and/or Meta Ads.
 */
export async function POST(request: Request) {
  const body: PushDraftRequest = await request.json();
  const results: { google?: any; meta?: any; errors: string[] } = { errors: [] };

  // Parse budget string like "INR 10,000-30,000/day" to get a number
  const budgetNumbers = body.budget.match(/[\d,]+/g) || [];
  const allNumbers = budgetNumbers.map(n => parseInt(n.replace(/,/g, ''))).filter(n => n >= 100);
  const dailyBudget = allNumbers.length > 0 ? Math.min(...allNumbers) : 1000;

  // ========== GOOGLE ADS DRAFT ==========
  if (body.platform === "google" || body.platform === "both") {
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, "");
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");

    if (!refreshToken || !clientId || !clientSecret || !devToken || !customerId) {
      results.errors.push("Google Ads not connected. Visit /api/auth/google-ads to connect.");
    } else {
      try {
        // Get fresh access token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });
        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
          results.errors.push("Google Ads token refresh failed. Reconnect at /api/auth/google-ads");
        } else {
          // Create a paused campaign via Google Ads REST API
          const headers: Record<string, string> = {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "developer-token": devToken,
            "Content-Type": "application/json",
          };
          if (loginCustomerId) {
            headers["login-customer-id"] = loginCustomerId;
          }

          // Step 1: Create campaign budget
          const budgetRes = await fetch(
            `https://googleads.googleapis.com/v18/customers/${customerId}/campaignBudgets:mutate`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({
                operations: [{
                  create: {
                    name: `${body.campaignName} Budget - ${Date.now()}`,
                    amountMicros: (dailyBudget * 1_000_000).toString(),
                    deliveryMethod: "STANDARD",
                  },
                }],
              }),
            }
          );
          const budgetText = await budgetRes.text();
          let budgetData: any;
          try { budgetData = JSON.parse(budgetText); } catch { results.errors.push("Google Ads API error (status " + budgetRes.status + "): Your developer token has Test Account access only. Apply for Basic Access in API Center, or use Meta Ads instead."); }

          if (!budgetData) {
            // Already pushed error above
          } else if (budgetData.error) {
            results.errors.push(`Google Ads budget error: ${budgetData.error.message}`);
          } else {
            const budgetResourceName = budgetData.results?.[0]?.resourceName;

            // Step 2: Create paused campaign
            const campaignRes = await fetch(
              `https://googleads.googleapis.com/v18/customers/${customerId}/campaigns:mutate`,
              {
                method: "POST",
                headers,
                body: JSON.stringify({
                  operations: [{
                    create: {
                      name: body.campaignName,
                      status: "PAUSED",
                      advertisingChannelType: "SEARCH",
                      campaignBudget: budgetResourceName,
                      manualCpc: {},
                    },
                  }],
                }),
              }
            );
            const campaignData = await campaignRes.json();

            if (campaignData.error) {
              results.errors.push(`Google Ads campaign error: ${campaignData.error.message}`);
            } else {
              results.google = {
                success: true,
                campaignName: body.campaignName,
                status: "PAUSED (Draft)",
                resourceName: campaignData.results?.[0]?.resourceName,
                dailyBudget: `INR ${dailyBudget.toLocaleString()}`,
              };
            }
          }
        }
      } catch (err: any) {
        results.errors.push(`Google Ads error: ${err.message}`);
      }
    }
  }

  // ========== META ADS DRAFT ==========
  if (body.platform === "meta" || body.platform === "both") {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    const adAccountId = process.env.META_ADS_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
      results.errors.push("Meta Ads not connected. Visit /api/auth/meta-ads to connect.");
    } else {
      try {
        // Step 1: Create a paused campaign
        const campaignForm = new URLSearchParams();
        campaignForm.append("access_token", accessToken);
        campaignForm.append("name", body.campaignName);
        campaignForm.append("objective", "OUTCOME_SALES");
        campaignForm.append("status", "PAUSED");
        campaignForm.append("special_ad_categories", "[]");
        campaignForm.append("is_adset_budget_sharing_enabled", "false");

        const campaignRes = await fetch(
          `https://graph.facebook.com/v25.0/act_${adAccountId}/campaigns`,
          { method: "POST", body: campaignForm }
        );
        const campaignData = await campaignRes.json();

        if (campaignData.error) {
          results.errors.push(`Meta campaign error: ${campaignData.error.error_user_msg || campaignData.error.message}`);
        } else {
          const campaignId = campaignData.id;

          // Step 2: Create Ad Set with full targeting and budget from signal
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const startTime = tomorrow.toISOString().split("T")[0] + "T00:00:00+0530";

          // Parse duration to set end date
          const durationMatch = (body.duration || "").match(/(\d+)/);
          const durationDays = durationMatch ? parseInt(durationMatch[1]) : 14;
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 1 + durationDays);
          const endTime = endDate.toISOString().split("T")[0] + "T23:59:59+0530";

          // Parse location from signal
          const locationName = (body.location || "").toLowerCase();
          const geoLocations: any = { countries: ["IN"] };
          if (locationName.includes("mumbai")) {
            geoLocations.cities = [{ key: "2442580", name: "Mumbai" }];
            delete geoLocations.countries;
          } else if (locationName.includes("delhi")) {
            geoLocations.cities = [{ key: "2430187", name: "Delhi" }];
            delete geoLocations.countries;
          } else if (locationName.includes("bangalore") || locationName.includes("bengaluru")) {
            geoLocations.cities = [{ key: "2418479", name: "Bangalore" }];
            delete geoLocations.countries;
          } else if (locationName.includes("hyderabad")) {
            geoLocations.cities = [{ key: "2434483", name: "Hyderabad" }];
            delete geoLocations.countries;
          } else if (locationName.includes("chennai")) {
            geoLocations.cities = [{ key: "2425621", name: "Chennai" }];
            delete geoLocations.countries;
          } else if (locationName.includes("kolkata")) {
            geoLocations.cities = [{ key: "2437282", name: "Kolkata" }];
            delete geoLocations.countries;
          } else if (locationName.includes("pune")) {
            geoLocations.cities = [{ key: "2447491", name: "Pune" }];
            delete geoLocations.countries;
          }

          // Build interest targeting from signal brands
          const interests: any[] = [
            { id: "6003139266461", name: "Luxury goods" },
            { id: "6003397425735", name: "Fashion" },
            { id: "6003020834693", name: "Online shopping" },
          ];

          // Parse bid strategy from signal
          const bidStrategyMap: Record<string, string> = {
            "Lowest Cost": "LOWEST_COST_WITHOUT_CAP",
            "Cost Cap": "COST_CAP",
            "Bid Cap": "LOWEST_COST_WITH_BID_CAP",
          };
          const bidStrategy = bidStrategyMap[body.bidStrategy] || "LOWEST_COST_WITHOUT_CAP";

          const adSetBudget = Math.max(dailyBudget * 100, 50000); // Minimum ₹500/day in paise

          const adSetForm = new URLSearchParams();
          adSetForm.append("access_token", accessToken);
          adSetForm.append("campaign_id", campaignId);
          adSetForm.append("name", body.campaignName + " — Ad Set");
          adSetForm.append("status", "PAUSED");
          adSetForm.append("billing_event", "IMPRESSIONS");
          adSetForm.append("optimization_goal", "LINK_CLICKS");
          adSetForm.append("daily_budget", adSetBudget.toString());
          adSetForm.append("bid_strategy", bidStrategy);
          adSetForm.append("start_time", startTime);
          adSetForm.append("end_time", endTime);
          adSetForm.append("targeting", JSON.stringify({
            geo_locations: geoLocations,
            age_min: 25,
            age_max: 55,
            flexible_spec: [{ interests }],
          }));

          const adSetRes = await fetch(
            `https://graph.facebook.com/v25.0/act_${adAccountId}/adsets`,
            { method: "POST", body: adSetForm }
          );
          const adSetData = await adSetRes.json();

          let adSetId = null;
          let adSetError = null;
          if (adSetData.error) {
            adSetError = adSetData.error.error_user_msg || adSetData.error.message;
          } else {
            adSetId = adSetData.id;
          }

          // Build targeting description for response
          const targetingDesc = [];
          if (geoLocations.countries) targetingDesc.push("Countries: " + geoLocations.countries.join(", "));
          if (geoLocations.cities) targetingDesc.push("Cities: " + geoLocations.cities.map((c: any) => c.name).join(", "));
          targetingDesc.push("Age: 25-55");
          targetingDesc.push("Interests: Luxury goods, Fashion, Online shopping");

          results.meta = {
            success: true,
            campaignId,
            campaignName: body.campaignName,
            status: "PAUSED (Draft)",
            objective: "OUTCOME_SALES",
            adSet: adSetId ? {
              id: adSetId,
              dailyBudget: "INR " + (adSetBudget / 100).toLocaleString(),
              targeting: targetingDesc.join(" | "),
              schedule: startTime.split("T")[0] + " to " + endTime.split("T")[0],
              optimization: "Link Clicks",
              bidStrategy,
            } : { error: adSetError },
            note: "Ad creative not created — add images/video and Facebook Page in Ads Manager to complete.",
            headlines: body.headlines,
            bodyTexts: body.bodyTexts,
          };
        }
      } catch (err: any) {
        results.errors.push(`Meta Ads error: ${err.message}`);
      }
    }
  }

  const success = !!results.google?.success || !!results.meta?.success;

  return NextResponse.json({
    success,
    results,
    message: success
      ? `Draft campaign created successfully!`
      : `Failed to create draft. ${results.errors.join(" ")}`,
  }, { status: success ? 200 : 400 });
}

/**
 * GET /api/ads/push-draft
 * Check connection status of ad platforms.
 */
export async function GET() {
  return NextResponse.json({
    google: {
      connected: !!process.env.GOOGLE_ADS_REFRESH_TOKEN,
      customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || null,
      hasDeveloperToken: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    },
    meta: {
      connected: !!process.env.META_ADS_ACCESS_TOKEN,
      adAccountId: process.env.META_ADS_ACCOUNT_ID || null,
    },
  });
}
