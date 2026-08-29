import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  BookOpen,
  Plus,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sliders,
  Target,
  GraduationCap,
  ChevronRight,
  Zap,
  Info,
  CheckSquare,
  FileText,
  Compass,
  ListOrdered,
  X,
  Edit2,
  Trash2,
  ArrowLeft,
  Search,
  Filter,
  Layers,
} from "lucide-react";
import {
  ExamProfile,
  ExamMilestone,
  ExamMockTest,
  ExamDailyPlan,
  AcademicSubject,
  AcademicChapter,
  AcademicTest,
  CareerProfile,
  CareerRoadmap,
  AcademicVVITopic,
  AcademicRevisionItem,
  AcademicPracticeSession,
  ExamTestRecord,
  StudentProfile,
} from "../types";
import {
  calculateExamCountdown,
  calculateExamReadiness,
  generatePreparationQueue,
  generateSubjectReadinessList,
  generateExamRevisionQueue,
  detectWeaknessTopics,
  generateExamStudyPlan,
} from "../utils/examEngine";
import { generateExamIntelligenceReport } from "../utils/examIntelligenceEngine";
import { ExamTestLoggerModal } from "../components/ExamTestLoggerModal";
import { PerformanceTrendChart } from "../components/PerformanceTrendChart";
import { SubjectPerformanceAnalysisSection } from "../components/SubjectPerformanceAnalysisSection";
import { WeakAreaDetectionSection } from "../components/WeakAreaDetectionSection";
import { SubjectComparisonView } from "../components/SubjectComparisonView";
import { ExamReadinessScoreCard } from "../components/ExamReadinessScoreCard";
import { CalendarSyncDropdown } from "../components/CalendarSyncDropdown";
import {
  exportExamMilestoneIcs,
  exportAllMilestonesIcs,
  exportFullExamScheduleIcs,
  exportStudyPlanIcs,
  exportSubjectExamDatesIcs,
} from "../utils/icsExport";
import { Download } from "lucide-react";

interface ExamCenterPageProps {
  examProfile: ExamProfile;
  examMilestones: ExamMilestone[];
  examMockTests: ExamMockTest[];
  examPlan: ExamDailyPlan | null;
  academicSubjects: AcademicSubject[];
  academicChapters: AcademicChapter[];
  academicTests: AcademicTest[];
  careerProfile: CareerProfile;
  careerRoadmap: CareerRoadmap | null;
  vviTopics?: AcademicVVITopic[];
  revisions?: AcademicRevisionItem[];
  practiceSessions?: AcademicPracticeSession[];
  examTestRecords?: ExamTestRecord[];
  onSaveExamTestRecord?: (test: Omit<ExamTestRecord, "id" | "createdAt">) => void;
  onDeleteExamTestRecord?: (testId: string) => void;
  onUpdateExamProfile: (profile: ExamProfile) => void;
  onUpdateExamMilestones: (milestones: ExamMilestone[]) => void;
  onUpdateExamMockTests: (tests: ExamMockTest[]) => void;
  onUpdateExamPlan: (plan: ExamDailyPlan | null) => void;
  onUpdateChapters: (chapters: AcademicChapter[]) => void;
  onAskAbyaWithContext: (contextText: string) => void;
  onNavigate: (tab: any) => void;
  onBack?: () => void;
}

export const ExamCenterPage: React.FC<ExamCenterPageProps> = ({
  examProfile,
  examMilestones,
  examMockTests,
  examPlan,
  academicSubjects,
  academicChapters,
  academicTests,
  careerProfile,
  careerRoadmap,
  vviTopics = [],
  revisions = [],
  practiceSessions = [],
  examTestRecords = [],
  onSaveExamTestRecord,
  onDeleteExamTestRecord,
  onUpdateExamProfile,
  onUpdateExamMilestones,
  onUpdateExamMockTests,
  onUpdateExamPlan,
  onUpdateChapters,
  onAskAbyaWithContext,
  onNavigate,
  onBack,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "syllabus" | "queue" | "revision" | "tests" | "plan" | "milestones"
  >("overview");

  const handleBack = () => {
    if (activeSubTab !== "overview") {
      setActiveSubTab("overview");
    } else if (onBack) {
      onBack();
    }
  };

  // Modals & Forms
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showRecordLoggerModal, setShowRecordLoggerModal] = useState(false);
  const [editingTestRecord, setEditingTestRecord] = useState<ExamTestRecord | null>(null);
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<string | null>(null);

  // Universal Dropdown System Filters (Rule 1)
  const [selectedExam, setSelectedExam] = useState<string>(examProfile.examName || "Class 12 Board Exams");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("30d");
  const [examSearchQuery, setExamSearchQuery] = useState<string>("");

  // Filtered chapters based on selected subject
  const currentExamChapters = useMemo(() => {
    if (selectedSubjectId === "all") return academicChapters;
    return academicChapters.filter((ch) => ch.subjectId === selectedSubjectId);
  }, [academicChapters, selectedSubjectId]);

  // Profile Form state
  const [profileForm, setProfileForm] = useState<ExamProfile>(examProfile);

  // Active Student Profile stub for engine
  const activeStudentProfile: StudentProfile = {
    id: "active",
    name: "Active Student",
    classLevel: examProfile.classLevel || "Class 12",
    stream: careerProfile.stream || "Commerce",
    board: examProfile.board || "BSEB",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // V1.9 Exam Intelligence Engine Report
  const v19Report = generateExamIntelligenceReport(
    activeStudentProfile,
    examProfile,
    examTestRecords,
    academicSubjects,
    academicChapters,
    vviTopics,
    revisions,
    practiceSessions,
    careerProfile
  );

  // Test Form state
  const [testForm, setTestForm] = useState({
    testName: "",
    board: examProfile.board as string,
    subjectId: academicSubjects[0]?.id || "",
    chapterTitle: "",
    testDate: new Date().toISOString().split("T")[0],
    maxMarks: 100,
    marksObtained: 75,
    timeTakenMinutes: 60,
    testType: "Mock Exam" as ExamMockTest["testType"],
    notes: "",
  });

  // Calculations from Exam Engine
  const countdown = calculateExamCountdown(examProfile);
  const readiness = calculateExamReadiness(
    examProfile,
    academicSubjects,
    academicChapters,
    [...academicTests, ...examMockTests]
  );
  const prepQueue = generatePreparationQueue(
    academicSubjects,
    academicChapters,
    [...academicTests, ...examMockTests],
    careerRoadmap
  );
  const subjectReadiness = generateSubjectReadinessList(
    academicSubjects,
    academicChapters,
    [...academicTests, ...examMockTests]
  );
  const revisionQueue = generateExamRevisionQueue(academicSubjects, academicChapters);
  const weaknessTopics = detectWeaknessTopics(
    academicSubjects,
    academicChapters,
    [...academicTests, ...examMockTests]
  );

  // Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateExamProfile(profileForm);
    setShowProfileModal(false);
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = academicSubjects.find((s) => s.id === testForm.subjectId);
    const newTest: ExamMockTest = {
      id: `mt-${Date.now()}`,
      testName: testForm.testName || `${subj?.name || "Subject"} Test`,
      board: testForm.board,
      subjectId: testForm.subjectId,
      subjectName: subj?.name || "Subject",
      chapterTitle: testForm.chapterTitle,
      testDate: testForm.testDate,
      maxMarks: Number(testForm.maxMarks) || 100,
      marksObtained: Number(testForm.marksObtained) || 0,
      timeTakenMinutes: Number(testForm.timeTakenMinutes) || 0,
      testType: testForm.testType,
      notes: testForm.notes,
    };

    const updatedTests = [newTest, ...examMockTests];
    onUpdateExamMockTests(updatedTests);
    setShowTestModal(false);
    setTestForm({
      testName: "",
      board: examProfile.board,
      subjectId: academicSubjects[0]?.id || "",
      chapterTitle: "",
      testDate: new Date().toISOString().split("T")[0],
      maxMarks: 100,
      marksObtained: 75,
      timeTakenMinutes: 60,
      testType: "Mock Exam",
      notes: "",
    });
  };

  const handleDeleteTest = (testId: string) => {
    onUpdateExamMockTests(examMockTests.filter((t) => t.id !== testId));
  };

  const handleToggleMilestone = (id: string) => {
    const updated = examMilestones.map((m) =>
      m.id === id ? { ...m, completed: !m.completed, completedAt: !m.completed ? Date.now() : undefined } : m
    );
    onUpdateExamMilestones(updated);
  };

  const handleMarkChapterRevised = (chapterId: string) => {
    const updatedChapters = academicChapters.map((ch) => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          revisionCount: (ch.revisionCount || 0) + 1,
          lastRevisedAt: Date.now(),
          nextRevisionDue: Date.now() + 86400000 * 7,
        };
      }
      return ch;
    });
    onUpdateChapters(updatedChapters);
  };

  const handleGenerateStudyPlan = () => {
    const plan = generateExamStudyPlan(
      examProfile,
      academicSubjects,
      academicChapters,
      [...academicTests, ...examMockTests]
    );
    onUpdateExamPlan(plan);
  };

  const handleAskAbya = (promptText: string) => {
    const urgent = prepQueue
      .slice(0, 3)
      .map((q) => `${q.subjectName}: ${q.chapterTitle}`)
      .join(", ");
    const weak = weaknessTopics.map((w) => `${w.subjectName}: ${w.chapterTitle}`).join(", ");

    const contextStr = `Exam Context: Board: ${examProfile.board}, Class: ${examProfile.classLevel}, Stream: ${examProfile.stream}, Exam Name: "${examProfile.examName}", Days Remaining: ${countdown.daysRemaining}, Readiness Score: ${readiness.overallScore}%, Status: ${readiness.status}, Urgent Priority Chapters: "${urgent}", Weak Topics: "${weak}", Target Career Goal: "${careerProfile.targetCareer || "General"}". Request: ${promptText}`;

    onAskAbyaWithContext(contextStr);
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "🟢 On Track":
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">🟢 On Track</span>;
      case "🟡 Needs Attention":
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">🟡 Needs Attention</span>;
      case "🟠 Behind Schedule":
        return <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold border border-orange-500/30">🟠 Behind Schedule</span>;
      case "🔴 Critical":
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">🔴 Critical</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">🏁 Exam In Progress</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl relative overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-purple-950/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wide">
                  Garia OS v1.4.2
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Exam Intelligence Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-7 h-7 text-cyan-400" />
                <span>Exam Intelligence Center</span>
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Connected Board Prep: Board Profile • Smart Readiness Score • Urgent Prep Queue • Mock Test Analytics • Revision Scheduler
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportFullExamScheduleIcs(examProfile, academicSubjects, examMilestones)}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
              title="Export complete exam milestones & subject papers as .ics file"
            >
              <Download className="w-4 h-4" />
              <span>Export Schedule (.ics)</span>
            </button>
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-4 py-2.5 rounded-2xl glass-pill border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-lg"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              Board Settings
            </button>
            <button
              onClick={() => handleAskAbya("Analyze my overall exam readiness and tell me what to revise first today.")}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Ask Abya AI
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Core Summary Cards: Countdown, Readiness Score, Career & Stream Alignment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Exam Countdown */}
        <div className="glass-card p-5 rounded-3xl border border-cyan-500/30 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider font-mono">
              <Calendar className="w-4 h-4" />
              Board Exam Countdown
            </div>
            {getStatusBadge(readiness.status)}
          </div>

          <div className="my-2">
            <div className="text-4xl font-extrabold text-white font-heading tracking-tight">
              {countdown.daysRemaining}{" "}
              <span className="text-base font-normal text-slate-400">Days Remaining</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {examProfile.examName} ({examProfile.board}) — Starts {countdown.formattedStartDate}
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Class 12 • {examProfile.stream}</span>
            <div className="flex items-center gap-2">
              <CalendarSyncDropdown
                event={{
                  id: `exam-kickoff-${examProfile.board}`,
                  title: `[Exam Kickoff] ${examProfile.examName} (${examProfile.board})`,
                  description: `Target Goal: ${examProfile.targetScorePercent || 90}% score target.\nClass 12 ${examProfile.stream} Board Exams Begin!`,
                  date: examProfile.examStartDate || examProfile.startDate,
                  time: "09:00",
                  category: "EXAM",
                }}
                buttonLabel="Sync .ics"
                variant="minimal"
              />
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-cyan-400 hover:underline flex items-center gap-1 ml-1"
              >
                Edit <Edit2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Exam Readiness Score */}
        <div className="glass-card p-5 rounded-3xl border border-emerald-500/30 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider font-mono">
              <Award className="w-4 h-4" />
              Exam Readiness Score
            </div>
            <span className="text-xs text-slate-400 font-mono">0 - 100 Scale</span>
          </div>

          <div className="my-2 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-emerald-400 font-heading">
              {readiness.overallScore}%
            </span>
            <div className="flex-1">
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${readiness.overallScore}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            *Measures syllabus completion, revision passes, PYQs, and test average. Not a prediction of marks.
          </p>
        </div>

        {/* Card 3: Career & Academic Connection */}
        <div className="glass-card p-5 rounded-3xl border border-purple-500/30 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider font-mono">
              <Compass className="w-4 h-4" />
              Career & Stream Alignment
            </div>
            <button
              onClick={() => onNavigate("career")}
              className="text-xs text-purple-300 hover:underline font-mono"
            >
              Career Center →
            </button>
          </div>

          <div className="my-2">
            <h4 className="text-base font-bold text-white font-heading">
              Target Goal: {careerProfile.targetCareer || "Select Goal in Career Center"}
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Stream: <strong className="text-purple-300">{careerProfile.stream}</strong> • Active Subjects:{" "}
              <strong className="text-white">{academicSubjects.length} Core Subjects</strong>
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Syllabus: {readiness.syllabusCompletion}% Done</span>
            <span>PYQs: {readiness.pyqScore}% Solved</span>
          </div>
        </div>
      </div>

      {/* Universal Dropdown Navigation Ribbon (Rule 1 & Rule 2) */}
      <div className="glass-card p-4 rounded-3xl border border-cyan-500/30 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Exam Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-semibold text-slate-400">Exam:</span>
            <select
              id="exam-name-dropdown"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="Class 12 Board Exams" className="bg-slate-900 text-white">Class 12 Board Exams ({examProfile.board})</option>
              <option value="Class 10 Board Exams" className="bg-slate-900 text-white">Class 10 Board Exams</option>
              <option value="JEE Main / Advanced" className="bg-slate-900 text-white">JEE Main & Advanced</option>
              <option value="NEET UG" className="bg-slate-900 text-white">NEET UG</option>
              <option value="CUET UG" className="bg-slate-900 text-white">CUET UG</option>
              <option value="CA Foundation" className="bg-slate-900 text-white">CA Foundation</option>
              <option value="NDA / Defence" className="bg-slate-900 text-white">NDA / Defence Exam</option>
            </select>
          </div>

          {/* Subject Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-semibold text-slate-400">Subject:</span>
            <select
              id="exam-subject-dropdown"
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedChapterId("all");
              }}
              className="bg-transparent text-xs font-bold text-purple-300 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="all" className="bg-slate-900 text-white">All Subjects ({academicSubjects.length})</option>
              {academicSubjects.map((sub) => (
                <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <span className="text-[11px] font-semibold text-slate-400">Chapter:</span>
            <select
              id="exam-chapter-dropdown"
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="all" className="bg-slate-900 text-white">All Chapters ({currentExamChapters.length})</option>
              {currentExamChapters.map((ch) => (
                <option key={ch.id} value={ch.id} className="bg-slate-900 text-white">
                  {ch.chapterNumber ? `Ch ${ch.chapterNumber}: ` : ""}{ch.title}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Dropdown (Rule 1) */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-slate-400">Time:</span>
            <select
              id="exam-timerange-dropdown"
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="7d" className="bg-slate-900 text-white">Next 7 Days</option>
              <option value="30d" className="bg-slate-900 text-white">Next 30 Days</option>
              <option value="60d" className="bg-slate-900 text-white">Next 60 Days</option>
              <option value="90d" className="bg-slate-900 text-white">Next 90 Days</option>
              <option value="all" className="bg-slate-900 text-white">Full Exam Span</option>
            </select>
          </div>

          {/* View / Sub-Tab Dropdown (Converted from >5 Tabs into Standard Dropdown) */}
          <div className="flex items-center gap-1.5 bg-cyan-500/20 px-3 py-2 rounded-2xl border border-cyan-500/40 min-h-[44px] ml-auto">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-semibold text-cyan-300">View:</span>
            <select
              id="exam-view-dropdown"
              value={activeSubTab}
              onChange={(e) => setActiveSubTab(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="overview" className="bg-slate-900 text-white">Dashboard</option>
              <option value="syllabus" className="bg-slate-900 text-white">Syllabus Planner</option>
              <option value="queue" className="bg-slate-900 text-white">Prep Queue ({prepQueue.filter((q) => q.score >= 50).length})</option>
              <option value="revision" className="bg-slate-900 text-white">Revision Scheduler ({revisionQueue.length})</option>
              <option value="tests" className="bg-slate-900 text-white">Mock Tests & Analytics</option>
              <option value="plan" className="bg-slate-900 text-white">Exam Study Plan</option>
              <option value="milestones" className="bg-slate-900 text-white">Milestones</option>
            </select>
          </div>
        </div>

        {/* Breadcrumbs & Quick Search Row */}
        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 flex-wrap font-mono text-[11px]">
            <span className="text-cyan-400 font-bold">{selectedExam}</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-purple-300 font-semibold">
              {selectedSubjectId === "all" ? "All Subjects" : academicSubjects.find((s) => s.id === selectedSubjectId)?.name || "Subject"}
            </span>
            {selectedChapterId !== "all" && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className="text-amber-300 truncate max-w-[140px]">
                  {currentExamChapters.find((c) => c.id === selectedChapterId)?.title || "Chapter"}
                </span>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-emerald-300 font-semibold">{selectedTimeRange} range</span>
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search exam syllabus, topics..."
              value={examSearchQuery}
              onChange={(e) => setExamSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 text-xs text-white placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500 min-h-[38px]"
            />
          </div>
        </div>
      </div>

      {/* ==========================================
          SUB TAB 1: OVERVIEW DASHBOARD
      ========================================== */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* V1.9 Overall Exam Readiness Card */}
          <ExamReadinessScoreCard
            report={v19Report}
            onNavigate={(tab) => onNavigate(tab)}
          />

          {/* V1.9 Weak Area Detection & Priority Queue */}
          <WeakAreaDetectionSection
            weakAreas={v19Report.weakAreas}
            onNavigate={(tab) => onNavigate(tab)}
          />

          {/* V1.9 Subject Performance Analysis Section */}
          <SubjectPerformanceAnalysisSection
            subjectAnalyses={v19Report.subjectAnalyses}
          />

          {/* Readiness Score Breakdown Detailed Card */}
          <div className="glass-card p-6 rounded-3xl border border-white/10">
            <h3 className="text-lg font-bold text-white font-heading mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              Exam Readiness Breakdown ({readiness.overallScore}/100)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Syllabus Pass", score: readiness.syllabusCompletion, color: "from-cyan-500 to-blue-500" },
                { label: "Revision Pass", score: readiness.revisionScore, color: "from-emerald-500 to-teal-500" },
                { label: "PYQs Solved", score: readiness.pyqScore, color: "from-purple-500 to-indigo-500" },
                { label: "Test Performance", score: readiness.testScore, color: "from-amber-500 to-yellow-500" },
                { label: "Weakness Resolved", score: readiness.weaknessScore, color: "from-rose-500 to-pink-500" },
                { label: "Proximity Pace", score: readiness.proximityScore, color: "from-indigo-500 to-cyan-500" },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 font-mono block mb-1">{item.label}</span>
                  <div className="text-xl font-extrabold text-white font-heading mb-1">{item.score}%</div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full bg-gradient-to-r ${item.color}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Preparation Queue Preview & Weakness Detection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Urgent Prep Queue */}
            <div className="glass-card p-5 rounded-3xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Top Priority Topics Queue
                </h3>
                <button
                  onClick={() => setActiveSubTab("queue")}
                  className="text-xs text-cyan-400 hover:underline font-mono flex items-center gap-1"
                >
                  View All ({prepQueue.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {prepQueue.slice(0, 4).map((item) => (
                  <div
                    key={item.chapterId}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.priority}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{item.subjectName}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1">{item.chapterTitle}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Why: {item.explanations.join(" • ")}</p>
                    </div>

                    <button
                      onClick={() =>
                        handleAskAbya(`How should I study ${item.subjectName} - ${item.chapterTitle} for my exam?`)
                      }
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold shrink-0 flex items-center gap-1 self-start sm:self-center"
                    >
                      <Sparkles className="w-3 h-3" /> Study Tip
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Weakness Detector */}
            <div className="glass-card p-5 rounded-3xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Topics Needing Attention ({weaknessTopics.length})
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Supportive Focus</span>
              </div>

              {weaknessTopics.length === 0 ? (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">No severe weak topics detected!</p>
                  <p className="text-xs text-slate-400 mt-1">Keep up your regular revision schedule.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {weaknessTopics.slice(0, 4).map((w, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className="text-xs font-bold text-rose-300 font-mono">{w.subjectName}</span>
                        <h4 className="text-sm font-semibold text-white">{w.chapterTitle}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Reason: {w.reason}</p>
                        <p className="text-[11px] text-emerald-300 font-mono mt-1">💡 {w.recommendation}</p>
                      </div>

                      <button
                        onClick={() => handleMarkChapterRevised(w.chapterId)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0 self-center"
                      >
                        Mark Revised
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subject Readiness Grid */}
          <div className="glass-card p-6 rounded-3xl border border-white/10">
            <h3 className="text-base font-bold text-white font-heading mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
              Subject Readiness Scores
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectReadiness.map((subj) => (
                <div
                  key={subj.subjectId}
                  onClick={() => setSelectedSubjectDetail(subj.subjectId)}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white font-heading">{subj.subjectName}</span>
                    <span className="text-sm font-mono font-bold text-cyan-400">{subj.readinessScore}%</span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                      style={{ width: `${subj.readinessScore}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400 font-mono border-t border-white/10 pt-2">
                    <div>Syllabus: {subj.syllabusPct}%</div>
                    <div>PYQ: {subj.pyqPct}%</div>
                    <div>Rev: {subj.revPct}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB TAB 2: SYLLABUS PLANNER
      ========================================== */}
      {activeSubTab === "syllabus" && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Exam Syllabus Planner
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Connected directly with Academic Center. Track board chapter completion, VVI topics, PYQs, and test status.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
              Labeling: Student / AI suggested priority
            </div>
          </div>

          <div className="space-y-4">
            {academicSubjects.map((subj) => {
              const chapters = academicChapters.filter((c) => c.subjectId === subj.id);
              const completed = chapters.filter((c) => c.status === "Completed").length;
              const pct = chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;

              return (
                <div key={subj.id} className="glass-card p-5 rounded-3xl border border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-10 rounded-full"
                        style={{ backgroundColor: subj.color || "#06b6d4" }}
                      />
                      <div>
                        <h4 className="text-base font-bold text-white font-heading">{subj.name}</h4>
                        <span className="text-xs text-slate-400 font-mono">
                          {completed} of {chapters.length} chapters completed ({pct}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden border border-white/10">
                      <div
                        className="h-2 rounded-full bg-cyan-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {chapters.map((chap) => (
                      <div
                        key={chap.id}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const nextStatus =
                                chap.status === "Completed"
                                  ? "Not Started"
                                  : chap.status === "Not Started"
                                  ? "In Progress"
                                  : "Completed";
                              const updated = academicChapters.map((c) =>
                                c.id === chap.id ? { ...c, status: nextStatus } : c
                              );
                              onUpdateChapters(updated);
                            }}
                            className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                              chap.status === "Completed"
                                ? "bg-emerald-500 border-emerald-400 text-slate-950"
                                : chap.status === "In Progress"
                                ? "bg-cyan-500/30 border-cyan-400 text-cyan-200"
                                : "border-slate-600 hover:border-slate-400"
                            }`}
                          >
                            {chap.status === "Completed" && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>

                          <div>
                            <span className="font-bold text-white font-heading text-sm">
                              Ch {chap.chapterNumber}: {chap.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span
                                className={`px-2 py-0.2 rounded text-[10px] font-bold font-mono ${
                                  chap.priority === "VVI"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                }`}
                              >
                                {chap.priority}
                              </span>
                              {chap.isWeak && (
                                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                                  Weak Topic
                                </span>
                              )}
                              <span className="text-slate-400 font-mono">
                                PYQ: {chap.pyqStatus === "Completed" ? "✅ Completed" : "⏳ Pending"}
                              </span>
                              <span className="text-slate-400 font-mono">
                                Revised: {chap.revisionCount || 0} times
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <button
                            onClick={() => {
                              const updated = academicChapters.map((c) =>
                                c.id === chap.id
                                  ? {
                                      ...c,
                                      pyqStatus: c.pyqStatus === "Completed" ? "Pending" : "Completed",
                                    }
                                  : c
                              );
                              onUpdateChapters(updated);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono border transition-all ${
                              chap.pyqStatus === "Completed"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-white/5 text-slate-400 border-white/10 hover:border-cyan-500/30"
                            }`}
                          >
                            PYQ {chap.pyqStatus === "Completed" ? "Done" : "Pending"}
                          </button>

                          <button
                            onClick={() => handleMarkChapterRevised(chap.id)}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-mono bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30"
                          >
                            + Revise
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          SUB TAB 3: EXAM PREPARATION QUEUE
      ========================================== */}
      {activeSubTab === "queue" && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl border border-white/10">
            <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Intelligent Exam Preparation Queue
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Chapters ranked automatically by exam proximity, VVI weightage, weakness flag, PYQ status, revision overdue, and test performance.
            </p>
          </div>

          <div className="space-y-3">
            {prepQueue.map((item, index) => (
              <div
                key={item.chapterId}
                className="glass-card p-4 rounded-3xl border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold font-mono text-cyan-400 text-sm shrink-0">
                    #{index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.priority}
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-bold">{item.subjectName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Rank Score: {item.score}</span>
                    </div>

                    <h4 className="text-base font-bold text-white font-heading mt-1">{item.chapterTitle}</h4>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] text-slate-300">
                      <span className="font-mono text-slate-400">Triggers:</span>
                      {item.explanations.map((exp, eIdx) => (
                        <span key={eIdx} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleMarkChapterRevised(item.chapterId)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold border border-emerald-500/30"
                  >
                    Mark Revised
                  </button>
                  <button
                    onClick={() =>
                      handleAskAbya(
                        `Give me 3 important exam practice questions and memory tips for ${item.subjectName} - ${item.chapterTitle}.`
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold border border-cyan-500/30 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Ask Abya
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          SUB TAB 4: REVISION SCHEDULER
      ========================================== */}
      {activeSubTab === "revision" && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-cyan-400" />
                Smart Revision Scheduler
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Calculates memory decay based on revision count and timestamps. One-click update for dates and cycles.
              </p>
            </div>
          </div>

          {revisionQueue.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-3xl border border-white/10">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white font-heading">No Revisions Overdue!</h4>
              <p className="text-xs text-slate-400 mt-1">All studied chapters are up to date with revision passes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {revisionQueue.map((item) => (
                <div
                  key={item.chapterId}
                  className="glass-card p-4 rounded-3xl border border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-cyan-400 font-mono">{item.subjectName}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                          item.status === "🚨 Overdue"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : item.status === "🔥 Due"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white font-heading">{item.chapterTitle}</h4>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-2">
                      <span>Pass Count: {item.revisionCount}</span>
                      <span>•</span>
                      <span>
                        Last Revised:{" "}
                        {item.lastRevisedAt
                          ? new Date(item.lastRevisedAt).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Suggest 20-min active recall</span>
                    <button
                      onClick={() => handleMarkChapterRevised(item.chapterId)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Revised
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          SUB TAB 5: MOCK TESTS & ANALYTICS
      ========================================== */}
      {activeSubTab === "tests" && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                V1.9 Exam Intelligence & Performance Center
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Record test scores, track question accuracy, view score progression trends, and compare subject matrices.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingTestRecord(null);
                setShowRecordLoggerModal(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus className="w-4 h-4" /> Record Test Performance
            </button>
          </div>

          {/* Performance Trend Chart */}
          <PerformanceTrendChart tests={examTestRecords} />

          {/* Side-by-Side Subject Matrix Comparison */}
          <SubjectComparisonView subjectAnalyses={v19Report.subjectAnalyses} />

          {/* Recorded Exam Performance Log Table */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white font-heading">
                  Recorded Exam & Quiz Logs ({examTestRecords.length})
                </h4>
                <p className="text-xs text-slate-400">
                  Detailed question breakdown, accuracy, attempt rate & notes
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingTestRecord(null);
                  setShowRecordLoggerModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
              >
                + Log New Test
              </button>
            </div>

            {examTestRecords.length === 0 ? (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 space-y-3">
                <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-white">No exam data yet.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Record your first exam or mock test score to generate performance trends and weak area intelligence.
                </p>
                <button
                  onClick={() => {
                    setEditingTestRecord(null);
                    setShowRecordLoggerModal(true);
                  }}
                  className="mt-2 px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg"
                >
                  Record First Test
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {examTestRecords.map((test) => {
                  const pct = test.maxMarks > 0 ? Math.round((test.marksObtained / test.maxMarks) * 100) : 0;
                  const attempted = (test.correctAnswers || 0) + (test.incorrectAnswers || 0);
                  const accuracy = attempted > 0 ? Math.round(((test.correctAnswers || 0) / attempted) * 100) : 0;

                  return (
                    <div
                      key={test.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {test.subjectName}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{test.date}</span>
                          <span className="text-[11px] text-slate-500">
                            Time: {test.timeTakenMinutes || 0} mins
                          </span>
                        </div>

                        <h5 className="text-base font-bold text-white">{test.testName}</h5>

                        <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap pt-0.5">
                          <span>
                            Correct: <strong className="text-emerald-400">{test.correctAnswers || 0}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Incorrect: <strong className="text-rose-400">{test.incorrectAnswers || 0}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Unattempted: <strong className="text-amber-400">{test.unattemptedQuestions || 0}</strong>
                          </span>
                        </div>

                        {test.notes && (
                          <p className="text-xs text-slate-400 italic mt-1 bg-slate-900/60 p-2 rounded-xl border border-white/5">
                            "{test.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-5 shrink-0 self-end md:self-center">
                        <div className="text-right">
                          <div className="text-xl font-black text-white">
                            {test.marksObtained} / {test.maxMarks}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold mt-0.5">
                            <span className="text-emerald-400">{pct}% Score</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-cyan-400">{accuracy}% Acc</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingTestRecord(test);
                              setShowRecordLoggerModal(true);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteExamTestRecord && onDeleteExamTestRecord(test.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          SUB TAB 6: EXAM STUDY PLAN GENERATOR
      ========================================== */}
      {activeSubTab === "plan" && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Exam Study Plan Generator
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Generates a balanced timetable incorporating concepts, PYQs, revision, mock practice, and break buffers.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {examPlan && examPlan.slots && examPlan.slots.length > 0 && (
                <button
                  onClick={() => exportStudyPlanIcs(examPlan.slots)}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs shadow-md flex items-center gap-2 transition-all"
                  title="Export today's study slots to .ics calendar"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Timetable (.ics)</span>
                </button>
              )}

              <button
                onClick={handleGenerateStudyPlan}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Regenerate Daily Plan
              </button>
            </div>
          </div>

          {!examPlan ? (
            <div className="glass-card p-12 text-center rounded-3xl border border-white/10">
              <Calendar className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white font-heading">No Plan Generated Today</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Generate an intelligent exam timetable tailored to your available daily study hours ({examProfile.dailyStudyHours} hours).
              </p>
              <button
                onClick={handleGenerateStudyPlan}
                className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-xs font-bold shadow-lg"
              >
                Generate Exam Timetable
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {examPlan.slots.map((slot) => (
                <div
                  key={slot.id}
                  className="glass-card p-4 rounded-3xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="px-3 py-1.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold shrink-0">
                      {slot.timeSlot}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                          {slot.activity}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{slot.subjectName}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white font-heading mt-1">{slot.chapterTitle}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{slot.explanation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className="text-xs text-slate-400 font-mono">{slot.priority}</span>
                    <CalendarSyncDropdown
                      event={{
                        id: `slot-${slot.id}`,
                        title: `[Study] ${slot.subjectName}: ${slot.chapterTitle}`,
                        description: `Activity: ${slot.activity}\nPriority: ${slot.priority}\nTime: ${slot.timeSlot}\nNotes: ${slot.explanation}`,
                        date: new Date().toISOString().split("T")[0],
                        category: "STUDY",
                      }}
                      variant="icon"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          SUB TAB 7: MILESTONES
      ========================================== */}
      {activeSubTab === "milestones" && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-cyan-400" />
                Exam Preparation Milestones
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Track major structural achievements across your preparation journey.
              </p>
            </div>

            {examMilestones.length > 0 && (
              <button
                onClick={() => exportAllMilestonesIcs(examMilestones, examProfile.examName)}
                className="px-3.5 py-2 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                title="Export all milestones to .ics file"
              >
                <Download className="w-4 h-4" />
                <span>Export All Milestones (.ics)</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {examMilestones.map((m) => (
              <div
                key={m.id}
                onClick={() => handleToggleMilestone(m.id)}
                className={`glass-card p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  m.completed
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "border-white/10 hover:border-cyan-500/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                      m.completed
                        ? "bg-emerald-500 border-emerald-400 text-slate-950"
                        : "border-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {m.completed && <CheckCircle2 className="w-4 h-4" />}
                  </div>

                  <div>
                    <h4
                      className={`text-sm font-bold font-heading ${
                        m.completed ? "text-emerald-300 line-through" : "text-white"
                      }`}
                    >
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-slate-500">{m.category}</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <CalendarSyncDropdown
                      event={{
                        id: `milestone-${m.id}`,
                        title: `[Exam Milestone] ${m.title}`,
                        description: `Category: ${m.category}\nStatus: ${m.completed ? "Completed" : "Pending"}\n${m.description}`,
                        date: m.targetDate || examProfile.examStartDate || examProfile.startDate,
                        category: m.category,
                      }}
                      buttonLabel="Sync .ics"
                      variant="pill"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROFILE SETTINGS MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white font-heading">Board & Exam Profile Settings</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Select Board</label>
                <select
                  value={profileForm.board}
                  onChange={(e) => setProfileForm({ ...profileForm, board: e.target.value as any })}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="BSEB">BSEB (Bihar School Examination Board)</option>
                  <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                  <option value="Other">Other Board</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Exam Name</label>
                <input
                  type="text"
                  value={profileForm.examName}
                  onChange={(e) => setProfileForm({ ...profileForm, examName: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Exam Start Date</label>
                  <input
                    type="date"
                    value={profileForm.startDate}
                    onChange={(e) => setProfileForm({ ...profileForm, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Exam End Date (Optional)</label>
                  <input
                    type="date"
                    value={profileForm.endDate || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Daily Study Target (Hours)</label>
                <input
                  type="number"
                  min="2"
                  max="14"
                  value={profileForm.dailyStudyHours}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, dailyStudyHours: Number(e.target.value) || 5 })
                  }
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-slate-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD TEST MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white font-heading">Record Mock Test Result</h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTest} className="space-y-4 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Test Title</label>
                <input
                  type="text"
                  placeholder="e.g. Accountancy Unit Test 1"
                  value={testForm.testName}
                  onChange={(e) => setTestForm({ ...testForm, testName: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Subject</label>
                  <select
                    value={testForm.subjectId}
                    onChange={(e) => setTestForm({ ...testForm, subjectId: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {academicSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Test Type</label>
                  <select
                    value={testForm.testType}
                    onChange={(e) => setTestForm({ ...testForm, testType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Mock Exam">Mock Exam</option>
                    <option value="PYQ Practice">PYQ Practice</option>
                    <option value="School Test">School Test</option>
                    <option value="Custom Test">Custom Test</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Marks Obtained</label>
                  <input
                    type="number"
                    value={testForm.marksObtained}
                    onChange={(e) => setTestForm({ ...testForm, marksObtained: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Maximum Marks</label>
                  <input
                    type="number"
                    value={testForm.maxMarks}
                    onChange={(e) => setTestForm({ ...testForm, maxMarks: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-slate-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
                >
                  Save Test Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* V1.9 Detailed Exam Test Logger Modal */}
      <ExamTestLoggerModal
        isOpen={showRecordLoggerModal}
        subjects={academicSubjects}
        onClose={() => {
          setShowRecordLoggerModal(false);
          setEditingTestRecord(null);
        }}
        onSaveTest={(testData) => {
          if (onSaveExamTestRecord) {
            onSaveExamTestRecord(testData);
          }
        }}
        editingTest={editingTestRecord}
      />
    </div>
  );
};
