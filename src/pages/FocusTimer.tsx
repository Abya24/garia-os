import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  Coffee,
  CheckCircle,
  Bell,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { FocusSessionLog, UserSettings } from "../types";
import { sendNotification } from "../utils/notifications";
import { getTodayString } from "../utils/storage";

interface FocusTimerProps {
  settings: UserSettings;
  focusLogs: FocusSessionLog[];
  onLogFocusSession: (log: Omit<FocusSessionLog, "id">) => void;
  onBack?: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  settings,
  focusLogs,
  onLogFocusSession,
  onBack,
}) => {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [focusDurationMinutes, setFocusDurationMinutes] = useState<number>(
    settings.defaultFocusDuration || 25
  );
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number>(
    settings.defaultBreakDuration || 5
  );

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(
    focusDurationMinutes * 60
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionsCompletedToday, setSessionsCompletedToday] = useState<number>(0);

  const todayStr = getTodayString();

  useEffect(() => {
    const countToday = focusLogs.filter(
      (l) => l.date === todayStr && l.type === "focus"
    ).length;
    setSessionsCompletedToday(countToday);
  }, [focusLogs, todayStr]);

  // Mode or Duration Change Reset
  useEffect(() => {
    if (!isRunning) {
      const targetMins =
        mode === "focus" ? focusDurationMinutes : breakDurationMinutes;
      setTimeLeftSeconds(targetMins * 60);
    }
  }, [mode, focusDurationMinutes, breakDurationMinutes]);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeftSeconds === 0) {
      // Session Completed
      setIsRunning(false);
      if (mode === "focus") {
        onLogFocusSession({
          type: "focus",
          durationMinutes: focusDurationMinutes,
          completedAt: Date.now(),
          date: todayStr,
        });

        sendNotification("🎉 Focus Session Finished!", {
          body: `Great job! You stayed focused for ${focusDurationMinutes} minutes. Time for a ${breakDurationMinutes}-minute break.`,
        });

        setMode("break");
      } else {
        onLogFocusSession({
          type: "break",
          durationMinutes: breakDurationMinutes,
          completedAt: Date.now(),
          date: todayStr,
        });

        sendNotification("☕ Break Finished!", {
          body: "Ready to get back in the zone? Start your next focus session.",
        });

        setMode("focus");
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeftSeconds, mode]);

  const totalModeSeconds =
    (mode === "focus" ? focusDurationMinutes : breakDurationMinutes) * 60;
  const progressPercent =
    totalModeSeconds > 0
      ? Math.round(((totalModeSeconds - timeLeftSeconds) / totalModeSeconds) * 100)
      : 0;

  const formatMinutesSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeftSeconds(totalModeSeconds);
  };

  const handleSkip = () => {
    setIsRunning(false);
    setMode(mode === "focus" ? "break" : "focus");
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              id="focus-back-btn"
              aria-label="Go Back"
              className="p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Focus Timer
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Pomodoro technique for deep work & structured study intervals.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center p-1 rounded-2xl glass-pill border border-white/10 self-start sm:self-center">
          <button
            onClick={() => {
              setIsRunning(false);
              setMode("focus");
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === "focus"
                ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Focus Mode</span>
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setMode("break");
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === "break"
                ? "bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Break Mode</span>
          </button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="glass-card rounded-3xl p-8 border border-white/10 text-center flex flex-col items-center justify-center relative overflow-hidden max-w-xl mx-auto shadow-2xl">
        <div
          className={`absolute top-0 right-0 -mt-12 -mr-12 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
            mode === "focus" ? "bg-amber-500/10" : "bg-cyan-500/10"
          }`}
        />

        {/* Circular Ring Timer */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-6 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="144"
              cy="144"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-800"
              fill="transparent"
            />
            <circle
              cx="144"
              cy="144"
              r="120"
              stroke={mode === "focus" ? "#f59e0b" : "#06b6d4"}
              strokeWidth="12"
              strokeDasharray={754}
              strokeDashoffset={754 - (754 * progressPercent) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-6xl font-black font-mono tracking-wider text-white">
              {formatMinutesSeconds(timeLeftSeconds)}
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-widest mt-2 px-3 py-0.5 rounded-full ${
                mode === "focus"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              }`}
            >
              {mode === "focus" ? "Deep Focus" : "Rest & Recharge"}
            </span>
          </div>
        </div>

        {/* Duration Dropdown Selector */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-slate-400 font-mono">Duration:</span>
          <select
            disabled={isRunning}
            value={mode === "focus" ? focusDurationMinutes : breakDurationMinutes}
            onChange={(e) => {
              const mins = Number(e.target.value);
              if (mode === "focus") setFocusDurationMinutes(mins);
              else setBreakDurationMinutes(mins);
            }}
            className="px-4 py-2 rounded-xl glass-pill text-xs font-bold text-amber-300 border border-white/15 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-slate-900 shadow-sm"
          >
            {mode === "focus" ? (
              <>
                <option value={15} className="bg-slate-900 text-white">15 minutes (Quick Sprint)</option>
                <option value={25} className="bg-slate-900 text-white">25 minutes (Pomodoro Standard)</option>
                <option value={45} className="bg-slate-900 text-white">45 minutes (Deep Study)</option>
                <option value={60} className="bg-slate-900 text-white">60 minutes (Intensive Block)</option>
              </>
            ) : (
              <>
                <option value={5} className="bg-slate-900 text-white">5 minutes (Short Rest)</option>
                <option value={10} className="bg-slate-900 text-white">10 minutes (Coffee Break)</option>
                <option value={15} className="bg-slate-900 text-white">15 minutes (Full Reset)</option>
              </>
            )}
          </select>
        </div>

        {/* Action Control Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl glass-pill text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {!isRunning ? (
            <button
              onClick={handleStart}
              className={`px-8 py-4 rounded-2xl text-slate-900 font-extrabold text-base flex items-center gap-2 shadow-xl hover:scale-105 transition-all active:scale-95 ${
                mode === "focus"
                  ? "bg-gradient-to-r from-amber-400 to-orange-400 shadow-amber-500/25"
                  : "bg-gradient-to-r from-cyan-400 to-blue-400 shadow-cyan-500/25"
              }`}
            >
              <Play className="w-6 h-6 fill-slate-900" />
              <span>Start</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-8 py-4 rounded-2xl bg-amber-500 text-slate-900 font-extrabold text-base flex items-center gap-2 shadow-xl hover:scale-105 transition-all active:scale-95"
            >
              <Pause className="w-6 h-6 fill-slate-900" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleSkip}
            className="p-3.5 rounded-2xl glass-pill text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Skip Mode"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Daily Session Counter */}
        <div className="mt-8 pt-4 border-t border-white/10 w-full flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Sessions Completed Today
          </span>
          <span className="font-bold font-mono text-emerald-400 text-sm">
            {sessionsCompletedToday} sessions
          </span>
        </div>
      </div>
    </div>
  );
};
