# Garia OS — Web, PWA & Production Deployment Guide

## Overview
Garia OS is designed and distributed as a modern Progressive Web App (PWA) and web application, featuring offline-first data synchronization, local IndexedDB/localStorage storage, and profile isolation.

- **App Name:** Garia OS
- **Official Distribution:** Progressive Web App (PWA) via web browser install flow
- **Platform Architecture:** React 18, TypeScript, Vite, Tailwind CSS, Express backend proxy for Abya AI
- **Offline Capabilities:** Comprehensive Service Worker cache (`/public/sw.js`) and queue-backed offline mutations

---

## 1. Web & PWA Production Deployment (Official)

The official distribution model for Garia OS is directly through modern web browsers:

1. **Production Build:**
   ```bash
   npm run build
   ```
   Compiles static frontend assets to `dist/` and bundles `dist/server.cjs` for backend execution.

2. **Production Run:**
   ```bash
   npm start
   ```
   Binds Express to port 3000 with hardened security headers, single-use WebSocket voice tickets, rate limiters, and SPA routing.

3. **PWA Installation:**
   - On Android/Chrome: Tap "Install app" or "Add to Home screen" via the browser prompt.
   - On iOS/Safari: Tap the Share button and select "Add to Home Screen".
   - On Desktop (Chrome/Edge): Click the install icon in the URL bar.

---

## 2. Android Trusted Web Activity (Optional Packaging)

For Google Play Store distribution, the repository contains a standard Android Trusted Web Activity (`android/` directory) that encapsulates the hosted PWA origin (`https://garia-os.ai.studio`):

- **Package ID:** `com.gariaos.app`
- **Target SDK:** 36 (Android 15)
- **Digital Asset Links:** Requires `.well-known/assetlinks.json` configured with the release signing key's SHA-256 fingerprint for full-screen borderless display.

---

## 3. Offline Data & Synchronization Guarantee

- **Shell & UI:** Precached on install by the Service Worker, allowing instant boot even in airplane mode.
- **Data Persistence:** Tasks, habits, syllabus progress, and timers persist locally per active student profile.
- **Offline Sync Queue:** When network connectivity is restored, mutations queued during offline sessions sync seamlessly with cloud storage.
