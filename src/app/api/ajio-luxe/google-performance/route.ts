import { NextResponse } from "next/server";
import { promises as fs } from "fs";

const CSV_PATH = "/root/luxe-ai/data/ajio-luxe-google-ads-alltime.csv";
const MONTHLY_CSV_PATH = "/root/luxe-ai/data/ajio-luxe-google-ads-monthly.csv";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseNumber(value: string): number {
  if (!value || value === "--" || value === "0") return 0;
  // Remove commas, percentage signs, currency symbols
  const cleaned = value.replace(/,/g, "").replace(/%/g, "").replace(/₹/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * GET /api/ajio-luxe/google-performance
 * Parses the uploaded Google Ads CSV and returns structured performance data.
 * Query params: sort (spend, roas, conversions), status (active, paused, all), limit
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get("sort") || "spend";
  const statusFilter = searchParams.get("status") || "all";
  const limit = parseInt(searchParams.get("limit") || "100");

  try {
    const csvContent = await fs.readFile(CSV_PATH, "utf-8");
    const lines = csvContent.split("\n").filter((l) => l.trim());

    // Skip first 2 lines (title + date range), line 3 is headers
    if (lines.length < 4) {
      return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
    }

    const headers = parseCSVLine(lines[2]);

    // Map header names to indices
    const headerMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      headerMap[h.toLowerCase().trim()] = i;
    });

    // Parse data rows (skip first 2 lines + header)
    let campaigns: any[] = [];

    for (let i = 3; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 5) continue;

      const getVal = (name: string): string => {
        const idx = headerMap[name.toLowerCase()];
        return idx !== undefined ? values[idx] || "" : "";
      };

      const spend = parseNumber(getVal("cost"));
      const conversions = parseNumber(getVal("conversions"));
      const convValue = parseNumber(getVal("conv. value"));
      const clicks = parseNumber(getVal("clicks"));
      const impressions = parseNumber(getVal("impr."));

      campaigns.push({
        campaignName: getVal("campaign"),
        status: getVal("campaign status") || getVal("status"),
        campaignType: getVal("campaign type"),
        bidStrategy: getVal("bid strategy type"),
        currency: getVal("currency code") || "INR",
        spend,
        impressions,
        clicks,
        ctr: parseNumber(getVal("interaction rate")),
        cpc: parseNumber(getVal("avg. cpc")),
        conversions,
        conversionValue: convValue,
        roas: spend > 0 ? convValue / spend : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        platform: "GOOGLE",
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      campaigns = campaigns.filter(
        (c) => c.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sort
    if (sortBy === "roas") {
      campaigns.sort((a, b) => b.roas - a.roas);
    } else if (sortBy === "conversions") {
      campaigns.sort((a, b) => b.conversions - a.conversions);
    } else {
      campaigns.sort((a, b) => b.spend - a.spend);
    }

    // Limit
    campaigns = campaigns.slice(0, limit);

    // Account summary
    const allCampaigns = campaigns;
    const summary = {
      totalCampaigns: allCampaigns.length,
      totalSpend: allCampaigns.reduce((s, c) => s + c.spend, 0),
      totalImpressions: allCampaigns.reduce((s, c) => s + c.impressions, 0),
      totalClicks: allCampaigns.reduce((s, c) => s + c.clicks, 0),
      totalConversions: allCampaigns.reduce((s, c) => s + c.conversions, 0),
      totalConversionValue: allCampaigns.reduce((s, c) => s + c.conversionValue, 0),
      avgCPC: 0,
      avgCTR: 0,
      overallROAS: 0,
      overallCPA: 0,
    };
    summary.overallROAS = summary.totalSpend > 0 ? summary.totalConversionValue / summary.totalSpend : 0;
    summary.overallCPA = summary.totalConversions > 0 ? summary.totalSpend / summary.totalConversions : 0;
    summary.avgCPC = summary.totalClicks > 0 ? summary.totalSpend / summary.totalClicks : 0;
    summary.avgCTR = summary.totalImpressions > 0 ? (summary.totalClicks / summary.totalImpressions) * 100 : 0;

    // Insights
    const topPerformers = [...allCampaigns]
      .filter((c) => c.roas > 0 && c.spend > 10000)
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 10);

    const worstPerformers = [...allCampaigns]
      .filter((c) => c.spend > 10000)
      .sort((a, b) => a.roas - b.roas)
      .slice(0, 10);

    const highSpendLowReturn = allCampaigns.filter((c) => c.spend > 100000 && c.roas < 1);
    const lowSpendHighReturn = allCampaigns.filter((c) => c.spend > 10000 && c.roas > 10);

    // Campaign type breakdown
    const typeBreakdown: Record<string, { spend: number; conversions: number; roas: number; count: number }> = {};
    allCampaigns.forEach((c) => {
      const type = c.campaignType || "Unknown";
      if (!typeBreakdown[type]) typeBreakdown[type] = { spend: 0, conversions: 0, roas: 0, count: 0 };
      typeBreakdown[type].spend += c.spend;
      typeBreakdown[type].conversions += c.conversions;
      typeBreakdown[type].count++;
    });
    Object.values(typeBreakdown).forEach((t: any) => {
      t.roas = t.spend > 0 ? allCampaigns.filter(c => c.campaignType === Object.keys(typeBreakdown).find(k => typeBreakdown[k] === t)).reduce((s, c) => s + c.conversionValue, 0) / t.spend : 0;
    });

    // Monthly trends from the monthly CSV
    let monthlyTrends: any[] = [];
    try {
      const monthlyCsv = await fs.readFile(MONTHLY_CSV_PATH, "utf-8");
      const monthlyLines = monthlyCsv.split("\n").filter((l) => l.trim());
      if (monthlyLines.length > 3) {
        const monthlyHeaders = parseCSVLine(monthlyLines[2]);
        const mHeaderMap: Record<string, number> = {};
        monthlyHeaders.forEach((h, i) => { mHeaderMap[h.toLowerCase().trim()] = i; });

        const monthAgg: Record<string, { spend: number; clicks: number; impressions: number; conversions: number; convValue: number }> = {};

        for (let i = 3; i < monthlyLines.length; i++) {
          const values = parseCSVLine(monthlyLines[i]);
          if (values.length < 5) continue;

          const getVal = (name: string): string => {
            const idx = mHeaderMap[name.toLowerCase()];
            return idx !== undefined ? values[idx] || "" : "";
          };

          const month = getVal("month");
          if (!month) continue;

          if (!monthAgg[month]) monthAgg[month] = { spend: 0, clicks: 0, impressions: 0, conversions: 0, convValue: 0 };
          monthAgg[month].spend += parseNumber(getVal("cost"));
          monthAgg[month].clicks += parseNumber(getVal("clicks"));
          monthAgg[month].impressions += parseNumber(getVal("impr."));
          monthAgg[month].conversions += parseNumber(getVal("conversions"));
          monthAgg[month].convValue += parseNumber(getVal("conv. value"));
        }

        // Sort by date
        const monthOrder = Object.keys(monthAgg).sort((a, b) => {
          const da = new Date(a);
          const db = new Date(b);
          return da.getTime() - db.getTime();
        });

        monthlyTrends = monthOrder.map((month) => {
          const d = monthAgg[month];
          return {
            month,
            spend: d.spend,
            clicks: d.clicks,
            impressions: d.impressions,
            conversions: d.conversions,
            convValue: d.convValue,
            roas: d.spend > 0 ? d.convValue / d.spend : 0,
            cpa: d.conversions > 0 ? d.spend / d.conversions : 0,
            cpc: d.clicks > 0 ? d.spend / d.clicks : 0,
          };
        });
      }
    } catch {}

    return NextResponse.json({
      account: "AJIO LUXE",
      platform: "GOOGLE",
      period: "All Time",
      summary,
      campaigns,
      monthlyTrends,
      insights: {
        topPerformers,
        worstPerformers,
        highSpendLowReturn,
        lowSpendHighReturn,
        typeBreakdown,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
