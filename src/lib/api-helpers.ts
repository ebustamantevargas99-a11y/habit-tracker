import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { captureException } from "@/lib/sentry";

/**
 * Autentica via API key (header Authorization: Bearer ut_xxx o X-API-Key: ut_xxx).
 * Úsalo en rutas llamadas desde Scriptable / iOS Shortcuts.
 */
export async function withApiKeyAuth(
  req: NextRequest,
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  let userId: string | undefined;
  try {
    const header =
      req.headers.get("authorization") ?? req.headers.get("x-api-key");
    const key = header?.startsWith("Bearer ")
      ? header.slice(7).trim()
      : header?.trim();

    if (!key) {
      return NextResponse.json({ error: "API key requerida" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { apiKey: key },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "API key inválida" }, { status: 401 });
    }

    userId = user.id;
    return await handler(userId);
  } catch (error) {
    captureException(error, { user: userId ? { id: userId } : undefined });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * Wraps a route handler with authentication check and error handling.
 * Passes the authenticated userId to the handler.
 */
export async function withAuth(
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  let userId: string | undefined;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    userId = session.user.id;
    return await handler(userId);
  } catch (error) {
    // Reportar a Sentry/logger con contexto, pero NUNCA devolver el
    // mensaje crudo al cliente: un error de Prisma filtra nombres de
    // tabla/columna/constraints. Respuesta genérica siempre.
    captureException(error, { user: userId ? { id: userId } : undefined });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
