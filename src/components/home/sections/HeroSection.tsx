import React, { useState } from "react";
import {
  Flame,
  Award,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Sliders,
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
import { PWAInstallOption } from "../../PWAInstallOption";

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
  onOpenMoreMenu?: () => void;
  onOpenSearch?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  activeStudent,
  settings,
  gamification,
  examReport,
  examProfile,
  formattedTime,
  formattedDate,
  displayGreeting,
  currentLanguage,
  todaysCompletedTasksCount,
  todaysTotalTasksCount,
  todayStudyMinutes,
  todayHabitsCompletedCount,
  totalHabitsCount,
  onNavigate,
}) => {
  const [dailyStudyTargetMins, setDailyStudyTargetMins] = useState<number>(
    (examProfile?.dailyStudyHours || 2) * 60
  );
  const [studyFocusModePreset, setStudyFocusModePreset] = useState<string>("balanced");

  const targetExamName =
    examProfile?.targetExamName ||
    examProfile?.examName ||
    (activeStudent
      ? `${activeStudent.classLevel || "Class 12"} ${activeStudent.stream || "Board"} Final Exams`
      : "Board Final Exams");

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

  const taskPct =
    todaysTotalTasksCount > 0
      ? Math.round((todaysCompletedTasksCount / todaysTotalTasksCount) * 100)
      : 80;
  const studyPct = Math.min(
    100,
    Math.round((todayStudyMinutes / Math.max(30, dailyStudyTargetMins)) * 100)
  );
  const habitPct =
    totalHabitsCount > 0
      ? Math.round((todayHabitsCompletedCount / totalHabitsCount) * 100)
      : 75;

  const weightMap: Record<string, { task: number; study: number; habit: number }> = {
    balanced: { task: 0.4, study: 0.4, habit: 0.2 },
    deep_study: { task: 0.25, study: 0.6, habit: 0.15 },
    task_sprint: { task: 0.6, study: 0.25, habit: 0.15 },
    consistency: { task: 0.3, study: 0.3, habit: 0.4 },
  };
  const weights = weightMap[studyFocusModePreset] || weightMap.balanced;

  const compositeScore = Math.min(
    100,
    Math.max(
      35,
      Math.round(
        taskPct * weights.task + studyPct * weights.study + habitPct * weights.habit
      )
    )
  );

  const studentName = getStudentDisplayName(activeStudent, settings, "Student");
  const studentStream = activeStudent?.stream || "Commerce";
  const studentClass = activeStudent?.classLevel || "Class 12";

  return (
    <section id="section-1-hero" className="space-y-4">
      {/* 1. Classic Scholar Greeting & Live Context Bar */}
      <div className="glass-card classic-frame rounded-2xl p-4 sm:p-5 border border-amber-500/25 bg-slate-900/90 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="classic-badge px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                {studentClass} · {studentStream}
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-classic tracking-tight">
                {displayGreeting},{" "}
                <span className="inline-block text-amber-200" dir="ltr">
                  {studentName}
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              {currentLanguage === "hi"
                ? "आपका क्लासिक अध्ययन कमांड सेंटर। आज के लक्ष्यों और अभ्यास पर ध्यान केंद्रित करें।"
                : "Your classic academic command desk. Stay disciplined and complete today's study milestones."}
            </p>
          </div>

          {/* Right: Live Clock, Date, Streak, Level & Exam Countdown */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Live Clock */}
            <div
              id="hero-live-clock"
              className="px-3 py-1.5 rounded-xl bg-slate-950/85 border border-amber-500/30 text-amber-200 text-xs font-mono tabular-nums font-bold flex items-center gap-1.5 shadow-inner"
              title="Current Local Time"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{formattedTime}</span>
            </div>

            {/* Current Date */}
            <div
              id="hero-current-date"
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-950/85 border border-white/10 text-slate-300 text-xs font-medium items-center gap-1.5 shadow-inner"
              title="Today's Date"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-rose-500/30 flex items-center gap-1.5 shadow-sm">
              <Flame className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span className="text-xs font-bold text-white font-mono tabular-nums">
                {gamification.currentStreak || 1}{" "}
                {currentLanguage === "hi" ? "दिन स्ट्रीक" : "Day Streak"}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 font-mono tabular-nums">
                Lv {gamification.currentLevel}
              </span>
            </div>

            <PWAInstallOption
              variant="compact-button"
              currentLanguage={currentLanguage}
            />

            <button
              type="button"
              id="hero-exam-countdown-card"
              onClick={() => onNavigate("exam")}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/35 flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
              title={targetExamName}
            >
              <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-mono tabular-nums font-bold text-cyan-300">
                {daysUntilExam}d
              </span>
              <span className="text-slate-300 hidden lg:inline truncate max-w-[130px]">
                {targetExamName}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. PRODUCTIVITY SCORE, DAILY TARGET SLIDER & SCORING PRESET DROPDOWN */}
      <div
        id="hero-productivity-dominant-card"
        className="glass-card classic-frame rounded-3xl p-6 sm:p-7 border border-emerald-500/35 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-emerald-950/35 shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Visual Productivity Gauge & Level */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-5 border-b lg:border-b-0 lg:border-r border-white/10 pb-5 lg:pb-0 lg:pr-6">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center p-2.5 bg-slate-950/85 border-2 border-amber-500/40 shadow-inner shrink-0">
              <div
                className="absolute inset-1 rounded-full border-4 border-emerald-400 border-t-amber-400 border-r-emerald-300 border-b-transparent"
                style={{ transform: "rotate(-45deg)" }}
              />
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums tracking-tighter">
                  {compositeScore}%
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-amber-300 font-classic uppercase tracking-wider">
                  Scholar Index
                </div>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{gamification.levelTitle || "Apex Scholar"}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white font-classic tracking-tight">
                Daily Productivity & Velocity
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {compositeScore >= 80
                  ? "High momentum — you are dominating your study targets today."
                  : compositeScore >= 50
                  ? "On track — keep pushing through your focus sessions."
                  : "Building momentum — complete your next task to level up."}
              </p>

              {/* Scoring Weight Dropdown inside Hero */}
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <label htmlFor="hero-scoring-preset-select" className="text-[11px] text-slate-400 font-semibold">
                  Index Mode:
                </label>
                <select
                  id="hero-scoring-preset-select"
                  value={studyFocusModePreset}
                  onChange={(e) => setStudyFocusModePreset(e.target.value)}
                  className="bg-slate-950/90 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-200 focus:outline-none cursor-pointer"
                >
                  <option value="balanced">Balanced Scholar (40/40/20)</option>
                  <option value="deep_study">Deep Study Priority (60% Study)</option>
                  <option value="task_sprint">Task Execution Sprint (60% Tasks)</option>
                  <option value="consistency">Habit Consistency (40% Habits)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right: XP Progress, Interactive Daily Study Target Slider & 3 Quick Pillars */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-slate-950/65 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Level {gamification.currentLevel} Experience</span>
                </span>
                <span className="font-mono tabular-nums text-emerald-400 font-bold">
                  {gamification.totalXP} / {gamification.xpForNextLevel} XP (
                  {gamification.levelProgressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${Math.max(6, gamification.levelProgressPercent)}%`,
                  }}
                />
              </div>

              {/* Interactive Daily Study Goal Slider */}
              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center justify-between sm:justify-start gap-2 text-xs">
                  <span className="text-slate-300 font-semibold">Daily Study Goal Slider:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {dailyStudyTargetMins} mins ({(dailyStudyTargetMins / 60).toFixed(1)}h)
                  </span>
                </div>
                <input
                  id="hero-daily-study-target-slider"
                  type="range"
                  min={30}
                  max={360}
                  step={15}
                  value={dailyStudyTargetMins}
                  onChange={(e) => setDailyStudyTargetMins(Number(e.target.value))}
                  aria-label="Daily Study Target Minutes Slider"
                  className="w-full sm:w-44 accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate("tasks")}
                className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/10 text-center sm:text-left space-y-0.5 transition-colors cursor-pointer"
              >
                <div className="text-[11px] text-slate-400 font-semibold">
                  Tasks Today
                </div>
                <div className="text-base sm:text-lg font-extrabold text-white font-mono tabular-nums">
                  {todaysCompletedTasksCount}/{todaysTotalTasksCount}
                </div>
                <div className="text-[10px] text-cyan-400 font-medium">
                  {taskPct}% Finished
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("study")}
                className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/10 text-center sm:text-left space-y-0.5 transition-colors cursor-pointer"
              >
                <div className="text-[11px] text-slate-400 font-semibold">
                  Study Time
                </div>
                <div className="text-base sm:text-lg font-extrabold text-white font-mono tabular-nums">
                  {todayStudyMinutes}m
                </div>
                <div className="text-[10px] text-emerald-400 font-medium">
                  {studyPct}% of {dailyStudyTargetMins}m
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("habits")}
                className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/10 text-center sm:text-left space-y-0.5 transition-colors cursor-pointer"
              >
                <div className="text-[11px] text-slate-400 font-semibold">
                  Habits Done
                </div>
                <div className="text-base sm:text-lg font-extrabold text-white font-mono tabular-nums">
                  {todayHabitsCompletedCount}/{totalHabitsCount}
                </div>
                <div className="text-[10px] text-amber-400 font-medium">
                  {habitPct}% Completed
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

