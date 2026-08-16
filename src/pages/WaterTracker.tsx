import React, { useState } from "react";
import { Droplet, Plus, Minus, RotateCcw, CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";
import { WaterLog } from "../types";

interface WaterTrackerProps {
  water: WaterLog;
  onUpdateWater: (water: WaterLog) => void;
  onBack?: () => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  water,
  onUpdateWater,
  onBack,
}) => {
  const [goal, setGoal] = useState<number>(water.goal || 8);

  const handleAddGlass = () => {
    onUpdateWater({ ...water, glasses: water.glasses + 1 });
  };

  const handleRemoveGlass = () => {
    if (water.glasses > 0) {
      onUpdateWater({ ...water, glasses: water.glasses - 1 });
    }
  };

  const handleReset = () => {
    onUpdateWater({ ...water, glasses: 0 });
  };

  const handleGoalChange = (newGoal: number) => {
    setGoal(newGoal);
    onUpdateWater({ ...water, goal: newGoal });
  };

  const effectiveGoal = water.goal || 8;
  const percent = Math.min(100, Math.round((water.glasses / effectiveGoal) * 100));

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              id="water-back-btn"
              aria-label="Go Back"
              className="p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Water Tracker
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Stay hydrated during intensive study and work sessions.
            </p>
          </div>
        </div>

        {/* Goal adjustment selector */}
        <div className="flex items-center gap-2 glass-pill px-3 py-1.5 rounded-2xl border border-white/10 self-start sm:self-center">
          <span className="text-xs text-slate-400 font-medium">Daily Goal:</span>
          <select
            value={water.goal}
            onChange={(e) => handleGoalChange(parseInt(e.target.value))}
            className="bg-slate-900 text-cyan-300 text-xs font-bold rounded-xl px-2 py-1 focus:outline-none"
          >
            {[6, 8, 10, 12, 14, 16].map((g) => (
              <option key={g} value={g}>
                {g} Glasses ({g * 250} ml)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Hydration Visual Card */}
      <div className="glass-card rounded-3xl p-8 border border-blue-500/30 text-center flex flex-col items-center justify-center relative overflow-hidden max-w-xl mx-auto shadow-2xl bg-gradient-to-br from-blue-950/30 via-slate-900/90 to-cyan-950/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Liquid Glass Animation */}
        <div className="relative w-40 h-56 rounded-3xl border-4 border-blue-400/40 glass-pill overflow-hidden my-4 flex items-end shadow-inner p-1">
          <div
            className="w-full bg-gradient-to-t from-blue-600 via-cyan-400 to-cyan-300 rounded-2xl transition-all duration-700 ease-out flex items-center justify-center relative"
            style={{ height: `${percent}%` }}
          >
            <div className="absolute top-1 left-0 right-0 h-2 bg-white/30 rounded-full animate-pulse" />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white font-heading pointer-events-none drop-shadow-md">
            <span className="text-3xl font-black">{water.glasses}</span>
            <span className="text-xs font-semibold text-slate-200">
              of {water.goal} glasses
            </span>
          </div>
        </div>

        {/* Progress indicator badge */}
        <div className="my-2">
          {percent >= 100 ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Hydration Goal Completed!</span>
            </div>
          ) : (
            <span className="text-xs text-cyan-300 font-mono font-semibold">
              {water.goal - water.glasses} glasses left to reach today's target
            </span>
          )}
        </div>

        {/* Water Control Buttons */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handleRemoveGlass}
            disabled={water.glasses === 0}
            className="p-4 rounded-2xl glass-pill text-slate-300 hover:text-white disabled:opacity-40 hover:bg-white/10 transition-colors border border-white/10"
            title="Remove 1 glass"
          >
            <Minus className="w-6 h-6" />
          </button>

          <button
            onClick={handleAddGlass}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 font-extrabold text-base flex items-center gap-2 shadow-xl shadow-blue-500/25 hover:scale-105 transition-all active:scale-95"
          >
            <Plus className="w-6 h-6" />
            <span>Drink Glass (+250ml)</span>
          </button>

          <button
            onClick={handleReset}
            className="p-4 rounded-2xl glass-pill text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-white/10"
            title="Reset today's water counter"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>

        {/* Glass Grid Visualizer */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-8 pt-6 border-t border-white/10 w-full">
          {Array.from({ length: water.goal }).map((_, idx) => {
            const isFilled = idx < water.glasses;
            return (
              <div
                key={idx}
                onClick={() =>
                  onUpdateWater({
                    ...water,
                    glasses: isFilled ? idx : idx + 1,
                  })
                }
                className={`p-2 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border ${
                  isFilled
                    ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-sm"
                    : "glass-pill border-white/5 text-slate-600 hover:text-slate-400"
                }`}
              >
                <Droplet
                  className={`w-5 h-5 ${isFilled ? "fill-cyan-400 text-cyan-300" : ""}`}
                />
                <span className="text-[10px] font-mono mt-1">{idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
