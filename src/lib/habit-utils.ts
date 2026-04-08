import { prisma } from "@/lib/prisma";

/**
 * Recalculates streakCurrent and streakBest for a habit based on its logs.
 * Iterates backwards from today through all target days.
 */
export async function recalculateStreak(
  habitId: string,
  targetDays: number[]
): Promise<{ streakCurrent: number; streakBest: number }> {
  const logs = await prisma.habitLog.findMany({
    where: { habitId },
    orderBy: { date: "desc" },
    take: 730,
    select: { date: true, completed: true },
  });

  const logMap = new Map(logs.map((l) => [l.date, l.completed]));
  const today = new Date();
  // Treat empty targetDays as all days (daily habit with missing data)
  const activeDays = targetDays.length > 0 ? targetDays : [0, 1, 2, 3, 4, 5, 6];

  const streaks: number[] = [];
  let tempStreak = 0;

  for (let i = 0; i < 730; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();

    const completed = logMap.get(dateStr);

    if (completed === true) {
      // Always count a completed log, even on off-schedule days
      tempStreak++;
    } else if (!activeDays.includes(dayOfWeek)) {
      // Unscheduled day with no completion — skip, don't break streak
      continue;
    } else if (i === 0 && completed === undefined) {
      // Today is scheduled but not yet logged — don't break streak
      continue;
    } else {
      // Scheduled day with no/false completion — break streak
      if (tempStreak > 0) {
        streaks.push(tempStreak);
        tempStreak = 0;
      }
    }
  }

  if (tempStreak > 0) streaks.push(tempStreak);

  const streakCurrent = streaks[0] ?? 0;
  const streakBest = streaks.length > 0 ? Math.max(...streaks) : 0;

  return { streakCurrent, streakBest };
}
