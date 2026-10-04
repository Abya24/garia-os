// =======================================================================
// GARIA OS P4 - ADAPTIVE STUDENT INTELLIGENCE & STUDY EXECUTION ENGINE
// =======================================================================
// Pure deterministic academic intelligence layer that powers:
// 1. Unified Adaptive Study State (single coherent model across modules)
// 2. "What Should I Do Now?" Top 3 Action Recommendation Engine
// 3. Normalized Multi-Factor Priority Calculation
// 4. Multi-Signal 6-Stage Mastery Model
// 5. Time-Aware Study Planning (30m to 3h with explicit deferrals)
// 6. Spaced Revision Interval Engine (honest, explainable model)
// 7. Structured Mistake / Error Learning Loop
// 8. Exam Readiness & Official vs Student Date Separation
// 9. Analytics-to-Action Generation
// 10. Weekly Concise Student Review
// =======================================================================

import {
  StudentProfile,
  Subject,
  AcademicSubject,
  StudySession,
  AcademicChapter,
  AcademicRevisionItem,
  AcademicPracticeSession,
  ExamProfile,
  ExamTestRecord,
  Goal,
  BoardType,
  StreamType,
} from "../types";
import {
  getBoardCurriculumHierarchy,
  normalizeCurriculumBoard,
  DEFAULT_CURRICULUM_ACADEMIC_YEAR,
} from "../data/masterCurriculum";
import { normalizeStream } from "./academicDecisionEngine";

// -----------------------------------------------------------------------
// 1. TYPES & DATA STRUCTURES
// -----------------------------------------------------------------------

export type MasteryStage =
  | "Not Started"
  | "Learning"
  | "Practicing"
  | "Improving"
  | "Strong"
  | "Needs Revision";

export interface TopicMasteryState {
  chapterId: string;
  chapterTitle: string;
  subjectId: string;
  subjectName: string;
  stage: MasteryStage;
  hasEnoughData: boolean;
  accuracyPct: number;
  totalAttempts: number;
  revisionCount: number;
  lastStudiedAt?: number;
  lastRevisedAt?: number;
  nextRevisionDue?: number;
  isOverdueForRevision: boolean;
  notesSummary?: string;
}

export type ActionCategory = "study" | "practice" | "revision" | "mistake_review";

export interface PrimaryStudyAction {
  id: string;
  rank: 1 | 2 | 3;
  action: string;
  category: ActionCategory;
  subjectName: string;
  subjectId: string;
  chapterTitle: string;
  topicTitle?: string;
  reason: string;
  estimatedMinutes: number;
  sourceBasis: "APPLICATION-DERIVED";
  confidence: "High" | "Moderate" | "Exploratory";
  priorityScore: number; // 0-100 normalized
  isUrgent: boolean;
  isWeak: boolean;
  isVVI: boolean;
  targetTab: "study" | "exam" | "tasks" | "notes";
  postActionFeedback?: string;
}

export interface PriorityBreakdown {
  urgency: number; // 0-25
  revisionNeed: number; // 0-25
  weakness: number; // 0-20
  coverageGap: number; // 0-15
  goalAlignment: number; // 0-10
  consistencyNeed: number; // 0-05
  totalScore: number; // 0-100
  formulaDescription: string;
}

export interface TimeAwareStudyPlan {
  availableMinutes: number;
  totalAllocatedMinutes: number;
  breakMinutes: number;
  mustDo: PlanItem[];
  shouldDo: PlanItem[];
  optional: PlanItem[];
  deferred: DeferredItem[];
  planSummary: string;
}

export interface PlanItem {
  id: string;
  tier: "must_do" | "should_do" | "optional";
  subjectName: string;
  chapterTitle: string;
  activity: string;
  durationMinutes: number;
  reason: string;
  prioritySource: "APPLICATION-DERIVED";
  targetTab: string;
}

export interface DeferredItem {
  subjectName: string;
  chapterTitle: string;
  activity: string;
  estimatedMinutes: number;
  reasonForDeferral: string;
}

export interface StudentMistakeRecord {
  id: string;
  profileId: string;
  subjectId: string;
  subjectName: string;
  chapterTitle: string;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  conceptExplanation?: string;
  whyWrongNote?: string;
  mistakeCategory?: "conceptual" | "calculation" | "misread_question" | "unrevised";
  status: "pending_review" | "retried_incorrect" | "retried_correct" | "resolved";
  retryCount: number;
  createdAt: number;
  lastReviewedAt?: number;
  markedForRevision: boolean;
}

export interface RevisionScheduleStatus {
  id: string;
  subjectName: string;
  chapterTitle: string;
  revisionCycle: 1 | 2 | 3 | 4;
  intervalDays: number;
  lastStudiedDate?: string;
  lastRevisedDate?: string;
  dueDate: string;
  urgencyBadge: "Overdue" | "Due Today" | "Upcoming" | "Not Due";
  daysOverdue: number;
  recommendationNote: string;
}

export interface ExamReadinessResult {
  hasEnoughData: boolean;
  overallScore: number; // 0-100
  confidence: "High" | "Moderate" | "Needs Focus" | "Insufficient Data";
  syllabusCoveragePct: number;
  revisionCoveragePct: number;
  practiceAccuracyPct: number;
  mockTestAveragePct: number;
  studyConsistencyPct: number;
  unresolvedMistakesCount: number;
  explanation: string;
  daysRemaining: number;
  dateType: "OFFICIAL_EXAM_DATE" | "STUDENT_TARGET_DATE" | "ESTIMATED_WINDOW";
  examName: string;
}

export interface AnalyticsActionItem {
  id: string;
  insight: string;
  recommendedAction: string;
  targetTab: string;
  urgency: "High" | "Medium";
  basedOn: string;
}

export interface WeeklyReviewReport {
  weekLabel: string;
  totalStudyHours: number;
  studyDaysCount: number;
  completedChapters: string[];
  practiceSessionsLogged: number;
  revisionsCompleted: number;
  mistakesResolved: number;
  weakAreasIdentified: string[];
  deferredItemsSummary: string[];
  nextWeekPriorities: string[];
  summaryMessage: string;
}

export interface UnifiedAdaptiveStudyState {
  profileId: string;
  studentName: string;
  board: BoardType;
  classLevel: string;
  stream: StreamType;
  academicYear: string;
  availableDailyMinutes: number;
  topRecommendations: PrimaryStudyAction[];
  timeAwarePlan: TimeAwareStudyPlan;
  topicMasteries: TopicMasteryState[];
  revisionQueue: RevisionScheduleStatus[];
  mistakeReviewQueue: StudentMistakeRecord[];
  examReadiness: ExamReadinessResult;
  actionableInsights: AnalyticsActionItem[];
  weeklyReview: WeeklyReviewReport;
  activeGoalLinkage?: {
    goalTitle: string;
    targetSubject: string;
    suggestedAction: string;
  };
  generatedAt: number;
}

// -----------------------------------------------------------------------
// 2. PRIORITY MODEL IMPLEMENTATION (Section 5)
// -----------------------------------------------------------------------

/**
 * Computes a transparent, normalized priority score for any candidate chapter/topic.
 * Formula:
 *   Priority = Urgency (25%) + Revision Need (25%) + Weakness (20%) + Coverage Gap (15%) + Goal Alignment (10%) + Consistency (5%)
 * All weights are explicitly bounded and normalized.
 */
export function calculateNormalizedPriority(params: {
  isWeak?: boolean;
  isVVI?: boolean;
  revisionDueDays?: number; // negative = overdue, 0 = due today, positive = days left
  status?: string; // "Not Started" | "In Progress" | "Completed"
  accuracyPct?: number; // 0-100
  daysUntilExam?: number;
  matchesActiveGoal?: boolean;
  streakDays?: number;
}): PriorityBreakdown {
  const {
    isWeak = false,
    isVVI = false,
    revisionDueDays,
    status = "Not Started",
    accuracyPct,
    daysUntilExam = 45,
    matchesActiveGoal = false,
    streakDays = 1,
  } = params;

  // A. Deadline Urgency (0-25)
  // Exams < 15 days = 25, < 30 days = 20, < 60 days = 15, else = 10
  let urgency = 10;
  if (daysUntilExam <= 15) urgency = 25;
  else if (daysUntilExam <= 30) urgency = 20;
  else if (daysUntilExam <= 60) urgency = 15;

  // B. Revision Need (0-25)
  let revisionNeed = 0;
  if (revisionDueDays !== undefined) {
    if (revisionDueDays < 0) {
      // Overdue: up to 25 points based on how long overdue
      revisionNeed = Math.min(25, 20 + Math.abs(revisionDueDays));
    } else if (revisionDueDays === 0) {
      revisionNeed = 18; // Due today
    } else if (revisionDueDays <= 3) {
      revisionNeed = 10; // Upcoming
    }
  } else if (status === "needs_revision") {
    revisionNeed = 20;
  }

  // C. Performance Weakness (0-20)
  let weakness = 0;
  if (isWeak) weakness += 12;
  if (isVVI) weakness += 5;
  if (accuracyPct !== undefined && accuracyPct < 60) {
    weakness += Math.min(8, Math.round((60 - accuracyPct) / 5));
  }
  weakness = Math.min(20, weakness);

  // D. Coverage Gap (0-15)
  let coverageGap = 0;
  if (status === "Not Started") coverageGap = 15;
  else if (status === "In Progress") coverageGap = 10;
  else coverageGap = 3;

  // E. Goal Alignment (0-10)
  const goalAlignment = matchesActiveGoal ? 10 : 3;

  // F. Consistency Need (0-5)
  // Low streak (<3) encourages routine formation; high streak maintains momentum
  const consistencyNeed = streakDays < 3 ? 5 : 3;

  const totalScore = Math.min(
    100,
    Math.max(10, urgency + revisionNeed + weakness + coverageGap + goalAlignment + consistencyNeed)
  );

  const formulaDescription =
    `Priority (${totalScore}/100) = Urgency (${urgency}/25) + RevisionNeed (${revisionNeed}/25) + ` +
    `Weakness (${weakness}/20) + CoverageGap (${coverageGap}/15) + GoalAlignment (${goalAlignment}/10) + Consistency (${consistencyNeed}/5)`;

  return {
    urgency,
    revisionNeed,
    weakness,
    coverageGap,
    goalAlignment,
    consistencyNeed,
    totalScore,
    formulaDescription,
  };
}

// -----------------------------------------------------------------------
// 3. MASTERY MODEL IMPLEMENTATION (Section 6)
// -----------------------------------------------------------------------

/**
 * Distinguishes 6 discrete academic mastery stages from multiple signals:
 * attempts, accuracy, recent performance, consistency, and revision history.
 * If insufficient data exists, explicitly declares hasEnoughData = false.
 */
export function determineMasteryState(params: {
  chapterId: string;
  chapterTitle: string;
  subjectId: string;
  subjectName: string;
  chapterStatus?: string;
  practiceAttempts?: number;
  practiceAccuracyPct?: number;
  revisionCount?: number;
  lastStudiedAt?: number;
  lastRevisedAt?: number;
  nextRevisionDue?: number;
  isWeak?: boolean;
}): TopicMasteryState {
  const {
    chapterId,
    chapterTitle,
    subjectId,
    subjectName,
    chapterStatus = "Not Started",
    practiceAttempts = 0,
    practiceAccuracyPct,
    revisionCount = 0,
    lastStudiedAt,
    lastRevisedAt,
    nextRevisionDue,
    isWeak = false,
  } = params;

  const now = Date.now();
  const isOverdue = nextRevisionDue ? now > nextRevisionDue : false;
  const hasEnoughData = (practiceAttempts > 0 && practiceAccuracyPct !== undefined) || revisionCount > 0;

  let stage: MasteryStage = "Not Started";

  if (isOverdue) {
    stage = "Needs Revision";
  } else if (!hasEnoughData) {
    if (chapterStatus === "In Progress" || lastStudiedAt) {
      stage = "Learning";
    } else {
      stage = "Not Started";
    }
  } else {
    const acc = practiceAccuracyPct || 50;
    if (isWeak || acc < 55) {
      stage = "Improving";
    } else if (acc >= 85 && revisionCount >= 2 && practiceAttempts >= 10) {
      stage = "Strong";
    } else if (acc >= 70 && practiceAttempts >= 5) {
      stage = "Practicing";
    } else if (acc >= 55) {
      stage = "Improving";
    } else {
      stage = "Learning";
    }
  }

  return {
    chapterId,
    chapterTitle,
    subjectId,
    subjectName,
    stage,
    hasEnoughData,
    accuracyPct: practiceAccuracyPct ?? 0,
    totalAttempts: practiceAttempts,
    revisionCount,
    lastStudiedAt,
    lastRevisedAt,
    nextRevisionDue,
    isOverdueForRevision: isOverdue,
  };
}

// -----------------------------------------------------------------------
// 4. REVISION ENGINE IMPLEMENTATION (Section 10)
// -----------------------------------------------------------------------

/**
 * Generates an explainable spaced revision status for a topic without fabricating
 * pseudo-scientific retention percentages.
 * Interval stages:
 *   Stage 1: 2 days after first study
 *   Stage 2: 7 days after second review
 *   Stage 3: 14 days after third review
 *   Stage 4: 28 days for maintenance
 */
export function calculateRevisionStatus(params: {
  id: string;
  subjectName: string;
  chapterTitle: string;
  cycleCount?: number;
  lastStudiedDate?: string;
  lastRevisedDate?: string;
  customDueDate?: string;
}): RevisionScheduleStatus {
  const {
    id,
    subjectName,
    chapterTitle,
    cycleCount = 1,
    lastStudiedDate,
    lastRevisedDate,
    customDueDate,
  } = params;

  const cycle = (Math.max(1, Math.min(4, cycleCount)) as 1 | 2 | 3 | 4);
  const intervalMap = { 1: 2, 2: 7, 3: 14, 4: 28 };
  const intervalDays = intervalMap[cycle];

  // Base date for calculation
  const baseDateStr = lastRevisedDate || lastStudiedDate || new Date().toISOString().slice(0, 10);
  let due = customDueDate;
  if (!due) {
    const d = new Date(baseDateStr);
    d.setDate(d.getDate() + intervalDays);
    due = d.toISOString().slice(0, 10);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMs = new Date(todayStr).getTime();
  const dueMs = new Date(due).getTime();
  const diffDays = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));

  let urgencyBadge: "Overdue" | "Due Today" | "Upcoming" | "Not Due" = "Not Due";
  let daysOverdue = 0;

  if (diffDays < 0) {
    urgencyBadge = "Overdue";
    daysOverdue = Math.abs(diffDays);
  } else if (diffDays === 0) {
    urgencyBadge = "Due Today";
  } else if (diffDays <= 3) {
    urgencyBadge = "Upcoming";
  }

  let recommendationNote = `Revision cycle ${cycle} scheduled ${intervalDays} days following your previous session.`;
  if (urgencyBadge === "Overdue") {
    recommendationNote = `Overdue by ${daysOverdue} day${daysOverdue > 1 ? "s" : ""}. Revision recommended based on your study history to secure retention.`;
  } else if (urgencyBadge === "Due Today") {
    recommendationNote = `Due today. Complete a 20-30 min active recall revision or formula review session.`;
  }

  return {
    id,
    subjectName,
    chapterTitle,
    revisionCycle: cycle,
    intervalDays,
    lastStudiedDate,
    lastRevisedDate,
    dueDate: due,
    urgencyBadge,
    daysOverdue,
    recommendationNote,
  };
}

// -----------------------------------------------------------------------
// 5. TIME-AWARE PLANNING IMPLEMENTATION (Section 8 & 9)
// -----------------------------------------------------------------------

/**
 * Dynamically constructs a realistic daily plan that strictly honors available time.
 * If available time is 30 mins: produces 1 high-value task.
 * If available time is 180 mins: produces balanced study, practice, and revision with breaks.
 * Deferrals are explicitly highlighted so the student is never silently overloaded.
 */
export function buildTimeAwareDailyPlan(
  availableMinutes: number,
  candidateActions: PrimaryStudyAction[]
): TimeAwareStudyPlan {
  const safeMinutes = Math.max(20, availableMinutes);
  let remainingTime = safeMinutes;
  let totalAllocatedMinutes = 0;
  let breakMinutes = 0;

  const mustDo: PlanItem[] = [];
  const shouldDo: PlanItem[] = [];
  const optional: PlanItem[] = [];
  const deferred: DeferredItem[] = [];

  // Sort candidate actions by priority score descending
  const sorted = [...candidateActions].sort((a, b) => b.priorityScore - a.priorityScore);

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const duration = Math.min(item.estimatedMinutes, remainingTime > 0 ? remainingTime : item.estimatedMinutes);

    if (remainingTime >= 25) {
      // We have room for an active block
      if (mustDo.length === 0) {
        mustDo.push({
          id: `plan-must-${i}`,
          tier: "must_do",
          subjectName: item.subjectName,
          chapterTitle: item.chapterTitle,
          activity: item.action,
          durationMinutes: Math.min(duration, 45),
          reason: item.reason,
          prioritySource: "APPLICATION-DERIVED",
          targetTab: item.targetTab,
        });
        remainingTime -= Math.min(duration, 45);
        totalAllocatedMinutes += Math.min(duration, 45);

        // Insert short 5-10m break if substantial time remains
        if (remainingTime >= 35) {
          breakMinutes += 10;
          remainingTime -= 10;
        }
      } else if (shouldDo.length < 2 && remainingTime >= 20) {
        shouldDo.push({
          id: `plan-should-${i}`,
          tier: "should_do",
          subjectName: item.subjectName,
          chapterTitle: item.chapterTitle,
          activity: item.action,
          durationMinutes: Math.min(duration, 35),
          reason: item.reason,
          prioritySource: "APPLICATION-DERIVED",
          targetTab: item.targetTab,
        });
        remainingTime -= Math.min(duration, 35);
        totalAllocatedMinutes += Math.min(duration, 35);
      } else if (remainingTime >= 15) {
        optional.push({
          id: `plan-opt-${i}`,
          tier: "optional",
          subjectName: item.subjectName,
          chapterTitle: item.chapterTitle,
          activity: item.action,
          durationMinutes: Math.min(duration, 20),
          reason: item.reason,
          prioritySource: "APPLICATION-DERIVED",
          targetTab: item.targetTab,
        });
        remainingTime -= Math.min(duration, 20);
        totalAllocatedMinutes += Math.min(duration, 20);
      } else {
        deferred.push({
          subjectName: item.subjectName,
          chapterTitle: item.chapterTitle,
          activity: item.action,
          estimatedMinutes: item.estimatedMinutes,
          reasonForDeferral: `Deferred to protect focus: daily budget of ${safeMinutes}m fully utilized.`,
        });
      }
    } else {
      deferred.push({
        subjectName: item.subjectName,
        chapterTitle: item.chapterTitle,
        activity: item.action,
        estimatedMinutes: item.estimatedMinutes,
        reasonForDeferral: `Deferred due to time constraint: ${safeMinutes}m available budget.`,
      });
    }
  }

  const planSummary =
    safeMinutes <= 45
      ? `Focused single-task plan (${totalAllocatedMinutes}m) tailored for limited study time today.`
      : `Balanced multi-activity plan: ${mustDo.length} Must Do, ${shouldDo.length} Should Do, with ${breakMinutes}m break time included.`;

  return {
    availableMinutes: safeMinutes,
    totalAllocatedMinutes,
    breakMinutes,
    mustDo,
    shouldDo,
    optional,
    deferred,
    planSummary,
  };
}

// -----------------------------------------------------------------------
// 6. MISTAKE / ERROR REVIEW STORE HELPERS (Section 12)
// -----------------------------------------------------------------------

const getMistakeStorageKey = (profileId: string) => `garia_p_${profileId}_mistakes`;

export function loadProfileMistakes(profileId: string): StudentMistakeRecord[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(getMistakeStorageKey(profileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProfileMistakes(profileId: string, mistakes: StudentMistakeRecord[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(getMistakeStorageKey(profileId), JSON.stringify(mistakes.slice(-100)));
  } catch {
    // Quota pressure or restricted context
  }
}

export function recordQuestionMistake(
  profileId: string,
  mistake: Omit<StudentMistakeRecord, "id" | "createdAt" | "retryCount" | "status" | "markedForRevision">
): StudentMistakeRecord {
  const existing = loadProfileMistakes(profileId);
  const newRecord: StudentMistakeRecord = {
    ...mistake,
    id: `mst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    retryCount: 0,
    status: "pending_review",
    markedForRevision: true,
  };
  saveProfileMistakes(profileId, [newRecord, ...existing]);
  return newRecord;
}

export function updateMistakeStatus(
  profileId: string,
  mistakeId: string,
  resolution: "retried_correct" | "retried_incorrect" | "resolved",
  whyWrongNote?: string
): void {
  const existing = loadProfileMistakes(profileId);
  const updated = existing.map((m) => {
    if (m.id !== mistakeId) return m;
    return {
      ...m,
      status: resolution,
      retryCount: m.retryCount + 1,
      lastReviewedAt: Date.now(),
      whyWrongNote: whyWrongNote || m.whyWrongNote,
    };
  });
  saveProfileMistakes(profileId, updated);
}

// -----------------------------------------------------------------------
// 7. UNIFIED ADAPTIVE STUDY STATE GENERATOR (Section 1, 3, 4, 14, 15, 16)
// -----------------------------------------------------------------------

export function generateUnifiedAdaptiveState(params: {
  student?: StudentProfile;
  subjects?: Subject[] | AcademicSubject[] | any[];
  studySessions?: StudySession[];
  academicChapters?: AcademicChapter[];
  revisions?: AcademicRevisionItem[];
  practiceSessions?: AcademicPracticeSession[];
  examRecords?: ExamTestRecord[];
  goals?: Goal[];
  examProfile?: ExamProfile | any;
  availableDailyMinutes?: number;
  streakDays?: number;
}): UnifiedAdaptiveStudyState {
  const {
    student,
    subjects = [],
    studySessions = [],
    academicChapters = [],
    revisions = [],
    practiceSessions = [],
    examRecords = [],
    goals = [],
    examProfile,
    availableDailyMinutes = 90,
    streakDays = 1,
  } = params;

  const profileId = student?.id || "default-student";
  const studentName = student?.name || "Student";
  const rawBoard = student?.board || examProfile?.board || "CBSE";
  const normalizedBoard = normalizeCurriculumBoard(rawBoard);
  const classLevel = student?.classLevel || examProfile?.classLevel || "Class 12";
  const stream = normalizeStream(student?.stream || examProfile?.stream, classLevel);
  const academicYear = student?.academicYear || DEFAULT_CURRICULUM_ACADEMIC_YEAR;

  // Board hierarchy fallback if chapters empty
  const boardHierarchy = getBoardCurriculumHierarchy(
    normalizedBoard,
    classLevel,
    stream,
    academicYear
  );

  const effectiveSubjects: { id: string; name: string; color: string }[] =
    subjects.length > 0
      ? subjects.map((s) => ({ id: s.id, name: s.name, color: s.color || "#06b6d4" }))
      : boardHierarchy.subjects.map((s) => ({ id: s.id, name: s.name, color: s.color || "#06b6d4" }));

  // Load mistakes for this profile
  const mistakeQueue = loadProfileMistakes(profileId);
  const pendingMistakes = mistakeQueue.filter((m) => m.status === "pending_review" || m.status === "retried_incorrect");

  // 1. Goal Linkage: find if student has active academic goal
  const activeGoal = goals.find((g) => !g.completed);
  let activeGoalLinkage: { goalTitle: string; targetSubject: string; suggestedAction: string } | undefined;
  if (activeGoal) {
    const matchedSub = effectiveSubjects.find((s) =>
      activeGoal.title.toLowerCase().includes(s.name.toLowerCase())
    );
    activeGoalLinkage = {
      goalTitle: activeGoal.title,
      targetSubject: matchedSub?.name || effectiveSubjects[0]?.name || "Core Subject",
      suggestedAction: `Align daily study with your active milestone: "${activeGoal.title}"`,
    };
  }

  // 2. Exam Date & Proximity Handling (Section 13)
  let daysRemaining = 45;
  let dateType: "OFFICIAL_EXAM_DATE" | "STUDENT_TARGET_DATE" | "ESTIMATED_WINDOW" = "ESTIMATED_WINDOW";
  let examTitle = examProfile?.examName || `${classLevel} ${stream} Board Examination`;

  if (examProfile?.startDate) {
    const targetDate = new Date(examProfile.startDate);
    const now = new Date();
    const diff = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (!isNaN(diff) && diff > 0) {
      daysRemaining = diff;
      dateType = "STUDENT_TARGET_DATE"; // Unless verified from board circular
    }
  }

  // 3. Topic Mastery Evaluation
  const topicMasteries: TopicMasteryState[] = [];
  const baseChapters =
    academicChapters.length > 0
      ? academicChapters
      : boardHierarchy.subjects.flatMap((s) =>
          s.chapters.map((ch) => ({
            id: ch.id,
            subjectId: s.id,
            subjectName: s.name,
            title: ch.title,
            priority: ch.priority,
            status: "Not Started",
            isWeak: false,
          }))
        );

  baseChapters.forEach((ch) => {
    const matchedSubject = effectiveSubjects.find((s) => s.id === ch.subjectId || s.name === ch.subjectName);
    const subName = matchedSubject?.name || ch.subjectName || "Subject";
    const subId = matchedSubject?.id || ch.subjectId;

    // Filter practice for this chapter
    const chPractices = practiceSessions.filter((p) => p.chapterId === ch.id || p.chapterTitle === ch.title);
    const totalPracticeAttempts = chPractices.length;
    let avgPracticeAccuracy = chPractices.length > 0
      ? Math.round(chPractices.reduce((acc, p) => acc + (p.accuracyPercentage || 0), 0) / chPractices.length)
      : undefined;

    const mastery = determineMasteryState({
      chapterId: ch.id,
      chapterTitle: ch.title,
      subjectId: subId,
      subjectName: subName,
      chapterStatus: ch.status,
      practiceAttempts: totalPracticeAttempts,
      practiceAccuracyPct: avgPracticeAccuracy,
      revisionCount: ch.revisionCount || 0,
      lastStudiedAt: ch.lastRevisedAt,
      nextRevisionDue: ch.nextRevisionDue,
      isWeak: ch.isWeak,
    });

    topicMasteries.push(mastery);
  });

  // 4. Revision Queue Calculation
  const revisionQueue: RevisionScheduleStatus[] = [];
  revisions
    .filter((r) => !r.completed)
    .forEach((r) => {
      revisionQueue.push(
        calculateRevisionStatus({
          id: r.id,
          subjectName: r.subjectName || "Core Subject",
          chapterTitle: r.chapterTitle || r.chapterName || "Key Chapter",
          cycleCount: (r.cycleCount || 1) as 1 | 2 | 3 | 4,
          customDueDate: r.scheduledDate,
        })
      );
    });

  // If revisions empty, seed from baseChapters that need revision
  if (revisionQueue.length === 0) {
    const chaptersNeedingRev = baseChapters.filter((c) => c.priority === "VVI" || c.isWeak).slice(0, 3);
    chaptersNeedingRev.forEach((c, idx) => {
      const sub = effectiveSubjects.find((s) => s.id === c.subjectId) || effectiveSubjects[0];
      revisionQueue.push(
        calculateRevisionStatus({
          id: `rev-seed-${idx}`,
          subjectName: sub?.name || "Accountancy",
          chapterTitle: c.title,
          cycleCount: 1,
        })
      );
    });
  }

  // 5. Build "What Should I Do Now?" Top 3 Action Candidates (Section 4)
  const candidateActionPool: PrimaryStudyAction[] = [];

  // Candidate A: Pending Mistakes Review
  if (pendingMistakes.length > 0) {
    const topMistake = pendingMistakes[0];
    const pb = calculateNormalizedPriority({
      isWeak: true,
      isVVI: true,
      daysUntilExam: daysRemaining,
      accuracyPct: 40,
    });
    candidateActionPool.push({
      id: `act-mistake-${topMistake.id}`,
      rank: 1,
      action: `Review & Retry Mistake in ${topMistake.subjectName}`,
      category: "mistake_review",
      subjectName: topMistake.subjectName,
      subjectId: topMistake.subjectId,
      chapterTitle: topMistake.chapterTitle,
      topicTitle: topMistake.questionText.slice(0, 45) + "...",
      reason: `You missed this concept previously. Retrying reinforces neural recall before your exam in ${daysRemaining} days.`,
      estimatedMinutes: 15,
      sourceBasis: "APPLICATION-DERIVED",
      confidence: "High",
      priorityScore: pb.totalScore,
      isUrgent: true,
      isWeak: true,
      isVVI: true,
      targetTab: "study",
      postActionFeedback: "Resolves pending error in your mistake log.",
    });
  }

  // Candidate B: Overdue or Due-Today Revision
  const dueOrOverdueRev = revisionQueue.find((r) => r.urgencyBadge === "Overdue" || r.urgencyBadge === "Due Today");
  if (dueOrOverdueRev) {
    const pb = calculateNormalizedPriority({
      revisionDueDays: dueOrOverdueRev.urgencyBadge === "Overdue" ? -dueOrOverdueRev.daysOverdue : 0,
      daysUntilExam: daysRemaining,
      isVVI: true,
    });
    candidateActionPool.push({
      id: `act-rev-${dueOrOverdueRev.id}`,
      rank: 1,
      action: `Revise ${dueOrOverdueRev.subjectName} — ${dueOrOverdueRev.chapterTitle}`,
      category: "revision",
      subjectName: dueOrOverdueRev.subjectName,
      subjectId: dueOrOverdueRev.subjectName.toLowerCase().replace(/\s+/g, "-"),
      chapterTitle: dueOrOverdueRev.chapterTitle,
      reason: dueOrOverdueRev.recommendationNote,
      estimatedMinutes: 30,
      sourceBasis: "APPLICATION-DERIVED",
      confidence: "High",
      priorityScore: pb.totalScore,
      isUrgent: dueOrOverdueRev.urgencyBadge === "Overdue",
      isWeak: false,
      isVVI: true,
      targetTab: "exam",
      postActionFeedback: "Advances chapter to next spaced revision cycle.",
    });
  }

  // Candidate C: Highest Priority Unfinished / Weak Chapter
  const weakOrVviTopic = topicMasteries.find((m) => m.stage === "Needs Revision" || m.stage === "Improving" || m.stage === "Learning");
  const targetTopic = weakOrVviTopic || topicMasteries[0];
  if (targetTopic) {
    const pb = calculateNormalizedPriority({
      isWeak: targetTopic.stage === "Improving",
      isVVI: true,
      status: targetTopic.stage === "Not Started" ? "Not Started" : "In Progress",
      accuracyPct: targetTopic.accuracyPct,
      daysUntilExam: daysRemaining,
      matchesActiveGoal: activeGoalLinkage?.targetSubject === targetTopic.subjectName,
      streakDays,
    });
    candidateActionPool.push({
      id: `act-study-${targetTopic.chapterId}`,
      rank: 1,
      action: `Study ${targetTopic.subjectName} — ${targetTopic.chapterTitle}`,
      category: "study",
      subjectName: targetTopic.subjectName,
      subjectId: targetTopic.subjectId,
      chapterTitle: targetTopic.chapterTitle,
      reason: `Core chapter in ${stream} syllabus. Build conceptual mastery to raise subject readiness.`,
      estimatedMinutes: 45,
      sourceBasis: "APPLICATION-DERIVED",
      confidence: "High",
      priorityScore: pb.totalScore,
      isUrgent: pb.urgency >= 20,
      isWeak: targetTopic.stage === "Improving",
      isVVI: true,
      targetTab: "study",
      postActionFeedback: "Marks concepts reviewed and updates study tracker log.",
    });
  }

  // Candidate D: Practice Session Drill (Connected to Question Bank)
  const practiceSub = effectiveSubjects[0] || { id: "sub-1", name: "Accountancy" };
  const pbPractice = calculateNormalizedPriority({
    daysUntilExam: daysRemaining,
    isVVI: true,
    streakDays,
  });
  candidateActionPool.push({
    id: `act-practice-drill`,
    rank: 1,
    action: `Practice 10 High-Yield Questions in ${practiceSub.name}`,
    category: "practice",
    subjectName: practiceSub.name,
    subjectId: practiceSub.id,
    chapterTitle: "Board-Pattern Practice Drill",
    reason: `Timed question practice tests active recall and exam question answering speed.`,
    estimatedMinutes: 25,
    sourceBasis: "APPLICATION-DERIVED",
    confidence: "Moderate",
    priorityScore: pbPractice.totalScore - 5,
    isUrgent: false,
    isWeak: false,
    isVVI: true,
    targetTab: "exam",
    postActionFeedback: "Logs test score to your exam readiness trend.",
  });

  // Sort candidate actions by priority score descending and strictly take TOP 3
  const topRecommendations = candidateActionPool
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3)
    .map((act, idx) => ({ ...act, rank: (idx + 1) as 1 | 2 | 3 }));

  // 6. Time-Aware Study Plan (Section 8)
  const timeAwarePlan = buildTimeAwareDailyPlan(availableDailyMinutes, candidateActionPool);

  // 7. Exam Readiness Assessment (Section 14)
  const completedChaptersCount = topicMasteries.filter((m) => m.stage === "Strong" || m.stage === "Practicing").length;
  const totalChaptersCount = Math.max(1, topicMasteries.length);
  const syllabusCoveragePct = Math.round((completedChaptersCount / totalChaptersCount) * 100);

  const completedRevisionsCount = revisions.filter((r) => r.completed).length;
  const totalRevisionsCount = Math.max(1, revisions.length);
  const revisionCoveragePct = Math.round((completedRevisionsCount / totalRevisionsCount) * 100);

  let practiceAccuracyPct = 0;
  if (practiceSessions.length > 0) {
    practiceAccuracyPct = Math.round(
      practiceSessions.reduce((acc, p) => acc + (p.accuracyPercentage || 0), 0) / practiceSessions.length
    );
  }

  let mockTestAveragePct = 0;
  if (examRecords.length > 0) {
    mockTestAveragePct = Math.round(
      examRecords.reduce((acc, r) => acc + (r.marksObtained / (r.maxMarks || 100)) * 100, 0) / examRecords.length
    );
  }

  const studyConsistencyPct = Math.min(100, streakDays * 15 + 30);
  const hasEnoughReadinessData = studySessions.length > 0 || practiceSessions.length > 0 || examRecords.length > 0;

  // Formula: Syllabus (30%) + Revision (25%) + Practice Accuracy (25%) + Mock Average (10%) + Consistency (10%)
  let overallReadinessScore = 0;
  if (hasEnoughReadinessData) {
    overallReadinessScore = Math.min(
      99,
      Math.max(
        15,
        Math.round(
          syllabusCoveragePct * 0.3 +
          revisionCoveragePct * 0.25 +
          (practiceAccuracyPct || 55) * 0.25 +
          (mockTestAveragePct || 60) * 0.1 +
          studyConsistencyPct * 0.1
        )
      )
    );
  }

  const examReadiness: ExamReadinessResult = {
    hasEnoughData: hasEnoughReadinessData,
    overallScore: overallReadinessScore,
    confidence: !hasEnoughReadinessData
      ? "Insufficient Data"
      : overallReadinessScore >= 80
      ? "High"
      : overallReadinessScore >= 60
      ? "Moderate"
      : "Needs Focus",
    syllabusCoveragePct,
    revisionCoveragePct,
    practiceAccuracyPct,
    mockTestAveragePct,
    studyConsistencyPct,
    unresolvedMistakesCount: pendingMistakes.length,
    explanation: hasEnoughReadinessData
      ? `Readiness is based on your recorded study (${syllabusCoveragePct}% syllabus), revision (${revisionCoveragePct}%), and practice test accuracy (${practiceAccuracyPct}%).`
      : "Keep studying — not enough data to estimate readiness yet.",
    daysRemaining,
    dateType,
    examName: examTitle,
  };

  // 8. Analytics to Action (Section 15)
  const actionableInsights: AnalyticsActionItem[] = [];
  if (pendingMistakes.length >= 2) {
    actionableInsights.push({
      id: "insight-mistakes",
      insight: `You have ${pendingMistakes.length} unresolved mistake items in your review log.`,
      recommendedAction: "Review and retry these questions before taking a new mock test.",
      targetTab: "study",
      urgency: "High",
      basedOn: "Recorded practice test incorrect answers",
    });
  }
  const overdueRev = revisionQueue.filter((r) => r.urgencyBadge === "Overdue");
  if (overdueRev.length > 0) {
    actionableInsights.push({
      id: "insight-overdue",
      insight: `${overdueRev.length} chapter revision${overdueRev.length > 1 ? "s are" : " is"} overdue.`,
      recommendedAction: `Schedule a 30-minute revision session for ${overdueRev[0]?.chapterTitle}.`,
      targetTab: "exam",
      urgency: "High",
      basedOn: "Spaced revision timeline",
    });
  }
  if (syllabusCoveragePct < 40 && daysRemaining <= 60) {
    actionableInsights.push({
      id: "insight-coverage",
      insight: `Syllabus coverage is currently at ${syllabusCoveragePct}%.`,
      recommendedAction: "Complete 1 new core chapter every 3 days to stay on track for exam.",
      targetTab: "study",
      urgency: "Medium",
      basedOn: "Exam countdown vs chapter completion ratio",
    });
  }

  // 9. Weekly Student Review (Section 16)
  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + (s.durationSeconds || 0) / 60, 0);
  const totalStudyHours = Math.round((totalStudyMinutes / 60) * 10) / 10;
  const weakAreas = topicMasteries.filter((m) => m.stage === "Improving" || m.stage === "Needs Revision").map((m) => `${m.subjectName}: ${m.chapterTitle}`).slice(0, 3);

  const weeklyReview: WeeklyReviewReport = {
    weekLabel: "Current Week Review",
    totalStudyHours,
    studyDaysCount: Math.min(7, streakDays),
    completedChapters: topicMasteries.filter((m) => m.stage === "Strong").map((m) => m.chapterTitle).slice(0, 3),
    practiceSessionsLogged: practiceSessions.length,
    revisionsCompleted: completedRevisionsCount,
    mistakesResolved: mistakeQueue.filter((m) => m.status === "resolved" || m.status === "retried_correct").length,
    weakAreasIdentified: weakAreas.length > 0 ? weakAreas : ["No critical weak areas identified"],
    deferredItemsSummary: timeAwarePlan.deferred.map((d) => `${d.subjectName}: ${d.chapterTitle}`),
    nextWeekPriorities: topRecommendations.map((r) => r.action),
    summaryMessage: totalStudyHours > 0
      ? `Completed ${totalStudyHours}h of focused study with ${completedRevisionsCount} revision sessions.`
      : "Start logging your study sessions to generate your weekly performance review.",
  };

  return {
    profileId,
    studentName,
    board: normalizedBoard,
    classLevel,
    stream,
    academicYear,
    availableDailyMinutes,
    topRecommendations,
    timeAwarePlan,
    topicMasteries,
    revisionQueue,
    mistakeReviewQueue: mistakeQueue,
    examReadiness,
    actionableInsights,
    weeklyReview,
    activeGoalLinkage,
    generatedAt: Date.now(),
  };
}
