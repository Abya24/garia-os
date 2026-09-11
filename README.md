# Garia OS

Garia OS is an advanced student operating system and study management platform built with React, TypeScript, Vite, and Express, deployable as a Progressive Web App (PWA) with full offline support.

- **Application Type:** Progressive Web App (PWA) & Web Application
- **Distribution:** Official distribution is directly via the Web / PWA install flow (no unsupported standalone APK download routes required)
- **Offline Capabilities:** Service Worker caching, local IndexedDB/localStorage offline mutation queue, and profile-isolated state synchronization

---

## Architecture & Distribution

Garia OS runs universally on all modern browsers (Desktop, ChromeOS, iOS, and Android) as an installable Progressive Web App:

1. **Instant Web/PWA Access:** Users navigate to the app URL and install it directly to their home screen or desktop with a single tap.
2. **Offline Resilience:** All static assets, fonts, icons, and shell interfaces are cached locally by `/public/sw.js`. Mutations performed while offline are queued in profile-isolated local storage and automatically synchronized upon reconnection.
3. **Abya AI & Live Voice:** Server-side Gemini API integration via secure Express endpoints (`/api/ai/chat`, `/api/live-voice/ticket`) keeping API keys hidden from client code.
4. **Android TWA Wrapper (Optional Packaging):** The repository includes an Android Trusted Web Activity (`/android`) wrapper for Play Store publishing if desired, pointing directly to the hosted PWA origin.

---

## Workspace Structure

- `/src` - Core React + TypeScript web application source code.
- `/public` - PWA assets, manifest (`manifest.json`), service worker (`sw.js`), and icons.
- `/server.ts` - Express backend server with security rate-limiting, Live Voice single-use ticket handling, and SPA routing.
- `/android` - Android Trusted Web Activity (TWA) project wrapper.

---

## Security & Exclusion Policy

The following are strictly excluded via `.gitignore` to protect security and privacy:
- `node_modules/` & build outputs (`dist/`, `build/`)
- Android build caches (`.gradle/`, `android/app/build/`)
- All `.env` files (except `.env.example`)
- Keystores (`*.jks`, `*.keystore`)
- Local configuration files (`local.properties`)
