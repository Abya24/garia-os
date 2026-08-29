import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  PerformanceIntelligenceData,
  ReadinessTrendPoint,
} from "../../utils/studentPerformanceAnalytics";

interface ReadinessTrendsSectionProps {
  data: PerformanceIntelligenceData;
}

export const ReadinessTrendsSection: React.FC<ReadinessTrendsSectionProps> = ({
  data,
}) => {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  const trendData: ReadinessTrendPoint[] =
    timeframe === "7d"
      ? data.readinessTrends7d
      : timeframe === "30d"
      ? data.readinessTrends30d
      : data.readinessTrends90d;

  const changePct =
    timeframe === "7d"
      ? data.readinessChangePct7d
      : timeframe === "30d"
      ? data.readinessChangePct30d
      : data.readinessChangePct90d;

  const currentScore =
    trendData.length > 0 ? trendData[trendData.length - 1].readinessScore : 75;

  return (
    <div className="space-y-4">
      {/* Header and Timeframe Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white">
              Readiness & Confidence Trends
            </h2>
            <p className="text-xs text-slate-400">
              Longitudinal learning trajectory, readiness curve, and confidence stability
            </p>
          </div>
        </div>

        {/* 7d / 30d / 90d Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setTimeframe("7d")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === "7d"
                ? "bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeframe("30d")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === "30d"
                ? "bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeframe("90d")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === "90d"
                ? "bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* Main Readiness Trend Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6">
        {/* Top Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Current Readiness */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Current Readiness Score
            </span>
            <div className="text-3xl font-extrabold font-mono text-cyan-300">
              {currentScore}%
            </div>
            <div className="text-[11px] text-slate-400">
              Target: 85%+ for distinction
            </div>
          </div>

          {/* Readiness Change % */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Readiness Change ({timeframe})
            </span>
            <div className="text-3xl font-extrabold font-mono flex items-center gap-1.5">
              {changePct >= 0 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-6 h-6" />
                  +{changePct}%
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <TrendingDown className="w-6 h-6" />
                  {changePct}%
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Trajectory over selected window
            </div>
          </div>

          {/* Confidence Trend */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Confidence Trend
            </span>
            <div className="text-xl sm:text-2xl font-extrabold font-heading text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="truncate">{data.confidenceTrend}</span>
            </div>
            <div className="text-[11px] text-indigo-300 font-mono">
              Confidence Index: {data.confidenceScore}/100
            </div>
          </div>
        </div>

        {/* Interactive Responsive Chart */}
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "1rem",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(val: any, name: string) => [
                  `${val}%`,
                  name === "readinessScore" ? "Readiness Score" : "Confidence Index",
                ]}
                labelFormatter={(label) => `Timeline: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="readinessScore"
                name="readinessScore"
                stroke="#06b6d4"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#readinessGrad)"
              />
              <Area
                type="monotone"
                dataKey="confidenceScore"
                name="confidenceScore"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#confidenceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-2 border-t border-white/5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            <span>Readiness Score (%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-b-2 border-purple-400 border-dashed" />
            <span>Confidence Index (%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
