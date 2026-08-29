import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Flame,
  BookOpen,
  Target,
  BarChart3,
  Award,
  ArrowRight,
  ChevronRight,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Zap,
  Briefcase,
  Compass,
  Layers,
  GraduationCap,
  ShieldCheck,
  Percent,
} from "lucide-react";
import {
  Subject,
  StudySession,
  ActiveTab,
  StudentProfile,
  CareerProfile,
  ExamProfile,
  ExamTestRecord,
  AcademicSubject,
  AcademicChapter,
  AcademicRevisionItem,
  AcademicPracticeSession,
  AcademicVVITopic,
} from "../../../types";
import { AppLanguage } from "../../../utils/i18n";
import {
  generateAcademicDecisionReport,
  AcademicDecisionReport,
} from "../../../utils/academicDecisionEngine";

interface AcademicDecisionEngineSectionProps {
  subjects?: Subject[];
  studySessions?: StudySession[];
  activeStudent?: StudentProfile;
  careerProfile?: CareerProfile;
  examProfile?: ExamProfile;
  academicSubjects?: AcademicSubject[];
  academicChapters?: AcademicChapter[];
  vviTopics?: AcademicVVITopic[];
  revisions?: AcademicRevisionItem[];
  practiceSessions?: AcademicPracticeSession[];
  examRecords?: ExamTestRecord[];
  streakDays?: number;
  currentLanguage?: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
}

export const AcademicDecisionEngineSection: React.FC<AcademicDecisionEngineSectionProps> = ({
  subjects = [],
  studySessions = [],
  activeStudent,
  careerProfile,
  examProfile,
  academicSubjects = [],
  academicChapters = [],
  vviTopics = [],
  revisions = [],
  practiceSessions = [],
  examRecords = [],
  streakDays = 1,
  currentLanguage = "en",
  onNavigate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"all" | "priority" | "revision" | "readiness" | "analytics">("all");

  // Compute decision report deterministically
  const decisionReport: AcademicDecisionReport = useMemo(() => {
    return generateAcademicDecisionReport({
      student: activeStudent,
      careerProfile,
      examProfile,
      academicSubjects,
      academicChapters,
      vviTopics,
      revisions,
      practiceSessions,
      examRecords,
      studyTrackerSubjects: subjects,
      studySessions,
      streakDays,
    });
  }, [
    activeStudent,
    careerProfile,
    examProfile,
    academicSubjects,
    academicChapters,
    vviTopics,
    revisions,
    practiceSessions,
    examRecords,
    subjects,
    studySessions,
    streakDays,
  ]);

  const {
    stream,
    classLevel,
    highPriorityFocus,
    revisionDue,
    examReadiness,
    predictedPerformance,
    careerAlignment,
    analytics,
  } = decisionReport;

  return (
    <section id="section-academic-decision-engine" className="space-y-4">
      {/* Section Header with Stream Badge & Engine Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
            <span>Academic Decision Engine</span>
          </h2>
          <span className="text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">
            {stream} Stream • {classLevel}
          </span>
          <span className="text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/25 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            <span>AI Student Guide</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="decision-btn-open-exam-center"
            onClick={() => onNavigate("exam")}
            className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60"
          >
            <span>{currentLanguage === "hi" ? "परीक्षा केंद्र" : "Exam Center"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            id="decision-btn-open-career-center"
            onClick={() => onNavigate("career")}
            className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60"
          >
            <span>{currentLanguage === "hi" ? "करियर हब" : "Career Hub"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Missed Targets Alert Banner (Rule 3) */}
      {analytics.missedTargetsAlert && (
        <div
          id="decision-alert-missed-target"
          className="rounded-2xl p-3.5 border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900/90 flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-xs text-amber-200 leading-snug">{analytics.missedTargetsAlert}</p>
          </div>
          <button
            onClick={() => onNavigate("focus")}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold shrink-0 transition-all flex items-center gap-1"
          >
            <span>Start Focus Timer</span>
            <Play className="w-3 h-3 fill-current" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: 🔥 High Priority Focus                                         */}
      {/* ========================================================================= */}
      <div
        id="section-1-high-priority-focus"
        className="rounded-2xl p-4 sm:p-5 border border-rose-500/40 bg-gradient-to-br from-rose-950/30 via-slate-900/95 to-slate-900/95 shadow-lg relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                SECTION 1 • High Priority Focus
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md text-white border"
                style={{
                  backgroundColor: `${highPriorityFocus.subjectColor}25`,
                  borderColor: `${highPriorityFocus.subjectColor}50`,
                }}
              >
                {highPriorityFocus.subjectName}
              </span>
              {highPriorityFocus.isVVI && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  VVI Board Weighting
                </span>
              )}
              {highPriorityFocus.isWeak && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Identified Weak Area
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading leading-tight">
                {highPriorityFocus.chapterTitle}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-cyan-300 mt-0.5">
                Topic: {highPriorityFocus.topicTitle}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-rose-300">Why prioritized: </span>
              {highPriorityFocus.reason}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 self-stretch sm:self-auto justify-end">
            <button
              id="btn-high-priority-start-studying"
              onClick={() => onNavigate("study")}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-950/50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>One-Tap Start Studying</span>
            </button>
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>~{highPriorityFocus.estimatedMinutes} mins focus target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid for Sections 2, 3, 4, 5 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ========================================================================= */}
        {/* SECTION 2: 📚 Revision Due                                                */}
        {/* ========================================================================= */}
        <div
          id="section-2-revision-due"
          className="rounded-2xl p-4 sm:p-5 border border-amber-500/30 bg-slate-900/90 shadow-sm flex flex-col justify-between space-y-3"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  <RotateCcw className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  SECTION 2 • Revision Due
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                {revisionDue.dueTodayCount} Due Today
              </span>
            </div>

            {/* Revision List */}
            <div className="space-y-2">
              {revisionDue.items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded text-white"
                        style={{ backgroundColor: `${item.subjectColor}35` }}
                      >
                        {item.subjectName}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          item.urgencyBadge === "Due Today"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {item.daysText}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">{item.chapterTitle}</p>
                    <p className="text-[11px] text-slate-400 truncate">{item.topicTitle}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="text-[10px] font-mono text-amber-400 font-bold">
                      {item.revisionUrgencyScore} Urgency
                    </div>
                    <button
                      id={`btn-revise-${item.id}`}
                      onClick={() => onNavigate("exam")}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1"
                    >
                      <span>Revise</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate("exam")}
            className="w-full py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 border border-slate-700/60"
          >
            <span>Open Spaced Revision Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: 🎯 Exam Readiness                                              */}
        {/* ========================================================================= */}
        <div
          id="section-3-exam-readiness"
          className="rounded-2xl p-4 sm:p-5 border border-cyan-500/30 bg-slate-900/90 shadow-sm flex flex-col justify-between space-y-3"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  <Target className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  SECTION 3 • Exam Readiness
                </h3>
              </div>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  examReadiness.confidenceLevel === "High"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : examReadiness.confidenceLevel === "Moderate"
                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}
              >
                {examReadiness.confidenceLevel} Confidence
              </span>
            </div>

            {/* Overall Gauge Bar & Target Exam */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Overall Readiness</span>
                <span className="text-base font-bold font-mono text-cyan-400">
                  {examReadiness.overallReadinessPct}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${examReadiness.overallReadinessPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {examReadiness.remainingGap}
              </p>
            </div>

            {/* Subject-wise Mini Breakdown */}
            <div className="grid grid-cols-2 gap-2">
              {examReadiness.subjectReadiness.slice(0, 4).map((sub) => (
                <div
                  key={sub.subjectId}
                  className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300 truncate font-medium">{sub.subjectName}</span>
                  <span
                    className={`font-mono font-bold text-[11px] ${
                      sub.readinessPct >= 75
                        ? "text-emerald-400"
                        : sub.readinessPct >= 55
                        ? "text-cyan-400"
                        : "text-rose-400"
                    }`}
                  >
                    {sub.readinessPct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate("exam")}
            className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 active:scale-95"
          >
            <span>Practice Weak Areas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: 📊 Predicted Performance                                       */}
        {/* ========================================================================= */}
        <div
          id="section-4-predicted-performance"
          className="rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-slate-900/90 shadow-sm flex flex-col justify-between space-y-3"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <BarChart3 className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  SECTION 4 • Predicted Performance
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Est. {predictedPerformance.estimatedScoreRange}
              </span>
            </div>

            {/* Risk Indicators */}
            {predictedPerformance.riskIndicators.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-rose-400">
                  Risk Indicators
                </span>
                {predictedPerformance.riskIndicators.slice(0, 2).map((risk) => (
                  <div
                    key={risk.id}
                    className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-semibold text-rose-200 leading-tight">{risk.risk}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{risk.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Improvement Opportunities */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-400">
                Improvement Opportunities
              </span>
              {predictedPerformance.improvementOpportunities.slice(0, 2).map((opp) => (
                <div
                  key={opp.id}
                  className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-200 truncate">{opp.opportunity}</p>
                    <span className="text-[10px] text-emerald-400 font-semibold">{opp.potentialGain}</span>
                  </div>
                  <button
                    onClick={() => onNavigate(opp.targetTab as ActiveTab)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold shrink-0 transition-colors"
                  >
                    {opp.actionText}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate("exam")}
            className="w-full py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 border border-slate-700/60"
          >
            <span>Take Board Diagnostic Test</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: 🏆 Career Alignment                                            */}
        {/* ========================================================================= */}
        <div
          id="section-5-career-alignment"
          className="rounded-2xl p-4 sm:p-5 border border-violet-500/30 bg-slate-900/90 shadow-sm flex flex-col justify-between space-y-3"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                  <Award className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  SECTION 5 • Career Alignment
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold">
                {careerAlignment.careerFitScore}% Pathway Fit
              </span>
            </div>

            {/* Target Career Focus */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate">
                  {careerAlignment.targetCareerTitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {careerAlignment.studyPathway}
              </p>
            </div>

            {/* Recommended Skill Development */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-violet-300">
                High-Yield Skill Suggestions
              </span>
              <div className="space-y-1">
                {careerAlignment.skillSuggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 px-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-300">{s.skillName}</span>
                    <span className="text-[10px] text-violet-400 font-mono">{s.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("career")}
            className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 active:scale-95"
          >
            <span>Explore Career Milestones</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ANALYTICS: Weekly Trends, Readiness Timeline, Strong & Weak Breakdown     */}
      {/* ========================================================================= */}
      <div
        id="decision-engine-analytics-panel"
        className="rounded-2xl p-4 sm:p-5 border border-slate-800 bg-slate-950/70 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white font-heading">
              Academic Trend Analytics & Readiness Progression
            </h4>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            +{analytics.weeklyImprovementTrendPct}% Growth
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Readiness Over Time */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
              Readiness Over Time
            </span>
            <div className="flex items-end justify-between gap-1.5 h-14 pt-2">
              {analytics.readinessTimeline.map((pt, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-slate-800 rounded-t h-10 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(20, pt.readinessPct)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">{pt.weekLabel.slice(0, 2)}{idx+1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strongest Subjects */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Strongest Subject
            </span>
            <div className="text-xs font-bold text-white">
              {analytics.strongestSubjects.join(", ") || "All balanced"}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Consistently scoring in top percentile with reliable retention.
            </p>
          </div>

          {/* Weakest Subjects / Priority Gap */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-rose-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              Weakest Area (Needs Focus)
            </span>
            <div className="text-xs font-bold text-rose-200">
              {analytics.weakestSubjects.join(", ") || "None flagged"}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Prioritized at the top of today's study queue.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
