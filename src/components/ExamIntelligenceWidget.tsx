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
    <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/30 shadow-xl space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Exam Intelligence Summary</h3>
            <p className="text-[11px] text-slate-400">V1.9 Performance & AI Readiness</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("exam")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
        >
          <span>Open Exam Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Readiness */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Exam Readiness
          </span>
          {hasSufficientData && overallReadinessScore !== null ? (
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-400">
                {overallReadinessScore}%
              </span>
              <span className="text-[10px] text-slate-400 truncate font-semibold">
                {readinessCategory}
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-400 block pt-0.5">
              Not enough data
            </span>
          )}
        </div>

        {/* Strongest Subject */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Strongest Subject
          </span>
          <span className="text-sm font-bold text-emerald-300 truncate block">
            {topStrong}
          </span>
        </div>

        {/* Priority Weak Subject */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Priority Weak
          </span>
          <span className="text-sm font-bold text-rose-300 truncate block">
            {topWeak}
          </span>
        </div>

        {/* Latest Test % */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Latest Test Score
          </span>
          <span className="text-xl font-black text-cyan-400 block">
            {latestTestPercentage !== null ? `${latestTestPercentage}%` : "No tests"}
          </span>
        </div>
      </div>

      {/* Recommended Next Action Banner */}
      <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-medium">
            <strong className="text-emerald-300 font-bold">Action: </strong>
            {nextBestAction}
          </span>
        </div>
        <button
          onClick={() => onNavigate("exam")}
          className="text-emerald-400 hover:text-emerald-300 font-bold text-xs shrink-0 underline"
        >
          Execute
        </button>
      </div>
    </div>
  );
};
