import React from "react";
import { Award, TrendingUp, TrendingDown, Minus, HelpCircle, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { SubjectPerformanceAnalysis } from "../types";

interface SubjectPerformanceAnalysisSectionProps {
  subjectAnalyses: SubjectPerformanceAnalysis[];
}

export const SubjectPerformanceAnalysisSection: React.FC<SubjectPerformanceAnalysisSectionProps> = ({
  subjectAnalyses,
}) => {
  if (!subjectAnalyses || subjectAnalyses.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 text-center">
        <p className="text-slate-400 text-sm">No subjects available for performance analysis.</p>
      </div>
    );
  }

  const getTrendBadge = (trend: SubjectPerformanceAnalysis["trend"]) => {
    switch (trend) {
      case "Improving":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-3.5 h-3.5" /> Improving
          </span>
        );
      case "Declining":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <TrendingDown className="w-3.5 h-3.5" /> Declining
          </span>
        );
      case "Stable":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Minus className="w-3.5 h-3.5" /> Stable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-white/10">
            <HelpCircle className="w-3.5 h-3.5" /> Insufficient Data
          </span>
        );
    }
  };

  const getStatusBadge = (status: SubjectPerformanceAnalysis["status"]) => {
    switch (status) {
      case "Strong":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Strong Subject
          </span>
        );
      case "Average":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Average Performance
          </span>
        );
      case "Needs Attention":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Needs Attention
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-white/10">
            Insufficient Data
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" /> Subject Performance Analysis
          </h3>
          <p className="text-xs text-slate-400">
            Exam scores, accuracy, trend & weak/strong classification
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjectAnalyses.map((s) => (
          <div
            key={s.subjectId}
            className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/30 transition-all space-y-4 shadow-xl"
          >
            {/* Title & Badges */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  {s.subjectName}
                  {s.isCareerPriority && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Target Priority
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {s.testCount > 0
                    ? `${s.testCount} test(s) recorded`
                    : "No test records yet"}
                </p>
              </div>
              {getTrendBadge(s.trend)}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-800/60 border border-white/5 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Average</span>
                <span className="text-lg font-black text-emerald-400">
                  {s.testCount > 0 ? `${s.avgPercentage}%` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Best</span>
                <span className="text-lg font-black text-cyan-400">
                  {s.testCount > 0 ? `${s.bestPercentage}%` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Latest</span>
                <span className="text-lg font-black text-purple-400">
                  {s.testCount > 0 ? `${s.latestPercentage}%` : "—"}
                </span>
              </div>
            </div>

            {/* Accuracy & Secondary Stats */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Accuracy:</span>
                <strong className="text-cyan-300">
                  {s.testCount > 0 ? `${s.accuracy}%` : "N/A"}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Syllabus Coverage:</span>
                <strong className="text-emerald-300">{s.syllabusCoverage}%</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>VVI Completion:</span>
                <strong className="text-purple-300">{s.vviCompletionRate}%</strong>
              </div>
            </div>

            {/* Status Footer */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-semibold">Status:</span>
              {getStatusBadge(s.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
