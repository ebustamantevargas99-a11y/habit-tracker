"use client";
import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ObjType = "yearly" | "quarterly" | "monthly" | "milestone";
export type MilestoneStatus = "pending" | "hit" | "missed" | "at_risk";
export type ProjectionType = "logarithmic" | "linear" | "block_periodization";

export interface Objective {
  id: string;
  title: string;
  type: ObjType;
  parentId: string | null;
  startDate: string;
  endDate: string;
  targetValue: number;
  unit: string;          // '%', 'km', 'kg', 'tasks', etc.
  progress: number;      // 0-100, auto-calculated from kanban
  color: string;
  emoji: string;
  userId?: string;
}

export interface Milestone {
  id: string;
  objectiveId: string;
  habitId?: string;
  weekNumber: number;
  targetDate: string;
  targetValue: number;
  actualValue: number;
  status: MilestoneStatus;
  recalculated: boolean;
}

export interface ProjectionConfig {
  objectiveId: string;
  baseline: number;
  goal: number;
  unit: string;
  endDate: string;
  progression: ProjectionType;
  alertThreshold: number;   // fraction (0.15 = 15% behind triggers at_risk)
  autoGenerateMilestones: boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface OKRState {
  objectives: Objective[];
  milestones: Milestone[];
  projectionConfigs: ProjectionConfig[];

  // Objectives CRUD
  addObjective: (obj: Omit<Objective, "id" | "progress">) => string;
  updateObjective: (id: string, updates: Partial<Objective>) => void;
  deleteObjective: (id: string) => void;

  // Progress (called by Kanban when a card is completed/uncompleted)
  recalcObjectiveProgress: (objectiveId: string, cards: { objectiveId: string; weight: number; done: boolean }[]) => void;

  // Milestones
  setMilestones: (objectiveId: string, milestones: Milestone[]) => void;
  updateMilestoneActual: (milestoneId: string, actual: number) => void;

  // Projection configs
  saveProjectionConfig: (cfg: ProjectionConfig) => void;
  deleteProjectionConfig: (objectiveId: string) => void;
}

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE_OBJECTIVES: Objective[] = [
  { id: "obj_yr_2026",   title: "Año de Alto Rendimiento 2026", type: "yearly",     parentId: null,         startDate: "2026-01-01", endDate: "2026-12-31", targetValue: 100, unit: "%",    progress: 42, color: "#B8860B", emoji: "🏆" },
  { id: "obj_q2_2026",   title: "Q2: Lanzar MVP + Fitness",     type: "quarterly",  parentId: "obj_yr_2026", startDate: "2026-04-01", endDate: "2026-06-30", targetValue: 100, unit: "%",    progress: 55, color: "#5A8FA8", emoji: "🚀" },
  { id: "obj_apr_run",   title: "Correr 8km sin parar",         type: "monthly",    parentId: "obj_q2_2026", startDate: "2026-04-01", endDate: "2026-04-30", targetValue: 8,   unit: "km",   progress: 37, color: "#7A9E3E", emoji: "🏃" },
  { id: "obj_apr_mvp",   title: "Lanzar MVP Inmobiliaria",      type: "monthly",    parentId: "obj_q2_2026", startDate: "2026-04-01", endDate: "2026-04-30", targetValue: 100, unit: "%",    progress: 60, color: "#D4943A", emoji: "🏗️" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function saveLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─── Store implementation ─────────────────────────────────────────────────────
export const useOKRStore = create<OKRState>((set, get) => ({
  objectives:        loadLS("okr_objectives",        SAMPLE_OBJECTIVES),
  milestones:        loadLS("okr_milestones",        []),
  projectionConfigs: loadLS("okr_projection_configs", []),

  addObjective: (obj) => {
    const id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newObj: Objective = { ...obj, id, progress: 0 };
    set(s => {
      const next = [...s.objectives, newObj];
      saveLS("okr_objectives", next);
      return { objectives: next };
    });
    return id;
  },

  updateObjective: (id, updates) => set(s => {
    const next = s.objectives.map(o => o.id === id ? { ...o, ...updates } : o);
    saveLS("okr_objectives", next);
    return { objectives: next };
  }),

  deleteObjective: (id) => set(s => {
    // Cascade: delete children and their milestones
    const toDelete = new Set<string>();
    const collect = (pid: string) => {
      toDelete.add(pid);
      s.objectives.filter(o => o.parentId === pid).forEach(c => collect(c.id));
    };
    collect(id);
    const nextObjs = s.objectives.filter(o => !toDelete.has(o.id));
    const nextMil  = s.milestones.filter(m => !toDelete.has(m.objectiveId));
    const nextCfg  = s.projectionConfigs.filter(c => !toDelete.has(c.objectiveId));
    saveLS("okr_objectives", nextObjs);
    saveLS("okr_milestones", nextMil);
    saveLS("okr_projection_configs", nextCfg);
    return { objectives: nextObjs, milestones: nextMil, projectionConfigs: nextCfg };
  }),

  recalcObjectiveProgress: (objectiveId, cards) => {
    const relevant = cards.filter(c => c.objectiveId === objectiveId);
    const total = relevant.reduce((s, c) => s + c.weight, 0);
    if (total === 0) return;
    const done = relevant.filter(c => c.done).reduce((s, c) => s + c.weight, 0);
    const newProgress = Math.round((done / total) * 100);

    set(s => {
      let nextObjs = s.objectives.map(o =>
        o.id === objectiveId ? { ...o, progress: newProgress } : o
      );
      // Propagate to parent
      const current = nextObjs.find(o => o.id === objectiveId);
      if (current?.parentId) {
        const siblings = nextObjs.filter(o => o.parentId === current.parentId);
        const avgParent = Math.round(siblings.reduce((acc, o) => acc + o.progress, 0) / siblings.length);
        nextObjs = nextObjs.map(o => o.id === current.parentId ? { ...o, progress: avgParent } : o);
        // Propagate grandparent
        const parent = nextObjs.find(o => o.id === current.parentId);
        if (parent?.parentId) {
          const uncles = nextObjs.filter(o => o.parentId === parent.parentId);
          const avgGrand = Math.round(uncles.reduce((acc, o) => acc + o.progress, 0) / uncles.length);
          nextObjs = nextObjs.map(o => o.id === parent.parentId ? { ...o, progress: avgGrand } : o);
        }
      }
      saveLS("okr_objectives", nextObjs);
      return { objectives: nextObjs };
    });
  },

  setMilestones: (objectiveId, milestones) => set(s => {
    const next = [...s.milestones.filter(m => m.objectiveId !== objectiveId), ...milestones];
    saveLS("okr_milestones", next);
    return { milestones: next };
  }),

  updateMilestoneActual: (milestoneId, actual) => set(s => {
    const next = s.milestones.map(m => {
      if (m.id !== milestoneId) return m;
      const delta = m.targetValue > 0 ? (m.targetValue - actual) / m.targetValue : 0;
      const cfg = s.projectionConfigs.find(c => c.objectiveId === m.objectiveId);
      const threshold = cfg?.alertThreshold ?? 0.15;
      let status: MilestoneStatus = actual >= m.targetValue ? "hit" : delta > threshold ? "missed" : "at_risk";
      if (new Date(m.targetDate) > new Date()) status = actual >= m.targetValue ? "hit" : delta > threshold ? "at_risk" : "pending";
      return { ...m, actualValue: actual, status };
    });
    saveLS("okr_milestones", next);
    return { milestones: next };
  }),

  saveProjectionConfig: (cfg) => set(s => {
    const next = [...s.projectionConfigs.filter(c => c.objectiveId !== cfg.objectiveId), cfg];
    saveLS("okr_projection_configs", next);
    return { projectionConfigs: next };
  }),

  deleteProjectionConfig: (objectiveId) => set(s => {
    const next = s.projectionConfigs.filter(c => c.objectiveId !== objectiveId);
    saveLS("okr_projection_configs", next);
    return { projectionConfigs: next };
  }),
}));
