"use client";

import { Tabs } from "@/components/ui";
import { useAppStore, type ProductivityTab } from "@/stores/app-store";
import HabitTrackerPage from "@/components/features/habits/habit-tracker-page";
import KanbanView from "@/components/features/projects/kanban-view";
import FocusPanel from "@/components/features/productivity/focus-panel";
import ReadingPage from "@/components/features/reading/reading-page";

const TABS: { id: ProductivityTab; label: string }[] = [
  { id: "habits",   label: "Hábitos" },
  { id: "projects", label: "Proyectos" },
  { id: "pomodoro", label: "Trabajo profundo" },
  { id: "reading",  label: "Lectura" },
];

export default function ProductivityPage() {
  const activeTab = useAppStore((s) => s.productivitySubTab);
  const setActiveTab = useAppStore((s) => s.setProductivitySubTab);

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as ProductivityTab)}
        variant="segmented"
        className="overflow-x-auto"
      />

      {activeTab === "habits"   && <HabitTrackerPage />}
      {activeTab === "projects" && <KanbanView />}
      {activeTab === "pomodoro" && <FocusPanel />}
      {activeTab === "reading"  && <ReadingPage />}
      {activeTab === "command"    && <HabitTrackerPage />}
      {activeTab === "projection" && <KanbanView />}
    </div>
  );
}
