"use client";

import { useAppStore } from "@/stores/app-store";
import Sidebar from "./sidebar";
import PlaceholderPage from "./placeholder-page";
import HomeDashboard from "@/components/features/home/home-dashboard";
import ProductivityPage from "@/components/features/productivity/productivity-page";
import CalendarPage from "@/components/features/calendar/calendar-page";
import FinancePage from "@/components/features/finance/finance-page";
import FitnessPage from "@/components/features/fitness/fitness-page";
import NutritionPage from "@/components/features/nutrition/nutrition-page";
import ReadingPage from "@/components/features/reading/reading-page";
import MeditationPage from "@/components/features/meditation/meditation-page";
import CyclePage from "@/components/features/cycle/cycle-page";
import OrganizationPage from "@/components/features/organization/organization-page";
import RewindModal from "@/components/features/rewind/rewind-modal";
import WeeklySummaryModal from "@/components/features/home/weekly-summary-modal";
import OnboardingModal from "@/components/features/onboarding/onboarding-modal";
import SettingsPage from "@/components/features/settings/settings-page";
import FloatingAIButton from "@/components/features/ai-export/floating-ai-button";
import PWAInstallPrompt from "@/components/pwa/install-prompt";
import ReminderScheduler from "@/components/features/calendar/reminder-scheduler";
import { useState, useEffect } from "react";
import { Menu, Bell } from "lucide-react";
import { useRouteSync } from "@/lib/use-route-sync";
import { useHabitStore } from "@/stores/habit-store";
import { useFinanceStore } from "@/stores/finance-store";
import { useFitnessStore } from "@/stores/fitness-store";
import { useGamificationStore } from "@/stores/gamification-store";
import { useUserStore } from "@/stores/user-store";
import { useThemeStore } from "@/stores/theme-store";
import { useNutritionStore } from "@/stores/nutrition-store";
import { useOrganizationStore } from "@/stores/organization-store";

// ─── Notification Scheduler ───────────────────────────────────────────────────

function NotificationScheduler() {
  useEffect(() => {
    const check = () => {
      if (typeof Notification === "undefined") return;
      const enabled = localStorage.getItem("habit-notifications") === "true";
      if (!enabled || Notification.permission !== "granted") return;

      const reminderTime = localStorage.getItem("habit-reminder-time") || "08:00";
      const now = new Date();
      const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (nowTime !== reminderTime) return;

      const key = `${now.toISOString().split("T")[0]}-${reminderTime}`;
      if (localStorage.getItem("habit-last-notif") === key) return;
      localStorage.setItem("habit-last-notif", key);

      new Notification("⏰ Ultimate TRACKER", {
        body: "¡Es hora de completar tus hábitos del día! 🔥",
        icon: "/favicon.ico",
      });
    };

    const interval = setInterval(check, 60000);
    check();
    return () => clearInterval(interval);
  }, []);
  return null;
}

// ─── Theme Initializer ────────────────────────────────────────────────────────

function ThemeInitializer() {
  const { initTheme } = useThemeStore();
  useEffect(() => { initTheme(); }, [initTheme]);
  return null;
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function MainApp() {
  useRouteSync();
  const { activePage, showMonthlySummary, showWeeklySummary, toggleSidebar } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const userName = useUserStore((s) => s.user?.name ?? "U");
  const darkMode = useUserStore((s) => s.user?.profile?.darkMode ?? false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", Boolean(darkMode));
  }, [darkMode]);

  const initHabits       = useHabitStore((s) => s.initialize);
  const initFinance      = useFinanceStore((s) => s.initialize);
  const initFitness      = useFitnessStore((s) => s.initialize);
  const initGamification = useGamificationStore((s) => s.initialize);
  const initUser         = useUserStore((s) => s.initialize);
  const initNutrition    = useNutritionStore((s) => s.initialize);
  const initOrganization = useOrganizationStore((s) => s.initialize);

  useEffect(() => {
    initHabits();
    initFinance();
    initFitness();
    initGamification();
    initUser();
    initNutrition();
    initOrganization();
  }, [initHabits, initFinance, initFitness, initGamification, initUser, initNutrition, initOrganization]);

  const renderPage = () => {
    switch (activePage) {
      case "home":         return <HomeDashboard />;
      case "productivity": return <ProductivityPage />;
      case "plan":         return <CalendarPage />;
      case "finance":      return <FinancePage />;
      case "fitness":      return <FitnessPage />;
      case "nutrition":    return <NutritionPage />;
      case "reading":      return <ReadingPage />;
      case "meditation":   return <MeditationPage />;
      case "menstrualCycle": return <CyclePage />;
      case "organization": return <OrganizationPage />;
      case "settings":     return <SettingsPage />;
      default:             return <PlaceholderPage />;
    }
  };

  const PAGE_TITLES: Record<string, string> = {
    home:         "Dashboard",
    plan:         "Calendar",
    productivity: "Productividad",
    finance:      "Finanzas",
    fitness:      "Fitness",
    nutrition:    "Nutrición",
    reading:      "Lectura",
    meditation:   "Meditación",
    menstrualCycle: "Ciclo menstrual",
    organization: "Organización",
    settings:     "Configuración",
  };

  return (
    <div className="flex h-screen bg-brand-paper">
      <NotificationScheduler />
      <ReminderScheduler />
      <ThemeInitializer />

      <Sidebar isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-8 border-b border-brand-light-cream bg-brand-paper h-[70px] shrink-0">
          {/* Left */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => { setSidebarOpen(!sidebarOpen); toggleSidebar(); }}
              className="p-2 text-brand-dark hover:bg-brand-light-cream rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-3xl font-serif text-brand-dark m-0">
              {PAGE_TITLES[activePage] ?? "Ultimate TRACKER"}
            </h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-6">
            {activePage === "home" && (
              <>
                <button
                  className="btn-primary text-sm"
                  onClick={() => useAppStore.setState({ showMonthlySummary: true })}
                >
                  🎬 Rewind del mes
                </button>
                <button
                  className="btn btn-md bg-brand-brown text-white hover:bg-brand-medium"
                  onClick={() => useAppStore.setState({ showWeeklySummary: true })}
                >
                  Resumen semanal
                </button>
              </>
            )}

            <button
              className="p-2 text-brand-dark hover:bg-brand-light-cream rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center
                            text-white font-semibold text-base cursor-pointer select-none">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          {renderPage()}
        </main>
      </div>

      <FloatingAIButton />
      <PWAInstallPrompt />

      {showMonthlySummary && (
        <RewindModal onClose={() => useAppStore.setState({ showMonthlySummary: false })} />
      )}
      {showWeeklySummary && (
        <WeeklySummaryModal onClose={() => useAppStore.setState({ showWeeklySummary: false })} />
      )}
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
