import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  SlidersHorizontal,
  Plus,
  LayoutGrid,
  RotateCcw,
} from "lucide-react";
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
  AcademicSubject,
  AcademicChapter,
  AcademicRoadmapData,
  AcademicVVITopic,
  AcademicRevisionItem,
  ExamTestRecord,
  ExamProfile,
  CareerProfile,
  AcademicPracticeSession,
  HomeWidgetId,
  DashboardWidgetConfig,
} from "../types";
import {
  getTodayString,
  loadSmartSuggestionsState,
  saveSmartSuggestionsState,
} from "../utils/storage";
import { generateSmartSuggestions } from "../utils/suggestionsEngine";
import { generateExamIntelligenceReport } from "../utils/examIntelligenceEngine";
import { calculateGamificationState } from "../utils/gamificationEngine";
import { loadQuestionBankProgress } from "../utils/questionBankEngine";
import { AppLanguage, translations } from "../utils/i18n";
import { getDailyQuote, DailyQuote } from "../data/quotes";
import {
  loadDashboardWidgets,
  saveDashboardWidgets,
  moveWidgetPosition,
  toggleWidgetEnabled,
  WIDGET_METADATA,
} from "../utils/dashboardWidgets";

// Sub-widgets & wrappers
import { WidgetCardWrapper } from "../components/home/widgets/WidgetCardWrapper";
import { QuickActionsWidget } from "../components/home/widgets/QuickActionsWidget";
import { TodaysTasksWidget } from "../components/home/widgets/TodaysTasksWidget";
import { StudyProgressWidget } from "../components/home/widgets/StudyProgressWidget";
import { WaterIntakeWidget } from "../components/home/widgets/WaterIntakeWidget";
import { QuickAccessWidget } from "../components/home/widgets/QuickAccessWidget";
import { GamificationWidget } from "../components/home/widgets/GamificationWidget";
import { QuoteWidget } from "../components/home/widgets/QuoteWidget";
import { ContinueLearningWidget } from "../components/home/widgets/ContinueLearningWidget";
import { FocusTimerWidget } from "../components/home/widgets/FocusTimerWidget";
import { RevisionDueWidget } from "../components/home/widgets/RevisionDueWidget";
import { AbyaSuggestionsWidget } from "../components/home/widgets/AbyaSuggestionsWidget";
import { HabitTrackerWidget } from "../components/home/widgets/HabitTrackerWidget";
import { DashboardWidgetCustomizer } from "../components/home/DashboardWidgetCustomizer";

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
  academicSubjects?: AcademicSubject[];
  chapters?: AcademicChapter[];
  roadmap?: AcademicRoadmapData;
  vviTopics?: AcademicVVITopic[];
  revisions?: AcademicRevisionItem[];
  examTestRecords?: ExamTestRecord[];
  examProfile?: ExamProfile;
  careerProfile?: CareerProfile;
  practiceSessions?: AcademicPracticeSession[];
  settings: UserSettings;
  activeStudent?: StudentProfile;
  currentLanguage?: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
  onQuickAddTask: () => void;
  onQuickAddNote: () => void;
  onAddWaterGlass: () => void;
  onRemoveWaterGlass?: () => void;
  onToggleTask?: (task: Task) => void;
  onToggleHabit?: (habitId: string, dateStr: string) => void;
  onOpenStudentModal?: () => void;
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
  academicSubjects = [],
  chapters = [],
  roadmap,
  vviTopics = [],
  revisions = [],
  examTestRecords = [],
  examProfile,
  careerProfile,
  practiceSessions = [],
  settings,
  activeStudent,
  currentLanguage = "en",
  onNavigate,
  onQuickAddTask,
  onQuickAddNote,
  onAddWaterGlass,
  onRemoveWaterGlass,
  onToggleTask,
  onToggleHabit,
  onOpenStudentModal,
}) => {
  const [greeting, setGreeting] = useState<string>("Good Morning");
  const [liveTime, setLiveTime] = useState<string>("");
  const [liveDate, setLiveDate] = useState<string>("");
  const [quote, setQuote] = useState<DailyQuote>(() => getDailyQuote());

  // Dashboard Customizable Widgets State
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() =>
    loadDashboardWidgets(activeStudent?.id)
  );
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Sync widget configuration if active student switches
  useEffect(() => {
    setWidgets(loadDashboardWidgets(activeStudent?.id));
  }, [activeStudent?.id]);

  useEffect(() => {
    setQuote(getDailyQuote());
  }, [currentLanguage]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      if (currentLanguage === "hi") {
        if (hour < 12) setGreeting("शुभ प्रभात");
        else if (hour < 17) setGreeting("शुभ दोपहर");
        else setGreeting("शुभ संध्या");
      } else {
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 17) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
      }

      setLiveTime(
        now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
      );
      setLiveDate(
        now.toLocaleDateString(currentLanguage === "hi" ? "hi-IN" : "en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [currentLanguage]);

  // Suggestions & Intelligence State
  const activeProfForSug: StudentProfile = activeStudent || {
    id: "default",
    name: settings.userName || "Student",
    classLevel: "Class 12",
    stream: "Commerce",
    board: "BSEB",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    return loadSmartSuggestionsState(activeStudent?.id).dismissedIds || [];
  });

  useEffect(() => {
    const loaded = loadSmartSuggestionsState(activeStudent?.id);
    setDismissedIds(loaded.dismissedIds || []);
  }, [activeStudent?.id]);

  const handleDismissSuggestion = (sugId: string) => {
    const updated = [...dismissedIds, sugId];
    setDismissedIds(updated);
    saveSmartSuggestionsState(
      { dismissedIds: updated, lastUpdated: Date.now() },
      activeStudent?.id
    );
  };

  const defaultExamProfile: ExamProfile = examProfile || {
    board: activeProfForSug.board || "BSEB",
    classLevel: activeProfForSug.classLevel || "Class 12",
    stream: activeProfForSug.stream || "Commerce",
    academicYear: "2025-2026",
    examName: `${activeProfForSug.classLevel} Board Exam`,
    startDate: getTodayString(),
    subjectExamDates: {},
    dailyStudyHours: 5,
  };

  const examReport = generateExamIntelligenceReport(
    activeProfForSug,
    defaultExamProfile,
    examTestRecords || [],
    academicSubjects,
    chapters,
    vviTopics,
    revisions,
    practiceSessions || [],
    careerProfile
  );

  const smartSuggestions = generateSmartSuggestions(
    activeProfForSug,
    tasks,
    subjects,
    academicSubjects,
    chapters,
    goals,
    water,
    habits,
    dismissedIds,
    examTestRecords || [],
    vviTopics,
    examReport
  );

  // Active Chapter for Continue Learning
  const activeChapter =
    chapters.find((c) => c.status === "in_progress") ||
    chapters.find((c) => c.status === "not_started") ||
    chapters[0];
  const activeChapterSubject = academicSubjects.find(
    (s) => s.id === activeChapter?.subjectId
  );
  const chapterProgress = activeChapter?.progress || 0;

  // Calculate live gamification state
  const qbankProgress = activeStudent ? loadQuestionBankProgress(activeStudent.id) : undefined;
  const gamification = calculateGamificationState(
    activeStudent,
    tasks,
    studySessions,
    focusLogs,
    habits,
    goals,
    examTestRecords,
    practiceSessions,
    qbankProgress
  );

  // Target exam details for countdown
  const targetExamName =
    examProfile?.targetExamName ||
    (activeStudent?.classLevel === "Class 10"
      ? "Class 10 Board Exam 2026"
      : activeStudent?.classLevel === "Class 12"
      ? "Class 12 Board Exam 2026"
      : "Annual Academic Exam 2026");

  const targetExamDateStr = examProfile?.examStartDate || "2026-03-01";
  const calculateDaysLeft = () => {
    try {
      const target = new Date(targetExamDateStr).getTime();
      const now = new Date().getTime();
      const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    } catch {
      return 180;
    }
  };
  const daysUntilExam = calculateDaysLeft();

  // Widget Actions
  const handleSaveWidgets = (updated: DashboardWidgetConfig[]) => {
    setWidgets(updated);
    saveDashboardWidgets(updated, activeStudent?.id);
  };

  const handleMoveWidget = (id: HomeWidgetId, direction: "up" | "down") => {
    const updated = moveWidgetPosition(widgets, id, direction, activeStudent?.id);
    setWidgets(updated);
  };

  const handleHideWidget = (id: HomeWidgetId) => {
    const updated = toggleWidgetEnabled(widgets, id, false, activeStudent?.id);
    setWidgets(updated);
  };

  // Enabled widgets sorted by their user order
  const enabledWidgets = useMemo(() => {
    return [...widgets]
      .filter((w) => w.enabled)
      .sort((a, b) => a.order - b.order);
  }, [widgets]);

  // Render content corresponding to each widget ID
  const renderWidgetContent = (id: HomeWidgetId) => {
    switch (id) {
      case "gamification_card":
        return (
          <GamificationWidget
            gamification={gamification}
            examReport={examReport}
            targetExamName={targetExamName}
            daysUntilExam={daysUntilExam}
            onNavigate={onNavigate}
          />
        );

      case "quote_card":
        return <QuoteWidget quote={quote} currentLanguage={currentLanguage} />;

      case "quick_actions":
        return (
          <QuickActionsWidget
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
            onQuickAddTask={onQuickAddTask}
          />
        );

      case "quick_access":
        return <QuickAccessWidget onNavigate={onNavigate} />;

      case "continue_learning":
        return (
          <ContinueLearningWidget
            activeChapter={activeChapter}
            activeChapterSubject={activeChapterSubject}
            chapterProgress={chapterProgress}
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
          />
        );

      case "todays_tasks":
        return (
          <TodaysTasksWidget
            tasks={tasks}
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
            onQuickAddTask={onQuickAddTask}
            onToggleTask={onToggleTask}
          />
        );

      case "study_progress":
        return (
          <StudyProgressWidget
            subjects={subjects}
            studySessions={studySessions}
            focusLogs={focusLogs}
            tasks={tasks}
            streamLabel={
              activeStudent?.stream
                ? `${activeStudent.stream} Subjects`
                : "Syllabus Subjects"
            }
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
          />
        );

      case "water_intake":
        return (
          <WaterIntakeWidget
            water={water}
            currentLanguage={currentLanguage}
            onAddWaterGlass={onAddWaterGlass}
            onRemoveWaterGlass={onRemoveWaterGlass}
          />
        );

      case "focus_timer":
        return (
          <FocusTimerWidget
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
          />
        );

      case "revision_due":
        return (
          <RevisionDueWidget
            revisions={revisions}
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
          />
        );

      case "abya_suggestions":
        return (
          <AbyaSuggestionsWidget
            smartSuggestions={smartSuggestions}
            currentLanguage={currentLanguage}
            onNavigate={onNavigate}
            onDismissSuggestion={handleDismissSuggestion}
          />
        );

      case "habit_tracker":
        return (
          <HabitTrackerWidget
            habits={habits}
            currentLanguage={currentLanguage}
            onToggleHabit={onToggleHabit}
            onNavigate={onNavigate}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 pb-24 md:pb-8 animate-in fade-in duration-200 max-w-6xl mx-auto">
      {/* 1. TOP STUDENT HEADER BAR & CUSTOMIZE CONTROL */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full glass-pill border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Garia OS V3.0</span>
              </span>
              {activeStudent && (
                <button
                  onClick={onOpenStudentModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-300 text-[11px] font-medium transition-all"
                >
                  <span>
                    {activeStudent.name} • {activeStudent.classLevel} ({activeStudent.stream})
                  </span>
                </button>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
              {greeting}, {activeStudent?.name || settings.userName || "Student"}
            </h1>
            <p className="text-slate-400 text-xs">
              {currentLanguage === "hi"
                ? "आज का सुव्यवस्थित अध्ययन डैशबोर्ड। एक क्लिक में अध्ययन शुरू करें।"
                : "Your focused daily learning cockpit. Modular, personalized, and distraction-free."}
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
            {/* Live Clock */}
            <div className="text-left sm:text-right">
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 leading-none">
                {liveTime}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{liveDate}</div>
            </div>

            {/* Customize Dashboard Button */}
            <button
              onClick={() => setIsCustomizerOpen(true)}
              id="customize-widgets-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-semibold transition-all active:scale-95 shadow-sm"
              title="Customize Dashboard Widgets"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {currentLanguage === "hi" ? "विजेट्स कस्टमाइज़ करें" : "Customize Widgets"}
              </span>
              <span className="sm:hidden">
                {currentLanguage === "hi" ? "कस्टमाइज़" : "Widgets"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC ORDERED WIDGETS GRID */}
      {enabledWidgets.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {enabledWidgets.map((w, index) => {
            const meta = WIDGET_METADATA[w.id];
            const isFullSpan = meta?.defaultColSpan === "full";
            const colClass = isFullSpan
              ? "col-span-1 lg:col-span-12"
              : "col-span-1 lg:col-span-6";

            return (
              <div key={w.id} className={colClass}>
                <WidgetCardWrapper
                  id={w.id}
                  isFirst={index === 0}
                  isLast={index === enabledWidgets.length - 1}
                  onMoveUp={() => handleMoveWidget(w.id, "up")}
                  onMoveDown={() => handleMoveWidget(w.id, "down")}
                  onHide={() => handleHideWidget(w.id)}
                  onOpenCustomizer={() => setIsCustomizerOpen(true)}
                >
                  {renderWidgetContent(w.id)}
                </WidgetCardWrapper>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state when all widgets are hidden */
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-dashed border-white/15 text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <LayoutGrid className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold font-heading text-white">
              {currentLanguage === "hi" ? "सभी विजेट्स छिपे हुए हैं" : "All Dashboard Widgets Are Hidden"}
            </h3>
            <p className="text-xs text-slate-400">
              {currentLanguage === "hi"
                ? "अपनी आवश्यकतानुसार विजेट्स को सक्षम करने के लिए कस्टमाइज़ेशन खोलें।"
                : "Choose which widgets you want to display to suit your daily study flow."}
            </p>
          </div>
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{currentLanguage === "hi" ? "विजेट्स चुनें" : "Select Widgets"}</span>
          </button>
        </div>
      )}

      {/* 3. DASHBOARD WIDGET CUSTOMIZER MODAL */}
      <DashboardWidgetCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        widgets={widgets}
        onSave={handleSaveWidgets}
        currentLanguage={currentLanguage}
        profileId={activeStudent?.id}
      />
    </div>
  );
};
