import {
  AcademicSubject,
  AcademicChapter,
  AcademicTest,
  AcademicVVITopic,
  AcademicRevisionItem,
  AcademicPracticeSession,
  AcademicRoadmapStage,
  AcademicRoadmapData,
  RoadmapStageStatus,
  SmartStudyPlan,
  SmartStudySlot,
  StreamType,
} from "../types";

export const DEFAULT_COMMERCE_SUBJECTS: AcademicSubject[] = [
  { id: "sub-acc", name: "Accountancy", stream: "Commerce", color: "emerald" },
  { id: "sub-bst", name: "Business Studies", stream: "Commerce", color: "cyan" },
  { id: "sub-eco", name: "Economics", stream: "Commerce", color: "purple" },
  { id: "sub-math-comm", name: "Mathematics", stream: "Commerce", color: "blue" },
  { id: "sub-eng-comm", name: "English Core", stream: "Commerce", color: "amber" },
];

export const DEFAULT_SCIENCE_SUBJECTS: AcademicSubject[] = [
  { id: "sub-phy", name: "Physics", stream: "Science", color: "cyan" },
  { id: "sub-chem", name: "Chemistry", stream: "Science", color: "emerald" },
  { id: "sub-bio", name: "Biology", stream: "Science", color: "rose" },
  { id: "sub-math-sci", name: "Mathematics", stream: "Science", color: "blue" },
  { id: "sub-eng-sci", name: "English Core", stream: "Science", color: "amber" },
];

export const DEFAULT_ARTS_SUBJECTS: AcademicSubject[] = [
  { id: "sub-hist", name: "History", stream: "Arts / Humanities", color: "amber" },
  { id: "sub-pol", name: "Political Science", stream: "Arts / Humanities", color: "purple" },
  { id: "sub-geo", name: "Geography", stream: "Arts / Humanities", color: "emerald" },
  { id: "sub-soc", name: "Sociology", stream: "Arts / Humanities", color: "cyan" },
  { id: "sub-eng-arts", name: "English Core", stream: "Arts / Humanities", color: "blue" },
];

export function getDefaultSubjectsForStream(stream: StreamType): AcademicSubject[] {
  if (stream === "Science") return DEFAULT_SCIENCE_SUBJECTS;
  if (stream === "Arts / Humanities" || stream === "Arts") return DEFAULT_ARTS_SUBJECTS;
  return DEFAULT_COMMERCE_SUBJECTS;
}

export const DEFAULT_INITIAL_CHAPTERS: AcademicChapter[] = [
  // Commerce - Accountancy
  {
    id: "ch-acc-1",
    subjectId: "sub-acc",
    chapterNumber: 1,
    title: "Accounting for Partnership Firms - Fundamentals",
    topics: ["Profit & Loss Appropriation", "Partner Capital Accounts", "Interest on Capital & Drawings", "Past Adjustments"],
    status: "Completed",
    priority: "VVI",
    isWeak: false,
    pyqStatus: "Completed",
    revisionCount: 2,
    lastRevisedAt: Date.now() - 3 * 86400000,
    testStatus: "Tested",
    notes: "Master profit distribution formulas and guarantee of profit questions.",
  },
  {
    id: "ch-acc-2",
    subjectId: "sub-acc",
    chapterNumber: 2,
    title: "Reconstitution of Partnership - Admission & Retirement",
    topics: ["Goodwill Valuation", "Sacrificing & Gaining Ratio", "Revaluation Account", "Capital Adjustments"],
    status: "In Progress",
    priority: "VVI",
    isWeak: true,
    pyqStatus: "Pending",
    revisionCount: 1,
    lastRevisedAt: Date.now() - 7 * 86400000,
    testStatus: "Pending",
    notes: "Revaluation adjustments need extra practice on hidden goodwill.",
  },
  {
    id: "ch-acc-3",
    subjectId: "sub-acc",
    chapterNumber: 3,
    title: "Company Accounts - Issue of Shares & Debentures",
    topics: ["Pro-Rata Allotment", "Forfeiture & Reissue of Shares", "Issue of Debentures for Collateral"],
    status: "Not Started",
    priority: "VVI",
    isWeak: true,
    pyqStatus: "Pending",
    revisionCount: 0,
    testStatus: "Pending",
    notes: "High weightage in board exams & CA Foundation.",
  },
  {
    id: "ch-acc-4",
    subjectId: "sub-acc",
    chapterNumber: 4,
    title: "Cash Flow Statement (AS-3)",
    topics: ["Operating Activities", "Investing Activities", "Financing Activities"],
    status: "In Progress",
    priority: "Important",
    isWeak: false,
    pyqStatus: "Pending",
    revisionCount: 1,
    testStatus: "Pending",
    notes: "Focus on non-cash adjustments and provision for tax.",
  },

  // Commerce - Economics
  {
    id: "ch-eco-1",
    subjectId: "sub-eco",
    chapterNumber: 1,
    title: "National Income & Related Aggregates",
    topics: ["Circular Flow of Income", "Value Added Method", "Income Method", "Expenditure Method"],
    status: "Completed",
    priority: "VVI",
    isWeak: false,
    pyqStatus: "Completed",
    revisionCount: 2,
    testStatus: "Tested",
    notes: "Practice numericals on GDP at MP vs NNP at FC.",
  },
  {
    id: "ch-eco-2",
    subjectId: "sub-eco",
    chapterNumber: 2,
    title: "Money & Banking",
    topics: ["Functions of Money", "Credit Creation by Commercial Banks", "RBI Monetary Policy Instruments"],
    status: "In Progress",
    priority: "Important",
    isWeak: false,
    pyqStatus: "Completed",
    revisionCount: 1,
    testStatus: "Tested",
    notes: "CRR, SLR, Repo Rate mechanisms.",
  },
  {
    id: "ch-eco-3",
    subjectId: "sub-eco",
    chapterNumber: 3,
    title: "Determination of Income & Employment",
    topics: ["Aggregate Demand & Supply", "Propensity to Consume & Save", "Investment Multiplier"],
    status: "Not Started",
    priority: "VVI",
    isWeak: true,
    pyqStatus: "Pending",
    revisionCount: 0,
    testStatus: "Pending",
    notes: "Deficient and Excess demand correction measures.",
  },

  // Commerce - Business Studies
  {
    id: "ch-bst-1",
    subjectId: "sub-bst",
    chapterNumber: 1,
    title: "Nature and Significance of Management",
    topics: ["Management Objectives", "Levels of Management", "Coordination Essence"],
    status: "Completed",
    priority: "Normal",
    isWeak: false,
    pyqStatus: "Completed",
    revisionCount: 3,
    testStatus: "Tested",
  },
  {
    id: "ch-bst-2",
    subjectId: "sub-bst",
    chapterNumber: 2,
    title: "Principles of Management (Fayol & Taylor)",
    topics: ["14 Principles of Fayol", "Scientific Management Techniques", "Time Study & Motion Study"],
    status: "In Progress",
    priority: "Important",
    isWeak: false,
    pyqStatus: "Pending",
    revisionCount: 1,
    testStatus: "Pending",
  },
  {
    id: "ch-bst-3",
    subjectId: "sub-bst",
    chapterNumber: 3,
    title: "Financial Management & Capital Structure",
    topics: ["Financial Decisions", "Trading on Equity", "Factors Affecting Capital Structure"],
    status: "Not Started",
    priority: "VVI",
    isWeak: true,
    pyqStatus: "Pending",
    revisionCount: 0,
    testStatus: "Pending",
  },

  // Science - Physics
  {
    id: "ch-phy-1",
    subjectId: "sub-phy",
    chapterNumber: 1,
    title: "Electrostatics & Electric Charges",
    topics: ["Coulomb's Law", "Electric Field & Dipole", "Gauss's Law Applications"],
    status: "Completed",
    priority: "VVI",
    isWeak: false,
    pyqStatus: "Completed",
    revisionCount: 2,
    testStatus: "Tested",
  },
  {
    id: "ch-phy-2",
    subjectId: "sub-phy",
    chapterNumber: 2,
    title: "Current Electricity & Kirchhoff's Laws",
    topics: ["Drift Velocity", "Kirchhoff's Rules", "Wheatstone Bridge & Potentiometer"],
    status: "In Progress",
    priority: "VVI",
    isWeak: true,
    pyqStatus: "Pending",
    revisionCount: 1,
    testStatus: "Pending",
  },
  {
    id: "ch-phy-3",
    subjectId: "sub-phy",
    chapterNumber: 3,
    title: "Ray Optics & Optical Instruments",
    topics: ["Refraction at Spherical Surfaces", "Lens Maker's Formula", "Microscope & Telescope"],
    status: "Not Started",
    priority: "VVI",
    isWeak: true,
    pyqStatus: "Pending",
    revisionCount: 0,
    testStatus: "Pending",
  },

  // Science - Chemistry
  {
    id: "ch-chem-1",
    subjectId: "sub-chem",
    chapterNumber: 1,
    title: "Solutions & Colligative Properties",
    topics: ["Raoult's Law", "Elevation in Boiling Point", "Osmotic Pressure & Van't Hoff Factor"],
    status: "Completed",
    priority: "VVI",
    isWeak: false,
    pyqStatus: "Completed",
    revisionCount: 2,
    testStatus: "Tested",
  },
  {
    id: "ch-chem-2",
    subjectId: "sub-chem",
    chapterNumber: 2,
    title: "Electrochemistry",
    topics: ["Nernst Equation", "Molar Conductivity", "Kohlrausch Law", "Batteries & Corrosion"],
    status: "In Progress",
    priority: "VVI",
    isWeak: true,
    pyqStatus: "Pending",
    revisionCount: 1,
    testStatus: "Pending",
  },

  // Science - Math
  {
    id: "ch-math-1",
    subjectId: "sub-math-sci",
    chapterNumber: 1,
    title: "Matrices & Determinants",
    topics: ["Matrix Operations", "Adjoint & Inverse", "Solving Linear Equations"],
    status: "Completed",
    priority: "Important",
    isWeak: false,
    pyqStatus: "Completed",
    revisionCount: 3,
    testStatus: "Tested",
  },
  {
    id: "ch-math-2",
    subjectId: "sub-math-sci",
    chapterNumber: 2,
    title: "Calculus - Continuity & Differentiability",
    topics: ["Chain Rule", "Implicit Functions", "Logarithmic Differentiation", "Parametric Forms"],
    status: "In Progress",
    priority: "VVI",
    isWeak: true,
    pyqStatus: "Pending",
    revisionCount: 1,
    testStatus: "Pending",
  },

  // Arts / Humanities - History
  {
    id: "ch-hist-1",
    subjectId: "sub-hist",
    chapterNumber: 1,
    title: "Bricks, Beads and Bones - Harappan Civilisation",
    topics: ["Harappan Seals", "Urban Planning & Citadel", "Agricultural Technologies", "Subsistence Strategies"],
    status: "Completed",
    priority: "VVI",
    isWeak: false,
    pyqStatus: "Completed",
    revisionCount: 2,
    testStatus: "Tested",
  },
  {
    id: "ch-hist-2",
    subjectId: "sub-hist",
    chapterNumber: 2,
    title: "Kings, Farmers and Towns - Early States & Economies",
    topics: ["Principalities & Mahajanapadas", "Mauryan Empire & Ashoka Inscriptions", "Land Grants & Rural Society"],
    status: "In Progress",
    priority: "VVI",
    isWeak: true,
    pyqStatus: "Pending",
    revisionCount: 1,
    testStatus: "Pending",
  },

  // Arts / Humanities - Political Science
  {
    id: "ch-pol-1",
    subjectId: "sub-pol",
    chapterNumber: 1,
    title: "The End of Bipolarity & World Politics",
    topics: ["Soviet System & Disintegration", "Shock Therapy & Consequences", "India & Post-Communist Countries"],
    status: "Completed",
    priority: "VVI",
    isWeak: false,
    pyqStatus: "Completed",
    revisionCount: 2,
    testStatus: "Tested",
  },
  {
    id: "ch-pol-2",
    subjectId: "sub-pol",
    chapterNumber: 2,
    title: "Contemporary Centres of Power",
    topics: ["European Union", "ASEAN & Rise of China", "India & Regional Alliances"],
    status: "In Progress",
    priority: "Important",
    isWeak: false,
    pyqStatus: "Pending",
    revisionCount: 1,
    testStatus: "Pending",
  },
];

export interface PriorityScoreResult {
  score: number;
  priorityLevel: "🔥 High Priority" | "⚡ Medium Priority" | "✅ On Track";
  scoreBreakdown: string[];
}

export function calculateChapterPriorityScore(
  chapter: AcademicChapter,
  subjectName: string,
  targetCareerRequiredSubjects: string[] = []
): PriorityScoreResult {
  let score = 0;
  const breakdown: string[] = [];

  // 1. Topic Priority Tag
  if (chapter.priority === "VVI") {
    score += 30;
    breakdown.push("Marked Very Very Important (VVI) (+30)");
  } else if (chapter.priority === "Important") {
    score += 15;
    breakdown.push("Marked Important (+15)");
  } else {
    score += 5;
    breakdown.push("Normal Exam Importance (+5)");
  }

  // 2. Weakness Indicator
  if (chapter.isWeak) {
    score += 25;
    breakdown.push("Flagged as Weak Topic area (+25)");
  }

  // 3. Chapter Completion Status
  if (chapter.status === "Not Started") {
    score += 20;
    breakdown.push("Chapter Not Started (+20)");
  } else if (chapter.status === "In Progress") {
    score += 10;
    breakdown.push("Chapter In Progress (+10)");
  }

  // 4. PYQ Status
  if (chapter.pyqStatus === "Pending") {
    score += 15;
    breakdown.push("Previous Year Questions (PYQs) Pending (+15)");
  }

  // 5. Revision Count & Recency
  if (chapter.revisionCount === 0) {
    score += 20;
    breakdown.push("Zero Revisions Completed (+20)");
  } else if (chapter.revisionCount === 1) {
    score += 10;
    breakdown.push("Only 1 Revision Completed (+10)");
  }

  if (chapter.lastRevisedAt) {
    const daysSince = (Date.now() - chapter.lastRevisedAt) / (1000 * 60 * 60 * 24);
    if (daysSince > 7) {
      score += 15;
      breakdown.push(`Revision Overdue (${Math.round(daysSince)} days since last revision) (+15)`);
    }
  }

  // 6. Career Connection Alignment Boost
  const isCareerRelevant = targetCareerRequiredSubjects.some(
    (req) =>
      req.toLowerCase().includes(subjectName.toLowerCase()) ||
      subjectName.toLowerCase().includes(req.toLowerCase())
  );
  if (isCareerRelevant) {
    score += 20;
    breakdown.push(`Aligned with Target Career required subject (${subjectName}) (+20)`);
  }

  // Final Level Thresholds
  let priorityLevel: "🔥 High Priority" | "⚡ Medium Priority" | "✅ On Track" = "✅ On Track";
  if (score >= 60) {
    priorityLevel = "🔥 High Priority";
  } else if (score >= 35) {
    priorityLevel = "⚡ Medium Priority";
  }

  return {
    score,
    priorityLevel,
    scoreBreakdown: breakdown,
  };
}

export function generateSmartDailyPlan(
  targetHours: number,
  subjects: AcademicSubject[],
  chapters: AcademicChapter[],
  targetCareerSubjects: string[] = []
): SmartStudyPlan {
  // Calculate priority for all incomplete/weak/pending chapters
  const scoredChapters = chapters.map((ch) => {
    const sub = subjects.find((s) => s.id === ch.subjectId);
    const subName = sub ? sub.name : "Subject";
    const prio = calculateChapterPriorityScore(ch, subName, targetCareerSubjects);
    return {
      chapter: ch,
      subjectName: subName,
      prioResult: prio,
    };
  }).sort((a, b) => b.prioResult.score - a.prioResult.score);

  const slots: SmartStudySlot[] = [];
  const hours = Math.max(1, Math.min(8, targetHours));
  const totalSlotsCount = hours * 2; // 30-min block granularity

  let currentHour = 9; // Start study plan at 09:00 AM
  let chapterIndex = 0;

  for (let i = 0; i < totalSlotsCount; i++) {
    const isBreak = (i + 1) % 4 === 0; // Break every 1.5 hours (3 study blocks)
    const startMins = (i % 2) * 30;
    const endMins = ((i + 1) % 2) * 30;
    const endHour = Math.floor(currentHour + ((i % 2 === 1) ? 1 : 0));

    const timeStr = `${String(currentHour).padStart(2, "0")}:${String(startMins).padStart(2, "0")} - ${String(endHour).padStart(2, "0")}:${String(endMins === 0 ? 30 : 0).padStart(2, "0")}`;

    if (isBreak) {
      slots.push({
        id: `slot-break-${i}`,
        timeSlot: timeStr,
        subjectName: "Rest & Recovery",
        chapterTitle: "15-Min Hydration & Stretching Break",
        activityType: "Break",
        priorityLevel: "✅ On Track",
        reasoning: "Essential cognitive break to optimize retention.",
      });
    } else {
      const target = scoredChapters[chapterIndex % scoredChapters.length] || {
        chapter: { title: "General Subject Revision", priority: "Important", isWeak: false, pyqStatus: "Pending", revisionCount: 0 },
        subjectName: subjects[0]?.name || "Core Subject",
        prioResult: { score: 45, priorityLevel: "⚡ Medium Priority" as const, scoreBreakdown: ["Routine practice"] },
      };

      let activityType: "Study" | "Revision" | "PYQ Practice" | "Test" = "Study";
      if (target.chapter.isWeak || target.prioResult.score >= 60) {
        activityType = target.chapter.pyqStatus === "Pending" ? "PYQ Practice" : "Study";
      } else if (target.chapter.revisionCount < 2) {
        activityType = "Revision";
      }

      slots.push({
        id: `slot-${i}`,
        timeSlot: timeStr,
        subjectName: target.subjectName,
        chapterTitle: target.chapter.title,
        activityType,
        priorityLevel: target.prioResult.priorityLevel,
        reasoning: target.prioResult.scoreBreakdown.slice(0, 2).join("; "),
      });

      if ((i + 1) % 2 === 0) {
        chapterIndex++;
      }
    }

    if (i % 2 === 1) {
      currentHour++;
    }
  }

  return {
    id: `plan-${Date.now()}`,
    generatedDate: new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    targetHours: hours,
    slots,
  };
}

// ==========================================
// GARIA OS V1.8 — PRACTICE STATS CALCULATOR
// ==========================================

export interface PracticeStatsResult {
  totalAttempts: number;
  avgScorePercentage: number;
  bestScorePercentage: number;
  avgAccuracyPercentage: number;
  subjectWise: Record<
    string,
    {
      subjectName: string;
      attempts: number;
      avgScorePct: number;
      accuracyPct: number;
    }
  >;
}

export function calculatePracticeStats(
  sessions: AcademicPracticeSession[]
): PracticeStatsResult {
  if (!sessions || sessions.length === 0) {
    return {
      totalAttempts: 0,
      avgScorePercentage: 0,
      bestScorePercentage: 0,
      avgAccuracyPercentage: 0,
      subjectWise: {},
    };
  }

  let totalPctSum = 0;
  let totalAccSum = 0;
  let bestPct = 0;

  const subjectWise: Record<
    string,
    {
      subjectName: string;
      attempts: number;
      scoreSum: number;
      accuracySum: number;
    }
  > = {};

  sessions.forEach((s) => {
    const scorePct = s.maxMarks > 0 ? (s.score / s.maxMarks) * 100 : 0;
    const acc = s.accuracyPercentage || scorePct;

    totalPctSum += scorePct;
    totalAccSum += acc;
    if (scorePct > bestPct) bestPct = scorePct;

    const subKey = s.subjectId || s.subjectName;
    if (!subjectWise[subKey]) {
      subjectWise[subKey] = {
        subjectName: s.subjectName,
        attempts: 0,
        scoreSum: 0,
        accuracySum: 0,
      };
    }
    subjectWise[subKey].attempts += 1;
    subjectWise[subKey].scoreSum += scorePct;
    subjectWise[subKey].accuracySum += acc;
  });

  const formattedSubjectWise: Record<
    string,
    {
      subjectName: string;
      attempts: number;
      avgScorePct: number;
      accuracyPct: number;
    }
  > = {};

  Object.entries(subjectWise).forEach(([key, val]) => {
    formattedSubjectWise[key] = {
      subjectName: val.subjectName,
      attempts: val.attempts,
      avgScorePct: Math.round(val.scoreSum / val.attempts),
      accuracyPct: Math.round(val.accuracySum / val.attempts),
    };
  });

  return {
    totalAttempts: sessions.length,
    avgScorePercentage: Math.round(totalPctSum / sessions.length),
    bestScorePercentage: Math.round(bestPct),
    avgAccuracyPercentage: Math.round(totalAccSum / sessions.length),
    subjectWise: formattedSubjectWise,
  };
}

// ==========================================
// VVI & REVISION SEEDERS FOR INITIAL DATA
// ==========================================

export function getDefaultVVITopicsForStream(
  stream: StreamType,
  subjects: AcademicSubject[],
  chapters: AcademicChapter[]
): AcademicVVITopic[] {
  // Extract all VVI chapters from active profile chapters
  const vviChaps = chapters.filter((c) => c.priority === "VVI");
  if (vviChaps.length > 0) {
    return vviChaps.map((ch) => {
      const sub = subjects.find((s) => s.id === ch.subjectId);
      return {
        id: `vvi-${ch.id}`,
        subjectId: ch.subjectId,
        subjectName: sub ? sub.name : "Subject",
        chapterTitle: ch.title,
        topicName: ch.topics[0] || ch.title,
        priority: "VVI",
        status: ch.status,
        revisionCount: ch.revisionCount,
        lastRevisedAt: ch.lastRevisedAt,
        notes: ch.notes || "High Priority / Suggested Focus topic for board exams.",
        createdAt: Date.now(),
      };
    });
  }

  // Fallback defaults if no VVI chapters found
  if (stream === "Science") {
    return [
      {
        id: "vvi-phy-1",
        subjectId: subjects.find((s) => s.name.includes("Physics"))?.id || "sub-phy",
        subjectName: "Physics",
        chapterTitle: "Electrostatics & Electric Charges",
        topicName: "Gauss's Law Applications & Dipole",
        priority: "VVI",
        status: "Completed",
        revisionCount: 2,
        notes: "High priority board exam concept.",
        createdAt: Date.now() - 86400000 * 5,
      },
      {
        id: "vvi-chem-1",
        subjectId: subjects.find((s) => s.name.includes("Chemistry"))?.id || "sub-chem",
        subjectName: "Chemistry",
        chapterTitle: "Electrochemistry",
        topicName: "Nernst Equation & Molar Conductivity",
        priority: "VVI",
        status: "In Progress",
        revisionCount: 1,
        notes: "Crucial numerical topic for boards & entrance.",
        createdAt: Date.now() - 86400000 * 3,
      },
      {
        id: "vvi-math-1",
        subjectId: subjects.find((s) => s.name.includes("Math"))?.id || "sub-math-sci",
        subjectName: "Mathematics",
        chapterTitle: "Calculus - Continuity & Differentiability",
        topicName: "Chain Rule & Parametric Functions",
        priority: "VVI",
        status: "In Progress",
        revisionCount: 1,
        notes: "Core topic for calculus weightage.",
        createdAt: Date.now() - 86400000 * 2,
      },
    ];
  } else if (stream === "Arts / Humanities" || stream === "Arts") {
    return [
      {
        id: "vvi-hist-1",
        subjectId: subjects.find((s) => s.name.includes("History"))?.id || "sub-hist",
        subjectName: "History",
        chapterTitle: "Bricks, Beads and Bones",
        topicName: "Harappan Urban Planning & Citadel",
        priority: "VVI",
        status: "Completed",
        revisionCount: 2,
        notes: "High priority long answer topic.",
        createdAt: Date.now() - 86400000 * 5,
      },
      {
        id: "vvi-pol-1",
        subjectId: subjects.find((s) => s.name.includes("Political"))?.id || "sub-pol",
        subjectName: "Political Science",
        chapterTitle: "The End of Bipolarity",
        topicName: "Disintegration of USSR & Consequences",
        priority: "VVI",
        status: "In Progress",
        revisionCount: 1,
        notes: "High priority conceptual question.",
        createdAt: Date.now() - 86400000 * 2,
      },
    ];
  } else {
    // Commerce default
    return [
      {
        id: "vvi-acc-1",
        subjectId: subjects.find((s) => s.name.includes("Accountancy"))?.id || "sub-acc",
        subjectName: "Accountancy",
        chapterTitle: "Partnership Fundamentals",
        topicName: "Profit & Loss Appropriation & Goodwill",
        priority: "VVI",
        status: "Completed",
        revisionCount: 2,
        notes: "Core topic for CA Foundation and Boards.",
        createdAt: Date.now() - 86400000 * 5,
      },
      {
        id: "vvi-eco-1",
        subjectId: subjects.find((s) => s.name.includes("Economics"))?.id || "sub-eco",
        subjectName: "Economics",
        chapterTitle: "National Income Accounting",
        topicName: "Value Added & Income Calculation Methods",
        priority: "VVI",
        status: "Completed",
        revisionCount: 2,
        notes: "High weightage numericals.",
        createdAt: Date.now() - 86400000 * 4,
      },
      {
        id: "vvi-acc-2",
        subjectId: subjects.find((s) => s.name.includes("Accountancy"))?.id || "sub-acc",
        subjectName: "Accountancy",
        chapterTitle: "Issue of Shares",
        topicName: "Pro-Rata Allotment & Forfeiture",
        priority: "VVI",
        status: "In Progress",
        revisionCount: 1,
        notes: "High Priority / Suggested Focus.",
        createdAt: Date.now() - 86400000 * 1,
      },
    ];
  }
}

export function getDefaultRevisionsForStream(
  stream: StreamType,
  subjects: AcademicSubject[],
  chapters: AcademicChapter[]
): AcademicRevisionItem[] {
  const today = new Date().toISOString().split("T")[0];

  // Map weak / in progress / low revision chapters to initial revisions
  const revisionTargetChaps = chapters.filter(
    (c) => c.priority === "VVI" || c.isWeak || c.status === "In Progress"
  );

  if (revisionTargetChaps.length > 0) {
    return revisionTargetChaps.slice(0, 4).map((ch, idx) => {
      const sub = subjects.find((s) => s.id === ch.subjectId);
      const isOverdue = idx === 0;
      const daysOffset = isOverdue ? -1 : idx;
      const targetDate = new Date(Date.now() + daysOffset * 86400000)
        .toISOString()
        .split("T")[0];

      return {
        id: `rev-${ch.id}`,
        subjectId: ch.subjectId,
        subjectName: sub ? sub.name : "Subject",
        chapterId: ch.id,
        chapterTitle: ch.title,
        topicName: ch.topics[0] || ch.title,
        priority: ch.priority,
        scheduledDate: targetDate,
        completed: ch.revisionCount >= 2,
        notes: isOverdue
          ? "Overdue revision! Re-read formula notes and key terms."
          : "Scheduled revision.",
        createdAt: Date.now(),
      };
    });
  }

  return [
    {
      id: "rev-1",
      subjectId: subjects[0]?.id || "sub-1",
      subjectName: subjects[0]?.name || "Core Subject",
      chapterTitle: "Chapter 1 Overview",
      priority: "VVI",
      scheduledDate: today,
      completed: false,
      notes: "First revision pass.",
      createdAt: Date.now(),
    },
  ];
}

// ==========================================
// DYNAMIC ACADEMIC ROADMAP GENERATOR
// ==========================================

export function generateAcademicRoadmapData(
  classLevel: string,
  stream: StreamType,
  subjects: AcademicSubject[],
  chapters: AcademicChapter[],
  vviTopics: AcademicVVITopic[],
  revisions: AcademicRevisionItem[],
  practiceSessions: AcademicPracticeSession[],
  tests: AcademicTest[],
  careerGoalTitle?: string
): AcademicRoadmapData {
  // 1. Overall Syllabus Progress
  const totalChaps = chapters.length;
  const completedChaps = chapters.filter((c) => c.status === "Completed").length;
  const syllabusPct = totalChaps > 0 ? Math.round((completedChaps / totalChaps) * 100) : 0;

  // 2. VVI Progress
  const totalVVI = vviTopics.length;
  const completedVVI = vviTopics.filter((v) => v.status === "Completed").length;
  const vviPct = totalVVI > 0 ? Math.round((completedVVI / totalVVI) * 100) : 0;

  // 3. Revision Progress
  const totalRevisions = revisions.length;
  const completedRevisions = revisions.filter((r) => r.completed).length;
  const revisionPct =
    totalRevisions > 0 ? Math.round((completedRevisions / totalRevisions) * 100) : 0;

  // 4. Practice Progress
  const pyqCompletedChaps = chapters.filter((c) => c.pyqStatus === "Completed").length;
  const pyqTotalChaps = chapters.length;
  const pyqPct = pyqTotalChaps > 0 ? Math.round((pyqCompletedChaps / pyqTotalChaps) * 100) : 0;

  // 5. Exam Prep Status
  const testCount = tests.length + practiceSessions.length;
  const examPrepPct = Math.min(100, Math.round((testCount / Math.max(1, totalChaps)) * 100));

  // Overall Roadmap Progress
  const overallProgress = Math.round(
    syllabusPct * 0.3 + vviPct * 0.2 + revisionPct * 0.2 + pyqPct * 0.15 + examPrepPct * 0.15
  );

  // Helper function for stage status
  const getStageStatus = (pct: number): RoadmapStageStatus => {
    if (pct >= 100) return "Completed";
    if (pct >= 75) return "Almost Done";
    if (pct > 0) return "In Progress";
    return "Not Started";
  };

  // Stage 1: Current Stage
  const currentStageStatus: RoadmapStageStatus =
    overallProgress >= 80 ? "Almost Done" : overallProgress > 0 ? "In Progress" : "Not Started";

  let stage1Desc = `${classLevel} (${stream}) — Standard Core Curriculum Phase`;
  if (classLevel.includes("Dropper") || classLevel.includes("Gap")) {
    stage1Desc = `Dropper / Gap Year (${stream}) — Intensive Review & Entrance Mastery Phase`;
  } else if (classLevel.includes("10")) {
    stage1Desc = `Class 10 Board Exam Track — Fundamental Concepts & Exam Foundation`;
  }

  const stage1: AcademicRoadmapStage = {
    id: "stage-1-current",
    title: "1. Current Stage & Academic Phase",
    description: stage1Desc,
    status: currentStageStatus,
    progress: overallProgress,
    pendingItems: [
      `${totalChaps - completedChaps} chapters pending completion`,
      `${revisions.filter((r) => !r.completed).length} pending revisions`,
    ],
    completedItems: [
      `${completedChaps} chapters completed`,
      `${completedRevisions} revisions done`,
      `Target Career: ${careerGoalTitle || "General Higher Education"}`,
    ],
    suggestedAction:
      totalChaps - completedChaps > 0
        ? `Focus on finishing remaining ${totalChaps - completedChaps} syllabus chapters.`
        : "Syllabus complete! Transition to full mock test series.",
  };

  // Stage 2: Syllabus Completion
  const pendingChapsList = chapters
    .filter((c) => c.status !== "Completed")
    .map((c) => {
      const sub = subjects.find((s) => s.id === c.subjectId);
      return `${sub?.name || "Subject"}: ${c.title}`;
    });

  const completedChapsList = chapters
    .filter((c) => c.status === "Completed")
    .map((c) => {
      const sub = subjects.find((s) => s.id === c.subjectId);
      return `${sub?.name || "Subject"}: ${c.title}`;
    });

  const stage2: AcademicRoadmapStage = {
    id: "stage-2-syllabus",
    title: "2. Syllabus Completion",
    description: `Targeting 100% syllabus coverage across all ${subjects.length} active stream subjects.`,
    status: getStageStatus(syllabusPct),
    progress: syllabusPct,
    pendingItems:
      pendingChapsList.length > 0
        ? pendingChapsList.slice(0, 4)
        : ["All registered chapters completed!"],
    completedItems:
      completedChapsList.length > 0
        ? completedChapsList.slice(0, 4)
        : ["No completed chapters yet."],
    suggestedAction:
      pendingChapsList.length > 0
        ? `Start with top priority topic: ${pendingChapsList[0]}`
        : "Syllabus 100% covered. Keep revising!",
  };

  // Stage 3: VVI Topics
  const pendingVVI = vviTopics.filter((v) => v.status !== "Completed").map((v) => `${v.subjectName}: ${v.chapterTitle}`);
  const completedVVIList = vviTopics.filter((v) => v.status === "Completed").map((v) => `${v.subjectName}: ${v.chapterTitle}`);

  const stage3: AcademicRoadmapStage = {
    id: "stage-3-vvi",
    title: "3. High Priority / VVI Topics Focus",
    description: "High-weightage topics selected for maximum score yield in board and entrance exams.",
    status: getStageStatus(vviPct),
    progress: vviPct,
    pendingItems: pendingVVI.length > 0 ? pendingVVI : ["All VVI topics mastered!"],
    completedItems: completedVVIList.length > 0 ? completedVVIList : ["No VVI topics completed yet."],
    suggestedAction: pendingVVI.length > 0 ? `Master VVI topic: ${pendingVVI[0]}` : "VVI focus complete.",
  };

  // Stage 4: Revision
  const todayStr = new Date().toISOString().split("T")[0];
  const overdueRev = revisions.filter((r) => !r.completed && r.scheduledDate < todayStr).map((r) => `${r.subjectName}: ${r.chapterTitle} (Overdue)`);
  const upcomingRev = revisions.filter((r) => !r.completed && r.scheduledDate >= todayStr).map((r) => `${r.subjectName}: ${r.chapterTitle} (${r.scheduledDate})`);
  const doneRev = revisions.filter((r) => r.completed).map((r) => `${r.subjectName}: ${r.chapterTitle}`);

  const stage4: AcademicRoadmapStage = {
    id: "stage-4-revision",
    title: "4. Revision Planner & Spaced Practice",
    description: "Multi-pass revision strategy to consolidate memory and recall speed.",
    status: getStageStatus(revisionPct),
    progress: revisionPct,
    pendingItems: [...overdueRev, ...upcomingRev].slice(0, 4),
    completedItems: doneRev.slice(0, 4),
    suggestedAction: overdueRev.length > 0 ? `⚠️ Clear ${overdueRev.length} overdue revisions immediately!` : upcomingRev.length > 0 ? `Next revision scheduled: ${upcomingRev[0]}` : "Add new revision tasks.",
  };

  // Stage 5: Mock/PYQ Practice
  const pyqPending = chapters.filter((c) => c.pyqStatus === "Pending").map((c) => {
    const sub = subjects.find((s) => s.id === c.subjectId);
    return `${sub?.name || "Subject"}: ${c.title}`;
  });
  const pyqDone = chapters.filter((c) => c.pyqStatus === "Completed").map((c) => {
    const sub = subjects.find((s) => s.id === c.subjectId);
    return `${sub?.name || "Subject"}: ${c.title}`;
  });

  const stage5: AcademicRoadmapStage = {
    id: "stage-5-practice",
    title: "5. PYQ & Mock Practice Tracker",
    description: "Previous Year Questions (5-10 year analysis) and simulated timing tests.",
    status: getStageStatus(pyqPct),
    progress: pyqPct,
    pendingItems: pyqPending.slice(0, 4),
    completedItems: pyqDone.slice(0, 4),
    suggestedAction: pyqPending.length > 0 ? `Solve PYQs for ${pyqPending[0]}` : "PYQ coverage complete! Take full length mock tests.",
  };

  // Stage 6: Exam Preparation
  const stage6Status: RoadmapStageStatus = testCount >= 5 ? "Almost Done" : testCount >= 1 ? "In Progress" : "Not Started";

  const stage6: AcademicRoadmapStage = {
    id: "stage-6-exam-prep",
    title: "6. Exam & Board Readiness",
    description: "Final exam simulation, error log review, and time management optimization.",
    status: stage6Status,
    progress: Math.min(100, testCount * 20),
    pendingItems: [
      `${Math.max(0, 5 - testCount)} additional mock exams recommended`,
      "Formula & diagram cheat-sheets review",
    ],
    completedItems: [
      `${testCount} mock tests/quizzes recorded`,
      `Average Test Performance: ${calculatePracticeStats(practiceSessions).avgScorePercentage}%`,
    ],
    suggestedAction: "Conduct timed mock exam under exam-like hall conditions.",
  };

  // Stage 7: Career / Entrance Preparation
  let careerTitleName = careerGoalTitle || "Target Career Path";
  let careerFocusDetails = "General Entrance & Higher Studies Alignment";

  if (stream === "Commerce" || careerTitleName.includes("CA") || careerTitleName.includes("Finance") || careerTitleName.includes("Business")) {
    if (careerTitleName.includes("CA")) {
      careerTitleName = "Chartered Accountant (CA Foundation)";
      careerFocusDetails = "Focus: Accountancy, Business Laws, Economics & Quantitative Aptitude.";
    } else {
      careerFocusDetails = "Focus: Business Analytics, Corporate Finance, Banking & Economics.";
    }
  } else if (stream === "Science" || careerTitleName.includes("Engineering") || careerTitleName.includes("Medical") || careerTitleName.includes("NEET") || careerTitleName.includes("JEE")) {
    if (careerTitleName.includes("NEET") || careerTitleName.includes("Medical") || careerTitleName.includes("Doctor")) {
      careerTitleName = "Medical Entrance (NEET UG)";
      careerFocusDetails = "Focus: Biology (Botany/Zoology NCERT line-by-line), Organic Chemistry & Physics numericals.";
    } else {
      careerTitleName = "Engineering Entrance (JEE Main / Advanced)";
      careerFocusDetails = "Focus: Physics Mechanics/Electrodynamics, Calculus & Physical/Organic Chemistry.";
    }
  } else if (stream === "Arts / Humanities" || stream === "Arts" || careerTitleName.includes("Law") || careerTitleName.includes("Civil")) {
    if (careerTitleName.includes("Law") || careerTitleName.includes("CLAT")) {
      careerTitleName = "Law Entrance (CLAT / AILET)";
      careerFocusDetails = "Focus: Legal Reasoning, Political Science, English Comprehension & General Knowledge.";
    } else {
      careerFocusDetails = "Focus: History, Political Theory, Analytical Writing & General Studies.";
    }
  }

  const stage7: AcademicRoadmapStage = {
    id: "stage-7-career",
    title: `7. Career / Entrance Preparation: ${careerTitleName}`,
    description: careerFocusDetails,
    status: overallProgress >= 50 ? "In Progress" : "Not Started",
    progress: overallProgress,
    pendingItems: [
      `Align study schedule with ${careerTitleName} exam pattern`,
      "Solve career-specific entrance question banks",
    ],
    completedItems: [
      `Stream Selected: ${stream}`,
      `Target Goal Linked: ${careerTitleName}`,
    ],
    suggestedAction: `Review ${careerTitleName} syllabus requirements in Career Center.`,
  };

  return {
    classLevel,
    stream,
    targetCareerTitle: careerTitleName,
    overallProgress,
    stages: [stage1, stage2, stage3, stage4, stage5, stage6, stage7],
    lastCalculated: Date.now(),
  };
}
