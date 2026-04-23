import { create } from "zustand";
import { api } from "@/lib/api-client";
import { CORE_MODULES, type ModuleKey } from "@/lib/onboarding-constants";

// ModuleKeys válidos actualmente (post-eliminación Bienestar + LifeOS).
// Cualquier key en el profile que no esté aquí se filtra al cargar —
// legacy leak de wellness (mood/sleep/hydration/medications), journal,
// pregnancy, projects, fasting, planner dup, etc.
const VALID_MODULE_KEYS = new Set<ModuleKey>([
  "home", "habits", "tasks", "settings", "gamification",
  "fitness", "nutrition", "finance", "planner",
  "meditation", "reading", "menstrualCycle", "organization",
]);

function sanitizeModules(list: string[] | null | undefined): ModuleKey[] {
  if (!Array.isArray(list)) return [];
  const out: ModuleKey[] = [];
  for (const k of list) {
    if (VALID_MODULE_KEYS.has(k as ModuleKey)) out.push(k as ModuleKey);
  }
  return out;
}

interface UserProfile {
  id: string;
  userId: string;
  bio: string | null;
  timezone: string;
  units: string;
  language: string;
  theme: string;
  darkMode: boolean;
  weekStartsOn: number;
  stepsGoal: number;
  waterGoal: number;
  sleepGoal: number;
  onboardingCompleted: boolean;
  birthDate: string | null;
  biologicalSex: string | null;
  gender: string | null;
  pronouns: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: string | null;
  fitnessLevel: string | null;
  interests: string[];
  enabledModules: string[];
  primaryGoals: string[];
  conditions: string[];
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  profile: UserProfile | null;
}

interface UserState {
  user: UserData | null;
  isLoaded: boolean;
  isSaving: boolean;

  initialize: () => Promise<void>;
  saveProfile: (data: Partial<UserData & UserProfile>) => Promise<void>;
  setEnabledModules: (modules: ModuleKey[]) => Promise<void>;
  isModuleEnabled: (key: ModuleKey) => boolean;
  setDarkMode: (enabled: boolean) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoaded: false,
  isSaving: false,

  initialize: async () => {
    if (get().isLoaded) return;
    try {
      const user = await api.get<UserData>("/user/profile");
      // Sanitiza enabledModules para descartar keys legacy de módulos
      // eliminados (mood/sleep/etc). Evita que el sidebar intente
      // renderear páginas que ya no existen.
      if (user?.profile?.enabledModules) {
        user.profile.enabledModules = sanitizeModules(user.profile.enabledModules);
      }
      set({ user, isLoaded: true });
    } catch {
      // non-critical
    }
  },

  saveProfile: async (data) => {
    set({ isSaving: true });
    try {
      await api.patch("/user/profile", data);
      const updated = await api.get<UserData>("/user/profile");
      if (updated?.profile?.enabledModules) {
        updated.profile.enabledModules = sanitizeModules(updated.profile.enabledModules);
      }
      set({ user: updated, isSaving: false });
    } catch (e) {
      set({ isSaving: false });
      throw e;
    }
  },

  setEnabledModules: async (modules) => {
    // Filtra legacy + merge con CORE_MODULES. Garantiza que el server
    // no reciba keys obsoletas.
    const clean = sanitizeModules(modules);
    const merged = Array.from(
      new Set<ModuleKey>([...CORE_MODULES, ...clean]),
    );
    set({ isSaving: true });
    try {
      await api.put("/user/enabled-modules", { enabledModules: merged });
      const u = get().user;
      if (u && u.profile) {
        set({
          user: { ...u, profile: { ...u.profile, enabledModules: merged } },
          isSaving: false,
        });
      } else {
        set({ isSaving: false });
      }
    } catch (e) {
      set({ isSaving: false });
      throw e;
    }
  },

  isModuleEnabled: (key) => {
    if (CORE_MODULES.includes(key)) return true;
    const state = get();
    // Optimistic UI: mientras el perfil no se carga, mostrar todo.
    // Previene flash de sidebar vacío después del login.
    if (!state.isLoaded) return true;
    const modules = state.user?.profile?.enabledModules ?? [];
    return modules.includes(key);
  },

  setDarkMode: async (enabled) => {
    await get().saveProfile({ darkMode: enabled });
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", enabled);
    }
  },
}));
