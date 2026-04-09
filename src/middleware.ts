import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // For development, allow all access
  // In production, uncomment the auth check below:
  //
  // const session = request.cookies.get("next-auth.session-token")?.value
  //   || request.cookies.get("__Secure-next-auth.session-token")?.value;
  //
  // if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
  //   return NextResponse.redirect(new URL("/signin", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
