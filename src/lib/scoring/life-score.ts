import { prisma } from "@/lib/prisma";

export type LifeDimension =
  | "habits"
  | "fitness"
  | "nutrition"
  | "wellness"
  | "productivity";

export type DimensionScore = {
  score: number | null; // 0-100, null si no aplica / sin datos
  reason?: string;       // para UI/debug
  samples: number;       // cuántos datapoints contribuyeron
};

export type LifeScoreBreakdown = Record<LifeDimension, DimensionScore>;

export type LifeScoreResult = {
  overall: number;              // 0-100 weighted
  breakdown: LifeScoreBreakdown;
  weightsApplied: Record<LifeDimension, number>;
  activeModules: string[];
  date: string;                 // YYYY-MM-DD final del window
  windowDays: number;           // 7
  generatedAt: string;          // ISO
};

const DIMENSION_MODULES: Record<LifeDimension, string[]> = {
  habits:       ["habits"],
  fitness:      ["fitness"],
  nutrition:    ["nutrition"],
  wellness:     ["wellness", "mood", "sleep"],
  productivity: ["productivity", "tasks", "projects", "planner"],
};

const DEFAULT_WEIGHTS: Record<LifeDimension, number> = {
  habits:       1.0,
  fitness:      0.8,
  nutrition:    0.8,
  wellness:     1.0,
  productivity: 0.7,
};

function daysBackISO(fromDate: Date, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(fromDate);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function hasModule(enabled: string[], dim: LifeDimension): boolean {
  const related = DIMENSION_MODULES[dim];
  return related.some((m) => enabled.includes(m));
}

// ─── Scoring por dimensión ────────────────────────────────────────────────────

async function scoreHabits(userId: string, dates: string[]): Promise<DimensionScore> {
  const logs = await prisma.habitLog.findMany({
    where: { userId, date: { in: dates } },
    select: { completed: true },
  });
  if (logs.length === 0) return { score: null, samples: 0, reason: "Sin logs en 7d" };
  const completed = logs.filter((l) => l.completed).length;
  const score = clamp((completed / logs.length) * 100);
  return { score, samples: logs.length, reason: `${completed}/${logs.length} completados` };
}

async function scoreFitness(userId: string, dates: string[]): Promise<DimensionScore> {
  const workouts = await prisma.workout.findMany({
    where: { userId, date: { in: dates }, completed: true },
    select: { id: true, date: true },
  });
  const uniqueDays = new Set(workouts.map((w) => w.date));
  const target = 4; // 4 días/semana estándar intermedio
  const ratio = uniqueDays.size / target;
  // Curva: 0 días = 0, 4 días = 100, 5-7 días = 100 (no penalizar más)
  const score = clamp(ratio * 100);
  return {
    score,
    samples: uniqueDays.size,
    reason: `${uniqueDays.size} día(s) entrenados / meta 4`,
  };
}

async function scoreNutrition(userId: string, dates: string[]): Promise<DimensionScore> {
  const [meals, goal] = await Promise.all([
    prisma.mealLog.findMany({
      where: { userId, date: { in: dates } },
      include: { items: { select: { calories: true } } },
    }),
    prisma.nutritionGoal.findUnique({ where: { userId } }),
  ]);

  if (meals.length === 0) return { score: null, samples: 0, reason: "Sin comidas registradas" };

  const calorieGoal = goal?.calories ?? 2000;
  // Agrupar calorías por día
  const caloriesByDate: Record<string, number> = {};
  for (const meal of meals) {
    const total = meal.items.reduce((s, i) => s + i.calories, 0);
    caloriesByDate[meal.date] = (caloriesByDate[meal.date] ?? 0) + total;
  }

  const loggedDays = Object.keys(caloriesByDate).length;
  // Score = 2 componentes:
  // 1. Consistencia: % días con al menos 1 meal (de 7)
  const consistency = (loggedDays / dates.length) * 100;
  // 2. Precisión: % días dentro del ±15% del goal
  const withinRange = Object.values(caloriesByDate).filter(
    (c) => c >= calorieGoal * 0.85 && c <= calorieGoal * 1.15
  ).length;
  const precision = loggedDays > 0 ? (withinRange / loggedDays) * 100 : 0;

  const score = clamp(consistency * 0.6 + precision * 0.4);
  return {
    score,
    samples: loggedDays,
    reason: `${loggedDays}/${dates.length}d con logs · ${withinRange} dentro de rango`,
  };
}

async function scoreWellness(userId: string, dates: string[]): Promise<DimensionScore> {
  const [moods, sleeps] = await Promise.all([
    prisma.moodLog.findMany({
      where: { userId, date: { in: dates } },
      select: { mood: true },
    }),
    prisma.sleepLog.findMany({
      where: { userId, date: { in: dates } },
      select: { durationHours: true, quality: true },
    }),
  ]);

  if (moods.length === 0 && sleeps.length === 0) {
    return { score: null, samples: 0, reason: "Sin mood ni sueño" };
  }

  // Mood: avg en escala 1-10 → 0-100
  const moodAvg = moods.length
    ? (moods.reduce((s, m) => s + m.mood, 0) / moods.length) * 10
    : null;

  // Sleep: avg hours vs 8h ideal, y quality 1-10 → 0-100
  let sleepScore: number | null = null;
  if (sleeps.length) {
    const avgHours = sleeps.reduce((s, x) => s + x.durationHours, 0) / sleeps.length;
    const avgQuality = sleeps.reduce((s, x) => s + x.quality, 0) / sleeps.length;
    // Hours: 8h = 100, 6h = 70, 5h = 40
    const hoursScore = clamp((avgHours / 8) * 100);
    const qualityScore = avgQuality * 10;
    sleepScore = (hoursScore + qualityScore) / 2;
  }

  const parts: number[] = [];
  if (moodAvg !== null) parts.push(moodAvg);
  if (sleepScore !== null) parts.push(sleepScore);
  const score = clamp(parts.reduce((a, b) => a + b, 0) / parts.length);

  return {
    score,
    samples: moods.length + sleeps.length,
    reason: `${moods.length} mood · ${sleeps.length} sleep`,
  };
}

async function scoreProductivity(userId: string, dates: string[]): Promise<DimensionScore> {
  // Tareas completadas en la ventana (via dueDate en rango)
  const tasks = await prisma.projectTask.findMany({
    where: {
      project: { userId },
      OR: [
        { dueDate: { in: dates } },
        { updatedAt: { gte: new Date(dates[dates.length - 1] + "T00:00:00Z") } },
      ],
    },
    select: { status: true, dueDate: true, updatedAt: true },
  });
  if (tasks.length === 0) {
    return { score: null, samples: 0, reason: "Sin tareas en 7d" };
  }
  const done = tasks.filter((t) => t.status === "completed" || t.status === "done").length;
  const score = clamp((done / tasks.length) * 100);
  return {
    score,
    samples: tasks.length,
    reason: `${done}/${tasks.length} hechas`,
  };
}

// ─── Agregador ────────────────────────────────────────────────────────────────

export async function computeLifeScore(
  userId: string,
  options?: { date?: string; windowDays?: number; persistSnapshot?: boolean }
): Promise<LifeScoreResult> {
  const windowDays = options?.windowDays ?? 7;
  const endDate = options?.date
    ? new Date(options.date + "T00:00:00Z")
    : new Date();
  const dates = daysBackISO(endDate, windowDays);
  const endISO = dates[0];

  // Leer perfil para saber qué módulos están activos y sus pesos
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { enabledModules: true, lifeScoreWeights: true },
  });
  const enabled = profile?.enabledModules ?? [];
  const userWeights =
    (profile?.lifeScoreWeights as Record<string, number> | null) ?? {};

  // Scores por dimensión (paralelo)
  const [habits, fitness, nutrition, wellness, productivity] = await Promise.all([
    scoreHabits(userId, dates),
    hasModule(enabled, "fitness")
      ? scoreFitness(userId, dates)
      : Promise.resolve({ score: null, samples: 0, reason: "Módulo desactivado" } as DimensionScore),
    hasModule(enabled, "nutrition")
      ? scoreNutrition(userId, dates)
      : Promise.resolve({ score: null, samples: 0, reason: "Módulo desactivado" } as DimensionScore),
    hasModule(enabled, "wellness")
      ? scoreWellness(userId, dates)
      : Promise.resolve({ score: null, samples: 0, reason: "Módulo desactivado" } as DimensionScore),
    hasModule(enabled, "productivity")
      ? scoreProductivity(userId, dates)
      : Promise.resolve({ score: null, samples: 0, reason: "Módulo desactivado" } as DimensionScore),
  ]);

  const breakdown: LifeScoreBreakdown = {
    habits,
    fitness,
    nutrition,
    wellness,
    productivity,
  };

  // Aplicar pesos: por default usamos DEFAULT_WEIGHTS; si user tiene weights custom
  // en el perfil (pueden existir como "fitness": 0.15 estilo legacy), los
  // respetamos normalizando al rango de DEFAULT_WEIGHTS.
  const weightsApplied: Record<LifeDimension, number> = { ...DEFAULT_WEIGHTS };
  for (const dim of Object.keys(weightsApplied) as LifeDimension[]) {
    const override = userWeights[dim];
    if (typeof override === "number" && override >= 0) {
      // Escalar al rango esperado (legacy era 0-1 en suma), multiplicamos ×5 para
      // aproximar al rango 0-1 por dimensión.
      weightsApplied[dim] = clamp(override * 5, 0, 2);
    }
    // Si la dimensión no aplica (score null), peso efectivo = 0
    if (breakdown[dim].score === null) weightsApplied[dim] = 0;
  }

  const totalWeight = Object.values(weightsApplied).reduce((a, b) => a + b, 0);
  let overall = 0;
  if (totalWeight > 0) {
    let weightedSum = 0;
    for (const dim of Object.keys(weightsApplied) as LifeDimension[]) {
      const s = breakdown[dim].score;
      if (s !== null) weightedSum += s * weightsApplied[dim];
    }
    overall = Math.round(weightedSum / totalWeight);
  }

  const result: LifeScoreResult = {
    overall: clamp(overall),
    breakdown,
    weightsApplied,
    activeModules: enabled,
    date: endISO,
    windowDays,
    generatedAt: new Date().toISOString(),
  };

  // Persistir snapshot (lazy). Ignora el error — snapshot es best-effort.
  if (options?.persistSnapshot !== false) {
    try {
      await prisma.lifeScoreSnapshot.upsert({
        where: { userId_date: { userId, date: endISO } },
        create: {
          userId,
          date: endISO,
          overall: result.overall,
          breakdown: breakdown as unknown as object,
        },
        update: {
          overall: result.overall,
          breakdown: breakdown as unknown as object,
        },
      });
    } catch (err) {
      console.error("[life-score] snapshot upsert failed:", err);
    }
  }

  return result;
}

// ─── Histórico ────────────────────────────────────────────────────────────────

export type LifeScorePoint = {
  date: string;
  overall: number;
};

export async function getLifeScoreHistory(
  userId: string,
  days: number
): Promise<LifeScorePoint[]> {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const startISO = start.toISOString().split("T")[0];
  const endISO = end.toISOString().split("T")[0];

  const rows = await prisma.lifeScoreSnapshot.findMany({
    where: { userId, date: { gte: startISO, lte: endISO } },
    select: { date: true, overall: true },
    orderBy: { date: "asc" },
  });

  return rows.map((r) => ({ date: r.date, overall: r.overall }));
}

// ─── Helpers puros para tests ─────────────────────────────────────────────────

export const __testing = {
  clamp,
  daysBackISO,
  hasModule,
  DEFAULT_WEIGHTS,
};
