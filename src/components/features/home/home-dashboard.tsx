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
    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="60" cy="60" r="45" fill="none" stroke={C.lightCream} strokeWidth="3" />
      <circle cx="60" cy="60" r="45" fill="none" stroke={C.accentGlow} strokeWidth="3"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      <text x="60" y="60" textAnchor="middle" dy="0.3em" fontSize="28" fontWeight="bold"
        fill={C.accent} style={{ transform: 'rotate(90deg)', transformOrigin: '60px 60px' }}>
        {pct.toFixed(0)}%
      </text>
    </svg>
  );
};

const HabitCard: React.FC<{ emoji: string; name: string; streak: number; completed: boolean }> = ({ emoji, name, streak, completed }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
    background: completed ? C.successLight : C.paper,
    border: `1px solid ${completed ? C.success : C.lightCream}`,
    borderRadius: '8px', cursor: 'default', marginBottom: '8px',
  }}>
    <span style={{ fontSize: '20px' }}>{emoji}</span>
    <span style={{ flex: 1, fontSize: '14px', color: C.brown }}>{name}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: C.warning }}>
      <Flame size={14} fill={C.warning} /><span>{streak}</span>
    </div>
    {completed
      ? <span style={{ fontSize: '11px', fontWeight: '700', color: C.success, backgroundColor: C.successLight, padding: '2px 8px', borderRadius: '10px' }}>Hecho</span>
      : <span style={{ fontSize: '11px', color: C.warm, backgroundColor: C.lightCream, padding: '2px 8px', borderRadius: '10px' }}>Pendiente</span>
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
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: C.dark, color: C.paper, padding: '12px 24px', borderRadius: '8px',
          fontSize: '14px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
      <div style={{
        background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px',
        padding: '20px', marginBottom: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: C.brown, marginBottom: '4px' }}>
            🤖 Analizar con IA
          </div>
          <div style={{ fontSize: '13px', color: C.warm }}>
            Copia un resumen completo de tus últimos 30 días para analizarlo con Claude o ChatGPT
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: copied ? C.success : loading ? C.lightTan : C.accent,
            color: C.paper, border: 'none', borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '700', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'background 0.3s', flexShrink: 0,
          }}
        >
          {loading ? (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : copied ? (
            <Check size={16} />
          ) : (
            <Clipboard size={16} />
          )}
          {loading ? 'Generando…' : copied ? '¡Copiado!' : 'Copiar Resumen'}
        </button>
      </div>
    </>
  );
}

export default function HomeDashboard() {
  const habits = useHabitStore((s) => s.habits.filter(h => h.isActive !== false));
  const logs = useHabitStore((s) => s.logs);
  const { user } = useUserStore();
  const displayName = user?.name ?? 'Usuario';

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
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

  // ─── Real computed metrics ───────────────────────────────────────────────────
  const completedTodayIds = useMemo(
    () => new Set(logs.filter(l => l.date === todayStr && l.completed).map(l => l.habitId)),
    [logs, todayStr]
  );

  // All active habits for today's view (show everything, like Productividad)
  const todayHabits = useMemo(() => habits, [habits]);

  // Group by time of day
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

  // Streak total (sum of all streakCurrent)
  const streakTotal = useMemo(() => habits.reduce((s, h) => s + (h.streakCurrent || 0), 0), [habits]);

  // Best streak across all habits
  const bestStreak = useMemo(() => Math.max(0, ...habits.map(h => h.streakCurrent || 0)), [habits]);

  // Average strength (% of last-30-day completion per habit)
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

  // Top streaks (sorted by streakCurrent desc)
  const topStreaks = useMemo(() =>
    [...habits].sort((a, b) => (b.streakCurrent || 0) - (a.streakCurrent || 0)).slice(0, 5),
    [habits]
  );

  // Habit strength data for bar chart
  const habitStrengthData = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return habits.map(h => {
      const habitLogs = logs.filter(l => l.habitId === h.id && l.date >= cutoffStr);
      const done = habitLogs.filter(l => l.completed).length;
      return { name: h.name, icon: h.icon, strength: Math.round((done / 30) * 100) };
    }).sort((a, b) => b.strength - a.strength);
  }, [habits, logs]);

  const getStrengthLabel = (s: number) => s >= 90 ? 'Arraigado' : s >= 70 ? 'Formándose' : s >= 40 ? 'En progreso' : 'Nuevo';
  const getStrengthColor = (s: number) => s >= 90 ? C.success : s >= 70 ? C.accent : s >= 40 ? C.warning : C.danger;

  // Last 12 weeks completion rate
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

  // 90-day heatmap from real logs
  const heatmapData = useMemo(() => {
    return Array.from({ length: 90 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (89 - i));
      const ds = d.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.date === ds && l.completed);
      return { day: i + 1, dateStr: ds, count: dayLogs.length };
    });
  }, [logs]);

  const maxCount = useMemo(() => Math.max(1, ...heatmapData.map(d => d.count)), [heatmapData]);

  // Compound effect: based on real completion rate
  const completionRate = avgStrength / 100;
  const compoundData = useMemo(() => Array.from({ length: 52 }, (_, i) => ({
    week: i + 1,
    projected: +(100 * Math.pow(1.005, (i + 1) * 7)).toFixed(1),
    real: +(100 * Math.pow(1 + completionRate * 0.005, (i + 1) * 7)).toFixed(1),
    decline: +(100 * Math.pow(0.98, (i + 1) * 7)).toFixed(1),
  })), [completionRate]);

  // Radar: category-based completion this week vs last week
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

  // vs last week comparison
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

  // Life score = overall completion rate
  const lifeScore = avgStrength;

  const medals = ['🥇', '🥈', '🥉', '🏆', '🏆'];

  return (
    <div style={{ background: C.paper }}>
      {/* Welcome Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.dark} 0%, ${C.brown} 100%)`,
        borderRadius: '16px', padding: '32px', color: C.paper,
        marginBottom: '32px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: C.lightTan, marginBottom: '8px' }}>{dateFormatted}</div>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 16px 0', color: C.accentGlow }}>
              {greeting}, {displayName}
            </h1>
            <p style={{ fontSize: '14px', color: C.lightCream, margin: 0, fontStyle: 'italic', maxWidth: '400px' }}>
              "{quote}"
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CircularGauge value={lifeScore} maxValue={100} />
            <div style={{ fontSize: '12px', color: C.lightTan, textAlign: 'center' }}>Puntuación de Vida</div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: C.warm, marginBottom: '8px' }}>vs. Semana Pasada</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: vsLastWeek >= 0 ? C.success : C.danger }}>
              {vsLastWeek >= 0 ? '+' : ''}{vsLastWeek}%
            </span>
            <TrendingUp size={20} color={vsLastWeek >= 0 ? C.success : C.danger} />
          </div>
          <div style={{ fontSize: '12px', color: C.tan }}>
            {habits.length === 0 ? 'Agrega hábitos para comparar' : vsLastWeek >= 0 ? 'Mejora consistente' : 'Sigue adelante'}
          </div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: C.warm, marginBottom: '8px' }}>Mejor Racha Activa</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: C.warning }}>{bestStreak}</span>
            <Flame size={20} fill={C.warning} color={C.warning} />
          </div>
          <div style={{ fontSize: '12px', color: C.tan }}>Días consecutivos</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: C.warm, marginBottom: '8px' }}>Tasa de Completación</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: C.info }}>{avgStrength}%</span>
            <Award size={20} color={C.info} />
          </div>
          <div style={{ width: '100%', height: '4px', background: C.cream, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${avgStrength}%`, height: '100%', background: C.info, borderRadius: '2px' }} />
          </div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: C.warm, marginBottom: '8px' }}>Progreso de Hoy</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: C.accent }}>
              {completedTodayIds.size}/{todayHabits.length}
            </span>
            <Target size={20} color={C.accent} />
          </div>
          <div style={{ width: '100%', height: '4px', background: C.cream, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${todayHabits.length > 0 ? (completedTodayIds.size / todayHabits.length) * 100 : 0}%`,
              height: '100%', background: C.accent, borderRadius: '2px',
            }} />
          </div>
        </div>
      </div>

      {/* Today's Habits + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 16px 0' }}>Hábitos de Hoy</h2>
          {todayHabits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: C.tan, fontSize: '14px' }}>
              No hay hábitos programados para hoy. Agrégalos en Productividad → Hábitos.
            </div>
          )}
          {habitsByTime.morning.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', color: C.brown, fontWeight: 'bold' }}>
                <Sun size={16} color={C.warning} /> Mañana
              </div>
              {habitsByTime.morning.map(h => (
                <HabitCard key={h.id} emoji={h.icon || '⭐'} name={h.name} streak={h.streakCurrent || 0} completed={completedTodayIds.has(h.id)} />
              ))}
            </div>
          )}
          {habitsByTime.afternoon.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', color: C.brown, fontWeight: 'bold' }}>
                <Sunset size={16} color={C.warning} /> Tarde
              </div>
              {habitsByTime.afternoon.map(h => (
                <HabitCard key={h.id} emoji={h.icon || '⭐'} name={h.name} streak={h.streakCurrent || 0} completed={completedTodayIds.has(h.id)} />
              ))}
            </div>
          )}
          {habitsByTime.allDay.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', color: C.brown, fontWeight: 'bold' }}>
                <CloudSun size={16} color={C.info} /> Todo el Día
              </div>
              {habitsByTime.allDay.map(h => (
                <HabitCard key={h.id} emoji={h.icon || '⭐'} name={h.name} streak={h.streakCurrent || 0} completed={completedTodayIds.has(h.id)} />
              ))}
            </div>
          )}
          {habitsByTime.night.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', color: C.brown, fontWeight: 'bold' }}>
                <Moon size={16} color={C.dark} /> Noche
              </div>
              {habitsByTime.night.map(h => (
                <HabitCard key={h.id} emoji={h.icon || '⭐'} name={h.name} streak={h.streakCurrent || 0} completed={completedTodayIds.has(h.id)} />
              ))}
            </div>
          )}
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 4px 0' }}>Tu Vida en Balance</h2>
          <p style={{ fontSize: '12px', color: C.tan, margin: '0 0 12px 0' }}>Basado en completación por categoría esta semana</p>
          {habits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: C.tan, fontSize: '14px' }}>
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
      <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 4px 0' }}>Evolución de 12 Semanas</h2>
        <p style={{ fontSize: '12px', color: C.tan, margin: '0 0 16px 0' }}>% de hábitos completados por semana</p>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: C.tan }}>Completa hábitos para ver tu evolución</div>
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
      <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 4px 0' }}>Mapa de Consistencia (90 días)</h2>
        <p style={{ fontSize: '12px', color: C.tan, margin: '0 0 16px 0' }}>Cada cuadro = 1 día. Oscuro = más hábitos completados.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: '3px', marginBottom: '12px', maxWidth: '320px' }}>
          {heatmapData.map((d, i) => {
            const intensity = maxCount > 0 ? d.count / maxCount : 0;
            const bg = intensity === 0 ? C.cream
              : intensity < 0.33 ? C.accentLight
              : intensity < 0.66 ? C.accent
              : C.brown;
            return (
              <div key={i} title={`${d.dateStr}: ${d.count} completado(s)`} style={{
                width: '14px', height: '14px', background: bg, borderRadius: '3px', cursor: 'pointer', transition: 'transform 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.tan }}>
          <span>Ninguno</span>
          {[C.cream, C.accentLight, C.accent, C.brown].map((bg, i) => (
            <div key={i} style={{ width: '12px', height: '12px', background: bg, borderRadius: '2px' }} />
          ))}
          <span>Máximo</span>
        </div>
      </div>

      {/* Top Streaks + Habit Strength */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 16px 0' }}>Top Streaks</h2>
          {topStreaks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: C.tan, fontSize: '14px' }}>Aún no hay rachas. ¡Completa tu primer hábito!</div>
          ) : topStreaks.map((h, i) => (
            <div key={h.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px', background: C.lightCream, borderRadius: '8px', marginBottom: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>{medals[i]}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: C.brown }}>{h.name}</div>
                  <div style={{ fontSize: '12px', color: C.tan }}>{h.icon}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 'bold', color: C.accent }}>
                <Flame size={16} fill={C.accent} />{h.streakCurrent || 0}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 4px 0' }}>Fortaleza de Hábitos</h2>
          <p style={{ fontSize: '12px', color: C.tan, margin: '0 0 16px 0' }}>% completado en los últimos 30 días</p>
          {habitStrengthData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: C.tan, fontSize: '14px' }}>Agrega hábitos para ver su fortaleza</div>
          ) : habitStrengthData.map((h, i) => {
            const label = getStrengthLabel(h.strength);
            const color = getStrengthColor(h.strength);
            return (
              <div key={i} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: C.brown }}>{h.icon} {h.name}</div>
                  <div style={{ fontSize: '11px', color, fontWeight: 'bold' }}>{label}</div>
                </div>
                <div style={{ width: '100%', height: '6px', background: C.cream, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${h.strength}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compound Effect */}
      <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 4px 0' }}>Efecto Compuesto</h2>
        <p style={{ fontSize: '12px', color: C.tan, margin: '0 0 16px 0' }}>
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
      <div style={{
        background: `linear-gradient(135deg, ${C.dark} 0%, ${C.brown} 100%)`,
        borderRadius: '16px', padding: '24px', color: C.paper, textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <Trophy size={32} color={C.accentGlow} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: C.accentGlow }}>
          {streakTotal} días de fuego en total — ¡sigue así!
        </h3>
        <p style={{ fontSize: '13px', color: C.lightCream, margin: 0 }}>
          Tasa de completación: {avgStrength}% · {habits.length} hábito{habits.length !== 1 ? 's' : ''} activo{habits.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
