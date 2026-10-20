# Garia OS — Comprehensive Security Audit & Remediation Report

**Date:** October 2026  
**Auditor:** Senior Application Security Engineer & DevOps Specialist  
**Project:** Garia OS (`Abya24/garia-os`)  
**Status:** Remediated & Fully Verified  

---

## 1. Executive Summary

A comprehensive application security audit of Garia OS was performed covering client-side cryptography, password storage, Content Security Policy, Cross-Site WebSocket Hijacking (CSWSH) defenses, Firebase authorization rules, and denial-of-service protections.

All identified vulnerabilities across client cryptography (`src/utils/noteFeatures.ts`), password hashing (`src/utils/auth.ts`), WebSocket origin validation (`server.ts`), and CSP nonce generation (`server.ts`) have been repaired directly in source code. All 59 automated verification tests (34 regression tests + 25 live security tests) pass with zero errors.

---

## 2. Summary of Remediated Vulnerabilities

| ID | Category | Severity | Root Cause & File Path | Remediation Implemented |
| :--- | :--- | :---: | :--- | :--- |
| **SEC-01** | Cryptography | **CRITICAL** | `src/utils/noteFeatures.ts`: Custom XOR encryption, custom 32-bit FNV-1a key derivation, and pseudo-MAC integrity tag. | Replaced with **Web Crypto AES-256-GCM** with 16-byte cryptographically secure random salt, 12-byte random IV (`crypto.getRandomValues`), and **PBKDF2-HMAC-SHA-256 (100,000 iterations)**. Formatted as `ENCv2:<salt>:<iv>:<ciphertext>`. Authenticated encryption automatically rejects tampered data and incorrect passwords. Preserved legacy `ENCv1` decryption and safe migration helper `migrateNoteEncryption`. |
| **SEC-02** | Password Security | **HIGH** | `src/utils/auth.ts`: Fixed-salt SHA-256 password hashing (`_garia_os_v2_salt`) and insecure 32-bit arithmetic fallback (`h_`). | Replaced with **PBKDF2-HMAC-SHA-256 (100,000 iterations)** with 16-byte random salt (`pwd_v2$<salt>$<derived>`), constant-time comparison, and fail-closed error handling. Added `verifyPassword()` supporting seamless migration of legacy hashes without user lockout. |
| **SEC-03** | WebSocket Security | **HIGH** | `server.ts`: `/api/live-voice` WebSocket upgrade accepted connections without validating the `Origin` header. | Implemented **Cross-Site WebSocket Hijacking (CSWSH) protection** (`isTrustedWebSocketOrigin`) verifying origin against server host, configured `APP_URL`, `localhost`, and trusted Google Cloud Run / AI Studio domains. Untrusted origins are rejected with HTTP 403 Forbidden. |
| **SEC-04** | Content Security Policy | **MEDIUM** | `server.ts`: CSP lacked per-request script nonces and report-only testing toggle. | Added cryptographic nonce generation (`crypto.randomBytes(16).toString("base64")`) for `script-src` and supported report-only testing mode via `CSP_REPORT_ONLY=true`. |
| **SEC-05** | API Timeouts & Limits | **MEDIUM** | `server.ts`: Potential hanging requests on long-lived connections. | Added global 30-second API timeout middleware (`REQUEST_TIMEOUT`, 504), sanitized client IP normalization (`::ffff:` prefix removal), and payload size limits (16kb for auth/tickets, 100kb for tags, 12mb for chat). |
| **SEC-06** | Secret Hygiene | **CRITICAL** | `cookies.txt` previously contained Cloud Run session token. | Deleted `cookies.txt`, added ignore rules to `.gitignore`, and sanitized all test files of static JWT literals. |

---

## 3. Cryptographic Deep Dive

### 3.1 Note Encryption Architecture (`src/utils/noteFeatures.ts`)
* **Cipher:** AES-GCM (Galois/Counter Mode) with 256-bit key and 128-bit authentication tag.
* **Key Derivation:** PBKDF2 with HMAC-SHA-256, 100,000 iterations, 16-byte random salt.
* **Initialization Vector (IV):** 12 bytes generated per encryption using `crypto.getRandomValues(new Uint8Array(12))`.
* **Payload Format:** `ENCv2:<salt_hex>:<iv_hex>:<ciphertext_and_tag_hex>`.
* **Tamper Protection:** Modification of ciphertext or authentication tag causes `crypto.subtle.decrypt` to reject with an `OperationError`, returning `null`.
* **Zero Data Loss Migration:**
  - `decryptNoteContent` supports both `ENCv2:` and `ENCv1:`.
  - `migrateNoteEncryption` safely decrypts legacy notes and re-encrypts with `ENCv2:` without altering the existing note if verification fails.

### 3.2 Account Password Architecture (`src/utils/auth.ts`)
* **Primary Authentication:** Firebase Authentication (Cloud Identity) is the primary user authentication mechanism.
* **Offline / Local Fallback:** Passwords for local student profiles use PBKDF2-HMAC-SHA-256 with 100,000 iterations and a 16-byte cryptographically secure random salt.
* **Format:** `pwd_v2$<salt_hex>$<derived_hex>`.
* **Constant-Time Verification:** Employs bitwise XOR accumulation (`timingSafeEqual`) to prevent timing side-channel attacks.
* **Safe Migration:** `verifyPassword` validates both modern `pwd_v2$` and legacy fixed-salt SHA-256 hashes, upgrading hashes automatically upon successful authentication.

---

## 4. Multi-Instance & Deployment Considerations

1. **Stateful In-Memory Tables vs Distributed Backends:**
   - In-memory rate limiters (`MemoryRateLimiter`) and single-use Live Voice tickets run in-process.
   - For Google Cloud Run, configure `minInstances: 1, maxInstances: 1`.
   - If autoscaling horizontally across multiple container instances, rate limiting and ticket state must be backed by a shared atomic store (e.g., Redis or Firestore transactions).
2. **Reverse Proxy & Client IP Handling:**
   - Express is configured with `app.set("trust proxy", 1)`.
   - `getClientIp()` normalizes IPv6-mapped IPv4 addresses to prevent subnet rate-limit evasion.

---

## 5. Verification Commands & Test Results

All verification suites were executed live against the codebase:

| Verification Suite | Command | Result | Details |
| :--- | :--- | :---: | :--- |
| **Unit & Regression Suite** | `npm test` | **PASS (34/34)** | 100% pass rate. Subtest 34 verified Web Crypto AES-GCM, tamper rejection, legacy migration, and PBKDF2 password security. |
| **Live Security Suite** | `npm run test:security` | **PASS (25/25)** | 100% pass rate against live server on port 3000. Verified CSWSH protection (TEST 24) and AI diagnostics auth (TEST 25). |
| **Combined Verification** | `npm run test:all` | **PASS (59/59)** | Runs both suites sequentially (34 regression + 25 security tests). |
| **TypeScript Typecheck** | `npm run lint` | **PASS** | `tsc --noEmit` — **0 errors, 0 warnings**. |
| **Production Build** | `npm run build` | **PASS** | Vite client (39 chunks) + esbuild Node server (`dist/server.cjs`). |
| **AI Studio Build System** | `compile_applet` | **PASS** | Applet builds cleanly with zero errors. |
