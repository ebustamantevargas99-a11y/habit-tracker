"use client";

import React from "react";
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
    { name: "Journaling", completions: 4, streak: 4, icon: "✍️" },
  ];

  const overallPct = Math.round(
    (weeklyStats.totalHabitsCompleted / weeklyStats.totalHabits) * 100
  );
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (overallPct / 100) * circumference;

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.paper,
    borderRadius: "12px",
    padding: "20px",
    border: `1px solid ${C.tan}`,
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  };

  const getBarColor = (pct: number) => {
    if (pct >= 90) return C.success;
    if (pct >= 70) return C.accent;
    if (pct >= 50) return C.warning;
    return C.danger;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.warmWhite,
          borderRadius: "16px",
          width: "100%",
          maxWidth: "900px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${C.brown}, ${C.accent})`,
            padding: "24px 30px",
            borderRadius: "16px 16px 0 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: C.paper,
                fontFamily: "Georgia, serif",
                fontSize: "1.6rem",
              }}
            >
              Resumen Semanal
            </h2>
            <p style={{ margin: "4px 0 0 0", color: C.accentGlow, fontSize: "0.9rem" }}>
              30 Mar — 5 Abr, 2026
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={20} color={C.paper} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 30px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
            {[
              {
                icon: <CheckCircle size={22} color={C.success} />,
                value: `${weeklyStats.totalHabitsCompleted}/${weeklyStats.totalHabits}`,
                label: "Hábitos Completados",
                bg: C.successLight,
              },
              {
                icon: <Flame size={22} color={C.danger} />,
                value: `${weeklyStats.currentStreak} días`,
                label: "Racha Actual",
                bg: C.dangerLight,
              },
              {
                icon: <Zap size={22} color={C.accent} />,
                value: `+${weeklyStats.xpEarned} XP`,
                label: "XP Ganados",
                bg: C.accentGlow,
              },
              {
                icon: <Target size={22} color={C.info} />,
                value: weeklyStats.bestDay,
                label: "Mejor Día",
                bg: C.infoLight,
              },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  ...cardStyle,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "8px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: stat.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {stat.icon}
                </div>
                <div style={{ fontSize: "1.3rem", fontWeight: "700", color: C.dark }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.75rem", color: C.warm }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Daily Completion Bar Chart */}
            <div style={cardStyle}>
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontFamily: "Georgia, serif",
                  color: C.dark,
                  fontSize: "1rem",
                }}
              >
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
            <div style={cardStyle}>
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontFamily: "Georgia, serif",
                  color: C.dark,
                  fontSize: "1rem",
                }}
              >
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
            {/* Overall Progress Ring */}
            <div style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <svg width="150" height="150" style={{ transform: "rotate(-90deg)" }}>
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
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: C.accent }}>
                  {overallPct}%
                </div>
                <div style={{ fontSize: "0.85rem", color: C.warm }}>Cumplimiento Semanal</div>
              </div>
            </div>

            {/* Top Habits */}
            <div style={cardStyle}>
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontFamily: "Georgia, serif",
                  color: C.dark,
                  fontSize: "1rem",
                }}
              >
                🏆 Top Hábitos de la Semana
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {topHabits.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      backgroundColor: i === 0 ? C.accentGlow : C.lightCream,
                      borderRadius: "8px",
                      border: i === 0 ? `1px solid ${C.accent}` : `1px solid transparent`,
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>{h.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", color: C.dark, fontSize: "0.9rem" }}>
                        {h.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: C.warm }}>
                        Racha: {h.streak} días
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "3px" }}>
                      {weekDays.map((_, di) => (
                        <div
                          key={di}
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "4px",
                            backgroundColor: di < h.completions ? C.success : C.lightTan,
                          }}
                        />
                      ))}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        color: C.accent,
                        minWidth: "30px",
                        textAlign: "right",
                      }}
                    >
                      {h.completions}/7
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Insights */}
          <div style={cardStyle}>
            <h3
              style={{
                margin: "0 0 16px 0",
                fontFamily: "Georgia, serif",
                color: C.dark,
                fontSize: "1rem",
              }}
            >
              💡 Insights de la Semana
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              {[
                {
                  emoji: "😊",
                  title: "Estado de Ánimo",
                  value: `${weeklyStats.avgMood}/10`,
                  detail: "Promedio semanal",
                  color: C.success,
                },
                {
                  emoji: "🏋️",
                  title: "Entrenamientos",
                  value: `${weeklyStats.workoutsCompleted}/5`,
                  detail: "Meta semanal alcanzada",
                  color: C.info,
                },
                {
                  emoji: "🍽️",
                  title: "Nutrición",
                  value: `${weeklyStats.caloriesTracked}/7`,
                  detail: "Días registrados",
                  color: C.warning,
                },
              ].map((insight, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px",
                    backgroundColor: C.lightCream,
                    borderRadius: "10px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{insight.emoji}</span>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: C.warm,
                      margin: "6px 0 4px 0",
                      fontWeight: "600",
                    }}
                  >
                    {insight.title}
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "700", color: insight.color }}>
                    {insight.value}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: C.medium, marginTop: "4px" }}>
                    {insight.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Footer */}
          <div
            style={{
              background: `linear-gradient(135deg, ${C.accentGlow}, ${C.cream})`,
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "1.1rem",
                fontFamily: "Georgia, serif",
                color: C.dark,
                fontStyle: "italic",
                margin: "0 0 8px 0",
              }}
            >
              &ldquo;La consistencia es más importante que la perfección.&rdquo;
            </p>
            <p style={{ fontSize: "0.85rem", color: C.warm, margin: 0 }}>
              Completaste el {overallPct}% de tus hábitos esta semana. ¡Sigue así!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
