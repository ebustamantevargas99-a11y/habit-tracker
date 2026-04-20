export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-3 text-neutral-500">
        <div className="h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        <p className="text-sm">Cargando…</p>
      </div>
    </div>
  );
}
