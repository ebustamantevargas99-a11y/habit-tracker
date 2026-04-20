import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { EXERCISES_SEED } from "@/lib/fitness/exercises-seed";

// GET /api/fitness/exercises-catalog?q=bench&muscle=chest
// Devuelve catálogo combinado: seed + ejercicios custom del usuario.
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") ?? "").toLowerCase().trim();
    const muscle = searchParams.get("muscle");

    const custom = await prisma.exercise.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      select: {
        id: true,
        name: true,
        muscleGroup: true,
        category: true,
        equipment: true,
        isCustom: true,
        userId: true,
      },
      orderBy: { name: "asc" },
      take: 500,
    });

    const seed = EXERCISES_SEED.filter((ex) => {
      if (muscle && ex.muscleGroup !== muscle) return false;
      if (query) {
        return (
          ex.name.toLowerCase().includes(query) ||
          ex.nameEn.toLowerCase().includes(query) ||
          ex.slug.includes(query)
        );
      }
      return true;
    }).map((ex) => ({
      id: `seed:${ex.slug}`,
      slug: ex.slug,
      name: ex.name,
      nameEn: ex.nameEn,
      muscleGroup: ex.muscleGroup,
      category: ex.category,
      equipment: ex.equipment,
      isCustom: false,
      isLowerBody: ex.isLowerBody,
      primaryMovementPattern: ex.primaryMovementPattern,
      source: "seed" as const,
    }));

    const customFiltered = custom
      .filter((ex) => {
        if (muscle && ex.muscleGroup !== muscle) return false;
        if (query) return ex.name.toLowerCase().includes(query);
        return true;
      })
      .map((ex) => ({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        category: ex.category,
        equipment: ex.equipment,
        isCustom: ex.isCustom,
        source: ex.userId ? ("user" as const) : ("shared" as const),
      }));

    return NextResponse.json({
      exercises: [...seed, ...customFiltered],
      total: seed.length + customFiltered.length,
    });
  });
}
