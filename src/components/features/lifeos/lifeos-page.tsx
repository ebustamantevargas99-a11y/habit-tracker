"use client";

import { useEffect, useState } from "react";
import {
  Sunrise,
  Sunset,
  PenSquare,
  Target,
  Clock,
  Siren,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/components/ui";
import MorningRitualPanel from "./morning-ritual-panel";
import EveningRitualPanel from "./evening-ritual-panel";
import JournalPanel from "./journal-panel";
import TimeCapsulePanel from "./time-capsule-panel";
import FocusPanel from "./focus-panel";
import EmergencyPanel from "./emergency-panel";

const TABS = [
  { id: "morning",   label: "Mañana",     icon: Sunrise,    color: "text-accent" },
  { id: "evening",   label: "Noche",      icon: Sunset,     color: "text-brand-medium" },
  { id: "focus",     label: "Deep Work",  icon: Target,     color: "text-info" },
  { id: "journal",   label: "Journal",    icon: PenSquare,  color: "text-success" },
  { id: "capsule",   label: "Cápsula",    icon: Clock,      color: "text-warning" },
  { id: "emergency", label: "Emergencia", icon: Siren,      color: "text-danger" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function LifeOSPage() {
  const [activeTab, setActiveTab] = useState<TabId>("morning");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="text-center py-12 text-brand-warm">
        <Loader2 size={20} className="inline animate-spin mr-2" />
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-dark m-0 flex items-center gap-2">
          <Sparkles size={22} className="text-accent" />
          Life OS
        </h1>
        <p className="text-sm text-brand-warm mt-1">
          Rituales diarios, deep work, journal, cápsula del tiempo y tarjeta de emergencia.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-brand-cream overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-[2px] text-sm transition-colors duration-200 whitespace-nowrap",
                activeTab === t.id
                  ? "border-b-accent text-accent font-semibold"
                  : "border-b-transparent text-brand-medium font-normal hover:text-brand-dark"
              )}
            >
              <Icon size={15} className={activeTab === t.id ? "text-accent" : t.color} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "morning" && <MorningRitualPanel />}
      {activeTab === "evening" && <EveningRitualPanel />}
      {activeTab === "focus" && <FocusPanel />}
      {activeTab === "journal" && <JournalPanel />}
      {activeTab === "capsule" && <TimeCapsulePanel />}
      {activeTab === "emergency" && <EmergencyPanel />}
    </div>
  );
}
