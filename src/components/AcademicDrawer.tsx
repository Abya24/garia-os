import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  GraduationCap,
  BookOpen,
  Map,
  Layers,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Award,
  Calendar,
  Clock,
  Target,
  BarChart2,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { AppLanguage, translations } from "../utils/i18n";

export type AcademicDrawerAction =
  // Study
  | "roadmap"
  | "dashboard"
  | "chapters"
  | "topics"
  | "vvi"
  // Practice
  | "mcq_practice"
  | "pyqs"
  | "chapter_tests"
  | "mock_tests"
  // Planning
  | "revision_planner"
  | "daily_journal"
  | "study_goals"
  // Analytics
  | "progress_analytics"
  | "weak_topics"
  | "test_performance"
  | "study_streak";

interface AcademicDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: AcademicDrawerAction) => void;
  activeAction?: AcademicDrawerAction | string;
  currentLanguage?: AppLanguage;
  studentClassName?: string;
  studentStream?: string;
}

export const AcademicDrawer: React.FC<AcademicDrawerProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  activeAction = "roadmap",
  currentLanguage = "en",
  studentClassName = "Class 10",
  studentStream = "Science",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const t = translations[currentLanguage] || translations.en;

  const drawerItems = useMemo(
    () => [
      // Study Section
      {
        id: "roadmap" as AcademicDrawerAction,
        section: "study",
        label: "Academic Roadmap",
        desc: "Interactive curriculum milestones, syllabus chapters & timeline",
        icon: Map,
        badge: "Milestones",
        color: "from-emerald-400 to-teal-500",
      },
      {
        id: "dashboard" as AcademicDrawerAction,
        section: "study",
        label: "Subject Dashboard",
        desc: "All subjects overview, completion percentage & chapter breakdown",
        icon: BookOpen,
        color: "from-teal-400 to-cyan-500",
      },
      {
        id: "chapters" as AcademicDrawerAction,
        section: "study",
        label: "Chapter Explorer",
        desc: "Weightage analysis, exam priority scoring & formula guides",
        icon: Layers,
        color: "from-cyan-400 to-blue-500",
      },
      {
        id: "topics" as AcademicDrawerAction,
        section: "study",
        label: "Topic Explorer",
        desc: "Micro-concept breakdowns, key definitions & high-yield summaries",
        icon: GraduationCap,
        color: "from-blue-400 to-indigo-500",
      },
      {
        id: "vvi" as AcademicDrawerAction,
        section: "study",
        label: "VVI Topics",
        desc: "Very Very Important board exam topics & recurring question topics",
        icon: Sparkles,
        badge: "High Yield",
        color: "from-amber-400 to-orange-500",
      },

      // Practice Section
      {
        id: "mcq_practice" as AcademicDrawerAction,
        section: "practice",
        label: "MCQ Practice",
        desc: "Topic-wise multiple choice drills with step-by-step solutions",
        icon: HelpCircle,
        badge: "Drills",
        color: "from-purple-400 to-pink-500",
      },
      {
        id: "pyqs" as AcademicDrawerAction,
        section: "practice",
        label: "PYQs (Past Year Questions)",
        desc: "Previous 10 years solved board & competitive exam papers",
        icon: FileCheck2,
        badge: "10 Yrs",
        color: "from-indigo-400 to-purple-500",
      },
      {
        id: "chapter_tests" as AcademicDrawerAction,
        section: "practice",
        label: "Chapter Tests",
        desc: "Timed chapter mastery checks with instant grading",
        icon: Award,
        color: "from-pink-400 to-rose-500",
      },
      {
        id: "mock_tests" as AcademicDrawerAction,
        section: "practice",
        label: "Mock Tests",
        desc: "Full syllabus simulated exams with negative marking options",
        icon: Award,
        badge: "Simulated",
        color: "from-emerald-400 to-cyan-500",
      },

      // Planning Section
      {
        id: "revision_planner" as AcademicDrawerAction,
        section: "planning",
        label: "Revision Planner",
        desc: "Spaced repetition (1-3-7-15-30 days) review schedule",
        icon: Calendar,
        badge: "Spaced",
        color: "from-cyan-400 to-teal-500",
      },
      {
        id: "daily_journal" as AcademicDrawerAction,
        section: "planning",
        label: "Daily Study Journal",
        desc: "Logged hours, focus topics & self-assessment entries",
        icon: Clock,
        color: "from-blue-400 to-cyan-500",
      },
      {
        id: "study_goals" as AcademicDrawerAction,
        section: "planning",
        label: "Study Goals",
        desc: "Target completion dates, chapter quotas & target rank/score",
        icon: Target,
        color: "from-teal-400 to-emerald-500",
      },

      // Analytics Section
      {
        id: "progress_analytics" as AcademicDrawerAction,
        section: "analytics",
        label: "Progress Analytics",
        desc: "Overall syllabus completion curve and study hours distribution",
        icon: BarChart2,
        color: "from-purple-400 to-indigo-500",
      },
      {
        id: "weak_topics" as AcademicDrawerAction,
        section: "analytics",
        label: "Weak Topics",
        desc: "AI-identified knowledge gaps with recommended practice sets",
        icon: AlertTriangle,
        badge: "AI Detected",
        color: "from-rose-400 to-red-500",
      },
      {
        id: "test_performance" as AcademicDrawerAction,
        section: "analytics",
        label: "Test Performance",
        desc: "Accuracy percentages, speed analysis & historical test records",
        icon: CheckCircle2,
        color: "from-emerald-400 to-teal-500",
      },
      {
        id: "study_streak" as AcademicDrawerAction,
        section: "analytics",
        label: "Study Streak",
        desc: "Daily consistency meter, active streaks & milestone badges",
        icon: Flame,
        badge: "Streak",
        color: "from-amber-400 to-orange-500",
      },
    ],
    []
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
      id: "study",
      title: "Study",
      items: filteredItems.filter((i) => i.section === "study"),
    },
    {
      id: "practice",
      title: "Practice",
      items: filteredItems.filter((i) => i.section === "practice"),
    },
    {
      id: "planning",
      title: "Planning",
      items: filteredItems.filter((i) => i.section === "planning"),
    },
    {
      id: "analytics",
      title: "Analytics",
      items: filteredItems.filter((i) => i.section === "analytics"),
    },
  ].filter((s) => s.items.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="academic-drawer-overlay"
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            id="academic-drawer-panel"
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
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5 flex items-center justify-center text-slate-950 font-bold shadow-md">
                    <GraduationCap className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base font-heading text-white flex items-center gap-2">
                      <span>Academic Intelligence</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {studentClassName}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {studentStream} • Dedicated Drawer Navigation
                    </p>
                  </div>
                </div>

                <button
                  id="close-academic-drawer-btn"
                  onClick={onClose}
                  aria-label="Close Academic Drawer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="academic-drawer-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search roadmap, tests, VVI topics, planners..."
                  className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
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

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
              {sections.map((sec) => (
                <div key={sec.id} className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between px-1">
                    <span>{sec.title}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {sec.items.length} options
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
                              ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500/40 shadow-sm"
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
                                <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors truncate">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredItems.length === 0 && (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-300">
                    No academic items match "{searchQuery}"
                  </p>
                  <p className="text-xs text-slate-500">
                    Try searching for Roadmap, MCQ, PYQs, or Planner.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between text-xs text-slate-400 font-mono shrink-0">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Academic Drawer Active
              </span>
              <span>1-Tap Switching</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
