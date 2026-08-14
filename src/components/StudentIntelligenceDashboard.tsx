import React from "react";
import {
  Brain,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Award,
  Flame,
  Zap,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";
import { StudentIntelligenceReport } from "../utils/studentIntelligenceEngine";

interface StudentIntelligenceDashboardProps {
  report: StudentIntelligenceReport;
  onNavigate?: (tab: string) => void;
}

export const StudentIntelligenceDashboard: React.FC<StudentIntelligenceDashboardProps> = ({
  report,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Core Summary Intelligence Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-indigo-500/30 space-y-1 shadow-lg shadow-indigo-500/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Syllabus Coverage
          </span>
          <div className="text-2xl font-extrabold text-white font-mono">
            {report.overallSyllabusProgressPct}%
          </div>
          <div className="text-[11px] text-slate-400">
            {report.overallChapterCompletionPct}% Chapters Done
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-emerald-500/30 space-y-1 shadow-lg shadow-emerald-500/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            MCQ Accuracy
          </span>
          <div className="text-2xl font-extrabold text-emerald-300 font-mono">
            {report.overallMCQAccuracyPct}%
          </div>
          <div className="text-[11px] text-slate-400">
            {report.totalQuestionsSolved} Questions Solved
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-cyan-500/30 space-y-1 shadow-lg shadow-cyan-500/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            PYQ Completion
          </span>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono">
            {report.overallPYQCompletionPct}%
          </div>
          <div className="text-[11px] text-slate-400">Board Exam Standard</div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-purple-500/30 space-y-1 shadow-lg shadow-purple-500/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
            Test Score Average
          </span>
          <div className="text-2xl font-extrabold text-purple-300 font-mono">
            {report.overallTestAccuracyPct}%
          </div>
          <div className="text-[11px] text-slate-400">Across Mock Exams</div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-amber-500/30 space-y-1 shadow-lg shadow-amber-500/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Study Time
          </span>
          <div className="text-2xl font-extrabold text-amber-300 font-mono">
            {(report.totalStudyTimeMinutes / 60).toFixed(1)}h
          </div>
          <div className="text-[11px] text-slate-400">Logged Sessions</div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-rose-500/30 space-y-1 shadow-lg shadow-rose-500/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
            Learning Streak
          </span>
          <div className="text-2xl font-extrabold text-rose-300 font-mono flex items-center gap-1">
            <Flame className="w-5 h-5 fill-rose-400" />
            {report.activeStreakDays}d
          </div>
          <div className="text-[11px] text-slate-400">Active Discipline</div>
        </div>
      </div>

      {/* 2. Subject Mastery & Progress Matrix */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span>Subject Progress, MCQ & Test Analytics</span>
            </h3>
            <p className="text-xs text-slate-400">
              Detailed tracking across curriculum chapters, topic completion, MCQ accuracy, and mock test scores.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.subjectsAnalytics.map((subj) => (
            <div
              key={subj.subjectId}
              className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{subj.subjectName}</h4>
                  <span className="text-[11px] text-slate-400">
                    {subj.completedChapters}/{subj.totalChapters} Chapters • {subj.completedTopics}/{subj.totalTopics} Topics
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    subj.status === "Strong"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : subj.status === "Needs Attention"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {subj.status}
                </span>
              </div>

              {/* Progress bars */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Chapter Completion</span>
                    <span className="font-mono font-bold text-white">{subj.chapterProgressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${subj.chapterProgressPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>MCQ & PYQ Accuracy</span>
                    <span className="font-mono font-bold text-emerald-400">{subj.mcqAccuracyPct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${subj.mcqAccuracyPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Metric stats pill */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5 font-mono">
                <span>PYQs: {subj.pyqCompletionPct}%</span>
                <span>Avg Test: {subj.avgTestScorePct}%</span>
                <span>Study: {subj.studyTimeMinutes}m</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Weak vs Strong Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weak Topics */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-rose-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Identified Weak Topics ({report.weakTopics.length})</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Needs Practice
            </span>
          </div>

          <div className="space-y-3">
            {report.weakTopics.map((top, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">{top.subjectName}</span>
                  {top.isVVI && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                      🔥 VVI
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-xs text-white">{top.chapterTitle}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{top.recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strong Topics */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Mastered Strong Topics ({report.strongTopics.length})</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              High Accuracy
            </span>
          </div>

          <div className="space-y-3">
            {report.strongTopics.map((top, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">{top.subjectName}</span>
                  <span className="text-[10px] font-mono text-emerald-300 font-bold">
                    {top.accuracyPct}% Accuracy
                  </span>
                </div>
                <h4 className="font-bold text-xs text-white">{top.chapterTitle}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{top.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Actionable Improvement Suggestions */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>AI Automated Improvement Suggestions</span>
          </h3>
          <span className="text-xs text-indigo-300 font-mono">Live Guidance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {report.improvementSuggestions.map((sug) => (
            <div
              key={sug.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3 flex flex-col justify-between"
            >
              <div>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    sug.type === "CRITICAL"
                      ? "bg-rose-500/20 text-rose-300"
                      : sug.type === "BOOST"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-indigo-500/20 text-indigo-300"
                  }`}
                >
                  {sug.type}
                </span>
                <h4 className="font-bold text-xs text-white mt-2">{sug.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{sug.description}</p>
              </div>

              {onNavigate && (
                <button
                  onClick={() => onNavigate(sug.targetTab)}
                  className="w-full py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>{sug.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
