import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

/**
 * GET /api/auth/meta-ads/callback
 * Exchanges code for long-lived token, fetches all ad accounts,
 * and saves them to the ConnectedAccount table.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({
      error: `Facebook OAuth error: ${error}`,
      reason: searchParams.get("error_reason"),
      description: searchParams.get("error_description"),
    }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No authorization code received" }, { status: 400 });
  }

  const appId = process.env.META_ADS_APP_ID!;
  const appSecret = process.env.META_ADS_APP_SECRET!;
  const redirectUri = "https://adsintelligence.sharozdawa.com/api/auth/meta-ads/callback";

  try {
    // Step 1: Exchange code for short-lived token
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch(
      `https://graph.facebook.com/v25.0/oauth/access_token?${tokenParams.toString()}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      return NextResponse.json({
        error: "Failed to exchange code for token",
        details: tokenData.error || tokenData,
      }, { status: 400 });
    }

    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const longLivedRes = await fetch(
      `https://graph.facebook.com/v25.0/oauth/access_token?${longLivedParams.toString()}`
    );
    const longLivedData = await longLivedRes.json();

    const accessToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || 0;
    const tokenExpiresAt = expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    // Step 3: Fetch ALL ad accounts the user has access to
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v25.0/me/adaccounts?fields=id,name,account_status,currency,business_name&limit=100&access_token=${accessToken}`
    );
    const adAccountsData = await adAccountsRes.json();

    if (!adAccountsRes.ok || adAccountsData.error) {
      return NextResponse.json({
        error: "Failed to fetch ad accounts",
        details: adAccountsData.error || adAccountsData,
      }, { status: 400 });
    }

    const adAccounts = adAccountsData.data || [];
    const connectedAccounts: Array<{ id: string; name: string; accountId: string; currency: string }> = [];

    // Step 4: Upsert each ad account into the DB
    for (const acc of adAccounts) {
      // Meta returns id as "act_123456" — strip the "act_" prefix for accountId
      const accountId = acc.id.replace("act_", "");
      const accountName = acc.name || acc.business_name || `Ad Account ${accountId}`;
      const currency = acc.currency || "INR";
      const dbId = `acc_meta_${accountId}`;

      // Skip disabled/unsettled accounts
      if (acc.account_status === 3 || acc.account_status === 101) continue;

      try {
        await db.$executeRaw`
          INSERT INTO "ConnectedAccount" (id, platform, "accountId", "accountName", "accessToken", "tokenExpiresAt", currency, status, permissions, "connectedAt", "lastUsedAt")
          VALUES (${dbId}, 'META', ${accountId}, ${accountName}, ${accessToken}, ${tokenExpiresAt}, ${currency}, 'active', ARRAY['ads_read', 'ads_management', 'insights'], NOW(), NOW())
          ON CONFLICT (platform, "accountId") DO UPDATE SET
            "accessToken" = ${accessToken},
            "accountName" = ${accountName},
            "tokenExpiresAt" = ${tokenExpiresAt},
            status = 'active',
            "connectedAt" = NOW(),
            "lastUsedAt" = NOW()
        `;
        connectedAccounts.push({ id: dbId, name: accountName, accountId, currency });
      } catch (dbErr: any) {
        console.error(`[Meta OAuth] Failed to save account ${accountId}:`, dbErr.message);
      }
    }

    // Step 5: Return success page showing all connected accounts
    const accountListHtml = connectedAccounts.length > 0
      ? connectedAccounts.map(a =>
          `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#111;border-radius:8px;margin-bottom:6px;">
            <span style="color:#22c55e;font-size:18px;">&#10003;</span>
            <div>
              <p style="font-size:14px;margin:0;">${a.name}</p>
              <p style="font-size:11px;color:#888;margin:2px 0 0;">ID: ${a.accountId} &middot; ${a.currency}</p>
            </div>
          </div>`
        ).join("")
      : `<p style="color:#ef4444;">No accessible ad accounts found. Make sure your Facebook account has ad account access.</p>`;

    const expiryText = expiresIn > 0
      ? `Token expires in ${Math.round(expiresIn / 86400)} days`
      : "Token expiry unknown";

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head><title>Meta Ads Connected</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="font-family:system-ui,-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff;">
        <div style="max-width:480px;width:100%;padding:24px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:56px;height:56px;background:#22c55e20;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:28px;color:#22c55e;">&#10003;</div>
            <h1 style="font-size:22px;margin:0 0 4px;">Meta Ads Connected!</h1>
            <p style="color:#888;font-size:13px;margin:0;">Found ${connectedAccounts.length} ad account${connectedAccounts.length !== 1 ? 's' : ''} &middot; ${expiryText}</p>
          </div>
          <div style="margin-bottom:24px;">
            ${accountListHtml}
          </div>
          <a href="/dashboard/settings?connected=meta&accounts=${connectedAccounts.length}" style="display:block;text-align:center;padding:12px;background:#3b82f6;color:white;border-radius:10px;text-decoration:none;font-weight:500;font-size:14px;">
            Go to Settings
          </a>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    console.error("[Meta OAuth] Callback error:", err.message);
    return NextResponse.json({ error: "Failed to complete OAuth", details: err.message }, { status: 500 });
  }
}
