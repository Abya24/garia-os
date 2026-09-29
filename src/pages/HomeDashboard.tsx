import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Flag,
  Tag,
  BookOpen,
  CheckCircle2,
  LayoutGrid,
  ArrowRight,
  FileText,
  X,
  Pin,
  Target,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  Task,
  Subject,
  StudySession,
  FocusSessionLog,
  Note,
  Habit,
  WaterLog,
  UserSettings,
  ActiveTab,
  Goal,
  CalendarEvent,
  StudentProfile,
  ExamTestRecord,
  ExamProfile,
  CareerProfile,
  Priority,
  TaskCategory,
  AcademicChapter,
} from "../types";
import {
  getTodayString,
  loadAcademicSubjects,
  loadAcademicChapters,
  loadVVITopics,
  loadAcademicRevisions,
  loadAcademicPractice,
  loadNotes,
  saveNotes,
} from "../utils/storage";
import { calculateGamificationState } from "../utils/gamificationEngine";
import { generateExamIntelligenceReport } from "../utils/examIntelligenceEngine";
import { AppLanguage, translations } from "../utils/i18n";
import { getTimeOfDayGreeting } from "../utils/dateTimeUtils";
import {
  fetchDailyQuote,
  fetchNextQuote,
  getMorningDateKey,
  MOTIVATIONAL_QUOTES,
  MotivationalQuote,
} from "../utils/quotes";
import { HeroSection } from "../components/home/sections/HeroSection";
import { QuickActionsWidget } from "../components/home/widgets/QuickActionsWidget";
import { DailyMotivation } from "../components/home/widgets/DailyMotivation";
import { StudyStreakSummaryWidget } from "../components/home/widgets/StudyStreakSummaryWidget";
import { FocusSessionSummaryWidget } from "../components/home/widgets/FocusSessionSummaryWidget";
import { DailyAcademicInsightCard } from "../components/home/widgets/DailyAcademicInsightCard";
import { DailyExecutionSection } from "../components/home/sections/DailyExecutionSection";
import { AcademicDecisionEngineSection } from "../components/home/sections/AcademicDecisionEngineSection";
import { WellnessSection } from "../components/home/sections/WellnessSection";

interface HomeDashboardProps {
  tasks: Task[];
  subjects: Subject[];
  studySessions?: StudySession[];
  focusLogs?: FocusSessionLog[];
  academicChapters?: AcademicChapter[];
  notes: Note[];
  habits: Habit[];
  water: WaterLog;
  goals?: Goal[];
  events?: CalendarEvent[];
  examTestRecords?: ExamTestRecord[];
  examProfile?: ExamProfile;
  careerProfile?: CareerProfile;
  settings: UserSettings;
  activeStudent?: StudentProfile;
  currentLanguage?: AppLanguage;
  onUpdateLanguage?: (lang: AppLanguage) => void;
  onNavigate: (tab: ActiveTab) => void;
  onQuickAddTask?: () => void;
  onAddTask?: (task: Omit<Task, "id" | "createdAt">) => void;
  onAddNote?: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateSettings?: (settings: UserSettings) => void;
  onAddWaterGlass: () => void;
  onRemoveWaterGlass?: () => void;
  onToggleTask?: (task: Task) => void;
  onToggleHabit?: (habitId: string, dateStr: string) => void;
  onOpenSliderMenu?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  tasks,
  subjects,
  studySessions = [],
  focusLogs = [],
  academicChapters: propAcademicChapters,
  notes,
  habits,
  water,
  goals = [],
  events = [],
  examTestRecords = [],
  examProfile,
  careerProfile,
  settings,
  activeStudent,
  currentLanguage = "en",
  onUpdateLanguage,
  onNavigate,
  onQuickAddTask,
  onAddTask,
  onAddNote,
  onUpdateSettings,
  onAddWaterGlass,
  onRemoveWaterGlass,
  onToggleTask,
  onToggleHabit,
  onOpenSliderMenu,
}) => {
  const todayStr = getTodayString();
  const t = translations[currentLanguage] || translations.en;

  // Academic Dataset for Decision Engine & Daily Academic Insight Card
  const academicSubjects = useMemo(
    () => loadAcademicSubjects(activeStudent?.stream, activeStudent?.id, activeStudent?.classLevel),
    [activeStudent?.stream, activeStudent?.id, activeStudent?.classLevel]
  );
  const [storedAcademicChapters, setStoredAcademicChapters] = useState<AcademicChapter[]>(() =>
    loadAcademicChapters(activeStudent?.id)
  );
  useEffect(() => {
    setStoredAcademicChapters(loadAcademicChapters(activeStudent?.id));
  }, [activeStudent?.id]);

  const academicChapters = useMemo(
    () =>
      Array.isArray(propAcademicChapters) && propAcademicChapters.length > 0
        ? propAcademicChapters
        : storedAcademicChapters,
    [propAcademicChapters, storedAcademicChapters]
  );
  const vviTopics = useMemo(
    () => loadVVITopics(activeStudent?.id),
    [activeStudent?.id]
  );
  const academicRevisions = useMemo(
    () => loadAcademicRevisions(activeStudent?.id),
    [activeStudent?.id]
  );
  const academicPractice = useMemo(
    () => loadAcademicPractice(activeStudent?.id),
    [activeStudent?.id]
  );

  // Live Clock & Date State
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Motivational Quote
  const morningDateKey = getMorningDateKey(currentDateTime);
  const [quoteIndex, setQuoteIndex] = useState<number>(() => {
    const daily = fetchDailyQuote(getMorningDateKey(new Date()));
    const idx = MOTIVATIONAL_QUOTES.findIndex((q) => q.id === daily.id);
    return idx >= 0 ? idx : 0;
  });

  // Automatically update to the fresh morning quote when a new day starts
  useEffect(() => {
    const daily = fetchDailyQuote(morningDateKey);
    const idx = MOTIVATIONAL_QUOTES.findIndex((q) => q.id === daily.id);
    if (idx >= 0) {
      setQuoteIndex(idx);
    }
  }, [morningDateKey]);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => fetchNextQuote(prev).index);
  };

  const handleQuoteUpdated = (updatedQuote: MotivationalQuote) => {
    const idx = MOTIVATIONAL_QUOTES.findIndex((q) => q.id === updatedQuote.id);
    if (idx >= 0 && idx !== quoteIndex) {
      setQuoteIndex(idx);
    }
  };

  const activeQuote: MotivationalQuote = MOTIVATIONAL_QUOTES[quoteIndex] || MOTIVATIONAL_QUOTES[0];

  // Dynamic Greeting based on time of day via centralized utility
  const displayGreeting = getTimeOfDayGreeting(currentDateTime, currentLanguage === "hi" ? "hi" : "en");

  const formattedDate = currentDateTime.toLocaleDateString(
    currentLanguage === "hi" ? "hi-IN" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const formattedTime = currentDateTime.toLocaleTimeString(
    currentLanguage === "hi" ? "hi-IN" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }
  );

  // Productivity Score Calculation
  const gamification = useMemo(() => {
    return calculateGamificationState(
      activeStudent,
      tasks || [],
      studySessions || [],
      focusLogs || [],
      habits || [],
      goals || [],
      examTestRecords || [],
      [],
      undefined
    );
  }, [activeStudent, tasks, studySessions, focusLogs, habits, goals, examTestRecords]);

  // Today's tasks filtering
  const todaysTasks = useMemo(() => {
    return tasks.filter((task) => task.date === todayStr);
  }, [tasks, todayStr]);

  const completedTodayCount = todaysTasks.filter((t) => t.completed).length;
  const taskCompletionRate = todaysTasks.length > 0
    ? Math.round((completedTodayCount / todaysTasks.length) * 100)
    : 100;

  // Exam Intelligence Report
  const examReport = useMemo(() => {
    if (!activeStudent) return null;
    return generateExamIntelligenceReport(
      activeStudent,
      examProfile,
      examTestRecords || [],
      [],
      [],
      [],
      [],
      [],
      careerProfile
    );
  }, [activeStudent, examProfile, examTestRecords, careerProfile]);

  // Focus time today
  const todayFocusMinutes = useMemo(() => {
    return focusLogs
      .filter((l) => l.date === todayStr && l.type === "focus")
      .reduce((acc, l) => acc + l.durationMinutes, 0);
  }, [focusLogs, todayStr]);

  // Total Study Minutes today (Study sessions + Focus sessions)
  const todayStudyMinutes = useMemo(() => {
    const studySecs = (studySessions || [])
      .filter((s) => s.date === todayStr)
      .reduce((acc, s) => acc + s.durationSeconds, 0);
    return Math.round(studySecs / 60) + todayFocusMinutes;
  }, [studySessions, todayFocusMinutes, todayStr]);

  // Direct Quick Task Input State on HomeDashboard
  const [quickTaskTitle, setQuickTaskTitle] = useState<string>("");
  const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>("medium");
  const [quickTaskCategory, setQuickTaskCategory] = useState<TaskCategory>("study");
  const [quickTaskSubjectId, setQuickTaskSubjectId] = useState<string>("");
  const [quickTaskAddedFeedback, setQuickTaskAddedFeedback] = useState<boolean>(false);

  // Available subjects for Quick Assign dropdown
  const availableSubjects = useMemo(() => {
    if (Array.isArray(subjects) && subjects.length > 0) {
      return subjects.map((s) => ({ id: s.id, name: s.name }));
    }
    if (Array.isArray(academicSubjects) && academicSubjects.length > 0) {
      return academicSubjects.map((s) => ({ id: s.id, name: s.name }));
    }
    return [
      { id: "sub-1", name: "Accountancy" },
      { id: "sub-2", name: "Economics" },
      { id: "sub-3", name: "Business Studies" },
    ];
  }, [subjects, academicSubjects]);

  const handleDirectQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTaskTitle.trim();
    if (!trimmed) return;

    const assignedSubject = availableSubjects.find(
      (s) => s.id === quickTaskSubjectId
    );

    if (onAddTask) {
      onAddTask({
        title: trimmed,
        description: "",
        date: todayStr,
        priority: quickTaskPriority,
        category: quickTaskCategory,
        completed: false,
        subjectId: assignedSubject?.id,
        subjectName: assignedSubject?.name,
      });
      setQuickTaskTitle("");
      setQuickTaskAddedFeedback(true);
      setTimeout(() => setQuickTaskAddedFeedback(false), 2500);
    } else if (onQuickAddTask) {
      onQuickAddTask();
    }
  };

  // Focus Mode State (from Settings)
  const isFocusMode = Boolean(settings?.focusMode);

  // Floating Quick-Add Note Modal State
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState<boolean>(false);
  const [quickNoteTitle, setQuickNoteTitle] = useState<string>("");
  const [quickNoteContent, setQuickNoteContent] = useState<string>("");
  const [quickNotePinned, setQuickNotePinned] = useState<boolean>(false);
  const [quickNoteTag, setQuickNoteTag] = useState<string>("Idea");
  const [localCapturedNotes, setLocalCapturedNotes] = useState<Note[]>([]);
  const [quickNoteSavedFeedback, setQuickNoteSavedFeedback] = useState<string | null>(null);

  const combinedNotes = useMemo(() => {
    const incoming = Array.isArray(notes) ? notes : [];
    const existingIds = new Set(incoming.map((n) => n.id));
    const uniqueLocal = localCapturedNotes.filter((n) => !existingIds.has(n.id));
    return [...uniqueLocal, ...incoming];
  }, [notes, localCapturedNotes]);

  const handleSaveQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    const rawTitle = quickNoteTitle.trim();
    const rawContent = quickNoteContent.trim();
    if (!rawTitle && !rawContent) return;

    const resolvedTitle =
      rawTitle ||
      rawContent.split("\n")[0].slice(0, 48).trim() ||
      `Quick Idea (${todayStr})`;
    const resolvedContent = rawContent || rawTitle;

    const newNotePayload: Omit<Note, "id" | "createdAt" | "updatedAt"> = {
      title: resolvedTitle,
      content: resolvedContent,
      pinned: quickNotePinned,
      tags: [quickNoteTag],
    };

    const createdNote: Note = {
      ...newNotePayload,
      id: "note-" + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setLocalCapturedNotes((prev) => [createdNote, ...prev]);

    if (onAddNote) {
      onAddNote(newNotePayload);
    } else {
      const existing = loadNotes(activeStudent?.id);
      saveNotes([createdNote, ...existing], activeStudent?.id);
    }

    setQuickNoteTitle("");
    setQuickNoteContent("");
    setQuickNotePinned(false);
    setIsQuickNoteModalOpen(false);
    setQuickNoteSavedFeedback(`Saved "${resolvedTitle}" to Notes`);
    setTimeout(() => setQuickNoteSavedFeedback(null), 3500);
  };

  return (
    <div
      id="home-dashboard-root"
      data-focus-mode={isFocusMode ? "true" : "false"}
      className="space-y-7 pb-4 md:pb-0 animate-in fade-in duration-200 max-w-6xl mx-auto w-full relative"
    >
      {/* ========================================================================= */}
      {/* FOCUS MODE ACTIVE BANNER (When Focus Mode is enabled in Settings)         */}
      {/* ========================================================================= */}
      {isFocusMode && (
        <section
          id="home-focus-mode-active-banner"
          data-testid="focus-mode-banner"
          aria-label="Focus Mode Active"
          className="glass-card rounded-3xl p-4 sm:p-5 border border-indigo-500/40 bg-gradient-to-r from-indigo-950/50 via-slate-900/95 to-emerald-950/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-heading text-white">
                  {currentLanguage === "hi"
                    ? "फोकस मोड सक्रिय (Distraction-Free Study Mode)"
                    : "Focus Mode Active — Distraction-Free Dashboard"}
                </h2>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  Essential Widgets Only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentLanguage === "hi"
                  ? "गैर-जरूरी विजेट (प्रेरणा कोट्स, त्वरित लिंक, विस्तारित एनालिटिक्स और वेलनेस) छिपा दिए गए हैं।"
                  : "Non-essential widgets (Motivation Quotes, Quick Actions, Career/Decision Cards, and Wellness) are hidden to keep you focused."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("focus")}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
            >
              {currentLanguage === "hi" ? "फोकस टाइमर" : "Open Focus Timer"}
            </button>
            <button
              type="button"
              id="home-exit-focus-mode-btn"
              onClick={() => {
                if (onUpdateSettings) {
                  onUpdateSettings({ ...settings, focusMode: false });
                } else {
                  onNavigate("settings");
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentLanguage === "hi" ? "फोकस मोड बंद करें" : "Exit Focus Mode"}</span>
            </button>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: HERO AREA (Hidden when Focus Mode is enabled)                  */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <HeroSection
          activeStudent={activeStudent}
          settings={settings}
          gamification={gamification}
          examReport={examReport}
          examProfile={examProfile}
          activeQuote={activeQuote}
          onNextQuote={handleNextQuote}
          formattedTime={formattedTime}
          formattedDate={formattedDate}
          displayGreeting={displayGreeting}
          currentLanguage={currentLanguage}
          onUpdateLanguage={onUpdateLanguage}
          todaysCompletedTasksCount={completedTodayCount}
          todaysTotalTasksCount={todaysTasks.length}
          todayStudyMinutes={todayStudyMinutes}
          todayHabitsCompletedCount={
            habits.filter((h) => h.completedDates?.includes(todayStr)).length
          }
          totalHabitsCount={habits.length}
          onNavigate={onNavigate}
          onOpenSliderMenu={onOpenSliderMenu}
        />
      )}

      {/* ========================================================================= */}
      {/* RESPONSIVE OVERVIEW GRID:                                                 */}
      {/* 1. Daily Motivation Widget (Hidden in Focus Mode)                         */}
      {/* 2. Total Study Hours & Streak Summary Widget                              */}
      {/* 3. Compact Focus Session Summary Widget                                   */}
      {/* ========================================================================= */}
      <section
        id="home-dashboard-overview-section"
        aria-label="Daily Overview Grid"
        className="space-y-3"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white">
              {currentLanguage === "hi"
                ? "दैनिक अवलोकन (प्रेरणा, अध्ययन घंटे व फोकस)"
                : "Daily Overview"}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {isFocusMode
              ? "Study Hours · Focus Timer"
              : "Mindset · Study Hours · Focus Timer"}
          </span>
        </div>

        <div
          id="home-dashboard-overview-grid"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        >
          {/* 1. Daily Motivation & Morning Affirmation Widget (Hidden in Focus Mode) */}
          {!isFocusMode && (
            <DailyMotivation
              profileId={activeStudent?.id}
              studentName={activeStudent?.name || settings.userName}
              currentLanguage={currentLanguage}
              activeQuote={activeQuote}
              morningDateKey={morningDateKey}
              onQuoteUpdated={handleQuoteUpdated}
              className="lg:col-span-12"
            />
          )}

          {/* 2. Study Streak & Total Study Hours This Week Widget */}
          <StudyStreakSummaryWidget
            studySessions={studySessions}
            studentName={activeStudent?.name || settings.userName}
            currentLanguage={currentLanguage}
            todayTotalStudyMinutes={todayStudyMinutes}
            dailyTargetMinutes={(examProfile?.dailyStudyHours || 3) * 60}
            onNavigate={onNavigate}
            className="lg:col-span-7 h-full"
          />

          {/* 3. Compact Focus Session Summary Widget */}
          <FocusSessionSummaryWidget
            focusLogs={focusLogs}
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
            className="lg:col-span-5 h-full"
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DAILY ACADEMIC INSIGHT CARD (Based on user's 'isWeak' chapter status)     */}
      {/* ========================================================================= */}
      <DailyAcademicInsightCard
        academicChapters={academicChapters}
        academicSubjects={academicSubjects}
        subjects={subjects}
        profileId={activeStudent?.id}
        currentLanguage={currentLanguage}
        onNavigate={onNavigate}
        onAddTask={onAddTask}
        onChaptersChange={(updated) => setStoredAcademicChapters(updated)}
      />

      {/* ========================================================================= */}
      {/* DIRECT QUICK TASK INPUT FIELD ON HOMEDASHBOARD                            */}
      {/* Allows adding tasks directly without navigating to full TaskManager       */}
      {/* ========================================================================= */}
      <section
        id="home-quick-task-widget"
        aria-label="Quick Task Creation"
        className="glass-card rounded-3xl p-4 sm:p-5 border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-emerald-950/20 shadow-lg space-y-3"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-heading text-white">
                {currentLanguage === "hi"
                  ? "त्वरित कार्य जोड़ें (Quick Task)"
                  : "Quick Task — Add to Today's Schedule"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {quickTaskAddedFeedback && (
              <span
                id="home-quick-task-feedback"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Task added to Today ✓</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>
                {currentLanguage === "hi" ? "सभी कार्य देखें" : "Full Task Manager"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <form
          id="home-quick-task-form"
          onSubmit={handleDirectQuickAddTask}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="relative flex-1">
            <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
            <input
              id="home-quick-task-input"
              type="text"
              aria-label="Quick Task Input"
              placeholder={
                currentLanguage === "hi"
                  ? "यहाँ आज का नया कार्य लिखें (जैसे: अध्याय 4 का रिवीजन करें)..."
                  : "Quick Task: Type a task to add directly to today's list..."
              }
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/90 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Assign Subject Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-2 rounded-2xl border border-indigo-500/30">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <label
                htmlFor="home-quick-task-subject-select"
                className="text-[11px] font-semibold text-slate-400 whitespace-nowrap"
              >
                {currentLanguage === "hi" ? "विषय:" : "Quick Assign:"}
              </label>
              <select
                id="home-quick-task-subject-select"
                aria-label="Quick Assign Subject"
                value={quickTaskSubjectId}
                onChange={(e) => setQuickTaskSubjectId(e.target.value)}
                className="bg-transparent text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-300">
                  {currentLanguage === "hi" ? "सामान्य (कोई विषय नहीं)" : "General (Any Subject)"}
                </option>
                {availableSubjects.map((sub) => (
                  <option
                    key={sub.id}
                    value={sub.id}
                    className="bg-slate-900 text-white"
                  >
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-2 rounded-2xl border border-white/10">
              <Flag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <label
                htmlFor="home-quick-task-priority"
                className="text-[11px] font-semibold text-slate-400 whitespace-nowrap"
              >
                Priority:
              </label>
              <select
                id="home-quick-task-priority"
                aria-label="Quick Task Priority"
                value={quickTaskPriority}
                onChange={(e) => setQuickTaskPriority(e.target.value as Priority)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="high" className="bg-slate-900 text-rose-300">
                  High
                </option>
                <option value="medium" className="bg-slate-900 text-amber-300">
                  Medium
                </option>
                <option value="low" className="bg-slate-900 text-emerald-300">
                  Low
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-2 rounded-2xl border border-white/10">
              <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                id="home-quick-task-category"
                aria-label="Quick Task Category"
                value={quickTaskCategory}
                onChange={(e) => setQuickTaskCategory(e.target.value as TaskCategory)}
                className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer capitalize"
              >
                <option value="study" className="bg-slate-900 text-white">
                  Study
                </option>
                <option value="exam" className="bg-slate-900 text-white">
                  Exam
                </option>
                <option value="urgent" className="bg-slate-900 text-white">
                  Urgent
                </option>
                <option value="personal" className="bg-slate-900 text-white">
                  Personal
                </option>
                <option value="work" className="bg-slate-900 text-white">
                  Work
                </option>
              </select>
            </div>

            <button
              type="submit"
              id="home-quick-task-submit-btn"
              disabled={!quickTaskTitle.trim()}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-sm"
            >
              {currentLanguage === "hi" ? "+ कार्य जोड़ें" : "+ Add Task"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* 1-TAP QUICK ACTIONS (Hidden when Focus Mode is enabled)                   */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <QuickActionsWidget
          currentLanguage={currentLanguage}
          onNavigate={onNavigate}
          onQuickAddTask={() => {
            const inputEl = document.getElementById("home-quick-task-input");
            if (inputEl) {
              inputEl.focus();
              inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
            } else if (onQuickAddTask) {
              onQuickAddTask();
            } else {
              onNavigate("tasks");
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DAILY EXECUTION (Tasks, Pending, Focus Sessions, Study Time)   */}
      {/* ========================================================================= */}
      <DailyExecutionSection
        tasks={tasks}
        subjects={availableSubjects}
        studySessions={studySessions}
        focusLogs={focusLogs}
        currentLanguage={currentLanguage}
        onNavigate={onNavigate}
        onQuickAddTask={onQuickAddTask}
        onAddTask={onAddTask}
        onToggleTask={onToggleTask}
      />

      {/* ========================================================================= */}
      {/* SECTION 3: ACADEMIC INTELLIGENCE & STUDENT DECISION ENGINE                */}
      {/* (Hidden when Focus Mode is enabled to reduce distractions)                */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <AcademicDecisionEngineSection
          subjects={subjects}
          studySessions={studySessions}
          activeStudent={activeStudent}
          careerProfile={careerProfile}
          examProfile={examProfile}
          academicSubjects={academicSubjects}
          academicChapters={academicChapters}
          vviTopics={vviTopics}
          revisions={academicRevisions}
          practiceSessions={academicPractice}
          examRecords={examTestRecords}
          streakDays={gamification.streakDays}
          currentLanguage={currentLanguage}
          onNavigate={onNavigate}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: WELLNESS (Hidden when Focus Mode is enabled)                   */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <WellnessSection
          habits={habits}
          water={water}
          currentLanguage={currentLanguage}
          onToggleHabit={onToggleHabit}
          onAddWaterGlass={onAddWaterGlass}
          onRemoveWaterGlass={onRemoveWaterGlass}
          onNavigate={onNavigate}
        />
      )}

      {/* ========================================================================= */}
      {/* FLOATING QUICK-ADD NOTE SAVED FEEDBACK TOAST                              */}
      {/* ========================================================================= */}
      {quickNoteSavedFeedback && (
        <div
          id="home-quick-note-saved-toast"
          data-testid="quick-note-saved-toast"
          role="status"
          className="fixed bottom-36 md:bottom-24 right-4 sm:right-8 z-40 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{quickNoteSavedFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING QUICK-ADD BUTTON FOR NOTES (Bottom-Right FAB)                    */}
      {/* Opens a minimalist modal for capturing fleeting ideas without leaving view*/}
      {/* ========================================================================= */}
      <button
        type="button"
        id="home-floating-quick-note-btn"
        data-testid="floating-quick-note-btn"
        aria-label="Quick Add Note"
        title="Capture a quick note or fleeting idea"
        onClick={() => setIsQuickNoteModalOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-4 sm:right-8 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-2xl shadow-emerald-500/30 border border-white/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <FileText className="w-4 h-4 stroke-[2.5]" />
        <span>{currentLanguage === "hi" ? "+ त्वरित नोट" : "+ Quick Note"}</span>
      </button>

      {/* ========================================================================= */}
      {/* MINIMALIST QUICK-NOTE CAPTURE MODAL                                       */}
      {/* ========================================================================= */}
      {isQuickNoteModalOpen && (
        <div
          id="home-quick-note-modal"
          data-testid="quick-note-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-note-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setIsQuickNoteModalOpen(false)}
        >
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/15 bg-slate-950/95 p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    id="quick-note-modal-title"
                    className="text-base font-bold font-heading text-white"
                  >
                    {currentLanguage === "hi"
                      ? "त्वरित विचार व नोट कैप्चर (Quick Note)"
                      : "Quick Note — Capture Fleeting Idea"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {currentLanguage === "hi"
                      ? "वर्तमान दृश्य छोड़े बिना तुरंत अपना विचार सहेजें"
                      : "Save thoughts, formulas, or reminders without leaving your dashboard"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="quick-note-close-btn"
                aria-label="Close Quick Note Modal"
                onClick={() => setIsQuickNoteModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Minimalist Form */}
            <form
              id="home-quick-note-form"
              onSubmit={handleSaveQuickNote}
              className="space-y-3.5"
            >
              <div>
                <input
                  id="quick-note-title-input"
                  type="text"
                  aria-label="Quick Note Title"
                  placeholder={
                    currentLanguage === "hi"
                      ? "शीर्षक (वैकल्पिक — खाली छोड़ने पर स्वतः बनेगा)..."
                      : "Note title (optional — auto-generated if blank)..."
                  }
                  value={quickNoteTitle}
                  onChange={(e) => setQuickNoteTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <textarea
                  id="quick-note-content-input"
                  aria-label="Quick Note Content"
                  rows={4}
                  autoFocus
                  placeholder={
                    currentLanguage === "hi"
                      ? "अपना विचार, सूत्र या रिवीजन पॉइंट यहाँ लिखें..."
                      : "Type your fleeting idea, formula, or key revision point..."
                  }
                  value={quickNoteContent}
                  onChange={(e) => setQuickNoteContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 resize-none"
                />
              </div>

              {/* Minimalist Tag & Pin Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                  {["Idea", "Formula", "Revision", "Doubt"].map((tagOption) => (
                    <button
                      key={tagOption}
                      type="button"
                      onClick={() => setQuickNoteTag(tagOption)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        quickNoteTag === tagOption
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tagOption}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  id="quick-note-pin-toggle"
                  onClick={() => setQuickNotePinned((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                    quickNotePinned
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-900 text-slate-400 border-white/10 hover:text-white"
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{quickNotePinned ? "Pinned" : "Pin Idea"}</span>
                </button>
              </div>

              {/* Recent Notes Preview (if any) */}
              {combinedNotes.length > 0 && (
                <div
                  id="quick-note-recent-list"
                  className="pt-2 border-t border-white/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Recent Captured Notes ({combinedNotes.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickNoteModalOpen(false);
                        onNavigate("notes");
                      }}
                      className="text-emerald-400 hover:underline font-medium cursor-pointer"
                    >
                      View All Notes →
                    </button>
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {combinedNotes.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-semibold text-slate-200 truncate">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {item.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  id="quick-note-cancel-btn"
                  onClick={() => setIsQuickNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="quick-note-save-btn"
                  disabled={!quickNoteTitle.trim() && !quickNoteContent.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {currentLanguage === "hi" ? "नोट सहेजें" : "Save Quick Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
