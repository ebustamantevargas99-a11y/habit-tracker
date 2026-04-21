"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PenSquare, Loader2, Trash2, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";

type JournalEntry = {
  id: string;
  date: string;
  prompt: string | null;
  content: string;
  mood: number | null;
  tags: string[];
  createdAt: string;
};

const PROMPTS = [
  "¿Qué te sorprendió hoy?",
  "Una cosa que aprendiste esta semana",
  "¿Qué te dio energía? ¿Qué te la quitó?",
  "Si pudieras cambiar una decisión de hoy, ¿cuál sería?",
  "3 cosas buenas que hiciste esta semana",
  "¿Qué te está costando aceptar?",
  "Un patrón que notaste en ti últimamente",
  "¿Qué harías si nadie te estuviera observando?",
  "Una persona a la que quieres agradecer y por qué",
  "¿Qué te dice tu cuerpo hoy?",
  "Una creencia que antes tenías y ya no",
  "¿Dónde te ves en 6 meses si cambias una cosa hoy?",
];

export default function JournalPanel() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [activePrompt, setActivePrompt] = useState(
    () => PROMPTS[new Date().getDate() % PROMPTS.length]
  );
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<JournalEntry[]>("/lifeos/journal?limit=30");
      setEntries(data);
    } catch {
      toast.error("Error cargando");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function saveEntry() {
    if (!content.trim()) {
      toast.error("Escribe algo antes de guardar");
      return;
    }
    setSaving(true);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20);
    try {
      const entry = await api.post<JournalEntry>("/lifeos/journal", {
        content: content.trim(),
        prompt: activePrompt,
        mood,
        tags,
      });
      setEntries((prev) => [entry, ...prev]);
      setContent("");
      setMood(null);
      setTagsInput("");
      toast.success("Entrada guardada");
    } catch {
      toast.error("Error guardando");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm("¿Borrar esta entrada?")) return;
    try {
      await api.delete(`/lifeos/journal/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      toast.error("Error");
    }
  }

  const streak = useMemo(() => {
    const dates = new Set(entries.map((e) => e.date));
    let count = 0;
    const d = new Date();
    while (dates.has(d.toISOString().split("T")[0])) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [entries]);

  if (loading) {
    return (
      <div className="text-center py-10 text-brand-warm">
        <Loader2 size={20} className="inline animate-spin mr-2" />
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-success/20 to-brand-paper border border-brand-cream rounded-xl p-6">
        <div className="flex items-start gap-3">
          <PenSquare size={22} className="text-success mt-0.5" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-brand-warm mb-1">
              Prompt del día
            </p>
            <p className="font-serif text-lg text-brand-dark">
              &ldquo;{activePrompt}&rdquo;
            </p>
            <button
              onClick={() =>
                setActivePrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
              }
              className="mt-2 text-xs text-brand-warm hover:text-accent flex items-center gap-1"
            >
              <Sparkles size={11} /> Otro prompt
            </button>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-success leading-none">{streak}</p>
            <p className="text-[10px] uppercase tracking-widest text-brand-warm">
              día{streak !== 1 ? "s" : ""} streak
            </p>
          </div>
        </div>
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Escribe libremente. Lo que venga."
          className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent resize-y min-h-[120px]"
        />
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setMood(mood === n ? null : n)}
                className={cn(
                  "w-6 h-6 rounded text-[10px] font-semibold transition",
                  mood === n
                    ? "bg-accent text-white"
                    : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Tags separados por coma"
            className="flex-1 min-w-[180px] px-3 py-1.5 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-xs focus:outline-none focus:border-accent"
          />
          <button
            onClick={saveEntry}
            disabled={saving || !content.trim()}
            className="px-5 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown disabled:opacity-40"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-brand-warm italic text-center py-8">
            Sin entradas todavía. Escribe la primera arriba.
          </p>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              className="bg-brand-paper border border-brand-cream rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-brand-warm">
                  {new Date(e.date).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {e.mood && (
                  <span className="text-[11px] text-brand-medium bg-brand-cream px-2 py-0.5 rounded-full">
                    mood {e.mood}/10
                  </span>
                )}
                {e.tags.length > 0 && (
                  <div className="flex gap-1">
                    {e.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => void deleteEntry(e.id)}
                  className="ml-auto p-1 text-brand-warm hover:text-danger"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {e.prompt && (
                <p className="text-xs text-brand-warm italic mb-1">&ldquo;{e.prompt}&rdquo;</p>
              )}
              <p className="text-sm text-brand-dark whitespace-pre-wrap">{e.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
