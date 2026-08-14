import React from "react";
import {
  Home,
  GraduationCap,
  HelpCircle,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import { ActiveTab } from "../types";

interface BottomNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenMore: () => void;
  isMoreOpen: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate,
  onOpenMore,
  isMoreOpen,
}) => {
  const mainNavItems = [
    { id: "home" as ActiveTab, label: "Home", icon: Home },
    { id: "academic" as ActiveTab, label: "Academics", icon: GraduationCap },
    { id: "questionbank" as ActiveTab, label: "Question Bank", icon: HelpCircle },
    { id: "abya" as ActiveTab, label: "Abya AI", icon: Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-card border-t border-white/10 px-1.5 py-1.5 safe-pb backdrop-blur-xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !isMoreOpen;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? "text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-emerald-500/15 rounded-xl border border-emerald-500/30" />
              )}
              <Icon className={`w-4 h-4 z-10 transition-transform ${isActive ? "scale-105" : ""}`} />
              <span className="text-[10px] mt-0.5 z-10 font-medium tracking-tight whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 relative ${
            isMoreOpen ||
            ["study", "tasks", "notes", "exam", "career", "focus", "water", "habits", "stats", "settings", "download"].includes(activeTab)
              ? "text-cyan-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {(isMoreOpen ||
            ["study", "tasks", "notes", "exam", "career", "focus", "water", "habits", "stats", "settings", "download"].includes(
              activeTab
            )) && (
            <div className="absolute inset-0 bg-cyan-500/15 rounded-xl border border-cyan-500/30" />
          )}
          <MoreHorizontal className="w-4 h-4 z-10" />
          <span className="text-[10px] mt-0.5 z-10 font-medium tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
};

