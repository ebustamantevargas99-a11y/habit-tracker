import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

/**
 * GET /nutrition/export?format=csv&days=30
 *
 * Exporta el diario de nutrición + mediciones + marcadores en CSV (tablas
 * separadas por blank line). Formato plano sin dependencias — apto para
 * abrir en Excel, Sheets, Numbers, pegar en un email al nutricionista.
 *
 * Tablas exportadas:
 *   1. Diario de comidas: fecha, comida, alimento, cantidad, kcal, P, C, F, fibra
 *   2. Totales diarios: fecha, kcal, P, C, F, fibra, sodio, omega3, omega6
 *   3. Weight logs en el rango
 *   4. Body composition
 *   5. Blood markers
 */

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  // Si contiene , " o \n, envuelve en comillas y escapa
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const days = Math.min(
      Math.max(parseInt(searchParams.get("days") ?? "30", 10) || 30, 1),
      365,
    );
    const format = searchParams.get("format") ?? "csv";
    if (format !== "csv") {
      return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const [meals, weights, comps, markers] = await Promise.all([
      prisma.mealLog.findMany({
        where: { userId, date: { gte: cutoffStr } },
        include: { items: { include: { foodItem: true } } },
        orderBy: [{ date: "asc" }, { mealType: "asc" }],
      }),
      prisma.weightLog.findMany({
        where: { userId, date: { gte: cutoffStr } },
        orderBy: { date: "asc" },
      }),
      prisma.bodyComposition.findMany({
        where: { userId, date: { gte: cutoffStr } },
        orderBy: { date: "asc" },
      }),
      prisma.bloodMarker.findMany({
        where: { userId, date: { gte: cutoffStr } },
        orderBy: [{ date: "asc" }, { measuredAt: "asc" }],
      }),
    ]);

    const lines: string[] = [];

    // ─── Encabezado ────────────────────────────────────────────────────────
    lines.push(`# Ultimate TRACKER — Nutrition Export`);
    lines.push(`# Rango: ${cutoffStr} → hoy (${days} días)`);
    lines.push(`# Generado: ${new Date().toISOString()}`);
    lines.push("");

    // ─── Tabla 1: Diario de comidas ────────────────────────────────────────
    lines.push("## Diario de comidas");
    lines.push(
      row([
        "fecha", "comida", "alimento", "marca", "cantidad", "unidad",
        "kcal", "proteina_g", "carbs_g", "grasa_g",
      ]),
    );
    for (const m of meals) {
      for (const it of m.items) {
        lines.push(
          row([
            m.date,
            m.mealType,
            it.foodItem.name,
            it.foodItem.brand ?? "",
            it.quantity,
            it.unit,
            Math.round(it.calories),
            Math.round(it.protein * 10) / 10,
            Math.round(it.carbs * 10) / 10,
            Math.round(it.fat * 10) / 10,
          ]),
        );
      }
    }
    lines.push("");

    // ─── Tabla 2: Totales diarios ──────────────────────────────────────────
    const byDate: Record<
      string,
      {
        kcal: number; protein: number; carbs: number; fat: number;
        fiber: number; sodium: number; omega3: number; omega6: number;
      }
    > = {};
    for (const m of meals) {
      if (!byDate[m.date]) {
        byDate[m.date] = {
          kcal: 0, protein: 0, carbs: 0, fat: 0,
          fiber: 0, sodium: 0, omega3: 0, omega6: 0,
        };
      }
      for (const it of m.items) {
        byDate[m.date].kcal += it.calories;
        byDate[m.date].protein += it.protein;
        byDate[m.date].carbs += it.carbs;
        byDate[m.date].fat += it.fat;
        const food = it.foodItem;
        const base = food.servingSize > 0 ? food.servingSize : 100;
        const factor = it.quantity / base;
        byDate[m.date].fiber += (food.fiber ?? 0) * factor;
        byDate[m.date].sodium += (food.sodium ?? 0) * factor;
        byDate[m.date].omega3 += (food.omega3 ?? 0) * factor;
        byDate[m.date].omega6 += (food.omega6 ?? 0) * factor;
      }
    }

    lines.push("## Totales diarios");
    lines.push(
      row([
        "fecha", "kcal", "proteina_g", "carbs_g", "grasa_g",
        "fibra_g", "sodio_mg", "omega3_g", "omega6_g",
      ]),
    );
    for (const date of Object.keys(byDate).sort()) {
      const d = byDate[date];
      lines.push(
        row([
          date,
          Math.round(d.kcal),
          Math.round(d.protein * 10) / 10,
          Math.round(d.carbs * 10) / 10,
          Math.round(d.fat * 10) / 10,
          Math.round(d.fiber * 10) / 10,
          Math.round(d.sodium),
          Math.round(d.omega3 * 100) / 100,
          Math.round(d.omega6 * 100) / 100,
        ]),
      );
    }
    lines.push("");

    // ─── Tabla 3: Weight logs ──────────────────────────────────────────────
    if (weights.length > 0) {
      lines.push("## Registros de peso");
      lines.push(row(["fecha", "peso_kg"]));
      for (const w of weights) {
        lines.push(row([w.date, w.weight]));
      }
      lines.push("");
    }

    // ─── Tabla 4: Body composition ─────────────────────────────────────────
    if (comps.length > 0) {
      lines.push("## Composición corporal");
      lines.push(
        row([
          "fecha", "metodo", "peso_kg", "grasa_pct",
          "masa_magra_kg", "masa_grasa_kg", "agua_pct",
          "visceral", "masa_osea_kg", "bmr_kcal", "notas",
        ]),
      );
      for (const c of comps) {
        lines.push(
          row([
            c.date,
            c.method ?? "",
            c.weightKg,
            c.bodyFatPercent,
            c.leanMassKg,
            c.fatMassKg,
            c.waterPercent,
            c.visceralFat,
            c.boneMassKg,
            c.bmr,
            c.notes ?? "",
          ]),
        );
      }
      lines.push("");
    }

    // ─── Tabla 5: Blood markers ────────────────────────────────────────────
    if (markers.length > 0) {
      lines.push("## Marcadores sanguíneos");
      lines.push(
        row([
          "fecha", "contexto", "fuente", "glucosa_mgdl", "a1c_pct",
          "ketones_mmoll", "insulina_mui_ml", "sistolica", "diastolica",
          "fc_bpm", "colesterol_total", "hdl", "ldl", "trigliceridos",
          "notas",
        ]),
      );
      for (const b of markers) {
        lines.push(
          row([
            b.date,
            b.context ?? "",
            b.source ?? "",
            b.glucoseMgDl,
            b.a1cPercent,
            b.ketonesMmolL,
            b.insulinMuIml,
            b.systolic,
            b.diastolic,
            b.heartRate,
            b.totalCholesterol,
            b.hdl,
            b.ldl,
            b.triglycerides,
            b.notes ?? "",
          ]),
        );
      }
      lines.push("");
    }

    const csv = lines.join("\n");
    const filename = `nutrition-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}
