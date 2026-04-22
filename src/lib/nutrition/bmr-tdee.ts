/**
 * BMR (Basal Metabolic Rate) + TDEE (Total Daily Energy Expenditure) helpers.
 *
 * Fórmula principal: Mifflin-St Jeor (1990) — la más precisa para población
 * general según la Academia de Nutrición y Dietética, con error ±10% en 82%
 * de los casos (vs 58% de Harris-Benedict).
 *
 * Referencias:
 *   - Mifflin MD, St Jeor ST. "A new predictive equation for resting energy
 *     expenditure in healthy individuals." Am J Clin Nutr. 1990;51(2):241-247.
 *   - Academy of Nutrition and Dietetics Position Paper (2014) — recommends
 *     Mifflin-St Jeor over HB/K-W for non-obese adults.
 */

export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"   // desk job, no ejercicio
  | "light"       // 1-3 días/semana ejercicio ligero
  | "moderate"    // 3-5 días/semana ejercicio moderado
  | "active"      // 6-7 días/semana ejercicio fuerte
  | "very_active"; // atleta / trabajo físico + ejercicio

export type GoalType = "cut" | "maintain" | "bulk" | "recomp";

// Factores de actividad clásicos (Harris-Benedict / ACSM)
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * BMR Mifflin-St Jeor (kcal/día).
 *
 *   Hombres:  (10 × kg) + (6.25 × cm) − (5 × años) + 5
 *   Mujeres:  (10 × kg) + (6.25 × cm) − (5 × años) − 161
 *
 * Requiere edad ≥ 10, peso 30-300 kg, altura 120-250 cm para dar valores
 * plausibles.
 */
export function mifflinStJeorBMR(args: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { sex, weightKg, heightCm, age } = args;
  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(heightCm) ||
    !Number.isFinite(age) ||
    weightKg <= 0 ||
    heightCm <= 0 ||
    age <= 0
  ) {
    return 0;
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === "male" ? base + 5 : base - 161;
  return Math.max(0, Math.round(bmr));
}

/**
 * Katch-McArdle BMR (más preciso si conoces % grasa).
 * Usa masa magra real en vez de peso total.
 *
 *   BMR = 370 + (21.6 × LBM_kg)    donde LBM = peso × (1 − bf/100)
 */
export function katchMcArdleBMR(args: {
  weightKg: number;
  bodyFatPercent: number;
}): number {
  const { weightKg, bodyFatPercent } = args;
  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(bodyFatPercent) ||
    weightKg <= 0 ||
    bodyFatPercent < 3 ||
    bodyFatPercent > 70
  ) {
    return 0;
  }
  const lbm = weightKg * (1 - bodyFatPercent / 100);
  return Math.round(370 + 21.6 * lbm);
}

/**
 * TDEE = BMR × factor actividad.
 */
export function tdee(bmr: number, activity: ActivityLevel): number {
  if (bmr <= 0) return 0;
  return Math.round(bmr * ACTIVITY_FACTORS[activity]);
}

/**
 * Calorías objetivo según meta (cut/maintain/bulk/recomp).
 *
 * Reglas:
 *   - cut:    déficit 15-20% de TDEE (default 500 kcal/día = ~0.5 kg/semana)
 *   - maintain: TDEE
 *   - bulk:   superávit 10-15% (default 300 kcal/día = ~0.25-0.35 kg/semana)
 *   - recomp: TDEE (en días sin entreno) o +100 (días entreno) — devolvemos TDEE
 *
 * @param tdeeKcal  TDEE calculado
 * @param goal      tipo de meta
 * @param weeklyRateKg  override opcional: kg/semana deseado (negativo para cut)
 *                      7700 kcal ≈ 1 kg grasa corporal
 */
export function targetCaloriesForGoal(
  tdeeKcal: number,
  goal: GoalType,
  weeklyRateKg?: number | null,
): number {
  if (tdeeKcal <= 0) return 0;
  if (goal === "maintain" || goal === "recomp") return tdeeKcal;

  if (weeklyRateKg != null && Number.isFinite(weeklyRateKg)) {
    // 7700 kcal ≈ 1 kg grasa. Ajuste diario = (rate_kcal_semanal) / 7
    const dailyDelta = Math.round((weeklyRateKg * 7700) / 7);
    // Floor 1200 kcal para proteger contra cuts excesivamente agresivos
    return Math.max(1200, tdeeKcal + dailyDelta);
  }

  if (goal === "cut") return Math.max(1200, tdeeKcal - 500);
  if (goal === "bulk") return tdeeKcal + 300;
  return tdeeKcal;
}

/**
 * Distribución de macros por split %  (devuelve gramos).
 *
 * Recomendaciones generales según RDA + ISSN:
 *   - Proteína: 1.6-2.2 g/kg peso para hipertrofia; 2.0-2.4 para cut
 *   - Grasa:    0.5-1.0 g/kg (mínimo 20% calorías para hormonas)
 *   - Carbs:    resto de calorías
 *
 * @param calories  kcal objetivo diarias
 * @param weightKg  peso actual del user
 * @param goal      tipo de meta (afecta proteína)
 */
export function distributeMacros(args: {
  calories: number;
  weightKg: number;
  goal: GoalType;
}): { proteinG: number; carbsG: number; fatG: number } {
  const { calories, weightKg, goal } = args;
  if (calories <= 0 || weightKg <= 0) {
    return { proteinG: 0, carbsG: 0, fatG: 0 };
  }
  // Proteína más alta en cut para preservar masa muscular
  const proteinPerKg = goal === "cut" ? 2.2 : goal === "bulk" ? 1.8 : 2.0;
  const proteinG = Math.round(weightKg * proteinPerKg);
  const proteinKcal = proteinG * 4;
  // Grasa: mínimo 0.8 g/kg, ajustable. Aporta 9 kcal/g.
  const fatG = Math.round(weightKg * 0.9);
  const fatKcal = fatG * 9;
  // Carbs: resto de calorías. 4 kcal/g.
  const remainingKcal = Math.max(0, calories - proteinKcal - fatKcal);
  const carbsG = Math.max(0, Math.round(remainingKcal / 4));
  return { proteinG, carbsG, fatG };
}

/**
 * Clasifica si el rate semanal solicitado es sostenible o agresivo.
 */
export function classifyWeeklyRate(
  weeklyRateKg: number,
  weightKg: number,
): "aggressive" | "moderate" | "conservative" | "very_slow" | "invalid" {
  if (!Number.isFinite(weeklyRateKg) || !Number.isFinite(weightKg) || weightKg <= 0) {
    return "invalid";
  }
  const pctBodyWeight = Math.abs(weeklyRateKg) / weightKg;
  // Regla ISSN: <0.5%/semana moderado, >1%/semana agresivo con riesgo de
  // pérdida muscular (en cut) o ganancia de grasa (en bulk)
  if (pctBodyWeight > 0.01) return "aggressive";
  if (pctBodyWeight > 0.006) return "moderate";
  if (pctBodyWeight > 0.002) return "conservative";
  return "very_slow";
}
