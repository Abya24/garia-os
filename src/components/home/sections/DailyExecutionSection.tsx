import React, { useState } from "react";
import {
  ListTodo,
  Plus,
  Check,
  Clock,
  Play,
  ArrowRight,
  Flame,
  Filter,
  CheckCircle2,
  AlertCircle,
  Timer,
  Sparkles,
} from "lucide-react";
import { Task, StudySession, FocusSessionLog, ActiveTab, Priority } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";
import { getTodayString } from "../../../utils/storage";

interface DailyExecutionSectionProps {
  tasks: Task[];
  studySessions?: StudySession[];
  focusLogs?: FocusSessionLog[];
  currentLanguage: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
  onQuickAddTask?: () => void;
  onAddTask?: (task: Omit<Task, "id" | "createdAt">) => void;
  onToggleTask?: (task: Task) => void;
}

export const DailyExecutionSection: React.FC<DailyExecutionSectionProps> = ({
  tasks,
  studySessions = [],
  focusLogs = [],
  currentLanguage,
  onNavigate,
  onQuickAddTask,
  onAddTask,
  onToggleTask,
}) => {
  const todayStr = getTodayString();
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState<Priority>("medium");
  const [isAdding, setIsAdding] = useState(false);

  // Today's tasks
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const pendingTasks = todayTasks.filter((t) => !t.completed);
  const completedTasks = todayTasks.filter((t) => t.completed);

  // Filtered tasks to display
  const displayedTasks =
    taskFilter === "pending"
      ? pendingTasks
      : taskFilter === "completed"
      ? completedTasks
      : todayTasks;

  // Study time & focus sessions today
  const todayStudySessions = studySessions.filter((s) => s.date === todayStr);
  const todayFocusLogs = focusLogs.filter(
    (l) => l.date === todayStr && l.type === "focus"
  );

  const studySecs = todayStudySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const focusMins = todayFocusLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalStudyMinutesToday = Math.round(studySecs / 60) + focusMins;
  const studyHours = Math.floor(totalStudyMinutesToday / 60);
  const studyMinsRem = totalStudyMinutesToday % 60;

  const dailyGoalMinutes = 180; // 3 hours default goal
  const studyProgressPercent = Math.min(
    100,
    Math.round((totalStudyMinutesToday / dailyGoalMinutes) * 100)
  );

  const handleInlineAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    if (onAddTask) {
      onAddTask({
        title: quickTitle.trim(),
        date: todayStr,
        priority: quickPriority,
        category: "study",
        completed: false,
      });
      setQuickTitle("");
      setIsAdding(false);
    } else if (onQuickAddTask) {
      onQuickAddTask();
    }
  };

  return (
    <section id="section-2-daily-execution" className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-white">
            {currentLanguage === "hi" ? "दैनिक कार्य व अध्ययन" : "Daily Execution"}
          </h2>
          <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
            {pendingTasks.length} Pending
          </span>
        </div>

        <button
          onClick={() => onNavigate("tasks")}
          className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
        >
          <span>{currentLanguage === "hi" ? "टास्क मैनेजर खोलें" : "Task Manager"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: Tasks (7 cols) + Focus Sessions & Study Time (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ========================================================================= */}
        {/* A. TODAY'S TASKS & PENDING TASKS CARD (7 cols)                           */}
        {/* ========================================================================= */}
        <div
          id="execution-tasks-card"
          className="lg:col-span-7 glass-card rounded-3xl p-5 border border-white/10 space-y-4 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-3">
            {/* Top Toolbar: Filter Tabs & Quick Add Button */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5 text-xs">
                <button
                  onClick={() => setTaskFilter("all")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    taskFilter === "all"
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({todayTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter("pending")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    taskFilter === "pending"
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pending ({pendingTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter("completed")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    taskFilter === "completed"
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Done ({completedTasks.length})
                </button>
              </div>

              {/* Add Task Trigger */}
              <button
                onClick={() => {
                  if (onAddTask) {
                    setIsAdding(!isAdding);
                  } else if (onQuickAddTask) {
                    onQuickAddTask();
                  }
                }}
                id="daily-add-task-btn"
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{currentLanguage === "hi" ? "नया कार्य" : "+ Add Task"}</span>
              </button>
            </div>

            {/* Inline Quick Add Form */}
            {isAdding && (
              <form
                onSubmit={handleInlineAddTask}
                className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="Enter today's task or topic to study..."
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as Priority)}
                    className="px-2.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-sm"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            )}

            {/* Task Items List */}
            {displayedTasks.length > 0 ? (
              <div className="space-y-2">
                {displayedTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask && onToggleTask(task)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer card-press ${
                      task.completed
                        ? "bg-slate-950/40 border-white/5 opacity-60"
                        : "bg-slate-900/60 hover:bg-slate-800/80 border-white/5 hover:border-emerald-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask && onToggleTask(task);
                        }}
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                          task.completed
                            ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm"
                            : "border-slate-600 hover:border-emerald-400 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span
                        className={`text-xs font-medium truncate ${
                          task.completed ? "line-through text-slate-400" : "text-slate-100"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.time && (
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {task.time}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase font-mono ${
                          task.priority === "high"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : task.priority === "medium"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-700/40 text-slate-300 border border-slate-600/40"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto" />
                <p className="text-xs text-slate-300">
                  {taskFilter === "completed"
                    ? "No completed tasks yet today."
                    : "No pending tasks scheduled for today. You are completely on track!"}
                </p>
                <button
                  onClick={() => {
                    if (onAddTask) setIsAdding(true);
                    else if (onQuickAddTask) onQuickAddTask();
                  }}
                  className="text-xs text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentLanguage === "hi" ? "+ नया कार्य जोड़ें" : "+ Schedule a study task"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Progress summary bar at bottom */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>
              {completedTasks.length} of {todayTasks.length} tasks completed today
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {todayTasks.length > 0
                ? `${Math.round((completedTasks.length / todayTasks.length) * 100)}%`
                : "100%"}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* B. FOCUS SESSIONS & STUDY TIME TODAY CARD (5 cols)                       */}
        {/* ========================================================================= */}
        <div
          id="execution-focus-study-card"
          className="lg:col-span-5 glass-card rounded-3xl p-5 border border-white/10 space-y-4 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white">
                    {currentLanguage === "hi" ? "अध्ययन समय व पोमोडोरो" : "Study Time & Focus"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {todayFocusLogs.length} Focus sessions logged today
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate("focus")}
                className="text-xs text-amber-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Timer</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Prominent Study Time Counter Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-amber-950/20 border border-amber-500/20 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Clocked Today
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight mt-0.5">
                    {studyHours > 0 ? `${studyHours}h ` : ""}
                    {studyMinsRem}m
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Daily Goal
                  </div>
                  <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                    3h 00m
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, studyProgressPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>{studyProgressPercent}% of Daily Target</span>
                  <span>{todayFocusLogs.length} Pomodoro Blocks</span>
                </div>
              </div>
            </div>

            {/* Quick Action: Start Focus Session */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quick Start Focus Mode</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate("focus")}
                  className="p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-left transition-all card-press active:scale-95 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-200">
                      25m Focus
                    </span>
                    <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-emerald-400/80 mt-0.5">
                    Classic Pomodoro
                  </div>
                </button>

                <button
                  onClick={() => onNavigate("focus")}
                  className="p-3 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-left transition-all card-press active:scale-95 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-200">
                      50m Deep Work
                    </span>
                    <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                  </div>
                  <div className="text-[10px] text-cyan-400/80 mt-0.5">
                    Extended Block
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
