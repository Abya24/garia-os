import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Droplet,
  ShieldAlert,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  Bot,
  Zap,
  Quote as QuoteIcon,
  RefreshCw,
  Search,
  Bell,
  Menu,
  PlusCircle,
  LayoutGrid,
  Columns,
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
  DashboardWidgetConfig,
  HomeWidgetId,
  WidgetColSpan,
  AcademicChapter,
  AcademicSubject,
  AcademicRevisionItem,
} from "../types";
import { getTodayString } from "../utils/storage";
import { calculateGamificationState } from "../utils/gamificationEngine";
import { generateExamIntelligenceReport } from "../utils/examIntelligenceEngine";
import { AppLanguage, translations } from "../utils/i18n";
import { GariaLogo } from "../components/GariaLogo";
import { fetchDailyQuote, fetchNextQuote, MOTIVATIONAL_QUOTES, MotivationalQuote } from "../utils/quotes";
import {
  loadDashboardWidgets,
  saveDashboardWidgets,
  toggleWidgetEnabled,
  moveWidgetPosition,
  resizeWidgetColSpan,
  WIDGET_METADATA,
  DEFAULT_DASHBOARD_WIDGETS,
} from "../utils/dashboardWidgets";
import { DashboardWidgetCustomizer } from "../components/home/DashboardWidgetCustomizer";
import { WidgetCardWrapper } from "../components/home/widgets/WidgetCardWrapper";
import { TodaysTasksWidget } from "../components/home/widgets/TodaysTasksWidget";
import { QuickActionsWidget } from "../components/home/widgets/QuickActionsWidget";
import { StudyProgressWidget } from "../components/home/widgets/StudyProgressWidget";
import { WaterIntakeWidget } from "../components/home/widgets/WaterIntakeWidget";
import { GamificationWidget } from "../components/home/widgets/GamificationWidget";
import { QuoteWidget } from "../components/home/widgets/QuoteWidget";
import { QuickAccessWidget } from "../components/home/widgets/QuickAccessWidget";
import { ContinueLearningWidget } from "../components/home/widgets/ContinueLearningWidget";
import { FocusTimerWidget } from "../components/home/widgets/FocusTimerWidget";
import { RevisionDueWidget } from "../components/home/widgets/RevisionDueWidget";
import { AbyaSuggestionsWidget } from "../components/home/widgets/AbyaSuggestionsWidget";
import { HabitTrackerWidget } from "../components/home/widgets/HabitTrackerWidget";
import { generateSmartSuggestions, SmartSuggestion } from "../utils/suggestionsEngine";
import { HeroSection } from "../components/home/sections/HeroSection";
import { DailyExecutionSection } from "../components/home/sections/DailyExecutionSection";
import { AcademicProgressSection } from "../components/home/sections/AcademicProgressSection";
import { ExamIntelligenceSection } from "../components/home/sections/ExamIntelligenceSection";
import { WellnessSection } from "../components/home/sections/WellnessSection";

interface HomeDashboardProps {
  tasks: Task[];
  subjects: Subject[];
  studySessions?: StudySession[];
  focusLogs?: FocusSessionLog[];
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
  onNavigate: (tab: ActiveTab) => void;
  onQuickAddTask?: () => void;
  onAddTask?: (task: Omit<Task, "id" | "createdAt">) => void;
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
  onNavigate,
  onQuickAddTask,
  onAddTask,
  onAddWaterGlass,
  onRemoveWaterGlass,
  onToggleTask,
  onToggleHabit,
  onOpenSliderMenu,
}) => {
  const todayStr = getTodayString();
  const t = translations[currentLanguage] || translations.en;

  // Customizable Widgets State
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() =>
    loadDashboardWidgets(activeStudent?.id)
  );
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Sync widgets whenever active profile changes
  useEffect(() => {
    setWidgets(loadDashboardWidgets(activeStudent?.id));
  }, [activeStudent?.id]);

  const handleSaveWidgets = useCallback((updated: DashboardWidgetConfig[]) => {
    setWidgets(updated);
    saveDashboardWidgets(updated, activeStudent?.id);
  }, [activeStudent?.id]);

  const handleToggleWidget = useCallback((id: HomeWidgetId, forceState?: boolean) => {
    const updated = toggleWidgetEnabled(widgets, id, forceState, activeStudent?.id);
    setWidgets(updated);
  }, [widgets, activeStudent?.id]);

  const handleMoveWidget = useCallback((id: HomeWidgetId, direction: "up" | "down") => {
    const updated = moveWidgetPosition(widgets, id, direction, activeStudent?.id);
    setWidgets(updated);
  }, [widgets, activeStudent?.id]);

  const handleResizeWidget = useCallback((id: HomeWidgetId, colSpan: WidgetColSpan) => {
    const updated = resizeWidgetColSpan(widgets, id, colSpan, activeStudent?.id);
    setWidgets(updated);
  }, [widgets, activeStudent?.id]);

  // Live Clock & Date State
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Motivational Quote
  const [quoteIndex, setQuoteIndex] = useState<number>(() => {
    const daily = fetchDailyQuote();
    const idx = MOTIVATIONAL_QUOTES.findIndex((q) => q.id === daily.id);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => fetchNextQuote(prev).index);
    }, 25000);
    return () => clearInterval(quoteInterval);
  }, []);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => fetchNextQuote(prev).index);
  };

  const activeQuote: MotivationalQuote = MOTIVATIONAL_QUOTES[quoteIndex] || MOTIVATIONAL_QUOTES[0];

  // Dynamic Greeting based on time of day
  const hour = currentDateTime.getHours();
  let timeGreeting = "Good Morning";
  if (hour >= 12 && hour < 17) {
    timeGreeting = "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    timeGreeting = "Good Evening";
  } else if (hour >= 21 || hour < 5) {
    timeGreeting = "Good Night";
  }

  const hindiGreeting =
    hour >= 4 && hour < 12
      ? "सुप्रभात"
      : hour >= 12 && hour < 17
      ? "शुभ दोपहर"
      : hour >= 17 && hour < 21
      ? "शुभ संध्या"
      : "शुभ रात्रि";

  const displayGreeting = currentLanguage === "hi" ? hindiGreeting : timeGreeting;

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

  // Smart suggestions generator
  const smartSuggestions: SmartSuggestion[] = useMemo(() => {
    if (!activeStudent) return [];
    return generateSmartSuggestions(
      activeStudent,
      tasks,
      subjects,
      [],
      [],
      goals,
      water,
      habits,
      [],
      examTestRecords,
      [],
      examReport
    );
  }, [activeStudent, tasks, subjects, goals, water, habits, examTestRecords, examReport]);

  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const visibleSuggestions = useMemo(() => {
    return smartSuggestions.filter((s) => !dismissedSuggestions.includes(s.id));
  }, [smartSuggestions, dismissedSuggestions]);

  const handleDismissSuggestion = (id: string) => {
    setDismissedSuggestions((prev) => [...prev, id]);
  };

  // Mock revisions due for spaced repetition widget
  const dummyRevisions: AcademicRevisionItem[] = useMemo(() => {
    return [
      {
        id: "rev-1",
        subjectId: subjects[0]?.id || "sub-1",
        subjectName: subjects[0]?.name || "Accountancy",
        chapterId: "ch-1",
        chapterName: "Financial Statements & Analysis",
        topicName: "Cash Flow Statements (Operating Activities)",
        intervalStage: 3,
        scheduledDate: todayStr,
        completed: false,
        confidenceLevel: "medium",
      },
      {
        id: "rev-2",
        subjectId: subjects[1]?.id || "sub-2",
        subjectName: subjects[1]?.name || "Economics",
        chapterId: "ch-2",
        chapterName: "Macroeconomics: National Income",
        topicName: "Gross Domestic Product (GDP) Deflator",
        intervalStage: 7,
        scheduledDate: todayStr,
        completed: false,
        confidenceLevel: "needs_review",
      },
    ];
  }, [subjects, todayStr]);

  // Filter and sort active enabled widgets
  const enabledWidgets = useMemo(() => {
    return [...widgets]
      .filter((w) => w.enabled)
      .sort((a, b) => a.order - b.order);
  }, [widgets]);

  const hiddenWidgets = useMemo(() => {
    return widgets.filter((w) => !w.enabled);
  }, [widgets]);

  // Function to render each individual widget component dynamically
  const renderWidgetContent = (widgetId: HomeWidgetId) => {
    switch (widgetId) {
      case "quick_actions":
        return (
          <QuickActionsWidget
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
            onQuickAddTask={onQuickAddTask || (() => onNavigate("tasks"))}
          />
        );

      case "todays_tasks":
        return (
          <TodaysTasksWidget
            tasks={tasks}
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
            onQuickAddTask={onQuickAddTask || (() => onNavigate("tasks"))}
            onToggleTask={onToggleTask}
          />
        );

      case "study_progress":
        return (
          <StudyProgressWidget
            subjects={subjects}
            studySessions={studySessions}
            focusLogs={focusLogs}
            tasks={tasks}
            streamLabel={activeStudent ? `${activeStudent.classLevel} ${activeStudent.stream}` : "Syllabus"}
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
          />
        );

      case "water_intake":
        return (
          <WaterIntakeWidget
            water={water}
            currentLanguage={currentLanguage}
            onAddWaterGlass={onAddWaterGlass}
            onRemoveWaterGlass={onRemoveWaterGlass}
          />
        );

      case "gamification_card":
        return (
          <GamificationWidget
            gamification={gamification}
            examReport={examReport || {
              overallReadinessScore: 85,
              predictedScoreMin: 80,
              predictedScoreMax: 92,
              readinessTier: "good",
              daysUntilExam: 60,
              subjectBreakdowns: [],
              weakestSubject: null,
              strongestSubject: null,
              highYieldRecommendations: [],
              lastUpdated: new Date().toISOString(),
            }}
            targetExamName={examProfile?.targetExamName || `${activeStudent?.stream || "Board"} Final Exams`}
            daysUntilExam={examReport?.daysUntilExam || 60}
            onNavigate={onNavigate}
          />
        );

      case "quote_card":
        return (
          <QuoteWidget
            quote={{
              id: activeQuote.id,
              quote: activeQuote.quote,
              author: activeQuote.author,
              category: activeQuote.category as any,
              hindiTranslation: activeQuote.hindiTranslation,
            }}
            currentLanguage={currentLanguage}
          />
        );

      case "quick_access":
        return <QuickAccessWidget onNavigate={onNavigate} />;

      case "continue_learning":
        return (
          <ContinueLearningWidget
            activeChapter={{
              id: "active-ch-1",
              subjectId: subjects[0]?.id || "sub-1",
              title: "Financial Statements of a Company & Accounting Ratios",
              description: "Deep dive into Balance Sheet heads, Liquidity, Solvency and Profitability ratios with NCERT solutions.",
              order: 1,
              completed: false,
              isVVI: true,
              totalQuestions: 24,
              completedQuestions: 14,
            }}
            activeChapterSubject={{
              id: subjects[0]?.id || "sub-1",
              name: subjects[0]?.name || "Accountancy",
              code: "ACC-12",
              icon: "BookOpen",
              color: "emerald",
              totalChapters: 8,
              completedChapters: 4,
            }}
            chapterProgress={65}
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
          />
        );

      case "focus_timer":
        return (
          <FocusTimerWidget
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
          />
        );

      case "revision_due":
        return (
          <RevisionDueWidget
            revisions={dummyRevisions}
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
          />
        );

      case "abya_suggestions":
        return (
          <AbyaSuggestionsWidget
            smartSuggestions={visibleSuggestions}
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
            onDismissSuggestion={handleDismissSuggestion}
          />
        );

      case "habit_tracker":
        return (
          <HabitTrackerWidget
            habits={habits}
            currentLanguage={currentLanguage}
            onToggleHabit={onToggleHabit}
            onNavigate={onNavigate}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-7 pb-24 md:pb-8 animate-in fade-in duration-200 max-w-6xl mx-auto">
      {/* ========================================================================= */}
      {/* SECTION 1: HERO AREA (Greeting, Productivity Score, Countdown, Focus)     */}
      {/* ========================================================================= */}
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
        todaysCompletedTasksCount={completedTodayCount}
        todaysTotalTasksCount={todaysTasks.length}
        todayStudyMinutes={todayStudyMinutes}
        todayHabitsCompletedCount={
          habits.filter((h) => h.completedDates?.includes(todayStr)).length
        }
        totalHabitsCount={habits.length}
        onNavigate={onNavigate}
        onOpenSliderMenu={onOpenSliderMenu}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
      />

      {/* ========================================================================= */}
      {/* SECTION 2: DAILY EXECUTION (Tasks, Pending, Focus Sessions, Study Time)   */}
      {/* ========================================================================= */}
      <DailyExecutionSection
        tasks={tasks}
        studySessions={studySessions}
        focusLogs={focusLogs}
        currentLanguage={currentLanguage}
        onNavigate={onNavigate}
        onQuickAddTask={onQuickAddTask}
        onAddTask={onAddTask}
        onToggleTask={onToggleTask}
      />

      {/* ========================================================================= */}
      {/* SECTION 3: ACADEMIC PROGRESS (Active Subjects, Mastery, Weak Alert)       */}
      {/* ========================================================================= */}
      <AcademicProgressSection
        subjects={subjects}
        studySessions={studySessions}
        examReport={examReport}
        activeStudent={activeStudent}
        currentLanguage={currentLanguage}
        onNavigate={onNavigate}
      />

      {/* ========================================================================= */}
      {/* SECTION 4: EXAM INTELLIGENCE (Readiness Score, Upcoming, Suggested Hours)  */}
      {/* ========================================================================= */}
      <ExamIntelligenceSection
        examReport={examReport}
        examProfile={examProfile}
        activeStudent={activeStudent}
        subjects={subjects}
        smartSuggestions={visibleSuggestions}
        currentLanguage={currentLanguage}
        onNavigate={onNavigate}
        onDismissSuggestion={handleDismissSuggestion}
      />

      {/* ========================================================================= */}
      {/* SECTION 5: WELLNESS (Habit Tracker, Water Tracker)                        */}
      {/* ========================================================================= */}
      <WellnessSection
        habits={habits}
        water={water}
        currentLanguage={currentLanguage}
        onToggleHabit={onToggleHabit}
        onAddWaterGlass={onAddWaterGlass}
        onRemoveWaterGlass={onRemoveWaterGlass}
        onNavigate={onNavigate}
      />

      {/* Dashboard Widget Customizer Modal & Workspace Configurator */}
      <DashboardWidgetCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        widgets={widgets}
        onSave={handleSaveWidgets}
        currentLanguage={currentLanguage}
        profileId={activeStudent?.id}
      />
    </div>
  );
};
