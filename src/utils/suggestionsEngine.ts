import {
  Task,
  Subject,
  AcademicSubject,
  AcademicChapter,
  Goal,
  WaterLog,
  Habit,
  StudentProfile,
  AcademicVVITopic,
  ExamTestRecord,
  ExamIntelligenceReport,
} from "../types";
import { getTodayString } from "./storage";

export interface SmartSuggestion {
  id: string;
  type: "task" | "study" | "chapter" | "goal" | "hydration" | "habit" | "exam" | "general";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionText?: string;
  targetTab?: string;
  subjectName?: string;
}

export function generateSmartSuggestions(
  profile: StudentProfile,
  tasks: Task[],
  subjects: Subject[],
  academicSubjects: AcademicSubject[],
  chapters: AcademicChapter[],
  goals: Goal[],
  water: WaterLog,
  habits: Habit[],
  dismissedIds: string[] = [],
  examTestRecords: ExamTestRecord[] = [],
  vviTopics: AcademicVVITopic[] = [],
  examReport?: ExamIntelligenceReport | null
): SmartSuggestion[] {
  const rawSuggestions: SmartSuggestion[] = [];
  const todayStr = getTodayString();

  // 0. EXAM INTELLIGENCE RECOMMENDATIONS (V1.9)
  if (examReport && examReport.weakAreas.length > 0) {
    const topWeak = examReport.weakAreas[0];
    rawSuggestions.push({
      id: `sug-exam-weak-${topWeak.subjectId}`,
      type: "exam",
      title: topWeak.areaTitle,
      description: `${topWeak.reason} ${topWeak.suggestedAction}`,
      priority: topWeak.priority === "HIGH" ? "high" : "medium",
      actionText: "Exam Intelligence",
      targetTab: "exam",
      subjectName: topWeak.subjectName,
    });
  }

  // Check unrevised VVI topics count
  const unrevisedVVI = vviTopics.filter((v) => v.status !== "Completed" && v.priority === "VVI");
  if (unrevisedVVI.length > 0) {
    rawSuggestions.push({
      id: "sug-vvi-unrevised",
      type: "exam",
      title: `${unrevisedVVI.length} VVI Topic(s) Unrevised`,
      description: `High-yield VVI topics like "${unrevisedVVI[0].topicName}" (${unrevisedVVI[0].subjectName}) need revision before exams!`,
      priority: "high",
      actionText: "Review VVI Topics",
      targetTab: "academic",
      subjectName: unrevisedVVI[0].subjectName,
    });
  }

  // Check strong subjects praise
  if (examReport && examReport.strongSubjects.length > 0) {
    const strongSub = examReport.strongSubjects[0];
    rawSuggestions.push({
      id: `sug-exam-strong-${strongSub.subjectId}`,
      type: "exam",
      title: `${strongSub.subjectName} is Strong (${strongSub.avgPercentage}%)`,
      description: `Maintain your excellent ${strongSub.subjectName} score while focusing extra time on weaker subjects.`,
      priority: "low",
      actionText: "View Performance",
      targetTab: "exam",
      subjectName: strongSub.subjectName,
    });
  }

  // 1. Overdue Tasks Check (High priority)
  const overdueTasks = tasks.filter((t) => !t.completed && t.date && t.date < todayStr);
  if (overdueTasks.length > 0) {
    rawSuggestions.push({
      id: "sug-overdue-tasks",
      type: "task",
      title: `${overdueTasks.length} Overdue Task(s)`,
      description: `You have overdue tasks from previous days. Catch up now to clear your schedule!`,
      priority: "high",
      actionText: "Review Tasks",
      targetTab: "tasks",
    });
  }

  // 2. Pending Tasks Today
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const unfinishedTasks = todayTasks.filter((t) => !t.completed);

  if (unfinishedTasks.length > 0) {
    const taskSubjects = unfinishedTasks.map((t) => t.title + " " + (t.description || ""));
    const matchedSubject = subjects.find((s) =>
      taskSubjects.some((text) => text.toLowerCase().includes(s.name.toLowerCase()))
    );

    if (matchedSubject) {
      rawSuggestions.push({
        id: "sug-task-subject",
        type: "task",
        title: `Unfinished ${matchedSubject.name} Tasks`,
        description: `You have ${unfinishedTasks.length} pending task(s) for today, including ${matchedSubject.name}.`,
        priority: "high",
        actionText: "View Tasks",
        targetTab: "tasks",
        subjectName: matchedSubject.name,
      });
    } else {
      rawSuggestions.push({
        id: "sug-task-today",
        type: "task",
        title: "Today's Unfinished Tasks",
        description: `You have ${unfinishedTasks.length} pending task(s) scheduled for today. Complete them to maintain your daily streak!`,
        priority: "high",
        actionText: "Open Tasks",
        targetTab: "tasks",
      });
    }
  } else if (todayTasks.length > 0) {
    rawSuggestions.push({
      id: "sug-task-completed",
      type: "task",
      title: "All Tasks Completed!",
      description: `Great job, ${profile.name}! You've finished all ${todayTasks.length} tasks for today.`,
      priority: "low",
      actionText: "Add Next Task",
      targetTab: "tasks",
    });
  }

  // 3. Low Study Hours check for active subjects
  const lowStudySubjects = subjects.filter(
    (s) => s.targetMinutesPerWeek > 0 && s.completedMinutes < s.targetMinutesPerWeek * 0.3
  );
  if (lowStudySubjects.length > 0) {
    const lowest = lowStudySubjects[0];
    const loggedHrs = (lowest.completedMinutes / 60).toFixed(1);
    rawSuggestions.push({
      id: `sug-study-low-${lowest.id}`,
      type: "study",
      title: `Low Study Hours in ${lowest.name}`,
      description: `Your ${lowest.name} study log is low (${loggedHrs} hrs logged vs ${Math.round(lowest.targetMinutesPerWeek / 60)} hrs target).`,
      priority: "high",
      actionText: "Start Timer",
      targetTab: "study",
      subjectName: lowest.name,
    });
  }

  // 4. Weak / VVI Chapters in Active Stream
  const weakChapters = chapters.filter((c) => (c.isWeak || c.priority === "VVI") && c.status !== "Completed");
  if (weakChapters.length > 0) {
    const targetCh = weakChapters[0];
    const sub = academicSubjects.find((s) => s.id === targetCh.subjectId);
    rawSuggestions.push({
      id: `sug-weak-ch-${targetCh.id}`,
      type: "chapter",
      title: `Revise Weak Chapter: ${targetCh.title}`,
      description: `Flagged as ${targetCh.isWeak ? "a weak concept" : "VVI"} in ${sub?.name || profile.stream}. High exam weightage!`,
      priority: "medium",
      actionText: "Review Chapter",
      targetTab: "academic",
      subjectName: sub?.name,
    });
  }

  // 5. Goal Progress Check
  const pendingGoals = goals.filter((g) => !g.completed && g.progress < 100);
  if (pendingGoals.length > 0) {
    const nearGoal = pendingGoals[0];
    rawSuggestions.push({
      id: `sug-goal-${nearGoal.id}`,
      type: "goal",
      title: `Goal Progress: ${nearGoal.title}`,
      description: `Currently at ${nearGoal.progress}% completion. Keep pushing to reach 100%!`,
      priority: "medium",
      actionText: "View Goals",
      targetTab: "goals",
    });
  }

  // 6. Hydration Check
  if (water.glasses < water.goal) {
    const remaining = water.goal - water.glasses;
    rawSuggestions.push({
      id: "sug-water",
      type: "hydration",
      title: "Hydration Reminder",
      description: `You have logged ${water.glasses}/${water.goal} glasses today (${remaining} remaining). Hydrate for peak performance!`,
      priority: "low",
      actionText: "+1 Glass Water",
      targetTab: "water",
    });
  }

  // 7. Habit Check
  const pendingHabits = habits.filter((h) => !h.completedDates.includes(todayStr));
  if (pendingHabits.length > 0) {
    rawSuggestions.push({
      id: "sug-habit",
      type: "habit",
      title: `Daily Habit Check: ${pendingHabits[0].title}`,
      description: `${pendingHabits.length} habit(s) remaining for today. Keep building your daily momentum!`,
      priority: "low",
      actionText: "Check Habits",
      targetTab: "habits",
    });
  }

  // Filter out dismissed suggestions
  const filtered = rawSuggestions.filter((s) => !dismissedIds.includes(s.id));

  // Sort by priority: high -> medium -> low
  const priorityMap: Record<string, number> = { high: 1, medium: 2, low: 3 };
  return filtered.sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority]);
}
