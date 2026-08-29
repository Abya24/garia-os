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
  ArrowLeft,
  Filter,
  Sparkles,
  Zap,
  Activity,
  Layers,
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
import { computePerformanceIntelligence } from "../utils/studentPerformanceAnalytics";
import { PerformanceOverviewSection } from "../components/analytics/PerformanceOverviewSection";
import { SubjectAnalyticsSection } from "../components/analytics/SubjectAnalyticsSection";
import { ReadinessTrendsSection } from "../components/analytics/ReadinessTrendsSection";
import { ProductivityIntelligenceSection } from "../components/analytics/ProductivityIntelligenceSection";
import { GoalTrackingSection } from "../components/analytics/GoalTrackingSection";
import { AIInsightsSection } from "../components/analytics/AIInsightsSection";

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
  onBack?: () => void;
}

type AnalyticsSubTab =
  | "all"
  | "overview"
  | "subjects"
  | "readiness"
  | "productivity"
  | "goals"
  | "ai_insights";

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
  onBack,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AnalyticsSubTab>("all");
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedMetric, setSelectedMetric] = useState<string>("all");
  const todayStr = getTodayString();

  const handleBack = () => {
    if (activeSubTab !== "all") {
      setActiveSubTab("all");
    } else if (onBack) {
      onBack();
    }
  };

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

  // Compute comprehensive student performance intelligence (memoized for instant rendering)
  const performanceData = useMemo(() => {
    // Apply subject filter if specific subject is selected
    const filteredAcademicSubjects =
      selectedSubjectId === "all"
        ? academicSubjects
        : academicSubjects.filter((s) => s.id === selectedSubjectId);

    const filteredSubjects =
      selectedSubjectId === "all"
        ? subjects
        : subjects.filter((s) => s.id === selectedSubjectId);

    const filteredStudySessions =
      selectedSubjectId === "all"
        ? studySessions
        : studySessions.filter(
            (s) =>
              s.subjectId === selectedSubjectId ||
              academicSubjects.find((as) => as.id === selectedSubjectId)?.name === s.subjectName
          );

    return computePerformanceIntelligence({
      tasks,
      subjects: filteredSubjects,
      studySessions: filteredStudySessions,
      habits,
      focusLogs,
      water,
      goals,
      activeStudent,
      academicSubjects: filteredAcademicSubjects,
      academicChapters,
      vviTopics,
      academicRevisions,
      academicPractice,
      examTestRecords,
      qbankProgress,
    });
  }, [
    tasks,
    subjects,
    studySessions,
    habits,
    focusLogs,
    water,
    goals,
    activeStudent,
    academicSubjects,
    academicChapters,
    vviTopics,
    academicRevisions,
    academicPractice,
    examTestRecords,
    qbankProgress,
    selectedSubjectId,
  ]);

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={handleBack}
              className="p-2 rounded-2xl bg-slate-900/80 border border-white/10 hover:bg-slate-800 text-slate-300 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight flex items-center gap-2">
              <BarChart2 className="w-7 h-7 text-cyan-400" />
              <span>Student Performance Intelligence</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Actionable trends, subject readiness, study velocity, productivity windows, and AI guidance.
            </p>
          </div>
        </div>
      </div>

      {/* Universal Dropdown Navigation & Filter Ribbon */}
      <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Subject:</span>
            <select
              id="analytics-subject-dropdown"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
            >
              <option value="all" className="bg-slate-900 text-white">
                All Subjects ({academicSubjects.length || subjects.length})
              </option>
              {academicSubjects.map((sub) => (
                <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Focus:</span>
            <select
              id="analytics-metric-dropdown"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-transparent text-xs font-bold text-purple-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Metrics</option>
              <option value="productivity" className="bg-slate-900 text-white">Productivity Score</option>
              <option value="readiness" className="bg-slate-900 text-white">Exam Readiness %</option>
              <option value="time" className="bg-slate-900 text-white">Study Time Trends</option>
              <option value="goals" className="bg-slate-900 text-white">Goal Velocity</option>
            </select>
          </div>

          {/* View Tab Selector */}
          <div className="flex items-center gap-1.5 bg-indigo-600/30 px-3 py-2 rounded-2xl border border-indigo-500/40 min-h-[44px] sm:ml-auto w-full sm:w-auto">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] font-semibold text-indigo-300 shrink-0">Dashboard View:</span>
            <select
              id="analytics-view-dropdown"
              value={activeSubTab}
              onChange={(e) => setActiveSubTab(e.target.value as AnalyticsSubTab)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1 flex-1 sm:flex-none"
            >
              <option value="all" className="bg-slate-900 text-white">Full Intelligence Hub</option>
              <option value="overview" className="bg-slate-900 text-white">1. Performance Overview</option>
              <option value="subjects" className="bg-slate-900 text-white">2. Subject Analytics</option>
              <option value="readiness" className="bg-slate-900 text-white">3. Readiness Trends</option>
              <option value="productivity" className="bg-slate-900 text-white">4. Productivity Intel</option>
              <option value="goals" className="bg-slate-900 text-white">5. Goal Tracking</option>
              <option value="ai_insights" className="bg-slate-900 text-white">6. AI Insights</option>
            </select>
          </div>
        </div>

        {/* Quick Nav Chips for Mobile & Desktop */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-white/5 pt-2">
          {[
            { id: "all", label: "Full Report", icon: Activity },
            { id: "overview", label: "Overview", icon: Clock },
            { id: "subjects", label: "Subjects", icon: BookOpen },
            { id: "readiness", label: "Readiness", icon: TrendingUp },
            { id: "productivity", label: "Productivity", icon: Brain },
            { id: "goals", label: "Goals", icon: Target },
            { id: "ai_insights", label: "AI Insights", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as AnalyticsSubTab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? "bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20"
                    : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-8">
        {/* SECTION 1: Performance Overview */}
        {(activeSubTab === "all" || activeSubTab === "overview") && (
          <PerformanceOverviewSection data={performanceData} />
        )}

        {/* SECTION 2: Subject Analytics */}
        {(activeSubTab === "all" || activeSubTab === "subjects") && (
          <SubjectAnalyticsSection data={performanceData} onNavigate={onNavigate} />
        )}

        {/* SECTION 3: Readiness Trends */}
        {(activeSubTab === "all" || activeSubTab === "readiness") && (
          <ReadinessTrendsSection data={performanceData} />
        )}

        {/* SECTION 4: Productivity Intelligence */}
        {(activeSubTab === "all" || activeSubTab === "productivity") && (
          <ProductivityIntelligenceSection data={performanceData} />
        )}

        {/* SECTION 5: Goal Tracking */}
        {(activeSubTab === "all" || activeSubTab === "goals") && (
          <GoalTrackingSection data={performanceData} onNavigate={onNavigate} />
        )}

        {/* SECTION 6: AI Insights */}
        {(activeSubTab === "all" || activeSubTab === "ai_insights") && (
          <AIInsightsSection data={performanceData} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
};
