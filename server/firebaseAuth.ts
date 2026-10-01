import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface VerifiedFirebaseUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

export interface AuthVerificationResult {
  valid: boolean;
  user?: VerifiedFirebaseUser;
  error?: string;
  code?: string;
}

let publicKeysCache: { [kid: string]: string } = {};
let publicKeysExpiry = 0;

// In non-production testing, allow local test token signing/verifying
const TEST_KEYS_PATH = path.join(process.cwd(), "node_modules", ".garia-test-keys.json");

export function getDevTestAuth(): { publicKey: string; privateKey: string } {
  try {
    if (fs.existsSync(TEST_KEYS_PATH)) {
      return JSON.parse(fs.readFileSync(TEST_KEYS_PATH, "utf8"));
    }
  } catch {}

  const keyPair = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  try {
    fs.mkdirSync(path.dirname(TEST_KEYS_PATH), { recursive: true });
    fs.writeFileSync(TEST_KEYS_PATH, JSON.stringify(keyPair), "utf8");
  } catch {}

  return keyPair;
}

export function generateDevTestToken(uid: string, customPayload: Record<string, any> = {}): string {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Dev test tokens are forbidden in production environments.");
  }
  const { privateKey } = getDevTestAuth();
  const projectId = process.env.FIREBASE_PROJECT_ID || "tokyo-pipe-lf6jr";
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", kid: "garia-local-test-key", typ: "JWT" };
  const payload = {
    iss: `https://securetoken.google.com/${projectId}`,
    aud: projectId,
    auth_time: now - 5,
    user_id: uid,
    sub: uid,
    iat: now - 5,
    exp: now + 3600,
    email: `${uid}@gariaos.local`,
    email_verified: true,
    firebase: { identities: {}, sign_in_provider: "custom" },
    ...customPayload,
  };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const dataToSign = Buffer.from(`${headerB64}.${payloadB64}`, "utf8");
  const privObj = crypto.createPrivateKey(privateKey);
  const signature = crypto.sign("RSA-SHA256", dataToSign, privObj);
  return `${headerB64}.${payloadB64}.${signature.toString("base64url")}`;
}

async function fetchGooglePublicKeys(): Promise<{ [kid: string]: string }> {
  const now = Date.now();
  if (publicKeysExpiry > now && Object.keys(publicKeysCache).length > 0) {
    return publicKeysCache;
  }
  try {
    const res = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    );
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const cacheControl = res.headers.get("cache-control") || "";
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
    publicKeysCache = await res.json();
    publicKeysExpiry = now + maxAgeSec * 1000;
    return publicKeysCache;
  } catch (err) {
    console.error("[Auth] Error fetching Google public keys:", err);
    return publicKeysCache;
  }
}

export async function verifyFirebaseIdToken(
  authHeader: string | undefined
): Promise<AuthVerificationResult> {
  if (!authHeader || typeof authHeader !== "string") {
    return {
      valid: false,
      error: "Authentication required. Missing Authorization header.",
      code: "UNAUTHENTICATED",
    };
  }

  const parts = authHeader.trim().split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return {
      valid: false,
      error: "Authentication required. Bearer token must be provided in Authorization header.",
      code: "UNAUTHENTICATED",
    };
  }

  const token = parts[1].trim();
  if (!token) {
    return {
      valid: false,
      error: "Authentication required. Empty token provided.",
      code: "UNAUTHENTICATED",
    };
  }

  const jwtSegments = token.split(".");
  if (jwtSegments.length !== 3) {
    return {
      valid: false,
      error: "Malformed JWT token structure.",
      code: "INVALID_TOKEN",
    };
  }

  let header: any;
  let payload: any;
  try {
    header = JSON.parse(Buffer.from(jwtSegments[0], "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(jwtSegments[1], "base64url").toString("utf8"));
  } catch {
    return {
      valid: false,
      error: "Invalid token encoding.",
      code: "INVALID_TOKEN",
    };
  }

  if (header.alg !== "RS256" || !header.kid || typeof header.kid !== "string") {
    return {
      valid: false,
      error: "Invalid token algorithm or key identifier.",
      code: "INVALID_TOKEN",
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "tokyo-pipe-lf6jr";
  if (payload.aud !== projectId) {
    return {
      valid: false,
      error: "Token audience does not match project.",
      code: "INVALID_TOKEN",
    };
  }

  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    return {
      valid: false,
      error: "Token issuer is invalid.",
      code: "INVALID_TOKEN",
    };
  }

  if (!payload.sub || typeof payload.sub !== "string" || payload.sub.length > 128) {
    return {
      valid: false,
      error: "Token has an invalid or missing subject UID.",
      code: "INVALID_TOKEN",
    };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  // 60-second grace clock skew window
  if (typeof payload.exp !== "number" || payload.exp < nowSec - 60) {
    return {
      valid: false,
      error: "Firebase ID token has expired.",
      code: "EXPIRED_TOKEN",
    };
  }

  if (typeof payload.iat !== "number" || payload.iat > nowSec + 60) {
    return {
      valid: false,
      error: "Token issue timestamp is in the future.",
      code: "INVALID_TOKEN",
    };
  }

  // Check test token in non-production environments only if test keys were explicitly generated
  if (
    process.env.NODE_ENV !== "production" &&
    header.kid === "garia-local-test-key" &&
    fs.existsSync(TEST_KEYS_PATH)
  ) {
    try {
      const { publicKey } = JSON.parse(fs.readFileSync(TEST_KEYS_PATH, "utf8"));
      const dataToVerify = Buffer.from(`${jwtSegments[0]}.${jwtSegments[1]}`, "utf8");
      const pubObj = crypto.createPublicKey(publicKey);
      const signatureBuf = Buffer.from(jwtSegments[2], "base64url");
      const valid = crypto.verify("RSA-SHA256", dataToVerify, pubObj, signatureBuf);
      if (valid) {
        return {
          valid: true,
          user: {
            uid: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified,
          },
        };
      }
    } catch {
      return {
        valid: false,
        error: "Test signature verification failed.",
        code: "INVALID_SIGNATURE",
      };
    }
  }

  // Cryptographic RS256 signature verification against Google's public certificates
  let certs = await fetchGooglePublicKeys();
  let cert = certs[header.kid];
  if (!cert) {
    // Refresh cache once in case of recent key rotation
    publicKeysExpiry = 0;
    certs = await fetchGooglePublicKeys();
    cert = certs[header.kid];
  }

  if (!cert) {
    return {
      valid: false,
      error: "Public key for token signer not found or untrusted.",
      code: "INVALID_SIGNATURE",
    };
  }

  try {
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${jwtSegments[0]}.${jwtSegments[1]}`);
    const isValid = verifier.verify(cert, jwtSegments[2], "base64url");
    if (!isValid) {
      return {
        valid: false,
        error: "Cryptographic token signature verification failed.",
        code: "INVALID_SIGNATURE",
      };
    }

    return {
      valid: true,
      user: {
        uid: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
      },
    };
  } catch (sigErr) {
    return {
      valid: false,
      error: "Error verifying token signature.",
      code: "INVALID_SIGNATURE",
    };
  }
}
