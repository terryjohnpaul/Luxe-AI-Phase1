import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";

const META_API = "https://graph.facebook.com/v25.0";
const CACHE_KEY = "campaigns:live:meta";
const CACHE_TTL = 300; // 5 minutes

// ── Timeout helper ──────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// ── Account resolver ────────────────────────────────────────────
async function resolveAccount(account: string) {
  // Map short account IDs to Meta account IDs for DB lookup
  const accountIdMap: Record<string, string> = {
    ajio: "202330961584003",
    luxeai: "1681306899957928",
  };
  const targetAccountId = accountIdMap[account];

  // Try to resolve from ConnectedAccount DB first (5s timeout to avoid hanging)
  try {
    const query = targetAccountId
      ? db.$queryRaw`SELECT "accountId", "accountName", "accessToken" FROM "ConnectedAccount" WHERE status = 'active' AND platform = 'META' AND "accountId" = ${targetAccountId} LIMIT 1`
      : db.$queryRaw`SELECT "accountId", "accountName", "accessToken" FROM "ConnectedAccount" WHERE status = 'active' AND platform = 'META' AND "accountId" = ${account} LIMIT 1`;

    const dbAccounts: any[] = await withTimeout(query, 5000, []);
    if (dbAccounts && dbAccounts.length > 0) {
      const acc = dbAccounts[0];
      return {
        token: acc.accessToken,
        accountId: acc.accountId,
        accountName: acc.accountName,
        tokenEnvName: "DB:ConnectedAccount",
      };
    }
  } catch (err: any) {
    console.error('[Campaigns] DB account resolve failed, using env fallback:', err.message);
  }

  // Fallback to .env
  if (account === "luxeai") {
    return {
      token: process.env.META_ADS_ACCESS_TOKEN,
      accountId: process.env.META_ADS_ACCOUNT_ID || "1681306899957928",
      accountName: "Luxe AI Ads",
      tokenEnvName: "META_ADS_ACCESS_TOKEN",
    };
  }
  return {
    token: process.env.AJIO_LUXE_META_ACCESS_TOKEN,
    accountId: process.env.AJIO_LUXE_META_ACCOUNT_ID || "202330961584003",
    accountName: "Ajio Luxe",
    tokenEnvName: "AJIO_LUXE_META_ACCESS_TOKEN",
  };
}

// ── Helpers ─────────────────────────────────────────────────────

function deriveCampaignType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("pmax") || n.includes("performance max")) return "PMax";
  if (n.includes("shopping")) return "Shopping";
  if (n.includes("search")) return "Search";
  if (n.includes("dpa") || n.includes("dynamic product")) return "DPA";
  if (n.includes("retarget") || n.includes("remarketing") || n.includes("rtml")) return "Retargeting";
  if (n.includes("prospecting") || n.includes("prosp")) return "Prospecting";
  if (n.includes("brand") || n.includes("branding")) return "Brand";
  if (n.includes("video") || n.includes("reel")) return "Video";
  if (n.includes("display")) return "Display";
  if (n.includes("catalog") || n.includes("catalogue")) return "Catalog";
  if (n.includes("aso") || n.includes("advantage+") || n.includes("asc")) return "ASC";
  if (n.includes("awareness")) return "Awareness";
  if (n.includes("engagement")) return "Engagement";
  if (n.includes("traffic")) return "Traffic";
  if (n.includes("lead")) return "Leads";
  return "";
}

async function fetchAllPages(url: string): Promise<any[]> {
  const all: any[] = [];
  let nextUrl: string | null = url;
  while (nextUrl) {
    const res: Response = await fetch(nextUrl);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Meta API ${res.status}: ${err}`);
    }
    const json = await res.json();
    if (json.data) all.push(...json.data);
    nextUrl = json.paging?.next || null;
  }
  return all;
}

interface MergedCampaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  objective: string;
  campaignType: string;
  dailyBudget: number;
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    conversionValue: number;
    roas: number;
    cpa: number;
  };
}

async function fetchLiveMetaCampaigns(token: string, accountId: string, statusFilter?: string): Promise<MergedCampaign[]> {
  // Build status filter for Meta API
  const statuses = statusFilter && statusFilter !== "all"
    ? [statusFilter.toUpperCase()]
    : ["ACTIVE", "PAUSED"];

  const filterJSON = JSON.stringify([
    { field: "effective_status", operator: "IN", value: statuses },
  ]);

  // Step 1: Fetch campaigns
  const campaignsUrl =
    `${META_API}/act_${accountId}/campaigns` +
    `?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time,start_time,stop_time` +
    `&filtering=${encodeURIComponent(filterJSON)}` +
    `&limit=100` +
    `&access_token=${token}`;

  // Step 2: Fetch insights (no effective_status filter — insights endpoint doesn't support it)
  const insightsUrl =
    `${META_API}/act_${accountId}/insights` +
    `?fields=campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas,frequency,reach` +
    `&level=campaign` +
    `&date_preset=last_7d` +
    `&limit=500` +
    `&access_token=${token}`;

  const [campaigns, insights] = await Promise.all([
    fetchAllPages(campaignsUrl),
    fetchAllPages(insightsUrl),
  ]);

  // Build insights lookup by campaign_id
  const insightsMap = new Map<string, any>();
  for (const row of insights) {
    insightsMap.set(row.campaign_id, row);
  }

  // Step 3: Merge
  return campaigns.map((c: any) => {
    const ins = insightsMap.get(c.id);

    let conversions = 0;
    let conversionValue = 0;

    if (ins?.actions) {
      for (const a of ins.actions) {
        if (a.action_type === "purchase" || a.action_type === "omni_purchase") {
          conversions += parseFloat(a.value) || 0;
        }
      }
    }
    if (ins?.action_values) {
      for (const a of ins.action_values) {
        if (a.action_type === "purchase" || a.action_type === "omni_purchase") {
          conversionValue += parseFloat(a.value) || 0;
        }
      }
    }

    const spend = parseFloat(ins?.spend) || 0;
    const impressions = parseInt(ins?.impressions) || 0;
    const clicks = parseInt(ins?.clicks) || 0;
    const ctr = parseFloat(ins?.ctr) || 0;
    const cpc = parseFloat(ins?.cpc) || 0;
    const roas = ins?.purchase_roas?.[0]?.value ? parseFloat(ins.purchase_roas[0].value) : (spend > 0 ? conversionValue / spend : 0);
    const cpa = conversions > 0 ? spend / conversions : 0;

    const dailyBudgetRaw = parseInt(c.daily_budget) || 0;

    return {
      id: c.id,
      name: c.name,
      platform: "META",
      status: c.status === "ACTIVE" ? "ACTIVE" : "PAUSED",
      objective: c.objective || "",
      campaignType: deriveCampaignType(c.name),
      dailyBudget: dailyBudgetRaw / 100,
      metrics: {
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        conversions,
        conversionValue,
        roas,
        cpa,
      },
    };
  });
}

// ── GET handler ─────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get("account") || "ajio";
  const statusFilter = searchParams.get("status") || "all";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const sortBy = searchParams.get("sortBy") || "spend";
  const sortDir = searchParams.get("sortDir") || "desc";

  const { token, accountId, accountName, tokenEnvName } = await resolveAccount(account);

  try {
    let allCampaigns: MergedCampaign[];

    // Try cache first (with 3s timeout to avoid hanging on broken Redis)
    const cacheKey = `${CACHE_KEY}:${account}:${statusFilter}`;
    const cached = await Promise.race([
      redis.get(cacheKey).catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);

    if (cached) {
      allCampaigns = JSON.parse(cached);
    } else {
      if (!token) throw new Error(`${tokenEnvName} not set`);

      // Fetch live from Meta API
      allCampaigns = await fetchLiveMetaCampaigns(token, accountId, statusFilter);

      // Cache for 5 minutes (fire-and-forget with timeout)
      Promise.race([
        redis.set(cacheKey, JSON.stringify(allCampaigns), "EX", CACHE_TTL).catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }

    // Client-side filtering: search
    let filtered = allCampaigns;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }

    // Sort
    const validSorts = ["spend", "roas", "conversions", "cpa", "ctr", "impressions", "clicks", "cpc"];
    const sortField = validSorts.includes(sortBy) ? sortBy : "spend";
    filtered.sort((a, b) => {
      const aVal = (a.metrics as any)[sortField] || 0;
      const bVal = (b.metrics as any)[sortField] || 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    // Stats (computed before pagination)
    const total = filtered.length;
    const activeCount = filtered.filter((c) => c.status === "ACTIVE").length;
    const pausedCount = filtered.filter((c) => c.status === "PAUSED").length;
    const totalSpend = filtered.reduce((s, c) => s + c.metrics.spend, 0);
    const totalPages = Math.ceil(total / limit);

    // Paginate
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      campaigns: paginated,
      stats: {
        total,
        meta: total,
        google: 0,
        active: activeCount,
        paused: pausedCount,
        totalSpend,
        totalPages,
        accountName,
        accountId,
      },
    });
  } catch (error: any) {
    console.error("[Campaigns API] Meta API failed, falling back to DB:", error.message);

    // ── Fallback to database ──────────────────────────────────
    try {
      const where: any = {};
      if (statusFilter && statusFilter !== "all") where.status = statusFilter.toUpperCase();
      if (search) where.name = { contains: search, mode: "insensitive" };

      const total = await db.campaign.count({ where });
      const campaigns = await db.campaign.findMany({
        where,
        include: { metrics: { orderBy: { date: "desc" }, take: 30 } },
        skip: (page - 1) * limit,
        take: limit,
      });

      const result = campaigns.map((c: any) => {
        const totalSpend = c.metrics.reduce((s: number, m: any) => s + m.spend, 0);
        const totalImpressions = c.metrics.reduce((s: number, m: any) => s + m.impressions, 0);
        const totalClicks = c.metrics.reduce((s: number, m: any) => s + m.clicks, 0);
        const totalConversions = c.metrics.reduce((s: number, m: any) => s + m.conversions, 0);
        const totalConvValue = c.metrics.reduce((s: number, m: any) => s + m.conversionValue, 0);
        return {
          id: c.externalId,
          name: c.name,
          platform: c.platform,
          status: c.status,
          objective: c.objective || "",
          campaignType: c.campaignType || "",
          dailyBudget: c.dailyBudget || 0,
          metrics: {
            spend: totalSpend,
            impressions: totalImpressions,
            clicks: totalClicks,
            ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0,
            cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
            conversions: totalConversions,
            conversionValue: totalConvValue,
            roas: totalSpend > 0 ? totalConvValue / totalSpend : 0,
            cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
          },
        };
      });

      const activeCount = await db.campaign.count({ where: { ...where, status: "ACTIVE" } });
      const pausedCount = await db.campaign.count({ where: { ...where, status: "PAUSED" } });

      return NextResponse.json({
        campaigns: result,
        stats: {
          total,
          meta: total,
          google: 0,
          active: activeCount,
          paused: pausedCount,
          totalSpend: 0,
          totalPages: Math.ceil(total / limit),
          accountName,
          accountId,
        },
        _source: "database_fallback",
      });
    } catch (dbError: any) {
      console.error("[Campaigns API] DB fallback also failed:", dbError.message);
      return NextResponse.json(
        { campaigns: [], stats: { total: 0, meta: 0, google: 0, active: 0, paused: 0, totalSpend: 0, totalPages: 0, accountName, accountId }, error: error.message },
        { status: 500 }
      );
    }
  }
}
