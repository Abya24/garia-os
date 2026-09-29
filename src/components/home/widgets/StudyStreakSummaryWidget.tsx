import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Clock,
  Share2,
  Check,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { StudySession, ActiveTab } from "../../../types";
import {
  calculateStudyStreak,
  generateStudyStreakShareSnippet,
} from "../../../utils/gamificationEngine";
import { AppLanguage } from "../../../utils/i18n";

export interface StudyStreakSummaryWidgetProps {
  studySessions: StudySession[];
  studentName?: string;
  currentLanguage?: AppLanguage;
  dailyTargetMinutes?: number;
  todayTotalStudyMinutes?: number;
  onNavigate: (tab: ActiveTab) => void;
  className?: string;
}

export const StudyStreakSummaryWidget: React.FC<StudyStreakSummaryWidgetProps> = ({
  studySessions = [],
  studentName = "Student",
  currentLanguage = "en",
  dailyTargetMinutes = 180,
  todayTotalStudyMinutes,
  onNavigate,
  className = "",
}) => {
  const streakStats = useMemo(
    () => calculateStudyStreak(studySessions),
    [studySessions]
  );

  const [sharedSnippet, setSharedSnippet] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const activeDaysThisWeek = streakStats.last7Days.filter((d) => d.studied).length;

  const effectiveTodayMinutes =
    typeof todayTotalStudyMinutes === "number"
      ? Math.max(streakStats.todayMinutes, todayTotalStudyMinutes)
      : streakStats.todayMinutes;

  const todayStudyHours = Number((effectiveTodayMinutes / 60).toFixed(1));
  const targetDailyMins = Math.max(30, dailyTargetMinutes);
  const dailyTargetHours = Number((targetDailyMins / 60).toFixed(1));
  const dailyStudyProgressPercent = Math.min(
    100,
    Math.round((effectiveTodayMinutes / targetDailyMins) * 100)
  );

  const handleShareStreak = async () => {
    const snippet = generateStudyStreakShareSnippet(streakStats, studentName);
    setSharedSnippet(snippet);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(snippet);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <motion.section
      id="home-study-streak-summary-widget"
      aria-label="Study Streak and Weekly Study Hours Summary"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`glass-card rounded-3xl p-5 sm:p-6 border border-amber-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-amber-950/20 shadow-lg flex flex-col justify-between gap-4 ${className}`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shrink-0">
            <Flame
              className={`w-5 h-5 ${
                streakStats.currentStreak > 0
                  ? "text-amber-400 fill-amber-400"
                  : "text-slate-400"
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <span>
                {currentLanguage === "hi"
                  ? "अध्ययन निरंतरता और साप्ताहिक घंटे"
                  : "Study Streak & Study Hours"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">
                {streakStats.studiedToday ? "Active Today ✓" : "Log Today's Session"}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-heading tracking-tight">
              {currentLanguage === "hi"
                ? "इस सप्ताह के कुल अध्ययन घंटे और स्ट्रीक"
                : "Study Streak & Total Study Hours"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            id="home-share-study-streak-btn"
            onClick={handleShareStreak}
            className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            title="Generate shareable study consistency summary"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Snippet Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Share Streak</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate("study")}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer"
          >
            <span>Study Tracker</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>

      {/* Main Metrics Grid: Current Streak + Daily & Weekly Study Hours + 7-Day Consistency */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-stretch">
        {/* Card 1: Current Consecutive Study Streak (6 cols) */}
        <div className="sm:col-span-6 p-4 rounded-2xl bg-slate-950/75 border border-white/10 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-300">Current Study Streak</span>
            <span className="font-mono tabular-nums">
              Best: {streakStats.longestStreak}d
            </span>
          </div>

          <div className="flex items-baseline gap-2 py-0.5">
            <span
              id="home-widget-current-streak-value"
              className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white tracking-tight"
            >
              {streakStats.currentStreak}
            </span>
            <span className="text-sm font-bold text-slate-300">
              {streakStats.currentStreak === 1
                ? "Consecutive Day"
                : "Consecutive Days"}
            </span>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-white/5">
            <div
              role="progressbar"
              aria-label="Study Streak Milestone Progress"
              aria-valuenow={streakStats.milestoneProgressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"
            >
              <motion.div
                id="overview-study-streak-progress-bar"
                initial={{ width: "0%", opacity: 0.4 }}
                animate={{
                  width: `${Math.max(6, streakStats.milestoneProgressPercent)}%`,
                  opacity: 1,
                }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
              <span className="flex items-center gap-1 text-slate-300 font-sans">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Next: {streakStats.nextMilestone}-Day Milestone</span>
              </span>
              <span>{streakStats.milestoneProgressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Study Hours This Week & Daily Study Hours Progress (6 cols) */}
        <div className="sm:col-span-6 p-4 rounded-2xl bg-slate-950/75 border border-cyan-500/25 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Daily & Weekly Study Hours</span>
            </span>
            <span className="font-mono tabular-nums">
              {streakStats.weeklySessionsCount}{" "}
              {streakStats.weeklySessionsCount === 1 ? "session" : "sessions"}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 py-0.5">
            <div className="flex items-baseline gap-2">
              <span
                id="home-widget-weekly-study-hours-value"
                className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white tracking-tight"
              >
                {streakStats.weeklyStudyHours}
              </span>
              <span className="text-sm font-bold text-cyan-200">
                hrs this week
              </span>
            </div>

            <span
              id="home-widget-daily-study-hours-badge"
              className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono tabular-nums font-bold"
            >
              Today: {todayStudyHours}h ({effectiveTodayMinutes}m)
            </span>
          </div>

          {/* Animated Daily Study Hours Progress Indicator */}
          <div className="space-y-1.5 pt-1 border-t border-white/5">
            <div
              id="overview-daily-study-hours-progress-track"
              role="progressbar"
              aria-label="Daily Study Hours Progress"
              aria-valuenow={dailyStudyProgressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"
            >
              <motion.div
                id="overview-daily-study-hours-progress-bar"
                initial={{ width: "0%", opacity: 0.4 }}
                animate={{
                  width: `${Math.max(6, dailyStudyProgressPercent)}%`,
                  opacity: 1,
                }}
                transition={{ duration: 0.85, delay: 0.08, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
              <span className="font-sans text-slate-300">
                Daily Goal: {todayStudyHours}h / {dailyTargetHours}h
              </span>
              <span className="text-emerald-300 font-bold">
                {dailyStudyProgressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: 7-Day Mini Consistency Strip (12 cols) */}
        <div className="sm:col-span-12 p-3.5 rounded-2xl bg-slate-950/75 border border-white/10 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-200">7-Day Consistency</span>
            <span className="font-mono tabular-nums text-amber-300">
              {activeDaysThisWeek}/7 Days Active
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {streakStats.last7Days.map((day) => (
              <div
                key={day.date}
                className={`p-1.5 rounded-xl border text-center flex flex-col items-center gap-1 ${
                  day.studied
                    ? "bg-amber-500/15 border-amber-500/40 text-white"
                    : day.isToday
                    ? "bg-slate-900 border-cyan-500/40 text-slate-300"
                    : "bg-slate-900/50 border-white/5 text-slate-500"
                }`}
                title={`${day.date}: ${day.minutes}m studied`}
              >
                <span className="text-[10px] font-semibold truncate">
                  {day.dayLabel.slice(0, 3)}
                </span>
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                    day.studied ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-600"
                  }`}
                >
                  {day.studied ? (
                    <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                  ) : (
                    <span className="text-[9px] font-mono">—</span>
                  )}
                </div>
                <span className="text-[10px] font-mono tabular-nums text-slate-400">
                  {day.studied ? `${day.minutes}m` : "0m"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shareable Consistency Text Snippet Preview */}
      {sharedSnippet && (
        <div
          id="home-study-streak-share-snippet-box"
          className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed flex-1">
            {sharedSnippet}
          </pre>
          <button
            type="button"
            onClick={() => setSharedSnippet(null)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs text-slate-300 self-end sm:self-center shrink-0 cursor-pointer"
          >
            Hide Snippet
          </button>
        </div>
      )}
    </motion.section>
  );
};

export default StudyStreakSummaryWidget;
