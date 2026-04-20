import { NextResponse } from "next/server";

const META_API = "https://graph.facebook.com/v25.0";

/**
 * GET /api/ajio-luxe/performance
 * Fetches Ajio Luxe Meta Ads performance data.
 * Query params: period (last_7d, last_30d, last_90d, maximum), level (account, campaign), limit, sort
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "last_30d";
  const level = searchParams.get("level") || "campaign";
  const limit = parseInt(searchParams.get("limit") || "50");
  const sort = searchParams.get("sort") || "spend_descending";
  const status = searchParams.get("status") || "";

  const accessToken = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
  const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    return NextResponse.json({ error: "Ajio Luxe Meta account not connected" }, { status: 400 });
  }

  try {
    // Account-level summary
    const summaryRes = await fetch(
      `${META_API}/act_${accountId}/insights?fields=spend,impressions,clicks,ctr,cpc,actions,purchase_roas,cost_per_action_type&date_preset=${period}&access_token=${accessToken}`
    );
    const summaryData = await summaryRes.json();

    const summary = summaryData.data?.[0] || {};
    const purchases = summary.actions?.find((a: any) => a.action_type === "purchase")?.value || "0";
    const addToCarts = summary.actions?.find((a: any) => a.action_type === "add_to_cart")?.value || "0";
    const leads = summary.actions?.find((a: any) => a.action_type === "lead")?.value || "0";
    const viewContent = summary.actions?.find((a: any) => a.action_type === "view_content")?.value || "0";
    const initiateCheckout = summary.actions?.find((a: any) => a.action_type === "initiate_checkout")?.value || "0";
    const roas = summary.purchase_roas?.[0]?.value || "0";
    const purchaseCPA = summary.cost_per_action_type?.find((a: any) => a.action_type === "purchase" || a.action_type === "omni_purchase")?.value || "0";

    const accountSummary = {
      spend: parseFloat(summary.spend || "0"),
      impressions: parseInt(summary.impressions || "0"),
      clicks: parseInt(summary.clicks || "0"),
      ctr: parseFloat(summary.ctr || "0"),
      cpc: parseFloat(summary.cpc || "0"),
      purchases: parseInt(purchases),
      addToCarts: parseInt(addToCarts),
      leads: parseInt(leads),
      viewContent: parseInt(viewContent),
      initiateCheckout: parseInt(initiateCheckout),
      roas: parseFloat(roas),
      cpa: parseFloat(purchaseCPA),
      period,
    };

    // Campaign-level breakdown
    let campaigns: any[] = [];
    if (level === "campaign") {
      let filterParam = "";
      if (status) {
        filterParam = `&filtering=[{"field":"campaign.delivery_info","operator":"IN","value":["${status}"]}]`;
      }

      const campaignRes = await fetch(
        `${META_API}/act_${accountId}/insights?fields=campaign_name,campaign_id,spend,impressions,clicks,ctr,cpc,actions,purchase_roas,cost_per_action_type&date_preset=${period}&level=campaign&sort=${sort}&limit=${limit}${filterParam}&access_token=${accessToken}`
      );
      const campaignData = await campaignRes.json();

      if (campaignData.data) {
        campaigns = campaignData.data.map((c: any) => {
          const cPurchases = c.actions?.find((a: any) => a.action_type === "purchase" || a.action_type === "omni_purchase")?.value || "0";
          const cAddToCart = c.actions?.find((a: any) => a.action_type === "add_to_cart" || a.action_type === "omni_add_to_cart")?.value || "0";
          const cViewContent = c.actions?.find((a: any) => a.action_type === "view_content" || a.action_type === "omni_view_content")?.value || "0";
          const cRoas = c.purchase_roas?.[0]?.value || "0";
          const cCPA = c.cost_per_action_type?.find((a: any) => a.action_type === "purchase" || a.action_type === "omni_purchase")?.value || "0";
          const spend = parseFloat(c.spend || "0");

          return {
            campaignId: c.campaign_id,
            campaignName: c.campaign_name,
            spend,
            impressions: parseInt(c.impressions || "0"),
            clicks: parseInt(c.clicks || "0"),
            ctr: parseFloat(c.ctr || "0"),
            cpc: parseFloat(c.cpc || "0"),
            purchases: parseInt(cPurchases),
            addToCarts: parseInt(cAddToCart),
            viewContent: parseInt(cViewContent),
            roas: parseFloat(cRoas),
            cpa: parseFloat(cCPA),
          };
        });
      }
    }

    // Generate insights — what worked vs what didn't
    const topPerformers = [...campaigns]
      .filter(c => c.roas > 0 && c.spend > 10000)
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 10);

    const worstPerformers = [...campaigns]
      .filter(c => c.spend > 10000)
      .sort((a, b) => a.roas - b.roas)
      .slice(0, 10);

    const highSpendLowReturn = campaigns.filter(c => c.spend > 100000 && c.roas < 3);
    const lowSpendHighReturn = campaigns.filter(c => c.spend > 10000 && c.roas > 15);

    const insights = {
      topPerformers,
      worstPerformers,
      highSpendLowReturn,
      lowSpendHighReturn,
      signals: [] as string[],
    };

    // Generate signals
    if (highSpendLowReturn.length > 0) {
      insights.signals.push(`${highSpendLowReturn.length} campaigns with high spend but ROAS < 3x — consider pausing or optimizing`);
    }
    if (lowSpendHighReturn.length > 0) {
      insights.signals.push(`${lowSpendHighReturn.length} campaigns with ROAS > 15x — consider increasing budget`);
    }

    const avgRoas = campaigns.length > 0
      ? campaigns.reduce((s, c) => s + c.roas, 0) / campaigns.length
      : 0;
    if (avgRoas > 0) {
      insights.signals.push(`Average campaign ROAS: ${avgRoas.toFixed(1)}x`);
    }

    return NextResponse.json({
      account: "AJIO LUXE",
      accountId: `act_${accountId}`,
      summary: accountSummary,
      campaigns,
      insights,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
