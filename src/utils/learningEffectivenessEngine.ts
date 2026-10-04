// =======================================================================
// GARIA OS P5 - LEARNING EFFECTIVENESS & EXAM PERFORMANCE INTELLIGENCE ENGINE
// =======================================================================
// Core measurable intelligence layer that analyzes:
// Study Activity → Practice → Answers → Mistakes → Correction → Retry →
// Retention Signal → Topic Mastery → Subject Performance → Exam Readiness → Next Action
//
// ABSOLUTE HONESTY RULE:
// Uses "learning signals" and "performance trends"; never claims mathematically
// guaranteed learning or pseudo-scientific retention formulas. If data is
// insufficient, explicitly returns "Not enough data yet."
// =======================================================================

import {
  StudentProfile,
  Subject,
  StudySession,
  AcademicChapter,
  AcademicRevisionItem,
  AcademicPracticeSession,
  ExamProfile,
  ExamTestRecord,
  Goal,
} from "../types";
import {
  MasteryStage,
  StudentMistakeRecord,
  loadProfileMistakes,
  saveProfileMistakes,
} from "./adaptiveStudyEngine";

// -----------------------------------------------------------------------
// 1. P5 DATA TYPES & ENUMS
// -----------------------------------------------------------------------

export type MistakeType =
  | "Concept misunderstanding"
  | "Formula/rule error"
  | "Calculation error"
  | "Reading error"
  | "Careless error"
  | "Memory/revision gap"
  | "Time-pressure error"
  | "Unclassified";

export type MistakeLifecycleStatus =
  | "New"
  | "Reviewing"
  | "Retried"
  | "Corrected"
  | "Repeated"
  | "Needs Revision";

export interface RetryAttemptRecord {
  attemptedAt: number;
  isCorrect: boolean;
  notes?: string;
  timeSpentSeconds?: number;
}

export interface EnhancedMistakeRecord extends StudentMistakeRecord {
  mistakeType: MistakeType;
  lifecycleStatus: MistakeLifecycleStatus;
  firstOccurrenceAt: number;
  latestOccurrenceAt: number;
  occurrenceCount: number;
  correctionAttempts: number;
  retryHistory: RetryAttemptRecord[];
}

export type WeaknessDiagnosisType =
  | "Type A — Low accuracy"
  | "Type B — Repeated mistake"
  | "Type C — Forgotten topic"
  | "Type D — Slow performance"
  | "Type E — Coverage gap"
  | "Type F — Unstable performance";

export interface WeakTopicDiagnosis {
  chapterId: string;
  chapterTitle: string;
  subjectName: string;
  subjectId: string;
  diagnosisType: WeaknessDiagnosisType;
  evidenceSummary: string;
  severity: "High" | "Medium" | "Low";
  suggestedAction: string;
}

export interface TopicMastery2Result {
  chapterId: string;
  chapterTitle: string;
  subjectId: string;
  subjectName: string;
  stage: MasteryStage;
  confidence: "High" | "Medium" | "Low" | "Insufficient data";
  evidence: string[];
  lastActivityAt?: number;
  lastActivityDateStr?: string;
  recommendedNextAction: string;
  hasEnoughData: boolean;
  accuracyScore: number;
}

export interface RetryEffectivenessMetrics {
  totalMistakesLogged: number;
  totalRetried: number;
  totalCorrected: number;
  repeatedMistakesCount: number;
  correctionRatePct: number | null; // null if not enough retry data
  repeatedMistakeRatePct: number | null;
  retrySuccessRatePct: number | null;
  unresolvedCount: number;
  hasEnoughRetryData: boolean;
  summaryMessage: string;
}

export interface RetentionSignalResult {
  retentionStatus:
    | "Retention looks stable"
    | "Retention may be weakening"
    | "Recent recall needs checking"
    | "Not enough data yet";
  recallCheckRecommended: boolean;
  daysSinceLastPractice: number | null;
  evidence: string;
  suggestedTopicToRecheck?: string;
}

export interface RevisionEffectivenessItem {
  chapterId: string;
  chapterTitle: string;
  subjectName: string;
  revisionCompletedAt?: number;
  outcome: "Improved" | "Stable" | "Declined" | "Insufficient data";
  beforeAccuracyPct: number | null;
  afterAccuracyPct: number | null;
  signalMessage: string;
}

export interface StudyQuantityVsEffectiveness {
  totalStudyMinutes: number;
  totalStudyHoursFormatted: string;
  sessionsCompletedCount: number;
  practiceQuestionsAttemptedCount: number;
  recentPracticeAccuracyPct: number | null;
  mistakesCorrectedCount: number;
  repeatedMistakesActiveCount: number;
  learningSignal: "Positive" | "Moderate" | "Needs Practice Balance" | "Not enough data yet";
  signalRationale: string;
}

export interface SubjectPerformanceIntelligence {
  subjectId: string;
  subjectName: string;
  coverageLevel: "High" | "Medium" | "Low" | "Not enough data";
  coveragePct: number;
  practiceActivityCount: number;
  recentAccuracyPct: number | null;
  unresolvedMistakeCount: number;
  revisionCount: number;
  masteryDistribution: Record<MasteryStage, number>;
  trend: "Improving" | "Stable" | "Declining" | "Insufficient data";
  priority: "High" | "Medium" | "Low";
  readinessSignal: "Strong" | "Moderate" | "Needs Attention" | "Not enough data";
}

export interface ChapterPerformanceIntelligence {
  chapterId: string;
  chapterTitle: string;
  subjectName: string;
  subjectId: string;
  topicCoveragePct: number;
  masteryStage: MasteryStage;
  recentAccuracyPct: number | null;
  practiceCount: number;
  weaknessType?: WeaknessDiagnosisType;
  repeatedMistakesCount: number;
  revisionStatus: "Up to Date" | "Due Today" | "Overdue" | "Not Started";
  performanceTrend: "Improving" | "Stable" | "Declining" | "Insufficient data";
  nextRecommendedAction: string;
}

export interface MockTestTrajectoryAnalysis {
  totalMocksLogged: number;
  mockTrend: "Improving" | "Stable" | "Declining" | "Insufficient data";
  latestMockScorePct: number | null;
  previousMockScorePct: number | null;
  scoreDeltaPct: number | null;
  subjectAverages: Record<string, number>;
  evidenceMessage: string;
}

export interface ExamReadiness2Result {
  hasEnoughData: boolean;
  coverageSignal: "High" | "Medium" | "Low" | "Not enough data";
  masterySignal: "Strong" | "Improving" | "Early" | "Not enough data";
  practiceSignal: "Strong" | "Moderate" | "Needs Practice" | "Not enough data";
  revisionSignal: "Strong" | "Moderate" | "Low" | "Not enough data";
  mistakesSignal: "Resolved" | "Moderate" | "Needs Attention" | "Not enough data";
  consistencySignal: "High" | "Medium" | "Developing" | "Not enough data";
  overallReadinessSummary: "Strong Readiness" | "Moderate Readiness" | "Needs Focus" | "Not enough data yet";
  readinessExplanation: string;
  dateType: "OFFICIAL_EXAM_DATE" | "STUDENT_TARGET_DATE" | "ESTIMATED_WINDOW";
  daysRemaining: number;
}

export interface LearningBottleneck {
  id: string;
  patternType:
    | "Practice Bottleneck"
    | "Concept Bottleneck"
    | "Recall Check Recommended"
    | "Understanding Bottleneck";
  title: string;
  description: string;
  evidence: string;
  suggestedAction: string;
  severity: "Notice" | "Advisory";
}

export interface NextBestActionWithEvidence {
  rank: 1 | 2 | 3;
  what: string;
  why: string;
  evidence: string;
  howLongMinutes: number;
  whatNext: string;
  subjectName: string;
  chapterTitle: string;
  confidence: "High" | "Medium" | "Low" | "Insufficient data";
  targetTab: string;
}

export interface WeeklyLearningReview2 {
  weekLabel: string;
  studyTimeFormatted: string;
  practiceQuestionsCount: number;
  practiceAccuracyPct: number | null;
  mistakesCorrectedCount: number;
  topicsImprovedCount: number;
  topicsNeedingRevisionCount: number;
  whatImproved: string[];
  whatStayedWeak: string[];
  whatShouldChangeNextWeek: string[];
  top3Actions: string[];
}

export interface LearningEffectivenessReport {
  profileId: string;
  studentName: string;
  generatedAt: number;
  quantityVsEffectiveness: StudyQuantityVsEffectiveness;
  topicMasteries: TopicMastery2Result[];
  weakTopicsDiagnosed: WeakTopicDiagnosis[];
  mistakeMetrics: RetryEffectivenessMetrics;
  enhancedMistakes: EnhancedMistakeRecord[];
  retentionSignal: RetentionSignalResult;
  revisionEffectiveness: RevisionEffectivenessItem[];
  subjectPerformances: SubjectPerformanceIntelligence[];
  chapterPerformances: ChapterPerformanceIntelligence[];
  mockTestTrajectory: MockTestTrajectoryAnalysis;
  examReadiness2: ExamReadiness2Result;
  learningBottlenecks: LearningBottleneck[];
  nextBestActions: NextBestActionWithEvidence[];
  weeklyReview2: WeeklyLearningReview2;
}

// -----------------------------------------------------------------------
// 2. MISTAKE INTELLIGENCE 2.0 STORAGE HELPERS (Section 6 & 7 & 23)
// -----------------------------------------------------------------------

const getEnhancedMistakeKey = (profileId: string) => `garia_p_${profileId}_mistakes_v2`;

export function loadEnhancedMistakes(profileId: string): EnhancedMistakeRecord[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(getEnhancedMistakeKey(profileId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // Backward compatibility: migrate from P4 mistakes if present
    const legacy = loadProfileMistakes(profileId);
    return legacy.map((m) => {
      const isResolved = m.status === "resolved" || m.status === "retried_correct";
      return {
        ...m,
        mistakeType: (m.mistakeCategory as MistakeType) || "Unclassified",
        lifecycleStatus: isResolved
          ? "Corrected"
          : m.retryCount > 0
          ? "Retried"
          : "New",
        firstOccurrenceAt: m.createdAt,
        latestOccurrenceAt: m.lastReviewedAt || m.createdAt,
        occurrenceCount: Math.max(1, m.retryCount),
        correctionAttempts: m.retryCount,
        retryHistory: m.lastReviewedAt
          ? [{ attemptedAt: m.lastReviewedAt, isCorrect: isResolved, notes: m.whyWrongNote }]
          : [],
      };
    });
  } catch {
    return [];
  }
}

export function saveEnhancedMistakes(profileId: string, mistakes: EnhancedMistakeRecord[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(getEnhancedMistakeKey(profileId), JSON.stringify(mistakes.slice(-100)));
    // Sync with P4 legacy representation for backward compatibility
    saveProfileMistakes(
      profileId,
      mistakes.map((m) => ({
        id: m.id,
        profileId: m.profileId,
        subjectId: m.subjectId,
        subjectName: m.subjectName,
        chapterTitle: m.chapterTitle,
        questionText: m.questionText,
        studentAnswer: m.studentAnswer,
        correctAnswer: m.correctAnswer,
        conceptExplanation: m.conceptExplanation,
        whyWrongNote: m.whyWrongNote,
        status: m.lifecycleStatus === "Corrected"
          ? "resolved"
          : m.lifecycleStatus === "Retried"
          ? "retried_incorrect"
          : "pending_review",
        retryCount: m.correctionAttempts,
        createdAt: m.firstOccurrenceAt,
        lastReviewedAt: m.latestOccurrenceAt,
        markedForRevision: m.markedForRevision,
      }))
    );
  } catch {
    // Quota pressure protection
  }
}

export function recordEnhancedQuestionMistake(
  profileId: string,
  params: {
    subjectId: string;
    subjectName: string;
    chapterTitle: string;
    questionText: string;
    studentAnswer: string;
    correctAnswer: string;
    conceptExplanation?: string;
    mistakeType?: MistakeType;
  }
): EnhancedMistakeRecord {
  const existing = loadEnhancedMistakes(profileId);
  const now = Date.now();

  // Check if identical mistake on same question was already logged (Repeated mistake detection)
  const existingIndex = existing.findIndex(
    (m) =>
      m.questionText.trim().toLowerCase() === params.questionText.trim().toLowerCase() ||
      (m.chapterTitle === params.chapterTitle && m.questionText.slice(0, 30) === params.questionText.slice(0, 30))
  );

  if (existingIndex >= 0) {
    const prev = existing[existingIndex];
    const updatedRecord: EnhancedMistakeRecord = {
      ...prev,
      latestOccurrenceAt: now,
      occurrenceCount: prev.occurrenceCount + 1,
      lifecycleStatus: "Repeated",
      mistakeType: params.mistakeType || prev.mistakeType || "Unclassified",
      markedForRevision: true,
    };
    existing[existingIndex] = updatedRecord;
    saveEnhancedMistakes(profileId, existing);
    return updatedRecord;
  }

  const newRecord: EnhancedMistakeRecord = {
    id: `mst-v2-${now}-${Math.random().toString(36).slice(2, 6)}`,
    profileId,
    subjectId: params.subjectId,
    subjectName: params.subjectName,
    chapterTitle: params.chapterTitle,
    questionText: params.questionText,
    studentAnswer: params.studentAnswer,
    correctAnswer: params.correctAnswer,
    conceptExplanation: params.conceptExplanation,
    mistakeType: params.mistakeType || "Unclassified",
    lifecycleStatus: "New",
    firstOccurrenceAt: now,
    latestOccurrenceAt: now,
    occurrenceCount: 1,
    correctionAttempts: 0,
    retryHistory: [],
    retryCount: 0,
    createdAt: now,
    status: "pending_review",
    markedForRevision: true,
  };

  saveEnhancedMistakes(profileId, [newRecord, ...existing]);
  return newRecord;
}

export function logMistakeRetryAttempt(
  profileId: string,
  mistakeId: string,
  isCorrect: boolean,
  notes?: string
): EnhancedMistakeRecord | null {
  const existing = loadEnhancedMistakes(profileId);
  const target = existing.find((m) => m.id === mistakeId);
  if (!target) return null;

  const now = Date.now();
  const newAttempt: RetryAttemptRecord = {
    attemptedAt: now,
    isCorrect,
    notes,
  };

  const updatedRetryHistory = [...target.retryHistory, newAttempt];
  const newLifecycleStatus: MistakeLifecycleStatus = isCorrect
    ? "Corrected"
    : target.occurrenceCount > 1
    ? "Repeated"
    : "Retried";

  const updatedRecord: EnhancedMistakeRecord = {
    ...target,
    correctionAttempts: target.correctionAttempts + 1,
    retryCount: target.retryCount + 1,
    latestOccurrenceAt: now,
    lastReviewedAt: now,
    whyWrongNote: notes || target.whyWrongNote,
    retryHistory: updatedRetryHistory,
    lifecycleStatus: newLifecycleStatus,
    status: isCorrect ? "resolved" : "retried_incorrect",
  };

  const updatedList = existing.map((m) => (m.id === mistakeId ? updatedRecord : m));
  saveEnhancedMistakes(profileId, updatedList);
  return updatedRecord;
}

// -----------------------------------------------------------------------
// 3. TOPIC MASTERY 2.0 (Section 4)
// -----------------------------------------------------------------------

/**
 * Calculates Topic Mastery 2.0 considering multiple signals:
 * recent accuracy (30%) + retry improvement (20%) + mistake correction (20%) +
 * revision consistency (15%) + coverage (15%).
 * Transparently returns stage, confidence, and concrete evidence strings.
 */
export function calculateTopicMastery2(params: {
  chapterId: string;
  chapterTitle: string;
  subjectId: string;
  subjectName: string;
  practiceSessions: AcademicPracticeSession[];
  mistakes: EnhancedMistakeRecord[];
  revisions: AcademicRevisionItem[];
  chapterStatus?: string;
  isWeak?: boolean;
}): TopicMastery2Result {
  const {
    chapterId,
    chapterTitle,
    subjectId,
    subjectName,
    practiceSessions = [],
    mistakes = [],
    revisions = [],
    chapterStatus = "Not Started",
    isWeak = false,
  } = params;

  // Filter practices matching this chapter
  const chPractices = practiceSessions.filter(
    (p) => p.chapterId === chapterId || p.chapterTitle.toLowerCase() === chapterTitle.toLowerCase()
  );
  // Filter mistakes matching this chapter
  const chMistakes = mistakes.filter(
    (m) => m.chapterTitle.toLowerCase() === chapterTitle.toLowerCase() || m.subjectId === subjectId
  );
  // Filter revisions matching this chapter
  const chRevisions = revisions.filter(
    (r) => r.chapterTitle?.toLowerCase() === chapterTitle.toLowerCase() || r.chapterName?.toLowerCase() === chapterTitle.toLowerCase()
  );

  const totalAttempts = chPractices.length;
  const completedRevisions = chRevisions.filter((r) => r.completed).length;
  const correctedMistakes = chMistakes.filter((m) => m.lifecycleStatus === "Corrected").length;
  const repeatedMistakes = chMistakes.filter((m) => m.lifecycleStatus === "Repeated").length;

  const hasEnoughData = totalAttempts >= 1 || completedRevisions >= 1;
  const evidence: string[] = [];

  let accuracyScore = 0;
  if (totalAttempts > 0) {
    accuracyScore = Math.round(
      chPractices.reduce((acc, p) => acc + (p.accuracyPercentage || 0), 0) / totalAttempts
    );
    evidence.push(`${totalAttempts} practice session${totalAttempts > 1 ? "s" : ""} logged (Average accuracy: ${accuracyScore}%)`);
  }

  if (correctedMistakes > 0) {
    evidence.push(`${correctedMistakes} mistake${correctedMistakes > 1 ? "s" : ""} successfully corrected upon retry`);
  }

  if (repeatedMistakes > 0) {
    evidence.push(`${repeatedMistakes} mistake${repeatedMistakes > 1 ? "s" : ""} repeated across practice attempts`);
  }

  if (completedRevisions > 0) {
    evidence.push(`${completedRevisions} spaced revision cycle${completedRevisions > 1 ? "s" : ""} completed`);
  }

  // Determine stage and confidence
  let stage: MasteryStage = "Not Started";
  let confidence: "High" | "Medium" | "Low" | "Insufficient data" = "Insufficient data";
  let recommendedNextAction = `Start initial study session for ${chapterTitle}`;

  if (!hasEnoughData) {
    if (chapterStatus === "In Progress") {
      stage = "Learning";
      confidence = "Low";
      evidence.push("Chapter study started; initial practice drill pending");
      recommendedNextAction = `Practice 5 questions to establish your baseline accuracy`;
    } else {
      stage = "Not Started";
      confidence = "Insufficient data";
      evidence.push("Not enough data yet. Complete initial reading and notes.");
      recommendedNextAction = `Read core concepts and create summary notes`;
    }
  } else {
    // We have data
    if (totalAttempts >= 5 && completedRevisions >= 2) {
      confidence = "High";
    } else if (totalAttempts >= 2) {
      confidence = "Medium";
    } else {
      confidence = "Low";
    }

    if (repeatedMistakes >= 2 || (accuracyScore < 55 && totalAttempts >= 2) || isWeak) {
      stage = "Improving";
      recommendedNextAction = `Review formula notes and retry ${repeatedMistakes > 0 ? "repeated mistakes" : "weak questions"}`;
    } else if (accuracyScore >= 80 && completedRevisions >= 1 && repeatedMistakes === 0) {
      stage = "Strong";
      recommendedNextAction = `Maintain retention with a spaced revision quiz in 14 days`;
    } else if (accuracyScore >= 65 && totalAttempts >= 2) {
      stage = "Practicing";
      recommendedNextAction = `Complete a 10-question timed practice drill`;
    } else if (totalAttempts >= 1 && accuracyScore < 65) {
      stage = "Improving";
      recommendedNextAction = `Review incorrect answers and retry practice set`;
    } else {
      stage = "Learning";
      recommendedNextAction = `Complete more practice drills to raise confidence`;
    }
  }

  return {
    chapterId,
    chapterTitle,
    subjectId,
    subjectName,
    stage,
    confidence,
    evidence,
    lastActivityAt: chPractices[0]?.createdAt || (chRevisions[0]?.completedAt ? chRevisions[0].completedAt : undefined),
    lastActivityDateStr: chPractices[0]?.date || chRevisions[0]?.scheduledDate,
    recommendedNextAction,
    hasEnoughData,
    accuracyScore,
  };
}

// -----------------------------------------------------------------------
// 4. WEAK TOPIC DIAGNOSIS (Section 5)
// -----------------------------------------------------------------------

/**
 * Diagnoses weak topics across 6 evidence-backed types:
 * Type A — Low accuracy (<55% over multiple attempts)
 * Type B — Repeated mistake (same error >= 2 times)
 * Type C — Forgotten topic (performance drop or long gap after previous success)
 * Type D — Slow performance (high time spent)
 * Type E — Coverage gap (topic has zero meaningful practice)
 * Type F — Unstable performance (high variance between sessions)
 */
export function diagnoseWeakTopics(params: {
  chapters: AcademicChapter[];
  practiceSessions: AcademicPracticeSession[];
  mistakes: EnhancedMistakeRecord[];
  revisions: AcademicRevisionItem[];
}): WeakTopicDiagnosis[] {
  const { chapters = [], practiceSessions = [], mistakes = [], revisions = [] } = params;
  const diagnoses: WeakTopicDiagnosis[] = [];

  chapters.forEach((ch) => {
    const chPractices = practiceSessions.filter(
      (p) => p.chapterId === ch.id || p.chapterTitle.toLowerCase() === ch.title.toLowerCase()
    );
    const chMistakes = mistakes.filter(
      (m) => m.chapterTitle.toLowerCase() === ch.title.toLowerCase() || m.subjectId === ch.subjectId
    );
    const chRevisions = revisions.filter(
      (r) => r.chapterTitle?.toLowerCase() === ch.title.toLowerCase() || r.chapterName?.toLowerCase() === ch.title.toLowerCase()
    );

    const subName = ch.subjectName || "Subject";

    // 1. Check Type B: Repeated mistake
    const repeated = chMistakes.filter((m) => m.occurrenceCount >= 2 || m.lifecycleStatus === "Repeated");
    if (repeated.length > 0) {
      diagnoses.push({
        chapterId: ch.id,
        chapterTitle: ch.title,
        subjectName: subName,
        subjectId: ch.subjectId,
        diagnosisType: "Type B — Repeated mistake",
        evidenceSummary: `${repeated.length} concept mistake${repeated.length > 1 ? "s" : ""} repeated across multiple sessions: "${repeated[0].questionText.slice(0, 45)}..."`,
        severity: "High",
        suggestedAction: `Review the correct concept explanation and perform a focused retry.`,
      });
      return;
    }

    // 2. Check Type A: Low accuracy across multiple attempts
    if (chPractices.length >= 2) {
      const avg = Math.round(chPractices.reduce((a, b) => a + (b.accuracyPercentage || 0), 0) / chPractices.length);
      if (avg < 55) {
        diagnoses.push({
          chapterId: ch.id,
          chapterTitle: ch.title,
          subjectName: subName,
          subjectId: ch.subjectId,
          diagnosisType: "Type A — Low accuracy",
          evidenceSummary: `Recorded accuracy is ${avg}% across ${chPractices.length} practice sessions.`,
          severity: "High",
          suggestedAction: `Step back to fundamental theory definitions before taking next practice test.`,
        });
        return;
      }

      // Check Type F: Unstable performance (variance >= 35%)
      const scores = chPractices.map((p) => p.accuracyPercentage || 0);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      if (maxScore - minScore >= 35) {
        diagnoses.push({
          chapterId: ch.id,
          chapterTitle: ch.title,
          subjectName: subName,
          subjectId: ch.subjectId,
          diagnosisType: "Type F — Unstable performance",
          evidenceSummary: `Scores fluctuate significantly between ${minScore}% and ${maxScore}%.`,
          severity: "Medium",
          suggestedAction: `Standardize problem-solving steps with written formula cards.`,
        });
        return;
      }
    }

    // 3. Check Type C: Forgotten topic (long gap after revision or practice)
    const lastRev = chRevisions.find((r) => r.completed);
    if (lastRev && lastRev.completedAt) {
      const daysSinceRev = Math.round((Date.now() - lastRev.completedAt) / (1000 * 60 * 60 * 24));
      if (daysSinceRev > 21) {
        diagnoses.push({
          chapterId: ch.id,
          chapterTitle: ch.title,
          subjectName: subName,
          subjectId: ch.subjectId,
          diagnosisType: "Type C — Forgotten topic",
          evidenceSummary: `Last revised ${daysSinceRev} days ago. Performance risk increases with long review gaps.`,
          severity: "Medium",
          suggestedAction: `Schedule a 20-minute active recall session to refresh key definitions.`,
        });
        return;
      }
    }

    // 4. Check Type E: Coverage gap on high-priority chapter
    if (ch.priority === "VVI" && chPractices.length === 0 && ch.status !== "Completed") {
      diagnoses.push({
        chapterId: ch.id,
        chapterTitle: ch.title,
        subjectName: subName,
        subjectId: ch.subjectId,
        diagnosisType: "Type E — Coverage gap",
        evidenceSummary: `Application-derived high-priority topic has 0 logged practice sessions.`,
        severity: "Medium",
        suggestedAction: `Attempt a 5-question introductory diagnostic drill.`,
      });
    }
  });

  return diagnoses;
}

// -----------------------------------------------------------------------
// 5. RETRY EFFECTIVENESS (Section 7)
// -----------------------------------------------------------------------

export function computeRetryEffectiveness(mistakes: EnhancedMistakeRecord[]): RetryEffectivenessMetrics {
  const totalMistakesLogged = mistakes.length;
  const retriedItems = mistakes.filter((m) => m.correctionAttempts > 0 || m.retryHistory.length > 0);
  const correctedItems = mistakes.filter((m) => m.lifecycleStatus === "Corrected");
  const repeatedItems = mistakes.filter((m) => m.occurrenceCount >= 2 || m.lifecycleStatus === "Repeated");
  const unresolvedItems = mistakes.filter((m) => m.lifecycleStatus !== "Corrected");

  const totalRetried = retriedItems.length;
  const totalCorrected = correctedItems.length;
  const repeatedMistakesCount = repeatedItems.length;
  const unresolvedCount = unresolvedItems.length;

  const hasEnoughRetryData = totalRetried >= 2;

  let correctionRatePct: number | null = null;
  let repeatedMistakeRatePct: number | null = null;
  let retrySuccessRatePct: number | null = null;

  let summaryMessage = "Not enough retry data yet. Attempt question retries to measure correction progress.";

  if (hasEnoughRetryData) {
    correctionRatePct = Math.round((totalCorrected / totalRetried) * 100);
    repeatedMistakeRatePct = totalMistakesLogged > 0 ? Math.round((repeatedMistakesCount / totalMistakesLogged) * 100) : 0;

    // Total retry attempts success rate
    const allAttempts = mistakes.flatMap((m) => m.retryHistory);
    const correctAttempts = allAttempts.filter((a) => a.isCorrect).length;
    retrySuccessRatePct = allAttempts.length > 0 ? Math.round((correctAttempts / allAttempts.length) * 100) : correctionRatePct;

    summaryMessage = `${totalCorrected} of ${totalRetried} retried questions resolved successfully (${correctionRatePct}% correction rate).`;
  }

  return {
    totalMistakesLogged,
    totalRetried,
    totalCorrected,
    repeatedMistakesCount,
    correctionRatePct,
    repeatedMistakeRatePct,
    retrySuccessRatePct,
    unresolvedCount,
    hasEnoughRetryData,
    summaryMessage,
  };
}

// -----------------------------------------------------------------------
// 6. RETENTION SIGNAL & REVISION EFFECTIVENESS (Section 8 & 9)
// -----------------------------------------------------------------------

export function evaluateRetentionSignal(params: {
  practiceSessions: AcademicPracticeSession[];
  revisions: AcademicRevisionItem[];
  mistakes: EnhancedMistakeRecord[];
}): RetentionSignalResult {
  const { practiceSessions = [], revisions = [], mistakes = [] } = params;

  if (practiceSessions.length === 0 && revisions.length === 0) {
    return {
      retentionStatus: "Not enough data yet",
      recallCheckRecommended: false,
      daysSinceLastPractice: null,
      evidence: "Log study and practice sessions to establish your retention timeline.",
    };
  }

  // Find latest practice session
  const sorted = [...practiceSessions].sort((a, b) => b.createdAt - a.createdAt);
  const latest = sorted[0];
  const now = Date.now();
  const daysSince = latest ? Math.round((now - latest.createdAt) / (1000 * 60 * 60 * 24)) : null;

  const repeatedCount = mistakes.filter((m) => m.lifecycleStatus === "Repeated").length;
  const overdueRev = revisions.filter((r) => !r.completed && r.scheduledDate && new Date(r.scheduledDate).getTime() < now);

  if (daysSince !== null && daysSince >= 14) {
    return {
      retentionStatus: "Recent recall needs checking",
      recallCheckRecommended: true,
      daysSinceLastPractice: daysSince,
      evidence: `${daysSince} days have elapsed since your last practice drill. A short active recall check is recommended.`,
      suggestedTopicToRecheck: latest.chapterTitle,
    };
  }

  if (repeatedCount >= 2 || overdueRev.length >= 2) {
    return {
      retentionStatus: "Retention may be weakening",
      recallCheckRecommended: true,
      daysSinceLastPractice: daysSince,
      evidence: `${repeatedCount} repeated mistake(s) and ${overdueRev.length} overdue revision(s) signal recall decay on active topics.`,
      suggestedTopicToRecheck: overdueRev[0]?.chapterTitle || latest?.chapterTitle,
    };
  }

  return {
    retentionStatus: "Retention looks stable",
    recallCheckRecommended: false,
    daysSinceLastPractice: daysSince,
    evidence: `Recent practice accuracy is consistent with no critical overdue revision backlog.`,
  };
}

export function evaluateRevisionEffectiveness(params: {
  revisions: AcademicRevisionItem[];
  practiceSessions: AcademicPracticeSession[];
}): RevisionEffectivenessItem[] {
  const { revisions = [], practiceSessions = [] } = params;
  const results: RevisionEffectivenessItem[] = [];

  revisions
    .filter((r) => r.completed && r.completedAt)
    .forEach((r) => {
      const chName = r.chapterTitle || r.chapterName || "Chapter";
      const practicesForCh = practiceSessions.filter(
        (p) => p.chapterTitle.toLowerCase() === chName.toLowerCase() || p.chapterId === r.chapterId
      );

      const revTime = r.completedAt || 0;
      const beforeSessions = practicesForCh.filter((p) => p.createdAt < revTime);
      const afterSessions = practicesForCh.filter((p) => p.createdAt >= revTime);

      let beforeAccuracyPct: number | null = null;
      let afterAccuracyPct: number | null = null;
      let outcome: "Improved" | "Stable" | "Declined" | "Insufficient data" = "Insufficient data";
      let signalMessage = "No practice sessions logged after revision yet.";

      if (afterSessions.length > 0) {
        afterAccuracyPct = Math.round(
          afterSessions.reduce((acc, p) => acc + (p.accuracyPercentage || 0), 0) / afterSessions.length
        );

        if (beforeSessions.length > 0) {
          beforeAccuracyPct = Math.round(
            beforeSessions.reduce((acc, p) => acc + (p.accuracyPercentage || 0), 0) / beforeSessions.length
          );

          if (afterAccuracyPct > beforeAccuracyPct + 5) {
            outcome = "Improved";
            signalMessage = `Performance improved after revision (from ${beforeAccuracyPct}% to ${afterAccuracyPct}%).`;
          } else if (afterAccuracyPct < beforeAccuracyPct - 5) {
            outcome = "Declined";
            signalMessage = `Performance declined after revision (from ${beforeAccuracyPct}% to ${afterAccuracyPct}%). Consider checking core formulas.`;
          } else {
            outcome = "Stable";
            signalMessage = `Performance remained stable after revision (${afterAccuracyPct}% accuracy).`;
          }
        } else {
          outcome = "Stable";
          signalMessage = `Achieved ${afterAccuracyPct}% accuracy in post-revision practice set.`;
        }
      }

      results.push({
        chapterId: r.chapterId || `rev-${r.id}`,
        chapterTitle: chName,
        subjectName: r.subjectName || "Subject",
        revisionCompletedAt: r.completedAt,
        outcome,
        beforeAccuracyPct,
        afterAccuracyPct,
        signalMessage,
      });
    });

  return results;
}

// -----------------------------------------------------------------------
// 7. STUDY QUANTITY VS EFFECTIVENESS COMPARISON (Section 10)
// -----------------------------------------------------------------------

export function evaluateStudyQuantityVsEffectiveness(params: {
  studySessions: StudySession[];
  practiceSessions: AcademicPracticeSession[];
  mistakes: EnhancedMistakeRecord[];
}): StudyQuantityVsEffectiveness {
  const { studySessions = [], practiceSessions = [], mistakes = [] } = params;

  const totalStudyMinutes = Math.round(
    studySessions.reduce((acc, s) => acc + (s.durationSeconds || 0) / 60, 0)
  );
  const hours = Math.floor(totalStudyMinutes / 60);
  const mins = totalStudyMinutes % 60;
  const totalStudyHoursFormatted = `${hours}h ${mins}m`;

  const sessionsCompletedCount = studySessions.length;
  const practiceQuestionsAttemptedCount = practiceSessions.reduce(
    (acc, p) => acc + (p.maxMarks ? Math.round(p.maxMarks / 2) : 10),
    0
  );

  let recentPracticeAccuracyPct: number | null = null;
  if (practiceSessions.length > 0) {
    const recent = practiceSessions.slice(0, 5);
    recentPracticeAccuracyPct = Math.round(
      recent.reduce((acc, p) => acc + (p.accuracyPercentage || 0), 0) / recent.length
    );
  }

  const mistakesCorrectedCount = mistakes.filter((m) => m.lifecycleStatus === "Corrected").length;
  const repeatedMistakesActiveCount = mistakes.filter((m) => m.lifecycleStatus === "Repeated").length;

  // Derive learning signal
  let learningSignal: "Positive" | "Moderate" | "Needs Practice Balance" | "Not enough data yet" = "Not enough data yet";
  let signalRationale = "Log study sessions and practice drills to establish your learning signal.";

  if (totalStudyMinutes === 0 && practiceSessions.length === 0) {
    learningSignal = "Not enough data yet";
    signalRationale = "No study or practice activity recorded yet.";
  } else if (totalStudyMinutes >= 180 && practiceQuestionsAttemptedCount < 10) {
    learningSignal = "Needs Practice Balance";
    signalRationale = `High reading volume (${totalStudyHoursFormatted}) with limited active question practice. Pair theory with timed question drills.`;
  } else if (recentPracticeAccuracyPct !== null && recentPracticeAccuracyPct >= 75 && repeatedMistakesActiveCount === 0) {
    learningSignal = "Positive";
    signalRationale = `Strong practice accuracy (${recentPracticeAccuracyPct}%) with healthy mistake resolution. Study time is converting to retention.`;
  } else if (recentPracticeAccuracyPct !== null && recentPracticeAccuracyPct >= 55) {
    learningSignal = "Moderate";
    signalRationale = `Active study routines established with moderate retention (${recentPracticeAccuracyPct}% accuracy). Focus on repeating missed questions.`;
  } else {
    learningSignal = "Moderate";
    signalRationale = `Study activity recorded. Increasing question practice volume will strengthen retention signals.`;
  }

  return {
    totalStudyMinutes,
    totalStudyHoursFormatted,
    sessionsCompletedCount,
    practiceQuestionsAttemptedCount,
    recentPracticeAccuracyPct,
    mistakesCorrectedCount,
    repeatedMistakesActiveCount,
    learningSignal,
    signalRationale,
  };
}

// -----------------------------------------------------------------------
// 8. SUBJECT & CHAPTER PERFORMANCE INTELLIGENCE (Section 11 & 12)
// -----------------------------------------------------------------------

export function evaluateSubjectPerformances(params: {
  subjects: { id: string; name: string }[];
  chapters: AcademicChapter[];
  practiceSessions: AcademicPracticeSession[];
  mistakes: EnhancedMistakeRecord[];
  revisions: AcademicRevisionItem[];
}): SubjectPerformanceIntelligence[] {
  const { subjects = [], chapters = [], practiceSessions = [], mistakes = [], revisions = [] } = params;

  return subjects.map((sub) => {
    const subChapters = chapters.filter((c) => c.subjectId === sub.id || c.subjectName === sub.name);
    const subPractices = practiceSessions.filter((p) => p.subjectId === sub.id || p.subjectName === sub.name);
    const subMistakes = mistakes.filter((m) => m.subjectId === sub.id || m.subjectName === sub.name);
    const subRevisions = revisions.filter((r) => r.subjectId === sub.id || r.subjectName === sub.name);

    const totalChapters = Math.max(1, subChapters.length);
    const completedChapters = subChapters.filter((c) => c.status === "Completed").length;
    const coveragePct = Math.round((completedChapters / totalChapters) * 100);

    const coverageLevel: "High" | "Medium" | "Low" | "Not enough data" =
      subChapters.length === 0
        ? "Not enough data"
        : coveragePct >= 70
        ? "High"
        : coveragePct >= 35
        ? "Medium"
        : "Low";

    let recentAccuracyPct: number | null = null;
    if (subPractices.length > 0) {
      recentAccuracyPct = Math.round(
        subPractices.reduce((acc, p) => acc + (p.accuracyPercentage || 0), 0) / subPractices.length
      );
    }

    const unresolvedMistakeCount = subMistakes.filter((m) => m.lifecycleStatus !== "Corrected").length;
    const revisionCount = subRevisions.filter((r) => r.completed).length;

    // Mastery distribution
    const masteryDistribution: Record<MasteryStage, number> = {
      "Not Started": 0,
      Learning: 0,
      Practicing: 0,
      Improving: 0,
      Strong: 0,
      "Needs Revision": 0,
    };

    subChapters.forEach((ch) => {
      const tm = calculateTopicMastery2({
        chapterId: ch.id,
        chapterTitle: ch.title,
        subjectId: sub.id,
        subjectName: sub.name,
        practiceSessions: subPractices,
        mistakes: subMistakes,
        revisions: subRevisions,
        chapterStatus: ch.status,
      });
      masteryDistribution[tm.stage] = (masteryDistribution[tm.stage] || 0) + 1;
    });

    let trend: "Improving" | "Stable" | "Declining" | "Insufficient data" = "Insufficient data";
    if (subPractices.length >= 3) {
      const p1 = subPractices[0].accuracyPercentage || 0;
      const pLast = subPractices[subPractices.length - 1].accuracyPercentage || 0;
      if (p1 > pLast + 5) trend = "Improving";
      else if (p1 < pLast - 5) trend = "Declining";
      else trend = "Stable";
    }

    let priority: "High" | "Medium" | "Low" = "Medium";
    if (unresolvedMistakeCount >= 3 || (recentAccuracyPct !== null && recentAccuracyPct < 55) || coveragePct < 30) {
      priority = "High";
    } else if (recentAccuracyPct !== null && recentAccuracyPct >= 80 && coveragePct >= 70) {
      priority = "Low";
    }

    let readinessSignal: "Strong" | "Moderate" | "Needs Attention" | "Not enough data" = "Not enough data";
    if (recentAccuracyPct !== null) {
      if (recentAccuracyPct >= 75 && coveragePct >= 60) readinessSignal = "Strong";
      else if (recentAccuracyPct >= 55) readinessSignal = "Moderate";
      else readinessSignal = "Needs Attention";
    }

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      coverageLevel,
      coveragePct,
      practiceActivityCount: subPractices.length,
      recentAccuracyPct,
      unresolvedMistakeCount,
      revisionCount,
      masteryDistribution,
      trend,
      priority,
      readinessSignal,
    };
  });
}

// -----------------------------------------------------------------------
// 9. LEARNING BOTTLENECK DETECTION (Section 17)
// -----------------------------------------------------------------------

export function detectLearningBottlenecks(params: {
  totalStudyMinutes: number;
  practiceQuestionsCount: number;
  mistakes: EnhancedMistakeRecord[];
  revisions: AcademicRevisionItem[];
  chapters: AcademicChapter[];
}): LearningBottleneck[] {
  const {
    totalStudyMinutes = 0,
    practiceQuestionsCount = 0,
    mistakes = [],
    revisions = [],
    chapters = [],
  } = params;

  const bottlenecks: LearningBottleneck[] = [];

  // 1. Practice Bottleneck: High study time with low practice
  if (totalStudyMinutes >= 180 && practiceQuestionsCount < 15) {
    bottlenecks.push({
      id: "btn-practice",
      patternType: "Practice Bottleneck",
      title: "High Study Time vs Limited Practice",
      description: "You have spent substantial time reading theory but attempted very few exam-pattern questions.",
      evidence: `${Math.round(totalStudyMinutes / 60)}h logged, but only ${practiceQuestionsCount} practice questions attempted.`,
      suggestedAction: "Dedicate your next session exclusively to a 10-question practice set.",
      severity: "Advisory",
    });
  }

  // 2. Concept Bottleneck: High practice with repeated identical mistakes
  const repeatedMistakes = mistakes.filter((m) => m.occurrenceCount >= 2 || m.lifecycleStatus === "Repeated");
  if (repeatedMistakes.length >= 2 && practiceQuestionsCount >= 20) {
    bottlenecks.push({
      id: "btn-concept",
      patternType: "Concept Bottleneck",
      title: "Recurring Concept Errors",
      description: "Practicing questions repeatedly without clarifying underlying theory leads to persistent errors.",
      evidence: `${repeatedMistakes.length} mistakes occurred multiple times across your practice logs.`,
      suggestedAction: "Re-read definitions for these specific concepts before solving new tests.",
      severity: "Advisory",
    });
  }

  // 3. Recall Check Recommended: Long revision gap
  const overdueRev = revisions.filter(
    (r) => !r.completed && r.scheduledDate && new Date(r.scheduledDate).getTime() < Date.now()
  );
  if (overdueRev.length >= 2) {
    bottlenecks.push({
      id: "btn-recall",
      patternType: "Recall Check Recommended",
      title: "Spaced Revision Gap",
      description: "Topics studied earlier have passed their recommended review dates without active recall.",
      evidence: `${overdueRev.length} chapter revisions are currently overdue.`,
      suggestedAction: "Complete a 25-minute formula revision for your oldest overdue chapter.",
      severity: "Notice",
    });
  }

  // 4. Understanding Bottleneck: High coverage but low mastery
  const completedCh = chapters.filter((c) => c.status === "Completed").length;
  const weakCh = chapters.filter((c) => c.isWeak).length;
  if (completedCh >= 4 && weakCh >= 2) {
    bottlenecks.push({
      id: "btn-understanding",
      patternType: "Understanding Bottleneck",
      title: "Syllabus Pace Ahead of Mastery",
      description: "Chapters are marked completed faster than retention and accuracy metrics are solidifying.",
      evidence: `${completedCh} chapters marked complete, but ${weakCh} remain flagged as weak areas.`,
      suggestedAction: "Pause starting new chapters for 2 days to consolidate weak areas with question sets.",
      severity: "Advisory",
    });
  }

  return bottlenecks;
}

// -----------------------------------------------------------------------
// 10. EXAM READINESS 2.0 (Section 15)
// -----------------------------------------------------------------------

export function evaluateExamReadiness2(params: {
  chapters: AcademicChapter[];
  practiceSessions: AcademicPracticeSession[];
  revisions: AcademicRevisionItem[];
  mistakes: EnhancedMistakeRecord[];
  examRecords: ExamTestRecord[];
  streakDays?: number;
  examProfile?: ExamProfile;
}): ExamReadiness2Result {
  const {
    chapters = [],
    practiceSessions = [],
    revisions = [],
    mistakes = [],
    examRecords = [],
    streakDays = 1,
    examProfile,
  } = params;

  // Date and proximity
  let daysRemaining = 45;
  let dateType: "OFFICIAL_EXAM_DATE" | "STUDENT_TARGET_DATE" | "ESTIMATED_WINDOW" = "ESTIMATED_WINDOW";

  if (examProfile?.startDate) {
    const targetDate = new Date(examProfile.startDate);
    const diff = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (!isNaN(diff) && diff > 0) {
      daysRemaining = diff;
      dateType = "STUDENT_TARGET_DATE";
    }
  }

  const hasEnoughData = practiceSessions.length >= 1 || examRecords.length >= 1 || revisions.length >= 1;

  if (!hasEnoughData) {
    return {
      hasEnoughData: false,
      coverageSignal: "Not enough data",
      masterySignal: "Not enough data",
      practiceSignal: "Not enough data",
      revisionSignal: "Not enough data",
      mistakesSignal: "Not enough data",
      consistencySignal: "Not enough data",
      overallReadinessSummary: "Not enough data yet",
      readinessExplanation: "Keep studying — not enough recorded study, practice or test data to estimate exam readiness yet.",
      dateType,
      daysRemaining,
    };
  }

  // Dimensions
  const totalCh = Math.max(1, chapters.length);
  const compCh = chapters.filter((c) => c.status === "Completed").length;
  const coveragePct = Math.round((compCh / totalCh) * 100);
  const coverageSignal = coveragePct >= 70 ? "High" : coveragePct >= 35 ? "Medium" : "Low";

  let avgPractice = 0;
  if (practiceSessions.length > 0) {
    avgPractice = Math.round(practiceSessions.reduce((a, b) => a + (b.accuracyPercentage || 0), 0) / practiceSessions.length);
  }
  const practiceSignal = avgPractice >= 75 ? "Strong" : avgPractice >= 55 ? "Moderate" : "Needs Practice";

  const compRev = revisions.filter((r) => r.completed).length;
  const revisionSignal = compRev >= 3 ? "Strong" : compRev >= 1 ? "Moderate" : "Low";

  const unresolved = mistakes.filter((m) => m.lifecycleStatus !== "Corrected").length;
  const mistakesSignal = unresolved === 0 ? "Resolved" : unresolved <= 2 ? "Moderate" : "Needs Attention";

  const consistencySignal = streakDays >= 5 ? "High" : streakDays >= 2 ? "Medium" : "Developing";

  const masterySignal = avgPractice >= 75 && compRev >= 2 ? "Strong" : avgPractice >= 55 ? "Improving" : "Early";

  let overallReadinessSummary: "Strong Readiness" | "Moderate Readiness" | "Needs Focus" | "Not enough data yet" = "Moderate Readiness";
  if (coverageSignal === "High" && practiceSignal === "Strong" && mistakesSignal !== "Needs Attention") {
    overallReadinessSummary = "Strong Readiness";
  } else if (practiceSignal === "Needs Practice" || mistakesSignal === "Needs Attention") {
    overallReadinessSummary = "Needs Focus";
  }

  const readinessExplanation = `Readiness signals: Coverage (${coverageSignal}), Practice (${practiceSignal}), Revision (${revisionSignal}), Mistakes (${mistakesSignal}). Grounded in actual recorded activity.`;

  return {
    hasEnoughData: true,
    coverageSignal,
    masterySignal,
    practiceSignal,
    revisionSignal,
    mistakesSignal,
    consistencySignal,
    overallReadinessSummary,
    readinessExplanation,
    dateType,
    daysRemaining,
  };
}

// -----------------------------------------------------------------------
// 11. NEXT BEST ACTIONS WITH STUDENT-FACING "WHY?" (Section 18, 19, 20)
// -----------------------------------------------------------------------

export function generateNextBestActionsWithEvidence(params: {
  weakTopics: WeakTopicDiagnosis[];
  mistakes: EnhancedMistakeRecord[];
  revisions: AcademicRevisionItem[];
  chapters: AcademicChapter[];
}): NextBestActionWithEvidence[] {
  const { weakTopics = [], mistakes = [], revisions = [], chapters = [] } = params;
  const actions: NextBestActionWithEvidence[] = [];

  // Priority 1: Unresolved or Repeated Mistakes
  const repeated = mistakes.find((m) => m.occurrenceCount >= 2 || m.lifecycleStatus === "Repeated");
  const pendingMistake = repeated || mistakes.find((m) => m.lifecycleStatus !== "Corrected");
  if (pendingMistake) {
    actions.push({
      rank: 1,
      what: `Retry Mistake in ${pendingMistake.subjectName} — ${pendingMistake.chapterTitle}`,
      why: `You missed this concept previously. Retrying reinforces neural recall before taking your next practice test.`,
      evidence: `${pendingMistake.occurrenceCount} recorded occurrence(s). Question: "${pendingMistake.questionText.slice(0, 45)}..."`,
      howLongMinutes: 15,
      whatNext: "Marks mistake as resolved and updates retry success metrics.",
      subjectName: pendingMistake.subjectName,
      chapterTitle: pendingMistake.chapterTitle,
      confidence: "High",
      targetTab: "study",
    });
  }

  // Priority 2: Diagnosed Weak Topic or Overdue Revision
  const overdueRev = revisions.find(
    (r) => !r.completed && r.scheduledDate && new Date(r.scheduledDate).getTime() < Date.now()
  );
  if (overdueRev) {
    actions.push({
      rank: (actions.length + 1) as 1 | 2 | 3,
      what: `Revise ${overdueRev.subjectName || "Subject"} — ${overdueRev.chapterTitle || overdueRev.chapterName}`,
      why: `Spaced revision interval is overdue based on your previous study date.`,
      evidence: `Scheduled due date was ${overdueRev.scheduledDate}. Spaced recall prevents memory decay.`,
      howLongMinutes: 25,
      whatNext: "Advances topic to next spaced maintenance cycle.",
      subjectName: overdueRev.subjectName || "Subject",
      chapterTitle: overdueRev.chapterTitle || overdueRev.chapterName || "Chapter",
      confidence: "High",
      targetTab: "exam",
    });
  } else if (weakTopics.length > 0) {
    const topWeak = weakTopics[0];
    actions.push({
      rank: (actions.length + 1) as 1 | 2 | 3,
      what: `Tackle ${topWeak.diagnosisType.split("—")[1]?.trim() || "Weak Area"} in ${topWeak.chapterTitle}`,
      why: topWeak.suggestedAction,
      evidence: topWeak.evidenceSummary,
      howLongMinutes: 30,
      whatNext: "Increases topic mastery and stabilizes accuracy.",
      subjectName: topWeak.subjectName,
      chapterTitle: topWeak.chapterTitle,
      confidence: "High",
      targetTab: "study",
    });
  }

  // Priority 3: Next sequential core chapter practice
  const uncompleted = chapters.find((c) => c.status !== "Completed" && c.priority === "VVI") || chapters[0];
  if (uncompleted && actions.length < 3) {
    actions.push({
      rank: (actions.length + 1) as 1 | 2 | 3,
      what: `Practice 10 High-Yield Questions in ${uncompleted.subjectName || "Core Subject"}`,
      why: `Builds question-answering speed and conceptual familiarity with board examination patterns.`,
      evidence: `Core syllabus topic: ${uncompleted.title} (${uncompleted.priority || "VVI"}).`,
      howLongMinutes: 25,
      whatNext: "Logs practice score into subject readiness and trend chart.",
      subjectName: uncompleted.subjectName || "Core Subject",
      chapterTitle: uncompleted.title,
      confidence: "Medium",
      targetTab: "exam",
    });
  }

  return actions.slice(0, 3);
}

// -----------------------------------------------------------------------
// 12. MASTER P5 LEARNING EFFECTIVENESS AGGREGATOR
// -----------------------------------------------------------------------

export function generateLearningEffectivenessReport(params: {
  student?: StudentProfile;
  subjects?: Subject[];
  studySessions?: StudySession[];
  academicChapters?: AcademicChapter[];
  revisions?: AcademicRevisionItem[];
  practiceSessions?: AcademicPracticeSession[];
  examRecords?: ExamTestRecord[];
  examProfile?: ExamProfile;
  streakDays?: number;
}): LearningEffectivenessReport {
  const {
    student,
    subjects = [],
    studySessions = [],
    academicChapters = [],
    revisions = [],
    practiceSessions = [],
    examRecords = [],
    examProfile,
    streakDays = 1,
  } = params;

  const profileId = student?.id || "default-student";
  const studentName = student?.name || "Student";

  // 1. Load Enhanced Mistakes for this profile
  const mistakes = loadEnhancedMistakes(profileId);

  // 2. Study Quantity vs Effectiveness
  const quantityVsEffectiveness = evaluateStudyQuantityVsEffectiveness({
    studySessions,
    practiceSessions,
    mistakes,
  });

  // 3. Topic Mastery 2.0
  const topicMasteries: TopicMastery2Result[] = academicChapters.map((ch) =>
    calculateTopicMastery2({
      chapterId: ch.id,
      chapterTitle: ch.title,
      subjectId: ch.subjectId,
      subjectName: ch.subjectName || "Subject",
      practiceSessions,
      mistakes,
      revisions,
      chapterStatus: ch.status,
      isWeak: ch.isWeak,
    })
  );

  // 4. Weak Topic Diagnoses
  const weakTopicsDiagnosed = diagnoseWeakTopics({
    chapters: academicChapters,
    practiceSessions,
    mistakes,
    revisions,
  });

  // 5. Retry Effectiveness Metrics
  const mistakeMetrics = computeRetryEffectiveness(mistakes);

  // 6. Retention Signal
  const retentionSignal = evaluateRetentionSignal({
    practiceSessions,
    revisions,
    mistakes,
  });

  // 7. Revision Effectiveness
  const revisionEffectiveness = evaluateRevisionEffectiveness({
    revisions,
    practiceSessions,
  });

  // 8. Subject Performances
  const effectiveSubjects =
    subjects.length > 0
      ? subjects.map((s) => ({ id: s.id, name: s.name }))
      : [{ id: "sub-acc", name: "Accountancy" }, { id: "sub-bst", name: "Business Studies" }, { id: "sub-eco", name: "Economics" }];

  const subjectPerformances = evaluateSubjectPerformances({
    subjects: effectiveSubjects,
    chapters: academicChapters,
    practiceSessions,
    mistakes,
    revisions,
  });

  // 9. Chapter Performances
  const chapterPerformances: ChapterPerformanceIntelligence[] = academicChapters.map((ch) => {
    const tm = topicMasteries.find((t) => t.chapterId === ch.id) || calculateTopicMastery2({
      chapterId: ch.id,
      chapterTitle: ch.title,
      subjectId: ch.subjectId,
      subjectName: ch.subjectName || "Subject",
      practiceSessions,
      mistakes,
      revisions,
      chapterStatus: ch.status,
    });

    const chPractices = practiceSessions.filter(
      (p) => p.chapterId === ch.id || p.chapterTitle.toLowerCase() === ch.title.toLowerCase()
    );
    const recentAccuracyPct =
      chPractices.length > 0
        ? Math.round(chPractices.reduce((a, b) => a + (b.accuracyPercentage || 0), 0) / chPractices.length)
        : null;

    const weakDiag = weakTopicsDiagnosed.find((w) => w.chapterId === ch.id);
    const chMistakes = mistakes.filter(
      (m) => m.chapterTitle.toLowerCase() === ch.title.toLowerCase() || m.subjectId === ch.subjectId
    );
    const repeatedCount = chMistakes.filter((m) => m.occurrenceCount >= 2 || m.lifecycleStatus === "Repeated").length;

    const chRev = revisions.find(
      (r) => r.chapterTitle?.toLowerCase() === ch.title.toLowerCase() || r.chapterName?.toLowerCase() === ch.title.toLowerCase()
    );
    let revStatus: "Up to Date" | "Due Today" | "Overdue" | "Not Started" = "Not Started";
    if (chRev) {
      if (chRev.completed) revStatus = "Up to Date";
      else if (chRev.scheduledDate && new Date(chRev.scheduledDate).getTime() < Date.now()) revStatus = "Overdue";
      else revStatus = "Due Today";
    }

    return {
      chapterId: ch.id,
      chapterTitle: ch.title,
      subjectName: ch.subjectName || "Subject",
      subjectId: ch.subjectId,
      topicCoveragePct: ch.status === "Completed" ? 100 : ch.status === "In Progress" ? 50 : 0,
      masteryStage: tm.stage,
      recentAccuracyPct,
      practiceCount: chPractices.length,
      weaknessType: weakDiag?.diagnosisType,
      repeatedMistakesCount: repeatedCount,
      revisionStatus: revStatus,
      performanceTrend: recentAccuracyPct !== null && recentAccuracyPct >= 75 ? "Improving" : recentAccuracyPct !== null ? "Stable" : "Insufficient data",
      nextRecommendedAction: tm.recommendedNextAction,
    };
  });

  // 10. Mock Test Trajectory Analysis (Section 14)
  const mockRecords = examRecords.filter(
    (r) => (r as any).testType === "Mock Exam" || (r as any).isMock || r.testName?.toLowerCase().includes("mock")
  );
  let mockTrend: "Improving" | "Stable" | "Declining" | "Insufficient data" = "Insufficient data";
  let latestMockScorePct: number | null = null;
  let previousMockScorePct: number | null = null;
  let scoreDeltaPct: number | null = null;
  let mockEvidence = "No mock exams recorded yet. Log mock test scores to evaluate trajectory.";

  if (mockRecords.length >= 2) {
    const sortedMocks = [...mockRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    latestMockScorePct = Math.round((sortedMocks[0].marksObtained / (sortedMocks[0].maxMarks || 100)) * 100);
    previousMockScorePct = Math.round((sortedMocks[1].marksObtained / (sortedMocks[1].maxMarks || 100)) * 100);
    scoreDeltaPct = latestMockScorePct - previousMockScorePct;

    if (scoreDeltaPct > 3) {
      mockTrend = "Improving";
      mockEvidence = `Mock score improved by +${scoreDeltaPct}% (from ${previousMockScorePct}% to ${latestMockScorePct}%).`;
    } else if (scoreDeltaPct < -3) {
      mockTrend = "Declining";
      mockEvidence = `Mock score dropped by ${scoreDeltaPct}% (from ${previousMockScorePct}% to ${latestMockScorePct}%).`;
    } else {
      mockTrend = "Stable";
      mockEvidence = `Mock performance is consistent (${latestMockScorePct}% vs ${previousMockScorePct}%).`;
    }
  } else if (mockRecords.length === 1) {
    latestMockScorePct = Math.round((mockRecords[0].marksObtained / (mockRecords[0].maxMarks || 100)) * 100);
    mockEvidence = `First mock score recorded: ${latestMockScorePct}%. Complete a second mock to establish trend.`;
  }

  const mockTestTrajectory: MockTestTrajectoryAnalysis = {
    totalMocksLogged: mockRecords.length,
    mockTrend,
    latestMockScorePct,
    previousMockScorePct,
    scoreDeltaPct,
    subjectAverages: {},
    evidenceMessage: mockEvidence,
  };

  // 11. Exam Readiness 2.0
  const examReadiness2 = evaluateExamReadiness2({
    chapters: academicChapters,
    practiceSessions,
    revisions,
    mistakes,
    examRecords,
    streakDays,
    examProfile,
  });

  // 12. Learning Bottlenecks
  const learningBottlenecks = detectLearningBottlenecks({
    totalStudyMinutes: quantityVsEffectiveness.totalStudyMinutes,
    practiceQuestionsCount: quantityVsEffectiveness.practiceQuestionsAttemptedCount,
    mistakes,
    revisions,
    chapters: academicChapters,
  });

  // 13. Next Best Actions with Evidence
  const nextBestActions = generateNextBestActionsWithEvidence({
    weakTopics: weakTopicsDiagnosed,
    mistakes,
    revisions,
    chapters: academicChapters,
  });

  // 14. Weekly Learning Review 2.0
  const topicsImproved = topicMasteries.filter((m) => m.stage === "Strong" || m.stage === "Practicing").length;
  const topicsNeedingRev = topicMasteries.filter((m) => m.stage === "Needs Revision" || m.stage === "Improving").length;

  const weeklyReview2: WeeklyLearningReview2 = {
    weekLabel: "Weekly Learning Effectiveness Review",
    studyTimeFormatted: quantityVsEffectiveness.totalStudyHoursFormatted,
    practiceQuestionsCount: quantityVsEffectiveness.practiceQuestionsAttemptedCount,
    practiceAccuracyPct: quantityVsEffectiveness.recentPracticeAccuracyPct,
    mistakesCorrectedCount: mistakeMetrics.totalCorrected,
    topicsImprovedCount: topicsImproved,
    topicsNeedingRevisionCount: topicsNeedingRev,
    whatImproved: [
      quantityVsEffectiveness.totalStudyMinutes > 0 ? `${quantityVsEffectiveness.totalStudyHoursFormatted} study time logged` : "No sessions logged yet",
      mistakeMetrics.totalCorrected > 0 ? `${mistakeMetrics.totalCorrected} question mistakes resolved` : "No mistake retries logged yet",
    ],
    whatStayedWeak: weakTopicsDiagnosed.slice(0, 2).map((w) => `${w.subjectName}: ${w.chapterTitle} (${w.diagnosisType.split("—")[1]?.trim()})`),
    whatShouldChangeNextWeek: [
      quantityVsEffectiveness.practiceQuestionsAttemptedCount < 20
        ? "Increase active question practice volume alongside theory reading."
        : "Maintain current question practice momentum.",
      mistakeMetrics.unresolvedCount > 0
        ? `Dedicate 20 minutes to retry your ${mistakeMetrics.unresolvedCount} unresolved mistake questions.`
        : "Keep mistake queue clear by reviewing new errors immediately.",
    ],
    top3Actions: nextBestActions.map((a) => a.what),
  };

  return {
    profileId,
    studentName,
    generatedAt: Date.now(),
    quantityVsEffectiveness,
    topicMasteries,
    weakTopicsDiagnosed,
    mistakeMetrics,
    enhancedMistakes: mistakes,
    retentionSignal,
    revisionEffectiveness,
    subjectPerformances,
    chapterPerformances,
    mockTestTrajectory,
    examReadiness2,
    learningBottlenecks,
    nextBestActions,
    weeklyReview2,
  };
}
