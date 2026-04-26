/**
 * Single source of truth para la URL pública del Servicio.
 *
 * Prioridad de resolución:
 *   1. NEXT_PUBLIC_APP_URL — preferido. Visible en el bundle del cliente
 *      (usado por wrappers nativos Capacitor/Tauri y por metadataBase).
 *   2. NEXTAUTH_URL / AUTH_URL — server-side, configurado por NextAuth.
 *   3. VERCEL_URL — auto-inyectado por Vercel en preview deploys.
 *      Notar que viene SIN protocolo (`my-app.vercel.app`).
 *   4. Fallback al dominio histórico para no romper deploys legacy.
 *
 * Nota sobre wrappers nativos: aunque Capacitor/Tauri sirvan los assets
 * desde el bundle local (`capacitor://localhost`, `tauri://localhost`),
 * el cliente API (`src/lib/api-client.ts`) DEBE apuntar al backend
 * remoto. Para esos casos pasamos `NEXT_PUBLIC_APP_URL` al build del
 * wrapper y todas las requests van al dominio web.
 */

const FALLBACK = "https://habit-tracker-two-flame.vercel.app";

/**
 * Devuelve la base URL absoluta sin trailing slash.
 * Safe para llamar tanto en server como en cliente.
 */
export function appBaseUrl(): string {
  // Prioridad 1: NEXT_PUBLIC_APP_URL
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (publicUrl) return stripTrailingSlash(ensureProtocol(publicUrl));

  // Prioridad 2: NEXTAUTH_URL / AUTH_URL (server-side)
  const authUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL;
  if (authUrl) return stripTrailingSlash(ensureProtocol(authUrl));

  // Prioridad 3: VERCEL_URL (preview deploys, sin protocolo)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${stripTrailingSlash(vercelUrl)}`;

  // Prioridad 4: fallback histórico
  return FALLBACK;
}

/**
 * Construye una URL absoluta a partir de un path relativo.
 * Maneja barras dobles y faltantes correctamente.
 */
export function appUrl(path: string): string {
  const base = appBaseUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function ensureProtocol(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Por defecto asumimos HTTPS (estándar para apps modernas).
  return `https://${url}`;
}
