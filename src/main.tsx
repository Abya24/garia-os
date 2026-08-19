import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener("load", async () => {
    // Proactively clear any cached APK binaries from browser Cache Storage
    if ("caches" in window) {
      try {
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          for (const req of requests) {
            const url = req.url.toLowerCase();
            if (url.endsWith(".apk") || url.includes(".apk") || url.includes("/downloads/") || url.includes("/api/download")) {
              console.log("[App Init] Purging cached APK asset from cache storage:", req.url);
              await cache.delete(req);
            }
          }
        }
      } catch (e) {
        console.warn("[App Init] Cache inspection warning:", e);
      }
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.update().catch((err) => {
          console.warn("Service Worker update check notice:", err);
        });
      })
      .catch((err) => {
        console.warn("Service Worker registration notice:", err);
      });
  });
}

