"use client";
import { todayLocal, parseLocalDateStr, shiftDaysLocal } from "@/lib/date/local";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Droplet, Calendar, Loader2, Plus, Sparkles, TrendingUp, Heart, Pencil, Trash2, Check, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";
import AIExportButton from "@/components/features/ai-export/ai-export-button";

type PeriodLog = {
  id: string;
  date: string;
  flow: "none" | "spotting" | "light" | "medium" | "heavy";
  symptoms: string[];
  mood: number | null;
  energy: number | null;
  libido: number | null;
  notes: string | null;
};

type MenstrualCycle = {
  id: string;
  startDate: string;
  endDate: string | null;
  cycleLength: number | null;
  periodLength: number | null;
  flowHeavy: boolean;
  notes: string | null;
  periodLogs: PeriodLog[];
};

const FLOW_META: Record<PeriodLog["flow"], { label: string; color: string }> = {
  none:     { label: "Sin flujo",  color: "bg-brand-cream" },
  spotting: { label: "Spotting",   color: "bg-danger-light" },
  light:    { label: "Ligero",     color: "bg-danger/40" },
  medium:   { label: "Medio",      color: "bg-danger/70" },
  heavy:    { label: "Abundante",  color: "bg-danger" },
};

const COMMON_SYMPTOMS = [
  "cólicos", "dolor de cabeza", "hinchazón", "cambios de humor",
  "fatiga", "acné", "dolor de espalda", "antojos", "sensibilidad mamaria",
];

function daysSince(dateStr: string): number {
  // Diferencia en días civiles locales — antes mezclaba medianoche UTC con
  // Date.now(), así que después de las 19:00 en Lima el día del ciclo
  // saltaba +1 antes de tiempo.
  const from = parseLocalDateStr(dateStr).getTime();
  const today = parseLocalDateStr(todayLocal()).getTime();
  return Math.round((today - from) / (1000 * 60 * 60 * 24));
}

export default function CyclePage() {
  const [cycles, setCycles] = useState<MenstrualCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<MenstrualCycle[]>("/cycle/cycles");
      setCycles(data);
    } catch {
      toast.error("Error cargando ciclos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const lastCycle = cycles[0] ?? null;
  const dayOfCycle = lastCycle ? daysSince(lastCycle.startDate) + 1 : null;

  // Predicción: promedio de cycleLength de ciclos con dato (no incluir el último abierto)
  const predictedNextStart = useMemo(() => {
    if (!lastCycle) return null;
    const withLength = cycles.filter((c) => c.cycleLength !== null).slice(0, 6);
    const avg = withLength.length
      ? withLength.reduce((s, c) => s + (c.cycleLength ?? 0), 0) / withLength.length
      : 28;
    const next = new Date(lastCycle.startDate + "T00:00:00Z");
    next.setUTCDate(next.getUTCDate() + Math.round(avg));
    return { date: next.toISOString().split("T")[0], cycleLengthAvg: Math.round(avg) };
  }, [cycles, lastCycle]);

  const ovulationWindow = useMemo(() => {
    if (!predictedNextStart) return null;
    // Ovulación ~14 días antes del próximo período
    const ov = new Date(predictedNextStart.date + "T00:00:00Z");
    ov.setUTCDate(ov.getUTCDate() - 14);
    const start = new Date(ov);
    start.setUTCDate(start.getUTCDate() - 2);
    const end = new Date(ov);
    end.setUTCDate(end.getUTCDate() + 2);
    return {
      day: ov.toISOString().split("T")[0],
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }, [predictedNextStart]);

  const phase = useMemo(() => {
    if (!dayOfCycle) return null;
    if (dayOfCycle <= 5) return { name: "Menstrual", emoji: "🌑", description: "Descanso y reflexión" };
    if (dayOfCycle <= 13) return { name: "Folicular", emoji: "🌓", description: "Energía creciente, ideal para entrenar" };
    if (dayOfCycle <= 16) return { name: "Ovulatoria", emoji: "🌕", description: "Pico de energía y ánimo" };
    return { name: "Lútea", emoji: "🌘", description: "Desacelera, entrenos más suaves" };
  }, [dayOfCycle]);

  async function startNewCycle() {
    const today = todayLocal();
    try {
      const cycle = await api.post<MenstrualCycle>("/cycle/cycles", { startDate: today });
      setCycles((prev) => [{ ...cycle, periodLogs: [] }, ...prev]);
      toast.success("Ciclo iniciado");
    } catch {
      toast.error("Error iniciando ciclo");
    }
  }

  async function savePeriodLog(input: Omit<PeriodLog, "id">) {
    try {
      const log = await api.post<PeriodLog>("/cycle/logs", input);
      await refresh();
      toast.success("Registro guardado");
      setShowLogModal(false);
      return log;
    } catch {
      toast.error("Error guardando");
    }
  }

  async function updateCycleStartDate(id: string, startDate: string) {
    try {
      await api.patch(`/cycle/cycles/${id}`, { startDate });
      await refresh();
      toast.success("Ciclo actualizado");
    } catch {
      toast.error("Error actualizando");
    }
  }

  async function deleteCycle(id: string) {
    if (!confirm("¿Borrar este ciclo? También se eliminan sus registros diarios.")) return;
    try {
      await api.delete(`/cycle/cycles/${id}`);
      await refresh();
      toast.success("Ciclo borrado");
    } catch {
      toast.error("Error borrando");
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-brand-warm">
        <Loader2 className="inline animate-spin mr-2" size={20} />
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-dark m-0">Ciclo menstrual</h1>
          <p className="text-sm text-brand-warm mt-1">
            Datos privados · solo tú los ves · encriptados en reposo
          </p>
        </div>
        <div className="flex gap-2">
          <AIExportButton
            scope="holistic"
            label="Analizar ciclo con IA"
            title="Análisis de ciclo"
            variant="outline"
            size="md"
          />
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown flex items-center gap-2"
          >
            <Plus size={14} /> Registrar hoy
          </button>
        </div>
      </div>

      {!lastCycle ? (
        <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-12 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-brand-warm-white flex items-center justify-center text-brand-warm">
            <Calendar size={26} />
          </div>
          <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
            Aún no hay ciclos registrados
          </h3>
          <p className="text-sm text-brand-warm mb-4">
            Marca el inicio de tu próximo período para empezar a trackear.
          </p>
          <button
            onClick={startNewCycle}
            className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown inline-flex items-center gap-2"
          >
            <Plus size={14} /> Inicio de período (hoy)
          </button>
        </div>
      ) : (
        <>
          {/* Hero — día de ciclo + fase */}
          <div className="bg-gradient-hero rounded-2xl p-8 text-brand-paper">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-brand-light-tan mb-1">
                  Día del ciclo
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold text-accent-glow leading-none">
                    {dayOfCycle}
                  </span>
                  {phase && (
                    <span className="text-2xl pb-1">
                      {phase.emoji}
                    </span>
                  )}
                </div>
                {phase && (
                  <div className="mt-3">
                    <p className="font-serif text-lg text-accent-glow">{phase.name}</p>
                    <p className="text-xs text-brand-light-cream italic">{phase.description}</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                {predictedNextStart && (
                  <>
                    <p className="text-xs text-brand-light-tan mb-1">Próximo período estimado</p>
                    <p className="text-lg font-semibold text-accent-glow">
                      {parseLocalDateStr(predictedNextStart.date).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-[11px] text-brand-light-cream">
                      Ciclo promedio: {predictedNextStart.cycleLengthAvg} días
                    </p>
                  </>
                )}
                <button
                  onClick={startNewCycle}
                  className="mt-4 px-4 py-2 rounded-button bg-accent-glow text-[#2E1F14] text-xs font-semibold hover:bg-accent"
                >
                  Marcar inicio de nuevo período
                </button>
              </div>
            </div>
          </div>

          {/* Ventana fértil */}
          {ovulationWindow && dayOfCycle && dayOfCycle < 28 && (
            <div className="bg-brand-warm-white border border-brand-cream rounded-xl p-5 flex items-center gap-4">
              <Sparkles size={22} className="text-accent" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-dark">
                  Ventana fértil estimada
                </p>
                <p className="text-xs text-brand-warm">
                  {parseLocalDateStr(ovulationWindow.start).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  {" – "}
                  {parseLocalDateStr(ovulationWindow.end).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  {" · ovulación ~"}
                  {parseLocalDateStr(ovulationWindow.day).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                </p>
              </div>
              <span className="text-xs text-brand-tan italic">Solo estimación</span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Ciclos registrados"
              value={cycles.length}
            />
            <StatCard
              icon={<Calendar size={18} />}
              label="Ciclo promedio"
              value={predictedNextStart?.cycleLengthAvg ?? "—"}
              sub="días"
            />
            <StatCard
              icon={<Heart size={18} />}
              label="Registros diarios"
              value={cycles.reduce((s, c) => s + c.periodLogs.length, 0)}
            />
          </div>

          {/* Historial de ciclos — editable */}
          {cycles.length > 0 && (
            <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
              <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
                Historial de ciclos
              </h3>
              <ul className="flex flex-col gap-2">
                {cycles.slice(0, 12).map((c, i) => (
                  <CycleRow
                    key={c.id}
                    cycle={c}
                    isLatest={i === 0}
                    onUpdate={(date) => updateCycleStartDate(c.id, date)}
                    onDelete={() => deleteCycle(c.id)}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Últimos logs */}
          <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
            <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
              Últimos 14 días
            </h3>
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {Array.from({ length: 14 }).map((_, i) => {
                // Fecha civil local — la clave `ds` debe coincidir con cómo
                // se guardan los logs (todayLocal), si no la celda "hoy"
                // buscaba la fecha UTC de mañana de noche.
                const ds = shiftDaysLocal(-(13 - i));
                const d = parseLocalDateStr(ds);
                const log = cycles
                  .flatMap((c) => c.periodLogs)
                  .find((l) => l.date === ds);
                const flow = log?.flow ?? "none";
                return (
                  <div
                    key={ds}
                    className="shrink-0 w-10 flex flex-col items-center gap-1"
                    title={log ? `${ds}: ${FLOW_META[flow].label}` : ds}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-mono text-brand-dark",
                        FLOW_META[flow].color
                      )}
                    >
                      {d.getDate()}
                    </div>
                    <span className="text-[9px] text-brand-warm uppercase">
                      {["D", "L", "M", "M", "J", "V", "S"][d.getDay()]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {showLogModal && (
        <LogModal
          onClose={() => setShowLogModal(false)}
          onSave={(p) => {
            void savePeriodLog(p);
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-accent">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-brand-dark leading-none">
        {value}
        {sub && <span className="text-xs font-normal text-brand-warm ml-1">{sub}</span>}
      </div>
      <div className="text-[11px] uppercase tracking-widest text-brand-warm mt-1.5">{label}</div>
    </div>
  );
}

function LogModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: Omit<PeriodLog, "id">) => void;
}) {
  const [date, setDate] = useState(todayLocal());
  const [flow, setFlow] = useState<PeriodLog["flow"]>("none");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [libido, setLibido] = useState<number | null>(null);

  function toggleSymptom(s: string) {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-brand-paper rounded-2xl w-full max-w-lg shadow-warm-lg my-8 max-h-[90vh] overflow-y-auto">
        <header className="px-6 py-4 border-b border-brand-cream sticky top-0 bg-brand-paper">
          <h2 className="font-display text-xl font-bold text-brand-dark m-0">Registro diario</h2>
        </header>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Flujo
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(FLOW_META) as PeriodLog["flow"][]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFlow(f)}
                  className={cn(
                    "px-2 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition",
                    flow === f
                      ? `${FLOW_META[f].color} text-brand-dark ring-2 ring-accent`
                      : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {FLOW_META[f].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Síntomas
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {COMMON_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs transition",
                    symptoms.includes(s)
                      ? "bg-accent text-white"
                      : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <SliderRow label="Mood" value={mood} onChange={setMood} />
          <SliderRow label="Energía" value={energy} onChange={setEnergy} />
          <SliderRow label="Libido" value={libido} onChange={setLibido} />
        </div>
        <footer className="px-6 py-4 border-t border-brand-cream flex gap-3 justify-end sticky bottom-0 bg-brand-paper">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              onSave({
                date,
                flow,
                symptoms,
                mood,
                energy,
                libido,
                notes: null,
              })
            }
            className="px-6 py-2 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown"
          >
            Guardar
          </button>
        </footer>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
        {label}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            onClick={() => onChange(value === n ? null : n)}
            className={cn(
              "flex-1 py-2 rounded text-xs font-semibold transition",
              value === n
                ? "bg-accent text-white"
                : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function CycleRow({
  cycle,
  isLatest,
  onUpdate,
  onDelete,
}: {
  cycle: MenstrualCycle;
  isLatest: boolean;
  onUpdate: (startDate: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(cycle.startDate);
  const longLabel = (s: string) =>
    parseLocalDateStr(s).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  function save() {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      toast.error("Fecha inválida");
      return;
    }
    onUpdate(date);
    setEditing(false);
  }

  return (
    <li className="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-warm-white border border-brand-cream">
      <div
        className="shrink-0 w-2 h-8 rounded-full"
        style={{ backgroundColor: isLatest ? "var(--color-accent)" : "var(--color-tan)" }}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-2 py-1 rounded border border-brand-cream bg-brand-paper text-xs text-brand-dark focus:outline-none focus:border-accent"
            autoFocus
          />
        ) : (
          <>
            <p className="text-sm font-semibold text-brand-dark m-0">
              {longLabel(cycle.startDate)}
              {isLatest && (
                <span className="ml-2 inline-block text-[10px] uppercase tracking-widest text-accent">
                  Actual
                </span>
              )}
            </p>
            <p className="text-[11px] text-brand-warm m-0">
              {cycle.cycleLength ? `Duró ${cycle.cycleLength} días` : "En curso"} ·{" "}
              {cycle.periodLogs.length} registro{cycle.periodLogs.length === 1 ? "" : "s"}
            </p>
          </>
        )}
      </div>
      <div className="shrink-0 flex gap-0.5">
        {editing ? (
          <>
            <button
              onClick={save}
              className="p-1.5 rounded hover:bg-brand-cream text-success"
              title="Guardar"
              aria-label="Guardar"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => {
                setDate(cycle.startDate);
                setEditing(false);
              }}
              className="p-1.5 rounded hover:bg-brand-cream text-brand-warm"
              title="Cancelar"
              aria-label="Cancelar"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded hover:bg-brand-cream text-brand-warm"
              title="Editar fecha de inicio"
              aria-label="Editar fecha"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-danger-light/40 hover:text-danger text-brand-warm"
              title="Borrar ciclo"
              aria-label="Borrar ciclo"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
