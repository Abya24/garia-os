import {
  ExamProfile,
  ExamReadinessBreakdown,
  ExamReadinessStatus,
  AcademicSubject,
  AcademicChapter,
  AcademicTest,
  ExamMockTest,
  PreparationQueueItem,
  ExamRevisionItem,
  ExamDailyPlan,
  ExamPlanSlot,
  CareerRoadmap,
} from "../types";
import { getTodayString } from "./storage";

/**
 * 1. EXAM COUNTDOWN CALCULATOR
 */
export function calculateExamCountdown(profile: ExamProfile) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examStart = new Date(profile.startDate || "2026-02-15");
  examStart.setHours(0, 0, 0, 0);

  const diffTime = examStart.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let isExamPassed = false;
  let isExamOngoing = false;

  if (profile.endDate) {
    const examEnd = new Date(profile.endDate);
    examEnd.setHours(23, 59, 59, 999);
    if (today > examEnd) {
      isExamPassed = true;
    } else if (today >= examStart && today <= examEnd) {
      isExamOngoing = true;
    }
  } else if (daysRemaining < 0) {
    isExamPassed = true;
  } else if (daysRemaining === 0) {
    isExamOngoing = true;
  }

  return {
    daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    isExamPassed,
    isExamOngoing,
    formattedStartDate: new Date(profile.startDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

/**
 * 2. EXAM READINESS SCORE & BREAKDOWN (0 - 100)
 */
export function calculateExamReadiness(
  profile: ExamProfile,
  subjects: AcademicSubject[],
  chapters: AcademicChapter[],
  tests: (AcademicTest | ExamMockTest)[]
): ExamReadinessBreakdown {
  if (chapters.length === 0) {
    return {
      overallScore: 0,
      syllabusCompletion: 0,
      revisionScore: 0,
      pyqScore: 0,
      testScore: 0,
      weaknessScore: 0,
      proximityScore: 0,
      status: "🟡 Needs Attention",
    };
  }

  // A. Syllabus Completion (30% weight)
  const completedChapters = chapters.filter((c) => c.status === "Completed").length;
  const inProgressChapters = chapters.filter((c) => c.status === "In Progress").length;
  const vviCompleted = chapters.filter((c) => c.priority === "VVI" && c.status === "Completed").length;
  const totalVVI = chapters.filter((c) => c.priority === "VVI").length || 1;

  const baseSyllabus = ((completedChapters + inProgressChapters * 0.5) / chapters.length) * 100;
  const vviBonus = (vviCompleted / totalVVI) * 100;
  const syllabusCompletion = Math.min(100, Math.round(baseSyllabus * 0.8 + vviBonus * 0.2));

  // B. Revision Score (25% weight)
  const revisedOnce = chapters.filter((c) => c.revisionCount >= 1).length;
  const revisedTwice = chapters.filter((c) => c.revisionCount >= 2).length;
  const overdueCount = chapters.filter((c) => {
    if (!c.lastRevisedAt) return false;
    const daysSince = (Date.now() - c.lastRevisedAt) / (1000 * 60 * 60 * 24);
    return daysSince > 10;
  }).length;

  const rawRevision = ((revisedOnce * 0.7 + revisedTwice * 0.3) / chapters.length) * 100;
  const overduePenalty = Math.min(20, overdueCount * 4);
  const revisionScore = Math.max(0, Math.min(100, Math.round(rawRevision - overduePenalty)));

  // C. PYQ Score (20% weight)
  const pyqCompleted = chapters.filter((c) => c.pyqStatus === "Completed").length;
  const pyqScore = Math.round((pyqCompleted / chapters.length) * 100);

  // D. Test Score (15% weight)
  let testScore = 50; // Default neutral score when no tests recorded
  if (tests.length > 0) {
    const totalPercentage = tests.reduce((acc, t) => {
      const max = "maxMarks" in t ? t.maxMarks : 100;
      const obtained = "marksObtained" in t ? t.marksObtained : "score" in t ? (t as AcademicTest).score : 0;
      return acc + (obtained / (max || 1)) * 100;
    }, 0);
    testScore = Math.round(totalPercentage / tests.length);
  }

  // E. Weakness Resolution (10% weight)
  const weakChapters = chapters.filter((c) => c.isWeak).length;
  const nonWeakChapters = chapters.length - weakChapters;
  const weaknessScore = Math.round((nonWeakChapters / chapters.length) * 100);

  // F. Proximity Factor
  const countdown = calculateExamCountdown(profile);
  const proximityScore = countdown.daysRemaining > 60 ? 100 : Math.round((countdown.daysRemaining / 60) * 100);

  // Overall Weighted Score
  const overallScore = Math.round(
    syllabusCompletion * 0.3 +
      revisionScore * 0.25 +
      pyqScore * 0.2 +
      testScore * 0.15 +
      weaknessScore * 0.1
  );

  // Readiness Status
  let status: ExamReadinessStatus = "🟢 On Track";
  if (countdown.isExamPassed || countdown.isExamOngoing) {
    status = "🏁 Exam In Progress / Completed";
  } else if (overallScore >= 80) {
    status = "🟢 On Track";
  } else if (overallScore >= 65) {
    status = "🟡 Needs Attention";
  } else if (overallScore >= 50) {
    status = "🟠 Behind Schedule";
  } else {
    status = "🔴 Critical";
  }

  return {
    overallScore,
    syllabusCompletion,
    revisionScore,
    pyqScore,
    testScore,
    weaknessScore,
    proximityScore,
    status,
  };
}

/**
 * 3. INTELLIGENT PREPARATION QUEUE RANKER
 */
export function generatePreparationQueue(
  subjects: AcademicSubject[],
  chapters: AcademicChapter[],
  tests: (AcademicTest | ExamMockTest)[],
  careerRoadmap?: CareerRoadmap | null
): PreparationQueueItem[] {
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  // Find subjects matching career goal if applicable
  const careerSubjects = careerRoadmap?.careerTitle
    ? subjects.filter((s) => s.stream === careerRoadmap.stream).map((s) => s.id)
    : [];

  const queueItems: PreparationQueueItem[] = chapters.map((chap) => {
    let score = 0;
    const explanations: string[] = [];

    // Weakness (+35)
    if (chap.isWeak) {
      score += 35;
      explanations.push("Flagged as a weak topic");
    }

    // Priority (+30 for VVI, +15 for Important)
    if (chap.priority === "VVI") {
      score += 30;
      explanations.push("Very Very Important (VVI) exam weightage");
    } else if (chap.priority === "Important") {
      score += 15;
      explanations.push("High priority subject topic");
    }

    // PYQ Pending (+20)
    if (chap.pyqStatus === "Pending") {
      score += 20;
      explanations.push("Previous Year Questions (PYQs) pending");
    }

    // Uncompleted status (+15)
    if (chap.status === "Not Started") {
      score += 20;
      explanations.push("Not started yet in syllabus");
    } else if (chap.status === "In Progress") {
      score += 10;
      explanations.push("In progress — needs completion");
    }

    // Revision overdue (+25)
    if (chap.revisionCount === 0 && chap.status === "Completed") {
      score += 25;
      explanations.push("Completed but never revised");
    } else if (chap.lastRevisedAt) {
      const daysSince = (Date.now() - chap.lastRevisedAt) / (1000 * 60 * 60 * 24);
      if (daysSince > 10) {
        score += 20;
        explanations.push(`Last revised ${Math.round(daysSince)} days ago`);
      }
    }

    // Low test scores in this subject (+15)
    const subjectTests = tests.filter((t) => t.subjectId === chap.subjectId);
    if (subjectTests.length > 0) {
      const avg =
        subjectTests.reduce((acc, t) => {
          const max = "maxMarks" in t ? t.maxMarks : 100;
          const ob = "marksObtained" in t ? t.marksObtained : "score" in t ? (t as AcademicTest).score : 0;
          return acc + (ob / (max || 1)) * 100;
        }, 0) / subjectTests.length;
      if (avg < 60) {
        score += 15;
        explanations.push(`Subject test average is ${Math.round(avg)}%`);
      }
    }

    // Career Alignment (+10)
    if (careerSubjects.includes(chap.subjectId)) {
      score += 10;
      explanations.push("Core subject for target career pathway");
    }

    // Priority Category
    let priority: PreparationQueueItem["priority"] = "✅ On Track";
    if (score >= 70) {
      priority = "🚨 Urgent Focus";
    } else if (score >= 50) {
      priority = "🔥 High Priority";
    } else if (score >= 30) {
      priority = "⚡ Medium Priority";
    }

    return {
      chapterId: chap.id,
      subjectId: chap.subjectId,
      subjectName: subjectMap.get(chap.subjectId) || "General Subject",
      chapterTitle: chap.title,
      priority,
      score,
      explanations,
    };
  });

  return queueItems.sort((a, b) => b.score - a.score);
}

/**
 * 4. SUBJECT READINESS BREAKDOWN
 */
export function generateSubjectReadinessList(
  subjects: AcademicSubject[],
  chapters: AcademicChapter[],
  tests: (AcademicTest | ExamMockTest)[]
) {
  return subjects.map((subj) => {
    const subjChapters = chapters.filter((c) => c.subjectId === subj.id);
    const total = subjChapters.length || 1;
    const completed = subjChapters.filter((c) => c.status === "Completed").length;
    const pyq = subjChapters.filter((c) => c.pyqStatus === "Completed").length;
    const revised = subjChapters.filter((c) => c.revisionCount >= 1).length;
    const weak = subjChapters.filter((c) => c.isWeak).length;

    const subjTests = tests.filter((t) => t.subjectId === subj.id);
    let testAvg = 0;
    if (subjTests.length > 0) {
      testAvg = Math.round(
        subjTests.reduce((acc, t) => {
          const max = "maxMarks" in t ? t.maxMarks : 100;
          const ob = "marksObtained" in t ? t.marksObtained : "score" in t ? (t as AcademicTest).score : 0;
          return acc + (ob / (max || 1)) * 100;
        }, 0) / subjTests.length
      );
    }

    const syllabusPct = Math.round((completed / total) * 100);
    const pyqPct = Math.round((pyq / total) * 100);
    const revPct = Math.round((revised / total) * 100);

    const readinessScore = Math.min(
      100,
      Math.round(syllabusPct * 0.4 + pyqPct * 0.25 + revPct * 0.2 + (subjTests.length > 0 ? testAvg * 0.15 : 15))
    );

    return {
      subjectId: subj.id,
      subjectName: subj.name,
      color: subj.color,
      totalChapters: total,
      completedChapters: completed,
      weakChaptersCount: weak,
      syllabusPct,
      pyqPct,
      revPct,
      testAvg,
      readinessScore,
    };
  });
}

/**
 * 5. SMART REVISION SCHEDULER QUEUE
 */
export function generateExamRevisionQueue(
  subjects: AcademicSubject[],
  chapters: AcademicChapter[]
): ExamRevisionItem[] {
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  return chapters
    .map((chap) => {
      let status: ExamRevisionItem["status"] = "✅ Not due";

      if (chap.status === "Completed") {
        if (!chap.lastRevisedAt) {
          status = "🔥 Due";
        } else {
          const daysSince = (Date.now() - chap.lastRevisedAt) / (1000 * 60 * 60 * 24);
          if (daysSince > 14) {
            status = "🚨 Overdue";
          } else if (daysSince > 7) {
            status = "🔥 Due";
          } else if (daysSince > 4) {
            status = "⚡ Due soon";
          }
        }
      } else if (chap.isWeak) {
        status = "⚡ Due soon";
      }

      return {
        chapterId: chap.id,
        subjectId: chap.subjectId,
        subjectName: subjectMap.get(chap.subjectId) || "Subject",
        chapterTitle: chap.title,
        revisionCount: chap.revisionCount || 0,
        lastRevisedAt: chap.lastRevisedAt,
        nextRevisionDue: chap.nextRevisionDue,
        status,
      };
    })
    .filter((item) => item.status !== "✅ Not due")
    .sort((a, b) => {
      const pMap = { "🚨 Overdue": 4, "🔥 Due": 3, "⚡ Due soon": 2, "✅ Not due": 1 };
      return pMap[b.status] - pMap[a.status];
    });
}

/**
 * 6. WEAKNESS TOPICS DETECTOR
 */
export function detectWeaknessTopics(
  subjects: AcademicSubject[],
  chapters: AcademicChapter[],
  tests: (AcademicTest | ExamMockTest)[]
) {
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  const weakTopics: {
    chapterId: string;
    subjectName: string;
    chapterTitle: string;
    reason: string;
    recommendation: string;
  }[] = [];

  chapters.forEach((chap) => {
    if (chap.isWeak) {
      weakTopics.push({
        chapterId: chap.id,
        subjectName: subjectMap.get(chap.subjectId) || "Subject",
        chapterTitle: chap.title,
        reason: "Self-flagged concept needs attention",
        recommendation: "Review key theory notes and solve 5 basic practice questions",
      });
    } else if (chap.priority === "VVI" && chap.pyqStatus === "Pending") {
      weakTopics.push({
        chapterId: chap.id,
        subjectName: subjectMap.get(chap.subjectId) || "Subject",
        chapterTitle: chap.title,
        reason: "VVI Exam weightage with pending PYQ practice",
        recommendation: "Solve 3-5 previous year board questions for this chapter",
      });
    }
  });

  return weakTopics;
}

/**
 * 7. EXAM STUDY PLAN GENERATOR
 */
export function generateExamStudyPlan(
  profile: ExamProfile,
  subjects: AcademicSubject[],
  chapters: AcademicChapter[],
  tests: (AcademicTest | ExamMockTest)[]
): ExamDailyPlan {
  const totalHours = profile.dailyStudyHours || 5;
  const queue = generatePreparationQueue(subjects, chapters, tests);

  const timeSlots = [
    "07:00 - 08:30",
    "09:00 - 10:30",
    "11:00 - 12:00",
    "14:00 - 15:30",
    "16:00 - 17:00",
    "19:00 - 20:30",
    "21:00 - 22:00",
  ];

  const slots: ExamPlanSlot[] = [];
  let slotIndex = 0;

  // 1. Concept Study Slot (High priority from queue)
  const top1 = queue[0];
  if (top1 && slotIndex < timeSlots.length) {
    slots.push({
      id: `esp-${Date.now()}-1`,
      timeSlot: timeSlots[slotIndex++],
      activity: "Concept Study",
      subjectName: top1.subjectName,
      chapterTitle: top1.chapterTitle,
      priority: top1.priority,
      explanation: top1.explanations[0] || "Core priority topic for deep concept mastery",
    });
  }

  // 2. PYQ Practice Slot
  const pyqTarget = queue.find((q) => q.explanations.some((e) => e.includes("PYQ")));
  if (pyqTarget && slotIndex < timeSlots.length) {
    slots.push({
      id: `esp-${Date.now()}-2`,
      timeSlot: timeSlots[slotIndex++],
      activity: "PYQ Practice",
      subjectName: pyqTarget.subjectName,
      chapterTitle: pyqTarget.chapterTitle,
      priority: "🔥 High Priority",
      explanation: "Practice previous year board questions and check step marking",
    });
  }

  // 3. Short Refresh Break
  if (slotIndex < timeSlots.length) {
    slots.push({
      id: `esp-${Date.now()}-3`,
      timeSlot: timeSlots[slotIndex++],
      activity: "Break",
      subjectName: "Rest & Hydration",
      chapterTitle: "Take a walk or drink water",
      priority: "✅ On Track",
      explanation: "Active rest keeps focus sharp for long study sessions",
    });
  }

  // 4. Memory & Revision Slot
  const top2 = queue[1] || top1;
  if (top2 && slotIndex < timeSlots.length) {
    slots.push({
      id: `esp-${Date.now()}-4`,
      timeSlot: timeSlots[slotIndex++],
      activity: "Revision",
      subjectName: top2.subjectName,
      chapterTitle: top2.chapterTitle,
      priority: top2.priority,
      explanation: "High-speed active recall of key definitions, formulas & diagrams",
    });
  }

  // 5. Mock / Test Practice or Buffer Time
  if (slotIndex < timeSlots.length) {
    slots.push({
      id: `esp-${Date.now()}-5`,
      timeSlot: timeSlots[slotIndex++],
      activity: "Mock Test",
      subjectName: subjects[0]?.name || "Core Subject",
      chapterTitle: "Timed Practice Test / Quiz",
      priority: "⚡ Medium Priority",
      explanation: "Build speed, accuracy, and exam time management",
    });
  }

  // 6. Flexible Buffer Time
  if (slotIndex < timeSlots.length && totalHours >= 6) {
    slots.push({
      id: `esp-${Date.now()}-6`,
      timeSlot: timeSlots[slotIndex++],
      activity: "Buffer Time",
      subjectName: "Review & Backlog Clearance",
      chapterTitle: "Catch up on remaining tasks",
      priority: "✅ On Track",
      explanation: "Flexible time reserved for unresolved study questions",
    });
  }

  return {
    id: `plan-${Date.now()}`,
    generatedDate: getTodayString(),
    dailyHours: totalHours,
    slots,
  };
}
