import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
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
  AbyaAIMode,
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
  AbyaDiagnosticsInfo,
  AbyaFallbackReason,
  AbyaProvider,
  AbyaExecutedAction,
  FlashcardDeck,
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
  sortNotesPinnedFirst,
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
  clearStudentWorkspaceData,
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
  loadFlashcardDecks,
  saveFlashcardDecks,
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

import {
  parseActionFromResponse,
  parseActionFromPrompt,
  executeAbyaModuleAction,
} from "./utils/abyaModuleActions";

import { hashPassword } from "./utils/auth";
import { auth, getValidClientAuthToken } from "./utils/firebase";
import { AppLanguage, getStoredLanguage, saveStoredLanguage } from "./utils/i18n";
import { loadQuestionBankProgress } from "./utils/questionBankEngine";
import { enqueueOfflineAction, reconcilePendingQueueWithFirestore } from "./utils/offlineQueue";
import {
  getSolarInfo,
  requestDeviceLocation,
  getCachedSolarCoordinates,
  resolvePreferredNightTheme,
} from "./utils/solarTheme";

// Components & Pages
import { StatusBar } from "./components/StatusBar";
import { MoreDrawer } from "./components/MoreDrawer";
import { StudentProfileModal } from "./components/StudentProfileModal";
import { AuthModal } from "./components/AuthModal";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { QuickSearchModal } from "./components/QuickSearchModal";
import { OfflineSyncToast } from "./components/OfflineSyncToast";
import { PinLockScreen } from "./components/PinLockScreen";
import { PageSkeletonLoader } from "./components/PageSkeletonLoader";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { shouldAppBeLocked, markSessionUnlocked, lockSession } from "./utils/security";

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
import { ExamCenterPage } from "./pages/ExamCenterPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
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
      if (path === "/questionbank" || hash === "#questionbank" || hash === "#mcq" || hash === "#pyq") {
        return "exam";
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
      if (path === "/career" || hash === "#career") {
        return ["home", "career"];
      }
    }
    return ["home"];
  });
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNoteFocusMode, setIsNoteFocusMode] = useState<boolean>(false);

  // Global search shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleNavigate = (tab: ActiveTab) => {
    const resolvedTab = (tab === "questionbank" || tab === "gmail") ? "exam" : tab;
    if (resolvedTab !== activeTab) {
      setTabHistory((prev) => [...prev, resolvedTab]);
      setActiveTab(resolvedTab);
      window.history.pushState({ tab: resolvedTab }, "", `#${resolvedTab}`);
    }
  };

  // Major swipeable primary tabs for mobile OS swipe navigation
  const SWIPEABLE_MAJOR_TABS: ActiveTab[] = ["home", "tasks", "focus", "abya"];
  const touchStartPos = useRef<{ x: number; y: number; time: number; valid: boolean } | null>(null);
  const [swipeFeedback, setSwipeFeedback] = useState<{ direction: "left" | "right"; targetTab: string } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      touchStartPos.current = null;
      return;
    }

    const target = e.target as HTMLElement | null;
    if (
      !target ||
      isMoreMenuOpen ||
      isStudentModalOpen ||
      isAuthModalOpen ||
      isSearchOpen
    ) {
      touchStartPos.current = null;
      return;
    }

    // Ignore touches on interactive inputs, sliders, horizontal scroll containers, canvas, code
    const isInteractive = target.closest(
      'input, textarea, select, button, [role="slider"], [data-no-swipe], .overflow-x-auto, canvas, pre, code, .monaco-editor, a'
    );
    if (isInteractive) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now(), valid: false };
      return;
    }

    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
      valid: true,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !touchStartPos.current.valid || e.changedTouches.length === 0) {
      touchStartPos.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;
    const elapsedTime = Date.now() - touchStartPos.current.time;
    touchStartPos.current = null;

    // Must be quick, predominantly horizontal swipe
    const isHorizontalSwipe =
      elapsedTime < 650 &&
      Math.abs(deltaX) >= 50 &&
      Math.abs(deltaX) > 1.35 * Math.abs(deltaY);

    if (!isHorizontalSwipe) return;

    if (deltaX < -50) {
      // Swiping Left (finger moves left -> navigate to next tab)
      const currentIndex = SWIPEABLE_MAJOR_TABS.indexOf(activeTab);
      if (currentIndex >= 0 && currentIndex < SWIPEABLE_MAJOR_TABS.length - 1) {
        const nextTab = SWIPEABLE_MAJOR_TABS[currentIndex + 1];
        handleNavigate(nextTab);
        setSwipeFeedback({ direction: "left", targetTab: nextTab });
        setTimeout(() => setSwipeFeedback(null), 1000);
      }
    } else if (deltaX > 50) {
      // Swiping Right (finger moves right -> navigate to previous tab or back)
      const currentIndex = SWIPEABLE_MAJOR_TABS.indexOf(activeTab);
      if (currentIndex > 0) {
        const prevTab = SWIPEABLE_MAJOR_TABS[currentIndex - 1];
        handleNavigate(prevTab);
        setSwipeFeedback({ direction: "right", targetTab: prevTab });
        setTimeout(() => setSwipeFeedback(null), 1000);
      } else if (currentIndex === -1) {
        handleGoBack();
        setSwipeFeedback({ direction: "right", targetTab: "Back" });
        setTimeout(() => setSwipeFeedback(null), 1000);
      }
    }
  };

  const handleGoBack = () => {
    if (isSearchOpen) {
      setIsSearchOpen(false);
      return;
    }
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
      if (isSearchOpen) {
        setIsSearchOpen(false);
        return;
      }
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
  }, [isSearchOpen, isAuthModalOpen, isStudentModalOpen, isMoreMenuOpen, tabHistory, activeTab]);

  // Visual Viewport API Tracking for Mobile Virtual Keyboards (Android / iOS / PWA / Webview)
  const [visualViewportHeight, setVisualViewportHeight] = useState<number | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleViewportChange = () => {
      if (typeof window !== "undefined" && window.visualViewport) {
        const height = window.visualViewport.height;
        const offsetTop = window.visualViewport.offsetTop;
        setVisualViewportHeight(height);
        const keyboardActive = window.innerHeight - height > 100;
        setIsKeyboardOpen(keyboardActive);
        document.documentElement.style.setProperty("--visual-viewport-height", `${height}px`);
        document.documentElement.style.setProperty("--visual-viewport-offset-top", `${offsetTop}px`);
      }
    };

    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
      handleViewportChange();
    }

    return () => {
      if (typeof window !== "undefined" && window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportChange);
        window.visualViewport.removeEventListener("scroll", handleViewportChange);
      }
    };
  }, []);

  // Multi-Student Profiles State (v1.5)
  const [profiles, setProfiles] = useState<StudentProfile[]>(() => {
    const existing = loadProfiles();
    if (existing.length > 0) return existing;
    if (typeof document !== "undefined") {
      const starter = addStudentProfile({
        name: "Student",
        stream: "Science",
        classLevel: "Class 12",
        board: "CBSE",
      });
      return [starter];
    }
    return [];
  });
  const [activeProfileId, setActiveProfileId] = useState<string>(loadActiveProfileId);
  const activeProfileIdRef = useRef<string>(activeProfileId);
  activeProfileIdRef.current = activeProfileId;

  const activeStudent =
    profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;

  // App Language State (English & Hindi)
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(() => {
    const stored = getStoredLanguage();
    if (stored) return stored;
    return (activeStudent?.language as AppLanguage) || "en";
  });

  const handleUpdateLanguage = (lang: AppLanguage) => {
    setCurrentLanguage(lang);
    saveStoredLanguage(lang);
    if (activeStudent) {
      updateStudentProfile({
        ...activeStudent,
        language: lang,
      });
    }
  };

  // App Data States
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    const initialSettings = loadSettings();
    return shouldAppBeLocked(initialSettings, loadActiveProfileId());
  });
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSubjects());
  const [studySessions, setStudySessions] = useState<StudySession[]>(() => loadStudySessions());
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>(() => loadFlashcardDecks());
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
    loadAcademicSubjects(careerProfile.stream, activeProfileId, activeStudent?.classLevel)
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
    enqueueOfflineAction({
      type: "SAVE_EXAM_RECORD",
      entityName: "examTestRecords",
      action: "create",
      profileId: activeProfileId,
      payload: newRecord,
    });
  };

  const handleDeleteExamTestRecord = (testId: string) => {
    const updated = examTestRecords.filter((t) => t.id !== testId);
    setExamTestRecords(updated);
    saveExamTestRecords(updated, activeProfileId);
    enqueueOfflineAction({
      type: "SAVE_EXAM_RECORD",
      entityName: "examTestRecords",
      action: "delete",
      profileId: activeProfileId,
      payload: { id: testId },
    });
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

    const newSettings = loadSettings(profileId);
    setSettings(newSettings);
    setIsAppLocked(shouldAppBeLocked(newSettings, profileId));
    setTasks(loadTasks(profileId));
    setSubjects(syncedSubs);
    setStudySessions(loadedSessions);
    setNotes(loadNotes(profileId));
    setFlashcardDecks(loadFlashcardDecks(profileId));
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
    const loadedAcadSubs = loadAcademicSubjects(stream, profileId, curProf?.classLevel);
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

    if (curProf?.language) {
      setCurrentLanguage(curProf.language as AppLanguage);
      saveStoredLanguage(curProf.language as AppLanguage);
    }
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

  // Sync Multi-Theme System & Geolocation High-Contrast/Night Theme Switcher with DOM
  useEffect(() => {
    const root = document.documentElement;
    const themeClasses = [
      "high-contrast",
      "classic",
      "light",
      "arctic",
      "amoled",
      "ocean",
      "midnight",
      "forest",
      "emerald",
      "purple",
      "sunset",
      "graphite",
      "frost",
      "custom",
      "custom-light",
    ];

    const isHexLight = (hex: string): boolean => {
      const cleanHex = hex.replace("#", "").trim();
      if (cleanHex.length !== 3 && cleanHex.length !== 6) return false;
      const fullHex =
        cleanHex.length === 3
          ? cleanHex
              .split("")
              .map((c) => c + c)
              .join("")
          : cleanHex;
      const r = parseInt(fullHex.substring(0, 2), 16) || 0;
      const g = parseInt(fullHex.substring(2, 4), 16) || 0;
      const b = parseInt(fullHex.substring(4, 6), 16) || 0;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 155;
    };

    const applyTheme = () => {
      let active = settings.theme || "dark";

      if (settings.autoSolarTheme) {
        const preferredNight = resolvePreferredNightTheme(settings);
        const simMode = settings.solarSimulationMode || "auto";
        const solar = getSolarInfo(new Date(), undefined, preferredNight, simMode);
        if (solar.isDaytime) {
          active = "high-contrast";
        } else {
          active = preferredNight;
        }
      } else if (active === "system") {
        active = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      }

      themeClasses.forEach((cls) => root.classList.remove(cls));

      if (active === "custom") {
        const primary =
          settings.customTheme?.primary ||
          settings.customThemeColors?.primary ||
          "#10b981";
        const bg =
          settings.customTheme?.background ||
          settings.customThemeColors?.background ||
          "#0b0f19";

        root.style.setProperty("--custom-primary", primary);
        root.style.setProperty("--custom-bg", bg);
        root.style.setProperty("--bg-main", bg);

        root.classList.add("custom");
        if (isHexLight(bg)) {
          root.classList.add("custom-light");
        }
      } else {
        root.style.removeProperty("--custom-primary");
        root.style.removeProperty("--custom-bg");
        root.style.removeProperty("--bg-main");

        if (active === "high-contrast") {
          root.classList.add("high-contrast");
          root.classList.add("light");
        } else if (active !== "dark" && themeClasses.includes(active)) {
          root.classList.add(active);
        }
      }
    };

    applyTheme();

    if (settings.autoSolarTheme && !getCachedSolarCoordinates()) {
      requestDeviceLocation().then((coords) => {
        if (coords) applyTheme();
      });
    }

    let intervalId: any = null;
    if (settings.autoSolarTheme) {
      // Re-evaluate every 60 seconds so transitions across sunrise/sunset are instantaneous
      intervalId = setInterval(() => {
        applyTheme();
      }, 60000);
    }

    let mediaQueryCleanup: (() => void) | null = null;
    if (settings.theme === "system" && !settings.autoSolarTheme) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
      const listener = () => applyTheme();
      mediaQuery.addEventListener("change", listener);
      mediaQueryCleanup = () => mediaQuery.removeEventListener("change", listener);
    }

    if (activeProfileId && activeStudent) {
      saveSettings(settings, activeProfileId);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (mediaQueryCleanup) mediaQueryCleanup();
    };
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
    enqueueOfflineAction({
      type: "CREATE_TASK",
      entityName: "tasks",
      action: "create",
      profileId: activeProfileId,
      payload: created,
    });
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updated);
    saveTasks(updated, activeProfileId);
    enqueueOfflineAction({
      type: "UPDATE_TASK",
      entityName: "tasks",
      action: "update",
      profileId: activeProfileId,
      payload: updatedTask,
    });
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated, activeProfileId);
    enqueueOfflineAction({
      type: "DELETE_TASK",
      entityName: "tasks",
      action: "delete",
      profileId: activeProfileId,
      payload: { id },
    });
  };

  const handleBulkDeleteTasks = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const updated = tasks.filter((t) => !idSet.has(t.id));
    setTasks(updated);
    saveTasks(updated, activeProfileId);
    ids.forEach((id) => {
      enqueueOfflineAction({
        type: "DELETE_TASK",
        entityName: "tasks",
        action: "delete",
        profileId: activeProfileId,
        payload: { id },
      });
    });
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
    const defaults = getDefaultStudySubjectsForStream(stream, activeStudent?.classLevel);
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
    setNotes((prevNotes) => {
      const maxExistingTs = prevNotes.reduce(
        (max, n) => Math.max(max, n.createdAt || 0, n.updatedAt || 0),
        0
      );
      const now = Math.max(Date.now(), maxExistingTs + 1);
      const resolvedLabels = Array.isArray(newNote.labels)
        ? newNote.labels
        : Array.isArray(newNote.tags)
        ? newNote.tags
        : [];
      const resolvedFolder =
        typeof newNote.folder === "string" && newNote.folder.trim()
          ? newNote.folder.trim()
          : "General";
      const created: Note = {
        ...newNote,
        pinned: Boolean(newNote.pinned),
        archived: Boolean(newNote.archived),
        labels: resolvedLabels,
        labelColors: newNote.labelColors || {},
        colorLabels: newNote.colorLabels || [],
        folder: resolvedFolder,
        reminderDate:
          typeof newNote.reminderDate === "string" && newNote.reminderDate.trim()
            ? newNote.reminderDate.trim()
            : undefined,
        isEncrypted:
          Boolean(newNote.isEncrypted) ||
          (typeof newNote.content === "string" && newNote.content.startsWith("ENCv1:")),
        versions: Array.isArray(newNote.versions) ? newNote.versions : [],
        sharedWith: Array.isArray(newNote.sharedWith) ? newNote.sharedWith : [],
        sharedPermissions: newNote.sharedPermissions || {},
        tags: resolvedLabels,
        id: "note-" + now + "-" + Math.random().toString(36).slice(2, 6),
        createdAt: now,
        updatedAt: now,
      };
      const updated = sortNotesPinnedFirst([created, ...prevNotes]);
      saveNotes(updated, activeProfileId);
      enqueueOfflineAction({
        type: "CREATE_NOTE",
        entityName: "notes",
        action: "create",
        profileId: activeProfileId,
        payload: created,
      });
      return updated;
    });
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes((prevNotes) => {
      const maxExistingTs = prevNotes.reduce(
        (max, n) => Math.max(max, n.createdAt || 0, n.updatedAt || 0),
        0
      );
      const nextUpdatedAt = Math.max(
        updatedNote.updatedAt || 0,
        Date.now(),
        maxExistingTs + 1
      );
      const resolvedLabels = Array.isArray(updatedNote.labels)
        ? updatedNote.labels
        : Array.isArray(updatedNote.tags)
        ? updatedNote.tags
        : [];
      const resolvedFolder =
        typeof updatedNote.folder === "string" && updatedNote.folder.trim()
          ? updatedNote.folder.trim()
          : "General";
      const existingTarget = prevNotes.find((n) => n.id === updatedNote.id);
      let resolvedVersions = Array.isArray(updatedNote.versions)
        ? updatedNote.versions
        : Array.isArray(existingTarget?.versions)
        ? existingTarget!.versions!
        : [];
      if (
        existingTarget &&
        existingTarget.content &&
        existingTarget.content.trim() !== (updatedNote.content || "").trim()
      ) {
        const alreadyRecorded =
          resolvedVersions.length > 0 &&
          resolvedVersions[0]?.content === existingTarget.content;
        if (!alreadyRecorded) {
          resolvedVersions = [
            {
              id: `ver-${existingTarget.updatedAt || Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 6)}`,
              title: existingTarget.title || "Snapshot",
              content: existingTarget.content,
              timestamp: existingTarget.updatedAt || existingTarget.createdAt || Date.now(),
              createdAt: existingTarget.updatedAt || existingTarget.createdAt || Date.now(),
            },
            ...resolvedVersions,
          ].slice(0, 30);
        }
      }

      const normalizedNote: Note = {
        ...updatedNote,
        pinned: Boolean(updatedNote.pinned),
        archived: Boolean(updatedNote.archived),
        labels: resolvedLabels,
        labelColors: updatedNote.labelColors || {},
        colorLabels: updatedNote.colorLabels || [],
        folder: resolvedFolder,
        reminderDate:
          typeof updatedNote.reminderDate === "string" &&
          updatedNote.reminderDate.trim()
            ? updatedNote.reminderDate.trim()
            : undefined,
        isEncrypted:
          Boolean(updatedNote.isEncrypted) ||
          (typeof updatedNote.content === "string" &&
            updatedNote.content.startsWith("ENCv1:")),
        versions: resolvedVersions,
        sharedWith: Array.isArray(updatedNote.sharedWith)
          ? updatedNote.sharedWith
          : Array.isArray(existingTarget?.sharedWith)
          ? existingTarget!.sharedWith
          : [],
        sharedPermissions:
          updatedNote.sharedPermissions || existingTarget?.sharedPermissions || {},
        tags: resolvedLabels,
        updatedAt: nextUpdatedAt,
      };
      const updated = sortNotesPinnedFirst(
        prevNotes.map((n) => (n.id === normalizedNote.id ? normalizedNote : n))
      );
      saveNotes(updated, activeProfileId);
      enqueueOfflineAction({
        type: "UPDATE_NOTE",
        entityName: "notes",
        action: "update",
        profileId: activeProfileId,
        payload: normalizedNote,
      });
      return updated;
    });
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prevNotes) => {
      const updated = prevNotes.filter((n) => n.id !== id);
      saveNotes(updated, activeProfileId);
      enqueueOfflineAction({
        type: "DELETE_NOTE",
        entityName: "notes",
        action: "delete",
        profileId: activeProfileId,
        payload: { id },
      });
      return updated;
    });
  };

  const handleUpdateFlashcardDecks = (updatedDecks: FlashcardDeck[]) => {
    setFlashcardDecks(updatedDecks);
    saveFlashcardDecks(updatedDecks, activeProfileId);
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
    enqueueOfflineAction({
      type: "UPDATE_HABIT",
      entityName: "habits",
      action: "create",
      profileId: activeProfileId,
      payload: created,
    });
  };

  const handleToggleHabitDate = (habitId: string, dateStr: string) => {
    let toggledHabit: Habit | null = null;
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const isDone = h.completedDates.includes(dateStr);
        const newDates = isDone
          ? h.completedDates.filter((d) => d !== dateStr)
          : [...h.completedDates, dateStr];

        // Calculate consecutive day streak up to today/yesterday
        const dateSet = new Set(newDates);
        let consecutiveStreak = 0;
        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);
        const formatLocal = (dt: Date) =>
          `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
        if (!dateSet.has(formatLocal(cursor))) {
          cursor.setDate(cursor.getDate() - 1);
        }
        while (dateSet.has(formatLocal(cursor))) {
          consecutiveStreak++;
          cursor.setDate(cursor.getDate() - 1);
        }

        const nextHabit: Habit = {
          ...h,
          completedDates: newDates,
          streak: consecutiveStreak,
        };
        toggledHabit = nextHabit;
        return nextHabit;
      }
      return h;
    });
    setHabits(updated);
    saveHabits(updated, activeProfileId);
    if (toggledHabit) {
      enqueueOfflineAction({
        type: "UPDATE_HABIT",
        entityName: "habits",
        action: "update",
        profileId: activeProfileId,
        payload: toggledHabit,
      });
    }
  };

  const handleUpdateHabit = (updatedHabit: Habit) => {
    const updated = habits.map((h) => (h.id === updatedHabit.id ? updatedHabit : h));
    setHabits(updated);
    saveHabits(updated, activeProfileId);
    enqueueOfflineAction({
      type: "UPDATE_HABIT",
      entityName: "habits",
      action: "update",
      profileId: activeProfileId,
      payload: updatedHabit,
    });
  };

  const handleDeleteHabit = (id: string) => {
    const updated = habits.filter((h) => h.id !== id);
    setHabits(updated);
    saveHabits(updated, activeProfileId);
    enqueueOfflineAction({
      type: "UPDATE_HABIT",
      entityName: "habits",
      action: "delete",
      profileId: activeProfileId,
      payload: { id },
    });
  };

  const handleUpdateWater = (newWater: WaterLog) => {
    setWater(newWater);
    saveWater(newWater, activeProfileId);
    enqueueOfflineAction({
      type: "UPDATE_WATER",
      entityName: "water",
      action: "update",
      profileId: activeProfileId,
      payload: newWater,
    });
  };

  const handleLogFocusSession = (log: Omit<FocusSessionLog, "id">) => {
    const created: FocusSessionLog = {
      ...log,
      id: "focus-" + Date.now(),
    };
    const updated = [created, ...focusLogs];
    setFocusLogs(updated);
    saveFocusSessions(updated, activeProfileId);
    enqueueOfflineAction({
      type: "LOG_FOCUS",
      entityName: "focus",
      action: "create",
      profileId: activeProfileId,
      payload: created,
    });
  };

  // Last User Prompt for Abya AI Retry
  const [lastUserPrompt, setLastUserPrompt] = useState<string>("");

  // Live Abya AI Provider Diagnostics State
  const [abyaDiagnostics, setAbyaDiagnostics] = useState<AbyaDiagnosticsInfo>({
    provider: "online_ai",
    activeModel: "gemini-3.7-flash",
    latencyMs: 0,
    lastStatus: "idle",
    lastFallbackReason: "none",
    isOnlineNetwork: typeof navigator !== "undefined" ? navigator.onLine : true,
    totalOnlineCalls: 0,
    totalFallbackCalls: 0,
    lastCheckedAt: Date.now(),
  });

  // Track network online/offline state for diagnostics
  useEffect(() => {
    const handleOnline = () => {
      setAbyaDiagnostics((prev) => ({
        ...prev,
        isOnlineNetwork: true,
        lastCheckedAt: Date.now(),
      }));
    };
    const handleOffline = () => {
      setAbyaDiagnostics((prev) => ({
        ...prev,
        isOnlineNetwork: false,
        lastStatus: "offline",
        lastCheckedAt: Date.now(),
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Diagnostic Ping / Test Function
  const handleTestAbyaDiagnostics = async () => {
    const start = Date.now();
    try {
      const res = await fetch("/api/ai/diagnostics");
      const data = await res.json();
      const latency = Date.now() - start;
      setAbyaDiagnostics((prev) => ({
        ...prev,
        provider: "online_ai",
        activeModel: data.defaultModel || "gemini-3.7-flash",
        latencyMs: latency,
        lastStatus: data.configured ? "online" : "fallback",
        lastFallbackReason: data.configured ? "none" : "api_error",
        isOnlineNetwork: true,
        lastCheckedAt: Date.now(),
        lastErrorDetails: data.configured ? undefined : "API key not configured in environment.",
      }));
    } catch (err: any) {
      const latency = Date.now() - start;
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      setAbyaDiagnostics((prev) => ({
        ...prev,
        latencyMs: latency,
        lastStatus: isOffline ? "offline" : "fallback",
        lastFallbackReason: isOffline ? "network_offline" : "api_error",
        isOnlineNetwork: !isOffline,
        lastCheckedAt: Date.now(),
        lastErrorDetails: err.message || "Failed to reach diagnostics endpoint",
      }));
    }
  };

  const handleUpdateAbyaLanguage = (lang: AbyaLanguageSetting) => {
    setAbyaLanguage(lang);
    saveAbyaLanguage(lang, activeStudent?.id);
  };

  // Abya AI Chat Messaging Handler
  // CRITICAL RULE: Online AI is ALWAYS the default provider.
  // Local Intelligence triggers ONLY on: Network offline, Request Timeout (>35s), Rate Limit (429), or API Failure.
  const handleSendAbyaMessage = async (
    prompt: string,
    contextNote?: string,
    actionType?: any,
    mode: AbyaAIMode = "standard",
    image?: { data: string; mimeType: string },
    curriculumContext?: {
      classLevel?: string;
      stream?: string;
      subject?: string;
      chapter?: string;
      topic?: string;
      modeType?: string;
    }
  ) => {
    if (isAbyaSubmittingRef.current) {
      console.warn("[Abya AI Client] Request already in progress. Ignoring duplicate submission.");
      return;
    }
    isAbyaSubmittingRef.current = true;
    const requestProfileId = activeProfileId;

    setLastUserPrompt(prompt);
    const userMsg: AbyaMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      mode,
      imageUrl: image ? `data:${image.mimeType};base64,${image.data}` : undefined,
      imageMimeType: image?.mimeType,
    };

    const newChatWithUser = [...abyaChat, userMsg];
    setAbyaChat(newChatWithUser);
    saveAbyaChat(newChatWithUser, requestProfileId);

    // Context payload
    const recentHistory = abyaChat.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    const requestPayload = {
      prompt,
      history: recentHistory,
      mode,
      image,
      contextNote,
      curriculumContext,
      abyaLanguage,
      studentProfileContext: {
        id: activeStudent?.id || "guest",
        name: activeStudent?.name || "Student",
        classLevel: activeStudent?.classLevel || "Class 12",
        stream: activeStudent?.stream || "Commerce",
        board: activeStudent?.board || "CBSE",
      },
      todayContext: {
        pendingTasksCount: tasks.filter((t) => !t.completed).length,
        completedTasksCount: tasks.filter((t) => t.completed).length,
      },
      careerContext: {
        stream: activeStudent?.stream || "Commerce",
        currentClass: activeStudent?.classLevel || "Class 12",
        targetCareer: careerRoadmap.careerTitle || careerProfile.selectedCareerId || "General",
        strongSubjects: careerAssessment.strongSubjects,
        roadmapProgress: Math.round(
          (careerRoadmap.milestones.filter((m) => m.completed).length /
            (careerRoadmap.milestones.length || 1)) *
            100
        ),
      },
      academicContext: {
        stream: activeStudent?.stream || "Commerce",
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
        board: activeStudent?.board || examProfile.board,
        classLevel: activeStudent?.classLevel || examProfile.classLevel,
        stream: activeStudent?.stream || examProfile.stream,
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
    let responseData: any = null;
    let fallbackReason: AbyaFallbackReason = "none";
    let failureDetail = "";

    // 1. Check if device is completely offline before calling network
    const isNetworkOffline = typeof navigator !== "undefined" && !navigator.onLine;
    if (isNetworkOffline) {
      fallbackReason = "network_offline";
      failureDetail = "Device is currently offline";
      console.warn("[Abya AI Client] Device is offline. Directing to Local Mentor Fallback.");
    } else {
      // 2. Primary: Online AI Invocation with retry logic
      const maxAttempts = 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000);

        try {
          console.log(`[Abya AI Client] Calling Online AI (attempt ${attempt}/${maxAttempts}, mode=${mode})...`);

          const idToken = await getValidClientAuthToken(requestProfileId);

          const reqHeaders: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (idToken) {
            reqHeaders["Authorization"] = `Bearer ${idToken}`;
          }

          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: reqHeaders,
            body: JSON.stringify(requestPayload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const data = await res.json();

          if (res.ok && data.text) {
            aiReplyText = data.text;
            responseData = data;
            console.log(`[Abya AI Client] Online AI response generated with ${data.modelUsed} in ${data.durationMs}ms.`);
            break;
          }

          if (res.status === 429 || data.code === "RATE_LIMITED") {
            fallbackReason = "rate_limited";
            failureDetail = "Rate limit reached on AI service";
            console.warn("[Abya AI Client] Online AI rate limited (429). Triggering fallback.");
            break;
          }

          if (res.status === 401 || data.code === "UNAUTHENTICATED" || data.code === "MISSING_API_KEY") {
            fallbackReason = "api_error";
            failureDetail = data.code === "UNAUTHENTICATED"
              ? "Sign in to your Garia OS account to access online Gemini AI. Using local offline mentor."
              : "API key unconfigured on server";
            console.warn("[Abya AI Client] Online AI unauthenticated or unconfigured. Triggering local mentor fallback.");
            break;
          }

          fallbackReason = "api_error";
          failureDetail = data.error || `Server returned ${res.status}`;
          throw new Error(failureDetail);
        } catch (err: any) {
          clearTimeout(timeoutId);
          const isAbort = err.name === "AbortError";
          if (isAbort) {
            fallbackReason = "timeout";
            failureDetail = "Online AI request timed out after 35s";
          } else if (!fallbackReason || fallbackReason === "none") {
            fallbackReason = "api_error";
            failureDetail = err?.message || "Network connection failure";
          }
          console.warn(`[Abya AI Client] Online AI attempt ${attempt} failed: ${failureDetail}`);

          if (attempt < maxAttempts && fallbackReason !== "rate_limited" && fallbackReason !== "timeout") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    }

    try {
      // Prepare module action context isolated to the profile that initiated the request
      const isStillSameProfile = activeProfileIdRef.current === requestProfileId;
      const noopSetter = () => {};
      const actionContext = {
        tasks: isStillSameProfile ? tasks : loadTasks(requestProfileId),
        setTasks: isStillSameProfile ? setTasks : noopSetter,
        notes: isStillSameProfile ? notes : loadNotes(requestProfileId),
        setNotes: isStillSameProfile ? setNotes : noopSetter,
        water: isStillSameProfile ? water : loadWater(requestProfileId),
        setWater: isStillSameProfile ? setWater : noopSetter,
        goals: isStillSameProfile ? goals : loadGoals(requestProfileId),
        setGoals: isStillSameProfile ? setGoals : noopSetter,
        activeStudentId: requestProfileId,
        onNavigate: isStillSameProfile ? handleNavigate : undefined,
        defaultSubject: academicSubjects[0]?.name || "General",
      };

      if (aiReplyText) {
        // Successful Online AI Response
        // 1. Check if AI embedded a structured action block
        const { cleanText, action: responseAction } = parseActionFromResponse(aiReplyText);
        // 2. Fallback to parsing direct student intent from prompt if model didn't output action tag
        const resolvedAction =
          responseAction ||
          parseActionFromPrompt(prompt, { defaultSubject: academicSubjects[0]?.name });

        let executedAction: AbyaExecutedAction | undefined = undefined;
        if (resolvedAction) {
          const actionResult = executeAbyaModuleAction(resolvedAction, actionContext);
          if (actionResult) {
            executedAction = actionResult;
          }
        }

        const modelMsg: AbyaMessage = {
          id: "model-" + Date.now(),
          role: "model",
          content: cleanText || aiReplyText,
          timestamp: Date.now(),
          mode: responseData?.modeUsed || mode,
          provider: "online_ai",
          modelUsed: responseData?.modelUsed || "gemini-3.8-flash",
          groundingSources: responseData?.groundingSources,
          thinkingDurationMs: responseData?.durationMs,
          isFallback: false,
          executedAction,
        };

        if (activeProfileIdRef.current === requestProfileId) {
          setAbyaChat((prev) => {
            const updated = [...prev, modelMsg];
            saveAbyaChat(updated, requestProfileId);
            return updated;
          });
        } else {
          const existing = loadAbyaChat(requestProfileId);
          saveAbyaChat([...existing, modelMsg], requestProfileId);
        }

        setAbyaDiagnostics((prev) => ({
          ...prev,
          provider: "online_ai",
          activeModel: responseData?.modelUsed || "gemini-3.8-flash",
          latencyMs: responseData?.durationMs || 0,
          lastStatus: "online",
          lastFallbackReason: "none",
          totalOnlineCalls: prev.totalOnlineCalls + 1,
          lastCheckedAt: Date.now(),
          lastErrorDetails: undefined,
        }));
      } else {
        // Graceful Local Intelligence Fallback
        const activeStudentData = {
          profile: isStillSameProfile
            ? activeStudent
            : profiles.find((p) => p.id === requestProfileId) || activeStudent,
          tasks: actionContext.tasks,
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

        // Check for direct module action in student prompt for offline/fallback mode
        const promptAction = parseActionFromPrompt(prompt, {
          defaultSubject: academicSubjects[0]?.name,
        });

        let executedAction: AbyaExecutedAction | undefined = undefined;
        let fallbackContent = "";

        if (promptAction) {
          const actionResult = executeAbyaModuleAction(promptAction, actionContext);
          if (actionResult) {
            executedAction = actionResult;
            if (actionResult.type === "create_task") {
              fallbackContent = `Bilkul ${activeStudent?.name || "Student"}! Maine to-do list me naya task add kar diya hai: **${actionResult.details?.title}** (${actionResult.details?.subject || "General"}). Tum isko Task Manager me dekh sakte ho!`;
            } else if (actionResult.type === "create_note") {
              fallbackContent = `Done ${activeStudent?.name || "Student"}! Naya study note create ho gaya hai: **${actionResult.details?.title}**. Isko Notes section me dekh sakte ho.`;
            } else if (actionResult.type === "log_water") {
              fallbackContent = `Bahut badhiya ${activeStudent?.name || "Student"}! 💧 Water log update kar diya hai (${actionResult.details?.glasses}/${actionResult.details?.goal} glasses today). Hydration study focus ke liye bohot zaroori hai!`;
            } else if (actionResult.type === "create_goal") {
              fallbackContent = `Target set ${activeStudent?.name || "Student"}! 🎯 Naya study goal add kar diya hai: **${actionResult.details?.title}** (Target: ${actionResult.details?.targetDate}).`;
            } else if (actionResult.type === "navigate_module") {
              fallbackContent = `Chalo, ${actionResult.module} open kar diya hai!`;
            }
          }
        }

        if (!fallbackContent) {
          fallbackContent = generateAbyaFallbackResponse(
            actionType || "general",
            prompt,
            activeStudentData
          );
        }

        const modelMsg: AbyaMessage = {
          id: "model-" + Date.now(),
          role: "model",
          content: fallbackContent,
          timestamp: Date.now(),
          provider: "local_fallback",
          modelUsed: "Local Mentor Engine",
          isFallback: true,
          fallbackReason: fallbackReason || "api_error",
          executedAction,
        };

        if (activeProfileIdRef.current === requestProfileId) {
          setAbyaChat((prev) => {
            const updated = [...prev, modelMsg];
            saveAbyaChat(updated, requestProfileId);
            return updated;
          });
        } else {
          const existing = loadAbyaChat(requestProfileId);
          saveAbyaChat([...existing, modelMsg], requestProfileId);
        }

        setAbyaDiagnostics((prev) => ({
          ...prev,
          lastStatus: isNetworkOffline ? "offline" : "fallback",
          lastFallbackReason: fallbackReason || "api_error",
          totalFallbackCalls: prev.totalFallbackCalls + 1,
          lastCheckedAt: Date.now(),
          lastErrorDetails: failureDetail,
        }));
      }
    } catch (e: any) {
      console.error("[Abya AI Client] Error processing chat response:", e);
      const errorMsg: AbyaMessage = {
        id: "error-" + Date.now(),
        role: "model",
        content: "Abya Mentor se connect nahi ho paya. Kripya thodi der me dobara try karein!",
        timestamp: Date.now(),
        isError: true,
        provider: "local_fallback",
        fallbackReason: "api_error",
      };
      if (activeProfileIdRef.current === requestProfileId) {
        setAbyaChat((prev) => {
          const updated = [...prev, errorMsg];
          saveAbyaChat(updated, requestProfileId);
          return updated;
        });
      } else {
        const existing = loadAbyaChat(requestProfileId);
        saveAbyaChat([...existing, errorMsg], requestProfileId);
      }
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
      lastUserPrompt || "Study guidance",
      activeStudentData
    );

    const fallbackMsg: AbyaMessage = {
      id: "fallback-" + Date.now(),
      role: "model",
      content: fallbackContent,
      timestamp: Date.now(),
      provider: "local_fallback",
      modelUsed: "Local Mentor Engine",
      isFallback: true,
      fallbackReason: "none",
    };

    const updated = [...abyaChat, fallbackMsg];
    setAbyaChat(updated);
    saveAbyaChat(updated, activeProfileId);
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
    saveAbyaChat(initial, activeProfileId);
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
    saveGoals(updated, activeProfileId);
    enqueueOfflineAction({
      type: "UPDATE_GOAL",
      entityName: "goals",
      action: "create",
      profileId: activeProfileId,
      payload: created,
    });
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    const updated = goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    setGoals(updated);
    saveGoals(updated, activeProfileId);
    enqueueOfflineAction({
      type: "UPDATE_GOAL",
      entityName: "goals",
      action: "update",
      profileId: activeProfileId,
      payload: updatedGoal,
    });
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveGoals(updated, activeProfileId);
    enqueueOfflineAction({
      type: "UPDATE_GOAL",
      entityName: "goals",
      action: "delete",
      profileId: activeProfileId,
      payload: { id },
    });
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
    saveCalendarEvents(updated, activeProfileId);
    enqueueOfflineAction({
      type: "UPDATE_EVENT",
      entityName: "calendar_events",
      action: "create",
      profileId: activeProfileId,
      payload: created,
    });
  };

  const handleUpdateCalendarEvent = (updatedEvent: CalendarEvent) => {
    const updated = calendarEvents.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
    setCalendarEvents(updated);
    saveCalendarEvents(updated, activeProfileId);
    enqueueOfflineAction({
      type: "UPDATE_EVENT",
      entityName: "calendar_events",
      action: "update",
      profileId: activeProfileId,
      payload: updatedEvent,
    });
  };

  const handleDeleteCalendarEvent = (id: string) => {
    const updated = calendarEvents.filter((e) => e.id !== id);
    setCalendarEvents(updated);
    saveCalendarEvents(updated, activeProfileId);
    enqueueOfflineAction({
      type: "UPDATE_EVENT",
      entityName: "calendar_events",
      action: "delete",
      profileId: activeProfileId,
      payload: { id },
    });
  };

  const handleClearAllOSData = () => {
    clearAllData();
    setProfiles([]);
    setActiveProfileId("");
    setTasks([]);
    setSubjects([]);
    setStudySessions([]);
    setNotes([]);
    setFlashcardDecks([]);
    setHabits([]);
    setWater({ date: getTodayString(), glasses: 0, goal: 8 });
    setFocusLogs([]);
    setGoals([]);
    setCalendarEvents([]);
    setAbyaChat([]);
  };

  const handleClearStudentWorkspace = () => {
    const targetProfId = loadActiveProfileId() || activeProfileId;
    if (!targetProfId) return;
    clearStudentWorkspaceData(targetProfId);
    reloadAllDataForProfile(targetProfId);
  };

  const handleReloadData = () => {
    const targetProfId = loadActiveProfileId() || activeProfileId;
    if (targetProfId) {
      reloadAllDataForProfile(targetProfId);
    }
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
        Boolean(profSettings.account.passwordHash) &&
        profSettings.account.passwordHash === hashed
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
    <div
      className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] transition-[height] duration-150 ease-out overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: visualViewportHeight ? `${visualViewportHeight}px` : "100dvh",
        maxHeight: visualViewportHeight && isKeyboardOpen ? `${visualViewportHeight}px` : undefined,
      }}
    >
      {/* Mobile Swipe-to-Navigate Gesture Feedback Indicator */}
      {swipeFeedback && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-emerald-300 text-xs font-bold border border-emerald-500/30 backdrop-blur-md shadow-2xl flex items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <span>{swipeFeedback.direction === "left" ? "→" : "←"}</span>
          <span className="capitalize">{swipeFeedback.targetTab}</span>
        </div>
      )}
      {/* Top OS Bar (Hidden during Note Editor Focus Mode) */}
      {!(isNoteFocusMode && activeTab === "notes") && (
        <StatusBar
          settings={settings}
          activeStudent={activeStudent}
          profiles={profiles}
          onSwitchProfile={handleSwitchProfile}
          onLogout={() => setIsStudentModalOpen(true)}
          tasks={tasks}
          goals={goals}
          habits={habits}
          currentLanguage={currentLanguage}
          onUpdateLanguage={handleUpdateLanguage}
          onOpenProfile={() => {
            handleNavigate("settings");
            setIsMoreMenuOpen(false);
          }}
          onOpenStudentModal={() => setIsStudentModalOpen(true)}
          onOpenMoreMenu={() => setIsMoreMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onGoBack={handleGoBack}
          onUpdateSettings={handleUpdateSettings}
          onNavigate={(tab) => {
            handleNavigate(tab);
            setIsMoreMenuOpen(false);
          }}
          activeTab={activeTab}
        />
      )}

      <div className="flex-1 flex max-w-7xl w-full mx-auto min-h-0">
        {/* Main Content Stage */}
        <main
          className={`flex-1 min-w-0 ${
            activeTab === "abya"
              ? "p-2 sm:p-4 lg:p-6 pb-8 flex flex-col min-h-0"
              : "p-3 sm:p-6 lg:p-8 pb-12"
          }`}
        >
          <ErrorBoundary>
            <Suspense fallback={<PageSkeletonLoader tabName={activeTab} />}>
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
                examTestRecords={examTestRecords}
                examProfile={examProfile}
                careerProfile={careerProfile}
                settings={settings}
                activeStudent={activeStudent}
                currentLanguage={currentLanguage}
                onUpdateLanguage={handleUpdateLanguage}
                onNavigate={(tab) => {
                  handleNavigate(tab);
                  setIsMoreMenuOpen(false);
                }}
                onQuickAddTask={() => handleNavigate("tasks")}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onAddNote={handleAddNote}
                onAddHabit={handleAddHabit}
                onAddGoal={handleAddGoal}
                onLogFocusSession={handleLogFocusSession}
                onUpdateSettings={handleUpdateSettings}
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
                onOpenMoreMenu={() => setIsMoreMenuOpen(true)}
                onOpenSearch={() => setIsSearchOpen(true)}
              />
            )}

            {activeTab === "tasks" && (
              <TaskManager
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onBulkDeleteTasks={handleBulkDeleteTasks}
                onStartFocusForTask={() => handleNavigate("focus")}
                onBack={handleGoBack}
                currentUserId={activeStudent?.id || "guest"}
                currentUserName={activeStudent?.name || "Student"}
                currentUserEmail={auth.currentUser?.email || undefined}
              />
            )}

            {activeTab === "goals" && (
              <GoalsPage
                goals={goals}
                subjects={subjects}
                onAddGoal={handleAddGoal}
                onUpdateGoal={handleUpdateGoal}
                onDeleteGoal={handleDeleteGoal}
                onBack={handleGoBack}
              />
            )}

            {activeTab === "calendar" && (
              <CalendarPage
                events={calendarEvents}
                tasks={tasks}
                studySessions={studySessions}
                goals={goals}
                activeProfile={activeStudent}
                onAddEvent={handleAddCalendarEvent}
                onUpdateEvent={handleUpdateCalendarEvent}
                onDeleteEvent={handleDeleteCalendarEvent}
                onToggleTaskComplete={handleUpdateTask}
                onBack={handleGoBack}
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
                  handleNavigate(tab);
                  setIsMoreMenuOpen(false);
                }}
                onBack={handleGoBack}
              />
            )}

            {activeTab === "career" && (
              <CareerCenterPage
                profile={careerProfile}
                assessment={careerAssessment}
                roadmap={careerRoadmap}
                quizAnswers={careerQuiz}
                activeStudentName={activeStudent?.name || "Student"}
                subjects={subjects}
                onUpdateProfile={handleUpdateCareerProfile}
                onUpdateAssessment={handleUpdateCareerAssessment}
                onUpdateRoadmap={handleUpdateCareerRoadmap}
                onUpdateQuiz={handleUpdateCareerQuiz}
                onNavigateToAbya={() => handleNavigate("abya")}
                onBack={handleGoBack}
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
                onBack={handleGoBack}
              />
            )}

            {activeTab === "focus" && (
              <FocusTimer
                settings={settings}
                focusLogs={focusLogs}
                onLogFocusSession={handleLogFocusSession}
                tasks={tasks}
                onToggleTask={(task) =>
                  handleUpdateTask({ ...task, completed: !task.completed })
                }
                onAddTask={handleAddTask}
                onBack={handleGoBack}
              />
            )}

            {activeTab === "notes" && (
              <NotesPage
                notes={notes}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                onAskAbyaWithContext={handleAskAbyaWithContext}
                onBack={handleGoBack}
                onFocusModeChange={setIsNoteFocusMode}
                currentUserId={activeStudent?.id || "guest"}
                currentUserName={activeStudent?.name || "Student"}
                currentUserEmail={auth.currentUser?.email || undefined}
              />
            )}

            {activeTab === "flashcards" && (
              <FlashcardsPage
                decks={flashcardDecks}
                subjects={subjects}
                academicSubjects={academicSubjects}
                onUpdateDecks={handleUpdateFlashcardDecks}
                onBack={handleGoBack}
              />
            )}

            {activeTab === "water" && (
              <WaterTracker
                water={water}
                onUpdateWater={handleUpdateWater}
                onBack={handleGoBack}
              />
            )}

            {activeTab === "habits" && (
              <HabitsPage
                habits={habits}
                onAddHabit={handleAddHabit}
                onUpdateHabit={handleUpdateHabit}
                onToggleHabitDate={handleToggleHabitDate}
                onDeleteHabit={handleDeleteHabit}
                onBack={handleGoBack}
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
                  handleNavigate(tab);
                  setIsMoreMenuOpen(false);
                }}
                onTriggerFallbackAction={handleTriggerAbyaFallback}
                onRetryLastMessage={handleRetryLastMessage}
                diagnostics={abyaDiagnostics}
                onTestDiagnostics={handleTestAbyaDiagnostics}
                onBack={handleGoBack}
                tasks={tasks}
                academicSubjects={academicSubjects}
                academicChapters={academicChapters}
                academicRevisions={academicRevisions}
                academicPractice={academicPractice}
                examProfile={examProfile}
                habits={habits}
                studySessions={studySessions}
                focusLogs={focusLogs}
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
                activeStudent={activeStudent}
                academicSubjects={academicSubjects}
                academicChapters={academicChapters}
                vviTopics={vviTopics}
                academicRevisions={academicRevisions}
                academicPractice={academicPractice}
                examTestRecords={examTestRecords}
                onNavigate={(tab: any) => {
                  handleNavigate(tab as ActiveTab);
                  setIsMoreMenuOpen(false);
                }}
                onBack={handleGoBack}
              />
            )}

            {activeTab === "settings" && (
              <SettingsPage
                settings={settings}
                activeStudent={activeStudent}
                profiles={profiles}
                tasks={tasks}
                studySessions={studySessions}
                events={calendarEvents}
                goals={goals}
                currentLanguage={currentLanguage}
                onUpdateLanguage={handleUpdateLanguage}
                abyaLanguage={abyaLanguage}
                onUpdateAbyaLanguage={handleUpdateAbyaLanguage}
                onOpenStudentModal={() => setIsStudentModalOpen(true)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onNavigate={(tab) => handleNavigate(tab)}
                onUpdateSettings={handleUpdateSettings}
                onClearChatHistory={handleClearChatHistory}
                onClearStudentData={handleClearStudentWorkspace}
                onClearAllOSData={handleClearAllOSData}
                onReloadData={handleReloadData}
                onBack={handleGoBack}
                onLockApp={() => {
                  lockSession(activeProfileId);
                  setIsAppLocked(true);
                }}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </main>
      </div>

      {/* More Apps & Modules Slide Drawer (V3) */}
      <MoreDrawer
        isOpen={isMoreMenuOpen}
        currentLanguage={currentLanguage}
        onUpdateLanguage={handleUpdateLanguage}
        onClose={() => setIsMoreMenuOpen(false)}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        onNavigate={(tab) => {
          handleNavigate(tab);
          setIsMoreMenuOpen(false);
        }}
        activeTab={activeTab}
        activeStudent={activeStudent}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClearAllData={handleClearAllOSData}
      />

      {/* Quick Search Overlay (Cmd+K / Search trigger) */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => {
          handleNavigate(tab);
          setIsSearchOpen(false);
        }}
        activeStudent={activeStudent}
      />

      {/* Multi-Student Profile Management Modal (v1.5) */}
      <StudentProfileModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        profiles={profiles}
        activeProfile={activeProfileId ? profiles.find((p) => p.id === activeProfileId) || activeStudent : activeStudent}
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
        onReloadData={handleReloadData}
      />

      {/* Real-Time Offline Queue Firestore Flush Toast Notification */}
      <OfflineSyncToast currentLanguage={currentLanguage} />

      {/* Full-Screen PIN Lock Gate Overlay */}
      {isAppLocked && settings.security?.enabled && settings.security?.pinHash && (
        <PinLockScreen
          settings={settings}
          activeStudent={activeStudent}
          studentName={activeStudent?.name || settings.userName}
          onUnlocked={() => {
            markSessionUnlocked(activeProfileId);
            setIsAppLocked(false);
          }}
          onUnlockSuccess={() => {
            markSessionUnlocked(activeProfileId);
            setIsAppLocked(false);
          }}
          onUpdateSettings={handleUpdateSettings}
        />
      )}
    </div>
  );
}
