import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/lib/use-local-storage';
import { useAppStore, type ProductivityTab } from '@/stores/app-store';
import { useOKRStore } from '@/stores/okr-store';
import HabitTrackerPage from '@/components/features/habits/habit-tracker-page';
import DailyCommandCenter from './daily-command-center';
import ProjectionDashboard from './projection-dashboard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Play, Pause, RotateCcw, Plus, Trash2, ChevronRight, ChevronLeft, Clock, Check, Square, X, ChevronDown, ChevronUp, Target,
} from 'lucide-react';

const C = {
  dark: '#3D2B1F', brown: '#6B4226', medium: '#8B6542', warm: '#A0845C',
  tan: '#C4A882', lightTan: '#D4BEA0', cream: '#EDE0D4', lightCream: '#F5EDE3',
  warmWhite: '#FAF7F3', paper: '#FFFDF9', accent: '#B8860B', accentLight: '#D4A843',
  accentGlow: '#F0D78C', success: '#7A9E3E', successLight: '#D4E6B5',
  warning: '#D4943A', warningLight: '#F5E0C0', danger: '#C0544F',
  dangerLight: '#F5D0CE', info: '#5A8FA8', infoLight: '#C8E0EC',
};

// Types
interface PomodoroSession {
  id: string;
  task: string;
  duration: number;
  timestamp: Date;
}

interface KanbanCard {
  id: string;
  title: string;
  priority: 'Alta' | 'Media' | 'Baja';
  dueDate?: string;
  category: string;
  objectiveId?: string;
  weight: number;
}

interface Task {
  id: string;
  name: string;
  dueDate?: string;
  tags: string[];
  completed: boolean;
}



const TAB_KEYS: ProductivityTab[] = ['habits', 'projects', 'tasks', 'pomodoro', 'command', 'projection'];
const TAB_LABELS: Record<ProductivityTab, string> = {
  habits:     '🔁 Habit Tracker',
  projects:   '📋 Project Management',
  tasks:      '✅ Task List',
  pomodoro:   '🍅 Pomodoro',
  command:    '⚡ Daily Command',
  projection: '📊 Dashboard KPIs',
};

export default function ProductivityPage() {
  const { productivitySubTab, setProductivitySubTab } = useAppStore();

  // Sync with sidebar deep-link
  const [activeTab, setActiveTab] = useState<ProductivityTab>(productivitySubTab);
  useEffect(() => { setActiveTab(productivitySubTab); }, [productivitySubTab]);

  const switchTab = (tab: ProductivityTab) => {
    setActiveTab(tab);
    setProductivitySubTab(tab);
  };

  return (
    <div style={{ backgroundColor: C.warmWhite }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: `2px solid ${C.tan}`, paddingBottom: '10px', flexWrap: 'wrap' }}>
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === key ? C.accent : C.cream,
              color: activeTab === key ? C.warmWhite : C.dark,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeTab === key ? 'bold' : 'normal',
              fontSize: '14px',
            }}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'habits'      && <HabitTrackerPage />}
      {activeTab === 'projects'    && <KanbanTab />}
      {activeTab === 'tasks'       && <TasksTab />}
      {activeTab === 'pomodoro'    && <PomodoroTab />}
      {activeTab === 'command'     && <DailyCommandCenter />}
      {activeTab === 'projection'  && <ProjectionDashboard />}
    </div>
  );
}

// ========== POMODORO TAB ==========
function PomodoroTab() {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [currentTask, setCurrentTask] = useState('');
  const [completedToday, setCompletedToday] = useState(8);
  const [sessions, setSessions] = useState<PomodoroSession[]>([
    { id: '1', task: 'Diseño UI', duration: 25, timestamp: new Date(Date.now() - 2 * 60000) },
    { id: '2', task: 'Revisar código', duration: 25, timestamp: new Date(Date.now() - 32 * 60000) },
    { id: '3', task: 'Escribir documentación', duration: 25, timestamp: new Date(Date.now() - 62 * 60000) },
  ]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTotalSeconds(prev => {
        if (prev <= 1) {
          if (isWorkSession) {
            setIsWorkSession(false);
            setCompletedToday(p => p + 1);
            if (currentTask) {
              setSessions(p => [
                { id: Date.now().toString(), task: currentTask, duration: workMin, timestamp: new Date() },
                ...p,
              ]);
              setCurrentTask('');
            }
            return breakMin * 60;
          }
          setIsWorkSession(true);
          return workMin * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, workMin, breakMin, isWorkSession, currentTask]);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const circumference = 2 * Math.PI * 95;
  const progress = ((isWorkSession ? workMin * 60 : breakMin * 60) - totalSeconds) / ((isWorkSession ? workMin : breakMin) * 60);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
        {/* Timer */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: C.dark, fontFamily: 'Georgia, serif', marginBottom: '20px' }}>
            {isWorkSession ? '⚙️ Sesión de Trabajo' : '☕ Descanso'}
          </h2>
          <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto', marginBottom: '20px' }}>
            <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r="95" fill="none" stroke={C.cream} strokeWidth="8" />
              <circle
                cx="100"
                cy="100"
                r="95"
                fill="none"
                stroke={isWorkSession ? C.accent : C.success}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: C.dark }}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => setIsRunning(!isRunning)}
              style={{
                padding: '10px 20px', backgroundColor: C.accent, color: C.warmWhite, border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Pausa' : 'Iniciar'}
            </button>
            <button
              onClick={() => { setTotalSeconds(isWorkSession ? workMin * 60 : breakMin * 60); setIsRunning(false); }}
              style={{ padding: '10px 20px', backgroundColor: C.warning, color: C.warmWhite, border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <RotateCcw size={20} />
              Reiniciar
            </button>
          </div>
        </div>

        {/* Presets & Stats */}
        <div>
          <h3 style={{ color: C.dark, marginBottom: '15px', fontFamily: 'Georgia, serif' }}>Presets</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {[[15, 3], [25, 5], [50, 10]].map(([w, b]) => (
              <button
                key={`${w}-${b}`}
                onClick={() => { setWorkMin(w); setBreakMin(b); setTotalSeconds(w * 60); setIsWorkSession(true); setIsRunning(false); }}
                style={{
                  padding: '10px', backgroundColor: C.cream, border: `2px solid ${C.tan}`, borderRadius: '6px', cursor: 'pointer', color: C.dark,
                }}
              >
                {w}min / {b}min
              </button>
            ))}
          </div>
          <div style={{ backgroundColor: C.lightCream, padding: '15px', borderRadius: '8px' }}>
            <p style={{ color: C.dark, margin: '5px 0' }}>
              <strong>Hoy completadas:</strong> {completedToday}
            </p>
            <p style={{ color: C.dark, margin: '5px 0' }}>
              <strong>Tiempo total:</strong> {completedToday * workMin} minutos
            </p>
            <p style={{ color: C.dark, margin: '5px 0' }}>
              <strong>Mejor racha:</strong> 12 sesiones
            </p>
          </div>
        </div>
      </div>

      {/* Current Task Input */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', color: C.dark, marginBottom: '8px', fontWeight: 'bold' }}>Tarea actual</label>
        <input
          type="text"
          value={currentTask}
          onChange={e => setCurrentTask(e.target.value)}
          placeholder="Describe la tarea en la que trabajarás..."
          style={{
            width: '100%', padding: '10px', border: `2px solid ${C.tan}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
          }}
        />
      </div>

      {/* Session History */}
      <div>
        <h3 style={{ color: C.dark, fontFamily: 'Georgia, serif', marginBottom: '15px' }}>Histórico de sesiones (últimas 10)</h3>
        <div style={{ backgroundColor: C.paper, borderRadius: '8px', overflow: 'hidden', border: `1px solid ${C.tan}` }}>
          {sessions.slice(0, 10).map(session => (
            <div key={session.id} style={{ padding: '12px', borderBottom: `1px solid ${C.lightCream}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: C.dark, fontWeight: 'bold', margin: '0 0 4px 0' }}>{session.task}</p>
                <p style={{ color: C.tan, fontSize: '12px', margin: 0 }}>{session.timestamp.toLocaleTimeString()}</p>
              </div>
              <span style={{ backgroundColor: C.accentLight, color: C.dark, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                {session.duration} min
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== KANBAN TAB ==========
function KanbanTab() {
  const { objectives, recalcObjectiveProgress } = useOKRStore();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const initialKanban: { [key: string]: KanbanCard[] } = {
    todo: [
      { id: '1', title: 'Diseñar nueva interfaz', priority: 'Alta', dueDate: '2026-04-08', category: 'Diseño', weight: 2 },
      { id: '2', title: 'Revisar propuesta de cliente', priority: 'Media', dueDate: '2026-04-10', category: 'Reunión', weight: 1 },
      { id: '3', title: 'Actualizar documentación', priority: 'Baja', category: 'Documentación', weight: 1 },
    ],
    inProgress: [
      { id: '4', title: 'Implementar autenticación', priority: 'Alta', dueDate: '2026-04-07', category: 'Desarrollo', weight: 3 },
      { id: '5', title: 'Optimizar base de datos', priority: 'Media', dueDate: '2026-04-09', category: 'Backend', weight: 2 },
    ],
    done: [
      { id: '6', title: 'Setup del proyecto', priority: 'Alta', category: 'Setup', weight: 1 },
      { id: '7', title: 'Crear repositorio Git', priority: 'Media', category: 'DevOps', weight: 1 },
      { id: '8', title: 'Configurar CI/CD', priority: 'Media', category: 'DevOps', weight: 2 },
    ],
  };
  const [kanban, setKanban] = useLocalStorage<{ [key: string]: KanbanCard[] }>("productivity_kanban", initialKanban);

  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardPriority, setNewCardPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [newCardCategory, setNewCardCategory] = useState('Desarrollo');
  const [newCardObjectiveId, setNewCardObjectiveId] = useState('');
  const [newCardWeight, setNewCardWeight] = useState(1);

  const getAllCards = (k: { [key: string]: KanbanCard[] }) =>
    Object.entries(k).flatMap(([col, cards]) => cards.map(c => ({ ...c, column: col })));

  const moveCard = (cardId: string, fromColumn: string, toColumn: string) => {
    setKanban(prev => {
      const card = prev[fromColumn].find(c => c.id === cardId);
      if (!card) return prev;
      const next = {
        ...prev,
        [fromColumn]: prev[fromColumn].filter(c => c.id !== cardId),
        [toColumn]: [...prev[toColumn], card],
      };

      // When moving to Done, update OKR progress
      if (toColumn === 'done' && card.objectiveId) {
        const allCards = getAllCards(next).map(c => ({
          objectiveId: c.objectiveId ?? '',
          weight: c.weight,
          done: c.column === 'done',
        })).filter(c => c.objectiveId === card.objectiveId);
        recalcObjectiveProgress(card.objectiveId, allCards);
        const obj = objectives.find(o => o.id === card.objectiveId);
        if (obj) {
          const total = allCards.reduce((s, c) => s + c.weight, 0);
          const done = allCards.filter(c => c.done).reduce((s, c) => s + c.weight, 0);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          setTimeout(() => showToast(`OKR actualizado: "${obj.title}" → ${pct}%`), 50);
        }
      }
      // When un-moving from Done, also recalc
      if (fromColumn === 'done' && card.objectiveId) {
        const allCards = getAllCards(next).map(c => ({
          objectiveId: c.objectiveId ?? '',
          weight: c.weight,
          done: c.column === 'done',
        })).filter(c => c.objectiveId === card.objectiveId);
        recalcObjectiveProgress(card.objectiveId, allCards);
      }

      return next;
    });
  };

  const addCard = (column: string) => {
    if (!newCardTitle.trim()) return;
    const newCard: KanbanCard = {
      id: Date.now().toString(),
      title: newCardTitle,
      priority: newCardPriority,
      category: newCardCategory,
      weight: newCardWeight,
      objectiveId: newCardObjectiveId || undefined,
    };
    setKanban(prev => ({ ...prev, [column]: [...prev[column], newCard] }));
    setNewCardTitle('');
    setNewCardObjectiveId('');
    setNewCardWeight(1);
  };

  const deleteCard = (cardId: string) => {
    setKanban(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(col => {
        updated[col] = updated[col].filter(c => c.id !== cardId);
      });
      return updated;
    });
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'Alta') return C.danger;
    if (priority === 'Media') return C.warning;
    return C.success;
  };

  const getObjectiveLabel = (id: string) => objectives.find(o => o.id === id);

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, backgroundColor: C.success, color: C.paper, padding: '12px 20px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={16} /> {toast}
        </div>
      )}

      <div style={{ marginBottom: '20px', backgroundColor: C.cream, padding: '18px', borderRadius: '10px' }}>
        <h3 style={{ color: C.dark, margin: '0 0 15px 0', fontFamily: 'Georgia, serif' }}>Agregar tarjeta</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={newCardTitle}
            onChange={e => setNewCardTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCard('todo')}
            placeholder="Título de la tarea..."
            style={{ padding: '10px', border: `2px solid ${C.tan}`, borderRadius: '6px', fontSize: '14px' }}
          />
          <select
            value={newCardPriority}
            onChange={e => setNewCardPriority(e.target.value as 'Alta' | 'Media' | 'Baja')}
            style={{ padding: '10px', border: `2px solid ${C.tan}`, borderRadius: '6px', fontSize: '14px' }}
          >
            <option>Alta</option>
            <option>Media</option>
            <option>Baja</option>
          </select>
          <input
            type="text"
            value={newCardCategory}
            onChange={e => setNewCardCategory(e.target.value)}
            placeholder="Categoría..."
            style={{ padding: '10px', border: `2px solid ${C.tan}`, borderRadius: '6px', fontSize: '14px' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', gap: '10px' }}>
          <select
            value={newCardObjectiveId}
            onChange={e => setNewCardObjectiveId(e.target.value)}
            style={{ padding: '10px', border: `2px solid ${C.tan}`, borderRadius: '6px', fontSize: '13px', color: newCardObjectiveId ? C.dark : C.warm }}
          >
            <option value="">Sin objetivo OKR</option>
            {objectives.map(o => (
              <option key={o.id} value={o.id}>{o.emoji} {o.title}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: C.warm, whiteSpace: 'nowrap' }}>Peso:</label>
            <input
              type="number"
              min={1}
              max={10}
              value={newCardWeight}
              onChange={e => setNewCardWeight(Number(e.target.value))}
              style={{ padding: '10px', border: `2px solid ${C.tan}`, borderRadius: '6px', fontSize: '14px', width: '100%' }}
            />
          </div>
          <button
            onClick={() => addCard('todo')}
            style={{ padding: '10px', backgroundColor: C.accent, color: C.warmWhite, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Agregar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {(['todo', 'inProgress', 'done'] as const).map(column => (
          <div key={column} style={{ backgroundColor: C.lightCream, borderRadius: '8px', padding: '15px', minHeight: '600px' }}>
            <h3 style={{ color: C.dark, fontFamily: 'Georgia, serif', marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {column === 'todo' && 'Por Hacer'}
              {column === 'inProgress' && 'En Progreso'}
              {column === 'done' && 'Completado'}
              <span style={{ backgroundColor: C.accent, color: C.warmWhite, padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                {kanban[column].length}
              </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {kanban[column].map(card => {
                const linkedObj = card.objectiveId ? getObjectiveLabel(card.objectiveId) : null;
                return (
                  <div key={card.id} style={{ backgroundColor: C.paper, padding: '12px', borderRadius: '8px', border: `2px solid ${linkedObj ? C.accent : C.tan}`, boxShadow: linkedObj ? `0 0 0 1px ${C.accentGlow}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <p style={{ color: C.dark, margin: '0', fontWeight: 'bold', flex: 1, fontSize: '13px' }}>{card.title}</p>
                      <button
                        onClick={() => deleteCard(card.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, padding: '0 0 0 6px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ backgroundColor: getPriorityColor(card.priority), color: C.warmWhite, padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                        {card.priority}
                      </span>
                      <span style={{ backgroundColor: C.infoLight, color: C.dark, padding: '2px 7px', borderRadius: '4px', fontSize: '11px' }}>
                        {card.category}
                      </span>
                      <span style={{ backgroundColor: C.lightCream, color: C.warm, padding: '2px 7px', borderRadius: '4px', fontSize: '11px' }}>
                        ×{card.weight}
                      </span>
                    </div>
                    {linkedObj && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', backgroundColor: C.accentGlow, borderRadius: '6px', marginBottom: '8px' }}>
                        <Target size={11} color={C.dark} />
                        <span style={{ fontSize: '11px', color: C.dark, fontWeight: '600' }}>{linkedObj.emoji} {linkedObj.title}</span>
                      </div>
                    )}
                    {card.dueDate && <p style={{ color: C.tan, fontSize: '12px', margin: '0 0 8px 0' }}>Vence: {card.dueDate}</p>}
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {column === 'todo' && (
                        <button
                          onClick={() => moveCard(card.id, column, 'inProgress')}
                          style={{ flex: 1, padding: '6px', backgroundColor: C.accentLight, color: C.dark, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
                        >
                          <ChevronRight size={14} /> Siguiente
                        </button>
                      )}
                      {column === 'inProgress' && (
                        <>
                          <button
                            onClick={() => moveCard(card.id, column, 'todo')}
                            style={{ flex: 1, padding: '6px', backgroundColor: C.lightTan, color: C.dark, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
                          >
                            <ChevronLeft size={14} /> Atrás
                          </button>
                          <button
                            onClick={() => moveCard(card.id, column, 'done')}
                            style={{ flex: 1, padding: '6px', backgroundColor: C.accentLight, color: C.dark, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
                          >
                            <ChevronRight size={14} /> Listo ✓
                          </button>
                        </>
                      )}
                      {column === 'done' && (
                        <button
                          onClick={() => moveCard(card.id, column, 'inProgress')}
                          style={{ flex: 1, padding: '6px', backgroundColor: C.lightTan, color: C.dark, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
                        >
                          <ChevronLeft size={14} /> Deshacer
                        </button>
                      )}
                      {column === 'done' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Eliminar "${card.title}"?`)) deleteCard(card.id);
                          }}
                          style={{ flex: 1, padding: '6px', backgroundColor: C.dangerLight, color: C.danger, border: `1px solid ${C.danger}`, borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== TASKS TAB (EISENHOWER MATRIX) ==========
function TasksTab() {
  const initialTasks = {
    urgent_important: [
      { id: '1', name: 'Entregar proyecto cliente', dueDate: '2026-04-06', tags: ['Trabajo'], completed: false },
      { id: '2', name: 'Resolver bug crítico', dueDate: '2026-04-06', tags: ['Trabajo'], completed: false },
    ],
    important: [
      { id: '3', name: 'Planificar próximo sprint', dueDate: '2026-04-12', tags: ['Trabajo'], completed: false },
      { id: '4', name: 'Mejorar performance', dueDate: '2026-04-15', tags: ['Trabajo'], completed: false },
      { id: '5', name: 'Escribir tests', dueDate: '2026-04-18', tags: ['Trabajo'], completed: false },
    ],
    urgent: [
      { id: '6', name: 'Responder emails', dueDate: '2026-04-06', tags: ['Trabajo'], completed: false },
      { id: '7', name: 'Llamada con stakeholder', dueDate: '2026-04-06', tags: ['Trabajo'], completed: true },
    ],
    neither: [
      { id: '8', name: 'Leer artículo de tecnología', tags: ['Personal'], completed: false },
      { id: '9', name: 'Organizar escritorio', tags: ['Personal'], completed: false },
    ],
  };
  const [tasks, setTasks] = useLocalStorage<{ [key: string]: Task[] }>("productivity_tasks", initialTasks);

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskQuadrant, setNewTaskQuadrant] = useState('urgent_important');
  const [filterTag, setFilterTag] = useState('');

  const addTask = (quadrant: string) => {
    if (!newTaskName.trim()) return;
    const newTask: Task = { id: Date.now().toString(), name: newTaskName, tags: ['Trabajo'], completed: false };
    setTasks(prev => ({ ...prev, [quadrant]: [...prev[quadrant], newTask] }));
    setNewTaskName('');
  };

  const toggleTask = (quadrant: string, taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [quadrant]: prev[quadrant].map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    }));
  };

  const deleteTask = (quadrant: string, taskId: string) => {
    setTasks(prev => ({ ...prev, [quadrant]: prev[quadrant].filter(t => t.id !== taskId) }));
  };

  const quadrants = [
    { key: 'urgent_important', label: 'Urgente e Importante', color: C.danger, bgColor: '#FFE5E2' },
    { key: 'important', label: 'Importante', color: C.info, bgColor: '#DCF0FF' },
    { key: 'urgent', label: 'Urgente', color: C.warning, bgColor: '#FFF4E5' },
    { key: 'neither', label: 'Ni urgente ni importante', color: C.medium, bgColor: '#F0F0F0' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px', backgroundColor: C.cream, padding: '15px', borderRadius: '8px' }}>
        <h3 style={{ color: C.dark, margin: '0 0 15px 0', fontFamily: 'Georgia, serif' }}>Agregar tarea</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 100px', gap: '10px' }}>
          <input
            type="text"
            value={newTaskName}
            onChange={e => setNewTaskName(e.target.value)}
            placeholder="Nombre de la tarea..."
            style={{ padding: '10px', border: `2px solid ${C.tan}`, borderRadius: '6px', fontSize: '14px' }}
          />
          <select
            value={newTaskQuadrant}
            onChange={e => setNewTaskQuadrant(e.target.value)}
            style={{ padding: '10px', border: `2px solid ${C.tan}`, borderRadius: '6px', fontSize: '14px' }}
          >
            {quadrants.map(q => <option key={q.key} value={q.key}>{q.label}</option>)}
          </select>
          <button
            onClick={() => addTask(newTaskQuadrant)}
            style={{ padding: '10px', backgroundColor: C.accent, color: C.warmWhite, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Agregar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {quadrants.map(quadrant => (
          <div key={quadrant.key} style={{ backgroundColor: quadrant.bgColor, borderRadius: '8px', padding: '15px', border: `3px solid ${quadrant.color}` }}>
            <h3 style={{ color: quadrant.color, fontFamily: 'Georgia, serif', margin: '0 0 15px 0' }}>
              {quadrant.label}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks[quadrant.key as keyof typeof tasks].map(task => (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: C.paper,
                    padding: '10px',
                    borderRadius: '6px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    opacity: task.completed ? 0.6 : 1,
                  }}
                >
                  <button
                    onClick={() => toggleTask(quadrant.key as string, task.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '2px' }}
                  >
                    {task.completed ? (
                      <Check size={18} color={C.success} />
                    ) : (
                      <Square size={18} color={C.tan} />
                    )}
                  </button>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: C.dark,
                        margin: '0 0 4px 0',
                        fontWeight: 'bold',
                        textDecoration: task.completed ? 'line-through' : 'none',
                      }}
                    >
                      {task.name}
                    </p>
                    {task.dueDate && (
                      <p style={{ color: C.tan, fontSize: '12px', margin: 0 }}>
                        Vence: {task.dueDate}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTask(quadrant.key as string, task.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

