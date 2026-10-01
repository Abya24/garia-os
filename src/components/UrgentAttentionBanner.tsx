import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  Clock,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Task, ActiveTab } from "../types";
import { AppLanguage } from "../utils/i18n";

export interface UrgentAttentionBannerProps {
  overdueTasks: Task[];
  todayStr: string;
  currentLanguage?: AppLanguage;
  onMarkTaskDone: (task: Task) => void;
  onRescheduleTask: (task: Task, newDateStr: string) => void;
  onMarkAllOverdueDone?: () => void;
  onRescheduleAllOverdue?: (newDateStr: string) => void;
  onAddSampleOverdueTask?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
  className?: string;
}

export const UrgentAttentionBanner: React.FC<UrgentAttentionBannerProps> = ({
  overdueTasks = [],
  todayStr,
  currentLanguage = "en",
  onMarkTaskDone,
  onRescheduleTask,
  onMarkAllOverdueDone,
  onRescheduleAllOverdue,
  onAddSampleOverdueTask,
  onNavigate,
  className = "",
}) => {
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [showAllOverdue, setShowAllOverdue] = useState<boolean>(false);

  const overdueCount = overdueTasks.length;
  const hasOverdue = overdueCount > 0;
  const displayedTasks = showAllOverdue
    ? overdueTasks
    : overdueTasks.slice(0, 3);

  const getDaysOverdue = (dueDateStr: string): number => {
    if (!dueDateStr) return 1;
    const tParts = todayStr.split("-").map(Number);
    const dParts = dueDateStr.split("-").map(Number);
    const tMs = new Date(
      tParts[0] || 2026,
      (tParts[1] || 1) - 1,
      tParts[2] || 1
    ).getTime();
    const dMs = new Date(
      dParts[0] || 2026,
      (dParts[1] || 1) - 1,
      dParts[2] || 1
    ).getTime();
    return Math.max(1, Math.round((tMs - dMs) / 86400000));
  };

  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleBannerMarkDone = () => {
    if (hasOverdue) {
      if (overdueCount === 1) {
        onMarkTaskDone(overdueTasks[0]);
        triggerFeedback(
          currentLanguage === "hi"
            ? `"${overdueTasks[0].title}" पूर्ण चिह्नित किया गया ✓`
            : `Marked "${overdueTasks[0].title}" as done ✓`
        );
      } else if (onMarkAllOverdueDone) {
        onMarkAllOverdueDone();
        triggerFeedback(
          currentLanguage === "hi"
            ? `सभी ${overdueCount} लंबित कार्य पूर्ण चिह्नित किए गए ✓`
            : `Marked all ${overdueCount} overdue tasks as done ✓`
        );
      } else {
        onMarkTaskDone(overdueTasks[0]);
        triggerFeedback(
          currentLanguage === "hi"
            ? `"${overdueTasks[0].title}" पूर्ण चिह्नित किया गया ✓`
            : `Marked "${overdueTasks[0].title}" as done ✓`
        );
      }
    } else {
      triggerFeedback(
        currentLanguage === "hi"
          ? "सभी कार्य पहले से ही पूर्ण हैं ✓"
          : "All overdue tasks are already marked done ✓"
      );
    }
  };

  const handleBannerReschedule = () => {
    if (hasOverdue) {
      if (overdueCount === 1) {
        onRescheduleTask(overdueTasks[0], todayStr);
        triggerFeedback(
          currentLanguage === "hi"
            ? `"${overdueTasks[0].title}" आज (${todayStr}) के लिए पुनर्निर्धारित किया गया ✓`
            : `Rescheduled "${overdueTasks[0].title}" to Today (${todayStr}) ✓`
        );
      } else if (onRescheduleAllOverdue) {
        onRescheduleAllOverdue(todayStr);
        triggerFeedback(
          currentLanguage === "hi"
            ? `सभी ${overdueCount} लंबित कार्य आज के लिए पुनर्निर्धारित किए गए ✓`
            : `Rescheduled all ${overdueCount} overdue tasks to Today (${todayStr}) ✓`
        );
      } else {
        onRescheduleTask(overdueTasks[0], todayStr);
        triggerFeedback(
          currentLanguage === "hi"
            ? `"${overdueTasks[0].title}" आज के लिए पुनर्निर्धारित किया गया ✓`
            : `Rescheduled "${overdueTasks[0].title}" to Today (${todayStr}) ✓`
        );
      }
    } else {
      triggerFeedback(
        currentLanguage === "hi"
          ? "कोई लंबित कार्य पुनर्निर्धारित करने के लिए शेष नहीं है ✓"
          : `Schedule is up to date for Today (${todayStr}) ✓`
      );
    }
  };

  return (
    <section
      id="home-urgent-attention-banner"
      data-testid="urgent-attention-banner"
      data-overdue-count={overdueCount}
      role="region"
      aria-label="Urgent Attention Overdue Tasks Banner"
      className={`glass-card rounded-3xl p-4 sm:p-5 border transition-all shadow-lg space-y-3.5 ${
        hasOverdue
          ? "border-rose-500/45 bg-gradient-to-r from-rose-950/60 via-slate-900/95 to-amber-950/35"
          : "border-amber-500/25 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-amber-950/20"
      } ${className}`}
    >
      {/* Top Banner Bar: Urgent Attention Header, Overdue Count Badge, and Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
              hasOverdue
                ? "bg-rose-500/20 border-rose-500/45 text-rose-400"
                : "bg-amber-500/15 border-amber-500/35 text-amber-400"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  hasOverdue ? "text-rose-300" : "text-amber-300"
                }`}
              >
                {currentLanguage === "hi"
                  ? "तत्काल ध्यान दें (Urgent Attention)"
                  : "Urgent Attention"}
              </span>
              <span aria-hidden="true" className="text-slate-500">
                ·
              </span>
              <span
                id="urgent-attention-overdue-count"
                data-testid="urgent-overdue-count"
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono tabular-nums font-extrabold border ${
                  hasOverdue
                    ? "bg-rose-500/25 border-rose-400/50 text-rose-200"
                    : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                }`}
              >
                {overdueCount}{" "}
                {overdueCount === 1 ? "Overdue Task" : "Overdue Tasks"}
              </span>
            </div>

            <h2 className="text-sm sm:text-base font-bold font-heading text-white">
              {hasOverdue
                ? currentLanguage === "hi"
                  ? `आपके पास ${overdueCount} समय-सीमा समाप्त (Overdue) अध्ययन कार्य हैं`
                  : `You have ${overdueCount} overdue study ${
                      overdueCount === 1 ? "task" : "tasks"
                    } requiring immediate action`
                : currentLanguage === "hi"
                ? "कोई समय-सीमा समाप्त कार्य नहीं — आपके सभी कार्य समय पर हैं"
                : "Zero Overdue Tasks — Your Study Schedule is On Track"}
            </h2>
          </div>
        </div>

        {/* Banner-Level Quick Actions: 'Mark Done' and 'Reschedule' */}
        <div className="flex flex-wrap items-center gap-2">
          {actionFeedback && (
            <span
              id="urgent-attention-feedback"
              data-testid="urgent-attention-feedback"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{actionFeedback}</span>
            </span>
          )}

          <button
            type="button"
            id="urgent-banner-mark-done-btn"
            data-testid="urgent-mark-done-btn"
            onClick={handleBannerMarkDone}
            className="min-h-[38px] px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>
              {currentLanguage === "hi"
                ? "पूर्ण चिह्नित करें (Mark Done)"
                : overdueCount > 1
                ? `Mark Done (${overdueCount})`
                : "Mark Done"}
            </span>
          </button>

          <button
            type="button"
            id="urgent-banner-reschedule-btn"
            data-testid="urgent-reschedule-btn"
            onClick={handleBannerReschedule}
            className="min-h-[38px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <CalendarClock className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>
              {currentLanguage === "hi"
                ? "पुनर्निर्धारित करें (Reschedule)"
                : overdueCount > 1
                ? `Reschedule (${overdueCount})`
                : "Reschedule"}
            </span>
          </button>

          {!hasOverdue && onAddSampleOverdueTask && (
            <button
              type="button"
              id="urgent-banner-simulate-overdue-btn"
              data-testid="urgent-simulate-overdue-btn"
              onClick={onAddSampleOverdueTask}
              title="Add a sample overdue study task to test urgent actions"
              className="min-h-[38px] px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/35 text-slate-300 hover:text-rose-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {currentLanguage === "hi"
                  ? "+ लंबित कार्य जोड़ें"
                  : "+ Overdue Task"}
              </span>
            </button>
          )}

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="min-h-[38px] px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{currentLanguage === "hi" ? "कार्य" : "Tasks"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Individual Overdue Task Items List (Rendered when overdueCount > 0) */}
      {hasOverdue && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="grid grid-cols-1 gap-2">
            {displayedTasks.map((task) => {
              const daysLate = getDaysOverdue(task.date);
              return (
                <div
                  key={task.id}
                  data-testid={`overdue-task-item-${task.id}`}
                  className="p-3 rounded-2xl bg-slate-950/85 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-rose-400 font-bold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {daysLate}d overdue (Due {task.date})
                        </span>
                      </span>
                      {task.subjectName && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-indigo-300 font-semibold">
                            {task.subjectName}
                          </span>
                        </>
                      )}
                      <span className="text-slate-600">·</span>
                      <span className="uppercase text-amber-300 font-semibold">
                        {task.priority} priority
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-testid={`overdue-mark-done-${task.id}`}
                      onClick={() => {
                        onMarkTaskDone(task);
                        triggerFeedback(
                          `Marked "${task.title}" as done ✓`
                        );
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/40 text-emerald-300 hover:text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Done</span>
                    </button>

                    <button
                      type="button"
                      data-testid={`overdue-reschedule-${task.id}`}
                      onClick={() => {
                        onRescheduleTask(task, todayStr);
                        triggerFeedback(
                          `Rescheduled "${task.title}" to Today (${todayStr}) ✓`
                        );
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 text-amber-300 hover:text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {overdueCount > 3 && (
            <button
              type="button"
              onClick={() => setShowAllOverdue((prev) => !prev)}
              className="text-xs font-semibold text-rose-300 hover:text-white transition-colors cursor-pointer"
            >
              {showAllOverdue
                ? "Show fewer overdue tasks"
                : `View all ${overdueCount} overdue tasks (+${
                    overdueCount - 3
                  } more)`}
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default UrgentAttentionBanner;
