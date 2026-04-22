/**
 * Omega-6 : Omega-3 ratio analysis.
 *
 * La dieta occidental moderna tiene ratios 15-20:1, pero estudios
 * epidemiológicos (Simopoulos 2002, 2016) muestran que el ratio óptimo
 * para salud cardiovascular y baja inflamación está entre 1:1 y 4:1.
 *
 * Clasificación:
 *   excellent:  ≤ 4:1    (dieta mediterránea / paleo con pescado)
 *   good:       4-8:1    (dieta balanceada moderna)
 *   poor:       8-15:1   (alta en aceites vegetales procesados)
 *   very_poor:  > 15:1   (ultra-procesados, fast food)
 *   balanced:   N/A cuando omega-3 es 0
 *
 * Referencias:
 *   Simopoulos, A.P. "An Increase in the Omega-6/Omega-3 Fatty Acid Ratio
 *   Increases the Risk for Obesity." Nutrients 2016, 8(3), 128.
 */

export type OmegaClass =
  | "excellent"
  | "good"
  | "poor"
  | "very_poor"
  | "no_omega3"
  | "no_data";

export interface OmegaAnalysis {
  ratio: number | null;   // omega6 / omega3. Null si omega3 === 0 o sin data.
  omega3: number;
  omega6: number;
  classification: OmegaClass;
  recommendation: string;
}

export function analyzeOmegaRatio(
  omega3: number | null | undefined,
  omega6: number | null | undefined,
): OmegaAnalysis {
  const o3 = Number.isFinite(omega3 ?? NaN) ? (omega3 as number) : 0;
  const o6 = Number.isFinite(omega6 ?? NaN) ? (omega6 as number) : 0;

  if (o3 === 0 && o6 === 0) {
    return {
      ratio: null,
      omega3: 0,
      omega6: 0,
      classification: "no_data",
      recommendation:
        "Sin data de omega 3/6. Añade pescado graso (salmón, sardinas), nueces o chía para estimar.",
    };
  }

  if (o3 === 0 && o6 > 0) {
    return {
      ratio: null,
      omega3: 0,
      omega6: o6,
      classification: "no_omega3",
      recommendation:
        "Consumes omega-6 pero cero omega-3 — desbalance inflamatorio. Agrega pescado graso 2-3×/sem o suplemento de aceite de pescado/algas.",
    };
  }

  const ratio = o3 === 0 ? Infinity : o6 / o3;

  let classification: OmegaClass;
  let recommendation: string;

  if (ratio <= 4) {
    classification = "excellent";
    recommendation =
      "Ratio óptimo (≤4:1). Patrón mediterráneo/paleo con pescado — asociado a menor inflamación, mejor perfil lipídico.";
  } else if (ratio <= 8) {
    classification = "good";
    recommendation =
      "Ratio aceptable (4-8:1). Considera más pescado graso, semillas de chía/lino para acercarte a 4:1.";
  } else if (ratio <= 15) {
    classification = "poor";
    recommendation =
      "Ratio alto (8-15:1). Reduce aceites vegetales procesados (maíz, soja, girasol) y aumenta omega-3 marino.";
  } else {
    classification = "very_poor";
    recommendation =
      "Ratio muy alto (>15:1), típico de dieta ultraprocesada. Correlaciona con inflamación crónica. Acción urgente: cambiar fuentes de grasa.";
  }

  return {
    ratio: ratio === Infinity ? null : Math.round(ratio * 10) / 10,
    omega3: Math.round(o3 * 100) / 100,
    omega6: Math.round(o6 * 100) / 100,
    classification,
    recommendation,
  };
}
