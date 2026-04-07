import { LEVELS } from "@/lib/constants";

export function getLevelForXP(xp: number) {
  let level = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      level = i + 1;
      break;
    }
  }
  const currentLevelXP = LEVELS[level - 1]?.xpRequired ?? 0;
  const nextLevelXP = LEVELS[level]?.xpRequired ?? LEVELS[LEVELS.length - 1].xpRequired + 1000;
  const progress = Math.min(
    100,
    Math.round(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
  );
  return {
    level,
    name: LEVELS[level - 1]?.name ?? "Ultimate",
    xpForNext: nextLevelXP,
    progress,
  };
}

type PrismaClient = import("@prisma/client").PrismaClient;

/** Award XP to a user and update their gamification record */
export async function awardXP(prisma: PrismaClient, userId: string, amount: number) {
  return prisma.gamification.upsert({
    where: { userId },
    create: { userId, totalXP: amount },
    update: { totalXP: { increment: amount } },
  });
}

/**
 * Award a badge (idempotent — does nothing if already earned).
 * Returns true if the badge was newly awarded.
 */
export async function awardBadge(
  prisma: PrismaClient,
  userId: string,
  badgeId: string
): Promise<boolean> {
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });
  if (existing) return false;
  await prisma.userBadge.create({ data: { userId, badgeId, earnedDate: new Date() } });
  return true;
}

/**
 * Check and award the "first-step" badge if this is the user's first completed habit log.
 */
export async function checkFirstStepBadge(prisma: PrismaClient, userId: string) {
  const count = await prisma.habitLog.count({ where: { userId, completed: true } });
  if (count === 1) {
    await awardBadge(prisma, userId, "first-step");
  }
}

/**
 * Check streak-based badges and award the appropriate XP bonus.
 * Call this after recalculating streaks with the new streakCurrent value.
 */
export async function checkStreakBadges(
  prisma: PrismaClient,
  userId: string,
  streakCurrent: number
) {
  if (streakCurrent === 7) {
    await awardXP(prisma, userId, 50); // XP_REWARDS.streak7
    await awardBadge(prisma, userId, "week-warrior");
  }
  if (streakCurrent === 30) {
    await awardXP(prisma, userId, 200); // XP_REWARDS.streak30
    await awardBadge(prisma, userId, "monthly-master");
  }
  if (streakCurrent === 100) {
    await awardBadge(prisma, userId, "iron-will");
  }
}

/**
 * Check the "pr-hunter" badge: awarded when total PRs hit across all workouts reaches 10.
 */
export async function checkPRHunterBadge(prisma: PrismaClient, userId: string) {
  const result = await prisma.workout.aggregate({
    where: { userId },
    _sum: { prsHit: true },
  });
  const total = result._sum.prsHit ?? 0;
  if (total >= 10) {
    await awardBadge(prisma, userId, "pr-hunter");
  }
}
