import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-sm uppercase tracking-widest text-neutral-400">
          404
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Página no encontrada
        </h1>
        <p className="text-neutral-600">
          La página que buscas no existe o fue movida.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-md bg-neutral-900 text-white hover:bg-neutral-700 transition"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
