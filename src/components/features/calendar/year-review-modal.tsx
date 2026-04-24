"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  Loader2,
  Sparkles,
  Dumbbell,
  Utensils,
  BookOpen,
  Clock,
  Trophy,
  Target,
  Flame,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { fireConfettiCelebration } from "@/lib/celebrations/confetti";

type YearReviewData = {
  year: number;
  calendar: { totalEvents: number };
  fitness: {
    workoutsCompleted: number;
    gymMinutes: number;
    totalVolume: number;
    totalPRs: number;
    currentPRs: Array<{ exercise: string; oneRM: number; date: string }>;
    weightStart: number | null;
    weightEnd: number | null;
    weightDelta: number | null;
  };
  nutrition: {
    mealsLogged: number;
    totalCalories: number;
    totalProtein: number;
    avgDailyCalories: number;
  };
  habits: {
    totalHabits: number;
    totalCompletions: number;
    overallRate: number;
    top: Array<{ name: string; icon: string | null; completed: number; total: number; rate: number; bestStreak: number }>;
  };
  reading: { booksFinished: number; books: Array<{ title: string; author: string | null; rating: number | null; finishedAt: string | null; totalPages: number | null }>; pagesRead: number; readingMinutes: number };
  fasting: { sessions: number; totalHours: number };
  focus: { sessions: number; totalMinutes: number };
  milestones: Array<{ date: string; type: string; title: string; icon: string | null }>;
  lifeScore: { avgOverall: number | null; snapshotCount: number };
};

function buildPromptForAI(data: YearReviewData): string {
  const f = data.fitness;
  const n = data.nutrition;
  const h = data.habits;
  const r = data.reading;

  let prompt = `Eres mi coach holístico personal. Analiza mi año ${data.year} completo basado en la data real abajo. Sé directo, detecta patrones, y dame 5 accionables concretas para ${data.year + 1}.\n\n`;
  prompt += `━━━ RESUMEN DEL AÑO ${data.year} ━━━\n\n`;

  prompt += `📊 LIFE SCORE\n`;
  prompt += `Promedio anual: ${data.lifeScore.avgOverall ?? "sin data"} / 100\n`;
  prompt += `${data.lifeScore.snapshotCount} snapshots de puntuación agregada\n\n`;

  prompt += `💪 FITNESS\n`;
  prompt += `${f.workoutsCompleted} entrenamientos completados\n`;
  prompt += `${f.gymMinutes} minutos totales (${Math.round(f.gymMinutes / 60)}h)\n`;
  prompt += `${f.totalVolume.toLocaleString()} kg de volumen total\n`;
  prompt += `${f.totalPRs} PRs nuevos\n`;
  if (f.weightDelta !== null) {
    prompt += `Peso: ${f.weightStart}kg → ${f.weightEnd}kg (${f.weightDelta > 0 ? "+" : ""}${f.weightDelta}kg)\n`;
  }
  if (f.currentPRs.length > 0) {
    prompt += `\nPRs actuales (1RM estimado):\n`;
    f.currentPRs.slice(0, 6).forEach((pr) => {
      prompt += `  • ${pr.exercise}: ${Math.round(pr.oneRM)}kg\n`;
    });
  }

  prompt += `\n🥗 NUTRICIÓN\n`;
  prompt += `${n.mealsLogged} comidas registradas\n`;
  prompt += `${n.totalCalories.toLocaleString()} kcal totales · ${n.totalProtein.toLocaleString()}g proteína\n`;
  prompt += `Promedio ${n.avgDailyCalories} kcal/día en días con log\n`;

  prompt += `\n✨ HÁBITOS\n`;
  prompt += `${h.totalHabits} hábitos activos · ${h.totalCompletions} completions · ${h.overallRate}% consistencia general\n`;
  if (h.top.length > 0) {
    prompt += `\nTop 5 hábitos del año:\n`;
    h.top.forEach((hb) => {
      prompt += `  • ${hb.icon ?? "·"} ${hb.name}: ${hb.completed}/${hb.total} (${hb.rate}%) · mejor racha ${hb.bestStreak}d\n`;
    });
  }

  prompt += `\n📖 LECTURA\n`;
  prompt += `${r.booksFinished} libros terminados · ${r.pagesRead} páginas · ${Math.round(r.readingMinutes / 60)}h totales\n`;
  if (r.books.length > 0) {
    prompt += `\nLibros terminados:\n`;
    r.books.forEach((b) => {
      prompt += `  • ${b.title}${b.author ? ` — ${b.author}` : ""}${b.rating ? ` (${b.rating}⭐)` : ""}\n`;
    });
  }

  prompt += `\n🧘 MINDFULNESS & FOCUS\n`;
  prompt += `Ayuno: ${data.fasting.sessions} sesiones · ${data.fasting.totalHours}h totales\n`;
  prompt += `Trabajo profundo: ${data.focus.sessions} sesiones · ${Math.round(data.focus.totalMinutes / 60)}h totales\n`;

  if (data.milestones.length > 0) {
    prompt += `\n🏆 HITOS DEL AÑO (${data.milestones.length} registrados):\n`;
    data.milestones.slice(0, 15).forEach((mi) => {
      prompt += `  ${mi.icon ?? "•"} ${mi.date}: ${mi.title}\n`;
    });
  }

  prompt += `\n━━━ TU TAREA ━━━\n`;
  prompt += `1. ¿Cuáles fueron los 3 mayores logros reales (según la data)?\n`;
  prompt += `2. ¿Qué patrón destructivo detectas que no veo?\n`;
  prompt += `3. ¿En qué dimensión fallé más? ¿Por qué crees?\n`;
  prompt += `4. 5 acciones CONCRETAS para ${data.year + 1} basadas en lo aprendido.\n`;
  prompt += `5. Una pregunta incómoda pero importante para que reflexione.\n`;
  prompt += `\nSé directo, sin endulzar. Confío en tu análisis.`;

  return prompt;
}

export default function YearReviewModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<YearReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<YearReviewData>(`/user/year-review?year=${year}`);
      setData(res);
      setTimeout(() => fireConfettiCelebration(), 300);
    } catch {
      toast.error("Error cargando año");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function copyPrompt() {
    if (!data) return;
    const prompt = buildPromptForAI(data);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success("Prompt copiado · pégalo en tu Claude/ChatGPT/Gemini");
    } catch {
      toast.error("Error copiando");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-start justify-center p-4 pt-10 pb-10">
        <div
          className="bg-brand-paper rounded-2xl w-full max-w-4xl shadow-warm-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hero */}
          <div className="relative bg-gradient-hero-accent rounded-t-2xl p-8 text-brand-paper overflow-hidden">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-brand-light-tan hover:bg-white/10 rounded-full"
            >
              <X size={18} />
            </button>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setYear((y) => y - 1)}
                className="p-2 text-brand-light-tan hover:bg-white/10 rounded-full"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-brand-light-tan mb-1">
                  Revisión anual
                </p>
                <h1 className="font-display text-5xl font-bold text-accent-glow">{year}</h1>
              </div>
              <button
                onClick={() => setYear((y) => y + 1)}
                className="p-2 text-brand-light-tan hover:bg-white/10 rounded-full"
                disabled={year >= new Date().getFullYear()}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            {data?.lifeScore.avgOverall !== null && data?.lifeScore.avgOverall !== undefined && (
              <div className="text-center">
                <div className="text-6xl font-bold text-accent-glow leading-none">
                  {data.lifeScore.avgOverall}
                </div>
                <div className="text-xs uppercase tracking-widest text-brand-light-tan mt-1">
                  Puntuación de Vida anual
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="p-16 text-center text-brand-warm">
              <Loader2 size={28} className="animate-spin inline mr-3" />
              Generando tu año…
            </div>
          )}

          {data && !loading && (
            <div className="p-6 space-y-5">
              {/* Grid de stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat icon={<Flame size={18} />} value={data.habits.totalCompletions} label="Hábitos completados" />
                <Stat icon={<Dumbbell size={18} />} value={data.fitness.workoutsCompleted} label="Entrenos" />
                <Stat icon={<Trophy size={18} />} value={data.fitness.totalPRs} label="PRs nuevos" />
                <Stat icon={<Utensils size={18} />} value={data.nutrition.mealsLogged} label="Comidas registradas" />
                <Stat icon={<BookOpen size={18} />} value={data.reading.booksFinished} label="Libros terminados" />
                <Stat icon={<Clock size={18} />} value={data.fasting.totalHours + "h"} label="Horas en ayuno" />
                <Stat icon={<Target size={18} />} value={Math.round(data.focus.totalMinutes / 60) + "h"} label="Trabajo profundo" />
                <Stat icon={<Sparkles size={18} />} value={data.calendar.totalEvents} label="Eventos en calendario" />
              </div>

              {/* Top hábitos */}
              {data.habits.top.length > 0 && (
                <div className="bg-brand-warm-white border border-brand-cream rounded-xl p-5">
                  <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
                    Hábitos estrella del año
                  </h3>
                  <div className="space-y-2">
                    {data.habits.top.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-brand-paper rounded-lg px-3 py-2"
                      >
                        <span className="text-xl">{h.icon ?? "✨"}</span>
                        <span className="flex-1 font-medium text-brand-dark">{h.name}</span>
                        <span className="text-xs text-brand-warm">
                          {h.completed}/{h.total} · {h.rate}%
                        </span>
                        <span className="text-xs text-accent font-semibold">🔥 {h.bestStreak}d</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Libros */}
              {data.reading.books.length > 0 && (
                <div className="bg-brand-warm-white border border-brand-cream rounded-xl p-5">
                  <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
                    Libros que terminaste ({data.reading.books.length})
                  </h3>
                  <div className="space-y-1">
                    {data.reading.books.map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span>📖</span>
                        <span className="font-medium text-brand-dark">{b.title}</span>
                        {b.author && <span className="text-brand-warm">— {b.author}</span>}
                        {b.rating && (
                          <span className="text-xs text-accent">
                            {"⭐".repeat(b.rating)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {data.milestones.length > 0 && (
                <div className="bg-brand-warm-white border border-brand-cream rounded-xl p-5">
                  <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
                    Hitos destacados
                  </h3>
                  <div className="space-y-1.5">
                    {data.milestones.slice(0, 10).map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span>{m.icon ?? "•"}</span>
                        <span className="text-xs text-brand-warm font-mono">{m.date}</span>
                        <span className="text-brand-dark">{m.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA IA */}
              <div className="bg-gradient-to-br from-accent/10 to-accent-light/10 border border-accent/40 rounded-xl p-6 flex items-center gap-4">
                <Sparkles size={32} className="text-accent shrink-0" />
                <div className="flex-1">
                  <p className="font-display text-base font-semibold text-brand-dark">
                    Análisis profundo con IA
                  </p>
                  <p className="text-xs text-brand-warm mt-0.5">
                    Copia un prompt ultra-detallado con toda tu data del año para pegar en tu Claude/ChatGPT/Gemini. Sin costos de API, tu data queda privada.
                  </p>
                </div>
                <button
                  onClick={copyPrompt}
                  className="px-5 py-2.5 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown flex items-center gap-2"
                >
                  <Copy size={14} /> {copied ? "✓ Copiado" : "Copiar prompt"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-accent">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-brand-dark leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-brand-warm mt-1.5">{label}</div>
    </div>
  );
}
