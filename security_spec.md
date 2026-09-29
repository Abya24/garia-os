# Garia OS — Security Specification & TDD Framework (Phase 0)

This document establishes the security invariants, attack surface tests, and validation criteria for Garia OS across Firestore, Server APIs, Authentication, Data Isolation, and Secrets Management.

---

## 1. Data Invariants

### 1.1 User & Student Profile Isolation
* Every student profile belongs strictly to an authenticated user (`userId`).
* No authenticated user ($User_A$) may read, write, mutate, or delete records belonging to $User_B$.
* Subcollections under `/users/{userId}/*` (including `profiles`, `tasks`, `subjects`, `notes`, `habits`, `goals`, `calendar_events`, `sync`, and `collaboration_notifications`) require strict `request.auth.uid == userId`.
* Unauthenticated requests are rejected across all user-scoped paths (`request.auth != null`).

### 1.2 Immutable Security Fields
* On document updates, security ownership fields are strictly immutable:
  * `incoming().userId == existing().userId`
  * `incoming().createdAt == existing().createdAt`
* Profile identities cannot be spoofed or rebound to another account.

### 1.3 Collaboration & Workspace Integrity
* Public shared workspaces (`/workspaces/{workspaceId}`) enforce:
  * Non-members cannot read private workspace documents.
  * Only the workspace `ownerId` can delete or alter core workspace ownership metadata.
  * Active members can collaborate within validated schema limits.
  * Collaboration notifications can only be read/updated by the recipient `userId`.
* Member join-code rate limiting and validation are enforced.

### 1.4 API Identity & Capabilities
* Server-side Gemini AI endpoints (`/api/ai/chat`, `/api/live-voice/ticket`) MUST verify the caller's Firebase ID token.
* Verified `uid` from the cryptographically validated token is authoritative.
* User-supplied client claims, UIDs, or email parameters in request bodies are ignored for authorization.
* Live Voice WebSocket sessions require an atomically consumed, short-lived, single-use ticket cryptographically bound to the verified Firebase UID.

---

## 2. The "Dirty Dozen" Attack Vectors & Payloads

The following twelve test vectors evaluate and ensure the defenses of Garia OS:

1. **Unauthenticated AI Invocation (`DIRTY-01`)**:
   * *Attack*: Direct `POST /api/ai/chat` without Authorization header.
   * *Expected*: HTTP `401 Unauthorized`.

2. **Unauthenticated Live Voice Ticket Request (`DIRTY-02`)**:
   * *Attack*: Direct `POST /api/live-voice/ticket` without Authorization header.
   * *Expected*: HTTP `401 Unauthorized`.

3. **Forged / Fake UID Token Injection (`DIRTY-03`)**:
   * *Attack*: Sending `Authorization: Bearer <malformed_or_self_signed_jwt>` with forged `sub: "victim_user"`.
   * *Expected*: Cryptographic verification failure -> HTTP `401 Unauthorized`.

4. **Live Voice Ticket Replay (`DIRTY-04`)**:
   * *Attack*: Attempting to connect to `/api/live-voice?ticket=<used_ticket>` after it has already been used once.
   * *Expected*: Ticket store atomic deletion on handshake -> HTTP `403 Forbidden` / WS policy violation.

5. **Expired Live Voice Ticket (`DIRTY-05`)**:
   * *Attack*: Submitting a ticket past its 60-second validity window.
   * *Expected*: Rejection -> HTTP `403 Forbidden`.

6. **Cross-User Profile Hijacking (`DIRTY-06`)**:
   * *Attack*: User A attempts `get` or `set` on `/users/{User_B_Id}/profiles/{profileId}`.
   * *Expected*: Firestore security rules denial (`isOwner(userId)` fails).

7. **Cross-User Task Injection (`DIRTY-07`)**:
   * *Attack*: User A attempts `create` on `/users/{User_B_Id}/tasks/task_evil`.
   * *Expected*: Firestore security rules denial.

8. **Workspace Owner Impersonation (`DIRTY-08`)**:
   * *Attack*: Non-owner workspace collaborator attempts to change `ownerId` or delete the workspace.
   * *Expected*: Firestore rule validation failure (`isWorkspaceOwner(workspaceId)` fails).

9. **Rate Limit Evasion via Forged IP Header (`DIRTY-09`)**:
   * *Attack*: Rapidly cycling random `X-Forwarded-For: 1.1.1.X` headers to bypass AI chat rate limits.
   * *Expected*: Trusted proxy evaluation + UID-keyed rate limits enforce HTTP `429 Too Many Requests` with `Retry-After`.

10. **Oversized AI Payload DOS (`DIRTY-10`)**:
    * *Attack*: Sending prompt with > 20,000 characters or invalid MIME image payloads.
    * *Expected*: HTTP `400 Bad Request` (`PROMPT_TOO_LARGE` / `INVALID_IMAGE_PAYLOAD`).

11. **Client-Side Profile Storage Bleed (`DIRTY-11`)**:
    * *Attack*: Switching from Profile A to Profile B while attempting to access Profile A tasks or notes in `localStorage`.
    * *Expected*: Scoped key isolation (`garia_p_${profileId}_*`) guarantees zero cross-profile state leakage.

12. **Secret Leakage in Client Bundles (`DIRTY-12`)**:
    * *Attack*: Scanning production Vite bundle (`dist/assets/*.js`) for `GEMINI_API_KEY` or raw service account secrets.
    * *Expected*: Zero matches. All secrets reside exclusively server-side.

---

## 3. Test Runner & Verification Plan

1. **Static Analysis & Secret Inspection**:
   * Grep repository and `dist/` bundles for sensitive keys.
2. **Server Auth & Token Verification Test Suite**:
   * Automated runner checking all HTTP status codes (401, 403, 429, 200) for authenticated and unauthenticated scenarios.
3. **PWA & Offline Queue Invariants**:
   * Verify Service Worker offline asset fallback and deduplicated action queue.
4. **Production Build & Compilation**:
   * Full TypeScript compilation (`tsc --noEmit`) and bundle build (`npm run build`).
