'use client';

import React, { useState } from 'react';
import { cn } from '@/components/ui';
import { Card } from '@/components/ui';

interface ProgressPhoto {
  id: string;
  date: string;
  label: string;
  category: 'Frente' | 'Lado' | 'Espalda';
  notes: string;
  weight?: number;
  bodyFat?: number;
}

const INITIAL_PHOTOS: ProgressPhoto[] = [
  { id: 'p1', date: '2026-01-15', label: 'Inicio del programa',  category: 'Frente', notes: 'Punto de partida',           weight: 82.5, bodyFat: 18.0 },
  { id: 'p2', date: '2026-02-15', label: 'Mes 1',                category: 'Frente', notes: 'Primeros cambios visibles',  weight: 80.1, bodyFat: 16.5 },
  { id: 'p3', date: '2026-03-15', label: 'Mes 2',                category: 'Frente', notes: 'Definición en abdomen',      weight: 78.8, bodyFat: 15.2 },
  { id: 'p4', date: '2026-01-15', label: 'Inicio - Lateral',     category: 'Lado',   notes: 'Punto de partida lateral',   weight: 82.5, bodyFat: 18.0 },
  { id: 'p5', date: '2026-03-15', label: 'Mes 2 - Lateral',      category: 'Lado',   notes: 'Mejora en postura',          weight: 78.8, bodyFat: 15.2 },
];

type CategoryFilter = 'Todas' | 'Frente' | 'Lado' | 'Espalda';
const CATEGORIES: CategoryFilter[] = ['Todas', 'Frente', 'Lado', 'Espalda'];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PhotosTab() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>(INITIAL_PHOTOS);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('Todas');
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<[string | null, string | null]>([null, null]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhoto, setNewPhoto] = useState<Partial<ProgressPhoto>>({
    category: 'Frente',
    date: new Date().toISOString().split('T')[0],
  });

  const filtered = selectedCategory === 'Todas' ? photos : photos.filter((p) => p.category === selectedCategory);
  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const compareA = photos.find((p) => p.id === comparePhotos[0]);
  const compareB = photos.find((p) => p.id === comparePhotos[1]);

  const handleAddPhoto = () => {
    if (!newPhoto.label || !newPhoto.date) return;
    const photo: ProgressPhoto = {
      id: `p${Date.now()}`,
      date: newPhoto.date,
      label: newPhoto.label,
      category: (newPhoto.category as ProgressPhoto['category']) || 'Frente',
      notes: newPhoto.notes || '',
      weight: newPhoto.weight,
      bodyFat: newPhoto.bodyFat,
    };
    setPhotos([...photos, photo]);
    setShowAddForm(false);
    setNewPhoto({ category: 'Frente', date: new Date().toISOString().split('T')[0] });
  };

  const toggleCompareSelection = (id: string) => {
    if (comparePhotos[0] === id) setComparePhotos([null, comparePhotos[1]]);
    else if (comparePhotos[1] === id) setComparePhotos([comparePhotos[0], null]);
    else if (!comparePhotos[0]) setComparePhotos([id, comparePhotos[1]]);
    else if (!comparePhotos[1]) setComparePhotos([comparePhotos[0], id]);
    else setComparePhotos([id, comparePhotos[1]]);
  };

  const daysBetween = (a: string, b: string) =>
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Controls */}
      <Card variant="default" padding="md" className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-[22px] text-brand-dark m-0">📸 Fotos de Progreso</h2>
          <p className="text-brand-warm text-[13px] m-0 mt-1">Documenta tu transformación visual</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setCompareMode(!compareMode)}
            className={cn(
              'px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all border',
              compareMode
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-brand-cream bg-brand-paper text-brand-brown',
            )}
          >
            {compareMode ? '✕ Salir Comparar' : '🔄 Comparar'}
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-lg bg-accent text-brand-paper text-[13px] font-semibold border-none cursor-pointer"
          >
            + Nueva Foto
          </button>
        </div>
      </Card>

      {/* Add Photo Form */}
      {showAddForm && (
        <Card variant="default" padding="md" className="border-2 border-accent/20">
          <h3 className="font-serif text-base text-brand-dark m-0 mb-4">Registrar Nueva Foto</h3>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {[
              { label: 'Título',    input: <input value={newPhoto.label || ''} onChange={(e) => setNewPhoto({ ...newPhoto, label: e.target.value })} placeholder="Ej: Mes 3 - Frente" className="input w-full" /> },
              { label: 'Fecha',     input: <input type="date" value={newPhoto.date || ''} onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })} className="input w-full" /> },
              { label: 'Categoría', input: (
                <select value={newPhoto.category || 'Frente'} onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value as ProgressPhoto['category'] })} className="input w-full">
                  <option value="Frente">Frente</option>
                  <option value="Lado">Lado</option>
                  <option value="Espalda">Espalda</option>
                </select>
              )},
              { label: 'Peso (kg)',  input: <input type="number" value={newPhoto.weight || ''} onChange={(e) => setNewPhoto({ ...newPhoto, weight: parseFloat(e.target.value) || undefined })} placeholder="78.5" className="input w-full" /> },
              { label: '% Grasa',   input: <input type="number" value={newPhoto.bodyFat || ''} onChange={(e) => setNewPhoto({ ...newPhoto, bodyFat: parseFloat(e.target.value) || undefined })} placeholder="15.2" className="input w-full" /> },
              { label: 'Notas',     input: <input value={newPhoto.notes || ''} onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })} placeholder="Observaciones..." className="input w-full" /> },
            ].map(({ label, input }) => (
              <div key={label}>
                <label className="input-label">{label}</label>
                {input}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-lg border border-brand-cream bg-transparent text-brand-brown cursor-pointer text-[13px]">Cancelar</button>
            <button type="button" onClick={handleAddPhoto} className="px-4 py-2 rounded-lg bg-accent text-brand-paper border-none cursor-pointer text-[13px] font-semibold">Guardar Registro</button>
          </div>
          <p className="text-brand-warm text-[11px] m-0 mt-3 italic">
            💡 Las fotos se subirán desde tu dispositivo cuando la app esté en producción. Por ahora se registran los datos asociados.
          </p>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-3.5 py-1.5 rounded-2xl text-[13px] font-semibold cursor-pointer border transition-all',
              selectedCategory === cat
                ? 'bg-accent text-brand-paper border-accent'
                : 'bg-brand-paper text-brand-brown border-brand-cream',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Compare Mode */}
      {compareMode && (
        <Card variant="default" padding="md" className="border-2 border-dashed border-accent/40">
          <h3 className="font-serif text-base text-brand-dark m-0 mb-4">Comparación Lado a Lado</h3>
          {compareA && compareB ? (
            <>
              <div className="grid grid-cols-2 gap-6">
                {[compareA, compareB].map((photo) => (
                  <div key={photo.id} className="text-center">
                    <div className="w-full aspect-[3/4] bg-brand-cream rounded-xl flex items-center justify-center mb-3 border border-brand-light-tan">
                      <span className="text-5xl">📷</span>
                    </div>
                    <p className="font-bold text-brand-dark text-sm m-0 mb-1">{photo.label}</p>
                    <p className="text-brand-warm text-xs m-0 mb-2">{formatDate(photo.date)}</p>
                    <div className="flex gap-3 justify-center">
                      {photo.weight && <span className="text-[13px] text-brand-brown">⚖️ {photo.weight} kg</span>}
                      {photo.bodyFat && <span className="text-[13px] text-brand-brown">📊 {photo.bodyFat}%</span>}
                    </div>
                  </div>
                ))}
              </div>
              {compareA.weight && compareB.weight && (
                <div className="mt-5 p-4 bg-accent/5 rounded-xl border border-accent/20">
                  <h4 className="font-serif text-sm text-brand-dark m-0 mb-3">📈 Cambios Detectados</h4>
                  <div className="flex gap-6 flex-wrap">
                    <div>
                      <span className="text-xs text-brand-warm">Peso</span>
                      <p className={cn('m-0 mt-0.5 font-bold text-base', compareB.weight <= compareA.weight ? 'text-success' : 'text-danger')}>
                        {(compareB.weight - compareA.weight).toFixed(1)} kg
                      </p>
                    </div>
                    {compareA.bodyFat && compareB.bodyFat && (
                      <div>
                        <span className="text-xs text-brand-warm">% Grasa</span>
                        <p className={cn('m-0 mt-0.5 font-bold text-base', compareB.bodyFat <= compareA.bodyFat ? 'text-success' : 'text-danger')}>
                          {(compareB.bodyFat - compareA.bodyFat).toFixed(1)}%
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-brand-warm">Tiempo entre fotos</span>
                      <p className="m-0 mt-0.5 font-bold text-base text-brand-dark">
                        {daysBetween(compareA.date, compareB.date)} días
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-brand-warm text-[13px] text-center">Selecciona 2 fotos de la galería para comparar</p>
          )}
        </Card>
      )}

      {/* Photo Timeline */}
      <Card variant="default" padding="md">
        <h3 className="font-serif text-lg text-brand-dark m-0 mb-5">📅 Timeline de Transformación</h3>
        {sorted.length === 0 ? (
          <p className="text-brand-warm text-sm text-center py-10">No hay fotos en esta categoría. ¡Agrega tu primera foto!</p>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {sorted.map((photo) => {
              const isSelected = comparePhotos.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => compareMode && toggleCompareSelection(photo.id)}
                  className={cn(
                    'rounded-xl overflow-hidden border transition-all',
                    isSelected ? 'border-[3px] border-accent bg-accent/5' : 'border border-brand-cream bg-brand-warm-white',
                    compareMode ? 'cursor-pointer' : 'cursor-default',
                  )}
                >
                  <div className="w-full aspect-[3/4] bg-brand-cream flex items-center justify-center relative">
                    <span className="text-4xl opacity-60">📷</span>
                    <span className="absolute top-2 left-2 bg-brand-dark text-brand-paper text-[10px] font-bold px-2 py-0.5 rounded-xl">
                      {photo.category}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 bg-accent text-brand-paper w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-brand-dark text-[13px] m-0 mb-0.5">{photo.label}</p>
                    <p className="text-brand-warm text-[11px] m-0 mb-1.5">{formatDateShort(photo.date)}</p>
                    <div className="flex gap-2 flex-wrap">
                      {photo.weight && (
                        <span className="text-[11px] text-brand-brown bg-brand-cream/80 px-1.5 py-0.5 rounded">
                          ⚖️ {photo.weight} kg
                        </span>
                      )}
                      {photo.bodyFat && (
                        <span className="text-[11px] text-brand-brown bg-brand-cream/80 px-1.5 py-0.5 rounded">
                          📊 {photo.bodyFat}%
                        </span>
                      )}
                    </div>
                    {photo.notes && <p className="text-brand-warm text-[11px] m-0 mt-1.5 italic">{photo.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Stats Summary */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {[
          {
            icon: '📸',
            value: String(photos.length),
            label: 'Fotos Registradas',
          },
          {
            icon: '📅',
            value: String(photos.length >= 2 ? daysBetween(sorted[0]?.date || '', sorted[sorted.length - 1]?.date || '') : 0),
            label: 'Días de Tracking',
          },
          {
            icon: '⚖️',
            value: photos.length >= 2 && sorted[0]?.weight && sorted[sorted.length - 1]?.weight
              ? `${((sorted[sorted.length - 1]?.weight || 0) - (sorted[0]?.weight || 0)).toFixed(1)}`
              : '—',
            label: 'Cambio de Peso (kg)',
          },
          {
            icon: '📊',
            value: photos.length >= 2 && sorted[0]?.bodyFat && sorted[sorted.length - 1]?.bodyFat
              ? `${((sorted[sorted.length - 1]?.bodyFat || 0) - (sorted[0]?.bodyFat || 0)).toFixed(1)}%`
              : '—',
            label: 'Cambio % Grasa',
          },
        ].map((s) => (
          <Card key={s.label} variant="default" padding="md" className="text-center">
            <p className="text-[28px] m-0 mb-1">{s.icon}</p>
            <p className="font-serif text-2xl font-extrabold text-brand-dark m-0 mb-1">{s.value}</p>
            <p className="text-xs text-brand-warm m-0">{s.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
