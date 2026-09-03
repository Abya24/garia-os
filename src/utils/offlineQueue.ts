import { onAuthStateChanged } from "firebase/auth";
import { auth, uploadWorkspaceToCloud, persistEntityToFirestore } from "./firebase";
import { getWorkspaceSnapshot } from "./storage";

export type OfflineActionType =
  | "CREATE_TASK"
  | "UPDATE_TASK"
  | "DELETE_TASK"
  | "CREATE_NOTE"
  | "UPDATE_NOTE"
  | "DELETE_NOTE"
  | "UPDATE_HABIT"
  | "UPDATE_WATER"
  | "LOG_FOCUS"
  | "UPDATE_GOAL"
  | "UPDATE_EVENT"
  | "UPDATE_PROFILE"
  | "UPDATE_ACADEMIC"
  | "SAVE_EXAM_RECORD"
  | "UPDATE_SETTINGS"
  | "WORKSPACE_SNAPSHOT";

export interface PendingOfflineAction {
  id: string;
  type: OfflineActionType;
  entityName: string;
  action: "create" | "update" | "delete" | "sync";
  profileId: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed";
  lastError?: string;
}

export interface SyncProgressInfo {
  total: number;
  current: number;
  percentage: number;
  currentActionType?: string;
  stage: "idle" | "preparing" | "uploading" | "verifying" | "complete" | "failed";
}

export interface OfflineQueueState {
  pendingActions: PendingOfflineAction[];
  pendingCount: number;
  isReconciling: boolean;
  syncProgress: SyncProgressInfo;
  lastReconciledAt: number | null;
  lastReconciliationStatus: "idle" | "syncing" | "success" | "partial" | "failed";
  lastError?: string;
  isOnline: boolean;
}

const OFFLINE_QUEUE_KEY = "garia_offline_pending_queue_v1";
const LAST_RECONCILED_KEY = "garia_last_reconciled_time_v1";

type QueueListener = (state: OfflineQueueState) => void;
const listeners: Set<QueueListener> = new Set();

let isReconcilingInProgress = false;
let autoRetryTimer: ReturnType<typeof setTimeout> | null = null;

function loadStoredQueue(): PendingOfflineAction[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("[OfflineQueue] Error reading pending queue from localStorage", e);
    return [];
  }
}

function saveStoredQueue(queue: PendingOfflineAction[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("[OfflineQueue] Error saving pending queue to localStorage", e);
  }
}

function getStoredLastReconciledTime(): number | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_RECONCILED_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

function setStoredLastReconciledTime(time: number): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LAST_RECONCILED_KEY, String(time));
  } catch {}
}

const initialQueue = loadStoredQueue();

let currentState: OfflineQueueState = {
  pendingActions: initialQueue,
  pendingCount: initialQueue.length,
  isReconciling: false,
  syncProgress: {
    total: initialQueue.length,
    current: 0,
    percentage: 0,
    stage: "idle",
  },
  lastReconciledAt: getStoredLastReconciledTime(),
  lastReconciliationStatus: "idle",
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
};

function notifyListeners(): void {
  const stateCopy = { ...currentState, syncProgress: { ...currentState.syncProgress } };
  listeners.forEach((listener) => {
    try {
      listener(stateCopy);
    } catch (e) {
      console.error("[OfflineQueue] Error in queue listener callback", e);
    }
  });
}

/**
 * Subscribe to real-time changes to the offline pending queue and reconciliation state.
 */
export function subscribeToOfflineQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  listener({ ...currentState, syncProgress: { ...currentState.syncProgress } });
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get the current snapshot of the offline queue state.
 */
export function getOfflineQueueState(): OfflineQueueState {
  return { ...currentState, syncProgress: { ...currentState.syncProgress } };
}

/**
 * Get all current pending offline actions.
 */
export function getPendingQueue(): PendingOfflineAction[] {
  return [...currentState.pendingActions];
}

/**
 * Get count of pending actions.
 */
export function getPendingQueueCount(): number {
  return currentState.pendingActions.length;
}

/**
 * Enqueue a new mutation or action performed while offline (or for optimistic sync).
 */
export function enqueueOfflineAction(
  action: Omit<PendingOfflineAction, "id" | "timestamp" | "retryCount" | "status">
): PendingOfflineAction {
  const newAction: PendingOfflineAction = {
    ...action,
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    retryCount: 0,
    status: "pending",
  };

  const updatedQueue = [...currentState.pendingActions, newAction];
  saveStoredQueue(updatedQueue);

  currentState = {
    ...currentState,
    pendingActions: updatedQueue,
    pendingCount: updatedQueue.length,
    syncProgress: {
      total: updatedQueue.length,
      current: 0,
      percentage: 0,
      stage: "idle",
    },
    lastReconciliationStatus: "idle",
  };

  console.log(`[OfflineQueue] Enqueued offline action: ${newAction.type} (${newAction.id}). Total pending: ${updatedQueue.length}`);
  notifyListeners();

  // If online right now, schedule immediate background flush
  if (typeof navigator !== "undefined" && navigator.onLine && !isReconcilingInProgress) {
    if (autoRetryTimer) clearTimeout(autoRetryTimer);
    autoRetryTimer = setTimeout(() => {
      reconcilePendingQueueWithFirestore().catch((err) => {
        console.warn("[OfflineQueue] Auto background sync failed, will retry on next online event", err);
      });
    }, 400);
  }

  return newAction;
}

/**
 * Remove a specific action from the pending queue by ID.
 */
export function removePendingAction(id: string): void {
  const updatedQueue = currentState.pendingActions.filter((a) => a.id !== id);
  saveStoredQueue(updatedQueue);

  currentState = {
    ...currentState,
    pendingActions: updatedQueue,
    pendingCount: updatedQueue.length,
    syncProgress: {
      ...currentState.syncProgress,
      total: updatedQueue.length,
    },
  };

  notifyListeners();
}

/**
 * Clear all pending actions from the queue.
 */
export function clearPendingQueue(): void {
  saveStoredQueue([]);
  currentState = {
    ...currentState,
    pendingActions: [],
    pendingCount: 0,
    syncProgress: {
      total: 0,
      current: 0,
      percentage: 100,
      stage: "idle",
    },
    lastReconciliationStatus: "idle",
  };
  notifyListeners();
}

/**
 * Persist an individual offline action to the remote Firestore database.
 * Throws an error if remote persistence is rejected or fails.
 */
async function persistActionToFirestore(
  userId: string,
  action: PendingOfflineAction
): Promise<void> {
  const p = action.payload || {};
  const isDelete = action.action === "delete";
  const rawId = p.id || (typeof p === "string" ? p : action.id);
  const type = action.type;
  const entity = action.entityName;

  // 1. Tasks
  if (type.includes("TASK") || entity === "tasks") {
    await persistEntityToFirestore(userId, "tasks", rawId, p, isDelete);
    return;
  }

  // 2. Notes
  if (type.includes("NOTE") || entity === "notes") {
    await persistEntityToFirestore(userId, "notes", rawId, p, isDelete);
    return;
  }

  // 3. Habits
  if (type.includes("HABIT") || entity === "habits") {
    await persistEntityToFirestore(userId, "habits", rawId, p, isDelete);
    return;
  }

  // 4. Goals
  if (type.includes("GOAL") || entity === "goals") {
    await persistEntityToFirestore(userId, "goals", rawId, p, isDelete);
    return;
  }

  // 5. Calendar Events
  if (type.includes("EVENT") || entity === "calendar_events") {
    await persistEntityToFirestore(userId, "calendar_events", rawId, p, isDelete);
    return;
  }

  // 6. Profiles
  if (type.includes("PROFILE") || entity === "profiles") {
    await persistEntityToFirestore(userId, "profiles", rawId, p, isDelete);
    return;
  }

  // 7. Any other actions (UPDATE_SETTINGS, UPDATE_WATER, LOG_FOCUS, SAVE_EXAM_RECORD, WORKSPACE_SNAPSHOT, etc.)
  // Persist directly into the user's Firestore cloud backup workspace snapshot!
  const snapshot = getWorkspaceSnapshot();
  await uploadWorkspaceToCloud(userId, {
    activeProfileId: snapshot.activeProfileId,
    profiles: snapshot.profiles,
    fullStorageDump: snapshot.fullStorageDump,
  });
}

/**
 * Reconcile pending offline actions with the remote Firestore database once online and authenticated.
 * Actions are ONLY removed from the queue after actual successful persistence is confirmed.
 */
export async function reconcilePendingQueueWithFirestore(
  targetUserId?: string,
  maxRetries: number = 3
): Promise<{
  success: boolean;
  processed: number;
  remaining: number;
  error?: string;
}> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    currentState = {
      ...currentState,
      isOnline: false,
      isReconciling: false,
      lastReconciliationStatus: "idle",
    };
    notifyListeners();
    return {
      success: false,
      processed: 0,
      remaining: currentState.pendingActions.length,
      error: "Device is offline",
    };
  }

  if (isReconcilingInProgress) {
    return {
      success: false,
      processed: 0,
      remaining: currentState.pendingActions.length,
      error: "Reconciliation already in progress",
    };
  }

  const effectiveUserId = targetUserId || auth.currentUser?.uid;
  if (!effectiveUserId) {
    currentState = {
      ...currentState,
      isReconciling: false,
      lastReconciliationStatus: "idle",
      syncProgress: {
        total: currentState.pendingActions.length,
        current: 0,
        percentage: 0,
        stage: "idle",
      },
    };
    notifyListeners();
    console.log(
      "[OfflineQueue] Reconciliation skipped: user is not authenticated. Pending actions remain safely stored in local queue."
    );
    return {
      success: false,
      processed: 0,
      remaining: currentState.pendingActions.length,
      error: "Authentication required for cloud synchronization",
    };
  }

  const queueToProcess = [...currentState.pendingActions];
  if (queueToProcess.length === 0) {
    return { success: true, processed: 0, remaining: 0 };
  }

  isReconcilingInProgress = true;
  const totalActions = queueToProcess.length;

  currentState = {
    ...currentState,
    isReconciling: true,
    lastReconciliationStatus: "syncing",
    syncProgress: {
      total: totalActions,
      current: 0,
      percentage: 10,
      stage: "preparing",
      currentActionType: queueToProcess[0]?.type,
    },
    lastError: undefined,
  };
  notifyListeners();

  const persistedIds = new Set<string>();
  const failedActionErrors = new Map<string, string>();
  let lastErrorMsg: string | undefined;

  try {
    for (let i = 0; i < queueToProcess.length; i++) {
      const action = queueToProcess[i];
      currentState.syncProgress = {
        total: totalActions,
        current: i,
        percentage: Math.round(((i + 1) / totalActions) * 80),
        stage: "uploading",
        currentActionType: action.type,
      };
      notifyListeners();

      let actionPersisted = false;
      let actionErr: string | undefined;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await persistActionToFirestore(effectiveUserId, action);
          actionPersisted = true;
          break;
        } catch (err: any) {
          actionErr = err?.message || String(err);
          if (attempt < maxRetries) {
            await new Promise((res) => setTimeout(res, 250 * attempt));
          }
        }
      }

      if (actionPersisted) {
        persistedIds.add(action.id);
      } else {
        lastErrorMsg = actionErr;
        failedActionErrors.set(action.id, actionErr || "Persistence failed");
      }
    }

    // Auxiliary cloud backup snapshot sync for confirmed batch
    if (persistedIds.size > 0) {
      currentState.syncProgress = {
        total: totalActions,
        current: totalActions,
        percentage: 95,
        stage: "verifying",
        currentActionType: "WORKSPACE_SNAPSHOT",
      };
      notifyListeners();

      try {
        const snapshot = getWorkspaceSnapshot();
        await uploadWorkspaceToCloud(effectiveUserId, {
          activeProfileId: snapshot.activeProfileId,
          profiles: snapshot.profiles,
          fullStorageDump: snapshot.fullStorageDump,
        });
      } catch (backupErr) {
        console.warn("[OfflineQueue] Auxiliary cloud backup snapshot sync notice:", backupErr);
      }
    }

    // ONLY remove actions whose actual remote persistence was confirmed
    const currentStored = loadStoredQueue();
    const remainingActions = currentStored
      .filter((a) => !persistedIds.has(a.id))
      .map((a) => {
        const failureReason = failedActionErrors.get(a.id);
        if (failureReason) {
          return {
            ...a,
            status: "failed" as const,
            retryCount: (a.retryCount || 0) + 1,
            lastError: failureReason,
          };
        }
        return a;
      });

    saveStoredQueue(remainingActions);

    const now = Date.now();
    if (persistedIds.size > 0) {
      setStoredLastReconciledTime(now);
    }

    const allSucceeded = remainingActions.length === 0;
    const partialSuccess = persistedIds.size > 0 && remainingActions.length > 0;

    currentState = {
      ...currentState,
      pendingActions: remainingActions,
      pendingCount: remainingActions.length,
      isReconciling: false,
      syncProgress: {
        total: totalActions,
        current: persistedIds.size,
        percentage: allSucceeded ? 100 : Math.round((persistedIds.size / totalActions) * 100),
        stage: allSucceeded ? "complete" : partialSuccess ? "idle" : "failed",
      },
      lastReconciledAt: persistedIds.size > 0 ? now : currentState.lastReconciledAt,
      lastReconciliationStatus: allSucceeded ? "success" : partialSuccess ? "partial" : "failed",
      lastError: allSucceeded ? undefined : lastErrorMsg,
    };
    notifyListeners();

    if (allSucceeded) {
      setTimeout(() => {
        if (!isReconcilingInProgress && currentState.pendingCount === 0) {
          currentState.syncProgress.stage = "idle";
          notifyListeners();
        }
      }, 3000);
    }

    return {
      success: allSucceeded,
      processed: persistedIds.size,
      remaining: remainingActions.length,
      error: allSucceeded ? undefined : lastErrorMsg,
    };
  } finally {
    isReconcilingInProgress = false;
  }
}

// Automatically bind online / offline window event listeners, auth changes & heartbeat polling
if (typeof window !== "undefined") {
  // Listen for authentication changes to automatically reconcile pending offline actions
  onAuthStateChanged(auth, (user) => {
    if (user && typeof navigator !== "undefined" && navigator.onLine) {
      const stored = loadStoredQueue();
      if (stored.length > 0 && !isReconcilingInProgress) {
        console.log(`[OfflineQueue] User authenticated (${user.uid}). Reconciling ${stored.length} pending offline actions...`);
        setTimeout(() => {
          reconcilePendingQueueWithFirestore(user.uid).catch((err) => {
            console.warn("[OfflineQueue] Automatic reconciliation on auth change notice:", err);
          });
        }, 500);
      }
    }
  });

  window.addEventListener("online", () => {
    currentState = {
      ...currentState,
      isOnline: true,
    };
    notifyListeners();
    console.log("[OfflineQueue] Network restored (online). Checking pending queue...");

    // If authenticated and has pending queue, initiate reconciliation
    if (loadStoredQueue().length > 0 && !isReconcilingInProgress && auth.currentUser) {
      setTimeout(() => {
        reconcilePendingQueueWithFirestore().catch((e) => {
          console.warn("[OfflineQueue] Auto-reconciliation after online event error:", e);
        });
      }, 500);
    }
  });

  window.addEventListener("offline", () => {
    currentState = {
      ...currentState,
      isOnline: false,
      isReconciling: false,
      syncProgress: {
        ...currentState.syncProgress,
        stage: "idle",
      },
    };
    notifyListeners();
    console.log("[OfflineQueue] Network disconnected (offline). All changes will be queued locally.");
  });

  // Initial check on boot: if online, authenticated, and has pending queue, reconcile after 1.5s
  if (navigator.onLine && loadStoredQueue().length > 0 && auth.currentUser) {
    setTimeout(() => {
      reconcilePendingQueueWithFirestore().catch(() => {});
    }, 1500);
  }

  // Periodic heartbeat sync check every 45 seconds for unattended offline queues
  setInterval(() => {
    if (
      typeof navigator !== "undefined" &&
      navigator.onLine &&
      loadStoredQueue().length > 0 &&
      !isReconcilingInProgress &&
      auth.currentUser
    ) {
      reconcilePendingQueueWithFirestore().catch(() => {});
    }
  }, 45000);
}
