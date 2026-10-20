/**
 * Authentication & Password Security Utilities for Garia OS
 *
 * Primary Authentication:
 * Firebase Authentication (signInWithEmail, createUserWithEmailAndPassword) is the
 * primary, cloud-secure authentication mechanism for user identity and sync.
 *
 * Local Password Fallback:
 * For offline student profiles and local account verification, passwords are protected
 * using PBKDF2-HMAC-SHA-256 with 100,000 iterations and a cryptographically secure random 16-byte salt.
 * Format: pwd_v2$<salt_hex>$<derived_hex>
 *
 * Migration & Fail-Closed:
 * Legacy fixed-salt SHA-256 hashes are verified during login and safely upgraded to pwd_v2$
 * without locking out existing students. If cryptographic operations fail or are unavailable,
 * verification fails closed (returns false) without insecure fallback hashes.
 */

const PASSWORD_KDF_ITERATIONS = 100000;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_DERIVED_KEY_BYTES = 32;

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Constant-time comparison of two Uint8Arrays to prevent timing attacks.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * Derives a PBKDF2-HMAC-SHA-256 key from password and random salt.
 */
async function derivePbkdf2Password(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PASSWORD_KDF_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    PASSWORD_DERIVED_KEY_BYTES * 8
  );

  return new Uint8Array(derivedBits);
}

/**
 * Legacy fixed-salt SHA-256 hash calculation kept strictly for backward-compatible migration.
 */
async function computeLegacyHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_garia_os_v2_salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Hashes a password using PBKDF2-HMAC-SHA-256 with 100,000 iterations and a unique 16-byte random salt.
 * Fails closed if cryptographic operations are unavailable.
 * Format: pwd_v2$<salt_hex>$<derived_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return "";
  if (typeof crypto === "undefined" || !crypto.subtle || !crypto.getRandomValues) {
    throw new Error("Cryptographic subsystem is unavailable. Password hashing failed securely.");
  }

  const salt = new Uint8Array(PASSWORD_SALT_BYTES);
  crypto.getRandomValues(salt);

  const derived = await derivePbkdf2Password(password, salt);
  return `pwd_v2$${bytesToHex(salt)}$${bytesToHex(derived)}`;
}

/**
 * Verifies a password against a stored hash.
 * Supports modern pwd_v2$ PBKDF2 hashes and legacy SHA-256 hashes with constant-time comparison.
 * Fails closed on malformed input or missing crypto primitives.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash || typeof storedHash !== "string") {
    return false;
  }
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return false; // Fail closed
  }

  try {
    // Modern v2 PBKDF2 hash: pwd_v2$<salt_hex>$<derived_hex>
    if (storedHash.startsWith("pwd_v2$")) {
      const parts = storedHash.slice("pwd_v2$".length).split("$");
      if (parts.length !== 2) return false;

      const [saltHex, expectedDerivedHex] = parts;
      const salt = hexToBytes(saltHex);
      const expectedDerived = hexToBytes(expectedDerivedHex);

      if (
        !salt ||
        !expectedDerived ||
        salt.length !== PASSWORD_SALT_BYTES ||
        expectedDerived.length !== PASSWORD_DERIVED_KEY_BYTES
      ) {
        return false;
      }

      const actualDerived = await derivePbkdf2Password(password, salt);
      return timingSafeEqual(actualDerived, expectedDerived);
    }

    // Legacy migration check: fixed-salt SHA-256
    const legacyExpected = await computeLegacyHash(password);
    if (legacyExpected === storedHash) {
      return true;
    }

    // Legacy simple fallback check (h_...)
    let fallbackHash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      fallbackHash = (fallbackHash << 5) - fallbackHash + char;
      fallbackHash |= 0;
    }
    const legacyFallback = "h_" + Math.abs(fallbackHash).toString(16);
    return legacyFallback === storedHash;
  } catch {
    return false;
  }
}
