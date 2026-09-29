import React, { useMemo, useState } from "react";
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
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { Habit } from "../types";
import { getTodayString, formatLocalDate } from "../utils/storage";
import { HabitStreakGoalModal } from "../components/HabitStreakGoalModal";
import { SwipeableItemCard } from "../components/SwipeableItemCard";
import {
  HabitWeeklySparkline,
  calculateHabitWeeklySparkline,
} from "../components/HabitWeeklySparkline";

export { HabitWeeklySparkline, calculateHabitWeeklySparkline };

export interface DailyHabitTrendPoint {
  dateStr: string;
  dayShort: string;
  dayFull: string;
  completionPercentage: number;
  rollingAvgPercentage: number;
  completedCheckIns: number;
  possibleCheckIns: number;
  targetPercentage: number;
  isToday: boolean;
}

export interface WeeklyHabitTrendPoint {
  weekNumber: number;
  weekLabel: string;
  shortLabel: string;
  dateRange: string;
  completionPercentage: number;
  completedCheckIns: number;
  possibleCheckIns: number;
  habitsCount: number;
  targetPercentage: number;
  isCurrentWeek: boolean;
}

export interface MonthlyHabitTrendSummary {
  weeks: WeeklyHabitTrendPoint[];
  weeklyDailyPoints: DailyHabitTrendPoint[];
  monthlyDailyPoints: DailyHabitTrendPoint[];
  currentWeekPct: number;
  previousWeekPct: number;
  weeklyDeltaPct: number;
  monthlyAveragePct: number;
  last30DaysPct: number;
  bestWeekPct: number;
  bestWeekLabel: string;
  totalWeeklyCheckIns: number;
  totalWeeklyPossible: number;
  totalMonthlyCheckIns: number;
  totalMonthlyPossible: number;
}

/**
 * Calculates both Weekly (last 7 days daily) and Monthly (last 4 weeks + 30 days daily)
 * habit completion trends for Recharts visualization.
 */
export function calculateMonthlyHabitWeeklyTrends(
  habits: Habit[],
  categoryFilter: string = "all"
): MonthlyHabitTrendSummary {
  const safeHabits = (Array.isArray(habits) ? habits : []).filter((h) => {
    if (!h) return false;
    if (categoryFilter !== "all" && h.category !== categoryFilter) return false;
    return true;
  });

  const habitsCount = safeHabits.length;
  const weeks: WeeklyHabitTrendPoint[] = [];

  // Build 30-day daily points (-29..0)
  const monthlyDailyPoints: DailyHabitTrendPoint[] = [];
  for (let offset = -29; offset <= 0; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dateStr = formatLocalDate(d);
    const isToday = offset === 0;
    const dayShort = isToday
      ? "Today"
      : d.toLocaleDateString("en-US", { weekday: "short" });
    const dayFull = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    let completedOnDay = 0;
    safeHabits.forEach((habit) => {
      if (Array.isArray(habit.completedDates) && habit.completedDates.includes(dateStr)) {
        completedOnDay += 1;
      }
    });

    const completionPercentage =
      habitsCount > 0 ? Math.min(100, Math.round((completedOnDay / habitsCount) * 100)) : 0;

    monthlyDailyPoints.push({
      dateStr,
      dayShort: offset >= -6 ? dayShort : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dayFull,
      completionPercentage,
      rollingAvgPercentage: completionPercentage,
      completedCheckIns: completedOnDay,
      possibleCheckIns: habitsCount,
      targetPercentage: 80,
      isToday,
    });
  }

  // Compute 7-day rolling average across the 30-day series
  monthlyDailyPoints.forEach((pt, idx) => {
    const sliceStart = Math.max(0, idx - 6);
    const windowSlice = monthlyDailyPoints.slice(sliceStart, idx + 1);
    const avg =
      windowSlice.length > 0
        ? Math.round(
            windowSlice.reduce((acc, item) => acc + item.completionPercentage, 0) /
              windowSlice.length
          )
        : 0;
    pt.rollingAvgPercentage = avg;
  });

  // Extract the last 7 days for the Weekly Daily Trend view
  const weeklyDailyPoints: DailyHabitTrendPoint[] = monthlyDailyPoints.slice(-7).map((pt) => {
    const d = new Date(pt.dateStr + "T00:00:00");
    return {
      ...pt,
      dayShort: pt.isToday
        ? "Today"
        : d.toLocaleDateString("en-US", { weekday: "short" }),
    };
  });

  // Build 4 chronological 7-day weeks over the last 28 days
  for (let w = 0; w < 4; w++) {
    const startOffset = -27 + w * 7;
    const endOffset = startOffset + 6;

    const weekDates: string[] = [];
    let startDateObj = new Date();
    let endDateObj = new Date();

    for (let offset = startOffset; offset <= endOffset; offset++) {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      if (offset === startOffset) startDateObj = new Date(d);
      if (offset === endOffset) endDateObj = new Date(d);
      weekDates.push(formatLocalDate(d));
    }

    const startLabel = startDateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endLabel = endDateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    let completedCheckIns = 0;
    safeHabits.forEach((habit) => {
      const completedSet = new Set(
        Array.isArray(habit.completedDates) ? habit.completedDates : []
      );
      weekDates.forEach((dateStr) => {
        if (completedSet.has(dateStr)) {
          completedCheckIns += 1;
        }
      });
    });

    const possibleCheckIns = habitsCount * 7;
    const completionPercentage =
      possibleCheckIns > 0
        ? Math.min(100, Math.round((completedCheckIns / possibleCheckIns) * 100))
        : 0;

    const weekNumber = w + 1;
    const isCurrentWeek = w === 3;

    weeks.push({
      weekNumber,
      weekLabel: isCurrentWeek ? `Week 4 (This Week)` : `Week ${weekNumber}`,
      shortLabel: isCurrentWeek ? `W4 (${startLabel})` : `W${weekNumber} (${startLabel})`,
      dateRange: `${startLabel} – ${endLabel}`,
      completionPercentage,
      completedCheckIns,
      possibleCheckIns,
      habitsCount,
      targetPercentage: 80,
      isCurrentWeek,
    });
  }

  const currentWeekPct = weeks[3]?.completionPercentage ?? 0;
  const previousWeekPct = weeks[2]?.completionPercentage ?? 0;
  const weeklyDeltaPct = currentWeekPct - previousWeekPct;
  const monthlyAveragePct =
    weeks.length > 0
      ? Math.round(
          weeks.reduce((sum, item) => sum + item.completionPercentage, 0) /
            weeks.length
        )
      : 0;

  const last30DaysPct =
    monthlyDailyPoints.length > 0
      ? Math.round(
          monthlyDailyPoints.reduce((sum, item) => sum + item.completionPercentage, 0) /
            monthlyDailyPoints.length
        )
      : 0;

  let bestWeekPct = 0;
  let bestWeekLabel = "Week 1";
  weeks.forEach((wk) => {
    if (wk.completionPercentage >= bestWeekPct) {
      bestWeekPct = wk.completionPercentage;
      bestWeekLabel = wk.weekLabel;
    }
  });

  const totalWeeklyCheckIns = weeklyDailyPoints.reduce(
    (sum, item) => sum + item.completedCheckIns,
    0
  );
  const totalWeeklyPossible = weeklyDailyPoints.reduce(
    (sum, item) => sum + item.possibleCheckIns,
    0
  );

  const totalMonthlyCheckIns = weeks.reduce(
    (sum, item) => sum + item.completedCheckIns,
    0
  );
  const totalMonthlyPossible = weeks.reduce(
    (sum, item) => sum + item.possibleCheckIns,
    0
  );

  return {
    weeks,
    weeklyDailyPoints,
    monthlyDailyPoints,
    currentWeekPct,
    previousWeekPct,
    weeklyDeltaPct,
    monthlyAveragePct,
    last30DaysPct,
    bestWeekPct,
    bestWeekLabel,
    totalWeeklyCheckIns,
    totalWeeklyPossible,
    totalMonthlyCheckIns,
    totalMonthlyPossible,
  };
}

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

  // Trend Visualization Filters & Mode
  const [trendCategoryFilter, setTrendCategoryFilter] = useState<string>("all");
  const [trendChartMode, setTrendChartMode] = useState<"area" | "bar">("area");

  // Streak Goal Modal State
  const [goalModalHabit, setGoalModalHabit] = useState<Habit | null>(null);

  const todayStr = getTodayString();

  const monthlyTrendSummary = useMemo(
    () => calculateMonthlyHabitWeeklyTrends(habits, trendCategoryFilter),
    [habits, trendCategoryFilter]
  );

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
    <div className="space-y-6 pb-4 md:pb-0 animate-in fade-in duration-300 max-w-6xl mx-auto w-full">
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

      {/* Monthly Habit Completion Trend Visualization Chart (Recharts) */}
      <section
        id="habits-monthly-trend-chart"
        aria-label="Weekly Habit Completion Percentage Trend Over Last Month"
        className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-5"
      >
        {/* Header & Category / Chart Mode Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-400 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                Weekly Habit Completion Trend (Last Month)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Weekly completion percentage across your habits over the last 4 weeks (28 days).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Segmented Control */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/90 border border-white/10">
              {(
                [
                  { id: "all", label: "All Habits" },
                  { id: "study", label: "Study" },
                  { id: "health", label: "Health" },
                  { id: "mindset", label: "Mindset" },
                ] as const
              ).map((catItem) => (
                <button
                  key={catItem.id}
                  type="button"
                  onClick={() => setTrendCategoryFilter(catItem.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    trendCategoryFilter === catItem.id
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {catItem.label}
                </button>
              ))}
            </div>

            {/* Chart Style Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/90 border border-white/10">
              <button
                type="button"
                onClick={() => setTrendChartMode("area")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  trendChartMode === "area"
                    ? "bg-white/15 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                <span>Trend Line</span>
              </button>
              <button
                type="button"
                onClick={() => setTrendChartMode("bar")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  trendChartMode === "bar"
                    ? "bg-white/15 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Weekly Bars</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400">This Week Completion</span>
            <div className="flex items-baseline justify-between gap-2">
              <span
                id="habits-current-week-pct"
                className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-rose-400"
              >
                {monthlyTrendSummary.currentWeekPct}%
              </span>
              <span
                className={`text-xs font-mono tabular-nums font-semibold ${
                  monthlyTrendSummary.weeklyDeltaPct >= 0
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {monthlyTrendSummary.weeklyDeltaPct >= 0 ? "+" : ""}
                {monthlyTrendSummary.weeklyDeltaPct}% vs W3
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400">4-Week Monthly Avg</span>
            <div className="flex items-baseline justify-between gap-2">
              <span
                id="habits-monthly-avg-pct"
                className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-white"
              >
                {monthlyTrendSummary.monthlyAveragePct}%
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                Target: 80%
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400">Best Weekly Rate</span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-emerald-400">
                {monthlyTrendSummary.bestWeekPct}%
              </span>
              <span className="text-xs text-slate-400 truncate">
                {monthlyTrendSummary.bestWeekLabel}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400">Monthly Check-ins</span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-amber-300">
                {monthlyTrendSummary.totalMonthlyCheckIns}
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                / {monthlyTrendSummary.totalMonthlyPossible} total
              </span>
            </div>
          </div>
        </div>

        {/* Recharts Weekly Completion Percentage Chart */}
        <div className="h-64 w-full bg-slate-950/70 rounded-2xl p-3 sm:p-4 border border-white/5">
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={180}>
            <ComposedChart
              data={monthlyTrendSummary.weeks}
              margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
            >
              <defs>
                <linearGradient id="habitWeeklyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.06)"
              />
              <XAxis
                dataKey="shortLabel"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(val) => `${val}%`}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const point = payload[0].payload as WeeklyHabitTrendPoint;
                  return (
                    <div className="bg-slate-900/95 border border-rose-500/40 rounded-2xl p-3 shadow-xl text-xs space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-white">{point.weekLabel}</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {point.dateRange}
                        </span>
                      </div>
                      <div className="text-rose-300 font-mono tabular-nums font-bold text-sm">
                        {point.completionPercentage}% Weekly Completion
                      </div>
                      <div className="text-slate-300 font-mono tabular-nums text-[11px]">
                        {point.completedCheckIns} / {point.possibleCheckIns} habit check-ins completed
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={80}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: "80% Goal",
                  position: "insideTopRight",
                  fill: "#10b981",
                  fontSize: 10,
                }}
              />
              {trendChartMode === "bar" ? (
                <Bar
                  dataKey="completionPercentage"
                  name="Weekly Completion %"
                  radius={[8, 8, 2, 2]}
                  maxBarSize={48}
                >
                  {monthlyTrendSummary.weeks.map((entry) => (
                    <Cell
                      key={entry.weekNumber}
                      fill={
                        entry.completionPercentage >= 80
                          ? "#10b981"
                          : entry.isCurrentWeek
                          ? "#f43f5e"
                          : "#fb7185"
                      }
                    />
                  ))}
                </Bar>
              ) : (
                <Area
                  type="monotone"
                  dataKey="completionPercentage"
                  name="Weekly Completion %"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fill="url(#habitWeeklyAreaGrad)"
                  activeDot={{ r: 6, fill: "#f43f5e", stroke: "#ffffff", strokeWidth: 2 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="completionPercentage"
                stroke="#fda4af"
                strokeWidth={2}
                dot={{ r: 4, fill: "#f43f5e", stroke: "#0f172a", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 4-Week Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {monthlyTrendSummary.weeks.map((wk) => (
            <div
              key={wk.weekNumber}
              className={`p-3 rounded-2xl border flex flex-col justify-between gap-1 ${
                wk.isCurrentWeek
                  ? "bg-rose-500/10 border-rose-500/40 text-white"
                  : "bg-slate-950/60 border-white/5 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold truncate">{wk.weekLabel}</span>
                <span className="font-mono tabular-nums font-bold text-rose-300">
                  {wk.completionPercentage}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    wk.completionPercentage >= 80
                      ? "bg-emerald-400"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.max(4, wk.completionPercentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                <span>{wk.dateRange}</span>
                <span>
                  {wk.completedCheckIns}/{wk.possibleCheckIns}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

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

                  {/* Weekly 7-Day Consistency Sparkline Chart */}
                  <HabitWeeklySparkline
                    habit={habit}
                    onToggleDate={(dateStr) => onToggleHabitDate(habit.id, dateStr)}
                  />

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

export const HabitTracker = HabitsPage;
export default HabitsPage;

