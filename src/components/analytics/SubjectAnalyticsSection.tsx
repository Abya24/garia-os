import React from "react";
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertCircle,
  Award,
  ChevronRight,
} from "lucide-react";
import {
  PerformanceIntelligenceData,
  SubjectAnalyticsData,
} from "../../utils/studentPerformanceAnalytics";

interface SubjectAnalyticsSectionProps {
  data: PerformanceIntelligenceData;
  onNavigate?: (tab: string) => void;
}

export const SubjectAnalyticsSection: React.FC<SubjectAnalyticsSectionProps> = ({
  data,
  onNavigate,
}) => {
  const { subjectsAnalytics, strongestSubject, weakestSubject } = data;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white">
              Subject Performance Intelligence
            </h2>
            <p className="text-xs text-slate-400">
              Mastery, exam readiness, time allocation, and momentum trends across all subjects
            </p>
          </div>
        </div>

        {/* Highlights: Strongest & Weakest pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {strongestSubject && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Strongest: <strong className="font-semibold">{strongestSubject.subjectName}</strong> ({strongestSubject.readinessPct}%)</span>
            </div>
          )}
          {weakestSubject && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Focus Area: <strong className="font-semibold">{weakestSubject.subjectName}</strong> ({weakestSubject.readinessPct}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Subject Cards Grid */}
      {subjectsAnalytics.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm text-slate-300 font-semibold">No subjects available yet.</p>
          <p className="text-xs text-slate-400">Add subjects in Settings or Exam Center to activate subject intelligence.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjectsAnalytics.map((subj) => (
            <div
              key={subj.subjectId}
              className={`p-5 rounded-3xl bg-slate-900/80 border transition-all duration-200 hover:border-white/20 relative overflow-hidden flex flex-col justify-between ${
                subj.isStrongest
                  ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                  : subj.isWeakest
                  ? "border-amber-500/40 shadow-lg shadow-amber-500/5"
                  : "border-white/10"
              }`}
            >
              {/* Header with Title and Badges */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: subj.color }}
                    />
                    <h3 className="font-bold text-base text-white font-heading truncate">
                      {subj.subjectName}
                    </h3>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {subj.isStrongest && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wide border border-emerald-500/30">
                        Strongest
                      </span>
                    )}
                    {subj.isWeakest && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wide border border-amber-500/30">
                        Needs Focus
                      </span>
                    )}

                    {/* Trend Badge (↑ / ↓ / →) */}
                    <div
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono flex items-center gap-1 ${
                        subj.trend === "up"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : subj.trend === "down"
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          : "bg-slate-800 text-slate-400 border border-white/10"
                      }`}
                      title={`Trend: ${subj.trend} (${subj.trendDeltaPct}%)`}
                    >
                      {subj.trend === "up" && (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          <span>+{subj.trendDeltaPct}%</span>
                        </>
                      )}
                      {subj.trend === "down" && (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          <span>-{subj.trendDeltaPct}%</span>
                        </>
                      )}
                      {subj.trend === "neutral" && (
                        <>
                          <Minus className="w-3 h-3" />
                          <span>Steady</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main 2-Column Gauge (Mastery % vs Readiness %) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Mastery % */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Mastery
                    </span>
                    <div className="text-xl font-extrabold font-mono text-cyan-300">
                      {subj.masteryPct}%
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${subj.masteryPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">
                      {subj.completedChapters}/{subj.totalChapters || 1} Chapters
                    </span>
                  </div>

                  {/* Readiness % */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Exam Readiness
                    </span>
                    <div className="text-xl font-extrabold font-mono text-purple-300">
                      {subj.readinessPct}%
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${subj.readinessPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">
                      {subj.testsCount > 0 ? `${subj.avgTestScorePct}% Test Avg` : "No tests logged"}
                    </span>
                  </div>
                </div>

                {/* Study Time Allocation Bar */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    Study Time: <strong className="text-white font-mono">{subj.studyTimeFormatted}</strong>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {subj.studyTimeSharePct}% of total study
                  </span>
                </div>
              </div>

              {/* Action Footer */}
              {onNavigate && (
                <div className="pt-4 border-t border-white/5 mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    MCQ Accuracy: <strong className="text-white">{subj.mcqAccuracyPct}%</strong>
                  </span>
                  <button
                    onClick={() => onNavigate("exam")}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Practice Drill</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
