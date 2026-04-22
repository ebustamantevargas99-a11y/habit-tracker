"use client";
import { todayLocal } from "@/lib/date/local";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  Plus,
  Loader2,
  Calendar as CalendarIcon,
  Link2,
  CheckCircle2,
  Circle,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";

type Subtask = {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  orderIndex: number;
};

type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "todo" | "inProgress" | "done";
  priority: "low" | "medium" | "high" | null;
  dueDate: string | null;
  objectiveId: string | null;
  weight: number;
  orderIndex: number;
  subtasks: Subtask[];
};

type Project = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  description: string | null;
  status: string;
};

const COLUMNS: { id: Task["status"]; label: string; color: string }[] = [
  { id: "todo",       label: "Por hacer",   color: "border-t-brand-medium" },
  { id: "inProgress", label: "En progreso", color: "border-t-accent" },
  { id: "done",       label: "Listo",       color: "border-t-success" },
];

const PRIORITY_META: Record<string, { label: string; class: string }> = {
  high:   { label: "Alta",  class: "bg-danger/10 text-danger" },
  medium: { label: "Media", class: "bg-warning/10 text-warning" },
  low:    { label: "Baja",  class: "bg-info/10 text-info" },
};

export default function KanbanView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newProjectMode, setNewProjectMode] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const refreshProjects = useCallback(async () => {
    try {
      const data = await api.get<Project[]>("/productivity/projects");
      setProjects(data);
      if (!activeProjectId && data.length > 0) {
        setActiveProjectId(data[0].id);
      }
    } catch {
      toast.error("Error cargando proyectos");
    }
  }, [activeProjectId]);

  const refreshTasks = useCallback(async () => {
    if (!activeProjectId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<Task[]>(
        `/productivity/projects/${activeProjectId}/tasks`
      );
      setTasks(data);
    } catch {
      toast.error("Error cargando tareas");
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    void refreshTasks();
  }, [refreshTasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(e: DragEndEvent) {
    if (!e.over || !e.active) return;
    const taskId = e.active.id as string;
    const newStatus = e.over.id as Task["status"];
    if (!["todo", "inProgress", "done"].includes(newStatus)) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.patch(`/productivity/projects/${activeProjectId}/tasks`, {
        tasks: [{ id: taskId, status: newStatus }],
      });
    } catch {
      toast.error("Error moviendo tarea");
      await refreshTasks();
    }
  }

  async function createTask() {
    if (!newTaskTitle.trim() || !activeProjectId) return;
    try {
      const task = await api.post<Task>(
        `/productivity/projects/${activeProjectId}/tasks`,
        { title: newTaskTitle.trim(), status: "todo" }
      );
      setTasks((prev) => [...prev, { ...task, subtasks: [] }]);
      setNewTaskTitle("");
      toast.success("Tarea creada");
    } catch {
      toast.error("Error");
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) return;
    try {
      const p = await api.post<Project>("/productivity/projects", {
        name: newProjectName.trim(),
      });
      setProjects((prev) => [...prev, p]);
      setActiveProjectId(p.id);
      setNewProjectName("");
      setNewProjectMode(false);
      toast.success("Proyecto creado");
    } catch {
      toast.error("Error");
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("¿Borrar tarea?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.delete(`/productivity/projects/${activeProjectId}/tasks/${id}`);
    } catch {
      toast.error("Error");
      await refreshTasks();
    }
  }

  async function addSubtask(taskId: string, title: string) {
    if (!title.trim()) return;
    try {
      const sub = await api.post<Subtask>("/productivity/subtasks", {
        taskId,
        title: title.trim(),
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...t.subtasks, sub] } : t
        )
      );
    } catch {
      toast.error("Error");
    }
  }

  async function toggleSubtask(taskId: string, subId: string, completed: boolean) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subId ? { ...s, completed: !completed } : s
              ),
            }
          : t
      )
    );
    try {
      await api.patch(`/productivity/subtasks/${subId}`, { completed: !completed });
    } catch {
      toast.error("Error");
      await refreshTasks();
    }
  }

  async function deleteSubtask(taskId: string, subId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) } : t
      )
    );
    try {
      await api.delete(`/productivity/subtasks/${subId}`);
    } catch {
      toast.error("Error");
      await refreshTasks();
    }
  }

  const tasksByStatus = useMemo(() => {
    const m: Record<Task["status"], Task[]> = { todo: [], inProgress: [], done: [] };
    for (const t of tasks) {
      m[t.status].push(t);
    }
    return m;
  }, [tasks]);

  return (
    <div className="space-y-4">
      {/* Selector de proyectos */}
      <div className="flex items-center gap-2 flex-wrap">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveProjectId(p.id)}
            className={cn(
              "px-4 py-1.5 rounded-button text-sm font-medium transition flex items-center gap-2",
              activeProjectId === p.id
                ? "bg-accent text-white"
                : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
            )}
          >
            {p.emoji && <span>{p.emoji}</span>}
            {p.name}
          </button>
        ))}
        {newProjectMode ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void createProject();
                if (e.key === "Escape") {
                  setNewProjectMode(false);
                  setNewProjectName("");
                }
              }}
              placeholder="Nuevo proyecto..."
              className="px-3 py-1.5 rounded-button border border-accent bg-brand-paper text-brand-dark text-sm focus:outline-none"
            />
            <button
              onClick={createProject}
              className="px-3 py-1.5 rounded-button bg-accent text-white text-xs"
            >
              Crear
            </button>
          </div>
        ) : (
          <button
            onClick={() => setNewProjectMode(true)}
            className="px-3 py-1.5 rounded-button border border-brand-cream text-brand-warm text-xs hover:bg-brand-cream flex items-center gap-1"
          >
            <Plus size={12} /> Proyecto
          </button>
        )}
      </div>

      {!activeProjectId && !loading && (
        <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-12 text-center text-brand-warm">
          Crea tu primer proyecto para empezar.
        </div>
      )}

      {activeProjectId && (
        <>
          {/* Input nueva tarea */}
          <div className="flex gap-2">
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTask()}
              placeholder="+ Nueva tarea (enter)"
              className="flex-1 px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
            <button
              onClick={createTask}
              disabled={!newTaskTitle.trim()}
              className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown disabled:opacity-40"
            >
              Agregar
            </button>
          </div>

          {/* Kanban */}
          {loading ? (
            <div className="text-center py-12 text-brand-warm">
              <Loader2 size={20} className="inline animate-spin mr-2" />
              Cargando…
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    tasks={tasksByStatus[col.id]}
                    expandedTaskIds={expandedTaskIds}
                    onToggleExpand={(id) =>
                      setExpandedTaskIds((prev) => {
                        const n = new Set(prev);
                        if (n.has(id)) n.delete(id);
                        else n.add(id);
                        return n;
                      })
                    }
                    onDeleteTask={deleteTask}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtask}
                    onDeleteSubtask={deleteSubtask}
                  />
                ))}
              </div>
            </DndContext>
          )}

          <p className="text-[11px] text-brand-tan text-center">
            💡 Arrastra tareas entre columnas. Click en una tarea para ver/agregar subtareas.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────

function KanbanColumn({
  column,
  tasks,
  expandedTaskIds,
  onToggleExpand,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: {
  column: { id: Task["status"]; label: string; color: string };
  tasks: Task[];
  expandedTaskIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subId: string, completed: boolean) => void;
  onDeleteSubtask: (taskId: string, subId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-brand-paper border border-brand-cream rounded-xl p-3 border-t-4 min-h-[120px] transition",
        column.color,
        isOver && "ring-2 ring-accent ring-inset"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-sm font-semibold text-brand-dark m-0">
          {column.label}
        </h3>
        <span className="text-xs text-brand-warm font-mono">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            expanded={expandedTaskIds.has(t.id)}
            onToggleExpand={() => onToggleExpand(t.id)}
            onDelete={() => onDeleteTask(t.id)}
            onAddSubtask={(title) => onAddSubtask(t.id, title)}
            onToggleSubtask={(subId, completed) => onToggleSubtask(t.id, subId, completed)}
            onDeleteSubtask={(subId) => onDeleteSubtask(t.id, subId)}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  expanded,
  onToggleExpand,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: {
  task: Task;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onAddSubtask: (title: string) => void;
  onToggleSubtask: (subId: string, completed: boolean) => void;
  onDeleteSubtask: (subId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const [newSub, setNewSub] = useState("");

  const subsDone = task.subtasks.filter((s) => s.completed).length;
  const hasSubs = task.subtasks.length > 0;
  const isOverdue =
    task.dueDate && task.dueDate < todayLocal();
  const priorityMeta = task.priority ? PRIORITY_META[task.priority] : null;

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.4 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-brand-warm-white border border-brand-cream rounded-lg p-2.5 hover:shadow-warm transition"
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing pt-0.5 text-brand-tan hover:text-brand-medium"
          title="Arrastra para mover"
        >
          ⋮⋮
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-brand-dark font-medium break-words">
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {priorityMeta && (
              <span
                className={cn(
                  "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                  priorityMeta.class
                )}
              >
                {priorityMeta.label}
              </span>
            )}
            {task.dueDate && (
              <span
                className={cn(
                  "text-[10px] flex items-center gap-0.5",
                  isOverdue ? "text-danger font-semibold" : "text-brand-warm"
                )}
              >
                <CalendarIcon size={10} /> {task.dueDate.slice(5)}
              </span>
            )}
            {task.objectiveId && (
              <span className="text-[10px] text-info flex items-center gap-0.5">
                <Link2 size={10} /> OKR
              </span>
            )}
            {hasSubs && (
              <span className="text-[10px] text-brand-warm">
                {subsDone}/{task.subtasks.length} ✓
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onToggleExpand}
            className="p-1 text-brand-warm hover:text-accent hover:bg-brand-cream rounded"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-brand-warm hover:text-danger hover:bg-danger-light/30 rounded"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-brand-cream space-y-1.5">
          {task.subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-2 group">
              <button
                onClick={() => onToggleSubtask(s.id, s.completed)}
                className="shrink-0 text-brand-warm hover:text-success"
              >
                {s.completed ? (
                  <CheckCircle2 size={14} className="text-success" />
                ) : (
                  <Circle size={14} />
                )}
              </button>
              <span
                className={cn(
                  "text-xs text-brand-dark flex-1 break-words",
                  s.completed && "line-through text-brand-warm"
                )}
              >
                {s.title}
              </span>
              <button
                onClick={() => onDeleteSubtask(s.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-brand-warm hover:text-danger"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          <div className="flex gap-1 mt-2">
            <input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onAddSubtask(newSub);
                  setNewSub("");
                }
              }}
              placeholder="+ Subtarea"
              className="flex-1 px-2 py-1 rounded border border-brand-cream text-xs focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
