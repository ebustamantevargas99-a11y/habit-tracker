"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUserStore } from "@/stores/user-store";
import Link from "next/link";
import ThemeSelector from "./theme-selector";

export default function AppearanceTab() {
  const { user, setDarkMode, saveProfile, isSaving } = useUserStore();
  const [darkOn, setDarkOn] = useState(false);
  const [units, setUnits] = useState<"metric" | "imperial">("metric");

  useEffect(() => {
    if (user?.profile) {
      setDarkOn(user.profile.darkMode ?? false);
      setUnits((user.profile.units as "metric" | "imperial") ?? "metric");
    }
  }, [user?.profile]);

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

  async function saveUnits() {
    try {
      // Idioma queda fijo en español durante la beta — multi-idioma viene
      // en una versión futura con i18n real (next-intl).
      await saveProfile({ language: "es", units });
      toast.success("Unidades guardadas");
    } catch {
      toast.error("Error guardando");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Selector de tema visual (9 paletas + tipografía themeable) */}
      <ThemeSelector />

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

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-semibold text-brand-dark">Idioma</p>
            <p className="text-xs text-brand-warm mt-0.5">
              La app está disponible en español durante la beta.
              Multi-idioma (inglés/portugués) viene en una versión futura.
            </p>
          </div>
          <div className="px-4 py-2 rounded-md border border-brand-light-tan bg-brand-cream text-brand-medium text-sm">
            🇲🇽 Español
          </div>
        </div>

        <button
          onClick={saveUnits}
          disabled={isSaving}
          className="mt-4 px-6 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm disabled:opacity-40 hover:bg-brand-brown transition"
        >
          {isSaving ? "Guardando…" : "Guardar unidades"}
        </button>
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
