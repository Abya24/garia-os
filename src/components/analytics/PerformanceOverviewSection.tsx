import React from "react";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Flame,
  Award,
  Zap,
  Activity,
} from "lucide-react";
import { PerformanceIntelligenceData } from "../../utils/studentPerformanceAnalytics";

interface PerformanceOverviewSectionProps {
  data: PerformanceIntelligenceData;
}

export const PerformanceOverviewSection: React.FC<PerformanceOverviewSectionProps> = ({
  data,
}) => {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white">
              Performance Overview
            </h2>
            <p className="text-xs text-slate-400">
              High-level study volume, execution rate, and dynamic productivity metrics
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-mono font-semibold text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Score: {data.currentProductivityScore}%</span>
        </div>
      </div>

      {/* Grid of Key Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Weekly Study Hours */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-cyan-500/30 space-y-2 relative overflow-hidden shadow-lg shadow-cyan-500/5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[10px]">
              Weekly Study
            </span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {data.weeklyStudyHours} <span className="text-sm font-sans font-normal text-slate-400">hrs</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            {data.weeklyStudyHoursTrendDelta >= 0 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                +{data.weeklyStudyHoursTrendDelta}%
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {data.weeklyStudyHoursTrendDelta}%
              </span>
            )}
            <span className="text-slate-400">vs prev 7 days</span>
          </div>
        </div>

        {/* 2. Monthly Study Hours */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-indigo-500/30 space-y-2 relative overflow-hidden shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-300 uppercase tracking-wider text-[10px]">
              Monthly Study
            </span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {data.monthlyStudyHours} <span className="text-sm font-sans font-normal text-slate-400">hrs</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            {data.monthlyStudyHoursTrendDelta >= 0 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                +{data.monthlyStudyHoursTrendDelta}%
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {data.monthlyStudyHoursTrendDelta}%
              </span>
            )}
            <span className="text-slate-400">vs prev 30 days</span>
          </div>
        </div>

        {/* 3. Productivity Score Trend */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-emerald-500/30 space-y-2 relative overflow-hidden shadow-lg shadow-emerald-500/5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-300 uppercase tracking-wider text-[10px]">
              Productivity Trend
            </span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300">
              {data.currentProductivityScore}%
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">7-Day Spark</span>
          </div>
          {/* Mini Sparkline Bars */}
          <div className="flex items-end gap-1.5 h-6 pt-1">
            {data.productivityScoreTrend.map((pt, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end" title={`${pt.date}: ${pt.score}%`}>
                <div
                  className="w-full rounded-sm bg-emerald-400/70 transition-all hover:bg-emerald-300"
                  style={{ height: `${Math.max(15, (pt.score / 100) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 4. Task Completion Rate */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-purple-500/30 space-y-2 relative overflow-hidden shadow-lg shadow-purple-500/5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-300 uppercase tracking-wider text-[10px]">
              Task Completion
            </span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {data.taskCompletionRatePct}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${data.taskCompletionRatePct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {data.completedTasks} / {data.totalTasks} completed
          </div>
        </div>

        {/* 5. Habit Consistency Score */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-rose-500/30 space-y-2 relative overflow-hidden shadow-lg shadow-rose-500/5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-rose-300 uppercase tracking-wider text-[10px]">
              Habit Consistency
            </span>
            <Flame className="w-4 h-4 text-rose-400 fill-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-300">
            {data.habitConsistencyScorePct}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${data.habitConsistencyScorePct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {data.activeHabitStreak}d peak streak
          </div>
        </div>
      </div>
    </div>
  );
};
