import React from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Users,
  ChevronRight,
} from "lucide-react";
import { ActiveTab, StudentProfile, UserSettings } from "../types";
import { PWAInstallOption } from "./PWAInstallOption";
import { AppLanguage, translations } from "../utils/i18n";
import {
  getStudentDisplayName,
  getStudentAvatarInitials,
} from "../utils/studentNameUtils";

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
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  activeTab,
  currentLanguage = "en",
  onOpenStudentModal,
  activeStudent,
  settings,
}) => {
  const t = translations[currentLanguage] || translations.en;
  const studentName = getStudentDisplayName(activeStudent, settings, "Student");

  const coreModules: ModuleNavItem[] = [
    {
      id: "home",
      label: t.home || "Home Dashboard",
      desc: "Daily overview, insights & tasks",
      icon: Home,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      id: "tasks",
      label: t.tasks || "Task Manager",
      desc: "Priorities, subjects & to-do list",
      icon: CheckSquare,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    },
    {
      id: "focus",
      label: t.focus || "Focus Timer",
      desc: "Pomodoro deep work & ambient audio",
      icon: Timer,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
    },
    {
      id: "abya",
      label: t.abyaAI || "Abya AI Coach",
      desc: "Doubt solver, study plans & mentor",
      icon: Sparkles,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    },
  ];

  const academicModules: ModuleNavItem[] = [
    {
      id: "exam",
      label: t.examIntelligence || "Exam Center",
      desc: "Readiness, syllabus, mock tests & PYQs",
      icon: ShieldAlert,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    },
    {
      id: "flashcards",
      label: currentLanguage === "hi" ? "फ़्लैशकार्ड" : "Flashcards",
      desc: "Spaced repetition decks & active recall",
      icon: Layers,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      id: "study",
      label: t.studyTracker || "Study Tracker",
      desc: "Subject timers, chapter logs & hours",
      icon: BookOpen,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    },
    {
      id: "notes",
      label: t.notes || "Notes & Docs",
      desc: "Markdown notes, formulas & summaries",
      icon: FileText,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    },
    {
      id: "career",
      label: t.careerCenter || "Career Center",
      desc: "Stream roadmaps, exams & career paths",
      icon: Compass,
      color: "text-teal-400 bg-teal-500/10 border-teal-500/25",
    },
  ];

  const planningModules: ModuleNavItem[] = [
    {
      id: "goals",
      label: t.goals || "Goals & Targets",
      desc: "Academic milestones & target scores",
      icon: Target,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    },
    {
      id: "calendar",
      label: t.calendar || "Calendar & Events",
      desc: "Schedule, deadlines & Google Calendar sync",
      icon: Calendar,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
    },
    {
      id: "habits",
      label: t.habits || "Habits & Streaks",
      desc: "Daily study routines & consistency",
      icon: Flame,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/25",
    },
    {
      id: "water",
      label: t.waterTracker || "Water Tracker",
      desc: "Daily hydration log & reminders",
      icon: Droplet,
      color: "text-sky-400 bg-sky-500/10 border-sky-500/25",
    },
    {
      id: "stats",
      label: t.analytics || "Analytics",
      desc: "Performance trends & study insights",
      icon: BarChart2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
  ];

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
            : "bg-slate-900/80 hover:bg-slate-800/90 border-white/10 text-slate-200"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${tool.color}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate flex items-center gap-1.5">
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            id="more-modules-drawer"
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] bg-slate-950/98 text-slate-100 border-t border-white/15 rounded-t-3xl shadow-2xl flex flex-col backdrop-blur-2xl overflow-hidden max-w-3xl mx-auto"
          >
            {/* Grab bar */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                  {currentLanguage === "hi"
                    ? "सभी मॉड्यूल और नेविगेशन"
                    : "All Modules & Workspace Navigation"}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentLanguage === "hi"
                    ? "किसी भी अध्ययन उपकरण, ट्रैकर या सेटिंग पर सीधे जाएं"
                    : "Jump directly to any study module, tracker, or system setting"}
                </p>
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-10 space-y-5 custom-scrollbar">
              {/* Active Student Profile & Quick Settings Strip */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                      activeStudent?.avatarColor || "from-emerald-400 to-cyan-400"
                    } flex items-center justify-center text-slate-950 font-bold text-sm shrink-0`}
                  >
                    {getStudentAvatarInitials(studentName)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate" dir="ltr">
                      {studentName}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {activeStudent?.classLevel || "Class 12"} ·{" "}
                      {activeStudent?.stream || "Commerce"} ·{" "}
                      {activeStudent?.board || "CBSE"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onOpenStudentModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenStudentModal();
                      }}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {currentLanguage === "hi" ? "प्रोफाइल बदलें" : "Switch Profile"}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate("settings");
                      onClose();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === "settings"
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300"
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{t.settings || "Settings"}</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Academic & Exam Modules */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-400 px-1">
                  {currentLanguage === "hi"
                    ? "01. शैक्षणिक और परीक्षा केंद्र"
                    : "01. Academic & Exam Intelligence"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {academicModules.map(renderModuleCard)}
                </div>
              </div>

              {/* Section 2: Planning, Habits & Analytics */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-400 px-1">
                  {currentLanguage === "hi"
                    ? "02. योजना, आदतें और विश्लेषण"
                    : "02. Planning, Habits & Analytics"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {planningModules.map(renderModuleCard)}
                </div>
              </div>

              {/* Section 3: Primary Daily Workspace */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-400 px-1">
                  {currentLanguage === "hi"
                    ? "03. मुख्य दैनिक कार्यक्षेत्र"
                    : "03. Core Daily Workspace"}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {coreModules.map((item) => {
                    const Icon = item.icon;
                    const isCurrent = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-emerald-500/15 border-emerald-500/40 text-white"
                            : "bg-slate-900/80 hover:bg-slate-800 border-white/10 text-slate-300"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center ${item.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white truncate">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: App Install & About Garia OS v3.0 */}
              <div className="pt-2 border-t border-white/10 space-y-2.5">
                <PWAInstallOption
                  variant="menu-item"
                  currentLanguage={currentLanguage}
                />

                <div
                  id="more-drawer-about-app-card"
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/25 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white font-heading">
                      Garia OS v3.0.0 · Focus & Execution Edition
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                      Stable
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {currentLanguage === "hi"
                      ? "नया रीडिज़ाइन: नाउ फोकस मोड स्टूडियो, त्वरित कार्य प्रबंधन, स्मार्ट होम डैशबोर्ड और ऑफ़लाइन-फर्स्ट क्लाउड सिंक।"
                      : "Redesigned with Now Focus Mode Studio, instant task execution, decluttered Bento Home Dashboard, and hybrid local/cloud sync."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
