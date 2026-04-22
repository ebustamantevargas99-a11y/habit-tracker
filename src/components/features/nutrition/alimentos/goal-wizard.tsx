"use client";

/**
 * Goal Wizard — meta avanzada de peso + composición corporal.
 *
 * Unifica en un solo flujo:
 *   1. Datos de perfil: edad (derivada de birthDate), sexo, altura, peso actual
 *   2. Nivel de actividad (5 opciones ACSM)
 *   3. BMR Mifflin-St Jeor (1990) + TDEE = BMR × factor actividad
 *   4. Tipo de meta: cut / maintain / bulk / recomp
 *   5. Peso objetivo + fecha objetivo (o weeklyRate manual)
 *   6. Cálculo automático de calorías objetivo con floor 1200 kcal
 *   7. Distribución de macros:
 *        - Proteína: 2.2 g/kg cut · 2.0 maintain · 1.8 bulk
 *        - Grasa: 0.9 g/kg
 *        - Carbs: resto
 *   8. Clasificación ISSN del pace solicitado:
 *        - aggressive > 1%/semana (riesgo pérdida muscular en cut)
 *        - moderate 0.6-1%
 *        - conservative 0.2-0.6%
 *        - very_slow < 0.2%
 *
 * Un solo click "Aplicar como meta" escribe TODOS los campos al
 * NutritionGoal (calories + macros + goalType + pesos + fechas + BMR/TDEE).
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calculator,
  Check,
  Info,
  Target,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Card, cn } from "@/components/ui";
import { useUserStore } from "@/stores/user-store";
import { useNutritionStore } from "@/stores/nutrition-store";
import { todayLocal } from "@/lib/date/local";
import {
  ACTIVITY_FACTORS,
  classifyWeeklyRate,
  distributeMacros,
  mifflinStJeorBMR,
  targetCaloriesForGoal,
  tdee,
  type ActivityLevel,
  type GoalType,
  type Sex,
} from "@/lib/nutrition/bmr-tdee";

const ACTIVITY_OPTIONS: Array<{ id: ActivityLevel; label: string; desc: string }> = [
  { id: "sedentary",   label: "Sedentario",      desc: "Oficina, no ejercicio" },
  { id: "light",       label: "Ligero",          desc: "1-3 días ejercicio ligero" },
  { id: "moderate",    label: "Moderado",        desc: "3-5 días ejercicio moderado" },
  { id: "active",      label: "Activo",          desc: "6-7 días ejercicio fuerte" },
  { id: "very_active", label: "Muy activo",      desc: "Atleta / trabajo físico + ejercicio" },
];

const GOAL_OPTIONS: Array<{
  id: GoalType;
  label: string;
  desc: string;
  icon: typeof Target;
  color: string;
}> = [
  { id: "cut",      label: "Cut / déficit",    desc: "Perder grasa preservando músculo", icon: TrendingDown, color: "bg-danger/10 border-danger text-danger" },
  { id: "maintain", label: "Mantenimiento",    desc: "Peso estable, composición igual",  icon: Target,       color: "bg-info/10 border-info text-info" },
  { id: "bulk",     label: "Bulk / superávit", desc: "Ganar masa, algo de grasa permitido", icon: TrendingUp, color: "bg-success/10 border-success text-success" },
  { id: "recomp",   label: "Recomposición",    desc: "Ganar músculo + perder grasa a la vez", icon: Calculator, color: "bg-accent/10 border-accent text-accent" },
];

const RATE_LABEL: Record<
  "aggressive" | "moderate" | "conservative" | "very_slow" | "invalid",
  { label: string; color: string; desc: string }
> = {
  aggressive: {
    label: "Agresivo",
    color: "text-danger",
    desc: ">1% peso/semana. Riesgo de perder músculo en cut o ganar grasa en bulk. Solo sostenible en ventanas cortas.",
  },
  moderate: {
    label: "Moderado",
    color: "text-warning",
    desc: "0.6-1% peso/semana. Rango estándar para cut/bulk con buena retención de composición.",
  },
  conservative: {
    label: "Conservador",
    color: "text-success",
    desc: "0.2-0.6% peso/semana. Óptimo para recomposición y evitar rebote. Recomendado para principiantes.",
  },
  very_slow: {
    label: "Muy lento",
    color: "text-info",
    desc: "<0.2% peso/semana. Casi mantenimiento — útil si eres lean y priorizas performance.",
  },
  invalid: {
    label: "Inválido",
    color: "text-brand-warm",
    desc: "",
  },
};

function ageFromBirthDate(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const birth = new Date(iso);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function GoalWizard() {
  const { user } = useUserStore();
  const { goals, updateGoals } = useNutritionStore();

  const profile = user?.profile;
  const profileAge = ageFromBirthDate(profile?.birthDate ?? null);
  const profileSex: Sex =
    profile?.biologicalSex === "female" ? "female" : "male";
  const tz = profile?.timezone;

  // ─── State ─────────────────────────────────────────────────────────────────

  const [age, setAge] = useState<string>("");
  const [sex, setSex] = useState<Sex>(profileSex);
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goalType, setGoalType] = useState<GoalType>("maintain");
  const [targetWeight, setTargetWeight] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>("");
  const [weeklyRateOverride, setWeeklyRateOverride] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Pre-rellenar desde profile al cargar
  useEffect(() => {
    if (profileAge != null) setAge(String(profileAge));
    setSex(profileSex);
    if (profile?.heightCm != null) setHeightCm(String(profile.heightCm));
    if (profile?.weightKg != null) setWeightKg(String(profile.weightKg));
    if (profile?.activityLevel) {
      const a = profile.activityLevel as ActivityLevel;
      if (ACTIVITY_FACTORS[a] !== undefined) setActivity(a);
    }
    // Si ya hay meta guardada, rellenarla también
    if (goals?.goalType) setGoalType(goals.goalType);
    if (goals?.targetWeightKg != null) setTargetWeight(String(goals.targetWeightKg));
    if (goals?.targetDate) setTargetDate(goals.targetDate);
    if (goals?.weeklyRateKg != null)
      setWeeklyRateOverride(String(goals.weeklyRateKg));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, goals?.goalType]);

  // ─── Cálculos derivados ────────────────────────────────────────────────────

  const ageN = Number(age);
  const heightN = Number(heightCm);
  const weightN = Number(weightKg);
  const targetN = Number(targetWeight);
  const rateOverrideN = weeklyRateOverride ? Number(weeklyRateOverride) : null;

  const canCompute =
    Number.isFinite(ageN) &&
    Number.isFinite(heightN) &&
    Number.isFinite(weightN) &&
    ageN > 0 &&
    heightN > 0 &&
    weightN > 0;

  const bmr = useMemo(
    () =>
      canCompute
        ? mifflinStJeorBMR({ sex, weightKg: weightN, heightCm: heightN, age: ageN })
        : 0,
    [canCompute, sex, weightN, heightN, ageN],
  );

  const tdeeValue = useMemo(() => tdee(bmr, activity), [bmr, activity]);

  // Weekly rate calculado desde peso actual → meta en la ventana de fechas
  const computedWeeklyRate = useMemo(() => {
    if (rateOverrideN != null && Number.isFinite(rateOverrideN)) {
      return rateOverrideN;
    }
    if (goalType === "maintain" || goalType === "recomp") return 0;
    if (!Number.isFinite(targetN) || targetN <= 0 || !targetDate) return null;
    const start = todayLocal(tz);
    const startMs = new Date(`${start}T12:00:00Z`).getTime();
    const endMs = new Date(`${targetDate}T12:00:00Z`).getTime();
    const weeks = (endMs - startMs) / (1000 * 60 * 60 * 24 * 7);
    if (weeks <= 0) return null;
    const deltaKg = targetN - weightN;
    return deltaKg / weeks;
  }, [rateOverrideN, goalType, targetN, targetDate, weightN, tz]);

  const targetCalories = useMemo(() => {
    if (!tdeeValue) return 0;
    return targetCaloriesForGoal(
      tdeeValue,
      goalType,
      computedWeeklyRate ?? undefined,
    );
  }, [tdeeValue, goalType, computedWeeklyRate]);

  const macros = useMemo(() => {
    if (!targetCalories || !Number.isFinite(weightN) || weightN <= 0) {
      return { proteinG: 0, carbsG: 0, fatG: 0 };
    }
    return distributeMacros({ calories: targetCalories, weightKg: weightN, goal: goalType });
  }, [targetCalories, weightN, goalType]);

  const paceClass = useMemo(() => {
    if (
      computedWeeklyRate == null ||
      !Number.isFinite(weightN) ||
      weightN <= 0
    ) {
      return null;
    }
    if (Math.abs(computedWeeklyRate) < 0.001) return null;
    return classifyWeeklyRate(computedWeeklyRate, weightN);
  }, [computedWeeklyRate, weightN]);

  // ETA si no dio fecha pero sí weeklyRate
  const derivedETADate = useMemo(() => {
    if (targetDate) return targetDate;
    if (computedWeeklyRate == null || Math.abs(computedWeeklyRate) < 0.01) return null;
    if (!Number.isFinite(targetN) || targetN <= 0) return null;
    const deltaKg = targetN - weightN;
    const weeks = deltaKg / computedWeeklyRate;
    if (!Number.isFinite(weeks) || weeks <= 0) return null;
    const d = new Date();
    d.setDate(d.getDate() + Math.round(weeks * 7));
    return d.toISOString().slice(0, 10);
  }, [targetDate, computedWeeklyRate, targetN, weightN]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function applyGoal() {
    if (!canCompute || !tdeeValue) {
      toast.error("Rellena edad, altura y peso primero");
      return;
    }
    setSaving(true);
    try {
      const startDateStr = todayLocal(tz);
      const payload = {
        calories: Math.round(targetCalories),
        protein: macros.proteinG,
        carbs: macros.carbsG,
        fat: macros.fatG,
        goalType,
        targetWeightKg:
          Number.isFinite(targetN) && targetN > 0 ? targetN : null,
        startWeightKg: weightN,
        startDate: startDateStr,
        targetDate: derivedETADate ?? null,
        weeklyRateKg:
          computedWeeklyRate != null && Math.abs(computedWeeklyRate) > 0.001
            ? Math.round(computedWeeklyRate * 100) / 100
            : null,
        bmrKcal: bmr,
        tdeeKcal: tdeeValue,
        activityFactor: ACTIVITY_FACTORS[activity],
      };
      await updateGoals(payload);
      toast.success("Meta aplicada · tus calorías y macros se actualizaron");
    } catch {
      toast.error("Error guardando la meta");
    } finally {
      setSaving(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <h3 className="font-serif text-lg text-brand-dark m-0 mb-1 flex items-center gap-2">
          <Calculator size={18} className="text-accent" /> Wizard de meta avanzada
        </h3>
        <p className="text-brand-warm text-sm m-0 mb-4">
          Calcula BMR + TDEE (Mifflin-St Jeor, error ±10%), valida el pace contra
          ISSN y aplica calorías + macros automáticos. Si tienes tu peso objetivo
          y fecha, calcula el déficit/superávit necesario. Se puede sobrescribir
          manualmente después desde el sub-tab &quot;Metas manuales&quot;.
        </p>

        {/* Perfil base */}
        <SectionLabel>Paso 1 — Datos base</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Field label="Edad">
            <NumInput value={age} onChange={setAge} placeholder="26" />
          </Field>
          <Field label="Sexo biológico">
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
              className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm"
            >
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
            </select>
          </Field>
          <Field label="Altura (cm)">
            <NumInput value={heightCm} onChange={setHeightCm} placeholder="175" />
          </Field>
          <Field label="Peso actual (kg)">
            <NumInput value={weightKg} onChange={setWeightKg} placeholder="80" step="0.1" />
          </Field>
        </div>

        {/* Actividad */}
        <SectionLabel>Paso 2 — Nivel de actividad</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-5">
          {ACTIVITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActivity(opt.id)}
              className={cn(
                "rounded-lg border p-3 text-left transition",
                activity === opt.id
                  ? "border-accent bg-accent/10"
                  : "border-brand-light-cream bg-brand-paper hover:border-accent/50",
              )}
            >
              <p className="text-xs font-semibold text-brand-dark m-0">
                {opt.label}
              </p>
              <p className="text-[10px] text-brand-warm m-0 mt-0.5">{opt.desc}</p>
              <p className="text-[10px] text-accent font-mono m-0 mt-1">
                × {ACTIVITY_FACTORS[opt.id]}
              </p>
            </button>
          ))}
        </div>

        {/* BMR/TDEE resultados */}
        {canCompute && (
          <Card
            variant="default"
            padding="sm"
            className="bg-accent/5 border-accent mb-5"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatBox
                label="BMR · reposo"
                value={`${bmr.toLocaleString()} kcal`}
                sub="Mifflin-St Jeor"
              />
              <StatBox
                label="TDEE · mantenimiento"
                value={`${tdeeValue.toLocaleString()} kcal`}
                sub={`BMR × ${ACTIVITY_FACTORS[activity]}`}
              />
              <StatBox
                label="Rango seguro cut"
                value={`${Math.max(1200, tdeeValue - 500).toLocaleString()} – ${Math.max(1200, tdeeValue - 250).toLocaleString()}`}
                sub="Déficit 250-500 kcal"
              />
            </div>
          </Card>
        )}

        {/* Goal type */}
        <SectionLabel>Paso 3 — Tipo de meta</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-5">
          {GOAL_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setGoalType(opt.id)}
                className={cn(
                  "rounded-lg border-2 p-3 text-left transition",
                  goalType === opt.id
                    ? opt.color
                    : "border-brand-light-cream bg-brand-paper text-brand-dark hover:border-accent/50",
                )}
              >
                <Icon size={18} className="mb-1" />
                <p className="text-sm font-semibold m-0">{opt.label}</p>
                <p className="text-[11px] opacity-80 m-0 mt-0.5">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Peso objetivo + fecha (solo si no es maintain) */}
        {goalType !== "maintain" && goalType !== "recomp" && (
          <>
            <SectionLabel>Paso 4 — Peso objetivo + fecha</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <Field label="Peso meta (kg)">
                <NumInput
                  value={targetWeight}
                  onChange={setTargetWeight}
                  placeholder={goalType === "cut" ? "72" : "84"}
                  step="0.1"
                />
              </Field>
              <Field label="Fecha objetivo">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm"
                />
              </Field>
              <Field label="O: rate manual (kg/sem)">
                <NumInput
                  value={weeklyRateOverride}
                  onChange={setWeeklyRateOverride}
                  placeholder={goalType === "cut" ? "-0.5" : "0.3"}
                  step="0.05"
                />
              </Field>
            </div>

            {paceClass && paceClass !== "invalid" && (
              <Card
                variant="default"
                padding="sm"
                className={cn(
                  "mb-5",
                  paceClass === "aggressive" && "border-danger bg-danger-light/30",
                  paceClass === "moderate" && "border-warning bg-warning-light/30",
                  paceClass === "conservative" && "border-success bg-success/10",
                  paceClass === "very_slow" && "border-info bg-info/10",
                )}
              >
                <div className="flex items-start gap-2">
                  {paceClass === "aggressive" ? (
                    <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
                  ) : (
                    <Info size={16} className="text-brand-dark shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm m-0">
                      Pace solicitado:{" "}
                      <strong className={RATE_LABEL[paceClass].color}>
                        {(computedWeeklyRate ?? 0) > 0 ? "+" : ""}
                        {(computedWeeklyRate ?? 0).toFixed(2)} kg/sem
                      </strong>{" "}
                      → <strong>{RATE_LABEL[paceClass].label}</strong>
                    </p>
                    <p className="text-xs text-brand-warm m-0 mt-0.5">
                      {RATE_LABEL[paceClass].desc}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {derivedETADate && !targetDate && (
              <p className="text-xs text-brand-warm m-0 mb-5">
                📅 ETA estimada: <strong>{derivedETADate}</strong> (calculada
                desde el rate manual).
              </p>
            )}
          </>
        )}

        {/* Resultado final */}
        {canCompute && targetCalories > 0 && (
          <Card
            variant="default"
            padding="md"
            className="bg-brand-warm-white border-brand-dark border-2"
          >
            <h4 className="font-serif text-base text-brand-dark m-0 mb-3">
              Tu plan nutricional diario
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <StatBox
                label="Calorías"
                value={`${targetCalories.toLocaleString()} kcal`}
                emphasized
              />
              <StatBox
                label="Proteína"
                value={`${macros.proteinG} g`}
                sub={`${((macros.proteinG * 4 / targetCalories) * 100).toFixed(0)}% · ${(macros.proteinG / weightN).toFixed(1)} g/kg`}
              />
              <StatBox
                label="Carbs"
                value={`${macros.carbsG} g`}
                sub={`${((macros.carbsG * 4 / targetCalories) * 100).toFixed(0)}%`}
              />
              <StatBox
                label="Grasa"
                value={`${macros.fatG} g`}
                sub={`${((macros.fatG * 9 / targetCalories) * 100).toFixed(0)}%`}
              />
            </div>

            {targetCalories === 1200 && tdeeValue - 500 < 1200 && (
              <p className="text-xs text-warning flex items-center gap-1 m-0 mb-3">
                <AlertTriangle size={12} /> Límite inferior (1200 kcal) aplicado
                para proteger salud hormonal. El rate efectivo será menor al
                solicitado.
              </p>
            )}

            <button
              onClick={applyGoal}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-brand-dark text-brand-cream font-semibold text-sm hover:bg-brand-brown transition disabled:opacity-40"
            >
              <Check size={14} />
              {saving ? "Aplicando…" : "Aplicar como meta"}
            </button>
          </Card>
        )}
      </Card>

      {/* Hint didáctico */}
      <Card variant="default" padding="sm" className="border-brand-light-tan">
        <p className="text-xs text-brand-warm m-0 flex items-start gap-2">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>
            La fórmula Mifflin-St Jeor es la recomendada por la Academy of
            Nutrition and Dietetics (2014). 7700 kcal ≈ 1 kg de grasa. Proteína
            alta (≥2 g/kg) preserva masa muscular en cut. Floor de 1200 kcal
            protege función hormonal.
          </span>
        </p>
      </Card>
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 mb-2">
      {children}
    </p>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  placeholder,
  step = "1",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm"
    />
  );
}

function StatBox({
  label,
  value,
  sub,
  emphasized,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 border border-brand-light-cream",
        emphasized ? "bg-accent/10" : "bg-brand-paper",
      )}
    >
      <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
        {label}
      </p>
      <p
        className={cn(
          "font-mono m-0 mt-0.5",
          emphasized ? "text-xl text-accent" : "text-lg text-brand-dark",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-brand-warm m-0 mt-0.5">{sub}</p>}
    </div>
  );
}
