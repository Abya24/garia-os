import React, { useState, useMemo } from "react";
import {
  HelpCircle,
  Clock,
  FileCheck2,
  BookOpen,
  Award,
  Zap,
  Bookmark,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Play,
  Check,
  Eye,
  EyeOff,
  Flame,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  StudentProfile,
  TopicMCQ,
  ChapterPYQ,
  PracticeQuestion,
  QuestionBankProfileProgress,
} from "../types";
import {
  SEED_MCQS,
  SEED_PYQS,
  SEED_PRACTICE_QUESTIONS,
  recordMCQAttempt,
  toggleQuestionBookmark,
  toggleItemCompleted,
} from "../utils/questionBankEngine";
import { AppLanguage, translations } from "../utils/i18n";
import { APP_VERSION } from "../constants/version";

interface QuestionBankPageProps {
  activeStudent?: StudentProfile;
  currentLanguage?: AppLanguage;
  onAskAbyaAI?: (prompt: string) => void;
  onAskAbyaWithContext?: (prompt: string, context?: any) => void;
  onNavigate?: (tab: string) => void;
}

type QuestionBankTab =
  | "mcq"
  | "quiz"
  | "pyq"
  | "practice"
  | "vvi"
  | "revision"
  | "test";

export const QuestionBankPage: React.FC<QuestionBankPageProps> = ({
  activeStudent,
  currentLanguage,
  onAskAbyaAI,
  onAskAbyaWithContext,
  onNavigate,
}) => {
  const langKey: AppLanguage =
    currentLanguage === "hi"
      ? "hi"
      : (activeStudent as any)?.language === "hi"
      ? "hi"
      : "en";
  const t = translations[langKey] || translations.en;

  const handleAskTutor = (prompt: string) => {
    if (onAskAbyaAI) {
      onAskAbyaAI(prompt);
    } else if (onAskAbyaWithContext) {
      onAskAbyaWithContext(prompt, "Question Bank");
    }
  };
  const [activeTab, setActiveTab] = useState<QuestionBankTab>("mcq");

  // Profile-driven filters with strict class & stream isolation
  const defaultClass = activeStudent?.classLevel || "Class 10";
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Compute available subjects strictly based on active student stream & class
  const availableSubjects = useMemo(() => {
    const isClass10 = (activeStudent?.classLevel || selectedClass) === "Class 10";
    if (isClass10) {
      return [
        { label: "All Class 10 Subjects", value: "ALL" },
        { label: "Mathematics", value: "Mathematics" },
        { label: "Science (Physics, Chem, Bio)", value: "Science" },
        { label: "Social Science (Hist, Civ, Geo, Eco)", value: "Social Science" },
        { label: "English Language & Lit", value: "English" },
        { label: "Hindi (Course A & B)", value: "Hindi" },
        { label: "Sanskrit", value: "Sanskrit" },
      ];
    }

    const stream = activeStudent?.stream || "Science";
    if (stream === "Science") {
      return [
        { label: "All Science Subjects", value: "ALL" },
        { label: "Physics", value: "Physics" },
        { label: "Chemistry", value: "Chemistry" },
        { label: "Mathematics", value: "Mathematics" },
        { label: "Biology", value: "Biology" },
        { label: "Computer Science", value: "Computer Science" },
        { label: "English Core", value: "English" },
      ];
    } else if (stream === "Commerce") {
      return [
        { label: "All Commerce Subjects", value: "ALL" },
        { label: "Accountancy", value: "Accountancy" },
        { label: "Business Studies", value: "Business Studies" },
        { label: "Economics", value: "Economics" },
        { label: "Mathematics / Applied Maths", value: "Mathematics" },
        { label: "English Core", value: "English" },
      ];
    } else {
      // Arts / Humanities
      return [
        { label: "All Arts Subjects", value: "ALL" },
        { label: "History", value: "History" },
        { label: "Political Science", value: "Political Science" },
        { label: "Geography", value: "Geography" },
        { label: "Sociology", value: "Sociology" },
        { label: "Economics", value: "Economics" },
        { label: "English Core", value: "English" },
      ];
    }
  }, [activeStudent, selectedClass]);

  // Storage state
  const profileId = activeStudent?.id || "default";
  const [progress, setProgress] = useState<QuestionBankProfileProgress>(() => {
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
  });

  // MCQ State
  const [currentMCQIndex, setCurrentMCQIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Quiz State
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(300); // 5 mins
  const [quizQuestions, setQuizQuestions] = useState<TopicMCQ[]>([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Practice & PYQ State
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedBoard, setSelectedBoard] = useState<string>("ALL");

  // Filtered Question lists
  const filteredMCQs = useMemo(() => {
    return SEED_MCQS.filter((q) => {
      const matchClass = selectedClass === "ALL" || q.classLevel.toLowerCase() === selectedClass.toLowerCase();
      const matchSub = selectedSubject === "ALL" || q.subjectName.toLowerCase().includes(selectedSubject.toLowerCase());
      const matchSearch = !searchQuery || q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || q.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSub && matchSearch;
    });
  }, [selectedClass, selectedSubject, searchQuery]);

  const filteredPYQs = useMemo(() => {
    return SEED_PYQS.filter((p) => {
      const matchClass = selectedClass === "ALL" || p.classLevel.toLowerCase() === selectedClass.toLowerCase();
      const matchSub = selectedSubject === "ALL" || p.subjectName.toLowerCase().includes(selectedSubject.toLowerCase());
      const matchYear = selectedYear === "ALL" || p.year.toString() === selectedYear;
      const matchBoard = selectedBoard === "ALL" || (p.board && p.board.toLowerCase() === selectedBoard.toLowerCase());
      const matchSearch = !searchQuery || p.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || p.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSub && matchYear && matchBoard && matchSearch;
    });
  }, [selectedClass, selectedSubject, selectedYear, selectedBoard, searchQuery]);

  const filteredPractice = useMemo(() => {
    return SEED_PRACTICE_QUESTIONS.filter((pr) => {
      const matchClass = selectedClass === "ALL" || pr.classLevel.toLowerCase() === selectedClass.toLowerCase();
      const matchSub = selectedSubject === "ALL" || pr.subjectName.toLowerCase().includes(selectedSubject.toLowerCase());
      const matchSearch = !searchQuery || pr.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || pr.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSub && matchSearch;
    });
  }, [selectedClass, selectedSubject, searchQuery]);

  // Handle MCQ Answer Submission
  const handleAnswerSelect = (optionIdx: number, mcq: TopicMCQ) => {
    setSelectedOption(optionIdx);
    const isCorrect = optionIdx === mcq.correctOptionIndex;
    const updated = recordMCQAttempt(profileId, mcq.id, optionIdx, isCorrect);
    setProgress(updated);
    setShowExplanation(true);
  };

  // Start Timed Quiz
  const startQuiz = (count: number = 5) => {
    const pool = filteredMCQs.length > 0 ? [...filteredMCQs] : [...SEED_MCQS];
    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, count);
    setQuizQuestions(shuffled);
    setQuizCurrentIndex(0);
    setQuizAnswers({});
    setQuizTimeLeft(count * 60);
    setQuizActive(true);
    setQuizFinished(false);
  };

  // Timer Effect for Quiz
  React.useEffect(() => {
    if (!quizActive || quizFinished) return;
    const timer = setInterval(() => {
      setQuizTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setQuizFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizActive, quizFinished]);

  const activeMCQ = filteredMCQs[currentMCQIndex] || SEED_MCQS[0];

  // Calculate stats
  const totalAttempted = Object.keys(progress.mcqAttempts).length;
  const attemptsList = Object.values(progress.mcqAttempts) as { isCorrect?: boolean }[];
  const correctCount = attemptsList.filter((a) => a.isCorrect).length;
  const accuracyRate = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900/60 border border-indigo-500/20 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <HelpCircle className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {t.questionBankTitle}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 text-slate-400 border border-white/10">
                v{APP_VERSION}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-heading tracking-tight">
              {t.questionBankTitle}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              {t.questionBankSubtitle}
            </p>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-xs text-slate-400 font-medium">{t.totalQuestions}</div>
              <div className="text-lg font-bold text-white font-mono">
                {SEED_MCQS.length + SEED_PYQS.length + SEED_PRACTICE_QUESTIONS.length}+
              </div>
            </div>
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-xs text-slate-400 font-medium">{t.accuracy}</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">{accuracyRate}%</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xs text-slate-400 font-medium">Solved</div>
              <div className="text-lg font-bold text-cyan-400 font-mono">{totalAttempted}</div>
            </div>
          </div>
        </div>

        {/* Global Controls & Filters */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/10">
            <Filter className="w-4 h-4 text-indigo-400" />
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSubject("ALL");
              }}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {activeStudent?.classLevel === "Class 10" ? (
                <option value="Class 10" className="bg-slate-900">Class 10 (Direct Syllabus)</option>
              ) : (
                <>
                  <option value="ALL" className="bg-slate-900">All Classes</option>
                  <option value="Class 10" className="bg-slate-900">Class 10</option>
                  <option value="Class 11" className="bg-slate-900">Class 11</option>
                  <option value="Class 12" className="bg-slate-900">Class 12</option>
                </>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/10">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {availableSubjects.map((sub) => (
                <option key={sub.value} value={sub.value} className="bg-slate-900">
                  {sub.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chapters, topics, formulas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 text-xs text-white placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 7 Question Bank Modes Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "mcq" as QuestionBankTab, label: t.tabMCQ, icon: HelpCircle, count: filteredMCQs.length },
          { id: "quiz" as QuestionBankTab, label: t.tabQuiz, icon: Clock, count: "5-15 Qs" },
          { id: "pyq" as QuestionBankTab, label: t.tabPYQ, icon: FileCheck2, count: filteredPYQs.length },
          { id: "practice" as QuestionBankTab, label: t.tabPractice, icon: BookOpen, count: filteredPractice.length },
          { id: "vvi" as QuestionBankTab, label: t.tabVVI, icon: Flame, badge: "High-Yield" },
          { id: "revision" as QuestionBankTab, label: t.tabRevision, icon: Zap, badge: "Rapid" },
          { id: "test" as QuestionBankTab, label: t.tabChapterTest, icon: Award, badge: "Full" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-xs transition-all whitespace-nowrap border ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-[1.02]"
                  : "bg-slate-900/60 text-slate-300 border-white/5 hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className="text-[10px] opacity-70 font-mono">({tab.count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mode 1: MCQ Interactive Trainer */}
      {activeTab === "mcq" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {activeMCQ ? (
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {activeMCQ.subjectName}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {activeMCQ.chapterTitle} • {activeMCQ.topicName}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const updated = toggleQuestionBookmark(profileId, "MCQ", activeMCQ.id);
                      setProgress({ ...updated });
                    }}
                    className={`p-2 rounded-xl border transition-all ${
                      progress.mcqBookmarks.includes(activeMCQ.id)
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>

                {/* Question Text */}
                <div className="text-base md:text-lg font-bold text-white leading-relaxed">
                  <span className="text-indigo-400 font-mono mr-2">Q{currentMCQIndex + 1}.</span>
                  {activeMCQ.questionText}
                </div>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {activeMCQ.options.map((option, optIdx) => {
                    const isAttempted = progress.mcqAttempts[activeMCQ.id] !== undefined;
                    const userSelected = isAttempted
                      ? progress.mcqAttempts[activeMCQ.id].selectedOption === optIdx
                      : selectedOption === optIdx;
                    const isCorrect = activeMCQ.correctOptionIndex === optIdx;

                    let btnStyle = "bg-slate-950/60 border-white/10 text-slate-200 hover:bg-indigo-900/20 hover:border-indigo-500/40";
                    if (isAttempted || showExplanation) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold";
                      } else if (userSelected && !isCorrect) {
                        btnStyle = "bg-rose-500/20 border-rose-500 text-rose-200";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswerSelect(optIdx, activeMCQ)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span className="text-sm font-medium">{option}</span>
                        </div>
                        {(isAttempted || showExplanation) && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        )}
                        {(isAttempted || showExplanation) && userSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {(showExplanation || progress.mcqAttempts[activeMCQ.id]) && (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-xs text-indigo-300">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      {t.explanation}
                    </div>
                    <p className="text-xs text-indigo-100/90 leading-relaxed">
                      {activeMCQ.explanation}
                    </p>
                  </div>
                )}

                {/* Question Navigation Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    disabled={currentMCQIndex === 0}
                    onClick={() => {
                      setCurrentMCQIndex((prev) => Math.max(0, prev - 1));
                      setSelectedOption(null);
                      setShowExplanation(false);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t.previousQuestion}
                  </button>

                  <div className="text-xs text-slate-400 font-mono">
                    {currentMCQIndex + 1} / {filteredMCQs.length}
                  </div>

                  <button
                    disabled={currentMCQIndex >= filteredMCQs.length - 1}
                    onClick={() => {
                      setCurrentMCQIndex((prev) => Math.min(filteredMCQs.length - 1, prev + 1));
                      setSelectedOption(null);
                      setShowExplanation(false);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {t.nextQuestion}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-white/10">
                <p className="text-slate-400 text-sm">No questions found matching your filter.</p>
              </div>
            )}
          </div>

          {/* Right Question Palette & Abya AI Doubt Helper */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center justify-between">
                <span>Question Palette</span>
                <span className="text-xs font-mono text-indigo-400">{filteredMCQs.length} Questions</span>
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {filteredMCQs.map((q, idx) => {
                  const attempt = progress.mcqAttempts[q.id];
                  let statusBg = "bg-white/5 text-slate-400 border-white/10";
                  if (attempt) {
                    statusBg = attempt.isCorrect
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/40";
                  }
                  if (currentMCQIndex === idx) {
                    statusBg += " ring-2 ring-indigo-400 font-bold";
                  }
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentMCQIndex(idx);
                        setSelectedOption(null);
                        setShowExplanation(false);
                      }}
                      className={`h-9 rounded-xl border flex items-center justify-center text-xs font-mono transition-all ${statusBg}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Abya AI Doubt Solver Box */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Instant Abya AI Doubt Solver</span>
              </div>
              <p className="text-xs text-slate-300">
                Stuck on this concept? Ask Abya AI for step-by-step breakdown, formula derivations, or shortcuts.
              </p>
              <button
                onClick={() => {
                  if (activeMCQ) {
                    handleAskTutor(`Please explain this question and concept in detail with formulas:\n"${activeMCQ.questionText}"`);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
              >
                <Sparkles className="w-4 h-4" />
                Ask Abya to Explain This Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Timed Quiz Mode */}
      {activeTab === "quiz" && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6">
          {!quizActive && !quizFinished && (
            <div className="max-w-xl mx-auto text-center space-y-5 py-8">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
                <Clock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white font-heading">{t.tabQuiz}</h2>
              <p className="text-sm text-slate-300">
                Test your speed and concept clarity with rapid timed question sets. Immediate accuracy scoring and review.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => startQuiz(5)}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <Play className="w-4 h-4" />
                  Quick 5 Questions (5 Min)
                </button>
                <button
                  onClick={() => startQuiz(10)}
                  className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center gap-2 border border-white/10"
                >
                  <Clock className="w-4 h-4" />
                  Full 10 Questions (10 Min)
                </button>
              </div>
            </div>
          )}

          {quizActive && !quizFinished && quizQuestions[quizCurrentIndex] && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/10">
                <div className="text-xs font-mono text-slate-300">
                  Question {quizCurrentIndex + 1} of {quizQuestions.length}
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                  <Clock className="w-4 h-4" />
                  {Math.floor(quizTimeLeft / 60)}:{(quizTimeLeft % 60).toString().padStart(2, "0")}
                </div>
              </div>

              <div className="text-base font-bold text-white">
                {quizQuestions[quizCurrentIndex].questionText}
              </div>

              <div className="space-y-3">
                {quizQuestions[quizCurrentIndex].options.map((opt, oIdx) => {
                  const isChosen = quizAnswers[quizCurrentIndex] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => setQuizAnswers((prev) => ({ ...prev, [quizCurrentIndex]: oIdx }))}
                      className={`w-full p-4 rounded-2xl text-left border text-sm font-medium transition-all ${
                        isChosen
                          ? "bg-indigo-600 text-white border-indigo-400"
                          : "bg-slate-950/60 text-slate-200 border-white/10 hover:bg-white/5"
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}. {opt}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  disabled={quizCurrentIndex === 0}
                  onClick={() => setQuizCurrentIndex((p) => p - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 text-white disabled:opacity-30"
                >
                  Previous
                </button>
                {quizCurrentIndex < quizQuestions.length - 1 ? (
                  <button
                    onClick={() => setQuizCurrentIndex((p) => p + 1)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setQuizFinished(true);
                      setQuizActive(false);
                    }}
                    className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                  >
                    {t.submitTest}
                  </button>
                )}
              </div>
            </div>
          )}

          {quizFinished && (
            <div className="max-w-xl mx-auto text-center space-y-6 py-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white font-heading">{t.scoreCard}</h2>
              {(() => {
                let correct = 0;
                quizQuestions.forEach((q, idx) => {
                  if (quizAnswers[idx] === q.correctOptionIndex) correct++;
                });
                const pct = quizQuestions.length > 0 ? Math.round((correct / quizQuestions.length) * 100) : 0;
                return (
                  <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 space-y-4">
                    <div className="text-4xl font-extrabold text-white font-mono">{pct}%</div>
                    <div className="text-sm text-slate-300">
                      You answered <span className="text-emerald-400 font-bold">{correct}</span> out of{" "}
                      <span className="text-white font-bold">{quizQuestions.length}</span> questions correctly.
                    </div>
                    <button
                      onClick={() => {
                        setQuizFinished(false);
                        setQuizActive(false);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs inline-flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Take Another Quiz
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Mode 3: PYQ Previous Year Papers */}
      {activeTab === "pyq" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Filter Year:</span>
              {["ALL", "2024", "2023", "2022"].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold border ${
                    selectedYear === yr
                      ? "bg-indigo-600 text-white border-indigo-400"
                      : "bg-white/5 text-slate-300 border-white/10"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Board:</span>
              {["ALL", "CBSE", "BSEB"].map((bd) => (
                <button
                  key={bd}
                  onClick={() => setSelectedBoard(bd)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                    selectedBoard === bd
                      ? "bg-cyan-600 text-white border-cyan-400"
                      : "bg-white/5 text-slate-300 border-white/10"
                  }`}
                >
                  {bd}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredPYQs.map((pyq, idx) => {
              const isDone = progress.pyqCompleted.includes(pyq.id);
              const isExpanded = expandedSolutions[pyq.id];
              return (
                <div key={pyq.id} className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                        {pyq.year} • {pyq.board || "All Boards"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {pyq.subjectName} • {pyq.chapterTitle} • ({pyq.marks} Marks)
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const updated = toggleItemCompleted(profileId, "PYQ", pyq.id);
                        setProgress({ ...updated });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                        isDone
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isDone ? "Solved" : "Mark Solved"}
                    </button>
                  </div>

                  <div className="text-sm md:text-base font-bold text-white">
                    <span className="text-indigo-400 font-mono mr-2">Q{idx + 1}.</span>
                    {pyq.questionText}
                  </div>

                  {/* Toggle Model Solution */}
                  {pyq.answerSolution && (
                    <div>
                      <button
                        onClick={() =>
                          setExpandedSolutions((p) => ({ ...p, [pyq.id]: !p[pyq.id] }))
                        }
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1"
                      >
                        {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {isExpanded ? "Hide Model Solution" : "View Verified Model Answer"}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/20 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                          <div className="font-bold text-indigo-300 mb-1.5">Official Solution / Step Marking:</div>
                          {pyq.answerSolution}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 4: Practice Sets */}
      {activeTab === "practice" && (
        <div className="space-y-3">
          {filteredPractice.map((pr, idx) => {
            const isDone = progress.practiceCompleted.includes(pr.id);
            const isExpanded = expandedSolutions[pr.id];
            return (
              <div key={pr.id} className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {pr.subjectName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {pr.chapterTitle} • {pr.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const updated = toggleItemCompleted(profileId, "PRACTICE", pr.id);
                      setProgress({ ...updated });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isDone ? "Completed" : "Mark as Done"}
                  </button>
                </div>

                <div className="text-sm md:text-base font-bold text-white">
                  <span className="text-cyan-400 font-mono mr-2">Q{idx + 1}.</span>
                  {pr.questionText}
                </div>

                {pr.answerSolution && (
                  <div>
                    <button
                      onClick={() =>
                        setExpandedSolutions((p) => ({ ...p, [pr.id]: !p[pr.id] }))
                      }
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {isExpanded ? "Hide Solution" : "View Step-by-Step Solution"}
                    </button>
                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/20 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                        {pr.answerSolution}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 5: VVI High-Yield Topics & Questions */}
      {activeTab === "vvi" && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white font-heading">VVI High-Yield Board Topics</h3>
              <p className="text-xs text-slate-400">
                Curated list of 100% recurring board exam questions, high-scoring numerical patterns, and theorem proofs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                subject: "Mathematics",
                topic: "Real Numbers & Polynomials",
                vviItem: "Proof of Irrationality (√2, √3, √5) & Remainder Theorem",
                marks: "3 to 5 Marks",
                weightage: "🚨 100% Guaranteed Board Question",
              },
              {
                subject: "Science / Physics",
                topic: "Light - Reflection & Refraction",
                vviItem: "Mirror & Lens Formula Derivation with Sign Conventions & Ray Diagrams",
                marks: "5 Marks",
                weightage: "🔥 High Weightage",
              },
              {
                subject: "Commerce / Accountancy",
                topic: "Partnership Fundamentals",
                vviItem: "Profit & Loss Appropriation Account & Past Adjustments with Guarantee of Profit",
                marks: "6 Marks",
                weightage: "🚨 High Weightage in Board & CA",
              },
              {
                subject: "Economics",
                topic: "National Income Accounting",
                vviItem: "3 Methods of National Income (Value Added, Income, Expenditure) Numericals",
                marks: "6 Marks",
                weightage: "🔥 Board Core Question",
              },
            ].map((vvi, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">{vvi.subject}</span>
                  <span className="text-[10px] font-mono text-rose-400 font-bold">{vvi.weightage}</span>
                </div>
                <h4 className="font-bold text-sm text-white">{vvi.topic}</h4>
                <p className="text-xs text-slate-300">{vvi.vviItem}</p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Weightage: {vvi.marks}</span>
                  <button
                    onClick={() => {
                      handleAskTutor(`Please teach me the VVI topic: ${vvi.topic} - ${vvi.vviItem} with all solved examples and step marking.`);
                    }}
                    className="text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
                  >
                    Master with Abya AI <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 6: Rapid Revision Flashcards & Formula Cheats */}
      {activeTab === "revision" && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white font-heading">Rapid Revision & Formula Cheat-Sheets</h3>
              <p className="text-xs text-slate-400">
                Quick memory cards, mathematical identities, reaction sheets, and key definitions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Trigonometric Identities",
                subject: "Mathematics",
                points: ["sin²θ + cos²θ = 1", "1 + tan²θ = sec²θ", "1 + cot²θ = cosec²θ"],
              },
              {
                title: "Ohm's Law & Power",
                subject: "Physics",
                points: ["V = I × R", "P = V × I = I²R = V²/R", "H = I²Rt (Joule's Law)"],
              },
              {
                title: "Chemical Reactions",
                subject: "Chemistry",
                points: ["Fe + CuSO₄ → FeSO₄ + Cu (Displacement)", "CaO + H₂O → Ca(OH)₂ (Combination)"],
              },
            ].map((card, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                <div className="text-xs font-bold text-amber-400">{card.subject}</div>
                <h4 className="font-bold text-sm text-white">{card.title}</h4>
                <div className="space-y-1.5">
                  {card.points.map((pt, pIdx) => (
                    <div key={pIdx} className="p-2 rounded-xl bg-white/5 font-mono text-xs text-slate-200">
                      {pt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 7: Chapter Test Simulator */}
      {activeTab === "test" && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-5 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white font-heading">Full Chapter Test Assessment</h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            Simulate realistic exam conditions with timed section-by-section questions, instant grading, and automated weakness detection.
          </p>
          <div className="pt-2">
            <button
              onClick={() => startQuiz(10)}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Play className="w-4 h-4" />
              Launch Chapter Test (10 Questions)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
