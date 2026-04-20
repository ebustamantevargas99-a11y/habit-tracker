import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseJson, lifeAreaCreateSchema } from "@/lib/validation";

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
  return withAuth(async (userId) => {
    let areas = await prisma.lifeArea.findMany({
      where: { userId },
      orderBy: { orderIndex: "asc" },
    });

    if (areas.length === 0) {
      await prisma.lifeArea.createMany({
        data: DEFAULT_LIFE_AREAS.map((a, i) => ({
          userId,
          name: a.name,
          emoji: a.emoji,
          color: a.color,
          score: a.score,
          orderIndex: i,
        })),
      });
      areas = await prisma.lifeArea.findMany({
        where: { userId },
        orderBy: { orderIndex: "asc" },
      });
    }

    return NextResponse.json(areas);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, lifeAreaCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const count = await prisma.lifeArea.count({ where: { userId } });
    const area = await prisma.lifeArea.create({
      data: {
        userId,
        name: d.name,
        emoji: d.emoji ?? "🎯",
        score: d.score ?? 5,
        description: d.description ?? null,
        color: d.color ?? "#B8860B",
        orderIndex: count,
      },
    });
    return NextResponse.json(area, { status: 201 });
  });
}
