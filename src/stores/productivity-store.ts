"use client";
import { create } from "zustand";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PomodoroSession {
  id: string;
  date: string;
  task: string | null;
  duration: number;
  isWork: boolean;
  notes: string | null;
  completedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  objectiveId: string | null;
  weight: number;
  dueDate: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  emoji: string;
  status: string;
  createdAt: string;
  tasks: ProjectTask[];
}

// ─── State ────────────────────────────────────────────────────────────────────

interface ProductivityState {
  pomodoroSessions: PomodoroSession[];
  projects: Project[];
  activeProjectId: string;
  isLoaded: boolean;
  error: string | null;
  clearError: () => void;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;

  // Pomodoro
  addPomodoroSession: (data: { task?: string; duration: number; isWork?: boolean; notes?: string }) => Promise<void>;

  // Projects
  addProject: (data: { name: string; description?: string; color?: string; emoji?: string }) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProjectId: (id: string) => void;

  // Tasks
  addTask: (projectId: string, data: {
    title: string; description?: string; status?: string;
    priority?: string; objectiveId?: string; weight?: number;
    dueDate?: string; orderIndex?: number;
  }) => Promise<void>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
  moveTaskStatus: (projectId: string, taskId: string, status: string) => Promise<void>;
}

// ─── One-time migration localStorage → API ───────────────────────────────────

interface OldKanbanCard {
  id: string;
  title: string;
  priority: string;
  dueDate?: string;
  category: string;
  objectiveId?: string;
  weight: number;
}

interface OldProject {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string;
  createdAt: string;
}

async function migrateFromLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    const projectsRaw = localStorage.getItem("pm_projects");
    if (!projectsRaw) return;

    const oldProjects: OldProject[] = JSON.parse(projectsRaw);
    if (!oldProjects?.length) return;

    const boardsRaw = localStorage.getItem("pm_boards");
    const allBoards: Record<string, Record<string, OldKanbanCard[]>> = boardsRaw
      ? JSON.parse(boardsRaw)
      : {};

    for (const p of oldProjects) {
      try {
        const created = await api.post<Project>("/productivity/projects", {
          name: p.name,
          description: p.description || null,
          color: p.color,
          emoji: p.emoji,
        });

        const board = allBoards[p.id];
        if (board) {
          const taskPromises: Promise<unknown>[] = [];
          for (const [status, cards] of Object.entries(board)) {
            cards.forEach((card, i) => {
              taskPromises.push(
                api.post(`/productivity/projects/${created.id}/tasks`, {
                  title: card.title,
                  description: card.category || null,
                  status,
                  priority: card.priority,
                  objectiveId: card.objectiveId || null,
                  weight: card.weight ?? 1,
                  dueDate: card.dueDate || null,
                  orderIndex: i,
                })
              );
            });
          }
          await Promise.allSettled(taskPromises);
        }
      } catch {
        // Non-fatal — skip project
      }
    }

    localStorage.removeItem("pm_projects");
    localStorage.removeItem("pm_boards");
    localStorage.removeItem("pm_active_project");
  } catch {
    // Non-fatal
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProductivityStore = create<ProductivityState>((set, get) => ({
  pomodoroSessions: [],
  projects: [],
  activeProjectId: "",
  isLoaded: false,
  error: null,
  clearError: () => set({ error: null }),

  initialize: async () => {
    if (get().isLoaded) return;
    await migrateFromLocalStorage();
    await get().refresh();
  },

  refresh: async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [sessions, projects] = await Promise.all([
        api.get<PomodoroSession[]>(`/productivity/pomodoro?days=1`),
        api.get<Project[]>("/productivity/projects"),
      ]);

      const projectList = projects as Project[];
      const activeId = get().activeProjectId || projectList[0]?.id || "";

      set({
        pomodoroSessions: (sessions as PomodoroSession[]).filter(s => s.date === today),
        projects: projectList,
        activeProjectId: activeId,
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  addPomodoroSession: async (data) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const session = await api.post<PomodoroSession>("/productivity/pomodoro", {
        ...data,
        date: today,
        isWork: data.isWork ?? true,
      });
      set(s => ({ pomodoroSessions: [session, ...s.pomodoroSessions] }));
    } catch {
      // Non-fatal — don't block the UI
    }
  },

  addProject: async (data) => {
    const created = await api.post<Project>("/productivity/projects", data);
    set(s => ({
      projects: [...s.projects, created],
      activeProjectId: created.id,
    }));
    return created;
  },

  deleteProject: async (id) => {
    await api.delete(`/productivity/projects/${id}`);
    set(s => {
      const remaining = s.projects.filter(p => p.id !== id);
      const newActiveId = s.activeProjectId === id ? (remaining[0]?.id ?? "") : s.activeProjectId;
      return { projects: remaining, activeProjectId: newActiveId };
    });
  },

  setActiveProjectId: (id) => {
    set({ activeProjectId: id });
  },

  addTask: async (projectId, data) => {
    const task = await api.post<ProjectTask>(
      `/productivity/projects/${projectId}/tasks`,
      { ...data, status: data.status ?? "todo" }
    );
    set(s => ({
      projects: s.projects.map(p =>
        p.id !== projectId ? p : { ...p, tasks: [...p.tasks, task] }
      ),
    }));
  },

  deleteTask: async (projectId, taskId) => {
    await api.delete(`/productivity/projects/${projectId}/tasks/${taskId}`);
    set(s => ({
      projects: s.projects.map(p =>
        p.id !== projectId ? p : { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
      ),
    }));
  },

  moveTaskStatus: async (projectId, taskId, status) => {
    // Optimistic update
    set(s => ({
      projects: s.projects.map(p =>
        p.id !== projectId ? p : {
          ...p,
          tasks: p.tasks.map(t => t.id !== taskId ? t : { ...t, status }),
        }
      ),
    }));
    // Persist
    api.patch(
      `/productivity/projects/${projectId}/tasks`,
      { tasks: [{ id: taskId, status }] }
    ).catch(() => {});
  },
}));
