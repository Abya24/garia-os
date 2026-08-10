import React from "react";
import { Award, Zap, ArrowRight, ShieldAlert, CheckCircle2, TrendingUp, HelpCircle } from "lucide-react";
import { ExamIntelligenceReport } from "../types";

interface ExamIntelligenceWidgetProps {
  report: ExamIntelligenceReport;
  onNavigate: (tab: string) => void;
}

export const ExamIntelligenceWidget: React.FC<ExamIntelligenceWidgetProps> = ({
  report,
  onNavigate,
}) => {
  const {
    overallReadinessScore,
    readinessCategory,
    hasSufficientData,
    strongSubjects,
    weakSubjects,
    latestTestPercentage,
    nextBestAction,
  } = report;

  const topStrong = strongSubjects[0]?.subjectName || "None";
  const topWeak = weakSubjects[0]?.subjectName || (report.weakAreas[0]?.subjectName || "None");

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/25 glass-card space-y-3">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-heading">Exam Intelligence</h3>
            <p className="text-[11px] text-slate-400">V1.9 Exam Readiness & Intelligence</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("exam")}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
        >
          <span>Exam Center</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Readiness */}
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 space-y-0.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Readiness
          </span>
          {hasSufficientData && overallReadinessScore !== null ? (
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-emerald-400">
                {overallReadinessScore}%
              </span>
              <span className="text-[9px] text-slate-400 truncate font-semibold">
                {readinessCategory}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-slate-400 block pt-0.5">
              No data
            </span>
          )}
        </div>

        {/* Strongest Subject */}
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 space-y-0.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Strongest
          </span>
          <span className="text-xs font-bold text-emerald-300 truncate block">
            {topStrong}
          </span>
        </div>

        {/* Priority Weak Subject */}
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 space-y-0.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Priority Weak
          </span>
          <span className="text-xs font-bold text-rose-300 truncate block">
            {topWeak}
          </span>
        </div>

        {/* Latest Test % */}
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 space-y-0.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Latest Test
          </span>
          <span className="text-base font-black text-cyan-400 block">
            {latestTestPercentage !== null ? `${latestTestPercentage}%` : "No tests"}
          </span>
        </div>
      </div>

      {/* Recommended Next Action Banner */}
      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-medium truncate text-[11px]">
            <strong className="text-emerald-300 font-bold">Action: </strong>
            {nextBestAction}
          </span>
        </div>
        <button
          onClick={() => onNavigate("exam")}
          className="text-emerald-400 hover:text-emerald-300 font-bold text-[11px] shrink-0 underline"
        >
          Execute
        </button>
      </div>
    </div>
  );
};
