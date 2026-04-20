import { NextResponse } from "next/server";

/**
 * GET /api/auth/meta-ads
 * Redirects user to Facebook OAuth to authorize ads management.
 */
export async function GET() {
  const appId = process.env.META_ADS_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "META_ADS_APP_ID not configured" }, { status: 500 });
  }

  const redirectUri = "https://adsintelligence.sharozdawa.com/api/auth/meta-ads/callback";
  const scopes = "ads_management,ads_read,business_management,read_insights";

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: "code",
    auth_type: "rerequest",
  });

  const authUrl = `https://www.facebook.com/v25.0/dialog/oauth?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
