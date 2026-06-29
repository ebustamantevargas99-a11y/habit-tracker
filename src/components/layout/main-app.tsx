"use client";

import { useAppStore } from "@/stores/app-store";
import Sidebar from "./sidebar";
import PlaceholderPage from "./placeholder-page";
import HomeDashboard from "@/components/features/home/home-dashboard";
import HomeV2 from "@/components/features/home/v2";
import { useHomeV2Flag } from "@/hooks/use-home-v2-flag";
import ProductivityPage from "@/components/features/productivity/productivity-page";
import CalendarPage from "@/components/features/calendar/calendar-page";
import FinancePage from "@/components/features/finance/finance-page";
import FitnessPage from "@/components/features/fitness/fitness-page";
import NutritionPage from "@/components/features/nutrition/nutrition-page";
import CyclePage from "@/components/features/cycle/cycle-page";
import RewindModal from "@/components/features/rewind/rewind-modal";
import WeeklySummaryModal from "@/components/features/home/weekly-summary-modal";
import OnboardingModal from "@/components/features/onboarding/onboarding-modal";
import SettingsPage from "@/components/features/settings/settings-page";
import PWAInstallPrompt from "@/components/pwa/install-prompt";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
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

// ─── Notification Scheduler ───────────────────────────────────────────────────

function NotificationScheduler() {
  useEffect(() => {
    const check = () => {
      if (typeof Notification === "undefined") return;
      const enabled = localStorage.getItem("habit-notifications") === "true";
      if (!enabled || Notification.permission !== "granted") return;

      const reminderTime =
        localStorage.getItem("habit-reminder-time") || "08:00";
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
  const initTheme = useThemeStore((s) => s.initTheme);
  const applyFromProfile = useThemeStore((s) => s.applyFromProfile);
  const profileTheme = useUserStore((s) => s.user?.profile?.theme);

  // Aplica localStorage first (evita flash de tema default).
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Cuando carga el profile del server, sincroniza el tema guardado en
  // DB. Esto hace que el tema viaje con la cuenta del user — al loguear
  // en otro dispositivo/browser, arranca con el último tema elegido.
  useEffect(() => {
    if (profileTheme) applyFromProfile(profileTheme);
  }, [profileTheme, applyFromProfile]);

  return null;
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function MainApp() {
  useRouteSync();
  const { activePage, showMonthlySummary, showWeeklySummary, toggleSidebar } =
    useAppStore();
  // false es el valor seguro para SSR; el useEffect lo corrige en cliente.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const userName = useUserStore((s) => s.user?.name ?? "U");
  // El modo oscuro lo maneja el sistema de 8 temas (theme-store), no una
  // clase .dark aparte: aplicar html.dark encima del tema elegido lo
  // sobreescribía (un tema claro + darkMode=true mostraba mezcla rota).

  const initHabits = useHabitStore((s) => s.initialize);
  const initFinance = useFinanceStore((s) => s.initialize);
  const initFitness = useFitnessStore((s) => s.initialize);
  const initGamification = useGamificationStore((s) => s.initialize);
  const initUser = useUserStore((s) => s.initialize);
  const initNutrition = useNutritionStore((s) => s.initialize);

  useEffect(() => {
    initHabits();
    initFinance();
    initFitness();
    initGamification();
    initUser();
    initNutrition();
  }, [
    initHabits,
    initFinance,
    initFitness,
    initGamification,
    initUser,
    initNutrition,
  ]);

  // Abre el sidebar por defecto solo en pantallas desktop.
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setSidebarOpen(true);
    }
  }, []);

  const homeV2 = useHomeV2Flag();

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return homeV2 ? <HomeV2 /> : <HomeDashboard />;
      case "productivity":
        return <ProductivityPage />;
      case "plan":
        return <CalendarPage />;
      case "finance":
        return <FinancePage />;
      case "fitness":
        return <FitnessPage />;
      case "nutrition":
        return <NutritionPage />;
      case "menstrualCycle":
        return <CyclePage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <PlaceholderPage />;
    }
  };

  const PAGE_TITLES: Record<string, string> = {
    home: "Inicio",
    plan: "Calendario",
    productivity: "Productividad",
    finance: "Finanzas",
    fitness: "Fitness",
    nutrition: "Nutrición",
    menstrualCycle: "Ciclo menstrual",
    settings: "Configuración",
  };

  return (
    <div className="flex h-[100dvh] bg-brand-paper">
      <NotificationScheduler />
      <ReminderScheduler />
      <ThemeInitializer />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop para cerrar el drawer en móvil al tocar fuera */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 md:px-8 border-b border-brand-light-cream bg-brand-paper h-[70px] shrink-0">
          {/* Left */}
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                toggleSidebar();
              }}
              className="p-2 text-brand-dark hover:bg-brand-light-cream rounded-lg transition-colors"
              aria-label="Mostrar u ocultar menú"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl md:text-3xl font-serif text-brand-dark m-0">
              {PAGE_TITLES[activePage] ?? "Ultimate TRACKER"}
            </h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 md:gap-6">
            {activePage === "home" && (
              <button
                className="btn-primary text-sm hidden md:block"
                onClick={() =>
                  useAppStore.setState({ showMonthlySummary: true })
                }
              >
                🎬 Resumen del mes
              </button>
            )}

            <button
              className="p-2 text-brand-dark hover:bg-brand-light-cream rounded-lg transition-colors"
              aria-label="Notificaciones"
            >
              <Bell size={20} />
            </button>

            <div
              className="w-10 h-10 rounded-full bg-accent flex items-center justify-center
                            text-white font-semibold text-base cursor-pointer select-none"
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content — main-mobile-pb en móvil: nav height (64px) + safe area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 md:pb-8 main-mobile-pb">
          {renderPage()}
        </main>
      </div>

      <MobileBottomNav onMenuOpen={() => setSidebarOpen(true)} />

      <PWAInstallPrompt />

      {showMonthlySummary && (
        <RewindModal
          onClose={() => useAppStore.setState({ showMonthlySummary: false })}
        />
      )}
      {/* WeeklySummaryModal eliminado del top bar: usaba datos hardcoded.
          El RewindModal del 'Resumen del mes' sí usa datos reales. */}
      {false && showWeeklySummary && (
        <WeeklySummaryModal
          onClose={() => useAppStore.setState({ showWeeklySummary: false })}
        />
      )}
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
