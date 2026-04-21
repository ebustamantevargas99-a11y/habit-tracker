"use client";

import { create } from "zustand";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookStatus = "reading" | "finished" | "want" | "paused";

export interface ReadingSession {
  id: string;
  bookId: string;
  date: string;
  pagesRead: number;
  minutes: number | null;
  notes: string | null;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  totalPages: number | null;
  currentPage: number;
  status: BookStatus;
  rating: number | null;
  coverUrl: string | null;
  genre: string | null;
  notes: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sessions?: ReadingSession[];
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ReadingState {
  books: Book[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;

  createBook: (input: Partial<Book> & { title: string }) => Promise<Book | null>;
  updateBook: (id: string, patch: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;

  logSession: (
    bookId: string,
    input: { date?: string; pagesRead?: number; minutes?: number | null; notes?: string | null }
  ) => Promise<void>;
  deleteSession: (sessionId: string, bookId: string) => Promise<void>;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  books: [],
  isLoaded: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    if (get().isLoaded || get().isLoading) return;
    await get().refresh();
  },

  refresh: async () => {
    set({ isLoading: true, error: null });
    try {
      const books = await api.get<Book[]>("/reading/books");
      set({ books, isLoaded: true, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error cargando libros";
      set({ error: msg, isLoading: false });
    }
  },

  createBook: async (input) => {
    try {
      const book = await api.post<Book>("/reading/books", input);
      set((s) => ({ books: [book, ...s.books] }));
      return book;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error creando libro";
      set({ error: msg });
      return null;
    }
  },

  updateBook: async (id, patch) => {
    try {
      const updated = await api.patch<Book>(`/reading/books/${id}`, patch);
      set((s) => ({
        books: s.books.map((b) => (b.id === id ? { ...b, ...updated } : b)),
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error actualizando";
      set({ error: msg });
    }
  },

  deleteBook: async (id) => {
    try {
      await api.delete(`/reading/books/${id}`);
      set((s) => ({ books: s.books.filter((b) => b.id !== id) }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error borrando";
      set({ error: msg });
    }
  },

  logSession: async (bookId, input) => {
    try {
      const session = await api.post<ReadingSession>(
        `/reading/books/${bookId}/sessions`,
        input
      );
      set((s) => ({
        books: s.books.map((b) => {
          if (b.id !== bookId) return b;
          const newPage = Math.min(
            b.totalPages ?? Number.MAX_SAFE_INTEGER,
            b.currentPage + (input.pagesRead ?? 0)
          );
          const completed =
            b.totalPages !== null && newPage >= b.totalPages && b.status !== "finished";
          return {
            ...b,
            currentPage: newPage,
            status: completed ? "finished" : b.status,
            finishedAt: completed ? session.date : b.finishedAt,
            startedAt: b.startedAt ?? session.date,
            sessions: [session, ...(b.sessions ?? [])],
          };
        }),
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error registrando sesión";
      set({ error: msg });
    }
  },

  deleteSession: async (sessionId, bookId) => {
    try {
      await api.delete(`/reading/sessions/${sessionId}`);
      set((s) => ({
        books: s.books.map((b) => {
          if (b.id !== bookId) return b;
          const removed = (b.sessions ?? []).find((x) => x.id === sessionId);
          return {
            ...b,
            currentPage: Math.max(0, b.currentPage - (removed?.pagesRead ?? 0)),
            sessions: (b.sessions ?? []).filter((x) => x.id !== sessionId),
          };
        }),
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error eliminando sesión";
      set({ error: msg });
    }
  },
}));
