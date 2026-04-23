"use client";

import React from "react";
import { cn } from "@/components/ui";
import { X, TrendingUp, CheckCircle, Flame, Target, Zap } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const C = {
  dark: "#3D2B1F",
  brown: "#6B4226",
  medium: "#8B6542",
  warm: "#A0845C",
  tan: "#C4A882",
  lightTan: "#D4BEA0",
  cream: "#EDE0D4",
  lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3",
  paper: "#FFFDF9",
  accent: "#B8860B",
  accentLight: "#D4A843",
  accentGlow: "#F0D78C",
  success: "#7A9E3E",
  successLight: "#D4E6B5",
  warning: "#D4943A",
  warningLight: "#F5E0C0",
  danger: "#C0544F",
  dangerLight: "#F5D0CE",
  info: "#5A8FA8",
  infoLight: "#C8E0EC",
};

interface Props {
  onClose: () => void;
}

export default function WeeklySummaryModal({ onClose }: Props) {
  // Sample weekly data
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const dailyCompletion = [
    { day: "Lun", completed: 8, total: 10, pct: 80 },
    { day: "Mar", completed: 9, total: 10, pct: 90 },
    { day: "Mié", completed: 7, total: 10, pct: 70 },
    { day: "Jue", completed: 10, total: 10, pct: 100 },
    { day: "Vie", completed: 6, total: 10, pct: 60 },
    { day: "Sáb", completed: 8, total: 10, pct: 80 },
    { day: "Dom", completed: 9, total: 10, pct: 90 },
  ];

  const areaScores = [
    { area: "Visión", score: 85 },
    { area: "Plan", score: 90 },
    { area: "Productividad", score: 78 },
    { area: "Organización", score: 72 },
    { area: "Finanzas", score: 88 },
    { area: "Fitness", score: 92 },
    { area: "Nutrición", score: 70 },
    { area: "Bienestar", score: 82 },
  ];

  const weeklyStats = {
    totalHabitsCompleted: 57,
    totalHabits: 70,
    bestDay: "Jueves",
    currentStreak: 12,
    xpEarned: 340,
    avgMood: 7.8,
    workoutsCompleted: 5,
    caloriesTracked: 6,
  };

  const topHabits = [
    { name: "Meditar 10 min", completions: 7, streak: 14, icon: "🧘" },
    { name: "Leer 30 min", completions: 6, streak: 12, icon: "📚" },
    { name: "Ejercicio", completions: 5, streak: 8, icon: "💪" },
    { name: "Agua 2L", completions: 7, streak: 21, icon: "💧" },
    { name: "Escribir diario", completions: 4, streak: 4, icon: "✍️" },
  ];

  const overallPct = Math.round(
    (weeklyStats.totalHabitsCompleted / weeklyStats.totalHabits) * 100
  );
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (overallPct / 100) * circumference;

  const getBarColor = (pct: number) => {
    if (pct >= 90) return C.success;
    if (pct >= 70) return C.accent;
    if (pct >= 50) return C.warning;
    return C.danger;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-5"
      onClick={onClose}
    >
      <div
        className="bg-brand-warm-white rounded-2xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="bg-gradient-hero-accent px-[30px] py-6 rounded-t-2xl flex justify-between items-center"
        >
          <div>
            <h2 className="m-0 text-brand-paper font-serif text-[1.6rem]">
              Resumen Semanal
            </h2>
            <p className="mt-1 mb-0 text-[#F0D78C] text-[0.9rem]">
              30 Mar — 5 Abr, 2026
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 border-none rounded-lg p-2 cursor-pointer flex items-center"
          >
            <X size={20} color={C.paper} />
          </button>
        </div>

        {/* Content */}
        <div className="px-[30px] py-6 flex flex-col gap-5">
          {/* Top Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                icon: <CheckCircle size={22} color={C.success} />,
                value: `${weeklyStats.totalHabitsCompleted}/${weeklyStats.totalHabits}`,
                label: "Hábitos Completados",
                bgClass: "bg-success-light",
              },
              {
                icon: <Flame size={22} color={C.danger} />,
                value: `${weeklyStats.currentStreak} días`,
                label: "Racha Actual",
                bgClass: "bg-danger-light",
              },
              {
                icon: <Zap size={22} color={C.accent} />,
                value: `+${weeklyStats.xpEarned} XP`,
                label: "XP Ganados",
                bgClass: "bg-accent-glow",
              },
              {
                icon: <Target size={22} color={C.info} />,
                value: weeklyStats.bestDay,
                label: "Mejor Día",
                bgClass: "bg-info-light",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-brand-paper rounded-xl border border-brand-tan shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col items-center text-center gap-2 p-4"
              >
                <div
                  className={cn("w-11 h-11 rounded-full flex items-center justify-center", stat.bgClass)}
                >
                  {stat.icon}
                </div>
                <div className="text-[1.3rem] font-bold text-brand-dark">
                  {stat.value}
                </div>
                <div className="text-[0.75rem] text-brand-warm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-5">
            {/* Daily Completion Bar Chart */}
            <div className="bg-brand-paper rounded-xl border border-brand-tan shadow-[0_2px_4px_rgba(0,0,0,0.05)] p-5">
              <h3 className="mt-0 mb-4 font-serif text-brand-dark text-base">
                📊 Completado por Día
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyCompletion}>
                  <XAxis dataKey="day" tick={{ fill: C.warm, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: C.warm, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Completado"]}
                    contentStyle={{
                      backgroundColor: C.paper,
                      border: `1px solid ${C.tan}`,
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                    {dailyCompletion.map((entry, i) => (
                      <Cell key={i} fill={getBarColor(entry.pct)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart - Area Scores */}
            <div className="bg-brand-paper rounded-xl border border-brand-tan shadow-[0_2px_4px_rgba(0,0,0,0.05)] p-5">
              <h3 className="mt-0 mb-4 font-serif text-brand-dark text-base">
                🎯 Puntuación por Área
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={areaScores}>
                  <PolarGrid stroke={C.tan} />
                  <PolarAngleAxis dataKey="area" tick={{ fill: C.warm, fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    dataKey="score"
                    stroke={C.accent}
                    fill={C.accent}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Middle Row: Progress Ring + Top Habits */}
          <div className="grid gap-5 [grid-template-columns:1fr_2fr]">
            {/* Overall Progress Ring */}
            <div className="bg-brand-paper rounded-xl border border-brand-tan shadow-[0_2px_4px_rgba(0,0,0,0.05)] p-5 flex flex-col items-center justify-center">
              <svg width="150" height="150" className="-rotate-90">
                <circle cx="75" cy="75" r="60" fill="none" stroke={C.lightCream} strokeWidth="10" />
                <circle
                  cx="75"
                  cy="75"
                  r="60"
                  fill="none"
                  stroke={C.accent}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="[transition:stroke-dashoffset_0.5s_ease]"
                />
              </svg>
              <div className="text-center mt-3">
                <div className="text-[2rem] font-bold text-accent">
                  {overallPct}%
                </div>
                <div className="text-[0.85rem] text-brand-warm">Cumplimiento Semanal</div>
              </div>
            </div>

            {/* Top Habits */}
            <div className="bg-brand-paper rounded-xl border border-brand-tan shadow-[0_2px_4px_rgba(0,0,0,0.05)] p-5">
              <h3 className="mt-0 mb-4 font-serif text-brand-dark text-base">
                🏆 Top Hábitos de la Semana
              </h3>
              <div className="flex flex-col gap-[10px]">
                {topHabits.map((h, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 px-[14px] py-[10px] rounded-lg border",
                      i === 0 ? "bg-accent-glow border-accent" : "bg-brand-light-cream border-transparent"
                    )}
                  >
                    <span className="text-[1.3rem]">{h.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-brand-dark text-[0.9rem]">
                        {h.name}
                      </div>
                      <div className="text-[0.75rem] text-brand-warm">
                        Racha: {h.streak} días
                      </div>
                    </div>
                    <div className="flex gap-[3px]">
                      {weekDays.map((_, di) => (
                        <div
                          key={di}
                          className={cn("w-4 h-4 rounded-[4px]", di < h.completions ? "bg-success" : "bg-brand-light-tan")}
                        />
                      ))}
                    </div>
                    <div className="text-[0.85rem] font-bold text-accent min-w-[30px] text-right">
                      {h.completions}/7
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Insights */}
          <div className="bg-brand-paper rounded-xl border border-brand-tan shadow-[0_2px_4px_rgba(0,0,0,0.05)] p-5">
            <h3 className="mt-0 mb-4 font-serif text-brand-dark text-base">
              💡 Descubrimientos de la Semana
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  emoji: "😊",
                  title: "Estado de Ánimo",
                  value: `${weeklyStats.avgMood}/10`,
                  detail: "Promedio semanal",
                  colorClass: "text-success",
                },
                {
                  emoji: "🏋️",
                  title: "Entrenamientos",
                  value: `${weeklyStats.workoutsCompleted}/5`,
                  detail: "Meta semanal alcanzada",
                  colorClass: "text-info",
                },
                {
                  emoji: "🍽️",
                  title: "Nutrición",
                  value: `${weeklyStats.caloriesTracked}/7`,
                  detail: "Días registrados",
                  colorClass: "text-warning",
                },
              ].map((insight, i) => (
                <div
                  key={i}
                  className="p-4 bg-brand-light-cream rounded-[10px] text-center"
                >
                  <span className="text-[1.5rem]">{insight.emoji}</span>
                  <div className="text-[0.8rem] text-brand-warm mt-1.5 mb-1 font-semibold">
                    {insight.title}
                  </div>
                  <div className={cn("text-[1.4rem] font-bold", insight.colorClass)}>
                    {insight.value}
                  </div>
                  <div className="text-[0.7rem] text-brand-medium mt-1">
                    {insight.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Footer */}
          <div className="bg-gradient-to-br from-[#F0D78C] to-brand-cream rounded-xl p-5 text-center">
            <p className="text-[1.1rem] font-serif text-brand-dark italic mb-2 mt-0">
              &ldquo;La consistencia es más importante que la perfección.&rdquo;
            </p>
            <p className="text-[0.85rem] text-brand-warm m-0">
              Completaste el {overallPct}% de tus hábitos esta semana. ¡Sigue así!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
