import React, { useState } from "react";
import {
  Target,
  Flame,
  Trophy,
  Gift,
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Award,
  Zap,
} from "lucide-react";
import { Habit } from "../types";

interface HabitStreakGoalModalProps {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
  onSaveStreakGoal: (
    habitId: string,
    goal: number | undefined,
    reward?: string
  ) => void;
}

const STREAK_PRESETS = [
  { days: 7, label: "7 Days", desc: "1-Week Starter", icon: Zap, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { days: 14, label: "14 Days", desc: "2-Week Builder", icon: Sparkles, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  { days: 21, label: "21 Days", desc: "Neuroplasticity Rule", icon: Flame, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { days: 30, label: "30 Days", desc: "1-Month Milestone", icon: Trophy, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { days: 60, label: "60 Days", desc: "Iron Consistency", icon: Award, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  { days: 100, label: "100 Days", desc: "Century Mastery", icon: Trophy, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
];

export const HabitStreakGoalModal: React.FC<HabitStreakGoalModalProps> = ({
  habit,
  isOpen,
  onClose,
  onSaveStreakGoal,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<number>(
    habit.streakGoal || 21
  );
  const [customGoalInput, setCustomGoalInput] = useState<string>(
    habit.streakGoal ? habit.streakGoal.toString() : "21"
  );
  const [reward, setReward] = useState<string>(
    habit.streakGoalReward || ""
  );
  const [useCustom, setUseCustom] = useState<boolean>(
    habit.streakGoal !== undefined &&
      !STREAK_PRESETS.some((p) => p.days === habit.streakGoal)
  );

  if (!isOpen) return null;

  const currentStreak = habit.streak;
  const targetDays = useCustom ? parseInt(customGoalInput, 10) || 0 : selectedGoal;
  const isTargetValid = targetDays > 0;
  const progressPct = isTargetValid
    ? Math.min(100, Math.round((currentStreak / targetDays) * 100))
    : 0;
  const daysRemaining = Math.max(0, targetDays - currentStreak);
  const isAchieved = isTargetValid && currentStreak >= targetDays;

  const handleSelectPreset = (days: number) => {
    setSelectedGoal(days);
    setCustomGoalInput(days.toString());
    setUseCustom(false);
  };

  const handleCustomChange = (val: string) => {
    setCustomGoalInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedGoal(parsed);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTargetValid) return;
    onSaveStreakGoal(habit.id, targetDays, reward.trim() || undefined);
    onClose();
  };

  const handleRemoveGoal = () => {
    onSaveStreakGoal(habit.id, undefined, undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg glass-card rounded-3xl border border-white/15 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-sm">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold font-heading text-white tracking-tight">
                Daily Streak Goal
              </h3>
              <p className="text-xs text-slate-400">
                Set a motivational target for <span className="text-rose-300 font-semibold">"{habit.title}"</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full glass-pill text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Habit Streak Status Card */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400 fill-rose-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">Current Streak:</span>
              <span className="text-sm font-bold text-white font-mono">
                {currentStreak} {currentStreak === 1 ? "day" : "days"}
              </span>
            </div>

            <div className="text-xs font-mono font-bold text-rose-400">
              Target: {targetDays} days
            </div>
          </div>

          {/* Live Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Goal Progress</span>
              <span className="font-bold text-white">{progressPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAchieved
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Remaining or Completed message */}
          {isAchieved ? (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Milestone unlocked! You achieved your {targetDays}-day streak goal!</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>
                {daysRemaining} more {daysRemaining === 1 ? "day" : "days"} of consistency needed
              </span>
              <span className="text-[11px] text-rose-300/80 font-mono">
                {Math.max(0, targetDays - currentStreak)} days to unlock
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preset Goal Selectors */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Choose Target Milestone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {STREAK_PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = !useCustom && selectedGoal === preset.days;

                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => handleSelectPreset(preset.days)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? "bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30 text-white shadow-lg shadow-rose-500/10"
                        : "glass-pill border-white/10 hover:border-white/20 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-sm text-white font-heading">
                        {preset.label}
                      </span>
                      <IconComponent className="w-4 h-4 text-rose-400" />
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Streak Goal Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Or Custom Day Target
              </label>
              <button
                type="button"
                onClick={() => setUseCustom(!useCustom)}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold underline"
              >
                {useCustom ? "Use Preset Milestones" : "Set Custom Days"}
              </button>
            </div>

            {useCustom && (
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customGoalInput}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  placeholder="e.g. 45 or 90"
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-rose-500/40 focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-sm font-mono"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  consecutive days
                </span>
              </div>
            )}
          </div>

          {/* Reward & Motivation Incentive */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Goal Reward & Motivation (Optional)</span>
            </label>
            <input
              type="text"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="e.g. Treat to favorite coffee, buy new stationery, weekend movie..."
              className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500/40 text-xs sm:text-sm placeholder-slate-500"
            />
            <p className="text-[11px] text-slate-400">
              Treating yourself when reaching milestones creates positive reinforcement for lifelong habits.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            {habit.streakGoal ? (
              <button
                type="button"
                onClick={handleRemoveGoal}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
              >
                Remove Goal
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl glass-pill text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isTargetValid}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Target className="w-4 h-4" />
                <span>Save Streak Goal</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
