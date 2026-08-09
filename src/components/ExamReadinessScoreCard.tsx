import React from "react";
import { Award, Zap, AlertTriangle, CheckCircle2, HelpCircle, ShieldCheck } from "lucide-react";
import { ExamIntelligenceReport } from "../types";

interface ExamReadinessScoreCardProps {
  report: ExamIntelligenceReport;
  onNavigate?: (tab: string) => void;
}

export const ExamReadinessScoreCard: React.FC<ExamReadinessScoreCardProps> = ({
  report,
  onNavigate,
}) => {
  const { overallReadinessScore, readinessCategory, hasSufficientData, nextBestAction } = report;

  const getCategoryBadge = (cat: ExamIntelligenceReport["readinessCategory"]) => {
    switch (cat) {
      case "Strong Preparation":
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
            80–100 · Strong Preparation
          </span>
        );
      case "Good Progress":
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
            60–79 · Good Progress
          </span>
        );
      case "Building":
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
            40–59 · Building
          </span>
        );
      case "Needs Attention":
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider">
            0–39 · Needs Attention
          </span>
        );
      default:
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-white/10 uppercase tracking-wider">
            Not Enough Data
          </span>
        );
    }
  };

  return (
    <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 shadow-2xl space-y-6">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Info */}
        <div className="space-y-3 max-w-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" /> Exam Intelligence Engine v1.9
            </span>
            {getCategoryBadge(readinessCategory)}
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Overall Exam Readiness
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            Synthesized from test scores, question accuracy, syllabus completion, VVI topics, and revision history.
          </p>

          {/* Next Best Action Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-white/10 flex items-start gap-2.5">
            <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                Next Best Action
              </span>
              <p className="text-xs font-semibold text-slate-200">{nextBestAction}</p>
            </div>
          </div>
        </div>

        {/* Right Gauge / Score */}
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-800/60 border border-white/10 text-center shrink-0 min-w-[200px]">
          {hasSufficientData && overallReadinessScore !== null ? (
            <>
              <div className="relative flex items-center justify-center">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-purple-400">
                  {overallReadinessScore}
                </span>
                <span className="text-xl font-bold text-slate-400 ml-1">/100</span>
              </div>
              <span className="text-xs font-bold text-emerald-300 mt-2">
                {readinessCategory}
              </span>
            </>
          ) : (
            <div className="space-y-2 py-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-700/80 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-300 block">
                Not enough data
              </span>
              <span className="text-[11px] text-slate-400 block max-w-[150px]">
                Log test marks or chapter activity to unlock score
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
