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
} from "lucide-react";
import { Habit } from "../types";
import { getTodayString } from "../utils/storage";

interface HabitsPageProps {
  habits: Habit[];
  onAddHabit: (habit: Omit<Habit, "id" | "streak" | "completedDates" | "createdAt">) => void;
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
  onDeleteHabit: (id: string) => void;
  onBack?: () => void;
}

export const HabitsPage: React.FC<HabitsPageProps> = ({
  habits,
  onAddHabit,
  onToggleHabitDate,
  onDeleteHabit,
  onBack,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"study" | "health" | "mindset" | "other">("study");

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

    onAddHabit({
      title: title.trim(),
      category,
    });

    setTitle("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              id="habits-back-btn"
              aria-label="Go Back"
              className="p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Habit Tracker
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Build consistency with daily streaks for study, health, and mindset.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-rose-500/25 transition-all transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habit List */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
            <Flame className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="font-bold text-white font-heading text-lg">
              No habits created
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Add habits like "Study 2 Hours", "Daily Revision", or "Exercise" to start streaks!
            </p>
          </div>
        ) : (
          habits.map((habit) => {
            const isDoneToday = habit.completedDates.includes(todayStr);

            return (
              <div
                key={habit.id}
                className="glass-card rounded-3xl p-5 border border-white/10 hover:border-rose-500/30 transition-all space-y-4"
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
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </button>

                    <div>
                      <h4
                        className={`font-bold text-base font-heading ${
                          isDoneToday ? "text-emerald-300" : "text-white"
                        }`}
                      >
                        {habit.title}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono capitalize">
                        Category: {habit.category}
                      </span>
                    </div>
                  </div>

                  {/* Streak Counter */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold text-xs">
                      <Flame className="w-4 h-4 fill-rose-400 animate-pulse" />
                      <span>{habit.streak} Day Streak</span>
                    </div>

                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1.5 rounded-xl glass-pill text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

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
            );
          })
        )}
      </div>

      {/* Create Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4"
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
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none"
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
