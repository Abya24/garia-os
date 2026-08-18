import {
  StudentProfile,
  ExamProfile,
  AcademicSubject,
  AcademicChapter,
  AcademicVVITopic,
  AcademicRevisionItem,
  AcademicPracticeSession,
  CareerProfile,
  AcademicTest,
} from "../types";

export interface ExamTestRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  testName: string;
  date: string; // YYYY-MM-DD
  maxMarks: number;
  marksObtained: number;
  totalQuestions?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  unattemptedQuestions?: number;
  timeTakenMinutes?: number;
  notes?: string;
  createdAt: number;
}

export type PerformanceTrend = "Improving" | "Stable" | "Declining" | "Insufficient Data";
export type SubjectPerformanceStatus = "Strong" | "Average" | "Needs Attention" | "Insufficient Data";

export interface SubjectPerformanceAnalysis {
  subjectId: string;
  subjectName: string;
  avgPercentage: number;
  bestPercentage: number;
  latestPercentage: number;
  testCount: number;
  accuracy: number;
  attemptRate: number;
  trend: PerformanceTrend;
  status: SubjectPerformanceStatus;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnattempted: number;
  syllabusCoverage: number; // 0-100
  vviCompletionRate: number; // 0-100
  revisionCompletionRate: number; // 0-100
  isCareerPriority: boolean;
}

export interface WeakAreaItem {
  id: string;
  subjectId: string;
  subjectName: string;
  areaTitle: string;
  reason: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  metricDetail?: string;
  suggestedAction: string;
  targetTab?: string;
}

export interface ExamIntelligenceReport {
  overallReadinessScore: number | null;
  readinessCategory: "Needs Attention" | "Building" | "Good Progress" | "Strong Preparation" | "Not enough data";
  hasSufficientData: boolean;
  totalTestsRecorded: number;
  strongSubjects: SubjectPerformanceAnalysis[];
  weakSubjects: SubjectPerformanceAnalysis[];
  subjectAnalyses: SubjectPerformanceAnalysis[];
  weakAreas: WeakAreaItem[];
  priorityTopics: { topic: string; subjectName: string; priority: string; reason: string }[];
  recommendedRevisions: { subjectName: string; chapterOrTopic: string; reason: string }[];
  recommendedPractices: { subjectName: string; action: string; reason: string }[];
  nextBestAction: string;
  latestTestPercentage: number | null;
  lastCalculatedAt: number;
}

/**
  Helper: Calculate single test performance metrics
 */
export function calculateSingleTestMetrics(test: ExamTestRecord) {
  const percentage = test.maxMarks > 0 ? Math.min(100, Math.max(0, (test.marksObtained / test.maxMarks) * 100)) : 0;
  const correct = test.correctAnswers || 0;
  const incorrect = test.incorrectAnswers || 0;
  const totalAttempted = correct + incorrect;
  const accuracy = totalAttempted > 0 ? (correct / totalAttempted) * 100 : percentage;
  const totalQ = test.totalQuestions || 0;
  const attemptRate = totalQ > 0 ? (totalAttempted / totalQ) * 100 : 100;

  return {
    percentage: Math.round(percentage * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    attemptRate: Math.round(attemptRate * 10) / 10,
  };
}

/**
  Helper: Get stream / career priority subject names
 */
export function getCareerPrioritySubjectNames(
  stream: string,
  targetCareerTitle?: string
): string[] {
  const s = stream.toLowerCase();
  const c = (targetCareerTitle || "").toLowerCase();

  if (s.includes("commerce") || c.includes("ca") || c.includes("account")) {
    return ["accountancy", "economics", "business studies", "entrepreneurship", "mathematics"];
  }
  if (s.includes("science") || c.includes("neet") || c.includes("doctor") || c.includes("medical")) {
    return ["biology", "chemistry", "physics", "zoology", "botany"];
  }
  if (s.includes("science") || c.includes("jee") || c.includes("engineer")) {
    return ["physics", "chemistry", "mathematics"];
  }
  if (s.includes("art") || c.includes("law") || c.includes("upsc") || c.includes("clat")) {
    return ["political science", "history", "economics", "sociology", "english", "legal studies"];
  }
  return ["accountancy", "physics", "political science"];
}

/**
  MAIN EXAM INTELLIGENCE ENGINE FUNCTION
 */
export function generateExamIntelligenceReport(
  profile: StudentProfile,
  examProfile: ExamProfile,
  tests: ExamTestRecord[],
  subjects: AcademicSubject[],
  chapters: AcademicChapter[],
  vviTopics: AcademicVVITopic[],
  revisions: AcademicRevisionItem[],
  practiceSessions: AcademicPracticeSession[],
  careerProfile?: CareerProfile
): ExamIntelligenceReport {
  const safeTests = Array.isArray(tests) ? tests : [];
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeChapters = Array.isArray(chapters) ? chapters : [];
  const safeVVITopics = Array.isArray(vviTopics) ? vviTopics : [];
  const safeRevisions = Array.isArray(revisions) ? revisions : [];
  const safePracticeSessions = Array.isArray(practiceSessions) ? practiceSessions : [];

  const careerPriorityNames = getCareerPrioritySubjectNames(
    profile?.stream || examProfile?.stream || "Commerce",
    careerProfile?.selectedCareerId
  );

  // 1. Analyze each subject
  const subjectAnalyses: SubjectPerformanceAnalysis[] = safeSubjects.map((sub) => {
    // Match tests for this subject
    const subTests = safeTests.filter(
      (t) =>
        t &&
        (t.subjectId === sub.id ||
        (t.subjectName && sub.name && t.subjectName.toLowerCase().trim() === sub.name.toLowerCase().trim()))
    );

    // Sort ascending by date / createdAt
    subTests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt);

    const testCount = subTests.length;

    // Matching chapters, VVI, Revisions
    const subChapters = safeChapters.filter(
      (c) => c && (c.subjectId === sub.id || (c.title && sub.name && c.title.toLowerCase().includes(sub.name.toLowerCase())))
    );
    const completedChaps = subChapters.filter((c) => c.status === "Completed").length;
    const syllabusCoverage = subChapters.length > 0 ? Math.round((completedChaps / subChapters.length) * 100) : 0;

    const subVVI = safeVVITopics.filter((v) => v && (v.subjectId === sub.id || (v.subjectName && sub.name && v.subjectName.toLowerCase() === sub.name.toLowerCase())));
    const completedVVI = subVVI.filter((v) => v.status === "Completed").length;
    const vviCompletionRate = subVVI.length > 0 ? Math.round((completedVVI / subVVI.length) * 100) : 0;

    const subRevisions = safeRevisions.filter((r) => r && (r.subjectId === sub.id || (r.subjectName && sub.name && r.subjectName.toLowerCase() === sub.name.toLowerCase())));
    const completedRev = subRevisions.filter((r) => r.completed).length;
    const revisionCompletionRate = subRevisions.length > 0 ? Math.round((completedRev / subRevisions.length) * 100) : 0;

    const isCareerPriority = careerPriorityNames.some((pName) =>
      sub.name && sub.name.toLowerCase().includes(pName)
    );

    if (testCount === 0) {
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        avgPercentage: 0,
        bestPercentage: 0,
        latestPercentage: 0,
        testCount: 0,
        accuracy: 0,
        attemptRate: 0,
        trend: "Insufficient Data",
        status: "Insufficient Data",
        totalQuestions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalUnattempted: 0,
        syllabusCoverage,
        vviCompletionRate,
        revisionCompletionRate,
        isCareerPriority,
      };
    }

    // Accumulate marks and questions
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;
    let bestPct = 0;
    let totalQ = 0;
    let totalCorr = 0;
    let totalIncorr = 0;
    let totalUnatt = 0;

    const pcts: number[] = [];

    subTests.forEach((t) => {
      const pct = t.maxMarks > 0 ? (t.marksObtained / t.maxMarks) * 100 : 0;
      pcts.push(pct);
      totalMarksObtained += t.marksObtained;
      totalMaxMarks += t.maxMarks;
      if (pct > bestPct) bestPct = pct;

      totalQ += t.totalQuestions || 0;
      totalCorr += t.correctAnswers || 0;
      totalIncorr += t.incorrectAnswers || 0;
      totalUnatt += t.unattemptedQuestions || 0;
    });

    const avgPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 1000) / 10 : Math.round((pcts.reduce((a, b) => a + b, 0) / testCount) * 10) / 10;
    const latestPercentage = Math.round(pcts[pcts.length - 1] * 10) / 10;
    const bestPercentage = Math.round(bestPct * 10) / 10;

    const totalAttempted = totalCorr + totalIncorr;
    const accuracy = totalAttempted > 0 ? Math.round((totalCorr / totalAttempted) * 1000) / 10 : avgPercentage;
    const attemptRate = totalQ > 0 ? Math.round((totalAttempted / totalQ) * 1000) / 10 : 100;

    // Calculate Trend
    let trend: PerformanceTrend = "Insufficient Data";
    if (testCount >= 2) {
      const recent = pcts[pcts.length - 1];
      const olderAvg = pcts.slice(0, pcts.length - 1).reduce((a, b) => a + b, 0) / (pcts.length - 1);

      if (recent >= olderAvg + 4) {
        trend = "Improving";
      } else if (recent <= olderAvg - 4) {
        trend = "Declining";
      } else {
        trend = "Stable";
      }
    }

    // Calculate Status
    let status: SubjectPerformanceStatus = "Insufficient Data";
    if (testCount >= 2) {
      if (avgPercentage >= 75) status = "Strong";
      else if (avgPercentage >= 55) status = "Average";
      else status = "Needs Attention";
    } else {
      // 1 test only: keep as Insufficient Data to avoid falsely labeling weak
      status = "Insufficient Data";
    }

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      avgPercentage,
      bestPercentage,
      latestPercentage,
      testCount,
      accuracy,
      attemptRate,
      trend,
      status,
      totalQuestions: totalQ,
      totalCorrect: totalCorr,
      totalIncorrect: totalIncorr,
      totalUnattempted: totalUnatt,
      syllabusCoverage,
      vviCompletionRate,
      revisionCompletionRate,
      isCareerPriority,
    };
  });

  // Filter strong / weak
  const strongSubjects = subjectAnalyses.filter((s) => s.status === "Strong");
  const weakSubjects = subjectAnalyses.filter((s) => s.status === "Needs Attention");

  // 2. Detect Weak Areas
  const weakAreas: WeakAreaItem[] = [];

  subjectAnalyses.forEach((s) => {
    // Rule A: Low Test Average (< 55% with >= 2 tests)
    if (s.status === "Needs Attention" && s.testCount >= 2) {
      weakAreas.push({
        id: `wa-score-${s.subjectId}`,
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        areaTitle: `${s.subjectName} — Test performance needs attention`,
        reason: `Average score is ${s.avgPercentage}% across ${s.testCount} tests.`,
        priority: s.avgPercentage < 45 ? "HIGH" : "MEDIUM",
        metricDetail: `Avg: ${s.avgPercentage}% | Best: ${s.bestPercentage}%`,
        suggestedAction: `Review key concepts and practice chapter tests in ${s.subjectName}.`,
        targetTab: "academic",
      });
    }

    // Rule B: Low Accuracy (< 60% with >= 2 tests)
    if (s.testCount >= 2 && s.accuracy < 60) {
      weakAreas.push({
        id: `wa-acc-${s.subjectId}`,
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        areaTitle: `${s.subjectName} — Question accuracy is low`,
        reason: `Recent test accuracy is ${s.accuracy}%, indicating frequent errors or confusion.`,
        priority: s.accuracy < 50 ? "HIGH" : "MEDIUM",
        metricDetail: `Accuracy: ${s.accuracy}% (${s.totalCorrect} correct / ${s.totalIncorrect} incorrect)`,
        suggestedAction: `Solve PYQs and focus on high-yield numericals or formulas in ${s.subjectName}.`,
        targetTab: "exam",
      });
    }

    // Rule C: Declining Performance Trend
    if (s.trend === "Declining") {
      weakAreas.push({
        id: `wa-trend-${s.subjectId}`,
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        areaTitle: `${s.subjectName} — Declining score trend`,
        reason: `Latest score (${s.latestPercentage}%) dropped below previous test average (${s.avgPercentage}%).`,
        priority: "MEDIUM",
        metricDetail: `Latest: ${s.latestPercentage}% vs Avg: ${s.avgPercentage}%`,
        suggestedAction: `Conduct a targeted revision of weak topics before the next test.`,
        targetTab: "academic",
      });
    }

    // Rule D: Low Syllabus Coverage (< 35% for active subject)
    if (s.syllabusCoverage < 35 && s.syllabusCoverage > 0) {
      weakAreas.push({
        id: `wa-syl-${s.subjectId}`,
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        areaTitle: `${s.subjectName} — Low syllabus coverage`,
        reason: `Syllabus completion is at ${s.syllabusCoverage}%.`,
        priority: s.isCareerPriority ? "HIGH" : "LOW",
        metricDetail: `Coverage: ${s.syllabusCoverage}%`,
        suggestedAction: `Complete pending core chapters to boost syllabus readiness.`,
        targetTab: "academic",
      });
    }

    // Rule E: Unrevised VVI Topics
    const unrevisedVVI = vviTopics.filter(
      (v) =>
        (v.subjectId === s.subjectId || v.subjectName.toLowerCase() === s.subjectName.toLowerCase()) &&
        v.status !== "Completed" &&
        v.priority === "VVI"
    );

    if (unrevisedVVI.length > 0) {
      weakAreas.push({
        id: `wa-vvi-${s.subjectId}`,
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        areaTitle: `${s.subjectName} — ${unrevisedVVI.length} VVI topic(s) unrevised`,
        reason: `High-priority VVI topics remain incomplete or pending revision.`,
        priority: "HIGH",
        metricDetail: `VVI Pending: ${unrevisedVVI.map((v) => v.topicName).slice(0, 2).join(", ")}`,
        suggestedAction: `Prioritize VVI topics in ${s.subjectName} in your daily study slots.`,
        targetTab: "academic",
      });
    }
  });

  // Sort weak areas: HIGH -> MEDIUM -> LOW
  const priorityMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  weakAreas.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);

  // Deduplicate weak areas by ID/title
  const uniqueWeakAreas: WeakAreaItem[] = [];
  const seenTitles = new Set<string>();
  weakAreas.forEach((item) => {
    if (!seenTitles.has(item.areaTitle)) {
      seenTitles.add(item.areaTitle);
      uniqueWeakAreas.push(item);
    }
  });

  // 3. Priority Topics, Recommended Revision, Recommended Practice
  const priorityTopics = vviTopics
    .filter((v) => v.status !== "Completed")
    .map((v) => ({
      topic: v.topicName,
      subjectName: v.subjectName,
      priority: v.priority,
      reason: `VVI topic in ${v.chapterTitle}`,
    }))
    .slice(0, 5);

  const recommendedRevisions = revisions
    .filter((r) => !r.completed)
    .map((r) => ({
      subjectName: r.subjectName,
      chapterOrTopic: r.chapterTitle + (r.topicName ? ` (${r.topicName})` : ""),
      reason: `Scheduled revision due on ${r.scheduledDate}`,
    }))
    .slice(0, 5);

  const recommendedPractices = subjectAnalyses
    .filter((s) => s.testCount === 0 || s.accuracy < 65)
    .map((s) => ({
      subjectName: s.subjectName,
      action: s.testCount === 0 ? "Log your first test" : "Practice 20 PYQ questions",
      reason: s.testCount === 0 ? "No test performance recorded yet." : `Accuracy is currently ${s.accuracy}%.`,
    }))
    .slice(0, 5);

  // 4. Overall Exam Readiness Score Calculation
  const totalTests = tests.length;
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter((c) => c.status === "Completed").length;
  const totalVVI = vviTopics.length;
  const completedVVI = vviTopics.filter((v) => v.status === "Completed").length;
  const totalRev = revisions.length;
  const completedRev = revisions.filter((r) => r.completed).length;

  const hasSufficientData = totalTests > 0 || completedChapters > 0 || practiceSessions.length > 0;

  let overallReadinessScore: number | null = null;
  let readinessCategory: ExamIntelligenceReport["readinessCategory"] = "Not enough data";

  if (hasSufficientData) {
    // Tested percentage component (35%)
    let testScoreComp = 50;
    if (totalTests > 0) {
      const allTestPcts = tests.map((t) => (t.maxMarks > 0 ? (t.marksObtained / t.maxMarks) * 100 : 0));
      testScoreComp = allTestPcts.reduce((a, b) => a + b, 0) / totalTests;
    }

    // Accuracy component (15%)
    let accuracyComp = testScoreComp;
    const testsWithAtt = tests.filter((t) => (t.correctAnswers || 0) + (t.incorrectAnswers || 0) > 0);
    if (testsWithAtt.length > 0) {
      const accSum = testsWithAtt.reduce((acc, t) => {
        const corr = t.correctAnswers || 0;
        const inc = t.incorrectAnswers || 0;
        return acc + (corr / (corr + inc)) * 100;
      }, 0);
      accuracyComp = accSum / testsWithAtt.length;
    }

    // Syllabus coverage component (25%)
    const syllabusComp = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 30;

    // VVI completion component (15%)
    const vviComp = totalVVI > 0 ? (completedVVI / totalVVI) * 100 : 40;

    // Revision completion component (10%)
    const revComp = totalRev > 0 ? (completedRev / totalRev) * 100 : 40;

    overallReadinessScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          testScoreComp * 0.35 +
            accuracyComp * 0.15 +
            syllabusComp * 0.25 +
            vviComp * 0.15 +
            revComp * 0.10
        )
      )
    );

    if (overallReadinessScore >= 80) readinessCategory = "Strong Preparation";
    else if (overallReadinessScore >= 60) readinessCategory = "Good Progress";
    else if (overallReadinessScore >= 40) readinessCategory = "Building";
    else readinessCategory = "Needs Attention";
  }

  // Next Best Action determination
  let nextBestAction = "Start your first test to unlock Exam Intelligence analysis.";
  if (uniqueWeakAreas.length > 0) {
    nextBestAction = uniqueWeakAreas[0].suggestedAction;
  } else if (totalTests === 0) {
    nextBestAction = "Log your first test score in the Exam Performance Center.";
  } else if (completedChapters < totalChapters) {
    nextBestAction = "Complete pending chapters to improve syllabus coverage.";
  } else if (completedVVI < totalVVI) {
    nextBestAction = "Review remaining VVI topics before your upcoming exams.";
  } else {
    nextBestAction = "Maintain your strong progress with regular mock test practice.";
  }

  // Latest test percentage
  let latestTestPercentage: number | null = null;
  if (tests.length > 0) {
    const sortedAllTests = [...tests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt);
    const lastT = sortedAllTests[sortedAllTests.length - 1];
    if (lastT.maxMarks > 0) {
      latestTestPercentage = Math.round((lastT.marksObtained / lastT.maxMarks) * 1000) / 10;
    }
  }

  return {
    overallReadinessScore,
    readinessCategory,
    hasSufficientData,
    totalTestsRecorded: totalTests,
    strongSubjects,
    weakSubjects,
    subjectAnalyses,
    weakAreas: uniqueWeakAreas,
    priorityTopics,
    recommendedRevisions,
    recommendedPractices,
    nextBestAction,
    latestTestPercentage,
    lastCalculatedAt: Date.now(),
  };
}
