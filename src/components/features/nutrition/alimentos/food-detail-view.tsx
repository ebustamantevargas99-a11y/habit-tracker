"use client";

/**
 * Detalle completo de un alimento custom — muestra todos los nutrientes
 * registrados con porcentaje del Daily Value (FDA 2020 adulto 2000 kcal).
 *
 * Muestra solo las secciones donde hay datos (si el usuario no ingresó
 * ningún mineral, la sección "Minerales" no aparece).
 *
 * Referencias %DV: FDA Daily Value 2020 (21 CFR 101.9):
 *   https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels
 */

import { Pencil, Trash2, X } from "lucide-react";
import { Card, cn } from "@/components/ui";
import type { FoodItem } from "@/stores/nutrition-store";

// ─── Daily Values FDA 2020 (adulto 2000 kcal) ───────────────────────────────
// Valor en unidad canónica del campo correspondiente.
const DV: Record<string, number> = {
  // Macros
  fat: 78,            // g
  saturatedFat: 20,   // g
  cholesterol: 300,   // mg
  sodium: 2300,       // mg
  carbs: 275,         // g
  fiber: 28,          // g
  addedSugar: 50,     // g
  protein: 50,        // g
  // Minerales (mg, salvo indicado)
  potassium: 4700,
  calcium: 1300,
  iron: 18,
  magnesium: 420,
  zinc: 11,
  phosphorus: 1250,
  // Vitaminas (FDA DV canónicas)
  vitaminA: 900,      // μg RAE
  vitaminC: 90,       // mg
  vitaminD: 20,       // μg
  vitaminE: 15,       // mg α-tocoferol
  vitaminK: 120,      // μg
  thiamin: 1.2,       // mg
  riboflavin: 1.3,    // mg
  niacin: 16,         // mg
  vitaminB6: 1.7,     // mg
  folate: 400,        // μg
  vitaminB12: 2.4,    // μg
};

interface Props {
  food: FoodItem;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function FoodDetailView({
  food,
  onEdit,
  onDelete,
  onClose,
}: Props) {
  // Helpers
  const kcalFromMacros =
    (food.protein ?? 0) * 4 + (food.carbs ?? 0) * 4 + (food.fat ?? 0) * 9;
  const macroMismatch =
    food.calories > 0 &&
    Math.abs(kcalFromMacros - food.calories) > Math.max(10, food.calories * 0.1);

  const hasBreakdown = hasAny(food, [
    "saturatedFat", "transFat", "monoFat", "polyFat",
    "omega3", "omega6", "cholesterol", "addedSugar",
  ]);
  const hasMinerals = hasAny(food, [
    "potassium", "calcium", "iron", "magnesium", "zinc", "phosphorus",
  ]);
  const hasVitamins = hasAny(food, [
    "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminK",
    "thiamin", "riboflavin", "niacin", "vitaminB6", "folate", "vitaminB12",
  ]);
  const hasOthers = hasAny(food, ["caffeine", "alcohol", "water"]);

  return (
    <Card
      variant="default"
      padding="md"
      className="border-accent flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif text-xl text-brand-dark m-0">
            {food.name}
          </h3>
          <p className="text-xs text-brand-warm m-0 mt-0.5 flex items-center gap-2 flex-wrap">
            {food.brand && <span>{food.brand}</span>}
            {food.category && (
              <span className="px-2 py-0.5 rounded-full bg-brand-cream text-brand-medium">
                {food.category}
              </span>
            )}
            <span className="font-mono">
              {food.servingSize} {food.servingUnit}
            </span>
            {food.barcode && (
              <span className="font-mono text-brand-tan">#{food.barcode}</span>
            )}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-2 rounded hover:bg-accent/10 text-accent"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded hover:bg-danger-light/40 text-danger"
            title="Borrar"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-brand-cream text-brand-warm"
            title="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Macros principales (siempre) */}
      <div>
        <SectionTitle>Macros principales</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BigStat
            label="Calorías"
            value={`${Math.round(food.calories)}`}
            unit="kcal"
            emphasized
          />
          <BigStat
            label="Proteína"
            value={fmt(food.protein)}
            unit="g"
            dv={pct(food.protein, DV.protein)}
          />
          <BigStat
            label="Carbs"
            value={fmt(food.carbs)}
            unit="g"
            dv={pct(food.carbs, DV.carbs)}
          />
          <BigStat
            label="Grasa"
            value={fmt(food.fat)}
            unit="g"
            dv={pct(food.fat, DV.fat)}
          />
          <BigStat
            label="Fibra"
            value={fmt(food.fiber)}
            unit="g"
            dv={pct(food.fiber, DV.fiber)}
          />
          <BigStat label="Azúcares" value={fmt(food.sugar)} unit="g" />
          <BigStat
            label="Sodio"
            value={fmt(food.sodium)}
            unit="mg"
            dv={pct(food.sodium, DV.sodium)}
          />
        </div>
        {macroMismatch && (
          <p className="text-xs text-warning m-0 mt-2">
            ⚠️ Los macros suman {Math.round(kcalFromMacros)} kcal pero
            registraste {food.calories} kcal. Diferencia{" "}
            {Math.round(Math.abs(kcalFromMacros - food.calories))} kcal —
            revisa los datos o añade alcohol/fibra.
          </p>
        )}
      </div>

      {/* Desglose */}
      {hasBreakdown && (
        <div>
          <SectionTitle>Desglose de macros</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <NutRow
              label="Saturada"
              value={food.saturatedFat}
              unit="g"
              dv={pct(food.saturatedFat, DV.saturatedFat)}
            />
            <NutRow label="Trans" value={food.transFat} unit="g" />
            <NutRow label="Monoinsaturada" value={food.monoFat} unit="g" />
            <NutRow label="Poliinsaturada" value={food.polyFat} unit="g" />
            <NutRow label="Omega-3" value={food.omega3} unit="g" />
            <NutRow label="Omega-6" value={food.omega6} unit="g" />
            <NutRow
              label="Colesterol"
              value={food.cholesterol}
              unit="mg"
              dv={pct(food.cholesterol, DV.cholesterol)}
            />
            <NutRow
              label="Azúcar añadida"
              value={food.addedSugar}
              unit="g"
              dv={pct(food.addedSugar, DV.addedSugar)}
            />
          </div>
        </div>
      )}

      {/* Minerales */}
      {hasMinerals && (
        <div>
          <SectionTitle>Minerales</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <NutRow
              label="Potasio"
              value={food.potassium}
              unit="mg"
              dv={pct(food.potassium, DV.potassium)}
            />
            <NutRow
              label="Calcio"
              value={food.calcium}
              unit="mg"
              dv={pct(food.calcium, DV.calcium)}
            />
            <NutRow
              label="Hierro"
              value={food.iron}
              unit="mg"
              dv={pct(food.iron, DV.iron)}
            />
            <NutRow
              label="Magnesio"
              value={food.magnesium}
              unit="mg"
              dv={pct(food.magnesium, DV.magnesium)}
            />
            <NutRow
              label="Zinc"
              value={food.zinc}
              unit="mg"
              dv={pct(food.zinc, DV.zinc)}
            />
            <NutRow
              label="Fósforo"
              value={food.phosphorus}
              unit="mg"
              dv={pct(food.phosphorus, DV.phosphorus)}
            />
          </div>
        </div>
      )}

      {/* Vitaminas */}
      {hasVitamins && (
        <div>
          <SectionTitle>Vitaminas</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <NutRow
              label="Vitamina A"
              value={food.vitaminA}
              unit="μg"
              dv={pct(food.vitaminA, DV.vitaminA)}
            />
            <NutRow
              label="Vitamina C"
              value={food.vitaminC}
              unit="mg"
              dv={pct(food.vitaminC, DV.vitaminC)}
            />
            <NutRow
              label="Vitamina D"
              value={food.vitaminD}
              unit="μg"
              dv={pct(food.vitaminD, DV.vitaminD)}
            />
            <NutRow
              label="Vitamina E"
              value={food.vitaminE}
              unit="mg"
              dv={pct(food.vitaminE, DV.vitaminE)}
            />
            <NutRow
              label="Vitamina K"
              value={food.vitaminK}
              unit="μg"
              dv={pct(food.vitaminK, DV.vitaminK)}
            />
            <NutRow
              label="B1 Tiamina"
              value={food.thiamin}
              unit="mg"
              dv={pct(food.thiamin, DV.thiamin)}
            />
            <NutRow
              label="B2 Riboflavina"
              value={food.riboflavin}
              unit="mg"
              dv={pct(food.riboflavin, DV.riboflavin)}
            />
            <NutRow
              label="B3 Niacina"
              value={food.niacin}
              unit="mg"
              dv={pct(food.niacin, DV.niacin)}
            />
            <NutRow
              label="B6"
              value={food.vitaminB6}
              unit="mg"
              dv={pct(food.vitaminB6, DV.vitaminB6)}
            />
            <NutRow
              label="B9 Folato"
              value={food.folate}
              unit="μg"
              dv={pct(food.folate, DV.folate)}
            />
            <NutRow
              label="B12"
              value={food.vitaminB12}
              unit="μg"
              dv={pct(food.vitaminB12, DV.vitaminB12)}
            />
          </div>
        </div>
      )}

      {/* Otros */}
      {hasOthers && (
        <div>
          <SectionTitle>Otros</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <NutRow label="Cafeína" value={food.caffeine} unit="mg" />
            <NutRow label="Alcohol" value={food.alcohol} unit="g" />
            <NutRow label="Agua" value={food.water} unit="g" />
          </div>
        </div>
      )}

      {food.notes && (
        <div>
          <SectionTitle>Notas</SectionTitle>
          <p className="text-sm text-brand-dark m-0 bg-brand-warm-white rounded p-3 border border-brand-light-cream">
            {food.notes}
          </p>
        </div>
      )}

      <p className="text-[10px] text-brand-tan m-0 mt-1 border-t border-brand-light-cream pt-2">
        %DV basado en Daily Values FDA 2020 · dieta 2000 kcal/día.
      </p>
    </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasAny(
  food: FoodItem,
  keys: ReadonlyArray<keyof FoodItem>,
): boolean {
  return keys.some((k) => {
    const v = food[k];
    return typeof v === "number" && Number.isFinite(v) && v > 0;
  });
}

function fmt(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : String(Math.round(v));
}

function pct(
  v: number | null | undefined,
  dv: number | undefined,
): number | null {
  if (v == null || !Number.isFinite(v) || !dv) return null;
  return Math.round((v / dv) * 100);
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 mb-2">
      {children}
    </p>
  );
}

function BigStat({
  label,
  value,
  unit,
  dv,
  emphasized,
}: {
  label: string;
  value: string;
  unit: string;
  dv?: number | null;
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 border",
        emphasized
          ? "bg-accent/10 border-accent"
          : "bg-brand-paper border-brand-light-cream",
      )}
    >
      <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
        {label}
      </p>
      <p
        className={cn(
          "font-mono m-0 mt-0.5",
          emphasized ? "text-2xl text-accent" : "text-lg text-brand-dark",
        )}
      >
        {value}
        <span className="text-sm text-brand-warm ml-1">{unit}</span>
      </p>
      {dv != null && (
        <p
          className={cn(
            "text-[10px] font-mono m-0 mt-0.5",
            dv >= 20 ? "text-success" : dv >= 10 ? "text-warning" : "text-brand-warm",
          )}
        >
          {dv}% DV
        </p>
      )}
    </div>
  );
}

function NutRow({
  label,
  value,
  unit,
  dv,
}: {
  label: string;
  value: number | null | undefined;
  unit: string;
  dv?: number | null;
}) {
  // Si no hay dato, muestra — en gris
  if (value == null || !Number.isFinite(value)) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded bg-brand-paper border border-brand-light-cream text-xs">
        <span className="text-brand-warm">{label}</span>
        <span className="text-brand-tan">—</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded bg-brand-paper border border-brand-light-cream text-xs">
      <span className="text-brand-dark">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-brand-dark">
          {fmt(value)} {unit}
        </span>
        {dv != null && (
          <span
            className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded",
              dv >= 20
                ? "bg-success/20 text-success"
                : dv >= 10
                  ? "bg-warning-light/50 text-warning"
                  : "bg-brand-cream text-brand-medium",
            )}
          >
            {dv}%
          </span>
        )}
      </div>
    </div>
  );
}
