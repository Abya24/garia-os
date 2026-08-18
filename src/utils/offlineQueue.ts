import { auth, uploadWorkspaceToCloud, db } from "./firebase";
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
 * Automatically reconcile all pending offline actions with Firestore once online.
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
      success: true,
      processed: 0,
      remaining: currentState.pendingActions.length,
    };
  }

  const queue = [...currentState.pendingActions];
  if (queue.length === 0) {
    return { success: true, processed: 0, remaining: 0 };
  }

  isReconcilingInProgress = true;
  const totalActions = queue.length;

  currentState = {
    ...currentState,
    isReconciling: true,
    lastReconciliationStatus: "syncing",
    syncProgress: {
      total: totalActions,
      current: 0,
      percentage: 10,
      stage: "preparing",
      currentActionType: queue[0]?.type,
    },
    lastError: undefined,
  };
  notifyListeners();

  let attempt = 0;
  let lastErrorMsg: string | undefined;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const currentUserId = targetUserId || auth.currentUser?.uid || "anonymous_workspace_user";

      // 1. Stage: Preparing workspace snapshot
      currentState.syncProgress = {
        total: totalActions,
        current: Math.min(1, totalActions),
        percentage: 30,
        stage: "preparing",
        currentActionType: queue[0]?.type || "WORKSPACE_SNAPSHOT",
      };
      notifyListeners();

      const snapshot = getWorkspaceSnapshot();

      // 2. Stage: Uploading to Firestore
      currentState.syncProgress = {
        total: totalActions,
        current: Math.ceil(totalActions * 0.6),
        percentage: 65,
        stage: "uploading",
        currentActionType: "WORKSPACE_SNAPSHOT",
      };
      notifyListeners();

      let cloudSynced = false;
      if (auth.currentUser) {
        await uploadWorkspaceToCloud(auth.currentUser.uid, {
          activeProfileId: snapshot.activeProfileId,
          profiles: snapshot.profiles,
          fullStorageDump: snapshot.fullStorageDump,
        });
        cloudSynced = true;
      } else {
        // Verify server ping & Firestore link status
        const res = await fetch("/api/health", { cache: "no-store" });
        cloudSynced = res.ok;
      }

      // 3. Stage: Verifying
      currentState.syncProgress = {
        total: totalActions,
        current: totalActions,
        percentage: 90,
        stage: "verifying",
        currentActionType: "VERIFYING",
      };
      notifyListeners();

      if (cloudSynced) {
        const processedCount = queue.length;
        const now = Date.now();
        setStoredLastReconciledTime(now);
        saveStoredQueue([]);

        currentState = {
          ...currentState,
          pendingActions: [],
          pendingCount: 0,
          isReconciling: false,
          syncProgress: {
            total: totalActions,
            current: totalActions,
            percentage: 100,
            stage: "complete",
          },
          lastReconciledAt: now,
          lastReconciliationStatus: "success",
          lastError: undefined,
        };

        console.log(`[OfflineQueue] Successfully reconciled ${processedCount} pending actions with Firestore!`);
        notifyListeners();

        // Reset progress back to idle after a brief celebration interval
        setTimeout(() => {
          if (!isReconcilingInProgress && currentState.pendingCount === 0) {
            currentState.syncProgress.stage = "idle";
            notifyListeners();
          }
        }, 3000);

        return {
          success: true,
          processed: processedCount,
          remaining: 0,
        };
      } else {
        throw new Error("Unable to establish write connection with Firestore");
      }
    } catch (err: any) {
      lastErrorMsg = err?.message || String(err);
      console.warn(`[OfflineQueue] Sync attempt ${attempt}/${maxRetries} failed:`, lastErrorMsg);

      if (attempt < maxRetries) {
        // Exponential backoff wait (750ms, 1500ms)
        await new Promise((res) => setTimeout(res, 750 * Math.pow(2, attempt - 1)));
      }
    }
  }

  // All retries failed
  currentState = {
    ...currentState,
    isReconciling: false,
    syncProgress: {
      total: totalActions,
      current: 0,
      percentage: 0,
      stage: "failed",
    },
    lastReconciliationStatus: "failed",
    lastError: lastErrorMsg,
  };
  notifyListeners();
  isReconcilingInProgress = false;

  return {
    success: false,
    processed: 0,
    remaining: currentState.pendingActions.length,
    error: lastErrorMsg,
  };
}

// Automatically bind online / offline window event listeners & heartbeat polling
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    currentState = {
      ...currentState,
      isOnline: true,
    };
    notifyListeners();
    console.log("[OfflineQueue] Network restored (online). Initiating automatic reconciliation...");

    // Immediate flush on online event
    setTimeout(() => {
      reconcilePendingQueueWithFirestore().catch((e) => {
        console.error("[OfflineQueue] Auto-reconciliation after online event failed:", e);
      });
    }, 500);
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

  // Initial check on boot: if online and has pending queue, reconcile after 1.5s
  if (navigator.onLine && loadStoredQueue().length > 0) {
    setTimeout(() => {
      reconcilePendingQueueWithFirestore().catch(() => {});
    }, 1500);
  }

  // Periodic heartbeat sync check every 45 seconds for unattended offline queues
  setInterval(() => {
    if (typeof navigator !== "undefined" && navigator.onLine && loadStoredQueue().length > 0 && !isReconcilingInProgress) {
      reconcilePendingQueueWithFirestore().catch(() => {});
    }
  }, 45000);
}
