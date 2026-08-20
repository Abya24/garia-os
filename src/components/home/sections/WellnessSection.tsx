import React from "react";
import {
  Target,
  Flame,
  Check,
  Droplet,
  Plus,
  Minus,
  CheckCircle,
  ArrowRight,
  Sparkles,
  HeartPulse,
} from "lucide-react";
import { Habit, WaterLog, ActiveTab } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";
import { getTodayString } from "../../../utils/storage";

interface WellnessSectionProps {
  habits: Habit[];
  water: WaterLog;
  currentLanguage: AppLanguage;
  onToggleHabit?: (habitId: string, dateStr: string) => void;
  onAddWaterGlass: () => void;
  onRemoveWaterGlass?: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const WellnessSection: React.FC<WellnessSectionProps> = ({
  habits,
  water,
  currentLanguage,
  onToggleHabit,
  onAddWaterGlass,
  onRemoveWaterGlass,
  onNavigate,
}) => {
  const todayStr = getTodayString();

  // Habit metrics
  const completedHabitsCount = habits.filter((h) =>
    h.completedDates?.includes(todayStr)
  ).length;
  const habitProgressPercent =
    habits.length > 0
      ? Math.round((completedHabitsCount / habits.length) * 100)
      : 0;

  // Water metrics
  const goalGlasses = water.goal || 8;
  const loggedGlasses = water.glasses || 0;
  const waterProgressPercent = Math.min(100, Math.round((loggedGlasses / goalGlasses) * 100));
  const isWaterGoalReached = loggedGlasses >= goalGlasses;
  const glassesRemaining = Math.max(0, goalGlasses - loggedGlasses);

  return (
    <section id="section-5-wellness" className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            5
          </div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-white">
            {currentLanguage === "hi" ? "स्वास्थ्य व दैनिक आदतें" : "Wellness & Consistency"}
          </h2>
          <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
            {completedHabitsCount}/{habits.length} Habits Done
          </span>
        </div>

        <button
          onClick={() => onNavigate("habits")}
          className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
        >
          <span>{currentLanguage === "hi" ? "आदतें प्रबंधित करें" : "Manage Habits"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: Habit Tracker (6 cols) + Water Tracker (6 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* ========================================================================= */}
        {/* A. HABIT TRACKER CARD (6 cols)                                           */}
        {/* ========================================================================= */}
        <div
          id="wellness-habit-tracker-card"
          className="md:col-span-6 glass-card rounded-3xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900/90 to-slate-900/90 space-y-4 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white">
                    {currentLanguage === "hi" ? "दैनिक आदतें" : "Habit Streaks"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {habits.length > 0
                      ? `${completedHabitsCount} of ${habits.length} habits completed today`
                      : "No habits tracked yet"}
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {habitProgressPercent}%
              </span>
            </div>

            {/* Habits List */}
            {habits.length > 0 ? (
              <div className="space-y-2">
                {habits.slice(0, 4).map((habit) => {
                  const isDoneToday = habit.completedDates?.includes(todayStr);
                  return (
                    <div
                      key={habit.id}
                      onClick={() => onToggleHabit && onToggleHabit(habit.id, todayStr)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer card-press ${
                        isDoneToday
                          ? "bg-slate-950/50 border-amber-500/30"
                          : "bg-slate-900/60 hover:bg-slate-800/80 border-white/5 hover:border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleHabit && onToggleHabit(habit.id, todayStr);
                          }}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                            isDoneToday
                              ? "bg-amber-500 border-amber-400 text-slate-950 shadow-sm"
                              : "border-slate-600 hover:border-amber-400 text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <span
                          className={`text-xs font-medium truncate ${
                            isDoneToday ? "text-slate-200 line-through opacity-80" : "text-white"
                          }`}
                        >
                          {habit.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/20 shrink-0">
                        <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{habit.streak || 0}d</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center space-y-1.5">
                <p className="text-xs text-slate-400">
                  Track habits like Morning Revision, NCERT Practice, and Exercise.
                </p>
                <button
                  onClick={() => onNavigate("habits")}
                  className="text-xs text-amber-300 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add First Habit</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Keep your daily streaks alive</span>
            <button
              onClick={() => onNavigate("habits")}
              className="text-amber-300 hover:text-white font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* B. WATER TRACKER CARD (6 cols)                                           */}
        {/* ========================================================================= */}
        <div
          id="wellness-water-tracker-card"
          className="md:col-span-6 glass-card rounded-3xl p-5 border border-blue-500/30 bg-gradient-to-br from-blue-950/20 via-slate-900/90 to-slate-900/90 space-y-4 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          {isWaterGoalReached && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center">
                  <Droplet className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white flex items-center gap-1.5">
                    <span>{currentLanguage === "hi" ? "जल सेवन ट्रैकर" : "Water & Hydration"}</span>
                    {isWaterGoalReached && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded-full font-bold border border-emerald-500/30">
                        Goal Met!
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {loggedGlasses * 250}ml of {goalGlasses * 250}ml daily goal
                  </p>
                </div>
              </div>

              {/* Water logging action buttons */}
              <div className="flex items-center gap-1.5">
                {onRemoveWaterGlass && (
                  <button
                    onClick={onRemoveWaterGlass}
                    disabled={loggedGlasses <= 0}
                    title="Remove 1 glass"
                    className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold border border-white/10 transition-all active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={onAddWaterGlass}
                  title="Log +1 Glass (250ml)"
                  id="wellness-water-add-btn"
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+1 Glass</span>
                </button>
              </div>
            </div>

            {/* Glasses Visual Counter & Progress Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-blue-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-white font-mono">
                    {loggedGlasses}
                  </span>
                  <span className="text-xs text-slate-400">/ {goalGlasses} glasses</span>
                </div>

                <span className="text-xs font-mono text-blue-300 font-bold">
                  {waterProgressPercent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, waterProgressPercent)}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-300">
                {isWaterGoalReached
                  ? "🎉 Daily hydration target reached! Brain focus and retention peak unlocked."
                  : `💧 Drink ${glassesRemaining} more glasses today to prevent fatigue during study.`}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Brain Hydration Tracker</span>
            <span className="text-blue-300 font-mono font-medium">
              {loggedGlasses * 250} ml logged
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
