import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_LIFE_AREAS = [
  { name: "Salud", emoji: "💪", color: "#22C55E", score: 5 },
  { name: "Finanzas", emoji: "💰", color: "#F59E0B", score: 5 },
  { name: "Relaciones", emoji: "❤️", color: "#EF4444", score: 5 },
  { name: "Carrera", emoji: "🚀", color: "#6366F1", score: 5 },
  { name: "Personal", emoji: "🧠", color: "#8B5CF6", score: 5 },
  { name: "Ocio", emoji: "🎉", color: "#EC4899", score: 5 },
  { name: "Espiritualidad", emoji: "🙏", color: "#14B8A6", score: 5 },
  { name: "Entorno", emoji: "🏠", color: "#F97316", score: 5 },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let areas = await prisma.lifeArea.findMany({
    where: { userId: session.user.id },
    orderBy: { orderIndex: "asc" },
  });

  // Seed defaults on first access
  if (areas.length === 0) {
    await prisma.lifeArea.createMany({
      data: DEFAULT_LIFE_AREAS.map((a, i) => ({
        userId: session.user.id!,
        name: a.name,
        emoji: a.emoji,
        color: a.color,
        score: a.score,
        orderIndex: i,
      })),
    });
    areas = await prisma.lifeArea.findMany({
      where: { userId: session.user.id },
      orderBy: { orderIndex: "asc" },
    });
  }

  return NextResponse.json(areas);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const count = await prisma.lifeArea.count({ where: { userId: session.user.id } });
  const area = await prisma.lifeArea.create({
    data: {
      userId: session.user.id,
      name: body.name,
      emoji: body.emoji ?? "🎯",
      score: body.score ?? 5,
      description: body.description ?? null,
      color: body.color ?? "#B8860B",
      orderIndex: count,
    },
  });
  return NextResponse.json(area, { status: 201 });
}
