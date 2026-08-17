import React from "react";
import { ListTodo, Plus, Check, CheckCircle2, ArrowRight } from "lucide-react";
import { Task, ActiveTab } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";
import { getTodayString } from "../../../utils/storage";

interface TodaysTasksWidgetProps {
  tasks: Task[];
  currentLanguage: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
  onQuickAddTask: () => void;
  onToggleTask?: (task: Task) => void;
}

export const TodaysTasksWidget: React.FC<TodaysTasksWidgetProps> = ({
  tasks,
  currentLanguage,
  onNavigate,
  onQuickAddTask,
  onToggleTask,
}) => {
  const todayStr = getTodayString();
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedTodayTasks = todayTasks.filter((t) => t.completed);
  const taskProgressPercent =
    todayTasks.length > 0
      ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
      : 0;

  return (
    <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading text-white">
              {currentLanguage === "hi" ? "आज के कार्य" : "Today's Tasks"}
            </h3>
            <p className="text-[11px] text-slate-400">
              {todayTasks.length > 0
                ? `${completedTodayTasks.length} of ${todayTasks.length} completed (${taskProgressPercent}%)`
                : currentLanguage === "hi"
                ? "आज के लिए कोई कार्य निर्धारित नहीं है।"
                : "No tasks scheduled for today."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onQuickAddTask}
            id="dashboard-add-task-btn"
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1 border border-emerald-500/30 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{currentLanguage === "hi" ? "जोड़ें" : "New"}</span>
          </button>
          <button
            onClick={() => onNavigate("tasks")}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>{currentLanguage === "hi" ? "सभी" : "View All"}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {todayTasks.length > 0 ? (
        <div className="space-y-2">
          {todayTasks.slice(0, 5).map((task) => (
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
                      ? "bg-emerald-500 border-emerald-400 text-slate-950"
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

              <div className="flex items-center gap-1.5 shrink-0">
                {task.priority && (
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase font-mono ${
                      task.priority === "high"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : task.priority === "medium"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-slate-700/50 text-slate-300 border border-slate-600/50"
                    }`}
                  >
                    {task.priority}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center space-y-1.5">
          <p className="text-xs text-slate-400">
            {currentLanguage === "hi" ? "आज के लिए कोई कार्य नहीं है।" : "Your task list is all clear today."}
          </p>
          <button
            onClick={onQuickAddTask}
            className="text-xs text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>{currentLanguage === "hi" ? "दैनिक कार्य जोड़ें" : "Add daily study task"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
