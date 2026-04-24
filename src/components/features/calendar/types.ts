export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  type: string;
  category: string | null;
  color: string | null;
  icon: string | null;
  location: string | null;
  groupId: string | null;
  recurrence: string | null;
  recurrenceEnd: string | null;
  reminderMinutes: number | null;
  sourceModule: string | null;
  sourceId: string | null;
  completed: boolean;
};

export type CalendarGroup = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  visible: boolean;
  sortOrder: number;
};

export type DayAgenda = {
  date: string;
  events: CalendarEvent[];
  dailyPlan: {
    topPriorities: string[];
    rating: number | null;
    notes: string | null;
    timeBlocks: Array<{
      id: string;
      startTime: number;
      endTime: number;
      title: string;
      category: string | null;
      completed: boolean;
    }>;
  };
  agenda: {
    workouts: Array<{
      id: string;
      type: "workout";
      title: string;
      durationMinutes: number;
      completed: boolean;
      totalVolume: number;
      prsHit: number;
    }>;
    meals: Array<{
      id: string;
      type: "meal";
      mealType: "breakfast" | "lunch" | "dinner" | "snack";
      itemCount: number;
      calories: number;
    }>;
    focus: Array<{
      id: string;
      type: "focus";
      task: string | null;
      startedAt: string;
      endedAt: string | null;
      plannedMinutes: number;
      actualMinutes: number | null;
      active: boolean;
    }>;
    fasting: {
      id: string;
      type: "fasting";
      startedAt: string;
      endedAt: string | null;
      targetHours: number;
      protocol: string | null;
      active: boolean;
    } | null;
    habits: Array<{
      id: string;
      type: "habit";
      name: string;
      icon: string | null;
      streak: number;
      completed: boolean;
    }>;
    cycle: { name: string; emoji: string; day: number } | null;
  };
};

export const TYPE_META: Record<
  string,
  { label: string; emoji: string; colorClass: string; bgClass: string }
> = {
  custom:      { label: "Custom",       emoji: "📌", colorClass: "text-brand-medium", bgClass: "bg-brand-medium/10 border-brand-medium/30" },
  meeting:     { label: "Reunión",      emoji: "💼", colorClass: "text-info",         bgClass: "bg-info/10 border-info/30" },
  appointment: { label: "Cita",         emoji: "🗓️", colorClass: "text-danger",       bgClass: "bg-danger/10 border-danger/30" },
  personal:    { label: "Personal",     emoji: "🧘", colorClass: "text-accent",       bgClass: "bg-accent/10 border-accent/30" },
  health:      { label: "Salud",        emoji: "🏥", colorClass: "text-success",      bgClass: "bg-success/10 border-success/30" },
  travel:      { label: "Viaje",        emoji: "✈️", colorClass: "text-warning",      bgClass: "bg-warning/10 border-warning/30" },
  social:      { label: "Social",       emoji: "🎉", colorClass: "text-accent-light", bgClass: "bg-accent-light/10 border-accent-light/30" },
  work:        { label: "Trabajo",      emoji: "💻", colorClass: "text-info",         bgClass: "bg-info/10 border-info/30" },
  study:       { label: "Estudio",      emoji: "📚", colorClass: "text-brand-medium", bgClass: "bg-brand-medium/10 border-brand-medium/30" },
};
