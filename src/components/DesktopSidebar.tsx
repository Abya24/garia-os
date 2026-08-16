import React from "react";
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
} from "lucide-react";
import { ActiveTab, UserSettings, StudentProfile } from "../types";
import { APP_VERSION } from "../constants/version";
import { ProductionVersionBadge } from "./ProductionVersionBadge";
import { AppLanguage, translations } from "../utils/i18n";

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
        { id: "gmail" as ActiveTab, label: "Gmail Center", icon: Mail, badge: "Google" },
        { id: "notes" as ActiveTab, label: t.notes || "Notes & Books", icon: FileText },
        { id: "stats" as ActiveTab, label: t.analytics || "Progress Analytics", icon: BarChart2 },
        { id: "study" as ActiveTab, label: t.studyTracker || "Study Tracker", icon: BookOpen },
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
    <aside className="hidden md:flex flex-col w-64 glass-card border-r border-white/10 h-[calc(100vh-53px)] sticky top-[53px] p-4 shrink-0">
      {/* Profile summary & Switcher button */}
      <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 mb-3 flex items-center justify-between gap-2">
        <button
          onClick={() => onNavigate("settings")}
          className="flex items-center gap-2.5 min-w-0 text-left group flex-1 cursor-pointer"
          title={t.profile || "Open Profile Settings"}
        >
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
              activeStudent?.avatarColor || "from-emerald-400 to-cyan-400"
            } p-0.5 flex items-center justify-center font-bold text-slate-900 shadow-md shrink-0 group-hover:scale-105 transition-transform`}
          >
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-white font-heading truncate group-hover:text-emerald-300 transition-colors">
              {studentName}
            </h4>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono truncate">
              {activeStudent ? `${activeStudent.classLevel || "Class 10"} • ${activeStudent.classLevel === "Class 10" ? "General" : activeStudent.stream || "General"}` : "Online OS"}
            </span>
          </div>
        </button>

        {onOpenStudentModal && (
          <button
            onClick={onOpenStudentModal}
            title={t.studentProfiles || "Switch Student Profile"}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 transition-all shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <Users className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Core 5 Navigation */}
      <div className="space-y-1 mb-3">
        <h5 className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center justify-between">
          <span>{currentLanguage === "hi" ? "कोर नेविगेशन" : "Core Navigation"}</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">V3</span>
        </h5>
        <div className="space-y-1">
          {coreNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
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
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>{currentLanguage === "hi" ? "मोर ड्रॉवर खोलें" : "Open More Drawer"}</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                Slide ➔
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Nav categories */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-none border-t border-white/5 pt-2">
        {modularDrawers.map((cat, idx) => (
          <div key={idx} className="space-y-1">
            <h5 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              {cat.title}
            </h5>
            <div className="space-y-0.5">
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-white/10 text-white border border-white/20 font-semibold"
                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isActive ? "text-emerald-400" : "text-slate-500"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0">
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
      <div className="pt-2 border-t border-white/10">
        <ProductionVersionBadge variant="footer" showCopy={true} />
      </div>
    </aside>
  );
};
