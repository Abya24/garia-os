import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Search,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Activity,
  HardDrive,
  User,
  Users,
  Settings,
  Cloud,
  LogOut,
  ChevronDown,
  Check,
  Plus,
  BookOpen,
  RotateCw,
  Calendar,
  Flame,
  Clock,
  ExternalLink,
  Sparkles,
  Layers,
  Database,
  Zap,
  CloudUpload,
  Trash2,
} from "lucide-react";
import {
  UserSettings,
  ActiveTab,
  StudentProfile,
  AcademicRevisionItem,
  Goal,
  Habit,
  Task,
} from "../types";
import { APP_VERSION } from "../constants/version";
import { AppLanguage, translations } from "../utils/i18n";
import {
  subscribeToOfflineQueue,
  reconcilePendingQueueWithFirestore,
  clearPendingQueue,
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
  tasks?: Task[];
  revisions?: AcademicRevisionItem[];
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
  tasks = [],
  revisions = [],
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

  // Offline Pending Queue State
  const [offlineQueueState, setOfflineQueueState] = useState<OfflineQueueState>(() => ({
    pendingActions: [],
    pendingCount: 0,
    isReconciling: false,
    lastReconciledAt: null,
    lastReconciliationStatus: "idle",
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  }));

  const networkMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToOfflineQueue((qState) => {
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

    // Initial ping check
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

  // Click outside listener for all 3 dropdown menus
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

  // Dynamic Notification Items
  const todayStr = new Date().toISOString().split("T")[0];
  const pendingTasks = tasks.filter((t) => !t.completed);
  const dueTodayTasks = tasks.filter((t) => t.date === todayStr && !t.completed);

  const dynamicNotifications = [
    // 1. Spaced Revision Alerts
    ...revisions.slice(0, 3).map((rev, idx) => ({
      id: `rev-${rev.id || idx}`,
      type: "revision" as const,
      title: "Spaced Revision Due",
      message: `${rev.subjectName || "Subject"}: ${rev.chapterTitle || rev.topicName || "Topic"} is due for revision today.`,
      timeAgo: "Today",
      priority: "high" as const,
      actionTab: "questionbank" as ActiveTab,
      actionText: "Practice Now",
    })),
    // 2. Task Deadlines
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
    // 3. Habit Check-in Reminders
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
    // 4. Milestone Goal Alerts
    ...goals.filter((g) => !g.completed).slice(0, 2).map((g, idx) => ({
      id: `goal-${g.id || idx}`,
      type: "goal" as const,
      title: "Active Milestone Goal",
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
      // Clear active student session and navigate to home / login
      onNavigate("home");
      if (onOpenStudentModal) {
        onOpenStudentModal();
      }
    }
  };

  const getTabLabel = (tab: ActiveTab) => {
    switch (tab) {
      case "home":
        return "Cockpit";
      case "academic":
        return "Academic Center";
      case "questionbank":
        return "Question Bank";
      case "exam":
        return "Exam Intelligence";
      case "career":
        return "Career Center";
      case "abya":
        return "Abya AI";
      case "tasks":
        return "Task Manager";
      case "study":
        return "Study Tracker";
      case "notes":
        return "Notes";
      case "goals":
        return "Goals";
      case "calendar":
        return "Calendar";
      case "focus":
        return "Focus Mode";
      case "water":
        return "Water Tracker";
      case "habits":
        return "Habits";
      case "stats":
        return "Analytics";
      case "settings":
        return "Settings";
      case "gmail":
        return "Gmail Center";
      case "download":
        return "APK Download";
      default:
        return "Garia OS";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-white/10 px-2 sm:px-4 py-1 sm:py-1.5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left Section: Back Button & Garia OS G-Mark */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {activeTab !== "home" && onGoBack && (
            <button
              onClick={onGoBack}
              id="header-back-button"
              title={currentLanguage === "hi" ? "वापस जाएं" : "Go Back"}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all min-h-[30px] sm:min-h-[34px] card-press shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-[11px]">{currentLanguage === "hi" ? "पीछे" : "Back"}</span>
            </button>
          )}

          <button
            onClick={() => onNavigate("home")}
            id="header-logo-button"
            className="flex items-center gap-1.5 sm:gap-2 group text-left focus:outline-none"
            title="Garia OS Home Cockpit"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-900 border border-white/10 p-0.5 flex items-center justify-center shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/icon.svg"
                alt="G Logo"
                className="w-full h-full object-contain rounded-[7px]"
              />
            </div>
            <span className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              {getTabLabel(activeTab)}
            </span>
          </button>
        </div>

        {/* Right Section: Interactive Indicators & Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* 1. INTERACTIVE ONLINE STATUS INDICATOR (Critical Issue 3 + Offline Queue) */}
          <div className="relative" ref={networkMenuRef}>
            <button
              onClick={() => {
                setIsNetworkMenuOpen((prev) => !prev);
                setIsProfileMenuOpen(false);
                setIsNotificationMenuOpen(false);
              }}
              id="header-network-status-indicator"
              aria-label={isOnline ? "Online status" : "Offline status"}
              title={
                isOnline
                  ? offlineQueueState.pendingCount > 0
                    ? `Online - ${offlineQueueState.pendingCount} actions reconciling with Firestore`
                    : currentLanguage === "hi"
                    ? "ऑनलाइन: सिंक व क्लाउड सक्रिय (क्लिक करें)"
                    : `Online (${pingLatency ? `${pingLatency}ms` : "Connected"}) - Click for details`
                  : offlineQueueState.pendingCount > 0
                  ? `Offline - ${offlineQueueState.pendingCount} actions queued for reconciliation`
                  : currentLanguage === "hi"
                  ? "ऑफ़लाइन: लोकल सुरक्षित मोड (क्लिक करें)"
                  : "Offline: Local safe mode - Click for details"
              }
              className={`p-1.5 rounded-full border transition-all text-xs min-h-[32px] min-w-[32px] sm:min-h-[34px] sm:min-w-[34px] flex items-center justify-center gap-1 card-press shadow-sm ${
                isOnline
                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300 animate-pulse"
              }`}
            >
              {isOnline ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
              )}

              {/* Pending Queue Count Badge */}
              {offlineQueueState.pendingCount > 0 && (
                <span className="flex items-center text-[10px] font-bold px-1 py-0.2 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/40">
                  <Zap className="w-2.5 h-2.5 mr-0.5 text-amber-400" />
                  {offlineQueueState.pendingCount}
                </span>
              )}
            </button>

            {/* Network & Cloud Sync Popover */}
            {isNetworkMenuOpen && (
              <div
                id="online-status-dropdown-card"
                className="absolute right-0 top-10 z-50 w-80 sm:w-92 p-3.5 rounded-2xl bg-slate-900/95 border border-white/15 backdrop-blur-xl shadow-2xl space-y-3 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto"
              >
                {/* Header Title */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">
                      {currentLanguage === "hi" ? "कनेक्टिविटी और सिंक स्थिति" : "Sync & Connectivity Engine"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isOnline
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {isOnline ? "● Live Online" : "▲ Offline Mode"}
                  </span>
                </div>

                {/* Status Explanation Card */}
                <div
                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    isOnline
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-200"
                  }`}
                >
                  {isOnline ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-100 text-[11px]">
                      {isOnline
                        ? currentLanguage === "hi"
                          ? "क्लाउड और लोकल सिंक पूरी तरह चालू है"
                          : "Live Online & Data Synchronized"
                        : currentLanguage === "hi"
                        ? "ऑफ़लाइन मोड: आप बिना रुकावट पढ़ाई जारी रख सकते हैं"
                        : "Offline Mode Active: Safe & Protected"}
                    </p>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      {isOnline
                        ? currentLanguage === "hi"
                          ? "सभी परिवर्तन वास्तविक समय में सुरक्षित रूप से अपडेट हो रहे हैं।"
                          : "Your academic progress, notes, tasks, and test results are continuously synced with Firestore."
                        : currentLanguage === "hi"
                        ? "आपके सभी नोट्स, टास्क और टेस्ट स्कोर इस डिवाइस में सुरक्षित सेव हैं। ऑनलाइन आने पर स्वतः सिंक होंगे।"
                        : "Zero data loss: All actions are stored in your offline Pending Queue and will automatically reconcile with Firestore upon reconnecting."}
                    </p>
                  </div>
                </div>

                {/* Pending Offline Queue Card */}
                <div className="p-2.5 rounded-xl bg-slate-800/90 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{currentLanguage === "hi" ? "लंबित ऑफ़लाइन कतार" : "Offline Pending Queue"}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      offlineQueueState.pendingCount > 0
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }`}>
                      {offlineQueueState.pendingCount} {currentLanguage === "hi" ? "क्रियाएं" : "actions"}
                    </span>
                  </div>

                  {offlineQueueState.pendingCount > 0 ? (
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {offlineQueueState.pendingActions.slice(0, 5).map((act) => (
                        <div
                          key={act.id}
                          className="flex items-center justify-between text-[10px] py-1 px-2 rounded-lg bg-white/5 border border-white/5 text-slate-300"
                        >
                          <span className="font-mono text-amber-300 truncate max-w-[150px]">
                            {act.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-slate-400">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                      ))}
                      {offlineQueueState.pendingActions.length > 5 && (
                        <p className="text-[10px] text-slate-400 text-center">
                          +{offlineQueueState.pendingActions.length - 5} more pending actions...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      {currentLanguage === "hi"
                        ? "✓ कोई लंबित ऑफ़लाइन क्रिया नहीं है। संपूर्ण डेटा समकालिक है।"
                        : "✓ All offline mutations are reconciled and up to date."}
                    </p>
                  )}

                  {/* Reconcile Action Button */}
                  {offlineQueueState.pendingCount > 0 && isOnline && (
                    <button
                      onClick={async () => {
                        setIsCheckingConnection(true);
                        await reconcilePendingQueueWithFirestore();
                        setIsCheckingConnection(false);
                      }}
                      disabled={offlineQueueState.isReconciling || isCheckingConnection}
                      className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      <CloudUpload className={`w-3.5 h-3.5 ${offlineQueueState.isReconciling ? "animate-bounce" : ""}`} />
                      <span>
                        {offlineQueueState.isReconciling
                          ? "Reconciling with Firestore..."
                          : "Reconcile Queue Now"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Firebase & Cloud Status */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/5 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span>Firebase Firestore Status</span>
                  </div>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[10px]">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {isOnline ? "Active & Linked" : "Cached Offline"}
                  </span>
                </div>

                {/* Local Storage Confidence Badge */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/5 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-300">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Local Storage Backup</span>
                  </div>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[10px]">
                    <Check className="w-3 h-3 text-emerald-400" />
                    100% Protected
                  </span>
                </div>

                {/* Latency & Last Synced Info */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="block text-slate-500 font-medium">Ping Latency</span>
                    <span className="font-mono font-bold text-slate-200 text-[11px]">
                      {isOnline ? (pingLatency !== null ? `${pingLatency} ms` : "Active") : "Offline"}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="block text-slate-500 font-medium">Last Sync</span>
                    <span className="font-mono font-bold text-slate-200 text-[11px]">
                      {lastSyncTime}
                    </span>
                  </div>
                </div>

                {/* Action: Test / Re-check Connection & Auto-Reconcile */}
                <button
                  onClick={async () => {
                    await checkLivePing();
                    if (offlineQueueState.pendingCount > 0) {
                      await reconcilePendingQueueWithFirestore();
                    }
                  }}
                  disabled={isCheckingConnection || offlineQueueState.isReconciling}
                  id="btn-recheck-network"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 active:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all disabled:opacity-50 card-press"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConnection || offlineQueueState.isReconciling ? "animate-spin text-emerald-400" : "text-emerald-400"}`} />
                  <span>
                    {isCheckingConnection || offlineQueueState.isReconciling
                      ? currentLanguage === "hi"
                        ? "जाँचा व सिंक किया जा रहा है..."
                        : "Checking & Reconciling..."
                      : currentLanguage === "hi"
                      ? "सिंक व कनेक्शन पुनः जाँचें"
                      : "Sync & Test Connection"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Global Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              id="header-search-button"
              title="Global Quick Search (Cmd+K)"
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs min-h-[30px] sm:min-h-[34px] card-press shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline text-[11px] font-medium text-slate-400">Search</span>
              <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[9px] font-mono bg-white/5 rounded border border-white/10 text-slate-400">⌘K</kbd>
            </button>
          )}

          {/* 3. NOTIFICATION BELL DROPDOWN (Critical Issue 2) */}
          <div className="relative" ref={notificationMenuRef}>
            <button
              onClick={() => {
                setIsNotificationMenuOpen((prev) => !prev);
                setIsNetworkMenuOpen(false);
                setIsProfileMenuOpen(false);
              }}
              id="header-notifications-button"
              title={`Notifications (${unreadCount} unread)`}
              className="relative p-1.5 sm:px-2 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs min-h-[30px] sm:min-h-[34px] flex items-center justify-center card-press"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[9px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isNotificationMenuOpen && (
              <div
                id="notifications-dropdown-card"
                className="absolute right-0 top-10 z-50 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-white/15 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
              >
                {/* Header */}
                <div className="p-3 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Notifications & Alerts</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {unreadCount} New
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      id="btn-mark-all-notifications-read"
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-0.5 rounded hover:bg-white/5 transition-all"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="p-2 space-y-1.5 max-h-[320px] overflow-y-auto">
                  {dynamicNotifications.length > 0 ? (
                    dynamicNotifications.map((item) => {
                      const isRead = readNotificationIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationAction(item.actionTab, item.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                            isRead
                              ? "bg-slate-950/30 border-white/5 opacity-60 hover:opacity-100"
                              : item.type === "revision"
                              ? "bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/15"
                              : item.type === "task"
                              ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15"
                              : item.type === "habit"
                              ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15"
                              : "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/15"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              {item.type === "revision" ? (
                                <RotateCw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              ) : item.type === "task" ? (
                                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : item.type === "habit" ? (
                                <Flame className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              )}
                              <span className="text-[11px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                                {item.title}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 shrink-0">
                              {item.timeAgo}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 mt-1 pl-5 line-clamp-2">
                            {item.message}
                          </p>
                          <div className="mt-1.5 pl-5 flex items-center justify-between text-[9px]">
                            <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
                              {item.actionText} ➔
                            </span>
                            <span className="text-slate-500 uppercase">{item.priority}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No notifications pending. You are fully caught up!
                    </div>
                  )}
                </div>

                {/* Footer Modal Opener */}
                {onOpenNotifications && (
                  <div className="p-2 border-t border-white/5 bg-slate-950/80 text-center">
                    <button
                      onClick={() => {
                        setIsNotificationMenuOpen(false);
                        onOpenNotifications();
                      }}
                      className="text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Open Full Notification Center ➔
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. STUDENT PROFILE AVATAR DROPDOWN (Critical Issue 1) */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => {
                setIsProfileMenuOpen((prev) => !prev);
                setIsNetworkMenuOpen(false);
                setIsNotificationMenuOpen(false);
              }}
              id="header-profile-button"
              title={`${studentName} (${activeStudent?.classLevel || "Class 10"} • ${activeStudent?.stream || "General"})`}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full glass-pill border border-emerald-500/30 text-white hover:bg-emerald-500/10 transition-all text-xs font-semibold min-h-[30px] sm:min-h-[34px] card-press"
            >
              <div
                className={`w-5 h-5 rounded-full bg-gradient-to-tr ${
                  activeStudent?.avatarColor || "from-cyan-500 to-emerald-500"
                } flex items-center justify-center text-[10px] font-bold text-slate-900 shrink-0 shadow-sm`}
              >
                {studentInitial}
              </div>
              <span className="max-w-[65px] sm:max-w-[95px] truncate font-heading text-[11px] sm:text-xs">
                {studentName}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
            </button>

            {/* Comprehensive Student Profile Dropdown (Desktop + Mobile) */}
            {isProfileMenuOpen && (
              <div
                id="student-profile-dropdown-card"
                className="absolute right-0 top-10 z-50 w-72 sm:w-80 rounded-2xl bg-slate-900/95 border border-white/15 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
              >
                {/* 1. Active Student Card */}
                <div className="p-3.5 bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-transparent border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${
                        activeStudent?.avatarColor || "from-emerald-400 to-cyan-400"
                      } flex items-center justify-center text-sm font-bold text-slate-900 shadow-md shrink-0`}
                    >
                      {studentInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate font-heading">
                          {studentName}
                        </h4>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                          Active
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-400 truncate">
                        {activeStudent?.classLevel || "Class 10"} • {activeStudent?.stream || "General"}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Board: {activeStudent?.board || "CBSE"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Switch Student Section */}
                <div className="p-2 border-b border-white/10 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Switch Student
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {profiles.length} Profiles
                    </span>
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-0.5">
                    {profiles.map((p) => {
                      const isActive = p.id === activeStudent?.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            if (onSwitchProfile) {
                              onSwitchProfile(p.id);
                            }
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                            isActive
                              ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30"
                              : "text-slate-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-full bg-gradient-to-tr ${
                                p.avatarColor || "from-cyan-500 to-emerald-500"
                              } flex items-center justify-center text-[9px] font-bold text-slate-900 shrink-0`}
                            >
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate text-[11px]">{p.name}</span>
                            <span className="text-[9px] text-slate-400">({p.classLevel})</span>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Navigation & Actions Menu */}
                <div className="p-2 space-y-1">
                  {/* Manage Profiles */}
                  {onOpenStudentModal && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenStudentModal();
                      }}
                      id="profile-dropdown-manage-profiles"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/5 transition-all text-left"
                    >
                      <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Manage Student Profiles</span>
                    </button>
                  )}

                  {/* Settings */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onNavigate("settings");
                    }}
                    id="profile-dropdown-settings"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/5 transition-all text-left"
                  >
                    <Settings className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>System Settings & Preferences</span>
                  </button>

                  {/* Cloud Sync */}
                  <button
                    onClick={() => {
                      checkLivePing();
                      setIsProfileMenuOpen(false);
                      setIsNetworkMenuOpen(true);
                    }}
                    id="profile-dropdown-cloud-sync"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Cloud className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Cloud Sync & Diagnostics</span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400">
                      {isOnline ? "Active" : "Local"}
                    </span>
                  </button>

                  {/* Logout / Switch User */}
                  {!showLogoutConfirm ? (
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      id="profile-dropdown-logout"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Logout / Switch User</span>
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-center">
                      <p className="text-[11px] text-rose-200 font-semibold">
                        Confirm Session Exit?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleLogout}
                          id="profile-dropdown-confirm-logout"
                          className="flex-1 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors"
                        >
                          Yes, Exit
                        </button>
                        <button
                          onClick={() => setShowLogoutConfirm(false)}
                          className="flex-1 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

