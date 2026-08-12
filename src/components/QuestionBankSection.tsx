import React, { useState, useMemo } from "react";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Bookmark,
  Sparkles,
  Filter,
  Search,
  Award,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  FileText,
  ListFilter,
  BarChart3,
  Eye,
  EyeOff,
  ShieldCheck,
  Layers,
  GraduationCap,
  BookOpen,
  Zap,
} from "lucide-react";
import {
  StudentProfile,
  AcademicSubject,
  AcademicChapter,
  TopicMCQ,
  ChapterPYQ,
  PracticeQuestion,
  QuestionDifficulty,
  QuestionType,
  MCQAttemptRecord,
} from "../types";
import {
  SEED_MCQS,
  SEED_PYQS,
  SEED_PRACTICE_QUESTIONS,
  loadQuestionBankProgress,
  recordMCQAttempt,
  toggleQuestionBookmark,
  toggleItemCompleted,
  calculateRealQuestionCounts,
} from "../utils/questionBankEngine";

interface QuestionBankSectionProps {
  activeStudent: StudentProfile;
  subjects: AcademicSubject[];
  chapters: AcademicChapter[];
  initialSubTab?: "home" | "mcq" | "practice" | "pyq" | "progress";
  onAskAbyaWithContext: (prompt: string) => void;
}

export const QuestionBankSection: React.FC<QuestionBankSectionProps> = ({
  activeStudent,
  subjects,
  chapters,
  initialSubTab = "home",
  onAskAbyaWithContext,
}) => {
  const profileId = activeStudent.id;
  const defaultClass = activeStudent.classLevel || "Class 10";

  // Navigation Sub-Tabs
  const [subTab, setSubTab] = useState<"home" | "mcq" | "practice" | "pyq" | "progress">(
    initialSubTab
  );

  // Class / Subject / Chapter / Topic Selectors
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [selectedChapter, setSelectedChapter] = useState<string>("ALL");
  const [selectedTopic, setSelectedTopic] = useState<string>("ALL");

  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // "ALL" | "COMPLETED" | "INCOMPLETE" | "BOOKMARKED"
  const [searchQuery, setSearchQuery] = useState<string>("");

  // MCQ Practice State
  const [quantityChoice, setQuantityChoice] = useState<number>(10);
  const [mcqIndex, setMcqIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [retryMode, setRetryMode] = useState<boolean>(false);

  // Solution Visibility Map for Practice & PYQ
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  // Progress State from localStorage
  const [progress, setProgress] = useState(() => loadQuestionBankProgress(profileId));

  const refreshProgress = () => {
    setProgress(loadQuestionBankProgress(profileId));
  };

  // ----------------------------------------------------
  // Dynamic Subjects / Chapters / Topics based on selectors
  // ----------------------------------------------------
  const availableClasses = ["Class 10", "Class 11", "Class 12"];

  // Unique Subjects present in Question Data or active profile
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach((s) => set.add(s.name));
    SEED_MCQS.forEach((m) => {
      if (m.classLevel.toLowerCase() === selectedClass.toLowerCase()) set.add(m.subjectName);
    });
    SEED_PYQS.forEach((p) => {
      if (p.classLevel.toLowerCase() === selectedClass.toLowerCase()) set.add(p.subjectName);
    });
    SEED_PRACTICE_QUESTIONS.forEach((pr) => {
      if (pr.classLevel.toLowerCase() === selectedClass.toLowerCase()) set.add(pr.subjectName);
    });
    return Array.from(set);
  }, [selectedClass, subjects]);

  // Unique Chapters
  const availableChapters = useMemo(() => {
    const set = new Set<string>();
    chapters.forEach((c) => {
      const sub = subjects.find((s) => s.id === c.subjectId);
      if (!selectedSubject || selectedSubject === "ALL" || (sub && sub.name === selectedSubject)) {
        set.add(c.title);
      }
    });
    SEED_MCQS.forEach((m) => {
      if (
        m.classLevel.toLowerCase() === selectedClass.toLowerCase() &&
        (selectedSubject === "ALL" || m.subjectName.toLowerCase() === selectedSubject.toLowerCase())
      ) {
        set.add(m.chapterTitle);
      }
    });
    SEED_PYQS.forEach((p) => {
      if (
        p.classLevel.toLowerCase() === selectedClass.toLowerCase() &&
        (selectedSubject === "ALL" || p.subjectName.toLowerCase() === selectedSubject.toLowerCase())
      ) {
        set.add(p.chapterTitle);
      }
    });
    SEED_PRACTICE_QUESTIONS.forEach((pr) => {
      if (
        pr.classLevel.toLowerCase() === selectedClass.toLowerCase() &&
        (selectedSubject === "ALL" || pr.subjectName.toLowerCase() === selectedSubject.toLowerCase())
      ) {
        set.add(pr.chapterTitle);
      }
    });
    return Array.from(set);
  }, [selectedClass, selectedSubject, chapters, subjects]);

  // Unique Topics
  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    chapters.forEach((c) => {
      if (selectedChapter === "ALL" || c.title === selectedChapter) {
        c.topics.forEach((t) => set.add(t));
      }
    });
    SEED_MCQS.forEach((m) => {
      if (
        m.classLevel.toLowerCase() === selectedClass.toLowerCase() &&
        (selectedSubject === "ALL" || m.subjectName === selectedSubject) &&
        (selectedChapter === "ALL" || m.chapterTitle === selectedChapter)
      ) {
        set.add(m.topicName);
      }
    });
    SEED_PRACTICE_QUESTIONS.forEach((pr) => {
      if (
        pr.classLevel.toLowerCase() === selectedClass.toLowerCase() &&
        (selectedSubject === "ALL" || pr.subjectName === selectedSubject) &&
        (selectedChapter === "ALL" || pr.chapterTitle === selectedChapter) &&
        pr.topicName
      ) {
        set.add(pr.topicName);
      }
    });
    return Array.from(set);
  }, [selectedClass, selectedSubject, selectedChapter, chapters]);

  // PYQ Available Years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    SEED_PYQS.forEach((p) => years.add(p.year));
    return Array.from(years).sort((a, b) => b - a);
  }, []);

  // Calculate Real Counts
  const counts = useMemo(() => {
    return calculateRealQuestionCounts(
      selectedClass,
      selectedSubject,
      selectedChapter,
      selectedTopic
    );
  }, [selectedClass, selectedSubject, selectedChapter, selectedTopic]);

  // ----------------------------------------------------
  // FILTERED MCQS
  // ----------------------------------------------------
  const filteredMCQs = useMemo(() => {
    let list = SEED_MCQS.filter(
      (m) => m.classLevel.toLowerCase() === selectedClass.toLowerCase()
    );

    if (selectedSubject !== "ALL") {
      list = list.filter((m) => m.subjectName.toLowerCase() === selectedSubject.toLowerCase());
    }
    if (selectedChapter !== "ALL") {
      list = list.filter((m) => m.chapterTitle.toLowerCase() === selectedChapter.toLowerCase());
    }
    if (selectedTopic !== "ALL") {
      list = list.filter((m) => m.topicName.toLowerCase() === selectedTopic.toLowerCase());
    }
    if (difficultyFilter !== "ALL") {
      list = list.filter((m) => m.difficulty.toLowerCase() === difficultyFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.questionText.toLowerCase().includes(q) ||
          m.topicName.toLowerCase().includes(q) ||
          m.chapterTitle.toLowerCase().includes(q)
      );
    }
    if (retryMode) {
      list = list.filter((m) => {
        const att = progress.mcqAttempts[m.id];
        return att && !att.isCorrect;
      });
    }
    if (statusFilter === "BOOKMARKED") {
      list = list.filter((m) => progress.mcqBookmarks.includes(m.id));
    }
    return list;
  }, [
    selectedClass,
    selectedSubject,
    selectedChapter,
    selectedTopic,
    difficultyFilter,
    searchQuery,
    retryMode,
    statusFilter,
    progress,
  ]);

  // Active MCQ Set sliced by quantityChoice
  const activeMCQSet = useMemo(() => {
    if (quantityChoice === 0) return filteredMCQs;
    return filteredMCQs.slice(0, quantityChoice);
  }, [filteredMCQs, quantityChoice]);

  const currentMCQ = activeMCQSet[mcqIndex] || null;

  // ----------------------------------------------------
  // FILTERED PYQS
  // ----------------------------------------------------
  const filteredPYQs = useMemo(() => {
    let list = SEED_PYQS.filter(
      (p) => p.classLevel.toLowerCase() === selectedClass.toLowerCase()
    );

    if (selectedSubject !== "ALL") {
      list = list.filter((p) => p.subjectName.toLowerCase() === selectedSubject.toLowerCase());
    }
    if (selectedChapter !== "ALL") {
      list = list.filter((p) => p.chapterTitle.toLowerCase() === selectedChapter.toLowerCase());
    }
    if (yearFilter !== "ALL") {
      list = list.filter((p) => p.year === parseInt(yearFilter, 10));
    }
    if (difficultyFilter !== "ALL") {
      list = list.filter((p) => p.difficulty.toLowerCase() === difficultyFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.questionText.toLowerCase().includes(q) ||
          p.chapterTitle.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "BOOKMARKED") {
      list = list.filter((p) => progress.pyqBookmarks.includes(p.id));
    } else if (statusFilter === "COMPLETED") {
      list = list.filter((p) => progress.pyqCompleted.includes(p.id));
    } else if (statusFilter === "INCOMPLETE") {
      list = list.filter((p) => !progress.pyqCompleted.includes(p.id));
    }
    return list;
  }, [
    selectedClass,
    selectedSubject,
    selectedChapter,
    yearFilter,
    difficultyFilter,
    searchQuery,
    statusFilter,
    progress,
  ]);

  // ----------------------------------------------------
  // FILTERED PRACTICE QUESTIONS
  // ----------------------------------------------------
  const filteredPractice = useMemo(() => {
    let list = SEED_PRACTICE_QUESTIONS.filter(
      (pr) => pr.classLevel.toLowerCase() === selectedClass.toLowerCase()
    );

    if (selectedSubject !== "ALL") {
      list = list.filter((pr) => pr.subjectName.toLowerCase() === selectedSubject.toLowerCase());
    }
    if (selectedChapter !== "ALL") {
      list = list.filter((pr) => pr.chapterTitle.toLowerCase() === selectedChapter.toLowerCase());
    }
    if (selectedTopic !== "ALL") {
      list = list.filter(
        (pr) => pr.topicName && pr.topicName.toLowerCase() === selectedTopic.toLowerCase()
      );
    }
    if (difficultyFilter !== "ALL") {
      list = list.filter((pr) => pr.difficulty.toLowerCase() === difficultyFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (pr) =>
          pr.questionText.toLowerCase().includes(q) ||
          pr.chapterTitle.toLowerCase().includes(q) ||
          (pr.topicName && pr.topicName.toLowerCase().includes(q))
      );
    }
    if (statusFilter === "BOOKMARKED") {
      list = list.filter((pr) => progress.practiceBookmarks.includes(pr.id));
    } else if (statusFilter === "COMPLETED") {
      list = list.filter((pr) => progress.practiceCompleted.includes(pr.id));
    } else if (statusFilter === "INCOMPLETE") {
      list = list.filter((pr) => !progress.practiceCompleted.includes(pr.id));
    }
    return list;
  }, [
    selectedClass,
    selectedSubject,
    selectedChapter,
    selectedTopic,
    difficultyFilter,
    searchQuery,
    statusFilter,
    progress,
  ]);

  // Handlers for MCQ
  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitMCQ = () => {
    if (!currentMCQ || selectedOption === null || isSubmitted) return;
    setIsSubmitted(true);
    const isCorrect = selectedOption === currentMCQ.correctOptionIndex;
    recordMCQAttempt(profileId, currentMCQ.id, selectedOption, isCorrect);
    refreshProgress();
  };

  const handleNextMCQ = () => {
    if (mcqIndex < activeMCQSet.length - 1) {
      setMcqIndex(mcqIndex + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    }
  };

  const handlePrevMCQ = () => {
    if (mcqIndex > 0) {
      setMcqIndex(mcqIndex - 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    }
  };

  const handleToggleMCQBookmark = (id: string) => {
    toggleQuestionBookmark(profileId, "MCQ", id);
    refreshProgress();
  };

  const handleTogglePracticeBookmark = (id: string) => {
    toggleQuestionBookmark(profileId, "PRACTICE", id);
    refreshProgress();
  };

  const handleTogglePYQBookmark = (id: string) => {
    toggleQuestionBookmark(profileId, "PYQ", id);
    refreshProgress();
  };

  const handleTogglePracticeCompleted = (id: string) => {
    toggleItemCompleted(profileId, "PRACTICE", id);
    refreshProgress();
  };

  const handleTogglePYQCompleted = (id: string) => {
    toggleItemCompleted(profileId, "PYQ", id);
    refreshProgress();
  };

  const toggleSolutionVisibility = (id: string) => {
    setRevealedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // MCQ Stats
  const mcqAttemptsList = Object.values(progress.mcqAttempts) as MCQAttemptRecord[];
  const totalAttemptedCount = mcqAttemptsList.length;
  const totalCorrectCount = mcqAttemptsList.filter((a) => a.isCorrect).length;
  const totalIncorrectCount = totalAttemptedCount - totalCorrectCount;
  const overallAccuracy =
    totalAttemptedCount > 0 ? Math.round((totalCorrectCount / totalAttemptedCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold tracking-tight">Academic Question Bank</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              V2.6
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Topic-wise MCQs, Verified Chapter-wise PYQs, and Practice Questions for Class 10, 11 & 12
          </p>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
          <button
            onClick={() => setSubTab("home")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              subTab === "home"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setSubTab("mcq")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              subTab === "mcq"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            MCQ Practice
          </button>
          <button
            onClick={() => setSubTab("practice")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              subTab === "practice"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Practice Questions
          </button>
          <button
            onClick={() => setSubTab("pyq")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              subTab === "pyq"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            PYQs
          </button>
          <button
            onClick={() => setSubTab("progress")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              subTab === "progress"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Progress
          </button>
        </div>
      </div>

      {/* Primary Selector Bar (Class -> Subject -> Chapter -> Topic) */}
      <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <Filter className="w-4 h-4 text-emerald-500" />
          <span>Academic Hierarchy Selector</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSubject("ALL");
                setSelectedChapter("ALL");
                setSelectedTopic("ALL");
              }}
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedChapter("ALL");
                setSelectedTopic("ALL");
              }}
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Subjects</option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
              Chapter
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(e.target.value);
                setSelectedTopic("ALL");
              }}
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Chapters</option>
              {availableChapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
              Topic
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Topics</option>
              {availableTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: QUESTION BANK HOME DASHBOARD                  */}
      {/* ========================================================= */}
      {subTab === "home" && (
        <div className="space-y-6">
          {/* Question Counts Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => setSubTab("mcq")}
              className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <ListFilter className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-emerald-500">{counts.mcqCount}</span>
              </div>
              <h3 className="text-sm font-semibold mt-3 group-hover:text-emerald-500 transition-colors">
                MCQ Practice
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Topic-wise multiple choice questions with instant explanations.
              </p>
            </div>

            <div
              onClick={() => setSubTab("practice")}
              className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-blue-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-blue-500">{counts.practiceCount}</span>
              </div>
              <h3 className="text-sm font-semibold mt-3 group-hover:text-blue-500 transition-colors">
                Practice Questions
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Chapter & Topic-wise short, long, conceptual & numerical problems.
              </p>
            </div>

            <div
              onClick={() => setSubTab("pyq")}
              className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-purple-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                  <Award className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-purple-500">{counts.pyqCount}</span>
              </div>
              <h3 className="text-sm font-semibold mt-3 group-hover:text-purple-500 transition-colors">
                Chapter-wise PYQs
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Verified previous year board questions with solutions.
              </p>
            </div>
          </div>

          {/* Abya AI Integration Quick Actions */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-900/20 via-[var(--bg-card)] to-blue-900/20 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Abya AI Academic Quick Actions</span>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Context: {selectedClass} • {selectedSubject === "ALL" ? "All Subjects" : selectedSubject}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  onAskAbyaWithContext(
                    `Practice topic: ${selectedTopic !== "ALL" ? selectedTopic : selectedChapter !== "ALL" ? selectedChapter : selectedSubject} for ${selectedClass}`
                  )
                }
                className="px-3 py-2 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Practice this topic</span>
              </button>

              <button
                onClick={() =>
                  onAskAbyaWithContext(
                    `Generate 5 revision questions for ${selectedClass} ${selectedSubject} - Chapter: ${selectedChapter}`
                  )
                }
                className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Generate revision questions</span>
              </button>

              <button
                onClick={() =>
                  onAskAbyaWithContext(
                    `Practice my weak topics in ${selectedClass} ${selectedSubject}`
                  )
                }
                className="px-3 py-2 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Practice my weak topics</span>
              </button>

              <button
                onClick={() =>
                  onAskAbyaWithContext(
                    `Practice PYQs from chapter: ${selectedChapter !== "ALL" ? selectedChapter : "Life Processes"} (${selectedClass})`
                  )
                }
                className="px-3 py-2 text-xs font-medium rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition-colors flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Practice PYQs from this chapter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: MCQ PRACTICE (TOPIC-WISE)                     */}
      {/* ========================================================= */}
      {subTab === "mcq" && (
        <div className="space-y-6">
          {/* MCQ Practice Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Practice Size:</span>
              {[10, 20, 30, 0].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setQuantityChoice(num);
                    setMcqIndex(0);
                    setSelectedOption(null);
                    setIsSubmitted(false);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                    quantityChoice === num
                      ? "bg-emerald-600 text-white"
                      : "bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {num === 0 ? "All Available" : `${num} Qs`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(e.target.value);
                  setMcqIndex(0);
                  setSelectedOption(null);
                  setIsSubmitted(false);
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
              >
                <option value="ALL">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <button
                onClick={() => {
                  setRetryMode(!retryMode);
                  setMcqIndex(0);
                  setSelectedOption(null);
                  setIsSubmitted(false);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                  retryMode
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)]"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Incorrect Only</span>
              </button>
            </div>
          </div>

          {/* MCQ Player */}
          {currentMCQ ? (
            <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6">
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 font-semibold rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Question {mcqIndex + 1} of {activeMCQSet.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-color)] font-medium">
                    {currentMCQ.subjectName} • {currentMCQ.chapterTitle}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 font-medium">
                    Topic: {currentMCQ.topicName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      currentMCQ.difficulty === "Easy"
                        ? "text-emerald-400 bg-emerald-500/10"
                        : currentMCQ.difficulty === "Medium"
                        ? "text-amber-400 bg-amber-500/10"
                        : "text-rose-400 bg-rose-500/10"
                    }`}
                  >
                    {currentMCQ.difficulty}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleMCQBookmark(currentMCQ.id)}
                  className={`p-2 rounded-lg border transition-colors ${
                    progress.mcqBookmarks.includes(currentMCQ.id)
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)]"
                  }`}
                  title="Bookmark Question"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              </div>

              {/* Question Text */}
              <p className="text-base font-medium leading-relaxed">{currentMCQ.questionText}</p>

              {/* 4 Options */}
              <div className="space-y-3">
                {currentMCQ.options.map((option, idx) => {
                  let btnStyle = "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-emerald-500/50";

                  if (selectedOption === idx) {
                    btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-medium";
                  }

                  if (isSubmitted) {
                    if (idx === currentMCQ.correctOptionIndex) {
                      btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-semibold";
                    } else if (selectedOption === idx) {
                      btnStyle = "bg-rose-500/20 border-rose-500 text-rose-400 font-semibold";
                    } else {
                      btnStyle = "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-secondary)] opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isSubmitted}
                      className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {isSubmitted && idx === currentMCQ.correctOptionIndex && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                      {isSubmitted && selectedOption === idx && idx !== currentMCQ.correctOptionIndex && (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Action Panel */}
              {isSubmitted && (
                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Explanation & Rationale</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {currentMCQ.explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={handlePrevMCQ}
                  disabled={mcqIndex === 0}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {!isSubmitted ? (
                  <button
                    onClick={handleSubmitMCQ}
                    disabled={selectedOption === null}
                    className="px-6 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-500 transition-colors"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextMCQ}
                    disabled={mcqIndex === activeMCQSet.length - 1}
                    className="px-6 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-500 transition-colors flex items-center gap-1"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
              <p className="text-sm font-semibold">No MCQs found matching selected filters.</p>
              <p className="text-xs mt-1">
                Try switching the Topic or Subject filter to view available MCQs.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: PRACTICE QUESTIONS (CHAPTER + TOPIC WISE)       */}
      {/* ========================================================= */}
      {subTab === "practice" && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search practice questions by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="INCOMPLETE">Incomplete</option>
                <option value="BOOKMARKED">Bookmarked</option>
              </select>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
              >
                <option value="ALL">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* List of Practice Questions */}
          <div className="space-y-4">
            {filteredPractice.map((q) => {
              const isDone = progress.practiceCompleted.includes(q.id);
              const isBookmarked = progress.practiceBookmarks.includes(q.id);
              const showSolution = revealedSolutions[q.id];

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 font-semibold">
                        {q.questionType} • {q.marks} Marks
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-color)]">
                        {q.subjectName} • {q.chapterTitle}
                      </span>
                      {q.topicName && (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400">
                          {q.topicName}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          q.sourceType === "VERIFIED PYQ"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {q.sourceType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePracticeCompleted(q.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1 ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)]"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isDone ? "Completed" : "Mark Done"}</span>
                      </button>

                      <button
                        onClick={() => handleTogglePracticeBookmark(q.id)}
                        className={`p-1.5 rounded-md border transition-colors ${
                          isBookmarked
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)]"
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* Solution Reveal Toggle */}
                  <div>
                    <button
                      onClick={() => toggleSolutionVisibility(q.id)}
                      className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                    >
                      {showSolution ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showSolution ? "Hide Answer & Solution" : "View Answer & Solution"}</span>
                    </button>

                    {showSolution && q.answerSolution && (
                      <div className="mt-2 p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                        <span className="font-bold text-emerald-500 block mb-1">Answer / Solution:</span>
                        {q.answerSolution}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredPractice.length === 0 && (
              <div className="p-12 text-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                <FileText className="w-12 h-12 mx-auto mb-3 text-blue-500/50" />
                <p className="text-sm font-semibold">No practice questions found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: CHAPTER-WISE PYQS                             */}
      {/* ========================================================= */}
      {subTab === "pyq" && (
        <div className="space-y-6">
          {/* Filters for PYQs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search PYQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
              >
                <option value="ALL">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="INCOMPLETE">Incomplete</option>
                <option value="BOOKMARKED">Bookmarked</option>
              </select>
            </div>
          </div>

          {/* List of PYQs */}
          <div className="space-y-4">
            {filteredPYQs.map((p) => {
              const isDone = progress.pyqCompleted.includes(p.id);
              const isBookmarked = progress.pyqBookmarks.includes(p.id);
              const showSolution = revealedSolutions[p.id];

              return (
                <div
                  key={p.id}
                  className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Strictly Label Verified PYQ */}
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>VERIFIED PYQ</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 font-semibold">
                        {p.board || "Board Exam"} • {p.year}
                      </span>

                      <span className="px-2.5 py-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-color)]">
                        {p.subjectName} • {p.chapterTitle}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400">
                        {p.marks} Marks • {p.questionType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePYQCompleted(p.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1 ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)]"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isDone ? "Completed" : "Mark Done"}</span>
                      </button>

                      <button
                        onClick={() => handleTogglePYQBookmark(p.id)}
                        className={`p-1.5 rounded-md border transition-colors ${
                          isBookmarked
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)]"
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">
                    {p.questionText}
                  </p>

                  {/* Solution Reveal Toggle */}
                  <div>
                    <button
                      onClick={() => toggleSolutionVisibility(p.id)}
                      className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                    >
                      {showSolution ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showSolution ? "Hide Model Solution" : "View Model Solution"}</span>
                    </button>

                    {showSolution && p.answerSolution && (
                      <div className="mt-2 p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                        <span className="font-bold text-emerald-500 block mb-1">Official Solution / Marking Scheme:</span>
                        {p.answerSolution}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredPYQs.length === 0 && (
              <div className="p-12 text-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                <Award className="w-12 h-12 mx-auto mb-3 text-purple-500/50" />
                <p className="text-sm font-semibold">No PYQs found matching selected filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 5: PROGRESS & ANALYTICS                           */}
      {/* ========================================================= */}
      {subTab === "progress" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MCQ Performance */}
            <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-500">MCQ Performance</span>
                <ListFilter className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Attempted:</span>
                  <span className="font-bold">{totalAttemptedCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Correct:</span>
                  <span className="font-bold text-emerald-400">{totalCorrectCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Incorrect:</span>
                  <span className="font-bold text-rose-400">{totalIncorrectCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Accuracy:</span>
                  <span className="font-bold text-emerald-400">{overallAccuracy}%</span>
                </div>
              </div>
            </div>

            {/* Practice Progress */}
            <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-500">Practice Questions</span>
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Completed:</span>
                  <span className="font-bold">{progress.practiceCompleted.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Bookmarked:</span>
                  <span className="font-bold text-amber-400">{progress.practiceBookmarks.length}</span>
                </div>
              </div>
            </div>

            {/* PYQ Progress */}
            <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-500">Chapter-wise PYQs</span>
                <Award className="w-4 h-4 text-purple-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Completed:</span>
                  <span className="font-bold">{progress.pyqCompleted.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Bookmarked:</span>
                  <span className="font-bold text-amber-400">{progress.pyqBookmarks.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
