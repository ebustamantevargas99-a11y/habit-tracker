"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Loader2, X } from "lucide-react";
import {
  PROVIDER_LABELS,
  PROVIDER_URLS,
  SCOPE_LABELS,
  STYLE_LABELS,
  type AIProvider,
  type ExportScope,
  type AnalysisStyle,
} from "@/lib/ai-export/types";
import { api } from "@/lib/api-client";

type Props = {
  open: boolean;
  onClose: () => void;
  initialScope?: ExportScope;
  title?: string;
};

type GenerateResponse = {
  prompt: string;
  scope: ExportScope;
  generatedAt: string;
  range: { from: string; to: string };
};

export default function AIExportModal({ open, onClose, initialScope = "daily", title }: Props) {
  const [scope, setScope] = useState<ExportScope>(initialScope);
  const [style, setStyle] = useState<AnalysisStyle>("coach");
  const [provider, setProvider] = useState<AIProvider>("claude");
  const [customQuestion, setCustomQuestion] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  if (!open) return null;

  async function generate() {
    setLoading(true);
    try {
      const res = await api.post<GenerateResponse>("/ai-export", {
        scope,
        style,
        customQuestion: customQuestion.trim() || undefined,
      });
      setPrompt(res.prompt);
      setGenerated(true);
    } catch {
      toast.error("Error generando el prompt");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function openProvider() {
    const url = PROVIDER_URLS[provider];
    if (!url) {
      toast.info("Copia el prompt y pégalo en tu IA favorita");
      return;
    }
    if (!prompt) {
      toast.info("Genera el prompt primero");
      return;
    }
    void navigator.clipboard.writeText(prompt).catch(() => {});
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Prompt copiado. Pégalo en la pestaña nueva.");
  }

  function reset() {
    setPrompt("");
    setGenerated(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-warm-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-brand-cream">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-dark m-0">
              {title ?? "Exportar a IA"}
            </h2>
            <p className="text-xs text-brand-warm mt-0.5">
              Genera un prompt con tu contexto y pégalo en tu IA favorita.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-brand-warm hover:text-brand-dark hover:bg-brand-cream rounded-full transition"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {!generated && (
            <>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-2">
                  Qué analizar
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as ExportScope)}
                  className="w-full px-3 py-2.5 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm"
                >
                  {(Object.keys(SCOPE_LABELS) as ExportScope[]).map((s) => (
                    <option key={s} value={s}>
                      {SCOPE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark mb-2">
                  Estilo del análisis
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STYLE_LABELS) as AnalysisStyle[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStyle(s)}
                      className={`px-3 py-2.5 rounded-button border text-left text-sm transition ${
                        style === s
                          ? "border-accent bg-accent/10"
                          : "border-brand-cream hover:border-brand-tan"
                      }`}
                    >
                      <p className="font-semibold text-brand-dark">{STYLE_LABELS[s].label}</p>
                      <p className="text-xs text-brand-warm mt-0.5">
                        {STYLE_LABELS[s].description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark mb-2">
                  IA de destino
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`px-3 py-2 rounded-button border text-sm transition ${
                        provider === p
                          ? "border-accent bg-accent/10 text-brand-dark font-semibold"
                          : "border-brand-cream text-brand-medium hover:border-brand-tan"
                      }`}
                    >
                      {PROVIDER_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark mb-2">
                  Pregunta específica <span className="text-brand-warm text-xs">(opcional)</span>
                </label>
                <textarea
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Ej. ¿Por qué salto los entrenos de martes? ¿Qué correlación hay entre mi sueño y mood?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm resize-y"
                />
              </div>
            </>
          )}

          {generated && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-brand-dark">
                  Prompt listo ({prompt.length.toLocaleString()} caracteres)
                </label>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-brand-warm hover:text-brand-dark underline"
                >
                  Cambiar opciones
                </button>
              </div>
              <textarea
                value={prompt}
                readOnly
                rows={16}
                className="w-full px-3 py-3 rounded-button border border-brand-cream bg-brand-warm-white text-brand-dark text-xs font-mono"
              />
              <p className="text-xs text-brand-warm mt-2">
                Tus datos NO salieron a ningún servidor externo. El prompt vive solo en este
                navegador hasta que lo pegues en tu IA.
              </p>
            </div>
          )}
        </div>

        <footer className="px-6 py-4 border-t border-brand-cream flex gap-3 justify-end">
          {!generated ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-button text-sm text-brand-warm hover:bg-brand-cream transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="px-6 py-2.5 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40 transition flex items-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Generar prompt
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-5 py-2.5 rounded-button text-sm font-semibold border border-brand-tan text-brand-dark hover:bg-brand-cream transition flex items-center gap-2"
              >
                <Copy size={14} /> Copiar
              </button>
              <button
                type="button"
                onClick={openProvider}
                disabled={!PROVIDER_URLS[provider]}
                className="px-6 py-2.5 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40 transition flex items-center gap-2"
              >
                <ExternalLink size={14} />
                Abrir {PROVIDER_LABELS[provider]}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
