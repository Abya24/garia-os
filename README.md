# Garia OS v1.6

Garia OS is an advanced student operating system and study management PWA built with React, TypeScript, Vite, and Express.

- **Version:** 1.6.0
- **Application Type:** Progressive Web App (PWA) + Android Trusted Web Activity (TWA)
- **Package ID:** `com.gariaos.app`
- **Target SDK:** 36 (Android 15)

---

## Workspace Structure

- `/src` - Core React + TypeScript web application source code.
- `/public` - PWA assets, manifest (`manifest.json`), service worker (`sw.js`), and launcher icons.
- `/server.ts` - Express backend server with no-cache headers for service worker and SPA routing.
- `/android` - Standalone Android Trusted Web Activity (TWA) project wrapper.

---

## GitHub Export & Cloud Android Build Setup

This repository is ready for export to GitHub.

### Android Release Build via GitHub Actions
Android release signing is designed to run securely in GitHub Actions without committing any private keystores to the codebase:

1. **GitHub Secrets:**
   Store your Base64 encoded release keystore and credentials in your repository secrets:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

2. **GitHub Actions Workflow:**
   When triggered, the CI pipeline converts the base64 keystore, signs the release build using `gradlew bundleRelease`, and uploads `app-release.aab` directly to GitHub Action artifacts.

3. **Digital Asset Links:**
   To enable full-screen TWA without browser bars, place your signing certificate's SHA-256 fingerprint in your hosted `.well-known/assetlinks.json`.

---

## Security & Exclusion Policy

The following are strictly excluded via `.gitignore` to protect security and privacy:
- `node_modules/` & build outputs (`dist/`, `build/`)
- Android build caches (`.gradle/`, `android/app/build/`)
- All `.env` files (except `.env.example`)
- Release keystores (`*.jks`, `*.keystore`)
- Local configuration files (`local.properties`)
