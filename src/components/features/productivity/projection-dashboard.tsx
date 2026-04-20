"use client";
import React, { useState, useMemo } from "react";
import { cn } from "@/components/ui";
import { useOKRStore } from "@/stores/okr-store";
import {
  generateMilestones,
  recalculateMilestones,
  getProjectionSummary,
  buildChartData,
} from "@/lib/projection-engine";
import type { ProjectionConfig, Milestone, ProjectionType } from "@/stores/okr-store";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid, Legend,
} from "recharts";
import { Plus, ChevronDown, ChevronUp, AlertTriangle, X } from "lucide-react";

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  warning: "#D4943A", warningLight: "#F5E0C0", danger: "#C0544F",
  dangerLight: "#F5D0CE", info: "#5A8FA8", infoLight: "#C8E0EC",
};

const STATUS_CLASSES: Record<string, { bg: string; text: string; dotBg: string; border: string; label: string }> = {
  hit:     { bg: "bg-success-light",       text: "text-success",       dotBg: "bg-success",       border: "border-success/20",       label: "✓ Logrado" },
  missed:  { bg: "bg-danger-light",        text: "text-danger",        dotBg: "bg-danger",        border: "border-danger/20",        label: "✗ Perdido" },
  at_risk: { bg: "bg-warning-light",       text: "text-warning",       dotBg: "bg-warning",       border: "border-warning/20",       label: "⚠ En riesgo" },
  pending: { bg: "bg-brand-light-cream",   text: "text-brand-medium",  dotBg: "bg-brand-medium",  border: "border-brand-medium/20",  label: "⬤ Pendiente" },
};

const INP = "px-3 py-[9px] border border-brand-tan rounded-lg text-[13px] bg-brand-paper text-brand-dark w-full box-border";

// ─── Config Form ──────────────────────────────────────────────────────────────
function ConfigForm({ onSave, onCancel, existing }: {
  onSave: (cfg: ProjectionConfig) => void;
  onCancel: () => void;
  existing?: ProjectionConfig;
}) {
  const { objectives } = useOKRStore();
  const [form, setForm] = useState<Omit<ProjectionConfig, "objectiveId"> & { objectiveId: string }>({
    objectiveId: existing?.objectiveId ?? "",
    baseline: existing?.baseline ?? 0,
    goal: existing?.goal ?? 100,
    unit: existing?.unit ?? "km",
    endDate: existing?.endDate ?? "",
    progression: existing?.progression ?? "linear",
    alertThreshold: existing?.alertThreshold ?? 0.15,
    autoGenerateMilestones: existing?.autoGenerateMilestones ?? true,
  });

  const handleSave = () => {
    if (!form.objectiveId || !form.endDate || form.goal <= form.baseline) return;
    onSave({ ...form } as ProjectionConfig);
  };

  return (
    <div className="bg-brand-light-cream border-2 border-accent rounded-[14px] p-6 mb-7">
      <h3 className="m-0 mb-[18px] font-serif text-brand-dark text-[18px]">
        {existing ? "Editar Proyección" : "Nueva Proyección"}
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-brand-warm block mb-1">Objetivo</label>
          <select value={form.objectiveId} onChange={e => setForm(f => ({ ...f, objectiveId: e.target.value }))} className={INP}>
            <option value="">Seleccionar objetivo...</option>
            {objectives.map(o => <option key={o.id} value={o.id}>{o.emoji} {o.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-brand-warm block mb-1">Unidad</label>
          <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="km, kg, %, etc." className={INP} />
        </div>
        <div>
          <label className="text-xs text-brand-warm block mb-1">Valor base</label>
          <input type="number" value={form.baseline} onChange={e => setForm(f => ({ ...f, baseline: Number(e.target.value) }))} className={INP} />
        </div>
        <div>
          <label className="text-xs text-brand-warm block mb-1">Meta final</label>
          <input type="number" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: Number(e.target.value) }))} className={INP} />
        </div>
        <div>
          <label className="text-xs text-brand-warm block mb-1">Fecha límite</label>
          <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={INP} />
        </div>
        <div>
          <label className="text-xs text-brand-warm block mb-1">Progresión</label>
          <select value={form.progression} onChange={e => setForm(f => ({ ...f, progression: e.target.value as ProjectionType }))} className={INP}>
            <option value="linear">Lineal</option>
            <option value="logarithmic">Logarítmica (resistencia)</option>
            <option value="block_periodization">Periodización por bloques</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-brand-warm block mb-1">Umbral de alerta ({Math.round(form.alertThreshold * 100)}%)</label>
          <input
            type="range" min={5} max={40} step={5}
            value={form.alertThreshold * 100}
            onChange={e => setForm(f => ({ ...f, alertThreshold: Number(e.target.value) / 100 }))}
            className="w-full"
            style={{ accentColor: C.accent }}
          />
        </div>
        <div className="flex items-center gap-2.5 pt-4">
          <input
            type="checkbox" id="autoGen"
            checked={form.autoGenerateMilestones}
            onChange={e => setForm(f => ({ ...f, autoGenerateMilestones: e.target.checked }))}
            className="w-4 h-4"
            style={{ accentColor: C.accent }}
          />
          <label htmlFor="autoGen" className="text-[13px] text-brand-dark">Generar milestones automáticamente</label>
        </div>
      </div>
      <div className="flex gap-2.5 mt-1.5">
        <button onClick={handleSave} className="flex-1 py-2.5 bg-accent text-brand-paper border-none rounded-lg cursor-pointer font-bold text-sm">
          Guardar proyección
        </button>
        <button onClick={onCancel} className="flex-1 py-2.5 bg-brand-cream text-brand-dark border-none rounded-lg cursor-pointer text-sm">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Projection Card ──────────────────────────────────────────────────────────
function ProjectionCard({ cfg }: { cfg: ProjectionConfig }) {
  const { objectives, milestones, setMilestones, updateMilestoneActual, deleteProjectionConfig } = useOKRStore();
  const [expanded, setExpanded] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const obj = objectives.find(o => o.id === cfg.objectiveId);
  const objMilestones: Milestone[] = milestones.filter(m => m.objectiveId === cfg.objectiveId);

  const activeMilestones = useMemo(() => {
    if (objMilestones.length > 0) return objMilestones;
    if (cfg.autoGenerateMilestones) return generateMilestones(cfg, cfg.objectiveId);
    return [];
  }, [objMilestones, cfg]);

  const summary = useMemo(() => getProjectionSummary(activeMilestones, cfg), [activeMilestones, cfg]);
  const chartData = useMemo(() => buildChartData(activeMilestones, cfg), [activeMilestones, cfg]);

  const handleSaveActual = (milestoneId: string) => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return;
    updateMilestoneActual(milestoneId, val);

    const ms = activeMilestones.find(m => m.id === milestoneId);
    if (ms && val < ms.targetValue * (1 - cfg.alertThreshold)) {
      const { milestones: recalced } = recalculateMilestones(activeMilestones, ms.weekNumber, val, cfg);
      setMilestones(cfg.objectiveId, recalced);
    } else if (objMilestones.length === 0) {
      const generated = generateMilestones(cfg, cfg.objectiveId);
      const updated = generated.map(m => m.id === milestoneId ? { ...m, actualValue: val } : m);
      setMilestones(cfg.objectiveId, updated);
    }

    setEditingMilestone(null);
    setInputValue("");
  };

  if (!obj) return null;

  const atRiskMilestones = activeMilestones.filter(m => m.status === "at_risk" || m.status === "missed");

  return (
    <div className={cn(
      "bg-brand-paper rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.07)] border-2",
      summary.onTrack ? "border-brand-light-cream" : "border-warning"
    )}>
      {/* At-risk banner */}
      {!summary.onTrack && atRiskMilestones.length > 0 && (
        <div className="bg-warning px-5 py-2.5 flex items-center gap-2">
          <AlertTriangle size={16} color={C.paper} />
          <span className="text-[13px] font-bold text-brand-paper">
            {summary.missedCount} semana{summary.missedCount > 1 ? "s" : ""} perdida{summary.missedCount > 1 ? "s" : ""} — ajusta el ritmo para alcanzar tu meta
          </span>
        </div>
      )}

      <div className="p-5 px-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[20px]">{obj.emoji}</span>
              <h3 className="m-0 font-serif text-brand-dark text-[17px]">{obj.title}</h3>
            </div>
            <div className="text-xs text-brand-warm">
              {cfg.baseline}{cfg.unit} → {cfg.goal}{cfg.unit} · {cfg.progression === "logarithmic" ? "Logarítmica" : cfg.progression === "block_periodization" ? "Periodización" : "Lineal"}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => deleteProjectionConfig(cfg.objectiveId)} className="bg-transparent border-none cursor-pointer text-brand-tan p-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "Progreso", value: `${summary.completionPct}%`, colorClass: "text-accent" },
            { label: "Actual", value: `${summary.currentActual}${cfg.unit}`, colorClass: "text-brand-dark" },
            { label: "Proyectado final", value: `${summary.projectedFinal}${cfg.unit}`, colorClass: summary.projectedFinal >= cfg.goal ? "text-success" : "text-warning" },
            { label: "Semanas completadas", value: `${summary.completedWeeks}/${summary.totalWeeks}`, colorClass: "text-brand-medium" },
          ].map(stat => (
            <div key={stat.label} className="text-center py-3 px-3 bg-brand-light-cream rounded-[10px]">
              <div className={cn("text-[20px] font-extrabold font-serif", stat.colorClass)}>{stat.value}</div>
              <div className="text-[11px] text-brand-warm mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-[200px] mb-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.medium }} />
              <YAxis tick={{ fontSize: 10, fill: C.medium }} />
              <Tooltip
                contentStyle={{ backgroundColor: C.paper, border: `1px solid ${C.tan}`, borderRadius: "8px", fontSize: "12px" }}
                formatter={(val: number, name: string) => [`${val}${cfg.unit}`, name === "projected" ? "Proyectado" : "Real"]}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} formatter={(val) => val === "projected" ? "Proyectado" : "Real"} />
              <Line type="monotone" dataKey="projected" stroke={C.tan} strokeWidth={2} dot={false} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="actual" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3, fill: C.accent }} connectNulls={false} />
              <ReferenceLine y={cfg.goal} stroke={C.success} strokeDasharray="4 2" label={{ value: "Meta", fill: C.success, fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Milestone timeline toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2.5 bg-brand-light-cream text-brand-dark border-none rounded-lg cursor-pointer text-[13px] flex items-center justify-center gap-1.5 font-semibold"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {expanded ? "Ocultar milestones" : `Ver milestones (${activeMilestones.length} semanas)`}
        </button>

        {/* Milestone timeline */}
        {expanded && (
          <div className="mt-4 grid gap-2 max-h-[400px] overflow-y-auto">
            {activeMilestones.map(ms => {
              const ss = STATUS_CLASSES[ms.status] ?? STATUS_CLASSES.pending;
              const isEditing = editingMilestone === ms.id;
              return (
                <div key={ms.id} className={cn("flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border", ss.bg, ss.border)}>
                  <div className={cn("shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] text-brand-paper font-bold", ss.dotBg)}>
                    S{ms.weekNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className={cn("text-xs font-bold", ss.text)}>{ss.label}</span>
                      <span className="text-[11px] text-brand-medium">{ms.targetDate}</span>
                    </div>
                    <div className="text-xs text-brand-dark mt-0.5">
                      Objetivo: <strong>{ms.targetValue}{cfg.unit}</strong>
                      {ms.actualValue > 0 && <> · Real: <strong className={ss.text}>{ms.actualValue}{cfg.unit}</strong></>}
                      {ms.recalculated && <span className="text-[10px] text-warning ml-1.5">recalculado</span>}
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="flex gap-1.5 shrink-0">
                      <input
                        type="number"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSaveActual(ms.id)}
                        placeholder={`${cfg.unit}`}
                        className="w-20 px-2 py-[5px] border border-brand-tan rounded-md text-[13px]"
                        autoFocus
                      />
                      <button onClick={() => handleSaveActual(ms.id)} className="py-[5px] px-2.5 bg-accent text-brand-paper border-none rounded-md cursor-pointer text-xs font-bold">✓</button>
                      <button onClick={() => { setEditingMilestone(null); setInputValue(""); }} className="py-[5px] px-2 bg-brand-cream text-brand-dark border-none rounded-md cursor-pointer text-xs">✗</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingMilestone(ms.id); setInputValue(ms.actualValue > 0 ? String(ms.actualValue) : ""); }}
                      className="shrink-0 py-[5px] px-2.5 bg-brand-cream text-brand-dark border border-brand-tan rounded-md cursor-pointer text-[11px] font-semibold"
                    >
                      Registrar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ProjectionDashboard() {
  const { objectives, projectionConfigs, milestones, setMilestones, saveProjectionConfig } = useOKRStore();
  const [showForm, setShowForm] = useState(false);

  const handleSave = (cfg: ProjectionConfig) => {
    saveProjectionConfig(cfg);
    if (cfg.autoGenerateMilestones) {
      const existing = milestones.filter(m => m.objectiveId === cfg.objectiveId);
      if (existing.length === 0) {
        const generated = generateMilestones(cfg, cfg.objectiveId);
        setMilestones(cfg.objectiveId, generated);
      }
    }
    setShowForm(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-7 flex-wrap gap-3">
        <div>
          <h2 className="m-0 text-[22px] font-serif text-brand-dark">Dashboard de Proyecciones</h2>
          <p className="m-0 mt-1 text-[13px] text-brand-warm">Seguimiento visual de tus objetivos y trayectorias</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 py-2.5 px-5 bg-accent text-brand-paper border-none rounded-lg cursor-pointer font-bold text-sm"
        >
          <Plus size={16} /> Nueva proyección
        </button>
      </div>

      {/* Config Form */}
      {showForm && (
        <ConfigForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}

      {/* OKR Overview */}
      <div className="mb-8">
        <h3 className="m-0 mb-3.5 font-serif text-brand-dark text-base">Árbol de Objetivos</h3>
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {objectives.map(obj => (
            <div
              key={obj.id}
              className="bg-brand-paper border-2 border-brand-light-cream rounded-xl p-4"
              style={{ borderLeft: `4px solid ${obj.color}` }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[18px]">{obj.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-brand-dark overflow-hidden text-ellipsis whitespace-nowrap">{obj.title}</div>
                  <div className="text-[11px] text-brand-warm">{obj.type} · {obj.endDate}</div>
                </div>
                <span className="text-sm font-extrabold shrink-0" style={{ color: obj.color }}>{obj.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-brand-light-cream rounded-[3px] overflow-hidden">
                <div style={{ height: "100%", width: `${obj.progress}%`, backgroundColor: obj.color, borderRadius: "3px", transition: "width 0.6s ease" }} />
              </div>
              {!projectionConfigs.find(c => c.objectiveId === obj.id) && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-2.5 w-full py-1.5 bg-transparent text-accent border border-dashed border-accent rounded-md cursor-pointer text-xs font-semibold"
                >
                  + Agregar proyección
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Projection Cards */}
      {projectionConfigs.length === 0 ? (
        <div className="text-center px-5 py-[60px] bg-brand-light-cream rounded-2xl">
          <div className="text-[48px] mb-4">📈</div>
          <p className="text-base font-serif text-brand-dark mb-2">Sin proyecciones activas</p>
          <p className="text-[13px] text-brand-warm">Crea una proyección para visualizar tu trayectoria semana a semana.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <h3 className="m-0 mb-1 font-serif text-brand-dark text-base">
            Proyecciones activas ({projectionConfigs.length})
          </h3>
          {projectionConfigs.map(cfg => (
            <ProjectionCard key={cfg.objectiveId} cfg={cfg} />
          ))}
        </div>
      )}
    </div>
  );
}
