import React from "react";
import {
  Sparkles,
  Timer,
  Droplet,
  Flame,
  BarChart2,
  Settings,
  X,
  BookOpen,
  CheckSquare,
  FileText,
  Home,
  Target,
  Calendar,
  Compass,
  GraduationCap,
  ShieldAlert,
  Users,
  Download,
} from "lucide-react";
import { ActiveTab } from "../types";

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  activeTab: ActiveTab;
  onOpenStudentModal?: () => void;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  activeTab,
  onOpenStudentModal,
}) => {
  if (!isOpen) return null;

  const moreItems = [
    {
      id: "exam" as ActiveTab,
      label: "Exam Intelligence",
      desc: "Board profile, readiness score, queue & mock tests",
      icon: ShieldAlert,
      color: "from-cyan-400 to-emerald-400",
      badge: "V1.4.2",
    },
    {
      id: "academic" as ActiveTab,
      label: "Academic Center",
      desc: "Class 12 stream subjects, VVI topics & revision",
      icon: GraduationCap,
      color: "from-emerald-400 to-cyan-400",
      badge: "V1.4.1",
    },
    {
      id: "career" as ActiveTab,
      label: "Career Center",
      desc: "Commerce & Science pathways & roadmaps",
      icon: Compass,
      color: "from-emerald-400 to-cyan-500",
      badge: "V1.4",
    },
    {
      id: "goals" as ActiveTab,
      label: "Goals Tracker",
      desc: "Milestones, categories & target dates",
      icon: Target,
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "calendar" as ActiveTab,
      label: "Academic Calendar",
      desc: "Exams, tasks & monthly planner",
      icon: Calendar,
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "abya" as ActiveTab,
      label: "Abya AI Assistant",
      desc: "Smart study planning & revision AI",
      icon: Sparkles,
      color: "from-emerald-500 to-cyan-500",
      badge: "AI Powered",
    },
    {
      id: "focus" as ActiveTab,
      label: "Focus Timer",
      desc: "Pomodoro sessions & break tracker",
      icon: Timer,
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "water" as ActiveTab,
      label: "Water Tracker",
      desc: "Daily hydration & glass counter",
      icon: Droplet,
      color: "from-blue-500 to-cyan-400",
    },
    {
      id: "habits" as ActiveTab,
      label: "Habit Tracker",
      desc: "Daily streaks & routine checks",
      icon: Flame,
      color: "from-rose-500 to-pink-500",
    },
    {
      id: "stats" as ActiveTab,
      label: "Advanced Analytics",
      desc: "Productivity score & study trends",
      icon: BarChart2,
      color: "from-purple-500 to-indigo-500",
    },
    {
      id: "download" as ActiveTab,
      label: "Download Official APK",
      desc: "Get Garia OS Android app v2.3",
      icon: Download,
      color: "from-emerald-500 to-teal-400",
      badge: "APK v2.3",
    },
    {
      id: "settings" as ActiveTab,
      label: "Settings",
      desc: "Theme, API config, data backup",
      icon: Settings,
      color: "from-slate-500 to-slate-400",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg glass-card rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <span>Garia OS Features</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Menu
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an OS module to open
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full glass-pill text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 overflow-y-auto">
          {onOpenStudentModal && (
            <button
              onClick={() => {
                onClose();
                onOpenStudentModal();
              }}
              className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-transparent border border-emerald-500/30 hover:border-emerald-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-emerald-400 p-2 flex items-center justify-center text-slate-950 font-bold shadow-md shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-white font-heading block">
                    Student Profiles & Switching
                  </span>
                  <span className="text-xs text-slate-400">
                    Manage multi-student profiles & isolated datasets
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                v1.5 Multi-User
              </span>
            </button>
          )}

          {moreItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all duration-200 group border ${
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                    : "glass-pill border-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} p-2 flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-100 font-heading">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 bg-emerald-400/20 text-emerald-300 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Footer Links */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Garia OS v1.4.2</span>
          <span>Abya AI Powered</span>
        </div>
      </div>
    </div>
  );
};
