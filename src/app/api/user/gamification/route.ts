import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Static badge definitions — the source of truth for badge metadata
const BADGE_DEFINITIONS = [
  { id: "first-step",    name: "First Step",       emoji: "👣", description: "Completa tu primer hábito" },
  { id: "week-warrior",  name: "Week Warrior",      emoji: "🔥", description: "Racha de 7 días" },
  { id: "monthly-master",name: "Monthly Master",    emoji: "🏅", description: "Racha de 30 días" },
  { id: "pr-hunter",     name: "PR Hunter",         emoji: "⚔️", description: "Rompe 10 récords personales" },
  { id: "budget-boss",   name: "Budget Boss",       emoji: "💰", description: "Presupuesto 3 meses seguidos" },
  { id: "sleep-champ",   name: "Sleep Champion",    emoji: "😴", description: "30 noches de +7h de sueño" },
  { id: "hydration-hero",name: "Hydration Hero",    emoji: "💧", description: "Meta de agua 21 días" },
  { id: "bookworm",      name: "Bookworm",          emoji: "📚", description: "Leer 12 libros en un año" },
  { id: "iron-will",     name: "Iron Will",         emoji: "🦾", description: "Racha de 100 días" },
  { id: "life-score-90", name: "Life Score 90",     emoji: "🌟", description: "Puntuación de Vida ≥ 90" },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Upsert gamification record so it always exists
  const gamification = await prisma.gamification.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, totalXP: 0 },
    update: {},
  });

  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
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
}
