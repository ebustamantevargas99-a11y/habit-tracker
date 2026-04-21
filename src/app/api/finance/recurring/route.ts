import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, recurringCreateSchema } from "@/lib/validation";
import { categoryIcon } from "@/lib/finance/recurring";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") !== "false";
    const items = await prisma.recurringTransaction.findMany({
      where: { userId, ...(activeOnly ? { active: true } : {}) },
      orderBy: { nextDate: "asc" },
      include: {
        account: { select: { id: true, name: true, color: true, icon: true, currency: true } },
      },
    });
    return NextResponse.json(items);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, recurringCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Verificar ownership de la cuenta
    const account = await prisma.financialAccount.findFirst({
      where: { id: d.accountId, userId },
      select: { id: true },
    });
    if (!account) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });

    // Crear recurring + CalendarEvent linkado (solo para expenses, ingresos no
    // se muestran como "upcoming" en el calendario)
    const recurring = await prisma.$transaction(async (tx) => {
      const r = await tx.recurringTransaction.create({
        data: {
          userId,
          accountId: d.accountId,
          name: d.name,
          amount: d.amount,
          type: d.type,
          category: d.category,
          subcategory: d.subcategory ?? null,
          merchant: d.merchant ?? null,
          frequency: d.frequency,
          dayOfMonth: d.dayOfMonth ?? null,
          nextDate: d.nextDate,
          endDate: d.endDate ?? null,
          active: d.active ?? true,
          autoLog: d.autoLog ?? true,
        },
      });

      if (d.type === "expense") {
        const eventDate = new Date(`${d.nextDate}T09:00:00`);
        const icon = categoryIcon(d.category);
        const event = await tx.calendarEvent.create({
          data: {
            userId,
            title: `${icon} ${d.name}`,
            description: `Cargo recurrente · $${d.amount}`,
            startAt: eventDate,
            allDay: true,
            type: "appointment",
            category: "finance",
            icon,
            sourceModule: "recurring",
            sourceId: r.id,
            recurrence:
              d.frequency === "weekly" ? "weekly" :
              d.frequency === "biweekly" ? "FREQ=WEEKLY;INTERVAL=2" :
              d.frequency === "monthly" ? "monthly" :
              d.frequency === "quarterly" ? "FREQ=MONTHLY;INTERVAL=3" :
              d.frequency === "annual" ? "FREQ=YEARLY" : null,
            reminderMinutes: 1440, // 1 día antes
          },
        });
        return tx.recurringTransaction.update({
          where: { id: r.id },
          data: { linkedEventId: event.id },
        });
      }
      return r;
    });

    return NextResponse.json(recurring, { status: 201 });
  });
}
