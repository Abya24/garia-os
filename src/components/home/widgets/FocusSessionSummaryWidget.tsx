import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Timer,
  Play,
  Flame,
  ArrowRight,
  Zap,
  Clock,
  TrendingUp,
} from "lucide-react";
import { FocusSessionLog, ActiveTab } from "../../../types";
import { getTodayString, formatLocalDate } from "../../../utils/storage";
import { AppLanguage } from "../../../utils/i18n";

export interface FocusStreakSummary {
  currentFocusStreak: number;
  longestFocusStreak: number;
  focusedToday: boolean;
  nextMilestone: number;
  milestoneProgressPercent: number;
}

/**
 * Calculates the current Focus Streak (number of consecutive days with at least one focus session)
 * and longest historical Focus Streak.
 */
export function calculateFocusStreak(
  focusLogs: FocusSessionLog[] = []
): FocusStreakSummary {
  const safeLogs = Array.isArray(focusLogs) ? focusLogs : [];
  const focusDatesSet = new Set<string>();

  safeLogs.forEach((log) => {
    if (
      log &&
      log.type === "focus" &&
      (Number(log.durationMinutes) || 0) > 0 &&
      typeof log.date === "string" &&
      log.date.trim()
    ) {
      focusDatesSet.add(log.date.trim());
    }
  });

  const todayStr = getTodayString();
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterdayObj);

  const focusedToday = focusDatesSet.has(todayStr);

  // Count consecutive days backwards from today (or yesterday if today hasn't been logged yet)
  let currentFocusStreak = 0;
  if (focusedToday || focusDatesSet.has(yesterdayStr)) {
    const startOffset = focusedToday ? 0 : -1;
    for (let offset = startOffset; offset >= -365; offset--) {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const dStr = formatLocalDate(d);
      if (focusDatesSet.has(dStr)) {
        currentFocusStreak += 1;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak across sorted dates
  const sortedDates = Array.from(focusDatesSet).sort();
  let longestFocusStreak = currentFocusStreak;
  let currentRun = 0;
  let prevDateMs: number | null = null;

  sortedDates.forEach((dStr) => {
    const parts = dStr.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const utcMs = Date.UTC(parts[0], parts[1] - 1, parts[2]);
      if (prevDateMs !== null && Math.round((utcMs - prevDateMs) / 86400000) === 1) {
        currentRun += 1;
      } else {
        currentRun = 1;
      }
      if (currentRun > longestFocusStreak) {
        longestFocusStreak = currentRun;
      }
      prevDateMs = utcMs;
    }
  });

  const milestones = [3, 7, 14, 21, 30, 60, 100];
  const nextMilestone =
    milestones.find((m) => m > currentFocusStreak) || currentFocusStreak + 7;
  const milestoneProgressPercent = Math.min(
    100,
    Math.round((currentFocusStreak / nextMilestone) * 100)
  );

  return {
    currentFocusStreak,
    longestFocusStreak,
    focusedToday,
    nextMilestone,
    milestoneProgressPercent,
  };
}

export interface FocusSessionSummaryWidgetProps {
  focusLogs: FocusSessionLog[];
  currentLanguage?: AppLanguage;
  dailyTargetMinutes?: number;
  onNavigate: (tab: ActiveTab) => void;
  className?: string;
}

export const FocusSessionSummaryWidget: React.FC<FocusSessionSummaryWidgetProps> = ({
  focusLogs = [],
  currentLanguage = "en",
  dailyTargetMinutes = 100,
  onNavigate,
  className = "",
}) => {
  const todayStr = getTodayString();

  const stats = useMemo(() => {
    const safeLogs = Array.isArray(focusLogs) ? focusLogs : [];
    const focusOnlyLogs = safeLogs.filter((l) => l && l.type === "focus");

    const todayFocusLogs = focusOnlyLogs.filter((l) => l.date === todayStr);
    const todayFocusMinutes = todayFocusLogs.reduce(
      (sum, l) => sum + (Number(l.durationMinutes) || 0),
      0
    );
    const todaySessionsCount = todayFocusLogs.length;

    // Last 7 days focus minutes
    const last7DateSet = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7DateSet.add(formatLocalDate(d));
    }

    const weeklyFocusLogs = focusOnlyLogs.filter((l) => last7DateSet.has(l.date));
    const weeklyFocusMinutes = weeklyFocusLogs.reduce(
      (sum, l) => sum + (Number(l.durationMinutes) || 0),
      0
    );

    const targetMins = Math.max(25, dailyTargetMinutes);
    const progressPercent = Math.min(
      100,
      Math.round((todayFocusMinutes / targetMins) * 100)
    );

    const hours = Math.floor(todayFocusMinutes / 60);
    const remMins = todayFocusMinutes % 60;
    const formattedHoursMins =
      hours > 0 ? `${hours}h ${remMins}m` : `${todayFocusMinutes}m`;

    const streakInfo = calculateFocusStreak(safeLogs);

    return {
      todayFocusMinutes,
      todaySessionsCount,
      weeklyFocusMinutes,
      weeklySessionsCount: weeklyFocusLogs.length,
      targetMins,
      progressPercent,
      formattedHoursMins,
      ...streakInfo,
    };
  }, [focusLogs, todayStr, dailyTargetMinutes]);

  return (
    <motion.section
      id="home-focus-session-summary-widget"
      aria-label="Focus Session Summary"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`glass-card rounded-3xl p-5 sm:p-6 border border-cyan-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-cyan-950/25 shadow-lg flex flex-col justify-between gap-4 ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-medium">
              <span>
                {currentLanguage === "hi" ? "फोकस सेशन सारांश" : "Focus Session"}
              </span>
              <span aria-hidden="true">·</span>
              <span
                id="home-focus-streak-badge"
                className="inline-flex items-center gap-1 text-amber-300 font-semibold"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{stats.currentFocusStreak}d Focus Streak</span>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-heading tracking-tight truncate">
              {currentLanguage === "hi"
                ? "आज का फोकस समय और स्ट्रीक"
                : "Today's Focus & Streak"}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("focus")}
          className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/10 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>{currentLanguage === "hi" ? "टाइमर" : "Open Timer"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Stack: Today's Focus Minutes + Current Focus Streak */}
      <div className="space-y-3">
        {/* Box 1: Total Focus Minutes Logged Today + Animated Progress Indicator */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/25 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {currentLanguage === "hi"
                  ? "आज लॉग किए गए फोकस मिनट"
                  : "Focus Minutes Logged Today"}
              </span>
            </span>
            <span className="font-mono tabular-nums text-slate-300">
              {stats.formattedHoursMins}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span
                id="home-focus-minutes-today-value"
                className="text-3xl font-extrabold font-mono tabular-nums text-white tracking-tight"
              >
                {stats.todayFocusMinutes}
              </span>
              <span className="text-xs sm:text-sm font-bold text-cyan-200">
                {currentLanguage === "hi" ? "मिनट आज" : "mins today"}
              </span>
            </div>

            <span
              id="home-focus-sessions-today-count"
              className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono tabular-nums font-bold"
            >
              {stats.todaySessionsCount}{" "}
              {stats.todaySessionsCount === 1 ? "Session" : "Sessions"}
            </span>
          </div>

          {/* Animated Focus Session Daily Target Progress Indicator */}
          <div className="space-y-1.5 pt-1 border-t border-white/5">
            <div
              id="overview-focus-session-progress-track"
              role="progressbar"
              aria-label="Daily Focus Session Goal Progress"
              aria-valuenow={stats.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"
            >
              <motion.div
                id="overview-focus-session-progress-bar"
                initial={{ width: "0%", opacity: 0.4 }}
                animate={{
                  width: `${Math.max(5, stats.progressPercent)}%`,
                  opacity: 1,
                }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
              <span>
                {stats.progressPercent}% of {stats.targetMins}m daily goal
              </span>
              <span className="text-emerald-300">
                7d: {stats.weeklyFocusMinutes}m
              </span>
            </div>
          </div>
        </div>

        {/* Box 2: Current Focus Streak (Consecutive Days with >= 1 Focus Session) */}
        <div
          id="home-focus-streak-card"
          className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/25 space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Flame
                className={`w-3.5 h-3.5 ${
                  stats.currentFocusStreak > 0
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-400"
                }`}
              />
              <span>
                {currentLanguage === "hi"
                  ? "वर्तमान फोकस स्ट्रीक"
                  : "Current Focus Streak"}
              </span>
            </span>
            <span className="font-mono tabular-nums text-[11px] text-slate-400">
              Best: {stats.longestFocusStreak}d
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span
                id="home-focus-streak-value"
                className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white tracking-tight"
              >
                {stats.currentFocusStreak}
              </span>
              <span className="text-xs sm:text-sm font-bold text-amber-200">
                {stats.currentFocusStreak === 1
                  ? "Consecutive Day"
                  : "Consecutive Days"}
              </span>
            </div>

            <span className="text-[11px] font-mono tabular-nums text-slate-300 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>
                {stats.currentFocusStreak}/{stats.nextMilestone}d
              </span>
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Focus Streak Milestone Progress"
            aria-valuenow={stats.milestoneProgressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden"
          >
            <motion.div
              id="overview-focus-streak-progress-bar"
              initial={{ width: "0%", opacity: 0.4 }}
              animate={{
                width: `${Math.max(6, stats.milestoneProgressPercent)}%`,
                opacity: 1,
              }}
              transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Area: Quick Button to Start a New Session */}
      <div className="space-y-2">
        <button
          type="button"
          id="home-start-focus-session-btn"
          onClick={() => onNavigate("focus")}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Play className="w-4 h-4 fill-slate-950 text-slate-950 shrink-0" />
          <span>
            {currentLanguage === "hi"
              ? "नया फोकस सेशन शुरू करें"
              : "Start New Focus Session"}
          </span>
        </button>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => onNavigate("focus")}
            className="py-1.5 px-2.5 rounded-xl bg-slate-950/75 hover:bg-slate-900 border border-white/10 text-slate-300 hover:text-white font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>25m Pomodoro</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("focus")}
            className="py-1.5 px-2.5 rounded-xl bg-slate-950/75 hover:bg-slate-900 border border-white/10 text-slate-300 hover:text-white font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>50m Deep Work</span>
          </button>
        </div>
      </div>
    </motion.section>
  );
};

export const FocusTimerSummaryWidget = FocusSessionSummaryWidget;
export default FocusSessionSummaryWidget;
