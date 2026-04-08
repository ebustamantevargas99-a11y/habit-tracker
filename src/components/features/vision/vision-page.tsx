"use client";

import React, { useState } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";
import {
  Heart, Target, Lightbulb, Plane, Briefcase, Dumbbell, Users, Wallet,
  BookOpen, Star, Plus, Edit2, Trash2, Sun, Moon, Check, Trophy,
  Globe, Zap, Camera, Music, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { colors } from "@/lib/colors";

const C = colors;

// ─── Types ────────────────────────────────────────────────────────────────
interface VisionCategory {
  id: string;
  name: string;
  emoji: string;
  vision: string;
  why: string;
  progress: number;
}

interface Meta {
  id: string;
  title: string;
  category: string;
  deadline: string;
  createdAt: string;
  progress: number;
  actionPlan: { id: string; text: string; done: boolean }[];
  note: string;
}

interface Affirmation {
  id: string;
  text: string;
  category: "morning" | "evening";
}

interface DreamItem {
  id: string;
  title: string;
  category: "Viajes" | "Experiencias" | "Logros" | "Aprendizaje" | "Aventura";
  emoji: string;
  deadline?: string;
  priority: 1 | 2 | 3;
  completed: boolean;
  completedDate?: string;
  note?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(deadline: string, totalDays: number): { bg: string; text: string; label: string } {
  const remaining = daysUntil(deadline);
  if (remaining < 0)  return { bg: C.danger,  text: C.paper,     label: `Vencida hace ${Math.abs(remaining)}d` };
  if (remaining < 14) return { bg: C.dark,    text: C.accentGlow, label: `${remaining} días restantes` };
  if (remaining < 30) return { bg: C.brown,   text: C.accentGlow, label: `${remaining} días restantes` };
  if (remaining < 60) return { bg: C.warm,    text: C.paper,     label: `${remaining} días restantes` };
  if (remaining < 90) return { bg: C.tan,     text: C.dark,      label: `${remaining} días restantes` };
  return { bg: C.cream, text: C.medium, label: `${remaining} días restantes` };
}

function urgencyBarWidth(deadline: string, createdAt: string): number {
  const total = Math.max(1, daysUntil(createdAt) * -1 + daysUntil(deadline) + (daysUntil(createdAt) * -1));
  const remaining = Math.max(0, daysUntil(deadline));
  const elapsed = total - remaining;
  return Math.min(100, Math.round((elapsed / total) * 100));
}

// ─── Initial Data ─────────────────────────────────────────────────────────
const initialVisions: VisionCategory[] = [
  { id: "v1", name: "Salud", emoji: "❤️", vision: "Tener un cuerpo fuerte, energético y lleno de vitalidad", why: "Porque con salud tengo la energía para perseguir todo lo demás", progress: 65 },
  { id: "v2", name: "Carrera", emoji: "💼", vision: "Crear un impacto significativo en mi industria y ser reconocido", why: "Quiero que mi trabajo trascienda y cambie vidas reales", progress: 55 },
  { id: "v3", name: "Relaciones", emoji: "👥", vision: "Construir conexiones profundas y significativas con las personas", why: "Las relaciones son la base de una vida plena y feliz", progress: 72 },
  { id: "v4", name: "Finanzas", emoji: "💰", vision: "Alcanzar la independencia financiera y generar riqueza generacional", why: "La libertad financiera me da opciones y tiempo para lo que importa", progress: 48 },
  { id: "v5", name: "Crecimiento", emoji: "🌱", vision: "Convertirme en la mejor versión de mí mismo cada día", why: "Crecer me da propósito y dirección", progress: 68 },
  { id: "v6", name: "Aventura", emoji: "✈️", vision: "Explorar el mundo y vivir experiencias extraordinarias", why: "Las experiencias son lo único que nos llevamos para siempre", progress: 40 },
];

const initialMetas: Meta[] = [
  {
    id: "m1", title: "Completar mi primer maratón", category: "Salud",
    deadline: "2026-12-31", createdAt: "2026-01-01", progress: 35, note: "",
    actionPlan: [
      { id: "a1", text: "Entrenar 4 días a la semana", done: true },
      { id: "a2", text: "Seguir plan nutricional especializado", done: false },
      { id: "a3", text: "Participar en carrera de prueba", done: false },
    ],
  },
  {
    id: "m2", title: "Lanzar mi proyecto digital", category: "Carrera",
    deadline: "2026-06-30", createdAt: "2026-01-15", progress: 60, note: "",
    actionPlan: [
      { id: "b1", text: "Completar desarrollo del MVP", done: true },
      { id: "b2", text: "Marketing y branding", done: true },
      { id: "b3", text: "Lanzamiento oficial", done: false },
    ],
  },
];

const initialAffirmations: Affirmation[] = [
  { id: "a1", text: "Soy capaz de lograr mis sueños más grandes", category: "morning" },
  { id: "a2", text: "Cada día me acerco más a mi mejor versión", category: "morning" },
  { id: "a3", text: "Merezco éxito, salud y felicidad", category: "morning" },
  { id: "a4", text: "Estoy agradecido por todo lo que he logrado hoy", category: "evening" },
  { id: "a5", text: "Mañana será un día lleno de nuevas oportunidades", category: "evening" },
];

const initialDreams: DreamItem[] = [
  { id: "d1", title: "Escalar el Monte Kilimanjaro", category: "Aventura", emoji: "🏔️", deadline: "2027-06-30", priority: 3, completed: false },
  { id: "d2", title: "Hablar francés con fluidez", category: "Aprendizaje", emoji: "🇫🇷", priority: 2, completed: false },
  { id: "d3", title: "Escribir y publicar un libro", category: "Logros", emoji: "📖", deadline: "2027-12-31", priority: 3, completed: false },
  { id: "d4", title: "Visitar París", category: "Viajes", emoji: "🗼", priority: 2, completed: true, completedDate: "2025-08-14", note: "Increíble, el Louvre me dejó sin palabras" },
  { id: "d5", title: "Dominar la fotografía", category: "Aprendizaje", emoji: "📸", priority: 1, completed: false },
  { id: "d6", title: "Saltar en paracaídas", category: "Aventura", emoji: "🪂", priority: 2, completed: false },
  { id: "d7", title: "Ver las auroras boreales", category: "Viajes", emoji: "🌌", priority: 3, completed: false },
  { id: "d8", title: "Correr un maratón completo", category: "Logros", emoji: "🏅", priority: 2, completed: false },
];

const DREAM_CATEGORY_META: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  Viajes:       { color: C.info,    bg: C.infoLight,    icon: <Globe size={20} color={C.info} /> },
  Aventura:     { color: C.warning, bg: C.warningLight, icon: <Zap size={20} color={C.warning} /> },
  Logros:       { color: C.success, bg: C.successLight, icon: <Trophy size={20} color={C.success} /> },
  Aprendizaje:  { color: C.accent,  bg: C.accentGlow,   icon: <BookOpen size={20} color={C.accent} /> },
  Experiencias: { color: C.danger,  bg: C.dangerLight,  icon: <Star size={20} color={C.danger} /> },
};

// ─── Tab Button ────────────────────────────────────────────────────────────
const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
  <button onClick={onClick} style={{ padding: "14px 22px", borderBottom: isActive ? `3px solid ${C.accent}` : "3px solid transparent", backgroundColor: "transparent", color: isActive ? C.dark : C.warm, fontWeight: isActive ? "700" : "500", cursor: "pointer", fontSize: "14px", transition: "all 0.2s", fontFamily: "'Georgia', serif", whiteSpace: "nowrap" }}>
    {children}
  </button>
);

// ─── MI VISIÓN TAB ─────────────────────────────────────────────────────────
const MiVisionTab: React.FC<{
  visions: VisionCategory[];
  onUpdate: (id: string, v: Partial<VisionCategory>) => void;
  onAdd: (v: VisionCategory) => void;
  onDelete: (id: string) => void;
}> = ({ visions, onUpdate, onAdd, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<VisionCategory>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newArea, setNewArea] = useState({ name: "", emoji: "🎯", vision: "", why: "" });

  const overallScore = Math.round(visions.reduce((s, v) => s + v.progress, 0) / Math.max(1, visions.length));

  const startEdit = (v: VisionCategory) => { setEditingId(v.id); setDraft({ vision: v.vision, why: v.why, progress: v.progress }); };
  const saveEdit = (id: string) => { onUpdate(id, draft); setEditingId(null); };

  const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: `1px solid ${C.tan}`, borderRadius: "8px", fontSize: "14px", backgroundColor: C.cream, color: C.dark, boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ padding: "30px", backgroundColor: C.paper }}>
      {/* Score */}
      <div style={{ background: `linear-gradient(135deg, ${C.dark}, ${C.brown})`, borderRadius: "14px", padding: "32px", marginBottom: "30px", textAlign: "center", border: `3px solid ${C.accent}` }}>
        <p style={{ fontSize: "14px", color: C.lightTan, margin: "0 0 8px 0", letterSpacing: "2px", textTransform: "uppercase" }}>Puntuación de Visión General</p>
        <div style={{ fontSize: "56px", fontWeight: "700", color: C.accentGlow, fontFamily: "'Georgia', serif", lineHeight: 1 }}>{overallScore}%</div>
        <p style={{ fontSize: "14px", color: C.tan, margin: "10px 0 0 0" }}>Tu progreso en todas las áreas de vida</p>
      </div>

      {/* Add Area Button */}
      <button onClick={() => setShowAdd(!showAdd)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: C.accent, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", marginBottom: "20px" }}>
        <Plus size={18} /> Nueva Área de Vida
      </button>

      {showAdd && (
        <div style={{ background: C.lightCream, border: `2px solid ${C.accent}`, borderRadius: "12px", padding: "20px", marginBottom: "24px", display: "grid", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "12px" }}>
            <input placeholder="Emoji" value={newArea.emoji} onChange={e => setNewArea({ ...newArea, emoji: e.target.value })} style={{ ...inp, textAlign: "center", fontSize: "24px" }} />
            <input placeholder="Nombre del área *" value={newArea.name} onChange={e => setNewArea({ ...newArea, name: e.target.value })} style={inp} />
          </div>
          <textarea placeholder="¿Cuál es tu visión para esta área?" value={newArea.vision} onChange={e => setNewArea({ ...newArea, vision: e.target.value })} style={{ ...inp, minHeight: "70px", resize: "vertical" }} />
          <textarea placeholder="¿Por qué es importante para ti?" value={newArea.why} onChange={e => setNewArea({ ...newArea, why: e.target.value })} style={{ ...inp, minHeight: "60px", resize: "vertical" }} />
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => { if (!newArea.name.trim()) return; onAdd({ id: `v${Date.now()}`, name: newArea.name, emoji: newArea.emoji || "🎯", vision: newArea.vision, why: newArea.why, progress: 0 }); setNewArea({ name: "", emoji: "🎯", vision: "", why: "" }); setShowAdd(false); }} style={{ flex: 1, padding: "10px", backgroundColor: C.success, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Guardar</button>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "10px", backgroundColor: C.lightTan, color: C.dark, border: "none", borderRadius: "8px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Vision Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        {visions.map(v => (
          <div key={v.id} style={{ background: C.warmWhite, border: `2px solid ${C.lightCream}`, borderRadius: "14px", padding: "22px", boxShadow: "0 4px 12px rgba(0,0,0,0.07)", transition: "box-shadow 0.2s" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "28px" }}>{v.emoji}</span>
                <h3 style={{ fontSize: "18px", fontFamily: "'Georgia', serif", color: C.dark, margin: 0 }}>{v.name}</h3>
              </div>
              <button onClick={() => onDelete(v.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tan, padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            {editingId === v.id ? (
              <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
                <textarea value={draft.vision ?? ""} onChange={e => setDraft({ ...draft, vision: e.target.value })} placeholder="Tu visión..." style={{ ...inp, minHeight: "70px", resize: "vertical" }} />
                <textarea value={draft.why ?? ""} onChange={e => setDraft({ ...draft, why: e.target.value })} placeholder="¿Por qué importa?" style={{ ...inp, minHeight: "55px", resize: "vertical" }} />
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", color: C.dark, fontWeight: "600" }}>Progreso</label>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: C.accent }}>{draft.progress ?? v.progress}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={draft.progress ?? v.progress} onChange={e => setDraft({ ...draft, progress: Number(e.target.value) })} style={{ width: "100%", accentColor: C.accent }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => saveEdit(v.id)} style={{ flex: 1, padding: "8px", backgroundColor: C.success, color: C.paper, border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Guardar</button>
                  <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "8px", backgroundColor: C.lightCream, color: C.dark, border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "14px", color: C.dark, margin: "0 0 8px 0", lineHeight: "1.6", fontStyle: "italic" }}>"{v.vision}"</p>
                {v.why && <p style={{ fontSize: "12px", color: C.warm, margin: "0 0 14px 0", lineHeight: "1.5" }}>💡 {v.why}</p>}
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: C.dark, fontWeight: "600" }}>Progreso</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: C.accent }}>{v.progress}%</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: C.lightCream, borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${v.progress}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`, transition: "width 0.4s ease" }} />
                  </div>
                </div>
                <button onClick={() => startEdit(v)} style={{ width: "100%", padding: "8px", backgroundColor: C.accentGlow, color: C.dark, border: `1px solid ${C.accentLight}`, borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <Edit2 size={13} /> Editar mi visión
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MIS METAS TAB ─────────────────────────────────────────────────────────
const MisMetasTab: React.FC<{
  metas: Meta[];
  onAdd: (m: Meta) => void;
  onUpdate: (id: string, u: Partial<Meta>) => void;
  onDelete: (id: string) => void;
}> = ({ metas, onAdd, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newMeta, setNewMeta] = useState({ title: "", category: "Salud", deadline: "", note: "" });
  const [newStep, setNewStep] = useState<Record<string, string>>({});

  const inp: React.CSSProperties = { padding: "10px 12px", border: `1px solid ${C.tan}`, borderRadius: "8px", fontSize: "14px", backgroundColor: C.cream, color: C.dark, width: "100%", boxSizing: "border-box" };

  const statusFromProgress = (p: number) => p >= 100 ? "Completado" : p > 0 ? "En Progreso" : "Pendiente";
  const statusColors: Record<string, { bg: string; color: string }> = {
    "Completado":  { bg: C.successLight, color: C.success },
    "En Progreso": { bg: C.infoLight,    color: C.info },
    "Pendiente":   { bg: C.lightCream,   color: C.medium },
  };

  const addStep = (metaId: string) => {
    const text = newStep[metaId]?.trim();
    if (!text) return;
    const meta = metas.find(m => m.id === metaId);
    if (!meta) return;
    onUpdate(metaId, { actionPlan: [...meta.actionPlan, { id: `s${Date.now()}`, text, done: false }] });
    setNewStep({ ...newStep, [metaId]: "" });
  };

  const toggleStep = (metaId: string, stepId: string) => {
    const meta = metas.find(m => m.id === metaId);
    if (!meta) return;
    const updated = meta.actionPlan.map(s => s.id === stepId ? { ...s, done: !s.done } : s);
    const doneCount = updated.filter(s => s.done).length;
    const autoProgress = updated.length > 0 ? Math.round((doneCount / updated.length) * 100) : meta.progress;
    onUpdate(metaId, { actionPlan: updated, progress: autoProgress });
  };

  return (
    <div style={{ padding: "30px", backgroundColor: C.paper }}>
      <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", backgroundColor: C.accent, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", marginBottom: "28px" }}>
        <Plus size={18} /> Nueva Meta
      </button>

      {showForm && (
        <div style={{ background: C.lightCream, border: `2px solid ${C.accent}`, borderRadius: "12px", padding: "22px", marginBottom: "28px", display: "grid", gap: "14px" }}>
          <h3 style={{ margin: "0 0 4px 0", fontFamily: "'Georgia', serif", color: C.dark, fontSize: "18px" }}>Crear Nueva Meta</h3>
          <input placeholder="¿Qué quieres lograr? *" value={newMeta.title} onChange={e => setNewMeta({ ...newMeta, title: e.target.value })} style={inp} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <select value={newMeta.category} onChange={e => setNewMeta({ ...newMeta, category: e.target.value })} style={inp}>
              {["Salud", "Carrera", "Finanzas", "Aventura", "Relaciones", "Crecimiento"].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={newMeta.deadline} onChange={e => setNewMeta({ ...newMeta, deadline: e.target.value })} style={inp} />
          </div>
          <input placeholder="Notas adicionales (opcional)" value={newMeta.note} onChange={e => setNewMeta({ ...newMeta, note: e.target.value })} style={inp} />
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => {
              if (!newMeta.title.trim() || !newMeta.deadline) return;
              onAdd({ id: `m${Date.now()}`, title: newMeta.title, category: newMeta.category, deadline: newMeta.deadline, createdAt: new Date().toISOString().split("T")[0], progress: 0, actionPlan: [], note: newMeta.note });
              setNewMeta({ title: "", category: "Salud", deadline: "", note: "" });
              setShowForm(false);
            }} style={{ flex: 1, padding: "10px", backgroundColor: C.success, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Guardar Meta</button>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", backgroundColor: C.lightTan, color: C.dark, border: "none", borderRadius: "8px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: "18px" }}>
        {metas.map(meta => {
          const status = statusFromProgress(meta.progress);
          const sc = statusColors[status];
          const isExpanded = expandedId === meta.id;
          const days = daysUntil(meta.deadline);
          const uc = urgencyColor(meta.deadline, 1);
          const barW = urgencyBarWidth(meta.deadline, meta.createdAt);
          const isComplete = meta.progress >= 100;

          return (
            <div key={meta.id} style={{ background: C.warmWhite, border: `2px solid ${isComplete ? C.success : C.lightCream}`, borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 14px rgba(0,0,0,0.07)", transition: "all 0.2s" }}>
              {/* Countdown Bar */}
              <div style={{ height: "6px", backgroundColor: C.lightCream, position: "relative" }}>
                <div style={{ height: "100%", width: `${barW}%`, backgroundColor: uc.bg, transition: "width 0.5s ease" }} />
              </div>

              <div style={{ padding: "20px" }}>
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "17px", fontFamily: "'Georgia', serif", color: C.dark, margin: "0 0 6px 0" }}>
                      {isComplete && "✅ "}{meta.title}
                    </h3>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: C.warm, backgroundColor: C.lightCream, padding: "2px 8px", borderRadius: "12px" }}>{meta.category}</span>
                      <span style={{ fontSize: "12px", padding: "2px 10px", borderRadius: "12px", backgroundColor: sc.bg, color: sc.color, fontWeight: "600" }}>{status}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                    <button onClick={() => onDelete(meta.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tan, padding: "4px" }}><X size={16} /></button>
                  </div>
                </div>

                {/* Countdown Badge */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", backgroundColor: uc.bg, borderRadius: "20px", marginBottom: "14px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: uc.text }}>⏱ {uc.label}</span>
                  <span style={{ fontSize: "11px", color: uc.text, opacity: 0.8 }}>· {new Date(meta.deadline).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>

                {/* Progress Slider */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: C.dark }}>Progreso manual</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: C.accent }}>{meta.progress}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={meta.progress} onChange={e => onUpdate(meta.id, { progress: Number(e.target.value) })} style={{ width: "100%", accentColor: C.accent }} />
                  <div style={{ width: "100%", height: "6px", backgroundColor: C.lightCream, borderRadius: "3px", overflow: "hidden", marginTop: "4px" }}>
                    <div style={{ height: "100%", width: `${meta.progress}%`, background: isComplete ? `linear-gradient(90deg, ${C.success}, ${C.successLight})` : `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`, transition: "width 0.3s" }} />
                  </div>
                </div>

                {/* Expand/Collapse */}
                <button onClick={() => setExpandedId(isExpanded ? null : meta.id)} style={{ width: "100%", padding: "8px", backgroundColor: C.lightCream, color: C.dark, border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "600" }}>
                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  {isExpanded ? "Ocultar plan de acción" : `Plan de acción (${meta.actionPlan.filter(s => s.done).length}/${meta.actionPlan.length})`}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: "16px", display: "grid", gap: "8px" }}>
                    {meta.actionPlan.map(step => (
                      <div key={step.id} onClick={() => toggleStep(meta.id, step.id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", backgroundColor: step.done ? C.successLight : C.paper, border: `1px solid ${step.done ? C.success : C.lightTan}`, borderRadius: "8px", cursor: "pointer", transition: "all 0.15s" }}>
                        <div style={{ width: "20px", height: "20px", minWidth: "20px", borderRadius: "50%", border: `2px solid ${step.done ? C.success : C.tan}`, backgroundColor: step.done ? C.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {step.done && <Check size={12} color={C.paper} />}
                        </div>
                        <span style={{ fontSize: "13px", color: C.dark, textDecoration: step.done ? "line-through" : "none", opacity: step.done ? 0.7 : 1 }}>{step.text}</span>
                      </div>
                    ))}
                    {/* Add step */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <input placeholder="Agregar paso..." value={newStep[meta.id] ?? ""} onChange={e => setNewStep({ ...newStep, [meta.id]: e.target.value })} onKeyDown={e => e.key === "Enter" && addStep(meta.id)} style={{ ...inp, fontSize: "13px", padding: "8px 12px" }} />
                      <button onClick={() => addStep(meta.id)} style={{ padding: "8px 14px", backgroundColor: C.accent, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap" }}>+ Agregar</button>
                    </div>
                    {meta.note && <p style={{ fontSize: "12px", color: C.warm, fontStyle: "italic", margin: "6px 0 0 0" }}>📝 {meta.note}</p>}
                  </div>
                )}

                {isComplete && (
                  <div style={{ marginTop: "14px", padding: "12px", background: `linear-gradient(135deg, ${C.successLight}, ${C.accentGlow})`, borderRadius: "10px", textAlign: "center", border: `1px solid ${C.success}` }}>
                    <span style={{ fontSize: "20px" }}>🏆</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "700", color: C.dark }}>¡Meta cumplida! Felicitaciones.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── AFIRMACIONES TAB ──────────────────────────────────────────────────────
const AfirmacionesTab: React.FC<{
  affirmations: Affirmation[];
  onAdd: (a: Affirmation) => void;
  onDelete: (id: string) => void;
}> = ({ affirmations, onAdd, onDelete }) => {
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "evening">("morning");
  const [newText, setNewText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const current = affirmations.filter(a => a.category === timeOfDay);
  const featured = current[Math.floor(new Date().getDate() % Math.max(1, current.length))] ?? current[0];

  return (
    <div style={{ padding: "30px", backgroundColor: C.paper }}>
      <div style={{ display: "flex", gap: "16px", marginBottom: "28px", justifyContent: "center" }}>
        {(["morning", "evening"] as const).map(t => (
          <button key={t} onClick={() => setTimeOfDay(t)} style={{ padding: "12px 28px", backgroundColor: timeOfDay === t ? C.accent : C.lightCream, color: timeOfDay === t ? C.paper : C.dark, border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            {t === "morning" ? <><Sun size={18} /> Mañana</> : <><Moon size={18} /> Noche</>}
          </button>
        ))}
      </div>

      {featured && (
        <div style={{ background: `linear-gradient(135deg, ${C.accentGlow}, ${C.accentLight})`, borderRadius: "16px", padding: "44px 32px", textAlign: "center", marginBottom: "28px", boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", color: C.dark, opacity: 0.7, margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "2px" }}>
            {timeOfDay === "morning" ? "Afirmación del Día" : "Reflexión Nocturna"}
          </p>
          <p style={{ fontSize: "26px", fontFamily: "'Georgia', serif", color: C.dark, margin: 0, lineHeight: "1.6", fontStyle: "italic" }}>"{featured.text}"</p>
        </div>
      )}

      <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", backgroundColor: C.success, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", marginBottom: "18px" }}>
        <Plus size={18} /> Nueva Afirmación
      </button>

      {showForm && (
        <div style={{ background: C.lightCream, border: `2px solid ${C.success}`, borderRadius: "12px", padding: "18px", marginBottom: "20px", display: "grid", gap: "10px" }}>
          <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Escribe tu afirmación en positivo, presente..." style={{ padding: "12px", border: `1px solid ${C.tan}`, borderRadius: "8px", fontSize: "14px", minHeight: "70px", resize: "vertical", backgroundColor: C.cream, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => { if (newText.trim()) { onAdd({ id: `a${Date.now()}`, text: newText, category: timeOfDay }); setNewText(""); setShowForm(false); } }} style={{ flex: 1, padding: "10px", backgroundColor: C.success, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Guardar</button>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", backgroundColor: C.lightTan, color: C.dark, border: "none", borderRadius: "8px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: "10px" }}>
        {current.map((a, idx) => (
          <div key={a.id} style={{ background: C.warmWhite, border: `1px solid ${C.lightCream}`, borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "28px", height: "28px", minWidth: "28px", backgroundColor: C.accentGlow, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: C.dark }}>{idx + 1}</span>
            <p style={{ margin: 0, fontSize: "14px", color: C.dark, fontStyle: "italic", lineHeight: "1.5", flex: 1 }}>"{a.text}"</p>
            <button onClick={() => onDelete(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tan, padding: "4px", flexShrink: 0 }}><Trash2 size={15} /></button>
          </div>
        ))}
        {current.length === 0 && <p style={{ color: C.warm, fontStyle: "italic", textAlign: "center", padding: "20px" }}>No hay afirmaciones {timeOfDay === "morning" ? "matutinas" : "nocturnas"} aún. ¡Agrega la primera!</p>}
      </div>
    </div>
  );
};

// ─── LISTA DE VIDA TAB ─────────────────────────────────────────────────────
const ListaDeVidaTab: React.FC<{
  items: DreamItem[];
  onToggle: (id: string) => void;
  onAdd: (item: DreamItem) => void;
  onDelete: (id: string) => void;
}> = ({ items, onToggle, onAdd, onDelete }) => {
  const [filter, setFilter] = useState<string>("Todos");
  const [showForm, setShowForm] = useState(false);
  const [newDream, setNewDream] = useState({ title: "", category: "Viajes" as DreamItem["category"], emoji: "", deadline: "", priority: 2 as 1 | 2 | 3 });
  const [showCompleted, setShowCompleted] = useState(false);

  const categories = ["Todos", "Viajes", "Aventura", "Logros", "Aprendizaje", "Experiencias"];
  const pending = items.filter(i => !i.completed && (filter === "Todos" || i.category === filter));
  const completed = items.filter(i => i.completed);
  const nextDream = [...items].filter(i => !i.completed).sort((a, b) => b.priority - a.priority)[0];
  const completionPct = Math.round((completed.length / Math.max(1, items.length)) * 100);

  const inp: React.CSSProperties = { padding: "10px 12px", border: `1px solid ${C.tan}`, borderRadius: "8px", fontSize: "14px", backgroundColor: C.cream, color: C.dark, width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ padding: "30px", backgroundColor: C.paper }}>
      {/* Epic Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.dark}, ${C.brown})`, borderRadius: "16px", padding: "28px", marginBottom: "28px", textAlign: "center", border: `3px solid ${C.accent}` }}>
        <p style={{ fontSize: "13px", color: C.tan, margin: "0 0 6px 0", letterSpacing: "2px", textTransform: "uppercase" }}>Tu Lista de Vida</p>
        <div style={{ fontSize: "48px", fontWeight: "700", color: C.accentGlow, fontFamily: "'Georgia', serif", lineHeight: 1 }}>{completed.length} <span style={{ fontSize: "24px", color: C.tan }}>/ {items.length}</span></div>
        <p style={{ fontSize: "14px", color: C.lightTan, margin: "8px 0 14px 0" }}>sueños cumplidos · {completionPct}% de tu lista de vida</p>
        <div style={{ width: "80%", height: "10px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "5px", overflow: "hidden", margin: "0 auto" }}>
          <div style={{ height: "100%", width: `${completionPct}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.accentGlow})`, borderRadius: "5px", transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* Next Dream Spotlight */}
      {nextDream && (
        <div style={{ background: `linear-gradient(135deg, ${C.accentGlow}, ${C.cream})`, border: `2px solid ${C.accent}`, borderRadius: "14px", padding: "18px 22px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "36px" }}>{nextDream.emoji || "🌟"}</span>
          <div>
            <p style={{ fontSize: "11px", fontWeight: "700", color: C.accent, margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "1px" }}>⭐ Tu próximo gran sueño</p>
            <p style={{ fontSize: "17px", fontFamily: "'Georgia', serif", color: C.dark, margin: 0, fontWeight: "600" }}>{nextDream.title}</p>
            {nextDream.deadline && <p style={{ fontSize: "12px", color: C.warm, margin: "4px 0 0 0" }}>Meta: {new Date(nextDream.deadline).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{ padding: "7px 16px", border: "none", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "600", backgroundColor: filter === cat ? C.accent : C.lightCream, color: filter === cat ? C.paper : C.dark, transition: "all 0.2s" }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", backgroundColor: C.accent, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", marginBottom: "20px" }}>
        <Plus size={18} /> Nuevo Sueño
      </button>

      {showForm && (
        <div style={{ background: C.lightCream, border: `2px solid ${C.accent}`, borderRadius: "12px", padding: "20px", marginBottom: "24px", display: "grid", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "12px" }}>
            <input placeholder="Emoji" value={newDream.emoji} onChange={e => setNewDream({ ...newDream, emoji: e.target.value })} style={{ ...inp, textAlign: "center", fontSize: "22px" }} />
            <input placeholder="¿Cuál es tu sueño? *" value={newDream.title} onChange={e => setNewDream({ ...newDream, title: e.target.value })} style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <select value={newDream.category} onChange={e => setNewDream({ ...newDream, category: e.target.value as DreamItem["category"] })} style={inp}>
              {["Viajes", "Aventura", "Logros", "Aprendizaje", "Experiencias"].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={newDream.deadline} onChange={e => setNewDream({ ...newDream, deadline: e.target.value })} style={inp} />
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: "600", color: C.dark, margin: "0 0 8px 0" }}>Prioridad</p>
            <div style={{ display: "flex", gap: "10px" }}>
              {([1, 2, 3] as const).map(p => (
                <button key={p} onClick={() => setNewDream({ ...newDream, priority: p })} style={{ flex: 1, padding: "8px", backgroundColor: newDream.priority === p ? C.accent : C.lightCream, color: newDream.priority === p ? C.paper : C.dark, border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
                  {"⭐".repeat(p)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => { if (!newDream.title.trim()) return; onAdd({ id: `d${Date.now()}`, title: newDream.title, category: newDream.category, emoji: newDream.emoji || "🌟", deadline: newDream.deadline || undefined, priority: newDream.priority, completed: false }); setNewDream({ title: "", category: "Viajes", emoji: "", deadline: "", priority: 2 }); setShowForm(false); }} style={{ flex: 1, padding: "10px", backgroundColor: C.success, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Guardar Sueño</button>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", backgroundColor: C.lightTan, color: C.dark, border: "none", borderRadius: "8px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Pending Dreams Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {pending.map(item => {
          const meta = DREAM_CATEGORY_META[item.category] ?? DREAM_CATEGORY_META.Viajes;
          return (
            <div key={item.id} style={{ background: meta.bg, border: `2px solid ${meta.color}20`, borderRadius: "14px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.07)", position: "relative", transition: "transform 0.15s", cursor: "default" }}>
              {/* Priority Stars */}
              <div style={{ position: "absolute", top: "14px", right: "14px", display: "flex", gap: "2px" }}>
                {Array.from({ length: item.priority }).map((_, i) => <span key={i} style={{ fontSize: "12px" }}>⭐</span>)}
              </div>
              <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>{item.emoji || "🌟"}</span>
              <h3 style={{ fontSize: "15px", fontFamily: "'Georgia', serif", color: C.dark, margin: "0 0 8px 0", fontWeight: "700", paddingRight: "40px" }}>{item.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                {meta.icon}
                <span style={{ fontSize: "12px", color: meta.color, fontWeight: "600" }}>{item.category}</span>
                {item.deadline && <span style={{ fontSize: "11px", color: C.warm, marginLeft: "auto" }}>{new Date(item.deadline).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}</span>}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => onToggle(item.id)} style={{ flex: 1, padding: "8px", backgroundColor: C.success, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <Check size={14} /> ¡Logrado!
                </button>
                <button onClick={() => onDelete(item.id)} style={{ padding: "8px 10px", backgroundColor: "rgba(0,0,0,0.08)", border: "none", borderRadius: "8px", cursor: "pointer", color: C.dark }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {pending.length === 0 && <p style={{ color: C.warm, fontStyle: "italic", padding: "20px", gridColumn: "1/-1", textAlign: "center" }}>No hay sueños en esta categoría. ¡Agrega uno!</p>}
      </div>

      {/* Completed Dreams */}
      {completed.length > 0 && (
        <div>
          <button onClick={() => setShowCompleted(!showCompleted)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", backgroundColor: C.successLight, color: C.success, border: `2px solid ${C.success}`, borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px", marginBottom: "16px", width: "100%" }}>
            {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            🏆 Sueños Cumplidos ({completed.length})
          </button>
          {showCompleted && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
              {completed.map(item => (
                <div key={item.id} style={{ background: C.successLight, border: `2px solid ${C.success}`, borderRadius: "14px", padding: "18px", position: "relative", opacity: 0.9 }}>
                  <div style={{ position: "absolute", top: "12px", right: "12px", backgroundColor: C.success, color: C.paper, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>✓ LOGRADO</div>
                  <span style={{ fontSize: "36px", display: "block", marginBottom: "10px" }}>{item.emoji || "✅"}</span>
                  <h3 style={{ fontSize: "14px", fontFamily: "'Georgia', serif", color: C.dark, margin: "0 0 4px 0", paddingRight: "70px" }}>{item.title}</h3>
                  {item.completedDate && <p style={{ fontSize: "11px", color: C.success, margin: "0 0 10px 0", fontWeight: "600" }}>Logrado: {new Date(item.completedDate).toLocaleDateString("es-ES")}</p>}
                  {item.note && <p style={{ fontSize: "12px", color: C.dark, fontStyle: "italic", margin: "0 0 10px 0", lineHeight: "1.5" }}>"{item.note}"</p>}
                  <button onClick={() => onToggle(item.id)} style={{ fontSize: "11px", color: C.warm, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Marcar como pendiente</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Vision Page ──────────────────────────────────────────────────────
export default function VisionPage() {
  const [activeTab, setActiveTab] = useState<"vision" | "metas" | "afirmaciones" | "vida">("vision");

  const [visions, setVisions] = useLocalStorage<VisionCategory[]>("vision_visions", initialVisions);
  const [metas, setMetas] = useLocalStorage<Meta[]>("vision_metas", initialMetas);
  const [affirmations, setAffirmations] = useLocalStorage<Affirmation[]>("vision_affirmations", initialAffirmations);
  const [dreams, setDreams] = useLocalStorage<DreamItem[]>("vision_dreams", initialDreams);

  const updateVision = (id: string, updates: Partial<VisionCategory>) => setVisions(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  const addVision = (v: VisionCategory) => setVisions(prev => [...prev, v]);
  const deleteVision = (id: string) => setVisions(prev => prev.filter(v => v.id !== id));

  const addMeta = (m: Meta) => setMetas(prev => [...prev, m]);
  const updateMeta = (id: string, u: Partial<Meta>) => setMetas(prev => prev.map(m => m.id === id ? { ...m, ...u } : m));
  const deleteMeta = (id: string) => setMetas(prev => prev.filter(m => m.id !== id));

  const addAffirmation = (a: Affirmation) => setAffirmations(prev => [...prev, a]);
  const deleteAffirmation = (id: string) => setAffirmations(prev => prev.filter(a => a.id !== id));

  const toggleDream = (id: string) => setDreams(prev => prev.map(d => d.id === id ? { ...d, completed: !d.completed, completedDate: !d.completed ? new Date().toISOString().split("T")[0] : undefined } : d));
  const addDream = (item: DreamItem) => setDreams(prev => [...prev, item]);
  const deleteDream = (id: string) => setDreams(prev => prev.filter(d => d.id !== id));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.paper }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.dark}, ${C.brown})`, padding: "36px 30px", textAlign: "center", borderBottom: `4px solid ${C.accent}` }}>
        <h1 style={{ fontSize: "40px", fontFamily: "'Georgia', serif", margin: "0 0 8px 0", fontWeight: "normal", letterSpacing: "1px", color: C.accentGlow }}>
          ✨ Mi Visión
        </h1>
        <p style={{ fontSize: "15px", margin: 0, color: C.lightTan, fontStyle: "italic" }}>
          Visualiza tus sueños, manifiestalos y conviértelos en realidad
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `2px solid ${C.lightCream}`, backgroundColor: C.warmWhite, overflowX: "auto" }}>
        <TabButton isActive={activeTab === "vision"} onClick={() => setActiveTab("vision")}>Mi Visión</TabButton>
        <TabButton isActive={activeTab === "metas"} onClick={() => setActiveTab("metas")}>Mis Metas</TabButton>
        <TabButton isActive={activeTab === "afirmaciones"} onClick={() => setActiveTab("afirmaciones")}>Afirmaciones</TabButton>
        <TabButton isActive={activeTab === "vida"} onClick={() => setActiveTab("vida")}>Lista de Vida</TabButton>
      </div>

      {activeTab === "vision" && <MiVisionTab visions={visions} onUpdate={updateVision} onAdd={addVision} onDelete={deleteVision} />}
      {activeTab === "metas" && <MisMetasTab metas={metas} onAdd={addMeta} onUpdate={updateMeta} onDelete={deleteMeta} />}
      {activeTab === "afirmaciones" && <AfirmacionesTab affirmations={affirmations} onAdd={addAffirmation} onDelete={deleteAffirmation} />}
      {activeTab === "vida" && <ListaDeVidaTab items={dreams} onToggle={toggleDream} onAdd={addDream} onDelete={deleteDream} />}
    </div>
  );
}
