import {
  Task,
  Subject,
  AcademicSubject,
  AcademicChapter,
  Goal,
  WaterLog,
  Habit,
  StudentProfile,
} from "../types";

export interface SmartSuggestion {
  id: string;
  type: "task" | "study" | "chapter" | "goal" | "hydration" | "habit" | "general";
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
  habits: Habit[]
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Pending Tasks Today
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const unfinishedTasks = todayTasks.filter((t) => !t.completed);

  if (unfinishedTasks.length > 0) {
    const taskSubjects = unfinishedTasks.map((t) => t.title + " " + (t.description || ""));
    const matchedSubject = subjects.find((s) =>
      taskSubjects.some((text) => text.toLowerCase().includes(s.name.toLowerCase()))
    );

    if (matchedSubject) {
      suggestions.push({
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
      suggestions.push({
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
    suggestions.push({
      id: "sug-task-completed",
      type: "task",
      title: "All Tasks Completed!",
      description: `Great job, ${profile.name}! You've finished all ${todayTasks.length} tasks for today.`,
      priority: "low",
      actionText: "Add Next Task",
      targetTab: "tasks",
    });
  }

  // 2. Low Study Hours check
  const lowStudySubjects = subjects.filter(
    (s) => s.targetMinutesPerWeek > 0 && s.completedMinutes < s.targetMinutesPerWeek * 0.3
  );
  if (lowStudySubjects.length > 0) {
    const lowest = lowStudySubjects[0];
    const loggedHrs = (lowest.completedMinutes / 60).toFixed(1);
    suggestions.push({
      id: `sug-study-low-${lowest.id}`,
      type: "study",
      title: `Low Study Hours in ${lowest.name}`,
      description: `Your ${lowest.name} study log is low (${loggedHrs} hrs logged this week vs ${Math.round(lowest.targetMinutesPerWeek / 60)} hrs target).`,
      priority: "high",
      actionText: "Start Study Timer",
      targetTab: "study",
      subjectName: lowest.name,
    });
  }

  // 3. Weak Chapters in Active Stream
  const weakChapters = chapters.filter((c) => c.isWeak || c.priority === "VVI");
  if (weakChapters.length > 0) {
    const targetCh = weakChapters[0];
    const sub = academicSubjects.find((s) => s.id === targetCh.subjectId);
    suggestions.push({
      id: `sug-weak-ch-${targetCh.id}`,
      type: "chapter",
      title: `Revise Weak Chapter: ${targetCh.title}`,
      description: `Flagged as ${targetCh.isWeak ? "a weak concept" : "VVI"} in ${sub?.name || profile.stream}. High exam weightage!`,
      priority: "medium",
      actionText: "Review Syllabus",
      targetTab: "academic",
      subjectName: sub?.name,
    });
  }

  // 4. Goal Progress Check
  const pendingGoals = goals.filter((g) => !g.completed && g.progress < 100);
  if (pendingGoals.length > 0) {
    const nearGoal = pendingGoals[0];
    suggestions.push({
      id: `sug-goal-${nearGoal.id}`,
      type: "goal",
      title: `Goal Progress: ${nearGoal.title}`,
      description: `Currently at ${nearGoal.progress}% completion. Focus on reaching 100%!`,
      priority: "medium",
      actionText: "View Goals",
      targetTab: "home",
    });
  }

  // 5. Hydration Check
  if (water.glasses < water.goal) {
    const remaining = water.goal - water.glasses;
    suggestions.push({
      id: "sug-water",
      type: "hydration",
      title: "Hydration Reminder",
      description: `You have logged ${water.glasses}/${water.goal} glasses today (${remaining} remaining). Hydrate for peak cognitive performance!`,
      priority: "low",
      actionText: "+1 Glass Water",
      targetTab: "home",
    });
  }

  // 6. Habit Check
  const pendingHabits = habits.filter((h) => !h.completedDates.includes(todayStr));
  if (pendingHabits.length > 0) {
    suggestions.push({
      id: "sug-habit",
      type: "habit",
      title: `Daily Habit Check: ${pendingHabits[0].title}`,
      description: `${pendingHabits.length} habit(s) remaining for today. Keep building your daily momentum!`,
      priority: "low",
      actionText: "Check Habits",
      targetTab: "habits",
    });
  }

  return suggestions;
}
