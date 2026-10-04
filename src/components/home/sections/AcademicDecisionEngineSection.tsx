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
  Sliders,
  Check,
  X,
  RefreshCw,
  HelpCircle,
  FileText,
  AlertCircle,
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
  Goal,
} from "../../../types";
import { AppLanguage } from "../../../utils/i18n";
import {
  generateAcademicDecisionReport,
  AcademicDecisionReport,
} from "../../../utils/academicDecisionEngine";
import {
  generateUnifiedAdaptiveState,
  loadProfileMistakes,
  recordQuestionMistake,
  updateMistakeStatus,
  PrimaryStudyAction,
  TimeAwareStudyPlan,
  StudentMistakeRecord,
} from "../../../utils/adaptiveStudyEngine";
import { CurriculumStatusBadge } from "../../CurriculumStatusBadge";

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
  goals?: Goal[];
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
  goals = [],
  streakDays = 1,
  currentLanguage = "en",
  onNavigate,
}) => {
  const profileId = activeStudent?.id || "default-student";
  const [activeSubTab, setActiveSubTab] = useState<
    "all" | "actions" | "plan" | "mistakes" | "mastery" | "readiness" | "analytics"
  >("all");

  // Interactive Student Controls (Section 8 & 20)
  const [dailyTimeBudgetMinutes, setDailyTimeBudgetMinutes] = useState<number>(
    (examProfile?.dailyStudyHours || 2) * 60
  );
  const [completedActionIds, setCompletedActionIds] = useState<string[]>([]);
  const [skippedActionIds, setSkippedActionIds] = useState<string[]>([]);
  const [durationAdjustments, setDurationAdjustments] = useState<Record<string, number>>({});

  // Mistake modal & review state (Section 12)
  const [mistakesList, setMistakesList] = useState<StudentMistakeRecord[]>(() =>
    loadProfileMistakes(profileId)
  );
  const [activeMistakeReview, setActiveMistakeReview] = useState<StudentMistakeRecord | null>(null);
  const [mistakeWhyNote, setMistakeWhyNote] = useState<string>("");

  // P4 Unified Adaptive Academic State
  const adaptiveState = useMemo(() => {
    return generateUnifiedAdaptiveState({
      student: activeStudent,
      subjects,
      studySessions,
      academicChapters,
      revisions,
      practiceSessions,
      examRecords,
      goals,
      examProfile,
      availableDailyMinutes: dailyTimeBudgetMinutes,
      streakDays,
    });
  }, [
    activeStudent,
    subjects,
    studySessions,
    academicChapters,
    revisions,
    practiceSessions,
    examRecords,
    goals,
    examProfile,
    dailyTimeBudgetMinutes,
    streakDays,
  ]);

  // Compute decision report deterministically for backward-compatible panels
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
    board,
    stream,
    classLevel,
    careerAlignment,
    analytics,
  } = decisionReport;

  // Filter top recommendations by student overrides
  const visibleRecommendations = useMemo(() => {
    return adaptiveState.topRecommendations.filter(
      (a) => !skippedActionIds.includes(a.id)
    );
  }, [adaptiveState.topRecommendations, skippedActionIds]);

  const handleActionComplete = (actionId: string) => {
    setCompletedActionIds((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
  };

  const handleActionSkip = (actionId: string) => {
    setSkippedActionIds((prev) => [...prev, actionId]);
  };

  const handleDurationDelta = (actionId: string, deltaMins: number) => {
    setDurationAdjustments((prev) => ({
      ...prev,
      [actionId]: Math.max(10, (prev[actionId] || 0) + deltaMins),
    }));
  };

  const handleResolveMistake = (mistakeId: string) => {
    updateMistakeStatus(profileId, mistakeId, "resolved", mistakeWhyNote);
    setMistakesList(loadProfileMistakes(profileId));
    setActiveMistakeReview(null);
    setMistakeWhyNote("");
  };

  const handleRetryMistake = (mistakeId: string, isCorrect: boolean) => {
    updateMistakeStatus(
      profileId,
      mistakeId,
      isCorrect ? "retried_correct" : "retried_incorrect",
      mistakeWhyNote
    );
    setMistakesList(loadProfileMistakes(profileId));
    setActiveMistakeReview(null);
    setMistakeWhyNote("");
  };

  return (
    <section id="section-academic-decision-engine" className="space-y-4">
      {/* Section Header with Stream Badge & Engine Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
            <span>Adaptive Student Intelligence</span>
          </h2>
          <span className="text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">
            {board} • {stream} Stream • {classLevel}
          </span>
          <CurriculumStatusBadge
            status={decisionReport.curriculumVerificationStatus}
            academicYear={decisionReport.academicYear}
            sourceNote={decisionReport.curriculumProvenanceNote}
            variant="compact"
          />
          <span
            className="text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/25 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
            title="Generated by Garia OS from student study signals and historical question weightings; not an official board declaration."
          >
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            <span>Application-Derived Intelligence</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="decision-btn-open-exam-center"
            onClick={() => onNavigate("exam")}
            className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60 cursor-pointer"
          >
            <span>{currentLanguage === "hi" ? "परीक्षा केंद्र" : "Exam Center"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            id="decision-btn-open-career-center"
            onClick={() => onNavigate("career")}
            className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60 cursor-pointer"
          >
            <span>{currentLanguage === "hi" ? "करियर हब" : "Career Hub"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtab Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/5 text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab("all")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "all"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All Intelligence
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("actions")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "actions"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Top 3 Actions
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("plan")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "plan"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Time-Aware Plan
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("mistakes")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "mistakes"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Mistake Review ({mistakesList.filter((m) => m.status === "pending_review").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("mastery")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "mastery"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Mastery Matrix
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("readiness")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "readiness"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Exam Readiness
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. "WHAT SHOULD I DO NOW?" TOP 3 ACTIONS (Section 4 & 5 & 20)             */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "actions") && (
        <div id="section-p4-top3-actions" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                <Flame className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  What Should I Do Now? (Abhi Mujhe Kya Karna Chahiye?)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Strictly prioritized top 3 academic actions based on urgency, weakness, revision due date, and available time.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Max 3 Actions Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {visibleRecommendations.map((item, idx) => {
              const isCompleted = completedActionIds.includes(item.id);
              const customDuration = item.estimatedMinutes + (durationAdjustments[item.id] || 0);

              return (
                <div
                  key={item.id}
                  id={`action-card-rank-${idx + 1}`}
                  className={`rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 ${
                    isCompleted
                      ? "bg-emerald-950/20 border-emerald-500/30 opacity-75"
                      : idx === 0
                      ? "bg-gradient-to-br from-rose-950/30 via-slate-900/90 to-slate-900/90 border-rose-500/40 shadow-md"
                      : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header: Rank + Category Badge + Priority Score */}
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                            idx === 0
                              ? "bg-rose-500 text-white"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          #{item.rank}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                          {item.category.replace("_", " ")}
                        </span>
                      </div>

                      <span
                        className="text-[10px] font-mono text-amber-300 font-bold"
                        title="Normalized Priority Score (0-100) calculated from Urgency, Revision Need, Weakness, Coverage Gap, and Goal Alignment."
                      >
                        {item.priorityScore} Pts
                      </span>
                    </div>

                    {/* Action Title & Subject */}
                    <div>
                      <h4
                        className={`text-sm font-bold leading-snug line-clamp-2 ${
                          isCompleted ? "line-through text-slate-400" : "text-white"
                        }`}
                      >
                        {item.action}
                      </h4>
                      <p className="text-[11px] text-cyan-300 font-semibold mt-0.5">
                        {item.subjectName} • {item.chapterTitle}
                      </p>
                    </div>

                    {/* Why Prioritized (Section 4) */}
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                      <span className="font-semibold text-rose-300">Why: </span>
                      {item.reason}
                    </div>

                    {/* What happens next (Section 4) */}
                    {item.postActionFeedback && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>After finish: {item.postActionFeedback}</span>
                      </p>
                    )}
                  </div>

                  {/* Footer: Duration + Controls (Section 20) */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>~{customDuration}m</span>
                        <button
                          type="button"
                          onClick={() => handleDurationDelta(item.id, 15)}
                          title="Add 15 mins"
                          className="px-1 py-0.2 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono cursor-pointer"
                        >
                          +15m
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleActionSkip(item.id)}
                          title="Skip recommendation"
                          className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          Skip
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleActionComplete(item.id)}
                          className={`text-[11px] font-bold cursor-pointer ${
                            isCompleted ? "text-emerald-400" : "text-slate-400 hover:text-emerald-300"
                          }`}
                        >
                          {isCompleted ? "Done ✓" : "Mark Done"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate(item.targetTab)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                        isCompleted
                          ? "bg-slate-800 text-slate-400"
                          : idx === 0
                          ? "bg-rose-600 hover:bg-rose-500 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-white"
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Action Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TIME-AWARE STUDY PLAN (Section 8 & 9)                                  */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "plan") && (
        <div
          id="section-p4-time-aware-plan"
          className="rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-slate-900/90 space-y-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                <Sliders className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Time-Aware Daily Study Plan
                </h3>
                <p className="text-[11px] text-slate-400">
                  {adaptiveState.timeAwarePlan.planSummary}
                </p>
              </div>
            </div>

            {/* Time Budget Selector */}
            <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <label htmlFor="plan-time-budget-select" className="text-xs text-slate-400 font-semibold">
                Available Time:
              </label>
              <select
                id="plan-time-budget-select"
                aria-label="Available Study Time Budget"
                value={dailyTimeBudgetMinutes}
                onChange={(e) => setDailyTimeBudgetMinutes(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer"
              >
                <option value={30} className="bg-slate-900 text-white">30 Minutes (Quick Sprint)</option>
                <option value={45} className="bg-slate-900 text-white">45 Minutes</option>
                <option value={60} className="bg-slate-900 text-white">1 Hour</option>
                <option value={90} className="bg-slate-900 text-white">1.5 Hours</option>
                <option value={120} className="bg-slate-900 text-white">2 Hours</option>
                <option value={180} className="bg-slate-900 text-white">3 Hours (Deep Study)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Must Do */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  1. Must Do (Highest Priority)
                </span>
                <span className="text-slate-400 font-mono">
                  {adaptiveState.timeAwarePlan.mustDo.length} task
                </span>
              </div>
              {adaptiveState.timeAwarePlan.mustDo.map((item) => (
                <div key={item.id} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                  <p className="text-xs font-bold text-white leading-snug">{item.activity}</p>
                  <p className="text-[11px] text-slate-400">{item.subjectName} • ~{item.durationMinutes}m</p>
                </div>
              ))}
            </div>

            {/* Should Do */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400 uppercase tracking-wider font-mono">
                  2. Should Do (Important)
                </span>
                <span className="text-slate-400 font-mono">
                  {adaptiveState.timeAwarePlan.shouldDo.length} task
                </span>
              </div>
              {adaptiveState.timeAwarePlan.shouldDo.map((item) => (
                <div key={item.id} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                  <p className="text-xs font-bold text-white leading-snug">{item.activity}</p>
                  <p className="text-[11px] text-slate-400">{item.subjectName} • ~{item.durationMinutes}m</p>
                </div>
              ))}
              {adaptiveState.timeAwarePlan.shouldDo.length === 0 && (
                <p className="text-[11px] text-slate-400 italic">None scheduled for current time budget.</p>
              )}
            </div>

            {/* Deferred Work (Explicitly Listed - Section 8) */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 uppercase tracking-wider font-mono">
                  3. Deferred Work ({adaptiveState.timeAwarePlan.deferred.length})
                </span>
                <span className="text-slate-400 font-mono text-[10px]">Protected Focus</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {adaptiveState.timeAwarePlan.deferred.map((item, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60 text-[11px]">
                    <p className="font-semibold text-slate-300 truncate">{item.subjectName}: {item.chapterTitle}</p>
                    <p className="text-[10px] text-slate-400">{item.reasonForDeferral}</p>
                  </div>
                ))}
                {adaptiveState.timeAwarePlan.deferred.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic">All planned items fit inside your current budget!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STRUCTURED MISTAKE REVIEW LOOP (Section 12)                            */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "mistakes") && (
        <div
          id="section-p4-mistake-review"
          className="rounded-2xl p-4 sm:p-5 border border-amber-500/30 bg-slate-900/90 space-y-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Mistake Review & Error Loop (Wrong Answer → Understand → Retry → Improve)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Targeted practice of questions previously answered incorrectly in mock tests or practice drills.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              {mistakesList.filter((m) => m.status === "pending_review").length} Unresolved
            </span>
          </div>

          {mistakesList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mistakesList.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/30 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-300">{m.subjectName}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        m.status === "resolved"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {m.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs text-white font-medium line-clamp-2">
                    "{m.questionText}"
                  </p>

                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <p><span className="text-rose-400 font-semibold">Your Answer:</span> {m.studentAnswer}</p>
                    <p><span className="text-emerald-400 font-semibold">Correct:</span> {m.correctAnswer}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveMistakeReview(m)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1"
                    >
                      <span>Review Concept & Retry</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    {m.status !== "resolved" && (
                      <button
                        type="button"
                        onClick={() => handleResolveMistake(m.id)}
                        className="text-[11px] text-slate-400 hover:text-emerald-300 cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold text-white">No Unresolved Mistakes Logged</p>
              <p className="text-[11px] text-slate-400">
                Any wrong answers in Question Bank or Mock Tests will automatically populate here for guided spaced re-testing.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mistake Detail / Retry Modal */}
      {activeMistakeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Mistake Review: {activeMistakeReview.subjectName}</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveMistakeReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-white">Question:</p>
              <p className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200">
                {activeMistakeReview.questionText}
              </p>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 space-y-1">
                <p className="font-bold text-emerald-400">Correct Concept & Solution:</p>
                <p>{activeMistakeReview.conceptExplanation || activeMistakeReview.correctAnswer}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  Why was it wrong? (Self-Reflection):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Calculation error, misread formula..."
                  value={mistakeWhyNote}
                  onChange={(e) => setMistakeWhyNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleRetryMistake(activeMistakeReview.id, false)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Still Unclear
              </button>
              <button
                type="button"
                onClick={() => handleRetryMistake(activeMistakeReview.id, true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Understood & Retried ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MULTI-SIGNAL 6-STAGE MASTERY MATRIX (Section 6)                        */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "mastery") && (
        <div
          id="section-p4-mastery-matrix"
          className="rounded-2xl p-4 sm:p-5 border border-purple-500/30 bg-slate-900/90 space-y-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                <Layers className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Multi-Signal Mastery Matrix (6 Discrete Stages)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tracks Not Started, Learning, Practicing, Improving, Strong, and Needs Revision. Displays "Not enough data" when attempts &lt; 1.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { stage: "Not Started", color: "slate", count: adaptiveState.topicMasteries.filter((m) => m.stage === "Not Started").length },
              { stage: "Learning", color: "blue", count: adaptiveState.topicMasteries.filter((m) => m.stage === "Learning").length },
              { stage: "Practicing", color: "cyan", count: adaptiveState.topicMasteries.filter((m) => m.stage === "Practicing").length },
              { stage: "Improving", color: "amber", count: adaptiveState.topicMasteries.filter((m) => m.stage === "Improving").length },
              { stage: "Strong", color: "emerald", count: adaptiveState.topicMasteries.filter((m) => m.stage === "Strong").length },
              { stage: "Needs Revision", color: "rose", count: adaptiveState.topicMasteries.filter((m) => m.stage === "Needs Revision").length },
            ].map((col) => (
              <div key={col.stage} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  {col.stage}
                </span>
                <span className="text-base font-bold text-white block">
                  {col.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. EXAM READINESS & DATE SEPARATION (Section 13 & 14)                     */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "readiness") && (
        <div
          id="section-p4-exam-readiness"
          className="rounded-2xl p-4 sm:p-5 border border-cyan-500/30 bg-slate-900/90 space-y-3 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                <Target className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Exam Readiness & Official vs Student Date Distinction
                </h3>
                <p className="text-[11px] text-slate-400">
                  {adaptiveState.examReadiness.explanation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  adaptiveState.examReadiness.dateType === "OFFICIAL_EXAM_DATE"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                }`}
              >
                {adaptiveState.examReadiness.dateType.replace(/_/g, " ")}
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {adaptiveState.examReadiness.daysRemaining} Days Left
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Syllabus Coverage</span>
              <p className="text-base font-bold text-white">{adaptiveState.examReadiness.syllabusCoveragePct}%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Revision Coverage</span>
              <p className="text-base font-bold text-white">{adaptiveState.examReadiness.revisionCoveragePct}%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Practice Accuracy</span>
              <p className="text-base font-bold text-white">
                {adaptiveState.examReadiness.hasEnoughData
                  ? `${adaptiveState.examReadiness.practiceAccuracyPct}%`
                  : "Not enough data"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Overall Readiness</span>
              <p className="text-base font-bold text-cyan-400">
                {adaptiveState.examReadiness.hasEnoughData
                  ? `${adaptiveState.examReadiness.overallScore}%`
                  : "Not enough data"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ANALYTICS TO ACTION & WEEKLY REVIEW (Section 15 & 16)                  */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "analytics") && (
        <div
          id="section-p4-analytics-actions"
          className="rounded-2xl p-4 sm:p-5 border border-indigo-500/30 bg-slate-900/90 space-y-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Analytics to Action & Weekly Student Review
                </h3>
                <p className="text-[11px] text-slate-400">
                  Data → Insight → Concrete Actionable Study Steps.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Actionable Insights */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Generated Next Actions
              </span>
              {adaptiveState.actionableInsights.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-300">{item.insight}</span>
                    <span className="text-[10px] font-mono text-slate-400">{item.basedOn}</span>
                  </div>
                  <p className="text-xs font-bold text-white">{item.recommendedAction}</p>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.targetTab as ActiveTab)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <span>Execute Action</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {adaptiveState.actionableInsights.length === 0 && (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 italic">
                  Keep studying — not enough data to generate analytics-driven actions yet.
                </div>
              )}
            </div>

            {/* Weekly Student Review (Section 16) */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Weekly Student Review
              </span>
              <p className="text-xs text-slate-300 font-medium">
                {adaptiveState.weeklyReview.summaryMessage}
              </p>
              <div className="space-y-1 text-[11px] text-slate-400 pt-1 border-t border-white/5">
                <p>• <span className="text-white font-semibold">Active Study Days:</span> {adaptiveState.weeklyReview.studyDaysCount} of 7</p>
                <p>• <span className="text-white font-semibold">Revisions Finished:</span> {adaptiveState.weeklyReview.revisionsCompleted}</p>
                <p>• <span className="text-white font-semibold">Weak Areas:</span> {adaptiveState.weeklyReview.weakAreasIdentified.join(", ")}</p>
                <p>• <span className="text-white font-semibold">Next Week Focus:</span> {adaptiveState.weeklyReview.nextWeekPriorities[0] || "Maintain core syllabus pace"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
