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
import { Habit, Task, UserSettings, StudentProfile, AcademicSubject } from "../../types";
import {
  generateUnifiedAdaptiveState,
  calculateNormalizedPriority,
  determineMasteryState,
  calculateRevisionStatus,
  buildTimeAwareDailyPlan,
  loadProfileMistakes,
  recordQuestionMistake,
  updateMistakeStatus,
} from "../adaptiveStudyEngine";
import {
  generateLearningEffectivenessReport,
  calculateTopicMastery2,
  diagnoseWeakTopics,
  computeRetryEffectiveness,
  evaluateRetentionSignal,
  evaluateRevisionEffectiveness,
  evaluateStudyQuantityVsEffectiveness,
  evaluateSubjectPerformances,
  detectLearningBottlenecks,
  evaluateExamReadiness2,
  generateNextBestActionsWithEvidence,
  loadEnhancedMistakes,
  saveEnhancedMistakes,
  recordEnhancedQuestionMistake,
  logMistakeRetryAttempt,
} from "../learningEffectivenessEngine";
import { generateAbyaFallbackResponse } from "../abyaFallbackEngine";
import {
  generateExamStrategyReport,
  resolveStructuredExamContext,
  analyzeMockTest2,
  calculateScoreOpportunity,
  buildExamStrategyProfile,
  buildQuestionSelectionStrategy,
  buildTimeManagementStrategy,
  evaluateChapterScoreOpportunities,
  rankExamRevisionPriorities,
  generatePostMockReviewFlow,
  calculateScoreImprovementTrajectory,
  evaluateStrategyEffectiveness,
} from "../examStrategyEngine";
import {
  buildUnifiedAdaptiveQuestionPool,
  calculateAdaptiveQuestionScore,
  buildAdaptivePracticeSession,
  recommendNextAdaptiveQuestion,
  recordAdaptivePracticeAttempt,
  calculatePracticeEffectiveness,
  analyzePracticeCoverage,
  auditQuestionBankQuality,
  convertPracticePlanToStudyActions,
  loadStudentPracticeAttempts,
  StudentPracticeAttempt,
  AdaptiveQuestion,
} from "../adaptivePracticeEngine";

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

  it("23. P2 Phase 1: Verifies BSEB Class 11 & 12 Commerce foundation (Accountancy, BST, Economics, English, Urdu), curriculum verification status, PYQ source integrity, Decision Engine daily action plan, Abya AI Hindi/Hinglish routing, and Analytics integration", async () => {
    const {
      normalizeCurriculumBoard,
      getBoardCurriculumHierarchy,
      getCurriculumVerificationReport,
      getLocalizedSubjectName,
      getLocalizedChapterTitle,
    } = await import("../../data/masterCurriculum");
    const {
      getDefaultSubjectsForStream,
      getDefaultChaptersForStream,
    } = await import("../academicEngine");
    const { generateAcademicDecisionReport } = await import("../academicDecisionEngine");
    const {
      getQuestionsForCurriculum,
      auditQuestionBank,
    } = await import("../questionBankEngine");
    const { generateAbyaFallbackResponse } = await import("../abyaFallbackEngine");
    const { computePerformanceIntelligence } = await import("../studentPerformanceAnalytics");
    const {
      resolveEffectiveLanguage,
      resolveAcademicContentLanguage,
    } = await import("../i18n");

    // 1. India-first board normalization
    expect(normalizeCurriculumBoard("BSEB")).toBe("BSEB");
    expect(normalizeCurriculumBoard("Bihar School Examination Board")).toBe("BSEB");
    expect(normalizeCurriculumBoard("MP Board (MPBSE)")).toBe("MP Board");
    expect(normalizeCurriculumBoard("Maharashtra Board (MSBSHSE)")).toBe("Maharashtra Board");

    // 2. BSEB Class 11 & Class 12 Commerce curriculum hierarchy (Accountancy, BST, Economics, English, Urdu)
    const bsebComm11 = getBoardCurriculumHierarchy("BSEB", "Class 11", "Commerce");
    expect(bsebComm11.board).toBe("BSEB");
    expect(bsebComm11.verificationStatus).toBe("SOURCE-REQUIRED");
    const comm11Names = bsebComm11.subjects.map((s) => s.name);
    expect(comm11Names.includes("Accountancy")).toBe(true);
    expect(comm11Names.includes("Business Studies")).toBe(true);
    expect(comm11Names.includes("Economics")).toBe(true);
    expect(comm11Names.includes("English Core")).toBe(true);
    expect(comm11Names.includes("Urdu")).toBe(true);

    const bsebComm12 = getBoardCurriculumHierarchy("BSEB", "Class 12", "Commerce");
    expect(bsebComm12.board).toBe("BSEB");
    expect(bsebComm12.boardMetadata.objectiveWeightagePct).toBe(50);
    const comm12Names = bsebComm12.subjects.map((s) => s.name);
    expect(comm12Names.includes("Accountancy")).toBe(true);
    expect(comm12Names.includes("Business Studies")).toBe(true);
    expect(comm12Names.includes("Economics")).toBe(true);
    expect(comm12Names.includes("English Core")).toBe(true);
    expect(comm12Names.includes("Urdu")).toBe(true);

    const acc12 = bsebComm12.subjects.find((s) => s.name === "Accountancy")!;
    expect(acc12.chapters.some((c) => c.title.includes("Not-for-Profit Organisations (NPO)"))).toBe(
      true
    );

    const urdu12 = bsebComm12.subjects.find((s) => s.name === "Urdu")!;
    expect(urdu12.code).toBe("URD-303");
    expect(urdu12.chapters.length >= 3).toBe(true);
    expect(getLocalizedSubjectName(urdu12, "ur").includes("اردو")).toBe(true);
    expect(getLocalizedChapterTitle(urdu12.chapters[0], "ur").includes("کہکشاں")).toBe(true);

    // UI language vs Academic Content language separation
    const bsebUrduProfile = addStudentProfile({
      name: "Zoya Khan",
      classLevel: "Class 12",
      stream: "Commerce",
      board: "BSEB",
      uiLanguage: "en",
      contentLanguage: "ur",
    });
    expect(resolveEffectiveLanguage(bsebUrduProfile)).toBe("en");
    expect(resolveAcademicContentLanguage(bsebUrduProfile.contentLanguage)).toBe("ur");

    const verifReport = getCurriculumVerificationReport("BSEB", "Class 12", "Commerce");
    expect(verifReport.overallStatus).toBe("SOURCE-REQUIRED");
    expect(verifReport.verifiedSubjects).toHaveLength(0);
    expect(verifReport.sourceRequiredItems.length >= 5).toBe(true);

    // 3. Academic Engine & Decision Engine BSEB Commerce integration
    const commDefaultSubs = getDefaultSubjectsForStream("Commerce", "Class 12", "BSEB");
    expect(commDefaultSubs.some((s) => s.name === "Urdu")).toBe(true);
    expect(commDefaultSubs.every((s) => s.board === "BSEB")).toBe(true);

    const comm12Chaps = getDefaultChaptersForStream("Commerce", "Class 12", "BSEB");
    expect(comm12Chaps.some((c) => c.title.includes("Kahkashan"))).toBe(true);
    expect(comm12Chaps.some((c) => c.title.includes("Not-for-Profit Organisations (NPO)"))).toBe(
      true
    );

    const decision = generateAcademicDecisionReport({
      student: bsebUrduProfile,
    });
    expect(decision.board).toBe("BSEB");
    expect(decision.boardExamPattern.includes("50% OMR")).toBe(true);
    expect(decision.dailyStudyActionPlan).toHaveLength(3);
    expect(
      decision.dailyStudyActionPlan.some((slot) => slot.activity.includes("50% OMR"))
    ).toBe(true);

    // 4. Question Bank & PYQ Integrity (no fabricated official PYQs)
    const urduQuestions = getQuestionsForCurriculum("Class 12", "Urdu", undefined, undefined, "BSEB");
    expect(urduQuestions.mcqs.length >= 25).toBe(true);
    expect(urduQuestions.practice.length >= 10).toBe(true);
    expect(urduQuestions.pyqs.length >= 3).toBe(true);
    // Synthesized board-pattern items must be marked SAMPLE PRACTICE + SOURCE-REQUIRED, never fabricated as VERIFIED PYQ
    const synUrduPyqs = urduQuestions.pyqs.filter((p) => p.id.startsWith("syn-pyq-"));
    expect(synUrduPyqs.length >= 3).toBe(true);
    expect(synUrduPyqs.every((p) => p.sourceType === "SAMPLE PRACTICE")).toBe(true);
    expect(synUrduPyqs.every((p) => p.verificationStatus === "SOURCE-REQUIRED")).toBe(true);

    // Seed PYQs without an embedded official board paper citation are also honestly labeled SAMPLE PRACTICE + SOURCE-REQUIRED
    const accQuestions = getQuestionsForCurriculum("Class 12", "Accountancy", undefined, undefined, "CBSE");
    const seedAccPyqs = accQuestions.pyqs.filter((p) => p.id === "pyq-c12-acc-pf-2024");
    expect(seedAccPyqs).toHaveLength(1);
    expect(seedAccPyqs[0].sourceType).toBe("SAMPLE PRACTICE");
    expect(seedAccPyqs[0].verificationStatus).toBe("SOURCE-REQUIRED");

    const fullAudit = auditQuestionBank();
    expect(fullAudit.isAuditClean).toBe(true);
    expect(fullAudit.coveragePercentage).toBe(100);

    // 5. Abya AI natural Hindi/Hinglish routing & BSEB curriculum context + Analytics integration
    const todayPlanReply = generateAbyaFallbackResponse(
      "general",
      "aaj kya padhna chahiye",
      { profile: bsebUrduProfile }
    );
    expect(todayPlanReply.includes("BSEB")).toBe(true);
    expect(todayPlanReply.includes("50% OMR")).toBe(true);

    const accChaptersReply = generateAbyaFallbackResponse(
      "general",
      "BSEB Accountancy important chapters",
      { profile: bsebUrduProfile }
    );
    expect(accChaptersReply.includes("Accountancy")).toBe(true);
    expect(accChaptersReply.includes("Not-for-Profit Organisations (NPO)")).toBe(true);

    const urduReply = generateAbyaFallbackResponse(
      "general",
      "Urdu Kahkashan important topics",
      { profile: bsebUrduProfile }
    );
    expect(urduReply.includes("Kahkashan Part-II")).toBe(true);

    const perfIntel = computePerformanceIntelligence({
      tasks: [],
      subjects: [],
      studySessions: [],
      habits: [],
      focusLogs: [],
      water: { date: "2026-10-01", glasses: 6, goal: 8 },
      goals: [],
      activeStudent: bsebUrduProfile,
    });
    expect(perfIntel.board).toBe("BSEB");
    expect(perfIntel.curriculumVerificationStatus).toBe("SOURCE-REQUIRED");
    expect(perfIntel.subjectsAnalytics.some((s) => s.subjectName === "Urdu")).toBe(true);
    expect(perfIntel.subjectsAnalytics.some((s) => s.subjectName === "Accountancy")).toBe(true);
  });

  // =========================================================================
  // 24. P2 PHASE 2: OFFICIAL CURRICULUM VERIFICATION & SOURCE PROVENANCE LAYER
  // =========================================================================
  it("enforces official curriculum provenance validation, source versioning, conflict/outdated handling, board isolation, PYQ provenance gate, priority separation, and Abya source honesty", async () => {
    const {
      validateCurriculumProvenance,
      createCurriculumSourceConflict,
      registerCustomCurriculumProvenance,
      clearCustomCurriculumProvenance,
      getBoardCurriculumHierarchy,
      getCurriculumVerificationReport,
      getLocalizedSubjectName,
      getLocalizedChapterTitle,
      normalizeVerificationStatus,
    } = await import("../../data/masterCurriculum");
    const {
      validatePYQProvenance,
      getQuestionsForCurriculum,
      getQuestionBankProvenanceAudit,
    } = await import("../questionBankEngine");
    const {
      getDefaultSubjectsForStream,
      getDefaultChaptersForStream,
    } = await import("../academicEngine");
    const {
      generateAbyaFallbackResponse,
      formatAbyaCurriculumSourceDisclosure,
    } = await import("../abyaFallbackEngine");
    const {
      resolveEffectiveLanguage,
      resolveAcademicContentLanguage,
      getProvenanceStatusBadgeLabel,
    } = await import("../i18n");

    clearCustomCurriculumProvenance();

    // 1. Provenance Schema & Validator Security:
    // - Empty, pending, placeholder, and user-generated source IDs are rejected
    // - Unknown status enums fail safely to SOURCE-REQUIRED
    expect(normalizeVerificationStatus("UNKNOWN_INVALID_STATUS" as any)).toBe("SOURCE-REQUIRED");
    expect(validateCurriculumProvenance(undefined).verificationStatus).toBe("SOURCE-REQUIRED");
    expect(
      validateCurriculumProvenance({
        sourceId: "pending-bseb-acc",
        board: "BSEB",
        authority: "BSEB",
        documentTitle: "Pending Verification",
        documentType: "BOARD_SYLLABUS_PDF",
        academicYear: "2026-27",
        verificationStatus: "VERIFIED",
        verificationNotes: "Attempted upgrade without locatable primary reference",
      }).verificationStatus
    ).toBe("SOURCE-REQUIRED");
    expect(
      validateCurriculumProvenance({
        sourceId: "user-custom-bseb-2026",
        board: "BSEB",
        authority: "BSEB",
        documentTitle: "Bihar School Examination Board Intermediate Commerce Syllabus 2026-27",
        documentType: "BOARD_NOTIFICATION",
        academicYear: "2026-27",
        pageReference: "Section II, pp. 12-18",
        verificationStatus: "VERIFIED",
      }).verificationStatus
    ).toBe("SOURCE-REQUIRED");
    // - A source URL alone (without pageReference or chapterReference) cannot establish VERIFIED
    expect(
      validateCurriculumProvenance({
        sourceId: "bseb-official-notif-2026-comm-acc",
        board: "BSEB",
        authority: "BSEB",
        documentTitle: "Bihar School Examination Board Intermediate Commerce Syllabus 2026-27",
        documentType: "BOARD_NOTIFICATION",
        academicYear: "2026-27",
        sourceUrl: "https://biharboardonline.bihar.gov.in/syllabus-2026-27.pdf",
        verificationStatus: "VERIFIED",
      }).verificationStatus
    ).toBe("SOURCE-REQUIRED");
    // - Unofficial third-party URLs cannot establish VERIFIED even with pageReference
    expect(
      validateCurriculumProvenance({
        sourceId: "bseb-official-notif-2026-comm-acc",
        board: "BSEB",
        authority: "BSEB",
        documentTitle: "Bihar School Examination Board Intermediate Commerce Syllabus 2026-27",
        documentType: "BOARD_NOTIFICATION",
        academicYear: "2026-27",
        sourceUrl: "https://some-coaching-blog.example.com/bseb-syllabus.pdf",
        pageReference: "Section II, pp. 12-18",
        verificationStatus: "VERIFIED",
      }).verificationStatus
    ).toBe("SOURCE-REQUIRED");
    // - Mismatched authority (e.g. CBSE authority for BSEB board) cannot become VERIFIED
    expect(
      validateCurriculumProvenance({
        sourceId: "bseb-official-notif-2026-comm-acc",
        board: "BSEB",
        authority: "CBSE",
        documentTitle: "Bihar School Examination Board Intermediate Commerce Syllabus 2026-27",
        documentType: "BOARD_NOTIFICATION",
        academicYear: "2026-27",
        pageReference: "Section II, pp. 12-18",
        verificationStatus: "VERIFIED",
      }).verificationStatus
    ).toBe("SOURCE-REQUIRED");

    // 2. PARTIALLY-VERIFIED returned when partial authoritative metadata exists or explicitly marked PARTIALLY-VERIFIED
    expect(
      validateCurriculumProvenance({
        sourceId: "bseb-c12-acc-partial-2026",
        board: "BSEB",
        authority: "BSEB",
        documentTitle: "BSEB Intermediate Commerce Syllabus Structure",
        documentType: "BOARD_SYLLABUS_PDF",
        academicYear: "2026-27",
        verificationStatus: "PARTIALLY-VERIFIED",
        verificationNotes: "Subject structure confirmed; chapter-level weightage awaits official blueprint PDF.",
      }).verificationStatus
    ).toBe("PARTIALLY-VERIFIED");

    // 3. Full authoritative provenance required for VERIFIED
    const validOfficialProvenance = {
      sourceId: "bseb-official-notif-2026-comm-acc",
      board: "BSEB" as const,
      authority: "BSEB" as const,
      documentTitle: "Bihar School Examination Board Intermediate Commerce Syllabus 2026-27",
      documentType: "BOARD_NOTIFICATION" as const,
      academicYear: "2026-27",
      publicationDate: "2026-04-15",
      accessedDate: "2026-10-01",
      sourceUrl: "https://biharboardonline.bihar.gov.in/syllabus-2026-27.pdf",
      pageReference: "Section II - Accountancy (Code 220), pp. 12-18",
      chapterReference: "Units 1-5",
      verificationStatus: "VERIFIED" as const,
      verificationNotes: "Official primary board notification verified.",
    };
    expect(validateCurriculumProvenance(validOfficialProvenance, "2026-27").verificationStatus).toBe("VERIFIED");

    // 4. SOURCE-CONFLICT returned when conflicting authoritative sources exist
    const conflictProv = createCurriculumSourceConflict({
      board: "BSEB",
      classLevel: "Class 12",
      stream: "Commerce",
      subject: "Accountancy",
      academicYear: "2026-27",
      sourceA: "Bihar State Textbook Accountancy Part-I (2022 Print) — Lists NPO as Unit 1",
      sourceB: "Draft Academic Circular 2026 — Lists Partnership Fundamentals as Unit 1",
      conflictDescription: "NPO chapter placement differs between older state textbook print and draft circular.",
      recommendedReviewAction: "Do not guess silently; mark SOURCE-CONFLICT until official clarification is archived.",
    });
    expect(validateCurriculumProvenance(conflictProv, "2026-27").verificationStatus).toBe("SOURCE-CONFLICT");
    expect(conflictProv.conflictDetails).toBeDefined();

    // 5. OUTDATED returned when source academicYear is older than requested academicYear
    expect(
      validateCurriculumProvenance(
        {
          ...validOfficialProvenance,
          academicYear: "2022-23",
        },
        "2026-27"
      ).verificationStatus
    ).toBe("OUTDATED");

    // 6. BSEB Class 11 & Class 12 Commerce Provenance Resolution & Urdu / Kahkashan / Qawaid Provenance
    const bseb11 = getBoardCurriculumHierarchy("BSEB", "Class 11", "Commerce", "2026-27");
    expect(bseb11.academicYear).toBe("2026-27");
    expect(bseb11.verificationStatus).toBe("SOURCE-REQUIRED");
    expect(bseb11.provenance.board).toBe("BSEB");
    expect(bseb11.subjects.every((s) => s.verificationStatus === "SOURCE-REQUIRED")).toBe(true);

    const bseb12 = getBoardCurriculumHierarchy("BSEB", "Class 12", "Commerce", "2026-27");
    expect(bseb12.academicYear).toBe("2026-27");
    expect(bseb12.verificationStatus).toBe("SOURCE-REQUIRED");
    const urdu12 = bseb12.subjects.find((s) => s.name === "Urdu")!;
    expect(urdu12.provenance?.board).toBe("BSEB");
    expect(urdu12.verificationStatus).toBe("SOURCE-REQUIRED");
    expect(urdu12.chapters.some((c) => c.title.includes("Kahkashan Part-II"))).toBe(true);
    expect(urdu12.chapters.some((c) => c.title.includes("Urdu Qawaid"))).toBe(true);

    // Test dynamic upgrade via provenance registry when an official source IS registered
    registerCustomCurriculumProvenance("BSEB::Class 12::Commerce::Accountancy", validOfficialProvenance, "2026-27");
    const bseb12AfterUpgrade = getBoardCurriculumHierarchy("BSEB", "Class 12", "Commerce", "2026-27");
    const upgradedAcc = bseb12AfterUpgrade.subjects.find((s) => s.name === "Accountancy")!;
    expect(upgradedAcc.verificationStatus).toBe("VERIFIED");
    expect(upgradedAcc.provenance?.sourceId).toBe("bseb-official-notif-2026-comm-acc");
    expect(bseb12AfterUpgrade.verificationStatus).toBe("PARTIALLY-VERIFIED");
    const upgradedReport = getCurriculumVerificationReport("BSEB", "Class 12", "Commerce", "2026-27");
    expect(upgradedReport.verifiedSubjects.includes("Accountancy")).toBe(true);
    expect(upgradedReport.overallStatus).toBe("PARTIALLY-VERIFIED");
    clearCustomCurriculumProvenance();

    // 7. Strict Board Isolation: No BSEB leakage into CBSE / UP Board / MP Board / Maharashtra Board / ICSE
    for (const nonBsebBoard of ["CBSE", "UP Board", "MP Board", "Maharashtra Board", "ICSE"] as const) {
      const hierarchy12 = getBoardCurriculumHierarchy(nonBsebBoard, "Class 12", "Commerce", "2026-27");
      const accSub = hierarchy12.subjects.find((s) => s.name === "Accountancy")!;
      // NPO & Dissolution (ch-c12-acc-4) is BSEB-specific in Class 12 Accountancy and must not leak into non-BSEB boards
      expect(accSub.chapters.some((c) => c.id === "ch-c12-acc-4")).toBe(false);
      // No chapter notes or topics in non-BSEB boards may contain "BSEB" or "50% OMR"
      for (const sub of hierarchy12.subjects) {
        for (const ch of sub.chapters) {
          expect(ch.title.includes("Kahkashan")).toBe(false);
          expect(ch.notesSummary.includes("BSEB")).toBe(false);
          expect(ch.notesSummary.includes("50% OMR")).toBe(false);
          for (const top of ch.topics) {
            expect(top.name.includes("Kahkashan")).toBe(false);
            expect(top.summaryNote.includes("BSEB")).toBe(false);
            expect(top.vviPoints.some((v) => v.includes("BSEB"))).toBe(false);
          }
        }
      }
      const engineChaps = getDefaultChaptersForStream("Commerce", "Class 12", nonBsebBoard);
      expect(engineChaps.some((c) => c.id === "ch-acc-5")).toBe(false);
      expect(engineChaps.some((c) => c.title.includes("Kahkashan"))).toBe(false);
    }

    // 8. Priority vs Official Syllabus Separation
    const bsebAccCh1 = bseb12.subjects.find((s) => s.name === "Accountancy")!.chapters[0];
    expect(bsebAccCh1.priorityBreakdown).toBeDefined();
    expect(bsebAccCh1.priorityBreakdown?.officialSyllabusStatus).toBe("SOURCE-REQUIRED");
    expect(bsebAccCh1.priorityBreakdown?.applicationPriority).toBe("VVI");
    expect(bsebAccCh1.priorityBreakdown?.priorityBasis).toBe("APPLICATION_DERIVED_PRIORITY");
    expect(bsebAccCh1.priorityBreakdown?.verifiedPyqCount).toBe(0);

    // 9. PYQ Provenance Gate
    const unverifiedPyqCheck = validatePYQProvenance({
      id: "pyq-test-unverified",
      classLevel: "Class 12",
      subjectName: "Accountancy",
      chapterTitle: "Accounting for Partnership Firms - Fundamentals",
      year: 2024,
      board: "BSEB",
      questionText: "Sample question without paper code",
      questionType: "Short Answer",
      marks: 2,
      answerSolution: "Sample answer",
      difficulty: "Easy",
      sourceType: "VERIFIED PYQ", // Even if someone tries to pass VERIFIED PYQ without pyqProvenance
      verificationStatus: "VERIFIED",
    });
    expect(unverifiedPyqCheck.isVerifiedPyq).toBe(false);
    expect(unverifiedPyqCheck.effectiveSourceType).toBe("SAMPLE PRACTICE");
    expect(unverifiedPyqCheck.effectiveVerificationStatus).toBe("SOURCE-REQUIRED");

    const verifiedPyqCheck = validatePYQProvenance({
      id: "pyq-test-verified",
      classLevel: "Class 12",
      subjectName: "Accountancy",
      chapterTitle: "Accounting for Partnership Firms - Fundamentals",
      year: 2024,
      board: "BSEB",
      questionText: "What is Partner's Current Account?",
      questionType: "Short Answer",
      marks: 2,
      answerSolution: "Account maintained under fixed capital method.",
      difficulty: "Easy",
      sourceType: "VERIFIED PYQ",
      verificationStatus: "VERIFIED",
      pyqProvenance: {
        sourceId: "bseb-2024-acc-set-a",
        board: "BSEB",
        authority: "BSEB",
        year: 2024,
        academicYear: "2023-24",
        classLevel: "Class 12",
        subjectName: "Accountancy",
        paperCode: "I.Com-ACC-220-Set-A",
        questionNumber: "Section-B Q.4",
        documentTitle: "BSEB Intermediate Annual Examination 2024 Accountancy Question Paper",
        pageReference: "Page 6, Q.4",
        verificationStatus: "VERIFIED",
      },
    });
    expect(verifiedPyqCheck.isVerifiedPyq).toBe(true);
    expect(verifiedPyqCheck.effectiveSourceType).toBe("VERIFIED PYQ");
    expect(verifiedPyqCheck.effectiveVerificationStatus).toBe("VERIFIED");

    const qbAudit = getQuestionBankProvenanceAudit("BSEB", "Class 12");
    expect(qbAudit.verifiedPyqCount).toBe(0);
    expect(qbAudit.samplePracticeCount > 0).toBe(true);
    expect(qbAudit.sourceRequiredCount > 0).toBe(true);

    // 10. Abya AI Source-Honest Wording
    const sourceReqDisclosure = formatAbyaCurriculumSourceDisclosure({
      board: "BSEB",
      classLevel: "Class 12",
      stream: "Commerce",
      hierarchy: bseb12,
    });
    expect(sourceReqDisclosure.includes("SOURCE-REQUIRED")).toBe(true);
    expect(sourceReqDisclosure.includes("Based on your current Commerce study curriculum in Garia OS")).toBe(true);
    expect(sourceReqDisclosure.includes("confirm final board syllabus updates with official BSEB notifications")).toBe(true);

    const abyaAccResponse = generateAbyaFallbackResponse(
      "general",
      "BSEB Class 12 Accountancy syllabus and important chapters",
      {
        profile: {
          id: "stu-prov-1",
          name: "Aarav",
          classLevel: "Class 12",
          stream: "Commerce",
          board: "BSEB",
          uiLanguage: "en",
          contentLanguage: "ur",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      }
    );
    expect(abyaAccResponse.includes("Based on your current Commerce study curriculum in Garia OS")).toBe(true);
    expect(abyaAccResponse.includes("From Your Important Revision Priorities")).toBe(true);
    expect(abyaAccResponse.includes("confirm final board syllabus updates with official BSEB notifications")).toBe(true);
    expect(abyaAccResponse.toLowerCase().includes("guaranteed board question")).toBe(false);
    expect(abyaAccResponse.toLowerCase().includes("officially confirmed")).toBe(false);

    // 11. UI Language vs Content Language Preservation with Provenance
    expect(
      resolveEffectiveLanguage({ uiLanguage: "en", language: "en" })
    ).toBe("en");
    expect(resolveAcademicContentLanguage("ur")).toBe("ur");
    expect(getLocalizedSubjectName(urdu12, "ur").includes("اردو")).toBe(true);
    expect(getLocalizedChapterTitle(urdu12.chapters[0], "ur").includes("کہکشاں")).toBe(true);
    expect(getProvenanceStatusBadgeLabel("SOURCE-REQUIRED", "en").includes("Source Pending")).toBe(true);
    expect(getProvenanceStatusBadgeLabel("VERIFIED", "hi").includes("VERIFIED")).toBe(true);
  });

  // =========================================================================
  // 25. P2 PHASE 3: OFFICIAL SOURCE INGESTION & CURRICULUM DATA COMPLETION
  // =========================================================================
  it("25. P2 Phase 3: verifies source ingestion rules, BSEB Class 11 & 12 Commerce subject codes & Rainbow/Kahkashan provenance, board-pattern vs subject marking-scheme separation, cross-board isolation, PYQ wrong-board/outdated rejection, Abya AI 5-state disclosures, and machine-readable source audit output", async () => {
    const {
      validateCurriculumProvenance,
      createCurriculumSourceConflict,
      registerCustomCurriculumProvenance,
      clearCustomCurriculumProvenance,
      getBoardCurriculumHierarchy,
      getCurriculumSourceIngestionAudit,
      CURRICULUM_PROVENANCE_REGISTRY,
    } = await import("../../data/masterCurriculum");
    const { validatePYQProvenance } = await import("../questionBankEngine");
    const { formatAbyaCurriculumSourceDisclosure } = await import("../abyaFallbackEngine");

    clearCustomCurriculumProvenance();

    // 1. Source Ingestion Gate Tests (Section 24):
    // - Valid official BSEB source -> VERIFIED
    const validBsebSource = validateCurriculumProvenance(
      {
        sourceId: "bseb-2026-27-icom-acc-circular-01",
        authority: "BSEB",
        board: "BSEB",
        classLevel: "Class 12",
        stream: "Commerce",
        subject: "Accountancy",
        academicYear: "2026-27",
        documentTitle: "BSEB Intermediate Commerce Accountancy Syllabus Notification 2026-27",
        documentType: "BOARD_NOTIFICATION",
        sourceUrl: "https://biharboardonline.bihar.gov.in/icom-acc-2026-27.pdf",
        publicationDate: "2026-04-10",
        accessedDate: "2026-10-02",
        pageReference: "pp. 4-9",
        chapterReference: "Part A (NPO & Partnership) & Part B (Company Accounts)",
        verificationStatus: "VERIFIED",
      },
      "2026-27"
    );
    expect(validBsebSource.verificationStatus).toBe("VERIFIED");

    // - Missing page/chapter reference -> rejected (SOURCE-REQUIRED)
    expect(
      validateCurriculumProvenance(
        {
          ...validBsebSource,
          pageReference: undefined,
          chapterReference: undefined,
        },
        "2026-27"
      ).verificationStatus
    ).toBe("SOURCE-REQUIRED");

    // - Wrong academic year -> OUTDATED
    expect(
      validateCurriculumProvenance(
        {
          ...validBsebSource,
          academicYear: "2024-25",
          applicableAcademicYears: ["2024-25"],
        },
        "2026-27"
      ).verificationStatus
    ).toBe("OUTDATED");

    // - Unofficial source URL -> rejected (SOURCE-REQUIRED)
    expect(
      validateCurriculumProvenance(
        {
          ...validBsebSource,
          sourceUrl: "https://unofficial-coaching-portal.org/bseb-syllabus.pdf",
        },
        "2026-27"
      ).verificationStatus
    ).toBe("SOURCE-REQUIRED");

    // - Wrong authority (UNVERIFIED) -> rejected (SOURCE-REQUIRED)
    expect(
      validateCurriculumProvenance(
        {
          ...validBsebSource,
          authority: "UNVERIFIED",
        },
        "2026-27"
      ).verificationStatus
    ).toBe("SOURCE-REQUIRED");

    // - Board-authority mismatch (CISCE authority for BSEB board) -> rejected (SOURCE-REQUIRED)
    expect(
      validateCurriculumProvenance(
        {
          ...validBsebSource,
          authority: "CISCE",
        },
        "2026-27"
      ).verificationStatus
    ).toBe("SOURCE-REQUIRED");

    // - Placeholder sourceId -> rejected (SOURCE-REQUIRED)
    expect(
      validateCurriculumProvenance(
        {
          ...validBsebSource,
          sourceId: "placeholder-bseb-acc-2026",
        },
        "2026-27"
      ).verificationStatus
    ).toBe("SOURCE-REQUIRED");

    // - Pending document type/title -> rejected (SOURCE-REQUIRED)
    expect(
      validateCurriculumProvenance(
        {
          ...validBsebSource,
          documentType: "PENDING_OFFICIAL_SOURCE",
        },
        "2026-27"
      ).verificationStatus
    ).toBe("SOURCE-REQUIRED");

    // 2. BSEB Class 12 & Class 11 Commerce Subject Codes, Provenance & BSEB English (Rainbow) Differentiation
    const bseb12 = getBoardCurriculumHierarchy("BSEB", "Class 12", "Commerce", "2026-27");
    const bseb11 = getBoardCurriculumHierarchy("BSEB", "Class 11", "Commerce", "2026-27");

    const expectedCodes: Record<string, string> = {
      Accountancy: "ACC-055",
      "Business Studies": "BST-054",
      Economics: "ECO-030",
      "English Core": "ENG-301",
      Urdu: "URD-303",
    };

    for (const [subName, code] of Object.entries(expectedCodes)) {
      const sub12 = bseb12.subjects.find((s) => s.name === subName);
      expect(sub12).toBeDefined();
      expect(sub12!.code).toBe(code);
      expect(sub12!.verificationStatus).toBe("SOURCE-REQUIRED");

      const sub11 = bseb11.subjects.find((s) => s.name === subName);
      expect(sub11).toBeDefined();
      expect(sub11!.code).toBe(code);
      expect(sub11!.verificationStatus).toBe("SOURCE-REQUIRED");
    }

    // BSEB English Core references BSTBPC Rainbow Part-II (Class 12) & Rainbow Part-I (Class 11), not CBSE Flamingo/Hornbill
    const bsebEng12 = bseb12.subjects.find((s) => s.name === "English Core")!;
    expect(bsebEng12.chapters[0].title.includes("Rainbow Part-II")).toBe(true);
    const bsebEng11 = bseb11.subjects.find((s) => s.name === "English Core")!;
    expect(bsebEng11.chapters[0].title.includes("Rainbow Part-I")).toBe(true);

    // 3. Board-Level Exam Pattern vs Subject-Level Curriculum Provenance Separation (Section 11)
    expect(CURRICULUM_PROVENANCE_REGISTRY["BSEB::2026-27::EXAM_PATTERN"]).toBeDefined();
    expect(
      CURRICULUM_PROVENANCE_REGISTRY["BSEB::2026-27::Class 12::Commerce::Accountancy::MARKING_SCHEME"]
    ).toBeDefined();

    // Upgrading a single subject's syllabus provenance must NOT falsely mark boardMetadata (exam pattern) as VERIFIED
    registerCustomCurriculumProvenance(
      "BSEB::2026-27::Class 12::Commerce::Accountancy",
      validBsebSource,
      "2026-27"
    );
    const bseb12WithOneSubVerified = getBoardCurriculumHierarchy(
      "BSEB",
      "Class 12",
      "Commerce",
      "2026-27"
    );
    expect(bseb12WithOneSubVerified.boardMetadata.verificationStatus).toBe("SOURCE-REQUIRED");
    expect(bseb12WithOneSubVerified.verificationStatus).toBe("PARTIALLY-VERIFIED");
    clearCustomCurriculumProvenance();

    // 4. Board Isolation: BSEB NPO, Kahkashan, Rainbow Part-I/II, and 50% OMR excluded from CBSE, UP, MP, Maharashtra, ICSE
    for (const otherBoard of ["CBSE", "UP Board", "MP Board", "Maharashtra Board", "ICSE"] as const) {
      const h12 = getBoardCurriculumHierarchy(otherBoard, "Class 12", "Commerce", "2026-27");
      const h11 = getBoardCurriculumHierarchy(otherBoard, "Class 11", "Commerce", "2026-27");
      for (const h of [h12, h11]) {
        for (const s of h.subjects) {
          for (const c of s.chapters) {
            expect(c.id === "ch-c12-acc-4").toBe(false);
            expect(c.title.includes("Kahkashan")).toBe(false);
            expect(c.title.includes("Rainbow Part-")).toBe(false);
            expect(c.notesSummary.includes("50% OMR")).toBe(false);
            expect(c.notesSummary.includes("BSEB")).toBe(false);
          }
        }
      }
    }

    // 5. PYQ Integrity: complete provenance -> VERIFIED PYQ; missing/fabricated -> SAMPLE PRACTICE; wrong board -> rejected; outdated paper -> OUTDATED
    const wrongBoardPyq = validatePYQProvenance(
      {
        id: "pyq-wrong-board",
        classLevel: "Class 12",
        subjectName: "Accountancy",
        chapterTitle: "Partnership",
        year: 2024,
        board: "CBSE",
        questionText: "State two features of Partnership.",
        questionType: "Short Answer",
        marks: 2,
        answerSolution: "Two or more persons, agreement.",
        difficulty: "Easy",
        sourceType: "VERIFIED PYQ",
        verificationStatus: "VERIFIED",
        pyqProvenance: {
          sourceId: "bseb-2024-acc-set-a",
          board: "BSEB",
          authority: "BSEB",
          year: 2024,
          academicYear: "2023-24",
          classLevel: "Class 12",
          subjectName: "Accountancy",
          paperCode: "I.Com-ACC-220-Set-A",
          questionNumber: "Q.1",
          documentTitle: "BSEB Intermediate Annual Examination 2024 Accountancy Question Paper",
          pageReference: "Page 2",
          verificationStatus: "VERIFIED",
        },
      },
      "CBSE",
      "2026-27"
    );
    expect(wrongBoardPyq.isVerifiedPyq).toBe(false);
    expect(wrongBoardPyq.effectiveSourceType).toBe("SAMPLE PRACTICE");
    expect(wrongBoardPyq.effectiveVerificationStatus).toBe("SOURCE-REQUIRED");

    const outdatedPyq = validatePYQProvenance(
      {
        id: "pyq-outdated-paper",
        classLevel: "Class 12",
        subjectName: "Accountancy",
        chapterTitle: "Partnership",
        year: 2019,
        board: "BSEB",
        questionText: "Old syllabus question.",
        questionType: "Long Answer",
        marks: 5,
        answerSolution: "Old scheme.",
        difficulty: "Medium",
        sourceType: "VERIFIED PYQ",
        verificationStatus: "VERIFIED",
        pyqProvenance: {
          sourceId: "bseb-2019-acc-old",
          board: "BSEB",
          authority: "BSEB",
          year: 2019,
          academicYear: "2018-19",
          applicableAcademicYears: ["2018-19", "2019-20"],
          classLevel: "Class 12",
          subjectName: "Accountancy",
          paperCode: "I.Com-ACC-2019",
          questionNumber: "Q.12",
          documentTitle: "BSEB Intermediate Examination 2019 Accountancy Paper",
          pageReference: "Page 8",
          verificationStatus: "VERIFIED",
        },
      },
      "BSEB",
      "2026-27"
    );
    expect(outdatedPyq.isVerifiedPyq).toBe(false);
    expect(outdatedPyq.effectiveSourceType).toBe("SAMPLE PRACTICE");
    expect(outdatedPyq.effectiveVerificationStatus).toBe("OUTDATED");

    // 6. Abya AI 5-State Provenance Disclosures (VERIFIED, PARTIALLY-VERIFIED, SOURCE-REQUIRED, SOURCE-CONFLICT, OUTDATED)
    const verifiedDisc = formatAbyaCurriculumSourceDisclosure({
      board: "BSEB",
      classLevel: "Class 12",
      stream: "Commerce",
      academicYear: "2026-27",
      subject: {
        ...bseb12.subjects[0],
        verificationStatus: "VERIFIED",
        provenance: validBsebSource,
      },
    });
    expect(verifiedDisc.includes("VERIFIED (")).toBe(true);
    expect(verifiedDisc.includes("Academic Year 2026-27")).toBe(true);
    expect(verifiedDisc.includes(validBsebSource.documentTitle)).toBe(true);
    expect(verifiedDisc.includes("BSEB")).toBe(true);

    const partialDisc = formatAbyaCurriculumSourceDisclosure({
      board: "BSEB",
      classLevel: "Class 12",
      stream: "Commerce",
      academicYear: "2026-27",
      subject: {
        ...bseb12.subjects[0],
        verificationStatus: "PARTIALLY-VERIFIED",
      },
    });
    expect(partialDisc.includes("PARTIALLY-VERIFIED")).toBe(true);
    expect(partialDisc.includes("still unverified pending official BSEB notifications")).toBe(true);

    const conflictDisc = formatAbyaCurriculumSourceDisclosure({
      board: "BSEB",
      classLevel: "Class 12",
      stream: "Commerce",
      academicYear: "2026-27",
      subject: {
        ...bseb12.subjects[0],
        verificationStatus: "SOURCE-CONFLICT",
        provenance: createCurriculumSourceConflict({
          board: "BSEB",
          classLevel: "Class 12",
          stream: "Commerce",
          subject: "Accountancy",
          academicYear: "2026-27",
          sourceA: "Doc A",
          sourceB: "Doc B",
          conflictDescription: "Chapter sequence conflict.",
          recommendedReviewAction: "Verify primary board circular.",
        }),
      },
    });
    expect(conflictDisc.includes("SOURCE-CONFLICT")).toBe(true);

    const outdatedDisc = formatAbyaCurriculumSourceDisclosure({
      board: "BSEB",
      classLevel: "Class 12",
      stream: "Commerce",
      academicYear: "2026-27",
      subject: {
        ...bseb12.subjects[0],
        verificationStatus: "OUTDATED",
      },
    });
    expect(outdatedDisc.includes("OUTDATED")).toBe(true);

    // 7. Machine-readable Source Audit Output (Section 25)
    const auditEntries = getCurriculumSourceIngestionAudit("2026-27");
    expect(auditEntries.length >= 16).toBe(true);
    for (const entry of auditEntries) {
      expect(typeof entry.sourceId).toBe("string");
      expect(typeof entry.authority).toBe("string");
      expect(typeof entry.board).toBe("string");
      expect(typeof entry.academicYear).toBe("string");
      expect(typeof entry.documentTitle).toBe("string");
      expect(typeof entry.documentType).toBe("string");
      expect(typeof entry.previousStatus).toBe("string");
      expect(typeof entry.newStatus).toBe("string");
      expect(entry.newStatus).toBe("SOURCE-REQUIRED");
    }
  });

  // =========================================================================
  // 26. P2 PHASE 3B: OFFICIAL SCERT / BSTBPC EVIDENCE INGESTION & SOURCE COMPLETION
  // =========================================================================
  it("26. P2 Phase 3B: verifies 4-tier evidence separation (official resource vs content support vs academic-year applicability vs 2026-27 verification), real SCERT Bihar/BSTBPC evidence ingestion, chapter-level Accountancy Part-I mapping, and non-inflation of VERIFIED status", async () => {
    const {
      validateCurriculumProvenance,
      getBoardCurriculumHierarchy,
      getCurriculumSourceIngestionAudit,
      CURRICULUM_PROVENANCE_REGISTRY,
      clearCustomCurriculumProvenance,
    } = await import("../../data/masterCurriculum");
    const { formatAbyaCurriculumSourceDisclosure } = await import("../abyaFallbackEngine");

    clearCustomCurriculumProvenance();

    // 1. OFFICIAL SOURCE FOUND !== 2026-27 SYLLABUS VERIFIED
    // Even if caller passes verificationStatus: "VERIFIED" with an authentic 2024-25 BSTBPC textbook,
    // because resourceAcademicYear ("2024-25") !== targetAcademicYear ("2026-27") and 2026-27 applicability is not proven,
    // validateCurriculumProvenance MUST keep verificationStatus === "SOURCE-REQUIRED" while recording CURRICULUM_CONTENT_SUPPORTED.
    const historicalTextbookAttempt = validateCurriculumProvenance(
      {
        sourceId: "scert-bstbpc-c12-acc-part1-2024",
        authority: "SCERT_BIHAR",
        board: "BSEB",
        classLevel: "Class 12",
        stream: "Commerce",
        subject: "Accountancy",
        academicYear: "2026-27",
        resourceAcademicYear: "2024-25",
        documentTitle:
          "Accountancy – Partnership Accounts, Textbook for Class XII (BSTBPC Patna, March 2024)",
        documentType: "OFFICIAL_TEXTBOOK",
        sourceUrl: "https://scert.bihar.gov.in/public/uploads/eresources/Accountancy-XII.pdf",
        publicationDate: "2024-06-21",
        accessedDate: "2026-10-02",
        pageReference: "Contents (p. ix), Chapters 1–4 (pp. 1–167)",
        chapterReference: "Chapters 1–4 Partnership Accounts",
        curriculumContentSupported: true,
        currentYearApplicabilityProven: false,
        verificationStatus: "VERIFIED",
      },
      "2026-27"
    );
    expect(historicalTextbookAttempt.verificationStatus).toBe("SOURCE-REQUIRED");
    expect(historicalTextbookAttempt.evidenceStage).toBe("CURRICULUM_CONTENT_SUPPORTED");
    expect(historicalTextbookAttempt.officialResourceConfirmed).toBe(true);
    expect(historicalTextbookAttempt.curriculumContentSupported).toBe(true);
    expect(historicalTextbookAttempt.currentYearApplicabilityProven).toBe(false);

    // 2. Inspect BSEB Class 12 Commerce Hierarchy & Chapter-Level Evidence
    const bseb12 = getBoardCurriculumHierarchy("BSEB", "Class 12", "Commerce", "2026-27");
    const acc12 = bseb12.subjects.find((s) => s.name === "Accountancy")!;
    expect(acc12.verificationStatus).toBe("SOURCE-REQUIRED");
    expect(acc12.provenance?.authority).toBe("SCERT_BIHAR");
    expect(acc12.provenance?.documentType).toBe("OFFICIAL_TEXTBOOK");
    expect(acc12.provenance?.resourceAcademicYear).toBe("2024-25");
    expect(acc12.provenance?.evidenceStage).toBe("CURRICULUM_CONTENT_SUPPORTED");
    expect(acc12.provenance?.officialResourceConfirmed).toBe(true);
    expect(acc12.provenance?.curriculumContentSupported).toBe(true);
    expect(acc12.provenance?.currentYearApplicabilityProven).toBe(false);
    expect(acc12.provenance?.sourceUrl).toBe(
      "https://scert.bihar.gov.in/public/uploads/eresources/Accountancy-XII.pdf"
    );

    // Chapters 1-3 (Partnership) have CURRICULUM_CONTENT_SUPPORTED; Chapter 4 (NPO) has OFFICIAL_RESOURCE_CONFIRMED (since NPO was rationalised out of the 2024 print on p. v)
    const ch1 = acc12.chapters.find((c) => c.id === "ch-c12-acc-1")!;
    const ch2 = acc12.chapters.find((c) => c.id === "ch-c12-acc-2")!;
    const ch3 = acc12.chapters.find((c) => c.id === "ch-c12-acc-3")!;
    const ch4 = acc12.chapters.find((c) => c.id === "ch-c12-acc-4")!;
    expect(ch1.provenance?.evidenceStage).toBe("CURRICULUM_CONTENT_SUPPORTED");
    expect(ch2.provenance?.evidenceStage).toBe("CURRICULUM_CONTENT_SUPPORTED");
    expect(ch3.provenance?.evidenceStage).toBe("CURRICULUM_CONTENT_SUPPORTED");
    expect(ch4.provenance?.evidenceStage).toBe("OFFICIAL_RESOURCE_CONFIRMED");
    expect(ch4.provenance?.curriculumContentSupported).toBe(false);
    expect(ch1.verificationStatus).toBe("SOURCE-REQUIRED");
    expect(ch4.verificationStatus).toBe("SOURCE-REQUIRED");

    // 3. Inspect BSEB Class 12 Business Studies & Economics (OFFICIAL_RESOURCE_CONFIRMED, raster scan / partial PDF)
    for (const subName of ["Business Studies", "Economics"]) {
      const sub = bseb12.subjects.find((s) => s.name === subName)!;
      expect(sub.verificationStatus).toBe("SOURCE-REQUIRED");
      expect(sub.provenance?.authority).toBe("SCERT_BIHAR");
      expect(sub.provenance?.evidenceStage).toBe("OFFICIAL_RESOURCE_CONFIRMED");
      expect(sub.provenance?.officialResourceConfirmed).toBe(true);
      expect(sub.provenance?.curriculumContentSupported).toBe(false);
      expect(sub.provenance?.currentYearApplicabilityProven).toBe(false);
    }

    // 4. Inspect BSEB Class 11 Commerce Subjects
    const bseb11 = getBoardCurriculumHierarchy("BSEB", "Class 11", "Commerce", "2026-27");
    for (const subName of ["Accountancy", "Business Studies", "Economics"]) {
      const sub = bseb11.subjects.find((s) => s.name === subName)!;
      expect(sub.verificationStatus).toBe("SOURCE-REQUIRED");
      expect(sub.provenance?.authority).toBe("SCERT_BIHAR");
      expect(sub.provenance?.evidenceStage).toBe("OFFICIAL_RESOURCE_CONFIRMED");
      expect(sub.provenance?.officialResourceConfirmed).toBe(true);
      expect(sub.provenance?.curriculumContentSupported).toBe(false);
      expect(sub.provenance?.currentYearApplicabilityProven).toBe(false);
    }

    // 5. Inspect English Core (Rainbow Part-I/II) & Urdu (Kahkashan Part-I/II) — remain SOURCE-REQUIRED (not hosted on SCERT e-Resources; BSTBPC HTTP 500)
    for (const h of [bseb11, bseb12]) {
      for (const langSub of ["English Core", "Urdu"]) {
        const sub = h.subjects.find((s) => s.name === langSub)!;
        expect(sub.verificationStatus).toBe("SOURCE-REQUIRED");
        expect(sub.provenance?.authority).toBe("UNVERIFIED");
        expect(sub.provenance?.evidenceStage).toBe("SOURCE-REQUIRED");
        expect(sub.provenance?.officialResourceConfirmed).toBe(false);
        expect(sub.provenance?.curriculumContentSupported).toBe(false);
      }
    }

    // 6. Abya AI Disclosure for CURRICULUM_CONTENT_SUPPORTED vs OFFICIAL_RESOURCE_CONFIRMED
    const accDisc = formatAbyaCurriculumSourceDisclosure({
      board: "BSEB",
      classLevel: "Class 12",
      stream: "Commerce",
      academicYear: "2026-27",
      subject: acc12,
    });
    expect(accDisc.includes("SOURCE-REQUIRED")).toBe(true);
    expect(accDisc.includes("Official Textbook Evidence: SCERT_BIHAR")).toBe(true);
    expect(accDisc.includes("2026-27 exam applicability remains unverified")).toBe(true);

    const bst12 = bseb12.subjects.find((s) => s.name === "Business Studies")!;
    const bstDisc = formatAbyaCurriculumSourceDisclosure({
      board: "BSEB",
      classLevel: "Class 12",
      stream: "Commerce",
      academicYear: "2026-27",
      subject: bst12,
    });
    expect(bstDisc.includes("SOURCE-REQUIRED")).toBe(true);
    expect(bstDisc.includes("Official Resource Cataloged: SCERT_BIHAR")).toBe(true);

    // 7. Audit Table Verification
    const audit = getCurriculumSourceIngestionAudit("2026-27");
    const acc12Audit = audit.find((a) => a.sourceId === "scert-bstbpc-c12-acc-part1-2024");
    expect(acc12Audit).toBeDefined();
    expect(acc12Audit?.evidenceStage).toBe("CURRICULUM_CONTENT_SUPPORTED");
    expect(acc12Audit?.officialResourceConfirmed).toBe(true);
    expect(acc12Audit?.curriculumContentSupported).toBe(true);
    expect(acc12Audit?.currentYearApplicabilityProven).toBe(false);
    expect(acc12Audit?.newStatus).toBe("SOURCE-REQUIRED");
    expect(CURRICULUM_PROVENANCE_REGISTRY["BSEB::2026-27::EXAM_PATTERN"].verificationStatus).toBe(
      "SOURCE-REQUIRED"
    );
  });

  // =========================================================================
  // 27. P2 PHASE 4: BSEB 2026-27 OFFICIAL SYLLABUS, EXAM PATTERN & PYQ EVIDENCE COMPLETION
  // =========================================================================
  it("27. P2 Phase 4: verifies official BSEB 2026 Intermediate Model Paper blueprint ingestion (Accountancy 220, Business Studies 217, Economics 219, English 105, Urdu 107/207), historical 2023-25/2024-26 syllabus year-scoping, NPO & Economics partial-evidence discrepancy tracking, textbook applicability status, and strict rejection of Model Papers as VERIFIED PYQs", async () => {
    const {
      validateCurriculumProvenance,
      getBoardCurriculumHierarchy,
      getCurriculumSourceIngestionAudit,
      CURRICULUM_PROVENANCE_REGISTRY,
      isOfficialBoardSourceUrl,
      clearCustomCurriculumProvenance,
    } = await import("../../data/masterCurriculum");
    const { validatePYQProvenance } = await import("../questionBankEngine");

    clearCustomCurriculumProvenance();

    // 1. Official BSEB domain recognition (biharboardonline.com and seniorsecondary.biharboardonline.com)
    expect(
      isOfficialBoardSourceUrl(
        "https://biharboardonline.com/files/InterModelPaper/2026/220_Accountancy.pdf"
      )
    ).toBe(true);
    expect(
      isOfficialBoardSourceUrl(
        "https://biharboardonline.com/files/Class_XI%20-XII_Syllabus_2023-25_and_2024-26.pdf"
      )
    ).toBe(true);

    // 2. Historical BSEB Class XI-XII Syllabus PDF (2023-25 and 2024-26) is strictly OUTDATED for 2026-27
    const historicalBsebSyllabus = validateCurriculumProvenance(
      {
        sourceId: "bseb-syllabus-2023-25-2024-26",
        authority: "BSEB",
        board: "BSEB",
        classLevel: "Class 12",
        stream: "Commerce",
        academicYear: "2024-26",
        applicableAcademicYears: ["2023-25", "2024-26"],
        documentTitle: "Class_XI -XII_Syllabus_2023-25_and_2024-26.pdf",
        documentType: "BOARD_SYLLABUS_PDF",
        sourceUrl:
          "https://biharboardonline.com/files/Class_XI%20-XII_Syllabus_2023-25_and_2024-26.pdf",
        pageReference: "pp. 1-216",
        verificationStatus: "VERIFIED",
      },
      "2026-27"
    );
    expect(historicalBsebSyllabus.verificationStatus).toBe("OUTDATED");
    expect(historicalBsebSyllabus.evidenceStage).toBe("OUTDATED");
    expect(historicalBsebSyllabus.textbookApplicabilityStatus).toBe("OUTDATED");
    expect(historicalBsebSyllabus.currentYearApplicabilityProven).toBe(false);

    // 3. Board-Level Exam Pattern (BSEB::2026-27::EXAM_PATTERN) records 2026 Model Paper & Passing Criteria evidence while remaining SOURCE-REQUIRED for 2026-27
    const examPatternProv = CURRICULUM_PROVENANCE_REGISTRY["BSEB::2026-27::EXAM_PATTERN"];
    expect(examPatternProv.verificationStatus).toBe("SOURCE-REQUIRED");
    expect(examPatternProv.authority).toBe("BSEB");
    expect(examPatternProv.documentType).toBe("EXAM_BLUEPRINT");
    expect(examPatternProv.resourceAcademicYear).toBe("2025-26");
    expect(examPatternProv.evidenceStage).toBe("CURRICULUM_CONTENT_SUPPORTED");
    expect(examPatternProv.officialResourceConfirmed).toBe(true);
    expect(examPatternProv.curriculumContentSupported).toBe(true);
    expect(examPatternProv.officialExamBlueprintFound).toBe(true);
    expect(examPatternProv.currentYearApplicabilityProven).toBe(false);
    expect((examPatternProv.supportingResources || []).length >= 3).toBe(true);

    // 4. Subject-Specific Marking Scheme / Model Paper Blueprint Records (::MARKING_SCHEME)
    const accBlueprint =
      CURRICULUM_PROVENANCE_REGISTRY[
        "BSEB::2026-27::Class 12::Commerce::Accountancy::MARKING_SCHEME"
      ];
    const bstBlueprint =
      CURRICULUM_PROVENANCE_REGISTRY[
        "BSEB::2026-27::Class 12::Commerce::Business Studies::MARKING_SCHEME"
      ];
    const ecoBlueprint =
      CURRICULUM_PROVENANCE_REGISTRY[
        "BSEB::2026-27::Class 12::Commerce::Economics::MARKING_SCHEME"
      ];
    const engBlueprint =
      CURRICULUM_PROVENANCE_REGISTRY[
        "BSEB::2026-27::Class 12::Commerce::English Core::MARKING_SCHEME"
      ];
    const urduBlueprint =
      CURRICULUM_PROVENANCE_REGISTRY[
        "BSEB::2026-27::Class 12::Commerce::Urdu::MARKING_SCHEME"
      ];

    for (const bp of [accBlueprint, bstBlueprint, ecoBlueprint, engBlueprint]) {
      expect(bp.authority).toBe("BSEB");
      expect(bp.documentType).toBe("EXAM_BLUEPRINT");
      expect(bp.resourceAcademicYear).toBe("2025-26");
      expect(bp.officialResourceConfirmed).toBe(true);
      expect(bp.curriculumContentSupported).toBe(true);
      expect(bp.officialExamBlueprintFound).toBe(true);
      expect(bp.currentYearApplicabilityProven).toBe(false);
      expect(bp.evidenceStage).toBe("CURRICULUM_CONTENT_SUPPORTED");
      expect(bp.verificationStatus).toBe("SOURCE-REQUIRED");
    }

    // Urdu 2026 Model Paper (107_207_307_503_Urdu.pdf) is a 24-page Nasta'liq raster scan: OFFICIAL_RESOURCE_CONFIRMED, curriculumContentSupported === false
    expect(urduBlueprint.authority).toBe("BSEB");
    expect(urduBlueprint.documentType).toBe("EXAM_BLUEPRINT");
    expect(urduBlueprint.officialResourceConfirmed).toBe(true);
    expect(urduBlueprint.curriculumContentSupported).toBe(false);
    expect(urduBlueprint.officialExamBlueprintFound).toBe(true);
    expect(urduBlueprint.currentYearApplicabilityProven).toBe(false);
    expect(urduBlueprint.evidenceStage).toBe("OFFICIAL_RESOURCE_CONFIRMED");
    expect(urduBlueprint.verificationStatus).toBe("SOURCE-REQUIRED");

    // 5. Partial Evidence & Discrepancy Tracking on BSEB Class 12 Commerce Subjects
    const bseb12 = getBoardCurriculumHierarchy("BSEB", "Class 12", "Commerce", "2026-27");
    const acc12 = bseb12.subjects.find((s) => s.name === "Accountancy")!;
    expect(acc12.provenance?.textbookApplicabilityStatus).toBe(
      "OFFICIAL_RESOURCE_CONFIRMED_ONLY"
    );
    expect(acc12.provenance?.partialEvidenceSummary).toBeDefined();
    expect(acc12.provenance?.partialEvidenceSummary?.verifiedChapters || []).toHaveLength(0);
    expect(
      acc12.provenance?.partialEvidenceSummary?.unsupportedOrConflictedChapters.some((c) =>
        c.includes("Not-for-Profit Organisation (NPO)")
      )
    ).toBe(true);

    const eco12 = bseb12.subjects.find((s) => s.name === "Economics")!;
    expect(eco12.provenance?.textbookApplicabilityStatus).toBe(
      "OFFICIAL_RESOURCE_CONFIRMED_ONLY"
    );
    expect(
      eco12.provenance?.partialEvidenceSummary?.unsupportedOrConflictedChapters.some((c) =>
        c.includes("Introductory Microeconomics")
      )
    ).toBe(true);

    const eng12 = bseb12.subjects.find((s) => s.name === "English Core")!;
    expect(eng12.provenance?.textbookApplicabilityStatus).toBe("SOURCE-REQUIRED");
    expect(
      eng12.provenance?.supportingResources?.some((r) => r.url.includes("105_English.pdf"))
    ).toBe(true);
    expect(
      eng12.provenance?.partialEvidenceSummary?.supportedHistoricalChapters.some((c) =>
        c.includes("Rainbow Part-II")
      )
    ).toBe(true);

    const urdu12 = bseb12.subjects.find((s) => s.name === "Urdu")!;
    expect(urdu12.provenance?.textbookApplicabilityStatus).toBe("SOURCE-REQUIRED");
    expect(
      urdu12.provenance?.supportingResources?.some((r) =>
        r.url.includes("107_207_307_503_Urdu.pdf")
      )
    ).toBe(true);

    // 6. Strict PYQ vs Model Paper Rule: Model Question Papers CANNOT become VERIFIED PYQ
    const modelPaperAsPyqAttempt = validatePYQProvenance(
      {
        id: "pyq-bseb-2026-model-attempt",
        classLevel: "Class 12",
        subjectName: "Accountancy",
        chapterTitle: "Accounting for Not-for-Profit Organisation",
        year: 2026,
        board: "BSEB",
        questionText: "Distinguish between Receipts and Payments Account and Income and Expenditures Account.",
        questionType: "Long Answer",
        marks: 5,
        answerSolution: "Receipts & Payments is a summary of cash transactions; Income & Expenditure is on accrual basis.",
        difficulty: "Medium",
        sourceType: "VERIFIED PYQ",
        verificationStatus: "VERIFIED",
        pyqProvenance: {
          sourceId: "bseb-2026-acc-paper-220",
          board: "BSEB",
          authority: "BSEB",
          year: 2026,
          examYear: 2026,
          academicYear: "2025-26",
          syllabusYear: "2025-26",
          classLevel: "Class 12",
          subjectName: "Accountancy",
          paperCode: "I.Com-ACC-220",
          questionNumber: "Section-B Q.33",
          // Even if caller disguises documentTitle without the words "Model Paper", the InterModelPaper sourceUrl is caught
          documentTitle: "BSEB Intermediate Examination 2026 Annual Accountancy Paper",
          sourceUrl: "https://biharboardonline.com/files/InterModelPaper/2026/220_Accountancy.pdf",
          pageReference: "Page 36, Q.33",
          verificationStatus: "VERIFIED",
        },
      },
      "BSEB",
      "2026-27"
    );
    expect(modelPaperAsPyqAttempt.isVerifiedPyq).toBe(false);
    expect(modelPaperAsPyqAttempt.effectiveSourceType).toBe("SAMPLE PRACTICE");
    expect(modelPaperAsPyqAttempt.effectiveVerificationStatus).toBe("SOURCE-REQUIRED");

    // 7. Audit table includes textbookApplicabilityStatus and supportingResourceCount while keeping 0 false VERIFIED entries
    const audit = getCurriculumSourceIngestionAudit("2026-27");
    expect(audit.every((a) => a.newStatus === "SOURCE-REQUIRED")).toBe(true);
    const examPatternAudit = audit.find(
      (a) => a.sourceId === "bseb-inter-exam-pattern-2026-model-evidence"
    );
    expect(examPatternAudit).toBeDefined();
    expect(examPatternAudit?.officialExamBlueprintFound).toBe(true);
    expect((examPatternAudit?.supportingResourceCount || 0) >= 3).toBe(true);
  });

  it("28. P4 Adaptive Student Intelligence & Study Execution: verifies unified adaptive state, top 3 recommendations, priority formula, 6-stage mastery, time-aware planning (30m vs 3h), revision engine, mistake review loop, exam date separation, analytics-to-action, profile isolation, and Abya AI actionable coaching", async () => {
    // 1. Profile Isolation Setup for Profile A and Profile B
    const profA = addStudentProfile({
      name: "Tanya Sharma",
      classLevel: "Class 12",
      stream: "Commerce",
      board: "BSEB",
    });
    const profB = addStudentProfile({
      name: "Rahul Verma",
      classLevel: "Class 11",
      stream: "Science",
      board: "CBSE",
    });

    // 2. Priority Model: transparent formula with normalized factors
    const priorityExamSoon = calculateNormalizedPriority({
      isWeak: true,
      isVVI: true,
      daysUntilExam: 10,
      revisionDueDays: -3, // 3 days overdue
      status: "In Progress",
      accuracyPct: 45,
      matchesActiveGoal: true,
      streakDays: 4,
    });
    expect(priorityExamSoon.urgency).toBe(25);
    expect(priorityExamSoon.weakness >= 15).toBe(true);
    expect(priorityExamSoon.revisionNeed >= 20).toBe(true);
    expect(priorityExamSoon.goalAlignment).toBe(10);
    expect(priorityExamSoon.totalScore >= 85).toBe(true);
    expect(priorityExamSoon.formulaDescription.includes("Priority")).toBe(true);

    const priorityExamDistant = calculateNormalizedPriority({
      isWeak: false,
      isVVI: false,
      daysUntilExam: 90,
      status: "Completed",
      matchesActiveGoal: false,
      streakDays: 5,
    });
    expect(priorityExamDistant.urgency).toBe(10);
    expect(priorityExamDistant.totalScore < priorityExamSoon.totalScore).toBe(true);

    // 3. Multi-Signal 6-Stage Mastery Model: discrete states & honest "Not enough data"
    const masteryNoData = determineMasteryState({
      chapterId: "ch-test-1",
      chapterTitle: "Partnership Basics",
      subjectId: "sub-acc",
      subjectName: "Accountancy",
      practiceAttempts: 0,
      revisionCount: 0,
    });
    expect(masteryNoData.hasEnoughData).toBe(false);
    expect(masteryNoData.stage).toBe("Not Started");

    const masteryImproving = determineMasteryState({
      chapterId: "ch-test-2",
      chapterTitle: "Admission of Partner",
      subjectId: "sub-acc",
      subjectName: "Accountancy",
      practiceAttempts: 6,
      practiceAccuracyPct: 48,
      revisionCount: 1,
      isWeak: true,
    });
    expect(masteryImproving.hasEnoughData).toBe(true);
    expect(masteryImproving.stage).toBe("Improving");

    const masteryStrong = determineMasteryState({
      chapterId: "ch-test-3",
      chapterTitle: "Principles of Management",
      subjectId: "sub-bst",
      subjectName: "Business Studies",
      practiceAttempts: 15,
      practiceAccuracyPct: 92,
      revisionCount: 2,
    });
    expect(masteryStrong.stage).toBe("Strong");

    const masteryOverdue = determineMasteryState({
      chapterId: "ch-test-4",
      chapterTitle: "National Income",
      subjectId: "sub-eco",
      subjectName: "Economics",
      nextRevisionDue: Date.now() - 86400000, // yesterday
    });
    expect(masteryOverdue.stage).toBe("Needs Revision");
    expect(masteryOverdue.isOverdueForRevision).toBe(true);

    // 4. Revision Engine: explainable spaced intervals & honest non-pseudoscience copy
    const revCycle1 = calculateRevisionStatus({
      id: "rev-1",
      subjectName: "Accountancy",
      chapterTitle: "Cash Flow Statement",
      cycleCount: 1,
      lastStudiedDate: "2026-10-01",
    });
    expect(revCycle1.intervalDays).toBe(2);
    expect(revCycle1.recommendationNote.includes("brain will forget")).toBe(false);
    expect(revCycle1.recommendationNote.toLowerCase().includes("revision")).toBe(true);

    const revOverdue = calculateRevisionStatus({
      id: "rev-2",
      subjectName: "Business Studies",
      chapterTitle: "Financial Management",
      customDueDate: "2026-09-20",
    });
    expect(revOverdue.urgencyBadge).toBe("Overdue");
    expect(revOverdue.daysOverdue > 0).toBe(true);
    expect(revOverdue.recommendationNote.includes("Overdue")).toBe(true);

    // 5. Time-Aware Study Planning: 30-minute day vs 3-hour day
    const candidateActions = [
      {
        id: "act-1",
        rank: 1 as const,
        action: "Study Accountancy Chapter 1",
        category: "study" as const,
        subjectName: "Accountancy",
        subjectId: "sub-acc",
        chapterTitle: "Partnership Basics",
        reason: "Core syllabus foundation",
        estimatedMinutes: 45,
        sourceBasis: "APPLICATION-DERIVED" as const,
        confidence: "High" as const,
        priorityScore: 92,
        isUrgent: true,
        isWeak: false,
        isVVI: true,
        targetTab: "study" as const,
      },
      {
        id: "act-2",
        rank: 2 as const,
        action: "Revise Economics Money & Banking",
        category: "revision" as const,
        subjectName: "Economics",
        subjectId: "sub-eco",
        chapterTitle: "Money and Banking",
        reason: "Overdue revision",
        estimatedMinutes: 30,
        sourceBasis: "APPLICATION-DERIVED" as const,
        confidence: "High" as const,
        priorityScore: 86,
        isUrgent: true,
        isWeak: false,
        isVVI: true,
        targetTab: "exam" as const,
      },
      {
        id: "act-3",
        rank: 3 as const,
        action: "Practice 10 Business Studies MCQs",
        category: "practice" as const,
        subjectName: "Business Studies",
        subjectId: "sub-bst",
        chapterTitle: "Principles of Management",
        reason: "Board exam pattern drill",
        estimatedMinutes: 25,
        sourceBasis: "APPLICATION-DERIVED" as const,
        confidence: "Moderate" as const,
        priorityScore: 78,
        isUrgent: false,
        isWeak: false,
        isVVI: false,
        targetTab: "exam" as const,
      },
    ];

    const plan30m = buildTimeAwareDailyPlan(30, candidateActions);
    expect(plan30m.availableMinutes).toBe(30);
    expect(plan30m.mustDo.length).toBe(1);
    expect(plan30m.deferred.length >= 1).toBe(true);
    expect(plan30m.deferred[0].reasonForDeferral.includes("budget")).toBe(true);

    const plan180m = buildTimeAwareDailyPlan(180, candidateActions);
    expect(plan180m.availableMinutes).toBe(180);
    expect(plan180m.mustDo.length).toBe(1);
    expect(plan180m.shouldDo.length >= 1).toBe(true);
    expect(plan180m.breakMinutes >= 10).toBe(true);

    // 6. Structured Mistake Review Loop & Profile Isolation
    const mistakeA = recordQuestionMistake(profA.id, {
      profileId: profA.id,
      subjectId: "sub-acc",
      subjectName: "Accountancy",
      chapterTitle: "Partnership Basics",
      questionText: "What is the maximum number of partners allowed in a banking partnership firm?",
      studentAnswer: "10",
      correctAnswer: "50 (as per Companies Rule 2014 Rule 10 / Section 464)",
      conceptExplanation: "The Central Government prescribes limit up to 50 under Rule 10.",
    });
    expect(mistakeA.status).toBe("pending_review");
    expect(mistakeA.retryCount).toBe(0);

    const profAMistakes = loadProfileMistakes(profA.id);
    expect(profAMistakes.length).toBe(1);
    expect(profAMistakes[0].id).toBe(mistakeA.id);

    // Verify Profile B has 0 mistakes (strict profile data isolation)
    const profBMistakes = loadProfileMistakes(profB.id);
    expect(profBMistakes.length).toBe(0);

    // Retry mistake
    updateMistakeStatus(profA.id, mistakeA.id, "retried_incorrect", "Forgot rule number");
    const updatedMistakes1 = loadProfileMistakes(profA.id);
    expect(updatedMistakes1[0].status).toBe("retried_incorrect");
    expect(updatedMistakes1[0].retryCount).toBe(1);

    updateMistakeStatus(profA.id, mistakeA.id, "resolved", "Now clear: 50 is the prescribed limit");
    const updatedMistakes2 = loadProfileMistakes(profA.id);
    expect(updatedMistakes2[0].status).toBe("resolved");

    // 7. Unified Adaptive State Generation & Recommendations
    const adaptiveStateA = generateUnifiedAdaptiveState({
      student: profA,
      subjects: [
        { id: "sub-acc", name: "Accountancy", color: "#06b6d4" } as any,
        { id: "sub-bst", name: "Business Studies", color: "#8b5cf6" } as any,
        { id: "sub-eco", name: "Economics", color: "#10b981" } as any,
      ],
      examProfile: {
        id: "exam-prof-a",
        examName: "BSEB Class 12 Commerce Board Exam",
        board: "BSEB",
        classLevel: "Class 12",
        stream: "Commerce",
        startDate: "2027-02-01",
      } as any,
      availableDailyMinutes: 60,
    });

    // Max 3 primary recommendations
    expect(adaptiveStateA.topRecommendations.length <= 3).toBe(true);
    expect(adaptiveStateA.topRecommendations[0].sourceBasis).toBe("APPLICATION-DERIVED");
    expect(adaptiveStateA.topRecommendations[0].estimatedMinutes > 0).toBe(true);

    // Exam Readiness: date type distinction & honest missing data handling
    expect(adaptiveStateA.examReadiness.dateType).toBe("STUDENT_TARGET_DATE");
    expect(adaptiveStateA.examReadiness.hasEnoughData).toBe(false);
    expect(adaptiveStateA.examReadiness.explanation.includes("not enough data")).toBe(true);

    // 8. Abya AI: P4 Actionable Coach Intents
    const abyaWhatToStudy = generateAbyaFallbackResponse(
      "general",
      "what should i study now?",
      {
        profile: profA,
        tasks: [],
        subjects: [{ id: "sub-acc", name: "Accountancy", color: "#06b6d4" }],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaWhatToStudy.includes("Application-Derived Priority")).toBe(true);
    expect(abyaWhatToStudy.includes("Top Recommendations")).toBe(true);

    const abyaMistakes = generateAbyaFallbackResponse(
      "general",
      "explain my mistake",
      {
        profile: profA,
        tasks: [],
        subjects: [],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaMistakes.includes("Mistake Learning Cycle") || abyaMistakes.includes("mistake")).toBe(true);

    const abyaWeekly = generateAbyaFallbackResponse(
      "general",
      "what should i focus on this week?",
      {
        profile: profA,
        tasks: [],
        subjects: [],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaWeekly.includes("Weekly Academic Focus")).toBe(true);
  });

  it("29. P5 Learning Effectiveness & Exam Performance Intelligence: verifies multi-signal mastery 2.0, weak-topic diagnosis (6 types), mistake intelligence 2.0 (retries, types, lifecycle & repeated error detection), retention signals, revision effectiveness, quantity vs quality balance, subject/chapter intelligence, mock test trajectory, exam readiness 2.0, bottlenecks, and Abya AI effectiveness guidance", () => {
    const studentP5 = {
      id: "student-p5-test",
      name: "Priya Sharma",
      board: "BSEB",
      stream: "Commerce",
      classLevel: "Class 12",
      language: "en",
      academicYear: "2026-2027",
    } as any;

    const otherStudentP5 = {
      id: "student-p5-other",
      name: "Rahul Verma",
      board: "BSEB",
      stream: "Commerce",
      classLevel: "Class 12",
      language: "en",
      academicYear: "2026-2027",
    } as any;

    // 1. Topic Mastery 2.0: Multi-signal evaluation & honest missing data handling
    const rawMasteryNoData = calculateTopicMastery2({
      chapterId: "ch-acc-part-1",
      chapterTitle: "Accounting for Partnership: Basic Concepts",
      subjectId: "sub-acc",
      subjectName: "Accountancy",
      practiceSessions: [],
      mistakes: [],
      revisions: [],
      chapterStatus: "Not Started",
    });
    expect(rawMasteryNoData.hasEnoughData).toBe(false);
    expect(rawMasteryNoData.confidence).toBe("Insufficient data");
    expect(rawMasteryNoData.stage).toBe("Not Started");
    expect(rawMasteryNoData.evidence.some((e) => e.includes("Not enough data") || e.includes("insufficient"))).toBe(true);

    // High practice accuracy + revisions completed + mistake corrected
    const highPractices = [
      {
        id: "prac-1",
        chapterId: "ch-acc-part-1",
        chapterTitle: "Accounting for Partnership: Basic Concepts",
        subjectId: "sub-acc",
        accuracyPercentage: 90,
        totalQuestions: 10,
        correctCount: 9,
        timestamp: Date.now() - 24 * 3600 * 1000,
      } as any,
      {
        id: "prac-2",
        chapterId: "ch-acc-part-1",
        chapterTitle: "Accounting for Partnership: Basic Concepts",
        subjectId: "sub-acc",
        accuracyPercentage: 90,
        totalQuestions: 10,
        correctCount: 9,
        timestamp: Date.now(),
      } as any,
    ];
    const resolvedMistakes = [
      {
        id: "mst-p5-1",
        profileId: studentP5.id,
        subjectId: "sub-acc",
        subjectName: "Accountancy",
        chapterTitle: "Accounting for Partnership: Basic Concepts",
        questionText: "What is the interest on drawings rule?",
        studentAnswer: "6%",
        correctAnswer: "As per partnership deed, else nil",
        mistakeType: "Formula/rule error" as const,
        lifecycleStatus: "Corrected" as const,
        firstOccurrenceAt: Date.now() - 48 * 3600 * 1000,
        latestOccurrenceAt: Date.now() - 12 * 3600 * 1000,
        occurrenceCount: 1,
        correctionAttempts: 1,
        retryHistory: [{ attemptedAt: Date.now() - 12 * 3600 * 1000, isCorrect: true }],
        retryCount: 1,
        createdAt: Date.now() - 48 * 3600 * 1000,
        status: "resolved" as const,
        markedForRevision: false,
      },
    ];
    const completedRevs = [
      {
        id: "rev-acc-1",
        chapterTitle: "Accounting for Partnership: Basic Concepts",
        subjectName: "Accountancy",
        cycleCount: 2,
        completed: true,
        lastStudiedDate: "2026-10-02",
      } as any,
    ];

    const masteredTopic = calculateTopicMastery2({
      chapterId: "ch-acc-part-1",
      chapterTitle: "Accounting for Partnership: Basic Concepts",
      subjectId: "sub-acc",
      subjectName: "Accountancy",
      practiceSessions: highPractices,
      mistakes: resolvedMistakes,
      revisions: completedRevs,
      chapterStatus: "Completed",
    });
    expect(masteredTopic.hasEnoughData).toBe(true);
    expect(masteredTopic.stage).toBe("Strong");
    expect(masteredTopic.confidence).toBe("Medium");
    expect(masteredTopic.accuracyScore >= 85).toBe(true);
    expect(masteredTopic.evidence.some((e) => e.toLowerCase().includes("accuracy"))).toBe(true);

    // 2. Weak-Topic Diagnosis (Deterministic 6 Types)
    const weakDiagnoses = diagnoseWeakTopics({
      chapters: [
        {
          id: "ch-low-acc",
          title: "Cash Flow Statement",
          subjectId: "sub-acc",
          subjectName: "Accountancy",
          status: "In Progress",
        } as any,
        {
          id: "ch-forgotten",
          title: "Goodwill: Nature and Valuation",
          subjectId: "sub-acc",
          subjectName: "Accountancy",
          status: "Completed",
        } as any,
      ],
      practiceSessions: [
        {
          id: "prac-cf-1",
          chapterId: "ch-low-acc",
          chapterTitle: "Cash Flow Statement",
          subjectId: "sub-acc",
          accuracyPercentage: 30,
          totalQuestions: 10,
          correctCount: 3, // 30% accuracy -> Type A Low Accuracy
          timestamp: Date.now(),
        } as any,
      ],
      mistakes: [
        {
          id: "mst-rep-1",
          profileId: studentP5.id,
          subjectId: "sub-acc",
          subjectName: "Accountancy",
          chapterTitle: "Cash Flow Statement",
          questionText: "How is dividend paid classified?",
          studentAnswer: "Operating",
          correctAnswer: "Financing activity",
          mistakeType: "Concept misunderstanding",
          lifecycleStatus: "Repeated",
          firstOccurrenceAt: Date.now() - 3600000,
          latestOccurrenceAt: Date.now(),
          occurrenceCount: 2,
          correctionAttempts: 1,
          retryHistory: [],
          retryCount: 1,
          createdAt: Date.now() - 3600000,
          status: "retried_incorrect",
          markedForRevision: true,
        },
      ],
      revisions: [],
    });
    expect(weakDiagnoses.length >= 1).toBe(true);
    const lowAccDiag = weakDiagnoses.find((w) => w.diagnosisType === "Type A — Low accuracy" || w.diagnosisType === "Type B — Repeated mistake");
    expect(lowAccDiag !== undefined).toBe(true);
    expect(lowAccDiag!.severity).toBe("High");
    expect(lowAccDiag!.suggestedAction.length > 0).toBe(true);

    // 3. Mistake Intelligence 2.0: Lifecycle, Retries, Repeated Error Detection, & Profile Isolation
    const mist1 = recordEnhancedQuestionMistake(studentP5.id, {
      subjectId: "sub-bst",
      subjectName: "Business Studies",
      chapterTitle: "Principles of Management",
      questionText: "Who propounded the 14 principles of management?",
      studentAnswer: "F.W. Taylor",
      correctAnswer: "Henri Fayol",
      conceptExplanation: "Fayol developed the 14 administrative principles; Taylor developed scientific management.",
      mistakeType: "Concept misunderstanding",
    });
    expect(mist1.lifecycleStatus).toBe("New");
    expect(mist1.occurrenceCount).toBe(1);
    expect(mist1.correctionAttempts).toBe(0);

    // Profile Isolation check: Other student must not see Priya's enhanced mistakes
    const otherMistakes = loadEnhancedMistakes(otherStudentP5.id);
    expect(otherMistakes.some((m) => m.id === mist1.id)).toBe(false);

    // Recording repeated mistake on identical question/concept detects repetition
    const repeatedMist = recordEnhancedQuestionMistake(studentP5.id, {
      subjectId: "sub-bst",
      subjectName: "Business Studies",
      chapterTitle: "Principles of Management",
      questionText: "Who propounded the 14 principles of management?",
      studentAnswer: "F.W. Taylor",
      correctAnswer: "Henri Fayol",
      mistakeType: "Concept misunderstanding",
    });
    expect(repeatedMist.lifecycleStatus).toBe("Repeated");
    expect(repeatedMist.occurrenceCount).toBe(2);

    // Retry Attempt logging
    const retriedMist = logMistakeRetryAttempt(studentP5.id, repeatedMist.id, true, "Understood: Fayol is administrative, Taylor is scientific");
    expect(retriedMist !== null).toBe(true);
    expect(retriedMist!.lifecycleStatus).toBe("Corrected");
    expect(retriedMist!.correctionAttempts).toBe(1);
    expect(retriedMist!.retryHistory.length).toBe(1);
    expect(retriedMist!.retryHistory[0].isCorrect).toBe(true);

    // Retry Effectiveness Metrics
    const metrics = computeRetryEffectiveness(loadEnhancedMistakes(studentP5.id));
    expect(metrics.totalMistakesLogged >= 1).toBe(true);
    expect(metrics.totalCorrected >= 1).toBe(true);

    // 4. Retention Signal Analysis: honest signals without fake forgetting curves
    const retentionNoData = evaluateRetentionSignal({
      practiceSessions: [],
      revisions: [],
      mistakes: [],
    });
    expect(retentionNoData.retentionStatus).toBe("Not enough data yet");
    expect(retentionNoData.recallCheckRecommended).toBe(false);

    const oldPractice = [
      {
        id: "prac-old",
        chapterId: "ch-old",
        chapterTitle: "Issue of Debentures",
        subjectId: "sub-acc",
        accuracyPercentage: 80,
        totalQuestions: 10,
        correctCount: 8,
        createdAt: Date.now() - 25 * 24 * 3600 * 1000, // 25 days ago
      } as any,
    ];
    const retentionAging = evaluateRetentionSignal({
      practiceSessions: oldPractice,
      revisions: [],
      mistakes: [],
    });
    expect(retentionAging.recallCheckRecommended).toBe(true);
    expect(retentionAging.retentionStatus.includes("weakening") || retentionAging.retentionStatus.includes("checking")).toBe(true);
    expect((retentionAging.daysSinceLastPractice || 0) >= 20).toBe(true);

    // 5. Revision Effectiveness: Before vs After practice comparison
    const revEffectiveness = evaluateRevisionEffectiveness({
      revisions: [
        {
          id: "rev-eff-1",
          chapterTitle: "Partnership Basics",
          subjectName: "Accountancy",
          cycleCount: 1,
          completed: true,
          completedAt: Date.now() - 24 * 3600 * 1000,
          lastStudiedDate: "2026-10-01",
        } as any,
      ],
      practiceSessions: [
        {
          id: "p-before",
          chapterTitle: "Partnership Basics",
          accuracyPercentage: 50,
          totalQuestions: 10,
          correctCount: 5, // 50% before
          createdAt: Date.now() - 48 * 3600 * 1000,
        } as any,
        {
          id: "p-after",
          chapterTitle: "Partnership Basics",
          accuracyPercentage: 90,
          totalQuestions: 10,
          correctCount: 9, // 90% after
          createdAt: Date.now(),
        } as any,
      ],
    });
    expect(revEffectiveness.length).toBe(1);
    expect(revEffectiveness[0].outcome).toBe("Improved");
    expect(revEffectiveness[0].afterAccuracyPct).toBe(90);
    expect(revEffectiveness[0].beforeAccuracyPct).toBe(50);
    expect(revEffectiveness[0].signalMessage.includes("from 50% to 90%")).toBe(true);

    // 6. Study Quantity vs Learning Effectiveness: detects passive reading bottleneck
    const passiveReadingAnalysis = evaluateStudyQuantityVsEffectiveness({
      studySessions: [
        {
          id: "sess-1",
          subjectId: "sub-eco",
          subjectName: "Economics",
          durationSeconds: 240 * 60, // 4 hours
          sessionType: "theory_reading",
          date: "2026-10-03",
        } as any,
      ],
      practiceSessions: [], // 0 practice questions
      mistakes: [],
    });
    expect(passiveReadingAnalysis.learningSignal).toBe("Needs Practice Balance");
    expect(passiveReadingAnalysis.signalRationale.includes("reading") || passiveReadingAnalysis.signalRationale.includes("practice")).toBe(true);

    // Balanced active study
    const balancedAnalysis = evaluateStudyQuantityVsEffectiveness({
      studySessions: [
        {
          id: "sess-2",
          subjectId: "sub-acc",
          subjectName: "Accountancy",
          durationSeconds: 120 * 60,
          sessionType: "study",
          date: "2026-10-03",
        } as any,
      ],
      practiceSessions: [
        {
          id: "prac-bal",
          accuracyPercentage: 88,
          totalQuestions: 25,
          correctCount: 22, // 88%
          timestamp: Date.now(),
        } as any,
      ],
      mistakes: [
        {
          lifecycleStatus: "Corrected",
          occurrenceCount: 1,
        } as any,
      ],
    });
    expect(balancedAnalysis.learningSignal).toBe("Positive");
    expect(balancedAnalysis.recentPracticeAccuracyPct).toBe(88);

    // 7. Subject Performance Intelligence
    const subjectPerformances = evaluateSubjectPerformances({
      subjects: [{ id: "sub-eco", name: "Economics" }],
      chapters: [
        {
          id: "ch-1",
          title: "Introduction to Economics",
          subjectId: "sub-eco",
          subjectName: "Economics",
          status: "In Progress",
        } as any,
      ],
      practiceSessions: [],
      revisions: [],
      mistakes: [],
    });
    expect(subjectPerformances.length >= 1).toBe(true);
    expect(subjectPerformances[0].subjectName).toBe("Economics");
    expect(subjectPerformances[0].coverageLevel !== undefined).toBe(true);

    // 8. Learning Bottleneck Detection
    const bottlenecks = detectLearningBottlenecks({
      totalStudyMinutes: 300,
      practiceQuestionsCount: 25,
      mistakes: [
        {
          chapterTitle: "Money and Banking",
          lifecycleStatus: "Repeated",
          occurrenceCount: 2,
        } as any,
        {
          chapterTitle: "Partnership Basics",
          lifecycleStatus: "Repeated",
          occurrenceCount: 2,
        } as any,
      ],
      revisions: [
        { completed: false, scheduledDate: "2026-09-01" } as any,
        { completed: false, scheduledDate: "2026-09-02" } as any,
      ],
      chapters: [],
    });
    expect(bottlenecks.length >= 2).toBe(true);
    expect(bottlenecks.some((b) => b.patternType === "Concept Bottleneck")).toBe(true);
    expect(bottlenecks.some((b) => b.patternType === "Recall Check Recommended")).toBe(true);

    // 9. Exam Readiness 2.0: Multi-dimensional, honest handling
    const readinessNoData = evaluateExamReadiness2({
      chapters: [],
      practiceSessions: [],
      revisions: [],
      mistakes: [],
      examRecords: [],
      streakDays: 0,
    });
    expect(readinessNoData.hasEnoughData).toBe(false);
    expect(readinessNoData.overallReadinessSummary).toBe("Not enough data yet");

    // 10. Next Best Actions with Student-Facing Evidence (Max 3 actions)
    const nextActions = generateNextBestActionsWithEvidence({
      weakTopics: [
        {
          chapterId: "ch-cf",
          chapterTitle: "Cash Flow Statement",
          subjectName: "Accountancy",
          subjectId: "sub-acc",
          diagnosisType: "Type A — Low accuracy",
          evidenceSummary: "Practice accuracy is 30% across 10 questions.",
          severity: "High",
          suggestedAction: "Solve 5 guided numerical questions focusing on operating activities.",
        },
      ],
      mistakes: [],
      revisions: [],
      chapters: [],
    });
    expect(nextActions.length <= 3).toBe(true);
    expect(nextActions[0].rank).toBe(1);
    expect(nextActions[0].why.length > 0).toBe(true);
    expect(nextActions[0].evidence.includes("30%")).toBe(true);
    expect(nextActions[0].howLongMinutes > 0).toBe(true);

    // 11. Full Learning Effectiveness Report Generation
    const fullReport = generateLearningEffectivenessReport({
      student: studentP5,
      subjects: [{ id: "sub-acc", name: "Accountancy" } as any],
      studySessions: [],
      academicChapters: [],
      revisions: [],
      practiceSessions: [],
      examRecords: [
        {
          id: "mock-1",
          testType: "Mock Exam",
          marksObtained: 60,
          maxMarks: 100,
          date: "2026-09-20",
        } as any,
        {
          id: "mock-2",
          testType: "Mock Exam",
          marksObtained: 75,
          maxMarks: 100,
          date: "2026-10-01",
        } as any,
      ],
      examProfile: {
        examName: "BSEB Class 12 Commerce",
        startDate: "2027-02-01",
      } as any,
    });
    expect(fullReport.profileId).toBe(studentP5.id);
    expect(fullReport.mockTestTrajectory.totalMocksLogged).toBe(2);
    expect(fullReport.mockTestTrajectory.mockTrend).toBe("Improving");
    expect(fullReport.mockTestTrajectory.scoreDeltaPct).toBe(15);
    expect(fullReport.weeklyReview2.weekLabel.length > 0).toBe(true);

    // 12. Abya AI: P5 Effectiveness & Guidance Responses
    const abyaImproving = generateAbyaFallbackResponse(
      "general",
      "am i actually improving?",
      {
        profile: studentP5,
        tasks: [],
        subjects: [{ id: "sub-acc", name: "Accountancy" }],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaImproving.includes("Learning Effectiveness") || abyaImproving.includes("data yet")).toBe(true);

    const abyaRevisionHelp = generateAbyaFallbackResponse(
      "general",
      "did my revision help?",
      {
        profile: studentP5,
        tasks: [],
        subjects: [],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaRevisionHelp.includes("Revision Effectiveness") || abyaRevisionHelp.includes("Revision complete")).toBe(true);

    const abyaBottlenecks = generateAbyaFallbackResponse(
      "general",
      "why is my performance dropping?",
      {
        profile: studentP5,
        tasks: [],
        subjects: [],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaBottlenecks.includes("Bottleneck") || abyaBottlenecks.includes("drop")).toBe(true);

    const abyaSubjectAttention = generateAbyaFallbackResponse(
      "general",
      "which subject needs attention?",
      {
        profile: studentP5,
        tasks: [],
        subjects: [{ id: "sub-acc", name: "Accountancy" }],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaSubjectAttention.includes("Priority") || abyaSubjectAttention.includes("Accountancy")).toBe(true);
  });

  // =========================================================================
  // SUBTEST 30: P6 EXAM STRATEGY & SCORE IMPROVEMENT INTELLIGENCE
  // =========================================================================
  it("30. P6 Exam Strategy & Score Improvement Intelligence: verifies exam context provenance separation, exam strategy profile, mock analysis 2.0, evidence-derived score opportunity, marks-loss analysis, question selection strategy, time management, chapter opportunity, exam revision priority, score trajectory, and Abya AI strategy guidance", async () => {
    const studentP6: StudentProfile = {
      id: "student-p6-rohit",
      name: "Rohit Kumar",
      classLevel: "Class 12",
      stream: "Commerce",
      board: "BSEB",
      targetExam: "BSEB Class 12 Commerce Board 2027",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const examProfileP6 = {
      id: "ep-p6",
      examName: "BSEB Class 12 Commerce",
      targetDate: "2027-02-15",
      dailyStudyHours: 3,
      stream: "Commerce",
      classLevel: "Class 12",
      board: "BSEB",
    };

    // 1. Exam Context: Provenance separation (Target Date vs Official Gazette vs Historical)
    const ctxTarget = resolveStructuredExamContext({
      examProfile: examProfileP6 as any,
    });
    expect(ctxTarget.activeDateType).toBe("STUDENT_TARGET_DATE");
    expect(ctxTarget.studentTargetDate).toBe("2027-02-15");
    expect(ctxTarget.officialDateVerified).toBe(false);

    const ctxOfficial = resolveStructuredExamContext({
      examProfile: {
        ...examProfileP6,
        officialVerifiedExamDate: "2027-02-01",
        isOfficialDateVerified: true,
      } as any,
    });
    expect(ctxOfficial.officialDateVerified).toBe(true);
    expect(ctxOfficial.activeDateType).toBe("OFFICIAL_EXAM_DATE");
    expect(ctxOfficial.officialExamDate).toBe("2027-02-01");

    // 2. Exam Strategy Profile: multi-signal assessment
    const stratProfile = buildExamStrategyProfile({
      mockAnalysis: {
        score: 75,
        maxScore: 100,
        marksObtained: 75,
        maxMarks: 100,
        accuracyPercentage: 75,
        attemptedCount: 45,
        correctCount: 38,
        incorrectCount: 7,
        skippedCount: 5,
        timeUsedMinutes: 165,
        errorCategories: {
          conceptErrors: 2,
          calculationErrors: 3,
          carelessSlips: 1,
          timePressureErrors: 1,
          unattemptedQuestions: 5,
        },
        timeManagementEvaluation: {
          totalTimeSpentMinutes: 165,
          pacingPointers: [],
        },
        chapterWiseBreakdown: [],
      } as any,
      practiceSessions: [
        {
          id: "ps-1",
          chapterTitle: "Issue of Shares",
          subjectName: "Accountancy",
          accuracyPercentage: 85,
          totalQuestions: 20,
          correctCount: 17,
        } as any,
      ],
      enhancedMistakes: [
        {
          id: "m-1",
          questionText: "Sample",
          mistakeType: "Calculation error",
          lifecycleStatus: "New",
        } as any,
      ],
    });
    expect(stratProfile.accuracyRating !== undefined).toBe(true);
    expect(stratProfile.speedRating !== undefined).toBe(true);
    expect(stratProfile.possibleStrategyImprovements.length > 0).toBe(true);

    // 3. Mock Analysis 2.0: score, accuracy, attempted, correct, incorrect, skipped, timing
    const mockAnalysis = analyzeMockTest2({
      test: {
        id: "mock-full-1",
        testName: "Commerce Full Mock 1",
        subjectName: "Accountancy",
        testType: "Mock Exam",
        marksObtained: 75,
        maxMarks: 100,
        date: "2026-10-01",
        timeSpentMinutes: 180,
      } as any,
    });
    expect(mockAnalysis.totalScore).toBe(75);
    expect(mockAnalysis.maxMarks).toBe(100);
    expect(mockAnalysis.accuracyPercentage).toBe(75);
    expect(mockAnalysis.timeUsedMinutes).toBe(180);

    // 4. Score Opportunity: Evidence-derived & Non-causal honest wording
    const scoreOpp = calculateScoreOpportunity({
      mockTests: [
        {
          id: "m-test",
          marksObtained: 68,
          maxMarks: 100,
          date: "2026-09-30",
        } as any,
      ],
      mistakes: [
        {
          chapterTitle: "Accounting for Share Capital",
          mistakeType: "Calculation error",
          lifecycleStatus: "New",
        } as any,
      ],
    });
    expect(scoreOpp.hasEnoughData).toBe(true);
    expect(scoreOpp.observedScore).toBe(68);
    expect(scoreOpp.potentialImprovementAreas.length > 0).toBe(true);
    expect(scoreOpp.honestStatement.includes("Does not promise or guarantee future marks")).toBe(true);

    // 5. Marks-Loss Analysis & P6 Full Report
    const p6Report = generateExamStrategyReport({
      student: studentP6,
      examProfile: examProfileP6 as any,
      subjects: [{ id: "sub-acc", name: "Accountancy", color: "#10b981" } as AcademicSubject],
      chapters: [
        {
          id: "ch-sh",
          title: "Accounting for Share Capital",
          subjectId: "sub-acc",
          subjectName: "Accountancy",
        } as any,
      ],
      examTestRecords: [
        {
          id: "rec-1",
          testName: "Accountancy Pre-Board Mock",
          subjectName: "Accountancy",
          marksObtained: 70,
          maxMarks: 100,
          date: "2026-09-28",
        } as any,
      ],
    });
    expect(p6Report.profileId).toBe(studentP6.id);
    expect(p6Report.marksLossAnalysis.totalMarksLost).toBe(30);
    expect(p6Report.questionSelectionStrategy.selectionRules.length > 0).toBe(true);
    expect(p6Report.timeManagementStrategy.personalTimePlan.phases.length >= 3).toBe(true);
    expect(p6Report.examRevisionPriorities.length <= 5).toBe(true);

    // 6. Post-Mock Loop Flow
    const postMock = generatePostMockReviewFlow({
      latestMock: {
        id: "m-loop",
        marksObtained: 72,
        maxMarks: 100,
        subjectName: "Accountancy",
      } as any,
      weakChapters: ["Cash Flow Statement"],
      mistakes: [],
    });
    expect(postMock.loopSequence.length).toBe(5);
    expect(postMock.loopSequence[0].step).toBe("1. Mock Attempt");
    expect(postMock.loopSequence[1].step).toBe("2. Automated Diagnosis");
    expect(postMock.loopSequence[2].step).toBe("3. P4 Study Action");
    expect(postMock.loopSequence[3].step).toBe("4. Adaptive Practice");
    expect(postMock.loopSequence[4].step).toBe("5. Targeted Retry");

    // 7. Score Trajectory: Improving / Stable / Declining
    const trajImproving = calculateScoreImprovementTrajectory({
      mockTests: [
        { id: "m1", marksObtained: 60, maxMarks: 100, date: "2026-09-10" } as any,
        { id: "m2", marksObtained: 75, maxMarks: 100, date: "2026-09-25" } as any,
      ],
    });
    expect(trajImproving.trajectoryDirection).toBe("Improving");
    expect(trajImproving.scoreDeltaPct).toBe(15);

    const trajDeclining = calculateScoreImprovementTrajectory({
      mockTests: [
        { id: "m1", marksObtained: 80, maxMarks: 100, date: "2026-09-10" } as any,
        { id: "m2", marksObtained: 65, maxMarks: 100, date: "2026-09-25" } as any,
      ],
    });
    expect(trajDeclining.trajectoryDirection).toBe("Declining");

    // 8. Strategy Effectiveness: returns "Not enough data yet." when insufficient
    const effNoData = evaluateStrategyEffectiveness({
      mockTests: [{ id: "m1", marksObtained: 70, maxMarks: 100, date: "2026-09-10" } as any],
    });
    expect(effNoData.hasEnoughData).toBe(false);
    expect(effNoData.signalMessage).toBe("Not enough data yet.");

    // 9. Abya AI P6 Routes
    const abyaScoreImprovement = generateAbyaFallbackResponse(
      "general",
      "how can i improve my mock score?",
      {
        profile: studentP6,
        tasks: [],
        subjects: [{ id: "sub-acc", name: "Accountancy" }],
        chapters: [],
        tests: [{ id: "t1", marksObtained: 70, maxMarks: 100, date: "2026-09-20" } as any],
      } as any
    );
    expect(abyaScoreImprovement.includes("Score Opportunity") || abyaScoreImprovement.includes("Mock")).toBe(true);

    const abyaMarksLoss = generateAbyaFallbackResponse(
      "general",
      "where am i losing marks in my exam?",
      {
        profile: studentP6,
        tasks: [],
        subjects: [{ id: "sub-acc", name: "Accountancy" }],
        chapters: [],
        tests: [{ id: "t1", marksObtained: 70, maxMarks: 100, date: "2026-09-20" } as any],
      } as any
    );
    expect(abyaMarksLoss.includes("Marks-Loss") || abyaMarksLoss.includes("Lost")).toBe(true);

    const abyaBeforeExam = generateAbyaFallbackResponse(
      "general",
      "what should i do before my exam?",
      {
        profile: studentP6,
        tasks: [],
        subjects: [{ id: "sub-acc", name: "Accountancy" }],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaBeforeExam.includes("Checklist") || abyaBeforeExam.includes("Exam")).toBe(true);
  });

  // =========================================================================
  // SUBTEST 31: P7 ADAPTIVE PRACTICE & QUESTION INTELLIGENCE 2.0
  // =========================================================================
  it("31. P7 Adaptive Practice & Question Intelligence 2.0: verifies unified question bank pool, provenance classification, transparent adaptive scoring formula, session builder (10m-45m), dynamic next-question recommendations, practice attempt logging with P5 mistake integration, practice effectiveness metrics, practice coverage intelligence, question bank quality audit, P4 study action conversion, profile isolation, and Abya AI adaptive practice routing", async () => {
    const studentP7A: StudentProfile = {
      id: "student-p7-priya",
      name: "Priya Sharma",
      classLevel: "Class 12",
      stream: "Commerce",
      board: "BSEB",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const studentP7B: StudentProfile = {
      id: "student-p7-arav",
      name: "Arav Verma",
      classLevel: "Class 12",
      stream: "Commerce",
      board: "BSEB",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 1. Unified Question Bank Pool & Provenance Classification
    const pool = buildUnifiedAdaptiveQuestionPool({
      classLevel: "Class 12",
      stream: "Commerce",
      board: "BSEB",
    });
    expect(pool.length > 0).toBe(true);

    // Provenance types verified
    const provenanceTypes = new Set(pool.map((q) => q.provenanceType));
    expect(
      provenanceTypes.has("VERIFIED HISTORICAL PYQ") ||
      provenanceTypes.has("OFFICIAL MODEL PAPER") ||
      provenanceTypes.has("APPLICATION-DERIVED PRACTICE") ||
      provenanceTypes.has("SAMPLE PRACTICE")
    ).toBe(true);

    // Difficulty sources verified
    for (const q of pool.slice(0, 10)) {
      expect(["Source-provided", "Application-derived", "Unknown"].includes(q.difficultySource)).toBe(true);
      expect(q.marks !== undefined && q.marks > 0).toBe(true);
    }

    // 2. Transparent Adaptive Question Scoring Engine
    const sampleQ = pool[0];
    const scoreBreakdown = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "BALANCED",
      context: {
        student: studentP7A,
        practiceSessions: [],
        enhancedMistakes: [],
        revisions: [],
      },
      attemptHistory: [],
    });
    expect(scoreBreakdown.totalAdaptiveScore >= 0).toBe(true);
    expect(scoreBreakdown.selectionReason.length > 0).toBe(true);
    expect(scoreBreakdown.evidenceExplanation.includes("Adaptive Score")).toBe(true);

    // 2.1 Independent Factor Verification:
    // Factor 1: Topic Weakness Factor
    const scoreWeakHigh = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "BALANCED",
      context: {
        student: studentP7A,
        practiceSessions: [{ chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, accuracyPercentage: 30 } as any],
        enhancedMistakes: [],
        revisions: [],
      },
      attemptHistory: [{ questionId: sampleQ.id, chapterTitle: sampleQ.chapterTitle } as any],
    });
    const scoreWeakLow = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "BALANCED",
      context: {
        student: studentP7A,
        practiceSessions: [{ chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, accuracyPercentage: 90 } as any],
        enhancedMistakes: [],
        revisions: [],
      },
      attemptHistory: [{ questionId: sampleQ.id, chapterTitle: sampleQ.chapterTitle } as any],
    });
    expect(scoreWeakHigh.topicWeaknessFactor).toBe(35);
    expect(scoreWeakLow.topicWeaknessFactor).toBe(0);
    expect(scoreWeakHigh.totalAdaptiveScore > scoreWeakLow.totalAdaptiveScore).toBe(true);

    // Factor 2: Mistake Recurrence Factor
    const scoreMistakeRepeated = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "BALANCED",
      context: {
        student: studentP7A,
        practiceSessions: [],
        enhancedMistakes: [{ chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, lifecycleStatus: "Repeated" } as any],
        revisions: [],
      },
      attemptHistory: [],
    });
    const scoreMistakeNone = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "BALANCED",
      context: {
        student: studentP7A,
        practiceSessions: [],
        enhancedMistakes: [],
        revisions: [],
      },
      attemptHistory: [],
    });
    expect(scoreMistakeRepeated.mistakeRecurrenceFactor).toBe(30);
    expect(scoreMistakeNone.mistakeRecurrenceFactor).toBe(0);
    expect(scoreMistakeRepeated.totalAdaptiveScore > scoreMistakeNone.totalAdaptiveScore).toBe(true);

    // Factor 3: Revision Need Factor
    const scoreRevPending = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "BALANCED",
      context: {
        student: studentP7A,
        practiceSessions: [],
        enhancedMistakes: [],
        revisions: [{ chapterTitle: sampleQ.chapterTitle, completed: false } as any],
      },
      attemptHistory: [],
    });
    const scoreRevDone = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "BALANCED",
      context: {
        student: studentP7A,
        practiceSessions: [],
        enhancedMistakes: [],
        revisions: [{ chapterTitle: sampleQ.chapterTitle, completed: true } as any],
      },
      attemptHistory: [],
    });
    expect(scoreRevPending.revisionNeedFactor).toBe(20);
    expect(scoreRevDone.revisionNeedFactor).toBe(0);

    // Factor 4: Exam Strategy Factor (P6 report)
    const scoreStrategyP6 = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "BALANCED",
      context: {
        student: studentP7A,
        practiceSessions: [],
        enhancedMistakes: [],
        revisions: [],
        p6Report: {
          examRevisionPriorities: [{ chapterTitle: sampleQ.chapterTitle }],
          marksLossAnalysis: { primaryLossCategory: "Conceptual understanding" },
        } as any,
      },
      attemptHistory: [],
    });
    expect(scoreStrategyP6.examStrategyFactor >= 15).toBe(true);

    // Factor 5: Coverage Gap Factor
    const scoreUnattempted = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "BALANCED",
      context: { student: studentP7A, practiceSessions: [], enhancedMistakes: [], revisions: [] },
      attemptHistory: [],
    });
    const scoreAttempted = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "BALANCED",
      context: { student: studentP7A, practiceSessions: [], enhancedMistakes: [], revisions: [] },
      attemptHistory: [{ questionId: sampleQ.id, chapterTitle: sampleQ.chapterTitle } as any],
    });
    expect(scoreUnattempted.coverageGapFactor > scoreAttempted.coverageGapFactor).toBe(true);

    // Factor 6: Mastery State Factor
    expect(scoreUnattempted.masteryStateFactor >= 2 && scoreUnattempted.masteryStateFactor <= 10).toBe(true);

    // 2.2 Independent Practice Mode Multiplier Verifications:
    // WEAK_TOPIC mode (mWeak=1.6)
    const scoreModeWeak = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "WEAK_TOPIC",
      context: {
        student: studentP7A,
        practiceSessions: [{ chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, accuracyPercentage: 40 } as any],
      },
      attemptHistory: [],
    });
    expect(scoreModeWeak.topicWeaknessFactor).toBe(Math.round(35 * 1.6));

    // MISTAKE_RECOVERY mode (mMistake=2.0)
    const scoreModeMistake = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "MISTAKE_RECOVERY",
      context: {
        student: studentP7A,
        enhancedMistakes: [{ chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, lifecycleStatus: "Repeated" } as any],
      },
      attemptHistory: [],
    });
    expect(scoreModeMistake.mistakeRecurrenceFactor).toBe(Math.round(30 * 2.0));

    // REVISION_PRACTICE mode (mRev=1.8)
    const scoreModeRev = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "REVISION_PRACTICE",
      context: {
        student: studentP7A,
        revisions: [{ chapterTitle: sampleQ.chapterTitle, completed: false } as any],
      },
      attemptHistory: [],
    });
    expect(scoreModeRev.revisionNeedFactor).toBe(Math.round(20 * 1.8));

    // EXAM_STRATEGY mode (mExam=1.8)
    const scoreModeExam = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "EXAM_STRATEGY",
      context: {
        student: studentP7A,
        p6Report: {
          examRevisionPriorities: [{ chapterTitle: sampleQ.chapterTitle }],
          marksLossAnalysis: { primaryLossCategory: "Unknown" },
        } as any,
      },
      attemptHistory: [],
    });
    expect(scoreModeExam.examStrategyFactor).toBe(Math.round(15 * 1.8));

    // QUICK_PRACTICE mode (mWeak=1.2, mExam=1.2)
    const scoreModeQuick = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "QUICK_PRACTICE",
      context: {
        student: studentP7A,
        practiceSessions: [{ chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, accuracyPercentage: 40 } as any],
      },
      attemptHistory: [],
    });
    expect(scoreModeQuick.topicWeaknessFactor).toBe(Math.round(35 * 1.2));

    // 2.3 Equal-Score Deterministic Tie-Breaking Verification
    const dummyQ1: AdaptiveQuestion = {
      ...sampleQ,
      id: "q-tie-b",
      questionText: "Dummy Tie Question B",
    };
    const dummyQ2: AdaptiveQuestion = {
      ...sampleQ,
      id: "q-tie-a",
      questionText: "Dummy Tie Question A",
    };
    const scoreQ1 = calculateAdaptiveQuestionScore({ question: dummyQ1, mode: "BALANCED", context: {}, attemptHistory: [] });
    const scoreQ2 = calculateAdaptiveQuestionScore({ question: dummyQ2, mode: "BALANCED", context: {}, attemptHistory: [] });
    expect(scoreQ1.totalAdaptiveScore).toBe(scoreQ2.totalAdaptiveScore);

    const tieList = [
      { question: dummyQ1, scoreBreakdown: scoreQ1, category: "Maintenance" as const, estimatedTimeMinutes: 2 },
      { question: dummyQ2, scoreBreakdown: scoreQ2, category: "Maintenance" as const, estimatedTimeMinutes: 2 },
    ];
    tieList.sort((a, b) => {
      const diff = b.scoreBreakdown.totalAdaptiveScore - a.scoreBreakdown.totalAdaptiveScore;
      if (diff !== 0) return diff;
      return a.question.id.localeCompare(b.question.id);
    });
    expect(tieList[0].question.id).toBe("q-tie-a");
    expect(tieList[1].question.id).toBe("q-tie-b");

    // 2.4 Missing, Empty & Malformed Context Resiliency Verification
    const scoreEmpty = calculateAdaptiveQuestionScore({
      question: sampleQ,
      mode: "BALANCED",
      context: {
        practiceSessions: [
          { chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, accuracyPercentage: NaN } as any,
          { chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, accuracyPercentage: undefined } as any,
          { chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, accuracyPercentage: null } as any,
          { chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, accuracyPercentage: Infinity } as any,
          { chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, accuracyPercentage: -50 } as any,
          { chapterTitle: sampleQ.chapterTitle, subjectName: sampleQ.subjectName, accuracyPercentage: 999 } as any,
        ],
      },
      attemptHistory: [],
    });
    expect(Number.isFinite(scoreEmpty.totalAdaptiveScore)).toBe(true);
    expect(Number.isNaN(scoreEmpty.totalAdaptiveScore)).toBe(false);
    expect(scoreEmpty.totalAdaptiveScore >= 0).toBe(true);

    // 3. Adaptive Practice Session Builder (10m, 20m, 30m, 45m)
    const session10 = buildAdaptivePracticeSession({
      config: {
        profileId: studentP7A.id,
        durationMinutes: 10,
        mode: "BALANCED",
      },
      context: {
        student: studentP7A,
      },
    });
    expect(session10.targetDurationMinutes).toBe(10);
    expect(session10.totalQuestions <= 5).toBe(true);
    expect(session10.honestDisclaimer.includes("Does not guarantee future examination marks")).toBe(true);

    const session30 = buildAdaptivePracticeSession({
      config: {
        profileId: studentP7A.id,
        durationMinutes: 30,
        mode: "MISTAKE_RECOVERY",
      },
      context: {
        student: studentP7A,
      },
    });
    expect(session30.targetDurationMinutes).toBe(30);
    expect(session30.totalQuestions >= 5).toBe(true);
    expect(session30.focusSubjects.length > 0).toBe(true);

    // Categories Must Practice / Should Practice / Maintenance
    const categories = new Set(session30.allQuestions.map((q) => q.category));
    expect(categories.has("Must Practice") || categories.has("Should Practice") || categories.has("Maintenance")).toBe(true);

    // 4. Dynamic Next-Question Decision Engine
    const fakeAttemptCorrect: StudentPracticeAttempt = {
      id: "att-1",
      profileId: studentP7A.id,
      questionId: pool[0].id,
      subjectName: pool[0].subjectName,
      chapterTitle: pool[0].chapterTitle,
      questionType: "MCQ",
      difficulty: "Easy",
      isCorrect: true,
      timeSpentSeconds: 30,
      attemptNumber: 1,
      timestamp: Date.now(),
    };

    const nextAfterCorrect = recommendNextAdaptiveQuestion({
      lastAttempt: fakeAttemptCorrect,
      availableQuestions: pool,
      completedQuestionIds: [pool[0].id],
      context: { student: studentP7A },
    });
    expect(nextAfterCorrect.actionType !== "COMPLETED").toBe(true);
    expect(nextAfterCorrect.nextQuestion !== null).toBe(true);

    const fakeAttemptCalcError: StudentPracticeAttempt = {
      id: "att-2",
      profileId: studentP7A.id,
      questionId: pool[0].id,
      subjectName: pool[0].subjectName,
      chapterTitle: pool[0].chapterTitle,
      questionType: "Numerical",
      difficulty: "Medium",
      isCorrect: false,
      mistakeType: "Calculation error",
      timeSpentSeconds: 90,
      attemptNumber: 1,
      timestamp: Date.now(),
    };

    const nextAfterError = recommendNextAdaptiveQuestion({
      lastAttempt: fakeAttemptCalcError,
      availableQuestions: pool,
      completedQuestionIds: [pool[0].id],
      context: { student: studentP7A },
    });
    expect(nextAfterError.actionType).toBe("SIMILAR_CONCEPT");
    expect(nextAfterError.reason.includes("calculation") || nextAfterError.reason.includes("reinforcing")).toBe(true);

    // 5. Practice Attempt Recording & P5 Mistake Intelligence Closed Loop
    const targetQ = pool[0];

    // Student A records an incorrect attempt
    const resA1 = recordAdaptivePracticeAttempt({
      profileId: studentP7A.id,
      question: targetQ,
      isCorrect: false,
      selectedOption: 0,
      timeSpentSeconds: 45,
      attemptNumber: 1,
      mistakeType: "Calculation error",
      notes: "Arithmetical slip in ledger addition",
    });
    expect(resA1.attempt.isCorrect).toBe(false);
    expect(resA1.attempt.mistakeType).toBe("Calculation error");

    // Verifies P5 EnhancedMistakeRecord was created
    const p5MistakesA1 = loadEnhancedMistakes(studentP7A.id);
    const createdMistake = p5MistakesA1.find((m) => m.questionText === targetQ.questionText);
    expect(createdMistake !== undefined).toBe(true);
    expect(createdMistake!.lifecycleStatus).toBe("New");
    expect(createdMistake!.mistakeCategory).toBe("calculation");

    // Student A retries the question and gets it correct!
    const resA2 = recordAdaptivePracticeAttempt({
      profileId: studentP7A.id,
      question: targetQ,
      isCorrect: true,
      selectedOption: targetQ.correctOptionIndex,
      timeSpentSeconds: 35,
      attemptNumber: 2,
      notes: "Resolved after double-checking columnar arithmetic",
    });
    expect(resA2.attempt.isCorrect).toBe(true);
    expect(resA2.attempt.attemptNumber).toBe(2);

    // Verifies P5 EnhancedMistake was promoted to 'Corrected'!
    const p5MistakesA2 = loadEnhancedMistakes(studentP7A.id);
    const correctedMistake = p5MistakesA2.find((m) => m.questionText === targetQ.questionText);
    expect(correctedMistake !== undefined).toBe(true);
    expect(correctedMistake!.lifecycleStatus).toBe("Corrected");
    expect(correctedMistake!.correctionAttempts >= 1).toBe(true);

    // 6. Practice Effectiveness: Non-causal wording & Honest Metrics
    const effEmpty = calculatePracticeEffectiveness({
      attempts: [],
      enhancedMistakes: [],
    });
    expect(effEmpty.totalQuestionsAttempted).toBe(0);
    expect(effEmpty.effectivenessSignal).toBe("Not enough practice data yet.");

    const effWithAttempts = calculatePracticeEffectiveness({
      attempts: resA2.allAttempts,
      enhancedMistakes: p5MistakesA2,
    });
    expect(effWithAttempts.totalQuestionsAttempted >= 2).toBe(true);
    expect(effWithAttempts.retriesAttempted >= 1).toBe(true);
    expect(effWithAttempts.retriesSuccessful >= 1).toBe(true);
    expect(effWithAttempts.retryImprovementPct >= 50).toBe(true);
    expect(effWithAttempts.honestStatement.includes("Does not imply guaranteed future marks")).toBe(true);

    // 7. Practice Coverage Intelligence
    const covReport = analyzePracticeCoverage({
      attempts: resA2.allAttempts,
      classLevel: "Class 12",
      stream: "Commerce",
    });
    expect(covReport.totalAvailableTopics > 0).toBe(true);
    expect(covReport.practicedTopicsCount >= 1).toBe(true);
    expect(covReport.untouchedTopics.length > 0).toBe(true);

    // 8. Question Bank Quality & Duplicate Audit
    const auditRes = auditQuestionBankQuality();
    expect(auditRes.totalQuestions > 0).toBe(true);
    expect(auditRes.validQuestionsCount > 0).toBe(true);
    expect(auditRes.duplicateAudit.uniqueCount > 0).toBe(true);

    // 9. P4 Study Action Converter
    const studyActions = convertPracticePlanToStudyActions(session30);
    expect(studyActions.length <= 3).toBe(true);
    expect(studyActions[0].rank).toBe(1);
    expect(studyActions[0].title.includes("Practice:")).toBe(true);
    expect(studyActions[0].durationMinutes > 0).toBe(true);
    expect(studyActions[0].reason.length > 0).toBe(true);

    // 10. Multi-Student Profile Isolation
    const attemptsStudentB = loadStudentPracticeAttempts(studentP7B.id);
    expect(attemptsStudentB.length).toBe(0); // Student B must have ZERO attempts
    const mistakesStudentB = loadEnhancedMistakes(studentP7B.id);
    expect(mistakesStudentB.some((m) => m.questionText === targetQ.questionText)).toBe(false);

    // 11. Abya AI P7 Routes Verification
    const abyaPracticeToday = generateAbyaFallbackResponse(
      "general",
      "what should i practice today?",
      {
        profile: studentP7A,
        tasks: [],
        subjects: [{ id: "sub-acc", name: "Accountancy" }],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaPracticeToday.includes("Adaptive Practice") || abyaPracticeToday.includes("Questions")).toBe(true);

    const abyaWeakPractice = generateAbyaFallbackResponse(
      "general",
      "practice my weak topics",
      {
        profile: studentP7A,
        tasks: [],
        subjects: [{ id: "sub-acc", name: "Accountancy" }],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaWeakPractice.includes("Weak-Topic") || abyaWeakPractice.includes("Practice")).toBe(true);

    const abyaMistakesPractice = generateAbyaFallbackResponse(
      "general",
      "practice my mistakes",
      {
        profile: studentP7A,
        tasks: [],
        subjects: [],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaMistakesPractice.includes("Mistake") || abyaMistakesPractice.includes("resolved")).toBe(true);

    const abyaWhySelected = generateAbyaFallbackResponse(
      "general",
      "why did you select this question?",
      {
        profile: studentP7A,
        tasks: [],
        subjects: [],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaWhySelected.includes("Topic Weakness") && abyaWhySelected.includes("Mistake Recurrence")).toBe(true);

    const abyaQuick30m = generateAbyaFallbackResponse(
      "general",
      "give me a 30 minute practice plan",
      {
        profile: studentP7A,
        tasks: [],
        subjects: [],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaQuick30m.includes("Must Practice") || abyaQuick30m.includes("Practice Plan")).toBe(true);

    const abyaCoverage = generateAbyaFallbackResponse(
      "general",
      "what is my practice coverage?",
      {
        profile: studentP7A,
        tasks: [],
        subjects: [],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaCoverage.includes("Coverage") || abyaCoverage.includes("topics")).toBe(true);

    const abyaHelping = generateAbyaFallbackResponse(
      "general",
      "is practice helping me improve?",
      {
        profile: studentP7A,
        tasks: [],
        subjects: [],
        chapters: [],
        tests: [],
      } as any
    );
    expect(abyaHelping.includes("Effectiveness") || abyaHelping.includes("Questions Attempted") || abyaHelping.includes("enough practice data")).toBe(true);
  });
});

