import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { VOLUME_LANDMARKS } from "@/lib/constants";

/**
 * GET /api/fitness/volume?days=7
 *
 * Calcula sets efectivos por grupo muscular desde el histórico real de Workouts
 * — reemplaza el mock `BASE_WEEKLY_VOLUME` / `INITIAL_TONELAGE`.
 *
 * Criterio "sets efectivos" (Renaissance Periodization / Mike Israetel):
 *   — excluye warmups (isWarmup || setType="warmup")
 *   — cuenta sólo sets con reps ≥ 5 y (RPE ≥ 6 o RPE desconocido)
 *
 * Devuelve por cada landmark:
 *   { muscle, sets, effectiveSets, mev, mavLow, mavHigh, mrv, status }
 *   status = "mev" | "mav" | "mrv" | "over" | "under"
 */

type LandmarkKey = keyof typeof VOLUME_LANDMARKS;

function normalizeMuscleKey(raw: string | null | undefined): LandmarkKey | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();

  if (lower.includes("pecho") || lower.includes("chest")) return "Pecho";
  if (lower.includes("espalda") || lower.includes("back") || lower.includes("traps"))
    return "Espalda";
  if (lower.includes("hombro") || lower.includes("shoulder") || lower.includes("delt"))
    return "Hombros (lateral)";
  if (lower.includes("bíceps") || lower.includes("biceps")) return "Bíceps";
  if (lower.includes("tríceps") || lower.includes("triceps")) return "Tríceps";
  if (
    lower.includes("cuád") ||
    lower.includes("quad") ||
    lower.includes("piern")
  )
    return "Cuádriceps";
  if (lower.includes("isquio") || lower.includes("hamstring")) return "Isquiotibiales";
  if (lower.includes("glúteo") || lower.includes("glute")) return "Glúteos";
  if (lower.includes("core") || lower.includes("abdom") || lower.includes("ab "))
    return "Core";
  if (
    lower.includes("pantorr") ||
    lower.includes("calve") ||
    lower.includes("calf")
  )
    return "Pantorrillas";
  return null;
}

function classifyStatus(
  sets: number,
  lm: (typeof VOLUME_LANDMARKS)[LandmarkKey],
): "under" | "mev" | "mav" | "mrv" | "over" {
  if (sets < lm.mv) return "under";
  if (sets < lm.mev) return "mev";
  if (sets <= lm.mavHigh) return "mav";
  if (sets <= lm.mrv) return "mrv";
  return "over";
}

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const daysStr = req.nextUrl.searchParams.get("days") ?? "7";
    const days = Math.min(90, Math.max(1, Number(daysStr) || 7));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    const workouts = await prisma.workout.findMany({
      where: { userId, date: { gte: sinceStr } },
      include: {
        exercises: {
          include: {
            sets: true,
            exercise: {
              select: { muscleGroup: true, primaryMuscle: true },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const counts: Record<string, { sets: number; effective: number }> = {};

    for (const w of workouts) {
      for (const we of w.exercises) {
        const muscleRaw = we.exercise.primaryMuscle ?? we.exercise.muscleGroup;
        const muscle = normalizeMuscleKey(muscleRaw);
        if (!muscle) continue;
        if (!counts[muscle]) counts[muscle] = { sets: 0, effective: 0 };
        for (const s of we.sets) {
          if (s.isWarmup || s.setType === "warmup") continue;
          counts[muscle].sets += 1;
          const effective = s.reps >= 5 && (s.rpe == null || s.rpe >= 6);
          if (effective) counts[muscle].effective += 1;
        }
      }
    }

    const muscles = (Object.keys(VOLUME_LANDMARKS) as LandmarkKey[]).map(
      (muscle) => {
        const actual = counts[muscle] ?? { sets: 0, effective: 0 };
        const lm = VOLUME_LANDMARKS[muscle];
        return {
          muscle,
          sets: actual.sets,
          effectiveSets: actual.effective,
          mv: lm.mv,
          mev: lm.mev,
          mavLow: lm.mavLow,
          mavHigh: lm.mavHigh,
          mrv: lm.mrv,
          status: classifyStatus(actual.sets, lm),
        };
      },
    );

    return NextResponse.json({
      days,
      since: sinceStr,
      totalWorkouts: workouts.length,
      muscles,
    });
  });
}
