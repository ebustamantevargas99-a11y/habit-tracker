import { NextRequest, NextResponse } from "next/server";
import { withApiKeyAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TODAY = () => new Date().toISOString().split("T")[0];

const schema = z.discriminatedUnion("action", [
  // ── Hábito ────────────────────────────────────────────────────────────────
  z.object({
    action: z.literal("habit"),
    habitId: z.string().optional(),
    habitName: z.string().optional(),
    completed: z.boolean().default(true),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    notes: z.string().max(500).optional(),
  }),
  // ── Agua ──────────────────────────────────────────────────────────────────
  z.object({
    action: z.literal("water"),
    amountMl: z.number().int().positive().max(5000).optional(),
    glasses: z.number().int().positive().max(20).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
  // ── Peso corporal ─────────────────────────────────────────────────────────
  z.object({
    action: z.literal("weight"),
    value: z.number().positive().max(999),
    unit: z.enum(["kg", "lb"]).default("kg"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
  // ── Gasto / ingreso ───────────────────────────────────────────────────────
  z.object({
    action: z.literal("expense"),
    amount: z.number().positive().max(9_999_999),
    description: z.string().max(200),
    category: z.string().max(100).default("Otros"),
    type: z.enum(["expense", "income"]).default("expense"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
  // ── Entrenamiento ─────────────────────────────────────────────────────────
  z.object({
    action: z.literal("workout"),
    name: z.string().max(200).default("Entrenamiento rápido"),
    durationMinutes: z.number().int().positive().max(600),
    notes: z.string().max(500).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
]);

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
    const date = "date" in data && data.date ? data.date : TODAY();

    // ── Hábito ──────────────────────────────────────────────────────────────
    if (data.action === "habit") {
      let habitId = data.habitId;

      if (!habitId && data.habitName) {
        const habit = await prisma.habit.findFirst({
          where: {
            userId,
            isActive: true,
            name: { contains: data.habitName, mode: "insensitive" },
          },
          select: { id: true, name: true },
        });
        if (!habit) {
          return NextResponse.json(
            { error: `Hábito "${data.habitName}" no encontrado` },
            { status: 404 }
          );
        }
        habitId = habit.id;
      }

      if (!habitId) {
        return NextResponse.json(
          { error: "Proporciona habitId o habitName" },
          { status: 400 }
        );
      }

      const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId },
        select: { id: true, name: true },
      });
      if (!habit) {
        return NextResponse.json(
          { error: "Hábito no encontrado" },
          { status: 404 }
        );
      }

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

      return NextResponse.json({
        ok: true,
        action: "habit",
        habit: habit.name,
        date,
        completed: log.completed,
      });
    }

    // ── Agua ────────────────────────────────────────────────────────────────
    if (data.action === "water") {
      const deltaMl = data.amountMl ?? (data.glasses ?? 1) * 250;

      const existing = await prisma.hydrationLog.findUnique({
        where: { userId_date: { userId, date } },
      });

      const log = await prisma.hydrationLog.upsert({
        where: { userId_date: { userId, date } },
        create: { userId, date, amountMl: deltaMl, goalMl: 2500 },
        update: { amountMl: (existing?.amountMl ?? 0) + deltaMl },
      });

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
    if (data.action === "weight") {
      const metric = await prisma.bodyMetric.upsert({
        where: {
          // No hay unique compuesto — usamos findFirst+create/update manual
          // para evitar duplicados por fecha+tipo
          id:
            (
              await prisma.bodyMetric.findFirst({
                where: { userId, date, type: "weight" },
                select: { id: true },
              })
            )?.id ?? "__new__",
        },
        create: {
          userId,
          date,
          type: "weight",
          value: data.value,
          unit: data.unit,
        },
        update: { value: data.value, unit: data.unit },
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
        where: { userId },
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

// GET — lista hábitos activos (útil para configurar Scriptable)
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
