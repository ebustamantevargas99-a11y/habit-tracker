"use client";

import React, { useState } from "react";
import { X, Award } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
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

interface MonthlySummaryModalProps {
  onClose: () => void;
}

type TabType = "general" | "fitness" | "finanzas" | "nutricion" | "productividad" | "bienestar";

export default function MonthlySummaryModal({ onClose }: MonthlySummaryModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");

  const radarDataStart = [
    { subject: "Fitness", value: 65 },
    { subject: "Nutrición", value: 72 },
    { subject: "Productividad", value: 78 },
    { subject: "Finanzas", value: 68 },
    { subject: "Bienestar", value: 75 },
    { subject: "Relaciones", value: 70 },
  ];

  const radarDataEnd = [
    { subject: "Fitness", value: 82 },
    { subject: "Nutrición", value: 85 },
    { subject: "Productividad", value: 88 },
    { subject: "Finanzas", value: 76 },
    { subject: "Bienestar", value: 89 },
    { subject: "Relaciones", value: 78 },
  ];

  const achievements = [
    "🏆 Racha de 25 días en meditación",
    "💪 Press banca: +5kg",
    "📚 Completaste 4 libros",
    "💰 Ahorraste $450 este mes",
    "🎯 Productividad: 88% de hábitos",
  ];

  const fitnessData = {
    prs: [
      { exercise: "Press Banca", value: "+5kg", change: "↑ +5kg" },
      { exercise: "Curl Bíceps", value: "+2kg/brazo", change: "↑ +2kg" },
      { exercise: "Sentadilla", value: "+8kg", change: "↑ +8kg" },
    ],
    plateaus: [
      { exercise: "Deadlift", note: "Plateu detectado" },
      { exercise: "Jalón Lat", note: "Sin cambios" },
    ],
    volumeData: [
      { week: "S1", volume: 4200 },
      { week: "S2", volume: 4500 },
      { week: "S3", volume: 4300 },
      { week: "S4", volume: 4800 },
    ],
    trainingDays: 24,
    bodyChanges: {
      weight: { start: 78.5, end: 77.8, change: "-0.7kg" },
      bodyFat: { start: "16.2%", end: "15.5%", change: "-0.7%" },
    },
  };

  const financesData = {
    income: { total: 3500, change: "+5%" },
    expenses: [
      { category: "Vivienda", amount: 1200, change: "-3%" },
      { category: "Alimentación", amount: 320, change: "+8%" },
      { category: "Transporte", amount: 150, change: "-12%" },
      { category: "Entretenimiento", amount: 200, change: "+15%" },
      { category: "Otros", amount: 180, change: "+2%" },
    ],
    netSavings: { amount: 1450, change: "+12%" },
    budgetAdherence: 94,
  };

  const nutricionData = {
    mealPlanAdherence: 87,
    hydration: { average: 2.4, change: "+0.2L", unit: "L/día" },
    bodyFatChange: "-0.7%",
  };

  const productivityData = {
    habitCompletion: { rate: 82, change: "+8%" },
    bestStreak: 25,
    pomodoros: { total: 156, change: "+22" },
    tasksCompleted: { total: 142, change: "+18" },
  };

  const bienestarData = {
    sleepQuality: { average: 7.8, change: "+0.6" },
    moodAverage: { emoji: "😊", label: "Bueno", score: 7.5, change: "+0.8" },
    hydrationAvg: { value: 2.4, unit: "L/día", change: "+0.3L" },
    journalDays: { count: 22, total: 30 },
    medicationAdherence: 96,
    correlations: [
      "Los días que meditaste, tu mood fue 1.8 puntos más alto",
      "Cuando dormiste +7h, completaste 28% más hábitos",
      "Tu hidratación mejora los días que entrenas",
    ],
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "general", label: "General" },
    { id: "fitness", label: "Fitness" },
    { id: "finanzas", label: "Finanzas" },
    { id: "nutricion", label: "Nutrición" },
    { id: "productividad", label: "Productividad" },
    { id: "bienestar", label: "Bienestar" },
  ];

  const tabStyle = (tabId: TabType): React.CSSProperties => ({
    padding: "12px 20px",
    borderBottom: activeTab === tabId ? `3px solid ${C.accent}` : "none",
    color: activeTab === tabId ? C.dark : C.warm,
    fontWeight: activeTab === tabId ? "600" : "500",
    fontSize: "14px",
    cursor: "pointer",
    backgroundColor: "transparent",
    border: "none",
    transition: "all 0.2s",
  });

  const renderGeneralTab = () => (
    <div style={{ display: "grid", gap: "32px" }}>
      {/* Life Score */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase" }}>
            Inicio del Mes
          </p>
          <div
            style={{
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              backgroundColor: C.cream,
              border: `4px solid ${C.tan}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <span style={{ fontSize: "48px", fontWeight: "700", color: C.dark }}>67%</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase" }}>
            Fin del Mes
          </p>
          <div
            style={{
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              backgroundColor: C.successLight,
              border: `4px solid ${C.success}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <span style={{ fontSize: "48px", fontWeight: "700", color: C.success }}>81%</span>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: C.successLight,
          border: `1px solid ${C.success}`,
          borderRadius: "8px",
          padding: "16px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "16px", fontWeight: "600", color: C.success, margin: 0 }}>
          Eres un 21% mejor que hace un mes
        </p>
      </div>

      {/* Radar Charts */}
      <div>
        <p style={{ fontSize: "14px", fontWeight: "600", color: C.dark, margin: "0 0 20px 0" }}>
          Evolución del Mes
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ backgroundColor: C.warmWhite, padding: "16px", borderRadius: "8px" }}>
            <p style={{ fontSize: "13px", color: C.warm, fontWeight: "500", margin: "0 0 12px 0" }}>
              Inicio del Mes
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarDataStart}>
                <PolarGrid stroke={C.lightTan} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: C.warm }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11, fill: C.warm }} />
                <Radar name="Score" dataKey="value" stroke={C.warning} fill={C.warningLight} fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ backgroundColor: C.warmWhite, padding: "16px", borderRadius: "8px" }}>
            <p style={{ fontSize: "13px", color: C.warm, fontWeight: "500", margin: "0 0 12px 0" }}>
              Fin del Mes
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarDataEnd}>
                <PolarGrid stroke={C.lightTan} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: C.warm }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11, fill: C.warm }} />
                <Radar name="Score" dataKey="value" stroke={C.success} fill={C.successLight} fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Achievements */}
      <div>
        <p style={{ fontSize: "14px", fontWeight: "600", color: C.dark, margin: "0 0 16px 0" }}>
          Top 5 Logros
        </p>
        <div style={{ display: "grid", gap: "12px" }}>
          {achievements.map((achievement, index) => (
            <div
              key={index}
              style={{
                backgroundColor: C.paper,
                border: `1px solid ${C.lightTan}`,
                borderRadius: "8px",
                padding: "14px 16px",
                fontSize: "14px",
                color: C.dark,
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Award size={18} color={C.accent} />
              {achievement}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFitnessTab = () => (
    <div style={{ display: "grid", gap: "32px" }}>
      {/* PRs */}
      <div>
        <p style={{ fontSize: "14px", fontWeight: "600", color: C.dark, margin: "0 0 16px 0" }}>
          Personal Records
        </p>
        <div style={{ display: "grid", gap: "12px" }}>
          {fitnessData.prs.map((pr, index) => (
            <div
              key={index}
              style={{
                backgroundColor: C.successLight,
                border: `1px solid ${C.success}`,
                borderRadius: "8px",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: "500", color: C.dark }}>{pr.exercise}</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: C.success }}>
                  {pr.value}
                </div>
                <div style={{ fontSize: "12px", color: C.success }}>
                  {pr.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plateaus */}
      <div>
        <p style={{ fontSize: "14px", fontWeight: "600", color: C.dark, margin: "0 0 16px 0" }}>
          Mesetas Detectadas
        </p>
        <div style={{ display: "grid", gap: "12px" }}>
          {fitnessData.plateaus.map((plateau, index) => (
            <div
              key={index}
              style={{
                backgroundColor: C.warningLight,
                border: `1px solid ${C.warning}`,
                borderRadius: "8px",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: "500", color: C.dark }}>{plateau.exercise}</span>
              <span style={{ fontSize: "12px", color: C.warning }}>{plateau.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Volume Stats */}
      <div>
        <p style={{ fontSize: "14px", fontWeight: "600", color: C.dark, margin: "0 0 16px 0" }}>
          Volumen Semanal
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={fitnessData.volumeData}>
            <CartesianGrid stroke={C.lightTan} />
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: C.warm }} />
            <YAxis tick={{ fontSize: 12, fill: C.warm }} />
            <Tooltip
              contentStyle={{
                backgroundColor: C.paper,
                border: `1px solid ${C.lightTan}`,
              }}
            />
            <Line type="monotone" dataKey="volume" stroke={C.accent} strokeWidth={3} dot={{ fill: C.accent }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Training Days & Body Changes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "8px", padding: "16px" }}>
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase" }}>
            Días de Entrenamiento
          </p>
          <p style={{ fontSize: "32px", fontWeight: "700", color: C.dark, margin: "0 0 8px 0" }}>
            {fitnessData.trainingDays}
          </p>
          <p style={{ fontSize: "13px", color: C.warm }}>de 30 días (80%)</p>
        </div>

        <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "8px", padding: "16px" }}>
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase" }}>
            Cambios Corporales
          </p>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0" }}>
              <span style={{ fontSize: "13px", color: C.dark }}>Peso:</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: C.success }}>
                {fitnessData.bodyChanges.weight.change}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: C.dark }}>Grasa corporal:</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: C.success }}>
                {fitnessData.bodyChanges.bodyFat.change}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinanzasTab = () => (
    <div style={{ display: "grid", gap: "32px" }}>
      {/* Income */}
      <div style={{ backgroundColor: C.successLight, border: `1px solid ${C.success}`, borderRadius: "8px", padding: "20px" }}>
        <p style={{ fontSize: "12px", color: C.success, margin: "0 0 12px 0", textTransform: "uppercase", fontWeight: "600" }}>
          Ingresos Totales
        </p>
        <p style={{ fontSize: "32px", fontWeight: "700", color: C.dark, margin: 0 }}>
          ${financesData.income.total}
        </p>
        <p style={{ fontSize: "13px", color: C.success, marginTop: "8px" }}>
          {financesData.income.change} respecto al mes anterior
        </p>
      </div>

      {/* Expenses */}
      <div>
        <p style={{ fontSize: "14px", fontWeight: "600", color: C.dark, margin: "0 0 16px 0" }}>
          Desglose de Gastos
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={financesData.expenses}>
            <CartesianGrid stroke={C.lightTan} />
            <XAxis dataKey="category" tick={{ fontSize: 12, fill: C.warm }} />
            <YAxis tick={{ fontSize: 12, fill: C.warm }} />
            <Tooltip
              contentStyle={{
                backgroundColor: C.paper,
                border: `1px solid ${C.lightTan}`,
              }}
            />
            <Bar dataKey="amount" fill={C.accent} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Categories */}
      <div style={{ display: "grid", gap: "12px" }}>
        {financesData.expenses.map((expense, index) => (
          <div
            key={index}
            style={{
              backgroundColor: C.paper,
              border: `1px solid ${C.lightTan}`,
              borderRadius: "8px",
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: C.dark }}>
                {expense.category}
              </p>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: C.warm }}>
                ${expense.amount}
              </p>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: expense.change.startsWith("+") ? C.danger : C.success,
              }}
            >
              {expense.change}
            </span>
          </div>
        ))}
      </div>

      {/* Net Savings & Budget Adherence */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "8px", padding: "16px" }}>
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase" }}>
            Ahorro Neto
          </p>
          <p style={{ fontSize: "28px", fontWeight: "700", color: C.success, margin: 0 }}>
            ${financesData.netSavings.amount}
          </p>
          <p style={{ fontSize: "12px", color: C.success, marginTop: "6px" }}>
            {financesData.netSavings.change}
          </p>
        </div>

        <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "8px", padding: "16px" }}>
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase" }}>
            Adherencia Presupuestaria
          </p>
          <p style={{ fontSize: "28px", fontWeight: "700", color: C.accent, margin: 0 }}>
            {financesData.budgetAdherence}%
          </p>
          <p style={{ fontSize: "12px", color: C.warm, marginTop: "6px" }}>Excelente cumplimiento</p>
        </div>
      </div>
    </div>
  );

  const renderNutricionTab = () => (
    <div style={{ display: "grid", gap: "32px" }}>
      {/* Meal Plan Adherence */}
      <div style={{ backgroundColor: C.successLight, border: `1px solid ${C.success}`, borderRadius: "8px", padding: "20px" }}>
        <p style={{ fontSize: "12px", color: C.success, margin: "0 0 12px 0", textTransform: "uppercase", fontWeight: "600" }}>
          Adherencia Plan de Comidas
        </p>
        <p style={{ fontSize: "32px", fontWeight: "700", color: C.dark, margin: 0 }}>
          {nutricionData.mealPlanAdherence}%
        </p>
      </div>

      {/* Hydration */}
      <div style={{ backgroundColor: C.infoLight, border: `1px solid ${C.info}`, borderRadius: "8px", padding: "20px" }}>
        <p style={{ fontSize: "12px", color: C.info, margin: "0 0 12px 0", textTransform: "uppercase", fontWeight: "600" }}>
          Hidratación Promedio
        </p>
        <p style={{ fontSize: "32px", fontWeight: "700", color: C.dark, margin: 0 }}>
          {nutricionData.hydration.average} {nutricionData.hydration.unit}
        </p>
        <p style={{ fontSize: "13px", color: C.info, marginTop: "8px" }}>
          {nutricionData.hydration.change} respecto al mes anterior
        </p>
      </div>

      {/* Body Fat Change */}
      <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "8px", padding: "20px" }}>
        <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase", fontWeight: "600" }}>
          Cambio en Grasa Corporal
        </p>
        <p style={{ fontSize: "28px", fontWeight: "700", color: C.success, margin: 0 }}>
          {nutricionData.bodyFatChange}
        </p>
        <p style={{ fontSize: "13px", color: C.warm, marginTop: "6px" }}>Disminución saludable</p>
      </div>

      {/* Nutrition Insights */}
      <div style={{ backgroundColor: C.warmWhite, border: `1px solid ${C.cream}`, borderRadius: "8px", padding: "16px" }}>
        <p style={{ fontSize: "14px", fontWeight: "600", color: C.dark, margin: "0 0 12px 0" }}>
          Insights Nutricionales
        </p>
        <ul style={{ margin: 0, paddingLeft: "20px", color: C.dark, fontSize: "13px", lineHeight: "1.8" }}>
          <li>Aumento de consumo de proteína: +12%</li>
          <li>Hidratación mejorada y consistente</li>
          <li>Reducción de azúcares refinados</li>
          <li>Más frutas y vegetales en la dieta</li>
        </ul>
      </div>
    </div>
  );

  const renderProductividadTab = () => (
    <div style={{ display: "grid", gap: "32px" }}>
      {/* Habit Completion */}
      <div style={{ backgroundColor: C.successLight, border: `1px solid ${C.success}`, borderRadius: "8px", padding: "20px" }}>
        <p style={{ fontSize: "12px", color: C.success, margin: "0 0 12px 0", textTransform: "uppercase", fontWeight: "600" }}>
          Tasa de Completitud de Hábitos
        </p>
        <p style={{ fontSize: "32px", fontWeight: "700", color: C.dark, margin: 0 }}>
          {productivityData.habitCompletion.rate}%
        </p>
        <p style={{ fontSize: "13px", color: C.success, marginTop: "8px" }}>
          {productivityData.habitCompletion.change} vs mes anterior
        </p>
      </div>

      {/* Best Streak */}
      <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "8px", padding: "20px" }}>
        <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase", fontWeight: "600" }}>
          Mejor Racha
        </p>
        <p style={{ fontSize: "32px", fontWeight: "700", color: C.accent, margin: 0 }}>
          {productivityData.bestStreak} días
        </p>
        <p style={{ fontSize: "13px", color: C.warm, marginTop: "6px" }}>En meditación</p>
      </div>

      {/* Pomodoros & Tasks */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "8px", padding: "16px" }}>
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase" }}>
            Pomodoros
          </p>
          <p style={{ fontSize: "28px", fontWeight: "700", color: C.accent, margin: 0 }}>
            {productivityData.pomodoros.total}
          </p>
          <p style={{ fontSize: "12px", color: C.warm, marginTop: "6px" }}>
            {productivityData.pomodoros.change}
          </p>
        </div>

        <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "8px", padding: "16px" }}>
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase" }}>
            Tareas Completadas
          </p>
          <p style={{ fontSize: "28px", fontWeight: "700", color: C.success, margin: 0 }}>
            {productivityData.tasksCompleted.total}
          </p>
          <p style={{ fontSize: "12px", color: C.warm, marginTop: "6px" }}>
            {productivityData.tasksCompleted.change}
          </p>
        </div>
      </div>

      {/* Productivity Insights */}
      <div style={{ backgroundColor: C.warmWhite, border: `1px solid ${C.cream}`, borderRadius: "8px", padding: "16px" }}>
        <p style={{ fontSize: "14px", fontWeight: "600", color: C.dark, margin: "0 0 12px 0" }}>
          Mejoras de Productividad
        </p>
        <ul style={{ margin: 0, paddingLeft: "20px", color: C.dark, fontSize: "13px", lineHeight: "1.8" }}>
          <li>Consistencia en hábitos de trabajo</li>
          <li>Aumento en sesiones de enfoque</li>
          <li>Mejor gestión del tiempo</li>
          <li>Completitud de proyectos: 3 finalizados</li>
        </ul>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralTab();
      case "fitness":
        return renderFitnessTab();
      case "finanzas":
        return renderFinanzasTab();
      case "nutricion":
        return renderNutricionTab();
      case "productividad":
        return renderProductividadTab();
      case "bienestar":
        return renderBienestarTab();
    }
  };

  const renderBienestarTab = () => (
    <div style={{ display: "grid", gap: "32px" }}>
      {/* Sleep Quality */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={{ backgroundColor: C.infoLight, border: `1px solid ${C.info}`, borderRadius: "8px", padding: "20px" }}>
          <p style={{ fontSize: "12px", color: C.info, margin: "0 0 12px 0", textTransform: "uppercase", fontWeight: "600" }}>Calidad de Sueño Promedio</p>
          <p style={{ fontSize: "32px", fontWeight: "700", color: C.dark, margin: 0 }}>{bienestarData.sleepQuality.average}/10</p>
          <p style={{ fontSize: "13px", color: C.info, marginTop: "8px" }}>+{bienestarData.sleepQuality.change} vs mes anterior</p>
        </div>
        <div style={{ backgroundColor: C.warningLight, border: `1px solid ${C.warning}`, borderRadius: "8px", padding: "20px" }}>
          <p style={{ fontSize: "12px", color: C.warning, margin: "0 0 12px 0", textTransform: "uppercase", fontWeight: "600" }}>Estado de Ánimo Promedio</p>
          <p style={{ fontSize: "32px", fontWeight: "700", color: C.dark, margin: 0 }}>{bienestarData.moodAverage.emoji} {bienestarData.moodAverage.score}/10</p>
          <p style={{ fontSize: "13px", color: C.warning, marginTop: "8px" }}>+{bienestarData.moodAverage.change} vs mes anterior</p>
        </div>
      </div>

      {/* Hydration & Journal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
        <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase" }}>Hidratación</p>
          <p style={{ fontSize: "28px", fontWeight: "700", color: C.info, margin: 0 }}>{bienestarData.hydrationAvg.value} {bienestarData.hydrationAvg.unit}</p>
          <p style={{ fontSize: "12px", color: C.success, marginTop: "6px" }}>{bienestarData.hydrationAvg.change}</p>
        </div>
        <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase" }}>Días de Journaling</p>
          <p style={{ fontSize: "28px", fontWeight: "700", color: C.accent, margin: 0 }}>{bienestarData.journalDays.count}/{bienestarData.journalDays.total}</p>
          <p style={{ fontSize: "12px", color: C.warm, marginTop: "6px" }}>{Math.round((bienestarData.journalDays.count / bienestarData.journalDays.total) * 100)}% del mes</p>
        </div>
        <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 12px 0", textTransform: "uppercase" }}>Medicación</p>
          <p style={{ fontSize: "28px", fontWeight: "700", color: C.success, margin: 0 }}>{bienestarData.medicationAdherence}%</p>
          <p style={{ fontSize: "12px", color: C.warm, marginTop: "6px" }}>Adherencia</p>
        </div>
      </div>

      {/* Correlations */}
      <div style={{ backgroundColor: C.accentGlow, border: `1px solid ${C.accent}40`, borderRadius: "8px", padding: "20px" }}>
        <p style={{ fontSize: "14px", fontWeight: "600", color: C.dark, margin: "0 0 16px 0" }}>🔗 Correlaciones Detectadas</p>
        <div style={{ display: "grid", gap: "12px" }}>
          {bienestarData.correlations.map((corr, i) => (
            <div key={i} style={{ backgroundColor: C.paper, border: `1px solid ${C.cream}`, borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: C.dark }}>
              💡 {corr}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.paper,
          borderRadius: "16px",
          maxWidth: "900px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px 32px",
            borderBottom: `1px solid ${C.lightTan}`,
            backgroundColor: C.lightCream,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Award size={24} color={C.accent} />
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: C.dark,
                margin: 0,
              }}
            >
              Resumen de Marzo 2026
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.warm,
              transition: "color 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = C.dark;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = C.warm;
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${C.lightTan}`,
            backgroundColor: C.paper,
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={tabStyle(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "32px",
            backgroundColor: C.warmWhite,
          }}
        >
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
