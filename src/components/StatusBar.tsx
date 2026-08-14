import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  BellRing,
  Grid,
  Sparkles,
  Check,
  Globe,
} from "lucide-react";
import { UserSettings, ActiveTab, StudentProfile } from "../types";
import { APP_VERSION } from "../constants/version";
import {
  getNotificationPermission,
  requestNotificationPermission,
} from "../utils/notifications";
import { AppLanguage, translations } from "../utils/i18n";

interface StatusBarProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onNavigate: (tab: ActiveTab) => void;
  activeTab: ActiveTab;
  activeStudent?: StudentProfile;
  currentLanguage?: AppLanguage;
  onUpdateLanguage?: (lang: AppLanguage) => void;
  onOpenProfile?: () => void;
  onOpenStudentModal?: () => void;
  onOpenMoreMenu?: () => void;
  onOpenSearch?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  settings,
  onUpdateSettings,
  onNavigate,
  activeTab,
  activeStudent,
  currentLanguage = "en",
  onUpdateLanguage,
  onOpenProfile,
  onOpenStudentModal,
  onOpenMoreMenu,
  onOpenSearch,
}) => {
  const [notificationState, setNotificationState] = useState<string>("default");
  const [showNotificationToast, setShowNotificationToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const t = translations[currentLanguage] || translations.en;

  useEffect(() => {
    const perm = getNotificationPermission();
    setNotificationState(perm);
  }, []);

  const handleNotificationClick = async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationState("granted");
        setToastMessage(
          currentLanguage === "hi"
            ? "🔔 सूचनाएं सक्रिय: अध्ययन अलर्ट और संशोधन अनुस्मारक सक्षम हैं।"
            : "🔔 Notifications Active: Study alerts & revision reminders enabled."
        );
      } else {
        setNotificationState("denied");
        setToastMessage(
          currentLanguage === "hi"
            ? "🔕 सूचनाएं म्यूट: सेटिंग्स में ब्राउज़र अनुमति चालू करें।"
            : "🔕 Notifications Muted: Enable browser permissions in settings."
        );
      }
    } catch {
      setToastMessage(
        currentLanguage === "hi"
          ? "🔔 दैनिक अध्ययन अनुस्मारक तैयार हैं।"
          : "🔔 Notifications ready for daily study reminders."
      );
    }
    setShowNotificationToast(true);
    setTimeout(() => {
      setShowNotificationToast(false);
    }, 3500);
  };

  const handleProfileClick = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else if (onOpenStudentModal) {
      onOpenStudentModal();
    } else {
      onNavigate("settings");
    }
  };

  const toggleLanguage = () => {
    if (onUpdateLanguage) {
      const nextLang = currentLanguage === "hi" ? "en" : "hi";
      onUpdateLanguage(nextLang);
    }
  };

  const studentName = activeStudent?.name || settings.userName || (currentLanguage === "hi" ? "विद्यार्थी" : "Student");
  const studentInitial = studentName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-white/10 px-3 sm:px-4 py-2 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* 1. Garia OS Logo */}
        <div className="flex items-center">
          <button
            onClick={() => onNavigate("home")}
            id="header-logo-button"
            className="flex items-center gap-2 group text-left min-h-[44px] min-w-[44px] focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/10 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/icon.svg"
                alt="Garia OS Logo"
                className="w-full h-full object-contain rounded-[10px]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight font-heading bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Garia OS
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                v{APP_VERSION}
              </span>
            </div>
          </button>
        </div>

        {/* Right Section: Language Toggle, Search, Notifications, More Apps, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Toggle Button */}
          {onUpdateLanguage && (
            <button
              onClick={toggleLanguage}
              id="header-language-toggle"
              title={currentLanguage === "hi" ? "Switch to English" : "हिंदी में बदलें"}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 hover:text-white transition-all text-xs font-semibold min-h-[40px]"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {currentLanguage === "hi" ? "हिन्दी" : "EN"}
              </span>
            </button>
          )}

          {/* 2. Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              id="header-search-button"
              title={`${t.search || "Search"} (Ctrl+K)`}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs min-h-[40px] group"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-[11px] text-slate-300">
                {t.search || "Search"}
              </span>
              <kbd className="hidden md:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-white/10">
                ⌘K
              </kbd>
            </button>
          )}

          {/* 3. Notifications Bell */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              id="header-notifications-button"
              title={t.notifications || "Notifications & Study Reminders"}
              className="relative p-2 rounded-full glass-pill hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              {notificationState === "granted" ? (
                <BellRing className="w-4 h-4 text-emerald-400" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {notificationState === "granted" && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
              )}
            </button>

            {/* Notification Toast Popup */}
            {showNotificationToast && (
              <div className="absolute right-0 top-11 z-50 w-64 p-3 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-2xl text-xs text-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{toastMessage}</p>
                    <p className="text-[10px] text-slate-400">
                      {currentLanguage === "hi"
                        ? "समय सारिणी, परीक्षा वेटेज और स्मार्ट रिवीजन अलर्ट।"
                        : "Timetable, exam weightage & smart revision alerts."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. More Apps Button */}
          {onOpenMoreMenu && (
            <button
              onClick={onOpenMoreMenu}
              id="header-more-apps-button"
              title={t.more || "More Apps & Auxiliary Tools"}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold transition-all min-h-[40px]"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-[11px]">{t.more || "More Apps"}</span>
            </button>
          )}

          {/* 5. Profile Button */}
          <button
            onClick={handleProfileClick}
            id="header-profile-button"
            title={`${studentName} (${activeStudent?.classLevel || "Class 10"} • ${activeStudent?.stream || "General"})`}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full glass-pill border border-emerald-500/30 text-white hover:bg-emerald-500/10 transition-all text-xs font-semibold min-h-[40px]"
          >
            <div
              className={`w-6 h-6 rounded-full bg-gradient-to-tr ${
                activeStudent?.avatarColor || "from-cyan-500 to-emerald-500"
              } flex items-center justify-center text-[10px] font-bold text-slate-900 shrink-0 shadow-sm`}
            >
              {studentInitial}
            </div>
            <span className="max-w-[70px] sm:max-w-[100px] truncate font-heading text-[11px] sm:text-xs">
              {studentName}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
