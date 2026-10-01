import React, { useState } from "react";
import {
  Plus,
  Check,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  BookOpen,
  ClipboardList,
  Sliders,
} from "lucide-react";
import { Task, StudySession, FocusSessionLog, ActiveTab } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";
import { getTodayString } from "../../../utils/storage";
import { ModuleEmptyState } from "../../ModuleEmptyState";

interface DailyExecutionSectionProps {
  tasks: Task[];
  subjects?: { id: string; name: string }[];
  studySessions?: StudySession[];
  focusLogs?: FocusSessionLog[];
  currentLanguage: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
  onQuickAddTask?: () => void;
  onAddTask?: (task: Omit<Task, "id" | "createdAt">) => void;
  onToggleTask?: (task: Task) => void;
  tasksEmptyState?: React.ReactNode;
}

export const DailyExecutionSection: React.FC<DailyExecutionSectionProps> = ({
  tasks,
  currentLanguage,
  onNavigate,
  onQuickAddTask,
  onToggleTask,
  tasksEmptyState,
}) => {
  const todayStr = getTodayString();
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");

  // Today's tasks
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const pendingTasks = todayTasks.filter((t) => !t.completed);
  const completedTasks = todayTasks.filter((t) => t.completed);

  // Filtered tasks to display
  const statusFiltered =
    taskFilter === "pending"
      ? pendingTasks
      : taskFilter === "completed"
      ? completedTasks
      : todayTasks;

  const displayedTasks =
    priorityFilter === "all"
      ? statusFiltered
      : statusFiltered.filter((t) => t.priority === priorityFilter);

  const focusQuickTaskInput = () => {
    const el = document.getElementById("home-quick-task-input") as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (onQuickAddTask) {
      onQuickAddTask();
    } else {
      onNavigate("tasks");
    }
  };

  return (
    <section id="section-2-daily-execution" className="space-y-4">
      <div
        id="execution-tasks-card"
        className="glass-card classic-frame rounded-3xl p-5 sm:p-6 border border-amber-500/25 bg-slate-900/90 space-y-4 shadow-md"
      >
        {/* Top Classic Header & Filter Dropdowns */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold font-classic text-white">
                  {currentLanguage === "hi"
                    ? "आज की कार्य सूची (Today's Task Ledger)"
                    : "Today's Task Execution Ledger"}
                </h2>
                <span className="text-xs font-mono text-emerald-300 font-bold">
                  · {pendingTasks.length} Pending / {completedTasks.length} Done
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentLanguage === "hi"
                  ? "अपने दैनिक अध्ययन कार्यों को पूरा करने के लिए चेकबॉक्स पर क्लिक करें"
                  : "Check off completed study tasks or filter by status and priority"}
              </p>
            </div>
          </div>

          {/* Canonical Dropdown Filters + Open Task Manager */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/10">
              <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <label
                htmlFor="daily-execution-filter-select"
                className="text-[11px] font-semibold text-slate-400"
              >
                Status:
              </label>
              <select
                id="daily-execution-filter-select"
                aria-label="Filter Today's Tasks by Status"
                value={taskFilter}
                onChange={(e) =>
                  setTaskFilter(e.target.value as "all" | "pending" | "completed")
                }
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">
                  All ({todayTasks.length})
                </option>
                <option value="pending" className="bg-slate-900 text-white">
                  Pending ({pendingTasks.length})
                </option>
                <option value="completed" className="bg-slate-900 text-white">
                  Completed ({completedTasks.length})
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/10">
              <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <label
                htmlFor="daily-execution-priority-select"
                className="text-[11px] font-semibold text-slate-400"
              >
                Priority:
              </label>
              <select
                id="daily-execution-priority-select"
                aria-label="Filter Today's Tasks by Priority"
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(
                    e.target.value as "all" | "high" | "medium" | "low"
                  )
                }
                className="bg-transparent text-xs font-bold text-amber-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">
                  All Priorities
                </option>
                <option value="high" className="bg-slate-900 text-white">
                  High Priority
                </option>
                <option value="medium" className="bg-slate-900 text-white">
                  Medium Priority
                </option>
                <option value="low" className="bg-slate-900 text-white">
                  Low Priority
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 hover:text-white font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{currentLanguage === "hi" ? "टास्क मैनेजर" : "All Tasks"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Task Items List */}
        {displayedTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {displayedTasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask && onToggleTask(task)}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer card-press ${
                  task.completed
                    ? "bg-slate-950/50 border-white/5 opacity-65"
                    : "bg-slate-950/85 hover:bg-slate-900 border-white/10 hover:border-emerald-500/35"
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
                    className={`text-xs sm:text-sm font-medium truncate ${
                      task.completed ? "line-through text-slate-400" : "text-slate-100"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.subjectName && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span>{task.subjectName}</span>
                    </span>
                  )}
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
        ) : taskFilter !== "completed" && tasksEmptyState ? (
          tasksEmptyState
        ) : (
          <ModuleEmptyState
            id="home-tasks-empty-state"
            testId="tasks-empty-state"
            actionButtonId="tasks-empty-get-started-btn"
            title={
              taskFilter === "completed"
                ? currentLanguage === "hi"
                  ? "आज अभी तक कोई कार्य पूरा नहीं हुआ"
                  : "No Completed Tasks Yet Today"
                : currentLanguage === "hi"
                ? "आज के लिए कोई अध्ययन कार्य निर्धारित नहीं है"
                : "Your Today's Task Schedule is Empty"
            }
            description={
              taskFilter === "completed"
                ? currentLanguage === "hi"
                  ? "अपनी दैनिक प्रगति शुरू करने के लिए किसी कार्य को पूरा करें या नया कार्य जोड़ें।"
                  : "Check off a pending study task or add a new topic above to start building today's momentum."
                : currentLanguage === "hi"
                ? "अध्याय रिवीजन, होमवर्क या मॉक टेस्ट अभ्यास जोड़कर अपने अध्ययन दिवस की शुरुआत करें।"
                : "Plan your first chapter revision, assignment, or practice session to kickstart your study day."
            }
            illustration={ClipboardList}
            accentColor="emerald"
            actionLabel={
              currentLanguage === "hi"
                ? "शुरू करें — टास्क मैनेजर खोलें"
                : "Get Started"
            }
            onAction={() => onNavigate("tasks")}
            secondaryActionLabel={
              currentLanguage === "hi" ? "+ त्वरित कार्य जोड़ें" : "+ Focus Quick Add Input"
            }
            onSecondaryAction={focusQuickTaskInput}
          />
        )}

        {/* Progress summary bar at bottom */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>
            {completedTasks.length} of {todayTasks.length} tasks completed today
          </span>
          <span className="font-mono text-emerald-400 font-bold">
            {todayTasks.length > 0
              ? `${Math.round((completedTasks.length / todayTasks.length) * 100)}% Completion`
              : "Ready for Today"}
          </span>
        </div>
      </div>
    </section>
  );
};
