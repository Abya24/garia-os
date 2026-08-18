import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Palette,
  Shield,
  Bell,
  Database,
  HelpCircle,
  ChevronDown,
  Globe,
  Smartphone,
  Lock,
  Key,
  ShieldCheck,
  RotateCw,
  Cloud,
  Download,
  Upload,
  Trash2,
  Info,
  Sparkles,
  Star,
  Check,
  Moon,
  ExternalLink,
  ChevronRight,
  Sparkle,
} from "lucide-react";
import { ActiveTab, StudentProfile, UserSettings, AppTheme } from "../types";
import { APP_VERSION } from "../constants/version";
import { AppLanguage, translations } from "../utils/i18n";
import {
  reconcilePendingQueueWithFirestore,
  subscribeToOfflineQueue,
  clearPendingQueue,
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
  activeTab,
  currentLanguage = "en",
  onUpdateLanguage,
  onOpenStudentModal,
  activeStudent,
  settings,
  onUpdateSettings,
  onClearAllData,
}) => {
  // Expandable category state (accordion)
  const [expandedSection, setExpandedSection] = useState<string | null>("personalization");
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);

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
        setSyncStatusMsg(`Successfully synced (${res.processed} items)`);
      } else {
        setSyncStatusMsg("Sync attempted (offline or no queued actions)");
      }
    } catch {
      setSyncStatusMsg("Sync failed. Check connection.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 3500);
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
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-heading">
                    {currentLanguage === "hi" ? "अतिरिक्त सेटिंग्स व नियंत्रण" : "More & System Preferences"}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Garia OS V{APP_VERSION} • Minimalist Configuration
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close More Menu"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Expandable Accordion Categories */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {/* 1. PERSONALIZATION */}
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
                      <div className="text-[11px] text-slate-400">Themes, Language & Appearance</div>
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
                    {/* Theme selector */}
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
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">App Language</label>
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

              {/* 2. SECURITY */}
              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden bg-slate-800/40">
                <button
                  onClick={() => toggleSection("security")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Security</div>
                      <div className="text-[11px] text-slate-400">App Lock, PIN & Privacy</div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedSection === "security" ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </button>

                {expandedSection === "security" && (
                  <div className="p-3.5 pt-0 border-t border-white/5 space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Private Mode & App Lock</div>
                        <div className="text-[11px] text-slate-400">Protect student notes & sessions</div>
                      </div>
                      <button
                        onClick={() => {
                          if (settings && onUpdateSettings) {
                            onUpdateSettings({
                              ...settings,
                              account: settings.account
                                ? { ...settings.account, isPrivateMode: !settings.account.isPrivateMode }
                                : {
                                    email: "student@garia.os",
                                    passwordHash: "pin_set",
                                    name: activeStudent?.name || "Student",
                                    isPrivateMode: true,
                                    createdAt: Date.now(),
                                  },
                            });
                          }
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                          settings?.account?.isPrivateMode ? "bg-emerald-500" : "bg-slate-700"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-md ${
                            settings?.account?.isPrivateMode ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                      <span>Biometric Unlock Status:</span>
                      <span className="text-emerald-400 font-bold">Hardware Ready</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. NOTIFICATIONS */}
              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden bg-slate-800/40">
                <button
                  onClick={() => toggleSection("notifications")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Notifications</div>
                      <div className="text-[11px] text-slate-400">Study alerts, habits & deadlines</div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedSection === "notifications" ? "rotate-180 text-amber-400" : ""
                    }`}
                  />
                </button>

                {expandedSection === "notifications" && (
                  <div className="p-3.5 pt-0 border-t border-white/5 space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Master Notifications</div>
                        <div className="text-[11px] text-slate-400">Daily study & revision reminders</div>
                      </div>
                      <button
                        onClick={() => {
                          if (settings && onUpdateSettings) {
                            onUpdateSettings({
                              ...settings,
                              notificationsEnabled: !settings.notificationsEnabled,
                            });
                          }
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                          settings?.notificationsEnabled ? "bg-emerald-500" : "bg-slate-700"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-md ${
                            settings?.notificationsEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. DATA & BACKUP */}
              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden bg-slate-800/40">
                <button
                  onClick={() => toggleSection("data_backup")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Data & Backup</div>
                      <div className="text-[11px] text-slate-400">Firestore Cloud Sync, Export & Cleanup</div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedSection === "data_backup" ? "rotate-180 text-purple-400" : ""
                    }`}
                  />
                </button>

                {expandedSection === "data_backup" && (
                  <div className="p-3.5 pt-0 border-t border-white/5 space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Firestore Cloud Sync</div>
                        <div className="text-[11px] text-slate-400">
                          {pendingQueueCount > 0
                            ? `${pendingQueueCount} pending actions queued`
                            : "All data synced to cloud"}
                        </div>
                      </div>
                      <button
                        onClick={handleForceSync}
                        disabled={isSyncing}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                      </button>
                    </div>

                    {syncStatusMsg && (
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-center font-medium">
                        {syncStatusMsg}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => {
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
                          const downloadAnchor = document.createElement("a");
                          downloadAnchor.setAttribute("href", dataStr);
                          downloadAnchor.setAttribute("download", `Garia_OS_Backup_${Date.now()}.json`);
                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();
                          downloadAnchor.remove();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Export Backup</span>
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onNavigate("settings");
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Reset Data</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. SUPPORT */}
              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden bg-slate-800/40">
                <button
                  onClick={() => toggleSection("support")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Support & Info</div>
                      <div className="text-[11px] text-slate-400">Help, About Garia OS & Feedback</div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedSection === "support" ? "rotate-180 text-rose-400" : ""
                    }`}
                  />
                </button>

                {expandedSection === "support" && (
                  <div className="p-3.5 pt-0 border-t border-white/5 space-y-2 mt-2">
                    <button
                      onClick={() => setShowAbout(true)}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-slate-200 hover:bg-white/5 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-emerald-400" />
                        About Garia OS V3.0
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        setFeedbackSent(true);
                        setTimeout(() => setFeedbackSent(false), 3000);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-slate-200 hover:bg-white/5 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                        Student Feedback & Suggestions
                      </span>
                      {feedbackSent ? (
                        <span className="text-[10px] text-emerald-400 font-bold">Feedback Sent!</span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onNavigate("download");
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        Download Android APK (v{APP_VERSION})
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950/80 border-t border-white/10 text-center text-[10px] text-slate-500">
              Garia OS V3.0 • Play Store Quality Student Productivity OS
            </div>
          </motion.div>

          {/* About Modal */}
          {showAbout && (
            <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="glass-card rounded-3xl p-6 border border-white/15 bg-slate-900 max-w-sm w-full space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-6 h-6 text-slate-950" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white font-heading">Garia OS V3.0</h3>
                  <p className="text-xs text-slate-400">
                    A modern, minimal, student-focused productivity operating system.
                  </p>
                </div>
                <button
                  onClick={() => setShowAbout(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
