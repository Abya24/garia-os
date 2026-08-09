import React, { useState } from "react";
import { Sliders, ArrowUpDown, Award, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { SubjectPerformanceAnalysis } from "../types";

interface SubjectComparisonViewProps {
  subjectAnalyses: SubjectPerformanceAnalysis[];
}

export const SubjectComparisonView: React.FC<SubjectComparisonViewProps> = ({
  subjectAnalyses,
}) => {
  const [sortBy, setSortBy] = useState<
    "weakest" | "strongest" | "lowest_accuracy" | "lowest_coverage" | "highest_priority"
  >("highest_priority");

  if (!subjectAnalyses || subjectAnalyses.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 text-center">
        <p className="text-slate-400 text-sm">No subject data to compare.</p>
      </div>
    );
  }

  // Sort subjects
  const sortedSubjects = [...subjectAnalyses].sort((a, b) => {
    if (sortBy === "weakest") {
      return a.avgPercentage - b.avgPercentage;
    }
    if (sortBy === "strongest") {
      return b.avgPercentage - a.avgPercentage;
    }
    if (sortBy === "lowest_accuracy") {
      return a.accuracy - b.accuracy;
    }
    if (sortBy === "lowest_coverage") {
      return a.syllabusCoverage - b.syllabusCoverage;
    }
    if (sortBy === "highest_priority") {
      // Priority score: career priority (20 pts) + (100 - avgPercentage)
      const scoreA = (a.isCareerPriority ? 30 : 0) + (100 - a.avgPercentage);
      const scoreB = (b.isCareerPriority ? 30 : 0) + (100 - b.avgPercentage);
      return scoreB - scoreA;
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-slate-900/80 border border-white/10">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-emerald-400" /> Side-by-Side Subject Matrix
          </h3>
          <p className="text-xs text-slate-400">
            Compare score, accuracy, syllabus, VVI & revision status
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-white font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="highest_priority">Highest Priority</option>
            <option value="weakest">Weakest Scores First</option>
            <option value="strongest">Strongest Scores First</option>
            <option value="lowest_accuracy">Lowest Accuracy</option>
            <option value="lowest_coverage">Lowest Syllabus Coverage</option>
          </select>
        </div>
      </div>

      {/* Grid Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSubjects.map((s, idx) => (
          <div
            key={s.subjectId}
            className={`p-5 rounded-3xl bg-slate-900/90 border transition-all space-y-4 shadow-xl ${
              s.isCareerPriority
                ? "border-purple-500/30 bg-purple-950/10"
                : "border-white/10 hover:border-emerald-500/30"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold flex items-center justify-center">
                  #{idx + 1}
                </span>
                <h4 className="text-base font-bold text-white">{s.subjectName}</h4>
              </div>
              {s.isCareerPriority && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Career Priority
                </span>
              )}
            </div>

            {/* Comparison Rows */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400 font-medium">Avg Score:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {s.testCount > 0 ? `${s.avgPercentage}%` : "No tests"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400 font-medium">Question Accuracy:</span>
                <span className="font-bold text-cyan-400 text-sm">
                  {s.testCount > 0 ? `${s.accuracy}%` : "No data"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400 font-medium">Total Tests:</span>
                <span className="font-bold text-white">{s.testCount}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400 font-medium">Score Trend:</span>
                <span className="font-bold text-slate-200">{s.trend}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400 font-medium">Syllabus Coverage:</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${s.syllabusCoverage}%` }}
                    />
                  </div>
                  <span className="font-bold text-emerald-300">{s.syllabusCoverage}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400 font-medium">VVI Completion:</span>
                <span className="font-bold text-purple-300">{s.vviCompletionRate}%</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400 font-medium">Revision Progress:</span>
                <span className="font-bold text-amber-300">{s.revisionCompletionRate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
