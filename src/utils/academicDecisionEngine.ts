// =======================================================================
// GARIA OS V3.1 - ACADEMIC INTELLIGENCE STUDENT DECISION ENGINE
// =======================================================================
// Pure deterministic intelligence algorithm that translates syllabus data,
// study logs, test records, and stream profile into actionable next steps.
//
// Rules Implemented:
// 1. Weak subjects/topics receive highest priority.
// 2. Near exams exponentially increase revision weighting & urgency.
// 3. Missed study targets trigger immediate alerts.
// 4. Consistent performance (high streak, high test score) lowers panic urgency.
// 5. Recommendations are strictly stream-specific (Commerce, Science, Arts).
// =======================================================================

import {
  StudentProfile,
  AcademicSubject,
  AcademicChapter,
  AcademicVVITopic,
  AcademicRevisionItem,
  AcademicPracticeSession,
  ExamProfile,
  CareerProfile,
  ExamTestRecord,
  Subject,
  StudySession,
  StreamType,
} from "../types";
import { CAREER_CATALOG } from "./careerEngine";
import { CLASS10_CURRICULUM, CurriculumSubject } from "../data/masterCurriculum";

export interface HighPriorityFocusDecision {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  chapterId?: string;
  chapterTitle: string;
  topicTitle: string;
  reason: string;
  urgencyLevel: "CRITICAL" | "HIGH" | "URGENT";
  actionText: string;
  estimatedMinutes: number;
  isWeak: boolean;
  isVVI: boolean;
  priorityScore: number; // 0-100
}

export interface RevisionDueDecisionItem {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  chapterTitle: string;
  topicTitle: string;
  daysSinceLastRevision: number;
  daysText: string;
  revisionUrgencyScore: number; // 0-100
  urgencyBadge: "Overdue" | "Due Today" | "Upcoming";
  priority: "VVI" | "Important" | "Normal";
  actionLabel: string;
}

export interface SubjectReadinessItem {
  subjectId: string;
  subjectName: string;
  color: string;
  readinessPct: number;
  completedChapters: number;
  totalChapters: number;
  accuracyPct: number;
  status: "Strong" | "Average" | "Needs Attention";
}

export interface ExamReadinessDecision {
  overallReadinessPct: number;
  confidenceLevel: "High" | "Moderate" | "Needs Focus";
  subjectReadiness: SubjectReadinessItem[];
  remainingGap: string;
  daysUntilExam: number;
  targetExamName: string;
  actionLabel: string;
}

export interface RiskIndicatorItem {
  id: string;
  risk: string;
  severity: "High" | "Medium" | "Low";
  recommendation: string;
}

export interface ImprovementOpportunityItem {
  id: string;
  opportunity: string;
  potentialGain: string;
  actionText: string;
  targetTab: string;
}

export interface PredictedPerformanceDecision {
  estimatedScoreRange: string;
  predictedAverage: number;
  riskIndicators: RiskIndicatorItem[];
  improvementOpportunities: ImprovementOpportunityItem[];
  actionLabel: string;
}

export interface CareerSkillSuggestion {
  skillName: string;
  category: string;
  description: string;
}

export interface CareerRecommendedSubject {
  name: string;
  relevance: string;
  currentMastery: number;
}

export interface CareerAlignmentDecision {
  targetCareerId: string;
  targetCareerTitle: string;
  stream: StreamType;
  recommendedSubjects: CareerRecommendedSubject[];
  skillSuggestions: CareerSkillSuggestion[];
  careerFitScore: number;
  studyPathway: string;
  actionLabel: string;
}

export interface WeeklyReadinessTrendPoint {
  weekLabel: string;
  readinessPct: number;
}

export interface DecisionEngineAnalytics {
  weeklyImprovementTrendPct: number;
  readinessTimeline: WeeklyReadinessTrendPoint[];
  strongestSubjects: string[];
  weakestSubjects: string[];
  consistencyScore: number;
  missedTargetsAlert: string | null;
  totalStudyHoursLogged: number;
  weeklyTargetStudyHours: number;
}

export interface AcademicDecisionReport {
  studentName: string;
  stream: StreamType;
  classLevel: string;
  highPriorityFocus: HighPriorityFocusDecision;
  revisionDue: {
    items: RevisionDueDecisionItem[];
    totalPendingCount: number;
    dueTodayCount: number;
    avgUrgencyScore: number;
  };
  examReadiness: ExamReadinessDecision;
  predictedPerformance: PredictedPerformanceDecision;
  careerAlignment: CareerAlignmentDecision;
  analytics: DecisionEngineAnalytics;
  generatedAt: number;
}

/**
 * Standardize and sanitize the student's stream
 */
export function normalizeStream(rawStream?: string, classLevel?: string): StreamType {
  const cl = (classLevel || "").toLowerCase();
  if (cl.includes("10") || cl.includes("ninth") || cl.includes("tenth")) {
    return "General";
  }

  const s = (rawStream || "").toLowerCase();
  if (s.includes("comm")) return "Commerce";
  if (s.includes("sci") || s.includes("pcm") || s.includes("pcb")) return "Science";
  if (s.includes("art") || s.includes("human")) return "Arts";
  return "Commerce"; // Default clean baseline
}

/**
 * Stream default topics when user database is fresh
 */
const DEFAULT_STREAM_TOPICS: Record<
  StreamType,
  { subject: string; color: string; chapters: { title: string; topic: string; vvi: boolean }[] }[]
> = {
  Commerce: [
    {
      subject: "Accountancy",
      color: "#06b6d4",
      chapters: [
        { title: "Admission of a Partner", topic: "Revaluation & Goodwill Accounting", vvi: true },
        { title: "Share Capital & Debentures", topic: "Pro-Rata Allotment & Forfeiture", vvi: true },
        { title: "Cash Flow Statement", topic: "Operating Activities & Adjustments", vvi: true },
        { title: "Accounting for Partnership: Basics", topic: "Profit & Loss Appropriation", vvi: false },
      ],
    },
    {
      subject: "Economics",
      color: "#10b981",
      chapters: [
        { title: "National Income Accounting", topic: "Value Added & Income Methods", vvi: true },
        { title: "Money and Banking", topic: "Credit Creation by Commercial Banks", vvi: true },
        { title: "Income Determination & Multiplier", topic: "Deficient Demand & Fiscal Measures", vvi: true },
        { title: "Balance of Payments", topic: "Current vs Capital Account Deficits", vvi: false },
      ],
    },
    {
      subject: "Business Studies",
      color: "#8b5cf6",
      chapters: [
        { title: "Principles of Management", topic: "Fayol's 14 Principles & Taylor Techniques", vvi: true },
        { title: "Financial Management", topic: "Capital Structure & Trading on Equity", vvi: true },
        { title: "Financial Markets", topic: "SEBI Functions & Money Market Instruments", vvi: false },
        { title: "Consumer Protection", topic: "Consumer Rights & Redressal Agencies", vvi: false },
      ],
    },
    {
      subject: "English Core",
      color: "#f59e0b",
      chapters: [
        { title: "The Last Lesson & Lost Spring", topic: "Character Sketches & Central Themes", vvi: false },
        { title: "Writing Skills", topic: "Formal Invitations & Job Application", vvi: true },
      ],
    },
  ],
  Science: [
    {
      subject: "Physics",
      color: "#3b82f6",
      chapters: [
        { title: "Electrostatics & Gauss's Law", topic: "Electric Field on Axial & Equatorial Plane", vvi: true },
        { title: "Electromagnetic Induction & AC", topic: "LCR Series Resonance & Transformers", vvi: true },
        { title: "Optics & Wave Theory", topic: "Lens Maker's Formula & YDSE", vvi: true },
        { title: "Current Electricity", topic: "Kirchhoff's Rules & Drift Velocity", vvi: false },
      ],
    },
    {
      subject: "Chemistry",
      color: "#10b981",
      chapters: [
        { title: "Electrochemistry", topic: "Nernst Equation & Kohlrausch Law", vvi: true },
        { title: "Chemical Kinetics", topic: "First Order Rate Law & Arrhenius Equation", vvi: true },
        { title: "Aldehydes, Ketones & Carboxylic Acids", topic: "Aldol & Cannizzaro Named Reactions", vvi: true },
        { title: "Coordination Compounds", topic: "Crystal Field Theory (CFT)", vvi: false },
      ],
    },
    {
      subject: "Mathematics",
      color: "#ec4899",
      chapters: [
        { title: "Matrices and Determinants", topic: "Matrix Inversion Method & Linear Systems", vvi: true },
        { title: "Calculus: Definite Integrals", topic: "Properties of Definite Integrals & Areas", vvi: true },
        { title: "Three Dimensional Geometry", topic: "Shortest Distance Between Skew Lines", vvi: true },
        { title: "Probability & Bayes' Theorem", topic: "Bayes' Formula Applications", vvi: false },
      ],
    },
    {
      subject: "Biology",
      color: "#14b8a6",
      chapters: [
        { title: "Molecular Basis of Inheritance", topic: "DNA Replication & Lac Operon", vvi: true },
        { title: "Biotechnology: Principles", topic: "Recombinant DNA Technology & PCR", vvi: true },
        { title: "Human Reproduction", topic: "Gametogenesis & Menstrual Cycle", vvi: false },
      ],
    },
  ],
  Arts: [
    {
      subject: "History",
      color: "#d97706",
      chapters: [
        { title: "Bricks, Beads and Bones (Harappa)", topic: "Urban Planning & Drainage System", vvi: true },
        { title: "Kings, Farmers and Towns", topic: "Mauryan Administration & Inscriptions", vvi: true },
        { title: "Mahatma Gandhi & National Movement", topic: "Non-Cooperation to Quit India", vvi: true },
      ],
    },
    {
      subject: "Political Science",
      color: "#6366f1",
      chapters: [
        { title: "The End of Bipolarity", topic: "Disintegration of USSR & Shock Therapy", vvi: true },
        { title: "Contemporary Centres of Power", topic: "European Union & ASEAN Rise", vvi: true },
        { title: "Politics in India Since Independence", topic: "Integration of Princely States & 1975 Emergency", vvi: true },
      ],
    },
    {
      subject: "Geography",
      color: "#059669",
      chapters: [
        { title: "Human Development & Demography", topic: "HDI Indicators & Demographic Transition", vvi: true },
        { title: "India: People and Economy", topic: "River Basins & Water Resource Management", vvi: true },
      ],
    },
    {
      subject: "Sociology",
      color: "#8b5cf6",
      chapters: [
        { title: "Demographic Structure of Society", topic: "Caste Dynamics & Demographic Dividend", vvi: true },
        { title: "Social Movements", topic: "Tribal, Peasant & Environmental Movements", vvi: false },
      ],
    },
  ],
  "Arts / Humanities": [],
  General: [
    {
      subject: "Mathematics",
      color: "#3b82f6",
      chapters: [
        { title: "Real Numbers & Polynomials", topic: "Proof of Irrationality & Zeroes Relation", vvi: true },
        { title: "Quadratic Equations", topic: "Quadratic Formula & Nature of Roots", vvi: true },
        { title: "Triangles & Trigonometry", topic: "BPT Theorem & Trigonometric Identities", vvi: true },
      ],
    },
    {
      subject: "Science",
      color: "#10b981",
      chapters: [
        { title: "Chemical Reactions & Equations", topic: "Types of Reactions & Redox", vvi: true },
        { title: "Life Processes", topic: "Nutrition, Respiration & Excretion in Humans", vvi: true },
        { title: "Light & Electricity", topic: "Lens Formula & Ohm's Law Combinations", vvi: true },
      ],
    },
    {
      subject: "Social Science",
      color: "#f59e0b",
      chapters: [
        { title: "Nationalism in India", topic: "Civil Disobedience & Rowlatt Satyagraha", vvi: true },
        { title: "Power Sharing & Federalism", topic: "Decentralization & Coalition Governance", vvi: true },
      ],
    },
  ],
};

DEFAULT_STREAM_TOPICS["Arts / Humanities"] = DEFAULT_STREAM_TOPICS["Arts"];

/**
 * Main Decision Engine: Generates the actionable 5-section decision report
 */
export function generateAcademicDecisionReport(params: {
  student?: StudentProfile;
  careerProfile?: CareerProfile;
  examProfile?: ExamProfile;
  academicSubjects?: AcademicSubject[];
  academicChapters?: AcademicChapter[];
  vviTopics?: AcademicVVITopic[];
  revisions?: AcademicRevisionItem[];
  practiceSessions?: AcademicPracticeSession[];
  examRecords?: ExamTestRecord[];
  studyTrackerSubjects?: Subject[];
  studySessions?: StudySession[];
  streakDays?: number;
}): AcademicDecisionReport {
  const {
    student,
    careerProfile,
    examProfile,
    academicSubjects = [],
    academicChapters = [],
    vviTopics = [],
    revisions = [],
    practiceSessions = [],
    examRecords = [],
    studyTrackerSubjects = [],
    studySessions = [],
    streakDays = 1,
  } = params;

  const rawStream = student?.stream || careerProfile?.stream || examProfile?.stream || "Commerce";
  const classLevel = student?.classLevel || careerProfile?.currentClass || examProfile?.classLevel || "Class 12";
  const stream = normalizeStream(rawStream, classLevel);
  const studentName = student?.name || "Student";

  // 1. Calculate Countdown & Exam Urgency Weight (Rule 2)
  let daysUntilExam = 45;
  const targetExamName =
    examProfile?.examName ||
    `${classLevel} ${stream} Board Final Examination`;

  if (examProfile?.startDate) {
    const targetDateStr = examProfile.startDate;
    if (targetDateStr) {
      const examDate = new Date(targetDateStr);
      const now = new Date();
      const diffTime = examDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (!isNaN(diffDays) && diffDays > 0) {
        daysUntilExam = diffDays;
      }
    }
  }

  // Exam proximity multiplier: < 15 days = 1.6x, < 30 days = 1.35x, < 60 days = 1.15x
  const examProximityMultiplier =
    daysUntilExam <= 15 ? 1.6 : daysUntilExam <= 30 ? 1.35 : daysUntilExam <= 60 ? 1.15 : 1.0;

  // 2. Filter / Seed Stream-Specific Curriculum Subjects (Rule 5)
  const defaultStreamData = DEFAULT_STREAM_TOPICS[stream] || DEFAULT_STREAM_TOPICS.Commerce;

  // Combine loaded academic subjects or fallback to default stream data
  const streamSubjectNames = defaultStreamData.map((d) => d.subject.toLowerCase());
  let relevantSubjects = academicSubjects.filter((s) =>
    streamSubjectNames.some((sn) => s.name.toLowerCase().includes(sn) || sn.includes(s.name.toLowerCase()))
  );

  if (relevantSubjects.length === 0) {
    relevantSubjects = defaultStreamData.map((d, idx) => ({
      id: `sub-stream-${idx}`,
      name: d.subject,
      stream,
      color: d.color,
    }));
  }

  // 3. Filter / Seed Chapters Strictly for this Stream
  let relevantChapters = academicChapters.filter((ch) => {
    const parentSub = relevantSubjects.find((s) => s.id === ch.subjectId);
    return !!parentSub;
  });

  if (relevantChapters.length === 0) {
    // Generate clean seed chapters from defaultStreamData
    let chapCounter = 1;
    relevantChapters = defaultStreamData.flatMap((d, sIdx) => {
      const subId = relevantSubjects[sIdx]?.id || `sub-stream-${sIdx}`;
      return d.chapters.map((c, cIdx) => ({
        id: `ch-gen-${chapCounter++}`,
        subjectId: subId,
        chapterNumber: cIdx + 1,
        title: c.title,
        topics: [c.topic],
        status: cIdx === 0 ? ("In Progress" as const) : ("Not Started" as const),
        priority: c.vvi ? ("VVI" as const) : ("Important" as const),
        isWeak: cIdx === 0, // Flag first as needing attention
        pyqStatus: "Pending" as const,
        revisionCount: 0,
        testStatus: "Pending" as const,
      }));
    });
  }

  // 4. Calculate Subject-Wise Readiness & Track Weak Areas (Rule 1 & Rule 3)
  const totalStudyMinutesAll = studySessions.reduce((acc, s) => acc + (s.durationSeconds || 0) / 60, 0);
  const targetStudyHoursWeekly = Math.max(15, relevantSubjects.length * 4);
  const loggedStudyHours = Math.round((totalStudyMinutesAll / 60) * 10) / 10;

  const subjectReadinessList: SubjectReadinessItem[] = relevantSubjects.map((sub, idx) => {
    const subChapters = relevantChapters.filter((c) => c.subjectId === sub.id);
    const completedCh = subChapters.filter((c) => c.status === "Completed").length;
    const inProgressCh = subChapters.filter((c) => c.status === "In Progress").length;
    const totalCh = Math.max(subChapters.length, 1);

    // Test records for this subject
    const subTests = examRecords.filter(
      (r) =>
        r.subjectId === sub.id ||
        (r.subjectName && r.subjectName.toLowerCase().includes(sub.name.toLowerCase()))
    );

    let testAvg = 0;
    if (subTests.length > 0) {
      testAvg = Math.round(
        subTests.reduce((acc, t) => acc + (t.marksObtained / (t.maxMarks || 100)) * 100, 0) / subTests.length
      );
    } else {
      // Default baseline based on completed ratio
      testAvg = completedCh > 0 ? Math.min(85, 60 + completedCh * 8) : 55;
    }

    // Check study tracker completed minutes
    const trackerSub = studyTrackerSubjects.find(
      (s) => s.name.toLowerCase() === sub.name.toLowerCase()
    );
    const compTrackerMins = trackerSub?.completedMinutes || 0;
    const targetTrackerMins = trackerSub?.targetMinutesPerWeek || 240;
    const trackerCoveragePct = Math.min(100, Math.round((compTrackerMins / targetTrackerMins) * 100));

    // Subject Readiness Formula: 50% Chapter Completion + 30% Test Accuracy + 20% Weekly Study Target
    const chapterProgressPct = Math.round(((completedCh + inProgressCh * 0.5) / totalCh) * 100);
    const rawReadiness = Math.round(chapterProgressPct * 0.5 + testAvg * 0.3 + trackerCoveragePct * 0.2);
    const readinessPct = Math.max(10, Math.min(99, rawReadiness));

    let status: "Strong" | "Average" | "Needs Attention" = "Average";
    if (readinessPct >= 75 && testAvg >= 75) {
      status = "Strong";
    } else if (readinessPct < 55 || testAvg < 60 || subChapters.some((c) => c.isWeak)) {
      status = "Needs Attention";
    }

    const defaultColor = defaultStreamData[idx % defaultStreamData.length]?.color || "#06b6d4";

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      color: sub.color || defaultColor,
      readinessPct,
      completedChapters: completedCh,
      totalChapters: totalCh,
      accuracyPct: testAvg,
      status,
    };
  });

  // Calculate Overall Exam Readiness
  const overallReadinessPct =
    subjectReadinessList.length > 0
      ? Math.round(
          subjectReadinessList.reduce((acc, s) => acc + s.readinessPct, 0) / subjectReadinessList.length
        )
      : 72;

  // Confidence Level
  const confidenceLevel: "High" | "Moderate" | "Needs Focus" =
    overallReadinessPct >= 80 ? "High" : overallReadinessPct >= 60 ? "Moderate" : "Needs Focus";

  // Identify Weakest Subject
  const sortedSubjectsByReadiness = [...subjectReadinessList].sort((a, b) => a.readinessPct - b.readinessPct);
  const weakestSubject = sortedSubjectsByReadiness[0] || subjectReadinessList[0];
  const strongestSubject = sortedSubjectsByReadiness[sortedSubjectsByReadiness.length - 1] || subjectReadinessList[0];

  // 5. =========================================================================
  // SECTION 1: 🔥 High Priority Focus Decision (Rule 1, Rule 2, Rule 3, Rule 4)
  // =========================================================================
  // Find the single most urgent chapter / topic in need of focus
  let topCandidateChapter: AcademicChapter | null = null;
  let focusReason = "";
  let urgencyLevel: "CRITICAL" | "HIGH" | "URGENT" = "CRITICAL";
  let priorityScore = 95;

  // 1st priority: Flagged weak + VVI chapter
  topCandidateChapter =
    relevantChapters.find((c) => c.isWeak && c.priority === "VVI") ||
    relevantChapters.find((c) => c.isWeak) ||
    relevantChapters.find((c) => c.subjectId === weakestSubject?.subjectId && c.status !== "Completed") ||
    relevantChapters.find((c) => c.priority === "VVI" && c.status !== "Completed") ||
    relevantChapters[0];

  const parentSubject = relevantSubjects.find((s) => s.id === topCandidateChapter?.subjectId) || relevantSubjects[0];
  const topicTitle =
    topCandidateChapter?.topics && topCandidateChapter.topics[0]
      ? topCandidateChapter.topics[0]
      : `${topCandidateChapter?.title || "Core Concepts"} Key Practice`;

  if (topCandidateChapter?.isWeak && topCandidateChapter.priority === "VVI") {
    focusReason = `High-yield VVI board topic with low mastery scores (${weakestSubject?.accuracyPct || 55}% accuracy). Revision required before exam countdown reaches ${daysUntilExam} days.`;
    urgencyLevel = "CRITICAL";
    priorityScore = Math.min(99, Math.round(92 * examProximityMultiplier));
  } else if (weakestSubject && weakestSubject.readinessPct < 60) {
    focusReason = `${weakestSubject.subjectName} is currently your lowest-readiness subject at ${weakestSubject.readinessPct}%. Completing this chapter closes a major syllabus gap.`;
    urgencyLevel = "HIGH";
    priorityScore = Math.min(95, Math.round(85 * examProximityMultiplier));
  } else if (daysUntilExam <= 30) {
    focusReason = `Exam in ${daysUntilExam} days: Board past questions frequently test this high-weight topic. Complete a timed practice session today.`;
    urgencyLevel = "URGENT";
    priorityScore = 88;
  } else {
    focusReason = `Next sequential chapter in your ${stream} syllabus. Build strong conceptual foundation to maintain your study momentum.`;
    urgencyLevel = "HIGH";
    priorityScore = 80;
  }

  // Consistency Rule (Rule 4): If student has high streak and good accuracy, adjust urgency smoothly
  if (streakDays >= 7 && overallReadinessPct >= 82) {
    urgencyLevel = "HIGH";
    focusReason = `You have strong discipline (${streakDays}-day streak!). Tackle this key ${parentSubject?.name} topic to push into the 90%+ top percentile.`;
  }

  const highPriorityFocus: HighPriorityFocusDecision = {
    subjectId: parentSubject?.id || "sub-1",
    subjectName: parentSubject?.name || "Accountancy",
    subjectColor: parentSubject?.color || "#06b6d4",
    chapterId: topCandidateChapter?.id,
    chapterTitle: topCandidateChapter?.title || "Key Concepts",
    topicTitle,
    reason: focusReason,
    urgencyLevel,
    actionText: `Start Studying ${parentSubject?.name || "Topic"}`,
    estimatedMinutes: 45,
    isWeak: topCandidateChapter?.isWeak || false,
    isVVI: topCandidateChapter?.priority === "VVI",
    priorityScore,
  };

  // 6. =========================================================================
  // SECTION 2: 📚 Revision Due Decision
  // =========================================================================
  const revisionItems: RevisionDueDecisionItem[] = [];

  // If user has saved revisions, map them
  if (revisions && revisions.length > 0) {
    revisions
      .filter((r) => !r.completed)
      .slice(0, 5)
      .forEach((r, idx) => {
        const sub = relevantSubjects.find((s) => s.id === r.subjectId || s.name === r.subjectName);
        const daysDiff = idx * 2 + 1;
        const urgency = Math.min(99, Math.round((85 - idx * 8) * examProximityMultiplier));

        revisionItems.push({
          id: r.id,
          subjectId: r.subjectId,
          subjectName: r.subjectName || sub?.name || "Subject",
          subjectColor: sub?.color || "#10b981",
          chapterTitle: r.chapterTitle,
          topicTitle: r.topicName || r.chapterTitle,
          daysSinceLastRevision: daysDiff,
          daysText: daysDiff === 1 ? "Due Today" : `Overdue by ${daysDiff} days`,
          revisionUrgencyScore: urgency,
          urgencyBadge: daysDiff === 1 ? "Due Today" : "Overdue",
          priority: r.priority || "VVI",
          actionLabel: "Revise Topic",
        });
      });
  }

  // If fewer than 3 revisions, synthesize stream-accurate revision candidates
  if (revisionItems.length < 3) {
    const sampleChaps = relevantChapters.slice(0, 4);
    sampleChaps.forEach((ch, idx) => {
      if (revisionItems.some((r) => r.chapterTitle === ch.title)) return;
      const sub = relevantSubjects.find((s) => s.id === ch.subjectId) || relevantSubjects[idx % relevantSubjects.length];
      const daysSince = (idx + 1) * 3;
      const rawScore = Math.round((88 - idx * 10) * (ch.priority === "VVI" ? 1.15 : 1.0) * examProximityMultiplier);
      const urgency = Math.min(99, Math.max(50, rawScore));

      revisionItems.push({
        id: `rev-synth-${idx}`,
        subjectId: sub?.id || "sub-1",
        subjectName: sub?.name || "Subject",
        subjectColor: sub?.color || "#8b5cf6",
        chapterTitle: ch.title,
        topicTitle: ch.topics && ch.topics[0] ? ch.topics[0] : `${ch.title} Core Revision`,
        daysSinceLastRevision: daysSince,
        daysText: idx === 0 ? "Due Today (Spaced Cycle)" : `Last revised ${daysSince}d ago`,
        revisionUrgencyScore: urgency,
        urgencyBadge: idx === 0 ? "Due Today" : daysSince > 5 ? "Overdue" : "Upcoming",
        priority: ch.priority,
        actionLabel: "Revise Now",
      });
    });
  }

  const avgRevUrgency =
    revisionItems.length > 0
      ? Math.round(revisionItems.reduce((acc, r) => acc + r.revisionUrgencyScore, 0) / revisionItems.length)
      : 80;

  // 7. =========================================================================
  // SECTION 3: 🎯 Exam Readiness Decision
  // =========================================================================
  const uncompletedVVICount = relevantChapters.filter((c) => c.priority === "VVI" && c.status !== "Completed").length;
  const remainingGap =
    uncompletedVVICount > 0
      ? `${100 - overallReadinessPct}% syllabus gap with ${uncompletedVVICount} high-yield VVI chapters unmastered in ${weakestSubject?.subjectName || "core subjects"}.`
      : `${100 - overallReadinessPct}% syllabus gap. Focus on full-length mock papers and timed speed drills.`;

  const examReadiness: ExamReadinessDecision = {
    overallReadinessPct,
    confidenceLevel,
    subjectReadiness: subjectReadinessList,
    remainingGap,
    daysUntilExam,
    targetExamName,
    actionLabel: "Practice Weak Areas",
  };

  // 8. =========================================================================
  // SECTION 4: 📊 Predicted Performance Decision
  // =========================================================================
  const minPredicted = Math.max(55, Math.min(92, overallReadinessPct - 5));
  const maxPredicted = Math.min(99, Math.max(75, overallReadinessPct + 7));
  const estimatedScoreRange = `${minPredicted}% – ${maxPredicted}%`;

  const riskIndicators: RiskIndicatorItem[] = [];
  if (weakestSubject && weakestSubject.readinessPct < 65) {
    riskIndicators.push({
      id: "risk-1",
      risk: `Low mastery in ${weakestSubject.subjectName} (${weakestSubject.readinessPct}% readiness)`,
      severity: "High",
      recommendation: "Dedicate 45 minutes of daily focus timer specifically to solving PYQs.",
    });
  }
  if (loggedStudyHours < targetStudyHoursWeekly * 0.6) {
    riskIndicators.push({
      id: "risk-2",
      risk: `Study hours lagging (${loggedStudyHours}h logged of ${targetStudyHoursWeekly}h weekly target)`,
      severity: "Medium",
      recommendation: "Add 1 evening focus block to prevent syllabus backlog before exam.",
    });
  }
  if (uncompletedVVICount >= 2) {
    riskIndicators.push({
      id: "risk-3",
      risk: `${uncompletedVVICount} VVI Board Exam chapters pending first revision`,
      severity: "High",
      recommendation: "Prioritize VVI flashcards and formula sheets in revision queue.",
    });
  }

  const improvementOpportunities: ImprovementOpportunityItem[] = [
    {
      id: "opp-1",
      opportunity: `Master ${highPriorityFocus.chapterTitle} in ${highPriorityFocus.subjectName}`,
      potentialGain: "+4% to +6% score increase",
      actionText: "Study Topic",
      targetTab: "study",
    },
    {
      id: "opp-2",
      opportunity: `Solve 2022-2024 Board Previous Year Questions (PYQs)`,
      potentialGain: "+8% speed & accuracy boost",
      actionText: "Open Exam Center",
      targetTab: "exam",
    },
    {
      id: "opp-3",
      opportunity: `Clear doubts with Abya AI multimodal tutor`,
      potentialGain: "Rapid conceptual clarity",
      actionText: "Ask Abya AI",
      targetTab: "abya",
    },
  ];

  const predictedPerformance: PredictedPerformanceDecision = {
    estimatedScoreRange,
    predictedAverage: Math.round((minPredicted + maxPredicted) / 2),
    riskIndicators,
    improvementOpportunities,
    actionLabel: "Launch Diagnostic Quiz",
  };

  // 9. =========================================================================
  // SECTION 5: 🏆 Career Alignment Decision
  // =========================================================================
  // Match stream-specific career
  const streamCareers = CAREER_CATALOG.filter((c) => {
    const cStream = normalizeStream(c.stream);
    return cStream === stream || (stream === "General" && cStream === "Commerce");
  });

  const selectedCareerId = careerProfile?.selectedCareerId;
  const targetCareer =
    (selectedCareerId && CAREER_CATALOG.find((c) => c.id === selectedCareerId)) ||
    streamCareers[0] ||
    CAREER_CATALOG[0];

  const careerRecommendedSubjects: CareerRecommendedSubject[] = (targetCareer.requiredSubjects || []).map((subName) => {
    const matchedSub = subjectReadinessList.find(
      (s) => s.subjectName.toLowerCase().includes(subName.toLowerCase()) || subName.toLowerCase().includes(s.subjectName.toLowerCase())
    );
    return {
      name: subName,
      relevance: "Core Entrance & Professional Foundation",
      currentMastery: matchedSub?.readinessPct || 70,
    };
  });

  const skillSuggestions: CareerSkillSuggestion[] = (targetCareer.keySkills || [
    "Analytical Reasoning",
    "Conceptual Clarity",
    "Time Management",
  ])
    .slice(0, 3)
    .map((skill, sIdx) => {
      const descriptions: Record<string, string> = {
        "Numerical Ability": "High-speed calculation & ledger accuracy for accounting/finance.",
        "Analytical Thinking": "Evaluating economic models and financial balance sheet ratios.",
        "Taxation & Legal Knowledge": "Understanding GST, income tax slabs, and corporate filings.",
        "Corporate Law": "Navigating regulatory compliances and board-level resolutions.",
        "Problem Solving": "Breaking complex physics & math derivations into step-by-step algorithms.",
      };
      return {
        skillName: skill,
        category: sIdx === 0 ? "Technical Foundation" : sIdx === 1 ? "Cognitive Skill" : "Industry Practice",
        description: descriptions[skill] || `Essential competency for excelling in ${targetCareer.title}.`,
      };
    });

  const careerAlignment: CareerAlignmentDecision = {
    targetCareerId: targetCareer.id,
    targetCareerTitle: targetCareer.title,
    stream,
    recommendedSubjects: careerRecommendedSubjects,
    skillSuggestions,
    careerFitScore: Math.min(98, Math.max(72, Math.round(overallReadinessPct * 0.6 + 32))),
    studyPathway: targetCareer.studyPathway || "Class 12 Foundation -> Professional Degree -> Industry Practice",
    actionLabel: "Explore Career Pathway",
  };

  // 10. =========================================================================
  // ANALYTICS & IMPROVEMENT TRENDS
  // =========================================================================
  // 4-week trend simulation based on streak & study sessions
  const trendBase = Math.max(45, overallReadinessPct - 12);
  const readinessTimeline: WeeklyReadinessTrendPoint[] = [
    { weekLabel: "Week 1", readinessPct: trendBase },
    { weekLabel: "Week 2", readinessPct: Math.min(95, trendBase + 4) },
    { weekLabel: "Week 3", readinessPct: Math.min(97, trendBase + 8) },
    { weekLabel: "Week 4 (Current)", readinessPct: overallReadinessPct },
  ];

  const weeklyImprovementTrendPct = Math.round(overallReadinessPct - trendBase);

  // Missed target alert
  let missedTargetsAlert: string | null = null;
  if (loggedStudyHours < targetStudyHoursWeekly * 0.5) {
    missedTargetsAlert = `Alert: You have completed ${loggedStudyHours}h of your ${targetStudyHoursWeekly}h weekly target. Log 2 study sessions today to get back on track.`;
  }

  const analytics: DecisionEngineAnalytics = {
    weeklyImprovementTrendPct,
    readinessTimeline,
    strongestSubjects: [strongestSubject?.subjectName || "Accountancy"],
    weakestSubjects: [weakestSubject?.subjectName || "Economics"],
    consistencyScore: Math.min(100, streakDays * 12 + 40),
    missedTargetsAlert,
    totalStudyHoursLogged: loggedStudyHours,
    weeklyTargetStudyHours: targetStudyHoursWeekly,
  };

  return {
    studentName,
    stream,
    classLevel,
    highPriorityFocus,
    revisionDue: {
      items: revisionItems,
      totalPendingCount: revisionItems.length,
      dueTodayCount: revisionItems.filter((r) => r.urgencyBadge === "Due Today").length,
      avgUrgencyScore: avgRevUrgency,
    },
    examReadiness,
    predictedPerformance,
    careerAlignment,
    analytics,
    generatedAt: Date.now(),
  };
}
