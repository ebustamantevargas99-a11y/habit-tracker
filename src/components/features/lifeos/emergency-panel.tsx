"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Siren, Plus, Trash2, Copy, Loader2, QrCode } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";

type EmergencyCard = {
  bloodType: string | null;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
  notes: string | null;
  shareToken: string | null;
  shareExpiresAt: string | null;
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function EmergencyPanel() {
  const [card, setCard] = useState<EmergencyCard>({
    bloodType: null,
    allergies: [],
    conditions: [],
    medications: [],
    emergencyName: null,
    emergencyPhone: null,
    emergencyRelation: null,
    notes: null,
    shareToken: null,
    shareExpiresAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<EmergencyCard | null>("/lifeos/emergency");
      if (data) setCard(data);
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function save(patch: Partial<EmergencyCard>) {
    const next = { ...card, ...patch };
    setCard(next);
    setSaving(true);
    try {
      await api.put<EmergencyCard>("/lifeos/emergency", patch);
    } catch {
      toast.error("Error guardando");
    } finally {
      setSaving(false);
    }
  }

  async function generateShareLink() {
    try {
      const res = await api.post<{ url: string; token: string; expiresAt: string }>(
        "/lifeos/emergency/share",
        { hours: 24 }
      );
      setCard((prev) => ({ ...prev, shareToken: res.token, shareExpiresAt: res.expiresAt }));
      const fullUrl = `${window.location.origin}${res.url}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success("🔗 Enlace copiado al portapapeles · válido 24h");
    } catch {
      toast.error("Error generando enlace");
    }
  }

  async function revokeShareLink() {
    try {
      await api.delete("/lifeos/emergency/share");
      setCard((prev) => ({ ...prev, shareToken: null, shareExpiresAt: null }));
      toast.success("Enlace revocado");
    } catch {
      toast.error("Error");
    }
  }

  function copyShareLink() {
    if (!card.shareToken) return;
    const url = `${window.location.origin}/emergency/${card.shareToken}`;
    void navigator.clipboard.writeText(url);
    toast.success("Copiado");
  }

  if (loading) {
    return (
      <div className="text-center py-10 text-brand-warm">
        <Loader2 size={20} className="inline animate-spin mr-2" />
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-danger/20 to-brand-paper border border-brand-cream rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Siren size={22} className="text-danger mt-0.5" />
          <div>
            <h2 className="font-display text-xl font-bold text-brand-dark m-0">
              Tarjeta médica de emergencia
            </h2>
            <p className="text-xs text-brand-warm mt-0.5">
              Información crítica para compartir con paramédicos o médicos si algo te pasa.
              Solo visible cuando generas un enlace temporal.
            </p>
          </div>
          {saving && <span className="text-[11px] text-brand-tan ml-auto">guardando…</span>}
        </div>
      </div>

      {/* Share link */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-3 flex items-center gap-2">
          <QrCode size={18} /> Compartir
        </h3>
        {card.shareToken && card.shareExpiresAt ? (
          <div className="space-y-3">
            <div className="bg-brand-warm-white rounded-lg p-3">
              <p className="text-xs text-brand-warm mb-1">Enlace activo (válido hasta:</p>
              <p className="text-sm font-mono text-brand-dark">
                {new Date(card.shareExpiresAt).toLocaleString("es-MX")})
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyShareLink}
                className="flex-1 px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown flex items-center justify-center gap-2"
              >
                <Copy size={14} /> Copiar enlace
              </button>
              <button
                onClick={revokeShareLink}
                className="px-4 py-2 rounded-button border border-danger text-danger text-sm font-semibold hover:bg-danger hover:text-white"
              >
                Revocar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={generateShareLink}
            className="w-full px-4 py-2.5 rounded-button bg-danger text-white font-semibold hover:bg-danger/90 flex items-center justify-center gap-2"
          >
            <Siren size={14} /> Generar enlace temporal (24h)
          </button>
        )}
      </div>

      {/* Blood type */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2 block">
          Tipo de sangre
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {BLOOD_TYPES.map((b) => (
            <button
              key={b}
              onClick={() => void save({ bloodType: card.bloodType === b ? null : b })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition",
                card.bloodType === b
                  ? "bg-danger text-white"
                  : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <ListField
        label="Alergias"
        items={card.allergies}
        placeholder="p.ej. penicilina, mariscos…"
        onChange={(items) => void save({ allergies: items })}
      />
      <ListField
        label="Condiciones médicas"
        items={card.conditions}
        placeholder="p.ej. asma, diabetes tipo 2…"
        onChange={(items) => void save({ conditions: items })}
      />
      <ListField
        label="Medicamentos habituales"
        items={card.medications}
        placeholder="p.ej. metformina 500mg, atorvastatina…"
        onChange={(items) => void save({ medications: items })}
      />

      {/* Contacto */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-3">
          Contacto de emergencia
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={card.emergencyName ?? ""}
            onChange={(e) => setCard({ ...card, emergencyName: e.target.value })}
            onBlur={(e) => void save({ emergencyName: e.target.value || null })}
            placeholder="Nombre"
            className="px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />
          <input
            type="text"
            value={card.emergencyRelation ?? ""}
            onChange={(e) => setCard({ ...card, emergencyRelation: e.target.value })}
            onBlur={(e) => void save({ emergencyRelation: e.target.value || null })}
            placeholder="Relación (mamá, pareja, etc.)"
            className="px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <input
          type="tel"
          value={card.emergencyPhone ?? ""}
          onChange={(e) => setCard({ ...card, emergencyPhone: e.target.value })}
          onBlur={(e) => void save({ emergencyPhone: e.target.value || null })}
          placeholder="Teléfono con código de país"
          className="mt-3 w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2 block">
          Notas adicionales
        </label>
        <textarea
          value={card.notes ?? ""}
          onChange={(e) => setCard({ ...card, notes: e.target.value })}
          onBlur={(e) => void save({ notes: e.target.value || null })}
          rows={3}
          placeholder="Donador de órganos, marcapasos, lentes, etc."
          className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent resize-none"
        />
      </div>
    </div>
  );
}

function ListField({
  label,
  items,
  placeholder,
  onChange,
}: {
  label: string;
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
}) {
  const [input, setInput] = useState("");
  function add() {
    if (!input.trim() || items.length >= 30) return;
    onChange([...items, input.trim()]);
    setInput("");
  }
  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
      <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2 block">
        {label}
      </label>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 bg-brand-cream px-3 py-1 rounded-full text-xs text-brand-dark"
          >
            {item}
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-brand-warm hover:text-danger"
            >
              <Trash2 size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
        />
        <button
          onClick={add}
          className="px-3 py-2 rounded-button bg-accent text-white text-sm hover:bg-brand-brown"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
