"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Sparkles, Trophy, Flame, BookOpen, Dumbbell, Heart, Moon, Utensils, Star } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api-client";
import AIExportButton from "@/components/features/ai-export/ai-export-button";
import { fireConfettiCelebration } from "@/lib/celebrations/confetti";

type RewindData = {
  month: string;
  habits: {
    totalLogs: number;
    completed: number;
    completionRate: number;
    top: { name: string; icon: string | null; count: number }[];
  };
  fitness: {
    workoutsCompleted: number;
    workoutDays: number;
    totalVolume: number;
    totalMinutes: number;
    totalPRs: number;
  };
  mood: { count: number; avg: number | null; best: number | null; worst: number | null };
  sleep: { count: number; avgHours: number | null; avgQuality: number | null };
  nutrition: { daysWithMeals: number; totalMeals: number; totalCalories: number };
  reading: { booksFinished: number; pagesRead: number; minutes: number };
  lifeScore: { avg: number | null; snapshots: { date: string; overall: number }[] };
};

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function RewindModal({
  onClose,
  month,
}: {
  onClose: () => void;
  month?: string;
}) {
  const [data, setData] = useState<RewindData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = month ? `/user/rewind?month=${month}` : "/user/rewind";
    api
      .get<RewindData>(url)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
        // Celebrar al abrir si hubo progreso notable
        if (d.lifeScore.avg && d.lifeScore.avg >= 70) {
          setTimeout(() => fireConfettiCelebration(), 400);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error cargando rewind");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const monthLabel = data
    ? (() => {
        const [y, m] = data.month.split("-").map((n) => parseInt(n, 10));
        return `${MONTH_NAMES[m - 1]} ${y}`;
      })()
    : "…";

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-start justify-center p-4 pt-10 pb-10">
        <div
          className="bg-brand-paper rounded-2xl w-full max-w-4xl shadow-warm-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header banner */}
          <div className="relative bg-[linear-gradient(135deg,#3D2B1F_0%,#6B4226_100%)] rounded-t-2xl p-8 text-brand-paper overflow-hidden">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-brand-light-tan hover:bg-white/10 rounded-full"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-14 h-14 bg-accent-glow rounded-full flex items-center justify-center">
                <Sparkles size={26} className="text-brand-dark" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-brand-light-tan mb-1">
                  Rewind mensual
                </p>
                <h2 className="font-display text-3xl font-bold text-accent-glow m-0">
                  {monthLabel}
                </h2>
                <p className="text-sm text-brand-light-cream mt-1">
                  Tu mes en números. Celebra lo que lograste.
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="p-16 text-center text-brand-warm">
              <Loader2 size={28} className="animate-spin inline mr-3" />
              Generando tu Rewind…
            </div>
          )}

          {error && (
            <div className="p-10 text-center text-danger">
              {error}
            </div>
          )}

          {data && !loading && (
            <div className="p-8 space-y-6">
              {/* Life Score hero */}
              {data.lifeScore.avg !== null && (
                <div className="bg-brand-warm-white border border-brand-cream rounded-xl p-6 flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-accent leading-none">
                      {data.lifeScore.avg}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-brand-warm mt-1">
                      Life Score avg
                    </div>
                  </div>
                  {data.lifeScore.snapshots.length >= 2 && (
                    <div className="flex-1 h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.lifeScore.snapshots}>
                          <defs>
                            <linearGradient id="rewindGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#B8860B" stopOpacity={0.5} />
                              <stop offset="100%" stopColor="#B8860B" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" hide />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              background: "#FFFDF9",
                              border: "1px solid #EDE0D4",
                              borderRadius: 8,
                              fontSize: 11,
                            }}
                            formatter={(v: number) => [`${v}/100`, "Life Score"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="overall"
                            stroke="#B8860B"
                            strokeWidth={2}
                            fill="url(#rewindGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Grid de highlights */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  icon={<Flame size={20} />}
                  value={data.habits.completed}
                  label="hábitos completados"
                  sub={`${data.habits.completionRate}% de consistencia`}
                />
                <StatCard
                  icon={<Dumbbell size={20} />}
                  value={data.fitness.workoutsCompleted}
                  label="entrenamientos"
                  sub={`${data.fitness.totalMinutes}min · ${data.fitness.totalVolume.toLocaleString()}kg`}
                />
                <StatCard
                  icon={<Trophy size={20} />}
                  value={data.fitness.totalPRs}
                  label={data.fitness.totalPRs === 1 ? "PR nuevo" : "PRs nuevos"}
                  sub={data.fitness.totalPRs > 0 ? "Progreso real" : "—"}
                />
                <StatCard
                  icon={<Heart size={20} />}
                  value={data.mood.avg ?? "—"}
                  label="mood promedio"
                  sub={data.mood.count ? `${data.mood.count} registros` : "Sin registros"}
                />
                <StatCard
                  icon={<Moon size={20} />}
                  value={data.sleep.avgHours ? `${data.sleep.avgHours}h` : "—"}
                  label="sueño promedio"
                  sub={
                    data.sleep.avgQuality
                      ? `Calidad ${data.sleep.avgQuality}/10`
                      : "Sin registros"
                  }
                />
                <StatCard
                  icon={<Utensils size={20} />}
                  value={data.nutrition.daysWithMeals}
                  label="días con comidas"
                  sub={`${data.nutrition.totalMeals} comidas · ${Math.round(data.nutrition.totalCalories / 1000)}k cal`}
                />
                <StatCard
                  icon={<BookOpen size={20} />}
                  value={data.reading.booksFinished}
                  label={data.reading.booksFinished === 1 ? "libro terminado" : "libros terminados"}
                  sub={`${data.reading.pagesRead} páginas · ${Math.round(data.reading.minutes / 60)}h`}
                />
                <StatCard
                  icon={<Star size={20} />}
                  value={data.mood.best ?? "—"}
                  label="mejor día (mood)"
                  sub={data.mood.worst ? `Peor: ${data.mood.worst}/10` : "—"}
                />
              </div>

              {/* Top hábitos */}
              {data.habits.top.length > 0 && (
                <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
                  <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
                    Tus hábitos estrella del mes
                  </h3>
                  <div className="space-y-2">
                    {data.habits.top.map((h, idx) => {
                      const medals = ["🥇", "🥈", "🥉"];
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-brand-warm-white rounded-lg px-4 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{medals[idx]}</span>
                            <span className="text-base">{h.icon ?? "✨"}</span>
                            <span className="font-medium text-brand-dark">{h.name}</span>
                          </div>
                          <span className="text-sm text-brand-warm font-semibold">
                            {h.count} veces
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA AI */}
              <div className="bg-brand-cream/50 border border-brand-cream rounded-xl p-5 flex items-center gap-4">
                <Sparkles size={22} className="text-accent shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-brand-dark text-sm">
                    ¿Quieres análisis profundo?
                  </p>
                  <p className="text-xs text-brand-warm mt-0.5">
                    Exporta este rewind como prompt para tu Claude/ChatGPT personal.
                  </p>
                </div>
                <AIExportButton
                  scope="monthly"
                  label="Analizar con IA"
                  title="Rewind mensual"
                  variant="primary"
                  size="md"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-accent">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-brand-dark leading-none">{value}</div>
      <div className="text-xs uppercase tracking-wider text-brand-warm mt-1.5">
        {label}
      </div>
      {sub && <div className="text-[11px] text-brand-tan mt-1">{sub}</div>}
    </div>
  );
}
