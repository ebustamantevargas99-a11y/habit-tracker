import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { captureException } from "@/lib/sentry";

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
