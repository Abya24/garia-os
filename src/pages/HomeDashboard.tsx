import React, { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  Timer,
  BookOpen,
  Droplet,
  Sparkles,
  Flame,
  Clock,
  Target,
  GraduationCap,
  ShieldAlert,
  ListTodo,
  Atom,
  TrendingUp,
  Compass,
  HelpCircle,
  Play,
  RotateCw,
  ChevronRight,
  Zap,
  Bot,
  MessageSquare,
  Check,
  Brain,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Mail,
  Quote,
  Briefcase,
  BarChart3,
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
  AcademicSubject,
  AcademicChapter,
  AcademicRoadmapData,
  AcademicVVITopic,
  AcademicRevisionItem,
  ExamTestRecord,
  ExamProfile,
  CareerProfile,
  AcademicPracticeSession,
} from "../types";
import { APP_VERSION } from "../constants/version";
import { getTodayString, loadSmartSuggestionsState, saveSmartSuggestionsState } from "../utils/storage";
import { generateSmartSuggestions } from "../utils/suggestionsEngine";
import { generateExamIntelligenceReport } from "../utils/examIntelligenceEngine";
import { calculateGamificationState } from "../utils/gamificationEngine";
import { loadQuestionBankProgress } from "../utils/questionBankEngine";
import { AppLanguage, translations } from "../utils/i18n";
import { getDailyQuote, DailyQuote } from "../data/quotes";

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
  academicSubjects?: AcademicSubject[];
  chapters?: AcademicChapter[];
  roadmap?: AcademicRoadmapData;
  vviTopics?: AcademicVVITopic[];
  revisions?: AcademicRevisionItem[];
  examTestRecords?: ExamTestRecord[];
  examProfile?: ExamProfile;
  careerProfile?: CareerProfile;
  practiceSessions?: AcademicPracticeSession[];
  settings: UserSettings;
  activeStudent?: StudentProfile;
  currentLanguage?: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
  onQuickAddTask: () => void;
  onQuickAddNote: () => void;
  onAddWaterGlass: () => void;
  onRemoveWaterGlass?: () => void;
  onToggleTask?: (task: Task) => void;
  onToggleHabit?: (habitId: string, dateStr: string) => void;
  onOpenStudentModal?: () => void;
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
  academicSubjects = [],
  chapters = [],
  roadmap,
  vviTopics = [],
  revisions = [],
  examTestRecords = [],
  examProfile,
  careerProfile,
  practiceSessions = [],
  settings,
  activeStudent,
  currentLanguage = "en",
  onNavigate,
  onQuickAddTask,
  onQuickAddNote,
  onAddWaterGlass,
  onRemoveWaterGlass,
  onToggleTask,
  onToggleHabit,
  onOpenStudentModal,
}) => {
  const t = translations[currentLanguage] || translations.en;
  const [greeting, setGreeting] = useState<string>("Good Morning");
  const [liveTime, setLiveTime] = useState<string>("");
  const [liveDate, setLiveDate] = useState<string>("");
  const [quote, setQuote] = useState<DailyQuote>(() => getDailyQuote());

  useEffect(() => {
    setQuote(getDailyQuote());
  }, [currentLanguage]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      if (currentLanguage === "hi") {
        if (hour < 12) setGreeting("शुभ प्रभात");
        else if (hour < 17) setGreeting("शुभ दोपहर");
        else setGreeting("शुभ संध्या");
      } else {
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 17) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
      }

      setLiveTime(
        now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
      );
      setLiveDate(
        now.toLocaleDateString(currentLanguage === "hi" ? "hi-IN" : "en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [currentLanguage]);

  const todayStr = getTodayString();

  // 1. Tasks Metrics for Today
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedTodayTasks = todayTasks.filter((t) => t.completed);
  const taskProgressPercent =
    todayTasks.length > 0
      ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
      : 0;

  // 2. Study Metrics (Today & Overall)
  const todayStudySessions = studySessions.filter((s) => {
    if (!s.timestamp) return false;
    const d = new Date(s.timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}` === todayStr;
  });

  const todayStudySeconds = todayStudySessions.reduce(
    (acc, s) => acc + (s.durationSeconds || 0),
    0
  );
  const todayStudyMinutes = Math.round(todayStudySeconds / 60);
  const todayStudyHours = Math.floor(todayStudyMinutes / 60);
  const todayStudyMinsRem = todayStudyMinutes % 60;

  const totalTargetStudyMinutes = subjects.reduce(
    (acc, s) => acc + s.targetMinutesPerWeek,
    0
  );
  const totalCompletedStudyMinutes = subjects.reduce(
    (acc, s) => acc + s.completedMinutes,
    0
  );
  const studyProgressPercent =
    totalTargetStudyMinutes > 0
      ? Math.min(
          100,
          Math.round((totalCompletedStudyMinutes / totalTargetStudyMinutes) * 100)
        )
      : 0;

  // 3. Water Metrics
  const waterProgressPercent =
    water.goal > 0 ? Math.min(100, Math.round((water.glasses / water.goal) * 100)) : 0;

  // 4. Overall Productivity Score
  let activeScoreCount = 0;
  let activeScoreSum = 0;

  if (todayTasks.length > 0) {
    activeScoreCount++;
    activeScoreSum += taskProgressPercent;
  }
  if (totalTargetStudyMinutes > 0) {
    activeScoreCount++;
    activeScoreSum += studyProgressPercent;
  }
  activeScoreCount++;
  activeScoreSum += waterProgressPercent;

  const overallScorePercent =
    activeScoreCount > 0 ? Math.round(activeScoreSum / activeScoreCount) : 0;

  // Stream Meta Helper
  const currentStream = activeStudent?.stream || "Commerce";
  const getStreamMeta = (s: string) => {
    if (s === "Science") {
      return {
        label: "Science Stream",
        icon: Atom,
        color: "text-cyan-400",
        badge: "PCM / PCB",
      };
    }
    if (s === "Arts / Humanities" || s === "Arts") {
      return {
        label: "Arts / Humanities",
        icon: Compass,
        color: "text-purple-400",
        badge: "Law / UPSC",
      };
    }
    return {
      label: "Commerce Stream",
      icon: TrendingUp,
      color: "text-emerald-400",
      badge: "CA / Finance",
    };
  };

  const streamMeta = getStreamMeta(currentStream);

  // Suggestions & Intelligence State
  const activeProfForSug: StudentProfile = activeStudent || {
    id: "default",
    name: settings.userName || "Student",
    classLevel: "Class 12",
    stream: "Commerce",
    board: "BSEB",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    return loadSmartSuggestionsState(activeStudent?.id).dismissedIds || [];
  });

  useEffect(() => {
    const loaded = loadSmartSuggestionsState(activeStudent?.id);
    setDismissedIds(loaded.dismissedIds || []);
  }, [activeStudent?.id]);

  const handleDismissSuggestion = (sugId: string) => {
    const updated = [...dismissedIds, sugId];
    setDismissedIds(updated);
    saveSmartSuggestionsState(
      { dismissedIds: updated, lastUpdated: Date.now() },
      activeStudent?.id
    );
  };

  const defaultExamProfile: ExamProfile = examProfile || {
    board: activeProfForSug.board || "BSEB",
    classLevel: activeProfForSug.classLevel || "Class 12",
    stream: activeProfForSug.stream || "Commerce",
    academicYear: "2025-2026",
    examName: `${activeProfForSug.classLevel} Board Exam`,
    startDate: getTodayString(),
    subjectExamDates: {},
    dailyStudyHours: 5,
  };

  const examReport = generateExamIntelligenceReport(
    activeProfForSug,
    defaultExamProfile,
    examTestRecords || [],
    academicSubjects,
    chapters,
    vviTopics,
    revisions,
    practiceSessions || [],
    careerProfile
  );

  const smartSuggestions = generateSmartSuggestions(
    activeProfForSug,
    tasks,
    subjects,
    academicSubjects,
    chapters,
    goals,
    water,
    habits,
    dismissedIds,
    examTestRecords || [],
    vviTopics,
    examReport
  );

  // Active Chapter for Continue Learning
  const activeChapter =
    chapters.find((c) => c.status === "in_progress") ||
    chapters.find((c) => c.status === "not_started") ||
    chapters[0];
  const activeChapterSubject = academicSubjects.find(
    (s) => s.id === activeChapter?.subjectId
  );
  const chapterProgress = activeChapter?.progress || 0;

  // Calculate live gamification state
  const qbankProgress = activeStudent ? loadQuestionBankProgress(activeStudent.id) : undefined;
  const gamification = calculateGamificationState(
    activeStudent,
    tasks,
    studySessions,
    focusLogs,
    habits,
    goals,
    examTestRecords,
    practiceSessions,
    qbankProgress
  );

  // Target exam details for countdown
  const targetExamName =
    examProfile?.targetExamName ||
    (activeStudent?.classLevel === "Class 10"
      ? "Class 10 Board Exam 2026"
      : activeStudent?.classLevel === "Class 12"
      ? "Class 12 Board Exam 2026"
      : "Annual Academic Exam 2026");

  const targetExamDateStr = examProfile?.examStartDate || "2026-03-01";
  const calculateDaysLeft = () => {
    try {
      const target = new Date(targetExamDateStr).getTime();
      const now = new Date().getTime();
      const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    } catch {
      return 180;
    }
  };
  const daysUntilExam = calculateDaysLeft();

  return (
    <div className="space-y-5 pb-24 md:pb-8 animate-in fade-in duration-200 max-w-6xl mx-auto">
      {/* 1. COMPACT STUDENT HEADER BAR */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full glass-pill border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Garia OS V3.0</span>
              </span>
              {activeStudent && (
                <button
                  onClick={onOpenStudentModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-300 text-[11px] font-medium transition-all"
                >
                  <span>
                    {activeStudent.name} • {activeStudent.classLevel} ({activeStudent.stream})
                  </span>
                </button>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
              {greeting}, {activeStudent?.name || settings.userName || "Student"}
            </h1>
            <p className="text-slate-400 text-xs">
              {currentLanguage === "hi"
                ? "आज का सुव्यवस्थित अध्ययन डैशबोर्ड। एक क्लिक में अध्ययन शुरू करें।"
                : "Your focused daily learning cockpit. Fast, clean, and distraction-free."}
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
            <div className="text-left sm:text-right">
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 leading-none">
                {liveTime}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{liveDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1.1 GAMIFICATION & EXAM READINESS COCKPIT ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* A. Level, XP & Streak Card */}
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900/90 to-slate-900/90 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-sm shadow-sm">
                L{gamification.currentLevel}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-heading text-white">
                    {gamification.levelTitle}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {gamification.totalXP} XP
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-amber-300 font-semibold">{gamification.currentStreak} Day Streak</span>
                  <span>•</span>
                  <span>{gamification.latestBadge?.icon || "🌱"} {gamification.latestBadge?.name || "Scholar"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("stats")}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-semibold border border-white/10 transition-all flex items-center gap-1"
            >
              <span>Badges</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-400">
              <span>Next Level Progress</span>
              <span className="font-mono text-emerald-400 font-semibold">{gamification.levelProgressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, gamification.levelProgressPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* B. Exam Countdown & Readiness Card */}
        <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900/90 to-slate-900/90 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-heading text-white truncate max-w-[180px]">
                    {targetExamName}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-300 font-bold font-mono">{daysUntilExam} Days Left</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">{examReport.overallReadinessScore || 70}% Ready</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("exam")}
              className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-[11px] font-semibold border border-cyan-500/30 transition-all flex items-center gap-1"
            >
              <span>Exam Prep</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Readiness Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-400">
              <span>Exam Readiness Score</span>
              <span className="font-mono text-cyan-400 font-semibold">{examReport.overallReadinessScore || 70}%</span>
            </div>
            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, examReport.overallReadinessScore || 70)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 1.2 DAILY MOTIVATIONAL QUOTE (Student Focused & Dynamic Rotation) */}
      <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-transparent flex items-start gap-3 relative overflow-hidden">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10">
          <Quote className="w-4 h-4" />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
              Daily Motivation
            </span>
            <span className="text-[9px] px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 capitalize">
              {quote.category}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-100 italic leading-relaxed">
            "{currentLanguage === "hi" && quote.hindiTranslation ? quote.hindiTranslation : quote.quote}"
          </p>
          <div className="text-[11px] text-slate-400 font-medium text-right">
            — <span className="text-amber-200">{quote.author}</span>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY QUICK ACCESS MODULES (6 Core Pillars) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold font-heading uppercase tracking-wider text-slate-400">
            Quick Access
          </h2>
          <span className="text-[10px] text-emerald-400 font-mono">Garia Core Ecosystem</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. Academic Center */}
          <button
            onClick={() => onNavigate("academic")}
            id="quick-access-academic"
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-blue-500/30 hover:border-blue-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-heading text-white truncate group-hover:text-blue-300 transition-colors">
                Academic Center
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Class 10, 11 & 12
              </div>
            </div>
          </button>

          {/* 2. Question Bank */}
          <button
            onClick={() => onNavigate("questionbank")}
            id="quick-access-questionbank"
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-cyan-500/30 hover:border-cyan-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-heading text-white truncate group-hover:text-cyan-300 transition-colors">
                Question Bank
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                MCQ, PYQ & Tests
              </div>
            </div>
          </button>

          {/* 3. Career Center */}
          <button
            onClick={() => onNavigate("career")}
            id="quick-access-career"
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-amber-500/30 hover:border-amber-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-heading text-white truncate group-hover:text-amber-300 transition-colors">
                Career Center
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Roadmaps & Jobs
              </div>
            </div>
          </button>

          {/* 4. Abya AI */}
          <button
            onClick={() => onNavigate("abya")}
            id="quick-access-abya"
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-purple-500/30 hover:border-purple-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-heading text-white truncate group-hover:text-purple-300 transition-colors">
                Abya AI
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                AI Mentor & Doubts
              </div>
            </div>
          </button>

          {/* 5. Study Intelligence */}
          <button
            onClick={() => onNavigate("stats")}
            id="quick-access-stats"
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-emerald-500/30 hover:border-emerald-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-heading text-white truncate group-hover:text-emerald-300 transition-colors">
                Study Intelligence
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Analytics & Score
              </div>
            </div>
          </button>

          {/* 6. Task Manager */}
          <button
            onClick={() => onNavigate("tasks")}
            id="quick-access-tasks"
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-rose-500/30 hover:border-rose-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-heading text-white truncate group-hover:text-rose-300 transition-colors">
                Task Manager
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Tasks & Routines
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2.2 ONE-TAP QUICK ACTIONS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <button
          onClick={() => onNavigate("study")}
          id="quick-action-start-study"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-left flex items-center gap-3 transition-all card-press group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold font-heading text-white truncate">
              {currentLanguage === "hi" ? "अध्ययन सत्र" : "Start Study"}
            </div>
            <div className="text-[10px] text-emerald-300/80 truncate">
              {currentLanguage === "hi" ? "सत्र शुरू करें" : "Track time & topics"}
            </div>
          </div>
        </button>

        <button
          onClick={onQuickAddTask}
          id="quick-action-add-task"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-left flex items-center gap-3 transition-all card-press group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold font-heading text-white truncate">
              {currentLanguage === "hi" ? "+ नया कार्य" : "+ Add Task"}
            </div>
            <div className="text-[10px] text-cyan-300/80 truncate">
              {currentLanguage === "hi" ? "दैनिक लक्ष्य जोड़ें" : "Quick daily to-do"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate("focus")}
          id="quick-action-focus-timer"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-left flex items-center gap-3 transition-all card-press group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Timer className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold font-heading text-white truncate">
              {currentLanguage === "hi" ? "पोमोडोरो फोकस" : "Focus Timer"}
            </div>
            <div className="text-[10px] text-amber-300/80 truncate">
              {currentLanguage === "hi" ? "25m / 50m सत्र" : "25m / 50m sessions"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate("gmail")}
          id="quick-action-gmail"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 border border-red-500/40 text-left flex items-center gap-3 transition-all card-press group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold font-heading text-white truncate">
              {currentLanguage === "hi" ? "स्टूडेंट मेल" : "Student Mail"}
            </div>
            <div className="text-[10px] text-red-300/80 truncate">
              {currentLanguage === "hi" ? "गूगल जीमेल इनबॉक्स" : "Gmail & templates"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate("abya")}
          id="quick-action-ask-abya"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 text-left flex items-center gap-3 transition-all card-press group col-span-2 sm:col-span-1"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold font-heading text-white truncate">
              {currentLanguage === "hi" ? "अव्या एआई चैट" : "Ask Abya AI"}
            </div>
            <div className="text-[10px] text-purple-300/80 truncate">
              {currentLanguage === "hi" ? "डाउट व प्रश्न पूछें" : "Instant doubt solver"}
            </div>
          </div>
        </button>
      </div>

      {/* 3. CONTINUE LEARNING HERO CARD */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900/80 to-cyan-950/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                <Play className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                {currentLanguage === "hi" ? "पढ़ाई जारी रखें" : "Continue Learning"}
              </span>
              {activeChapterSubject && (
                <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/10">
                  {activeChapterSubject.name}
                </span>
              )}
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {chapterProgress}% {currentLanguage === "hi" ? "पूर्ण" : "Completed"}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white font-heading truncate">
              {activeChapter?.title || "Active Board Syllabus Chapter"}
            </h2>
            <p className="text-xs text-slate-300 line-clamp-2 max-w-2xl">
              {activeChapter?.description ||
                "Deep conceptual breakdown with verified NCERT solutions, VVI topic markers, and curated question banks."}
            </p>

            {/* Chapter Progress Bar */}
            <div className="w-full max-w-xl bg-slate-800/90 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, chapterProgress)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <button
              onClick={() => onNavigate("academic")}
              id="hero-resume-study-btn"
              className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>{currentLanguage === "hi" ? "अध्ययन खोलें" : "Resume Study"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate("questionbank")}
              id="hero-qbank-btn"
              className="flex-1 md:flex-none px-4 py-3 rounded-2xl glass-pill hover:bg-white/10 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{currentLanguage === "hi" ? "प्रश्न बैंक" : "Solve PYQs"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN TWO-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN (7 COLS): Tasks, Focus Timer, Revision Due */}
        <div className="lg:col-span-7 space-y-5">
          {/* A. TODAY'S TASKS MATRIX */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <ListTodo className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white">
                    {currentLanguage === "hi" ? "आज के कार्य" : "Today's Tasks"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {todayTasks.length > 0
                      ? `${completedTodayTasks.length} of ${todayTasks.length} completed (${taskProgressPercent}%)`
                      : currentLanguage === "hi"
                      ? "आज के लिए कोई कार्य निर्धारित नहीं है।"
                      : "No tasks scheduled for today."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onQuickAddTask}
                  id="dashboard-add-task-btn"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1 border border-emerald-500/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentLanguage === "hi" ? "जोड़ें" : "New"}</span>
                </button>
                <button
                  onClick={() => onNavigate("tasks")}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {currentLanguage === "hi" ? "सभी देखें" : "View All"}
                </button>
              </div>
            </div>

            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask && onToggleTask(task)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer card-press ${
                      task.completed
                        ? "bg-slate-950/40 border-white/5 opacity-60"
                        : "bg-slate-900/60 hover:bg-slate-800/80 border-white/5 hover:border-emerald-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask && onToggleTask(task);
                        }}
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                          task.completed
                            ? "bg-emerald-500 border-emerald-400 text-slate-950"
                            : "border-slate-600 hover:border-emerald-400 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span
                        className={`text-xs font-medium truncate ${
                          task.completed ? "line-through text-slate-400" : "text-slate-100"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {task.priority && (
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase font-mono ${
                            task.priority === "high"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : task.priority === "medium"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-slate-700/50 text-slate-300 border border-slate-600/50"
                          }`}
                        >
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center space-y-1.5">
                <p className="text-xs text-slate-400">
                  {currentLanguage === "hi" ? "आज के लिए कोई कार्य नहीं है।" : "Your task list is all clear today."}
                </p>
                <button
                  onClick={onQuickAddTask}
                  className="text-xs text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{currentLanguage === "hi" ? "दैनिक कार्य जोड़ें" : "Add daily study task"}</span>
                </button>
              </div>
            )}
          </div>

          {/* B. FOCUS TIMER WIDGET */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white">
                    {currentLanguage === "hi" ? "पोमोडोरो व फोकस टाइमर" : "Focus Timer Launcher"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {currentLanguage === "hi"
                      ? "गहन अध्ययन के लिए टाइमर शुरू करें।"
                      : "Scientifically proven interval timers for maximum retention."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("focus")}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                {currentLanguage === "hi" ? "पूरा टाइमर" : "Full Screen"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => onNavigate("focus")}
                className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800 border border-amber-500/20 hover:border-amber-500/40 text-left transition-all card-press"
              >
                <div className="text-lg font-bold font-mono text-amber-400">25 Min</div>
                <div className="text-xs font-semibold text-white mt-0.5">
                  {currentLanguage === "hi" ? "पोमोडोरो सत्र" : "Standard Focus"}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">5m Rest</div>
              </button>

              <button
                onClick={() => onNavigate("focus")}
                className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800 border border-cyan-500/20 hover:border-cyan-500/40 text-left transition-all card-press"
              >
                <div className="text-lg font-bold font-mono text-cyan-400">50 Min</div>
                <div className="text-xs font-semibold text-white mt-0.5">
                  {currentLanguage === "hi" ? "गहन अध्ययन" : "Deep Work"}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">10m Rest</div>
              </button>

              <button
                onClick={() => onNavigate("study")}
                className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800 border border-emerald-500/20 hover:border-emerald-500/40 text-left transition-all card-press"
              >
                <div className="text-lg font-bold font-mono text-emerald-400">Log</div>
                <div className="text-xs font-semibold text-white mt-0.5">
                  {currentLanguage === "hi" ? "सत्र लॉग" : "Subject Logger"}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Real-time</div>
              </button>
            </div>
          </div>

          {/* C. REVISION DUE (Spaced Repetition) */}
          <div className="glass-card rounded-3xl p-5 border border-amber-500/20 bg-gradient-to-r from-amber-950/15 via-slate-900/60 to-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <RotateCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                    <span>{currentLanguage === "hi" ? "स्मार्ट रिवीजन कतार" : "Revision Due Today"}</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                      1-3-7-15-30
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {currentLanguage === "hi"
                      ? "विस्मरण वक्र को रोकने के लिए आज अनुशंसित विषय।"
                      : "Spaced repetition topics due for review before forgetting."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("questionbank")}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold transition-all flex items-center gap-1 border border-amber-500/30 shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{currentLanguage === "hi" ? "अभ्यास करें" : "Practice"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {revisions.length > 0 ? (
                revisions.slice(0, 2).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        {rev.topicName || "Key Chapter Concept"}
                      </div>
                      <div className="text-xs font-semibold text-white truncate mt-0.5">
                        Confidence: {rev.confidenceLevel || "Needs Review"}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Cycle #{rev.cycleCount || 1} • Due {rev.scheduledDate || "Today"}
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate("questionbank")}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors shrink-0"
                      title="Practice topic"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center text-xs text-slate-400">
                  {currentLanguage === "hi"
                    ? "सभी रिवीजन शेड्यूल अपडेट हैं। शानदार काम!"
                    : "All scheduled revisions are complete. Great job keeping your memory curve strong!"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 COLS): Progress Overview, Abya AI Suggestions */}
        <div className="lg:col-span-5 space-y-5">
          {/* A. PROGRESS OVERVIEW */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white">
                    {currentLanguage === "hi" ? "प्रगति सारांश" : "Progress Overview"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {currentLanguage === "hi" ? "दैनिक व साप्ताहिक अध्ययन मेट्रिक्स" : "Daily & weekly learning metrics"}
                  </p>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                {overallScorePercent}% Score
              </div>
            </div>

            {/* Productivity Score Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>{currentLanguage === "hi" ? "दैनिक उत्पादकता स्कोर" : "Daily Productivity"}</span>
                <span className="text-emerald-400 font-mono">{overallScorePercent}%</span>
              </div>
              <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, overallScorePercent)}%` }}
                />
              </div>
            </div>

            {/* Quick Metrics Mini Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
              {/* Study Hours */}
              <div
                onClick={() => onNavigate("study")}
                className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer card-press"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{currentLanguage === "hi" ? "अध्ययन समय" : "Study Time"}</span>
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-base font-bold font-heading text-white mt-1">
                  {todayStudyHours > 0
                    ? `${todayStudyHours}h ${todayStudyMinsRem}m`
                    : `${todayStudyMinutes} mins`}
                </div>
                <div className="text-[10px] text-cyan-400 mt-0.5">
                  {studyProgressPercent}% {currentLanguage === "hi" ? "साप्ताहिक लक्ष्य" : "weekly target"}
                </div>
              </div>

              {/* Water Intake */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-blue-500/30 transition-all card-press">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{currentLanguage === "hi" ? "जल स्तर" : "Hydration"}</span>
                  <Droplet className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-base font-bold font-heading text-white">
                    {water.glasses}/{water.goal} <span className="text-xs text-slate-400 font-normal">g</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {onRemoveWaterGlass && (
                      <button
                        onClick={onRemoveWaterGlass}
                        disabled={water.glasses <= 0}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                    )}
                    <button
                      onClick={onAddWaterGlass}
                      className="px-1.5 py-0.5 rounded bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs"
                    >
                      +1
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-blue-400 mt-0.5">
                  {waterProgressPercent}% {currentLanguage === "hi" ? "लक्ष्य" : "goal reached"}
                </div>
              </div>
            </div>

            {/* Stream Subjects Mini List */}
            {subjects.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {streamMeta.label}
                </div>
                <div className="space-y-1.5">
                  {subjects.slice(0, 3).map((sub) => {
                    const pct =
                      sub.targetMinutesPerWeek > 0
                        ? Math.min(
                            100,
                            Math.round((sub.completedMinutes / sub.targetMinutesPerWeek) * 100)
                          )
                        : 0;
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-2 text-xs p-2 rounded-xl bg-slate-900/40 border border-white/5"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: sub.color || "#10b981" }}
                          />
                          <span className="font-semibold text-white truncate">{sub.name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-cyan-400 font-bold shrink-0">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* B. ABYA AI SUGGESTIONS WIDGET */}
          <div className="glass-card rounded-3xl p-5 border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900/80 to-slate-900/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white flex items-center gap-1.5">
                    <span>{currentLanguage === "hi" ? "अव्या एआई सुझाव" : "Abya AI Suggestions"}</span>
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold">
                      Adaptive
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {currentLanguage === "hi"
                      ? "आपकी अध्ययन गति के आधार पर वैयक्तिकृत सिफारिशें।"
                      : "Personalized recommendations based on your recent activity."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("abya")}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-semibold transition-all flex items-center gap-1 border border-purple-500/30 shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{currentLanguage === "hi" ? "चैट करें" : "Ask AI"}</span>
              </button>
            </div>

            {/* Suggestions List */}
            <div className="space-y-2.5">
              {smartSuggestions.length > 0 ? (
                smartSuggestions.slice(0, 2).map((sug) => (
                  <div
                    key={sug.id}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/20 hover:border-purple-500/40 space-y-2 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate">{sug.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-2">
                          {sug.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <button
                        onClick={() => {
                          if (sug.targetTab) onNavigate(sug.targetTab as ActiveTab);
                        }}
                        className="text-[11px] text-purple-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>{sug.actionText || "Start Action"}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleDismissSuggestion(sug.id)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center space-y-1">
                  <p className="text-xs text-slate-300">
                    {currentLanguage === "hi"
                      ? "अव्या एआई का सुझाव: आज के 25 मिनट पोमोडोरो सत्र से शुरुआत करें!"
                      : "Abya AI Tip: Begin today with a 25-minute focused study session."}
                  </p>
                  <button
                    onClick={() => onNavigate("abya")}
                    className="text-xs text-purple-300 font-bold hover:underline"
                  >
                    {currentLanguage === "hi" ? "अव्या से मार्गदर्शन लें →" : "Get AI Strategy →"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
