import React from "react";
import {
  Home,
  CheckSquare,
  BookOpen,
  FileText,
  Target,
  Calendar,
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
} from "lucide-react";
import { ActiveTab, UserSettings, StudentProfile } from "../types";

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  settings: UserSettings;
  activeStudent?: StudentProfile;
  onOpenStudentModal?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onNavigate,
  settings,
  activeStudent,
  onOpenStudentModal,
}) => {
  const navItems = [
    { id: "home" as ActiveTab, label: "Dashboard", icon: Home },
    { id: "exam" as ActiveTab, label: "Exam Center", icon: ShieldAlert, badge: "v1.4.2" },
    { id: "academic" as ActiveTab, label: "Academic Center", icon: GraduationCap, badge: "v1.4.1" },
    { id: "career" as ActiveTab, label: "Career Center", icon: Compass, badge: "v1.4" },
    { id: "tasks" as ActiveTab, label: "Task Manager", icon: CheckSquare },
    { id: "study" as ActiveTab, label: "Study Tracker", icon: BookOpen },
    { id: "notes" as ActiveTab, label: "Notes System", icon: FileText },
    { id: "abya" as ActiveTab, label: "Abya AI", icon: Sparkles, badge: "AI" },
    { id: "focus" as ActiveTab, label: "Focus Timer", icon: Timer },
    { id: "water" as ActiveTab, label: "Water Tracker", icon: Droplet },
    { id: "habits" as ActiveTab, label: "Habits Tracker", icon: Flame },
    { id: "stats" as ActiveTab, label: "Analytics", icon: BarChart2 },
    { id: "settings" as ActiveTab, label: "Settings", icon: Settings },
  ];

  const studentName = activeStudent?.name || settings.userName;

  return (
    <aside className="hidden md:flex flex-col w-64 glass-card border-r border-white/10 h-[calc(100vh-53px)] sticky top-[53px] p-4 shrink-0">
      {/* Profile summary & Switcher button */}
      <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
              activeStudent?.avatarColor || "from-emerald-400 to-cyan-400"
            } p-0.5 flex items-center justify-center font-bold text-slate-900 shadow-md shrink-0`}
          >
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-white font-heading truncate">
              {studentName}
            </h4>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              {activeStudent ? `${activeStudent.stream} • ${activeStudent.board}` : "Online OS"}
            </span>
          </div>
        </div>

        {onOpenStudentModal && (
          <button
            onClick={onOpenStudentModal}
            title="Switch Student Profile"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 transition-all shrink-0"
          >
            <Users className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="pt-3 border-t border-white/10 text-center">
        <p className="text-xs text-slate-500 font-mono">Garia OS • Abya AI</p>
      </div>
    </aside>
  );
};
