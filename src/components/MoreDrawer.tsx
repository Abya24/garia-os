import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Home,
  CheckSquare,
  Timer,
  Sparkles,
  ShieldAlert,
  Layers,
  BookOpen,
  FileText,
  Compass,
  Target,
  Calendar,
  Flame,
  Droplet,
  BarChart2,
  Settings,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { ActiveTab, StudentProfile, UserSettings } from "../types";
import { AppLanguage, translations } from "../utils/i18n";

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  activeTab: ActiveTab;
  currentLanguage?: AppLanguage;
  onUpdateLanguage?: (lang: AppLanguage) => void;
  onOpenStudentModal?: () => void;
  activeStudent?: StudentProfile;
  settings?: UserSettings;
  onUpdateSettings?: (settings: UserSettings) => void;
  onClearAllData?: () => void;
}

interface ModuleNavItem {
  id: ActiveTab;
  label: string;
  desc: string;
  category: "core" | "academic" | "planning";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  activeTab,
  currentLanguage = "en",
}) => {
  const t = translations[currentLanguage] || translations.en;
  const [categoryFilter, setCategoryFilter] = useState<"all" | "core" | "academic" | "planning">("all");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const allModules: ModuleNavItem[] = [
    {
      id: "home",
      label: t.home || "Home Dashboard",
      desc: "Daily overview, insights & tasks",
      category: "core",
      icon: Home,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      id: "tasks",
      label: t.tasks || "Task Manager",
      desc: "Priorities, subjects & to-do list",
      category: "core",
      icon: CheckSquare,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    },
    {
      id: "focus",
      label: t.focus || "Focus Timer",
      desc: "Pomodoro deep work & ambient audio",
      category: "core",
      icon: Timer,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
    },
    {
      id: "abya",
      label: t.abyaAI || "Abya AI Studio",
      desc: "ChatGPT-style doubt solver & study plans",
      category: "core",
      icon: Sparkles,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    },
    {
      id: "exam",
      label: t.examIntelligence || "Exam Center",
      desc: "Readiness, syllabus, mock tests & PYQs",
      category: "academic",
      icon: ShieldAlert,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    },
    {
      id: "flashcards",
      label: currentLanguage === "hi" ? "फ़्लैशकार्ड" : "Flashcards",
      desc: "Spaced repetition decks & active recall",
      category: "academic",
      icon: Layers,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      id: "study",
      label: t.studyTracker || "Study Tracker",
      desc: "Subject timers, chapter logs & hours",
      category: "academic",
      icon: BookOpen,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    },
    {
      id: "notes",
      label: t.notes || "Notes & Docs",
      desc: "Markdown notes, formulas & summaries",
      category: "academic",
      icon: FileText,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    },
    {
      id: "career",
      label: t.careerCenter || "Career Center",
      desc: "Stream roadmaps, exams & career paths",
      category: "academic",
      icon: Compass,
      color: "text-teal-400 bg-teal-500/10 border-teal-500/25",
    },
    {
      id: "goals",
      label: t.goals || "Goals & Targets",
      desc: "Academic milestones & target scores",
      category: "planning",
      icon: Target,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    },
    {
      id: "calendar",
      label: t.calendar || "Calendar & Events",
      desc: "Schedule, deadlines & Google Calendar sync",
      category: "planning",
      icon: Calendar,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
    },
    {
      id: "habits",
      label: t.habits || "Habits & Streaks",
      desc: "Daily study routines & consistency",
      category: "planning",
      icon: Flame,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/25",
    },
    {
      id: "water",
      label: t.waterTracker || "Water Tracker",
      desc: "Daily hydration log & reminders",
      category: "planning",
      icon: Droplet,
      color: "text-sky-400 bg-sky-500/10 border-sky-500/25",
    },
    {
      id: "stats",
      label: t.analytics || "Analytics",
      desc: "Performance trends & study insights",
      category: "planning",
      icon: BarChart2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      id: "settings",
      label: t.settings || "System Settings",
      desc: "Preferences, security, backup & themes",
      category: "planning",
      icon: Settings,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    },
  ];

  const filteredModules =
    categoryFilter === "all"
      ? allModules
      : allModules.filter((m) => m.category === categoryFilter);

  const renderModuleCard = (tool: ModuleNavItem) => {
    const Icon = tool.icon;
    const isCurrent = activeTab === tool.id;
    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => {
          onNavigate(tool.id);
          onClose();
        }}
        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all group cursor-pointer ${
          isCurrent
            ? "bg-emerald-500/15 border-emerald-500/40 text-white shadow-sm"
            : "bg-slate-900/85 hover:bg-slate-800/90 border-white/10 text-slate-200"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${tool.color}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate flex items-center gap-1.5 font-classic">
            <span className="truncate">{tool.label}</span>
            {isCurrent && (
              <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                · Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {tool.desc}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            id="more-modules-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-modules-drawer-title"
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-slate-950/98 text-slate-100 border-t border-amber-500/30 rounded-t-3xl shadow-2xl flex flex-col backdrop-blur-2xl overflow-hidden max-w-3xl mx-auto"
          >
            <div className="w-12 h-1.5 bg-amber-500/30 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {/* Header with Category Filter Dropdown */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div>
                <h2
                  id="more-modules-drawer-title"
                  className="text-base sm:text-lg font-bold text-white font-classic"
                >
                  {currentLanguage === "hi"
                    ? "मॉड्यूल निर्देशिका (Module Directory)"
                    : "Classic Module Directory"}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentLanguage === "hi"
                    ? "किसी भी अध्ययन मॉड्यूल पर सीधे जाएं"
                    : "Select any workspace module below"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-500/25">
                  <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <select
                    id="drawer-category-filter-select"
                    aria-label="Filter Drawer Modules"
                    value={categoryFilter}
                    onChange={(e) =>
                      setCategoryFilter(
                        e.target.value as "all" | "core" | "academic" | "planning"
                      )
                    }
                    className="bg-transparent text-xs font-bold text-amber-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-white">
                      All Modules ({allModules.length})
                    </option>
                    <option value="core" className="bg-slate-900 text-white">
                      Core Workspace (4)
                    </option>
                    <option value="academic" className="bg-slate-900 text-white">
                      Academic & Exams (5)
                    </option>
                    <option value="planning" className="bg-slate-900 text-white">
                      Planning & System (6)
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close More Menu"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Canonical Module Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-8 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredModules.map(renderModuleCard)}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
