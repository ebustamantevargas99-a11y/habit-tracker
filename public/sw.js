// Service worker mínimo y conservador para Ultimate TRACKER.
// Objetivo: hacer la PWA instalable y dar un fallback offline del shell,
// SIN arriesgar servir datos viejos. Por eso:
//   - Navegaciones y /api/*  → network-first (siempre datos frescos).
//   - Estáticos same-origin (/_next/static, /icons, fuentes) → cache-first.
// Cambia la versión para invalidar caches viejos en cada release.
const CACHE = "ut-static-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(["/icon.svg", "/manifest.json"]).catch(() => {})),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/apple-icon.png" ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|svg|webp)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Datos siempre frescos: no interceptar /api.
  if (url.pathname.startsWith("/api/")) return;

  // Navegaciones: network-first con fallback offline al shell cacheado.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((r) => r || caches.match("/")),
      ),
    );
    return;
  }

  // Estáticos: cache-first (los chunks de Next tienen hash en el nombre).
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return resp;
          }),
      ),
    );
  }
});
