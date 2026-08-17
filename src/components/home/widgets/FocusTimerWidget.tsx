import React from "react";
import { Timer, ArrowRight, Play } from "lucide-react";
import { ActiveTab } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";

interface FocusTimerWidgetProps {
  currentLanguage: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
}

export const FocusTimerWidget: React.FC<FocusTimerWidgetProps> = ({
  currentLanguage,
  onNavigate,
}) => {
  return (
    <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading text-white">
              {currentLanguage === "hi" ? "पोमोडोरो व फोकस टाइमर" : "Focus Timer Launcher"}
            </h3>
            <p className="text-[11px] text-slate-400">
              {currentLanguage === "hi"
                ? "गहन अध्ययन के लिए टाइमर शुरू करें।"
                : "Scientifically proven interval timers for maximum retention."}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("focus")}
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1"
        >
          <span>{currentLanguage === "hi" ? "पूरा टाइमर" : "Full Timer"}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <button
          onClick={() => onNavigate("focus")}
          className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800 border border-amber-500/20 hover:border-amber-500/40 text-left transition-all card-press group"
        >
          <div className="text-lg font-bold font-mono text-amber-400">25 Min</div>
          <div className="text-xs font-semibold text-white mt-0.5">
            {currentLanguage === "hi" ? "पोमोडोरो सत्र" : "Standard Focus"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Play className="w-2.5 h-2.5 text-amber-400" />
            <span>5m Rest Interval</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("focus")}
          className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800 border border-cyan-500/20 hover:border-cyan-500/40 text-left transition-all card-press group"
        >
          <div className="text-lg font-bold font-mono text-cyan-400">50 Min</div>
          <div className="text-xs font-semibold text-white mt-0.5">
            {currentLanguage === "hi" ? "गहन अध्ययन" : "Deep Work"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Play className="w-2.5 h-2.5 text-cyan-400" />
            <span>10m Rest Interval</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("study")}
          className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800 border border-emerald-500/20 hover:border-emerald-500/40 text-left transition-all card-press group"
        >
          <div className="text-lg font-bold font-mono text-emerald-400">Log</div>
          <div className="text-xs font-semibold text-white mt-0.5">
            {currentLanguage === "hi" ? "सत्र लॉग" : "Subject Logger"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Play className="w-2.5 h-2.5 text-emerald-400" />
            <span>Manual Entry</span>
          </div>
        </button>
      </div>
    </div>
  );
};
