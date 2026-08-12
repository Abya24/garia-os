import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Sparkles,
  Download,
  ShieldCheck,
  ArrowLeft,
  User,
  Info,
  X,
  ChevronDown,
  Lock,
  GraduationCap,
  Cpu,
  Layers,
} from "lucide-react";
import { UserSettings, ActiveTab, StudentProfile } from "../types";
import {
  getNotificationPermission,
  requestNotificationPermission,
} from "../utils/notifications";

interface StatusBarProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onNavigate: (tab: ActiveTab) => void;
  activeTab: ActiveTab;
  activeStudent?: StudentProfile;
  onOpenStudentModal?: () => void;
  onOpenAuthModal?: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  settings,
  onUpdateSettings,
  onNavigate,
  activeTab,
  activeStudent,
  onOpenStudentModal,
  onOpenAuthModal,
  onGoBack,
  canGoBack = false,
}) => {
  const [time, setTime] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [showPlatformMenu, setShowPlatformMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDateStr(
        now.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextTheme = settings.theme === "dark" ? "light" : "dark";
    onUpdateSettings({ ...settings, theme: nextTheme });
  };

  const isPrivateMode = settings.account?.isPrivateMode !== false;

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-white/10 px-3 sm:px-4 py-2 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Branding & Back Navigation */}
        <div className="flex items-center gap-2">
          {activeTab !== "home" && onGoBack && (
            <button
              onClick={onGoBack}
              title="Return to Previous Page"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-pill text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {/* Brand Header with Garia OS Platform Trigger */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/10 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform shrink-0">
                <img
                  src="/icon.svg"
                  alt="Garia OS Logo"
                  className="w-full h-full object-contain rounded-[10px]"
                />
              </div>
              <div className="hidden min-[380px]:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight font-heading bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    Garia OS
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    v2.8.3
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono hidden sm:flex items-center gap-1.5">
                  <span>{dateStr}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">{time}</span>
                </div>
              </div>
            </button>

            {/* Platform Dropdown Trigger */}
            <button
              onClick={() => setShowPlatformMenu(true)}
              title="Garia OS Platform Features & Menu"
              className="px-2 py-1 rounded-full glass-pill border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">OS Menu</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Active Student Switcher */}
          {activeStudent && onOpenStudentModal && (
            <button
              onClick={onOpenStudentModal}
              title="Switch Student Profile"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full glass-pill border border-emerald-500/30 text-white hover:bg-emerald-500/10 transition-all text-xs font-semibold"
            >
              <div
                className={`w-4 h-4 rounded-full bg-gradient-to-tr ${
                  activeStudent.avatarColor || "from-cyan-500 to-emerald-500"
                } flex items-center justify-center text-[10px] font-bold text-slate-900 shrink-0`}
              >
                {activeStudent.name.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[90px] sm:max-w-[120px] truncate font-heading">
                {activeStudent.name}
              </span>
            </button>
          )}

          {/* Auth / Account Status Button */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              title={isPrivateMode ? "Private Mode Active — Tap to Log In" : `Account: ${settings.userName}`}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isPrivateMode
                  ? "glass-pill text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
              }`}
            >
              {isPrivateMode ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline text-[11px]">Private</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline text-[11px]">Logged In</span>
                </>
              )}
            </button>
          )}

          {/* Abya AI Trigger */}
          <button
            onClick={() => onNavigate("abya")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === "abya"
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md font-bold"
                : "glass-pill text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline font-bold">Abya AI</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${settings.theme === "dark" ? "Light" : "Dark"} Mode`}
            className="p-1.5 sm:p-2 rounded-xl glass-pill text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {settings.theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </div>

      {/* Upper Garia OS Platform Menu Modal */}
      {showPlatformMenu && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowPlatformMenu(false)}
        >
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-emerald-500/30 p-6 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-slate-950 flex items-center justify-center font-extrabold text-lg shadow-md">
                  G
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-heading flex items-center gap-2">
                    <span>Garia OS Platform</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                      v2.8.3
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Unified Student Academic Operating System
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPlatformMenu(false)}
                className="p-1.5 rounded-full glass-pill text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>Academic Question Bank Architecture (V2.8.3)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Supports Class 10, Class 11, and Class 12 across Topic-wise MCQs, Chapter-wise Verified PYQs, and Practice Questions with isolated progress per student profile.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => {
                    setShowPlatformMenu(false);
                    onNavigate("download");
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download Official Android APK (v2.8.3)</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-400/20 px-2 py-0.5 rounded-full">Code 13</span>
                </button>

                <button
                  onClick={() => {
                    setShowPlatformMenu(false);
                    onNavigate("academic");
                  }}
                  className="flex items-center justify-between p-3 rounded-xl glass-pill hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Open Academic Question Bank Center</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowPlatformMenu(false);
                    onNavigate("settings");
                  }}
                  className="flex items-center justify-between p-3 rounded-xl glass-pill hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Privacy, Profiles & OS Settings</span>
                  </div>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-white block mb-0.5">🔒 Data Boundary & Profile Isolation</strong>
                All student progress, test scores, bookmarks, and notes are stored strictly inside your local browser context. No student data is transmitted to external servers.
              </div>
            </div>

            <button
              onClick={() => setShowPlatformMenu(false)}
              className="w-full py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs transition-colors"
            >
              Close Menu
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

