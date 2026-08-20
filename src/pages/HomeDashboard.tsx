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
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-200 max-w-6xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. PREMIUM HOME HERO & BRANDING SECTION                                    */}
      {/* ========================================================================= */}
      <section
        id="home-dashboard-hero"
        className="glass-card rounded-3xl p-5 sm:p-7 border border-white/10 relative overflow-hidden bg-gradient-to-br from-slate-900/95 via-[#0d1222]/90 to-purple-950/20 shadow-xl"
      >
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Top Bar: Centered on Mobile, Balanced & Vertically Centered on Desktop */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10 overflow-visible w-full">
            {/* Branding Container: Centered on mobile, vertically centered with controls on desktop */}
            <div className="flex items-center justify-center sm:justify-start overflow-visible w-full sm:w-auto py-1">
              <GariaLogo
                size="md"
                variant="horizontal"
                showTagline={true}
                withGlow={true}
                onClick={onOpenSliderMenu}
                className="cursor-pointer hover:opacity-95 transition-opacity overflow-visible"
              />
            </div>

            {/* Right: Live Time, Date, and Menu Trigger */}
            <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto overflow-visible">
              {/* Live Digital Clock Badge */}
              <div
                id="home-live-clock"
                className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-purple-500/30 text-purple-200 text-xs font-mono font-bold flex items-center gap-2 shadow-inner shrink-0"
                title="Current Local Time"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{formattedTime}</span>
              </div>

              {/* Current Date Badge */}
              <div
                id="home-current-date"
                className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5 shadow-inner shrink-0"
                title="Today's Date"
              >
                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{formattedDate}</span>
              </div>

              {/* System Drawer / Settings Button */}
              {onOpenSliderMenu && (
                <button
                  onClick={onOpenSliderMenu}
                  id="home-menu-trigger"
                  title="Open Garia OS Settings & Navigation"
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all card-press shrink-0"
                >
                  <Menu className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline text-xs">Menu</span>
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Greeting & Student Context */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
                  {displayGreeting}, {activeStudent?.name || settings.userName || "Student"}! 👋
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeStudent?.classLevel || "Class 12"} • {activeStudent?.stream || "Commerce"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                {currentLanguage === "hi"
                  ? "आपका स्वागत है! आज के अध्ययन लक्ष्यों और प्राथमिकताओं पर केंद्रित रहें।"
                  : "Welcome to your command center. Stay consistent and conquer today's study goals."}
              </p>
            </div>

            {/* Quick Streak / XP Stats Pills & Customize Dashboard Trigger */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
              <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-rose-500/30 flex items-center gap-2.5 shadow-sm">
                <Flame className="w-4 h-4 text-rose-400 fill-rose-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {currentLanguage === "hi" ? "दैनिक स्ट्रीक" : "Streak"}
                  </div>
                  <div className="text-xs font-extrabold text-white font-mono">
                    {gamification.streakDays} {currentLanguage === "hi" ? "दिन" : "Days"}
                  </div>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex items-center gap-2.5 shadow-sm">
                <Award className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Level {gamification.level}
                  </div>
                  <div className="text-xs font-extrabold text-amber-300 font-mono">
                    {gamification.currentXP} XP
                  </div>
                </div>
              </div>

              {/* Customize Dashboard Button */}
              <button
                onClick={() => setIsCustomizerOpen(true)}
                id="header-customize-dashboard-btn"
                title="Customize Home Dashboard Widgets"
                className="px-3.5 py-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all card-press active:scale-95 shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <span>{currentLanguage === "hi" ? "विजेट अनुकूलन" : "Customize"}</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                  {enabledWidgets.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CORE FOCUS SUMMARY METRICS CARDS (TOP ROW)                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Productivity & Level */}
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Level {gamification.level}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {gamification.currentXP} <span className="text-xs text-emerald-400 font-sans font-bold">XP</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Productivity Velocity
            </div>
          </div>
        </div>

        {/* Metric 2: Today's Tasks Progress */}
        <div className="glass-card rounded-2xl p-4 border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/20 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {completedTodayCount}/{todaysTasks.length} Done
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {taskCompletionRate}<span className="text-xs text-cyan-400 font-sans font-bold">%</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Tasks Completed Today
            </div>
          </div>
        </div>

        {/* Metric 3: Deep Focus Time */}
        <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-amber-950/20 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Pomodoro
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {todayFocusMinutes} <span className="text-xs text-amber-400 font-sans font-bold">min</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Deep Focus Today
            </div>
          </div>
        </div>

        {/* Metric 4: Daily Streak */}
        <div className="glass-card rounded-2xl p-4 border border-rose-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-rose-950/20 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4 fill-rose-400" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
              Active
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {gamification.streakDays} <span className="text-xs text-rose-400 font-sans font-bold">{currentLanguage === "hi" ? "दिन" : "Days"}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Study Streak
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CUSTOMIZABLE WORKSPACE WIDGETS TOOLBAR                                  */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold font-heading text-white uppercase tracking-wider">
            {currentLanguage === "hi" ? "डैशबोर्ड विजेट्स" : "Dashboard Workspace"}
          </h2>
          <span className="text-[10px] font-mono font-bold bg-white/5 text-slate-400 px-2 py-0.5 rounded-full border border-white/5">
            {enabledWidgets.length} {currentLanguage === "hi" ? "सक्रिय" : "Active"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCustomizerOpen(true)}
            id="toolbar-add-widget-btn"
            className="px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white font-semibold transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentLanguage === "hi" ? "+ विजेट जोड़ें" : "+ Add Widget"}</span>
          </button>

          <button
            onClick={() => setIsCustomizerOpen(true)}
            id="toolbar-customize-btn"
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all"
            title="Arrange & Resize Widgets"
            aria-label="Arrange & Resize Widgets"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DYNAMIC CUSTOMIZABLE WIDGETS GRID                                      */}
      {/* ========================================================================= */}
      <div
        id="dashboard-widgets-grid"
        className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5"
      >
        {enabledWidgets.map((widgetConfig, index) => {
          const isFirst = index === 0;
          const isLast = index === enabledWidgets.length - 1;
          const meta = WIDGET_METADATA[widgetConfig.id];

          return (
            <WidgetCardWrapper
              key={widgetConfig.id}
              id={widgetConfig.id}
              colSpan={widgetConfig.colSpan || meta?.defaultColSpan || "half"}
              isFirst={isFirst}
              isLast={isLast}
              onMoveUp={() => handleMoveWidget(widgetConfig.id, "up")}
              onMoveDown={() => handleMoveWidget(widgetConfig.id, "down")}
              onResize={(newSpan) => handleResizeWidget(widgetConfig.id, newSpan)}
              onHide={() => handleToggleWidget(widgetConfig.id, false)}
              onOpenCustomizer={() => setIsCustomizerOpen(true)}
            >
              {renderWidgetContent(widgetConfig.id)}
            </WidgetCardWrapper>
          );
        })}

        {/* Empty / Add More Widgets Card (Full Width at Bottom) */}
        {hiddenWidgets.length > 0 && (
          <div className="col-span-1 md:col-span-12">
            <div className="glass-card rounded-3xl p-5 border border-dashed border-white/15 bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    {currentLanguage === "hi"
                      ? "अधिक विजेट्स जोड़ें"
                      : "Add More Widgets to Your Dashboard"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {hiddenWidgets.length} {currentLanguage === "hi" ? "अतिरिक्त विजेट उपलब्ध हैं" : "additional widgets available in gallery"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                {hiddenWidgets.slice(0, 3).map((w) => {
                  const meta = WIDGET_METADATA[w.id];
                  if (!meta) return null;
                  return (
                    <button
                      key={w.id}
                      onClick={() => handleToggleWidget(w.id, true)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-xs font-semibold text-slate-300 hover:text-emerald-300 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>{currentLanguage === "hi" ? meta.nameHi : meta.name}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setIsCustomizerOpen(true)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{currentLanguage === "hi" ? "सभी देखें" : "Open Customizer"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. DASHBOARD WIDGET CUSTOMIZER MODAL                                      */}
      {/* ========================================================================= */}
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
