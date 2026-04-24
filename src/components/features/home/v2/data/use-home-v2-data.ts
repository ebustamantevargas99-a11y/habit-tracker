"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { useUserStore } from "@/stores/user-store";
import { useHabitStore } from "@/stores/habit-store";
import { useFitnessStore } from "@/stores/fitness-store";
import { useNutritionStore } from "@/stores/nutrition-store";
import { useFinanceStore } from "@/stores/finance-store";
import { useGamificationStore } from "@/stores/gamification-store";
import { phaseFromStreak } from "@/lib/habit-utils";
import type {
  CompoundData,
  EnabledModulesV2,
  HabitState,
  HabitV2,
  HomeV2Data,
  RadarData,
  TimelineData,
} from "../types";

// ─── Tipos de respuesta de APIs ──────────────────────────────────────────

type LifeDimension = "habits" | "fitness" | "nutrition" | "productivity";

interface DimensionScore {
  score: number | null;
  reason?: string;
  samples: number;
}

interface LifeScoreResult {
  overall: number;
  breakdown: Record<LifeDimension, DimensionScore>;
  weightsApplied: Record<LifeDimension, number>;
  activeModules: string[];
  date: string;
  windowDays: number;
  generatedAt: string;
  history?: Array<{ date: string; overall: number }>;
}

interface DayAgendaResponse {
  date: string;
  events: Array<{
    id: string;
    title: string;
    startAt: string;
    endAt: string | null;
    type: string;
    category: string | null;
  }>;
  agenda: {
    workouts: Array<{ id: string; title: string; durationMinutes: number; completed: boolean }>;
    meals: Array<{ id: string; mealType: "breakfast" | "lunch" | "dinner" | "snack" }>;
    focus: Array<{
      id: string;
      task: string | null;
      startedAt: string;
      endedAt: string | null;
      plannedMinutes: number;
      actualMinutes: number | null;
      active: boolean;
    }>;
    cycle: { name: string; emoji: string; day: number } | null;
  };
}

// ─── Determinismo para compound (educativo, no data real) ────────────────

function seedRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function genCompound(weeks: number, realGrowthPerWeek = 0.003): CompoundData {
  const rnd = seedRand(777);
  const real: number[] = [];
  const best: number[] = [];
  const abandon: number[] = [];
  let r = 1;
  let b = 1;
  let a = 1;
  for (let i = 0; i < weeks; i++) {
    const weeklyG = 1 + (realGrowthPerWeek + (rnd() - 0.4) * 0.006);
    r *= weeklyG;
    b *= Math.pow(1.005, 7);
    a *= 1 - 0.02;
    real.push(r);
    best.push(b);
    abandon.push(a);
  }
  return { real, best, abandon };
}

// ─── Helpers de fecha ────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function startOfWeekISO(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function startOfMonthISO(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

// ─── Sparkline padding: si hay pocos puntos reales, completa con 0s ──────

function padSpark(data: number[], target = 30): number[] {
  if (data.length >= target) return data.slice(-target);
  const pad = new Array(target - data.length).fill(data[0] ?? 0);
  return [...pad, ...data];
}

// ─── Derivar timeline del day agenda ─────────────────────────────────────

function deriveTimeline(agenda: DayAgendaResponse | null): TimelineData {
  if (!agenda) {
    return { sleep: [], workouts: [], meals: [], focus: [], events: [] };
  }

  // Eje: minutos desde 06:00 hoy (0) → 06:00 mañana (1440).
  const toMinutes = (iso: string): number => {
    const d = new Date(iso);
    const h = d.getHours() + d.getMinutes() / 60;
    // Si la hora es 0-5 asumimos que es "de madrugada" del día siguiente
    // y sumamos 24 - 6 al offset.
    if (h < 6) return (h + 24 - 6) * 60;
    return (h - 6) * 60;
  };

  // Comidas: sin hora exacta → asignamos horas por defecto por mealType.
  const MEAL_DEFAULT_HOUR: Record<string, number> = {
    breakfast: 8,
    lunch: 13,
    dinner: 20,
    snack: 16,
  };

  return {
    sleep: [], // No trackeamos sleep como módulo — por ahora vacío.
    workouts: agenda.agenda.workouts.map((w) => {
      // Sin hora específica en el schema — asumimos 18:00 default.
      const start = (18 - 6) * 60;
      const end = start + (w.durationMinutes || 60);
      return { start, end, label: w.title };
    }),
    meals: agenda.agenda.meals.map((m) => ({
      at: (MEAL_DEFAULT_HOUR[m.mealType] - 6) * 60,
      label: m.mealType,
    })),
    focus: agenda.agenda.focus
      .filter((f) => f.startedAt)
      .map((f) => {
        const start = toMinutes(f.startedAt);
        const minutes = f.actualMinutes ?? f.plannedMinutes ?? 60;
        return { start, end: start + minutes, label: f.task ?? "Trabajo profundo" };
      }),
    events: agenda.events
      .filter((e) => e.endAt)
      .map((e) => ({
        start: toMinutes(e.startAt),
        end: toMinutes(e.endAt!),
        label: e.title,
      })),
  };
}

// ─── Derivar habits del store a HabitV2 ──────────────────────────────────

interface HabitLike {
  id: string;
  name: string;
  streakCurrent: number;
  strength: number | null;
}

function mapHabitToV2(h: HabitLike): HabitV2 {
  const phase = phaseFromStreak(h.streakCurrent ?? 0);
  return {
    name: h.name,
    state: phase as HabitState,
    streak: h.streakCurrent ?? 0,
    strength: h.strength ?? 0,
  };
}

// ─── Derivar radar desde life-score breakdown ───────────────────────────

const DIMENSION_LABELS: Record<LifeDimension, string> = {
  habits: "Hábitos",
  fitness: "Fitness",
  nutrition: "Nutrición",
  productivity: "Productividad",
};

function deriveRadar(
  current: LifeScoreResult | null,
  prev: LifeScoreResult | null,
): RadarData {
  const cats: string[] = [];
  const now: number[] = [];
  const last: number[] = [];
  const dims: LifeDimension[] = ["habits", "fitness", "nutrition", "productivity"];

  for (const dim of dims) {
    const cScore = current?.breakdown[dim]?.score;
    if (cScore == null) continue;
    cats.push(DIMENSION_LABELS[dim]);
    now.push(Math.round(cScore));
    const pScore = prev?.breakdown[dim]?.score;
    last.push(pScore != null ? Math.round(pScore) : Math.round(cScore));
  }

  // Si todo está vacío (user nuevo), mostramos estructura mínima de 4 ejes con ceros
  // para que el chart renderice algo en vez de colapsar.
  if (cats.length === 0) {
    return {
      categories: ["Hábitos", "Fitness", "Nutrición", "Productividad"],
      thisWeek: [0, 0, 0, 0],
      lastWeek: [0, 0, 0, 0],
    };
  }

  return { categories: cats, thisWeek: now, lastWeek: last };
}

// ─── Sparkline de hábitos (últimos 30 días) ─────────────────────────────

function deriveHabitsSpark(
  habits: Array<{ id: string; targetDays?: number[] | null }>,
  logs: Array<{ habitId: string; date: string; completed: boolean }>,
): number[] {
  const out: number[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLogs = logs.filter((l) => l.date === dateStr && l.completed);
    out.push(dayLogs.length);
  }
  return out;
}

// ─── Heatmap 90 días desde habit store (usa su helper) ──────────────────

function deriveHeatmap(
  heatmapData: Array<{ date: string; level: number }>,
): number[] {
  // heatmap-store level va de 0-4. Nuestro componente espera 0-5.
  // Mapeo 1:1 con tope, así level=4 → nivel 4 (no saturar).
  return heatmapData.map((d) => Math.min(5, d.level));
}

// ─── Finanzas: ahorro del mes desde transactions ────────────────────────

interface TransactionLike {
  date: string;
  amount: number;
  type: "income" | "expense" | "transfer";
}

function deriveFinance(transactions: TransactionLike[]): {
  savedMonth: number;
  pct: number;
  pctPrev: number;
} {
  const monthStart = startOfMonthISO();
  const prevMonthStart = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return startOfMonthISO(d);
  })();
  const prevMonthEnd = (() => {
    const d = new Date();
    d.setDate(1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  const inRange = (t: TransactionLike, from: string, to: string): boolean =>
    t.date >= from && t.date <= to;

  const thisIncome = transactions
    .filter((t) => t.type === "income" && inRange(t, monthStart, todayISO()))
    .reduce((s, t) => s + t.amount, 0);
  const thisExpense = transactions
    .filter((t) => t.type === "expense" && inRange(t, monthStart, todayISO()))
    .reduce((s, t) => s + t.amount, 0);

  const prevIncome = transactions
    .filter((t) => t.type === "income" && inRange(t, prevMonthStart, prevMonthEnd))
    .reduce((s, t) => s + t.amount, 0);
  const prevExpense = transactions
    .filter((t) => t.type === "expense" && inRange(t, prevMonthStart, prevMonthEnd))
    .reduce((s, t) => s + t.amount, 0);

  const savedMonth = Math.max(0, thisIncome - thisExpense);
  const savedPrev = Math.max(0, prevIncome - prevExpense);
  const pct = thisIncome > 0 ? Math.round((savedMonth / thisIncome) * 100) : 0;
  const pctPrev = prevIncome > 0 ? Math.round((savedPrev / prevIncome) * 100) : 0;

  return { savedMonth, pct, pctPrev };
}

// ─── Fitness: volumen de la semana desde workouts del store ─────────────

interface WorkoutLike {
  date: string;
  totalVolume: number;
}

function deriveFitness(workouts: WorkoutLike[]): {
  sessionsWeek: number;
  volumeKg: number;
  volumePrev: number;
} {
  const thisMonday = startOfWeekISO();
  const lastMondayDate = new Date(thisMonday + "T00:00:00Z");
  lastMondayDate.setDate(lastMondayDate.getDate() - 7);
  const lastMonday = lastMondayDate.toISOString().split("T")[0];

  const thisWeek = workouts.filter((w) => w.date >= thisMonday);
  const prevWeek = workouts.filter(
    (w) => w.date >= lastMonday && w.date < thisMonday,
  );

  return {
    sessionsWeek: thisWeek.length,
    volumeKg: Math.round(thisWeek.reduce((s, w) => s + (w.totalVolume || 0), 0)),
    volumePrev: Math.round(prevWeek.reduce((s, w) => s + (w.totalVolume || 0), 0)),
  };
}

// ─── Achievements: próximo badge desde gamification store ───────────────

interface GamificationBadge {
  id: string;
  name: string;
  isEarned: boolean;
}

function deriveBadge(badges: GamificationBadge[], topStreak: number): {
  name: string;
  done: number;
  total: number;
} {
  // Buscar primer badge no earned (próximo a desbloquear)
  const next = badges.find((b) => !b.isEarned);
  if (!next) {
    return { name: "Todas las insignias", done: badges.length, total: badges.length };
  }

  // Estimar done/total según el badge — heurísticas basadas en
  // descripción. Para "week-warrior" (7 días), usamos topStreak.
  const STREAK_TARGETS: Record<string, number> = {
    "first-step": 1,
    "week-warrior": 7,
    "monthly-master": 30,
    "iron-will": 100,
  };
  const target = STREAK_TARGETS[next.id];
  if (target != null) {
    return {
      name: next.name,
      done: Math.min(topStreak, target),
      total: target,
    };
  }

  // Fallback genérico
  return { name: next.name, done: 0, total: 1 };
}

// ─── Hook principal ──────────────────────────────────────────────────────

export function useHomeV2Data(): HomeV2Data {
  const user = useUserStore((s) => s.user);
  const enabledList = user?.profile?.enabledModules ?? [];

  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const habitStoreLoaded = useHabitStore((s) => s.isLoaded);
  const getHeatmapData = useHabitStore((s) => s.getHeatmapData);

  const workouts = useFitnessStore((s) => s.workouts);
  const weeklyVolume = useFitnessStore((s) => s.weeklyVolume);

  const nutriSummary = useNutritionStore((s) => s.dailySummary);
  const nutriGoals = useNutritionStore((s) => s.goals);

  const transactions = useFinanceStore((s) => s.transactions);

  const gamiBadges = useGamificationStore((s) => s.badges);

  // Estado remoto: life-score actual + hace 7 días + day agenda
  const [lifeScoreNow, setLifeScoreNow] = useState<LifeScoreResult | null>(null);
  const [lifeScorePrev, setLifeScorePrev] = useState<LifeScoreResult | null>(null);
  const [dayAgenda, setDayAgenda] = useState<DayAgendaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const prevDate = daysAgoISO(7);
        const [now, prev, agenda] = await Promise.all([
          api
            .get<LifeScoreResult>("/user/life-score?window=7&history=30")
            .catch(() => null),
          api
            .get<LifeScoreResult>(`/user/life-score?date=${prevDate}&window=7`)
            .catch(() => null),
          api
            .get<DayAgendaResponse>(`/calendar/day/${todayISO()}`)
            .catch(() => null),
        ]);
        if (cancelled) return;
        setLifeScoreNow(now);
        setLifeScorePrev(prev);
        setDayAgenda(agenda);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

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
      reading: has("reading"),
    };
  }, [enabledList]);

  return useMemo(() => {
    const userName = user?.name?.split(" ")[0] ?? "tú";

    // ── Life Score + sparkline del histórico ──
    const lifeScore = lifeScoreNow?.overall ?? 0;
    const prevOverall = lifeScorePrev?.overall ?? lifeScore;
    const lifeScoreSparkRaw = (lifeScoreNow?.history ?? []).map((p) => p.overall);
    const lifeScoreSpark = padSpark(lifeScoreSparkRaw, 30);

    // ── Hábitos hoy ──
    // `total` = hábitos agendados para hoy según su frequency + targetDays.
    // `done` = completados hoy que pertenecen a ese subset.
    // Mismo criterio que usa /api/calendar/day/[date] para no divergir.
    const today = todayISO();
    const dayOfWeek = new Date().getDay(); // 0 = domingo
    const scheduledHabitIds = new Set(
      habits
        .filter((h) => {
          if (h.frequency === "daily") return true;
          return (h.targetDays ?? []).includes(dayOfWeek);
        })
        .map((h) => h.id),
    );
    const todayLogs = logs.filter(
      (l) => l.date === today && scheduledHabitIds.has(l.habitId),
    );
    const habitsToday = {
      done: todayLogs.filter((l) => l.completed).length,
      total: scheduledHabitIds.size,
      active: habits.length,
      topStreak: habits.reduce((m, h) => Math.max(m, h.streakCurrent ?? 0), 0),
    };
    const habitsSpark = deriveHabitsSpark(habits, logs);

    // ── Fitness ──
    const fitnessStats = deriveFitness(workouts);
    // Volume sparkline aproximado: distribuimos weeklyVolume del store
    // como una sola barra; si querés ver evolución real habría que pedir
    // historical. Por ahora, una serie plana con valor actual.
    const volumeSpark = padSpark(
      workouts.slice(-30).map((w) => w.totalVolume || 0),
      30,
    );
    // Si está vacío, usamos weeklyVolume totalizado
    const volumeSparkFinal =
      volumeSpark.some((v) => v > 0)
        ? volumeSpark
        : new Array(30).fill(
            Object.values(weeklyVolume).reduce((a, b) => a + b, 0) / 7,
          );

    // ── Nutrición ──
    const nutritionData = {
      kcal: Math.round(nutriSummary?.totals.calories ?? 0),
      goal: nutriGoals?.calories ?? 2000,
      protein: Math.round(nutriSummary?.totals.protein ?? 0),
      carbs: Math.round(nutriSummary?.totals.carbs ?? 0),
      fat: Math.round(nutriSummary?.totals.fat ?? 0),
    };
    const kcalSpark = padSpark([nutritionData.kcal], 30);

    // ── Finanzas ──
    const financeData = deriveFinance(transactions);
    const savingSpark = padSpark([financeData.pct], 30);

    // ── Cycle: placeholder por ahora (módulo aparte) ──
    const cycleData = { day: 0, phase: "—", length: 28 };

    // ── Radar: 4 dimensiones reales desde life-score ──
    const radar = deriveRadar(lifeScoreNow, lifeScorePrev);

    // ── Habits Forest ──
    const habitsV2: HabitV2[] = habits
      .map(mapHabitToV2)
      .sort((a, b) => b.streak - a.streak);

    // ── Timeline ──
    const timeline = deriveTimeline(dayAgenda);

    // ── Heatmap 90d ──
    const heatmap90 = habitStoreLoaded
      ? deriveHeatmap(getHeatmapData(90))
      : new Array(90).fill(0);

    // ── Achievements ──
    const badge = deriveBadge(gamiBadges, habitsToday.topStreak);

    return {
      user: { name: userName, startedAt: user?.createdAt ?? "" },
      enabledModules: modules,
      lifeScore,
      lifeScorePrev: prevOverall,
      habitsToday,
      fitness: fitnessStats,
      nutrition: nutritionData,
      finance: financeData,
      cycle: cycleData,
      badge,
      sparks: {
        lifeScore: lifeScoreSpark,
        habits: habitsSpark,
        volume: volumeSparkFinal,
        kcal: kcalSpark,
        saving: savingSpark,
      },
      radar,
      habits: habitsV2,
      timeline,
      compound52: genCompound(52),
      heatmap90,
      isLoading: loading,
    };
  }, [
    user,
    modules,
    lifeScoreNow,
    lifeScorePrev,
    dayAgenda,
    habits,
    logs,
    workouts,
    weeklyVolume,
    nutriSummary,
    nutriGoals,
    transactions,
    gamiBadges,
    habitStoreLoaded,
    getHeatmapData,
    loading,
  ]);
}
