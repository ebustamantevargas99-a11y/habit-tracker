"use client";

import { useAppStore } from "@/stores/app-store";
import Sidebar from "./sidebar";
import PlaceholderPage from "./placeholder-page";
import HomeDashboard from "@/components/features/home/home-dashboard";
import HabitTrackerPage from "@/components/features/habits/habit-tracker-page";
import ProductivityPage from "@/components/features/productivity/productivity-page";
import DailyPlannerPage from "@/components/features/planner/daily-planner-page";
import BudgetTrackerPage from "@/components/features/finance/budget-tracker-page";
import MoodTrackerPage from "@/components/features/wellness/mood-tracker-page";
import FitnessPage from "@/components/features/fitness/fitness-page";
import NutritionPage from "@/components/features/nutrition/nutrition-page";
import OrganizationPage from "@/components/features/organization/organization-page";
import MonthlySummaryModal from "@/components/features/home/monthly-summary-modal";
import WeeklySummaryModal from "@/components/features/home/weekly-summary-modal";
import OnboardingModal from "@/components/features/onboarding/onboarding-modal";
import SettingsPage from "@/components/features/settings/settings-page";
import { useState, useEffect } from "react";
import { Menu, Bell, User } from "lucide-react";
import { useHabitStore } from "@/stores/habit-store";
import { useFinanceStore } from "@/stores/finance-store";
import { useFitnessStore } from "@/stores/fitness-store";
import { useWellnessStore } from "@/stores/wellness-store";
import { useGamificationStore } from "@/stores/gamification-store";
import { useUserStore } from "@/stores/user-store";
import { useThemeStore } from "@/stores/theme-store";

// Fires browser notifications at the scheduled time
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

      // Avoid sending twice in the same minute
      const key = `${now.toISOString().split("T")[0]}-${reminderTime}`;
      if (localStorage.getItem("habit-last-notif") === key) return;
      localStorage.setItem("habit-last-notif", key);

      new Notification("⏰ Ultimate Habit Tracker", {
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

// Applies saved theme on first render
function ThemeInitializer() {
  const { initTheme } = useThemeStore();
  useEffect(() => { initTheme(); }, []);
  return null;
}

export default function MainApp() {
  const { activePage, showMonthlySummary, showWeeklySummary, toggleSidebar } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const userName = useUserStore((s) => s.user?.name ?? "U");
  const initHabits = useHabitStore((s) => s.initialize);
  const initFinance = useFinanceStore((s) => s.initialize);
  const initFitness = useFitnessStore((s) => s.initialize);
  const initWellness = useWellnessStore((s) => s.initialize);
  const initGamification = useGamificationStore((s) => s.initialize);
  const initUser = useUserStore((s) => s.initialize);

  useEffect(() => {
    initHabits();
    initFinance();
    initFitness();
    initWellness();
    initGamification();
    initUser();
  }, [initHabits, initFinance, initFitness, initWellness, initGamification, initUser]);

  // Map page names to components
  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomeDashboard />;
      case "productivity":
        return <ProductivityPage />;
      case "plan":
        return <DailyPlannerPage />;
      case "finance":
        return <BudgetTrackerPage />;
      case "wellness":
        return <MoodTrackerPage />;
      case "fitness":
        return <FitnessPage />;
      case "nutrition":
        return <NutritionPage />;
      case "organization":
        return <OrganizationPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <PlaceholderPage />;
    }
  };

  // Get page title based on active page
  const getPageTitle = () => {
    const titles: { [key: string]: string } = {
      home: "Dashboard",
      plan: "Calendar",
      productivity: "Productividad",
      organization: "Organización",
      finance: "Finanzas",
      fitness: "Fitness",
      nutrition: "Nutrición",
      wellness: "Bienestar",
      settings: "Configuración",
    };
    return titles[activePage] || "Ultimate Habit Tracker";
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    toggleSidebar();
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "var(--color-paper)" }}>
      <NotificationScheduler />
      <ThemeInitializer />
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 2rem",
            borderBottom: "1px solid var(--color-light-cream)",
            backgroundColor: "var(--color-paper)",
            height: "70px",
          }}
        >
          {/* Left Section - Hamburger & Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <button
              onClick={handleToggleSidebar}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-dark)",
              }}
              aria-label="Toggle sidebar"
            >
              <Menu size={24} />
            </button>
            <h1
              style={{
                fontSize: "1.75rem",
                fontFamily: "Georgia, serif",
                color: "var(--color-dark)",
                margin: 0,
              }}
            >
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Section - Ver Resumen, Bell, Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            {activePage === "home" && (
              <>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-paper)",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--color-accent-light)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--color-accent)")
                }
                onClick={() => useAppStore.setState({ showMonthlySummary: true })}
              >
                Ver Resumen Mensual
              </button>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--color-brown)",
                  color: "var(--color-paper)",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--color-warm)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--color-brown)")
                }
                onClick={() => useAppStore.setState({ showWeeklySummary: true })}
              >
                Ver Resumen Semanal
              </button>
              </>
            )}

            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-dark)",
              }}
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "var(--color-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-paper)",
                fontWeight: "600",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "2rem",
          }}
        >
          {renderPage()}
        </div>
      </div>

      {/* Monthly Summary Modal */}
      {showMonthlySummary && <MonthlySummaryModal onClose={() => useAppStore.setState({ showMonthlySummary: false })} />}

      {/* Weekly Summary Modal */}
      {showWeeklySummary && <WeeklySummaryModal onClose={() => useAppStore.setState({ showWeeklySummary: false })} />}

      {/* Onboarding */}
      {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}
    </div>
  );
}
