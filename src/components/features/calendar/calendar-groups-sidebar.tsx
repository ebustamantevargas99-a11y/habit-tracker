"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";
import type { CalendarGroup } from "./types";

interface Props {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Llamado cada vez que cambia la lista (nuevo, edit, delete, toggle visible) */
  onGroupsChange: (groups: CalendarGroup[]) => void;
}

const PALETTE: string[] = [
  "#b8860b",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#6b7280",
];

export default function CalendarGroupsSidebar({
  collapsed,
  onToggleCollapsed,
  onGroupsChange,
}: Props) {
  const [groups, setGroups] = useState<CalendarGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const emittedRef = useRef<string>("");

  async function refresh() {
    setLoading(true);
    try {
      const list = await api.get<CalendarGroup[]>("/calendar/groups");
      setGroups(list);
    } catch {
      toast.error("Error cargando grupos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  // Emitir cambios al padre cuando la lista cambia de forma "real" (no en cada render)
  useEffect(() => {
    const sig = JSON.stringify(
      groups.map((g) => [g.id, g.visible, g.color, g.name]),
    );
    if (sig !== emittedRef.current) {
      emittedRef.current = sig;
      onGroupsChange(groups);
    }
  }, [groups, onGroupsChange]);

  async function createGroup() {
    if (!newName.trim()) {
      toast.error("Escribe un nombre");
      return;
    }
    try {
      const created = await api.post<CalendarGroup>("/calendar/groups", {
        name: newName.trim(),
        color: newColor,
      });
      setGroups((prev) => [...prev, created]);
      setNewName("");
      setNewColor(PALETTE[0]);
      setCreating(false);
      toast.success("Grupo creado");
    } catch {
      toast.error("No se pudo crear");
    }
  }

  async function toggleVisible(g: CalendarGroup) {
    // optimistic
    setGroups((prev) =>
      prev.map((x) => (x.id === g.id ? { ...x, visible: !x.visible } : x)),
    );
    try {
      await api.patch(`/calendar/groups/${g.id}`, { visible: !g.visible });
    } catch {
      toast.error("Error");
      setGroups((prev) =>
        prev.map((x) => (x.id === g.id ? { ...x, visible: g.visible } : x)),
      );
    }
  }

  function startEdit(g: CalendarGroup) {
    setEditingId(g.id);
    setEditName(g.name);
    setEditColor(g.color);
  }

  async function saveEdit() {
    if (!editingId) return;
    if (!editName.trim()) {
      toast.error("Nombre vacío");
      return;
    }
    try {
      const updated = await api.patch<CalendarGroup>(`/calendar/groups/${editingId}`, {
        name: editName.trim(),
        color: editColor,
      });
      setGroups((prev) => prev.map((g) => (g.id === editingId ? updated : g)));
      setEditingId(null);
      toast.success("Guardado");
    } catch {
      toast.error("Error");
    }
  }

  async function removeGroup(g: CalendarGroup) {
    if (
      !confirm(
        `¿Borrar calendario "${g.name}"? Los eventos de este grupo no se eliminan, solo pierden la asignación.`,
      )
    )
      return;
    try {
      await api.delete(`/calendar/groups/${g.id}`);
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
      toast.success("Borrado");
    } catch {
      toast.error("Error");
    }
  }

  const visibleCount = useMemo(
    () => groups.filter((g) => g.visible).length,
    [groups],
  );

  if (collapsed) {
    return (
      <div className="shrink-0 w-10 border-r border-brand-cream bg-brand-paper flex flex-col items-center py-3">
        <button
          onClick={onToggleCollapsed}
          className="p-2 rounded-button hover:bg-brand-cream text-brand-medium"
          title="Mostrar calendarios"
          aria-label="Mostrar sidebar de calendarios"
        >
          <ChevronRight size={16} />
        </button>
        <div className="mt-3 flex flex-col gap-1.5 items-center">
          {groups.slice(0, 8).map((g) => (
            <button
              key={g.id}
              onClick={() => toggleVisible(g)}
              className="w-3 h-3 rounded-full border border-transparent hover:border-brand-dark transition"
              style={{
                backgroundColor: g.visible ? g.color : "transparent",
                borderColor: g.visible ? g.color : g.color + "80",
              }}
              title={`${g.name} ${g.visible ? "✓" : "○"}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="shrink-0 w-[220px] border-r border-brand-cream bg-brand-paper flex flex-col">
      <header className="flex items-center justify-between px-3 py-2.5 border-b border-brand-cream">
        <div className="flex flex-col">
          <h3 className="font-serif text-sm font-semibold text-brand-dark m-0">
            Mis calendarios
          </h3>
          {groups.length > 0 && (
            <span className="text-[10px] text-brand-warm">
              {visibleCount} de {groups.length} visibles
            </span>
          )}
        </div>
        <button
          onClick={onToggleCollapsed}
          className="p-1 rounded hover:bg-brand-cream text-brand-warm"
          title="Ocultar sidebar"
          aria-label="Ocultar sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-3 py-4 text-xs text-brand-warm text-center">Cargando…</p>
        ) : groups.length === 0 && !creating ? (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-brand-warm m-0 mb-2">
              Todavía no tienes calendarios.
            </p>
            <p className="text-[11px] text-brand-tan m-0">
              Crea uno para agrupar tus eventos (p. ej. Trabajo, Proyectos, Salud).
            </p>
          </div>
        ) : (
          <ul className="flex flex-col py-1">
            {groups.map((g) => (
              <li key={g.id}>
                {editingId === g.id ? (
                  <EditGroupRow
                    name={editName}
                    color={editColor}
                    onChangeName={setEditName}
                    onChangeColor={setEditColor}
                    onCancel={() => setEditingId(null)}
                    onSave={saveEdit}
                  />
                ) : (
                  <GroupRow
                    group={g}
                    onToggle={() => toggleVisible(g)}
                    onEdit={() => startEdit(g)}
                    onDelete={() => removeGroup(g)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Create row */}
        {creating ? (
          <div className="border-t border-brand-cream">
            <EditGroupRow
              name={newName}
              color={newColor}
              onChangeName={setNewName}
              onChangeColor={setNewColor}
              onCancel={() => {
                setCreating(false);
                setNewName("");
              }}
              onSave={createGroup}
              isCreate
            />
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-warm hover:bg-brand-cream hover:text-brand-dark transition border-t border-brand-cream"
          >
            <Plus size={12} /> Nuevo calendario
          </button>
        )}
      </div>

      <footer className="px-3 py-2 border-t border-brand-cream text-[10px] text-brand-tan text-center">
        Eventos sin grupo siempre se muestran
      </footer>
    </aside>
  );
}

function GroupRow({
  group,
  onToggle,
  onEdit,
  onDelete,
}: {
  group: CalendarGroup;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 px-3 py-1.5 hover:bg-brand-cream transition">
      <button
        onClick={onToggle}
        className="shrink-0 w-4 h-4 rounded-[3px] border-2 flex items-center justify-center"
        style={{
          backgroundColor: group.visible ? group.color : "transparent",
          borderColor: group.color,
        }}
        title={group.visible ? "Ocultar" : "Mostrar"}
        aria-label={group.visible ? `Ocultar ${group.name}` : `Mostrar ${group.name}`}
      >
        {group.visible && <Check size={10} className="text-white" strokeWidth={3} />}
      </button>
      <span
        className={cn(
          "flex-1 text-xs truncate",
          group.visible ? "text-brand-dark" : "text-brand-warm",
        )}
      >
        {group.icon && <span className="mr-1">{group.icon}</span>}
        {group.name}
      </span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition">
        <button
          onClick={onEdit}
          className="p-1 rounded hover:bg-brand-warm-white text-brand-warm"
          aria-label="Editar"
          title="Editar"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-danger-light/40 hover:text-danger text-brand-warm"
          aria-label="Eliminar"
          title="Eliminar"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

function EditGroupRow({
  name,
  color,
  onChangeName,
  onChangeColor,
  onCancel,
  onSave,
  isCreate,
}: {
  name: string;
  color: string;
  onChangeName: (v: string) => void;
  onChangeColor: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
  isCreate?: boolean;
}) {
  return (
    <div className="px-3 py-2 flex flex-col gap-2 bg-brand-warm-white">
      <input
        autoFocus
        value={name}
        onChange={(e) => onChangeName(e.target.value)}
        placeholder={isCreate ? "Nombre del calendario" : "Nombre"}
        maxLength={80}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        className="w-full px-2 py-1 rounded border border-brand-cream bg-brand-paper text-xs text-brand-dark focus:outline-none focus:border-accent"
      />
      <div className="flex flex-wrap gap-1">
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => onChangeColor(c)}
            className={cn(
              "w-4 h-4 rounded-full border-2",
              color === c ? "border-brand-dark scale-125" : "border-transparent",
            )}
            style={{ backgroundColor: c }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
      <div className="flex justify-end gap-1.5">
        <button
          onClick={onCancel}
          className="px-2 py-0.5 rounded text-[11px] text-brand-warm hover:bg-brand-cream"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          className="px-2 py-0.5 rounded text-[11px] bg-accent text-white hover:bg-brand-brown"
        >
          {isCreate ? "Crear" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
