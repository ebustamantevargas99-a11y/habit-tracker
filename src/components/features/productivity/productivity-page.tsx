import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore, type ProductivityTab } from '@/stores/app-store';
import { useOKRStore } from '@/stores/okr-store';
import { useProductivityStore } from '@/stores/productivity-store';
import HabitTrackerPage from '@/components/features/habits/habit-tracker-page';
import DailyCommandCenter from './daily-command-center';
import ProjectionDashboard from './projection-dashboard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Play, Pause, RotateCcw, Plus, Trash2, ChevronRight, ChevronLeft, Clock, Check, X, ChevronDown, ChevronUp, Target,
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

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string;
  createdAt: string;
}



const TAB_KEYS: ProductivityTab[] = ['command', 'habits', 'projects', 'pomodoro', 'projection'];
const TAB_LABELS: Record<ProductivityTab, string> = {
  command:    '⚡ Operations Center',
  habits:     '🔁 Habit Tracker',
  projects:   '📋 Project Management',
  pomodoro:   '🍅 Pomodoro',
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
      {activeTab === 'command'     && <DailyCommandCenter />}
      {activeTab === 'habits'      && <HabitTrackerPage />}
      {activeTab === 'projects'    && <KanbanTab />}
      {activeTab === 'pomodoro'    && <PomodoroTab />}
      {activeTab === 'projection'  && <ProjectionDashboard />}
    </div>
  );
}

// ========== POMODORO TAB ==========
function PomodoroTab() {
  const { pomodoroSessions, addPomodoroSession, initialize } = useProductivityStore();
  useEffect(() => { initialize(); }, [initialize]);

  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [currentTask, setCurrentTask] = useState('');

  const completedToday = pomodoroSessions.filter(s => s.isWork).length;
  const sessions: PomodoroSession[] = pomodoroSessions.map(s => ({
    id: s.id,
    task: s.task ?? '',
    duration: s.duration,
    timestamp: new Date(s.completedAt),
  }));

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTotalSeconds(prev => {
        if (prev <= 1) {
          if (isWorkSession) {
            setIsWorkSession(false);
            if (currentTask) {
              addPomodoroSession({ task: currentTask, duration: workMin, isWork: true });
              setCurrentTask('');
            } else {
              addPomodoroSession({ duration: workMin, isWork: true });
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
  }, [isRunning, workMin, breakMin, isWorkSession, currentTask, addPomodoroSession]);

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

// ========== PROJECT MANAGEMENT TAB ==========
const PROJECT_COLORS = ['#B8860B','#7A9E3E','#5A8FA8','#D4943A','#C0544F','#6B4226','#8B6542','#A0845C'];
const PROJECT_EMOJIS = ['🚀','💼','🎯','🏗️','💡','🔧','📱','🌐','🎨','📊'];

function KanbanTab() {
  const { objectives, recalcObjectiveProgress } = useOKRStore();
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    addProject: storeAddProject,
    deleteProject: storeDeleteProject,
    addTask: storeAddTask,
    deleteTask: storeDeleteTask,
    moveTaskStatus,
    initialize: initProductivity,
  } = useProductivityStore();
  useEffect(() => { initProductivity(); }, [initProductivity]);

  const [toast, setToast] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
  const [newProjectEmoji, setNewProjectEmoji] = useState(PROJECT_EMOJIS[0]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Derive Kanban board from active project's tasks
  const activeProjectData = projects.find(p => p.id === activeProjectId) ?? projects[0];
  const taskToCard = (t: { id: string; title: string; priority: string | null; dueDate: string | null; description: string | null; objectiveId: string | null; weight: number }): KanbanCard => ({
    id: t.id,
    title: t.title,
    priority: (t.priority as 'Alta' | 'Media' | 'Baja') ?? 'Media',
    dueDate: t.dueDate ?? undefined,
    category: t.description ?? 'General',
    objectiveId: t.objectiveId ?? undefined,
    weight: t.weight,
  });
  const emptyBoard = { todo: [] as KanbanCard[], inProgress: [] as KanbanCard[], done: [] as KanbanCard[] };
  const kanban = activeProjectData ? {
    todo: activeProjectData.tasks.filter(t => t.status === 'todo').map(taskToCard),
    inProgress: activeProjectData.tasks.filter(t => t.status === 'inProgress').map(taskToCard),
    done: activeProjectData.tasks.filter(t => t.status === 'done').map(taskToCard),
  } : emptyBoard;

  const activeProject = activeProjectData;

  const addProject = () => {
    if (!newProjectName.trim()) return;
    storeAddProject({
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || undefined,
      color: newProjectColor,
      emoji: newProjectEmoji,
    });
    setShowProjectForm(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  const deleteProject = (id: string) => {
    if (projects.length <= 1) return;
    if (!window.confirm(`¿Eliminar el proyecto "${projects.find(p => p.id === id)?.name}"? Se eliminarán todas sus tareas.`)) return;
    storeDeleteProject(id);
  };

  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardPriority, setNewCardPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [newCardCategory, setNewCardCategory] = useState('Desarrollo');
  const [newCardObjectiveId, setNewCardObjectiveId] = useState('');
  const [newCardWeight, setNewCardWeight] = useState(1);
  const [newCardDueDate, setNewCardDueDate] = useState('');

  const getAllCardsFlat = () => {
    if (!activeProjectData) return [];
    return activeProjectData.tasks.map(t => ({
      ...taskToCard(t),
      column: t.status,
    }));
  };

  const moveCard = (cardId: string, fromColumn: string, toColumn: string) => {
    if (!activeProjectData) return;
    const card = kanban[fromColumn as keyof typeof kanban]?.find(c => c.id === cardId);
    if (!card) return;

    moveTaskStatus(activeProjectData.id, cardId, toColumn);

    // OKR progress recalc
    if ((toColumn === 'done' || fromColumn === 'done') && card.objectiveId) {
      const allCards = getAllCardsFlat()
        .map(c => ({
          objectiveId: c.objectiveId ?? '',
          weight: c.weight,
          done: c.id === cardId ? toColumn === 'done' : c.column === 'done',
        }))
        .filter(c => c.objectiveId === card.objectiveId);
      recalcObjectiveProgress(card.objectiveId, allCards);
      if (toColumn === 'done') {
        const obj = objectives.find(o => o.id === card.objectiveId);
        if (obj) {
          const total = allCards.reduce((s, c) => s + c.weight, 0);
          const done = allCards.filter(c => c.done).reduce((s, c) => s + c.weight, 0);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          setTimeout(() => showToast(`OKR actualizado: "${obj.title}" → ${pct}%`), 50);
        }
      }
    }
  };

  const addCard = (column: string) => {
    if (!newCardTitle.trim() || !activeProjectData) return;
    storeAddTask(activeProjectData.id, {
      title: newCardTitle.trim(),
      description: newCardCategory || undefined,
      status: column,
      priority: newCardPriority,
      objectiveId: newCardObjectiveId || undefined,
      weight: newCardWeight,
      dueDate: newCardDueDate || undefined,
      orderIndex: kanban[column as keyof typeof kanban]?.length ?? 0,
    });
    setNewCardTitle('');
    setNewCardObjectiveId('');
    setNewCardWeight(1);
    setNewCardDueDate('');
  };

  const deleteCard = (cardId: string) => {
    if (!activeProjectData) return;
    storeDeleteTask(activeProjectData.id, cardId);
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'Alta') return C.danger;
    if (priority === 'Media') return C.warning;
    return C.success;
  };

  const getObjectiveLabel = (id: string) => objectives.find(o => o.id === id);

  const inp = { padding: '9px 12px', border: `1px solid ${C.tan}`, borderRadius: '8px', fontSize: '13px', backgroundColor: C.paper, color: C.dark, width: '100%', boxSizing: 'border-box' as const };

  return (
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'start' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, backgroundColor: C.success, color: C.paper, padding: '12px 20px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={16} /> {toast}
        </div>
      )}

      {/* ── Project Sidebar ── */}
      <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: '14px', padding: '16px', position: 'sticky', top: '0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: '700', color: C.dark, fontSize: '15px' }}>Proyectos</span>
          <button onClick={() => setShowProjectForm(!showProjectForm)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: C.accent, color: C.paper, border: 'none', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>+</button>
        </div>

        {/* New project form */}
        {showProjectForm && (
          <div style={{ backgroundColor: C.lightCream, borderRadius: '10px', padding: '12px', marginBottom: '14px', display: 'grid', gap: '8px' }}>
            <input placeholder="Nombre del proyecto *" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addProject()} style={inp} />
            <input placeholder="Descripción (opcional)" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} style={inp} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: C.warm, display: 'block', marginBottom: '4px' }}>Emoji</label>
                <select value={newProjectEmoji} onChange={e => setNewProjectEmoji(e.target.value)} style={inp}>
                  {PROJECT_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: C.warm, display: 'block', marginBottom: '4px' }}>Color</label>
                <select value={newProjectColor} onChange={e => setNewProjectColor(e.target.value)} style={inp}>
                  {PROJECT_COLORS.map(c => <option key={c} value={c} style={{ backgroundColor: c, color: '#fff' }}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={addProject} style={{ flex: 1, padding: '7px', backgroundColor: C.success, color: C.paper, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Crear</button>
              <button onClick={() => { setShowProjectForm(false); setNewProjectName(''); }} style={{ flex: 1, padding: '7px', backgroundColor: C.cream, color: C.dark, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Project list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {projects.map(p => {
            const total = p.tasks.length;
            const done = p.tasks.filter(t => t.status === 'done').length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const isActive = p.id === activeProjectId;
            return (
              <div
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                style={{ padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', backgroundColor: isActive ? p.color : C.lightCream, border: `2px solid ${isActive ? p.color : 'transparent'}`, transition: 'all 0.15s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: isActive ? C.paper : C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                    {p.emoji} {p.name}
                  </span>
                  {!isActive && projects.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); deleteProject(p.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, padding: '0', flexShrink: 0 }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
                <div style={{ height: '4px', backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : C.lightTan, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: isActive ? C.paper : p.color, borderRadius: '2px', transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontSize: '10px', color: isActive ? 'rgba(255,255,255,0.8)' : C.warm, marginTop: '3px', display: 'block' }}>{done}/{total} tareas · {pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Board ── */}
      <div>
        {/* Project header */}
        {activeProject && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '14px 18px', backgroundColor: C.paper, border: `2px solid ${activeProject.color}`, borderRadius: '12px' }}>
            <span style={{ fontSize: '26px' }}>{activeProject.emoji}</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', color: C.dark, fontSize: '18px' }}>{activeProject.name}</h2>
              {activeProject.description && <p style={{ margin: 0, fontSize: '12px', color: C.warm }}>{activeProject.description}</p>}
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: C.warm }}>
              {(kanban.todo?.length ?? 0)} por hacer · {(kanban.inProgress?.length ?? 0)} en progreso · {(kanban.done?.length ?? 0)} listas
            </div>
          </div>
        )}

        {/* Add card form */}
        <div style={{ marginBottom: '20px', backgroundColor: C.cream, padding: '16px', borderRadius: '10px' }}>
          <h3 style={{ color: C.dark, margin: '0 0 12px 0', fontFamily: 'Georgia, serif', fontSize: '15px' }}>Agregar tarea</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 130px 110px', gap: '8px', marginBottom: '8px' }}>
            <input type="text" value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCard('todo')} placeholder="Título de la tarea..." style={{ ...inp, padding: '9px 12px' }} />
            <select value={newCardPriority} onChange={e => setNewCardPriority(e.target.value as 'Alta' | 'Media' | 'Baja')} style={inp}>
              <option>Alta</option><option>Media</option><option>Baja</option>
            </select>
            <input type="text" value={newCardCategory} onChange={e => setNewCardCategory(e.target.value)} placeholder="Categoría..." style={inp} />
            <input type="date" value={newCardDueDate} onChange={e => setNewCardDueDate(e.target.value)} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px', gap: '8px' }}>
            <select value={newCardObjectiveId} onChange={e => setNewCardObjectiveId(e.target.value)} style={{ ...inp, color: newCardObjectiveId ? C.dark : C.warm }}>
              <option value="">Sin objetivo OKR</option>
              {objectives.map(o => <option key={o.id} value={o.id}>{o.emoji} {o.title}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <label style={{ fontSize: '11px', color: C.warm, whiteSpace: 'nowrap' }}>Peso:</label>
              <input type="number" min={1} max={10} value={newCardWeight} onChange={e => setNewCardWeight(Number(e.target.value))} style={{ ...inp, width: '60px' }} />
            </div>
            <button onClick={() => addCard('todo')} style={{ padding: '9px', backgroundColor: C.accent, color: C.warmWhite, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Agregar</button>
          </div>
        </div>

        {/* Kanban columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {(['todo', 'inProgress', 'done'] as const).map(column => {
            const colCards = kanban[column] ?? [];
            const colColors = { todo: C.info, inProgress: C.warning, done: C.success };
            const colLabels = { todo: 'Por Hacer', inProgress: 'En Progreso', done: 'Completado' };
            return (
              <div key={column} style={{ backgroundColor: C.lightCream, borderRadius: '10px', padding: '14px', minHeight: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colColors[column] }} />
                    <span style={{ fontFamily: 'Georgia, serif', fontWeight: '700', color: C.dark, fontSize: '14px' }}>{colLabels[column]}</span>
                  </div>
                  <span style={{ backgroundColor: colColors[column], color: C.paper, padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{colCards.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colCards.map(card => {
                    const linkedObj = card.objectiveId ? getObjectiveLabel(card.objectiveId) : null;
                    return (
                      <div key={card.id} style={{ backgroundColor: C.paper, padding: '12px', borderRadius: '8px', border: `2px solid ${linkedObj ? C.accent : C.tan}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <p style={{ color: C.dark, margin: '0', fontWeight: '700', flex: 1, fontSize: '13px', lineHeight: 1.3 }}>{card.title}</p>
                          <button onClick={() => deleteCard(card.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, padding: '0 0 0 6px', flexShrink: 0 }}><Trash2 size={13} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '7px', flexWrap: 'wrap' }}>
                          <span style={{ backgroundColor: getPriorityColor(card.priority), color: C.paper, padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>{card.priority}</span>
                          <span style={{ backgroundColor: C.infoLight, color: C.dark, padding: '2px 7px', borderRadius: '4px', fontSize: '10px' }}>{card.category}</span>
                          <span style={{ backgroundColor: C.lightCream, color: C.warm, padding: '2px 7px', borderRadius: '4px', fontSize: '10px' }}>×{card.weight}</span>
                        </div>
                        {linkedObj && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 7px', backgroundColor: C.accentGlow, borderRadius: '5px', marginBottom: '7px' }}>
                            <Target size={10} color={C.dark} />
                            <span style={{ fontSize: '10px', color: C.dark, fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{linkedObj.emoji} {linkedObj.title}</span>
                          </div>
                        )}
                        {card.dueDate && (
                          <p style={{ color: new Date(card.dueDate + 'T12:00:00') < new Date() ? C.danger : C.warm, fontSize: '11px', margin: '0 0 8px 0', fontWeight: new Date(card.dueDate + 'T12:00:00') < new Date() ? '700' : '400' }}>
                            {new Date(card.dueDate + 'T12:00:00') < new Date() ? '⚠ Venció: ' : '📅 Vence: '}{card.dueDate}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {column === 'todo' && (
                            <button onClick={() => moveCard(card.id, column, 'inProgress')} style={{ flex: 1, padding: '5px', backgroundColor: C.accentLight, color: C.dark, border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                              <ChevronRight size={13} /> Iniciar
                            </button>
                          )}
                          {column === 'inProgress' && (
                            <>
                              <button onClick={() => moveCard(card.id, column, 'todo')} style={{ flex: 1, padding: '5px', backgroundColor: C.lightTan, color: C.dark, border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <ChevronLeft size={13} /> Atrás
                              </button>
                              <button onClick={() => moveCard(card.id, column, 'done')} style={{ flex: 1, padding: '5px', backgroundColor: C.success, color: C.paper, border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <Check size={13} /> Listo
                              </button>
                            </>
                          )}
                          {column === 'done' && (
                            <>
                              <button onClick={() => moveCard(card.id, column, 'inProgress')} style={{ flex: 1, padding: '5px', backgroundColor: C.lightTan, color: C.dark, border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <ChevronLeft size={13} /> Deshacer
                              </button>
                              <button onClick={() => { if (window.confirm(`¿Eliminar "${card.title}"?`)) deleteCard(card.id); }} style={{ flex: 1, padding: '5px', backgroundColor: C.dangerLight, color: C.danger, border: `1px solid ${C.danger}`, borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <Trash2 size={12} /> Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


