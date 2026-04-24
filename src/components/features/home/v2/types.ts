// Tipos compartidos por el dashboard Home v2.
// Mantén el shape estable — el hook use-home-v2-data devuelve exactamente esto.

export type HabitState =
  | "not_started"
  | "starting"
  | "forming"
  | "strengthening"
  | "near_rooted"
  | "rooted";

export interface HabitV2 {
  name: string;
  state: HabitState;
  streak: number;
  strength: number; // 0-100
}

export interface RadarData {
  categories: readonly string[];
  thisWeek: number[];
  lastWeek: number[];
}

export interface TimelineData {
  sleep: Array<{ start: number; end: number }>;      // minutos desde 06:00
  workouts: Array<{ start: number; end: number; label: string }>;
  meals: Array<{ at: number; label: string }>;
  focus: Array<{ start: number; end: number; label: string }>;
  events: Array<{ start: number; end: number; label: string }>;
}

export interface CompoundData {
  real: number[];
  best: number[];
  abandon: number[];
}

export interface EnabledModulesV2 {
  habits: boolean;
  tasks: boolean;
  settings: boolean;
  fitness: boolean;
  nutrition: boolean;
  finance: boolean;
  planner: boolean;
  menstrualCycle: boolean;
  reading: boolean;
}

export interface HomeV2Data {
  user: { name: string; startedAt: string };
  enabledModules: EnabledModulesV2;
  lifeScore: number;
  lifeScorePrev: number;
  habitsToday: { done: number; total: number; active: number; topStreak: number };
  fitness: { sessionsWeek: number; volumeKg: number; volumePrev: number };
  nutrition: { kcal: number; goal: number; protein: number; carbs: number; fat: number };
  finance: { savedMonth: number; pct: number; pctPrev: number };
  cycle: { day: number; phase: string; length: number };
  badge: { name: string; done: number; total: number };
  sparks: {
    lifeScore: number[];
    habits: number[];
    volume: number[];
    kcal: number[];
    saving: number[];
  };
  radar: RadarData;
  habits: HabitV2[];
  timeline: TimelineData;
  compound52: CompoundData;
  heatmap90: number[];
  /**
   * True cuando aún estamos cargando al menos una fuente remota
   * (life-score, calendar/day). Los componentes pueden elegir mostrar
   * placeholders; por ahora los números muestran 0 mientras cargan —
   * la UI lo absorbe bien porque las animaciones de count-up
   * arrancan desde 0 igualmente.
   */
  isLoading: boolean;
}
