import React from "react";
import {
  BookOpen,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Subject, StudySession, ActiveTab, StudentProfile } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";
import { ExamIntelligenceReport } from "../../../utils/examIntelligenceEngine";

interface AcademicProgressSectionProps {
  subjects: Subject[];
  studySessions?: StudySession[];
  examReport?: ExamIntelligenceReport | null;
  activeStudent?: StudentProfile;
  currentLanguage: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
}

export const AcademicProgressSection: React.FC<AcademicProgressSectionProps> = ({
  subjects,
  studySessions = [],
  examReport,
  activeStudent,
  currentLanguage,
  onNavigate,
}) => {
  // Aggregate stats across subjects
  const totalTargetMinutes = subjects.reduce(
    (acc, s) => acc + (s.targetMinutesPerWeek || 0),
    0
  );
  const totalCompletedMinutes = subjects.reduce(
    (acc, s) => acc + (s.completedMinutes || 0),
    0
  );
  const overallMasteryPercent =
    totalTargetMinutes > 0
      ? Math.min(100, Math.round((totalCompletedMinutes / totalTargetMinutes) * 100))
      : 65;

  // Identify Weak / Needs Attention Subject
  // Priority: 1. Weak subject identified by examReport, 2. Subject with lowest completion %
  let weakSubject: Subject | null = null;
  let weakSubjectReason = "Low weekly study hours compared to exam target.";

  if (examReport && examReport.weakSubjects && examReport.weakSubjects.length > 0) {
    const reportWeakName = examReport.weakSubjects[0].subjectName.toLowerCase();
    weakSubject =
      subjects.find(
        (s) =>
          s.name.toLowerCase().includes(reportWeakName) ||
          reportWeakName.includes(s.name.toLowerCase())
      ) || null;
    if (weakSubject) {
      weakSubjectReason = `Identified in recent test analytics: accuracy is ${examReport.weakSubjects[0].accuracy || 55}%. Needs revision.`;
    }
  }

  if (!weakSubject && subjects.length > 0) {
    // Find subject with lowest completed %
    const sorted = [...subjects].sort((a, b) => {
      const pctA = a.targetMinutesPerWeek > 0 ? a.completedMinutes / a.targetMinutesPerWeek : 1;
      const pctB = b.targetMinutesPerWeek > 0 ? b.completedMinutes / b.targetMinutesPerWeek : 1;
      return pctA - pctB;
    });
    weakSubject = sorted[0];
    const pct =
      weakSubject.targetMinutesPerWeek > 0
        ? Math.round((weakSubject.completedMinutes / weakSubject.targetMinutesPerWeek) * 100)
        : 30;
    weakSubjectReason = `Only ${pct}% of weekly study target logged. Focus on this subject today.`;
  }

  return (
    <section id="section-3-academic-progress" className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-white">
            {currentLanguage === "hi" ? "शैक्षणिक प्रगति व विषय महारत" : "Academic Progress"}
          </h2>
          <span className="text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">
            {subjects.length} Active Subjects
          </span>
        </div>

        <button
          onClick={() => onNavigate("study")}
          className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
        >
          <span>{currentLanguage === "hi" ? "सभी विषय देखें" : "Study Tracker"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Weak Subject Attention Indicator Banner */}
      {weakSubject && (
        <div
          id="weak-subject-indicator-card"
          className="glass-card rounded-2xl p-4 border border-rose-500/30 bg-gradient-to-r from-rose-950/30 via-slate-900/90 to-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Priority Attention Required
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {weakSubject.name}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {weakSubjectReason}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate("study")}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 shrink-0 self-end sm:self-auto active:scale-95"
          >
            <span>Study {weakSubject.name}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Subjects Grid (Subject Mastery & Target Progress) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {subjects.slice(0, 4).map((subject) => {
          const targetMins = subject.targetMinutesPerWeek || 300;
          const completedMins = subject.completedMinutes || 0;
          const masteryPct =
            targetMins > 0
              ? Math.min(100, Math.round((completedMins / targetMins) * 100))
              : 50;

          const isStrong = masteryPct >= 75;
          const isMedium = masteryPct >= 45 && masteryPct < 75;
          const isWeak = masteryPct < 45;

          const statusColor = isStrong
            ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
            : isMedium
            ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
            : "text-amber-400 border-amber-500/30 bg-amber-500/10";

          return (
            <div
              key={subject.id}
              onClick={() => onNavigate("study")}
              className="glass-card rounded-2xl p-4 border border-white/10 hover:border-cyan-500/40 bg-slate-900/80 transition-all cursor-pointer card-press flex flex-col justify-between space-y-3 group shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: subject.color || "#06b6d4" }}
                    />
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate max-w-[120px]">
                      {subject.name}
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColor}`}>
                    {masteryPct}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Target Hours</span>
                    <span>
                      {Math.round(completedMins / 60)}h / {Math.round(targetMins / 60)}h
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(5, masteryPct)}%`,
                        backgroundColor: subject.color || "#06b6d4",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {subject.totalSessions || 0} sessions
                </span>
                <span className="text-cyan-300 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  <span>Explore</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Study Progress Summary Bar */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              Weekly Syllabus Study Goal
            </div>
            <div className="text-[11px] text-slate-400">
              {Math.round(totalCompletedMinutes / 60)} of {Math.round(totalTargetMinutes / 60)} hours completed across all subjects
            </div>
          </div>
        </div>

        <div className="w-full sm:w-64 space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Weekly Progress</span>
            <span className="text-cyan-400 font-bold">{overallMasteryPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, overallMasteryPercent)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
