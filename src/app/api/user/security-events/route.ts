import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { getRecentEvents } from "@/lib/security-log";

// GET /api/user/security-events — actividad de seguridad del user
// Muestra logins, resets, exports, etc. para que pueda auditar su cuenta.
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 200);
    const events = await getRecentEvents(userId, limit);
    return NextResponse.json({ events });
  });
}
