import { NextResponse } from "next/server";

const META_API = "https://graph.facebook.com/v25.0";

function resolveToken(account: string) {
  if (account === "luxeai") {
    return {
      token: process.env.META_ADS_ACCESS_TOKEN,
      envName: "META_ADS_ACCESS_TOKEN",
    };
  }
  return {
    token: process.env.AJIO_LUXE_META_ACCESS_TOKEN,
    envName: "AJIO_LUXE_META_ACCESS_TOKEN",
  };
}

// ── Ajio Luxe Benchmarks ──
const BENCHMARKS = {
  overall: { avgROAS: 4.16, avgCPA: 287, avgCTR: 1.72, avgCPC: 4.93 },
  byPlatform: { ios: { avgROAS: 3.8, avgCPA: 310 }, android: { avgROAS: 4.5, avgCPA: 260 } },
  byType: {
    retargeting: { avgROAS: 7.2, avgCPA: 180 },
    prospecting: { avgROAS: 2.8, avgCPA: 420 },
    interest: { avgROAS: 3.5, avgCPA: 340 },
    lookalike: { avgROAS: 5.0, avgCPA: 240 },
  },
  bestAge: { group: "25-34", cpa: 210 },
};

// ── Helpers ──
function fmtINR(v: number): string {
  return "\u20B9" + Math.round(v).toLocaleString("en-IN");
}

function extractPurchases(actions: any[] | undefined): number {
  if (!actions) return 0;
  const a = actions.find((a: any) => a.action_type === "purchase" || a.action_type === "omni_purchase");
  return a ? parseInt(a.value) || 0 : 0;
}

function extractROAS(purchaseRoas: any[] | undefined): number {
  if (!purchaseRoas) return 0;
  const a = purchaseRoas.find((a: any) => a.action_type === "omni_purchase" || a.action_type === "purchase");
  return a ? parseFloat(a.value) || 0 : 0;
}

function safe(v: any): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return isNaN(n) || !isFinite(n) ? 0 : n;
}

async function metaGet(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ── Suggestion builder ──
interface Suggestion {
  icon: string;
  type: "warning" | "success" | "info" | "opportunity";
  title: string;
  detail: string;
}

// ── Main route ──
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  const body = await request.json();
  const account = body.account || new URL(request.url).searchParams.get("account") || "ajio";
  const { token: TOKEN, envName } = resolveToken(account);

  if (!TOKEN) {
    return NextResponse.json({ error: `${envName} not configured` }, { status: 500 });
  }

  try {
    // ── 1. Fetch all data in parallel ──
    const [
      campaignRes,
      adSetsRes,
      adsRes,
      insightsAgeGenderRes,
      insightsPlacementRes,
      insightsDeviceRes,
      insightsDailyRes,
      insightsAdLevelRes,
    ] = await Promise.allSettled([
      metaGet(`${META_API}/${campaignId}?fields=name,status,objective,daily_budget,lifetime_budget,bid_strategy,start_time,created_time&access_token=${TOKEN}`),
      metaGet(`${META_API}/${campaignId}/adsets?fields=id,name,status,daily_budget,optimization_goal,billing_event,bid_strategy,targeting,start_time,end_time&limit=50&access_token=${TOKEN}`),
      metaGet(`${META_API}/${campaignId}/ads?fields=id,name,status,creative{id,title,body,call_to_action_type,image_url,thumbnail_url,video_id,object_story_spec}&limit=50&access_token=${TOKEN}`),
      metaGet(`${META_API}/${campaignId}/insights?fields=spend,impressions,clicks,actions,purchase_roas&breakdowns=age,gender&date_preset=last_7d&access_token=${TOKEN}`),
      metaGet(`${META_API}/${campaignId}/insights?fields=spend,impressions,clicks,actions,purchase_roas&breakdowns=publisher_platform,platform_position&date_preset=last_7d&access_token=${TOKEN}`),
      metaGet(`${META_API}/${campaignId}/insights?fields=spend,impressions,clicks,actions,purchase_roas&breakdowns=device_platform&date_preset=last_7d&access_token=${TOKEN}`),
      metaGet(`${META_API}/${campaignId}/insights?fields=spend,impressions,clicks,actions,purchase_roas,ctr,cpc&time_increment=1&date_preset=last_7d&access_token=${TOKEN}`),
      metaGet(`${META_API}/${campaignId}/insights?fields=ad_id,ad_name,spend,impressions,clicks,actions,purchase_roas,ctr&level=ad&date_preset=last_7d&limit=20&access_token=${TOKEN}`),
    ]);

    // ── 2. Extract data safely ──
    const campaign = campaignRes.status === "fulfilled" ? campaignRes.value : null;
    const adSetsRaw = adSetsRes.status === "fulfilled" ? (adSetsRes.value.data || []) : [];
    const adsRaw = adsRes.status === "fulfilled" ? (adsRes.value.data || []) : [];
    const ageGenderData = insightsAgeGenderRes.status === "fulfilled" ? (insightsAgeGenderRes.value.data || []) : [];
    const placementData = insightsPlacementRes.status === "fulfilled" ? (insightsPlacementRes.value.data || []) : [];
    const deviceData = insightsDeviceRes.status === "fulfilled" ? (insightsDeviceRes.value.data || []) : [];
    const dailyData = insightsDailyRes.status === "fulfilled" ? (insightsDailyRes.value.data || []) : [];
    const adLevelData = insightsAdLevelRes.status === "fulfilled" ? (insightsAdLevelRes.value.data || []) : [];

    const campaignName = campaign?.name || "Unknown Campaign";
    const campaignObjective = campaign?.objective || "";
    const bidStrategy = campaign?.bid_strategy || "";
    const dailyBudget = campaign?.daily_budget ? parseInt(campaign.daily_budget) / 100 : 0;
    const startTime = campaign?.start_time || campaign?.created_time || "";
    const daysRunning = startTime ? Math.max(1, Math.floor((Date.now() - new Date(startTime).getTime()) / 86400000)) : 0;

    const activeAdSets = adSetsRaw.filter((a: any) => a.status === "ACTIVE");
    const activeAds = adsRaw.filter((a: any) => a.status === "ACTIVE");

    // ── 3. Build breakdowns ──
    const ageGender = ageGenderData.map((row: any) => ({
      age: row.age || "",
      gender: row.gender === "male" ? "Male" : row.gender === "female" ? "Female" : row.gender || "",
      spend: safe(row.spend),
      roas: extractROAS(row.purchase_roas),
      conversions: extractPurchases(row.actions),
    }));

    const placements = placementData.map((row: any) => ({
      platform: row.publisher_platform || "",
      position: row.platform_position || "",
      spend: safe(row.spend),
      roas: extractROAS(row.purchase_roas),
    }));

    const devices = deviceData.map((row: any) => ({
      device: row.device_platform || "",
      spend: safe(row.spend),
      roas: extractROAS(row.purchase_roas),
    }));

    const dailyTrend = dailyData.map((row: any) => ({
      date: row.date_start || "",
      spend: safe(row.spend),
      roas: extractROAS(row.purchase_roas),
      ctr: safe(row.ctr),
    }));

    // ── 4. Calculate totals ──
    const totalSpend = dailyTrend.reduce((s: number, d: any) => s + d.spend, 0) || ageGender.reduce((s: number, d: any) => s + d.spend, 0);
    const totalConversions = ageGender.reduce((s: number, d: any) => s + d.conversions, 0);
    const overallCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;

    // ── 5. Generate suggestions ──
    const suggestions: Suggestion[] = [];

    if (ageGender.length > 0 && totalSpend > 0) {
      const sorted = [...ageGender].sort((a, b) => b.roas - a.roas);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];

      if (worst && worst.spend > 0) {
        const worstSpendPct = (worst.spend / totalSpend * 100);
        const worstConvPct = totalConversions > 0 ? (worst.conversions / totalConversions * 100) : 0;
        if (worstSpendPct > 20 && worstConvPct < 10) {
          suggestions.push({
            icon: "\u26A0\uFE0F",
            type: "warning",
            title: `${worst.age} ${worst.gender} overspending`,
            detail: `Gets ${worstSpendPct.toFixed(0)}% of budget but only ${worstConvPct.toFixed(0)}% of conversions (ROAS ${worst.roas.toFixed(1)}x). Consider excluding or reducing bid for this segment.`,
          });
        }
      }

      if (best && best.roas > 0 && best.spend > 0) {
        const bestSpendPct = (best.spend / totalSpend * 100);
        if (bestSpendPct < 30 && best.roas > 2) {
          suggestions.push({
            icon: "\uD83D\uDCB0",
            type: "opportunity",
            title: `${best.age} ${best.gender} is underfunded`,
            detail: `Delivers ${best.roas.toFixed(1)}x ROAS but only gets ${bestSpendPct.toFixed(0)}% of budget. Scale this segment for better returns.`,
          });
        }
      }
    }

    if (placements.length > 0) {
      const placementsSorted = [...placements].filter((p: any) => p.spend > 0).sort((a: any, b: any) => b.roas - a.roas);
      if (placementsSorted.length >= 2) {
        const bestP = placementsSorted[0];
        const worstP = placementsSorted[placementsSorted.length - 1];
        const bestLabel = `${bestP.platform} ${bestP.position}`.trim();
        const worstLabel = `${worstP.platform} ${worstP.position}`.trim();
        const bestPSpendPct = totalSpend > 0 ? (bestP.spend / totalSpend * 100).toFixed(0) : "?";
        const worstPSpendPct = totalSpend > 0 ? (worstP.spend / totalSpend * 100).toFixed(0) : "?";
        suggestions.push({
          icon: "\uD83D\uDCCA",
          type: "info",
          title: "Placement performance gap",
          detail: `${bestLabel} delivers ${bestP.roas.toFixed(1)}x ROAS on ${bestPSpendPct}% of spend. ${worstLabel} delivers ${worstP.roas.toFixed(1)}x on ${worstPSpendPct}%. Shift budget from ${worstLabel} to ${bestLabel}.`,
        });
      }
    }

    if (devices.length > 0) {
      const devicesWithSpend = devices.filter((d: any) => d.spend > 0);
      if (devicesWithSpend.length >= 2) {
        const devicesSorted = [...devicesWithSpend].sort((a: any, b: any) => b.roas - a.roas);
        const bestDev = devicesSorted[0];
        const worstDev = devicesSorted[devicesSorted.length - 1];
        const rec = bestDev.roas > worstDev.roas * 1.5
          ? `Shift budget toward ${bestDev.device} for better efficiency.`
          : `Device performance is relatively balanced.`;
        suggestions.push({
          icon: "\uD83D\uDCF1",
          type: bestDev.roas > worstDev.roas * 1.5 ? "opportunity" : "info",
          title: "Device performance",
          detail: `${bestDev.device}: ${bestDev.roas.toFixed(1)}x ROAS, ${worstDev.device}: ${worstDev.roas.toFixed(1)}x ROAS. ${rec}`,
        });
      }
    }

    if (dailyTrend.length >= 3) {
      const firstHalf = dailyTrend.slice(0, Math.floor(dailyTrend.length / 2));
      const secondHalf = dailyTrend.slice(Math.floor(dailyTrend.length / 2));
      const avgRoasFirst = firstHalf.reduce((s: number, d: any) => s + d.roas, 0) / firstHalf.length;
      const avgRoasSecond = secondHalf.reduce((s: number, d: any) => s + d.roas, 0) / secondHalf.length;
      const trending = avgRoasSecond > avgRoasFirst ? "up" : "down";
      const firstDay = dailyTrend[0];
      const lastDay = dailyTrend[dailyTrend.length - 1];
      const rec = trending === "down"
        ? "Performance declining \u2014 review audience saturation and creative freshness."
        : "Positive momentum \u2014 consider scaling budget while trend holds.";
      suggestions.push({
        icon: trending === "up" ? "\uD83D\uDCC8" : "\uD83D\uDCC9",
        type: trending === "up" ? "success" : "warning",
        title: `ROAS trending ${trending}`,
        detail: `7-day ROAS: ${firstDay.roas.toFixed(1)}x \u2192 ${lastDay.roas.toFixed(1)}x. ${rec}`,
      });

      const dailyConversions = dailyData.map((row: any) => ({
        spend: safe(row.spend),
        conv: extractPurchases(row.actions),
      }));
      const firstHalfCPA = dailyConversions.slice(0, Math.floor(dailyConversions.length / 2));
      const secondHalfCPA = dailyConversions.slice(Math.floor(dailyConversions.length / 2));
      const avgCPAFirst = firstHalfCPA.reduce((s: number, d: any) => s + (d.conv > 0 ? d.spend / d.conv : 0), 0) / firstHalfCPA.length;
      const avgCPASecond = secondHalfCPA.reduce((s: number, d: any) => s + (d.conv > 0 ? d.spend / d.conv : 0), 0) / secondHalfCPA.length;
      if (avgCPASecond > avgCPAFirst * 1.2 && avgCPAFirst > 0) {
        suggestions.push({
          icon: "\u26A0\uFE0F",
          type: "warning",
          title: "CPA rising",
          detail: `CPA increased from ~${fmtINR(avgCPAFirst)} to ~${fmtINR(avgCPASecond)} over the last 7 days. Check for audience fatigue or increased competition.`,
        });
      }
    }

    if (activeAds.length === 0 && adsRaw.length > 0) {
      suggestions.push({
        icon: "\u26A0\uFE0F",
        type: "warning",
        title: "No active ads",
        detail: `${adsRaw.length} ads exist but none are active. Campaign cannot deliver without active ads.`,
      });
    } else if (activeAds.length > 0 && activeAds.length < 3) {
      suggestions.push({
        icon: "\u26A0\uFE0F",
        type: "warning",
        title: `Only ${activeAds.length} active ad${activeAds.length === 1 ? "" : "s"}`,
        detail: `Meta recommends 3-5 active ads per ad set for effective creative testing. Add more variants to improve optimization.`,
      });
    }

    for (const ad of activeAds.slice(0, 5)) {
      const creative = ad.creative;
      if (creative && !creative.call_to_action_type) {
        suggestions.push({
          icon: "\u26A0\uFE0F",
          type: "warning",
          title: `"${(ad.name || "").slice(0, 40)}" has no CTA`,
          detail: `Adding a call-to-action button typically improves CTR by 15-20%. Consider adding SHOP_NOW or LEARN_MORE.`,
        });
        break;
      }
    }

    if (adLevelData.length >= 2) {
      const adTotalSpend = adLevelData.reduce((s: number, a: any) => s + safe(a.spend), 0);
      if (adTotalSpend > 0) {
        const topAd = adLevelData.sort((a: any, b: any) => safe(b.spend) - safe(a.spend))[0];
        const topAdPct = (safe(topAd.spend) / adTotalSpend) * 100;
        if (topAdPct > 80) {
          suggestions.push({
            icon: "\u26A0\uFE0F",
            type: "warning",
            title: "Creative concentration risk",
            detail: `"${(topAd.ad_name || "").slice(0, 40)}" gets ${topAdPct.toFixed(0)}% of spend. Add more creative variants to reduce fatigue and let Meta optimize across multiple assets.`,
          });
        }
      }
    }

    if (adSetsRaw.length > 0) {
      const firstAdSet = adSetsRaw[0];
      const targeting = firstAdSet.targeting || {};
      const ageMin = targeting.age_min || 18;
      const ageMax = targeting.age_max || 65;

      if (ageGender.length > 0) {
        const bestAgeSegment = [...ageGender].sort((a, b) => {
          const cpA = a.conversions > 0 ? a.spend / a.conversions : Infinity;
          const cpB = b.conversions > 0 ? b.spend / b.conversions : Infinity;
          return cpA - cpB;
        })[0];
        if (bestAgeSegment && bestAgeSegment.conversions > 0) {
          const bestCPA = bestAgeSegment.spend / bestAgeSegment.conversions;
          suggestions.push({
            icon: "\uD83C\uDFAF",
            type: "info",
            title: "Targeting vs. performance data",
            detail: `Targeting ${ageMin}-${ageMax} age range. Your data shows ${bestAgeSegment.age} ${bestAgeSegment.gender} delivers lowest CPA at ${fmtINR(bestCPA)}. Account benchmark is ${fmtINR(BENCHMARKS.overall.avgCPA)}.`,
          });
        }
      }

      const flexSpec = targeting.flexible_spec;
      const customAudiences = targeting.custom_audiences;
      if (flexSpec && flexSpec.length > 0 && (!customAudiences || customAudiences.length === 0)) {
        suggestions.push({
          icon: "\uD83D\uDC65",
          type: "opportunity",
          title: "Test Lookalike audiences",
          detail: `Currently using interest targeting (avg ${BENCHMARKS.byType.interest.avgROAS}x ROAS in our data). Lookalike audiences deliver ${BENCHMARKS.byType.lookalike.avgROAS}x. Consider testing LAL based on purchasers.`,
        });
      }
    }

    if (overallCPA > 0) {
      const diff = ((overallCPA - BENCHMARKS.overall.avgCPA) / BENCHMARKS.overall.avgCPA) * 100;
      const direction = diff > 0 ? "above" : "below";
      suggestions.push({
        icon: "\uD83D\uDCB0",
        type: diff > 20 ? "warning" : diff < -10 ? "success" : "info",
        title: `CPA vs account benchmark`,
        detail: `This campaign's CPA ${fmtINR(overallCPA)} is ${Math.abs(diff).toFixed(0)}% ${direction} account average ${fmtINR(BENCHMARKS.overall.avgCPA)}.`,
      });
    }

    if (campaignObjective) {
      if ((campaignObjective.includes("TRAFFIC") || campaignObjective === "OUTCOME_TRAFFIC") && totalConversions > 0) {
        suggestions.push({
          icon: "\uD83D\uDD04",
          type: "opportunity",
          title: "Switch to Purchase optimization",
          detail: `Optimizing for Traffic but getting ${totalConversions} purchases. Switch to Purchase/Conversion optimization for better ROAS \u2014 Meta will find higher-intent users.`,
        });
      }
      if ((campaignObjective.includes("SALES") || campaignObjective === "OUTCOME_SALES") && totalConversions < 50 && daysRunning >= 7) {
        suggestions.push({
          icon: "\u26A0\uFE0F",
          type: "warning",
          title: "Low conversion volume",
          detail: `Only ${totalConversions} conversions in 7 days. Meta needs ~50/week to exit learning phase. Consider broader targeting, higher budget, or optimizing for a higher-funnel event.`,
        });
      }
    }

    if (totalSpend > 0) {
      const nameLower = campaignName.toLowerCase();
      let flywheelNote = "";
      if (nameLower.includes("retarget") || nameLower.includes("rtml")) {
        flywheelNote = `Retargeting benchmark from Ajio Luxe data: ${BENCHMARKS.byType.retargeting.avgROAS}x ROAS at ${fmtINR(BENCHMARKS.byType.retargeting.avgCPA)} CPA.`;
      } else if (nameLower.includes("prosp") || nameLower.includes("interest")) {
        flywheelNote = `Prospecting benchmark: ${BENCHMARKS.byType.prospecting.avgROAS}x ROAS at ${fmtINR(BENCHMARKS.byType.prospecting.avgCPA)} CPA. Best age: ${BENCHMARKS.bestAge.group}.`;
      } else {
        flywheelNote = `Account-wide benchmark: ${BENCHMARKS.overall.avgROAS}x ROAS, ${fmtINR(BENCHMARKS.overall.avgCPA)} CPA, ${BENCHMARKS.overall.avgCTR}% CTR.`;
      }
      suggestions.push({
        icon: "\uD83E\uDDE0",
        type: "info",
        title: "Flywheel benchmark",
        detail: flywheelNote,
      });
    }

    if (dailyData.length > 0) {
      if (adLevelData.length > 0) {
        const totalAdImpressions = adLevelData.reduce((s: number, a: any) => s + safe(a.impressions), 0);
        const totalAdClicks = adLevelData.reduce((s: number, a: any) => s + safe(a.clicks), 0);
        const avgCTR = totalAdClicks > 0 && totalAdImpressions > 0 ? (totalAdClicks / totalAdImpressions * 100) : 0;
        if (avgCTR > 0 && avgCTR < 0.5 && totalAdImpressions > 100000) {
          suggestions.push({
            icon: "\u26A0\uFE0F",
            type: "warning",
            title: "Possible audience fatigue",
            detail: `CTR is only ${avgCTR.toFixed(2)}% across ${(totalAdImpressions / 1000).toFixed(0)}K impressions. This often indicates high frequency / audience saturation. Expand audience or refresh creative.`,
          });
        }
      }
    }

    if (totalSpend === 0 && suggestions.length === 0) {
      suggestions.push({
        icon: "\uD83D\uDCCA",
        type: "info",
        title: "No spend data",
        detail: "No spend or impression data in the last 7 days. Campaign may be newly created, paused, or has no active ad sets with approved creatives.",
      });
      suggestions.push({
        icon: "\uD83D\uDCA1",
        type: "info",
        title: "Check setup",
        detail: "Ensure ad sets have approved creatives and sufficient budget to begin delivery.",
      });
    }

    // ── 6. Build response ──
    return NextResponse.json({
      campaignId,
      suggestions,
      campaignDetails: {
        name: campaignName,
        objective: campaignObjective,
        bidStrategy,
        adSets: adSetsRaw.length,
        ads: adsRaw.length,
        daysRunning,
      },
      breakdowns: {
        ageGender,
        placements,
        devices,
        dailyTrend,
      },
      meta: {
        adSetsCount: adSetsRaw.length,
        adsCount: adsRaw.length,
        ageSegments: ageGender.length,
        placementsCount: placements.length,
        devicesCount: devices.length,
        dailyDays: dailyTrend.length,
      },
    });
  } catch (err: any) {
    console.error("[Campaign Deep Analyze] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
