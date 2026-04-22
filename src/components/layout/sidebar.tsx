"use client";

import { useState } from "react";
import { useAppStore, type ProductivityTab, type PlanTab } from "@/stores/app-store";
import { useGamificationStore } from "@/stores/gamification-store";
import { useUserStore } from "@/stores/user-store";
import { NAV_ITEMS, LEVELS } from "@/lib/constants";
import type { ModuleKey } from "@/lib/onboarding-constants";
import { cn } from "@/components/ui/cn";

const NAV_TO_MODULE: Record<string, ModuleKey> = {
  home: "home",
  plan: "planner",
  productivity: "tasks",
  finance: "finance",
  fitness: "fitness",
  nutrition: "nutrition",
  organization: "organization",
  settings: "settings",
};

// ─── Section → tab ID maps ────────────────────────────────────────────────────

const PRODUCTIVITY_SECTION_MAP: Record<string, ProductivityTab> = {
  "Hábitos":    "habits",
  "Proyectos":  "projects",
  "Deep Work":  "pomodoro",
};

const PLAN_SECTION_MAP: Record<string, PlanTab> = {
  "Hoy":    "today",
  "Semana": "week",
  "Mes":    "month",
};

const FITNESS_SECTION_MAP: Record<string, string> = {
  "Gym":       "gym",
  "Cardio":    "cardio",
  "Cuerpo":    "cuerpo",
  "Programas": "programas",
  "Análisis":  "analisis",
};

const FINANCE_SECTION_MAP: Record<string, string> = {
  "Panel":          "panel",
  "Flujo":          "flow",
  "Metas & Deudas": "goals",
  "Inversiones":    "investments",
  "Análisis":       "analysis",
};

const NUTRITION_SECTION_MAP: Record<string, string> = {
  "Hoy":          "hoy",
  "Progreso":     "progreso",
  "Composición":  "composicion",
  "Alimentos":    "alimentos",
};

const READING_SECTION_MAP: Record<string, string> = {
  "Leyendo":      "reading",
  "Quiero leer":  "want",
  "Terminados":   "finished",
  "En pausa":     "paused",
};

const ORGANIZATION_SECTION_MAP: Record<string, string> = {
  "Notas":            "notas",
  "Áreas de Vida":    "areas",
  "Revisión Semanal": "revision",
};

// ─── Component ────────────────────────────────────────────────────────────────

import * as LucideIcons from "lucide-react";
import React from "react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const {
    activePage, setActivePage,
    setProductivitySubTab, setPlanTab,
    setFitnessTab, setFinanceTab, setNutritionTab, setReadingTab, setOrganizationTab,
  } = useAppStore();
  const { totalXP, currentLevel, levelName, xpForNextLevel, xpProgress, badges } = useGamificationStore();
  const { user, isModuleEnabled } = useUserStore();
  const displayName = user?.name ?? "Usuario";
  const visibleNav = NAV_ITEMS.filter((item) => {
    const moduleKey = NAV_TO_MODULE[item.key];
    if (!moduleKey) return true;
    return isModuleEnabled(moduleKey);
  });
  const initials = displayName.charAt(0).toUpperCase();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const getIcon = (name: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name];
    return Icon ? <Icon size={20} /> : <LucideIcons.Package size={20} />;
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-brand-dark text-brand-cream shrink-0 overflow-y-auto overflow-x-hidden",
        "border-r border-white/10 transition-[width,min-width] duration-300",
        isOpen ? "w-[260px] min-w-[260px]" : "w-[68px] min-w-[68px]",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 border-b border-white/10",
          !isOpen && "justify-center",
        )}
      >
        <span className="text-2xl shrink-0">🎯</span>
        {isOpen && (
          <h2 className="font-display text-lg font-semibold text-accent-light whitespace-nowrap overflow-hidden m-0 tracking-wide">
            Ultimate <span className="text-brand-cream">TRACKER</span>
          </h2>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {visibleNav.map((item) => {
          const isActive   = activePage === item.key;
          const isExpanded = expandedSections.includes(item.key);

          return (
            <div key={item.key}>
              <button
                onClick={() => {
                  setActivePage(item.key);
                  if (item.sections.length > 0) toggleSection(item.key);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium",
                  "border-l-[3px] transition-all duration-200",
                  "hover:bg-white/10",
                  isActive
                    ? "bg-accent/15 text-accent-light border-l-accent"
                    : "text-brand-cream border-l-transparent",
                  !isOpen && "justify-center",
                )}
              >
                <span className="shrink-0 flex items-center">{getIcon(item.icon)}</span>
                {isOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.sections.length > 0 && (
                      <LucideIcons.ChevronDown
                        size={16}
                        className={cn("transition-transform duration-300", isExpanded && "rotate-180")}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Sub-items */}
              {item.sections.length > 0 && isOpen && isExpanded && (
                <div className="bg-black/20">
                  {item.sections.map((section) => (
                    <button
                      key={section}
                      onClick={() => {
                        setActivePage(item.key);
                        if (item.key === "productivity"  && PRODUCTIVITY_SECTION_MAP[section])  setProductivitySubTab(PRODUCTIVITY_SECTION_MAP[section]);
                        if (item.key === "plan"          && PLAN_SECTION_MAP[section] != null)  setPlanTab(PLAN_SECTION_MAP[section]);
                        if (item.key === "fitness"       && FITNESS_SECTION_MAP[section])       setFitnessTab(FITNESS_SECTION_MAP[section]);
                        if (item.key === "finance"       && FINANCE_SECTION_MAP[section])       setFinanceTab(FINANCE_SECTION_MAP[section]);
                        if (item.key === "nutrition"     && NUTRITION_SECTION_MAP[section])     setNutritionTab(NUTRITION_SECTION_MAP[section]);
                        if (item.key === "reading"       && READING_SECTION_MAP[section])       setReadingTab(READING_SECTION_MAP[section]);
                        if (item.key === "organization"  && ORGANIZATION_SECTION_MAP[section])  setOrganizationTab(ORGANIZATION_SECTION_MAP[section]);
                      }}
                      className={cn(
                        "w-full pl-10 pr-4 py-2 text-[0.8125rem] flex items-center",
                        "border-l-[3px] transition-all duration-200",
                        isActive
                          ? "bg-accent/25 text-accent-light border-l-accent font-medium"
                          : "text-brand-light-tan border-l-transparent hover:bg-white/5",
                      )}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer — User + Gamification */}
      <div className="p-4 border-t border-white/10">
        {/* Avatar + name */}
        <div
          className={cn(
            "flex items-center gap-3",
            !isOpen && "justify-center",
            isOpen && "mb-3",
          )}
        >
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center
                          text-brand-dark font-semibold text-base shrink-0">
            {initials}
          </div>
          {isOpen && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-cream truncate">{displayName}</p>
              <p className="text-[0.6875rem] text-accent-light font-semibold flex items-center gap-1">
                <span>⭐</span>
                Nivel {currentLevel} — {levelName}
              </p>
            </div>
          )}
        </div>

        {/* XP bar */}
        {isOpen && (
          <div className="mt-1">
            <div className="flex justify-between text-[0.625rem] text-brand-light-tan/70 mb-1">
              <span>{totalXP.toLocaleString()} XP</span>
              <span>{xpForNextLevel.toLocaleString()} XP</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              {/* Dynamic width — must stay inline */}
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${xpProgress}%`, background: "linear-gradient(90deg, #B8860B, #D4A843)" }}
              />
            </div>
            <p className="text-[0.625rem] text-brand-light-tan/50 mt-1 text-center">
              {(xpForNextLevel - totalXP).toLocaleString()} XP para Nivel {currentLevel + 1}
            </p>

            {/* Badges */}
            {badges.filter((b) => b.isEarned).length > 0 && (
              <div className="flex gap-1.5 mt-2.5 justify-center flex-wrap">
                {badges.filter((b) => b.isEarned).slice(0, 5).map((badge) => (
                  <div
                    key={badge.id}
                    title={badge.name}
                    className="w-7 h-7 rounded-md bg-accent/20 flex items-center justify-center text-sm"
                  >
                    {badge.emoji}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "mt-3 w-full py-2 px-3 flex items-center gap-1.5 text-xs",
            "text-brand-light-tan/60 border border-white/20 rounded-md",
            "hover:text-brand-cream hover:border-white/50 transition-all duration-200 bg-transparent",
            !isOpen && "justify-center",
          )}
        >
          <LucideIcons.LogOut size={14} />
          {isOpen && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
