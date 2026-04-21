import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Try DB first
    const dbAccounts: any[] = await db.$queryRaw`
      SELECT id, platform, "accountId", "accountName"
      FROM "ConnectedAccount"
      WHERE status = 'active' AND platform = 'META'
      ORDER BY "connectedAt" ASC
    `;

    if (dbAccounts && dbAccounts.length > 0) {
      const accounts = dbAccounts.map((a: any) => {
        // Derive a short ID for backward compatibility with the campaigns route
        let shortId = a.id;
        if (a.accountId === "202330961584003") shortId = "ajio";
        else if (a.accountId === "1681306899957928") shortId = "luxeai";
        else shortId = a.id.replace("acc_meta_", "");

        return {
          id: shortId,
          name: a.accountName,
          accountId: a.accountId,
          platform: a.platform,
        };
      });
      return NextResponse.json({ accounts });
    }
  } catch (err: any) {
    console.error("[Campaigns Accounts] DB query failed, falling back to env:", err.message);
  }

  // Fallback to .env
  const accounts = [];

  if (process.env.AJIO_LUXE_META_ACCESS_TOKEN && process.env.AJIO_LUXE_META_ACCOUNT_ID) {
    accounts.push({
      id: "ajio",
      name: "Ajio Luxe",
      accountId: process.env.AJIO_LUXE_META_ACCOUNT_ID,
      platform: "META",
    });
  }

  if (process.env.META_ADS_ACCESS_TOKEN && process.env.META_ADS_ACCOUNT_ID) {
    accounts.push({
      id: "luxeai",
      name: "Luxe AI Ads",
      accountId: process.env.META_ADS_ACCOUNT_ID,
      platform: "META",
    });
  }

  return NextResponse.json({ accounts });
}
