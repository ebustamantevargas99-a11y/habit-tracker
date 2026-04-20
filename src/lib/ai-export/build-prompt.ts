import type { ExportScope, AnalysisStyle } from "./types";

type ProfileSummary = {
  name: string;
  ageYears?: number;
  biologicalSex?: string | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  activityLevel?: string | null;
  fitnessLevel?: string | null;
  primaryGoals?: string[];
  interests?: string[];
  units?: string;
  timezone?: string;
};

type DaySnapshot = {
  date: string;
  habitsCompleted: { name: string; streak: number; completed: boolean }[];
  mood?: { score: number; emotions: string[]; factors: string[]; notes?: string | null } | null;
  sleep?: { hours: number; quality?: number | null; bedtime?: string | null; wakeTime?: string | null } | null;
  hydrationMl?: number;
  hydrationGoalMl?: number;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    meals: number;
  } | null;
  workout?: {
    name: string;
    durationMinutes: number;
    volume: number;
    prsHit: number;
    exercises: number;
  } | null;
  tasksCompleted?: number;
  tasksTotal?: number;
  pomodoros?: number;
  finance?: {
    income: number;
    expenses: number;
    netChange: number;
  } | null;
};

type PeriodAggregates = {
  daysActive: number;
  habitAverageCompletion: number;
  bestHabit?: { name: string; pct: number };
  worstHabit?: { name: string; pct: number };
  sleepAverageHours: number;
  moodAverage?: number;
  workoutsCount: number;
  workoutsPlanned?: number;
  totalVolumeKg?: number;
  caloriesAverage?: number;
  netIncome?: number;
  newPRs?: number;
};

export type PromptContext = {
  profile: ProfileSummary;
  scope: ExportScope;
  style: AnalysisStyle;
  range: { from: string; to: string; days: number };
  today?: DaySnapshot;
  aggregates?: PeriodAggregates;
  customQuestion?: string;
};

const STYLE_INTROS: Record<AnalysisStyle, string> = {
  coach:
    "Eres mi coach personal. Analiza mis datos y dame feedback directo, accionable y motivador. Sé específico: dime exactamente qué hacer mañana.",
  analyst:
    "Eres un analista de datos. Revisa los números y dime patrones, correlaciones y anomalías. Solo datos y lógica. Cero motivación, solo insight objetivo.",
  retrospective:
    "Ayúdame a reflexionar sobre este período. Haz preguntas que me ayuden a entender lo que viví, aprendí y sentí. No des consejos — pregunta.",
  projection:
    "Usa mis datos para proyectar escenarios futuros. Dado mi ritmo actual, ¿dónde estaré en 3/6/12 meses? ¿Qué riesgos y oportunidades ves?",
};

const DEFAULT_QUESTIONS: Record<ExportScope, string> = {
  daily: "¿Cómo estuvo mi día y qué cambiaría para mañana?",
  weekly: "Detecta patrones de la semana y dime qué priorizar.",
  monthly: "Resumen del mes: qué funcionó, qué no, y enfoque del próximo mes.",
  fitness: "Evalúa mi progreso de fitness. ¿Estoy sobrecargando progresivamente? ¿Qué músculo descuido?",
  finance: "Analiza mi comportamiento financiero y sugiéreme ajustes.",
  wellness: "Correlaciona sueño + mood + estrés. ¿Qué me está afectando?",
  nutrition: "Mi relación calorías/macros vs objetivo. Detecta déficit o exceso crónico.",
  habits: "Qué hábitos están muriendo, cuáles están sólidos, y qué habit stacking sugieres.",
  holistic: "Vista 360 de mi vida. Conecta dominios — cómo lo que hago en X afecta Y.",
};

export function buildPrompt(ctx: PromptContext): string {
  const lines: string[] = [];

  lines.push(STYLE_INTROS[ctx.style]);
  lines.push("");
  lines.push(`--- CONTEXTO ---`);
  lines.push(`Fecha del reporte: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`Período analizado: ${ctx.range.from} a ${ctx.range.to} (${ctx.range.days} día${ctx.range.days === 1 ? "" : "s"})`);
  lines.push("");

  lines.push(`--- MI PERFIL ---`);
  lines.push(`Nombre: ${ctx.profile.name}`);
  if (ctx.profile.ageYears) lines.push(`Edad: ${ctx.profile.ageYears}`);
  if (ctx.profile.biologicalSex) lines.push(`Sexo biológico: ${ctx.profile.biologicalSex}`);
  if (ctx.profile.gender) lines.push(`Género: ${ctx.profile.gender}`);
  if (ctx.profile.heightCm)
    lines.push(`Estatura: ${ctx.profile.heightCm}${ctx.profile.units === "imperial" ? " in" : " cm"}`);
  if (ctx.profile.weightKg)
    lines.push(`Peso: ${ctx.profile.weightKg}${ctx.profile.units === "imperial" ? " lb" : " kg"}`);
  if (ctx.profile.activityLevel) lines.push(`Nivel de actividad: ${ctx.profile.activityLevel}`);
  if (ctx.profile.fitnessLevel) lines.push(`Nivel fitness: ${ctx.profile.fitnessLevel}`);
  if (ctx.profile.primaryGoals?.length)
    lines.push(`Metas principales: ${ctx.profile.primaryGoals.join(", ")}`);
  if (ctx.profile.interests?.length)
    lines.push(`Intereses: ${ctx.profile.interests.join(", ")}`);
  lines.push("");

  if (ctx.today) {
    lines.push(`--- HOY (${ctx.today.date}) ---`);
    appendDaySnapshot(lines, ctx.today);
    lines.push("");
  }

  if (ctx.aggregates) {
    lines.push(`--- AGREGADOS DEL PERÍODO ---`);
    appendAggregates(lines, ctx.aggregates);
    lines.push("");
  }

  const question = ctx.customQuestion?.trim() || DEFAULT_QUESTIONS[ctx.scope];
  lines.push(`--- PREGUNTA ---`);
  lines.push(question);

  return lines.join("\n");
}

function appendDaySnapshot(lines: string[], d: DaySnapshot) {
  if (d.habitsCompleted.length) {
    const done = d.habitsCompleted.filter((h) => h.completed).length;
    const total = d.habitsCompleted.length;
    lines.push(`HÁBITOS: ${done}/${total} completados`);
    for (const h of d.habitsCompleted) {
      const mark = h.completed ? "✅" : "❌";
      const streakText = h.streak > 0 ? ` (racha ${h.streak})` : "";
      lines.push(`  ${mark} ${h.name}${streakText}`);
    }
  }

  if (d.workout) {
    lines.push(
      `FITNESS: ${d.workout.name} · ${d.workout.durationMinutes}min · volumen ${Math.round(d.workout.volume)}kg · ${d.workout.prsHit} PRs · ${d.workout.exercises} ejercicios`
    );
  } else {
    lines.push("FITNESS: sin entreno");
  }

  if (d.nutrition) {
    lines.push(
      `NUTRICIÓN: ${Math.round(d.nutrition.calories)} kcal · P ${Math.round(d.nutrition.protein)}g · C ${Math.round(d.nutrition.carbs)}g · F ${Math.round(d.nutrition.fat)}g · ${d.nutrition.meals} comidas`
    );
  }

  if (d.sleep) {
    const qual = d.sleep.quality != null ? ` (calidad ${d.sleep.quality}/10)` : "";
    lines.push(`SUEÑO: ${d.sleep.hours.toFixed(1)}h${qual}`);
  }

  if (d.hydrationMl != null) {
    const goal = d.hydrationGoalMl ? ` / objetivo ${d.hydrationGoalMl}ml` : "";
    lines.push(`HIDRATACIÓN: ${d.hydrationMl}ml${goal}`);
  }

  if (d.mood) {
    const factors = d.mood.factors.length ? ` — factores: ${d.mood.factors.join(", ")}` : "";
    lines.push(`MOOD: ${d.mood.score}/10${factors}`);
    if (d.mood.notes) lines.push(`  Nota: ${d.mood.notes}`);
  }

  if (d.tasksTotal != null) {
    lines.push(`TAREAS: ${d.tasksCompleted ?? 0}/${d.tasksTotal} completadas`);
  }

  if (d.pomodoros != null) {
    lines.push(`POMODOROS: ${d.pomodoros} sesiones`);
  }

  if (d.finance) {
    const sign = d.finance.netChange >= 0 ? "+" : "";
    lines.push(
      `FINANZAS: ingreso +$${d.finance.income.toFixed(0)} · gasto -$${d.finance.expenses.toFixed(0)} · neto ${sign}$${d.finance.netChange.toFixed(0)}`
    );
  }
}

function appendAggregates(lines: string[], a: PeriodAggregates) {
  lines.push(`Días con registro: ${a.daysActive}`);
  lines.push(`Completion promedio hábitos: ${(a.habitAverageCompletion * 100).toFixed(0)}%`);
  if (a.bestHabit)
    lines.push(`Hábito más fuerte: ${a.bestHabit.name} (${(a.bestHabit.pct * 100).toFixed(0)}%)`);
  if (a.worstHabit)
    lines.push(`Hábito más débil: ${a.worstHabit.name} (${(a.worstHabit.pct * 100).toFixed(0)}%)`);
  lines.push(`Sueño promedio: ${a.sleepAverageHours.toFixed(1)}h`);
  if (a.moodAverage != null) lines.push(`Mood promedio: ${a.moodAverage.toFixed(1)}/10`);
  lines.push(
    `Entrenos: ${a.workoutsCount}${a.workoutsPlanned ? `/${a.workoutsPlanned}` : ""}`
  );
  if (a.totalVolumeKg) lines.push(`Volumen total: ${Math.round(a.totalVolumeKg)}kg`);
  if (a.caloriesAverage != null) lines.push(`Calorías promedio: ${Math.round(a.caloriesAverage)} kcal`);
  if (a.netIncome != null)
    lines.push(`Balance financiero: ${a.netIncome >= 0 ? "+" : ""}$${a.netIncome.toFixed(0)}`);
  if (a.newPRs) lines.push(`Nuevos PRs: ${a.newPRs}`);
}
