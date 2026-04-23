'use client';
import { todayLocal } from "@/lib/date/local";

import React, { useState } from 'react';
import { Download, Clipboard, Check, Loader2 } from 'lucide-react';
import { cn } from '@/components/ui';
import { exportToJSON, exportToCSV } from '@/lib/utils';
import { api } from '@/lib/api-client';

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  info: "#5A8FA8", infoLight: "#C8E0EC",
};

type LoadingKey =
  | 'habits-csv' | 'habits-json'
  | 'fitness-json' | 'finance-json'
  | 'productivity-json'
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
  const isDisabled = current !== null;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className="py-2 px-3.5 text-brand-paper border-none rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors duration-200 disabled:cursor-not-allowed cursor-pointer"
      style={{ backgroundColor: isDisabled ? C.lightTan : color }}
    >
      {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
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

  const exportProductivityJSON = () => withLoading('productivity-json', async () => {
    const [pomodoro, projects, okr] = await Promise.all([
      api.get('/productivity/pomodoro?days=90'),
      api.get('/productivity/projects'),
      api.get('/productivity/okr'),
    ]);
    exportToJSON({ pomodoro, projects, okr }, 'productividad');
  });

  const downloadAIJson = () => withLoading('ai-json', async () => {
    const res = await fetch(`/api/export/ai-context?days=${days}`);
    if (!res.ok) throw new Error('Error');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mi-vida-ai-context-${todayLocal()}.json`;
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
    link.download = `mi-vida-resumen-${todayLocal()}.md`;
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
    { label: 'Productividad (JSON)', key: 'productivity-json' as LoadingKey, onClick: exportProductivityJSON },
  ];

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-dark text-brand-paper px-6 py-3 rounded-lg text-sm z-[9999] shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          {toast}
        </div>
      )}

      {/* Module Exports */}
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan shadow-[0_2px_4px_rgba(0,0,0,0.05)] mb-6">
        <h3 className="font-serif text-brand-dark mb-2 flex items-center gap-2 m-0">
          <Download size={20} color={C.info} /> Exportar por Módulo
        </h3>
        <p className="text-[0.85rem] text-brand-warm mb-4 m-0">
          Descarga tus datos de cada área por separado
        </p>
        <div className="flex gap-2.5 flex-wrap">
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
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan shadow-[0_2px_4px_rgba(0,0,0,0.05)] mb-6">
        <h3 className="font-serif text-brand-dark mb-2 flex items-center gap-2 m-0">
          🤖 Reporte para IA
        </h3>
        <p className="text-[0.85rem] text-brand-warm mb-5 m-0">
          Genera un resumen estructurado de todos tus datos para compartir con un asistente IA
          y obtener recomendaciones personalizadas.
        </p>

        {/* Period selector */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[0.85rem] font-semibold text-brand-dark">Período:</span>
          {([7, 30, 90, 365] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "py-1.5 px-3.5 rounded-md cursor-pointer text-[13px] border transition-colors",
                days === d
                  ? "border-accent bg-accent-glow text-[#2E1F14] font-bold"
                  : "border-brand-tan bg-transparent text-brand-warm font-normal"
              )}
            >
              {d === 365 ? '1 año' : `${d} días`}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap mb-4">
          <button
            onClick={downloadAIJson}
            disabled={loading !== null}
            className={cn(
              "py-3 px-5 text-brand-paper border-none rounded-lg font-bold text-sm flex items-center gap-2 transition-colors",
              loading !== null ? "bg-brand-light-tan cursor-not-allowed" : "bg-accent cursor-pointer"
            )}
          >
            {loading === 'ai-json' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            📊 Contexto IA (JSON)
          </button>

          <button
            onClick={downloadAIMarkdown}
            disabled={loading !== null}
            className={cn(
              "py-3 px-5 text-brand-paper border-none rounded-lg font-bold text-sm flex items-center gap-2 transition-colors",
              loading !== null ? "bg-brand-light-tan cursor-not-allowed" : "bg-info cursor-pointer"
            )}
          >
            {loading === 'ai-md' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            📋 Resumen IA (Texto)
          </button>

          <button
            onClick={copyAIMarkdown}
            disabled={loading !== null}
            className={cn(
              "py-3 px-5 text-brand-paper border-none rounded-lg font-bold text-sm flex items-center gap-2 transition-all duration-300",
              copied ? "bg-success cursor-pointer" : loading !== null ? "bg-brand-light-tan cursor-not-allowed" : "bg-brand-dark cursor-pointer"
            )}
          >
            {loading === 'ai-copy' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : copied ? (
              <Check size={16} />
            ) : (
              <Clipboard size={16} />
            )}
            {copied ? '¡Copiado!' : 'Copiar Resumen para IA'}
          </button>
        </div>

        <div className="bg-accent-glow border border-accent rounded-lg px-4 py-3 text-[13px] text-[#2E1F14]">
          💡 <strong>Consejo:</strong> Haz clic en "Copiar Resumen" y pégalo directamente en Claude o ChatGPT
          para obtener análisis y recomendaciones personalizadas basadas en todos tus datos.
        </div>
      </div>
    </>
  );
}
