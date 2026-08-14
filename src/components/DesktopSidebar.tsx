import React from "react";
import {
  Home,
  CheckSquare,
  BookOpen,
  FileText,
  Compass,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  Timer,
  Droplet,
  Flame,
  BarChart2,
  Settings,
  Users,
  Download,
  HelpCircle,
} from "lucide-react";
import { ActiveTab, UserSettings, StudentProfile } from "../types";
import { APP_VERSION } from "../constants/version";
import { AppLanguage, translations } from "../utils/i18n";

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  settings: UserSettings;
  activeStudent?: StudentProfile;
  currentLanguage?: AppLanguage;
  onOpenStudentModal?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onNavigate,
  settings,
  activeStudent,
  currentLanguage = "en",
  onOpenStudentModal,
}) => {
  const t = translations[currentLanguage] || translations.en;

  const navCategories = [
    {
      title: currentLanguage === "hi" ? "मुख्य नेविगेशन" : "Core Navigation",
      items: [
        { id: "home" as ActiveTab, label: t.homeDashboard || "Home Dashboard", icon: Home },
        { id: "academic" as ActiveTab, label: t.academics || "Academic Center", icon: GraduationCap, badge: "V3" },
        { id: "questionbank" as ActiveTab, label: t.questionBank || "Question Bank", icon: HelpCircle, badge: "New" },
        { id: "abya" as ActiveTab, label: t.abyaAICoach || "Abya AI Coach", icon: Sparkles, badge: "AI" },
      ],
    },
    {
      title: currentLanguage === "hi" ? "शैक्षणिक और करियर" : "Academic & Career",
      items: [
        { id: "career" as ActiveTab, label: t.careerCenter || "Career Center V3", icon: Compass, badge: "V3" },
        { id: "exam" as ActiveTab, label: t.examIntelligence || "Exam Intelligence", icon: ShieldAlert },
        { id: "study" as ActiveTab, label: t.studyTracker || "Study Tracker", icon: BookOpen },
        { id: "tasks" as ActiveTab, label: t.taskManager || "Task Manager", icon: CheckSquare },
      ],
    },
    {
      title: currentLanguage === "hi" ? "टूल्स और स्वास्थ्य" : "Tools & Wellness",
      items: [
        { id: "notes" as ActiveTab, label: t.notes || "Notes & Docs", icon: FileText },
        { id: "focus" as ActiveTab, label: t.focusTimer || "Focus Timer", icon: Timer },
        { id: "habits" as ActiveTab, label: t.habits || "Habits Tracker", icon: Flame },
        { id: "water" as ActiveTab, label: t.waterTracker || "Water Tracker", icon: Droplet },
        { id: "stats" as ActiveTab, label: t.analytics || "Analytics", icon: BarChart2 },
      ],
    },
    {
      title: currentLanguage === "hi" ? "प्लेटफ़ॉर्म" : "Platform",
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
      <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 mb-4 flex items-center justify-between gap-2">
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

      {/* Nav links */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-none">
        {navCategories.map((cat, idx) => (
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
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm"
                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
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
            </div>
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="pt-3 border-t border-white/10 text-center">
        <p className="text-xs text-slate-500 font-mono">Garia OS v{APP_VERSION}</p>
      </div>
    </aside>
  );
};

