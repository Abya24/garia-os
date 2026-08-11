import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Sparkles,
  Bell,
  BellOff,
  Download,
  ShieldCheck,
  Smartphone,
  Users,
  ArrowLeft,
  User,
  Lock,
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
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission>(
    getNotificationPermission()
  );
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

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

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = settings.theme === "dark" ? "light" : "dark";
    onUpdateSettings({ ...settings, theme: nextTheme });
  };

  const handleToggleNotifications = async () => {
    if (notificationPerm === "granted") {
      alert("Notifications are enabled for Garia OS.");
      return;
    }
    const granted = await requestNotificationPermission();
    setNotificationPerm(getNotificationPermission());
    if (granted) {
      onUpdateSettings({ ...settings, notificationsEnabled: true });
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        "To install Garia OS on your mobile phone or browser, tap 'Add to Home Screen' or install via browser menu."
      );
    }
  };

  const isPrivateMode = settings.account?.isPrivateMode !== false;

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-white/10 px-3 sm:px-4 py-2 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Branding & Back Navigation */}
        <div className="flex items-center gap-2.5">
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

          <div
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/10 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/icon.svg"
                alt="Garia OS Logo"
                className="w-full h-full object-contain rounded-[10px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight font-heading bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Garia OS
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.4.0
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono hidden sm:flex items-center gap-1.5">
                <span>{dateStr}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{time}</span>
              </div>
            </div>
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
    </header>
  );
};

