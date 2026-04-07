import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import HabitTrackerPage from '@/components/features/habits/habit-tracker-page';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Play, Pause, RotateCcw, Plus, Trash2, ChevronRight, ChevronLeft, Clock, Check, Square,
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
}

interface Task {
  id: string;
  name: string;
  dueDate?: string;
  tags: string[];
  completed: boolean;
}

interface TimeEntry {
  id: string;
  project: string;
  category: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export default function ProductivityPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ backgroundColor: C.warmWhite }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: `2px solid ${C.tan}`, paddingBottom: '10px' }}>
        {[
          { label: '🍅 Pomodoro' },
          { label: '📋 Proyectos' },
          { label: '✅ Tareas' },
          { label: '⏱️ Tiempo' },
          { label: '🔁 Hábitos' },
        ].map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === idx ? C.accent : C.cream,
              color: activeTab === idx ? C.warmWhite : C.dark,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeTab === idx ? 'bold' : 'normal',
              fontSize: '14px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 0 && <PomodoroTab />}
      {activeTab === 1 && <KanbanTab />}
      {activeTab === 2 && <TasksTab />}
      {activeTab === 3 && <TimeLogTab />}
      {activeTab === 4 && <HabitTrackerPage />}
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
  const [kanban, setKanban] = useState<{ [key: string]: KanbanCard[] }>({
    todo: [
      { id: '1', title: 'Diseñar nueva interfaz', priority: 'Alta', dueDate: '2026-04-08', category: 'Diseño' },
      { id: '2', title: 'Revisar propuesta de cliente', priority: 'Media', dueDate: '2026-04-10', category: 'Reunión' },
      { id: '3', title: 'Actualizar documentación', priority: 'Baja', category: 'Documentación' },
    ],
    inProgress: [
      { id: '4', title: 'Implementar autenticación', priority: 'Alta', dueDate: '2026-04-07', category: 'Desarrollo' },
      { id: '5', title: 'Optimizar base de datos', priority: 'Media', dueDate: '2026-04-09', category: 'Backend' },
    ],
    done: [
      { id: '6', title: 'Setup del proyecto', priority: 'Alta', category: 'Setup' },
      { id: '7', title: 'Crear repositorio Git', priority: 'Media', category: 'DevOps' },
      { id: '8', title: 'Configurar CI/CD', priority: 'Media', category: 'DevOps' },
    ],
  });

  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardPriority, setNewCardPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [newCardCategory, setNewCardCategory] = useState('Desarrollo');

  const moveCard = (cardId: string, fromColumn: string, toColumn: string) => {
    const card = kanban[fromColumn].find(c => c.id === cardId);
    if (!card) return;
    setKanban(prev => ({
      ...prev,
      [fromColumn]: prev[fromColumn].filter(c => c.id !== cardId),
      [toColumn]: [...prev[toColumn], card],
    }));
  };

  const addCard = (column: string) => {
    if (!newCardTitle.trim()) return;
    const newCard: KanbanCard = {
      id: Date.now().toString(),
      title: newCardTitle,
      priority: newCardPriority,
      category: newCardCategory,
    };
    setKanban(prev => ({ ...prev, [column]: [...prev[column], newCard] }));
    setNewCardTitle('');
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

  return (
    <div>
      <div style={{ marginBottom: '20px', backgroundColor: C.cream, padding: '15px', borderRadius: '8px' }}>
        <h3 style={{ color: C.dark, margin: '0 0 15px 0', fontFamily: 'Georgia, serif' }}>Agregar tarjeta</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 150px 100px', gap: '10px' }}>
          <input
            type="text"
            value={newCardTitle}
            onChange={e => setNewCardTitle(e.target.value)}
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
              {kanban[column].map(card => (
                <div key={card.id} style={{ backgroundColor: C.paper, padding: '12px', borderRadius: '6px', border: `2px solid ${C.tan}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <p style={{ color: C.dark, margin: '0', fontWeight: 'bold', flex: 1 }}>{card.title}</p>
                    <button
                      onClick={() => deleteCard(card.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: getPriorityColor(card.priority), color: C.warmWhite, padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                      {card.priority}
                    </span>
                    <span style={{ backgroundColor: C.infoLight, color: C.dark, padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                      {card.category}
                    </span>
                  </div>
                  {card.dueDate && <p style={{ color: C.tan, fontSize: '12px', margin: '5px 0' }}>Vence: {card.dueDate}</p>}
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
                          <ChevronRight size={14} /> Siguiente
                        </button>
                      </>
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
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== TASKS TAB (EISENHOWER MATRIX) ==========
function TasksTab() {
  const [tasks, setTasks] = useState<{ [key: string]: Task[] }>({
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
  });

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

// ========== TIME LOG TAB ==========
function TimeLogTab() {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedProject, setSelectedProject] = useState('Proyecto A');
  const [selectedCategory, setSelectedCategory] = useState('Desarrollo');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    { id: '1', project: 'Proyecto A', category: 'Desarrollo', startTime: '09:00', endTime: '09:45', duration: 45 },
    { id: '2', project: 'Proyecto B', category: 'Diseño', startTime: '10:00', endTime: '11:30', duration: 90 },
    { id: '3', project: 'Proyecto A', category: 'Reunión', startTime: '11:45', endTime: '12:30', duration: 45 },
    { id: '4', project: 'Proyecto C', category: 'Admin', startTime: '14:00', endTime: '15:15', duration: 75 },
    { id: '5', project: 'Proyecto A', category: 'Desarrollo', startTime: '15:30', endTime: '17:00', duration: 90 },
  ]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const stopTimer = () => {
    if (elapsedSeconds > 0) {
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        project: selectedProject,
        category: selectedCategory,
        startTime: new Date(Date.now() - elapsedSeconds * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        duration: Math.floor(elapsedSeconds / 60),
      };
      setTimeEntries(p => [newEntry, ...p]);
      setElapsedSeconds(0);
    }
    setIsTimerRunning(false);
  };

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  // Calculate weekly summary
  const weeklySummary: { [key: string]: number } = {};
  timeEntries.forEach(entry => {
    weeklySummary[entry.project] = (weeklySummary[entry.project] || 0) + entry.duration;
  });

  const chartData = Object.entries(weeklySummary).map(([project, minutes]) => ({
    name: project,
    horas: Math.round(minutes / 60 * 10) / 10,
  }));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Active Timer */}
      <div style={{ backgroundColor: C.cream, padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ color: C.dark, fontFamily: 'Georgia, serif', marginTop: 0 }}>Temporizador Activo</h3>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: C.accent, marginBottom: '20px', fontFamily: 'monospace' }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', color: C.dark, marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>Proyecto</label>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              style={{ width: '100%', padding: '8px', border: `2px solid ${C.tan}`, borderRadius: '6px', fontSize: '14px' }}
            >
              <option>Proyecto A</option>
              <option>Proyecto B</option>
              <option>Proyecto C</option>
              <option>Proyecto D</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: C.dark, marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>Categoría</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ width: '100%', padding: '8px', border: `2px solid ${C.tan}`, borderRadius: '6px', fontSize: '14px' }}
            >
              <option>Desarrollo</option>
              <option>Diseño</option>
              <option>Reunión</option>
              <option>Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: isTimerRunning ? C.warning : C.accent,
                color: C.warmWhite,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
              {isTimerRunning ? 'Pausar' : 'Iniciar'}
            </button>
            <button
              onClick={stopTimer}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: C.danger,
                color: C.warmWhite,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Detener
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Summary Chart */}
      <div style={{ marginBottom: '30px', backgroundColor: C.lightCream, padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: C.dark, fontFamily: 'Georgia, serif', marginTop: 0 }}>Resumen por Proyecto (hoy)</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke={C.dark} />
              <YAxis stroke={C.dark} label={{ value: 'Horas', angle: -90, position: 'insideLeft' }} />
              <Tooltip contentStyle={{ backgroundColor: C.cream, border: `2px solid ${C.tan}` }} />
              <Bar dataKey="horas" fill={C.accent} radius={[8, 8, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={[C.accent, C.accentLight, C.warning, C.success][idx % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: C.tan }}>Sin datos registrados</p>
        )}
      </div>

      {/* Time Log Table */}
      <div>
        <h3 style={{ color: C.dark, fontFamily: 'Georgia, serif', marginBottom: '15px' }}>Registro de hoy</h3>
        <div style={{ backgroundColor: C.paper, borderRadius: '8px', overflow: 'hidden', border: `1px solid ${C.tan}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: C.cream, borderBottom: `2px solid ${C.tan}` }}>
                <th style={{ padding: '12px', textAlign: 'left', color: C.dark, fontWeight: 'bold' }}>Proyecto</th>
                <th style={{ padding: '12px', textAlign: 'left', color: C.dark, fontWeight: 'bold' }}>Inicio</th>
                <th style={{ padding: '12px', textAlign: 'left', color: C.dark, fontWeight: 'bold' }}>Fin</th>
                <th style={{ padding: '12px', textAlign: 'left', color: C.dark, fontWeight: 'bold' }}>Duración</th>
                <th style={{ padding: '12px', textAlign: 'left', color: C.dark, fontWeight: 'bold' }}>Categoría</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.map((entry, idx) => (
                <tr key={entry.id} style={{ borderBottom: idx < timeEntries.length - 1 ? `1px solid ${C.lightCream}` : 'none' }}>
                  <td style={{ padding: '12px', color: C.dark, fontWeight: 'bold' }}>{entry.project}</td>
                  <td style={{ padding: '12px', color: C.dark }}>{entry.startTime}</td>
                  <td style={{ padding: '12px', color: C.dark }}>{entry.endTime}</td>
                  <td style={{ padding: '12px', color: C.dark, fontWeight: 'bold' }}>{entry.duration} min</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: C.infoLight, color: C.dark, padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      {entry.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
