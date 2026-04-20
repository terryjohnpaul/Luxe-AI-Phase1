import { NextResponse } from "next/server";

/**
 * GET /api/auth/google-ads
 * Redirects user to Google OAuth consent screen to authorize Google Ads access.
 */
export async function GET() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_ADS_CLIENT_ID not configured" }, { status: 500 });
  }

  const redirectUri = "https://adsintelligence.sharozdawa.com/api/auth/google-ads/callback";
  const scope = "https://www.googleapis.com/auth/adwords";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
