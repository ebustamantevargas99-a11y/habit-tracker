"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";
import {
  Heart, Target, Lightbulb, Plane, Briefcase, Dumbbell, Users, Wallet,
  BookOpen, Star, Plus, Edit2, Trash2, Sun, Moon, Check, Trophy,
  Globe, Zap, Camera, Music, ChevronDown, ChevronUp, X,
  TrendingUp, Calendar, Award, Clock, ChevronRight, Minus,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell,
} from "recharts";
import { colors } from "@/lib/colors";
import { cn, ErrorBanner } from "@/components/ui";
import { useOKRStore, Objective, ObjType } from "@/stores/okr-store";
import { useOrganizationStore } from "@/stores/organization-store";

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

function urgencyClasses(deadline: string): { bgClass: string; textClass: string; label: string } {
  const remaining = daysUntil(deadline);
  if (remaining < 0)  return { bgClass: "bg-danger",      textClass: "text-brand-paper", label: `Vencida hace ${Math.abs(remaining)}d` };
  if (remaining < 14) return { bgClass: "bg-brand-dark",  textClass: "text-accent-glow", label: `${remaining} días restantes` };
  if (remaining < 30) return { bgClass: "bg-brand-brown", textClass: "text-accent-glow", label: `${remaining} días restantes` };
  if (remaining < 60) return { bgClass: "bg-brand-warm",  textClass: "text-brand-paper", label: `${remaining} días restantes` };
  if (remaining < 90) return { bgClass: "bg-brand-tan",   textClass: "text-brand-dark",  label: `${remaining} días restantes` };
  return { bgClass: "bg-brand-cream", textClass: "text-brand-medium", label: `${remaining} días restantes` };
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

const DREAM_CATEGORY_META: Record<string, { bgClass: string; textClass: string; borderColor: string; icon: React.ReactNode }> = {
  Viajes:       { bgClass: "bg-info-light",    textClass: "text-info",    borderColor: C.info,    icon: <Globe size={20} color={C.info} /> },
  Aventura:     { bgClass: "bg-warning-light", textClass: "text-warning", borderColor: C.warning, icon: <Zap size={20} color={C.warning} /> },
  Logros:       { bgClass: "bg-success-light", textClass: "text-success", borderColor: C.success, icon: <Trophy size={20} color={C.success} /> },
  Aprendizaje:  { bgClass: "bg-accent-glow",   textClass: "text-accent",  borderColor: C.accent,  icon: <BookOpen size={20} color={C.accent} /> },
  Experiencias: { bgClass: "bg-danger-light",  textClass: "text-danger",  borderColor: C.danger,  icon: <Star size={20} color={C.danger} /> },
};

const INP = "w-full px-3 py-[10px] border border-brand-tan rounded-lg text-sm bg-brand-cream text-brand-dark box-border font-[inherit]";

// ─── Tab Button ────────────────────────────────────────────────────────────
const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-[22px] py-[14px] border-b-[3px] bg-transparent cursor-pointer text-sm transition-all font-serif whitespace-nowrap",
      isActive ? "border-b-accent text-brand-dark font-bold" : "border-b-transparent text-brand-warm font-medium"
    )}
  >
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

  return (
    <div className="p-[30px] bg-brand-paper">
      {/* Score */}
      <div className="bg-[linear-gradient(135deg,#3D2B1F_0%,#6B4226_100%)] rounded-[14px] p-8 mb-[30px] text-center border-[3px] border-accent">
        <p className="text-sm text-brand-light-tan m-0 mb-2 tracking-[2px] uppercase">Puntuación de Visión General</p>
        <div className="text-[56px] font-bold text-accent-glow font-serif leading-none">{overallScore}%</div>
        <p className="text-sm text-brand-tan mt-[10px] mb-0">Tu progreso en todas las áreas de vida</p>
      </div>

      {/* Add Area Button */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center gap-2 px-5 py-[10px] bg-accent text-brand-paper border-none rounded-lg cursor-pointer font-semibold text-sm mb-5"
      >
        <Plus size={18} /> Nueva Área de Vida
      </button>

      {showAdd && (
        <div className="bg-brand-light-cream border-2 border-accent rounded-xl p-5 mb-6 grid gap-3">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <input placeholder="Emoji" value={newArea.emoji} onChange={e => setNewArea({ ...newArea, emoji: e.target.value })} className={cn(INP, "text-center text-2xl")} />
            <input placeholder="Nombre del área *" value={newArea.name} onChange={e => setNewArea({ ...newArea, name: e.target.value })} className={INP} />
          </div>
          <textarea placeholder="¿Cuál es tu visión para esta área?" value={newArea.vision} onChange={e => setNewArea({ ...newArea, vision: e.target.value })} className={cn(INP, "min-h-[70px] resize-vertical")} />
          <textarea placeholder="¿Por qué es importante para ti?" value={newArea.why} onChange={e => setNewArea({ ...newArea, why: e.target.value })} className={cn(INP, "min-h-[60px] resize-vertical")} />
          <div className="flex gap-[10px]">
            <button
              onClick={() => {
                if (!newArea.name.trim()) return;
                onAdd({ id: `v${Date.now()}`, name: newArea.name, emoji: newArea.emoji || "🎯", vision: newArea.vision, why: newArea.why, progress: 0 });
                setNewArea({ name: "", emoji: "🎯", vision: "", why: "" });
                setShowAdd(false);
              }}
              className="flex-1 py-[10px] bg-success text-brand-paper border-none rounded-lg cursor-pointer font-semibold"
            >Guardar</button>
            <button onClick={() => setShowAdd(false)} className="flex-1 py-[10px] bg-brand-light-tan text-brand-dark border-none rounded-lg cursor-pointer">Cancelar</button>
          </div>
        </div>
      )}

      {/* Vision Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
        {visions.map(v => (
          <div key={v.id} className="bg-brand-warm-white border-2 border-brand-light-cream rounded-[14px] p-[22px] shadow-[0_4px_12px_rgba(0,0,0,0.07)] transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-[14px]">
              <div className="flex items-center gap-[10px]">
                <span className="text-[28px]">{v.emoji}</span>
                <h3 className="text-[18px] font-serif text-brand-dark m-0">{v.name}</h3>
              </div>
              <button onClick={() => onDelete(v.id)} className="bg-transparent border-none cursor-pointer text-brand-tan p-1">
                <X size={16} />
              </button>
            </div>

            {editingId === v.id ? (
              <div className="grid gap-[10px] mb-[14px]">
                <textarea value={draft.vision ?? ""} onChange={e => setDraft({ ...draft, vision: e.target.value })} placeholder="Tu visión..." className={cn(INP, "min-h-[70px] resize-vertical")} />
                <textarea value={draft.why ?? ""} onChange={e => setDraft({ ...draft, why: e.target.value })} placeholder="¿Por qué importa?" className={cn(INP, "min-h-[55px] resize-vertical")} />
                <div>
                  <div className="flex justify-between mb-[6px]">
                    <label className="text-xs text-brand-dark font-semibold">Progreso</label>
                    <span className="text-xs font-bold text-accent">{draft.progress ?? v.progress}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={draft.progress ?? v.progress} onChange={e => setDraft({ ...draft, progress: Number(e.target.value) })} className="w-full" style={{ accentColor: C.accent }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(v.id)} className="flex-1 py-2 bg-success text-brand-paper border-none rounded-md cursor-pointer font-semibold text-[13px]">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-brand-light-cream text-brand-dark border-none rounded-md cursor-pointer text-[13px]">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-brand-dark m-0 mb-2 leading-[1.6] italic">"{v.vision}"</p>
                {v.why && <p className="text-xs text-brand-warm m-0 mb-[14px] leading-[1.5]">💡 {v.why}</p>}
                <div className="mb-[14px]">
                  <div className="flex justify-between mb-[6px]">
                    <span className="text-xs text-brand-dark font-semibold">Progreso</span>
                    <span className="text-[13px] font-bold text-accent">{v.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-brand-light-cream rounded-[4px] overflow-hidden">
                    <div className="h-full bg-[linear-gradient(90deg,#B8860B,#D4A843)] transition-[width] duration-[400ms]" style={{ width: `${v.progress}%` }} />
                  </div>
                </div>
                <button onClick={() => startEdit(v)} className="w-full py-2 bg-accent-glow text-brand-dark border border-accent-light rounded-lg cursor-pointer text-[13px] font-semibold flex items-center justify-center gap-[6px]">
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

  const STATUS_CLASSES: Record<string, { bg: string; text: string }> = {
    "Completado":  { bg: "bg-success-light",    text: "text-success" },
    "En Progreso": { bg: "bg-info-light",        text: "text-info"    },
    "Pendiente":   { bg: "bg-brand-light-cream", text: "text-brand-medium" },
  };

  const statusFromProgress = (p: number) => p >= 100 ? "Completado" : p > 0 ? "En Progreso" : "Pendiente";

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
    <div className="p-[30px] bg-brand-paper">
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-6 py-3 bg-accent text-brand-paper border-none rounded-lg cursor-pointer font-semibold text-sm mb-7"
      >
        <Plus size={18} /> Nueva Meta
      </button>

      {showForm && (
        <div className="bg-brand-light-cream border-2 border-accent rounded-xl p-[22px] mb-7 grid gap-[14px]">
          <h3 className="m-0 mb-1 font-serif text-brand-dark text-[18px]">Crear Nueva Meta</h3>
          <input placeholder="¿Qué quieres lograr? *" value={newMeta.title} onChange={e => setNewMeta({ ...newMeta, title: e.target.value })} className={INP} />
          <div className="grid grid-cols-2 gap-3">
            <select value={newMeta.category} onChange={e => setNewMeta({ ...newMeta, category: e.target.value })} className={INP}>
              {["Salud", "Carrera", "Finanzas", "Aventura", "Relaciones", "Crecimiento"].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={newMeta.deadline} onChange={e => setNewMeta({ ...newMeta, deadline: e.target.value })} className={INP} />
          </div>
          <input placeholder="Notas adicionales (opcional)" value={newMeta.note} onChange={e => setNewMeta({ ...newMeta, note: e.target.value })} className={INP} />
          <div className="flex gap-[10px]">
            <button
              onClick={() => {
                if (!newMeta.title.trim() || !newMeta.deadline) return;
                onAdd({ id: `m${Date.now()}`, title: newMeta.title, category: newMeta.category, deadline: newMeta.deadline, createdAt: new Date().toISOString().split("T")[0], progress: 0, actionPlan: [], note: newMeta.note });
                setNewMeta({ title: "", category: "Salud", deadline: "", note: "" });
                setShowForm(false);
              }}
              className="flex-1 py-[10px] bg-success text-brand-paper border-none rounded-lg cursor-pointer font-semibold"
            >Guardar Meta</button>
            <button onClick={() => setShowForm(false)} className="flex-1 py-[10px] bg-brand-light-tan text-brand-dark border-none rounded-lg cursor-pointer">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid gap-[18px]">
        {metas.map(meta => {
          const status = statusFromProgress(meta.progress);
          const sc = STATUS_CLASSES[status];
          const isExpanded = expandedId === meta.id;
          const uc = urgencyClasses(meta.deadline);
          const barW = urgencyBarWidth(meta.deadline, meta.createdAt);
          const isComplete = meta.progress >= 100;

          return (
            <div key={meta.id} className={cn("bg-brand-warm-white border-2 rounded-[14px] overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.07)] transition-all", isComplete ? "border-success" : "border-brand-light-cream")}>
              {/* Countdown Bar */}
              <div className="h-[6px] bg-brand-light-cream relative">
                <div className={cn("h-full transition-[width] duration-500", uc.bgClass)} style={{ width: `${barW}%` }} />
              </div>

              <div className="p-5">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="flex-1">
                    <h3 className="text-[17px] font-serif text-brand-dark m-0 mb-[6px]">
                      {isComplete && "✅ "}{meta.title}
                    </h3>
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className="text-xs text-brand-warm bg-brand-light-cream px-2 py-[2px] rounded-xl">{meta.category}</span>
                      <span className={cn("text-xs px-[10px] py-[2px] rounded-xl font-semibold", sc.bg, sc.text)}>{status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
                    <button onClick={() => onDelete(meta.id)} className="bg-transparent border-none cursor-pointer text-brand-tan p-1"><X size={16} /></button>
                  </div>
                </div>

                {/* Countdown Badge */}
                <div className={cn("inline-flex items-center gap-[6px] px-3 py-[5px] rounded-[20px] mb-[14px]", uc.bgClass)}>
                  <span className={cn("text-xs font-bold", uc.textClass)}>⏱ {uc.label}</span>
                  <span className={cn("text-[11px] opacity-80", uc.textClass)}>· {new Date(meta.deadline).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>

                {/* Progress Slider */}
                <div className="mb-4">
                  <div className="flex justify-between mb-[6px]">
                    <span className="text-xs font-semibold text-brand-dark">Progreso manual</span>
                    <span className="text-[13px] font-bold text-accent">{meta.progress}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={meta.progress} onChange={e => onUpdate(meta.id, { progress: Number(e.target.value) })} className="w-full" style={{ accentColor: C.accent }} />
                  <div className="w-full h-[6px] bg-brand-light-cream rounded-[3px] overflow-hidden mt-1">
                    <div
                      className={cn("h-full transition-[width] duration-300", isComplete ? "bg-[linear-gradient(90deg,#7A9E3E,#D4E6B5)]" : "bg-[linear-gradient(90deg,#B8860B,#D4A843)]")}
                      style={{ width: `${meta.progress}%` }}
                    />
                  </div>
                </div>

                {/* Expand/Collapse */}
                <button onClick={() => setExpandedId(isExpanded ? null : meta.id)} className="w-full py-2 bg-brand-light-cream text-brand-dark border-none rounded-lg cursor-pointer text-[13px] flex items-center justify-center gap-[6px] font-semibold">
                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  {isExpanded ? "Ocultar plan de acción" : `Plan de acción (${meta.actionPlan.filter(s => s.done).length}/${meta.actionPlan.length})`}
                </button>

                {isExpanded && (
                  <div className="mt-4 grid gap-2">
                    {meta.actionPlan.map(step => (
                      <div
                        key={step.id}
                        onClick={() => toggleStep(meta.id, step.id)}
                        className={cn("flex items-center gap-[10px] px-3 py-[10px] rounded-lg cursor-pointer transition-all", step.done ? "bg-success-light border border-success" : "bg-brand-paper border border-brand-light-tan")}
                      >
                        <div className={cn("w-5 h-5 min-w-[20px] rounded-full border-2 flex items-center justify-center", step.done ? "border-success bg-success" : "border-brand-tan bg-transparent")}>
                          {step.done && <Check size={12} className="text-brand-paper" />}
                        </div>
                        <span className={cn("text-[13px] text-brand-dark", step.done ? "line-through opacity-70" : "")}>{step.text}</span>
                      </div>
                    ))}
                    {/* Add step */}
                    <div className="flex gap-2 mt-1">
                      <input placeholder="Agregar paso..." value={newStep[meta.id] ?? ""} onChange={e => setNewStep({ ...newStep, [meta.id]: e.target.value })} onKeyDown={e => e.key === "Enter" && addStep(meta.id)} className={cn(INP, "text-[13px] py-2")} />
                      <button onClick={() => addStep(meta.id)} className="px-[14px] py-2 bg-accent text-brand-paper border-none rounded-lg cursor-pointer font-semibold text-[13px] whitespace-nowrap">+ Agregar</button>
                    </div>
                    {meta.note && <p className="text-xs text-brand-warm italic mt-[6px] mb-0">📝 {meta.note}</p>}
                  </div>
                )}

                {isComplete && (
                  <div className="mt-[14px] p-3 bg-[linear-gradient(135deg,#D4E6B5,#F0D78C)] rounded-[10px] text-center border border-success">
                    <span className="text-[20px]">🏆</span>
                    <p className="m-0 mt-1 text-[13px] font-bold text-brand-dark">¡Meta cumplida! Felicitaciones.</p>
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
    <div className="p-[30px] bg-brand-paper">
      <div className="flex gap-4 mb-7 justify-center">
        {(["morning", "evening"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTimeOfDay(t)}
            className={cn("px-7 py-3 border-none rounded-lg cursor-pointer text-sm font-semibold flex items-center gap-2", timeOfDay === t ? "bg-accent text-brand-paper" : "bg-brand-light-cream text-brand-dark")}
          >
            {t === "morning" ? <><Sun size={18} /> Mañana</> : <><Moon size={18} /> Noche</>}
          </button>
        ))}
      </div>

      {featured && (
        <div className="bg-[linear-gradient(135deg,#F0D78C,#D4A843)] rounded-[16px] px-8 py-11 text-center mb-7 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          <p className="text-xs font-semibold text-brand-dark opacity-70 m-0 mb-4 uppercase tracking-[2px]">
            {timeOfDay === "morning" ? "Afirmación del Día" : "Reflexión Nocturna"}
          </p>
          <p className="text-[26px] font-serif text-brand-dark m-0 leading-[1.6] italic">"{featured.text}"</p>
        </div>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-[22px] py-[10px] bg-success text-brand-paper border-none rounded-lg cursor-pointer font-semibold text-sm mb-[18px]"
      >
        <Plus size={18} /> Nueva Afirmación
      </button>

      {showForm && (
        <div className="bg-brand-light-cream border-2 border-success rounded-xl p-[18px] mb-5 grid gap-[10px]">
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Escribe tu afirmación en positivo, presente..."
            className={cn(INP, "min-h-[70px] resize-vertical")}
          />
          <div className="flex gap-[10px]">
            <button
              onClick={() => { if (newText.trim()) { onAdd({ id: `a${Date.now()}`, text: newText, category: timeOfDay }); setNewText(""); setShowForm(false); } }}
              className="flex-1 py-[10px] bg-success text-brand-paper border-none rounded-lg cursor-pointer font-semibold"
            >Guardar</button>
            <button onClick={() => setShowForm(false)} className="flex-1 py-[10px] bg-brand-light-tan text-brand-dark border-none rounded-lg cursor-pointer">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid gap-[10px]">
        {current.map((a, idx) => (
          <div key={a.id} className="bg-brand-warm-white border border-brand-light-cream rounded-[10px] px-4 py-[14px] flex items-center gap-3">
            <span className="w-7 h-7 min-w-[28px] bg-accent-glow rounded-full flex items-center justify-center text-xs font-bold text-brand-dark">{idx + 1}</span>
            <p className="m-0 text-sm text-brand-dark italic leading-[1.5] flex-1">"{a.text}"</p>
            <button onClick={() => onDelete(a.id)} className="bg-transparent border-none cursor-pointer text-brand-tan p-1 shrink-0"><Trash2 size={15} /></button>
          </div>
        ))}
        {current.length === 0 && (
          <p className="text-brand-warm italic text-center py-5">
            No hay afirmaciones {timeOfDay === "morning" ? "matutinas" : "nocturnas"} aún. ¡Agrega la primera!
          </p>
        )}
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

  return (
    <div className="p-[30px] bg-brand-paper">
      {/* Epic Header */}
      <div className="bg-[linear-gradient(135deg,#3D2B1F_0%,#6B4226_100%)] rounded-[16px] p-7 mb-7 text-center border-[3px] border-accent">
        <p className="text-[13px] text-brand-tan m-0 mb-[6px] tracking-[2px] uppercase">Tu Lista de Vida</p>
        <div className="text-[48px] font-bold text-accent-glow font-serif leading-none">
          {completed.length} <span className="text-[24px] text-brand-tan">/ {items.length}</span>
        </div>
        <p className="text-sm text-brand-light-tan mt-2 mb-[14px]">sueños cumplidos · {completionPct}% de tu lista de vida</p>
        <div className="w-4/5 h-[10px] bg-white/15 rounded-[5px] overflow-hidden mx-auto">
          <div className="h-full bg-[linear-gradient(90deg,#B8860B,#F0D78C)] rounded-[5px] transition-[width] duration-500" style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      {/* Next Dream Spotlight */}
      {nextDream && (
        <div className="bg-[linear-gradient(135deg,#F0D78C,#EDE0D4)] border-2 border-accent rounded-[14px] px-[22px] py-[18px] mb-6 flex items-center gap-4">
          <span className="text-[36px]">{nextDream.emoji || "🌟"}</span>
          <div>
            <p className="text-[11px] font-bold text-accent m-0 mb-1 uppercase tracking-[1px]">⭐ Tu próximo gran sueño</p>
            <p className="text-[17px] font-serif text-brand-dark m-0 font-semibold">{nextDream.title}</p>
            {nextDream.deadline && <p className="text-xs text-brand-warm mt-1 mb-0">Meta: {new Date(nextDream.deadline).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn("px-4 py-[7px] border-none rounded-[20px] cursor-pointer text-[13px] font-semibold transition-all", filter === cat ? "bg-accent text-brand-paper" : "bg-brand-light-cream text-brand-dark")}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-[22px] py-[10px] bg-accent text-brand-paper border-none rounded-lg cursor-pointer font-semibold text-sm mb-5"
      >
        <Plus size={18} /> Nuevo Sueño
      </button>

      {showForm && (
        <div className="bg-brand-light-cream border-2 border-accent rounded-xl p-5 mb-6 grid gap-3">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <input placeholder="Emoji" value={newDream.emoji} onChange={e => setNewDream({ ...newDream, emoji: e.target.value })} className={cn(INP, "text-center text-[22px]")} />
            <input placeholder="¿Cuál es tu sueño? *" value={newDream.title} onChange={e => setNewDream({ ...newDream, title: e.target.value })} className={INP} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={newDream.category} onChange={e => setNewDream({ ...newDream, category: e.target.value as DreamItem["category"] })} className={INP}>
              {["Viajes", "Aventura", "Logros", "Aprendizaje", "Experiencias"].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={newDream.deadline} onChange={e => setNewDream({ ...newDream, deadline: e.target.value })} className={INP} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-brand-dark m-0 mb-2">Prioridad</p>
            <div className="flex gap-[10px]">
              {([1, 2, 3] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setNewDream({ ...newDream, priority: p })}
                  className={cn("flex-1 py-2 border-none rounded-md cursor-pointer font-semibold", newDream.priority === p ? "bg-accent text-brand-paper" : "bg-brand-light-cream text-brand-dark")}
                >
                  {"⭐".repeat(p)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-[10px]">
            <button
              onClick={() => {
                if (!newDream.title.trim()) return;
                onAdd({ id: `d${Date.now()}`, title: newDream.title, category: newDream.category, emoji: newDream.emoji || "🌟", deadline: newDream.deadline || undefined, priority: newDream.priority, completed: false });
                setNewDream({ title: "", category: "Viajes", emoji: "", deadline: "", priority: 2 });
                setShowForm(false);
              }}
              className="flex-1 py-[10px] bg-success text-brand-paper border-none rounded-lg cursor-pointer font-semibold"
            >Guardar Sueño</button>
            <button onClick={() => setShowForm(false)} className="flex-1 py-[10px] bg-brand-light-tan text-brand-dark border-none rounded-lg cursor-pointer">Cancelar</button>
          </div>
        </div>
      )}

      {/* Pending Dreams Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 mb-8">
        {pending.map(item => {
          const meta = DREAM_CATEGORY_META[item.category] ?? DREAM_CATEGORY_META.Viajes;
          return (
            <div
              key={item.id}
              className={cn("rounded-[14px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.07)] relative transition-transform cursor-default border-2", meta.bgClass)}
              style={{ borderColor: `${meta.borderColor}20` }}
            >
              {/* Priority Stars */}
              <div className="absolute top-[14px] right-[14px] flex gap-[2px]">
                {Array.from({ length: item.priority }).map((_, i) => <span key={i} className="text-xs">⭐</span>)}
              </div>
              <span className="text-[40px] block mb-3">{item.emoji || "🌟"}</span>
              <h3 className="text-[15px] font-serif text-brand-dark m-0 mb-2 font-bold pr-10">{item.title}</h3>
              <div className="flex items-center gap-[6px] mb-[14px]">
                {meta.icon}
                <span className={cn("text-xs font-semibold", meta.textClass)}>{item.category}</span>
                {item.deadline && <span className="text-[11px] text-brand-warm ml-auto">{new Date(item.deadline).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onToggle(item.id)} className="flex-1 py-2 bg-success text-brand-paper border-none rounded-lg cursor-pointer text-xs font-bold flex items-center justify-center gap-1">
                  <Check size={14} /> ¡Logrado!
                </button>
                <button onClick={() => onDelete(item.id)} className="px-[10px] py-2 bg-black/[0.08] border-none rounded-lg cursor-pointer text-brand-dark">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {pending.length === 0 && (
          <p className="text-brand-warm italic py-5 col-span-full text-center">No hay sueños en esta categoría. ¡Agrega uno!</p>
        )}
      </div>

      {/* Completed Dreams */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 px-5 py-3 bg-success-light text-success border-2 border-success rounded-[10px] cursor-pointer font-bold text-sm mb-4 w-full"
          >
            {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            🏆 Sueños Cumplidos ({completed.length})
          </button>
          {showCompleted && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[14px]">
              {completed.map(item => (
                <div key={item.id} className="bg-success-light border-2 border-success rounded-[14px] p-[18px] relative opacity-90">
                  <div className="absolute top-3 right-3 bg-success text-brand-paper px-[10px] py-[3px] rounded-[20px] text-[11px] font-bold">✓ LOGRADO</div>
                  <span className="text-[36px] block mb-[10px]">{item.emoji || "✅"}</span>
                  <h3 className="text-sm font-serif text-brand-dark m-0 mb-1 pr-[70px]">{item.title}</h3>
                  {item.completedDate && <p className="text-[11px] text-success m-0 mb-[10px] font-semibold">Logrado: {new Date(item.completedDate).toLocaleDateString("es-ES")}</p>}
                  {item.note && <p className="text-xs text-brand-dark italic m-0 mb-[10px] leading-[1.5]">"{item.note}"</p>}
                  <button onClick={() => onToggle(item.id)} className="text-[11px] text-brand-warm bg-transparent border-none cursor-pointer underline">Marcar como pendiente</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── OKR Tab ───────────────────────────────────────────────────────────────

const OBJ_TYPE_LABELS: Record<ObjType, string> = {
  yearly: "Anual", quarterly: "Trimestral", monthly: "Mensual", milestone: "Hito",
};
const OBJ_TYPES: ObjType[] = ["yearly", "quarterly", "monthly", "milestone"];

function OKRTab() {
  const {
    objectives, isLoaded, initialize,
    addObjective, updateObjective, deleteObjective,
    addKeyResult, updateKeyResult, deleteKeyResult,
  } = useOKRStore();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingKRId, setAddingKRId] = useState<string | null>(null);
  const [newObjForm, setNewObjForm] = useState({
    title: "", type: "monthly" as ObjType, emoji: "🎯", color: "#B8860B",
    startDate: "", endDate: "", targetValue: 100, unit: "%",
  });
  const [newKRTitle, setNewKRTitle] = useState("");
  const [newKRTarget, setNewKRTarget] = useState(100);

  useEffect(() => { initialize(); }, [initialize]);

  const calcProgress = (obj: Objective): number => {
    const krs = obj.keyResults ?? [];
    if (!krs.length) return Math.round(obj.progress);
    const avg = krs.reduce((s, kr) => s + (kr.targetValue > 0 ? Math.min(100, (kr.currentValue / kr.targetValue) * 100) : 0), 0) / krs.length;
    return Math.round(avg);
  };

  const filtered = objectives.filter(o => typeFilter === "all" || o.type === typeFilter);
  const rootObjs = filtered.filter(o => !o.parentId);

  const handleAddObj = async () => {
    if (!newObjForm.title.trim()) return;
    await addObjective({ ...newObjForm, parentId: null });
    setNewObjForm({ title: "", type: "monthly", emoji: "🎯", color: "#B8860B", startDate: "", endDate: "", targetValue: 100, unit: "%" });
    setShowAddForm(false);
  };

  const handleAddKR = async (objectiveId: string) => {
    if (!newKRTitle.trim()) return;
    await addKeyResult(objectiveId, { title: newKRTitle, targetValue: newKRTarget });
    const obj = objectives.find(o => o.id === objectiveId);
    if (obj) {
      const krs = [...(obj.keyResults ?? []), { currentValue: 0, targetValue: newKRTarget }];
      const avg = krs.reduce((s, kr) => s + Math.min(100, (kr.currentValue / kr.targetValue) * 100), 0) / krs.length;
      await updateObjective(objectiveId, { progress: Math.round(avg) }).catch(() => {});
    }
    setNewKRTitle("");
    setNewKRTarget(100);
    setAddingKRId(null);
  };

  const handleKRProgress = async (objectiveId: string, krId: string, value: number) => {
    await updateKeyResult(objectiveId, krId, { currentValue: value });
    const obj = objectives.find(o => o.id === objectiveId);
    if (obj) {
      const krs = (obj.keyResults ?? []).map(kr => kr.id === krId ? { ...kr, currentValue: value } : kr);
      const avg = krs.length > 0 ? krs.reduce((s, kr) => s + Math.min(100, kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0), 0) / krs.length : obj.progress;
      await updateObjective(objectiveId, { progress: Math.round(avg) }).catch(() => {});
    }
  };

  if (!isLoaded) return <div className="text-center p-12 text-brand-medium">Cargando OKRs...</div>;

  return (
    <div className="p-[30px] bg-brand-paper flex flex-col gap-6">
      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...OBJ_TYPES].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={cn("px-4 py-1.5 rounded-full text-xs font-semibold border-none cursor-pointer", typeFilter === t ? "bg-accent text-brand-paper" : "bg-brand-light-cream text-brand-dark")}>
            {t === "all" ? "Todos" : OBJ_TYPE_LABELS[t as ObjType]}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setShowAddForm(s => !s)}
          className="flex items-center gap-2 px-5 py-2 bg-accent text-brand-paper border-none rounded-lg cursor-pointer font-semibold text-sm">
          <Plus size={16} /> Nuevo objetivo
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-brand-light-cream border-2 border-accent rounded-xl p-5 grid gap-3">
          <div className="grid grid-cols-[60px_1fr] gap-3">
            <input value={newObjForm.emoji} onChange={e => setNewObjForm(f => ({ ...f, emoji: e.target.value }))} className={cn(INP, "text-center text-2xl")} />
            <input placeholder="Título del objetivo *" value={newObjForm.title} onChange={e => setNewObjForm(f => ({ ...f, title: e.target.value }))} className={INP} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={newObjForm.type} onChange={e => setNewObjForm(f => ({ ...f, type: e.target.value as ObjType }))} className={INP}>
              {OBJ_TYPES.map(t => <option key={t} value={t}>{OBJ_TYPE_LABELS[t]}</option>)}
            </select>
            <input placeholder="Unidad (%, kg, km…)" value={newObjForm.unit} onChange={e => setNewObjForm(f => ({ ...f, unit: e.target.value }))} className={INP} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={newObjForm.startDate} onChange={e => setNewObjForm(f => ({ ...f, startDate: e.target.value }))} className={INP} placeholder="Inicio" />
            <input type="date" value={newObjForm.endDate} onChange={e => setNewObjForm(f => ({ ...f, endDate: e.target.value }))} className={INP} placeholder="Fin" />
          </div>
          <div className="flex gap-[10px]">
            <button onClick={handleAddObj} className="flex-1 py-[10px] bg-success text-brand-paper border-none rounded-lg cursor-pointer font-semibold">Crear objetivo</button>
            <button onClick={() => setShowAddForm(false)} className="flex-1 py-[10px] bg-brand-light-tan text-brand-dark border-none rounded-lg cursor-pointer">Cancelar</button>
          </div>
        </div>
      )}

      {/* Objectives list */}
      {rootObjs.length === 0 ? (
        <div className="text-center py-16 text-brand-warm italic">
          No hay objetivos todavía. ¡Crea tu primer OKR!
        </div>
      ) : (
        <div className="grid gap-4">
          {rootObjs.map(obj => {
            const progress = calcProgress(obj);
            const krs = obj.keyResults ?? [];
            const isExpanded = expandedId === obj.id;
            return (
              <div key={obj.id} className="bg-brand-warm-white border-2 border-brand-light-cream rounded-[14px] overflow-hidden">
                {/* Progress bar top */}
                <div className="h-1.5 bg-brand-light-cream">
                  <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${progress}%` }} />
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{obj.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[17px] font-serif text-brand-dark m-0 font-semibold">{obj.title}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs bg-brand-cream text-brand-medium px-2 py-0.5 rounded">{OBJ_TYPE_LABELS[obj.type]}</span>
                          <span className="text-sm font-bold text-accent">{progress}%</span>
                          <button onClick={() => setExpandedId(isExpanded ? null : obj.id)} className="bg-transparent border-none cursor-pointer text-brand-medium p-1">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <button onClick={() => !window.confirm("¿Eliminar?") || deleteObjective(obj.id)} className="bg-transparent border-none cursor-pointer text-brand-tan p-1"><X size={15} /></button>
                        </div>
                      </div>
                      {obj.endDate && <div className="text-xs text-brand-warm mt-1">Meta: {new Date(obj.endDate + "T12:00:00").toLocaleDateString("es", { month: "short", year: "numeric" })}</div>}
                    </div>
                  </div>

                  {/* KR preview */}
                  <div className="text-xs text-brand-medium">{krs.length > 0 ? `${krs.length} key result${krs.length > 1 ? "s" : ""}` : "Sin key results"}</div>

                  {isExpanded && (
                    <div className="mt-4 flex flex-col gap-3">
                      {krs.map(kr => {
                        const pct = kr.targetValue > 0 ? Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100)) : 0;
                        return (
                          <div key={kr.id} className="bg-brand-paper rounded-lg p-3 border border-brand-light-cream">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-brand-dark font-medium flex-1">{kr.title}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold text-accent">{kr.currentValue}/{kr.targetValue}{kr.unit ? ` ${kr.unit}` : ""}</span>
                                <button onClick={() => deleteKeyResult(obj.id, kr.id)} className="bg-transparent border-none cursor-pointer text-danger p-0.5"><X size={12} /></button>
                              </div>
                            </div>
                            <div className="h-1.5 bg-brand-light-cream rounded-full mb-2">
                              <div className="h-full bg-success rounded-full transition-[width]" style={{ width: `${pct}%` }} />
                            </div>
                            <input type="range" min={0} max={kr.targetValue} value={kr.currentValue}
                              onChange={e => {}} // controlled display only
                              onMouseUp={e => handleKRProgress(obj.id, kr.id, parseInt((e.target as HTMLInputElement).value))}
                              onTouchEnd={e => handleKRProgress(obj.id, kr.id, parseInt((e.currentTarget as HTMLInputElement).value))}
                              className="w-full" style={{ accentColor: colors.accent }}
                            />
                          </div>
                        );
                      })}
                      {/* Add KR */}
                      {addingKRId === obj.id ? (
                        <div className="flex gap-2">
                          <input placeholder="Nuevo key result…" value={newKRTitle} onChange={e => setNewKRTitle(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAddKR(obj.id)}
                            className={cn(INP, "flex-1 text-xs py-2")} />
                          <input type="number" value={newKRTarget} onChange={e => setNewKRTarget(parseInt(e.target.value) || 100)} className={cn(INP, "w-20 text-xs py-2")} />
                          <button onClick={() => handleAddKR(obj.id)} className="px-3 py-2 bg-accent text-brand-paper border-none rounded-lg cursor-pointer text-xs font-semibold">+</button>
                          <button onClick={() => setAddingKRId(null)} className="px-3 py-2 bg-brand-light-tan text-brand-dark border-none rounded-lg cursor-pointer text-xs">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingKRId(obj.id)}
                          className="flex items-center gap-2 text-xs text-accent bg-transparent border-none cursor-pointer">
                          <Plus size={12} /> Agregar key result
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Proyecciones Tab ──────────────────────────────────────────────────────

function ProyeccionesTab() {
  const {
    objectives, projectionConfigs, milestones, isLoaded, initialize,
    saveProjectionConfig, deleteProjectionConfig, updateMilestoneActual,
  } = useOKRStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [milestoneValue, setMilestoneValue] = useState("");
  const [newCfg, setNewCfg] = useState({
    objectiveId: "", baseline: 0, goal: 100, unit: "%",
    endDate: "", progression: "linear" as "linear" | "logarithmic" | "block_periodization",
    alertThreshold: 0.15, autoGenerateMilestones: true,
  });

  useEffect(() => { initialize(); }, [initialize]);

  const STATUS_CLASSES: Record<string, string> = {
    hit: "bg-success text-white",
    at_risk: "bg-warning text-white",
    missed: "bg-danger text-white",
    pending: "bg-brand-cream text-brand-medium",
  };

  const handleSaveCfg = async () => {
    if (!newCfg.objectiveId || !newCfg.endDate) return;
    await saveProjectionConfig(newCfg);
    setShowForm(false);
  };

  const handleRecordMilestone = (id: string) => {
    const val = parseFloat(milestoneValue);
    if (isNaN(val)) return;
    updateMilestoneActual(id, val);
    setSelectedMilestoneId(null);
    setMilestoneValue("");
  };

  if (!isLoaded) return <div className="text-center p-12 text-brand-medium">Cargando proyecciones...</div>;

  return (
    <div className="p-[30px] bg-brand-paper flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="m-0 text-[20px] font-serif text-brand-dark">Proyecciones de progreso</h2>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-5 py-2 bg-accent text-brand-paper border-none rounded-lg cursor-pointer font-semibold text-sm">
          <Plus size={16} /> Nueva proyección
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-brand-light-cream border-2 border-accent rounded-xl p-5 grid gap-3">
          <select value={newCfg.objectiveId} onChange={e => setNewCfg(f => ({ ...f, objectiveId: e.target.value }))} className={INP}>
            <option value="">Selecciona un objetivo…</option>
            {objectives.map(o => <option key={o.id} value={o.id}>{o.emoji} {o.title}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-brand-medium block mb-1">Valor inicial</label>
              <input type="number" value={newCfg.baseline} onChange={e => setNewCfg(f => ({ ...f, baseline: parseFloat(e.target.value) || 0 }))} className={INP} />
            </div>
            <div>
              <label className="text-xs text-brand-medium block mb-1">Meta</label>
              <input type="number" value={newCfg.goal} onChange={e => setNewCfg(f => ({ ...f, goal: parseFloat(e.target.value) || 100 }))} className={INP} />
            </div>
            <div>
              <label className="text-xs text-brand-medium block mb-1">Unidad</label>
              <input value={newCfg.unit} onChange={e => setNewCfg(f => ({ ...f, unit: e.target.value }))} className={INP} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-brand-medium block mb-1">Fecha fin</label>
              <input type="date" value={newCfg.endDate} onChange={e => setNewCfg(f => ({ ...f, endDate: e.target.value }))} className={INP} />
            </div>
            <div>
              <label className="text-xs text-brand-medium block mb-1">Modelo</label>
              <select value={newCfg.progression} onChange={e => setNewCfg(f => ({ ...f, progression: e.target.value as typeof newCfg.progression }))} className={INP}>
                <option value="linear">Linear</option>
                <option value="logarithmic">Logarítmico</option>
                <option value="block_periodization">Periodización en bloques</option>
              </select>
            </div>
          </div>
          <div className="flex gap-[10px]">
            <button onClick={handleSaveCfg} className="flex-1 py-[10px] bg-success text-brand-paper border-none rounded-lg cursor-pointer font-semibold">Guardar proyección</button>
            <button onClick={() => setShowForm(false)} className="flex-1 py-[10px] bg-brand-light-tan text-brand-dark border-none rounded-lg cursor-pointer">Cancelar</button>
          </div>
        </div>
      )}

      {/* Projection cards */}
      {projectionConfigs.length === 0 ? (
        <div className="text-center py-16 text-brand-warm italic">No hay proyecciones. ¡Crea una!</div>
      ) : (
        projectionConfigs.map(cfg => {
          const obj = objectives.find(o => o.id === cfg.objectiveId);
          const cfgMilestones = milestones
            .filter(m => m.projectionConfigId === cfg.id || m.objectiveId === cfg.objectiveId)
            .sort((a, b) => a.weekNumber - b.weekNumber);
          const chartData = cfgMilestones.map(m => ({
            week: `S${m.weekNumber}`,
            Proyectado: m.targetValue,
            Actual: m.actualValue > 0 ? m.actualValue : null,
          }));

          return (
            <div key={cfg.id ?? cfg.objectiveId} className="bg-brand-warm-white border-2 border-brand-light-cream rounded-[14px] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="m-0 font-serif text-brand-dark text-lg">
                    {obj ? `${obj.emoji} ${obj.title}` : "Proyección"}
                  </h3>
                  <div className="text-xs text-brand-medium mt-1">
                    {cfg.baseline} → {cfg.goal} {cfg.unit} · {cfg.progression}
                  </div>
                </div>
                <button onClick={() => deleteProjectionConfig(cfg.objectiveId)}
                  className="bg-transparent border-none cursor-pointer text-danger p-1"><Trash2 size={14} /></button>
              </div>

              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-cream)" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Proyectado" stroke={colors.accent} strokeDasharray="4 4" dot={false} />
                    <Line type="monotone" dataKey="Actual" stroke={colors.success} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {/* Milestones */}
              {cfgMilestones.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-brand-dark mb-2">Hitos</div>
                  <div className="flex flex-wrap gap-2">
                    {cfgMilestones.map(m => (
                      <div key={m.id} className="flex flex-col items-center">
                        <button
                          onClick={() => setSelectedMilestoneId(selectedMilestoneId === m.id ? null : m.id)}
                          className={cn("px-3 py-1.5 rounded-full text-xs font-bold border-none cursor-pointer", STATUS_CLASSES[m.status])}
                        >
                          S{m.weekNumber} · {m.targetValue}{cfg.unit}
                        </button>
                        {selectedMilestoneId === m.id && (
                          <div className="mt-1 flex gap-1">
                            <input
                              type="number" placeholder="Valor real" value={milestoneValue}
                              onChange={e => setMilestoneValue(e.target.value)}
                              className="w-24 px-2 py-1 border border-brand-light-tan rounded text-xs"
                            />
                            <button onClick={() => handleRecordMilestone(m.id)}
                              className="px-2 py-1 bg-accent text-white border-none rounded text-xs cursor-pointer font-bold">✓</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Vision Board Tab ──────────────────────────────────────────────────────

function VisionBoardTab() {
  const { objectives, milestones, projectionConfigs, isLoaded, initialize } = useOKRStore();
  const { lifeAreas, isLoaded: orgLoaded, initialize: orgInit } = useOrganizationStore();

  useEffect(() => {
    initialize();
    orgInit();
  }, [initialize, orgInit]);

  const top3 = [...objectives].sort((a, b) => b.progress - a.progress).slice(0, 3);
  const lifeScore = lifeAreas.length > 0
    ? (lifeAreas.reduce((s, a) => s + a.score, 0) / lifeAreas.length).toFixed(1)
    : null;
  const avgOKR = objectives.length > 0
    ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length)
    : 0;

  const pendingMilestones = milestones
    .filter(m => m.status === "pending")
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
    .slice(0, 5);

  const MOTIVATIONAL_QUOTES = [
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    "No cuentes los días; haz que los días cuenten.",
    "La única forma de hacer un gran trabajo es amar lo que haces.",
    "El camino de mil kilómetros comienza con un solo paso.",
    "Tu única competencia eres tú mismo de ayer.",
  ];
  const quote = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length];

  const chartData = objectives.map(o => ({ name: o.emoji || o.title.slice(0, 8), progreso: o.progress }));
  const BAR_COLORS = [colors.accent, colors.success, colors.info, colors.warning, colors.danger];

  if (!isLoaded || !orgLoaded) return <div className="text-center p-12 text-brand-medium">Cargando Vision Board...</div>;

  return (
    <div className="p-[30px] bg-brand-paper flex flex-col gap-7">
      {/* Quote */}
      <div className="bg-[linear-gradient(135deg,#3D2B1F,#6B4226)] rounded-[16px] px-8 py-8 text-center border-[3px] border-accent">
        <p className="text-xs text-brand-tan uppercase tracking-[2px] m-0 mb-3">✨ Frase del día</p>
        <p className="text-[20px] font-serif text-accent-glow italic m-0 leading-[1.6]">"{quote}"</p>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-brand-warm-white border-2 border-brand-light-cream rounded-[14px] p-5 text-center">
          <div className="text-xs text-brand-medium uppercase tracking-wider mb-2">Life Score</div>
          <div className="text-[2.5rem] font-bold text-accent leading-none">
            {lifeScore ?? "—"}
          </div>
          <div className="text-xs text-brand-medium mt-1">/ 10</div>
        </div>
        <div className="bg-brand-warm-white border-2 border-brand-light-cream rounded-[14px] p-5 text-center">
          <div className="text-xs text-brand-medium uppercase tracking-wider mb-2">Progreso OKR</div>
          <div className="text-[2.5rem] font-bold text-success leading-none">{avgOKR}%</div>
          <div className="text-xs text-brand-medium mt-1">{objectives.length} objetivos</div>
        </div>
        <div className="bg-brand-warm-white border-2 border-brand-light-cream rounded-[14px] p-5 text-center">
          <div className="text-xs text-brand-medium uppercase tracking-wider mb-2">Hitos pendientes</div>
          <div className="text-[2.5rem] font-bold text-info leading-none">{pendingMilestones.length}</div>
          <div className="text-xs text-brand-medium mt-1">próximos</div>
        </div>
      </div>

      {/* Top 3 objectives */}
      {top3.length > 0 && (
        <div>
          <h3 className="m-0 mb-4 font-serif text-brand-dark text-[18px]">🏆 Top 3 Objetivos</h3>
          <div className="grid gap-3">
            {top3.map((obj, i) => (
              <div key={obj.id} className="bg-brand-warm-white border-2 border-brand-light-cream rounded-[14px] p-4 flex items-center gap-4">
                <span className="text-[28px]">{obj.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-brand-dark text-sm">{obj.title}</span>
                    <span className="text-sm font-bold text-accent">{Math.round(obj.progress)}%</span>
                  </div>
                  <div className="h-2 bg-brand-light-cream rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-[width]" style={{ width: `${obj.progress}%`, backgroundColor: [colors.accent, colors.success, colors.info][i] }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OKR progress chart */}
      {chartData.length > 0 && (
        <div className="bg-brand-warm-white border-2 border-brand-light-cream rounded-[14px] p-5">
          <h3 className="m-0 mb-4 font-serif text-brand-dark text-[16px]">Progreso por objetivo</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-cream)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(v: number) => [`${v}%`, "Progreso"]} />
              <Bar dataKey="progreso" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Next milestones */}
      {pendingMilestones.length > 0 && (
        <div>
          <h3 className="m-0 mb-3 font-serif text-brand-dark text-[16px]">📅 Próximos hitos</h3>
          <div className="flex flex-col gap-2">
            {pendingMilestones.map(m => {
              const obj = objectives.find(o => o.id === m.objectiveId);
              return (
                <div key={m.id} className="flex items-center gap-3 bg-brand-warm-white border border-brand-light-cream rounded-lg px-4 py-3">
                  <span className="text-lg">{obj?.emoji ?? "🎯"}</span>
                  <div className="flex-1">
                    <div className="text-sm text-brand-dark font-medium">{obj?.title ?? "Objetivo"} — S{m.weekNumber}</div>
                    <div className="text-xs text-brand-medium">Meta: {m.targetValue} · {new Date(m.targetDate + "T12:00:00").toLocaleDateString("es")}</div>
                  </div>
                  <Clock size={14} className="text-brand-medium" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Timeline Tab ──────────────────────────────────────────────────────────

type TimelineEvent = {
  date: string;
  type: "milestone_hit" | "objective_done";
  label: string;
  emoji: string;
  sub?: string;
};

function TimelineTab() {
  const { objectives, milestones, isLoaded, initialize } = useOKRStore();

  useEffect(() => { initialize(); }, [initialize]);

  const events: TimelineEvent[] = [
    ...milestones
      .filter(m => m.status === "hit" && m.targetDate)
      .map(m => {
        const obj = objectives.find(o => o.id === m.objectiveId);
        return {
          date: m.targetDate,
          type: "milestone_hit" as const,
          label: `Hito alcanzado: S${m.weekNumber}`,
          emoji: obj?.emoji ?? "🎯",
          sub: obj?.title,
        };
      }),
    ...objectives
      .filter(o => o.progress >= 100 && o.endDate)
      .map(o => ({
        date: o.endDate,
        type: "objective_done" as const,
        label: o.title,
        emoji: o.emoji ?? "🏆",
        sub: OBJ_TYPE_LABELS[o.type],
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const TYPE_CONFIG = {
    milestone_hit: { colorClass: "bg-success text-white", icon: <Check size={14} /> },
    objective_done: { colorClass: "bg-accent text-brand-paper", icon: <Trophy size={14} /> },
  };

  if (!isLoaded) return <div className="text-center p-12 text-brand-medium">Cargando timeline...</div>;

  return (
    <div className="p-[30px] bg-brand-paper">
      <h2 className="m-0 mb-8 font-serif text-brand-dark text-[22px]">📅 Línea de Tiempo</h2>
      {events.length === 0 ? (
        <div className="text-center py-16 text-brand-warm italic">
          Completa hitos y objetivos para ver tu timeline de logros.
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-brand-light-cream" />
          <div className="flex flex-col gap-6">
            {events.map((ev, i) => {
              const cfg = TYPE_CONFIG[ev.type];
              return (
                <div key={i} className="flex gap-4 relative">
                  <div className={cn("w-12 h-12 min-w-[48px] rounded-full border-4 border-brand-paper flex items-center justify-center z-10 shadow-md text-xl", cfg.colorClass)}>
                    {ev.emoji}
                  </div>
                  <div className="flex-1 bg-brand-warm-white border-2 border-brand-light-cream rounded-[14px] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-brand-dark text-sm">{ev.label}</div>
                        {ev.sub && <div className="text-xs text-brand-medium mt-0.5">{ev.sub}</div>}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs text-brand-medium">{new Date(ev.date + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</div>
                        <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1", cfg.colorClass)}>
                          {cfg.icon}
                          {ev.type === "milestone_hit" ? "Hito" : "Objetivo"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Vision Page ──────────────────────────────────────────────────────
type VisionTabId = "vision" | "metas" | "afirmaciones" | "vida" | "okr" | "proyecciones" | "board" | "timeline";

const VISION_TABS: { id: VisionTabId; label: string }[] = [
  { id: "vision",       label: "Mi Visión" },
  { id: "metas",        label: "Mis Metas" },
  { id: "okr",          label: "OKR" },
  { id: "proyecciones", label: "Proyecciones" },
  { id: "board",        label: "Vision Board" },
  { id: "timeline",     label: "Línea de Tiempo" },
  { id: "afirmaciones", label: "Afirmaciones" },
  { id: "vida",         label: "Lista de Vida" },
];

interface VisionBoardData {
  visions: VisionCategory[];
  metas: Meta[];
  affirmations: Affirmation[];
  dreams: DreamItem[];
}

export default function VisionPage() {
  const [activeTab, setActiveTab] = useState<VisionTabId>("vision");
  const { error, clearError } = useOKRStore();

  const [visionData, setVisionData] = useState<VisionBoardData>({
    visions: initialVisions,
    metas: initialMetas,
    affirmations: initialAffirmations,
    dreams: initialDreams,
  });
  const [visionLoaded, setVisionLoaded] = useState(false);

  const visions = visionData.visions;
  const metas = visionData.metas;
  const affirmations = visionData.affirmations;
  const dreams = visionData.dreams;

  const setVisions = (updater: (prev: VisionCategory[]) => VisionCategory[]) =>
    setVisionData(prev => ({ ...prev, visions: updater(prev.visions) }));
  const setMetas = (updater: (prev: Meta[]) => Meta[]) =>
    setVisionData(prev => ({ ...prev, metas: updater(prev.metas) }));
  const setAffirmations = (updater: (prev: Affirmation[]) => Affirmation[]) =>
    setVisionData(prev => ({ ...prev, affirmations: updater(prev.affirmations) }));
  const setDreams = (updater: (prev: DreamItem[]) => DreamItem[]) =>
    setVisionData(prev => ({ ...prev, dreams: updater(prev.dreams) }));

  // Load from API on mount (with one-time localStorage migration)
  useEffect(() => {
    api.get<VisionBoardData | null>("/user/vision-board").then(data => {
      if (data && (data.visions || data.metas || data.affirmations || data.dreams)) {
        setVisionData({
          visions: data.visions ?? initialVisions,
          metas: data.metas ?? initialMetas,
          affirmations: data.affirmations ?? initialAffirmations,
          dreams: data.dreams ?? initialDreams,
        });
      } else if (typeof window !== "undefined") {
        const lsVisions = localStorage.getItem("vision_visions");
        const lsMetas = localStorage.getItem("vision_metas");
        const lsAffirmations = localStorage.getItem("vision_affirmations");
        const lsDreams = localStorage.getItem("vision_dreams");
        if (lsVisions || lsMetas || lsAffirmations || lsDreams) {
          const migrated: VisionBoardData = {
            visions: lsVisions ? JSON.parse(lsVisions) : initialVisions,
            metas: lsMetas ? JSON.parse(lsMetas) : initialMetas,
            affirmations: lsAffirmations ? JSON.parse(lsAffirmations) : initialAffirmations,
            dreams: lsDreams ? JSON.parse(lsDreams) : initialDreams,
          };
          setVisionData(migrated);
          api.put("/user/vision-board", migrated).then(() => {
            localStorage.removeItem("vision_visions");
            localStorage.removeItem("vision_metas");
            localStorage.removeItem("vision_affirmations");
            localStorage.removeItem("vision_dreams");
          }).catch(() => {});
        }
      }
      setVisionLoaded(true);
    }).catch(() => setVisionLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save to API on change
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!visionLoaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      api.put("/user/vision-board", visionData).catch(() => {});
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [visionData, visionLoaded]);

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
    <div className="min-h-screen bg-brand-paper">
      <div className="px-[30px] pt-4">
        <ErrorBanner error={error} onDismiss={clearError} />
      </div>
      {/* Header */}
      <div className="bg-[linear-gradient(135deg,#3D2B1F_0%,#6B4226_100%)] px-[30px] py-9 text-center border-b-4 border-accent">
        <h1 className="text-[40px] font-serif m-0 mb-2 font-normal tracking-[1px] text-accent-glow">
          ✨ Mi Visión
        </h1>
        <p className="text-[15px] m-0 text-brand-light-tan italic">
          Visualiza tus sueños, manifiestalos y conviértelos en realidad
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-brand-light-cream bg-brand-warm-white overflow-x-auto">
        {VISION_TABS.map(t => (
          <TabButton key={t.id} isActive={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </TabButton>
        ))}
      </div>

      {activeTab === "vision"       && <MiVisionTab visions={visions} onUpdate={updateVision} onAdd={addVision} onDelete={deleteVision} />}
      {activeTab === "metas"        && <MisMetasTab metas={metas} onAdd={addMeta} onUpdate={updateMeta} onDelete={deleteMeta} />}
      {activeTab === "afirmaciones" && <AfirmacionesTab affirmations={affirmations} onAdd={addAffirmation} onDelete={deleteAffirmation} />}
      {activeTab === "vida"         && <ListaDeVidaTab items={dreams} onToggle={toggleDream} onAdd={addDream} onDelete={deleteDream} />}
      {activeTab === "okr"          && <OKRTab />}
      {activeTab === "proyecciones" && <ProyeccionesTab />}
      {activeTab === "board"        && <VisionBoardTab />}
      {activeTab === "timeline"     && <TimelineTab />}
    </div>
  );
}
