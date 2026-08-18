import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Droplet,
  ShieldAlert,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  Bot,
  Zap,
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
  ExamTestRecord,
  ExamProfile,
  CareerProfile,
  Priority,
  TaskCategory,
} from "../types";
import { getTodayString } from "../utils/storage";
import { calculateGamificationState } from "../utils/gamificationEngine";
import { generateExamIntelligenceReport } from "../utils/examIntelligenceEngine";
import { AppLanguage, translations } from "../utils/i18n";

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
  examTestRecords?: ExamTestRecord[];
  examProfile?: ExamProfile;
  careerProfile?: CareerProfile;
  settings: UserSettings;
  activeStudent?: StudentProfile;
  currentLanguage?: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
  onQuickAddTask?: () => void;
  onAddTask?: (task: Omit<Task, "id" | "createdAt">) => void;
  onAddWaterGlass: () => void;
  onRemoveWaterGlass?: () => void;
  onToggleTask?: (task: Task) => void;
  onToggleHabit?: (habitId: string, dateStr: string) => void;
  onOpenSliderMenu?: () => void;
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
  examTestRecords = [],
  examProfile,
  careerProfile,
  settings,
  activeStudent,
  currentLanguage = "en",
  onNavigate,
  onQuickAddTask,
  onAddTask,
  onAddWaterGlass,
  onRemoveWaterGlass,
  onToggleTask,
  onToggleHabit,
  onOpenSliderMenu,
}) => {
  const todayStr = getTodayString();
  const t = translations[currentLanguage] || translations.en;

  // Inline quick add task state
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");

  // Focus Timer Mini State
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSecondsLeft]);

  const handleSwitchTimerMode = (mode: "focus" | "shortBreak" | "longBreak") => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    if (mode === "focus") setTimerSecondsLeft(25 * 60);
    else if (mode === "shortBreak") setTimerSecondsLeft(5 * 60);
    else setTimerSecondsLeft(15 * 60);
  };

  const formatTimerTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Productivity Score Calculation
  const gamification = useMemo(() => {
    return calculateGamificationState(
      activeStudent,
      tasks || [],
      studySessions || [],
      focusLogs || [],
      habits || [],
      goals || [],
      examTestRecords || [],
      [],
      undefined
    );
  }, [activeStudent, tasks, studySessions, focusLogs, habits, goals, examTestRecords]);

  // Today's tasks filtering
  const todaysTasks = useMemo(() => {
    return tasks.filter((task) => task.date === todayStr);
  }, [tasks, todayStr]);

  const displayedTasks = useMemo(() => {
    if (taskFilter === "pending") return todaysTasks.filter((t) => !t.completed);
    if (taskFilter === "completed") return todaysTasks.filter((t) => t.completed);
    return todaysTasks;
  }, [todaysTasks, taskFilter]);

  const completedTodayCount = todaysTasks.filter((t) => t.completed).length;
  const taskCompletionRate = todaysTasks.length > 0
    ? Math.round((completedTodayCount / todaysTasks.length) * 100)
    : 100;

  // Exam Intelligence Report
  const examReport = useMemo(() => {
    if (!activeStudent) return null;
    return generateExamIntelligenceReport(
      activeStudent,
      examProfile,
      examTestRecords || [],
      [],
      [],
      [],
      [],
      [],
      careerProfile
    );
  }, [activeStudent, examProfile, examTestRecords, careerProfile]);

  const handleInlineSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTaskTitle.trim()) return;
    if (onAddTask) {
      onAddTask({
        title: inlineTaskTitle.trim(),
        date: todayStr,
        priority: "medium",
        category: "study",
        completed: false,
      });
    }
    setInlineTaskTitle("");
  };

  // Focus time today
  const todayFocusMinutes = useMemo(() => {
    return focusLogs
      .filter((l) => l.date === todayStr && l.type === "focus")
      .reduce((acc, l) => acc + l.durationMinutes, 0);
  }, [focusLogs, todayStr]);

  // Abya AI Suggestions
  const abyaSuggestions = useMemo(() => {
    const list = [];
    if (todaysTasks.filter((t) => !t.completed).length > 0) {
      list.push({
        id: "task_focus",
        title: "Focus on High Priority Tasks",
        desc: `You have ${todaysTasks.filter((t) => !t.completed).length} pending task(s) for today.`,
        actionTab: "tasks" as ActiveTab,
        actionLabel: "View Tasks",
        tag: "Priority",
        color: "emerald",
      });
    }
    if (todayFocusMinutes < 45) {
      list.push({
        id: "pomodoro_boost",
        title: "Start a 25m Focus Block",
        desc: "Deep focus session boosts syllabus retention by 40%.",
        actionTab: "focus" as ActiveTab,
        actionLabel: "Start Focus",
        tag: "Study Hack",
        color: "cyan",
      });
    }
    if (water.glasses < (water.goal || 8)) {
      list.push({
        id: "hydration_boost",
        title: "Stay Hydrated for Brain Health",
        desc: `Logged ${water.glasses}/${water.goal || 8} glasses. Keep your mind refreshed.`,
        actionTab: "water" as ActiveTab,
        actionLabel: "Drink Water",
        tag: "Health",
        color: "blue",
      });
    }
    if (list.length === 0) {
      list.push({
        id: "general_motivation",
        title: "All Goals on Track Today!",
        desc: "Great momentum. Keep reviewing your notes and staying consistent.",
        actionTab: "notes" as ActiveTab,
        actionLabel: "Open Notes",
        tag: "Momentum",
        color: "purple",
      });
    }
    return list;
  }, [todaysTasks, todayFocusMinutes, water]);

  return (
    <div className="space-y-5 pb-24 md:pb-8 animate-in fade-in duration-200 max-w-6xl mx-auto">
      {/* 7 CORE WIDGETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
        
        {/* WIDGET 1: PRODUCTIVITY SCORE CARD (Col 12 on mobile, Col 7 on desktop) */}
        <div className="col-span-1 md:col-span-7 glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Productivity Score</h3>
                <p className="text-[11px] text-slate-400">Real-time daily study velocity</p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Level {gamification.level}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
                {gamification.currentXP}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                Total XP
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-mono">
                {taskCompletionRate}%
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                Tasks Done
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">
                {todayFocusMinutes}m
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                Focus Today
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-rose-400 font-mono flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-rose-400 text-rose-400" />
                <span>{gamification.streakDays}d</span>
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                Day Streak
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 3: FOCUS TIMER MINI (Col 12 on mobile, Col 5 on desktop) */}
        <div className="col-span-1 md:col-span-5 glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Focus Timer</h3>
                  <p className="text-[11px] text-slate-400">Pomodoro Productivity</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("focus")}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>Full App</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex p-1 rounded-xl bg-slate-800/80 border border-white/5 mb-3 text-xs">
              <button
                onClick={() => handleSwitchTimerMode("focus")}
                className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                  timerMode === "focus"
                    ? "bg-emerald-500/20 text-emerald-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => handleSwitchTimerMode("shortBreak")}
                className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                  timerMode === "shortBreak"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Break (5m)
              </button>
            </div>
          </div>

          {/* Time Display & Actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {formatTimerTime(timerSecondsLeft)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTimerRunning((prev) => !prev)}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  isTimerRunning
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleSwitchTimerMode(timerMode)}
                aria-label="Reset Timer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* WIDGET 2: TODAY'S TASKS (Col 12 on mobile, Col 7 on desktop) */}
        <div className="col-span-1 md:col-span-7 glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/70 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Today's Tasks</h3>
                <p className="text-[11px] text-slate-400">
                  {completedTodayCount} of {todaysTasks.length} completed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTaskFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  taskFilter === "all" ? "bg-white/15 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTaskFilter("pending")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  taskFilter === "pending" ? "bg-white/15 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => onNavigate("tasks")}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 ml-1 flex items-center"
              >
                <span>More</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Inline Quick Add Task */}
          <form onSubmit={handleInlineSubmitTask} className="relative">
            <input
              type="text"
              value={inlineTaskTitle}
              onChange={(e) => setInlineTaskTitle(e.target.value)}
              placeholder="Quick add a task for today..."
              className="w-full pl-9 pr-16 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <Plus className="w-4 h-4 text-emerald-400 absolute left-3 top-3 pointer-events-none" />
            <button
              type="submit"
              disabled={!inlineTaskTitle.trim()}
              className="absolute right-1.5 top-1.5 px-3 py-1 rounded-lg bg-emerald-500 disabled:opacity-40 text-slate-950 text-xs font-bold transition-all"
            >
              Add
            </button>
          </form>

          {/* Task Items List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
            {displayedTasks.length > 0 ? (
              displayedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTask && onToggleTask(task)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                    task.completed
                      ? "bg-slate-900/40 border-white/5 text-slate-500 line-through opacity-70"
                      : "bg-slate-800/60 hover:bg-slate-800 border-white/5 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      className="shrink-0 text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <span className="text-xs font-medium truncate">{task.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.priority === "high" && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        High
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {task.time || "Today"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No tasks for today. Add one above to get started!
              </div>
            )}
          </div>
        </div>

        {/* WIDGET 4 & 5: HABIT TRACKER & WATER TRACKER (Col 12 on mobile, Col 5 on desktop) */}
        <div className="col-span-1 md:col-span-5 space-y-4">
          {/* WIDGET 4: HABIT TRACKER */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Habits & Streaks</h3>
                  <p className="text-[11px] text-slate-400">Daily habit consistency</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("habits")}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center"
              >
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {habits.slice(0, 3).map((habit) => {
                const isCompletedToday = habit.completedDates?.includes(todayStr);
                return (
                  <div
                    key={habit.id}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => onToggleHabit && onToggleHabit(habit.id, todayStr)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isCompletedToday
                            ? "bg-rose-500 border-rose-500 text-white"
                            : "border-slate-600 hover:border-rose-400"
                        }`}
                      >
                        {isCompletedToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {habit.title}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1 shrink-0">
                      <Flame className="w-3 h-3" />
                      {habit.streak || 0}d
                    </span>
                  </div>
                );
              })}

              {habits.length === 0 && (
                <button
                  onClick={() => onNavigate("habits")}
                  className="w-full py-3 rounded-xl border border-dashed border-white/10 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  + Add your first study habit
                </button>
              )}
            </div>
          </div>

          {/* WIDGET 5: WATER TRACKER */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Water Intake</h3>
                  <p className="text-[11px] text-slate-400">
                    {water.glasses} / {water.goal || 8} glasses ({(water.glasses * 250) / 1000}L)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onRemoveWaterGlass && water.glasses > 0 && (
                  <button
                    onClick={onRemoveWaterGlass}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5 flex items-center justify-center text-xs font-bold transition-colors"
                  >
                    -
                  </button>
                )}
                <button
                  onClick={onAddWaterGlass}
                  className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors active:scale-95 shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Drink</span>
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((water.glasses / (water.goal || 8)) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* WIDGET 6: EXAM INTELLIGENCE (Col 12 on mobile, Col 6 on desktop) */}
        <div className="col-span-1 md:col-span-6 glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Exam Intelligence</h3>
                  <p className="text-[11px] text-slate-400">Target board & readiness</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("exam")}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center"
              >
                <span>Exam Center</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-800 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {examProfile?.targetExamName || `${activeStudent?.stream || "Board"} Final Exams`}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                  {examReport.daysUntilExam > 0
                    ? `${examReport.daysUntilExam} Days Left`
                    : "Exam Ready"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Readiness Score:</span>
                <span className="font-bold text-emerald-400">{examReport.overallReadinessScore}%</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Target Goal: {examProfile?.targetScorePercentage || 95}%</span>
            <button
              onClick={() => onNavigate("exam")}
              className="text-xs text-indigo-400 font-bold hover:underline"
            >
              Analyze Weak Areas →
            </button>
          </div>
        </div>

        {/* WIDGET 7: ABYA AI SUGGESTIONS (Col 12 on mobile, Col 6 on desktop) */}
        <div className="col-span-1 md:col-span-6 glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Abya AI Suggestions</h3>
                  <p className="text-[11px] text-slate-400">Adaptive personalized recommendations</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("abya")}
                className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center"
              >
                <span>Ask Abya</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {abyaSuggestions.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/15 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate">{item.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.desc}</p>
                  </div>

                  <button
                    onClick={() => onNavigate(item.actionTab)}
                    className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold shrink-0 transition-colors"
                  >
                    {item.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Powered by Abya AI Engine</span>
            <button
              onClick={() => onNavigate("abya")}
              className="text-xs text-purple-400 font-bold hover:underline"
            >
              Open AI Chat →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
