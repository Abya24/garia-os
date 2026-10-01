import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Sparkles,
  CheckSquare,
  Target,
  Headphones,
  Sliders,
} from "lucide-react";
import { UserSettings, FocusSessionLog, Task, Priority } from "../types";
import { getTodayString, loadTasks, saveTasks } from "../utils/storage";
import { sendNotification } from "../utils/notifications";
import { formatSecondsToMSS } from "../utils/dateTimeUtils";

export const QUICK_FOCUS_SESSION_KEY = "garia_quick_focus_pomodoro_state";

export interface QuickFocusSessionState {
  isRunning: boolean;
  mode: "focus" | "break";
  durationMinutes: number;
  remainingSeconds: number;
  updatedAt: number;
  activeTaskId?: string;
  activeTaskTitle?: string;
}

export function playFocusTimerChime(
  _modeOrEnabled: string | boolean = true,
  soundEnabledOrVol: boolean | number = true
) {
  if (_modeOrEnabled === false || soundEnabledOrVol === false) return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
    const vol = typeof soundEnabledOrVol === "number" ? soundEnabledOrVol : 0.2;
    gain.gain.setValueAtTime(Math.max(0.01, Math.min(1, vol)), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  } catch {
    // Ignore audio context errors on restricted browsers
  }
}

export function saveQuickFocusSessionState(state: QuickFocusSessionState | null) {
  try {
    if (!state) {
      sessionStorage.removeItem(QUICK_FOCUS_SESSION_KEY);
      return;
    }
    sessionStorage.setItem(QUICK_FOCUS_SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function loadQuickFocusSessionState(): QuickFocusSessionState | null {
  try {
    const raw = sessionStorage.getItem(QUICK_FOCUS_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuickFocusSessionState;
    if (
      !parsed ||
      typeof parsed.remainingSeconds !== "number" ||
      typeof parsed.durationMinutes !== "number"
    ) {
      return null;
    }
    if (parsed.isRunning && parsed.updatedAt) {
      const elapsed = Math.max(0, Math.floor((Date.now() - parsed.updatedAt) / 1000));
      const adjusted = Math.max(1, parsed.remainingSeconds - elapsed);
      return {
        ...parsed,
        remainingSeconds: adjusted,
        updatedAt: Date.now(),
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

type AmbientSoundMode = "off" | "rain" | "brown" | "drone";

interface FocusTimerProps {
  settings: UserSettings;
  focusLogs: FocusSessionLog[];
  onLogFocusSession: (log: Omit<FocusSessionLog, "id">) => void;
  onBack?: () => void;
  tasks?: Task[];
  onToggleTask?: (task: Task) => void;
  onAddTask?: (task: Omit<Task, "id" | "createdAt">) => void;
}

const FOCUS_PRESETS = [
  { id: "pomodoro", label: "Pomodoro", minutes: 25, mode: "focus" as const, desc: "Classic 25m sprint" },
  { id: "deep", label: "Deep Work", minutes: 50, mode: "focus" as const, desc: "50m chapter mastery" },
  { id: "exam", label: "Exam Sprint", minutes: 90, mode: "focus" as const, desc: "90m mock paper block" },
  { id: "break", label: "Short Break", minutes: 5, mode: "break" as const, desc: "5m recharge & stretch" },
];

export const FocusTimer: React.FC<FocusTimerProps> = ({
  settings,
  focusLogs,
  onLogFocusSession,
  tasks,
  onToggleTask,
  onAddTask,
}) => {
  const initialQuickSession = loadQuickFocusSessionState();

  const [mode, setMode] = useState<"focus" | "break">(
    initialQuickSession ? initialQuickSession.mode : "focus"
  );
  const [focusDuration, setFocusDuration] = useState<number>(
    initialQuickSession && initialQuickSession.mode === "focus"
      ? initialQuickSession.durationMinutes
      : settings.defaultFocusDuration || 25
  );
  const [breakDuration, setBreakDuration] = useState<number>(
    initialQuickSession && initialQuickSession.mode === "break"
      ? initialQuickSession.durationMinutes
      : settings.defaultBreakDuration || 5
  );

  const [secondsLeft, setSecondsLeft] = useState<number>(
    initialQuickSession
      ? initialQuickSession.remainingSeconds
      : (settings.defaultFocusDuration || 25) * 60
  );
  const [isRunning, setIsRunning] = useState<boolean>(
    initialQuickSession ? initialQuickSession.isRunning : false
  );
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Task integration state
  const [localTasks, setLocalTasks] = useState<Task[]>(() => loadTasks());
  const allTasks = useMemo(() => {
    if (tasks && tasks.length > 0) return tasks;
    return localTasks;
  }, [tasks, localTasks]);

  const pendingTasks = useMemo(
    () =>
      allTasks
        .filter((t) => !t.completed)
        .sort((a, b) => {
          const pWeight = { high: 0, medium: 1, low: 2 };
          return (pWeight[a.priority] ?? 1) - (pWeight[b.priority] ?? 1);
        }),
    [allTasks]
  );

  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    initialQuickSession?.activeTaskId || ""
  );
  const [quickTaskInput, setQuickTaskInput] = useState<string>("");
  const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>("high");

  const activeTask = useMemo(() => {
    if (selectedTaskId) {
      const found = allTasks.find((t) => t.id === selectedTaskId);
      if (found) return found;
    }
    return pendingTasks[0] || null;
  }, [selectedTaskId, allTasks, pendingTasks]);

  // Ambient Web Audio generator
  const [ambientMode, setAmbientMode] = useState<AmbientSoundMode>("off");
  const [ambientVolume, setAmbientVolume] = useState<number>(0.25);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const stopAmbientAudio = () => {
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // Ignore
      }
      audioCtxRef.current = null;
      gainNodeRef.current = null;
    }
  };

  const startAmbientAudio = (sound: AmbientSoundMode, vol: number) => {
    stopAmbientAudio();
    if (sound === "off") return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.value = vol;
      masterGain.connect(ctx.destination);

      if (sound === "drone") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.value = 174;
        osc2.frequency.value = 261;
        osc1.connect(masterGain);
        osc2.connect(masterGain);
        osc1.start();
        osc2.start();
      } else {
        // Noise buffer for Rain or Brown noise
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (sound === "brown") {
            output[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = output[i];
            output[i] *= 3.2;
          } else {
            // Soft Rain pink-ish filtered noise
            output[i] = white * 0.35;
          }
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = sound === "rain" ? 950 : 420;

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
      }

      audioCtxRef.current = ctx;
      gainNodeRef.current = masterGain;
    } catch {
      // Ignore audio restrictions
    }
  };

  useEffect(() => {
    if (isRunning && ambientMode !== "off") {
      startAmbientAudio(ambientMode, ambientVolume);
    } else {
      stopAmbientAudio();
    }
    return () => {
      stopAmbientAudio();
    };
  }, [isRunning, ambientMode]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = ambientVolume;
    }
  }, [ambientVolume]);

  // Keep session state synchronized with QuickFocusWidget
  useEffect(() => {
    const durationMinutes = mode === "focus" ? focusDuration : breakDuration;
    saveQuickFocusSessionState({
      isRunning,
      mode,
      durationMinutes,
      remainingSeconds: secondsLeft,
      updatedAt: Date.now(),
      activeTaskId: activeTask?.id,
      activeTaskTitle: activeTask?.title,
    });
  }, [isRunning, mode, focusDuration, breakDuration, secondsLeft, activeTask?.id, activeTask?.title]);

  // Countdown tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode, focusDuration, breakDuration]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    playFocusTimerChime();

    const completedMinutes = mode === "focus" ? focusDuration : breakDuration;
    onLogFocusSession({
      type: mode,
      durationMinutes: completedMinutes,
      completedAt: Date.now(),
      date: getTodayString(),
    });

    if (mode === "focus") {
      sendNotification("Focus Session Complete!", {
        body: `Great job! You completed a ${focusDuration}-minute focus session.`,
      });
      setStatusToast(`Completed ${focusDuration}m Focus Session! Switching to Break.`);
      setMode("break");
      setSecondsLeft(breakDuration * 60);
    } else {
      sendNotification("Break Finished!", {
        body: "Ready for your next focus sprint?",
      });
      setStatusToast("Break finished! Ready for your next Focus Sprint.");
      setMode("focus");
      setSecondsLeft(focusDuration * 60);
    }
    setTimeout(() => setStatusToast(null), 4000);
  };

  const handleSelectPreset = (preset: typeof FOCUS_PRESETS[number]) => {
    setIsRunning(false);
    setMode(preset.mode);
    if (preset.mode === "focus") {
      setFocusDuration(preset.minutes);
    } else {
      setBreakDuration(preset.minutes);
    }
    setSecondsLeft(preset.minutes * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    const mins = mode === "focus" ? focusDuration : breakDuration;
    setSecondsLeft(mins * 60);
  };

  const handleAdjustDuration = (deltaMinutes: number) => {
    if (isRunning) return;
    if (mode === "focus") {
      const next = Math.min(180, Math.max(5, focusDuration + deltaMinutes));
      setFocusDuration(next);
      setSecondsLeft(next * 60);
    } else {
      const next = Math.min(60, Math.max(1, breakDuration + deltaMinutes));
      setBreakDuration(next);
      setSecondsLeft(next * 60);
    }
  };

  const handleCompleteEarly = () => {
    const totalSeconds = (mode === "focus" ? focusDuration : breakDuration) * 60;
    const elapsedMinutes = Math.max(1, Math.round((totalSeconds - secondsLeft) / 60));
    setIsRunning(false);
    playFocusTimerChime();
    onLogFocusSession({
      type: mode,
      durationMinutes: elapsedMinutes,
      completedAt: Date.now(),
      date: getTodayString(),
    });
    setSecondsLeft(totalSeconds);
    setStatusToast(`Logged ${elapsedMinutes}m ${mode} session ✓`);
    setTimeout(() => setStatusToast(null), 3500);
  };

  const handleCompleteActiveTask = (taskItem: Task) => {
    if (onToggleTask) {
      onToggleTask(taskItem);
    } else {
      const updated = allTasks.map((t) =>
        t.id === taskItem.id ? { ...t, completed: !t.completed } : t
      );
      setLocalTasks(updated);
      saveTasks(updated);
    }
    setStatusToast(`Completed task: "${taskItem.title}" ✓`);
    setTimeout(() => setStatusToast(null), 3000);
  };

  const handleCreateQuickFocusTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTaskInput.trim();
    if (!trimmed) return;
    const todayStr = getTodayString();

    if (onAddTask) {
      onAddTask({
        title: trimmed,
        date: todayStr,
        priority: quickTaskPriority,
        category: "study",
        completed: false,
      });
    } else {
      const newTask: Task = {
        id: `focus_task_${Date.now()}`,
        title: trimmed,
        date: todayStr,
        priority: quickTaskPriority,
        category: "study",
        completed: false,
        createdAt: Date.now(),
      };
      const updated = [newTask, ...allTasks];
      setLocalTasks(updated);
      saveTasks(updated);
      setSelectedTaskId(newTask.id);
    }
    setQuickTaskInput("");
    setStatusToast(`Added focus task: "${trimmed}"`);
    setTimeout(() => setStatusToast(null), 2500);
  };

  const totalSeconds = (mode === "focus" ? focusDuration : breakDuration) * 60;
  const progressPercent =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100))
      : 0;

  const todayStr = getTodayString();
  const todayFocusLogs = useMemo(
    () => focusLogs.filter((l) => l.date === todayStr && l.type === "focus"),
    [focusLogs, todayStr]
  );
  const todayFocusMinutes = useMemo(
    () => todayFocusLogs.reduce((acc, l) => acc + l.durationMinutes, 0),
    [todayFocusLogs]
  );
  const totalFocusMinutesAllTime = useMemo(
    () =>
      focusLogs
        .filter((l) => l.type === "focus")
        .reduce((acc, l) => acc + l.durationMinutes, 0),
    [focusLogs]
  );

  // SVG Circle geometry
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Top Studio Header with Classic Dropdowns */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card classic-frame p-4 sm:p-5 rounded-3xl border border-amber-500/25">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <span>Classic Focus Studio</span>
              <span>·</span>
              <span className="font-mono tabular-nums text-emerald-300">
                {todayFocusLogs.length} sessions ({todayFocusMinutes}m) today
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-classic text-white tracking-tight">
              Distraction-Free Pomodoro & Task Execution
            </h1>
          </div>
        </div>

        {/* Classic Dropdowns & Ambient Soundscape Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Dropdown 1: Preset Mode Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-semibold">Preset:</span>
            <select
              id="focus-preset-select"
              aria-label="Select Focus Preset"
              value={
                FOCUS_PRESETS.find(
                  (p) =>
                    p.mode === mode &&
                    (p.mode === "focus"
                      ? focusDuration === p.minutes
                      : breakDuration === p.minutes)
                )?.id || "custom"
              }
              onChange={(e) => {
                const found = FOCUS_PRESETS.find((p) => p.id === e.target.value);
                if (found) handleSelectPreset(found);
              }}
              className="bg-transparent text-xs font-bold text-amber-200 focus:outline-none cursor-pointer"
            >
              {FOCUS_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.label} ({p.minutes}m)
                </option>
              ))}
              <option value="custom" className="bg-slate-900 text-slate-300">
                Custom ({mode === "focus" ? focusDuration : breakDuration}m)
              </option>
            </select>
          </div>

          {/* Dropdown 2: Ambient Soundscape Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-white/10">
            <Headphones className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-semibold">Audio:</span>
            <select
              id="focus-ambient-select"
              aria-label="Select Ambient Sound"
              value={ambientMode}
              onChange={(e) => setAmbientMode(e.target.value as AmbientSoundMode)}
              className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
            >
              <option value="off" className="bg-slate-900 text-white">Silent Mode</option>
              <option value="rain" className="bg-slate-900 text-white">Soft Rain</option>
              <option value="brown" className="bg-slate-900 text-white">Brown Noise</option>
              <option value="drone" className="bg-slate-900 text-white">Focus Drone</option>
            </select>
          </div>

          {/* Volume Slider (Always visible for quick adjustment) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-white/10">
            {ambientVolume === 0 || ambientMode === "off" ? (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="text-[11px] font-mono text-slate-400">
              {Math.round((ambientVolume / 0.6) * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={0.6}
              step={0.05}
              value={ambientVolume}
              onChange={(e) => setAmbientVolume(Number(e.target.value))}
              aria-label="Ambient Sound Volume"
              className="w-20 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {statusToast && (
        <div
          role="status"
          className="px-4 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-xs font-semibold flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Main Two-Column Focus Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Timer Ring, Presets & Primary Controls */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-5 sm:p-7 border border-white/10 space-y-6">
          {/* Session Mode Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FOCUS_PRESETS.map((preset) => {
              const isSelected =
                mode === preset.mode &&
                (preset.mode === "focus"
                  ? focusDuration === preset.minutes
                  : breakDuration === preset.minutes);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? preset.mode === "focus"
                        ? "bg-amber-500/15 border-amber-400 text-white"
                        : "bg-cyan-500/15 border-cyan-400 text-white"
                      : "bg-slate-950/70 border-white/10 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold">{preset.label}</span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {preset.minutes}m
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {preset.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Center Circular Progress Ring */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke={mode === "focus" ? "#f59e0b" : "#06b6d4"}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span
                  className={`text-xs font-semibold tracking-wide ${
                    mode === "focus" ? "text-amber-300" : "text-cyan-300"
                  }`}
                >
                  {isRunning
                    ? mode === "focus"
                      ? "Focusing Now"
                      : "Break Active"
                    : mode === "focus"
                    ? "Ready to Focus"
                    : "Break Ready"}
                </span>

                <div
                  id="focus-timer-display"
                  className="text-5xl sm:text-6xl font-extrabold font-mono tabular-nums text-white tracking-tight my-1"
                >
                  {formatSecondsToMSS(secondsLeft)}
                </div>

                {/* Duration Fine-Tuning (-5m / +5m) */}
                {!isRunning && (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustDuration(-5)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs cursor-pointer"
                      title="Decrease 5 minutes"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono text-slate-400">
                      {mode === "focus" ? focusDuration : breakDuration} min
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustDuration(5)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs cursor-pointer"
                      title="Increase 5 minutes"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Active Task Pill below Ring */}
            {activeTask && (
              <div className="mt-3 px-4 py-2 rounded-2xl bg-slate-950/85 border border-emerald-500/30 flex items-center gap-2.5 max-w-md w-full justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">
                    Focusing on: {activeTask.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCompleteActiveTask(activeTask)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[11px] font-bold transition-colors shrink-0 cursor-pointer"
                >
                  Mark Done ✓
                </button>
              </div>
            )}
          </div>

          {/* Interactive Focus & Break Duration Sliders + Active Task Dropdown */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200 font-classic uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Session Duration Sliders & Target Task Dropdown</span>
              </div>
              {pendingTasks.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-white/10">
                  <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <select
                    id="focus-active-task-select"
                    aria-label="Select Active Focus Task"
                    value={activeTask?.id || ""}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer max-w-[200px] truncate"
                  >
                    {pendingTasks.map((tItem) => (
                      <option key={tItem.id} value={tItem.id} className="bg-slate-900 text-white">
                        Task: {tItem.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Focus Duration:</span>
                  <span className="font-mono font-bold text-amber-300">{focusDuration} min</span>
                </div>
                <input
                  id="focus-duration-slider"
                  type="range"
                  min={5}
                  max={180}
                  step={5}
                  disabled={isRunning}
                  value={focusDuration}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setFocusDuration(next);
                    if (mode === "focus" && !isRunning) {
                      setSecondsLeft(next * 60);
                    }
                  }}
                  aria-label="Focus Duration Minutes Slider"
                  className="w-full accent-amber-400 cursor-pointer disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Break Duration:</span>
                  <span className="font-mono font-bold text-cyan-300">{breakDuration} min</span>
                </div>
                <input
                  id="break-duration-slider"
                  type="range"
                  min={1}
                  max={60}
                  step={1}
                  disabled={isRunning}
                  value={breakDuration}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setBreakDuration(next);
                    if (mode === "break" && !isRunning) {
                      setSecondsLeft(next * 60);
                    }
                  }}
                  aria-label="Break Duration Minutes Slider"
                  className="w-full accent-cyan-400 cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Primary Timer Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              id="focus-timer-start-pause-btn"
              onClick={() => setIsRunning((prev) => !prev)}
              className={`min-h-[46px] px-7 py-3 rounded-2xl font-extrabold text-sm inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isRunning
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                  : "bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-slate-950" />
                  <span>Pause Session</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>
                    {secondsLeft < totalSeconds ? "Resume Focus" : `Start ${mode === "focus" ? focusDuration : breakDuration}m Session`}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              id="focus-timer-reset-btn"
              onClick={handleReset}
              className="min-h-[46px] px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            {(isRunning || secondsLeft < totalSeconds) && (
              <button
                type="button"
                id="focus-timer-complete-btn"
                onClick={handleCompleteEarly}
                className="min-h-[46px] px-4 py-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Log Session Now</span>
              </button>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Active Task Queue & Today's Focus Summary */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Focus Task Queue */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm sm:text-base font-bold font-heading text-white">
                  Focus Task Queue
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {pendingTasks.length} pending
              </span>
            </div>

            {/* Quick Add Task inside Focus Mode */}
            <form onSubmit={handleCreateQuickFocusTask} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a task to focus on right now..."
                value={quickTaskInput}
                onChange={(e) => setQuickTaskInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <select
                value={quickTaskPriority}
                onChange={(e) => setQuickTaskPriority(e.target.value as Priority)}
                aria-label="Quick task priority"
                className="px-2.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                type="submit"
                disabled={!quickTaskInput.trim()}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
              >
                + Add
              </button>
            </form>

            {/* Pending Tasks Selector */}
            {pendingTasks.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {pendingTasks.slice(0, 6).map((taskItem) => {
                  const isFocused = activeTask?.id === taskItem.id;
                  return (
                    <div
                      key={taskItem.id}
                      onClick={() => setSelectedTaskId(taskItem.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isFocused
                          ? "bg-emerald-500/15 border-emerald-500/40"
                          : "bg-slate-950/75 border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteActiveTask(taskItem);
                          }}
                          className="text-slate-400 hover:text-emerald-400 shrink-0 cursor-pointer"
                          title="Mark task completed"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">
                            {taskItem.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                            <span className="capitalize">{taskItem.priority}</span>
                            <span>·</span>
                            <span>{taskItem.date === todayStr ? "Today" : taskItem.date}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-mono font-bold shrink-0 ${
                          isFocused ? "text-emerald-300" : "text-slate-500"
                        }`}
                      >
                        {isFocused ? "Active Target" : "Select"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-center text-xs text-slate-400">
                All tasks completed! Add a new study task above to set your focus target.
              </div>
            )}
          </div>

          {/* Card 2: Today's Focus Summary & Log */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm sm:text-base font-bold font-heading text-white">
                  Focus Session Output
                </h2>
              </div>
              <span className="text-xs font-mono text-emerald-300">
                {(totalFocusMinutesAllTime / 60).toFixed(1)}h total
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/5">
                <div className="text-[11px] text-slate-400">Today's Focus</div>
                <div className="text-xl font-extrabold font-mono tabular-nums text-white mt-0.5">
                  {todayFocusMinutes}m
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/5">
                <div className="text-[11px] text-slate-400">Pomodoros Today</div>
                <div className="text-xl font-extrabold font-mono tabular-nums text-amber-300 mt-0.5">
                  {todayFocusLogs.length}
                </div>
              </div>
            </div>

            {todayFocusLogs.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-semibold text-slate-400">
                  Recent Sessions Today
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {todayFocusLogs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="px-3 py-2 rounded-xl bg-slate-950/70 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Focus Sprint</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-300">
                        {log.durationMinutes} min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
