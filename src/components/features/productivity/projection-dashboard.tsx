"use client";
import React, { useState, useMemo } from "react";
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
import { Plus, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Target, TrendingUp, X } from "lucide-react";

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  warning: "#D4943A", warningLight: "#F5E0C0", danger: "#C0544F",
  dangerLight: "#F5D0CE", info: "#5A8FA8", infoLight: "#C8E0EC",
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  hit:     { bg: C.successLight, color: C.success, label: "✓ Logrado" },
  missed:  { bg: C.dangerLight,  color: C.danger,  label: "✗ Perdido" },
  at_risk: { bg: C.warningLight, color: C.warning, label: "⚠ En riesgo" },
  pending: { bg: C.lightCream,   color: C.medium,  label: "⬤ Pendiente" },
};

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

  const inp: React.CSSProperties = {
    padding: "9px 12px", border: `1px solid ${C.tan}`, borderRadius: "8px",
    fontSize: "13px", backgroundColor: C.paper, color: C.dark, width: "100%", boxSizing: "border-box",
  };

  const handleSave = () => {
    if (!form.objectiveId || !form.endDate || form.goal <= form.baseline) return;
    onSave({ ...form } as ProjectionConfig);
  };

  return (
    <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.accent}`, borderRadius: "14px", padding: "24px", marginBottom: "28px" }}>
      <h3 style={{ margin: "0 0 18px 0", fontFamily: "Georgia, serif", color: C.dark, fontSize: "18px" }}>
        {existing ? "Editar Proyección" : "Nueva Proyección"}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <label style={{ fontSize: "12px", color: C.warm, display: "block", marginBottom: "4px" }}>Objetivo</label>
          <select value={form.objectiveId} onChange={e => setForm(f => ({ ...f, objectiveId: e.target.value }))} style={inp}>
            <option value="">Seleccionar objetivo...</option>
            {objectives.map(o => <option key={o.id} value={o.id}>{o.emoji} {o.title}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "12px", color: C.warm, display: "block", marginBottom: "4px" }}>Unidad</label>
          <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="km, kg, %, etc." style={inp} />
        </div>
        <div>
          <label style={{ fontSize: "12px", color: C.warm, display: "block", marginBottom: "4px" }}>Valor base</label>
          <input type="number" value={form.baseline} onChange={e => setForm(f => ({ ...f, baseline: Number(e.target.value) }))} style={inp} />
        </div>
        <div>
          <label style={{ fontSize: "12px", color: C.warm, display: "block", marginBottom: "4px" }}>Meta final</label>
          <input type="number" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: Number(e.target.value) }))} style={inp} />
        </div>
        <div>
          <label style={{ fontSize: "12px", color: C.warm, display: "block", marginBottom: "4px" }}>Fecha límite</label>
          <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={inp} />
        </div>
        <div>
          <label style={{ fontSize: "12px", color: C.warm, display: "block", marginBottom: "4px" }}>Progresión</label>
          <select value={form.progression} onChange={e => setForm(f => ({ ...f, progression: e.target.value as ProjectionType }))} style={inp}>
            <option value="linear">Lineal</option>
            <option value="logarithmic">Logarítmica (resistencia)</option>
            <option value="block_periodization">Periodización por bloques</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "12px", color: C.warm, display: "block", marginBottom: "4px" }}>Umbral de alerta ({Math.round(form.alertThreshold * 100)}%)</label>
          <input type="range" min={5} max={40} step={5} value={form.alertThreshold * 100} onChange={e => setForm(f => ({ ...f, alertThreshold: Number(e.target.value) / 100 }))} style={{ width: "100%", accentColor: C.accent }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "16px" }}>
          <input type="checkbox" id="autoGen" checked={form.autoGenerateMilestones} onChange={e => setForm(f => ({ ...f, autoGenerateMilestones: e.target.checked }))} style={{ accentColor: C.accent, width: "16px", height: "16px" }} />
          <label htmlFor="autoGen" style={{ fontSize: "13px", color: C.dark }}>Generar milestones automáticamente</label>
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
        <button onClick={handleSave} style={{ flex: 1, padding: "10px", backgroundColor: C.accent, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
          Guardar proyección
        </button>
        <button onClick={onCancel} style={{ flex: 1, padding: "10px", backgroundColor: C.cream, color: C.dark, border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Projection Card ──────────────────────────────────────────────────────────
function ProjectionCard({ cfg }: { cfg: ProjectionConfig }) {
  const { objectives, milestones, setMilestones, updateMilestoneActual, saveProjectionConfig, deleteProjectionConfig } = useOKRStore();
  const [expanded, setExpanded] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const obj = objectives.find(o => o.id === cfg.objectiveId);
  const objMilestones: Milestone[] = milestones.filter(m => m.objectiveId === cfg.objectiveId);

  // Auto-generate milestones if none exist
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

    // Check if missed and recalculate remaining
    const ms = activeMilestones.find(m => m.id === milestoneId);
    if (ms && val < ms.targetValue * (1 - cfg.alertThreshold)) {
      const { milestones: recalced } = recalculateMilestones(activeMilestones, ms.weekNumber, val, cfg);
      setMilestones(cfg.objectiveId, recalced);
    } else if (objMilestones.length === 0) {
      // First time logging — persist generated milestones
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
    <div style={{ backgroundColor: C.paper, border: `2px solid ${summary.onTrack ? C.lightCream : C.warning}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
      {/* At-risk banner */}
      {!summary.onTrack && (atRiskMilestones.length > 0) && (
        <div style={{ backgroundColor: C.warning, padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} color={C.paper} />
          <span style={{ fontSize: "13px", fontWeight: "700", color: C.paper }}>
            {summary.missedCount} semana{summary.missedCount > 1 ? "s" : ""} perdida{summary.missedCount > 1 ? "s" : ""} — ajusta el ritmo para alcanzar tu meta
          </span>
        </div>
      )}

      <div style={{ padding: "20px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "20px" }}>{obj.emoji}</span>
              <h3 style={{ margin: 0, fontFamily: "Georgia, serif", color: C.dark, fontSize: "17px" }}>{obj.title}</h3>
            </div>
            <div style={{ fontSize: "12px", color: C.warm }}>
              {cfg.baseline}{cfg.unit} → {cfg.goal}{cfg.unit} · {cfg.progression === "logarithmic" ? "Logarítmica" : cfg.progression === "block_periodization" ? "Periodización" : "Lineal"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => deleteProjectionConfig(cfg.objectiveId)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tan, padding: "4px" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Progreso", value: `${summary.completionPct}%`, color: C.accent },
            { label: "Actual", value: `${summary.currentActual}${cfg.unit}`, color: C.dark },
            { label: "Proyectado final", value: `${summary.projectedFinal}${cfg.unit}`, color: summary.projectedFinal >= cfg.goal ? C.success : C.warning },
            { label: "Semanas completadas", value: `${summary.completedWeeks}/${summary.totalWeeks}`, color: C.medium },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center", padding: "12px", backgroundColor: C.lightCream, borderRadius: "10px" }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: stat.color, fontFamily: "Georgia, serif" }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: C.warm, marginTop: "2px" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ height: "200px", marginBottom: "20px" }}>
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
          style={{ width: "100%", padding: "10px", backgroundColor: C.lightCream, color: C.dark, border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "600" }}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {expanded ? "Ocultar milestones" : `Ver milestones (${activeMilestones.length} semanas)`}
        </button>

        {/* Milestone timeline */}
        {expanded && (
          <div style={{ marginTop: "16px", display: "grid", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
            {activeMilestones.map(ms => {
              const ss = STATUS_STYLE[ms.status] ?? STATUS_STYLE.pending;
              const isEditing = editingMilestone === ms.id;
              return (
                <div key={ms.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", backgroundColor: ss.bg, borderRadius: "10px", border: `1px solid ${ss.color}20` }}>
                  <div style={{ flexShrink: 0, width: "28px", height: "28px", borderRadius: "50%", backgroundColor: ss.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: C.paper, fontWeight: "700" }}>
                    S{ms.weekNumber}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: ss.color }}>{ss.label}</span>
                      <span style={{ fontSize: "11px", color: C.medium }}>{ms.targetDate}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: C.dark, marginTop: "2px" }}>
                      Objetivo: <strong>{ms.targetValue}{cfg.unit}</strong>
                      {ms.actualValue > 0 && <> · Real: <strong style={{ color: ss.color }}>{ms.actualValue}{cfg.unit}</strong></>}
                      {ms.recalculated && <span style={{ fontSize: "10px", color: C.warning, marginLeft: "6px" }}>recalculado</span>}
                    </div>
                  </div>
                  {isEditing ? (
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <input
                        type="number"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSaveActual(ms.id)}
                        placeholder={`${cfg.unit}`}
                        style={{ width: "80px", padding: "5px 8px", border: `1px solid ${C.tan}`, borderRadius: "6px", fontSize: "13px" }}
                        autoFocus
                      />
                      <button onClick={() => handleSaveActual(ms.id)} style={{ padding: "5px 10px", backgroundColor: C.accent, color: C.paper, border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}>✓</button>
                      <button onClick={() => { setEditingMilestone(null); setInputValue(""); }} style={{ padding: "5px 8px", backgroundColor: C.cream, color: C.dark, border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>✗</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingMilestone(ms.id); setInputValue(ms.actualValue > 0 ? String(ms.actualValue) : ""); }}
                      style={{ flexShrink: 0, padding: "5px 10px", backgroundColor: C.cream, color: C.dark, border: `1px solid ${C.tan}`, borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}
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

  // OKR objectives overview (always visible)
  const objectivesWithProgress = useMemo(() =>
    objectives.filter(o => o.type !== "yearly" || objectives.some(c => c.parentId === o.id)),
    [objectives]
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontFamily: "Georgia, serif", color: C.dark }}>Dashboard de Proyecciones</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: C.warm }}>Seguimiento visual de tus objetivos y trayectorias</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: C.accent, color: C.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}
        >
          <Plus size={16} /> Nueva proyección
        </button>
      </div>

      {/* Config Form */}
      {showForm && (
        <ConfigForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* OKR Overview */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ margin: "0 0 14px 0", fontFamily: "Georgia, serif", color: C.dark, fontSize: "16px" }}>Árbol de Objetivos</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {objectives.map(obj => (
            <div key={obj.id} style={{ backgroundColor: C.paper, border: `2px solid ${C.lightCream}`, borderRadius: "12px", padding: "16px", borderLeft: `4px solid ${obj.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontSize: "18px" }}>{obj.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{obj.title}</div>
                  <div style={{ fontSize: "11px", color: C.warm }}>{obj.type} · {obj.endDate}</div>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "800", color: obj.color, flexShrink: 0 }}>{obj.progress}%</span>
              </div>
              <div style={{ width: "100%", height: "6px", backgroundColor: C.lightCream, borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${obj.progress}%`, backgroundColor: obj.color, borderRadius: "3px", transition: "width 0.6s ease" }} />
              </div>
              {!projectionConfigs.find(c => c.objectiveId === obj.id) && (
                <button
                  onClick={() => setShowForm(true)}
                  style={{ marginTop: "10px", width: "100%", padding: "6px", backgroundColor: "transparent", color: C.accent, border: `1px dashed ${C.accent}`, borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
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
        <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: C.lightCream, borderRadius: "16px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📈</div>
          <p style={{ fontSize: "16px", fontFamily: "Georgia, serif", color: C.dark, marginBottom: "8px" }}>Sin proyecciones activas</p>
          <p style={{ fontSize: "13px", color: C.warm }}>Crea una proyección para visualizar tu trayectoria semana a semana.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "24px" }}>
          <h3 style={{ margin: "0 0 4px 0", fontFamily: "Georgia, serif", color: C.dark, fontSize: "16px" }}>
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
