import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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
 * Google Sign-In via Firebase Auth
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    // Upsert root user record
    if (cred.user) {
      const userRef = doc(db, "users", cred.user.uid);
      try {
        await setDoc(
          userRef,
          {
            userId: cred.user.uid,
            email: cred.user.email || "",
            displayName: cred.user.displayName || "Student",
            photoURL: cred.user.photoURL || "",
            updatedAt: Date.now(),
            createdAt: Date.now(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn("Could not upsert user root document immediately:", e);
      }
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
      version: "2.8.3",
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
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
