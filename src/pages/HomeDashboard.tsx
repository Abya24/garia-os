import React, { useState, useEffect, useMemo } from "react";
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
} from "../types";
import { getTodayString } from "../utils/storage";
import { calculateGamificationState } from "../utils/gamificationEngine";
import { generateExamIntelligenceReport } from "../utils/examIntelligenceEngine";
import { AppLanguage, translations } from "../utils/i18n";
import { GariaLogo } from "../components/GariaLogo";
import { fetchDailyQuote, fetchNextQuote, MOTIVATIONAL_QUOTES, MotivationalQuote } from "../utils/quotes";

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

  // Live Clock & Date State
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Motivational Quote (Initialized via fetchDailyQuote, auto-rotates every 25s)
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

  // Hindi localization for greetings
  const hindiGreeting =
    hour >= 4 && hour < 12
      ? "सुप्रभात"
      : hour >= 12 && hour < 17
      ? "शुभ दोपहर"
      : hour >= 17 && hour < 21
      ? "शुभ संध्या"
      : "शुभ रात्रि";

  const displayGreeting = currentLanguage === "hi" ? hindiGreeting : timeGreeting;

  // Formatted Date and Time strings
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

  // Inline quick add task state
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");

  // Focus Timer Mini State
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSecondsLeft]);

  const handleSwitchTimerMode = (mode: "focus" | "shortBreak" | "longBreak") => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    if (mode === "focus") setTimerSecondsLeft(25 * 60);
    else if (mode === "shortBreak") setTimerSecondsLeft(5 * 60);
    else setTimerSecondsLeft(15 * 60);
  };

  const formatTimerTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

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

  const displayedTasks = useMemo(() => {
    if (taskFilter === "pending") return todaysTasks.filter((t) => !t.completed);
    if (taskFilter === "completed") return todaysTasks.filter((t) => t.completed);
    return todaysTasks;
  }, [todaysTasks, taskFilter]);

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

  const handleInlineSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTaskTitle.trim()) return;
    if (onAddTask) {
      onAddTask({
        title: inlineTaskTitle.trim(),
        date: todayStr,
        priority: "medium",
        category: "study",
        completed: false,
      });
    }
    setInlineTaskTitle("");
  };

  // Focus time today
  const todayFocusMinutes = useMemo(() => {
    return focusLogs
      .filter((l) => l.date === todayStr && l.type === "focus")
      .reduce((acc, l) => acc + l.durationMinutes, 0);
  }, [focusLogs, todayStr]);

  // Abya AI Suggestions
  const abyaSuggestions = useMemo(() => {
    const list = [];
    if (todaysTasks.filter((t) => !t.completed).length > 0) {
      list.push({
        id: "task_focus",
        title: "Focus on High Priority Tasks",
        desc: `You have ${todaysTasks.filter((t) => !t.completed).length} pending task(s) for today.`,
        actionTab: "tasks" as ActiveTab,
        actionLabel: "View Tasks",
        tag: "Priority",
        color: "emerald",
      });
    }
    if (todayFocusMinutes < 45) {
      list.push({
        id: "pomodoro_boost",
        title: "Start a 25m Focus Block",
        desc: "Deep focus session boosts syllabus retention by 40%.",
        actionTab: "focus" as ActiveTab,
        actionLabel: "Start Focus",
        tag: "Study Hack",
        color: "cyan",
      });
    }
    if (water.glasses < (water.goal || 8)) {
      list.push({
        id: "hydration_boost",
        title: "Stay Hydrated for Brain Health",
        desc: `Logged ${water.glasses}/${water.goal || 8} glasses. Keep your mind refreshed.`,
        actionTab: "water" as ActiveTab,
        actionLabel: "Drink Water",
        tag: "Health",
        color: "blue",
      });
    }
    if (list.length === 0) {
      list.push({
        id: "general_motivation",
        title: "All Goals on Track Today!",
        desc: "Great momentum. Keep reviewing your notes and staying consistent.",
        actionTab: "notes" as ActiveTab,
        actionLabel: "Open Notes",
        tag: "Momentum",
        color: "purple",
      });
    }
    return list;
  }, [todaysTasks, todayFocusMinutes, water]);

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-200 max-w-6xl mx-auto">
      {/* ========================================================================= */}
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

            {/* Quick Streak / XP Stats Pills */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
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
            </div>
          </div>

          {/* Dynamic Motivational Quote Card */}
          <div
            id="home-dynamic-quote-card"
            className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-amber-500/30 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <QuoteIcon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
                    {currentLanguage === "hi" ? "दैनिक प्रेरणा" : "Dynamic Motivation"}
                  </span>
                  <span className="text-[9px] px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 capitalize">
                    {activeQuote.category}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-100 italic leading-relaxed">
                  "{currentLanguage === "hi" && activeQuote.hindiTranslation ? activeQuote.hindiTranslation : activeQuote.quote}"
                </p>
                <div className="text-[11px] text-slate-400 font-medium">
                  — <span className="text-amber-200">{activeQuote.author}</span>
                </div>
              </div>
            </div>

            {/* Quote Shuffle Button */}
            <button
              onClick={handleNextQuote}
              title="Next Motivational Quote"
              aria-label="Refresh Quote"
              className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all self-end sm:self-center shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">New Quote</span>
            </button>
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
      {/* 3. PRIMARY ACTION & PRODUCTIVITY WORKSPACE GRID                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
        
        {/* COLUMN LEFT: TASKS & FOCUS TIMER (Col 7 on Desktop) */}
        <div className="col-span-1 md:col-span-7 space-y-4 sm:space-y-5">
          
          {/* SECTION: TODAY'S TASKS */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/80 shadow-md space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Today's Focus Tasks</h3>
                  <p className="text-[11px] text-slate-400">
                    {completedTodayCount} of {todaysTasks.length} completed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTaskFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    taskFilter === "all" ? "bg-white/15 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTaskFilter("pending")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    taskFilter === "pending" ? "bg-white/15 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setTaskFilter("completed")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    taskFilter === "completed" ? "bg-white/15 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Done
                </button>
                <button
                  onClick={() => onNavigate("tasks")}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 ml-1.5 flex items-center gap-0.5"
                >
                  <span>All Tasks</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Inline Quick Add Task */}
            <form onSubmit={handleInlineSubmitTask} className="relative">
              <input
                type="text"
                value={inlineTaskTitle}
                onChange={(e) => setInlineTaskTitle(e.target.value)}
                placeholder="Quick add a task for today..."
                className="w-full pl-9 pr-16 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Plus className="w-4 h-4 text-emerald-400 absolute left-3 top-3 pointer-events-none" />
              <button
                type="submit"
                disabled={!inlineTaskTitle.trim()}
                className="absolute right-1.5 top-1.5 px-3 py-1 rounded-lg bg-emerald-500 disabled:opacity-40 text-slate-950 text-xs font-bold transition-all"
              >
                Add
              </button>
            </form>

            {/* Task Items List */}
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {displayedTasks.length > 0 ? (
                displayedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask && onToggleTask(task)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                      task.completed
                        ? "bg-slate-900/40 border-white/5 text-slate-500 line-through opacity-70"
                        : "bg-slate-800/60 hover:bg-slate-800 border-white/5 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        className="shrink-0 text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-xs font-medium truncate">{task.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.priority === "high" && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25">
                          High
                        </span>
                      )}
                      {task.priority === "medium" && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                          Med
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {task.time || "Today"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-7 text-slate-500 text-xs border border-dashed border-white/5 rounded-xl">
                  {taskFilter === "all"
                    ? "No tasks scheduled for today. Add one above to get started!"
                    : taskFilter === "pending"
                    ? "🎉 All tasks completed for today!"
                    : "No completed tasks yet."}
                </div>
              )}
            </div>
          </div>

          {/* SECTION: FOCUS TIMER MINI */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/80 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Pomodoro Focus Timer</h3>
                  <p className="text-[11px] text-slate-400">Deep study sprints & structured breaks</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("focus")}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>Full Focus App</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex p-1 rounded-xl bg-slate-800/80 border border-white/5 text-xs">
              <button
                onClick={() => handleSwitchTimerMode("focus")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  timerMode === "focus"
                    ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => handleSwitchTimerMode("shortBreak")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  timerMode === "shortBreak"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Short Break (5m)
              </button>
              <button
                onClick={() => handleSwitchTimerMode("longBreak")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  timerMode === "longBreak"
                    ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Long Break (15m)
              </button>
            </div>

            {/* Time Display & Actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                {formatTimerTime(timerSecondsLeft)}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTimerRunning((prev) => !prev)}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                    isTimerRunning
                      ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Session</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleSwitchTimerMode(timerMode)}
                  aria-label="Reset Timer"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN RIGHT: HABITS & WATER (Col 5 on Desktop) */}
        <div className="col-span-1 md:col-span-5 space-y-4 sm:space-y-5">
          
          {/* SECTION: HABIT TRACKER */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/80 shadow-md space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Habits & Consistency</h3>
                  <p className="text-[11px] text-slate-400">Daily routine tracking</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("habits")}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {habits.slice(0, 3).map((habit) => {
                const isCompletedToday = habit.completedDates?.includes(todayStr);
                return (
                  <div
                    key={habit.id}
                    className="p-3 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => onToggleHabit && onToggleHabit(habit.id, todayStr)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isCompletedToday
                            ? "bg-rose-500 border-rose-500 text-white"
                            : "border-slate-600 hover:border-rose-400"
                        }`}
                      >
                        {isCompletedToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {habit.title}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1 shrink-0">
                      <Flame className="w-3 h-3" />
                      {habit.streak || 0}d
                    </span>
                  </div>
                );
              })}

              {habits.length === 0 && (
                <button
                  onClick={() => onNavigate("habits")}
                  className="w-full py-4 rounded-xl border border-dashed border-white/10 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  + Add your first daily habit
                </button>
              )}
            </div>
          </div>

          {/* SECTION: WATER TRACKER */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/80 shadow-md space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Hydration Log</h3>
                  <p className="text-[11px] text-slate-400">
                    {water.glasses} / {water.goal || 8} glasses ({(water.glasses * 250) / 1000}L)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onRemoveWaterGlass && water.glasses > 0 && (
                  <button
                    onClick={onRemoveWaterGlass}
                    title="Remove glass"
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5 flex items-center justify-center text-xs font-bold transition-colors"
                  >
                    -
                  </button>
                )}
                <button
                  onClick={onAddWaterGlass}
                  className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors active:scale-95 shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Drink</span>
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((water.glasses / (water.goal || 8)) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{Math.min(100, Math.round((water.glasses / (water.goal || 8)) * 100))}% of Daily Goal</span>
                <span>Goal: {((water.goal || 8) * 250) / 1000}L</span>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 6: EXAM INTELLIGENCE (Col 6 on Desktop) */}
        <div className="col-span-1 md:col-span-6 glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Exam Intelligence</h3>
                  <p className="text-[11px] text-slate-400">Target board & readiness score</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("exam")}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
              >
                <span>Exam Center</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-800/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {examProfile?.targetExamName || `${activeStudent?.stream || "Board"} Final Exams`}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                  {examReport && examReport.daysUntilExam > 0
                    ? `${examReport.daysUntilExam} Days Left`
                    : "Exam Ready"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Readiness Score:</span>
                <span className="font-bold text-emerald-400">
                  {examReport?.overallReadinessScore || 85}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Target Score: {examProfile?.targetScorePercentage || 95}%</span>
            <button
              onClick={() => onNavigate("exam")}
              className="text-xs text-indigo-400 font-bold hover:underline"
            >
              Analyze Weak Areas →
            </button>
          </div>
        </div>

        {/* WIDGET 7: ABYA AI SUGGESTIONS (Col 6 on Desktop) */}
        <div className="col-span-1 md:col-span-6 glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Abya AI Suggestions</h3>
                  <p className="text-[11px] text-slate-400">Adaptive personalized recommendations</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("abya")}
                className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
              >
                <span>Ask Abya</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {abyaSuggestions.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/15 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate">{item.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.desc}</p>
                  </div>

                  <button
                    onClick={() => onNavigate(item.actionTab)}
                    className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold shrink-0 transition-colors"
                  >
                    {item.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Powered by Abya AI Engine</span>
            <button
              onClick={() => onNavigate("abya")}
              className="text-xs text-purple-400 font-bold hover:underline"
            >
              Open AI Chat →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
