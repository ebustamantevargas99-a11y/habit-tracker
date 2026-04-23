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
import { cn } from "@/components/ui";

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

type TabType = "general" | "fitness" | "finanzas" | "nutricion" | "productividad";

export default function MonthlySummaryModal({ onClose }: MonthlySummaryModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");

  const radarDataStart = [
    { subject: "Fitness", value: 65 },
    { subject: "Nutrición", value: 72 },
    { subject: "Productividad", value: 78 },
    { subject: "Finanzas", value: 68 },
    { subject: "Relaciones", value: 70 },
  ];

  const radarDataEnd = [
    { subject: "Fitness", value: 82 },
    { subject: "Nutrición", value: 85 },
    { subject: "Productividad", value: 88 },
    { subject: "Finanzas", value: 76 },
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

  const tabs: { id: TabType; label: string }[] = [
    { id: "general", label: "General" },
    { id: "fitness", label: "Fitness" },
    { id: "finanzas", label: "Finanzas" },
    { id: "nutricion", label: "Nutrición" },
    { id: "productividad", label: "Productividad" },
  ];

  const renderGeneralTab = () => (
    <div className="grid gap-8">
      {/* Life Score */}
      <div className="grid grid-cols-2 gap-8 items-center">
        <div className="text-center">
          <p className="text-xs text-brand-warm m-0 mb-3 uppercase">Inicio del Mes</p>
          <div className="w-[140px] h-[140px] rounded-full bg-brand-cream border-4 border-brand-tan flex items-center justify-center mx-auto">
            <span className="text-[48px] font-bold text-brand-dark">67%</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-brand-warm m-0 mb-3 uppercase">Fin del Mes</p>
          <div className="w-[140px] h-[140px] rounded-full bg-success-light border-4 border-success flex items-center justify-center mx-auto">
            <span className="text-[48px] font-bold text-success">81%</span>
          </div>
        </div>
      </div>

      <div className="bg-success-light border border-success rounded-lg p-4 text-center">
        <p className="text-base font-semibold text-success m-0">
          Eres un 21% mejor que hace un mes
        </p>
      </div>

      {/* Radar Charts */}
      <div>
        <p className="text-sm font-semibold text-brand-dark m-0 mb-5">Evolución del Mes</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-brand-warm-white p-4 rounded-lg">
            <p className="text-[13px] text-brand-warm font-medium m-0 mb-3">Inicio del Mes</p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarDataStart}>
                <PolarGrid stroke={C.lightTan} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: C.warm }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11, fill: C.warm }} />
                <Radar name="Score" dataKey="value" stroke={C.warning} fill={C.warningLight} fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-brand-warm-white p-4 rounded-lg">
            <p className="text-[13px] text-brand-warm font-medium m-0 mb-3">Fin del Mes</p>
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
        <p className="text-sm font-semibold text-brand-dark m-0 mb-4">Top 5 Logros</p>
        <div className="grid gap-3">
          {achievements.map((achievement, index) => (
            <div key={index} className="bg-brand-paper border border-brand-light-tan rounded-lg px-4 py-[14px] text-sm text-brand-dark flex items-center gap-3">
              <Award size={18} color={C.accent} />
              {achievement}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFitnessTab = () => (
    <div className="grid gap-8">
      {/* PRs */}
      <div>
        <p className="text-sm font-semibold text-brand-dark m-0 mb-4">Personal Records</p>
        <div className="grid gap-3">
          {fitnessData.prs.map((pr, index) => (
            <div key={index} className="bg-success-light border border-success rounded-lg px-4 py-[14px] flex justify-between items-center">
              <span className="font-medium text-brand-dark">{pr.exercise}</span>
              <div className="text-right">
                <div className="text-sm font-semibold text-success">{pr.value}</div>
                <div className="text-xs text-success">{pr.change}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plateaus */}
      <div>
        <p className="text-sm font-semibold text-brand-dark m-0 mb-4">Mesetas Detectadas</p>
        <div className="grid gap-3">
          {fitnessData.plateaus.map((plateau, index) => (
            <div key={index} className="bg-warning-light border border-warning rounded-lg px-4 py-[14px] flex justify-between items-center">
              <span className="font-medium text-brand-dark">{plateau.exercise}</span>
              <span className="text-xs text-warning">{plateau.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Volume Stats */}
      <div>
        <p className="text-sm font-semibold text-brand-dark m-0 mb-4">Volumen Semanal</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={fitnessData.volumeData}>
            <CartesianGrid stroke={C.lightTan} />
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: C.warm }} />
            <YAxis tick={{ fontSize: 12, fill: C.warm }} />
            <Tooltip contentStyle={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}` }} />
            <Line type="monotone" dataKey="volume" stroke={C.accent} strokeWidth={3} dot={{ fill: C.accent }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Training Days & Body Changes */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-brand-paper border border-brand-light-tan rounded-lg p-4">
          <p className="text-xs text-brand-warm m-0 mb-3 uppercase">Días de Entrenamiento</p>
          <p className="text-[32px] font-bold text-brand-dark m-0 mb-2">{fitnessData.trainingDays}</p>
          <p className="text-[13px] text-brand-warm m-0">de 30 días (80%)</p>
        </div>

        <div className="bg-brand-paper border border-brand-light-tan rounded-lg p-4">
          <p className="text-xs text-brand-warm m-0 mb-3 uppercase">Cambios Corporales</p>
          <div>
            <div className="flex justify-between my-2">
              <span className="text-[13px] text-brand-dark">Peso:</span>
              <span className="text-[13px] font-semibold text-success">{fitnessData.bodyChanges.weight.change}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-brand-dark">Grasa corporal:</span>
              <span className="text-[13px] font-semibold text-success">{fitnessData.bodyChanges.bodyFat.change}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinanzasTab = () => (
    <div className="grid gap-8">
      {/* Income */}
      <div className="bg-success-light border border-success rounded-lg p-5">
        <p className="text-xs text-success m-0 mb-3 uppercase font-semibold">Ingresos Totales</p>
        <p className="text-[32px] font-bold text-brand-dark m-0">${financesData.income.total}</p>
        <p className="text-[13px] text-success mt-2 m-0">{financesData.income.change} respecto al mes anterior</p>
      </div>

      {/* Expenses */}
      <div>
        <p className="text-sm font-semibold text-brand-dark m-0 mb-4">Desglose de Gastos</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={financesData.expenses}>
            <CartesianGrid stroke={C.lightTan} />
            <XAxis dataKey="category" tick={{ fontSize: 12, fill: C.warm }} />
            <YAxis tick={{ fontSize: 12, fill: C.warm }} />
            <Tooltip contentStyle={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}` }} />
            <Bar dataKey="amount" fill={C.accent} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Categories */}
      <div className="grid gap-3">
        {financesData.expenses.map((expense, index) => (
          <div key={index} className="bg-brand-paper border border-brand-light-tan rounded-lg px-4 py-[14px] flex justify-between items-center">
            <div>
              <p className="m-0 text-sm font-medium text-brand-dark">{expense.category}</p>
              <p className="m-0 mt-1 text-xs text-brand-warm">${expense.amount}</p>
            </div>
            <span className={cn("text-xs font-semibold", expense.change.startsWith("+") ? "text-danger" : "text-success")}>
              {expense.change}
            </span>
          </div>
        ))}
      </div>

      {/* Net Savings & Budget Adherence */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-brand-paper border border-brand-light-tan rounded-lg p-4">
          <p className="text-xs text-brand-warm m-0 mb-3 uppercase">Ahorro Neto</p>
          <p className="text-[28px] font-bold text-success m-0">${financesData.netSavings.amount}</p>
          <p className="text-xs text-success mt-[6px] m-0">{financesData.netSavings.change}</p>
        </div>

        <div className="bg-brand-paper border border-brand-light-tan rounded-lg p-4">
          <p className="text-xs text-brand-warm m-0 mb-3 uppercase">Adherencia Presupuestaria</p>
          <p className="text-[28px] font-bold text-accent m-0">{financesData.budgetAdherence}%</p>
          <p className="text-xs text-brand-warm mt-[6px] m-0">Excelente cumplimiento</p>
        </div>
      </div>
    </div>
  );

  const renderNutricionTab = () => (
    <div className="grid gap-8">
      {/* Meal Plan Adherence */}
      <div className="bg-success-light border border-success rounded-lg p-5">
        <p className="text-xs text-success m-0 mb-3 uppercase font-semibold">Adherencia Plan de Comidas</p>
        <p className="text-[32px] font-bold text-brand-dark m-0">{nutricionData.mealPlanAdherence}%</p>
      </div>

      {/* Hydration */}
      <div className="bg-info-light border border-info rounded-lg p-5">
        <p className="text-xs text-info m-0 mb-3 uppercase font-semibold">Hidratación Promedio</p>
        <p className="text-[32px] font-bold text-brand-dark m-0">
          {nutricionData.hydration.average} {nutricionData.hydration.unit}
        </p>
        <p className="text-[13px] text-info mt-2 m-0">{nutricionData.hydration.change} respecto al mes anterior</p>
      </div>

      {/* Body Fat Change */}
      <div className="bg-brand-paper border border-brand-light-tan rounded-lg p-5">
        <p className="text-xs text-brand-warm m-0 mb-3 uppercase font-semibold">Cambio en Grasa Corporal</p>
        <p className="text-[28px] font-bold text-success m-0">{nutricionData.bodyFatChange}</p>
        <p className="text-[13px] text-brand-warm mt-[6px] m-0">Disminución saludable</p>
      </div>

      {/* Nutrition Insights */}
      <div className="bg-brand-warm-white border border-brand-cream rounded-lg p-4">
        <p className="text-sm font-semibold text-brand-dark m-0 mb-3">Descubrimientos Nutricionales</p>
        <ul className="m-0 pl-5 text-brand-dark text-[13px] leading-[1.8]">
          <li>Aumento de consumo de proteína: +12%</li>
          <li>Hidratación mejorada y consistente</li>
          <li>Reducción de azúcares refinados</li>
          <li>Más frutas y vegetales en la dieta</li>
        </ul>
      </div>
    </div>
  );

  const renderProductividadTab = () => (
    <div className="grid gap-8">
      {/* Habit Completion */}
      <div className="bg-success-light border border-success rounded-lg p-5">
        <p className="text-xs text-success m-0 mb-3 uppercase font-semibold">Tasa de Completitud de Hábitos</p>
        <p className="text-[32px] font-bold text-brand-dark m-0">{productivityData.habitCompletion.rate}%</p>
        <p className="text-[13px] text-success mt-2 m-0">{productivityData.habitCompletion.change} vs mes anterior</p>
      </div>

      {/* Best Streak */}
      <div className="bg-brand-paper border border-brand-light-tan rounded-lg p-5">
        <p className="text-xs text-brand-warm m-0 mb-3 uppercase font-semibold">Mejor Racha</p>
        <p className="text-[32px] font-bold text-accent m-0">{productivityData.bestStreak} días</p>
        <p className="text-[13px] text-brand-warm mt-[6px] m-0">En meditación</p>
      </div>

      {/* Pomodoros & Tasks */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-brand-paper border border-brand-light-tan rounded-lg p-4">
          <p className="text-xs text-brand-warm m-0 mb-3 uppercase">Pomodoros</p>
          <p className="text-[28px] font-bold text-accent m-0">{productivityData.pomodoros.total}</p>
          <p className="text-xs text-brand-warm mt-[6px] m-0">{productivityData.pomodoros.change}</p>
        </div>

        <div className="bg-brand-paper border border-brand-light-tan rounded-lg p-4">
          <p className="text-xs text-brand-warm m-0 mb-3 uppercase">Tareas Completadas</p>
          <p className="text-[28px] font-bold text-success m-0">{productivityData.tasksCompleted.total}</p>
          <p className="text-xs text-brand-warm mt-[6px] m-0">{productivityData.tasksCompleted.change}</p>
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="bg-brand-warm-white border border-brand-cream rounded-lg p-4">
        <p className="text-sm font-semibold text-brand-dark m-0 mb-3">Mejoras de Productividad</p>
        <ul className="m-0 pl-5 text-brand-dark text-[13px] leading-[1.8]">
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
      case "general":      return renderGeneralTab();
      case "fitness":      return renderFitnessTab();
      case "finanzas":     return renderFinanzasTab();
      case "nutricion":    return renderNutricionTab();
      case "productividad": return renderProductividadTab();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div
        className="bg-brand-paper rounded-2xl max-w-[900px] w-[90%] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-brand-light-tan bg-brand-light-cream">
          <div className="flex items-center gap-3">
            <Award size={24} color={C.accent} />
            <h2 className="text-2xl font-bold text-brand-dark m-0">Resumen de Marzo 2026</h2>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer p-2 flex items-center justify-center text-brand-warm hover:text-brand-dark transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-light-tan bg-brand-paper overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-3 bg-transparent cursor-pointer text-sm transition-all border-0 border-b-[3px]",
                activeTab === tab.id
                  ? "border-b-accent text-brand-dark font-semibold"
                  : "border-b-transparent text-brand-warm font-medium"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 bg-brand-warm-white">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
