import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { computeWeightTrend, eta, etaDate } from "@/lib/nutrition/weight-projection";
import { analyzeProgress } from "@/lib/nutrition/body-composition";
import { analyzeOmegaRatio } from "@/lib/nutrition/omega-ratio";

/**
 * GET /api/nutrition/coach-export?days=30
 *
 * Prompt ultra-contextual para Claude/ChatGPT/Gemini. Incluye TODA la data
 * nutricional disponible para que la IA del usuario (con contexto grande)
 * pueda dar coaching específico. Cero costo LLM nuestro — el user la pega
 * en claude.ai / chatgpt / gemini.
 *
 * Bloques del prompt:
 *   1. Perfil personal
 *   2. Meta activa (tipo, cals, macros, pace, BMR/TDEE)
 *   3. Ingesta últimos N días (kcal + macros avg + adherencia + streak)
 *   4. Tendencia de peso (slope + R² + ETA vs plan)
 *   5. Composición corporal (última + patrón vs anterior + FFMI si altura)
 *   6. Micronutrientes: deficiencias + excesos con top sources
 *   7. Omega-6:3 ratio + clasificación inflamatoria
 *   8. Marcadores sanguíneos (glucosa, BP, lípidos, A1C, ketones — últimos)
 *   9. Preguntas específicas para coaching
 */

// Daily Values FDA 2020 — espejo del nutrient-report endpoint
const DEFAULT_DV: Record<string, number> = {
  protein: 50, carbs: 275, fat: 78, fiber: 28,
  saturatedFat: 20, cholesterol: 300, sodium: 2300, addedSugar: 50,
  potassium: 4700, calcium: 1300, iron: 18, magnesium: 420, zinc: 11,
  phosphorus: 1250,
  vitaminA: 900, vitaminC: 90, vitaminD: 20, vitaminE: 15, vitaminK: 120,
  thiamin: 1.2, riboflavin: 1.3, niacin: 16, vitaminB6: 1.7,
  folate: 400, vitaminB12: 2.4, leucine: 2500,
};

const NUT_LABEL: Record<string, string> = {
  protein: "Proteína", carbs: "Carbs", fat: "Grasa", fiber: "Fibra",
  saturatedFat: "Grasa saturada", cholesterol: "Colesterol", sodium: "Sodio",
  addedSugar: "Azúcar añadida", potassium: "Potasio", calcium: "Calcio",
  iron: "Hierro", magnesium: "Magnesio", zinc: "Zinc", phosphorus: "Fósforo",
  vitaminA: "Vit A", vitaminC: "Vit C", vitaminD: "Vit D", vitaminE: "Vit E",
  vitaminK: "Vit K", thiamin: "B1", riboflavin: "B2", niacin: "B3",
  vitaminB6: "B6", folate: "Folato", vitaminB12: "B12", leucine: "Leucina",
};

const NUT_UNIT: Record<string, string> = {
  protein: "g", carbs: "g", fat: "g", fiber: "g", saturatedFat: "g",
  cholesterol: "mg", sodium: "mg", addedSugar: "g",
  potassium: "mg", calcium: "mg", iron: "mg", magnesium: "mg", zinc: "mg",
  phosphorus: "mg",
  vitaminA: "μg", vitaminC: "mg", vitaminD: "μg", vitaminE: "mg",
  vitaminK: "μg", thiamin: "mg", riboflavin: "mg", niacin: "mg",
  vitaminB6: "mg", folate: "μg", vitaminB12: "μg", leucine: "mg",
};

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
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

    const [profile, goal, meals, weightLogs, comps, bloodMarkers] = await Promise.all([
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
          conditions: true,
        },
      }),
      prisma.nutritionGoal.findUnique({ where: { userId } }),
      prisma.mealLog.findMany({
        where: { userId, date: { gte: sinceStr } },
        include: { items: { include: { foodItem: true } } },
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
      prisma.bloodMarker.findMany({
        where: { userId, date: { gte: sinceStr } },
        orderBy: [{ date: "desc" }, { measuredAt: "desc" }],
        take: 20,
      }),
    ]);

    // ─── Agregación de ingesta por día + micronutrientes acumulados ────────
    const byDate: Record<
      string,
      { calories: number; protein: number; carbs: number; fat: number }
    > = {};
    const nutrientTotals: Record<string, number> = {};
    let totalOmega3 = 0;
    let totalOmega6 = 0;

    for (const m of meals) {
      if (!byDate[m.date]) byDate[m.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      for (const it of m.items) {
        byDate[m.date].calories += it.calories;
        byDate[m.date].protein += it.protein;
        byDate[m.date].carbs += it.carbs;
        byDate[m.date].fat += it.fat;
        const food = it.foodItem;
        const base = food.servingSize > 0 ? food.servingSize : 100;
        const factor = it.quantity / base;
        for (const nut of Object.keys(DEFAULT_DV)) {
          const raw = (food as unknown as Record<string, unknown>)[nut];
          if (typeof raw === "number" && Number.isFinite(raw)) {
            nutrientTotals[nut] = (nutrientTotals[nut] ?? 0) + raw * factor;
          }
        }
        if (typeof food.omega3 === "number") totalOmega3 += food.omega3 * factor;
        if (typeof food.omega6 === "number") totalOmega6 += food.omega6 * factor;
      }
    }
    const dayEntries = Object.values(byDate);
    const loggedDays = Math.max(1, dayEntries.length);
    const avgKcal = Math.round(avg(dayEntries.map((d) => d.calories)));
    const avgProtein = Math.round(avg(dayEntries.map((d) => d.protein)));
    const avgCarbs = Math.round(avg(dayEntries.map((d) => d.carbs)));
    const avgFat = Math.round(avg(dayEntries.map((d) => d.fat)));

    // Adherencia: días dentro ±10% del target
    const adherenceRate = goal?.calories
      ? Math.round(
          (dayEntries.filter(
            (d) => Math.abs(d.calories - goal.calories) <= goal.calories * 0.1,
          ).length /
            loggedDays) *
            100,
        )
      : null;

    // Streak de adherencia reciente (días consecutivos en meta, contando desde
    // el día más reciente hacia atrás)
    const sortedDates = Object.keys(byDate).sort().reverse();
    let streak = 0;
    if (goal?.calories) {
      for (const d of sortedDates) {
        const dayTotal = byDate[d].calories;
        if (Math.abs(dayTotal - goal.calories) <= goal.calories * 0.1) {
          streak++;
        } else {
          break;
        }
      }
    }

    const age =
      profile?.birthDate != null
        ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
        : null;

    // ─── Peso ──────────────────────────────────────────────────────────────
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

    // ─── Composición corporal (pattern y FFMI si altura disponible) ────────
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

    // ─── Micronutrientes: deficiencias + excesos ───────────────────────────
    const customTargets =
      (goal?.customTargets as Record<string, number> | null) ?? null;
    const targets: Record<string, number> = {
      ...DEFAULT_DV,
      ...(customTargets ?? {}),
    };
    const dailyByNutrient: Record<string, { avg: number; pctDv: number; target: number }> = {};
    for (const [nut, total] of Object.entries(nutrientTotals)) {
      const dailyAvg = total / loggedDays;
      const target = targets[nut] ?? 0;
      if (target > 0) {
        dailyByNutrient[nut] = {
          avg: Math.round(dailyAvg * 10) / 10,
          target,
          pctDv: Math.round((dailyAvg / target) * 100),
        };
      }
    }
    const deficient = Object.entries(dailyByNutrient)
      .filter(([, v]) => v.pctDv < 75)
      .sort(([, a], [, b]) => a.pctDv - b.pctDv)
      .slice(0, 8);
    const excess = Object.entries(dailyByNutrient)
      .filter(([, v]) => v.pctDv > 120)
      .sort(([, a], [, b]) => b.pctDv - a.pctDv)
      .slice(0, 5);

    // ─── Omega ratio ───────────────────────────────────────────────────────
    const omegaAnalysis = analyzeOmegaRatio(totalOmega3, totalOmega6);

    // ─── Construcción del prompt ───────────────────────────────────────────
    const L: string[] = [];
    L.push(
      `Eres mi coach nutricional con formación en ciencias del deporte y nutrición clínica. Analiza mis últimos ${days} días y dame insights accionables. Sé directo y cita números de mis datos.`,
    );
    L.push("");
    L.push("━━━ MI PERFIL ━━━");
    if (age) L.push(`- Edad: ${age} años`);
    if (profile?.biologicalSex) L.push(`- Sexo: ${profile.biologicalSex}`);
    if (profile?.heightCm) L.push(`- Altura: ${profile.heightCm} cm`);
    if (profile?.weightKg) L.push(`- Peso en perfil: ${profile.weightKg} kg`);
    if (profile?.activityLevel) L.push(`- Nivel actividad: ${profile.activityLevel}`);
    if (profile?.fitnessLevel) L.push(`- Nivel fitness: ${profile.fitnessLevel}`);
    if (profile?.primaryGoals?.length) L.push(`- Objetivos primarios: ${profile.primaryGoals.join(", ")}`);
    if (profile?.conditions?.length) L.push(`- Condiciones médicas: ${profile.conditions.join(", ")}`);

    L.push("");
    L.push("━━━ META ACTIVA ━━━");
    if (goal) {
      L.push(`- Tipo: ${goal.goalType ?? "sin definir"}`);
      L.push(`- Calorías objetivo: ${goal.calories} kcal`);
      if (goal.useMacroSplit) {
        L.push(`- Macro split: ${goal.proteinPct}% P · ${goal.carbsPct}% C · ${goal.fatPct}% F`);
      }
      L.push(`- Macros: P ${goal.protein}g · C ${goal.carbs}g · F ${goal.fat}g · fibra ${goal.fiber}g`);
      if (goal.targetWeightKg) L.push(`- Peso objetivo: ${goal.targetWeightKg} kg`);
      if (goal.targetDate) L.push(`- Fecha objetivo: ${goal.targetDate}`);
      if (goal.weeklyRateKg) L.push(`- Ritmo planeado: ${goal.weeklyRateKg >= 0 ? "+" : ""}${goal.weeklyRateKg} kg/semana`);
      if (goal.bmrKcal) L.push(`- BMR calculado: ${goal.bmrKcal} kcal`);
      if (goal.tdeeKcal) L.push(`- TDEE calculado: ${goal.tdeeKcal} kcal`);
      if (customTargets && Object.keys(customTargets).length > 0) {
        L.push(`- Custom micronutrient targets activos: ${Object.keys(customTargets).join(", ")}`);
      }
    } else {
      L.push("- Sin meta configurada todavía.");
    }

    L.push("");
    L.push(`━━━ INGESTA (${dayEntries.length} días con data de ${days}) ━━━`);
    L.push(`- Promedio diario: ${avgKcal} kcal · ${avgProtein}g P · ${avgCarbs}g C · ${avgFat}g F`);
    if (goal?.calories) {
      const delta = avgKcal - goal.calories;
      const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;
      L.push(`- vs meta calórica: ${deltaStr} kcal/día (${((delta / goal.calories) * 100).toFixed(1)}%)`);
    }
    if (adherenceRate != null) L.push(`- Adherencia (±10% de meta): ${adherenceRate}% de los días`);
    if (streak > 0) L.push(`- Streak actual en meta: ${streak} días consecutivos`);

    L.push("");
    L.push("━━━ PESO ━━━");
    if (trend && currentWeight) {
      L.push(`- Peso actual: ${currentWeight} kg`);
      L.push(`- Tendencia: ${trend.weeklyRateKg >= 0 ? "+" : ""}${trend.weeklyRateKg} kg/semana (R² ${trend.r2})`);
      L.push(`- Rango analizado: ${trend.fromDate} → ${trend.toDate} (${trend.points} registros)`);
      if (etaDays !== null && etaDateStr) {
        L.push(`- ETA a meta: ${etaDays} días → ${etaDateStr}`);
      } else if (goal?.targetWeightKg) {
        L.push(`- ETA a meta: imposible con tendencia actual (va en contra o estancado)`);
      }
    } else if (points.length > 0) {
      L.push(`- ${points.length} registros — insuficientes para regresión confiable`);
    } else {
      L.push("- Sin registros de peso en la ventana.");
    }

    if (comps.length > 0) {
      L.push("");
      L.push("━━━ COMPOSICIÓN CORPORAL ━━━");
      const latest = comps[0];
      L.push(`- Última medición (${latest.date}, ${latest.method ?? "método sin especificar"}):`);
      if (latest.weightKg) L.push(`  · Peso: ${latest.weightKg} kg`);
      if (latest.bodyFatPercent) L.push(`  · % grasa: ${latest.bodyFatPercent}%`);
      if (latest.leanMassKg) L.push(`  · Masa magra: ${latest.leanMassKg} kg`);
      if (latest.fatMassKg) L.push(`  · Masa grasa: ${latest.fatMassKg} kg`);
      if (latest.waterPercent) L.push(`  · Agua: ${latest.waterPercent}%`);
      if (latest.visceralFat != null) L.push(`  · Visceral: ${latest.visceralFat}`);
      if (compPattern) {
        L.push(`- Patrón detectado (último vs más antiguo en historial): ${compPattern.pattern}`);
        L.push(`  · ${compPattern.summary}`);
      }
    }

    // Deficiencias
    if (deficient.length > 0) {
      L.push("");
      L.push("━━━ DEFICIENCIAS MICRONUTRIENTES ━━━");
      L.push(`(nutrientes <75% del target — promedio últimos ${loggedDays} días loggeados)`);
      for (const [nut, v] of deficient) {
        const label = NUT_LABEL[nut] ?? nut;
        const unit = NUT_UNIT[nut] ?? "";
        L.push(`- ${label}: ${v.avg}${unit}/día = ${v.pctDv}% DV (target ${v.target}${unit})`);
      }
    }

    if (excess.length > 0) {
      L.push("");
      L.push("━━━ EXCESOS / TOXICIDAD ━━━");
      L.push(`(nutrientes >120% DV — considerar reducir)`);
      for (const [nut, v] of excess) {
        const label = NUT_LABEL[nut] ?? nut;
        const unit = NUT_UNIT[nut] ?? "";
        L.push(`- ${label}: ${v.avg}${unit}/día = ${v.pctDv}% DV`);
      }
    }

    // Omega ratio
    if (omegaAnalysis.classification !== "no_data") {
      L.push("");
      L.push("━━━ RATIO OMEGA-6 : OMEGA-3 ━━━");
      L.push(
        `- Total ingesta: omega-3 ${omegaAnalysis.omega3}g · omega-6 ${omegaAnalysis.omega6}g`,
      );
      if (omegaAnalysis.ratio != null) {
        L.push(`- Ratio: ${omegaAnalysis.ratio} : 1 (${omegaAnalysis.classification})`);
      } else {
        L.push(`- Ratio: indefinido (${omegaAnalysis.classification})`);
      }
      L.push(`- Interpretación: ${omegaAnalysis.recommendation}`);
    }

    // Blood markers
    if (bloodMarkers.length > 0) {
      L.push("");
      L.push("━━━ MARCADORES SANGUÍNEOS ━━━");
      L.push(`(${bloodMarkers.length} registros últimos ${days} días)`);
      const latestMarker = bloodMarkers[0];
      L.push(`Último registro (${latestMarker.date}${latestMarker.context ? ` · ${latestMarker.context}` : ""}):`);
      const bm = latestMarker;
      if (bm.glucoseMgDl != null) L.push(`- Glucosa: ${bm.glucoseMgDl} mg/dL`);
      if (bm.a1cPercent != null) L.push(`- HbA1c: ${bm.a1cPercent}%`);
      if (bm.ketonesMmolL != null) L.push(`- Ketones: ${bm.ketonesMmolL} mmol/L`);
      if (bm.systolic != null && bm.diastolic != null) {
        L.push(`- Presión: ${bm.systolic}/${bm.diastolic} mmHg`);
      }
      if (bm.heartRate != null) L.push(`- FC reposo: ${bm.heartRate} bpm`);
      if (bm.totalCholesterol != null) L.push(`- Colesterol total: ${bm.totalCholesterol}`);
      if (bm.hdl != null) L.push(`- HDL: ${bm.hdl}`);
      if (bm.ldl != null) L.push(`- LDL: ${bm.ldl}`);
      if (bm.triglycerides != null) L.push(`- Triglicéridos: ${bm.triglycerides}`);
      if (bloodMarkers.length > 1) {
        // Tendencia glucosa en ayunas si disponible
        const fastingGlucose = bloodMarkers
          .filter((b) => b.context === "fasting" && b.glucoseMgDl != null)
          .map((b) => b.glucoseMgDl as number);
        if (fastingGlucose.length >= 2) {
          const avgFasting = Math.round(
            avg(fastingGlucose) * 10,
          ) / 10;
          L.push(`- Glucosa ayunas promedio (${fastingGlucose.length} lecturas): ${avgFasting} mg/dL`);
        }
      }
    }

    L.push("");
    L.push("━━━ PREGUNTAS CLAVE ━━━");
    L.push("1. ¿Mi ingesta calórica y macros están alineados con mi meta? ¿Qué ajustarías?");
    L.push("2. Revisa las deficiencias de micronutrientes — ¿qué alimentos específicos recomiendas añadir?");
    L.push("3. ¿El ratio omega-3:6 y el perfil lipídico indican riesgo cardiovascular? ¿Qué cambios concretos?");
    L.push("4. Mira la tendencia de peso + composición corporal: ¿estoy perdiendo grasa o también músculo?");
    L.push("5. Si hay blood markers, ¿cómo se correlacionan con mi dieta? ¿hay señales de alerta?");
    L.push("6. Dame 3 acciones accionables para la próxima semana, priorizando por impacto.");
    L.push("");
    L.push("Formato: respuesta en markdown con secciones claras. Cita números de mis datos. No generalidades.");

    const prompt = L.join("\n");

    return NextResponse.json({
      prompt,
      days,
      generatedAt: new Date().toISOString(),
      stats: {
        daysLogged: dayEntries.length,
        weightRecords: points.length,
        bodyCompositions: comps.length,
        bloodMarkers: bloodMarkers.length,
        deficientNutrients: deficient.length,
        excessNutrients: excess.length,
      },
    });
  });
}
