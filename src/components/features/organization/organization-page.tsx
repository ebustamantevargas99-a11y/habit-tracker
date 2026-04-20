"use client";

import React, { useState, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { Plus, Trash2, Search, Pin, Edit2, X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useOrganizationStore, Note, LifeArea, WeeklyReview } from "@/stores/organization-store";
import { useAppStore } from "@/stores/app-store";
import { cn, ErrorBanner } from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

// ─── Notes Tab ────────────────────────────────────────────────────────────────

const NOTE_CATEGORIES = [
  "general", "personal", "trabajo", "ideas", "salud", "finanzas", "aprendizaje",
] as const;

const NOTE_COLORS = [
  "#FEFCE8", "#FEF3C7", "#D1FAE5", "#DBEAFE", "#EDE9FE", "#FCE7F3", "#FFF7ED",
];

function NotesTab() {
  const {
    notes, activeCategory, searchQuery,
    setActiveCategory, setSearchQuery,
    addNote, updateNote, deleteNote, togglePin, getFilteredNotes,
  } = useOrganizationStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general", color: NOTE_COLORS[0] });

  const filtered = getFilteredNotes();
  const categories = ["all", ...Array.from(new Set(notes.map((n) => n.category)))];

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    await addNote(form);
    setForm({ title: "", content: "", category: "general", color: NOTE_COLORS[0] });
    setShowForm(false);
  };

  const handleUpdate = async (note: Note) => {
    await updateNote(note.id, { title: note.title, content: note.content, category: note.category });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta nota?")) return;
    await deleteNote(id);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-medium" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar notas..."
            className="input pl-9 w-full"
          />
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus size={16} /> Nueva nota
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs cursor-pointer border-none transition-colors ${
              activeCategory === cat
                ? "bg-accent text-white font-semibold"
                : "bg-brand-cream text-brand-medium font-normal"
            }`}
          >
            {cat === "all" ? "Todas" : cat}
          </button>
        ))}
      </div>

      {/* New Note Form */}
      {showForm && (
        <div className="bg-[#FEFCE8] rounded-xl p-5 border border-brand-cream">
          <div className="flex gap-3 mb-3">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título de la nota..."
              className="flex-1 px-3 py-2 border border-brand-light-tan rounded-lg text-sm font-semibold text-brand-dark bg-transparent"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="px-2 py-2 border border-brand-light-tan rounded-lg text-xs text-brand-dark bg-transparent"
            >
              {NOTE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Contenido..."
            rows={4}
            className="w-full px-3 py-2 border border-brand-light-tan rounded-lg text-sm text-brand-dark bg-transparent resize-y box-border"
          />
          <div className="flex gap-2 mt-3 items-center">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                style={{ backgroundColor: c }}
                className={cn("w-6 h-6 rounded-full cursor-pointer", form.color === c ? "border-2 border-accent" : "border border-brand-light-tan")}
              />
            ))}
            <div className="flex-1" />
            <button onClick={() => setShowForm(false)} className="bg-transparent border-none cursor-pointer text-brand-medium">Cancelar</button>
            <Button onClick={handleAdd} className="px-3 py-1.5 text-sm">Guardar</Button>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title={notes.length === 0 ? "No tienes notas todavía" : "Sin resultados"}
          description={notes.length === 0 ? "Crea tu primera nota para empezar a organizar tus ideas." : "Prueba con otra búsqueda o categoría."}
          action={notes.length === 0 ? (
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus size={16} /> Crear primera nota
            </Button>
          ) : undefined}
          className="py-12"
        />
      ) : (
        <div className="grid gap-[0.875rem] [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              onEdit={() => setEditingId(note.id)}
              onSave={handleUpdate}
              onCancelEdit={() => setEditingId(null)}
              onPin={() => togglePin(note.id)}
              onDelete={() => handleDelete(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NoteCardProps {
  note: Note;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (note: Note) => void;
  onCancelEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
}

function NoteCard({ note, isEditing, onEdit, onSave, onCancelEdit, onPin, onDelete }: NoteCardProps) {
  const [draft, setDraft] = useState(note);
  useEffect(() => setDraft(note), [note]);

  return (
    <div
      style={{ backgroundColor: note.color }}
      className={`rounded-xl p-4 border border-brand-cream flex flex-col gap-2 relative ${note.isPinned ? "shadow-[0_2px_8px_var(--color-brand-tan)]" : ""}`}
    >
      {note.isPinned && (
        <div className="absolute top-2 right-2 text-accent">
          <Pin size={14} />
        </div>
      )}

      {isEditing ? (
        <>
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className="px-2 py-1 border border-brand-light-tan rounded-md text-[0.9rem] font-semibold text-brand-dark bg-transparent"
          />
          <textarea
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            rows={3}
            className="px-2 py-1 border border-brand-light-tan rounded-md text-xs text-brand-medium bg-transparent resize-y"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={onCancelEdit} className="bg-transparent border-none cursor-pointer text-brand-medium p-1"><X size={15} /></button>
            <button onClick={() => onSave(draft)} className="bg-transparent border-none cursor-pointer text-success p-1"><Check size={15} /></button>
          </div>
        </>
      ) : (
        <>
          <div className="font-semibold text-[0.9rem] text-brand-dark pr-5">{note.title}</div>
          {note.content && (
            <div className="text-xs text-brand-medium leading-[1.5] overflow-hidden [-webkit-box-orient:vertical] [display:-webkit-box] [-webkit-line-clamp:4]">
              {note.content}
            </div>
          )}
          <div className="flex gap-2 items-center justify-between mt-1">
            <span className="text-[0.7rem] text-brand-medium bg-brand-cream px-2 py-0.5 rounded">
              {note.category}
            </span>
            <div className="flex gap-1">
              <button onClick={onPin} className={`bg-transparent border-none cursor-pointer p-1 ${note.isPinned ? "text-accent" : "text-brand-medium"}`}><Pin size={13} /></button>
              <button onClick={onEdit} className="bg-transparent border-none cursor-pointer text-brand-medium p-1"><Edit2 size={13} /></button>
              <button onClick={onDelete} className="bg-transparent border-none cursor-pointer text-danger p-1"><Trash2 size={13} /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Life Areas Tab ───────────────────────────────────────────────────────────

const DEFAULT_AREAS = [
  { name: "Salud",             emoji: "❤️",  color: "#E74C3C" },
  { name: "Finanzas",          emoji: "💰",  color: "#F39C12" },
  { name: "Relaciones",        emoji: "👥",  color: "#3498DB" },
  { name: "Carrera",           emoji: "💼",  color: "#9B59B6" },
  { name: "Crecimiento Personal", emoji: "🌱", color: "#2ECC71" },
  { name: "Diversión",         emoji: "🎉",  color: "#E91E63" },
  { name: "Ambiente Físico",   emoji: "🏠",  color: "#795548" },
  { name: "Contribución",      emoji: "🤝",  color: "#00BCD4" },
];

function gapColorClass(gap: number): string {
  if (gap <= 1) return "text-success";
  if (gap <= 3) return "text-warning";
  return "text-danger";
}

function gapLabel(gap: number): string {
  if (gap <= 1) return "En objetivo";
  if (gap <= 3) return `Gap: ${gap}`;
  return `Gap: ${gap}`;
}

interface AreaSliderProps {
  area: LifeArea;
  onSave: (id: string, score: number) => void;
}

function AreaSlider({ area, onSave }: AreaSliderProps) {
  const [localScore, setLocalScore] = useState(area.score);
  useEffect(() => setLocalScore(area.score), [area.score]);
  const gap = 10 - localScore;

  return (
    <div className="flex-1">
      <div className="flex justify-between mb-1.5">
        <span className="font-semibold text-sm text-brand-dark">{area.name}</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-semibold", gapColorClass(gap))}>{gapLabel(gap)}</span>
          <span style={{ color: area.color }} className="text-sm font-bold">{localScore}/10</span>
        </div>
      </div>
      <input
        type="range"
        min={1} max={10}
        value={localScore}
        onChange={(e) => setLocalScore(parseInt(e.target.value))}
        onMouseUp={(e) => onSave(area.id, parseInt((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => onSave(area.id, parseInt((e.currentTarget as HTMLInputElement).value))}
        className="w-full"
        style={{ accentColor: area.color }}
      />
    </div>
  );
}

function LifeAreasTab() {
  const { lifeAreas, updateLifeArea, addLifeArea, deleteLifeArea } = useOrganizationStore();
  const [showForm, setShowForm] = useState(false);
  const [newArea, setNewArea] = useState({ name: "", emoji: "🎯", color: "#B8860B" });
  const [creatingDefaults, setCreatingDefaults] = useState(false);

  const radarData = lifeAreas.map((a) => ({
    subject: `${a.emoji} ${a.name}`,
    value: a.score,
    fullMark: 10,
  }));

  const handleSaveScore = async (id: string, score: number) => {
    await updateLifeArea(id, { score });
  };

  const handleCreateDefaults = async () => {
    setCreatingDefaults(true);
    for (const area of DEFAULT_AREAS) {
      await addLifeArea(area).catch(() => {});
    }
    setCreatingDefaults(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta área de vida?")) return;
    await deleteLifeArea(id);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Empty state: offer default areas */}
      {lifeAreas.length === 0 && (
        <div className="bg-brand-cream rounded-xl p-6 text-center flex flex-col items-center gap-4">
          <div className="text-4xl">🎯</div>
          <div>
            <p className="font-semibold text-brand-dark mb-1">Todavía no tienes áreas de vida</p>
            <p className="text-sm text-brand-medium">Puedes crear las 8 áreas clásicas de un vistazo, o agregar las tuyas.</p>
          </div>
          <Button
            onClick={handleCreateDefaults}
            loading={creatingDefaults}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Crear 8 áreas default
          </Button>
        </div>
      )}

      {/* Radar Chart */}
      {lifeAreas.length >= 3 && (
        <div className="bg-brand-warm-white rounded-xl p-5 border border-brand-cream">
          <h3 className="m-0 mb-2 text-base text-brand-dark">Rueda de la Vida</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--color-brand-cream)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "var(--color-brand-medium)" }} />
              <Radar name="Score" dataKey="value" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Area sliders */}
      {lifeAreas.length > 0 && (
        <div className="flex flex-col gap-3">
          {lifeAreas.map((area) => (
            <div
              key={area.id}
              className="bg-brand-warm-white rounded-[10px] p-4 border border-brand-cream flex gap-4 items-center"
            >
              <span className="text-2xl">{area.emoji}</span>
              <AreaSlider area={area} onSave={handleSaveScore} />
              <button
                onClick={() => handleDelete(area.id)}
                className="bg-transparent border-none cursor-pointer text-danger p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new area */}
      {showForm ? (
        <div className="bg-brand-warm-white rounded-xl p-5 border border-brand-cream">
          <div className="flex gap-3 mb-3">
            <input
              value={newArea.emoji}
              onChange={(e) => setNewArea((a) => ({ ...a, emoji: e.target.value }))}
              placeholder="🎯"
              className="w-[60px] p-2 border border-brand-light-tan rounded-lg text-center text-xl"
            />
            <input
              value={newArea.name}
              onChange={(e) => setNewArea((a) => ({ ...a, name: e.target.value }))}
              placeholder="Nombre del área..."
              className="flex-1 px-3 py-2 border border-brand-light-tan rounded-lg text-sm text-brand-dark"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="bg-transparent border-none cursor-pointer text-brand-medium">Cancelar</button>
            <Button
              onClick={async () => {
                if (!newArea.name.trim()) return;
                await addLifeArea(newArea);
                setNewArea({ name: "", emoji: "🎯", color: "#B8860B" });
                setShowForm(false);
              }}
              className="px-4 py-2"
            >
              Agregar
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 justify-center py-3 border-2 border-dashed border-brand-light-tan rounded-[10px] bg-transparent cursor-pointer text-brand-medium text-sm"
        >
          <Plus size={16} /> Agregar área de vida
        </button>
      )}

      {/* Life Score */}
      {lifeAreas.length > 0 && (
        <div className="bg-brand-cream rounded-xl p-5 text-center">
          <div className="text-sm text-brand-medium mb-1">Puntuación promedio</div>
          <div className="text-[2.5rem] font-bold text-accent">
            {(lifeAreas.reduce((s, a) => s + a.score, 0) / lifeAreas.length).toFixed(1)}
          </div>
          <div className="text-xs text-brand-medium">de 10</div>
        </div>
      )}
    </div>
  );
}

// ─── Weekly Review Tab ────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function WeeklyReviewTab() {
  const { weeklyReviews, addWeeklyReview, updateWeeklyReview } = useOrganizationStore();
  const [selectedWeek, setSelectedWeek] = useState(getMondayOfWeek(new Date()));
  const [saved, setSaved] = useState(false);

  const currentReview = weeklyReviews.find((r) => r.weekStart === selectedWeek);

  const [form, setForm] = useState<Omit<WeeklyReview, "id" | "createdAt" | "updatedAt">>({
    weekStart: selectedWeek,
    wins: [""],
    challenges: [""],
    learnings: [""],
    nextWeekGoals: [""],
    gratitude: [""],
    overallRating: 7,
    energyLevel: 7,
    productivityScore: 7,
    notes: "",
  });

  useEffect(() => {
    if (currentReview) {
      setForm({
        weekStart: currentReview.weekStart,
        wins: currentReview.wins.length ? currentReview.wins : [""],
        challenges: currentReview.challenges.length ? currentReview.challenges : [""],
        learnings: currentReview.learnings.length ? currentReview.learnings : [""],
        nextWeekGoals: currentReview.nextWeekGoals.length ? currentReview.nextWeekGoals : [""],
        gratitude: currentReview.gratitude.length ? currentReview.gratitude : [""],
        overallRating: currentReview.overallRating,
        energyLevel: currentReview.energyLevel,
        productivityScore: currentReview.productivityScore,
        notes: currentReview.notes ?? "",
      });
    } else {
      setForm({
        weekStart: selectedWeek,
        wins: [""], challenges: [""], learnings: [""], nextWeekGoals: [""], gratitude: [""],
        overallRating: 7, energyLevel: 7, productivityScore: 7, notes: "",
      });
    }
  }, [selectedWeek, currentReview?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateWeek = (dir: -1 | 1) => {
    const d = new Date(selectedWeek + "T12:00:00");
    d.setDate(d.getDate() + dir * 7);
    setSelectedWeek(d.toISOString().split("T")[0]);
  };

  const handleSave = async () => {
    const cleaned = {
      ...form,
      weekStart: selectedWeek,
      wins: form.wins.filter(Boolean),
      challenges: form.challenges.filter(Boolean),
      learnings: form.learnings.filter(Boolean),
      nextWeekGoals: form.nextWeekGoals.filter(Boolean),
      gratitude: form.gratitude.filter(Boolean),
    };
    if (currentReview) {
      await updateWeeklyReview(currentReview.id, cleaned);
    } else {
      await addWeeklyReview(cleaned);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ListInput = ({
    field, label, placeholder,
  }: { field: keyof typeof form; label: string; placeholder: string }) => {
    const items = form[field] as string[];
    return (
      <div>
        <label className="text-xs font-semibold text-brand-dark block mb-2">{label}</label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <input
              value={item}
              onChange={(e) => {
                const arr = [...items];
                arr[i] = e.target.value;
                setForm((f) => ({ ...f, [field]: arr }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setForm((f) => ({ ...f, [field]: [...items, ""] }));
                }
              }}
              placeholder={`${placeholder}...`}
              className="flex-1 px-3 py-1.5 border border-brand-light-tan rounded-md text-xs text-brand-dark"
            />
            {items.length > 1 && (
              <button
                onClick={() => setForm((f) => ({ ...f, [field]: items.filter((_, j) => j !== i) }))}
                className="bg-transparent border-none cursor-pointer text-danger p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setForm((f) => ({ ...f, [field]: [...items, ""] }))}
          className="text-xs text-accent bg-transparent border-none cursor-pointer flex items-center gap-1"
        >
          <Plus size={12} /> Agregar
        </button>
      </div>
    );
  };

  const RatingInput = ({ field, label }: { field: "overallRating" | "energyLevel" | "productivityScore"; label: string }) => {
    const value = form[field];
    return (
      <div>
        <label className="text-xs text-brand-medium block mb-1.5">{label}</label>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setForm((f) => ({ ...f, [field]: n }))}
              className={cn(
                "w-8 h-8 rounded-md text-xs font-bold border-none cursor-pointer transition-colors",
                value === n ? "bg-accent text-white" : "bg-brand-cream text-brand-medium hover:bg-accent-glow"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const weekLabel = new Date(selectedWeek + "T12:00:00").toLocaleDateString("es", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="flex gap-8 flex-wrap">
      {/* Left: Form */}
      <div className="flex-[1_1_400px] flex flex-col gap-5">
        {/* Week selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 bg-brand-cream border-none rounded-lg cursor-pointer text-brand-dark hover:bg-brand-light-tan"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 text-center">
            <div className="text-xs text-brand-medium mb-0.5">Semana del lunes</div>
            <div className="font-semibold text-brand-dark text-sm">{weekLabel}</div>
            {currentReview && <span className="text-xs text-success">✓ Revisión guardada</span>}
          </div>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 bg-brand-cream border-none rounded-lg cursor-pointer text-brand-dark hover:bg-brand-light-tan"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {!currentReview && (
          <div className="bg-brand-cream rounded-lg px-4 py-3 text-sm text-brand-medium">
            No hay revisión para esta semana. Completa el formulario y guarda.
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <ListInput field="wins" label="✅ Victorias de la semana" placeholder="¿Qué salió bien?" />
          <ListInput field="challenges" label="⚡ Retos / Obstáculos" placeholder="¿Qué fue difícil?" />
          <ListInput field="learnings" label="📚 Aprendizajes" placeholder="¿Qué aprendiste?" />
          <ListInput field="nextWeekGoals" label="🎯 Metas próxima semana" placeholder="¿Qué quieres lograr?" />
          <ListInput field="gratitude" label="🙏 Gratitud" placeholder="¿Por qué estás agradecido?" />
        </div>

        {/* Clickable Ratings */}
        <div className="grid grid-cols-1 gap-4">
          <RatingInput field="overallRating" label="Rating general" />
          <RatingInput field="energyLevel" label="Nivel de energía" />
          <RatingInput field="productivityScore" label="Productividad" />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-brand-dark block mb-2">📝 Notas adicionales</label>
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder="Reflexiones, contexto, lo que sea importante recordar..."
            className="w-full px-3 py-2 border border-brand-light-tan rounded-lg text-sm text-brand-dark resize-y box-border"
          />
        </div>

        <Button
          onClick={handleSave}
          className={cn("px-8 py-3 self-start", saved ? "bg-success" : "")}
        >
          {saved ? "¡Guardado!" : "Guardar revisión"}
        </Button>
      </div>

      {/* Right: History */}
      {weeklyReviews.length > 0 && (
        <div className="flex-[0_0_260px] flex flex-col gap-3">
          <h3 className="m-0 text-[0.9rem] text-brand-dark">Últimas revisiones</h3>
          {weeklyReviews.slice(0, 8).map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedWeek(r.weekStart)}
              className={`bg-brand-warm-white rounded-[10px] p-[0.875rem] border cursor-pointer ${selectedWeek === r.weekStart ? "border-accent" : "border-brand-cream"}`}
            >
              <div className="text-xs font-semibold text-brand-dark mb-1.5">
                {new Date(r.weekStart + "T12:00:00").toLocaleDateString("es", { month: "short", day: "numeric" })}
              </div>
              <div className="flex gap-3">
                {[
                  { label: "G", value: r.overallRating, colorClass: "text-accent" },
                  { label: "E", value: r.energyLevel, colorClass: "text-success" },
                  { label: "P", value: r.productivityScore, colorClass: "text-info" },
                ].map(({ label, value, colorClass }) => (
                  <div key={label} className="text-center">
                    <div className="text-[0.7rem] text-brand-medium">{label}</div>
                    <div className={`text-sm font-bold ${colorClass}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "notas", label: "Notas" },
  { id: "areas", label: "Áreas de Vida" },
  { id: "revision", label: "Revisión Semanal" },
] as const;

export default function OrganizationPage() {
  const activeTab = useAppStore((s) => s.organizationTab);
  const setActiveTab = useAppStore((s) => s.setOrganizationTab);
  const { initialize, isLoaded, error, clearError } = useOrganizationStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex flex-col gap-6">
      <ErrorBanner error={error} onDismiss={clearError} />
      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-brand-cream">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-5 py-2.5 bg-transparent border-none cursor-pointer text-sm transition-colors duration-200 -mb-0.5 ${
              activeTab === id
                ? "border-b-2 border-accent text-accent font-semibold"
                : "border-b-2 border-transparent text-brand-medium font-normal"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!isLoaded ? (
        <div className="text-center p-12 text-brand-medium">Cargando datos...</div>
      ) : (
        <>
          {activeTab === "notas" && <NotesTab />}
          {activeTab === "areas" && <LifeAreasTab />}
          {activeTab === "revision" && <WeeklyReviewTab />}
        </>
      )}
    </div>
  );
}
