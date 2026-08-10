import React, { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  Timer,
  FilePlus,
  BookOpen,
  Droplet,
  CheckCircle2,
  Circle,
  Sparkles,
  Flame,
  Clock,
  ArrowUpRight,
  Target,
  Calendar,
  GraduationCap,
  ShieldAlert,
  Users,
  Check,
  ListTodo,
  Atom,
  TrendingUp,
  Compass,
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
} from "../types";
import { getTodayString, loadSmartSuggestionsState, saveSmartSuggestionsState } from "../utils/storage";
import { generateSmartSuggestions } from "../utils/suggestionsEngine";
import { generateExamIntelligenceReport } from "../utils/examIntelligenceEngine";
import { SmartSuggestionsWidget } from "../components/SmartSuggestionsWidget";
import { AcademicRoadmapWidget } from "../components/AcademicRoadmapWidget";
import { ExamIntelligenceWidget } from "../components/ExamIntelligenceWidget";

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

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 17) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");

      setLiveTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
      setLiveDate(
        now.toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = getTodayString();

  // 1. Tasks Metrics for Today
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedTodayTasks = todayTasks.filter((t) => t.completed);
  const taskProgressPercent =
    todayTasks.length > 0
      ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
      : 0;

  // 2. Habits Metrics for Today
  const habitsDoneToday = habits.filter((h) =>
    h.completedDates.includes(todayStr)
  );
  const habitProgressPercent =
    habits.length > 0
      ? Math.round((habitsDoneToday.length / habits.length) * 100)
      : 0;

  // 3. Study Metrics (Today & Overall)
  const todayStudySessions = studySessions.filter((s) => {
    if (!s.timestamp) return false;
    const d = new Date(s.timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}` === todayStr;
  });

  const todayStudySeconds = todayStudySessions.reduce(
    (acc, s) => acc + (s.durationSeconds || 0),
    0
  );
  const todayStudyMinutes = Math.round(todayStudySeconds / 60);
  const todayStudyHours = Math.floor(todayStudyMinutes / 60);
  const todayStudyMinsRem = todayStudyMinutes % 60;

  const totalTargetStudyMinutes = subjects.reduce(
    (acc, s) => acc + s.targetMinutesPerWeek,
    0
  );
  const totalCompletedStudyMinutes = subjects.reduce(
    (acc, s) => acc + s.completedMinutes,
    0
  );
  const studyProgressPercent =
    totalTargetStudyMinutes > 0
      ? Math.min(
          100,
          Math.round((totalCompletedStudyMinutes / totalTargetStudyMinutes) * 100)
        )
      : 0;

  // 4. Water Metrics
  const waterProgressPercent =
    water.goal > 0 ? Math.min(100, Math.round((water.glasses / water.goal) * 100)) : 0;

  // 5. Focus Logs Metrics Today
  const todayFocusLogs = focusLogs.filter((f) => {
    if (!f.timestamp) return false;
    const d = new Date(f.timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}` === todayStr;
  });

  // Overall Daily Productivity Score calculation (weighted active components)
  let activeComponentsCount = 0;
  let activeComponentsSum = 0;

  if (todayTasks.length > 0) {
    activeComponentsCount++;
    activeComponentsSum += taskProgressPercent;
  }
  if (habits.length > 0) {
    activeComponentsCount++;
    activeComponentsSum += habitProgressPercent;
  }
  // Water metric is always active
  activeComponentsCount++;
  activeComponentsSum += waterProgressPercent;

  if (totalTargetStudyMinutes > 0) {
    activeComponentsCount++;
    activeComponentsSum += studyProgressPercent;
  }

  const overallPercent =
    activeComponentsCount > 0
      ? Math.round(activeComponentsSum / activeComponentsCount)
      : 0;

  // Stream Meta Helper
  const currentStream = activeStudent?.stream || "Commerce";
  const getStreamMeta = (s: string) => {
    if (s === "Science") {
      return {
        label: "Science Stream",
        icon: Atom,
        color: "text-cyan-400",
        badge: "PCM / PCB",
      };
    }
    if (s === "Arts / Humanities" || s === "Arts") {
      return {
        label: "Arts / Humanities",
        icon: Compass,
        color: "text-purple-400",
        badge: "Law / UPSC",
      };
    }
    return {
      label: "Commerce Stream",
      icon: TrendingUp,
      color: "text-emerald-400",
      badge: "CA / Finance",
    };
  };

  const streamMeta = getStreamMeta(currentStream);
  const StreamIcon = streamMeta.icon;

  // Smart OS Suggestions
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

  // Re-sync dismissedIds whenever active student changes
  useEffect(() => {
    const loaded = loadSmartSuggestionsState(activeStudent?.id);
    setDismissedIds(loaded.dismissedIds || []);
  }, [activeStudent?.id]);

  const handleDismissSuggestion = (sugId: string) => {
    const updated = [...dismissedIds, sugId];
    setDismissedIds(updated);
    saveSmartSuggestionsState({ dismissedIds: updated, lastUpdated: Date.now() }, activeStudent?.id);
  };

  // Exam Intelligence Report (V1.9)
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

  const handleSuggestionAction = (targetTab?: string) => {
    if (targetTab === "home") return;
    if (targetTab === "water") {
      onAddWaterGlass();
      return;
    }
    if (targetTab) {
      onNavigate(targetTab as ActiveTab);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6 animate-in fade-in duration-200 max-w-7xl mx-auto">
      {/* 1. HEADER — Compact Greeting & Active Profile Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden card-press">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full glass-pill border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Garia OS V2.0</span>
              </span>
              {activeStudent && (
                <button
                  onClick={onOpenStudentModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-300 text-[11px] font-medium transition-all"
                >
                  <Users className="w-3 h-3" />
                  <span>
                    {activeStudent.name} • {activeStudent.stream}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-normal underline ml-0.5">Switch</span>
                </button>
              )}
            </div>
            <h1 className="text-lg sm:text-2xl font-bold font-heading text-white tracking-tight">
              {greeting}, {activeStudent?.name || settings.userName || "Student"}
            </h1>
            <p className="text-slate-400 text-xs">
              {activeStudent
                ? `${activeStudent.classLevel} (${activeStudent.stream} - ${activeStudent.board})`
                : "Your daily dashboard is loaded."}
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
            <div className="text-left sm:text-right">
              <div className="text-lg font-bold font-mono text-emerald-400 leading-none">
                {liveTime}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{liveDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY SUMMARY — Compact Daily Progress Card */}
      <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-heading text-white">
                Daily Productivity Score
              </h2>
              <p className="text-[11px] text-slate-400">
                {overallPercent >= 80
                  ? "Outstanding progress today!"
                  : overallPercent >= 50
                  ? "Solid steady momentum"
                  : "Keep pushing towards daily targets"}
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            <span className="text-lg font-extrabold font-heading text-emerald-400">
              {overallPercent}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(3, overallPercent)}%` }}
          />
        </div>

        {/* Quick Action Shortcuts */}
        <div className="pt-2 border-t border-white/5">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
            Quick Actions
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            <button
              onClick={() => onNavigate("exam")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 transition-all text-center group"
            >
              <ShieldAlert className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-slate-200 truncate w-full">Exam</span>
            </button>
            <button
              onClick={() => onNavigate("academic")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 transition-all text-center group"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-slate-200 truncate w-full">Academic</span>
            </button>
            <button
              onClick={onQuickAddTask}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 transition-all text-center group"
            >
              <Plus className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-slate-200 truncate w-full">+ Task</span>
            </button>
            <button
              onClick={() => onNavigate("goals")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-purple-500/30 transition-all text-center group"
            >
              <Target className="w-4 h-4 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-slate-200 truncate w-full">Goals</span>
            </button>
            <button
              onClick={() => onNavigate("calendar")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-amber-500/30 transition-all text-center group"
            >
              <Calendar className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-slate-200 truncate w-full">Calendar</span>
            </button>
            <button
              onClick={() => onNavigate("focus")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-amber-500/30 transition-all text-center group"
            >
              <Timer className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-slate-200 truncate w-full">Focus</span>
            </button>
            <button
              onClick={onQuickAddNote}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 transition-all text-center group"
            >
              <FilePlus className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-slate-200 truncate w-full">+ Note</span>
            </button>
            <button
              onClick={() => onNavigate("study")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 transition-all text-center group"
            >
              <BookOpen className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-slate-200 truncate w-full">Study</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. QUICK METRICS — 2-Column Compact Grid */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Quick Metrics
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Metric 1: Study Time */}
          <div
            onClick={() => onNavigate("study")}
            className="glass-card rounded-xl p-3 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between gap-1.5 card-press"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 truncate">
                Study Time
              </span>
              <div className="w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold font-heading text-white leading-tight">
                {todayStudyHours > 0
                  ? `${todayStudyHours}h ${todayStudyMinsRem}m`
                  : `${todayStudyMinutes} mins`}
              </div>
              <div className="text-[10px] text-cyan-400 font-medium mt-0.5">
                {studyProgressPercent}% of weekly target
              </div>
            </div>
          </div>

          {/* Metric 2: Water Tracker */}
          <div className="glass-card rounded-xl p-3 border border-white/10 hover:border-blue-500/40 transition-all flex flex-col justify-between gap-1.5 card-press">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 truncate">
                Water
              </span>
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                <Droplet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-1">
              <div>
                <div className="text-base sm:text-lg font-bold font-heading text-white leading-tight">
                  {water.glasses}/{water.goal} <span className="text-xs text-slate-400 font-normal">g</span>
                </div>
                <div className="text-[10px] text-blue-400 font-medium mt-0.5">
                  {waterProgressPercent}% hydrated
                </div>
              </div>

              {/* Interactive +1 / -1 Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {onRemoveWaterGlass && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveWaterGlass();
                    }}
                    disabled={water.glasses <= 0}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center transition-all border border-white/10"
                    title="Remove 1 glass"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddWaterGlass();
                  }}
                  className="px-1.5 py-1 rounded bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-[10px] flex items-center gap-0.5 transition-all shadow-sm"
                  title="Add 1 glass"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>1</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metric 3: Tasks */}
          <div
            onClick={() => onNavigate("tasks")}
            className="glass-card rounded-xl p-3 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between gap-1.5 card-press"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 truncate">
                Tasks Today
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <ListTodo className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold font-heading text-white leading-tight">
                {completedTodayTasks.length} / {todayTasks.length}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                {taskProgressPercent}% tasks complete
              </div>
            </div>
          </div>

          {/* Metric 4: Habits */}
          <div
            onClick={() => onNavigate("habits")}
            className="glass-card rounded-xl p-3 border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer flex flex-col justify-between gap-1.5 card-press"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 truncate">
                Habits Today
              </span>
              <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold font-heading text-white leading-tight">
                {habitsDoneToday.length} / {habits.length}
              </div>
              <div className="text-[10px] text-rose-400 font-medium mt-0.5">
                {habitProgressPercent}% habits done
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ACADEMIC SECTION — Stream Study Tracker + Academic Roadmap */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Academic Overview
        </div>

        {/* Stream Study Tracker */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                <StreamIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-white">
                  {streamMeta.label} Subjects
                </h3>
                <p className="text-[11px] text-slate-400">
                  {todayStudyMinutes > 0
                    ? `Logged ${todayStudyHours}h ${todayStudyMinsRem}m today.`
                    : "No study logged yet today."}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("study")}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[11px] font-semibold transition-all flex items-center gap-1 border border-cyan-500/25"
            >
              <BookOpen className="w-3 h-3" />
              <span>Study</span>
            </button>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {subjects.map((sub) => {
              const pct =
                sub.targetMinutesPerWeek > 0
                  ? Math.min(
                      100,
                      Math.round((sub.completedMinutes / sub.targetMinutesPerWeek) * 100)
                    )
                  : 0;
              const hrsCompleted = (sub.completedMinutes / 60).toFixed(1);

              return (
                <div
                  key={sub.id}
                  className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color || "#10b981" }}
                      />
                      <h4 className="font-bold text-white text-xs truncate">
                        {sub.name}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0">
                      {pct}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: sub.color || "#10b981",
                      }}
                    />
                  </div>

                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>{hrsCompleted}h logged</span>
                    <span>{sub.totalSessions} sess</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic Roadmap Widget */}
        {roadmap && (
          <AcademicRoadmapWidget
            roadmap={roadmap}
            vviTopics={vviTopics}
            revisions={revisions}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* 5. INTELLIGENCE SECTION — Smart OS Suggestions + Exam Intelligence */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Exam Intelligence & OS Suggestions
        </div>

        {/* Smart OS Suggestions Widget */}
        <SmartSuggestionsWidget
          suggestions={smartSuggestions}
          onAction={handleSuggestionAction}
          onDismiss={handleDismissSuggestion}
          studentName={activeStudent?.name}
        />

        {/* Exam Intelligence Summary Widget */}
        <ExamIntelligenceWidget
          report={examReport}
          onNavigate={(tab) => onNavigate(tab as ActiveTab)}
        />
      </div>
    </div>
  );
};
