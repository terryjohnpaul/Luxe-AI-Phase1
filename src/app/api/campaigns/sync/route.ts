import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/campaigns/sync
 * Background sync: pulls latest campaigns from Ajio Luxe Meta account
 * and upserts them into the database.
 */
export async function POST() {
  const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
  const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;

  if (!token || !accountId) {
    return NextResponse.json({ synced: 0, message: "No Ajio Luxe Meta credentials configured" });
  }

  try {
    const fields = ["id", "name", "status", "objective", "daily_budget", "created_time", "updated_time"].join(",");
    
    let allCampaigns: any[] = [];
    let nextUrl: string = `https://graph.facebook.com/v25.0/act_${accountId}/campaigns?fields=${fields}&limit=200&access_token=${token}`;
    
    // Paginate through all campaigns
    while (nextUrl) {
      const res = await fetch(nextUrl);
      const data = await res.json();
      if (data.error) {
        console.error("[Campaign Sync] Meta API error:", data.error.message);
        break;
      }
      if (data.data) {
        allCampaigns = allCampaigns.concat(data.data);
      }
      nextUrl = data.paging?.next ?? "";
    }

    if (allCampaigns.length === 0) {
      return NextResponse.json({ synced: 0, message: "No campaigns found from API" });
    }

    // Get the ad account DB record (or find the first META ad account)
    let adAccount = await db.adAccount.findFirst({
      where: { platformAccountId: accountId, platform: "META" },
    });

    if (!adAccount) {
      // Try to find any META ad account
      adAccount = await db.adAccount.findFirst({
        where: { platform: "META" },
      });
    }

    if (!adAccount) {
      return NextResponse.json({ synced: 0, message: "No Meta ad account found in DB" });
    }

    let synced = 0;
    for (const c of allCampaigns) {
      try {
        // Determine campaign type from name heuristics
        let campaignType = "";
        const nameLower = c.name.toLowerCase();
        if (nameLower.includes("asc") || nameLower.includes("advantage")) campaignType = "ASC";
        else if (nameLower.includes("retarget") || nameLower.includes("remarket")) campaignType = "RETARGET";
        else if (nameLower.includes("traffic")) campaignType = "TRAFFIC";
        else if (nameLower.includes("conversion") || nameLower.includes("purchase")) campaignType = "CONVERSION";

        // Extract brand from name
        let brandFocus = "";
        const brandMatches = c.name.match(/LUXE_([A-Za-z]+)_/);
        if (brandMatches) brandFocus = brandMatches[1];

        const statusMap: Record<string, string> = {
          ACTIVE: "ACTIVE",
          PAUSED: "PAUSED",
          DELETED: "DELETED",
          ARCHIVED: "ARCHIVED",
        };

        await db.campaign.upsert({
          where: {
            platform_externalId: {
              platform: "META",
              externalId: c.id,
            },
          },
          update: {
            name: c.name,
            status: statusMap[c.status] || "PAUSED",
            objective: c.objective || null,
            dailyBudget: c.daily_budget ? parseInt(c.daily_budget) / 100 : null,
            campaignType: campaignType || undefined,
            brandFocus: brandFocus || undefined,
          },
          create: {
            externalId: c.id,
            platform: "META",
            name: c.name,
            status: statusMap[c.status] || "PAUSED",
            objective: c.objective || null,
            dailyBudget: c.daily_budget ? parseInt(c.daily_budget) / 100 : null,
            campaignType: campaignType || null,
            brandFocus: brandFocus || null,
            adAccountId: adAccount.id,
            organizationId: adAccount.organizationId,
          },
        });
        synced++;
      } catch (err: any) {
        console.error(`[Campaign Sync] Error upserting ${c.id}:`, err.message);
      }
    }

    return NextResponse.json({ synced, total: allCampaigns.length, message: `Synced ${synced} campaigns` });
  } catch (error: any) {
    console.error("[Campaign Sync]", error);
    return NextResponse.json({ synced: 0, error: error.message }, { status: 500 });
  }
}
