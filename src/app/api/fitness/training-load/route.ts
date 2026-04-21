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
 * GET /api/fitness/training-load?days=42
 *
 * Devuelve la serie diaria ATL/CTL/TSB del user en la ventana solicitada.
 *
 * Combina TRIMP de Workouts (gym) + CardioSessions, con fallback Foster (RPE×min)
 * cuando no hay HR / RPE registrado.
 */

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const url = req.nextUrl;
    // Por default 90 días — suficiente para ver evolución de CTL (τ=42).
    const days = Math.min(365, Math.max(7, Number(url.searchParams.get("days")) || 90));

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    // Cargar datos del perfil para Banister HR-based (si hay)
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { biologicalSex: true, birthDate: true },
    });
    const sex: "male" | "female" | null =
      profile?.biologicalSex === "female" ? "female" : profile?.biologicalSex === "male" ? "male" : null;

    // Últimos Readiness para restingHr estimado
    const latestReadiness = await prisma.readinessCheck.findFirst({
      where: { userId, restingHr: { not: null } },
      orderBy: { date: "desc" },
      select: { restingHr: true },
    });
    const restingHr = latestReadiness?.restingHr ?? null;

    // HR máx estimada (Tanaka) si hay birthDate
    let maxHr: number | null = null;
    if (profile?.birthDate) {
      const age =
        new Date().getFullYear() - new Date(profile.birthDate).getFullYear();
      maxHr = Math.round(208 - 0.7 * age);
    }

    // Cargar workouts + cardio sessions dentro del rango
    const [workouts, cardioSessions] = await Promise.all([
      prisma.workout.findMany({
        where: { userId, date: { gte: sinceStr } },
        include: { exercises: { include: { sets: true } } },
      }),
      prisma.cardioSession.findMany({
        where: { userId, date: { gte: sinceStr } },
      }),
    ]);

    // Agregar TRIMP por día
    const trimpByDate: Record<string, number> = {};
    for (const w of workouts) {
      const sets = w.exercises.flatMap((e) => e.sets);
      const trimp = trimpFromGymWorkout({
        durationMin: w.durationMinutes,
        sets: sets.map((s) => ({
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          isWarmup: s.isWarmup,
        })),
      });
      trimpByDate[w.date] = (trimpByDate[w.date] ?? 0) + trimp;
    }

    for (const c of cardioSessions) {
      const trimp = trimpFromCardioSession({
        durationSec: c.durationSec,
        avgHr: c.avgHr,
        perceivedExertion: c.perceivedExertion,
        restingHr,
        maxHr,
        sex,
      });
      trimpByDate[c.date] = (trimpByDate[c.date] ?? 0) + trimp;
    }

    const series = computeAtlCtlTsb(trimpByDate, sinceStr, today);
    const last = series[series.length - 1];
    const classification = last ? classifyForm(last.tsb) : null;

    return NextResponse.json({
      days,
      since: sinceStr,
      today,
      series,
      current: last
        ? {
            atl: last.atl,
            ctl: last.ctl,
            tsb: last.tsb,
            classification,
          }
        : null,
      inputs: {
        restingHr,
        maxHr,
        sex,
        workouts: workouts.length,
        cardioSessions: cardioSessions.length,
      },
    });
  });
}
