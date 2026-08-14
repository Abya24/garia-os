import React, { useState, useMemo } from "react";
import {
  BarChart2,
  CheckCircle2,
  Clock,
  Flame,
  BookOpen,
  Award,
  TrendingUp,
  Droplet,
  Target,
  Timer,
  Calendar,
  Brain,
} from "lucide-react";
import {
  Task,
  Subject,
  StudySession,
  Habit,
  FocusSessionLog,
  WaterLog,
  Goal,
  AcademicSubject,
  AcademicChapter,
  AcademicVVITopic,
  AcademicRevisionItem,
  AcademicPracticeSession,
  ExamTestRecord,
  StudentProfile,
  QuestionBankProfileProgress,
} from "../types";
import { getTodayString } from "../utils/storage";
import { generateStudentIntelligenceReport } from "../utils/studentIntelligenceEngine";
import { StudentIntelligenceDashboard } from "../components/StudentIntelligenceDashboard";

interface StatisticsPageProps {
  tasks: Task[];
  subjects: Subject[];
  studySessions: StudySession[];
  habits: Habit[];
  focusLogs: FocusSessionLog[];
  water: WaterLog;
  goals: Goal[];
  activeStudent?: StudentProfile;
  academicSubjects?: AcademicSubject[];
  academicChapters?: AcademicChapter[];
  vviTopics?: AcademicVVITopic[];
  academicRevisions?: AcademicRevisionItem[];
  academicPractice?: AcademicPracticeSession[];
  examTestRecords?: ExamTestRecord[];
  onNavigate?: (tab: string) => void;
}

type AnalyticsSubTab = "intelligence" | "productivity" | "subjects" | "habits";
type Timeframe = "daily" | "weekly" | "monthly";

export const StatisticsPage: React.FC<StatisticsPageProps> = ({
  tasks,
  subjects,
  studySessions,
  habits,
  focusLogs,
  water,
  goals,
  activeStudent,
  academicSubjects = [],
  academicChapters = [],
  vviTopics = [],
  academicRevisions = [],
  academicPractice = [],
  examTestRecords = [],
  onNavigate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AnalyticsSubTab>("intelligence");
  const [timeframe, setTimeframe] = useState<Timeframe>("daily");
  const todayStr = getTodayString();

  // Load question bank progress for student
  const profileId = activeStudent?.id || "default";
  const qbankProgress: QuestionBankProfileProgress = useMemo(() => {
    try {
      const saved = localStorage.getItem(`garia_question_progress_${profileId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      profileId,
      mcqAttempts: {},
      mcqBookmarks: [],
      practiceCompleted: [],
      practiceBookmarks: [],
      pyqCompleted: [],
      pyqBookmarks: [],
      updatedAt: Date.now(),
    };
  }, [profileId]);

  // Total logged study minutes
  const totalStudyMinutesAll = useMemo(() => {
    return Math.round(
      studySessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60
    );
  }, [studySessions]);

  // Max learning streak
  const maxStreak = useMemo(() => {
    return Math.max(1, ...habits.map((h) => h.streak));
  }, [habits]);

  // Generate Student Intelligence Report
  const intelligenceReport = useMemo(() => {
    return generateStudentIntelligenceReport(
      activeStudent,
      academicSubjects,
      academicChapters,
      vviTopics,
      academicRevisions,
      academicPractice,
      examTestRecords,
      qbankProgress,
      totalStudyMinutesAll,
      maxStreak
    );
  }, [
    activeStudent,
    academicSubjects,
    academicChapters,
    vviTopics,
    academicRevisions,
    academicPractice,
    examTestRecords,
    qbankProgress,
    totalStudyMinutesAll,
    maxStreak,
  ]);

  // Helper date calculations for timeframe filtering
  const now = new Date();
  const getDaysAgoString = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const weekStartStr = getDaysAgoString(7);
  const monthStartStr = getDaysAgoString(30);

  // Filter items by timeframe
  const isDateInTimeframe = (dateStr: string) => {
    if (timeframe === "daily") return dateStr === todayStr;
    if (timeframe === "weekly") return dateStr >= weekStartStr;
    if (timeframe === "monthly") return dateStr >= monthStartStr;
    return true;
  };

  const isTimestampInTimeframe = (timestamp: number) => {
    const cutoff =
      timeframe === "daily"
        ? Date.now() - 86400000
        : timeframe === "weekly"
        ? Date.now() - 86400000 * 7
        : Date.now() - 86400000 * 30;
    return timestamp >= cutoff;
  };

  // Filtered collections
  const filteredTasks = tasks.filter((t) => isDateInTimeframe(t.date));
  const completedTasksCount = filteredTasks.filter((t) => t.completed).length;
  const taskCompletionRate =
    filteredTasks.length > 0
      ? Math.round((completedTasksCount / filteredTasks.length) * 100)
      : 100;

  const filteredStudySessions = studySessions.filter((s) => isDateInTimeframe(s.date));
  const totalStudySeconds = filteredStudySessions.reduce(
    (acc, s) => acc + s.durationSeconds,
    0
  );
  const totalStudyHours = (totalStudySeconds / 3600).toFixed(1);

  const filteredFocusLogs = focusLogs.filter(
    (f) => f.type === "focus" && isDateInTimeframe(f.date)
  );
  const totalFocusMinutes = filteredFocusLogs.reduce(
    (acc, f) => acc + f.durationMinutes,
    0
  );

  // Habit metrics
  const habitsDoneCount = habits.filter((h) =>
    h.completedDates.some((d) => isDateInTimeframe(d))
  ).length;
  const habitCompletionRate =
    habits.length > 0 ? Math.round((habitsDoneCount / habits.length) * 100) : 100;
  const maxHabitStreak = Math.max(0, ...habits.map((h) => h.streak));

  // Goal metrics
  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);
  const avgGoalProgress =
    goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
      : 100;

  // Water metrics
  const waterProgressRate = Math.min(
    100,
    Math.round((water.glasses / water.goal) * 100)
  );

  // Overall Productivity Score calculation
  const productivityScore = Math.min(
    100,
    Math.round(
      (taskCompletionRate * 0.35) +
      (habitCompletionRate * 0.25) +
      (avgGoalProgress * 0.25) +
      (waterProgressRate * 0.15)
    )
  );

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-cyan-400" />
            <span>Student Intelligence & Analytics</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time curriculum progress, MCQ & test accuracy, weak/strong topic intelligence, and habits.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 glass-card p-1.5 rounded-2xl border border-white/10 self-start sm:self-auto overflow-x-auto">
          {[
            { id: "intelligence" as AnalyticsSubTab, label: "Intelligence Hub", icon: Brain },
            { id: "productivity" as AnalyticsSubTab, label: "Productivity Score", icon: Award },
            { id: "subjects" as AnalyticsSubTab, label: "Subject Breakdown", icon: BookOpen },
            { id: "habits" as AnalyticsSubTab, label: "Habits & Routine", icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Intelligence Hub Tab */}
      {activeSubTab === "intelligence" && (
        <StudentIntelligenceDashboard
          report={intelligenceReport}
          onNavigate={onNavigate}
        />
      )}

      {/* Productivity Score Tab */}
      {activeSubTab === "productivity" && (
        <div className="space-y-6">
          {/* Timeframe selector */}
          <div className="flex justify-end">
            <div className="flex items-center gap-1 glass-card p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setTimeframe("daily")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeframe === "daily"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe("weekly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeframe === "weekly"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeframe("monthly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeframe === "monthly"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

      {/* Top Banner Productivity Score */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-emerald-950/40 border border-cyan-500/20 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span className="capitalize">{timeframe} Productivity Overview</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Overall OS Productivity Score
          </h2>
          <p className="text-slate-300 text-sm max-w-xl">
            Calculated dynamically based on your task completion rate, goal milestones, study consistency, and daily habits.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 glass-card p-4 rounded-3xl border border-white/10">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="38"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="38"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeDasharray={240}
                strokeDashoffset={240 - (240 * productivityScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                fill="transparent"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-2xl font-black font-heading text-white">
              {productivityScore}%
            </span>
          </div>

          <div>
            <div className="text-xs text-slate-400 font-mono">Performance Grade</div>
            <div className="text-lg font-bold font-heading text-cyan-300 mt-0.5">
              {productivityScore >= 85
                ? "Excellent 🔥"
                : productivityScore >= 70
                ? "Good Progress 👍"
                : "Steady Pace 📈"}
            </div>
          </div>
        </div>
      </div>

          {/* Productivity Score Tab Details */}
          {/* 4 Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Task Completion Trend */}
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Tasks Completed</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-heading text-white">
                {completedTasksCount} / {filteredTasks.length}
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                {taskCompletionRate}% completion rate
              </p>
            </div>

            {/* Total Study Hours */}
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Study Time</span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-heading text-white">
                {totalStudyHours} hrs
              </div>
              <p className="text-[11px] text-cyan-400 mt-1 font-mono">
                {filteredStudySessions.length} session logs
              </p>
            </div>

            {/* Focus Timer Statistics */}
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Pomodoro Focus</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Timer className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-heading text-white">
                {totalFocusMinutes} mins
              </div>
              <p className="text-[11px] text-amber-400 mt-1 font-mono">
                {filteredFocusLogs.length} completed sessions
              </p>
            </div>

            {/* Goal Milestone Progress */}
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Goal Milestones</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-heading text-white">
                {completedGoals.length} / {goals.length}
              </div>
              <p className="text-[11px] text-purple-400 mt-1 font-mono">
                {avgGoalProgress}% avg milestone
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subject Study Trend Tab */}
      {activeSubTab === "subjects" && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-lg font-bold font-heading text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Subject Study Trend</span>
            </div>
            <span className="text-xs text-slate-400 font-mono capitalize">
              {timeframe} Breakdown
            </span>
          </h3>

          {subjects.length === 0 ? (
            <p className="text-xs text-slate-400">No subjects configured yet.</p>
          ) : (
            <div className="space-y-4">
              {subjects.map((subj) => {
                const subjSessions = filteredStudySessions.filter(
                  (s) => s.subjectId === subj.id
                );
                const subjSeconds = subjSessions.reduce(
                  (acc, s) => acc + s.durationSeconds,
                  0
                );
                const subjHours = (subjSeconds / 3600).toFixed(1);

                const maxSubjectSeconds = Math.max(
                  1,
                  ...subjects.map((s) => {
                    return filteredStudySessions
                      .filter((sess) => sess.subjectId === s.id)
                      .reduce((acc, sess) => acc + sess.durationSeconds, 0);
                  })
                );

                const barWidth = Math.round(
                  (subjSeconds / maxSubjectSeconds) * 100
                );

                return (
                  <div key={subj.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white font-heading">
                        {subj.name}
                      </span>
                      <span className="font-mono text-slate-400">
                        {subjHours} hrs ({subjSessions.length} sessions)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(5, barWidth)}%`,
                          backgroundColor: subj.color || "#06b6d4",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Habits & Routine Consistency Tab */}
      {activeSubTab === "habits" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <span>Habits & Routine Consistency</span>
            </h3>

            <div className="space-y-3">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="p-3.5 rounded-2xl glass-pill border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-sm text-white font-heading">
                      {habit.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {habit.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-rose-400 font-bold text-sm font-mono">
                    <Flame className="w-4 h-4 fill-rose-400" />
                    <span>{habit.streak}d streak</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Water & Hydration Stats */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <Droplet className="w-5 h-5 text-blue-400" />
              <span>Hydration Tracker</span>
            </h3>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider font-heading">
                  Today's Water Progress
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {water.glasses} / {water.goal} Glasses
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${waterProgressRate}%` }}
                />
              </div>

              <p className="text-xs text-slate-300">
                {water.glasses >= water.goal
                  ? "🎉 Great job! You have reached your daily hydration target!"
                  : `Keep going! ${water.goal - water.glasses} glasses remaining to reach optimal hydration.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
