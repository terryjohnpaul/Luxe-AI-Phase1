import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * GET /api/auth/google-ads/callback
 * Handles the OAuth callback from Google, exchanges code for refresh token,
 * and saves it to .env automatically.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error: `Google OAuth error: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No authorization code received" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET!;
  const redirectUri = "https://adsintelligence.sharozdawa.com/api/auth/google-ads/callback";

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "Token exchange failed", details: tokens }, { status: 400 });
    }

    const refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      return NextResponse.json({
        error: "No refresh token received. Try revoking app access at myaccount.google.com/permissions and retry.",
        tokens,
      }, { status: 400 });
    }

    // Save refresh token to .env file
    const envPath = path.resolve(process.cwd(), ".env");
    let envContent = await fs.readFile(envPath, "utf-8");
    
    if (envContent.includes("GOOGLE_ADS_REFRESH_TOKEN=")) {
      envContent = envContent.replace(
        /GOOGLE_ADS_REFRESH_TOKEN=.*/,
        `GOOGLE_ADS_REFRESH_TOKEN=${refreshToken}`
      );
    } else {
      envContent += `\nGOOGLE_ADS_REFRESH_TOKEN=${refreshToken}\n`;
    }

    await fs.writeFile(envPath, envContent);

    // Return success page
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head><title>Google Ads Connected</title></head>
      <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fff;">
        <div style="text-align: center; max-width: 500px;">
          <div style="font-size: 48px; margin-bottom: 16px;">&#10003;</div>
          <h1 style="font-size: 24px; margin-bottom: 8px;">Google Ads Connected!</h1>
          <p style="color: #888; margin-bottom: 24px;">Refresh token has been saved. The app needs a restart to pick it up.</p>
          <p style="font-size: 12px; color: #555;">Refresh Token: ${refreshToken.substring(0, 20)}...</p>
          <a href="/dashboard/settings" style="display: inline-block; margin-top: 16px; padding: 10px 24px; background: #3b82f6; color: white; border-radius: 8px; text-decoration: none;">Go to Settings</a>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to exchange token", details: err.message }, { status: 500 });
  }
}
