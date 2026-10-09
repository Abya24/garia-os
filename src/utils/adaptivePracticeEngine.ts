/**
 * GARIA OS — P7 ADAPTIVE PRACTICE & QUESTION INTELLIGENCE 2.0 ENGINE
 * 
 * Creates the closed loop:
 * Student Context -> Curriculum Context -> Topic Mastery -> Weakness ->
 * Mistake History -> Learning Effectiveness -> Exam Strategy -> Question Selection ->
 * Practice -> Result -> Mistake / Learning Evidence -> Updated Intelligence -> Next Best Question
 * 
 * Strict Educational-Honesty & Provenance Rules:
 *   - Application-derived adaptive recommendations based ONLY on actual student evidence.
 *   - Never claims guaranteed marks, guaranteed ranks, or guaranteed exam questions.
 *   - Never claims a model paper is a PYQ.
 *   - Never invents official exam dates or marking schemes without authoritative provenance.
 *   - If evidence is insufficient, returns "Not enough practice data yet."
 *   - Non-causal wording ("Improvement was observed after increased practice").
 *   - Strictly profile-scoped.
 */

import {
  StudentProfile,
  AcademicSubject,
  AcademicChapter,
  AcademicPracticeSession,
  AcademicRevisionItem,
  QuestionType,
  QuestionDifficulty,
  BoardType,
  StreamType,
  CurriculumVerificationStatus,
  ExamProfile,
  ExamTestRecord,
  ExamMockTest,
} from "../types";
import {
  SEED_MCQS,
  SEED_PYQS,
  SEED_PRACTICE_QUESTIONS,
  validatePYQProvenance,
} from "./questionBankEngine";
import { getAllCurriculumSubjects, CurriculumSubject } from "../data/masterCurriculum";
import {
  loadEnhancedMistakes,
  saveEnhancedMistakes,
  logMistakeRetryAttempt,
  EnhancedMistakeRecord,
  MistakeType,
} from "./learningEffectivenessEngine";
import {
  generateExamStrategyReport,
  ExamStrategyReport,
} from "./examStrategyEngine";
import { determineMasteryState } from "./adaptiveStudyEngine";
import { getProfileKey } from "./storage";
import { enqueueOfflineAction } from "./offlineQueue";

// ---------------------------------------------------------------------------
// 1. DATA CONTRACTS & INTERFACES
// ---------------------------------------------------------------------------

export type PracticeMode =
  | "WEAK_TOPIC"
  | "MISTAKE_RECOVERY"
  | "REVISION_PRACTICE"
  | "EXAM_STRATEGY"
  | "BALANCED"
  | "QUICK_PRACTICE";

export type QuestionProvenanceType =
  | "VERIFIED OFFICIAL SOURCE"
  | "OFFICIAL MODEL PAPER"
  | "OFFICIAL TEXTBOOK/RESOURCE"
  | "VERIFIED HISTORICAL PYQ"
  | "APPLICATION-DERIVED PRACTICE"
  | "SAMPLE PRACTICE"
  | "SOURCE-REQUIRED"
  | "UNKNOWN";

export type DifficultySource = "Source-provided" | "Application-derived" | "Unknown";

export interface AdaptiveQuestion {
  id: string;
  questionText: string;
  options?: [string, string, string, string];
  correctOptionIndex?: number;
  explanation?: string;
  answerSolution?: string;
  subjectName: string;
  chapterTitle: string;
  topicName?: string;
  classLevel: string;
  stream?: string;
  board?: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Unknown";
  difficultySource: DifficultySource;
  questionType: QuestionType | "Numerical" | "Assertion/Reason" | "Case Study" | "Definition/Concept" | "Application";
  provenanceType: QuestionProvenanceType;
  provenanceNote: string;
  year?: number;
  tags?: string[];
  marks?: number;
}

export interface AdaptiveScoreBreakdown {
  topicWeaknessFactor: number; // 0-35
  mistakeRecurrenceFactor: number; // 0-30
  revisionNeedFactor: number; // 0-20
  examStrategyFactor: number; // 0-25
  coverageGapFactor: number; // 0-15
  masteryStateFactor: number; // 0-10
  totalAdaptiveScore: number; // 0-135
  selectionReason: string;
  evidenceExplanation: string;
}

export interface AdaptiveSessionQuestion {
  question: AdaptiveQuestion;
  scoreBreakdown: AdaptiveScoreBreakdown;
  category: "Must Practice" | "Should Practice" | "Maintenance";
  estimatedTimeMinutes: number;
}

export interface AdaptivePracticeSessionConfig {
  profileId: string;
  durationMinutes: 10 | 20 | 30 | 45 | number;
  mode: PracticeMode;
  subjectFilter?: string;
  chapterFilter?: string;
}

export interface AdaptivePracticePlan {
  sessionId: string;
  mode: PracticeMode;
  targetDurationMinutes: number;
  totalQuestions: number;
  mustPractice: AdaptiveSessionQuestion[];
  shouldPractice: AdaptiveSessionQuestion[];
  maintenance: AdaptiveSessionQuestion[];
  allQuestions: AdaptiveSessionQuestion[];
  focusSubjects: string[];
  overallReason: string;
  honestDisclaimer: string;
}

export interface StudentPracticeAttempt {
  id: string;
  profileId: string;
  questionId: string;
  subjectName: string;
  chapterTitle: string;
  topicName?: string;
  questionType: string;
  difficulty: string;
  isCorrect: boolean;
  selectedOption?: number;
  writtenAnswer?: string;
  timeSpentSeconds: number;
  attemptNumber: number; // 1 = first attempt, 2+ = retry
  mistakeType?: MistakeType;
  notes?: string;
  timestamp: number;
}

export interface AdaptiveNextRecommendation {
  nextQuestion: AdaptiveQuestion | null;
  actionType:
    | "RETRY_SAME"
    | "SIMILAR_CONCEPT"
    | "STEP_UP_DIFFICULTY"
    | "STEP_DOWN_DIFFICULTY"
    | "SWITCH_TOPIC"
    | "COMPLETED";
  reason: string;
  similarityRelation?:
    | "Same topic"
    | "Same concept"
    | "Same question type"
    | "Similar difficulty"
    | "Application-selected related question";
}

export interface PracticeCoverageReport {
  totalAvailableTopics: number;
  practicedTopicsCount: number;
  untouchedTopics: string[];
  lowCoverageChapters: string[];
  coveragePercentage: number;
  unevenSubjectsAlerts: string[];
}

export interface PracticeEffectivenessMetrics {
  totalQuestionsAttempted: number;
  accuracyPct: number;
  retriesAttempted: number;
  retriesSuccessful: number;
  retryImprovementPct: number;
  mistakesCorrectedCount: number;
  repeatedMistakesAvoidedCount: number;
  avgTimePerQuestionSeconds: number;
  effectivenessSignal: string;
  honestStatement: string;
}

export interface QuestionQualityAuditResult {
  totalQuestions: number;
  validQuestionsCount: number;
  missingMetadataCount: number;
  flaggedRecords: { id: string; issue: string }[];
  duplicateAudit: {
    exactDuplicatesCount: number;
    possibleDuplicatesCount: number;
    uniqueCount: number;
  };
}

export interface StudentAdaptiveContext {
  student?: StudentProfile | null;
  examProfile?: ExamProfile | null;
  academicSubjects?: AcademicSubject[];
  academicChapters?: AcademicChapter[];
  practiceSessions?: AcademicPracticeSession[];
  revisions?: AcademicRevisionItem[];
  examTestRecords?: ExamTestRecord[];
  examMockTests?: ExamMockTest[];
  enhancedMistakes?: EnhancedMistakeRecord[];
  p6Report?: ExamStrategyReport | null;
}

// ---------------------------------------------------------------------------
// 2. UNIFIED QUESTION BANK POOL & PROVENANCE CLASSIFICATION
// ---------------------------------------------------------------------------

export function buildUnifiedAdaptiveQuestionPool(params?: {
  classLevel?: string;
  stream?: string;
  board?: string;
  subjectName?: string;
  chapterTitle?: string;
}): AdaptiveQuestion[] {
  const { classLevel, stream, board, subjectName, chapterTitle } = params || {};

  const pool: AdaptiveQuestion[] = [];
  const seenIds = new Set<string>();

  // 1. Process SEED_MCQS
  for (const mcq of SEED_MCQS) {
    if (classLevel && mcq.classLevel.toLowerCase() !== classLevel.toLowerCase()) continue;
    if (stream && mcq.stream && mcq.stream.toLowerCase() !== stream.toLowerCase()) continue;
    if (subjectName && subjectName !== "ALL" && !mcq.subjectName.toLowerCase().includes(subjectName.toLowerCase()) && !subjectName.toLowerCase().includes(mcq.subjectName.toLowerCase())) continue;
    if (chapterTitle && chapterTitle !== "ALL" && !mcq.chapterTitle.toLowerCase().includes(chapterTitle.toLowerCase())) continue;

    let provenanceType: QuestionProvenanceType = "SAMPLE PRACTICE";
    let provenanceNote = "Curated sample practice question for concept grounding.";

    if (mcq.sourceType === "VERIFIED PYQ") {
      provenanceType = "VERIFIED HISTORICAL PYQ";
      provenanceNote = `Historical ${mcq.board || "Board"} examination question (${mcq.year || "Past Paper"}).`;
    } else if (mcq.sourceType === "AI-GENERATED PRACTICE") {
      provenanceType = "APPLICATION-DERIVED PRACTICE";
      provenanceNote = "Application-derived practice question generated for curriculum drill.";
    }

    let diff: "Easy" | "Medium" | "Hard" | "Unknown" = "Unknown";
    let diffSource: DifficultySource = "Unknown";
    if (mcq.difficulty === "Easy" || mcq.difficulty === "Medium" || mcq.difficulty === "Hard") {
      diff = mcq.difficulty;
      diffSource = "Source-provided";
    }

    if (!seenIds.has(mcq.id)) {
      seenIds.add(mcq.id);
      pool.push({
        id: mcq.id,
        questionText: mcq.questionText,
        options: mcq.options,
        correctOptionIndex: mcq.correctOptionIndex,
        explanation: mcq.explanation,
        subjectName: mcq.subjectName,
        chapterTitle: mcq.chapterTitle,
        topicName: mcq.topicName,
        classLevel: mcq.classLevel,
        stream: mcq.stream,
        board: mcq.board,
        difficulty: diff,
        difficultySource: diffSource,
        questionType: mcq.questionType || "MCQ",
        provenanceType,
        provenanceNote,
        year: mcq.year,
        tags: mcq.tags,
        marks: mcq.marks || 1,
      });
    }
  }

  // 2. Process SEED_PYQS
  for (const pyq of SEED_PYQS) {
    if (classLevel && pyq.classLevel.toLowerCase() !== classLevel.toLowerCase()) continue;
    if (stream && pyq.stream && pyq.stream.toLowerCase() !== stream.toLowerCase()) continue;
    if (subjectName && subjectName !== "ALL" && !pyq.subjectName.toLowerCase().includes(subjectName.toLowerCase()) && !subjectName.toLowerCase().includes(pyq.subjectName.toLowerCase())) continue;
    if (chapterTitle && chapterTitle !== "ALL" && !pyq.chapterTitle.toLowerCase().includes(chapterTitle.toLowerCase())) continue;

    const validated = validatePYQProvenance(pyq);
    let provenanceType: QuestionProvenanceType = "SOURCE-REQUIRED";
    let provenanceNote = "Past examination question pending official gazette provenance verification.";

    if (validated.isVerifiedPyq && pyq.sourceType === "VERIFIED PYQ") {
      provenanceType = "VERIFIED HISTORICAL PYQ";
      provenanceNote = `Verified ${pyq.board || "Board"} ${pyq.year} examination paper (${pyq.paperCode || "Official"}).`;
    } else if (pyq.paperCode?.toUpperCase().includes("MODEL")) {
      provenanceType = "OFFICIAL MODEL PAPER";
      provenanceNote = `Official ${pyq.board || "BSEB"} ${pyq.year || "2026"} Model Paper pattern question. Not a historical PYQ.`;
    }

    let diff: "Easy" | "Medium" | "Hard" | "Unknown" = "Unknown";
    let diffSource: DifficultySource = "Unknown";
    if (pyq.difficulty === "Easy" || pyq.difficulty === "Medium" || pyq.difficulty === "Hard") {
      diff = pyq.difficulty;
      diffSource = "Source-provided";
    }

    if (!seenIds.has(pyq.id)) {
      seenIds.add(pyq.id);
      pool.push({
        id: pyq.id,
        questionText: pyq.questionText,
        explanation: pyq.answerSolution,
        answerSolution: pyq.answerSolution,
        subjectName: pyq.subjectName,
        chapterTitle: pyq.chapterTitle,
        topicName: pyq.topicName,
        classLevel: pyq.classLevel,
        stream: pyq.stream,
        board: pyq.board,
        difficulty: diff,
        difficultySource: diffSource,
        questionType: pyq.questionType,
        provenanceType,
        provenanceNote,
        year: pyq.year,
        marks: pyq.marks || 2,
      });
    }
  }

  // 3. Process SEED_PRACTICE_QUESTIONS
  for (const pr of SEED_PRACTICE_QUESTIONS) {
    if (classLevel && pr.classLevel.toLowerCase() !== classLevel.toLowerCase()) continue;
    if (stream && pr.stream && pr.stream.toLowerCase() !== stream.toLowerCase()) continue;
    if (subjectName && subjectName !== "ALL" && !pr.subjectName.toLowerCase().includes(subjectName.toLowerCase()) && !subjectName.toLowerCase().includes(pr.subjectName.toLowerCase())) continue;
    if (chapterTitle && chapterTitle !== "ALL" && !pr.chapterTitle.toLowerCase().includes(chapterTitle.toLowerCase())) continue;

    let provenanceType: QuestionProvenanceType = "SAMPLE PRACTICE";
    let provenanceNote = "Standard curriculum practice exercise.";

    if (pr.sourceType === "AI-GENERATED PRACTICE") {
      provenanceType = "APPLICATION-DERIVED PRACTICE";
      provenanceNote = "Application-derived drill problem.";
    }

    let diff: "Easy" | "Medium" | "Hard" | "Unknown" = "Unknown";
    let diffSource: DifficultySource = "Unknown";
    if (pr.difficulty === "Easy" || pr.difficulty === "Medium" || pr.difficulty === "Hard") {
      diff = pr.difficulty;
      diffSource = "Source-provided";
    }

    if (!seenIds.has(pr.id)) {
      seenIds.add(pr.id);
      pool.push({
        id: pr.id,
        questionText: pr.questionText,
        options: pr.options,
        correctOptionIndex: pr.correctOptionIndex,
        explanation: pr.answerSolution,
        answerSolution: pr.answerSolution,
        subjectName: pr.subjectName,
        chapterTitle: pr.chapterTitle,
        topicName: pr.topicName,
        classLevel: pr.classLevel,
        stream: pr.stream,
        board: pr.board,
        difficulty: diff,
        difficultySource: diffSource,
        questionType: pr.questionType,
        provenanceType,
        provenanceNote,
        year: pr.year,
        tags: pr.tags,
        marks: pr.marks || 2,
      });
    }
  }

  return pool;
}

// ---------------------------------------------------------------------------
// 3. ADAPTIVE QUESTION SCORING ENGINE (TRANSPARENT & EXPLAINABLE)
// ---------------------------------------------------------------------------

export function calculateAdaptiveQuestionScore(params: {
  question: AdaptiveQuestion;
  mode: PracticeMode;
  context: StudentAdaptiveContext;
  attemptHistory: StudentPracticeAttempt[];
}): AdaptiveScoreBreakdown {
  const { question, mode, context, attemptHistory } = params;

  const {
    enhancedMistakes = [],
    practiceSessions = [],
    revisions = [],
    p6Report = null,
  } = context;

  // 1. Topic Weakness Factor (0 - 35)
  let topicWeaknessFactor = 0;
  const chapPractices = practiceSessions.filter(
    (p) =>
      p.chapterTitle.toLowerCase() === question.chapterTitle.toLowerCase() ||
      p.subjectName.toLowerCase() === question.subjectName.toLowerCase()
  );
  if (chapPractices.length > 0) {
    const avgAcc =
      chapPractices.reduce((acc, p) => acc + (p.accuracyPercentage || 0), 0) /
      chapPractices.length;
    if (avgAcc < 50) topicWeaknessFactor = 35;
    else if (avgAcc < 65) topicWeaknessFactor = 25;
    else if (avgAcc < 80) topicWeaknessFactor = 12;
  } else {
    // Untested chapter
    topicWeaknessFactor = 15;
  }

  // 2. Mistake Recurrence Factor (0 - 30)
  let mistakeRecurrenceFactor = 0;
  const relatedMistakes = enhancedMistakes.filter(
    (m) =>
      m.chapterTitle.toLowerCase() === question.chapterTitle.toLowerCase() ||
      m.subjectName.toLowerCase() === question.subjectName.toLowerCase()
  );
  const unresolvedMistakes = relatedMistakes.filter((m) => m.lifecycleStatus !== "Corrected");
  const repeatedMistakes = relatedMistakes.filter((m) => m.lifecycleStatus === "Repeated");

  if (repeatedMistakes.length > 0) {
    mistakeRecurrenceFactor = 30;
  } else if (unresolvedMistakes.length > 0) {
    mistakeRecurrenceFactor = 20;
  }

  // 3. Revision Need Factor (0 - 20)
  let revisionNeedFactor = 0;
  const chapRevision = revisions.find(
    (r) => r.chapterTitle.toLowerCase() === question.chapterTitle.toLowerCase()
  );
  if (chapRevision && !chapRevision.completed) {
    revisionNeedFactor = 20;
  } else if (!chapRevision && chapPractices.length > 0) {
    revisionNeedFactor = 10;
  }

  // 4. Exam Strategy & Score Opportunity Factor (P6 Integration) (0 - 25)
  let examStrategyFactor = 0;
  if (p6Report) {
    const isTopRevision = p6Report.examRevisionPriorities.some(
      (p) => p.chapterTitle.toLowerCase() === question.chapterTitle.toLowerCase()
    );
    if (isTopRevision) examStrategyFactor += 15;

    // Align with marks loss category
    const lossCat = p6Report.marksLossAnalysis.primaryLossCategory.toLowerCase();
    if (
      lossCat.includes("calculation") &&
      (question.questionType === "Numerical" || question.tags?.includes("Calculation"))
    ) {
      examStrategyFactor += 10;
    } else if (
      lossCat.includes("concept") &&
      (question.questionType === "Conceptual" || question.questionType === "MCQ")
    ) {
      examStrategyFactor += 10;
    }
  }

  // 5. Coverage Gap Factor (0 - 15)
  let coverageGapFactor = 0;
  const questionAttempts = attemptHistory.filter((a) => a.questionId === question.id);
  const topicAttempts = attemptHistory.filter(
    (a) => a.chapterTitle.toLowerCase() === question.chapterTitle.toLowerCase()
  );
  if (questionAttempts.length === 0) {
    coverageGapFactor = topicAttempts.length === 0 ? 15 : 8;
  }

  // 6. Mastery State Factor (0 - 10)
  let masteryStateFactor = 5;
  const mastery = determineMasteryState({
    chapterId: question.chapterTitle,
    chapterTitle: question.chapterTitle,
    subjectId: question.subjectName,
    subjectName: question.subjectName,
    practiceAttempts: chapPractices.length,
    practiceAccuracyPct: chapPractices.length > 0 ? 60 : undefined,
    revisionCount: revisions.length,
  });
  if (mastery.stage === "Learning" || mastery.stage === "Practicing") {
    masteryStateFactor = 10;
  } else if (mastery.stage === "Strong") {
    masteryStateFactor = 2;
  }

  // Apply Mode-Specific Multipliers
  let mWeak = 1.0;
  let mMistake = 1.0;
  let mRev = 1.0;
  let mExam = 1.0;
  let mCov = 1.0;

  switch (mode) {
    case "WEAK_TOPIC":
      mWeak = 1.6;
      mMistake = 1.2;
      mRev = 0.8;
      break;
    case "MISTAKE_RECOVERY":
      mMistake = 2.0;
      mWeak = 1.2;
      break;
    case "REVISION_PRACTICE":
      mRev = 1.8;
      mWeak = 1.0;
      break;
    case "EXAM_STRATEGY":
      mExam = 1.8;
      mMistake = 1.3;
      break;
    case "QUICK_PRACTICE":
      mWeak = 1.2;
      mExam = 1.2;
      break;
    case "BALANCED":
    default:
      mCov = 1.3;
      break;
  }

  const finalWeak = Math.round(topicWeaknessFactor * mWeak);
  const finalMistake = Math.round(mistakeRecurrenceFactor * mMistake);
  const finalRev = Math.round(revisionNeedFactor * mRev);
  const finalExam = Math.round(examStrategyFactor * mExam);
  const finalCov = Math.round(coverageGapFactor * mCov);
  const finalMastery = masteryStateFactor;

  const totalAdaptiveScore =
    finalWeak + finalMistake + finalRev + finalExam + finalCov + finalMastery;

  // Build transparent reasons
  const reasons: string[] = [];
  if (finalMistake >= 20) {
    reasons.push(`${unresolvedMistakes.length} unresolved mistake(s) logged in this topic`);
  }
  if (finalWeak >= 20) {
    reasons.push("Topic accuracy below benchmark");
  }
  if (finalExam >= 15) {
    reasons.push("Ranked as an active P6 exam score recovery priority");
  }
  if (finalRev >= 15) {
    reasons.push("Syllabus revision due");
  }
  if (finalCov >= 10) {
    reasons.push("Coverage gap: unpracticed in recent sessions");
  }

  const selectionReason =
    reasons.length > 0 ? reasons.join(" • ") : "Curriculum maintenance and balanced coverage";

  const evidenceExplanation = `Adaptive Score: ${totalAdaptiveScore} (Weakness: ${finalWeak}, Mistakes: ${finalMistake}, Strategy: ${finalExam}, Revision: ${finalRev}, Coverage: ${finalCov})`;

  return {
    topicWeaknessFactor: finalWeak,
    mistakeRecurrenceFactor: finalMistake,
    revisionNeedFactor: finalRev,
    examStrategyFactor: finalExam,
    coverageGapFactor: finalCov,
    masteryStateFactor: finalMastery,
    totalAdaptiveScore,
    selectionReason,
    evidenceExplanation,
  };
}

// ---------------------------------------------------------------------------
// 4. ADAPTIVE SESSION BUILDER (10m, 20m, 30m, 45m OR CUSTOM)
// ---------------------------------------------------------------------------

export function buildAdaptivePracticeSession(params: {
  config: AdaptivePracticeSessionConfig;
  context: StudentAdaptiveContext;
  attemptHistory?: StudentPracticeAttempt[];
}): AdaptivePracticePlan {
  const { config, context, attemptHistory = [] } = params;
  const { durationMinutes, mode, subjectFilter, chapterFilter } = config;

  const pool = buildUnifiedAdaptiveQuestionPool({
    classLevel: context.student?.classLevel || "Class 12",
    stream: context.student?.stream || "Commerce",
    board: context.student?.board || "BSEB",
    subjectName: subjectFilter,
    chapterTitle: chapterFilter,
  });

  if (pool.length === 0) {
    return {
      sessionId: `sess-${Date.now()}`,
      mode,
      targetDurationMinutes: durationMinutes,
      totalQuestions: 0,
      mustPractice: [],
      shouldPractice: [],
      maintenance: [],
      allQuestions: [],
      focusSubjects: [],
      overallReason: "No questions found matching selected criteria in question repository.",
      honestDisclaimer: "Application-derived practice plan. Source-required if verified questions are unavailable.",
    };
  }

  // Score each question in the pool
  const scoredQuestions: AdaptiveSessionQuestion[] = pool.map((q) => {
    const scoreBreakdown = calculateAdaptiveQuestionScore({
      question: q,
      mode,
      context,
      attemptHistory,
    });

    const estMinutes =
      q.questionType === "MCQ" ? 1.5 : q.questionType === "Numerical" ? 4.0 : 3.0;

    let category: "Must Practice" | "Should Practice" | "Maintenance" = "Maintenance";
    if (scoreBreakdown.totalAdaptiveScore >= 60) {
      category = "Must Practice";
    } else if (scoreBreakdown.totalAdaptiveScore >= 35) {
      category = "Should Practice";
    }

    return {
      question: q,
      scoreBreakdown,
      category,
      estimatedTimeMinutes: estMinutes,
    };
  });

  // Sort descending by adaptive score
  scoredQuestions.sort(
    (a, b) => b.scoreBreakdown.totalAdaptiveScore - a.scoreBreakdown.totalAdaptiveScore
  );

  // Allocate questions based on session duration
  // 10m -> 4 questions; 20m -> 7 questions; 30m -> 10 questions; 45m -> 15 questions
  const targetQuestionCount =
    durationMinutes <= 10
      ? 4
      : durationMinutes <= 20
      ? 7
      : durationMinutes <= 30
      ? 10
      : durationMinutes <= 45
      ? 15
      : Math.min(25, Math.round(durationMinutes / 3));

  const selected = scoredQuestions.slice(0, targetQuestionCount);

  const mustPractice = selected.filter((q) => q.category === "Must Practice");
  const shouldPractice = selected.filter((q) => q.category === "Should Practice");
  const maintenance = selected.filter((q) => q.category === "Maintenance");

  const focusSubjects = Array.from(new Set(selected.map((q) => q.question.subjectName)));

  return {
    sessionId: `sess-${Date.now()}`,
    mode,
    targetDurationMinutes: durationMinutes,
    totalQuestions: selected.length,
    mustPractice,
    shouldPractice,
    maintenance,
    allQuestions: selected,
    focusSubjects,
    overallReason:
      mustPractice.length > 0
        ? `Targeted session concentrating on ${mustPractice.length} high-priority weak/mistake concepts.`
        : `Balanced practice sprint across ${focusSubjects.join(", ")}.`,
    honestDisclaimer:
      "Application-derived practice plan based on actual student performance signals. Does not guarantee future examination marks or official exam question appearances.",
  };
}

// ---------------------------------------------------------------------------
// 5. ADAPTIVE NEXT-QUESTION DECISION ENGINE
// ---------------------------------------------------------------------------

export function recommendNextAdaptiveQuestion(params: {
  lastAttempt: StudentPracticeAttempt;
  availableQuestions: AdaptiveQuestion[];
  completedQuestionIds: string[];
  context: StudentAdaptiveContext;
}): AdaptiveNextRecommendation {
  const { lastAttempt, availableQuestions, completedQuestionIds, context } = params;

  const remaining = availableQuestions.filter(
    (q) => !completedQuestionIds.includes(q.id) && q.id !== lastAttempt.questionId
  );

  if (remaining.length === 0) {
    return {
      nextQuestion: null,
      actionType: "COMPLETED",
      reason: "Session completed! All allocated questions attempted.",
    };
  }

  // 1. If previous attempt was INCORRECT:
  if (!lastAttempt.isCorrect) {
    // If Calculation error: find another numerical or calculation question on same topic/chapter
    if (lastAttempt.mistakeType === "Calculation error") {
      const calcSimilar = remaining.find(
        (q) =>
          q.chapterTitle.toLowerCase() === lastAttempt.chapterTitle.toLowerCase() &&
          (q.questionType === "Numerical" || q.tags?.includes("Calculation"))
      );
      if (calcSimilar) {
        return {
          nextQuestion: calcSimilar,
          actionType: "SIMILAR_CONCEPT",
          reason: `Next: another calculation drill on ${calcSimilar.chapterTitle} because the previous attempt was incorrect and flagged as Calculation error.`,
          similarityRelation: "Same concept",
        };
      }
    }

    // Try finding same topic or same chapter question
    const sameTopic = remaining.find(
      (q) =>
        q.chapterTitle.toLowerCase() === lastAttempt.chapterTitle.toLowerCase() &&
        q.topicName?.toLowerCase() === lastAttempt.topicName?.toLowerCase()
    );
    if (sameTopic) {
      return {
        nextQuestion: sameTopic,
        actionType: "SIMILAR_CONCEPT",
        reason: `Next: reinforcing ${sameTopic.chapterTitle} following an incorrect response.`,
        similarityRelation: "Same topic",
      };
    }

    const sameChapter = remaining.find(
      (q) => q.chapterTitle.toLowerCase() === lastAttempt.chapterTitle.toLowerCase()
    );
    if (sameChapter) {
      return {
        nextQuestion: sameChapter,
        actionType: "SIMILAR_CONCEPT",
        reason: `Next: additional practice on ${sameChapter.chapterTitle} to stabilize comprehension.`,
        similarityRelation: "Same chapter" as any,
      };
    }
  }

  // 2. If previous attempt was CORRECT:
  // Step up difficulty if same chapter has a Hard/Medium question
  if (lastAttempt.isCorrect && lastAttempt.difficulty === "Easy") {
    const harder = remaining.find(
      (q) =>
        q.chapterTitle.toLowerCase() === lastAttempt.chapterTitle.toLowerCase() &&
        (q.difficulty === "Medium" || q.difficulty === "Hard")
    );
    if (harder) {
      return {
        nextQuestion: harder,
        actionType: "STEP_UP_DIFFICULTY",
        reason: `Next: stepping up challenge to ${harder.difficulty} difficulty following correct answer.`,
        similarityRelation: "Similar difficulty",
      };
    }
  }

  // Default: take highest priority next available question
  const nextQ = remaining[0];
  return {
    nextQuestion: nextQ,
    actionType: "SWITCH_TOPIC",
    reason: `Next: moving to ${nextQ.subjectName} (${nextQ.chapterTitle}) for balanced coverage.`,
    similarityRelation: "Application-selected related question",
  };
}

// ---------------------------------------------------------------------------
// 6. PRACTICE ATTEMPT RECORDING & P5 MISTAKE INTELLIGENCE INTEGRATION
// ---------------------------------------------------------------------------

const ADAPTIVE_PRACTICE_KEY = "adaptive_practice_attempts";

export function loadStudentPracticeAttempts(profileId: string): StudentPracticeAttempt[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const key = getProfileKey(profileId, ADAPTIVE_PRACTICE_KEY);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStudentPracticeAttempts(
  profileId: string,
  attempts: StudentPracticeAttempt[]
): void {
  try {
    if (typeof localStorage === "undefined") return;
    const key = getProfileKey(profileId, ADAPTIVE_PRACTICE_KEY);
    localStorage.setItem(key, JSON.stringify(attempts.slice(-200)));
  } catch {
    // Graceful fallback
  }
}

export function recordAdaptivePracticeAttempt(params: {
  profileId: string;
  question: AdaptiveQuestion;
  isCorrect: boolean;
  selectedOption?: number;
  writtenAnswer?: string;
  timeSpentSeconds: number;
  attemptNumber?: number;
  mistakeType?: MistakeType;
  notes?: string;
  isOffline?: boolean;
}): {
  attempt: StudentPracticeAttempt;
  allAttempts: StudentPracticeAttempt[];
} {
  const {
    profileId,
    question,
    isCorrect,
    selectedOption,
    writtenAnswer,
    timeSpentSeconds,
    attemptNumber = 1,
    mistakeType = "Unclassified",
    notes,
    isOffline = false,
  } = params;

  const currentAttempts = loadStudentPracticeAttempts(profileId);

  const attempt: StudentPracticeAttempt = {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    profileId,
    questionId: question.id,
    subjectName: question.subjectName,
    chapterTitle: question.chapterTitle,
    topicName: question.topicName,
    questionType: question.questionType,
    difficulty: question.difficulty,
    isCorrect,
    selectedOption,
    writtenAnswer,
    timeSpentSeconds,
    attemptNumber,
    mistakeType: !isCorrect ? mistakeType : undefined,
    notes,
    timestamp: Date.now(),
  };

  const updatedAttempts = [attempt, ...currentAttempts];
  saveStudentPracticeAttempts(profileId, updatedAttempts);

  // P5 FEEDBACK:
  // If incorrect, log mistake into P5 Enhanced Mistakes
  if (!isCorrect) {
    const p5Mistakes = loadEnhancedMistakes(profileId);
    const existing = p5Mistakes.find((m) => m.questionText === question.questionText);

    if (existing) {
      logMistakeRetryAttempt(profileId, existing.id, false, notes);
    } else {
      // Create new mistake record in P5
      const newMistake: EnhancedMistakeRecord = {
        id: `mst-${Date.now()}`,
        profileId,
        subjectId: question.subjectName,
        subjectName: question.subjectName,
        chapterTitle: question.chapterTitle,
        questionText: question.questionText,
        studentAnswer: selectedOption !== undefined && question.options ? question.options[selectedOption] : (writtenAnswer || "Incorrect"),
        correctAnswer: question.correctOptionIndex !== undefined && question.options ? question.options[question.correctOptionIndex] : (question.answerSolution || "See explanation"),
        conceptExplanation: question.explanation || question.answerSolution,
        whyWrongNote: notes,
        mistakeCategory: mistakeType === "Calculation error" ? "calculation" : "conceptual",
        mistakeType: mistakeType,
        status: "pending_review",
        lifecycleStatus: "New",
        retryCount: 0,
        createdAt: Date.now(),
        markedForRevision: true,
        firstOccurrenceAt: Date.now(),
        latestOccurrenceAt: Date.now(),
        occurrenceCount: 1,
        correctionAttempts: 0,
        retryHistory: [],
      };
      saveEnhancedMistakes(profileId, [newMistake, ...p5Mistakes]);
    }
  } else if (attemptNumber > 1) {
    // Successful RETRY: update P5 mistake status to Corrected!
    const p5Mistakes = loadEnhancedMistakes(profileId);
    const existing = p5Mistakes.find((m) => m.questionText === question.questionText);
    if (existing) {
      logMistakeRetryAttempt(profileId, existing.id, true, notes);
    }
  }

  // Offline queue support
  if (isOffline) {
    enqueueOfflineAction({
      type: "UPDATE_ACADEMIC",
      entityName: "academic",
      action: "update",
      profileId,
      payload: {
        practiceAttempt: attempt,
      },
    });
  }

  return { attempt, allAttempts: updatedAttempts };
}

// ---------------------------------------------------------------------------
// 7. PRACTICE EFFECTIVENESS & ANALYTICS (NON-CAUSAL EVIDENCE)
// ---------------------------------------------------------------------------

export function calculatePracticeEffectiveness(params: {
  attempts: StudentPracticeAttempt[];
  enhancedMistakes: EnhancedMistakeRecord[];
}): PracticeEffectivenessMetrics {
  const { attempts, enhancedMistakes } = params;

  if (attempts.length === 0) {
    return {
      totalQuestionsAttempted: 0,
      accuracyPct: 0,
      retriesAttempted: 0,
      retriesSuccessful: 0,
      retryImprovementPct: 0,
      mistakesCorrectedCount: 0,
      repeatedMistakesAvoidedCount: 0,
      avgTimePerQuestionSeconds: 0,
      effectivenessSignal: "Not enough practice data yet.",
      honestStatement: "Complete practice sessions to observe performance trends.",
    };
  }

  const total = attempts.length;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const accuracyPct = Math.round((correctCount / total) * 100);

  const retries = attempts.filter((a) => a.attemptNumber > 1);
  const retriesSuccessful = retries.filter((a) => a.isCorrect).length;
  const retryImprovementPct =
    retries.length > 0 ? Math.round((retriesSuccessful / retries.length) * 100) : 0;

  const mistakesCorrectedCount = enhancedMistakes.filter(
    (m) => m.lifecycleStatus === "Corrected"
  ).length;
  const repeatedMistakesAvoidedCount = attempts.filter(
    (a) => a.attemptNumber > 1 && a.isCorrect
  ).length;

  const totalTime = attempts.reduce((acc, a) => acc + (a.timeSpentSeconds || 0), 0);
  const avgTimePerQuestionSeconds = Math.round(totalTime / total);

  let effectivenessSignal = "Practice activity recorded.";
  if (retriesSuccessful >= 2) {
    effectivenessSignal = `Improvement was observed after targeted retry practice (${retriesSuccessful} mistake retry drills resolved).`;
  } else if (accuracyPct >= 75) {
    effectivenessSignal = "High consistency observed across attempted curriculum topics.";
  } else {
    effectivenessSignal = "Practice in progress; maintain focus on unresolved mistake reviews.";
  }

  return {
    totalQuestionsAttempted: total,
    accuracyPct,
    retriesAttempted: retries.length,
    retriesSuccessful,
    retryImprovementPct,
    mistakesCorrectedCount,
    repeatedMistakesAvoidedCount,
    avgTimePerQuestionSeconds,
    effectivenessSignal,
    honestStatement:
      "Observed performance signal. Does not imply guaranteed future marks on board examinations.",
  };
}

// ---------------------------------------------------------------------------
// 8. COVERAGE INTELLIGENCE
// ---------------------------------------------------------------------------

export function analyzePracticeCoverage(params: {
  attempts: StudentPracticeAttempt[];
  classLevel?: string;
  stream?: string;
}): PracticeCoverageReport {
  const { attempts, classLevel = "Class 12", stream = "Commerce" } = params;

  const allSubjects = getAllCurriculumSubjects();
  const relevantSubjects = allSubjects.filter(
    (s) =>
      s.classLevel.toLowerCase() === classLevel.toLowerCase() &&
      (!s.stream || s.stream.toLowerCase() === stream.toLowerCase())
  );

  let totalTopics = 0;
  const untouched: string[] = [];
  const lowCoverageChaps: string[] = [];
  const practicedTopicNames = new Set(
    attempts.map((a) => a.topicName?.toLowerCase()).filter(Boolean)
  );
  const practicedChapters = new Set(attempts.map((a) => a.chapterTitle.toLowerCase()));

  for (const sub of relevantSubjects) {
    for (const ch of sub.chapters) {
      const chPracticed = practicedChapters.has(ch.title.toLowerCase());
      if (!chPracticed) {
        lowCoverageChaps.push(`${sub.name}: ${ch.title}`);
      }
      for (const top of ch.topics) {
        totalTopics++;
        if (!practicedTopicNames.has(top.name.toLowerCase())) {
          if (untouched.length < 15) {
            untouched.push(`${ch.title} - ${top.name}`);
          }
        }
      }
    }
  }

  const practicedCount = practicedTopicNames.size;
  const coveragePercentage =
    totalTopics > 0 ? Math.round((practicedCount / totalTopics) * 100) : 0;

  const unevenSubjectsAlerts: string[] = [];
  if (lowCoverageChaps.length > 5) {
    unevenSubjectsAlerts.push(
      `${lowCoverageChaps.length} chapters currently have low/zero recorded practice.`
    );
  }

  return {
    totalAvailableTopics: totalTopics,
    practicedTopicsCount: practicedCount,
    untouchedTopics: untouched,
    lowCoverageChapters: lowCoverageChaps.slice(0, 5),
    coveragePercentage,
    unevenSubjectsAlerts,
  };
}

// ---------------------------------------------------------------------------
// 9. QUESTION BANK QUALITY & DUPLICATE AUDIT
// ---------------------------------------------------------------------------

export function auditQuestionBankQuality(): QuestionQualityAuditResult {
  const pool = buildUnifiedAdaptiveQuestionPool();

  let validCount = 0;
  let missingMetadataCount = 0;
  const flagged: { id: string; issue: string }[] = [];
  const seenTexts = new Map<string, string>();
  let exactDuplicates = 0;
  let possibleDuplicates = 0;

  for (const q of pool) {
    const issues: string[] = [];
    if (!q.questionText || q.questionText.trim().length < 10) {
      issues.push("Question text too short or empty");
    }
    if (!q.subjectName) issues.push("Missing subjectName");
    if (!q.chapterTitle) issues.push("Missing chapterTitle");
    if (q.questionType === "MCQ" && (!q.options || q.options.length < 4)) {
      issues.push("MCQ with fewer than 4 options");
    }

    if (issues.length > 0) {
      missingMetadataCount++;
      flagged.push({ id: q.id, issue: issues.join(", ") });
    } else {
      validCount++;
    }

    // Duplicate detection
    const normalizedText = q.questionText.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seenTexts.has(normalizedText)) {
      exactDuplicates++;
    } else {
      seenTexts.set(normalizedText, q.id);
    }
  }

  return {
    totalQuestions: pool.length,
    validQuestionsCount: validCount,
    missingMetadataCount,
    flaggedRecords: flagged.slice(0, 10),
    duplicateAudit: {
      exactDuplicatesCount: exactDuplicates,
      possibleDuplicatesCount: possibleDuplicates,
      uniqueCount: pool.length - exactDuplicates,
    },
  };
}

// ---------------------------------------------------------------------------
// 10. P4 ADAPTIVE STUDY ACTION CONVERTER
// ---------------------------------------------------------------------------

export function convertPracticePlanToStudyActions(plan: AdaptivePracticePlan): {
  rank: 1 | 2 | 3;
  title: string;
  category: "Practice" | "Mistake Review" | "Revision";
  durationMinutes: number;
  reason: string;
}[] {
  const actions: {
    rank: 1 | 2 | 3;
    title: string;
    category: "Practice" | "Mistake Review" | "Revision";
    durationMinutes: number;
    reason: string;
  }[] = [];

  const topItems = plan.allQuestions.slice(0, 3);
  topItems.forEach((item, idx) => {
    const isMistake = item.scoreBreakdown.mistakeRecurrenceFactor >= 20;
    actions.push({
      rank: (idx + 1) as 1 | 2 | 3,
      title: `${Math.round(item.estimatedTimeMinutes * 5)}m Practice: ${item.question.chapterTitle}`,
      category: isMistake ? "Mistake Review" : "Practice",
      durationMinutes: Math.round(item.estimatedTimeMinutes * 5),
      reason: item.scoreBreakdown.selectionReason,
    });
  });

  return actions;
}
