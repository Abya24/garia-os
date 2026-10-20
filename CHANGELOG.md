# Changelog — Garia OS

All notable changes to the Garia OS codebase are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.3.0] - 2026-10-20

### Security & Cryptography
- **Web Crypto AES-256-GCM Note Encryption:** Replaced custom XOR encryption and 32-bit FNV-1a key derivation in `src/utils/noteFeatures.ts` with standard Web Crypto AES-256-GCM.
  - Generates unique 16-byte random salts and 12-byte random IVs per note using `crypto.getRandomValues()`.
  - Derives keys using PBKDF2-HMAC-SHA-256 with 100,000 iterations.
  - New versioned format: `ENCv2:<salt_hex>:<iv_hex>:<ciphertext_and_tag_hex>`.
  - Authenticated encryption automatically rejects incorrect passwords and tampered ciphertext/tags with zero silent corruption.
- **Safe Note Migration:** Added backward-compatible decryption for legacy `ENCv1:` notes and implemented `migrateNoteEncryption()`, guaranteeing existing user notes are never corrupted or lost.
- **Vetted PBKDF2 Password Security:** Upgraded `src/utils/auth.ts` to PBKDF2-HMAC-SHA-256 with 100,000 iterations and 16-byte random salt (`pwd_v2$<salt>$<derived>`), constant-time comparison (`timingSafeEqual`), and fail-closed error handling. Added `verifyPassword()` with seamless backward-compatible legacy hash migration.
- **Cross-Site WebSocket Hijacking (CSWSH) Defense:** Implemented `isTrustedWebSocketOrigin()` in `server.ts` to validate the `Origin` header during WebSocket upgrades (`/api/live-voice`), rejecting untrusted third-party origins with HTTP 403 Forbidden.
- **Content Security Policy Enhancement:** Added per-request cryptographic script nonces (`res.locals.cspNonce`) and supported report-only testing mode (`CSP_REPORT_ONLY=true`).
- **Global API Request Timeout:** Added a 30-second gateway timeout middleware on `/api/*` routes to prevent hanging sockets.
- **Automated Verification Gates:**
  - Added Subtest 34 to `src/utils/__tests__/auditRegression.test.ts` (now 34 regression tests).
  - Added TEST 24 (CSWSH origin rejection) and TEST 25 (AI diagnostics auth) to `tests/security_verification.ts` (now 25 live security tests).

---

## [3.2.1] - 2026-10-17

### Security & Hardening
- **Client PIN Cryptography:** Upgraded PIN hashing to PBKDF2-HMAC-SHA-256 (100k rounds) with random salt (`v2$<salt>$<derived>`).
- **Session Cookie Sanitization:** Deleted exposed `cookies.txt` and updated `.gitignore`.
- **Static Vite Env Access:** Replaced `Function()`-based dynamic env resolution in `src/utils/firebase.ts` with static property access.
- **Production CSP Header:** Implemented strict CSP in `server.ts` and `vercel.json`.
- **Endpoint Protection:** Minimized `/api/health` and protected `/api/ai/diagnostics` with Firebase token auth.
