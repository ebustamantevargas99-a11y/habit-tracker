import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { appBaseUrl } from "@/lib/app-url";

const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

const PUBLIC_PATHS = ["/login", "/terms", "/privacy", "/cookies"];

// ─── CORS para wrappers nativos ──────────────────────────────────────────
// Patrones de Origin permitidos para hacer requests al backend desde
// Capacitor (iOS/Android) y Tauri (Mac/Windows/Linux). El dominio web
// principal se permite también (same-origin) leyendo appBaseUrl().
const NATIVE_ORIGIN_PATTERNS: RegExp[] = [
  /^capacitor:\/\/localhost$/,                  // iOS Capacitor
  /^https?:\/\/localhost(:\d+)?$/,              // Android Capacitor + dev local
  /^tauri:\/\/localhost$/,                      // Tauri Mac/Linux
  /^https?:\/\/tauri\.localhost$/,              // Tauri Windows
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,           // Variantes local
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  // Same-origin: el dominio web propio.
  try {
    if (origin === appBaseUrl()) return true;
  } catch {
    // appBaseUrl() puede fallar si no hay config — permitir patterns igual.
  }
  return NATIVE_ORIGIN_PATTERNS.some((p) => p.test(origin));
}

function setCorsHeaders(res: NextResponse, origin: string): void {
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
  );
  res.headers.set("Access-Control-Max-Age", "86400");
  // Vary asegura que cachés intermedios no mezclen respuestas entre orígenes.
  res.headers.set("Vary", "Origin");
}

function handleApiCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const allowed = isAllowedOrigin(origin);

  // Preflight: responder de inmediato con headers CORS y 204.
  if (request.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (allowed && origin) setCorsHeaders(res, origin);
    return res;
  }

  // Request normal: passthrough con headers añadidos si el origin está
  // permitido. Devolver null indica que el caller debe seguir al
  // siguiente middleware (no es responsabilidad de CORS rutear).
  if (allowed && origin) {
    const res = NextResponse.next();
    setCorsHeaders(res, origin);
    return res;
  }
  return null;
}

// ─── Middleware principal ────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CORS para /api/* — manejar primero antes que cualquier auth check
  //    para que los wrappers nativos puedan hacer preflights.
  if (pathname.startsWith("/api/")) {
    const corsResponse = handleApiCors(request);
    if (corsResponse) return corsResponse;
    // Sin origin / origin no permitido → seguir con flow normal (Next.js
    // delega al route handler que aplica withAuth si corresponde).
    return NextResponse.next();
  }

  // 2. Paths públicos (legales + login + monitoring)
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/monitoring")
  ) {
    return NextResponse.next();
  }

  // 3. Auth check para todas las demás páginas
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
    // Excluye assets estáticos pero INCLUYE /api/* para que el bloque
    // CORS de arriba pueda manejar requests desde wrappers nativos.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|apple-icon.png|robots.txt|.*\\..*).*)",
  ],
};
