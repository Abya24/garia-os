import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Flag,
  Tag,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  FileText,
  X,
  Pin,
  Target,
  Sliders,
  ClipboardList,
  Compass,
  Lightbulb,
  Flame,
  BarChart3,
  Calendar,
  Milestone,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Task,
  Subject,
  StudySession,
  FocusSessionLog,
  Note,
  Habit,
  WaterLog,
  UserSettings,
  ActiveTab,
  Goal,
  CalendarEvent,
  StudentProfile,
  ExamTestRecord,
  ExamProfile,
  CareerProfile,
  Priority,
  TaskCategory,
  AcademicChapter,
} from "../types";
import {
  getTodayString,
  loadAcademicSubjects,
  loadAcademicChapters,
  loadVVITopics,
  loadAcademicRevisions,
  loadAcademicPractice,
  loadNotes,
  saveNotes,
  loadHabits,
  saveHabits,
  loadGoals,
  saveGoals,
  loadTasks,
  saveTasks,
} from "../utils/storage";
import { calculateGamificationState } from "../utils/gamificationEngine";
import { generateExamIntelligenceReport } from "../utils/examIntelligenceEngine";
import { AppLanguage } from "../utils/i18n";
import { getTimeOfDayGreeting } from "../utils/dateTimeUtils";
import {
  fetchDailyQuote,
  fetchNextQuote,
  getMorningDateKey,
  MOTIVATIONAL_QUOTES,
  MotivationalQuote,
} from "../utils/quotes";
import { HeroSection } from "../components/home/sections/HeroSection";
import { StudyStreak } from "../components/StudyStreak";
import { QuickFocusWidget } from "../components/QuickFocusWidget";
import { DailyWellnessReminder } from "../components/DailyWellnessReminder";
import { UrgentAttentionBanner } from "../components/UrgentAttentionBanner";
import { ModuleEmptyState } from "../components/ModuleEmptyState";
import { DailyExecutionSection } from "../components/home/sections/DailyExecutionSection";
import { AcademicDecisionEngineSection } from "../components/home/sections/AcademicDecisionEngineSection";
import { WellnessSection } from "../components/home/sections/WellnessSection";

interface HomeDashboardProps {
  tasks: Task[];
  subjects: Subject[];
  studySessions?: StudySession[];
  focusLogs?: FocusSessionLog[];
  academicChapters?: AcademicChapter[];
  notes: Note[];
  habits: Habit[];
  water: WaterLog;
  goals?: Goal[];
  events?: CalendarEvent[];
  examTestRecords?: ExamTestRecord[];
  examProfile?: ExamProfile;
  careerProfile?: CareerProfile;
  settings: UserSettings;
  activeStudent?: StudentProfile;
  currentLanguage?: AppLanguage;
  onUpdateLanguage?: (lang: AppLanguage) => void;
  onNavigate: (tab: ActiveTab) => void;
  onQuickAddTask?: () => void;
  onAddTask?: (task: Omit<Task, "id" | "createdAt">) => void;
  onUpdateTask?: (task: Task) => void;
  onAddNote?: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  onAddHabit?: (habit: Omit<Habit, "id" | "streak" | "completedDates" | "createdAt">) => void;
  onAddGoal?: (goal: Omit<Goal, "id" | "createdAt">) => void;
  onLogFocusSession?: (log: Omit<FocusSessionLog, "id">) => void;
  onUpdateSettings?: (settings: UserSettings) => void;
  onAddWaterGlass: () => void;
  onRemoveWaterGlass?: () => void;
  onToggleTask?: (task: Task) => void;
  onToggleHabit?: (habitId: string, dateStr: string) => void;
  onOpenMoreMenu?: () => void;
  onOpenSearch?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  tasks,
  subjects,
  studySessions = [],
  focusLogs = [],
  academicChapters: propAcademicChapters,
  notes,
  habits,
  water,
  goals = [],
  events = [],
  examTestRecords = [],
  examProfile,
  careerProfile,
  settings,
  activeStudent,
  currentLanguage = "en",
  onUpdateLanguage,
  onNavigate,
  onQuickAddTask,
  onAddTask,
  onUpdateTask,
  onAddNote,
  onAddHabit,
  onAddGoal,
  onLogFocusSession,
  onUpdateSettings,
  onAddWaterGlass,
  onRemoveWaterGlass,
  onToggleTask,
  onToggleHabit,
  onOpenMoreMenu,
  onOpenSearch,
}) => {
  const todayStr = getTodayString();
  const [dashboardSectionFilter, setDashboardSectionFilter] = useState<
    "all" | "execution" | "academic" | "wellness"
  >("all");
  const [quickTaskDurationMins, setQuickTaskDurationMins] = useState<number>(45);

  // Academic Dataset for Decision Engine & Daily Academic Insight Card
  const academicSubjects = useMemo(
    () => loadAcademicSubjects(activeStudent?.stream, activeStudent?.id, activeStudent?.classLevel),
    [activeStudent?.stream, activeStudent?.id, activeStudent?.classLevel]
  );
  const [storedAcademicChapters, setStoredAcademicChapters] = useState<AcademicChapter[]>(() =>
    loadAcademicChapters(activeStudent?.id)
  );
  useEffect(() => {
    setStoredAcademicChapters(loadAcademicChapters(activeStudent?.id));
  }, [activeStudent?.id]);

  const academicChapters = useMemo(
    () =>
      Array.isArray(propAcademicChapters) && propAcademicChapters.length > 0
        ? propAcademicChapters
        : storedAcademicChapters,
    [propAcademicChapters, storedAcademicChapters]
  );
  const vviTopics = useMemo(
    () => loadVVITopics(activeStudent?.id),
    [activeStudent?.id]
  );
  const academicRevisions = useMemo(
    () => loadAcademicRevisions(activeStudent?.id),
    [activeStudent?.id]
  );
  const academicPractice = useMemo(
    () => loadAcademicPractice(activeStudent?.id),
    [activeStudent?.id]
  );

  // Live Clock & Date State
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Motivational Quote
  const morningDateKey = getMorningDateKey(currentDateTime);
  const [quoteIndex, setQuoteIndex] = useState<number>(() => {
    const daily = fetchDailyQuote(getMorningDateKey(new Date()));
    const idx = MOTIVATIONAL_QUOTES.findIndex((q) => q.id === daily.id);
    return idx >= 0 ? idx : 0;
  });

  // Automatically update to the fresh morning quote when a new day starts
  useEffect(() => {
    const daily = fetchDailyQuote(morningDateKey);
    const idx = MOTIVATIONAL_QUOTES.findIndex((q) => q.id === daily.id);
    if (idx >= 0) {
      setQuoteIndex(idx);
    }
  }, [morningDateKey]);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => fetchNextQuote(prev).index);
  };

  const activeQuote: MotivationalQuote = MOTIVATIONAL_QUOTES[quoteIndex] || MOTIVATIONAL_QUOTES[0];

  // Dynamic Greeting based on time of day via centralized utility
  const displayGreeting = getTimeOfDayGreeting(currentDateTime, currentLanguage === "hi" ? "hi" : "en");

  const formattedDate = currentDateTime.toLocaleDateString(
    currentLanguage === "hi" ? "hi-IN" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const formattedTime = currentDateTime.toLocaleTimeString(
    currentLanguage === "hi" ? "hi-IN" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }
  );

  // Productivity Score Calculation
  const gamification = useMemo(() => {
    return calculateGamificationState(
      activeStudent,
      tasks || [],
      studySessions || [],
      focusLogs || [],
      habits || [],
      goals || [],
      examTestRecords || [],
      [],
      undefined
    );
  }, [activeStudent, tasks, studySessions, focusLogs, habits, goals, examTestRecords]);

  // Local captured tasks & task overrides to ensure immediate UI feedback
  const [localCapturedTasks, setLocalCapturedTasks] = useState<Task[]>([]);
  const [localTaskOverrides, setLocalTaskOverrides] = useState<Record<string, Partial<Task>>>({});

  const combinedTasks = useMemo(() => {
    const incoming = Array.isArray(tasks) ? tasks : [];
    const existingIds = new Set(incoming.map((t) => t.id));
    const uniqueLocal = localCapturedTasks.filter((t) => !existingIds.has(t.id));
    return [...uniqueLocal, ...incoming].map((t) =>
      localTaskOverrides[t.id] ? { ...t, ...localTaskOverrides[t.id] } : t
    );
  }, [tasks, localCapturedTasks, localTaskOverrides]);

  // Overdue tasks filtering (incomplete tasks with date strictly before todayStr)
  const overdueTasks = useMemo(() => {
    return combinedTasks
      .filter((task) => !task.completed && Boolean(task.date) && task.date < todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [combinedTasks, todayStr]);

  const handleMarkOverdueTaskDone = (task: Task) => {
    const updatedTask: Task = { ...task, completed: true };
    setLocalTaskOverrides((prev) => ({
      ...prev,
      [task.id]: { ...(prev[task.id] || {}), completed: true },
    }));
    if (onUpdateTask) {
      onUpdateTask(updatedTask);
    } else if (onToggleTask && !task.completed) {
      onToggleTask(task);
    } else {
      const existing = loadTasks(activeStudent?.id);
      const next = existing.map((t) => (t.id === task.id ? updatedTask : t));
      saveTasks(next, activeStudent?.id);
    }
  };

  const handleRescheduleOverdueTask = (task: Task, newDateStr: string) => {
    const updatedTask: Task = { ...task, date: newDateStr };
    setLocalTaskOverrides((prev) => ({
      ...prev,
      [task.id]: { ...(prev[task.id] || {}), date: newDateStr },
    }));
    if (onUpdateTask) {
      onUpdateTask(updatedTask);
    } else {
      const existing = loadTasks(activeStudent?.id);
      const next = existing.map((t) => (t.id === task.id ? updatedTask : t));
      saveTasks(next, activeStudent?.id);
    }
  };

  const handleMarkAllOverdueDone = () => {
    overdueTasks.forEach((t) => handleMarkOverdueTaskDone(t));
  };

  const handleRescheduleAllOverdue = (newDateStr: string) => {
    overdueTasks.forEach((t) => handleRescheduleOverdueTask(t, newDateStr));
  };

  const handleAddSampleOverdueTask = () => {
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(
      yesterdayObj.getMonth() + 1
    ).padStart(2, "0")}-${String(yesterdayObj.getDate()).padStart(2, "0")}`;
    const firstSub = availableSubjects[0];
    const overduePayload: Omit<Task, "id" | "createdAt"> = {
      title: firstSub
        ? `Complete ${firstSub.name} Previous Year Questions Set`
        : "Complete Pending Chapter Revision & Practice Problems",
      description: "Overdue priority study task requiring immediate completion or rescheduling.",
      date: yesterdayStr,
      priority: "high",
      category: "study",
      completed: false,
      subjectId: firstSub?.id,
      subjectName: firstSub?.name,
    };
    handleDashboardAddTask(overduePayload);
  };

  // Today's tasks filtering
  const todaysTasks = useMemo(() => {
    return combinedTasks.filter((task) => task.date === todayStr);
  }, [combinedTasks, todayStr]);

  const completedTodayCount = todaysTasks.filter((t) => t.completed).length;

  // Exam Intelligence Report
  const examReport = useMemo(() => {
    if (!activeStudent) return null;
    return generateExamIntelligenceReport(
      activeStudent,
      examProfile,
      examTestRecords || [],
      [],
      [],
      [],
      [],
      [],
      careerProfile
    );
  }, [activeStudent, examProfile, examTestRecords, careerProfile]);

  // Focus time today
  const todayFocusMinutes = useMemo(() => {
    return focusLogs
      .filter((l) => l.date === todayStr && l.type === "focus")
      .reduce((acc, l) => acc + l.durationMinutes, 0);
  }, [focusLogs, todayStr]);

  // Total Study Minutes today (Study sessions + Focus sessions)
  const todayStudyMinutes = useMemo(() => {
    const studySecs = (studySessions || [])
      .filter((s) => s.date === todayStr)
      .reduce((acc, s) => acc + s.durationSeconds, 0);
    return Math.round(studySecs / 60) + todayFocusMinutes;
  }, [studySessions, todayFocusMinutes, todayStr]);

  // Direct Quick Task Input State on HomeDashboard
  const [quickTaskTitle, setQuickTaskTitle] = useState<string>("");
  const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>("medium");
  const [quickTaskCategory, setQuickTaskCategory] = useState<TaskCategory>("study");
  const [quickTaskSubjectId, setQuickTaskSubjectId] = useState<string>("");
  const [quickTaskAddedFeedback, setQuickTaskAddedFeedback] = useState<boolean>(false);

  // Available subjects for Quick Assign dropdown
  const availableSubjects = useMemo(() => {
    if (Array.isArray(subjects) && subjects.length > 0) {
      return subjects.map((s) => ({ id: s.id, name: s.name }));
    }
    if (Array.isArray(academicSubjects) && academicSubjects.length > 0) {
      return academicSubjects.map((s) => ({ id: s.id, name: s.name }));
    }
    return [
      { id: "sub-1", name: "Accountancy" },
      { id: "sub-2", name: "Economics" },
      { id: "sub-3", name: "Business Studies" },
    ];
  }, [subjects, academicSubjects]);

  const handleDirectQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTaskTitle.trim();
    if (!trimmed) return;

    const assignedSubject = availableSubjects.find(
      (s) => s.id === quickTaskSubjectId
    );

    const newTaskPayload: Omit<Task, "id" | "createdAt"> = {
      title: trimmed,
      description: "",
      date: todayStr,
      priority: quickTaskPriority,
      category: quickTaskCategory,
      completed: false,
      subjectId: assignedSubject?.id,
      subjectName: assignedSubject?.name,
    };

    const createdTask: Task = {
      ...newTaskPayload,
      id: "task-" + Date.now(),
      createdAt: Date.now(),
    };
    setLocalCapturedTasks((prev) => [createdTask, ...prev]);

    if (onAddTask) {
      onAddTask(newTaskPayload);
      setQuickTaskTitle("");
      setQuickTaskAddedFeedback(true);
      setTimeout(() => setQuickTaskAddedFeedback(false), 2500);
    } else if (onQuickAddTask) {
      onQuickAddTask();
    } else {
      setQuickTaskTitle("");
      setQuickTaskAddedFeedback(true);
      setTimeout(() => setQuickTaskAddedFeedback(false), 2500);
    }
  };

  // Focus Mode State (from Settings)
  const isFocusMode = Boolean(settings?.focusMode);

  // Floating Quick-Add Note & Quick-Add Habit Modal States
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState<boolean>(false);
  const [quickNoteTitle, setQuickNoteTitle] = useState<string>("");
  const [quickNoteContent, setQuickNoteContent] = useState<string>("");
  const [quickNotePinned, setQuickNotePinned] = useState<boolean>(false);
  const [quickNoteTag, setQuickNoteTag] = useState<string>("Idea");
  const [isQuickHabitModalOpen, setIsQuickHabitModalOpen] = useState<boolean>(false);
  const [quickHabitTitle, setQuickHabitTitle] = useState<string>("");
  const [quickHabitCategory, setQuickHabitCategory] = useState<Habit["category"]>("study");
  const [localCapturedNotes, setLocalCapturedNotes] = useState<Note[]>([]);
  const [localCapturedHabits, setLocalCapturedHabits] = useState<Habit[]>([]);
  const [localCapturedGoals, setLocalCapturedGoals] = useState<Goal[]>([]);
  const [quickNoteSavedFeedback, setQuickNoteSavedFeedback] = useState<string | null>(null);

  const combinedNotes = useMemo(() => {
    const incoming = Array.isArray(notes) ? notes : [];
    const existingIds = new Set(incoming.map((n) => n.id));
    const uniqueLocal = localCapturedNotes.filter((n) => !existingIds.has(n.id));
    return [...uniqueLocal, ...incoming]
      .filter((n) => !Boolean(n.archived))
      .map((n) => ({
        ...n,
        pinned: Boolean(n.pinned),
        archived: Boolean(n.archived),
        labels: Array.isArray(n.labels) ? n.labels : Array.isArray(n.tags) ? n.tags : [],
      }))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
      });
  }, [notes, localCapturedNotes]);

  const combinedHabits = useMemo(() => {
    const incoming = Array.isArray(habits) ? habits : [];
    const existingIds = new Set(incoming.map((h) => h.id));
    const uniqueLocal = localCapturedHabits.filter((h) => !existingIds.has(h.id));
    return [...uniqueLocal, ...incoming];
  }, [habits, localCapturedHabits]);

  const combinedGoals = useMemo(() => {
    const incoming = Array.isArray(goals) ? goals : [];
    const existingIds = new Set(incoming.map((g) => g.id));
    const uniqueLocal = localCapturedGoals.filter((g) => !existingIds.has(g.id));
    return [...uniqueLocal, ...incoming];
  }, [goals, localCapturedGoals]);

  // Empty-state detection for Tasks, Notes, Habits, and Goals modules
  const isTasksEmpty = todaysTasks.length === 0;
  const isAllTasksEmpty = combinedTasks.length === 0;
  const isNotesEmpty = combinedNotes.length === 0;
  const isHabitsEmpty = combinedHabits.length === 0;
  const isGoalsEmpty = combinedGoals.length === 0;

  // Detect whether student data is present across modules
  const hasStudentDataPresent =
    !isAllTasksEmpty ||
    !isNotesEmpty ||
    !isHabitsEmpty ||
    !isGoalsEmpty ||
    studySessions.length > 0 ||
    focusLogs.length > 0;

  // Last 7 days of completed tasks vs pending tasks for the Recharts bar chart
  const last7DaysTaskChartData = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const items: {
      date: string;
      dayLabel: string;
      shortDate: string;
      completed: number;
      pending: number;
      total: number;
    }[] = [];

    for (let offset = -6; offset <= 0; offset++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + offset);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayNum = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${dayNum}`;

      const dayTasks = combinedTasks.filter((t) => t.date === dateStr);
      const completed = dayTasks.filter((t) => t.completed).length;
      const pending = dayTasks.filter((t) => !t.completed).length;

      items.push({
        date: dateStr,
        dayLabel:
          offset === 0
            ? currentLanguage === "hi"
              ? "आज"
              : "Today"
            : dayNames[d.getDay()],
        shortDate: `${monthNames[d.getMonth()]} ${dayNum}`,
        completed,
        pending,
        total: completed + pending,
      });
    }
    return items;
  }, [combinedTasks, currentLanguage]);

  const weeklyCompletedTasksTotal = useMemo(
    () => last7DaysTaskChartData.reduce((acc, d) => acc + d.completed, 0),
    [last7DaysTaskChartData]
  );
  const weeklyPendingTasksTotal = useMemo(
    () => last7DaysTaskChartData.reduce((acc, d) => acc + d.pending, 0),
    [last7DaysTaskChartData]
  );

  // Local captured focus logs & Quick Focus running state
  const [localCapturedFocusLogs, setLocalCapturedFocusLogs] = useState<FocusSessionLog[]>([]);
  const [isQuickPomodoroRunning, setIsQuickPomodoroRunning] = useState<boolean>(false);

  const combinedFocusLogs = useMemo(() => {
    const incoming = Array.isArray(focusLogs) ? focusLogs : [];
    const existingIds = new Set(incoming.map((l) => l.id));
    const uniqueLocal = localCapturedFocusLogs.filter((l) => !existingIds.has(l.id));
    return [...uniqueLocal, ...incoming];
  }, [focusLogs, localCapturedFocusLogs]);

  const handleDashboardLogFocusSession = (logPayload: Omit<FocusSessionLog, "id">) => {
    const createdLog: FocusSessionLog = {
      ...logPayload,
      id: `focus-${Date.now()}`,
    };
    setLocalCapturedFocusLogs((prev) => [createdLog, ...prev]);
    if (onLogFocusSession) {
      onLogFocusSession(logPayload);
    }
  };

  // =========================================================================
  // WEEKLY STUDY HOURS COMPARISON (Current Week vs Previous Week)
  // Calculates total study hours from studySessions + focusLogs
  // =========================================================================
  const weeklyStudyComparisonStats = useMemo(() => {
    const formatDateYMD = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    const currentWeekDates = new Set<string>();
    const previousWeekDates = new Set<string>();

    for (let offset = -6; offset <= 0; offset++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + offset);
      currentWeekDates.add(formatDateYMD(d));
    }

    for (let offset = -13; offset <= -7; offset++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + offset);
      previousWeekDates.add(formatDateYMD(d));
    }

    const safeStudySessions = Array.isArray(studySessions) ? studySessions : [];
    const safeFocusLogs = Array.isArray(combinedFocusLogs) ? combinedFocusLogs : [];

    let currentWeekSeconds = 0;
    let previousWeekSeconds = 0;
    const currentActiveDaysSet = new Set<string>();
    const previousActiveDaysSet = new Set<string>();

    safeStudySessions.forEach((s) => {
      if (!s || !s.date) return;
      const secs = Math.max(0, Number(s.durationSeconds) || 0);
      if (secs <= 0) return;
      if (currentWeekDates.has(s.date)) {
        currentWeekSeconds += secs;
        currentActiveDaysSet.add(s.date);
      } else if (previousWeekDates.has(s.date)) {
        previousWeekSeconds += secs;
        previousActiveDaysSet.add(s.date);
      }
    });

    safeFocusLogs.forEach((l) => {
      if (!l || !l.date || l.type !== "focus") return;
      const mins = Math.max(0, Number(l.durationMinutes) || 0);
      if (mins <= 0) return;
      const secs = mins * 60;
      if (currentWeekDates.has(l.date)) {
        currentWeekSeconds += secs;
        currentActiveDaysSet.add(l.date);
      } else if (previousWeekDates.has(l.date)) {
        previousWeekSeconds += secs;
        previousActiveDaysSet.add(l.date);
      }
    });

    const currentWeekMinutes = Math.round(currentWeekSeconds / 60);
    const previousWeekMinutes = Math.round(previousWeekSeconds / 60);

    const currentWeekHours = Number((currentWeekMinutes / 60).toFixed(1));
    const previousWeekHours = Number((previousWeekMinutes / 60).toFixed(1));

    const formatHrsMins = (totalMins: number) => {
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const diffMinutes = currentWeekMinutes - previousWeekMinutes;
    const diffHours = Number((diffMinutes / 60).toFixed(1));

    const percentChange =
      previousWeekMinutes > 0
        ? Math.round(((currentWeekMinutes - previousWeekMinutes) / previousWeekMinutes) * 100)
        : currentWeekMinutes > 0
        ? 100
        : 0;

    const maxMinutes = Math.max(currentWeekMinutes, previousWeekMinutes, 180);
    const currentBarPercent = Math.min(
      100,
      Math.round((currentWeekMinutes / maxMinutes) * 100)
    );
    const previousBarPercent = Math.min(
      100,
      Math.round((previousWeekMinutes / maxMinutes) * 100)
    );

    const consistencyStatus =
      diffMinutes > 15
        ? "Ahead of Last Week"
        : diffMinutes >= -15 && currentWeekMinutes > 0
        ? "Consistent Pace"
        : currentWeekMinutes === 0 && previousWeekMinutes === 0
        ? "Ready to Start Week"
        : "Building Momentum";

    return {
      currentWeekMinutes,
      previousWeekMinutes,
      currentWeekHours,
      previousWeekHours,
      currentFormatted: formatHrsMins(currentWeekMinutes),
      previousFormatted: formatHrsMins(previousWeekMinutes),
      currentActiveDays: currentActiveDaysSet.size,
      previousActiveDays: previousActiveDaysSet.size,
      diffMinutes,
      diffHours,
      percentChange,
      currentBarPercent,
      previousBarPercent,
      consistencyStatus,
    };
  }, [studySessions, combinedFocusLogs]);

  // =========================================================================
  // UPCOMING MILESTONES TIMELINE (Extracted from Calendar Exam Dates & Goals)
  // =========================================================================
  const [milestoneFilter, setMilestoneFilter] = useState<"all" | "exam" | "goal">("all");

  const upcomingMilestonesData = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formatMilestoneDate = (ymd: string) => {
      const parts = (ymd || todayStr).split("-").map((n) => parseInt(n, 10));
      const dt = new Date(parts[0] || 2026, (parts[1] || 1) - 1, parts[2] || 1);
      return `${monthNames[dt.getMonth()] || "Oct"} ${String(dt.getDate()).padStart(2, "0")}, ${dt.getFullYear()}`;
    };

    const calcDaysDiff = (ymd: string) => {
      const todayParts = todayStr.split("-").map((n) => parseInt(n, 10));
      const targetParts = (ymd || todayStr).split("-").map((n) => parseInt(n, 10));
      const t0 = new Date(todayParts[0], (todayParts[1] || 1) - 1, todayParts[2] || 1).getTime();
      const t1 = new Date(targetParts[0], (targetParts[1] || 1) - 1, targetParts[2] || 1).getTime();
      return Math.round((t1 - t0) / 86400000);
    };

    const shiftDate = (offsetDays: number) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + offsetDays);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    interface ExtractedMilestone {
      id: string;
      title: string;
      description: string;
      date: string;
      formattedDate: string;
      daysFromToday: number;
      kind: "exam" | "goal" | "deadline";
      sourceLabel: string;
      progress: number;
      completed: boolean;
      targetTab: ActiveTab;
    }

    const extracted: ExtractedMilestone[] = [];

    // 1. Extract key exam dates & deadlines from Calendar (events)
    const incomingEvents = Array.isArray(events) ? events : [];
    incomingEvents.forEach((evt) => {
      if (!evt || !evt.title) return;
      const isExam = evt.category === "exam";
      const isDeadline = evt.category === "deadline";
      const daysDiff = calcDaysDiff(evt.date || todayStr);
      const isDone = Boolean(evt.completed) || daysDiff < 0;

      extracted.push({
        id: `cal-milestone-${evt.id}`,
        title: evt.title,
        description:
          evt.description ||
          (isExam
            ? "Scheduled examination on academic calendar"
            : isDeadline
            ? "Key academic submission deadline"
            : "Scheduled academic calendar milestone"),
        date: evt.date || todayStr,
        formattedDate: formatMilestoneDate(evt.date || todayStr),
        daysFromToday: daysDiff,
        kind: isExam ? "exam" : isDeadline ? "deadline" : "exam",
        sourceLabel: isExam ? "Calendar Exam" : isDeadline ? "Calendar Deadline" : "Calendar Event",
        progress: isDone ? 100 : daysDiff === 0 ? 75 : daysDiff <= 7 ? 50 : 25,
        completed: isDone,
        targetTab: "calendar",
      });
    });

    // 2. Extract academic & study goals from Goals (combinedGoals)
    combinedGoals.forEach((g) => {
      if (!g || !g.title) return;
      const gDate = g.targetDate || shiftDate(14);
      const daysDiff = calcDaysDiff(gDate);
      const isDone = Boolean(g.completed) || g.progress >= 100;

      extracted.push({
        id: `goal-milestone-${g.id}`,
        title: g.title,
        description: g.description || "Target academic goal milestone",
        date: gDate,
        formattedDate: formatMilestoneDate(gDate),
        daysFromToday: daysDiff,
        kind: "goal",
        sourceLabel: "Academic Goal",
        progress: isDone ? 100 : Math.max(10, Math.min(99, g.progress || 20)),
        completed: isDone,
        targetTab: "goals",
      });
    });

    // 3. Extract subject exam dates & Board Final Exam date from examProfile
    if (examProfile?.subjectExamDates) {
      Object.entries(examProfile.subjectExamDates).forEach(([subId, examDate]) => {
        if (!examDate) return;
        const subObj = availableSubjects.find((s) => s.id === subId);
        const subName = subObj?.name || subId;
        const daysDiff = calcDaysDiff(examDate);
        extracted.push({
          id: `sub-exam-${subId}`,
          title: `${subName} Exam`,
          description: `${examProfile.board || "Board"} subject examination date`,
          date: examDate,
          formattedDate: formatMilestoneDate(examDate),
          daysFromToday: daysDiff,
          kind: "exam",
          sourceLabel: "Subject Exam",
          progress: daysDiff < 0 ? 100 : 40,
          completed: daysDiff < 0,
          targetTab: "exam",
        });
      });
    }

    const finalExamDate =
      examProfile?.targetExamDate || examProfile?.startDate || shiftDate(60);
    const finalExamName =
      examProfile?.targetExamName ||
      examProfile?.examName ||
      `${activeStudent?.classLevel || "Class 12"} ${activeStudent?.board || "Board"} Final Exams`;
    const finalDaysDiff = calcDaysDiff(finalExamDate);

    if (!extracted.some((m) => m.title.toLowerCase() === finalExamName.toLowerCase())) {
      extracted.push({
        id: "board-final-exam-milestone",
        title: finalExamName,
        description: `Culminating ${examProfile?.academicYear || "Academic Period"} examination target`,
        date: finalExamDate,
        formattedDate: formatMilestoneDate(finalExamDate),
        daysFromToday: finalDaysDiff,
        kind: "exam",
        sourceLabel: "Board Exam Target",
        progress: finalDaysDiff <= 0 ? 100 : Math.min(85, Math.max(15, 100 - finalDaysDiff)),
        completed: finalDaysDiff < 0,
        targetTab: "exam",
      });
    }

    // Ensure at least 3 checkpoints on the visual progress path if calendar/goals have fewer entries
    if (extracted.length < 3) {
      const firstSubName = availableSubjects[0]?.name || "Core Subjects";
      const midGoalDate = shiftDate(10);
      extracted.push({
        id: "academic-period-goal-checkpoint",
        title: `${firstSubName} Syllabus & PYQ Target`,
        description: "Complete high-weightage chapter revisions and 2 practice papers",
        date: midGoalDate,
        formattedDate: formatMilestoneDate(midGoalDate),
        daysFromToday: 10,
        kind: "goal",
        sourceLabel: "Academic Goal",
        progress: 45,
        completed: false,
        targetTab: "goals",
      });

      const mockDate = shiftDate(25);
      extracted.push({
        id: "academic-period-preboard-checkpoint",
        title: "Pre-Board Mock Assessment Window",
        description: "Full-syllabus timed mock test & weak chapter review",
        date: mockDate,
        formattedDate: formatMilestoneDate(mockDate),
        daysFromToday: 25,
        kind: "exam",
        sourceLabel: "Calendar Exam",
        progress: 25,
        completed: false,
        targetTab: "calendar",
      });
    }

    // Sort chronologically by date
    extracted.sort((a, b) => a.date.localeCompare(b.date));

    // Overall progress across the academic period path
    const avgProgress =
      extracted.length > 0
        ? Math.round(
            extracted.reduce((acc, item) => acc + item.progress, 0) / extracted.length
          )
        : 0;

    const filtered = extracted.filter((m) => {
      if (milestoneFilter === "exam") return m.kind === "exam" || m.kind === "deadline";
      if (milestoneFilter === "goal") return m.kind === "goal";
      return true;
    });

    const nextActiveId =
      filtered.find((m) => !m.completed && m.daysFromToday >= 0)?.id ||
      filtered[0]?.id;

    return {
      allMilestones: extracted,
      displayedMilestones: filtered.slice(0, 5),
      nextActiveId,
      academicPeriodProgressPercent: avgProgress,
      examCount: extracted.filter((m) => m.kind === "exam" || m.kind === "deadline").length,
      goalCount: extracted.filter((m) => m.kind === "goal").length,
      academicPeriodLabel:
        examProfile?.academicYear || `${new Date().getFullYear()}–${new Date().getFullYear() + 1} Academic Period`,
    };
  }, [events, combinedGoals, examProfile, availableSubjects, activeStudent, todayStr, milestoneFilter]);

  // Track user interaction with modules so guide cards are programmatically removed once populated
  const [interactedModules, setInteractedModules] = useState<{
    tasks: boolean;
    notes: boolean;
    habits: boolean;
    goals: boolean;
    dismissedAll: boolean;
  }>({
    tasks: false,
    notes: false,
    habits: false,
    goals: false,
    dismissedAll: false,
  });

  useEffect(() => {
    if (
      tasks.length === 0 &&
      notes.length === 0 &&
      habits.length === 0 &&
      goals.length === 0
    ) {
      setLocalCapturedTasks([]);
      setLocalCapturedNotes([]);
      setLocalCapturedHabits([]);
      setLocalCapturedGoals([]);
      setInteractedModules({
        tasks: false,
        notes: false,
        habits: false,
        goals: false,
        dismissedAll: false,
      });
    }
  }, [tasks.length, notes.length, habits.length, goals.length, activeStudent?.id]);

  const markModuleInteracted = (moduleKey: "tasks" | "notes" | "habits" | "goals") => {
    setInteractedModules((prev) => ({ ...prev, [moduleKey]: true }));
  };

  const showTaskGuideCard =
    (isTasksEmpty || isAllTasksEmpty) && !interactedModules.tasks;
  const showNoteGuideCard = isNotesEmpty && !interactedModules.notes;
  const showHabitGuideCard = isHabitsEmpty && !interactedModules.habits;
  const showGoalGuideCard = isGoalsEmpty && !interactedModules.goals;
  const hasEmptyStudentModules =
    !interactedModules.dismissedAll &&
    (showTaskGuideCard ||
      showNoteGuideCard ||
      showHabitGuideCard ||
      showGoalGuideCard);

  const handleDashboardAddTask = (taskPayload: Omit<Task, "id" | "createdAt">) => {
    const createdTask: Task = {
      ...taskPayload,
      id: "task-" + Date.now(),
      createdAt: Date.now(),
    };
    setLocalCapturedTasks((prev) => [createdTask, ...prev]);
    markModuleInteracted("tasks");
    if (onAddTask) {
      onAddTask(taskPayload);
    }
  };

  const handleTriggerFirstTask = () => {
    const inputEl = document.getElementById("home-quick-task-input") as HTMLInputElement | null;
    if (inputEl) {
      inputEl.focus();
      inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (onQuickAddTask) {
      onQuickAddTask();
    } else {
      onNavigate("tasks");
    }
  };

  const handleInitializeStarterTask = () => {
    const firstSub = availableSubjects[0];
    const starterTitle = firstSub
      ? `Complete ${firstSub.name} Chapter 1 Revision & Key Questions`
      : "Complete Chapter 1 Syllabus Revision & Practice Questions";
    handleDashboardAddTask({
      title: starterTitle,
      description: "Starter study task initialized from New Student Guide.",
      date: todayStr,
      priority: "high",
      category: "study",
      completed: false,
      subjectId: firstSub?.id,
      subjectName: firstSub?.name,
    });
  };

  const handleInitializeStarterNote = () => {
    const firstSub = availableSubjects[0];
    const starterNotePayload: Omit<Note, "id" | "createdAt" | "updatedAt"> = {
      title: firstSub ? `${firstSub.name} Core Formulas & Key Concepts` : "Quick Exam Revision Sheet",
      content: "1. Highlight high-weightage formulas and definitions.\n2. List 3 tricky concepts to revise before the next mock test.",
      pinned: true,
      archived: false,
      labels: ["Formula"],
      tags: ["Formula"],
    };
    const createdNote: Note = {
      ...starterNotePayload,
      id: "note-" + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setLocalCapturedNotes((prev) => [createdNote, ...prev]);
    markModuleInteracted("notes");
    if (onAddNote) {
      onAddNote(starterNotePayload);
    } else {
      const existing = loadNotes(activeStudent?.id);
      saveNotes([createdNote, ...existing], activeStudent?.id);
    }
  };

  const handleInitializeStarterHabit = () => {
    const firstSub = availableSubjects[0];
    const starterHabitPayload: Omit<Habit, "id" | "streak" | "completedDates" | "createdAt"> = {
      title: firstSub
        ? `Morning ${firstSub.name} Formula & Concept Revision (30m)`
        : "Morning Formula & Concept Revision (30m)",
      category: "study",
    };
    const createdHabit: Habit = {
      ...starterHabitPayload,
      id: "habit-" + Date.now(),
      streak: 1,
      completedDates: [todayStr],
      createdAt: Date.now(),
    };
    setLocalCapturedHabits((prev) => [createdHabit, ...prev]);
    markModuleInteracted("habits");
    if (onAddHabit) {
      onAddHabit(starterHabitPayload);
    } else {
      const existing = loadHabits(activeStudent?.id);
      saveHabits([createdHabit, ...existing], activeStudent?.id);
    }
  };

  const handleInitializeStarterGoal = () => {
    const firstSub = availableSubjects[0];
    const targetDateObj = new Date();
    targetDateObj.setDate(targetDateObj.getDate() + 14);
    const targetDateStr = targetDateObj.toISOString().split("T")[0];
    const starterGoalPayload: Omit<Goal, "id" | "createdAt"> = {
      title: firstSub
        ? `Master ${firstSub.name} Core Units & Solve 3 Mock Papers`
        : "Complete Core Syllabus Revision & Score 90%+ in Mock Tests",
      description: "Starter academic milestone initialized from New Student Guide.",
      targetDate: targetDateStr,
      category: "study",
      progress: 20,
      completed: false,
    };
    const createdGoal: Goal = {
      ...starterGoalPayload,
      id: "goal-" + Date.now(),
      createdAt: Date.now(),
    };
    setLocalCapturedGoals((prev) => [createdGoal, ...prev]);
    markModuleInteracted("goals");
    if (onAddGoal) {
      onAddGoal(starterGoalPayload);
    } else {
      const existing = loadGoals(activeStudent?.id);
      saveGoals([createdGoal, ...existing], activeStudent?.id);
    }
  };

  const handleSaveQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    const rawTitle = quickNoteTitle.trim();
    const rawContent = quickNoteContent.trim();
    if (!rawTitle && !rawContent) return;

    const resolvedTitle =
      rawTitle ||
      rawContent.split("\n")[0].slice(0, 48).trim() ||
      `Quick Idea (${todayStr})`;
    const resolvedContent = rawContent || rawTitle;

    const newNotePayload: Omit<Note, "id" | "createdAt" | "updatedAt"> = {
      title: resolvedTitle,
      content: resolvedContent,
      pinned: quickNotePinned,
      archived: false,
      labels: [quickNoteTag],
      tags: [quickNoteTag],
    };

    const createdNote: Note = {
      ...newNotePayload,
      id: "note-" + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setLocalCapturedNotes((prev) => [createdNote, ...prev]);

    if (onAddNote) {
      onAddNote(newNotePayload);
    } else {
      const existing = loadNotes(activeStudent?.id);
      saveNotes([createdNote, ...existing], activeStudent?.id);
    }

    setQuickNoteTitle("");
    setQuickNoteContent("");
    setQuickNotePinned(false);
    setIsQuickNoteModalOpen(false);
    setQuickNoteSavedFeedback(`Saved "${resolvedTitle}" to Notes`);
    setTimeout(() => setQuickNoteSavedFeedback(null), 3500);
  };

  const handleSaveQuickHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickHabitTitle.trim();
    if (!trimmed) return;

    const newHabitPayload: Omit<Habit, "id" | "streak" | "completedDates" | "createdAt"> = {
      title: trimmed,
      category: quickHabitCategory,
    };

    const createdHabit: Habit = {
      ...newHabitPayload,
      id: "habit-" + Date.now(),
      streak: 1,
      completedDates: [todayStr],
      createdAt: Date.now(),
    };

    setLocalCapturedHabits((prev) => [createdHabit, ...prev]);
    markModuleInteracted("habits");

    if (onAddHabit) {
      onAddHabit(newHabitPayload);
    } else {
      const existing = loadHabits(activeStudent?.id);
      saveHabits([createdHabit, ...existing], activeStudent?.id);
    }

    setQuickHabitTitle("");
    setIsQuickHabitModalOpen(false);
    setQuickNoteSavedFeedback(`Added habit "${trimmed}"`);
    setTimeout(() => setQuickNoteSavedFeedback(null), 3500);
  };

  return (
    <div
      id="home-dashboard-root"
      data-focus-mode={isFocusMode ? "true" : "false"}
      className="space-y-7 pb-4 md:pb-0 animate-in fade-in duration-200 max-w-6xl mx-auto w-full relative"
    >
      {/* ========================================================================= */}
      {/* URGENT ATTENTION BANNER (AT THE TOP OF THE HOMEDASHBOARD)                 */}
      {/* Highlights overdue tasks with a count and quick 'Mark Done' / 'Reschedule'*/}
      {/* ========================================================================= */}
      <UrgentAttentionBanner
        overdueTasks={overdueTasks}
        todayStr={todayStr}
        currentLanguage={currentLanguage}
        onMarkTaskDone={handleMarkOverdueTaskDone}
        onRescheduleTask={handleRescheduleOverdueTask}
        onMarkAllOverdueDone={handleMarkAllOverdueDone}
        onRescheduleAllOverdue={handleRescheduleAllOverdue}
        onAddSampleOverdueTask={handleAddSampleOverdueTask}
        onNavigate={onNavigate}
      />

      {/* ========================================================================= */}
      {/* FOCUS MODE ACTIVE BANNER (When Focus Mode is enabled in Settings)         */}
      {/* ========================================================================= */}
      {isFocusMode && (
        <section
          id="home-focus-mode-active-banner"
          data-testid="focus-mode-banner"
          aria-label="Focus Mode Active"
          className="glass-card rounded-3xl p-4 sm:p-5 border border-indigo-500/40 bg-gradient-to-r from-indigo-950/50 via-slate-900/95 to-emerald-950/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-heading text-white">
                  {currentLanguage === "hi"
                    ? "फोकस मोड सक्रिय (Distraction-Free Study Mode)"
                    : "Focus Mode Active — Distraction-Free Dashboard"}
                </h2>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  Essential Widgets Only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentLanguage === "hi"
                  ? "गैर-जरूरी विजेट (प्रेरणा कोट्स, त्वरित लिंक, विस्तारित एनालिटिक्स और वेलनेस) छिपा दिए गए हैं।"
                  : "Non-essential widgets (Motivation Quotes, Quick Actions, Career/Decision Cards, and Wellness) are hidden to keep you focused."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("focus")}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
            >
              {currentLanguage === "hi" ? "फोकस टाइमर" : "Open Focus Timer"}
            </button>
            <button
              type="button"
              id="home-exit-focus-mode-btn"
              onClick={() => {
                if (onUpdateSettings) {
                  onUpdateSettings({ ...settings, focusMode: false });
                } else {
                  onNavigate("settings");
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentLanguage === "hi" ? "फोकस मोड बंद करें" : "Exit Focus Mode"}</span>
            </button>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: HERO AREA (Hidden when Focus Mode is enabled)                  */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <HeroSection
          activeStudent={activeStudent}
          settings={settings}
          gamification={gamification}
          examReport={examReport}
          examProfile={examProfile}
          activeQuote={activeQuote}
          onNextQuote={handleNextQuote}
          formattedTime={formattedTime}
          formattedDate={formattedDate}
          displayGreeting={displayGreeting}
          currentLanguage={currentLanguage}
          onUpdateLanguage={onUpdateLanguage}
          todaysCompletedTasksCount={completedTodayCount}
          todaysTotalTasksCount={todaysTasks.length}
          todayStudyMinutes={todayStudyMinutes}
          todayHabitsCompletedCount={
            combinedHabits.filter((h) => h.completedDates?.includes(todayStr)).length
          }
          totalHabitsCount={combinedHabits.length}
          onNavigate={onNavigate}
          onOpenMoreMenu={onOpenMoreMenu}
          onOpenSearch={onOpenSearch}
        />
      )}

      {/* ========================================================================= */}
      {/* QUICK ADD & CLASSIC COMMAND BAR (Dropdowns, Sliders & One-Tap Actions)    */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <section
          id="home-quick-add-bar"
          data-testid="home-quick-add-bar"
          data-has-data={hasStudentDataPresent ? "true" : "false"}
          aria-label="Quick Add Tasks, Notes, and Habits"
          className="glass-card classic-frame rounded-2xl p-3.5 sm:p-4 border border-amber-500/25 bg-slate-900/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold font-classic text-white">
                  {currentLanguage === "hi"
                    ? "त्वरित कमांड व दृश्य नियंत्रण (Command Bar)"
                    : "Classic Command Bar — Quick Add & View Filters"}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {currentLanguage === "hi"
                    ? "डैशबोर्ड अनुभाग फ़िल्टर करें या तुरंत नया कार्य, नोट और आदत जोड़ें"
                    : "Filter dashboard sections via dropdown or log study items in one click"}
                </p>
              </div>
            </div>

            {/* Dashboard Section Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-amber-500/25">
              <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <label
                htmlFor="dashboard-view-filter-select"
                className="text-[11px] text-slate-400 font-semibold whitespace-nowrap"
              >
                View:
              </label>
              <select
                id="dashboard-view-filter-select"
                aria-label="Filter Dashboard Sections"
                value={dashboardSectionFilter}
                onChange={(e) =>
                  setDashboardSectionFilter(
                    e.target.value as "all" | "execution" | "academic" | "wellness"
                  )
                }
                className="bg-transparent text-xs font-bold text-amber-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">
                  All Dashboard Sections
                </option>
                <option value="execution" className="bg-slate-900 text-white">
                  Tasks & Focus Execution
                </option>
                <option value="academic" className="bg-slate-900 text-white">
                  Academic & Exam Intelligence
                </option>
                <option value="wellness" className="bg-slate-900 text-white">
                  Wellness & Habit Consistency
                </option>
              </select>
            </div>

            {/* Quick Action Launcher Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/10">
              <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <label
                htmlFor="dashboard-quick-action-select"
                className="text-[11px] text-slate-400 font-semibold whitespace-nowrap"
              >
                Quick Action:
              </label>
              <select
                id="dashboard-quick-action-select"
                aria-label="Quick Action Launcher"
                defaultValue=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  if (val === "add_task") handleTriggerFirstTask();
                  else if (val === "add_note") setIsQuickNoteModalOpen(true);
                  else if (val === "add_habit") setIsQuickHabitModalOpen(true);
                  else onNavigate(val as ActiveTab);
                  e.target.value = "";
                }}
                className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-400">
                  Select Action...
                </option>
                <option value="add_task" className="bg-slate-900 text-white">
                  + Create Study Task
                </option>
                <option value="add_note" className="bg-slate-900 text-white">
                  + Capture Quick Note
                </option>
                <option value="add_habit" className="bg-slate-900 text-white">
                  + Add Daily Habit
                </option>
                <option value="focus" className="bg-slate-900 text-white">
                  Launch Focus Timer Studio
                </option>
                <option value="exam" className="bg-slate-900 text-white">
                  Open Exam Intelligence Center
                </option>
                <option value="flashcards" className="bg-slate-900 text-white">
                  Practice Active Recall Flashcards
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
            <button
              type="button"
              id="home-quick-add-task-btn"
              data-testid="quick-add-task-btn"
              onClick={handleTriggerFirstTask}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 hover:text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {currentLanguage === "hi" ? "+ कार्य जोड़ें" : "Quick Add Task"}
              </span>
            </button>

            <button
              type="button"
              id="home-quick-add-note-btn"
              data-testid="quick-add-note-btn"
              onClick={() => setIsQuickNoteModalOpen(true)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 hover:text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                {currentLanguage === "hi" ? "+ नोट जोड़ें" : "Quick Add Note"}
              </span>
            </button>

            <button
              type="button"
              id="home-quick-add-habit-btn"
              data-testid="quick-add-habit-btn"
              onClick={() => setIsQuickHabitModalOpen(true)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 hover:text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {currentLanguage === "hi" ? "+ आदत जोड़ें" : "Quick Add Habit"}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ZERO-DATA NEW-STUDENT GUIDE CARDS (AT THE TOP OF THE DASHBOARD)           */}
      {/* Detects if the student has zero data across major modules and displays    */}
      {/* actionable steps to initialize their first study habit, task, or note.    */}
      {/* Programmatically removed once the user populates their data.              */}
      {/* ========================================================================= */}
      {!isFocusMode && hasEmptyStudentModules && (
        <section
          id="home-new-student-guide-section"
          data-testid="new-student-guide-section"
          aria-label="New Student Quick-Start Guide"
          className="glass-card rounded-3xl p-4 sm:p-5 border border-emerald-500/25 bg-slate-900/85 space-y-3.5 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold font-heading text-white">
                  {currentLanguage === "hi"
                    ? "नए विद्यार्थी के लिए त्वरित शुरुआत गाइड (Getting Started Guide)"
                    : "Getting Started Guide — Initialize Your Study Workspace"}
                </h2>
                <p className="text-xs text-slate-300">
                  {currentLanguage === "hi"
                    ? "अपना पहला अध्ययन कार्य, नोट, दैनिक आदत या लक्ष्य बनाकर डैशबोर्ड सक्रिय करें।"
                    : "Follow the actionable steps below to initialize your first study task, revision note, or study habit. Cards automatically disappear once populated."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-300 font-mono tabular-nums font-semibold">
                {[
                  !showTaskGuideCard,
                  !showNoteGuideCard,
                  !showHabitGuideCard,
                ].filter(Boolean).length}
                /3 initialized
              </span>
              <button
                type="button"
                id="dismiss-guide-cards-btn"
                aria-label="Dismiss Getting Started Guide"
                onClick={() =>
                  setInteractedModules({
                    tasks: true,
                    notes: true,
                    habits: true,
                    goals: true,
                    dismissedAll: true,
                  })
                }
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Guide Card 1: Initialize First Study Task (Removed automatically once tasks are populated) */}
            {showTaskGuideCard && (
              <div
                id="guide-card-first-task"
                data-testid="guide-card-first-task"
                className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/25 hover:border-emerald-500/45 transition-colors flex flex-col justify-between gap-3.5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-emerald-400 font-semibold">
                      Step 01 · Study Task
                    </span>
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    {currentLanguage === "hi"
                      ? "अपना पहला अध्ययन कार्य जोड़ें"
                      : "Initialize Your First Study Task"}
                  </h3>
                  <ul className="text-[11px] text-slate-300 space-y-1 leading-relaxed list-disc list-inside">
                    <li>
                      {currentLanguage === "hi"
                        ? "आज के अध्याय या विषय का चयन करें"
                        : "Pick today's priority chapter or topic to study"}
                    </li>
                    <li>
                      {currentLanguage === "hi"
                        ? "नीचे बटन दबाकर अपना पहला कार्य प्रारंभ करें"
                        : "Click below to initialize a starter task or open Tasks"}
                    </li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="guide-card-first-task-btn"
                    onClick={handleInitializeStarterTask}
                    className="min-h-[40px] flex-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      {currentLanguage === "hi"
                        ? "पहला कार्य बनाएँ"
                        : "Initialize First Task"}
                    </span>
                  </button>
                  <button
                    type="button"
                    id="guide-card-open-tasks-btn"
                    onClick={() => onNavigate("tasks")}
                    title="Open Task Manager"
                    className="min-h-[40px] px-2.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Tasks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Guide Card 2: Capture First Study Note (Removed automatically once notes are populated) */}
            {showNoteGuideCard && (
              <div
                id="guide-card-first-note"
                data-testid="guide-card-first-note"
                className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/25 hover:border-cyan-500/45 transition-colors flex flex-col justify-between gap-3.5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-cyan-400 font-semibold">
                      Step 02 · Study Note
                    </span>
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    {currentLanguage === "hi"
                      ? "अपना पहला अध्ययन नोट लिखें"
                      : "Capture Your First Study Note"}
                  </h3>
                  <ul className="text-[11px] text-slate-300 space-y-1 leading-relaxed list-disc list-inside">
                    <li>
                      {currentLanguage === "hi"
                        ? "महत्वपूर्ण सूत्र या अध्याय सारांश सहेजें"
                        : "Jot down key formulas, definitions, or chapter points"}
                    </li>
                    <li>
                      {currentLanguage === "hi"
                        ? "रिवीजन के लिए पिन करें या नीचे से प्रारंभ करें"
                        : "Pin for instant exam recall or initialize a starter sheet"}
                    </li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="guide-card-first-note-btn"
                    onClick={handleInitializeStarterNote}
                    className="min-h-[40px] flex-1 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      {currentLanguage === "hi"
                        ? "पहला नोट बनाएँ"
                        : "Initialize First Note"}
                    </span>
                  </button>
                  <button
                    type="button"
                    id="guide-card-quick-note-modal-btn"
                    onClick={() => setIsQuickNoteModalOpen(true)}
                    title="Open Quick Note Editor"
                    className="min-h-[40px] px-2.5 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Write</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Guide Card 3: Initialize First Study Habit / Goal (Removed automatically once populated) */}
            {(showHabitGuideCard || showGoalGuideCard) && (
              <div
                id="guide-card-first-habit"
                data-testid="guide-card-first-habit"
                className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/25 hover:border-amber-500/45 transition-colors flex flex-col justify-between gap-3.5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-amber-400 font-semibold">
                      Step 03 · Study Habit & Goal
                    </span>
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    {currentLanguage === "hi"
                      ? "अपनी पहली अध्ययन आदत व लक्ष्य शुरू करें"
                      : "Start Your First Study Habit & Goal"}
                  </h3>
                  <ul className="text-[11px] text-slate-300 space-y-1 leading-relaxed list-disc list-inside">
                    <li>
                      {currentLanguage === "hi"
                        ? "दैनिक 30 मिनट सूत्र रिवीजन आदत ट्रैक करें"
                        : "Build a daily 30-min formula revision study habit"}
                    </li>
                    <li>
                      {currentLanguage === "hi"
                        ? "साप्ताहिक सिलेबस लक्ष्य के साथ अपनी स्ट्रीक बढ़ाएँ"
                        : "Track your daily study streak and syllabus milestones"}
                    </li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="guide-card-first-habit-btn"
                    onClick={() => {
                      if (showHabitGuideCard) {
                        handleInitializeStarterHabit();
                      }
                      if (showGoalGuideCard) {
                        handleInitializeStarterGoal();
                      }
                    }}
                    className="min-h-[40px] flex-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Flame className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      {currentLanguage === "hi"
                        ? "पहली आदत शुरू करें"
                        : "Initialize Habit & Goal"}
                    </span>
                  </button>
                  <button
                    type="button"
                    id="guide-card-open-habits-btn"
                    onClick={() => onNavigate("habits")}
                    title="Open Habits Tracker"
                    className="min-h-[40px] px-2.5 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-amber-300 text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Habits</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CORE FOCUS & STREAK BENTO ROW:                                            */}
      {/* 1. StudyStreak (Consecutive Study Days & Weekly Hours)                    */}
      {/* 2. QuickFocusWidget (1-Click 25-Minute Pomodoro Session Launch)           */}
      {/* ========================================================================= */}
      <section
        id="home-dashboard-overview-section"
        aria-label="Focus and Study Streak Grid"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        <StudyStreak
          studySessions={studySessions}
          focusLogs={combinedFocusLogs}
          studentName={activeStudent?.name || settings.userName}
          currentLanguage={currentLanguage}
          todayTotalStudyMinutes={todayStudyMinutes}
          dailyTargetMinutes={(examProfile?.dailyStudyHours || 3) * 60}
          onNavigate={onNavigate}
          className="lg:col-span-6 h-full"
        />

        <div className="lg:col-span-6 h-full">
          <QuickFocusWidget
            focusLogs={combinedFocusLogs}
            profileId={activeStudent?.id}
            currentLanguage={currentLanguage}
            onLogFocusSession={handleDashboardLogFocusSession}
            onNavigate={onNavigate}
            onRunningStateChange={setIsQuickPomodoroRunning}
            className="h-full"
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DAILY WELLNESS REMINDER NOTIFICATION COMPONENT                            */}
      {/* Suggests drinking water or taking a short stretch break based on activity */}
      {/* level and time of day                                                     */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <DailyWellnessReminder
          water={water}
          todayStudyMinutes={todayStudyMinutes}
          todayFocusMinutes={todayFocusMinutes}
          todayCompletedTasksCount={completedTodayCount}
          isPomodoroRunning={isQuickPomodoroRunning}
          currentDateTime={currentDateTime}
          currentLanguage={currentLanguage}
          onAddWaterGlass={onAddWaterGlass}
          onNavigate={onNavigate}
        />
      )}

      {/* ========================================================================= */}
      {/* DIRECT QUICK TASK INPUT FIELD ON HOMEDASHBOARD                            */}
      {/* Allows adding tasks directly without navigating to full TaskManager       */}
      {/* ========================================================================= */}
      <section
        id="home-quick-task-widget"
        aria-label="Quick Task Creation"
        className="glass-card rounded-3xl p-4 sm:p-5 border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-emerald-950/20 shadow-lg space-y-3"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-heading text-white">
                {currentLanguage === "hi"
                  ? "त्वरित कार्य जोड़ें (Quick Task)"
                  : "Quick Task — Add to Today's Schedule"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {quickTaskAddedFeedback && (
              <span
                id="home-quick-task-feedback"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Task added to Today ✓</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>
                {currentLanguage === "hi" ? "सभी कार्य देखें" : "Full Task Manager"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <form
          id="home-quick-task-form"
          onSubmit={handleDirectQuickAddTask}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="relative flex-1">
            <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
            <input
              id="home-quick-task-input"
              type="text"
              aria-label="Quick Task Input"
              placeholder={
                currentLanguage === "hi"
                  ? "यहाँ आज का नया कार्य लिखें (जैसे: अध्याय 4 का रिवीजन करें)..."
                  : "Quick Task: Type a task to add directly to today's list..."
              }
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/90 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Assign Subject Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-2 rounded-2xl border border-indigo-500/30">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <label
                htmlFor="home-quick-task-subject-select"
                className="text-[11px] font-semibold text-slate-400 whitespace-nowrap"
              >
                {currentLanguage === "hi" ? "विषय:" : "Quick Assign:"}
              </label>
              <select
                id="home-quick-task-subject-select"
                aria-label="Quick Assign Subject"
                value={quickTaskSubjectId}
                onChange={(e) => setQuickTaskSubjectId(e.target.value)}
                className="bg-transparent text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-300">
                  {currentLanguage === "hi" ? "सामान्य (कोई विषय नहीं)" : "General (Any Subject)"}
                </option>
                {availableSubjects.map((sub) => (
                  <option
                    key={sub.id}
                    value={sub.id}
                    className="bg-slate-900 text-white"
                  >
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-2 rounded-2xl border border-white/10">
              <Flag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <label
                htmlFor="home-quick-task-priority"
                className="text-[11px] font-semibold text-slate-400 whitespace-nowrap"
              >
                Priority:
              </label>
              <select
                id="home-quick-task-priority"
                aria-label="Quick Task Priority"
                value={quickTaskPriority}
                onChange={(e) => setQuickTaskPriority(e.target.value as Priority)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="high" className="bg-slate-900 text-rose-300">
                  High
                </option>
                <option value="medium" className="bg-slate-900 text-amber-300">
                  Medium
                </option>
                <option value="low" className="bg-slate-900 text-emerald-300">
                  Low
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-2 rounded-2xl border border-white/10">
              <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                id="home-quick-task-category"
                aria-label="Quick Task Category"
                value={quickTaskCategory}
                onChange={(e) => setQuickTaskCategory(e.target.value as TaskCategory)}
                className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer capitalize"
              >
                <option value="study" className="bg-slate-900 text-white">
                  Study
                </option>
                <option value="exam" className="bg-slate-900 text-white">
                  Exam
                </option>
                <option value="urgent" className="bg-slate-900 text-white">
                  Urgent
                </option>
                <option value="personal" className="bg-slate-900 text-white">
                  Personal
                </option>
                <option value="work" className="bg-slate-900 text-white">
                  Work
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-2 rounded-2xl border border-white/10">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                Est. {quickTaskDurationMins}m
              </span>
              <input
                id="home-quick-task-duration-slider"
                type="range"
                min={10}
                max={180}
                step={5}
                value={quickTaskDurationMins}
                onChange={(e) => setQuickTaskDurationMins(Number(e.target.value))}
                aria-label="Estimated Task Duration Slider"
                className="w-20 accent-emerald-400 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              id="home-quick-task-submit-btn"
              disabled={!quickTaskTitle.trim()}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-sm"
            >
              {currentLanguage === "hi" ? "+ कार्य जोड़ें" : "+ Add Task"}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: DAILY EXECUTION (Tasks, Pending, Focus Sessions, Study Time)   */}
      {/* ========================================================================= */}
      <DailyExecutionSection
        tasks={combinedTasks}
        subjects={availableSubjects}
        studySessions={studySessions}
        focusLogs={focusLogs}
        currentLanguage={currentLanguage}
        onNavigate={onNavigate}
        onQuickAddTask={onQuickAddTask}
        onAddTask={handleDashboardAddTask}
        onToggleTask={onToggleTask}
        tasksEmptyState={
          isTasksEmpty ? (
            <ModuleEmptyState
              id="home-tasks-empty-state"
              testId="tasks-empty-state"
              actionButtonId="tasks-empty-get-started-btn"
              title={
                currentLanguage === "hi"
                  ? "आज के लिए कोई अध्ययन कार्य निर्धारित नहीं है"
                  : "Your Today's Task Schedule is Empty"
              }
              description={
                currentLanguage === "hi"
                  ? "अध्याय रिवीजन, होमवर्क या मॉक टेस्ट अभ्यास जोड़कर अपने अध्ययन दिवस की शुरुआत करें।"
                  : "Plan your first chapter revision, assignment, or practice session to kickstart your study day."
              }
              icon={ClipboardList}
              illustration={ClipboardList}
              accentColor="emerald"
              actionLabel={
                currentLanguage === "hi"
                  ? "शुरू करें — टास्क मैनेजर खोलें"
                  : "Get Started"
              }
              onAction={() => onNavigate("tasks")}
              secondaryActionLabel={
                currentLanguage === "hi" ? "+ त्वरित कार्य जोड़ें" : "+ Quick Add Task"
              }
              onSecondaryAction={handleTriggerFirstTask}
            />
          ) : undefined
        }
      />

      {/* ========================================================================= */}
      {/* SECTION 2B: STUDY NOTES & ACADEMIC GOALS (With Contextual Empty States)   */}
      {/* ========================================================================= */}
      {!isFocusMode && (
        <section
          id="home-notes-and-goals-section"
          aria-label="Study Notes and Academic Goals"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        >
          {/* 1. STUDY NOTES & REVISION IDEAS MODULE CARD (6 cols) */}
          <div
            id="home-notes-module-card"
            data-testid="home-notes-module-card"
            className="lg:col-span-6 glass-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold font-heading text-white">
                  {currentLanguage === "hi" ? "अध्ययन नोट्स व सूत्र" : "Study Notes & Formulas"}
                </h2>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  · {combinedNotes.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("notes")}
                className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{currentLanguage === "hi" ? "नोट्स खोलें" : "All Notes"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!isNotesEmpty ? (
              <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {combinedNotes.slice(0, 3).map((noteItem) => (
                    <div
                      key={noteItem.id}
                      onClick={() => onNavigate("notes")}
                      className="p-3 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {noteItem.pinned && (
                            <Pin className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                          <h3 className="text-xs font-bold text-white truncate">
                            {noteItem.title}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {noteItem.content}
                        </p>
                      </div>
                      {noteItem.tags && noteItem.tags[0] && (
                        <span className="text-[11px] font-mono text-cyan-300 shrink-0">
                          {noteItem.tags[0]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {combinedNotes.filter((n) => n.pinned).length} pinned · {combinedNotes.length} total
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsQuickNoteModalOpen(true)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{currentLanguage === "hi" ? "+ नया नोट" : "+ Quick Note"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <ModuleEmptyState
                id="home-notes-empty-state"
                testId="notes-empty-state"
                actionButtonId="notes-empty-get-started-btn"
                title={
                  currentLanguage === "hi"
                    ? "अभी तक कोई अध्ययन नोट नहीं बनाया गया"
                    : "No Study Notes Captured Yet"
                }
                description={
                  currentLanguage === "hi"
                    ? "महत्वपूर्ण सूत्र, अध्याय सारांश या रिवीजन पॉइंट्स यहाँ सहेजें ताकि परीक्षा से पहले तुरंत दोहराया जा सके।"
                    : "Save key formulas, chapter summaries, or exam revision points so they are always ready at a glance."
                }
                icon={FileText}
                illustration={FileText}
                accentColor="cyan"
                actionLabel={
                  currentLanguage === "hi"
                    ? "शुरू करें — नोट्स खोलें"
                    : "Get Started"
                }
                onAction={() => onNavigate("notes")}
                secondaryActionLabel={
                  currentLanguage === "hi" ? "+ त्वरित नोट लिखें" : "+ Quick Note"
                }
                onSecondaryAction={() => setIsQuickNoteModalOpen(true)}
              />
            )}
          </div>

          {/* 2. ACADEMIC & MILESTONE GOALS MODULE CARD (6 cols) */}
          <div
            id="home-goals-module-card"
            data-testid="home-goals-module-card"
            className="lg:col-span-6 glass-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold font-heading text-white">
                  {currentLanguage === "hi" ? "शैक्षणिक लक्ष्य (Goals)" : "Academic & Study Goals"}
                </h2>
                <span className="text-xs font-mono text-purple-300 font-bold">
                  · {combinedGoals.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("goals")}
                className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{currentLanguage === "hi" ? "लक्ष्य ट्रैकर" : "Goal Tracker"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!isGoalsEmpty ? (
              <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {combinedGoals.slice(0, 3).map((goalItem) => (
                    <div
                      key={goalItem.id}
                      onClick={() => onNavigate("goals")}
                      className="p-3 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {goalItem.title}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-purple-300 shrink-0 tabular-nums">
                          {goalItem.progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, goalItem.progress))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {combinedGoals.filter((g) => g.completed).length} of {combinedGoals.length} goals achieved
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate("goals")}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{currentLanguage === "hi" ? "+ नया लक्ष्य" : "+ New Goal"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <ModuleEmptyState
                id="home-goals-empty-state"
                testId="goals-empty-state"
                actionButtonId="goals-empty-get-started-btn"
                title={
                  currentLanguage === "hi"
                    ? "कोई शैक्षणिक लक्ष्य निर्धारित नहीं है"
                    : "No Academic Goals Set Yet"
                }
                description={
                  currentLanguage === "hi"
                    ? "साप्ताहिक सिलेबस लक्ष्य या बोर्ड परीक्षा स्कोर टारगेट सेट करें और अपनी प्रगति ट्रैक करें।"
                    : "Set weekly syllabus milestones or target board exam scores to track your long-term progress."
                }
                icon={Target}
                illustration={Target}
                accentColor="purple"
                actionLabel={
                  currentLanguage === "hi"
                    ? "शुरू करें — पहला लक्ष्य सेट करें"
                    : "Get Started"
                }
                onAction={() => onNavigate("goals")}
                secondaryActionLabel={
                  currentLanguage === "hi" ? "+ प्रारंभिक लक्ष्य" : "+ Quick Init Goal"
                }
                onSecondaryAction={handleInitializeStarterGoal}
              />
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* WEEKLY STUDY HOURS COMPARISON SUMMARY CARD (Current vs Previous Week)     */}
      {/* Helps students gauge their study consistency week over week               */}
      {/* ========================================================================= */}
      {!isFocusMode && (
      <section
        id="home-weekly-study-comparison-card"
        data-testid="weekly-study-comparison-card"
        aria-label="Weekly Study Hours Comparison Summary Card"
        className="glass-card rounded-3xl p-5 sm:p-6 border border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-indigo-950/25 space-y-4 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/35 text-indigo-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium flex-wrap">
                <span>
                  {currentLanguage === "hi"
                    ? "साप्ताहिक अध्ययन निरंतरता"
                    : "Weekly Study Consistency"}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-emerald-300 font-semibold">
                  {weeklyStudyComparisonStats.consistencyStatus}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white tracking-tight">
                {currentLanguage === "hi"
                  ? "इस सप्ताह बनाम पिछले सप्ताह कुल अध्ययन घंटे"
                  : "Study Hours Comparison — Current Week vs Previous Week"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("study")}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center"
          >
            <span>
              {currentLanguage === "hi" ? "अध्ययन ट्रैकर" : "Study Tracker"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Comparison Grid: Current Week, Previous Week, and Consistency Delta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Box 1: Current Week Study Hours */}
          <div
            id="weekly-comparison-current-week"
            data-testid="weekly-comparison-current-week"
            className="p-4 rounded-2xl bg-slate-950/85 border border-emerald-500/30 space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-emerald-300">
                {currentLanguage === "hi"
                  ? "वर्तमान सप्ताह (This Week)"
                  : "Current Week (Last 7 Days)"}
              </span>
              <span className="font-mono tabular-nums text-slate-300">
                {weeklyStudyComparisonStats.currentActiveDays}/7 days active
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span
                  id="current-week-study-hours-value"
                  className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white"
                >
                  {weeklyStudyComparisonStats.currentWeekHours}
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-300">
                  hrs
                </span>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                ({weeklyStudyComparisonStats.currentFormatted})
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                style={{
                  width: `${Math.max(
                    weeklyStudyComparisonStats.currentWeekMinutes > 0 ? 10 : 4,
                    weeklyStudyComparisonStats.currentBarPercent
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Box 2: Previous Week Study Hours */}
          <div
            id="weekly-comparison-previous-week"
            data-testid="weekly-comparison-previous-week"
            className="p-4 rounded-2xl bg-slate-950/85 border border-white/10 space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-indigo-300">
                {currentLanguage === "hi"
                  ? "पिछला सप्ताह (Previous Week)"
                  : "Previous Week (Prior 7 Days)"}
              </span>
              <span className="font-mono tabular-nums text-slate-400">
                {weeklyStudyComparisonStats.previousActiveDays}/7 days active
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span
                  id="previous-week-study-hours-value"
                  className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-200"
                >
                  {weeklyStudyComparisonStats.previousWeekHours}
                </span>
                <span className="text-xs sm:text-sm font-bold text-indigo-300">
                  hrs
                </span>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                ({weeklyStudyComparisonStats.previousFormatted})
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-500"
                style={{
                  width: `${Math.max(
                    weeklyStudyComparisonStats.previousWeekMinutes > 0 ? 10 : 4,
                    weeklyStudyComparisonStats.previousBarPercent
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Box 3: Week-over-Week Difference & Consistency Gauge */}
          <div
            id="weekly-comparison-delta"
            data-testid="weekly-comparison-delta"
            className="p-4 rounded-2xl bg-slate-950/85 border border-cyan-500/25 flex flex-col justify-between gap-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300 inline-flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {currentLanguage === "hi"
                    ? "साप्ताहिक अंतर (Consistency Delta)"
                    : "Week-over-Week Trend"}
                </span>
              </span>
              <span
                className={`font-mono tabular-nums font-bold ${
                  weeklyStudyComparisonStats.diffHours >= 0
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {weeklyStudyComparisonStats.diffHours >= 0 ? "+" : ""}
                {weeklyStudyComparisonStats.percentChange}%
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span
                id="weekly-study-hours-diff-value"
                className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                  weeklyStudyComparisonStats.diffHours >= 0
                    ? "text-emerald-300"
                    : "text-amber-300"
                }`}
              >
                {weeklyStudyComparisonStats.diffHours >= 0 ? "+" : ""}
                {weeklyStudyComparisonStats.diffHours} hrs
              </span>
              <span className="text-xs text-slate-400">vs last week</span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {weeklyStudyComparisonStats.diffMinutes > 0
                ? `You've logged ${weeklyStudyComparisonStats.diffHours} more study hours this week compared to last week. Keep up the momentum!`
                : weeklyStudyComparisonStats.diffMinutes === 0 &&
                  weeklyStudyComparisonStats.currentWeekMinutes > 0
                ? "You're matching last week's study hours right on pace."
                : "Launch a 25m Quick Focus session or log study hours to surpass last week's consistency."}
            </p>
          </div>
        </div>
      </section>
      )}

      {/* ========================================================================= */}
      {/* COMPACT 7-DAY COMPLETED VS PENDING TASKS BAR CHART (Recharts)             */}
      {/* ========================================================================= */}
      {!isFocusMode && (
      <section
        id="home-tasks-7day-chart-card"
        data-testid="tasks-7day-bar-chart"
        aria-label="Last 7 Days Completed vs Pending Tasks Chart"
        className="glass-card rounded-3xl p-4 sm:p-5 border border-white/10 bg-slate-900/80 space-y-3 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-heading text-white">
                {currentLanguage === "hi"
                  ? "पिछले 7 दिनों के पूर्ण बनाम लंबित कार्य"
                  : "7-Day Task Velocity — Completed vs Pending"}
              </h2>
              <p className="text-xs text-slate-400">
                {currentLanguage === "hi"
                  ? "पिछले 7 दिनों में आपके दैनिक कार्य निष्पादन का तुलनात्मक अवलोकन"
                  : "Daily breakdown of completed tasks versus pending tasks over the last 7 days"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>Completed: {weeklyCompletedTasksTotal}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
              <span>Pending: {weeklyPendingTasksTotal}</span>
            </span>
          </div>
        </div>

        <div className="h-[155px] w-full min-w-0 pt-1">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart
              data={last7DaysTaskChartData}
              margin={{ top: 6, right: 8, left: -24, bottom: 0 }}
              barGap={4}
            >
              <XAxis
                dataKey="dayLabel"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
                labelFormatter={(label, payload) => {
                  const row = payload?.[0]?.payload;
                  return row ? `${label} (${row.shortDate})` : String(label);
                }}
              />
              <Bar
                dataKey="completed"
                name="Completed Tasks"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="pending"
                name="Pending Tasks"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      )}

      {/* ========================================================================= */}
      {/* UPCOMING MILESTONES TIMELINE VIEW (Academic Period Visual Progress Path)  */}
      {/* Extracts key exam dates and goals from Calendar & Goals                   */}
      {/* ========================================================================= */}
      {!isFocusMode && (
      <section
        id="home-upcoming-milestones-timeline"
        data-testid="upcoming-milestones-timeline"
        aria-label="Upcoming Milestones Timeline View"
        className="glass-card rounded-3xl p-5 sm:p-6 border border-cyan-500/25 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-cyan-950/20 space-y-5 shadow-lg"
      >
        {/* Header & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-400 flex items-center justify-center shrink-0">
              <Milestone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium flex-wrap">
                <span>{upcomingMilestonesData.academicPeriodLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300 font-mono tabular-nums">
                  {upcomingMilestonesData.examCount} Exam Dates · {upcomingMilestonesData.goalCount} Goals
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white tracking-tight">
                {currentLanguage === "hi"
                  ? "आगामी मील के पत्थर (Upcoming Milestones Timeline)"
                  : "Upcoming Milestones — Academic Period Progress Path"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Milestone Type Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/85 border border-white/10 text-xs">
              <span className="text-[11px] text-slate-400 font-semibold">Filter:</span>
              <select
                id="milestone-filter-dropdown"
                aria-label="Filter Milestones"
                value={milestoneFilter}
                onChange={(e) => setMilestoneFilter(e.target.value as "all" | "exam" | "goal")}
                className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">
                  All Milestones ({upcomingMilestonesData.allMilestones.length})
                </option>
                <option value="exam" className="bg-slate-900 text-white">
                  Exams Only ({upcomingMilestonesData.examCount})
                </option>
                <option value="goal" className="bg-slate-900 text-white">
                  Goals Only ({upcomingMilestonesData.goalCount})
                </option>
              </select>
            </div>

            {/* Interactive Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setMilestoneFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  milestoneFilter === "all"
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All ({upcomingMilestonesData.allMilestones.length})
              </button>
              <button
                type="button"
                onClick={() => setMilestoneFilter("exam")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  milestoneFilter === "exam"
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Exams ({upcomingMilestonesData.examCount})
              </button>
              <button
                type="button"
                onClick={() => setMilestoneFilter("goal")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  milestoneFilter === "goal"
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Goals ({upcomingMilestonesData.goalCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("calendar")}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentLanguage === "hi" ? "कैलेंडर" : "Calendar"}</span>
            </button>
          </div>
        </div>

        {/* Overall Academic Period Progress Track */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">
              {currentLanguage === "hi"
                ? "वर्तमान शैक्षणिक अवधि प्रगति पथ"
                : "Current Academic Period Path Completion"}
            </span>
            <span className="font-mono tabular-nums font-bold text-emerald-300">
              {upcomingMilestonesData.academicPeriodProgressPercent}% Overall Progress
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Academic Period Progress Path"
            aria-valuenow={upcomingMilestonesData.academicPeriodProgressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-2.5 rounded-full bg-slate-950 border border-white/10 overflow-hidden p-0.5"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 transition-all duration-500"
              style={{
                width: `${Math.max(8, upcomingMilestonesData.academicPeriodProgressPercent)}%`,
              }}
            />
          </div>
        </div>

        {/* Visual Timeline Progress Path Nodes */}
        <div className="relative pt-2">
          {/* Desktop Horizontal Connecting Line */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 to-purple-500/40 pointer-events-none"
          />

          <div
            className={`grid grid-cols-1 gap-3.5 ${
              upcomingMilestonesData.displayedMilestones.length >= 4
                ? "lg:grid-cols-4"
                : "lg:grid-cols-3"
            }`}
          >
            {upcomingMilestonesData.displayedMilestones.map((milestone, idx) => {
              const isNextActive = milestone.id === upcomingMilestonesData.nextActiveId;
              const isExamType = milestone.kind === "exam" || milestone.kind === "deadline";

              const countdownLabel = milestone.completed
                ? "Completed"
                : milestone.daysFromToday === 0
                ? "Today"
                : milestone.daysFromToday > 0
                ? `In ${milestone.daysFromToday}d`
                : `${Math.abs(milestone.daysFromToday)}d ago`;

              return (
                <div
                  key={milestone.id}
                  data-testid={`milestone-node-${idx}`}
                  onClick={() => onNavigate(milestone.targetTab)}
                  className={`relative z-10 p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isNextActive
                      ? "bg-slate-950/95 border-cyan-400/50 shadow-md shadow-cyan-500/10"
                      : milestone.completed
                      ? "bg-slate-950/60 border-emerald-500/30"
                      : "bg-slate-950/75 border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Node Header: Step Circle + Source & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold border shrink-0 ${
                            milestone.completed
                              ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
                              : isNextActive
                              ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                              : isExamType
                              ? "bg-amber-500/15 border-amber-500/35 text-amber-300"
                              : "bg-purple-500/15 border-purple-500/35 text-purple-300"
                          }`}
                        >
                          {milestone.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : isExamType ? (
                            <Calendar className="w-3.5 h-3.5" />
                          ) : (
                            <Target className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-semibold ${
                            isExamType ? "text-amber-300" : "text-purple-300"
                          }`}
                        >
                          {milestone.sourceLabel}
                        </span>
                      </div>

                      <span
                        className={`text-[11px] font-mono tabular-nums font-bold ${
                          milestone.completed
                            ? "text-emerald-400"
                            : isNextActive
                            ? "text-cyan-300"
                            : "text-slate-400"
                        }`}
                      >
                        {countdownLabel}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                        {milestone.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Date + Milestone Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
                      <span>{milestone.formattedDate}</span>
                      <span className="text-slate-200 font-semibold">
                        {milestone.progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          milestone.completed
                            ? "bg-emerald-400"
                            : isExamType
                            ? "bg-gradient-to-r from-amber-400 to-cyan-400"
                            : "bg-gradient-to-r from-purple-400 to-emerald-400"
                        }`}
                        style={{
                          width: `${Math.max(8, Math.min(100, milestone.progress))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* ========================================================================= */}
      {/* ACADEMIC DECISION ENGINE & WELLNESS SECTIONS                              */}
      {/* ========================================================================= */}
      {!isFocusMode &&
        (dashboardSectionFilter === "all" || dashboardSectionFilter === "academic") && (
          <AcademicDecisionEngineSection
            subjects={subjects}
            studySessions={studySessions}
            activeStudent={activeStudent}
            careerProfile={careerProfile}
            examProfile={examProfile}
            academicSubjects={academicSubjects}
            academicChapters={academicChapters}
            vviTopics={vviTopics}
            revisions={academicRevisions}
            practiceSessions={academicPractice}
            examRecords={examTestRecords}
            streakDays={gamification.currentStreak || 1}
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
          />
        )}

      {!isFocusMode &&
        (dashboardSectionFilter === "all" || dashboardSectionFilter === "wellness") && (
          <WellnessSection
            habits={combinedHabits}
            water={water}
            currentLanguage={currentLanguage}
            onToggleHabit={onToggleHabit}
            onAddWaterGlass={onAddWaterGlass}
            onRemoveWaterGlass={onRemoveWaterGlass}
            onNavigate={onNavigate}
          />
        )}

      {/* ========================================================================= */}
      {/* FLOATING QUICK-ADD NOTE SAVED FEEDBACK TOAST                              */}
      {/* ========================================================================= */}
      {quickNoteSavedFeedback && (
        <div
          id="home-quick-note-saved-toast"
          data-testid="quick-note-saved-toast"
          role="status"
          className="fixed bottom-36 md:bottom-24 right-4 sm:right-8 z-40 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{quickNoteSavedFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MINIMALIST QUICK-NOTE CAPTURE MODAL                                       */}
      {/* ========================================================================= */}
      {isQuickNoteModalOpen && (
        <div
          id="home-quick-note-modal"
          data-testid="quick-note-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-note-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setIsQuickNoteModalOpen(false)}
        >
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/15 bg-slate-950/95 p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    id="quick-note-modal-title"
                    className="text-base font-bold font-heading text-white"
                  >
                    {currentLanguage === "hi"
                      ? "त्वरित विचार व नोट कैप्चर (Quick Note)"
                      : "Quick Note — Capture Fleeting Idea"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {currentLanguage === "hi"
                      ? "वर्तमान दृश्य छोड़े बिना तुरंत अपना विचार सहेजें"
                      : "Save thoughts, formulas, or reminders without leaving your dashboard"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="quick-note-close-btn"
                aria-label="Close Quick Note Modal"
                onClick={() => setIsQuickNoteModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Minimalist Form */}
            <form
              id="home-quick-note-form"
              onSubmit={handleSaveQuickNote}
              className="space-y-3.5"
            >
              <div>
                <input
                  id="quick-note-title-input"
                  type="text"
                  aria-label="Quick Note Title"
                  placeholder={
                    currentLanguage === "hi"
                      ? "शीर्षक (वैकल्पिक — खाली छोड़ने पर स्वतः बनेगा)..."
                      : "Note title (optional — auto-generated if blank)..."
                  }
                  value={quickNoteTitle}
                  onChange={(e) => setQuickNoteTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <textarea
                  id="quick-note-content-input"
                  aria-label="Quick Note Content"
                  rows={4}
                  autoFocus
                  placeholder={
                    currentLanguage === "hi"
                      ? "अपना विचार, सूत्र या रिवीजन पॉइंट यहाँ लिखें..."
                      : "Type your fleeting idea, formula, or key revision point..."
                  }
                  value={quickNoteContent}
                  onChange={(e) => setQuickNoteContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 resize-none"
                />
              </div>

              {/* Minimalist Tag & Pin Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                  {["Idea", "Formula", "Revision", "Doubt"].map((tagOption) => (
                    <button
                      key={tagOption}
                      type="button"
                      onClick={() => setQuickNoteTag(tagOption)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        quickNoteTag === tagOption
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tagOption}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  id="quick-note-pin-toggle"
                  onClick={() => setQuickNotePinned((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                    quickNotePinned
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-900 text-slate-400 border-white/10 hover:text-white"
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{quickNotePinned ? "Pinned" : "Pin Idea"}</span>
                </button>
              </div>

              {/* Recent Notes Preview (if any) */}
              {combinedNotes.length > 0 && (
                <div
                  id="quick-note-recent-list"
                  className="pt-2 border-t border-white/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Recent Captured Notes ({combinedNotes.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickNoteModalOpen(false);
                        onNavigate("notes");
                      }}
                      className="text-emerald-400 hover:underline font-medium cursor-pointer"
                    >
                      View All Notes →
                    </button>
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {combinedNotes.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-semibold text-slate-200 truncate">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {item.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  id="quick-note-cancel-btn"
                  onClick={() => setIsQuickNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="quick-note-save-btn"
                  disabled={!quickNoteTitle.trim() && !quickNoteContent.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {currentLanguage === "hi" ? "नोट सहेजें" : "Save Quick Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MINIMALIST QUICK-HABIT CREATION MODAL                                     */}
      {/* ========================================================================= */}
      {isQuickHabitModalOpen && (
        <div
          id="home-quick-habit-modal"
          data-testid="quick-habit-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-habit-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setIsQuickHabitModalOpen(false)}
        >
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/15 bg-slate-950/95 p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    id="quick-habit-modal-title"
                    className="text-base font-bold font-heading text-white"
                  >
                    {currentLanguage === "hi"
                      ? "त्वरित अध्ययन आदत जोड़ें (Quick Add Habit)"
                      : "Quick Add Habit — Daily Consistency"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {currentLanguage === "hi"
                      ? "दैनिक स्ट्रीक बनाने के लिए नई अध्ययन या स्वास्थ्य आदत जोड़ें"
                      : "Create a daily habit to track your consistency directly on Home"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close Quick Habit Modal"
                onClick={() => setIsQuickHabitModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              id="home-quick-habit-form"
              onSubmit={handleSaveQuickHabit}
              className="space-y-3.5"
            >
              <div>
                <input
                  id="quick-habit-title-input"
                  type="text"
                  autoFocus
                  aria-label="Habit Title"
                  placeholder={
                    currentLanguage === "hi"
                      ? "आदत का नाम (जैसे: सुबह 30 मिनट सूत्र रिवीजन)..."
                      : "Habit title (e.g., Morning 30m Formula Revision)..."
                  }
                  value={quickHabitTitle}
                  onChange={(e) => setQuickHabitTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Category:</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                  {(["study", "health", "mindset", "other"] as Habit["category"][]).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setQuickHabitCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                          quickHabitCategory === cat
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsQuickHabitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="quick-habit-save-btn"
                  disabled={!quickHabitTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {currentLanguage === "hi" ? "आदत जोड़ें" : "Save Habit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
