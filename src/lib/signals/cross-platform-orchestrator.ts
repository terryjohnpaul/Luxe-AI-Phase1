import { Signal } from "./types";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const META_BASE = "https://graph.facebook.com/v25.0";

interface GoogleMonthlyData {
  month: string;
  impressions: number;
  cost: number;
  conversionValue: number;
  conversions: number;
}

function loadGoogleData(): GoogleMonthlyData[] {
  try {
    const path = join(process.cwd(), "data", "google-monthly-trends.json");
    if (!existsSync(path)) return [];
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch { return []; }
}

function getGoogleMonthData(googleData: GoogleMonthlyData[], targetMonth: string): GoogleMonthlyData | null {
  return googleData.find(d => d.month.toLowerCase().includes(targetMonth.toLowerCase())) || null;
}

export async function getcrossplatformorchestratorSignals(): Promise<Signal[]> {
  try {
    const token = process.env.AJIO_LUXE_META_ACCESS_TOKEN;
    const accountId = process.env.AJIO_LUXE_META_ACCOUNT_ID;
    if (!token || !accountId) return [];

    const now = new Date();
    const expires = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const signals: Signal[] = [];
    const hour = now.getHours();
    const monthName = now.toLocaleString("en-US", { month: "long" });
    const year = now.getFullYear();

    // Load Google data from CSV export
    const googleData = loadGoogleData();
    const currentMonthGoogle = getGoogleMonthData(googleData, `${monthName} ${year}`);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
    const prevMonthName = prevMonthDate.toLocaleString("en-US", { month: "long" });
    const prevMonthGoogle = getGoogleMonthData(googleData, `${prevMonthName} ${prevMonthDate.getFullYear()}`);

    // Fetch Meta platform breakdown
    const resp = await fetch(`${META_BASE}/act_${accountId}/insights?fields=spend,impressions,actions,purchase_roas&date_preset=last_30d&breakdowns=publisher_platform&access_token=${token}`);
    const json = await resp.json();
    const metaData = json.data || [];

    const igData = metaData.find((d: any) => d.publisher_platform === "instagram");
    const fbData = metaData.find((d: any) => d.publisher_platform === "facebook");

    // Calculate Meta totals
    const metaSpend = metaData.reduce((s: number, d: any) => s + parseFloat(d.spend || "0"), 0);
    const metaRoas = metaData[0]?.purchase_roas?.[0]?.value ? parseFloat(metaData[0].purchase_roas[0].value) : 0;

    // Cross-platform ROAS comparison
    if (currentMonthGoogle && metaSpend > 0) {
      const googleRoas = currentMonthGoogle.cost > 0 ? currentMonthGoogle.conversionValue / currentMonthGoogle.cost : 0;
      const combinedSpend = metaSpend + currentMonthGoogle.cost;
      const metaPurchases = metaData.reduce((s: number, d: any) => s + parseInt(d.actions?.find((a: any) => a.action_type === "purchase")?.value || "0"), 0);
      const combinedConversions = metaPurchases + currentMonthGoogle.conversions;

      signals.push({
        id: `cross-platform-combined-roas-${now.getMonth()}`,
        type: "economic",
        source: "cross-platform-orchestrator",
        title: `Cross-Platform: Meta ROAS ${metaRoas.toFixed(1)}x vs Google ROAS ${googleRoas.toFixed(1)}x | Combined Spend Rs ${Math.round(combinedSpend).toLocaleString()}`,
        description: `Meta: Rs ${Math.round(metaSpend).toLocaleString()} spend, ${metaRoas.toFixed(2)}x ROAS. Google: Rs ${Math.round(currentMonthGoogle.cost).toLocaleString()} spend, ${googleRoas.toFixed(1)}x ROAS. Combined: Rs ${Math.round(combinedSpend).toLocaleString()} total, ${combinedConversions.toLocaleString()} conversions.`,
        location: "Pan India",
        severity: Math.abs(metaRoas - googleRoas) > 3 ? "high" : "medium",
        triggersWhat: metaRoas > googleRoas ? "Meta outperforming — consider shifting more budget to Meta" : "Google outperforming — consider shifting more budget to Google",
        targetArchetypes: ["All"],
        suggestedBrands: ["All brands"],
        suggestedAction: `Platform split: Meta Rs ${Math.round(metaSpend).toLocaleString()} (${(metaSpend / combinedSpend * 100).toFixed(0)}%) + Google Rs ${Math.round(currentMonthGoogle.cost).toLocaleString()} (${(currentMonthGoogle.cost / combinedSpend * 100).toFixed(0)}%). ${metaRoas > googleRoas ? "Meta is more efficient — shift 10% from Google to Meta." : "Google is more efficient — shift 10% from Meta to Google."}`,
        confidence: 0.85,
        expiresAt: expires,
        data: {
          meta: { spend: metaSpend, roas: metaRoas },
          google: { spend: currentMonthGoogle.cost, roas: googleRoas, conversions: currentMonthGoogle.conversions },
          combined: { spend: combinedSpend, conversions: combinedConversions },
          source: "meta_live_api + google_csv_data",
        },
        detectedAt: now,
      });
    }

    // Google month-over-month trend
    if (currentMonthGoogle && prevMonthGoogle && prevMonthGoogle.cost > 0) {
      const googleSpendChange = (currentMonthGoogle.cost - prevMonthGoogle.cost) / prevMonthGoogle.cost;
      const googleConvChange = prevMonthGoogle.conversions > 0 ? (currentMonthGoogle.conversions - prevMonthGoogle.conversions) / prevMonthGoogle.conversions : 0;

      if (Math.abs(googleSpendChange) > 0.2) {
        signals.push({
          id: `cross-platform-google-trend-${now.getMonth()}`,
          type: "economic",
          source: "cross-platform-orchestrator",
          title: `Google Ads Trend: Spend ${googleSpendChange > 0 ? "+" : ""}${(googleSpendChange * 100).toFixed(0)}% vs Last Month`,
          description: `Google Ads spend ${googleSpendChange > 0 ? "increased" : "decreased"} ${Math.abs(googleSpendChange * 100).toFixed(0)}% (Rs ${Math.round(prevMonthGoogle.cost).toLocaleString()} → Rs ${Math.round(currentMonthGoogle.cost).toLocaleString()}). Conversions: ${googleConvChange > 0 ? "+" : ""}${(googleConvChange * 100).toFixed(0)}%.`,
          location: "Pan India",
          severity: Math.abs(googleSpendChange) > 0.5 ? "high" : "medium",
          triggersWhat: "Review Google Ads budget allocation",
          targetArchetypes: ["All"],
          suggestedBrands: ["All brands"],
          suggestedAction: `Google spend shifted ${(googleSpendChange * 100).toFixed(0)}%. ${googleConvChange > googleSpendChange ? "Efficiency improving — conversions growing faster than spend." : "Efficiency declining — spend growing faster than conversions."}`,
          confidence: 0.80,
          expiresAt: expires,
          data: { current: currentMonthGoogle, previous: prevMonthGoogle, spendChange: googleSpendChange, convChange: googleConvChange, source: "google_csv_data" },
          detectedAt: now,
        });
      }
    }

    // Facebook underfunded signal (from live Meta API)
    if (igData && fbData) {
      const igSpend = parseFloat(igData.spend || "0");
      const fbSpend = parseFloat(fbData.spend || "0");
      const totalMetaSpend = igSpend + fbSpend;
      const igRoas = igData.purchase_roas?.[0]?.value ? parseFloat(igData.purchase_roas[0].value) : 0;
      const fbRoas = fbData.purchase_roas?.[0]?.value ? parseFloat(fbData.purchase_roas[0].value) : 0;
      const fbPct = (fbSpend / totalMetaSpend * 100).toFixed(0);

      if (fbRoas > igRoas * 1.5 && parseFloat(fbPct) < 20) {
        signals.push({
          id: "cross-platform-fb-underfunded",
          type: "economic",
          source: "cross-platform-orchestrator",
          title: `Facebook Underfunded: ${fbRoas.toFixed(1)}x ROAS on ${fbPct}% budget vs Instagram ${igRoas.toFixed(1)}x`,
          description: `Facebook delivers ${fbRoas.toFixed(1)}x ROAS but only receives ${fbPct}% of Meta budget. Instagram gets ${(100 - parseFloat(fbPct)).toFixed(0)}% at ${igRoas.toFixed(1)}x. Historical: FB 12.25x vs IG 5.15x — persistent pattern.`,
          location: "Pan India",
          severity: "high",
          triggersWhat: "Shift budget from Instagram to Facebook",
          targetArchetypes: ["All"],
          suggestedBrands: ["All brands"],
          suggestedAction: `Shift 10-15% of Instagram budget to Facebook. FB ROAS ${fbRoas.toFixed(1)}x vs IG ${igRoas.toFixed(1)}x = ${(fbRoas / igRoas).toFixed(1)}x more efficient.`,
          confidence: 0.90,
          expiresAt: expires,
          data: { ig: { spend: igSpend, roas: igRoas }, fb: { spend: fbSpend, roas: fbRoas }, source: "live_meta_api" },
          detectedAt: now,
        });
      }
    }

    // Time-based cross-platform routing (encoded from 10yr data)
    if (hour >= 5 && hour <= 9) {
      signals.push({
        id: "cross-platform-morning-google",
        type: "regional",
        source: "cross-platform-orchestrator",
        title: "Cross-Platform: Morning Intent Window — Google Cheapest, Meta Expensive",
        description: `${hour}:00 IST. Google Search CPA is 62% of average (cheapest). Meta CPA is 2-3x above average. Shift budget to Google Search for this window.`,
        location: "Pan India",
        severity: "high",
        triggersWhat: "Push Google Search, reduce Meta",
        targetArchetypes: ["Fashion Loyalists", "Urban Achievers"],
        suggestedBrands: ["All brands"],
        suggestedAction: "Google: increase bids +50%. Meta: reduce bids -30%. Morning = intent-driven search. Google 6AM CPA Rs 14.92 vs Meta Rs 1,321.",
        confidence: 0.93,
        expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        data: { hour, window: "morning_intent", googleAdvantage: true, source: "encoded_10yr" },
        detectedAt: now,
      });
    } else if (hour >= 21 || hour <= 1) {
      signals.push({
        id: "cross-platform-night-meta",
        type: "regional",
        source: "cross-platform-orchestrator",
        title: "Cross-Platform: Night Discovery Window — Meta Cheapest, Google Expensive",
        description: `${hour}:00 IST. Meta CPA is 47% of average (cheapest). Google CPA is 150% of average. Shift budget to Meta Reels for this window.`,
        location: "Pan India",
        severity: "high",
        triggersWhat: "Push Meta Reels, reduce Google",
        targetArchetypes: ["Aspirants", "Occasional Splurgers"],
        suggestedBrands: ["Onitsuka Tiger", "Coach", "Diesel"],
        suggestedAction: "Meta: increase bids +50%, push Reels. Google: reduce bids -40%. Night = discovery browsing. Meta 11PM CPA Rs 344 vs Google 1AM CPA Rs 35.91.",
        confidence: 0.93,
        expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        data: { hour, window: "night_discovery", metaAdvantage: true, source: "encoded_10yr" },
        detectedAt: now,
      });
    }

    return signals;
  } catch (e) {
    console.error("[cross-platform-orchestrator] Error:", e);
    return [];
  }
}
