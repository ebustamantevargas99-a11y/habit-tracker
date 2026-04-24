"use client";

import { useMemo } from "react";
import { useUserStore } from "@/stores/user-store";
import type {
  CompoundData,
  EnabledModulesV2,
  HabitV2,
  HomeV2Data,
  TimelineData,
} from "../types";

// ── Deterministic random para mock estable ─────────────────────────────
function seedRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function genSpark(n: number, base: number, variance: number, seed: number): number[] {
  const rnd = seedRand(seed * 100);
  const out: number[] = [];
  let v = base - variance * 0.6;
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.45) * variance * 0.35;
    v += (base - v) * 0.08;
    out.push(Math.max(0, v));
  }
  return out;
}

function genCompound(weeks: number): CompoundData {
  const rnd = seedRand(777);
  const real: number[] = [];
  const best: number[] = [];
  const abandon: number[] = [];
  let r = 1;
  let b = 1;
  let a = 1;
  for (let i = 0; i < weeks; i++) {
    const weeklyG = 1 + (0.002 + (rnd() - 0.4) * 0.006);
    r = r * weeklyG;
    b = b * Math.pow(1.005, 7);
    a = a * (1 - 0.02);
    real.push(r);
    best.push(b);
    abandon.push(a);
  }
  return { real, best, abandon };
}

function genHeatmap(days: number): number[] {
  const rnd = seedRand(42);
  const out: number[] = [];
  for (let i = 0; i < days; i++) {
    const weekday = (i + 3) % 7;
    const base = weekday === 6 ? 0.7 : weekday === 5 ? 1.6 : 2.4;
    const recent = (i / days) * 2.4;
    const noise = (rnd() - 0.3) * 2.2;
    let v = Math.round(base + recent + noise);
    v = Math.max(0, Math.min(5, v));
    out.push(v);
  }
  return out;
}

// ── Mock data factory ──────────────────────────────────────────────────
function buildMockData(userName: string, modules: EnabledModulesV2): HomeV2Data {
  const habitsMock: HabitV2[] = [
    { name: "Meditar", state: "rooted", streak: 47, strength: 96 },
    { name: "Leer 20 min", state: "near_rooted", streak: 38, strength: 88 },
    { name: "Escribir diario", state: "strengthening", streak: 22, strength: 71 },
    { name: "Correr", state: "strengthening", streak: 19, strength: 68 },
    { name: "Estudio inglés", state: "forming", streak: 14, strength: 54 },
    { name: "No azúcar", state: "forming", streak: 11, strength: 48 },
    { name: "Estirar", state: "forming", streak: 9, strength: 42 },
    { name: "Dormir 23:00", state: "starting", streak: 6, strength: 28 },
    { name: "Caminar 10k", state: "starting", streak: 5, strength: 24 },
    { name: "Piano", state: "starting", streak: 3, strength: 18 },
    { name: "Dibujo", state: "no_started", streak: 0, strength: 0 },
    { name: "Fotografía", state: "no_started", streak: 0, strength: 0 },
  ];

  const timeline: TimelineData = {
    // Sueño cruza medianoche: 22:30 lunes → 07:24 martes.
    // Eje es minutos desde 06:00 (0 = 06:00 hoy, 1440 = 06:00 mañana).
    sleep: [
      { start: (22.5 - 6) * 60, end: 24 * 60 },       // 22:30 → 06:00 (siguiente día)
      { start: 0, end: (7.4 - 6) * 60 },              // 06:00 → 07:24
    ],
    workouts: [{ start: (17 - 6) * 60, end: (18.25 - 6) * 60, label: "Fuerza" }],
    meals: [
      { at: (8 - 6) * 60, label: "Desayuno" },
      { at: (13 - 6) * 60, label: "Comida" },
      { at: (16 - 6) * 60, label: "Snack" },
      { at: (20 - 6) * 60, label: "Cena" },
    ],
    focus: [
      { start: (9 - 6) * 60, end: (11 - 6) * 60, label: "Trabajo profundo" },
      { start: (14.5 - 6) * 60, end: (16 - 6) * 60, label: "Diseño" },
    ],
    events: [
      { start: (11.5 - 6) * 60, end: (12.5 - 6) * 60, label: "1:1 con equipo" },
      { start: (21 - 6) * 60, end: (22 - 6) * 60, label: "Llamada familiar" },
    ],
  };

  return {
    user: { name: userName, startedAt: "2025-09-14" },
    enabledModules: modules,
    lifeScore: 72,
    lifeScorePrev: 68,
    habitsToday: { done: 6, total: 8, active: 12, topStreak: 47 },
    fitness: { sessionsWeek: 3, volumeKg: 8400, volumePrev: 7200 },
    nutrition: { kcal: 2180, goal: 2400, protein: 138, carbs: 220, fat: 72 },
    finance: { savedMonth: 1240, pct: 18, pctPrev: 12 },
    cycle: { day: 14, phase: "ovulatoria", length: 28 },
    badge: { name: "Primer mes de disciplina", done: 25, total: 30 },
    sparks: {
      lifeScore: genSpark(30, 72, 8, 1),
      habits: genSpark(30, 6.2, 1.6, 2),
      volume: genSpark(30, 1200, 400, 3),
      kcal: genSpark(30, 2180, 180, 4),
      saving: genSpark(30, 42, 14, 5),
    },
    radar: {
      categories: ["Hábitos", "Fitness", "Nutrición", "Productividad", "Finanzas", "Sueño", "Mindfulness"],
      thisWeek: [82, 74, 68, 71, 78, 64, 58],
      lastWeek: [76, 70, 72, 65, 73, 66, 52],
    },
    habits: habitsMock,
    timeline,
    compound52: genCompound(52),
    heatmap90: genHeatmap(90),
  };
}

/**
 * Hook principal del Home v2. Por ahora devuelve mock data estable.
 * En próxima iteración conectaremos con habitStore, lifeScoreApi,
 * fitnessStore, nutritionStore, financeStore, etc.
 */
export function useHomeV2Data(): HomeV2Data {
  const user = useUserStore((s) => s.user);
  const enabledList = user?.profile?.enabledModules ?? [];

  const modules: EnabledModulesV2 = useMemo(() => {
    const has = (k: string) => enabledList.includes(k);
    return {
      habits: true,
      tasks: true,
      settings: true,
      fitness: has("fitness"),
      nutrition: has("nutrition"),
      finance: has("finance"),
      planner: has("planner"),
      menstrualCycle: has("menstrualCycle"),
      reading: has("reading") || has("habits"),
    };
  }, [enabledList]);

  const userName = user?.name?.split(" ")[0] ?? "tú";

  return useMemo(() => buildMockData(userName, modules), [userName, modules]);
}
