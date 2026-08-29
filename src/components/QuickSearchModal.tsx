import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  GraduationCap,
  HelpCircle,
  Sparkles,
  Compass,
  CheckSquare,
  FileText,
  ShieldAlert,
  Timer,
  Droplet,
  Flame,
  BarChart2,
  Settings,
  Download,
  Home,
  BookOpen,
  ArrowRight,
  Mail,
  Calendar,
  Target,
} from "lucide-react";
import { ActiveTab, StudentProfile } from "../types";
import { APP_VERSION } from "../constants/version";
import { formatStudentDisplayName } from "../utils/studentNameUtils";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  activeStudent?: StudentProfile;
}

interface SearchItem {
  id: string;
  tab: ActiveTab;
  title: string;
  category: "Navigation" | "Academics" | "Question Bank" | "Tools & Productivity";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  activeStudent,
}) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const searchableItems: SearchItem[] = [
    {
      id: "nav-home",
      tab: "home",
      title: "Home Dashboard",
      category: "Navigation",
      description: "Overview of your daily tasks, learning progress & study roadmap",
      icon: Home,
      tags: ["home", "dashboard", "overview", "today", "matrix", "streak"],
    },
    {
      id: "nav-abya",
      tab: "abya",
      title: "Abya AI Study Coach",
      category: "Navigation",
      description: "Ask doubts, solve academic questions, generate tests & explain topics",
      icon: Sparkles,
      tags: ["ai", "abya", "assistant", "doubt", "solver", "mentor", "tutor", "gemini", "ask"],
    },
    {
      id: "nav-career",
      tab: "career",
      title: "Career Center V3",
      category: "Academics",
      description: "Explore 50+ career paths across Science, Commerce, Arts, Govt Jobs & Scholarships",
      icon: Compass,
      tags: ["career", "roadmap", "jobs", "iit", "neet", "upsc", "ssc", "commerce", "ca", "scholarship", "study abroad", "salary"],
    },
    {
      id: "nav-exam",
      tab: "exam",
      title: "Exam Intelligence",
      category: "Academics",
      description: "Board profile, exam readiness score, high-yield question queue & mock tests",
      icon: ShieldAlert,
      tags: ["exam", "intelligence", "board", "readiness", "score", "weightage", "cbse", "bihar board", "icse"],
    },
    {
      id: "nav-calendar",
      tab: "calendar",
      title: "Calendar & Schedule Sync",
      category: "Tools & Productivity",
      description: "Google Calendar sync, exam timetables, study schedule & academic events",
      icon: Calendar,
      tags: ["calendar", "schedule", "events", "sync", "timetable", "google calendar", "reminder", "dates"],
    },
    {
      id: "nav-goals",
      tab: "goals",
      title: "Goals & Target Scores",
      category: "Tools & Productivity",
      description: "Academic targets, exam score goals, deadlines & milestone tracker",
      icon: Target,
      tags: ["goal", "target", "milestone", "score", "grades", "percentage"],
    },
    {
      id: "nav-study",
      tab: "study",
      title: "Study Tracker & Subject Timer",
      category: "Tools & Productivity",
      description: "Track study hours per subject, log active sessions & view subject breakdown",
      icon: BookOpen,
      tags: ["study", "tracker", "timer", "hours", "subject", "log"],
    },
    {
      id: "nav-tasks",
      tab: "tasks",
      title: "Task Manager & Daily Todo",
      category: "Tools & Productivity",
      description: "Manage daily tasks, priority tags, subject filters & completion streaks",
      icon: CheckSquare,
      tags: ["task", "todo", "manager", "matrix", "priority", "deadline"],
    },
    {
      id: "nav-notes",
      tab: "notes",
      title: "Notes & Document Editor",
      category: "Tools & Productivity",
      description: "Create rich markdown notes, study summaries, formulas & PDF exports",
      icon: FileText,
      tags: ["notes", "docs", "formula", "summary", "markdown", "write", "pdf"],
    },
    {
      id: "nav-focus",
      tab: "focus",
      title: "Focus Timer (Pomodoro)",
      category: "Tools & Productivity",
      description: "Deep study Pomodoro sessions with sound effects and break cycles",
      icon: Timer,
      tags: ["focus", "pomodoro", "timer", "deep work", "interval", "break"],
    },
    {
      id: "nav-habits",
      tab: "habits",
      title: "Habit Tracker",
      category: "Tools & Productivity",
      description: "Build consistent daily study routines, streaks and discipline",
      icon: Flame,
      tags: ["habit", "tracker", "streak", "routine", "discipline", "daily"],
    },
    {
      id: "nav-water",
      tab: "water",
      title: "Hydration & Water Tracker",
      category: "Tools & Productivity",
      description: "Log daily water intake and stay hydrated during long study hours",
      icon: Droplet,
      tags: ["water", "hydration", "health", "drink", "glasses"],
    },
    {
      id: "nav-stats",
      tab: "stats",
      title: "Productivity Analytics",
      category: "Tools & Productivity",
      description: "Comprehensive analytics of study time, tasks completed & efficiency trends",
      icon: BarChart2,
      tags: ["stats", "analytics", "graph", "productivity", "score", "charts"],
    },
    {
      id: "nav-settings",
      tab: "settings",
      title: "Student Profile & OS Settings",
      category: "Navigation",
      description: "Manage student profiles, class level, stream, private mode & backup",
      icon: Settings,
      tags: ["profile", "settings", "student", "class", "stream", "account", "backup", "dark mode", "language"],
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Keyboard shortcut listener for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? searchableItems.filter(
        (item) =>
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery) ||
          item.category.toLowerCase().includes(normalizedQuery) ||
          item.tags.some((tag) => tag.includes(normalizedQuery))
      )
    : searchableItems;

  const handleSelect = (tab: ActiveTab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <div
      id="quick-search-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="quick-search-modal"
        className="w-full max-w-xl glass-card rounded-2xl sm:rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden mt-6 sm:mt-16 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="p-3 sm:p-4 border-b border-white/10 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, questions, tools, notes, or apps..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-white/10 rounded">
              ESC
            </kbd>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-white sm:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Context Hint */}
        {activeStudent && (
          <div className="px-4 py-2 bg-slate-950/60 border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">
              Active: <strong className="text-slate-200" dir="ltr">{formatStudentDisplayName(activeStudent.name, "Student")}</strong> • {activeStudent.classLevel || "Class 10"} • {activeStudent.stream || "General"}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 shrink-0">
              {filteredItems.length} results
            </span>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 scrollbar-none">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.tab)}
                  className="w-full p-2.5 sm:p-3 rounded-xl bg-slate-900/50 hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-3 text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 group-hover:border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-white/5 uppercase font-mono">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No matching items found</p>
              <p className="text-xs text-slate-500">
                Try searching for "Math", "MCQ", "Notes", "Physics", "Career", or "Profile".
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Garia OS Unified Search</span>
          <button
            onClick={() => handleSelect("settings")}
            className="text-emerald-400 hover:underline font-semibold"
          >
            Open Profile Settings →
          </button>
        </div>
      </div>
    </div>
  );
};
