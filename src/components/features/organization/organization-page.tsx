"use client";

import React, { useState, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { Plus, Trash2, Search, Pin, Edit2, X, Check } from "lucide-react";
import { colors } from "@/lib/colors";
import { useOrganizationStore, Note, LifeArea, WeeklyReview } from "@/stores/organization-store";
import { useAppStore } from "@/stores/app-store";

// ─── Notes Tab ────────────────────────────────────────────────────────────────

const NOTE_CATEGORIES = [
  "general", "personal", "trabajo", "ideas", "salud", "finanzas", "aprendizaje",
] as const;

const NOTE_COLORS = [
  "#FEFCE8", "#FEF3C7", "#D1FAE5", "#DBEAFE", "#EDE9FE", "#FCE7F3", "#FFF7ED",
];

function NotesTab() {
  const { notes, activeCategory, searchQuery, setActiveCategory, setSearchQuery, addNote, updateNote, deleteNote, togglePin, getFilteredNotes } = useOrganizationStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general", color: NOTE_COLORS[0] });

  const filtered = getFilteredNotes();

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

  const categories = ["all", ...Array.from(new Set(notes.map((n) => n.category)))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Controls */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: colors.medium }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar notas..."
            style={{
              width: "100%", padding: "0.5rem 0.5rem 0.5rem 2.25rem",
              border: `1px solid ${colors.lightTan}`, borderRadius: "8px",
              fontSize: "0.875rem", color: colors.dark, backgroundColor: colors.warmWhite,
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 1rem", backgroundColor: colors.accent, color: "#fff",
            border: "none", borderRadius: "8px", cursor: "pointer",
          }}
        >
          <Plus size={16} /> Nueva nota
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "0.25rem 0.75rem", borderRadius: "20px", cursor: "pointer",
              fontSize: "0.75rem", fontWeight: activeCategory === cat ? 600 : 400,
              backgroundColor: activeCategory === cat ? colors.accent : colors.cream,
              color: activeCategory === cat ? "#fff" : colors.medium,
              border: "none",
            }}
          >
            {cat === "all" ? "Todas" : cat}
          </button>
        ))}
      </div>

      {/* New Note Form */}
      {showForm && (
        <div style={{ backgroundColor: NOTE_COLORS[0], borderRadius: "12px", padding: "1.25rem", border: `1px solid ${colors.cream}` }}>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título de la nota..."
              style={{
                flex: 1, padding: "0.5rem 0.75rem", border: `1px solid ${colors.lightTan}`,
                borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, color: colors.dark,
                backgroundColor: "transparent",
              }}
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              style={{
                padding: "0.5rem", border: `1px solid ${colors.lightTan}`, borderRadius: "8px",
                fontSize: "0.8rem", color: colors.dark, backgroundColor: "transparent",
              }}
            >
              {NOTE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Contenido..."
            rows={4}
            style={{
              width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${colors.lightTan}`,
              borderRadius: "8px", fontSize: "0.875rem", color: colors.dark,
              backgroundColor: "transparent", resize: "vertical", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                style={{
                  width: "24px", height: "24px", borderRadius: "50%", border: form.color === c ? `2px solid ${colors.accent}` : `1px solid ${colors.lightTan}`,
                  backgroundColor: c, cursor: "pointer",
                }}
              />
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.medium }}>Cancelar</button>
            <button
              onClick={handleAdd}
              style={{ padding: "0.375rem 0.875rem", backgroundColor: colors.accent, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.875rem" }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: colors.medium }}>
            No hay notas. Crea una con el botón "Nueva nota".
          </div>
        ) : (
          filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              onEdit={() => setEditingId(note.id)}
              onSave={handleUpdate}
              onCancelEdit={() => setEditingId(null)}
              onPin={() => togglePin(note.id)}
              onDelete={() => deleteNote(note.id)}
            />
          ))
        )}
      </div>
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
    <div style={{
      backgroundColor: note.color, borderRadius: "12px", padding: "1rem",
      border: `1px solid ${colors.cream}`,
      boxShadow: note.isPinned ? `0 2px 8px ${colors.tan}` : "none",
      display: "flex", flexDirection: "column", gap: "0.5rem",
      position: "relative",
    }}>
      {note.isPinned && (
        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", color: colors.accent }}>
          <Pin size={14} />
        </div>
      )}

      {isEditing ? (
        <>
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            style={{ padding: "0.25rem 0.5rem", border: `1px solid ${colors.lightTan}`, borderRadius: "6px", fontSize: "0.9rem", fontWeight: 600, color: colors.dark, backgroundColor: "transparent" }}
          />
          <textarea
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            rows={3}
            style={{ padding: "0.25rem 0.5rem", border: `1px solid ${colors.lightTan}`, borderRadius: "6px", fontSize: "0.8rem", color: colors.medium, backgroundColor: "transparent", resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button onClick={onCancelEdit} style={{ background: "none", border: "none", cursor: "pointer", color: colors.medium, padding: "0.25rem" }}><X size={15} /></button>
            <button onClick={() => onSave(draft)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.success, padding: "0.25rem" }}><Check size={15} /></button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: colors.dark, paddingRight: "1.25rem" }}>{note.title}</div>
          {note.content && (
            <div style={{ fontSize: "0.8rem", color: colors.medium, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>
              {note.content}
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "space-between", marginTop: "0.25rem" }}>
            <span style={{ fontSize: "0.7rem", color: colors.medium, backgroundColor: colors.cream, padding: "0.125rem 0.5rem", borderRadius: "4px" }}>
              {note.category}
            </span>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <button onClick={onPin} style={{ background: "none", border: "none", cursor: "pointer", color: note.isPinned ? colors.accent : colors.medium, padding: "0.25rem" }}><Pin size={13} /></button>
              <button onClick={onEdit} style={{ background: "none", border: "none", cursor: "pointer", color: colors.medium, padding: "0.25rem" }}><Edit2 size={13} /></button>
              <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: colors.danger, padding: "0.25rem" }}><Trash2 size={13} /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Life Areas Tab ───────────────────────────────────────────────────────────

function LifeAreasTab() {
  const { lifeAreas, updateLifeArea, addLifeArea, deleteLifeArea } = useOrganizationStore();
  const [showForm, setShowForm] = useState(false);
  const [newArea, setNewArea] = useState({ name: "", emoji: "🎯", color: "#B8860B" });

  const radarData = lifeAreas.map((a) => ({ subject: `${a.emoji} ${a.name}`, value: a.score, fullMark: 10 }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Radar Chart */}
      {lifeAreas.length >= 3 && (
        <div style={{ backgroundColor: colors.warmWhite, borderRadius: "12px", padding: "1.25rem", border: `1px solid ${colors.cream}` }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: colors.dark }}>Rueda de la Vida</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={colors.cream} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: colors.medium }} />
              <Radar name="Score" dataKey="value" stroke={colors.accent} fill={colors.accent} fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Area sliders */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {lifeAreas.map((area) => (
          <div
            key={area.id}
            style={{
              backgroundColor: colors.warmWhite, borderRadius: "10px", padding: "1rem",
              border: `1px solid ${colors.cream}`, display: "flex", gap: "1rem", alignItems: "center",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>{area.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                <span style={{ fontWeight: 600, fontSize: "0.875rem", color: colors.dark }}>{area.name}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: area.color }}>{area.score}/10</span>
              </div>
              <input
                type="range"
                min={1} max={10}
                value={area.score}
                onChange={(e) => updateLifeArea(area.id, { score: parseInt(e.target.value) })}
                style={{ width: "100%", accentColor: area.color }}
              />
            </div>
            <button
              onClick={() => deleteLifeArea(area.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: colors.danger, padding: "0.25rem" }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add new area */}
      {showForm ? (
        <div style={{ backgroundColor: colors.warmWhite, borderRadius: "12px", padding: "1.25rem", border: `1px solid ${colors.cream}` }}>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <input
              value={newArea.emoji}
              onChange={(e) => setNewArea((a) => ({ ...a, emoji: e.target.value }))}
              placeholder="🎯"
              style={{ width: "60px", padding: "0.5rem", border: `1px solid ${colors.lightTan}`, borderRadius: "8px", textAlign: "center", fontSize: "1.25rem" }}
            />
            <input
              value={newArea.name}
              onChange={(e) => setNewArea((a) => ({ ...a, name: e.target.value }))}
              placeholder="Nombre del área..."
              style={{ flex: 1, padding: "0.5rem 0.75rem", border: `1px solid ${colors.lightTan}`, borderRadius: "8px", fontSize: "0.875rem", color: colors.dark }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.medium }}>Cancelar</button>
            <button
              onClick={async () => {
                if (!newArea.name.trim()) return;
                await addLifeArea(newArea);
                setNewArea({ name: "", emoji: "🎯", color: "#B8860B" });
                setShowForm(false);
              }}
              style={{ padding: "0.5rem 1rem", backgroundColor: colors.accent, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              Agregar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center",
            padding: "0.75rem", border: `2px dashed ${colors.lightTan}`, borderRadius: "10px",
            background: "none", cursor: "pointer", color: colors.medium, fontSize: "0.875rem",
          }}
        >
          <Plus size={16} /> Agregar área de vida
        </button>
      )}

      {/* Life Score */}
      {lifeAreas.length > 0 && (
        <div style={{ backgroundColor: colors.cream, borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "0.875rem", color: colors.medium, marginBottom: "0.25rem" }}>Puntuación promedio</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700, color: colors.accent }}>
            {(lifeAreas.reduce((s, a) => s + a.score, 0) / lifeAreas.length).toFixed(1)}
          </div>
          <div style={{ fontSize: "0.75rem", color: colors.medium }}>de 10</div>
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
  }, [selectedWeek, currentReview?.id]);

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

  const ListInput = ({ field, label, placeholder }: { field: keyof typeof form; label: string; placeholder: string }) => {
    const items = form[field] as string[];
    return (
      <div>
        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: colors.dark, display: "block", marginBottom: "0.5rem" }}>{label}</label>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <input
              value={item}
              onChange={(e) => {
                const arr = [...items];
                arr[i] = e.target.value;
                setForm((f) => ({ ...f, [field]: arr }));
              }}
              placeholder={`${placeholder}...`}
              style={{
                flex: 1, padding: "0.4rem 0.75rem", border: `1px solid ${colors.lightTan}`,
                borderRadius: "6px", fontSize: "0.8rem", color: colors.dark,
              }}
            />
            {items.length > 1 && (
              <button
                onClick={() => setForm((f) => ({ ...f, [field]: items.filter((_, j) => j !== i) }))}
                style={{ background: "none", border: "none", cursor: "pointer", color: colors.danger, padding: "0.25rem" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setForm((f) => ({ ...f, [field]: [...items, ""] }))}
          style={{ fontSize: "0.75rem", color: colors.accent, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
        >
          <Plus size={12} /> Agregar
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
      {/* Left: Form */}
      <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Week selector */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: colors.medium, display: "block", marginBottom: "0.25rem" }}>Semana (lunes)</label>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              style={{
                padding: "0.5rem 0.75rem", border: `1px solid ${colors.lightTan}`,
                borderRadius: "6px", fontSize: "0.875rem", color: colors.dark,
              }}
            />
          </div>
          {currentReview && (
            <span style={{ fontSize: "0.75rem", color: colors.success, marginTop: "1.25rem" }}>Revisión guardada</span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <ListInput field="wins" label="✅ Victorias de la semana" placeholder="¿Qué salió bien?" />
          <ListInput field="challenges" label="⚡ Retos / Obstáculos" placeholder="¿Qué fue difícil?" />
          <ListInput field="learnings" label="📚 Aprendizajes" placeholder="¿Qué aprendiste?" />
          <ListInput field="nextWeekGoals" label="🎯 Metas próxima semana" placeholder="¿Qué quieres lograr?" />
          <ListInput field="gratitude" label="🙏 Gratitud" placeholder="¿Por qué estás agradecido?" />
        </div>

        {/* Ratings */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          {[
            { key: "overallRating", label: "Rating general" },
            { key: "energyLevel", label: "Nivel de energía" },
            { key: "productivityScore", label: "Productividad" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ fontSize: "0.75rem", color: colors.medium, display: "block", marginBottom: "0.375rem" }}>{label}</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="range" min={1} max={10}
                  value={form[key as keyof typeof form] as number}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: parseInt(e.target.value) }))}
                  style={{ flex: 1, accentColor: colors.accent }}
                />
                <span style={{ fontWeight: 700, color: colors.accent, fontSize: "1rem", minWidth: "1.5rem" }}>
                  {form[key as keyof typeof form] as number}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: colors.dark, display: "block", marginBottom: "0.5rem" }}>📝 Notas adicionales</label>
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder="Reflexiones, contexto, lo que sea importante recordar..."
            style={{
              width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${colors.lightTan}`,
              borderRadius: "8px", fontSize: "0.875rem", color: colors.dark,
              resize: "vertical", boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            padding: "0.75rem 2rem", backgroundColor: saved ? colors.success : colors.accent,
            color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer",
            fontWeight: 600, transition: "background-color 0.3s", alignSelf: "flex-start",
          }}
        >
          {saved ? "¡Guardado!" : "Guardar revisión"}
        </button>
      </div>

      {/* Right: History */}
      {weeklyReviews.length > 0 && (
        <div style={{ flex: "0 0 260px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h3 style={{ margin: 0, fontSize: "0.9rem", color: colors.dark }}>Últimas revisiones</h3>
          {weeklyReviews.slice(0, 4).map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedWeek(r.weekStart)}
              style={{
                backgroundColor: colors.warmWhite, borderRadius: "10px", padding: "0.875rem",
                border: `1px solid ${selectedWeek === r.weekStart ? colors.accent : colors.cream}`,
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: colors.dark, marginBottom: "0.375rem" }}>
                {new Date(r.weekStart + "T12:00:00").toLocaleDateString("es", { month: "short", day: "numeric" })}
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[
                  { label: "G", value: r.overallRating, color: colors.accent },
                  { label: "E", value: r.energyLevel, color: colors.success },
                  { label: "P", value: r.productivityScore, color: colors.info },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.7rem", color: colors.medium }}>{label}</div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color }}>{value}</div>
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
  const { initialize, isLoaded } = useOrganizationStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: `2px solid ${colors.cream}` }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: "0.625rem 1.25rem", backgroundColor: "transparent", border: "none",
              borderBottom: activeTab === id ? `2px solid ${colors.accent}` : "2px solid transparent",
              marginBottom: "-2px", cursor: "pointer",
              color: activeTab === id ? colors.accent : colors.medium,
              fontWeight: activeTab === id ? 600 : 400,
              fontSize: "0.875rem", transition: "color 0.2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {!isLoaded ? (
        <div style={{ textAlign: "center", padding: "3rem", color: colors.medium }}>Cargando datos...</div>
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
