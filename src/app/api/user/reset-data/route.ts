import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, resetDataSchema, type ResetScope } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { logSecurityEvent } from "@/lib/security-log";

/**
 * POST /api/user/reset-data
 *
 * Borra datos del user por categoría o TODO.
 * Requiere confirmación explícita: body.confirmation === "RESETEAR".
 *
 * Invariantes:
 *   - NO borra: User, UserProfile, Account, Session, auth tokens, SecurityEvent
 *   - Aprovecha onDelete: Cascade de FKs para modelos hijos
 *   - "gamification" resetea en vez de borrar (nivel 1, 0 XP)
 *   - "all" ejecuta todos los demás scopes + reset gamification
 *
 * Responde con `{ ok: true, scope, counts: { <modelo>: deletedCount } }`.
 */

type DeleteCounts = Record<string, number>;

async function resetHabits(userId: string, counts: DeleteCounts) {
  // HabitLog tiene FK a Habit con Cascade, pero también tiene userId directo.
  // Borramos ambos por seguridad.
  const logs = await prisma.habitLog.deleteMany({ where: { userId } });
  const habits = await prisma.habit.deleteMany({ where: { userId } });
  counts.habitLogs = logs.count;
  counts.habits = habits.count;
}

async function resetFitness(userId: string, counts: DeleteCounts) {
  // WorkoutExercise y WorkoutSet caen en cascade con Workout
  const workouts = await prisma.workout.deleteMany({ where: { userId } });
  const prs = await prisma.personalRecord.deleteMany({ where: { userId } });
  const bodyMetrics = await prisma.bodyMetric.deleteMany({ where: { userId } });
  const weights = await prisma.weightLog.deleteMany({ where: { userId } });
  const steps = await prisma.stepsLog.deleteMany({ where: { userId } });
  const challenges = await prisma.fitnessChallenge.deleteMany({ where: { userId } });
  // Program phases caen con TrainingProgram por FK
  const programs = await prisma.trainingProgram.deleteMany({ where: { userId } });
  const readiness = await prisma.readinessCheck.deleteMany({ where: { userId } });
  const bodyComp = await prisma.bodyComposition.deleteMany({ where: { userId } });
  const photos = await prisma.bodyPhoto.deleteMany({ where: { userId } });
  // Fasting y Meditation sobrevivieron al drop de lifeos; los agrupamos en fitness
  // para que queden cubiertos por el wipe completo.
  const fasting = await prisma.fastingSession.deleteMany({ where: { userId } });
  const meditation = await prisma.meditationSession.deleteMany({ where: { userId } });
  counts.workouts = workouts.count;
  counts.personalRecords = prs.count;
  counts.bodyMetrics = bodyMetrics.count;
  counts.weightLogs = weights.count;
  counts.stepsLogs = steps.count;
  counts.fitnessChallenges = challenges.count;
  counts.trainingPrograms = programs.count;
  counts.readinessChecks = readiness.count;
  counts.bodyCompositions = bodyComp.count;
  counts.bodyPhotos = photos.count;
  counts.fastingSessions = fasting.count;
  counts.meditationSessions = meditation.count;
}

async function resetCardio(userId: string, counts: DeleteCounts) {
  // Cardio aparte para poder borrar corridas sin perder fuerza
  const cardio = await prisma.cardioSession.deleteMany({ where: { userId } });
  const shoes = await prisma.shoe.deleteMany({ where: { userId } });
  counts.cardioSessions = cardio.count;
  counts.shoes = shoes.count;
}

async function resetFinance(userId: string, counts: DeleteCounts) {
  // Cascades: Transaction está en FinancialAccount, pero la FK usa SetNull.
  // Borramos Transaction primero, luego Budget/Recurring/etc.
  const transactions = await prisma.transaction.deleteMany({ where: { userId } });
  const budgets = await prisma.budget.deleteMany({ where: { userId } });
  const recurring = await prisma.recurringTransaction.deleteMany({ where: { userId } });
  const goals = await prisma.savingsGoal.deleteMany({ where: { userId } });
  const debts = await prisma.debt.deleteMany({ where: { userId } });
  const investments = await prisma.investment.deleteMany({ where: { userId } });
  const accounts = await prisma.financialAccount.deleteMany({ where: { userId } });
  const netWorth = await prisma.netWorthSnapshot.deleteMany({ where: { userId } });
  counts.transactions = transactions.count;
  counts.budgets = budgets.count;
  counts.recurringTransactions = recurring.count;
  counts.savingsGoals = goals.count;
  counts.debts = debts.count;
  counts.investments = investments.count;
  counts.financialAccounts = accounts.count;
  counts.netWorthSnapshots = netWorth.count;
}

async function resetNutrition(userId: string, counts: DeleteCounts) {
  // MealItem cae con MealLog, RecipeItem con Recipe (cascade)
  const meals = await prisma.mealLog.deleteMany({ where: { userId } });
  const templates = await prisma.mealTemplate.deleteMany({ where: { userId } });
  const recipes = await prisma.recipe.deleteMany({ where: { userId } });
  const foods = await prisma.foodItem.deleteMany({ where: { userId } });
  // NutritionGoal es único por user; lo borramos también
  const goal = await prisma.nutritionGoal.deleteMany({ where: { userId } });
  counts.mealLogs = meals.count;
  counts.mealTemplates = templates.count;
  counts.recipes = recipes.count;
  counts.foodItems = foods.count;
  counts.nutritionGoals = goal.count;
}

async function resetProductivity(userId: string, counts: DeleteCounts) {
  // ProjectSubtask y ProjectTask caen con Project
  const projects = await prisma.project.deleteMany({ where: { userId } });
  const pomodoros = await prisma.pomodoroSession.deleteMany({ where: { userId } });
  // TimeBlock cae con DailyPlan
  const plans = await prisma.dailyPlan.deleteMany({ where: { userId } });
  // Deep Work sessions viven en Productividad
  const focus = await prisma.focusSession.deleteMany({ where: { userId } });
  counts.projects = projects.count;
  counts.pomodoroSessions = pomodoros.count;
  counts.dailyPlans = plans.count;
  counts.focusSessions = focus.count;
}

async function resetOrganization(userId: string, counts: DeleteCounts) {
  const notes = await prisma.note.deleteMany({ where: { userId } });
  const lifeAreas = await prisma.lifeArea.deleteMany({ where: { userId } });
  const reviews = await prisma.weeklyReview.deleteMany({ where: { userId } });
  counts.notes = notes.count;
  counts.lifeAreas = lifeAreas.count;
  counts.weeklyReviews = reviews.count;
}

async function resetCalendar(userId: string, counts: DeleteCounts) {
  // Eventos: CalendarGroup tiene FK desde CalendarEvent con SetNull,
  // así que los eventos sobreviven al borrar grupos. Aquí borramos TODO.
  const events = await prisma.calendarEvent.deleteMany({ where: { userId } });
  const groups = await prisma.calendarGroup.deleteMany({ where: { userId } });
  const templates = await prisma.dayTemplate.deleteMany({ where: { userId } });
  counts.calendarEvents = events.count;
  counts.calendarGroups = groups.count;
  counts.dayTemplates = templates.count;
}

async function resetReading(userId: string, counts: DeleteCounts) {
  // ReadingSession cae con Book (cascade)
  const books = await prisma.book.deleteMany({ where: { userId } });
  counts.books = books.count;
}

async function resetCycle(userId: string, counts: DeleteCounts) {
  // PeriodLog tiene FK SetNull a MenstrualCycle, así que borramos PeriodLog
  // primero por orden de cascade amigable.
  const periods = await prisma.periodLog.deleteMany({ where: { userId } });
  const cycles = await prisma.menstrualCycle.deleteMany({ where: { userId } });
  counts.periodLogs = periods.count;
  counts.menstrualCycles = cycles.count;
}

async function resetMilestones(userId: string, counts: DeleteCounts) {
  const milestones = await prisma.milestone.deleteMany({ where: { userId } });
  counts.milestones = milestones.count;
}

async function resetGamification(userId: string, counts: DeleteCounts) {
  // Reset XP + level pero mantiene el registro. Borra badges.
  const badges = await prisma.userBadge.deleteMany({ where: { userId } });
  const reset = await prisma.gamification.updateMany({
    where: { userId },
    data: {
      totalXP: 0,
      currentLevel: 1,
      streakInsuranceUsedThisWeek: 0,
    },
  });
  // LifeScoreSnapshot también se borra para empezar el tracking limpio
  const snapshots = await prisma.lifeScoreSnapshot.deleteMany({ where: { userId } });
  counts.userBadges = badges.count;
  counts.gamificationReset = reset.count;
  counts.lifeScoreSnapshots = snapshots.count;
}

const SCOPE_EXECUTORS: Record<
  Exclude<ResetScope, "all">,
  (userId: string, counts: DeleteCounts) => Promise<void>
> = {
  habits: resetHabits,
  fitness: resetFitness,
  cardio: resetCardio,
  finance: resetFinance,
  nutrition: resetNutrition,
  productivity: resetProductivity,
  organization: resetOrganization,
  calendar: resetCalendar,
  reading: resetReading,
  cycle: resetCycle,
  milestones: resetMilestones,
  gamification: resetGamification,
};

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, resetDataSchema);
    if (!parsed.ok) return parsed.response;

    const { scope } = parsed.data;
    const counts: DeleteCounts = {};

    try {
      if (scope === "all") {
        // Ejecuta todos los scopes en secuencia. No usamos transaction porque
        // algunas cascades de Prisma no se llevan bien con transactions anidadas
        // en deleteMany masivos; el usuario acepta el riesgo de reset parcial
        // si ocurre un error, que además queda registrado en el audit log.
        for (const executor of Object.values(SCOPE_EXECUTORS)) {
          await executor(userId, counts);
        }
      } else {
        await SCOPE_EXECUTORS[scope](userId, counts);
      }

      void logSecurityEvent({
        eventType: "account_deleted", // reutilizamos event type para auditar
        userId,
        request: req,
        metadata: { action: "reset_data", scope, counts },
      });

      logger.info("reset-data:success", { userId, scope, counts });
      return NextResponse.json({ ok: true, scope, counts });
    } catch (err) {
      logger.error("reset-data:failed", {
        userId,
        scope,
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json(
        { error: "No se pudo completar el reset. Revisa en un momento." },
        { status: 500 },
      );
    }
  });
}
