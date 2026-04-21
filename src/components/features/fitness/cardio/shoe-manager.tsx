"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Archive } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";
import { shoeHealth, type ShoeHealth } from "@/lib/fitness/cardio";

interface Shoe {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  currentKm: number;
  maxKm: number;
  retired: boolean;
  retiredAt: string | null;
  notes: string | null;
}

const STATUS_LABEL: Record<ShoeHealth["status"], { label: string; color: string }> = {
  new:          { label: "Nueva",              color: "text-info" },
  good:         { label: "En uso",             color: "text-success" },
  aging:        { label: "Desgaste moderado",  color: "text-brand-dark" },
  retire_soon:  { label: "Retirar pronto",     color: "text-warning" },
  over:         { label: "Pasada del tope",    color: "text-danger" },
  retired:      { label: "Retirada",           color: "text-brand-warm" },
};

export default function ShoeManager() {
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMaxKm, setNewMaxKm] = useState("800");

  async function refresh() {
    setLoading(true);
    try {
      const data = await api.get<Shoe[]>("/fitness/shoes?includeRetired=true");
      setShoes(data);
    } catch {
      toast.error("No se pudieron cargar las zapatillas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createShoe() {
    if (!newName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    try {
      await api.post("/fitness/shoes", {
        name: newName.trim(),
        maxKm: Math.max(50, parseInt(newMaxKm, 10) || 800),
      });
      setNewName("");
      setNewMaxKm("800");
      setAdding(false);
      refresh();
      toast.success("Zapatilla agregada");
    } catch {
      toast.error("No se pudo crear");
    }
  }

  async function toggleRetire(shoe: Shoe) {
    try {
      await api.patch(`/fitness/shoes/${shoe.id}`, { retired: !shoe.retired });
      refresh();
    } catch {
      toast.error("No se pudo actualizar");
    }
  }

  async function remove(shoe: Shoe) {
    if (!confirm(`¿Eliminar "${shoe.name}"?`)) return;
    try {
      await api.delete(`/fitness/shoes/${shoe.id}`);
      refresh();
      toast.success("Eliminada");
    } catch {
      toast.error("No se pudo eliminar");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-serif text-base text-brand-dark m-0">
              Tus zapatillas
            </h3>
            <p className="text-brand-warm text-xs m-0 mt-1">
              El kilometraje se suma automáticamente cuando asignas una zapatilla a
              una sesión de running.
            </p>
          </div>
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:opacity-90 transition"
          >
            <Plus size={14} /> {adding ? "Cancelar" : "Agregar"}
          </button>
        </div>

        {adding && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
                Nombre
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nike Pegasus 41"
                className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
                Vida útil (km)
              </label>
              <input
                type="number"
                value={newMaxKm}
                onChange={(e) => setNewMaxKm(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
              />
            </div>
            <button
              onClick={createShoe}
              className="sm:col-span-3 py-2 rounded-button bg-brand-dark text-brand-cream font-semibold text-sm hover:bg-brand-brown transition"
            >
              Crear
            </button>
          </div>
        )}
      </Card>

      {loading ? (
        <Card variant="default" padding="md" className="border-brand-light-tan text-center text-brand-warm text-sm">
          Cargando…
        </Card>
      ) : shoes.length === 0 ? (
        <Card variant="default" padding="md" className="border-brand-light-tan text-center">
          <p className="text-brand-dark font-semibold m-0">Sin zapatillas todavía</p>
          <p className="text-brand-warm text-xs mt-1 m-0">
            Agrega tu primer par para tracking de kilometraje.
          </p>
        </Card>
      ) : (
        shoes.map((s) => {
          const health = shoeHealth(s.currentKm, s.maxKm, s.retired);
          const pct = Math.min(100, health.usagePct * 100);
          return (
            <Card key={s.id} variant="default" padding="md" className="border-brand-light-tan">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h4 className="font-serif text-base text-brand-dark m-0">
                    {s.name}
                    {s.retired && (
                      <span className="text-xs text-brand-warm ml-2">(retirada)</span>
                    )}
                  </h4>
                  <p className={cn("text-xs m-0 mt-0.5", STATUS_LABEL[health.status].color)}>
                    {STATUS_LABEL[health.status].label} · {s.currentKm.toFixed(0)}/{s.maxKm.toFixed(0)} km
                    {!s.retired && health.remainingKm > 0 && (
                      <span className="text-brand-warm"> · quedan {Math.round(health.remainingKm)} km</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleRetire(s)}
                    className="p-2 rounded hover:bg-brand-cream text-brand-warm"
                    title={s.retired ? "Reactivar" : "Retirar"}
                  >
                    <Archive size={16} />
                  </button>
                  <button
                    onClick={() => remove(s)}
                    className="p-2 rounded hover:bg-danger-light hover:text-danger text-brand-warm"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full h-2 rounded-full bg-brand-light-cream overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      health.status === "over" || health.status === "retire_soon"
                        ? "bg-warning"
                        : health.status === "retired"
                          ? "bg-brand-warm"
                          : "bg-success",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {s.notes && <p className="mt-2 text-xs text-brand-warm italic m-0">{s.notes}</p>}
            </Card>
          );
        })
      )}
    </div>
  );
}
