# Changelog — Garia OS

All notable changes to the Garia OS codebase are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.2.1] - 2026-10-17

### Security & Hardening
- **Client-Side PIN Cryptography:** Upgraded local PIN hashing from weak/unsalted SHA-256 and non-cryptographic FNV-1a fallbacks to **PBKDF2-HMAC-SHA256 with 100,000 iterations** and a 16-byte cryptographically secure random salt (`crypto.getRandomValues`). Formatted as `v2$<salt_hex>$<derived_hex>`.
- **Fail-Closed Security:** Enforced fail-closed behavior in `src/utils/security.ts` if secure Web Crypto (`crypto.subtle`) is unavailable.
- **Legacy PIN Migration:** Added seamless backward-compatible verification in `verifyPin()` for existing 64-character SHA-256 hashes, preventing student lockout and migrating hashes to `v2$` upon PIN modification.
- **Session Cookie Sanitization:** Deleted exposed `cookies.txt` artifact from root and updated `.gitignore` to prevent any cookie dumps, test keys (`.garia-test-keys.json`), or zip archives from tracking.
- **Static Environment Access (Anti-Eval):** Replaced dynamic `Function("...import.meta.env...")` in `src/utils/firebase.ts` with direct, statically analyzable Vite environment reads and clean Node fallback.
- **Content Security Policy (CSP):** Implemented strict production CSP headers in `server.ts` and `vercel.json` without `'unsafe-eval'`, controlling scripts, frames, WebSockets, media/audio streaming, and Google Identity services.
- **Endpoint Protection & Information Leakage:**
  - Minimized `/api/health` to output non-sensitive telemetry (`{ status: "ok", app: "Garia OS", version: "3.1.0" }`).
  - Protected `/api/ai/diagnostics` with mandatory Firebase ID token verification (`verifyFirebaseIdToken`).
  - Updated `src/App.tsx` client diagnostics caller to transmit the active Firebase Bearer token and handle unauthenticated sessions gracefully.
- **Test Fixture Sanitization:** Refactored TEST 10 in `tests/security_verification.ts` to dynamically tamper only the signature segment of an ephemeral local test token, eliminating static `eyJ` literals and Google issuer URLs from test code.

### AI Model Governance
- **Centralized Model Registry:** Created `src/constants/aiModels.ts` (client) and `server/aiModels.ts` (server) establishing typed model identifiers, modality capabilities, and stability descriptors:
  - `DEFAULT_TEXT`: `"gemini-3.8-flash"` (Primary stable multimodal coaching model)
  - `LOW_LATENCY`: `"gemini-3.1-flash-lite"` (Instant note tagging and fast responses)
  - `HIGH_THINKING_PREVIEW`: `"gemini-3.1-pro-preview"` (Deep reasoning preview with thinking level)
  - `LIVE_VOICE`: `"gemini-3.8-live"` (WebSocket real-time audio)
  - `LIVE_VOICE_EXTENDED_THINKING`: `"gemini-3.8-live-extended-thinking"` (Live voice with reasoning)
- **Deprecation Cleanup:** Verified complete purging of deprecated models (`gemini-3.7-flash`, `gemini-2.0-*`) and removed stale search grounding metadata (`gemini-3.5-flash`).

### Accessibility & UX
- **Reduced Motion Support:** Added global `@media (prefers-reduced-motion: reduce)` rules in `src/index.css` disabling non-essential transitions and animations for motion-sensitive users.
- **Accessible Focus Indicators:** Added `:focus-visible` styling (`outline: 2px solid #38bdf8`) on buttons, links, inputs, and form controls for WCAG 2.1 AA keyboard navigation.

### Architecture & DevOps
- **Documented Deployment Constraints:** Added explicit architectural guidance in `server.ts` regarding in-memory rate limiting and single-use live voice ticket tables, clarifying single-instance container topology constraints (Cloud Run `min=1, max=1`) versus distributed store requirements (Redis/Firestore) for horizontal autoscaling.
- **Standardized Test Scripts:** Added `"test:security"` and `"test:all"` to `package.json`.
- **Automated Regression Suite:** Added Test 33 to `src/utils/__tests__/auditRegression.test.ts` verifying PIN KDF security, legacy migration, static Vite env, CSP headers, and model centralization.
