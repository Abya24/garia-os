import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  User,
  Globe,
  Palette,
  Shield,
  Bell,
  Sliders,
  Settings,
  HelpCircle,
  Info,
  Star,
  Sparkle,
  Lock,
  ChevronDown,
  Check,
  Smartphone,
  Eye,
  Key,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  Moon,
  Sun,
  Flame,
  Zap,
} from "lucide-react";
import {
  UserSettings,
  StudentProfile,
  ActiveTab,
  AppTheme,
  AbyaLanguageSetting,
} from "../types";
import { APP_VERSION } from "../constants/version";
import { AppLanguage, translations } from "../utils/i18n";

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
}) => {
  // Dropdown open states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false);

  // Modals & sub-views
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [selectedAppIcon, setSelectedAppIcon] = useState<string>("Classic Emerald");

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
    { id: "classic", name: "Classic Emerald Garia", badge: "Default", color: "from-emerald-500 to-teal-600" },
    { id: "dark_minimal", name: "Obsidian Minimal", badge: "Pro", color: "from-slate-800 to-zinc-950" },
    { id: "neon_purple", name: "Neon Cyberpunk", badge: "Vibrant", color: "from-purple-500 to-indigo-600" },
    { id: "cyber_gold", name: "Academic Gold", badge: "Elite", color: "from-amber-400 to-orange-500" },
  ];

  const handleToggleNotification = () => {
    onUpdateSettings({
      ...settings,
      notificationsEnabled: !settings.notificationsEnabled,
    });
  };

  const handleTogglePinLock = () => {
    if (settings.account) {
      onUpdateSettings({
        ...settings,
        account: {
          ...settings.account,
          isPrivateMode: !settings.account.isPrivateMode,
        },
      });
    } else {
      // Create lightweight privacy lock
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

  const handleThemeChange = (newTheme: AppTheme) => {
    onUpdateSettings({
      ...settings,
      theme: newTheme,
    });
    setThemeDropdownOpen(false);
  };

  const handleLanguageChange = (newLang: AppLanguage) => {
    onUpdateLanguage(newLang);
    setLangDropdownOpen(false);
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

          {/* Slide-over Panel (Slider) */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="fixed top-0 bottom-0 left-0 z-50 w-full max-w-sm sm:max-w-md bg-slate-900/98 text-slate-100 border-r border-white/10 shadow-2xl flex flex-col backdrop-blur-2xl overflow-hidden"
          >
            {/* Slider Top Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-white font-heading tracking-tight">
                      Abya AI & System
                    </h2>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      v{APP_VERSION}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Garia OS Personalization & Controls
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close Slider Menu"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors active:scale-95 border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Slider Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
              {/* SECTION 1: ACCOUNT & STUDENT PROFILE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Account
                  </span>
                </div>

                {/* Active Student Card */}
                <div className="glass-card rounded-2xl p-3.5 border border-white/10 bg-slate-800/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white shadow-md text-base shrink-0">
                      {activeStudent?.name?.charAt(0) || "S"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-white truncate">
                        {activeStudent?.name || settings.userName || "Student Profile"}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {activeStudent?.classLevel || "Class 12"} • {activeStudent?.stream || "General"} ({activeStudent?.board || "CBSE"})
                      </div>
                    </div>
                  </div>

                  {/* Switch Student Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-slate-400 font-normal">Switch Profile:</span>
                        <span className="text-emerald-400 font-bold truncate">{activeStudent?.name || "Default"}</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          profileDropdownOpen ? "rotate-180" : ""
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
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            >
                              <span>Manage All Profiles</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PERSONALIZATION */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Personalization
                </div>

                <div className="glass-card rounded-2xl p-3.5 border border-white/10 bg-slate-800/40 space-y-3">
                  {/* Language Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      App Language
                    </label>
                    <div className="relative">
                      <button
                        onClick={() => setLangDropdownOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs font-semibold text-slate-200"
                      >
                        <span>{currentLanguage === "hi" ? "हिंदी (Hindi)" : "English (Default)"}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {langDropdownOpen && (
                        <div className="mt-1 p-1 rounded-xl bg-slate-800 border border-white/10 shadow-xl space-y-0.5">
                          <button
                            onClick={() => handleLanguageChange("en")}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                              currentLanguage === "en"
                                ? "bg-emerald-500/20 text-emerald-300 font-bold"
                                : "text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            <span>English (Default)</span>
                            {currentLanguage === "en" && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                          <button
                            onClick={() => handleLanguageChange("hi")}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                              currentLanguage === "hi"
                                ? "bg-emerald-500/20 text-emerald-300 font-bold"
                                : "text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            <span>हिंदी (Hindi)</span>
                            {currentLanguage === "hi" && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Theme Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-slate-400" />
                      Theme & Colors
                    </label>
                    <div className="relative">
                      <button
                        onClick={() => setThemeDropdownOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs font-semibold text-slate-200"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{
                              backgroundColor:
                                themes.find((t) => t.id === settings.theme)?.color || "#0f172a",
                            }}
                          />
                          <span>
                            {themes.find((t) => t.id === settings.theme)?.name || "Dark Modern"}
                          </span>
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${themeDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {themeDropdownOpen && (
                        <div className="mt-1 p-1 max-h-48 overflow-y-auto rounded-xl bg-slate-800 border border-white/10 shadow-xl space-y-0.5 custom-scrollbar">
                          {themes.map((th) => (
                            <button
                              key={th.id}
                              onClick={() => handleThemeChange(th.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                                settings.theme === th.id
                                  ? "bg-emerald-500/20 text-emerald-300 font-bold"
                                  : "text-slate-300 hover:bg-white/5"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full border border-white/20"
                                  style={{ backgroundColor: th.color }}
                                />
                                <span>{th.name}</span>
                              </span>
                              {settings.theme === th.id && (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* App Icon Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                      App Icon Style
                    </label>
                    <div className="relative">
                      <button
                        onClick={() => setIconDropdownOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs font-semibold text-slate-200"
                      >
                        <span>{selectedAppIcon}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${iconDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {iconDropdownOpen && (
                        <div className="mt-1 p-1 rounded-xl bg-slate-800 border border-white/10 shadow-xl space-y-0.5">
                          {appIcons.map((icon) => (
                            <button
                              key={icon.id}
                              onClick={() => {
                                setSelectedAppIcon(icon.name);
                                setIconDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                                selectedAppIcon === icon.name
                                  ? "bg-emerald-500/20 text-emerald-300 font-bold"
                                  : "text-slate-300 hover:bg-white/5"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-md bg-gradient-to-tr ${icon.color}`} />
                                <span>{icon.name}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{icon.badge}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: SECURITY (Toggles / Switches) */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Security & Lock
                </div>

                <div className="glass-card rounded-2xl p-3.5 border border-white/10 bg-slate-800/40 space-y-3">
                  {/* App Lock Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        App Lock (PIN & Privacy)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Require lock code to open Garia OS
                      </div>
                    </div>

                    <button
                      onClick={handleTogglePinLock}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        settings.account?.isPrivateMode ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-md ${
                          settings.account?.isPrivateMode ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Biometrics switch */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-cyan-400" />
                        Biometrics & Fingerprint
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Instant biometric unlock (Hardware supported)
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono">
                      Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: PREFERENCES */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Preferences
                </div>

                <div className="glass-card rounded-2xl p-3.5 border border-white/10 bg-slate-800/40 space-y-3">
                  {/* Push Notifications Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        Study & Revision Alerts
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Daily task deadlines & habit streak notifications
                      </div>
                    </div>

                    <button
                      onClick={handleToggleNotification}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        settings.notificationsEnabled ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-md ${
                          settings.notificationsEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Widgets Navigation / Customizer */}
                  <div className="pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate("home");
                      }}
                      className="w-full flex items-center justify-between py-1 text-xs text-slate-300 hover:text-white font-medium group"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        Dashboard Widgets Setup
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 5: SETTINGS */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate("settings");
                  }}
                  className="w-full glass-card rounded-2xl p-3.5 border border-white/10 bg-slate-800/40 hover:bg-slate-800/70 flex items-center justify-between text-xs font-bold text-white transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    Open General Settings
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* SECTION 6: SUPPORT & ABOUT */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Support & About
                </div>

                <div className="glass-card rounded-2xl p-2 border border-white/10 bg-slate-800/40 space-y-1">
                  <button
                    onClick={() => {
                      setShowAboutModal(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-emerald-400" />
                      About Garia OS
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">v{APP_VERSION}</span>
                  </button>

                  <button
                    onClick={() => setShowWhatsNewModal(true)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                      What's New in V3
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setFeedbackSent(true);
                      setTimeout(() => setFeedbackSent(false), 3000);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                      Help & Student Feedback
                    </span>
                    {feedbackSent ? (
                      <span className="text-[10px] text-emerald-400 font-bold">Feedback Sent!</span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      alert("Thank you for rating Garia OS 5 Stars!");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/30" />
                      Rate Garia OS
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold">★ 5.0</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Slider Bottom Info */}
            <div className="p-3 bg-slate-950/80 border-t border-white/10 text-center text-[10px] text-slate-500">
              Garia OS V3.0 • Built for Focused Student Learning
            </div>
          </motion.div>

          {/* About Modal */}
          {showAboutModal && (
            <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="glass-card rounded-3xl p-6 border border-white/15 bg-slate-900 max-w-sm w-full space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-6 h-6 text-slate-950" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white font-heading">Garia OS V3.0</h3>
                  <p className="text-xs text-slate-400">
                    Premium, minimal, student-focused productivity operating system.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-white/5 text-xs text-slate-300 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Platform:</span>
                    <span className="font-bold text-emerald-400">Garia OS Web & Android APK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AI Engine:</span>
                    <span className="font-bold text-white">Abya AI Multimodal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sync Engine:</span>
                    <span className="font-bold text-cyan-400">Firestore Real-time & Offline</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* What's New Modal */}
          {showWhatsNewModal && (
            <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="glass-card rounded-3xl p-6 border border-white/15 bg-slate-900 max-w-sm w-full space-y-4 shadow-2xl">
                <div className="flex items-center gap-2">
                  <Sparkle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white font-heading">What's New in V3.0</h3>
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>TickTick-Inspired UI/UX:</strong> Streamlined, clean, distraction-free student experience.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Single-Header Architecture:</strong> Zero duplicate headers or stacked bars across all screens.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Abya AI Slide-Over Panel:</strong> Instant access to profiles, themes, and security.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Accordion More Menu:</strong> Beautiful categorized preferences with expandable sections.</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowWhatsNewModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 transition-colors"
                >
                  Got It
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
