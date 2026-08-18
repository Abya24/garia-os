import React, { useState, useEffect } from "react";
import {
  Home,
  CheckSquare,
  Timer,
  Sparkles,
  Layers,
  Compass,
  ShieldAlert,
  FileText,
  BarChart2,
  Settings,
  Download,
  BookOpen,
  Calendar,
  Flame,
  Droplet,
  Target,
  Columns,
  Grid,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { ActiveTab, UserSettings, StudentProfile } from "../types";
import { APP_VERSION } from "../constants/version";
import { AppLanguage, translations } from "../utils/i18n";

export type SidebarMode = "expanded" | "compact" | "icons_only";

const SIDEBAR_MODE_STORAGE_KEY = "garia_sidebar_mode";

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenMoreDrawer?: () => void;
  settings: UserSettings;
  activeStudent?: StudentProfile;
  currentLanguage?: AppLanguage;
  onOpenStudentModal?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onNavigate,
  onOpenMoreDrawer,
  settings,
  activeStudent,
  currentLanguage = "en",
  onOpenStudentModal,
}) => {
  const t = translations[currentLanguage] || translations.en;

  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_MODE_STORAGE_KEY) as SidebarMode;
      if (saved && (saved === "expanded" || saved === "compact" || saved === "icons_only")) {
        return saved;
      }
    } catch {}
    if (typeof window !== "undefined") {
      if (window.innerWidth < 1100) return "icons_only";
      if (window.innerWidth < 1300) return "compact";
    }
    return "expanded";
  });

  const handleSetMode = (mode: SidebarMode) => {
    setSidebarMode(mode);
    try {
      localStorage.setItem(SIDEBAR_MODE_STORAGE_KEY, mode);
    } catch {}
  };

  const isExpanded = sidebarMode === "expanded";
  const isCompact = sidebarMode === "compact";
  const isIconsOnly = sidebarMode === "icons_only";

  const coreNavItems = [
    { id: "home" as ActiveTab, label: t.homeDashboard || "Home", icon: Home },
    { id: "tasks" as ActiveTab, label: t.taskManager || "Tasks", icon: CheckSquare },
    { id: "focus" as ActiveTab, label: t.focusTimer || "Focus", icon: Timer },
    { id: "abya" as ActiveTab, label: t.abyaAICoach || "Abya AI", icon: Sparkles, badge: "AI" },
  ];

  const modularDrawers = [
    {
      title: currentLanguage === "hi" ? "अध्ययन उपकरण" : "Productivity",
      items: [
        { id: "exam" as ActiveTab, label: t.examIntelligence || "Exam Intelligence", icon: ShieldAlert },
        { id: "habits" as ActiveTab, label: t.habits || "Habits & Streaks", icon: Flame },
        { id: "water" as ActiveTab, label: "Water Tracker", icon: Droplet },
        { id: "notes" as ActiveTab, label: t.notes || "Notes", icon: FileText },
        { id: "study" as ActiveTab, label: t.studyTracker || "Study Tracker", icon: BookOpen },
        { id: "goals" as ActiveTab, label: "Goals", icon: Target },
        { id: "calendar" as ActiveTab, label: t.calendar || "Calendar", icon: Calendar },
        { id: "stats" as ActiveTab, label: t.analytics || "Analytics", icon: BarChart2 },
        { id: "career" as ActiveTab, label: t.careerCenter || "Career Center", icon: Compass },
      ],
    },
    {
      title: currentLanguage === "hi" ? "सिस्टम" : "System",
      items: [
        { id: "download" as ActiveTab, label: t.downloadAPK || "Download APK", icon: Download, badge: `v${APP_VERSION}` },
        { id: "settings" as ActiveTab, label: t.settings || "Settings", icon: Settings },
      ],
    },
  ];

  const studentName = activeStudent?.name || settings.userName || (currentLanguage === "hi" ? "विद्यार्थी" : "Student");

  return (
    <aside
      className={`hidden md:flex flex-col glass-card border-r border-white/10 h-[calc(100vh-48px)] sticky top-[48px] shrink-0 transition-all duration-300 ${
        isExpanded ? "w-64 p-3.5" : isCompact ? "w-48 p-2.5" : "w-[68px] p-2 items-center"
      }`}
    >
      {/* 3-Mode Switcher */}
      <div className={`flex items-center mb-3 ${isIconsOnly ? "justify-center w-full" : "justify-between w-full"}`}>
        {!isIconsOnly && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            {isExpanded ? "Expanded" : "Compact"}
          </span>
        )}

        <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-xl p-0.5 shadow-inner gap-0.5">
          <button
            onClick={() => handleSetMode("icons_only")}
            title="Icons Only"
            aria-label="Icons Only Mode"
            className={`p-1 rounded-lg transition-all ${
              isIconsOnly
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleSetMode("compact")}
            title="Compact Mode"
            aria-label="Compact Mode"
            className={`p-1 rounded-lg transition-all ${
              isCompact
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleSetMode("expanded")}
            title="Expanded Mode"
            aria-label="Expanded Mode"
            className={`p-1 rounded-lg transition-all ${
              isExpanded
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Nav items list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar w-full">
        {/* Core Nav */}
        <div className="space-y-1">
          {coreNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all card-press ${
                  isActive
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                } ${isIconsOnly ? "justify-center px-0" : ""}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : ""}`} />
                {!isIconsOnly && (
                  <span className="text-xs truncate flex-1 text-left">{item.label}</span>
                )}
                {!isIconsOnly && item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modular Drawers */}
        {modularDrawers.map((grp, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isIconsOnly && (
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">
                {grp.title}
              </div>
            )}
            {grp.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all card-press ${
                    isActive
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  } ${isIconsOnly ? "justify-center px-0" : ""}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : ""}`} />
                  {!isIconsOnly && (
                    <span className="text-xs truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!isIconsOnly && item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-white/10 text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Student profile pill */}
      {!isIconsOnly && activeStudent && (
        <div className="pt-3 border-t border-white/10 mt-auto w-full">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-white/5">
            <div
              className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${
                activeStudent.avatarColor || "from-emerald-400 to-cyan-400"
              } flex items-center justify-center text-xs font-bold text-slate-950 shrink-0`}
            >
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{studentName}</div>
              <div className="text-[10px] text-slate-400 truncate">
                {activeStudent.classLevel || "Student"} • {activeStudent.stream || "General"}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
