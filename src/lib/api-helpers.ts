import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Wraps a route handler with authentication check and error handling.
 * Passes the authenticated userId to the handler.
 */
export async function withAuth(
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return await handler(session.user.id);
  } catch (error) {
    console.error("API Error:", error);
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
