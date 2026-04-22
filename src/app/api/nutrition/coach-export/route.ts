import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { computeWeightTrend, eta, etaDate } from "@/lib/nutrition/weight-projection";
import { analyzeProgress } from "@/lib/nutrition/body-composition";

/**
 * GET /api/nutrition/coach-export?days=30
 *
 * Prompt ultra-contextual para Claude/ChatGPT/Gemini con:
 *   - Perfil + meta activa (goalType, targetWeight, targetDate, weeklyRate)
 *   - Resumen de calorías/macros últimos N días + adherencia
 *   - Tendencia de peso (slope + ETA)
 *   - Última composición corporal vs anterior (analyzeProgress pattern)
 *   - Preguntas específicas para coaching
 *
 * Cero costo LLM — el user lo pega en su IA personal.
 */

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
function avg(arr: number[]): number {
  return arr.length ? sum(arr) / arr.length : 0;
}

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const days = Math.min(
      365,
      Math.max(7, Number(req.nextUrl.searchParams.get("days")) || 30),
    );
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    const [profile, goal, meals, weightLogs, comps] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId },
        select: {
          birthDate: true,
          biologicalSex: true,
          heightCm: true,
          weightKg: true,
          activityLevel: true,
          fitnessLevel: true,
          primaryGoals: true,
          units: true,
        },
      }),
      prisma.nutritionGoal.findUnique({ where: { userId } }),
      prisma.mealLog.findMany({
        where: { userId, date: { gte: sinceStr } },
        include: { items: true },
        orderBy: { date: "asc" },
      }),
      prisma.weightLog.findMany({
        where: { userId, date: { gte: sinceStr } },
        orderBy: { date: "asc" },
        select: { date: true, weight: true },
      }),
      prisma.bodyComposition.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

    // Agregación por día
    const byDate: Record<
      string,
      { calories: number; protein: number; carbs: number; fat: number }
    > = {};
    for (const m of meals) {
      if (!byDate[m.date]) byDate[m.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      for (const it of m.items) {
        byDate[m.date].calories += it.calories;
        byDate[m.date].protein += it.protein;
        byDate[m.date].carbs += it.carbs;
        byDate[m.date].fat += it.fat;
      }
    }
    const dayEntries = Object.values(byDate);
    const avgKcal = Math.round(avg(dayEntries.map((d) => d.calories)));
    const avgProtein = Math.round(avg(dayEntries.map((d) => d.protein)));
    const avgCarbs = Math.round(avg(dayEntries.map((d) => d.carbs)));
    const avgFat = Math.round(avg(dayEntries.map((d) => d.fat)));

    const age =
      profile?.birthDate != null
        ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
        : null;

    // Tendencia peso
    const points = weightLogs.map((l) => ({ date: l.date, weightKg: l.weight }));
    const trend = computeWeightTrend(points);
    const currentWeight = points[points.length - 1]?.weightKg;
    const etaDays =
      trend && currentWeight && goal?.targetWeightKg != null
        ? eta({
            currentWeightKg: currentWeight,
            targetWeightKg: goal.targetWeightKg,
            slopeKgPerDay: trend.slopeKgPerDay,
          })
        : null;
    const etaDateStr =
      trend && currentWeight && goal?.targetWeightKg != null
        ? etaDate({
            currentWeightKg: currentWeight,
            targetWeightKg: goal.targetWeightKg,
            slopeKgPerDay: trend.slopeKgPerDay,
          })
        : null;

    // Composición
    const compPattern =
      comps.length >= 2
        ? analyzeProgress(
            {
              ...comps[comps.length - 1],
              waterPercent: comps[comps.length - 1].waterPercent,
            },
            { ...comps[0], waterPercent: comps[0].waterPercent },
          )
        : null;

    // ── Construcción del prompt ───────────────────────────────────────────────
    const lines: string[] = [];
    lines.push(
      `Eres mi coach nutricional. Analiza mis últimos ${days} días y dame insights accionables.`,
    );
    lines.push("");
    lines.push("--- MI PERFIL ---");
    if (age) lines.push(`- Edad: ${age} años`);
    if (profile?.biologicalSex) lines.push(`- Sexo: ${profile.biologicalSex}`);
    if (profile?.heightCm) lines.push(`- Altura: ${profile.heightCm} cm`);
    if (profile?.weightKg) lines.push(`- Peso en perfil: ${profile.weightKg} kg`);
    if (profile?.activityLevel) lines.push(`- Nivel actividad: ${profile.activityLevel}`);
    if (profile?.fitnessLevel) lines.push(`- Nivel fitness: ${profile.fitnessLevel}`);
    if (profile?.primaryGoals?.length) {
      lines.push(`- Objetivos: ${profile.primaryGoals.join(", ")}`);
    }

    lines.push("");
    lines.push("--- META ACTIVA ---");
    if (goal) {
      lines.push(`- Tipo: ${goal.goalType ?? "sin definir"}`);
      lines.push(`- Calorías objetivo: ${goal.calories} kcal`);
      lines.push(`- Macros: P ${goal.protein}g · C ${goal.carbs}g · F ${goal.fat}g`);
      if (goal.targetWeightKg) lines.push(`- Peso objetivo: ${goal.targetWeightKg} kg`);
      if (goal.targetDate) lines.push(`- Fecha objetivo: ${goal.targetDate}`);
      if (goal.weeklyRateKg) lines.push(`- Ritmo planeado: ${goal.weeklyRateKg} kg/semana`);
      if (goal.bmrKcal) lines.push(`- BMR: ${goal.bmrKcal} kcal`);
      if (goal.tdeeKcal) lines.push(`- TDEE: ${goal.tdeeKcal} kcal`);
    } else {
      lines.push("- Sin meta configurada todavía.");
    }

    lines.push("");
    lines.push(`--- INGESTA (${dayEntries.length} días con data de ${days}) ---`);
    lines.push(`- Promedio: ${avgKcal} kcal/día`);
    lines.push(`- Proteína: ${avgProtein}g/día`);
    lines.push(`- Carbs: ${avgCarbs}g/día`);
    lines.push(`- Grasa: ${avgFat}g/día`);
    if (goal?.calories) {
      const delta = avgKcal - goal.calories;
      const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;
      lines.push(`- vs meta: ${deltaStr} kcal/día (${((delta / goal.calories) * 100).toFixed(1)}%)`);
    }

    lines.push("");
    lines.push("--- PESO ---");
    if (trend && currentWeight) {
      lines.push(`- Peso actual: ${currentWeight} kg`);
      lines.push(`- Tendencia: ${trend.weeklyRateKg >= 0 ? "+" : ""}${trend.weeklyRateKg} kg/semana (R² ${trend.r2})`);
      lines.push(`- Rango analizado: ${trend.fromDate} → ${trend.toDate} (${trend.points} registros)`);
      if (etaDays !== null && etaDateStr) {
        lines.push(`- ETA a meta: ${etaDays} días → ${etaDateStr}`);
      } else if (goal?.targetWeightKg) {
        lines.push(`- ETA a meta: imposible con tendencia actual (va en contra o estancado)`);
      }
    } else if (points.length > 0) {
      lines.push(`- ${points.length} registros, insuficientes para trend line`);
    } else {
      lines.push("- Sin registros de peso.");
    }

    if (comps.length > 0) {
      lines.push("");
      lines.push("--- COMPOSICIÓN CORPORAL ---");
      const latest = comps[0];
      lines.push(`- Última (${latest.date}, ${latest.method ?? "método sin especificar"}):`);
      if (latest.weightKg) lines.push(`  · Peso: ${latest.weightKg} kg`);
      if (latest.bodyFatPercent) lines.push(`  · % grasa: ${latest.bodyFatPercent}%`);
      if (latest.leanMassKg) lines.push(`  · Masa magra: ${latest.leanMassKg} kg`);
      if (latest.visceralFat != null) lines.push(`  · Visceral: ${latest.visceralFat}`);
      if (compPattern) {
        lines.push(`- Patrón detectado (vs medición anterior): ${compPattern.pattern}`);
        lines.push(`  · ${compPattern.summary}`);
      }
    }

    lines.push("");
    lines.push("--- PREGUNTAS ---");
    lines.push("1. ¿Mi ingesta actual es consistente con mi meta de peso? ¿Debería ajustar calorías o macros?");
    lines.push("2. ¿Qué patrones detectas en mis datos que pueda mejorar?");
    lines.push("3. Si mi tendencia de peso no coincide con el plan, ¿qué cambios sugieres?");
    lines.push("4. Mira la composición corporal — ¿estoy perdiendo grasa o también músculo? ¿cómo optimizar?");
    lines.push("5. Dame 3 acciones concretas para la próxima semana.");
    lines.push("");
    lines.push("Sé directo, específico y cita números. Evita consejos genéricos.");

    const prompt = lines.join("\n");

    return NextResponse.json({
      prompt,
      days,
      generatedAt: new Date().toISOString(),
      stats: {
        daysLogged: dayEntries.length,
        weightRecords: points.length,
        bodyCompositions: comps.length,
      },
    });
  });
}
