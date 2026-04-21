"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { fireConfettiCelebration } from "@/lib/celebrations/confetti";

/**
 * Modal grande de celebración al cruzar un hito (7/21/66/92/100/365/...)
 */
export default function RootedCelebrationModal({
  habitName,
  habitIcon,
  milestone,
  onClose,
}: {
  habitName: string;
  habitIcon: string;
  milestone: number;
  onClose: () => void;
}) {
  useEffect(() => {
    fireConfettiCelebration();
    const again = setTimeout(() => fireConfettiCelebration(), 800);
    return () => clearTimeout(again);
  }, []);

  const isRooted = milestone === 92;
  const isBeyondRooted = milestone > 92;

  const milestoneMeta: Record<number, { title: string; subtitle: string; emoji: string; color: string }> = {
    7:    { title: "¡Primer hito!",          subtitle: "Una semana consecutiva. Has iniciado algo.",                 emoji: "🌱", color: "from-accent-glow to-accent-light" },
    21:   { title: "¡Formándose!",           subtitle: "3 semanas. El hábito empieza a sentirse natural.",           emoji: "🌿", color: "from-accent-light to-accent" },
    66:   { title: "¡Fortaleciéndose!",       subtitle: "66 días. Científicamente el umbral para formar hábitos.",   emoji: "🌳", color: "from-accent to-brand-brown" },
    92:   { title: "¡ARRAIGADO!",            subtitle: "92 días. Este hábito es parte de ti ahora.",                  emoji: "🏆", color: "from-brand-brown to-success" },
    100:  { title: "100 días arraigados",    subtitle: "Triple dígito. Inspirador.",                                  emoji: "💯", color: "from-success to-brand-brown" },
    365:  { title: "¡UN AÑO ENTERO!",        subtitle: "365 días consecutivos. Leyenda.",                             emoji: "👑", color: "from-success to-accent" },
    500:  { title: "500 días",               subtitle: "Estás en otra dimensión de consistencia.",                    emoji: "💎", color: "from-success to-accent-glow" },
    1000: { title: "¡MIL DÍAS!",             subtitle: "Eres parte del 0.01% de humanos más consistentes.",           emoji: "🌟", color: "from-success to-brand-dark" },
  };

  const meta = milestoneMeta[milestone] ?? {
    title: `${milestone} días`,
    subtitle: "Nueva marca personal.",
    emoji: "🎉",
    color: "from-accent to-brand-brown",
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-3xl w-full max-w-md shadow-warm-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`relative bg-gradient-to-br ${meta.color} text-white p-8 text-center`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-white/70 hover:bg-white/10 rounded-full"
          >
            <X size={16} />
          </button>
          <div className="text-7xl mb-3 animate-bounce">{meta.emoji}</div>
          <h1 className="font-display text-3xl font-bold m-0 mb-2">{meta.title}</h1>
          <p className="text-sm opacity-90">{meta.subtitle}</p>
        </div>

        <div className="p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-brand-warm mb-1">
            {isRooted || isBeyondRooted ? "Hábito arraigado" : "Hábito"}
          </p>
          <p className="font-serif text-xl font-semibold text-brand-dark">
            {habitIcon} {habitName}
          </p>

          {isRooted && (
            <div className="mt-5 bg-success/10 rounded-xl p-4 text-left">
              <p className="text-sm text-brand-dark font-semibold mb-2">
                🎖️ Se agregó a tu Timeline
              </p>
              <p className="text-xs text-brand-warm">
                Este momento quedó registrado como un hito en tu recorrido personal. Lo verás en el Year Review y en Life OS → Timeline.
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full px-5 py-3 rounded-button bg-accent text-white text-sm font-bold hover:bg-brand-brown"
          >
            Seguir construyendo 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
