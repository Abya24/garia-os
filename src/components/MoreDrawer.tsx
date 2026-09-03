import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Compass,
  BookOpen,
  FileText,
  Calendar,
  Target,
  BarChart2,
  Download,
  Palette,
  ShieldCheck,
  Bell,
  Database,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Globe,
  Settings,
  Sparkles,
  Sun,
  Star,
  Check,
  RotateCw,
} from "lucide-react";
import { ActiveTab, StudentProfile, UserSettings, AppTheme } from "../types";
import { APP_VERSION } from "../constants/version";
import { PWAInstallOption } from "./PWAInstallOption";
import { AppLanguage, translations } from "../utils/i18n";
import {
  reconcilePendingQueueWithFirestore,
  subscribeToOfflineQueue,
} from "../utils/offlineQueue";

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

export const MoreDrawer: React.FC<MoreDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentLanguage = "en",
  onUpdateLanguage,
  settings,
  onUpdateSettings,
}) => {
  // Expandable category state (accordion)
  const [expandedSection, setExpandedSection] = useState<string | null>("special_tools");
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);

  useEffect(() => {
    const unsub = subscribeToOfflineQueue((state) => {
      setPendingQueueCount(state.pendingCount);
    });
    return () => unsub();
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId));
  };

  const t = translations[currentLanguage] || translations.en;

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Reconciling with Firestore...");
    try {
      const res = await reconcilePendingQueueWithFirestore();
      if (res.success) {
        setSyncStatusMsg(`Synced (${res.processed} items)`);
      } else {
        setSyncStatusMsg("Cloud Synced");
      }
    } catch {
      setSyncStatusMsg("Offline (queued locally)");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 3000);
    }
  };

  const themes: { id: AppTheme; label: string; color: string }[] = [
    { id: "dark", label: "Dark Modern", color: "#0f172a" },
    { id: "amoled", label: "AMOLED Pure Black", color: "#000000" },
    { id: "midnight", label: "Midnight Navy", color: "#0b132b" },
    { id: "emerald", label: "Emerald Focus", color: "#064e3b" },
    { id: "graphite", label: "Graphite Studio", color: "#18181b" },
    { id: "arctic", label: "Arctic Frost", color: "#0c4a6e" },
    { id: "light", label: "Pure Light", color: "#f8fafc" },
    { id: "system", label: "System Default", color: "#334155" },
  ];

  const specialTools = [
    {
      id: "career" as ActiveTab,
      label: t.careerCenter || "Career Center",
      desc: "Science, Commerce, Arts, Govt Jobs & Roadmaps",
      icon: Compass,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      id: "study" as ActiveTab,
      label: t.studyTracker || "Study Tracker",
      desc: "Subject study logs, chapters & session timers",
      icon: BookOpen,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "notes" as ActiveTab,
      label: t.notes || "Notes & Docs",
      desc: "Rich markdown notes, tags & attachments",
      icon: FileText,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      id: "calendar" as ActiveTab,
      label: t.calendar || "Calendar & Events",
      desc: "Timetable, deadlines & scheduled events",
      icon: Calendar,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      id: "goals" as ActiveTab,
      label: t.goals || "Goals & Targets",
      desc: "Academic targets & milestone tracker",
      icon: Target,
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    },
    {
      id: "stats" as ActiveTab,
      label: t.analytics || "Advanced Analytics",
      desc: "Productivity scores & study trends",
      icon: BarChart2,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  ];

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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-slate-900/98 text-slate-100 border-t border-white/10 rounded-t-3xl shadow-2xl flex flex-col backdrop-blur-2xl overflow-hidden max-w-2xl mx-auto"
          >
            {/* Grab bar */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-heading">
                  More Features
                </h2>
                <p className="text-[11px] text-slate-400">
                  Specialized tools and advanced settings
                </p>
              </div>

              <button
                onClick={onClose}
                aria-label="Close More Menu"
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Expandable Categorized Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              
              {/* CATEGORY 1: SPECIAL & ADVANCED TOOLS */}
              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden bg-slate-800/40">
                <button
                  onClick={() => toggleSection("special_tools")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Special & Advanced Tools</div>
                      <div className="text-[11px] text-slate-400">Career, Study Logs, Notes, Analytics</div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedSection === "special_tools" ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </button>

                {expandedSection === "special_tools" && (
                  <div className="p-3.5 pt-0 border-t border-white/5 space-y-2 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {specialTools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => {
                              onNavigate(tool.id);
                              onClose();
                            }}
                            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-white/5 text-left flex items-start gap-2.5 transition-all group active:scale-98"
                          >
                            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${tool.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                {tool.label}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {tool.desc}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 mt-1 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CATEGORY 2: PERSONALIZATION */}
              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden bg-slate-800/40">
                <button
                  onClick={() => toggleSection("personalization")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Personalization</div>
                      <div className="text-[11px] text-slate-400">Themes, Solar Sync & Language</div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedSection === "personalization" ? "rotate-180 text-emerald-400" : ""
                    }`}
                  />
                </button>

                {expandedSection === "personalization" && (
                  <div className="p-3.5 pt-0 border-t border-white/5 space-y-3 mt-2">
                    {/* Theme Grid */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Theme</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {themes.map((th) => (
                          <button
                            key={th.id}
                            onClick={() => {
                              if (settings && onUpdateSettings) {
                                onUpdateSettings({ ...settings, theme: th.id });
                              }
                            }}
                            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                              settings?.theme === th.id
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold"
                                : "bg-slate-800/80 border-white/5 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: th.color }} />
                            <span className="truncate text-[11px]">{th.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language selector */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Language</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateLanguage && onUpdateLanguage("en")}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            currentLanguage === "en"
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                              : "bg-slate-800/80 border-white/5 text-slate-400"
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>English</span>
                        </button>
                        <button
                          onClick={() => onUpdateLanguage && onUpdateLanguage("hi")}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            currentLanguage === "hi"
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                              : "bg-slate-800/80 border-white/5 text-slate-400"
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>हिंदी (Hindi)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CATEGORY 3: CLOUD SYNC & SYSTEM */}
              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden bg-slate-800/40">
                <button
                  onClick={() => toggleSection("system")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">System & Cloud Sync</div>
                      <div className="text-[11px] text-slate-400">Cloud database, offline queue & settings</div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedSection === "system" ? "rotate-180 text-amber-400" : ""
                    }`}
                  />
                </button>

                {expandedSection === "system" && (
                  <div className="p-3.5 pt-0 border-t border-white/5 space-y-3 mt-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-white/5">
                      <div>
                        <div className="text-xs font-bold text-white">Cloud Firestore Sync</div>
                        <div className="text-[11px] text-slate-400">
                          {pendingQueueCount > 0
                            ? `${pendingQueueCount} pending actions in offline queue`
                            : "All data synced to cloud"}
                        </div>
                      </div>

                      <button
                        onClick={handleForceSync}
                        disabled={isSyncing}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                      </button>
                    </div>

                    {syncStatusMsg && (
                      <div className="text-xs text-emerald-400 font-mono text-center">
                        {syncStatusMsg}
                      </div>
                    )}

                    {/* PWA App Installation Option */}
                    <PWAInstallOption variant="menu-item" currentLanguage={currentLanguage} />

                    <button
                      onClick={() => {
                        onNavigate("settings");
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/5 text-xs font-bold text-slate-200 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>Open Full System Settings</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
