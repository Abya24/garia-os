const CACHE_NAME = "garia-os-v3.2.0-cache-v4";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/icon-48.png",
  "/icon-72.png",
  "/icon-96.png",
  "/icon-144.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/icon.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Service worker asset pre-cache skipped:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Never intercept API routes, Vite dev module routes, or non-http/https protocols
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/") ||
    !url.protocol.startsWith("http")
  ) {
    return;
  }

  const isAssetFile =
    url.pathname.startsWith("/assets/") ||
    /\.(js|mjs|css)$/i.test(url.pathname);

  // Network-First strategy with strict MIME verification for scripts/styles
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const contentType = (networkResponse.headers.get("content-type") || "").toLowerCase();
          // Never cache HTML fallback responses under a JS/CSS asset URL
          if (isAssetFile && contentType.includes("text/html")) {
            return new Response("Asset not found", {
              status: 404,
              headers: { "Content-Type": "text/plain" },
            });
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            const cachedType = (cachedResponse.headers.get("content-type") || "").toLowerCase();
            if (isAssetFile && cachedType.includes("text/html")) {
              return new Response("Offline asset unavailable", {
                status: 404,
                headers: { "Content-Type": "text/plain" },
              });
            }
            return cachedResponse;
          }
          // Only provide SPA fallback for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/index.html").then((htmlRes) => {
              return htmlRes || caches.match("/");
            });
          }
          return new Response("Network error", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
          });
        });
      })
  );
});
