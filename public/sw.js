const CACHE_NAME = "garia-os-v3.0.0-cache-v3";
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
        cacheNames.map(async (cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
          // Also purge any accidental APK or download assets inside current cache
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          for (const req of requests) {
            const reqUrl = req.url.toLowerCase();
            if (
              reqUrl.endsWith(".apk") ||
              reqUrl.includes(".apk") ||
              reqUrl.includes("/downloads/") ||
              reqUrl.includes("/api/download") ||
              reqUrl.includes("/api/apk")
            ) {
              console.log("[SW] Purging cached APK asset from cache:", req.url);
              await cache.delete(req);
            }
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const pathnameLower = url.pathname.toLowerCase();
  const hrefLower = url.href.toLowerCase();

  // CRITICAL: Explicitly exclude all .apk files and binary download endpoints from Service Worker caching
  // Bypasses the cache-first / cache-fallback strategy completely so the browser always fetches clean server artifacts
  const isApkBinary =
    pathnameLower.endsWith(".apk") ||
    pathnameLower.includes(".apk") ||
    hrefLower.includes(".apk") ||
    pathnameLower.startsWith("/downloads") ||
    pathnameLower.startsWith("/download") ||
    pathnameLower.startsWith("/api/download") ||
    pathnameLower.startsWith("/api/apk") ||
    pathnameLower.includes("garia_os") ||
    pathnameLower.includes("gariaos") ||
    event.request.headers.get("accept")?.includes("application/vnd.android.package-archive");

  if (isApkBinary || event.request.method !== "GET") {
    // Zero interception - pass through directly to the server/network
    return;
  }

  // Network-First strategy with cache fallback for standard web UI assets only
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const contentType = networkResponse.headers.get("content-type") || "";
          // Extra safety: Never cache APK MIME type responses
          if (!contentType.includes("application/vnd.android.package-archive")) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline fallback from cache for HTML/UI assets only (never for APKs)
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match("/") || caches.match("/index.html");
        });
      })
  );
});


