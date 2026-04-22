"use client";
import { todayLocal } from "@/lib/date/local";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";

type TimelineItem = {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string | null;
  icon: string | null;
  auto: boolean;
};

const TYPE_COLORS: Record<string, string> = {
  habit_streak: "bg-warning/10 text-warning border-warning/20",
  pr: "bg-danger/10 text-danger border-danger/20",
  book_finished: "bg-info/10 text-info border-info/20",
  meditation: "bg-success/10 text-success border-success/20",
  fasting: "bg-accent/10 text-accent border-accent/20",
  weight: "bg-brand-medium/10 text-brand-medium border-brand-medium/20",
  custom: "bg-brand-medium/10 text-brand-medium border-brand-medium/20",
};

export default function TimelinePanel() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<TimelineItem[]>("/user/timeline?limit=100");
      setItems(data);
    } catch {
      toast.error("Error cargando timeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function deleteItem(id: string, auto: boolean) {
    if (auto) {
      toast.info("Los milestones automáticos se regeneran. Borra el origen (hábito/libro/workout)");
      return;
    }
    if (!confirm("¿Borrar este milestone?")) return;
    try {
      await api.delete(`/user/milestones/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Error");
    }
  }

  // Agrupar por mes
  const grouped = items.reduce<Record<string, TimelineItem[]>>((acc, it) => {
    const [y, m] = it.date.split("-");
    const key = `${y}-${m}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(it);
    return acc;
  }, {});

  const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  if (loading) {
    return (
      <div className="text-center py-10 text-brand-warm">
        <Loader2 size={20} className="inline animate-spin mr-2" />
        Cargando timeline…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-brand-dark m-0">
            Timeline de tu recorrido
          </h2>
          <p className="text-xs text-brand-warm mt-0.5">
            Milestones automáticos + manuales. Scroll cronológico.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:bg-brand-brown flex items-center gap-1.5"
        >
          <Plus size={12} /> Hito manual
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-12 text-center text-brand-warm">
          Tu timeline se construirá automáticamente con logros. Empieza a
          trackear hábitos, entrenar, leer libros…
        </div>
      ) : (
        Object.entries(grouped)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([monthKey, mitems]) => {
            const [y, m] = monthKey.split("-");
            return (
              <div key={monthKey}>
                <h3 className="text-xs uppercase tracking-widest text-brand-warm font-bold mb-3 sticky top-0 bg-brand-paper py-2 z-10">
                  {MONTH_NAMES[parseInt(m, 10) - 1]} {y}
                </h3>
                <div className="relative pl-8 space-y-3">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-brand-cream" />
                  {mitems.map((it) => (
                    <div key={it.id} className="relative">
                      <div className="absolute -left-[22px] top-3 w-3 h-3 rounded-full bg-accent border-2 border-brand-paper" />
                      <div
                        className={cn(
                          "border rounded-xl p-3",
                          TYPE_COLORS[it.type] ?? TYPE_COLORS.custom
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {it.icon && <span className="text-lg leading-none">{it.icon}</span>}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight">
                              {it.title}
                            </p>
                            {it.description && (
                              <p className="text-xs opacity-80 mt-0.5">
                                {it.description}
                              </p>
                            )}
                            <p className="text-[11px] opacity-70 mt-1">
                              {new Date(it.date).toLocaleDateString("es-MX", {
                                day: "numeric",
                                month: "short",
                              })}
                              {it.auto && " · auto"}
                            </p>
                          </div>
                          {!it.auto && (
                            <button
                              onClick={() => void deleteItem(it.id, it.auto)}
                              className="p-1 opacity-50 hover:opacity-100"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
      )}

      {showAdd && (
        <AddMilestoneModal
          onClose={() => setShowAdd(false)}
          onSave={async (payload) => {
            try {
              const m = await api.post<TimelineItem>("/user/timeline", payload);
              setItems((prev) =>
                [{ ...m, auto: false }, ...prev].sort((a, b) => b.date.localeCompare(a.date))
              );
              setShowAdd(false);
              toast.success("Milestone guardado");
            } catch {
              toast.error("Error");
            }
          }}
        />
      )}
    </div>
  );
}

function AddMilestoneModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: { title: string; description?: string; icon?: string; type: string; date?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🏆");
  const [date, setDate] = useState(todayLocal());

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-brand-cream flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-brand-dark m-0">
            Nuevo milestone
          </h2>
          <button onClick={onClose} className="p-1.5 text-brand-warm hover:bg-brand-cream rounded-full">
            <X size={16} />
          </button>
        </header>
        <div className="px-6 py-4 space-y-3">
          <div className="flex gap-2">
            {["🏆", "🎯", "🔥", "💎", "✨", "🚀", "⭐", "💪"].map((e) => (
              <button
                key={e}
                onClick={() => setIcon(e)}
                className={cn(
                  "w-10 h-10 text-xl rounded-lg transition",
                  icon === e ? "bg-accent/20 ring-2 ring-accent" : "bg-brand-cream hover:bg-brand-light-tan"
                )}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="Título del hito"
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Descripción (opcional)"
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent resize-none"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <footer className="px-6 py-3 border-t border-brand-cream flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream">
            Cancelar
          </button>
          <button
            onClick={() =>
              title.trim() &&
              onSave({
                title: title.trim(),
                description: description.trim() || undefined,
                icon,
                type: "custom",
                date,
              })
            }
            disabled={!title.trim()}
            className="px-5 py-2 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40"
          >
            Guardar
          </button>
        </footer>
      </div>
    </div>
  );
}
