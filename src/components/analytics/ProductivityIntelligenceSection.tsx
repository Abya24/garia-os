import React from "react";
import {
  Brain,
  Calendar,
  Clock,
  Sun,
  Timer,
  Zap,
  Flame,
  Award,
} from "lucide-react";
import { PerformanceIntelligenceData } from "../../utils/studentPerformanceAnalytics";

interface ProductivityIntelligenceSectionProps {
  data: PerformanceIntelligenceData;
}

export const ProductivityIntelligenceSection: React.FC<ProductivityIntelligenceSectionProps> = ({
  data,
}) => {
  const { productivityIntelligence } = data;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white">
              Productivity Intelligence
            </h2>
            <p className="text-xs text-slate-400">
              Chronobiological peak learning times, session durations, and schedule optimization
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Productivity Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Best Study Day */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-300 uppercase tracking-wider text-[10px]">
              Best Study Day
            </span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-heading text-white">
            {productivityIntelligence.bestStudyDay}
          </div>
          <p className="text-xs text-slate-400">
            Peak output: <strong className="text-amber-300 font-mono">{productivityIntelligence.bestStudyDayHours} hrs</strong> logged
          </p>
        </div>

        {/* 2. Best Study Hour */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[10px]">
              Best Study Hour
            </span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-cyan-300 truncate">
            {productivityIntelligence.bestStudyHour}
          </div>
          <p className="text-xs text-slate-400">
            Highest retention and task velocity
          </p>
        </div>

        {/* 3. Longest Focus Session */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-300 uppercase tracking-wider text-[10px]">
              Longest Focus Session
            </span>
            <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
          </div>
          <div className="text-2xl font-black font-heading text-white">
            {productivityIntelligence.longestFocusSessionMinutes} <span className="text-sm font-sans font-normal text-slate-400">mins</span>
          </div>
          <p className="text-xs text-slate-400">
            Uninterrupted deep work record
          </p>
        </div>

        {/* 4. Average Focus Session */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-300 uppercase tracking-wider text-[10px]">
              Average Focus Session
            </span>
            <Timer className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-heading text-white">
            {productivityIntelligence.averageFocusSessionMinutes} <span className="text-sm font-sans font-normal text-slate-400">mins</span>
          </div>
          <p className="text-xs text-slate-400">
            Across {productivityIntelligence.totalFocusSessions} logged sessions
          </p>
        </div>
      </div>

      {/* Most Productive Time Window Breakdown */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Time of Day Productivity Distribution</span>
            </h3>
            <p className="text-xs text-slate-400">
              Optimal window: <strong className="text-amber-300">{productivityIntelligence.mostProductiveTimeWindow}</strong>
            </p>
          </div>
        </div>

        {/* Time Window Progress Bars */}
        <div className="space-y-3 pt-2">
          {productivityIntelligence.timeWindowBreakdown.map((win, idx) => (
            <div key={win.window} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  {win.window}
                </span>
                <span className="font-mono text-slate-400">
                  {win.hours}h ({win.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    idx === 0
                      ? "bg-gradient-to-r from-amber-400 to-amber-500"
                      : idx === 1
                      ? "bg-cyan-400"
                      : idx === 2
                      ? "bg-indigo-400"
                      : "bg-slate-600"
                  }`}
                  style={{ width: `${Math.max(5, win.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
