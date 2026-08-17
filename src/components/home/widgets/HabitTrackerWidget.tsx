import React from "react";
import { Target, Flame, Check, ArrowRight, Plus } from "lucide-react";
import { Habit, ActiveTab } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";
import { getTodayString } from "../../../utils/storage";

interface HabitTrackerWidgetProps {
  habits: Habit[];
  currentLanguage: AppLanguage;
  onToggleHabit?: (habitId: string, dateStr: string) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const HabitTrackerWidget: React.FC<HabitTrackerWidgetProps> = ({
  habits,
  currentLanguage,
  onToggleHabit,
  onNavigate,
}) => {
  const todayStr = getTodayString();
  const completedTodayCount = habits.filter((h) =>
    h.completedDates?.includes(todayStr)
  ).length;

  return (
    <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading text-white">
              {currentLanguage === "hi" ? "दैनिक आदतें व स्ट्रीक्स" : "Habit Streaks"}
            </h3>
            <p className="text-[11px] text-slate-400">
              {habits.length > 0
                ? `${completedTodayCount} of ${habits.length} habits done today`
                : currentLanguage === "hi"
                ? "कोई आदत कॉन्फ़िगर नहीं है।"
                : "No habits tracked yet."}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("habits")}
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <span>{currentLanguage === "hi" ? "सभी आदतें" : "Manage"}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

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
                    ? "bg-slate-950/40 border-amber-500/20"
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
                        ? "bg-amber-500 border-amber-400 text-slate-950 shadow-sm shadow-amber-500/30"
                        : "border-slate-600 hover:border-amber-400 text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <span
                    className={`text-xs font-semibold truncate ${
                      isDoneToday ? "text-slate-300" : "text-white"
                    }`}
                  >
                    {habit.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 shrink-0">
                  <Flame className="w-3 h-3 fill-amber-400" />
                  <span>{habit.streak || 0}d</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center space-y-1.5">
          <p className="text-xs text-slate-400">
            {currentLanguage === "hi"
              ? "दैनिक आदत जोड़ें जैसे '2 घंटे अध्ययन' या 'रिवीजन'।"
              : "Build daily discipline like 'Read NCERT' or '2h Deep Focus'."}
          </p>
          <button
            onClick={() => onNavigate("habits")}
            className="text-xs text-amber-400 font-bold hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>{currentLanguage === "hi" ? "नई आदत बनाएं" : "Create Habit"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
