"use client";

/**
 * Editor de alimento custom — crear o editar con todos los nutrientes nivel
 * Cronometer. Dividido en 5 secciones colapsables:
 *
 *   1. Info básica (nombre, marca, categoría, porción, código de barras)
 *   2. Macros (kcal + P/C/F/fiber/sugar/sodium)
 *   3. Desglose de macros (saturada, trans, mono, poly, omega-3/6, colesterol,
 *      azúcar añadida)
 *   4. Minerales (potasio, calcio, hierro, magnesio, zinc, fósforo)
 *   5. Vitaminas (A/C/D/E/K + B1/B2/B3/B6/B9/B12)
 *   6. Otros (cafeína, alcohol, agua, notas)
 *
 * Macros principales siempre visibles. El resto se revela al tocar el
 * chevron de cada sección. Usa `<details>` nativo para cero JS extra y
 * accesibilidad.
 */

import { useState } from "react";
import { ChevronDown, Save, X } from "lucide-react";
import { Card, cn } from "@/components/ui";
import type { FoodItem } from "@/stores/nutrition-store";

export type EditorFormState = Record<string, string>;

interface Props {
  initial?: FoodItem;
  onSubmit: (patch: Partial<Omit<FoodItem, "id" | "isCustom">>) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

const CATEGORIES = [
  "", "fruta", "verdura", "carne", "pescado", "lácteo", "huevo",
  "grano", "legumbre", "fruto seco", "semilla", "bebida", "alcohol",
  "dulce", "snack", "salsa", "suplemento", "comida preparada", "otro",
];

const UNITS = ["g", "ml", "oz", "piece", "cup", "tbsp", "tsp", "serving"];

export default function FoodEditor({
  initial,
  onSubmit,
  onCancel,
  submitting = false,
}: Props) {
  // Store como strings — permite vacío = null al guardar
  const [form, setForm] = useState<EditorFormState>(() => toForm(initial));

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name?.trim() || !form.calories) return;
    await onSubmit(fromForm(form));
  }

  const isEdit = !!initial;

  return (
    <Card
      variant="default"
      padding="md"
      className="border-accent flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif text-lg text-brand-dark m-0">
            {isEdit ? "Editar alimento" : "Nuevo alimento"}
          </h3>
          <p className="text-xs text-brand-warm m-0 mt-0.5">
            Todos los valores son por porción (
            <span className="font-mono">
              {form.servingSize || "—"} {form.servingUnit || "g"}
            </span>
            ). Deja en blanco los nutrientes que no conozcas.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded hover:bg-brand-cream text-brand-warm"
          type="button"
        >
          <X size={14} />
        </button>
      </div>

      {/* Sección 1: Info básica (siempre abierta) */}
      <Section title="1 · Información básica" defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Nombre *" span={2}>
            <Input
              value={form.name ?? ""}
              onChange={(v) => set("name", v)}
              placeholder="Pechuga de pollo"
            />
          </Field>
          <Field label="Marca">
            <Input
              value={form.brand ?? ""}
              onChange={(v) => set("brand", v)}
              placeholder="—"
            />
          </Field>
          <Field label="Categoría">
            <select
              value={form.category ?? ""}
              onChange={(e) => set("category", e.target.value)}
              className={INP}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c || "—"}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Porción">
            <NumInput
              value={form.servingSize ?? ""}
              onChange={(v) => set("servingSize", v)}
              placeholder="100"
              step="0.1"
            />
          </Field>
          <Field label="Unidad">
            <select
              value={form.servingUnit ?? "g"}
              onChange={(e) => set("servingUnit", e.target.value)}
              className={INP}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Código de barras">
            <Input
              value={form.barcode ?? ""}
              onChange={(v) => set("barcode", v)}
              placeholder="EAN-13"
            />
          </Field>
          <Field label="">
            <div />
          </Field>
        </div>
      </Section>

      {/* Sección 2: Macros (siempre abierta) */}
      <Section title="2 · Macros principales" defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Calorías *">
            <NumInput
              value={form.calories ?? ""}
              onChange={(v) => set("calories", v)}
              placeholder="165"
              step="1"
            />
          </Field>
          <Field label="Proteína (g)">
            <NumInput
              value={form.protein ?? ""}
              onChange={(v) => set("protein", v)}
              placeholder="31"
              step="0.1"
            />
          </Field>
          <Field label="Carbs (g)">
            <NumInput
              value={form.carbs ?? ""}
              onChange={(v) => set("carbs", v)}
              placeholder="0"
              step="0.1"
            />
          </Field>
          <Field label="Grasa (g)">
            <NumInput
              value={form.fat ?? ""}
              onChange={(v) => set("fat", v)}
              placeholder="3.6"
              step="0.1"
            />
          </Field>
          <Field label="Fibra (g)">
            <NumInput
              value={form.fiber ?? ""}
              onChange={(v) => set("fiber", v)}
              placeholder="0"
              step="0.1"
            />
          </Field>
          <Field label="Azúcares (g)">
            <NumInput
              value={form.sugar ?? ""}
              onChange={(v) => set("sugar", v)}
              placeholder="0"
              step="0.1"
            />
          </Field>
          <Field label="Sodio (mg)">
            <NumInput
              value={form.sodium ?? ""}
              onChange={(v) => set("sodium", v)}
              placeholder="74"
              step="1"
            />
          </Field>
        </div>
      </Section>

      {/* Sección 3: Desglose de macros */}
      <Section title="3 · Desglose de macros">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Grasa saturada (g)">
            <NumInput
              value={form.saturatedFat ?? ""}
              onChange={(v) => set("saturatedFat", v)}
              step="0.1"
            />
          </Field>
          <Field label="Grasa trans (g)">
            <NumInput
              value={form.transFat ?? ""}
              onChange={(v) => set("transFat", v)}
              step="0.1"
            />
          </Field>
          <Field label="Monoinsaturada (g)">
            <NumInput
              value={form.monoFat ?? ""}
              onChange={(v) => set("monoFat", v)}
              step="0.1"
            />
          </Field>
          <Field label="Poliinsaturada (g)">
            <NumInput
              value={form.polyFat ?? ""}
              onChange={(v) => set("polyFat", v)}
              step="0.1"
            />
          </Field>
          <Field label="Omega-3 (g)">
            <NumInput
              value={form.omega3 ?? ""}
              onChange={(v) => set("omega3", v)}
              step="0.01"
            />
          </Field>
          <Field label="Omega-6 (g)">
            <NumInput
              value={form.omega6 ?? ""}
              onChange={(v) => set("omega6", v)}
              step="0.01"
            />
          </Field>
          <Field label="Colesterol (mg)">
            <NumInput
              value={form.cholesterol ?? ""}
              onChange={(v) => set("cholesterol", v)}
              step="1"
            />
          </Field>
          <Field label="Azúcar añadida (g)">
            <NumInput
              value={form.addedSugar ?? ""}
              onChange={(v) => set("addedSugar", v)}
              step="0.1"
            />
          </Field>
        </div>
      </Section>

      {/* Sección 4: Minerales */}
      <Section title="4 · Minerales">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Potasio (mg)">
            <NumInput
              value={form.potassium ?? ""}
              onChange={(v) => set("potassium", v)}
              step="1"
            />
          </Field>
          <Field label="Calcio (mg)">
            <NumInput
              value={form.calcium ?? ""}
              onChange={(v) => set("calcium", v)}
              step="1"
            />
          </Field>
          <Field label="Hierro (mg)">
            <NumInput
              value={form.iron ?? ""}
              onChange={(v) => set("iron", v)}
              step="0.01"
            />
          </Field>
          <Field label="Magnesio (mg)">
            <NumInput
              value={form.magnesium ?? ""}
              onChange={(v) => set("magnesium", v)}
              step="0.1"
            />
          </Field>
          <Field label="Zinc (mg)">
            <NumInput
              value={form.zinc ?? ""}
              onChange={(v) => set("zinc", v)}
              step="0.01"
            />
          </Field>
          <Field label="Fósforo (mg)">
            <NumInput
              value={form.phosphorus ?? ""}
              onChange={(v) => set("phosphorus", v)}
              step="1"
            />
          </Field>
        </div>
      </Section>

      {/* Sección 5: Vitaminas */}
      <Section title="5 · Vitaminas">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Vitamina A (μg RAE)">
            <NumInput
              value={form.vitaminA ?? ""}
              onChange={(v) => set("vitaminA", v)}
              step="1"
            />
          </Field>
          <Field label="Vitamina C (mg)">
            <NumInput
              value={form.vitaminC ?? ""}
              onChange={(v) => set("vitaminC", v)}
              step="0.1"
            />
          </Field>
          <Field label="Vitamina D (μg)">
            <NumInput
              value={form.vitaminD ?? ""}
              onChange={(v) => set("vitaminD", v)}
              step="0.1"
            />
          </Field>
          <Field label="Vitamina E (mg)">
            <NumInput
              value={form.vitaminE ?? ""}
              onChange={(v) => set("vitaminE", v)}
              step="0.01"
            />
          </Field>
          <Field label="Vitamina K (μg)">
            <NumInput
              value={form.vitaminK ?? ""}
              onChange={(v) => set("vitaminK", v)}
              step="0.1"
            />
          </Field>
          <Field label="B1 Tiamina (mg)">
            <NumInput
              value={form.thiamin ?? ""}
              onChange={(v) => set("thiamin", v)}
              step="0.01"
            />
          </Field>
          <Field label="B2 Riboflavina (mg)">
            <NumInput
              value={form.riboflavin ?? ""}
              onChange={(v) => set("riboflavin", v)}
              step="0.01"
            />
          </Field>
          <Field label="B3 Niacina (mg)">
            <NumInput
              value={form.niacin ?? ""}
              onChange={(v) => set("niacin", v)}
              step="0.1"
            />
          </Field>
          <Field label="B6 (mg)">
            <NumInput
              value={form.vitaminB6 ?? ""}
              onChange={(v) => set("vitaminB6", v)}
              step="0.01"
            />
          </Field>
          <Field label="B9 Folato (μg)">
            <NumInput
              value={form.folate ?? ""}
              onChange={(v) => set("folate", v)}
              step="1"
            />
          </Field>
          <Field label="B12 (μg)">
            <NumInput
              value={form.vitaminB12 ?? ""}
              onChange={(v) => set("vitaminB12", v)}
              step="0.01"
            />
          </Field>
        </div>
      </Section>

      {/* Sección 6: Glycemic + net carbs */}
      <Section title="6 · Índice glicémico + net carbs">
        <p className="text-[11px] text-brand-warm m-0 mb-3">
          Útil para dietas keto (net carbs), diabetes/sensibilidad a la
          insulina (GI/GL) y atletas monitoreando energía.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Índice glicémico (0-100)">
            <NumInput
              value={form.glycemicIndex ?? ""}
              onChange={(v) => set("glycemicIndex", v)}
              step="1"
              placeholder="55"
            />
          </Field>
          <Field label="Carga glicémica">
            <NumInput
              value={form.glycemicLoad ?? ""}
              onChange={(v) => set("glycemicLoad", v)}
              step="0.1"
              placeholder="GI × carbs / 100"
            />
          </Field>
          <Field label="Carbohidratos netos (g)">
            <NumInput
              value={form.netCarbs ?? ""}
              onChange={(v) => set("netCarbs", v)}
              step="0.1"
              placeholder="carbs − fibra"
            />
          </Field>
        </div>
      </Section>

      {/* Sección 7: Aminoácidos esenciales */}
      <Section title="7 · Aminoácidos esenciales (mg)">
        <p className="text-[11px] text-brand-warm m-0 mb-3">
          Para atletas (leucina ≥3g dispara MPS) y vegetarianos
          (lisina/metionina son los aminos limitantes).
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <Field label="Leucina *">
            <NumInput value={form.leucine ?? ""} onChange={(v) => set("leucine", v)} step="1" />
          </Field>
          <Field label="Isoleucina">
            <NumInput value={form.isoleucine ?? ""} onChange={(v) => set("isoleucine", v)} step="1" />
          </Field>
          <Field label="Valina">
            <NumInput value={form.valine ?? ""} onChange={(v) => set("valine", v)} step="1" />
          </Field>
          <Field label="Lisina">
            <NumInput value={form.lysine ?? ""} onChange={(v) => set("lysine", v)} step="1" />
          </Field>
          <Field label="Metionina">
            <NumInput value={form.methionine ?? ""} onChange={(v) => set("methionine", v)} step="1" />
          </Field>
          <Field label="Fenilalanina">
            <NumInput value={form.phenylalanine ?? ""} onChange={(v) => set("phenylalanine", v)} step="1" />
          </Field>
          <Field label="Treonina">
            <NumInput value={form.threonine ?? ""} onChange={(v) => set("threonine", v)} step="1" />
          </Field>
          <Field label="Triptófano">
            <NumInput value={form.tryptophan ?? ""} onChange={(v) => set("tryptophan", v)} step="1" />
          </Field>
          <Field label="Histidina">
            <NumInput value={form.histidine ?? ""} onChange={(v) => set("histidine", v)} step="1" />
          </Field>
        </div>
        <p className="text-[10px] text-brand-tan m-0 mt-2">
          * Leucina es el más crítico — umbral ~2.5-3g por comida para
          maximizar síntesis proteica muscular.
        </p>
      </Section>

      {/* Sección 8: Otros */}
      <Section title="8 · Otros">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Cafeína (mg)">
            <NumInput
              value={form.caffeine ?? ""}
              onChange={(v) => set("caffeine", v)}
              step="1"
            />
          </Field>
          <Field label="Alcohol (g)">
            <NumInput
              value={form.alcohol ?? ""}
              onChange={(v) => set("alcohol", v)}
              step="0.1"
            />
          </Field>
          <Field label="Agua (g)">
            <NumInput
              value={form.water ?? ""}
              onChange={(v) => set("water", v)}
              step="1"
            />
          </Field>
          <Field label="Notas" span={4}>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Cualquier nota — receta, marca específica, dónde lo compras…"
              rows={2}
              className={cn(INP, "resize-none")}
            />
          </Field>
        </div>
      </Section>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-brand-light-cream">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-button bg-transparent text-brand-medium border border-brand-light-tan text-sm hover:bg-brand-cream"
          type="button"
          disabled={submitting}
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !form.name?.trim() || !form.calories}
          className="flex items-center gap-1.5 px-5 py-2 rounded-button bg-accent text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40"
          type="button"
        >
          <Save size={14} />
          {submitting
            ? "Guardando…"
            : isEdit
              ? "Guardar cambios"
              : "Crear alimento"}
        </button>
      </div>
    </Card>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const INP =
  "w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm text-brand-dark box-border";

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="bg-brand-warm-white rounded-lg border border-brand-light-cream overflow-hidden group"
    >
      <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-center justify-between hover:bg-brand-cream/40">
        <span className="font-serif text-sm text-brand-dark">{title}</span>
        <ChevronDown
          size={16}
          className="text-brand-warm transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-4 py-3 border-t border-brand-light-cream">
        {children}
      </div>
    </details>
  );
}

function Field({
  label,
  children,
  span = 1,
}: {
  label: string;
  children: React.ReactNode;
  span?: 1 | 2 | 3 | 4;
}) {
  const spanClass =
    span === 2
      ? "sm:col-span-2"
      : span === 3
        ? "sm:col-span-3"
        : span === 4
          ? "sm:col-span-4"
          : "";
  return (
    <div className={spanClass}>
      {label && (
        <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={INP}
    />
  );
}

function NumInput({
  value,
  onChange,
  placeholder,
  step = "0.1",
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
      className={INP}
    />
  );
}

// ─── Helpers form ↔ FoodItem ────────────────────────────────────────────────

const NUMERIC_KEYS: ReadonlyArray<keyof FoodItem> = [
  "servingSize", "calories", "protein", "carbs", "fat", "fiber",
  "sugar", "sodium", "saturatedFat", "transFat", "monoFat", "polyFat",
  "omega3", "omega6", "cholesterol", "addedSugar", "potassium", "calcium",
  "iron", "magnesium", "zinc", "phosphorus", "vitaminA", "vitaminC",
  "vitaminD", "vitaminE", "vitaminK", "thiamin", "riboflavin", "niacin",
  "vitaminB6", "folate", "vitaminB12", "caffeine", "alcohol", "water",
  "glycemicIndex", "glycemicLoad", "netCarbs",
  "leucine", "isoleucine", "valine", "lysine", "methionine",
  "phenylalanine", "threonine", "tryptophan", "histidine",
];

const TEXT_KEYS: ReadonlyArray<keyof FoodItem> = [
  "name", "brand", "category", "servingUnit", "barcode", "notes",
];

const REQUIRED_NUM_KEYS: ReadonlyArray<keyof FoodItem> = [
  "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium",
];

function toForm(initial?: FoodItem): EditorFormState {
  const f: EditorFormState = {
    servingSize: "100",
    servingUnit: "g",
  };
  if (!initial) return f;
  for (const k of NUMERIC_KEYS) {
    const v = initial[k];
    if (typeof v === "number" && Number.isFinite(v)) f[k] = String(v);
  }
  for (const k of TEXT_KEYS) {
    const v = initial[k];
    if (typeof v === "string") f[k] = v;
  }
  return f;
}

function fromForm(
  f: EditorFormState,
): Partial<Omit<FoodItem, "id" | "isCustom">> {
  const out: Record<string, unknown> = {};
  // Textos
  for (const k of TEXT_KEYS) {
    const v = f[k];
    if (v === undefined) continue;
    out[k] = v.trim() === "" ? null : v.trim();
  }
  if (!out.name) out.name = f.name ?? "";
  // Numéricos
  for (const k of NUMERIC_KEYS) {
    const raw = f[k];
    if (raw === undefined) continue;
    if (raw === "") {
      // Required macros → 0; nutrientes opcionales → null
      out[k] = (REQUIRED_NUM_KEYS as readonly string[]).includes(k)
        ? k === "calories"
          ? undefined
          : 0
        : null;
    } else {
      const n = parseFloat(raw);
      out[k] = Number.isFinite(n) ? n : null;
    }
  }
  // Limpia `undefined` (vienen de calories vacío)
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k];
  }
  return out as Partial<Omit<FoodItem, "id" | "isCustom">>;
}
