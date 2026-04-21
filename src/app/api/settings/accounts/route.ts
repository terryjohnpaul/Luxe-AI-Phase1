import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Auto-set default: if only 1 account per platform, make it default
    try {
      await db.$executeRawUnsafe(`UPDATE "ConnectedAccount" ca SET "isDefault" = true WHERE ca.status = 'active' AND ca."isDefault" = false AND (SELECT COUNT(*) FROM "ConnectedAccount" c2 WHERE c2.platform = ca.platform AND c2.status = 'active') = 1 AND NOT EXISTS (SELECT 1 FROM "ConnectedAccount" c3 WHERE c3.platform = ca.platform AND c3."isDefault" = true AND c3.status = 'active')`);
    } catch {}

    const accounts = await db.$queryRaw`
      SELECT id, platform, "accountId", "accountName", currency, status, permissions, "connectedAt", "lastUsedAt", "isDefault"
      FROM "ConnectedAccount"
      WHERE status != 'disconnected'
      ORDER BY "isDefault" DESC, "connectedAt" ASC
    `;
    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error("[Settings Accounts] Failed to fetch accounts:", error.message);
    return NextResponse.json({ accounts: [], error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { accountId } = await request.json();
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }
    const account: any[] = await db.$queryRaw`SELECT platform FROM "ConnectedAccount" WHERE id = ${accountId}`;
    if (!account.length) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    const platform = account[0].platform;
    await db.$executeRaw`UPDATE "ConnectedAccount" SET "isDefault" = false WHERE platform = ${platform}`;
    await db.$executeRaw`UPDATE "ConnectedAccount" SET "isDefault" = true WHERE id = ${accountId}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Settings Accounts] Failed to set default:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { accountId } = await request.json();
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }
    await db.$executeRaw`UPDATE "ConnectedAccount" SET status = 'disconnected' WHERE id = ${accountId}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Settings Accounts] Failed to disconnect:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
