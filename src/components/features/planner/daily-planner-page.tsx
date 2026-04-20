'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/components/ui';
import { useAppStore } from '@/stores/app-store';
import CalendarTab from './calendar-tab';
import { usePlannerStore, hourToTime } from '@/stores/planner-store';
import { useHabitStore } from '@/stores/habit-store';
import { useUserStore } from '@/stores/user-store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Circle } from 'lucide-react';

const C = {
  lightCream: "#F5EDE3", lightTan: "#D4BEA0", cream: "#EDE0D4", tan: "#C4A882",
  warmWhite: "#FAF7F3", accent: "#B8860B",
};

// ── Category color classes for time blocks ────────────────────────────────────
function getCategoryClass(category: string): string {
  const map: Record<string, string> = {
    'Trabajo':   'bg-[#4A90E2]',
    'Personal':  'bg-[#7AC943]',
    'Ejercicio': 'bg-[#F5A623]',
    'Descanso':  'bg-[#A8A8A8]',
  };
  return map[category] || 'bg-[#999]';
}

// ── Shared style constants ─────────────────────────────────────────────────────
const CARD   = "bg-brand-light-cream border-2 border-brand-tan rounded-[12px] p-6";
const CARD_W = "bg-brand-warm-white border-2 border-brand-light-tan rounded-[12px] p-6";
const CARD_P = "bg-brand-paper border border-brand-tan rounded-[8px] p-3";

// ── Interfaces ────────────────────────────────────────────────────────────────
interface TimeBlock {
  id: string; title: string; startHour: number; duration: number;
  category: 'Trabajo' | 'Personal' | 'Ejercicio' | 'Descanso';
}
interface Priority   { id: string; title: string; completed: boolean; }
interface WeeklyTask { id: string; title: string; day: number; completed: boolean; }
interface WeeklyObjective { id: string; title: string; }
interface MonthlyGoal     { id: string; title: string; }
interface QuarterlyOKR {
  objective: string;
  keyResults: Array<{ id: string; title: string; progress: number }>;
}
interface AnnualGoal { id: string; month: number; title: string; }

// ============= DAILY PLANNER TAB =============
const DailyPlannerTab = () => {
  const { savePlan, isSaving } = usePlannerStore();
  const { habits, logs } = useHabitStore();

  const [priorities, setPriorities] = useState<Priority[]>([
    { id: '1', title: 'Completar proyecto de análisis financiero', completed: false },
    { id: '2', title: 'Reunión con equipo a las 14:00',            completed: false },
    { id: '3', title: 'Ejercicio y meditación por la mañana',      completed: false },
  ]);

  const [blocks, setBlocks] = useState<TimeBlock[]>([
    { id: '1', title: 'Meditación',         startHour: 6,    duration: 1,   category: 'Personal'  },
    { id: '2', title: 'Ejercicio',           startHour: 7,    duration: 1.5, category: 'Ejercicio' },
    { id: '3', title: 'Desayuno y lectura',  startHour: 8.5,  duration: 1,   category: 'Personal'  },
    { id: '4', title: 'Trabajo - Proyecto A',startHour: 9.5,  duration: 3,   category: 'Trabajo'   },
    { id: '5', title: 'Almuerzo',            startHour: 12.5, duration: 1,   category: 'Personal'  },
    { id: '6', title: 'Reunión equipo',      startHour: 14,   duration: 1,   category: 'Trabajo'   },
    { id: '7', title: 'Trabajo - Proyecto B',startHour: 15,   duration: 2,   category: 'Trabajo'   },
    { id: '8', title: 'Tiempo libre',        startHour: 17,   duration: 1,   category: 'Descanso'  },
  ]);

  const [rating, setRating] = useState(8);
  const [notes,  setNotes]  = useState('');

  const handleSavePlan = async () => {
    const today = new Date().toISOString().split('T')[0];
    await savePlan({
      date: today,
      topPriorities: priorities.map(p => p.title),
      timeBlocks: blocks.map(b => ({
        startTime: hourToTime(b.startHour), endTime: hourToTime(b.startHour + b.duration),
        title: b.title, category: b.category, completed: false,
      })),
      rating, notes,
    });
    alert('¡Plan del día guardado!');
  };

  const hours   = Array.from({ length: 18 }, (_, i) => i + 6);
  const today   = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const updatePriority = (id: string, updates: Partial<Priority>) =>
    setPriorities(priorities.map(p => p.id === id ? { ...p, ...updates } : p));

  const getBlocksForHour = (hour: number) =>
    blocks.filter(b => b.startHour <= hour && b.startHour + b.duration > hour);

  const completedPriorities = priorities.filter(p => p.completed).length;
  const dailyProgress = Math.round((completedPriorities / priorities.length) * 100);
  const totalHours    = blocks.reduce((sum, b) => sum + b.duration, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDow = new Date().getDay();
  const todayHabits = habits.filter(h => {
    if (h.isActive === false) return false;
    if (h.frequency === 'daily') return true;
    if (!Array.isArray(h.targetDays) || h.targetDays.length === 0) return true;
    return h.targetDays.includes(todayDow);
  });
  const todayLogs         = logs.filter(l => l.date === todayStr);
  const completedHabitIds = new Set(todayLogs.filter(l => l.completed).map(l => l.habitId));
  const completedHabitsCount = todayHabits.filter(h => completedHabitIds.has(h.id)).length;

  return (
    <div className="grid grid-cols-[1fr_320px] gap-8">
      <div>
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-[1.8rem] font-serif font-normal text-brand-dark mb-2 mt-0">
            Planificador Diario
          </h2>
          <p className="text-[1rem] text-brand-warm m-0 capitalize">{dateStr}</p>
        </div>

        {/* Top 3 Priorities */}
        <div className={cn(CARD, "mb-8")}>
          <h3 className="text-[1.2rem] font-serif font-normal text-brand-dark mb-4 mt-0">
            🎯 Top 3 Prioridades
          </h3>
          <div className="flex flex-col gap-3">
            {priorities.map(priority => (
              <div key={priority.id} className="flex gap-3 items-center">
                <input
                  type="checkbox"
                  checked={priority.completed}
                  onChange={e => updatePriority(priority.id, { completed: e.target.checked })}
                  className="w-5 h-5 cursor-pointer accent-accent"
                />
                <input
                  type="text"
                  value={priority.title}
                  onChange={e => updatePriority(priority.id, { title: e.target.value })}
                  className={cn(
                    "flex-1 px-3 py-2 border border-brand-tan rounded-[6px] text-brand-dark text-[0.95rem] font-[inherit]",
                    priority.completed ? "bg-brand-cream line-through" : "bg-brand-paper"
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Hábitos de Hoy */}
        <div className={cn(CARD_W, "mb-8")}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[1.2rem] font-serif font-normal text-brand-dark m-0">
              ✅ Hábitos de Hoy
            </h3>
            <span className={cn(
              "rounded-[20px] px-3 py-1 text-[0.85rem] font-bold",
              completedHabitsCount === todayHabits.length && todayHabits.length > 0
                ? "bg-success-light text-success"
                : "bg-accent-glow text-accent"
            )}>
              {completedHabitsCount}/{todayHabits.length}
            </span>
          </div>
          {todayHabits.length === 0 ? (
            <p className="text-brand-warm text-[0.9rem] text-center py-4 m-0">
              No tienes hábitos programados para hoy
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {todayHabits.map(habit => {
                const done = completedHabitIds.has(habit.id);
                return (
                  <div key={habit.id} className={cn(
                    "flex items-center gap-3 border-2 rounded-[10px] px-4 py-3",
                    done ? "bg-success-light border-success" : "bg-brand-paper border-brand-tan"
                  )}>
                    <span className="text-[1.3rem] shrink-0">{habit.icon || '⭐'}</span>
                    <div className="flex-1">
                      <p className="m-0 text-[0.95rem] font-semibold text-brand-dark">{habit.name}</p>
                      <p className="m-0 text-[0.75rem] text-brand-warm">{habit.category} · Racha: {habit.streakCurrent} días</p>
                    </div>
                    <span className={cn(
                      "text-[0.75rem] font-bold px-[0.6rem] py-1 rounded-[20px]",
                      done ? "bg-success text-brand-paper" : "bg-brand-light-tan text-brand-warm"
                    )}>
                      {done ? '✓ Hecho' : 'Pendiente'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {todayHabits.length > 0 && (
            <div className="mt-4">
              <div className="h-[6px] bg-brand-light-tan rounded-[3px] overflow-hidden">
                <div
                  className={cn("h-full rounded-[3px] transition-[width] duration-[400ms]", completedHabitsCount === todayHabits.length ? "bg-success" : "bg-accent")}
                  style={{ width: `${todayHabits.length > 0 ? (completedHabitsCount / todayHabits.length) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[0.8rem] text-brand-warm mt-1 mb-0 text-right">
                {todayHabits.length > 0 ? Math.round((completedHabitsCount / todayHabits.length) * 100) : 0}% completado
              </p>
            </div>
          )}
        </div>

        {/* Time Blocking Grid */}
        <div className={cn(CARD_W, "mb-8")}>
          <h3 className="text-[1.2rem] font-serif font-normal text-brand-dark mb-4 mt-0">
            ⏰ Bloques de Tiempo (6am - 11pm)
          </h3>
          <div className="grid grid-cols-[70px_1fr] gap-3">
            {hours.map(hour => (
              <div key={hour} className="contents">
                <div className="flex items-center justify-center text-[0.9rem] font-semibold text-brand-warm p-2 min-h-[50px]">
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div className="flex gap-2 items-stretch min-h-[50px] bg-brand-paper rounded-[8px] p-2 border border-brand-light-tan">
                  {getBlocksForHour(hour).map(block => (
                    <div
                      key={block.id}
                      className={cn("rounded-[6px] p-2 text-white cursor-pointer opacity-85 flex flex-col justify-center", getCategoryClass(block.category))}
                      style={{ flex: block.duration }}
                    >
                      <p className="text-[0.8rem] font-semibold mb-[0.2rem] mt-0">{block.title}</p>
                      <p className="text-[0.7rem] m-0 opacity-90">{block.duration}h</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Day Rating & Notes */}
        <div className={CARD}>
          <h3 className="text-[1.2rem] font-serif font-normal text-brand-dark mb-4 mt-0">
            ⭐ Calificación & Notas
          </h3>
          <div className="mb-6">
            <p className="text-[0.9rem] text-brand-warm mb-3 mt-0">¿Cómo fue tu día?</p>
            <div className="flex justify-around mb-4">
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <button
                  key={num}
                  onClick={() => setRating(num)}
                  className={cn(
                    "text-[1.8rem] border-2 rounded-full w-[45px] h-[45px] cursor-pointer transition-all",
                    rating === num ? "bg-accent-glow border-accent" : "bg-transparent border-brand-tan"
                  )}
                >
                  {num <= 2 ? '😢' : num <= 4 ? '😕' : num <= 6 ? '😐' : num <= 8 ? '😊' : '😄'}
                </button>
              ))}
            </div>
            <p className="text-center text-[0.95rem] text-brand-dark font-semibold m-0">
              Calificación: {rating}/10
            </p>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notas del día..."
            className="w-full px-3 py-3 border border-brand-tan rounded-[6px] bg-brand-paper text-brand-dark text-[0.95rem] font-[inherit] min-h-[100px] resize-none box-border"
          />
        </div>
      </div>

      {/* Sidebar Stats */}
      <div>
        <div className={cn(CARD, "mb-4")}>
          <h3 className="text-[0.95rem] font-serif font-normal text-brand-dark mb-4 mt-0 text-center">
            Estadísticas
          </h3>
          <div className="flex flex-col gap-3">
            <div className="bg-success-light rounded-[8px] p-3 text-center">
              <p className="text-[0.8rem] text-brand-dark mt-0 mb-1">Progreso del Día</p>
              <p className="text-[1.6rem] font-bold text-success m-0">{dailyProgress}%</p>
            </div>
            <div className="bg-info-light rounded-[8px] p-3 text-center">
              <p className="text-[0.8rem] text-brand-dark mt-0 mb-1">Total Horas</p>
              <p className="text-[1.6rem] font-bold text-info m-0">{totalHours.toFixed(1)}h</p>
            </div>
            <div className="bg-warning-light rounded-[8px] p-3 text-center">
              <p className="text-[0.8rem] text-brand-dark mt-0 mb-1">Prioridades</p>
              <p className="text-[1.6rem] font-bold text-warning m-0">{completedPriorities}/3</p>
            </div>
            <div className="bg-brand-light-tan rounded-[8px] p-3 text-center">
              <p className="text-[0.8rem] text-brand-dark mt-0 mb-1">Hábitos Hoy</p>
              <p className="text-[1.6rem] font-bold text-brand-brown m-0">{completedHabitsCount}/{todayHabits.length}</p>
            </div>
          </div>
        </div>
        <button
          className={cn(
            "w-full bg-accent text-brand-paper border-none rounded-[8px] py-3 text-[0.95rem] font-semibold transition-opacity",
            isSaving ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          )}
          onClick={handleSavePlan}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar Día'}
        </button>
      </div>
    </div>
  );
};

// ============= WEEKLY PLANNER TAB =============
const WeeklyPlannerTab = () => {
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([
    { id: '1', title: 'Presentación proyecto',         day: 0, completed: true  },
    { id: '2', title: 'Revisar reportes',               day: 1, completed: false },
    { id: '3', title: 'Entregar análisis',              day: 2, completed: false },
    { id: '4', title: 'Planificación siguiente semana', day: 4, completed: false },
    { id: '5', title: 'Sesión de mentoría',             day: 3, completed: false },
    { id: '6', title: 'Ejercicio intenso',              day: 2, completed: true  },
    { id: '7', title: 'Lectura de desarrollo',          day: 5, completed: false },
  ]);

  const [weeklyObjectives] = useState<WeeklyObjective[]>([
    { id: '1', title: 'Completar proyecto de análisis de datos'  },
    { id: '2', title: 'Mejorar flujo de trabajo en equipo'        },
    { id: '3', title: 'Ejercitarse 4 veces en la semana'         },
    { id: '4', title: 'Leer 2 capítulos del libro'               },
    { id: '5', title: 'Preparar presentación de resultados'      },
  ]);

  const [weeklyScore] = useState(8.2);

  const days     = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const hoursData = [
    { category: 'Trabajo',   hours: 30 },
    { category: 'Personal',  hours: 10 },
    { category: 'Ejercicio', hours: 5  },
    { category: 'Descanso',  hours: 12 },
  ];

  const toggleTask = (id: string) =>
    setWeeklyTasks(weeklyTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  const tasksByDay = Array.from({ length: 7 }, (_, i) => weeklyTasks.filter(t => t.day === i));

  return (
    <div className="grid grid-cols-[1fr_300px] gap-8">
      <div>
        <h2 className="text-[1.8rem] font-serif font-normal text-brand-dark mb-6 mt-0">
          Planificador Semanal
        </h2>

        {/* Weekly Tasks Grid */}
        <div className={cn(CARD_W, "mb-8")}>
          <h3 className="text-[1.1rem] font-serif font-normal text-brand-dark mb-6 mt-0">
            📅 Tareas por Día
          </h3>
          <div className="grid grid-cols-7 gap-4">
            {days.map((day, idx) => (
              <div key={idx} className="bg-brand-light-cream border-2 border-brand-tan rounded-[10px] p-4">
                <h4 className="text-[0.95rem] font-bold text-brand-dark mb-4 mt-0 text-center">{day}</h4>
                <div className="flex flex-col gap-2">
                  {tasksByDay[idx].map(task => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "rounded-[6px] p-2 cursor-pointer text-[0.8rem] text-brand-dark text-left transition-all border",
                        task.completed
                          ? "bg-success-light border-success line-through"
                          : "bg-brand-paper border-brand-tan"
                      )}
                    >
                      {task.title}
                    </button>
                  ))}
                  {tasksByDay[idx].length === 0 && (
                    <p className="text-[0.75rem] text-brand-warm my-2 italic">Sin tareas</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Objectives */}
        <div className={cn(CARD, "mb-8")}>
          <h3 className="text-[1.1rem] font-serif font-normal text-brand-dark mb-4 mt-0">
            🎯 Objetivos Semanales
          </h3>
          <div className="flex flex-col gap-3">
            {weeklyObjectives.map(obj => (
              <div key={obj.id} className="bg-brand-paper border border-brand-tan rounded-[8px] p-3 flex gap-3 items-center">
                <Circle size={16} className="text-accent shrink-0" />
                <p className="m-0 text-brand-dark text-[0.95rem]">{obj.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hours by Category Chart */}
        <div className={CARD_W}>
          <h3 className="text-[1.1rem] font-serif font-normal text-brand-dark mb-4 mt-0">
            📊 Horas por Categoría
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lightTan} />
              <XAxis dataKey="category" stroke={C.tan} />
              <YAxis stroke={C.tan} />
              <Tooltip contentStyle={{ backgroundColor: C.lightCream, border: `1px solid ${C.tan}` }} />
              <Bar dataKey="hours" fill={C.accent} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Score */}
      <div>
        <div className={CARD}>
          <h3 className="text-[0.95rem] font-serif font-normal text-brand-dark mb-6 mt-0 text-center">
            Puntuación Semanal
          </h3>
          <div className="bg-accent-glow rounded-[12px] p-8 text-center mb-6">
            <p className="text-[3rem] font-bold text-accent m-0">{weeklyScore.toFixed(1)}</p>
            <p className="text-[0.9rem] text-brand-dark mt-2 mb-0">de 10</p>
          </div>
          <div className={CARD_P}>
            <p className="text-[0.85rem] text-brand-dark m-0">
              Excelente semana de productividad. Mantén el ritmo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= MONTHLY PLANNER TAB =============
const MonthlyPlannerTab = () => {
  const { habits, logs } = useHabitStore();
  const weekStartsOn = useUserStore(s => s.user?.profile?.weekStartsOn ?? 1);
  const [monthlyGoals] = useState<MonthlyGoal[]>([
    { id: '1', title: 'Completar curso de análisis avanzado' },
    { id: '2', title: 'Terminar proyecto principal'           },
    { id: '3', title: 'Leer 2 libros de desarrollo personal' },
  ]);

  const today = new Date();
  const month = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const getDaysInMonthLocal = () => new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysInMonth  = getDaysInMonthLocal();
  const rawFirstDay  = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const firstDay     = (rawFirstDay - weekStartsOn + 7) % 7;
  const ALL_DAYS     = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayLabels    = Array.from({ length: 7 }, (_, i) => ALL_DAYS[(weekStartsOn + i) % 7]);
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDay + 1;
    return dayNum > 0 && dayNum <= daysInMonth ? dayNum : null;
  });

  const getHabitRateForDay = (day: number): number => {
    const d       = new Date(today.getFullYear(), today.getMonth(), day);
    const dateStr = d.toISOString().split('T')[0];
    const dow     = d.getDay();
    const scheduled = habits.filter(h => {
      if (!h.isActive) return false;
      if (h.frequency === 'daily') return true;
      return Array.isArray(h.targetDays) && h.targetDays.includes(dow);
    });
    if (scheduled.length === 0) return -1;
    const dayLogs  = logs.filter(l => l.date === dateStr);
    const completed = scheduled.filter(h => dayLogs.some(l => l.habitId === h.id && l.completed)).length;
    return completed / scheduled.length;
  };

  const habitCompletionClass = (day: number | null): string => {
    if (day === null) return 'bg-transparent';
    if (day > today.getDate()) return 'bg-brand-paper';
    const rate = getHabitRateForDay(day);
    if (rate < 0)   return 'bg-brand-paper';
    if (rate === 0) return 'bg-danger-light';
    if (rate < 0.4) return 'bg-warning-light';
    if (rate < 0.7) return 'bg-info-light';
    if (rate < 1.0) return 'bg-success-light';
    return 'bg-accent-glow';
  };

  const monthPrefix   = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const monthLogs     = logs.filter(l => l.date.startsWith(monthPrefix) && l.completed);
  const distinctDaysWithCompletion = new Set(monthLogs.map(l => l.date)).size;

  const kpiCards = [
    { label: 'Días con Hábitos',    value: String(distinctDaysWithCompletion),                colorCls: 'text-success' },
    { label: 'Hábitos Completados', value: String(monthLogs.length),                          colorCls: 'text-info'    },
    { label: 'Hábitos Activos',     value: String(habits.filter(h => h.isActive).length),     colorCls: 'text-warning' },
    { label: 'Mejor Racha',         value: `${Math.max(0, ...habits.map(h => h.streakBest))}d`, colorCls: 'text-accent' },
  ];

  const legendItems = [
    { cls: 'bg-accent-glow',   label: '100% — Día perfecto'  },
    { cls: 'bg-success-light', label: '70–99% — Muy bien'    },
    { cls: 'bg-info-light',    label: '40–69% — En progreso' },
    { cls: 'bg-warning-light', label: '1–39% — Poco'         },
    { cls: 'bg-danger-light',  label: '0% — Sin completar'   },
    { cls: 'bg-brand-paper',   label: 'Sin hábitos ese día'  },
  ];

  return (
    <div>
      <h2 className="text-[1.8rem] font-serif font-normal text-brand-dark mb-6 mt-0">
        Planificador Mensual
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className="bg-brand-light-cream border-2 border-brand-tan rounded-[12px] p-6 text-center">
            <p className="text-[0.85rem] text-brand-warm mt-0 mb-2">{kpi.label}</p>
            <p className={cn("text-[2rem] font-bold m-0", kpi.colorCls)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-8">
        <div>
          {/* Calendar */}
          <div className={cn(CARD_W, "mb-8")}>
            <h3 className="text-[1.3rem] font-serif font-normal text-brand-dark mb-4 mt-0 text-center capitalize">
              {month}
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {dayLabels.map(day => (
                <div key={day} className="text-center font-bold text-brand-dark text-[0.85rem] p-2">{day}</div>
              ))}
              {calendarDays.map((day, idx) => {
                const isToday = day === today.getDate();
                const rate    = day ? getHabitRateForDay(day) : -1;
                return (
                  <div key={idx} className={cn(
                    "border-2 rounded-[8px] p-2 text-center min-h-[52px] flex flex-col items-center justify-center gap-[2px]",
                    habitCompletionClass(day),
                    isToday ? "border-accent" : "border-brand-light-tan",
                    day ? "cursor-pointer" : "cursor-default"
                  )}>
                    <span className={cn("text-[0.9rem]", isToday ? "font-bold text-accent" : "font-normal text-brand-dark")}>
                      {day}
                    </span>
                    {day && rate >= 0 && (
                      <span className="text-[0.65rem] text-brand-warm">{Math.round(rate * 100)}%</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Goals */}
          <div className={CARD}>
            <h3 className="text-[1.1rem] font-serif font-normal text-brand-dark mb-4 mt-0">
              🎯 Objetivos del Mes
            </h3>
            <div className="flex flex-col gap-3">
              {monthlyGoals.map(goal => (
                <div key={goal.id} className="bg-brand-paper border border-brand-tan rounded-[8px] p-3 flex gap-3 items-center">
                  <Circle size={16} className="text-accent shrink-0" />
                  <p className="m-0 text-brand-dark text-[0.95rem]">{goal.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div>
          <div className={cn(CARD, "mb-4")}>
            <h3 className="text-[0.95rem] font-serif font-normal text-brand-dark mb-6 mt-0 text-center">
              Resumen del Mes
            </h3>
            {(() => {
              const totalActiveHabits = habits.filter(h => h.isActive).length;
              const daysElapsed       = today.getDate();
              const possibleLogs      = totalActiveHabits * daysElapsed;
              const monthPct          = possibleLogs > 0 ? Math.round((monthLogs.length / possibleLogs) * 100) : 0;
              const bestStreak        = Math.max(0, ...habits.map(h => h.streakCurrent));
              const perfectDays       = Array.from({ length: daysElapsed }, (_, i) => i + 1).filter(d => getHabitRateForDay(d) >= 1).length;
              return (
                <>
                  <div className="bg-accent-glow rounded-[12px] p-6 text-center mb-4">
                    <p className="text-[0.85rem] text-brand-dark mt-0 mb-1">Tasa de Completación</p>
                    <p className="text-[2.5rem] font-bold text-accent m-0">{monthPct}%</p>
                  </div>
                  <div className="bg-success-light rounded-[8px] p-4 text-center mb-3">
                    <p className="text-[0.85rem] text-brand-dark mt-0 mb-1">Días Perfectos</p>
                    <p className="text-[1.8rem] font-bold text-success m-0">{perfectDays}/{daysElapsed}</p>
                  </div>
                  <div className="bg-info-light rounded-[8px] p-4 text-center mb-3">
                    <p className="text-[0.85rem] text-brand-dark mt-0 mb-1">Mejor Racha Activa</p>
                    <p className="text-[1.8rem] font-bold text-info m-0">{bestStreak} días</p>
                  </div>
                  <div className="bg-warning-light rounded-[8px] p-4 text-center">
                    <p className="text-[0.85rem] text-brand-dark mt-0 mb-1">Completados este mes</p>
                    <p className="text-[1.8rem] font-bold text-warning m-0">{monthLogs.length}</p>
                  </div>
                </>
              );
            })()}
          </div>
          {/* Legend */}
          <div className="bg-brand-warm-white border border-brand-light-tan rounded-[10px] p-4">
            <p className="text-[0.8rem] font-bold text-brand-dark mt-0 mb-3">Leyenda del calendario</p>
            {legendItems.map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-2 mb-[0.4rem]">
                <div className={cn("w-4 h-4 rounded-[4px] border border-brand-tan shrink-0", cls)} />
                <span className="text-[0.75rem] text-brand-warm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= QUARTERLY PLANNER TAB =============
const QuarterlyPlannerTab = () => {
  const [quarter] = useState(1);
  const [okrs] = useState<QuarterlyOKR>({
    objective: 'Escalar la productividad y completar el proyecto estratégico',
    keyResults: [
      { id: '1', title: 'Alcanzar 90% de tareas completadas',    progress: 78 },
      { id: '2', title: 'Completar 3 iteraciones del proyecto',  progress: 67 },
      { id: '3', title: 'Mejorar score de calidad a 9/10',       progress: 85 },
    ]
  });

  const [projects] = useState([
    { id: '1', title: 'Proyecto A: Análisis de Datos',         progress: 65, startDate: 'Ene', endDate: 'Mar' },
    { id: '2', title: 'Proyecto B: Integración de Sistemas',   progress: 45, startDate: 'Feb', endDate: 'Abr' },
    { id: '3', title: 'Proyecto C: Optimización',              progress: 82, startDate: 'Ene', endDate: 'Mar' },
  ]);

  const milestones = [
    { date: 'Ene 15', milestone: 'Validar requisitos y scope'    },
    { date: 'Feb 28', milestone: 'Completar fase de desarrollo'  },
    { date: 'Mar 20', milestone: 'QA y testing completo'         },
    { date: 'Mar 31', milestone: 'Lanzamiento y revisión'        },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[1.8rem] font-serif font-normal text-brand-dark m-0">
          Planificador Trimestral
        </h2>
        <div className="flex gap-4 items-center">
          <button className="bg-transparent border-2 border-accent rounded-[6px] px-3 py-2 cursor-pointer text-brand-dark font-semibold">
            Q{quarter}
          </button>
          <span className="text-[0.9rem] text-brand-warm">2026</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-8">
        <div>
          {/* OKRs Section */}
          <div className={cn(CARD, "mb-8")}>
            <h3 className="text-[1.2rem] font-serif font-normal text-brand-dark mb-4 mt-0">
              🎯 OKRs Trimestrales
            </h3>
            <div className={cn(CARD_P, "mb-6")}>
              <p className="text-[0.95rem] text-brand-dark m-0 font-semibold">{okrs.objective}</p>
            </div>
            <div className="flex flex-col gap-4">
              {okrs.keyResults.map(kr => (
                <div key={kr.id}>
                  <div className="flex justify-between mb-2">
                    <p className="text-[0.9rem] text-brand-dark m-0 font-medium">{kr.title}</p>
                    <p className="text-[0.9rem] text-accent m-0 font-bold">{kr.progress}%</p>
                  </div>
                  <div className="bg-brand-cream border border-brand-tan rounded-[8px] h-2 overflow-hidden">
                    <div className="bg-success h-full transition-[width] duration-300" style={{ width: `${kr.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className={cn(CARD_W, "mb-8")}>
            <h3 className="text-[1.2rem] font-serif font-normal text-brand-dark mb-4 mt-0">
              📋 Proyectos
            </h3>
            <div className="flex flex-col gap-5">
              {projects.map(proj => (
                <div key={proj.id} className="bg-brand-paper border border-brand-light-tan rounded-[8px] p-4">
                  <div className="flex justify-between mb-2">
                    <p className="text-[0.95rem] font-semibold text-brand-dark m-0">{proj.title}</p>
                    <span className="text-[0.8rem] text-brand-warm">{proj.startDate} - {proj.endDate}</span>
                  </div>
                  <div className="bg-brand-cream rounded-[6px] h-[6px] overflow-hidden mb-2">
                    <div className="bg-accent h-full" style={{ width: `${proj.progress}%` }} />
                  </div>
                  <p className="text-[0.85rem] text-brand-warm m-0 text-right">{proj.progress}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones Timeline */}
          <div className={CARD}>
            <h3 className="text-[1.2rem] font-serif font-normal text-brand-dark mb-6 mt-0">
              🗓️ Hitos Importantes
            </h3>
            <div className="flex flex-col gap-4">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-[3px] bg-accent rounded-[2px] shrink-0" />
                  <div>
                    <p className="text-[0.85rem] font-bold text-accent mb-1 mt-0">{m.date}</p>
                    <p className="text-[0.9rem] text-brand-dark m-0">{m.milestone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quarterly Review */}
        <div>
          <div className={CARD}>
            <h3 className="text-[0.95rem] font-serif font-normal text-brand-dark mb-6 mt-0 text-center">
              Revisión Trimestral
            </h3>
            <div className="bg-accent-glow rounded-[12px] p-6 text-center mb-6">
              <p className="text-[0.8rem] text-brand-dark mt-0 mb-2">Progreso Q{quarter}</p>
              <p className="text-[2.2rem] font-bold text-accent m-0">71%</p>
            </div>
            <div className={CARD_P}>
              <p className="text-[0.85rem] text-brand-dark m-0 leading-[1.5]">
                Buen progreso en OKRs. Mantén enfoque en completar iteraciones finales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= YEARLY PLANNER TAB =============
const YearlyPlannerTab = () => {
  const [yearlyGoals] = useState<AnnualGoal[]>([
    { id: '1',  month: 1,  title: 'Completar curso de especialización'  },
    { id: '2',  month: 2,  title: 'Lanzar nuevo proyecto'               },
    { id: '3',  month: 3,  title: 'Mejorar habilidades de liderazgo'    },
    { id: '4',  month: 4,  title: 'Alcanzar 10k de followers'           },
    { id: '5',  month: 5,  title: 'Escribir artículos de blog'          },
    { id: '6',  month: 6,  title: 'Completar transformación fitness'    },
    { id: '7',  month: 7,  title: 'Viaje de desarrollo personal'        },
    { id: '8',  month: 8,  title: 'Mentoría a 5 personas'              },
    { id: '9',  month: 9,  title: 'Publicar libro digital'              },
    { id: '10', month: 10, title: 'Expandir red profesional'            },
    { id: '11', month: 11, title: 'Revisión y planificación anual'      },
    { id: '12', month: 12, title: 'Celebrar logros del año'             },
  ]);

  const [yearlyTheme, setYearlyTheme] = useState('Transformación y Crecimiento');
  const months       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const monthProgress = [85, 92, 78, 65, 45, 32, 20, 15, 8, 5, 2, 0];

  const yearStats = [
    { label: 'Horas Productivas',    value: '1,847'   },
    { label: 'Metas Alcanzadas',     value: '34/36'   },
    { label: 'Lectura Anual',        value: '24 libros'},
    { label: 'Promedio Calificación',value: '8.2/10'  },
  ];

  return (
    <div>
      <h2 className="text-[1.8rem] font-serif font-normal text-brand-dark mb-6 mt-0">
        Planificador Anual - 2026
      </h2>

      <div className="grid grid-cols-[1fr_300px] gap-8">
        <div>
          {/* Yearly Theme */}
          <div className="bg-accent-glow border-2 border-accent rounded-[12px] p-8 mb-8 text-center">
            <p className="text-[0.95rem] text-brand-dark mt-0 mb-3">Tema del Año</p>
            <input
              type="text"
              value={yearlyTheme}
              onChange={e => setYearlyTheme(e.target.value)}
              className="text-[1.4rem] font-bold text-brand-dark bg-transparent border-none text-center w-full font-serif outline-none"
            />
          </div>

          {/* 12 Month Progress Bars */}
          <div className={cn(CARD_W, "mb-8")}>
            <h3 className="text-[1.1rem] font-serif font-normal text-brand-dark mb-6 mt-0">
              📊 Progreso Mensual
            </h3>
            <div className="grid grid-cols-6 gap-4">
              {months.map((month, idx) => (
                <div key={idx}>
                  <p className="text-[0.8rem] font-semibold text-brand-dark mt-0 mb-2 text-center">
                    {month.slice(0, 3)}
                  </p>
                  <div className="bg-brand-cream rounded-[6px] h-2 overflow-hidden mb-2">
                    <div className="bg-success h-full" style={{ width: `${monthProgress[idx]}%` }} />
                  </div>
                  <p className="text-[0.7rem] text-brand-warm m-0 text-center">{monthProgress[idx]}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* 12 Annual Goals */}
          <div className={CARD}>
            <h3 className="text-[1.1rem] font-serif font-normal text-brand-dark mb-6 mt-0">
              🎯 Metas Anuales (Una por Mes)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {yearlyGoals.map(goal => (
                <div key={goal.id} className="bg-brand-paper border border-brand-tan rounded-[8px] p-4">
                  <p className="text-[0.75rem] font-bold text-accent mt-0 mb-2">{months[goal.month - 1]}</p>
                  <p className="text-[0.9rem] text-brand-dark m-0">{goal.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Year Stats Sidebar */}
        <div>
          <div className={CARD}>
            <h3 className="text-[0.95rem] font-serif font-normal text-brand-dark mb-6 mt-0 text-center">
              Estadísticas Anuales
            </h3>
            <div className="flex flex-col gap-4">
              {yearStats.map((stat, idx) => (
                <div key={idx} className="bg-brand-paper border border-brand-tan rounded-[8px] p-4 text-center">
                  <p className="text-[0.8rem] text-brand-warm mt-0 mb-2">{stat.label}</p>
                  <p className="text-[1.4rem] font-bold text-accent m-0">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-accent-glow rounded-[8px] p-6 text-center mt-6">
              <p className="text-[0.85rem] text-brand-dark mt-0 mb-2">Alineación Visión</p>
              <p className="text-[2rem] font-bold text-accent m-0">94%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= MAIN COMPONENT =============
const DailyPlannerPage = () => {
  const { planTab, setPlanTab } = useAppStore();
  const activeTab    = planTab;
  const setActiveTab = (idx: number) => setPlanTab(idx as 0|1|2|3|4|5|6);

  const tabs = [
    { label: 'Calendar',           component: CalendarTab         },
    { label: 'Daily Planner',      component: DailyPlannerTab     },
    { label: 'Weekly Planner',     component: WeeklyPlannerTab    },
    { label: 'Monthly Planner',    component: MonthlyPlannerTab   },
    { label: 'Quarterly Planner',  component: QuarterlyPlannerTab },
    { label: 'Yearly Planner',     component: YearlyPlannerTab    },
  ];

  return (
    <div className="bg-brand-paper">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[2.5rem] font-serif font-normal text-brand-dark mb-2 mt-0">
          Plan / Planificador
        </h1>
        <p className="text-[1rem] text-brand-warm m-0">Gestiona tu tiempo en diferentes escalas</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b-2 border-brand-light-tan pb-2 overflow-x-auto">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={cn(
              "px-6 py-3 border-none cursor-pointer text-[0.95rem] font-semibold font-serif transition-all whitespace-nowrap",
              activeTab === idx
                ? "bg-accent text-brand-paper rounded-t-[8px]"
                : "bg-transparent text-brand-warm"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-brand-paper rounded-b-[12px]">
        {(() => { const ActiveTab = tabs[activeTab].component; return <ActiveTab />; })()}
      </div>
    </div>
  );
};

export default DailyPlannerPage;
