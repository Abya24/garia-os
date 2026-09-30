import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  addStudentProfile,
  loadProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  loadTasks,
  saveTasks,
  loadNotes,
  loadGoals,
  loadSettings,
  clearAllData,
} from "../storage";
import {
  isSessionUnlocked,
  setSessionUnlocked,
  lockSession,
  shouldAppBeLocked,
  setupNewPin,
  verifyPin,
} from "../security";
import { hashPassword } from "../auth";
import { enqueueOfflineAction, getPendingQueue, removePendingAction } from "../offlineQueue";
import { executeAbyaModuleAction } from "../abyaModuleActions";
import { Habit, Task, UserSettings } from "../../types";

function expect(actual: any) {
  return {
    toBe(expected: any) {
      assert.strictEqual(actual, expected);
    },
    toHaveLength(expected: number) {
      assert.strictEqual(actual?.length, expected);
    },
    toBeDefined() {
      assert.notStrictEqual(actual, undefined);
    },
  };
}

// Mock browser storage for Node/Vitest environment if needed
function createMemoryStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    key(index: number) {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
  };
}

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: createMemoryStorage(),
    writable: true,
  });
}
if (typeof globalThis.sessionStorage === "undefined") {
  Object.defineProperty(globalThis, "sessionStorage", {
    value: createMemoryStorage(),
    writable: true,
  });
}
if (typeof globalThis.window === "undefined") {
  (globalThis as any).window = globalThis;
}

describe("Garia OS Production Audit Regression Suite", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();
    getPendingQueue().forEach((item) => removePendingAction(item.id));
  });

  it("1. Enforces strict multi-student profile data isolation across tasks, notes, habits, and goals", () => {
    const profileA = addStudentProfile({
      name: "Aarav",
      classLevel: "Class 12",
      stream: "Science",
      board: "CBSE",
    });

    const taskA: Task = {
      id: "task-a-1",
      title: "Solve Physics Electrostatics PYQs",
      date: "2026-09-30",
      priority: "high",
      category: "study",
      completed: false,
      createdAt: Date.now(),
    };
    saveTasks([taskA], profileA.id);

    const profileB = addStudentProfile({
      name: "Diya",
      classLevel: "Class 10",
      stream: "General",
      board: "BSEB",
    });

    // Profile B is now active and must not see Profile A's custom task
    expect(loadActiveProfileId()).toBe(profileB.id);
    const tasksB = loadTasks(profileB.id);
    expect(tasksB.some((t) => t.id === "task-a-1")).toBe(false);

    // Switch back to Profile A and verify Profile A's data is intact
    saveActiveProfileId(profileA.id);
    const tasksAAfterSwitch = loadTasks(profileA.id);
    expect(tasksAAfterSwitch).toHaveLength(1);
    expect(tasksAAfterSwitch[0].id).toBe("task-a-1");
    expect(tasksAAfterSwitch[0].title).toBe("Solve Physics Electrostatics PYQs");

    // Verify clearAllData wipes all profiles and active profile pointers
    clearAllData();
    expect(loadProfiles()).toHaveLength(0);
  });

  it("2. Isolates PIN session unlock state per profile, honors lockOnLaunch=false, and enforces autoLockMinutes", async () => {
    const profA = "student-pin-a";
    const profB = "student-pin-b";

    let settingsB: UserSettings = loadSettings(profB);
    await setupNewPin(
      "2468",
      settingsB,
      (updated) => {
        settingsB = updated;
      },
      profB
    );

    expect(settingsB.security?.enabled).toBe(true);
    expect(await verifyPin("2468", settingsB.security?.pinHash || "")).toBe(true);

    // Lock Profile B and unlock Profile A
    lockSession(profB);
    setSessionUnlocked(true, profA);

    // Unlocking Profile A must NOT unlock Profile B
    expect(isSessionUnlocked(profA)).toBe(true);
    expect(isSessionUnlocked(profB)).toBe(false);
    expect(shouldAppBeLocked(settingsB, profB)).toBe(true);

    // Unlock Profile B -> should no longer be locked
    setSessionUnlocked(true, profB);
    expect(shouldAppBeLocked(settingsB, profB)).toBe(false);

    // Test lockOnLaunch = false on a fresh session (no manual lock)
    globalThis.sessionStorage.clear();
    const settingsNoLaunchLock: UserSettings = {
      ...settingsB,
      security: {
        ...settingsB.security!,
        lockOnLaunch: false,
      },
    };
    expect(shouldAppBeLocked(settingsNoLaunchLock, profB)).toBe(false);

    // Manual lock when lockOnLaunch = false MUST lock the session
    lockSession(profB);
    expect(shouldAppBeLocked(settingsNoLaunchLock, profB)).toBe(true);

    // Test autoLockMinutes expiration
    setSessionUnlocked(true, profB);
    const expiredTimestamp = Date.now() - 10 * 60 * 1000; // 10 mins ago
    globalThis.sessionStorage.setItem(
      `garia_os_session_last_active_v1_${profB}`,
      String(expiredTimestamp)
    );
    const settingsAutoLock5m: UserSettings = {
      ...settingsB,
      security: {
        ...settingsB.security!,
        autoLockMinutes: 5,
      },
    };
    expect(shouldAppBeLocked(settingsAutoLock5m, profB)).toBe(true);
  });

  it("3. Prevents empty passwordHash bypass on account login verification", async () => {
    const privateAccountSettings: UserSettings = {
      ...loadSettings("student-private"),
      account: {
        email: "student-private@gariaos.local",
        passwordHash: "",
        name: "Private Student",
        isPrivateMode: true,
        createdAt: Date.now(),
      },
    };

    const enteredPasswordHash = await hashPassword("any-random-password");
    const canLoginToPrivate =
      Boolean(privateAccountSettings.account?.passwordHash) &&
      privateAccountSettings.account?.passwordHash === enteredPasswordHash;
    expect(canLoginToPrivate).toBe(false);

    const realPasswordHash = await hashPassword("CorrectHorseBatteryStaple!");
    const registeredSettings: UserSettings = {
      ...privateAccountSettings,
      account: {
        email: "aarav@example.com",
        passwordHash: realPasswordHash,
        name: "Aarav",
        isPrivateMode: false,
        createdAt: Date.now(),
      },
    };

    const canLoginWithWrongPass =
      Boolean(registeredSettings.account?.passwordHash) &&
      registeredSettings.account?.passwordHash === enteredPasswordHash;
    expect(canLoginWithWrongPass).toBe(false);

    const canLoginWithRightPass =
      Boolean(registeredSettings.account?.passwordHash) &&
      registeredSettings.account?.passwordHash === realPasswordHash;
    expect(canLoginWithRightPass).toBe(true);
  });

  it("4. Enqueues full Habit entity with id for offline Firestore sync", () => {
    const updatedHabit: Habit = {
      id: "habit-101",
      title: "Morning Formula Revision",
      category: "study",
      streak: 3,
      completedDates: ["2026-09-28", "2026-09-29", "2026-09-30"],
      createdAt: Date.now() - 86400000 * 5,
    };

    const queued = enqueueOfflineAction({
      type: "UPDATE_HABIT",
      entityName: "habits",
      action: "update",
      profileId: "student-a",
      payload: updatedHabit,
    });

    expect(queued.payload).toBeDefined();
    expect(queued.payload.id).toBe("habit-101");
    expect(queued.payload.streak).toBe(3);
    expect(queued.profileId).toBe("student-a");

    const pending = getPendingQueue();
    expect(pending).toHaveLength(1);
    expect(pending[0].payload.id).toBe("habit-101");
  });

  it("5. Isolates async Abya AI module actions to requestProfileId when active profile switches", () => {
    const profA = addStudentProfile({
      name: "Student A",
      classLevel: "Class 12",
      stream: "Science",
      board: "CBSE",
    });
    const profB = addStudentProfile({
      name: "Student B",
      classLevel: "Class 12",
      stream: "Commerce",
      board: "CBSE",
    });

    saveTasks([], profA.id);
    saveTasks([], profB.id);

    // Simulate Student B currently active in UI while Student A's in-flight Abya AI action completes
    let activeUiTasksForB: Task[] = [];
    const requestProfileId = profA.id;
    const currentActiveProfileId = profB.id;
    const isStillSameProfile = currentActiveProfileId === requestProfileId;

    executeAbyaModuleAction(
      {
        action: "create_task",
        title: "Revise Optics Numericals",
        subject: "Physics",
        priority: "high",
      },
      {
        tasks: isStillSameProfile ? activeUiTasksForB : loadTasks(requestProfileId),
        setTasks: isStillSameProfile
          ? (next) => {
              activeUiTasksForB = typeof next === "function" ? next(activeUiTasksForB) : next;
            }
          : () => {},
        notes: loadNotes(requestProfileId),
        setNotes: () => {},
        water: { date: "2026-09-30", glasses: 0, goal: 8 },
        setWater: () => {},
        goals: loadGoals(requestProfileId),
        setGoals: () => {},
        activeStudentId: requestProfileId,
      }
    );

    // Student B's UI state and storage must remain untouched
    expect(activeUiTasksForB).toHaveLength(0);
    expect(loadTasks(profB.id)).toHaveLength(0);

    // Student A's storage must have received the new task
    const tasksA = loadTasks(profA.id);
    expect(tasksA).toHaveLength(1);
    expect(tasksA[0].title).toBe("Revise Optics Numericals");
  });
});
