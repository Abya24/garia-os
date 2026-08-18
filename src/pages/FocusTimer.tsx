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
  Flame,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  const todayStr = getTodayString();

  useEffect(() => {
    const countToday = (Array.isArray(focusLogs) ? focusLogs : []).filter(
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

  // Audio chime generator using standard Web Audio API
  const playChime = (isEnd: boolean = true) => {
    if (soundMuted || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const now = ctx.currentTime;

      if (isEnd) {
        // High soft chime for session end
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
      } else {
        // Soft click for timer start
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {
      // Audio context may be restricted by browser policy
    }
  };

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
      playChime(true);
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

  // Remaining Time Fraction & Angle for CSS Conic Gradient Ring
  const remainingFraction = totalModeSeconds > 0 ? timeLeftSeconds / totalModeSeconds : 0;
  const remainingDegrees = Math.round(remainingFraction * 360);

  const formatMinutesSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStart = () => {
    playChime(false);
    setIsRunning(true);
  };
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeftSeconds(totalModeSeconds);
  };

  const handleSkip = () => {
    setIsRunning(false);
    setMode(mode === "focus" ? "break" : "focus");
  };

  // SVG Circle Geometry Calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius; // ~753.98
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  // Dynamic Conic Gradient Background representing Remaining Time
  const conicGradientStyle =
    mode === "focus"
      ? {
          background: `conic-gradient(from -90deg, #fbbf24 0deg, #f59e0b ${
            remainingDegrees * 0.6
          }deg, #ea580c ${remainingDegrees}deg, rgba(255, 255, 255, 0.04) ${remainingDegrees}deg 360deg)`,
        }
      : {
          background: `conic-gradient(from -90deg, #38bdf8 0deg, #06b6d4 ${
            remainingDegrees * 0.6
          }deg, #2563eb ${remainingDegrees}deg, rgba(255, 255, 255, 0.04) ${remainingDegrees}deg 360deg)`,
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                Focus Timer
              </h1>
              {isRunning && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live Session
                </span>
              )}
            </div>
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
            id="focus-mode-toggle"
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
            id="break-mode-toggle"
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
        {/* Subtle Ambient Glow Blobs */}
        <div
          className={`absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
            mode === "focus"
              ? isRunning
                ? "bg-amber-500/20 scale-125"
                : "bg-amber-500/10"
              : isRunning
              ? "bg-cyan-500/20 scale-125"
              : "bg-cyan-500/10"
          }`}
        />
        <div
          className={`absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
            mode === "focus"
              ? isRunning
                ? "bg-orange-500/15 scale-125"
                : "bg-orange-500/5"
              : isRunning
              ? "bg-blue-500/15 scale-125"
              : "bg-blue-500/5"
          }`}
        />

        {/* Circular Ring Timer Container with CSS Conic Gradient Ring & Pulse Aura */}
        <div className="relative w-64 h-64 sm:w-76 sm:h-76 my-4 sm:my-6 flex items-center justify-center">
          {/* Concentric Animated Pulse Aura when Active */}
          <AnimatePresence>
            {isRunning && (
              <>
                {/* Outer Breathing Wave */}
                <motion.div
                  key="pulse-outer"
                  initial={{ scale: 0.95, opacity: 0.2 }}
                  animate={{
                    scale: [1, 1.14, 1],
                    opacity: [0.15, 0.45, 0.15],
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    repeat: Infinity,
                    duration: 3.6,
                    ease: "easeInOut",
                  }}
                  className={`absolute inset-0 rounded-full blur-md pointer-events-none border ${
                    mode === "focus"
                      ? "border-amber-400/40 bg-amber-500/10"
                      : "border-cyan-400/40 bg-cyan-500/10"
                  }`}
                />

                {/* Inner Breathing Ripple */}
                <motion.div
                  key="pulse-inner"
                  initial={{ scale: 0.98, opacity: 0.3 }}
                  animate={{
                    scale: [1, 1.07, 1],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{
                    repeat: Infinity,
                    duration: 3.6,
                    delay: 0.4,
                    ease: "easeInOut",
                  }}
                  className={`absolute inset-2 rounded-full blur-sm pointer-events-none ${
                    mode === "focus"
                      ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10"
                      : "bg-gradient-to-br from-cyan-500/20 to-blue-500/10"
                  }`}
                />
              </>
            )}
          </AnimatePresence>

          {/* CSS Conic Gradient Ring Layer: Shrinks & Rotates Smoothly representing Time Remaining */}
          <motion.div
            style={conicGradientStyle}
            animate={
              isRunning
                ? {
                    scale: [1, 1.015, 1],
                  }
                : {}
            }
            transition={{ repeat: Infinity, duration: 3.6, ease: "easeInOut" }}
            className="absolute inset-1.5 sm:inset-1 rounded-full p-2.5 sm:p-3 transition-all duration-1000 ease-linear shadow-xl flex items-center justify-center"
          >
            {/* Inner Mask Container for Conic Gradient Ring */}
            <div className="w-full h-full rounded-full bg-slate-950/95 border border-white/10 flex items-center justify-center relative backdrop-blur-md overflow-hidden">
              {/* Rotating Light Shimmer when Active */}
              {isRunning && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="absolute inset-0 rounded-full opacity-25 pointer-events-none"
                  style={{
                    background:
                      mode === "focus"
                        ? "radial-gradient(circle at top, rgba(245, 158, 11, 0.35) 0%, transparent 60%)"
                        : "radial-gradient(circle at top, rgba(6, 182, 212, 0.35) 0%, transparent 60%)",
                  }}
                />
              )}
            </div>
          </motion.div>

          {/* SVG Countdown Ring */}
          <svg className="w-full h-full transform -rotate-90 z-10 drop-shadow-lg pointer-events-none">
            <defs>
              <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="3"
                  floodColor={mode === "focus" ? "#f59e0b" : "#06b6d4"}
                  floodOpacity={isRunning ? "0.6" : "0.3"}
                />
              </filter>
            </defs>

            {/* Background Track */}
            <circle
              cx="144"
              cy="144"
              r={radius}
              stroke="currentColor"
              strokeWidth="11"
              className="text-slate-800/80"
              fill="transparent"
            />

            {/* Dynamic Smooth Animated Countdown Progress Circle */}
            <circle
              cx="144"
              cy="144"
              r={radius}
              stroke={mode === "focus" ? "url(#focusGradient)" : "url(#breakGradient)"}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              filter="url(#ringGlow)"
              className="transition-all duration-1000 ease-linear"
              fill="transparent"
            />
          </svg>

          {/* Timer Display Centerpiece */}
          <div className="absolute z-20 flex flex-col items-center justify-center select-none">
            {/* Subtle Active Icon or Sparkle */}
            <motion.div
              animate={isRunning ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="mb-1"
            >
              {mode === "focus" ? (
                <Flame
                  className={`w-5 h-5 transition-colors ${
                    isRunning ? "text-amber-400" : "text-slate-500"
                  }`}
                />
              ) : (
                <Coffee
                  className={`w-5 h-5 transition-colors ${
                    isRunning ? "text-cyan-400" : "text-slate-500"
                  }`}
                />
              )}
            </motion.div>

            {/* Countdown Digits */}
            <span className="text-4xl sm:text-6xl font-black font-mono tracking-wider text-white tabular-nums drop-shadow-sm">
              {formatMinutesSeconds(timeLeftSeconds)}
            </span>

            {/* Mode & State Badge */}
            <motion.span
              animate={isRunning ? { opacity: [0.8, 1, 0.8] } : {}}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className={`text-[11px] font-bold uppercase tracking-widest mt-2 px-3 py-0.5 rounded-full transition-all shadow-sm ${
                mode === "focus"
                  ? isRunning
                    ? "bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-amber-500/10"
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                  : isRunning
                  ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-cyan-500/10"
                  : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
              }`}
            >
              {isRunning
                ? mode === "focus"
                  ? "Deep Focus Active"
                  : "Recharging..."
                : mode === "focus"
                ? "Deep Focus"
                : "Rest & Recharge"}
            </motion.span>

            {/* Calming Breathing Cue when Running */}
            {isRunning && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="text-[10px] text-slate-400 font-medium mt-1"
              >
                Inhale • Focus • Exhale
              </motion.span>
            )}
          </div>
        </div>

        {/* Duration Quick Preset Chips & Dropdown Selector */}
        <div className="flex flex-col items-center gap-2 mb-6 w-full max-w-sm">
          <div className="flex items-center justify-between w-full text-xs text-slate-400 px-1">
            <span className="font-mono">Select Duration:</span>
            <button
              onClick={() => setSoundMuted((prev) => !prev)}
              aria-label={soundMuted ? "Unmute Chime" : "Mute Chime"}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
            >
              {soundMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sound On</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 w-full">
            {(mode === "focus" ? [15, 25, 45, 60] : [5, 10, 15, 20]).map((mins) => {
              const currentVal = mode === "focus" ? focusDurationMinutes : breakDurationMinutes;
              const isSelected = currentVal === mins;
              return (
                <button
                  key={mins}
                  disabled={isRunning}
                  onClick={() => {
                    if (mode === "focus") setFocusDurationMinutes(mins);
                    else setBreakDurationMinutes(mins);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center border ${
                    isSelected
                      ? mode === "focus"
                        ? "bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-sm"
                        : "bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-sm"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                  } ${isRunning ? "opacity-50 cursor-not-allowed" : "card-press"}`}
                >
                  {mins}m
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Control Buttons */}
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleReset}
            id="focus-reset-btn"
            className="p-3.5 rounded-2xl glass-pill text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors shadow-md"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>

          {!isRunning ? (
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.04 }}
              onClick={handleStart}
              id="focus-start-btn"
              className={`px-8 py-4 rounded-2xl text-slate-900 font-extrabold text-base flex items-center gap-2 shadow-xl transition-all ${
                mode === "focus"
                  ? "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-amber-500/30"
                  : "bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 shadow-cyan-500/30"
              }`}
            >
              <Play className="w-6 h-6 fill-slate-900" />
              <span>Start Session</span>
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.04 }}
              onClick={handlePause}
              id="focus-pause-btn"
              className="px-8 py-4 rounded-2xl bg-amber-500 text-slate-900 font-extrabold text-base flex items-center gap-2 shadow-xl shadow-amber-500/30 transition-all"
            >
              <Pause className="w-6 h-6 fill-slate-900" />
              <span>Pause</span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleSkip}
            id="focus-skip-btn"
            className="p-3.5 rounded-2xl glass-pill text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors shadow-md"
            title="Skip Mode"
          >
            <SkipForward className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Daily Session Counter & Status */}
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
