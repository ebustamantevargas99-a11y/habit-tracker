/**
 * Training Load — modelo Banister (ATL / CTL / TSB) + TRIMP helpers.
 *
 * Referencias:
 *   - Banister, E.W. (1991). "Modeling elite athletic performance." Physiological
 *     testing of elite athletes. Champaign, IL: Human Kinetics.
 *   - Foster, C. (1998). "Monitoring training in athletes with reference to
 *     overtraining syndrome." Med Sci Sports Exerc 30(7):1164-1168.
 *   - Busso, T. (2003). "Variable dose-response relationship between exercise
 *     training and performance." Med Sci Sports Exerc 35(7):1188-1195.
 *
 * Modelo:
 *   TRIMP (Training Impulse) = carga de una sesión única.
 *   ATL (Acute Training Load)   = EWMA con tc=7 días  → fatiga reciente.
 *   CTL (Chronic Training Load) = EWMA con tc=42 días → fitness real.
 *   TSB (Training Stress Balance) = CTL − ATL        → "forma" (+fresco, −cargado).
 *
 * Funciones puras, testeables aisladamente.
 */

// ─── TRIMP de una sesión ─────────────────────────────────────────────────────

/**
 * TRIMP Foster (RPE × duration). Simple y robusto para gym donde no hay HR.
 *
 * @param durationMin  duración en minutos
 * @param rpe          RPE percibido 0-10 del entrenamiento en promedio
 * @returns            unidad arbitraria (AU)
 */
export function trimpFoster(durationMin: number, rpe: number): number {
  if (durationMin <= 0 || rpe <= 0) return 0;
  return Math.round(durationMin * rpe);
}

/**
 * TRIMP Banister (HR-based). Usa HR reserve + factor exponencial por sexo.
 *
 * TRIMP = duration × (HRavg − HRrest)/(HRmax − HRrest) × 0.64 × e^(k · ratio)
 * k = 1.92 (masculino) · 1.67 (femenino)
 *
 * @param durationMin  duración en minutos
 * @param avgHr        HR promedio de la sesión
 * @param restingHr    HR en reposo del user
 * @param maxHr        HR máxima (Tanaka o medida)
 * @param sex          "male" | "female"
 */
export function trimpBanister(
  durationMin: number,
  avgHr: number,
  restingHr: number,
  maxHr: number,
  sex: "male" | "female",
): number {
  if (durationMin <= 0) return 0;
  const hrr = maxHr - restingHr;
  if (hrr <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, (avgHr - restingHr) / hrr));
  const k = sex === "male" ? 1.92 : 1.67;
  return Math.round(durationMin * ratio * 0.64 * Math.exp(k * ratio));
}

/**
 * TRIMP para una sesión de cardio — usa HR si está, fallback RPE × duration.
 */
export function trimpFromCardioSession(args: {
  durationSec: number;
  avgHr?: number | null;
  perceivedExertion?: number | null;
  restingHr?: number | null;
  maxHr?: number | null;
  sex?: "male" | "female" | null;
}): number {
  const durationMin = args.durationSec / 60;
  if (durationMin <= 0) return 0;
  if (
    args.avgHr != null &&
    args.restingHr != null &&
    args.maxHr != null &&
    args.sex != null
  ) {
    return trimpBanister(durationMin, args.avgHr, args.restingHr, args.maxHr, args.sex);
  }
  if (args.perceivedExertion != null && args.perceivedExertion > 0) {
    return trimpFoster(durationMin, args.perceivedExertion);
  }
  // Sin HR ni RPE, estima como actividad moderada (factor 5)
  return Math.round(durationMin * 5);
}

/**
 * TRIMP para una sesión de gym — RPE avg del entreno × duración.
 * Si no hay RPE por set, estima desde volumen (aproximación).
 */
export function trimpFromGymWorkout(args: {
  durationMin: number;
  sets: Array<{ weight: number; reps: number; rpe?: number | null; isWarmup?: boolean }>;
}): number {
  if (args.durationMin <= 0) return 0;
  const workingSets = args.sets.filter((s) => !s.isWarmup);
  if (workingSets.length === 0) return 0;
  const rpes = workingSets
    .map((s) => s.rpe)
    .filter((r): r is number => r != null && r > 0);
  if (rpes.length > 0) {
    const avgRpe = rpes.reduce((a, b) => a + b, 0) / rpes.length;
    return trimpFoster(args.durationMin, avgRpe);
  }
  // Fallback: usa 7 como RPE medio "típico"
  return trimpFoster(args.durationMin, 7);
}

// ─── EWMA ATL / CTL / TSB ────────────────────────────────────────────────────

/**
 * Calcula la serie ATL/CTL/TSB a partir de TRIMPs por día.
 *
 * @param trimpByDate  Map { "YYYY-MM-DD": trimpSum }
 * @param fromDate     fecha inicio (YYYY-MM-DD) — rellena días sin workouts con 0
 * @param toDate       fecha fin (YYYY-MM-DD)
 * @param atlTc        time constant de ATL (default 7 días)
 * @param ctlTc        time constant de CTL (default 42 días)
 */
export interface TrainingLoadPoint {
  date: string;
  trimp: number;
  atl: number;
  ctl: number;
  tsb: number;
}

export function computeAtlCtlTsb(
  trimpByDate: Record<string, number>,
  fromDate: string,
  toDate: string,
  atlTc = 7,
  ctlTc = 42,
): TrainingLoadPoint[] {
  const dates: string[] = [];
  const start = new Date(fromDate + "T00:00:00Z");
  const end = new Date(toDate + "T00:00:00Z");
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }

  const atlDecay = Math.exp(-1 / atlTc);
  const ctlDecay = Math.exp(-1 / ctlTc);

  let atl = 0;
  let ctl = 0;
  const out: TrainingLoadPoint[] = [];

  for (const date of dates) {
    const trimp = trimpByDate[date] ?? 0;
    // EWMA: value_today = decay × value_yesterday + (1 − decay) × input_today
    atl = atlDecay * atl + (1 - atlDecay) * trimp;
    ctl = ctlDecay * ctl + (1 - ctlDecay) * trimp;
    out.push({
      date,
      trimp,
      atl: Math.round(atl * 10) / 10,
      ctl: Math.round(ctl * 10) / 10,
      tsb: Math.round((ctl - atl) * 10) / 10,
    });
  }

  return out;
}

// ─── Clasificación TSB ────────────────────────────────────────────────────────

export type FormStatus =
  | "overreaching" // TSB < -20
  | "loaded"       // -20 ≤ TSB < -10
  | "productive"   // -10 ≤ TSB < 0
  | "neutral"      // 0 ≤ TSB < 5
  | "fresh"        // 5 ≤ TSB < 15
  | "detraining";  // TSB ≥ 15

export interface FormClassification {
  status: FormStatus;
  label: string;
  description: string;
  color: "danger" | "warning" | "info" | "success" | "brand-warm";
}

export function classifyForm(tsb: number): FormClassification {
  if (tsb < -20) {
    return {
      status: "overreaching",
      label: "Sobreesfuerzo",
      description:
        "Carga muy alta sobre tu fitness base. Riesgo de lesión y caída de performance. Considera bajar volumen.",
      color: "danger",
    };
  }
  if (tsb < -10) {
    return {
      status: "loaded",
      label: "Cargado",
      description:
        "Acumulación de fatiga — normal en bloques de volumen alto. No busques PRs ahora.",
      color: "warning",
    };
  }
  if (tsb < 0) {
    return {
      status: "productive",
      label: "Productivo",
      description:
        "Zona productiva — entrenando duro pero manejable. El fitness sube.",
      color: "info",
    };
  }
  if (tsb < 5) {
    return {
      status: "neutral",
      label: "Equilibrio",
      description:
        "Balance entre fatiga y fitness. Entreno sostenible semana a semana.",
      color: "info",
    };
  }
  if (tsb < 15) {
    return {
      status: "fresh",
      label: "Fresco",
      description:
        "Recuperado y listo para una sesión dura o un PR. Ventana ideal para intentar marcas.",
      color: "success",
    };
  }
  return {
    status: "detraining",
    label: "Desentrenamiento",
    description:
      "Llevas mucho descansando — el fitness empieza a caer. Buen momento para reanudar con volumen progresivo.",
    color: "brand-warm",
  };
}

// ─── Readiness score ─────────────────────────────────────────────────────────

/**
 * Calcula un score 0-100 de "listo para entrenar hoy" basado en sliders.
 *
 * Inputs 1-10 (donde 10 = muy positivo; para soreness/stress invertimos porque
 * 10 = mucho dolor/estrés es NEGATIVO).
 *
 * Pesos:
 *   - sleep quality        30%
 *   - soreness (invertido) 20%
 *   - stress (invertido)   15%
 *   - mood                 10%
 *   - energy               15%
 *   - motivation           10%
 */
export interface ReadinessInputs {
  sleepQuality?: number | null;
  soreness?: number | null;
  stress?: number | null;
  mood?: number | null;
  energy?: number | null;
  motivation?: number | null;
  sleepHours?: number | null;
}

const WEIGHTS = {
  sleepQuality: 0.30,
  soreness: 0.20,
  stress: 0.15,
  mood: 0.10,
  energy: 0.15,
  motivation: 0.10,
};

export type Recommendation = "go_hard" | "moderate" | "light" | "rest";

export interface ReadinessResult {
  score: number;
  recommendation: Recommendation;
  label: string;
  description: string;
  color: "success" | "info" | "warning" | "danger";
}

function normalize10(v: number | null | undefined, invert = false): number {
  if (v == null || !Number.isFinite(v)) return 0.5; // neutral default
  const clamped = Math.max(1, Math.min(10, v));
  const base = (clamped - 1) / 9; // 0..1
  return invert ? 1 - base : base;
}

export function computeReadiness(inputs: ReadinessInputs): ReadinessResult {
  // Sleep hours penalty si < 6h
  const sleepHoursScore =
    inputs.sleepHours != null
      ? Math.max(0, Math.min(1, (inputs.sleepHours - 4) / 4))
      : null;

  // Combinación: si hay sleepHours, pondera 40% sleepHours + 60% sleepQuality
  let sleepComponent = normalize10(inputs.sleepQuality, false);
  if (sleepHoursScore != null) {
    sleepComponent = sleepHoursScore * 0.4 + sleepComponent * 0.6;
  }

  const weighted =
    WEIGHTS.sleepQuality * sleepComponent +
    WEIGHTS.soreness * normalize10(inputs.soreness, true) +
    WEIGHTS.stress * normalize10(inputs.stress, true) +
    WEIGHTS.mood * normalize10(inputs.mood, false) +
    WEIGHTS.energy * normalize10(inputs.energy, false) +
    WEIGHTS.motivation * normalize10(inputs.motivation, false);

  const score = Math.round(weighted * 100);

  if (score >= 85) {
    return {
      score,
      recommendation: "go_hard",
      label: "Go hard",
      description:
        "Fresco y listo. Es día de empujar — intenta un PR, series a RPE 9-10, o volumen alto.",
      color: "success",
    };
  }
  if (score >= 65) {
    return {
      score,
      recommendation: "moderate",
      label: "Normal",
      description:
        "Entreno estándar. Mantén RPE 7-8, volumen planeado, no busques marcas absolutas.",
      color: "info",
    };
  }
  if (score >= 40) {
    return {
      score,
      recommendation: "light",
      label: "Ligero",
      description:
        "Volumen reducido a 60-70% planeado. Foco en técnica, RPE 6-7. Evita accesorios pesados.",
      color: "warning",
    };
  }
  return {
    score,
    recommendation: "rest",
    label: "Descanso activo",
    description:
      "Tu cuerpo pide descanso. Paseo, mobility, estiramiento. Entrenar duro hoy multiplicaría fatiga.",
    color: "danger",
  };
}
