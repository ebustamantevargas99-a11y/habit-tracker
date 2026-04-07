'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Flame, Award, Target, Sun, CloudSun, Moon,
  Check, Zap, Trophy, Activity, DollarSign, Leaf, Heart, Brain
} from 'lucide-react';
import { useHabitStore } from '@/stores/habit-store';

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

// Circular Gauge Component
const CircularGauge: React.FC<{ value: number; maxValue: number }> = ({ value, maxValue }) => {
  const percentage = (value / maxValue) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx="60"
        cy="60"
        r="45"
        fill="none"
        stroke={C.lightCream}
        strokeWidth="3"
      />
      <circle
        cx="60"
        cy="60"
        r="45"
        fill="none"
        stroke={C.accentGlow}
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dy="0.3em"
        fontSize="28"
        fontWeight="bold"
        fill={C.accent}
        style={{ transform: 'rotate(90deg)', transformOrigin: '60px 60px' }}
      >
        {percentage.toFixed(0)}%
      </text>
    </svg>
  );
};

// Area Score Card Component
const AreaScoreCard: React.FC<{
  icon: React.ReactNode;
  score: number;
  areaName: string;
  change: number;
}> = ({ icon, score, areaName, change }) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? C.success : C.danger;

  return (
    <div
      style={{
        background: C.paper,
        border: `1px solid ${C.lightCream}`,
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px rgba(0,0,0,0.1)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: C.brown, marginBottom: '4px' }}>
        {score}%
      </div>
      <div style={{ fontSize: '12px', color: C.warm, marginBottom: '8px' }}>{areaName}</div>
      <div style={{ fontSize: '11px', color: changeColor, fontWeight: 'bold' }}>
        {isPositive ? '+' : ''}{change}%
      </div>
      <div
        style={{
          width: '100%',
          height: '4px',
          background: C.cream,
          borderRadius: '2px',
          marginTop: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: isPositive ? C.success : C.danger,
            borderRadius: '2px',
          }}
        />
      </div>
    </div>
  );
};

// Habit Card Component
const HabitCard: React.FC<{
  id: string;
  emoji: string;
  name: string;
  streak: number;
  completed: boolean;
  onToggle?: () => void;
}> = ({ id, emoji, name, streak, completed }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: completed ? C.successLight : C.paper,
        border: `1px solid ${completed ? C.success : C.lightCream}`,
        borderRadius: '8px',
        cursor: 'default',
        marginBottom: '8px',
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
        backgroundColor: completed ? C.success : 'transparent',
        border: `2px solid ${completed ? C.success : C.lightTan}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {completed && <span style={{ color: C.paper, fontSize: '10px', fontWeight: '700' }}>✓</span>}
      </div>
      <span style={{ fontSize: '20px' }}>{emoji}</span>
      <span
        style={{
          flex: 1,
          fontSize: '14px',
          color: completed ? C.dark : C.brown,
          textDecoration: completed ? 'line-through' : 'none',
        }}
      >
        {name}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: C.warning }}>
        <Flame size={14} fill={C.warning} />
        <span>{streak}</span>
      </div>
      {completed && <Check size={16} color={C.success} />}
    </div>
  );
};

// Main Component
export default function HomeDashboard() {
  const habits = useHabitStore((state) => state.habits.filter(h => h.isActive));
  const logs = useHabitStore((state) => state.logs);

  const todayStr = new Date().toISOString().split('T')[0];
  const completedTodayIds = useMemo(
    () => new Set(logs.filter(l => l.date === todayStr && l.completed).map(l => l.habitId)),
    [logs, todayStr]
  );

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }, [currentTime]);

  const dateFormatted = useMemo(() => {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const d = currentTime.getDate();
    const day = days[currentTime.getDay()];
    const month = months[currentTime.getMonth()];
    return `${day}, ${d} de ${month} de ${currentTime.getFullYear()}`;
  }, [currentTime]);

  const quote = useMemo(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)], []);

  // Sample data - Life Areas
  const lifeAreas = [
    { icon: <Brain size={24} />, name: 'Visión', score: 82, change: 5 },
    { icon: <Activity size={24} />, name: 'Plan', score: 75, change: 3 },
    { icon: <Zap size={24} />, name: 'Productividad', score: 88, change: 8 },
    { icon: <Target size={24} />, name: 'Organización', score: 70, change: -2 },
    { icon: <DollarSign size={24} />, name: 'Finanzas', score: 65, change: 4 },
    { icon: <Activity size={24} />, name: 'Fitness', score: 92, change: 10 },
    { icon: <Leaf size={24} />, name: 'Nutrición', score: 78, change: 2 },
    { icon: <Heart size={24} />, name: 'Bienestar', score: 85, change: 6 },
  ];

  // Sample weekly data (12 weeks)
  const weeklyData = Array.from({ length: 12 }, (_, i) => ({
    week: `S${i + 1}`,
    weekNum: i + 1,
    score: Math.min(100, 50 + Math.random() * 50 + i * 2),
  }));

  // Sample compound effect data
  const compoundData = Array.from({ length: 52 }, (_, i) => {
    const week = i + 1;
    return {
      week,
      projected: 100 * Math.pow(1.005, week * 7),
      actual: 100 + Math.sin(week / 5) * 30 + week * 0.8,
      decline: 100 * Math.pow(0.98, week * 7),
    };
  });

  // Sample heatmap data (90 days)
  const heatmapData = Array.from({ length: 90 }, (_, i) => ({
    day: i + 1,
    value: Math.floor(Math.random() * 5),
  }));

  // Sample streaks (top 5)
  const topStreaks = [
    { name: 'Meditación', streak: 127, emoji: '🧘' },
    { name: 'Ejercicio', streak: 94, emoji: '💪' },
    { name: 'Lectura', streak: 82, emoji: '📚' },
    { name: 'Escritura', streak: 56, emoji: '✍️' },
    { name: 'Contabilidad', streak: 43, emoji: '💰' },
  ];

  // Habit strength labels
  const getStrengthLabel = (strength: number) => {
    if (strength >= 90) return 'Arraigado';
    if (strength >= 70) return 'Formándose';
    if (strength >= 40) return 'En progreso';
    return 'Nuevo';
  };

  // Sample habit strength data
  const habitStrengthData = [
    { name: 'Meditación', strength: 95 },
    { name: 'Ejercicio', strength: 88 },
    { name: 'Lectura', strength: 82 },
    { name: 'Nutrición', strength: 75 },
    { name: 'Sueño', strength: 72 },
    { name: 'Productividad', strength: 65 },
  ];

  // Group habits by time of day
  const habitsByTime = useMemo(() => {
    const morning: typeof habits = [];
    const allDay: typeof habits = [];
    const night: typeof habits = [];

    habits.forEach((habit) => {
      if (habit.timeOfDay === 'morning') morning.push(habit);
      else if (habit.timeOfDay === 'evening') night.push(habit);
      else allDay.push(habit);
    });

    return { morning, allDay, night };
  }, [habits]);

  const totalHabits = habits.length;
  const weekComparisonData = Array.from({ length: 12 }, (_, i) => ({
    week: `S${i + 1}`,
    completion: Math.floor(40 + Math.random() * 60),
  }));

  const projectedImprovement = 35;

  return (
    <div style={{ background: C.paper, minHeight: '100vh', padding: '24px' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.dark} 0%, ${C.brown} 100%)`,
          borderRadius: '16px',
          padding: '32px',
          color: C.paper,
          marginBottom: '32px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: C.lightTan, marginBottom: '8px' }}>{dateFormatted}</div>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 16px 0', color: C.accentGlow }}>
              {greeting}, Eduardo
            </h1>
            <p style={{ fontSize: '14px', color: C.lightCream, margin: 0, fontStyle: 'italic', maxWidth: '400px' }}>
              "{quote}"
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CircularGauge value={72} maxValue={100} />
            <div style={{ fontSize: '12px', color: C.lightTan, textAlign: 'center' }}>Puntuación de Vida</div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {/* vs. Semana Pasada */}
        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: C.warm, marginBottom: '8px' }}>vs. Semana Pasada</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: C.success }}>+{projectedImprovement}.5%</span>
            <TrendingUp size={20} color={C.success} />
          </div>
          <div style={{ fontSize: '12px', color: C.tan }}>Mejora consistente</div>
        </div>

        {/* Streak Total */}
        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: C.warm, marginBottom: '8px' }}>Streak Total</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: C.warning }}>504</span>
            <Flame size={20} fill={C.warning} color={C.warning} />
          </div>
          <div style={{ fontSize: '12px', color: C.tan }}>Días de fuego</div>
        </div>

        {/* Fuerza Promedio */}
        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: C.warm, marginBottom: '8px' }}>Fuerza Promedio</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: C.info }}>81%</span>
            <Award size={20} color={C.info} />
          </div>
          <div style={{ width: '100%', height: '4px', background: C.cream, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '81%', height: '100%', background: C.info, borderRadius: '2px' }} />
          </div>
        </div>

        {/* Progreso de Hoy */}
        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: C.warm, marginBottom: '8px' }}>Progreso de Hoy</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: C.accent }}>
              {completedTodayIds.size}/{totalHabits}
            </span>
            <Target size={20} color={C.accent} />
          </div>
          <div style={{ width: '100%', height: '4px', background: C.cream, borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${totalHabits > 0 ? (completedTodayIds.size / totalHabits) * 100 : 0}%`,
                height: '100%',
                background: C.accent,
                borderRadius: '2px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Two Column Grid: Today's Habits + Radar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Today's Habits */}
        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 16px 0' }}>Hábitos de Hoy</h2>

          {/* Morning */}
          {habitsByTime.morning.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', color: C.brown, fontWeight: 'bold' }}>
                <Sun size={18} color={C.warning} />
                Mañana
              </div>
              {habitsByTime.morning.map((habit) => (
                <HabitCard
                  key={habit.id}
                  id={habit.id}
                  emoji={habit.icon || '✓'}
                  name={habit.name}
                  streak={habit.streakCurrent || 0}
                  completed={completedTodayIds.has(habit.id)}
                />
              ))}
            </div>
          )}

          {/* All Day */}
          {habitsByTime.allDay.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', color: C.brown, fontWeight: 'bold' }}>
                <CloudSun size={18} color={C.info} />
                Todo el Día
              </div>
              {habitsByTime.allDay.map((habit) => (
                <HabitCard
                  key={habit.id}
                  id={habit.id}
                  emoji={habit.icon || '✓'}
                  name={habit.name}
                  streak={habit.streakCurrent || 0}
                  completed={completedTodayIds.has(habit.id)}
                />
              ))}
            </div>
          )}

          {/* Night */}
          {habitsByTime.night.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', color: C.brown, fontWeight: 'bold' }}>
                <Moon size={18} color={C.dark} />
                Noche
              </div>
              {habitsByTime.night.map((habit) => (
                <HabitCard
                  key={habit.id}
                  id={habit.id}
                  emoji={habit.icon || '✓'}
                  name={habit.name}
                  streak={habit.streakCurrent || 0}
                  completed={completedTodayIds.has(habit.id)}
                />
              ))}
            </div>
          )}

          {habits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: C.tan, fontSize: '14px' }}>
              No hay hábitos añadidos. Comienza a crear tu primer hábito.
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 16px 0' }}>Tu Vida en Balance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={[
              { area: 'Visión', thisWeek: 82, lastWeek: 78 },
              { area: 'Plan', thisWeek: 75, lastWeek: 72 },
              { area: 'Productividad', thisWeek: 88, lastWeek: 80 },
              { area: 'Organización', thisWeek: 70, lastWeek: 72 },
              { area: 'Finanzas', thisWeek: 65, lastWeek: 61 },
              { area: 'Fitness', thisWeek: 92, lastWeek: 82 },
              { area: 'Nutrición', thisWeek: 78, lastWeek: 76 },
              { area: 'Bienestar', thisWeek: 85, lastWeek: 79 },
            ]}>
              <PolarGrid stroke={C.lightCream} />
              <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: C.brown }} />
              <PolarRadiusAxis tick={{ fontSize: 10, fill: C.tan }} />
              <Radar name="Esta Semana" dataKey="thisWeek" stroke={C.accent} fill={C.accent} fillOpacity={0.4} />
              <Radar name="Semana Pasada" dataKey="lastWeek" stroke={C.lightTan} fill={C.lightTan} fillOpacity={0.1} strokeDasharray="5 5" />
              <Legend wrapperStyle={{ paddingTop: '16px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area Score Cards Grid */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 16px 0' }}>Áreas de Vida</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {lifeAreas.map((area, i) => (
            <AreaScoreCard
              key={i}
              icon={area.icon}
              score={area.score}
              areaName={area.name}
              change={area.change}
            />
          ))}
        </div>
      </div>

      {/* Weekly Evolution Area Chart */}
      <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 16px 0' }}>Evolución de 12 Semanas</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.accent} stopOpacity={0.8} />
                <stop offset="95%" stopColor={C.accent} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.brown }} />
            <YAxis tick={{ fontSize: 11, fill: C.brown }} />
            <Tooltip
              contentStyle={{ background: C.warmWhite, border: `1px solid ${C.lightCream}`, borderRadius: '8px' }}
              labelStyle={{ color: C.brown }}
            />
            <Area type="monotone" dataKey="score" stroke={C.accent} fillOpacity={1} fill="url(#colorScore)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Compound Effect Chart */}
      <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 4px 0' }}>Efecto Compuesto</h2>
        <p style={{ fontSize: '12px', color: C.tan, margin: '0 0 16px 0' }}>+0.5% diario = +517% en un año</p>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={compoundData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.brown }} />
            <YAxis tick={{ fontSize: 11, fill: C.brown }} />
            <Tooltip
              contentStyle={{ background: C.warmWhite, border: `1px solid ${C.lightCream}`, borderRadius: '8px' }}
              labelStyle={{ color: C.brown }}
            />
            <Line type="monotone" dataKey="projected" stroke={C.success} name="Proyección" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="actual" stroke={C.accent} name="Progreso Real" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="decline" stroke={C.danger} name="Si Abandono" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 90-Day Heatmap */}
      <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 16px 0' }}>Mapa de Consistencia (90 días)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '3px', marginBottom: '16px', maxWidth: '400px' }}>
          {heatmapData.map((data, i) => {
            const intensity = [C.cream, C.accentLight, C.accent, C.brown, C.dark][data.value];
            return (
              <div
                key={i}
                title={`Día ${data.day}: ${data.value} hábitos completados`}
                style={{
                  width: '14px',
                  height: '14px',
                  background: intensity,
                  borderRadius: '3px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: C.tan }}>
          <span>Menos</span>
          <div style={{ width: '14px', height: '14px', background: C.cream, borderRadius: '2px' }} />
          <div style={{ width: '14px', height: '14px', background: C.accentLight, borderRadius: '2px' }} />
          <div style={{ width: '14px', height: '14px', background: C.accent, borderRadius: '2px' }} />
          <div style={{ width: '14px', height: '14px', background: C.brown, borderRadius: '2px' }} />
          <div style={{ width: '14px', height: '14px', background: C.dark, borderRadius: '2px' }} />
          <span>Más</span>
        </div>
      </div>

      {/* Two Column: Top Streaks + Habit Strength */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Top Streaks */}
        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 16px 0' }}>Top Streaks</h2>
          {topStreaks.map((streak, i) => {
            const medals = ['🥇', '🥈', '🥉'];
            const medal = i < 3 ? medals[i] : '🏆';
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: C.lightCream,
                  borderRadius: '8px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{medal}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: C.brown }}>{streak.name}</div>
                    <div style={{ fontSize: '12px', color: C.tan }}>{streak.emoji}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 'bold', color: C.accent }}>
                  <Flame size={16} fill={C.accent} />
                  {streak.streak}
                </div>
              </div>
            );
          })}
        </div>

        {/* Habit Strength */}
        <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 16px 0' }}>Fortaleza de Hábitos</h2>
          {habitStrengthData.map((habit, i) => {
            const label = getStrengthLabel(habit.strength);
            const labelColor = habit.strength >= 90 ? C.success : habit.strength >= 70 ? C.accent : habit.strength >= 40 ? C.warning : C.danger;
            return (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: C.brown }}>{habit.name}</div>
                  <div style={{ fontSize: '11px', color: labelColor, fontWeight: 'bold' }}>{label}</div>
                </div>
                <div style={{ width: '100%', height: '6px', background: C.cream, borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${habit.strength}%`,
                      height: '100%',
                      background: labelColor,
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Comparison Bar Chart */}
      <div style={{ background: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.brown, margin: '0 0 16px 0' }}>Comparación Semanal</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weekComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.brown }} />
            <YAxis tick={{ fontSize: 11, fill: C.brown }} />
            <Tooltip
              contentStyle={{ background: C.warmWhite, border: `1px solid ${C.lightCream}`, borderRadius: '8px' }}
              labelStyle={{ color: C.brown }}
            />
            <Bar
              dataKey="completion"
              fill={C.accent}
              shape={({ x, y, width, height, fill, ...props }: any) => {
                const isLast = props.index === weekComparisonData.length - 1;
                return (
                  <rect
                    {...props}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={isLast ? C.accent : C.accentLight}
                    rx={4}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Motivational Footer */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.dark} 0%, ${C.brown} 100%)`,
          borderRadius: '16px',
          padding: '24px',
          color: C.paper,
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <Trophy size={32} color={C.accentGlow} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: C.accentGlow }}>
          Eres un +{projectedImprovement}% mejor que la semana pasada
        </h3>
        <p style={{ fontSize: '13px', color: C.lightCream, margin: 0 }}>
          Proyección: +{(projectedImprovement * 26).toFixed(0)}% de mejora en 6 meses si mantienes la consistencia
        </p>
      </div>
    </div>
  );
}
