import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth session from cookie
  const session = request.cookies.get("pos_session")?.value;

  // Protected dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // If logged in, redirect from login pages to dashboard
  if ((pathname === "/" || pathname === "/admin-login") && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin-login", "/dashboard/:path*"],
};
