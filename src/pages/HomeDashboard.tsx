import React, { useState, useEffect, useMemo } from "react";
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
} from "../types";
import {
  getTodayString,
  loadAcademicSubjects,
  loadAcademicChapters,
  loadVVITopics,
  loadAcademicRevisions,
  loadAcademicPractice,
} from "../utils/storage";
import { calculateGamificationState } from "../utils/gamificationEngine";
import { generateExamIntelligenceReport } from "../utils/examIntelligenceEngine";
import { AppLanguage, translations } from "../utils/i18n";
import { fetchDailyQuote, fetchNextQuote, MOTIVATIONAL_QUOTES, MotivationalQuote } from "../utils/quotes";
import { HeroSection } from "../components/home/sections/HeroSection";
import { QuickActionsWidget } from "../components/home/widgets/QuickActionsWidget";
import { DailyExecutionSection } from "../components/home/sections/DailyExecutionSection";
import { AcademicDecisionEngineSection } from "../components/home/sections/AcademicDecisionEngineSection";
import { WellnessSection } from "../components/home/sections/WellnessSection";

interface HomeDashboardProps {
  tasks: Task[];
  subjects: Subject[];
  studySessions?: StudySession[];
  focusLogs?: FocusSessionLog[];
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
  onAddWaterGlass: () => void;
  onRemoveWaterGlass?: () => void;
  onToggleTask?: (task: Task) => void;
  onToggleHabit?: (habitId: string, dateStr: string) => void;
  onOpenSliderMenu?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  tasks,
  subjects,
  studySessions = [],
  focusLogs = [],
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
  onAddWaterGlass,
  onRemoveWaterGlass,
  onToggleTask,
  onToggleHabit,
  onOpenSliderMenu,
}) => {
  const todayStr = getTodayString();
  const t = translations[currentLanguage] || translations.en;

  // Academic Dataset for Decision Engine
  const academicSubjects = useMemo(
    () => loadAcademicSubjects(activeStudent?.stream, activeStudent?.id, activeStudent?.classLevel),
    [activeStudent?.stream, activeStudent?.id, activeStudent?.classLevel]
  );
  const academicChapters = useMemo(
    () => loadAcademicChapters(activeStudent?.id),
    [activeStudent?.id]
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
  const [quoteIndex, setQuoteIndex] = useState<number>(() => {
    const daily = fetchDailyQuote();
    const idx = MOTIVATIONAL_QUOTES.findIndex((q) => q.id === daily.id);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => fetchNextQuote(prev).index);
    }, 25000);
    return () => clearInterval(quoteInterval);
  }, []);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => fetchNextQuote(prev).index);
  };

  const activeQuote: MotivationalQuote = MOTIVATIONAL_QUOTES[quoteIndex] || MOTIVATIONAL_QUOTES[0];

  // Dynamic Greeting based on time of day
  const hour = currentDateTime.getHours();
  let timeGreeting = "Good Morning";
  if (hour >= 12 && hour < 17) {
    timeGreeting = "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    timeGreeting = "Good Evening";
  } else if (hour >= 21 || hour < 5) {
    timeGreeting = "Good Night";
  }

  const hindiGreeting =
    hour >= 4 && hour < 12
      ? "सुप्रभात"
      : hour >= 12 && hour < 17
      ? "शुभ दोपहर"
      : hour >= 17 && hour < 21
      ? "शुभ संध्या"
      : "शुभ रात्रि";

  const displayGreeting = currentLanguage === "hi" ? hindiGreeting : timeGreeting;

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

  // Today's tasks filtering
  const todaysTasks = useMemo(() => {
    return tasks.filter((task) => task.date === todayStr);
  }, [tasks, todayStr]);

  const completedTodayCount = todaysTasks.filter((t) => t.completed).length;
  const taskCompletionRate = todaysTasks.length > 0
    ? Math.round((completedTodayCount / todaysTasks.length) * 100)
    : 100;

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

  return (
    <div className="space-y-7 pb-4 md:pb-0 animate-in fade-in duration-200 max-w-6xl mx-auto w-full">
      {/* ========================================================================= */}
      {/* SECTION 1: HERO AREA (Greeting, Productivity Score, Countdown, Focus)     */}
      {/* ========================================================================= */}
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
          habits.filter((h) => h.completedDates?.includes(todayStr)).length
        }
        totalHabitsCount={habits.length}
        onNavigate={onNavigate}
        onOpenSliderMenu={onOpenSliderMenu}
      />

      {/* ========================================================================= */}
      {/* 1-TAP QUICK ACTIONS (Start Study, + Add Task, Focus Timer, Exam, Ask Abya) */}
      {/* ========================================================================= */}
      <QuickActionsWidget
        currentLanguage={currentLanguage}
        onNavigate={onNavigate}
        onQuickAddTask={onQuickAddTask || (() => onNavigate("tasks"))}
      />

      {/* ========================================================================= */}
      {/* SECTION 2: DAILY EXECUTION (Tasks, Pending, Focus Sessions, Study Time)   */}
      {/* ========================================================================= */}
      <DailyExecutionSection
        tasks={tasks}
        studySessions={studySessions}
        focusLogs={focusLogs}
        currentLanguage={currentLanguage}
        onNavigate={onNavigate}
        onQuickAddTask={onQuickAddTask}
        onAddTask={onAddTask}
        onToggleTask={onToggleTask}
      />

      {/* ========================================================================= */}
      {/* SECTION 3: ACADEMIC INTELLIGENCE & STUDENT DECISION ENGINE                */}
      {/* 5 Ordered Cards: 1. Focus, 2. Revision, 3. Readiness, 4. Performance, 5. Career */}
      {/* ========================================================================= */}
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
        streakDays={gamification.streakDays}
        currentLanguage={currentLanguage}
        onNavigate={onNavigate}
      />

      {/* ========================================================================= */}
      {/* SECTION 4: WELLNESS (Habit Tracker, Water Tracker)                        */}
      {/* ========================================================================= */}
      <WellnessSection
        habits={habits}
        water={water}
        currentLanguage={currentLanguage}
        onToggleHabit={onToggleHabit}
        onAddWaterGlass={onAddWaterGlass}
        onRemoveWaterGlass={onRemoveWaterGlass}
        onNavigate={onNavigate}
      />
    </div>
  );
};
