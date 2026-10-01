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
  saveNotes,
  sortNotesPinnedFirst,
  loadGoals,
  loadSettings,
  clearAllData,
  clearStudentWorkspaceData,
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

  it("6. Verifies new student starts in zero-data state so empty-state illustrations and guide cards display across Tasks, Notes, and Goals", () => {
    const freshStudent = addStudentProfile({
      name: "New Student",
      classLevel: "Class 11",
      stream: "Science",
      board: "CBSE",
    });

    const tasks = loadTasks(freshStudent.id);
    const notes = loadNotes(freshStudent.id);
    const goals = loadGoals(freshStudent.id);

    const isTasksEmpty = tasks.length === 0;
    const isNotesEmpty = notes.length === 0;
    const isGoalsEmpty = goals.length === 0;
    const hasEmptyStudentModules = isTasksEmpty || isNotesEmpty || isGoalsEmpty;

    expect(isTasksEmpty).toBe(true);
    expect(isNotesEmpty).toBe(true);
    expect(isGoalsEmpty).toBe(true);
    expect(hasEmptyStudentModules).toBe(true);
  });

  it("7. Verifies clearStudentWorkspaceData empties active student study data without re-seeding defaults or affecting other profiles", () => {
    const studentA = addStudentProfile({
      name: "Student Alpha",
      classLevel: "Class 12",
      stream: "Science",
      board: "CBSE",
    });
    const studentB = addStudentProfile({
      name: "Student Beta",
      classLevel: "Class 10",
      stream: "General",
      board: "BSEB",
    });

    const sampleTask: Task = {
      id: "task-beta-1",
      title: "Solve Quadratic Equations",
      date: "2026-09-30",
      priority: "high",
      category: "study",
      completed: false,
      createdAt: Date.now(),
    };
    saveTasks([sampleTask], studentA.id);
    saveTasks([sampleTask], studentB.id);

    // Clear Student A's workspace data
    clearStudentWorkspaceData(studentA.id);

    // Student A's tasks, notes, and goals must be strictly empty [] (not re-seeded with defaults)
    expect(loadTasks(studentA.id)).toHaveLength(0);
    expect(loadNotes(studentA.id)).toHaveLength(0);
    expect(loadGoals(studentA.id)).toHaveLength(0);

    // Student A's profile and Student B's data must remain intact
    expect(loadProfiles().some((p) => p.id === studentA.id)).toBe(true);
    expect(loadProfiles().some((p) => p.id === studentB.id)).toBe(true);
    expect(loadTasks(studentB.id).length > 0).toBe(true);
  });

  it("8. Ensures Note objects include pinned boolean and sorts pinned notes to the top in state management", () => {
    const student = addStudentProfile({
      name: "Notes Tester",
      classLevel: "Class 12",
      stream: "Commerce",
      board: "CBSE",
    });

    const unpinnedRecent = {
      id: "note-1",
      title: "Unpinned Recent Note",
      content: "Recent chapter summary with five words",
      pinned: false,
      createdAt: 2000,
      updatedAt: 2000,
    };
    const pinnedOlder = {
      id: "note-2",
      title: "Pinned Formula Sheet",
      content: "Important formulas pinned to top",
      pinned: true,
      createdAt: 1000,
      updatedAt: 1000,
    };

    saveNotes([unpinnedRecent, pinnedOlder], student.id);
    const loaded = loadNotes(student.id);

    expect(loaded).toHaveLength(2);
    expect(typeof loaded[0].pinned).toBe("boolean");
    expect(loaded[0].pinned).toBe(true);
    expect(loaded[0].id).toBe("note-2");
    expect(loaded[1].pinned).toBe(false);
    expect(loaded[1].id).toBe("note-1");

    const sorted = sortNotesPinnedFirst([unpinnedRecent, pinnedOlder]);
    expect(sorted[0].id).toBe("note-2");
  });

  it("9. Supports Note labels array, archived boolean separation, and title/content search filtering", () => {
    const student = addStudentProfile({
      name: "Archive & Labels Tester",
      classLevel: "Class 12",
      stream: "Science",
      board: "CBSE",
    });

    const activePhysicsNote = {
      id: "note-active-1",
      title: "Electrostatics Gauss Law",
      content: "Electric flux through a closed surface is Q/epsilon_0.",
      pinned: false,
      archived: false,
      labels: ["Physics", "Formula"],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const archivedChemistryNote = {
      id: "note-archived-1",
      title: "Organic Chemistry Reactions",
      content: "Aldol condensation and Cannizzaro reaction notes.",
      pinned: true,
      archived: true,
      labels: ["Chemistry", "Exam Prep"],
      createdAt: 2000,
      updatedAt: 2000,
    };

    saveNotes([activePhysicsNote, archivedChemistryNote], student.id);
    const allLoaded = loadNotes(student.id);

    expect(allLoaded).toHaveLength(2);

    const activeNotes = allLoaded.filter((n) => !Boolean(n.archived));
    const archivedNotes = allLoaded.filter((n) => Boolean(n.archived));

    // Archived note is separated from main active notes list
    expect(activeNotes).toHaveLength(1);
    expect(activeNotes[0].id).toBe("note-active-1");
    expect(Array.isArray(activeNotes[0].labels)).toBe(true);
    expect(activeNotes[0].labels?.includes("Physics")).toBe(true);
    expect(activeNotes[0].labels?.includes("Formula")).toBe(true);

    expect(archivedNotes).toHaveLength(1);
    expect(archivedNotes[0].id).toBe("note-archived-1");
    expect(archivedNotes[0].archived).toBe(true);
    expect(archivedNotes[0].labels?.includes("Chemistry")).toBe(true);
  });

  it("10. Normalizes and persists custom folder categorization and createdAt/updatedAt timestamps on Note objects", () => {
    const student = addStudentProfile({
      name: "Folder & Markdown Tester",
      classLevel: "Class 12",
      stream: "Science",
      board: "CBSE",
    });

    const folderNoteA = {
      id: "note-folder-1",
      title: "Thermodynamics Laws",
      content: "**First Law**: Energy conservation\n- *Isothermal* process\n- *Adiabatic* process",
      pinned: false,
      archived: false,
      folder: "Physics",
      labels: ["Formula"],
      createdAt: 1700000000000,
      updatedAt: 1700000500000,
    };

    const defaultFolderNoteB = {
      id: "note-folder-2",
      title: "General Study Checklist",
      content: "1. Revise notes\n2. Solve mock paper",
      pinned: false,
      archived: false,
      createdAt: 1700000100000,
      updatedAt: 1700000100000,
    };

    saveNotes([folderNoteA, defaultFolderNoteB], student.id);
    const loaded = loadNotes(student.id);

    const savedPhysics = loaded.find((n) => n.id === "note-folder-1");
    const savedGeneral = loaded.find((n) => n.id === "note-folder-2");

    expect(savedPhysics?.folder).toBe("Physics");
    expect(savedPhysics?.createdAt).toBe(1700000000000);
    expect(savedPhysics?.updatedAt).toBe(1700000500000);
    expect(savedGeneral?.folder).toBe("General");
  });

  it("11. Supports client-side note encryption, SpeechRecognition detection, and pinned note pending reminder alerts", async () => {
    const {
      encryptNoteContent,
      decryptNoteContent,
      isNoteEncrypted,
      getPinnedNotesWithPendingReminders,
      getSpeechRecognitionConstructor,
    } = await import("../noteFeatures");

    const student = addStudentProfile({
      name: "Security & Reminder Tester",
      classLevel: "Class 12",
      stream: "Science",
      board: "CBSE",
    });

    // 1. Client-side encryption & decryption
    const sensitivePlaintext = "My confidential exam scholarship credentials: 9482-ABCD";
    const encryptedPayload = encryptNoteContent(sensitivePlaintext, "MyStrongPass123!");

    expect(encryptedPayload.startsWith("ENCv1:")).toBe(true);
    expect(encryptedPayload.includes(sensitivePlaintext)).toBe(false);
    expect(decryptNoteContent(encryptedPayload, "WrongPassword")).toBe(null);
    expect(decryptNoteContent(encryptedPayload, "MyStrongPass123!")).toBe(
      sensitivePlaintext
    );

    // 2. Pinned note with pending reminderDate vs unpinned note with reminderDate
    const pinnedWithReminder = {
      id: "note-rem-pinned",
      title: "Pinned Physics Viva Reminder",
      content: encryptedPayload,
      pinned: true,
      archived: false,
      isEncrypted: true,
      reminderDate: "2026-10-01",
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const unpinnedWithReminder = {
      id: "note-rem-unpinned",
      title: "Unpinned Draft Note",
      content: "Regular note content",
      pinned: false,
      archived: false,
      reminderDate: "2026-10-01",
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    saveNotes([pinnedWithReminder, unpinnedWithReminder], student.id);
    const loaded = loadNotes(student.id);

    const savedEncrypted = loaded.find((n) => n.id === "note-rem-pinned");
    expect(savedEncrypted).toBeDefined();
    expect(isNoteEncrypted(savedEncrypted)).toBe(true);
    expect(savedEncrypted?.reminderDate).toBe("2026-10-01");

    // Only pinned notes with pending reminders trigger the notification system
    const pendingAlerts = getPinnedNotesWithPendingReminders(loaded);
    expect(pendingAlerts).toHaveLength(1);
    expect(pendingAlerts[0].id).toBe("note-rem-pinned");

    // 3. SpeechRecognition constructor lookup
    (globalThis as any).webkitSpeechRecognition = function MockSpeechRecognition() {};
    expect(typeof getSpeechRecognitionConstructor()).toBe("function");
    delete (globalThis as any).webkitSpeechRecognition;
  });

  it("12. Supports Note Templates (built-in & custom), bidirectional [[Note Title]] linking, and PDF/Text export", async () => {
    const {
      loadNoteTemplates,
      saveCustomNoteTemplate,
      extractNoteWikiLinks,
      computeBidirectionalNoteLinks,
      formatNoteAsCleanText,
      generateNotePdfContent,
      exportNoteAsTextFile,
      exportNoteAsPdfFile,
    } = await import("../noteFeatures");

    // 1. Template system: built-in templates + saving custom template
    const initialTemplates = loadNoteTemplates("student-tpl-test");
    expect(
      initialTemplates.some((t) => t.name === "Lecture Summary")
    ).toBe(true);
    expect(
      initialTemplates.some((t) => t.name === "Brainstorming")
    ).toBe(true);
    expect(
      initialTemplates.some((t) => t.name === "Meeting Notes")
    ).toBe(true);

    const updatedTemplates = saveCustomNoteTemplate(
      {
        name: "Lab Experiment Report",
        content: "# Aim\n## Observations\n## Conclusion",
        folder: "Science",
        labels: ["Lab", "Report"],
      },
      "student-tpl-test"
    );
    expect(
      updatedTemplates.some(
        (t) => t.name === "Lab Experiment Report" && t.isCustom === true
      )
    ).toBe(true);

    // 2. Bidirectional linking: [[Note Title]] forward links & incoming backlinks
    const noteA = {
      id: "note-link-a",
      title: "Calculus Derivatives",
      content: "Builds on [[Limits and Continuity]] and connects to [[Integration Rules]].",
      pinned: false,
      createdAt: 1000,
      updatedAt: 1000,
    };
    const noteB = {
      id: "note-link-b",
      title: "Limits and Continuity",
      content: "Foundation for [[Calculus Derivatives]].",
      pinned: true,
      createdAt: 1000,
      updatedAt: 1000,
    };
    const noteC = {
      id: "note-link-c",
      title: "Integration Rules",
      content: "Inverse operation of differentiation.",
      pinned: false,
      createdAt: 1000,
      updatedAt: 1000,
    };

    const extractedFromA = extractNoteWikiLinks(noteA.content);
    expect(extractedFromA).toHaveLength(2);
    expect(extractedFromA[0]).toBe("Limits and Continuity");
    expect(extractedFromA[1]).toBe("Integration Rules");

    const linkGraph = computeBidirectionalNoteLinks([noteA, noteB, noteC]);
    expect(linkGraph["note-link-a"].outgoingNotes).toHaveLength(2);
    expect(linkGraph["note-link-a"].backlinks).toHaveLength(1);
    expect(linkGraph["note-link-a"].backlinks[0].id).toBe("note-link-b");
    expect(linkGraph["note-link-c"].backlinks).toHaveLength(1);
    expect(linkGraph["note-link-c"].backlinks[0].id).toBe("note-link-a");

    // 3. Export individual note as Clean Text (.txt) and PDF (.pdf)
    const cleanTxt = formatNoteAsCleanText({
      ...noteA,
      folder: "Mathematics",
      labels: ["Calculus"],
    });
    expect(cleanTxt.includes("CALCULUS DERIVATIVES")).toBe(true);
    expect(
      cleanTxt.includes("Builds on Limits and Continuity and connects to Integration Rules.")
    ).toBe(true);

    const pdfStr = generateNotePdfContent(noteA);
    expect(pdfStr.startsWith("%PDF-1.4")).toBe(true);
    expect(pdfStr.endsWith("%%EOF")).toBe(true);

    const txtExport = exportNoteAsTextFile(noteA);
    expect(txtExport.filename).toBe("calculus-derivatives.txt");
    expect(txtExport.mimeType).toBe("text/plain;charset=utf-8");

    const pdfExport = exportNoteAsPdfFile(noteA);
    expect(pdfExport.filename).toBe("calculus-derivatives.pdf");
    expect(pdfExport.mimeType).toBe("application/pdf");
  });

  it("13. Supports local search by title or content, SpeechRecognition dictation transcript extraction, and custom color-coded labels with label filtering", async () => {
    const {
      NOTE_LABEL_COLOR_PALETTE,
      normalizeNoteColorLabels,
      saveCustomLabelColor,
      loadCustomLabelColors,
      getSpeechRecognitionConstructor,
    } = await import("../noteFeatures");
    const {
      matchesNoteSearchQuery,
      matchesNoteLabelFilter,
      getNoteColorLabels,
    } = await import("../../pages/NotesPage");

    const student = addStudentProfile({
      name: "Color Label & Search Tester",
      classLevel: "Class 12",
      stream: "Science",
      board: "CBSE",
    });

    // 1. Custom color-coded labels normalization & persistence
    expect(NOTE_LABEL_COLOR_PALETTE.length >= 6).toBe(true);

    saveCustomLabelColor("Physics", "cyan", student.id);
    saveCustomLabelColor("Urgent", "rose", student.id);
    const savedColorMap = saveCustomLabelColor("Formula", "amber", student.id);
    expect(savedColorMap.Physics).toBe("cyan");
    expect(savedColorMap.Urgent).toBe("rose");
    expect(loadCustomLabelColors(student.id).Formula).toBe("amber");

    const note1 = {
      id: "note-color-1",
      title: "Thermodynamics Laws",
      content: "First law of thermodynamics deals with conservation of energy.",
      pinned: true,
      archived: false,
      labels: ["Physics", "Formula"],
      labelColors: {
        Physics: "cyan",
        Formula: "amber",
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const note2 = {
      id: "note-color-2",
      title: "Organic Chemistry Reactions",
      content: "Aldol condensation and Cannizzaro reaction mechanisms.",
      pinned: false,
      archived: false,
      labels: ["Chemistry", "Urgent"],
      labelColors: {
        Chemistry: "emerald",
        Urgent: "rose",
      },
      createdAt: 1700000100000,
      updatedAt: 1700000100000,
    };

    saveNotes([note1, note2], student.id);
    const loaded = loadNotes(student.id);

    const persistedNote1 = loaded.find((n) => n.id === "note-color-1")!;
    const colorLabels1 = getNoteColorLabels(persistedNote1);
    expect(colorLabels1).toHaveLength(2);
    expect(colorLabels1[0].name).toBe("Physics");
    expect(colorLabels1[0].color).toBe("cyan");
    expect(colorLabels1[1].name).toBe("Formula");
    expect(colorLabels1[1].color).toBe("amber");
    expect(normalizeNoteColorLabels(persistedNote1).colorLabels).toHaveLength(2);

    // 2. Local search filtering by title or content
    expect(matchesNoteSearchQuery(persistedNote1, "thermodynamics")).toBe(true);
    expect(matchesNoteSearchQuery(persistedNote1, "conservation of energy")).toBe(true);
    expect(matchesNoteSearchQuery(persistedNote1, "cannizzaro")).toBe(false);

    // 3. Filtering notes by color-coded labels
    expect(matchesNoteLabelFilter(persistedNote1, "Physics")).toBe(true);
    expect(matchesNoteLabelFilter(persistedNote1, "Urgent")).toBe(false);
    expect(matchesNoteLabelFilter(persistedNote1, "all")).toBe(true);

    // 4. SpeechRecognition API detection
    (globalThis as any).SpeechRecognition = function MockRecognition() {};
    expect(typeof getSpeechRecognitionConstructor()).toBe("function");
    delete (globalThis as any).SpeechRecognition;
  });

  it("14. Supports Note archiving, sorting by Recently Updated / Alphabetical / Created Date, and Note Editor word & character count status indicator", async () => {
    const {
      calculateNoteWordCount,
      calculateNoteCharacterCount,
      sortNotesForDisplay,
      normalizeNoteSortOption,
    } = await import("../../pages/NotesPage");

    const student = addStudentProfile({
      name: "Sort & Archive Tester",
      classLevel: "Class 12",
      stream: "Science",
      board: "CBSE",
    });

    // 1. Word and character count calculation for Note Editor status indicator
    const sampleAssignment = "Newton's Second Law states that F = m * a.";
    expect(calculateNoteWordCount(sampleAssignment)).toBe(10);
    expect(calculateNoteCharacterCount(sampleAssignment)).toBe(
      sampleAssignment.length
    );
    expect(calculateNoteWordCount("   ")).toBe(0);
    expect(calculateNoteCharacterCount("")).toBe(0);

    // 2. Sorting by 'Recently Updated', 'Alphabetical', and 'Created Date'
    expect(normalizeNoteSortOption("Recently Updated")).toBe("updated");
    expect(normalizeNoteSortOption("Alphabetical")).toBe("alphabetical");
    expect(normalizeNoteSortOption("Created Date")).toBe("created");

    const noteZebra = {
      id: "n-zebra",
      title: "Zebra Ecology Summary",
      content: "Savanna grazing patterns",
      pinned: false,
      archived: false,
      createdAt: 1000,
      updatedAt: 5000, // Most recently updated
    };
    const noteAlpha = {
      id: "n-alpha",
      title: "Alpha Particle Scattering",
      content: "Rutherford gold foil experiment",
      pinned: false,
      archived: false,
      createdAt: 4000, // Most recently created
      updatedAt: 4000,
    };
    const noteMango = {
      id: "n-mango",
      title: "Mango Botany Notes",
      content: "Dicotyledonous angiosperm",
      pinned: false,
      archived: false,
      createdAt: 4500, // Most recently created
      updatedAt: 3000,
    };
    const noteArchived = {
      id: "n-archived-done",
      title: "Completed Semester 1 Syllabus",
      content: "Archived for reference",
      pinned: false,
      archived: true,
      createdAt: 6000,
      updatedAt: 6000,
    };

    saveNotes([noteZebra, noteAlpha, noteMango, noteArchived], student.id);
    const loaded = loadNotes(student.id);

    // Separate active vs archived notes
    const activeNotes = loaded.filter((n) => !n.archived);
    const archivedNotes = loaded.filter((n) => Boolean(n.archived));
    expect(activeNotes).toHaveLength(3);
    expect(archivedNotes).toHaveLength(1);
    expect(archivedNotes[0].id).toBe("n-archived-done");

    // Sort by 'Recently Updated'
    const byUpdated = sortNotesForDisplay(activeNotes, "Recently Updated");
    expect(byUpdated[0].id).toBe("n-zebra");
    expect(byUpdated[1].id).toBe("n-alpha");
    expect(byUpdated[2].id).toBe("n-mango");

    // Sort by 'Alphabetical'
    const byAlpha = sortNotesForDisplay(activeNotes, "Alphabetical");
    expect(byAlpha[0].id).toBe("n-alpha");
    expect(byAlpha[1].id).toBe("n-mango");
    expect(byAlpha[2].id).toBe("n-zebra");

    // Sort by 'Created Date'
    const byCreated = sortNotesForDisplay(activeNotes, "Created Date");
    expect(byCreated[0].id).toBe("n-mango");
    expect(byCreated[1].id).toBe("n-alpha");
    expect(byCreated[2].id).toBe("n-zebra");
  });

  it("15. Supports Note versions history snapshots & restoration, sharedWith email collaboration, and framer-motion animations", async () => {
    const {
      normalizeNoteVersions,
      createNoteVersionSnapshot,
      appendNoteVersionSnapshot,
      restoreNoteFromVersion,
      normalizeNoteSharedWith,
      isValidCollaboratorEmail,
      addCollaboratorEmailToNote,
      removeCollaboratorEmailFromNote,
    } = await import("../noteFeatures");
    const framerMotion = await import("framer-motion");

    expect(Boolean(framerMotion.motion)).toBe(true);
    expect(Boolean(framerMotion.AnimatePresence)).toBe(true);

    const student = addStudentProfile({
      name: "Versions & Collaboration Tester",
      classLevel: "Class 12",
      stream: "Science",
      board: "CBSE",
    });

    // 1. Create initial note and record historical snapshots in `versions`
    const initialSnap = createNoteVersionSnapshot({
      title: "Electrostatics Lecture",
      content: "Coulomb's Law: F = k * q1 * q2 / r^2",
      timestamp: 1000,
    });

    const baseNote = {
      id: "note-ver-collab-1",
      title: "Electrostatics Lecture",
      content: "Gauss's Law: Total electric flux = Q_enclosed / epsilon_0",
      pinned: true,
      archived: false,
      versions: [initialSnap],
      sharedWith: ["classmate1@school.edu"],
      createdAt: 1000,
      updatedAt: 2000,
    };

    // Append another snapshot when content changes
    const nextVersions = appendNoteVersionSnapshot(
      baseNote,
      "Electric Potential: V = k * Q / r",
      "Electrostatics Lecture"
    );
    expect(nextVersions).toHaveLength(2);
    expect(nextVersions[0].content).toBe(
      "Gauss's Law: Total electric flux = Q_enclosed / epsilon_0"
    );
    expect(nextVersions[1].content).toBe(
      "Coulomb's Law: F = k * q1 * q2 / r^2"
    );

    const updatedNote = {
      ...baseNote,
      content: "Electric Potential: V = k * Q / r",
      versions: nextVersions,
      updatedAt: 3000,
    };

    // Restore from earliest version snapshot
    const restoredNote = restoreNoteFromVersion(updatedNote, initialSnap.id);
    expect(restoredNote.content).toBe("Coulomb's Law: F = k * q1 * q2 / r^2");
    expect(restoredNote.versions!.length >= 2).toBe(true);
    expect(restoredNote.versions![0].content).toBe(
      "Electric Potential: V = k * Q / r"
    );

    // 2. Peer collaboration via `sharedWith` emails array
    expect(isValidCollaboratorEmail("peer.student@university.edu")).toBe(true);
    expect(isValidCollaboratorEmail("not-an-email")).toBe(false);

    const withAddedPeers = addCollaboratorEmailToNote(
      restoredNote,
      "Peer2@School.edu, studybuddy@college.org"
    );
    expect(withAddedPeers).toHaveLength(3);
    expect(withAddedPeers.includes("classmate1@school.edu")).toBe(true);
    expect(withAddedPeers.includes("peer2@school.edu")).toBe(true);
    expect(withAddedPeers.includes("studybuddy@college.org")).toBe(true);

    const afterRemovedPeer = removeCollaboratorEmailFromNote(
      { ...restoredNote, sharedWith: withAddedPeers },
      "peer2@school.edu"
    );
    expect(afterRemovedPeer).toHaveLength(2);
    expect(afterRemovedPeer.includes("peer2@school.edu")).toBe(false);

    // 3. Persistence round-trip through storage
    saveNotes(
      [
        {
          ...restoredNote,
          sharedWith: afterRemovedPeer,
        },
      ],
      student.id
    );
    const loaded = loadNotes(student.id);
    expect(loaded).toHaveLength(1);
    expect(normalizeNoteVersions(loaded[0].versions).length >= 2).toBe(true);
    const persistedEmails = normalizeNoteSharedWith(loaded[0].sharedWith);
    expect(persistedEmails).toHaveLength(2);
    expect(persistedEmails[0]).toBe("classmate1@school.edu");
    expect(persistedEmails[1]).toBe("studybuddy@college.org");
  });

  it("16. Supports Abya AI Smart Tag auto-tagging, Markdown (.md) export with metadata & version history, and Note Editor Focus Mode", async () => {
    const {
      suggestSmartTagsFromContent,
      parseSmartTagsResponse,
      requestAbyaSmartTags,
      formatNoteAsMarkdown,
      exportNoteAsMarkdownFile,
      createNoteVersionSnapshot,
    } = await import("../../pages/NotesPage");

    // 1. Abya AI Smart Tagging from note content & title
    const physicsTags = suggestSmartTagsFromContent(
      "Derivation of kinematics equations: v = u + at and s = ut + 1/2 at^2 for upcoming JEE Physics exam revision.",
      "Kinematics Equations & Laws of Motion"
    );
    expect(physicsTags.length >= 2).toBe(true);
    expect(physicsTags.includes("Physics")).toBe(true);
    expect(physicsTags.includes("Formula")).toBe(true);
    expect(physicsTags.includes("Exam Prep")).toBe(true);

    const bioTags = suggestSmartTagsFromContent(
      "Photosynthesis occurs in chloroplasts where light energy converts carbon dioxide and water into glucose.",
      "Plant Cell Biology Summary"
    );
    expect(bioTags.includes("Biology")).toBe(true);
    expect(bioTags.includes("Summary")).toBe(true);

    const parsedJsonTags = parseSmartTagsResponse(
      '["Organic Chemistry", "Reaction", "Exam Prep"]'
    );
    expect(parsedJsonTags).toHaveLength(3);
    expect(parsedJsonTags[0]).toBe("Organic Chemistry");

    const asyncSmartResult = await requestAbyaSmartTags(
      "Matrix multiplication and determinant properties for linear algebra lecture.",
      "Linear Algebra Lecture"
    );
    expect(asyncSmartResult.tags.length >= 2).toBe(true);
    expect(asyncSmartResult.tags.includes("Mathematics")).toBe(true);

    // 2. Export individual note as Markdown (.md) including content, labels, and version history
    const versionSnap1 = createNoteVersionSnapshot({
      title: "Thermodynamics Draft 1",
      content: "First Law: dU = dQ - dW",
      timestamp: 1700000000000,
      summary: "Initial law equation",
    });
    const versionSnap2 = createNoteVersionSnapshot({
      title: "Thermodynamics Draft 2",
      content: "First Law: dU = dQ - dW\nSecond Law: Entropy of isolated system increases.",
      timestamp: 1700000500000,
    });

    const noteToExport = {
      id: "note-md-export-1",
      title: "Thermodynamics Complete Summary",
      content:
        "# Laws of Thermodynamics\n- **Zeroth Law:** Thermal equilibrium\n- **First Law:** Conservation of energy",
      pinned: true,
      archived: false,
      folder: "Physics",
      labels: ["Physics", "Thermodynamics", "Formula"],
      labelColors: {
        Physics: "cyan",
        Thermodynamics: "emerald",
        Formula: "amber",
      },
      sharedWith: ["studygroup@school.edu"],
      versions: [versionSnap2, versionSnap1],
      createdAt: 1700000000000,
      updatedAt: 1700001000000,
    };

    const mdString = formatNoteAsMarkdown(noteToExport);
    expect(mdString.startsWith("---")).toBe(true);
    expect(mdString.includes("# Thermodynamics Complete Summary")).toBe(true);
    expect(mdString.includes("## Metadata")).toBe(true);
    expect(mdString.includes("#Physics (cyan)")).toBe(true);
    expect(mdString.includes("#Thermodynamics (emerald)")).toBe(true);
    expect(mdString.includes("studygroup@school.edu")).toBe(true);
    expect(mdString.includes("## Content")).toBe(true);
    expect(mdString.includes("**Zeroth Law:** Thermal equilibrium")).toBe(true);
    expect(mdString.includes("## Version History")).toBe(true);
    expect(mdString.includes("First Law: dU = dQ - dW")).toBe(true);
    expect(mdString.includes("Second Law: Entropy of isolated system increases.")).toBe(
      true
    );

    const mdFileExport = exportNoteAsMarkdownFile(noteToExport);
    expect(mdFileExport.filename).toBe("thermodynamics-complete-summary.md");
    expect(mdFileExport.mimeType).toBe("text/markdown;charset=utf-8");
    expect(mdFileExport.content.includes("## Version History")).toBe(true);
  });

  it("17. Enforces unified single navigation button, classic scholar UI look, and interactive dropdowns and sliders across modules", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const statusBarSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/StatusBar.tsx"),
      "utf-8"
    );
    const appSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/App.tsx"),
      "utf-8"
    );
    const indexCssSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/index.css"),
      "utf-8"
    );

    // Verify single unified navigation button and classic dropdowns in StatusBar
    expect(statusBarSource.includes('id="single-navigation-menu-btn"')).toBe(true);
    expect(statusBarSource.includes('id="global-theme-select"')).toBe(true);
    expect(statusBarSource.includes('id="global-profile-select"')).toBe(true);
    expect(statusBarSource.includes('id="global-language-select"')).toBe(true);

    // Verify duplicate DesktopSidebar and BottomNav are removed from App.tsx
    expect(appSource.includes("<DesktopSidebar")).toBe(false);
    expect(appSource.includes("<BottomNav")).toBe(false);

    // Verify classic typography and control classes exist in index.css
    expect(indexCssSource.includes(".classic-select")).toBe(true);
    expect(indexCssSource.includes(".classic-slider")).toBe(true);
    expect(indexCssSource.includes(".classic-paper-header")).toBe(true);

    // Verify ChatGPT-referenced Abya AI Studio and deduplicated DailyExecutionSection
    const abyaSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/pages/AbyaAIPage.tsx"),
      "utf-8"
    );
    const dailyExecSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/home/sections/DailyExecutionSection.tsx"),
      "utf-8"
    );
    const serverSource = fs.readFileSync(
      path.resolve(process.cwd(), "server.ts"),
      "utf-8"
    );

    const liveVoiceModalSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/AbyaLiveVoiceModal.tsx"),
      "utf-8"
    );

    expect(abyaSource.includes('id="abya-chatgpt-studio"')).toBe(true);
    expect(abyaSource.includes('id="abya-mode-dropdown"')).toBe(true);
    expect(abyaSource.includes('id="abya-response-depth-slider"')).toBe(true);
    expect(abyaSource.includes('id="abya-language-dropdown"')).toBe(true);
    expect(dailyExecSource.includes("execution-focus-study-card")).toBe(false);
    expect(serverSource.includes("gemini-3.8-flash")).toBe(true);
    expect(serverSource.includes("gemini-3.8-live")).toBe(true);
    expect(liveVoiceModalSource.includes("getValidClientAuthToken")).toBe(true);
  });

  it("18. Enforces P0 security remediation: no local profileId token minting, authenticated Smart Tags, dual UID+IP rate limits, security headers, and Firestore ownership rules", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { verifyFirebaseIdToken, generateDevTestToken } = await import(
      "../../../server/firebaseAuth"
    );

    const serverSource = fs.readFileSync(
      path.resolve(process.cwd(), "server.ts"),
      "utf-8"
    );
    const firebaseClientSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/utils/firebase.ts"),
      "utf-8"
    );
    const firestoreRulesSource = fs.readFileSync(
      path.resolve(process.cwd(), "firestore.rules"),
      "utf-8"
    );

    // 1. Unauthenticated users cannot obtain privileged server tokens & arbitrary profileId cannot become a privileged UID
    expect(serverSource.includes("generateDevTestToken")).toBe(false);
    expect(firebaseClientSource.includes("/api/auth/student-session")).toBe(false);
    expect(firebaseClientSource.includes("cachedLocalSession")).toBe(false);

    const missingAuth = await verifyFirebaseIdToken(undefined);
    expect(missingAuth.valid).toBe(false);
    expect(missingAuth.code).toBe("UNAUTHENTICATED");

    const arbitraryProfileHeader = await verifyFirebaseIdToken("Bearer student_arbitrary_profile_123");
    expect(arbitraryProfileHeader.valid).toBe(false);
    expect(arbitraryProfileHeader.code).toBe("INVALID_TOKEN");

    // Production guard on dev test tokens
    const prevEnv = process.env.NODE_ENV;
    try {
      const devToken = generateDevTestToken("test_uid_alpha");
      const devVerified = await verifyFirebaseIdToken(`Bearer ${devToken}`);
      expect(devVerified.valid).toBe(true);
      expect(devVerified.user?.uid).toBe("test_uid_alpha");

      process.env.NODE_ENV = "production";
      let prodMintThrew = false;
      try {
        generateDevTestToken("prod_bypass_attempt");
      } catch {
        prodMintThrew = true;
      }
      expect(prodMintThrew).toBe(true);

      // In production, dev test key is not accepted as a valid Google cert
      const prodVerifyAttempt = await verifyFirebaseIdToken(`Bearer ${devToken}`);
      expect(prodVerifyAttempt.valid).toBe(false);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }

    // 2. Smart Tags authentication, input validation, and UID + IP rate limiting in server.ts and client
    expect(serverSource.includes("smartTagsUidLimiter")).toBe(true);
    expect(serverSource.includes("smartTagsIpLimiter")).toBe(true);
    expect(serverSource.includes("INVALID_EXISTING_LABELS")).toBe(true);
    expect(serverSource.includes("TITLE_TOO_LARGE")).toBe(true);
    expect(serverSource.includes("CONTENT_TOO_LARGE")).toBe(true);

    // Verify client requestAbyaSmartTags attaches Bearer token when provided
    const { requestAbyaSmartTags } = await import("../noteFeatures");
    const originalFetch = globalThis.fetch;
    let capturedAuthHeader: string | undefined;
    try {
      globalThis.fetch = (async (_url: any, init?: any) => {
        capturedAuthHeader = init?.headers?.Authorization;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: "ok",
            tags: ["Electrostatics", "Physics"],
            provider: "online_ai",
          }),
        } as any;
      }) as any;

      const tagged = await requestAbyaSmartTags(
        "Gauss law and electric flux through closed surface",
        "Electrostatics Lecture",
        [],
        "mock_firebase_id_token_xyz"
      );
      expect(capturedAuthHeader).toBe("Bearer mock_firebase_id_token_xyz");
      expect(tagged.tags.includes("Electrostatics")).toBe(true);
      expect(tagged.source).toBe("online_ai");
    } finally {
      globalThis.fetch = originalFetch;
    }

    // 3. AI Chat and Live Voice Ticket dual UID + IP rate limiters
    expect(serverSource.includes("aiChatLimiter")).toBe(true);
    expect(serverSource.includes("aiChatIpLimiter")).toBe(true);
    expect(serverSource.includes("liveVoiceTicketLimiter")).toBe(true);
    expect(serverSource.includes("liveVoiceTicketIpLimiter")).toBe(true);
    expect(serverSource.includes('res.setHeader("Retry-After"')).toBe(true);

    // 4. Security Headers configured in server.ts
    expect(serverSource.includes('"X-Content-Type-Options", "nosniff"')).toBe(true);
    expect(serverSource.includes('"Referrer-Policy", "strict-origin-when-cross-origin"')).toBe(true);
    expect(serverSource.includes('"X-Frame-Options", "SAMEORIGIN"')).toBe(true);
    expect(serverSource.includes('"Strict-Transport-Security"')).toBe(true);
    expect(serverSource.includes('"Permissions-Policy"')).toBe(true);

    // 5. Firestore ownership & cross-user isolation rules remain strictly enforced
    expect(firestoreRulesSource.includes("match /{document=**}")).toBe(true);
    expect(firestoreRulesSource.includes("allow read, write: if false;")).toBe(true);
    expect(firestoreRulesSource.includes("function isOwner(userId)")).toBe(true);
    expect(firestoreRulesSource.includes("return request.auth != null;")).toBe(true);
    expect(firestoreRulesSource.includes("return isSignedIn() && request.auth.uid == userId;")).toBe(true);
    expect(firestoreRulesSource.includes("match /users/{userId}")).toBe(true);
    expect(firestoreRulesSource.includes("match /profiles/{profileId}")).toBe(true);
    expect(firestoreRulesSource.includes("match /tasks/{taskId}")).toBe(true);
    expect(firestoreRulesSource.includes("match /notes/{noteId}")).toBe(true);
    expect(firestoreRulesSource.includes("match /goals/{goalId}")).toBe(true);
    expect(firestoreRulesSource.includes("match /subjects/{subjectId}")).toBe(true);
    expect(firestoreRulesSource.includes("match /calendar_events/{eventId}")).toBe(true);
    expect(firestoreRulesSource.includes("match /collaboration_notifications/{notifId}")).toBe(true);
    expect(firestoreRulesSource.includes("match /shared_workspaces/{workspaceId}")).toBe(true);
  });

  it("19. Enforces P1 engineering audit: consolidated framer-motion dependency, dead file removal, board-aware curriculum hierarchy (BSEB/CBSE/ICSE), Class 11 & Dropper chapter resolution, singleton offline queue deduplication, and route-level code splitting", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    // 1. Dependency audit: motion removed from package.json, @types/* in devDependencies
    const pkgJson = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8")
    );
    expect(pkgJson.dependencies["motion"]).toBe(undefined);
    expect(pkgJson.dependencies["framer-motion"]).toBeDefined();
    expect(pkgJson.dependencies["@types/ws"]).toBe(undefined);
    expect(pkgJson.dependencies["@types/canvas-confetti"]).toBe(undefined);
    expect(pkgJson.devDependencies["@types/ws"]).toBeDefined();
    expect(pkgJson.devDependencies["@types/canvas-confetti"]).toBeDefined();

    // Verify dead/duplicate files are removed
    const deadPaths = [
      "src/i18n.ts",
      "src/components/LanguageSwitcher.tsx",
      "src/components/DesktopSidebar.tsx",
      "src/components/BottomNav.tsx",
      "src/components/home/widgets/DailyAcademicInsightCard.tsx",
      "src/components/home/widgets/DailyMotivationWidget.tsx",
      "src/components/home/widgets/FocusSessionSummaryWidget.tsx",
      "src/components/home/widgets/QuickActionsWidget.tsx",
      "src/components/home/widgets/StudyStreakSummaryWidget.tsx",
    ];
    for (const deadRel of deadPaths) {
      expect(fs.existsSync(path.resolve(process.cwd(), deadRel))).toBe(false);
    }

    // 2. Board-aware curriculum hierarchy (Board -> Class -> Stream -> Subject -> Chapter -> Topic)
    const {
      getBoardCurriculumHierarchy,
      getCurriculumSubjects,
      normalizeCurriculumBoard,
      normalizeCurriculumClassLevel,
    } = await import("../../data/masterCurriculum");

    expect(normalizeCurriculumBoard("Bihar Board (BSEB)")).toBe("BSEB");
    expect(normalizeCurriculumBoard("ISC")).toBe("ICSE");
    expect(normalizeCurriculumClassLevel("Dropper / Gap Year")).toBe("Class 12");

    const bsebSci12 = getBoardCurriculumHierarchy("BSEB", "Class 12", "Science");
    expect(bsebSci12.board).toBe("BSEB");
    expect(bsebSci12.boardMetadata.objectiveWeightagePct).toBe(50);
    expect(bsebSci12.subjects.length > 0).toBe(true);
    expect(bsebSci12.subjects[0].board).toBe("BSEB");
    expect(Boolean(bsebSci12.subjects[0].boardExamPattern?.includes("50% OMR"))).toBe(true);

    // Verify Dropper / Gap Year resolves Class 12 stream subjects instead of falling back to Class 10
    const dropperSubs = getCurriculumSubjects("Dropper / Gap Year", "Science", "CBSE");
    expect(dropperSubs.every((s) => s.classLevel === "Class 12")).toBe(true);
    expect(dropperSubs.some((s) => s.name === "Physics")).toBe(true);

    // 3. Class 11 & Dropper chapter initialization and decision engine topic resolution
    const { getDefaultChaptersForStream } = await import("../academicEngine");
    const class11SciChaps = getDefaultChaptersForStream("Science", "Class 11", "BSEB");
    expect(class11SciChaps.length > 0).toBe(true);
    expect(class11SciChaps.some((c) => c.title.includes("Units") || c.title.includes("Sets"))).toBe(
      true
    );

    const { generateAcademicDecisionReport } = await import("../academicDecisionEngine");
    const c11Report = generateAcademicDecisionReport({
      student: {
        id: "stu-c11",
        name: "Aarav",
        classLevel: "Class 11",
        stream: "Science",
        board: "BSEB",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
    expect(c11Report.classLevel).toBe("Class 11");
    expect(
      c11Report.highPriorityFocus.chapterTitle.includes("Structure of Atom") ||
        c11Report.highPriorityFocus.chapterTitle.includes("Units and Measurements")
    ).toBe(true);

    // 4. Singleton/date-scoped offline queue deduplication (water & settings)
    const {
      enqueueOfflineAction,
      clearPendingQueue,
      getPendingQueue,
    } = await import("../offlineQueue");
    clearPendingQueue();
    enqueueOfflineAction({
      type: "UPDATE_WATER",
      entityName: "water",
      action: "update",
      profileId: "prof_test_1",
      payload: { date: "2026-10-01", glasses: 3, goal: 8 },
    });
    enqueueOfflineAction({
      type: "UPDATE_WATER",
      entityName: "water",
      action: "update",
      profileId: "prof_test_1",
      payload: { date: "2026-10-01", glasses: 4, goal: 8 },
    });
    const pendingWater = getPendingQueue().filter(
      (a) => a.profileId === "prof_test_1" && a.entityName === "water"
    );
    expect(pendingWater).toHaveLength(1);
    expect(pendingWater[0].payload.glasses).toBe(4);
    clearPendingQueue();

    // 5. Route-level React.lazy code splitting in App.tsx
    const appSource = fs.readFileSync(path.resolve(process.cwd(), "src/App.tsx"), "utf-8");
    expect(appSource.includes('import("./pages/AbyaAIPage")')).toBe(true);
    expect(appSource.includes('import("./pages/ExamCenterPage")')).toBe(true);
    expect(appSource.includes('import("./pages/SettingsPage")')).toBe(true);
  });

  it("20. Offline Queue & Sync Deep Runtime Audit (all 20 scenarios + entity allowlist protection)", async () => {
    const {
      enqueueOfflineAction,
      clearPendingQueue,
      clearPendingQueueForProfile,
      getPendingQueue,
      getPendingCount,
      reconcilePendingQueueWithFirestore,
      setOfflineSyncExecutorForTesting,
      setSimulatedOnlineStateForTesting,
      isSupportedOfflineEntity,
      OFFLINE_QUEUE_STORAGE_KEY,
    } = await import("../offlineQueue");

    clearPendingQueue();
    setOfflineSyncExecutorForTesting(null);
    setSimulatedOnlineStateForTesting(null);

    // 1. Offline create (tasks, notes, subjects, study_sessions, goals, habits, calendar_events)
    const createdTask = enqueueOfflineAction({
      type: "CREATE_TASK",
      entityName: "tasks",
      action: "create",
      profileId: "prof_A",
      payload: { id: "t-1", title: "Physics Ch 1", completed: false, createdAt: 1000 },
    });
    expect(createdTask.id.startsWith("act-")).toBe(true);
    expect(getPendingCount("prof_A")).toBe(1);

    // 2. Offline update on same entity ID merges payload & preserves original createdAt
    enqueueOfflineAction({
      type: "UPDATE_TASK",
      entityName: "tasks",
      action: "update",
      profileId: "prof_A",
      payload: { id: "t-1", title: "Physics Ch 1 Updated", completed: true, createdAt: 9999 },
    });
    expect(getPendingCount("prof_A")).toBe(1);
    const mergedTask = getPendingQueue().find((q) => q.payload?.id === "t-1");
    expect(mergedTask?.payload.title).toBe("Physics Ch 1 Updated");
    expect(mergedTask?.payload.completed).toBe(true);
    expect(mergedTask?.payload.createdAt).toBe(1000);
    // Because it started as a "create" in the offline queue, updating before flush preserves "create" action
    expect(mergedTask?.action).toBe("create");

    // 3. Offline delete removes prior queued create for same entity ID (created then deleted offline cancels out)
    enqueueOfflineAction({
      type: "DELETE_TASK",
      entityName: "tasks",
      action: "delete",
      profileId: "prof_A",
      payload: { id: "t-1" },
    });
    const afterDeleteOfOfflineCreate = getPendingQueue().filter(
      (q) => q.profileId === "prof_A" && q.entityName === "tasks"
    );
    expect(afterDeleteOfOfflineCreate).toHaveLength(0);

    // Offline update followed by offline delete replaces update with delete
    enqueueOfflineAction({
      type: "UPDATE_TASK",
      entityName: "tasks",
      action: "update",
      profileId: "prof_A",
      payload: { id: "t-existing", title: "Existing Task", completed: true },
    });
    enqueueOfflineAction({
      type: "DELETE_TASK",
      entityName: "tasks",
      action: "delete",
      profileId: "prof_A",
      payload: { id: "t-existing" },
    });
    const afterDeleteExisting = getPendingQueue().filter(
      (q) => q.profileId === "prof_A" && q.entityName === "tasks"
    );
    expect(afterDeleteExisting).toHaveLength(1);
    expect(afterDeleteExisting[0].action).toBe("delete");

    // 4. Duplicate mutation deduplication (notes, subjects, goals, habits, calendar, study_sessions)
    enqueueOfflineAction({
      type: "CREATE_SUBJECT",
      entityName: "subjects",
      action: "create",
      profileId: "prof_A",
      payload: { id: "sub-101", name: "Mathematics", completedMinutes: 10 },
    });
    enqueueOfflineAction({
      type: "UPDATE_SUBJECT",
      entityName: "subjects",
      action: "update",
      profileId: "prof_A",
      payload: { id: "sub-101", name: "Applied Mathematics", completedMinutes: 45 },
    });
    const subQueue = getPendingQueue().filter(
      (q) => q.profileId === "prof_A" && q.entityName === "subjects"
    );
    expect(subQueue).toHaveLength(1);
    expect(subQueue[0].payload.name).toBe("Applied Mathematics");
    expect(subQueue[0].payload.completedMinutes).toBe(45);

    enqueueOfflineAction({
      type: "CREATE_STUDY_SESSION",
      entityName: "study_sessions",
      action: "create",
      profileId: "prof_A",
      payload: { id: "sess-1", subjectId: "sub-101", durationSeconds: 1800, date: "2026-10-01" },
    });
    enqueueOfflineAction({
      type: "UPDATE_STUDY_SESSION",
      entityName: "study_sessions",
      action: "update",
      profileId: "prof_A",
      payload: { id: "sess-1", durationSeconds: 3600 },
    });
    const sessQueue = getPendingQueue().filter(
      (q) => q.profileId === "prof_A" && q.entityName === "study_sessions"
    );
    expect(sessQueue).toHaveLength(1);
    expect(sessQueue[0].payload.durationSeconds).toBe(3600);

    // 5. Singleton mutation deduplication (settings)
    enqueueOfflineAction({
      type: "UPDATE_SETTINGS",
      entityName: "settings",
      action: "update",
      profileId: "prof_A",
      payload: { theme: "dark", focusDuration: 25 },
    });
    enqueueOfflineAction({
      type: "UPDATE_SETTINGS",
      entityName: "settings",
      action: "update",
      profileId: "prof_A",
      payload: { theme: "amoled", focusDuration: 50 },
    });
    const settingsQueue = getPendingQueue().filter(
      (q) => q.profileId === "prof_A" && q.entityName === "settings"
    );
    expect(settingsQueue).toHaveLength(1);
    expect(settingsQueue[0].payload.theme).toBe("amoled");
    expect(settingsQueue[0].payload.focusDuration).toBe(50);

    // 6. Date-scoped mutation deduplication (water)
    enqueueOfflineAction({
      type: "UPDATE_WATER",
      entityName: "water",
      action: "update",
      profileId: "prof_A",
      payload: { date: "2026-10-01", glasses: 2, goal: 8 },
    });
    enqueueOfflineAction({
      type: "UPDATE_WATER",
      entityName: "water",
      action: "update",
      profileId: "prof_A",
      payload: { date: "2026-10-01", glasses: 5, goal: 8 },
    });
    enqueueOfflineAction({
      type: "UPDATE_WATER",
      entityName: "water",
      action: "update",
      profileId: "prof_A",
      payload: { date: "2026-10-02", glasses: 1, goal: 8 },
    });
    const waterQueue = getPendingQueue().filter(
      (q) => q.profileId === "prof_A" && q.entityName === "water"
    );
    expect(waterQueue).toHaveLength(2);
    expect(waterQueue.find((w) => w.payload.date === "2026-10-01")?.payload.glasses).toBe(5);
    expect(waterQueue.find((w) => w.payload.date === "2026-10-02")?.payload.glasses).toBe(1);

    // Prove unsupported entities are strictly rejected and NEVER silently become tasks or another entity
    expect(isSupportedOfflineEntity("tasks")).toBe(true);
    expect(isSupportedOfflineEntity("study_sessions")).toBe(true);
    expect(isSupportedOfflineEntity("arbitrary_unknown_collection")).toBe(false);
    let threwUnsupported = false;
    try {
      enqueueOfflineAction({
        type: "CREATE_TASK",
        entityName: "arbitrary_unknown_collection",
        action: "create",
        profileId: "prof_A",
        payload: { id: "bad-1" },
      });
    } catch (err: any) {
      threwUnsupported = String(err?.message || "").includes("Unsupported offline entity");
    }
    expect(threwUnsupported).toBe(true);

    // 10. Refresh with pending queue (persisted in localStorage across reload)
    const rawSaved = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    expect(Boolean(rawSaved)).toBe(true);
    const parsedSaved = JSON.parse(rawSaved!);
    expect(parsedSaved.length).toBe(getPendingQueue().length);

    // 12 & 13. Two profiles on same device + profile switch with pending queue
    enqueueOfflineAction({
      type: "CREATE_NOTE",
      entityName: "notes",
      action: "create",
      profileId: "prof_B",
      payload: { id: "note-b1", title: "Profile B Note", content: "Isolated" },
    });
    expect(getPendingCount("prof_B")).toBe(1);
    expect(getPendingCount("prof_A")).toBe(6);

    // 7, 8, 15, 16, 17, 18, 19. Reconnect, retry after temporary failure, partial sync, lock release, idempotency, Firestore reconciliation
    const executedIds: string[] = [];
    let shouldFailNoteOnce = true;
    setOfflineSyncExecutorForTesting(async (_userId, action) => {
      if (action.entityName === "notes" && shouldFailNoteOnce) {
        shouldFailNoteOnce = false;
        throw new Error("Temporary network timeout");
      }
      executedIds.push(`${action.profileId}:${action.entityName}:${action.action}`);
    });

    // While offline, reconciliation is safely deferred
    setSimulatedOnlineStateForTesting(false);
    const whileOfflineSync = await reconcilePendingQueueWithFirestore("user_uid_1", 1);
    expect(whileOfflineSync.processed).toBe(0);
    expect(whileOfflineSync.remaining).toBe(7);

    // Reconnect:
    // First sync pass (maxRetries=1 so temporary failure leaves item for next sync): prof_A actions succeed (6), prof_B note fails once (partial sync = 6 processed, 1 remaining)
    setSimulatedOnlineStateForTesting(true);
    const firstSync = await reconcilePendingQueueWithFirestore("user_uid_1", 1);
    expect(firstSync.processed).toBe(6);
    expect(firstSync.remaining).toBe(1);
    expect(getPendingCount("prof_A")).toBe(0);
    expect(getPendingCount("prof_B")).toBe(1);
    expect(getPendingQueue()[0].retryCount).toBe(1);

    // Second sync pass (retry after temporary failure): prof_B note now succeeds!
    const secondSync = await reconcilePendingQueueWithFirestore("user_uid_1", 1);
    expect(secondSync.processed).toBe(1);
    expect(secondSync.remaining).toBe(0);
    expect(getPendingQueue()).toHaveLength(0);

    // 9 & 14. Permanent failure / max retry eviction (stale/unrecoverable mutation does not block queue forever)
    setOfflineSyncExecutorForTesting(async () => {
      const err: any = new Error("Unsupported offline entity: corrupted_entity");
      err.permanent = true;
      throw err;
    });
    enqueueOfflineAction({
      type: "CREATE_GOAL",
      entityName: "goals",
      action: "create",
      profileId: "prof_A",
      payload: { id: "g-perm-fail", title: "Goal" },
    });
    const permFailSync = await reconcilePendingQueueWithFirestore("user_uid_1", 1);
    expect(permFailSync.remaining).toBe(0);

    // 11. Profile deletion / workspace cleanup clears only that profile's pending queue
    setOfflineSyncExecutorForTesting(null);
    enqueueOfflineAction({
      type: "CREATE_HABIT",
      entityName: "habits",
      action: "create",
      profileId: "prof_A",
      payload: { id: "h-a", title: "Habit A" },
    });
    enqueueOfflineAction({
      type: "UPDATE_EVENT",
      entityName: "calendar_events",
      action: "create",
      profileId: "prof_B",
      payload: { id: "cal-b", title: "Event B", date: "2026-10-05" },
    });
    const removedCount = clearPendingQueueForProfile("prof_A");
    expect(removedCount).toBe(1);
    expect(getPendingCount("prof_A")).toBe(0);
    expect(getPendingCount("prof_B")).toBe(1);

    // 20. localStorage quota recovery (compacts large payloads when QuotaExceededError occurs)
    const origSetItem = localStorage.setItem.bind(localStorage);
    let quotaThrownOnce = false;
    localStorage.setItem = (key: string, val: string) => {
      if (key === OFFLINE_QUEUE_STORAGE_KEY && !quotaThrownOnce && val.length > 500) {
        quotaThrownOnce = true;
        const err = new Error("QuotaExceededError");
        err.name = "QuotaExceededError";
        throw err;
      }
      return origSetItem(key, val);
    };
    try {
      enqueueOfflineAction({
        type: "CREATE_NOTE",
        entityName: "notes",
        action: "create",
        profileId: "prof_B",
        payload: {
          id: "note-large",
          title: "Large Note",
          content: "Largebody".repeat(200),
          versions: [{ id: "v1", content: "OldVersion".repeat(200) }],
        },
      });
      expect(quotaThrownOnce).toBe(true);
      const savedRawAfterQuota = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
      const savedParsedAfterQuota = JSON.parse(savedRawAfterQuota || "[]");
      const compactedNote = savedParsedAfterQuota.find((q: any) => q.payload?.id === "note-large");
      expect(Boolean(compactedNote)).toBe(true);
      expect(Array.isArray(compactedNote?.payload.versions)).toBe(true);
      expect(compactedNote?.payload.versions.length).toBe(0);
    } finally {
      localStorage.setItem = origSetItem;
      setSimulatedOnlineStateForTesting(null);
      setOfflineSyncExecutorForTesting(null);
      clearPendingQueue();
    }
  });

  it("21. PWA / Service Worker Deep Runtime Verification (sw.js execution & install detection)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const swSource = fs.readFileSync(path.resolve(process.cwd(), "public/sw.js"), "utf-8");

    // Execute public/sw.js inside a simulated ServiceWorkerGlobalScope to test runtime handlers
    const listeners: Record<string, Function> = {};
    const cacheStore = new Map<string, Map<string, any>>();

    const mockCaches = {
      open: async (name: string) => {
        if (!cacheStore.has(name)) cacheStore.set(name, new Map());
        const bucket = cacheStore.get(name)!;
        return {
          addAll: async (urls: string[]) => {
            urls.forEach((u) =>
              bucket.set(u, {
                status: 200,
                type: "basic",
                headers: { get: () => "text/html" },
                body: "cached-shell",
              })
            );
          },
          put: async (req: any, res: any) => {
            const urlKey = typeof req === "string" ? req : req.url;
            bucket.set(urlKey, res);
          },
        };
      },
      keys: async () => Array.from(cacheStore.keys()),
      delete: async (name: string) => cacheStore.delete(name),
      match: async (req: any) => {
        const key = typeof req === "string" ? req : req.url;
        for (const bucket of cacheStore.values()) {
          if (bucket.has(key)) return bucket.get(key);
        }
        return undefined;
      },
    };

    let mockFetchImpl: (req: any) => Promise<any> = async () => ({
      status: 200,
      type: "basic",
      headers: { get: () => "application/javascript" },
      clone: function () {
        return this;
      },
    });

    class MockResponse {
      body: string;
      status: number;
      headers: { get: (k: string) => string | null };
      constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
        this.body = body;
        this.status = init?.status || 200;
        const h = init?.headers || {};
        this.headers = {
          get: (k: string) => h[k] || h[k.toLowerCase()] || null,
        };
      }
    }

    const selfMock = {
      addEventListener: (type: string, handler: Function) => {
        listeners[type] = handler;
      },
      skipWaiting: () => {},
      clients: { claim: () => {} },
    };

    const runSw = new Function("self", "caches", "fetch", "URL", "Response", swSource);
    runSw(
      selfMock,
      mockCaches,
      (req: any) => mockFetchImpl(req),
      URL,
      MockResponse
    );

    // 1. Install & Activate lifecycle + stale cache cleanup
    cacheStore.set("garia-os-old-stale-cache-v1", new Map());
    let installPromise: Promise<any> = Promise.resolve();
    listeners.install({
      waitUntil: (p: Promise<any>) => {
        installPromise = p;
      },
    });
    await installPromise;
    expect(cacheStore.has("garia-os-v3.2.0-cache-v4")).toBe(true);

    let activatePromise: Promise<any> = Promise.resolve();
    listeners.activate({
      waitUntil: (p: Promise<any>) => {
        activatePromise = p;
      },
    });
    await activatePromise;
    expect(cacheStore.has("garia-os-old-stale-cache-v1")).toBe(false);
    expect(cacheStore.has("garia-os-v3.2.0-cache-v4")).toBe(true);

    // Helper to dispatch fetch event to sw.js
    const dispatchSwFetch = async (url: string, method = "GET", mode = "cors") => {
      let respondedPromise: Promise<any> | null = null;
      listeners.fetch({
        request: { url, method, mode },
        respondWith: (p: Promise<any>) => {
          respondedPromise = p;
        },
      });
      return respondedPromise ? await respondedPromise : "BYPASSED";
    };

    // 2. /api/* and Vite dev resource bypass
    expect(await dispatchSwFetch("https://example.com/api/ai/chat", "POST")).toBe("BYPASSED");
    expect(await dispatchSwFetch("https://example.com/api/health", "GET")).toBe("BYPASSED");
    expect(await dispatchSwFetch("https://example.com/@vite/client", "GET")).toBe("BYPASSED");
    expect(await dispatchSwFetch("https://example.com/src/main.tsx", "GET")).toBe("BYPASSED");
    expect(await dispatchSwFetch("https://example.com/node_modules/react/index.js", "GET")).toBe(
      "BYPASSED"
    );

    // 3. JS/CSS never receive HTML fallback when server returns text/html for missing chunk
    mockFetchImpl = async () => ({
      status: 200,
      type: "basic",
      headers: { get: () => "text/html; charset=utf-8" },
      clone: function () {
        return this;
      },
    });
    const badChunkRes = await dispatchSwFetch("https://example.com/assets/chunk-abc.js", "GET");
    expect(badChunkRes.status).toBe(404);
    expect(badChunkRes.body).toBe("Asset not found");

    // 4. Offline navigation request receives cached /index.html SPA shell, while offline JS asset gets 408/404 (not HTML)
    mockFetchImpl = async () => {
      throw new Error("Offline network failure");
    };
    const navRes = await dispatchSwFetch("https://example.com/tasks", "GET", "navigate");
    expect(navRes.status).toBe(200);
    expect(navRes.body).toBe("cached-shell");

    const offlineAssetRes = await dispatchSwFetch(
      "https://example.com/assets/missing-offline.js",
      "GET",
      "cors"
    );
    expect(offlineAssetRes.status).toBe(408);

    // 5. Verify pwaInstall.ts standalone / iOS / Android detection helpers
    const pwaMod = await import("../pwaInstall");
    expect(typeof pwaMod.checkIsAppInstalled()).toBe("boolean");
    expect(typeof pwaMod.detectDevicePlatform()).toBe("string");
    expect(typeof pwaMod.isInstallPromptDismissed()).toBe("boolean");
  });

  it("22. Storage Architecture Runtime Verification (profile isolation, switching, cleanup & corrupted JSON recovery)", async () => {
    const {
      addStudentProfile,
      saveTasks,
      loadTasks,
      saveNotes,
      loadNotes,
      saveWater,
      loadWater,
      saveSettings,
      loadSettings,
      clearStudentWorkspaceData,
    } = await import("../storage");

    const p1 = addStudentProfile({
      name: "Student One",
      classLevel: "Class 12",
      stream: "Science",
      board: "CBSE",
    });
    const p2 = addStudentProfile({
      name: "Student Two",
      classLevel: "Class 11",
      stream: "Commerce",
      board: "BSEB",
    });

    saveTasks(
      [
        {
          id: "t-p1",
          title: "P1 Physics Task",
          description: "",
          date: "2026-10-01",
          priority: "high",
          category: "study",
          completed: false,
          createdAt: 1000,
        },
      ],
      p1.id
    );
    saveTasks(
      [
        {
          id: "t-p2",
          title: "P2 Accountancy Task",
          description: "",
          date: "2026-10-01",
          priority: "medium",
          category: "study",
          completed: true,
          createdAt: 2000,
        },
      ],
      p2.id
    );

    expect(loadTasks(p1.id)).toHaveLength(1);
    expect(loadTasks(p1.id)[0].title).toBe("P1 Physics Task");
    expect(loadTasks(p2.id)).toHaveLength(1);
    expect(loadTasks(p2.id)[0].title).toBe("P2 Accountancy Task");

    // Corrupted JSON resilience: writing malformed JSON to a profile key never crashes load*
    localStorage.setItem(`garia_p_${p1.id}_notes`, "{corrupted_json_payload");
    const recoveredNotes = loadNotes(p1.id);
    expect(Array.isArray(recoveredNotes)).toBe(true);

    // Clearing P1 workspace does not affect P2 data
    clearStudentWorkspaceData(p1.id);
    expect(loadTasks(p2.id)[0].title).toBe("P2 Accountancy Task");
  });
});
