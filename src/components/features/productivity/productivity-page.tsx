"use client";

import { CheckSquare, Target, Zap } from "lucide-react";
import { cn } from "@/components/ui";
import { useAppStore, type ProductivityTab } from "@/stores/app-store";
import HabitTrackerPage from "@/components/features/habits/habit-tracker-page";
import KanbanView from "@/components/features/projects/kanban-view";
import FocusPanel from "@/components/features/productivity/focus-panel";

const TABS: { id: ProductivityTab; label: string; icon: React.ElementType }[] = [
  { id: "habits",   label: "Hábitos",    icon: CheckSquare },
  { id: "projects", label: "Proyectos",  icon: Target },
  { id: "pomodoro", label: "Deep Work",  icon: Zap },
];

export default function ProductivityPage() {
  const activeTab = useAppStore((s) => s.productivitySubTab);
  const setActiveTab = useAppStore((s) => s.setProductivitySubTab);

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-brand-cream overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 border-b-2 -mb-[2px] text-sm transition-colors whitespace-nowrap",
                activeTab === t.id
                  ? "border-b-accent text-accent font-semibold"
                  : "border-b-transparent text-brand-medium hover:text-brand-dark"
              )}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "habits" && <HabitTrackerPage />}
      {activeTab === "projects" && <KanbanView />}
      {activeTab === "pomodoro" && <FocusPanel />}
      {activeTab === "command" && <HabitTrackerPage />}
      {activeTab === "projection" && <KanbanView />}
    </div>
  );
}
