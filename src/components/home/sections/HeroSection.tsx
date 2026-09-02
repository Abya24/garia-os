import React from "react";
import {
  Flame,
  Award,
  Calendar,
  Clock,
  Menu,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ShieldAlert,
  RotateCcw,
  Zap,
  SlidersHorizontal,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  StudentProfile,
  UserSettings,
  ActiveTab,
  ExamProfile,
  ExamIntelligenceReport,
} from "../../../types";
import { GamificationState } from "../../../utils/gamificationEngine";
import { MotivationalQuote } from "../../../utils/quotes";
import { AppLanguage } from "../../../utils/i18n";
import { getStudentDisplayName } from "../../../utils/studentNameUtils";
import { GariaLogo } from "../../GariaLogo";
import { LanguageSwitcher } from "../../LanguageSwitcher";

interface HeroSectionProps {
  activeStudent?: StudentProfile;
  settings: UserSettings;
  gamification: GamificationState;
  examReport: ExamIntelligenceReport | null;
  examProfile?: ExamProfile;
  activeQuote: MotivationalQuote;
  onNextQuote: () => void;
  formattedTime: string;
  formattedDate: string;
  displayGreeting: string;
  currentLanguage: AppLanguage;
  onUpdateLanguage?: (lang: AppLanguage) => void;
  todaysCompletedTasksCount: number;
  todaysTotalTasksCount: number;
  todayStudyMinutes: number;
  todayHabitsCompletedCount: number;
  totalHabitsCount: number;
  onNavigate: (tab: ActiveTab) => void;
  onOpenSliderMenu?: () => void;
  onOpenCustomizer?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  activeStudent,
  settings,
  gamification,
  examReport,
  examProfile,
  activeQuote,
  onNextQuote,
  formattedTime,
  formattedDate,
  displayGreeting,
  currentLanguage,
  onUpdateLanguage,
  todaysCompletedTasksCount,
  todaysTotalTasksCount,
  todayStudyMinutes,
  todayHabitsCompletedCount,
  totalHabitsCount,
  onNavigate,
  onOpenSliderMenu,
  onOpenCustomizer,
}) => {
  const targetExamName =
    examProfile?.targetExamName ||
    (activeStudent
      ? `${activeStudent.classLevel || "Class 12"} ${activeStudent.stream || "Board"} Final Exams`
      : "Board Final Exams");

  // Calculate days until exam
  let daysUntilExam = 60;
  if (examProfile?.targetExamDate) {
    const examDate = new Date(examProfile.targetExamDate);
    const now = new Date();
    const diffTime = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) daysUntilExam = diffDays;
  } else if (examReport?.daysUntilExam) {
    daysUntilExam = examReport.daysUntilExam;
  }

  // Calculate composite Productivity Score (0 - 100%)
  const taskPct =
    todaysTotalTasksCount > 0
      ? Math.round((todaysCompletedTasksCount / todaysTotalTasksCount) * 100)
      : 80;
  const studyPct = Math.min(100, Math.round((todayStudyMinutes / 120) * 100));
  const habitPct =
    totalHabitsCount > 0
      ? Math.round((todayHabitsCompletedCount / totalHabitsCount) * 100)
      : 75;

  const compositeScore = Math.min(
    100,
    Math.max(
      35,
      Math.round(taskPct * 0.4 + studyPct * 0.4 + habitPct * 0.2)
    )
  );

  const studentName = getStudentDisplayName(activeStudent, settings, "Student");
  const studentStream = activeStudent?.stream || "Commerce";
  const studentClass = activeStudent?.classLevel || "Class 12";

  // Diagnostic trace for verification
  if (process.env.NODE_ENV !== "production") {
    console.debug("[Name Trace - HeroSection]", {
      rawActiveStudentName: activeStudent?.name,
      rawSettingsUserName: settings?.userName,
      resolvedDisplayName: studentName,
      displayGreeting,
    });
  }

  return (
    <section id="section-1-hero" className="space-y-4">
      {/* 1. Top Header Bar: Logo, Date/Time, & System Menu */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 bg-slate-900/80 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Slogan */}
          <div className="flex items-center justify-center sm:justify-start w-full sm:w-auto">
            <GariaLogo
              size="md"
              variant="horizontal"
              showTagline={true}
              withGlow={true}
              onClick={onOpenSliderMenu}
              className="cursor-pointer hover:opacity-95 transition-opacity"
            />
          </div>

          {/* Right: Language Switcher, Date, Time & Menu */}
          <div className="flex items-center justify-center sm:justify-end gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {/* Language Switcher */}
            <LanguageSwitcher
              currentLanguage={currentLanguage}
              onLanguageChange={onUpdateLanguage}
              variant="pill"
            />

            {/* Live Clock Badge */}
            <div
              id="hero-live-clock"
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-purple-500/30 text-purple-200 text-xs font-mono font-bold flex items-center gap-2 shadow-inner"
              title="Current Local Time"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{formattedTime}</span>
            </div>

            {/* Current Date Badge */}
            <div
              id="hero-current-date"
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5 shadow-inner"
              title="Today's Date"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>

            {/* Menu Trigger */}
            {onOpenSliderMenu && (
              <button
                onClick={onOpenSliderMenu}
                id="hero-menu-trigger-btn"
                title="Open Navigation Menu"
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all card-press"
              >
                <Menu className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Menu</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Greeting & Student Context Bar */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-heading tracking-tight">
                {displayGreeting}, <span className="inline-block" dir="ltr">{studentName}</span>! 👋
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {studentClass} • {studentStream}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              {currentLanguage === "hi"
                ? "आपका दैनिक कमांड सेंटर। आज के अध्ययन और अभ्यास पर ध्यान केंद्रित करें।"
                : "Your student command center. Stay consistent and conquer today's study goals."}
            </p>
          </div>

          {/* Quick Streak & Level Badges */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-rose-500/30 flex items-center gap-2 shadow-sm">
              <Flame className="w-4 h-4 text-rose-400 fill-rose-400" />
              <div>
                <span className="text-xs font-bold text-white font-mono">
                  {gamification.currentStreak || 1} {currentLanguage === "hi" ? "दिन स्ट्रीक" : "Day Streak"}
                </span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-amber-500/30 flex items-center gap-2 shadow-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-amber-300 font-mono">
                  Level {gamification.currentLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRODUCTIVITY SCORE (LARGE HERO CARD - VISUALLY DOMINANT) */}
      <div
        id="hero-productivity-dominant-card"
        className="glass-card rounded-3xl p-6 sm:p-7 border-2 border-emerald-500/40 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-emerald-950/40 shadow-2xl relative overflow-hidden group"
      >
        {/* Glow backdrop effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Huge Visual Productivity Gauge & Level */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-5 border-b lg:border-b-0 lg:border-r border-white/10 pb-5 lg:pb-0 lg:pr-6">
            {/* Circular / Radial Score Meter */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center p-2.5 bg-slate-950/80 border-2 border-emerald-500/40 shadow-inner shrink-0">
              {/* Radial gradient border ring */}
              <div
                className="absolute inset-1 rounded-full border-4 border-emerald-400 border-t-cyan-400 border-r-emerald-300 border-b-transparent animate-pulse"
                style={{ transform: "rotate(-45deg)" }}
              />
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tighter">
                  {compositeScore}%
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-heading">
                  Productivity
                </div>
              </div>
            </div>

            {/* Level Title & Status */}
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{gamification.levelTitle || "Apex Scholar"}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white font-heading tracking-tight">
                Daily Productivity Score
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {compositeScore >= 80
                  ? "🔥 High Momentum! You're dominating your study targets today."
                  : compositeScore >= 50
                  ? "⚡ On Track! Keep pushing through your focus sessions."
                  : "🌱 Building Momentum! Complete your next task to level up."}
              </p>
            </div>
          </div>

          {/* Right: XP Progress & 3 Quick Velocity Breakdown Pillars */}
          <div className="lg:col-span-7 space-y-4">
            {/* XP Progress Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Level {gamification.currentLevel} Experience</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {gamification.totalXP} / {gamification.xpForNextLevel} XP ({gamification.levelProgressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(6, gamification.levelProgressPercent)}%` }}
                />
              </div>
            </div>

            {/* 3 Velocity Breakdown Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Pillar 1: Tasks Today */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/50 border border-white/5 text-center sm:text-left space-y-0.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Tasks Today
                </div>
                <div className="text-base sm:text-lg font-extrabold text-white font-mono">
                  {todaysCompletedTasksCount}/{todaysTotalTasksCount}
                </div>
                <div className="text-[10px] text-cyan-400 font-medium">
                  {taskPct}% Finished
                </div>
              </div>

              {/* Pillar 2: Deep Focus */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/50 border border-white/5 text-center sm:text-left space-y-0.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Study Time
                </div>
                <div className="text-base sm:text-lg font-extrabold text-white font-mono">
                  {todayStudyMinutes}m
                </div>
                <div className="text-[10px] text-emerald-400 font-medium">
                  {studyPct}% of Daily Target
                </div>
              </div>

              {/* Pillar 3: Habit Streak */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/50 border border-white/5 text-center sm:text-left space-y-0.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Habits Done
                </div>
                <div className="text-base sm:text-lg font-extrabold text-white font-mono">
                  {todayHabitsCompletedCount}/{totalHabitsCount}
                </div>
                <div className="text-[10px] text-amber-400 font-medium">
                  {habitPct}% Completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXAM COUNTDOWN & TODAY'S FOCUS MESSAGE (SIDE-BY-SIDE ON DESKTOP) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Exam Countdown Card (5 cols) */}
        <div
          id="hero-exam-countdown-card"
          className="md:col-span-5 glass-card rounded-2xl p-4 sm:p-5 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900/90 to-slate-900/90 flex flex-col justify-between space-y-3 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Target Exam Countdown
                </h3>
                <div className="text-sm font-bold text-white truncate max-w-[200px]">
                  {targetExamName}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("exam")}
              className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-semibold border border-cyan-500/30 flex items-center gap-1 transition-all active:scale-95 shrink-0"
            >
              <span>Exam Center</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-baseline gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <span className="text-3xl font-black text-cyan-300 font-mono tracking-tight">
              {daysUntilExam}
            </span>
            <span className="text-sm font-bold text-slate-300 font-heading">
              Days Remaining
            </span>
            <span className="ml-auto text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {examReport?.overallReadinessScore || 82}% Readiness
            </span>
          </div>
        </div>

        {/* Today's Focus Message & Motivational Quote (7 cols) */}
        <div
          id="hero-focus-message-card"
          className="md:col-span-7 glass-card rounded-2xl p-4 sm:p-5 border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-slate-900/90 to-slate-900/90 flex flex-col justify-between space-y-3 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-300" />
              </div>
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Today&apos;s Focus & Motivation
              </h3>
            </div>

            <button
              onClick={onNextQuote}
              title="Next Motivational Quote"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-300" />
            </button>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <p className="text-xs sm:text-sm font-medium text-slate-100 italic leading-relaxed line-clamp-2">
              &ldquo;{activeQuote.quote}&rdquo;
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-purple-300 font-semibold">
                — {activeQuote.author}
              </span>
              {activeQuote.hindiTranslation && (
                <span className="text-[10px] text-slate-400 font-normal truncate max-w-[200px]">
                  {activeQuote.hindiTranslation}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
