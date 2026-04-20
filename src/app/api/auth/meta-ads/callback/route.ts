import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * GET /api/auth/meta-ads/callback
 * Exchanges code for short-lived token, then exchanges for long-lived token,
 * and saves it to .env.
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

    // Step 2: Exchange short-lived token for long-lived token (60 days)
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
    const expiresIn = longLivedData.expires_in || "unknown";

    // Step 3: Verify token by fetching ad account info
    const verifyRes = await fetch(
      `https://graph.facebook.com/v25.0/act_${process.env.META_ADS_ACCOUNT_ID}?fields=name,account_status,currency&access_token=${accessToken}`
    );
    const verifyData = await verifyRes.json();

    // Step 4: Save token to .env
    const envPath = path.resolve(process.cwd(), ".env");
    let envContent = await fs.readFile(envPath, "utf-8");

    if (envContent.includes("META_ADS_ACCESS_TOKEN=")) {
      envContent = envContent.replace(
        /META_ADS_ACCESS_TOKEN=.*/,
        `META_ADS_ACCESS_TOKEN=${accessToken}`
      );
    } else {
      envContent += `\nMETA_ADS_ACCESS_TOKEN=${accessToken}\n`;
    }

    await fs.writeFile(envPath, envContent);

    // Return success page
    const accountName = verifyData.name || "Unknown";
    const currency = verifyData.currency || "N/A";

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head><title>Meta Ads Connected</title></head>
      <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fff;">
        <div style="text-align: center; max-width: 500px;">
          <div style="font-size: 48px; margin-bottom: 16px;">&#10003;</div>
          <h1 style="font-size: 24px; margin-bottom: 8px;">Meta Ads Connected!</h1>
          <p style="color: #888; margin-bottom: 16px;">Long-lived token saved (expires in ${Math.round(Number(expiresIn) / 86400)} days).</p>
          <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; text-align: left; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #888; margin: 4px 0;">Account: <span style="color: #fff;">${accountName}</span></p>
            <p style="font-size: 12px; color: #888; margin: 4px 0;">Currency: <span style="color: #fff;">${currency}</span></p>
            <p style="font-size: 12px; color: #888; margin: 4px 0;">Token: <span style="color: #555;">${accessToken.substring(0, 20)}...</span></p>
          </div>
          <a href="/dashboard/settings" style="display: inline-block; padding: 10px 24px; background: #3b82f6; color: white; border-radius: 8px; text-decoration: none;">Go to Settings</a>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to exchange token", details: err.message }, { status: 500 });
  }
}
