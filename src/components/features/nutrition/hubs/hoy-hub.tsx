"use client";

/**
 * Hub "Hoy" — consolida el logger del día.
 *
 * Usa NutritionPro (v2) que ya implementa:
 *   - Logger completo de comidas con search + agregar + editar items
 *   - Meal templates (guardar + aplicar)
 *   - Fotos base64 por comida
 *   - Barcode scanner (OpenFoodFacts)
 *   - Hidratación quick-add integrada
 *   - MacrosRing con distribución P/C/G
 *
 * Fase 2 del rediseño de Nutrición: este hub reemplaza las tabs "Nuevo (Pro)"
 * y "Diario" que duplicaban funcionalidad.
 */

import NutritionPro from "@/components/features/nutrition-v2/nutrition-pro";

export default function HoyHub() {
  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-[24px] text-brand-dark m-0">Hoy</h2>
        <p className="text-brand-warm text-sm m-0 mt-1">
          Tu día en curso — log de comidas con macros, hidratación, templates
          rápidos, foto y barcode scanner.
        </p>
      </header>
      <NutritionPro />
    </section>
  );
}
