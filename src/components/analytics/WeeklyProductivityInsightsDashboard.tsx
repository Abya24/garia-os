import React, { useState } from "react";
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  BarChart2,
  Clock,
  Target,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { PerformanceIntelligenceData } from "../../utils/studentPerformanceAnalytics";

interface WeeklyProductivityInsightsDashboardProps {
  data: PerformanceIntelligenceData;
}

export const WeeklyProductivityInsightsDashboard: React.FC<
  WeeklyProductivityInsightsDashboardProps
> = ({ data }) => {
  const [chartType, setChartType] = useState<"composed" | "grouped">("composed");
  const { weeklyProductivityInsights } = data;
  const {
    dailySeries,
    totalHoursStudied,
    weeklyTargetHours,
    totalGoalsMet,
    totalGoalsTarget,
    goalsMetRatePct,
    peakDayLabel,
    peakDayHours,
    peakDayGoalsMet,
    correlationSummary,
  } = weeklyProductivityInsights;

  const dailyTargetRef = dailySeries[0]?.targetStudyHours || 3.5;

  return (
    <section
      id="weekly-productivity-insights-dashboard"
      data-testid="weekly-productivity-insights-dashboard"
      className="space-y-4"
    >
      {/* Section Header & Chart Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white">
              Weekly Productivity Insights
            </h2>
            <p className="text-xs text-slate-400">
              7-day correlation of hours studied versus daily academic goals met
            </p>
          </div>
        </div>

        {/* Interactive Chart Mode Segmented Control */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType("composed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              chartType === "composed"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Dual-Axis Overlay
          </button>
          <button
            type="button"
            onClick={() => setChartType("grouped")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              chartType === "grouped"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Grouped Bars
          </button>
        </div>
      </div>

      {/* Main Dashboard Container */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-6">
        {/* Top 4 Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Hours Studied (7d)</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-white">
              {totalHoursStudied}h{" "}
              <span className="text-xs font-normal text-slate-400">
                / {weeklyTargetHours}h
              </span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono tabular-nums">
              Avg {(totalHoursStudied / 7).toFixed(1)} hrs/day
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Goals Met (7d)</span>
              <Target className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-300">
              {totalGoalsMet}{" "}
              <span className="text-xs font-normal text-slate-400">
                / {totalGoalsTarget}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono tabular-nums">
              {goalsMetRatePct}% weekly target completion
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Goal Completion Rate</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-white">
              {goalsMetRatePct}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${goalsMetRatePct}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Peak Output Day</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-extrabold font-heading text-amber-300 truncate">
              {peakDayLabel}
            </div>
            <div className="text-[11px] text-slate-400 font-mono tabular-nums">
              {peakDayHours}h studied · {peakDayGoalsMet} goals met
            </div>
          </div>
        </div>

        {/* Recharts Hours Studied vs. Goals Met Visualization */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "composed" ? (
              <ComposedChart
                data={dailySeries}
                margin={{ top: 12, right: 12, left: -16, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="weeklyHoursBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="dayShort"
                  stroke="#64748b"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#06b6d4"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  unit="h"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "1rem",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === "Hours Studied") return [`${value} hrs`, name];
                    if (name === "Goals Met") return [`${value} goals`, name];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    const pt = payload?.[0]?.payload;
                    return pt
                      ? `${pt.dayFull} (${pt.date}) — Efficiency: ${pt.efficiencyScore}%`
                      : label;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                />
                <ReferenceLine
                  yAxisId="left"
                  y={dailyTargetRef}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: `Daily Target (${dailyTargetRef}h)`,
                    position: "insideTopLeft",
                    fill: "#fbbf24",
                    fontSize: 10,
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="hoursStudied"
                  name="Hours Studied"
                  fill="url(#weeklyHoursBarGrad)"
                  radius={[8, 8, 0, 0]}
                  barSize={32}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="goalsMet"
                  name="Goals Met"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#0f172a" }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            ) : (
              <BarChart
                data={dailySeries}
                margin={{ top: 12, right: 12, left: -16, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="dayShort"
                  stroke="#64748b"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "1rem",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar
                  dataKey="hoursStudied"
                  name="Hours Studied"
                  fill="#06b6d4"
                  radius={[6, 6, 0, 0]}
                  barSize={22}
                />
                <Bar
                  dataKey="goalsMet"
                  name="Goals Met"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  barSize={22}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Correlation Insight & 7-Day Tabular Summary */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-slate-300 font-medium">{correlationSummary}</span>
          <span className="text-slate-400 font-mono tabular-nums">
            Target: {dailyTargetRef}h/day · {totalGoalsMet} of {totalGoalsTarget} goals met
          </span>
        </div>
      </div>
    </section>
  );
};
