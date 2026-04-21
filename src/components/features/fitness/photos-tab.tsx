"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, X, GitCompare } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";

type BodyPhoto = {
  id: string;
  date: string;
  category: "front" | "side" | "back";
  photoData: string;
  weight: number | null;
  notes: string | null;
  createdAt: string;
};

const CATEGORIES: { id: "front" | "side" | "back"; label: string }[] = [
  { id: "front", label: "Frente" },
  { id: "side", label: "Lado" },
  { id: "back", label: "Espalda" },
];

async function resizeImage(file: File, maxSize = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotosTab() {
  const [photos, setPhotos] = useState<BodyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<"front" | "side" | "back">("front");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [viewer, setViewer] = useState<BodyPhoto | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<BodyPhoto[]>("/fitness/body-photos?limit=200");
      setPhotos(data);
    } catch {
      toast.error("Error cargando fotos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(
    () => photos.filter((p) => p.category === category),
    [photos, category]
  );

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Imagen muy grande (máx 20MB)");
      return;
    }
    setUploading(true);
    try {
      const dataUri = await resizeImage(file, 1200, 0.82);
      const photo = await api.post<BodyPhoto>("/fitness/body-photos", {
        photoData: dataUri,
        category,
      });
      setPhotos((prev) => [photo, ...prev]);
      toast.success("Foto subida");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast.error("Error subiendo foto");
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm("¿Borrar esta foto?")) return;
    try {
      await api.delete(`/fitness/body-photos/${id}`);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      if (compareA === id) setCompareA(null);
      if (compareB === id) setCompareB(null);
      toast.success("Borrada");
    } catch {
      toast.error("Error");
    }
  }

  function togglePhotoInCompare(id: string) {
    if (compareA === id) {
      setCompareA(null);
    } else if (compareB === id) {
      setCompareB(null);
    } else if (!compareA) {
      setCompareA(id);
    } else if (!compareB) {
      setCompareB(id);
    } else {
      setCompareA(id);
      setCompareB(null);
    }
  }

  const a = photos.find((p) => p.id === compareA);
  const b = photos.find((p) => p.id === compareB);

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition",
                category === c.id
                  ? "bg-accent text-white"
                  : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
              )}
            >
              {c.label}{" "}
              <span className="opacity-70">
                ({photos.filter((p) => p.category === c.id).length})
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCompareMode((v) => !v);
              if (compareMode) {
                setCompareA(null);
                setCompareB(null);
              }
            }}
            className={cn(
              "px-3 py-2 rounded-button text-xs font-semibold flex items-center gap-1.5",
              compareMode
                ? "bg-accent text-white"
                : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
            )}
          >
            <GitCompare size={14} /> Comparar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown disabled:opacity-40 flex items-center gap-2"
          >
            {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
            Subir foto
          </button>
        </div>
      </div>

      {/* Comparador */}
      {compareMode && a && b && (
        <div className="bg-brand-paper border border-accent rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            {[a, b].map((p) => (
              <div key={p.id}>
                <p className="text-xs text-brand-warm mb-2 text-center font-semibold uppercase tracking-widest">
                  {new Date(p.date).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {p.weight && ` · ${p.weight}kg`}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photoData}
                  alt={p.date}
                  className="w-full rounded-lg shadow-warm"
                />
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-brand-warm mt-3">
            {Math.abs(
              Math.ceil(
                (new Date(b.date).getTime() - new Date(a.date).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )}{" "}
            días de diferencia
          </p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-12 text-center text-brand-warm">
          Sin fotos en &ldquo;{CATEGORIES.find((c) => c.id === category)?.label}&rdquo;.
          Sube tu primera.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((p) => {
            const isSelected = compareA === p.id || compareB === p.id;
            return (
              <div
                key={p.id}
                className={cn(
                  "relative bg-brand-paper border rounded-xl overflow-hidden cursor-pointer group",
                  isSelected
                    ? "border-accent ring-2 ring-accent/40"
                    : "border-brand-cream hover:border-accent/50"
                )}
                onClick={() => (compareMode ? togglePhotoInCompare(p.id) : setViewer(p))}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photoData}
                  alt={p.date}
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-[11px] text-white font-mono">{p.date}</p>
                </div>
                {!compareMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void deletePhoto(p.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                {isSelected && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-accent text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {compareA === p.id ? "A" : "B"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Viewer fullscreen */}
      {viewer && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewer(null)}
        >
          <button
            onClick={() => setViewer(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewer.photoData}
            alt={viewer.date}
            className="max-h-[90vh] max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
