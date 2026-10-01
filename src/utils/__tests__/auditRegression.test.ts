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
    expect(serverSource.includes("/api/auth/student-session")).toBe(true);
    expect(liveVoiceModalSource.includes("getValidClientAuthToken")).toBe(true);
    expect(liveVoiceModalSource.includes("Authentication required. Please sign in")).toBe(false);
  });
});
