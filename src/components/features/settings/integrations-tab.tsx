"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  Copy,
  RefreshCw,
  Trash2,
  CheckCircle,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { api } from "@/lib/api-client";

const APP_URL = "https://habit-tracker-two-flame.vercel.app";
const CARD =
  "bg-brand-paper rounded-xl p-6 border border-brand-tan shadow-[0_2px_4px_rgba(0,0,0,0.05)] mb-5";

export default function IntegrationsTab() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [habits, setHabits] = useState<
    { id: string; name: string; icon: string }[]
  >([]);
  const [showHabits, setShowHabits] = useState(false);

  useEffect(() => {
    api
      .get<{ hasKey: boolean }>("/user/api-key")
      .then((r) => setHasKey(r.hasKey))
      .catch(() => {});
  }, []);

  async function generateKey() {
    setLoading(true);
    try {
      const res = await api.post<{ apiKey: string }>("/user/api-key", {});
      setApiKey(res.apiKey);
      setHasKey(true);
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey() {
    if (!confirm("¿Revocar la API key? Los widgets dejarán de funcionar."))
      return;
    await api.delete("/user/api-key");
    setApiKey(null);
    setHasKey(false);
  }

  function copyKey() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function loadHabits() {
    if (!apiKey) return;
    try {
      const res = await fetch(`${APP_URL}/api/quick-entry`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = (await res.json()) as {
        habits: { id: string; name: string; icon: string }[];
      };
      setHabits(data.habits);
      setShowHabits(true);
    } catch {
      alert("Error cargando hábitos");
    }
  }

  const scriptableCode = apiKey
    ? `// Ultimate Tracker — Widget para Scriptable
// Pega este código en un nuevo script de Scriptable

const API_KEY = "${apiKey}";
const BASE    = "${APP_URL}/api/quick-entry";

async function fetchData(action, body = {}) {
  const req = new Request(BASE);
  req.method = "POST";
  req.headers = { "Authorization": "Bearer " + API_KEY, "Content-Type": "application/json" };
  req.body = JSON.stringify({ action, ...body });
  const res = await req.loadJSON();
  return res;
}

// Widget pequeño — muestra botones de acción rápida
const widget = new ListWidget();
widget.backgroundColor = new Color("#1B242E");
widget.setPadding(12, 14, 12, 14);
widget.url = "${APP_URL}";

const title = widget.addText("⚡ Ultimate TRACKER");
title.font = Font.boldSystemFont(11);
title.textColor = new Color("#C9A84C");

widget.addSpacer(8);

const actions = [
  { label: "💧 +250ml agua",   action: "water",  body: { glasses: 1 } },
  { label: "⚖️  Registrar peso", action: "weight", body: null },  // abre la app
];

for (const a of actions) {
  const row = widget.addText(a.label);
  row.font = Font.systemFont(10);
  row.textColor = new Color("#E8DCC8");
}

widget.addSpacer();
const sub = widget.addText("Toca para abrir la app");
sub.font = Font.systemFont(9);
sub.textColor = new Color("#C9A84C66");

Script.setWidget(widget);
Script.complete();`
    : "";

  return (
    <div>
      {/* API Key */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-1">
          <Key size={18} className="text-accent" />
          <h2 className="text-base font-semibold text-brand-dark m-0">
            API Key personal
          </h2>
        </div>
        <p className="text-sm text-brand-warm mb-4">
          Tu clave privada para conectar Scriptable e iOS Atajos con la app.{" "}
          <strong>No la compartas.</strong>
        </p>

        {!hasKey && !apiKey && (
          <button
            onClick={generateKey}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition"
          >
            <Key size={15} />
            {loading ? "Generando…" : "Generar API key"}
          </button>
        )}

        {(hasKey || apiKey) && (
          <div className="space-y-3">
            {apiKey ? (
              <div className="bg-brand-cream rounded-lg p-3 border border-brand-tan">
                <p className="text-[11px] text-brand-warm mb-1 font-medium">
                  Tu API key (cópiala ahora, no se vuelve a mostrar)
                </p>
                <code className="text-sm font-mono text-brand-dark break-all">
                  {apiKey}
                </code>
              </div>
            ) : (
              <div className="bg-brand-cream rounded-lg p-3 border border-brand-tan">
                <p className="text-sm text-brand-warm">
                  Ya tienes una API key activa. Genera una nueva para verla.
                </p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {apiKey && (
                <button
                  onClick={copyKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-tan text-sm font-medium text-brand-dark hover:bg-brand-cream transition"
                >
                  {copied ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copied ? "Copiada" : "Copiar"}
                </button>
              )}
              <button
                onClick={generateKey}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-tan text-sm font-medium text-brand-dark hover:bg-brand-cream transition"
              >
                <RefreshCw size={14} />
                {apiKey ? "Regenerar" : "Ver nueva key"}
              </button>
              <button
                onClick={revokeKey}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 size={14} />
                Revocar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Acciones disponibles */}
      <div className={CARD}>
        <h2 className="text-base font-semibold text-brand-dark mb-3">
          Acciones disponibles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {[
            {
              icon: "✅",
              name: "habit",
              desc: "Marcar hábito como completado",
            },
            { icon: "💧", name: "water", desc: "Registrar vasos / ml de agua" },
            { icon: "⚖️", name: "weight", desc: "Registrar peso corporal" },
            { icon: "💸", name: "expense", desc: "Anotar gasto o ingreso" },
            { icon: "🏋️", name: "workout", desc: "Registrar entrenamiento" },
          ].map((a) => (
            <div
              key={a.name}
              className="flex items-start gap-2 p-3 rounded-lg bg-brand-cream border border-brand-tan"
            >
              <span className="text-lg leading-none mt-0.5">{a.icon}</span>
              <div>
                <code className="text-[11px] font-mono text-accent font-semibold">
                  {a.name}
                </code>
                <p className="text-brand-warm text-xs m-0">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {apiKey && (
          <button
            onClick={loadHabits}
            className="mt-4 flex items-center gap-1.5 text-sm text-accent font-medium hover:underline"
          >
            <ExternalLink size={13} />
            Ver IDs de mis hábitos
          </button>
        )}

        {showHabits && habits.length > 0 && (
          <div className="mt-3 bg-brand-cream rounded-lg border border-brand-tan p-3 space-y-1">
            {habits.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-2 text-xs font-mono"
              >
                <span>{h.icon}</span>
                <span className="text-brand-dark font-semibold">{h.name}</span>
                <span className="text-brand-warm ml-auto">{h.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scriptable */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-1">
          <Smartphone size={18} className="text-accent" />
          <h2 className="text-base font-semibold text-brand-dark m-0">
            Widget Scriptable (iPhone)
          </h2>
        </div>
        <p className="text-sm text-brand-warm mb-4">
          Instala <strong>Scriptable</strong> (gratis en App Store), crea un
          nuevo script y pega el código de abajo.
        </p>

        {!apiKey && (
          <p className="text-sm text-brand-warm italic">
            Genera tu API key primero para ver el código.
          </p>
        )}

        {apiKey && (
          <div className="relative">
            <pre className="bg-[#1B242E] text-[#C9A84C] text-[11px] font-mono rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {scriptableCode}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(scriptableCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-white text-[10px] hover:bg-white/20 transition"
            >
              {copied ? <CheckCircle size={11} /> : <Copy size={11} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        )}
      </div>

      {/* iOS Atajos */}
      <div className={CARD}>
        <h2 className="text-base font-semibold text-brand-dark mb-1">
          iOS Atajos (Shortcuts)
        </h2>
        <p className="text-sm text-brand-warm mb-4">
          Crea atajos en la app <strong>Atajos</strong> de iPhone para registrar
          datos con un toque desde el widget de Atajos.
        </p>

        <div className="space-y-3 text-sm">
          <p className="font-semibold text-brand-dark">
            Ejemplo — atajo "💧 Agua":
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-brand-warm leading-relaxed">
            <li>
              Abre <strong>Atajos</strong> → toca <strong>+</strong> para nuevo
              atajo
            </li>
            <li>
              Agrega acción: <strong>Pedir entrada</strong> → Tipo: Número →
              Pregunta: "¿Cuántos vasos?"
            </li>
            <li>
              Agrega acción: <strong>Obtener contenido de URL</strong>
            </li>
            <li className="font-mono text-xs bg-brand-cream p-2 rounded block mt-1">
              URL: {APP_URL}/api/quick-entry
            </li>
            <li>
              Método: <strong>POST</strong> → Cuerpo JSON:
            </li>
            <li className="font-mono text-xs bg-brand-cream p-2 rounded block">
              {`{ "action": "water", "glasses": [variable: entrada] }`}
            </li>
            <li>
              Header: <strong>Authorization</strong> ={" "}
              <code className="text-accent">Bearer TU_API_KEY</code>
            </li>
            <li>
              Agrega el atajo al widget de <strong>Atajos</strong> en tu home
              screen
            </li>
          </ol>
        </div>

        {apiKey && (
          <div className="mt-4 bg-brand-cream rounded-lg p-3 border border-brand-tan text-xs">
            <p className="font-semibold text-brand-dark mb-1">Tu URL base:</p>
            <code className="text-accent break-all">
              {APP_URL}/api/quick-entry
            </code>
            <p className="font-semibold text-brand-dark mt-2 mb-1">
              Tu header de autenticación:
            </p>
            <code className="text-accent break-all">
              Authorization: Bearer {apiKey}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
