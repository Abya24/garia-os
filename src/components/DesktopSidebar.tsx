import React, { useState, useEffect } from "react";
import {
  Home,
  CheckSquare,
  Timer,
  Sparkles,
  Layers,
  GraduationCap,
  HelpCircle,
  Compass,
  ShieldAlert,
  FileText,
  BarChart2,
  Settings,
  Users,
  Download,
  BookOpen,
  Mail,
  Calendar,
  Flame,
  Maximize2,
  Columns,
  Grid,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { ActiveTab, UserSettings, StudentProfile } from "../types";
import { APP_VERSION } from "../constants/version";
import { ProductionVersionBadge } from "./ProductionVersionBadge";
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

  // 3-Mode Sidebar State with LocalStorage Persistence (Critical Issue 4)
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
      title: currentLanguage === "hi" ? "मॉड्यूल व ड्रॉवर्स" : "Modules & Drawers",
      items: [
        { id: "academic" as ActiveTab, label: t.academics || "Academic Center", icon: GraduationCap, badge: "Drawer" },
        { id: "questionbank" as ActiveTab, label: t.questionBank || "Question Bank", icon: HelpCircle, badge: "Drawer" },
        { id: "career" as ActiveTab, label: t.careerCenter || "Career Center", icon: Compass, badge: "Drawer" },
        { id: "exam" as ActiveTab, label: t.examIntelligence || "Exam Intelligence", icon: ShieldAlert, badge: "Drawer" },
        { id: "calendar" as ActiveTab, label: t.calendar || "Calendar & Sync", icon: Calendar },
        { id: "gmail" as ActiveTab, label: "Gmail Center", icon: Mail, badge: "Google" },
        { id: "notes" as ActiveTab, label: t.notes || "Notes & Books", icon: FileText },
        { id: "stats" as ActiveTab, label: t.analytics || "Progress Analytics", icon: BarChart2 },
        { id: "study" as ActiveTab, label: t.studyTracker || "Study Tracker", icon: BookOpen },
        { id: "habits" as ActiveTab, label: t.habits || "Habits & Streaks", icon: Flame },
      ],
    },
    {
      title: currentLanguage === "hi" ? "सिस्टम" : "Platform",
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
      {/* 3-Mode Segmented Switcher (Critical Issue 4) */}
      <div className={`flex items-center mb-2.5 ${isIconsOnly ? "justify-center w-full" : "justify-between w-full"}`}>
        {!isIconsOnly && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            {isExpanded ? (currentLanguage === "hi" ? "विस्तारित दृश्य" : "Expanded Mode") : (currentLanguage === "hi" ? "कॉम्पैक्ट" : "Compact Mode")}
          </span>
        )}

        <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-xl p-0.5 shadow-inner gap-0.5">
          {/* Mode 1: Icons Only */}
          <button
            onClick={() => handleSetMode("icons_only")}
            title="Icons Only Mode"
            aria-label="Icons Only Mode"
            className={`p-1 rounded-lg transition-all ${
              isIconsOnly
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Mode 2: Compact */}
          <button
            onClick={() => handleSetMode("compact")}
            title="Compact Mode (192px)"
            aria-label="Compact Mode"
            className={`p-1 rounded-lg transition-all ${
              isCompact
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          {/* Mode 3: Expanded */}
          <button
            onClick={() => handleSetMode("expanded")}
            title="Expanded Mode (256px)"
            aria-label="Expanded Mode"
            className={`p-1 rounded-lg transition-all ${
              isExpanded
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Profile summary & Switcher button */}
      <div
        className={`rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 mb-3 flex items-center ${
          isIconsOnly ? "p-1.5 justify-center w-full" : isCompact ? "p-2 justify-between gap-1.5 w-full" : "p-2.5 justify-between gap-2 w-full"
        }`}
      >
        <button
          onClick={() => onNavigate("settings")}
          className={`flex items-center min-w-0 text-left group cursor-pointer ${
            isIconsOnly ? "justify-center" : "gap-2 flex-1"
          }`}
          title={`${studentName} - ${t.profile || "Profile"}`}
        >
          <div
            className={`rounded-xl bg-gradient-to-tr ${
              activeStudent?.avatarColor || "from-emerald-400 to-cyan-400"
            } p-0.5 flex items-center justify-center font-bold text-slate-900 shadow-md shrink-0 group-hover:scale-105 transition-transform ${
              isIconsOnly ? "w-8 h-8 text-xs" : isCompact ? "w-7 h-7 text-[11px]" : "w-8 h-8 text-xs"
            }`}
          >
            {studentName.charAt(0).toUpperCase()}
          </div>
          {!isIconsOnly && (
            <div className="min-w-0">
              <h4 className={`font-bold text-white font-heading truncate group-hover:text-emerald-300 transition-colors ${isCompact ? "text-[11px]" : "text-xs"}`}>
                {studentName}
              </h4>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono truncate">
                {activeStudent ? `${activeStudent.classLevel || "Class 10"}` : "Online"}
              </span>
            </div>
          )}
        </button>

        {!isIconsOnly && onOpenStudentModal && (
          <button
            onClick={onOpenStudentModal}
            title={t.studentProfiles || "Switch Student Profile"}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 transition-all shrink-0 flex items-center justify-center"
          >
            <Users className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Primary Core 4 Navigation */}
      <div className="space-y-1 mb-2.5 w-full">
        {!isIconsOnly && (
          <h5 className="px-2 text-[9px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center justify-between">
            <span>{currentLanguage === "hi" ? "कोर नेविगेशन" : "Core"}</span>
            <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">V3</span>
          </h5>
        )}
        <div className="space-y-1 w-full">
          {coreNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                className={`w-full flex items-center rounded-xl font-medium transition-all ${
                  isIconsOnly ? "justify-center p-2 text-xs" : isCompact ? "justify-between px-2.5 py-1.5 text-[11px]" : "justify-between px-3 py-1.5 text-xs"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className={`flex items-center ${isIconsOnly ? "justify-center" : "gap-2"}`}>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  {!isIconsOnly && <span className="truncate">{item.label}</span>}
                </div>
                {!isIconsOnly && item.badge && (
                  <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Drawer Launcher */}
          {onOpenMoreDrawer && (
            <button
              onClick={onOpenMoreDrawer}
              title={currentLanguage === "hi" ? "मोर ड्रॉवर खोलें" : "Open More Drawer"}
              className={`w-full flex items-center rounded-xl font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all group ${
                isIconsOnly ? "justify-center p-2 text-xs" : isCompact ? "justify-between px-2.5 py-1.5 text-[11px]" : "justify-between px-3 py-1.5 text-xs"
              }`}
            >
              <div className={`flex items-center ${isIconsOnly ? "justify-center" : "gap-2"}`}>
                <Layers className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                {!isIconsOnly && <span>{currentLanguage === "hi" ? "ड्रॉवर" : "More Modules"}</span>}
              </div>
              {!isIconsOnly && (
                <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-300">
                  ➔
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Nav categories */}
      <div className="flex-1 space-y-2.5 overflow-y-auto w-full pr-0.5 scrollbar-none border-t border-white/5 pt-2">
        {modularDrawers.map((cat, idx) => (
          <div key={idx} className="space-y-0.5 w-full">
            {!isIconsOnly && (
              <h5 className="px-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono truncate">
                {cat.title}
              </h5>
            )}
            <div className="space-y-0.5 w-full">
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={item.label}
                    className={`w-full flex items-center rounded-xl font-medium transition-all ${
                      isIconsOnly ? "justify-center p-2 text-xs" : isCompact ? "justify-between px-2 py-1 text-[11px]" : "justify-between px-2.5 py-1 text-xs"
                    } ${
                      isActive
                        ? "bg-white/10 text-white border border-white/20 font-semibold"
                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                    }`}
                  >
                    <div className={`flex items-center ${isIconsOnly ? "justify-center" : "gap-2"} min-w-0`}>
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? "text-emerald-400" : "text-slate-500"
                        }`}
                      />
                      {!isIconsOnly && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isIconsOnly && isExpanded && item.badge && (
                      <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer info */}
      {!isIconsOnly && (
        <div className="pt-2 border-t border-white/10 w-full">
          <ProductionVersionBadge variant="footer" showCopy={true} />
        </div>
      )}
    </aside>
  );
};
