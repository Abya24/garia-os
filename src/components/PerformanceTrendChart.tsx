import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Calendar, Info } from "lucide-react";
import { ExamTestRecord } from "../types";

interface PerformanceTrendChartProps {
  tests: ExamTestRecord[];
}

export const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({ tests }) => {
  const [timeFilter, setTimeFilter] = useState<"7tests" | "30days" | "3months" | "all">("all");

  if (!tests || tests.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-bold text-slate-200">No exam data yet.</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Log your first test performance to visualize score trends over time and unlock AI analytics.
        </p>
      </div>
    );
  }

  // Filter tests based on selected filter
  const now = new Date();
  const sortedTests = [...tests].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt
  );

  let filteredTests = sortedTests;

  if (timeFilter === "7tests") {
    filteredTests = sortedTests.slice(-7);
  } else if (timeFilter === "30days") {
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filteredTests = sortedTests.filter((t) => new Date(t.date) >= cutoff);
  } else if (timeFilter === "3months") {
    const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    filteredTests = sortedTests.filter((t) => new Date(t.date) >= cutoff);
  }

  const chartData = filteredTests.map((t) => {
    const pct = t.maxMarks > 0 ? Math.round((t.marksObtained / t.maxMarks) * 100) : 0;
    const correct = t.correctAnswers || 0;
    const incorrect = t.incorrectAnswers || 0;
    const attempted = correct + incorrect;
    const acc = attempted > 0 ? Math.round((correct / attempted) * 100) : pct;

    return {
      date: t.date,
      testName: t.testName,
      subjectName: t.subjectName,
      score: pct,
      accuracy: acc,
      marks: `${t.marksObtained}/${t.maxMarks}`,
    };
  });

  return (
    <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/20 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Performance Score Progression</h3>
          </div>
          <p className="text-xs text-slate-400">
            Real active-profile score trajectory ({chartData.length} test record(s))
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-800 border border-white/10 text-xs self-start sm:self-auto">
          <button
            onClick={() => setTimeFilter("7tests")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              timeFilter === "7tests"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Last 7 Tests
          </button>
          <button
            onClick={() => setTimeFilter("30days")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              timeFilter === "30days"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeFilter("3months")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              timeFilter === "3months"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            3 Months
          </button>
          <button
            onClick={() => setTimeFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              timeFilter === "all"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/30 text-white text-xs space-y-1 shadow-2xl">
                      <p className="font-bold text-emerald-400">{data.testName}</p>
                      <p className="text-slate-300 font-semibold">{data.subjectName}</p>
                      <div className="flex items-center gap-3 pt-1 text-[11px]">
                        <span>Score: <strong className="text-emerald-300">{data.score}%</strong> ({data.marks})</span>
                        <span>Accuracy: <strong className="text-cyan-300">{data.accuracy}%</strong></span>
                      </div>
                      <p className="text-[10px] text-slate-500">{data.date}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              name="Score %"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#scoreGrad)"
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              name="Accuracy %"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#accGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Score Percentage
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Question Accuracy
          </span>
        </div>
        <span className="text-[10px] text-slate-500">Auto-synced with active profile</span>
      </div>
    </div>
  );
};
