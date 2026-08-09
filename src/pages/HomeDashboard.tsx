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
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Top Banner Greeting & Time */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-emerald-900/40 via-slate-900/80 to-cyan-950/50 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Garia OS Active</span>
              </div>
              {activeStudent && (
                <button
                  onClick={onOpenStudentModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    Student: {activeStudent.name} ({activeStudent.stream})
                  </span>
                  <span className="text-[10px] underline font-normal">Switch</span>
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
              {greeting}, {activeStudent?.name || settings.userName || "Student"} 👋
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Your personal operating system is loaded for{" "}
              {activeStudent
                ? `${activeStudent.classLevel} (${activeStudent.stream} - ${activeStudent.board})`
                : "today's goals"}
              .
            </p>
          </div>

          <div className="text-left sm:text-right glass-card p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {liveTime}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{liveDate}</div>
          </div>
        </div>
      </div>

      {/* Smart OS Suggestions Widget */}
      <SmartSuggestionsWidget
        suggestions={smartSuggestions}
        onAction={handleSuggestionAction}
        onDismiss={handleDismissSuggestion}
        studentName={activeStudent?.name}
      />

      {/* Exam Intelligence V1.9 Summary Widget */}
      <ExamIntelligenceWidget
        report={examReport}
        onNavigate={(tab) => onNavigate(tab as ActiveTab)}
      />

      {/* Academic Roadmap Widget */}
      {roadmap && (
        <AcademicRoadmapWidget
          roadmap={roadmap}
          vviTopics={vviTopics}
          revisions={revisions}
          onNavigate={onNavigate}
        />
      )}

      {/* Overview Top Section: Daily Progress Ring + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Daily Progress Ring (Dynamic Active User Data) */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden text-center">
          <div className="absolute top-3 left-4 text-xs font-semibold text-slate-400 uppercase tracking-wider font-heading">
            Daily Progress Score
          </div>

          <div className="relative w-44 h-44 my-4 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="88"
                cy="88"
                r="70"
                stroke="url(#emeraldGradient)"
                strokeWidth="12"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * overallPercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                fill="transparent"
              />
              <defs>
                <linearGradient
                  id="emeraldGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold font-heading text-white">
                {overallPercent}%
              </span>
              <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
                Completed
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs">
            <div>
              <div className="text-slate-400">Tasks</div>
              <div className="font-bold text-white mt-0.5">
                {completedTodayTasks.length}/{todayTasks.length}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Study</div>
              <div className="font-bold text-cyan-400 mt-0.5">
                {studyProgressPercent}%
              </div>
            </div>
            <div>
              <div className="text-slate-400">Habits</div>
              <div className="font-bold text-rose-400 mt-0.5">
                {habitsDoneToday.length}/{habits.length}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <span>Quick Actions</span>
                <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Instant Shortcuts
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => onNavigate("exam")}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-pill border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all group relative overflow-hidden"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white font-heading">
                  Exam Center
                </span>
              </button>

              <button
                onClick={() => onNavigate("academic")}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-pill border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all group relative overflow-hidden"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white font-heading">
                  Academic Center
                </span>
              </button>

              <button
                onClick={onQuickAddTask}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-pill border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white font-heading">
                  Add Task
                </span>
              </button>

              <button
                onClick={() => onNavigate("goals")}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-pill border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Target className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white font-heading">
                  Track Goals
                </span>
              </button>

              <button
                onClick={() => onNavigate("calendar")}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-pill border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white font-heading">
                  Calendar
                </span>
              </button>

              <button
                onClick={() => onNavigate("focus")}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-pill border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Timer className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white font-heading">
                  Start Focus
                </span>
              </button>

              <button
                onClick={onQuickAddNote}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-pill border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <FilePlus className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white font-heading">
                  Add Note
                </span>
              </button>

              <button
                onClick={() => onNavigate("study")}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-pill border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white font-heading">
                  Study Tracker
                </span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Abya AI Assistant Ready</span>
            <button
              onClick={() => onNavigate("abya")}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              Start Chat <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stream-Specific Study Tracker Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 p-2.5 flex items-center justify-center shrink-0">
              <StreamIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-heading text-white">
                  {streamMeta.label} Study Tracker
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {activeStudent?.classLevel || "Active Stream"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {todayStudyMinutes > 0
                  ? `Logged ${todayStudyHours}h ${todayStudyMinsRem}m today across active stream subjects.`
                  : "No study sessions logged yet today."}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate("study")}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-cyan-500/30"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Study Tracker</span>
          </button>
        </div>

        {/* Subjects Progress Cards for Active Student's Stream */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {subjects.map((sub) => {
            const pct =
              sub.targetMinutesPerWeek > 0
                ? Math.min(
                    100,
                    Math.round((sub.completedMinutes / sub.targetMinutesPerWeek) * 100)
                  )
                : 0;

            const hrsCompleted = (sub.completedMinutes / 60).toFixed(1);
            const hrsTarget = Math.round(sub.targetMinutesPerWeek / 60);

            return (
              <div
                key={sub.id}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color || "#10b981" }}
                    />
                    <h4 className="font-bold text-white text-xs font-heading">
                      {sub.name}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">
                    {pct}%
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-1">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: sub.color || "#10b981",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {hrsCompleted}h / {hrsTarget}h target
                  </span>
                  <span>{sub.totalSessions} sessions</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Today's Overview Grid (Tasks, Water, Habits, Focus) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-heading text-white">
            Today's Overview
          </h3>
          <span className="text-xs text-slate-400 font-mono">{todayStr}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Tasks Summary Card */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">
                  Today's Tasks
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-heading text-white">
                {completedTodayTasks.length} / {todayTasks.length}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${taskProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              {todayTasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  onClick={() => onToggleTask && onToggleTask(t)}
                  className="flex items-start gap-2 text-xs cursor-pointer hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                >
                  <button type="button" className="mt-0.5 shrink-0 text-emerald-400">
                    {t.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                  <span
                    className={`line-clamp-1 ${
                      t.completed ? "line-through text-slate-500" : "text-slate-200"
                    }`}
                  >
                    {t.title}
                  </span>
                </div>
              ))}

              {todayTasks.length === 0 && (
                <p className="text-[11px] text-slate-500 italic">
                  No tasks scheduled for today.
                </p>
              )}
            </div>

            <button
              onClick={() => onNavigate("tasks")}
              className="text-[11px] text-emerald-400 hover:underline text-right font-semibold pt-1 border-t border-white/5"
            >
              Open Tasks →
            </button>
          </div>

          {/* 4. Interactive Water Tracker Card */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-blue-500/40 transition-all flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">
                  Water Tracker
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Droplet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-heading text-white">
                {water.glasses} / {water.goal} glasses
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${waterProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2 rounded-xl border border-white/10">
              <span className="text-xs text-slate-300 font-medium pl-1">
                {waterProgressPercent}% Hydrated
              </span>
              <div className="flex items-center gap-1.5">
                {onRemoveWaterGlass && (
                  <button
                    type="button"
                    onClick={onRemoveWaterGlass}
                    disabled={water.glasses <= 0}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center transition-all border border-white/10"
                    title="Remove 1 glass"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onAddWaterGlass}
                  className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all shadow-md"
                  title="Add 1 glass"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+1</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => onNavigate("water")}
              className="text-[11px] text-blue-400 hover:underline text-right font-semibold pt-1 border-t border-white/5"
            >
              Water Log →
            </button>
          </div>

          {/* 5. Habits Tracker Card */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-rose-500/40 transition-all flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">
                  Habits Tracker
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-heading text-white">
                {habitsDoneToday.length} / {habits.length} Done
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-rose-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${habitProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              {habits.slice(0, 3).map((h) => {
                const isDone = h.completedDates.includes(todayStr);
                return (
                  <div
                    key={h.id}
                    onClick={() =>
                      onToggleHabit && onToggleHabit(h.id, todayStr)
                    }
                    className="flex items-start gap-2 text-xs cursor-pointer hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                  >
                    <button type="button" className="mt-0.5 shrink-0 text-rose-400">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                    <span
                      className={`line-clamp-1 ${
                        isDone ? "line-through text-slate-500" : "text-slate-200"
                      }`}
                    >
                      {h.title}
                    </span>
                  </div>
                );
              })}

              {habits.length === 0 && (
                <p className="text-[11px] text-slate-500 italic">
                  No habits added yet.
                </p>
              )}
            </div>

            <button
              onClick={() => onNavigate("habits")}
              className="text-[11px] text-rose-400 hover:underline text-right font-semibold pt-1 border-t border-white/5"
            >
              Habits Page →
            </button>
          </div>

          {/* Today's Study & Focus Card */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">
                  Today's Focus & Study
                </span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Timer className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-heading text-white">
                {todayStudyHours > 0 ? `${todayStudyHours}h ${todayStudyMinsRem}m` : `${todayStudyMinutes} mins`}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {todayFocusLogs.length} focus session(s) completed today
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Active Subjects:</span>
                <span className="font-bold text-white">{subjects.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Weekly Target Progress:</span>
                <span className="font-bold text-cyan-400">{studyProgressPercent}%</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate("focus")}
              className="text-[11px] text-cyan-400 hover:underline text-right font-semibold pt-1 border-t border-white/5"
            >
              Start Focus Session →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
