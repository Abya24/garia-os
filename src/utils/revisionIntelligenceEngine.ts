import {
  AcademicRevisionItem,
  ChapterPriority,
  AcademicChapter,
  AcademicVVITopic,
  ExamTestRecord,
  StudentProfile,
} from "../types";
import { getTodayString } from "./storage";

export type SpacedRepetitionInterval = 1 | 3 | 7 | 15 | 30;

export interface SpacedRepetitionSchedule {
  intervalDays: number;
  stageName: string;
  dueDateStr: string;
  description: string;
}

export const SPACED_REPETITION_INTERVALS = [
  { day: 1, label: "Day 1 (Immediate Recall)", desc: "Consolidate short-term memory after initial learning" },
  { day: 3, label: "Day 3 (First Reinforcement)", desc: "Counteract the initial forgetting curve" },
  { day: 7, label: "Day 7 (Weekly Review)", desc: "Solidify concepts and practice application problems" },
  { day: 15, label: "Day 15 (Bi-Weekly Check)", desc: "Verify formula recall and solve high-yield PYQs" },
  { day: 30, label: "Day 30 (Monthly Mastery)", desc: "Transfer to long-term memory for board exams" },
];

export function computeNextSpacedDates(baseDateStr?: string): SpacedRepetitionSchedule[] {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  
  return SPACED_REPETITION_INTERVALS.map((item) => {
    const d = new Date(base);
    d.setDate(d.getDate() + item.day);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dueDateStr = `${year}-${month}-${day}`;

    return {
      intervalDays: item.day,
      stageName: item.label,
      dueDateStr,
      description: item.desc,
    };
  });
}

export function generateSpacedRepetitionSchedule(
  subjectId: string,
  subjectName: string,
  chapterTitle: string,
  priority: ChapterPriority = "VVI",
  selectedIntervals: SpacedRepetitionInterval[] = [1, 3, 7, 15, 30],
  baseDateStr?: string
): Omit<AcademicRevisionItem, "id" | "createdAt">[] {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();

  return selectedIntervals.map((interval) => {
    const target = new Date(base);
    target.setDate(target.getDate() + interval);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    const scheduledDate = `${year}-${month}-${day}`;

    const matchingMeta = SPACED_REPETITION_INTERVALS.find((i) => i.day === interval);
    const label = matchingMeta?.label || `+${interval} Days Review`;
    const desc = matchingMeta?.desc || `Interval revision checkpoint`;

    return {
      subjectId,
      subjectName,
      chapterTitle: `${chapterTitle} [Day +${interval}]`,
      priority,
      scheduledDate,
      completed: false,
      notes: `Spaced review (${label}): ${desc}`,
    };
  });
}

export interface RevisionCategorizedBuckets {
  todayRevisions: AcademicRevisionItem[];
  weeklyRevisions: AcademicRevisionItem[];
  overdueRevisions: AcademicRevisionItem[];
  upcomingRevisions: AcademicRevisionItem[];
  completedRevisions: AcademicRevisionItem[];
}

export function categorizeRevisions(
  revisions: AcademicRevisionItem[],
  todayStr: string = getTodayString()
): RevisionCategorizedBuckets {
  const today = new Date(todayStr);
  const weekLater = new Date(today);
  weekLater.setDate(weekLater.getDate() + 7);
  const weekLaterStr = weekLater.toISOString().split("T")[0];

  const todayRevisions: AcademicRevisionItem[] = [];
  const weeklyRevisions: AcademicRevisionItem[] = [];
  const overdueRevisions: AcademicRevisionItem[] = [];
  const upcomingRevisions: AcademicRevisionItem[] = [];
  const completedRevisions: AcademicRevisionItem[] = [];

  revisions.forEach((rev) => {
    if (rev.completed) {
      completedRevisions.push(rev);
      return;
    }

    if (rev.scheduledDate < todayStr) {
      overdueRevisions.push(rev);
    } else if (rev.scheduledDate === todayStr) {
      todayRevisions.push(rev);
    } else if (rev.scheduledDate <= weekLaterStr) {
      weeklyRevisions.push(rev);
    } else {
      upcomingRevisions.push(rev);
    }
  });

  return {
    todayRevisions,
    weeklyRevisions,
    overdueRevisions,
    upcomingRevisions,
    completedRevisions,
  };
}

export interface SuggestedRevisionItem {
  subjectId: string;
  subjectName: string;
  chapterTitle: string;
  priority: ChapterPriority;
  reason: string;
}

export interface ComprehensiveRevisionPlan {
  dailySuggestedRevisions: SuggestedRevisionItem[];
  weeklyFocusAreas: string[];
  totalDueToday: number;
}

export function generateComprehensiveRevisionPlan(
  chapters: AcademicChapter[],
  vviTopics: AcademicVVITopic[] = [],
  revisions: AcademicRevisionItem[] = [],
  examTests: ExamTestRecord[] = [],
  activeStudent?: StudentProfile
): ComprehensiveRevisionPlan {
  const dailySuggested: SuggestedRevisionItem[] = [];
  const weeklyFocus: string[] = [];

  // 1. Weak chapters from recent tests
  examTests.forEach((t) => {
    const accuracy = t.maxMarks > 0 ? Math.round((t.marksObtained / t.maxMarks) * 100) : 0;
    const testTopic = t.testName || "Core Topic";
    if (accuracy < 65) {
      const existing = dailySuggested.some((s) => s.chapterTitle === testTopic);
      if (!existing) {
        dailySuggested.push({
          subjectId: t.subjectId || "sub-auto",
          subjectName: t.subjectName || "Subject",
          chapterTitle: testTopic,
          priority: "VVI",
          reason: `Mock Test Weak Area (${accuracy}% accuracy)`,
        });
        weeklyFocus.push(`${t.subjectName || "Subject"}: ${testTopic}`);
      }
    }
  });

  // 2. High priority VVI topics not revised recently
  vviTopics.forEach((vvi) => {
    const isScheduled = revisions.some(
      (r) => !r.completed && r.chapterTitle.toLowerCase().includes(vvi.topicName.toLowerCase())
    );
    if (!isScheduled) {
      const existing = dailySuggested.some((s) => s.chapterTitle === vvi.topicName);
      if (!existing && dailySuggested.length < 8) {
        dailySuggested.push({
          subjectId: vvi.subjectId,
          subjectName: vvi.subjectName,
          chapterTitle: vvi.topicName,
          priority: "VVI",
          reason: "High-Yield Board Exam VVI Topic",
        });
      }
    }
  });

  // 3. Unrevised completed chapters (revisionCount === 0)
  chapters.forEach((ch) => {
    if (ch.status === "Completed" && (ch.revisionCount === 0 || ch.isWeak)) {
      const existing = dailySuggested.some((s) => s.chapterTitle === ch.title);
      if (!existing && dailySuggested.length < 10) {
        dailySuggested.push({
          subjectId: ch.subjectId,
          subjectName: "Curriculum Chapter",
          chapterTitle: ch.title,
          priority: ch.priority || "Important",
          reason: ch.isWeak ? "Flagged as Weak Concept" : "1st Memory Recall Pass Needed",
        });
      }
    }
  });

  return {
    dailySuggestedRevisions: dailySuggested,
    weeklyFocusAreas: Array.from(new Set(weeklyFocus)),
    totalDueToday: dailySuggested.length,
  };
}

export function generateAutomatedSpacedRepetitionPlan(
  subjectId: string,
  subjectName: string,
  chapterTitle: string,
  priority: ChapterPriority = "VVI"
): Omit<AcademicRevisionItem, "id" | "createdAt">[] {
  const schedules = computeNextSpacedDates();
  
  return schedules.map((s) => ({
    subjectId,
    subjectName,
    chapterTitle: `${chapterTitle} [${s.stageName.split(" ")[0]} ${s.stageName.split(" ")[1]}]`,
    priority,
    scheduledDate: s.dueDateStr,
    completed: false,
    notes: `Spaced Repetition Schedule (${s.stageName}): ${s.description}`,
  }));
}
