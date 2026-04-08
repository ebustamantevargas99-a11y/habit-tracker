'use client';

import { useState } from 'react';
import { usePlannerStore, hourToTime } from '@/stores/planner-store';
import { useHabitStore } from '@/stores/habit-store';
import { useUserStore } from '@/stores/user-store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, Circle } from 'lucide-react';

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  warning: "#D4943A", warningLight: "#F5E0C0", danger: "#C0544F",
  dangerLight: "#F5D0CE", info: "#5A8FA8", infoLight: "#C8E0EC",
};

interface TimeBlock {
  id: string;
  title: string;
  startHour: number;
  duration: number;
  category: 'Trabajo' | 'Personal' | 'Ejercicio' | 'Descanso';
}

interface Priority {
  id: string;
  title: string;
  completed: boolean;
}

interface WeeklyTask {
  id: string;
  title: string;
  day: number;
  completed: boolean;
}

interface WeeklyObjective {
  id: string;
  title: string;
}

interface MonthlyGoal {
  id: string;
  title: string;
}

interface QuarterlyOKR {
  objective: string;
  keyResults: Array<{ id: string; title: string; progress: number }>;
}

interface AnnualGoal {
  id: string;
  month: number;
  title: string;
}

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Trabajo': '#4A90E2',
    'Personal': '#7AC943',
    'Ejercicio': '#F5A623',
    'Descanso': '#A8A8A8',
  };
  return colors[category] || '#999';
};

// ============= DAILY PLANNER TAB =============
const DailyPlannerTab = () => {
  const { savePlan, isSaving } = usePlannerStore();
  const { habits, logs } = useHabitStore();

  const [priorities, setPriorities] = useState<Priority[]>([
    { id: '1', title: 'Completar proyecto de análisis financiero', completed: false },
    { id: '2', title: 'Reunión con equipo a las 14:00', completed: false },
    { id: '3', title: 'Ejercicio y meditación por la mañana', completed: false },
  ]);

  const [blocks, setBlocks] = useState<TimeBlock[]>([
    { id: '1', title: 'Meditación', startHour: 6, duration: 1, category: 'Personal' },
    { id: '2', title: 'Ejercicio', startHour: 7, duration: 1.5, category: 'Ejercicio' },
    { id: '3', title: 'Desayuno y lectura', startHour: 8.5, duration: 1, category: 'Personal' },
    { id: '4', title: 'Trabajo - Proyecto A', startHour: 9.5, duration: 3, category: 'Trabajo' },
    { id: '5', title: 'Almuerzo', startHour: 12.5, duration: 1, category: 'Personal' },
    { id: '6', title: 'Reunión equipo', startHour: 14, duration: 1, category: 'Trabajo' },
    { id: '7', title: 'Trabajo - Proyecto B', startHour: 15, duration: 2, category: 'Trabajo' },
    { id: '8', title: 'Tiempo libre', startHour: 17, duration: 1, category: 'Descanso' },
  ]);

  const [rating, setRating] = useState(8);
  const [notes, setNotes] = useState('');

  const handleSavePlan = async () => {
    const today = new Date().toISOString().split('T')[0];
    await savePlan({
      date: today,
      topPriorities: priorities.map((p) => p.title),
      timeBlocks: blocks.map((b) => ({
        startTime: hourToTime(b.startHour),
        endTime: hourToTime(b.startHour + b.duration),
        title: b.title,
        category: b.category,
        completed: false,
      })),
      rating,
      notes,
    });
    alert('¡Plan del día guardado!');
  };

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const updatePriority = (id: string, updates: Partial<Priority>) => {
    setPriorities(priorities.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const getBlocksForHour = (hour: number): TimeBlock[] => {
    return blocks.filter(b => b.startHour <= hour && b.startHour + b.duration > hour);
  };

  const completedPriorities = priorities.filter(p => p.completed).length;
  const dailyProgress = Math.round((completedPriorities / priorities.length) * 100);
  const totalHours = blocks.reduce((sum, b) => sum + b.duration, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDow = new Date().getDay(); // 0=Sun..6=Sat
  const todayHabits = habits.filter(h => {
    if (h.isActive === false) return false;
    if (h.frequency === 'daily') return true;
    // Empty targetDays = treat as daily
    if (!Array.isArray(h.targetDays) || h.targetDays.length === 0) return true;
    return h.targetDays.includes(todayDow);
  });
  const todayLogs = logs.filter(l => l.date === todayStr);
  const completedHabitIds = new Set(todayLogs.filter(l => l.completed).map(l => l.habitId));
  const completedHabitsCount = todayHabits.filter(h => completedHabitIds.has(h.id)).length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
      <div>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 0.5rem 0' }}>
            Planificador Diario
          </h2>
          <p style={{ fontSize: '1rem', color: C.warm, margin: '0', textTransform: 'capitalize' }}>
            {dateStr}
          </p>
        </div>

        {/* Top 3 Priorities */}
        <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1rem 0' }}>
            🎯 Top 3 Prioridades
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {priorities.map(priority => (
              <div key={priority.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={priority.completed}
                  onChange={(e) => updatePriority(priority.id, { completed: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: C.accent }}
                />
                <input
                  type="text"
                  value={priority.title}
                  onChange={(e) => updatePriority(priority.id, { title: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${C.tan}`,
                    borderRadius: '6px',
                    backgroundColor: priority.completed ? C.cream : C.paper,
                    color: C.dark,
                    textDecoration: priority.completed ? 'line-through' : 'none',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Hábitos de Hoy */}
        <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0' }}>
              ✅ Hábitos de Hoy
            </h3>
            <span style={{
              backgroundColor: completedHabitsCount === todayHabits.length && todayHabits.length > 0 ? C.successLight : C.accentGlow,
              color: completedHabitsCount === todayHabits.length && todayHabits.length > 0 ? C.success : C.accent,
              borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.85rem', fontWeight: '700'
            }}>
              {completedHabitsCount}/{todayHabits.length}
            </span>
          </div>
          {todayHabits.length === 0 ? (
            <p style={{ color: C.warm, fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
              No tienes hábitos programados para hoy
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {todayHabits.map(habit => {
                const done = completedHabitIds.has(habit.id);
                return (
                  <div
                    key={habit.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      backgroundColor: done ? C.successLight : C.paper,
                      border: `2px solid ${done ? C.success : C.tan}`,
                      borderRadius: '10px', padding: '0.75rem 1rem',
                    }}
                  >
                    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{habit.icon || '⭐'}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0', fontSize: '0.95rem', fontWeight: '600', color: C.dark }}>
                        {habit.name}
                      </p>
                      <p style={{ margin: '0', fontSize: '0.75rem', color: C.warm }}>
                        {habit.category} · Racha: {habit.streakCurrent} días
                      </p>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.6rem',
                      borderRadius: '20px',
                      backgroundColor: done ? C.success : C.lightTan,
                      color: done ? C.paper : C.warm,
                    }}>
                      {done ? '✓ Hecho' : 'Pendiente'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {todayHabits.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ height: '6px', backgroundColor: C.lightTan, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  width: `${todayHabits.length > 0 ? (completedHabitsCount / todayHabits.length) * 100 : 0}%`,
                  backgroundColor: completedHabitsCount === todayHabits.length ? C.success : C.accent,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: C.warm, margin: '0.4rem 0 0 0', textAlign: 'right' }}>
                {todayHabits.length > 0 ? Math.round((completedHabitsCount / todayHabits.length) * 100) : 0}% completado
              </p>
            </div>
          )}
        </div>

        {/* Time Blocking Grid */}
        <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1rem 0' }}>
            ⏰ Bloques de Tiempo (6am - 11pm)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '0.75rem' }}>
            {hours.map(hour => (
              <div key={hour} style={{ display: 'contents' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: '600', color: C.warm,
                  padding: '0.5rem', minHeight: '50px'
                }}>
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'stretch',
                  minHeight: '50px', backgroundColor: C.paper,
                  borderRadius: '8px', padding: '0.5rem', border: `1px solid ${C.lightTan}`
                }}>
                  {getBlocksForHour(hour).map(block => (
                    <div
                      key={block.id}
                      style={{
                        flex: block.duration, backgroundColor: getCategoryColor(block.category),
                        borderRadius: '6px', padding: '0.5rem',
                        color: 'white', cursor: 'pointer', opacity: 0.85,
                        display: 'flex', flexDirection: 'column', justifyContent: 'center'
                      }}
                    >
                      <p style={{ fontSize: '0.8rem', fontWeight: '600', margin: '0 0 0.2rem 0' }}>
                        {block.title}
                      </p>
                      <p style={{ fontSize: '0.7rem', margin: '0', opacity: 0.9 }}>
                        {block.duration}h
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Day Rating & Notes */}
        <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1rem 0' }}>
            ⭐ Calificación & Notas
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: C.warm, margin: '0 0 0.75rem 0' }}>¿Cómo fue tu día?</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  onClick={() => setRating(num)}
                  style={{
                    fontSize: '1.8rem', backgroundColor: rating === num ? C.accentGlow : 'transparent',
                    border: `2px solid ${rating === num ? C.accent : C.tan}`, borderRadius: '50%',
                    width: '45px', height: '45px', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {num <= 2 ? '😢' : num <= 4 ? '😕' : num <= 6 ? '😐' : num <= 8 ? '😊' : '😄'}
                </button>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.95rem', color: C.dark, fontWeight: '600', margin: '0' }}>
              Calificación: {rating}/10
            </p>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas del día..."
            style={{
              width: '100%', padding: '0.75rem', border: `1px solid ${C.tan}`,
              borderRadius: '6px', backgroundColor: C.paper, color: C.dark,
              fontSize: '0.95rem', fontFamily: 'inherit', minHeight: '100px', resize: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Sidebar Stats */}
      <div>
        <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1rem 0', textAlign: 'center' }}>
            Estadísticas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ backgroundColor: C.successLight, borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: C.dark, margin: '0 0 0.25rem 0' }}>Progreso del Día</p>
              <p style={{ fontSize: '1.6rem', fontWeight: '700', color: C.success, margin: '0' }}>{dailyProgress}%</p>
            </div>
            <div style={{ backgroundColor: C.infoLight, borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: C.dark, margin: '0 0 0.25rem 0' }}>Total Horas</p>
              <p style={{ fontSize: '1.6rem', fontWeight: '700', color: C.info, margin: '0' }}>{totalHours.toFixed(1)}h</p>
            </div>
            <div style={{ backgroundColor: C.warningLight, borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: C.dark, margin: '0 0 0.25rem 0' }}>Prioridades</p>
              <p style={{ fontSize: '1.6rem', fontWeight: '700', color: C.warning, margin: '0' }}>{completedPriorities}/3</p>
            </div>
            <div style={{ backgroundColor: C.lightTan, borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: C.dark, margin: '0 0 0.25rem 0' }}>Hábitos Hoy</p>
              <p style={{ fontSize: '1.6rem', fontWeight: '700', color: C.brown, margin: '0' }}>
                {completedHabitsCount}/{todayHabits.length}
              </p>
            </div>
          </div>
        </div>
        <button
          style={{
            width: '100%', backgroundColor: C.accent, color: C.paper,
            border: 'none', borderRadius: '8px', padding: '0.75rem',
            fontSize: '0.95rem', fontWeight: '600',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
          }}
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
    { id: '1', title: 'Presentación proyecto', day: 0, completed: true },
    { id: '2', title: 'Revisar reportes', day: 1, completed: false },
    { id: '3', title: 'Entregar análisis', day: 2, completed: false },
    { id: '4', title: 'Planificación siguiente semana', day: 4, completed: false },
    { id: '5', title: 'Sesión de mentoría', day: 3, completed: false },
    { id: '6', title: 'Ejercicio intenso', day: 2, completed: true },
    { id: '7', title: 'Lectura de desarrollo', day: 5, completed: false },
  ]);

  const [weeklyObjectives, setWeeklyObjectives] = useState<WeeklyObjective[]>([
    { id: '1', title: 'Completar proyecto de análisis de datos' },
    { id: '2', title: 'Mejorar flujo de trabajo en equipo' },
    { id: '3', title: 'Ejercitarse 4 veces en la semana' },
    { id: '4', title: 'Leer 2 capítulos del libro' },
    { id: '5', title: 'Preparar presentación de resultados' },
  ]);

  const [weeklyScore, setWeeklyScore] = useState(8.2);

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const hoursData = [
    { category: 'Trabajo', hours: 30 },
    { category: 'Personal', hours: 10 },
    { category: 'Ejercicio', hours: 5 },
    { category: 'Descanso', hours: 12 }
  ];

  const toggleTask = (id: string) => {
    setWeeklyTasks(weeklyTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const tasksByDay = Array.from({ length: 7 }, (_, i) => weeklyTasks.filter(t => t.day === i));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1.5rem 0' }}>
          Planificador Semanal
        </h2>

        {/* Weekly Tasks Grid */}
        <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1.5rem 0' }}>
            📅 Tareas por Día
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem' }}>
            {days.map((day, idx) => (
              <div key={idx} style={{
                backgroundColor: C.lightCream, border: `2px solid ${C.tan}`,
                borderRadius: '10px', padding: '1rem'
              }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: C.dark, margin: '0 0 1rem 0', textAlign: 'center' }}>
                  {day}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tasksByDay[idx].map(task => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      style={{
                        backgroundColor: task.completed ? C.successLight : C.paper,
                        border: `1px solid ${task.completed ? C.success : C.tan}`,
                        borderRadius: '6px', padding: '0.5rem',
                        cursor: 'pointer', fontSize: '0.8rem',
                        color: C.dark, textDecoration: task.completed ? 'line-through' : 'none',
                        textAlign: 'left', transition: 'all 0.2s'
                      }}
                    >
                      {task.title}
                    </button>
                  ))}
                  {tasksByDay[idx].length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: C.warm, margin: '0.5rem 0', fontStyle: 'italic' }}>
                      Sin tareas
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Objectives */}
        <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1rem 0' }}>
            🎯 Objetivos Semanales
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {weeklyObjectives.map(obj => (
              <div key={obj.id} style={{
                backgroundColor: C.paper, border: `1px solid ${C.tan}`,
                borderRadius: '8px', padding: '0.75rem',
                display: 'flex', gap: '0.75rem', alignItems: 'center'
              }}>
                <Circle size={16} style={{ color: C.accent, flexShrink: 0 }} />
                <p style={{ margin: '0', color: C.dark, fontSize: '0.95rem' }}>{obj.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hours by Category Chart */}
        <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1rem 0' }}>
            📊 Horas por Categoría
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lightTan} />
              <XAxis dataKey="category" stroke={C.warm} />
              <YAxis stroke={C.warm} />
              <Tooltip contentStyle={{ backgroundColor: C.lightCream, border: `1px solid ${C.tan}` }} />
              <Bar dataKey="hours" fill={C.accent} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Score */}
      <div>
        <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1.5rem 0', textAlign: 'center' }}>
            Puntuación Semanal
          </h3>
          <div style={{
            backgroundColor: C.accentGlow, borderRadius: '12px', padding: '2rem',
            textAlign: 'center', marginBottom: '1.5rem'
          }}>
            <p style={{ fontSize: '3rem', fontWeight: '700', color: C.accent, margin: '0' }}>
              {weeklyScore.toFixed(1)}
            </p>
            <p style={{ fontSize: '0.9rem', color: C.dark, margin: '0.5rem 0 0 0' }}>
              de 10
            </p>
          </div>
          <div style={{
            backgroundColor: C.paper, border: `1px solid ${C.tan}`,
            borderRadius: '8px', padding: '1rem'
          }}>
            <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0' }}>
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
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([
    { id: '1', title: 'Completar curso de análisis avanzado' },
    { id: '2', title: 'Terminar proyecto principal' },
    { id: '3', title: 'Leer 2 libros de desarrollo personal' },
  ]);

  const today = new Date();
  const month = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const getDaysInMonth = () => new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysInMonth = getDaysInMonth();
  // Adjust firstDay offset based on weekStartsOn (0=Sun, 1=Mon)
  const rawFirstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const firstDay = (rawFirstDay - weekStartsOn + 7) % 7;

  // Day labels starting from weekStartsOn
  const ALL_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayLabels = Array.from({ length: 7 }, (_, i) => ALL_DAYS[(weekStartsOn + i) % 7]);

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDay + 1;
    return dayNum > 0 && dayNum <= daysInMonth ? dayNum : null;
  });

  // Real habit completion rate per day
  const getHabitRateForDay = (day: number): number => {
    const d = new Date(today.getFullYear(), today.getMonth(), day);
    const dateStr = d.toISOString().split('T')[0];
    const dow = d.getDay();
    const scheduled = habits.filter(h => {
      if (!h.isActive) return false;
      if (h.frequency === 'daily') return true;
      return Array.isArray(h.targetDays) && h.targetDays.includes(dow);
    });
    if (scheduled.length === 0) return -1; // no habits scheduled
    const dayLogs = logs.filter(l => l.date === dateStr);
    const completed = scheduled.filter(h => dayLogs.some(l => l.habitId === h.id && l.completed)).length;
    return completed / scheduled.length;
  };

  const habitCompletionColor = (day: number | null): string => {
    if (day === null) return 'transparent';
    if (day > today.getDate() && today.getMonth() === today.getMonth()) return C.paper;
    const rate = getHabitRateForDay(day);
    if (rate < 0) return C.paper;            // no habits scheduled
    if (rate === 0) return C.dangerLight;    // nothing done
    if (rate < 0.4) return C.warningLight;  // <40%
    if (rate < 0.7) return C.infoLight;     // 40-70%
    if (rate < 1.0) return C.successLight;  // 70-99%
    return C.accentGlow;                     // 100% ✓
  };

  // Monthly stats from real data
  const monthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const monthLogs = logs.filter(l => l.date.startsWith(monthPrefix) && l.completed);
  const distinctDaysWithCompletion = new Set(
    monthLogs.map(l => l.date)
  ).size;

  const kpiCards = [
    { label: 'Días con Hábitos', value: String(distinctDaysWithCompletion), color: C.success },
    { label: 'Hábitos Completados', value: String(monthLogs.length), color: C.info },
    { label: 'Hábitos Activos', value: String(habits.filter(h => h.isActive).length), color: C.warning },
    { label: 'Mejor Racha', value: `${Math.max(0, ...habits.map(h => h.streakBest))}d`, color: C.accent },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1.5rem 0' }}>
        Planificador Mensual
      </h2>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {kpiCards.map((kpi, idx) => (
          <div key={idx} style={{
            backgroundColor: C.lightCream, borderRadius: '12px',
            border: `2px solid ${C.tan}`, padding: '1.5rem', textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0 0 0.5rem 0' }}>
              {kpi.label}
            </p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: kpi.color, margin: '0' }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div>
          {/* Calendar */}
          <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1rem 0', textAlign: 'center', textTransform: 'capitalize' }}>
              {month}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {dayLabels.map(day => (
                <div key={day} style={{
                  textAlign: 'center', fontWeight: '700', color: C.dark,
                  fontSize: '0.85rem', padding: '0.5rem'
                }}>
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const bg = habitCompletionColor(day);
                const isToday = day === today.getDate();
                const rate = day ? getHabitRateForDay(day) : -1;
                return (
                  <div key={idx} style={{
                    backgroundColor: bg,
                    border: `2px solid ${isToday ? C.accent : C.lightTan}`,
                    borderRadius: '8px', padding: '0.5rem',
                    textAlign: 'center', minHeight: '52px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '2px',
                    cursor: day ? 'pointer' : 'default',
                  }}>
                    <span style={{
                      fontWeight: isToday ? '700' : '400',
                      fontSize: '0.9rem',
                      color: isToday ? C.accent : C.dark
                    }}>
                      {day}
                    </span>
                    {day && rate >= 0 && (
                      <span style={{ fontSize: '0.65rem', color: C.warm }}>
                        {Math.round(rate * 100)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Goals */}
          <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1rem 0' }}>
              🎯 Objetivos del Mes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {monthlyGoals.map(goal => (
                <div key={goal.id} style={{
                  backgroundColor: C.paper, border: `1px solid ${C.tan}`,
                  borderRadius: '8px', padding: '0.75rem',
                  display: 'flex', gap: '0.75rem', alignItems: 'center'
                }}>
                  <Circle size={16} style={{ color: C.accent, flexShrink: 0 }} />
                  <p style={{ margin: '0', color: C.dark, fontSize: '0.95rem' }}>{goal.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div>
          <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1.5rem 0', textAlign: 'center' }}>
              Resumen del Mes
            </h3>
            {(() => {
              const totalActiveHabits = habits.filter(h => h.isActive).length;
              const daysElapsed = today.getDate();
              const possibleLogs = totalActiveHabits * daysElapsed;
              const monthPct = possibleLogs > 0 ? Math.round((monthLogs.length / possibleLogs) * 100) : 0;
              const bestStreak = Math.max(0, ...habits.map(h => h.streakCurrent));
              const perfectDays = Array.from({ length: daysElapsed }, (_, i) => i + 1).filter(d => {
                const rate = getHabitRateForDay(d);
                return rate >= 1;
              }).length;
              return (
                <>
                  <div style={{ backgroundColor: C.accentGlow, borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0 0 0.25rem 0' }}>Tasa de Completación</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: '700', color: C.accent, margin: '0' }}>{monthPct}%</p>
                  </div>
                  <div style={{ backgroundColor: C.successLight, borderRadius: '8px', padding: '1rem', textAlign: 'center', marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0 0 0.25rem 0' }}>Días Perfectos</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: '700', color: C.success, margin: '0' }}>{perfectDays}/{daysElapsed}</p>
                  </div>
                  <div style={{ backgroundColor: C.infoLight, borderRadius: '8px', padding: '1rem', textAlign: 'center', marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0 0 0.25rem 0' }}>Mejor Racha Activa</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: '700', color: C.info, margin: '0' }}>{bestStreak} días</p>
                  </div>
                  <div style={{ backgroundColor: C.warningLight, borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0 0 0.25rem 0' }}>Completados este mes</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: '700', color: C.warning, margin: '0' }}>{monthLogs.length}</p>
                  </div>
                </>
              );
            })()}
          </div>
          {/* Legend */}
          <div style={{ backgroundColor: C.warmWhite, border: `1px solid ${C.lightTan}`, borderRadius: '10px', padding: '1rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: C.dark, margin: '0 0 0.75rem 0' }}>Leyenda del calendario</p>
            {[
              { color: C.accentGlow, label: '100% — Día perfecto' },
              { color: C.successLight, label: '70–99% — Muy bien' },
              { color: C.infoLight, label: '40–69% — En progreso' },
              { color: C.warningLight, label: '1–39% — Poco' },
              { color: C.dangerLight, label: '0% — Sin completar' },
              { color: C.paper, label: 'Sin hábitos ese día' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: color, border: `1px solid ${C.tan}`, flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: C.warm }}>{label}</span>
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
  const [quarter, setQuarter] = useState(1);
  const [okrs, setOkrs] = useState<QuarterlyOKR>({
    objective: 'Escalar la productividad y completar el proyecto estratégico',
    keyResults: [
      { id: '1', title: 'Alcanzar 90% de tareas completadas', progress: 78 },
      { id: '2', title: 'Completar 3 iteraciones del proyecto', progress: 67 },
      { id: '3', title: 'Mejorar score de calidad a 9/10', progress: 85 },
    ]
  });

  const [projects] = useState([
    { id: '1', title: 'Proyecto A: Análisis de Datos', progress: 65, startDate: 'Ene', endDate: 'Mar' },
    { id: '2', title: 'Proyecto B: Integración de Sistemas', progress: 45, startDate: 'Feb', endDate: 'Abr' },
    { id: '3', title: 'Proyecto C: Optimización', progress: 82, startDate: 'Ene', endDate: 'Mar' },
  ]);

  const milestones = [
    { date: 'Ene 15', milestone: 'Validar requisitos y scope' },
    { date: 'Feb 28', milestone: 'Completar fase de desarrollo' },
    { date: 'Mar 20', milestone: 'QA y testing completo' },
    { date: 'Mar 31', milestone: 'Lanzamiento y revisión' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0' }}>
          Planificador Trimestral
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button style={{
            backgroundColor: 'transparent', border: `2px solid ${C.accent}`,
            borderRadius: '6px', padding: '0.5rem 0.75rem', cursor: 'pointer',
            color: C.dark, fontWeight: '600'
          }}>
            Q{quarter}
          </button>
          <span style={{ fontSize: '0.9rem', color: C.warm }}>2026</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem' }}>
        <div>
          {/* OKRs Section */}
          <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1rem 0' }}>
              🎯 OKRs Trimestrales
            </h3>
            <div style={{ backgroundColor: C.paper, border: `1px solid ${C.tan}`, borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.95rem', color: C.dark, margin: '0', fontWeight: '600' }}>
                {okrs.objective}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {okrs.keyResults.map(kr => (
                <div key={kr.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <p style={{ fontSize: '0.9rem', color: C.dark, margin: '0', fontWeight: '500' }}>
                      {kr.title}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: C.accent, margin: '0', fontWeight: '700' }}>
                      {kr.progress}%
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: C.cream, border: `1px solid ${C.tan}`,
                    borderRadius: '8px', height: '8px', overflow: 'hidden'
                  }}>
                    <div style={{
                      backgroundColor: C.success, height: '100%',
                      width: `${kr.progress}%`, transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1rem 0' }}>
              📋 Proyectos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {projects.map(proj => (
                <div key={proj.id} style={{
                  backgroundColor: C.paper, border: `1px solid ${C.lightTan}`,
                  borderRadius: '8px', padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: '600', color: C.dark, margin: '0' }}>
                      {proj.title}
                    </p>
                    <span style={{ fontSize: '0.8rem', color: C.warm }}>
                      {proj.startDate} - {proj.endDate}
                    </span>
                  </div>
                  <div style={{
                    backgroundColor: C.cream, borderRadius: '6px', height: '6px',
                    overflow: 'hidden', marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      backgroundColor: C.accent, height: '100%',
                      width: `${proj.progress}%`
                    }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0', textAlign: 'right' }}>
                    {proj.progress}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones Timeline */}
          <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1.5rem 0' }}>
              🗓️ Hitos Importantes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {milestones.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{
                    width: '3px', backgroundColor: C.accent,
                    borderRadius: '2px', flexShrink: 0
                  }} />
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '700', color: C.accent, margin: '0 0 0.25rem 0' }}>
                      {m.date}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: C.dark, margin: '0' }}>
                      {m.milestone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quarterly Review */}
        <div>
          <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1.5rem 0', textAlign: 'center' }}>
              Revisión Trimestral
            </h3>
            <div style={{
              backgroundColor: C.accentGlow, borderRadius: '12px', padding: '1.5rem',
              textAlign: 'center', marginBottom: '1.5rem'
            }}>
              <p style={{ fontSize: '0.8rem', color: C.dark, margin: '0 0 0.5rem 0' }}>
                Progreso Q{quarter}
              </p>
              <p style={{ fontSize: '2.2rem', fontWeight: '700', color: C.accent, margin: '0' }}>
                71%
              </p>
            </div>
            <div style={{
              backgroundColor: C.paper, border: `1px solid ${C.tan}`,
              borderRadius: '8px', padding: '1rem'
            }}>
              <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0', lineHeight: '1.5' }}>
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
  const [yearlyGoals, setYearlyGoals] = useState<AnnualGoal[]>([
    { id: '1', month: 1, title: 'Completar curso de especialización' },
    { id: '2', month: 2, title: 'Lanzar nuevo proyecto' },
    { id: '3', month: 3, title: 'Mejorar habilidades de liderazgo' },
    { id: '4', month: 4, title: 'Alcanzar 10k de followers' },
    { id: '5', month: 5, title: 'Escribir artículos de blog' },
    { id: '6', month: 6, title: 'Completar transformación fitness' },
    { id: '7', month: 7, title: 'Viaje de desarrollo personal' },
    { id: '8', month: 8, title: 'Mentoría a 5 personas' },
    { id: '9', month: 9, title: 'Publicar libro digital' },
    { id: '10', month: 10, title: 'Expandir red profesional' },
    { id: '11', month: 11, title: 'Revisión y planificación anual' },
    { id: '12', month: 12, title: 'Celebrar logros del año' },
  ]);

  const [yearlyTheme, setYearlyTheme] = useState('Transformación y Crecimiento');
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthProgress = [85, 92, 78, 65, 45, 32, 20, 15, 8, 5, 2, 0];

  const yearStats = [
    { label: 'Horas Productivas', value: '1,847' },
    { label: 'Metas Alcanzadas', value: '34/36' },
    { label: 'Lectura Anual', value: '24 libros' },
    { label: 'Promedio Calificación', value: '8.2/10' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1.5rem 0' }}>
        Planificador Anual - 2026
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div>
          {/* Yearly Theme */}
          <div style={{ backgroundColor: C.accentGlow, border: `2px solid ${C.accent}`, borderRadius: '12px', padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.95rem', color: C.dark, margin: '0 0 0.75rem 0' }}>
              Tema del Año
            </p>
            <input
              type="text"
              value={yearlyTheme}
              onChange={(e) => setYearlyTheme(e.target.value)}
              style={{
                fontSize: '1.4rem', fontWeight: '700', color: C.dark,
                backgroundColor: 'transparent', border: 'none',
                textAlign: 'center', width: '100%',
                fontFamily: 'Georgia, serif', outline: 'none'
              }}
            />
          </div>

          {/* 12 Month Progress Bars */}
          <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1.5rem 0' }}>
              📊 Progreso Mensual
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
              {months.map((month, idx) => (
                <div key={idx}>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0', textAlign: 'center' }}>
                    {month.slice(0, 3)}
                  </p>
                  <div style={{
                    backgroundColor: C.cream, borderRadius: '6px', height: '8px',
                    overflow: 'hidden', marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      backgroundColor: C.success, height: '100%',
                      width: `${monthProgress[idx]}%`
                    }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: C.warm, margin: '0', textAlign: 'center' }}>
                    {monthProgress[idx]}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 12 Annual Goals */}
          <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1.5rem 0' }}>
              🎯 Metas Anuales (Una por Mes)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {yearlyGoals.map(goal => (
                <div key={goal.id} style={{
                  backgroundColor: C.paper, border: `1px solid ${C.tan}`,
                  borderRadius: '8px', padding: '1rem'
                }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: C.accent, margin: '0 0 0.5rem 0' }}>
                    {months[goal.month - 1]}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: C.dark, margin: '0' }}>
                    {goal.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Year Stats Sidebar */}
        <div>
          <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 1.5rem 0', textAlign: 'center' }}>
              Estadísticas Anuales
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {yearStats.map((stat, idx) => (
                <div key={idx} style={{
                  backgroundColor: C.paper, border: `1px solid ${C.tan}`,
                  borderRadius: '8px', padding: '1rem', textAlign: 'center'
                }}>
                  <p style={{ fontSize: '0.8rem', color: C.warm, margin: '0 0 0.5rem 0' }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: '1.4rem', fontWeight: '700', color: C.accent, margin: '0' }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <div style={{
              backgroundColor: C.accentGlow, borderRadius: '8px', padding: '1.5rem',
              textAlign: 'center', marginTop: '1.5rem'
            }}>
              <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0 0 0.5rem 0' }}>
                Alineación Visión
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: C.accent, margin: '0' }}>
                94%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= MEETING MINUTES TAB =============
const MeetingMinutesTab = () => {
  interface MeetingParticipant {
    name: string;
    role: string;
  }
  interface ActionItem {
    id: string;
    task: string;
    assignee: string;
    dueDate: string;
    completed: boolean;
  }
  interface Meeting {
    id: string;
    title: string;
    date: string;
    time: string;
    participants: MeetingParticipant[];
    agenda: string[];
    notes: string;
    actionItems: ActionItem[];
  }

  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1', title: 'Sprint Planning Q2', date: '2026-04-06', time: '10:00',
      participants: [
        { name: 'Eduardo', role: 'Líder' },
        { name: 'Ana', role: 'Desarrolladora' },
        { name: 'Carlos', role: 'Diseñador' },
      ],
      agenda: ['Revisión sprint anterior', 'Prioridades Q2', 'Asignación de tareas'],
      notes: 'Se aprobó el roadmap para Q2. Enfoque en funciones premium y onboarding.',
      actionItems: [
        { id: 'a1', task: 'Crear mockups del onboarding', assignee: 'Carlos', dueDate: '2026-04-10', completed: false },
        { id: 'a2', task: 'Implementar autenticación', assignee: 'Ana', dueDate: '2026-04-12', completed: false },
        { id: 'a3', task: 'Definir métricas de éxito', assignee: 'Eduardo', dueDate: '2026-04-08', completed: true },
      ],
    },
  ]);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>('1');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');

  const currentMeeting = meetings.find(m => m.id === selectedMeeting);

  const addMeeting = () => {
    if (!newTitle || !newDate) return;
    const m: Meeting = {
      id: Date.now().toString(), title: newTitle, date: newDate, time: newTime,
      participants: [{ name: 'Eduardo', role: 'Organizador' }],
      agenda: [], notes: '', actionItems: [],
    };
    setMeetings(prev => [m, ...prev]);
    setSelectedMeeting(m.id);
    setShowNewForm(false);
    setNewTitle(''); setNewDate('');
  };

  const toggleAction = (meetingId: string, actionId: string) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId ? {
        ...m, actionItems: m.actionItems.map(a =>
          a.id === actionId ? { ...a, completed: !a.completed } : a
        )
      } : m
    ));
  };

  const updateNotes = (meetingId: string, notes: string) => {
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, notes } : m));
  };

  const addAgendaItem = (meetingId: string, item: string) => {
    if (!item) return;
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, agenda: [...m.agenda, item] } : m));
  };

  const addActionItem = (meetingId: string) => {
    const newAction: ActionItem = {
      id: Date.now().toString(), task: 'Nueva tarea', assignee: '', dueDate: '', completed: false,
    };
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, actionItems: [...m.actionItems, newAction] } : m));
  };

  const [newAgendaText, setNewAgendaText] = useState('');

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: '8px', border: `1px solid ${C.tan}`,
    fontSize: '0.9rem', backgroundColor: C.cream, width: '100%',
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: C.paper, borderRadius: '10px', padding: '20px',
    border: `1px solid ${C.tan}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ display: 'flex', gap: '20px', minHeight: '500px' }}>
      {/* Sidebar: Meeting List */}
      <div style={{ width: '280px', flexShrink: 0 }}>
        <div style={{ ...cardStyle, marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', color: C.dark, fontSize: '1rem' }}>📋 Reuniones</h3>
            <button onClick={() => setShowNewForm(!showNewForm)} style={{
              backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '6px',
              padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
            }}>+ Nueva</button>
          </div>
          {showNewForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', padding: '12px', backgroundColor: C.lightCream, borderRadius: '8px' }}>
              <input placeholder="Título" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={inputStyle} />
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={inputStyle} />
              <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={inputStyle} />
              <button onClick={addMeeting} style={{ padding: '8px', backgroundColor: C.success, color: C.paper, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                Crear Reunión
              </button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {meetings.map(m => (
              <button key={m.id} onClick={() => setSelectedMeeting(m.id)} style={{
                padding: '12px', borderRadius: '8px', border: selectedMeeting === m.id ? `2px solid ${C.accent}` : `1px solid ${C.tan}`,
                backgroundColor: selectedMeeting === m.id ? C.accentGlow : C.paper,
                cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ fontWeight: '600', color: C.dark, fontSize: '0.9rem' }}>{m.title}</div>
                <div style={{ fontSize: '0.75rem', color: C.warm, marginTop: '4px' }}>{m.date} · {m.time}</div>
                <div style={{ fontSize: '0.75rem', color: C.medium, marginTop: '2px' }}>
                  {m.actionItems.filter(a => !a.completed).length} tareas pendientes
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main: Meeting Detail */}
      <div style={{ flex: 1 }}>
        {currentMeeting ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div style={cardStyle}>
              <h2 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 8px 0', fontSize: '1.3rem' }}>
                {currentMeeting.title}
              </h2>
              <div style={{ display: 'flex', gap: '20px', color: C.medium, fontSize: '0.85rem' }}>
                <span>📅 {currentMeeting.date}</span>
                <span>🕐 {currentMeeting.time}</span>
                <span>👥 {currentMeeting.participants.length} participantes</span>
              </div>
            </div>

            {/* Participants */}
            <div style={cardStyle}>
              <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 12px 0', fontSize: '1rem' }}>👥 Participantes</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {currentMeeting.participants.map((p, i) => (
                  <div key={i} style={{
                    padding: '8px 16px', backgroundColor: C.lightCream, borderRadius: '20px',
                    display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem',
                  }}>
                    <span style={{ fontWeight: '600', color: C.dark }}>{p.name}</span>
                    <span style={{ color: C.accent, fontSize: '0.75rem' }}>({p.role})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agenda */}
            <div style={cardStyle}>
              <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 12px 0', fontSize: '1rem' }}>📝 Agenda</h3>
              <ol style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
                {currentMeeting.agenda.map((item, i) => (
                  <li key={i} style={{ color: C.dark, fontSize: '0.9rem', marginBottom: '6px' }}>{item}</li>
                ))}
              </ol>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  placeholder="Nuevo punto de agenda..."
                  value={newAgendaText}
                  onChange={e => setNewAgendaText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { addAgendaItem(currentMeeting.id, newAgendaText); setNewAgendaText(''); } }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={() => { addAgendaItem(currentMeeting.id, newAgendaText); setNewAgendaText(''); }} style={{
                  backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '6px',
                  padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                }}>Agregar</button>
              </div>
            </div>

            {/* Notes */}
            <div style={cardStyle}>
              <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 12px 0', fontSize: '1rem' }}>📄 Notas</h3>
              <textarea
                value={currentMeeting.notes}
                onChange={e => updateNotes(currentMeeting.id, e.target.value)}
                placeholder="Escribe las notas de la reunión aquí..."
                style={{
                  width: '100%', minHeight: '120px', padding: '14px', borderRadius: '8px',
                  border: `1px solid ${C.tan}`, fontSize: '0.9rem', backgroundColor: C.cream,
                  resize: 'vertical', fontFamily: 'Inter, sans-serif', lineHeight: '1.6',
                }}
              />
            </div>

            {/* Action Items */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: 0, fontSize: '1rem' }}>✅ Tareas de Seguimiento</h3>
                <button onClick={() => addActionItem(currentMeeting.id)} style={{
                  backgroundColor: C.success, color: C.paper, border: 'none', borderRadius: '6px',
                  padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                }}>+ Tarea</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentMeeting.actionItems.map(a => (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                    backgroundColor: a.completed ? C.successLight : C.lightCream, borderRadius: '8px',
                    border: `1px solid ${a.completed ? C.success : C.tan}`,
                  }}>
                    <button onClick={() => toggleAction(currentMeeting.id, a.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}>
                      {a.completed ?
                        <CheckCircle size={20} color={C.success} /> :
                        <Circle size={20} color={C.tan} />
                      }
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', color: C.dark, fontWeight: '500', textDecoration: a.completed ? 'line-through' : 'none' }}>
                        {a.task}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: C.warm, marginTop: '2px' }}>
                        {a.assignee && `👤 ${a.assignee}`} {a.dueDate && `· 📅 ${a.dueDate}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '1.1rem', color: C.warm }}>Selecciona o crea una reunión para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============= MAIN COMPONENT =============
const DailyPlannerPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: 'Planificador Diario', component: DailyPlannerTab },
    { label: 'Planificador Semanal', component: WeeklyPlannerTab },
    { label: 'Planificador Mensual', component: MonthlyPlannerTab },
    { label: 'Planificador Trimestral', component: QuarterlyPlannerTab },
    { label: 'Planificador Anual', component: YearlyPlannerTab },
    { label: 'Minutas de Reunión', component: MeetingMinutesTab },
  ];

  return (
    <div style={{ backgroundColor: C.paper }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'Georgia, serif', fontWeight: '400', color: C.dark, margin: '0 0 0.5rem 0' }}>
          Plan / Planificador
        </h1>
        <p style={{ fontSize: '1rem', color: C.warm, margin: '0' }}>
          Gestiona tu tiempo en diferentes escalas
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '2rem',
        borderBottom: `2px solid ${C.lightTan}`, paddingBottom: '0.5rem',
        overflowX: 'auto'
      }}>
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            style={{
              padding: '0.75rem 1.5rem', border: 'none',
              backgroundColor: activeTab === idx ? C.accent : 'transparent',
              color: activeTab === idx ? C.paper : C.warm,
              borderRadius: activeTab === idx ? '8px 8px 0 0' : '0',
              cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600',
              fontFamily: 'Georgia, serif', transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: C.paper, borderRadius: '0 0 12px 12px' }}>
        {(() => { const ActiveTab = tabs[activeTab].component; return <ActiveTab />; })()}
      </div>
    </div>
  );
};

export default DailyPlannerPage;
