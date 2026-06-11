import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Definiciones de badges — fuente de verdad de la metadata. Solo se listan
// los que tienen un awarder real en el código (de lo contrario el "próximo
// badge" del ribbon se quedaba clavado en uno inalcanzable). Removidos
// "sleep-champ" (no hay tracking de sueño) y "budget-boss" (sin lógica).
const BADGE_DEFINITIONS = [
  { id: "first-step",    name: "Primer paso",         emoji: "👣", description: "Completa tu primer hábito" },
  { id: "week-warrior",  name: "Guerrero semanal",    emoji: "🔥", description: "Racha de 7 días" },
  { id: "monthly-master",name: "Maestro mensual",     emoji: "🏅", description: "Racha de 30 días" },
  { id: "iron-will",     name: "Voluntad de hierro",  emoji: "🦾", description: "Racha de 100 días" },
  { id: "pr-hunter",     name: "Cazador de PRs",      emoji: "⚔️", description: "Rompe 10 récords personales" },
  { id: "hydration-hero",name: "Héroe de hidratación", emoji: "💧", description: "Meta de agua 21 días" },
  { id: "bookworm",      name: "Ratón de biblioteca", emoji: "📚", description: "Termina 12 libros" },
  { id: "life-score-90", name: "Puntuación de Vida 90", emoji: "🌟", description: "Puntuación de Vida ≥ 90" },
];

const gamificationPatchSchema = z.object({
  streakInsuranceDays: z.number().int().min(0).max(7).optional(),
});

export async function GET() {
  return withAuth(async (userId) => {

  // Upsert gamification record so it always exists
  const gamification = await prisma.gamification.upsert({
    where: { userId: userId },
    create: { userId: userId, totalXP: 0 },
    update: {},
  });

  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId: userId },
  });
  const earnedMap = new Map(earnedBadges.map((b) => [b.badgeId, b.earnedDate.toISOString().split("T")[0]]));

  const badges = BADGE_DEFINITIONS.map((def) => ({
    ...def,
    isEarned: earnedMap.has(def.id),
    earnedDate: earnedMap.get(def.id),
  }));

  return NextResponse.json({
    totalXP: gamification.totalXP,
    currentLevel: gamification.currentLevel,
    streakInsuranceDays: gamification.streakInsuranceDays,
    badges,
  });
});
}

export async function PATCH(req: NextRequest) {
  return withAuth(async (userId) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    const parsed = gamificationPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const { streakInsuranceDays } = parsed.data;

    if (streakInsuranceDays !== undefined) {
      await prisma.gamification.upsert({
        where: { userId },
        create: { userId, totalXP: 0, streakInsuranceDays },
        update: { streakInsuranceDays },
      });
    }

    return NextResponse.json({ ok: true });
  });
}
