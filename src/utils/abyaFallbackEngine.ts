import {
  StudentProfile,
  Task,
  AcademicSubject,
  AcademicChapter,
  AcademicTest,
  ExamProfile,
  ExamMockTest,
  CareerProfile,
  CareerRoadmap,
  AbyaInsightCard,
  AbyaQuickActionType,
} from "../types";
import {
  CurriculumSubject,
  BoardCurriculumHierarchy,
  getBoardCurriculumHierarchy,
  normalizeCurriculumBoard,
  normalizeVerificationStatus,
} from "../data/masterCurriculum";
import {
  generateUnifiedAdaptiveState,
  loadProfileMistakes,
} from "./adaptiveStudyEngine";
import {
  generateLearningEffectivenessReport,
  loadEnhancedMistakes,
} from "./learningEffectivenessEngine";
import {
  generateExamStrategyReport,
} from "./examStrategyEngine";
import {
  buildAdaptivePracticeSession,
  calculatePracticeEffectiveness,
  loadStudentPracticeAttempts,
  analyzePracticeCoverage,
} from "./adaptivePracticeEngine";

/**
 * Formats an honest, source-aware curriculum disclosure for Abya AI responses.
 * Never claims official board verification when status is SOURCE-REQUIRED, PARTIALLY-VERIFIED, SOURCE-CONFLICT, or OUTDATED.
 */
export function formatAbyaCurriculumSourceDisclosure(params: {
  board: string;
  classLevel: string;
  stream: string;
  academicYear?: string;
  subject?: CurriculumSubject;
  hierarchy?: BoardCurriculumHierarchy;
}): string {
  const normalizedBoard = normalizeCurriculumBoard(params.board);
  const rawStatus =
    params.subject?.verificationStatus ||
    params.hierarchy?.verificationStatus ||
    "SOURCE-REQUIRED";
  const status = normalizeVerificationStatus(rawStatus, "SOURCE-REQUIRED");
  const year =
    params.subject?.academicYear ||
    params.hierarchy?.academicYear ||
    "2026-27";
  const prov = params.subject?.provenance || params.hierarchy?.provenance;

  if (status === "VERIFIED" && prov) {
    return `✅ **Curriculum Status:** VERIFIED (${prov.authority} • ${prov.documentTitle} • Academic Year ${year})`;
  }
  if (status === "PARTIALLY-VERIFIED") {
    return `🌓 **Curriculum Status:** PARTIALLY-VERIFIED (${year}) — Core chapter structure is aligned (${prov?.documentTitle || normalizedBoard}), while remaining chapter/blueprint details are still unverified pending official ${normalizedBoard} notifications.`;
  }
  if (status === "SOURCE-CONFLICT") {
    return `⚠️ **Curriculum Status:** SOURCE-CONFLICT (${year}) — Based on your current ${params.stream} study curriculum in Garia OS. Conflicting syllabus references were detected; please confirm final chapter updates with official ${normalizedBoard} notifications.`;
  }
  if (status === "OUTDATED") {
    return `⚠️ **Curriculum Status:** OUTDATED (${year}) — Based on your current ${params.stream} study curriculum in Garia OS. This reference belongs to an older academic session; please confirm final board syllabus updates with official ${normalizedBoard} notifications.`;
  }
  if (prov?.curriculumContentSupported && prov.documentTitle) {
    return `ℹ️ **Curriculum Status:** ${status} (${year} • Official Textbook Evidence: ${prov.authority} — ${prov.documentTitle}, ${prov.resourceAcademicYear || "Historical Edition"}) — Based on your current ${params.stream} study curriculum in Garia OS and from your important revision priorities. Chapter content is supported by the official textbook edition, while 2026-27 exam applicability remains unverified; practice these core topics and confirm final board syllabus updates with official ${normalizedBoard} notifications.`;
  }
  if (prov?.officialResourceConfirmed && prov.documentTitle) {
    return `ℹ️ **Curriculum Status:** ${status} (${year} • Official Resource Cataloged: ${prov.authority} — ${prov.documentTitle}) — Based on your current ${params.stream} study curriculum in Garia OS and from your important revision priorities. Official ${prov.authority} resource identity is cataloged, while chapter-level text and 2026-27 syllabus applicability remain unverified; practice these core topics and confirm final board syllabus updates with official ${normalizedBoard} notifications.`;
  }
  return `ℹ️ **Curriculum Status:** ${status} (${year}) — Based on your current ${params.stream} study curriculum in Garia OS and from your important revision priorities. Practice these core topics and confirm final board syllabus updates with official ${normalizedBoard} notifications.`;
}

interface ActiveStudentData {
  profile?: StudentProfile | null;
  tasks?: Task[];
  subjects?: AcademicSubject[];
  chapters?: AcademicChapter[];
  tests?: AcademicTest[];
  examProfile?: ExamProfile;
  mockTests?: ExamMockTest[];
  careerProfile?: CareerProfile;
  careerRoadmap?: CareerRoadmap;
  daysRemaining?: number;
  readinessScore?: number;
}

/**
 * Generates compact, actionable Abya Insight Cards for the Active Student
 */
export const generateAbyaInsightCards = (
  data: ActiveStudentData
): AbyaInsightCard[] => {
  const cards: AbyaInsightCard[] = [];
  const {
    chapters = [],
    tests = [],
    mockTests = [],
    examProfile = {
      id: "exam-default",
      examName: "Board Exam",
      board: "CBSE",
      classLevel: "Class 12",
      stream: "Commerce",
      targetDate: "",
      targetScore: 90,
      dailyStudyHours: 4,
      notes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    careerRoadmap = {
      id: "roadmap-default",
      careerTitle: "General Higher Studies",
      milestones: [],
      targetYear: new Date().getFullYear() + 2,
      strategySummary: "",
      generatedAt: Date.now(),
    },
    daysRemaining = 60,
    readinessScore = 70,
  } = data || {};

  // 1. 🔥 Priority Card (Weak or VVI Chapter)
  const priorityChapter = chapters.find((c) => c.isWeak || c.priority === "VVI");
  if (priorityChapter) {
    cards.push({
      id: "card-priority",
      type: "priority",
      title: "🔥 High Priority Focus",
      recommendation: `"${priorityChapter.title}" needs immediate focus`,
      reason: priorityChapter.isWeak
        ? "Marked as weak topic requiring extra conceptual practice."
        : "Application-derived high-priority (VVI) chapter in your Garia OS study curriculum.",
      actionText: "Study Topic",
      actionTab: "study",
    });
  } else {
    cards.push({
      id: "card-priority",
      type: "priority",
      title: "🔥 Daily Priority",
      recommendation: "All chapters currently on track!",
      reason: "Continue maintaining regular chapter completion and practice.",
      actionText: "Study Tracker",
      actionTab: "study",
    });
  }

  // 2. 🔄 Revision Card
  const overdueChapter = chapters.find(
    (c) => c.revisionCount === 0 || (c.status === "In Progress" && c.isWeak)
  );
  if (overdueChapter) {
    cards.push({
      id: "card-revision",
      type: "revision",
      title: "🔄 Revision Due",
      recommendation: `Revise "${overdueChapter.title}"`,
      reason:
        overdueChapter.revisionCount === 0
          ? "No revision logged yet for this chapter."
          : "Needs spaced repetition to reinforce concepts.",
      actionText: "Study Session",
      actionTab: "study",
    });
  }

  // 3. 📝 Test Card
  const allTestsCount = tests.length + mockTests.length;
  if (allTestsCount > 0) {
    const totalScorePct =
      [
        ...tests.map((t) => (t.score / (t.maxMarks || 1)) * 100),
        ...mockTests.map((m) => (m.marksObtained / (m.maxMarks || 1)) * 100),
      ].reduce((a, b) => a + b, 0) / allTestsCount;

    cards.push({
      id: "card-test",
      type: "test",
      title: "📝 Test Performance",
      recommendation: `Average Test Score: ${Math.round(totalScorePct)}%`,
      reason:
        totalScorePct >= 75
          ? "Strong test performance! Keep practicing PYQs."
          : "Needs more practice in mock tests to boost confidence.",
      actionText: "View Tests",
      actionTab: "exam",
    });
  } else {
    cards.push({
      id: "card-test",
      type: "test",
      title: "📝 Test Analyst",
      recommendation: "No test records logged yet",
      reason: "Log a mock test or unit quiz to unlock AI performance analytics.",
      actionText: "Log Test",
      actionTab: "exam",
    });
  }

  // 4. 🏆 Exam Card
  cards.push({
    id: "card-exam",
    type: "exam",
    title: "🏆 Exam Readiness",
    recommendation: `${daysRemaining} Days to ${examProfile.board} ${examProfile.classLevel} Exam`,
    reason: `Current Readiness Score: ${readinessScore}%. Target study: ${examProfile.dailyStudyHours} hrs/day.`,
    actionText: "Exam Planner",
    actionTab: "exam",
  });

  // 5. 🎯 Career Card
  const targetCareer = careerRoadmap.careerTitle || "General Higher Studies";
  const completedMilestones = careerRoadmap.milestones.filter(
    (m) => m.completed
  ).length;
  cards.push({
    id: "card-career",
    type: "career",
    title: "🎯 Career Goal",
    recommendation: `Target Career: ${targetCareer}`,
    reason: `${completedMilestones} of ${
      careerRoadmap.milestones.length || 1
    } career milestones completed.`,
    actionText: "Career Center",
    actionTab: "career",
  });

  return cards;
};

/**
 * Study Mentor Local Intelligence Fallback Generator for Abya AI
 * Used exclusively when Online AI is temporarily unreachable (offline, timeout, API error, rate limit).
 * Delivers warm, student-friendly, actionable mentor guidance in conversational Hindi + English mix.
 */
export const generateAbyaFallbackResponse = (
  actionType: AbyaQuickActionType | "general",
  userPrompt: string,
  data: ActiveStudentData
): string => {
  const {
    profile,
    tasks = [],
    subjects = [],
    chapters = [],
    tests = [],
    mockTests = [],
    examProfile = {
      id: "exam-default",
      examName: "Board Exam",
      board: "CBSE",
      classLevel: "Class 12",
      stream: "Commerce",
      targetDate: "",
      targetScore: 90,
      dailyStudyHours: 4,
      notes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    daysRemaining = 60,
    readinessScore = 70,
  } = data || {};

  const profileName = profile?.name || "Student";
  const profileClass = profile?.classLevel || examProfile.classLevel || "Class 12";
  const profileStream = profile?.stream || examProfile.stream || "General";
  const rawBoard = profile?.board || examProfile.board || "CBSE";
  const lowerPromptRaw = (userPrompt || "").toLowerCase();
  const explicitBoardInPrompt = lowerPromptRaw.includes("bseb") || lowerPromptRaw.includes("bihar board")
    ? "BSEB"
    : lowerPromptRaw.includes("up board")
    ? "UP Board"
    : lowerPromptRaw.includes("mp board")
    ? "MP Board"
    : lowerPromptRaw.includes("icse") || lowerPromptRaw.includes("isc")
    ? "ICSE"
    : undefined;
  const profileBoard = normalizeCurriculumBoard(explicitBoardInPrompt || rawBoard);
  const boardHierarchy = getBoardCurriculumHierarchy(profileBoard, profileClass, profileStream);
  const boardPatternNote = boardHierarchy.boardMetadata.examPatternSummary;
  const hierarchyDisclosure = formatAbyaCurriculumSourceDisclosure({
    board: profileBoard,
    classLevel: profileClass,
    stream: profileStream,
    academicYear: boardHierarchy.academicYear,
    hierarchy: boardHierarchy,
  });

  // Natural-language Hindi / Hinglish / English intent routing when actionType === "general"
  let effectiveAction: AbyaQuickActionType | "general" = actionType;
  if (effectiveAction === "general" && lowerPromptRaw.length > 2) {
    if (
      lowerPromptRaw.includes("what should i practice today") ||
      lowerPromptRaw.includes("what should i practice") ||
      lowerPromptRaw.includes("give me practice questions") ||
      lowerPromptRaw.includes("practice questions") ||
      lowerPromptRaw.includes("what to practice") ||
      lowerPromptRaw.includes("kya practice karu")
    ) {
      effectiveAction = "what_should_i_practice" as any;
    } else if (
      lowerPromptRaw.includes("practice my weak topics") ||
      lowerPromptRaw.includes("weak topic practice") ||
      lowerPromptRaw.includes("kamzor topic practice")
    ) {
      effectiveAction = "practice_weak_topics" as any;
    } else if (
      lowerPromptRaw.includes("practice my mistakes") ||
      lowerPromptRaw.includes("i keep getting this topic wrong") ||
      lowerPromptRaw.includes("galti practice") ||
      lowerPromptRaw.includes("mistake recovery practice")
    ) {
      effectiveAction = "practice_my_mistakes" as any;
    } else if (
      lowerPromptRaw.includes("why did you select this question") ||
      lowerPromptRaw.includes("why this question") ||
      lowerPromptRaw.includes("yeh question kyu")
    ) {
      effectiveAction = "why_selected_question" as any;
    } else if (
      lowerPromptRaw.includes("give me a 30 minute practice") ||
      lowerPromptRaw.includes("30 min practice") ||
      lowerPromptRaw.includes("quick practice")
    ) {
      effectiveAction = "quick_30m_practice" as any;
    } else if (
      lowerPromptRaw.includes("test me on this chapter") ||
      lowerPromptRaw.includes("chapter practice")
    ) {
      effectiveAction = "test_me_chapter" as any;
    } else if (
      lowerPromptRaw.includes("what should i revise before practicing") ||
      lowerPromptRaw.includes("revise before practice")
    ) {
      effectiveAction = "what_to_revise_before_practice" as any;
    } else if (
      lowerPromptRaw.includes("practice coverage") ||
      lowerPromptRaw.includes("how much have i practiced") ||
      lowerPromptRaw.includes("kitna practice hua") ||
      lowerPromptRaw.includes("syllabus practice coverage")
    ) {
      effectiveAction = "practice_coverage" as any;
    } else if (
      lowerPromptRaw.includes("is practice helping") ||
      lowerPromptRaw.includes("is my practice improving") ||
      lowerPromptRaw.includes("practice se score badhega") ||
      lowerPromptRaw.includes("practice effectiveness")
    ) {
      effectiveAction = "is_practice_helping" as any;
    } else if (
      lowerPromptRaw.includes("improve my mock score") ||
      lowerPromptRaw.includes("improve score") ||
      lowerPromptRaw.includes("mock score kaise badhaye")
    ) {
      effectiveAction = "mock_score_improvement" as any;
    } else if (
      lowerPromptRaw.includes("losing marks") ||
      lowerPromptRaw.includes("marks loss") ||
      lowerPromptRaw.includes("marks kahan kat rahe") ||
      lowerPromptRaw.includes("where am i losing marks")
    ) {
      effectiveAction = "marks_loss_analysis" as any;
    } else if (
      lowerPromptRaw.includes("before my exam") ||
      lowerPromptRaw.includes("what should i do before my exam") ||
      lowerPromptRaw.includes("exam se pehle kya")
    ) {
      effectiveAction = "before_exam_strategy" as any;
    } else if (
      lowerPromptRaw.includes("how should i attempt my paper") ||
      lowerPromptRaw.includes("attempt my paper") ||
      lowerPromptRaw.includes("paper attempt") ||
      lowerPromptRaw.includes("paper kaise attempt")
    ) {
      effectiveAction = "paper_attempt_strategy" as any;
    } else if (
      lowerPromptRaw.includes("which chapters can improve my score") ||
      lowerPromptRaw.includes("chapters can improve my score") ||
      lowerPromptRaw.includes("chapters improve")
    ) {
      effectiveAction = "chapter_score_opportunity" as any;
    } else if (
      lowerPromptRaw.includes("why did my mock score fall") ||
      lowerPromptRaw.includes("mock score fall") ||
      lowerPromptRaw.includes("score kyu gira") ||
      lowerPromptRaw.includes("why did my score drop")
    ) {
      effectiveAction = "mock_score_drop" as any;
    } else if (
      lowerPromptRaw.includes("what mistakes are costing me marks") ||
      lowerPromptRaw.includes("costing me marks") ||
      lowerPromptRaw.includes("mistakes costing")
    ) {
      effectiveAction = "costly_mistakes" as any;
    } else if (
      lowerPromptRaw.includes("manage my time") ||
      lowerPromptRaw.includes("manage time") ||
      lowerPromptRaw.includes("time management") ||
      lowerPromptRaw.includes("exam me time")
    ) {
      effectiveAction = "exam_time_management" as any;
    } else if (
      lowerPromptRaw.includes("make my exam strategy") ||
      lowerPromptRaw.includes("make exam strategy") ||
      lowerPromptRaw.includes("exam strategy") ||
      lowerPromptRaw.includes("strategy banao")
    ) {
      effectiveAction = "make_exam_strategy" as any;
    } else if (
      lowerPromptRaw.includes("analyze my latest mock") ||
      lowerPromptRaw.includes("analyze latest mock") ||
      lowerPromptRaw.includes("latest mock analysis") ||
      lowerPromptRaw.includes("latest mock")
    ) {
      effectiveAction = "latest_mock_analysis" as any;
    } else if (
      lowerPromptRaw.includes("improving") ||
      lowerPromptRaw.includes("kya main improve") ||
      lowerPromptRaw.includes("am i improving") ||
      lowerPromptRaw.includes("actually improving")
    ) {
      effectiveAction = "improving_check" as any;
    } else if (
      lowerPromptRaw.includes("revision help") ||
      lowerPromptRaw.includes("revision se fayda") ||
      lowerPromptRaw.includes("did my revision help")
    ) {
      effectiveAction = "revision_effectiveness" as any;
    } else if (
      lowerPromptRaw.includes("performance drop") ||
      lowerPromptRaw.includes("performance kyu gir") ||
      lowerPromptRaw.includes("why is my performance dropping")
    ) {
      effectiveAction = "performance_drop_check" as any;
    } else if (
      lowerPromptRaw.includes("which subject needs attention") ||
      lowerPromptRaw.includes("kaunse subject par dhyan")
    ) {
      effectiveAction = "subject_attention" as any;
    } else if (
      lowerPromptRaw.includes("what should i study") ||
      lowerPromptRaw.includes("what should i do") ||
      lowerPromptRaw.includes("abhi kya") ||
      lowerPromptRaw.includes("kya karna chahiye") ||
      lowerPromptRaw.includes("what to do now")
    ) {
      effectiveAction = "what_should_i_do_now" as any;
    } else if (
      lowerPromptRaw.includes("mistake") ||
      lowerPromptRaw.includes("galti") ||
      lowerPromptRaw.includes("wrong answer")
    ) {
      effectiveAction = "mistake_review" as any;
    } else if (
      lowerPromptRaw.includes("this week") ||
      lowerPromptRaw.includes("weekly focus") ||
      lowerPromptRaw.includes("weekly review") ||
      lowerPromptRaw.includes("is hafte")
    ) {
      effectiveAction = "weekly_focus" as any;
    } else if (
      lowerPromptRaw.includes("aaj kya padh") ||
      lowerPromptRaw.includes("aaj ka plan") ||
      lowerPromptRaw.includes("today study plan") ||
      lowerPromptRaw.includes("kya padhna chahiye")
    ) {
      effectiveAction = "study_plan";
    } else if (
      lowerPromptRaw.includes("weak subject") ||
      lowerPromptRaw.includes("kamzor subject") ||
      lowerPromptRaw.includes("weak topic") ||
      lowerPromptRaw.includes("kaunsa subject weak")
    ) {
      effectiveAction = "weak_topics";
    } else if (
      lowerPromptRaw.includes("kya revise karu") ||
      lowerPromptRaw.includes("exam se pehle kya revise") ||
      lowerPromptRaw.includes("revision queue") ||
      lowerPromptRaw.includes("revise")
    ) {
      effectiveAction = "revision_plan";
    }
  }

  switch (effectiveAction as string) {
    case "what_should_i_practice": {
      const p7Session = buildAdaptivePracticeSession({
        config: {
          profileId: profile?.id || "default",
          durationMinutes: 30,
          mode: "BALANCED",
        },
        context: {
          student: profile,
          academicSubjects: subjects as any,
          academicChapters: chapters,
          enhancedMistakes: loadEnhancedMistakes(profile?.id || "default"),
        },
      });
      if (p7Session.totalQuestions === 0) {
        return `Namaste ${profileName}! Abhi enough practice data nahi hai. Question Bank me jakar syllabus topics par practice start karein!`;
      }
      return `Namaste ${profileName}! 🎯 **Adaptive Practice Recommendations (Next Best Questions):**\n\n${p7Session.allQuestions.slice(0, 3).map((q, idx) => `• **#${idx + 1} ${q.question.subjectName} — ${q.question.chapterTitle}**\n   - *Topic:* ${q.question.topicName || q.question.chapterTitle} (${q.estimatedTimeMinutes}m)\n   - *Why Selected:* ${q.scoreBreakdown.selectionReason}\n   - *Provenance:* ${q.question.provenanceType}`).join("\n\n")}\n\n*${p7Session.honestDisclaimer}*`;
    }

    case "practice_weak_topics": {
      const p7Session = buildAdaptivePracticeSession({
        config: {
          profileId: profile?.id || "default",
          durationMinutes: 30,
          mode: "WEAK_TOPIC",
        },
        context: {
          student: profile,
          academicSubjects: subjects as any,
          academicChapters: chapters,
          enhancedMistakes: loadEnhancedMistakes(profile?.id || "default"),
        },
      });
      if (p7Session.totalQuestions === 0) {
        return `Namaste ${profileName}! Abhi enough practice data nahi hai weak topics identify karne ke liye. Regular practice sessions log karein!`;
      }
      return `Namaste ${profileName}! 🔍 **Weak-Topic Targeted Practice Drill:**\n\n${p7Session.allQuestions.slice(0, 3).map((q, idx) => `• **${q.question.chapterTitle}** (${q.question.subjectName})\n   - *Adaptive Focus:* ${q.scoreBreakdown.selectionReason}`).join("\n")}\n\n*Start a focused 20-30m practice sprint in Exam Center!*`;
    }

    case "practice_my_mistakes": {
      const mistakes = loadEnhancedMistakes(profile?.id || "default");
      const unresolved = mistakes.filter((m) => m.lifecycleStatus !== "Corrected");
      if (unresolved.length === 0) {
        return `Namaste ${profileName}! Great news: All your logged mistakes are resolved or no unresolved errors recorded yet. Practice balanced questions to maintain retention!`;
      }
      return `Namaste ${profileName}! ⚠️ **Mistake Recovery Practice Priority:**\n\n${unresolved.slice(0, 3).map((m, idx) => `• **#${idx + 1} ${m.chapterTitle}** (${m.subjectName})\n   - *Concept/Error:* "${m.questionText.slice(0, 70)}..."\n   - *Type:* ${m.mistakeType} (Retries: ${m.retryCount})`).join("\n\n")}\n\n*Retry these specific questions in Mistake Intelligence to convert them to 'Corrected'!*`;
    }

    case "why_selected_question": {
      return `Namaste ${profileName}! 💡 **How Garia OS Selects Questions Adaptively:**\n\n1. **Topic Weakness (35%):** Prioritizes chapters where your accuracy is below 60%.\n2. **Mistake Recurrence (30%):** Flags questions connected to unresolved or repeated slips.\n3. **Exam Strategy (25%):** Aligns with P6 marks-loss targets (e.g. calculation slips or concept gaps).\n4. **Revision Cadence (20%):** Surfaces topics overdue for active recall.\n5. **Coverage Gaps (15%):** Ensures no curriculum chapter remains completely untouched.\n\n*Application-derived evidence model with zero arbitrary probability claims.*`;
    }

    case "quick_30m_practice": {
      const p7Session = buildAdaptivePracticeSession({
        config: {
          profileId: profile?.id || "default",
          durationMinutes: 30,
          mode: "QUICK_PRACTICE",
        },
        context: {
          student: profile,
          academicSubjects: subjects as any,
          academicChapters: chapters,
          enhancedMistakes: loadEnhancedMistakes(profile?.id || "default"),
        },
      });
      return `Namaste ${profileName}! ⏱️ **Your 30-Minute Adaptive Practice Plan:**\n\n• ⚡ **Must Practice (~15m):**\n${(p7Session.mustPractice.length > 0 ? p7Session.mustPractice : p7Session.allQuestions.slice(0, 2)).map((q) => `   - ${q.question.chapterTitle} (${q.question.subjectName})`).join("\n")}\n• 📚 **Should Practice (~15m):**\n${(p7Session.shouldPractice.length > 0 ? p7Session.shouldPractice : p7Session.allQuestions.slice(2, 4)).map((q) => `   - ${q.question.chapterTitle}`).join("\n")}\n\n*${p7Session.honestDisclaimer}*`;
    }

    case "test_me_chapter": {
      return `Namaste ${profileName}! 📝 Open **Exam Center -> Adaptive Practice** ya **Question Bank** to start a timed chapter test with instant answer evaluation and explanation breakdown!`;
    }

    case "what_to_revise_before_practice": {
      const mistakes = loadEnhancedMistakes(profile?.id || "default");
      const topIssues = mistakes.slice(0, 2).map((m) => `${m.chapterTitle} (${m.mistakeType})`);
      return `Namaste ${profileName}! 📖 **Pre-Practice Revision Recommendations:**\n\n• 📌 Review formula notes and definitions on: ${topIssues.length > 0 ? topIssues.join(", ") : "your high-priority syllabus topics"}.\n• ✍️ Keep rough work organized for numerical calculations.\n• 🎯 Read each question stem carefully before selecting your option.`;
    }

    case "practice_coverage": {
      const attempts = loadStudentPracticeAttempts(profile?.id || "default");
      const cov = analyzePracticeCoverage({
        attempts,
        classLevel: profile?.classLevel || "Class 12",
        stream: profile?.stream || "Commerce",
      });
      return `Namaste ${profileName}! 📊 **Practice Coverage Intelligence:**\n\n• 🎯 **Coverage:** ${cov.coveragePercentage}% (${cov.practicedTopicsCount} of ${cov.totalAvailableTopics} topics attempted)\n• 🔍 **Low Coverage Chapters:**\n${cov.lowCoverageChapters.slice(0, 3).map((ch) => `   - ${ch}`).join("\n")}\n\n*${cov.unevenSubjectsAlerts.length > 0 ? cov.unevenSubjectsAlerts[0] : "Maintain balanced practice across all syllabus chapters!"}*`;
    }

    case "is_practice_helping": {
      const attempts = loadStudentPracticeAttempts(profile?.id || "default");
      const mistakes = loadEnhancedMistakes(profile?.id || "default");
      const eff = calculatePracticeEffectiveness({
        attempts,
        enhancedMistakes: mistakes,
      });
      if (eff.totalQuestionsAttempted === 0) {
        return `Namaste ${profileName}! Abhi mere paas enough practice data nahi hai. Question Bank me jaakar session start karein taaki performance trend measure kiya ja sake!`;
      }
      return `Namaste ${profileName}! 📈 **Practice Effectiveness Signals:**\n\n• 📝 **Total Questions Attempted:** ${eff.totalQuestionsAttempted}\n• 🎯 **Accuracy:** ${eff.accuracyPct}%\n• 🔄 **Retry Resolution:** ${eff.retryImprovementPct}% (${eff.retriesSuccessful} mistakes corrected)\n• 💡 **Observed Trend:** ${eff.effectivenessSignal}\n\n*${eff.honestStatement}*`;
    }

    case "mock_score_improvement": {
      const p6 = generateExamStrategyReport({
        student: profile,
        examProfile: examProfile as any,
        subjects: subjects as any,
        chapters,
        examTestRecords: tests as any,
      });
      if (!p6.scoreOpportunity.hasEnoughData) {
        return `Namaste ${profileName}! Abhi mere paas enough mock performance data nahi hai. Score improvement diagnose karne ke liye pehle Exam Center me kam se kam 1 mock test record karein!`;
      }
      const opp = p6.scoreOpportunity;
      return `Namaste ${profileName}! 📈 **Exam Score Opportunity Analysis:**\n\n• 🎯 **Observed Score:** ${opp.observedScore}/${opp.maxScore}\n• 💡 **Potential Improvement Areas:**\n${opp.potentialImprovementAreas.map((p) => `   - ${p}`).join("\n")}\n• 🔍 **Observed Issues:**\n${opp.observedIssues.map((i) => `   - ${i}`).join("\n")}\n\n*${opp.honestStatement}*`;
    }

    case "marks_loss_analysis": {
      const p6 = generateExamStrategyReport({
        student: profile,
        examProfile: examProfile as any,
        subjects: subjects as any,
        chapters,
        examTestRecords: tests as any,
      });
      const ml = p6.marksLossAnalysis;
      if (!ml.isAvailable) {
        return `Namaste ${profileName}! Marks-loss breakdown unavailable from current data. Exam Center me mock test ke answers aur mistakes record karein taaki detailed marks-loss breakdown generate ho sake!`;
      }
      return `Namaste ${profileName}! 📉 **Transparent Marks-Loss Breakdown:**\n\n• ⚠️ **Total Marks Lost:** ${ml.totalMarksLost}\n• 🎯 **Primary Loss Category:** ${ml.primaryLossCategory}\n• 📊 **Categorized Loss:**\n   - Concept Errors: ~${ml.conceptLossMarks} marks\n   - Calculation Errors: ~${ml.calculationLossMarks} marks\n   - Careless Slips: ~${ml.carelessLossMarks} marks\n   - Unattempted Questions: ~${ml.unattemptedLossMarks} marks\n\n*${ml.explanation}*`;
    }

    case "before_exam_strategy": {
      const p6 = generateExamStrategyReport({
        student: profile,
        examProfile: examProfile as any,
        subjects: subjects as any,
        chapters,
        examTestRecords: tests as any,
      });
      const days = p6.examContext.daysRemaining;
      if (p6.last24HoursStrategy?.isActive) {
        return `Namaste ${profileName}! ⏳ **Last 24 Hours Strategy (Final Prep):**\n\n• 🛑 **No Heavy Cramming:** Do not start new topics today.\n• 📋 **Material Checklist:**\n${p6.last24HoursStrategy.materialChecklist.map((c) => `   - ${c}`).join("\n")}\n• 🛌 **Sleep Discipline:** ${p6.last24HoursStrategy.restGuideline}`;
      }
      if (p6.last7DaysStrategy?.isActive) {
        return `Namaste ${profileName}! 🗓️ **Last-7-Days Exam Strategy (${days} Days Remaining):**\n\n${p6.last7DaysStrategy.schedule.map((s) => `• **${s.dayRange} (${s.theme}):** ${s.suggestedFocus}`).join("\n")}\n\n*Zero all-nighters: healthy rest secures numerical accuracy.*`;
      }
      return `Namaste ${profileName}! 🎯 **Exam Preparation Strategy (${days} Days Remaining):**\n\n• 📚 **Top Revision Focus:** ${p6.examRevisionPriorities[0]?.chapterTitle || "High-weightage chapters"}\n• ⚡ **Time Allocation:** Phase-wise paper execution with 20m review buffer.\n• 🛡️ **Status:** ${p6.examContext.dateProvenanceNote}`;
    }

    case "paper_attempt_strategy": {
      const p6 = generateExamStrategyReport({
        student: profile,
        examProfile: examProfile as any,
        subjects: subjects as any,
        chapters,
        examTestRecords: tests as any,
      });
      const phases = p6.timeManagementStrategy.personalTimePlan.phases;
      return `Namaste ${profileName}! 📝 **Personal Paper Attempt Strategy (180 Minutes):**\n\n${phases.map((p) => `• **${p.phaseName} (~${p.durationMinutes}m):** ${p.targetActivity}\n   *Rule:* ${p.strategyRule}`).join("\n\n")}\n\n*Personal strategy recommendation based on observed mock time distribution.*`;
    }

    case "chapter_score_opportunity": {
      const p6 = generateExamStrategyReport({
        student: profile,
        examProfile: examProfile as any,
        subjects: subjects as any,
        chapters,
        examTestRecords: tests as any,
      });
      const highOpp = p6.chapterScoreOpportunities.filter((c) => c.classification === "High opportunity");
      if (highOpp.length === 0) {
        return `Namaste ${profileName}! Abhi kisi chapter me critical 'High opportunity' score gap detect nahi hua hai. Chapter opportunities practice accuracy aur mistake backlog ke base par calculate hoti hain. Regular practice jari rakhein!`;
      }
      return `Namaste ${profileName}! 🎯 **High Score Opportunity Chapters:**\n\n${highOpp.slice(0, 3).map((c) => `• **${c.chapterTitle}** (${c.subjectName}): ${c.reason}\n   *Evidence:* ${c.evidence}`).join("\n\n")}\n\n*In chapters me targeted drilling se marks recovery potential sabse zyada hai.*`;
    }

    case "mock_score_drop": {
      const p6 = generateExamStrategyReport({
        student: profile,
        examProfile: examProfile as any,
        subjects: subjects as any,
        chapters,
        examTestRecords: tests as any,
      });
      const traj = p6.scoreTrajectory;
      if (traj.totalMocks < 2) {
        return `Namaste ${profileName}! Score trend evaluate karne ke liye kam se kam 2 mock tests ka data chahiye. Keep practicing and record your scores!`;
      }
      return `Namaste ${profileName}! 📊 **Mock Score Trajectory Review:**\n\n• 📉 **Trend:** ${traj.trend}\n• 💡 **Observed Signal:** ${traj.mainImprovementSignal}\n• 🔍 **Evidence:** ${traj.evidenceSummary}\n\n*Mock score ke fluctuations se panic mat karo. Specific careless ya concept errors ko target karke next mock solve karo!*`;
    }

    case "costly_mistakes": {
      const p6 = generateExamStrategyReport({
        student: profile,
        examProfile: examProfile as any,
        subjects: subjects as any,
        chapters,
        examTestRecords: tests as any,
      });
      const issues = p6.scoreOpportunity.observedIssues;
      return `Namaste ${profileName}! ⚠️ **Mistakes Costing You Marks:**\n\n${issues.map((i) => `• ${i}`).join("\n")}\n\n*Next Step:* Garia OS Mistake Intelligence queue me jakar in questions ko 'Retry' mark karein!`;
    }

    case "exam_time_management": {
      const p6 = generateExamStrategyReport({
        student: profile,
        examProfile: examProfile as any,
        subjects: subjects as any,
        chapters,
        examTestRecords: tests as any,
      });
      const recs = p6.timeManagementStrategy.recommendations;
      return `Namaste ${profileName}! ⏱️ **Exam Time Management Intelligence:**\n\n${recs.map((r) => `• ${r}`).join("\n")}\n\n• 📌 **Checkpoint Advice:** ${p6.timeManagementStrategy.personalTimePlan.checkpointAdvice}`;
    }

    case "make_exam_strategy": {
      const p6 = generateExamStrategyReport({
        student: profile,
        examProfile: examProfile as any,
        subjects: subjects as any,
        chapters,
        examTestRecords: tests as any,
      });
      const prof = p6.strategyProfile;
      return `Namaste ${profileName}! 🎯 **Your Personalized Exam Strategy:**\n\n• 🎯 **Accuracy Rating:** ${prof.accuracyRating}\n• ⚡ **Pacing:** ${prof.speedRating}\n• ⚠️ **Careless Error Risk:** ${prof.carelessMistakeRisk}\n• 🛡️ **Recommended Adjustments:**\n${prof.possibleStrategyImprovements.map((s) => `   - ${s}`).join("\n")}\n\n*Application-derived strategy recommendation based on your verified practice signals.*`;
    }

    case "latest_mock_analysis": {
      const p6 = generateExamStrategyReport({
        student: profile,
        examProfile: examProfile as any,
        subjects: subjects as any,
        chapters,
        examTestRecords: tests as any,
      });
      const pm = p6.postMockReview;
      if (!pm.hasMock) {
        return `Namaste ${profileName}! Abhi koi recent mock examination record nahi hui hai. Exam Center me jaakar apna test score add karein!`;
      }
      return `Namaste ${profileName}! 📊 **Post-Mock Diagnostic Review:**\n\n• 📝 **What Happened:** ${pm.whatHappened}\n• 🔍 **Why:** ${pm.why}\n• 🛠️ **What Should Change:** ${pm.whatShouldChange}\n• 🎯 **Next Practice:**\n${pm.whatShouldIPracticeNext.map((p) => `   - ${p}`).join("\n")}`;
    }

    case "improving_check": {
      const p5Report = generateLearningEffectivenessReport({
        student: profile,
        subjects: subjects as any,
        studySessions: [],
        academicChapters: chapters,
        revisions: [],
        practiceSessions: [],
        examRecords: tests as any,
        examProfile: examProfile as any,
      });

      const q = p5Report.quantityVsEffectiveness;
      if (q.learningSignal === "Not enough data yet" && p5Report.weakTopicsDiagnosed.length === 0) {
        return `Namaste ${profileName}! I don't have enough performance data yet to answer that reliably. Keep logging your study and practice sessions to establish an improvement trend!`;
      }

      return `Namaste ${profileName}! 📈 **Learning Effectiveness & Performance Assessment:**

${hierarchyDisclosure}

• 🎯 **Learning Signal:** ${q.learningSignal}
• 💡 **Signal Rationale:** ${q.signalRationale}
• 📚 **Topics Progressing:** ${p5Report.weeklyReview2.topicsImprovedCount} topic(s) showing strong or practicing mastery
• ⚠️ **Weak Diagnoses:** ${p5Report.weakTopicsDiagnosed.length > 0 ? p5Report.weakTopicsDiagnosed.map((w) => `${w.chapterTitle} (${w.diagnosisType.split("—")[1]?.trim()})`).join(", ") : "No critical weaknesses flagged"}

*Focus on active recall and question drills to maintain positive improvement momentum!*`;
    }

    case "revision_effectiveness": {
      const p5Report = generateLearningEffectivenessReport({
        student: profile,
        subjects: subjects as any,
        studySessions: [],
        academicChapters: chapters,
        revisions: [],
        practiceSessions: [],
        examRecords: tests as any,
        examProfile: examProfile as any,
      });

      const revList = p5Report.revisionEffectiveness;
      if (revList.length === 0) {
        return `Namaste ${profileName}! Abhi post-revision practice comparison ke liye data available nahi hai. Revision complete karne ke baad practice drill zaroor solve karein taaki before/after comparison generate ho sake!`;
      }

      const revLines = revList.slice(0, 3).map((r) => `• **${r.chapterTitle}**: ${r.signalMessage}`).join("\n");
      return `Namaste ${profileName}! 🔄 **Revision Effectiveness Review:**\n\n${revLines}\n\n*Regular spaced revisions secure long-term conceptual recall.*`;
    }

    case "performance_drop_check": {
      const p5Report = generateLearningEffectivenessReport({
        student: profile,
        subjects: subjects as any,
        studySessions: [],
        academicChapters: chapters,
        revisions: [],
        practiceSessions: [],
        examRecords: tests as any,
        examProfile: examProfile as any,
      });

      const bottlenecks = p5Report.learningBottlenecks;
      if (bottlenecks.length === 0) {
        return `Namaste ${profileName}! Tumhare study log me abhi koi significant performance drop ya bottleneck detect nahi hua hai. Regular revision schedule follow karte raho!`;
      }

      const bLines = bottlenecks.map((b) => `• ⚠️ **${b.title}**: ${b.description}\n   *Next Step:* ${b.suggestedAction}`).join("\n\n");
      return `Namaste ${profileName}! 🔍 **Possible Learning Bottlenecks Identified:**\n\n${bLines}\n\n*Ye recommendations hain, kisi bhi ek test ke fluctuation se panic mat karo.*`;
    }

    case "subject_attention": {
      const p5Report = generateLearningEffectivenessReport({
        student: profile,
        subjects: subjects as any,
        studySessions: [],
        academicChapters: chapters,
        revisions: [],
        practiceSessions: [],
        examRecords: tests as any,
        examProfile: examProfile as any,
      });

      const highPrioritySubs = p5Report.subjectPerformances.filter((s) => s.priority === "High");
      const targetSub = highPrioritySubs[0] || p5Report.subjectPerformances[0];

      if (!targetSub) {
        return `Namaste ${profileName}! Sabhi subjects balanced chal rahe hain. Daily balanced study schedule maintain karein!`;
      }

      return `Namaste ${profileName}! 🎯 **Subject in Need of Attention: ${targetSub.subjectName}**\n\n• **Readiness Signal:** ${targetSub.readinessSignal}\n• **Coverage:** ${targetSub.coverageLevel} (${targetSub.coveragePct}%)\n• **Unresolved Mistakes:** ${targetSub.unresolvedMistakeCount}\n\n*Action: Aaj ${targetSub.subjectName} ke 10 board-pattern practice questions aur 1 core chapter revision complete karein.*`;
    }

    case "what_should_i_do_now": {
      const adaptiveState = generateUnifiedAdaptiveState({
        student: profile,
        subjects,
        studySessions: [],
        academicChapters: chapters,
        examRecords: tests as any,
        examProfile,
        availableDailyMinutes: (examProfile.dailyStudyHours || 3) * 60,
      });

      const top3 = adaptiveState.topRecommendations.slice(0, 3);
      const actionLines = top3.map((a, idx) => {
        return `**${idx + 1}. ${a.action}** (~${a.estimatedMinutes} mins)\n   • 🎯 *Why:* ${a.reason}\n   • 💡 *Next:* ${a.postActionFeedback || "Moves chapter forward in study log"}`;
      }).join("\n\n");

      return `Arre ${profileName}! Abhi tumhare academic state ke mutabiq sabse pehle ye Top 3 actions prioritize kiye gaye hain (Application-Derived Priority):

${hierarchyDisclosure}

📌 **Abhi Kya Karein (Top Recommendations):**
${actionLines}

⚡ *Mentor Advice: Teenon ek saath mat socho, bas pehle Action 1 shuru karo aur 25-30 minute focused padhai karo!*`;
    }

    case "mistake_review": {
      const profileId = profile?.id || "default-student";
      const mistakes = loadProfileMistakes(profileId);
      const pending = mistakes.filter((m) => m.status === "pending_review" || m.status === "retried_incorrect");

      if (pending.length === 0) {
        return `Bahut badhiya ${profileName}! 🎉 Tumhare mistake review log me abhi koi pending wrong question nahi hai.

- Practice sessions ya test me jo questions tough lagein unhe bookmark ya retry mark karte raho.
- Consistency banaye rakhne ke liye aaj 10 board-pattern practice questions solve karo!`;
      }

      const mistakeList = pending.slice(0, 3).map((m, idx) => {
        return `**${idx + 1}. ${m.subjectName} — ${m.chapterTitle}**\n   • ❓ *Question:* "${m.questionText.slice(0, 70)}..."\n   • 💡 *Correct Concept:* ${m.conceptExplanation || m.correctAnswer || "Check formula/rule in notes"}`;
      }).join("\n\n");

      return `Galtiyon se hi seekhte hain ${profileName}! 📝 Tumhare paas **${pending.length} pending mistake items** hain:

${mistakeList}

🔄 **Mistake Learning Cycle:**
1. Pehle samjho *kyun galat hua* (conceptual error ya calculation slip).
2. Concept summary padho.
3. Same question ko bina dekhe retry karo!`;
    }

    case "weekly_focus": {
      const adaptiveState = generateUnifiedAdaptiveState({
        student: profile,
        subjects,
        studySessions: [],
        academicChapters: chapters,
        examRecords: tests as any,
        examProfile,
        availableDailyMinutes: (examProfile.dailyStudyHours || 3) * 60,
      });

      const wr = adaptiveState.weeklyReview;
      return `Namaste ${profileName}! 🗓️ Tumhara **Weekly Academic Focus & Review (${profileClass} ${profileStream})**:

${hierarchyDisclosure}

📊 **Status & Progress:**
• 📚 **Weak Areas Identified:** ${wr.weakAreasIdentified.join(", ")}
• ⏳ **Days to Target Exam:** ${daysRemaining} Din

🎯 **This Week's Top Priorities (Application-Derived):**
${wr.nextWeekPriorities.slice(0, 3).map((p, idx) => `${idx + 1}. ${p}`).join("\n")}

💡 *Mentor Tip: Har din ek priority complete karo, week ke end me sara backlog clear ho jayega!*`;
    }

    case "study_plan":
    case "plan_day": {
      const pendingTasks = tasks.filter((t) => !t.completed);
      const curriculumChapters = boardHierarchy.subjects.flatMap((s) =>
        s.chapters.map((ch) => ({ title: ch.title, priority: ch.priority, subjectName: s.name }))
      );
      const weakOrVvi =
        chapters.filter((c) => c.isWeak || c.priority === "VVI").length > 0
          ? chapters.filter((c) => c.isWeak || c.priority === "VVI").slice(0, 3)
          : curriculumChapters.filter((c) => c.priority === "VVI").slice(0, 3);
      const primaryChap = weakOrVvi[0]?.title || "Core Chapter";
      const secondaryChap = weakOrVvi[1]?.title || "Revision Topic";

      return `Arre ${profileName}! Chalo aaj ka ekdum focused study plan banate hain (${profileClass} ${profileStream} • ${profileBoard}).

📋 **Board Study Pattern (${profileBoard}):** ${boardPatternNote}
${hierarchyDisclosure}
🎯 **Aaj Ka Study Target:** ${examProfile.dailyStudyHours || 4} Ghante | ⏳ **Exam Countdown:** ${daysRemaining} Days remaining

📌 **Aaj Ka Step-by-Step Schedule (Application-Derived Priorities):**
1. 🌅 **Block 1 (Deep Concept Study - 2 hrs):** Sabse pehle "${primaryChap}" ke core concepts padho aur 2-3 important formulas/definitions note kar lo.
2. ☕ **Quick Break (15 mins):** Thoda stretch karo, paani piyo aur aankhon ko rest do.
3. ⚡ **Block 2 (${profileBoard === "BSEB" ? "50% OMR MCQ + Descriptive Practice" : "Practice & Board-Pattern Questions"} - 1.5 hrs):** "${secondaryChap}" ke ${profileBoard === "BSEB" ? "20 OMR Objective MCQs aur 3 Short/Long Answer questions" : "5 board-pattern sample questions"} practice karo.
4. 📝 **Block 3 (Daily Tasks & Revision - 1 hr):**
${
  pendingTasks.length > 0
    ? pendingTasks.slice(0, 3).map((t) => `   • ${t.title}`).join("\n")
    : "   • Pending notes review karo aur formulas revise karo."
}
5. 🌙 **Night Wind-Down (20 mins):** Aaj jo padha usko dimag me recall karo aur kal ke liye ready ho jao!

💡 *Mentor Tip: Ek saath continuous lambi padhai mat karo, 45 min ke baad 10 min break lene se retention badhta hai!*`;
    }

    case "weekly_schedule": {
      const subjectNames = subjects.map((s) => s.name);
      const sub1 = subjectNames[0] || "Subject 1";
      const sub2 = subjectNames[1] || "Subject 2";
      const sub3 = subjectNames[2] || "Subject 3";
      const sub4 = subjectNames[3] || "Subject 4";

      return `Namaste ${profileName}! 📅 Ye raha tumhara customized 7-Day Balanced Weekly Schedule (${profileClass} ${profileStream}):

🎯 **Weekly Focus:** Daily ${examProfile.dailyStudyHours || 4} Hours | Balanced Revision + Practice Loop

🗓️ **Day-by-Day Breakdown:**
• 🟢 **Monday:** ${sub1} (Core Theory & Derivations) + 30m Formula Revision
• 🔵 **Tuesday:** ${sub2} (Chapter Concepts & Solved Numericals) + 15m Flashcards
• 🟣 **Wednesday:** ${sub3} (High-Yield Questions & Case Studies) + Daily Tasks
• 🟡 **Thursday:** ${sub4} (Deep Study) + ${sub1} Spaced Recall (30m)
• 🟠 **Friday:** Combined Weak Topics Focus + 5 PYQs from ${sub2}
• 🔴 **Saturday:** Full Chapter Timed Mock Test + Mistake Notebook Analysis
• 🌟 **Sunday:** Weekly Revision Loop + Backlog Clearance + Next Week Planning

⚡ *Mentor Rule: Sunday ko naya topic shuru mat karo, pura din purane topics ko pakka karne me lagao!*`;
    }

    case "ask_doubt":
    case "explain_topic": {
      return `Haan ${profileName}! Main concept ko ekdum simple Hinglish me explain kar deta hoon.

Batao kaunsa topic ya question samajhna hai?
Jaise hi topic doge, hum usko in 4 simple steps me clear karenge:
1. 💡 **Easy Concept:** 2 line me aasan bhasha me samjhayenge.
2. 🌟 **Real-Life Example:** Rozmarra ki zindagi ya relatable example se connect karenge.
3. 📌 **Exam Points & Formulae:** Jo board exam me likhna zaroori hai.
4. ✏️ **Step-by-Step Question:** Ek solved example taaki numericals/theory me marks na katein.

*Upar apna topic ya doubt likho ya photo upload karo, chalo milkar solve karte hain!*`;
    }

    case "weak_topics": {
      const weakChapters = chapters.filter((c) => c.isWeak);
      if (weakChapters.length === 0) {
        return `Shabash ${profileName}! 🎉 Abhi tumhara koi bhi chapter weak mark nahi hai.

**Top Score banaye rakhne ke liye:**
- 📝 Roz 5-10 Past Year Questions (PYQs) solve karte raho.
- ⏱️ Exam Center me timed mock test do speed test karne ke liye.
- 🔄 Weekly revision loop maintain rakho.`;
      }

      return `Koi tension nahi ${profileName}! Thoda extra dhyan dene se ye topics bhi super strong ho jayenge:

🔥 **Topics needing attention (${weakChapters.length}):**
${weakChapters
  .slice(0, 4)
  .map(
    (c, idx) => `**${idx + 1}. ${c.title}** (${c.subjectId})
   • 💡 *Kaise padhein:* Pehle basic theory aur summary points re-read karo.
   • ✏️ *Practice:* Directly difficult questions mat lagao, pehle 3-4 simple questions solve karo.
   • ⏰ *Action:* Agle 48 ghante me iska 30 min ka ek revision block lagao.`
  )
  .join("\n\n")}

💪 *Mentor Advice: Har topper ka koi na koi weak chapter hota hai, bas regular practice se wo strong ban jata hai!*`;
    }

    case "revision_plan":
    case "revise": {
      const revisionQueue = chapters
        .filter((c) => c.revisionCount < 2 || c.isWeak)
        .slice(0, 4);

      if (revisionQueue.length === 0) {
        return `Bahut badhiya ${profileName}! ✅ Tumhare active chapters ka multiple rounds revision ho chuka hai.

- Current Readiness Score: **${readinessScore}%**
- Ab bas light weekly review karte raho taaki concepts memory me lock rahein!`;
      }

      return `Revision se hi memory strong hoti hai ${profileName}! 🔄
${hierarchyDisclosure}

📌 **Aaj Ka Priority Revision Queue (Application-Derived Garia OS Priority):**
${revisionQueue
  .map(
    (c, idx) => `**${idx + 1}. ${c.title}** (Revised: ${c.revisionCount}/3 baar)
   • Application Priority: ${c.priority} | Status: ${c.isWeak ? "Extra practice required" : "In Progress"}
   • Action: Formula sheet dekho aur 2 sample practice questions bina dekhe solve karo.`
  )
  .join("\n\n")}

*Revision complete hote hi Academic Center me 'Revised' mark kar dena!*`;
    }

    case "progress_analysis":
    case "analyze_tests": {
      const allTestRecords = [
        ...tests.map((t) => ({ name: t.testName, pct: (t.score / (t.maxMarks || 1)) * 100 })),
        ...mockTests.map((m) => ({ name: m.testName, pct: (m.marksObtained / (m.maxMarks || 1)) * 100 })),
      ];

      const completedChapters = chapters.filter((c) => c.status === "Completed").length;
      const totalChapters = chapters.length || 1;
      const syllabusPct = Math.round((completedChapters / totalChapters) * 100);

      const avgPct =
        allTestRecords.length > 0
          ? Math.round(allTestRecords.reduce((a, b) => a + b.pct, 0) / allTestRecords.length)
          : 0;

      return `Chalo ${profileName}, tumhara comprehensive progress report dekhte hain: 📊

📈 **Academic Summary (${profileClass} ${profileStream}):**
• 📚 **Syllabus Completed:** ${completedChapters}/${totalChapters} Chapters (${syllabusPct}%)
• 🏆 **Overall Exam Readiness:** ${readinessScore}%
• 📝 **Tests Logged:** ${allTestRecords.length} | **Average Test Score:** ${allTestRecords.length > 0 ? `${avgPct}%` : "No tests yet"}
• ⚠️ **Weak Chapters Marked:** ${chapters.filter((c) => c.isWeak).length}

🎯 **Mentor Assessment & Next Steps:**
1. ${
        syllabusPct >= 70
          ? "Syllabus kaafi achha cover ho chuka hai! Ab 100% focus mock tests aur time management par rakho."
          : "Daily 1 chapter ka first pass complete karne ka target banao."
      }
2. Pehle un chapters ke PYQs lagao jinka weightage board exams me sabse zyada hai.
3. Silly mistakes ki ek alag diary banao taaki final exam me same galti na ho.`;
    }

    case "exam_strategy":
    case "exam_coach": {
      return `Exam pass aa raha hai ${profileName}, structured preparation se strong score banega! 🎯

📋 **Target Exam:** ${profileBoard} ${profileClass} (${examProfile.examName})
${hierarchyDisclosure}
⏳ **Days Remaining:** ${daysRemaining} Din | 📈 **Readiness Score:** ${readinessScore}%

🏆 **Board Exam Preparation Strategy:**
1. 📝 **3-Tier Question Strategy:**
   - *Phase 1 (First 45 mins):* Sabse pehle Section A (MCQs / 1-markers) high accuracy se complete karo.
   - *Phase 2 (Next 90 mins):* 3-marker & 5-marker descriptive questions me step-by-step presentation, neat headings aur diagrams banao.
   - *Phase 3 (Last 30 mins):* Calculation re-checking aur unit/symbol verification.
2. 📌 **Practice Rule:** Roz 5 board-pattern sample questions aur verified past papers (jab official paper archive attach ho) zaroor solve karo.
3. 🧘 **Mental Calm:** Exam ke aakhri dino me panic mat karo, roz 7 ghante neend aur light exercise focus banaye rakhti hai!

*Consistency hi success ki key hai. Abya is always with you!*`;
    }

    default: {
      const lowerPrompt = (userPrompt || "").toLowerCase();
      const matchedCurriculumSubject = boardHierarchy.subjects.find(
        (s) =>
          lowerPrompt.includes(s.name.toLowerCase()) ||
          (s.name === "Business Studies" && lowerPrompt.includes("bst")) ||
          (s.name === "Accountancy" && lowerPrompt.includes("account")) ||
          (s.name === "Economics" && lowerPrompt.includes("eco")) ||
          (s.name === "Urdu" && (lowerPrompt.includes("urdu") || lowerPrompt.includes("kahkashan") || lowerPrompt.includes("qawaid")))
      );

      if (matchedCurriculumSubject) {
        const chapBreakdown = matchedCurriculumSubject.chapters
          .map(
            (ch, idx) =>
              `**${idx + 1}. ${ch.title}** [Garia OS Priority: ${ch.priority} • Est. Study Weight: ~${ch.examWeightageMarks || 20} Marks]\n   • *Core Topic:* ${ch.topics[0]?.name || ch.title}\n   • *Study Insight:* ${ch.topics[0]?.vviPoints[0] || ch.notesSummary.slice(0, 120)}`
          )
          .join("\n\n");

        const sourceDisclosure = formatAbyaCurriculumSourceDisclosure({
          board: profileBoard,
          classLevel: profileClass,
          stream: profileStream,
          academicYear: matchedCurriculumSubject.academicYear || boardHierarchy.academicYear,
          subject: matchedCurriculumSubject,
          hierarchy: boardHierarchy,
        });

        return `Namaste ${profileName}! 📚 Based on your current ${profileStream} study curriculum in Garia OS for **${profileBoard} ${profileClass} ${matchedCurriculumSubject.name}** (${matchedCurriculumSubject.code}):

📋 **${profileBoard} Study Pattern:** ${boardPatternNote}
${sourceDisclosure}

🔥 **From Your Important Revision Priorities (Application-Derived):**
${chapBreakdown}

🎯 **Recommended Study Plan (${profileBoard}):**
1. ${profileBoard === "BSEB" ? "Practice 25 OMR-style Objective MCQs daily alongside structured descriptive answers." : "Solve core conceptual and structured board-pattern practice questions."}
2. Practice these core topics and confirm final board syllabus updates with official ${profileBoard} notifications.`;
      }

      const matchedChapter = chapters.find(
        (c) =>
          lowerPrompt.includes(c.title.toLowerCase()) ||
          c.title.toLowerCase().includes(lowerPrompt.slice(0, 8))
      );
      const primarySubject = subjects[0]?.name || boardHierarchy.subjects[0]?.name || `${profileStream} Core`;

      if (lowerPrompt.length > 3 && matchedChapter) {
        return `Namaste ${profileName}! Based on your current ${profileStream} study curriculum in Garia OS, here is the study breakdown for "${matchedChapter.title}" (${matchedChapter.subjectId}):

📌 **Study Mentor Quick Breakdown for ${matchedChapter.title} (${profileBoard}):**
1. 💡 **Core Fundamentals:** Review the primary definitions and standard formula/rule sheet first.
2. 🎯 **Study Priority:** From your important revision priorities (${matchedChapter.priority || "Important"}), practice ${matchedChapter.priority === "VVI" ? "structured 5-mark long answers and objective MCQs" : "direct objective & short analytical questions"}.
3. ✏️ **Action Step:** Work through 2–3 solved examples, then practice sample board-pattern questions and confirm final board syllabus updates with official ${profileBoard} notifications.
4. 🔄 **Revision Tracker:** Update your completion progress in the Academic Center after finishing!

*Agar numerical me specific step ya formula me doubt hai, toh detail likho hum step-by-step decode karenge!*`;
      }

      if (
        lowerPrompt.includes("plan") ||
        lowerPrompt.includes("schedule") ||
        lowerPrompt.includes("time table") ||
        lowerPrompt.includes("aaj")
      ) {
        const pendingTasks = tasks.filter((t) => !t.completed);
        return `Haan ${profileName}! Aaj ka balanced study plan ye raha (${profileBoard} • ${profileClass} ${profileStream}):

🎯 **Target:** ${examProfile.dailyStudyHours || 4} Ghante | ⏳ **Days to Exam:** ${daysRemaining} Days

1. 🌅 **Session 1 (Focus):** Core ${profileStream} (${primarySubject}) ke sabse important chapter ka theory padho.
2. ⚡ **Session 2 (Practice):** ${profileBoard === "BSEB" ? "20 OMR Objective MCQs + 3 Short Answers" : "5 Board-Pattern Questions"} practice karo.
3. 📝 **Session 3 (Tasks):** ${
          pendingTasks.length > 0
            ? pendingTasks.slice(0, 2).map((t) => `\n   • ${t.title}`).join("")
            : "Formula revision & notes check."
        }

*Consistency is everything. Chalo shuru karte hain!*`;
      }

      return `Namaste ${profileName}! 😊 Main hoon tumhara Study Mentor Abya (${profileClass} ${profileStream} • ${profileBoard}).

Kaise chal rahi hai taiyari? 
- 📈 **Exam Readiness:** ${readinessScore}%
- ⏳ **Days Left:** ${daysRemaining} Days
- 📚 **Focus Subject:** ${primarySubject}
- 📋 **Board Pattern:** ${boardPatternNote}
- ${hierarchyDisclosure}

Tum mujhse koi bhi concept explanation, study plan, numericals ya board exam strategy puch sakte ho!`;
    }
  }
};
