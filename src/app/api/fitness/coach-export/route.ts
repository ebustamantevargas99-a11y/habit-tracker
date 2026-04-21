import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import {
  computeAtlCtlTsb,
  trimpFromGymWorkout,
  trimpFromCardioSession,
  classifyForm,
} from "@/lib/fitness/training-load";

/**
 * GET /api/fitness/coach-export?days=30
 *
 * Arma un prompt ultra-contextual con los datos del user de los últimos N días
 * (gym + cardio + readiness + training load + PRs + peso) para pegar en
 * Claude/ChatGPT/Gemini.
 *
 * No envía nada a ningún LLM — es un prompt de texto que el user copia.
 */

function formatDate(d: string): string {
  return d;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return sum(arr) / arr.length;
}

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const url = req.nextUrl;
    const days = Math.min(180, Math.max(7, Number(url.searchParams.get("days")) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    const [profile, workouts, cardioSessions, readiness, personalRecords, weightLogs] =
      await Promise.all([
        prisma.userProfile.findUnique({
          where: { userId },
          select: {
            biologicalSex: true,
            birthDate: true,
            heightCm: true,
            weightKg: true,
            units: true,
            fitnessLevel: true,
            primaryGoals: true,
          },
        }),
        prisma.workout.findMany({
          where: { userId, date: { gte: sinceStr } },
          include: {
            exercises: {
              include: { exercise: true, sets: true },
            },
          },
          orderBy: { date: "desc" },
        }),
        prisma.cardioSession.findMany({
          where: { userId, date: { gte: sinceStr } },
          orderBy: { startedAt: "desc" },
        }),
        prisma.readinessCheck.findMany({
          where: { userId, date: { gte: sinceStr } },
          orderBy: { date: "desc" },
        }),
        prisma.personalRecord.findMany({
          where: { userId },
          orderBy: { date: "desc" },
          take: 15,
        }),
        prisma.weightLog.findMany({
          where: { userId, date: { gte: sinceStr } },
          orderBy: { date: "asc" },
        }),
      ]);

    // Edad
    const age = profile?.birthDate
      ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
      : null;

    // Training load
    const trimpByDate: Record<string, number> = {};
    for (const w of workouts) {
      const t = trimpFromGymWorkout({
        durationMin: w.durationMinutes,
        sets: w.exercises.flatMap((e) =>
          e.sets.map((s) => ({
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe,
            isWarmup: s.isWarmup,
          })),
        ),
      });
      trimpByDate[w.date] = (trimpByDate[w.date] ?? 0) + t;
    }
    for (const c of cardioSessions) {
      const t = trimpFromCardioSession({
        durationSec: c.durationSec,
        avgHr: c.avgHr,
        perceivedExertion: c.perceivedExertion,
      });
      trimpByDate[c.date] = (trimpByDate[c.date] ?? 0) + t;
    }
    const series = computeAtlCtlTsb(trimpByDate, sinceStr, today);
    const last = series[series.length - 1];
    const form = last ? classifyForm(last.tsb) : null;

    // PRs resumen
    const prsText = personalRecords
      .slice(0, 10)
      .map((p) => `  - ${p.exerciseName}: ${p.oneRM?.toFixed(1) ?? p.estimated1RM.toFixed(1)} kg (e1RM) el ${formatDate(p.date)}`)
      .join("\n");

    // Últimos workouts resumen (gym)
    const recentWorkoutsText = workouts
      .slice(0, 8)
      .map((w) => {
        const topSetByEx = w.exercises.map((e) => {
          const sets = e.sets.filter((s) => !s.isWarmup);
          if (sets.length === 0) return null;
          const top = sets.reduce(
            (b, s) => (s.weight * s.reps > b.weight * b.reps ? s : b),
            sets[0],
          );
          return `${e.exercise.name}: ${top.weight}kg × ${top.reps}${top.rpe != null ? ` @ RPE ${top.rpe}` : ""}`;
        }).filter((s): s is string => s !== null);
        return `- ${w.date} (${w.durationMinutes}min, vol ${Math.round(w.totalVolume)}kg·rep): ${topSetByEx.slice(0, 5).join(" · ")}`;
      })
      .join("\n");

    // Cardio resumen
    const cardioText = cardioSessions
      .slice(0, 8)
      .map((c) => {
        const min = Math.round(c.durationSec / 60);
        const distStr = c.distanceKm ? `${c.distanceKm.toFixed(2)}km` : "—";
        const paceStr = c.avgPaceSecPerKm
          ? ` · pace ${Math.floor(c.avgPaceSecPerKm / 60)}:${String(Math.round(c.avgPaceSecPerKm % 60)).padStart(2, "0")}/km`
          : "";
        const hrStr = c.avgHr ? ` · HR ${c.avgHr}` : "";
        return `- ${c.date} ${c.activityType} ${distStr} en ${min}min${paceStr}${hrStr}`;
      })
      .join("\n");

    // Readiness promedio
    const readinessAvg = readiness
      .map((r) => r.score)
      .filter((s): s is number => s != null);
    const readinessAvgValue = readinessAvg.length > 0 ? avg(readinessAvg) : null;

    // Weight trend
    const weightFirst = weightLogs[0];
    const weightLast = weightLogs[weightLogs.length - 1];
    const weightDelta =
      weightFirst && weightLast && weightFirst.id !== weightLast.id
        ? weightLast.weight - weightFirst.weight
        : null;

    // 1RMs más confiables
    const topLifts = personalRecords.slice(0, 5).map((p) => ({
      name: p.exerciseName,
      oneRM: p.oneRM ?? p.estimated1RM,
    }));

    // Construcción del prompt
    const lines: string[] = [];
    lines.push(
      `Eres mi coach personal de fuerza y running. Analiza mi entrenamiento de los últimos ${days} días y dame insights accionables.`,
    );
    lines.push("");
    lines.push("--- MI PERFIL ---");
    if (age != null) lines.push(`- Edad: ${age} años`);
    if (profile?.biologicalSex) lines.push(`- Sexo: ${profile.biologicalSex}`);
    if (profile?.heightCm) lines.push(`- Altura: ${profile.heightCm} cm`);
    if (profile?.weightKg) lines.push(`- Peso: ${profile.weightKg} kg`);
    if (profile?.fitnessLevel) lines.push(`- Nivel: ${profile.fitnessLevel}`);
    if (profile?.primaryGoals && profile.primaryGoals.length > 0) {
      lines.push(`- Objetivos: ${profile.primaryGoals.join(", ")}`);
    }

    lines.push("");
    lines.push(`--- TRAINING LOAD (Banister, últimos ${days} días) ---`);
    if (last && form) {
      lines.push(`- ATL (fatiga 7d): ${last.atl}`);
      lines.push(`- CTL (fitness 42d): ${last.ctl}`);
      lines.push(`- TSB (forma): ${last.tsb > 0 ? "+" : ""}${last.tsb}`);
      lines.push(`- Clasificación: ${form.label} — ${form.description}`);
    } else {
      lines.push("- Sin suficientes workouts para calcular.");
    }

    lines.push("");
    lines.push("--- READINESS ---");
    if (readinessAvgValue != null) {
      lines.push(`- Score promedio últimos ${days}d: ${readinessAvgValue.toFixed(0)}/100`);
      lines.push(`- Checks registrados: ${readiness.length}`);
    } else {
      lines.push("- Sin readiness checks registrados.");
    }

    lines.push("");
    lines.push(`--- GYM (${workouts.length} sesiones) ---`);
    if (recentWorkoutsText) {
      lines.push(recentWorkoutsText);
    } else {
      lines.push("- Sin sesiones de gym.");
    }

    if (topLifts.length > 0) {
      lines.push("");
      lines.push("--- PRs TOP (1RM estimado) ---");
      for (const l of topLifts) {
        lines.push(`- ${l.name}: ${l.oneRM.toFixed(1)} kg`);
      }
    }

    lines.push("");
    lines.push(`--- CARDIO (${cardioSessions.length} sesiones) ---`);
    if (cardioText) {
      lines.push(cardioText);
    } else {
      lines.push("- Sin sesiones de cardio.");
    }

    if (weightLogs.length > 0) {
      lines.push("");
      lines.push("--- PESO ---");
      lines.push(
        `- Registros: ${weightLogs.length} · primer=${weightLogs[0].weight}kg · último=${weightLogs[weightLogs.length - 1].weight}kg${weightDelta != null ? ` (${weightDelta >= 0 ? "+" : ""}${weightDelta.toFixed(1)}kg)` : ""}`,
      );
    }

    lines.push("");
    lines.push("--- PREGUNTAS ---");
    lines.push(
      "1. ¿Estoy progresando de forma equilibrada o hay desequilibrios por grupo muscular?",
    );
    lines.push(
      "2. Según mi TSB actual, ¿qué intensidad recomiendas para los próximos 7 días?",
    );
    lines.push(
      "3. Detecta patrones: ¿hay días de la semana que salto? ¿RPE subiendo consistente?",
    );
    lines.push(
      "4. Si estoy cerca de plateau en algún lift, ¿qué sugerencias específicas de programación harías?",
    );
    lines.push(
      "5. Mis objetivos son los de arriba — ¿qué UNA cosa cambiarías en mi programa para avanzarlos?",
    );
    lines.push("");
    lines.push("Sé directo, específico y cita números de mis datos. Evita consejos genéricos.");

    const prompt = lines.join("\n");

    return NextResponse.json({
      prompt,
      days,
      generatedAt: new Date().toISOString(),
      stats: {
        workouts: workouts.length,
        cardioSessions: cardioSessions.length,
        readinessChecks: readiness.length,
        prs: personalRecords.length,
        weightLogs: weightLogs.length,
      },
    });
  });
}
