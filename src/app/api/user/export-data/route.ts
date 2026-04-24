import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { logSecurityEvent } from "@/lib/security-log";

// GET /api/user/export-data — GDPR data portability
// Returns ALL data belonging to the authenticated user as JSON.
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    void logSecurityEvent({
      eventType: "data_exported",
      userId,
      request: req,
    });
    const [
      user,
      habits,
      habitLogs,
      workouts,
      personalRecords,
      bodyMetrics,
      weightLogs,
      stepsLogs,
      fastingSessions,
      challenges,
      trainingPrograms,
      readinessChecks,
      cardioSessions,
      shoes,
      bodyCompositions,
      transactions,
      budgets,
      financialAccounts,
      recurringTransactions,
      savingsGoals,
      debts,
      investments,
      pomodoroSessions,
      projects,
      foodItems,
      mealLogs,
      nutritionGoal,
      dailyPlans,
      badges,
      gamification,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
        },
      }),
      prisma.habit.findMany({ where: { userId } }),
      prisma.habitLog.findMany({ where: { userId } }),
      prisma.workout.findMany({
        where: { userId },
        include: { exercises: { include: { sets: true } } },
      }),
      prisma.personalRecord.findMany({ where: { userId } }),
      prisma.bodyMetric.findMany({ where: { userId } }),
      prisma.weightLog.findMany({ where: { userId } }),
      prisma.stepsLog.findMany({ where: { userId } }),
      prisma.fastingSession.findMany({ where: { userId } }),
      prisma.fitnessChallenge.findMany({ where: { userId } }),
      prisma.trainingProgram.findMany({ where: { userId }, include: { phases: true } }),
      prisma.readinessCheck.findMany({ where: { userId } }),
      prisma.cardioSession.findMany({ where: { userId } }),
      prisma.shoe.findMany({ where: { userId } }),
      prisma.bodyComposition.findMany({ where: { userId } }),
      prisma.transaction.findMany({ where: { userId } }),
      prisma.budget.findMany({ where: { userId } }),
      prisma.financialAccount.findMany({ where: { userId } }),
      prisma.recurringTransaction.findMany({ where: { userId } }),
      prisma.savingsGoal.findMany({ where: { userId } }),
      prisma.debt.findMany({ where: { userId } }),
      prisma.investment.findMany({ where: { userId } }),
      prisma.pomodoroSession.findMany({ where: { userId } }),
      prisma.project.findMany({
        where: { userId },
        include: { tasks: true },
      }),
      prisma.foodItem.findMany({ where: { userId } }),
      prisma.mealLog.findMany({
        where: { userId },
        include: { items: true },
      }),
      prisma.nutritionGoal.findUnique({ where: { userId } }),
      prisma.dailyPlan.findMany({
        where: { userId },
        include: { timeBlocks: true },
      }),
      prisma.userBadge.findMany({ where: { userId } }),
      prisma.gamification.findUnique({ where: { userId } }),
    ]);

    if (!user)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    logger.info("export-data:success", { userId });

    const exportedAt = new Date().toISOString();
    const payload = {
      exportedAt,
      version: "1.0",
      user,
      gamification,
      badges,
      habits,
      habitLogs,
      workouts,
      personalRecords,
      bodyMetrics,
      weightLogs,
      stepsLogs,
      fastingSessions,
      challenges,
      trainingPrograms,
      readinessChecks,
      cardioSessions,
      shoes,
      bodyCompositions,
      transactions,
      budgets,
      financialAccounts,
      recurringTransactions,
      savingsGoals,
      debts,
      investments,
      pomodoroSessions,
      projects,
      foodItems,
      mealLogs,
      nutritionGoal,
      dailyPlans,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="habit-tracker-export-${exportedAt.slice(0, 10)}.json"`,
      },
    });
  });
}
