import React, { useState, useEffect, useRef } from "react";
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
  ActiveTab,
  StudentProfile,
  StreamType,
  CareerProfile,
  CareerAssessment,
  CareerRoadmap,
  CareerQuizAnswers,
  AcademicSubject,
  AcademicChapter,
  AcademicTest,
  SmartStudyPlan,
  ExamProfile,
  ExamMilestone,
  ExamMockTest,
  ExamDailyPlan,
  ExamTestRecord,
  AcademicVVITopic,
  AcademicRevisionItem,
  AcademicPracticeSession,
  AcademicRoadmapData,
} from "./types";
import {
  loadTasks,
  saveTasks,
  loadSubjects,
  saveSubjects,
  loadStudySessions,
  saveStudySessions,
  loadNotes,
  saveNotes,
  loadHabits,
  saveHabits,
  loadWater,
  saveWater,
  loadFocusSessions,
  saveFocusSessions,
  loadGoals,
  saveGoals,
  loadCalendarEvents,
  saveCalendarEvents,
  loadAbyaChat,
  saveAbyaChat,
  loadAbyaLanguage,
  saveAbyaLanguage,
  loadSettings,
  saveSettings,
  loadCareerProfile,
  saveCareerProfile,
  loadCareerAssessment,
  saveCareerAssessment,
  loadCareerRoadmap,
  saveCareerRoadmap,
  loadCareerQuiz,
  saveCareerQuiz,
  loadAcademicSubjects,
  saveAcademicSubjects,
  loadAcademicChapters,
  saveAcademicChapters,
  loadAcademicTests,
  saveAcademicTests,
  loadAcademicPlan,
  saveAcademicPlan,
  loadVVITopics,
  saveVVITopics,
  loadAcademicRevisions,
  saveAcademicRevisions,
  loadAcademicPractice,
  saveAcademicPractice,
  loadAcademicRoadmapData,
  saveAcademicRoadmapData,
  loadExamProfile,
  saveExamProfile,
  loadExamMilestones,
  saveExamMilestones,
  loadExamMockTests,
  saveExamMockTests,
  loadExamDailyPlan,
  saveExamDailyPlan,
  loadExamTestRecords,
  saveExamTestRecords,
  getTodayString,
  clearAllData,
  loadProfiles,
  saveProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  loadActiveProfile,
  addStudentProfile,
  updateStudentProfile,
  deleteStudentProfile,
  exportStudentProfileJSON,
  importStudentProfileJSON,
  getDefaultStudySubjectsForStream,
} from "./utils/storage";

import {
  getDefaultVVITopicsForStream,
  getDefaultRevisionsForStream,
  generateAcademicRoadmapData,
} from "./utils/academicEngine";

import {
  generateAbyaInsightCards,
  generateAbyaFallbackResponse,
} from "./utils/abyaFallbackEngine";

import { hashPassword } from "./utils/auth";

// Components & Pages
import { StatusBar } from "./components/StatusBar";
import { BottomNav } from "./components/BottomNav";
import { DesktopSidebar } from "./components/DesktopSidebar";
import { MoreMenuModal } from "./components/MoreMenuModal";
import { StudentProfileModal } from "./components/StudentProfileModal";
import { AuthModal } from "./components/AuthModal";
import { WelcomeScreen } from "./components/WelcomeScreen";

import { HomeDashboard } from "./pages/HomeDashboard";
import { TaskManager } from "./pages/TaskManager";
import { StudyTracker } from "./pages/StudyTracker";
import { FocusTimer } from "./pages/FocusTimer";
import { NotesPage } from "./pages/NotesPage";
import { WaterTracker } from "./pages/WaterTracker";
import { HabitsPage } from "./pages/HabitsPage";
import { GoalsPage } from "./pages/GoalsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { AbyaAIPage } from "./pages/AbyaAIPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { CareerCenterPage } from "./pages/CareerCenterPage";
import { AcademicCenterPage } from "./pages/AcademicCenterPage";
import { QuestionBankPage } from "./pages/QuestionBankPage";
import { ExamCenterPage } from "./pages/ExamCenterPage";
import { DownloadPage } from "./pages/DownloadPage";
import {
  calculateExamCountdown,
  calculateExamReadiness,
  detectWeaknessTopics,
} from "./utils/examEngine";

export default function App() {
  // Navigation & Profile Modal States
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === "/download" || path === "/apk" || hash === "#download" || hash === "#apk") {
        return "download";
      }
      if (path === "/questionbank" || hash === "#questionbank" || hash === "#mcq" || hash === "#pyq") {
        return "questionbank";
      }
      if (path === "/academic" || hash === "#academic") {
        return "academic";
      }
      if (path === "/career" || hash === "#career") {
        return "career";
      }
    }
    return "home";
  });
  const [tabHistory, setTabHistory] = useState<ActiveTab[]>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === "/download" || path === "/apk" || hash === "#download" || hash === "#apk") {
        return ["home", "download"];
      }
      if (path === "/questionbank" || hash === "#questionbank") {
        return ["home", "questionbank"];
      }
    }
    return ["home"];
  });
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const handleNavigate = (tab: ActiveTab) => {
    if (tab !== activeTab) {
      setTabHistory((prev) => [...prev, tab]);
      setActiveTab(tab);
      window.history.pushState({ tab }, "", `#${tab}`);
    }
  };

  const handleGoBack = () => {
    if (isAuthModalOpen) {
      setIsAuthModalOpen(false);
      return;
    }
    if (isStudentModalOpen) {
      setIsStudentModalOpen(false);
      return;
    }
    if (isMoreMenuOpen) {
      setIsMoreMenuOpen(false);
      return;
    }
    if (tabHistory.length > 1) {
      const newStack = [...tabHistory];
      newStack.pop();
      const prev = newStack[newStack.length - 1] || "home";
      setTabHistory(newStack);
      setActiveTab(prev);
    } else if (activeTab !== "home") {
      setActiveTab("home");
      setTabHistory(["home"]);
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
        return;
      }
      if (isStudentModalOpen) {
        setIsStudentModalOpen(false);
        return;
      }
      if (isMoreMenuOpen) {
        setIsMoreMenuOpen(false);
        return;
      }
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else {
        handleGoBack();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAuthModalOpen, isStudentModalOpen, isMoreMenuOpen, tabHistory, activeTab]);

  // Multi-Student Profiles State (v1.5)
  const [profiles, setProfiles] = useState<StudentProfile[]>(loadProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string>(loadActiveProfileId);

  const activeStudent =
    profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;


  // App Data States
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSubjects());
  const [studySessions, setStudySessions] = useState<StudySession[]>(() => loadStudySessions());
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits());
  const [water, setWater] = useState<WaterLog>(() => loadWater());
  const [focusLogs, setFocusLogs] = useState<FocusSessionLog[]>(() => loadFocusSessions());
  const [goals, setGoals] = useState<Goal[]>(() => loadGoals());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => loadCalendarEvents());
  const [abyaChat, setAbyaChat] = useState<AbyaMessage[]>(() => loadAbyaChat());
  const [abyaLanguage, setAbyaLanguage] = useState<AbyaLanguageSetting>(() => loadAbyaLanguage());
  const isAbyaSubmittingRef = useRef<boolean>(false);
  const [careerProfile, setCareerProfile] = useState<CareerProfile>(() => loadCareerProfile());
  const [careerAssessment, setCareerAssessment] = useState<CareerAssessment>(() => loadCareerAssessment());
  const [careerRoadmap, setCareerRoadmap] = useState<CareerRoadmap>(() => loadCareerRoadmap());
  const [careerQuiz, setCareerQuiz] = useState<CareerQuizAnswers>(() => loadCareerQuiz());

  // Academic Center States
  const [academicSubjects, setAcademicSubjects] = useState<AcademicSubject[]>(() =>
    loadAcademicSubjects(careerProfile.stream)
  );
  const [academicChapters, setAcademicChapters] = useState<AcademicChapter[]>(() => loadAcademicChapters());
  const [academicTests, setAcademicTests] = useState<AcademicTest[]>(() => loadAcademicTests());
  const [academicPlan, setAcademicPlan] = useState<SmartStudyPlan | null>(() => loadAcademicPlan());

  // V1.8 Academic States
  const [vviTopics, setVviTopics] = useState<AcademicVVITopic[]>(() => {
    const loaded = loadVVITopics();
    if (loaded && loaded.length > 0) return loaded;
    return getDefaultVVITopicsForStream(careerProfile.stream, academicSubjects, academicChapters);
  });

  const [academicRevisions, setAcademicRevisions] = useState<AcademicRevisionItem[]>(() => {
    const loaded = loadAcademicRevisions();
    if (loaded && loaded.length > 0) return loaded;
    return getDefaultRevisionsForStream(careerProfile.stream, academicSubjects, academicChapters);
  });

  const [academicPractice, setAcademicPractice] = useState<AcademicPracticeSession[]>(() => {
    return loadAcademicPractice();
  });

  // Dynamic Academic Roadmap
  const academicRoadmap: AcademicRoadmapData = generateAcademicRoadmapData(
    activeStudent?.classLevel || "Class 12",
    careerProfile.stream || "Commerce",
    academicSubjects,
    academicChapters,
    vviTopics,
    academicRevisions,
    academicPractice,
    academicTests,
    careerRoadmap?.careerTitle
  );

  // Exam Intelligence States (V1.9)
  const [examProfile, setExamProfile] = useState<ExamProfile>(() => loadExamProfile());
  const [examMilestones, setExamMilestones] = useState<ExamMilestone[]>(() => loadExamMilestones());
  const [examMockTests, setExamMockTests] = useState<ExamMockTest[]>(() => loadExamMockTests());
  const [examPlan, setExamPlan] = useState<ExamDailyPlan | null>(() => loadExamDailyPlan());
  const [examTestRecords, setExamTestRecords] = useState<ExamTestRecord[]>(() => loadExamTestRecords());

  const handleSaveExamTestRecord = (testData: Omit<ExamTestRecord, "id" | "createdAt">) => {
    const newRecord: ExamTestRecord = {
      ...testData,
      id: `test-rec-${Date.now()}`,
      createdAt: Date.now(),
    };
    const updated = [newRecord, ...examTestRecords];
    setExamTestRecords(updated);
    saveExamTestRecords(updated, activeProfileId);
  };

  const handleDeleteExamTestRecord = (testId: string) => {
    const updated = examTestRecords.filter((t) => t.id !== testId);
    setExamTestRecords(updated);
    saveExamTestRecords(updated, activeProfileId);
  };

  // Attached Note Context for Abya AI
  const [attachedContextNote, setAttachedContextNote] = useState<string>("");

  // Reload all isolated dataset for a specific profile ID
  const reloadAllDataForProfile = (profileId: string) => {
    setActiveProfileId(profileId);
    saveActiveProfileId(profileId);

    const allProfs = loadProfiles();
    setProfiles(allProfs);

    const curProf = allProfs.find((p) => p.id === profileId);
    const stream = curProf?.stream || "Commerce";

    const loadedSessions = loadStudySessions(profileId);
    const loadedSubs = loadSubjects(profileId);
    const syncedSubs = syncSubjectTotals(loadedSubs, loadedSessions);

    setSettings(loadSettings(profileId));
    setTasks(loadTasks(profileId));
    setSubjects(syncedSubs);
    setStudySessions(loadedSessions);
    setNotes(loadNotes(profileId));
    setHabits(loadHabits(profileId));
    setWater(loadWater(profileId));
    setFocusLogs(loadFocusSessions(profileId));
    setGoals(loadGoals(profileId));
    setCalendarEvents(loadCalendarEvents(profileId));
    setAbyaChat(loadAbyaChat(profileId));
    setAbyaLanguage(loadAbyaLanguage(profileId));
    setCareerProfile(loadCareerProfile(profileId));
    setCareerAssessment(loadCareerAssessment(profileId));
    setCareerRoadmap(loadCareerRoadmap(profileId));
    setCareerQuiz(loadCareerQuiz(profileId));
    const loadedAcadSubs = loadAcademicSubjects(stream, profileId);
    const loadedAcadChaps = loadAcademicChapters(profileId);
    setAcademicSubjects(loadedAcadSubs);
    setAcademicChapters(loadedAcadChaps);
    setAcademicTests(loadAcademicTests(profileId));
    setAcademicPlan(loadAcademicPlan(profileId));

    const loadedVVI = loadVVITopics(profileId);
    setVviTopics(loadedVVI.length > 0 ? loadedVVI : getDefaultVVITopicsForStream(stream, loadedAcadSubs, loadedAcadChaps));

    const loadedRev = loadAcademicRevisions(profileId);
    setAcademicRevisions(loadedRev.length > 0 ? loadedRev : getDefaultRevisionsForStream(stream, loadedAcadSubs, loadedAcadChaps));

    setAcademicPractice(loadAcademicPractice(profileId));

    setExamProfile(loadExamProfile(profileId));
    setExamMilestones(loadExamMilestones(profileId));
    setExamMockTests(loadExamMockTests(profileId));
    setExamPlan(loadExamDailyPlan(profileId));
    setExamTestRecords(loadExamTestRecords(profileId));
  };

  // Profile Action Handlers
  const handleSwitchProfile = (pId: string) => {
    reloadAllDataForProfile(pId);
  };

  const handleAddStudentProfile = (
    pData: Omit<StudentProfile, "id" | "createdAt" | "updatedAt">
  ) => {
    const newProf = addStudentProfile(pData);
    reloadAllDataForProfile(newProf.id);
  };

  const handleUpdateStudentProfile = (updated: StudentProfile) => {
    updateStudentProfile(updated);
    const refreshed = loadProfiles();
    setProfiles(refreshed);
    if (updated.id === activeProfileId) {
      reloadAllDataForProfile(updated.id);
    }
  };

  const handleDeleteStudentProfile = (pId: string) => {
    const remaining = deleteStudentProfile(pId);
    setProfiles(remaining);
    const curActive = loadActiveProfileId();
    reloadAllDataForProfile(curActive);
  };

  const handleExportStudentProfile = (pId: string) => {
    exportStudentProfileJSON(pId);
  };

  const handleImportStudentProfile = (jsonString: string) => {
    const res = importStudentProfileJSON(jsonString);
    if (res.success && res.profileId) {
      reloadAllDataForProfile(res.profileId);
    }
  };

  // Diagnostic Session Isolation Log & GARIA DEBUG Initialization Path
  useEffect(() => {
    let lsKeys: string[] = [];
    let ssKeys: string[] = [];
    let cookiesPresent = false;
    try {
      lsKeys = Object.keys(localStorage);
    } catch (e) {}
    try {
      ssKeys = Object.keys(sessionStorage);
    } catch (e) {}
    try {
      cookiesPresent = !!document.cookie;
    } catch (e) {}

    console.log("[GARIA DEBUG]", {
      localStorageKeys: lsKeys,
      sessionStorageKeys: ssKeys,
      cookiesPresent,
      initialProfiles: profiles,
      initialActiveProfileId: activeProfileId,
      initialActiveStudent: activeStudent,
      sourceOfActiveStudent: profiles.length === 0 ? "None (Fresh Context)" : (activeStudent ? "Loaded from profiles" : "None"),
      sourceOfProfileName: activeStudent ? activeStudent.name : "None (Welcome Screen Active)",
    });

    console.log("[GARIA SESSION]", {
      profilesCount: profiles.length,
      activeProfileId,
      activeStudentName: activeStudent?.name || null,
    });
  }, [profiles, activeProfileId, activeStudent]);

  // Sync Theme with DOM
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let isLight = false;
      if (settings.theme === "light") {
        isLight = true;
      } else if (settings.theme === "system") {
        isLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      }

      if (isLight) {
        root.classList.add("light");
      } else {
        root.classList.remove("light");
      }
    };

    applyTheme();

    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
      const listener = () => applyTheme();
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    if (activeProfileId && activeStudent) {
      saveSettings(settings, activeProfileId);
    }
  }, [settings, activeProfileId, activeStudent]);

  // Sync Data Save Handlers
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings, activeProfileId);
  };

  const handleUpdateCareerProfile = (p: CareerProfile) => {
    setCareerProfile(p);
    saveCareerProfile(p, activeProfileId);
  };

  const handleUpdateCareerAssessment = (a: CareerAssessment) => {
    setCareerAssessment(a);
    saveCareerAssessment(a, activeProfileId);
  };

  const handleUpdateCareerRoadmap = (r: CareerRoadmap) => {
    setCareerRoadmap(r);
    saveCareerRoadmap(r, activeProfileId);
  };

  const handleUpdateCareerQuiz = (quiz: CareerQuizAnswers) => {
    setCareerQuiz(quiz);
    saveCareerQuiz(quiz, activeProfileId);
  };

  const handleUpdateAcademicSubjects = (subs: AcademicSubject[]) => {
    setAcademicSubjects(subs);
    saveAcademicSubjects(subs, activeProfileId);
  };

  const handleUpdateAcademicChapters = (chaps: AcademicChapter[]) => {
    setAcademicChapters(chaps);
    saveAcademicChapters(chaps, activeProfileId);
  };

  const handleUpdateAcademicTests = (tests: AcademicTest[]) => {
    setAcademicTests(tests);
    saveAcademicTests(tests, activeProfileId);
  };

  const handleUpdateAcademicPlan = (plan: SmartStudyPlan | null) => {
    setAcademicPlan(plan);
    saveAcademicPlan(plan, activeProfileId);
  };

  const handleUpdateVVITopics = (topics: AcademicVVITopic[]) => {
    setVviTopics(topics);
    saveVVITopics(topics, activeProfileId);
  };

  const handleUpdateAcademicRevisions = (revisions: AcademicRevisionItem[]) => {
    setAcademicRevisions(revisions);
    saveAcademicRevisions(revisions, activeProfileId);
  };

  const handleUpdateAcademicPractice = (sessions: AcademicPracticeSession[]) => {
    setAcademicPractice(sessions);
    saveAcademicPractice(sessions, activeProfileId);
  };

  const handleUpdateAcademicRoadmap = (roadmap: AcademicRoadmapData) => {
    saveAcademicRoadmapData(roadmap, activeProfileId);
  };

  const handleUpdateExamProfile = (prof: ExamProfile) => {
    setExamProfile(prof);
    saveExamProfile(prof, activeProfileId);
  };

  const handleUpdateExamMilestones = (ms: ExamMilestone[]) => {
    setExamMilestones(ms);
    saveExamMilestones(ms, activeProfileId);
  };

  const handleUpdateExamMockTests = (tests: ExamMockTest[]) => {
    setExamMockTests(tests);
    saveExamMockTests(tests, activeProfileId);
  };

  const handleUpdateExamPlan = (plan: ExamDailyPlan | null) => {
    setExamPlan(plan);
    saveExamDailyPlan(plan, activeProfileId);
  };

  const handleAddTask = (newTask: Omit<Task, "id" | "createdAt">) => {
    const created: Task = {
      ...newTask,
      id: "task-" + Date.now(),
      createdAt: Date.now(),
    };
    const updated = [created, ...tasks];
    setTasks(updated);
    saveTasks(updated, activeProfileId);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updated);
    saveTasks(updated, activeProfileId);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated, activeProfileId);
  };

  const handleAddSubject = (
    newSubj: Omit<Subject, "id" | "completedMinutes" | "totalSessions">
  ) => {
    const created: Subject = {
      ...newSubj,
      id: "sub-" + Date.now(),
      completedMinutes: 0,
      totalSessions: 0,
    };
    const updated = [...subjects, created];
    setSubjects(updated);
    saveSubjects(updated, activeProfileId);
  };

  const handleUpdateSubject = (updatedSubj: Subject) => {
    const updated = subjects.map((s) => (s.id === updatedSubj.id ? updatedSubj : s));
    setSubjects(updated);
    saveSubjects(updated, activeProfileId);
  };

  const handleDeleteSubject = (id: string) => {
    const updated = subjects.filter((s) => s.id !== id);
    setSubjects(updated);
    saveSubjects(updated, activeProfileId);
  };

  const handleResetSubjectsToDefaults = () => {
    const stream = activeStudent?.stream || "Commerce";
    const defaults = getDefaultStudySubjectsForStream(stream);
    setSubjects(defaults);
    saveSubjects(defaults, activeProfileId);
  };

  const syncSubjectTotals = (curSubjects: Subject[], curSessions: StudySession[]) => {
    return curSubjects.map((s) => {
      const matchingSessions = curSessions.filter((sess) => sess.subjectId === s.id);
      const totalSecs = matchingSessions.reduce((acc, sess) => acc + (sess.durationSeconds || 0), 0);
      return {
        ...s,
        completedMinutes: Math.round(totalSecs / 60),
        totalSessions: matchingSessions.length,
      };
    });
  };

  const handleLogStudySession = (
    session: Omit<StudySession, "id" | "timestamp">
  ) => {
    const created: StudySession = {
      ...session,
      id: "study-" + Date.now(),
      timestamp: Date.now(),
    };
    const updatedSessions = [created, ...studySessions];
    setStudySessions(updatedSessions);
    saveStudySessions(updatedSessions, activeProfileId);

    const updatedSubs = syncSubjectTotals(subjects, updatedSessions);
    setSubjects(updatedSubs);
    saveSubjects(updatedSubs, activeProfileId);
  };

  const handleDeleteStudySession = (sessionId: string) => {
    const updatedSessions = studySessions.filter((s) => s.id !== sessionId);
    setStudySessions(updatedSessions);
    saveStudySessions(updatedSessions, activeProfileId);

    const updatedSubs = syncSubjectTotals(subjects, updatedSessions);
    setSubjects(updatedSubs);
    saveSubjects(updatedSubs, activeProfileId);
  };

  const handleUpdateStudySession = (updatedSession: StudySession) => {
    const updatedSessions = studySessions.map((s) =>
      s.id === updatedSession.id ? updatedSession : s
    );
    setStudySessions(updatedSessions);
    saveStudySessions(updatedSessions, activeProfileId);

    const updatedSubs = syncSubjectTotals(subjects, updatedSessions);
    setSubjects(updatedSubs);
    saveSubjects(updatedSubs, activeProfileId);
  };

  const handleAddNote = (
    newNote: Omit<Note, "id" | "createdAt" | "updatedAt">
  ) => {
    const created: Note = {
      ...newNote,
      id: "note-" + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [created, ...notes];
    setNotes(updated);
    saveNotes(updated, activeProfileId);
  };

  const handleUpdateNote = (updatedNote: Note) => {
    const updated = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    setNotes(updated);
    saveNotes(updated, activeProfileId);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated, activeProfileId);
  };

  const handleAddHabit = (
    newHabit: Omit<Habit, "id" | "streak" | "completedDates" | "createdAt">
  ) => {
    const created: Habit = {
      ...newHabit,
      id: "habit-" + Date.now(),
      streak: 0,
      completedDates: [],
      createdAt: Date.now(),
    };
    const updated = [...habits, created];
    setHabits(updated);
    saveHabits(updated, activeProfileId);
  };

  const handleToggleHabitDate = (habitId: string, dateStr: string) => {
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const isDone = h.completedDates.includes(dateStr);
        const newDates = isDone
          ? h.completedDates.filter((d) => d !== dateStr)
          : [...h.completedDates, dateStr];

        return {
          ...h,
          completedDates: newDates,
          streak: newDates.length,
        };
      }
      return h;
    });
    setHabits(updated);
    saveHabits(updated, activeProfileId);
  };

  const handleDeleteHabit = (id: string) => {
    const updated = habits.filter((h) => h.id !== id);
    setHabits(updated);
    saveHabits(updated, activeProfileId);
  };

  const handleUpdateWater = (newWater: WaterLog) => {
    setWater(newWater);
    saveWater(newWater, activeProfileId);
  };

  const handleLogFocusSession = (log: Omit<FocusSessionLog, "id">) => {
    const created: FocusSessionLog = {
      ...log,
      id: "focus-" + Date.now(),
    };
    const updated = [created, ...focusLogs];
    setFocusLogs(updated);
    saveFocusSessions(updated, activeProfileId);
  };

  // Last User Prompt for Abya AI Retry
  const [lastUserPrompt, setLastUserPrompt] = useState<string>("");

  const handleUpdateAbyaLanguage = (lang: AbyaLanguageSetting) => {
    setAbyaLanguage(lang);
    saveAbyaLanguage(lang, activeStudent.id);
  };

  // Abya AI Chat Messaging Handler
  const handleSendAbyaMessage = async (
    prompt: string,
    contextNote?: string,
    actionType?: any
  ) => {
    if (isAbyaSubmittingRef.current) {
      console.warn("[Abya AI Client] Request already in progress. Ignoring duplicate submission.");
      return;
    }
    isAbyaSubmittingRef.current = true;

    setLastUserPrompt(prompt);
    const userMsg: AbyaMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };

    const newChatWithUser = [...abyaChat, userMsg];
    setAbyaChat(newChatWithUser);
    saveAbyaChat(newChatWithUser);

    // Recent context window (last 10 messages prior to prompt)
    const recentHistory = abyaChat.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    const requestPayload = {
      prompt,
      history: recentHistory,
      customApiKey: settings.customApiKey,
      contextNote,
      abyaLanguage,
      studentProfileContext: {
        id: activeStudent.id,
        name: activeStudent.name,
        classLevel: activeStudent.classLevel,
        stream: activeStudent.stream,
        board: activeStudent.board,
      },
      todayContext: {
        pendingTasksCount: tasks.filter((t) => !t.completed).length,
        completedTasksCount: tasks.filter((t) => t.completed).length,
      },
      careerContext: {
        stream: activeStudent.stream,
        currentClass: activeStudent.classLevel,
        targetCareer: careerRoadmap.careerTitle || careerProfile.selectedCareerId || "General",
        strongSubjects: careerAssessment.strongSubjects,
        roadmapProgress: Math.round(
          (careerRoadmap.milestones.filter((m) => m.completed).length /
            (careerRoadmap.milestones.length || 1)) *
            100
        ),
      },
      academicContext: {
        stream: activeStudent.stream,
        overallProgress: Math.round(
          (academicChapters.filter((c) => c.status === "Completed").length /
            (academicChapters.length || 1)) *
            100
        ),
        activeSubjectsCount: academicSubjects.length,
        weakTopicsCount: academicChapters.filter((c) => c.isWeak).length,
        weakChapterTitles: academicChapters
          .filter((c) => c.isWeak)
          .map((c) => c.title)
          .join(", "),
        testAverage:
          academicTests.length > 0
            ? Math.round(
                academicTests.reduce(
                  (acc, t) => acc + (t.score / (t.maxMarks || 1)) * 100,
                  0
                ) / academicTests.length
              )
            : 0,
      },
      examContext: {
        board: activeStudent.board || examProfile.board,
        classLevel: activeStudent.classLevel || examProfile.classLevel,
        stream: activeStudent.stream,
        examName: examProfile.examName,
        daysRemaining: calculateExamCountdown(examProfile).daysRemaining,
        readinessScore: calculateExamReadiness(
          examProfile,
          academicSubjects,
          academicChapters,
          [...academicTests, ...examMockTests]
        ).overallScore,
        readinessStatus: calculateExamReadiness(
          examProfile,
          academicSubjects,
          academicChapters,
          [...academicTests, ...examMockTests]
        ).status,
        urgentChapters: academicChapters
          .filter((c) => c.priority === "VVI" || c.isWeak)
          .map((c) => c.title)
          .slice(0, 5)
          .join(", "),
        weakTopics: detectWeaknessTopics(
          academicSubjects,
          academicChapters,
          [...academicTests, ...examMockTests]
        )
          .map((w) => `${w.subjectName}: ${w.chapterTitle}`)
          .join(", "),
        targetCareer: careerProfile.targetCareer,
      },
    };

    let aiReplyText: string | null = null;
    let isUnauthorizedKey = false;
    const maxAttempts = 3;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        try {
          console.log(`[Abya AI Client] Request attempt ${attempt}/${maxAttempts} for prompt: "${prompt.slice(0, 35)}..."`);
          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestPayload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const data = await res.json();

          if (res.ok && data.text) {
            aiReplyText = data.text;
            console.log(`[Abya AI Client] Attempt ${attempt} succeeded in ${data.durationMs || "N/A"}ms.`);
            break;
          }

          if (res.status === 401 || data.code === "MISSING_API_KEY") {
            console.warn("[Abya AI Client] 401 Unauthorized / Missing API key. Triggering Local Intelligence fallback directly.");
            isUnauthorizedKey = true;
            break;
          }

          throw new Error(data.error || `Server responded with status ${res.status}`);
        } catch (err: any) {
          clearTimeout(timeoutId);
          const isAbort = err.name === "AbortError";
          const errMsg = isAbort ? "Request timed out after 25s" : err?.message || "Network error";
          console.warn(`[Abya AI Client] Attempt ${attempt}/${maxAttempts} failed: ${errMsg}`);

          if (attempt < maxAttempts) {
            const delay = attempt === 1 ? 1000 : 2000;
            console.log(`[Abya AI Client] Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      if (aiReplyText) {
        const modelMsg: AbyaMessage = {
          id: "model-" + Date.now(),
          role: "model",
          content: aiReplyText,
          timestamp: Date.now(),
        };

        setAbyaChat((prev) => {
          const updated = [...prev, modelMsg];
          saveAbyaChat(updated);
          return updated;
        });
      } else {
        // Automatic Local Intelligence Fallback
        console.log(`[Abya AI Client] External AI service unavailable (unauthorizedKey=${isUnauthorizedKey}). Using Local Intelligence.`);
        const activeStudentData = {
          profile: activeStudent,
          tasks,
          subjects: academicSubjects,
          chapters: academicChapters,
          tests: academicTests,
          mockTests: examMockTests,
          examProfile,
          careerProfile,
          careerRoadmap,
          daysRemaining: calculateExamCountdown(examProfile).daysRemaining,
          readinessScore: calculateExamReadiness(
            examProfile,
            academicSubjects,
            academicChapters,
            [...academicTests, ...examMockTests]
          ).overallScore,
        };

        const fallbackContent = generateAbyaFallbackResponse(
          actionType || "general",
          prompt,
          activeStudentData
        );

        const modelMsg: AbyaMessage = {
          id: "model-" + Date.now(),
          role: "model",
          content: fallbackContent,
          timestamp: Date.now(),
          isFallback: true,
        };

        setAbyaChat((prev) => {
          const updated = [...prev, modelMsg];
          saveAbyaChat(updated);
          return updated;
        });
      }
    } catch (e: any) {
      console.error("[Abya AI Client] Unexpected error in chat flow:", e);
      const errorMsg: AbyaMessage = {
        id: "error-" + Date.now(),
        role: "model",
        content: "Abya couldn't respond right now. Please try again or use Local Intelligence.",
        timestamp: Date.now(),
        isError: true,
      };
      setAbyaChat((prev) => {
        const updated = [...prev, errorMsg];
        saveAbyaChat(updated);
        return updated;
      });
    } finally {
      isAbyaSubmittingRef.current = false;
    }
  };

  const handleRetryLastMessage = () => {
    if (lastUserPrompt) {
      handleSendAbyaMessage(lastUserPrompt);
    }
  };

  const handleTriggerAbyaFallback = (actionType: any) => {
    const activeStudentData = {
      profile: activeStudent,
      tasks,
      subjects: academicSubjects,
      chapters: academicChapters,
      tests: academicTests,
      examProfile,
      mockTests: examMockTests,
      careerProfile,
      careerRoadmap,
      daysRemaining: calculateExamCountdown(examProfile).daysRemaining,
      readinessScore: calculateExamReadiness(
        examProfile,
        academicSubjects,
        academicChapters,
        [...academicTests, ...examMockTests]
      ).overallScore,
    };

    const fallbackContent = generateAbyaFallbackResponse(
      actionType || "general",
      lastUserPrompt || "Help",
      activeStudentData
    );

    const fallbackMsg: AbyaMessage = {
      id: "fallback-" + Date.now(),
      role: "model",
      content: fallbackContent,
      timestamp: Date.now(),
      isFallback: true,
    };

    const updated = [...abyaChat, fallbackMsg];
    setAbyaChat(updated);
    saveAbyaChat(updated);
  };

  const handleClearChatHistory = () => {
    const initial: AbyaMessage[] = [
      {
        id: "msg-1",
        role: "model",
        content:
          "Chat history cleared! 👋 How can I assist you with your productivity or study schedule today?",
        timestamp: Date.now(),
      },
    ];
    setAbyaChat(initial);
    saveAbyaChat(initial);
  };

  // Goal Handlers
  const handleAddGoal = (newGoal: Omit<Goal, "id" | "createdAt">) => {
    const created: Goal = {
      ...newGoal,
      id: "goal-" + Date.now(),
      createdAt: Date.now(),
    };
    const updated = [created, ...goals];
    setGoals(updated);
    saveGoals(updated);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    const updated = goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    setGoals(updated);
    saveGoals(updated);
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
  };

  // Calendar Event Handlers
  const handleAddCalendarEvent = (newEvent: Omit<CalendarEvent, "id" | "createdAt">) => {
    const created: CalendarEvent = {
      ...newEvent,
      id: "cal-" + Date.now(),
      createdAt: Date.now(),
    };
    const updated = [created, ...calendarEvents];
    setCalendarEvents(updated);
    saveCalendarEvents(updated);
  };

  const handleUpdateCalendarEvent = (updatedEvent: CalendarEvent) => {
    const updated = calendarEvents.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
    setCalendarEvents(updated);
    saveCalendarEvents(updated);
  };

  const handleDeleteCalendarEvent = (id: string) => {
    const updated = calendarEvents.filter((e) => e.id !== id);
    setCalendarEvents(updated);
    saveCalendarEvents(updated);
  };

  const handleClearAllOSData = () => {
    clearAllData();
    setTasks([]);
    setSubjects([]);
    setStudySessions([]);
    setNotes([]);
    setHabits([]);
    setWater({ date: getTodayString(), glasses: 0, goal: 8 });
    setFocusLogs([]);
    setGoals([]);
    setCalendarEvents([]);
    setCareerProfile(loadCareerProfile());
    setCareerAssessment(loadCareerAssessment());
    setCareerRoadmap(loadCareerRoadmap());
    setAcademicSubjects(loadAcademicSubjects());
    setAcademicChapters(loadAcademicChapters());
    setAcademicTests(loadAcademicTests());
    setAcademicPlan(loadAcademicPlan());
    handleClearChatHistory();
  };

  const handleReloadData = () => {
    setTasks(loadTasks());
    setSubjects(loadSubjects());
    setStudySessions(loadStudySessions());
    setNotes(loadNotes());
    setHabits(loadHabits());
    setWater(loadWater());
    setFocusLogs(loadFocusSessions());
    setGoals(loadGoals());
    setCalendarEvents(loadCalendarEvents());
    setAbyaChat(loadAbyaChat());
    setSettings(loadSettings());
    setCareerProfile(loadCareerProfile());
    setCareerAssessment(loadCareerAssessment());
    setCareerRoadmap(loadCareerRoadmap());
    setAcademicSubjects(loadAcademicSubjects());
    setAcademicChapters(loadAcademicChapters());
    setAcademicTests(loadAcademicTests());
    setAcademicPlan(loadAcademicPlan());
  };

  const handleAskAbyaWithContext = (contextText: string) => {
    setAttachedContextNote(contextText);
    setActiveTab("abya");
  };

  const handleWelcomeCreateAccount = async (data: {
    name: string;
    email: string;
    pass: string;
    stream: StreamType;
    classLevel: string;
    board: string;
  }) => {
    const newProf = addStudentProfile({
      name: data.name,
      stream: data.stream,
      classLevel: data.classLevel,
      board: data.board,
    });

    const hashed = await hashPassword(data.pass);
    const profSettings = loadSettings(newProf.id);
    const updatedSettings: UserSettings = {
      ...profSettings,
      userName: data.name,
      account: {
        email: data.email,
        passwordHash: hashed,
        name: data.name,
        isPrivateMode: false,
        createdAt: Date.now(),
      },
    };
    saveSettings(updatedSettings, newProf.id);
    reloadAllDataForProfile(newProf.id);
  };

  const handleWelcomeLogin = async (email: string, pass: string): Promise<boolean> => {
    const hashed = await hashPassword(pass);
    const allProfs = loadProfiles();
    for (const prof of allProfs) {
      const profSettings = loadSettings(prof.id);
      if (
        profSettings.account &&
        profSettings.account.email.toLowerCase() === email.toLowerCase() &&
        (!profSettings.account.passwordHash || profSettings.account.passwordHash === hashed)
      ) {
        reloadAllDataForProfile(prof.id);
        return true;
      }
    }
    return false;
  };

  const handleWelcomeContinuePrivately = (data: {
    name?: string;
    stream: StreamType;
    classLevel: string;
    board: string;
  }) => {
    const name = data.name && data.name.trim() ? data.name.trim() : "Student";
    const newProf = addStudentProfile({
      name,
      stream: data.stream,
      classLevel: data.classLevel,
      board: data.board,
    });

    const profSettings = loadSettings(newProf.id);
    const updatedSettings: UserSettings = {
      ...profSettings,
      userName: name,
      account: {
        email: `${newProf.id}@gariaos.local`,
        passwordHash: "",
        name,
        isPrivateMode: true,
        createdAt: Date.now(),
      },
    };
    saveSettings(updatedSettings, newProf.id);
    reloadAllDataForProfile(newProf.id);
  };

  if (activeTab === "download") {
    return (
      <DownloadPage
        onBackToApp={() => setActiveTab("home")}
      />
    );
  }

  if (profiles.length === 0 || !activeStudent) {
    return (
      <WelcomeScreen
        onCreateAccount={handleWelcomeCreateAccount}
        onLogin={handleWelcomeLogin}
        onContinuePrivately={handleWelcomeContinuePrivately}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Top OS Bar */}
      <StatusBar
        settings={settings}
        activeStudent={activeStudent}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onGoBack={handleGoBack}
        canGoBack={activeTab !== "home" || tabHistory.length > 1}
        onUpdateSettings={handleUpdateSettings}
        onNavigate={(tab) => {
          handleNavigate(tab);
          setIsMoreMenuOpen(false);
        }}
        activeTab={activeTab}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar Navigation */}
        <DesktopSidebar
          activeTab={activeTab}
          activeStudent={activeStudent}
          onOpenStudentModal={() => setIsStudentModalOpen(true)}
          onNavigate={(tab) => {
            handleNavigate(tab);
            setIsMoreMenuOpen(false);
          }}
          settings={settings}
        />

        {/* Main Content Stage */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === "home" && (
            <HomeDashboard
              tasks={tasks}
              subjects={subjects}
              studySessions={studySessions}
              focusLogs={focusLogs}
              notes={notes}
              habits={habits}
              water={water}
              goals={goals}
              events={calendarEvents}
              academicSubjects={academicSubjects}
              chapters={academicChapters}
              roadmap={academicRoadmap}
              vviTopics={vviTopics}
              revisions={academicRevisions}
              examTestRecords={examTestRecords}
              examProfile={examProfile}
              careerProfile={careerProfile}
              practiceSessions={academicPractice}
              settings={settings}
              activeStudent={activeStudent}
              onOpenStudentModal={() => setIsStudentModalOpen(true)}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setIsMoreMenuOpen(false);
              }}
              onQuickAddTask={() => setActiveTab("tasks")}
              onQuickAddNote={() => setActiveTab("notes")}
              onAddWaterGlass={() =>
                handleUpdateWater({ ...water, glasses: water.glasses + 1 })
              }
              onRemoveWaterGlass={() =>
                handleUpdateWater({ ...water, glasses: Math.max(0, water.glasses - 1) })
              }
              onToggleTask={(task) =>
                handleUpdateTask({ ...task, completed: !task.completed })
              }
              onToggleHabit={(habitId, dateStr) =>
                handleToggleHabitDate(habitId, dateStr)
              }
            />
          )}

          {activeTab === "tasks" && (
            <TaskManager
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === "goals" && (
            <GoalsPage
              goals={goals}
              subjects={subjects}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarPage
              events={calendarEvents}
              tasks={tasks}
              studySessions={studySessions}
              goals={goals}
              onAddEvent={handleAddCalendarEvent}
              onUpdateEvent={handleUpdateCalendarEvent}
              onDeleteEvent={handleDeleteCalendarEvent}
              onToggleTaskComplete={handleUpdateTask}
            />
          )}

          {activeTab === "exam" && (
            <ExamCenterPage
              examProfile={examProfile}
              examMilestones={examMilestones}
              examMockTests={examMockTests}
              examPlan={examPlan}
              academicSubjects={academicSubjects}
              academicChapters={academicChapters}
              academicTests={academicTests}
              careerProfile={careerProfile}
              careerRoadmap={careerRoadmap}
              vviTopics={vviTopics}
              revisions={academicRevisions}
              practiceSessions={academicPractice}
              examTestRecords={examTestRecords}
              onSaveExamTestRecord={handleSaveExamTestRecord}
              onDeleteExamTestRecord={handleDeleteExamTestRecord}
              onUpdateExamProfile={handleUpdateExamProfile}
              onUpdateExamMilestones={handleUpdateExamMilestones}
              onUpdateExamMockTests={handleUpdateExamMockTests}
              onUpdateExamPlan={handleUpdateExamPlan}
              onUpdateChapters={handleUpdateAcademicChapters}
              onAskAbyaWithContext={handleAskAbyaWithContext}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setIsMoreMenuOpen(false);
              }}
            />
          )}

          {activeTab === "academic" && (
            <AcademicCenterPage
              activeStudent={activeStudent}
              careerProfile={careerProfile}
              careerRoadmap={careerRoadmap}
              subjects={academicSubjects}
              chapters={academicChapters}
              tests={academicTests}
              smartPlan={academicPlan}
              roadmap={academicRoadmap}
              vviTopics={vviTopics}
              revisions={academicRevisions}
              practiceSessions={academicPractice}
              onUpdateSubjects={handleUpdateAcademicSubjects}
              onUpdateChapters={handleUpdateAcademicChapters}
              onUpdateTests={handleUpdateAcademicTests}
              onUpdatePlan={handleUpdateAcademicPlan}
              onUpdateVVITopics={handleUpdateVVITopics}
              onUpdateRevisions={handleUpdateAcademicRevisions}
              onUpdatePracticeSessions={handleUpdateAcademicPractice}
              onUpdateRoadmap={handleUpdateAcademicRoadmap}
              onAskAbyaWithContext={handleAskAbyaWithContext}
            />
          )}

          {activeTab === "questionbank" && (
            <QuestionBankPage
              activeStudent={activeStudent}
              onAskAbyaWithContext={handleAskAbyaWithContext}
              onNavigate={(tab) => {
                handleNavigate(tab);
                setIsMoreMenuOpen(false);
              }}
            />
          )}

          {activeTab === "career" && (
            <CareerCenterPage
              profile={careerProfile}
              assessment={careerAssessment}
              roadmap={careerRoadmap}
              quizAnswers={careerQuiz}
              activeStudentName={activeStudent.name}
              subjects={subjects}
              onUpdateProfile={handleUpdateCareerProfile}
              onUpdateAssessment={handleUpdateCareerAssessment}
              onUpdateRoadmap={handleUpdateCareerRoadmap}
              onUpdateQuiz={handleUpdateCareerQuiz}
              onNavigateToAbya={() => setActiveTab("abya")}
            />
          )}

          {activeTab === "study" && (
            <StudyTracker
              subjects={subjects}
              studySessions={studySessions}
              academicChapters={academicChapters}
              activeStudent={activeStudent}
              onAddSubject={handleAddSubject}
              onUpdateSubject={handleUpdateSubject}
              onDeleteSubject={handleDeleteSubject}
              onResetSubjectsToDefaults={handleResetSubjectsToDefaults}
              onLogStudySession={handleLogStudySession}
              onDeleteStudySession={handleDeleteStudySession}
              onUpdateStudySession={handleUpdateStudySession}
            />
          )}

          {activeTab === "focus" && (
            <FocusTimer
              settings={settings}
              focusLogs={focusLogs}
              onLogFocusSession={handleLogFocusSession}
            />
          )}

          {activeTab === "notes" && (
            <NotesPage
              notes={notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onAskAbyaWithContext={handleAskAbyaWithContext}
            />
          )}

          {activeTab === "water" && (
            <WaterTracker
              water={water}
              onUpdateWater={handleUpdateWater}
            />
          )}

          {activeTab === "habits" && (
            <HabitsPage
              habits={habits}
              onAddHabit={handleAddHabit}
              onToggleHabitDate={handleToggleHabitDate}
              onDeleteHabit={handleDeleteHabit}
            />
          )}

          {activeTab === "abya" && (
            <AbyaAIPage
              messages={abyaChat}
              settings={settings}
              activeStudent={activeStudent}
              insightCards={generateAbyaInsightCards({
                profile: activeStudent,
                tasks,
                subjects: academicSubjects,
                chapters: academicChapters,
                tests: academicTests,
                examProfile,
                mockTests: examMockTests,
                careerProfile,
                careerRoadmap,
                daysRemaining: calculateExamCountdown(examProfile).daysRemaining,
                readinessScore: calculateExamReadiness(
                  examProfile,
                  academicSubjects,
                  academicChapters,
                  [...academicTests, ...examMockTests]
                ).overallScore,
              })}
              onSendMessage={handleSendAbyaMessage}
              abyaLanguage={abyaLanguage}
              onUpdateAbyaLanguage={handleUpdateAbyaLanguage}
              onClearChat={handleClearChatHistory}
              onUpdateSettings={handleUpdateSettings}
              attachedContextNote={attachedContextNote}
              onClearAttachedContext={() => setAttachedContextNote("")}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setIsMoreMenuOpen(false);
              }}
              onTriggerFallbackAction={handleTriggerAbyaFallback}
              onRetryLastMessage={handleRetryLastMessage}
            />
          )}

          {activeTab === "stats" && (
            <StatisticsPage
              tasks={tasks}
              subjects={subjects}
              studySessions={studySessions}
              habits={habits}
              focusLogs={focusLogs}
              water={water}
              goals={goals}
            />
          )}

          {activeTab === "download" && (
            <DownloadPage
              onBackToApp={() => setActiveTab("home")}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage
              settings={settings}
              activeStudent={activeStudent}
              profiles={profiles}
              abyaLanguage={abyaLanguage}
              onUpdateAbyaLanguage={handleUpdateAbyaLanguage}
              onOpenStudentModal={() => setIsStudentModalOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onNavigate={(tab) => handleNavigate(tab)}
              onUpdateSettings={handleUpdateSettings}
              onClearChatHistory={handleClearChatHistory}
              onClearAllOSData={handleClearAllOSData}
              onReloadData={handleReloadData}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onNavigate={(tab) => {
          handleNavigate(tab);
          setIsMoreMenuOpen(false);
        }}
        onOpenMore={() => setIsMoreMenuOpen(true)}
        isMoreOpen={isMoreMenuOpen}
      />

      {/* More Menu Overlay */}
      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        onNavigate={(tab) => {
          handleNavigate(tab);
          setIsMoreMenuOpen(false);
        }}
        activeTab={activeTab}
      />

      {/* Multi-Student Profile Management Modal (v1.5) */}
      <StudentProfileModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        profiles={profiles}
        activeProfile={activeStudent}
        onSwitchProfile={(pId) => {
          handleSwitchProfile(pId);
          setIsStudentModalOpen(false);
        }}
        onAddProfile={handleAddStudentProfile}
        onUpdateProfile={handleUpdateStudentProfile}
        onDeleteProfile={handleDeleteStudentProfile}
        onExportProfile={handleExportStudentProfile}
        onImportProfile={handleImportStudentProfile}
      />

      {/* Authentication & Private Mode Modal (v2.8.3) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
