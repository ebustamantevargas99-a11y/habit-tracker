import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

const PUBLIC_PATHS = ["/login", "/terms", "/privacy", "/cookies"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/monitoring")
  ) {
    return NextResponse.next();
  }

  if (!AUTH_SECRET) {
    console.error("[middleware] AUTH_SECRET/NEXTAUTH_SECRET is not set");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Let NextAuth auto-detect the secure cookie name based on the actual request
  // protocol. Hard-coding salt against NODE_ENV can misalign with how auth()
  // signed the cookie on /api/auth/callback/credentials.
  const token = await getToken({
    req: request,
    secret: AUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|manifest.json|apple-icon.png|.*\\..*).*)",
  ],
};
