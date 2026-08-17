import React from "react";
import { BarChart3, Clock, Target, ArrowRight, TrendingUp } from "lucide-react";
import { Subject, StudySession, FocusSessionLog, Task, ActiveTab } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";
import { getTodayString } from "../../../utils/storage";

interface StudyProgressWidgetProps {
  subjects: Subject[];
  studySessions?: StudySession[];
  focusLogs?: FocusSessionLog[];
  tasks?: Task[];
  streamLabel?: string;
  currentLanguage: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
}

export const StudyProgressWidget: React.FC<StudyProgressWidgetProps> = ({
  subjects,
  studySessions = [],
  focusLogs = [],
  tasks = [],
  streamLabel = "Syllabus Subjects",
  currentLanguage,
  onNavigate,
}) => {
  const todayStr = getTodayString();

  // Calculate Today's Study Time
  const todaySessions = studySessions.filter((s) => s.date === todayStr);
  const todayFocusLogs = focusLogs.filter(
    (l) => l.date === todayStr && l.type === "focus"
  );

  const studySecs = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const focusMins = todayFocusLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const todayStudyMinutes = Math.round(studySecs / 60) + focusMins;
  const todayStudyHours = Math.floor(todayStudyMinutes / 60);
  const todayStudyMinsRem = todayStudyMinutes % 60;

  // Study Target Percent
  const totalTargetMinutes = subjects.reduce(
    (acc, s) => acc + (s.targetMinutesPerWeek || 0),
    0
  );
  const totalCompletedMinutes = subjects.reduce(
    (acc, s) => acc + (s.completedMinutes || 0),
    0
  );
  const studyProgressPercent =
    totalTargetMinutes > 0
      ? Math.min(100, Math.round((totalCompletedMinutes / totalTargetMinutes) * 100))
      : 0;

  // Task Completion calculation
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedTodayTasks = todayTasks.filter((t) => t.completed);
  const taskProgressPercent =
    todayTasks.length > 0
      ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
      : 50;

  // Overall Productivity Score
  const overallScorePercent = Math.min(
    100,
    Math.round(studyProgressPercent * 0.5 + taskProgressPercent * 0.5)
  );

  return (
    <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading text-white">
              {currentLanguage === "hi" ? "अध्ययन प्रगति" : "Study Progress"}
            </h3>
            <p className="text-[11px] text-slate-400">
              {currentLanguage === "hi"
                ? "दैनिक व साप्ताहिक अध्ययन मेट्रिक्स"
                : "Daily & weekly learning metrics"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
            {overallScorePercent}% Score
          </div>
          <button
            onClick={() => onNavigate("stats")}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>{currentLanguage === "hi" ? "एनालिटिक्स" : "Stats"}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Productivity Score Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-300">
          <span>{currentLanguage === "hi" ? "दैनिक उत्पादकता स्कोर" : "Daily Productivity"}</span>
          <span className="text-emerald-400 font-mono">{overallScorePercent}%</span>
        </div>
        <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, overallScorePercent)}%` }}
          />
        </div>
      </div>

      {/* Quick Metrics Mini Grid */}
      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
        {/* Study Hours */}
        <div
          onClick={() => onNavigate("study")}
          className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer card-press"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{currentLanguage === "hi" ? "अध्ययन समय" : "Today's Study"}</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base font-bold font-heading text-white mt-1 font-mono">
            {todayStudyHours > 0
              ? `${todayStudyHours}h ${todayStudyMinsRem}m`
              : `${todayStudyMinutes} mins`}
          </div>
          <div className="text-[10px] text-cyan-400 mt-0.5">
            {studyProgressPercent}% {currentLanguage === "hi" ? "साप्ताहिक लक्ष्य" : "weekly target"}
          </div>
        </div>

        {/* Weekly Completion */}
        <div
          onClick={() => onNavigate("stats")}
          className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer card-press"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{currentLanguage === "hi" ? "सत्र गणना" : "Logged Sessions"}</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-bold font-heading text-white mt-1 font-mono">
            {todaySessions.length + todayFocusLogs.length} <span className="text-xs text-slate-400 font-normal">sessions</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            {totalCompletedMinutes}m {currentLanguage === "hi" ? "कुल रिकॉर्डेड" : "logged this week"}
          </div>
        </div>
      </div>

      {/* Stream Subjects Mini List */}
      {subjects.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{streamLabel}</span>
            <span className="text-[10px] font-mono text-slate-500">Weekly Target</span>
          </div>
          <div className="space-y-1.5">
            {subjects.slice(0, 3).map((sub) => {
              const pct =
                sub.targetMinutesPerWeek > 0
                  ? Math.min(
                      100,
                      Math.round((sub.completedMinutes / sub.targetMinutesPerWeek) * 100)
                    )
                  : 0;
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-2 text-xs p-2 rounded-xl bg-slate-900/40 border border-white/5"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color || "#10b981" }}
                    />
                    <span className="font-semibold text-white truncate">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {sub.completedMinutes}/{sub.targetMinutesPerWeek}m
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
