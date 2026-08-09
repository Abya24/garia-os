import React, { useState, useEffect } from "react";
import {
  Plus,
  Timer,
  FilePlus,
  BookOpen,
  Droplet,
  CheckCircle2,
  Sparkles,
  Flame,
  Clock,
  ArrowUpRight,
  Target,
  Calendar,
  GraduationCap,
  ShieldAlert,
} from "lucide-react";
import {
  Task,
  Subject,
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
} from "../types";
import { Users } from "lucide-react";
import { getTodayString } from "../utils/storage";
import { generateSmartSuggestions } from "../utils/suggestionsEngine";
import { SmartSuggestionsWidget } from "../components/SmartSuggestionsWidget";

interface HomeDashboardProps {
  tasks: Task[];
  subjects: Subject[];
  notes: Note[];
  habits: Habit[];
  water: WaterLog;
  goals?: Goal[];
  events?: CalendarEvent[];
  academicSubjects?: AcademicSubject[];
  chapters?: AcademicChapter[];
  settings: UserSettings;
  activeStudent?: StudentProfile;
  onNavigate: (tab: ActiveTab) => void;
  onQuickAddTask: () => void;
  onQuickAddNote: () => void;
  onAddWaterGlass: () => void;
  onOpenStudentModal?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  tasks,
  subjects,
  notes,
  habits,
  water,
  goals = [],
  events = [],
  academicSubjects = [],
  chapters = [],
  settings,
  activeStudent,
  onNavigate,
  onQuickAddTask,
  onQuickAddNote,
  onAddWaterGlass,
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
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedTodayTasks = todayTasks.filter((t) => t.completed);
  const taskProgressPercent =
    todayTasks.length > 0
      ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
      : 100;

  // Habits completed today
  const habitsDoneToday = habits.filter((h) =>
    h.completedDates.includes(todayStr)
  );
  const habitProgressPercent =
    habits.length > 0
      ? Math.round((habitsDoneToday.length / habits.length) * 100)
      : 100;

  // Study progress overall
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

  // Water progress
  const waterProgressPercent = Math.min(
    100,
    Math.round((water.glasses / water.goal) * 100)
  );

  // Overall Daily Productivity Score
  const overallPercent = Math.round(
    (taskProgressPercent + habitProgressPercent + waterProgressPercent) / 3
  );

  // Generate real dynamic data-driven suggestions for active student
  const activeProfForSug: StudentProfile = activeStudent || {
    id: "default",
    name: settings.userName || "Student",
    classLevel: "Class 12",
    stream: "Commerce",
    board: "BSEB",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const smartSuggestions = generateSmartSuggestions(
    activeProfForSug,
    tasks,
    subjects,
    academicSubjects,
    chapters,
    goals,
    water,
    habits
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
                <Sparkles className="w-3.5 h-3.5" />
                <span>Garia OS Active</span>
              </div>
              {activeStudent && (
                <button
                  onClick={onOpenStudentModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Student: {activeStudent.name} ({activeStudent.stream})</span>
                  <span className="text-[10px] underline font-normal">Switch</span>
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
              {greeting}, {activeStudent?.name || settings.userName || "Student"} 👋
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Your personal operating system is loaded for {activeStudent ? `${activeStudent.classLevel} (${activeStudent.stream} - ${activeStudent.board})` : "today's goals"}.
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
        studentName={activeStudent?.name}
      />

      {/* Progress Ring / Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Overall Progress Ring */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden text-center">
          <div className="absolute top-3 left-4 text-xs font-semibold text-slate-400 uppercase tracking-wider font-heading">
            Daily Progress
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
                className="transition-all duration-1000 ease-out"
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
                <div className="absolute top-1 right-1 text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded">
                  v1.4.2
                </div>
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
                <div className="absolute top-1 right-1 text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
                  v1.4.1
                </div>
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

              <button
                onClick={onAddWaterGlass}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-pill border border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Droplet className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white font-heading">
                  Water +1
                </span>
              </button>

              <button
                onClick={() => onNavigate("abya")}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-pill border border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 hover:border-emerald-400 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-400 text-slate-900 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-emerald-300 font-heading">
                  Abya AI
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

      {/* Today's Overview Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-heading text-white">
            Today's Overview
          </h3>
          <span className="text-xs text-slate-400 font-mono">{todayStr}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Tasks */}
          <div
            onClick={() => onNavigate("tasks")}
            className="glass-card rounded-2xl p-5 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">
                Today's Tasks
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-heading text-white">
              {completedTodayTasks.length} / {todayTasks.length}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${taskProgressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
              <span>{taskProgressPercent}% done</span>
              <span className="text-emerald-400 group-hover:underline">
                View All
              </span>
            </div>
          </div>

          {/* Study Time */}
          <div
            onClick={() => onNavigate("study")}
            className="glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">
                Study Progress
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-heading text-white">
              {Math.round(totalCompletedStudyMinutes / 60)}h /{" "}
              {Math.round(totalTargetStudyMinutes / 60)}h
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${studyProgressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
              <span>{subjects.length} Active Subjects</span>
              <span className="text-cyan-400 group-hover:underline">
                Start Session
              </span>
            </div>
          </div>

          {/* Water Intake */}
          <div
            onClick={() => onNavigate("water")}
            className="glass-card rounded-2xl p-5 border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">
                Water Intake
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Droplet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-heading text-white">
              {water.glasses} / {water.goal} glasses
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-blue-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${waterProgressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
              <span>{waterProgressPercent}% Hydrated</span>
              <span className="text-blue-400 group-hover:underline">+ Add</span>
            </div>
          </div>

          {/* Habit Progress */}
          <div
            onClick={() => onNavigate("habits")}
            className="glass-card rounded-2xl p-5 border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">
                Habit Streaks
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-heading text-white">
              {habitsDoneToday.length} / {habits.length} Done
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-rose-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${habitProgressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
              <span>Max Streak: {Math.max(0, ...habits.map((h) => h.streak))} days</span>
              <span className="text-rose-400 group-hover:underline">
                View Habits
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
