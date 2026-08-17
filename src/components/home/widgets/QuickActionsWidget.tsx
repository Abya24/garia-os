import React from "react";
import {
  BookOpen,
  Plus,
  Timer,
  Mail,
  Bot,
  Zap,
} from "lucide-react";
import { ActiveTab } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";

interface QuickActionsWidgetProps {
  currentLanguage: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
  onQuickAddTask: () => void;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  currentLanguage,
  onNavigate,
  onQuickAddTask,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold font-heading uppercase tracking-wider text-slate-400">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentLanguage === "hi" ? "त्वरित क्रियाएँ" : "Quick Actions"}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">1-Tap Shortcuts</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <button
          onClick={() => onNavigate("study")}
          id="quick-action-start-study"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-left flex items-center gap-3 transition-all card-press group shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold font-heading text-white truncate">
              {currentLanguage === "hi" ? "अध्ययन सत्र" : "Start Study"}
            </div>
            <div className="text-[10px] text-emerald-300/80 truncate">
              {currentLanguage === "hi" ? "सत्र शुरू करें" : "Track time & topics"}
            </div>
          </div>
        </button>

        <button
          onClick={onQuickAddTask}
          id="quick-action-add-task"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-left flex items-center gap-3 transition-all card-press group shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold font-heading text-white truncate">
              {currentLanguage === "hi" ? "+ नया कार्य" : "+ Add Task"}
            </div>
            <div className="text-[10px] text-cyan-300/80 truncate">
              {currentLanguage === "hi" ? "दैनिक लक्ष्य जोड़ें" : "Quick daily to-do"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate("focus")}
          id="quick-action-focus-timer"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-left flex items-center gap-3 transition-all card-press group shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Timer className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold font-heading text-white truncate">
              {currentLanguage === "hi" ? "पोमोडोरो फोकस" : "Focus Timer"}
            </div>
            <div className="text-[10px] text-amber-300/80 truncate">
              {currentLanguage === "hi" ? "25m / 50m सत्र" : "25m / 50m sessions"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate("gmail")}
          id="quick-action-gmail"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 border border-red-500/40 text-left flex items-center gap-3 transition-all card-press group shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold font-heading text-white truncate">
              {currentLanguage === "hi" ? "स्टूडेंट मेल" : "Student Mail"}
            </div>
            <div className="text-[10px] text-red-300/80 truncate">
              {currentLanguage === "hi" ? "गूगल जीमेल इनबॉक्स" : "Gmail & templates"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate("abya")}
          id="quick-action-ask-abya"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 text-left flex items-center gap-3 transition-all card-press group shadow-sm col-span-2 sm:col-span-1"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold font-heading text-white truncate">
              {currentLanguage === "hi" ? "अव्या एआई चैट" : "Ask Abya AI"}
            </div>
            <div className="text-[10px] text-purple-300/80 truncate">
              {currentLanguage === "hi" ? "डाउट व प्रश्न पूछें" : "Instant doubt solver"}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
