import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/wellness/medications/logs?days=N
// Returns ALL medication logs for the authenticated user within the last N days.
// Replaces the N+1 pattern of calling /medications/[id]/logs per medication.
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get("days") ?? "7"), 365);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const logs = await prisma.medicationLog.findMany({
      where: {
        userId,
        date: { gte: cutoff.toISOString().split("T")[0] },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(logs);
  });
}
