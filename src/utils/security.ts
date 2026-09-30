import { PinSecuritySettings, UserSettings } from "../types";
import { loadActiveProfileId, saveSettings } from "./storage";

export const MIN_PIN_LENGTH = 4;
export const MAX_PIN_LENGTH = 8;

const SESSION_UNLOCKED_BASE_KEY = "garia_os_session_unlocked_v1";
const SESSION_LAST_ACTIVE_BASE_KEY = "garia_os_session_last_active_v1";
const SESSION_MANUAL_LOCK_BASE_KEY = "garia_os_session_manual_lock_v1";
const PIN_SALT = "garia_os_secure_pin_salt_v2026";

function getScopedSessionKey(baseKey: string, profileId?: string): string {
  const pId = profileId || loadActiveProfileId() || "default";
  return `${baseKey}_${pId}`;
}

/**
 * Generate a cryptographically strong, human-readable recovery code (e.g., GARIA-7K9P-4X2M)
 */
export function generateRecoveryCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclude ambiguous chars: 0, 1, I, O
  const randomBytes = new Uint8Array(8);
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(randomBytes);
  } else {
    throw new Error("Cryptographically secure RNG is unavailable in this runtime environment.");
  }
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(randomBytes[i] % chars.length);
    part2 += chars.charAt(randomBytes[i + 4] % chars.length);
  }
  return `GARIA-${part1}-${part2}`;
}

/**
 * Normalize recovery code for resilient comparison (ignores hyphens, spaces, and casing)
 */
export function normalizeRecoveryCode(code: string): string {
  if (!code) return "";
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Validate that a PIN meets the 4–8 digit numeric policy
 */
export function isValidPinFormat(pin: string): boolean {
  if (!pin) return false;
  return pin.length >= MIN_PIN_LENGTH && pin.length <= MAX_PIN_LENGTH && /^\d+$/.test(pin);
}

/**
 * Robust SHA-256 hash for PIN
 */
export async function hashPin(pin: string): Promise<string> {
  if (!pin) return "";
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${PIN_SALT}_${pin.trim()}_${PIN_SALT}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Fallback deterministic hash
    let hash = 0x811c9dc5;
    const str = `${PIN_SALT}_${pin.trim()}_${PIN_SALT}`;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return `ph_${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Synchronous comparison / verify helper
 */
export async function verifyPin(enteredPin: string, storedHash: string): Promise<boolean> {
  if (!enteredPin || !storedHash) return false;
  const computedHash = await hashPin(enteredPin);
  return computedHash === storedHash;
}

/**
 * Verify user's recovery code against stored recovery code.
 * Insecure universal bypass codes are strictly disallowed.
 */
export function verifyRecoveryCode(enteredCode: string, settings: UserSettings): boolean {
  if (!enteredCode) return false;
  const normalizedInput = normalizeRecoveryCode(enteredCode);
  if (!normalizedInput || normalizedInput.length < 6) return false;

  // Strict check against stored recovery code
  if (settings.security?.recoveryCode) {
    const normalizedStored = normalizeRecoveryCode(settings.security.recoveryCode);
    if (normalizedInput === normalizedStored) return true;
  }

  return false;
}

/**
 * Verify registered account email for PIN recovery.
 * Strictly verifies against registered security recovery email or account email.
 * Arbitrary emails or wildcards are strictly rejected.
 */
export function verifyAccountEmail(
  enteredEmail: string,
  settings: UserSettings,
  activeStudentName?: string
): boolean {
  if (!enteredEmail) return false;
  const cleanInput = enteredEmail.trim().toLowerCase();
  if (!cleanInput.includes("@") || !cleanInput.includes(".")) return false;

  // Arbitrary or placeholder @gariaos.local addresses cannot recover an account
  if (cleanInput.endsWith("@gariaos.local") || cleanInput === "private@gariaos.local") {
    return false;
  }

  const allowedEmails = new Set<string>();

  if (settings.security?.recoveryEmail) {
    const recEmail = settings.security.recoveryEmail.trim().toLowerCase();
    if (recEmail && !recEmail.endsWith("@gariaos.local") && recEmail !== "private@gariaos.local") {
      allowedEmails.add(recEmail);
    }
  }
  if (settings.account?.email) {
    const accEmail = settings.account.email.trim().toLowerCase();
    if (accEmail && !accEmail.endsWith("@gariaos.local") && accEmail !== "private@gariaos.local") {
      allowedEmails.add(accEmail);
    }
  }

  if (allowedEmails.size === 0) {
    return false;
  }

  return allowedEmails.has(cleanInput);
}


/**
 * Check if the active session is currently unlocked in browser session storage
 */
export function isSessionUnlocked(profileId?: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    const status = sessionStorage.getItem(getScopedSessionKey(SESSION_UNLOCKED_BASE_KEY, profileId));
    return status === "true";
  } catch {
    return false;
  }
}

/**
 * Mark the current browser session as unlocked
 */
export function setSessionUnlocked(unlocked: boolean, profileId?: string): void {
  try {
    if (typeof window === "undefined") return;
    const unlockedKey = getScopedSessionKey(SESSION_UNLOCKED_BASE_KEY, profileId);
    const lastActiveKey = getScopedSessionKey(SESSION_LAST_ACTIVE_BASE_KEY, profileId);
    const manualLockKey = getScopedSessionKey(SESSION_MANUAL_LOCK_BASE_KEY, profileId);
    if (unlocked) {
      sessionStorage.setItem(unlockedKey, "true");
      sessionStorage.setItem(lastActiveKey, Date.now().toString());
      sessionStorage.removeItem(manualLockKey);
    } else {
      sessionStorage.removeItem(unlockedKey);
      sessionStorage.removeItem(lastActiveKey);
      sessionStorage.setItem(manualLockKey, "true");
    }
  } catch {
    // ignore
  }
}

/**
 * Mark the current session as unlocked (alias)
 */
export function markSessionUnlocked(profileId?: string): void {
  setSessionUnlocked(true, profileId);
}

/**
 * Immediately lock the current session (triggers Lock Screen if PIN is enabled)
 */
export function lockSession(profileId?: string): void {
  setSessionUnlocked(false, profileId);
}

/**
 * Determines whether the app should present the Lock Screen
 */
export function shouldAppBeLocked(settings?: UserSettings, profileId?: string): boolean {
  if (!settings?.security?.enabled || !settings.security.pinHash) {
    return false;
  }

  // Check auto-lock timeout if configured
  const autoLockMinutes = settings.security.autoLockMinutes ?? 0;
  if (autoLockMinutes > 0 && typeof window !== "undefined") {
    try {
      const lastActiveStr = sessionStorage.getItem(
        getScopedSessionKey(SESSION_LAST_ACTIVE_BASE_KEY, profileId)
      );
      if (lastActiveStr) {
        const elapsedMs = Date.now() - Number(lastActiveStr);
        if (elapsedMs >= autoLockMinutes * 60 * 1000) {
          setSessionUnlocked(false, profileId);
          return true;
        }
      }
    } catch {
      // ignore
    }
  }

  // If PIN is enabled and lockOnLaunch is true:
  if (settings.security.lockOnLaunch) {
    return !isSessionUnlocked(profileId);
  }

  // If lockOnLaunch is disabled, only lock if user manually locked session
  try {
    if (typeof window !== "undefined") {
      const manuallyLocked =
        sessionStorage.getItem(getScopedSessionKey(SESSION_MANUAL_LOCK_BASE_KEY, profileId)) ===
        "true";
      return manuallyLocked;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Enable/create a new PIN and assign a recovery code
 */
export async function setupNewPin(
  pin: string,
  settings: UserSettings,
  onUpdateSettings: (s: UserSettings) => void,
  profileId?: string
): Promise<{ success: boolean; recoveryCode: string }> {
  if (!isValidPinFormat(pin)) return { success: false, recoveryCode: "" };
  const pinHash = await hashPin(pin);
  const recoveryCode = settings.security?.recoveryCode || generateRecoveryCode();

  const updatedSecurity: PinSecuritySettings = {
    enabled: true,
    pinHash,
    lockOnLaunch: true,
    autoLockMinutes: settings.security?.autoLockMinutes ?? 0,
    requirePinForSensitiveActions: settings.security?.requirePinForSensitiveActions ?? false,
    lastUnlockedAt: Date.now(),
    recoveryCode,
    recoveryEmail: settings.security?.recoveryEmail || settings.account?.email || "",
  };

  const newSettings: UserSettings = {
    ...settings,
    security: updatedSecurity,
  };

  onUpdateSettings(newSettings);
  saveSettings(newSettings, profileId);
  setSessionUnlocked(true, profileId);
  return { success: true, recoveryCode };
}

/**
 * Change existing PIN after verifying old PIN
 */
export async function changeExistingPin(
  currentPin: string,
  newPin: string,
  settings: UserSettings,
  onUpdateSettings: (s: UserSettings) => void,
  profileId?: string
): Promise<{ success: boolean; error?: string; recoveryCode?: string }> {
  if (!settings.security?.pinHash) {
    return { success: false, error: "No PIN currently set." };
  }

  const isCurrentValid = await verifyPin(currentPin, settings.security.pinHash);
  if (!isCurrentValid) {
    return { success: false, error: "Incorrect current PIN. Please try again." };
  }

  if (!isValidPinFormat(newPin)) {
    return { success: false, error: `New PIN must be between ${MIN_PIN_LENGTH} and ${MAX_PIN_LENGTH} digits (numbers only).` };
  }

  const newPinHash = await hashPin(newPin);
  const recoveryCode = settings.security?.recoveryCode || generateRecoveryCode();

  const updatedSecurity: PinSecuritySettings = {
    ...settings.security,
    enabled: true,
    pinHash: newPinHash,
    lastUnlockedAt: Date.now(),
    recoveryCode,
  };

  const newSettings: UserSettings = {
    ...settings,
    security: updatedSecurity,
  };

  onUpdateSettings(newSettings);
  saveSettings(newSettings, profileId);
  setSessionUnlocked(true, profileId);
  return { success: true, recoveryCode };
}

/**
 * Reset PIN directly using verified recovery credentials
 */
export async function resetPinWithRecovery(
  newPin: string,
  settings: UserSettings,
  onUpdateSettings: (s: UserSettings) => void,
  profileId?: string
): Promise<{ success: boolean; error?: string; recoveryCode: string }> {
  if (!isValidPinFormat(newPin)) {
    return { success: false, error: `New PIN must be between ${MIN_PIN_LENGTH} and ${MAX_PIN_LENGTH} digits (numbers only).`, recoveryCode: "" };
  }

  const newPinHash = await hashPin(newPin);
  const recoveryCode = generateRecoveryCode(); // generate fresh recovery code upon reset

  const updatedSecurity: PinSecuritySettings = {
    ...settings.security,
    enabled: true,
    pinHash: newPinHash,
    lockOnLaunch: true,
    lastUnlockedAt: Date.now(),
    recoveryCode,
  };

  const newSettings: UserSettings = {
    ...settings,
    security: updatedSecurity,
  };

  onUpdateSettings(newSettings);
  saveSettings(newSettings, profileId);
  setSessionUnlocked(true, profileId);
  return { success: true, recoveryCode };
}


/**
 * Remove / Disable PIN lock
 */
export async function removePin(
  currentPin: string,
  settings: UserSettings,
  onUpdateSettings: (s: UserSettings) => void,
  profileId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!settings.security?.pinHash) {
    // If no pin hash was stored, just disable
    const updatedSecurity: PinSecuritySettings = {
      enabled: false,
      pinHash: "",
      lockOnLaunch: false,
    };
    const newSettings: UserSettings = { ...settings, security: updatedSecurity };
    onUpdateSettings(newSettings);
    saveSettings(newSettings, profileId);
    setSessionUnlocked(true, profileId);
    return { success: true };
  }

  const isCurrentValid = await verifyPin(currentPin, settings.security.pinHash);
  if (!isCurrentValid) {
    return { success: false, error: "Incorrect current PIN. Please try again." };
  }

  const updatedSecurity: PinSecuritySettings = {
    enabled: false,
    pinHash: "",
    lockOnLaunch: false,
    autoLockMinutes: 0,
  };

  const newSettings: UserSettings = {
    ...settings,
    security: updatedSecurity,
  };

  onUpdateSettings(newSettings);
  saveSettings(newSettings, profileId);
  setSessionUnlocked(true, profileId);
  return { success: true };
}

/**
 * Emergency PIN Reset (e.g. if user forgot PIN, allows resetting with confirmation)
 */
export function resetPinSecurity(
  settings: UserSettings,
  onUpdateSettings: (s: UserSettings) => void,
  profileId?: string
): void {
  const updatedSecurity: PinSecuritySettings = {
    enabled: false,
    pinHash: "",
    lockOnLaunch: false,
    autoLockMinutes: 0,
  };

  const newSettings: UserSettings = {
    ...settings,
    security: updatedSecurity,
  };

  onUpdateSettings(newSettings);
  saveSettings(newSettings, profileId);
  setSessionUnlocked(true, profileId);
}
