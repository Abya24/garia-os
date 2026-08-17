import React from "react";
import { Droplet, Plus, Minus, Sparkles, CheckCircle, HeartPulse } from "lucide-react";
import { WaterLog } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";

interface WaterIntakeWidgetProps {
  water: WaterLog;
  currentLanguage: AppLanguage;
  onAddWaterGlass: () => void;
  onRemoveWaterGlass?: () => void;
}

export const WaterIntakeWidget: React.FC<WaterIntakeWidgetProps> = ({
  water,
  currentLanguage,
  onAddWaterGlass,
  onRemoveWaterGlass,
}) => {
  const goal = water.goal || 8;
  const glasses = water.glasses || 0;
  const waterProgressPercent = Math.min(100, Math.round((glasses / goal) * 100));
  const isGoalReached = glasses >= goal;
  const glassesRemaining = Math.max(0, goal - glasses);

  // Motivational hydration message
  const getHydrationTip = () => {
    if (isGoalReached) {
      return currentLanguage === "hi"
        ? "शानदार! आज का 100% जल लक्ष्य पूर्ण हो चुका है। मस्तिष्क तेज और सक्रिय है!"
        : "Awesome! Daily hydration goal achieved. Brain focus and memory peak unlocked!";
    }
    if (glasses >= Math.ceil(goal / 2)) {
      return currentLanguage === "hi"
        ? `आधे से अधिक पूरा! केवल ${glassesRemaining} गिलास और बाकी हैं।`
        : `Over halfway there! Just ${glassesRemaining} more glasses to hit your brain target.`;
    }
    return currentLanguage === "hi"
      ? "हर 1-2 घंटे में पानी पिएं। उचित हाइड्रेशन थकान कम करता है और याददाश्त बढ़ाता है।"
      : "Drink water every 1-2 hours. Proper hydration prevents brain fatigue during study.";
  };

  return (
    <div className="glass-card rounded-3xl p-5 border border-blue-500/30 bg-gradient-to-br from-blue-950/20 via-slate-900/90 to-slate-900/90 space-y-4 shadow-sm relative overflow-hidden">
      {/* Background glow when goal reached */}
      {isGoalReached && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-sm">
            <Droplet className="w-4 h-4 fill-blue-400/20" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading text-white flex items-center gap-1.5">
              <span>{currentLanguage === "hi" ? "जल सेवन ट्रैकर" : "Water Intake"}</span>
              {isGoalReached && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span>{currentLanguage === "hi" ? "पूर्ण" : "Goal Met"}</span>
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {currentLanguage === "hi" ? "दैनिक मस्तिष्क हाइड्रेशन" : "Daily brain hydration tracker"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onRemoveWaterGlass && (
            <button
              onClick={onRemoveWaterGlass}
              disabled={glasses <= 0}
              title="Remove 1 glass"
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold border border-white/10 transition-all active:scale-95"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onAddWaterGlass}
            title="Log +1 Glass (250ml)"
            id="water-widget-add-btn"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+1 {currentLanguage === "hi" ? "गिलास" : "Glass"}</span>
          </button>
        </div>
      </div>

      {/* Main Glass Stats & Animated Gauge */}
      <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-blue-500/20 flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-heading text-white font-mono">
              {glasses}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {goal} {currentLanguage === "hi" ? "गिलास" : "glasses"} ({glasses * 250} ml)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-blue-300 font-medium">
            <HeartPulse className="w-3 h-3 text-cyan-400" />
            <span>
              {waterProgressPercent}% {currentLanguage === "hi" ? "लक्ष्य प्राप्त" : "daily target reached"}
            </span>
          </div>
        </div>

        {/* Visual Water Glasses Pill Matrix */}
        <div className="flex items-center gap-1 shrink-0 flex-wrap max-w-[150px] justify-end">
          {Array.from({ length: Math.min(10, goal) }).map((_, idx) => {
            const isFilled = idx < glasses;
            return (
              <div
                key={idx}
                className={`w-3.5 h-5 rounded-md border transition-all duration-300 flex items-center justify-center ${
                  isFilled
                    ? "bg-gradient-to-t from-blue-500 to-cyan-400 border-cyan-300/80 shadow-sm shadow-blue-500/30"
                    : "bg-slate-850/80 border-slate-700/60"
                }`}
                title={`Glass ${idx + 1}`}
              >
                {isFilled && <div className="w-1.5 h-1.5 rounded-full bg-white/40 mb-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Water Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(6, waterProgressPercent)}%` }}
          />
        </div>
      </div>

      {/* Tip */}
      <p className="text-[11px] text-slate-300 italic leading-relaxed bg-blue-950/30 p-2.5 rounded-xl border border-blue-500/10">
        💡 {getHydrationTip()}
      </p>
    </div>
  );
};
