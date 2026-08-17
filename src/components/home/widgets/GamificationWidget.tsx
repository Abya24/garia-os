import React from "react";
import { Flame, ShieldAlert, Calendar, ChevronRight } from "lucide-react";
import { ActiveTab, ExamIntelligenceReport } from "../../../types";
import { GamificationState } from "../../../utils/gamificationEngine";

interface GamificationWidgetProps {
  gamification: GamificationState;
  examReport: ExamIntelligenceReport;
  targetExamName: string;
  daysUntilExam: number;
  onNavigate: (tab: ActiveTab) => void;
}

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({
  gamification,
  examReport,
  targetExamName,
  daysUntilExam,
  onNavigate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* A. Level, XP & Streak Card */}
      <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900/90 to-slate-900/90 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-sm shadow-sm font-mono">
              L{gamification.currentLevel}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-heading text-white">
                  {gamification.levelTitle}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {gamification.totalXP} XP
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-amber-300 font-semibold">{gamification.currentStreak} Day Streak</span>
                <span>•</span>
                <span>{gamification.latestBadge?.icon || "🌱"} {gamification.latestBadge?.name || "Scholar"}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("stats")}
            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-semibold border border-white/10 transition-all flex items-center gap-1 active:scale-95"
          >
            <span>Badges</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Level Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-slate-400">
            <span>Next Level Progress</span>
            <span className="font-mono text-emerald-400 font-semibold">{gamification.levelProgressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, gamification.levelProgressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* B. Exam Countdown & Readiness Card */}
      <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900/90 to-slate-900/90 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-heading text-white truncate max-w-[180px]">
                  {targetExamName}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-300 font-bold font-mono">{daysUntilExam} Days Left</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{examReport.overallReadinessScore || 70}% Ready</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("exam")}
            className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-[11px] font-semibold border border-cyan-500/30 transition-all flex items-center gap-1 active:scale-95"
          >
            <span>Exam Prep</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Readiness Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-slate-400">
            <span>Exam Readiness Score</span>
            <span className="font-mono text-cyan-400 font-semibold">{examReport.overallReadinessScore || 70}%</span>
          </div>
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, examReport.overallReadinessScore || 70)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
