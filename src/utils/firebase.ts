import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with Database ID (Mandatory per skill instructions)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Provider
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: "select_account" });

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Standard Firestore error handler per system requirements.
 * Logs error information and rethrows with a serialized JSON payload.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates Firestore server connection on startup.
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(db, "test", "connection");
    await getDocFromServer(testDocRef);
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("the client is offline") ||
        error.message.includes("unavailable"))
    ) {
      console.warn("Firestore connection check: client is offline or starting up.", error);
    }
    return false;
  }
}

/**
 * Upserts the root user document in Firestore to store authenticated profile metadata
 */
export async function upsertUserProfileDoc(user: FirebaseUser, displayName?: string): Promise<void> {
  if (!user || !user.uid) return;
  const userRef = doc(db, "users", user.uid);
  try {
    const existingSnap = await getDoc(userRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;
    const createdAt = existingData?.createdAt || Date.now();
    await setDoc(
      userRef,
      {
        userId: user.uid,
        email: user.email || "",
        displayName: displayName || user.displayName || existingData?.displayName || "Student",
        photoURL: user.photoURL || existingData?.photoURL || "",
        updatedAt: Date.now(),
        createdAt,
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("Could not upsert user root document:", e);
  }
}

/**
 * Formats Firebase Auth errors into clear, friendly student messages
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";
  const code = error.code || "";
  const msg = error.message || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in instead or use another email.";
    case "auth/invalid-email":
      return "The email address is not valid. Please check and try again.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters with letters and numbers.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password. Please verify your credentials.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a few minutes and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completing.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      if (msg.includes("auth/")) {
        return msg.replace(/^Firebase:\s*/, "");
      }
      return msg || "Authentication failed. Please try again.";
  }
}

/**
 * Sign Up with Email and Password using Firebase Auth
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user && displayName.trim()) {
      try {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      } catch (profileErr) {
        console.warn("Could not update display name in auth profile:", profileErr);
      }
    }
    if (cred.user) {
      await upsertUserProfileDoc(cred.user, displayName.trim());
    }
    return cred;
  } catch (error) {
    console.error("Error signing up with email:", error);
    throw error;
  }
}

/**
 * Sign In with Email and Password using Firebase Auth
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user) {
      await upsertUserProfileDoc(cred.user);
    }
    return cred;
  } catch (error) {
    console.error("Error signing in with email:", error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

/**
 * Google Sign-In via Firebase Auth
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    if (cred.user) {
      await upsertUserProfileDoc(cred.user);
    }
    return cred;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

/**
 * Sign out of Firebase Auth
 */
export async function signOutFromFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error("Error during Firebase sign out:", error);
    throw error;
  }
}

export interface CloudBackupState {
  userId: string;
  lastSyncedAt: number;
  version: string;
  activeProfileId?: string;
  profiles?: any[];
  payloadJson: string;
}

/**
 * Save complete student workspace snapshot to Firestore Cloud Sync
 */
export async function uploadWorkspaceToCloud(
  userId: string,
  snapshot: {
    activeProfileId: string;
    profiles: any[];
    fullStorageDump: Record<string, any>;
  }
): Promise<{ success: boolean; timestamp: number }> {
  const path = `users/${userId}/sync/cloud_backup`;
  const timestamp = Date.now();
  try {
    const syncDocRef = doc(db, "users", userId, "sync", "cloud_backup");
    const payload: CloudBackupState = {
      userId,
      lastSyncedAt: timestamp,
      version: "3.0.0",
      activeProfileId: snapshot.activeProfileId,
      profiles: snapshot.profiles,
      payloadJson: JSON.stringify(snapshot.fullStorageDump),
    };
    await setDoc(syncDocRef, payload, { merge: true });
    return { success: true, timestamp };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Download workspace state from Firestore Cloud Sync
 */
export async function downloadWorkspaceFromCloud(
  userId: string
): Promise<CloudBackupState | null> {
  const path = `users/${userId}/sync/cloud_backup`;
  try {
    const syncDocRef = doc(db, "users", userId, "sync", "cloud_backup");
    const snapshot = await getDoc(syncDocRef);
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.data() as CloudBackupState;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Subscribe to cloud sync updates
 */
export function subscribeToCloudSync(
  userId: string,
  onUpdate: (data: CloudBackupState | null) => void
): Unsubscribe {
  const path = `users/${userId}/sync/cloud_backup`;
  const syncDocRef = doc(db, "users", userId, "sync", "cloud_backup");
  return onSnapshot(
    syncDocRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as CloudBackupState);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn(`[Firestore CloudSync] Subscription error at ${path}:`, error);
    }
  );
}
