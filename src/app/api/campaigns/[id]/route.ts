import { NextResponse } from "next/server";

/**
 * GET /api/campaigns/[id]
 * Fetches full campaign details including ad sets and their targeting.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json({ error: "Meta Ads not connected" }, { status: 400 });
  }

  try {
    // Fetch campaign details
    const campaignRes = await fetch(
      `https://graph.facebook.com/v25.0/${campaignId}?fields=id,name,status,objective,daily_budget,lifetime_budget,spend_cap,bid_strategy,start_time,stop_time,special_ad_categories,buying_type,budget_remaining&access_token=${accessToken}`
    );
    const campaign = await campaignRes.json();
    if (campaign.error) {
      return NextResponse.json({ error: campaign.error.message }, { status: 400 });
    }

    // Fetch ad sets
    const adSetsRes = await fetch(
      `https://graph.facebook.com/v25.0/${campaignId}/adsets?fields=id,name,status,daily_budget,lifetime_budget,bid_amount,bid_strategy,billing_event,optimization_goal,targeting,start_time,end_time,promoted_object,destination_type,pacing_type&access_token=${accessToken}`
    );
    const adSetsData = await adSetsRes.json();

    return NextResponse.json({
      campaign,
      adSets: adSetsData.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/campaigns/[id]
 * Updates campaign and/or ad set fields. Pushes directly to Facebook.
 *
 * Supports all Meta Marketing API editable fields:
 * Campaign: name, status, daily_budget, lifetime_budget, spend_cap, bid_strategy,
 *           start_time, stop_time, special_ad_categories
 * Ad Set:   name, status, daily_budget, lifetime_budget, bid_amount, bid_strategy,
 *           billing_event, optimization_goal, targeting, start_time, end_time
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  const body = await request.json();
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json({ error: "Meta Ads not connected" }, { status: 400 });
  }

  const results: { campaign?: any; adSets?: any[]; errors: string[] } = { errors: [] };

  try {
    // ===== UPDATE CAMPAIGN FIELDS =====
    if (body.campaign) {
      const formData = new URLSearchParams();
      formData.append("access_token", accessToken);

      const campaignFields = body.campaign;
      if (campaignFields.name) formData.append("name", campaignFields.name);
      if (campaignFields.status) formData.append("status", campaignFields.status);

      // Budget: only send one of daily or lifetime, never both
      const hasDailyBudget = campaignFields.daily_budget && campaignFields.daily_budget > 0;
      const hasLifetimeBudget = campaignFields.lifetime_budget && campaignFields.lifetime_budget > 0;
      if (hasDailyBudget) formData.append("daily_budget", (campaignFields.daily_budget * 100).toString());
      else if (hasLifetimeBudget) formData.append("lifetime_budget", (campaignFields.lifetime_budget * 100).toString());

      if (campaignFields.spend_cap && campaignFields.spend_cap > 0) formData.append("spend_cap", (campaignFields.spend_cap * 100).toString());

      // Only send bid_strategy if campaign has a budget
      if (campaignFields.bid_strategy && (hasDailyBudget || hasLifetimeBudget)) {
        formData.append("bid_strategy", campaignFields.bid_strategy);
      }

      if (campaignFields.start_time) formData.append("start_time", campaignFields.start_time);
      if (campaignFields.stop_time) formData.append("stop_time", campaignFields.stop_time);
      if (campaignFields.special_ad_categories !== undefined && campaignFields.special_ad_categories.length > 0) {
        formData.append("special_ad_categories", JSON.stringify(campaignFields.special_ad_categories));
      }

      const res = await fetch(`https://graph.facebook.com/v25.0/${campaignId}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        results.errors.push("Campaign: " + (data.error.error_user_msg || data.error.message));
      } else {
        results.campaign = { success: true };
      }
    }

    // Legacy support: direct fields (not nested under campaign)
    if (!body.campaign && (body.name || body.status || body.dailyBudget)) {
      const formData = new URLSearchParams();
      formData.append("access_token", accessToken);
      if (body.name !== undefined) formData.append("name", body.name);
      if (body.status !== undefined) formData.append("status", body.status);
      if (body.dailyBudget !== undefined) formData.append("daily_budget", (body.dailyBudget * 100).toString());

      const res = await fetch(`https://graph.facebook.com/v25.0/${campaignId}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        results.errors.push(data.error.error_user_msg || data.error.message);
      } else {
        results.campaign = { success: true };
      }

      // Also update ad set budget
      if (body.dailyBudget !== undefined) {
        try {
          const adSetsRes = await fetch(
            `https://graph.facebook.com/v25.0/${campaignId}/adsets?fields=id&access_token=${accessToken}`
          );
          const adSetsData = await adSetsRes.json();
          if (adSetsData.data) {
            for (const adSet of adSetsData.data) {
              const f = new URLSearchParams();
              f.append("access_token", accessToken);
              f.append("daily_budget", (body.dailyBudget * 100).toString());
              await fetch(`https://graph.facebook.com/v25.0/${adSet.id}`, { method: "POST", body: f });
            }
          }
        } catch {}
      }
    }

    // ===== UPDATE AD SET FIELDS =====
    if (body.adSets && Array.isArray(body.adSets)) {
      results.adSets = [];

      for (const adSetUpdate of body.adSets) {
        const adSetId = adSetUpdate.id;
        if (!adSetId) continue;

        const formData = new URLSearchParams();
        formData.append("access_token", accessToken);

        if (adSetUpdate.name !== undefined) formData.append("name", adSetUpdate.name);
        if (adSetUpdate.status !== undefined) formData.append("status", adSetUpdate.status);
        const hasAdSetDaily = adSetUpdate.daily_budget && adSetUpdate.daily_budget > 0;
        const hasAdSetLifetime = adSetUpdate.lifetime_budget && adSetUpdate.lifetime_budget > 0;
        if (hasAdSetDaily) formData.append("daily_budget", (adSetUpdate.daily_budget * 100).toString());
        else if (hasAdSetLifetime) formData.append("lifetime_budget", (adSetUpdate.lifetime_budget * 100).toString());
        if (adSetUpdate.bid_amount && adSetUpdate.bid_amount > 0) formData.append("bid_amount", adSetUpdate.bid_amount.toString());
        if (adSetUpdate.bid_strategy) formData.append("bid_strategy", adSetUpdate.bid_strategy);
        if (adSetUpdate.billing_event) formData.append("billing_event", adSetUpdate.billing_event);
        if (adSetUpdate.optimization_goal) formData.append("optimization_goal", adSetUpdate.optimization_goal);
        if (adSetUpdate.start_time) formData.append("start_time", adSetUpdate.start_time);
        if (adSetUpdate.end_time) formData.append("end_time", adSetUpdate.end_time);

        // Targeting is a complex JSON object
        if (adSetUpdate.targeting !== undefined) {
          formData.append("targeting", JSON.stringify(adSetUpdate.targeting));
        }

        const res = await fetch(`https://graph.facebook.com/v25.0/${adSetId}`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.error) {
          results.errors.push(`Ad Set ${adSetId}: ` + (data.error.error_user_msg || data.error.message));
        } else {
          results.adSets.push({ id: adSetId, success: true });
        }
      }
    }

    const success = results.errors.length === 0;
    return NextResponse.json({
      success,
      ...results,
      message: success ? "All changes saved to Facebook" : results.errors.join("; "),
    }, { status: success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Archives a Meta Ads campaign.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json({ error: "Meta Ads not connected" }, { status: 400 });
  }

  try {
    const formData = new URLSearchParams();
    formData.append("access_token", accessToken);
    formData.append("status", "ARCHIVED");

    const res = await fetch(`https://graph.facebook.com/v25.0/${campaignId}`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({
        error: data.error.error_user_msg || data.error.message,
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, archived: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
