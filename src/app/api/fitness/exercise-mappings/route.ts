import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, exerciseMappingUpsertSchema } from "@/lib/validation";
import { normExerciseName } from "@/lib/fitness/muscle-volume";

/**
 * GET /api/fitness/exercise-mappings
 * Devuelve todos los mapeos custom del usuario: [{exerciseName, contributions}]
 */
export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const rows = await prisma.fitnessExerciseMapping.findMany({
      where: { userId },
      select: { exerciseName: true, contributionsJson: true },
    });
    return NextResponse.json(
      rows.map((r) => ({
        exerciseName: r.exerciseName,
        contributions: JSON.parse(r.contributionsJson) as { muscle: string; fraction: number }[],
      })),
    );
  });
}

/**
 * PUT /api/fitness/exercise-mappings
 * Upsert de un mapeo: { exerciseName, contributions }
 */
export async function PUT(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, exerciseMappingUpsertSchema);
    if (!parsed.ok) return parsed.response;

    const { exerciseName, contributions } = parsed.data;
    const normalizedName = normExerciseName(exerciseName);

    await prisma.fitnessExerciseMapping.upsert({
      where: { userId_exerciseName: { userId, exerciseName: normalizedName } },
      create: {
        userId,
        exerciseName: normalizedName,
        contributionsJson: JSON.stringify(contributions),
      },
      update: { contributionsJson: JSON.stringify(contributions) },
    });

    return NextResponse.json({ ok: true });
  });
}

/**
 * DELETE /api/fitness/exercise-mappings?name=xxx
 * Elimina el mapeo de un ejercicio específico.
 */
export async function DELETE(req: NextRequest) {
  return withAuth(async (userId) => {
    const name = req.nextUrl.searchParams.get("name");
    if (!name?.trim()) {
      return NextResponse.json({ error: "Parámetro name requerido" }, { status: 400 });
    }
    await prisma.fitnessExerciseMapping.deleteMany({
      where: { userId, exerciseName: normExerciseName(name) },
    });
    return NextResponse.json({ ok: true });
  });
}
