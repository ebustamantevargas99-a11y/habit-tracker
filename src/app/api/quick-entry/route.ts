import { NextRequest, NextResponse } from "next/server";
import { withApiKeyAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { todayLocal } from "@/lib/date/local";
import {
  recalculateStreak,
  crossedMilestone,
  ROOTED_THRESHOLD,
} from "@/lib/habit-utils";
import {
  awardXP,
  checkFirstStepBadge,
  checkStreakBadges,
  checkHydrationHeroBadge,
} from "@/lib/gamification-utils";
import { z } from "zod";

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional();

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("habit"),
    habitId: z.string().optional(),
    habitName: z.string().optional(),
    completed: z.boolean().default(true),
    date: dateField,
    notes: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("water"),
    amountMl: z.number().int().positive().max(5000).optional(),
    glasses: z.number().int().positive().max(20).optional(),
    date: dateField,
  }),
  z.object({
    action: z.literal("weight"),
    value: z.number().positive().max(999),
    unit: z.enum(["kg", "lb"]).default("kg"),
    date: dateField,
  }),
  z.object({
    action: z.literal("expense"),
    amount: z.number().positive().max(9_999_999),
    description: z.string().max(200),
    category: z.string().max(100).default("Otros"),
    type: z.enum(["expense", "income"]).default("expense"),
    date: dateField,
  }),
  z.object({
    action: z.literal("workout"),
    name: z.string().max(200).default("Entrenamiento rápido"),
    durationMinutes: z.number().int().positive().max(600),
    notes: z.string().max(500).optional(),
    date: dateField,
  }),
]);

async function getUserTz(userId: string): Promise<string | null> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  return profile?.timezone ?? null;
}

export async function POST(req: NextRequest) {
  return withApiKeyAuth(req, async (userId) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Resolve effective date: prefer explicit date from client (e.g. Scriptable
    // sends its local date), fall back to server-side local date in user's TZ.
    const tz = await getUserTz(userId);
    const date = "date" in data && data.date ? data.date : todayLocal(tz);

    // ── Hábito ──────────────────────────────────────────────────────────────
    if (data.action === "habit") {
      let habitId = data.habitId;

      if (!habitId && data.habitName) {
        const found = await prisma.habit.findFirst({
          where: {
            userId,
            isActive: true,
            name: { contains: data.habitName, mode: "insensitive" },
          },
          select: { id: true },
        });
        if (!found) {
          return NextResponse.json(
            { error: `Hábito "${data.habitName}" no encontrado` },
            { status: 404 }
          );
        }
        habitId = found.id;
      }

      if (!habitId) {
        return NextResponse.json(
          { error: "Proporciona habitId o habitName" },
          { status: 400 }
        );
      }

      const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId, isActive: true },
      });
      if (!habit) {
        return NextResponse.json(
          { error: "Hábito no encontrado" },
          { status: 404 }
        );
      }

      const previousStreak = habit.streakCurrent;

      const log = await prisma.habitLog.upsert({
        where: { habitId_date: { habitId, date } },
        create: {
          habitId,
          userId,
          date,
          completed: data.completed,
          notes: data.notes,
        },
        update: { completed: data.completed, notes: data.notes },
      });

      // Recalculate streak exactly as the main habits route does.
      const streakResult = await recalculateStreak(habitId, habit.targetDays, {
        estimatedMinutes: habit.estimatedMinutes,
        currentRootedAt: habit.rootedAt,
        tz,
      });

      const updatedHabit = await prisma.habit.update({
        where: { id: habitId },
        data: {
          streakCurrent: streakResult.streakCurrent,
          streakBest: Math.max(streakResult.streakBest, habit.streakBest),
          phase: streakResult.phase,
          rootedAt: streakResult.rootedAtFirst,
          rootedStreak: streakResult.rootedStreak,
          graceDaysAvailable: streakResult.graceDaysAvailable,
          graceWeekStart: streakResult.graceWeekStart,
          lastCompletedDate: streakResult.lastCompletedDate,
        },
      });

      // Milestones + gamification — same as main habits route.
      if (data.completed) {
        const milestone = crossedMilestone(
          previousStreak,
          streakResult.streakCurrent
        );
        if (milestone !== null) {
          const titleMap: Record<number, string> = {
            7: `Primer hito: 7 días de ${habit.name}`,
            21: `Formándose: 21 días de ${habit.name}`,
            66: `Fortaleciéndose: 66 días de ${habit.name}`,
            [ROOTED_THRESHOLD]: `🏆 ¡${habit.name} arraigado!`,
            100: `100 días arraigados: ${habit.name}`,
            365: `1 año consecutivo: ${habit.name}`,
            500: `500 días consecutivos: ${habit.name}`,
            1000: `1,000 días consecutivos: ${habit.name}`,
          };
          try {
            await prisma.milestone.create({
              data: {
                userId,
                date,
                type:
                  milestone === ROOTED_THRESHOLD
                    ? "habit_rooted"
                    : "habit_streak",
                title:
                  titleMap[milestone] ?? `${milestone} días de ${habit.name}`,
                icon:
                  milestone === ROOTED_THRESHOLD ? "👑" : (habit.icon ?? "🔥"),
                metadata: { habitId, streak: milestone } as unknown as object,
              },
            });
          } catch {
            // Milestone creation is non-critical; don't fail the request.
          }
        }

        await awardXP(prisma, userId, 5);
        await checkFirstStepBadge(prisma, userId);
        await checkStreakBadges(prisma, userId, streakResult.streakCurrent);
      }

      return NextResponse.json({
        ok: true,
        action: "habit",
        habit: habit.name,
        date,
        completed: log.completed,
        streak: updatedHabit.streakCurrent,
      });
    }

    // ── Agua ────────────────────────────────────────────────────────────────
    if (data.action === "water") {
      const deltaMl = data.amountMl ?? (data.glasses ?? 1) * 250;

      const existing = await prisma.hydrationLog.findUnique({
        where: { userId_date: { userId, date } },
      });

      const newAmount = Math.max(0, (existing?.amountMl ?? 0) + deltaMl);
      const log = await prisma.hydrationLog.upsert({
        where: { userId_date: { userId, date } },
        create: {
          userId,
          date,
          amountMl: newAmount,
          goalMl: existing?.goalMl ?? 2500,
        },
        update: { amountMl: newAmount },
      });

      if (log.goalMl > 0 && log.amountMl >= log.goalMl) {
        await checkHydrationHeroBadge(prisma, userId);
      }

      return NextResponse.json({
        ok: true,
        action: "water",
        date,
        totalMl: log.amountMl,
        addedMl: deltaMl,
        goalMl: log.goalMl,
      });
    }

    // ── Peso ────────────────────────────────────────────────────────────────
    // The BodyMetric model has no unique(userId, date, type) constraint.
    // We replicate the app's own behavior (fitness/weight route POST), which
    // always creates a new entry. The widget does the same to stay consistent.
    if (data.action === "weight") {
      const metric = await prisma.bodyMetric.create({
        data: {
          userId,
          date,
          type: "weight",
          value: data.value,
          unit: data.unit,
        },
      });

      return NextResponse.json({
        ok: true,
        action: "weight",
        date,
        value: metric.value,
        unit: metric.unit,
      });
    }

    // ── Gasto ───────────────────────────────────────────────────────────────
    if (data.action === "expense") {
      const account = await prisma.financialAccount.findFirst({
        where: { userId, archived: false },
        select: { id: true, name: true },
        orderBy: { createdAt: "asc" },
      });

      if (!account) {
        return NextResponse.json(
          {
            error: "No tienes cuentas financieras. Crea una en la app primero.",
          },
          { status: 422 }
        );
      }

      const tx = await prisma.transaction.create({
        data: {
          userId,
          accountId: account.id,
          date,
          amount: data.amount,
          type: data.type,
          category: data.category,
          description: data.description,
        },
      });

      return NextResponse.json({
        ok: true,
        action: "expense",
        date,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        description: tx.description,
        account: account.name,
      });
    }

    // ── Entrenamiento ───────────────────────────────────────────────────────
    if (data.action === "workout") {
      const workout = await prisma.workout.create({
        data: {
          userId,
          name: data.name,
          date,
          durationMinutes: data.durationMinutes,
          notes: data.notes,
          completed: true,
        },
      });

      return NextResponse.json({
        ok: true,
        action: "workout",
        date,
        name: workout.name,
        durationMinutes: data.durationMinutes,
      });
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  });
}

// GET — lista hábitos activos (útil para configurar el widget)
export async function GET(req: NextRequest) {
  return withApiKeyAuth(req, async (userId) => {
    const habits = await prisma.habit.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, icon: true, category: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ habits });
  });
}
