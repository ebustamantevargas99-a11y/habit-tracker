import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import {
  computeLifeScore,
  getLifeScoreHistory,
  type LifeScorePoint,
} from "@/lib/scoring/life-score";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? undefined;
    const windowParam = searchParams.get("window");
    const historyParam = searchParams.get("history");
    const windowDays = windowParam
      ? Math.min(30, Math.max(1, parseInt(windowParam, 10)))
      : 7;
    const historyDays = historyParam
      ? Math.min(180, Math.max(1, parseInt(historyParam, 10)))
      : 0;

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date debe ser YYYY-MM-DD" }, { status: 400 });
    }

    try {
      const current = await computeLifeScore(userId, { date, windowDays });

      let history: LifeScorePoint[] | undefined;
      if (historyDays > 0) {
        history = await getLifeScoreHistory(userId, historyDays);
      }

      return NextResponse.json({ ...current, history });
    } catch (err) {
      console.error("[life-score] compute failed:", err);
      return NextResponse.json(
        { error: "Error calculando Life Score" },
        { status: 500 }
      );
    }
  });
}
