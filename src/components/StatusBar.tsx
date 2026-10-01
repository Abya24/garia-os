import React from "react";
import { Compass, Search, Palette, UserCheck, Globe } from "lucide-react";
import { ActiveTab, UserSettings, StudentProfile, AppTheme } from "../types";
import { AppLanguage, translations } from "../utils/i18n";
import { GariaLogo } from "./GariaLogo";

interface StatusBarProps {
  settings: UserSettings;
  onUpdateSettings?: (newSettings: UserSettings) => void;
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
  onGoBack?: () => void;
  tasks?: any;
  goals?: any;
  habits?: any;
}

const MODULE_OPTIONS: { value: ActiveTab; labelEn: string; labelHi: string; group: string }[] = [
  { value: "home", labelEn: "Home Dashboard", labelHi: "होम डैशबोर्ड", group: "Core" },
  { value: "tasks", labelEn: "Task Manager", labelHi: "टास्क मैनेजर", group: "Core" },
  { value: "focus", labelEn: "Focus Timer Studio", labelHi: "फोकस टाइमर", group: "Core" },
  { value: "study", labelEn: "Study Tracker", labelHi: "अध्ययन ट्रैकर", group: "Academic" },
  { value: "notes", labelEn: "Notes & Docs", labelHi: "नोट्स व दस्तावेज़", group: "Academic" },
  { value: "flashcards", labelEn: "Flashcards", labelHi: "फ़्लैशकार्ड", group: "Academic" },
  { value: "exam", labelEn: "Exam Center", labelHi: "परीक्षा केंद्र", group: "Academic" },
  { value: "career", labelEn: "Career Center", labelHi: "करियर केंद्र", group: "Academic" },
  { value: "goals", labelEn: "Goal Tracker", labelHi: "लक्ष्य ट्रैकर", group: "Planning" },
  { value: "habits", labelEn: "Habits & Streaks", labelHi: "आदतें व स्ट्रीक", group: "Planning" },
  { value: "water", labelEn: "Water Tracker", labelHi: "जल ट्रैकर", group: "Planning" },
  { value: "calendar", labelEn: "Academic Calendar", labelHi: "कैलेंडर", group: "Planning" },
  { value: "stats", labelEn: "Analytics & Reports", labelHi: "एनालिटिक्स", group: "Intelligence" },
  { value: "abya", labelEn: "Abya AI Coach", labelHi: "अभ्या AI कोच", group: "Intelligence" },
  { value: "settings", labelEn: "System Settings", labelHi: "सेटिंग्स", group: "System" },
];

const THEME_OPTIONS: { value: AppTheme; label: string }[] = [
  { value: "classic", label: "Classic Scholar" },
  { value: "dark", label: "Graphite Dark" },
  { value: "light", label: "Arctic Light" },
  { value: "amoled", label: "AMOLED Black" },
  { value: "midnight", label: "Midnight Blue" },
  { value: "emerald", label: "Emerald Forest" },
  { value: "purple", label: "Royal Purple" },
  { value: "frost", label: "Frost Glass" },
  { value: "sunset", label: "Sunset Warm" },
  { value: "high-contrast", label: "High Contrast" },
];

export const StatusBar: React.FC<StatusBarProps> = ({
  settings,
  onUpdateSettings,
  activeTab,
  onNavigate,
  activeStudent,
  profiles = [],
  onSwitchProfile,
  onOpenStudentModal,
  onOpenMoreMenu,
  onOpenSearch,
  currentLanguage = "en",
  onUpdateLanguage,
}) => {
  const t = translations[currentLanguage] || translations.en;

  const activeModule =
    MODULE_OPTIONS.find((m) => m.value === activeTab) || MODULE_OPTIONS[0];

  return (
    <header
      id="subscreen-header"
      className="sticky top-0 z-40 w-full glass-card border-b border-amber-500/20 px-3 sm:px-6 py-2.5 backdrop-blur-xl bg-slate-950/90 shadow-md"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Classic Brand Identity + Active Module Indicator */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <GariaLogo
              size="sm"
              variant="icon"
              withGlow={true}
              className="overflow-visible"
            />
            <div className="hidden sm:block">
              <div className="text-xs font-extrabold tracking-wide text-amber-200 font-classic uppercase">
                Garia Scholar OS
              </div>
              <div className="text-[11px] text-slate-400 font-medium truncate">
                {currentLanguage === "hi" ? activeModule.labelHi : activeModule.labelEn}
              </div>
            </div>
          </div>

          {/* Dropdown 1: Direct Module Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-amber-500/25 shadow-inner">
            <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <label htmlFor="global-module-select" className="sr-only">
              Navigate to Module
            </label>
            <select
              id="global-module-select"
              aria-label="Select Module"
              value={activeTab}
              onChange={(e) => onNavigate(e.target.value as ActiveTab)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
            >
              {MODULE_OPTIONS.map((mod) => (
                <option
                  key={mod.value}
                  value={mod.value}
                  className="bg-slate-900 text-white"
                >
                  {mod.group}: {currentLanguage === "hi" ? mod.labelHi : mod.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Classic Dropdown Controls + Single Navigation Menu Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search Input / Trigger */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              title="Quick Search (Ctrl+K)"
              aria-label="Quick Search"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">
                {t.search || (currentLanguage === "hi" ? "खोजें" : "Search")}
              </span>
            </button>
          )}

          {/* Dropdown 2: Classic Theme Selector Dropdown */}
          {onUpdateSettings && (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-white/10">
              <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <label htmlFor="global-theme-select" className="sr-only">
                Select Theme
              </label>
              <select
                id="global-theme-select"
                aria-label="Select Theme"
                value={settings.theme || "classic"}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    theme: e.target.value as AppTheme,
                    autoSolarTheme: false,
                  })
                }
                className="bg-transparent text-xs font-semibold text-amber-200 focus:outline-none cursor-pointer"
              >
                {THEME_OPTIONS.map((th) => (
                  <option
                    key={th.value}
                    value={th.value}
                    className="bg-slate-900 text-white"
                  >
                    Theme: {th.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dropdown 3: Student Profile Selector Dropdown */}
          {profiles.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-white/10">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <label htmlFor="global-profile-select" className="sr-only">
                Active Student Profile
              </label>
              <select
                id="global-profile-select"
                aria-label="Active Student Profile"
                value={activeStudent?.id || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "__manage__") {
                    if (onOpenStudentModal) onOpenStudentModal();
                  } else if (onSwitchProfile) {
                    onSwitchProfile(val);
                  }
                }}
                className="bg-transparent text-xs font-semibold text-cyan-200 focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                {profiles.map((prof) => (
                  <option
                    key={prof.id}
                    value={prof.id}
                    className="bg-slate-900 text-white"
                  >
                    {prof.name} ({prof.classLevel})
                  </option>
                ))}
                <option value="__manage__" className="bg-slate-900 text-amber-300">
                  + Manage Profiles...
                </option>
              </select>
            </div>
          )}

          {/* Dropdown 4: Language Switcher Dropdown */}
          {onUpdateLanguage && (
            <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-white/10">
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <label htmlFor="global-language-select" className="sr-only">
                Language
              </label>
              <select
                id="global-language-select"
                aria-label="Select Language"
                value={currentLanguage}
                onChange={(e) => onUpdateLanguage(e.target.value as AppLanguage)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-slate-900 text-white">
                  EN (English)
                </option>
                <option value="hi" className="bg-slate-900 text-white">
                  HI (हिन्दी)
                </option>
              </select>
            </div>
          )}

          {/* THE SINGLE UNIFIED NAVIGATION BUTTON */}
          {onOpenMoreMenu && (
            <button
              type="button"
              id="single-navigation-menu-btn"
              onClick={onOpenMoreMenu}
              title="Open Unified Navigation Hub"
              aria-label="Open Navigation Menu"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>
                {currentLanguage === "hi" ? "नेविगेशन मेनू" : "Navigate"}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

