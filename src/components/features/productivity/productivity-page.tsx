'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore, type ProductivityTab } from '@/stores/app-store';
import { useOKRStore } from '@/stores/okr-store';
import { useProductivityStore } from '@/stores/productivity-store';
import HabitTrackerPage from '@/components/features/habits/habit-tracker-page';
import DailyCommandCenter from './daily-command-center';
import ProjectionDashboard from './projection-dashboard';
import { cn, ErrorBanner } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Play, Pause, RotateCcw, Plus, Trash2, ChevronRight, ChevronLeft, Clock, Check, X, ChevronDown, ChevronUp, Target,
} from 'lucide-react';

// SVG stroke props still reference these hex values (not inline styles)
const C = {
  dark: '#3D2B1F', cream: '#EDE0D4', accent: '#B8860B', success: '#7A9E3E',
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
  const { error, clearError } = useProductivityStore();

  const [activeTab, setActiveTab] = useState<ProductivityTab>(productivitySubTab);
  useEffect(() => { setActiveTab(productivitySubTab); }, [productivitySubTab]);

  const switchTab = (tab: ProductivityTab) => {
    setActiveTab(tab);
    setProductivitySubTab(tab);
  };

  return (
    <div className="bg-brand-warm-white">
      <ErrorBanner error={error} onDismiss={clearError} />
      {/* Tab Navigation */}
      <div className="flex gap-[10px] mb-[30px] border-b-2 border-brand-tan pb-[10px] flex-wrap">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={cn(
              'px-5 py-[10px] border-none rounded-md cursor-pointer text-sm',
              activeTab === key
                ? 'bg-accent text-brand-warm-white font-bold'
                : 'bg-brand-cream text-brand-dark font-normal'
            )}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'command'    && <DailyCommandCenter />}
      {activeTab === 'habits'     && <HabitTrackerPage />}
      {activeTab === 'projects'   && <KanbanTab />}
      {activeTab === 'pomodoro'   && <PomodoroTab />}
      {activeTab === 'projection' && <ProjectionDashboard />}
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
    <div className="max-w-[900px] mx-auto">
      <div className="grid grid-cols-2 gap-[30px] mb-[40px]">
        {/* Timer */}
        <div className="text-center">
          <h2 className="text-brand-dark font-serif mb-5">
            {isWorkSession ? '⚙️ Sesión de Trabajo' : '☕ Descanso'}
          </h2>
          <div className="relative w-[200px] h-[200px] mx-auto mb-5">
            <svg width="200" height="200" className="-rotate-90">
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
                className="[transition:stroke-dashoffset_1s_linear]"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-[48px] font-bold text-brand-dark">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
          <div className="flex gap-[10px] justify-center mb-5">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-5 py-[10px] bg-accent text-brand-warm-white border-none rounded-md cursor-pointer flex items-center gap-[5px]"
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Pausa' : 'Iniciar'}
            </button>
            <button
              onClick={() => { setTotalSeconds(isWorkSession ? workMin * 60 : breakMin * 60); setIsRunning(false); }}
              className="px-5 py-[10px] bg-warning text-brand-warm-white border-none rounded-md cursor-pointer flex items-center gap-[5px]"
            >
              <RotateCcw size={20} />
              Reiniciar
            </button>
          </div>
        </div>

        {/* Presets & Stats */}
        <div>
          <h3 className="text-brand-dark mb-[15px] font-serif">Presets</h3>
          <div className="grid grid-cols-2 gap-[10px] mb-5">
            {[[15, 3], [25, 5], [50, 10]].map(([w, b]) => (
              <button
                key={`${w}-${b}`}
                onClick={() => { setWorkMin(w); setBreakMin(b); setTotalSeconds(w * 60); setIsWorkSession(true); setIsRunning(false); }}
                className="p-[10px] bg-brand-cream border-2 border-brand-tan rounded-md cursor-pointer text-brand-dark"
              >
                {w}min / {b}min
              </button>
            ))}
          </div>
          <div className="bg-brand-light-cream p-[15px] rounded-lg">
            <p className="text-brand-dark my-[5px]">
              <strong>Hoy completadas:</strong> {completedToday}
            </p>
            <p className="text-brand-dark my-[5px]">
              <strong>Tiempo total:</strong> {completedToday * workMin} minutos
            </p>
            <p className="text-brand-dark my-[5px]">
              <strong>Mejor racha:</strong> 12 sesiones
            </p>
          </div>
        </div>
      </div>

      {/* Current Task Input */}
      <div className="mb-[30px]">
        <label className="block text-brand-dark mb-2 font-bold">Tarea actual</label>
        <input
          type="text"
          value={currentTask}
          onChange={e => setCurrentTask(e.target.value)}
          placeholder="Describe la tarea en la que trabajarás..."
          className="w-full px-[10px] py-[10px] border-2 border-brand-tan rounded-md text-sm font-sans"
        />
      </div>

      {/* Session History */}
      <div>
        <h3 className="text-brand-dark font-serif mb-[15px]">Histórico de sesiones (últimas 10)</h3>
        <div className="bg-brand-paper rounded-lg overflow-hidden border border-brand-tan">
          {sessions.slice(0, 10).map(session => (
            <div key={session.id} className="px-3 py-[12px] border-b border-brand-light-cream flex justify-between items-center">
              <div>
                <p className="text-brand-dark font-bold m-0 mb-1">{session.task}</p>
                <p className="text-brand-tan text-xs m-0">{session.timestamp.toLocaleTimeString()}</p>
              </div>
              <span className="bg-accent-light text-brand-dark px-3 py-1 rounded-[20px] text-xs font-bold">
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

const INP = 'px-3 py-[9px] border border-brand-tan rounded-lg text-[13px] bg-brand-paper text-brand-dark w-full box-border';

const COL_CLASSES = {
  todo:       { dot: 'bg-info',    badge: 'bg-info text-brand-paper' },
  inProgress: { dot: 'bg-warning', badge: 'bg-warning text-brand-paper' },
  done:       { dot: 'bg-success', badge: 'bg-success text-brand-paper' },
} as const;

const PRIORITY_CLASSES: Record<string, string> = {
  Alta:  'bg-danger text-brand-paper',
  Media: 'bg-warning text-brand-paper',
  Baja:  'bg-success text-brand-paper',
};

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

  const getObjectiveLabel = (id: string) => objectives.find(o => o.id === id);

  return (
    <div className="relative grid [grid-template-columns:220px_1fr] gap-5 items-start">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] bg-success text-brand-paper px-5 py-3 rounded-[10px] font-semibold text-sm shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex items-center gap-2">
          <Target size={16} /> {toast}
        </div>
      )}

      {/* ── Project Sidebar ── */}
      <div className="bg-brand-paper border border-brand-light-cream rounded-[14px] p-4 sticky top-0">
        <div className="flex justify-between items-center mb-[14px]">
          <span className="font-serif font-bold text-brand-dark text-[15px]">Proyectos</span>
          <button
            onClick={() => setShowProjectForm(!showProjectForm)}
            className="w-7 h-7 rounded-full bg-accent text-brand-paper border-none cursor-pointer text-lg flex items-center justify-center font-bold"
          >
            +
          </button>
        </div>

        {/* New project form */}
        {showProjectForm && (
          <div className="bg-brand-light-cream rounded-[10px] p-3 mb-[14px] grid gap-2">
            <input
              placeholder="Nombre del proyecto *"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addProject()}
              className={INP}
            />
            <input
              placeholder="Descripción (opcional)"
              value={newProjectDesc}
              onChange={e => setNewProjectDesc(e.target.value)}
              className={INP}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-brand-warm block mb-1">Emoji</label>
                <select value={newProjectEmoji} onChange={e => setNewProjectEmoji(e.target.value)} className={INP}>
                  {PROJECT_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-brand-warm block mb-1">Color</label>
                <select value={newProjectColor} onChange={e => setNewProjectColor(e.target.value)} className={INP}>
                  {PROJECT_COLORS.map(c => (
                    <option key={c} value={c} style={{ backgroundColor: c, color: '#fff' }}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-[6px]">
              <button onClick={addProject} className="flex-1 py-[7px] bg-success text-brand-paper border-none rounded-md cursor-pointer font-bold text-xs">Crear</button>
              <button onClick={() => { setShowProjectForm(false); setNewProjectName(''); }} className="flex-1 py-[7px] bg-brand-cream text-brand-dark border-none rounded-md cursor-pointer text-xs">Cancelar</button>
            </div>
          </div>
        )}

        {/* Project list */}
        <div className="flex flex-col gap-[6px]">
          {projects.map(p => {
            const total = p.tasks.length;
            const done = p.tasks.filter(t => t.status === 'done').length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const isActive = p.id === activeProjectId;
            return (
              <div
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={cn(
                  'px-3 py-[10px] rounded-[10px] cursor-pointer border-2 border-transparent transition-all duration-150',
                  !isActive && 'bg-brand-light-cream'
                )}
                style={isActive ? { backgroundColor: p.color, borderColor: p.color } : undefined}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={cn('text-[13px] font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-[140px]', isActive ? 'text-brand-paper' : 'text-brand-dark')}>
                    {p.emoji} {p.name}
                  </span>
                  {!isActive && projects.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); deleteProject(p.id); }}
                      className="bg-transparent border-none cursor-pointer text-danger p-0 shrink-0"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <div className={cn('h-1 rounded-[2px] overflow-hidden', isActive ? 'bg-white/30' : 'bg-brand-light-tan')}>
                  <div
                    className={cn('h-full rounded-[2px] transition-[width] duration-[400ms]', isActive && 'bg-brand-paper')}
                    style={{ width: `${pct}%`, ...(!isActive ? { backgroundColor: p.color } : {}) }}
                  />
                </div>
                <span className={cn('text-[10px] mt-[3px] block', isActive ? 'text-white/80' : 'text-brand-warm')}>
                  {done}/{total} tareas · {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Board ── */}
      <div>
        {/* Project header */}
        {activeProject && (
          <div
            className="flex items-center gap-3 mb-5 px-[18px] py-[14px] bg-brand-paper border-2 rounded-xl"
            style={{ borderColor: activeProject.color }}
          >
            <span className="text-[26px]">{activeProject.emoji}</span>
            <div className="flex-1">
              <h2 className="m-0 font-serif text-brand-dark text-[18px]">{activeProject.name}</h2>
              {activeProject.description && <p className="m-0 text-xs text-brand-warm">{activeProject.description}</p>}
            </div>
            <div className="text-right text-xs text-brand-warm">
              {(kanban.todo?.length ?? 0)} por hacer · {(kanban.inProgress?.length ?? 0)} en progreso · {(kanban.done?.length ?? 0)} listas
            </div>
          </div>
        )}

        {/* Add card form */}
        <div className="mb-5 bg-brand-cream px-4 py-[16px] rounded-[10px]">
          <h3 className="text-brand-dark m-0 mb-3 font-serif text-[15px]">Agregar tarea</h3>
          <div className="grid [grid-template-columns:1fr_110px_130px_110px] gap-2 mb-2">
            <input
              type="text"
              value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCard('todo')}
              placeholder="Título de la tarea..."
              className={INP}
            />
            <select
              value={newCardPriority}
              onChange={e => setNewCardPriority(e.target.value as 'Alta' | 'Media' | 'Baja')}
              className={INP}
            >
              <option>Alta</option><option>Media</option><option>Baja</option>
            </select>
            <input type="text" value={newCardCategory} onChange={e => setNewCardCategory(e.target.value)} placeholder="Categoría..." className={INP} />
            <input type="date" value={newCardDueDate} onChange={e => setNewCardDueDate(e.target.value)} className={INP} />
          </div>
          <div className="grid [grid-template-columns:1fr_100px_90px] gap-2">
            <select
              value={newCardObjectiveId}
              onChange={e => setNewCardObjectiveId(e.target.value)}
              className={cn(INP, newCardObjectiveId ? 'text-brand-dark' : 'text-brand-warm')}
            >
              <option value="">Sin objetivo OKR</option>
              {objectives.map(o => <option key={o.id} value={o.id}>{o.emoji} {o.title}</option>)}
            </select>
            <div className="flex items-center gap-[5px]">
              <label className="text-[11px] text-brand-warm whitespace-nowrap">Peso:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={newCardWeight}
                onChange={e => setNewCardWeight(Number(e.target.value))}
                className={cn(INP, 'w-[60px]')}
              />
            </div>
            <button
              onClick={() => addCard('todo')}
              className="py-[9px] bg-accent text-brand-warm-white border-none rounded-lg cursor-pointer font-bold text-[13px]"
            >
              Agregar
            </button>
          </div>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-3 gap-4">
          {(['todo', 'inProgress', 'done'] as const).map(column => {
            const colCards = kanban[column] ?? [];
            const colLabels = { todo: 'Por Hacer', inProgress: 'En Progreso', done: 'Completado' };
            return (
              <div key={column} className="bg-brand-light-cream rounded-[10px] p-[14px] min-h-[500px]">
                <div className="flex justify-between items-center mb-[14px]">
                  <div className="flex items-center gap-[6px]">
                    <div className={cn('w-[10px] h-[10px] rounded-full', COL_CLASSES[column].dot)} />
                    <span className="font-serif font-bold text-brand-dark text-[14px]">{colLabels[column]}</span>
                  </div>
                  <span className={cn('px-2 py-[2px] rounded-[10px] text-[11px] font-bold', COL_CLASSES[column].badge)}>
                    {colCards.length}
                  </span>
                </div>
                <div className="flex flex-col gap-[10px]">
                  {colCards.map(card => {
                    const linkedObj = card.objectiveId ? getObjectiveLabel(card.objectiveId) : null;
                    const isOverdue = card.dueDate && new Date(card.dueDate + 'T12:00:00') < new Date();
                    return (
                      <div
                        key={card.id}
                        className={cn(
                          'bg-brand-paper p-3 rounded-lg border-2 shadow-[0_2px_8px_rgba(0,0,0,0.05)]',
                          linkedObj ? 'border-accent' : 'border-brand-tan'
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-brand-dark m-0 font-bold flex-1 text-[13px] leading-[1.3]">{card.title}</p>
                          <button
                            onClick={() => deleteCard(card.id)}
                            className="bg-transparent border-none cursor-pointer text-danger p-0 pl-[6px] shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="flex gap-[5px] mb-[7px] flex-wrap">
                          <span className={cn('px-[7px] py-[2px] rounded-[4px] text-[10px] font-bold', PRIORITY_CLASSES[card.priority])}>
                            {card.priority}
                          </span>
                          <span className="bg-info-light text-brand-dark px-[7px] py-[2px] rounded-[4px] text-[10px]">{card.category}</span>
                          <span className="bg-brand-light-cream text-brand-warm px-[7px] py-[2px] rounded-[4px] text-[10px]">×{card.weight}</span>
                        </div>
                        {linkedObj && (
                          <div className="flex items-center gap-1 px-[7px] py-[3px] bg-accent-glow rounded-[5px] mb-[7px]">
                            <Target size={10} color={C.dark} />
                            <span className="text-[10px] text-brand-dark font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                              {linkedObj.emoji} {linkedObj.title}
                            </span>
                          </div>
                        )}
                        {card.dueDate && (
                          <p className={cn('text-[11px] m-0 mb-2', isOverdue ? 'text-danger font-bold' : 'text-brand-warm font-normal')}>
                            {isOverdue ? '⚠ Venció: ' : '📅 Vence: '}{card.dueDate}
                          </p>
                        )}
                        <div className="flex gap-[5px]">
                          {column === 'todo' && (
                            <button
                              onClick={() => moveCard(card.id, column, 'inProgress')}
                              className="flex-1 p-[5px] bg-accent-light text-brand-dark border-none rounded-[5px] cursor-pointer text-[11px] font-bold flex items-center justify-center gap-[3px]"
                            >
                              <ChevronRight size={13} /> Iniciar
                            </button>
                          )}
                          {column === 'inProgress' && (
                            <>
                              <button
                                onClick={() => moveCard(card.id, column, 'todo')}
                                className="flex-1 p-[5px] bg-brand-light-tan text-brand-dark border-none rounded-[5px] cursor-pointer text-[11px] font-bold flex items-center justify-center gap-[2px]"
                              >
                                <ChevronLeft size={13} /> Atrás
                              </button>
                              <button
                                onClick={() => moveCard(card.id, column, 'done')}
                                className="flex-1 p-[5px] bg-success text-brand-paper border-none rounded-[5px] cursor-pointer text-[11px] font-bold flex items-center justify-center gap-[2px]"
                              >
                                <Check size={13} /> Listo
                              </button>
                            </>
                          )}
                          {column === 'done' && (
                            <>
                              <button
                                onClick={() => moveCard(card.id, column, 'inProgress')}
                                className="flex-1 p-[5px] bg-brand-light-tan text-brand-dark border-none rounded-[5px] cursor-pointer text-[11px] font-bold flex items-center justify-center gap-[2px]"
                              >
                                <ChevronLeft size={13} /> Deshacer
                              </button>
                              <button
                                onClick={() => { if (window.confirm(`¿Eliminar "${card.title}"?`)) deleteCard(card.id); }}
                                className="flex-1 p-[5px] bg-danger-light text-danger border border-danger rounded-[5px] cursor-pointer text-[11px] font-bold flex items-center justify-center gap-[2px]"
                              >
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
