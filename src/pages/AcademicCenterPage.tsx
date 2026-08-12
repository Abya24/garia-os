import React, { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  RotateCcw,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  TrendingUp,
  FileCheck2,
  Award,
  Layers,
  ChevronRight,
  Info,
  Clock,
  Briefcase,
  Target,
  Edit3,
  CheckSquare,
  FileText,
} from "lucide-react";
import {
  AcademicSubject,
  AcademicChapter,
  AcademicTest,
  AcademicVVITopic,
  AcademicRevisionItem,
  AcademicPracticeSession,
  AcademicRoadmapData,
  SmartStudyPlan,
  CareerProfile,
  CareerRoadmap,
  ChapterPriority,
} from "../types";
import {
  calculateChapterPriorityScore,
  generateSmartDailyPlan,
  DEFAULT_COMMERCE_SUBJECTS,
  DEFAULT_SCIENCE_SUBJECTS,
} from "../utils/academicEngine";
import { AcademicRoadmapSection } from "../components/AcademicRoadmapSection";
import { AcademicVVITopicSection } from "../components/AcademicVVITopicSection";
import { AcademicRevisionPlannerSection } from "../components/AcademicRevisionPlannerSection";
import { AcademicPracticeTrackerSection } from "../components/AcademicPracticeTrackerSection";
import { QuestionBankSection } from "../components/QuestionBankSection";
import { StudentProfile } from "../types";

interface AcademicCenterPageProps {
  careerProfile: CareerProfile;
  careerRoadmap: CareerRoadmap;
  subjects: AcademicSubject[];
  chapters: AcademicChapter[];
  tests: AcademicTest[];
  smartPlan: SmartStudyPlan | null;
  roadmap: AcademicRoadmapData;
  vviTopics: AcademicVVITopic[];
  revisions: AcademicRevisionItem[];
  practiceSessions: AcademicPracticeSession[];
  activeStudent?: StudentProfile;
  onUpdateSubjects: (subs: AcademicSubject[]) => void;
  onUpdateChapters: (chaps: AcademicChapter[]) => void;
  onUpdateTests: (tests: AcademicTest[]) => void;
  onUpdatePlan: (plan: SmartStudyPlan | null) => void;
  onUpdateVVITopics: (topics: AcademicVVITopic[]) => void;
  onUpdateRevisions: (revisions: AcademicRevisionItem[]) => void;
  onUpdatePracticeSessions: (sessions: AcademicPracticeSession[]) => void;
  onUpdateRoadmap: (roadmap: AcademicRoadmapData) => void;
  onAskAbyaWithContext: (text: string) => void;
}

export const AcademicCenterPage: React.FC<AcademicCenterPageProps> = ({
  careerProfile,
  careerRoadmap,
  subjects,
  chapters,
  tests,
  smartPlan,
  roadmap,
  vviTopics,
  revisions,
  practiceSessions,
  activeStudent,
  onUpdateSubjects,
  onUpdateChapters,
  onUpdateTests,
  onUpdatePlan,
  onUpdateVVITopics,
  onUpdateRevisions,
  onUpdatePracticeSessions,
  onUpdateRoadmap,
  onAskAbyaWithContext,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "roadmap"
    | "qbank"
    | "mcq_practice"
    | "practice_qs"
    | "pyqs"
    | "dashboard"
    | "chapters"
    | "priority"
    | "vvi"
    | "revision"
    | "practice"
    | "tests"
    | "plan"
  >("qbank");

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || "all"
  );
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals state
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubColor, setNewSubColor] = useState("emerald");

  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [newChapSubjectId, setNewChapSubjectId] = useState(subjects[0]?.id || "");
  const [newChapTitle, setNewChapTitle] = useState("");
  const [newChapPriority, setNewChapPriority] = useState<ChapterPriority>("Normal");
  const [newChapTopics, setNewChapTopics] = useState("");

  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [testSubId, setTestSubId] = useState(subjects[0]?.id || "");
  const [testName, setTestName] = useState("");
  const [testScore, setTestScore] = useState<number>(18);
  const [testMaxMarks, setTestMaxMarks] = useState<number>(20);

  const [selectedPrioExplanation, setSelectedPrioExplanation] = useState<{
    title: string;
    subject: string;
    score: number;
    breakdown: string[];
  } | null>(null);

  const [targetStudyHours, setTargetStudyHours] = useState<number>(3);

  // Target Career Required Subjects for boost logic
  const careerRequiredSubjects =
    careerRoadmap.careerTitle === "Chartered Accountant (CA)"
      ? ["Accountancy", "Economics", "Business Studies", "Mathematics"]
      : careerRoadmap.stream === "Science"
      ? ["Physics", "Chemistry", "Mathematics", "Biology"]
      : ["Accountancy", "Economics"];

  // Overall statistics
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter((c) => c.status === "Completed").length;
  const overallProgress =
    totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const weakChaptersCount = chapters.filter((c) => c.isWeak).length;
  const pyqCompletedCount = chapters.filter((c) => c.pyqStatus === "Completed").length;

  const totalTests = tests.length;
  const avgTestPct =
    totalTests > 0
      ? Math.round(
          tests.reduce((acc, t) => acc + (t.score / (t.maxMarks || 1)) * 100, 0) /
            totalTests
        )
      : 0;

  // Handlers
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    const newSub: AcademicSubject = {
      id: `sub-custom-${Date.now()}`,
      name: newSubName.trim(),
      stream: careerProfile.stream,
      color: newSubColor,
      isCustom: true,
    };
    onUpdateSubjects([...subjects, newSub]);
    setNewSubName("");
    setIsAddSubjectOpen(false);
  };

  const handleResetDefaultSubjects = () => {
    const defaultSubs =
      careerProfile.stream === "Science"
        ? DEFAULT_SCIENCE_SUBJECTS
        : DEFAULT_COMMERCE_SUBJECTS;
    onUpdateSubjects(defaultSubs);
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapTitle.trim() || !newChapSubjectId) return;
    const topicsArr = newChapTopics
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const newChap: AcademicChapter = {
      id: `ch-${Date.now()}`,
      subjectId: newChapSubjectId,
      chapterNumber: chapters.filter((c) => c.subjectId === newChapSubjectId).length + 1,
      title: newChapTitle.trim(),
      topics: topicsArr.length > 0 ? topicsArr : ["General Concepts"],
      status: "Not Started",
      priority: newChapPriority,
      isWeak: false,
      pyqStatus: "Pending",
      revisionCount: 0,
      testStatus: "Pending",
    };

    onUpdateChapters([...chapters, newChap]);
    setNewChapTitle("");
    setNewChapTopics("");
    setIsAddChapterOpen(false);
  };

  const handleToggleChapterStatus = (id: string) => {
    const updated = chapters.map((c) => {
      if (c.id === id) {
        const nextStatus: "Not Started" | "In Progress" | "Completed" =
          c.status === "Not Started"
            ? "In Progress"
            : c.status === "In Progress"
            ? "Completed"
            : "Not Started";
        return { ...c, status: nextStatus };
      }
      return c;
    });
    onUpdateChapters(updated);
  };

  const handleToggleWeak = (id: string) => {
    onUpdateChapters(
      chapters.map((c) => (c.id === id ? { ...c, isWeak: !c.isWeak } : c))
    );
  };

  const handleTogglePYQ = (id: string) => {
    onUpdateChapters(
      chapters.map((c) =>
        c.id === id
          ? {
              ...c,
              pyqStatus: c.pyqStatus === "Completed" ? "Pending" : "Completed",
            }
          : c
      )
    );
  };

  const handleIncrementRevision = (id: string) => {
    onUpdateChapters(
      chapters.map((c) =>
        c.id === id
          ? {
              ...c,
              revisionCount: (c.revisionCount + 1) % 4,
              lastRevisedAt: Date.now(),
            }
          : c
      )
    );
  };

  const handleDeleteChapter = (id: string) => {
    onUpdateChapters(chapters.filter((c) => c.id !== id));
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim() || !testSubId) return;
    const newT: AcademicTest = {
      id: `test-${Date.now()}`,
      subjectId: testSubId,
      testName: testName.trim(),
      score: testScore,
      maxMarks: testMaxMarks,
      date: new Date().toISOString().split("T")[0],
    };
    onUpdateTests([newT, ...tests]);
    setTestName("");
    setIsAddTestOpen(false);
  };

  const handleGeneratePlan = () => {
    const plan = generateSmartDailyPlan(
      targetStudyHours,
      subjects,
      chapters,
      careerRequiredSubjects
    );
    onUpdatePlan(plan);
  };

  // VVI Handlers
  const handleAddVVITopic = (topic: Omit<AcademicVVITopic, "id" | "createdAt">) => {
    const newTopic: AcademicVVITopic = {
      ...topic,
      id: `vvi-${Date.now()}`,
      createdAt: Date.now(),
    };
    onUpdateVVITopics([newTopic, ...vviTopics]);
  };

  const handleUpdateVVITopic = (id: string, updates: Partial<AcademicVVITopic>) => {
    onUpdateVVITopics(
      vviTopics.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleDeleteVVITopic = (id: string) => {
    onUpdateVVITopics(vviTopics.filter((t) => t.id !== id));
  };

  // Revision Handlers
  const handleAddRevision = (revision: Omit<AcademicRevisionItem, "id" | "createdAt">) => {
    const newRev: AcademicRevisionItem = {
      ...revision,
      id: `rev-${Date.now()}`,
      createdAt: Date.now(),
    };
    onUpdateRevisions([newRev, ...revisions]);
  };

  const handleToggleRevisionComplete = (id: string) => {
    onUpdateRevisions(
      revisions.map((r) => {
        if (r.id === id) {
          const nextCompleted = !r.completed;
          return {
            ...r,
            completed: nextCompleted,
            completedAt: nextCompleted ? Date.now() : undefined,
          };
        }
        return r;
      })
    );
  };

  const handleDeleteRevision = (id: string) => {
    onUpdateRevisions(revisions.filter((r) => r.id !== id));
  };

  // Practice Session Handlers
  const handleAddPracticeSession = (session: Omit<AcademicPracticeSession, "id" | "createdAt">) => {
    const newSess: AcademicPracticeSession = {
      ...session,
      id: `prac-${Date.now()}`,
      createdAt: Date.now(),
    };
    onUpdatePracticeSessions([newSess, ...practiceSessions]);
  };

  const handleDeletePracticeSession = (id: string) => {
    onUpdatePracticeSessions(practiceSessions.filter((p) => p.id !== id));
  };

  // Filtered chapter list
  const filteredChapters = chapters.filter((c) => {
    if (selectedSubjectId !== "all" && c.subjectId !== selectedSubjectId) return false;
    if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Garia OS v1.4.1 Academic Center</span>
              <span className="bg-emerald-400/20 px-1.5 py-0.5 rounded text-[10px]">
                {careerProfile.stream} Stream
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Smart Academic Intelligence
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Seamlessly linking your Class 12 board preparations with your target career path ({careerRoadmap.careerTitle || "General Higher Studies"}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                onAskAbyaWithContext(
                  `Analyze my current Class 12 ${careerProfile.stream} academic status. I have ${weakChaptersCount} weak chapters and my overall chapter progress is ${overallProgress}%. What study focus should I prioritize today?`
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg hover:shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              Ask Abya AI Advice
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Class 12 Syllabus</span>
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">
              {completedChapters} <span className="text-xs text-slate-400 font-normal">/ {totalChapters} Chaps</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Weak Topics</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {weakChaptersCount} <span className="text-xs text-slate-400 font-normal">Flagged Areas</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Needs priority attention</div>
          </div>

          <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>PYQs Solved</span>
              <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-cyan-400 font-mono">
              {pyqCompletedCount} <span className="text-xs text-slate-400 font-normal">/ {totalChapters}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Board PYQs Completed</div>
          </div>

          <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Test Performance</span>
              <Award className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-300 font-mono">
              {avgTestPct}% <span className="text-xs text-slate-400 font-normal">Average</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{totalTests} Tests Recorded</div>
          </div>
        </div>
      </div>

      {/* Primary Academic Center Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none">
        {[
          { id: "qbank", label: "📚 Question Bank (V2.6)", icon: GraduationCap },
          { id: "mcq_practice", label: "MCQ Practice", icon: CheckSquare },
          { id: "practice_qs", label: "Practice Questions", icon: FileText },
          { id: "pyqs", label: "Chapter PYQs", icon: Award },
          { id: "roadmap", label: "Academic Roadmap", icon: GraduationCap },
          { id: "dashboard", label: "Subject Dashboard", icon: Layers },
          { id: "chapters", label: "Chapter & Topics", icon: BookOpen },
          { id: "vvi", label: "🔥 VVI Topics", icon: Flame },
          { id: "revision", label: "Revision Planner", icon: RotateCcw },
          { id: "tests", label: "Test Performance", icon: TrendingUp },
          { id: "plan", label: "Daily Study Generator", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* QUESTION BANK SECTION */}
      {(activeTab === "qbank" ||
        activeTab === "mcq_practice" ||
        activeTab === "practice_qs" ||
        activeTab === "pyqs") && (
        <QuestionBankSection
          activeStudent={
            activeStudent || {
              id: "profile-1",
              name: "Student",
              avatar: "👨‍🎓",
              classLevel: "Class 10",
              targetExam: "Board Exam",
              strengths: [],
              weaknesses: [],
              createdAt: Date.now(),
            }
          }
          subjects={subjects}
          chapters={chapters}
          initialSubTab={
            activeTab === "mcq_practice"
              ? "mcq"
              : activeTab === "practice_qs"
              ? "practice"
              : activeTab === "pyqs"
              ? "pyq"
              : "home"
          }
          onAskAbyaWithContext={onAskAbyaWithContext}
        />
      )}

      {/* TAB 0: ACADEMIC ROADMAP */}
      {activeTab === "roadmap" && (
        <AcademicRoadmapSection
          roadmap={roadmap}
          onNavigateToTab={(t) => setActiveTab(t as any)}
        />
      )}

      {/* TAB: VVI TOPICS */}
      {activeTab === "vvi" && (
        <AcademicVVITopicSection
          vviTopics={vviTopics}
          subjects={subjects}
          chapters={chapters}
          onAddVVITopic={handleAddVVITopic}
          onUpdateVVITopic={handleUpdateVVITopic}
          onDeleteVVITopic={handleDeleteVVITopic}
        />
      )}

      {/* TAB: REVISION PLANNER */}
      {activeTab === "revision" && (
        <AcademicRevisionPlannerSection
          revisions={revisions}
          subjects={subjects}
          chapters={chapters}
          onAddRevision={handleAddRevision}
          onToggleRevisionComplete={handleToggleRevisionComplete}
          onDeleteRevision={handleDeleteRevision}
        />
      )}

      {/* TAB: PRACTICE TRACKER */}
      {activeTab === "practice" && (
        <AcademicPracticeTrackerSection
          practiceSessions={practiceSessions}
          subjects={subjects}
          chapters={chapters}
          onAddPracticeSession={handleAddPracticeSession}
          onDeletePracticeSession={handleDeletePracticeSession}
        />
      )}

      {/* TAB 1: SUBJECT DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{careerProfile.stream} Stream Subjects</span>
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                  {subjects.length} Subjects Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Customizable subject list with chapter progress, revision, and test tracking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddSubjectOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Subject
              </button>
              <button
                onClick={handleResetDefaultSubjects}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-medium transition-all"
                title="Reset to official Class 12 Stream default subject list"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Stream Defaults
              </button>
            </div>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => {
              const subChaps = chapters.filter((c) => c.subjectId === sub.id);
              const totalCh = subChaps.length;
              const completedCh = subChaps.filter((c) => c.status === "Completed").length;
              const pct = totalCh > 0 ? Math.round((completedCh / totalCh) * 100) : 0;
              const weakCount = subChaps.filter((c) => c.isWeak).length;

              const subTests = tests.filter((t) => t.subjectId === sub.id);
              const subAvgTest =
                subTests.length > 0
                  ? Math.round(
                      subTests.reduce((acc, t) => acc + (t.score / (t.maxMarks || 1)) * 100, 0) /
                        subTests.length
                    )
                  : null;

              const isCareerBoosted = careerRequiredSubjects.some((req) =>
                sub.name.toLowerCase().includes(req.toLowerCase())
              );

              return (
                <div
                  key={sub.id}
                  className="group relative bg-slate-900/80 rounded-2xl p-5 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">
                            {sub.name}
                          </h3>
                        </div>
                        {isCareerBoosted && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                            <Briefcase className="w-3 h-3" />
                            Target Career Aligned
                          </div>
                        )}
                      </div>

                      {sub.isCustom && (
                        <button
                          onClick={() =>
                            onUpdateSubjects(subjects.filter((s) => s.id !== sub.id))
                          }
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remove custom subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Chapter Syllabus</span>
                        <span className="text-white font-bold">{pct}% Completed</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                        <span>{completedCh} completed</span>
                        <span>{totalCh - completedCh} remaining</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
                    <div className="bg-slate-800/50 rounded-xl p-2.5 border border-white/5">
                      <div className="text-[10px] text-slate-400 font-mono">Weak Areas</div>
                      <div className="font-bold font-mono text-amber-400 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        {weakCount} Chapters
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-2.5 border border-white/5">
                      <div className="text-[10px] text-slate-400 font-mono">Avg Test Score</div>
                      <div className="font-bold font-mono text-purple-300 mt-0.5">
                        {subAvgTest !== null ? `${subAvgTest}%` : "No tests yet"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        setActiveTab("chapters");
                      }}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 transition-colors flex items-center justify-center gap-1.5"
                    >
                      Manage Chapters ({totalCh})
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CHAPTER & TOPIC TRACKER */}
      {activeTab === "chapters" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Subject filter */}
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-slate-900 text-white text-xs font-semibold rounded-xl px-3.5 py-2 border border-white/10 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Subjects ({chapters.length} Chaps)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Priority filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-900 text-slate-300 text-xs font-medium rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Priorities</option>
                <option value="VVI">VVI Only</option>
                <option value="Important">Important Only</option>
                <option value="Normal">Normal</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 text-slate-300 text-xs font-medium rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button
              onClick={() => setIsAddChapterOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Chapter / Topic
            </button>
          </div>

          {/* Disclaimer Banner */}
          <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-white/10 text-xs text-slate-400 flex items-center gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Disclaimer: Priority tags (VVI / Important) reflect strategic study emphasis based on board pattern weightage and weak area triage. They do not claim guaranteed official board exam appearances.
            </span>
          </div>

          {/* Chapters List */}
          <div className="space-y-3">
            {filteredChapters.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-white/5 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm text-slate-300 font-medium">No chapters match current filter.</div>
                <p className="text-xs text-slate-500">
                  Select a different subject filter or add a new chapter.
                </p>
              </div>
            ) : (
              filteredChapters.map((chap) => {
                const sub = subjects.find((s) => s.id === chap.subjectId);
                const subName = sub ? sub.name : "Subject";
                const prioObj = calculateChapterPriorityScore(
                  chap,
                  subName,
                  careerRequiredSubjects
                );

                return (
                  <div
                    key={chap.id}
                    className={`bg-slate-900/80 rounded-2xl p-4 md:p-5 border transition-all duration-200 ${
                      chap.isWeak
                        ? "border-amber-500/40 bg-amber-950/10"
                        : chap.status === "Completed"
                        ? "border-emerald-500/20 bg-slate-900/60"
                        : "border-white/10 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/10">
                            {subName}
                          </span>

                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-md text-[10px] ${
                              chap.priority === "VVI"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : chap.priority === "Important"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {chap.priority}
                          </span>

                          <button
                            onClick={() =>
                              setSelectedPrioExplanation({
                                title: chap.title,
                                subject: subName,
                                score: prioObj.score,
                                breakdown: prioObj.scoreBreakdown,
                              })
                            }
                            className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md ${
                              prioObj.priorityLevel.includes("High")
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : prioObj.priorityLevel.includes("Medium")
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            <span>{prioObj.priorityLevel}</span>
                            <Info className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-bold text-white text-base flex items-center gap-2">
                            <span>Ch {chap.chapterNumber}: {chap.title}</span>
                          </h4>

                          {chap.topics && chap.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {chap.topics.map((t, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-white/5"
                                >
                                  • {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {chap.notes && (
                            <p className="text-xs text-slate-400 italic pt-1">
                              Note: "{chap.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Action Controls */}
                      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 self-stretch md:self-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                        {/* Status Button */}
                        <button
                          onClick={() => handleToggleChapterStatus(chap.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            chap.status === "Completed"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : chap.status === "In Progress"
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              : "bg-slate-800 text-slate-400 border-white/10 hover:text-white"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{chap.status}</span>
                        </button>

                        {/* Weakness Toggle */}
                        <button
                          onClick={() => handleToggleWeak(chap.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1 ${
                            chap.isWeak
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-slate-800 text-slate-400 border-white/10 hover:text-amber-300"
                          }`}
                          title="Toggle Weak Topic Flag"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{chap.isWeak ? "Weak" : "Normal"}</span>
                        </button>

                        {/* PYQ Toggle */}
                        <button
                          onClick={() => handleTogglePYQ(chap.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1 ${
                            chap.pyqStatus === "Completed"
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              : "bg-slate-800 text-slate-400 border-white/10 hover:text-cyan-300"
                          }`}
                          title="Toggle PYQ Completion"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>PYQ: {chap.pyqStatus}</span>
                        </button>

                        {/* Revision Counter */}
                        <button
                          onClick={() => handleIncrementRevision(chap.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-mono transition-all flex items-center gap-1"
                          title="Click to increment revision count"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                          <span>Rev: {chap.revisionCount}x</span>
                        </button>

                        {/* Delete Chapter */}
                        <button
                          onClick={() => handleDeleteChapter(chap.id)}
                          className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SMART PRIORITIES MATRIX */}
      {activeTab === "priority" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/10 space-y-2">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              Smart Study Priority Matrix
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every chapter is scored automatically by analyzing board exam weightage (VVI/Important), flagged weak topic areas, pending revisions, incomplete PYQs, and alignment with your target career path ({careerRoadmap.careerTitle}).
            </p>
          </div>

          {/* High Priority Group */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-rose-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4" />
              🔥 High Priority Topics (Action Needed)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chapters
                .map((c) => {
                  const subName =
                    subjects.find((s) => s.id === c.subjectId)?.name || "Subject";
                  const res = calculateChapterPriorityScore(
                    c,
                    subName,
                    careerRequiredSubjects
                  );
                  return { chapter: c, subjectName: subName, res };
                })
                .filter((item) => item.res.priorityLevel.includes("High"))
                .map(({ chapter, subjectName, res }) => (
                  <div
                    key={chapter.id}
                    className="bg-slate-900/90 rounded-2xl p-4 border border-rose-500/30 hover:border-rose-500/60 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {subjectName}
                        </span>
                        <h5 className="font-bold text-white text-sm mt-1">
                          Ch {chapter.chapterNumber}: {chapter.title}
                        </h5>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-rose-400">
                          Score: {res.score}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-slate-950/50 rounded-xl p-2.5 text-[11px] text-slate-300 font-mono">
                      {res.scoreBreakdown.map((b, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() =>
                          onAskAbyaWithContext(
                            `Help me study this High Priority chapter in ${subjectName}: "Ch ${chapter.chapterNumber}: ${chapter.title}". Give me key concepts to memorize and typical board questions.`
                          )
                        }
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Ask Abya for Study Strategy
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Medium Priority Group */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h4 className="text-sm font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" />
              ⚡ Medium Priority Topics
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chapters
                .map((c) => {
                  const subName =
                    subjects.find((s) => s.id === c.subjectId)?.name || "Subject";
                  const res = calculateChapterPriorityScore(
                    c,
                    subName,
                    careerRequiredSubjects
                  );
                  return { chapter: c, subjectName: subName, res };
                })
                .filter((item) => item.res.priorityLevel.includes("Medium"))
                .map(({ chapter, subjectName, res }) => (
                  <div
                    key={chapter.id}
                    className="bg-slate-900/80 rounded-2xl p-4 border border-amber-500/20 hover:border-amber-500/40 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {subjectName}
                        </span>
                        <h5 className="font-bold text-white text-sm mt-1">
                          Ch {chapter.chapterNumber}: {chapter.title}
                        </h5>
                      </div>
                      <span className="text-xs font-bold font-mono text-amber-400">
                        Score: {res.score}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      {res.scoreBreakdown.join(" • ")}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REVISION & PYQ HUB */}
      {activeTab === "revision" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/10 space-y-2">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-cyan-400" />
              Spaced Repetition & Board PYQ Tracker
            </h3>
            <p className="text-xs text-slate-400">
              Track 1st, 2nd, and 3rd revision passes for long-term retention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="text-xs text-slate-400 font-mono">1st Revision Due</div>
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {chapters.filter((c) => c.revisionCount === 0).length} Chapters
              </div>
              <p className="text-[11px] text-slate-500">First recall pass pending</p>
            </div>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="text-xs text-slate-400 font-mono">2nd / 3rd Revision Done</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {chapters.filter((c) => c.revisionCount >= 2).length} Chapters
              </div>
              <p className="text-[11px] text-slate-500">Solid recall memory formed</p>
            </div>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="text-xs text-slate-400 font-mono">PYQs Solved</div>
              <div className="text-2xl font-black text-purple-300 font-mono">
                {chapters.filter((c) => c.pyqStatus === "Completed").length} / {chapters.length}
              </div>
              <p className="text-[11px] text-slate-500">Board exam style questions</p>
            </div>
          </div>

          {/* List of Chapters for Revision */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
              Subject Revision Table
            </h4>

            <div className="divide-y divide-white/10 bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
              {chapters.map((ch) => {
                const subName =
                  subjects.find((s) => s.id === ch.subjectId)?.name || "Subject";
                return (
                  <div
                    key={ch.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {subName}
                        </span>
                        <h5 className="font-bold text-white text-sm">
                          Ch {ch.chapterNumber}: {ch.title}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-400">
                        Revision passes: {ch.revisionCount}x • PYQ: {ch.pyqStatus}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleIncrementRevision(ch.id)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all"
                      >
                        + Mark Revision Pass
                      </button>
                      <button
                        onClick={() => handleTogglePYQ(ch.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          ch.pyqStatus === "Completed"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-slate-800 text-slate-300 border-white/10"
                        }`}
                      >
                        PYQ {ch.pyqStatus}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TEST PERFORMANCE TRACKER */}
      {activeTab === "tests" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Board Prep Test Tracker
              </h3>
              <p className="text-xs text-slate-400">
                Record unit test, mock test, and pre-board scores to track improvement.
              </p>
            </div>

            <button
              onClick={() => setIsAddTestOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Record Test Result
            </button>
          </div>

          {tests.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-white/5 space-y-3">
              <Award className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm text-slate-300 font-medium">No test scores recorded yet.</div>
              <button
                onClick={() => setIsAddTestOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium border border-white/10"
              >
                Record First Test
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((t) => {
                const subName =
                  subjects.find((s) => s.id === t.subjectId)?.name || "Subject";
                const pct = Math.round((t.score / (t.maxMarks || 1)) * 100);

                return (
                  <div
                    key={t.id}
                    className="bg-slate-900/80 rounded-2xl p-4 border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {subName}
                        </span>
                        <h4 className="font-bold text-white text-base mt-1">{t.testName}</h4>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{t.date}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black text-white font-mono">
                          {t.score} <span className="text-xs text-slate-400 font-normal">/ {t.maxMarks}</span>
                        </div>
                        <div
                          className={`text-xs font-bold font-mono ${
                            pct >= 80
                              ? "text-emerald-400"
                              : pct >= 60
                              ? "text-cyan-400"
                              : "text-amber-400"
                          }`}
                        >
                          {pct}% Score
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 80 ? "bg-emerald-400" : pct >= 60 ? "bg-cyan-400" : "bg-amber-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SMART DAILY STUDY GENERATOR */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  Smart Daily Study Plan Generator
                </h3>
                <p className="text-xs text-slate-400">
                  Generates a balanced time-table prioritizing weak chapters, pending PYQs, and target career required subjects.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-xs text-slate-300 font-mono">Target Hours:</span>
                  <select
                    value={targetStudyHours}
                    onChange={(e) => setTargetStudyHours(Number(e.target.value))}
                    className="bg-slate-900 text-emerald-400 font-bold text-xs rounded-lg px-2 py-1 border border-white/10"
                  >
                    <option value={2}>2 Hours</option>
                    <option value={3}>3 Hours</option>
                    <option value={4}>4 Hours</option>
                    <option value={6}>6 Hours</option>
                  </select>
                </div>

                <button
                  onClick={handleGeneratePlan}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Generate Plan Now
                </button>
              </div>
            </div>

            {smartPlan && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Generated for: {smartPlan.generatedDate}</span>
                  <span>Target: {smartPlan.targetHours} Hours</span>
                </div>

                <div className="space-y-2">
                  {smartPlan.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                        slot.activityType === "Break"
                          ? "bg-slate-900/40 border-white/5 text-slate-400"
                          : "bg-slate-900/80 border-white/10 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-emerald-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-white/10">
                          {slot.timeSlot}
                        </span>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {slot.subjectName}: {slot.chapterTitle}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {slot.reasoning}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {slot.activityType}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-rose-300 font-mono text-[10px]">
                          {slot.priorityLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD SUBJECT */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Custom Subject</h3>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono">Subject Name</label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Applied Mathematics / Physical Education"
                  className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CHAPTER */}
      {isAddChapterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Chapter / Topic</h3>
            <form onSubmit={handleAddChapter} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono">Subject</label>
                <select
                  value={newChapSubjectId}
                  onChange={(e) => setNewChapSubjectId(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono">Chapter Title</label>
                <input
                  type="text"
                  value={newChapTitle}
                  onChange={(e) => setNewChapTitle(e.target.value)}
                  placeholder="e.g. Ratio Analysis & Financial Ratios"
                  className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono">Topics (Comma-separated)</label>
                <input
                  type="text"
                  value={newChapTopics}
                  onChange={(e) => setNewChapTopics(e.target.value)}
                  placeholder="e.g. Liquidity Ratios, Solvency Ratios, Profitability"
                  className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono">Priority Tag</label>
                <select
                  value={newChapPriority}
                  onChange={(e) => setNewChapPriority(e.target.value as ChapterPriority)}
                  className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="VVI">Very Very Important (VVI)</option>
                  <option value="Important">Important</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddChapterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Save Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD TEST RESULT */}
      {isAddTestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Record Board Prep Test Result</h3>
            <form onSubmit={handleAddTest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono">Subject</label>
                <select
                  value={testSubId}
                  onChange={(e) => setTestSubId(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono">Test / Exam Name</label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g. Unit Test 1 or Mid-Term Mock"
                  className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-mono">Score Obtained</label>
                  <input
                    type="number"
                    value={testScore}
                    onChange={(e) => setTestScore(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-mono">Max Marks</label>
                  <input
                    type="number"
                    value={testMaxMarks}
                    onChange={(e) => setTestMaxMarks(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTestOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-500 text-slate-950 font-bold text-xs"
                >
                  Save Test Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPLANATION MODAL FOR PRIORITY SCORE */}
      {selectedPrioExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedPrioExplanation.subject}
                </span>
                <h3 className="font-bold text-white text-base">
                  {selectedPrioExplanation.title}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-500/20 text-rose-300">
                Score: {selectedPrioExplanation.score}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                Transparent Priority Scoring Factors:
              </label>
              <div className="space-y-1.5 bg-slate-950/60 rounded-xl p-3 text-xs text-slate-300 font-mono">
                {selectedPrioExplanation.breakdown.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedPrioExplanation(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
