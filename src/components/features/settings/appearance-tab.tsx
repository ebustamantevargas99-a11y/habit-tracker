"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUserStore } from "@/stores/user-store";
import { api } from "@/lib/api-client";
import Link from "next/link";

export default function AppearanceTab() {
  const { user, setDarkMode, saveProfile, isSaving } = useUserStore();
  const [darkOn, setDarkOn] = useState(false);
  const [language, setLanguage] = useState("es");
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [quietAuto, setQuietAuto] = useState(true);
  const [quietForced, setQuietForced] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setDarkOn(user.profile.darkMode ?? false);
      setLanguage(user.profile.language ?? "es");
      setUnits((user.profile.units as "metric" | "imperial") ?? "metric");
    }
    // Load quiet mode settings
    api
      .get<{ quietModeAuto?: boolean; quietModeForced?: boolean }>("/user/quiet-mode")
      .then((data) => {
        if (data.quietModeAuto !== undefined) setQuietAuto(data.quietModeAuto);
        if (data.quietModeForced !== undefined) setQuietForced(data.quietModeForced);
      })
      .catch(() => {});
  }, [user?.profile]);

  async function toggleQuietAuto() {
    const next = !quietAuto;
    setQuietAuto(next);
    try {
      await api.patch("/user/quiet-mode", { quietModeAuto: next });
      toast.success(next ? "Detección automática activada" : "Detección desactivada");
    } catch {
      toast.error("Error");
      setQuietAuto(!next);
    }
  }

  async function toggleQuietForced() {
    const next = !quietForced;
    setQuietForced(next);
    try {
      await api.patch("/user/quiet-mode", { quietModeForced: next });
      toast.success(next ? "Quiet mode activado manualmente" : "Quiet mode manual desactivado");
    } catch {
      toast.error("Error");
      setQuietForced(!next);
    }
  }

  async function toggleDark() {
    const next = !darkOn;
    setDarkOn(next);
    try {
      await setDarkMode(next);
      toast.success(next ? "Modo oscuro activado" : "Modo claro activado");
    } catch {
      toast.error("Error guardando preferencia");
      setDarkOn(!next);
    }
  }

  async function saveLocale() {
    try {
      await saveProfile({ language, units });
      toast.success("Preferencias guardadas");
    } catch {
      toast.error("Error guardando");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
        <h3 className="font-serif text-brand-dark text-xl m-0 mb-4">Apariencia</h3>

        <div className="flex items-center justify-between py-3 border-b border-brand-light-cream">
          <div>
            <p className="text-sm font-semibold text-brand-dark">Modo oscuro</p>
            <p className="text-xs text-brand-warm mt-0.5">
              Cambia el tema a colores invertidos, mejor para la noche.
            </p>
          </div>
          <button
            onClick={toggleDark}
            disabled={isSaving}
            className={`relative w-12 h-7 rounded-full transition ${
              darkOn ? "bg-accent" : "bg-brand-cream"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-warm transition-all ${
                darkOn ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-brand-light-cream">
          <div>
            <p className="text-sm font-semibold text-brand-dark">Idioma</p>
            <p className="text-xs text-brand-warm mt-0.5">
              Idioma de la interfaz. Los textos de tus datos no cambian.
            </p>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2 rounded-md border border-brand-tan bg-brand-cream text-brand-dark text-sm"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-semibold text-brand-dark">Unidades</p>
            <p className="text-xs text-brand-warm mt-0.5">
              Métrico (kg / cm / km) o Imperial (lb / in / mi). Tus datos se guardan
              siempre en métrico — cambiar aquí solo cambia cómo se muestran.
            </p>
          </div>
          <div className="flex gap-1">
            {(["metric", "imperial"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnits(u)}
                className={`px-4 py-2 rounded-md text-sm transition ${
                  units === u
                    ? "bg-accent text-white"
                    : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                }`}
              >
                {u === "metric" ? "Métrico" : "Imperial"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={saveLocale}
          disabled={isSaving}
          className="mt-4 px-6 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm disabled:opacity-40 hover:bg-brand-brown transition"
        >
          {isSaving ? "Guardando…" : "Guardar idioma y unidades"}
        </button>
      </div>

      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
        <h3 className="font-serif text-brand-dark text-xl m-0 mb-2">🤍 Quiet Mode</h3>
        <p className="text-sm text-brand-warm mb-4">
          Cuando detectamos mood bajo consistente (avg &lt; 5 en 7 días), ocultamos
          métricas de performance y mostramos un mensaje amable. Prioriza descanso
          sobre logros.
        </p>

        <div className="flex items-center justify-between py-3 border-b border-brand-light-cream">
          <div>
            <p className="text-sm font-semibold text-brand-dark">Detección automática</p>
            <p className="text-xs text-brand-warm mt-0.5">
              Activa quiet mode si detectamos mood bajo 3+ días en la última semana.
            </p>
          </div>
          <button
            onClick={toggleQuietAuto}
            className={`relative w-12 h-7 rounded-full transition ${
              quietAuto ? "bg-accent" : "bg-brand-cream"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-warm transition-all ${
                quietAuto ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-semibold text-brand-dark">Forzar manualmente</p>
            <p className="text-xs text-brand-warm mt-0.5">
              Activa quiet mode ahora, ignorando la detección automática.
            </p>
          </div>
          <button
            onClick={toggleQuietForced}
            className={`relative w-12 h-7 rounded-full transition ${
              quietForced ? "bg-accent" : "bg-brand-cream"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-warm transition-all ${
                quietForced ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
        <h3 className="font-serif text-brand-dark text-xl m-0 mb-2">Editar perfil completo</h3>
        <p className="text-sm text-brand-warm m-0 mb-4">
          Modifica edad, sexo, altura, peso, nivel de actividad, intereses y metas.
        </p>
        <Link
          href="/onboarding"
          className="inline-block px-6 py-2.5 rounded-lg bg-brand-brown text-white font-semibold text-sm hover:bg-brand-dark transition"
        >
          Volver al cuestionario →
        </Link>
      </div>
    </div>
  );
}
