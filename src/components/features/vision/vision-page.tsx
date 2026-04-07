"use client";

import React, { useState } from "react";
import {
  Heart,
  Target,
  Lightbulb,
  Plane,
  Briefcase,
  Dumbbell,
  Users,
  Wallet,
  BookOpen,
  Star,
  Plus,
  Edit2,
  Trash2,
  Sun,
  Moon,
  Check,
} from "lucide-react";
import { colors } from "@/lib/colors";

const C = colors;

// ─── Types ────────────────────────────────────────────────────────────────
interface VisionCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  vision: string;
  progress: number;
}

interface ManifestationGoal {
  id: string;
  title: string;
  category: string;
  deadline: string;
  progress: number;
  status: "En Progreso" | "Completado" | "Pendiente";
  actionPlan: string[];
}

interface Affirmation {
  id: string;
  text: string;
  category: "morning" | "evening";
}

interface BucketListItem {
  id: string;
  title: string;
  category: "Viajes" | "Experiencias" | "Logros" | "Aprendizaje" | "Aventura";
  deadline?: string;
  priority: 1 | 2 | 3;
  completed: boolean;
}

// ─── Initial Data ────────────────────────────────────────────────────────
const initialVisions: VisionCategory[] = [
  {
    id: "v1",
    name: "Salud",
    icon: <Heart size={24} color={C.danger} />,
    vision: "Tener un cuerpo fuerte, energético y lleno de vitalidad",
    progress: 65,
  },
  {
    id: "v2",
    name: "Carrera",
    icon: <Briefcase size={24} color={C.info} />,
    vision: "Crear un impacto significativo en mi industria y ser reconocido",
    progress: 55,
  },
  {
    id: "v3",
    name: "Relaciones",
    icon: <Users size={24} color={C.accent} />,
    vision: "Construir conexiones profundas y significativas con las personas",
    progress: 72,
  },
  {
    id: "v4",
    name: "Finanzas",
    icon: <Wallet size={24} color={C.success} />,
    vision: "Alcanzar la independencia financiera y generar riqueza generacional",
    progress: 48,
  },
  {
    id: "v5",
    name: "Crecimiento Personal",
    icon: <Lightbulb size={24} color={C.accentLight} />,
    vision: "Convertirme en la mejor versión de mí mismo cada día",
    progress: 68,
  },
  {
    id: "v6",
    name: "Aventura",
    icon: <Plane size={24} color={C.warm} />,
    vision: "Explorar el mundo y vivir experiencias extraordinarias",
    progress: 40,
  },
];

const initialGoals: ManifestationGoal[] = [
  {
    id: "g1",
    title: "Completar mi primer maratón",
    category: "Salud",
    deadline: "2026-12-31",
    progress: 35,
    status: "En Progreso",
    actionPlan: [
      "Entrenar 4 días a la semana",
      "Seguir plan nutricional especializado",
      "Participar en carrera de prueba",
    ],
  },
  {
    id: "g2",
    title: "Lanzar mi proyecto digital",
    category: "Carrera",
    deadline: "2026-06-30",
    progress: 60,
    status: "En Progreso",
    actionPlan: [
      "Completar desarrollo del MVP",
      "Marketing y branding",
      "Lanzamiento oficial",
    ],
  },
  {
    id: "g3",
    title: "Viajar a 5 nuevos países",
    category: "Aventura",
    deadline: "2026-12-31",
    progress: 20,
    status: "Pendiente",
    actionPlan: [
      "Investigar destinos y presupuesto",
      "Reservar vuelos y hospedaje",
      "Planificar itinerarios",
    ],
  },
];

const initialAffirmations: Affirmation[] = [
  {
    id: "a1",
    text: "Soy capaz de lograr mis sueños más grandes",
    category: "morning",
  },
  {
    id: "a2",
    text: "Cada día me acerco más a mi mejor versión",
    category: "morning",
  },
  {
    id: "a3",
    text: "Merezco éxito, salud y felicidad",
    category: "morning",
  },
  {
    id: "a4",
    text: "Estoy agradecido por todo lo que he logrado hoy",
    category: "evening",
  },
  {
    id: "a5",
    text: "Mañana será un día lleno de nuevas oportunidades",
    category: "evening",
  },
];

const initialBucketList: BucketListItem[] = [
  {
    id: "b1",
    title: "Escalar el Monte Kilimanjaro",
    category: "Aventura",
    deadline: "2027-06-30",
    priority: 3,
    completed: false,
  },
  {
    id: "b2",
    title: "Aprender a hablar fluido en francés",
    category: "Aprendizaje",
    priority: 2,
    completed: false,
  },
  {
    id: "b3",
    title: "Escribir y publicar un libro",
    category: "Logros",
    deadline: "2027-12-31",
    priority: 3,
    completed: false,
  },
  {
    id: "b4",
    title: "Visitar París",
    category: "Viajes",
    priority: 2,
    completed: true,
  },
  {
    id: "b5",
    title: "Dominar la fotografía de naturaleza",
    category: "Aprendizaje",
    priority: 1,
    completed: false,
  },
  {
    id: "b6",
    title: "Crear un impacto social positivo",
    category: "Logros",
    priority: 3,
    completed: false,
  },
];

// ─── Tab Component ──────────────────────────────────────────────────────
const TabButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: "12px 20px",
      borderBottom: isActive ? `3px solid ${C.accent}` : `3px solid transparent`,
      backgroundColor: "transparent",
      color: isActive ? C.dark : C.warm,
      fontWeight: isActive ? "bold" : "500",
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.3s ease",
      fontFamily: "'Georgia', serif",
    }}
  >
    {children}
  </button>
);

// ─── Mi Visión Tab ──────────────────────────────────────────────────────
const MiVisionTab: React.FC<{
  visions: VisionCategory[];
  onUpdate: (id: string, vision: string, progress: number) => void;
}> = ({ visions, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editProgress, setEditProgress] = useState(0);

  const overallScore = Math.round(
    visions.reduce((sum, v) => sum + v.progress, 0) / visions.length
  );

  const startEditing = (id: string, text: string, progress: number) => {
    setEditingId(id);
    setEditText(text);
    setEditProgress(progress);
  };

  const saveEdit = (id: string) => {
    onUpdate(id, editText, editProgress);
    setEditingId(null);
  };

  return (
    <div style={{ padding: "30px", backgroundColor: C.paper }}>
      {/* Overall Vision Score */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
          borderRadius: "12px",
          padding: "30px",
          marginBottom: "30px",
          textAlign: "center",
          color: C.paper,
          boxShadow: `0 8px 24px rgba(0,0,0,0.15)`,
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: "normal", margin: "0 0 10px 0" }}>
          Puntuación de Visión General
        </h2>
        <div style={{ fontSize: "48px", fontWeight: "bold", margin: "10px 0" }}>
          {overallScore}%
        </div>
        <p style={{ margin: "10px 0 0 0", fontSize: "14px", opacity: 0.9 }}>
          Tu progreso en todas las áreas de vida
        </p>
      </div>

      {/* Vision Categories Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {visions.map((vision) => (
          <div
            key={vision.id}
            style={{
              background: C.warmWhite,
              border: `2px solid ${C.lightCream}`,
              borderRadius: "12px",
              padding: "20px",
              boxShadow: `0 4px 12px rgba(0,0,0,0.08)`,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.12)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.08)`;
            }}
          >
            {/* Icon and Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ fontSize: "24px" }}>{vision.icon}</div>
              <h3
                style={{
                  fontSize: "18px",
                  fontFamily: "'Georgia', serif",
                  color: C.dark,
                  margin: 0,
                }}
              >
                {vision.name}
              </h3>
            </div>

            {/* Vision Text */}
            {editingId === vision.id ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "10px",
                  border: `2px solid ${C.accent}`,
                  borderRadius: "8px",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  marginBottom: "12px",
                  boxSizing: "border-box",
                }}
              />
            ) : (
              <p
                style={{
                  fontSize: "14px",
                  color: C.warm,
                  margin: "0 0 15px 0",
                  lineHeight: "1.6",
                }}
              >
                {vision.vision}
              </p>
            )}

            {/* Progress Section */}
            <div style={{ marginBottom: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "500", color: C.dark }}>
                  Progreso
                </label>
                {editingId === vision.id ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => setEditProgress(Number(e.target.value))}
                    style={{
                      width: "50px",
                      padding: "4px",
                      border: `1px solid ${C.accent}`,
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: C.accent }}>
                    {vision.progress}%
                  </span>
                )}
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: C.lightCream,
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${vision.progress}%`,
                    background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              {editingId === vision.id ? (
                <>
                  <button
                    onClick={() => saveEdit(vision.id)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      backgroundColor: C.success,
                      color: C.paper,
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      backgroundColor: C.lightCream,
                      color: C.dark,
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startEditing(vision.id, vision.vision, vision.progress)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    backgroundColor: C.accentLight,
                    color: C.dark,
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    transition: "all 0.2s",
                  }}
                >
                  <Edit2 size={14} />
                  Editar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Manifestación Tab ──────────────────────────────────────────────────
const ManifestacionTab: React.FC<{
  goals: ManifestationGoal[];
  onAddGoal: (goal: ManifestationGoal) => void;
  onUpdateGoal: (id: string, updates: Partial<ManifestationGoal>) => void;
}> = ({ goals, onAddGoal, onUpdateGoal }) => {
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<ManifestationGoal>>({
    title: "",
    category: "Carrera",
    deadline: "",
    progress: 0,
    status: "Pendiente",
    actionPlan: ["", "", ""],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado":
        return C.success;
      case "En Progreso":
        return C.info;
      case "Pendiente":
        return C.warning;
      default:
        return C.warm;
    }
  };

  const handleAddGoal = () => {
    if (newGoal.title && newGoal.category) {
      onAddGoal({
        id: `g${Date.now()}`,
        title: newGoal.title || "",
        category: newGoal.category || "",
        deadline: newGoal.deadline || "",
        progress: newGoal.progress || 0,
        status: newGoal.status || "Pendiente",
        actionPlan: newGoal.actionPlan || ["", "", ""],
      });
      setNewGoal({
        title: "",
        category: "Carrera",
        deadline: "",
        progress: 0,
        status: "Pendiente",
        actionPlan: ["", "", ""],
      });
      setShowForm(false);
    }
  };

  return (
    <div style={{ padding: "30px", backgroundColor: C.paper }}>
      {/* Add Goal Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          marginBottom: "30px",
          padding: "12px 24px",
          backgroundColor: C.accent,
          color: C.paper,
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          fontWeight: "600",
          transition: "all 0.2s",
        }}
      >
        <Plus size={18} />
        Nuevo Objetivo
      </button>

      {/* Add Goal Form */}
      {showForm && (
        <div
          style={{
            background: C.warmWhite,
            border: `2px solid ${C.accent}`,
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h3 style={{ fontSize: "18px", fontFamily: "'Georgia', serif", color: C.dark, marginTop: 0 }}>
            Crear Nuevo Objetivo
          </h3>
          <div style={{ display: "grid", gap: "15px" }}>
            <input
              type="text"
              placeholder="Título del objetivo"
              value={newGoal.title || ""}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              style={{
                padding: "10px",
                border: `1px solid ${C.lightCream}`,
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
            <select
              value={newGoal.category || ""}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
              style={{
                padding: "10px",
                border: `1px solid ${C.lightCream}`,
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              <option value="Salud">Salud</option>
              <option value="Carrera">Carrera</option>
              <option value="Finanzas">Finanzas</option>
              <option value="Aventura">Aventura</option>
            </select>
            <input
              type="date"
              value={newGoal.deadline || ""}
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              style={{
                padding: "10px",
                border: `1px solid ${C.lightCream}`,
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleAddGoal}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: C.success,
                  color: C.paper,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Guardar Objetivo
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: C.lightCream,
                  color: C.dark,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {goals.map((goal) => (
          <div
            key={goal.id}
            style={{
              background: C.warmWhite,
              border: `2px solid ${C.lightCream}`,
              borderRadius: "12px",
              padding: "20px",
              boxShadow: `0 4px 12px rgba(0,0,0,0.08)`,
            }}
          >
            {/* Title and Status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "16px", fontFamily: "'Georgia', serif", color: C.dark, margin: 0, flex: 1 }}>
                {goal.title}
              </h3>
              <span
                style={{
                  padding: "4px 10px",
                  backgroundColor: getStatusColor(goal.status),
                  color: C.paper,
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  marginLeft: "10px",
                }}
              >
                {goal.status}
              </span>
            </div>

            {/* Category and Deadline */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "12px", color: C.warm }}>
              <span>{goal.category}</span>
              {goal.deadline && <span>{new Date(goal.deadline).toLocaleDateString("es-ES")}</span>}
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "500", color: C.dark }}>
                  Progreso
                </label>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: C.accent }}>
                  {goal.progress}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  backgroundColor: C.lightCream,
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${goal.progress}%`,
                    background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`,
                  }}
                />
              </div>
            </div>

            {/* Action Plan */}
            <div style={{ marginBottom: "15px" }}>
              <p style={{ fontSize: "12px", fontWeight: "600", color: C.dark, margin: "0 0 8px 0" }}>
                Plan de Acción:
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {goal.actionPlan.map((action, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: "12px",
                      color: C.warm,
                      marginBottom: "4px",
                    }}
                  >
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Afirmaciones Tab ───────────────────────────────────────────────────
const AfirmacionesTab: React.FC<{
  affirmations: Affirmation[];
  onAdd: (affirmation: Affirmation) => void;
  onDelete: (id: string) => void;
}> = ({ affirmations, onAdd, onDelete }) => {
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "evening">("morning");
  const [newAffirmation, setNewAffirmation] = useState("");
  const [showForm, setShowForm] = useState(false);

  const currentAffirmations = affirmations.filter((a) => a.category === timeOfDay);
  const todayAffirmation = currentAffirmations[0] || {
    id: "default",
    text: "Cada día es una nueva oportunidad para crecer",
    category: timeOfDay as "morning" | "evening",
  };

  const handleAddAffirmation = () => {
    if (newAffirmation.trim()) {
      onAdd({
        id: `a${Date.now()}`,
        text: newAffirmation,
        category: timeOfDay,
      });
      setNewAffirmation("");
      setShowForm(false);
    }
  };

  return (
    <div style={{ padding: "30px", backgroundColor: C.paper }}>
      {/* Time Toggle */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", justifyContent: "center" }}>
        <button
          onClick={() => setTimeOfDay("morning")}
          style={{
            padding: "12px 24px",
            backgroundColor: timeOfDay === "morning" ? C.accent : C.lightCream,
            color: timeOfDay === "morning" ? C.paper : C.dark,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600",
            transition: "all 0.2s",
          }}
        >
          <Sun size={18} />
          Mañana
        </button>
        <button
          onClick={() => setTimeOfDay("evening")}
          style={{
            padding: "12px 24px",
            backgroundColor: timeOfDay === "evening" ? C.accent : C.lightCream,
            color: timeOfDay === "evening" ? C.paper : C.dark,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600",
            transition: "all 0.2s",
          }}
        >
          <Moon size={18} />
          Noche
        </button>
      </div>

      {/* Today's Affirmation Card */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.accentGlow}, ${C.accentLight})`,
          borderRadius: "12px",
          padding: "40px 30px",
          textAlign: "center",
          marginBottom: "30px",
          boxShadow: `0 12px 32px rgba(0,0,0,0.2)`,
          minHeight: "200px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: C.dark,
            opacity: 0.8,
            margin: "0 0 15px 0",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {timeOfDay === "morning" ? "Afirmación Matutina" : "Afirmación Nocturna"}
        </p>
        <p
          style={{
            fontSize: "28px",
            fontFamily: "'Georgia', serif",
            color: C.dark,
            margin: 0,
            lineHeight: "1.6",
            fontStyle: "italic",
          }}
        >
          "{todayAffirmation.text}"
        </p>
      </div>

      {/* Add Affirmation Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          marginBottom: "20px",
          padding: "12px 24px",
          backgroundColor: C.success,
          color: C.paper,
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          fontWeight: "600",
          transition: "all 0.2s",
        }}
      >
        <Plus size={18} />
        Nueva Afirmación
      </button>

      {/* Add Form */}
      {showForm && (
        <div
          style={{
            background: C.warmWhite,
            border: `2px solid ${C.success}`,
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <textarea
            value={newAffirmation}
            onChange={(e) => setNewAffirmation(e.target.value)}
            placeholder="Escribe tu nueva afirmación..."
            style={{
              width: "100%",
              minHeight: "60px",
              padding: "12px",
              border: `1px solid ${C.lightCream}`,
              borderRadius: "6px",
              fontSize: "14px",
              marginBottom: "12px",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleAddAffirmation}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: C.success,
                color: C.paper,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Guardar
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: C.lightCream,
                color: C.dark,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Affirmations List */}
      <div style={{ display: "grid", gap: "12px" }}>
        {currentAffirmations.map((affirmation, idx) => (
          <div
            key={affirmation.id}
            style={{
              background: C.warmWhite,
              border: `1px solid ${C.lightCream}`,
              borderRadius: "8px",
              padding: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: C.accentLight,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.dark,
                  fontSize: "12px",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: C.dark,
                  fontStyle: "italic",
                  lineHeight: "1.5",
                }}
              >
                "{affirmation.text}"
              </p>
            </div>
            <button
              onClick={() => onDelete(affirmation.id)}
              style={{
                padding: "6px 10px",
                backgroundColor: C.dangerLight,
                color: C.danger,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                marginLeft: "12px",
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Bucket List Tab ───────────────────────────────────────────────────
const BucketListTab: React.FC<{
  items: BucketListItem[];
  onToggle: (id: string) => void;
  onAdd: (item: BucketListItem) => void;
  onDelete: (id: string) => void;
}> = ({ items, onToggle, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<BucketListItem>>({
    title: "",
    category: "Viajes",
    priority: 1,
  });

  const categories: Array<"Viajes" | "Experiencias" | "Logros" | "Aprendizaje"> = [
    "Viajes",
    "Experiencias",
    "Logros",
    "Aprendizaje",
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Viajes":
        return C.info;
      case "Experiencias":
        return C.accent;
      case "Logros":
        return C.success;
      case "Aprendizaje":
        return C.warning;
      default:
        return C.warm;
    }
  };

  const handleAddItem = () => {
    if (newItem.title) {
      onAdd({
        id: `b${Date.now()}`,
        title: newItem.title || "",
        category: newItem.category as "Viajes" | "Experiencias" | "Logros" | "Aprendizaje",
        deadline: newItem.deadline,
        priority: newItem.priority || 1,
        completed: false,
      });
      setNewItem({ title: "", category: "Viajes", priority: 1 });
      setShowForm(false);
    }
  };

  const completedCount = items.filter((i) => i.completed).length;
  const completionPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div style={{ padding: "30px", backgroundColor: C.paper }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <h3 style={{ fontSize: "16px", fontFamily: "'Georgia', serif", color: C.dark, margin: 0 }}>
            Progreso General
          </h3>
          <span style={{ fontSize: "14px", fontWeight: "bold", color: C.success }}>
            {completedCount} de {items.length} completados ({completionPercent}%)
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: "12px",
            backgroundColor: C.lightCream,
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${completionPercent}%`,
              background: `linear-gradient(90deg, ${C.success}, ${C.successLight})`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Add Item Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          marginBottom: "20px",
          padding: "12px 24px",
          backgroundColor: C.accent,
          color: C.paper,
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          fontWeight: "600",
          transition: "all 0.2s",
        }}
      >
        <Plus size={18} />
        Nuevo Sueño
      </button>

      {/* Add Form */}
      {showForm && (
        <div
          style={{
            background: C.warmWhite,
            border: `2px solid ${C.accent}`,
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ fontSize: "18px", fontFamily: "'Georgia', serif", color: C.dark, marginTop: 0 }}>
            Agregar a tu Bucket List
          </h3>
          <div style={{ display: "grid", gap: "15px" }}>
            <input
              type="text"
              placeholder="¿Qué quieres lograr?"
              value={newItem.title || ""}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              style={{
                padding: "10px",
                border: `1px solid ${C.lightCream}`,
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
            <select
              value={newItem.category || "Viajes"}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
              style={{
                padding: "10px",
                border: `1px solid ${C.lightCream}`,
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              <option value="Viajes">Viajes</option>
              <option value="Experiencias">Experiencias</option>
              <option value="Logros">Logros</option>
              <option value="Aprendizaje">Aprendizaje</option>
            </select>
            <input
              type="date"
              value={newItem.deadline || ""}
              onChange={(e) => setNewItem({ ...newItem, deadline: e.target.value })}
              style={{
                padding: "10px",
                border: `1px solid ${C.lightCream}`,
                borderRadius: "6px",
                fontSize: "14px",
              }}
              placeholder="Fecha límite (opcional)"
            />
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: C.dark, display: "block", marginBottom: "8px" }}>
                Prioridad
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    onClick={() => setNewItem({ ...newItem, priority: p as 1 | 2 | 3 })}
                    style={{
                      flex: 1,
                      padding: "8px",
                      backgroundColor:
                        newItem.priority === p ? C.accent : C.lightCream,
                      color: newItem.priority === p ? C.paper : C.dark,
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    {"★".repeat(p)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleAddItem}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: C.success,
                  color: C.paper,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Guardar
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: C.lightCream,
                  color: C.dark,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items by Category */}
      {categories.map((category) => {
        const categoryItems = items.filter((i) => i.category === category);
        if (categoryItems.length === 0) return null;

        return (
          <div key={category} style={{ marginBottom: "30px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontFamily: "'Georgia', serif",
                color: getCategoryColor(category),
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <BookOpen size={18} />
              {category}
            </h3>
            <div style={{ display: "grid", gap: "10px" }}>
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: C.warmWhite,
                    border: `2px solid ${getCategoryColor(category)}`,
                    borderRadius: "8px",
                    padding: "15px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    opacity: item.completed ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => onToggle(item.id)}
                    style={{
                      width: "24px",
                      height: "24px",
                      minWidth: "24px",
                      borderRadius: "4px",
                      border: `2px solid ${getCategoryColor(category)}`,
                      backgroundColor: item.completed ? getCategoryColor(category) : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    {item.completed && <Check size={16} color={C.paper} />}
                  </button>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "14px",
                        color: C.dark,
                        fontWeight: "500",
                        textDecoration: item.completed ? "line-through" : "none",
                      }}
                    >
                      {item.title}
                    </p>
                    <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: C.warm }}>
                      {item.deadline && (
                        <span>{new Date(item.deadline).toLocaleDateString("es-ES")}</span>
                      )}
                      <span>{"★".repeat(item.priority)}</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDelete(item.id)}
                    style={{
                      padding: "6px 10px",
                      backgroundColor: C.dangerLight,
                      color: C.danger,
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Vision Page ──────────────────────────────────────────────────
export default function VisionPage() {
  const [activeTab, setActiveTab] = useState<"vision" | "manifestacion" | "afirmaciones" | "bucket">("vision");

  // State for Mi Visión
  const [visions, setVisions] = useState(initialVisions);
  const updateVision = (id: string, vision: string, progress: number) => {
    setVisions(visions.map((v) => (v.id === id ? { ...v, vision, progress } : v)));
  };

  // State for Manifestación
  const [goals, setGoals] = useState(initialGoals);
  const addGoal = (goal: ManifestationGoal) => setGoals([...goals, goal]);
  const updateGoal = (id: string, updates: Partial<ManifestationGoal>) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  // State for Afirmaciones
  const [affirmations, setAffirmations] = useState(initialAffirmations);
  const addAffirmation = (affirmation: Affirmation) => setAffirmations([...affirmations, affirmation]);
  const deleteAffirmation = (id: string) => setAffirmations(affirmations.filter((a) => a.id !== id));

  // State for Bucket List
  const [bucketList, setBucketList] = useState(initialBucketList);
  const toggleBucketItem = (id: string) => {
    setBucketList(bucketList.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i)));
  };
  const addBucketItem = (item: BucketListItem) => setBucketList([...bucketList, item]);
  const deleteBucketItem = (id: string) => setBucketList(bucketList.filter((i) => i.id !== id));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.paper }}>
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.dark}, ${C.brown})`,
          color: C.paper,
          padding: "40px 30px",
          textAlign: "center",
          borderBottom: `4px solid ${C.accent}`,
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            fontFamily: "'Georgia', serif",
            margin: "0 0 10px 0",
            fontWeight: "normal",
            letterSpacing: "1px",
          }}
        >
          ✨ Mi Visión
        </h1>
        <p
          style={{
            fontSize: "16px",
            margin: 0,
            opacity: 0.9,
            fontStyle: "italic",
          }}
        >
          Visualiza tus sueños, manifiestalos y conviertelos en realidad
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `2px solid ${C.lightCream}`,
          backgroundColor: C.warmWhite,
          overflowX: "auto",
        }}
      >
        <TabButton isActive={activeTab === "vision"} onClick={() => setActiveTab("vision")}>
          Mi Visión
        </TabButton>
        <TabButton
          isActive={activeTab === "manifestacion"}
          onClick={() => setActiveTab("manifestacion")}
        >
          Manifestación
        </TabButton>
        <TabButton
          isActive={activeTab === "afirmaciones"}
          onClick={() => setActiveTab("afirmaciones")}
        >
          Afirmaciones
        </TabButton>
        <TabButton isActive={activeTab === "bucket"} onClick={() => setActiveTab("bucket")}>
          Bucket List
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === "vision" && (
        <MiVisionTab visions={visions} onUpdate={updateVision} />
      )}
      {activeTab === "manifestacion" && (
        <ManifestacionTab goals={goals} onAddGoal={addGoal} onUpdateGoal={updateGoal} />
      )}
      {activeTab === "afirmaciones" && (
        <AfirmacionesTab
          affirmations={affirmations}
          onAdd={addAffirmation}
          onDelete={deleteAffirmation}
        />
      )}
      {activeTab === "bucket" && (
        <BucketListTab
          items={bucketList}
          onToggle={toggleBucketItem}
          onAdd={addBucketItem}
          onDelete={deleteBucketItem}
        />
      )}
    </div>
  );
}
