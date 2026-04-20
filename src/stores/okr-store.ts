"use client";
import { create } from "zustand";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ObjType = "yearly" | "quarterly" | "monthly" | "milestone";
export type MilestoneStatus = "pending" | "hit" | "missed" | "at_risk";
export type ProjectionType = "logarithmic" | "linear" | "block_periodization";

export interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Objective {
  id: string;
  title: string;
  type: ObjType;
  parentId: string | null;
  startDate: string;
  endDate: string;
  targetValue: number;
  unit: string;
  progress: number;
  color: string;
  emoji: string;
  userId?: string;
  keyResults?: KeyResult[];
}

export interface Milestone {
  id: string;
  objectiveId?: string;
  projectionConfigId?: string;
  weekNumber: number;
  targetDate: string;
  date?: string;
  targetValue: number;
  actualValue: number;
  status: MilestoneStatus;
  recalculated: boolean;
}

export interface ProjectionConfig {
  id?: string;
  objectiveId: string;
  baseline: number;
  goal: number;
  unit: string;
  endDate: string;
  progression: ProjectionType;
  alertThreshold: number;
  autoGenerateMilestones: boolean;
  milestones?: Milestone[];
}

// ─── State ────────────────────────────────────────────────────────────────────
interface OKRState {
  objectives: Objective[];
  milestones: Milestone[];
  projectionConfigs: ProjectionConfig[];
  isLoaded: boolean;
  error: string | null;
  clearError: () => void;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;

  addObjective: (obj: Omit<Objective, "id" | "progress">) => Promise<string>;
  updateObjective: (id: string, updates: Partial<Objective>) => Promise<void>;
  deleteObjective: (id: string) => Promise<void>;

  recalcObjectiveProgress: (objectiveId: string, cards: { objectiveId: string; weight: number; done: boolean }[]) => Promise<void>;

  // Key Results
  addKeyResult: (objectiveId: string, data: { title: string; targetValue?: number; unit?: string }) => Promise<KeyResult>;
  updateKeyResult: (objectiveId: string, krId: string, data: { currentValue?: number; title?: string; targetValue?: number }) => Promise<void>;
  deleteKeyResult: (objectiveId: string, krId: string) => Promise<void>;

  setMilestones: (objectiveId: string, milestones: Milestone[]) => void;
  updateMilestoneActual: (milestoneId: string, actual: number) => void;

  saveProjectionConfig: (cfg: ProjectionConfig) => Promise<void>;
  deleteProjectionConfig: (objectiveId: string) => Promise<void>;
}

// ─── One-time migration localStorage → API ───────────────────────────────────

async function migrateFromLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    const objRaw = localStorage.getItem("okr_objectives");
    if (!objRaw) return;

    const objectives: Objective[] = JSON.parse(objRaw);
    if (!objectives?.length) return;

    // Upload objectives that don't look like sample data IDs
    const nonSample = objectives.filter(o => !o.id.startsWith("obj_yr_") && !o.id.startsWith("obj_q") && !o.id.startsWith("obj_apr_"));
    await Promise.allSettled(
      nonSample.map(o =>
        api.post("/okr/objectives", {
          title: o.title, type: o.type, parentId: o.parentId,
          startDate: o.startDate, endDate: o.endDate,
          targetValue: o.targetValue, unit: o.unit,
          color: o.color, emoji: o.emoji,
        })
      )
    );

    localStorage.removeItem("okr_objectives");
    localStorage.removeItem("okr_milestones");
    localStorage.removeItem("okr_projection_configs");
  } catch {
    // Non-fatal
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useOKRStore = create<OKRState>((set, get) => ({
  objectives: [],
  milestones: [],
  projectionConfigs: [],
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
      const [objectives, projections] = await Promise.all([
        api.get<Objective[]>("/okr/objectives"),
        api.get<(ProjectionConfig & { milestones: Milestone[] })[]>("/okr/projections"),
      ]);

      const allMilestones = (projections as (ProjectionConfig & { milestones: Milestone[] })[]).flatMap(p =>
        (p.milestones ?? []).map(m => ({
          ...m,
          objectiveId: p.objectiveId ?? "",
          targetDate: m.date ?? "",
          actualValue: m.actualValue ?? 0,
          recalculated: m.recalculated ?? false,
        }))
      );

      set({
        objectives: objectives as Objective[],
        projectionConfigs: projections as ProjectionConfig[],
        milestones: allMilestones,
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  addObjective: async (obj) => {
    const created = await api.post<Objective>("/okr/objectives", obj);
    set(s => ({ objectives: [...s.objectives, created] }));
    return created.id;
  },

  updateObjective: async (id, updates) => {
    const updated = await api.patch<Objective>(`/okr/objectives/${id}`, updates);
    set(s => ({ objectives: s.objectives.map(o => o.id === id ? { ...o, ...updated } : o) }));
  },

  deleteObjective: async (id) => {
    await api.delete(`/okr/objectives/${id}`);
    // Remove from local state recursively
    const toDelete = new Set<string>();
    const collect = (pid: string) => {
      toDelete.add(pid);
      get().objectives.filter(o => o.parentId === pid).forEach(c => collect(c.id));
    };
    collect(id);
    set(s => ({
      objectives: s.objectives.filter(o => !toDelete.has(o.id)),
      milestones: s.milestones.filter(m => m.objectiveId && !toDelete.has(m.objectiveId)),
      projectionConfigs: s.projectionConfigs.filter(c => !toDelete.has(c.objectiveId)),
    }));
  },

  recalcObjectiveProgress: async (objectiveId, cards) => {
    const relevant = cards.filter(c => c.objectiveId === objectiveId);
    const total = relevant.reduce((s, c) => s + c.weight, 0);
    if (total === 0) return;
    const done = relevant.filter(c => c.done).reduce((s, c) => s + c.weight, 0);
    const newProgress = Math.round((done / total) * 100);

    set(s => {
      let nextObjs = s.objectives.map(o =>
        o.id === objectiveId ? { ...o, progress: newProgress } : o
      );
      const current = nextObjs.find(o => o.id === objectiveId);
      if (current?.parentId) {
        const siblings = nextObjs.filter(o => o.parentId === current.parentId);
        const avgParent = Math.round(siblings.reduce((acc, o) => acc + o.progress, 0) / siblings.length);
        nextObjs = nextObjs.map(o => o.id === current.parentId ? { ...o, progress: avgParent } : o);
        const parent = nextObjs.find(o => o.id === current.parentId);
        if (parent?.parentId) {
          const uncles = nextObjs.filter(o => o.parentId === parent.parentId);
          const avgGrand = Math.round(uncles.reduce((acc, o) => acc + o.progress, 0) / uncles.length);
          nextObjs = nextObjs.map(o => o.id === parent.parentId ? { ...o, progress: avgGrand } : o);
        }
      }
      return { objectives: nextObjs };
    });
    // Persist to API asynchronously
    api.patch(`/okr/objectives/${objectiveId}`, { progress: newProgress }).catch(() => {});
  },

  addKeyResult: async (objectiveId, data) => {
    const kr = await api.post<KeyResult>(`/okr/objectives/${objectiveId}/key-results`, data);
    set(s => ({
      objectives: s.objectives.map(o =>
        o.id !== objectiveId ? o : { ...o, keyResults: [...(o.keyResults ?? []), kr] }
      ),
    }));
    return kr;
  },

  updateKeyResult: async (objectiveId, krId, data) => {
    const updated = await api.patch<KeyResult>(`/okr/objectives/${objectiveId}/key-results`, { krId, ...data });
    set(s => ({
      objectives: s.objectives.map(o =>
        o.id !== objectiveId ? o : {
          ...o,
          keyResults: (o.keyResults ?? []).map(kr => kr.id === krId ? { ...kr, ...updated } : kr),
        }
      ),
    }));
  },

  deleteKeyResult: async (objectiveId, krId) => {
    await api.delete(`/okr/objectives/${objectiveId}/key-results/${krId}`);
    set(s => ({
      objectives: s.objectives.map(o =>
        o.id !== objectiveId ? o : {
          ...o,
          keyResults: (o.keyResults ?? []).filter(kr => kr.id !== krId),
        }
      ),
    }));
  },

  setMilestones: (objectiveId, milestones) => {
    set(s => ({
      milestones: [...s.milestones.filter(m => m.objectiveId !== objectiveId), ...milestones],
    }));
  },

  updateMilestoneActual: (milestoneId, actual) => {
    set(s => ({
      milestones: s.milestones.map(m => {
        if (m.id !== milestoneId) return m;
        const delta = m.targetValue > 0 ? (m.targetValue - actual) / m.targetValue : 0;
        const cfg = s.projectionConfigs.find(c => c.objectiveId === m.objectiveId);
        const threshold = cfg?.alertThreshold ?? 0.15;
        let status: MilestoneStatus = actual >= m.targetValue ? "hit" : delta > threshold ? "missed" : "at_risk";
        if (new Date(m.targetDate) > new Date()) status = actual >= m.targetValue ? "hit" : delta > threshold ? "at_risk" : "pending";
        return { ...m, actualValue: actual, status };
      }),
    }));
  },

  saveProjectionConfig: async (cfg) => {
    try {
      if (cfg.id) {
        const updated = await api.patch<ProjectionConfig>(`/okr/projections/${cfg.id}`, {
          baseline: cfg.baseline, goal: cfg.goal, unit: cfg.unit,
          endDate: cfg.endDate, alertThreshold: cfg.alertThreshold,
          model: cfg.progression,
        });
        set(s => ({ projectionConfigs: s.projectionConfigs.map(c => c.objectiveId === cfg.objectiveId ? { ...c, ...updated } : c) }));
      } else {
        const created = await api.post<ProjectionConfig>("/okr/projections", {
          objectiveId: cfg.objectiveId,
          name: `Proyección ${cfg.objectiveId}`,
          model: cfg.progression,
          baseline: cfg.baseline, goal: cfg.goal, unit: cfg.unit,
          startDate: new Date().toISOString().split("T")[0],
          endDate: cfg.endDate, alertThreshold: cfg.alertThreshold,
          autoGenerate: cfg.autoGenerateMilestones,
        });
        set(s => ({ projectionConfigs: [...s.projectionConfigs.filter(c => c.objectiveId !== cfg.objectiveId), created] }));
      }
    } catch {
      // Non-fatal — keep local state
    }
  },

  deleteProjectionConfig: async (objectiveId) => {
    const cfg = get().projectionConfigs.find(c => c.objectiveId === objectiveId);
    if (cfg?.id) await api.delete(`/okr/projections/${cfg.id}`).catch(() => {});
    set(s => ({ projectionConfigs: s.projectionConfigs.filter(c => c.objectiveId !== objectiveId) }));
  },
}));
