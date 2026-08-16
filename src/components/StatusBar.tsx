import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  Palette,
  Check,
  ArrowLeft,
  Search,
  Bell,
  Bookmark,
} from "lucide-react";
import { UserSettings, ActiveTab, StudentProfile, AppTheme } from "../types";
import { APP_VERSION } from "../constants/version";
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
  onOpenNotifications?: () => void;
  onOpenSavedItems?: () => void;
  onGoBack?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  settings,
  onUpdateSettings,
  onNavigate,
  activeTab,
  activeStudent,
  currentLanguage = "en",
  onOpenProfile,
  onOpenStudentModal,
  onOpenMoreMenu,
  onOpenSearch,
  onOpenNotifications,
  onOpenSavedItems,
  onGoBack,
}) => {
  const t = translations[currentLanguage] || translations.en;

  const [isThemePickerOpen, setIsThemePickerOpen] = useState<boolean>(false);
  const themePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        themePickerRef.current &&
        !themePickerRef.current.contains(event.target as Node)
      ) {
        setIsThemePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTheme = (thm: AppTheme) => {
    onUpdateSettings({ ...settings, theme: thm });
    setIsThemePickerOpen(false);
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

  const studentName = activeStudent?.name || settings.userName || (currentLanguage === "hi" ? "विद्यार्थी" : "Student");
  const studentInitial = studentName.charAt(0).toUpperCase();

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
    <header className="sticky top-0 z-40 w-full glass-card border-b border-white/10 px-3 sm:px-4 py-2 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left Section: Back Button & Garia OS Logo */}
        <div className="flex items-center gap-1.5">
          {activeTab !== "home" && onGoBack && (
            <button
              onClick={onGoBack}
              id="header-back-button"
              title={currentLanguage === "hi" ? "वापस जाएं" : "Go Back"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all min-h-[38px] card-press shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">{currentLanguage === "hi" ? "पीछे" : "Back"}</span>
            </button>
          )}

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
              <span className="hidden md:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {getTabLabel(activeTab)}
              </span>
            </div>
          </button>
        </div>

        {/* Right Section: Global Search, Notifications, Saved Items, Theme Picker, More Apps, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Global Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              id="header-search-button"
              title="Global Quick Search (Cmd+K)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs min-h-[40px] card-press shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline text-[11px] font-medium text-slate-400">Search</span>
              <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[9px] font-mono bg-white/5 rounded border border-white/10 text-slate-400">⌘K</kbd>
            </button>
          )}

          {/* Notifications Center Button */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              id="header-notifications-button"
              title="Notifications Center"
              className="relative p-2 sm:px-2.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs min-h-[40px] flex items-center justify-center card-press"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </button>
          )}

          {/* Saved Items / Bookmark Button */}
          {onOpenSavedItems && (
            <button
              onClick={onOpenSavedItems}
              id="header-bookmarks-button"
              title="Saved Items & Bookmarks"
              className="p-2 sm:px-2.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs min-h-[40px] flex items-center justify-center card-press"
            >
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}

          {/* Instant Theme Picker Button */}
          <div className="relative" ref={themePickerRef}>
            <button
              onClick={() => setIsThemePickerOpen((prev) => !prev)}
              id="header-theme-picker-button"
              title={currentLanguage === "hi" ? "थीम बदलें (8 रंग थीम)" : "Change Theme (8 Themes)"}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs min-h-[40px]"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden xl:inline text-[11px] font-medium capitalize">
                {settings.theme || "Dark"}
              </span>
            </button>

            {isThemePickerOpen && (
              <div className="absolute right-0 top-11 z-50 w-60 p-2.5 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl space-y-1.5 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                  <span>{currentLanguage === "hi" ? "थीम चुनें" : "Theme Engine"}</span>
                  <span className="text-[9px] text-emerald-400 font-mono">8 Themes</span>
                </div>
                <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5">
                  {[
                    { id: "amoled", label: "AMOLED Black", dot: "bg-black border-slate-700" },
                    { id: "purple", label: "Royal Purple", dot: "bg-purple-600 border-purple-400" },
                    { id: "midnight", label: "Midnight Blue", dot: "bg-sky-600 border-sky-400" },
                    { id: "graphite", label: "Graphite Gray", dot: "bg-slate-700 border-slate-500" },
                    { id: "arctic", label: "Arctic White", dot: "bg-slate-100 border-slate-300" },
                    { id: "frost", label: "Frost Glass", dot: "bg-cyan-200 border-cyan-400" },
                    { id: "emerald", label: "Emerald Green", dot: "bg-emerald-600 border-emerald-400" },
                    { id: "sunset", label: "Sunset Orange", dot: "bg-amber-600 border-amber-400" },
                  ].map((thm) => (
                    <button
                      key={thm.id}
                      onClick={() => handleSelectTheme(thm.id as AppTheme)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                        settings.theme === thm.id ||
                        (thm.id === "arctic" && settings.theme === "light") ||
                        (thm.id === "midnight" && settings.theme === "ocean") ||
                        (thm.id === "emerald" && settings.theme === "forest") ||
                        (thm.id === "graphite" && settings.theme === "dark")
                          ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full border ${thm.dot}`} />
                        <span>{thm.label}</span>
                      </div>
                      {(settings.theme === thm.id ||
                        (thm.id === "arctic" && settings.theme === "light") ||
                        (thm.id === "midnight" && settings.theme === "ocean") ||
                        (thm.id === "emerald" && settings.theme === "forest") ||
                        (thm.id === "graphite" && settings.theme === "dark")) && (
                        <Check className="w-3 h-3 text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* More Apps Button */}
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

          {/* Profile Button */}
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

