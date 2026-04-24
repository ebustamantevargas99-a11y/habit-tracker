"use client";
import { todayLocal } from "@/lib/date/local";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  BookmarkPlus,
  BookMarked,
  CheckCircle2,
  PauseCircle,
  Plus,
  Trash2,
  Star,
  Loader2,
  X,
  BookOpenCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useReadingStore, type Book, type BookStatus } from "@/stores/reading-store";
import { cn, ErrorBanner } from "@/components/ui";
import AIExportButton from "@/components/features/ai-export/ai-export-button";

const STATUS_META: Record<
  BookStatus,
  { label: string; color: string; bgClass: string; icon: React.ElementType }
> = {
  reading:  { label: "Leyendo",        color: "text-accent",  bgClass: "bg-accent",     icon: BookOpen },
  want:     { label: "Quiero leer",    color: "text-info",    bgClass: "bg-info",       icon: BookmarkPlus },
  finished: { label: "Terminados",     color: "text-success", bgClass: "bg-success",    icon: CheckCircle2 },
  paused:   { label: "En pausa",       color: "text-warning", bgClass: "bg-warning",    icon: PauseCircle },
};

const TABS: BookStatus[] = ["reading", "want", "finished", "paused"];

export default function ReadingPage() {
  const {
    books,
    isLoaded,
    isLoading,
    error,
    clearError,
    initialize,
    createBook,
    updateBook,
    deleteBook,
    logSession,
  } = useReadingStore();

  const [activeTab, setActiveTab] = useState<BookStatus>("reading");

  useEffect(() => {
    initialize();
  }, [initialize]);

  const [showAddBook, setShowAddBook] = useState(false);
  const [logFor, setLogFor] = useState<Book | null>(null);

  const grouped = useMemo(() => {
    const m: Record<BookStatus, Book[]> = { reading: [], want: [], finished: [], paused: [] };
    for (const b of books) {
      if (m[b.status]) m[b.status].push(b);
    }
    return m;
  }, [books]);

  const stats = useMemo(() => {
    const finished = grouped.finished.length;
    const totalPages = books
      .filter((b) => b.status === "finished" && b.totalPages)
      .reduce((s, b) => s + (b.totalPages ?? 0), 0);
    const currentReading = grouped.reading.length;
    const want = grouped.want.length;
    return { finished, totalPages, currentReading, want };
  }, [books, grouped]);

  return (
    <div className="flex flex-col gap-6">
      <ErrorBanner error={error} onDismiss={clearError} />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-dark m-0">Lectura</h1>
          <p className="text-sm text-brand-warm mt-1">
            {stats.finished} terminados · {stats.currentReading} leyendo · {stats.totalPages.toLocaleString()} páginas
          </p>
        </div>
        <div className="flex gap-2">
          <AIExportButton
            scope="holistic"
            label="Analizar con IA"
            title="Análisis de lectura"
            variant="outline"
            size="md"
          />
          <button
            onClick={() => setShowAddBook(true)}
            className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown flex items-center gap-2"
          >
            <Plus size={14} /> Añadir libro
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Leyendo ahora" value={stats.currentReading} icon={<BookOpen size={18} />} />
        <StatCard label="Quiero leer" value={stats.want} icon={<BookmarkPlus size={18} />} />
        <StatCard label="Terminados" value={stats.finished} icon={<CheckCircle2 size={18} />} />
        <StatCard label="Páginas leídas" value={stats.totalPages.toLocaleString()} icon={<BookOpenCheck size={18} />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-brand-cream pb-0 overflow-x-auto">
        {TABS.map((t) => {
          const meta = STATUS_META[t];
          const count = grouped[t].length;
          const Icon = meta.icon;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 border-b-2 -mb-[2px] text-sm transition-colors duration-200 whitespace-nowrap",
                activeTab === t
                  ? "border-b-accent text-accent font-semibold"
                  : "border-b-transparent text-brand-medium font-normal hover:text-brand-dark"
              )}
            >
              <Icon size={15} />
              {meta.label}
              <span className="text-[11px] text-brand-warm">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading && !isLoaded ? (
        <div className="text-center py-12 text-brand-warm">
          <Loader2 size={20} className="animate-spin inline mr-2" />
          Cargando biblioteca…
        </div>
      ) : grouped[activeTab].length === 0 ? (
        <EmptyState
          status={activeTab}
          onAdd={() => setShowAddBook(true)}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {grouped[activeTab].map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onLog={() => setLogFor(book)}
              onDelete={() => {
                if (confirm(`¿Borrar "${book.title}"?`)) {
                  void deleteBook(book.id);
                  toast.success("Libro eliminado");
                }
              }}
              onChangeStatus={(status) => {
                void updateBook(book.id, { status });
                toast.success("Estado actualizado");
              }}
              onRate={(rating) => {
                void updateBook(book.id, { rating });
              }}
            />
          ))}
        </div>
      )}

      {showAddBook && (
        <AddBookModal
          onClose={() => setShowAddBook(false)}
          onSave={async (payload) => {
            const b = await createBook(payload);
            if (b) {
              toast.success(`"${b.title}" agregado`);
              setShowAddBook(false);
            }
          }}
        />
      )}

      {logFor && (
        <LogSessionModal
          book={logFor}
          onClose={() => setLogFor(null)}
          onSave={async (session) => {
            await logSession(logFor.id, session);
            toast.success("Sesión registrada");
            setLogFor(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-brand-warm">{label}</span>
        <span className="text-accent">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-brand-dark leading-none">{value}</div>
    </div>
  );
}

function EmptyState({
  status,
  onAdd,
}: {
  status: BookStatus;
  onAdd: () => void;
}) {
  const meta = STATUS_META[status];
  return (
    <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-12 text-center">
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-brand-warm-white flex items-center justify-center text-brand-warm">
        <BookMarked size={26} />
      </div>
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
        Aún no hay libros en &ldquo;{meta.label}&rdquo;
      </h3>
      <p className="text-sm text-brand-warm mb-4">
        Añade tu primer libro y empieza a trackear tu lectura.
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown inline-flex items-center gap-2"
      >
        <Plus size={14} /> Añadir libro
      </button>
    </div>
  );
}

function BookCard({
  book,
  onLog,
  onDelete,
  onChangeStatus,
  onRate,
}: {
  book: Book;
  onLog: () => void;
  onDelete: () => void;
  onChangeStatus: (status: BookStatus) => void;
  onRate: (rating: number) => void;
}) {
  const progress =
    book.totalPages && book.totalPages > 0
      ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
      : 0;

  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-5 hover:border-brand-light-tan transition">
      <div className="flex gap-4">
        <div className="shrink-0 w-16 h-24 rounded bg-gradient-to-br from-brand-medium to-brand-brown text-white flex items-center justify-center text-xs font-bold text-center p-2">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <BookOpen size={22} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-base font-semibold text-brand-dark m-0 line-clamp-2">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-xs text-brand-warm mt-0.5">{book.author}</p>
          )}
          {book.totalPages ? (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-brand-warm mb-1">
                <span>
                  {book.currentPage} / {book.totalPages}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-brand-cream rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-brand-warm mt-2 italic">
              Página {book.currentPage}
            </p>
          )}

          {book.status === "finished" && (
            <div className="flex items-center gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => onRate(n)}
                  className="p-0.5 text-brand-warm hover:text-accent transition"
                  title={`${n} estrella${n > 1 ? "s" : ""}`}
                >
                  <Star
                    size={14}
                    className={cn(
                      book.rating && n <= book.rating
                        ? "fill-accent text-accent"
                        : ""
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 gap-2">
        <div className="flex gap-1">
          {book.status !== "reading" && (
            <button
              onClick={() => onChangeStatus("reading")}
              className="px-2.5 py-1 text-xs rounded border border-brand-cream text-brand-medium hover:bg-accent/10 hover:border-accent hover:text-accent"
            >
              Leyendo
            </button>
          )}
          {book.status !== "finished" && (
            <button
              onClick={() => onChangeStatus("finished")}
              className="px-2.5 py-1 text-xs rounded border border-brand-cream text-brand-medium hover:bg-success/10 hover:border-success hover:text-success"
            >
              Terminado
            </button>
          )}
          {book.status === "reading" && (
            <button
              onClick={() => onChangeStatus("paused")}
              className="px-2.5 py-1 text-xs rounded border border-brand-cream text-brand-medium hover:bg-warning/10 hover:border-warning hover:text-warning"
            >
              Pausar
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {book.status === "reading" && (
            <button
              onClick={onLog}
              className="px-3 py-1 text-xs rounded bg-accent text-white font-semibold hover:bg-brand-brown"
            >
              + Sesión
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 text-brand-warm hover:text-danger hover:bg-danger-light/30 rounded"
            title="Borrar libro"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddBookModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: { title: string; author?: string; totalPages?: number; status: BookStatus }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [status, setStatus] = useState<BookStatus>("reading");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        author: author.trim() || undefined,
        totalPages: totalPages ? parseInt(totalPages, 10) : undefined,
        status,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-brand-cream">
          <h2 className="font-display text-xl font-semibold text-brand-dark m-0">
            Nuevo libro
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-brand-warm hover:bg-brand-cream rounded-full"
          >
            <X size={18} />
          </button>
        </header>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="Atomic Habits"
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Autor
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="James Clear"
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Total de páginas
            </label>
            <input
              type="number"
              min="1"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              placeholder="300"
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Estado
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TABS.map((s) => {
                const meta = STATUS_META[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      "px-2 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition",
                      status === s
                        ? `${meta.bgClass} text-white`
                        : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                    )}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <footer className="px-6 py-4 border-t border-brand-cream flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40"
          >
            {saving ? "Guardando…" : "Guardar libro"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function LogSessionModal({
  book,
  onClose,
  onSave,
}: {
  book: Book;
  onClose: () => void;
  onSave: (session: {
    date: string;
    pagesRead: number;
    minutes?: number;
    notes?: string;
  }) => Promise<void>;
}) {
  const [pagesRead, setPagesRead] = useState("");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const today = todayLocal();

  async function handleSave() {
    const p = parseInt(pagesRead, 10);
    if (!p || p <= 0) {
      toast.error("Ingresa cuántas páginas leíste");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        date: today,
        pagesRead: p,
        minutes: minutes ? parseInt(minutes, 10) : undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-brand-cream">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-dark m-0">
              Sesión de lectura
            </h2>
            <p className="text-xs text-brand-warm mt-0.5 truncate max-w-[280px]">
              {book.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-brand-warm hover:bg-brand-cream rounded-full"
          >
            <X size={18} />
          </button>
        </header>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Páginas leídas *
            </label>
            <input
              type="number"
              min="1"
              value={pagesRead}
              onChange={(e) => setPagesRead(e.target.value)}
              autoFocus
              placeholder="p.ej. 25"
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent font-mono"
            />
            <p className="text-[11px] text-brand-warm mt-1">
              Estás en página {book.currentPage}
              {book.totalPages ? ` / ${book.totalPages}` : ""}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Minutos (opcional)
            </label>
            <input
              type="number"
              min="1"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="p.ej. 30"
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent font-mono"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Notas rápidas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ideas clave, citas, preguntas…"
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>
        </div>
        <footer className="px-6 py-4 border-t border-brand-cream flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40"
          >
            {saving ? "Guardando…" : "Registrar sesión"}
          </button>
        </footer>
      </div>
    </div>
  );
}
