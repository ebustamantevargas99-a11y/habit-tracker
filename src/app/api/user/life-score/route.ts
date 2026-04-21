import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { computeLifeScore } from "@/lib/scoring/life-score";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? undefined;
    const windowParam = searchParams.get("window");
    const windowDays = windowParam ? Math.min(30, Math.max(1, parseInt(windowParam, 10))) : 7;

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date debe ser YYYY-MM-DD" }, { status: 400 });
    }

    try {
      const result = await computeLifeScore(userId, { date, windowDays });
      return NextResponse.json(result);
    } catch (err) {
      console.error("[life-score] compute failed:", err);
      return NextResponse.json(
        { error: "Error calculando Life Score" },
        { status: 500 }
      );
    }
  });
}
