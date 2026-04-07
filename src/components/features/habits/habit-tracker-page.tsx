"use client";

import React, { useState, useMemo } from "react";
import { Check, Plus, Trash2, Play, Pause, Volume2, VolumeX, Clock, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const C = {
  dark: "#3D2B1F",
  brown: "#6B4226",
  medium: "#8B6542",
  warm: "#A0845C",
  tan: "#C4A882",
  cream: "#EDE0D4",
  lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3",
  paper: "#FFFDF9",
  accent: "#B8860B",
  accentLight: "#D4A843",
  success: "#7A9E3E",
  warning: "#D4943A",
  danger: "#C0544F",
  info: "#5A8FA8",
};

interface Habit {
  id: string;
  name: string;
  emoji: string;
  category: string;
  completionDays: number[];
  time: "Mañana" | "Tarde" | "Noche";
}

interface Project {
  id: string;
  name: string;
  priority: "Alta" | "Media" | "Baja";
  dueDate: string;
  assignee: string;
  status: "Por Hacer" | "En Progreso" | "Completado";
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  category: string;
  completed: boolean;
  quadrant: "importante-urgente" | "importante" | "urgente" | "ninguno";
}

interface PomodoroSession {
  id: string;
  date: string;
  duration: number;
}

interface TimeLog {
  id: string;
  date: string;
  category: string;
  hours: number;
}

const initialHabits: Habit[] = [
  {
    id: "h1",
    name: "Meditación",
    emoji: "🧘",
    category: "Bienestar",
    time: "Mañana",
    completionDays: [1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 19, 20, 21, 23, 24, 25, 26, 28],
  },
  {
    id: "h2",
    name: "Ejercicio",
    emoji: "💪",
    category: "Fitness",
    time: "Tarde",
    completionDays: [1, 2, 4, 5, 7, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 22, 24, 25, 27, 28, 29],
  },
  {
    id: "h3",
    name: "Lectura",
    emoji: "📚",
    category: "Productividad",
    time: "Noche",
    completionDays: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29],
  },
  {
    id: "h4",
    name: "Agua 2L+",
    emoji: "💧",
    category: "Nutrición",
    time: "Mañana",
    completionDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
  },
  {
    id: "h5",
    name: "Dormir 8h",
    emoji: "😴",
    category: "Bienestar",
    time: "Noche",
    completionDays: [2, 3, 4, 6, 7, 8, 10, 11, 13, 14, 15, 17, 19, 20, 21, 23, 24, 26, 27, 28, 29],
  },
  {
    id: "h6",
    name: "Código",
    emoji: "💻",
    category: "Productividad",
    time: "Tarde",
    completionDays: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
  },
];

const initialProjects: Project[] = [
  { id: "p1", name: "Rediseño interfaz app", priority: "Alta", dueDate: "2026-04-15", assignee: "María", status: "En Progreso" },
  { id: "p2", name: "Documentación API", priority: "Media", dueDate: "2026-04-20", assignee: "Carlos", status: "Por Hacer" },
  { id: "p3", name: "Testing QA completo", priority: "Alta", dueDate: "2026-04-10", assignee: "Ana", status: "En Progreso" },
  { id: "p4", name: "Optimización base datos", priority: "Media", dueDate: "2026-04-25", assignee: "Juan", status: "Por Hacer" },
  { id: "p5", name: "Release v2.1", priority: "Alta", dueDate: "2026-04-30", assignee: "Equipo", status: "Completado" },
];

const initialTasks: Task[] = [
  { id: "t1", title: "Llamada con cliente importante", dueDate: "2026-04-06", category: "Negocios", completed: false, quadrant: "importante-urgente" },
  { id: "t2", title: "Preparar propuesta estratégica", dueDate: "2026-04-10", category: "Trabajo", completed: false, quadrant: "importante" },
  { id: "t3", title: "Responder emails urgentes", dueDate: "2026-04-05", category: "Admin", completed: false, quadrant: "urgente" },
  { id: "t4", title: "Organizar evento de equipo", dueDate: "2026-04-20", category: "RH", completed: false, quadrant: "ninguno" },
  { id: "t5", title: "Revisar trimestral performance", dueDate: "2026-04-08", category: "Evaluación", completed: false, quadrant: "importante-urgente" },
  { id: "t6", title: "Planificación Q2", dueDate: "2026-04-15", category: "Estrategia", completed: false, quadrant: "importante" },
];

const initialPomodoros: PomodoroSession[] = [
  { id: "po1", date: "2026-04-05", duration: 1 },
  { id: "po2", date: "2026-04-04", duration: 3 },
  { id: "po3", date: "2026-04-03", duration: 2 },
  { id: "po4", date: "2026-04-02", duration: 4 },
  { id: "po5", date: "2026-04-01", duration: 3 },
];

const initialTimeLogs: TimeLog[] = [
  { id: "tl1", date: "2026-04-05", category: "Trabajo", hours: 6 },
  { id: "tl2", date: "2026-04-04", category: "Estudio", hours: 2 },
  { id: "tl3", date: "2026-04-03", category: "Proyecto", hours: 4 },
  { id: "tl4", date: "2026-04-02", category: "Trabajo", hours: 7 },
  { id: "tl5", date: "2026-04-01", category: "Reunión", hours: 3 },
];

function HabitsTab({ habits, setHabits }: { habits: Habit[]; setHabits: (h: Habit[]) => void }) {
  const [newHabitName, setNewHabitName] = useState("");
  const today = 5;

  const habitsByTime = {
    Mañana: habits.filter((h) => h.time === "Mañana"),
    Tarde: habits.filter((h) => h.time === "Tarde"),
    Noche: habits.filter((h) => h.time === "Noche"),
  };

  const getStreak = (completionDays: number[]): number => {
    let streak = 0;
    for (let i = today; i >= 1; i--) {
      if (completionDays.includes(i)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getStrength = (completionDays: number[]): string => {
    const percentage = (completionDays.length / 30) * 100;
    if (percentage === 0) return "Nuevo";
    if (percentage < 30) return "En Progreso";
    if (percentage < 70) return "Formándose";
    return "Arraigado";
  };

  const toggleDay = (habitId: string, day: number) => {
    setHabits(
      habits.map((h) => {
        if (h.id === habitId) {
          const newDays = h.completionDays.includes(day)
            ? h.completionDays.filter((d) => d !== day)
            : [...h.completionDays, day];
          return { ...h, completionDays: newDays.sort((a, b) => a - b) };
        }
        return h;
      })
    );
  };

  const deleteHabit = (habitId: string) => {
    setHabits(habits.filter((h) => h.id !== habitId));
  };

  const renderHabitGroup = (time: "Mañana" | "Tarde" | "Noche") => {
    const groupHabits = habitsByTime[time];
    if (groupHabits.length === 0) return null;

    return (
      <div key={time} style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: C.dark, margin: "0 0 16px 0", fontFamily: "Georgia, serif" }}>
          {time}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {groupHabits.map((habit) => {
            const streak = getStreak(habit.completionDays);
            const strength = getStrength(habit.completionDays);
            return (
              <div
                key={habit.id}
                style={{
                  backgroundColor: C.paper,
                  border: `1px solid ${C.lightCream}`,
                  borderRadius: "8px",
                  padding: "16px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>{habit.emoji}</span>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: C.dark, margin: "0 0 4px 0" }}>
                        {habit.name}
                      </p>
                      <p style={{ fontSize: "12px", color: C.warm, margin: 0 }}>
                        {habit.category}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: C.danger,
                      padding: "4px",
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: C.lightCream,
                      color: C.dark,
                      fontWeight: "500",
                    }}
                  >
                    {streak} día racha
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: strength === "Arraigado" ? C.success : strength === "Formándose" ? C.warning : C.info,
                      color: C.paper,
                      fontWeight: "500",
                    }}
                  >
                    {strength}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "4px" }}>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(habit.id, day)}
                      title={`Día ${day}`}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        border:
                          day === today
                            ? `2px solid ${C.accent}`
                            : `1px solid ${habit.completionDays.includes(day) ? C.accent : C.lightCream}`,
                        borderRadius: "3px",
                        backgroundColor: habit.completionDays.includes(day) ? C.accent : "transparent",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                        fontSize: "10px",
                        color: C.paper,
                        fontWeight: "600",
                      }}
                      onMouseOver={(e) => {
                        if (!habit.completionDays.includes(day)) {
                          e.currentTarget.style.backgroundColor = C.accentLight;
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!habit.completionDays.includes(day)) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {habit.completionDays.includes(day) && day === today ? "●" : habit.completionDays.includes(day) ? "✓" : ""}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Nuevo hábito..."
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: `1px solid ${C.lightCream}`,
              borderRadius: "6px",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => {
              if (newHabitName) {
                setHabits([
                  ...habits,
                  {
                    id: `h${Date.now()}`,
                    name: newHabitName,
                    emoji: "🎯",
                    category: "Nuevo",
                    time: "Mañana",
                    completionDays: [],
                  },
                ]);
                setNewHabitName("");
              }
            }}
            style={{
              backgroundColor: C.accent,
              color: C.paper,
              border: "none",
              borderRadius: "6px",
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {renderHabitGroup("Mañana")}
      {renderHabitGroup("Tarde")}
      {renderHabitGroup("Noche")}
    </div>
  );
}

function ProjectsTab({ projects, setProjects }: { projects: Project[]; setProjects: (p: Project[]) => void }) {
  const columns: ("Por Hacer" | "En Progreso" | "Completado")[] = ["Por Hacer", "En Progreso", "Completado"];

  const moveTask = (projectId: string, newStatus: "Por Hacer" | "En Progreso" | "Completado") => {
    setProjects(projects.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p)));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return C.danger;
      case "Media":
        return C.warning;
      case "Baja":
        return C.info;
      default:
        return C.warm;
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
      {columns.map((status) => {
        const statusProjects = projects.filter((p) => p.status === status);
        return (
          <div key={status}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: C.dark, margin: 0, fontFamily: "Georgia, serif" }}>
                {status}
              </h3>
              <span
                style={{
                  backgroundColor: C.lightCream,
                  color: C.dark,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {statusProjects.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {statusProjects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    backgroundColor: C.paper,
                    border: `1px solid ${C.lightCream}`,
                    borderRadius: "8px",
                    padding: "12px",
                    cursor: "move",
                    transition: "all 0.2s",
                    borderLeft: `4px solid ${getPriorityColor(project.priority)}`,
                  }}
                >
                  <p style={{ fontSize: "13px", fontWeight: "600", color: C.dark, margin: "0 0 8px 0" }}>
                    {project.name}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        backgroundColor: getPriorityColor(project.priority),
                        color: C.paper,
                        padding: "3px 6px",
                        borderRadius: "3px",
                        fontWeight: "500",
                      }}
                    >
                      {project.priority}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        backgroundColor: C.lightCream,
                        color: C.dark,
                        padding: "3px 6px",
                        borderRadius: "3px",
                      }}
                    >
                      {project.assignee}
                    </span>
                  </div>
                  <p style={{ fontSize: "11px", color: C.warm, margin: "8px 0 0 0" }}>
                    {project.dueDate}
                  </p>
                  {status !== "Completado" && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                      {columns
                        .filter((col) => col !== status)
                        .map((newStatus) => (
                          <button
                            key={newStatus}
                            onClick={() => moveTask(project.id, newStatus)}
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              fontSize: "11px",
                              backgroundColor: C.accentLight,
                              color: C.dark,
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "500",
                            }}
                          >
                            → {newStatus.split(" ")[0]}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TasksTab({ tasks, setTasks }: { tasks: Task[]; setTasks: (t: Task[]) => void }) {
  const quadrants = [
    { key: "importante-urgente", label: "Urgente + Importante", icon: "🔴" },
    { key: "importante", label: "Importante", icon: "🟡" },
    { key: "urgente", label: "Urgente", icon: "🟠" },
    { key: "ninguno", label: "Ni urgente ni importante", icon: "⚪" },
  ];

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  };

  const stats = {
    completados: tasks.filter((t) => t.completed).length,
    total: tasks.length,
  };

  return (
    <div>
      <div
        style={{
          backgroundColor: C.paper,
          border: `1px solid ${C.lightCream}`,
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ fontSize: "16px", color: C.dark, margin: 0, fontWeight: "600" }}>
          Progreso: {stats.completados} de {stats.total}
        </h3>
        <div
          style={{
            width: "160px",
            height: "8px",
            backgroundColor: C.lightCream,
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(stats.completados / stats.total) * 100}%`,
              height: "100%",
              backgroundColor: C.success,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
        {quadrants.map((quad) => {
          const quadrantTasks = tasks.filter((t) => t.quadrant === quad.key);
          return (
            <div key={quad.key}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: C.dark, margin: "0 0 12px 0", fontFamily: "Georgia, serif" }}>
                {quad.icon} {quad.label}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {quadrantTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: C.paper,
                      border: `1px solid ${C.lightCream}`,
                      borderRadius: "6px",
                      padding: "12px",
                      display: "flex",
                      gap: "12px",
                      alignItems: "start",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      style={{ marginTop: "4px", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: task.completed ? C.warm : C.dark,
                          margin: "0 0 4px 0",
                          textDecoration: task.completed ? "line-through" : "none",
                        }}
                      >
                        {task.title}
                      </p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: C.warm, backgroundColor: C.lightCream, padding: "2px 6px", borderRadius: "3px" }}>
                          {task.category}
                        </span>
                        <span style={{ fontSize: "11px", color: C.warm }}>
                          {task.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PomodoroTab({ pomodoros, setPomodoros }: { pomodoros: PomodoroSession[]; setPomodoros: (p: PomodoroSession[]) => void }) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isBreak, setIsBreak] = useState(false);

  const weekData = [
    { day: "Lun", sessions: 3 },
    { day: "Mar", sessions: 4 },
    { day: "Mié", sessions: 2 },
    { day: "Jue", sessions: 5 },
    { day: "Vie", sessions: 3 },
    { day: "Sab", sessions: 1 },
    { day: "Dom", sessions: 2 },
  ];

  const totalMinutes = pomodoros.reduce((sum, p) => sum + p.duration * 25, 0);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = isBreak ? (1 - timeLeft / (5 * 60)) * 100 : (1 - timeLeft / (25 * 60)) * 100;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: C.paper,
            border: `1px solid ${C.lightCream}`,
            borderRadius: "12px",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              backgroundColor: C.lightCream,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              marginBottom: "24px",
              boxShadow: `inset 0 0 0 8px ${isBreak ? C.info : C.accent}`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `conic-gradient(${isBreak ? C.info : C.accent} ${progress}%, transparent ${progress}%)`,
                opacity: 0.2,
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", fontWeight: "700", color: C.dark }}>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <div style={{ fontSize: "13px", color: C.warm, marginTop: "8px" }}>
                {isBreak ? "Descanso" : "Trabajo"}
              </div>
            </div>
          </div>

          <p style={{ fontSize: "14px", color: C.warm, margin: "0 0 16px 0" }}>
            Sesión {sessionCount} de 4
          </p>

          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <button
              onClick={() => setIsRunning(!isRunning)}
              style={{
                backgroundColor: isRunning ? C.danger : C.success,
                color: C.paper,
                border: "none",
                borderRadius: "6px",
                padding: "10px 20px",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? "Pausar" : "Iniciar"}
            </button>
            <button
              onClick={() => setIsSoundOn(!isSoundOn)}
              style={{
                backgroundColor: C.medium,
                color: C.paper,
                border: "none",
                borderRadius: "6px",
                padding: "10px 14px",
                cursor: "pointer",
              }}
            >
              {isSoundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>

          <p style={{ fontSize: "12px", color: C.warm, margin: 0 }}>
            Total hoy: {pomodoros.filter((p) => p.date === "2026-04-05").length} sesiones
          </p>
        </div>

        <div
          style={{
            backgroundColor: C.paper,
            border: `1px solid ${C.lightCream}`,
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: C.dark, margin: "0 0 16px 0", fontFamily: "Georgia, serif" }}>
            Sesiones esta semana
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData}>
              <XAxis dataKey="day" stroke={C.warm} />
              <YAxis stroke={C.warm} />
              <Tooltip
                contentStyle={{
                  backgroundColor: C.paper,
                  border: `1px solid ${C.lightCream}`,
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey="sessions" fill={C.accent} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              backgroundColor: C.lightCream,
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 4px 0" }}>
              Tiempo Total Enfocado
            </p>
            <p style={{ fontSize: "28px", fontWeight: "700", color: C.dark, margin: 0 }}>
              {totalMinutes}m
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeLogTab({ timeLogs, setTimeLogs }: { timeLogs: TimeLog[]; setTimeLogs: (t: TimeLog[]) => void }) {
  const categories = ["Trabajo", "Estudio", "Proyecto", "Reunión", "Otro"];
  const [selectedCategory, setSelectedCategory] = useState("Trabajo");
  const [hours, setHours] = useState("1");

  const dailyLogs = timeLogs.reduce(
    (acc, log) => {
      const date = log.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    },
    {} as Record<string, TimeLog[]>
  );

  const categoryColors: Record<string, string> = {
    Trabajo: C.accent,
    Estudio: C.info,
    Proyecto: C.success,
    Reunión: C.warning,
    Otro: C.medium,
  };

  const weeklyData = categories.map((cat) => ({
    name: cat,
    hours: timeLogs.reduce((sum, log) => (log.category === cat ? sum + log.hours : sum), 0),
  }));

  const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
      }}
    >
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: C.dark, margin: "0 0 16px 0", fontFamily: "Georgia, serif" }}>
          Registrar tiempo
        </h3>
        <div
          style={{
            backgroundColor: C.paper,
            border: `1px solid ${C.lightCream}`,
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: C.dark, display: "block", marginBottom: "8px" }}>
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: `1px solid ${C.lightCream}`,
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: C.dark, display: "block", marginBottom: "8px" }}>
              Horas
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              max="12"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: `1px solid ${C.lightCream}`,
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            />
          </div>

          <button
            onClick={() => {
              if (hours && parseFloat(hours) > 0) {
                setTimeLogs([
                  ...timeLogs,
                  {
                    id: `tl${Date.now()}`,
                    date: "2026-04-05",
                    category: selectedCategory,
                    hours: parseFloat(hours),
                  },
                ]);
                setHours("1");
              }
            }}
            style={{
              width: "100%",
              backgroundColor: C.accent,
              color: C.paper,
              border: "none",
              borderRadius: "6px",
              padding: "10px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Registrar
          </button>
        </div>

        <h3 style={{ fontSize: "16px", fontWeight: "700", color: C.dark, margin: "0 0 12px 0", fontFamily: "Georgia, serif" }}>
          Registros de hoy
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {(dailyLogs["2026-04-05"] || []).map((log) => (
            <div
              key={log.id}
              style={{
                backgroundColor: C.paper,
                border: `1px solid ${C.lightCream}`,
                borderRadius: "6px",
                padding: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderLeft: `4px solid ${categoryColors[log.category]}`,
              }}
            >
              <div>
                <p style={{ fontSize: "13px", fontWeight: "500", color: C.dark, margin: "0 0 2px 0" }}>
                  {log.category}
                </p>
              </div>
              <p style={{ fontSize: "14px", fontWeight: "600", color: C.accent, margin: 0 }}>
                {log.hours}h
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: C.dark, margin: "0 0 16px 0", fontFamily: "Georgia, serif" }}>
          Horas por categoría (Semana)
        </h3>
        <div
          style={{
            backgroundColor: C.paper,
            border: `1px solid ${C.lightCream}`,
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="name" stroke={C.warm} />
              <YAxis stroke={C.warm} />
              <Tooltip
                contentStyle={{
                  backgroundColor: C.paper,
                  border: `1px solid ${C.lightCream}`,
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey="hours" fill={C.accent} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            backgroundColor: C.paper,
            border: `1px solid ${C.lightCream}`,
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 8px 0" }}>
            Total de horas registradas
          </p>
          <p style={{ fontSize: "36px", fontWeight: "700", color: C.accent, margin: 0 }}>
            {totalHours}h
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HabitTrackerPage() {
  const [activeTab, setActiveTab] = useState<"habitos" | "proyectos" | "tareas" | "pomodoro" | "tiempo">("habitos");
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [pomodoros, setPomodoros] = useState<PomodoroSession[]>(initialPomodoros);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(initialTimeLogs);

  const tabs = [
    { id: "habitos", label: "Hábitos", icon: "📅" },
    { id: "proyectos", label: "Proyectos", icon: "📊" },
    { id: "tareas", label: "Tareas", icon: "☑️" },
    { id: "pomodoro", label: "Pomodoro", icon: "⏱️" },
    { id: "tiempo", label: "Registro de Tiempo", icon: "⏰" },
  ];

  return (
    <div style={{ backgroundColor: C.warmWhite, minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "700",
              color: C.dark,
              margin: "0 0 8px 0",
              fontFamily: "Georgia, serif",
            }}
          >
            Productividad & Hábitos
          </h1>
          <p style={{ fontSize: "16px", color: C.warm, margin: 0 }}>
            Abril 2026
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "24px",
            borderBottom: `2px solid ${C.lightCream}`,
            overflowX: "auto",
            paddingBottom: "12px",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: activeTab === tab.id ? "700" : "500",
                color: activeTab === tab.id ? C.dark : C.warm,
                backgroundColor: activeTab === tab.id ? C.lightCream : "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseOver={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = C.cream;
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          style={{
            backgroundColor: C.paper,
            border: `1px solid ${C.lightCream}`,
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          {activeTab === "habitos" && <HabitsTab habits={habits} setHabits={setHabits} />}
          {activeTab === "proyectos" && <ProjectsTab projects={projects} setProjects={setProjects} />}
          {activeTab === "tareas" && <TasksTab tasks={tasks} setTasks={setTasks} />}
          {activeTab === "pomodoro" && <PomodoroTab pomodoros={pomodoros} setPomodoros={setPomodoros} />}
          {activeTab === "tiempo" && <TimeLogTab timeLogs={timeLogs} setTimeLogs={setTimeLogs} />}
        </div>
      </div>
    </div>
  );
}
