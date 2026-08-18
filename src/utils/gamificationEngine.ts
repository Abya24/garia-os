import {
  Task,
  StudySession,
  FocusSessionLog,
  Habit,
  Goal,
  ExamTestRecord,
  AcademicPracticeSession,
  StudentProfile,
  QuestionBankProfileProgress,
} from "../types";

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon tag
  category: "study" | "practice" | "streak" | "mastery" | "consistency";
  unlocked: boolean;
  unlockedAt?: number;
  progress: number; // 0-100
}

export interface MilestoneBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "tasks" | "study" | "general";
  unlocked: boolean;
  currentValue: number;
  targetValue: number;
  progress: number; // 0-100
  unit: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xpBonus: number;
}

export function getTaskMilestones(tasks: Task[] = []): {
  badges: MilestoneBadge[];
  unlockedCount: number;
  totalCount: number;
  latestUnlocked: MilestoneBadge | null;
} {
  const completedTasks = tasks.filter((t) => t.completed);
  const completedCount = completedTasks.length;
  const highPriorityCompleted = completedTasks.filter((t) => t.priority === "high").length;
  const studyCategoryCompleted = completedTasks.filter((t) => t.category === "study").length;

  const badges: MilestoneBadge[] = [
    {
      id: "task_milestone_1",
      name: "First Step",
      description: "Completed your first task in Garia OS",
      icon: "🌱",
      category: "tasks",
      unlocked: completedCount >= 1,
      currentValue: completedCount,
      targetValue: 1,
      progress: Math.min(100, Math.round((completedCount / 1) * 100)),
      unit: "tasks",
      rarity: "common",
      xpBonus: 25,
    },
    {
      id: "task_milestone_5",
      name: "5 Tasks Completed",
      description: "Successfully finished 5 productive tasks",
      icon: "🎯",
      category: "tasks",
      unlocked: completedCount >= 5,
      currentValue: completedCount,
      targetValue: 5,
      progress: Math.min(100, Math.round((completedCount / 5) * 100)),
      unit: "tasks",
      rarity: "common",
      xpBonus: 50,
    },
    {
      id: "task_milestone_10",
      name: "Deca Achiever",
      description: "Completed 10 tasks across your schedule",
      icon: "⚡",
      category: "tasks",
      unlocked: completedCount >= 10,
      currentValue: completedCount,
      targetValue: 10,
      progress: Math.min(100, Math.round((completedCount / 10) * 100)),
      unit: "tasks",
      rarity: "rare",
      xpBonus: 100,
    },
    {
      id: "task_milestone_25",
      name: "Productivity Titan",
      description: "Conquered 25 tasks with outstanding consistency",
      icon: "🏆",
      category: "tasks",
      unlocked: completedCount >= 25,
      currentValue: completedCount,
      targetValue: 25,
      progress: Math.min(100, Math.round((completedCount / 25) * 100)),
      unit: "tasks",
      rarity: "epic",
      xpBonus: 250,
    },
    {
      id: "task_milestone_priority",
      name: "High-Impact Hero",
      description: "Completed 3 High-Priority critical objectives",
      icon: "🔥",
      category: "tasks",
      unlocked: highPriorityCompleted >= 3,
      currentValue: highPriorityCompleted,
      targetValue: 3,
      progress: Math.min(100, Math.round((highPriorityCompleted / 3) * 100)),
      unit: "high priority tasks",
      rarity: "rare",
      xpBonus: 75,
    },
    {
      id: "task_milestone_study",
      name: "Academic Crusher",
      description: "Completed 5 study-specific syllabus tasks",
      icon: "📚",
      category: "tasks",
      unlocked: studyCategoryCompleted >= 5,
      currentValue: studyCategoryCompleted,
      targetValue: 5,
      progress: Math.min(100, Math.round((studyCategoryCompleted / 5) * 100)),
      unit: "study tasks",
      rarity: "rare",
      xpBonus: 75,
    },
  ];

  const unlocked = badges.filter((b) => b.unlocked);
  return {
    badges,
    unlockedCount: unlocked.length,
    totalCount: badges.length,
    latestUnlocked: unlocked[unlocked.length - 1] || null,
  };
}

export function getStudyMilestones(
  studySessions: StudySession[] = [],
  subjects: { id: string; name: string }[] = []
): {
  badges: MilestoneBadge[];
  unlockedCount: number;
  totalCount: number;
  totalHoursStudied: number;
  latestUnlocked: MilestoneBadge | null;
} {
  const totalMinutes = Math.round(
    studySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60
  );
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // 1 decimal place

  // Unique subjects studied
  const studiedSubjectIds = new Set(studySessions.map((s) => s.subjectId).filter(Boolean));
  const uniqueSubjectsCount = studiedSubjectIds.size;

  // Longest session in minutes
  const maxSessionMins = Math.round(
    studySessions.reduce((max, s) => {
      const mins = Math.round((s.durationSeconds || 0) / 60);
      return Math.max(max, mins);
    }, 0)
  );

  const badges: MilestoneBadge[] = [
    {
      id: "study_milestone_first",
      name: "First Study Log",
      description: "Logged your first self-study timer session",
      icon: "⏱️",
      category: "study",
      unlocked: studySessions.length >= 1,
      currentValue: studySessions.length,
      targetValue: 1,
      progress: Math.min(100, Math.round((studySessions.length / 1) * 100)),
      unit: "sessions",
      rarity: "common",
      xpBonus: 25,
    },
    {
      id: "study_milestone_1h",
      name: "1 Hour Studied",
      description: "Clocked 1 full hour of dedicated study focus",
      icon: "📖",
      category: "study",
      unlocked: totalMinutes >= 60,
      currentValue: totalHours,
      targetValue: 1,
      progress: Math.min(100, Math.round((totalMinutes / 60) * 100)),
      unit: "hours",
      rarity: "common",
      xpBonus: 50,
    },
    {
      id: "study_milestone_5h",
      name: "5 Hours Studied",
      description: "Achieved 5 cumulative hours of focused learning",
      icon: "💡",
      category: "study",
      unlocked: totalMinutes >= 300,
      currentValue: totalHours,
      targetValue: 5,
      progress: Math.min(100, Math.round((totalMinutes / 300) * 100)),
      unit: "hours",
      rarity: "rare",
      xpBonus: 100,
    },
    {
      id: "study_milestone_10h",
      name: "10 Hours Studied",
      description: "Crossed double-digit mastery: 10 Hours Studied!",
      icon: "🎓",
      category: "study",
      unlocked: totalMinutes >= 600,
      currentValue: totalHours,
      targetValue: 10,
      progress: Math.min(100, Math.round((totalMinutes / 600) * 100)),
      unit: "hours",
      rarity: "rare",
      xpBonus: 200,
    },
    {
      id: "study_milestone_25h",
      name: "25 Hours Studied",
      description: "Logged 25 hours of deep academic preparation",
      icon: "🏆",
      category: "study",
      unlocked: totalMinutes >= 1500,
      currentValue: totalHours,
      targetValue: 25,
      progress: Math.min(100, Math.round((totalMinutes / 1500) * 100)),
      unit: "hours",
      rarity: "epic",
      xpBonus: 350,
    },
    {
      id: "study_milestone_50h",
      name: "50 Hours Grandmaster",
      description: "Exceeded 50 hours of relentless academic mastery",
      icon: "👑",
      category: "study",
      unlocked: totalMinutes >= 3000,
      currentValue: totalHours,
      targetValue: 50,
      progress: Math.min(100, Math.round((totalMinutes / 3000) * 100)),
      unit: "hours",
      rarity: "legendary",
      xpBonus: 500,
    },
    {
      id: "study_milestone_multi",
      name: "Polymath Scholar",
      description: "Logged study time across 3 or more subjects",
      icon: "🌐",
      category: "study",
      unlocked: uniqueSubjectsCount >= 3,
      currentValue: uniqueSubjectsCount,
      targetValue: 3,
      progress: Math.min(100, Math.round((uniqueSubjectsCount / 3) * 100)),
      unit: "subjects",
      rarity: "rare",
      xpBonus: 100,
    },
    {
      id: "study_milestone_marathon",
      name: "Deep Immersion",
      description: "Finished a single intense session lasting 90+ minutes",
      icon: "🚀",
      category: "study",
      unlocked: maxSessionMins >= 90,
      currentValue: maxSessionMins,
      targetValue: 90,
      progress: Math.min(100, Math.round((maxSessionMins / 90) * 100)),
      unit: "mins",
      rarity: "epic",
      xpBonus: 150,
    },
  ];

  const unlocked = badges.filter((b) => b.unlocked);
  return {
    badges,
    unlockedCount: unlocked.length,
    totalCount: badges.length,
    totalHoursStudied: totalHours,
    latestUnlocked: unlocked[unlocked.length - 1] || null,
  };
}

export interface GamificationState {
  totalXP: number;
  currentLevel: number;
  levelTitle: string;
  currentStreak: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  levelProgressPercent: number;
  latestBadge: BadgeItem | null;
  unlockedBadges: BadgeItem[];
  allBadges: BadgeItem[];
  xpBreakdown: {
    mcqs: number;
    pyqs: number;
    practice: number;
    studySessions: number;
    focusSessions: number;
    tasks: number;
    habits: number;
    tests: number;
    goals: number;
  };
}

const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: "Novice Scholar" },
  { level: 2, xpRequired: 150, title: "Dedicated Learner" },
  { level: 3, xpRequired: 400, title: "Concept Master" },
  { level: 4, xpRequired: 800, title: "Academic Champion" },
  { level: 5, xpRequired: 1400, title: "Board Prep Ace" },
  { level: 6, xpRequired: 2200, title: "Scholar Prodigy" },
  { level: 7, xpRequired: 3200, title: "Exam Grandmaster" },
  { level: 8, xpRequired: 4500, title: "Garia Legend" },
];

export function calculateGamificationState(
  student?: StudentProfile,
  tasks: Task[] = [],
  studySessions: StudySession[] = [],
  focusLogs: FocusSessionLog[] = [],
  habits: Habit[] = [],
  goals: Goal[] = [],
  testRecords: ExamTestRecord[] = [],
  practiceSessions: AcademicPracticeSession[] = [],
  qbankProgress?: QuestionBankProfileProgress
): GamificationState {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeStudySessions = Array.isArray(studySessions) ? studySessions : [];
  const safeFocusLogs = Array.isArray(focusLogs) ? focusLogs : [];
  const safeHabits = Array.isArray(habits) ? habits : [];
  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeTestRecords = Array.isArray(testRecords) ? testRecords : [];
  const safePracticeSessions = Array.isArray(practiceSessions) ? practiceSessions : [];

  // 1. Calculate XP Sources
  const completedTasksCount = safeTasks.filter((t) => t && t.completed).length;
  const taskXP = completedTasksCount * 15;

  const totalStudyMinutes = Math.round(
    safeStudySessions.reduce((acc, s) => acc + (s?.durationSeconds || 0), 0) / 60
  );
  const studySessionXP = Math.round(totalStudyMinutes * 0.8) + safeStudySessions.length * 10;

  const focusSessionXP = safeFocusLogs.filter((f) => f && f.type === "focus").length * 20;

  let totalHabitCompletions = 0;
  let maxStreak = 0;
  safeHabits.forEach((h) => {
    if (!h) return;
    totalHabitCompletions += (Array.isArray(h.completedDates) ? h.completedDates : []).length;
    if ((h.streak || 0) > maxStreak) maxStreak = h.streak || 0;
  });
  const habitXP = totalHabitCompletions * 10;

  const completedGoalsCount = safeGoals.filter((g) => g && g.completed).length;
  const goalXP = completedGoalsCount * 30;

  const testXP = safeTestRecords.length * 50;
  const practiceXP = safePracticeSessions.length * 25;

  // Question Bank XP
  let mcqXP = 0;
  let pyqXP = 0;
  if (qbankProgress) {
    const attempts = Object.values(qbankProgress.mcqAttempts || {});
    const correctCount = attempts.filter((a: any) => a && a.isCorrect).length;
    mcqXP = correctCount * 10 + (attempts.length - correctCount) * 3;
    pyqXP = (Array.isArray(qbankProgress.pyqCompleted) ? qbankProgress.pyqCompleted : []).length * 20;
  }

  const totalXP =
    taskXP +
    studySessionXP +
    focusSessionXP +
    habitXP +
    goalXP +
    testXP +
    practiceXP +
    mcqXP +
    pyqXP;

  // 2. Determine Level
  let currentLevel = 1;
  let levelTitle = "Novice Scholar";
  let xpForCurrent = 0;
  let xpForNext = 150;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xpRequired) {
      currentLevel = LEVEL_THRESHOLDS[i].level;
      levelTitle = LEVEL_THRESHOLDS[i].title;
      xpForCurrent = LEVEL_THRESHOLDS[i].xpRequired;
      xpForNext = LEVEL_THRESHOLDS[i + 1]?.xpRequired || xpForCurrent + 1500;
      break;
    }
  }

  const xpInCurrentLevel = Math.max(0, totalXP - xpForCurrent);
  const xpNeededSpan = Math.max(1, xpForNext - xpForCurrent);
  const levelProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededSpan) * 100));

  // 3. Badges Configuration
  const allBadges: BadgeItem[] = [
    {
      id: "badge_first_step",
      name: "First Step",
      description: "Completed first study task or logged a study session",
      icon: "🌱",
      category: "study",
      unlocked: completedTasksCount >= 1 || studySessions.length >= 1,
      progress: Math.min(100, ((completedTasksCount + studySessions.length) / 1) * 100),
    },
    {
      id: "badge_streak_starter",
      name: "Streak Champion",
      description: "Maintained a 3-day active study or habit streak",
      icon: "🔥",
      category: "streak",
      unlocked: maxStreak >= 3,
      progress: Math.min(100, Math.round((maxStreak / 3) * 100)),
    },
    {
      id: "badge_deep_focus",
      name: "Deep Focus Master",
      description: "Completed 5 Pomodoro focus sessions",
      icon: "⚡",
      category: "consistency",
      unlocked: focusLogs.filter((f) => f.type === "focus").length >= 5,
      progress: Math.min(
        100,
        Math.round((focusLogs.filter((f) => f.type === "focus").length / 5) * 100)
      ),
    },
    {
      id: "badge_mcq_solver",
      name: "Question Crusher",
      description: "Attempted and solved 10+ Question Bank MCQs",
      icon: "🎯",
      category: "practice",
      unlocked: (qbankProgress ? Object.keys(qbankProgress.mcqAttempts || {}).length : 0) >= 10,
      progress: Math.min(
        100,
        Math.round(
          ((qbankProgress ? Object.keys(qbankProgress.mcqAttempts || {}).length : 0) / 10) * 100
        )
      ),
    },
    {
      id: "badge_test_ace",
      name: "Mock Test Ace",
      description: "Logged 2 or more Mock Test or PYQ practice scores",
      icon: "🏆",
      category: "mastery",
      unlocked: testRecords.length + practiceSessions.length >= 2,
      progress: Math.min(100, Math.round(((testRecords.length + practiceSessions.length) / 2) * 100)),
    },
    {
      id: "badge_goal_getter",
      name: "Goal Getter",
      description: "Achieved and completed an academic milestone goal",
      icon: "⭐",
      category: "mastery",
      unlocked: completedGoalsCount >= 1,
      progress: Math.min(100, completedGoalsCount * 100),
    },
    {
      id: "badge_scholar_centurion",
      name: "Scholar Centurion",
      description: "Reached 500+ Total XP in Garia OS",
      icon: "👑",
      category: "mastery",
      unlocked: totalXP >= 500,
      progress: Math.min(100, Math.round((totalXP / 500) * 100)),
    },
  ];

  const unlockedBadges = allBadges.filter((b) => b.unlocked);
  const latestBadge = unlockedBadges[unlockedBadges.length - 1] || allBadges[0];

  return {
    totalXP,
    currentLevel,
    levelTitle,
    currentStreak: maxStreak || (completedTasksCount > 0 ? 1 : 0),
    xpInCurrentLevel,
    xpForNextLevel: xpForNext,
    levelProgressPercent,
    latestBadge,
    unlockedBadges,
    allBadges,
    xpBreakdown: {
      mcqs: mcqXP,
      pyqs: pyqXP,
      practice: practiceXP,
      studySessions: studySessionXP,
      focusSessions: focusSessionXP,
      tasks: taskXP,
      habits: habitXP,
      tests: testXP,
      goals: goalXP,
    },
  };
}
