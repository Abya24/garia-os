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
  Activity,
  CheckSquare,
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
import {
  generateLearningEffectivenessReport,
  LearningEffectivenessReport,
  EnhancedMistakeRecord,
  loadEnhancedMistakes,
  logMistakeRetryAttempt,
  MistakeType,
} from "../../../utils/learningEffectivenessEngine";
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
    "all" | "actions" | "plan" | "effectiveness" | "weakness" | "mistakes" | "mastery" | "readiness" | "analytics"
  >("all");

  // Interactive Student Controls (Section 8 & 20)
  const [dailyTimeBudgetMinutes, setDailyTimeBudgetMinutes] = useState<number>(
    (examProfile?.dailyStudyHours || 2) * 60
  );
  const [completedActionIds, setCompletedActionIds] = useState<string[]>([]);
  const [skippedActionIds, setSkippedActionIds] = useState<string[]>([]);
  const [durationAdjustments, setDurationAdjustments] = useState<Record<string, number>>({});

  // Mistake modal & review state (Section 6 & 12)
  const [enhancedMistakesList, setEnhancedMistakesList] = useState<EnhancedMistakeRecord[]>(() =>
    loadEnhancedMistakes(profileId)
  );
  const [activeMistakeReview, setActiveMistakeReview] = useState<EnhancedMistakeRecord | null>(null);
  const [mistakeWhyNote, setMistakeWhyNote] = useState<string>("");
  const [selectedMistakeType, setSelectedMistakeType] = useState<MistakeType>("Unclassified");

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

  // P5 Learning Effectiveness & Exam Performance Intelligence Report
  const p5Report: LearningEffectivenessReport = useMemo(() => {
    return generateLearningEffectivenessReport({
      student: activeStudent,
      subjects,
      studySessions,
      academicChapters,
      revisions,
      practiceSessions,
      examRecords,
      examProfile,
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
    examProfile,
    streakDays,
  ]);

  // Backward-compatible decision report
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
    return p5Report.nextBestActions.filter((a) => !skippedActionIds.includes(`p5-act-${a.rank}`));
  }, [p5Report.nextBestActions, skippedActionIds]);

  const handleActionComplete = (actionKey: string) => {
    setCompletedActionIds((prev) =>
      prev.includes(actionKey) ? prev.filter((id) => id !== actionKey) : [...prev, actionKey]
    );
  };

  const handleActionSkip = (actionKey: string) => {
    setSkippedActionIds((prev) => [...prev, actionKey]);
  };

  const handleDurationDelta = (actionKey: string, deltaMins: number) => {
    setDurationAdjustments((prev) => ({
      ...prev,
      [actionKey]: Math.max(10, (prev[actionKey] || 0) + deltaMins),
    }));
  };

  const handleRetryMistake = (mistakeId: string, isCorrect: boolean) => {
    logMistakeRetryAttempt(profileId, mistakeId, isCorrect, mistakeWhyNote);
    setEnhancedMistakesList(loadEnhancedMistakes(profileId));
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
            <span>Learning Effectiveness & Exam Intelligence</span>
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
            title="Evidence-backed learning signals derived from student activity; not an official board claim."
          >
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            <span>Learning Signals (Application-Derived)</span>
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
          onClick={() => setActiveSubTab("effectiveness")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "effectiveness"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Effectiveness & Retention
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("weakness")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "weakness"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Weak Diagnoses ({p5Report.weakTopicsDiagnosed.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("mistakes")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "mistakes"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Mistakes ({p5Report.mistakeMetrics.unresolvedCount})
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
          onClick={() => setActiveSubTab("mastery")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "mastery"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Mastery 2.0
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
          Readiness 2.0
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. NEXT BEST ACTIONS WITH STUDENT-FACING "WHY?" & EVIDENCE (Section 18-20) */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "actions") && (
        <div id="section-p5-top3-actions" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                <Flame className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  What Should I Do Now? (Student-Facing "Why?" & Evidence)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Strictly prioritized top 3 academic actions with concrete student evidence and time estimation.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Max 3 Actions Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {visibleRecommendations.map((item, idx) => {
              const actionKey = `p5-act-${item.rank}`;
              const isCompleted = completedActionIds.includes(actionKey);
              const customDuration = item.howLongMinutes + (durationAdjustments[actionKey] || 0);

              return (
                <div
                  key={actionKey}
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
                    {/* Header: Rank + Subject Badge + Confidence */}
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
                          {item.subjectName}
                        </span>
                      </div>

                      <span
                        className="text-[10px] font-mono text-amber-300 font-bold"
                        title="Confidence derived from student activity quantity and consistency."
                      >
                        Confidence: {item.confidence}
                      </span>
                    </div>

                    {/* What? Title */}
                    <div>
                      <h4
                        className={`text-sm font-bold leading-snug line-clamp-2 ${
                          isCompleted ? "line-through text-slate-400" : "text-white"
                        }`}
                      >
                        {item.what}
                      </h4>
                      <p className="text-[11px] text-cyan-300 font-semibold mt-0.5">
                        {item.chapterTitle}
                      </p>
                    </div>

                    {/* Why? (Educational rationale) */}
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                      <span className="font-semibold text-rose-300">Why: </span>
                      {item.why}
                    </div>

                    {/* Evidence? (Student signals) */}
                    <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed">
                      <span className="font-semibold text-cyan-400">Evidence: </span>
                      {item.evidence}
                    </div>

                    {/* What next? */}
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>What next: {item.whatNext}</span>
                    </p>
                  </div>

                  {/* Footer: Duration + Controls (Section 20) */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>~{customDuration}m</span>
                        <button
                          type="button"
                          onClick={() => handleDurationDelta(actionKey, 15)}
                          title="Add 15 mins"
                          className="px-1 py-0.2 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono cursor-pointer"
                        >
                          +15m
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleActionSkip(actionKey)}
                          title="Skip recommendation"
                          className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          Skip
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleActionComplete(actionKey)}
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
                      onClick={() => onNavigate(item.targetTab as ActiveTab)}
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
      {/* 2. STUDY QUANTITY VS EFFECTIVENESS & RETENTION (Section 8 & 10)            */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "effectiveness") && (
        <div
          id="section-p5-effectiveness"
          className="rounded-2xl p-4 sm:p-5 border border-indigo-500/30 bg-slate-900/90 space-y-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Study Quantity vs Learning Effectiveness & Retention
                </h3>
                <p className="text-[11px] text-slate-400">
                  Compares reading hours with practice output, mistake resolution, and retention stability.
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                p5Report.quantityVsEffectiveness.learningSignal === "Positive"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : p5Report.quantityVsEffectiveness.learningSignal === "Needs Practice Balance"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
              }`}
            >
              Signal: {p5Report.quantityVsEffectiveness.learningSignal}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Quantity (Study Time)</span>
              <p className="text-base font-bold text-white">{p5Report.quantityVsEffectiveness.totalStudyHoursFormatted}</p>
              <p className="text-[10px] text-slate-400">{p5Report.quantityVsEffectiveness.sessionsCompletedCount} session(s)</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Practice Questions</span>
              <p className="text-base font-bold text-cyan-300">{p5Report.quantityVsEffectiveness.practiceQuestionsAttemptedCount}</p>
              <p className="text-[10px] text-slate-400">Attempted sets</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Recent Accuracy</span>
              <p className="text-base font-bold text-emerald-400">
                {p5Report.quantityVsEffectiveness.recentPracticeAccuracyPct !== null
                  ? `${p5Report.quantityVsEffectiveness.recentPracticeAccuracyPct}%`
                  : "Not enough data"}
              </p>
              <p className="text-[10px] text-slate-400">Practice drills</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Mistakes Resolved</span>
              <p className="text-base font-bold text-amber-300">
                {p5Report.quantityVsEffectiveness.mistakesCorrectedCount}
              </p>
              <p className="text-[10px] text-slate-400">
                {p5Report.quantityVsEffectiveness.repeatedMistakesActiveCount} repeated
              </p>
            </div>
          </div>

          {/* Retention Signal Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Retention Signal (Honest Evaluation)
              </span>
              <p className="font-bold text-white">{p5Report.retentionSignal.retentionStatus}</p>
              <p className="text-[11px] text-slate-400">{p5Report.retentionSignal.evidence}</p>
            </div>
            {p5Report.retentionSignal.recallCheckRecommended && (
              <button
                type="button"
                onClick={() => onNavigate("exam")}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-bold text-xs shrink-0 cursor-pointer"
              >
                Schedule Recall Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. WEAK TOPIC DIAGNOSIS (TYPES A THROUGH F) & BOTTLENECK DETECTION        */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "weakness") && (
        <div
          id="section-p5-weakness"
          className="rounded-2xl p-4 sm:p-5 border border-amber-500/30 bg-slate-900/90 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Weak Topic Diagnosis (Types A through F)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Differentiates low accuracy, repeated mistakes, forgotten topics, coverage gaps, and unstable variance.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              {p5Report.weakTopicsDiagnosed.length} Identified
            </span>
          </div>

          {p5Report.weakTopicsDiagnosed.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {p5Report.weakTopicsDiagnosed.map((d, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-300">{d.subjectName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {d.diagnosisType}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{d.chapterTitle}</h4>
                  <p className="text-[11px] text-slate-300 leading-snug">{d.evidenceSummary}</p>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-rose-300 font-semibold">{d.suggestedAction}</span>
                    <button
                      type="button"
                      onClick={() => onNavigate("study")}
                      className="text-amber-400 hover:text-amber-300 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <span>Action</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold text-white">No Critical Weak Areas Detected</p>
              <p className="text-[11px] text-slate-400">
                Continue regular practice sessions to reinforce concept mastery.
              </p>
            </div>
          )}

          {/* Learning Bottlenecks (Section 17) */}
          {p5Report.learningBottlenecks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                Possible Learning Bottlenecks Detected
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {p5Report.learningBottlenecks.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/25 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">{b.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{b.patternType}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{b.description}</p>
                    <p className="text-[10px] text-cyan-300 pt-1">💡 Action: {b.suggestedAction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MISTAKE INTELLIGENCE 2.0 & RETRY EFFECTIVENESS (Section 6 & 7)         */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "mistakes") && (
        <div
          id="section-p5-mistakes"
          className="rounded-2xl p-4 sm:p-5 border border-rose-500/30 bg-slate-900/90 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Mistake Intelligence 2.0 & Retry Effectiveness
                </h3>
                <p className="text-[11px] text-slate-400">
                  {p5Report.mistakeMetrics.summaryMessage}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
              {p5Report.mistakeMetrics.unresolvedCount} Unresolved
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Correction Rate</span>
              <p className="text-base font-bold text-emerald-400">
                {p5Report.mistakeMetrics.correctionRatePct !== null
                  ? `${p5Report.mistakeMetrics.correctionRatePct}%`
                  : "No retry data"}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Repeated Rate</span>
              <p className="text-base font-bold text-amber-400">
                {p5Report.mistakeMetrics.repeatedMistakeRatePct !== null
                  ? `${p5Report.mistakeMetrics.repeatedMistakeRatePct}%`
                  : "0%"}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Total Retried</span>
              <p className="text-base font-bold text-cyan-300">{p5Report.mistakeMetrics.totalRetried}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Total Resolved</span>
              <p className="text-base font-bold text-white">{p5Report.mistakeMetrics.totalCorrected}</p>
            </div>
          </div>

          {enhancedMistakesList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {enhancedMistakesList.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-rose-500/30 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-300">{m.subjectName}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        m.lifecycleStatus === "Corrected"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : m.lifecycleStatus === "Repeated"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {m.lifecycleStatus} ({m.mistakeType})
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
                      onClick={() => {
                        setActiveMistakeReview(m);
                        setSelectedMistakeType(m.mistakeType || "Unclassified");
                      }}
                      className="text-xs font-bold text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1"
                    >
                      <span>Review & Retry ({m.correctionAttempts} retries)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold text-white">No Question Mistakes Logged</p>
              <p className="text-[11px] text-slate-400">
                Wrong questions in practice sessions automatically stream into this review queue.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mistake Detail / Retry Modal */}
      {activeMistakeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
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
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Understood & Retried ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TOPIC MASTERY 2.0 (MULTI-SIGNAL EVIDENCE) (Section 4)                  */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "mastery") && (
        <div
          id="section-p5-mastery"
          className="rounded-2xl p-4 sm:p-5 border border-purple-500/30 bg-slate-900/90 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                <Layers className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Topic Mastery 2.0 (Multi-Signal Evidence)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Integrates practice accuracy, retry improvement, mistake resolution, and revision history.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {p5Report.topicMasteries.slice(0, 6).map((tm) => (
              <div key={tm.chapterId} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300">{tm.subjectName}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      tm.stage === "Strong"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : tm.stage === "Practicing"
                        ? "bg-cyan-500/20 text-cyan-300"
                        : tm.stage === "Improving"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tm.stage}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white truncate">{tm.chapterTitle}</h4>

                {/* Evidence bullets */}
                <div className="space-y-1 text-[10px] text-slate-400">
                  {tm.evidence.map((ev, eIdx) => (
                    <p key={eIdx} className="truncate">• {ev}</p>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/5 text-[11px] text-purple-300 font-medium">
                  Next: {tm.recommendedNextAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EXAM READINESS 2.0 (MULTI-DIMENSIONAL ASSESSMENT) (Section 15)         */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "readiness") && (
        <div
          id="section-p5-readiness"
          className="rounded-2xl p-4 sm:p-5 border border-cyan-500/30 bg-slate-900/90 space-y-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                <Target className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Exam Readiness 2.0 (Multi-Dimensional Assessment)
                </h3>
                <p className="text-[11px] text-slate-400">
                  {p5Report.examReadiness2.readinessExplanation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  p5Report.examReadiness2.dateType === "OFFICIAL_EXAM_DATE"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                }`}
              >
                {p5Report.examReadiness2.dateType.replace(/_/g, " ")}
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {p5Report.examReadiness2.daysRemaining} Days Left
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase">Coverage</span>
              <p className="font-bold text-white mt-1">{p5Report.examReadiness2.coverageSignal}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase">Mastery</span>
              <p className="font-bold text-white mt-1">{p5Report.examReadiness2.masterySignal}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase">Practice</span>
              <p className="font-bold text-white mt-1">{p5Report.examReadiness2.practiceSignal}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase">Revision</span>
              <p className="font-bold text-white mt-1">{p5Report.examReadiness2.revisionSignal}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase">Mistakes</span>
              <p className="font-bold text-white mt-1">{p5Report.examReadiness2.mistakesSignal}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase">Overall</span>
              <p className="font-bold text-cyan-400 mt-1">{p5Report.examReadiness2.overallReadinessSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TIME-AWARE STUDY PLAN (PRESERVED FROM P4) (Section 8 & 9)              */}
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

            {/* Deferred Work */}
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
      {/* 8. WEEKLY LEARNING EFFECTIVENESS REVIEW (Section 21)                       */}
      {/* ========================================================================= */}
      {(activeSubTab === "all" || activeSubTab === "analytics") && (
        <div
          id="section-p5-weekly-review"
          className="rounded-2xl p-4 sm:p-5 border border-indigo-500/30 bg-slate-900/90 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Weekly Learning Effectiveness Review
                </h3>
                <p className="text-[11px] text-slate-400">
                  Summary of what improved, what remained weak, and what to adjust next week.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <span className="font-bold text-emerald-400 uppercase font-mono tracking-wider">
                What Improved
              </span>
              {p5Report.weeklyReview2.whatImproved.map((item, idx) => (
                <p key={idx} className="text-slate-300">• {item}</p>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <span className="font-bold text-rose-400 uppercase font-mono tracking-wider">
                What Stayed Weak
              </span>
              {p5Report.weeklyReview2.whatStayedWeak.length > 0 ? (
                p5Report.weeklyReview2.whatStayedWeak.map((item, idx) => (
                  <p key={idx} className="text-slate-300">• {item}</p>
                ))
              ) : (
                <p className="text-slate-400 italic">No persistent weaknesses flagged.</p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <span className="font-bold text-cyan-400 uppercase font-mono tracking-wider">
                Next Week Adjustment
              </span>
              {p5Report.weeklyReview2.whatShouldChangeNextWeek.map((item, idx) => (
                <p key={idx} className="text-slate-300">• {item}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
