import React, { useMemo } from "react";
import { Activity, TrendingUp, CheckCircle2 } from "lucide-react";
import { Habit } from "../types";
import { formatLocalDate, getTodayString } from "../utils/storage";

export interface HabitSparklineDayPoint {
  dayIndex: number;
  dateStr: string;
  dayLabel: string;
  shortLabel: string;
  isToday: boolean;
  completed: boolean;
  dailyValue: number; // 100 if completed, 0 if missed
  rollingConsistencyPct: number; // 0..100 rolling consistency across the 7-day window
  sparklineScore: number; // 15..100 visual height score for smooth sparkline curve
}

export interface HabitWeeklySparklineSummary {
  habitId: string;
  points: HabitSparklineDayPoint[];
  completedDaysCount: number;
  totalDays: number;
  consistencyPct: number;
  currentRunInWeek: number;
  statusLabel: "Excellent" | "Steady" | "Building" | "Needs Focus";
}

/**
 * Computes the last 7 chronological days of completion data and consistency sparkline coordinates for a habit.
 */
export function calculateHabitWeeklySparkline(
  habit: Habit,
  referenceDate: Date = new Date()
): HabitWeeklySparklineSummary {
  const completedSet = new Set(
    Array.isArray(habit?.completedDates) ? habit.completedDates : []
  );
  const todayStr = getTodayString();
  const points: HabitSparklineDayPoint[] = [];

  let cumulativeCompleted = 0;

  // Chronological last 7 days: i = 6 (6 days ago) down to i = 0 (today)
  for (let idx = 0; idx < 7; idx++) {
    const daysAgo = 6 - idx;
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = formatLocalDate(d);
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    const shortLabel = d.toLocaleDateString("en-US", { weekday: "narrow" });
    const completed = completedSet.has(dateStr);

    if (completed) {
      cumulativeCompleted += 1;
    }

    const rollingConsistencyPct = Math.round(
      (cumulativeCompleted / (idx + 1)) * 100
    );

    // Blend daily completion (65%) and rolling consistency (35%) so the sparkline
    // clearly distinguishes completed days vs missed days while showing upward momentum.
    const rawSparkScore = completed
      ? Math.round(65 + rollingConsistencyPct * 0.35)
      : Math.max(14, Math.round(rollingConsistencyPct * 0.32));

    points.push({
      dayIndex: idx,
      dateStr,
      dayLabel,
      shortLabel,
      isToday: dateStr === todayStr,
      completed,
      dailyValue: completed ? 100 : 0,
      rollingConsistencyPct,
      sparklineScore: Math.min(100, Math.max(14, rawSparkScore)),
    });
  }

  const completedDaysCount = cumulativeCompleted;
  const consistencyPct = Math.round((completedDaysCount / 7) * 100);

  let currentRunInWeek = 0;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].completed) {
      currentRunInWeek += 1;
    } else {
      break;
    }
  }

  const statusLabel: HabitWeeklySparklineSummary["statusLabel"] =
    consistencyPct >= 80
      ? "Excellent"
      : consistencyPct >= 55
      ? "Steady"
      : consistencyPct >= 25
      ? "Building"
      : "Needs Focus";

  return {
    habitId: habit?.id || "habit",
    points,
    completedDaysCount,
    totalDays: 7,
    consistencyPct,
    currentRunInWeek,
    statusLabel,
  };
}

interface HabitWeeklySparklineProps {
  habit: Habit;
  compact?: boolean;
  onToggleDate?: (dateStr: string) => void;
  className?: string;
}

export const HabitWeeklySparkline: React.FC<HabitWeeklySparklineProps> = ({
  habit,
  compact = false,
  onToggleDate,
  className = "",
}) => {
  const summary = useMemo(() => calculateHabitWeeklySparkline(habit), [habit]);

  // SVG coordinate geometry for 7-day sparkline
  const svgWidth = compact ? 168 : 240;
  const svgHeight = compact ? 36 : 48;
  const padX = compact ? 10 : 14;
  const padTop = compact ? 6 : 8;
  const padBottom = compact ? 6 : 8;
  const usableWidth = svgWidth - padX * 2;
  const usableHeight = svgHeight - padTop - padBottom;

  const coords = summary.points.map((pt, idx) => {
    const x = padX + (idx / 6) * usableWidth;
    const normalized = (pt.sparklineScore - 10) / 90;
    const y =
      padTop + usableHeight - Math.max(0, Math.min(1, normalized)) * usableHeight;
    return { x, y, pt };
  });

  // Build SVG path strings for line and area
  const linePath = coords
    .map((c, idx) => `${idx === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const baselineY = svgHeight - 2;
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${baselineY} L ${coords[0].x.toFixed(1)} ${baselineY} Z`
      : "";

  const isHighConsistency = summary.consistencyPct >= 70;
  const strokeColor = isHighConsistency
    ? "#10b981"
    : summary.consistencyPct >= 40
    ? "#f43f5e"
    : "#f59e0b";

  const gradientId = `habit-spark-grad-${(habit.id || "default").replace(/[^a-zA-Z0-9_-]/g, "")}-${compact ? "c" : "f"}`;

  if (compact) {
    return (
      <div
        data-testid="habit-weekly-sparkline"
        data-habit-id={habit.id}
        data-weekly-consistency={summary.consistencyPct}
        className={`habit-weekly-sparkline flex items-center justify-between gap-2.5 pt-1.5 border-t border-white/5 ${className}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-[10px] text-slate-400 font-mono tabular-nums truncate">
            7d: <strong className="text-slate-200">{summary.completedDaysCount}/7</strong> ({summary.consistencyPct}%)
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="recharts-surface habit-sparkline-svg w-28 h-7 overflow-visible"
            role="img"
            aria-label={`7-day consistency sparkline for ${habit.title}: ${summary.consistencyPct}%`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.38} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* Area under sparkline */}
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              className="habit-sparkline-area"
            />

            {/* 7-Day Sparkline Curve */}
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="recharts-curve habit-sparkline-line"
            />

            {/* 7 Daily Nodes */}
            {coords.map(({ x, y, pt }) => (
              <g
                key={pt.dateStr}
                onClick={(e) => {
                  if (onToggleDate) {
                    e.stopPropagation();
                    onToggleDate(pt.dateStr);
                  }
                }}
                className={onToggleDate ? "cursor-pointer" : ""}
              >
                <title>{`${pt.dayLabel} (${pt.dateStr}): ${pt.completed ? "Completed" : "Missed"}`}</title>
                <circle
                  cx={x}
                  cy={y}
                  r={pt.completed ? 3 : 2.2}
                  fill={pt.completed ? strokeColor : "#1e293b"}
                  stroke={pt.completed ? "#ffffff" : "#64748b"}
                  strokeWidth={1.2}
                  className="habit-sparkline-dot"
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`habit-sparkline-${habit.id}`}
      data-testid="habit-weekly-sparkline"
      data-habit-id={habit.id}
      data-weekly-consistency={summary.consistencyPct}
      className={`habit-weekly-sparkline p-3.5 rounded-2xl bg-slate-950/75 border border-white/10 space-y-2.5 ${className}`}
    >
      {/* Top Info Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-heading">
                Weekly Consistency Sparkline (Last 7 Days)
              </span>
              <span className="text-[11px] text-slate-400">·</span>
              <span
                className={`text-[11px] font-mono font-semibold ${
                  isHighConsistency
                    ? "text-emerald-400"
                    : summary.consistencyPct >= 40
                    ? "text-rose-300"
                    : "text-amber-300"
                }`}
              >
                {summary.statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
          <span className="text-slate-300">
            <strong className="text-white">{summary.completedDaysCount}</strong>/7 days
          </span>
          <span className="text-slate-600">·</span>
          <span
            className={`font-extrabold ${
              isHighConsistency ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {summary.consistencyPct}%
          </span>
        </div>
      </div>

      {/* Sparkline Graphic + 7-Day Mini Consistency Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-900/70 rounded-xl p-2.5 border border-white/5">
        {/* SVG Sparkline Curve (7 cols) */}
        <div className="sm:col-span-7 w-full">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="recharts-surface habit-sparkline-svg w-full h-12 overflow-visible"
            role="img"
            aria-label={`Weekly 7-day consistency sparkline for ${habit.title}: ${summary.completedDaysCount} of 7 days (${summary.consistencyPct}%)`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.42} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* Horizontal reference guide line at 80% */}
            <line
              x1={padX}
              y1={padTop + usableHeight * 0.2}
              x2={svgWidth - padX}
              y2={padTop + usableHeight * 0.2}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 3"
              strokeWidth={1}
            />

            {/* Subtle daily vertical guide stems */}
            {coords.map(({ x, y, pt }) => (
              <line
                key={`stem-${pt.dateStr}`}
                x1={x}
                y1={y}
                x2={x}
                y2={baselineY}
                stroke={
                  pt.completed
                    ? "rgba(244,63,94,0.25)"
                    : "rgba(148,163,184,0.08)"
                }
                strokeWidth={pt.completed ? 2 : 1}
              />
            ))}

            {/* Area fill under sparkline */}
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              className="habit-sparkline-area"
            />

            {/* Primary Sparkline Curve */}
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="recharts-curve habit-sparkline-line"
            />

            {/* Interactive 7-Day Sparkline Points */}
            {coords.map(({ x, y, pt }) => (
              <g
                key={pt.dateStr}
                onClick={() => onToggleDate && onToggleDate(pt.dateStr)}
                className={onToggleDate ? "cursor-pointer" : ""}
              >
                <title>{`${pt.dayLabel} (${pt.dateStr}): ${
                  pt.completed ? "Completed" : "Not Completed"
                } — Rolling 7d Consistency: ${pt.rollingConsistencyPct}%`}</title>
                <circle
                  cx={x}
                  cy={y}
                  r={pt.completed ? 4 : 3}
                  fill={pt.completed ? strokeColor : "#0f172a"}
                  stroke={pt.completed ? "#ffffff" : "#64748b"}
                  strokeWidth={1.5}
                  className="habit-sparkline-dot transition-transform hover:scale-125"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* 7-Day Daily Pulse Columns (5 cols) */}
        <div className="sm:col-span-5 grid grid-cols-7 gap-1 items-end pt-1 sm:pt-0">
          {summary.points.map((pt) => (
            <button
              key={pt.dateStr}
              type="button"
              onClick={() => onToggleDate && onToggleDate(pt.dateStr)}
              title={`${pt.dayLabel} (${pt.dateStr}): ${
                pt.completed ? "Completed (Click to toggle)" : "Missed (Click to mark complete)"
              }`}
              className="flex flex-col items-center gap-1 group cursor-pointer focus:outline-none"
            >
              <div className="w-full h-7 bg-slate-950/90 rounded-md p-0.5 flex items-end justify-center border border-white/5 group-hover:border-rose-500/40 transition-colors">
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${
                    pt.completed
                      ? isHighConsistency
                        ? "bg-emerald-400 h-full shadow-sm"
                        : "bg-rose-500 h-full shadow-sm"
                      : pt.isToday
                      ? "bg-amber-400/40 h-2"
                      : "bg-slate-800 h-1.5"
                  }`}
                />
              </div>
              <span
                className={`text-[9px] font-mono uppercase leading-none ${
                  pt.completed
                    ? "text-white font-bold"
                    : pt.isToday
                    ? "text-amber-300 font-bold"
                    : "text-slate-500"
                }`}
              >
                {pt.shortLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
