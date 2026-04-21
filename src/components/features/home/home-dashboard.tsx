'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import {
  TrendingUp, Flame, Award, Target, Sun, CloudSun, Sunset, Moon, Trophy, Clipboard, Check, Loader2
} from 'lucide-react';
import { useHabitStore } from '@/stores/habit-store';
import { useUserStore } from '@/stores/user-store';
import { cn, ErrorBanner } from '@/components/ui';
import AIExportButton from '@/components/features/ai-export/ai-export-button';
import { api } from '@/lib/api-client';

type LifeScoreApi = {
  overall: number;
  breakdown: Record<string, { score: number | null; reason?: string; samples: number }>;
  activeModules: string[];
  date: string;
  windowDays: number;
};

const LIFE_DIM_LABELS: Record<string, { label: string; icon: string }> = {
  habits:       { label: 'Hábitos',      icon: '✨' },
  fitness:      { label: 'Fitness',      icon: '💪' },
  nutrition:    { label: 'Nutrición',    icon: '🥗' },
  wellness:     { label: 'Bienestar',    icon: '🧘' },
  productivity: { label: 'Productividad', icon: '⚡' },
};

// Used for recharts/icon color props (not inline styles)
const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  warning: "#D4943A", warningLight: "#F5E0C0", danger: "#C0544F",
  dangerLight: "#F5D0CE", info: "#5A8FA8", infoLight: "#C8E0EC",
};

const motivationalQuotes = [
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "Cada hábito es una victoria pequeña que construye tu futuro.",
  "No cuentes los días, haz que los días cuenten.",
  "La consistencia es la clave del cambio verdadero.",
  "Tu futuro es creado por lo que haces hoy, no mañana.",
  "Los campeones no nacen, se construyen un hábito a la vez.",
  "El progreso es progreso, sin importar qué tan lento.",
  "Tú eres el arquitecto de tus propios hábitos.",
  "Cada día es una nueva oportunidad para ser mejor.",
  "La disciplina es elegirse a ti mismo cuando nadie te ve."
];

const CircularGauge: React.FC<{ value: number; maxValue: number }> = ({ value, maxValue }) => {
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
      <circle cx="60" cy="60" r="45" fill="none" stroke={C.lightCream} strokeWidth="3" />
      <circle cx="60" cy="60" r="45" fill="none" stroke={C.accentGlow} strokeWidth="3"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="[transition:stroke-dashoffset_0.5s_ease]" />
      <text x="60" y="60" textAnchor="middle" dy="0.3em" fontSize="28" fontWeight="bold"
        fill={C.accent} style={{ transform: 'rotate(90deg)', transformOrigin: '60px 60px' }}>
        {pct.toFixed(0)}%
      </text>
    </svg>
  );
};

const HabitCard: React.FC<{ emoji: string; name: string; streak: number; completed: boolean }> = ({ emoji, name, streak, completed }) => (
  <div className={cn(
    "flex items-center gap-3 p-3 border rounded-lg cursor-default mb-2",
    completed ? "bg-success-light border-success" : "bg-brand-paper border-brand-light-cream"
  )}>
    <span className="text-[20px]">{emoji}</span>
    <span className="flex-1 text-sm text-brand-brown">{name}</span>
    <div className="flex items-center gap-1 text-xs text-warning">
      <Flame size={14} fill={C.warning} /><span>{streak}</span>
    </div>
    {completed
      ? <span className="text-[11px] font-bold text-success bg-success-light px-2 py-[2px] rounded-[10px]">Hecho</span>
      : <span className="text-[11px] text-brand-warm bg-brand-light-cream px-2 py-[2px] rounded-[10px]">Pendiente</span>
    }
  </div>
);

// ── AI Analysis Card ───────────────────────────────────────────────────────────

function AIAnalysisCard() {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/export/ai-context?days=30&format=markdown');
      if (!res.ok) throw new Error();
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setToast('Resumen copiado. Pégalo en tu IA favorita para obtener recomendaciones');
      setTimeout(() => { setCopied(false); setToast(null); }, 4000);
    } catch {
      setToast('No se pudo generar el resumen. Intenta desde Configuración → Datos.');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-dark text-brand-paper px-6 py-3 rounded-lg text-sm z-[9999] shadow-[0_4px_12px_rgba(0,0,0,0.3)] whitespace-nowrap">
          {toast}
        </div>
      )}
      <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5 mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-base font-bold text-brand-brown mb-1">
            🤖 Analizar con IA
          </div>
          <div className="text-[13px] text-brand-warm">
            Copia un resumen completo de tus últimos 30 días para analizarlo con Claude o ChatGPT
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={cn(
            "px-6 py-3 text-brand-paper border-none rounded-lg font-bold text-sm flex items-center gap-2 transition-[background] duration-300 shrink-0",
            copied ? "bg-success cursor-pointer" : loading ? "bg-brand-light-tan cursor-not-allowed" : "bg-accent cursor-pointer"
          )}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : copied ? <Check size={16} /> : <Clipboard size={16} />}
          {loading ? 'Generando…' : copied ? '¡Copiado!' : 'Copiar Resumen'}
        </button>
      </div>
    </>
  );
}

// ── Strength helpers ──────────────────────────────────────────────────────────
const getStrengthLabel = (s: number) => s >= 90 ? 'Arraigado' : s >= 70 ? 'Formándose' : s >= 40 ? 'En progreso' : 'Nuevo';
const getStrengthClasses = (s: number): { text: string; bg: string } => {
  if (s >= 90) return { text: 'text-success', bg: 'bg-success' };
  if (s >= 70) return { text: 'text-accent',  bg: 'bg-accent'  };
  if (s >= 40) return { text: 'text-warning', bg: 'bg-warning' };
  return              { text: 'text-danger',  bg: 'bg-danger'  };
};
// Keep hex version for recharts/icon color props
const getStrengthColor = (s: number) => s >= 90 ? C.success : s >= 70 ? C.accent : s >= 40 ? C.warning : C.danger;

export default function HomeDashboard() {
  const habits = useHabitStore((s) => s.habits.filter(h => h.isActive !== false));
  const logs = useHabitStore((s) => s.logs);
  const error = useHabitStore((s) => s.error);
  const clearError = useHabitStore((s) => s.clearError);
  const { user } = useUserStore();
  const displayName = user?.name ?? 'Usuario';

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const [lifeScoreApi, setLifeScoreApi] = useState<LifeScoreApi | null>(null);
  useEffect(() => {
    let cancelled = false;
    api
      .get<LifeScoreApi>('/user/life-score')
      .then((data) => {
        if (!cancelled) setLifeScoreApi(data);
      })
      .catch(() => {
        // Fallback al avgStrength si el endpoint falla
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = useMemo(() => {
    const h = currentTime.getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  }, [currentTime]);

  const dateFormatted = useMemo(() => {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[currentTime.getDay()]}, ${currentTime.getDate()} de ${months[currentTime.getMonth()]} de ${currentTime.getFullYear()}`;
  }, [currentTime]);

  const quote = useMemo(() => motivationalQuotes[currentTime.getDate() % motivationalQuotes.length], [currentTime]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const completedTodayIds = useMemo(
    () => new Set(logs.filter(l => l.date === todayStr && l.completed).map(l => l.habitId)),
    [logs, todayStr]
  );

  const todayHabits = useMemo(() => habits, [habits]);

  const habitsByTime = useMemo(() => {
    const morning: typeof habits = [], afternoon: typeof habits = [], night: typeof habits = [], allDay: typeof habits = [];
    todayHabits.forEach(h => {
      if (h.timeOfDay === 'morning') morning.push(h);
      else if (h.timeOfDay === 'afternoon') afternoon.push(h);
      else if (h.timeOfDay === 'evening') night.push(h);
      else allDay.push(h);
    });
    return { morning, afternoon, allDay, night };
  }, [todayHabits]);

  const streakTotal = useMemo(() => habits.reduce((s, h) => s + (h.streakCurrent || 0), 0), [habits]);
  const bestStreak = useMemo(() => Math.max(0, ...habits.map(h => h.streakCurrent || 0)), [habits]);

  const avgStrength = useMemo(() => {
    if (habits.length === 0) return 0;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const rates = habits.map(h => {
      const habitLogs = logs.filter(l => l.habitId === h.id && l.date >= cutoffStr);
      const done = habitLogs.filter(l => l.completed).length;
      return done / 30;
    });
    return Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100);
  }, [habits, logs]);

  const topStreaks = useMemo(() =>
    [...habits].sort((a, b) => (b.streakCurrent || 0) - (a.streakCurrent || 0)).slice(0, 5),
    [habits]
  );

  const habitStrengthData = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return habits.map(h => {
      const habitLogs = logs.filter(l => l.habitId === h.id && l.date >= cutoffStr);
      const done = habitLogs.filter(l => l.completed).length;
      return { name: h.name, icon: h.icon, strength: Math.round((done / 30) * 100) };
    }).sort((a, b) => b.strength - a.strength);
  }, [habits, logs]);

  const weeklyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 6);
      const esStr = weekEnd.toISOString().split('T')[0];
      const ssStr = weekStart.toISOString().split('T')[0];
      const weekLogs = logs.filter(l => l.date >= ssStr && l.date <= esStr);
      const done = weekLogs.filter(l => l.completed).length;
      const total = weekLogs.length;
      return {
        week: `S-${i === 0 ? 'Actual' : i}`,
        score: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    }).reverse();
  }, [logs]);

  const heatmapData = useMemo(() => {
    return Array.from({ length: 90 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (89 - i));
      const ds = d.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.date === ds && l.completed);
      return { day: i + 1, dateStr: ds, count: dayLogs.length };
    });
  }, [logs]);

  const maxCount = useMemo(() => Math.max(1, ...heatmapData.map(d => d.count)), [heatmapData]);

  const completionRate = avgStrength / 100;
  const compoundData = useMemo(() => Array.from({ length: 52 }, (_, i) => ({
    week: i + 1,
    projected: +(100 * Math.pow(1.005, (i + 1) * 7)).toFixed(1),
    real: +(100 * Math.pow(1 + completionRate * 0.005, (i + 1) * 7)).toFixed(1),
    decline: +(100 * Math.pow(0.98, (i + 1) * 7)).toFixed(1),
  })), [completionRate]);

  const RADAR_CATEGORIES = ['Bienestar', 'Fitness', 'Nutrición', 'Productividad', 'Aprendizaje', 'Finanzas', 'Creatividad', 'Mindfulness'];
  const radarData = useMemo(() => {
    const thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - 6);
    const lastWeekStart = new Date(); lastWeekStart.setDate(lastWeekStart.getDate() - 13);
    const lastWeekEnd = new Date(); lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
    const twStr = thisWeekStart.toISOString().split('T')[0];
    const lwsStr = lastWeekStart.toISOString().split('T')[0];
    const lweStr = lastWeekEnd.toISOString().split('T')[0];
    return RADAR_CATEGORIES.map(cat => {
      const catHabits = habits.filter(h => h.category === cat);
      if (catHabits.length === 0) return { area: cat, thisWeek: 0, lastWeek: 0 };
      const ids = new Set(catHabits.map(h => h.id));
      const twLogs = logs.filter(l => ids.has(l.habitId) && l.date >= twStr);
      const lwLogs = logs.filter(l => ids.has(l.habitId) && l.date >= lwsStr && l.date <= lweStr);
      const twScore = twLogs.length > 0 ? Math.round((twLogs.filter(l => l.completed).length / twLogs.length) * 100) : 0;
      const lwScore = lwLogs.length > 0 ? Math.round((lwLogs.filter(l => l.completed).length / lwLogs.length) * 100) : 0;
      return { area: cat, thisWeek: twScore, lastWeek: lwScore };
    });
  }, [habits, logs]);

  const vsLastWeek = useMemo(() => {
    const today = new Date();
    const thisWeekStart = new Date(today); thisWeekStart.setDate(today.getDate() - 6);
    const lastWeekStart = new Date(today); lastWeekStart.setDate(today.getDate() - 13);
    const lastWeekEnd = new Date(today); lastWeekEnd.setDate(today.getDate() - 7);
    const twStr = thisWeekStart.toISOString().split('T')[0];
    const lwsStr = lastWeekStart.toISOString().split('T')[0];
    const lweStr = lastWeekEnd.toISOString().split('T')[0];
    const twLogs = logs.filter(l => l.date >= twStr);
    const lwLogs = logs.filter(l => l.date >= lwsStr && l.date <= lweStr);
    const twRate = twLogs.length > 0 ? (twLogs.filter(l => l.completed).length / twLogs.length) * 100 : 0;
    const lwRate = lwLogs.length > 0 ? (lwLogs.filter(l => l.completed).length / lwLogs.length) * 100 : 0;
    return +(twRate - lwRate).toFixed(1);
  }, [logs]);

  const lifeScore = lifeScoreApi?.overall ?? avgStrength;
  const lifeScoreBreakdown = lifeScoreApi?.breakdown ?? null;
  const medals = ['🥇', '🥈', '🥉', '🏆', '🏆'];
  const todayPct = todayHabits.length > 0 ? (completedTodayIds.size / todayHabits.length) * 100 : 0;

  return (
    <div className="bg-brand-paper">
      <ErrorBanner error={error} onDismiss={clearError} />
      {/* Welcome Banner */}
      <div className="bg-[linear-gradient(135deg,#3D2B1F_0%,#6B4226_100%)] rounded-[16px] p-8 text-brand-paper mb-8 shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-start gap-6">
          <div className="flex-1">
            <div className="text-sm text-brand-light-tan mb-2">{dateFormatted}</div>
            <h1 className="font-display text-[36px] font-bold m-0 mb-4 text-accent-glow">
              {greeting}, {displayName}
            </h1>
            <p className="text-sm text-brand-light-cream m-0 italic max-w-[400px] mb-4">
              &ldquo;{quote}&rdquo;
            </p>
            <div className="flex flex-wrap gap-2">
              <AIExportButton
                scope="daily"
                label="Cierre del día → IA"
                title="Cierre del día"
                variant="primary"
                size="md"
              />
              <AIExportButton
                scope="weekly"
                label="Resumen semanal"
                title="Resumen semanal"
                variant="outline"
                size="md"
                className="!bg-transparent !border-brand-light-tan/40 !text-brand-light-cream hover:!bg-white/10"
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <CircularGauge value={lifeScore} maxValue={100} />
            <div className="text-xs text-brand-light-tan text-center">Puntuación de Vida</div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-4">
          <div className="text-xs text-brand-warm mb-2">vs. Semana Pasada</div>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("text-[24px] font-bold", vsLastWeek >= 0 ? "text-success" : "text-danger")}>
              {vsLastWeek >= 0 ? '+' : ''}{vsLastWeek}%
            </span>
            <TrendingUp size={20} color={vsLastWeek >= 0 ? C.success : C.danger} />
          </div>
          <div className="text-xs text-brand-tan">
            {habits.length === 0 ? 'Agrega hábitos para comparar' : vsLastWeek >= 0 ? 'Mejora consistente' : 'Sigue adelante'}
          </div>
        </div>

        <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-4">
          <div className="text-xs text-brand-warm mb-2">Mejor Racha Activa</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[24px] font-bold text-warning">{bestStreak}</span>
            <Flame size={20} fill={C.warning} color={C.warning} />
          </div>
          <div className="text-xs text-brand-tan">Días consecutivos</div>
        </div>

        <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-4">
          <div className="text-xs text-brand-warm mb-2">Tasa de Completación</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[24px] font-bold text-info">{avgStrength}%</span>
            <Award size={20} color={C.info} />
          </div>
          <div className="w-full h-1 bg-brand-cream rounded-[2px] overflow-hidden">
            <div className="h-full bg-info rounded-[2px]" style={{ width: `${avgStrength}%` }} />
          </div>
        </div>

        <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-4">
          <div className="text-xs text-brand-warm mb-2">Progreso de Hoy</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[24px] font-bold text-accent">
              {completedTodayIds.size}/{todayHabits.length}
            </span>
            <Target size={20} color={C.accent} />
          </div>
          <div className="w-full h-1 bg-brand-cream rounded-[2px] overflow-hidden">
            <div className="h-full bg-accent rounded-[2px]" style={{ width: `${todayPct}%` }} />
          </div>
        </div>
      </div>

      {/* Life Score Breakdown */}
      {lifeScoreBreakdown && (
        <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-bold text-brand-brown m-0">
                Life Score — desglose 7d
              </h2>
              <p className="text-xs text-brand-warm mt-0.5">
                Promedio ponderado de dimensiones activas. Rojo &lt;40 · Ámbar 40-70 · Verde ≥70.
              </p>
            </div>
            <div className="text-right">
              <div className="text-[32px] font-bold text-accent leading-none">{lifeScore}</div>
              <div className="text-[10px] uppercase tracking-widest text-brand-warm">de 100</div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {(Object.entries(LIFE_DIM_LABELS) as [string, { label: string; icon: string }][]).map(
              ([key, meta]) => {
                const dim = lifeScoreBreakdown[key];
                const score = dim?.score;
                const colorClass =
                  score === null || score === undefined
                    ? 'text-brand-tan'
                    : score >= 70
                    ? 'text-success'
                    : score >= 40
                    ? 'text-warning'
                    : 'text-danger';
                const barColor =
                  score === null || score === undefined
                    ? 'bg-brand-cream'
                    : score >= 70
                    ? 'bg-success'
                    : score >= 40
                    ? 'bg-warning'
                    : 'bg-danger';
                return (
                  <div
                    key={key}
                    className="bg-brand-warm-white border border-brand-cream rounded-lg p-3"
                    title={dim?.reason ?? 'Módulo desactivado'}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{meta.icon}</span>
                      <span className="text-[11px] uppercase tracking-wider text-brand-medium font-semibold">
                        {meta.label}
                      </span>
                    </div>
                    <div className={cn('text-xl font-bold leading-none mb-2', colorClass)}>
                      {score === null || score === undefined ? '—' : Math.round(score)}
                    </div>
                    <div className="w-full h-1 bg-brand-cream rounded-[2px] overflow-hidden">
                      <div
                        className={cn('h-full rounded-[2px] transition-all', barColor)}
                        style={{ width: `${score ?? 0}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Today's Habits + Radar */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5">
          <h2 className="text-[18px] font-bold text-brand-brown m-0 mb-4">Hábitos de Hoy</h2>
          {todayHabits.length === 0 && (
            <div className="text-center p-5 text-brand-tan text-sm">
              No hay hábitos programados para hoy. Agrégalos en Productividad → Hábitos.
            </div>
          )}
          {habitsByTime.morning.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-[10px] text-[13px] text-brand-brown font-bold">
                <Sun size={16} color={C.warning} /> Mañana
              </div>
              {habitsByTime.morning.map(h => (
                <HabitCard key={h.id} emoji={h.icon || '⭐'} name={h.name} streak={h.streakCurrent || 0} completed={completedTodayIds.has(h.id)} />
              ))}
            </div>
          )}
          {habitsByTime.afternoon.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-[10px] text-[13px] text-brand-brown font-bold">
                <Sunset size={16} color={C.warning} /> Tarde
              </div>
              {habitsByTime.afternoon.map(h => (
                <HabitCard key={h.id} emoji={h.icon || '⭐'} name={h.name} streak={h.streakCurrent || 0} completed={completedTodayIds.has(h.id)} />
              ))}
            </div>
          )}
          {habitsByTime.allDay.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-[10px] text-[13px] text-brand-brown font-bold">
                <CloudSun size={16} color={C.info} /> Todo el Día
              </div>
              {habitsByTime.allDay.map(h => (
                <HabitCard key={h.id} emoji={h.icon || '⭐'} name={h.name} streak={h.streakCurrent || 0} completed={completedTodayIds.has(h.id)} />
              ))}
            </div>
          )}
          {habitsByTime.night.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-[10px] text-[13px] text-brand-brown font-bold">
                <Moon size={16} color={C.dark} /> Noche
              </div>
              {habitsByTime.night.map(h => (
                <HabitCard key={h.id} emoji={h.icon || '⭐'} name={h.name} streak={h.streakCurrent || 0} completed={completedTodayIds.has(h.id)} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5">
          <h2 className="text-[18px] font-bold text-brand-brown m-0 mb-1">Tu Vida en Balance</h2>
          <p className="text-xs text-brand-tan m-0 mb-3">Basado en completación por categoría esta semana</p>
          {habits.length === 0 ? (
            <div className="text-center p-10 text-brand-tan text-sm">
              Agrega hábitos con categorías para ver el radar
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData.filter(d => d.thisWeek > 0 || d.lastWeek > 0)}>
                <PolarGrid stroke={C.lightCream} />
                <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: C.brown }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: C.tan }} domain={[0, 100]} />
                <Radar name="Esta Semana" dataKey="thisWeek" stroke={C.accent} fill={C.accent} fillOpacity={0.4} />
                <Radar name="Semana Pasada" dataKey="lastWeek" stroke={C.lightTan} fill={C.lightTan} fillOpacity={0.1} strokeDasharray="5 5" />
                <Legend wrapperStyle={{ paddingTop: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 12-Week Evolution */}
      <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5 mb-8">
        <h2 className="text-[18px] font-bold text-brand-brown m-0 mb-1">Evolución de 12 Semanas</h2>
        <p className="text-xs text-brand-tan m-0 mb-4">% de hábitos completados por semana</p>
        {logs.length === 0 ? (
          <div className="text-center p-10 text-brand-tan">Completa hábitos para ver tu evolución</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.accent} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.brown }} />
              <YAxis tick={{ fontSize: 11, fill: C.brown }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ background: C.warmWhite, border: `1px solid ${C.lightCream}`, borderRadius: '8px' }} formatter={(v: number) => [`${v}%`, 'Completados']} />
              <Area type="monotone" dataKey="score" stroke={C.accent} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 90-Day Heatmap */}
      <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5 mb-8">
        <h2 className="text-[18px] font-bold text-brand-brown m-0 mb-1">Mapa de Consistencia (90 días)</h2>
        <p className="text-xs text-brand-tan m-0 mb-4">Cada cuadro = 1 día. Oscuro = más hábitos completados.</p>
        <div className="grid [grid-template-columns:repeat(15,1fr)] gap-[3px] mb-3 max-w-[320px]">
          {heatmapData.map((d, i) => {
            const intensity = maxCount > 0 ? d.count / maxCount : 0;
            const heatBg = intensity === 0 ? 'bg-brand-cream'
              : intensity < 0.33 ? 'bg-accent-light'
              : intensity < 0.66 ? 'bg-accent'
              : 'bg-brand-brown';
            return (
              <div
                key={i}
                title={`${d.dateStr}: ${d.count} completado(s)`}
                className={cn('w-[14px] h-[14px] rounded-[3px] cursor-pointer transition-transform duration-100', heatBg)}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-[6px] text-xs text-brand-tan">
          <span>Ninguno</span>
          {(['bg-brand-cream', 'bg-accent-light', 'bg-accent', 'bg-brand-brown'] as const).map((bgClass, i) => (
            <div key={i} className={cn('w-3 h-3 rounded-[2px]', bgClass)} />
          ))}
          <span>Máximo</span>
        </div>
      </div>

      {/* Top Streaks + Habit Strength */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5">
          <h2 className="text-[18px] font-bold text-brand-brown m-0 mb-4">Top Streaks</h2>
          {topStreaks.length === 0 ? (
            <div className="text-center p-5 text-brand-tan text-sm">Aún no hay rachas. ¡Completa tu primer hábito!</div>
          ) : topStreaks.map((h, i) => (
            <div key={h.id} className="flex justify-between items-center p-3 bg-brand-light-cream rounded-lg mb-2">
              <div className="flex items-center gap-3">
                <span className="text-[22px]">{medals[i]}</span>
                <div>
                  <div className="text-sm font-bold text-brand-brown">{h.name}</div>
                  <div className="text-xs text-brand-tan">{h.icon}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-accent">
                <Flame size={16} fill={C.accent} />{h.streakCurrent || 0}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5">
          <h2 className="text-[18px] font-bold text-brand-brown m-0 mb-1">Fortaleza de Hábitos</h2>
          <p className="text-xs text-brand-tan m-0 mb-4">% completado en los últimos 30 días</p>
          {habitStrengthData.length === 0 ? (
            <div className="text-center p-5 text-brand-tan text-sm">Agrega hábitos para ver su fortaleza</div>
          ) : habitStrengthData.map((h, i) => {
            const classes = getStrengthClasses(h.strength);
            return (
              <div key={i} className="mb-[14px]">
                <div className="flex justify-between items-center mb-[5px]">
                  <div className="text-[13px] font-bold text-brand-brown">{h.icon} {h.name}</div>
                  <div className={cn("text-[11px] font-bold", classes.text)}>{getStrengthLabel(h.strength)}</div>
                </div>
                <div className="w-full h-[6px] bg-brand-cream rounded-[3px] overflow-hidden">
                  <div
                    className={cn("h-full rounded-[3px] transition-[width] duration-500", classes.bg)}
                    style={{ width: `${h.strength}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compound Effect */}
      <div className="bg-brand-paper border border-brand-light-cream rounded-xl p-5 mb-8">
        <h2 className="text-[18px] font-bold text-brand-brown m-0 mb-1">Efecto Compuesto</h2>
        <p className="text-xs text-brand-tan m-0 mb-4">
          Con tu tasa actual ({avgStrength}%) vs máximo (+0.5%/día) vs abandono (-2%/semana). Proyección a 52 semanas.
        </p>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={compoundData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: C.brown }} label={{ value: 'Semanas', position: 'insideBottom', offset: -4, fill: C.tan, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10, fill: C.brown }} />
            <Tooltip contentStyle={{ background: C.warmWhite, border: `1px solid ${C.lightCream}`, borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="projected" stroke={C.success} name="+0.5%/día (máximo)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="real" stroke={C.accent} name={`Tu ritmo (${avgStrength}%)`} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="decline" stroke={C.danger} name="Si abandono" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Analysis Card */}
      <AIAnalysisCard />

      {/* Motivational Footer */}
      <div className="bg-[linear-gradient(135deg,#3D2B1F_0%,#6B4226_100%)] rounded-[16px] p-6 text-brand-paper text-center shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
        <div className="flex justify-center mb-3">
          <Trophy size={32} color={C.accentGlow} />
        </div>
        <h3 className="text-[18px] font-bold m-0 mb-2 text-accent-glow">
          {streakTotal} días de fuego en total — ¡sigue así!
        </h3>
        <p className="text-[13px] text-brand-light-cream m-0">
          Tasa de completación: {avgStrength}% · {habits.length} hábito{habits.length !== 1 ? 's' : ''} activo{habits.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
