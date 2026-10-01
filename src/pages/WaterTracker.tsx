import React, { useState } from "react";
import { Droplet, Plus, Minus, RotateCcw, CheckCircle2, Sliders, Clock } from "lucide-react";
import { WaterLog } from "../types";

interface WaterTrackerProps {
  water: WaterLog;
  onUpdateWater: (water: WaterLog) => void;
  onBack?: () => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  water,
  onUpdateWater,
}) => {
  const [containerMl, setContainerMl] = useState<number>(250);
  const [reminderIntervalMins, setReminderIntervalMins] = useState<number>(60);

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
    onUpdateWater({ ...water, goal: newGoal });
  };

  const effectiveGoal = water.goal || 8;
  const percent = Math.min(100, Math.round((water.glasses / effectiveGoal) * 100));
  const totalConsumedMl = water.glasses * containerMl;
  const targetTotalMl = effectiveGoal * containerMl;

  return (
    <div className="space-y-6 pb-4 md:pb-0 animate-in fade-in duration-300 max-w-6xl mx-auto w-full">
      {/* Classic Header & Dropdown Controls */}
      <div className="glass-card classic-frame rounded-2xl p-4 sm:p-5 border border-amber-500/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-classic text-white tracking-tight">
            Water & Hydration Tracker
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
            Stay hydrated during intensive study blocks ({totalConsumedMl} ml / {targetTotalMl} ml today).
          </p>
        </div>

        {/* Classic Dropdowns Bar: Daily Goal, Container Size & Reminder Frequency */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown 1: Daily Goal */}
          <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-xs text-slate-400 font-semibold">Daily Goal:</span>
            <select
              id="water-daily-goal-select"
              aria-label="Daily Water Goal"
              value={effectiveGoal}
              onChange={(e) => handleGoalChange(parseInt(e.target.value, 10))}
              className="bg-slate-900 text-cyan-300 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              {[4, 6, 8, 10, 12, 14, 16, 18, 20].map((g) => (
                <option key={g} value={g}>
                  {g} Glasses ({g * containerMl} ml)
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Container Volume */}
          <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/10">
            <Droplet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-400 font-semibold">Vessel:</span>
            <select
              id="water-container-size-select"
              aria-label="Water Container Size"
              value={containerMl}
              onChange={(e) => setContainerMl(parseInt(e.target.value, 10))}
              className="bg-slate-900 text-amber-200 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value={200}>200 ml Classic Cup</option>
              <option value={250}>250 ml Standard Glass</option>
              <option value={350}>350 ml Study Mug</option>
              <option value={500}>500 ml Desk Bottle</option>
              <option value={750}>750 ml Sports Flask</option>
            </select>
          </div>

          {/* Dropdown 3: Hydration Reminder Interval */}
          <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/10">
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-400 font-semibold">Reminder:</span>
            <select
              id="water-reminder-interval-select"
              aria-label="Hydration Reminder Interval"
              value={reminderIntervalMins}
              onChange={(e) => setReminderIntervalMins(parseInt(e.target.value, 10))}
              className="bg-slate-900 text-emerald-300 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value={30}>Every 30 mins</option>
              <option value={45}>Every 45 mins</option>
              <option value={60}>Every 60 mins</option>
              <option value={90}>Every 90 mins</option>
              <option value={0}>Reminders Off</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Sliders Card */}
      <div className="glass-card classic-frame rounded-2xl p-5 border border-cyan-500/25 max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-200 uppercase tracking-wider font-classic">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Interactive Hydration Sliders</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Glasses Consumed:</span>
              <span className="font-mono font-bold text-cyan-300">
                {water.glasses} ({totalConsumedMl} ml)
              </span>
            </div>
            <input
              id="water-glasses-slider"
              type="range"
              min={0}
              max={Math.max(16, effectiveGoal)}
              step={1}
              value={water.glasses}
              onChange={(e) =>
                onUpdateWater({ ...water, glasses: parseInt(e.target.value, 10) })
              }
              aria-label="Glasses Consumed Today Slider"
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Daily Target Slider:</span>
              <span className="font-mono font-bold text-emerald-300">
                {effectiveGoal} glasses ({targetTotalMl} ml)
              </span>
            </div>
            <input
              id="water-goal-slider"
              type="range"
              min={4}
              max={20}
              step={1}
              value={effectiveGoal}
              onChange={(e) => handleGoalChange(parseInt(e.target.value, 10))}
              aria-label="Daily Water Goal Slider"
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Hydration Visual Card */}
      <div className="glass-card classic-frame rounded-3xl p-8 border border-blue-500/30 text-center flex flex-col items-center justify-center relative overflow-hidden max-w-xl mx-auto shadow-2xl bg-gradient-to-br from-blue-950/30 via-slate-900/90 to-cyan-950/30">
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
              of {effectiveGoal} glasses
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
              {Math.max(0, effectiveGoal - water.glasses)} glasses left to reach today's target
            </span>
          )}
        </div>

        {/* Water Control Buttons */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-4 mt-6 w-full max-w-md">
          <button
            onClick={handleRemoveGlass}
            disabled={water.glasses === 0}
            className="p-3 sm:p-4 rounded-2xl glass-pill text-slate-300 hover:text-white disabled:opacity-40 hover:bg-white/10 transition-colors border border-white/10 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            title="Remove 1 glass"
            aria-label="Remove 1 glass"
          >
            <Minus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={handleAddGlass}
            className="flex-1 py-3 sm:py-4 px-4 sm:px-8 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 font-extrabold text-xs sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 hover:scale-105 transition-all active:scale-95 min-h-[44px] cursor-pointer"
          >
            <Plus className="w-4 h-4 sm:w-6 sm:h-6 shrink-0" />
            <span className="whitespace-nowrap">Drink Glass (+{containerMl}ml)</span>
          </button>

          <button
            onClick={handleReset}
            className="p-3 sm:p-4 rounded-2xl glass-pill text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-white/10 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            title="Reset today's water counter"
            aria-label="Reset today's water counter"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Glass Grid Visualizer */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-8 pt-6 border-t border-white/10 w-full">
          {Array.from({ length: effectiveGoal }).map((_, idx) => {
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

