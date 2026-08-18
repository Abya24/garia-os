import React, { useState } from "react";
import {
  X,
  Bell,
  CheckCircle2,
  Calendar,
  RotateCw,
  Award,
  Flame,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { ActiveTab, AcademicRevisionItem, Goal, Habit, Task } from "../types";

export interface NotificationItem {
  id: string;
  category: "academic" | "career" | "productivity";
  title: string;
  message: string;
  timeAgo: string;
  priority: "high" | "medium" | "low";
  actionTab?: ActiveTab;
  actionText?: string;
  read?: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  revisions?: AcademicRevisionItem[];
  goals?: Goal[];
  habits?: Habit[];
  tasks?: Task[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  revisions = [],
  goals = [],
  habits = [],
  tasks = [],
}) => {
  const [activeFilter, setActiveFilter] = useState<"all" | "academic" | "career" | "productivity">("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  // Build dynamic context notifications
  const dynamicNotifications: NotificationItem[] = [
    // 1. Academic Revisions Due
    ...revisions.slice(0, 2).map((rev, idx) => ({
      id: `acad-rev-${rev.id || idx}`,
      category: "academic" as const,
      title: "Spaced Revision Due Today",
      message: `${rev.subjectName || "Subject"}: ${rev.chapterTitle || rev.topicName || "Topic"} is scheduled for memory retention cycle.`,
      timeAgo: "Today",
      priority: "high" as const,
      actionTab: "study" as const,
      actionText: "Practice Topic",
    })),
    // 2. Goal Deadlines
    ...goals.filter((g) => !g.completed).slice(0, 2).map((g, idx) => ({
      id: `acad-goal-${g.id || idx}`,
      category: "academic" as const,
      title: "Active Milestone Goal",
      message: `"${g.title}" target date: ${g.targetDate || "Approaching"}. Currently ${g.progress || 0}% completed.`,
      timeAgo: "Active",
      priority: "medium" as const,
      actionTab: "goals" as const,
      actionText: "Update Goal",
    })),
    // 3. Career & Scholarship Alerts
    {
      id: "career-schol-1",
      category: "career" as const,
      title: "National Scholarship Portal & NTSE Alerts",
      message: "Applications open for Class 10 & 12 Merit-cum-Means Scholarships. Check eligibility and required documents.",
      timeAgo: "1d ago",
      priority: "medium" as const,
      actionTab: "career" as const,
      actionText: "Explore Scholarships",
    },
    {
      id: "career-exam-2",
      category: "career" as const,
      title: "Competitive Exam Registration Tracking",
      message: "Track upcoming application timelines for JEE, NEET, CUET, NDA and CA Foundation in Career Center.",
      timeAgo: "2d ago",
      priority: "low" as const,
      actionTab: "career" as const,
      actionText: "View Deadlines",
    },
    // 4. Productivity Habits & Focus
    ...habits.slice(0, 2).map((h, idx) => ({
      id: `prod-habit-${h.id || idx}`,
      category: "productivity" as const,
      title: "Daily Habit Check-in",
      message: `Keep your ${h.streak || 0}-day streak alive! Mark "${h.title}" for today.`,
      timeAgo: "Today",
      priority: "medium" as const,
      actionTab: "habits" as const,
      actionText: "Check Habit",
    })),
    {
      id: "prod-focus-1",
      category: "productivity" as const,
      title: "Focus Session Recommendation",
      message: "Boost today's retention score by doing a 25-minute Pomodoro deep study interval.",
      timeAgo: "Suggested",
      priority: "low" as const,
      actionTab: "focus" as const,
      actionText: "Start Focus",
    },
  ];

  const filtered = dynamicNotifications.filter((n) => {
    if (activeFilter === "all") return true;
    return n.category === activeFilter;
  });

  const handleAction = (tab?: ActiveTab, id?: string) => {
    if (id) {
      setReadIds((prev) => new Set([...prev, id]));
    }
    if (tab) {
      onNavigate(tab);
      onClose();
    }
  };

  const markAllRead = () => {
    const allIds = new Set(dynamicNotifications.map((n) => n.id));
    setReadIds(allIds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
                <span>Notifications Center</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {dynamicNotifications.length} Alerts
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Academic milestones, revision triggers & productivity updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 rounded-lg hover:bg-white/5 transition-all"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2.5 border-b border-white/5 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: "All Alerts" },
            { id: "academic", label: "Academic (Revisions & Tests)" },
            { id: "career", label: "Career & Scholarships" },
            { id: "productivity", label: "Habits & Focus" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1 max-h-[500px]">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const isRead = readIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                    isRead
                      ? "bg-slate-950/30 border-white/5 opacity-60"
                      : item.category === "academic"
                      ? "bg-slate-900/80 border-cyan-500/30 hover:border-cyan-400/50"
                      : item.category === "career"
                      ? "bg-slate-900/80 border-amber-500/30 hover:border-amber-400/50"
                      : "bg-slate-900/80 border-emerald-500/30 hover:border-emerald-400/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.category === "academic" ? (
                        <RotateCw className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : item.category === "career" ? (
                        <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-white">{item.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">{item.timeAgo}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          item.priority === "high"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : item.priority === "medium"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 pl-6">
                    <button
                      onClick={() => handleAction(item.actionTab, item.id)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                    >
                      <span>{item.actionText || "Open Module"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {!isRead && (
                      <button
                        onClick={() => setReadIds((prev) => new Set([...prev, item.id]))}
                        className="text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-60" />
              <p className="text-sm">All caught up! No unread alerts in this section.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Garia OS v3.0 Intelligence Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
