import React, { useState } from "react";
import {
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Award,
  Trash2,
  X,
  Sparkles,
  ArrowLeft,
  Target,
  Trophy,
  Gift,
  Zap,
} from "lucide-react";
import { Habit } from "../types";
import { getTodayString } from "../utils/storage";
import { HabitStreakGoalModal } from "../components/HabitStreakGoalModal";
import { SwipeableItemCard } from "../components/SwipeableItemCard";

interface HabitsPageProps {
  habits: Habit[];
  onAddHabit: (habit: Omit<Habit, "id" | "streak" | "completedDates" | "createdAt">) => void;
  onUpdateHabit?: (habit: Habit) => void;
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
  onDeleteHabit: (id: string) => void;
  onBack?: () => void;
}

export const HabitsPage: React.FC<HabitsPageProps> = ({
  habits,
  onAddHabit,
  onUpdateHabit,
  onToggleHabitDate,
  onDeleteHabit,
  onBack,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"study" | "health" | "mindset" | "other">("study");
  const [streakGoalInput, setStreakGoalInput] = useState<string>("21");
  const [streakRewardInput, setStreakRewardInput] = useState<string>("");
  const [enableGoalInCreate, setEnableGoalInCreate] = useState<boolean>(true);

  // Streak Goal Modal State
  const [goalModalHabit, setGoalModalHabit] = useState<Habit | null>(null);

  const todayStr = getTodayString();

  // Get last 7 days strings
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const dayLabel = d.toLocaleDateString([], { weekday: "narrow" });
      days.push({ dateStr, dayLabel, isToday: dateStr === todayStr });
    }
    return days;
  };

  const last7Days = getLast7Days();

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedGoal = enableGoalInCreate ? parseInt(streakGoalInput, 10) || undefined : undefined;

    onAddHabit({
      title: title.trim(),
      category,
      streakGoal: parsedGoal,
      streakGoalReward: enableGoalInCreate && streakRewardInput.trim() ? streakRewardInput.trim() : undefined,
      streakGoalStartDate: parsedGoal ? todayStr : undefined,
    });

    setTitle("");
    setStreakRewardInput("");
    setIsModalOpen(false);
  };

  const handleSaveStreakGoal = (
    habitId: string,
    goal: number | undefined,
    reward?: string
  ) => {
    const target = habits.find((h) => h.id === habitId);
    if (!target || !onUpdateHabit) return;

    onUpdateHabit({
      ...target,
      streakGoal: goal,
      streakGoalReward: reward,
      streakGoalStartDate: goal ? (target.streakGoalStartDate || todayStr) : undefined,
    });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Habit Tracker
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Build lifelong consistency with daily streaks and milestone goals.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-rose-500/25 transition-all transform active:scale-95 text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habit List */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-white/10 space-y-3">
            <Flame className="w-12 h-12 text-rose-500 mx-auto mb-1" />
            <h3 className="font-bold text-white font-heading text-lg">
              No habits created
            </h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Add habits like "Study 2 Hours", "Daily Problem Practice", or "15-min Revision" and set streak goals to stay on track!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 px-5 py-2 rounded-2xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors shadow-sm"
            >
              Create First Habit
            </button>
          </div>
        ) : (
          habits.map((habit) => {
            const isDoneToday = habit.completedDates.includes(todayStr);
            const hasGoal = habit.streakGoal && habit.streakGoal > 0;
            const targetGoal = habit.streakGoal || 0;
            const progressPct = hasGoal
              ? Math.min(100, Math.round((habit.streak / targetGoal) * 100))
              : 0;
            const isGoalAchieved = hasGoal && habit.streak >= targetGoal;
            const daysRemaining = Math.max(0, targetGoal - habit.streak);

            return (
              <SwipeableItemCard
                key={habit.id}
                id={habit.id}
                isCompleted={isDoneToday}
                onToggleComplete={() => onToggleHabitDate(habit.id, todayStr)}
                completedText="Completed for Today!"
                uncompletedText="Mark Incomplete for Today"
              >
                <div
                  className={`glass-card rounded-3xl p-5 border transition-all space-y-4 shadow-sm ${
                    isGoalAchieved
                      ? "border-emerald-500/40 bg-emerald-950/10"
                      : "border-white/10 hover:border-rose-500/30"
                  }`}
                >
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleHabitDate(habit.id, todayStr)}
                        className={`p-2.5 rounded-2xl transition-all transform active:scale-90 ${
                          isDoneToday
                            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105"
                            : "glass-pill text-slate-500 hover:text-slate-300"
                        }`}
                        title={isDoneToday ? "Completed today!" : "Mark completed for today"}
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-bold text-base font-heading ${
                              isDoneToday ? "text-emerald-300" : "text-white"
                            }`}
                          >
                            {habit.title}
                          </h4>
                          {isGoalAchieved && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-emerald-400" />
                              Goal Reached!
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono capitalize">
                          Category: {habit.category}
                        </span>
                      </div>
                    </div>

                    {/* Streak Counter & Goal Trigger */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold text-xs shadow-sm">
                        <Flame className="w-4 h-4 fill-rose-400 text-rose-400 animate-pulse" />
                        <span>{habit.streak} Day Streak</span>
                      </div>

                      {/* Target Goal Button */}
                      <button
                        onClick={() => setGoalModalHabit(habit)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          hasGoal
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                            : "glass-pill text-slate-400 hover:text-white border border-white/10"
                        }`}
                        title="Configure Daily Streak Goal"
                      >
                        <Target className="w-3.5 h-3.5 text-amber-400" />
                        <span>{hasGoal ? `Goal: ${targetGoal}d` : "Set Goal"}</span>
                      </button>

                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-2 rounded-xl glass-pill text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* STREAK GOAL PROGRESS BAR (if set) */}
                  {hasGoal && (
                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          <Target className="w-3.5 h-3.5 text-rose-400" />
                          <span>Streak Goal: {habit.streak}/{targetGoal} Days</span>
                        </div>
                        <span className="font-mono font-bold text-rose-400">{progressPct}%</span>
                      </div>

                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isGoalAchieved
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                              : "bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400"
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-0.5">
                        {isGoalAchieved ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Target milestone completed! Tap 'Goal' to extend your streak target.
                          </span>
                        ) : (
                          <span>
                            {daysRemaining} more {daysRemaining === 1 ? "day" : "days"} to hit target
                          </span>
                        )}

                        {habit.streakGoalReward && (
                          <span className="flex items-center gap-1 text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            <Gift className="w-3 h-3 text-amber-400" />
                            Reward: {habit.streakGoalReward}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 7-Day Weekly Check Grid */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                      <span>Weekly 7-Day View</span>
                      <span>Tap circle to toggle completion</span>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {last7Days.map((d) => {
                        const checked = habit.completedDates.includes(d.dateStr);

                        return (
                          <div
                            key={d.dateStr}
                            onClick={() => onToggleHabitDate(habit.id, d.dateStr)}
                            className={`flex flex-col items-center justify-center p-2 rounded-2xl cursor-pointer transition-all border ${
                              checked
                                ? "bg-rose-500/20 border-rose-400/50 text-rose-300 font-bold shadow-sm"
                                : d.isToday
                                ? "glass-pill border-emerald-500/40 text-slate-300"
                                : "glass-pill border-white/5 text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <span className="text-[10px] font-mono mb-1 uppercase">
                              {d.dayLabel}
                            </span>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center">
                              {checked ? (
                                <CheckCircle2 className="w-5 h-5 fill-rose-500 text-white" />
                              ) : (
                                <Circle className="w-4 h-4 opacity-40" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </SwipeableItemCard>
            );
          })
        )}
      </div>

      {/* STREAK GOAL MODAL */}
      {goalModalHabit && (
        <HabitStreakGoalModal
          habit={goalModalHabit}
          isOpen={!!goalModalHabit}
          onClose={() => setGoalModalHabit(null)}
          onSaveStreakGoal={handleSaveStreakGoal}
        />
      )}

      {/* Create Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/15 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white">
                Create New Habit
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full glass-pill text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Habit Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Study 2 Hours, Read 20 Mins, Sleep early..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as "study" | "health" | "mindset" | "other")
                  }
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                >
                  <option value="study">Study & Revision</option>
                  <option value="health">Health & Exercise</option>
                  <option value="mindset">Mindset & Reading</option>
                  <option value="other">Other Routine</option>
                </select>
              </div>

              {/* Optional Streak Goal in creation */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 cursor-pointer">
                    <Target className="w-3.5 h-3.5 text-rose-400" />
                    <span>Set Initial Streak Goal</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={enableGoalInCreate}
                    onChange={(e) => setEnableGoalInCreate(e.target.checked)}
                    className="rounded accent-rose-500 cursor-pointer"
                  />
                </div>

                {enableGoalInCreate && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-3 gap-2">
                      {[7, 21, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setStreakGoalInput(d.toString())}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                            streakGoalInput === d.toString()
                              ? "bg-rose-500/20 text-rose-300 border-rose-500 ring-1 ring-rose-500/30"
                              : "glass-pill text-slate-400 border-white/10"
                          }`}
                        >
                          {d} Days
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Optional milestone reward (e.g. Favorite snack)"
                      value={streakRewardInput}
                      onChange={(e) => setStreakRewardInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-pill text-white border border-white/10 text-xs focus:outline-none placeholder-slate-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-pill text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

