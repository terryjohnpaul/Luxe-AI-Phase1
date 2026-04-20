import { NextResponse } from "next/server";
import { askClaudeStructured } from "@/lib/ai/claude";
import { optimizationAnalysisPrompt } from "@/lib/ai/prompts";
import { cachedFetch } from "@/lib/api-cache";

const META_BASE = "https://graph.facebook.com/v25.0";

async function fetchOptimizationData() {
  const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
  const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
  if (!token || !accountId) return null;

  try {
    const [campaignResp, placementResp] = await Promise.all([
      fetch(`${META_BASE}/act_${accountId}/insights?fields=campaign_name,campaign_id,spend,impressions,clicks,actions,purchase_roas,frequency,reach&level=campaign&date_preset=last_7d&limit=20&sort=spend_descending&access_token=${token}`),
      fetch(`${META_BASE}/act_${accountId}/insights?fields=spend,actions,purchase_roas&date_preset=last_7d&breakdowns=publisher_platform,platform_position&access_token=${token}`),
    ]);

    const [campaigns, placements] = await Promise.all([
      campaignResp.json(), placementResp.json(),
    ]);

    return {
      campaigns: campaigns.data || [],
      placements: placements.data || [],
    };
  } catch (e) {
    console.error("[optimization] Fetch error:", e);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "true";

  const { data: metaData, fetchedAt, fromCache } = await cachedFetch(
    "optimization-data",
    fetchOptimizationData,
    refresh
  );

  if (!metaData) {
    return NextResponse.json({ error: "Failed to fetch optimization data" }, { status: 500 });
  }

  let aiDecisions = null;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey && metaData.campaigns.length > 0 && refresh) {
    try {
      const result = await askClaudeStructured(
        optimizationAnalysisPrompt({
          metaMetrics: metaData.campaigns.slice(0, 10),
          googleMetrics: [],
          signals: [],
          historicalContext: "Ajio Luxe luxury fashion. Key insights: IG Reels delivers 7.45x ROAS vs Stories 3.47x. Male 35-44 is a hidden goldmine at 16.67x ROAS. Dedicated sale campaigns destroy value (0.02x Google, 3.2x Meta). Always-on campaigns perform best during sales. Late night (10PM-1AM) is 3.8x cheaper on Meta. Morning (6AM) is cheapest on Google.",
        }),
        (json) => JSON.parse(json)
      );
      aiDecisions = result.data;
    } catch (e) {
      console.error("[optimization] AI analysis error:", e);
    }
  }

  const highFrequencyCampaigns = metaData.campaigns
    .filter((c: any) => parseFloat(c.frequency || "0") > 10)
    .map((c: any) => ({
      name: c.campaign_name,
      frequency: parseFloat(c.frequency),
      action: "Consider creative refresh or audience expansion",
    }));

  return NextResponse.json({
    metaCampaigns: metaData.campaigns.length,
    placements: metaData.placements.length,
    aiDecisions,
    alerts: {
      highFrequency: highFrequencyCampaigns,
    },
    source: fromCache ? "cache" : "live_meta_api",
    aiSource: aiDecisions ? "openai_gpt4o" : "unavailable",
    fetchedAt,
  });
}
