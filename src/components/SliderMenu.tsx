import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  User,
  Users,
  Globe,
  Palette,
  Sun,
  Moon,
  Smartphone,
  Bell,
  LayoutGrid,
  Shield,
  Key,
  Lock,
  Unlock,
  KeyRound,
  Settings,
  Database,
  Cloud,
  HelpCircle,
  Info,
  Sparkles,
  Star,
  ChevronDown,
  ChevronRight,
  Check,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Sparkle,
} from "lucide-react";
import {
  UserSettings,
  StudentProfile,
  ActiveTab,
  AppTheme,
} from "../types";
import { APP_VERSION, APP_BUILD_DATE } from "../constants/version";
import { PWAInstallOption } from "./PWAInstallOption";
import { AppLanguage, translations } from "../utils/i18n";
import { getStudentDisplayName, getStudentAvatarInitials } from "../utils/studentNameUtils";
import { reconcilePendingQueueWithFirestore } from "../utils/offlineQueue";
import { PinManagementModal, PinModalMode } from "./PinManagementModal";
import { lockSession } from "../utils/security";
import { getWorkspaceSnapshot } from "../utils/storage";

interface SliderMenuProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  activeStudent?: StudentProfile;
  profiles: StudentProfile[];
  onSwitchProfile: (profileId: string) => void;
  onOpenStudentModal: () => void;
  currentLanguage: AppLanguage;
  onUpdateLanguage: (lang: AppLanguage) => void;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onNavigate: (tab: ActiveTab) => void;
  onClearAllData?: () => void;
  onLogout?: () => void;
  onLockApp?: () => void;
}

export const SliderMenu: React.FC<SliderMenuProps> = ({
  isOpen,
  onClose,
  settings,
  activeStudent,
  profiles,
  onSwitchProfile,
  onOpenStudentModal,
  currentLanguage,
  onUpdateLanguage,
  onUpdateSettings,
  onNavigate,
  onClearAllData,
  onLogout,
  onLockApp,
}) => {
  // Accordion / Dropdown States
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [appIconDropdownOpen, setAppIconDropdownOpen] = useState(false);

  // Modals & Interactive States
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedAppIcon, setSelectedAppIcon] = useState<string>("Classic Emerald");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // PIN Lock Management Modal State
  const [pinModalMode, setPinModalMode] = useState<PinModalMode | null>(null);

  const t = translations[currentLanguage] || translations.en;

  const themes: { id: AppTheme; name: string; color: string }[] = [
    { id: "dark", name: "Dark Modern", color: "#0f172a" },
    { id: "amoled", name: "AMOLED Pure Black", color: "#000000" },
    { id: "midnight", name: "Midnight Navy", color: "#0b132b" },
    { id: "emerald", name: "Emerald Focus", color: "#064e3b" },
    { id: "graphite", name: "Graphite Studio", color: "#18181b" },
    { id: "arctic", name: "Arctic Frost", color: "#0c4a6e" },
    { id: "light", name: "Pure Light", color: "#f8fafc" },
    { id: "system", name: "Auto System", color: "#334155" },
  ];

  const appIcons = [
    { id: "classic", name: "Classic Emerald", badge: "Default", color: "from-emerald-500 to-teal-600" },
    { id: "dark_minimal", name: "Obsidian Minimal", badge: "Pro", color: "from-slate-800 to-zinc-950" },
    { id: "neon_purple", name: "Neon Cyberpunk", badge: "Vibrant", color: "from-purple-500 to-indigo-600" },
    { id: "cyber_gold", name: "Academic Gold", badge: "Elite", color: "from-amber-400 to-orange-500" },
  ];

  const toggleAccordion = (sectionId: string) => {
    setOpenSection((prev) => (prev === sectionId ? null : sectionId));
  };

  const handleToggleNotification = () => {
    onUpdateSettings({
      ...settings,
      notificationsEnabled: !settings.notificationsEnabled,
    });
  };

  const handleToggleSolarTheme = () => {
    onUpdateSettings({
      ...settings,
      autoSolarTheme: !settings.autoSolarTheme,
    });
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    onUpdateSettings({
      ...settings,
      theme: newTheme,
    });
  };

  const handleLanguageChange = (newLang: AppLanguage) => {
    onUpdateLanguage(newLang);
  };

  const handleTogglePrivateMode = () => {
    if (settings.account) {
      onUpdateSettings({
        ...settings,
        account: {
          ...settings.account,
          isPrivateMode: !settings.account.isPrivateMode,
        },
      });
    } else {
      onUpdateSettings({
        ...settings,
        account: {
          email: "student@garia.os",
          passwordHash: "pin_enabled",
          name: activeStudent?.name || "Student",
          isPrivateMode: true,
          createdAt: Date.now(),
        },
      });
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Syncing to Firestore...");
    try {
      const res = await reconcilePendingQueueWithFirestore();
      if (res.success) {
        setSyncStatusMsg(`Synced ${res.processed} action(s)`);
      } else {
        setSyncStatusMsg("Synced with Cloud");
      }
    } catch {
      setSyncStatusMsg("Offline (queued locally)");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 3000);
    }
  };

  const handleExportData = () => {
    try {
      const snapshot = getWorkspaceSnapshot();
      const dataStr = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `garia-os-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
          />

          {/* Slide-over Panel: Clean, direct options, no double header */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="fixed top-0 bottom-0 left-0 z-50 w-full max-w-sm sm:max-w-md bg-slate-900/98 text-slate-100 border-r border-white/10 shadow-2xl flex flex-col backdrop-blur-2xl overflow-hidden"
          >
            {/* Minimalist Top Close Bar - No extra title, no logo+title combination */}
            <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">
                Options
              </span>
              <button
                onClick={onClose}
                id="slider-close-btn"
                aria-label="Close Slider Menu"
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors active:scale-95 border border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content - Direct to Categories */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
              
              {/* 1. ACCOUNT */}
              <div className="glass-card rounded-2xl border border-white/10 bg-slate-800/40 p-3.5 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Account</span>
                </div>

                <div className="space-y-2">
                  {/* Profile */}
                  <button
                    onClick={() => {
                      onNavigate("settings");
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-white/5 text-xs text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                        {getStudentAvatarInitials(getStudentDisplayName(activeStudent, settings, "Student"))}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs" dir="ltr">
                          {getStudentDisplayName(activeStudent, settings, "Student Profile")}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {activeStudent?.classLevel || "Class 12"} • {activeStudent?.stream || "General"}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Switch Student */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-white/5 text-xs text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Switch Student</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          profileDropdownOpen ? "rotate-180 text-emerald-400" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {profileDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="mt-1.5 p-1 rounded-xl bg-slate-800 border border-white/10 shadow-xl space-y-0.5 z-20"
                        >
                          {profiles.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                onSwitchProfile(p.id);
                                setProfileDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                activeStudent?.id === p.id
                                  ? "bg-emerald-500/20 text-emerald-300 font-bold"
                                  : "text-slate-300 hover:bg-white/5"
                              }`}
                            >
                              <span className="truncate">
                                {p.name} ({p.stream})
                              </span>
                              {activeStudent?.id === p.id && (
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </button>
                          ))}

                          <div className="pt-1 mt-1 border-t border-white/10">
                            <button
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                onOpenStudentModal();
                                onClose();
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            >
                              <span>+ Add / Manage Students</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* 2. PERSONALIZATION */}
              <div className="glass-card rounded-2xl border border-white/10 bg-slate-800/40 p-3.5 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Personalization</span>
                </div>

                <div className="space-y-3">
                  {/* Language */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <span>Language</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleLanguageChange("en")}
                        className={`py-1.5 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                          currentLanguage === "en"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                            : "bg-slate-800/70 border-white/5 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => handleLanguageChange("hi")}
                        className={`py-1.5 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                          currentLanguage === "hi"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                            : "bg-slate-800/70 border-white/5 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        हिंदी (Hindi)
                      </button>
                    </div>
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Palette className="w-3 h-3 text-slate-400" />
                        <span>Theme</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono capitalize">
                        {settings.theme || "dark"}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {themes.map((th) => (
                        <button
                          key={th.id}
                          onClick={() => handleThemeChange(th.id)}
                          className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                            settings.theme === th.id
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold"
                              : "bg-slate-800/70 border-white/5 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: th.color }}
                          />
                          <span className="truncate text-[10px]">{th.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Appearance (Solar Theme Auto-Sync) */}
                  <div className="p-2.5 rounded-xl bg-slate-800/70 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>Solar Sunrise/Sunset Sync</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Auto Light mode at dawn, Dark mode at dusk
                      </p>
                    </div>
                    <button
                      onClick={handleToggleSolarTheme}
                      className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center px-0.5 ${
                        settings.autoSolarTheme ? "bg-amber-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`w-4.5 h-4.5 rounded-full bg-white transition-transform transform shadow-sm ${
                          settings.autoSolarTheme ? "translate-x-4.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* App Icon Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setAppIconDropdownOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-white/5 text-xs text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        <span>App Icon: {selectedAppIcon}</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          appIconDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {appIconDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="mt-1.5 p-1.5 rounded-xl bg-slate-800 border border-white/10 shadow-xl space-y-1 z-20"
                        >
                          {appIcons.map((icon) => (
                            <button
                              key={icon.id}
                              onClick={() => {
                                setSelectedAppIcon(icon.name);
                                setAppIconDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                selectedAppIcon === icon.name
                                  ? "bg-emerald-500/20 text-emerald-300 font-bold"
                                  : "text-slate-300 hover:bg-white/5"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded-md bg-gradient-to-tr ${icon.color}`}
                                />
                                <span>{icon.name}</span>
                              </div>
                              <span className="text-[9px] px-1 rounded bg-white/10 text-slate-300">
                                {icon.badge}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* 3. PREFERENCES */}
              <div className="glass-card rounded-2xl border border-white/10 bg-slate-800/40 p-3.5 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Preferences</span>
                </div>

                <div className="space-y-2">
                  {/* Notifications */}
                  <div className="p-2.5 rounded-xl bg-slate-800/70 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Notifications</div>
                      <p className="text-[10px] text-slate-400">Study alerts, deadlines & habits</p>
                    </div>
                    <button
                      onClick={handleToggleNotification}
                      className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center px-0.5 ${
                        settings.notificationsEnabled ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`w-4.5 h-4.5 rounded-full bg-white transition-transform transform shadow-sm ${
                          settings.notificationsEnabled ? "translate-x-4.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Widgets */}
                  <div className="p-2.5 rounded-xl bg-slate-800/70 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Dashboard Widgets</div>
                        <p className="text-[10px] text-slate-400">7 core daily-use productivity blocks</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      7 Active
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. SECURITY */}
              <div className="glass-card rounded-2xl border border-white/10 bg-slate-800/40 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Security & App Lock</span>
                  </div>
                  {settings?.security?.enabled && settings?.security?.pinHash ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>PIN Protected</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-white/5">
                      No PIN Set
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-800/70 border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>App PIN Lock</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Secure study sessions, tasks & notes with a numeric code
                        </p>
                      </div>

                      {settings?.security?.enabled && settings?.security?.pinHash ? (
                        <button
                          onClick={() => setPinModalMode("remove")}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-colors"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={() => setPinModalMode("setup")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-sm transition-all"
                        >
                          Set PIN
                        </button>
                      )}
                    </div>

                    {settings?.security?.enabled && settings?.security?.pinHash && (
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        {/* Lock on App Launch Toggle */}
                        <div className="flex items-center justify-between text-xs py-1">
                          <span className="text-slate-300 font-medium">Require PIN on Launch</span>
                          <button
                            onClick={() => {
                              if (settings.security) {
                                onUpdateSettings({
                                  ...settings,
                                  security: {
                                    ...settings.security,
                                    lockOnLaunch: !settings.security.lockOnLaunch,
                                  },
                                });
                              }
                            }}
                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                              settings.security.lockOnLaunch ? "bg-emerald-500" : "bg-slate-700"
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                                settings.security.lockOnLaunch ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Action buttons: Change PIN & Lock Now */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => setPinModalMode("change")}
                            className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Change PIN</span>
                          </button>

                          <button
                            onClick={() => {
                              lockSession();
                              if (onLockApp) onLockApp();
                              onClose();
                            }}
                            className="py-1.5 px-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-[11px] font-bold text-purple-300 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                          >
                            <Lock className="w-3.5 h-3.5 text-purple-400" />
                            <span>Lock Now</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. SYSTEM */}
              <div className="glass-card rounded-2xl border border-white/10 bg-slate-800/40 p-3.5 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  <span>System</span>
                </div>

                <div className="space-y-2">
                  {/* PWA App Installation */}
                  <PWAInstallOption variant="menu-item" currentLanguage={currentLanguage} />

                  {/* Full Settings Navigation */}
                  <button
                    onClick={() => {
                      onNavigate("settings");
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-white/5 text-xs text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <div className="font-bold text-white text-xs">Settings</div>
                        <div className="text-[10px] text-slate-400">All configurations & preferences</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Backup & Restore */}
                  <div className="p-2.5 rounded-xl bg-slate-800/70 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Backup & Restore</div>
                          <div className="text-[10px] text-slate-400">Cloud Firestore & Local JSON</div>
                        </div>
                      </div>
                      <button
                        onClick={handleTriggerSync}
                        disabled={isSyncing}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition-colors"
                      >
                        <RotateCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>{isSyncing ? "Syncing..." : "Sync"}</span>
                      </button>
                    </div>

                    {syncStatusMsg && (
                      <div className="text-[10px] text-emerald-300 font-mono">
                        {syncStatusMsg}
                      </div>
                    )}

                    <div className="pt-1.5 flex gap-2">
                      <button
                        onClick={handleExportData}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium border border-white/5 transition-colors"
                      >
                        Export JSON Backup
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. SUPPORT */}
              <div className="glass-card rounded-2xl border border-white/10 bg-slate-800/40 p-3.5 space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Support</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-white/5 text-xs text-left transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-200">Help & Feedback</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setShowAboutModal(true)}
                    className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-white/5 text-xs text-left transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-200">About Garia OS</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setShowWhatsNewModal(true)}
                    className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-white/5 text-xs text-left transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-200">What's New</span>
                    <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  <button
                    onClick={() => setShowRateModal(true)}
                    className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-white/5 text-xs text-left transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-200">Rate App</span>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>

          {/* ABOUT MODAL */}
          {showAboutModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
              onClick={() => setShowAboutModal(false)}
            >
              <div
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/15 p-5 shadow-2xl space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold text-xs">
                      G
                    </div>
                    <h3 className="font-bold text-white text-sm font-heading">About Garia OS</h3>
                  </div>
                  <button
                    onClick={() => setShowAboutModal(false)}
                    className="p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <p>
                    <strong className="text-white">Garia OS V{APP_VERSION}</strong> is a minimalist, fast, and Play Store ready student productivity operating system.
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-white/5 font-mono text-[11px] space-y-1 text-slate-400">
                    <div>Version: v{APP_VERSION}</div>
                    <div>Build: {APP_BUILD_DATE}</div>
                    <div>Platform: Web & Mobile</div>
                    <div>Cloud: Firestore Synced</div>
                  </div>
                </div>

                <button
                  onClick={() => setShowAboutModal(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* WHAT'S NEW MODAL */}
          {showWhatsNewModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
              onClick={() => setShowWhatsNewModal(false)}
            >
              <div
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/15 p-5 shadow-2xl space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm font-heading">What's New in V3.0</h3>
                  </div>
                  <button
                    onClick={() => setShowWhatsNewModal(false)}
                    className="p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-white">Minimal Home Dashboard:</strong> Single Garia OS app icon access point with no clutter.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-white">Direct Slider Panel:</strong> Smooth options drawer with Account, Personalization, Preferences, Security, and System.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-white">Solar Sunrise Theme Engine:</strong> Real-time astronomical daylight theme adaptation.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-white">Conic Focus Timer:</strong> Precision circular angular track with ambient pulse.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowWhatsNewModal(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Got It
                </button>
              </div>
            </div>
          )}

          {/* HELP & FEEDBACK MODAL */}
          {showHelpModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
              onClick={() => setShowHelpModal(false)}
            >
              <div
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/15 p-5 shadow-2xl space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm font-heading">Help & Feedback</h3>
                  </div>
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {feedbackSubmitted ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-2">
                    <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="text-xs font-bold text-emerald-300">Thank you for your feedback!</div>
                    <p className="text-[11px] text-slate-400">Your feedback helps shape Garia OS updates.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Describe any issue or suggest a feature for Garia OS..."
                      rows={3}
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => {
                        if (feedbackText.trim()) {
                          setFeedbackSubmitted(true);
                          setTimeout(() => {
                            setShowHelpModal(false);
                            setFeedbackSubmitted(false);
                            setFeedbackText("");
                          }, 2000);
                        }
                      }}
                      disabled={!feedbackText.trim()}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all"
                    >
                      Submit Feedback
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RATE APP MODAL */}
          {showRateModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
              onClick={() => setShowRateModal(false)}
            >
              <div
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/15 p-5 shadow-2xl space-y-4 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between text-left">
                  <h3 className="font-bold text-white text-sm font-heading">Rate Garia OS</h3>
                  <button
                    onClick={() => setShowRateModal(false)}
                    className="p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {ratingSubmitted ? (
                  <div className="py-4 space-y-2">
                    <Star className="w-10 h-10 text-amber-400 fill-amber-400 mx-auto animate-bounce" />
                    <div className="text-sm font-bold text-white">Thank you for rating!</div>
                    <p className="text-xs text-slate-400">Your 5-star support inspires new features.</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <p className="text-xs text-slate-300">
                      How has your study experience been with Garia OS?
                    </p>

                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setUserRating(star)}
                          className="p-1 hover:scale-125 transition-transform"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              userRating >= star
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setRatingSubmitted(true);
                        setTimeout(() => {
                          setShowRateModal(false);
                          setRatingSubmitted(false);
                        }, 2000);
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
                    >
                      Submit Rating
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PIN Lock Setup / Change / Remove Modal */}
          {pinModalMode && (
            <PinManagementModal
              isOpen={Boolean(pinModalMode)}
              mode={pinModalMode}
              onClose={() => setPinModalMode(null)}
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onSuccessMessage={(msg) => {
                setSyncStatusMsg(msg);
                setTimeout(() => setSyncStatusMsg(null), 3000);
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
};
