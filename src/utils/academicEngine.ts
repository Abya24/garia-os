import {
  AcademicSubject,
  AcademicChapter,
  AcademicTest,
  SmartStudyPlan,
  SmartStudySlot,
  StreamType,
} from "../types";

export const DEFAULT_COMMERCE_SUBJECTS: AcademicSubject[] = [
  { id: "sub-acc", name: "Accountancy", stream: "Commerce", color: "emerald" },
  { id: "sub-bst", name: "Business Studies", stream: "Commerce", color: "cyan" },
  { id: "sub-eco", name: "Economics", stream: "Commerce", color: "purple" },
  { id: "sub-math-comm", name: "Mathematics / Applied Math", stream: "Commerce", color: "blue" },
  { id: "sub-eng-comm", name: "English Core", stream: "Commerce", color: "amber" },
  { id: "sub-ip", name: "Informatics Practices / Optional", stream: "Commerce", color: "rose" },
];

export const DEFAULT_SCIENCE_SUBJECTS: AcademicSubject[] = [
  { id: "sub-phy", name: "Physics", stream: "Science", color: "cyan" },
  { id: "sub-chem", name: "Chemistry", stream: "Science", color: "emerald" },
  { id: "sub-math-sci", name: "Mathematics", stream: "Science", color: "blue" },
  { id: "sub-bio", name: "Biology", stream: "Science", color: "rose" },
  { id: "sub-cs", name: "Computer Science", stream: "Science", color: "purple" },
  { id: "sub-eng-sci", name: "English Core", stream: "Science", color: "amber" },
];

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
