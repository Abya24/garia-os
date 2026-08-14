import React from "react";
import {
  Home,
  GraduationCap,
  HelpCircle,
  Sparkles,
  User,
} from "lucide-react";
import { ActiveTab, StudentProfile } from "../types";
import { AppLanguage, translations } from "../utils/i18n";

interface BottomNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenProfile?: () => void;
  activeStudent?: StudentProfile;
  currentLanguage?: AppLanguage;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate,
  onOpenProfile,
  activeStudent,
  currentLanguage = "en",
}) => {
  const t = translations[currentLanguage] || translations.en;

  const mainNavItems = [
    { id: "home" as ActiveTab, label: t.home || "Home", icon: Home, elemId: "bottom-nav-home" },
    { id: "academic" as ActiveTab, label: t.academics || "Academics", icon: GraduationCap, elemId: "bottom-nav-academic" },
    { id: "questionbank" as ActiveTab, label: t.questionBank || "Question Bank", icon: HelpCircle, elemId: "bottom-nav-questionbank" },
    { id: "abya" as ActiveTab, label: t.abyaAI || "Abya AI", icon: Sparkles, elemId: "bottom-nav-abya" },
  ];

  const handleProfileClick = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      onNavigate("settings");
    }
  };

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-card border-t border-white/10 px-1 py-1 safe-pb backdrop-blur-xl pointer-events-auto"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={item.elemId}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 relative min-h-[48px] min-w-[48px] active:scale-95 ${
                isActive
                  ? "text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-emerald-500/15 rounded-xl border border-emerald-500/30" />
              )}
              <Icon className={`w-4 h-4 z-10 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className="text-[10px] mt-0.5 z-10 font-medium tracking-tight whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}

        {/* Profile Navigation Button */}
        <button
          id="bottom-nav-profile"
          onClick={handleProfileClick}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 relative min-h-[48px] min-w-[48px] active:scale-95 ${
            activeTab === "settings"
              ? "text-cyan-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {activeTab === "settings" && (
            <div className="absolute inset-0 bg-cyan-500/15 rounded-xl border border-cyan-500/30" />
          )}
          {activeStudent ? (
            <div
              className={`w-4 h-4 rounded-full bg-gradient-to-tr ${
                activeStudent.avatarColor || "from-cyan-400 to-emerald-400"
              } text-[9px] font-bold text-slate-900 flex items-center justify-center z-10 shadow-sm`}
            >
              {activeStudent.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <User className="w-4 h-4 z-10" />
          )}
          <span className="text-[10px] mt-0.5 z-10 font-medium tracking-tight">
            {t.profile || "Profile"}
          </span>
        </button>
      </div>
    </nav>
  );
};
