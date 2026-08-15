import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  HelpCircle,
  BookOpen,
  Layers,
  Sparkles,
  FileCheck2,
  CheckCircle2,
  Award,
  Zap,
  BarChart2,
  AlertTriangle,
  History,
  Bookmark,
  Play,
  RotateCcw,
  ChevronRight,
  Target,
  FileText,
} from "lucide-react";
import { AppLanguage, translations } from "../utils/i18n";

export type QuestionBankDrawerAction =
  // Browse
  | "browse_subjects"
  | "browse_chapters"
  | "browse_topics"
  | "browse_vvi"
  // Practice
  | "practice_mcq"
  | "practice_pyq"
  | "practice_assertion"
  | "practice_case_based"
  // Tests
  | "tests_chapter"
  | "tests_subject"
  | "tests_full_syllabus"
  | "tests_speed"
  // Analytics
  | "analytics_accuracy"
  | "analytics_wrong_answers"
  | "analytics_weak_topics"
  | "analytics_history"
  // Quick Access
  | "quick_continue"
  | "quick_bookmarked"
  | "quick_recent";

interface QuestionBankDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: QuestionBankDrawerAction) => void;
  activeAction?: QuestionBankDrawerAction | string;
  currentLanguage?: AppLanguage;
  studentClassName?: string;
  studentStream?: string;
  bookmarkCount?: number;
}

export const QuestionBankDrawer: React.FC<QuestionBankDrawerProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  activeAction = "practice_mcq",
  currentLanguage = "en",
  studentClassName = "Class 10",
  studentStream = "Science",
  bookmarkCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const t = translations[currentLanguage] || translations.en;

  const drawerItems = useMemo(
    () => [
      // Browse
      {
        id: "browse_subjects" as QuestionBankDrawerAction,
        section: "browse",
        label: "All Subjects",
        desc: "Browse curriculum by subject hierarchy & chapter indices",
        icon: BookOpen,
        color: "from-emerald-400 to-teal-500",
      },
      {
        id: "browse_chapters" as QuestionBankDrawerAction,
        section: "browse",
        label: "Chapters",
        desc: "Weightage-ranked chapters with direct question bank access",
        icon: Layers,
        color: "from-teal-400 to-cyan-500",
      },
      {
        id: "browse_topics" as QuestionBankDrawerAction,
        section: "browse",
        label: "Topics",
        desc: "Granular micro-concept tags and formula references",
        icon: Target,
        color: "from-cyan-400 to-blue-500",
      },
      {
        id: "browse_vvi" as QuestionBankDrawerAction,
        section: "browse",
        label: "VVI Questions",
        desc: "High probability recurring exam questions with model answers",
        icon: Sparkles,
        badge: "Exam High Yield",
        color: "from-amber-400 to-orange-500",
      },

      // Practice
      {
        id: "practice_mcq" as QuestionBankDrawerAction,
        section: "practice",
        label: "MCQ Practice",
        desc: "Instant feedback multiple-choice drill with detailed hints",
        icon: HelpCircle,
        badge: "Active",
        color: "from-purple-400 to-indigo-500",
      },
      {
        id: "practice_pyq" as QuestionBankDrawerAction,
        section: "practice",
        label: "PYQ Practice",
        desc: "Previous years solved questions categorized by year & exam",
        icon: FileCheck2,
        badge: "10 Yrs",
        color: "from-indigo-400 to-blue-500",
      },
      {
        id: "practice_assertion" as QuestionBankDrawerAction,
        section: "practice",
        label: "Assertion & Reason",
        desc: "Critical reasoning & assertion-justification question formats",
        icon: CheckCircle2,
        badge: "Boards Special",
        color: "from-blue-400 to-cyan-500",
      },
      {
        id: "practice_case_based" as QuestionBankDrawerAction,
        section: "practice",
        label: "Case Based Questions",
        desc: "Passage, case-study and real-world application questions",
        icon: FileText,
        badge: "New Pattern",
        color: "from-teal-400 to-emerald-500",
      },

      // Tests
      {
        id: "tests_chapter" as QuestionBankDrawerAction,
        section: "tests",
        label: "Chapter Tests",
        desc: "Focused 15-minute quick chapter evaluation quizzes",
        icon: Award,
        color: "from-pink-400 to-rose-500",
      },
      {
        id: "tests_subject" as QuestionBankDrawerAction,
        section: "tests",
        label: "Subject Tests",
        desc: "Sectional mastery exams with percentile and accuracy ranking",
        icon: Award,
        color: "from-rose-400 to-red-500",
      },
      {
        id: "tests_full_syllabus" as QuestionBankDrawerAction,
        section: "tests",
        label: "Full Syllabus Tests",
        desc: "Simulated 3-hour exam environment with official marking scheme",
        icon: Award,
        badge: "Full Mock",
        color: "from-emerald-400 to-teal-500",
      },
      {
        id: "tests_speed" as QuestionBankDrawerAction,
        section: "tests",
        label: "Speed Tests",
        desc: "Rapid-fire 60-second question blitz for reflex & recall",
        icon: Zap,
        badge: "Blitz",
        color: "from-amber-400 to-yellow-500",
      },

      // Analytics
      {
        id: "analytics_accuracy" as QuestionBankDrawerAction,
        section: "analytics",
        label: "Accuracy Report",
        desc: "Overall accuracy % across subjects, chapters and difficulty levels",
        icon: BarChart2,
        color: "from-purple-400 to-indigo-500",
      },
      {
        id: "analytics_wrong_answers" as QuestionBankDrawerAction,
        section: "analytics",
        label: "Wrong Answers Review",
        desc: "Smart error notebook for unlearning misconceptions",
        icon: RotateCcw,
        badge: "Error Book",
        color: "from-red-400 to-rose-500",
      },
      {
        id: "analytics_weak_topics" as QuestionBankDrawerAction,
        section: "analytics",
        label: "Weak Topics",
        desc: "Topics where question accuracy fell below 60%",
        icon: AlertTriangle,
        badge: "Attention",
        color: "from-orange-400 to-amber-500",
      },
      {
        id: "analytics_history" as QuestionBankDrawerAction,
        section: "analytics",
        label: "Test History",
        desc: "Complete log of attempted mock tests and scorecards",
        icon: History,
        color: "from-cyan-400 to-blue-500",
      },

      // Quick Access
      {
        id: "quick_continue" as QuestionBankDrawerAction,
        section: "quick",
        label: "Continue Last Session",
        desc: "Resume right where you left off in your last question drill",
        icon: Play,
        badge: "Resume",
        color: "from-emerald-400 to-cyan-500",
      },
      {
        id: "quick_bookmarked" as QuestionBankDrawerAction,
        section: "quick",
        label: "Bookmarked Questions",
        desc: `Questions saved for revision (${bookmarkCount} saved)`,
        icon: Bookmark,
        badge: bookmarkCount > 0 ? `${bookmarkCount} Saved` : undefined,
        color: "from-amber-400 to-orange-500",
      },
      {
        id: "quick_recent" as QuestionBankDrawerAction,
        section: "quick",
        label: "Recent Attempts",
        desc: "Today's attempted MCQs and solved practice sets",
        icon: History,
        color: "from-teal-400 to-emerald-500",
      },
    ],
    [bookmarkCount]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return drawerItems;
    const q = searchQuery.toLowerCase();
    return drawerItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
    );
  }, [drawerItems, searchQuery]);

  const sections = [
    {
      id: "browse",
      title: "Browse",
      items: filteredItems.filter((i) => i.section === "browse"),
    },
    {
      id: "practice",
      title: "Practice",
      items: filteredItems.filter((i) => i.section === "practice"),
    },
    {
      id: "tests",
      title: "Tests",
      items: filteredItems.filter((i) => i.section === "tests"),
    },
    {
      id: "analytics",
      title: "Analytics",
      items: filteredItems.filter((i) => i.section === "analytics"),
    },
    {
      id: "quick",
      title: "Quick Access",
      items: filteredItems.filter((i) => i.section === "quick"),
    },
  ].filter((s) => s.items.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="questionbank-drawer-overlay"
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            id="questionbank-drawer-panel"
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-slate-950/95 border-l border-white/15 shadow-2xl flex flex-col overflow-hidden text-white"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 space-y-3 shrink-0 bg-slate-900/60 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-cyan-500 p-0.5 flex items-center justify-center text-slate-950 font-bold shadow-md">
                    <HelpCircle className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base font-heading text-white flex items-center gap-2">
                      <span>Question Bank Drawer</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        V3
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {studentClassName} • {studentStream}
                    </p>
                  </div>
                </div>

                <button
                  id="close-qbank-drawer-btn"
                  onClick={onClose}
                  aria-label="Close Question Bank Drawer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="qbank-drawer-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search MCQs, PYQs, Speed Tests, VVI questions..."
                  className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
              {sections.map((sec) => (
                <div key={sec.id} className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between px-1">
                    <span>{sec.title}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {sec.items.length} items
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 gap-2">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeAction === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectAction(item.id);
                            onClose();
                          }}
                          className={`w-full min-h-[48px] p-3 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 group active:scale-[0.99] ${
                            isActive
                              ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border-cyan-500/40 shadow-sm"
                              : "bg-slate-900/60 hover:bg-slate-900/90 border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.color} p-0.5 flex items-center justify-center text-slate-950 font-bold shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                            >
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors truncate">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredItems.length === 0 && (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-300">
                    No question bank items match "{searchQuery}"
                  </p>
                  <p className="text-xs text-slate-500">
                    Try searching for MCQ, Speed Tests, VVI, or Error Book.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between text-xs text-slate-400 font-mono shrink-0">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Question Bank Drawer Active
              </span>
              <span>1-Tap Practice</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
