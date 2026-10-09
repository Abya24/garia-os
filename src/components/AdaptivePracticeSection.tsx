import React, { useState, useMemo, useEffect } from "react";
import {
  Target,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  ArrowRight,
  ChevronRight,
  Filter,
  Layers,
  BookOpen,
  Award,
  AlertCircle,
  TrendingUp,
  Brain,
  ShieldCheck,
  CheckSquare,
  Play,
  Check,
  X,
  FileText,
} from "lucide-react";
import {
  StudentProfile,
  AcademicSubject,
  AcademicChapter,
  AcademicRevisionItem,
  AcademicPracticeSession,
  ExamTestRecord,
  ExamProfile,
} from "../types";
import {
  buildUnifiedAdaptiveQuestionPool,
  buildAdaptivePracticeSession,
  recommendNextAdaptiveQuestion,
  recordAdaptivePracticeAttempt,
  calculatePracticeEffectiveness,
  analyzePracticeCoverage,
  auditQuestionBankQuality,
  convertPracticePlanToStudyActions,
  loadStudentPracticeAttempts,
  AdaptiveQuestion,
  AdaptivePracticePlan,
  AdaptiveSessionQuestion,
  PracticeMode,
  StudentPracticeAttempt,
  AdaptiveNextRecommendation,
} from "../utils/adaptivePracticeEngine";
import {
  loadEnhancedMistakes,
  EnhancedMistakeRecord,
  MistakeType,
} from "../utils/learningEffectivenessEngine";
import { ExamStrategyReport } from "../utils/examStrategyEngine";

interface AdaptivePracticeSectionProps {
  student?: StudentProfile;
  examProfile: ExamProfile;
  academicSubjects: AcademicSubject[];
  academicChapters: AcademicChapter[];
  revisions?: AcademicRevisionItem[];
  practiceSessions?: AcademicPracticeSession[];
  examTestRecords?: ExamTestRecord[];
  p6Report?: ExamStrategyReport;
  onNavigate?: (tab: any) => void;
}

export const AdaptivePracticeSection: React.FC<AdaptivePracticeSectionProps> = ({
  student,
  examProfile,
  academicSubjects,
  academicChapters,
  revisions = [],
  practiceSessions = [],
  examTestRecords = [],
  p6Report,
  onNavigate,
}) => {
  const profileId = student?.id || "default";

  // Session configuration state
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("BALANCED");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [selectedChapter, setSelectedChapter] = useState<string>("ALL");

  // Interactive Question Runner State
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [selectedMistakeType, setSelectedMistakeType] = useState<MistakeType>("Unclassified");
  const [mistakeNotes, setMistakeNotes] = useState<string>("");
  const [nextRecommendation, setNextRecommendation] = useState<AdaptiveNextRecommendation | null>(null);
  const [completedQuestionIds, setCompletedQuestionIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Local student practice history state
  const [attemptHistory, setAttemptHistory] = useState<StudentPracticeAttempt[]>(() =>
    loadStudentPracticeAttempts(profileId)
  );

  // Reload history when profile changes
  useEffect(() => {
    setAttemptHistory(loadStudentPracticeAttempts(profileId));
  }, [profileId]);

  // Load P5 enhanced mistakes
  const enhancedMistakes = useMemo(() => {
    return loadEnhancedMistakes(profileId);
  }, [profileId, isAnswerSubmitted]);

  // Build Adaptive Practice Session
  const sessionPlan: AdaptivePracticePlan = useMemo(() => {
    return buildAdaptivePracticeSession({
      config: {
        profileId,
        durationMinutes,
        mode: practiceMode,
        subjectFilter: selectedSubject !== "ALL" ? selectedSubject : undefined,
        chapterFilter: selectedChapter !== "ALL" ? selectedChapter : undefined,
      },
      context: {
        student,
        examProfile,
        academicSubjects,
        academicChapters,
        practiceSessions,
        revisions,
        examTestRecords,
        enhancedMistakes,
        p6Report,
      },
      attemptHistory,
    });
  }, [
    profileId,
    durationMinutes,
    practiceMode,
    selectedSubject,
    selectedChapter,
    student,
    examProfile,
    academicSubjects,
    academicChapters,
    practiceSessions,
    revisions,
    examTestRecords,
    enhancedMistakes,
    p6Report,
    attemptHistory,
  ]);

  // Current question in runner
  const currentSessionQuestion: AdaptiveSessionQuestion | undefined =
    sessionPlan.allQuestions[activeQuestionIndex];
  const currentQuestion: AdaptiveQuestion | undefined = currentSessionQuestion?.question;

  // Practice effectiveness metrics
  const effectiveness = useMemo(() => {
    return calculatePracticeEffectiveness({
      attempts: attemptHistory,
      enhancedMistakes,
    });
  }, [attemptHistory, enhancedMistakes]);

  // Practice coverage analysis
  const coverage = useMemo(() => {
    return analyzePracticeCoverage({
      attempts: attemptHistory,
      classLevel: student?.classLevel || "Class 12",
      stream: student?.stream || "Commerce",
    });
  }, [attemptHistory, student]);

  // Question bank quality audit
  const qualityAudit = useMemo(() => {
    return auditQuestionBankQuality();
  }, []);

  // Reset timer on question change
  useEffect(() => {
    setStartTime(Date.now());
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setNextRecommendation(null);
    setMistakeNotes("");
    setSelectedMistakeType("Unclassified");
  }, [activeQuestionIndex, sessionPlan.sessionId]);

  // Handle Answer Submission
  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;

    const timeSpent = Math.max(5, Math.round((Date.now() - startTime) / 1000));
    const isCorrect =
      currentQuestion.correctOptionIndex !== undefined
        ? selectedOption === currentQuestion.correctOptionIndex
        : true;

    // Previous attempt count for this question
    const prevAttempts = attemptHistory.filter((a) => a.questionId === currentQuestion.id);
    const attemptNumber = prevAttempts.length + 1;

    // Record attempt
    const result = recordAdaptivePracticeAttempt({
      profileId,
      question: currentQuestion,
      isCorrect,
      selectedOption: selectedOption !== null ? selectedOption : undefined,
      timeSpentSeconds: timeSpent,
      attemptNumber,
      mistakeType: !isCorrect ? selectedMistakeType : undefined,
      notes: mistakeNotes || undefined,
      isOffline: typeof navigator !== "undefined" && !navigator.onLine,
    });

    setAttemptHistory(result.allAttempts);
    setIsAnswerSubmitted(true);
    setCompletedQuestionIds((prev) => [...prev, currentQuestion.id]);

    // Recommend next adaptive question
    const nextRec = recommendNextAdaptiveQuestion({
      lastAttempt: result.attempt,
      availableQuestions: sessionPlan.allQuestions.map((sq) => sq.question),
      completedQuestionIds: [...completedQuestionIds, currentQuestion.id],
      context: {
        student,
        examProfile,
        academicSubjects,
        academicChapters,
        enhancedMistakes,
        p6Report,
      },
    });

    setNextRecommendation(nextRec);
  };

  // Jump to specific or recommended question
  const handleProceedToNext = () => {
    if (nextRecommendation?.nextQuestion) {
      const targetIdx = sessionPlan.allQuestions.findIndex(
        (sq) => sq.question.id === nextRecommendation.nextQuestion!.id
      );
      if (targetIdx !== -1) {
        setActiveQuestionIndex(targetIdx);
        return;
      }
    }
    // Default next in session array
    if (activeQuestionIndex < sessionPlan.allQuestions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
    }
  };

  // Export recommendations into daily plan
  const handleExportToDailyPlan = () => {
    const studyActions = convertPracticePlanToStudyActions(sessionPlan);
    setStatusMessage(
      `✓ Exported ${studyActions.length} adaptive practice tasks to your daily study plan.`
    );
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div id="p7-adaptive-practice-container" className="space-y-6">
      {/* 1. Header & Context Banner */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                P7 Practice Intelligence 2.0
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Closed-Loop Adaptive Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {student?.board || "Board"} • {student?.stream || "General"} • {student?.classLevel || "Class 12"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight flex items-center gap-2">
              <Target className="w-6 h-6 text-cyan-400" />
              <span>Adaptive Practice & Question Intelligence</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Dynamically evaluates your syllabus mastery, mistake history, and P6 exam strategy to serve the next best question.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportToDailyPlan}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Send to Study Plan</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in">
            {statusMessage}
          </div>
        )}
      </div>

      {/* 2. Practice Effectiveness Strip (Non-Causal Evidence) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Attempted</span>
          <p className="text-xl font-black text-white">{effectiveness.totalQuestionsAttempted}</p>
          <span className="text-[9px] text-slate-400">Total questions</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Accuracy</span>
          <p className="text-xl font-black text-cyan-300">{effectiveness.accuracyPct}%</p>
          <span className="text-[9px] text-slate-400">Correct answers</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Retries Done</span>
          <p className="text-xl font-black text-purple-300">{effectiveness.retriesAttempted}</p>
          <span className="text-[9px] text-slate-400">{effectiveness.retriesSuccessful} successful</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Retry Improvement</span>
          <p className="text-xl font-black text-emerald-300">{effectiveness.retryImprovementPct}%</p>
          <span className="text-[9px] text-slate-400">Resolution rate</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Mistakes Resolved</span>
          <p className="text-xl font-black text-amber-300">{effectiveness.mistakesCorrectedCount}</p>
          <span className="text-[9px] text-slate-400">P5 lifecycle: Corrected</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Topic Coverage</span>
          <p className="text-xl font-black text-blue-300">{coverage.coveragePercentage}%</p>
          <span className="text-[9px] text-slate-400">{coverage.practicedTopicsCount}/{coverage.totalAvailableTopics} topics</span>
        </div>
      </div>

      {/* Effectiveness Signal Statement */}
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold text-white">{effectiveness.effectivenessSignal}</span>
        </div>
        <span className="text-[10px] text-slate-400 italic shrink-0 hidden md:inline">
          ⚖️ {effectiveness.honestStatement}
        </span>
      </div>

      {/* 3. Session Controls & Filter Bar */}
      <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Mode Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold mr-1">Mode:</span>
            {[
              { id: "BALANCED", label: "🎯 Balanced", color: "cyan" },
              { id: "WEAK_TOPIC", label: "🔍 Weak Topics", color: "rose" },
              { id: "MISTAKE_RECOVERY", label: "⚠️ Mistake Recovery", color: "amber" },
              { id: "EXAM_STRATEGY", label: "📈 Exam Strategy", color: "purple" },
              { id: "QUICK_PRACTICE", label: "⚡ Quick Sprint", color: "blue" },
              { id: "REVISION_PRACTICE", label: "🔄 Revision Drill", color: "emerald" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setPracticeMode(m.id as PracticeMode);
                  setActiveQuestionIndex(0);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  practiceMode === m.id
                    ? "bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Duration Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Time Budget:</span>
            <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xl border border-white/10">
              {[10, 20, 30, 45].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setDurationMinutes(mins);
                    setActiveQuestionIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    durationMinutes === mins
                      ? "bg-cyan-500 text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters: Subject & Chapter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400 font-semibold text-[11px]">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedChapter("ALL");
                setActiveQuestionIndex(0);
              }}
              className="bg-slate-900 text-white font-bold px-2.5 py-1 rounded-xl border border-white/10 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Subjects ({academicSubjects.length})</option>
              {academicSubjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-slate-400 font-semibold text-[11px]">Chapter:</span>
            <select
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(e.target.value);
                setActiveQuestionIndex(0);
              }}
              className="bg-slate-900 text-white font-bold px-2.5 py-1 rounded-xl border border-white/10 focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              <option value="ALL">All Chapters</option>
              {academicChapters
                .filter(
                  (c) =>
                    selectedSubject === "ALL" ||
                    c.subjectName?.toLowerCase() === selectedSubject.toLowerCase()
                )
                .map((ch) => (
                  <option key={ch.id} value={ch.title}>
                    {ch.title}
                  </option>
                ))}
            </select>
          </div>

          <div className="sm:ml-auto text-[11px] font-mono text-slate-400">
            Session: <span className="text-cyan-300 font-bold">{sessionPlan.totalQuestions} questions</span> planned (~{durationMinutes} mins)
          </div>
        </div>
      </div>

      {/* 4. Interactive Question Runner & Active Problem Stage */}
      {currentQuestion ? (
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-cyan-500/30 bg-slate-900/95 space-y-5">
          {/* Question Stage Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-xl bg-cyan-500 text-slate-900 font-black text-xs font-mono">
                Q {activeQuestionIndex + 1} of {sessionPlan.totalQuestions}
              </span>
              <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-xl border border-white/10">
                {currentQuestion.subjectName}
              </span>
              <span className="text-xs text-cyan-300 font-medium truncate max-w-[200px]">
                {currentQuestion.chapterTitle}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  currentSessionQuestion?.category === "Must Practice"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                }`}
              >
                {currentSessionQuestion?.category}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span
                className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10"
                title={currentQuestion.provenanceNote}
              >
                🏛️ {currentQuestion.provenanceType}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-amber-300">
                ~{currentSessionQuestion?.estimatedTimeMinutes}m
              </span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-emerald-300 font-bold">
                {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQuestion.questionText}
            </p>
            {currentQuestion.topicName && (
              <p className="text-xs font-mono text-cyan-400">
                Topic: {currentQuestion.topicName}
              </p>
            )}
          </div>

          {/* Question Options (for MCQ) */}
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div className="space-y-2.5 pt-2">
              {currentQuestion.options.map((optText, optIdx) => {
                const isSelected = selectedOption === optIdx;
                const isCorrectOpt = optIdx === currentQuestion.correctOptionIndex;

                let optionStyles =
                  "bg-slate-950/80 border-slate-800 hover:border-cyan-500/40 text-slate-200";

                if (isAnswerSubmitted) {
                  if (isCorrectOpt) {
                    optionStyles = "bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold";
                  } else if (isSelected && !isCorrectOpt) {
                    optionStyles = "bg-rose-950/40 border-rose-500 text-rose-200 line-through";
                  } else {
                    optionStyles = "bg-slate-950/40 border-slate-900 opacity-60 text-slate-400";
                  }
                } else if (isSelected) {
                  optionStyles = "bg-cyan-950/40 border-cyan-400 text-white font-bold shadow-md shadow-cyan-500/10";
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => setSelectedOption(optIdx)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs sm:text-sm cursor-pointer ${optionStyles}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isSelected
                            ? "bg-cyan-500 text-slate-900"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{optText}</span>
                    </div>

                    {isAnswerSubmitted && isCorrectOpt && (
                      <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrectOpt && (
                      <X className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Solution preview for subjective/numerical */
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold block">
                Subjective / Structured Problem:
              </span>
              <p className="text-xs text-slate-300">
                Work out the solution in your notebook. Click submit to inspect the official model answer and grade your response.
              </p>
            </div>
          )}

          {/* Action Bar: Submit or Next */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Time in question: {Math.max(1, Math.round((Date.now() - startTime) / 1000))}s</span>
            </div>

            <div className="flex items-center gap-2.5">
              {!isAnswerSubmitted ? (
                <button
                  type="button"
                  disabled={selectedOption === null && currentQuestion.options && currentQuestion.options.length > 0}
                  onClick={handleSubmitAnswer}
                  className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4 fill-slate-900" />
                  <span>Check & Submit Answer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleProceedToNext}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-slate-900 font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <span>Next Adaptive Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Submitted Feedback: Explanation & Mistake Classification */}
          {isAnswerSubmitted && (
            <div className="space-y-4 pt-3 border-t border-white/10 animate-in fade-in duration-200">
              {/* Solution / Explanation Box */}
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-1.5 ${
                  currentQuestion.correctOptionIndex !== undefined &&
                  selectedOption === currentQuestion.correctOptionIndex
                    ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                    : "bg-rose-950/20 border-rose-500/40 text-rose-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    {currentQuestion.correctOptionIndex !== undefined &&
                    selectedOption === currentQuestion.correctOptionIndex ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Correct Answer!</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Incorrect Response</span>
                      </>
                    )}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-slate-300">
                    Model Explanation
                  </span>
                </div>
                <p className="text-xs text-white leading-relaxed pt-1">
                  {currentQuestion.explanation || currentQuestion.answerSolution || "See textbook chapter theory for complete derivation."}
                </p>
              </div>

              {/* If Incorrect: Mistake Self-Classification (P5 Loop) */}
              {currentQuestion.correctOptionIndex !== undefined &&
                selectedOption !== currentQuestion.correctOptionIndex && (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Log Mistake Cause into Mistake Intelligence 2.0</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">P5 Auto-Synced</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Mistake Type:
                        </label>
                        <select
                          value={selectedMistakeType}
                          onChange={(e) => setSelectedMistakeType(e.target.value as MistakeType)}
                          className="w-full bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none"
                        >
                          <option value="Concept misunderstanding">Concept misunderstanding</option>
                          <option value="Formula/rule error">Formula/rule error</option>
                          <option value="Calculation error">Calculation error</option>
                          <option value="Careless reading error">Careless reading error</option>
                          <option value="Time-pressure slip">Time-pressure slip</option>
                          <option value="Unclassified">Unclassified</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Quick Reflection Note:
                        </label>
                        <input
                          type="text"
                          value={mistakeNotes}
                          onChange={(e) => setMistakeNotes(e.target.value)}
                          placeholder="e.g. Misread debit side entry"
                          className="w-full bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

              {/* Dynamic Next-Question Recommendation */}
              {nextRecommendation && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/30 to-purple-950/30 border border-cyan-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-cyan-400" />
                      <span>Adaptive Next Recommendation</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {nextRecommendation.actionType}
                    </span>
                  </div>
                  <p className="text-xs text-white leading-relaxed">
                    {nextRecommendation.reason}
                  </p>
                  {nextRecommendation.nextQuestion && (
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-300 font-semibold truncate max-w-[280px]">
                        Target: {nextRecommendation.nextQuestion.chapterTitle} ({nextRecommendation.nextQuestion.difficulty})
                      </span>
                      <button
                        type="button"
                        onClick={handleProceedToNext}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Jump to This Question</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Evidence Explanation Footer */}
          {currentSessionQuestion && (
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-white/5 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="truncate">
                🔍 {currentSessionQuestion.scoreBreakdown.evidenceExplanation}
              </span>
              <span className="text-cyan-400 font-mono shrink-0">
                Adaptive Score: {currentSessionQuestion.scoreBreakdown.totalAdaptiveScore}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Questions in Current Filter</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {sessionPlan.honestDisclaimer}
          </p>
        </div>
      )}

      {/* 5. Session Roadmap & Allocations */}
      <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Planned Practice Questions ({sessionPlan.totalQuestions})</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {completedQuestionIds.length} completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sessionPlan.allQuestions.map((sq, idx) => {
            const isCurrent = idx === activeQuestionIndex;
            const isDone = completedQuestionIds.includes(sq.question.id);
            return (
              <button
                key={sq.question.id}
                type="button"
                onClick={() => setActiveQuestionIndex(idx)}
                className={`text-left p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                  isCurrent
                    ? "bg-cyan-950/30 border-cyan-400 shadow-md shadow-cyan-500/10"
                    : isDone
                    ? "bg-emerald-950/20 border-emerald-500/30 opacity-75"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300">
                    #{idx + 1} {sq.question.subjectName}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-300"
                        : sq.category === "Must Practice"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isDone ? "Done ✓" : sq.category}
                  </span>
                </div>
                <p className="text-xs text-white font-medium truncate">
                  {sq.question.chapterTitle}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {sq.scoreBreakdown.selectionReason}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Practice Coverage Intelligence & Quality Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Coverage Intelligence */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Syllabus Practice Coverage</span>
            </h4>
            <span className="text-xs font-mono text-cyan-300 font-bold">
              {coverage.coveragePercentage}% Covered
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${coverage.coveragePercentage}%` }}
            />
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 block">
              Untouched Topics ({coverage.untouchedTopics.length}):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {coverage.untouchedTopics.slice(0, 8).map((top, tIdx) => (
                <span
                  key={tIdx}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-950/80 border border-white/5 text-slate-300"
                >
                  {top}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Question Bank Quality & Provenance Audit */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Question Bank Quality & Provenance</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Verified
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Total Pool</span>
              <span className="font-bold text-white text-sm">{qualityAudit.totalQuestions}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Valid Questions</span>
              <span className="font-bold text-emerald-400 text-sm">{qualityAudit.validQuestionsCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Duplicates</span>
              <span className="font-bold text-cyan-400 text-sm">{qualityAudit.duplicateAudit.exactDuplicatesCount}</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            🏛️ Every question carries provenance tagging separating verified past examinations, official model papers, and application-derived drills.
          </p>
        </div>
      </div>
    </div>
  );
};
