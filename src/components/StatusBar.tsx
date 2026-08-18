import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Activity,
  HardDrive,
  User,
  Users,
  Settings,
  Cloud,
  CloudOff,
  LogOut,
  ChevronDown,
  Check,
  Plus,
  RotateCw,
  Calendar,
  Flame,
  Clock,
  Sparkles,
  Database,
  Zap,
  CloudUpload,
  Bot,
  SlidersHorizontal,
} from "lucide-react";
import {
  UserSettings,
  ActiveTab,
  StudentProfile,
  Goal,
  Habit,
  Task,
} from "../types";
import { APP_VERSION } from "../constants/version";
import { AppLanguage, translations } from "../utils/i18n";
import {
  subscribeToOfflineQueue,
  reconcilePendingQueueWithFirestore,
  OfflineQueueState,
} from "../utils/offlineQueue";

interface StatusBarProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onNavigate: (tab: ActiveTab) => void;
  activeTab: ActiveTab;
  activeStudent?: StudentProfile;
  profiles?: StudentProfile[];
  onSwitchProfile?: (profileId: string) => void;
  onLogout?: () => void;
  currentLanguage?: AppLanguage;
  onUpdateLanguage?: (lang: AppLanguage) => void;
  onOpenProfile?: () => void;
  onOpenStudentModal?: () => void;
  onOpenMoreMenu?: () => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenSavedItems?: () => void;
  onGoBack?: () => void;
  onOpenSliderMenu?: () => void;
  tasks?: Task[];
  goals?: Goal[];
  habits?: Habit[];
}

export const StatusBar: React.FC<StatusBarProps> = ({
  settings,
  onUpdateSettings,
  onNavigate,
  activeTab,
  activeStudent,
  profiles = [],
  onSwitchProfile,
  onLogout,
  currentLanguage = "en",
  onOpenProfile,
  onOpenStudentModal,
  onOpenMoreMenu,
  onOpenSearch,
  onOpenNotifications,
  onOpenSavedItems,
  onGoBack,
  onOpenSliderMenu,
  tasks = [],
  goals = [],
  habits = [],
}) => {
  const t = translations[currentLanguage] || translations.en;

  // Network Status & Sync Indicator State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState<boolean>(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [recentlySyncedToast, setRecentlySyncedToast] = useState<{ message: string; count?: number; timestamp: number } | null>(null);
  const prevReconcilingRef = useRef<boolean>(false);
  const prevPendingCountRef = useRef<number>(0);

  // Offline Pending Queue State
  const [offlineQueueState, setOfflineQueueState] = useState<OfflineQueueState>(() => ({
    pendingActions: [],
    pendingCount: 0,
    isReconciling: false,
    syncProgress: {
      total: 0,
      current: 0,
      percentage: 0,
      stage: "idle",
    },
    lastReconciledAt: null,
    lastReconciliationStatus: "idle",
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  }));

  const networkMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToOfflineQueue((qState) => {
      if (
        (prevReconcilingRef.current && !qState.isReconciling && qState.lastReconciliationStatus === "success") ||
        (qState.lastReconciliationStatus === "success" && qState.syncProgress.stage === "complete" && prevPendingCountRef.current > 0)
      ) {
        const syncedCount = prevPendingCountRef.current || 1;
        setRecentlySyncedToast({
          message: `${syncedCount} offline change${syncedCount > 1 ? "s" : ""} synced to Firestore`,
          count: syncedCount,
          timestamp: Date.now(),
        });
        setTimeout(() => {
          setRecentlySyncedToast(null);
        }, 4500);
      }
      prevReconcilingRef.current = qState.isReconciling;
      if (qState.pendingCount > 0) {
        prevPendingCountRef.current = qState.pendingCount;
      }

      setOfflineQueueState(qState);
      if (qState.lastReconciledAt) {
        setLastSyncTime(
          new Date(qState.lastReconciledAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTime("Just now");
      checkLivePing();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPingLatency(null);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      checkLivePing();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkLivePing = async () => {
    setIsCheckingConnection(true);
    const start = performance.now();
    try {
      const res = await fetch("/api/health", { cache: "no-store", method: "GET" });
      const duration = Math.round(performance.now() - start);
      if (res.ok) {
        setIsOnline(true);
        setPingLatency(duration);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } else {
        setPingLatency(null);
      }
    } catch {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsOnline(false);
      }
      setPingLatency(null);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (networkMenuRef.current && !networkMenuRef.current.contains(target)) {
        setIsNetworkMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
        setShowLogoutConfirm(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(target)) {
        setIsNotificationMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const studentName = activeStudent?.name || settings.userName || (currentLanguage === "hi" ? "विद्यार्थी" : "Student");
  const studentInitial = studentName.charAt(0).toUpperCase();

  const todayStr = new Date().toISOString().split("T")[0];
  const dueTodayTasks = tasks.filter((t) => t.date === todayStr && !t.completed);

  const dynamicNotifications = [
    ...dueTodayTasks.slice(0, 2).map((t, idx) => ({
      id: `task-due-${t.id || idx}`,
      type: "task" as const,
      title: `Task Due Today (${t.priority.toUpperCase()})`,
      message: t.title,
      timeAgo: "Today",
      priority: t.priority === "high" ? ("high" as const) : ("medium" as const),
      actionTab: "tasks" as ActiveTab,
      actionText: "View Task",
    })),
    ...habits.slice(0, 2).map((h, idx) => ({
      id: `habit-${h.id || idx}`,
      type: "habit" as const,
      title: "Daily Habit Streak",
      message: `Keep your ${h.streak || 0}-day streak! Complete "${h.title}" today.`,
      timeAgo: "Daily",
      priority: "medium" as const,
      actionTab: "habits" as ActiveTab,
      actionText: "Check In",
    })),
    ...goals.filter((g) => !g.completed).slice(0, 2).map((g, idx) => ({
      id: `goal-${g.id || idx}`,
      type: "goal" as const,
      title: "Active Goal",
      message: `"${g.title}" target date: ${g.targetDate || "Approaching"}.`,
      timeAgo: "Active",
      priority: "medium" as const,
      actionTab: "goals" as ActiveTab,
      actionText: "Update Goal",
    })),
  ];

  const unreadCount = dynamicNotifications.filter((n) => !readNotificationIds.has(n.id)).length;

  const markAllNotificationsRead = () => {
    setReadNotificationIds(new Set(dynamicNotifications.map((n) => n.id)));
  };

  const handleNotificationAction = (tab: ActiveTab, id: string) => {
    setReadNotificationIds((prev) => new Set([...prev, id]));
    setIsNotificationMenuOpen(false);
    onNavigate(tab);
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    } else {
      onNavigate("home");
      if (onOpenStudentModal) {
        onOpenStudentModal();
      }
    }
  };

  const getTabLabel = (tab: ActiveTab) => {
    switch (tab) {
      case "home":
        return "Home";
      case "tasks":
        return "Task Manager";
      case "focus":
        return "Focus Timer";
      case "habits":
        return "Habits";
      case "water":
        return "Water Tracker";
      case "exam":
        return "Exam Intelligence";
      case "career":
        return "Career Center";
      case "abya":
        return "Abya AI";
      case "notes":
        return "Notes";
      case "study":
        return "Study Tracker";
      case "goals":
        return "Goals";
      case "calendar":
        return "Calendar";
      case "stats":
        return "Analytics";
      case "settings":
        return "Settings";
      case "download":
        return "APK Download";
      default:
        return "Garia OS";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-white/10 px-3 sm:px-6 py-2 backdrop-blur-xl bg-slate-950/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left Section: Back button on non-home tabs, or Abya AI logo trigger on Home */}
        <div className="flex items-center gap-2 sm:gap-3">
          {activeTab !== "home" ? (
            <div className="flex items-center gap-2">
              {onGoBack && (
                <button
                  onClick={onGoBack}
                  id="header-back-button"
                  title="Go Back"
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all card-press"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline text-xs">Back</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-heading tracking-tight">
                  {getTabLabel(activeTab)}
                </h2>
              </div>
            </div>
          ) : (
            /* HOME DASHBOARD: Abya AI Logo Button (Opens Slider Menu) */
            <button
              onClick={onOpenSliderMenu}
              id="header-abya-logo-btn"
              title="Open Abya AI & System Settings Slider"
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all card-press group"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-white tracking-tight font-heading">
                    Abya AI
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    V3.0
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium leading-none">
                  {studentName} • {activeStudent?.classLevel || "Student"}
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Right Section: Sync indicator, Quick Search, Notifications, Student Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* SYNC STATUS PILL */}
          <button
            onClick={() => {
              setIsNetworkMenuOpen(true);
              setIsProfileMenuOpen(false);
              setIsNotificationMenuOpen(false);
            }}
            id="statusbar-sync-status-indicator"
            title={
              offlineQueueState.isReconciling
                ? `Syncing to Firestore (${offlineQueueState.syncProgress.percentage}%)`
                : !isOnline
                ? `Offline (${offlineQueueState.pendingCount} actions queued)`
                : "Firestore Cloud Synced"
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all card-press ${
              offlineQueueState.isReconciling
                ? "bg-cyan-950/70 border-cyan-500/50 text-cyan-300"
                : !isOnline
                ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                : offlineQueueState.pendingCount > 0
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-slate-800/60 border-white/10 text-slate-300 hover:text-white"
            }`}
          >
            {offlineQueueState.isReconciling ? (
              <>
                <RotateCw className="w-3 h-3 text-cyan-400 animate-spin" />
                <span className="font-mono text-[10px] font-bold text-cyan-200">
                  {offlineQueueState.syncProgress.percentage}%
                </span>
              </>
            ) : !isOnline ? (
              <>
                <CloudOff className="w-3 h-3 text-amber-400" />
                <span className="text-[11px]">Offline</span>
              </>
            ) : (
              <>
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline text-[11px]">Synced</span>
              </>
            )}
          </button>

          {/* QUICK SEARCH */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              id="header-search-btn"
              title="Search anything (Cmd+K)"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors card-press"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* NOTIFICATIONS BELL */}
          <div className="relative" ref={notificationMenuRef}>
            <button
              onClick={() => {
                setIsNotificationMenuOpen((prev) => !prev);
                setIsNetworkMenuOpen(false);
                setIsProfileMenuOpen(false);
              }}
              id="header-notification-btn"
              title="Notifications"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors relative card-press"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl bg-slate-900/98 border border-white/15 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
                  <span className="text-xs font-bold text-white">Notifications ({unreadCount})</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[10px] text-emerald-400 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto">
                  {dynamicNotifications.length > 0 ? (
                    dynamicNotifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationAction(item.actionTab, item.id)}
                        className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/5 cursor-pointer text-xs space-y-0.5"
                      >
                        <div className="font-bold text-slate-200">{item.title}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{item.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No pending notifications. All caught up!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SLIDER MENU LAUNCHER / PROFILE AVATAR */}
          <button
            onClick={onOpenSliderMenu}
            id="header-profile-slider-btn"
            title="Open Slider Menu"
            className="flex items-center gap-1.5 p-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all card-press"
          >
            <div
              className={`w-6 h-6 rounded-full bg-gradient-to-tr ${
                activeStudent?.avatarColor || "from-emerald-400 to-cyan-400"
              } flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-sm`}
            >
              {studentInitial}
            </div>
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 mr-1 hidden sm:inline" />
          </button>
        </div>
      </div>
    </header>
  );
};
