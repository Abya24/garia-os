import {
  Task,
  Subject,
  StudySession,
  Note,
  Habit,
  WaterLog,
  FocusSessionLog,
  Goal,
  CalendarEvent,
  AbyaMessage,
  UserSettings,
  AbyaLanguageSetting,
  StudentProfile,
  StreamType,
  CareerProfile,
  CareerAssessment,
  CareerRoadmap,
  CareerQuizAnswers,
  AcademicSubject,
  AcademicChapter,
  AcademicTest,
  AcademicVVITopic,
  AcademicRevisionItem,
  AcademicPracticeSession,
  AcademicRoadmapData,
  SmartStudyPlan,
  ExamProfile,
  ExamMilestone,
  ExamMockTest,
  ExamDailyPlan,
  ExamTestRecord,
  ExamIntelligenceReport,
} from "../types";
import {
  DEFAULT_COMMERCE_SUBJECTS,
  DEFAULT_SCIENCE_SUBJECTS,
  DEFAULT_ARTS_SUBJECTS,
  DEFAULT_INITIAL_CHAPTERS,
  getDefaultSubjectsForStream,
} from "./academicEngine";
import { CAREER_CATALOG, generateDefaultRoadmap } from "./careerEngine";

export const PROFILES_KEY = "garia_profiles_v1";
export const ACTIVE_PROFILE_KEY = "garia_active_profile_v1";

const STORAGE_KEYS = {
  TASKS: "garia_tasks_v1",
  SUBJECTS: "garia_subjects_v1",
  STUDY_SESSIONS: "garia_study_sessions_v1",
  NOTES: "garia_notes_v1",
  HABITS: "garia_habits_v1",
  WATER: "garia_water_v1",
  FOCUS: "garia_focus_v1",
  GOALS: "garia_goals_v1",
  CALENDAR_EVENTS: "garia_calendar_events_v1",
  ABYA_CHAT: "garia_abya_chat_v1",
  SETTINGS: "garia_settings_v1",
  CAREER_PROFILE: "garia_career_profile_v1",
  CAREER_ASSESSMENT: "garia_career_assessment_v1",
  CAREER_ROADMAP: "garia_career_roadmap_v1",
  CAREER_QUIZ: "career_quiz_v1",
  SMART_SUGGESTIONS: "smart_suggestions_v1",
  ACADEMIC_SUBJECTS: "garia_academic_subjects_v1",
  ACADEMIC_CHAPTERS: "garia_academic_chapters_v1",
  ACADEMIC_TESTS: "garia_academic_tests_v1",
  ACADEMIC_PLAN: "garia_academic_plan_v1",
  ACADEMIC_ROADMAP: "academic_roadmap_v1",
  VVI_TOPICS: "vvi_topics_v1",
  REVISIONS: "revisions_v1",
  PRACTICE: "practice_v1",
  EXAM_PROFILE: "garia_exam_profile_v1",
  EXAM_MILESTONES: "garia_exam_milestones_v1",
  EXAM_TESTS: "garia_exam_tests_v1",
  EXAM_TESTS_V19: "exam_tests_v1",
  EXAM_ANALYSIS_V19: "exam_analysis_v1",
  EXAM_PLAN: "garia_exam_plan_v1",
};

export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getProfileKey = (profileId: string, baseKey: string): string => {
  return `garia_p_${profileId}_${baseKey}`;
};

// Helper Storage Functions
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

// Seed Defaults
const defaultSettings: UserSettings = {
  userName: "Student",
  theme: "dark",
  customApiKey: "",
  notificationsEnabled: true,
  notifications: {
    master: true,
    study: true,
    tasks: true,
    revision: true,
    habits: true,
    water: true,
    exam: true,
    suggestions: true,
  },
  account: {
    email: "private@gariaos.local",
    passwordHash: "",
    name: "Private User",
    isPrivateMode: true,
    createdAt: Date.now(),
  },
  waterGoal: 8,
  defaultFocusDuration: 25,
  defaultBreakDuration: 5,
  language: "WhatsApp Language",
};

const defaultTasks: Task[] = [
  {
    id: "task-1",
    title: "Review Accountancy Chapter 4 - Balance Sheet",
    description: "Focus on ratio analysis and ledger reconciliations.",
    date: getTodayString(),
    time: "14:00",
    priority: "high",
    category: "study",
    completed: false,
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: "task-2",
    title: "Economics Macroeconomics Mind Map",
    description: "Summarize Fiscal vs Monetary Policy key concepts.",
    date: getTodayString(),
    time: "16:30",
    priority: "medium",
    category: "study",
    completed: true,
    createdAt: Date.now() - 3600000 * 24,
  },
  {
    id: "task-3",
    title: "Complete Business Studies Quiz",
    description: "Chapter 2: Principles of Management",
    date: getTodayString(),
    time: "19:00",
    priority: "high",
    category: "study",
    completed: false,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: "task-4",
    title: "Daily 20-minute Workout & Hydration",
    description: "Stretching and cardio core exercise.",
    date: getTodayString(),
    time: "08:00",
    priority: "low",
    category: "personal",
    completed: true,
    createdAt: Date.now() - 3600000 * 10,
  },
];

export const DEFAULT_COMMERCE_STUDY_SUBJECTS: Subject[] = [
  {
    id: "sub-acc",
    name: "Accountancy",
    color: "#10b981", // Emerald
    targetMinutesPerWeek: 300,
    completedMinutes: 0,
    totalSessions: 0,
  },
  {
    id: "sub-eco",
    name: "Economics",
    color: "#06b6d4", // Cyan
    targetMinutesPerWeek: 300,
    completedMinutes: 0,
    totalSessions: 0,
  },
  {
    id: "sub-bst",
    name: "Business Studies",
    color: "#8b5cf6", // Purple
    targetMinutesPerWeek: 240,
    completedMinutes: 0,
    totalSessions: 0,
  },
  {
    id: "sub-math-comm",
    name: "Mathematics",
    color: "#3b82f6", // Blue
    targetMinutesPerWeek: 240,
    completedMinutes: 0,
    totalSessions: 0,
  },
];

export const DEFAULT_SCIENCE_STUDY_SUBJECTS: Subject[] = [
  {
    id: "sub-phy",
    name: "Physics",
    color: "#06b6d4", // Cyan
    targetMinutesPerWeek: 300,
    completedMinutes: 0,
    totalSessions: 0,
  },
  {
    id: "sub-chem",
    name: "Chemistry",
    color: "#10b981", // Emerald
    targetMinutesPerWeek: 300,
    completedMinutes: 0,
    totalSessions: 0,
  },
  {
    id: "sub-bio",
    name: "Biology",
    color: "#f43f5e", // Rose
    targetMinutesPerWeek: 240,
    completedMinutes: 0,
    totalSessions: 0,
  },
  {
    id: "sub-math-sci",
    name: "Mathematics",
    color: "#3b82f6", // Blue
    targetMinutesPerWeek: 300,
    completedMinutes: 0,
    totalSessions: 0,
  },
];

export const DEFAULT_ARTS_STUDY_SUBJECTS: Subject[] = [
  {
    id: "sub-hist",
    name: "History",
    color: "#f59e0b", // Amber
    targetMinutesPerWeek: 300,
    completedMinutes: 0,
    totalSessions: 0,
  },
  {
    id: "sub-pol",
    name: "Political Science",
    color: "#8b5cf6", // Purple
    targetMinutesPerWeek: 300,
    completedMinutes: 0,
    totalSessions: 0,
  },
  {
    id: "sub-geo",
    name: "Geography",
    color: "#10b981", // Emerald
    targetMinutesPerWeek: 240,
    completedMinutes: 0,
    totalSessions: 0,
  },
  {
    id: "sub-soc",
    name: "Sociology",
    color: "#06b6d4", // Cyan
    targetMinutesPerWeek: 240,
    completedMinutes: 0,
    totalSessions: 0,
  },
];

export const getDefaultStudySubjectsForStream = (stream?: StreamType): Subject[] => {
  const s = (stream || "").toLowerCase();
  if (s.includes("science") || s === "pcm" || s === "pcb") return DEFAULT_SCIENCE_STUDY_SUBJECTS;
  if (s.includes("art") || s.includes("humanities")) return DEFAULT_ARTS_STUDY_SUBJECTS;
  return DEFAULT_COMMERCE_STUDY_SUBJECTS;
};

const defaultNotes: Note[] = [
  {
    id: "note-1",
    title: "Accountancy Ratio Analysis Cheat Sheet",
    content: `## Quick Formulas
- **Current Ratio**: Current Assets / Current Liabilities
- **Quick Ratio**: (Current Assets - Inventory) / Current Liabilities
- **Debt-to-Equity**: Total Debt / Total Shareholders Equity

*Note for Revision*: Keep track of liquidity vs profitability ratios!`,
    pinned: true,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: "note-2",
    title: "Principles of Management Notes",
    content: `### Fayol's 14 Principles
1. Division of Work
2. Authority and Responsibility
3. Discipline
4. Unity of Command
5. Unity of Direction
6. Subordination of Individual Interest
7. Remuneration`,
    pinned: false,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
];

const defaultHabits: Habit[] = [
  {
    id: "habit-1",
    title: "Study 2 Hours",
    category: "study",
    iconName: "book-open",
    streak: 5,
    completedDates: [getTodayString()],
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: "habit-2",
    title: "Daily Exercise",
    category: "health",
    iconName: "activity",
    streak: 3,
    completedDates: [getTodayString()],
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: "habit-3",
    title: "Reading 20 Mins",
    category: "mindset",
    iconName: "book",
    streak: 4,
    completedDates: [getTodayString()],
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: "habit-4",
    title: "Sleep Before 11 PM",
    category: "health",
    iconName: "moon",
    streak: 2,
    completedDates: [],
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "habit-5",
    title: "Daily Revision",
    category: "study",
    iconName: "rotate-cw",
    streak: 6,
    completedDates: [getTodayString()],
    createdAt: Date.now() - 86400000 * 12,
  },
];

const defaultGoals: Goal[] = [
  {
    id: "goal-1",
    title: "Master Accountancy Chapter 4 & 5",
    description: "Complete all practice problems, ratio formulas, and ledger reconciliations.",
    category: "Academic",
    subjectId: "sub-1",
    targetDate: getTodayString(),
    progress: 80,
    completed: false,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "goal-2",
    title: "Maintain 100% Hydration Streak",
    description: "Drink at least 8 glasses of water every day for 14 consecutive days.",
    category: "Health",
    targetDate: getTodayString(),
    progress: 65,
    completed: false,
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: "goal-3",
    title: "Economics Macroeconomics Mock Paper",
    description: "Score 90%+ in the practice exam before Friday.",
    category: "Academic",
    subjectId: "sub-2",
    targetDate: getTodayString(),
    progress: 40,
    completed: false,
    createdAt: Date.now() - 86400000 * 3,
  },
];

const defaultCalendarEvents: CalendarEvent[] = [
  {
    id: "cal-1",
    title: "Accountancy Midterm Exam",
    description: "Comprehensive exam covering Chapters 1 to 5.",
    date: getTodayString(),
    time: "10:00",
    category: "exam",
    completed: false,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "cal-2",
    title: "Business Studies Project Submission",
    description: "Submit PDF report on Principles of Management.",
    date: getTodayString(),
    time: "17:00",
    category: "deadline",
    completed: false,
    createdAt: Date.now() - 86400000 * 4,
  },
];

const createDefaultAbyaMessages = (userName: string): AbyaMessage[] => [
  {
    id: "msg-1",
    role: "model",
    content: `Hello ${userName}! 👋 I am **Abya AI**, your intelligent productivity companion in Garia OS. How can I assist you with your studies, career goals, or exam preparation today?`,
    timestamp: Date.now(),
  },
];

// Career Defaults
const defaultCareerProfile: CareerProfile = {
  stream: "Commerce",
  currentClass: "Class 12",
  selectedCareerId: "ca",
  updatedAt: Date.now(),
};

const defaultCareerAssessment: CareerAssessment = {
  strongSubjects: ["Accountancy", "Economics", "Business Studies"],
  interests: ["Finance/Markets", "Problem Solving", "Management/Leadership"],
  skills: ["Analytical Thinking", "Numerical Ability", "Communication"],
  workAreas: ["Corporate/Office"],
  careerGoals: ["High Earning Potential", "Job Security"],
  studyPreference: "Professional Certifications",
};

const defaultCareerRoadmap: CareerRoadmap = {
  careerId: "ca",
  careerTitle: "Chartered Accountant (CA)",
  stream: "Commerce",
  currentClass: "Class 12",
  milestones: [
    {
      id: "m-ca-0",
      title: "Class 11/12 Commerce Foundation",
      stage: "Foundation",
      description: "Build strong fundamentals in Accountancy, Economics, and Business Math.",
      completed: true,
      targetTimeframe: "Class 12 Board Prep",
    },
    {
      id: "m-ca-1",
      title: "CA Foundation Examination & ICAI Registration",
      stage: "Entrance Exam",
      description: "Register with ICAI and clear the 4-subject CA Foundation examination.",
      completed: false,
      targetTimeframe: "Post Class 12 (June/Dec)",
    },
    {
      id: "m-ca-2",
      title: "CA Intermediate (Group 1 & 2)",
      stage: "Intermediate",
      description: "Pass Group 1 and Group 2 papers covering Taxation, Audit, and Costing.",
      completed: false,
      targetTimeframe: "Year 2",
    },
    {
      id: "m-ca-3",
      title: "2-Year Practical Articleship",
      stage: "Articleship",
      description: "Complete hands-on audit and taxation training under a practicing CA.",
      completed: false,
      targetTimeframe: "Year 3 - Year 4",
    },
    {
      id: "m-ca-4",
      title: "CA Final Examination & ICAI Registration",
      stage: "Final",
      description: "Clear CA Final exams and receive official ICAI membership.",
      completed: false,
      targetTimeframe: "Year 5",
    },
  ],
  lastUpdated: Date.now(),
};

// Exam Defaults
export const DEFAULT_EXAM_PROFILE: ExamProfile = {
  board: "BSEB",
  customBoardName: "",
  classLevel: "Class 12",
  stream: "Commerce",
  academicYear: "2025-2026",
  examName: "Class 12 Board Exam 2026",
  startDate: "2026-02-15",
  endDate: "2026-03-05",
  subjectExamDates: {},
  dailyStudyHours: 5,
};

export const DEFAULT_EXAM_MILESTONES: ExamMilestone[] = [
  {
    id: "em-1",
    title: "Syllabus Mapped",
    description: "Map all subjects and chapters in Academic Intelligence Center",
    completed: true,
    completedAt: Date.now() - 86400000 * 10,
    category: "Syllabus",
  },
  {
    id: "em-2",
    title: "First Syllabus Completion",
    description: "Complete first-pass study for at least 75% of chapters",
    completed: false,
    category: "Syllabus",
  },
  {
    id: "em-3",
    title: "First Revision Completed",
    description: "Revise all core chapters at least once",
    completed: false,
    category: "Revision",
  },
  {
    id: "em-4",
    title: "PYQ Round Completed",
    description: "Solve Previous Year Questions for all VVI chapters",
    completed: false,
    category: "PYQ",
  },
  {
    id: "em-5",
    title: "First Mock Test",
    description: "Attempt a full length or chapter mock test",
    completed: false,
    category: "Mock",
  },
  {
    id: "em-6",
    title: "Weak Topics Reviewed",
    description: "Conduct dedicated revision on all flagged weak topics",
    completed: false,
    category: "Weakness",
  },
  {
    id: "em-7",
    title: "Second Revision Pass",
    description: "Complete round 2 high-speed memory revision",
    completed: false,
    category: "Revision",
  },
  {
    id: "em-8",
    title: "Final Exam-Ready Review",
    description: "Complete final formula, term, and key concept checks",
    completed: false,
    category: "Review",
  },
];

// =========================================================================
// MULTI-STUDENT PROFILE ENGINE (v1.5)
// =========================================================================

export const INSTALLATION_KEY = "garia_installation_id_v2";

export const getInstallationId = (): string => {
  if (typeof localStorage === "undefined") return "inst_default";
  let instId = localStorage.getItem(INSTALLATION_KEY);
  if (!instId) {
    instId = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(INSTALLATION_KEY, instId);
  }
  return instId;
};

export const getProfilesKey = (): string => {
  return `garia_profiles_${getInstallationId()}`;
};

export const getActiveProfileKey = (): string => {
  return `garia_active_profile_${getInstallationId()}`;
};

export const loadProfiles = (): StudentProfile[] => {
  getInstallationId(); // ensure installation ID is initialized
  const pKey = getProfilesKey();
  let profiles = getItem<StudentProfile[]>(pKey, []);

  // Backward-compatible migration if this specific browser instance had v1 profiles
  if ((!profiles || profiles.length === 0) && typeof localStorage !== "undefined") {
    const legacyV1Profiles = getItem<StudentProfile[]>(PROFILES_KEY, []);
    if (legacyV1Profiles && legacyV1Profiles.length > 0) {
      profiles = legacyV1Profiles;
      saveProfiles(profiles);
      const legacyActive = getItem<string>(ACTIVE_PROFILE_KEY, profiles[0]?.id || "");
      if (legacyActive) {
        saveActiveProfileId(legacyActive);
      }
    }
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  // Filter out temporary test profiles if present
  let modified = false;
  const cleanedProfiles = profiles
    .filter(
      (p) =>
        p.id !== "student-test-1" &&
        p.id !== "student-test-2" &&
        p.name !== "Ananya Verma" &&
        p.name !== "Vikram Patel"
    )
    .map((p) => {
      let updatedStream = p.stream;
      if (p.name && p.name.trim().toLowerCase().includes("chulbuli") && updatedStream !== "Science") {
        updatedStream = "Science";
        modified = true;
      }
      if (updatedStream !== p.stream) {
        return { ...p, stream: updatedStream };
      }
      return p;
    });

  if (modified || cleanedProfiles.length !== profiles.length) {
    profiles = cleanedProfiles;
    saveProfiles(profiles);

    if (profiles.length > 0) {
      const activeId = getItem<string>(getActiveProfileKey(), "");
      if (activeId === "student-test-1" || activeId === "student-test-2") {
        saveActiveProfileId(profiles[0].id);
      }
    } else {
      localStorage.removeItem(getActiveProfileKey());
    }
  }

  return profiles;
};

export const saveProfiles = (profiles: StudentProfile[]): void => {
  setItem(getProfilesKey(), profiles);
};

export const loadActiveProfileId = (): string => {
  const profiles = loadProfiles();
  if (!profiles || profiles.length === 0) return "";

  let activeId = getItem<string>(getActiveProfileKey(), "");
  if (!activeId || !profiles.some((p) => p.id === activeId)) {
    activeId = profiles[0]?.id || "";
    if (activeId) {
      saveActiveProfileId(activeId);
    }
  }
  return activeId;
};

export const saveActiveProfileId = (id: string): void => {
  if (!id) {
    localStorage.removeItem(getActiveProfileKey());
    return;
  }
  setItem(getActiveProfileKey(), id);
};

export const loadActiveProfile = (): StudentProfile | null => {
  const profiles = loadProfiles();
  if (!profiles || profiles.length === 0) return null;

  const activeId = loadActiveProfileId();
  const active = profiles.find((p) => p.id === activeId);
  return active || profiles[0] || null;
};

function migrateAndInitDefaultProfile(): StudentProfile[] {
  // Check if any legacy data exists in localStorage for this browser instance
  const hasLegacySettings = localStorage.getItem(STORAGE_KEYS.SETTINGS) !== null;
  const hasLegacyTasks = localStorage.getItem(STORAGE_KEYS.TASKS) !== null;
  const hasLegacySubjects = localStorage.getItem(STORAGE_KEYS.SUBJECTS) !== null;

  if (!hasLegacySettings && !hasLegacyTasks && !hasLegacySubjects) {
    // New device/browser: return empty array so WelcomeScreen is displayed
    return [];
  }

  const legacySettings = getItem<UserSettings | null>(STORAGE_KEYS.SETTINGS, null);
  const legacyCareer = getItem<CareerProfile | null>(STORAGE_KEYS.CAREER_PROFILE, null);
  const legacyExam = getItem<ExamProfile | null>(STORAGE_KEYS.EXAM_PROFILE, null);

  const rawName = legacySettings?.userName;
  const sanitizedName = rawName && rawName.trim() ? rawName.trim() : "Student";

  const defaultProfile: StudentProfile = {
    id: "student-default",
    name: sanitizedName,
    classLevel: legacyExam?.classLevel || "Class 12",
    stream: legacyCareer?.stream || legacyExam?.stream || "Commerce",
    board: legacyExam?.board || "BSEB",
    avatarColor: "from-cyan-500 to-emerald-500",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Copy all existing legacy keys into student-default profile keys
  Object.values(STORAGE_KEYS).forEach((baseKey) => {
    const legacyVal = localStorage.getItem(baseKey);
    if (legacyVal !== null) {
      const profKey = getProfileKey("student-default", baseKey);
      localStorage.setItem(profKey, legacyVal);
    }
  });

  const profiles = [defaultProfile];
  setItem(PROFILES_KEY, profiles);
  setItem(ACTIVE_PROFILE_KEY, "student-default");

  return profiles;
}


const AVATAR_GRADIENTS = [
  "from-cyan-500 to-emerald-500",
  "from-purple-500 to-indigo-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
];

export const addStudentProfile = (
  data: Omit<StudentProfile, "id" | "createdAt" | "updatedAt">
): StudentProfile => {
  const profiles = loadProfiles();
  const avatarIndex = profiles.length % AVATAR_GRADIENTS.length;
  const rawName = data.name.trim();
  const sanitizedName = rawName || "Student";

  const isChulbuli = sanitizedName.toLowerCase().includes("chulbuli");
  const finalStream = isChulbuli ? "Science" : data.stream;
  const newProfile: StudentProfile = {
    ...data,
    name: sanitizedName,
    stream: finalStream,
    id: `student-${Date.now()}`,
    avatarColor: data.avatarColor || AVATAR_GRADIENTS[avatarIndex],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  profiles.push(newProfile);
  saveProfiles(profiles);

  // Seed data for new student profile
  seedNewProfileData(newProfile);

  // Set as active profile
  saveActiveProfileId(newProfile.id);

  return newProfile;
};

export const updateStudentProfile = (updated: StudentProfile): void => {
  const profiles = loadProfiles();
  const index = profiles.findIndex((p) => p.id === updated.id);
  if (index !== -1) {
    const rawName = updated.name.trim();
    const sanitizedName = rawName || "Student";
    const isChulbuli = sanitizedName.toLowerCase().includes("chulbuli");
    const finalStream = isChulbuli ? "Science" : updated.stream;
    const finalUpdated = {
      ...updated,
      name: sanitizedName,
      stream: finalStream,
      updatedAt: Date.now(),
    };
    profiles[index] = finalUpdated;
    saveProfiles(profiles);

    const profId = updated.id;
    // Sync settings userName
    const settings = loadSettings(profId);
    if (settings.userName !== sanitizedName) {
      saveSettings({ ...settings, userName: sanitizedName }, profId);
    }
    // Sync career profile stream & class
    const career = loadCareerProfile(profId);
    if (career.stream !== finalUpdated.stream || career.currentClass !== updated.classLevel) {
      saveCareerProfile(
        { ...career, stream: finalUpdated.stream, currentClass: updated.classLevel, updatedAt: Date.now() },
        profId
      );
    }
    // Sync exam profile board & stream & class
    const exam = loadExamProfile(profId);
    if (
      exam.board !== updated.board ||
      exam.stream !== finalUpdated.stream ||
      exam.classLevel !== updated.classLevel
    ) {
      saveExamProfile(
        {
          ...exam,
          board: updated.board as any,
          stream: finalUpdated.stream,
          classLevel: updated.classLevel,
          examName: `${updated.classLevel} Board Exam 2026`,
        },
        profId
      );
    }
  }
};

export const deleteStudentProfile = (profileId: string): StudentProfile[] => {
  let profiles = loadProfiles();
  if (profiles.length <= 1) {
    console.warn("Cannot delete the only student profile");
    return profiles;
  }

  profiles = profiles.filter((p) => p.id !== profileId);
  saveProfiles(profiles);

  // Clear keys for deleted profile ID
  Object.values(STORAGE_KEYS).forEach((baseKey) => {
    const profKey = getProfileKey(profileId, baseKey);
    localStorage.removeItem(profKey);
  });

  const activeId = loadActiveProfileId();
  if (activeId === profileId) {
    saveActiveProfileId(profiles[0].id);
  }

  return profiles;
};

function seedNewProfileData(profile: StudentProfile): void {
  const profId = profile.id;

  // Settings
  const settings: UserSettings = {
    ...defaultSettings,
    userName: profile.name,
  };
  saveSettings(settings, profId);

  // Tasks
  const tasks: Task[] = [
    {
      id: `task-${Date.now()}-1`,
      title: `Welcome ${profile.name}! Plan your weekly study goals`,
      description: "Review your active subjects and syllabus roadmap.",
      date: getTodayString(),
      time: "10:00",
      priority: "high",
      category: "study",
      completed: false,
      createdAt: Date.now(),
    },
    {
      id: `task-${Date.now()}-2`,
      title: "Explore Career Center Matches",
      description: "Take career assessment or select a target career path.",
      date: getTodayString(),
      time: "15:00",
      priority: "medium",
      category: "study",
      completed: false,
      createdAt: Date.now(),
    },
  ];
  saveTasks(tasks, profId);

  // Subjects
  saveSubjects(getDefaultStudySubjectsForStream(profile.stream), profId);

  // Notes
  const notes: Note[] = [
    {
      id: `note-${Date.now()}-1`,
      title: `${profile.name}'s Quick Study Scratchpad`,
      content: `Welcome to Garia OS v1.5 Multi-Student Intelligence!
Stream: ${profile.stream}
Class: ${profile.classLevel}
Board: ${profile.board}

Use this space to write formulas, key terms, or daily notes.`,
      pinned: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
  saveNotes(notes, profId);

  // Habits
  saveHabits(defaultHabits, profId);

  // Water
  saveWater({ date: getTodayString(), glasses: 4, goal: 8 }, profId);

  // Goals
  const goals: Goal[] = [
    {
      id: `goal-${Date.now()}-1`,
      title: `Complete ${profile.stream} Core Syllabus First Pass`,
      description: "Aim for 80%+ completion across all subjects.",
      category: "Academic",
      targetDate: getTodayString(),
      progress: 30,
      completed: false,
      createdAt: Date.now(),
    },
  ];
  saveGoals(goals, profId);

  // Calendar
  const events: CalendarEvent[] = [
    {
      id: `cal-${Date.now()}-1`,
      title: `${profile.classLevel} ${profile.board} Exam Prep Check`,
      description: "Review syllabus progress and upcoming mock tests.",
      date: getTodayString(),
      time: "09:00",
      category: "exam",
      completed: false,
      createdAt: Date.now(),
    },
  ];
  saveCalendarEvents(events, profId);

  // Abya Chat
  saveAbyaChat(createDefaultAbyaMessages(profile.name), profId);

  // Career Profile & Assessment & Roadmap
  const defaultCareerId =
    profile.stream === "Science"
      ? "cs_engineer"
      : profile.stream === "Arts / Humanities" || profile.stream === "Arts"
      ? "law"
      : "ca";

  const careerProf: CareerProfile = {
    stream: profile.stream,
    currentClass: profile.classLevel,
    selectedCareerId: defaultCareerId,
    updatedAt: Date.now(),
  };
  saveCareerProfile(careerProf, profId);

  const careerAssess: CareerAssessment = {
    ...defaultCareerAssessment,
    strongSubjects:
      profile.stream === "Arts / Humanities" || profile.stream === "Arts"
        ? ["History", "Political Science", "Geography"]
        : profile.stream === "Commerce"
        ? ["Accountancy", "Economics", "Business Studies"]
        : ["Physics", "Chemistry", "Mathematics"],
  };
  saveCareerAssessment(careerAssess, profId);

  const careerOpt =
    CAREER_CATALOG.find((c) => c.id === defaultCareerId) || CAREER_CATALOG[0];
  const careerRoadmap = generateDefaultRoadmap(careerOpt, careerProf);
  saveCareerRoadmap(careerRoadmap, profId);

  // Academic Subjects & Chapters
  const academicSubs = getDefaultSubjectsForStream(profile.stream);
  saveAcademicSubjects(academicSubs, profId);

  const academicChaps = DEFAULT_INITIAL_CHAPTERS.filter((c) =>
    academicSubs.some((s) => s.id === c.subjectId)
  );
  saveAcademicChapters(
    academicChaps.length > 0 ? academicChaps : DEFAULT_INITIAL_CHAPTERS,
    profId
  );

  // Exam Profile & Milestones
  const examProf: ExamProfile = {
    board: profile.board as any,
    classLevel: profile.classLevel,
    stream: profile.stream,
    academicYear: "2025-2026",
    examName: `${profile.classLevel} Board Exam 2026`,
    startDate: "2026-02-15",
    endDate: "2026-03-05",
    subjectExamDates: {},
    dailyStudyHours: 5,
  };
  saveExamProfile(examProf, profId);
  saveExamMilestones(DEFAULT_EXAM_MILESTONES, profId);
}

// =========================================================================
// ISOLATED LOADERS AND SAVERS
// =========================================================================

export const loadTasks = (profileId?: string): Task[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.TASKS), defaultTasks);
};
export const saveTasks = (tasks: Task[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.TASKS), tasks);
};

const COMMERCE_DEFAULT_NAMES = new Set(["accountancy", "economics", "business studies"]);
const SCIENCE_DEFAULT_NAMES = new Set(["physics", "chemistry", "biology"]);
const ARTS_DEFAULT_NAMES = new Set(["history", "political science", "geography", "sociology"]);

export const isSubjectListDefaultOfStream = (subs: Subject[], stream: StreamType): boolean => {
  const defaults = getDefaultStudySubjectsForStream(stream);
  const defaultNames = new Set(defaults.map((d) => d.name.toLowerCase()));
  return (
    subs.length === defaults.length &&
    subs.every((s) => defaultNames.has(s.name.toLowerCase()))
  );
};

export const loadSubjects = (profileId?: string): Subject[] => {
  const pId = profileId || loadActiveProfileId();
  const activeProf = loadProfiles().find((p) => p.id === pId);

  let stream: string = activeProf?.stream || "Commerce";
  if (activeProf?.name?.trim().toLowerCase().includes("chulbuli")) {
    stream = "Science";
  }

  const defaultStreamSubs = getDefaultStudySubjectsForStream(stream as StreamType);
  const key = getProfileKey(pId, STORAGE_KEYS.SUBJECTS);
  const saved = getItem<Subject[] | null>(key, null);

  if (!saved || !Array.isArray(saved) || saved.length === 0) {
    if (pId) {
      saveSubjects(defaultStreamSubs, pId);
    }
    return defaultStreamSubs;
  }

  const isScience = stream.toLowerCase().includes("science") || stream === "PCM" || stream === "PCB";
  const isArts = stream.toLowerCase().includes("art") || stream.toLowerCase().includes("humanities");
  const isCommerce = !isScience && !isArts;

  let needsUpdate = false;
  let updatedSubjects: Subject[] = saved;

  if (isScience) {
    const hasStaleDefaults = saved.some(
      (s) =>
        COMMERCE_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) ||
        ARTS_DEFAULT_NAMES.has(s.name.trim().toLowerCase())
    );

    if (hasStaleDefaults) {
      needsUpdate = true;
      const genuineCustomSubjects = saved.filter(
        (s) =>
          !COMMERCE_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) &&
          !ARTS_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) &&
          !SCIENCE_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) &&
          s.name.trim().toLowerCase() !== "mathematics"
      );

      updatedSubjects = [...defaultStreamSubs, ...genuineCustomSubjects];
    }
  } else if (isArts) {
    const hasStaleDefaults = saved.some(
      (s) =>
        COMMERCE_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) ||
        SCIENCE_DEFAULT_NAMES.has(s.name.trim().toLowerCase())
    );

    if (hasStaleDefaults) {
      needsUpdate = true;
      const genuineCustomSubjects = saved.filter(
        (s) =>
          !COMMERCE_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) &&
          !SCIENCE_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) &&
          !ARTS_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) &&
          s.name.trim().toLowerCase() !== "mathematics"
      );

      updatedSubjects = [...defaultStreamSubs, ...genuineCustomSubjects];
    }
  } else if (isCommerce) {
    const hasStaleDefaults = saved.some(
      (s) =>
        SCIENCE_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) ||
        ARTS_DEFAULT_NAMES.has(s.name.trim().toLowerCase())
    );

    if (hasStaleDefaults) {
      needsUpdate = true;
      const genuineCustomSubjects = saved.filter(
        (s) =>
          !COMMERCE_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) &&
          !SCIENCE_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) &&
          !ARTS_DEFAULT_NAMES.has(s.name.trim().toLowerCase()) &&
          s.name.trim().toLowerCase() !== "mathematics"
      );

      updatedSubjects = [...defaultStreamSubs, ...genuineCustomSubjects];
    }
  }

  if (needsUpdate) {
    saveSubjects(updatedSubjects, pId);
    return updatedSubjects;
  }

  return saved;
};
export const saveSubjects = (subs: Subject[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.SUBJECTS), subs);
};

export const loadStudySessions = (profileId?: string): StudySession[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.STUDY_SESSIONS), []);
};
export const saveStudySessions = (sessions: StudySession[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.STUDY_SESSIONS), sessions);
};

export const loadNotes = (profileId?: string): Note[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.NOTES), defaultNotes);
};
export const saveNotes = (notes: Note[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.NOTES), notes);
};

export const loadHabits = (profileId?: string): Habit[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.HABITS), defaultHabits);
};
export const saveHabits = (habits: Habit[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.HABITS), habits);
};

export const loadWater = (profileId?: string): WaterLog => {
  const pId = profileId || loadActiveProfileId();
  const water = getItem(getProfileKey(pId, STORAGE_KEYS.WATER), {
    date: getTodayString(),
    glasses: 5,
    goal: 8,
  });
  if (water.date !== getTodayString()) {
    return {
      date: getTodayString(),
      glasses: 0,
      goal: water.goal || 8,
    };
  }
  return water;
};
export const saveWater = (water: WaterLog, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.WATER), water);
};

export const loadFocusSessions = (profileId?: string): FocusSessionLog[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.FOCUS), []);
};
export const saveFocusSessions = (focus: FocusSessionLog[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.FOCUS), focus);
};

export const loadGoals = (profileId?: string): Goal[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.GOALS), defaultGoals);
};
export const saveGoals = (goals: Goal[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.GOALS), goals);
};

export const loadCalendarEvents = (profileId?: string): CalendarEvent[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.CALENDAR_EVENTS), defaultCalendarEvents);
};
export const saveCalendarEvents = (events: CalendarEvent[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.CALENDAR_EVENTS), events);
};

export const loadAbyaChat = (profileId?: string): AbyaMessage[] => {
  const pId = profileId || loadActiveProfileId();
  const activeProf = loadProfiles().find((p) => p.id === pId);
  return getItem(
    getProfileKey(pId, STORAGE_KEYS.ABYA_CHAT),
    createDefaultAbyaMessages(activeProf?.name || "Student")
  );
};
export const saveAbyaChat = (messages: AbyaMessage[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.ABYA_CHAT), messages);
};

export const loadAbyaLanguage = (profileId?: string): AbyaLanguageSetting => {
  const pId = profileId || loadActiveProfileId();
  const key = `garia_p_${pId}_abya_language_v1`;
  const val = localStorage.getItem(key);
  if (val && ["English", "Hindi", "Hinglish", "WhatsApp Language"].includes(val)) {
    return val as AbyaLanguageSetting;
  }
  return "WhatsApp Language";
};

export const saveAbyaLanguage = (lang: AbyaLanguageSetting, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  const key = `garia_p_${pId}_abya_language_v1`;
  localStorage.setItem(key, lang);
};

export const loadSettings = (profileId?: string): UserSettings => {
  const pId = profileId || loadActiveProfileId();
  const activeProf = loadProfiles().find((p) => p.id === pId);
  const fallback = activeProf
    ? { ...defaultSettings, userName: activeProf.name }
    : defaultSettings;
  const stored = getItem(getProfileKey(pId, STORAGE_KEYS.SETTINGS), fallback);
  const userName = stored?.userName || fallback.userName || "Student";
  const accountName = stored?.account?.name || userName;

  return {
    ...fallback,
    ...stored,
    userName,
    notifications: {
      ...defaultSettings.notifications!,
      ...(stored?.notifications || {}),
    },
    account: {
      ...defaultSettings.account!,
      ...(stored?.account || {}),
      name: accountName,
    },
  };
};
export const saveSettings = (settings: UserSettings, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.SETTINGS), settings);
};

// Career Loaders & Savers
export const loadCareerProfile = (profileId?: string): CareerProfile => {
  const pId = profileId || loadActiveProfileId();
  const activeProf = loadProfiles().find((p) => p.id === pId);
  const defaultCareerId =
    activeProf?.stream === "Science"
      ? "cs_engineer"
      : activeProf?.stream === "Arts / Humanities" || activeProf?.stream === "Arts"
      ? "law"
      : "ca";

  const fallback: CareerProfile = activeProf
    ? {
        ...defaultCareerProfile,
        stream: activeProf.stream,
        currentClass: activeProf.classLevel,
        selectedCareerId: defaultCareerId,
      }
    : defaultCareerProfile;
  return getItem(getProfileKey(pId, STORAGE_KEYS.CAREER_PROFILE), fallback);
};
export const saveCareerProfile = (profile: CareerProfile, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.CAREER_PROFILE), profile);
};

export const loadCareerAssessment = (profileId?: string): CareerAssessment => {
  const pId = profileId || loadActiveProfileId();
  const activeProf = loadProfiles().find((p) => p.id === pId);
  const stream = activeProf?.stream || "Commerce";
  const streamAssessment: CareerAssessment = {
    strongSubjects:
      stream === "Science"
        ? ["Physics", "Mathematics", "Chemistry"]
        : stream === "Arts / Humanities" || stream === "Arts"
        ? ["History", "Political Science", "English"]
        : ["Accountancy", "Economics", "Business Studies"],
    interests:
      stream === "Science"
        ? ["Technology/R&D", "Problem Solving", "Engineering"]
        : stream === "Arts / Humanities" || stream === "Arts"
        ? ["Law/Governance", "Public Policy", "Social Research"]
        : ["Finance/Markets", "Problem Solving", "Management/Leadership"],
    skills:
      stream === "Science"
        ? ["Analytical Thinking", "Mathematical Reasoning", "Technical Skills"]
        : stream === "Arts / Humanities" || stream === "Arts"
        ? ["Critical Thinking", "Writing", "Communication"]
        : ["Analytical Thinking", "Numerical Ability", "Communication"],
    workAreas: ["Corporate/Office"],
    careerGoals: ["High Earning Potential", "Job Security"],
    studyPreference:
      stream === "Science"
        ? "Degree / Technical College"
        : stream === "Arts / Humanities" || stream === "Arts"
        ? "University / Law School"
        : "Professional Certifications",
  };
  return getItem(getProfileKey(pId, STORAGE_KEYS.CAREER_ASSESSMENT), streamAssessment);
};
export const saveCareerAssessment = (assessment: CareerAssessment, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.CAREER_ASSESSMENT), assessment);
};

export const loadCareerRoadmap = (profileId?: string): CareerRoadmap => {
  const pId = profileId || loadActiveProfileId();
  const activeProf = loadProfiles().find((p) => p.id === pId);
  const stream = activeProf?.stream || "Commerce";

  const defaultCareerId =
    stream === "Science"
      ? "cs_engineer"
      : stream === "Arts / Humanities" || stream === "Arts"
      ? "law"
      : "ca";

  const careerOpt =
    CAREER_CATALOG.find((c) => c.id === defaultCareerId) || CAREER_CATALOG[0];
  const dynamicDefaultRoadmap = generateDefaultRoadmap(careerOpt, {
    stream,
    currentClass: activeProf?.classLevel || "Class 12",
    selectedCareerId: defaultCareerId,
    updatedAt: Date.now(),
  });

  const stored = getItem(getProfileKey(pId, STORAGE_KEYS.CAREER_ROADMAP), dynamicDefaultRoadmap);

  // If stored roadmap stream mismatches active profile stream, update it to align
  if (activeProf && stored.stream && stored.stream !== activeProf.stream) {
    const matchedOpt =
      CAREER_CATALOG.find((c) => c.stream === activeProf.stream) || careerOpt;
    return generateDefaultRoadmap(matchedOpt, {
      stream: activeProf.stream,
      currentClass: activeProf.classLevel,
      selectedCareerId: matchedOpt.id,
      updatedAt: Date.now(),
    });
  }

  return stored;
};
export const saveCareerRoadmap = (roadmap: CareerRoadmap, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.CAREER_ROADMAP), roadmap);
};

export const loadCareerQuiz = (profileId?: string): CareerQuizAnswers => {
  const pId = profileId || loadActiveProfileId();
  const activeProf = loadProfiles().find((p) => p.id === pId);
  const stream = activeProf?.stream || "Commerce";

  const defaultQuiz: CareerQuizAnswers = {
    favoriteSubjects: stream === "Commerce" ? ["Accountancy", "Economics"] : stream === "Science" ? ["Physics", "Mathematics"] : ["History", "Political Science"],
    strongSubjects: stream === "Commerce" ? ["Accountancy"] : stream === "Science" ? ["Physics"] : ["History"],
    problemSolvingPref: "Practical & Hands-on",
    creativityLevel: 3,
    communicationLevel: 4,
    numbersInterest: stream === "Commerce" ? 5 : stream === "Science" ? 4 : 2,
    scienceTechInterest: stream === "Science" ? 5 : 2,
    businessFinanceInterest: stream === "Commerce" ? 5 : 2,
    lawGovInterest: stream === "Arts / Humanities" || stream === "Arts" ? 5 : 2,
    peopleHelpingInterest: 4,
    researchInterest: 3,
    preferredWorkAreas: ["Corporate/Office", "Tech/Lab"],
    updatedAt: Date.now(),
  };

  return getItem(getProfileKey(pId, STORAGE_KEYS.CAREER_QUIZ), defaultQuiz);
};

export const saveCareerQuiz = (quiz: CareerQuizAnswers, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.CAREER_QUIZ), quiz);
};

export interface SmartSuggestionsState {
  dismissedIds: string[];
  lastUpdated?: number;
}

export const loadSmartSuggestionsState = (profileId?: string): SmartSuggestionsState => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.SMART_SUGGESTIONS), { dismissedIds: [] });
};

export const saveSmartSuggestionsState = (state: SmartSuggestionsState, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.SMART_SUGGESTIONS), state);
};

// Academic Loaders & Savers
export const loadAcademicSubjects = (
  stream: StreamType = "Commerce",
  profileId?: string
): AcademicSubject[] => {
  const pId = profileId || loadActiveProfileId();
  const fallback = getDefaultSubjectsForStream(stream);
  return getItem(getProfileKey(pId, STORAGE_KEYS.ACADEMIC_SUBJECTS), fallback);
};
export const saveAcademicSubjects = (subs: AcademicSubject[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.ACADEMIC_SUBJECTS), subs);
};

export const loadAcademicChapters = (profileId?: string): AcademicChapter[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.ACADEMIC_CHAPTERS), DEFAULT_INITIAL_CHAPTERS);
};
export const saveAcademicChapters = (chaps: AcademicChapter[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.ACADEMIC_CHAPTERS), chaps);
};

export const loadAcademicTests = (profileId?: string): AcademicTest[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.ACADEMIC_TESTS), []);
};
export const saveAcademicTests = (tests: AcademicTest[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.ACADEMIC_TESTS), tests);
};

export const loadAcademicPlan = (profileId?: string): SmartStudyPlan | null => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.ACADEMIC_PLAN), null);
};
export const saveAcademicPlan = (plan: SmartStudyPlan | null, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.ACADEMIC_PLAN), plan);
};

export const loadVVITopics = (profileId?: string): AcademicVVITopic[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.VVI_TOPICS), []);
};
export const saveVVITopics = (topics: AcademicVVITopic[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.VVI_TOPICS), topics);
};

export const loadAcademicRevisions = (profileId?: string): AcademicRevisionItem[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.REVISIONS), []);
};
export const saveAcademicRevisions = (revisions: AcademicRevisionItem[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.REVISIONS), revisions);
};

export const loadAcademicPractice = (profileId?: string): AcademicPracticeSession[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.PRACTICE), []);
};
export const saveAcademicPractice = (practice: AcademicPracticeSession[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.PRACTICE), practice);
};

export const loadAcademicRoadmapData = (profileId?: string): AcademicRoadmapData | null => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.ACADEMIC_ROADMAP), null);
};
export const saveAcademicRoadmapData = (roadmap: AcademicRoadmapData | null, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.ACADEMIC_ROADMAP), roadmap);
};

// Exam Loaders & Savers
export const loadExamProfile = (profileId?: string): ExamProfile => {
  const pId = profileId || loadActiveProfileId();
  const activeProf = loadProfiles().find((p) => p.id === pId);
  const fallback = activeProf
    ? {
        ...DEFAULT_EXAM_PROFILE,
        board: activeProf.board as any,
        stream: activeProf.stream,
        classLevel: activeProf.classLevel,
        examName: `${activeProf.classLevel} Board Exam 2026`,
      }
    : DEFAULT_EXAM_PROFILE;
  return getItem(getProfileKey(pId, STORAGE_KEYS.EXAM_PROFILE), fallback);
};
export const saveExamProfile = (prof: ExamProfile, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.EXAM_PROFILE), prof);
};

export const loadExamMilestones = (profileId?: string): ExamMilestone[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.EXAM_MILESTONES), DEFAULT_EXAM_MILESTONES);
};
export const saveExamMilestones = (milestones: ExamMilestone[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.EXAM_MILESTONES), milestones);
};

export const loadExamMockTests = (profileId?: string): ExamMockTest[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.EXAM_TESTS), []);
};
export const saveExamMockTests = (tests: ExamMockTest[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.EXAM_TESTS), tests);
};

export const loadExamDailyPlan = (profileId?: string): ExamDailyPlan | null => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.EXAM_PLAN), null);
};
export const saveExamDailyPlan = (plan: ExamDailyPlan | null, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.EXAM_PLAN), plan);
};

// V1.9 Exam Intelligence Persistence
export const loadExamTestRecords = (profileId?: string): ExamTestRecord[] => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.EXAM_TESTS_V19), []);
};

export const saveExamTestRecords = (tests: ExamTestRecord[], profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.EXAM_TESTS_V19), tests);
};

export const loadExamAnalysis = (profileId?: string): ExamIntelligenceReport | null => {
  const pId = profileId || loadActiveProfileId();
  return getItem(getProfileKey(pId, STORAGE_KEYS.EXAM_ANALYSIS_V19), null);
};

export const saveExamAnalysis = (analysis: ExamIntelligenceReport | null, profileId?: string): void => {
  const pId = profileId || loadActiveProfileId();
  if (!pId) return;
  setItem(getProfileKey(pId, STORAGE_KEYS.EXAM_ANALYSIS_V19), analysis);
};

// =========================================================================
// STUDENT-SPECIFIC EXPORT & IMPORT
// =========================================================================

export const exportStudentProfileJSON = (profileId?: string) => {
  const pId = profileId || loadActiveProfileId();
  const profiles = loadProfiles();
  const student = profiles.find((p) => p.id === pId) || loadActiveProfile();

  const data = {
    studentProfile: student,
    tasks: loadTasks(pId),
    subjects: loadSubjects(pId),
    studySessions: loadStudySessions(pId),
    notes: loadNotes(pId),
    habits: loadHabits(pId),
    water: loadWater(pId),
    focusSessions: loadFocusSessions(pId),
    goals: loadGoals(pId),
    calendarEvents: loadCalendarEvents(pId),
    abyaChat: loadAbyaChat(pId),
    abyaLanguage: loadAbyaLanguage(pId),
    settings: loadSettings(pId),
    careerProfile: loadCareerProfile(pId),
    careerAssessment: loadCareerAssessment(pId),
    careerRoadmap: loadCareerRoadmap(pId),
    academicSubjects: loadAcademicSubjects(student.stream, pId),
    academicChapters: loadAcademicChapters(pId),
    academicTests: loadAcademicTests(pId),
    academicPlan: loadAcademicPlan(pId),
    vviTopics: loadVVITopics(pId),
    academicRevisions: loadAcademicRevisions(pId),
    academicPractice: loadAcademicPractice(pId),
    academicRoadmap: loadAcademicRoadmapData(pId),
    examProfile: loadExamProfile(pId),
    examMilestones: loadExamMilestones(pId),
    examMockTests: loadExamMockTests(pId),
    examPlan: loadExamDailyPlan(pId),
    examTests: loadExamTestRecords(pId),
    examAnalysis: loadExamAnalysis(pId),
    exportedAt: new Date().toISOString(),
    appVersion: "Garia OS v1.9 Exam Intelligence",
  };

  const safeName = student.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const dataStr =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `garia_os_student_${safeName}_${getTodayString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const importStudentProfileJSON = (
  jsonString: string
): { success: boolean; profileId?: string; profileName?: string } => {
  try {
    const data = JSON.parse(jsonString);
    const profiles = loadProfiles();

    let profMeta: StudentProfile = data.studentProfile || data.profile || {
      name: data.settings?.userName || "Imported Student",
      classLevel: data.examProfile?.classLevel || "Class 12",
      stream: data.careerProfile?.stream || "Commerce",
      board: data.examProfile?.board || "BSEB",
    };

    const newProfileId = `student-imp-${Date.now()}`;
    const newStudentProfile: StudentProfile = {
      id: newProfileId,
      name: profMeta.name || "Imported Student",
      classLevel: profMeta.classLevel || "Class 12",
      stream: profMeta.stream || "Commerce",
      board: profMeta.board || "BSEB",
      avatarColor: profMeta.avatarColor || "from-purple-500 to-indigo-500",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    profiles.push(newStudentProfile);
    saveProfiles(profiles);

    if (data.tasks) saveTasks(data.tasks, newProfileId);
    if (data.subjects) saveSubjects(data.subjects, newProfileId);
    if (data.studySessions) saveStudySessions(data.studySessions, newProfileId);
    if (data.notes) saveNotes(data.notes, newProfileId);
    if (data.habits) saveHabits(data.habits, newProfileId);
    if (data.water) saveWater(data.water, newProfileId);
    if (data.focusSessions) saveFocusSessions(data.focusSessions, newProfileId);
    if (data.goals) saveGoals(data.goals, newProfileId);
    if (data.calendarEvents) saveCalendarEvents(data.calendarEvents, newProfileId);
    if (data.abyaChat) saveAbyaChat(data.abyaChat, newProfileId);
    if (data.abyaLanguage) saveAbyaLanguage(data.abyaLanguage, newProfileId);
    if (data.settings) saveSettings({ ...data.settings, userName: newStudentProfile.name }, newProfileId);
    if (data.careerProfile) saveCareerProfile(data.careerProfile, newProfileId);
    if (data.careerAssessment) saveCareerAssessment(data.careerAssessment, newProfileId);
    if (data.careerRoadmap) saveCareerRoadmap(data.careerRoadmap, newProfileId);
    if (data.academicSubjects) saveAcademicSubjects(data.academicSubjects, newProfileId);
    if (data.academicChapters) saveAcademicChapters(data.academicChapters, newProfileId);
    if (data.academicTests) saveAcademicTests(data.academicTests, newProfileId);
    if (data.academicPlan) saveAcademicPlan(data.academicPlan, newProfileId);
    if (data.vviTopics) saveVVITopics(data.vviTopics, newProfileId);
    if (data.academicRevisions) saveAcademicRevisions(data.academicRevisions, newProfileId);
    if (data.academicPractice) saveAcademicPractice(data.academicPractice, newProfileId);
    if (data.academicRoadmap) saveAcademicRoadmapData(data.academicRoadmap, newProfileId);
    if (data.examProfile) saveExamProfile(data.examProfile, newProfileId);
    if (data.examMilestones) saveExamMilestones(data.examMilestones, newProfileId);
    if (data.examMockTests) saveExamMockTests(data.examMockTests, newProfileId);
    if (data.examPlan) saveExamDailyPlan(data.examPlan, newProfileId);
    if (data.examTests) saveExamTestRecords(data.examTests, newProfileId);
    if (data.examAnalysis) saveExamAnalysis(data.examAnalysis, newProfileId);

    saveActiveProfileId(newProfileId);

    return { success: true, profileId: newProfileId, profileName: newStudentProfile.name };
  } catch (e) {
    console.error("Failed to parse import JSON", e);
    return { success: false };
  }
};

export const exportAllDataJSON = exportStudentProfileJSON;
export const importDataJSON = (jsonString: string): boolean => {
  const result = importStudentProfileJSON(jsonString);
  return result.success;
};

export const clearAllData = () => {
  const profiles = loadProfiles();
  profiles.forEach((p) => {
    Object.values(STORAGE_KEYS).forEach((baseKey) => {
      localStorage.removeItem(getProfileKey(p.id, baseKey));
    });
  });
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(PROFILES_KEY);
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
};
