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
  Zap,
} from "lucide-react";
import { StudySession, FocusSessionLog, ActiveTab } from "../types";
import {
  calculateStudyStreak,
  generateStudyStreakShareSnippet,
} from "../utils/gamificationEngine";
import { AppLanguage } from "../utils/i18n";

export interface StudyStreakProps {
  studySessions: StudySession[];
  focusLogs?: FocusSessionLog[];
  studentName?: string;
  currentLanguage?: AppLanguage;
  dailyTargetMinutes?: number;
  todayTotalStudyMinutes?: number;
  onNavigate?: (tab: ActiveTab) => void;
  className?: string;
}

export const StudyStreak: React.FC<StudyStreakProps> = ({
  studySessions = [],
  focusLogs = [],
  studentName = "Student",
  currentLanguage = "en",
  dailyTargetMinutes = 180,
  todayTotalStudyMinutes,
  onNavigate,
  className = "",
}) => {
  // Combine logged study sessions with focus logs converted into session-like entries
  // so consecutive days of either Study Tracker or Focus Timer sessions count accurately
  const mergedSessions = useMemo<StudySession[]>(() => {
    const base = Array.isArray(studySessions) ? studySessions : [];
    const focusAsSessions: StudySession[] = (Array.isArray(focusLogs) ? focusLogs : [])
      .filter((f) => f && f.type === "focus" && f.durationMinutes > 0 && f.date)
      .map((f) => ({
        id: `focus-sync-${f.id}`,
        subjectId: "focus",
        subjectName: "Focus Session",
        durationSeconds: f.durationMinutes * 60,
        date: f.date,
        timestamp: f.completedAt || Date.now(),
      }));
    return [...base, ...focusAsSessions];
  }, [studySessions, focusLogs]);

  const streakStats = useMemo(
    () => calculateStudyStreak(mergedSessions),
    [mergedSessions]
  );

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
      id="home-study-streak-component"
      data-testid="study-streak-component"
      aria-label="Study Streak Tracker"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`glass-card rounded-3xl p-5 sm:p-6 border border-amber-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-amber-950/20 shadow-lg flex flex-col justify-between gap-4 ${className}`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shrink-0 shadow-inner">
            <Flame
              className={`w-5 h-5 transition-transform duration-200 ${
                streakStats.currentStreak > 0
                  ? "text-amber-400 fill-amber-400 scale-110"
                  : "text-slate-400"
              }`}
            />
            {streakStats.studiedToday && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950"
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <span>
                {currentLanguage === "hi"
                  ? "अध्ययन स्ट्रीक (Study Streak)"
                  : "Study Streak"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">
                {streakStats.studiedToday
                  ? currentLanguage === "hi"
                    ? "आज सक्रिय ✓"
                    : "Logged Today ✓"
                  : currentLanguage === "hi"
                  ? "आज का सत्र लॉग करें"
                  : "Log a session today"}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-heading tracking-tight">
              {currentLanguage === "hi"
                ? "लगातार अध्ययन दिवस व साप्ताहिक निरंतरता"
                : "Consecutive Study Streak & Weekly Consistency"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            id="study-streak-share-btn"
            onClick={handleShareStreak}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            title="Copy shareable study streak summary"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Share</span>
              </>
            )}
          </button>

          {onNavigate && (
            <button
              type="button"
              id="study-streak-log-session-btn"
              onClick={() => onNavigate("study")}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer shadow-sm"
            >
              <span>
                {currentLanguage === "hi" ? "अध्ययन लॉग करें" : "Log Study"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Streak Count + Weekly Hours Split */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-stretch">
        {/* Left: Visually Engaging Consecutive Day Streak Counter (6 cols) */}
        <div className="sm:col-span-6 p-4 rounded-2xl bg-slate-950/75 border border-white/10 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Current Streak</span>
            </span>
            <span className="font-mono tabular-nums">
              Best: {streakStats.longestStreak}d · Total: {streakStats.totalStudyDays}d
            </span>
          </div>

          <div className="flex items-baseline gap-2.5 py-0.5">
            <span
              id="study-streak-count-value"
              data-testid="study-streak-count-value"
              className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white tracking-tight"
            >
              {streakStats.currentStreak}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-amber-200 leading-tight">
                {streakStats.currentStreak === 1
                  ? "Consecutive Day"
                  : "Consecutive Days"}
              </span>
              <span className="text-[11px] text-slate-400">
                {streakStats.currentStreak > 0
                  ? "Keep logging daily to protect your chain"
                  : "Start a study session today to ignite your streak"}
              </span>
            </div>
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
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(6, streakStats.milestoneProgressPercent)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
              <span className="flex items-center gap-1 text-slate-300 font-sans">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Next Target: {streakStats.nextMilestone}-Day Milestone</span>
              </span>
              <span>{streakStats.milestoneProgressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Right: Weekly & Today Study Hours (6 cols) */}
        <div className="sm:col-span-6 p-4 rounded-2xl bg-slate-950/75 border border-cyan-500/25 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Study Volume (7 Days)</span>
            </span>
            <span className="font-mono tabular-nums">
              {streakStats.weeklySessionsCount}{" "}
              {streakStats.weeklySessionsCount === 1 ? "session" : "sessions"}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 py-0.5">
            <div className="flex items-baseline gap-2">
              <span
                id="study-streak-weekly-hours-value"
                className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white tracking-tight"
              >
                {streakStats.weeklyStudyHours}
              </span>
              <span className="text-sm font-bold text-cyan-200">
                hrs this week
              </span>
            </div>

            <span className="text-xs font-mono tabular-nums text-emerald-300 font-semibold">
              Today: {todayStudyHours}h ({effectiveTodayMinutes}m)
            </span>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-white/5">
            <div
              role="progressbar"
              aria-label="Daily Study Target Progress"
              aria-valuenow={dailyStudyProgressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(6, dailyStudyProgressPercent)}%`,
                }}
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
      </div>

      {/* 7-Day Consecutive Study Chain Strip */}
      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold">
            {currentLanguage === "hi"
              ? "पिछले 7 दिनों की अध्ययन श्रृंखला"
              : "Last 7 Days Study Activity Chain"}
          </span>
          <span className="font-mono tabular-nums text-amber-300 font-bold">
            {activeDaysThisWeek}/7 Days Logged
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {streakStats.last7Days.map((day) => (
            <div
              key={day.date}
              title={`${day.shortDate} (${day.dayLabel}): ${day.minutes} mins (${day.sessionsCount} sessions)`}
              className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-between gap-1 ${
                day.studied
                  ? day.isToday
                    ? "bg-amber-500/20 border-amber-400/60 text-white shadow-sm"
                    : "bg-emerald-500/15 border-emerald-500/35 text-emerald-200"
                  : day.isToday
                  ? "bg-slate-900/90 border-amber-500/40 border-dashed text-slate-300"
                  : "bg-slate-900/50 border-white/5 text-slate-500"
              }`}
            >
              <span className="text-[10px] font-bold tracking-tight">
                {day.isToday ? "Today" : day.dayLabel}
              </span>

              <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                {day.studied ? (
                  day.streakMaintained ? (
                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                )}
              </div>

              <span className="text-[10px] font-mono tabular-nums text-slate-300">
                {day.minutes > 0 ? `${day.minutes}m` : "0m"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default StudyStreak;
