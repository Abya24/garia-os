import React from "react";
import { ArrowLeft } from "lucide-react";
import { ActiveTab, UserSettings, StudentProfile } from "../types";
import { AppLanguage, translations } from "../utils/i18n";
import { motion } from "motion/react";
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
  onOpenNotifications?: () => void;
  onOpenSavedItems?: () => void;
  onGoBack?: () => void;
  onOpenSliderMenu?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeTab,
  onGoBack,
  onOpenSliderMenu,
  currentLanguage = "en",
}) => {
  const t = translations[currentLanguage] || translations.en;

  // On Home Dashboard, HomeDashboard's own Side-Aligned Hero Banner acts as the unified, definitive top header
  if (activeTab === "home") {
    return null;
  }

  const getTabLabel = (tab: ActiveTab): string => {
    switch (tab) {
      case "home":
        return t.home || "Home";
      case "tasks":
        return t.tasks || "Tasks";
      case "focus":
        return t.focus || "Focus Timer";
      case "habits":
        return t.habits || "Habits & Streaks";
      case "water":
        return t.waterTracker || "Water Tracker";
      case "exam":
        return t.examIntelligence || "Exam Intelligence";
      case "career":
        return t.careerCenter || "Career Center";
      case "abya":
        return t.abyaAI || "Abya AI";
      case "notes":
        return t.notes || "Notes";
      case "study":
        return t.studyTracker || "Study Tracker";
      case "goals":
        return "Goals";
      case "calendar":
        return t.calendar || "Calendar";
      case "stats":
        return t.analytics || "Analytics";
      case "settings":
        return t.settings || "Settings";
      case "download":
        return "APK Download";
      default:
        return "Garia OS";
    }
  };

  // NON-HOME SUB-SCREENS: Clean Single Top Bar (Back button, Title, Official Garia OS Logo)
  return (
    <header
      id="subscreen-header"
      className="sticky top-0 z-40 w-full glass-card border-b border-white/10 px-3 sm:px-6 py-2.5 backdrop-blur-xl bg-slate-950/80"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-2.5">
          {onGoBack && (
            <button
              onClick={onGoBack}
              id="header-back-button"
              title="Go Back to Home"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all card-press"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline text-xs">Back</span>
            </button>
          )}

          <h2 className="text-sm sm:text-base font-bold text-white font-heading tracking-tight">
            {getTabLabel(activeTab)}
          </h2>
        </div>

        {/* Right: Official Garia OS App Icon to open the Slider Menu */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSliderMenu}
          id="header-garia-os-app-icon-sub"
          title="Open Garia OS Slider Menu"
          aria-label="Open Garia OS Menu"
          className="p-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all card-press group flex items-center gap-1.5"
        >
          <GariaLogo size="sm" variant="icon" withGlow={true} />
        </motion.button>
      </div>
    </header>
  );
};

