/**
 * Body composition analysis (bioimpedancia / DEXA / Navy tape / etc.)
 *
 * Funciones puras para:
 *   - Clasificar % grasa corporal por edad + sexo (ACE + ACSM)
 *   - Clasificar grasa visceral
 *   - Derivar masa magra / grasa si solo se ingresa peso + % grasa
 *   - Detectar patrón de progreso (recomp, hipertrofia, pérdida grasa, etc.)
 *   - Navy tape formula para estimar % grasa sin bioimpedancia
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Sex = "male" | "female";

export interface BodyCompositionPoint {
  date: string;              // YYYY-MM-DD
  weightKg: number | null;
  bodyFatPercent: number | null;
  leanMassKg: number | null;
  fatMassKg: number | null;
  waterPercent?: number | null;
  visceralFat?: number | null;
  boneMassKg?: number | null;
  bmr?: number | null;
  method?: string | null;    // dexa | bia | caliper | navy_tape | photo_estimate | scale
  notes?: string | null;
}

// ─── Categorías ACE (American Council on Exercise) ────────────────────────────
// Referencia estándar citada por ACSM y la mayoría de báscuas de bioimpedancia.

export type BodyFatCategory =
  | "essential"   // hombres 2-5 · mujeres 10-13
  | "athletes"    // hombres 6-13 · mujeres 14-20
  | "fitness"     // hombres 14-17 · mujeres 21-24
  | "average"     // hombres 18-24 · mujeres 25-31
  | "obese";      // hombres 25+ · mujeres 32+

export function classifyBodyFat(
  bodyFatPercent: number,
  sex: Sex,
): BodyFatCategory {
  if (sex === "male") {
    if (bodyFatPercent < 6) return "essential";
    if (bodyFatPercent < 14) return "athletes";
    if (bodyFatPercent < 18) return "fitness";
    if (bodyFatPercent < 25) return "average";
    return "obese";
  }
  if (bodyFatPercent < 14) return "essential";
  if (bodyFatPercent < 21) return "athletes";
  if (bodyFatPercent < 25) return "fitness";
  if (bodyFatPercent < 32) return "average";
  return "obese";
}

const BODY_FAT_LABELS: Record<BodyFatCategory, { label: string; color: string }> = {
  essential:  { label: "Esencial",       color: "info"    },
  athletes:   { label: "Atleta",         color: "success" },
  fitness:    { label: "Fitness",        color: "success" },
  average:    { label: "Promedio",       color: "warning" },
  obese:      { label: "Elevado",        color: "danger"  },
};

export function bodyFatLabel(
  bodyFatPercent: number,
  sex: Sex,
): { label: string; color: "info" | "success" | "warning" | "danger" } {
  const cat = classifyBodyFat(bodyFatPercent, sex);
  return BODY_FAT_LABELS[cat] as { label: string; color: "info" | "success" | "warning" | "danger" };
}

// ─── Grasa visceral (escala 1-60 típica de Tanita/Omron/InBody) ───────────────

export type VisceralCategory = "healthy" | "elevated" | "high";

export function classifyVisceralFat(level: number): VisceralCategory {
  if (!Number.isFinite(level) || level < 0) return "healthy";
  if (level <= 9) return "healthy";
  if (level <= 14) return "elevated";
  return "high";
}

// ─── Derivaciones automáticas ─────────────────────────────────────────────────

/**
 * Si el user ingresa peso + % grasa, derivamos LBM y fat mass.
 * Si ingresa peso + LBM, derivamos % grasa.
 * Devuelve lo que falta completar; no sobreescribe valores explícitos.
 */
export function deriveMissingFields(
  input: Partial<BodyCompositionPoint>,
): Partial<BodyCompositionPoint> {
  const { weightKg, bodyFatPercent, leanMassKg, fatMassKg } = input;
  const out: Partial<BodyCompositionPoint> = { ...input };

  if (weightKg != null && weightKg > 0) {
    if (bodyFatPercent != null && bodyFatPercent > 0 && bodyFatPercent < 70) {
      if (fatMassKg == null) {
        out.fatMassKg = Math.round(weightKg * (bodyFatPercent / 100) * 100) / 100;
      }
      if (leanMassKg == null) {
        out.leanMassKg = Math.round(weightKg * (1 - bodyFatPercent / 100) * 100) / 100;
      }
    } else if (leanMassKg != null && leanMassKg > 0 && leanMassKg < weightKg) {
      if (fatMassKg == null) {
        out.fatMassKg = Math.round((weightKg - leanMassKg) * 100) / 100;
      }
      if (bodyFatPercent == null) {
        out.bodyFatPercent = Math.round(((weightKg - leanMassKg) / weightKg) * 1000) / 10;
      }
    }
  }

  return out;
}

// ─── Navy tape method — estimación de % grasa sin bioimpedancia ──────────────
// Fórmula de Hodgdon & Beckett (1984), adoptada por US Navy. Solo requiere
// cinta métrica. Precisión aprox ±3%, buena para tracking de cambios.

/**
 * Navy tape para hombres.
 *   BF% = 495 / (1.0324 − 0.19077 × log10(cintura − cuello) + 0.15456 × log10(altura)) − 450
 * Unidades: cm.
 */
export function navyTapeMale(
  waistCm: number,
  neckCm: number,
  heightCm: number,
): number | null {
  if (waistCm <= neckCm || heightCm <= 0) return null;
  const log1 = Math.log10(waistCm - neckCm);
  const log2 = Math.log10(heightCm);
  const bf = 495 / (1.0324 - 0.19077 * log1 + 0.15456 * log2) - 450;
  if (!Number.isFinite(bf) || bf < 2 || bf > 60) return null;
  return Math.round(bf * 10) / 10;
}

/**
 * Navy tape para mujeres. Añade medición de cadera.
 *   BF% = 495 / (1.29579 − 0.35004 × log10(cintura + cadera − cuello) + 0.22100 × log10(altura)) − 450
 */
export function navyTapeFemale(
  waistCm: number,
  hipCm: number,
  neckCm: number,
  heightCm: number,
): number | null {
  if (waistCm + hipCm <= neckCm || heightCm <= 0) return null;
  const log1 = Math.log10(waistCm + hipCm - neckCm);
  const log2 = Math.log10(heightCm);
  const bf = 495 / (1.29579 - 0.35004 * log1 + 0.22100 * log2) - 450;
  if (!Number.isFinite(bf) || bf < 5 || bf > 60) return null;
  return Math.round(bf * 10) / 10;
}

// ─── Análisis de progreso (comparar dos mediciones) ──────────────────────────

export type ProgressPattern =
  | "recomp"           // peso estable ±0.5kg, baja %grasa o sube LBM
  | "hypertrophy"      // sube peso, mayor parte LBM
  | "fat_loss"         // baja peso, mayor parte fat mass
  | "fat_gain"         // sube peso, mayor parte fat mass
  | "muscle_loss"      // baja peso, baja LBM (mal en cut)
  | "stable"           // sin cambio significativo
  | "insufficient";    // falta data

export interface ProgressAnalysis {
  pattern: ProgressPattern;
  weightDeltaKg: number;
  leanDeltaKg: number | null;
  fatDeltaKg: number | null;
  bodyFatDeltaPct: number | null;
  daysBetween: number;
  summary: string;
}

/**
 * Compara dos mediciones (orden cronológico: earlier → later) y devuelve
 * qué patrón se observa. Útil para feedback automático al user.
 */
export function analyzeProgress(
  earlier: BodyCompositionPoint,
  later: BodyCompositionPoint,
): ProgressAnalysis {
  const daysBetween = Math.round(
    (new Date(`${later.date}T12:00:00Z`).getTime() -
      new Date(`${earlier.date}T12:00:00Z`).getTime()) /
      86_400_000,
  );

  if (
    earlier.weightKg == null ||
    later.weightKg == null ||
    daysBetween <= 0
  ) {
    return {
      pattern: "insufficient",
      weightDeltaKg: 0,
      leanDeltaKg: null,
      fatDeltaKg: null,
      bodyFatDeltaPct: null,
      daysBetween,
      summary: "Datos insuficientes para análisis.",
    };
  }

  const wΔ = Math.round((later.weightKg - earlier.weightKg) * 100) / 100;
  const leanΔ =
    earlier.leanMassKg != null && later.leanMassKg != null
      ? Math.round((later.leanMassKg - earlier.leanMassKg) * 100) / 100
      : null;
  const fatΔ =
    earlier.fatMassKg != null && later.fatMassKg != null
      ? Math.round((later.fatMassKg - earlier.fatMassKg) * 100) / 100
      : null;
  const bfΔ =
    earlier.bodyFatPercent != null && later.bodyFatPercent != null
      ? Math.round((later.bodyFatPercent - earlier.bodyFatPercent) * 10) / 10
      : null;

  // Patrón
  let pattern: ProgressPattern = "stable";
  let summary = "";

  const stableWeight = Math.abs(wΔ) < 0.8;

  if (stableWeight && leanΔ != null && fatΔ != null) {
    // Peso estable pero composición cambió → recomp
    if (Math.abs(leanΔ) > 0.5 || Math.abs(fatΔ) > 0.5) {
      if (leanΔ > 0 && fatΔ < 0) {
        pattern = "recomp";
        summary = `Recomposición corporal: peso estable pero +${leanΔ.toFixed(1)}kg masa magra y ${fatΔ.toFixed(1)}kg grasa. Caso de oro.`;
      } else {
        pattern = "stable";
        summary = "Peso y composición estables.";
      }
    } else {
      pattern = "stable";
      summary = "Peso y composición estables.";
    }
  } else if (wΔ >= 0.8) {
    // Subió peso. ¿Músculo o grasa?
    if (leanΔ != null && fatΔ != null) {
      if (leanΔ > fatΔ) {
        pattern = "hypertrophy";
        const leanPct = Math.round((leanΔ / wΔ) * 100);
        summary = `Hipertrofia: subiste ${wΔ.toFixed(1)}kg y ${leanPct}% fue masa magra. Excelente bulk.`;
      } else {
        pattern = "fat_gain";
        const fatPct = Math.round((fatΔ / wΔ) * 100);
        summary = `Subiste ${wΔ.toFixed(1)}kg pero ${fatPct}% fue grasa. Considera ajustar superávit.`;
      }
    } else {
      pattern = "hypertrophy";
      summary = `Subiste ${wΔ.toFixed(1)}kg. Sin datos de composición para desglosar.`;
    }
  } else if (wΔ <= -0.8) {
    // Bajó peso. ¿Grasa o músculo?
    if (leanΔ != null && fatΔ != null) {
      if (fatΔ < leanΔ) {
        pattern = "fat_loss";
        const fatPct = Math.round((Math.abs(fatΔ) / Math.abs(wΔ)) * 100);
        summary = `Pérdida de grasa: bajaste ${Math.abs(wΔ).toFixed(1)}kg y ${fatPct}% fue grasa. Cut efectivo.`;
      } else {
        pattern = "muscle_loss";
        const leanPct = Math.round((Math.abs(leanΔ) / Math.abs(wΔ)) * 100);
        summary = `Bajaste ${Math.abs(wΔ).toFixed(1)}kg pero ${leanPct}% fue músculo. Sube proteína o considera deload.`;
      }
    } else {
      pattern = "fat_loss";
      summary = `Bajaste ${Math.abs(wΔ).toFixed(1)}kg. Sin datos de composición para desglosar.`;
    }
  }

  return {
    pattern,
    weightDeltaKg: wΔ,
    leanDeltaKg: leanΔ,
    fatDeltaKg: fatΔ,
    bodyFatDeltaPct: bfΔ,
    daysBetween,
    summary,
  };
}

// ─── FFMI — Fat-Free Mass Index ──────────────────────────────────────────────
// Métrica popular en powerlifting/bodybuilding para cuantificar músculo
// relativo a altura. Un FFMI "natural" típico es 18-22; >25 sugiere enhanced.

/**
 * FFMI ajustado a altura 1.80m (normalización de Kouri et al. 1995).
 *   FFMI = LBM / altura² + 6.1 × (1.8 − altura)
 */
export function ffmi(leanMassKg: number, heightCm: number): number | null {
  if (leanMassKg <= 0 || heightCm <= 0) return null;
  const hM = heightCm / 100;
  const base = leanMassKg / (hM * hM);
  const adjusted = base + 6.1 * (1.8 - hM);
  return Math.round(adjusted * 10) / 10;
}

export function classifyFFMI(
  ffmiValue: number,
  sex: Sex,
): "below_average" | "average" | "above_average" | "excellent" | "suspicious" {
  const t =
    sex === "male"
      ? { below: 18, avg: 20, above: 22, excellent: 25 }
      : { below: 14, avg: 17, above: 19, excellent: 21 };
  if (ffmiValue < t.below) return "below_average";
  if (ffmiValue < t.avg) return "average";
  if (ffmiValue < t.above) return "above_average";
  if (ffmiValue < t.excellent) return "excellent";
  return "suspicious";
}
