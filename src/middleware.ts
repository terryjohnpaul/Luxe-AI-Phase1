import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_USER = process.env.BASIC_AUTH_USER || "admin";
const AUTH_PASS = process.env.BASIC_AUTH_PASS || "luxeai2026";

export function middleware(request: NextRequest) {
  // Skip auth for static assets
  if (request.nextUrl.pathname.startsWith("/_next")) return NextResponse.next();

  const auth = request.headers.get("authorization");

  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      try {
        const decoded = atob(encoded);
        const [user, pass] = decoded.split(":");
        if (user === AUTH_USER && pass === AUTH_PASS) {
          return NextResponse.next();
        }
      } catch {}
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="LUXE AI"' },
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/"],
};
