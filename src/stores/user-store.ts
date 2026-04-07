import { create } from "zustand";
import { api } from "@/lib/api-client";

interface UserProfile {
  id: string;
  userId: string;
  bio: string | null;
  timezone: string;
  units: string;
  language: string;
  theme: string;
  weekStartsOn: number;
  stepsGoal: number;
  waterGoal: number;
  sleepGoal: number;
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
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoaded: false,
  isSaving: false,

  initialize: async () => {
    if (get().isLoaded) return;
    try {
      const user = await api.get<UserData>("/user/profile");
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
      set({ user: updated, isSaving: false });
    } catch (e) {
      set({ isSaving: false });
      throw e;
    }
  },
}));
