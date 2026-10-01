import React, { useState, useEffect, useCallback } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Zap,
  Coffee,
} from "lucide-react";
import { FocusSessionLog, ActiveTab } from "../types";
import { getTodayString, loadFocusSessions, saveFocusSessions } from "../utils/storage";
import { formatSecondsToMSS } from "../utils/dateTimeUtils";
import { sendNotification } from "../utils/notifications";
import { AppLanguage } from "../utils/i18n";
import {
  playFocusTimerChime,
  saveQuickFocusSessionState,
  loadQuickFocusSessionState,
} from "../pages/FocusTimer";

export interface QuickFocusWidgetProps {
  focusLogs?: FocusSessionLog[];
  profileId?: string;
  currentLanguage?: AppLanguage;
  onLogFocusSession?: (log: Omit<FocusSessionLog, "id">) => void;
  onNavigate?: (tab: ActiveTab) => void;
  onRunningStateChange?: (isRunning: boolean) => void;
  className?: string;
}

const POMODORO_MINUTES = 25;
const POMODORO_SECONDS = POMODORO_MINUTES * 60;
const SHORT_BREAK_MINUTES = 5;

export const QuickFocusWidget: React.FC<QuickFocusWidgetProps> = ({
  focusLogs = [],
  profileId,
  currentLanguage = "en",
  onLogFocusSession,
  onNavigate,
  onRunningStateChange,
  className = "",
}) => {
  const todayStr = getTodayString();

  const initialSession = loadQuickFocusSessionState();
  const [mode, setMode] = useState<"focus" | "break">(
    initialSession?.mode || "focus"
  );
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(
    initialSession && initialSession.remainingSeconds > 0
      ? initialSession.remainingSeconds
      : POMODORO_SECONDS
  );
  const [isRunning, setIsRunning] = useState<boolean>(
    Boolean(initialSession?.isRunning)
  );
  const [sessionFeedback, setSessionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (onRunningStateChange) {
      onRunningStateChange(isRunning);
    }
  }, [isRunning, onRunningStateChange]);

  const totalModeSeconds =
    (mode === "focus" ? POMODORO_MINUTES : SHORT_BREAK_MINUTES) * 60;
  const progressPercent =
    totalModeSeconds > 0
      ? Math.round(
          ((totalModeSeconds - timeLeftSeconds) / totalModeSeconds) * 100
        )
      : 0;

  const logSessionRecord = useCallback(
    (sessionMode: "focus" | "break", durationMinutes: number) => {
      const payload: Omit<FocusSessionLog, "id"> = {
        type: sessionMode,
        durationMinutes,
        completedAt: Date.now(),
        date: todayStr,
      };
      if (onLogFocusSession) {
        onLogFocusSession(payload);
      } else {
        const existing = loadFocusSessions(profileId);
        const created: FocusSessionLog = {
          ...payload,
          id: `focus-${Date.now()}`,
        };
        saveFocusSessions([created, ...existing], profileId);
      }
    },
    [onLogFocusSession, profileId, todayStr]
  );

  const completePomodoroSession = useCallback(
    (sessionMode: "focus" | "break", plannedMins: number) => {
      setIsRunning(false);
      playFocusTimerChime(true, false);

      if (sessionMode === "focus") {
        logSessionRecord("focus", plannedMins);
        sendNotification("🎉 Focus Session Finished!", {
          body: `Great job! You stayed focused for ${plannedMins} minutes. Time for a ${SHORT_BREAK_MINUTES}-minute break.`,
        });
        setSessionFeedback(
          currentLanguage === "hi"
            ? "25-मिनट पोमोडोरो सत्र पूरा हुआ और लॉग किया गया!"
            : `25-minute Pomodoro session logged (+${plannedMins}m)!`
        );
        setTimeout(() => setSessionFeedback(null), 4000);
        setMode("break");
        setTimeLeftSeconds(SHORT_BREAK_MINUTES * 60);
        saveQuickFocusSessionState(null);
      } else {
        logSessionRecord("break", plannedMins);
        sendNotification("☕ Break Finished!", {
          body: "Ready to get back in the zone? Start your next focus session.",
        });
        setMode("focus");
        setTimeLeftSeconds(POMODORO_SECONDS);
        saveQuickFocusSessionState(null);
      }
    },
    [logSessionRecord, currentLanguage]
  );

  // Sync with FocusTimer interval tick logic
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          const next = Math.max(0, prev - 1);
          saveQuickFocusSessionState({
            isRunning: next > 0,
            mode,
            durationMinutes:
              mode === "focus" ? POMODORO_MINUTES : SHORT_BREAK_MINUTES,
            remainingSeconds: next,
            updatedAt: Date.now(),
          });
          return next;
        });
      }, 1000);
    } else if (isRunning && timeLeftSeconds === 0) {
      const plannedMins =
        mode === "focus" ? POMODORO_MINUTES : SHORT_BREAK_MINUTES;
      completePomodoroSession(mode, plannedMins);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeftSeconds, mode, completePomodoroSession]);

  // Single-click handler to launch a 25-minute Pomodoro session immediately
  const handleLaunch25MinPomodoro = () => {
    playFocusTimerChime(false, false);
    setMode("focus");
    const targetSeconds =
      mode === "focus" && timeLeftSeconds > 0 && timeLeftSeconds < POMODORO_SECONDS
        ? timeLeftSeconds
        : POMODORO_SECONDS;
    setTimeLeftSeconds(targetSeconds);
    setIsRunning(true);
    saveQuickFocusSessionState({
      isRunning: true,
      mode: "focus",
      durationMinutes: POMODORO_MINUTES,
      remainingSeconds: targetSeconds,
      updatedAt: Date.now(),
    });
  };

  const handlePause = () => {
    setIsRunning(false);
    saveQuickFocusSessionState({
      isRunning: false,
      mode,
      durationMinutes: mode === "focus" ? POMODORO_MINUTES : SHORT_BREAK_MINUTES,
      remainingSeconds: timeLeftSeconds,
      updatedAt: Date.now(),
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    setMode("focus");
    setTimeLeftSeconds(POMODORO_SECONDS);
    saveQuickFocusSessionState(null);
  };

  const todayPomodoroCount = (Array.isArray(focusLogs) ? focusLogs : []).filter(
    (l) => l && l.date === todayStr && l.type === "focus"
  ).length;

  return (
    <section
      id="home-quick-focus-widget"
      data-testid="quick-focus-widget"
      aria-label="Quick Focus 25-Minute Pomodoro Widget"
      className={`glass-card rounded-3xl p-4 sm:p-5 border border-amber-500/30 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-amber-950/25 shadow-lg space-y-3.5 ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Widget Identity & Live Status */}
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
              isRunning
                ? "bg-amber-500/25 border-amber-400 text-amber-300"
                : "bg-amber-500/15 border-amber-500/35 text-amber-400"
            }`}
          >
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-amber-300 flex-wrap">
              <span>
                {currentLanguage === "hi"
                  ? "त्वरित फोकस (Quick Focus)"
                  : "Quick Focus · 25-Minute Pomodoro"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-300">
                {todayPomodoroCount}{" "}
                {todayPomodoroCount === 1 ? "session" : "sessions"} today
              </span>
              {isRunning && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    data-testid="quick-focus-active-status"
                    className="text-emerald-400 font-bold"
                  >
                    Live Session Active
                  </span>
                </>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-bold font-heading text-white">
              {currentLanguage === "hi"
                ? "एक क्लिक में 25-मिनट पोमोडोरो सत्र शुरू करें"
                : "Quick Focus — Launch 25-Minute Pomodoro Session"}
            </h2>
          </div>
        </div>

        {/* Center/Right: Countdown Display + 1-Click Launch Controls */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
          {/* Timer Readout */}
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/90 border border-white/10 flex items-center gap-2.5">
            {mode === "focus" ? (
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Coffee className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span
              id="quick-focus-timer-display"
              data-testid="quick-focus-timer-display"
              className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-white tracking-tight"
            >
              {formatSecondsToMSS(timeLeftSeconds)}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {mode === "focus" ? "25m Focus" : "5m Break"}
            </span>
          </div>

          {/* Primary Single-Click Launch / Pause Button */}
          {!isRunning ? (
            <button
              type="button"
              id="quick-focus-launch-btn"
              data-testid="quick-focus-launch-btn"
              onClick={handleLaunch25MinPomodoro}
              className="min-h-[42px] px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950 text-slate-950 shrink-0" />
              <span>
                {timeLeftSeconds < POMODORO_SECONDS && timeLeftSeconds > 0
                  ? currentLanguage === "hi"
                    ? "25m पोमोडोरो जारी रखें"
                    : "Resume 25m Pomodoro"
                  : currentLanguage === "hi"
                  ? "25-मिनट पोमोडोरो शुरू करें"
                  : "Launch 25-Min Pomodoro"}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="quick-focus-pause-btn"
                data-testid="quick-focus-pause-btn"
                onClick={handlePause}
                className="min-h-[42px] px-3.5 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{currentLanguage === "hi" ? "रोकें" : "Pause"}</span>
              </button>

              <button
                type="button"
                id="quick-focus-complete-btn"
                data-testid="quick-focus-complete-btn"
                onClick={() => completePomodoroSession("focus", POMODORO_MINUTES)}
                title="Complete and log 25-minute Pomodoro session"
                className="min-h-[42px] px-3 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Log 25m</span>
              </button>
            </div>
          )}

          {/* Reset & Full Timer Actions */}
          {(isRunning || timeLeftSeconds < POMODORO_SECONDS) && (
            <button
              type="button"
              id="quick-focus-reset-btn"
              data-testid="quick-focus-reset-btn"
              onClick={handleReset}
              aria-label="Reset Quick Focus Timer"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {onNavigate && (
            <button
              type="button"
              id="quick-focus-open-timer-btn"
              onClick={() => onNavigate("focus")}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{currentLanguage === "hi" ? "पूर्ण टाइमर" : "Full Timer"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Session Feedback */}
      <div className="space-y-1.5">
        <div
          role="progressbar"
          aria-label="25-Minute Pomodoro Progress"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.max(isRunning ? 4 : 0, progressPercent)}%` }}
          />
        </div>
        {sessionFeedback && (
          <div
            id="quick-focus-feedback"
            data-testid="quick-focus-feedback"
            className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 pt-0.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{sessionFeedback}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default QuickFocusWidget;
