import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// Static badge definitions — the source of truth for badge metadata
const BADGE_DEFINITIONS = [
  { id: "first-step",    name: "Primer paso",         emoji: "👣", description: "Completa tu primer hábito" },
  { id: "week-warrior",  name: "Guerrero semanal",    emoji: "🔥", description: "Racha de 7 días" },
  { id: "monthly-master",name: "Maestro mensual",     emoji: "🏅", description: "Racha de 30 días" },
  { id: "pr-hunter",     name: "Cazador de PRs",      emoji: "⚔️", description: "Rompe 10 récords personales" },
  { id: "budget-boss",   name: "Jefe del presupuesto", emoji: "💰", description: "Presupuesto 3 meses seguidos" },
  { id: "sleep-champ",   name: "Campeón del sueño",   emoji: "😴", description: "30 noches de +7h de sueño" },
  { id: "hydration-hero",name: "Héroe de hidratación", emoji: "💧", description: "Meta de agua 21 días" },
  { id: "bookworm",      name: "Ratón de biblioteca", emoji: "📚", description: "Leer 12 libros en un año" },
  { id: "iron-will",     name: "Voluntad de hierro",  emoji: "🦾", description: "Racha de 100 días" },
  { id: "life-score-90", name: "Puntuación de Vida 90", emoji: "🌟", description: "Puntuación de Vida ≥ 90" },
];

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

  const body = await req.json();
  const { streakInsuranceDays } = body;

  if (streakInsuranceDays !== undefined) {
    await prisma.gamification.upsert({
      where: { userId: userId },
      create: { userId: userId, totalXP: 0, streakInsuranceDays },
      update: { streakInsuranceDays },
    });
  }

  return NextResponse.json({ ok: true });
});
}
