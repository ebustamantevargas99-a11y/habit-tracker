'use client';

import React, { useState } from 'react';
import { Download, Clipboard, Check, Loader2 } from 'lucide-react';
import { exportToJSON, exportToCSV } from '@/lib/utils';
import { api } from '@/lib/api-client';

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  info: "#5A8FA8", infoLight: "#C8E0EC",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: C.paper, borderRadius: '12px', padding: '24px',
  border: `1px solid ${C.tan}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  marginBottom: '24px',
};

type LoadingKey =
  | 'habits-csv' | 'habits-json'
  | 'fitness-json' | 'finance-json'
  | 'wellness-json' | 'productivity-json'
  | 'ai-json' | 'ai-md' | 'ai-copy';

// ─── Module Export Button ─────────────────────────────────────────────────────

function ModuleBtn({
  label,
  loadingKey,
  current,
  onClick,
  color = C.info,
}: {
  label: string;
  loadingKey: LoadingKey;
  current: LoadingKey | null;
  onClick: () => void;
  color?: string;
}) {
  const isLoading = current === loadingKey;
  return (
    <button
      onClick={onClick}
      disabled={current !== null}
      style={{
        padding: '8px 14px', backgroundColor: current !== null ? C.lightTan : color,
        color: C.paper, border: 'none', borderRadius: '6px', cursor: current !== null ? 'not-allowed' : 'pointer',
        fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
        transition: 'background 0.2s',
      }}
    >
      {isLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={12} />}
      {label}
    </button>
  );
}

// ─── Export Section ───────────────────────────────────────────────────────────

export default function ExportSection() {
  const [loading, setLoading] = useState<LoadingKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [days, setDays] = useState(30);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function withLoading(key: LoadingKey, fn: () => Promise<void>) {
    setLoading(key);
    try { await fn(); } catch { showToast('Error al exportar. Intenta de nuevo.'); }
    finally { setLoading(null); }
  }

  // ── Module exports ──────────────────────────────────────────────────────────

  const exportHabitsCSV = () => withLoading('habits-csv', async () => {
    const data = await api.get<Record<string, unknown>[]>('/habits');
    exportToCSV(
      (data as { id: string; name: string; category: string; streakCurrent: number; streakBest: number; strength: number; frequency: string; isActive: boolean; createdAt: string }[])
        .map(h => ({
          nombre: h.name,
          categoria: h.category,
          racha_actual: h.streakCurrent,
          racha_mejor: h.streakBest,
          fuerza: h.strength,
          frecuencia: h.frequency,
          activo: h.isActive,
          creado: h.createdAt,
        })),
      'habitos'
    );
  });

  const exportHabitsJSON = () => withLoading('habits-json', async () => {
    const data = await api.get('/habits');
    exportToJSON(data, 'habitos');
  });

  const exportFitnessJSON = () => withLoading('fitness-json', async () => {
    const [workouts, prs, body, weight, steps] = await Promise.all([
      api.get('/fitness/workouts'),
      api.get('/fitness/personal-records'),
      api.get('/fitness/body-metrics'),
      api.get('/fitness/weight?days=90'),
      api.get('/fitness/steps?days=30'),
    ]);
    exportToJSON({ workouts, personalRecords: prs, bodyMetrics: body, weightLog: weight, stepsLog: steps }, 'fitness');
  });

  const exportFinanceJSON = () => withLoading('finance-json', async () => {
    const [transactions, budgets, bills, subscriptions, wishlist] = await Promise.all([
      api.get('/finance/transactions'),
      api.get('/finance/budgets'),
      api.get('/finance/bills'),
      api.get('/finance/subscriptions'),
      api.get('/finance/wishlist'),
    ]);
    exportToJSON({ transactions, budgets, bills, subscriptions, wishlist }, 'finanzas');
  });

  const exportWellnessJSON = () => withLoading('wellness-json', async () => {
    const [mood, sleep, hydration, medications, symptoms, appointments] = await Promise.all([
      api.get('/wellness/mood?days=90'),
      api.get('/wellness/sleep?days=90'),
      api.get('/wellness/hydration?days=30'),
      api.get('/wellness/medications'),
      api.get('/wellness/symptoms?days=90'),
      api.get('/wellness/appointments'),
    ]);
    exportToJSON({ mood, sleep, hydration, medications, symptoms, appointments }, 'bienestar');
  });

  const exportProductivityJSON = () => withLoading('productivity-json', async () => {
    const [pomodoro, projects, okr] = await Promise.all([
      api.get('/productivity/pomodoro?days=90'),
      api.get('/productivity/projects'),
      api.get('/productivity/okr'),
    ]);
    exportToJSON({ pomodoro, projects, okr }, 'productividad');
  });

  // ── AI exports ──────────────────────────────────────────────────────────────

  const downloadAIJson = () => withLoading('ai-json', async () => {
    const res = await fetch(`/api/export/ai-context?days=${days}`);
    if (!res.ok) throw new Error('Error');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mi-vida-ai-context-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  const downloadAIMarkdown = () => withLoading('ai-md', async () => {
    const res = await fetch(`/api/export/ai-context?days=${days}&format=markdown`);
    if (!res.ok) throw new Error('Error');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mi-vida-resumen-${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  });

  const copyAIMarkdown = () => withLoading('ai-copy', async () => {
    const res = await fetch(`/api/export/ai-context?days=${days}&format=markdown`);
    if (!res.ok) throw new Error('Error');
    const text = await res.text();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    showToast('✅ Resumen copiado — pégalo en Claude o ChatGPT para obtener análisis');
  });

  const MODULES = [
    { label: 'Hábitos (CSV)', key: 'habits-csv' as LoadingKey, onClick: exportHabitsCSV },
    { label: 'Hábitos (JSON)', key: 'habits-json' as LoadingKey, onClick: exportHabitsJSON },
    { label: 'Fitness (JSON)', key: 'fitness-json' as LoadingKey, onClick: exportFitnessJSON },
    { label: 'Finanzas (JSON)', key: 'finance-json' as LoadingKey, onClick: exportFinanceJSON },
    { label: 'Bienestar (JSON)', key: 'wellness-json' as LoadingKey, onClick: exportWellnessJSON },
    { label: 'Productividad (JSON)', key: 'productivity-json' as LoadingKey, onClick: exportProductivityJSON },
  ];

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: C.dark, color: C.paper, padding: '12px 24px', borderRadius: '8px',
          fontSize: '14px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}

      {/* Module Exports */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={20} color={C.info} /> Exportar por Módulo
        </h3>
        <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0 0 16px 0' }}>
          Descarga tus datos de cada área por separado
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {MODULES.map((m) => (
            <ModuleBtn
              key={m.key}
              label={m.label}
              loadingKey={m.key}
              current={loading}
              onClick={m.onClick}
            />
          ))}
        </div>
      </div>

      {/* AI Report */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🤖 Reporte para IA
        </h3>
        <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0 0 20px 0' }}>
          Genera un resumen estructurado de todos tus datos para compartir con un asistente IA
          y obtener recomendaciones personalizadas.
        </p>

        {/* Period selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: C.dark }}>Período:</span>
          {([7, 30, 90, 365] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '6px 14px', border: `1px solid ${days === d ? C.accent : C.tan}`,
                borderRadius: '6px', cursor: 'pointer',
                backgroundColor: days === d ? C.accentGlow : 'transparent',
                color: days === d ? C.dark : C.warm,
                fontWeight: days === d ? '700' : '400',
                fontSize: '13px',
              }}
            >
              {d === 365 ? '1 año' : `${d} días`}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button
            onClick={downloadAIJson}
            disabled={loading !== null}
            style={{
              padding: '12px 20px', backgroundColor: loading !== null ? C.lightTan : C.accent,
              color: C.paper, border: 'none', borderRadius: '8px',
              cursor: loading !== null ? 'not-allowed' : 'pointer',
              fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {loading === 'ai-json' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
            📊 Contexto IA (JSON)
          </button>

          <button
            onClick={downloadAIMarkdown}
            disabled={loading !== null}
            style={{
              padding: '12px 20px', backgroundColor: loading !== null ? C.lightTan : C.info,
              color: C.paper, border: 'none', borderRadius: '8px',
              cursor: loading !== null ? 'not-allowed' : 'pointer',
              fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {loading === 'ai-md' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
            📋 Resumen IA (Texto)
          </button>

          <button
            onClick={copyAIMarkdown}
            disabled={loading !== null}
            style={{
              padding: '12px 20px',
              backgroundColor: copied ? C.success : loading !== null ? C.lightTan : C.dark,
              color: C.paper, border: 'none', borderRadius: '8px',
              cursor: loading !== null ? 'not-allowed' : 'pointer',
              fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'background 0.3s',
            }}
          >
            {loading === 'ai-copy' ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : copied ? (
              <Check size={16} />
            ) : (
              <Clipboard size={16} />
            )}
            {copied ? '¡Copiado!' : 'Copiar Resumen para IA'}
          </button>
        </div>

        <div style={{
          backgroundColor: C.accentGlow, border: `1px solid ${C.accent}`,
          borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: C.brown,
        }}>
          💡 <strong>Tip:</strong> Haz click en "Copiar Resumen" y pégalo directamente en Claude o ChatGPT
          para obtener análisis y recomendaciones personalizadas basadas en todos tus datos.
        </div>
      </div>
    </>
  );
}
