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
}

export const StatusBar: React.FC<StatusBarProps> = ({
  settings,
  onUpdateSettings,
  onNavigate,
  activeTab,
  activeStudent,
  onOpenStudentModal,
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

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-white/10 px-4 py-2.5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <span className="font-bold text-xs bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                  G
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight font-heading bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Garia OS
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  v1.5
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>{dateStr}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{time}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Action Bar */}
        <div className="flex items-center gap-2">
          {/* Active Student Switcher Pill */}
          {activeStudent && onOpenStudentModal && (
            <button
              onClick={onOpenStudentModal}
              title="Manage & Switch Student Profiles"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-pill border border-emerald-500/30 text-white hover:bg-emerald-500/10 transition-all text-xs font-semibold"
            >
              <div
                className={`w-4 h-4 rounded-full bg-gradient-to-tr ${
                  activeStudent.avatarColor || "from-cyan-500 to-emerald-500"
                } flex items-center justify-center text-[10px] font-bold text-slate-900 shrink-0`}
              >
                {activeStudent.name.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[100px] truncate font-heading">
                {activeStudent.name}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
                ({activeStudent.stream})
              </span>
            </button>
          )}
          {/* Abya AI quick trigger */}
          <button
            onClick={() => onNavigate("abya")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === "abya"
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25"
                : "glass-pill text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Abya AI</span>
          </button>

          {/* PWA Install Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallPWA}
              title="Install Garia OS PWA"
              className="p-2 rounded-xl glass-pill text-slate-300 hover:text-white hover:bg-white/10 transition-colors relative"
            >
              <Download className="w-4 h-4 text-cyan-400" />
            </button>
          )}

          {/* Notification Permission Button */}
          <button
            onClick={handleToggleNotifications}
            title={
              notificationPerm === "granted"
                ? "Notifications Active"
                : "Enable Browser Notifications"
            }
            className={`p-2 rounded-xl glass-pill transition-colors ${
              notificationPerm === "granted"
                ? "text-emerald-400 hover:bg-emerald-500/10"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {notificationPerm === "granted" ? (
              <Bell className="w-4 h-4 text-emerald-400" />
            ) : (
              <BellOff className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${settings.theme === "dark" ? "Light" : "Dark"} Mode`}
            className="p-2 rounded-xl glass-pill text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
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
